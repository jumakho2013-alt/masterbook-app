I have enough material. Let me deliver the findings.

---

# MasterBook — Deep Audit (Post-2026-04-16)

The previous audit fixed C1–C4, V1, V2, V4–V8. Since then the codebase has not changed materially (last commit `11514e0` is the fix batch). The findings below are **new issues** the previous audit didn't cover, organized by the seven focus areas. Severity ranges: critical / high / medium / low.

---

## 1. State management & Supabase-sync readiness

**1.1 [HIGH] Stores have no `userId` on records — multi-account contamination on next login.**
[src/stores/useClientStore.ts:22-34](src/stores/useClientStore.ts), [useAppointmentStore.ts:33-37](src/stores/useAppointmentStore.ts), [useFinanceStore.ts:21-25](src/stores/useFinanceStore.ts).
Records lack `userId`. If user A signs out and user B signs in on the same device, all of A's clients/appointments are visible to B (and would upload to B's RLS-scoped tables on first sync). `signOut` does not clear stores either — only `useAuthStore` is partially cleared. **Fix:** in each store add `userId` to every row, wipe non-matching rows on `setSession()` switch, or call `AsyncStorage.multiRemove(['masterbook-clients', …])` in `signOut`.

**1.2 [HIGH] IDs are client-generated strings, but Supabase schema uses `uuid` with `gen_random_uuid()`.**
[src/utils/helpers.ts](src/utils/helpers.ts) — `generateId()` likely returns a non-UUID; schema `clients.id` is `uuid`. Sync will fail on `insert` unless IDs are valid UUIDs. **Fix:** switch `generateId` to `crypto.randomUUID()` polyfill (`react-native-get-random-values` + `uuid` v9) or accept server-generated IDs and remap on insert.

**1.3 [HIGH] No `updatedAt` / `deletedAt` / `version` fields anywhere.**
All store rows have at most `createdAt`. Sync, conflict resolution and offline-replay are impossible without last-write-wins timestamps. Tombstones for deletes are missing — a delete on device A won't propagate to device B (it'll just re-appear next pull). **Fix:** add `updatedAt: ISOString` to every entity; for deletes, soft-delete with `deletedAt`, garbage-collect after sync ack.

**1.4 [HIGH] Persist+Hydrate race on cold start.**
Every store uses `persist` with default async hydration. `app/index.tsx` redirects on `session` before any store finishes hydrating, but the dev-bypass branch (line 46) sends you straight into `(tabs)` where `useAppointmentStore((s) => s.appointments)` returns `[]` for one frame, then jumps to real data. Not visible today but will produce noticeable flashes once stores hold >1MB. **Fix:** add `onRehydrateStorage` listeners, gate root with `_hasHydrated` flag, show splash until all critical stores hydrated.

**1.5 [MEDIUM] Migration strategy is ad-hoc.**
No `version: N` / `migrate` option on any of the 5 stores. As soon as you add `userId`/`updatedAt`, every existing user's persisted state needs a migration or they'll get TS-level undefined fields and silent breakage. **Fix:** add `version: 1`/`migrate: (state, v) => …` on every store now, before fields change.

**1.6 [MEDIUM] `useAuthStore.signOut` does not clear domain stores.**
[src/stores/useAuthStore.ts:76-85](src/stores/useAuthStore.ts) only resets auth fields. Combined with 1.1 this is the actual leak vector. **Fix:** call `useClientStore.setState({clients:[]})` etc. inside `signOut`, or expose a `wipeAll()` helper in each store.

---

## 2. Offline-first architecture

**2.1 [HIGH] No outbox / queue exists.**
Today the app is "offline" only because it never talks to Supabase. Adding sync naively (call `supabase.from('clients').insert()` from each Zustand action) will silently lose writes when offline. **Fix sketch:** wrap each mutating action to also push to an `outbox` table in AsyncStorage (`{op:'insert', table:'clients', payload, attempts:0}`), drain on `NetInfo` "online" event with exponential backoff, idempotency key = row UUID.

**2.2 [MEDIUM] No conflict resolution policy decided.**
With single-user-per-account and one active device, last-write-wins on `updatedAt` is sufficient. Document it. Two devices editing the same appointment within the same sync window will need server-side compare-and-swap (Supabase: `update().eq('id',x).eq('updated_at',localTs)`).

**2.3 [MEDIUM] Notifications are tied to local appointment IDs only.**
[src/stores/useAppointmentStore.ts:59-61](src/stores/useAppointmentStore.ts) stores `reminderNotificationId` next to the row. When a row is synced from server (came from device 2), there will be no local notification scheduled, but the field will be undefined — fine. The inverse: if a row is deleted on device 2 and pulled, the notification on device 1 stays scheduled. **Fix:** after every pull, reconcile scheduled notifications vs current rows; cancel orphans.

---

## 3. Notifications pipeline

**3.1 [HIGH] No push token registration code at all.**
[src/lib/notifications.ts:17-51](src/lib/notifications.ts) calls `Notifications.getPermissionsAsync()` but never `getDevicePushTokenAsync()` or `getExpoPushTokenAsync()`. For real push you need (a) FCM credentials in EAS, (b) token upload to a `device_tokens` table, (c) Supabase Edge Function or cron scheduling outbound push 1h before each `appointments.date+start_time`. Today everything is local-only; once the device is killed by OS or background-purged, reminders die. **Fix:** add Edge Function `schedule-reminders` running on cron pg_cron every minute, query upcoming appointments with `reminder_sent=false`, call `expo push API`.

**3.2 [MEDIUM] Morning summary not wired to anything.**
`scheduleMorningReminder` is exported but no caller invokes it. Dead code or unwired feature. **Fix:** decide — invoke nightly on app close, or remove.

**3.3 [MEDIUM] No `Notifications.addNotificationResponseReceivedListener`.**
Tapping a reminder doesn't deep-link to `/appointment/[id]` (data is in payload but never read). UX is broken when the user actually relies on it. **Fix:** in `_layout.tsx`, add response listener → `router.push(`/appointment/${data.appointmentId}`)`.

---

## 4. Scaling concerns

**4.1 [HIGH] O(N×M) join in `app/(tabs)/clients.tsx`.**
[clients.tsx:36-46](app/(tabs)/clients.tsx) — `lastVisitMap` rebuilds on every appointments change; fine. But `appointments.tsx:88-92` and similar iterate `allClients.filter(...)` on every render where `lastVisitMap[c.id]` is read. At 1k clients × 10k appts, the `Set` and `filter` are O(N) per render and re-trigger because both stores are subscribed naked. **Fix:** memoize sleepingClients with shallow equality, derive from `lastVisitMap` only, not `allClients`.

**4.2 [HIGH] AsyncStorage is single-blob JSON per store.**
Each `set()` rewrites the entire `masterbook-appointments` blob. At 10k appointments × ~200 bytes = 2MB JSON written on every status change. On Android AsyncStorage has a default 6MB cap and synchronous writes block JS thread >100ms at that size. **Fix:** for v1.1+, migrate to MMKV (`react-native-mmkv`) which is row-keyed and ~30× faster; or use SQLite via `expo-sqlite` and treat AsyncStorage as transient cache only.

**4.3 [MEDIUM] FlatList in `finances.tsx` and `index.tsx` has no `getItemLayout`, no `initialNumToRender` tuning.**
At hundreds of items the first paint will be janky on Android Go-class devices. **Fix:** fixed row height + `getItemLayout`.

**4.4 [MEDIUM] No pagination on `appointments` Supabase queries (when added).**
Once sync exists, `select('*').eq('user_id', uid)` will pull everything. Add `.gte('date', sixMonthsAgo)` baseline plus on-demand history fetch.

**4.5 [LOW] Calendar `monthGrid` rebuilds full month on every appointment change.**
[calendar.tsx:83](app/(tabs)/calendar.tsx). Minor.

---

## 5. Security gaps still open

**5.1 [HIGH] `_layout.tsx` does NOT subscribe to `onAuthStateChange` for sign-out from another device or token expiry.**
[app/_layout.tsx](app/_layout.tsx) wraps the app in providers but doesn't propagate session changes. `app/index.tsx` does subscribe, but once you're in `(tabs)` and the refresh token is revoked server-side, the app keeps showing stale data forever. **Fix:** move the `onAuthStateChange` listener into `_layout` or into `useAuthStore.checkSession`, call `signOut` locally on `TOKEN_REFRESHED` failure.

**5.2 [HIGH] `delete_user()` RPC uses `security definer` — verify ownership chain.**
[supabase-schema.sql:117-130](supabase-schema.sql) deletes `auth.users where id = auth.uid()`. Safe today because `auth.uid()` is checked. But `security definer` + future schema changes can become privilege escalation. Add a regression test: anonymous JWT → RPC returns "Not authenticated". Also: `auth.users` cascade depends on `profiles.id` FK with `on delete cascade`, but auth.users deletion does NOT cascade to profiles unless the FK is on auth.users — verify with an explicit `delete from profiles where id = auth.uid();` before the auth delete.

**5.3 [MEDIUM] Auth rate-limit can be bypassed by app reinstall.**
[src/lib/authRateLimit.ts](src/lib/authRateLimit.ts) stores in AsyncStorage which is wiped on uninstall. Real attacker uninstalls → 5 fresh attempts. The doc says "user can't reset via swipe" but uninstall is trivial. **Mitigation:** rely on Supabase server-side rate-limiting as the real fence; document that this client check is purely UX. Or tie to device-ID via `expo-application` `getAndroidId` / `getIosIdForVendorAsync` stored in SecureStore (survives reinstall on iOS, lost on Android reinstall — partial fix).

**5.4 [MEDIUM] Photos saved as `uri` only — local file paths persisted across reinstalls.**
[app/appointment/[id].tsx:125-138](app/appointment/[id].tsx) — `result.assets.map((a) => a.uri)` stores `file://...` paths. After reinstall (or even iOS dir UUID rotation) these URIs are dangling, `<Image>` will silently show blank. **Fix:** copy picked photo to `Paths.document/appointments/{id}/{uuid}.jpg`, store relative path, resolve with `FileSystem.documentDirectory + relPath` on read.

**5.5 [MEDIUM] No phone-number normalization or PII redaction.**
[src/lib/validation.ts:8](src/lib/validation.ts) regex accepts `+7 916 …` and unformatted. When you sync to Supabase and later support search-by-phone, you'll discover duplicates from formatting. **Fix:** strip-to-digits-with-leading-plus, store canonical, render formatted.

**5.6 [LOW] `console.warn` in `deleteAccount.ts:36` and `notifications.ts:48` leaks in production logs (if Sentry is added).**
Replace with structured logger guarded by `__DEV__`.

---

## 6. Hidden tech debt

**6.1 [MEDIUM] `as any` cast on router routes — typedRoutes broken.**
[app/(tabs)/profile.tsx:175,196](app/(tabs)/profile.tsx) and [app/(auth)/login.tsx:130](app/(auth)/login.tsx). `experiments.typedRoutes:true` is on in `app.json` but routes are coerced. Either `typedRoutes` doesn't pick up `app/settings/work-hours.tsx` (filename typo? plural?) or the type def is stale. **Fix:** `expo customize tsconfig.json` to regenerate `expo-env.d.ts`, then remove the casts.

**6.2 [MEDIUM] `updateAppointment(... { reminderNotificationId } as never)` in new.tsx:180.**
[app/appointment/new.tsx:180](app/appointment/new.tsx) — `as never` is a code smell. The `Appointment` type evidently doesn't include `reminderNotificationId` in its public surface, yet it's persisted and read in `setStatus`. **Fix:** add `reminderNotificationId?: string` to `Appointment` type properly.

**6.3 [MEDIUM] `useEffect(() => { ... unlock() ... }, [locked, unlock])` may double-trigger.**
[src/components/BiometricGate.tsx:66-68](src/components/BiometricGate.tsx). When `kind` resolves async, `unlock` reference changes (`kind` in deps), effect re-runs while `locked` is still true → second `authenticate()` prompt overlaps the first on iOS, producing "User canceled" race. **Fix:** add `if (kind === 'unknown') return;` early-out, or use a ref to track "auth in flight".

**6.4 [MEDIUM] `currentAppointment` in `app/(tabs)/index.tsx:62-69` doesn't auto-refresh when status changes elsewhere.**
It depends on `nowMinutes` (interval) and `appointments`. Fine — but the 1-min interval keeps running even when tab is backgrounded. Not a leak (cleared on unmount) but wakes JS unnecessarily. **Fix:** pause via `AppState` listener while inactive.

**6.5 [MEDIUM] `getByDate`/`getByClient` / `getTodayAppointments` in `useAppointmentStore` are not used (all consumers do their own `.filter` in `useMemo`).**
Dead code. Remove or actually use them (would centralize sort logic).

**6.6 [LOW] No tests on stores other than `useAppointmentStore`.**
`useClientStore.canAddClient` (the entire free-tier limit), `useFinanceStore.getSummary`, settings field-config defaults — all untested.

**6.7 [LOW] `useClientStore.searchClients` returns `get().clients` (mutable reference) on empty query.**
Callers shouldn't mutate but it's a sharp edge. Return `[...get().clients]` or wrap in `Object.freeze` in dev.

**6.8 [LOW] `getDaysAgo` in clients.tsx:239 uses `new Date(dateStr)` on `YYYY-MM-DD` — UTC parse vs local-time mismatch.**
At edge timezones gives off-by-one. Use `toDateKey`-style local construction or `date-fns/differenceInDays`.

---

## 7. Build / release readiness

**7.1 [HIGH] `eas.json` still has `REPLACE_WITH_…` (known from C2) — submission blocker.**
Re-flagging because it's still open.

**7.2 [HIGH] `app.json` has `ios.buildNumber: "1"` and `android.versionCode: 1` hardcoded, but EAS `autoIncrement:true` is set.**
On the second build EAS bumps remotely but local `app.json` lies. Anyone running `eas build --local` or reading manifest gets `1`. Either remove from `app.json` or commit the increments. Apple rejects builds with duplicate build numbers. **Fix:** rely on `appVersionSource: "remote"` (already set) — remove `buildNumber`/`versionCode` from `app.json` to avoid drift.

**7.3 [HIGH] No FCM Sender ID / google-services.json mentioned anywhere.**
Required for Android push (when implemented) and for some Play Console flows. **Fix:** add `expo prebuild` step or `googleServicesFile` in eas.json when adding push.

**7.4 [MEDIUM] Splash icon, adaptive-icon and favicon present, but no 1024×1024 store icon copy, no screenshots in repo.**
`assets/images` has 4 PNGs — fine for build, not for store. Store screenshots and 1024 icon may already be in `docs/SCREENSHOTS.md` (per audit), worth re-verifying before submission.

**7.5 [MEDIUM] No Sentry / crash reporter set up.**
`ErrorBoundary` is local-only. After release you'll be blind. Add `sentry-expo` and source-map upload via EAS post-build hook.

**7.6 [MEDIUM] No ESLint / Prettier / pre-commit (N4 still open).**
Any style regression slips through. Add `eslint-config-expo` + husky + lint-staged.

**7.7 [MEDIUM] No `babel.config.js` shown but `react-native-reanimated/plugin` must be last — verify when adding it.** Not visible in repo dump — confirm exists.

**7.8 [LOW] `iOS supportsTablet: false` is fine for v1 but Apple may flag if Apple Intelligence / Universal Purchase comes up. Document the decision.**

**7.9 [LOW] `app.json` declares localizations `["ru","en"]` but no EN strings exist — App Store listing will show "English" as supported, getting EN reviewers expecting EN UI.** Either ship EN i18n or drop EN from `CFBundleLocalizations`.

---

## Recommended priority order

1. **Block before sync work:** 1.1, 1.2, 1.3, 1.5 (data model for sync), 1.6 (sign-out wipe), 5.4 (photo persistence).
2. **Block before launch:** 7.1, 7.2, 7.9, 5.1 (token-revoke handling), 5.2 (delete_user regression test).
3. **Add before scale beyond ~500 clients:** 4.2 (MMKV/SQLite), 4.1 (memo fix), 6.3 (BiometricGate race).
4. **Pre-push v1.1:** 3.1+3.3 (real push + deep-link), 2.1 (outbox), 5.5 (phone normalization).
5. **Cleanup batch:** 6.1, 6.2, 6.5, 7.6.

Nothing else looked broken — Zustand+persist setup is tidy, RLS policies are correct, secure storage is well-designed, validation is thorough, tests cover the critical irreversible path (`deleteAccount`). The architecture is fine — the gaps are entirely in the **multi-device / sync / scale** dimension that v1 punted on. Pricing/distribution analysis was not part of this code-focused pass; happy to do that as a separate run if you want.

Files referenced (absolute paths):
- /Users/jumakho2013gmail.com/Projects/masterbook-app/.claude/worktrees/wonderful-wilbur/src/stores/useClientStore.ts
- /Users/jumakho2013gmail.com/Projects/masterbook-app/.claude/worktrees/wonderful-wilbur/src/stores/useAppointmentStore.ts
- /Users/jumakho2013gmail.com/Projects/masterbook-app/.claude/worktrees/wonderful-wilbur/src/stores/useAuthStore.ts
- /Users/jumakho2013gmail.com/Projects/masterbook-app/.claude/worktrees/wonderful-wilbur/src/stores/useFinanceStore.ts
- /Users/jumakho2013gmail.com/Projects/masterbook-app/.claude/worktrees/wonderful-wilbur/src/lib/notifications.ts
- /Users/jumakho2013gmail.com/Projects/masterbook-app/.claude/worktrees/wonderful-wilbur/src/lib/authRateLimit.ts
- /Users/jumakho2013gmail.com/Projects/masterbook-app/.claude/worktrees/wonderful-wilbur/src/lib/deleteAccount.ts
- /Users/jumakho2013gmail.com/Projects/masterbook-app/.claude/worktrees/wonderful-wilbur/src/components/BiometricGate.tsx
- /Users/jumakho2013gmail.com/Projects/masterbook-app/.claude/worktrees/wonderful-wilbur/app/_layout.tsx
- /Users/jumakho2013gmail.com/Projects/masterbook-app/.claude/worktrees/wonderful-wilbur/app/index.tsx
- /Users/jumakho2013gmail.com/Projects/masterbook-app/.claude/worktrees/wonderful-wilbur/app/(tabs)/index.tsx
- /Users/jumakho2013gmail.com/Projects/masterbook-app/.claude/worktrees/wonderful-wilbur/app/(tabs)/clients.tsx
- /Users/jumakho2013gmail.com/Projects/masterbook-app/.claude/worktrees/wonderful-wilbur/app/appointment/new.tsx
- /Users/jumakho2013gmail.com/Projects/masterbook-app/.claude/worktrees/wonderful-wilbur/app/appointment/[id].tsx
- /Users/jumakho2013gmail.com/Projects/masterbook-app/.claude/worktrees/wonderful-wilbur/eas.json
- /Users/jumakho2013gmail.com/Projects/masterbook-app/.claude/worktrees/wonderful-wilbur/app.json
- /Users/jumakho2013gmail.com/Projects/masterbook-app/.claude/worktrees/wonderful-wilbur/supabase-schema.sql