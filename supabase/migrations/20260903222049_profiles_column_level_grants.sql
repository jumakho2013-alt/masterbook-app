-- КРИТИЧНО: политика "Users can update own profile" ограничивала СТРОКУ
-- (auth.uid() = id), но не КОЛОНКИ. Мастер мог одним PATCH-запросом с публичным
-- anon-ключом выставить себе premium=true, premium_until='2099-01-01',
-- rating=5, reviews_count=500 — бесплатный VIP, первое место в каталоге
-- (сортировка premium→rating) и фейковые звёзды в JSON-LD для Google.
--
-- Эти четыре колонки должны писаться ТОЛЬКО SECURITY DEFINER-функциями:
-- redeem_promotion (премиум за баланс), confirm_payment, recalc_master_rating.
-- service_role (edge-функции) не затрагивается — у него свои права.

revoke insert, update on public.profiles from anon, authenticated;

-- Ровно те колонки, что пишет легитимный код:
--   cloudSync.pushAll        → id, name, profession_category, specialization_id, currency
--   cloudSync.pushPublicProfile → city, district, bio, slug, whatsapp, public_phone,
--                                 work_days, work_hours_*, currency, portfolio_photos, published
--   web Dashboard.saveProfile / (auth)/services-setup → подмножество выше
--   break_*/buffer_minutes — под будущий синк перерыва; avatar_url/cover_url — задел
grant insert (id, name, profession_category, specialization_id, city, district, bio, slug,
              whatsapp, public_phone, published, work_days, work_hours_start, work_hours_end,
              break_enabled, break_start, break_end, buffer_minutes, currency,
              portfolio_photos, avatar_url, cover_url)
  on public.profiles to authenticated;

grant update (name, profession_category, specialization_id, city, district, bio, slug,
              whatsapp, public_phone, published, work_days, work_hours_start, work_hours_end,
              break_enabled, break_start, break_end, buffer_minutes, currency,
              portfolio_photos, avatar_url, cover_url)
  on public.profiles to authenticated;
