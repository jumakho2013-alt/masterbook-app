---
layout: default
title: Release readiness — июнь 2026
---

# Release readiness — финальная проверка

Этот документ — **state-of-the-build** для людей которые будут публиковать
MasterBook в Google Play / App Store / RuStore.

---

## ✅ Что готово в коде

### Compliance & legal
- [x] Apple Guideline 3.1.1: PRO/$3.99 упоминания убраны (нет IAP — нет цены)
- [x] Apple Guideline 5.1.1(v): account deletion in-app, RPC + честная обработка server-fail
- [x] Cross-account contamination guard: signOut/deleteAccount чистят ВСЕ 5 stores
- [x] 152-ФЗ согласие на регистрации (чекбокс) + audit timestamp в `auth.dataConsentGivenAt`
- [x] 152-ФЗ disclaimer на логине (implicit consent для Apple Sign-In)
- [x] Local-only mode — для большинства CIS юзеров 152-ФЗ решается автоматически
- [x] `android.allowBackup: false` — данные не уходят в Google Drive backup
- [x] Privacy Policy URL заменён с placeholder на реальный
- [x] EAS production env: `EXPO_PUBLIC_DEV_PREVIEW: "0"` (dev bypass off)

### Stability & error handling
- [x] **Crash reporter scaffolding** (src/lib/crashReporter.ts) — `captureException()`
      wiring во всех catch-блоках. Активируется добавлением `EXPO_PUBLIC_SENTRY_DSN`.
- [x] **Per-tab Error Boundaries** — крах одного экрана не убивает app
- [x] **Notification deep-link** — тап на reminder открывает нужный appointment
      (плюс cold-start через getLastNotificationResponseAsync)
- [x] **Permission denial UX** — понятные сообщения когда юзер отказал в галерее
- [x] **Idempotency on auth submit** — двойной тап не создаёт 2 запросов
- [x] **BiometricGate race guard** — один in-flight prompt
- [x] **deleteAccount честность** — `serverDeleteFailed` flag → UI говорит юзеру

### UX & accessibility
- [x] WCAG AA контраст — textTertiary поднят с 3.8:1 до 4.7:1
- [x] Touch targets ≥44pt — hitSlop на chips, кнопки
- [x] **prefers-reduced-motion** в card press anim (AppointmentCard, ClientRow, ProfessionCard, ServiceChip)
- [x] **accessibilityRole/Label** на всех Pressable/TouchableOpacity (включая chips)
- [x] **numberOfLines={1}** на названиях услуг — длинные имена не ломают layout
- [x] **Small font 11pt → 12pt** — комфортный минимум для low-vision
- [x] Reduce motion в FadeInDown / Animated.View на Today (из старого аудита)

### Features
- [x] Auth: email + Apple Sign-In + Start without account
- [x] Календарь с reminder за 1 час
- [x] Local notifications + DST/leap year/year-boundary tested
- [x] Биометрический lock
- [x] **8 валют** — RUB default для СНГ, переключение в settings
- [x] **Tax PDF для самозанятых** — НПД 4% индикативно + disclaimer (моат против Booksy/Fresha)
- [x] **Sleeping clients widget** — на Today + Clients tabs, WhatsApp/Telegram/SMS draft
- [x] **Demo data toggle** — пустой Today предлагает «Попробовать с примером»
- [x] **Profession packs** — 3 пака (manicure/tutor/photographer), vocabulary swap работает
- [x] **Local-only mode** — для юзеров не желающих регистрироваться
- [x] JSON экспорт всех данных
- [x] Rate limiting auth (5/10min + cooldown)

### Tests
- [x] **156 unit-тестов**, все зелёные
- [x] TypeScript: clean (`tsc --noEmit` без ошибок)
- [x] Покрытие критичных flows: deleteAccount, sleeping clients, tax PDF, currency, notifications, packs

---

## 🔵 Что нужно сделать вне кода (внешние операции)

| # | Что | Кто | Время | Блокер? |
|---|---|---|---|---|
| 1 | Apple Developer аккаунт (есть у Насти ✅) | — | — | OK |
| 2 | Google Play Console аккаунт (есть ✅) | — | — | OK |
| 3 | **RuStore developer регистрация** | Ты | 2-3 дня модерация | Для РФ launch |
| 4 | **Demo-аккаунт в Supabase** `reviewer@masterbook.app` с сидированными данными | Ты в Supabase Dashboard | 15 мин | App Review |
| 5 | **Sentry проект + DSN** (бесплатный tier ≤ 5k events/мес) | Ты | 10 мин | После релиза без него слепые |
| 6 | **Скриншоты для всех сторов** (1080×1920 Android, 6.5"/5.5" iOS) | Симулятор + `bash scripts/take-screenshots.sh` | 1-2 часа | Submission blocker |
| 7 | **Иконка проверка всех размеров** (1024×1024 master, adaptive Android) | Дизайнер | 30 мин | Submission blocker |
| 8 | **ascAppId + appleTeamId через `eas secret`** после получения от Насти | Ты | 10 мин | iOS submit |
| 9 | **Google Play Data Safety form** | Заполнить по `docs/DATA_SAFETY.md` | 30 мин | Submission blocker |
| 10 | **Privacy Policy на live URL** — проверить открывается ли `https://jumakho2013-alt.github.io/masterbook-privacy/` | Ты | 5 мин | Submission blocker |
| 11 | **SCHEDULE_EXACT_ALARM declaration** в Play Console | Скопировать текст из `docs/ANDROID_PERMISSIONS.md` | 5 мин | Play Android 14+ |
| 12 | **Tax forms** в App Store Connect (даже для free app) | Ты | 30 мин | Submission blocker iOS |

---

## 🟡 Что нужно сделать руками (manual QA на реальном устройстве)

### Smoke test (30 мин)
- [ ] Установить чистую сборку → пройти онбординг (welcome → profession → spec → services → tabs)
- [ ] Login email + Apple Sign-In + «Начать без аккаунта» — все 3 пути работают
- [ ] Создать клиента → создать запись → дождаться нотификации за 1ч
- [ ] **Тап на нотификации** → открывается нужный appointment (deep-link)
- [ ] Завершить запись → проверить что появилась в Финансах
- [ ] Сформировать Tax PDF за текущий месяц → открыть на устройстве
- [ ] Сменить валюту RUB → KZT → проверить что цены перерисовались
- [ ] Включить Face ID → выйти из приложения → вернуться → запрос биометрии работает
- [ ] Экспорт JSON → проверить что файл валидный
- [ ] Удалить аккаунт → проверить что данные локально стёрты
- [ ] Перезапустить → флоу как для нового юзера

### Edge cases (30 мин)
- [ ] Отказать в notification permission при первом запуске → app не падает, запись создаётся, просто нет напоминания
- [ ] Отказать в photo permission → понятное сообщение «Включи в Настройках»
- [ ] Самолётный режим → создание записи работает локально
- [ ] Самолётный режим во время signUp → нормальная ошибка, не infinite spinner
- [ ] Двойной тап на «Зарегистрироваться»/«Войти» → не создаёт 2 запросов (idempotency guard)
- [ ] Имя клиента 200 символов → numberOfLines обрезает, layout не ломается
- [ ] Юникод/emoji в имени → отображается корректно
- [ ] Switch theme мгновенно — не моргает
- [ ] Background → foreground после 1 часа → запрос биометрии, данные на месте
- [ ] **Включить «Reduce Motion» в iOS Settings → press-анимации отключаются**

### Performance (15 мин)
- [ ] iPhone SE / Android low-end — плавность скролла Today/Clients
- [ ] 100+ клиентов + 200+ appointments → нет лагов
- [ ] Тап «Попробовать с примером» → демо появляется мгновенно

### CIS-specific (15 мин)
- [ ] SIM РФ оператор → Supabase auth открывается
- [ ] WhatsApp deep-link на номер 8XXX → корректно конвертирует в +7XXX
- [ ] Telegram deep-link открывает Telegram (Tg pre-fill через clipboard)
- [ ] Tax PDF открывается в Files / Sharing работает

---

## 🟠 Известные ограничения (НЕ блокеры, для honesty)

1. **Нет Supabase data sync.** Данные живут в AsyncStorage. Reinstall = data loss. Mitigation: JSON-экспорт + Tax PDF. План на v1.1.
2. **Нет online booking page.** План на v1.2.
3. **Нет IAP.** Free-only, все upgrade-baner'ы убраны. План на v1.2.
4. **Нет remote push.** Только local notifications. План на v1.1.
5. **Sentry в no-op режиме.** Все wiring готов; нужен только DSN.
6. **Только 3 profession-пака.** Расширяется добавлением JSON-файла в `src/data/packs/`.

---

## 🟢 Рекомендуемый порядок launch'а (по PLAN.md §9)

### Неделя 1: подача
1. Заполнить RuStore developer registration (модерация 2-3 дня — старт ASAP)
2. Создать demo-аккаунт в Supabase
3. Получить Sentry DSN → добавить в `eas.json` env вариант production
4. Снять скриншоты на симуляторе → загрузить в RuStore + Play Console
5. `npm run build:android` → AAB → upload в RuStore + Play (Internal Track сначала)

### Неделя 2: soft launch
1. 5-10 знакомых мастеров в Telegram → RuStore beta или APK напрямую
2. Sentry мониторинг — фиксить любые крашы за 24ч
3. Сбор фидбека → последние правки

### Неделя 3: public launch CIS
1. RuStore публичный + Google Play Internal → Production track
2. Подача в App Store (отдельная неделя у Apple на review)
3. VK / Telegram master-каналы (по `docs/growth-analysis-2026-06/08-go-to-market.md`)

### Неделя 4: iOS launch
1. После Apple approve → public iOS launch в RU/KZ (App Store)
2. Мониторинг рейтингов + Sentry + быстрые фиксы

**~3-4 недели до публичного launch в РФ.**

---

## 📊 Метрики которые нужно начать собирать после launch (через Sentry / analytics)

| Метрика | Target | Алерт |
|---|---|---|
| Crash-free sessions | >99.5% | <99% — критично |
| Cold-start time | <2s | >3s — investigate |
| D1 retention | >40% | <30% — onboarding бомба |
| D7 retention | >20% | <15% — нет stickiness |
| D30 retention | >12% | <10% — нет product-market fit |
| Local-only vs email signup ratio | TBD baseline | — |
| Tax PDF использование | >5% MAU | — |
| Sleeping clients widget tap rate | TBD | — |

---

## 🎯 Резюме

**Состояние:** релизо-готовое к RuStore beta. App Store / Play требуют ещё внешних операций (см. §🔵). Все критичные code-side гарантии compliance + a11y + stability на месте.

**Что я бы делал прямо сейчас в этой последовательности:**
1. Сегодня — RuStore developer регистрация (модерация делается ~3 дня)
2. Сегодня — Sentry бесплатный аккаунт → DSN → добавить в eas.json
3. Завтра — Demo-аккаунт Supabase + скриншоты
4. Послезавтра — `eas build production android` → AAB → RuStore beta
5. Через неделю — Soft launch на 5-10 мастеров → собрать фидбек
6. Через 2 недели — Public RuStore + Play подача
7. Через 3 недели — App Store подача

**Безопасный путь:** Soft launch на RuStore beta даёт нам shipping experience и feedback БЕЗ риска плохих публичных отзывов. App Store идёт после.
