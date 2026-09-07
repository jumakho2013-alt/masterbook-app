-- Аудит безопасности: SECURITY DEFINER-функции были вызываемы через публичный
-- REST (/rest/v1/rpc/...) ролями anon/authenticated, хотя часть из них — чисто
-- триггерные или внутренние. Прямой эксплуатации не было (внутри проверки
-- auth.uid()), но это лишняя поверхность атаки: например, recalc_master_rating
-- давал анониму дёргать UPDATE по profiles для любого мастера.
--
-- Триггерам EXECUTE вызывающего не требуется (право проверяется при создании
-- триггера), поэтому отзыв безопасен.

-- Чисто триггерные функции — не должны вызываться напрямую вообще.
revoke execute on function public.handle_new_user() from anon, authenticated;
revoke execute on function public.on_review_change() from anon, authenticated;

-- Внутренняя: вызывается только из триггера on_review_change (owner-контекст).
revoke execute on function public.recalc_master_rating(uuid) from anon, authenticated;

-- Удаление аккаунта: нужно ТОЛЬКО залогиненному (src/lib/deleteAccount.ts).
-- Для anon функция всё равно падала на 'Not authenticated' — убираем совсем.
revoke execute on function public.delete_user() from anon;

-- Покупка премиума: только залогиненный мастер (web/cabinet Dashboard).
revoke execute on function public.redeem_promotion(text, numeric, integer) from anon;

-- published_cities() намеренно остаётся для anon: её читает каталог сайта
-- (web/app/catalog/page.tsx) под публичным ключом.
