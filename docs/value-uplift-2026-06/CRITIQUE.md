# MasterBook Research Pack — Adversarial Review

## A. Unverified claims & stale specifics

**1. "SMS reminders cut no-shows 38-50% / 23% industry avg" (Research 2, JTBD).** The 38-50% number is from US dental/healthcare contexts, not CIS solo beauty. CIS no-show baseline for solos with WhatsApp-active clients is closer to 8-12%, and reminders cut it ~20-25%. Recalculating Job 2 at realistic numbers: 1 saved slot/quarter, not /week. Drops job value from 6000₽ → ~500₽/mo. The "25,700₽ stacked value" collapses to ~12-14k. Still a strong story, but stop citing AgentZap as if it applied here. **Fix:** redo the table with Russian-specific data from Yclients/Altegio public blogs; cite only sources that surveyed Russian solo masters.

**2. "Yandex Plus 449₽/mo" + "Tinkoff Pro 299₽" (R2).** As of mid-2025 Yandex Plus is 399₽ basic / 599₽ family; T-Bank Pro pricing varies by segment and has been bundled into Premium for some cohorts. Don't anchor your pricing to numbers you haven't re-verified. **Fix:** drop coffee-cost framing entirely; use the ROI framing the same research recommends.

**3. "GlossGenius Gold $48 / Standard $24" (R2).** GlossGenius has reshuffled tiers since early 2025; current Core is ~$24, Pro ~$48, Pro+ ~$72. The decoy mechanic still holds, but quoting specific prices without re-checking embarrasses on Hacker News. **Fix:** describe the mechanic, not the dollar amounts.

**4. "16.4 iOS PWA notifications solid" (R10).** iOS Safari PWA push works *only when added to Home Screen* and even then is fragile. <40% of clients add to home screen voluntarily. The whole "Мои мастера PWA" thesis depends on push working, and on iOS it largely doesn't. **Fix:** ship Telegram bot for client side first; PWA second; native iOS client app only after 50k masters.

## B. Internal contradictions

**5. ELITE pricing: R2 says 1490₽, R3 says 599₽, R6 says 1490₽, R8 says ~599₽.** Pick one and stick. The 5× anchor case (R2/R6) is the better strategic argument; R3 and R8 are accidentally undercutting the anchor they're supposed to be building.

**6. Free-tier client cap: R2 says 20, R6 says 30, R8 says 30, R10 says "30 is generous, don't ratchet down."** R10 explicitly contradicts R2's tightening recommendation. **Fix:** commit publicly to ≥30 forever (R10's positioning argument is correct — it's a moat) and gate on *cloud sync + reminders*, not client count.

**7. Marketplace stance.** R7 explicitly rejects directory as "dangerous, never as MVP." R6 lists "Directory featured listing + verified badge" as a core ELITE feature. R10 says build it but constitutionalize against pay-to-rank. Three different products. **Fix:** R7 wins for v1.x; R10's "Powered by MasterBook" footer + city SEO pages are the *only* acceptable directory-adjacent moves before 50k masters.

**8. Reviews.** R5 lists "verified MasterBook-authenticated reviews" as a moat. R10 forcefully argues against public reviews. R10 is right — five-star inflation + one-bad-review-kills-livelihood + Roskomnadzor complaint exposure makes public reviews a trap for solo masters. **Fix:** strike reviews from R5 explicitly.

## C. Implementation under-estimates

**9. R1's "6-8 weeks of focused work" for full universal profession system.** This includes RRULE recurring, dynamic form rendering across 50+ screens, JSONB search/indexing, profession-pack runtime, Project + Case archetypes (which are entirely new app modes), and a map view. Realistic estimate for 1-2 engineers: **4-6 months**, not 6-8 weeks. The "RRULE half-done with reminders" line is wrong — your reminders don't use RRULE today.

**10. R8 "v1.2 ship 16 packs with 8 field types + Customize screen + statuses."** Each pack needs Russian copy, vetted pricing data per region, sample data, validation testing. 16 packs alone is ~3 months of content+QA. Field renderer dispatch with 8 types + validation + offline sync conflict handling is ~6 weeks. Total realistic v1.2: **5-6 months**, not "next release."

**11. R3 #10 voice-to-appointment via Whisper + GPT-4o-mini.** Whisper RU accuracy on Russian names + colloquial booking phrases ("запиши Машку на чт после трёх") is ~75-80%, much worse with background noise (which is the exact context — master with hands in gel/hair). The "preview + confirm" UX saves it functionally but the wow-demo will fail in real demos 1 in 4 tries. **Fix:** ship voice-to-note (transcribe to client card) before voice-to-booking. Lower stakes when accuracy degrades.

**12. R7 tax filing via Nalog.ru "Мой налог" API.** The API for самозанятый чек creation is real, but full filing automation for ИП on УСН/ПСН is not exposed. Quoting "~1.1M ₽/mo at 10k users" assumes filing works for ИП too. It doesn't. **Fix:** scope to чек-генерация для самозанятых only; revenue projection drops ~40%.

**13. R6 "branded SMS sender ID" through aggregator.** In Russia this requires registration with each MNO + ОРД marking + costs ~3-5₽/SMS minimum vs ~1.5₽ for shared. Not "include in ELITE for 1490₽" economics unless you cap volume hard. **Fix:** either WhatsApp Business API (which has its own onboarding pain in CIS) or transparent SMS pack add-on, not bundled.

## D. Audience misreads

**14. R6 "Quarterly 30-min business advisor call."** A solo master earning 80-200k₽/mo is uncomfortable booking a call with a "MasterBook advisor" — feels like a sales call. Cultural mismatch with the CIS solo-master persona who values autonomy. **Fix:** replace with async written report ("Анна, твой Q1: вот динамика, вот 3 идеи"). Same value, no awkwardness.

**15. R5 + R10 assume universal phone-OTP onboarding.** Many CIS masters use foreign SIM cards (Kazakhstan-resident Russians, etc), eSIMs without SMS, or shared family numbers. OTP-only auth strands these users. **Fix:** Telegram-OTP as primary, SMS-OTP secondary, email as fallback.

**16. R8 ELITE-only formula creation.** A solo master will never write `if(visits_this_year >= 12, "VIP", ...)`. This is Notion-power-user thinking grafted onto an audience that explicitly hates spreadsheets (R4 emotional job #1). **Fix:** ship pre-built "smart fields" curated per pack, not a formula language. Save 3 months of work.

## E. Strategic incoherence

**17. R3 #13 + R6 "city benchmarks" require sending data to server.** R5/R10/R8 all push privacy-first, local-first, "data is mine." Server-side benchmarking contradicts that unless opt-in is fully gated AND the dashboard works fully without it. **Fix:** make benchmarks opt-in with a clear toggle, ensure ELITE without benchmarks still feels worth 1490₽.

**18. R10's "share client profile across masters" MVP.** Strategically clever, but **legally radioactive under 152-ФЗ** — you're transferring personal data between data operators without an explicit cross-controller agreement. The client's consent to Master A does not propagate to Master B. **Fix:** the client must explicitly opt-in per master with a granular consent UI. Engineering becomes 3× larger.

**19. R1 ships psychologist & lawyer packs with "encrypted notes, legal-privileged."** Encrypted at rest with a key the server holds is *not* legally privileged. True privilege requires client-side encryption with master-only key, which breaks search, sync, photo-attachment, and the AI features in R3. **Fix:** Don't ship lawyer/psychologist packs in v1.x. Position them as v2.x "Pro Privacy" mode with explicit privacy-vs-features trade-off.

## F. Anti-pattern bait

**20. R3 #8 churn alert + auto-draft "Лена не была 11 недель."** This is exactly the dynamic Tinder/Hinge use to bait reactivation. Solo masters reading "ваш клиент уходит к конкуренту" weekly become anxious; clients receiving "we miss you" templates from 5 masters in their MasterBook contacts get spammed. **Fix:** churn alert frequency capped at ~1/month, drafts must be personalized (last service, specific date) not template-y, never mention "competitor."

**21. R6 trigger #1 "100th client added → upsell."** Upselling at a milestone moment is the dark pattern. The user is *celebrating* hitting 100; you're monetizing the dopamine. **Fix:** show milestones with no upsell; trigger upsell on actual friction (hit limit, requested locked feature 3×).

## G. Critical omissions

**22. Apple Russia / RuStore.** Nobody addressed the active risk: Apple may further restrict Russian devs in 2026-2027. RuStore is mandatory for some users. None of the IAP/pricing/tier work in R2/R6 acknowledges that СБП-based subscription billing through RuStore has different mechanics, no auto-renewal trial, different refund flow. **Fix:** every pricing recommendation needs a "via RuStore" variant.

**23. Offline-first / rural connectivity.** R10's whole platform thesis + R3 server-side features + R6 cloud sync all assume reliable connectivity. Masters in регионы (Якутия, deep СНГ countryside) work offline-mostly. **Fix:** make sync optional and conflict-resolution-tested; never gate critical CRUD behind it.

**24. The "I refuse SaaS" master.** Substantial population uses paper + WhatsApp and will not pay any subscription. R4 named the persona but no research addresses them. **Fix:** keep lifetime-license option (one-time 4990₽) as a path. Lower LTV but captures a real segment.

## H. Numeric sanity

**25. R2 LTV math + R7 "7.8M ₽/mo at 10k paid."** 10k paid subscribers in CIS solo-master vertical is *the entire active addressable market for a paid CRM today*, not a near-term target. Realistic 24-month target: 2-3k paid. Scale all revenue projections by ~0.25. **Fix:** rebuild the financial story at 2.5k paid; if it doesn't work there, the pricing is wrong.

## I. AI vapor

**26. R3 "AI assistant unlimited queries" in ELITE.** At GPT-4o-mini pricing, a power user running 20 ops/day = 600/mo. Most stays cheap, but "unlimited" + photo OCR + Whisper + voice-to-appointment can hit 200-400₽/mo per user — 25%+ of ELITE margin. **Fix:** soft cap with transparent counter.

**27. R3 #1 tone-mimicking from one onboarding example.** GPT-4o-mini given a single 1-line example produces generic output. Real tone matching needs ≥20 examples + fine-tuning, infeasible at this budget. **Fix:** template library with tone-tag selector (warm/neutral/formal), no "AI learns your style" claims.

## J. Feature-bloat risk

**28. Combined surface.** R1 (50 professions, 6 axes) + R3 (15 AI features) + R5 (cross-master companion app) + R6 (cohorts/benchmarks/staff/AI/concierge) + R7 (deposits/tax/academy/affiliate) + R8 (custom fields/formulas/marketplace) + R10 (PWA/discover/cross-master referrals) = a product that does everything for everyone, i.e. the YClients trap R4 explicitly warns against. **Fix:** v1.x identity = "the calmest solo-master CRM in CIS, profession-aware." Pick *one* category-expanding bet per quarter: profession packs OR deposits OR client PWA. Not three.

**29. "Profession-pack the gates not tiers" (R2 closing).** Contradicts R1's archetype-driven navigation shape change (project tab replaces calendar for designers). Cannot keep tiers profession-agnostic if the *primary navigation* changes per profession. **Fix:** keep nav consistent across packs in v1.x; differ via terminology + empty states + default fields only (R9's path). R1's archetype navigation waits for v2.x.

**30. R5 photo searchable archive + R3 #11 photo quality scoring + R6 portfolio + R8 file field type.** Four different research streams reinventing the same "photos with metadata" feature. **Fix:** one photo subsystem owned by one PM, designed once, used by all packs.