# MasterBook JTBD Analysis: What the App Is Really Hired To Do

## 1. Functional Jobs (clustered by frequency)

**Daily (every working day, multiple times):**
1. Know who is coming next and when — quick glance "what's my day look like"
2. Capture a new booking in <30 seconds while the client is still on the phone/in DM
3. Reschedule without losing track of the old slot (client cancellations are constant)
4. Record cash/card received after each appointment (or the master forgets by evening)
5. Remind the client about tomorrow's slot (cuts no-shows by ~40%)
6. Find a specific client's phone/last visit in <5 seconds while client is talking
7. Note something mid-appointment ("Lena prefers no cuticle oil, allergic to X")

**Weekly:**
8. Fill empty slots — see where the gaps are next week, decide whether to promote
9. Reorder consumables (gel, color, blades, oil) before running out mid-week
10. Reconcile cash on hand vs. what the app says was earned
11. Send a "miss you" nudge to clients who haven't visited in their usual cycle
12. Check who hasn't paid (deposits, instalments, packages)

**Monthly:**
13. See total income vs. last month — "am I growing or sliding?"
14. Pay rent/booth fee/tools and log it as expense
15. Pay self-employed tax (НПД in RU — 4% or 6%) and have proof
16. Decide whether to raise prices on a specific service
17. Identify top 10 clients (Pareto — usually 20% bring 60% of revenue)
18. Cull dead clients (haven't returned in 6+ months)

**Quarterly:**
19. Plan vacation/days off and block calendar
20. Review which services are profitable vs. time-eaters
21. Decide whether to add a new service category

**Yearly:**
22. File tax return / generate annual statement
23. Year-in-review: revenue, top clients, peak months, growth %
24. Decide whether to invest in equipment, courses, or rent a bigger spot
25. Renegotiate booth rent / move to own studio

---

## 2. Emotional Jobs

| Emotional Job | Features That Serve It | Features That Violate It |
|---|---|---|
| **"I want to feel like a professional, not a hobbyist"** | Liquid Glass polish, profession-based onboarding, clean PDF receipts, biometric lock | Beauty-only iconography (nail polish bottles, lash diagrams) — kills it for a plumber/tutor |
| **"I want to feel in control of my chaos"** | Today view, reminders, "next 7 days" overview | Empty states with no guidance; if the app shows 14 things on the home screen with no priority |
| **"I want to feel my work is appreciated"** | Repeat-client streaks, "Lena has visited 24 times" badges, client lifetime value | Cold spreadsheet of names with no humanity |
| **"I want to feel I'm building something, not just doing a job"** | Year-over-year growth chart, total revenue lifetime, "you served 412 clients this year", milestones | Just showing today/this week with no long-arc view |
| **"I want to feel safe that nothing is forgotten"** | Auto-reminders, photo notes per client, "last service was X on Y date", offline-first | Sync failures, silent reminder failures, AsyncStorage data loss on reinstall |
| **"I want to feel proud showing it to other masters"** | Beautiful UI, smooth animations, native iOS feel | Looks like a 2014 Android admin panel |
| **"I want to feel like the app respects my time"** | Quick-add flows, smart defaults from history, one-tap rebooking | 7-screen wizards, mandatory fields I don't need |
| **"I want to feel my data is mine"** | JSON export, local-first, no ads, transparent privacy policy | Forced cloud sync, opaque ToS, ads, "upgrade to see your own data" |
| **"I want to feel calm, not anxious, opening the app"** | Soft colors, no red badges screaming, no debt-collector UX | Push spam, growth-hack pop-ups, FOMO modals |

---

## 3. Social Jobs

| Social Job | Features That Serve It |
|---|---|
| **"Clients should see me as organized and serious"** | Branded SMS/notification reminders ("From Anna's Studio: tomorrow 14:00"), professional digital receipts, in-app booking link |
| **"Colleagues should think I have my act together"** | Pretty share-cards ("My year: 412 clients, 18 services") — shareable to Instagram Story without watermark or with optional discreet MasterBook logo |
| **"My spouse/parents should believe this is a real business, not a hobby"** | Annual income PDF that looks like a tax document, monthly statement that prints clean, "total earned in 2026" headline number |
| **"Tax inspector should see clean books"** | Tax-period PDF, expense categorization that maps to НПД/УСН categories, audit trail |
| **"My landlord/bank should see real income for a loan/lease"** | 6-month income statement export, formal-looking PDF with profession + name letterhead |
| **"My clients shouldn't see I'm using a generic CRM"** | White-label receipts/booking pages, custom domain/handle eventually, "from {{master_name}}" not "from MasterBook" |
| **"I want to look modern compared to the lady down the street with a paper notebook"** | The fact of having an app at all, plus screen-share-worthiness |

---

## 4. Anti-Jobs (what they explicitly DON'T want)

1. **Don't make me feel like an accountant.** No double-entry, no "credit/debit", no "reconcile your ledger".
2. **Don't show me boring spreadsheets.** Cards, not rows. Numbers with meaning, not tables.
3. **Don't sell my data, don't show ads, don't recommend me to clients of competitors.** This is the YClients/Booksy trap — they're marketplaces that compete with their own users.
4. **Don't show my logo to clients.** Booking page must be MY brand, not yours.
5. **Don't force me online.** If wifi dies in the salon basement, I still need to add a booking.
6. **Don't make me train staff.** Single-master tool; if I need a team I'll graduate to something else.
7. **Don't lecture me on best practices.** No "you should send a follow-up" coaching modals.
8. **Don't make me decide.** Smart defaults, not 12 toggles per booking.
9. **Don't lose my data ever.** Reinstalling the app must not wipe history.
10. **Don't surprise me with billing.** Clear tier, no upsell modals mid-workflow.

---

## 5. Hidden Jobs (unarticulated)

26. **Identity validation.** "Am I a real business, or am I just lying to my mother?" — The app's existence and its annual reports give the answer "yes, you are."
27. **Memory off-loading.** "I don't want to hold Lena's daughter's name + her allergy + her preferred polish brand in my head." — Free up cognitive RAM.
28. **Boundary enforcement.** "Help me say no to last-minute clients." — Working hours, buffer slots, "fully booked" auto-response.
29. **Emotional bookkeeping of relationships.** "Marina hasn't been here in 4 months — should I check on her?" — Soft reactivation nudges.
30. **Imposter syndrome quieting.** Numbers that prove I'm not a fraud: total clients, repeat rate, years in business.
31. **Trauma processing of bad clients.** A private "do not book" / "difficult client" flag — never shown to anyone, just for me.
32. **Future-self letter.** "Where will I be next year?" — goal-setting that the app remembers (target monthly income, target client count).
33. **Comparison anchor.** "Am I priced right vs. masters like me?" — anonymized benchmarks ("masters in your city/profession charge X-Y for this service").
34. **Ritual of closing the day.** Old paper-notebook masters had a tea-and-review ritual. The app should support, not destroy, this — e.g. an end-of-day summary screen at 21:00.
35. **Pride curation.** Best-of portfolio of "before/after" photos linked to clients, for showing prospects on Instagram or in person.
36. **Continuity through life events.** Maternity leave, illness, moves — the app should handle "I'm gone for 3 months" gracefully without losing clients.

---

## 6. Switching Jobs (must not break from paper/Telegram)

37. **Paper notebook jobs preserved:**
    - Quick scribble — must beat opening paper + pen (quick-add ≤ 10s)
    - End-of-day review ritual — preserved via daily summary card
    - Tangible record — replaced by exportable PDF the master can print/keep
    - The notebook IS the brand for some — replaced by branded receipts
38. **Telegram chat with self jobs preserved:**
    - Voice notes — should be supported (audio attachment on appointment)
    - Photo attachments — already supported
    - Search across history — must be fast
    - Forwarding to client — replaced by direct send-to-client feature
39. **WhatsApp Business jobs preserved:**
    - Quick reply templates — confirmations, address, parking instructions
    - Business hours auto-reply — must exist
    - Catalog of services with prices — pre-built, sharable as link
40. **Excel/Google Sheets jobs preserved:**
    - Formula-like ability ("if X then Y") — not needed, but **export to CSV** must exist so they can do their own math if they want
    - Year-over-year comparison — built-in, no spreadsheet needed

---

## 7. Where Competitors Fail (Anti-Jobs of Incumbents)

**YClients** — feels enterprise, made for salons with staff, not solo masters:
- "Too complicated for one person" — fails "don't make me feel like an accountant"
- "They put my client into their marketplace and now competitors are calling her" — violates data ownership
- "The UI hasn't been updated in years" — violates "I want to feel proud showing this"
- "I pay 1500₽/mo and most features I don't use" — violates pricing/value

**Dikidi** — marketplace-first, master-second:
- "They show my clients other masters and reviews" — competitive sabotage
- "Booking page has Dikidi branding, not mine" — violates "clients shouldn't see I use third-party"
- "Customer support takes 3 days" — violates control

**Booksy** — Western, expensive in CIS, English-first:
- "$30/mo is insane for one person"
- "Doesn't understand НПД tax"
- "No Russian support that actually speaks Russian"

**Altegio (formerly YClients lite)** — same parent, same marketplace problem.

**Common review-snippets pattern:**
- "Я хочу простое приложение, чтобы записи и финансы, без салонной фигни" (functional + emotional)
- "Я не хочу чтобы мои клиенты видели чужих мастеров" (social + anti-job)
- "Мне нужно показать мужу что я зарабатываю — а у них вечно цифры разные" (social + hidden)
- "В блокноте было удобнее" (switching cost — incumbents failed switching jobs)

---

## 8. Feature → Job Map

| Feature (built or planned) | Functional | Emotional | Social | Hidden |
|---|---|---|---|---|
| Clients CRUD with preferences | 6, 7 | Memory off-load, safe-nothing-forgotten | Organized to client | 27, 29 |
| Appointments + 1h reminder | 1, 2, 5 | In-control, safe | Organized to client | 28 |
| Appointment photos | 7 | Building something | Pride curation | 35 |
| Finances (income/expense, charts) | 4, 13, 14 | Building something, professional | Legitimate income to spouse | 26, 30 |
| Services + prices | 2, 16 | Professional | Catalog to client | 33 |
| Work hours / breaks | — | In-control, calm | — | 28 |
| Profession-based onboarding | — | Professional (when it matches their trade) | — | 26 |
| Biometric lock | — | Safe, data is mine | Privacy-conscious | 31 |
| Dark / light theme | — | Calm, proud | — | — |
| JSON export | — | Data is mine | — | — |
| Email + Apple Sign-In | — | Professional, safe | — | — |
| **Planned: Supabase sync** | All daily | Safe | — | 36 |
| **Planned: IAP / paywall** | — | (risk: violates "no surprise billing" if done wrong) | — | — |
| **Planned: Tax PDF** | 15, 22 | Professional | Spouse, tax inspector, landlord | 26 |
| **Planned: СБП payments** | 4 | Professional | Modern to client | — |
| **Planned: RuStore** | — | — | — | — |
| **Planned: Client booking page** | 2 | Professional | Clients see me organized | — |
| **Planned: Year-in-review** | 23 | Building something | Spouse, colleagues | 26, 30, 32 |
| **Planned: Smart reactivation nudges** | 11 | Safe | Caring to client | 29 |
| **Planned: Service templates per profession** | — | Professional (universality) | — | — |

**Jobs NOT served by ANYTHING in the app today (gap list):**

- **Job 6 (find client in 5s while talking)** — search exists but not optimized for hands-free / voice / Siri shortcuts
- **Job 9 (consumables reorder)** — no inventory at all
- **Job 12 (who hasn't paid)** — no debt/deposit tracking
- **Job 17 (top 10 clients)** — no Pareto view
- **Job 19 (vacation planning)** — no block-out / vacation mode
- **Job 20 (service profitability)** — no time-per-service tracking
- **Job 23 (year-in-review)** — planned but not built
- **Job 28 (boundary enforcement: "fully booked" auto-reply)** — work hours exist but no auto-response
- **Job 31 (do-not-book flag)** — no private client tags
- **Job 32 (goals)** — no target setting
- **Job 33 (peer benchmarks)** — none
- **Job 34 (end-of-day ritual)** — no daily summary card
- **Job 37 (voice notes)** — no audio attachment
- **Job 39 (quick reply templates / auto-reply)** — none
- **Job 40 (CSV export)** — only JSON

---

## Key strategic implications

1. **Beauty iconography is the #1 universality blocker.** The functional/emotional/hidden jobs above are 95% identical for a tutor, plumber, vet, or lash master. What kills universality is visual cues: nail-polish icons, "service" defaults like "manicure 90min." The fix is profession-driven defaults at onboarding (already partially built) plus neutral iconography (calendar, clock, money, person — not beauty-specific).

2. **The biggest under-priced lever is identity + social jobs**, not functional. Masters will happily pay 990₽/mo, not 299₽, for a tool that makes them feel like a real business and gives them a PDF that convinces their spouse/landlord/tax office. Functional CRM is a commodity. Identity validation is not.

3. **Hidden jobs 27, 30, 32, 34 (memory off-load, imposter quieting, goals, daily ritual) are unserved by every competitor.** This is the differentiation moat.

4. **Anti-jobs against YClients/Dikidi (no marketplace, no data leak to competitors, my brand not theirs) are the marketing wedge.** Lead with "your clients stay yours" — that one line wins switchers.

5. **Pricing justification ladder:** 299₽ buys functional jobs. 990₽ should buy emotional + social jobs (year-in-review PDF, branded booking page, tax PDF, benchmarks, goals). 1990₽ buys "business graduation" jobs (multi-location later, accountant access, API).

6. **30+ distinct jobs identified above.** The under-served gap list (12 jobs) is the v1.2-v1.5 roadmap, in priority order: tax PDF → year-in-review → branded booking link → daily summary ritual → reactivation nudges → goals → do-not-book flag → consumables → benchmarks.