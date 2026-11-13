-- Колонки расписания мастера существовали только в живой базе: в репозитории
-- их не создавала ни одна миграция (гранты на них были, самих колонок — нет).
-- Новая база из миграций падала бы на первом же гранте. Здесь — точная копия
-- того, что в проде; на живой базе это no-op.
alter table public.profiles add column if not exists work_hours_start text default '09:00';
alter table public.profiles add column if not exists work_hours_end text default '20:00';
alter table public.profiles add column if not exists work_days integer[] default '{1,2,3,4,5,6}';
alter table public.profiles add column if not exists break_enabled boolean default true;
alter table public.profiles add column if not exists break_start text default '13:00';
alter table public.profiles add column if not exists break_end text default '14:00';
alter table public.profiles add column if not exists buffer_minutes integer default 15;
