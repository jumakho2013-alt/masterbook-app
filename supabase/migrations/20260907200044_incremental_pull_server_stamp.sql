-- Серверная отметка времени для инкрементальной выгрузки.
--
-- Задача: приложение при каждом syncNow тянет ВСЕ строки пользователя. У мастера
-- с 4000 записей это ~1.5 МБ вниз при каждом возврате из фона.
--
-- Почему нельзя фильтровать по updated_at: её ставит КЛИЕНТ (триггеров на этих
-- таблицах нет, значение приходит из приложения). Устройство с убежавшими вперёд
-- часами запишет строку с будущим временем; другое устройство поднимет по ней
-- свой водяной знак и после этого НАВСЕГДА перестанет видеть строки, записанные
-- с правильными часами. Тихая потеря данных, которую невозможно заметить.
--
-- Поэтому отдельная колонка, которую ставит только сервер. updated_at остаётся
-- как есть — на нём держится разрешение конфликтов last-write-wins, менять его
-- семантику нельзя.

create or replace function public.stamp_server_updated_at()
returns trigger language plpgsql as $$
begin
  new.server_updated_at := now();
  return new;
end $$;

do $$
declare t text;
begin
  foreach t in array array['clients','services','appointments','finance_entries'] loop
    execute format(
      'alter table public.%I add column if not exists server_updated_at timestamptz not null default now()', t);

    -- BEFORE-триггер ставит значение безусловно, поэтому даже если у клиента
    -- есть право писать в колонку, его значение затирается серверным.
    execute format('drop trigger if exists %I on public.%I', t || '_stamp_server_updated_at', t);
    execute format(
      'create trigger %I before insert or update on public.%I
         for each row execute function public.stamp_server_updated_at()',
      t || '_stamp_server_updated_at', t);

    -- Под выборку «моё, изменённое после отметки».
    execute format(
      'create index if not exists %I on public.%I (user_id, server_updated_at)',
      'idx_' || t || '_user_server_updated', t);
  end loop;
end $$;

-- Клиент не должен писать в эту колонку явно. У clients гранты колоночные —
-- новая колонка в список не входит, значит уже закрыта. Остальным трём таблицам
-- права выданы на таблицу целиком; триггер всё равно перебивает значение, но
-- отзываем явно, чтобы намерение было видно из схемы.
revoke insert (server_updated_at), update (server_updated_at)
  on public.services from anon, authenticated;
revoke insert (server_updated_at), update (server_updated_at)
  on public.appointments from anon, authenticated;
revoke insert (server_updated_at), update (server_updated_at)
  on public.finance_entries from anon, authenticated;
