-- confirm_payment кредитует баланс мастера и НЕ проверяет вызывающего.
-- Раньше был исполняем anon/authenticated → любой залогиненный мастер мог
-- подтвердить свой pending-платёж и получить бесплатный премиум.
-- Закрываем: вызывать может только service_role (через админ Edge Function,
-- которая отдельно проверяет, что вызывающий — владелец из ADMIN_EMAILS).
revoke execute on function public.confirm_payment(uuid) from public;
revoke execute on function public.confirm_payment(uuid) from anon;
revoke execute on function public.confirm_payment(uuid) from authenticated;
grant execute on function public.confirm_payment(uuid) to service_role;
