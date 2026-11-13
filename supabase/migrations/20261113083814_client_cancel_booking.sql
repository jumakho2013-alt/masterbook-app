-- Отмена записи самим клиентом. Раньше у клиента не было никакого способа
-- отменить запись с сайта: он просто не приходил, а мастер держал пустое окно.
-- Секретный токен выдаётся клиенту в ответе на запись (и хранится в его
-- браузере); по нему — и только по нему — запись можно отменить.
alter table public.appointments add column if not exists cancel_token text;

create or replace function public.cancel_booking_by_client(p_id text, p_token text, p_now timestamptz default now())
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  a public.appointments%rowtype;
  v_city text;
  v_local timestamp;
begin
  if coalesce(p_id, '') = '' or coalesce(p_token, '') = '' then
    return jsonb_build_object('status', 'not_found');
  end if;
  select * into a from public.appointments
   where id = p_id and cancel_token = p_token and deleted_at is null
   for update;
  if not found then return jsonb_build_object('status', 'not_found'); end if;
  if a.status = 'cancelled' then return jsonb_build_object('status', 'already'); end if;
  if a.status <> 'scheduled' then return jsonb_build_object('status', 'not_cancellable'); end if;

  select city into v_city from public.profiles where id = a.user_id;
  v_local := (p_now at time zone 'UTC') + make_interval(mins => public.city_utc_offset_min(v_city));
  if a.date::date < v_local::date
     or (a.date::date = v_local::date
         and public.hhmm_to_min(a.start_time) <= extract(hour from v_local)::int * 60 + extract(minute from v_local)::int) then
    return jsonb_build_object('status', 'too_late');
  end if;

  update public.appointments
     set status = 'cancelled',
         updated_at = p_now,
         notes = coalesce(notes, '') || E'\n❌ Клиент отменил запись через сайт'
   where id = a.id;
  return jsonb_build_object('status', 'ok', 'user_id', a.user_id, 'date', a.date, 'start_time', a.start_time);
end $$;

revoke all on function public.cancel_booking_by_client(text, text, timestamptz) from public, anon, authenticated;
