# MasterBook ELITE — Strategic Design

## 1. Audience Profile: Who Pays 1490 ₽/mo

ELITE is not "PRO+". It's a different psychographic. Four archetypes:

**The Veteran Solo Pro (40% of ELITE base).** 5+ years in profession, 150-300 active clients, fully booked 3 weeks out, charges 1.5-2x city average. Treats craft as business. Examples: top manicure master in Krasnodar at 3500₽/manicure, photographer doing weddings at 80k₽, private tutor with waitlist. Pain: spreadsheet chaos, no real numbers on retention, looks "unprofessional" next to studio competitors. Willing to pay for **legitimacy and clarity**.

**The Micro-Studio Owner (30%).** Has 1-3 assistants/junior masters or rents out chairs/rooms. Maybe own salon, photo studio, training space, auto repair garage. Needs multi-staff, commission split, shared calendar. Currently using YClients (2500-4500₽/mo) or Sonline and resenting it. We undercut while feeling lighter and mobile-native.

**The Scaling Operator (20%).** Opening 2nd location, productizing into a course, building personal brand. Photographers franchising styles, fitness coaches with online programs, tattoo artists with apprentices. Needs **brand surfaces**: booking page on custom domain, branded notifications, portfolio.

**The Status Buyer (10%).** Pays for the badge, the directory boost, the verified checkmark. Influencer-masters who screenshot the "ELITE" label. Small segment but high LTV and word-of-mouth multiplier — they tell their network "I use MasterBook ELITE".

Universal across professions: someone who has **moved past survival into optimization**. They don't ask "does it have clients list" — they ask "what's my 90-day retention vs city benchmark."

---

## 2. The ELITE Feature Set (14 features, 6 groups)

### Business Intelligence (the moat)
1. **Cohort retention dashboard.** Visit-2, visit-3, visit-6 retention curves vs your profession's median. "Из 100 новых клиентов в марте, через 90 дней вернулись 47 (топ-15% маникюра РФ)."
2. **Client LTV + segmentation.** Auto-tier clients into VIP / Regular / At-risk / Lost. LTV in ₽. "12 клиентов в зоне риска — последний визит >60 дней при их обычном цикле 30."
3. **Revenue forecast (next 90 days).** Based on rebooking patterns + scheduled appointments + seasonality. Honest confidence band.
4. **Comparative benchmarks.** Anonymized: "Твой средний чек 2800₽ — топ-22% маникюра в Краснодаре. Retention 30d: 71% — выше медианы (58%)." This is the **killer feature** — nobody else has the dataset.

### Brand Surfaces (the visible flex)
5. **Custom booking domain.** `zapis.masha-nails.ru` instead of `masterbook.app/u/masha`. SSL, branded.
6. **White-label PDF + email templates.** Invoices, receipts, confirmations with logo, brand colors, custom copy. Tax PDF for self-employed branded.
7. **Branded SMS sender ID** (where regulator allows — RU via aggregator). "MASHA" instead of generic short code.

### Multi-Staff (the studio unlock)
8. **Up to 3 staff seats** included. Separate calendars, shared client base, role permissions (master sees only own clients vs admin sees all). Commission tracking per appointment.

### Automation & AI (the time-back)
9. **Unlimited AI assistant queries** (PRO caps at e.g. 50/mo). Natural language: "кто из VIP не был >2 месяцев — напиши им" → drafts personalized messages.
10. **Smart auto-rules.** Trigger-based: "если клиент пропустил визит 2 раза подряд → требовать предоплату при следующей записи." No-show prediction score per client.

### Concierge (the white-glove)
11. **Priority support via WhatsApp/Telegram**, <2h response in business hours. Direct line, not ticket queue.
12. **Free migration service.** We import from YClients / Sonline / Excel / Notes manually if needed. One-time, included.
13. **Quarterly 30-min business call** with a MasterBook advisor — reviews your numbers, suggests pricing/retention tactics. Real human.

### Distribution (the growth lever)
14. **MasterBook Directory featured listing + verified badge.** When clients search "маникюр Краснодар Центр" in our public directory, ELITE ranks higher. Once directory has traffic (2027), this becomes the strongest retention lock-in we have.

**Held back for v2:** API access, Zapier — sounds good in pricing tables, low actual usage in this segment, ship when 5+ ELITE users actively ask.

---

## 3. Feature Matrix

| Capability | FREE | PRO (299₽) | ELITE (1490₽) |
|---|---|---|---|
| Clients | 30 cap | Unlimited | Unlimited |
| Appointments | Yes | Yes | Yes |
| Finances + tax PDF | Basic | Full | Branded |
| Cloud sync (Supabase) | — | Yes | Yes |
| AI assistant queries/mo | — | 50 | Unlimited |
| Booking page | masterbook.app/u/name | masterbook.app/u/name + theme | **Custom domain** |
| Staff seats | 1 | 1 | **3 included** |
| Cohort/LTV/forecast | — | — | **Yes** |
| City benchmarks | — | — | **Yes** |
| Branded SMS/PDF/email | — | — | **Yes** |
| Auto-rules + no-show prediction | — | Basic reminders | **Advanced** |
| Support | FAQ | Email 24h | **WhatsApp <2h** |
| Migration service | — | — | **Included** |
| Quarterly business call | — | — | **Included** |
| Directory listing | Basic | Standard | **Featured + verified** |

**Strategic gates:**
- **30 clients on Free** — captures the "trying it out" persona, forces decision at real use.
- **Cloud sync gated to PRO** — biggest single justification for paying anything. PRO must feel essential.
- **Analytics gated to ELITE** — this is the wedge. PRO users see "Unlock cohort analysis" teaser; the data exists, they just can't see the chart.
- **Staff seats on ELITE** — the "I'm a studio not solo" moment is a clean upgrade trigger.
- **Custom domain on ELITE** — visible brand flex impossible on PRO.

---

## 4. Upsell Triggers (when, not just what)

Surface ELITE contextually, max 1x per trigger, dismissible permanently:

1. **100th client added.** "У тебя 100+ клиентов. Хочешь увидеть кто из них на грани ухода? → ELITE"
2. **30-day retention chart viewed 3+ times** (PRO teaser). "Это базовый график. В ELITE — когорты, бенчмарки по городу."
3. **Booking page shared 10+ times.** "Поделился ссылкой 10 раз. В ELITE можно `zapis.твоё-имя.ru`."
4. **Second master added to contacts/notes.** "Работаешь не один? В ELITE — отдельные календари и комиссии."
5. **AI query limit hit.** "50/50 в этом месяце. ELITE — без лимита."
6. **First year anniversary.** "Год в MasterBook. Покажем твою динамику в когортах? → ELITE trial 7 дней."
7. **Tax PDF generated.** "В ELITE — твой логотип в PDF, плюс брендированные чеки клиентам."

Never surface ELITE during: appointment creation, urgent client contact, error states, first session of the day. Trigger from **achievement moments** only, not friction moments.

---

## 5. Anchoring Math

Behavioral pricing: presence of a high anchor (Ariely's decoy effect, Tversky-Kahneman framing) makes the middle option feel like the rational choice. Without ELITE, PRO at 299₽ is judged against "free" (looks expensive). With ELITE at 1490₽, PRO is judged against ELITE (looks like a steal — "5x cheaper for everything I actually need").

Pricing table copy matters: lead with ELITE on the **right** (most-prominent column visually), badge PRO as "Most Popular" — Hick's law + social proof. Conversion target shift: Free → PRO baseline ~3% becomes ~5-6% just from ELITE existing. ELITE itself converts ~0.5-1% of paid base, but contributes ~15-20% of MRR.

Math at 10k paid users: 9500 × 299 + 500 × 1490 = 2.84M + 745k = **3.59M ₽/mo**, vs 10k × 299 = 2.99M without ELITE. +20% revenue, ~5% of users.

---

## 6. Risk of Dilution

PRO must remain a complete product, not a trial of ELITE. Rules:

- **PRO has cloud sync, all core CRUD, finances, basic reminders, tax PDF, AI (limited).** A solo master with 80 clients should feel "PRO is exactly right for me, ELITE would be overkill."
- **ELITE features are about scale and brand**, not about basic functionality. A PRO user should never hit "I literally cannot do my job without ELITE" — only "I would do my job better with ELITE."
- **Don't lock retention chart entirely from PRO** — show 30-day basic retention number. Lock cohorts, LTV, benchmarks. PRO gets "what" (a number), ELITE gets "why" (the cohort breakdown).
- **Avoid loss-aversion gating.** Don't downgrade a feature that PRO users had. Adding ELITE should add, never subtract.

Stress test: "If I'm a solo master with 150 clients earning 200k/mo, why is PRO enough?" — Because I have all CRUD, sync, finances, AI for the common 1-2 daily questions. Benchmarks are nice-to-have; my book is full. Good. PRO survives.

---

## 7. Pricing Experiments

A/B candidates: 990 / 1490 / 1990 / 2490 ₽/mo.

- **990** — too close to PRO (3.3x). Weak anchor, doesn't feel like a class jump. Reject.
- **1490** — 5x PRO. Sweet spot: clearly different tier, still under YClients pro plans (~2500₽). **Recommended.**
- **1990** — clean number, but jump to ~6.6x PRO may suppress conversion of the Veteran Solo segment who's the volume base of ELITE.
- **2490** — only viable if directory traffic and staff features mature; revisit in v1.5.

**Recommendation: 1490 ₽/mo, 12990 ₽/yr (~27% discount, ~1080/mo effective).** Annual paid upfront has 2x LTV of monthly in this segment — push it hard in onboarding to ELITE. Offer **14-day ELITE trial** auto-activated for any PRO user who hits 2+ upsell triggers — convert intent into experience.

---

## 8. Counter-Objections

| Objection | Counter (in-app copy) |
|---|---|
| "Дорого" | "1490₽/мес = цена одного маникюра. Если ELITE поможет удержать 1 клиента в месяц — окупился." |
| "Я и так знаю своих клиентов" | "Знаешь, кто из них вернётся через 60 дней, а кто уже ушёл к конкуренту? Покажем." |
| "Мне не нужен брендинг" | "Брендинг — для клиентов, не для тебя. Они видят `masterbook.app/u/...` или `zapis.masha.ru`. Второе запоминается." |
| "У меня нет команды" | "ELITE — не про команду. Это про твою аналитику и брендинг. Сотрудники — бонус когда появятся." |
| "Я попробую, потом откажусь" | 14-дневный trial без карты. Refund первого месяца без вопросов. |
| "PRO мне хватает" | "Отлично. Если когда-то захочешь увидеть свою динамику и бенчмарки — ELITE на месте." |

Never use FOMO/scarcity tactics ("Только 100 мест!") — destroys trust in this segment.

---

## 9. What ELITE is NOT

- **Not "PRO with more limits removed."** Removing a cap is not a product class. ELITE has structurally different features (cohorts, brand surfaces, human concierge).
- **Not feature bloat.** No "ELITE-only checkbox color customization." Every ELITE feature must justify ≥100₽/mo of perceived value on its own.
- **Not enterprise.** No SSO, no audit logs, no SLA contracts. The Veteran Solo Pro is not a CIO.
- **Not opt-in chaos.** ELITE features default to sensible behavior; no 47-screen settings panel. Concierge call is **scheduled by us**, not by them — removes activation friction.
- **Not a forever ladder.** No Enterprise tier above ELITE in v1. Adding tiers above signals "we're a SaaS pricing machine"; staying flat signals "this is the top, you've arrived." For status buyers that flatness is the product.

**The mental model:** PRO is the **professional's tool**. ELITE is the **operator's command center + brand layer + advisor on call**. Different category. A PRO user upgrading to ELITE should feel like they graduated, not like they bought an upsell.

---

## Closing: Why This Anchors Even If Few Buy

ELITE's primary KPI is **not ELITE MRR**. It's:
1. **PRO conversion lift** (the anchor effect) — measure pre/post-ELITE PRO conversion %.
2. **Brand legibility** — "MasterBook has a real top tier" → looks like a serious product to investors, press, partners.
3. **Power-user retention** — the 5% who would otherwise churn to YClients now have a home.

Even if only 3-5% of paid users go ELITE, the tier earns its keep through what it does to perception of the other tiers. That's the contrast pricing dividend.

Ship ELITE in **v1.3** (after IAP in v1.2), starting with: cohort dashboard + benchmarks + custom domain + 3 staff seats + WhatsApp support + migration service. Add brand templates, auto-rules, directory boost in v1.4. API/Zapier only when ≥5 ELITE users have asked unprompted.