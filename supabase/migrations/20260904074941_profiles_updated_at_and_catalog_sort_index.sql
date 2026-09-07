-- 1) profiles.updated_at не существовало вовсе (в отличие от остальных таблиц).
--    Без неё sitemap не может отдать lastModified, а инкрементальная выборка
--    профилей невозможна. Ставим триггер, а не полагаемся на клиента.
alter table public.profiles
  add column if not exists updated_at timestamptz not null default now();

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- 2) Покрывающий индекс под сортировку каталога по умолчанию.
--    Без него ORDER BY premium desc, rating desc, id на 100k строк уходит во
--    внешнюю сортировку на диск (work_mem 4 МБ << 60 МБ данных), а глубокие
--    страницы (?page=500) становятся секундными.
create index if not exists idx_profiles_pub_sort
  on public.profiles (premium desc, rating desc, id)
  where published;

-- 3) Число фото — генерируемой колонкой, чтобы каталог не тащил массив из 12
--    URL (≈1.4 КБ на строку) ради одной цифры на карточке.
alter table public.profiles
  add column if not exists photos_count int
  generated always as (coalesce(array_length(portfolio_photos, 1), 0)) stored;
