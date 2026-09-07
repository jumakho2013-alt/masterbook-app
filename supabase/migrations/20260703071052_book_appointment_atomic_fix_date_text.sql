-- appointments.date хранится как TEXT ('YYYY-MM-DD'), а не date → параметрp_date
-- должен быть text, иначе a.date = p_date падает (text = date). Пересоздаём.
drop function if exists public.book_appointment(text, uuid, text, text, date, text, text, numeric, text, timestamptz);

create or replace function public.book_appointment(
  p_id text, p_user_id uuid, p_client_id text, p_service_id text,
  p_date text, p_start_time text, p_end_time text,
  p_price numeric, p_notes text, p_now timestamptz
) returns text
language plpgsql security definer set search_path to 'public' as $$
declare
  v_start int := split_part(p_start_time, ':', 1)::int * 60 + split_part(p_start_time, ':', 2)::int;
  v_end   int := split_part(p_end_time,   ':', 1)::int * 60 + split_part(p_end_time,   ':', 2)::int;
  v_taken boolean;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text || '|' || p_date, 0));
  select exists(
    select 1 from public.appointments a
    where a.user_id = p_user_id and a.date = p_date
      and a.deleted_at is null and a.status <> 'cancelled'
      and (split_part(a.start_time, ':', 1)::int * 60 + split_part(a.start_time, ':', 2)::int) < v_end
      and v_start < (split_part(a.end_time, ':', 1)::int * 60 + split_part(a.end_time, ':', 2)::int)
  ) into v_taken;
  if v_taken then return 'slot_taken'; end if;

  insert into public.appointments
    (id, user_id, client_id, service_id, date, start_time, end_time, status, price, notes, created_at, updated_at)
  values
    (p_id, p_user_id, p_client_id, p_service_id, p_date, p_start_time, p_end_time, 'scheduled', p_price, p_notes, p_now, p_now);
  return 'ok';
end $$;

revoke all on function public.book_appointment(text, uuid, text, text, text, text, text, numeric, text, timestamptz) from public, anon, authenticated;
grant execute on function public.book_appointment(text, uuid, text, text, text, text, text, numeric, text, timestamptz) to service_role;
