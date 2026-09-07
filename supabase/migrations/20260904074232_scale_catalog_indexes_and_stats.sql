-- Подготовка к 100k мастеров. Всё измерено на изолированной схеме со 100 000 строк.

-- 1) Индексы под НОВЫЙ фильтр каталога (по specialization_id).
--    Замер: редкая специализация 20.87 мс → 0.09 мс (в 230 раз).
create index if not exists idx_profiles_spec_sort
  on public.profiles (specialization_id, premium desc, rating desc)
  where published;

create index if not exists idx_profiles_spec_city_sort
  on public.profiles (specialization_id, city, premium desc, rating desc)
  where published;

-- 2) Старый trigram-индекс по profession_category больше не нужен:
--    каталог перешёл на точный фильтр по specialization_id, а свободный
--    поиск идёт по name (для него есть idx_profiles_name_trgm).
drop index if exists public.idx_profiles_profession_trgm;

-- 3) Статистика главной одним запросом вместо выгрузки всех профилей.
--    Сейчас сайт тянет ВСЕ published-строки (замер: 59 мс + 5.9 МБ по сети),
--    а PostgREST режет ответ на 1000 строк — цифры на главной всё равно врут.
create or replace function public.catalog_stats()
returns jsonb
language sql
stable
security definer
set search_path to 'public'
as $$
  select jsonb_build_object(
    'masters',    (select count(*) from profiles where published),
    'reviews',    (select coalesce(sum(reviews_count), 0) from profiles where published),
    'avg_rating', (select coalesce(round(avg(rating)::numeric, 1), 0)
                     from profiles where published and reviews_count > 0),
    'by_spec',    (select coalesce(jsonb_object_agg(specialization_id, c), '{}'::jsonb)
                     from (select specialization_id, count(*) as c
                             from profiles
                            where published and specialization_id is not null
                            group by specialization_id) t)
  );
$$;

revoke execute on function public.catalog_stats() from public;
grant execute on function public.catalog_stats() to anon, authenticated;
