# MasterBook — План роста: от MVP до глобального продукта

*Стратегический документ v1.0 — синтез 9 исследований + adversarial-ревью. Цифры и заявления требуют валидации первоисточниками перед финальными решениями (см. Приложение A).*

---

## TL;DR (5 пунктов)

1. **MasterBook — единственный реальный "private-first solo CRM" в нише CIS.** YClients = overkill, Dikidi = баги и тёмные паттерны, Masters App = бесит ценой, Telegram-боты = DIY-уровень. Окно есть, но закрывается через 6–9 месяцев.
2. **До публичного релиза критично 7 фиксов** (см. §2): убрать упоминания PRO без IAP, починить тихий fail в `deleteAccount.ts`, добавить 152-ФЗ согласие, очистка ВСЕХ Zustand-сторов при logout, замена `USERNAME` плейсхолдеров, реальный демо-аккаунт для ревьюера, обоснование `SCHEDULE_EXACT_ALARM`. ~25 инженерных часов.
3. **Цена для CIS: 299 ₽/мес или 1990 ₽/год** (-30%), free до 30 клиентов. Платёжный рельс — RuStore Billing для RU, ЮKassa-веб для прямого APK, Apple/Google IAP для глобальной аудитории. **iOS в России — не для v1**, целиться в KZ App Store.
4. **Четыре фичи решают всё после launch:** (1) Supabase-sync — иначе reinstall = data loss = 1-star отзывы; (2) публичная booking-page — без неё это блокнот, а не CRM; (3) WhatsApp/Telegram-напоминания клиенту (не SMS); (4) налоговый PDF для самозанятых — единственный CIS-only moat, который Booksy/Fresha никогда не построят.
5. **Реалистичная траектория для соло-инди:** 500 paying за 6 месяцев → 1 500 за 12 → $5K MRR. Глобальная экспансия (Türkiye → Восточная EU) не раньше 9-го месяца и только после доказанной D30 retention >12% в CIS.

---

## 1. Где мы сейчас (честная оценка состояния)

**Что хорошо:**
- Аудит C1–C4, V1, V2, V4–V8 закрыт; кодовая база — аккуратная Zustand+persist, RLS-политики на месте, secure storage, валидация, тесты на critical irreversible пути (`deleteAccount`).
- Liquid Glass + native iOS feel — реальный UX-differentiator против дряхлых Dikidi/YClients-мобайл-клиентов.
- Профессионально-ориентированный onboarding (manicure, brows, lashes, hair) — быстрее, чем у всех конкурентов.
- Local-first архитектура — не баг, а потенциальный moat (мастера работают в подвалах с плохим WiFi).
- Все 5 stores сохраняются локально, biometric lock, есть JSON export.

**Что НЕ работает (по 9 исследованиям):**
- **Reinstall = 100% data loss.** Это deal-breaker №1 в отзывах Dikidi («клиенты и записи начали пропадать»). Без cloud sync платный тариф запускать нельзя.
- **Нет публичной booking-page** — мастер не может вставить ссылку в Instagram bio. Это критическая фича каждого Western-конкурента.
- **Напоминания только локальные** — клиент не получает ничего. WhatsApp/Telegram deep-link отсутствует.
- **PRO упомянут в `profile.tsx`, но IAP не реализован** — Apple отклонит submission за это.
- **Stores не имеют `userId`, `updatedAt`, `deletedAt`** — sync технически невозможен; user A → logout → user B видит данные A.
- **IDs — client-generated строки, не UUID** — Supabase schema требует uuid, sync упадёт на первом insert.
- **AsyncStorage = single-blob JSON** — на 10k appointments каждый `setStatus()` пишет ~2MB и блокирует JS thread на Android >100ms.
- **Локальные фото хранятся как `file://...` URI** — после reinstall iOS-папка получает новый UUID, картинки превращаются в blank.
- **Account deletion silently fails:** RPC падает → `console.warn` → user думает, что удалил, а строка в auth.users живёт. Apple Guideline 5.1.1(v) — отклонение.
- **152-ФЗ:** нет чекбокса согласия при регистрации; нет уведомления Роскомнадзора; данные клиентов (третьих лиц) обрабатываются без правового основания.
- **Supabase region не в РФ** — для full-scale sync RU-резидентов нарушает 152-ФЗ Art. 18 п.5.
- **EAS placeholder `REPLACE_WITH_...`** — submission blocker.
- **`buildNumber:1`/`versionCode:1` хардкод** при `autoIncrement:true` — Apple отклонит на втором билде.

**Состояние одной фразой:** **«Красивый качественный приватный блокнот, но не CRM в современном понимании.»** Чтобы стать CRM — нужны sync + booking-page + client-side reminders + IAP. Без этих четырёх компонент паблик-релиз превращается в источник 1★ отзывов через 2 недели.

---

## 2. Что критично починить до публичного релиза (7 пунктов, с файлами)

| # | Что | Файлы | Effort | Почему |
|---|------|-------|--------|--------|
| 1 | Убрать или скрыть упоминания PRO/$3.99 пока нет IAP | `app/(tabs)/profile.tsx:175,196` | 30 мин | Apple Guideline 3.1.1: упоминание цены без IAP = отклонение |
| 2 | Починить тихий fail в `deleteAccount` + явная обработка ошибки RPC + сброс ВСЕХ Zustand-сторов (не только auth) | `src/lib/deleteAccount.ts:36`, `src/stores/useAuthStore.ts:76-85`, +client/appointment/finance/services | 3 ч | Apple 5.1.1(v) + cross-account contamination |
| 3 | Добавить 152-ФЗ чекбокс согласия на signup + ссылку на политику | `app/(auth)/welcome.tsx` или новый consent screen, `docs/consent.md` | 2 ч | RU legal blocker, Роскомнадзор |
| 4 | Заменить все `USERNAME` плейсхолдеры в PRIVACY_POLICY.md, APP_STORE_METADATA.md, eas.json | `PRIVACY_POLICY.md`, `docs/APP_STORE_METADATA.md`, `eas.json` | 15 мин | submission blocker |
| 5 | Создать реальный демо-аккаунт `reviewer@masterbook.app` с сидированными данными в Supabase | Supabase Dashboard + metadata | 15 мин | Apple/Google могут отклонить если не логинится |
| 6 | Удалить hardcoded `ios.buildNumber:"1"` / `android.versionCode:1` (есть `appVersionSource:remote`) | `app.json` | 5 мин | Apple отклонит дубликат buildNumber |
| 7 | Обосновать `SCHEDULE_EXACT_ALARM` в Play Console form ИЛИ перейти на `setExactAndAllowWhileIdle` | `app.json` + Play declaration form | 2 ч | Play Android 14+ требование |

**Итого: ~10 часов кода + ~1 час бумажной работы.** Без этого подача в сторы = гарантированное отклонение.

**Дополнительно полу-критично (доделать до выхода из soft-launch в публичный promo):**
- `Appointment.reminderNotificationId` добавить в тип, убрать `as any`/`as never` касты (`app/appointment/new.tsx:180`, `app/(tabs)/profile.tsx`)
- `BiometricGate` race condition (`src/components/BiometricGate.tsx:66-68`) — добавить ref для in-flight auth
- `allowBackup="false"` на Android + iCloud exclusion для AsyncStorage с чувствительными данными
- Sentry или равнозначный crash reporter (после релиза без него — слепые)

---

## 3. Позиционирование и целевая аудитория

### Кто наш пользователь
**Соло-мастер 22–40 лет, женщина (в 85% случаев), Android-владелец, работает из дома или арендует кресло.** Маникюр, брови, ресницы, парикмахер, массажист, репетитор, фитнес-тренер. 40–80 активных клиентов в месяц. Самозанятая (НПД 4%). Доход 30–150 тыс ₽/мес. Сегодня ведёт записи в бумажном блокноте, WhatsApp или Instagram Direct. Пробовала YClients — слишком сложно; Dikidi — глючит; Masters App — стало дорого. На любую SaaS-подписку 500+ ₽/мес реагирует «лучше Telegram-бот напишу». Доверяет рекомендациям коллег из VK-групп и Telegram-чатов больше, чем рекламе.

### Что мы делаем лучше всех (positioning statement)
> **«MasterBook — это твой личный мобильный кабинет: красивый, быстрый, работает оффлайн, не требует подписки на старте, твоя клиентская база живёт у тебя в телефоне, без скрытых списаний и комиссий с клиентов.»**

**Три моата:**
1. **Mobile-native polish уровня GlossGenius за цену уровня Dikidi free.** Конкуренты — web-first, с дряхлым мобайл-клиентом.
2. **Privacy-first как философия, а не фича.** Local storage + biometric + честная политика «no commission, no auto-charge без подтверждения». Прямой контраст к Booksy Boost / Мой Профи.
3. **CIS-aware:** налоговый PDF для самозанятых, СБП-предоплата, Telegram-нативный, RuStore-первый, ₽-цена без долларовой косметики.

### Чем НЕ являемся (anti-positioning)
- **НЕ салонная SaaS.** Не делаем POS, мульти-филиалы, payroll, склад, права сотрудников. Это территория YClients/Altegio.
- **НЕ маркетплейс.** Не берём процент с записей, не «помогаем найти клиентов» за 30% (StyleSeat/Мой Профи).
- **НЕ универсальный планировщик.** Не для коучей B2B (Calendly), не для медицины (Acuity Powerhouse).
- **НЕ программа тренировок.** Trainerize/WeStrive — другая категория, не лезем.
- **НЕ заменяем «Мой Налог».** Интегрируемся (если получится через API), но не пытаемся заменить ФНС-приложение.

---

## 4. Дорожная карта по версиям

### v1.0 — Launch CIS (текущий релиз)
**Включено:** Calendar, Clients, Appointments, Finance, Services, Photos per visit, Local reminders, Biometric, JSON export, профессионально-ориентированный onboarding, Liquid Glass UI, ru/en locales.
**Каналы:** RuStore (primary), AppGallery, Google Play (CIS regions), GitHub Pages landing.
**iOS:** отложен (см. §9 — отсутствие Apple Developer Program доступа для RU-резидентов делает v1 iOS = риск).
**Цель:** 500 установок, 50 paying (founding cohort lifetime ₽2 990).

### v1.1 — Trust foundation (30–60 days post-launch)
**Цель: убрать главный churn-trigger (data loss) и добавить hooks для retention.**
- **Supabase sync с outbox-паттерном** (обязательное условие — добавить `userId`, `updatedAt`, `deletedAt`, `version` во все stores; UUID-генератор через `react-native-get-random-values`; миграции с `version:1`).
- **Token-revoke handling в `_layout.tsx`** через `onAuthStateChange`.
- **Migration plan для существующих локальных данных** в новую схему.
- **Real push notifications** (Expo push API + Edge Function на pg_cron) — для клиента (через WhatsApp/Telegram deep-link, поскольку у клиента нет приложения).
- **Public booking link v1 (static):** `masterbook.app/u/<slug>` с услугами, ценами, расписанием read-only + кнопкой «записаться» → WhatsApp/Telegram deep-link мастеру.
- **Contacts import** (`expo-contacts`) — снимает barrier «200 контактов в блокноте».
- **Photo persistence fix:** копировать picked photo в `documentDirectory/appointments/{id}/{uuid}.jpg`, хранить relative path.
- **Demo data mode** на welcome screen.
- **Морнинг-саммари push (08:00)** + вечерний nudge (20:00) для неподтверждённых платежей.
- **«Завершить и записать на следующий визит» combo-action** в appointment detail.
**Цель:** 5 000 установок, 300 paying, $1K MRR.

### v1.2 — Monetization unlock (60–120 days)
- **RuStore Billing SDK** для PRO-подписки (₽299/мес, ₽1990/год). См. §5.
- **Google Play IAP** для не-RU CIS регионов (KZ/UZ/AM работают через Play напрямую).
- **PRO+ tier (₽599/мес)** с booking-page interactive (real-time slots), мульти-master mode для мини-салонов (1 owner + 2 employees).
- **Tax PDF для самозанятых** (доход по услугам, готов к загрузке в «Мой Налог»). Единственный CIS-only moat — Booksy/Fresha никогда не построят.
- **Multi-currency** (₽/₸/BYN/USD/€) с миграцией существующих USD-хардкод-данных в RUB для RU locale.
- **Referral mechanics:** уникальный код, +30 дней PRO за конвертнувшегося друга.
- **Recurring appointments** («коррекция через 3 недели») — single biggest workflow accelerator.
- **Client blacklist / «ненадёжный» флаг** с авто-предупреждением при rebook.
- **Pause subscription** (до 3 месяцев) — retention move которого нет у конкурентов.
**Цель:** 10 000 установок, 700 paying, $3K MRR.

### v1.3 — Differentiating layer (120–180 days)
- **СБП-предоплата** (soft deposit 10–15%, не full prepay) для борьбы с no-show — через ЮKassa или Тинькофф API. **Юридическая обвязка:** мастер должен быть ИП/самозанятым; receipt 54-ФЗ через АТОЛ/Бизнес.Ру (это блокер, см. Приложение A).
- **Telegram-bot mirror v1:** `@masterbook_bot` + pair phone via QR. Все записи и напоминания читаются/правятся в TG.
- **Auto-restock alerts** (логирование материалов + прогноз depletion → deep-link на Wildberries/Ozon с affiliate).
- **Personalized AI reminder drafting** (через Yandex GPT для RU — НЕ OpenAI, IP блокирован).
- **iOS Home Screen widget** «следующая запись» — drives daily active.
- **Heat-map «лучший день недели»** + churn-risk badge.
**Цель:** 18 000 установок, 1 200 paying, $4.5K MRR.

### v1.4–v1.5 — Глубина (180–240 days)
- **«Финансовый компас»** — еженедельный summary с goals и actionable next steps.
- **Apple Wallet / Google Wallet appointment pass** для клиента.
- **Voice input** для appointment creation (нужны мокрые руки → voice wins).
- **Burnout warning** (>60 часов в неделю → предупреждение). Free TikTok-маркетинг.
- **Procedure timer** встроенный (15-мин для polymer, 8 мин для гель-лака).
- **Shareable «Booked!» story** для Instagram/TG.
- **Receipt OCR** для расходов.
**Цель:** 30 000 установок, 2 000 paying, $7K MRR.

### v2.0 — Global expansion (240+ days)
- **Полная i18n:** EN, TR (приоритет), KK, KA, UK, ES, PT-BR.
- **Multi-currency proper** с PPP-pricing per Apple/Google price tiers.
- **Türkiye launch** — TRY, турецкий, Iyzico/PayTR. Slabye competition (Booksy/Fresha дорогие, SalonLife локализовался только в 2025).
- **Восточная EU** — RON/BGN/EUR, Stripe.
- **Apple App Store global** (выходим из KZ-only).
- **ProductHunt launch** (один выстрел — beregchi v1.5).
**Цель к месяцу 18:** 60 000 установок, 4 000 paying, $15K MRR (sustainable для команды из 2 человек).

---

## 5. Монетизация (конкретный план)

### Тарифы для СНГ

| Тариф | Цена | Что входит |
|-------|------|------------|
| **Free** | 0 ₽ | До **30 клиентов**, безлимитные записи и услуги, базовая финансовая статистика, local reminders, biometric, JSON export |
| **PRO** | **299 ₽/мес или 1990 ₽/год (-30%)** | Безлимит клиентов, фото per visit, финансовые графики и экспорт, PDF tax report, multi-device sync, push клиенту, повторяющиеся записи |
| **PRO+** | **599 ₽/мес или 4990 ₽/год** | Всё из PRO + публичная booking-page interactive, СБП-предоплата, мульти-master (до 3), white-label PDF |

**Локализация:**
- BY: 9.90 BYN/мес
- KZ: ₸1 690/мес
- UZ: 39 000 UZS/мес
- AM: 1 490 AMD/мес
- Глобал (USD): $4.99/мес, $39/год

**Founding cohort:** Первые **100 пользователей — Lifetime PRO за ₽2 990 единоразово.** Cash flow ₽299K на первые 6 месяцев, evangelists. Реальный счётчик «23 из 100 осталось» в приложении.

### Почему 30 клиентов в free, не 20

Активный мастер имеет 40–80 клиентов/месяц. Лимит в 20 срабатывает на первой неделе — до того как сформировалась привычка → отказ + refund. 30 — попадает на 3–4 неделю, когда мастер уже зависим. ProfitWell-стиль данные показывают +5–8% к conversion при лимите, который срабатывает после формирования habit. **Caveat:** это гипотеза, валидировать через A/B первой и второй когорты.

### Платёжные рельсы (что вместо Apple/Google IAP в России)

| Канал | Рельс | Комиссия | Статус |
|-------|-------|----------|--------|
| RuStore build (RU) | **RuStore Billing SDK** (СБП + Mir/MC/Visa RU) | tiered (см. RuStore docs — нужно валидировать) | Primary |
| AppGallery build (RU) | HMS IAP | ~15% | Secondary |
| Google Play (KZ/UZ/AM/BY) | Play Billing | 15% (под $1M ARR) | Глобал CIS |
| Direct APK (с GitHub Pages) | **ЮKassa subscription via webview** + 54-ФЗ receipts через АТОЛ онлайн | ~3.5% + fixed | Power users |
| Telegram-bot temp bridge (first 50 paying) | Telegram Stars или manual transfer | 30% (Stars) или 0% (manual) | Только для founding cohort |
| iOS — KZ/AM App Store | Apple IAP | 15% (Small Business) | После v1.5 |

**Не пытаемся:** Google Play в RU (заблокирован для платежей), Apple IAP в RU (заблокирован), Stripe для RU (sanctions).

**ВАЖНЫЕ блокеры (см. Приложение A):**
1. **ЮKassa требует ИП или самозанятого** у разработчика MasterBook + ОФД-чеки (54-ФЗ) для подписок RU-юзерам. Без этого — продажа нелегальна. Нужно зарегистрировать ИП и интегрировать АТОЛ/Бизнес.Ру до v1.2.
2. **RuStore Billing fee** — в источниках разнобой (5–10% vs 15%). До финального решения по ценам прочитать RuStore developer docs напрямую.
3. **Apple Developer Program** для RU-резидента после 2022 — оплата $99 с RU-карты недоступна. Нужен KZ/AM/Georgia entity или прокладка через зарубежного партнёра. Это **не для v1**; iOS откладывается.

### Триггеры конверсии Free → PRO

В порядке приоритета (показ paywall):
1. **«Клиент пришёл благодаря авто-напоминанию»** — после первого confirmed appointment, который изначально был «scheduled+reminder sent». Hook: «Хочешь, чтобы это работало для всех клиентов?»
2. **30/30 клиентов в free.** Показать exact paywall с указанием, какая попытка добавления упирается в лимит.
3. **Конец месяца + хороший доход** — push «Заработал ₽87 400 — построй график динамики на PRO».
4. **Попытка экспорта PDF** (free даёт только JSON).
5. **При попытке включить sync на втором устройстве.**
6. **После 7 завершённых записей подряд.**

**НЕ paywall'им:** базовые reminders, добавление appointment, поиск, основной calendar view, JSON export. Эти фичи — survival; их paywall = «приложение хуже бумажного блокнота».

---

## 6. Продуктовая дифференциация (Top 8 фич с уникальностью)

| # | Фича | Уникальность | Effort | Версия |
|---|------|--------------|--------|--------|
| 1 | **Tax PDF для самозанятых** (НПД 4%/6% pre-calc, готов к Мой Налог) | **CIS-only moat.** Booksy/Fresha/GlossGenius никогда не построят. Самозанятых в РФ ~12M, рост 30%/год. | M (1–2 нед) | v1.2 |
| 2 | **Privacy-first storytelling** (local data, no commission, no auto-charge без подтверждения) | Marketing moat в категории, где Booksy Boost / Мой Профи известны dark-pattern'ами | S | v1.0 копирайт |
| 3 | **Telegram-bot mirror + booking бот** | Telegram — главный канал в CIS. Любой Western competitor deprioritize. Distribution channel сам по себе. | L (3–6 нед) | v1.3 |
| 4 | **СБП soft deposit (10–15%)** для no-show shield | Полный prepayment отторгает CIS-клиентов; soft deposit с СБП — найден баланс. | L | v1.3 (после legal) |
| 5 | **Public booking page** (`masterbook.app/u/<slug>`) | Table-stakes у Western, отсутствует у Dikidi-free. Сразу ставит в один ряд с YClients widget за ₽686. | XL (но v1 — static) | v1.1 static / v1.2 interactive |
| 6 | **Liquid Glass + true OLED dark** | Visual quality бар. Конкуренты не могут догнать без переписки. | M (continuous polish) | v1.0+ |
| 7 | **Offline-first как philosophical stance** | Подвалы, метро, домашние визиты — есть. После sync — это становится фичей, а не багом. | (уже есть, нужно явно сказать в Store description) | v1.0 |
| 8 | **AI reminder draft (через Yandex GPT)** + voice input | Не «AI ради AI», а конкретная экономия 5–10 мин/день. RU-аware (Yandex GPT > OpenAI здесь). | M | v1.3 |

**НЕ в Top 8 (низкая уникальность или поздно):** мульти-currency, повторяющиеся записи, recurring — это table-stakes, входят в v1.1–1.2 как обязательное, но не дифференциаторы.

---

## 7. UX / Onboarding улучшения (Top 10)

| # | Что | Где | Impact |
|---|-----|-----|--------|
| 1 | **Demo data mode на welcome** + 2 равно-видные кнопки «Начать» / «Посмотреть как работает» | `app/(auth)/welcome.tsx`, новый `src/data/demo-seed.ts` | Activation +15–25% |
| 2 | **Collapse onboarding с 4 экранов до 2:** убрать standalone «Ваше имя», слить specialization в profession (sectioned chips) | `app/(auth)/services-setup.tsx`, `specialization.tsx`, `profession.tsx` | Onboarding completion +10–15% |
| 3 | **Contacts import** на empty Clients screen (`expo-contacts`) — 30 строк кода, 200 контактов за 10 секунд | `app/(tabs)/clients.tsx` | **Single biggest activation lever** |
| 4 | **Context-aware FAB на «Сегодня»:** после завершённого визита FAB становится «+ Повторить» с предзаполненным client/service | `app/(tabs)/index.tsx` | Retention (rebook density) |
| 5 | **Global search** через pull-down (clients/appointments/services) | новый `src/components/GlobalSearchSheet.tsx`, hook в `app/(tabs)/_layout.tsx` | Power-user retention |
| 6 | **Long-press на calendar day или time-slot** → quick-add appointment с pre-filled date/time | `app/(tabs)/calendar.tsx` | Calendar становится tool, не viewer |
| 7 | **One-tap call** с client row (phone icon рядом с chevron); long-press = detail | `src/components/ClientRow.tsx` | Daily action friction down |
| 8 | **Morning summary push (08:00) + Evening payment review (20:00)** | `src/lib/notifications.ts` + settings | DAU +20–30% |
| 9 | **One-line plain-Russian summary** в Finance над графиком: *«В июне заработали 87 400 ₽, на 12% больше мая»* + swipe между месяцами | `app/(tabs)/finances.tsx` | Perceived tab value up |
| 10 | **Microcopy pass** — «Поехали» вместо «Готово», «По запросу ничего» вместо «Никого не нашли», без формального register | central `src/lib/copy.ts` | Compounds across screens |

**Sprint plan (5 недель):**
- Sprint 1 (1 нед): #3, #1, #2, #10, OLED dark theme polish
- Sprint 2 (1 нед): #8, #4, #7, finish-and-rebook combo
- Sprint 3 (1.5 нед): #5, #6, day-timeline calendar mode, #9
- Sprint 4 (1.5 нед): one-handed ergonomics, accessibility audit (dynamic type, font scale cap 1.3)

---

## 8. Go-to-market (0-30, 30-90, 90-180 дней)

### 0–30 дней: Soft launch CIS
- **Pre-launch (-4 нед):** Telegram-канал `@masterbook_ru` запущен сразу с 0 подписчиков, посты behind-the-scenes; landing v2 с hook «Первые 100 — Lifetime PRO за ₽2 990»; waitlist drip 3 emails.
- **Submission:** RuStore (primary), AppGallery, Play (CIS regions: RU, BY, KZ, UZ, AM, KG). iOS — пропускаем до решения с Apple Developer entity.
- **Outreach (manual, 0 ₽):** 50 VK групп beauty + 20 Telegram-каналов мастеров + 30 nano-Instagram (1–10K). Подход: предложить admin'у free PRO Lifetime в обмен на честный обзор. Никакого спама.
- **Цель:** 500 установок, 50 paying. Validation funnel в KZ первой (более лёгкое модерирование, меньше политических рисков).

### 30–90 дней: Validate & Iterate
- **Sync ship'ится первым** — это снимает 1★ риск.
- **vc.ru founder post** «Как я один сделал CRM для мастеров — почему YClients для нас не работает». Single shot, рассчитан на 500+ upvotes, 500–2000 installs в 48ч.
- **Habr** — технический пост (Expo SDK 54 + Supabase RLS lessons). Wrong audience для скачиваний, right audience для credibility + GitHub stars.
- **Referral mechanics live**, измеряем k-factor.
- **Первые 100 отзывов** — каждый отвечен лично в течение 48ч.
- **Tinkoff Журнал / Точка / Своё Дело** — pitch как tool for самозанятых.
- **Apple App Store** — решение по KZ/AM entity. Если получается — submit KZ-only.
- **Цель:** 5 000 установок, 300 paying, $1K MRR. Pricing iteration if conversion <3% — тест ₽149/мес для первой когорты.

### 90–180 дней: Global prep + Scale
- **Full i18n** (EN, TR — приоритет), multi-currency, USD/EUR price tiers.
- **PRO+ tier** с booking-page interactive.
- **Türkiye soft launch** — TRY, Iyzico, локальный landing.
- **ProductHunt** — приберечь для v1.5 (sync + booking + widget + tax PDF). Tuesday launch, hunter с аудиторией.
- **First paid acquisition test** (Yandex.Direct CIS, $200 cap) — ТОЛЬКО после доказанной D30 retention >12% и free→paid >4%. Иначе paid amplifies losses.
- **Цель:** 20 000 установок, 1 500 paying, $5K MRR — sustainable для соло.

### Support stack (от 0 до 1000 пользователей)
- **In-app «Помощь» → Telegram chat `@masterbook_support`** — primary. Async, RU users prefer 10:1 vs email.
- **Email fallback** `hi@masterbook.app` для App Store reviewers + iOS users без TG.
- **Public FAQ на GitHub Pages** — top 20 вопросов = -60% тикетов.
- **SLA:** 24ч weekdays, 48ч weekends. Опубликовать.
- At 1000+ → Crisp/Intercom Starter ($25/мес).

---

## 9. Store compliance чеклист (Play / App Store / RuStore / AppGallery)

| Требование | Play | App Store | RuStore | AppGallery | Effort до v1.0 |
|------------|------|-----------|---------|------------|----------------|
| Target SDK 35 | ✅ | n/a | ✅ | ✅ | 0 (Expo SDK 54 default) |
| AAB | ✅ | n/a | ✅ | ✅ | 0 |
| Apple Sign-In | n/a | ✅ Required | n/a | n/a | 0 |
| Account deletion (in-app) | ✅ Required | ✅ Required | ✅ Required | ✅ | **3ч (fix silent fail)** |
| Account deletion (web URL) | ✅ Required | n/a | n/a | n/a | **1ч (`/account-deletion` page)** |
| Data Safety form | ✅ | n/a | n/a | n/a | 30 мин (правка phone caveat) |
| Privacy manifest (Xcode 16) | n/a | ✅ | n/a | n/a | 1ч (audit + правки) |
| Privacy Policy URL | ✅ | ✅ | ✅ | ✅ | 5 мин (заменить USERNAME) |
| ToS / EULA | recommended | recommended | ✅ Required for paid | recommended | **6ч + юрист** |
| 152-ФЗ consent screen | n/a | n/a | ✅ Required | ✅ Required (RU) | **2ч** |
| 152-ФЗ Роскомнадзор notification | n/a | n/a | de facto required | de facto required | 3ч paperwork + ~1 месяц wait |
| 152-ФЗ data residency RU | n/a | n/a | OK while AsyncStorage-only; problem at sync | same | **defer to v1.1**, migrate to Yandex Cloud/VK Cloud (~80ч) ИЛИ self-hosted Supabase в РФ |
| 54-ФЗ ОФД receipts (paid) | n/a | n/a | ✅ Required for digital subs | ✅ | **defer to v1.2 (when paid ships)** ~16ч интеграция АТОЛ |
| Reviewer demo account | ✅ | ✅ | ✅ | ✅ | 15 мин |
| Content rating IARC | ✅ | ✅ (4+) | ✅ | ✅ | 0 (already done) |
| SCHEDULE_EXACT_ALARM justification | ✅ Required | n/a | n/a | n/a | 2ч |
| 16 KB page size (Nov 2025) | ✅ | n/a | n/a | n/a | 0 (Expo 54+) |
| HMS Push Kit (для push на Huawei) | n/a | n/a | n/a | optional v1, required v1.1+ | defer |
| `allowBackup=false` on Android | safety | n/a | safety | safety | 1ч |
| iCloud backup exclusion | n/a | safety | n/a | n/a | 30 мин |

**Top 12 blockers до подачи** (повторение из §2 + §9):
1. Hide PRO mentions / implement IAP
2. Fix `deleteAccount` silent RPC fail + reset всех stores
3. 152-ФЗ consent checkbox
4. USERNAME placeholders
5. Real reviewer demo account
6. SCHEDULE_EXACT_ALARM justification
7. Account deletion web URL
8. `allowBackup=false`
9. Supabase region = EU (если планируем EU)
10. Minimal ToS (`docs/TERMS.md`)
11. Роскомнадзор уведомление (long lead, начать сейчас)
12. ИП регистрация (для ЮKassa в v1.2 — начать сейчас)

---

## 10. Технический долг и масштабирование (что чинить когда)

### Чинить ДО v1.1 (sync) — иначе sync не построится
- Add `userId`, `updatedAt`, `deletedAt`, `version` ко всем stores с `version:1` migration
- UUID-generator вместо `generateId()` (`react-native-get-random-values` + `uuid v9`)
- Outbox-паттерн для всех мутирующих действий, drain on NetInfo online
- Photo persistence: копировать в `documentDirectory/appointments/{id}/{uuid}.jpg`, хранить relative path
- Token-revoke handling в `_layout.tsx`
- Sign-out wipes ALL Zustand stores

### Чинить ДО 500 paying users (предотвращение performance fall-off)
- Migrate AsyncStorage → MMKV (`react-native-mmkv`) — 30× быстрее, row-keyed, не блокирует JS thread
- O(N×M) join fix в clients/appointments listing — memoize sleepingClients
- BiometricGate race condition fix
- Phone number normalization (E.164)
- Sentry + source maps via EAS

### Чинить ДО Türkiye launch (v2.0)
- Phone number normalization per country
- Holiday-aware calendar library (RU «перенесённые дни», TR лунный календарь)
- Currency: integer minor units + ISO code, не float ₽
- i18n proper (intl-messageformat для plural, RTL test для EU markets)
- Supabase region split / Yandex Cloud for RU residents (152-ФЗ Art. 18 п.5)

### Тech debt, который ТЕРПИТ
- `as any` касты в navigation (cosmetic, typedRoutes broken — рефакторить при следующем `expo customize`)
- `getDaysAgo` UTC vs local timezone edge case (off-by-one only at midnight)
- Calendar `monthGrid` rebuild — minor performance, < 100ms
- ESLint + Prettier + husky — добавить, но не блокирует ничего

---

## 11. Метрики успеха

### North Star
**Weekly Active Masters with ≥3 appointments created/that week.**
Не DAU — мастера workflow-tool, не daily-content app.

### Activation (within 48h of install)
**3 clients added + 1 appointment + 1 finance entry (auto from completed appt).**
Target: **35% activation rate** (industry норма для productivity-vertical: 25–40%).

### Retention (cohort-based)
| Метрика | Target v1.0 | Target v1.2 (after sync) |
|---------|-------------|--------------------------|
| D1 | 45% | 55% |
| D7 | 25% | 35% |
| D30 | 12% | 18% |
| D90 | 7% | 12% |

### Conversion to PRO
| Когорта | Conservative | Target | Stretch |
|---------|--------------|--------|---------|
| CIS (₽299) | 3% | **5%** | 8% |
| Türkiye (₺79) | 4% | 6% | 9% |
| Global ($4.99) | 4% | **7%** | 10% |

**Caveat:** эти числа — гипотезы из generic SaaS-benchmarks. Реальная конверсия CIS-самозанятых на 20–30-client gate может быть 1% или 12%. Перепроверять каждый месяц.

### Churn (monthly, paid users)
- v1.0 (без sync): ожидаем 8–10%/мес (data loss panic)
- v1.2 (со sync): target 4–5%/мес
- v1.5 (с retention loops): target 3%/мес

### Unit economics — break-even points
- 100 paying = ₽25K/мес net (after RuStore fee) — продолжение разработки в свободное время
- 200 paying = ₽50K/мес — indie sustainable
- 500 paying = ₽125K/мес — full-time viable solo
- 1 500 paying = ₽375K/мес — можно нанять второго инженера

### Что считаем провалом (и что делаем)
- D30 < 8% к месяцу 4 → fundamental product-market fit issue, не маркетинг
- Free → PRO conversion < 2% за 60 дней после v1.2 → cut price, repackage tiers
- > 30% paid юзеров отменяют в первые 30 дней (refund zone) → onboarding-paywall mismatch
- App Store рейтинг < 4.0 → review-prompt timing wrong или critical bug в production
- < 100 paying за 6 месяцев в CIS → пересмотр всей CIS-стратегии, возможно pivoting на Türkiye-first

---

## 12. Риски и митигация (топ 5)

| # | Риск | Вероятность | Impact | Митигация |
|---|------|-------------|--------|-----------|
| 1 | **Apple Developer Program недоступен RU-резиденту** — нельзя опубликовать в App Store вообще | Высокая | Catastrophic для глобал | KZ/AM entity через партнёра до v1.5. Параллельно: Telegram-бот distribution channel (даже если App Store откажет — TG bot reach intact). PWA-mirror на app.masterbook.ru как Russia iOS fallback. |
| 2 | **152-ФЗ + Supabase region** — sync для RU-резидентов нелегален без RU-серверов | Очень высокая (при v1.1) | High | Опции: (a) self-hosted Supabase в Yandex Cloud / VK Cloud (~80ч), (b) запретить sync для RU-пользователей (потеря ключевой v1.1 фичи), (c) дождаться Supabase RU region (вряд ли). **Рекомендация:** опция (a), начать research сейчас. |
| 3 | **OFAC sanctions на сервисы (Supabase US-based, Expo EAS US-based)** — могут заблокировать RU traffic / RU developer accounts | Средняя | Catastrophic | (a) Платить EAS / Supabase через не-RU bank entity. (b) Альтернатива EAS — local React Native build pipeline. (c) Backup plan: self-host Supabase. |
| 4 | **No-show / refund storm в первый месяц после launch** из-за reinstall=data loss | Очень высокая если запустим v1.0 паблик | High | **НЕ запускать публичный promo до ship v1.1 sync.** Soft launch только. В Store description честно: «v1.0 stores data locally, cloud sync coming в v1.1». |
| 5 | **Competitive response от YClients / Dikidi** — снижение цен, копирование mobile-first UX | Средняя в первые 6 мес, высокая через год | Medium | (a) Скорость итерации соло-инди > корпорация. (b) Build moat в CIS-only фичах (tax PDF, Telegram, СБП) которые YClients не построят быстро. (c) Не воевать за маркетплейс-сегмент — пусть забирают Booksy-like игроки. |

**Дополнительные риски ниже top 5, но требующие внимания:**
- LLM-стоимости при scaling AI-features (Yandex GPT тарификация ~₽0.20 за 1K токенов → ₽20–40/paying user/мес если включать в free) → AI только в PRO+ tier
- 54-ФЗ ОФД-чеки — нелегальная продажа подписок RU-юзерам без АТОЛ интеграции → блокер v1.2
- Huawei aggressive battery killer убивает background reminders → тестировать на реальном Huawei до RuStore submission

---

## Приложения

### A. Контр-аргументы от ревью (что может пойти не так)

**1. Цены конкурентов из affiliate-blog'ов могут быть устаревшими.** GlossGenius $24, Booksy $29.99, Fresha «killed free tier» — все из `slotcut.com` / `costbench.com`. До финальных pricing-решений: проверить каждого vendor'а напрямую на /pricing-странице. Если Fresha не убрала free tier — наша «премиум-местоположение по цене Dikidi-free» теряет actuality.

**2. Размер ниши: 12M или 9M самозанятых?** Источники конфликтуют. Beauty-доля «6–7%» в Output 5 не имеет citation. **Действие:** ФНС официальные данные перепроверить до broad-marketing claims.

**3. Conversion 5% CIS / 7% global — пустая гипотеза.** Generic SaaS benchmarks плохо переносятся на CIS-самозанятых с 30-client gate. Реальная конверсия может быть 1% (тогда break-even сдвигается на 6 месяцев) или 10% (тогда план перевыполнен). Treat as hypothesis, validate в первые 60 дней.

**4. ЮKassa требует ИП + 54-ФЗ ОФД-receipts.** «ЮKassa через webview» в исследовании Output 5 — handwave. Без АТОЛ/Бизнес.Ру + ИП — продажа цифровых подписок RU-юзерам **незаконна.** Это блокер v1.2, начать ИП-регистрацию **сейчас.**

**5. Apple Developer для RU-резидента — broken.** Apple Developer Program $99/year оплата с RU-карты не работает с 2022. Заявление Output 9 «Russian Apple ID accounts still work» — true для consumers, false для devs. iOS-strategy без KZ/AM entity — fantasy.

**6. RuStore Billing fee unclear (5–10% vs 15%).** Прямое противоречие между источниками. До финального unit-economics — прочитать RuStore docs.

**7. «Apple removed IAP capability for RU-region apps entirely»** — overstated. Apple отключил RU-card billing, не IAP entirely. Пользователи с foreign-funded Apple ID в RU могут покупать.

**8. ФНС API для «Мой Налог»** — не открытый. Tax-PDF фича обещает «готов к загрузке в Мой Налог», но прямого API integration нет. Workaround: PDF, который пользователь вручную копирует в «Мой Налог». Не «one-tap submission».

**9. OFAC / Supabase exposure.** Supabase = US-based. При scaling RU-traffic может попасть под санкционный режим. Не «может», а «будет». Self-hosted Supabase в RU — единственный долгосрочно безопасный путь.

**10. AI-features требуют Yandex GPT, не OpenAI.** OpenAI API заблокирован для RU IP на server-side. Это меняет prompt-engineering и cost-structure. Не plug-and-play.

**11. Push notifications без GMS на Huawei/Xiaomi умирают.** «Local notifications work» — теоретически. Практически — Xiaomi/Huawei aggressive battery killers убивают `expo-notifications` background. Один пропущенный reminder = uninstall. Тестировать на реальных устройствах.

**12. Telegram Stars 30% fee + serый правовой статус Telegram в РФ.** Headhopping platform для founding cohort, не для scale.

**13. Самозанятый cap ₽2.4M/year.** Top-paying мастера будут upgrade'иться в ИП после полугода-года. Tax-PDF feature должна поддерживать ИП-режим (УСН 6%) в v1.3, иначе теряем самых ценных пользователей в момент когда они становятся ценнее всего.

**14. EAS Build itself — US-сервис.** Solo dev в RU платит $99/мес Expo через international card = friction. Backup: local build pipeline или Bitrise.

### B. Источники / ссылки

**Конкурентный анализ CIS (Output 2):** YClients, Dikidi, Masters App, Мой Профи, EasyWeek, Altegio, GBooking, Rubitime, Beauty-Bot Telegram. *Caveat: review-quotes из otzovik/rustore.ru — sampled, не репрезентативны.*
- [yclients.com/tariff](https://yclients.com/tariff)
- [dikidi.ru/promo](https://dikidi.ru/promo)
- [rustore.ru — ru.jamsoft.masters](https://www.rustore.ru/catalog/app/ru.jamsoft.masters)
- [crmindex.ru/dikidi](https://crmindex.ru/products/dikidi/reviews)

**Глобальный конкурентный анализ (Output 3):** Booksy, Fresha, Square Appointments, GlossGenius, Vagaro, Setmore, Acuity, Calendly, StyleSeat, Mangomint, Trainerize. **Caveat:** все цены из affiliate-blog'ов — валидировать перед использованием.
- [biz.booksy.com/en-us/pricing](https://biz.booksy.com/en-us/pricing)
- [glossgenius.com/pricing](https://glossgenius.com/pricing)
- [squareup.com/us/en/appointments/pricing](https://squareup.com/us/en/appointments/pricing)

**Audience research (Output 4):**
- [Minfin — 12M самозанятых](https://minfin.gov.ru/ru/press-center/?id_4=39510-fns_chislo_samozanyatykh_v_rf_dostiglo_bolee_12_mln_chelovek) — *проверить актуальность*
- [vc.ru — бесплатная альтернатива YClients](https://vc.ru/services/2792550-besplatnaya-alternativa-yclients-dlya-masterov-krasoty)
- [pact.im — клиенты не приходят](https://www.pact.im/blog/klienty-zapisyvayutsya-v-salon-no-ne-prihodyat-chto-delat)
- [@blacklistmaster Instagram](https://www.instagram.com/blacklistmaster/)

**Compliance / legal (Output 9):**
- Apple App Store Review Guidelines 4.8, 5.1.1(v), 3.1.1
- Google Play target SDK 35 / 16 KB page size policies (2025)
- 152-ФЗ (Российский ФЗ «О персональных данных»), Art. 9, 18 п.5
- 54-ФЗ (ОФД-чеки)
- RuStore developer docs (требует прямой verification)

**Monetization (Output 5):**
- RevenueCat State of Subscription Apps 2025 (paid report)
- ProfitWell freemium benchmarks — *generic, не CIS-specific*

**UX research (Output 6):** аудит самого репозитория `/Users/jumakho2013gmail.com/Projects/masterbook-app/.claude/worktrees/wonderful-wilbur/`

**Дальнейшая работа:**
- Валидировать pricing каждого конкурента напрямую перед v1.2 IAP ship
- ФНС registry — точные цифры по beauty/wellness sub-vertical
- RuStore Billing fee tier — точная таблица
- Apple/Google IAP availability per CIS country — actual test
- 152-ФЗ юрист consult — обязательно до v1.1 sync ship
- Yandex GPT pricing + RU-availability of LLM features — test перед v1.3

---

*Конец документа. v1.0 strategic plan, требует ежемесячного revisit после launch и validation метриков.*