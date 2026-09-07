-- 1) ПРОИЗВОДИТЕЛЬНОСТЬ НА МАСШТАБЕ: оборачиваем auth.uid() в (select auth.uid())
--    чтобы Postgres вычислял его ОДИН раз на запрос, а не на каждую строку
--    (advisor auth_rls_initplan). Логика политик не меняется.
alter policy "Users can view own profile"   on public.profiles using ((select auth.uid()) = id);
alter policy "Users can update own profile" on public.profiles using ((select auth.uid()) = id);
alter policy "Users can insert own profile" on public.profiles with check ((select auth.uid()) = id);

alter policy "own clients"      on public.clients         using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
alter policy "own services"     on public.services        using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
alter policy "own appointments" on public.appointments    using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
alter policy "own finances"     on public.finance_entries using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

alter policy "Master manages own reviews"        on public.reviews        using ((select auth.uid()) = master_id) with check ((select auth.uid()) = master_id);
alter policy "Master reads own balance"          on public.master_billing using ((select auth.uid()) = master_id);
alter policy "Master reads own payments"         on public.payments       using ((select auth.uid()) = master_id);
alter policy "Master creates own pending payment" on public.payments      with check (((select auth.uid()) = master_id) and (status = 'pending'));
alter policy "Master reads own promotions"       on public.promotions     using ((select auth.uid()) = master_id);

-- 2) БЕЗОПАСНОСТЬ: SECURITY DEFINER-функции не должны быть вызываемы по REST.
--    Триггерные/служебные — убираем у всех (триггеры продолжат работать, им grant не нужен).
revoke execute on function public.handle_new_user()           from public;
revoke execute on function public.on_review_change()          from public;
revoke execute on function public.recalc_master_rating(uuid)  from public;

--    delete_user / redeem_promotion вызывает САМ авторизованный мастер из приложения —
--    оставляем только authenticated, закрываем anon.
revoke execute on function public.delete_user()                                    from public;
grant  execute on function public.delete_user()                                    to authenticated;
revoke execute on function public.redeem_promotion(text, numeric, integer)         from public;
grant  execute on function public.redeem_promotion(text, numeric, integer)         to authenticated;
