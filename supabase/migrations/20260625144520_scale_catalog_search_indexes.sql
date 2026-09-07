-- Масштаб каталога: при росте до сотен тысяч мастеров ILIKE '%q%' без индекса =
-- полный скан. pg_trgm GIN-индексы делают поиск по имени/профессии быстрым.
create extension if not exists pg_trgm;

create index if not exists idx_profiles_name_trgm
  on public.profiles using gin (name gin_trgm_ops) where published;

create index if not exists idx_profiles_profession_trgm
  on public.profiles using gin (profession_category gin_trgm_ops) where published;

-- Сортировка каталога (премиум-первыми, затем рейтинг) среди опубликованных.
create index if not exists idx_profiles_catalog_sort
  on public.profiles (premium desc, rating desc) where published;
