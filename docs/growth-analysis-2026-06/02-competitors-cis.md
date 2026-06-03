I have enough data. Let me ignore the task-tracking reminder (one-off research task, no need for TaskCreate) and write the synthesis.

---

# Competitive Analysis: CRM/Booking Apps for Self-Employed Masters in Russia/CIS

## Landscape Overview

The CIS market for service-master CRMs is **dense, web-first, and salon-skewed**. The dominant players were built 2010-2018 for multi-chair salons and bolted on "private master" tariffs as an afterthought. Pure-mobile, solo-first products are rare and ageing.

## Player-by-Player

### YClients (yclients.com) — Market leader, salon-grade
- **Positioning**: SaaS for salons, fitness, clinics. 55,000+ businesses.
- **Pricing**: From 686-771 ₽/mo (~$8); full functionality 24-37$/mo. 7-day trial.
- **Strengths**: Mature backend, POS, multi-branch, payroll, 24/7 support, deep marketing automation, Yandex Maps booking widget.
- **Weakness for solo masters**: Built for salons-with-staff. Onboarding is heavy (training/webinars in the offering). Solo masters frequently call it "избыточно" (overkill) and the mobile app is a secondary UI to the web admin.
- **Mobile quality**: YPLACES app exists but the source of truth is the web dashboard.

### DIKIDI (dikidi.ru) — Volume leader, freemium magnet
- **Positioning**: International (Russia, Kazakhstan, Belarus, Uzbekistan). 120k companies, 15M bookings/month.
- **Pricing**: Free tier with surprisingly broad features, paid from **450 ₽/mo**.
- **Strengths**: Free plan covers most solo-master needs (booking link, schedule, WhatsApp/Telegram reminders, basic client cards). Beginner masters almost always start here.
- **Pain points from real reviews**:
  > "Две айти компании не могут решить проблему клиента, которую сами ему и создали"
  > "Почти два месяца пыталась интегрировать кнопку...результат нулевой"
  > "приложение порой глючит"
  > Privacy concerns — integrations allegedly auto-activated.
- **Mobile quality**: Native apps exist but UX is dated, ratings hover at 3.x–4.x with consistent complaints about bugs and slow support.

### Masters (masters-app.ru) — Closest direct competitor
- **Positioning**: Explicitly for *частных мастеров и мини-салонов*. Almost identical brief to MasterBook.
- **Pricing**: 14-day trial → **~500 ₽/mo** (recently raised, sparking backlash).
- **Strengths**: Long history (since ~2015), 25k+ reviews, dedicated client-side companion app, percentage payouts, prepayment.
- **Pain points**:
  > "This became very expensive" — repeated complaints about the price hike.
  > "Update the interface for Android too, it's sad that iPhone gets updates" — Android UI lags noticeably behind iOS.
  > WhatsApp notifications no longer working reliably.
  > RuStore rating: **3.8 / 5**.
- **Verdict**: Direct competitor whose userbase is actively irritated. Real opening here.

### Мой Профи (moiprofi.ru) — Lead-gen disguised as CRM
- **Positioning**: 400k+ masters; doubles as a marketplace ("услуги рядом").
- **Pricing**: Free CRM but **30% commission on each new client** booked through the marketplace.
- **Pain points**: Otzovik rating **2.2 / 5**.
  > "лохотрон, аккаунты заполняет сам сервис, беря инфо с Авито"
  > "после оплаты 1 ₽ списывают 299 ₽ ежемесячно"
  > "вся база клиентов открыта программистам"
- **Verdict**: Reputational damage = trust opening for an honest, transparent alternative.

### EasyWeek (easyweek.ru) — Web-first scheduler
- **Pricing**: Free tier for solo masters; paid from **789 ₽/mo** (~$8-12.5).
- **Pain points**:
  > "НИГДЕ на сайте не было информации о том, что оформляете подписку с автоматическим списанием" — dark-pattern auto-renewal off a *deleted* card.
  > "платная привязка к мессенджерам".
- Strong web admin, weaker mobile.

### Altegio / GBooking / Rubitime / KwikBi / HelloClient
Mid-tier salon CRMs (400-1000 ₽/mo). All web-first; the mobile app is a thin client. Altegio sits between DIKIDI and YClients; GBooking competes on review-management; Rubitime on simplicity. **None of them is mobile-native or visually modern.**

### Telegram bots (Beauty-Bot, ServiceBookingBot, BotHelp templates)
- A real grass-roots layer: many solo masters wire up a Telegram bot themselves rather than pay for SaaS.
- VC.ru article ["Я — мастер. И я сделал Telegram-бота..."](https://vc.ru/services/2313524-kak-sozdat-telegram-bota-dlya-zapisi-klientov) is emblematic — masters DIY because they refuse to pay subscriptions.
- Limitations: no client-history search, no finance, no portfolio, no analytics. Pure booking-link.

### Yandex Услуги / Avito Услуги / Yandex Maps
- **Not CRMs**, they're discovery/lead-gen layers. Yandex Maps now lets clients book a slot inside the map without leaving — but the master still needs a calendar source-of-truth somewhere. They feed into, not replace, a CRM.

### "Записная книжка" apps in Play Store
Long tail of simple Russian-language scheduler apps (Bukza, Hesus, LUUK, Lokon, Napriem, Beauty Agent). Mostly low-rated, abandoned, or one-developer hobby projects. Confirms the demand exists at the "just a notebook" tier.

---

## Synthesis

### 1. The unmet need MasterBook can own
**"A beautiful, mobile-native, offline-first private notebook for the solo master — that respects their wallet and their data."** Today the choice is: pay for salon-grade overkill (YClients/Altegio), tolerate buggy freemium with shady billing (DIKIDI/Мой Профи/EasyWeek), or DIY a Telegram bot. There is no premium-feeling, mobile-first product priced for an individual.

### 2. Where competitors over-serve
- Multi-branch, payroll, POS, inventory, staff permissions — irrelevant to 80% of solo masters.
- Heavy web admin panels that require a laptop.
- Onboarding via "webinars" and "personal training".
- Per-employee pricing models that make no sense for 1 person.

### 3. Where competitors under-serve
- **Mobile-native polish**: Masters' own users beg for Android UI parity; none of these apps feel like a 2026 iOS app. MasterBook's Liquid Glass + native iOS feel is a genuine differentiator.
- **Offline-first**: every competitor is cloud-bound. Masters work in salons with bad wifi, on house calls, in metros. **None** truly handle offline gracefully. (Caveat: this is also currently a *liability* for MasterBook — reinstall = data loss. Must become a strength, not a bug.)
- **Transparency / trust**: dark-pattern billing is universal pain. A clear "no auto-charge until you confirm" policy is a marketing weapon.
- **Privacy**: "клиентская база открыта программистам" complaints repeat. Local-first storage + biometric lock is genuinely rare.
- **Onboarding speed**: profession-based onboarding (already in MasterBook) is faster than any competitor's generic setup.

### 4. Positioning statement (one sentence)
> **"MasterBook — это твой личный мобильный кабинет: красивый, быстрый, работает оффлайн, не требует подписки на старте, и твоя клиентская база живёт у тебя в телефоне, а не на чьём-то сервере."**

**Moat**: (a) mobile-native UX quality bar competitors can't match without a rewrite; (b) local-first / privacy-first architecture as a *philosophical* stance, not a feature; (c) price point honest enough to convert from DIY/Telegram-bot users.

### 5. Table-stakes features MasterBook is missing today
Ranked by frequency in competitor reviews + own README gaps:

1. **Cloud sync** — *not* for marketing, for **trust**. "Reinstall = data loss" is a deal-breaker. Must ship before paid launch.
2. **Online booking page / link** — every competitor has it; without it MasterBook is just a private notebook, not a CRM.
3. **WhatsApp/Telegram reminders** — local notifications aren't enough; clients need the reminder, not the master.
4. **Prepayment / deposit collection** — Masters and DIKIDI both highlight this; it cuts no-shows and is what justifies the subscription.
5. **PDF export + finance reports** (declared in pricing intent, not built).
6. **Multi-currency + i18n** — required for CIS (KZT, BYN, UZS, AMD) before "regional first" claim is credible.
7. **Real IAP / subscription** — currently advertised but not implemented; this is a release blocker.
8. **Crash + analytics** — flying blind in production is unsustainable.

### 6. Price ceiling for a solo CIS master
Triangulating from competitor pricing, review complaints about price hikes, and DIY behavior:

- **DIKIDI free tier sets the floor at 0 ₽.** Any paid plan has to clear the "why pay if DIKIDI is free?" bar.
- **Masters at 500 ₽/mo (~$5) hit the pain threshold** — that's exactly where review backlash exploded.
- **YClients at 686-771 ₽/mo is perceived as "expensive but salon-grade".**
- Masters who DIY with Telegram bots are saying "even $3/mo is too much for software I can replace with a free bot."

**Recommended pricing for CIS:**
- **Free**: up to 20-30 clients, local-only, no online booking page. (Already declared.)
- **PRO: 299 ₽/mo or 1990 ₽/year** (≈$3.20 / mo, $20/yr) — undercut Masters and DIKIDI-paid, sit below the 500 ₽ pain line.
- **No 30% commission, no auto-charged trial, no dark patterns** — make this a *marketing* claim ("Честная цена. Без скрытых списаний.").
- For App Store global: **$3.99/mo as declared is fine** — non-CIS users tolerate it; CIS gets the local ruble price.

Annual prepay (20-25% discount) is critical in CIS — it sidesteps monthly auto-charge anxiety and locks in revenue before churn.

---

## Sources

- [YCLIENTS pricing / PickTech](https://picktech.ru/product/yclients/)
- [YCLIENTS Capterra](https://www.capterra.com/p/202854/YCLIENTS/)
- [DIKIDI reviews — CRMindex](https://crmindex.ru/products/dikidi/reviews)
- [DIKIDI official](https://dikidi.ru/ru/)
- [Masters App official](https://www.masters-app.ru/)
- [Masters on RuStore (reviews)](https://www.rustore.ru/catalog/app/ru.jamsoft.masters)
- [Мой Профи official](https://moiprofi.ru/master/)
- [Мой Профи reviews — Otzovik](https://otzovik.com/reviews/prilozhenie_dlya_masterov_krasoti_i_ih_klientov_moy_profi/)
- [EasyWeek reviews — hf.ru](https://hf.ru/services/easyweek/reviews)
- [EasyWeek pricing](https://easyweek.ru/biz/pricing/)
- [Comparison of manicure booking apps — valera.ai](https://valera.ai/prilozheniia-zapis-clientov-na-manikiur)
- [Top-10 booking apps 2025 — Revvy.ai](https://revvy.ai/blog/top10_luchshih_servisov_dlya_zapisi_klientov)
- [Yandex Maps integrated booking](https://yandex.ru/blog/yabusiness/onlayn-zapis-v-salony-krasoty-dostupna-pryamo-v-kartakh)
- [Master made own Telegram bot — VC.ru](https://vc.ru/services/2313524-kak-sozdat-telegram-bota-dlya-zapisi-klientov)
- [Beauty-Bot Telegram service](https://bot-beauty.ru/)
- [ProBeautySpace CRM ranking](https://www.probeautyspace.com/post/MD8YNTPK)
- [Komsomolskaya Pravda — Top CRM for beauty salons 2026](https://www.kp.ru/money/biznes/luchshie-crm-sistemy-dlya-salona-krasoty/)