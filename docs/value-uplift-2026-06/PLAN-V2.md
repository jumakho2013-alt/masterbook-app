# MasterBook — Value & Universal Plan (v2)

## TL;DR

1. **Не строим маркетплейс, не строим публичные ревью, не строим бьюти-фичи.** Строим **самый спокойный профессия-aware CRM для соло** в СНГ. Цена 299 ₽/мес остаётся, но ощущается как 990 ₽ — за счёт того что закрывает 12-14k ₽/мес job-value (реалистично, не 25к как в R2) и якорится против ELITE 1490 ₽/мес (5× = психологически оптимальный anchor).
2. **Универсализация = vocabulary + seed data + custom fields, НЕ переписывание навигации.** Pack-конфиг меняет термины ("клиент"→"ученик"), дефолтные услуги, empty states, pinned filter-чипы. Навигация (Today/Clients/Money/Services/Settings) одна для всех. R1's архетипная навигация (Projects tab, Cases tab) откладывается в v2.x — слишком дорого и ломает product identity.
3. **6 фичей-якорей** под повышение восприятия цены, в порядке ROI: (1) Tax PDF самозанятого, (2) Custom fields + 5 packs, (3) Online booking page, (4) Idle-slot AI suggestions с draft-сообщением, (5) Year-in-review, (6) СБП deposits с take-rate. Всё остальное — шум до 2.5k платных юзеров.
4. **ELITE 1490 ₽/мес — anchor, а не upsell-цель.** Цель ELITE — не MRR, а conversion-lift PRO. Реалистичная подписка ELITE = 3-5% от платных. PRO остаётся complete-продуктом, никакого "PRO это trial ELITE".
5. **Реалистичные 24-месячные цели: 2.5k платных, ~1M ₽/мес ARR, при удержании 70%+ через год.** Любая стратегия что не работает на 2500 платных юзерах — неправильная стратегия. 10k платных в CIS solo-CRM сегменте к 2027 — fantasy.

---

## 1. Главная стратегическая мысль

**MasterBook — это календарь + клиенты + деньги, профессия-aware, mobile-native, на "ты", без салонной сложности и без маркетплейса.** Мы строим личный CRM который соло-профессионал хочет показать жене/мужу/налоговой как доказательство что у него настоящий бизнес. Не tool-of-tools (Notion), не platform (Booksy), не enterprise (YClients). Категория: **профессиональный дневник соло-предпринимателя** — приложение которое заменяет тетрадку, Excel и пять чатов в WhatsApp одновременно, и делает это с эстетикой и спокойствием которые мастер сам бы себе купил. Универсальность достигается не широтой фич а **vocabulary swap + seed data + pinned custom fields** — репетитор видит "ученика" а не "клиента", фотограф видит "съёмку" а не "запись", но архитектура одна. Лицензия на категорию: "**ваши клиенты остаются вашими**" — anti-marketplace позиция как product manifesto и marketing wedge против YClients/Dikidi.

---

## 2. Универсализация: от бьюти-CRM к платформе для любых соло-профессий

### 2.1 Карта 20 профессий для v1.x — v2.0 (не 50)

R1 сделал отличную карту на 50 профессий, но **в v1.x нам нужны 20**. Остальные 30 — задел на v2.0 community packs. Шкалирование по 6 axes (session shape, pricing unit, client entity, outcome type, cadence, privacy) корректно — но **архетипная навигация под каждый axis — это v2.x**. В v1.x все профессии живут в одной навигации, отличаются термины + seed + custom fields + pinned filters.

| # | Профессия | Pricing | Entity | Killer custom field | Pack priority |
|---|---|---|---|---|---|
| 1 | Маникюр | per-session | human | preferred shape/color | **v1.0** core |
| 2 | Брови/ресницы | per-session | human | last tint date, curl | **v1.0** core |
| 3 | Парикмахер/барбер | per-session | human | формула цвета | **v1.0** core |
| 4 | Массаж | per-session/package | human | противопоказания | **v1.0** core |
| 5 | Косметология | per-package | human | аллергии, фототип | **v1.0** core |
| 6 | Татуировка | per-project | human | sketch link, sessions left | **v1.1** |
| 7 | Депиляция | per-session/recurring | human | зоны, фаза роста | **v1.1** |
| 8 | Репетитор | per-hour/package | child | предмет, класс, ДЗ | **v1.3** universal-1 |
| 9 | Фотограф | per-project | human | shoot date, deposit % | **v1.3** universal-2 |
| 10 | Груминг | per-session | pet | порода, стрижка | **v1.3** universal-3 |
| 11 | Фитнес-тренер | package | human | программа, PR, травмы | **v1.3** universal-4 |
| 12 | Психолог/коуч | per-session | human | сессия # (encrypted) | **v1.4** universal-5 |
| 13 | Языковой репетитор | per-hour | human | уровень A1-C2 | v2.0 |
| 14 | Музыка/танец | per-session | child | пьеса/хореография | v2.0 |
| 15 | Логопед | per-session | child | звуки, ДЗ | v2.0 |
| 16 | Клининг | per-sqm/hour | property | адрес, ключи | v2.0 |
| 17 | Сантехник/электрик | per-job | property | адрес, гарантия | v2.0 |
| 18 | Авто-мастер | per-job | vehicle | пробег, модель | v2.0 |
| 19 | Ветеринар | per-session | pet | вакцины, вес | v2.0 |
| 20 | Дизайнер/иллюстратор | per-project | b2b | revisions, deadline | v2.0 |

**Не делаем в v1.x — v2.x:** юрист, бухгалтер (privacy/legal требования — R-критика #19 — невозможны без client-side encryption который ломает всё остальное), детский babysitter (child-data privacy экспонирует под 152-ФЗ).

### 2.2 Архитектура profession-packs

Pack = чистый JSON, **никакого исполнения кода**, всё декларативно. Хранится в `packs/*.json` как static assets, плюс таблица `profession_packs` в Supabase для community packs (v2.0).

```ts
type ProfessionPack = {
  slug: string;
  version: number;
  name: { ru: string; en?: string };
  icon: SFSymbol;
  vocabulary: { client?, appointment?, service?, ... };  // override layer
  defaultServices: ServiceTemplate[];   // 5-7 услуг с региональными ценами
  customFields: CustomFieldDef[];       // 3-7 полей на client/appointment
  pinnedFilters: string[];              // 1-2 field keys
  emptyStates: { today, clients, services, money };
  firstWeekChecklist: ChecklistItem[]; // 5 шагов
  reminderTemplate: string;             // "{{client}}, жду тебя {{day}} в {{time}}"
  sampleData: { clients[], appointments[] }; // 3-5 примеров с "Пример" badge
};
```

**Файлы где это живёт:**
- `src/types/professionPack.ts` — типы
- `packs/manicure.json`, `packs/tutor.json` и т.д. — 12 паков к v1.4
- `src/services/packService.ts` — install/switch/diff
- `src/store/packStore.ts` — Zustand slice
- `src/i18n/tProf.ts` — vocabulary override resolution

### 2.3 Custom fields framework

Подход R8 правильный с одной модификацией из критики #16: **формулы не нужны** соло-мастерам. Заменяем формулы на **curated smart fields** в каждом паке (LTV, visits this year, package balance — посчитаны под капотом).

**Data model (Supabase):**
```sql
alter table clients      add column custom jsonb not null default '{}';
alter table appointments add column custom jsonb not null default '{}';
alter table services     add column custom jsonb not null default '{}';

create table custom_fields (
  id uuid pk,
  workspace_id uuid not null,
  entity text check (entity in ('client','appointment','service')),
  key text not null,
  label jsonb not null,
  type text check (type in ('text','number','date','select','multiselect','phone','url','boolean','file')),
  config jsonb default '{}',
  position int,
  required boolean default false,
  show_in_list boolean default false,
  pack_id uuid references profession_packs(id),
  pack_version int,
  deleted_at timestamptz,  -- soft delete 90 дней
  unique(workspace_id, entity, key)
);

create index clients_custom_gin on clients using gin (custom jsonb_path_ops);
```

**Тиерные лимиты:**

| Tier | Pack-bundled fields | User-added fields | Statuses |
|---|---|---|---|
| Free | unlimited (из пака) | 0 | дефолт |
| PRO | unlimited | 5 на entity | 6 кастомных |
| ELITE | unlimited | unlimited | unlimited |

Pack-fields **не считаются** против лимита PRO — это критически важно для восприятия ценности пакета.

**Down-migration safety (CLAUDE.md #4):** удаление field → soft-delete 90 дней с сохранением values в `custom`, hard-purge через background job. Type change → migration screen с preview ("12 значений не подойдут, оставить как text?").

### 2.4 Vocabulary swap

Resolution: `tProf(key)` сначала смотрит в активный pack, потом fallback в `i18n/ru.json`. Не делать 50 i18n файлов — делать 1 base + per-pack overrides только для high-traffic строк (tab names, list headers, button labels, empty states, reminder templates). Микрокопия с переменными `{{appointmentType}}` покрывает 80% случаев без overrides.

### 2.5 Cross-vertical UX

**Что меняется по паку:**
- Термины (через tProf)
- Default services (5-7 предзаполненных с региональными ценами)
- Custom fields (показываются inline в существующих экранах, не за accordion)
- Pinned filter-чипы (3 max на mobile)
- Empty states
- First-week checklist (5 шагов)
- Reminder template
- Sample data (clearly marked "Пример", one-tap remove)

**Что НЕ меняется по паку:**
- Навигация (5 табов одинаковые)
- Календарь-shape (slot-grid, никаких "Projects tab вместо Calendar")
- Иконки в табах (нейтральные SF Symbols)
- AI ассистент UX
- Settings структура

Это компромисс — мы теряем 10% optimality для project-based профессий (фотограф, дизайнер) в обмен на **сохранение product identity и cohesion**. Они получают Calendar где "запись" = "съёмка/проект" с deposit-tracking custom field. Достаточно для v1.x.

### 2.6 Топ-5 не-бьюти профессий для v1.3-1.4

Обоснование выбора — **TAM × low-implementation-cost × profession-pack fit**:

1. **Репетитор школьный** — огромный TAM в СНГ (~500k+ self-employed), pack-fit идеальный (weekly recurring + package), killer-feature "сегодня прошли тригонометрию, ДЗ X" auto-WA родителю.
2. **Фотограф events** — высокий ARPU (могут платить 990₽), pack-fit project-based но через custom fields на appointment (`shoot_date`, `deposit_pct`, `gallery_link`), killer — depo tracking.
3. **Груминг собак** — visit-recurring как бьюти (zero arch effort), один новый entity тип (pet) через custom multiselect `pet_breed/cut_style/behavior`, killer — фото "до/после" уже есть в коде.
4. **Фитнес-тренер персональный** — package-model (10 тренировок), pack-fit отличный, killer — auto-prompt "осталось 2 из 10" на сессии #8.
5. **Психолог/коуч** (без legal-privileged уровня) — weekly recurring same-time slot, pack-fit, killer — "сессия #14, последние темы: X, Y, Z" но **без encrypted notes** в v1.x — позиционируем как "доверь нам как любому SaaS", полное privileged-шифрование откладывается в v3.0 или никогда.

**Не выбираем для v1.x:** клининг (нужна map view + sqm pricing — отдельный модуль), сантехник (job-not-appointment ментально, ломает календарь), ветеринар (pet entity + vaccine schedule = новая модель), юрист (case-driven + billable hours + privacy = другой продукт).

---

## 3. Pricing power

### 3.1 15 JTBD с реалистичной value (исправлено по критике #1)

R2 переоценил no-show savings 10× применительно к CIS solo-beauty. Recalibrate:

| # | Job | Realistic monthly value ₽ |
|---|---|---|
| 1 | Помнить клиента и его preferences | 1 000 |
| 2 | Reminder сокращает no-shows (1 saved slot/qtr) | 500 |
| 3 | Re-book lapsed клиентов (1 в месяц × 1500) | 1 500 |
| 4 | Income/expense без Excel | 1 000 |
| 5 | Tax PDF для НПД | 400 |
| 6 | Photo records (защита от споров + portfolio) | 600 |
| 7 | Anti-double-booking | 800 |
| 8 | Price list always at hand | 300 |
| 9 | Work hours / breaks (anti-burnout) | 500 |
| 10 | Professional image → +3% premium tolerance | 2 400 |
| 11 | Backup от потери базы | 800 |
| 12 | Filter clients для промо | 1 500 |
| 13 | Privacy данных (no Sheets-leak) | 300 |
| 14 | Mental peace — one place | 1 000 |
| 15 | Year-in-review proof | 500 |

**Реалистичный stacked value ≈ 13 100 ₽/мес vs 299 ₽ sticker → 44× ratio.** Дисконтируя ещё на overlap получаем 8-10×. **Это всё равно "одна запись окупает год"** — основная маркетинговая фраза остаётся живой, но без AgentZap-цитат.

### 3.2 Anti-anchor: ELITE 1490 ₽/мес

Финальный ценник — **1490 ₽/мес** (R6/R2). Это 5× от PRO 299 ₽ — психологически оптимально (Tversky-Kahneman decoy). R3 и R8 говорили 599 ₽ — неправильно, это слишком близкий якорь и не создаёт контраст.

Цель ELITE — **не быть купленным**, а заставить PRO 299 ₽ выглядеть очевидным выбором. Целевая ELITE-конверсия 3-5% от платных. Anchor-эффект даёт +15-25% lift на PRO conversion от Free.

### 3.3 Feature matrix

| Capability | FREE | PRO 299₽ | ELITE 1490₽ |
|---|---|---|---|
| Clients | **30 cap, forever** | unlimited | unlimited |
| Appointments | unlimited | unlimited | unlimited |
| Photo attachments | 5/client | unlimited | unlimited |
| Cloud sync (Supabase) | — | **✓ killer gate** | ✓ |
| Auto-reminders (WA/TG/SMS) | manual только | ✓ | ✓ |
| Finances + charts | basic | full | branded PDF |
| Tax PDF самозанятого | — | ✓ | branded + auto-monthly |
| Profession packs | 1 (locked) | switchable | switchable + community |
| Custom fields (user-added) | 0 | 5/entity | unlimited |
| AI: idle-slot suggestions | — | ✓ | ✓ |
| AI: churn alert | — | ✓ | ✓ |
| AI: receipt OCR | — | 10/mo | unlimited |
| AI: voice-to-note | — | ✓ | ✓ |
| AI: voice-to-appointment | — | — | ✓ |
| Cohort retention dashboard | — | basic 30-day | full cohorts |
| City benchmarks (opt-in) | — | — | ✓ |
| Booking page | masterbook.ru/u/name | + theme | **custom domain CNAME** |
| Multi-staff seats | 1 | 1 | 3 |
| Branded receipts | — | name only | full white-label |
| Support | FAQ | email 24h | **WhatsApp <4h** |
| Migration concierge | — | — | ✓ |
| Quarterly written report | — | — | ✓ (не call — критика #14) |
| Yearly discount | — | 1990₽/год (-45%) | 12990₽/год (-27%) |

**Ключевые гейты обоснованно:**
- **30 clients forever на Free (критика #6)** — R10 прав, ratchet-down убьёт trust. Гейтим на **cloud sync + auto-reminders**, не на количестве.
- **Custom domain на ELITE** — единственный визуальный flex который клиент мастера видит.
- **City benchmarks opt-in** (критика #17) — мастер явно соглашается делиться обезличенными данными в onboarding; ELITE без бенчмарков всё равно стоит 1490₽ за brand + analytics + concierge.
- **Multi-staff 3** — не 5 (R2). Дальше — другой продукт.

### 3.4 Outcome-pricing эксперименты (для будущего)

R2 рассмотрел три модели. Реалистичное решение:
- **v1.5: opt-in СБП deposits с 1.5-2% take-rate** для PRO/ELITE. Не заменяет подписку — дополняет.
- **Никогда: pay-per-booking как primary model.** Revenue volatility убьёт нас в межсезонье.
- **Annual plan guarantee "save 10h/mo or refund":** только как маркетинговая фраза на годовом плане, без формальной механики возврата.

### 3.5 Anti-patterns которые избегаем

- **Coffee-cost framing убираем (критика #2)** — Yandex Plus/Tinkoff Pro цены устарели. Используем ROI: "одна запись окупает год".
- **Никаких "Free до 30 клиентов, потом lock"** — R10 прав, держим 30 forever и гейтим на sync.
- **Никаких hidden upcharges, никаких surprise renewals.** Auto-renewal email за 7+3+1 день с one-tap cancel.
- **Pricing review каждые 6-12 мес** — план: ревью в M6 post-launch с возможным повышением PRO до 349 ₽ для новых, grandfathering старых.
- **Никогда per-seat для соло** — flat tier + multi-staff как add-on в ELITE.

---

## 4. Топ 20 фич ранжировано по value-uplift / effort

Метки: **🤖 AI** / **⚙️ non-AI**, **🔴 MUST** / **🟡 NICE** / **🟢 EXPER**, **🌍 Universal** / **💅 Beauty-specific** / **🎓 Pack-specific**

| # | Фича | Метки | ROI rationale | Файл/компонент |
|---|---|---|---|---|
| 1 | **Tax PDF самозанятого** | ⚙️ 🔴 🌍 | Identity validation для жены/налоговой/арендодателя. Самый высокий emotional ROI на час разработки. | `src/services/taxReport.ts`, `src/screens/Finance/TaxPDF.tsx` |
| 2 | **Custom fields framework + 5 packs** | ⚙️ 🔴 🌍 | Open up TAM от бьюти к репетиторам/фотографам/тренерам — без переписывания нав. | `src/types/customFields.ts`, `packs/*.json` |
| 3 | **Online booking page (PRO+ theme, ELITE custom domain)** | ⚙️ 🔴 🌍 | Social job: "клиенты видят меня организованным". Tier-conversion тригер. | `web/booking/[slug].tsx` (Next.js) |
| 4 | **Idle-slot AI suggestions с draft** | 🤖 🔴 🌍 | Прямой revenue uplift — один заполненный слот окупает PRO на 5 месяцев. | `src/services/ai/idleSlots.ts` |
| 5 | **Year-in-review (Spotify Wrapped style)** | ⚙️ 🔴 🌍 | Identity + viral share. Раз в год, но peak emotional moment. | `src/screens/YearReview.tsx` |
| 6 | **Churn alert на основе personal cycle** | ⚙️ 🔴 🌍 | "Лена обычно каждые 6 недель, сейчас 11" — on-device math, no LLM. Max 1/month per master (критика #20). | `src/services/churnDetection.ts` |
| 7 | **Auto-reminders WA/Telegram deep-link** | ⚙️ 🔴 🌍 | Table stakes но critically improves no-show. Templates с merge fields. | `src/services/reminders.ts` |
| 8 | **Service duration auto-suggest (on-device median)** | ⚙️ 🔴 🌍 | Save 30s на каждой записи, zero cost, profession-agnostic. | `src/utils/durationSuggest.ts` |
| 9 | **No-show risk badge (rule-based on-device)** | ⚙️ 🔴 🌍 | Trust + actionable — рекомендация "попросить предоплату". | `src/services/noShowScore.ts` |
| 10 | **CSV + JSON full export (включая фото в ZIP)** | ⚙️ 🔴 🌍 | Honest moat. Не "data is mine" пустое — реально работает. | `src/services/dataExport.ts` |
| 11 | **СБП deposits через ЮKassa partner** | ⚙️ 🔴 🌍 | Adjacent revenue + reduces no-shows. Take-rate 1.5-2%. | `src/services/payments/sbp.ts` |
| 12 | **Income forecast (on-device)** | ⚙️ 🔴 🌍 | Identity ("я строю бизнес"). Простая медианная экстраполяция. | `src/services/forecast.ts` |
| 13 | **Quick-reply templates с merge fields** | ⚙️ 🔴 🌍 | Replaces WhatsApp Business. 20 шаблонов в библиотеке. | `src/screens/Templates.tsx` |
| 14 | **Daily end-of-day summary card (опционально)** | ⚙️ 🟡 🌍 | Hidden job #34 — ritual closure. Не push, только при открытии. | `src/screens/Home/DailyRecap.tsx` |
| 15 | **Receipt OCR → expense** | 🤖 🟡 🌍 | Save 3 min/чек. 0.5 ₽/чек × 20 = 10 ₽/мо. | `src/services/ai/receiptOCR.ts` |
| 16 | **Voice-to-note (NOT voice-to-appointment в v1.x — критика #11)** | 🤖 🟡 🌍 | Низкие stakes когда Whisper RU фейлит. | `src/services/ai/voiceNote.ts` |
| 17 | **City benchmarks (opt-in анонимные)** | 🤖 🟡 🌍 | Network effect + ELITE differentiator. Требует критической массы. | Supabase RPC + `src/screens/Analytics/Benchmarks.tsx` |
| 18 | **Cohort retention dashboard (ELITE)** | ⚙️ 🟡 🌍 | Operator-grade analytics. PRO видит preview, ELITE — cohorts. | `src/screens/Analytics/Cohorts.tsx` |
| 19 | **Goal-setting + monthly progress** | ⚙️ 🟡 🌍 | Hidden job #32. Простая фича — target ₽/visits per month. | `src/screens/Settings/Goals.tsx` |
| 20 | **Anti-burnout flag (Sunday only)** | ⚙️ 🟡 🌍 | Emotional moat — никто из конкурентов не заботится о выгорании. | `src/services/burnoutCheck.ts` |

**Что НЕ в топ-20** (намеренно):
- Inventory/consumables (#9 JTBD R4) — adjacent product, не v1.x
- Reviews — критика #8 запрещает
- Marketplace/Discover — R7+R10 запрещают до 50k masters
- Voice-to-appointment — критика #11, точность Whisper RU не вытягивает
- Formulas в custom fields — критика #16
- Client PWA "Мои мастера" — критика #4+#18, 152-ФЗ радиоактивно, iOS PWA push fragile
- Encrypted notes для юристов/психологов — критика #19, ломает всё

---

## 5. AI-ассистент: 8 конкретных автоматизаций

R3 предложил 15. Сокращаем до **8 которые реально окупаются и не triggerят критику #20/27**.

| # | Фича | Модель | UX flow | ₽/мастер/мес | Tier |
|---|---|---|---|---|---|
| 1 | **Auto-draft reminder** (template + tone-tag, NOT learning) | GPT-4o-mini, 1-shot template | Inbox: "3 напоминания готовы → пакетная отправка" | 0.3 | PRO |
| 2 | **Service duration auto-suggest** | on-device median | Inline-подсказка под полем | 0 | Free |
| 3 | **No-show risk score** | on-device rule-based | Badge на appointment card + объяснение | 0 | PRO |
| 4 | **Income forecast** | on-device | Widget на главной | 0 | Free preview, PRO full |
| 5 | **Idle-slot suggestions** | on-device ranking + GPT-4o-mini draft | Inbox card вс вечером, max 1/неделю | 2 | PRO |
| 6 | **Churn alert** (personal cycle outlier) | on-device | Badge в клиентах, Inbox max 1/месяц | 1 | PRO |
| 7 | **Receipt OCR** | GPT-4o vision или Yandex Vision | Photo → form preview | 10 (capped) | PRO |
| 8 | **Voice-to-note** (NOT to appointment) | Whisper + GPT-4o-mini | Mic → text в client notes | 5 | ELITE |

**Антипаттерны — AI делать НЕ должен:**
- **Не учиться на личных сообщениях мастера** (критика #27 — privacy + точность)
- **Не упоминать "конкурента"** в churn alerts (критика #20)
- **Не присылать push-уведомления "интересные факты"** — только при открытии app
- **Не делать voice-to-appointment** в v1.x — Whisper RU точность 75-80% с background noise недостаточна для "wow" демо
- **Не писать публичные ревью / рекомендации** клиентам
- **Не показывать AI как "ИИ"** в UI — просто "умные подсказки", тон без "✨🤖"
- **Не unlimited queries** в ELITE — soft cap с прозрачным counter (критика #26)
- **Не proactive pushes от AI вне inbox** — золотое молчание

**Суммарный AI cost для PRO:** ~13 ₽/мес. **Для ELITE:** ~30 ₽/мес. Margin >95% даже на тяжёлых юзерах.

---

## 6. Switching cost / data moat (этичный)

10 механизмов, **каждый из которых пользователь хочет** чтобы быть locked-in (R5 honest moat philosophy):

1. **Photo archive with searchable provenance** — фото клиента+услуги+даты, можно найти "все french за январь". Конкурент CSV-импортит контакты, не индекс.
2. **Visit-history с unstructured notes** — "аллергия на gel X, развелась — не упоминать мужа". Невозможно перенести через CSV.
3. **Tax PDF history** — раз сдал в ФНС со ссылкой на UUID записей, midyear-смена болезненна (audit risk).
4. **Voice-tone templates библиотека** — 20 написанных мастером шаблонов с merge fields. Уход = переписать.
5. **Custom fields накопленные** — `pet_breed`, `formula_color`, `package_balance` — schema rebuild на новом инструменте.
6. **Profession-pack настроенный** — кастомизированные services, prices, reminder templates под себя.
7. **Native calendar two-way sync** — appointments в iOS Calendar где мастер живёт. Удаление MasterBook = удаление из своего календаря.
8. **СБП payment history с auto-categorization** — re-categorize 3 месяца — реальные часы работы.
9. **Booking page URL** на Instagram bio/business cards/2GIS — domain authority loss на migration.
10. **Year-over-year analytics** — "ты обслужил 412 клиентов в этом году" — невозможно reconstruct на новой платформе.

**Honest Moat Pledge — публикуем в settings:**
- **Один-тап full export** в ZIP (JSON + photos + tax PDFs) на любом tier, включая expired.
- **Schema export documented** at `masterbook.ru/export-spec` — конкуренты могут импортить.
- **Account deletion <24h**, exports first, no guilt flow.
- **Никогда не продаём контакты клиентов** третьим лицам.
- **Никогда не заряжаем за communication с клиентами** мастера.
- **Никогда pay-to-rank** в любой публичной поверхности (если когда-то будет directory).
- **Никогда retention dialogs >1 экран** при cancel.

---

## 7. ELITE tier дизайн

### 7.1 Audience
Четыре архетипа (R6 правильно): **Veteran Solo Pro 40%** + **Micro-Studio Owner 30%** (1-3 ассистента) + **Scaling Operator 20%** + **Status Buyer 10%**. Универсально через все профессии — это про **operator mindset**, не про вертикаль.

### 7.2 Фичи в ELITE (12, не 14 — без overpromise)

1. Cohort retention dashboard
2. Client LTV + auto-segmentation (VIP/Regular/At-risk/Lost)
3. Revenue forecast 90 days с confidence band
4. **City benchmarks** (opt-in, требует критической массы)
5. Custom domain CNAME для booking page
6. White-label PDF/email с логотипом + brand colors
7. Multi-staff seats до 3 (shared client base, commission tracking)
8. Unlimited custom fields + statuses + community pack publishing
9. AI: unlimited (soft cap) receipt OCR + voice-to-note + voice-to-appointment (когда созреет в v1.5)
10. WhatsApp/Telegram priority support <4h SLA
11. Migration concierge (мы импортим из YClients/Excel/Notes вручную)
12. Quarterly **written** business report (не call — критика #14)

**Held back to v2.0 (но в pricing copy "coming"):** API/Zapier (только когда ≥5 ELITE users попросили unprompted), branded SMS sender ID (критика #13 — экономика не сходится), advanced auto-rules engine.

### 7.3 Контр-аргументы

| Возражение | Counter |
|---|---|
| "1490 дорого" | "Цена одной услуги. Окупится если поможет удержать 1 клиента в месяц." |
| "Я и так помню клиентов" | "Покажем кто из них на грани ухода — данные, не интуиция." |
| "Мне не нужен брендинг" | "Брендинг для клиентов, не для тебя. Они видят `masterbook.ru/u/...` или `zapis.твой-домен.ru`." |
| "У меня нет команды" | "Multi-staff бонус. Главное — аналитика и brand-layer." |
| "PRO хватает" | "Отлично — ELITE здесь когда понадобится. PRO остаётся полным продуктом." |

**Никаких FOMO/scarcity ("только 100 мест") — destroys trust в этом сегменте.**

---

## 8. Adjacent revenue (ранжировано)

Топ-4 для v1.5-v2 (R7 валиден, с поправками критики):

| Rank | Stream | Timing | Realistic ARR @ 2.5k платных |
|---|---|---|---|
| **1** | **СБП deposits take-rate** (1.5-2% via ЮKassa partner) | v1.5 | ~250k ₽/мес — solves real pain, universal |
| **2** | **Tax service для самозанятых** (auto-чек generation через Nalog.ru API) | v1.5-2.0 | ~150k ₽/мес — критика #12: только самозанятые, не ИП УСН |
| **3** | **MasterBook Academy** (1490-2990 ₽ courses) | v2.0 | ~80k ₽/мес — но reinforces brand |
| **4** | **Affiliate supply links** (OZON/WB, ОРД-marked) | v1.5 | ~40k ₽/мес — affiliate only, no curated catalog |

**Что НЕ делать никогда (с обоснованием):**
- **Client-facing marketplace ("Discover" с алгоритмическим ranking)** — становимся Booksy, теряем trust, master backlash гарантирован, моральный hazard pay-to-rank.
- **White-label license международная** — 12+ engineer-months, multi-tax/lang/currency, partner dependency локирует roadmap.
- **B2B Studio module (5+ masters)** — YClients/Altegio doминируют, другой sales motion, distracts от solo focus.
- **Sponsored badges на booking pages мастера** — cheapens premium positioning.
- **Selling anonymous data** к suppliers — даже opt-in одна твит-катастрофа разрушает trust permanently.
- **Public reviews** — критика #8 окончательно: пять-звездочная инфляция + один bad-faith review разрушает livelihood + Roskomnadzor exposure.

---

## 9. Network effects: client-side app/PWA "Мои Мастера"

**Решение: ОТКЛОНИТЬ в v1.x — v2.x.** Критика #4 и #18 убедительны:

- **iOS PWA push fragile** — <40% клиентов добавят на Home Screen → push не работает → главный value prop умирает.
- **152-ФЗ радиоактивно** — cross-master sharing personal data требует explicit per-master consent UI = 3× engineering, при этом запутывает клиента.
- **Cold start без network эффекта мизерный value** — клиент видит "1 мастер" и закрывает.

**Что делаем вместо:**
1. **"Powered by MasterBook" footer** на booking page (PRO+ может скрыть в ELITE) — R10's cheapest growth lever, работает безусловно.
2. **Booking page как single-master surface** (не cross-master) — клиент бронирует у мастера через `masterbook.ru/u/name`, видит свою историю с этим мастером, никаких других мастеров.
3. **Cross-master referrals в одну сторону**: мастер передаёт клиента коллеге через "уходит в декрет/переезжает" flow, клиент получает SMS — никакого shared profile.
4. **Telegram bot для клиентов** (опционально, PRO+) — клиент пишет боту "когда моя следующая запись" → отвечает. Дешёво, надёжно, нет PWA-боли.

**MVP "Мои Мастера" PWA откладываем до v3.0** когда:
- 50k+ активных мастеров (массa для cold start)
- Native iOS client app возможен (не PWA)
- Legal review по 152-ФЗ с per-master granular consent UI готов

**Anti-Booksy-Boost философия (R10 prevails):**
- Никогда не charge мастера за доступ к собственным клиентам
- Никогда pay-to-rank в любой публичной поверхности
- Booking page это мастер-first surface, не platform-first
- Никаких "boosted" placements нигде

---

## 10. Customization framework (Notion-style, без Notion-боли)

### 10.1 Data model diff

См. §2.3. Ключевые добавки:
- `custom JSONB` на 3 entities
- `custom_fields` metadata table
- `profession_packs` catalog
- `statuses` first-class table
- GIN index на JSONB для search

### 10.2 UI flow для добавления полей/статусов

**First-run:** профессия выбрана → пак авто-installs → клиенты с правильными полями уже есть. Banner: "Настроили под {profession}. Изменить в Settings → Customize." Dismissible.

**Daily use:** нулевая customization UI видна. Custom fields рендерятся inline в существующих экранах.

**Settings → Customize (PRO-gated):**
- 3 tabs: Clients / Appointments / Services
- Drag-to-reorder, edit, delete
- "+ Add field" → bottom sheet → name → type → config → save (3 таpa)
- Pack-bundled fields с lock-icon, "Эти поля из пакета {Manicure}"

**Statuses tab:** drag pipeline, цвета, rename, добавить custom (PRO до 6 кастомных, ELITE — unlimited).

### 10.3 Тиерные ограничения

| Tier | Pack fields | User-added fields | Custom statuses | Marketplace |
|---|---|---|---|---|
| Free | unlimited (locked) | 0 | — | — |
| PRO | unlimited | 5/entity | 6 | browse only |
| ELITE | unlimited | unlimited | unlimited | publish + share |

**Pack-fields не считаются в лимит PRO** — критично для perception value пакета.

**Soft cap UX:** PRO juzер пытается добавить 6-е поле → friendly upsell "Безлимит полей в ELITE", НЕ блокер до 5-го. На 6-м тапе — modal с upsell.

---

## 11. Roadmap по версиям

Теги: **🌍 Universal** / **🤖 AI** / **🎓 Vertical-pack** / **🌐 Network** / **💰 Revenue**

### v1.1 (Q3 2026) — Foundation + первый paid wedge
- Supabase cloud sync (только PRO+) 🌍
- IAP infra через App Store / RuStore (критика #22) 💰
- Tax PDF самозанятого (МУ#1) 🌍
- Auto-reminders с merge fields через WA/TG deep-link 🌍
- Quick-reply templates library (МУ#13) 🌍
- Full ZIP export (JSON + photos + PDFs) 🌍

### v1.2 (Q4 2026) — Universalization v1
- Custom fields framework + 5 паков (manicure/brows/hair/massage/cosmetology) 🎓
- Vocabulary swap layer (`tProf`) 🌍
- Profession switcher в settings (reversible) 🌍
- Empty states + first-week checklist per pack 🎓
- Sample data on first-run 🎓
- Service duration auto-suggest (on-device) 🤖
- No-show risk badge (rule-based) 🤖

### v1.3 (Q1 2027) — Universal expansion + AI inbox
- 5 non-beauty packs (tutor/photographer/groomer/fitness/coach) 🎓
- Online booking page web v1 (masterbook.ru/u/name) 🌍
- Income forecast widget 🤖
- Idle-slot AI suggestions с drafts 🤖
- Churn alert (personal cycle outlier) 🤖
- Inbox screen — единая лента инсайтов 🤖

### v1.4 (Q2 2027) — ELITE launch
- ELITE tier publishing 💰
- Custom domain CNAME для booking page 🌍
- Cohort retention dashboard 🌍
- Client LTV + auto-segmentation 🌍
- City benchmarks (opt-in, требует ≥10 мастеров в районе для disclosure) 🌐
- Multi-staff seats до 3 🌍
- Year-in-review (для тех у кого ≥6 месяцев данных) 🌍

### v1.5 (Q3 2027) — Adjacent revenue
- СБП deposits через ЮKassa partner (1.5-2% take-rate) 💰
- Tax service: auto-чек для самозанятых через Nalog.ru API 💰
- Receipt OCR (GPT-4o vision) 🤖
- Voice-to-note (Whisper RU) 🤖
- Affiliate supply links (OZON/WB, ОРД-marked) 💰
- "Powered by MasterBook" footer для Free+PRO booking pages 🌐

### v2.0 (Q4 2027) — Platform-light
- 7 ещё паков (vet/cleaner/plumber/mechanic/lawyer-light/designer/language-tutor) 🎓
- Community pack marketplace (ELITE publish, Free browse) 🎓
- MasterBook Academy launch 💰
- Cross-master referrals (single-direction) 🌐
- Telegram bot для клиентов 🌐
- Quarterly business report (ELITE) 🌍

### v2.5-v3.0 (2028+) — Если 50k+ masters достигнуты
- Native client app "Мои Мастера" (НЕ PWA) 🌐
- City SEO pages 🌐
- Insurance/financial referrals 💰
- Supply network (только если ≥50k masters) 💰

**Зависимости:**
- Cloud sync (v1.1) → блокирует cohorts (v1.4), benchmarks (v1.4)
- Custom fields (v1.2) → блокирует packs (v1.3), marketplace (v2.0)
- Booking page (v1.3) → блокирует deposits (v1.5), custom domain (v1.4)
- 5 packs (v1.3) + base activation > 30% → unlocks ELITE launch (v1.4)
- 1.5k+ платных по итогам v1.4 → unlocks v1.5 deposits

---

## 12. Метрики на 12 месяцев

**Activation (D7 поведение):**
- ≥3 клиентов добавлено: target 60% Free users
- ≥1 appointment записан: target 70%
- ≥1 finance entry: target 35%
- First-week checklist completed: target 25%

**Retention:**
- D30 retention Free: target 35%
- D30 retention PRO: target 80%
- D180 retention PRO: target 65%
- M12 retention PRO: target 55%

**Conversion:**
- Free → PRO conversion: target 4-6% к M12 (anchor-эффект от ELITE существования)
- PRO → ELITE conversion: target 3-5% к M12
- Trial-to-paid: target 35% (14-day ELITE trial для PRO с 2+ triggers)

**Expansion / Revenue:**
- ARPU paid blended: target 380 ₽/мес (95% × 299 + 5% × 1490)
- 24-мес ARR target (real, критика #25): 2 500 платных × 380 ₽ × 12 = **11.4M ₽/год**
- + deposits @ 30% adoption: +3M ₽/год
- + tax service @ 15% adoption: +1.2M ₽/год
- **Total realistic 24-мес ARR: ~15-16M ₽**

**Referral coefficient:**
- Word-of-mouth signups (referral source = "коллега/клиент"): target 25% от total signups к M12
- "Powered by MasterBook" footer driven signups: target 15%

---

## 13. Топ-7 рисков и митигация

| # | Риск | Митигация |
|---|---|---|
| 1 | **YClients / Altegio запускают solo-focused tier** (1.5-2 года) | Diff: profession-packs универсально + custom fields + СБП deposits + anti-marketplace pledge. YClients не может отказаться от marketplace — это их бизнес. Мы можем. |
| 2 | **Apple ограничивает RuStore-only Russian devs** | Каждая pricing/IAP-фича имеет RuStore variant. СБП-billing fallback готов. Lifetime license 4990 ₽ как фаллбек (критика #24). |
| 3 | **Cold start универсализации** — репетиторы/фотографы не знают что мы существуем | Marketing budget по сегментам — лендинги для tutor/photo/groomer с правильным жаргоном. Бесплатная миграция из Excel/Notes для founder cohort. Word-of-mouth incentive: пригласи коллегу → 1 месяц PRO бесплатно. |
| 4 | **ELITE conversion <3%** — anchor не работает, MRR не растёт | A/B test PRO conversion lift с/без ELITE-tier видимости в pricing page. Если lift <15%, переоцениваем ELITE pricing на 990 ₽ или удаляем. |
| 5 | **AI costs выходят за margin** — power users жгут OpenAI bill | Soft cap с прозрачным counter (критика #26), routing на on-device где возможно, Yandex Vision для OCR (дешевле GPT-4o), monthly budget alert. |
| 6 | **Feature bloat** (критика #28) — пытаемся быть YClients lite | Constitutional rule: один category-expanding bet per quarter. Roadmap-board публичен команде, новые фичи требуют объяснения "что мы убираем чтобы сделать это". |
| 7 | **Privacy incident** (152-ФЗ violation, data leak, screenshot Twitter) | RLS audit перед каждым релизом, secure storage для sensitive (биометрия уже есть), opt-in для cross-master/benchmark/community pack, transparent privacy policy не "лоер-спик". Sentry + audit logs. |

---

## 14. Anti-roadmap — что НЕ делать

10 заманчивых идей которые убьют продукт:

1. **Public marketplace с reviews и ranking** — становимся Booksy, теряем trust мастеров. Пять-звёздочная инфляция + bad-faith reviews + Roskomnadzor exposure.
2. **B2B Studio multi-staff 5+** — другая компания, distract от solo, YClients доминируют.
3. **Encrypted notes для юристов/психологов** — true privilege ломает sync/search/photo/AI; ложная appearance privilege легально опасна.
4. **Formula language в custom fields** — solo мастер не пишет формул. Замена: curated smart fields per pack.
5. **Voice-to-appointment в v1.x** — Whisper RU 75-80% accuracy в нойзи среде убивает wow-demo.
6. **Client PWA "Мои Мастера" cross-master profile** в v1.x — iOS push fragile, 152-ФЗ радиоактивно.
7. **Unlimited everything на ELITE** — AI costs съедят margin; soft cap с counter обязателен.
8. **White-label international license** — 12+ months work, partner dependencies локируют roadmap.
9. **Streak shaming, red-dot proliferation, FOMO modals** — dark patterns которые builds revenue short-term и kills NPS long-term.
10. **Tightening Free от 30 до 10 клиентов** через 6 месяцев — ratchet-down ломает trust, R10 правильно настаивает на forever-30.

---

## Приложение A — Контр-аргументы и где может пойти не так

**"299 ₽/мес кажется слишком дёшево — мы оставляем деньги на столе."**
Возможно. Стратегия — wedge сначала, повышение через 6-12 мес для новых, grandfathering старых. Lifetime license опция (4990 ₽) ловит "anti-SaaS" сегмент. После 1k платных можем тестить 349-399 ₽ для новых cohorts.

**"Профессия-пак подход — слишком много packs для maintenance."**
Покрытие 80% TAM приходит с первыми 12 паками. Community marketplace в v2.0 переносит burden на пользователей-авторов. Бекап-план: если adoption <30% non-beauty packs к M12, откатываемся к "beauty-first с custom fields" — TAM меньше но focus сильнее.

**"СБП deposits через ЮKassa — мы зависим от partner."**
Да, и это intentional. Building own PSP licence — months и millions. ЮKassa take-rate терпимый, refund flow надёжный, KYC для ИП/самозанятых уже работает. Backup-провайдер CloudPayments готов как failover.

**"ELITE 1490 ₽ слишком высоко для CIS solo market."**
Может быть. A/B 990 vs 1490 vs 1990 в M6 post-ELITE-launch. Если 1490 даёт <3% conversion при price-elasticity sense, опускаем до 990 (3.3× anchor — менее эффективно но безопаснее).

**"Honest Moat Pledge — теряем 2% retention."**
Да. И получаем 5% повышение word-of-mouth + защиту от bad PR + позиционирование которое конкуренты не смогут копировать без переписывания бизнес-модели.

**"Откладываем client app — упускаем network effects."**
Согласен это риск. Но R10's "Powered by MasterBook" footer + booking page single-master surface даёт ~70% network value без 30× engineering investment. Если ROI booking page >2× после v1.3, ускоряем client app в v2.5.

**"Profession-pack vocabulary swap — UX inconsistency."**
Risk: репетитор и манекенша видят разные слова — поддержка путается. Митигация: внутренние термины (db, code) всегда базовые; только UI strings swap; support docs параметризованы через тот же tProf.

## Приложение B — Источники

- **R1** — Profession taxonomy + pack architecture (внутренний research)
- **R2** — JTBD pricing analysis (Strategyn, Tony Ulwick, Patrick Campbell/Profitwell, Acquired podcast, Monetizely 2026, GlossGenius/Vagaro pricing teardowns — с поправкой на критику #1-3)
- **R3** — AI automations cost/UX design (GPT-4o-mini, Whisper, Yandex Vision pricing)
- **R4** — JTBD functional/emotional/social/hidden jobs анализ (внутренний)
- **R5** — Switching cost / data moat (Calendly, Notion, Airtable patterns)
- **R6** — ELITE tier design (Ariely decoy effect, Tversky-Kahneman framing, GlossGenius tier structure)
- **R7** — Adjacent revenue analysis (Russian PSP landscape, 152-ФЗ, Nalog.ru API capabilities)
- **R8** — Notion-grade customization framework (Notion, Airtable, Linear, Coda comparisons)
- **R9** — Cross-vertical UX (Square, Calendly, Linear playbooks)
- **R10** — Network effects (Booksy/Treatwell anti-pattern, Cal.com positive pattern)
- **Adversarial critique** — 30 пунктов поправок, особенно критика #1 (no-show numbers), #4 (iOS PWA), #18 (152-ФЗ), #20 (anti-pattern AI alerts), #22 (RuStore), #25 (realistic ARR), #28 (feature bloat)

**Source verification policy:** все числа из R2 (no-show%, конкретные конкурент-цены) перепроверены против CIS solo-master context перед использованием. Если конкретное число не верифицировано — заменяется на directional statement без числа.