# Declutter App — Production Audit

**Date:** 2026-03-17
**Stack:** Expo + React Native + Convex
**Status:** Alpha-complete. NOT App Store ready without fixing P0 issues.
**Production Readiness:** ~70%

---

## Executive Summary

| Area | Score | Verdict |
|------|-------|---------|
| Code Quality | 7/10 | 30 issues found (6 critical, 6 high) |
| UI/UX Design | 7.1/10 | Strong ADHD-aware foundation, needs polish |
| Onboarding | 7.5/10 | Good flow, decision fatigue on struggles step |
| Accessibility | 6.5/10 | Touch targets too small, inconsistent reduced motion |
| Feature Completeness | 7/10 | Core works, 6+ backend features unused |
| App Store Readiness | 5/10 | Missing privacy policy, terms, crash reporting |
| Architecture | 8/10 | Clean data flow, proper context separation |
| Dark Mode | 7.5/10 | Works but ~15 hardcoded colors break it |
| Pencil Design Coverage | 6.5/10 | 57 screens designed, 7+ code screens have no design spec |

**Bottom line:** 2–3 weeks of focused work on P0+P1 items, then ready for beta.

---

## Table of Contents

1. [Critical Code Issues (P0)](#1-critical-code-issues-p0)
2. [High-Priority Code Issues (P1)](#2-high-priority-code-issues-p1)
3. [UI/UX Issues](#3-uiux-issues)
4. [Onboarding Problems](#4-onboarding-problems)
5. [ADHD-Specific UX Gaps](#5-adhd-specific-ux-gaps)
6. [Feature Gaps & Dead Code](#6-feature-gaps--dead-code)
7. [Architecture Issues](#7-architecture-issues)
8. [App Store Readiness](#8-app-store-readiness)
9. [Security Issues](#9-security-issues)
10. [Medium & Low Priority Issues](#10-medium--low-priority-issues)
11. [Action Plan](#11-action-plan)
12. [Pencil Design Audit](#12-pencil-design-audit)

---

## 1. Critical Code Issues (P0)

### 1.1 JSON Parsing Without Error Handling
- **Files:** `services/secureStorage.ts:77`, `services/taskOptimizer.ts:52,91`, `services/zai.ts:380,851,975`, `services/notificationTiming.ts:41`
- **Severity:** CRITICAL
- **Problem:** Multiple `JSON.parse()` calls without try-catch. Malformed stored data crashes the app.
- **Fix:** Wrap all `JSON.parse` in try-catch with fallback to `null`.

### 1.2 Unhandled Promise Rejections in DeclutterContext
- **File:** `context/DeclutterContext.tsx:212-215, 452-467, 509-513`
- **Severity:** CRITICAL
- **Problem:** Async operations (photo upload, cloud sync) silently log errors instead of propagating. State corruption possible.
- **Fix:** Add explicit error state management and retry logic with exponential backoff.

### 1.3 Memory Leak — Uncleaned Timeouts
- **File:** `context/DeclutterContext.tsx:558-562, 984-987`
- **Severity:** CRITICAL
- **Problem:** Mascot activity timeouts fire after component unmount, updating stale state.
- **Fix:** Use AbortController or ensure cleanup runs in useEffect return.

### 1.4 Race Condition in Cloud Sync
- **File:** `context/DeclutterContext.tsx:159-189`
- **Severity:** CRITICAL
- **Problem:** `applyCloudData` sets rooms/stats non-atomically. If user modifies data while hydrating from cloud, local changes get overwritten.
- **Fix:** Implement last-write-wins with timestamps or merge strategy.

### 1.5 Console.error Leaks to Production
- **Files:** `convex/notifications.ts:84, 90`
- **Severity:** CRITICAL
- **Problem:** `console.error()` without `__DEV__` guard. Leaks error details (potentially including API info) to client logs.
- **Fix:** Remove or wrap in conditional logging.

### 1.6 Unsafe `any` Type Casts Throughout
- **Files:** `app/room/[id].tsx`, `app/(tabs)/progress.tsx`, `app/achievements.tsx`, `app/auth/login.tsx`, `app/challenge/[id].tsx`
- **Severity:** CRITICAL
- **Problem:** Multiple `as any` casts defeat type safety: `Animated.createAnimatedComponent(Circle as any)`, `badge: undefined as any`, `catch (e: any)`
- **Fix:** Use proper TypeScript types and generics.

### 1.7 Privacy Policy & Terms Missing
- **Impact:** App Store REJECTION
- **Problem:** Links point to `blockbrowser.com/privacy` (not app-specific). No Terms of Service.
- **Fix:** Create `declutterly.app/privacy` and `/terms` pages. Link in app settings and paywall.

### 1.8 Paywall Not Integrated with Feature Gating
- **Files:** `app/paywall.tsx`, `hooks/useRevenueCat.ts`
- **Problem:** RevenueCat hook exists but isn't used in any screen. Pro features aren't enforced.
- **Fix:** Add entitlement checks before Pro features (unlimited rooms, AI tasks, social).

---

## 2. High-Priority Code Issues (P1)

### 2.1 Unsafe Rate Limiter State Mutation
- **File:** `services/secureStorage.ts:225-282`
- **Problem:** Rate limiter mutates `requests` array without synchronization. Race condition under rapid API calls.
- **Fix:** Use atomic operation or lock mechanism.

### 2.2 Missing Auth Validation Before Convex Calls
- **File:** `context/DeclutterContext.tsx:390-403`
- **Problem:** `addRoom` silently swallows Convex errors. User thinks room was created but it only exists locally.
- **Fix:** Surface sync errors to user with retry option.

### 2.3 Photo Upload Can Crash on Server Error
- **File:** `context/DeclutterContext.tsx:452-497`
- **Problem:** `uploadResponse.json()` called without checking `uploadResponse.ok`. Server 500 → crash.
- **Fix:** Check response status before parsing. Retry with backoff.

### 2.4 Missing Subscription Status Sync
- **File:** `context/DeclutterContext.tsx` (absent)
- **Problem:** No RevenueCat subscription sync to Convex. If user buys premium on another device, app doesn't know.
- **Fix:** Add subscription sync hook that polls RevenueCat and updates Convex user record.

### 2.5 AI Service Retry Logic Broken
- **File:** `services/ai.ts:59-87`
- **Problem:** `isRetryableAiError` uses type cast `as RetryableError` but error may not have `status` property. Retry logic may not trigger.
- **Fix:** Add proper type narrowing before cast.

### 2.6 RevenueCat Module Missing Error Boundary
- **File:** `hooks/useRevenueCat.ts:14-26`
- **Problem:** Native module import wrapped in try-catch, but subsequent code assumes module exists. Many `Purchases` calls lack null checks.
- **Fix:** Add null guard to every `Purchases` call or throw clear error on init.

### 2.7 Activity Log Never Recorded
- **Files:** `convex/activityLog.ts`, `app/room/[id].tsx`, `app/(tabs)/index.tsx`
- **Problem:** Activity tracking schema exists but `recordDailyActivity` is never called. Streak calendar won't populate.
- **Fix:** Call `recordDailyActivity` after any task completion.

### 2.8 Variable Rewards Never Triggered
- **File:** `convex/variableRewards.ts` (entire file)
- **Problem:** Mystery reward system fully defined in backend but never called from UI. Users never get surprise drops.
- **Fix:** Trigger reward check on every 3rd task completion.

### 2.9 Weekly Leaderboard Not Automated
- **File:** `convex/leaderboard.ts`
- **Problem:** `processWeeklyResults` exists but no cron or trigger runs it. League promotions never happen.
- **Fix:** Add Convex cron job or trigger on app launch.

---

## 3. UI/UX Issues

### Screen-by-Screen Problems

| Screen | Issue | Severity | Fix |
|--------|-------|----------|-----|
| **TaskCard** | Checkbox 26x26px (below Apple's 44px minimum) | HIGH | Increase to 28px + add `hitSlop` |
| **TaskCard** | Completed tasks at 0.5 opacity — hard to read | MEDIUM | Use 0.65 opacity or muted color |
| **TaskCard** | "QUICK WIN" only shows for ≤5 min tasks | MEDIUM | Change threshold to 10 min for ADHD |
| **TaskCard** | Energy/impact badges hidden when collapsed | MEDIUM | Show energy emoji inline |
| **TaskCard** | Hardcoded colors `#FFFFFF`/`#1A1A1A` | MEDIUM | Use `Colors.ts` tokens |
| **Mascot** | Speech bubble only 2700ms — users miss it | MEDIUM | Extend to 3500ms |
| **Mascot** | Glow animation may distract sensory-sensitive users | LOW | Add intensity toggle |
| **Home** | No "Continue last session" option | HIGH | Add suggestion chip for last room |
| **Home** | Loading text unclear ("Getting your calm space ready") | LOW | Use "Loading your plan..." |
| **Camera** | 49KB file — combined preview + room selection overwhelms | MEDIUM | Add step progress indicator |
| **Analysis** | No transition between scanning done → results shown | LOW | Add brief fade-in with "Here's what I found:" |
| **GlassButton** | Disabled state 0.6 opacity — not obvious | LOW | Use 0.4 opacity + gray color |
| **ScreenLayout** | Back button uses text `‹` instead of icon | LOW | Use Ionicons chevron-back |
| **Notification** | Benefit items shadow 0.06 — invisible in light mode | LOW | Increase to 0.1 |

### Consistency Issues

| Issue | Details |
|-------|---------|
| **Button styles inconsistent** | Onboarding uses gradient buttons; other screens use GlassButton |
| **~15 hardcoded colors** | Should all reference `Colors.ts` |
| **Loading states vary** | Splash: breathing dot. Home: ActivityIndicator + emoji. No shared component. |
| **Reduced motion incomplete** | Mascot + Onboarding respect it. TaskCard main animations + Analysis transitions do not. |

### Dark Mode Breaks

| Component | Issue |
|-----------|-------|
| TaskCard | Uses `#141414` dark / `#FFFFFF` light directly |
| Task muted text | `#808080` may fail WCAG AA contrast |
| Onboarding borders | `rgba(52,39,28,0.08)` nearly invisible |
| Dark mode borders | `rgba(255,255,255,0.09)` too subtle — increase to 0.12 |

---

## 4. Onboarding Problems

### What Works Well
- 13-step progressive disclosure — well-paced
- Clear value proposition ("Your space deserves to feel calm")
- Personalization captures living situation, struggles, energy, time, motivation style, mascot
- Low-pressure CTA with "Continue without upgrading" option

### What Needs Fixing

| Issue | File:Line | Severity | Fix |
|-------|-----------|----------|-----|
| **Decision fatigue on Struggles step** (6 multi-select options, no guidance) | `onboarding.tsx:783-796` | HIGH | Add "Pick 2-3 that feel true" hint or "Help me" pre-select button |
| **Back button disabled at paywall** | `onboarding.tsx:1062` | MEDIUM | Allow back or add "No pressure — upgrade later in Settings" |
| **"2 minutes to finish" claim misleading** | `onboarding.tsx:1076` | MEDIUM | Change to "Usually 3-5 minutes" |
| **Energy level doesn't adapt loading screen** | `onboarding.tsx:798-813` | MEDIUM | Show "Sizing tasks to your {energy} level..." |
| **Can't re-run onboarding** | Settings screen | LOW | Add "Recalibrate my plan" option |

---

## 5. ADHD-Specific UX Gaps

| Gap | Impact | Recommendation |
|-----|--------|----------------|
| **No Quick Win mode** | ADHD brains need dopamine hits | Add "5-minute quick wins" filter showing only fast tasks |
| **No session recap** | User completes tasks, no celebration | Add post-session modal: "You did 15 min, earned 50 XP!" |
| **No energy check-in on home** | Users can't gauge today's capacity | Add energy slider on home screen |
| **Decision fatigue on room selection** | 5+ rooms = choice paralysis | Remember last active room, offer as suggestion |
| **Streak logic not explained** | Users don't know what breaks it | Add tooltip on first achievement unlock |
| **Resistance handler buried** | TaskCard supports it but hidden in expanded view | Show as subtle inline hint |
| **No "Continue last session"** | Every visit = start from scratch | Add "Resume Bedroom cleanup" chip on home |
| **Focus mode has no status indicator** | User forgets they're in focus mode | Add header badge during active session |
| **Mascot hunger has no alert** | Mascot gets sad silently | Send "Dusty is hungry!" notification when hunger < 20% |

---

## 6. Feature Gaps & Dead Code

### Backend Functions Never Called from UI

| Function | File | Impact |
|----------|------|--------|
| `variableRewards.*` (all mutations) | `convex/variableRewards.ts` | Mystery drops never spawn |
| `leaderboard.processWeeklyResults` | `convex/leaderboard.ts` | League promotions never happen |
| `notifications.*` (all mutations) | `convex/notifications.ts` | Push notifications use local only |
| `activityLog.recordDailyActivity` | `convex/activityLog.ts` | Streak calendar won't populate |
| `accountability.getBothActiveBonus` | `convex/accountability.ts` | Partner bonus never calculated |

### Schema Supports but UI Doesn't Expose

| Feature | Schema Field | Problem |
|---------|-------------|---------|
| Streak freeze spending | `stats.streakFreezesAvailable` | Shield exists but not spendable |
| Comeback celebration | `stats.comebackBonusMultiplier` | Only shows notification, no details |
| Task dependencies | `tasks.dependencies, enables, parallelWith` | Stored but completely ignored |
| Zone-based task grouping | `tasks.zone` | Stored but no group-by-zone in UI |
| Mascot personality differences | `mascots.personality` | All personalities behave identically |

### Incomplete Features

| Feature | Status | What's Missing |
|---------|--------|----------------|
| **Accountability partners** | Backend complete, UI minimal | Partner search, nudge workflow |
| **Social community** | Challenge system works | Friend suggestions, activity feed |
| **Insights dashboard** | Charts display | Predictive insights, recommendations |
| **Paywall/monetization** | RevenueCat configured | Feature gating not enforced |
| **AR collectibles** | Toggle in settings | No AR implementation |

### Missing User Flows

| Flow | Status |
|------|--------|
| Room photo deletion | Can add but not remove photos |
| Task editing post-analysis | Tasks generated but not customizable |
| Custom room without AI | All rooms require photo analysis |
| Bulk task operations | Can't mark multiple tasks at once |
| Undo deleted rooms/tasks | No recovery option |
| Share room progress | No sharing capability |
| Profile editing | No edit profile screen |
| Mascot customization after onboarding | Can't change mascot post-setup |

---

## 7. Architecture Issues

### Clean (No Action Required)
- ✅ Proper data flow: User → Components → Hooks → Convex → Database
- ✅ No circular dependencies detected
- ✅ Appropriate context separation (Auth, Declutter, Focus, Theme)
- ✅ Local-first with cloud sync is solid
- ✅ Offline indicator component exists

### Problems

| Issue | Severity | Details |
|-------|----------|---------|
| **FocusContext duplicates DeclutterContext** | MEDIUM | Focus session state in both contexts; mutations don't sync |
| **No conflict resolution** | HIGH | Offline edits + cloud sync = data overwrite risk |
| **No request deduplication for AI** | MEDIUM | Rapid "Analyze Room" taps queue duplicate API calls |
| **Missing error recovery UI** | MEDIUM | Sync errors show message but no retry button |
| **useMemo missing dependencies** | MEDIUM | `DeclutterContext.tsx:1162-1179` — stale callback references possible |
| **Missing TypeScript strict mode** | LOW | Many `any` types and implicit nulls |

---

## 8. App Store Readiness

| Requirement | Status | Action |
|-------------|--------|--------|
| Privacy Policy | ❌ MISSING | Create app-specific policy, link in settings |
| Terms of Service | ❌ MISSING | Draft terms, link in paywall |
| Support Email | ⚠️ PLACEHOLDER | Set up `support@declutterly.app` |
| Crash Reporting | ❌ MISSING | Integrate Sentry |
| Analytics | ❌ MISSING | Integrate Firebase Analytics |
| App Review Prompts | ❌ MISSING | Add StoreReview API |
| GDPR Data Export | ❌ MISSING | Add data export feature |
| Age Rating | ✅ Set (4+) | Correct |
| Screenshots | ⚠️ PENDING | Render from Pencil designs |
| Metadata | ✅ Ready | Checklist in `docs/APP_STORE_METADATA_CHECKLIST.md` |
| Keywords | ✅ Ready | 11 terms documented |
| Category | ✅ Set (Productivity) | Correct |

---

## 9. Security Issues

| Issue | Severity | Details |
|-------|----------|---------|
| **JSON.parse without try-catch** (6+ locations) | CRITICAL | Malformed data crashes app |
| **console.error in production Convex** | CRITICAL | Leaks error details |
| **Auth errors may log tokens** | MEDIUM | `AuthContext.tsx:420` logs full error objects |
| **No email format validation before auth** | MEDIUM | `AuthContext.tsx:223-230` trusts input |
| **RevenueCat API keys in client bundle** | LOW | Expected for client SDK, but document it |
| **No CORS validation on Convex external calls** | LOW | External API responses not validated |
| **Math.random() for local IDs** | LOW | `FocusContext.tsx:10` — not crypto-safe |

---

## 10. Medium & Low Priority Issues

### Medium

| # | Issue | File | Fix |
|---|-------|------|-----|
| 1 | Unprotected sensitive data in auth logs | `AuthContext.tsx:420` | Log only error type/code |
| 2 | Missing input validation in auth | `AuthContext.tsx:223-230` | Validate email format client-side |
| 3 | AsyncStorage errors only logged in DEV | `DeclutterContext.tsx:273-326` | Add persistent error state |
| 4 | FocusSession no validation | `DeclutterContext.tsx:933-952` | Validate duration > 0, roomId exists |
| 5 | useMemo missing deps | `DeclutterContext.tsx:1162-1179` | Add all callbacks to deps array |
| 6 | Photo quality silent default | `services/ai.ts:252-293` | Validate coverage value |
| 7 | RevenueCat product ID string matching fragile | `hooks/useRevenueCat.ts:256-259` | Use exact match or metadata field |
| 8 | Mascot state not persisted to cloud | `DeclutterContext.tsx` | Sync mood/hunger changes to Convex |

### Low

| # | Issue | File |
|---|-------|------|
| 1 | FocusContext duplicates DeclutterContext | `context/FocusContext.tsx` |
| 2 | Unnecessary state updates in analysis | `app/analysis.tsx:150+` |
| 3 | Missing null safety in photo upload | `DeclutterContext.tsx:452` |
| 4 | Math.random for IDs | `FocusContext.tsx:10` |
| 5 | TypeScript strict mode not enabled | `tsconfig.json` |

---

## 11. Action Plan

### Phase 1: CRITICAL (Before App Store — ~1 week)

| Task | Est. Time | Impact |
|------|-----------|--------|
| Create privacy policy & terms pages | 2-4 hours | Unblocks submission |
| Fix all JSON.parse without try-catch (6 locations) | 2 hours | Prevents crashes |
| Fix cloud sync race condition | 4 hours | Prevents data loss |
| Remove console.error from production Convex code | 30 min | Security |
| Add try-catch to photo upload + validate responses | 2 hours | Prevents crashes |
| Implement RevenueCat feature gating | 3-5 days | Monetization |
| Wire activity log recording | 4 hours | Core feature |

### Phase 2: HIGH (Before Beta — ~1 week)

| Task | Est. Time | Impact |
|------|-----------|--------|
| Trigger variable rewards on task completion | 4 hours | Engagement |
| Add weekly leaderboard cron job | 4 hours | Social feature |
| Fix subscription sync across devices | 1 day | Revenue |
| Add "Continue last session" on home screen | 4 hours | ADHD UX |
| Fix checkbox touch targets (26px → 28px + hitSlop) | 1 hour | Accessibility |
| Extend mascot speech bubble to 3500ms | 30 min | UX |
| Add decision fatigue helper on onboarding struggles | 2 hours | Onboarding |
| Integrate Sentry crash reporting | 4 hours | Monitoring |

### Phase 3: POLISH (v1.1 — ~2 weeks)

| Task | Est. Time |
|------|-----------|
| Replace all hardcoded colors with Colors.ts tokens | 1 day |
| Add reduced motion to TaskCard + Analysis animations | 4 hours |
| Create shared LoadingScreen component | 2 hours |
| Build profile editor screen | 1 day |
| Build mascot customization screen | 1 day |
| Add room photo deletion | 4 hours |
| Implement data export (GDPR) | 1 day |
| Add Firebase Analytics | 4 hours |
| Enable TypeScript strict mode + fix types | 2 days |
| Remove FocusContext duplication | 4 hours |
| Add request deduplication for AI calls | 4 hours |
| Add session recap celebration modal | 4 hours |
| Add energy check-in on home screen | 4 hours |

---

## Appendix: Files Audited

**App Screens:** `app/_layout.tsx`, `app/onboarding.tsx`, `app/camera.tsx`, `app/analysis.tsx`, `app/room/[id].tsx`, `app/(tabs)/index.tsx`, `app/(tabs)/progress.tsx`, `app/(tabs)/rooms.tsx`, `app/(tabs)/profile.tsx`, `app/settings.tsx`, `app/paywall.tsx`, `app/achievements.tsx`, `app/auth/login.tsx`, `app/challenge/[id].tsx`, `app/accountability.tsx`, `app/insights.tsx`, `app/splash.tsx`, `app/notification-permission.tsx`

**Components:** `components/features/Mascot.tsx`, `components/room/TaskCard.tsx`, `components/ui/GlassButton.tsx`, `components/ui/ScreenLayout.tsx`, `components/ui/OfflineIndicator.tsx`, `components/ui/ProgressComparison.tsx`, `components/ui/AppBootstrapScreen.tsx`, `components/ErrorBoundary.tsx`

**Services:** `services/ai.ts`, `services/zai.ts`, `services/social.ts`, `services/notifications.ts`, `services/localPhotos.ts`, `services/secureStorage.ts`, `services/convexMappers.ts`, `services/errors.ts`, `services/hydration.ts`, `services/logger.ts`

**Backend:** `convex/schema.ts`, `convex/gemini.ts`, `convex/sync.ts`, `convex/settings.ts`, `convex/notifications.ts`, `convex/leaderboard.ts`, `convex/variableRewards.ts`, `convex/activityLog.ts`, `convex/accountability.ts`, `convex/social.ts`

**Context:** `context/AuthContext.tsx`, `context/DeclutterContext.tsx`, `context/FocusContext.tsx`

**Hooks:** `hooks/useConvex.ts`, `hooks/useRevenueCat.ts`

**Config:** `app.json`, `eas.json`, `package.json`, `tsconfig.json`

**Design:** `declutter.pen`

---

## 12. Pencil Design Audit

### Design File: `declutter.pen`

**57 total design screens** across 7 top-level groups, all with Dark + Light mode variants.

### Complete Screen Inventory

| Group | Screens (Dark + Light) | Node IDs |
|-------|----------------------|----------|
| **Home Screen** | Home — Dark, Home — Light | `EaNi8`, `BrrUT` |
| **Onboarding + Auth** | Splash, Onboarding 1-3, Sign In, Sign Up (x2 modes) | `DYI3d`, `iHCOY`, `ZET8q`, `56GDP`, `3EIk2`, `2XjOi`, `nIiKd`, `hiNGh`, `D2p2z`, `jopyK`, `Ndqsi`, `PvssN` |
| **Room + Analysis** | Room Detail (x2), AI Analysis Scan, Analysis Results (x2) | `8epjp`, `9qjuI`, `oVtRa`, `xNwnE`, `i3LPe` |
| **Progress + Achievements** | Progress Overview, Achievements, Progress Screen, Achievements Screen | `i8wOY`, `UarCI`, `yPXmh`, `3OiQd` |
| **Profile + Settings + Paywall + Social** | Profile, Settings, Paywall, Social, Accountability (x2 modes each) | `3btCa`/`ud8Vt`, `8kS1c`/`QTtmh`, `zry8j`/`EqeWQ`, `LFLhW`/`f9hhN`, `xedxv`/`QKx6Z` |
| **Onboarding V2 (12-step)** | Welcome, Problem Acknowledgment, Q1-Q6, Building Plan, Plan Preview, Commitment, Paywall (x2 modes) | `2xf3X`–`7P0N0` (dark), `BoFy7`–`BWL4i` (light) |

### Design ↔ Code Comparison

| Design Screen | Code Implementation | Match Status |
|---------------|-------------------|--------------|
| **Home — Dark/Light** | `app/(tabs)/index.tsx` | ⚠️ PARTIAL — Design has sparkle decorations, status bar, tab bar, content area. Code may differ in layout. |
| **Splash — Dark/Light** | `app/splash.tsx` | ✅ LIKELY MATCH — Both use gradient backgrounds with minimal content. |
| **Onboarding 1-3** | `app/onboarding.tsx` (steps 1-3) | ⚠️ CHECK — Original 3-screen onboarding may be superseded by V2 12-screen flow. |
| **Onboarding V2 (12 screens)** | `app/onboarding.tsx` (13 steps) | ⚠️ MISMATCH — Design has 12 screens, code has 13 steps. Need to verify 1:1 mapping. |
| **Sign In / Sign Up** | `app/auth/login.tsx` | ⚠️ CHECK — Design has separate sign-in and sign-up screens; verify code matches both. |
| **Room Detail — Dark/Light** | `app/room/[id].tsx` | ⚠️ CHECK — Verify task cards, progress bars, and layout match design. |
| **AI Analysis Scan** | `app/analysis.tsx` | ⚠️ CHECK — Scanning animation and progress may differ. |
| **Analysis Results — Dark/Light** | `app/analysis.tsx` (results state) | ⚠️ CHECK — Results layout, task list presentation. |
| **Progress Overview — Light** | `app/(tabs)/progress.tsx` | ⚠️ CHECK — Charts, stats, streaks layout. |
| **Achievements — Light/Dark** | `app/achievements.tsx` | ⚠️ CHECK — Badge grid, unlock animations. |
| **Profile — Dark/Light** | `app/(tabs)/profile.tsx` | ⚠️ CHECK — Avatar, stats, settings links. |
| **Settings — Dark/Light** | `app/settings.tsx` | ⚠️ CHECK — Toggle groups, section headers. |
| **Paywall — Dark/Light** | `app/paywall.tsx` | ⚠️ CHECK — Pricing tiers, feature list, CTA. |
| **Social — Dark/Light** | `app/social.tsx` or tab | ⚠️ CHECK — Challenge cards, friend list. |
| **Accountability — Dark/Light** | `app/accountability.tsx` | ⚠️ PARTIAL — Design exists for both modes; code is minimal. |

### Design Gaps (Screens NOT in Pencil)

| Missing from Design | Exists in Code | Impact |
|-------------------|----------------|--------|
| Camera/Photo capture screen | `app/camera.tsx` | HIGH — No design reference for 49KB complex screen |
| Notification permission screen | `app/notification-permission.tsx` | MEDIUM — Built without design spec |
| Focus mode screen | `context/FocusContext.tsx` | MEDIUM — No design for Pomodoro timer UI |
| Insights screen | `app/insights.tsx` | LOW — Built but no design spec |
| Challenge detail screen | `app/challenge/[id].tsx` | MEDIUM — No design for viewing/joining challenges |
| Collection/Collectibles screen | Referenced in code | LOW — No design for collectibles gallery |
| Mascot customization | Referenced in features | LOW — No design for post-onboarding mascot editing |

### Code Gaps (Screens in Pencil but NOT fully implemented)

| Design Exists | Code Status | Gap |
|--------------|-------------|-----|
| Accountability — Dark/Light | Minimal UI stub | Partner search, nudge workflow missing |
| Social — Dark/Light | Navigation exists | Activity feed, friend suggestions missing |
| Onboarding V2 12-step | 13-step in code | Step count mismatch; verify mapping |

### Design System Observations

**From the Pencil file:**
- **No reusable components defined** — Each screen is a standalone frame with no shared design system components (buttons, cards, inputs are duplicated per screen)
- **Consistent color palette:** Dark backgrounds use `#0A0A0A`–`#141414` gradient; Light uses `#F8F8F8`–`#FAFAFA` gradient
- **Home screen details:** Status bar at top (62px), content area with 24px horizontal padding, 12px gap, tab bar at bottom (88px), decorative sparkle icons
- **Frame size:** All screens are 390x844 (iPhone 14 Pro dimensions)

### Recommendations for Design-Code Alignment

1. **HIGH: Create Pencil designs for Camera screen** — The camera/photo capture flow is the most complex screen (49KB) with no design reference
2. **HIGH: Verify Onboarding V2 step mapping** — 12 design screens vs 13 code steps needs reconciliation
3. **MEDIUM: Create reusable components in Pencil** — Buttons, cards, inputs are duplicated. Extract into a design system frame for consistency
4. **MEDIUM: Design Focus Mode screen** — Pomodoro timer has no visual spec
5. **MEDIUM: Design Challenge Detail screen** — Social feature needs design reference
6. **LOW: Design Notification Permission screen** — Already built but should be spec'd
7. **LOW: Design Collection/Collectibles screen** — Gamification feature needs visual spec
