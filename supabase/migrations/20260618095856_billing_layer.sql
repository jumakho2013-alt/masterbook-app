-- ============================================================================
-- Billing (Фаза 4) — ПРИВАТНЫЙ слой. Баланс + пополнения + продвижение.
-- Деньги клиента не трогаем. Мастер платит за продвижение из баланса.
-- RLS: мастер ЧИТАЕТ только своё; подтверждение платежа — через service role
-- (админка), не клиентом → нельзя «самоподтвердиться». Идемпотентность встроена.
-- ============================================================================

create table if not exists master_billing (
  master_id uuid references profiles(id) on delete cascade primary key,
  balance numeric not null default 0,
  updated_at timestamptz default now()
);

create table if not exists payments (
  id uuid default gen_random_uuid() primary key,
  master_id uuid references profiles(id) on delete cascade not null,
  amount numeric not null check (amount > 0),
  currency text not null default 'TJS',
  country text,                 -- TJ/RU/UZ/KZ/KG
  method text,                  -- alif/kaspi/payme/mbank/manual
  marker text,                  -- сумма-маркер / код для полу-авто сверки
  reference text,               -- что прислал мастер (коммент/скрин-путь)
  status text not null default 'pending' check (status in ('pending','confirmed','rejected')),
  idempotency_key text not null,
  created_at timestamptz default now(),
  confirmed_at timestamptz,
  unique (master_id, idempotency_key)
);
create index if not exists idx_payments_master on payments(master_id, created_at desc);
create index if not exists idx_payments_pending on payments(status) where status = 'pending';

create table if not exists promotions (
  id uuid default gen_random_uuid() primary key,
  master_id uuid references profiles(id) on delete cascade not null,
  package text not null,        -- 'week' / 'month' / ...
  amount numeric not null check (amount > 0),
  starts_at timestamptz default now(),
  ends_at timestamptz not null,
  created_at timestamptz default now()
);
create index if not exists idx_promotions_master on promotions(master_id);

-- RLS — мастер только читает своё; запись статусов/баланса только service role
alter table master_billing enable row level security;
alter table payments enable row level security;
alter table promotions enable row level security;

drop policy if exists "Master reads own balance" on master_billing;
create policy "Master reads own balance" on master_billing for select using (auth.uid() = master_id);

drop policy if exists "Master reads own payments" on payments;
create policy "Master reads own payments" on payments for select using (auth.uid() = master_id);
-- мастер может создать запрос на пополнение (status=pending), но НЕ подтвердить
drop policy if exists "Master creates own pending payment" on payments;
create policy "Master creates own pending payment" on payments
  for insert with check (auth.uid() = master_id and status = 'pending');

drop policy if exists "Master reads own promotions" on promotions;
create policy "Master reads own promotions" on promotions for select using (auth.uid() = master_id);

-- Подтверждение пополнения (админка через service role): идемпотентно начисляет
-- баланс только если платёж был pending.
create or replace function confirm_payment(p_payment uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_master uuid; v_amount numeric; v_status text;
begin
  select master_id, amount, status into v_master, v_amount, v_status
    from payments where id = p_payment for update;
  if not found then raise exception 'payment not found'; end if;
  if v_status <> 'pending' then return; end if; -- уже обработан → no-op (идемпотентность)
  update payments set status = 'confirmed', confirmed_at = now() where id = p_payment;
  insert into master_billing (master_id, balance, updated_at)
    values (v_master, v_amount, now())
    on conflict (master_id) do update
      set balance = master_billing.balance + excluded.balance, updated_at = now();
end; $$;
revoke all on function confirm_payment(uuid) from public; -- только service_role

-- Списание баланса на продвижение (self-serve мастером): проверяет баланс,
-- продлевает premium_until.
create or replace function redeem_promotion(p_package text, p_amount numeric, p_days integer)
returns void language plpgsql security definer set search_path = public as $$
declare v_master uuid := auth.uid(); v_balance numeric;
begin
  if v_master is null then raise exception 'not authenticated'; end if;
  if p_amount <= 0 or p_days <= 0 then raise exception 'invalid promotion'; end if;
  select balance into v_balance from master_billing where master_id = v_master for update;
  if coalesce(v_balance, 0) < p_amount then raise exception 'insufficient balance'; end if;
  update master_billing set balance = balance - p_amount, updated_at = now() where master_id = v_master;
  insert into promotions (master_id, package, amount, ends_at)
    values (v_master, p_package, p_amount, now() + (p_days || ' days')::interval);
  update profiles set premium = true,
    premium_until = greatest(coalesce(premium_until, now()), now()) + (p_days || ' days')::interval
    where id = v_master;
end; $$;
revoke all on function redeem_promotion(text, numeric, integer) from public;
grant execute on function redeem_promotion(text, numeric, integer) to authenticated;
