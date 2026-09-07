-- Публичный контакт мастера для кнопки «Записаться/Написать» на сайте.
-- Видимость — через ту же политику published-профилей. Телефон публичный
-- ТОЛЬКО если мастер сам опубликовался (его выбор показывать контакт).
alter table profiles add column if not exists whatsapp text;
alter table profiles add column if not exists public_phone text;
