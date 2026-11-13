-- Правила онлайн-записи — в одном месте, в базе.
--
-- Раньше их проверяла только edge-функция book, а форма на сайте строила слоты
-- по одним рабочим часам: клиент видел занятое время и перерыв как свободные и
-- узнавал «занято» только после отправки. Буфер между записями не учитывался
-- нигде, часовой пояс был зашит UTC+5 для всех городов, а закрыть дату или
-- поставить запись на паузу мастер не мог вовсе.
--
-- booking_slot_error() — единственный источник правды. Ей пользуются и
-- available_slots() (что показать клиенту), и book_appointment_v2() (что
-- разрешить записать — повторно, под advisory-локом, против гонки).

-- Пауза записи и закрытые даты ('YYYY-MM-DD').
alter table public.profiles add column if not exists booking_paused boolean not null default false;
alter table public.profiles add column if not exists closed_dates text[] not null default '{}';
-- Колоночные гранты: без них новые поля невидимы, а upsert профиля из
-- приложения падает целиком (см. memory: postgrest-upsert-vs-column-grants).
grant select (booking_paused, closed_dates) on public.profiles to anon, authenticated;
grant insert (booking_paused, closed_dates), update (booking_paused, closed_dates) on public.profiles to authenticated;

create or replace function public.hhmm_to_min(t text)
returns int language sql immutable set search_path = public as $$
  select case
    when t ~ '^\d{2}:\d{2}$' and split_part(t, ':', 1)::int < 24 and split_part(t, ':', 2)::int < 60
    then split_part(t, ':', 1)::int * 60 + split_part(t, ':', 2)::int
  end
$$;

-- Смещение от UTC в минутах по городу мастера. Таджикистан, Узбекистан,
-- Казахстан (с 2024 единый), Урал — UTC+5; остальные явно.
create or replace function public.city_utc_offset_min(p_city text)
returns int language sql immutable set search_path = public as $$
  select case lower(replace(trim(coalesce(p_city, '')), 'ё', 'е'))
    when 'москва' then 180 when 'санкт-петербург' then 180 when 'казань' then 180
    when 'нижний новгород' then 180 when 'краснодар' then 180 when 'ростов-на-дону' then 180
    when 'воронеж' then 180 when 'волгоград' then 180 when 'сочи' then 180
    when 'самара' then 240
    when 'новосибирск' then 420 when 'красноярск' then 420
    when 'бишкек' then 360 when 'ош' then 360 when 'джалал-абад' then 360
    when 'каракол' then 360 when 'токмок' then 360 when 'узген' then 360
    else 300
  end
$$;

-- null — слот можно занять; иначе код причины (тот же, что видит сайт).
create or replace function public.booking_slot_error(
  p_master_id uuid, p_date text, p_start int, p_duration int, p_now timestamptz default now()
) returns text language plpgsql stable security definer set search_path = public as $$
declare
  m public.profiles%rowtype;
  v_day date;
  v_local timestamp;
  v_end int := p_start + p_duration;
  v_bs int;
  v_be int;
  v_buf int;
begin
  select * into m from public.profiles where id = p_master_id and published;
  if not found then return 'master_not_found'; end if;
  if p_date is null or p_date !~ '^\d{4}-\d{2}-\d{2}$' then return 'date_invalid'; end if;
  begin
    v_day := p_date::date;
  exception when others then
    return 'date_invalid';
  end;
  if p_start is null or p_duration is null or p_duration <= 0 or p_start < 0 or v_end > 1440 then
    return 'time_invalid';
  end if;

  v_local := (p_now at time zone 'UTC') + make_interval(mins => public.city_utc_offset_min(m.city));
  if v_day < v_local::date then return 'date_past'; end if;
  if v_day > v_local::date + 366 then return 'date_far'; end if;
  if m.booking_paused then return 'paused'; end if;
  if p_date = any(m.closed_dates) then return 'closed'; end if;
  if coalesce(array_length(m.work_days, 1), 0) > 0
     and not (extract(dow from v_day)::int = any(m.work_days)) then
    return 'day_off';
  end if;
  if v_day = v_local::date
     and p_start < extract(hour from v_local)::int * 60 + extract(minute from v_local)::int then
    return 'time_past';
  end if;
  if public.hhmm_to_min(m.work_hours_start) is not null and p_start < public.hhmm_to_min(m.work_hours_start) then
    return 'before_hours';
  end if;
  if public.hhmm_to_min(m.work_hours_end) is not null and v_end > public.hhmm_to_min(m.work_hours_end) then
    return 'after_hours';
  end if;
  if coalesce(m.break_enabled, false) then
    v_bs := public.hhmm_to_min(m.break_start);
    v_be := public.hhmm_to_min(m.break_end);
    if v_bs is not null and v_be > v_bs and p_start < v_be and v_bs < v_end then
      return 'break_time';
    end if;
  end if;

  -- Буфер — зазор между записями с обеих сторон, как в приложении (new.tsx).
  v_buf := greatest(coalesce(m.buffer_minutes, 0), 0);
  if exists (
    select 1 from public.appointments a
    where a.user_id = m.id and a.date = p_date
      and a.deleted_at is null and a.status <> 'cancelled'
      and public.hhmm_to_min(a.start_time) < v_end + v_buf
      and p_start < public.hhmm_to_min(a.end_time) + v_buf
  ) then
    return 'slot_taken';
  end if;
  return null;
end $$;

-- Свободное время для сайта. Возвращает только время — никаких данных клиентов.
-- status: ok | master_not_found | service_not_found | date_invalid | date_past |
--         date_far | paused | closed | day_off
create or replace function public.available_slots(p_slug text, p_date text, p_service_id text default null)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  v_id uuid;
  v_ws text;
  v_we text;
  v_dur int := 60;
  v_from int;
  v_to int;
  v_t int;
  v_err text;
  v_slots text[] := '{}';
begin
  select id, work_hours_start, work_hours_end into v_id, v_ws, v_we
    from public.profiles where slug = p_slug and published;
  if v_id is null then
    return jsonb_build_object('status', 'master_not_found', 'slots', '[]'::jsonb);
  end if;
  if coalesce(p_service_id, '') <> '' then
    select coalesce(nullif(duration, 0), 60) into v_dur
      from public.services where id = p_service_id and user_id = v_id and deleted_at is null;
    if not found then
      return jsonb_build_object('status', 'service_not_found', 'slots', '[]'::jsonb);
    end if;
  end if;

  v_from := coalesce(public.hhmm_to_min(v_ws), 540);
  v_to := coalesce(public.hhmm_to_min(v_we), 1200);

  -- Причины уровня дня — одна проверка на первом слоте.
  v_err := public.booking_slot_error(v_id, p_date, v_from, v_dur);
  if v_err in ('date_invalid', 'date_past', 'date_far', 'paused', 'closed', 'day_off') then
    return jsonb_build_object('status', v_err, 'slots', '[]'::jsonb);
  end if;

  v_t := v_from;
  while v_t + v_dur <= v_to loop
    if public.booking_slot_error(v_id, p_date, v_t, v_dur) is null then
      v_slots := v_slots || lpad((v_t / 60)::text, 2, '0') || ':' || lpad((v_t % 60)::text, 2, '0');
    end if;
    v_t := v_t + 30;
  end loop;
  return jsonb_build_object('status', 'ok', 'slots', to_jsonb(v_slots), 'duration', v_dur);
end $$;

-- Запись: та же проверка, но под локом мастера на дату — две одновременные
-- брони на один слот не проходят обе.
create or replace function public.book_appointment_v2(
  p_id text, p_user_id uuid, p_client_id text, p_service_id text, p_date text,
  p_start_time text, p_duration int, p_price numeric, p_notes text, p_now timestamptz
) returns text language plpgsql security definer set search_path = public as $$
declare
  v_start int := public.hhmm_to_min(p_start_time);
  v_err text;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text || '|' || p_date, 0));
  v_err := public.booking_slot_error(p_user_id, p_date, v_start, p_duration, p_now);
  if v_err is not null then return v_err; end if;
  insert into public.appointments
    (id, user_id, client_id, service_id, date, start_time, end_time, status, price, notes, created_at, updated_at)
  values
    (p_id, p_user_id, p_client_id, p_service_id, p_date, p_start_time,
     lpad(((v_start + p_duration) / 60)::text, 2, '0') || ':' || lpad(((v_start + p_duration) % 60)::text, 2, '0'),
     'scheduled', p_price, p_notes, p_now, p_now);
  return 'ok';
end $$;

-- Внутренние функции — только для service-role (edge-функция book).
revoke all on function public.booking_slot_error(uuid, text, int, int, timestamptz) from public, anon, authenticated;
revoke all on function public.book_appointment_v2(text, uuid, text, text, text, text, int, numeric, text, timestamptz) from public, anon, authenticated;
-- Свободные слоты — публичные: сайт зовёт их anon-ключом.
revoke all on function public.available_slots(text, text, text) from public;
grant execute on function public.available_slots(text, text, text) to anon, authenticated;

-- Отзывы. Мастер мог INSERT/UPDATE/DELETE свои отзывы: написать себе ★5 и
-- стереть плохой — рейтинг на сайте ничего не значил. Отзывы должны приходить
-- от клиентов через сервер; мастеру остаётся только читать.
drop policy if exists "Master manages own reviews" on public.reviews;
create policy "Master reads own reviews" on public.reviews
  for select using ((select auth.uid()) = master_id);
revoke insert, update, delete, truncate on public.reviews from authenticated, anon;
