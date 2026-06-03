I have enough material. Synthesizing the report now.

---

# Research: Pain Points & Feature Demand — Self-Employed Beauty/Service Masters

## Demographics & Context (CIS focus)

- **Russia: 12M+ registered "самозанятые"** (self-employed/tax-light regime). Beauty (manicure, brows, lashes, hair) is among the top "women's" categories. Median age of самозанятый ~36, but **manicure/pedicure skews 18–35**, women-dominated. Tax rate 4% (services to individuals), capped at 2.4M RUB/yr revenue. (Minfin, sznpd.ru)
- **Primary device: Android.** RuStore and Google Play (via APK + AppGallery) carry the bulk of CIS traffic. iOS is a minority but disproportionately important for "premium-positioning" masters in Moscow/SPb.
- **Tech literacy: low-to-medium.** A vc.ru product author observed it bluntly: *"мастер на дому не освоит SaaS-панель, но напишет в бота между клиентами, пока сохнет гель-лак"* — home-based masters won't master a SaaS panel; they'll tap a bot between clients while gel-polish dries.
- **Today's tools they actually use:** paper journal, Instagram/Telegram Direct, WhatsApp, Excel, Notes app. Apps they try and abandon: YClients (too complex, salon-oriented), DIKIDI, Bumpix, Masters, BloknotApp.

---

## Top 10 Pain Points (with verbatim sources where found)

1. **No-shows & last-minute cancellations.** The #1 universal complaint. From pact.im/Russian beauty press: *«клиент записывается и забывает, страдают все: салон теряет деньги, мастер — зарплату»*. NAILS Magazine notes most techs *"lose clients when they enforce no-show policies"* — so they don't enforce, and bleed money. (pact.im, NAILS Magazine)

2. **Reminding clients manually via WhatsApp eats hours.** *"подавляющее большинство мастеров напоминают через WhatsApp"* — masters copy-paste reminder messages because in-app SMS is paid extra, unreliable, or doesn't reach Russian numbers. (valera.ai, intellectdialog.com)

3. **Existing CRMs are built for salons, not solo masters.** vc.ru product review: *"почти все существующие CRM-системы ориентированы на оптимизацию работы салонов красоты и имеют сложный интерфейс с множеством непонятных и просто ненужных функций для фрилансеров."* (vc.ru)

4. **App eats money and breaks at the worst moment.** Real DIKIDI Business reviews on otzovik/RuStore:
   - *"Не работают ни создание записей, ни отправка сообщений"* (Ольга, 1★)
   - *"белый экран... это очень неудобно когда срочно нужно записать клиента"* (Ната)
   - *"Списывают деньги за уведомления, а подключать нормально не помогают"* (Надежда, 1★)
   - *"Сегодня как крысы удалили втихушку все ссылки на инстаграм у всей базы клиентов"* — 2000+ contacts wiped (Анатолий). (rustore.ru, otzovik.com)

5. **Support is dead.** Recurring across DIKIDI, Booksy, GlossGenius. crmindex.ru: *"Техподдержка никакая, никто даже пальцем не пошевелит"*. Booksy reviewers report *"verification SMS codes don't work, support doesn't respond, costs barbers customers."* (crmindex.ru, BBB)

6. **"Don't know what I actually earned this month."** Self-employed pay 4–6% tax on declared income; masters guess. Banki.ru/RSHB content shows this is the #1 question on tax-related searches. Apps that show net month-to-date in one tap solve real anxiety.

7. **Photo portfolio lives in 5 places.** Before/after shots scattered across Instagram, phone Camera Roll, WhatsApp, Telegram. No one place tied to the client card. Masters re-ask returning clients *"что мы делали в прошлый раз?"*.

8. **No online booking link to put in Instagram bio.** Solo masters survive on Instagram. The "link in bio that just works" — without forcing the client into a downloaded app — is repeatedly cited as the killer feature of Fresha/GlossGenius/Booksy. Russian masters often pay YClients a lot purely for this widget.

9. **Forgetting to remind themselves.** *"забыла записать клиентку — она пришла, а время уже занято"*. Double-booking on paper. The local-notification reminder (already in MasterBook) is exactly what they need — but they don't know to look for it.

10. **Surprise pricing / "first month free then 1500₽/mo."** Booksy/Boost charges users **for clients they brought themselves**: *"Boost feature has been repeatedly charged for the user's own clients found through social media, feeling like it's turning into a robbery"*. This trust violation is the #1 reason masters churn out of paid CRMs and back to the notebook. (App Store, BBB)

---

## Top 10 Most-Requested Features Not Yet in MasterBook

1. **Public online booking page (link-in-bio).** Single highest-leverage feature. A `masterbook.app/u/anna-nails` page where clients pick service + slot. Even read-only "see free slots" is huge. Listed as essential in every "must-have features 2025" list (gohappybeauty, Trafft, Fresha).

2. **WhatsApp/Telegram auto-reminders** (not SMS — too expensive in CIS, and clients ignore SMS). A "tap to send pre-filled WhatsApp reminder" deep-link (`wa.me/...?text=...`) costs nothing and would shock-and-awe.

3. **Deposit / prepayment collection.** Even a manual "mark deposit received" flag + an auto-message *«предоплата 500₽, при отмене менее чем за 24ч не возвращается»* would let masters enforce policy without confrontation. Full IAP-style Stripe/ЮKassa link is the long form.

4. **Client blacklist / "ненадёжный" flag** with reason and auto-warning when re-booking. EasyWeek markets this explicitly; Russian masters trade no-show lists on Instagram (`@blacklistmaster`). MasterBook can ship as a single boolean + note field.

5. **Cloud sync / multi-device + survive reinstall.** The biggest *trust killer* in your current product. *"клиенты и записи начали пропадать"* (DIKIDI review) — this is what masters fear most. Currently MasterBook reinstall = total data loss. Must ship before paid tier.

6. **Recurring appointments / "коррекция через 3 недели".** Every gel-polish client comes back on a 21–28 day cycle. One-tap "rebook same time +3 weeks" is the single biggest workflow accelerator.

7. **Visit history with last-used materials & formula** (gel-polish color code, hair dye formula, lash curl). Eliminates *"что мы в прошлый раз делали?"*. Photo per visit already exists — text-note structured fields would close the loop.

8. **PDF receipt / "чек" for client + tax export.** Russian самозанятые need to register income in «Мой налог». An export that feeds it (CSV with date/amount/client) saves 30 min/month.

9. **Multi-currency + multi-language.** Roubles hardcoded blocks CIS expansion (KZT, BYN, UZS), and Russian-only blocks Kazakhstan/Belarus bilingual masters and any global push.

10. **Birthday / "пропавший клиент" alerts.** Auto-flag *"Анна не была 60 дней — написать?"*. Trivial to implement on top of existing data. Listed as standard in every Russian CRM review (rubitime, helloclient).

---

## Onboarding Friction — Why Masters Quit in Week 1

- **Too many fields on first launch.** YClients-style "fill 12 service categories, 5 staff, work hours, integrations" before seeing value. Masters who add 1 client and 1 appointment and get a reminder ping that night are converted. MasterBook's profession-based onboarding is already good here — keep it ruthless.
- **Forcing account creation before showing value.** Multiple reviews of competitors complain about login walls. Let them try fully offline; sync is a Pro-tier upsell.
- **Russian phone-number / SMS verification fails.** DIKIDI/Booksy users repeatedly report SMS codes never arriving. Apple Sign-In and email-only auth (which you have) is a competitive advantage — advertise it.
- **No data import.** They have 200 contacts in a notebook or Excel. CSV import or "photo of journal → OCR" would melt the activation barrier.
- **Doesn't work without internet at home/in basement salon.** Many home-based masters work in spotty WiFi. Local-first (which MasterBook already is) is a genuine moat — *say it on the store page*.

---

## The "Wow Moment" — Free → Paid Conversion Trigger

Based on what masters describe as the moment they decide an app is "worth paying for":

1. **First time a client arrives because the auto-reminder pinged her the night before.** Master attributes the save to the app and never goes back.
2. **First month-end when "сколько я заработала?" answers itself with a number she trusts.** Finance dashboard + monthly summary push notification at end of month.
3. **First client books herself via the link in Instagram bio without a single message exchange.** Hands-free booking is the conversion event in every Western competitor's funnel.
4. **First time she gets a "не забудьте про коррекцию" auto-message to a client and the client books back.** Retention loop closed.

Position the $3.99 Pro upsell trigger at #1 or #3 — those are the moments she'll pay.

---

## Trust Killers (instant uninstall reasons)

- **Data loss on reinstall / phone change.** Currently MasterBook's #1 risk. Ship Supabase sync before any paid push.
- **Surprise charges** (Booksy Boost story above). Be brutally transparent: "20 clients free forever, no card on file required".
- **Ads in a paid context** — masters tolerate ads in free, hate them after upgrade.
- **Slow opening on Android budget devices.** Many CIS masters on 4-year-old Xiaomi/Samsung A-series. Test on 2GB RAM.
- **Russian language errors / Google-translate UI.** Native-feeling RU copy is table-stakes; current state is good.
- **Asking for permissions you don't need** (contacts, location). Each one is a churn moment.
- **App "forgetting" an appointment** (notification didn't fire). One missed reminder = uninstall. Local notifications must be bulletproof; add foreground re-check on app open.

---

## Demographics / Device Constraints Summary

- **Age 22–40 dominant**, secondary peak 40–55 (hair, cosmetology).
- **Android-first in CIS (~75–85%)**; iOS premium niche.
- **Phone sizes 5.5"–6.7"**, mostly mid-range. Avoid dense tables; bottom-sheet patterns work.
- **Often working with wet/gloved hands** — touch targets must be large (44pt minimum is already in your audit). Voice input for client notes would be loved.
- **Multi-tasking constantly** — Instagram DM, WhatsApp, the app, the timer for gel-polish curing. A built-in **procedure timer** is a sleeper feature.

---

## Sources

- DIKIDI Business reviews (1–3★ verbatim): [otzovik.com](https://otzovik.com/reviews/dikidi_business-servis_dlya_onlayn-zapisi_i_avtomatizacii_salonov_i_chastnih_masterov/), [rustore.ru/dikidi.beauty.business/reviews](https://www.rustore.ru/catalog/app/ru.dikidi.beauty.business/reviews), [crmindex.ru/dikidi](https://crmindex.ru/products/dikidi/reviews)
- DIKIDI outage reports: [downdetector.su](https://downdetector.su/blog/1673/read)
- Booksy / GlossGenius comparison & complaints: [softwareadvice.com](https://www.softwareadvice.com/barbershop/booksy-profile/vs/glossgenius/), [goodcall.com](https://www.goodcall.com/appointment-scheduling-software/glossgenius-vs-booksy), [BBB Booksy](https://www.bbb.org/us/il/chicago/profile/marketing-consultant/booksy-inc-0654-1000106496/complaints), [Booksy App Store reviews](https://apps.apple.com/us/app/booksy-for-customers/id723961236?see-all=reviews)
- Russian beauty industry pain analysis: [pact.im — клиенты не приходят](https://www.pact.im/blog/klienty-zapisyvayutsya-v-salon-no-ne-prihodyat-chto-delat), [salonmarketing.pro — предоплата](https://salonmarketing.pro/blog/predoplata-v-salonah-krasoty-i-kosmetologicheskih-centrah.html), [life.ru — предоплата](https://life.ru/p/1359798)
- vc.ru solo-master CRM articles: [бесплатная альтернатива YClients](https://vc.ru/services/2792550-besplatnaya-alternativa-yclients-dlya-masterov-krasoty), [топ-11 приложений](https://vc.ru/services/2621340-top-11-prilozheniy-dlya-onlayn-zapisi-klientov), [топ-10 программ 2025](https://vc.ru/marketing/2059047-top-10-programm-dlya-salonov-krasoty-2025)
- WhatsApp reminder behavior: [valera.ai — рассылки](https://valera.ai/rassylka-dlia-clientov-na-manikiur), [intellectdialog.com](https://intellectdialog.com/tpost/instagram-yclients-direct-kommentarii-zapis)
- No-show forum / NAILS Magazine: [nailsmag.com — deposit policy](https://www.nailsmag.com/598610/should-i-start-requiring-a-nonrefundable-deposit-for-special-time-appointments), [salongeek thread](https://www.salongeek.com/threads/no-show-late-clients.269034/)
- Russian tax / самозанятость: [Minfin — 12M самозанятых](https://minfin.gov.ru/ru/press-center/?id_4=39510-fns_chislo_samozanyatykh_v_rf_dostiglo_bolee_12_mln_chelovek), [sznpd.ru статистика](https://sznpd.ru/statistika/), [banki.ru — НПД](https://www.banki.ru/news/daytheme/?id=11004824), [ecolespb.ru — оформление](https://ecolespb.ru/blog/razbor/samozanjatost-kak-bjuti-masteru-oformit-biznes-i-platit-nalogi)
- Must-have features lists: [gohappybeauty — 12 best 2025](https://gohappybeauty.com/best-nail-salon-software/), [trafft.com — 7 best 2025](https://trafft.com/best-nail-salon-appointment-software/), [businessupturn.com — 10 must-have](https://www.businessupturn.com/technology/apps/must-have-nail-salon-software-10-apps-to-transform-your-salon-management/)
- Blacklist culture: [@blacklistmaster Instagram](https://www.instagram.com/blacklistmaster/), [EasyWeek no-show guide](https://easyweek.io/how-to-reduce-no-shows-in-beauty.html)