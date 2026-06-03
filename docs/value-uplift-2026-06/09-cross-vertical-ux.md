# Cross-Vertical UX for MasterBook: Serving 50 Professions Without Fragmenting the App

## Lessons from successful multi-vertical apps

**Square** is the gold standard. One POS, used by salons, food trucks, plumbers, and lawyers. Their trick: a thin profession-selection layer at signup pre-configures the dashboard, default item catalog, and language ("tip" vs "gratuity" vs "service charge"), but the underlying primitives (item, sale, customer) never change. Switching industries doesn't migrate data — it just re-skins terminology.

**Notion** went the opposite direction: zero opinion. Every team builds their own. Result: 6-month time-to-value and high churn for non-power users. Lesson: **opinionated defaults beat infinite flexibility for solo operators.**

**Calendly** picked the middle path: event types (15-min intro, 60-min consult, 4-hour shoot) are user-defined, but the booking flow is fixed. Vertical-specific templates exist as starting points but converge to the same primitives.

**Linear** is single-vertical (engineering teams) but worth noting for its restraint — they refused to "support marketing teams too" and kept conversion rates 3× competitors. **Don't underestimate the cost of pretending to serve everyone.**

The pattern: **shared primitives + per-vertical seed data + per-vertical vocabulary layer**. MasterBook already has the primitives (Client, Appointment, Service, Income). What's missing is the structured vocabulary/seed/microcopy layer.

---

## Concrete recommendations

### 1. Onboarding fork

Current flow lives in `/app/(auth)`. Audit suggests profession picker exists but is flat. Redesign:

- **Search-first, grouped fallback.** A search box on top ("Кем вы работаете?"), with groups below: Красота и уход, Здоровье, Образование, Ремонт и сервис, Творчество, Юр./Фин. услуги, Спорт и фитнес, Другое. Search beats hierarchy when users know their answer but groups help discovery.
- **"Не вижу свою профессию" → generic pack.** Don't dead-end them. A "Универсал" pack with neutral defaults (Client, Appointment, Service) ships as the fallback.
- **Subspecialty as optional second step**, skippable. Hair → "стрижки / окрашивание / барбер / уход". Tutor → "школьные предметы / иностранные языки / музыка / репетитор-вуз". Only show when it materially changes defaults.
- **Pre-populated services with local currency prices** based on 2026 market data per region. User can delete/edit before finishing. Aim for 5-7 services, not 15.
- **"Настрою позже" button on every onboarding screen.** Track skip rate per step as a UX KPI.
- **Profession change is reversible.** Settings → Профессия → re-pick. Data stays; only labels, default reports, and visible features change. Critical because users often pick wrong on day 1.

### 2. Vocabulary swap

Architecture: don't make 50 i18n files. Make **one base i18n + per-profession-pack overrides.**

```
i18n/ru.json                       — base terms (default: "клиент", "запись")
data/professions/tutor.ts          — overrides: client→"ученик", appointment→"занятие"
data/professions/vet.ts            — overrides: client→"владелец", subject→"питомец"
```

Resolution order at render time: `t('client.singular')` first checks active profession pack overrides, then falls back to base i18n. One function: `tProf(key)` instead of `t(key)`. Migrate gradually — wrap high-visibility strings first (tab names, list headers, button labels).

Vet is the interesting case: it has **two subjects** (owner + pet). Either model pet as a property of client (cheap, works for solo vet) or as a separate entity (heavy, do later). Recommend property on Client for v1 — `client.pets: Pet[]`.

### 3. Microcopy variance — без 50 файлов

Three-tier approach:
1. **Base copy** in `i18n/ru.json` — neutral wording.
2. **Profession token replacement.** "Напомнить о {{appointmentType}}" where `appointmentType` is resolved per pack (запись / занятие / приём / съёмка / визит / встреча).
3. **Pack-specific overrides** only when token replacement isn't enough — e.g. the lawyer wants "о консультации завтра в 14:00", needing different sentence structure.

Don't aim for perfect copy in all 50 packs immediately. Ship neutral copy + 5 high-traffic packs (manicure, hair, tutor, photographer, fitness) with custom microcopy. Add others on demand based on signups.

### 4. Icon and metaphor neutrality

Audit `/src/components` and `/src/data/professions.ts`: confirm beauty-leaning icons (scissors, nail, brush) are isolated to profession-pack assets, not core navigation. Core tabs should use universal glyphs:

- **Today** — calendar/clock
- **Clients** — people silhouette (not a beauty face)
- **Money** — wallet or chart
- **Services** — list/tag (not scissors)
- **Settings** — gear

Per-profession **accent icon** only appears in onboarding and an optional header badge. Use SF Symbols on iOS where possible — they cover 90% of professions natively (`person.2`, `wrench`, `pawprint`, `book`, `camera`, `scale.3d`, `graduationcap`, `stethoscope`, `paintbrush`).

### 5. Empty state UX — tailored

Empty state lives in pack config:

```ts
emptyStates: {
  today: { title, subtitle, ctaLabel, ctaAction }
}
```

Examples:
- **Tutor**: "Сегодня занятий нет. Добавьте ученика и запланируйте урок." → CTA «Добавить ученика».
- **Photographer**: "Нет съёмок сегодня. Запланируйте сессию или внесите проект." → «Добавить съёмку».
- **Vet**: "Приёмов нет. Добавьте питомца клиента и запишите визит." → «Новый приём».
- **Cleaner**: "Заказов нет. Добавьте клиента и запланируйте уборку." → «Запланировать уборку».

Same primitive (empty appointment list), three different framings. **Words do the work, not new screens.**

### 6. Calendar mental model

Don't fork the calendar — extend it with **pack-configured defaults**:

```ts
calendar: {
  defaultDuration: 60,             // minutes
  durationPresets: [15, 30, 60, 90],
  allowMultiDay: false,            // cleaner: true, photographer: true
  recurrenceDefault: 'none',       // tutor: 'weekly'
  showTimeGrid: true,              // contractor: false (jobs)
  workdayShape: 'slots'            // 'slots' | 'jobs' | 'blocks'
}
```

`workdayShape: 'jobs'` means calendar renders as a list of full-day or multi-day jobs (cleaner, contractor) instead of a time-grid. `'blocks'` means 2-4 hour blocks (photographer). The data model stays the same — `start_at`/`end_at` — only rendering shifts. Build one calendar component that takes shape as a prop.

Tutors get `recurrenceDefault: 'weekly'` so when they add a Tuesday 6pm student, it auto-creates 12 weekly recurrences. Huge value, two lines of config.

### 7. Pricing display variants

Service entity needs:
```ts
type PricingModel = 'fixed' | 'hourly' | 'project' | 'package';

interface Service {
  pricing_model: PricingModel
  price: number
  // for 'package':
  package_sessions?: number
  // for 'hourly':
  min_hours?: number
}
```

UI renders accordingly:
- `fixed`: "1500 ₽"
- `hourly`: "2000 ₽/час, мин. 2 ч"
- `project`: "от 15000 ₽"
- `package`: "10 занятий — 18000 ₽"

Finance reporting normalizes to actual revenue per appointment. The pack picks defaults: tutor → `hourly` or `package`, photographer → `project`, beauty → `fixed`.

### 8. Reports tailored by profession

Define **default report widgets** per pack on the Finance/Reports screen:

- **Beauty**: most-popular service this month, repeat-rate, no-show count.
- **Tutor**: students attending fewer than expected sessions, package balance ("остался 1 урок"), upcoming exams flagged on clients.
- **Photographer**: shoots booked this month, deposit collected vs outstanding, top venue.
- **Vet**: vaccinations due in next 30 days, last visit > 1 year ago.
- **Lawyer**: cases by status (active/closed), avg case duration, billable hours.

All built on the same primitives (Client, Appointment, Income). Just different `SELECT … WHERE …` queries surfaced as default cards. Power users edit which cards show.

### 9. Onboarding samples — make the empty app feel alive

Each pack ships 3-5 sample clients with realistic names/services/appointments **in the past and near future**, clearly marked "Пример" with a one-tap "Удалить примеры" banner that disappears once dismissed. Critical for retention — the empty CRM problem ("looks broken") is one of the top D1 churn drivers.

Make sure sample data is filtered out of analytics, exports, and any future Supabase sync until user explicitly converts samples to real entries.

### 10. Discoverability map — feature visibility per pack

Add a feature flag layer keyed to packs:

```ts
features: {
  beforeAfterPhotos: true,         // beauty, tattoo
  vaccinationLog: false,           // vet only
  packageBalance: false,           // tutor, fitness
  multiPet: false,                 // vet
  contractAttachments: false,      // lawyer, contractor
  routeOptimization: false,        // cleaner, mobile services
}
```

UI components check `featureEnabled('beforeAfterPhotos')` before rendering. Settings page surfaces a "Дополнительные функции" section where user can manually toggle any feature on/off regardless of pack defaults. This lets a hairstylist enable "package balance" if they sell packages, without changing profession.

### 11. First-week guide — profession-specific checklist

On home screen, a dismissible card: "5 шагов на первую неделю". Each item deep-links to the relevant screen and marks complete on action.

Tutor example:
1. Добавить первого ученика
2. Создать занятие на эту неделю
3. Настроить напоминание за день
4. Добавить пакет уроков как услугу
5. Записать оплату

Beauty example:
1. Добавить услуги с ценами
2. Запланировать первую запись
3. Загрузить фото "до/после"
4. Настроить рабочие часы
5. Посмотреть отчёт за неделю

Tracks activation funnel — biggest leverage for converting trial-to-paid. Each completed item = ~10pp higher D30 retention based on Square's published data.

### 12. Hide complexity gracefully — per-pack capability surface

Three-layer model:
1. **Core surface** (always visible): Clients, Calendar, Services, Money, Settings.
2. **Pack-extended surface** (visible if pack enables): Vaccinations tab for vet; Packages tab for tutor; Before/After gallery for beauty/tattoo; Route map for cleaner.
3. **Universal toggle** in Settings → "Дополнительные модули" — user can enable any module manually.

Don't put 50 feature toggles in front of users. Default visibility is opinionated per pack; manual override exists for the 5% who want it.

---

## What pushes price from 299₽ to 590-990₽

To make the app feel underpriced at current tier and justify higher tier later:

1. **Local market price intelligence** — anonymized, aggregated benchmarks: "Ваши маникюрши берут на 15% меньше среднего по Казани". Killer feature, defensible moat, requires Supabase aggregation but minimal compute.
2. **Auto-reminders по СМС/WhatsApp/Telegram** — currently only push. Adding SMS at scale is a paid feature that pays for itself (reduces no-shows 30-40%).
3. **Online booking page** — public URL clients book at. Calendly-lite per profession. Massive perceived value, mostly UI work on top of existing appointment model.
4. **Налоговый отчёт for self-employed** — PDF for the year, already in plan, ship by tax season.
5. **Smart no-show prediction** — flag bookings likely to no-show based on history. ML-light, high perceived intelligence.
6. **Recurring revenue dashboard** — MRR view for tutors/fitness/subscription services. Reframes the app from "log book" to "business intelligence".
7. **Team mode (2-3 masters)** — future paid tier. Salon owner with 3 manicurists. Calendar shared, finances aggregated.

Items 1, 3, 5, 6 are unique-feeling features that competitors don't have. Each justifies a price bump on its own.

---

## Suggested implementation order

1. **Pack config schema** + extract beauty hardcoding into a `beauty.ts` pack (refactor, no new features).
2. **Vocabulary override layer** with `tProf()` and 3 packs (manicure, tutor, photographer).
3. **Pack-tailored empty states + first-week checklist** (highest D7 lift per dev-hour).
4. **Pricing model on Service** + tutor/photographer packs use it.
5. **Calendar shape parameter** (slots/jobs/blocks) — unlocks cleaner and photographer.
6. **Feature flags per pack** + manual override in Settings.
7. **Sample data on onboarding** with one-tap remove.
8. **Online booking page** — biggest upsell lever, ship before raising price.

Files to touch first: `/src/data/professions.ts` (extend schema), `/app/(auth)` (onboarding flow), `/src/i18n` (override resolution), `/src/types/service.ts` (pricing model).