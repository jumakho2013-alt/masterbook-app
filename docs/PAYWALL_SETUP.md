# Подписка MasterBook Pro — как включить реальную оплату

Модель: **7 дней бесплатно → $3.99/мес**. Сейчас в коде всё готово, кроме
реального биллинга (нужен нативный модуль → EAS-билд). Включается через
**RevenueCat** — это слой над App Store / Google Play.

## Почему RevenueCat
- Бесплатно до **$2 500/мес** дохода, дальше **1%** (на старте = $0).
- Один SDK на iOS + Android (+ Web через Stripe, если понадобится).
- Серверная валидация чеков, восстановление покупок, entitlements, вебхуки.
- Готовые paywall-компоненты (`react-native-purchases-ui`), если не хотим свой.
- В Expo Go работает Preview-режим (мок), реальные покупки — только в dev-build.

## Шаги (один раз)
1. **Аккаунты разработчика:** Apple Developer ($99/год) + Google Play ($25 разово).
2. **Товар-подписка** в App Store Connect и Google Play Console:
   - product id: `pro_monthly` (тот же, что `PRO_PRODUCT_ID` в `src/lib/iap.ts`)
   - цена $3.99/мес, вступительный оффер: **7 дней бесплатно (free trial)**.
3. **RevenueCat:** проект → связать с App Store Connect и Play Console →
   создать entitlement `pro` и привязать к товару.
4. **Установка в проект:**
   ```bash
   npx expo install expo-dev-client react-native-purchases react-native-purchases-ui
   ```
5. **Реализовать `src/lib/iap.ts`** поверх RevenueCat (сейчас там заглушки):
   ```ts
   import Purchases from 'react-native-purchases';
   // initIap():  Purchases.configure({ apiKey: <ios|android key> })
   // getProducts():  (await Purchases.getOfferings()).current?.availablePackages
   // purchasePro():  await Purchases.purchasePackage(pkg)
   // restorePurchases():  await Purchases.restorePurchases()
   // isSubscribed():  !!info.entitlements.active['pro']  (кешируем в сторе)
   ```
6. **Включить жёсткий paywall:** в `src/lib/iap.ts` поставить
   `SUBSCRIPTION_ENFORCED = true`. После этого:
   - по истечении триала `app/(tabs)/_layout.tsx` уводит на
     `/settings/subscription?locked=1` (экран без «назад»);
   - кнопка «Оформить» проводит реальную покупку, «Восстановить» — restore.
7. **Собрать dev/preview build** (`eas build`) — в Expo Go покупки не тестируются.

## Что уже готово в коде
- `src/lib/iap.ts` — `TRIAL_DAYS`, `PRO_PRICE`, `PRO_PRODUCT_ID`,
  `getAccessStatus()`, `trialDaysLeft()`, `SUBSCRIPTION_ENFORCED` (флаг),
  заглушки `purchasePro/restorePurchases/getProducts/isSubscribed`.
- `app/settings/subscription.tsx` — экран Pro + режим `?locked=1` (paywall без «назад»).
- `src/components/TrialBanner.tsx` — баннер на Today (последние 3 дня триала / по истечении).
- `app/(tabs)/_layout.tsx` — гейт (сейчас inert, оживает с флагом).

## Цифры
- Доход с подписки: $3.99 − комиссия стора (30% → $2.79; 15% по Small Business
  Program → $3.39). RevenueCat 0% до $2.5k/мес.
- Расход инфраструктуры: ~$8/мес (Apple) рано; +$25/мес Supabase Pro на масштабе.

Источники: RevenueCat Expo docs, RevenueCat pricing 2026.
