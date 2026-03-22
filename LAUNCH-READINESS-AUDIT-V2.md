# Declutter v1 Launch Readiness Audit (Post-Sprint)

**Date:** 2026-03-18
**Previous audit:** LAUNCH-READINESS-AUDIT.md (Sprint 1-3 fixes applied since)
**Verdict:** 🟡 ALMOST READY — 1 focused sprint to launch

---

## What Changed Since Last Audit

Sprint 1-3 fixed: race conditions, error boundaries, badge unlock wiring, comeback XP multiplier, collection dedup, rate limiting, input sanitization, empty states, push notification wiring, energy filtering, visual impact sorting, time estimates, onboarding decomposition, accessibility, and more.

**This audit covers what's STILL broken or missing.**

---

## Table of Contents

1. [CRITICAL — Must Fix Before Any User](#1-critical--must-fix)
2. [HIGH — Will Hurt Retention](#2-high--will-hurt-retention)
3. [DESIGN SYSTEM — Visual Consistency](#3-design-system--visual-consistency)
4. [BACKEND — Remaining Gaps](#4-backend--remaining-gaps)
5. [DESIGN vs CODE — Remaining Gaps](#5-design-vs-code--remaining-gaps)
6. [Recommended Fix Sprint](#6-recommended-fix-sprint)

---

## 1. CRITICAL — Must Fix

### 1.1 Challenge Progress Never Updates

**The problem:** `convex/social.ts` has an `updateChallengeProgress` mutation, but NO client code ever calls it. When a user completes tasks, their challenge progress stays at 0% forever.

**Files:**
- `convex/social.ts` — mutation exists
- `app/social.tsx`, `app/challenge/[id].tsx` — display progress
- `context/DeclutterContext.tsx` — task completion flow doesn't trigger challenge update

**Fix:** After task completion in `DeclutterContext.toggleTask()`, check if user has active challenges and call `api.social.updateChallengeProgress` with incremented progress.

### 1.2 Comeback Engine Not Integrated

**The problem:** `services/comebackEngine.ts` has excellent shame-free comeback messaging, bonus XP calculation, and "One Tiny Thing" tasks — but NOTHING in the app actually uses it. When a user returns after 5 days, they see the same home screen as always. No welcome back. No bonus. No tiny re-entry task.

**Files:**
- `services/comebackEngine.ts` — fully built, unused
- `app/(tabs)/index.tsx` — should check lastActivity and show comeback UI
- `context/DeclutterContext.tsx` — should detect comeback on load

**Fix:** On app load, compare `stats.lastActivityDate` with today. If gap > 2 days, show comeback overlay/card on home screen using `getComebackMessage()` and offer `getOneTinyThingTask()`. Apply `getComebackBonusXP()` multiplier to next session.

### 1.3 Debounced Sync Can Lose Data

**The problem:** The app uses local-first state with a debounced `syncToCloud` (calls `api.sync.replaceUserState`). If the user completes tasks and force-quits before the debounce fires, those completions are lost. The debounce delay isn't visible — no "syncing..." indicator.

**Files:**
- `context/DeclutterContext.tsx:231` — debounced sync
- `context/AuthContext.tsx:421-445` — `syncToCloud` does full state replacement

**Fix:**
- Add an AppState listener that triggers immediate sync on `background`/`inactive`
- Show a subtle sync indicator (spinning icon or "Saved" text) so users know their data is safe
- Consider calling `syncToCloud` immediately (not debounced) after critical actions like room creation and task completion

### 1.4 `replaceUserState` Accepts `v.any()` — Data Injection Risk

**The problem:** `convex/sync.ts:109-118` accepts `v.any()` for rooms, tasks, stats, etc. A malicious client could inject arbitrary data. No schema validation on import.

**Files:**
- `convex/sync.ts:109-352`

**Fix:** Add schema validation for critical fields (room names, task counts, XP values). At minimum, validate types and bounds on numeric fields. Strip HTML from strings.

---

## 2. HIGH — Will Hurt Retention

### 2.1 Six Screens Use Wrong Design System

These screens import from `@/constants/Colors` or `@/theme/ThemeProvider` (the old Apple 2026 system) instead of the V1 design tokens. They have **different background colors** (`#000000` vs `#0C0C0C`), different card styles (GlassCard blur vs solid cards), and different typography. Users will see a jarring visual seam navigating between screens.

**Screens on old system:**
| Screen | Import |
|--------|--------|
| `app/focus.tsx` | `Colors`, `GlassCard` |
| `app/mascot.tsx` | `Colors` |
| `app/collection.tsx` | `Colors` |
| `app/insights.tsx` | `useTheme`, `GlassCard` |
| `app/challenge/[id].tsx` | `useTheme`, `GlassCard`, `GlassButton` |
| `app/join.tsx` | `useTheme`, `GlassCard`, `GlassButton` |

**Fix:** Migrate all 6 screens to use `V1` tokens from `@/constants/designTokens`. Replace `GlassCard` with `cardStyle(isDark)`. Replace `Colors[scheme].background` with `V1.dark.bg` / `V1.light.bg`.

### 2.2 Seven Screens Have Inline V1 Token Copies

These screens redeclare `const V1 = {...}` locally instead of importing from `designTokens.ts`. If you update the design tokens, these won't change. Drift risk.

**Files:**
- `app/auth/login.tsx`
- `app/auth/signup.tsx`
- `app/auth/forgot-password.tsx`
- `app/onboarding.tsx`
- `app/paywall.tsx`
- `app/notification-permission.tsx`
- `app/splash.tsx`

**Fix:** Delete inline `const V1` from each file. Import from `@/constants/designTokens` instead. Add any missing tokens (`inputBg`, `inputBorder`) to the shared file.

### 2.3 Mascot Images Are Placeholder Icons

The Pencil designs show a real hamster mascot (Dusty) illustration throughout — splash, onboarding, profile, celebrations, empty states. The code uses `Sparkles` icon or gradient circles with initials as placeholders.

**Where mascot should appear:**
- Home screen header (avatar area) — currently shows initial letter
- Profile companion card — currently shows Sparkles icon
- Progress empty state — currently shows Sparkles icon
- Session/room complete celebrations — image component exists but may not have real asset
- Empty states

**Fix:** Generate or source the mascot illustrations and place in `assets/images/mascot/`. Replace placeholder icons with `<Image source={require('@/assets/images/mascot/dusty-happy.png')} />` etc.

### 2.4 Delete Account Is an Alert Dialog, Not a Designed Screen

Pencil design `Q4Hte` shows a dedicated fullscreen with sad mascot, bullet list of what gets deleted, "Delete My Account" / "Keep My Account" buttons. Current implementation uses inline `Alert.alert()`.

**Fix:** Create `app/delete-account.tsx` matching the Pencil design.

### 2.5 Backend: Duplicate Badge Creation Race

`convex/badges.ts:207-254` — Between checking if a badge exists and inserting it, a parallel request could also insert. Two identical badges created.

**Fix:** After insert, query and delete duplicates. Or use a unique constraint approach.

### 2.6 Backend: Room Deletion Orphans Storage Files

`convex/rooms.ts:147-154` — Deletes photo records from DB but doesn't call `ctx.storage.delete()` for the associated `storageId`. Files accumulate in Convex storage.

**Fix:** When deleting a room, iterate its photos and call `ctx.storage.delete(photo.storageId)` for each.

### 2.7 Backend: Leaderboard XP Has No Cap

`convex/leaderboard.ts:138-142` — `updateWeeklyXP` accepts any `xpAmount` with no maximum. A forged client call could add 1 million XP.

**Fix:** Cap `xpAmount` at a reasonable maximum (e.g., 500 per call, matching the `addXp` cap in stats.ts).

### 2.8 Backend: AI Output Not Validated

`convex/gemini.ts:825-938` — AI response is parsed but not validated:
- No check that `phase` is 1-3 (could be 4+)
- No check that `visualImpact` is valid enum value
- No check that `estimatedMinutes` is positive
- Malformed subtasks missing `estimatedSeconds` silently accepted

**Fix:** Add a `validateAnalysisResult()` function that clamps/defaults invalid values before storing.

---

## 3. DESIGN SYSTEM — Visual Consistency

### Background Color Comparison

| System | Dark BG | Light BG | Used By |
|--------|---------|----------|---------|
| **V1 designTokens** (correct) | `#0C0C0C` | `#FAFAFA` | 17 core screens |
| **Colors.ts** (old) | `#000000` | `#F2F2F7` | 5 screens |
| **Pencil designs** | `#0C0C0C` | `#FAFAFA` | — |

The `#000000` vs `#0C0C0C` difference is subtle but creates a visible seam between focus/mascot/collection screens and the rest of the app.

### Card Style Comparison

| System | Dark Card | Border | Radius |
|--------|-----------|--------|--------|
| **V1 cardStyle** | `#1A1A1A` | `rgba(255,255,255,0.08)` | 20 |
| **GlassCard** | Blur + opacity | Different | Variable |

### Font Comparison

| System | Display | Body |
|--------|---------|------|
| **V1** | Bricolage Grotesque 700 | DM Sans |
| **Old** | System font via Typography | System font |

**Impact:** The 6 old-system screens look like they're from a different app.

---

## 4. BACKEND — Remaining Gaps

### Still Missing (from original audit)

| Feature | Status | Notes |
|---------|--------|-------|
| RevenueCat webhook sync | Skipped | User said "later" |
| Email verification | Missing | No verification mutation exists |
| Offline sync queue | Missing | Local-first but no offline queue |
| Invite code expiration | Missing | Codes valid forever |
| Storage orphan cleanup | Missing | No scheduled cleanup job |
| Soft delete / archive | Missing | All deletes are hard deletes |
| Task dependency ordering | Missing | Schema fields exist, AI fills them, nothing uses them |

### Race Conditions Remaining

| Location | Issue |
|----------|-------|
| `stats.ts:393` `decrementTask` | Not atomic; parallel calls can corrupt streak/XP |
| `badges.ts:207-254` | Duplicate badge insertion possible |
| `social.ts:100-136` `joinChallenge` | Parallel joins can add duplicate participants |
| `stats.ts:182-207` comeback reset | Timezone-sensitive; midnight UTC edge case |

### Missing Triggers

| Event | Push Notification | Status |
|-------|-------------------|--------|
| Badge unlocked | ✅ Wired | Working |
| Streak milestone | ✅ Wired | Working |
| Challenge complete | ✅ Wired | Working (if progress is triggered — see 1.1) |
| Accountability nudge | ✅ Wired | Working |
| Session complete | ❌ Missing | No notification fired |
| Comeback reminder | ❌ Missing | No "we miss you" notification scheduled |
| Inactivity nudge | ❌ Missing | No scheduled function checks for inactive users |

---

## 5. DESIGN vs CODE — Remaining Gaps

### Screens Fully Implemented ✅ (42 screens)
Home (dark/light), Home empty, Rooms list, Rooms empty, Progress, Progress empty, Profile, Sign In, Sign Up, Forgot Password, all 12 onboarding steps, Camera, Scanning, AI Results, Room Detail, Blitz Timer, Today's Tasks, Task Customize, Task Detail, Single Task Focus, Session Complete, Room Complete, Achievements, Settings, Notification Permission, Paywall, Social/Community, Splash

### Screens Partially Implemented ⚠️ (4 screens)
| Screen | What's Missing |
|--------|---------------|
| **Delete Account** | Designed as fullscreen with mascot; implemented as Alert dialog |
| **Camera Permission** | Designed as screen with mascot; uses inline system dialog |
| **AI Error** | Designed as dedicated screen; inline error in analysis.tsx |
| **AI Detection Overlay** | Bounding boxes may not perfectly match Pencil design |

### Screens Not Implemented ❌ (0 critical)
All critical screens are implemented. The above 4 are nice-to-have polish items.

### Visual Gaps Still Present
1. **Mascot illustrations** — Placeholders throughout (Sparkles icon, gradient initials)
2. **6 screens on wrong color system** — Visual seam between screens
3. **7 screens with inline token copies** — Drift risk, not broken today
4. **Room card thumbnails** — 60x60 in code vs larger in designs

---

## 6. Recommended Fix Sprint

### Priority 1: Functionality (2-3 days)

- [ ] **Wire challenge progress** — In DeclutterContext, after task completion, call `api.social.updateChallengeProgress` for any active challenges the user is in
- [ ] **Integrate comeback engine** — On home screen mount, check days since last activity. If > 2 days, show comeback card using `services/comebackEngine.ts`. Apply XP multiplier.
- [ ] **Add AppState sync listener** — Trigger immediate `syncToCloud` when app goes to background. Show subtle sync status indicator.
- [ ] **Add sync validation** — In `convex/sync.ts`, validate critical fields in `replaceUserState` (type check rooms, cap XP values, sanitize strings)

### Priority 2: Design Consistency (2-3 days)

- [ ] **Migrate 6 old-system screens** to V1 designTokens:
  - `app/focus.tsx` — Replace `Colors`, `GlassCard` with V1 tokens, `cardStyle()`
  - `app/mascot.tsx` — Replace `Colors` with V1 tokens
  - `app/collection.tsx` — Replace `Colors` with V1 tokens
  - `app/insights.tsx` — Replace `useTheme`, `GlassCard` with V1 system
  - `app/challenge/[id].tsx` — Replace `useTheme`, `GlassCard`, `GlassButton` with V1
  - `app/join.tsx` — Replace `useTheme`, `GlassCard`, `GlassButton` with V1
- [ ] **Remove 7 inline V1 copies** — Import from `@/constants/designTokens` instead:
  - `app/auth/login.tsx`, `signup.tsx`, `forgot-password.tsx`
  - `app/onboarding.tsx`, `paywall.tsx`, `notification-permission.tsx`, `splash.tsx`
  - Add `inputBg`, `inputBorder` to shared designTokens first

### Priority 3: Backend Hardening (1-2 days)

- [ ] **Fix room deletion** — Delete storage files when room/photos are deleted
- [ ] **Cap leaderboard XP** — Add max 500 XP per call validation
- [ ] **Validate AI output** — Clamp phase to 1-3, validate visualImpact enum, ensure positive estimatedMinutes
- [ ] **Add inactivity push notification** — Convex cron job that checks for users inactive > 3 days and sends a gentle "We miss you" push
- [ ] **Add session complete notification** — Fire push after session ends for positive reinforcement

### Priority 4: Polish (1 day)

- [ ] **Generate mascot illustrations** — Create hamster "Dusty" assets for: happy, celebrating, sad, sleeping, confused states
- [ ] **Replace placeholder icons** with mascot images in: home header, profile companion, empty states, celebrations
- [ ] **Create delete-account screen** — Fullscreen matching Pencil design `Q4Hte`

---

## Final Assessment

### What's Great Now (Post-Sprint 1-3)
- Error boundaries on all crash-prone screens
- Badge unlock fires after task completion
- Comeback XP multiplier calculated correctly in backend
- Energy-based task filtering (Quick Wins default — excellent for ADHD)
- Visual impact sorting (high-impact first for dopamine)
- Time estimate summaries (helps time blindness)
- "Start Here" badge on home (reduces decision paralysis)
- Break reminders in focus mode
- Streak grace period messaging
- Push notifications wired to badges/streaks/challenges/nudges
- Notification deep linking to correct screens
- Rate limiting on rooms/photos/challenges
- Input sanitization
- All auth screens have keyboard handling
- All timers clean up properly
- Zero TypeScript errors

### What Will Sink You If Not Fixed
1. **Challenge progress never updates** — Social feature is decoration, not functional
2. **Comeback engine is built but disconnected** — Returning users get nothing special
3. **Data can be lost on force-quit** — Debounced sync with no background trigger
4. **6 screens look like a different app** — Old color system creates jarring seams

### Bottom Line
The app went from "not ready" to "almost ready" in one session. The critical crashes, race conditions, and missing error handling are fixed. What remains is **wiring** (challenge progress, comeback engine, sync safety) and **visual unification** (6 screens need design system migration). One focused sprint and you're launch-ready.
