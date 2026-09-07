-- ============================================================================
-- Public catalog layer (Фаза 2): master public profile + reviews + public RLS.
-- Additive & idempotent. Private CRM (clients/appointments/finance) untouched.
-- Nothing becomes public until a master sets published=true (default false).
-- ============================================================================

-- 1) Public profile columns
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

create unique index if not exists idx_profiles_slug on profiles(slug) where slug is not null;
create index if not exists idx_profiles_published_city on profiles(published, city);

-- 2) Reviews (no client_phone — public RLS would expose it)
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

-- 3) Cache profiles.rating / reviews_count from reviews via trigger
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

-- 4) RLS — public read scoped to published masters; private CRM untouched
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

-- 5) Tighten profiles INSERT (was permissive WITH CHECK true) → own row only
drop policy if exists "Users can insert own profile" on profiles;
create policy "Users can insert own profile" on profiles
  for insert with check (auth.uid() = id);
