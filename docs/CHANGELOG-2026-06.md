---
layout: default
title: Changelog июнь 2026 — релизные блокеры + первая value-uplift фича
---

# Changelog — июнь 2026

После двух стратегических аудитов (`docs/growth-analysis-2026-06/PLAN.md` и
`docs/value-uplift-2026-06/PLAN-V2.md`) — два релизных коммита.

## Коммит 1 (`8aa3be0`) — 9 release blockers

Цель: убрать всё что гарантированно отклонит публикацию в App Store /
Google Play / RuStore.

| ID | Что | Файлы |
|---|---|---|
| **B1** | Убраны упоминания PRO/$3.99 пока IAP не реализован — Apple Guideline 3.1.1 | `app/(tabs)/profile.tsx`, `app/client/new.tsx`, `docs/support.md`, `store-listing.md` |
| **B2** | deleteAccount возвращает `serverDeleteFailed: true` вместо silent console.warn (Apple 5.1.1(v)). signOut/deleteAccount чистят ВСЕ 5 zustand-сторов (был cross-account contamination — user A → logout → user B видел данные A) | `src/lib/deleteAccount.ts`, `src/stores/*.ts`, `app/settings/account.tsx`, +1 тест |
| **B3** | 152-ФЗ согласие на регистрации: чекбокс, ссылка на политику через `expo-web-browser`, timestamp в `auth.dataConsentGivenAt`. На логине — disclaimer-text (Apple HIG не разрешает checkbox прямо над Sign in with Apple) | `app/(auth)/register.tsx`, `app/(auth)/login.tsx`, `src/stores/useAuthStore.ts` |
| **B4** | `USERNAME` / `REPLACE_WITH` плейсхолдеры заменены на реальный URL `https://jumakho2013-alt.github.io/masterbook-privacy/`. `ascAppId`/`appleTeamId` убраны из eas.json — задаются через CLI флаги или `eas secret` после получения Apple Dev | `PRIVACY_POLICY.md`, `eas.json`, `docs/APP_STORE_METADATA.md` |
| **B5** | Убраны hardcoded `ios.buildNumber:"1"` / `android.versionCode:1` — EAS управляет через `appVersionSource: remote` | `app.json` |
| **B6** | Готовый текст обоснования `SCHEDULE_EXACT_ALARM` для Play Console form (Android 14+ требование) | `docs/ANDROID_PERMISSIONS.md` |
| **B7** | Убраны `as any` / `as never` касты — Appointment.reminderNotificationId + expo-router типизированы корректно | `app/appointment/new.tsx`, `app/(tabs)/profile.tsx`, `app/(auth)/login.tsx` |
| **B8** | BiometricGate guard от race-condition (один in-flight `authenticate()` в любой момент) | `src/components/BiometricGate.tsx` |
| **B9** | `android.allowBackup: false` — данные не попадают в Google Drive auto-backup | `app.json` |

**Стратегические документы (бонус того же коммита):**
- `docs/growth-analysis-2026-06/PLAN.md` — 49 KB plan v1
- `docs/value-uplift-2026-06/PLAN-V2.md` — 50 KB plan v2 (после value-uplift)
- 10 + 10 supporting research files
- 2 adversarial critique files

## Коммит 4 (`65d5f6e`+) — Sleeping clients + Demo data + Profession packs foundation

### F1: Sleeping-clients widget (PLAN-V2 §6.4 anchor #4)

- `src/lib/sleepingClients.ts`: `findSleepingClients()` чистая функция, индексирует appointments в O(N). Anti-pattern guards: исключает `problematic`-tagged клиентов и тех у кого уже есть upcoming appointment.
- `buildDraftMessages()` — 3 тёплых черновика (не агрессивные «приходи скорее»).
- `openOutreach()` — WhatsApp/Telegram/SMS deep-link с pre-filled текстом. Telegram URL не поддерживает pre-fill → копируем в clipboard.
- `phoneForWhatsApp()` — корректно конвертирует RU 8XXX → 7XXX, не ломает корейские +82.
- `SleepingClientsCard.tsx` — Today screen widget + bottom-sheet с 3 драфтами + 4 кнопками.
- Унифицирован виджет «Давно не были» на Clients tab (раньше своя ad-hoc реализация).

### F2: Расширенный client search

Добавлены `preferences` и `address` к матчингу (раньше только name/phone/notes).

### F4: Demo data toggle

- `src/lib/sampleData.ts`: `seedSampleData()` безопасна для production — никогда не перезаписывает данные. `clearAllBusinessData()` для отката.
- `settingsStore.demoDataSeededAt`: timestamp для UI-флага.
- Today empty-state: CTA «Попробовать с примером» появляется только когда всё пусто И демо ещё не было.
- `account.tsx`: «Очистить демо-данные» — появляется только если демо активно.

### F3: Profession packs foundation (PLAN-V2 §2)

- `src/types/professionPack.ts`: `ProfessionPack` interface (vocabulary, defaultServices, customFields, emptyStates, reminderTemplate, firstWeekChecklist).
- 3 пака: `manicure` (default), `tutor` (vocab swap demo), `photographer` (creative).
- `src/lib/professionPacks.ts`: `PACK_REGISTRY` + `resolvePack()` с legacy-mapping (nails→manicure, videographer→photographer) + `tProf()` vocab swap с `{placeholder}` подстановкой.
- `useProfessionPack()` hook — реактивен на смену specializationId.
- Wired в:
  - Clients tab — заголовок и empty state из pack-словаря (репетитор увидит «Ученики»)
  - Today screen — empty state из `pack.emptyStates.today`
  - `services-setup.tsx` — при онбординге услуги берутся из `pack.defaultServices` (с fallback на legacy templates)

### Метрики после коммита 4

| Метрика | До | После |
|---|---|---|
| Тесты | 102 | 144 (+42) |
| Файлы кода | — | +9 |
| Pack-готовых вертикалей | 0 | 3 (extend trivially) |

---

## Коммит 2 (`c52da3d`) — Multi-currency + Tax PDF (value-uplift v1)

Первая фича из value-uplift roadmap — то что начинает оправдывать цену в
299₽/мес (PLAN-V2.md §6).

### P5: Configurable currency (N6 из старого аудита)

- USD больше не hardcoded в `utils/currency.ts`. 8 валют: **RUB** (default — СНГ-first), KZT, UAH, BYN, USD, EUR, GEL, TRY.
- Постсоветские/турецкая/грузинская — символ после числа (`1 000 ₽`), USD/EUR — перед.
- `CurrencyCode` вынесен в `src/utils/currency.types.ts` чтобы избежать circular dependency (`utils/currency.ts` импортирует useSettingsStore, useSettingsStore хранит currency).
- `app/settings/currency.tsx` — экран выбора с live-превью.
- 7 новых тестов на форматирование разных валют.

### P6: Tax PDF report (CIS-only moat)

`src/lib/taxReportPdf.ts`:
- `collectTaxReportData(range)` собирает данные за период. Сначала берёт `finance.entries(type='income')`, если пусто — fallback на `appointments(status='completed')` периода. Защита от double-counting (если оба источника содержат одну запись).
- `renderTaxReportHtml(data)` — самодостаточный HTML (без внешних шрифтов/картинок, работает оффлайн), валидный escape пользовательского input (XSS guard для HTML→PDF pipeline через WebKit headless).
- НПД 4% индикативно. Явный disclaimer: "не заменяет официальную справку КНД 1122036 из «Мой Налог»" — легально критично.
- `generateAndShareTaxReport(range)` — рендер + `expo-print` + `expo-sharing`.
- 15 новых тестов: inclusive границы периода, double-counting guard, leap year, XSS escape, disclaimer presence.

### Метрики

| Метрика | До | После |
|---|---|---|
| Тесты | 79 | 102 (+23) |
| TypeScript | clean | clean |
| Файлов в коде | — | +4 |
| Файлов в docs | — | +24 |

---

## Что НЕ сделано (умышленно отложено)

| Что | Почему отложено | Где живёт |
|---|---|---|
| Sentry crash reporter | Нужен DSN + native install + config plugin. Без DSN — dead code | PLAN.md §10 |
| Supabase data sync | Архитектурный долг недели, не часа. Требует userId/updatedAt/deletedAt в схеме + offline queue + conflict resolution | PLAN.md §4 (v1.1) |
| Online booking page | Нужна публичная web-страница (web build expo-router + Supabase Edge Function для booking submit) | PLAN.md §4 (v1.1) |
| Profession packs | Большой рефакторинг работающей системы. Лучше отдельным PR с проверкой | PLAN-V2 §2 |
| IAP / RuStore Billing | Нужны Apple/Google/RuStore аккаунты | PLAN.md §5 |
| i18n (EN) | Преждевременно до EN-launch'а — экономия времени сейчас | PLAN.md §4 (v2.0) |
| Push notifications (remote) | Нужен expo-notifications server + token registry. Локальные работают | PLAN.md §4 (v1.1) |

---

## Следующие 7 шагов (приоритизированные)

1. **Реальный демо-аккаунт `reviewer@masterbook.app`** в Supabase с сидированными данными (4-5 клиентов, 10-15 записей, доходы) — ручная операция в Supabase Dashboard. Без него Apple/Google могут отклонить за невозможность войти.
2. **Получить Apple Developer ($99/год)** → подставить `ascAppId` + `appleTeamId` через `eas secret`.
3. **Заявка в RuStore** для Android в РФ (приоритет №1 по дистрибуции в РФ согласно PLAN.md §9).
4. **Sentry или альтернатива** — без crash reporter мы слепые после релиза.
5. **Supabase sync (v1.1)** — самая большая дыра. Без неё reinstall = data loss = 1★ через 2 недели.
6. **Sleeping-clients widget + WhatsApp-draft** — PLAN-V2 §6.4. Конкретная фича которая оправдывает PRO.
7. **Online booking page** — PLAN.md §4 v1.1.

---

## Pre-release checklist для RuStore (CIS-first путь по PLAN.md §9)

- [x] Privacy Policy опубликована
- [x] 152-ФЗ согласие в UI
- [x] Account deletion работает + честно сообщает об ошибке
- [x] Cross-account contamination guard
- [x] `android.allowBackup: false`
- [x] `SCHEDULE_EXACT_ALARM` обоснован
- [x] USERNAME/REPLACE_WITH плейсхолдеры убраны
- [x] Валюта по умолчанию RUB
- [x] Tax PDF для самозанятых работает
- [ ] Demo account в Supabase
- [ ] Скриншоты для RuStore (1080×1920)
- [ ] Sentry или другой crash reporter
- [ ] EAS build production Android → AAB
- [ ] RuStore developer registration
