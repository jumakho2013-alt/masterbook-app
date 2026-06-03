# Adversarial Review — 9 MasterBook Research Outputs

## Unverified / Possibly Outdated Claims

**1. GlossGenius $24/mo, Booksy $29.99, Fresha killed free tier "early 2025"** — Output 3 cites these as 2026 benchmarks but all sources are `slotcut.com`, `costbench.com`, `schedulingkit.com` — affiliate-SEO content farms, not primary sources. Fresha's "20% commission + $6 min" is suspiciously precise. **Fix:** verify each via the vendor's own /pricing page on the day of decisions; don't anchor MasterBook's pricing strategy on affiliate-blog scrapes.

**2. "12M самозанятых in Russia"** (Output 4) and "9M НПД payers" (Output 5) — same agent project, different numbers, both citing Minfin/ФНС. **Fix:** pick one source, dated, and stick with it. The 6-7% beauty share (Output 5, footnote 6) has no citation at all.

**3. "Masters app raised to 500₽/mo, sparking backlash"** (Output 2) — no date on the price hike, no link to the backlash. RuStore rating "3.8/5" is a snapshot that changes weekly. **Fix:** capture date + URL of every review quote with a timestamp.

**4. "Dikidi 87 countries, 40k companies" vs "120k companies, 15M bookings/month"** — Outputs 2 and 3 disagree on Dikidi's own scale by 3×. Neither cites Dikidi's press kit directly.

**5. RuStore Billing fee "5-10%" (Output 5) vs "15%" (Output 9)** — direct contradiction on a number that drives unit economics. **Fix:** read RuStore developer docs, not blog summaries. (As of late 2024 it's tiered; both numbers may be partially right.)

**6. "Apple removed IAP capability for RU-region apps entirely"** (Output 5) — overstated. Apple disabled RU-card billing, not IAP itself; KZ/AM/foreign-card-funded Apple IDs in RU still work. Output 9 correctly notes the KZ workaround. Output 5 is wrong.

## Contradictions Between Agents

**7. Pricing recommendation conflict:** Output 5 says 299₽/mo, Outputs 2 & 8 also say 299₽, Output 3 says $3.99 "underprices globally," Output 8 floats 199₽ as cohort price. No agent reconciles the CIS-vs-global SKU split with what's actually buildable through RuStore + IAP simultaneously.

**8. Free tier size:** Output 5 argues 30 clients (with conversion data citation that doesn't actually support 30 over 20), audit Output 1 implicitly assumes the existing 20. No A/B test plan proposed.

**9. Tier-1 feature priority disagreement:** Output 3 says sync → booking link → deposit → IAP. Output 7 says tax PDF → AI → mini-site → Telegram bot. Output 6 says contacts import → demo data. Output 8 says sync first. All four "P0" lists are different. **Fix:** force-rank into one list with scoring criteria.

## Blind Spots Nobody Addressed

**10. iOS distribution in Russia post-2022 is essentially broken for new indie developers.** Output 9 mentions it tangentially; no agent answers: can a Russian-resident solo dev even publish to App Store today? What entity files the Apple Developer agreement? This is existential, not a footnote.

**11. Самозанятый API integration with «Мой Налог»** — Output 7 calls it killer feature #1, but no agent investigates whether the ФНС API is actually open to third-party apps. (It's not fully — requires partner accreditation.) **Fix:** verify before promising users.

**12. Currency for client deposits when master is самозанятый** — receiving prepayment on personal card triggers tax obligations; ЮKassa requires ИП or self-employed contract. No agent addresses the legal flow for "deposit via СБП" mentioned by Outputs 3, 5, 7.

**13. Sanctions exposure on Supabase/Stripe/Expo EAS for RU users.** Supabase is US-based; serving RU traffic at scale may trip OFAC. No agent flagged this.

**14. Push notifications without GMS on RuStore-distributed devices** — Output 9 hand-waves "local notifications still work." Reality: Xiaomi/Huawei aggressive battery killers nuke `expo-notifications` background tasks. No agent tested.

## Hand-Wavy Recommendations

**15. Output 3's "(1) cloud sync, (2) public booking link, (3) deposit + client-side notifications, (4) real IAP"** — zero estimation of engineering weeks, zero acknowledgment that 152-ФЗ (Output 9) makes sync legally fraught for RU users. The four-point plan is a roadmap shaped like a tweet.

**16. Output 6's #11 "microcopy pass"** is concrete, but #15 "accessibility — large-text mode" gives no measurable target (WCAG level? font scale cap value?). "Bump to 0.18" opacity in #12 — why 0.18 specifically?

**17. Output 8's "target Free→PRO 4-7% CIS"** — pulled from generic SaaS benchmarks, not anchored to CIS apps with 20-client gates. Could be 1%, could be 12%. Treat as hypothesis, not target.

**18. Output 7's AI features (#2, #6, #7, #19)** all assume cheap LLM calls work in Russia. OpenAI is blocked at API level for RU IPs; Yandex GPT has different prompt behavior. No agent costs out the LLM bill at 1000 paying users.

## Russia/CIS-Specific Realities Missed or Underweighted

**19. EAS Build itself may be a problem.** Expo's build servers are US-based; the IPA/AAB artifact is fine but RU-resident devs paying $99/mo to Expo via international card is a friction point nobody mentioned.

**20. RuStore mandatory pre-install on new Android phones (Decree 1731)** — Output 8 mentions it briefly. Implication: Google Play installs in RU are declining, RuStore is the primary channel, yet most agents still treat Play as primary. Reorder.

**21. Apple Developer Program payment from RU card was disabled in 2022.** A new RU-resident solo dev cannot easily renew the $99 membership. Output 9 says "Russian Apple ID accounts still work" — true for consumers, false for developers. Material to iOS plan.

**22. ЮKassa now requires ОФД-compliant fiscal receipts (54-ФЗ)** for any digital subscription sold to RU consumers. Output 5's "ЮKassa via webview" handwaves this; in reality you need АТОЛ/Бизнес.Ру integration or you're selling illegally to RU users. None of the monetization agents mention 54-ФЗ.

**23. "Самозанятый" income cap of 2.4M ₽/yr** (Output 5) — when your top users exceed it, they convert to ИП and your tax-PDF feature breaks. No agent built for this lifecycle.

**24. Telegram Stars as payment rail** (Output 5) — Telegram now charges 30% AND requires bot-side digital-goods classification; the regulatory status in RU is unclear since Telegram is technically blocked (but tolerated). Risky to depend on.