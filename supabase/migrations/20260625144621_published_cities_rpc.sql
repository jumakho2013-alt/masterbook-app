-- Дешёвый список городов для фильтра каталога: возвращает только DISTINCT-города
-- (десятки строк), а не тянет все опубликованные профили на фронт. STABLE +
-- читает только публичные поля → безопасно отдать anon.
create or replace function public.published_cities()
returns text[]
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(array_agg(distinct city order by city), '{}')
  from profiles
  where published and city is not null and btrim(city) <> '';
$$;

revoke execute on function public.published_cities() from public;
grant execute on function public.published_cities() to anon, authenticated;
