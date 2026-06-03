# MasterBook

CRM-приложение для частных мастеров. React Native + Expo SDK 54, Supabase, Zustand.

## Быстрый старт (dev)

```bash
npm install
cp .env.local.example .env.local  # если есть; иначе отредактируй .env.local руками
npx expo start --offline          # Metro
xcrun simctl openurl booted "exp://127.0.0.1:8081"  # запуск в симуляторе
```

## Команды

| Команда | Что делает |
|---|---|
| `npm test` | Jest тесты (validation, authRateLimit, currency) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run doctor` | `expo-doctor` — проверка конфига / совместимости |
| `npm run build:ios` | EAS Build production iOS (IPA для App Store) |
| `npm run build:android` | EAS Build production Android (AAB для Play Store) |
| `npm run build:ios:preview` | EAS preview iOS (для TestFlight Internal) |
| `npm run build:android:preview` | EAS preview Android (APK для внутренних тестов) |
| `npm run submit:ios` | Загрузка в App Store Connect |
| `npm run submit:android` | Загрузка в Google Play (draft) |
| `bash scripts/take-screenshots.sh` | Автосъёмка App Store скриншотов |

## Ключевые документы

### Релиз / store compliance
- [`docs/`](./docs/) — сайт на GitHub Pages (privacy, support, landing)
- [`docs/SUPABASE_SETUP.md`](./docs/SUPABASE_SETUP.md) — настройка Supabase пошагово
- [`docs/DATA_SAFETY.md`](./docs/DATA_SAFETY.md) — готовые ответы на Google Play Data Safety form
- [`docs/APP_STORE_METADATA.md`](./docs/APP_STORE_METADATA.md) — метадата для App Store Connect + инструкция по настройке `eas submit`
- [`docs/ANDROID_PERMISSIONS.md`](./docs/ANDROID_PERMISSIONS.md) — обоснования permissions для Play Console (SCHEDULE_EXACT_ALARM и др.)
- [`docs/SCREENSHOTS.md`](./docs/SCREENSHOTS.md) — инструкция по снятию скриншотов
- [`PRIVACY_POLICY.md`](./PRIVACY_POLICY.md) — политика конфиденциальности (каноническая версия на GitHub Pages)
- [`supabase-schema.sql`](./supabase-schema.sql) — SQL схема БД + RLS + delete_user RPC

### Стратегия и дорожная карта (июнь 2026)
- [`docs/CHANGELOG-2026-06.md`](./docs/CHANGELOG-2026-06.md) — что сделано в релизном спринте + что отложено + 7 следующих шагов
- [`docs/growth-analysis-2026-06/PLAN.md`](./docs/growth-analysis-2026-06/PLAN.md) — план роста v1: что критично починить, позиционирование, конкуренты, монетизация, GTM
- [`docs/value-uplift-2026-06/PLAN-V2.md`](./docs/value-uplift-2026-06/PLAN-V2.md) — план v2: универсализация под все профессии, custom fields, value-uplift до 299₽/мес

## Архитектура

```
app/                    — expo-router роуты (screens)
  (auth)/               — login, register, onboarding
  (tabs)/               — главные табы (Сегодня, Календарь, Клиенты, Финансы, Профиль)
  appointment/          — детали записи, новая запись
  client/               — детали клиента, новый клиент
  settings/             — work-hours, account

src/
  components/           — общие компоненты (AppointmentCard, ClientRow, ...)
    ui/                 — дизайн-система (Button, Card, GlassCard, LiquidGlass, ...)
  stores/               — Zustand stores (клиенты, записи, финансы, настройки)
  lib/                  — чистая бизнес-логика (validation, biometric, notifications, ...)
  hooks/                — useAlert, useTabBarOffset
  theme/                — цвета, типографика, spacing, shadows
  types/                — TypeScript модели
  utils/                — форматирование дат, валюты, мелкие helper-ы
```

## Дизайн-система

**Liquid Glass** — главная особенность UI:
- `src/components/ui/LiquidGlass.ios.tsx` — BlurView + tint + specular + rim
- `src/components/ui/LiquidGlass.android.tsx` — solid surface fallback (без blur, иначе jank на mid-range Android)
- Применяется в `GlassCard`, `GlassTabBar`, «Сейчас идёт» на главной, FAB на Today/Clients

## CI / Release

GitHub Actions:
- [`.github/workflows/ci.yml`](./.github/workflows/ci.yml) — на каждый push / PR: TypeScript + Jest + expo-doctor
- [`.github/workflows/release.yml`](./.github/workflows/release.yml) — на тег `v1.2.3` / `v1.2.3-ios` / `v1.2.3-android` → EAS Build

Нужен secret `EXPO_TOKEN` в репозитории (создать на expo.dev/settings/access-tokens).

## Что сейчас работает / что нет

### ✅ Работает
- Auth (Email + Apple Sign-In на iOS) с 152-ФЗ согласием на signup
- Календарь с напоминаниями за час до записи
- Zod-валидация форм
- Face ID / Touch ID защита (Профиль → Безопасность и данные) с guard от race-condition
- **Экспорт JSON + Tax PDF для самозанятых** (НПД 4% индикативно)
- Удаление аккаунта (in-app + Supabase RPC) с честной обработкой ошибки сервера
- **Wipe всех бизнес-сторов на signOut / deleteAccount** (защита от cross-account contamination)
- **Мультивалютность**: 8 валют (RUB default, KZT, UAH, BYN, USD, EUR, GEL, TRY)
- Error Boundary с диагностикой и копированием stack trace
- Rate limiting для auth (5 попыток / 10 мин → cooldown 15с→30с→60с)
- Темная/светлая тема, русская локализация
- 102 unit-теста, TypeScript clean, expo-doctor предупреждения только pre-existing

### 🚧 В очереди (см. [`docs/CHANGELOG-2026-06.md`](./docs/CHANGELOG-2026-06.md) §«Следующие 7 шагов»)
- Синхронизация с Supabase (сейчас Zustand + AsyncStorage только локально)
- Offline-queue для операций когда сеть вернётся
- Push-уведомления remote (сейчас только local)
- Sentry / crash reporter
- Онлайн-запись для клиентов (публичная web-страница мастера)
- IAP / RuStore Billing (текущий free-only, упоминания цены убраны)
- Profession packs (универсализация под любые профессии — см. PLAN-V2.md)
- iOS 17+ Home Screen Widget
- Sleeping-clients widget с WhatsApp-draft

## Лицензия

Proprietary. © MasterBook 2026.
