-- Валюта мастера для публичного отображения цен на сайте. Default TJS (сомони,
-- рынок запуска). Существующие строки получают TJS. App пушит реальную валюту
-- мастера (useSettingsStore.currency) при публикации/синке.
alter table public.profiles add column if not exists currency text default 'TJS';
-- Бэкфилл существующих null (на случай повторного запуска)
update public.profiles set currency = 'TJS' where currency is null;
