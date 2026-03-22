# Declutter v1 — Final Launch Audit

**Date:** 2026-03-18
**Scope:** Every screen, every backend function, Pencil design fidelity, user flows, ADHD UX
**Verdict:** Fix 18 items below and you're launch-ready.

---

## Design Fidelity: 30/32 Screens Match Pencil

The implementation is remarkably faithful. All design tokens match (coral `#FF6B6B`, dark bg `#0C0C0C`, fonts Bricolage Grotesque + DM Sans). Two minor token differences in light mode:

| Token | Pencil | Code | Impact |
|-------|--------|------|--------|
| Light card | `#F6F7F8` | `#FFFFFF` | Negligible — code looks cleaner |
| Light border | `#F3F4F6` | `#E5E7EB` | Code border slightly more visible — better |

**Partial matches:** Task Customize (slider control differs), Paywall (CTA should use gold gradient, verify it does).

**Screens without dedicated designs:** `insights.tsx`, `join.tsx` — both functional, just no Pencil frame.

---

## CRITICAL — Will Break the App

### C1. Comeback Bonus XP Is a Lie

**File:** `app/(tabs)/index.tsx:146-151`

The comeback card shows "Bonus XP Active" badge but no code in DeclutterContext actually multiplies XP during comeback sessions. Users think they're earning 1.5-2x XP but they're not. The `getComebackBonusXP()` function exists in `comebackEngine.ts` but is never called from `toggleTask`.

**Fix:** In `DeclutterContext.tsx toggleTask`, when `taskJustCompleted`, check if comeback bonus is active (days since `stats.lastActivityDate` >= 2) and multiply the base 10 XP by the comeback multiplier before adding.

### C2. Session Complete Screen Doesn't Validate Params

**File:** `app/session-complete.tsx:30-36`

Relies on URL params (`tasksCompleted`, `timeSpent`, `xpEarned`) without validation. Malformed params show "NaN" or crash the screen.

**Fix:** Parse with `parseInt(x, 10) || 0` for all numeric params. Add fallback defaults.

### C3. Analysis → Room Creation Has No Retry

**File:** `app/analysis.tsx:192-227`

When `addRoom()` fails (network error), user gets an Alert that dismisses. They're stuck on the analysis screen with no way to retry. Their AI analysis results are lost.

**Fix:** Keep analysis results in state. On failure, show persistent error bar with "Retry" button instead of a dismissable Alert. Don't clear results on error.

### C4. Camera Has No Gallery Fallback Before Permission

**File:** `app/camera.tsx:112-151`

If user denies camera permission, the only option is "Open Settings". No gallery picker alternative is offered first. Users cautious about permissions get locked out of the core feature.

**Fix:** Show "Choose from Gallery" button alongside "Enable Camera" on the permission screen. Use `expo-image-picker` for gallery access which has separate permission.

---

## HIGH — Will Hurt Retention & Trust

### H1. Room Detail Is Too Complex for ADHD Users

**File:** `app/room/[id].tsx`

Shows 3 phase tabs (Quick Wins / Deep Clean / Organize) + 2 energy filters simultaneously. ADHD users face 6 options before starting a single task. This is the opposite of what the app promises.

**Fix:** Default to "Quick Wins" only. Hide other phases behind "Show more phases" toggle. Move energy filter to a settings preference, not per-room.

### H2. "One Tiny Thing" Card Isn't Interactive

**File:** `app/(tabs)/index.tsx:442-461`

The comeback engine suggests a tiny task but the card isn't tappable. User has to manually find and open the task, breaking the momentum that the card was supposed to create.

**Fix:** Make the card a Pressable that either starts the task directly or navigates to the relevant room with the task highlighted.

### H3. Blitz Timer Doesn't Pause on Background

**File:** `app/blitz.tsx`

User can leave the app during a blitz, timer keeps running in the background. They come back to find their "15-minute blitz" ended 10 minutes ago while they were on Instagram.

**Fix:** Add AppState listener. When app goes to background, pause the timer. When it comes back, show "You were away for X minutes. Resume or end session?"

### H4. No Connection Status / Offline Indicator

**Files:** `context/AuthContext.tsx` has `isOnline` but nothing uses it

The app is "local-first" but never tells users if they're offline. Changes happen silently, sync fails silently. User has no idea if their data is safe.

**Fix:** Show a subtle persistent banner at top when offline: "You're offline. Changes saved locally." Dismiss when back online with "Back online. Synced."

### H5. Focus Timer Break Reminder Fires at Wrong Time

**File:** `app/focus.tsx`

Break reminder shows at 25 minutes even if user selected a 5-minute timer. The reminder logic doesn't account for the selected preset duration.

**Fix:** Only show break reminder when `elapsed >= selectedDuration`. Or scale the reminder to the preset (e.g., 5-min timer = no break reminder).

### H6. Task Completion Feedback Is Too Subtle

**Files:** `app/room/[id].tsx`, `app/blitz.tsx`

Task completion only shows a subtle haptic + small "XP float-up". For ADHD users, this is NOT enough dopamine. The app promises gamification but the moment-to-moment feedback doesn't deliver.

**Fix:** Layer feedback: haptic (already there) + brief confetti burst + sound effect (if enabled) + mascot mini-reaction. Show combo counter for consecutive completions ("3 in a row!").

### H7. Unbounded Account Deletion Query

**File:** `convex/users.ts:305`

`ctx.db.query("challenges").take(500)` — if user participated in 501+ challenges, cleanup is incomplete. Orphaned data stays forever.

**Fix:** Use a paginated loop that keeps deleting until no more results.

### H8. XP Has No Daily Rate Limit

**File:** `convex/stats.ts:109-142`

Per-operation cap is 500 XP, but no per-day limit. A bot could call `addXp(500)` 1000 times and hit 500,000 XP in a day, destroying leaderboard integrity.

**Fix:** Add daily XP cap (e.g., 5,000 XP/day). Track in stats table with `xpEarnedToday` + `xpResetDate`.

---

## MEDIUM — Should Fix for Polish

### M1. No Error Tracking in Production

No Sentry, no Bugsnag, no crash reporting. If the app crashes in production, you won't know about it until users leave 1-star reviews.

**Fix:** Integrate Sentry with `@sentry/react-native`. Wrap root layout in Sentry error boundary.

### M2. Reduced Motion Not Checked Everywhere

**Files:** Multiple screens

`splash.tsx` checks `useReducedMotion()` correctly, but tab bar animations, room card animations, and hero card animations don't check it. Users on accessibility settings get jarring experiences.

**Fix:** Audit all `Animated.View` usage. Wrap in `reducedMotion ? null : animation` conditionally.

### M3. VoiceOver / Accessibility Labels Incomplete

Many icon-only buttons lack `accessibilityLabel`. Tab labels are generic ("Home" instead of "Home: View rooms and streaks"). Interactive cards don't have `accessibilityRole="button"`.

**Fix:** Audit all Pressable/TouchableOpacity elements. Add descriptive labels.

### M4. Photo Upload Has No File Size Validation

**File:** `convex/photos.ts:75-84`

Rate limit is 50 photos/24h but no file size check. A user could upload 50 huge images and burn through Convex storage.

**Fix:** Validate file size server-side (max 10MB per photo). Compress on client before upload.

### M5. Challenge Participants Array Unbounded

**File:** `convex/social.ts`

Participants are embedded in the challenge document as an array. No cap on how many can join. At scale, this document could grow very large.

**Fix:** Cap at 50 participants per challenge, or move participants to a separate table.

### M6. Missing Indexes for Common Queries

**File:** `convex/social.ts:230-241`

Active challenges query does a full table scan with `.filter()` instead of using an index. Will slow down as challenge count grows.

**Fix:** Add compound index `by_isActive` on challenges table.

---

## LOW — Nice to Have

### L1. No "Help" / FAQ Screen

Users who are confused have no in-app support. No tutorial replay, no FAQ, no contact link.

### L2. No Session Analytics

No tracking of session drop-off points, feature adoption rates, or error frequencies. Flying blind post-launch.

### L3. Badge Artwork Is Emoji-Based

Design shows polished circular badge icons but code uses emoji. Looks less premium than custom artwork. Consider generating badge illustrations.

### L4. Paywall "Restore Purchases" Lacks Feedback

No success/failure toast after tapping "Restore Purchases". Users don't know if it worked.

---

## User Flow Verification

### Flow 1: First Launch → First Room
`splash → onboarding (12 steps) → home empty → camera → analysis → room created → room detail → first task`

**Status:** Works end-to-end. One issue: if analysis fails, no retry path (C3).

### Flow 2: Returning User → Clean
`home → pick room → start blitz → complete tasks → session complete`

**Status:** Works. Timer doesn't pause on background (H3). Task feedback too subtle (H6).

### Flow 3: Comeback (2+ days away)
`home → comeback card → one tiny thing → complete → bonus XP`

**Status:** Card shows but bonus XP is fake (C1). Tiny thing card not tappable (H2).

### Flow 4: Focus Timer
`focus → select preset → timer runs → tasks → session end`

**Status:** Works. Break reminder fires at wrong time (H5). Pro gate might show to pro users if subscription state is stale.

### Flow 5: Achievement Unlock
`complete task → badge check → celebration → achievements screen`

**Status:** Works correctly. Badge dedup is handled. Push notification fires.

---

## Backend Health Summary

| Area | Status | Notes |
|------|--------|-------|
| Auth | OK | Convex Auth properly guards all mutations |
| Room CRUD | OK | Rate limited to 20 rooms, storage cleanup on delete |
| Photo upload | MEDIUM | No file size validation (M4) |
| AI Analysis | OK | Output validated, phases clamped, error handling solid |
| Stats/XP | HIGH | No daily rate limit (H8), comeback bonus not wired (C1) |
| Badges | OK | Dedup race condition handled |
| Sync | OK | Validation added, AppState sync on background |
| Notifications | OK | Inactivity cron set up, session complete notification added |
| Leaderboard | OK | XP capped at 500 per call |
| Social/Challenges | MEDIUM | Participant array unbounded (M5), missing index (M6) |
| Account deletion | HIGH | Unbounded query (H7) |

---

## What's Already Great

- ADHD-first design is excellent: no-judgment language, "One Tiny Thing" re-entry, time estimates everywhere, Quick Wins first
- 15-Minute Blitz is the killer feature — time-boxed, one task at a time, zero overwhelm
- Mascot (Dusty) provides emotional anchor without being annoying
- Comeback engine is shame-free and thoughtful
- Design fidelity is exceptional — 30/32 screens match Pencil
- Gamification layer (XP, streaks, badges, before/after photos) is well-balanced
- Error boundaries on crash-prone screens
- Rate limiting on rooms, photos, challenges
- Input sanitization across all user inputs

---

## Recommended Fix Order

### Sprint 1 (2-3 days) — Blockers
1. C1 — Wire comeback bonus XP for real
2. C2 — Validate session-complete params
3. C3 — Add retry to room creation after analysis
4. C4 — Gallery fallback on camera permission denial
5. H1 — Simplify room detail (default Quick Wins only)
6. H3 — Pause blitz timer on background

### Sprint 2 (2-3 days) — Retention
7. H2 — Make comeback tiny task card interactive
8. H4 — Offline status indicator
9. H6 — Better task completion feedback (confetti + sound + combo)
10. H7 — Fix unbounded account deletion
11. H8 — Add daily XP rate limit

### Sprint 3 (1-2 days) — Hardening
12. H5 — Fix focus timer break reminder timing
13. M1 — Integrate Sentry
14. M2 — Reduced motion audit
15. M3 — Accessibility labels audit
16. M4 — Photo file size validation
17. M5 — Cap challenge participants
18. M6 — Add missing database indexes

### Post-Launch
- L1-L4 polish items
- Session analytics
- Custom badge artwork

---

## Bottom Line

**18 items to fix. ~6-8 days of work. Then you're launch-ready.**

The app's core loop (photo → AI → tasks → clean → celebrate) works. The ADHD-first design is genuinely differentiated. The gamification makes it sticky. The 4 critical items are all fixable in a day. The high-priority items are 2-3 days. After that, this is a premium app people will pay for.
