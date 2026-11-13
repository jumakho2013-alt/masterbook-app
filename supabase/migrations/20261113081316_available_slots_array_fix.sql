-- available_slots(): `массив || текст || ':'` разбирался слева направо как
-- массив || ':' и падал на «malformed array literal» для любого рабочего дня.
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
      v_slots := array_append(v_slots, lpad((v_t / 60)::text, 2, '0') || ':' || lpad((v_t % 60)::text, 2, '0'));
    end if;
    v_t := v_t + 30;
  end loop;
  return jsonb_build_object('status', 'ok', 'slots', to_jsonb(v_slots), 'duration', v_dur);
end $$;
