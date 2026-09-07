-- Истёкший премиум должен перестать быть премиумом, иначе он остаётся в топе
-- каталога (сортировка по profiles.premium), хотя VIP-бейдж уже не показывается
-- (сайт считает активность по premium_until). Ежедневный джоб снимает флаг.
create extension if not exists pg_cron;

-- Идемпотентно: снимаем старое расписание если было, ставим заново.
select cron.unschedule('expire-premium')
where exists (select 1 from cron.job where jobname = 'expire-premium');

select cron.schedule(
  'expire-premium',
  '10 0 * * *',
  $$update public.profiles
      set premium = false
    where premium = true
      and premium_until is not null
      and premium_until < now()$$
);

-- Разовый прогон сразу (на случай уже истёкших).
update public.profiles
   set premium = false
 where premium = true
   and premium_until is not null
   and premium_until < now();
