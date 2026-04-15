-- MasterBook Database Schema
-- Run this in Supabase SQL Editor (supabase.com → SQL Editor → New query)

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
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  name text not null,
  phone text not null,
  notes text default '',
  tags text[] default '{}',
  address text,
  preferences text,
  birthday text,
  debt numeric default 0,
  created_at timestamptz default now()
);

-- 3. Services
create table if not exists services (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  name text not null,
  price numeric not null,
  duration integer not null, -- minutes
  color text default '#7C5DFA',
  created_at timestamptz default now()
);

-- 4. Appointments
create table if not exists appointments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  client_id uuid references clients(id) on delete set null,
  service_id uuid references services(id) on delete set null,
  date text not null, -- YYYY-MM-DD
  start_time text not null, -- HH:MM
  end_time text not null,
  status text default 'scheduled' check (status in ('scheduled','completed','cancelled','no-show')),
  price numeric not null,
  notes text,
  photos text[], -- array of URLs
  created_at timestamptz default now()
);

-- 5. Finance entries
create table if not exists finance_entries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  type text not null check (type in ('income','expense')),
  amount numeric not null,
  description text not null,
  date text not null, -- YYYY-MM-DD
  appointment_id uuid references appointments(id) on delete set null,
  created_at timestamptz default now()
);

-- Indexes for performance
create index if not exists idx_clients_user on clients(user_id);
create index if not exists idx_services_user on services(user_id);
create index if not exists idx_appointments_user_date on appointments(user_id, date);
create index if not exists idx_finance_user_date on finance_entries(user_id, date);

-- Row Level Security (каждый мастер видит только свои данные)
alter table profiles enable row level security;
alter table clients enable row level security;
alter table services enable row level security;
alter table appointments enable row level security;
alter table finance_entries enable row level security;

-- RLS Policies
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);

create policy "Users can manage own clients" on clients for all using (auth.uid() = user_id);
create policy "Users can manage own services" on services for all using (auth.uid() = user_id);
create policy "Users can manage own appointments" on appointments for all using (auth.uid() = user_id);
create policy "Users can manage own finances" on finance_entries for all using (auth.uid() = user_id);

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
