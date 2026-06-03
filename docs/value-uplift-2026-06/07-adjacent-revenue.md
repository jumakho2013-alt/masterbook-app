# MasterBook Adjacent Revenue Streams — Strategic Analysis

## Framework

Three lenses for each stream: **(1) does it amplify the core CRM value or distract?** **(2) does it create lock-in for the master, or just extract margin?** **(3) does it survive when MasterBook goes universal (tutors, plumbers, lawyers)?** Streams that fail #3 should not anchor the long-term roadmap.

---

## 1. Client-Facing Marketplace ("MasterBook Discover")

**Model:** Free directory listing for paying subscribers; paid promotion (boosted placement 490–990 ₽/mo); lead-fee 99–199 ₽ per first-booking from directory (not subscription cannibalisation).

**Audience:** New masters with capacity gaps; clients searching outside Instagram.

**Build cost:** High — Supabase geo-search, moderation, review system, anti-fraud, dispute handling. 3-4 engineer-months. Plus ongoing trust & safety headcount.

**Time-to-revenue:** 9-12 months (need supply density before any demand-side spend works).

**Regulatory:** Personal data law 152-FZ on client side; Roskomnadzor registration as info-aggregator likely triggered above certain scale; review moderation = libel exposure.

**Brand-fit:** **Dangerous.** MasterBook's positioning is "your private CRM, your clients are yours." A marketplace turns masters into SKUs and competes with YClients/Yandex Услуги on their turf, with worse network effects. Master backlash near-certain among the power users we're trying to win.

**Universality:** Survives, but loses focus — a plumber discovery directory is a totally different product from a tutor directory.

**Projection:** 1K users → ~30K ₽/mo (mostly noise). 10K users → 800K–1.5M ₽/mo, but at significant CAC on the client side.

**Verdict: Never as MVP. Possible v3.0+ as opt-in "MasterBook Open Profile" — public booking page (not directory), driven by master's own marketing. Lead-fee model only, no algorithmic ranking.**

---

## 2. Online Deposit Take-Rate

**Model:** Master enables "booking requires 500 ₽ deposit via СБП." MasterBook takes 2% + 10 ₽ flat. Free subscribers pay 3.5%, paid pay 1.5%.

**Audience:** Every master losing money to no-shows — 100% of the addressable base.

**Build cost:** Medium — ЮKassa or CloudPayments integration, СБП preferred (commission ~0.4–0.7% vs ~2.5% card). Refund flow, KYC for masters as ИП/самозанятый. 2-3 engineer-months. Compliance review.

**Time-to-revenue:** 4-6 months.

**Regulatory:** **Significant.** Operating as payment facilitator requires either (a) partnership with licensed PSP (ЮKassa, CloudPayments — they take liability) or (b) own licence (NPS/НКО — months and millions). Go with (a). Self-employed masters need to forward to «Мой налог» — MasterBook should auto-generate the chek via Nalog.ru API.

**Brand-fit:** **Excellent.** Solves a real pain (15-25% no-show rate is industry standard), strengthens "MasterBook helps you make money," does not turn the master into a product. Compatible with Booksy/GlossGenius pattern (1.95% + 0.20$, Square 2.6% + 10¢).

**Universality:** **Perfect.** Tutors, photographers, lawyers, plumbers, dog groomers all want deposits. Universal CRM angle survives.

**Projection:** Assume 30% adoption, 10 deposits/master/month at 500 ₽ avg. 1K users → 300 × 5K ₽ × 2% = **30K ₽/mo, growing.** 10K users → **~3M ₽/mo** at 2% net.

**Ethical:** Clean if transparent. Disclose fee, never hide it from the master.

**Verdict: Pursue. v1.4-1.5. This is the highest-leverage adjacent stream.**

---

## 3. Supply Marketplace (Affiliate)

**Model:** Smart "you've done 45 manicures this month — order top coat?" suggestions linking to OZON/WB with affiliate IDs (3-7% commission) or direct B2B suppliers (8-15%).

**Build cost:** Low for affiliate links (4-6 weeks). High for curated catalog (3-4 months).

**Time-to-revenue:** 2-3 months for affiliate, 6-9 months for curated.

**Regulatory:** Low. Standard affiliate. Disclosure ("реклама" marker per ОРД law since 2022) required.

**Brand-fit:** Good if usage-driven (CRM uses real consumption data → relevant suggestion). Bad if it becomes ad surface.

**Universality:** **Breaks at universalisation.** Plumber wants pipe fittings, lawyer wants nothing, tutor wants nothing. Profession-keyed catalog could survive, but maintenance burden scales linearly with verticals.

**Projection:** ~150 ₽/active master/month at 30% engagement. 1K users → ~45K ₽/mo. 10K users → ~450K ₽/mo. Lower than deposits but near-zero marginal cost.

**Ethical:** Privacy-sensitive — usage data must not leak to suppliers. Suggestions must be honestly ranked, not pay-for-placement only.

**Verdict: v1.5 as affiliate-only (low risk). Skip curated catalog until v2.5+.**

---

## 4. MasterBook Academy

**Model:** 1490–2990 ₽ one-off mini-courses (taxes for самозанятый, Instagram for masters, pricing psychology, client retention). Free subscribers see paid; paid subscribers get 30% off or 2 free.

**Build cost:** Content production (15-25K ₽ per course), platform (small — could host on existing infra), instructor partnerships. 2-3 engineer-months + content team.

**Time-to-revenue:** 4-6 months.

**Regulatory:** Light. If marketed as "education" rather than "consultation," no licence needed below certain thresholds; consult Russian Лицензия на образовательную деятельность rules for >144-hour programs (we won't hit it).

**Brand-fit:** Excellent. Reinforces "MasterBook helps you build a real business." Sponsored content (Tinkoff, OZON Seller) layer-on.

**Universality:** Strong — every profession needs business basics. Profession-specific courses scale with the vertical-expansion roadmap.

**Projection:** 5% buy 1 course/quarter at 1990 ₽. 1K users → ~25K ₽/mo. 10K users → ~250K ₽/mo. Plus sponsorship: 200-500K ₽/mo per major partner at scale.

**Ethical:** Clean. Disclose sponsored content.

**Verdict: v2.0. Powerful for brand and retention, but content burden is real — don't start until you have 5K+ paying users.**

---

## 5. B2B Studio Module

**Model:** 1490 ₽/mo per location, 2-15 masters. Shared schedule, owner-level reports, role permissions.

**Build cost:** High — multi-tenant data model, RBAC, payroll/commission, owner dashboards. 4-6 engineer-months. Different sales motion (B2B).

**Time-to-revenue:** 8-12 months.

**Brand-fit:** **Distracts.** YClients/Altegio own this segment; entering as challenger requires different sales/support DNA. Solo-master focus is MasterBook's moat.

**Universality:** Survives but with same caveat — small law firm, tutoring centre, dental clinic each need very different B2B features.

**Projection:** 500 studios → 750K ₽/mo. Plausible but slow.

**Verdict: Never as default path. Possible v3.0 if a wave of subscribers organically grow studios and ask for it — let demand pull.**

---

## 6. White-Label License

**Model:** 30-50% rev-share with regional partner (Turkey, MENA, LATAM).

**Build cost:** **Massive.** Multi-language, multi-tax, multi-currency, multi-payment-rail, support of someone else's brand. 12+ engineer-months. Ongoing maintenance becomes nightmare ("Turkish partner found a bug, blocks our roadmap").

**Verdict: Never. Better path: v2.0 own global launch.**

---

## 7. Anonymous Benchmarking ("Industry Pulse")

**Model:** Aggregate city-level data → sell as subscription (50K-200K ₽/year) to suppliers, schools, beauty brand market research.

**Build cost:** Low engineering, high legal (differential privacy review, opt-in flow, k-anonymity thresholds, 152-ФЗ compliance).

**Time-to-revenue:** 12+ months — need data density first.

**Brand-fit:** **Risky.** Even with consent, "MasterBook sells your data" narrative is one tweet away. Frame as opt-in benefit ("see how your prices compare") with the commercial product as side-effect.

**Universality:** Strong — works for any vertical at density.

**Projection:** 10-30 B2B clients × 100K ₽/yr at 10K users = ~250K ₽/mo.

**Verdict: v2.5+. Only if launched master-facing first ("Pulse: how you compare") and commercial use is downstream, opt-in, audited.**

---

## 8. Insurance / Financial Referrals

**Model:** Referral to Tinkoff/Sber for self-employed insurance, cards, accounts. 500-3000 ₽ per qualified referral.

**Build cost:** Low (deep links + tracking).

**Regulatory:** Low for pure referral; can't advise on financial products without licence.

**Brand-fit:** OK if curated. "Recommended partners" page, not pop-ups.

**Universality:** Strong.

**Projection:** 1% conv per quarter at 1500 ₽ avg. 1K → 5K ₽/mo. 10K → 50K ₽/mo. Marginal.

**Verdict: v2.0 — small but free money. Curate hard.**

---

## 9. Sponsored Badges on Booking Pages

**Verdict: Never.** Cheapens premium positioning. The whole pitch is "your professional brand." Don't sell badge space.

---

## 10. Equipment BNPL

**Model:** Sovcombank/T-Bank installment for apparatus purchases. 2-5% kickback.

**Build cost:** Low — partner deep link.

**Brand-fit:** Beauty-only, breaks at universalisation. A tutor isn't buying an apparatus.

**Verdict: v2.0 as part of curated partner page (8). Don't build dedicated UX.**

---

## 11. Tax Filing Service

**Model:** 2000 ₽/quarter quarterly filing for self-employed; integrate Nalog.ru API; auto-generate чеки from deposit/cash income tracked in MasterBook.

**Build cost:** Medium — Nalog.ru API is documented but finicky; FNS auth flows; error handling for refunds, returns. 3-4 engineer-months. Ongoing tax-law tracking.

**Regulatory:** **Medium.** Самозанятый regime already supports app-based filing; not licensed tax-advisory if framed as "tool that submits what you tell it." Crossing into advisory needs careful framing.

**Brand-fit:** **Excellent.** Closes the loop: MasterBook tracks income → auto-чек → MasterBook files → master never opens Nalog.ru. Massive lock-in. Justifies premium tier (599-799 ₽/mo).

**Universality:** Self-employed regime applies across professions in RU — tutor, photographer, IT freelancer, all eligible. Strong universal fit.

**Projection:** 40% of paid users adopt at 2000 ₽/qtr = ~270 ₽/mo each. 1K paid → 110K ₽/mo. 10K paid → **~1.1M ₽/mo**, with extreme retention impact (people don't churn from their tax service).

**Verdict: Pursue. v1.5-v2.0. Second-highest priority after deposits.**

---

## Top 4 Ranked

| Rank | Stream | Why | Timing |
|---|---|---|---|
| **1** | **Online deposit take-rate (#2)** | Universal, solves real pain (no-shows), aligns master incentives, recurring, clean regulatory path via PSP, ~3M ₽/mo at 10K. | v1.4-1.5 |
| **2** | **Tax filing service (#11)** | Massive lock-in, universal across RU self-employed, justifies premium tier, ~1.1M ₽/mo at 10K, defends against churn. | v1.5-2.0 |
| **3** | **MasterBook Academy (#4)** | Brand-reinforcing, content scales with verticals, sponsorship upside, prepares user base for universalisation by teaching transferable business skills. | v2.0 |
| **4** | **Affiliate supply links (#3)** | Lowest build cost, fast revenue, can be killed cleanly if it underperforms. Affiliate only — no curated catalog. | v1.5 |

---

## Universalisation Implication

The top 4 are deliberately profession-agnostic. **Deposits, taxes, education on running a business, and supplies** all work for a tutor or a plumber as well as a brow artist. Building these now positions MasterBook as **"the operating system for any solo service provider in RU/CIS"** by v2.0, not "Booksy for nails." The marketplace and studio modules — the streams that lock you into beauty — are correctly deferred or rejected.

Combined run-rate projection at 10K paid subscribers (299 ₽/mo base): subscription **~3M ₽/mo** + deposits **~3M ₽/mo** + tax service **~1.1M ₽/mo** + academy + affiliate **~700K ₽/mo** = **~7.8M ₽/mo**, with subscription as only ~38% of revenue. That is the path to making 299 ₽/mo feel under-priced — the subscription is the door, not the room.