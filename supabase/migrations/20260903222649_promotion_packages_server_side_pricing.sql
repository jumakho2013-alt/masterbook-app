-- КРИТИЧНО: redeem_promotion(p_package, p_amount, p_days) принимала цену и срок
-- ОТ КЛИЕНТА. Проверялось только "> 0", поэтому вызов из консоли браузера
--   redeem_promotion('premium-90', 0.01, 36500)
-- давал 100 лет премиума за копейку. Прайс переносим на сервер.

create table if not exists public.promotion_packages (
  key       text primary key,
  label     text not null,
  days      int  not null check (days > 0),
  amount    numeric not null check (amount > 0),
  currency  text not null default 'TJS',
  sort      int  not null default 0,
  active    boolean not null default true
);

insert into public.promotion_packages (key, label, days, amount, currency, sort) values
  ('premium-7',  '7 дней',  7,  50,  'TJS', 1),
  ('premium-30', '30 дней', 30, 150, 'TJS', 2),
  ('premium-90', '90 дней', 90, 400, 'TJS', 3)
on conflict (key) do nothing;

alter table public.promotion_packages enable row level security;
drop policy if exists "Anyone can read active packages" on public.promotion_packages;
create policy "Anyone can read active packages"
  on public.promotion_packages for select using (active);
-- писать может только владелец проекта через дашборд/service_role
revoke insert, update, delete on public.promotion_packages from anon, authenticated;

-- Новая версия: клиент передаёт ТОЛЬКО ключ пакета.
create or replace function public.redeem_promotion(p_package text)
returns void language plpgsql security definer set search_path to 'public' as $$
declare
  v_master  uuid := auth.uid();
  v_days    int;
  v_amount  numeric;
  v_balance numeric;
begin
  if v_master is null then raise exception 'not authenticated'; end if;

  select days, amount into v_days, v_amount
    from promotion_packages where key = p_package and active;
  if not found then raise exception 'unknown package'; end if;

  select balance into v_balance from master_billing where master_id = v_master for update;
  if coalesce(v_balance, 0) < v_amount then raise exception 'insufficient balance'; end if;

  update master_billing set balance = balance - v_amount, updated_at = now()
   where master_id = v_master;

  insert into promotions (master_id, package, amount, ends_at)
    values (v_master, p_package, v_amount, now() + (v_days || ' days')::interval);

  update profiles
     set premium = true,
         premium_until = greatest(coalesce(premium_until, now()), now()) + (v_days || ' days')::interval
   where id = v_master;
end; $$;

-- Убираем уязвимую 3-аргументную версию.
drop function if exists public.redeem_promotion(text, numeric, integer);

revoke execute on function public.redeem_promotion(text) from anon;
grant execute on function public.redeem_promotion(text) to authenticated;
