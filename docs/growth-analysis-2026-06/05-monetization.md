# MasterBook Monetization Strategy — CIS-First Roadmap

## Phase 1: Launch CIS (Month 0-3)

### Pricing recommendation: ₽299/mo, ₽2,490/year (₽208/mo effective, -30%)

**Why this number, not $3.99 (~₽380):**

CIS willingness-to-pay for solo-master SaaS is anchored by three benchmarks:

- **YClients "Личный" (personal/solo tier)**: starts at ~₽686/mo annual prepay, ₽857/mo monthly — but includes online booking widget, SMS, full CRM. Premium positioning.[^1]
- **Dikidi PRO for masters**: ₽290-490/mo depending on region and features; free tier exists with platform commissions on bookings.[^2]
- **Altegio (ex-YClients international)** mirrors same band ₽600-900/mo.
- **Arnica / Beauty Pro** sit at ₽490-1,200/mo but target salons not solo.
- **Tinkoff "Мое дело"/Самозанятые app**: free (bank-monetized).
- **Kazakhstan parallel**: ₸1,500-3,000/mo (~₽280-560) is the sweet spot per local indie SaaS (Fingooroo, Beautyhub).

Solo-master psychology: ₽299 = "less than one manicure", "less than two coffees". ₽499+ starts being compared to YClients-with-online-booking. Until MasterBook ships online booking, you cannot compete in YClients' price bracket — you must undercut. **₽299/mo positions as the no-frills personal CRM**, distinct from "salon software".

For Belarus: 9.90 BYN/mo (~₽290). For Kazakhstan: ₸1,690/mo. For Ukraine (when relevant): 129 UAH/mo. Localize price *strings*, not just conversion.

### Free tier: 30 clients, not 20

Argument for 20: forces conversion faster, "feels" generous enough for trial.
Argument for 30: a working solo master has 40-80 active clients/month. 20 trips the limit during the *trial week* before the user has built habit. 30 lets them load their existing book (which is what makes the app sticky), hit the wall in week 3-4 when they're already dependent on it, and convert.

**Conversion data from indie SaaS in the category** (Bonsai, HoneyBook, Wave) consistently shows: limits that bite in week 1 → 4-7% conversion + high churn refunds; limits that bite week 3-5 → 12-18% conversion + lower refund.[^3]

Recommendation: **30 clients free, unlimited appointments, unlimited services, basic finance**. Paywall: photos per visit, finance charts/export, JSON/PDF backup, biometric lock, multi-device sync (when shipped).

This is psychologically clean — free tier is a *functional CRM*, PRO is *professional tools*. Don't paywall the wrong feature: never paywall reminders (it would make the app worse than paper) or basic appointment creation.

### Payment rails — the hard part

Apple IAP and Google Play Billing **cannot charge Russian-issued cards** since March 2022, and Apple removed in-app purchase capability for RU-region apps entirely.[^4] You cannot ship PRO via standard IAP for CIS users. Options:

| Rail | Pros | Cons | Verdict |
|------|------|------|---------|
| **RuStore Billing SDK** | Native, supports СБП + RU cards, official, accepted by Play (parallel install) | Only works in RuStore app, not Google Play | **Primary rail for RU users** |
| **ЮKassa / CloudPayments via webview** | Works anywhere, supports СБП, recurring | Google Play TOS forbids external payment for digital goods → can get app removed. App Store likewise. Use ONLY in RuStore/APK/web build | Secondary |
| **Telegram bot subscription** | Zero infra, fast, social proof via channel | Manual, doesn't scale past ~500 subs, no recurring without Telegram Stars or webhook | Bridge for first 50 users |
| **Telegram Stars** | Recurring, in-Telegram, no card needed | 30% fee to Telegram, conversion friction | Worth offering as one of several |
| **Apple IAP / Play Billing** | Standard | Blocked for RU cards | **Required for AppGallery/Play Global later** |

**Recommended stack for CIS launch**:
1. **RuStore build** with RuStore Billing (СБП + cards). Primary distribution.
2. **AppGallery build** (Huawei) — uses HMS IAP, works with RU cards via СБП integration.
3. **Google Play build** — ship as freemium, but PRO unlock is "via website" using ЮKassa subscriptions; do NOT mention payment inside the app (Play policy compliance: the app can link out only via a webview opened from settings, must not show price in-app). Risky — many indie devs get away with this, some don't. Conservative version: Play build is free-only, direct paying users to RuStore.
4. **Direct APK download** from your GitHub Pages site with ЮKassa — for power users who refuse stores.

### Sneaky-good launch hooks

- **"First 100 PRO Lifetime" — ₽2,990 one-time**. This converts your founding superfans, gives you ₽299K cash to fund first 6 months, and they become evangelists. Cap strictly at 100, announce remaining count in-app ("23 of 100 left") — scarcity is honest because it's real.
- **Referral: 1 month PRO per friend who subscribes**, max 12 months/year stacked. Solo masters refer other masters they meet at trade shows / training courses — high-trust word-of-mouth in this niche.
- **Yearly prepay -30%** (₽2,490/year vs ₽299×12=₽3,588). Industry standard, kills churn, smooths cash flow.
- **Gift codes** — masters often gift "tools" to peers; let them buy a 1/3/6-month code as a redeemable string. Implementation: server-side codes table, ~half a day of work.
- **Pause subscription** (don't cancel, pause up to 3 months). Beauty industry has maternity leave, off-season. Pause-don't-churn keeps LTV. This is the #1 retention move competitors don't offer.

## Phase 2: Scale CIS (Month 3-9)

### Ship the gap features that unlock higher pricing tier

Add a **PRO+ tier at ₽599/mo / ₽4,990/year** containing:
- Online booking page (web link clients open → pick service/time → confirms in app)
- Cloud sync (Supabase backed, fixes the reinstall=data loss disaster)
- Remote push (appointment reminders to clients, not just to master)
- PDF export with branded header
- Multi-master mode (1 owner + 2 employees) — bridges to small salons

This is where you start eating YClients' lunch on price. YClients with online booking + reminders is ~₽1,200/mo. PRO+ at ₽599 is half their price for the 80% of features a solo master uses.

**Don't introduce take-rate on bookings**. CIS masters hate platform fees viscerally — Dikidi's 5-10% commission is their #1 complaint in reviews. Flat subscription wins on trust here. *Predictable cost is itself a feature.*

### Multi-currency, properly

Detect locale → display ₽/₸/BYN/USD. Store internal as integer minor units + ISO currency code per record. **Critical: existing users have USD hardcoded — write a backfill migration that defaults to RUB for RU locale, USD elsewhere**, and prompt user once to confirm. (Per the cross-layer checklist in CLAUDE.md: don't ship the schema change without the backfill.)

### Anti-patterns to avoid

- Paywalling export/backup — feels like ransom on the user's own data. Keep JSON export free; paywall *PDF* (branded artifact, has perceived value).
- Surprise fees post-onboarding — show paywall *prices* on the onboarding "Why PRO?" screen, not just feature names.
- "Trial that auto-converts without warning" — Apple/Google require notification but RuStore is laxer; do it anyway, ethically. Send 3 reminders: 3 days before, 1 day before, on the day. Trust > one bad refund.
- Hiding the cancel button. The faster cancellation works, the higher renewal trust.
- Dark-pattern "Free tier limit reached" without showing exact what hit the limit. Show: "You have 30/30 clients. Add #31 with PRO."

## Phase 3: Go global (Month 9-18)

### USD/EUR pricing with PPP adjustment

| Region | Monthly | Yearly |
|--------|---------|--------|
| US / Western EU | $4.99 / €4.99 | $39 / €39 |
| Eastern EU (PL, RO, etc.) | €2.99 | €24 |
| LatAm (BR, MX) | $2.49 USD-equiv local | $19 |
| SEA (ID, PH, VN) | $1.99 USD-equiv | $14 |
| India | ₹149/mo | ₹999/yr |
| Turkey | ₺79/mo | ₺590/yr |

Apple/Google have built-in price tiers per region — use them, don't reinvent. Research from RevenueCat's 2025 State of Subscription Apps shows productivity apps achieve 2.3-3.1× higher conversion in non-US markets with PPP pricing vs flat USD.[^5]

For global, **switch to standard Apple IAP / Play Billing** outside CIS. Build flag at runtime: if locale = RU/BY/KZ/UZ → RuStore/ЮKassa path; else → native IAP. RevenueCat (free up to $2.5K MTR) handles both abstractions and saves you weeks.

### Localized tier names (don't translate "PRO" literally)

- RU: "PRO" works as-is, English loanword is premium-coded.
- DE: "Profi" feels native, "PRO" feels imported (which is fine for some brands, not all).
- ES/PT: "PRO" or "Premium" both work.
- JA: avoid Pro/Free dichotomy — try "スタンダード/プレミアム" (Standard/Premium).

## LTV/CAC math for solo-launched sustainability

Conservative assumptions for CIS solo launch:

- ARPU monthly: ₽299, blended yearly conversion 35% → effective ARPU ~₽250/mo
- Churn: 8%/mo realistic for SaaS without sync (high — data loss panic); → 4%/mo after PRO+ ships with cloud sync
- LTV phase 1: ₽250 / 0.08 = **₽3,125** per paying user
- LTV phase 2: ₽250 / 0.04 = **₽6,250**
- Free→PRO conversion target: **5%** (industry standard freemium SaaS: 2-5%; productivity vertical with hard limit: 6-10%)[^5]
- Implied paying-user value: 5% × ₽3,125 = ₽156 per installed user phase 1

**CAC budget**: with no investors, target CAC ≤ ₽500 per *paying* user (LTV/CAC > 6 in phase 2). This means ≤ ₽25 per *install* at 5% conversion. ASO + Telegram channels for beauty masters + trade-show flyers fit; paid Yandex.Direct/VK Ads typically run ₽40-80 per install in this niche — *don't* spend until LTV is proven with first 200 organic users.

**Break-even**: at ₽299/mo and zero CAC (organic only), 100 paying users = ₽30K/mo net of platform fees, ~₽25K after RuStore's 5-10% (vs Apple's 15-30%, another reason RuStore wins phase 1). 200 paying = ₽50K/mo, indie sustainable. 500 paying = ₽125K/mo, full-time viable.

Target trajectory: **200 paying by month 6, 500 by month 12, 1,500 by month 24**. Achievable for a well-positioned solo CRM in a CIS niche of ~500K self-employed beauty/wellness masters.[^6]

---

[^1]: YClients pricing page, "Личный" tariff: https://yclients.com/tariff (current as of 2026)
[^2]: Dikidi master pricing, https://dikidi.ru/promo
[^3]: ProfitWell freemium conversion benchmarks 2024; Lenny Rachitsky "Freemium tear-downs" series
[^4]: Apple Developer notice March 2022, ongoing; Google Play Russia limitations notice. Russian-issued Mir/Visa/MC do not clear Apple/Google billing.
[^5]: RevenueCat "State of Subscription Apps 2025"
[^6]: ФНС self-employed registry stats 2025: ~9M НПД payers, beauty/wellness ~6-7% per category breakdown