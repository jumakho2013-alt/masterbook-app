I have enough material. Synthesizing now.

---

# Competitive Analysis: Global Booking & CRM Apps for Solo Service Providers

## 1. Competitor landscape

### Booksy
- **Positioning**: Marketplace-first booking app, strong in barber/beauty in US, UK, Poland, Brazil. Marketplace listing drives discovery — this is the hook.
- **Pricing**: $29.99/mo flat for Booksy Biz (all features included), +$49.99/mo Boost (marketing) add-on. 14-day trial, no card required. Payment processing 2.49–2.69%.
- **Hero**: Marketplace + message blasts + waitlist + gift cards in base price.
- **Wins**: Single transparent price, no add-on creep, strong client-side app for rebooking.
- **Loses**: Expensive for a true solo with <30 clients; CIS coverage near zero.

### Fresha (ex-Shedul)
- **Positioning**: "Free" subscription, monetizes on payments + marketplace commission. Largest catalog globally.
- **Pricing**: Killed free tier in early 2025. Now $19.95/mo Individual or $14.95/team-member. **20% commission (min $6) on new marketplace clients** + 2.19% + $0.20 payment processing.
- **Hero**: Marketplace funnel, integrated payments, polished consumer brand.
- **Wins**: Huge end-consumer awareness in UK/EU/AU.
- **Loses**: Hidden commission angers solos; recent monetization shifts hurt trust.

### Square Appointments
- **Positioning**: Free for solo, monetizes via card processing (Square's main business).
- **Pricing**: **Free for 1 user**. Plus $29–49/mo. In-person 2.6% + 15¢; online 2.9% + 30¢. No new-client fees.
- **Hero**: Free + Square ecosystem (POS, invoices, hardware).
- **Wins**: Genuinely free if you already process card payments via Square.
- **Loses**: Reminders/no-show protection/waitlist locked behind Plus; not available in CIS.

### GlossGenius
- **Positioning**: "Beautiful" mobile-first app for US beauty solos. The MasterBook direct analog in UX language.
- **Pricing**: **$24/mo Standard, $48/mo Gold**. Card reader included. 2.6% per swipe (Standard).
- **Hero**: Best-in-class visual booking site, simple onboarding, mobile-native.
- **Wins**: Sub-30-minute setup, strong solo retention, $24 is the global benchmark for "solo CRM".
- **Loses**: US-only payments rails; no real localization.

### Vagaro
- **Positioning**: Multi-vertical (beauty/fitness/wellness) all-in-one for solos and small teams.
- **Pricing**: Starts $23.99/mo "Just Me", climbs fast via add-ons (forms, payroll, extra calendars).
- **Hero**: Marketplace presence + Apple Maps/Facebook/IG booking widgets + memberships out of box.
- **Wins**: Broad feature surface, included loyalty + email marketing (1,000/mo).
- **Loses**: Add-on creep; UI feels dated vs GlossGenius/Mangomint.

### Setmore
- **Positioning**: Generic scheduling (any vertical, including non-beauty).
- **Pricing**: Free up to 4 users, $12/user Standard, $25/user Premium, $49 Pro unlimited.
- **Hero**: Real free tier with online booking page; fastest "live in 10 minutes".
- **Wins**: Cheapest paid tier among reputable players.
- **Loses**: Thin CRM, no marketplace, generic feel.

### Acuity Scheduling (Squarespace)
- **Positioning**: Power scheduling for consultants/coaches/medical/spa.
- **Pricing**: $20/mo Emerging, $34 Growing, $61 Powerhouse. No free plan, 7-day trial.
- **Hero**: Complex policies, intake forms, packages, subscriptions; Squarespace integration.
- **Wins**: Best when rules get complex (multi-time-zone, intake docs, prep time).
- **Loses**: Overkill and not mobile-first for a hairdresser.

### Calendly
- **Positioning**: Meeting scheduling for B2B/freelancers — adjacent, not a CRM.
- **Pricing**: Free (1 event type), Standard $10/seat (annual), Teams $16, Enterprise custom.
- **Hero**: Friction-free "share-a-link" booking.
- **Wins**: Universal name recognition; freemium that actually works.
- **Loses**: No client records, no payments-first flow, no industry features.

### StyleSeat
- **Positioning**: Marketplace + booking for US stylists/barbers.
- **Pricing**: $35/mo + **30% commission on new marketplace clients** + 3% transaction fee + "Smart Pricing" surge that takes 5.25–5.5%.
- **Hero**: Marketplace discovery in US metros.
- **Wins**: Lead-gen for new solos with empty calendars.
- **Loses**: Highest commission stack in the industry; "booking fee" charged to clients hurts NPS.

### Mangomint
- **Positioning**: Premium SaaS for 2–20 provider salons. Solo is **not** the target.
- **Pricing**: $165 Essentials, $245 Standard, $375 Unlimited. Add-ons $50–75/mo.
- **Hero**: Two-way messaging, virtual waiting room, SOAP notes, polished web app.
- **Wins**: Highest review scores in segment.
- **Loses**: Way out of solo budget; not a comparable to MasterBook.

### Trainerize / WeStrive (fitness)
- **Positioning**: Programming + nutrition + check-ins, not appointment-centric.
- **Pricing**: Trainerize "$23/mo" headline → realistically $100–200/mo with nutrition + branded app + tiers by client count. WeStrive is the cheaper, faster UI alternative (typically <$50/mo).
- **Wins**: Programming engine; in-app workout delivery.
- **Loses**: Not built for booking + finance + clients — different category. Mentioning as adjacency only.

### CIS-native (critical context)
- **YCLIENTS** dominates RU/CIS for salons. Per-employee SaaS, ~₽686–₽1,170/branch/mo entry — built for studios not solos.
- **DIKIDI** — free entry, claims 87 countries, 40k active companies. **Free online booking** is its hero. Paid tier from $9/mo.
- This is who MasterBook actually competes with at home.

---

## 2. Best-of-breed global UX — what's now table stakes

Synthesizing from the top 6, a 2026 solo CRM is expected to ship with:

1. **Public booking link** (subdomain or path: `book.me/master-anna`) with calendar, services, prices, photos, deposit. MasterBook lacks this — biggest gap.
2. **Card-on-file + deposit at booking**. Industry data: deposits drive a **32% increase in successful appointments**, and for >90-min services, a **41% no-show reduction** vs card-on-file-only.
3. **Automated SMS + email reminders** (not just push). Push reminders are insufficient because clients aren't in your app.
4. **Two-way messaging** in-app (sometimes WhatsApp bridge).
5. **No-show fee enforcement** tied to card-on-file.
6. **Waitlist** with auto-fill on cancellation.
7. **Recurring appointments** ("every 3 weeks on Tuesday").
8. **Integrated payments** with one-tap tip prompt.
9. **Memberships / packages / gift cards** (revenue smoothing).
10. **Reports**: client retention rate, rebook rate, revenue per service, top clients.
11. **Marketplace listing** OR at minimum SEO-optimized booking page + IG/Apple Maps booking integration.
12. **Photo intake forms** (before/after, allergies, medical history).
13. **Multi-language client-facing page** (separate from app UI language).

MasterBook today has: scheduling, clients, finance, photos per visit, local reminders, biometric, export. **It's solid as a private notebook. It's not yet a customer-facing brand.**

---

## 3. Global pricing benchmark for solo

| Tier | $/mo | Examples |
|---|---|---|
| Free (loss-leader) | $0 | Square (1 user), Setmore (4 users), Calendly Basic, DIKIDI free |
| Budget paid | $10–15 | Calendly Standard, Setmore Standard, Fresha team-rate, DIKIDI paid |
| **Solo CRM sweet spot** | **$20–30** | **GlossGenius $24**, Vagaro $23.99, Booksy $29.99, Acuity $20, StyleSeat $35 |
| Power tier | $35–60 | GlossGenius Gold $48, Acuity Powerhouse $61 |
| Small-salon SaaS | $100+ | Mangomint $165+ |

**Implication for MasterBook**: declared $3.99/mo PRO is **6–7× below global benchmark**. That's intentional for CIS reality, but globally underprices the perceived value. For Western expansion, MasterBook needs at least two SKUs: ₽299/mo (~$3.50) for CIS and $9.99–14.99/mo for Western launch. App Store Tier 5/6 maps cleanly.

CIS ARPPU reality check: mobile-app willingness-to-pay in RU/CIS is roughly **20–50% lower** than US/Western Europe baseline, and consumer mobile subscriptions skew $3–9/mo globally even before regional discount. $3.99 is realistic.

---

## 4. Table-stakes features MasterBook lacks (priority-ordered)

**Tier 1 — blockers for any positioning as "booking app"** (not just CRM):
1. Public online booking link (web page + deep link).
2. Supabase data sync — **users will leave a no-sync app the moment they switch phones**.
3. Push reminders to *clients* (SMS, WhatsApp, or email — not just owner).
4. Deposit collection / prepayment.

**Tier 2 — competitive parity**:
5. Real IAP subscription (declared but not implemented = lost revenue today).
6. PDF export (clients ask for printable schedules/receipts).
7. Recurring appointments.
8. Waitlist.
9. i18n (minimum EN, then TR/KK/UK/KA).
10. Multi-currency (already on roadmap).

**Tier 3 — retention / differentiation**:
11. iOS Home Screen widget (you have it on roadmap — strong daily-active driver).
12. Analytics + crash reporter.
13. Two-way messaging with client (WhatsApp deep-link MVP).
14. Memberships / packages.

---

## 5. Realistic first markets beyond RU/CIS

Ranked by fit:

1. **Kazakhstan + Belarus + Armenia + Azerbaijan + Uzbekistan + Kyrgyzstan** — same Play Store/RuStore/AppGallery distribution, Russian as lingua franca, similar pricing tolerance, weak local competition. Zero localization cost. **Launch with main release.**
2. **Georgia** — Russian still widely understood in service trades, but add Georgian (KA) + GEL currency early. Booksy/Fresha barely present.
3. **Türkiye** — *the* opportunity. >60% of beauty spend expects online booking; SalonLife localized in 2025, Booksy/Fresha present but expensive. TRY currency, Turkish localization, Iyzico/PayTR for cards. High population, mobile-first, weak default option. **Phase 2 priority.**
4. **Israel** — high WTP, but saturated (Hebrew + RTL is heavy lift). Skip until Phase 4.
5. **Eastern EU (Romania, Bulgaria, Serbia, Poland)** — Booksy is strong in PL; Romania/Bulgaria/Serbia underserved. EUR/RON/BGN, Stripe works. **Phase 3.**
6. **Baltics** — small but high WTP, EU rails. Add-on, not standalone target.

**Skip initially**: US, UK, Germany, Brazil, India — incumbents are entrenched + acquisition cost crushes a bootstrapped solo-CRM.

---

## 6. Localization considerations beyond UI strings

- **Payment rails**: Stripe doesn't serve RU/BY; CIS needs YooKassa/CloudPayments/Tinkoff. TR needs Iyzico/PayTR. KZ needs Kaspi.kz integration (huge). GE has BOG/TBC. Without local rails, "deposit collection" is impossible — and that's the killer feature.
- **SMS providers**: SMSC.ru, SMS.ru, Stream Telecom for RU/CIS. Twilio for global. Turkey: NetGSM, Iletimerkezi. WhatsApp Business API via 360dialog, Twilio, or MessageBird as a cheaper SMS alternative since WhatsApp penetration in TR/RU/UA is very high.
- **Holiday/working calendars**: RU has 8 May holidays + non-standard "transferred days"; TR has religious holidays on lunar calendar; KZ/UZ similar. Need a holiday-aware schedule library.
- **First day of week**: Monday for almost all target markets — easy.
- **Phone format**: E.164 + local validation per country.
- **Currencies + price psychology**: ₽ uses no decimals; TRY uses comma; KZT prices are big numbers — need separators. App Store/Play tier mapping matters more than $-conversion.
- **VAT/NDS invoicing**: many self-employed in RU use "самозанятый" tax regime — integration with Мой Налог API for auto-checks is a *killer differentiator* domestically.
- **App store**: RuStore is mandatory in RU (federal law); AppGallery needed for Huawei users (~15% in CIS); Play Store does not work without billing workaround in RU. Three-store release pipeline is required.
- **Cultural**: in beauty, before/after photo consent norms differ; in TR, Friday is the heavy day; in CIS, Saturday.

---

## Bottom line

MasterBook today is positioned as a **private journal for solo masters** — it's well-built but missing the customer-facing surface that defines a modern booking app globally. The $24/mo GlossGenius is the global benchmark; MasterBook's $3.99 is correct for CIS but needs a higher-tier SKU before any Western move.

The four moves that close the gap in priority order: **(1) cloud sync, (2) public booking link, (3) deposit + client-side notifications, (4) real IAP**. Without (1) and (2), retention will be poor and word-of-mouth limited. With them, MasterBook can credibly own the "GlossGenius for CIS" position — and Türkiye is the first international expansion that maps cleanly onto that.

---

Sources:
- [Booksy Pricing 2026 — SlotCut](https://slotcut.com/blog/booksy-pricing-2026-what-you-actually-pay)
- [Booksy Pricing — official](https://biz.booksy.com/en-us/pricing)
- [Booksy pricing breakdown — GlossGenius blog](https://glossgenius.com/blog/booksy-price)
- [Fresha Pricing 2026 — CostBench](https://costbench.com/software/salon-spa/fresha/)
- [Fresha Pricing — SchedulingKit](https://schedulingkit.com/pricing-guides/fresha-pricing)
- [Fresha fees vs alternatives — Hair & Beauty Directory](https://thehairandbeauty.directory/blog/fresha-vs-hair-beauty-directory-which-right-your-business-2025)
- [GlossGenius Pricing 2026 — SlotCut](https://slotcut.com/blog/glossgenius-pricing-2026-complete-breakdown)
- [GlossGenius official pricing](https://glossgenius.com/pricing)
- [Square Appointments pricing — official](https://squareup.com/us/en/appointments/pricing)
- [Square Appointments pricing — SchedulingKit](https://schedulingkit.com/pricing-guides/square-appointments-pricing)
- [Vagaro pricing 2026 — SlotCut](https://slotcut.com/blog/vagaro-pricing-2026-full-guide)
- [Vagaro pricing — StackScored](https://www.stackscored.com/pricing/salon-spa-management/vagaro/)
- [Setmore vs Acuity comparison — Capterra](https://www.capterra.com/compare/122035-191978/SetMore-vs-Acuity-Scheduling)
- [Setmore vs Acuity for solo — QuantumByte](https://quantumbyte.ai/articles/setmore-vs-acuity)
- [StyleSeat pricing 2026 — Pabau](https://pabau.com/blog/styleseat-pricing/)
- [StyleSeat pricing — GlossGenius blog](https://glossgenius.com/blog/styleseat-pricing)
- [Mangomint pricing — official](https://www.mangomint.com/pricing/)
- [Mangomint pricing 2026 — PulseSignal](https://getpulsesignal.com/pricing/mangomint)
- [Trainerize pricing 2026 — FitBudd](https://www.fitbudd.com/insights/trainerize-pricing-explained-what-it-actually-costs-trainers-in-2026-vs-better-alternatives)
- [Trainerize / TrueCoach hidden fees](https://assistantcoach.fit/blog/hidden-fees-fitness-coaching-software/)
- [Calendly Pricing 2026 — CostBench](https://costbench.com/software/scheduling/calendly/)
- [Calendly Free vs Paid — Koalendar](https://koalendar.com/blog/calendly-free-vs-paid)
- [DIKIDI vs YCLIENTS comparison — A2IS](https://a2is.ru/catalog/rejting-crm-sistem/compare/dikidi-business/yclients)
- [DIKIDI on GetApp](https://www.getapp.com/customer-management-software/a/dikidi/)
- [SalonLife Turkey market review](https://www.salon.life/en/evaluation/best-salon-software-for-small-beauty-salons-in-turkey-full-review-2025)
- [Deposits + no-show policies — Vagaro learning](https://www.vagaro.com/learn/policies-procedures-for-clients-in-salons-examples)
- [Booksy no-show policy guide](https://biz.booksy.com/en-us/blog/no-show-policy-tips)
- [Salon Booking Software Buyer's Guide 2026 — Local Gem](https://www.thelocalgem.com/blog/the-ultimate-buyer-s-guide-to-salon-booking-software-in-2026)
- [WhatsApp Business API providers in Russia — DoubleTick](https://doubletick.io/blog/top-whatsapp-business-api-solution-providers-russia)
- [SMS providers Russia — CommPeak](https://www.commpeak.com/services/sms-api/russia)
- [Regional SaaS pricing — PayPro Global](https://payproglobal.com/how-to/set-up-regional-pricing/)
- [Mobile app pricing strategy — Paddle](https://www.paddle.com/blog/mobile-apps-saas-pricing)
- [Mobile app ARPU estimation — Dojo Business](https://dojobusiness.com/blogs/news/mobile-app-arpu-estimation)