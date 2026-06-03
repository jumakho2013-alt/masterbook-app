# MasterBook as a Platform: Network Effects Without Losing the Master

## The strategic shift

Right now MasterBook is a tool — one master, one device, one business. Tools have a ceiling: churn is high (master quits the craft → app dies), willingness to pay is capped by "what does Notion + Google Calendar cost me?", and there's no defensibility beyond UX polish. A competitor with the same UX and lower price wins.

Platforms are different. When clients live inside your product alongside masters, switching costs shift from the master ("I'll re-enter my clients") to the network ("my clients will have to re-download something, and I'll lose the ones who don't"). Pricing power follows. The trick is to add this layer without becoming Booksy — a marketplace that taxes masters for access to their own clients.

The right model is **closer to Cal.com / Calendly + WhatsApp than to Booksy / Treatwell**. Master owns the client relationship. The platform makes that relationship easier, not extractable.

## 1. Client app/PWA "Мои мастера" — the foundation

Ship this first. Everything else assumes it exists.

**What it is.** A lightweight PWA (not a native app initially — too much App Store friction for cold acquisition). URL: `app.masterbook.ru/me`. Client opens it after first booking, sees:

- Timeline of upcoming visits across all their masters
- Past visits with the photos the master attached (huge: clients lose these in WhatsApp)
- One-tap rebook with the same master, same service
- Push notifications (PWA notifications on Android are solid; iOS works since iOS 16.4 with "Add to Home Screen")
- Saved payment methods for deposits (СБП recurring tokens)
- Profile: name, phone, allergies, preferences — **synced to every master they see**

**The killer feature most CRMs miss:** the client controls their own profile. They update their phone number once, and all five masters see it. Currently every master maintains their own stale copy.

**Engineering reality.** This is a Next.js PWA hitting the same Supabase backend you're planning for v1.1 sync. Auth is phone-number-based (OTP). No native app needed for v2.0. The mobile-native master app stays premium; the client side is web-first because clients don't need to launch it 10 times a day.

## 2. Cold start — the invitation has to be free and natural

The invitation must ride on something the client already wants. Two moments work:

**Moment A — booking confirmation SMS.** Currently the master sends "Записала вас на четверг 15:00". Change it to: "Записала на чт 15:00. Все ваши записи и фото работ → masterbook.ru/me/k7a9". Link is unique per client, no signup, opens straight to their timeline. They can bookmark or "Add to Home Screen". You're not asking them to "install an app" — you're showing them their own data.

**Moment B — photo delivery.** After a session, master often sends photos via WhatsApp. Replace with: photos auto-appear in client's MasterBook profile, SMS says "Фото вашей работы готовы → ...". This is the strongest hook — clients lose photos in chats constantly.

Crucially: **the master doesn't have to do anything extra**. The invitation is the existing notification with a better link. Zero friction = adoption.

## 3. The two-sided loop, mapped concretely

```
NEW MASTER signs up
   ↓ adds 30 existing clients
   ↓ on next booking, sends link in SMS
NEW CLIENTS get PWA link, ~30-40% activate
   ↓ client sees "you have 1 master here"
   ↓ low value initially
   ↓ but: photo archive + one-tap rebook = enough to retain
   ↓
SECOND MASTER (different category — say, brow artist)
   that this client also visits also joins MasterBook
   ↓ sends same invite link
   ↓ client already has account, just confirms phone
   ↓ NOW client has 2 masters in one app
   ↓ value compounds: unified timeline, no double-booking themselves
   ↓
Client tells THIRD MASTER (who isn't on MasterBook yet):
   "I have an app where I see all my visits, can you send me bookings there?"
   ↓ third master signs up driven by client demand
   ↓ this is the second-order network effect
```

The third arrow is what separates a platform from a tool. You need to instrument it (referral source = "client request") to know when it starts firing. Likely month 4-6 in any given city.

**Geographic clustering matters.** Network effects are local — a client in Almaty doesn't care that there are 10,000 masters in Moscow. Launch city-by-city, get to ~5% of masters in a category in one city before expanding.

## 4. Booking marketplace — opt-in, but not the headline

**For:** Free distribution channel for masters who want it. Demand-side acquisition. Optional revenue stream (booking commission only for clients who came via Discover, not for the master's existing book).

**Against:** Marketplaces have gravity. Once you have one, the product team is pulled toward optimizing it. Search ranking becomes the most valuable real estate. Masters start paying for placement. You become Booksy.

**Resolution:** Build it, but with a hard constitutional rule: **MasterBook never charges a master for visibility to clients the master already knows**. Discover is purely incremental. The free tier in Discover ranks by retention rate, response time, and verification — never by ad spend. If you ever add paid placement, it must be clearly labeled "Реклама" and capped at <20% of slots, and not crowd out the organic ranking. Write this into the founding doc so it survives leadership changes.

## 5. Reviews — don't. Use private satisfaction signals.

Public ratings are a trap for a master-first product:

- Five-star inflation makes them useless within 6 months
- One bad-faith review can wipe out months of income; masters will quit before they're held hostage
- Moderation cost is real and never-ending
- Beauty masters already have Instagram + 2GIS for public reputation; we don't need to compete

**Better:** ask clients a single post-visit question — "Хочешь снова к этому мастеру?" — answered only with a tap (yes / not sure / no). This is **never shown to the master directly**. Used for:

- AI insight: "3 из 12 клиентов в этом месяце не вернутся — пересмотри подход?"
- Discover ranking signal (privately)
- Churn prediction

This is the differentiation: we're not a public review site, we're a feedback tool that helps masters get better. Position it explicitly: "MasterBook не публикует отзывы. Это ваше дело, не наше."

## 6. City pages and SEO

Build these last, after Discover has substance. `masterbook.ru/almaty/manicure` with verified masters, real availability, real photos. Free for masters. Ranking criteria public and honest: verified phone, response time <2h, repeat-client rate, photo portfolio completeness.

The SEO win is real but slow (6-12 months to rank). It's a moat, not a launch lever. Don't over-invest before you have masters worth ranking.

## 7. Master community — yes, but as Telegram, not in-app

In-app community has terrible economics: support burden, moderation, off-topic drift, and it competes with the product for attention. But community is real value: masters learn from each other, share supplier tips, vent about clients.

**Right answer:** an official Telegram-based community (one channel + topic-organized chat), seeded by the team, with an in-app "Сообщество мастеров" link that opens Telegram. Tiered access: free tier sees announcements, paid tier (Pro) gets the discussion. This adds tangible value to paid tier without engineering cost, and Telegram does moderation tooling far better than you can build.

## 8. Cross-master referrals

Real use case: master moves cities, goes on maternity leave, raises prices and loses a price-sensitive segment. Currently the client just disappears. Better:

- One-tap "передать клиента" from master A to master B
- A sees the suggested handoff list filtered by city + service category + price range
- Client gets SMS: "Анна больше не принимает в этом районе, рекомендует Марию"
- No referral fee in v1. Keep it pure goodwill. Money corrupts referrals — masters will start gaming it. Maybe in v2 a small credit-against-subscription per successful handoff.

This is a network feature only possible because both sides are on the platform. Use it as a marketing point: "Уходишь в декрет? Передай клиентов коллеге, не теряй."

## 9. Supply network

Plausible v3.0 play, not v2.0. Aggregating purchasing across masters is real value (gel polish, lash glue, sterilization supplies — 15-25% markup at retail). But it's a different business: logistics, inventory, returns, supplier relationships. Don't touch it until the core platform has 50k+ active masters. Mention it in pitch decks; don't build it.

## 10. "Powered by MasterBook" — the cheapest growth lever

Every booking confirmation page, every PWA client view, every SMS link footer: small "MasterBook · CRM для мастеров" with link. Free tier always shows it. Pro tier can hide it (this is a real Pro feature — "белый лейбл" — masters with established brands will pay for it).

This is the Calendly / Linktree / Notion-shared-page playbook. The product becomes its own marketing. Track: of new master signups, what % first encountered MasterBook through a client-facing surface? Aim for >30% by year 2.

## 11. Anti-patterns to enforce now

Write these as constitutional commitments, publicly:

- **Never charge masters to message their own clients.** Booksy does. We don't.
- **Never gate client data behind a paywall.** Export is free, forever, on any tier. If a master leaves, their data leaves with them. (This sounds like it weakens retention. It strengthens trust, which is bigger.)
- **Never sell client contact data to anyone.** Not to manufacturers, not to other platforms.
- **Never make Discover pay-to-rank.** See section 4.
- **Free tier stays usable forever.** 30 clients is generous; don't ratchet it down to 10 to force upgrades.

These aren't just ethics — they're product positioning. "MasterBook не доит мастеров" is a differentiator that competitors can't easily copy because their business models depend on the opposite.

## 12. MVP of network effects — ship this in 6 weeks

One feature, minimal engineering, real network effect:

**Shared client profile via SMS link.** When a master adds a client, they can optionally send a one-tap "let your masters share your preferences" link. Client opens a PWA, fills out: allergies, preferred services, photos of preferred styles. This profile is now visible (read-only) to any future master the client books with on MasterBook.

That's it. No app, no auth flow, no notifications. Just: client preferences become portable across masters within the network.

Why this works as MVP:
- **Value to client immediately**, even with 1 master in network — they fill it once, never explain "I'm allergic to gel" again
- **Network effect kicks in at 2 masters** — and you can measure exactly when
- **Engineering is small** — Supabase row + PWA form + read endpoint on master side
- **Zero risk to master-first identity** — the master sees more useful data on their client, nothing's taken from them
- **Validates the invitation flow** — if clients don't open SMS PWA links for THIS, they won't for anything

If 6-week MVP gets <15% client activation, the platform thesis is wrong and you have your answer cheap. If it gets >30%, you've earned the right to build the full "Мои мастера" app, and you have early users to interview.

Start there.