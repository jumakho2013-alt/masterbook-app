-- Business data is empty (0 rows). Recreate the 4 tables with text ids
-- (match local generateId) + updated_at/deleted_at for LWW sync + tombstones.
drop table if exists finance_entries cascade;
drop table if exists appointments cascade;
drop table if exists clients cascade;
drop table if exists services cascade;

create table clients (
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

create table services (
  id text primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  name text not null,
  price numeric not null default 0,
  duration integer not null default 0,
  color text default '#2EE6A6',
  created_at timestamptz default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table appointments (
  id text primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  client_id text,
  service_id text,
  date text not null,
  start_time text not null,
  end_time text not null,
  status text default 'scheduled' check (status in ('scheduled','completed','cancelled','no-show')),
  price numeric not null default 0,
  notes text,
  address text,
  photos text[],
  created_at timestamptz default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table finance_entries (
  id text primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  type text not null check (type in ('income','expense')),
  amount numeric not null default 0,
  description text not null default '',
  date text not null,
  appointment_id text,
  created_at timestamptz default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index idx_clients_user_updated on clients(user_id, updated_at);
create index idx_services_user_updated on services(user_id, updated_at);
create index idx_appointments_user_date on appointments(user_id, date);
create index idx_appointments_user_updated on appointments(user_id, updated_at);
create index idx_finance_user_date on finance_entries(user_id, date);
create index idx_finance_user_updated on finance_entries(user_id, updated_at);

alter table clients enable row level security;
alter table services enable row level security;
alter table appointments enable row level security;
alter table finance_entries enable row level security;

create policy "own clients" on clients for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own services" on services for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own appointments" on appointments for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own finances" on finance_entries for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
