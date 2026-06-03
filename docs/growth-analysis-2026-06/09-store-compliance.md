No ToS/EULA documents, no consent flow code. I have enough to produce the assessment.

---

# MasterBook — Store Compliance & Multi-Platform Release Readiness

Status legend: **READY** / **PARTIAL** / **MISSING** / **BLOCKER**

---

## 1. Google Play (2026 requirements)

| Item | Status | Action |
|---|---|---|
| Target SDK 35 (Android 15) — mandatory for new apps from Aug 2025 | **PARTIAL** | Expo SDK 54 ships targetSdk 35 by default. Verify in EAS build logs; pin `expo-build-properties` if needed. |
| AAB format | **READY** | `eas.json` production → `buildType: app-bundle`. |
| Signing (Play App Signing) | **PARTIAL** | EAS manages upload key, but `google-service-account.json` is referenced but not present in repo (correct — should be local). Document the keystore backup. ~1h. |
| Data Safety form | **READY (with caveat)** | `docs/DATA_SAFETY.md` is thorough. **Caveat: `clients.phone` is collected and stored in Supabase, but DATA_SAFETY says "User IDs, Phone number — НЕ собираем".** This refers to the master's phone, but the form auditor reads it as "no phone numbers at all". Phone numbers of *third parties* (clients) DO fall under Play's "Personal info → Phone number" if synced to cloud. Once sync is enabled, you MUST update. For now (AsyncStorage-only) it's defensible. **Add a footnote.** ~30min. |
| Account deletion (in-app + web) | **PARTIAL** | In-app works (`deleteAccount.ts` → `delete_user` RPC). **MISSING: web deletion URL for non-logged-in users** — Play requires a public URL/email path. DATA_SAFETY says "email support@masterbook.app", but Play wants a **dedicated form/page**. Add `/account-deletion` route on GitHub Pages with email mailto + 7-day SLA statement. ~1h. |
| Content rating IARC | **READY** | App Store metadata covers 4+/PEGI 3. Same questionnaire on Play. |
| Foreground service / SCHEDULE_EXACT_ALARM justification | **BLOCKER** | You request `SCHEDULE_EXACT_ALARM` for reminders. **Play requires Declaration form** since Android 14 — must justify or use `setExactAndAllowWhileIdle` alternative. ~2h to either justify or refactor to inexact. |
| 16 KB page size support (req Nov 2025) | **PARTIAL** | Expo SDK 54 + RN 0.76+ supports. Verify in build. |
| Privacy policy URL in console | **READY** | GitHub Pages, but `USERNAME` placeholder still in PRIVACY_POLICY.md/metadata. **Replace before submit.** ~5min. |

---

## 2. Apple App Store

| Item | Status | Action |
|---|---|---|
| Apple Sign-In (Guideline 4.8) | **READY** | `usesAppleSignIn: true`; offered alongside email. Compliant. |
| Account deletion (Guideline 5.1.1(v)) | **PARTIAL** | `deleteAccount.ts` calls RPC then wipes locally. **Issue:** if RPC fails, code logs warning and continues — meaning user thinks account deleted but server row remains. Apple reviewers will test this. **Fix:** surface RPC failure to user with retry, OR queue retry, OR fail loud. Currently violates the spirit of 5.1.1(v). ~2h. Also: `delete_user()` calls `delete from auth.users` which requires `security definer` privilege escalation — verify it works in production Supabase (some plans restrict this). |
| ATT (App Tracking Transparency) | **READY** | No trackers; `NSPrivacyTracking: false`. Stays valid until you add analytics. |
| Encryption export compliance | **READY** | `ITSAppUsesNonExemptEncryption: false`. HTTPS-only is exempt. |
| Privacy manifest (NSPrivacyAccessedAPITypes) | **PARTIAL** | UserDefaults declared with reason CA92.1. **Missing:** `expo-file-system` likely triggers `NSPrivacyAccessedAPICategoryFileTimestamp` (C617.1); `expo-device` may trigger system boot time. Run Xcode 16 privacy report on the archive. ~1h. |
| Age rating | **READY** | 4+ matches; no UGC, no third-party content. |
| Demo account for reviewer | **MISSING** | `reviewer@masterbook.app` placeholder in metadata — create real account in Supabase before submission. ~10min. |
| Liquid Glass / iOS 26 compliance | **READY** | Mentioned in audit; native BlurView. |
| Universal Links / associatedDomains | **PARTIAL** | Empty array. If you launch online-booking pages later, add domain. Not blocking for v1. |
| In-App Purchase (Guideline 3.1.1) | **BLOCKER (deferred)** | `profile.tsx` mentions PRO but no IAP code. **Critical:** if the UI mentions PRO/$3.99 anywhere visible at review, reviewer will reject for "purchase mechanism not implemented" OR demand IAP. **Hide PRO mentions entirely for v1**, or implement RevenueCat. ~30min to hide, ~16h to implement IAP properly. |

---

## 3. RuStore (VK / Russia)

| Item | Status | Action |
|---|---|---|
| Russian legal entity OR self-employed (ИП/самозанятый) | **MISSING (depends on you)** | RuStore allows individual developers (физлица + самозанятые) since 2024. Need ИНН + RuStore Console account. ~2-4h setup. |
| Russian-language metadata | **READY** | Already RU-first. |
| СБП payments | **N/A for free tier** | Required only if you take payments inside the app. Free tier launch doesn't need it. When you add PRO: must integrate RuStore Billing SDK (analog of Google Play Billing). ~24h work. |
| AAB / APK | **READY** | RuStore accepts both. |
| Signing | **READY** | Same upload key works. |
| Content / privacy | **READY** | Russian privacy policy already bilingual in PRIVACY_POLICY.md. |
| 152-ФЗ compliance notice | **MISSING** | RuStore requires confirmation that personal-data law is observed (see §5). ~1h. |
| Anti-virus check | **PARTIAL** | RuStore runs Kaspersky scan on upload. Should pass — no native binaries you don't control. |

**Bare minimum:** ИП/самозанятый registration + RuStore Console + remove Google Play Services dependencies that fail offline (your `expo-notifications` uses FCM on Android — **on RuStore-only devices without GMS, local notifications still work** but ensure no FCM-only code paths). Verify on Huawei device.

---

## 4. AppGallery (Huawei)

| Item | Status | Action |
|---|---|---|
| HMS account | **MISSING** | Free for individuals. ~2h setup. |
| GMS dependency check | **PARTIAL** | Local notifications work without GMS (use AlarmManager via `expo-notifications`). **Apple Sign-In is iOS-only — fine.** Remote push (future) needs HMS Push Kit alongside FCM. |
| AAB | **READY** | AppGallery accepts AAB since 2023. |
| Privacy/age | **READY** | Same as Play. |
| Russian content allowed | **READY** | Yes. |

**Effort: low.** AppGallery is the most forgiving of the three Russian-market stores.

---

## 5. Russia / CIS legal (152-ФЗ)

| Item | Status | Action |
|---|---|---|
| Личное согласие пользователя на обработку ПДн | **BLOCKER** | No consent screen exists at signup. **Required by 152-ФЗ Art. 9.** Add checkbox "Соглашаюсь с обработкой персональных данных" linking to privacy policy on registration. Cannot be pre-checked. ~2h. |
| Согласие на обработку ПДн третьих лиц (клиентов мастера) | **BLOCKER** | This is the **biggest legal risk**. The master adds a client's phone number to your DB — that client never consented. Under 152-ФЗ, the master becomes the *operator* of his clients' data, and you become a *processor*. **Required:** add to ToS a clause that the master warrants having client consent, and add a screen during first client creation explaining this. ~3h + lawyer review. |
| Data residency on RU servers (Art. 18 п.5) | **BLOCKER for RU market** | 152-ФЗ requires first storage of RU citizens' PD on **servers physically in Russia**. **Supabase has no RU region.** Options: (a) migrate to Yandex Cloud Postgres / VK Cloud (~80h work); (b) keep data AsyncStorage-only for RU users (current state — actually compliant since nothing leaves device); (c) declare RU users as "not collecting PD remotely" until sync ships. **For v1 launch on AsyncStorage-only: defensible.** When sync ships: **mandatory migration**. Add roadmap item. |
| Notification to Roskomnadzor (Уведомление об обработке ПДн) | **MISSING** | Operators of PD must file a notice. Free, ~1 month review. Required even for AsyncStorage-only if you process emails of RU users. Submit via gosuslugi.ru. ~3h. |
| Email/phone retention policy | **MISSING** | 152-ФЗ requires stated retention period. Add to privacy policy: "хранение до удаления аккаунта пользователем или 3 года неактивности". ~30min. |

---

## 6. GDPR (EU future readiness)

| Item | Status | Action |
|---|---|---|
| Lawful basis | **PARTIAL** | Implicit "contract" basis for account. Need explicit consent for any future analytics. |
| DPA with Supabase | **MISSING (action)** | Supabase offers DPA via dashboard — sign it. ~10min. |
| Data Processing Agreement with master (B2B2C) | **MISSING** | Master is data controller for his clients; you are processor. Need a DPA in ToS. ~lawyer review, ~$500. |
| Right to portability | **READY** | JSON export exists. |
| Right to erasure | **PARTIAL** | Account deletion exists; see §2 caveat about RPC failures. |
| DPO contact | **MISSING** | Add `dpo@masterbook.app` alias. ~5min. |
| Cookie banner on docs site | **PARTIAL** | GitHub Pages serves no cookies you set; Jekyll default theme is fine. If you add Google Analytics later — needs banner. |
| EU-US data transfer (Supabase) | **PARTIAL** | Supabase offers EU region — verify your project is `eu-central-1` not `us-east-1`. Critical for GDPR. ~5min check. |

---

## 7. Sensitive data (photos, phones, finances)

| Item | Status | Action |
|---|---|---|
| Photos | **READY** | Stored as device URIs only, never uploaded. DATA_SAFETY ephemeral flag correct. **When you add cloud sync — must use Supabase Storage with signed URLs + RLS, not public bucket.** |
| Phone numbers (client) | **PARTIAL** | Plaintext in AsyncStorage. AsyncStorage is **not encrypted** on Android by default (only sandboxed). On rooted devices or backed-up Android phones, data is readable. **Recommendation:** encrypt the clients store at rest with `expo-secure-store`-derived key (you already use SecureStore per recent commit). ~6h. |
| Financial figures | **PARTIAL** | Same as phones — plaintext in AsyncStorage. Same fix. |
| Biometric lock | **READY** | Face ID/Touch ID gate the UI, but doesn't encrypt data. Document this honestly: biometric is UI gate, not encryption. |
| Backups | **MISSING (consideration)** | Android auto-backup will sync AsyncStorage to Google Drive. Add `android:allowBackup="false"` or `dataExtractionRules` to exclude sensitive keys. ~1h. iOS iCloud backup of AsyncStorage — same concern, exclude via `NSURLIsExcludedFromBackupKey`. |

---

## 8. Account deletion — verify the chain

| Step | Status | Note |
|---|---|---|
| 1. Cancel notifications | **READY** | `cancelAllNotifications().catch(...)`. |
| 2. RPC `delete_user` | **PARTIAL** | RPC exists in `supabase-schema.sql`. **`delete from auth.users` in security-definer function — Supabase may block this on free tier or require service_role.** Test in real project. If blocked, function must call admin API via Edge Function. ~4h. |
| 3. Silent RPC failure | **BUG** | `console.warn` only — user sees success while remote data persists. **Apple rejection risk.** ~2h fix. |
| 4. `signOut()` | **READY** | |
| 5. `AsyncStorage.clear()` | **READY** | |
| 6. In-memory reset | **PARTIAL** | Only `useAuthStore.reset()` — other Zustand stores (clients, appointments, finances, services) keep their in-memory state until app restart. **Risk:** user deletes account, navigates back, still sees clients. ~1h to reset all stores. |

**Audit chain summary:** local wipe is solid; remote wipe is silently lossy and other stores leak. Fix before App Store submission.

---

## 9. App-review traps for CRM apps

| Trap | Risk | Preempt |
|---|---|---|
| Apple 4.2 "Minimum Functionality" | LOW | App has real CRM features. Fine. |
| Apple 5.1.1(v) deletion not working | **HIGH** | See §8 — fix RPC error handling. |
| Apple 3.1.1 mentioning prices without IAP | **HIGH** | Remove `profile.tsx` PRO mentions OR implement IAP. |
| Apple 2.3 metadata/screenshot mismatch | MEDIUM | Screenshots must show actual app, not mockups. |
| Play "Health Connect" misclaim | LOW | N/A. |
| Play "Sensitive permissions" (SMS, Call Log) | LOW | You don't request. ✅ |
| Play "Personal loans" / "Financial features" | MEDIUM | You track finances but don't *provide* financial services. State clearly in description. |
| Play "Government IDs" | LOW | None. |
| RuStore "запрещённый контент" | LOW | CRM is fine. |
| Demo account broken | HIGH | Create real reviewer account, save in 1Password, document in metadata. |
| Crash on first launch with empty state | MEDIUM | Manual QA on fresh install pre-submission. |

---

## 10. Required documents

| Document | Status | Action |
|---|---|---|
| Privacy Policy (RU+EN) | **READY** | `PRIVACY_POLICY.md` is bilingual. Replace `USERNAME` placeholder. ~5min. |
| Terms of Service / EULA | **MISSING** | No ToS file in repo. **Required by Play (recommended), App Store (recommended), RuStore (required for paid apps), 152-ФЗ (effectively required).** Must cover: license to use, master's responsibility for client data, no warranty, limitation of liability, governing law. ~6h + lawyer. Add `docs/TERMS.md`. |
| Согласие на обработку ПДн (consent text) | **MISSING** | Required for RU. Add `docs/consent.md` and link from signup. ~2h. |
| DPA template (B2B2C, for master ↔ MasterBook) | **MISSING** | EU/global expansion. ~lawyer. Defer to v1.1. |
| Cookie / tracking notice | **N/A** | GitHub Pages docs site has no cookies you set. If you add Plausible/GA — banner needed. |
| Open-source licenses notice | **MISSING** | App should expose third-party licenses (RN, Expo, Supabase, etc.). Add `Settings → О приложении → Лицензии` screen with `expo-asset` license bundle. ~2h. Apple may not block but reviewers sometimes ask. |
| Support URL | **READY** | `docs/support.md` exists. |

---

## Top blockers (do these before any store submission)

1. **Remove or hide PRO/pricing mentions in `profile.tsx`** until IAP ships — Apple will reject. (30 min)
2. **Fix `deleteAccount.ts` — surface RPC failure to user** instead of silent warn. (2h)
3. **Reset all Zustand stores on account deletion**, not just auth. (1h)
4. **Replace `USERNAME` placeholders** in PRIVACY_POLICY.md and APP_STORE_METADATA.md. (10 min)
5. **Create real reviewer demo account** in Supabase, set strong password, document in metadata. (10 min)
6. **Add 152-ФЗ consent checkbox** at signup linking to privacy policy. (2h)
7. **Add `allowBackup=false`** on Android + iCloud exclusion on iOS for AsyncStorage with sensitive data. (1h)
8. **Verify Supabase project region = EU** if planning EU launch. (5 min)
9. **Justify or remove `SCHEDULE_EXACT_ALARM`** for Play. (2h)
10. **Add public account-deletion URL** on docs site. (1h)
11. **Add minimal ToS (`docs/TERMS.md`)** covering data-controller language for master/client relationship. (4-6h)
12. **File Roskomnadzor notification** before any paid Russian distribution. (3h paperwork, ~1 month wait)

**Total blocker effort: ~20-25 engineering hours + legal review.**

Files needing edits: `/Users/jumakho2013gmail.com/Projects/masterbook-app/.claude/worktrees/wonderful-wilbur/src/lib/deleteAccount.ts`, `/Users/jumakho2013gmail.com/Projects/masterbook-app/.claude/worktrees/wonderful-wilbur/PRIVACY_POLICY.md`, `/Users/jumakho2013gmail.com/Projects/masterbook-app/.claude/worktrees/wonderful-wilbur/docs/APP_STORE_METADATA.md`, `/Users/jumakho2013gmail.com/Projects/masterbook-app/.claude/worktrees/wonderful-wilbur/app.json` (SCHEDULE_EXACT_ALARM, allowBackup), `/Users/jumakho2013gmail.com/Projects/masterbook-app/.claude/worktrees/wonderful-wilbur/docs/DATA_SAFETY.md` (phone footnote), `/Users/jumakho2013gmail.com/Projects/masterbook-app/.claude/worktrees/wonderful-wilbur/supabase-schema.sql` (verify delete_user privilege). New files: `docs/TERMS.md`, `docs/consent.md`, `docs/account-deletion.md`.