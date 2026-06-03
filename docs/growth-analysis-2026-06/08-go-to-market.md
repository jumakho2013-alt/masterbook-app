# MasterBook Go-to-Market Plan — CIS-First, Global-Next

## 1. Store Optimization

**Google Play (CIS — primary channel):**
- Title: "MasterBook — CRM для мастеров" (30 chars, keyword-dense)
- Short description (80 chars): "Запись клиентов, финансы, напоминания. Для мастеров маникюра, бровей, волос"
- Long description: lead with profession list (SEO), then pain ("забыли клиента?"), then feature bullets with emoji. Russian users scan, not read.
- Screenshots (8 max, first 3 visible without tap = 80% of conversion): (1) calendar with appointments + headline "Все клиенты в одном месте", (2) finance chart "Сколько ты реально зарабатываешь", (3) client card with photo history "История каждого клиента", (4) reminder push mock-up, (5) biometric lock, (6) services, (7) export, (8) dark mode. Use device frames, big Cyrillic headlines, single brand color.
- ASO keywords RU: `crm для мастера`, `запись клиентов`, `журнал мастера`, `маникюр учёт`, `салон красоты`, `мастер бьюти`, `барбер crm`, `репетитор учёт`, `массажист клиенты`, `самозанятый учёт`. Include profession-specific long-tails — competition on "CRM" is brutal, on "учёт клиентов маникюр" it's empty.
- Video: 20-sec screencast, no voiceover, captions only (autoplay muted on Play).

**Apple App Store:** Russian Apple ID accounts still work, but no IAP in RU since 2022 — critical. Either (a) launch in Kazakhstan/Belarus/Armenia App Store with RU language + accept IAP works there, or (b) launch RU App Store with "free + external Telegram payment" (App Store rules now allow link-out for digital goods after 2024 ruling, but risky for indie). **Recommendation: ship Play + RuStore + AppGallery first, defer iOS until 90-day mark or until KZ App Store strategy is settled.**

**RuStore:** mandatory for Russian market reach (preinstalled on new Android since 2023). Submission needs: signed APK, manual moderator review (3–7 days), Russian-only listing, no foreign payment SDKs. Use RuStore's own billing SDK for IAP (15% fee vs Google's 30%). Critical for the 30M+ users who don't use Play.

**AppGailery (Huawei):** ~30M active Russian users. Requires HMS Core integration (or graceful degradation — push won't work without it, but app should still run). Lower priority than RuStore — submit but don't optimize hard.

## 2. Pre-Launch (Weeks -4 to 0)

The GitHub Pages landing exists — upgrade it:
- Single screen: hero screenshot + "CRM для мастера, который не любит CRM" + email field
- Hook: **"Первые 1000 — PRO на 50% навсегда (199₽/мес вместо 399₽)"**. Generates urgency + locks in early cohort at price point CIS will actually pay.
- Telegram community channel `@masterbook_ru` launched immediately, even with 0 members. Post: behind-the-scenes building, polls ("какая фича бесит в текущих CRM?"), screenshots. Goal: 200 subscribers before launch — these become reviewers.
- Waitlist drip: 3 emails — "почему я это делаю", "что внутри", "релиз через 3 дня + промокод EARLY50".

## 3. Distribution — CIS, Zero Budget

**VK groups** — still the master/beauty community hub in RU, esp. regional.
- Target: "Мастера маникюра [город]", "Парикмахеры России", "Бровисты", "Самозанятые мастера". 50–200 groups, 1k–50k members each.
- Approach: DON'T spam-post. Reach out to admins, offer free PRO for life + "честный обзор" — admins post organic review. Cost: 0₽, conversion: high because trust.
- Personal posts in groups that allow it: not "скачай мое приложение", but "запилил себе CRM потому что Dikidi бесит, выложил бесплатно — кому надо?". Self-deprecating + indie = works on VK.

**Telegram channels** — higher quality leads than VK.
- Niche channels: `@beautymaster`, `@nailmasterpro`, `@samozanyatye_rf`, regional master chats. Same playbook: free PRO for admin + organic post.
- Cross-promote with adjacent indie SaaS (book-keeping for self-employed, tax calculators) — mutual shoutouts.
- Your own `@masterbook_ru`: post 3x/week, mix of features, user stories, beauty industry memes.

**Instagram influencers:** Skip mega-influencers (50k+) — they want money, low conversion. Hit **nano-tier (1k–10k)** working masters, esp. regional. Offer lifetime PRO + ask for one Reels story. 30 outreach → ~5 posts → realistic.

**TikTok angles** (don't need to be on it personally, but seed content):
- "POV: ты мастер маникюра и забыла что Маша аллергик на гель" → solve with photo+notes
- "Сколько я заработала за месяц по факту" → finance screen reveal
- "Клиентка просит запись через инсту в 23:47" → reminder/booking link
- Caption hooks > polished video. Each clip = 15 sec.

**vc.ru / Habr / Pikabu:**
- vc.ru: write founder post "Как я один сделал CRM для мастеров и почему YClients для нас не работает". Sentiment-driven, ~500 upvotes possible, drives 500-2000 installs in 48h.
- Habr: technical angle — "React Native + Expo + Supabase для соло-инди". Wrong audience for downloads, right audience for HN-style credibility + GitHub stars.
- Pikabu: only if you have a genuinely funny story. Don't force it.

## 4. Distribution — Global (post-90 days)

Requires: English localization, USD/EUR pricing, App Store presence.
- **ProductHunt:** save for v1.2 with sync + booking page. Single shot — make it count. Tuesday launch, hunter with audience, ship with annual deal.
- **r/beauty, r/Nails, r/Esthetics, r/smallbusiness, r/selfemployed** — share genuinely useful content (templates, calculators), tool mentioned in profile.
- **IndieHackers:** write build-in-public retrospective at 1000 users / $1k MRR. Niche but high signal.
- **Newsletters:** BetaList, AppAdvice, "The Sample" — free submissions, ~3% land.

## 5. Referral Mechanics

Dikidi/Yclones clones win via "приведи коллегу — месяц PRO бесплатно". Implement minimal v1:
- Unique referral code per user in profile
- Inviter gets +30 days PRO per signup that activates; invitee gets 14-day PRO trial (vs 7 default)
- Track via Supabase `referrals` table; no fancy attribution needed
- Surface CTA after first successful month ("ты сэкономил X часов — поделись")

## 6. Retention — Email + Push

**Local push (already built):**
- Day 1: "Добавь первого клиента — 30 секунд"
- Day 3 if no clients: gentle nudge with how-to
- Day 7: weekly recap ("за неделю: 5 клиентов, 12 000₽")
- Reminders before appointments — already done, keep

**Email (via Supabase + Resend, $0 up to 3k/mo):**
- Welcome (immediate), feature spotlight (day 3), monthly recap (day 30), churn-risk (no opens 14d → "что не так?")

**Shut up rules:** never push on weekends after 18:00, never more than 2 pushes/week, kill all marketing pushes if user opens app daily (they don't need nagging).

## 7. Support — Solo Founder Reality

Stack:
- **In-app "Помощь" → opens Telegram chat `@masterbook_support`**. Cheapest, fastest, async, RU users prefer it 10:1 vs email.
- **Email fallback** (`hi@masterbook.app`) for App Store reviewers + iOS users who can't into Telegram.
- **Public FAQ on GitHub Pages** — top 20 questions, takes 1 day to write, kills 60% of tickets.
- Response SLA you can sustain solo: 24h weekdays, 48h weekends. Publish it.
- At 1000 users → buy `Crisp` or `Intercom Starter` ($25/mo) only if Telegram becomes unmanageable.

## 8. Reviews

Ask, but earn it first:
- Trigger review prompt only after: 3rd appointment created **AND** day 7+ active **AND** no crashes in session. Use `expo-store-review`.
- Copy: "Если зашло — закинь 5 звёзд, для соло-разраба это огромная помощь". Honesty > corporate.
- Respond to **every** review within 48h. Negative reviews: thank + fix + reply "пофиксили в 1.2.3". Future readers see this and convert better than positives alone.

## 9. Press & Blogs CIS

- vc.ru — primary target, indie founder story
- Habr — technical post (Expo SDK 54, Supabase RLS lessons)
- "Своё дело" (Tinkoff), "Точка" blog — pitch "tools for self-employed" angle
- Yandex.Дзен beauty bloggers — pitch as product to review
- "Нож", "Forbes Самозанятые" — long shot but high impact
- Cold-email playbook: subject "Соло-разработчик сделал CRM для мастеров — есть кейс", 3 sentences, link, screenshot. Don't follow up more than once.

## 10. Metrics

**North star:** Weekly Active Masters with ≥3 appointments created that week. (Not DAU — masters are weekly tool users, not daily.)

**Leading indicators:**
- D1 retention (target 50%), D7 (30%), D30 (15%)
- Time to first client added (target <3 min)
- Activation = 3 clients + 1 appointment + 1 finance entry within 48h
- Free → PRO conversion (target 4–7% CIS, 6–10% global)

**Churn signals:**
- 0 sessions for 7 days
- Deleted >50% of clients in one session
- Subscription cancel within 30d (refund-zone)
- Trigger save-flow on each

---

## Roadmap

### 0–30 days — Ship + Soft Launch RU/CIS
1. **Critical product gaps before public launch:** Supabase data sync (deal-breaker — reinstall = data loss is a 1-star review machine), RuStore IAP integration, analytics (PostHog free tier), Sentry crash reporting, ESLint baseline, referral table + UI.
2. Submit to Play Store CIS regions (RU, BY, KZ, UZ, AM, KG) — soft launch in KZ first to validate funnel.
3. Submit to RuStore + AppGallery in parallel.
4. Launch Telegram channel, ship landing v2 with waitlist hook.
5. Manual outreach: 50 VK groups, 20 Telegram channels, 30 nano-Instagram. Target: 500 installs, 50 paying.

### 30–90 days — Validate & Iterate
1. Ship: PDF export, online booking page (huge differentiator), push notifications via Expo, offline queue, English locale (start global prep).
2. vc.ru founder post (timed with v1.1).
3. Apple App Store decision: KZ-based listing or skip until global.
4. Referral program live, measure k-factor.
5. First 100 reviews target (each personally responded to).
6. Iterate pricing if conversion <3% — test 149₽/мес for first cohort.
7. Target: 5000 installs, 300 paying, $1k MRR.

### 90–180 days — Global Prep + Scale
1. Full i18n (EN, ES, PT-BR — large beauty markets), multi-currency, USD/EUR pricing tier.
2. iOS Widget, biometric improvements, team accounts (salon owner with 2-3 masters — new pricing tier).
3. ProductHunt launch (v1.5 with sync + booking + widget).
4. Apple App Store global, expand Google Play worldwide.
5. Reddit/IndieHackers/newsletters wave.
6. First paid acquisition test (Yandex Direct CIS, $200 cap) only after organic CAC is known.
7. Target: 20k installs, 1500 paying, $5k MRR, sustainable solo.

**Non-negotiable before any paid spend:** D30 retention >12%, free→paid >4%, NPS measured >30. If unit economics aren't there organically, paid amplifies losses.