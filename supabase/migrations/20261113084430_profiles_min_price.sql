-- Минимальная цена мастера — для сортировки «Дешевле» в каталоге. Раньше
-- каталог мог сортировать только по премиуму и рейтингу (а отзывов нет), хотя
-- цена — первое, на что смотрит клиент. Держим в профиле: сортировать по
-- агрегату из другой таблицы PostgREST не умеет.
alter table public.profiles add column if not exists min_price numeric;

create or replace function public.recalc_min_price(p_user uuid)
returns void language sql security definer set search_path = public as $$
  update public.profiles p
     set min_price = (select min(s.price) from public.services s
                       where s.user_id = p_user and s.deleted_at is null and s.price > 0)
   where p.id = p_user;
$$;

create or replace function public.on_service_change_min_price()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op in ('INSERT', 'UPDATE') then perform public.recalc_min_price(new.user_id); end if;
  if tg_op in ('UPDATE', 'DELETE') and (tg_op = 'DELETE' or old.user_id is distinct from new.user_id) then
    perform public.recalc_min_price(old.user_id);
  end if;
  return null;
end $$;

drop trigger if exists trg_services_min_price on public.services;
create trigger trg_services_min_price
  after insert or update of price, deleted_at, user_id or delete on public.services
  for each row execute function public.on_service_change_min_price();

revoke all on function public.recalc_min_price(uuid) from public, anon, authenticated;
revoke all on function public.on_service_change_min_price() from public, anon, authenticated;

-- Читать можно всем (как остальной публичный профиль); писать — только триггеру.
grant select (min_price) on public.profiles to anon, authenticated;

-- Заполнить для уже существующих мастеров.
update public.profiles p
   set min_price = (select min(s.price) from public.services s
                     where s.user_id = p.id and s.deleted_at is null and s.price > 0);
