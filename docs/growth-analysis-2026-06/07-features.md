# MasterBook — 25 Differentiated Features (Beyond Table-Stakes)

Ordered roughly by **uniqueness × demand**. Audience appeal 1-10 (gut estimate for self-employed masters in CIS, adjusted note for global where relevant). Effort S=days, M=1-2wk, L=3-6wk, XL=2+mo.

---

## Tier 1 — Ship in v1.2-1.5 (the 8 stars)

### ⭐ 1. "Справка о доходах" — Самозанятый tax-ready PDF report
End-of-month/quarter/year PDF with income by service, NDFL/НПД 4%/6% pre-calculated, ready to attach to «Мой налог» declaration or show to bank for ипотека/credit.
- **Appeal:** 10 (CIS) / 4 (global) — this is THE pain point self-employed face every month
- **Effort:** M — finance data already there, just structured PDF + tax rate logic
- **Moat:** YES — competitors are global, won't bother with НПД integration
- **CIS-only:** Adds /6% logic for ИП-УСН and "0%" for самозанятый-льготник regions

### ⭐ 2. AI: auto-fill service duration & price from natural language
Master types «маник + покрытие Маше завтра в 15» → app parses client, suggests service, fills duration from history, computes price. Whisper for voice input.
- **Appeal:** 9/9
- **Effort:** L — needs on-device NER or cheap Yandex/OpenAI call, fallback rules
- **Moat:** YES if you nail RU language quirks competitors handle poorly
- **CIS+global:** core differentiator

### ⭐ 3. Client mini-site / booking page (masterbook.app/u/anya-nails)
One-tap share. Auto-generated from profile: bio, photos, services with prices, real-time slot picker, deposit via СБП/Stripe, reviews. Replaces Instagram-DM-coordination hell.
- **Appeal:** 10/10
- **Effort:** XL — but partial: v1 = static page + WhatsApp/Telegram "book this slot" deep-link, no real-time
- **Moat:** Partial — Yclients has this but expensive; differentiator is FREE tier
- **CIS+global**

### ⭐ 4. Telegram bot mirror (read + book + remind)
Pair phone via QR. All appointments, reminders, client list mirrored in TG. Master can confirm/move bookings from TG without opening app. Clients book through @masterbook_bot.
- **Appeal:** 10 (CIS) / 5 (global, swap for WhatsApp Business)
- **Effort:** L — single bot, multi-tenant, webhooks to Supabase
- **Moat:** YES — Telegram is THE channel in CIS; no Western competitor will prioritize
- **CIS-first**, WhatsApp twin for global later

### ⭐ 5. "Smart no-show shield" — soft deposit via СБП deep-link
Not full prepayment (CIS clients hate it). Instead: for new clients or after 1 no-show, auto-send «оставьте 500₽ предоплаты, остаток при визите» СБП-link. One-tap pay, auto-refund logic if master cancels.
- **Appeal:** 9/7
- **Effort:** L — СБП QR is free via Тинькофф/ЮKassa APIs
- **Moat:** Partial — Yclients does it for businesses, not solo masters
- **CIS: СБП**, global: Apple Pay / Stripe Link

### ⭐ 6. Receipt-to-expense OCR (photo → categorized expense)
Snap a receipt from магазин для мастеров → GPT-4o-mini / Yandex Vision extracts items, categorizes ("гель-лак — материалы"), suggests reorder date based on usage rate.
- **Appeal:** 8/8
- **Effort:** M — single API call, cache results
- **Moat:** YES at this scale of polish
- **Universal**

### ⭐ 7. Auto-draft personalized reminder text (per client, per service)
Instead of «Напоминаю о визите завтра в 15:00» — AI varies tone per client history: VIP gets formal, regulars get casual, first-timers get directions + "что взять с собой". Master reviews, taps send.
- **Appeal:** 8/8
- **Effort:** S-M — prompt + few-shot
- **Moat:** Soft — execution moat
- **Universal**

### ⭐ 8. "Финансовый компас" — weekly income guard + smart goals
Sunday night summary: «эта неделя 47k, на 12% ниже прошлой; до цели месяца не хватает 23k = 4 маника или 6 окрашиваний». Surfaces actionable next steps, not just numbers.
- **Appeal:** 9/7
- **Effort:** M — pure logic on top of existing finance data
- **Moat:** Soft, execution
- **Universal**

---

## Tier 2 — v1.6-2.0 (high-value, longer build)

### 9. Apple Wallet / Google Wallet appointment pass for client
Master sends link → client adds pass → automatic lock-screen reminder 1h before, walking directions, master's phone one-tap. Zero-friction for the CLIENT (which means fewer no-shows).
- Appeal: 8/8 · Effort: M · Moat: partial (Booksy has it but premium) · Universal

### 10. Heat-map: «твой лучший день недели»
Calendar heat-map of revenue + bookings by day-of-week / hour. Suggests «открой среду 11:00 — стабильно простаивает, попробуй акцию».
- Appeal: 7/8 · Effort: S · Moat: no · Universal

### 11. Client lifetime value (LTV) + "risk of churn" badge
Score: «Маша = 47k за год, не была 6 недель — рискует уйти». Auto-suggests a re-engagement message + discount.
- Appeal: 8/7 · Effort: M · Moat: soft · Universal

### 12. Auto-restock alerts for materials
Master logs «гель-лак Kodi #045, осталось 30%» once → app projects depletion from booking density, pings 5 days before zero, deep-link to Wildberries/Ozon SKU.
- Appeal: 9 (nail/beauty) / 6 (others) · Effort: L · Moat: YES — affiliate revenue from WB/Ozon partner program · CIS-first

### 13. Shareable "Booked!" Instagram/TG story
After client books, master taps "share" → generates branded story image with masked client name + service emoji («запись 🌸 на пятницу 16:00»). Free social proof / marketing.
- Appeal: 8/8 · Effort: S · Moat: no but viral · Universal

### 14. Referral codes for clients ("приведи подругу → скидка 15%")
Each client gets a code from inside the app. Master sees who referred whom, auto-applies discount, tracks acquisition source. Viral loop.
- Appeal: 9/8 · Effort: M · Moat: no · Universal

### 15. "Конкурентка по соседству" — анонимная benchmarking
"Средняя цена на маник у мастеров в Краснодаре: 1800₽. Ты: 1500₽. Большинство загружены 28h/нед, ты: 35h." Pure motivation + monetization hook ("разблокируй в PRO").
- Appeal: 8/7 · Effort: M (needs cohort data → ship after 5k MAU) · Moat: YES — only possible with own user base · Universal

### 16. Hours-per-week guard + burnout warning
«На неделе 62 часа записей. В прошлом месяце ты так выгорел и взял 3 дня больничного. Точно ок?». Health-positioning, viral on TikTok.
- Appeal: 8/8 · Effort: S · Moat: soft (positioning moat) · Universal

### 17. Voice-input appointment («Алиса, запиши Машу на завтра 15:00»)
Wake-word inside app OR via Алиса skill / Siri Shortcut. Hands wet/dirty during work — voice wins.
- Appeal: 8/7 · Effort: L · Moat: partial · CIS+global

---

## Tier 3 — v2.0+ (bigger bets, validate first)

### 18. "Мастер дня" leaderboard, opt-in, by city + niche
Gentle gamification: top by 5-star reviews this week in your city. Winners get free PRO month + featured slot on city landing page. Free SEO traffic for MasterBook.
- Appeal: 7/6 · Effort: L · Moat: YES (network effect) · CIS+global

### 19. AI photo-coach for "до/после" portfolio
Master uploads "после", AI suggests crop/lighting fix, auto-generates 4 caption variants (Insta-style, formal, with hashtags, EN), auto-posts to scheduled queue.
- Appeal: 9/8 · Effort: L · Moat: soft · Universal

### 20. In-app micro-courses by top masters (revenue share)
"Как зарабатывать 200к на маникюре" — 15-min video courses, master pays 990₽, MasterBook takes 30%. Distribution = built-in audience. Lock behind login streak.
- Appeal: 7/6 · Effort: XL · Moat: YES (two-sided marketplace) · CIS-first

### 21. Insurance / equipment loan partnerships
"Страховка от пореза клиента — 290₽/мес через Альфа". "Рассрочка на лампу LED через Тинькофф 0-0-12". Embedded fintech, MasterBook earns commission.
- Appeal: 6/5 · Effort: L (legal) · Moat: YES — boring moat is real moat · CIS-first

### 22. Two-master / studio mode
Solo master rents chair to a friend. Shared calendar, separate finances, split rent auto-calc. Bridge to small-salon segment without becoming Yclients-complex.
- Appeal: 7/7 · Effort: L · Moat: no but defends upmarket churn · Universal

### 23. "Tax buddy" chat — questions about НПД answered by AI + verified by accountant
Free 5 questions/month, PRO unlimited. Pulls real income data from app to give specific answers ("сколько мне платить в этом квартале").
- Appeal: 8/3 · Effort: M · Moat: YES (CIS-specific moat) · CIS-only

### 24. Streak + check-in ritual
Daily 10-second check-in: «всё ок сегодня? сколько записей?». 30-day streak unlocks free PRO week. Habit hook for retention.
- Appeal: 6/6 · Effort: S · Moat: no · Universal

### 25. Offline-first PWA mirror at app.masterbook.ru
Same data, browser access from desktop for masters doing bookkeeping on PC. Critical for Russia where iOS App Store distribution is blocked — PWA is the fallback channel.
- Appeal: 7 (CIS) / 4 (global) · Effort: XL (or M if Expo Router web) · Moat: distribution moat · CIS-critical

---

## Strategic notes

**Why this ordering wins for CIS-first launch:**

1. **Top 8 directly attack the "won't pay for SaaS" problem** — they create either (a) tangible money saved/earned that exceeds 399₽/мес (tax PDF #1, restock affiliate #12, no-show shield #5, referrals #14), or (b) emotional ownership (mini-site #3, AI ассистент #2) that makes churning feel like losing identity.

2. **Telegram-first** (#4) is the single biggest CIS-specific moat. Every Western competitor will deprioritize TG. Master + client both already live there. The bot can be MasterBook's primary distribution channel — install funnel goes TG → bot → app, not App Store → app.

3. **Tax compliance (#1, #23)** is moat-by-boredom. Building НПД-aware PDF feels mundane, which is exactly why Booksy / Square / Fresha will never do it. For Russian/Belarus/Kazakh самозанятые it's THE killer feature.

4. **СБП deposit (#5)** sidesteps the cultural "не люблю предоплату" while still solving no-shows. Critical: it's a soft deposit (10-15%), not full prepay, framed as «подтверждение брони» not «aванс».

5. **Affiliate revenue (#12 restock, #21 fintech)** lets you keep the consumer price near-zero (199-299₽/мес) — matching what CIS will actually pay — while monetizing through B2B partnerships. This is how Тинькофф Pulse, Сбер apps work.

6. **What I'd NOT prioritize despite popularity:** multi-master scheduling (becomes Yclients), full POS with cash drawer (out of scope), crypto payments (regulatory risk), NFT loyalty (cringe).

**Distribution implications baked into the roadmap:**

- RuStore + AppGallery + Play first → iOS is bonus for CIS phase
- PWA (#25) as Russia iOS fallback after the inevitable App Store geo-issues
- TG bot (#4) as zero-app-store install channel — even if all stores ban you, bot reach is intact
- City-leaderboard (#18) generates organic SEO landing pages per city × niche

**v1.2 minimum to feel like a leap, not a patch:** ship #1 (tax PDF), #3 (mini-site v1, static), #7 (AI reminders), #8 (weekly compass), #13 (shareable story). That's ~6 weeks of focused work, all S/M effort, and instantly differentiates from every "appointment book" clone in RuStore.