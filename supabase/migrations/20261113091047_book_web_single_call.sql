-- Запись с сайта одним вызовом. Edge-функция book делала ~8 последовательных
-- запросов к базе (мастер, услуга, проверка слота, счётчик дня, клиент, лимит,
-- вставка, токен отмены) — запись занимала 4–6 секунд. Здесь всё то же самое
-- в одной транзакции: один сетевой круг вместо восьми.
create or replace function public.book_web(
  p_slug text, p_service_id text, p_date text, p_start_time text,
  p_name text, p_phone text, p_comment text, p_now timestamptz default now()
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_master uuid;
  v_dur int := 60;
  v_price numeric := 0;
  v_svc_name text := 'Запись с сайта';
  v_svc_id text := null;
  v_start int := public.hhmm_to_min(p_start_time);
  v_err text;
  v_digits text := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
  v_client text;
  v_new_client boolean := false;
  v_appt text := 'web-' || gen_random_uuid()::text;
  v_token text := gen_random_uuid()::text;
  v_res text;
  v_end int;
begin
  select id into v_master from public.profiles where slug = p_slug and published;
  if v_master is null then return jsonb_build_object('status', 'master_not_found'); end if;

  if coalesce(p_service_id, '') <> '' then
    select id, coalesce(nullif(duration, 0), 60), coalesce(price, 0), name
      into v_svc_id, v_dur, v_price, v_svc_name
      from public.services
     where id = p_service_id and user_id = v_master and deleted_at is null;
    if v_svc_id is null then return jsonb_build_object('status', 'service_not_found'); end if;
  end if;

  v_err := public.booking_slot_error(v_master, p_date, v_start, v_dur, p_now);
  if v_err is not null then return jsonb_build_object('status', v_err); end if;

  -- Анти-абуз: не больше 40 записей мастеру в день.
  if (select count(*) from public.appointments
       where user_id = v_master and date = p_date and deleted_at is null and status <> 'cancelled') >= 40 then
    return jsonb_build_object('status', 'day_full');
  end if;

  -- Клиент по цифрам телефона (индекс idx_clients_user_phone).
  select id into v_client from public.clients
   where user_id = v_master and phone_digits = v_digits and deleted_at is null
   limit 1;
  if v_client is not null then
    -- Один номер — не больше 3 заявок с сайта за сутки.
    if (select count(*) from public.appointments
         where user_id = v_master and client_id = v_client and id like 'web-%'
           and status <> 'cancelled' and created_at >= p_now - interval '1 day') >= 3 then
      return jsonb_build_object('status', 'too_many');
    end if;
  else
    v_client := 'web-' || gen_random_uuid()::text;
    v_new_client := true;
    insert into public.clients (id, user_id, name, phone, notes, created_at, updated_at)
    values (v_client, v_master, p_name, p_phone, 'Добавлен через онлайн-запись с сайта', p_now, p_now);
  end if;

  -- Те же правила ещё раз под локом мастера на дату + вставка.
  v_res := public.book_appointment_v2(
    v_appt, v_master, v_client, v_svc_id, p_date, p_start_time, v_dur, v_price,
    '🌐 Онлайн-запись с сайта' || E'\nКлиент: ' || p_name || E'\nТелефон: ' || p_phone
      || E'\nУслуга: ' || v_svc_name
      || case when coalesce(p_comment, '') <> '' then E'\nКомментарий: ' || p_comment else '' end,
    p_now);
  if v_res <> 'ok' then
    -- Не оставляем «пустого» клиента от сорвавшейся записи.
    if v_new_client then delete from public.clients where id = v_client; end if;
    return jsonb_build_object('status', v_res);
  end if;

  update public.appointments set cancel_token = v_token where id = v_appt;
  v_end := v_start + v_dur;
  return jsonb_build_object(
    'status', 'ok', 'master_id', v_master, 'id', v_appt, 'cancel_token', v_token,
    'date', p_date, 'start_time', p_start_time,
    'end_time', lpad((v_end / 60)::text, 2, '0') || ':' || lpad((v_end % 60)::text, 2, '0'),
    'service', v_svc_name);
end $$;

revoke all on function public.book_web(text, text, text, text, text, text, text, timestamptz) from public, anon, authenticated;
