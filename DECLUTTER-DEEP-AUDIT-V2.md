# DECLUTTER APP — DEEP AUDIT V2

**Date:** 2026-03-20
**Scope:** Every screen, every backend function, every service, every integration loop
**Total Issues Found:** ~170 (22 Critical, 50+ High, 56+ Medium, 40+ Low)

---

## TABLE OF CONTENTS

1. [Critical Issues — Fix These First](#1-critical-issues)
2. [Frontend & UX Issues](#2-frontend--ux-issues)
3. [Backend & Security Issues](#3-backend--security-issues)
4. [Services & Integration Issues](#4-services--integration-issues)
5. [The 6 Integration Loops — Status Check](#5-the-6-integration-loops)
6. [Priority Fix Roadmap](#6-priority-fix-roadmap)

---

## 1. CRITICAL ISSUES

These 22 issues will cause crashes, data loss, cheating, or invisible features. Fix them before shipping.

### 1.1 ZERO PRODUCTION OBSERVABILITY

| # | Issue | File | Lines |
|---|-------|------|-------|
| 1 | **Sentry never initialized** — `initSentry()` is never called anywhere. Zero crash reporting in production. | `services/sentry.ts` | — |
| 2 | **SentryWrap never used** — The error boundary wrapper is exported but never wraps the root component. | `services/sentry.ts` | — |
| 3 | **Logger silently swallows ALL production errors** — `logger.error` calls `captureException` which checks `if (!initialized) return` and drops everything. | `services/logger.ts` | 12-23 |

### 1.2 DATA INTEGRITY

| # | Issue | File | Lines |
|---|-------|------|-------|
| 4 | **`deleteRoom` never syncs to Convex** — Room is deleted locally but persists in cloud. On next hydration, deleted rooms resurrect. | `context/DeclutterContext.tsx` | 544-547 |
| 5 | **`sync.replaceUserState` uses `v.any()` for almost all arguments** — Completely bypasses Convex argument validation. Client can send any data structure. | `convex/sync.ts` | 196-204 |
| 6 | **`replaceUserState` allows stat manipulation** — Despite caps, client can sync `xp: 999999`, `level: 1000`, `totalTasksCompleted: 100000`. | `convex/sync.ts` | 233-259 |
| 7 | **Synced `collectedItems` reference old IDs** — After sync, `roomId`/`taskId` point to non-existent documents. | `convex/sync.ts` | 321-329 |

### 1.3 CHEATING VECTORS (Public Mutations That Should Be Internal)

| # | Issue | File |
|---|-------|------|
| 8 | **`stats.upsert`** — Client can set `xp: 999999`, `currentStreak: 3650`, any stat | `convex/stats.ts` |
| 9 | **`stats.grantStreakFreezes`** — Client can give themselves unlimited streak freezes | `convex/stats.ts` |
| 10 | **`badges.unlock`** — Client can unlock ANY badge without earning it | `convex/badges.ts` |
| 11 | **`collection.updateStats`** — Client can set `legendaryCount: 9999` | `convex/collection.ts` |
| 12 | **`leaderboard.updateWeeklyXP`** — Client can inflate leaderboard position | `convex/leaderboard.ts` |
| 13 | **`notifications.sendPushNotification`** — Public action, can spam Expo push service | `convex/notifications.ts` |
| 14 | **`variableRewards.checkForReward`** — Deprecated but public, causes double rewards | `convex/variableRewards.ts` |

### 1.4 INVISIBLE FEATURES

| # | Issue | File | Impact |
|---|-------|------|--------|
| 15 | **`pendingCelebration` never read by UI** — Badges are earned but celebration modal never shows | `DeclutterContext.tsx` | Badge celebrations invisible |
| 16 | **`optimizeTaskOrder` never called** — The learning system's primary output is dead code | `services/taskOptimizer.ts` | Task personalization broken |
| 17 | **`getFilteredTasks` never called** — Energy/time filtering is fully built but unwired | `services/ai.ts` | ADHD-core feature dead |
| 18 | **`shouldShowComebackFlow` never called** — No gate for comeback welcome screen | `services/comebackEngine.ts` | Comeback UX ungated |
| 19 | **Task optimizer profile never syncs to cloud** — All learning lost on device change | `services/taskOptimizer.ts` | Learning data ephemeral |
| 20 | **`clearTaskHistory` not called during data reset** — Stale learning data survives account reset | `DeclutterContext.tsx` | Data hygiene broken |

### 1.5 NAVIGATION & DISPLAY

| # | Issue | File | Lines |
|---|-------|------|-------|
| 21 | **Ghost "progress" tab** — TAB_CONFIG references `progress` but no `progress.tsx` exists. Tab will 404. | `app/(tabs)/_layout.tsx` | 26, 181 |
| 22 | **XP_PER_LEVEL mismatch** — Profile shows 100 XP/level, Achievements shows 500 XP/level. Users see different levels on different screens. | `profile.tsx` line 37, `achievements.tsx` line 36 | — |

---

## 2. FRONTEND & UX ISSUES

### 2.1 HIGH Severity

| # | Screen | Issue | Lines |
|---|--------|-------|-------|
| 1 | `analysis.tsx` | 6+ `as any` casts on AI response — TypeScript bypassed, runtime crashes lurk | 173, 235, 257-261, 274, 322-326 |
| 2 | `analysis.tsx` | `generateFallbackTasks` called but may not be imported — crash when AI fails | 247 |
| 3 | `index.tsx` | `comebackData` useEffect has empty deps `[]` but reads async `stats` — comeback check may never fire | 161-174 |
| 4 | `index.tsx` | 4 hardcoded `useScalePress` calls — rooms capped at 4 animated cards | 194-198 |
| 5 | `room/[id].tsx` | Phase classification (client-side) disagrees with AI's `phase` field — tasks in wrong tabs | 74-81 |
| 6 | `blitz.tsx` | `rooms` accessed without null check — crash if rooms is undefined | 142 |
| 7 | `blitz.tsx` | Task index race after completion — off-by-one between toggleTask and memo recalculation | 263-273 |
| 8 | `focus.tsx` | XP displayed but never actually awarded — `stats` not updated on focus completion | 396 |
| 9 | `task-detail.tsx` | "Break down further" and "Change time estimate" both show "Coming Soon" alerts | 223-238 |
| 10 | `task-customize.tsx` | Task Detail Level slider is purely decorative — thumb doesn't move | 213-224 |
| 11 | `insights.tsx` | Weekly chart is fabricated — tasks evenly distributed across 7 days, not real dates | 251-270 |
| 12 | `insights.tsx` | Time period selector (week/month/year) does NOTHING — no data filtering | 210, 369-396 |
| 13 | `insights.tsx` | `stats.totalTasksCompleted` accessed without null check — crash risk | 225, 229-233 |
| 14 | `insights.tsx` | `ProgressRing` math is wrong for > 50% progress | 173-186 |
| 15 | `room-complete.tsx` | After photo falls back to before photo — meaningless before/after comparison | 107 |
| 16 | `_layout.tsx` | Duplicate notification response listeners — both fire for same notification | 53-78, 166-188 |
| 17 | `index.tsx` (root) | Convex query with no timeout — infinite spinner if Convex is slow/offline | 22-24, 27 |
| 18 | `single-task.tsx` | Timer always 15 minutes regardless of task count or user preference | 27, 84 |
| 19 | `collection.tsx` | `stats.totalTasksCompleted` accessed without null check — crash | 107-108 |
| 20 | `useRevenueCat.ts` | API keys from `process.env` with empty string fallback — silent failure | 33-34 |

### 2.2 MEDIUM Severity

| # | Screen | Issue |
|---|--------|-------|
| 1 | `camera.tsx` | Variable `t` shadows theme variable with `user?.timeAvailability` |
| 2 | `camera.tsx` | No loading indicator during `takePictureAsync` — double-tap risk |
| 3 | `camera.tsx` | Permission screen CTA priorities inverted (Gallery primary, Camera secondary) |
| 4 | `index.tsx` | `todayTasksDone` arbitrarily capped at 10 — magic number |
| 5 | `rooms.tsx` | `isLoading` check race with `rooms ?? []` default |
| 6 | `profile.tsx` | Mascot hunger bar green=full but semantics inverted (hunger = bad) |
| 7 | `profile.tsx` | No ErrorBoundary wrapper |
| 8 | `analysis.tsx` | Detection overlay positions are fake (`top: 20 + i * 20%`) — overflow at 5+ areas |
| 9 | `room/[id].tsx` | `comboCount` stale closure — heavy haptic fires one completion late |
| 10 | `single-task.tsx` | Phase bars max at 5 — no indication of remaining tasks |
| 11 | `single-task.tsx` | XP hardcoded `completedCount * 10` — ignores comeback multiplier |
| 12 | `blitz.tsx` | Empty state "Scan New Room" uses fragile `setTimeout(100ms)` navigation |
| 13 | `blitz.tsx` | Focus view progress count inaccurate after skipping |
| 14 | `focus.tsx` | `activeRoom.emoji` may be undefined on older rooms |
| 15 | `focus.tsx` | Break reminder fires only once per session |
| 16 | `session-complete.tsx` | Subtitle hardcodes "15-minute blitz" regardless of session type |
| 17 | `session-complete.tsx` | `completedTaskTitles` may grab tasks from previous sessions |
| 18 | `achievements.tsx` | Badge grid limited to 8 — extras silently hidden |
| 19 | `achievements.tsx` | Placeholder badges shown as "Earned" when no real badges exist |
| 20 | `insights.tsx` | Streak change hardcoded as `+15%` — fake data |
| 21 | `insights.tsx` | Pull-to-refresh fakes a network request with setTimeout |
| 22 | `mascot.tsx` | XP bar can exceed 100% width — layout overflow |
| 23 | `mascot.tsx` | "Clean together" navigates to focus without setting activeRoom |
| 24 | `paywall.tsx` | `navigateIntoApp` always routes to `/(tabs)` — loses previous location |
| 25 | `paywall.tsx` | `isPurchasing` not reset on success path |
| 26 | `settings.tsx` | Focus mode setting casts `as any` |
| 27 | `today-tasks.tsx` | "Start 15-Min Blitz" CTA routes to `/single-task` not `/blitz` |
| 28 | 3+ files | `Dimensions.get('window')` at module level — stale on rotation |
| 29 | `room-complete.tsx` | XP counter uses JS setInterval@16ms instead of Reanimated |

### 2.3 DESIGN SYSTEM INCONSISTENCIES

| Components Using OLD System | Components Using V1 Tokens |
|----|-----|
| `SessionCheckIn.tsx` (`Colors`, `Typography`, `Spacing`) | `DoomPileCard.tsx` |
| `TaskCard.tsx` (`ColorTokens`, `EnergyColors`) | Home screen |
| `ErrorBoundary.tsx` (`Colors`) | Profile screen |
| `social.tsx` (mixed) | Room detail |
| `accountability.tsx` (mixed) | Settings |
| `join.tsx` (`TouchableWithoutFeedback` — deprecated) | Blitz (now fixed) |

No shared typography scale — font sizes are ad-hoc across 30+ files (10, 11, 12, 13, 14, 15, 16, 17, 20, 22, 24, 28, 32, 48, 56 all hardcoded).

---

## 3. BACKEND & SECURITY ISSUES

### 3.1 CRITICAL

| # | Issue | File | Lines |
|---|-------|------|-------|
| 1 | **Gemini rate limit TOCTOU race** — Read + increment are not atomic. Two concurrent calls can both pass the limit check. | `convex/gemini.ts` | 507-528 |
| 2 | **`stats.upsert` allows arbitrary stat values from client** — No server validation | `convex/stats.ts` | 38-107 |
| 3 | **`grantStreakFreezes` is PUBLIC** — Any user can give themselves unlimited freezes | `convex/stats.ts` | 807-836 |
| 4 | **`sendPushNotification` is PUBLIC** — Can spam Expo push service with no rate limit | `convex/notifications.ts` | 220-291 |
| 5 | **`checkInactiveUsers` only processes first 200 users** — Always checks same 200 users by creation order, never reaches newer users | `convex/notifications.ts` | 167 |

### 3.2 HIGH

| # | Issue | File |
|---|-------|------|
| 1 | **Base64 image has no size limit** — 100MB+ payload can flow through | `convex/gemini.ts` line 486 |
| 2 | **`analyzeProgress` has NO rate limiting** — Burns API quota | `convex/gemini.ts` |
| 3 | **`getMotivation` has NO rate limiting** | `convex/gemini.ts` |
| 4 | **`decrementTask` reduces streak on undo** — Streaks are daily, not per-task | `convex/stats.ts` |
| 5 | **`incrementRoom` bypasses daily XP cap** — Adds 50 XP directly | `convex/stats.ts` |
| 6 | **`incrementTask` bypasses `addXp` daily cap** — `xpEarnedToday` never updated | `convex/stats.ts` |
| 7 | **`badges.unlock` is PUBLIC** — Client can unlock any badge | `convex/badges.ts` |
| 8 | **`longComeback` badge logic is broken** — `daysSinceActivity` is always 0 when checked | `convex/badges.ts` line 149 |
| 9 | **`updateChallengeProgress` accepts arbitrary progress** — Instant challenge completion | `convex/social.ts` |
| 10 | **`incrementMyProgress` scans ALL active challenges** — O(n) on every task completion | `convex/social.ts` |
| 11 | **`collection.updateStats` is PUBLIC** — Arbitrary collection counts | `convex/collection.ts` |
| 12 | **`leaderboard.updateWeeklyXP` is PUBLIC** — Inflate leaderboard | `convex/leaderboard.ts` |
| 13 | **Leaderboard promotion/relegation never actually applied** — Flags recorded but league doesn't change | `convex/leaderboard.ts` |
| 14 | **`deleteAccount` infinite loop potential** — `while(hasMore)` on challenge cleanup | `convex/users.ts` |
| 15 | **`mascots.update` allows arbitrary level/xp/stats** — No validation | `convex/mascots.ts` |
| 16 | **`variableRewards.checkForReward` double-reward risk** — Deprecated but public | `convex/variableRewards.ts` |
| 17 | **No subscription verification in most backend functions** — Only `analyzeRoom` checks | Backend-wide |
| 18 | **Timezone inconsistency** — Mix of UTC and local time across date calculations | Backend-wide |

### 3.3 MEDIUM

| # | Issue | Category |
|---|-------|----------|
| 1 | `mood`/`activity` on mascots accept arbitrary strings | Validation |
| 2 | Task `category`/`energyRequired`/`decisionLoad` are `v.string()` not enums | Validation |
| 3 | `challenges.participants` as embedded array — no index possible | Performance |
| 4 | `variableRewards` missing composite index on `taskNumber` | Performance |
| 5 | `rooms.update` allows arbitrary `messLevel`, `aiSummary` — no sanitization | Validation |
| 6 | Photo `uri` accepts arbitrary strings — could be malicious URLs | Security |
| 7 | Photo MIME type never validated | Security |
| 8 | `accountabilityPartners.createPair` sets `partnerId: userId` placeholder | Data integrity |
| 9 | `addConnection` allows self-connection | Validation |
| 10 | `listChallenges` caps at 200, may miss user's challenges | Scaling |
| 11 | `isConfigured` query exposes env var existence | Information disclosure |
| 12 | `sanitizeInput` is incomplete — doesn't handle URL-encoded entities, nested tags | Security |
| 13 | `sanitizeInput` not used consistently — many mutations skip it | Security |
| 14 | No global rate limiting on mutations | Security |
| 15 | Missing cron: challenge expiration | Data cleanup |
| 16 | Missing cron: old leaderboard cleanup | Data cleanup |
| 17 | `settings.focusDefaultDuration` has no range validation | Validation |
| 18 | `createMany` (tasks, subtasks) has no array size limit | DoS risk |
| 19 | `activityLog.recordDailyActivity` accepts arbitrary increment values | Cheating |
| 20 | `deleteAccount` does not revoke auth sessions | Security |

---

## 4. SERVICES & INTEGRATION ISSUES

### 4.1 Dead Code — Exported But Never Imported

| Function | File | Severity |
|----------|------|----------|
| `optimizeTaskOrder` | `services/taskOptimizer.ts` | **CRITICAL** — primary learning output |
| `getFilteredTasks` | `services/ai.ts` | **CRITICAL** — energy/time filtering |
| `shouldShowComebackFlow` | `services/comebackEngine.ts` | **CRITICAL** — comeback UX gate |
| `getPrimaryStatsDisplay` | `services/comebackEngine.ts` | HIGH — cumulative stats display |
| `getSecondaryStatsDisplay` | `services/comebackEngine.ts` | HIGH — philosophy: sessions > streaks |
| `formatGracePeriodBadge` | `services/comebackEngine.ts` | HIGH — grace period UI |
| `getGracePeriodTimeRemaining` | `services/comebackEngine.ts` | HIGH — grace period UI |
| `findTinyTasksFromRooms` | `services/comebackEngine.ts` | HIGH — personalized tiny tasks |
| `getPersonalizedEncouragement` | `services/taskOptimizer.ts` | HIGH — adapted encouragement |
| `suggestSessionDuration` | `services/taskOptimizer.ts` | HIGH — optimal session length |
| `clearTaskHistory` | `services/taskOptimizer.ts` | HIGH — data cleanup |
| `getPhotoQualityFeedback` | `services/ai.ts` | MEDIUM — photo quality UI |
| `analyzeProgressStructured` | `services/ai.ts` | MEDIUM — structured progress |
| `getMotivationMessage` | `services/ai.ts` | LOW — simpler wrapper |
| `getProviderInfo` | `services/ai.ts` | LOW — dead code |
| `getOneTinyThingOptions` | `services/comebackEngine.ts` | MEDIUM — multi-option tasks |
| `apiRateLimiter` | `services/secureStorage.ts` | HIGH — rate limiting unused |
| `saveApiKeySecure`/`loadApiKeySecure`/`deleteApiKeySecure` | `services/secureStorage.ts` | LOW — orphaned |
| `startSession`/`endSession` | `DeclutterContext.tsx` | HIGH — CleaningSession dead code |
| `notifyBadgeUnlocked`/`notifyLevelUp`/`notifyRoomComplete` | `services/notifications.ts` | HIGH — never called |
| `notifyWelcomeBack`/`notifyComebackBonus`/`notifyGracePeriodActive` | `services/notifications.ts` | HIGH — never called |

### 4.2 Duplicate Systems

| System A | System B | Issue |
|----------|----------|-------|
| Comeback messages (`comebackEngine.ts`) | Notification messages (`notifications.ts`) | Two parallel message systems that can drift |
| `DeclutterContext` (imperative Convex) | `useConvex.ts` hooks (reactive Convex) | Two data flow architectures. Social features bypass DeclutterContext entirely. |
| `useSubscription.ts` | `useRevenueCat.ts` | Two subscription hooks (thin wrapper + full implementation) |
| `checkSubscriptionStatus` (standalone) | `updateSubscriptionState` (in useRevenueCat) | Nearly identical logic duplicated |
| `SubscriptionStatus` type in `types/declutter.ts` | `SubscriptionStatus` type in `useRevenueCat.ts` | Duplicated type definitions |

### 4.3 Key Integration Bugs

| # | Issue | Severity |
|---|-------|----------|
| 1 | `recordTaskCompletion` always receives `actualMinutes: undefined` — time learning never works | HIGH |
| 2 | `hydrateTask` hardcodes `decisionPoints: undefined` — decision support data destroyed on cloud round-trip | HIGH |
| 3 | Today's tasks "tiny thing" reshuffles randomly on every room state change | HIGH |
| 4 | "One Tiny Thing" tasks have `roomId: ''` — cannot be completed through normal flow | HIGH |
| 5 | Double `Notifications.setNotificationHandler` calls conflict | HIGH |
| 6 | No RevenueCat plugin in `app.json` — may crash on EAS builds | HIGH |
| 7 | Fallback task IDs are static ('fallback-1') — collide across rooms | MEDIUM |
| 8 | `addRoom` returns before Convex confirms — ID mismatch possible | MEDIUM |
| 9 | XP calculation duplicated in `toggleTask` — can drift | MEDIUM |
| 10 | Mascot fed on every task completion — trivially saturated | LOW |

---

## 5. THE 6 INTEGRATION LOOPS

### Loop 1: Local State <-> Cloud Sync
**STATUS: PARTIALLY BROKEN**
- Hydration works, sync works for most data
- `deleteRoom` never syncs (CRITICAL)
- Task optimizer profile never syncs (CRITICAL)
- `clearAllData` doesn't clear optimizer keys (HIGH)
- Social features bypass DeclutterContext entirely (MEDIUM)

### Loop 2: AI Photo -> Task Generation -> Display
**STATUS: WORKS BUT MISSING LAST MILE**
- Photo -> Gemini -> tasks works end-to-end
- `getFilteredTasks` (energy filtering) never called (CRITICAL)
- `optimizeTaskOrder` (personalized ordering) never called (CRITICAL)
- Photo quality feedback never shown (HIGH)
- User profile IS passed to AI via `additionalContext` string (WORKS)

### Loop 3: Task Completion -> Stats -> Badges -> Rewards
**STATUS: MOSTLY WORKS, CELEBRATION BROKEN**
- Stats update: WORKS
- Badge check: WORKS (badges are detected)
- Badge celebration: BROKEN (`pendingCelebration` never rendered)
- Badge notifications: BROKEN (never called)
- Variable rewards: WORKS (every 3rd task)
- Variable reward claim UI: UNCERTAIN (may not be wired)

### Loop 4: Comeback Engine -> Notifications -> Re-engagement
**STATUS: PARTIALLY WIRED**
- Comeback multiplier: WORKS
- Welcome back message: PARTIALLY WORKS
- Comeback flow gate: MISSING (`shouldShowComebackFlow` unused)
- Grace period UI: MISSING
- Cumulative stats display: MISSING
- Basic nudge notification: WORKS (via `scheduleComebackNudge`)
- Achievement notifications: BROKEN (never called)

### Loop 5: Task Optimizer -> Profile -> AI Context
**STATUS: BARELY FUNCTIONAL**
- `recordTaskCompletion` called: YES (but `actualMinutes` always undefined)
- Profile built from history: YES
- Profile sent to AI: YES (as free text)
- Profile used to reorder tasks: NO (`optimizeTaskOrder` dead)
- Profile synced to cloud: NO
- Profile cleared on reset: NO

### Loop 6: RevenueCat -> Paywall -> Feature Gates
**STATUS: WORKS FOR ROOMS ONLY**
- Room creation gated: YES (3 rooms free)
- Other features gated: NO
- Missing RevenueCat plugin in app.json: RISK
- Paywall purchase flow: WORKS

---

## 6. PRIORITY FIX ROADMAP

### TIER 1 — Ship Blockers (Do Before Any Build)

| # | Fix | Impact | Effort |
|---|-----|--------|--------|
| 1 | **Initialize Sentry** — Call `initSentry()` in `_layout.tsx`, wrap root with `SentryWrap`, set user on auth | Production visibility | Low |
| 2 | **Fix ghost "progress" tab** — Rename to match actual file or create the file | Navigation crash | Low |
| 3 | **Fix XP_PER_LEVEL** — Pick one value (500) and use it everywhere | User confusion | Low |
| 4 | **Make 7 public mutations internal** — `stats.upsert`, `stats.grantStreakFreezes`, `badges.unlock`, `collection.updateStats`, `leaderboard.updateWeeklyXP`, `variableRewards.checkForReward`, `notifications.sendPushNotification` | Cheating prevention | Medium |
| 5 | **Fix `deleteRoom` to sync to Convex** — Add `convex.mutation(api.rooms.remove)` call | Data integrity | Low |
| 6 | **Fix Gemini rate limit race** — Move check+increment into single mutation | API abuse | Medium |
| 7 | **Add RevenueCat plugin to app.json** — Required for EAS builds | Build crash | Low |
| 8 | **Fix placeholder App Store ID** in settings rate URL | Crash on tap | Low |
| 9 | **Remove duplicate `setNotificationHandler`** — Keep one in `_layout.tsx` | Notification conflict | Low |

### TIER 2 — Core Feature Wiring (Do This Week)

| # | Fix | Impact | Effort |
|---|-----|--------|--------|
| 10 | **Wire `optimizeTaskOrder`** into room/[id].tsx task display | Close learning loop | Medium |
| 11 | **Wire `getFilteredTasks`** based on energy level before displaying | Core ADHD feature | Medium |
| 12 | **Build badge celebration modal** reading `pendingCelebration` | Badge engagement visible | Medium |
| 13 | **Call `notifyBadgeUnlocked`/`notifyLevelUp`** when earned | Achievement notifications | Low |
| 14 | **Fix `hydrateTask` to preserve `decisionPoints`** | Decision support data | Low |
| 15 | **Wire `shouldShowComebackFlow`** in home screen | Proper comeback UX | Low |
| 16 | **Display grace period badge** using `formatGracePeriodBadge` | Streak protection visible | Low |
| 17 | **Sync task optimizer profile to Convex** | Learning survives device change | Medium |
| 18 | **Fix Today's Tasks tiny thing stability** — Memoize random selection per day | Stable daily list | Low |
| 19 | **Fix Today's Tasks tiny thing roomId** — Make completable or clearly separate | UX consistency | Low |
| 20 | **Pass `actualMinutes` to `recordTaskCompletion`** — Track elapsed time | Time learning works | Medium |

### TIER 3 — Backend Hardening (Do This Month)

| # | Fix | Impact | Effort |
|---|-----|--------|--------|
| 21 | **Add rate limiting to `analyzeProgress`/`getMotivation`** | API quota protection | Medium |
| 22 | **Add base64 image size limit** in `gemini.analyzeRoom` | DoS prevention | Low |
| 23 | **Fix `incrementTask`/`incrementRoom` to respect daily XP cap** | Fair XP system | Medium |
| 24 | **Fix leaderboard promotion/relegation** to actually take effect | Leaderboard works | Medium |
| 25 | **Fix `checkInactiveUsers`** to paginate properly | All users get nudges | Medium |
| 26 | **Add challenge expiration cron** | Dead challenges cleaned | Low |
| 27 | **Fix timezone consistency** — Standardize on UTC everywhere | Correct streaks | Medium |
| 28 | **Type `sync.replaceUserState` args properly** instead of `v.any()` | Data validation | High |
| 29 | **Fix `decrementTask` streak logic** — Don't reduce daily streak on task undo | Correct streaks | Low |
| 30 | **Validate `rooms.update` numeric ranges and sanitize `aiSummary`** | Data integrity | Low |

### TIER 4 — UX Polish (Do Before Launch)

| # | Fix | Impact | Effort |
|---|-----|--------|--------|
| 31 | **Fix insights weekly chart** — Use actual completion dates, not fabricated distribution | Real analytics | High |
| 32 | **Fix insights time period filter** — Actually filter data by period | Feature works | Medium |
| 33 | **Fix insights ProgressRing** — Correct math for > 50% | Visual accuracy | Low |
| 34 | **Fix focus mode XP** — Actually award XP on session complete | Reward focus use | Low |
| 35 | **Fix task-customize slider** — Make it interactive or remove it | Not decorative | Medium |
| 36 | **Fix task-detail "Break down"/"Change time"** — Implement or remove | No dead-end CTAs | High |
| 37 | **Fix room-complete after-photo fallback** — Show empty state instead of before photo | Honest UX | Low |
| 38 | **Fix single-task timer** — Configurable, not always 15 min | Matches user need | Low |
| 39 | **Remove `as any` casts in analysis.tsx** — Properly type AI response | Type safety | Medium |
| 40 | **Unify design system** — Migrate SessionCheckIn, TaskCard, ErrorBoundary to V1 tokens | Visual consistency | Medium |
| 41 | **Add null checks** — `stats`, `rooms`, `collectionStats` in insights, collection, blitz | Crash prevention | Low |
| 42 | **Wire `clearTaskHistory`** into `clearAllData` | Clean data reset | Low |
| 43 | **Fix today-tasks.tsx** — "Start Blitz" should route to `/blitz` not `/single-task` | Correct navigation | Low |
| 44 | **Remove dead CleaningSession code** — `startSession`/`endSession` unused | Code cleanup | Low |

---

## FINAL ASSESSMENT

**What's genuinely good:**
- Gemini prompt is best-in-class for cleaning task generation
- Comeback engine philosophy (shame-free, cumulative) is thoughtful
- Badge system is properly server-validated with dedup
- Variable rewards fire correctly on every 3rd task
- Cloud sync architecture with local-first + background push is solid
- Room freshness decay system (newly added) is well-designed
- React Compiler enabled for free performance gains

**What's fundamentally broken:**
- 7 public mutations allow any client to cheat all gamification
- Zero production observability (Sentry never initialized)
- The learning system (`taskOptimizer`) builds a profile but never uses it to reorder tasks
- Energy/time task filtering exists but is never called
- Badge celebrations are computed but never displayed
- Deleted rooms come back from the dead
- Half the comeback engine's output functions are dead code
- Insights screen shows fabricated data

**Bottom line:** The infrastructure is impressive — the RIGHT systems are built. But roughly 40% of the wiring between systems is missing. Functions are exported that nobody imports. State is set that nobody reads. The app has a "90% complete" problem: every feature is almost done, but the last 10% (the wiring) is what makes it actually work. Focus on Tier 1 and Tier 2 fixes — they're mostly low-effort wiring that connects systems that already exist.
