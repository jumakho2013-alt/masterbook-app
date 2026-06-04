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

- [`docs/`](./docs/) — сайт на GitHub Pages (privacy, support, landing)
- [`docs/SUPABASE_SETUP.md`](./docs/SUPABASE_SETUP.md) — настройка Supabase пошагово
- [`docs/DATA_SAFETY.md`](./docs/DATA_SAFETY.md) — готовые ответы на Google Play Data Safety form
- [`docs/APP_STORE_METADATA.md`](./docs/APP_STORE_METADATA.md) — метадата для App Store Connect
- [`docs/SCREENSHOTS.md`](./docs/SCREENSHOTS.md) — инструкция по снятию скриншотов
- [`PRIVACY_POLICY.md`](./PRIVACY_POLICY.md) — политика конфиденциальности (каноническая версия на GitHub Pages)
- [`supabase-schema.sql`](./supabase-schema.sql) — SQL схема БД + RLS + delete_user RPC

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
- Auth (Email + Apple Sign-In на iOS)
- Календарь с напоминаниями за час до записи
- Zod-валидация форм
- Face ID / Touch ID защита (Профиль → Безопасность и данные)
- Экспорт JSON
- Удаление аккаунта (in-app + Supabase RPC)
- Error Boundary с диагностикой и копированием stack trace
- Rate limiting для auth (5 попыток / 10 мин → cooldown 15с→30с→60с)
- Темная/светлая тема, русская локализация

### 🚧 В очереди
- Синхронизация с Supabase (сейчас Zustand + AsyncStorage только локально)
- Offline-queue для операций когда сеть вернётся
- Push-уведомления remote (сейчас только local)
- iOS 17+ Home Screen Widget
- Онлайн-запись для клиентов (web-страница мастера)
- Экспорт в PDF

## Лицензия

Proprietary. © MasterBook 2026.
