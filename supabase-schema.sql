-- MasterBook Database Schema
-- Run this in Supabase SQL Editor (supabase.com → SQL Editor → New query)
--
-- ВАЖНО: этот файл — КАНОНИЧЕСКАЯ схема, сверенная 1:1 с живой базой
-- (проект llveqcoawshcjtgfwptv) 2026-06-18. Предыдущая версия файла устарела:
-- в ней были uuid-id и только created_at, тогда как код (src/lib/cloudSync.ts)
-- работает с ТЕКСТОВЫМИ id и колонками updated_at / deleted_at. Живую БД когда-то
-- мигрировали через SQL-редактор, а файл забыли обновить — теперь он снова верен.
--
-- Контракт синхронизации (см. cloudSync.ts / syncMerge.ts):
--   • id у бизнес-таблиц — TEXT (клиент генерит "1718…-3-x9a2k", не UUID).
--   • updated_at — клиент-авторитетное время last-write-wins. На сервере НЕТ
--     триггера, перезаписывающего updated_at (иначе LWW между устройствами
--     сломался бы). default now() срабатывает только если клиент не прислал.
--   • deleted_at — мягкое удаление (tombstone). PULL тянет и удалённые строки.
--   • На client_id / service_id / appointment_id НЕТ внешних ключей: при LWW
--     запись может прийти раньше своего клиента/услуги, и жёсткий FK отклонил бы
--     upsert. Целостность ссылок обеспечивает клиент.
--
-- Файл идемпотентен: create table if not exists + create index if not exists +
-- drop/create policy + create or replace function. Повторный прогон на уже
-- развёрнутой базе НЕ трогает существующие данные. ВНИМАНИЕ: на старом проекте
-- со схемой uuid-id этот файл НЕ мигрирует типы (create table if not exists
-- пропустит существующую таблицу) — он рассчитан на чистый проект либо на базу,
-- уже приведённую к этой схеме.

-- 1. Profiles (masters/users)
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null default '',
  profession_category text,
  specialization_id text,
  work_hours_start text default '09:00',
  work_hours_end text default '20:00',
  work_days integer[] default '{1,2,3,4,5,6}',
  break_enabled boolean default true,
  break_start text default '13:00',
  break_end text default '14:00',
  buffer_minutes integer default 15,
  created_at timestamptz default now()
);

-- 2. Clients
create table if not exists clients (
  id text primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  name text not null,
  phone text not null default '',
  notes text default '',
  tags text[] default '{}',
  address text,
  preferences text,
  birthday text,
  debt numeric default 0,
  photo_uri text,
  created_at timestamptz default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- 3. Services
create table if not exists services (
  id text primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  name text not null,
  price numeric not null default 0,
  duration integer not null default 0, -- minutes
  color text default '#2EE6A6',
  created_at timestamptz default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- 4. Appointments
-- NB: client_id / service_id БЕЗ FK — см. контракт синка в шапке файла.
create table if not exists appointments (
  id text primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  client_id text,
  service_id text,
  date text not null, -- YYYY-MM-DD
  start_time text not null, -- HH:MM
  end_time text not null,
  status text default 'scheduled' check (status in ('scheduled','completed','cancelled','no-show')),
  price numeric not null default 0,
  notes text,
  address text,
  photos text[], -- array of storage paths / URLs
  deposit numeric,
  deposit_paid boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- 5. Finance entries
-- NB: appointment_id БЕЗ FK — см. контракт синка в шапке файла.
create table if not exists finance_entries (
  id text primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  type text not null check (type in ('income','expense')),
  amount numeric not null default 0,
  description text not null default '',
  date text not null, -- YYYY-MM-DD
  appointment_id text,
  created_at timestamptz default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- Indexes for performance
-- (user_id, updated_at) — PULL тянет строки пользователя; updated_at нужен LWW.
-- (user_id, date) — выборки по дню/периоду в приложении (расписание, финансы).
create index if not exists idx_clients_user_updated on clients(user_id, updated_at);
create index if not exists idx_services_user_updated on services(user_id, updated_at);
create index if not exists idx_appointments_user_date on appointments(user_id, date);
create index if not exists idx_appointments_user_updated on appointments(user_id, updated_at);
create index if not exists idx_finance_user_date on finance_entries(user_id, date);
create index if not exists idx_finance_user_updated on finance_entries(user_id, updated_at);

-- Row Level Security (каждый мастер видит только свои данные)
alter table profiles enable row level security;
alter table clients enable row level security;
alter table services enable row level security;
alter table appointments enable row level security;
alter table finance_entries enable row level security;

-- RLS Policies (drop+create — идемпотентно; Postgres не умеет create policy if not exists)
drop policy if exists "Users can view own profile" on profiles;
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
drop policy if exists "Users can update own profile" on profiles;
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
-- NB: живая БД сейчас имеет insert-политику с check (true) — её стоит ужать до
-- auth.uid() = id (ниже), чтобы юзер не мог вставить profiles-строку с чужим id.
drop policy if exists "Users can insert own profile" on profiles;
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);

drop policy if exists "own clients" on clients;
create policy "own clients" on clients for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "own services" on services;
create policy "own services" on services for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "own appointments" on appointments;
create policy "own appointments" on appointments for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "own finances" on finance_entries;
create policy "own finances" on finance_entries for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', ''));
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ==========================================================================
-- Account deletion (App Store requirement — Guideline 5.1.1(v))
-- Call from client via supabase.rpc('delete_user'). Uses session auth.uid()
-- so users can only delete their own row. Cascade on profiles.id removes
-- clients / services / appointments / finance entries automatically.
-- ==========================================================================
create or replace function delete_user()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  -- Deleting the auth.users row cascades through profiles.id → everything.
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function delete_user() from public;
grant execute on function delete_user() to authenticated;

-- ==========================================================================
-- Публичный слой каталога (Фаза 2 — сайт). Применён на живую БД 2026-06-18
-- (migration public_catalog_layer). Аддитивно и идемпотентно. Ничего не
-- становится публичным, пока мастер не выставит published=true (default false).
-- Приватная CRM (clients/appointments/finance) остаётся owner-only.
-- ==========================================================================

-- Публичные поля профиля мастера (витрина)
alter table profiles add column if not exists city text;
alter table profiles add column if not exists district text;
alter table profiles add column if not exists bio text;
alter table profiles add column if not exists avatar_url text;
alter table profiles add column if not exists cover_url text;
alter table profiles add column if not exists portfolio_photos text[] default '{}';
alter table profiles add column if not exists slug text;
alter table profiles add column if not exists published boolean not null default false;
alter table profiles add column if not exists premium boolean not null default false;
alter table profiles add column if not exists premium_until timestamptz;
alter table profiles add column if not exists rating numeric not null default 0;
alter table profiles add column if not exists reviews_count integer not null default 0;
alter table profiles add column if not exists whatsapp text;
alter table profiles add column if not exists public_phone text;

create unique index if not exists idx_profiles_slug on profiles(slug) where slug is not null;
create index if not exists idx_profiles_published_city on profiles(published, city);

-- Отзывы (без client_phone — public RLS раскрыл бы PII)
create table if not exists reviews (
  id uuid default gen_random_uuid() primary key,
  master_id uuid references profiles(id) on delete cascade not null,
  appointment_id text,
  client_name text not null default '',
  rating integer not null check (rating between 1 and 5),
  comment text,
  published boolean not null default true,
  created_at timestamptz default now()
);
create index if not exists idx_reviews_master on reviews(master_id);

-- Кэш profiles.rating / reviews_count из reviews (триггер)
create or replace function recalc_master_rating(p_master uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update profiles p set
    reviews_count = (select count(*) from reviews r where r.master_id = p_master and r.published),
    rating = coalesce((select round(avg(r.rating)::numeric, 1) from reviews r where r.master_id = p_master and r.published), 0)
  where p.id = p_master;
end; $$;

create or replace function on_review_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (tg_op = 'DELETE') then
    perform recalc_master_rating(old.master_id);
    return old;
  end if;
  perform recalc_master_rating(new.master_id);
  if (tg_op = 'UPDATE' and new.master_id <> old.master_id) then
    perform recalc_master_rating(old.master_id);
  end if;
  return new;
end; $$;

drop trigger if exists trg_reviews_recalc on reviews;
create trigger trg_reviews_recalc
  after insert or update or delete on reviews
  for each row execute function on_review_change();

-- RLS: публичное чтение только опубликованных мастеров
alter table reviews enable row level security;

drop policy if exists "Public can view published profiles" on profiles;
create policy "Public can view published profiles" on profiles
  for select using (published = true);

drop policy if exists "Public can view services of published masters" on services;
create policy "Public can view services of published masters" on services
  for select using (
    deleted_at is null
    and exists (select 1 from profiles p where p.id = services.user_id and p.published)
  );

drop policy if exists "Public can view published reviews" on reviews;
create policy "Public can view published reviews" on reviews
  for select using (
    published = true
    and exists (select 1 from profiles p where p.id = reviews.master_id and p.published)
  );

drop policy if exists "Master manages own reviews" on reviews;
create policy "Master manages own reviews" on reviews
  for all using (auth.uid() = master_id) with check (auth.uid() = master_id);
