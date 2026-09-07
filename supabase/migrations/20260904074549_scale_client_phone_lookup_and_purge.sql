-- 1) Поиск клиента по телефону при онлайн-записи.
--    Было: edge-функция тянула ВСЕХ клиентов мастера (при 5000 клиентов —
--    ~450 КБ и ~50-150 мс на КАЖДУЮ бронь) и матчила телефон в JS.
--    Стало: нормализованная генерируемая колонка + индекс → 1 строка, <1 мс.
alter table public.clients
  add column if not exists phone_digits text
  generated always as (regexp_replace(coalesce(phone, ''), '\D', '', 'g')) stored;

create index if not exists idx_clients_user_phone
  on public.clients (user_id, phone_digits)
  where deleted_at is null;

-- Клиент не должен уметь писать в генерируемую колонку (её считает БД).
-- Явно перечисляем то, что пишет приложение (cloudSync.pushAll → upsert clients).
revoke insert, update on public.clients from anon, authenticated;
grant insert (id, user_id, name, phone, notes, tags, address, preferences,
              birthday, debt, photo_uri, created_at, updated_at, deleted_at)
  on public.clients to authenticated;
grant update (name, phone, notes, tags, address, preferences,
              birthday, debt, photo_uri, updated_at, deleted_at)
  on public.clients to authenticated;

-- 2) Серверные tombstones не чистились никогда: мастер, удавший за годы
--    5000 клиентов, качал 5000 мёртвых строк при каждом восстановлении.
--    Через 90 дней ни одно устройство уже не может «воскресить» запись,
--    поэтому их безопасно удалять физически.
create or replace function public.purge_old_tombstones()
returns void language plpgsql security definer set search_path to 'public' as $$
begin
  delete from clients         where deleted_at is not null and deleted_at < now() - interval '90 days';
  delete from appointments    where deleted_at is not null and deleted_at < now() - interval '90 days';
  delete from services        where deleted_at is not null and deleted_at < now() - interval '90 days';
  delete from finance_entries where deleted_at is not null and deleted_at < now() - interval '90 days';
end $$;

revoke execute on function public.purge_old_tombstones() from public, anon, authenticated;

select cron.unschedule('purge-tombstones')
where exists (select 1 from cron.job where jobname = 'purge-tombstones');

select cron.schedule('purge-tombstones', '30 3 * * *',
  $$select public.purge_old_tombstones()$$);
