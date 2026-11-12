-- Обложка карточки мастера в каталоге — первая работа из портфолио.
-- Раньше карточка умела показывать только букву имени на пастельном фоне, даже
-- у мастера с 12 работами: в выборке каталога нет portfolio_photos (это ~1.4 КБ
-- URL на строку ради одной картинки). Генерируемая колонка отдаёт ровно одну
-- ссылку и не может разойтись с массивом.
alter table public.profiles
  add column if not exists cover_photo text
  generated always as (portfolio_photos[1]) stored;

-- У profiles колоночные гранты на чтение: новая колонка без явного SELECT
-- невидима для сайта, и запрос каталога, где она перечислена, падает целиком.
grant select (cover_photo) on public.profiles to anon, authenticated;
