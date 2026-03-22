# Declutter v1 Launch Readiness Audit

**Date:** 2026-03-18
**Verdict:** 🔴 NOT READY — ~2-3 focused sprints to launch-worthy

---

## Executive Summary

The app has a solid foundation — the services layer is production-grade, the AI integration is well-architected (server-side keys, rate limiting, fallbacks), and the core camera→analysis→tasks flow works. But there are **crash-causing bugs**, **missing error boundaries**, **race conditions**, and **significant design-to-code gaps** that would sink user retention on day one.

The Pencil designs show **79 unique screens** across dark/light mode. The codebase implements roughly **36 screens**, but many are incomplete or diverge from the designs. Several critical "delight" screens (empty states, error states, celebration moments) that make ADHD users feel safe are designed but not implemented.

---

## Table of Contents

1. [CRITICAL — Ship Blockers](#1-critical--ship-blockers)
2. [HIGH — Will Lose Users](#2-high--will-lose-users)
3. [MEDIUM — Polish & Quality](#3-medium--polish--quality)
4. [Design vs Code Gap Analysis](#4-design-vs-code-gap-analysis)
5. [Backend Completeness](#5-backend-completeness)
6. [User Flow Audit](#6-user-flow-audit)
7. [ADHD-Specific UX Issues](#7-adhd-specific-ux-issues)
8. [Security Checklist](#8-security-checklist)
9. [Build & Config Issues](#9-build--config-issues)
10. [Recommended Launch Sprint Plan](#10-recommended-launch-sprint-plan)

---

## 1. CRITICAL — Ship Blockers

These will crash the app, corrupt data, or expose security holes. **Must fix before any external user touches this.**

### 1.1 Race Conditions That Corrupt Data

| File | Issue | Impact |
|------|-------|--------|
| `app/analysis.tsx` | `addRoom()`, `setTasksForRoom()`, `addPhotoToRoom()` called sequentially without awaiting. Tasks can attach to wrong room. | AI scan results assigned to wrong room. Data corruption. |
| `app/room/[id].tsx:106-130` | `toggleTask()` fires, then `setTimeout` navigates to room-complete. If toggle hasn't finished, completion screen shows stale data. | User sees wrong task count on celebration screen. |
| `app/blitz.tsx:127-146` | `completedCountRef` and `remainingSecondsRef` can hold stale values when navigation fires. | Blitz session stats saved incorrectly. |

### 1.2 Crash-Causing Missing Error Handling

| File | Issue | Impact |
|------|-------|--------|
| `app/social.tsx` | `getMyChallenges()` and `getConnections()` called without try-catch. | Network hiccup → white screen crash. |
| `app/challenge/[id].tsx:71-86` | Challenge loading has no timeout or error fallback. | Slow connection → infinite spinner, user stuck. |
| No error boundaries on route screens. | Single error anywhere crashes entire tab/navigation stack. | One bad API response kills the whole app. |
| `app/camera.tsx` | No handler for `takePictureAsync` failure (memory, hardware). | Camera crash on older devices. |

### 1.3 Security: Unauthorized Data Access

| File | Issue | Impact |
|------|-------|--------|
| `app/room/[id].tsx` | Room loaded by ID from URL params — no ownership check on client. | Users can view other users' rooms via deep link. |
| `app/challenge/[id].tsx:49-54` | Challenge loaded by ID — no access validation. | Any user can view any challenge. |
| `convex/social.ts:196-204` | `listChallenges` scans ALL active challenges without pagination. `.take(200)` on unbounded query. | Performance degradation at scale; potential read limit exhaustion. |

### 1.4 Auth State Bug

| File | Issue | Impact |
|------|-------|--------|
| `app/index.tsx:22-26` | Checks both local `user.onboardingComplete` AND cloud `cloudUser.onboardingComplete` without clear precedence. | If they disagree, user gets routed to wrong screen. Infinite redirect loop possible. |

### 1.5 Backend: Badge Unlock Never Triggers

| File | Issue | Impact |
|------|-------|--------|
| `convex/badges.ts:84-172` | `checkAndUnlock` checks stats but is never called after task completion. | Users earn badges but never receive them. Core gamification broken. |

### 1.6 Backend: Comeback XP Multiplier Never Applied

| File | Issue | Impact |
|------|-------|--------|
| `convex/stats.ts:553-587` | Comeback multiplier calculated and stored but never multiplied against XP gain (always 10 XP). | Returning ADHD users don't get the promised bonus. Kills re-engagement. |

---

## 2. HIGH — Will Lose Users

These won't crash the app but will make users uninstall within the first session.

### 2.1 Missing Empty States

The Pencil designs include beautiful empty states (home empty, rooms empty, progress empty) with mascot illustrations and encouraging CTAs. **None are implemented.** An ADHD user opening the app for the first time sees... nothing. No guidance, no warmth, no "here's what to do next."

**Designed but missing:**
- Home empty state (`TPr0p` in Pencil) — mascot + "Let's scan your first room!"
- Rooms empty state (`Gk8xt`) — "No rooms yet" + feature bullets
- Progress empty state (`YSufV`) — "Your journey starts here"
- Camera permission screen (`1ZBLR`) — mascot asking nicely
- AI error state (`ybRSa`) — confused mascot + "Try a different angle"

### 2.2 Missing Celebration Moments

Pencil designs include a rich **Room Complete** celebration screen (`oRx3i`) with confetti, stats, before/after photos, XP earned, and share button. The current implementation exists but is bare compared to the design.

**Session Complete** (`bcHfn`) designed with mascot, stats, room progress bar, and "Continue Cleaning" vs "I'm done for now" choice — critical for ADHD users who need permission to stop.

### 2.3 No Optimistic UI Updates

Every task toggle requires a server round-trip before the UI updates. For an ADHD user checking off tasks rapidly in a blitz session, this delay feels broken. Tasks should toggle instantly and sync in background.

### 2.4 AI Detection Overlay Missing

Pencil design `ldgnk` shows a beautiful screen where AI findings are overlaid on the room photo with colored bounding boxes — "Nightstand" (blue), "Desk clutter" (orange), "Clothes" (pink). This visual feedback is the "wow moment" of the app. **Not implemented.** The current analysis screen shows a text list instead.

### 2.5 Task Customization Screen Missing

Pencil design `6iIOk` shows a "Customize Tasks" screen where users can toggle task groups on/off, adjust detail level, and see "8 tasks selected - ~25 min." **Not implemented.** Users currently get all tasks with no choice.

### 2.6 Onboarding File is 57.6KB — Unmaintainable

`app/onboarding.tsx` is a single massive file. This isn't just a code quality issue — it means bugs here are hard to find and fix. The Pencil designs show a clean 10-12 step flow that should be separate components.

### 2.7 Push Notifications Don't Deep-Link Correctly

`app/_layout.tsx:122-128` handles notification responses but doesn't route to the correct screen. Tapping a "Time to clean!" notification should open the relevant room, not just the home screen.

### 2.8 Backend: Push Notifications Not Wired to Events

`convex/notifications.ts` can save tokens and send notifications, but no mutations trigger notifications from actual events:
- No notification on badge unlock
- No notification on challenge completion
- No notification on accountability partner nudge
- No notification on streak milestone
- Only scheduled reminders work

### 2.9 Backend: RevenueCat Sync Missing

Schema has subscription fields (`convex/schema.ts:42-56`) but there's no `syncSubscriptionStatus` or webhook handler. Premium status can't be verified server-side. The `gemini.ts` rate limiter checks `subscriptionStatus` but it's never updated from RevenueCat.

*(Note: User said they'll handle RevenueCat later, but the backend hooks need to exist for premium features to work.)*

### 2.10 Collection Stats Are Broken

`convex/collection.ts:76-90`: `uniqueCollected` is set to 1 on first collect but never incremented. Rarity counts don't deduplicate. Collection screen will show wrong numbers.

### 2.11 Backend: Variable Rewards Duplicated

Two independent systems generate rewards: `convex/stats.ts:287-334` and `convex/variableRewards.ts:52-101`. Both insert to the database independently. Users may get double rewards or inconsistent reward history.

---

## 3. MEDIUM — Polish & Quality

### 3.1 Type Safety Issues

| File | Issue |
|------|-------|
| `app/(tabs)/index.tsx:178` | `router.push('/blitz' as any)` — route type mismatch |
| `app/room/[id].tsx:118` | `router.push({...})` cast to any |
| `app/analysis.tsx:87` | No type check on return value |

### 3.2 Accessibility Gaps

- `app/(tabs)/index.tsx:179`: Pressable on header avatar has no minimum 44pt touch target
- `app/room/[id].tsx`: Phase tabs missing accessibility labels
- `app/blitz.tsx` & `app/focus.tsx`: Timer SVG rings have no accessibility label for progress %
- Multiple screens missing `accessibilityRole` and `accessibilityLabel` props

### 3.3 Animation Performance

- `app/(tabs)/_layout.tsx`: Custom TabItem creates 4 separate animated components with springs per tab. Could stutter on older devices.
- `app/session-complete.tsx` & `app/room-complete.tsx`: Confetti creates unlimited `Animated.View` components. No particle limit.

### 3.4 Settings Has No Confirmations

`app/settings.tsx`: Logout and delete account apply immediately with no confirmation dialog. Destructive actions need "Are you sure?" — the Pencil design `Q4Hte` includes a beautiful delete confirmation screen.

### 3.5 No Offline Support

All screens require active connection. No sync queue for offline task completions. ADHD users cleaning in a basement with bad signal will lose their progress.

### 3.6 Backend: Timestamp Inconsistency

Some fields use ISO strings (`lastActivityDate`), others use milliseconds (`createdAt`). Mixed date formats will cause timezone bugs and off-by-one-day errors in streak calculations.

### 3.7 Backend: Missing Indexes

| Missing Index | Impact |
|------|--------|
| `challenges.status` | Challenge queries scan full table |
| `stats.subscriptionStatus` | Subscription feature queries are slow |
| Stats comeback fields (`gracePeriodEndsAt`, etc.) | Comeback engine queries are table scans |

### 3.8 Backend: Task Dependencies Not Used

Schema has `dependencies`, `enables`, `parallelWith` fields. AI generates them. UI ignores them. Either use them to order tasks intelligently or remove the dead fields.

### 3.9 Backend: Energy/Decision Load Not Used

Schema has `energyRequired` and `decisionLoad`. AI generates these. Nothing in the app uses them to recommend tasks based on current energy. This is the killer ADHD feature — "I'm exhausted, what can I still do?" — and it's wired but not connected.

### 3.10 Backend: No Rate Limiting on Most Mutations

Only `gemini.ts` has rate limiting. Missing from: task creation, room creation, challenge creation, photo uploads. Users can spam the API.

---

## 4. Design vs Code Gap Analysis

### Screens Designed in Pencil but NOT Implemented

| Pencil Screen | Status | Priority |
|------|--------|----------|
| Home Empty State | ❌ Missing | HIGH |
| Rooms Empty State | ❌ Missing | HIGH |
| Progress Empty State | ❌ Missing | HIGH |
| Camera Permission Request | ❌ Missing (uses system dialog only) | MEDIUM |
| AI Error State (confused mascot) | ❌ Missing | HIGH |
| AI Detection Overlay (bounding boxes on photo) | ❌ Missing | HIGH |
| Task Customize Screen (toggle groups, adjust detail) | ❌ Missing | HIGH |
| Task Detail Screen (with Dusty's tip, adjust options) | ❌ Partial — missing tip card & adjust options | MEDIUM |
| Single Task Focus (large checkmark, Dusty says) | ❌ Partial — missing mascot tip integration | MEDIUM |
| Delete Account Confirmation (sad mascot) | ❌ Missing | MEDIUM |
| V1 Room Celebration (confetti, before/after, share) | ⚠️ Exists but diverges from design | HIGH |
| V1 Session Complete (mascot, continue vs done) | ⚠️ Exists but missing "I'm done for now" option | HIGH |
| Forgot Password | ⚠️ Exists but minimal vs design | LOW |

### Design System Drift

The Pencil designs show TWO generations:
1. **Original** (Groups 1-8): Refined dark aesthetic, gold accents, leaf icon
2. **V1** (Groups 9-16): Hamster mascot "Dusty", coral/salmon accent, playful

The code appears to blend both. **Decision needed:** Which design language is v1? The V1 (coral + Dusty) is more ADHD-friendly and emotionally engaging. Commit to one.

### Color Token Mismatch

V1 designs consistently use coral/salmon (#FF6B6B-ish) as the primary action color. Need to verify the code uses this consistently and doesn't mix in the older gold accent.

---

## 5. Backend Completeness

### Working ✅
- User CRUD and auth integration
- Room creation, deletion, task management
- AI room analysis via Convex actions (Gemini server-side)
- Stats tracking (streaks, XP, tasks completed)
- Leaderboard system
- Mascot state management
- Accountability pairs
- Secure photo storage
- Comeback engine (shame-free)
- Rate limiting on AI calls

### Broken 🔴
- Badge unlock never triggers after task completion
- Comeback XP multiplier calculated but never applied
- Collection stats don't track unique items correctly
- Variable rewards duplicated across two systems
- Accountability `bothActiveStreak` increments per task, not per day
- Challenge progress type mismatch (decimal vs integer)

### Missing 🟡
- RevenueCat subscription sync (webhook handler)
- Push notification triggers for events (badges, challenges, nudges)
- Email verification flow
- Task dependency ordering logic
- Energy-based task recommendations
- Visual impact task sorting
- Zone-based task filtering
- Bulk task operations
- Invite code expiration / cleanup
- Storage orphan cleanup
- Input sanitization on user-generated text (names, descriptions)
- Soft delete / archive system

---

## 6. User Flow Audit

### Flow 1: First Launch → First Scan (THE Critical Flow)

```
Splash → Onboarding (10-12 steps) → Sign Up → Notification Permission → Home
                                                                         ↓
                                                              [HOME IS EMPTY]
                                                                         ↓
                                                           Camera → Scan → Results → Room
```

**Issues:**
1. ✅ Splash exists and works
2. ⚠️ Onboarding exists but is a 57KB monolith file — fragile
3. ⚠️ Sign Up works but social login shows "Coming Soon" alerts
4. ✅ Notification permission screen exists
5. 🔴 **Home is empty with no empty state** — user lands on blank screen with no guidance
6. ⚠️ Camera works but no custom permission request screen
7. ⚠️ Scan works but no bounding-box visualization (the wow moment)
8. 🔴 **Results → Room has race condition** — tasks may attach to wrong room
9. ⚠️ Task customize screen is missing — user gets all tasks, no choice

**Verdict:** Flow works but the empty-state gap and missing wow-moment (bounding boxes) means the first impression is underwhelming.

### Flow 2: Daily Cleaning Session

```
Home → Room → Start Blitz/Focus → Complete Tasks → Session Complete → Room Complete
```

**Issues:**
1. ✅ Home shows rooms with progress
2. ✅ Room detail shows tasks
3. ⚠️ Blitz has stale closure bug in navigation params
4. 🔴 **No optimistic updates** — each task toggle waits for server
5. ⚠️ Session Complete exists but missing "I'm done for now" permission
6. ⚠️ Room Complete has confetti but no before/after comparison

### Flow 3: Social / Challenges

```
Social → Create Challenge → Share Invite → Friend Joins → Leaderboard
```

**Issues:**
1. 🔴 Social screen crashes on network error (no try-catch)
2. ⚠️ Challenge access not validated — any user can view any challenge
3. ⚠️ No push notification when friend joins or challenge completes
4. ⚠️ Invite codes never expire

### Flow 4: Comeback (User Returns After Absence)

```
[Days pass] → Open App → Comeback Message → Easy Task → Streak Restart
```

**Issues:**
1. ✅ Comeback engine service is excellent (shame-free messaging)
2. 🔴 **Comeback XP multiplier never applies** — promised bonus doesn't work
3. ⚠️ Grace period logic doesn't check if date is in the past
4. ⚠️ No push notification for "We miss you" (not wired to events)

---

## 7. ADHD-Specific UX Issues

This section evaluates the app against ADHD user needs. These aren't general UX problems — they're specific to the target audience.

### 7.1 Decision Paralysis Traps

- **Task list shows everything at once.** ADHD users freeze when faced with 9 tasks. The Single Task Focus view exists in Pencil designs but isn't the default. Should show ONE task at a time with "just this one" framing.
- **No energy-based filtering.** The schema has `energyRequired` and `decisionLoad` fields from AI analysis. If a user opens the app exhausted, they should see only 1-2 minute tasks. This is wired in the backend but not connected to UI.
- **Room selection on home screen shows all rooms.** Should highlight "Start here" with the highest visual-impact room.

### 7.2 Transition Friction

- **Too many taps to start cleaning.** Home → Room → Task → Start. Should be: Home → "Start cleaning" → doing it. The "15-Min Blitz" CTA on home helps, but it requires a room to already exist.
- **No "just scan and go" shortcut.** First-time user should be able to go from camera to cleaning in 2 taps.

### 7.3 Missing Permission to Stop

- Session Complete screen in Pencil shows "Continue Cleaning" AND "I'm done for now" — validating the choice to stop. Current implementation may not offer this clearly. ADHD users need explicit permission to stop without guilt.

### 7.4 Streak Anxiety

- Streak display is prominent but there's no "grace period" visualization. ADHD users see "Day 12 Streak" and feel anxiety about breaking it. The comeback engine exists but its messaging should be **proactive** — "Your streak is safe for 2 more days" — not just reactive.

### 7.5 Reward Timing

- Badge unlock doesn't trigger (Critical #1.5). But beyond that — rewards should appear IMMEDIATELY after the triggering action with animation. Variable rewards should drop during the session, not after. Dopamine timing matters.

### 7.6 Time Blindness Support

- Blitz timer exists — good.
- But no "this will take about 8 minutes total" summary before starting a room.
- No "you've been cleaning for 20 minutes, take a break" nudge.
- Focus mode has Pomodoro but no adaptive timing based on user's reported energy.

### 7.7 Sensory Rewards

- Sound effects toggle exists (good)
- Haptics exist (good)
- But no satisfying animation on task completion. The Pencil designs suggest celebration micro-interactions. Current implementation: checkbox toggles. Should: confetti burst, XP float-up, satisfying sound.

---

## 8. Security Checklist

| Check | Status |
|-------|--------|
| API keys not in client code | ✅ Excellent — all through Convex actions |
| Secure storage for sensitive data | ✅ expo-secure-store with fallback |
| Rate limiting on AI calls | ✅ Implemented |
| Rate limiting on other mutations | 🔴 Missing |
| Room ownership check (server-side) | ⚠️ Most queries check userId, but not all paths |
| Challenge access control | ⚠️ Server checks participant list, client doesn't |
| Input sanitization | 🔴 Only on AI context; missing on names, descriptions |
| Invite code expiration | 🔴 Codes never expire |
| Storage cleanup | 🔴 No orphan cleanup |
| Test scripts in repo | 🔴 `scripts/test-*.ts` read API keys from env |
| Console guards | ✅ Implemented |
| HTTPS only | ✅ Via Convex |

---

## 9. Build & Config Issues

| Issue | Severity | Fix |
|-------|----------|-----|
| `ITSAppUsesNonExemptEncryption: false` in app.json | MEDIUM | Change to `true` — app uses encryption |
| `@expo/ui ~0.2.0-beta.9` in production deps | MEDIUM | Lock version or wait for stable |
| `expo-secure-store` not in plugins array | LOW | Add plugin declaration |
| Test scripts expose API key patterns | HIGH | Add to .gitignore or remove |
| RevenueCat package installed but not wired | LOW | Wire or remove to reduce bundle |
| Android permissions listed twice in app.json | LOW | Consolidate |

---

## 10. Recommended Launch Sprint Plan

### Sprint 1: "Don't Crash" (Critical Fixes) — ~3-4 days

- [ ] Fix analysis.tsx race condition (await addRoom before setTasksForRoom)
- [ ] Fix blitz.tsx stale closure in navigation params
- [ ] Fix room/[id].tsx toggle → navigate race condition
- [ ] Add error boundaries to all route screens
- [ ] Add try-catch to social.tsx and challenge/[id].tsx
- [ ] Add camera capture failure handling
- [ ] Fix auth state precedence in app/index.tsx
- [ ] Wire badge unlock to trigger after task completion
- [ ] Apply comeback XP multiplier to actual XP gain
- [ ] Fix collection stats deduplication
- [ ] Consolidate variable rewards into single system
- [ ] Add rate limiting to room creation, task creation, photo upload mutations
- [ ] Add input sanitization on user-generated text
- [ ] Remove or gitignore test scripts

### Sprint 2: "First Impression" (Empty States + Wow Moment) — ~4-5 days

- [ ] Implement Home empty state (Pencil design `TPr0p`)
- [ ] Implement Rooms empty state (Pencil design `Gk8xt`)
- [ ] Implement Progress empty state (Pencil design `YSufV`)
- [ ] Implement AI error state (Pencil design `ybRSa`)
- [ ] Implement AI detection overlay with bounding boxes (Pencil design `ldgnk`)
- [ ] Implement Task Customize screen (Pencil design `6iIOk`)
- [ ] Add optimistic updates for task toggle
- [ ] Implement "I'm done for now" on Session Complete
- [ ] Enrich Room Complete with before/after + share
- [ ] Implement Delete Account confirmation screen (Pencil design `Q4Hte`)
- [ ] Add task completion micro-animations (checkmark burst, XP float)
- [ ] Wire push notifications to badge/challenge/streak events

### Sprint 3: "ADHD Delight" (UX Polish) — ~3-4 days

- [ ] Add energy-based task filtering (connect existing schema fields to UI)
- [ ] Default to Single Task Focus view during sessions
- [ ] Add "Start Here" highlight on home for highest-impact room
- [ ] Add time estimate summary before starting a room
- [ ] Add break reminders during long sessions
- [ ] Add proactive streak grace period messaging
- [ ] Improve notification deep-linking to correct screens
- [ ] Split onboarding.tsx into separate step components
- [ ] Fix TypeScript `as any` casts
- [ ] Add missing accessibility labels and touch targets
- [ ] Fix app.json `ITSAppUsesNonExemptEncryption`
- [ ] Add missing Convex indexes
- [ ] Fix timestamp inconsistency (pick one format)

### Post-Sprint (Before Marketing Push)

- [ ] Social login (Apple/Google) — user said later
- [ ] RevenueCat integration — user said later
- [ ] Offline support / sync queue
- [ ] Sentry error tracking
- [ ] Analytics events
- [ ] App Store screenshots + metadata

---

## Final Assessment

**What's great:**
- The services architecture is production-grade. Server-side API keys, rate limiting on AI, fallback analysis, shame-free comeback engine — this is thoughtful work.
- The Pencil designs are comprehensive and emotionally intelligent. The mascot, the encouragement, the empty states — all designed for ADHD users.
- The core loop (scan → tasks → clean → celebrate) is sound.

**What will kill you:**
- Race conditions in the critical path (scan → room assignment) will corrupt data.
- Empty states are missing — first-time users see blank screens.
- The "wow moment" (AI bounding box overlay) is designed but not built.
- Badge unlock is broken — the entire gamification loop is dead.
- No error boundaries means one API hiccup crashes the app.

**Bottom line:** The bones are strong. The designs are there. The backend architecture is good. But the gap between "designed" and "implemented" is where users will churn. Fix Sprint 1, build Sprint 2, and you have a genuinely compelling ADHD cleaning app that people will pay for.
