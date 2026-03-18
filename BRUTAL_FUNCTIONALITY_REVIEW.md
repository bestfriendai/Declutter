# Declutter App -- Brutal Functionality Review
**Date:** March 18, 2026
**Scope:** Product, Features, User Psychology, Monetization, Retention, Technical Architecture
**Reviewed By:** Deep codebase analysis of all core files

> This document is a no-bullshit evaluation of what Declutter DOES, not how it LOOKS. It covers the daily use loop, AI quality, gamification mechanics, monetization strategy, notification approach, retention risks, and the 20 highest-impact improvements. Read it before writing another line of code.

---

## Table of Contents
1. [Core Loop Analysis](#1-core-loop-analysis)
2. [AI Room Analysis -- The Killer Feature](#2-ai-room-analysis----the-killer-feature)
3. [15-Minute Blitz -- The Proposed Hero Feature](#3-15-minute-blitz----the-proposed-hero-feature)
4. [Mascot / Gamification](#4-mascot--gamification)
5. [Monetization Strategy](#5-monetization-strategy)
6. [Notification Strategy](#6-notification-strategy)
7. [Retention & Churn Risk](#7-retention--churn-risk)
8. [Feature Priority for V1](#8-feature-priority-for-v1)
9. [Technical Architecture Issues](#9-technical-architecture-issues)
10. [Top 20 Improvements Ranked by Impact](#10-top-20-improvements-ranked-by-impact)

---

## 1. Core Loop Analysis

### What Is the Actual Daily Use Loop?

Based on the codebase, the intended loop is:

1. **Open app** --> See home screen with "Today's Mission" hero card
2. **Tap "Start 15-Min Blitz"** or navigate to a room
3. **Complete tasks** by checking them off in room detail view
4. **See progress** on rings/charts in Progress tab
5. **Return tomorrow** for... what exactly?

### Where the Loop Breaks Down

**Problem 1: There is no daily trigger mechanism built into the core flow.**

The home screen shows "Today's Mission" but there is NO system that generates a new daily mission. The hero card on the home screen (`app/(tabs)/index.tsx` lines ~200-350) simply picks the room with the most pending tasks. If you completed everything yesterday, the home screen shows... the same room at 100%. There is no:
- Daily rotating suggestion
- "Today's 15-min target" algorithm
- Time-based freshness decay (rooms don't get "stale")
- New task generation after initial scan

The loop dies after all tasks from the initial AI scan are completed. There is NOTHING that brings the user back after day 3-5 unless they scan a new room.

**Problem 2: No "aha moment" before step 3.**

The aha moment SHOULD be: "I took a photo, the AI gave me a plan, and in 15 minutes my room looked different." But the path to that moment is: Open app --> Navigate through 13-step onboarding --> Get to home screen --> Tap scan --> Take photo --> Wait for AI --> Accept tasks --> Go to room --> Complete tasks --> See result. That is AT MINIMUM 8 distinct screens and 3-5 minutes before a single cleaning task is completed. For ADHD users, every extra step is a dropout risk.

**Problem 3: The completion payoff is underwhelming.**

When you check off a task in `app/room/[id].tsx`, the code shows:
- A `ComboCounter` tracks consecutive completions
- An `XPPopup` shows earned XP
- A `MysteryReward` fires every N completions
- A `Toast` shows encouragement

But there is NO room completion celebration screen. The `RoomCompleteModal` component exists (imported at line 63), but when a room hits 100%, the experience is a modal, not a full-screen celebration. Compare to Duolingo's lesson completion (full-screen confetti + XP breakdown + streak display + share prompt) -- Declutter's "you finished" moment is a minor visual event.

**Problem 4: No session structure.**

The app shows tasks in a list. Users check them off one by one. But there is no GUIDED SESSION experience -- no "here's your next task" auto-advancing flow, no timer running alongside, no "you've been cleaning for 12 minutes, 3 minutes left" awareness. The focus timer (`app/focus.tsx`) is a SEPARATE screen that is completely disconnected from the task list. You cannot see tasks while the timer is running. You cannot check off tasks during a focus session. The timer and the task list are two features that should be one.

### The "Aha Moment" That Should Hook Users

**The aha moment is: taking a photo of your messy room and getting back a specific, personalized, tiny-step plan in under 30 seconds.** This is genuinely novel. No other app does this. The AI analysis is the single most defensible feature. BUT the current flow buries it behind 13 onboarding steps and makes it feel like a utility rather than magic.

### How Many Sessions Until Long-Term Retention?

Based on behavior science research (Nir Eyal's Hook Model, BJ Fogg's Tiny Habits):
- **Session 1:** Photo scan + complete 1-3 tasks = user sees the value proposition
- **Session 3:** User has completed one room or done three blitz sessions = habit forming
- **Session 7:** One week of daily use = habit established (if there IS a daily trigger)
- **Session 14:** Two weeks = likely long-term retention

**Critical problem:** There is nothing in the codebase that actively drives sessions 2 through 7. The notification system exists but is passive. There is no "come back tomorrow for..." mechanic. The streak system exists in stats but has no visual prominence on the home screen and no meaningful reward for maintaining it.

---

## 2. AI Room Analysis -- The Killer Feature

### How Good Is the AI Analysis?

The Gemini integration (`convex/gemini.ts`) is genuinely impressive:

**Strengths:**
- **3-phase system** ("Operation Floor Rescue" / "Counter Strike" / "The Final Sparkle") is perfectly designed for ADHD -- it gives permission to stop after Phase 1
- **Energy-adaptive task counts** -- exhausted users get 3 tasks, hyperfocused users get 15. This is exactly what Goblin Tools' "spiciness level" does, but baked in.
- **Doom pile detection** -- specifically looks for and addresses the mixed piles of random items that are ADHD kryptonite
- **Per-task psychology fields** -- `whyThisMatters`, `resistanceHandler`, `mentalBenefit` are ADHD-gold. "This is why clearing this surface matters for your brain" is the kind of thing a cleaning coach would say.
- **Subtask breakdown** -- every task has subtasks under 2 minutes, matching research showing ADHD users need tasks < 120 seconds to maintain engagement
- **Supply checklist** -- tells you what to gather BEFORE starting, reducing decision fatigue mid-session
- **Specific object identification** -- "blue coffee mug on desk" not just "dishes" -- makes tasks feel concrete and doable

**This is the best AI cleaning analysis prompt I have seen.** The system prompt is 287 lines of thoughtfully designed behavior-science-informed instructions. It is the app's moat.

### What Happens When It Fails?

The fallback (`services/ai.ts`, `getFallbackAnalysis()`) returns 3 generic tasks:
1. "Pick up any visible trash" (2 min)
2. "Clear one surface" (3 min)
3. "Put 5 things where they belong" (5 min)

**Problem:** The user sees NO indication that AI failed. The fallback is presented identically to a real analysis. The `_context` parameter (which could be used to make fallbacks room-type-specific) is literally prefixed with an underscore because it is unused.

**The fix is clear:** The fallback should (a) tell the user AI was unavailable, (b) offer room-type-specific fallback tasks based on the room type they selected in the camera screen, and (c) offer a retry button.

The retry logic uses `retryWithTimeout` with 2 attempts and a 30-second timeout. This is reasonable. But network errors on cellular (common for "standing in my messy bedroom" use case) could leave users waiting 60+ seconds with only a loading animation.

### Task Breakdown Quality for ADHD

The task optimizer (`services/taskOptimizer.ts`) has a sophisticated scoring system:

```
Score factors:
+20 if task energy <= user energy
+25 if user prefers quick wins AND task is < 5 min
+15 for high visual impact
-20 for high decision load (if user avoids decisions)
+10 for high completion rate categories
-15 for high skip rate categories
-10 for tasks with dependencies
+5 per task this enables
```

This is genuinely ADHD-aware optimization. It learns from the user's actual completion patterns and deprioritizes the task types they tend to skip. The `avoidsDecisionTasks` flag auto-detects if someone has a > 40% skip rate on sorting/organization tasks and pushes those to the bottom.

**But here is the problem:** This optimizer is NEVER CALLED in the visible user flow. The task list in `app/room/[id].tsx` sorts by phase and then renders in order. The `optimizeTaskOrder` function exists in the service but is not imported or invoked by any screen. The personalized task ordering is dead code.

### AI Improvements That Would Make the Biggest Difference

1. **Use the task optimizer.** Wire `optimizeTaskOrder()` into the room detail screen. The code exists; it just is not connected.

2. **Re-scan capability.** After completing Phase 1, let users take a new "after" photo. The before/after progress analysis (`analyzeProgress` action) already exists and is excellent -- it identifies specific changes, generates Phase 2 recommendations, and has Dusty reactions. But there is no UI to trigger it mid-session. The `ProgressComparison` component is imported in `analysis.tsx` but only shown post-analysis.

3. **Room-type-specific fallbacks.** When AI fails, use the selected room type to serve curated task lists. "Kitchen" fallbacks should mention counters, dishes, and trash. "Bedroom" fallbacks should mention floor items, bed-making, and surfaces.

4. **Cached room knowledge.** If a user scans the same room twice, the AI should reference what it previously found. "Last time you had a doom pile by the desk -- has that been addressed?" This creates continuity and shows the app is paying attention.

5. **Difficulty feedback loop.** The `difficultyFeedback` field exists on tasks ("easier" / "accurate" / "harder") but there is NO UI to capture this feedback. Adding a simple "Was this easier or harder than expected?" after task completion would feed the optimizer and improve future task time estimates.

---

## 3. 15-Minute Blitz -- The Proposed Hero Feature

### Does This Actually Exist in Code?

**Partially.** The concept is referenced throughout:
- Home screen hero card says "Start 15-Min Blitz" and "3 easy tasks - ~15 min"
- The focus timer (`app/focus.tsx`) has a 15-minute preset
- The room detail screen has a "Start 15-Min Blitz" floating button

But there is NO dedicated "blitz mode" that:
1. Selects the optimal tasks for 15 minutes using the task optimizer
2. Presents them one at a time with a countdown
3. Auto-advances to the next task on completion
4. Shows a running timer alongside the current task
5. Celebrates the blitz completion with a summary screen

What actually happens: tapping "Start 15-Min Blitz" on the home screen navigates to the room detail page. Tapping the floating "15-Min Blitz" button on the room detail page navigates to `app/focus.tsx`, which is a generic Pomodoro timer with NO task integration.

**The focus timer and the task list are completely disconnected.** The timer counts down. The tasks are on a different screen. There is no connection between them. This is the single biggest missed opportunity in the product.

### How Should It Work for Maximum ADHD Benefit?

The ideal 15-Minute Blitz flow:

1. **One tap from home screen** -- "Start 15-Min Blitz"
2. **Smart task selection** -- The app picks 3-5 tasks that fit in 15 minutes, prioritized by visual impact, sorted by the task optimizer's scoring algorithm
3. **Single-task focus view** -- Show ONE task at a time, full screen, with:
   - The task title and description in large text
   - The subtask breakdown as a checklist
   - A 15-minute countdown timer in the corner
   - The `whyThisMatters` text for motivation
   - "Skip" and "Done" buttons
4. **Auto-advance on completion** -- When "Done" is tapped, confetti burst + haptic + auto-slide to next task
5. **Blitz complete summary** -- When timer ends or all tasks are done:
   - "You cleaned for 14 minutes and completed 4 tasks!"
   - Before/after photo prompt
   - Dusty celebrating
   - XP earned
   - Streak updated
   - "Share your win" button

### Task Selection Algorithm

The code for this ALREADY EXISTS in `services/ai.ts`:

```typescript
export function getFilteredTasks(
  tasks: CleaningTask[],
  timeMinutes: number,
  energyLevel: EnergyLevel
): CleaningTask[]
```

This function:
1. Filters tasks by energy level (exhausted users only see minimal-energy tasks)
2. Removes high-decision-load tasks for exhausted users
3. Sorts by visual impact (high impact first)
4. Fills up to the time budget

Combined with `optimizeTaskOrder()` from the task optimizer, this would produce an optimal 15-minute task set. The code exists. It is just not wired into any UI.

### How Does It Compare to Competitors?

- **FlyLady's 15-min timer:** Dumb timer with no task guidance. User decides what to do.
- **Routinery's guided sessions:** Timer-based flow with auto-advance, but generic tasks (not cleaning-specific, not AI-personalized)
- **Declutter's POTENTIAL:** AI-selected highest-impact tasks personalized to your specific room + guided one-at-a-time flow + countdown timer + celebration. This would be objectively superior to both. But it does not exist yet.

---

## 4. Mascot / Gamification

### What Mascot Mechanics Actually Exist in Code?

The schema (`convex/schema.ts`) defines a mascot with:
- `name`, `personality` (spark/bubbles/dusty/tidy)
- `mood`, `activity`
- `level`, `xp`
- `hunger`, `energy`, `happiness`
- `lastFed`, `lastInteraction`
- `accessories`, `currentAccessory`

The `DeclutterContext.tsx` manages mascot state with `mascot` and `setMascot`. But searching through the codebase for actual mascot interactions:

**What exists:**
- Onboarding lets you pick a mascot personality and name it
- The profile screen shows Dusty with mood bars (Happiness/Energy/Hunger)
- The AI prompts include `mascotPersonality` and generate `dustyReaction` text
- Notifications include mascot-voiced messages ("Dusty says hi!")

**What does NOT exist:**
- **No feeding mechanic.** Hunger bar decays but there is no UI to feed the mascot.
- **No interaction screen.** You cannot play with, dress, or accessorize the mascot.
- **No mood impact from behavior.** The mascot's happiness/energy/hunger are defined in the schema but never calculated from actual cleaning behavior. They are stored values with no input loop.
- **No mascot presence during cleaning.** Dusty does not appear on the room detail screen, the focus timer, or any task completion flow. The one place mascot reactions would matter most -- while you are cleaning -- Dusty is absent.
- **No accessory unlocks.** The `accessories` array exists but there are no defined accessories, no unlock conditions, and no customization UI.
- **No growth visualization.** Dusty has a `level` and `xp` but there is no visual difference between a Level 1 and Level 20 Dusty.

**Verdict:** The mascot is a database schema pretending to be a feature. The emotional core of the app -- the thing that makes Finch work with 500K+ 5-star reviews -- is a set of unused database fields.

### What Finch/Tody Patterns Should Be Adopted?

**From Finch (proven with 5M+ downloads):**
1. **Emotional attachment through care mechanics.** You raise a bird by completing real-life tasks. Each task gives the bird energy. The bird goes on adventures and discovers things. This creates obligation to return. Declutter should make cleaning tasks directly feed Dusty's hunger/happiness/energy, with visible animations when you complete tasks.

2. **Variable reward adventures.** After accumulating enough energy, Finch's bird goes on a random adventure and brings back a discovery. This is the variable reward schedule that keeps dopamine flowing. Declutter already has `variableRewards` in the schema (mystery drops every 3rd task) but the UI for claiming rewards does not exist.

3. **Relationship milestones.** Finch tracks "Uber Besties" at day 185. Declutter should have Dusty relationship milestones: "You and Dusty have cleaned together for 7 days!" with unlocks.

**From Tody (1M+ users):**
1. **Mascot personality in reactions.** Tody's Dusty has attitude -- "hates clean stuff." Declutter's Dusty has four personality types (spark/bubbles/dusty/tidy) with distinct voice patterns in the AI prompts, but these are only used in push notifications and AI-generated text. They should be reflected in on-screen dialog bubbles during the cleaning session.

2. **Monthly challenges against the mascot.** Tody users race against Dusty in monthly challenges. This creates a recurring engagement mechanic. Declutter has a `challenges` table in the schema but it is designed for social challenges, not mascot challenges.

### How Should XP/Levels/Rewards Work?

The current XP system:
- Focus timer shows "+XP earned" but **does not actually grant XP.** The text is displayed (`+${Math.round(totalSeconds / 60 * 2)} XP earned`) but no function is called to update stats.
- The profile screen displays level/XP from `stats.level` and `stats.xp`
- XP is earned when tasks are completed in `DeclutterContext.tsx`

**Recommended XP structure:**

| Action | XP | Why |
|--------|-----|-----|
| Complete a Phase 1 task | 10 XP | Base reward |
| Complete a Phase 2 task | 15 XP | Harder work |
| Complete a Phase 3 task | 25 XP | Highest effort |
| Complete 3 tasks in a row (combo) | +5 bonus | Momentum reward |
| Complete a 15-min blitz | 50 XP bonus | Session completion |
| Complete all tasks in a room | 100 XP bonus | Major milestone |
| Daily streak day | 10 XP * streak day | Increasing value |
| Come back after absence | 2x XP for first session | Welcome back bonus |
| Take a progress photo | 15 XP | Encourages before/after |

**Level thresholds should be visible and meaningful:**
- Level 1-5: "Getting Started" -- unlock basic mascot accessories
- Level 6-10: "Finding Your Rhythm" -- unlock room themes
- Level 11-20: "Declutter Pro" -- unlock advanced AI features
- Level 21+: "Tidy Master" -- cosmetic prestige

### Variable Reward Schedule for Maximum Retention

The schema has `variableRewards` with types: `bonus_xp`, `streak_shield`, `mystery_collectible`, `mascot_treat`. But there is no trigger mechanism in the code.

**Recommended schedule:**
- Every 3rd task completion: 60% chance of bonus XP (small), 25% chance of mascot treat, 10% chance of collectible, 5% chance of streak shield
- Random timing creates anticipation without predictability
- Show the reward with a "mystery box" animation -- 2-second suspense before reveal
- The `MysteryReward` component exists in the room detail screen imports but is not well-integrated into the completion flow

---

## 5. Monetization Strategy

### Is the Pricing Right?

**Current pricing in code:**
- Weekly: $6.99/week (no trial)
- Monthly: $6.99/month (3-day trial)
- Annual: $39.99/year (3-day trial)

**The paywall UI shows:** $4.99/month and $39.99/year with a "Save 33%" badge. There is a discrepancy between the RevenueCat hook defaults ($6.99/month) and the paywall display ($4.99/month). This needs to be reconciled.

**Analysis:**
- $39.99/year ($3.33/month effective) is competitive. Sweepy is $12.99/year, Tody is ~$9.99/year, Tiimo is $54/year, Finch is ~$70/year.
- For an ADHD-first app with AI, $39.99/year is reasonable but not premium. The value proposition needs to clearly justify the price vs Sweepy/Tody which are 3-4x cheaper.
- The 3-day trial is too short. Industry standard for wellness apps is 7 days. Calm, Headspace, Finch, and Tiimo all use 7-day trials. 3 days is barely enough to form any habit.
- The weekly plan at $6.99/week ($363.48/year) is predatory. This exists to make monthly/annual look cheap by comparison (price anchoring), but it can generate App Store complaints.

**Recommended pricing:**
- Drop the weekly plan entirely
- Monthly: $6.99/month (7-day free trial)
- Annual: $39.99/year (7-day free trial) -- "Save 52%"
- Display: Show $39.99/year prominently with "$3.33/month" equivalent. Show monthly as comparison to make annual attractive.

### What Should Be Free vs Paid?

**Current gating:** Focus timer is Pro-only (checked at the top of `app/focus.tsx`). The rest of the gating is unclear -- the `useSubscription` hook is imported in `app/(tabs)/index.tsx` but the free room limit logic is soft.

**Recommended free tier (must be genuinely useful):**
- 1 room scan with full AI analysis
- All Phase 1 tasks (Quick Wins) in that room
- 15-Minute Blitz mode (this is the hook -- it must be free)
- Basic mascot (no customization)
- Basic streak tracking
- Up to 3 room scans total

**Behind paywall:**
- Unlimited room scans
- Phase 2 and Phase 3 tasks
- Photo progress tracking (before/after)
- Advanced mascot (feeding, accessories, growth)
- Detailed analytics
- Streak shields
- Priority task optimization
- All mascot personalities
- White noise / focus sounds (when built)

**Critical:** The 15-Minute Blitz MUST be free. It is the acquisition and retention hook. Gating it behind Pro (as the focus timer currently is) would kill conversion. Let users experience the full blitz, then paywall the sustained/multi-room experience.

### When Should the Paywall Appear?

**Current flow:** Onboarding step 13 (out of 13) is the paywall. It is the last thing before the app. `gestureEnabled: false` on the paywall screen in `_layout.tsx` means users cannot swipe back.

**Recommended:**
1. Onboarding ends with home screen, NOT paywall. Let users scan their first room for free.
2. Soft paywall appears after completing their first 15-minute blitz session -- the user has experienced the core value.
3. Second soft paywall when they try to scan a second room.
4. Hard paywall never -- always allow "Continue with free plan" option.

### RevenueCat Implementation Quality

The `useRevenueCat` hook is well-structured:
- Safely handles missing native module (Expo Go compatibility)
- Builds plans from offerings dynamically
- Handles trial detection, restore purchases, and subscription status
- Listens for subscription changes

**Issues:**
- The `REVENUECAT_IOS_KEY` falls back to empty string from env vars. If the env var is not set, the hook silently fails to initialize with no user-facing error. This could cause the paywall to appear broken.
- The hook defaults `selectedPlan` to `PRODUCT_IDS.monthly` but the paywall UI defaults to `annual`. These should match.
- There is no `checkSubscriptionStatus` call on app startup to verify the subscription is still active -- only on the paywall screen.

### Expected Conversion Rate

Industry benchmarks for ADHD/wellness apps:
- Free to trial: 15-25% (if paywall is shown at the right moment)
- Trial to paid: 40-60% (if trial is long enough to form habit -- 7 days)
- Overall free to paid: 6-15%

**With the current 3-day trial and end-of-onboarding paywall, expected conversion is 3-5%.** Changing to a 7-day trial with post-first-session paywall placement would likely push this to 8-12%.

---

## 6. Notification Strategy

### What Notification System Exists?

The notification system is actually one of the more thoughtful parts of the codebase:

**`services/notifications.ts`:**
- Daily reminders (configurable time)
- Streak reminders (8 PM if user hasn't cleaned today)
- Achievement notifications (badge unlocked, level up)
- Mascot messages
- Focus session complete
- Room complete

**`services/notificationTiming.ts`:**
- **Optimal timing algorithm** that tracks when users typically open the app and sends notifications 5-15 minutes before that time. This is actually quite sophisticated:
  - Stores last 50 session timestamps
  - Distinguishes weekday vs weekend patterns
  - Uses recency-weighted scoring (recent sessions count more)
  - Respects quiet hours (10 PM - 8 AM)
  - Minimum 4 hours between notifications
  - Auto-disables after 5 dismissed notifications (channel protection)

**Comeback Engine:**
- Shame-free welcome back messages when user returns after 2+ days
- Grace period notifications ("Your streak is protected for 48 hours")
- Comeback bonus notifications (1.5-2x XP)
- NEVER uses guilt language ("you haven't cleaned in X days")

### What Notifications Should Say for ADHD Users

The current messages are good. Examples from the code:

Good:
- "Dusty's ready when you are. Even 60 seconds counts."
- "No judgment here. Wanna do one tiny thing?"
- "Coming back is harder than starting. You did it."
- "Pop in for 60 seconds if you can. No pressure!"

These follow ADHD notification best practices:
- Low commitment ("60 seconds", "one tiny thing")
- No guilt or shame
- Warm and personal
- Celebrate returning, don't punish absence

### What Is Missing

1. **Context-aware notifications.** The notifications are random. They should reference the user's actual state: "Your kitchen has 2 tasks left -- one is just picking up the coffee cups." The room and task data exists but is not used in notification content.

2. **Completion celebration notifications.** When a user completes a room during the day, schedule a celebration notification for evening: "You crushed it today! Your bedroom is officially fresh."

3. **Social proof notifications.** "1,847 people cleaned today. You could be one of them." (Only if user has opted into this style.)

4. **Mascot-voiced notifications.** The `notifyMascotMessage()` function exists but is not called from any regular flow. Dusty should send a daily message in their chosen personality voice.

5. **Adaptive frequency.** The `recordNotificationDismiss()` function exists but only disables notifications after 5 dismissals. It should REDUCE frequency incrementally: 5 dismissals = every other day, 10 = twice a week, 15 = weekly.

### How to Avoid Notification Fatigue

The current system has good bones:
- Max 2 notifications per day
- 4-hour minimum spacing
- Auto-disable after 5 dismissals
- Quiet hours respected

**Add:**
- Message rotation (already exists -- `dayOfYear % OPTIMAL_MESSAGES.length`)
- A/B test notification copy to find highest open rates
- Let users choose notification personality: "Should Dusty be encouraging, funny, or matter-of-fact?"
- Never notify about something the user hasn't opted into (no social notifications if social features aren't used)

---

## 7. Retention & Churn Risk

### What Would Make Someone Delete This After 3 Days

1. **"I finished all my tasks and there's nothing to do."** The app gives you a task list from AI and when you finish it, there is no next step. No daily generation, no room decay, no new suggestions. The app becomes an empty room list.

2. **"The timer doesn't work when I switch apps."** The focus timer uses `setInterval` in JS. When the app goes to background, the interval stops. If a user starts a 15-minute timer, switches to play music, comes back, the timer shows the wrong time. This is a core feature failure that erodes trust.

3. **"I paid $6.99 and social features don't work."** The social/accountability features are still in the navigation (`social.tsx`, `accountability.tsx`). If a paying user discovers these are non-functional, it is a guaranteed 1-star review.

4. **"The mascot doesn't do anything."** The profile screen shows mood bars. The user wonders how to feed or interact with Dusty. There is no interaction screen. The mascot is decoration, not a feature.

5. **"It looks like every other app."** If the visual design does not differentiate from generic dark-mode apps, there is no emotional attachment. Users need to feel something when they open this app.

### What Would Make Someone Stay for 6 Months

1. **Rooms that evolve.** The room freshness should decay over time (every 7-14 days, room status changes from "Fresh" to "Needs love"). This creates a natural recurring loop without guilt -- "Your bedroom is ready for another quick pass."

2. **A mascot you care about.** If Dusty grows, evolves, unlocks accessories, and has visible personality tied to your cleaning behavior, users return to maintain the relationship. Finch proves this works over 6+ months.

3. **Visible long-term progress.** A "cleaning heatmap" (like GitHub's contribution graph) showing which days you cleaned over the last 3 months. The `activityLog` table in the schema already stores this data. It just needs visualization.

4. **Seasonal/themed content.** Monthly challenges, seasonal mascot accessories, holiday-themed cleaning checklists. This creates "content drops" that bring users back. The challenges schema exists.

5. **Before/after photo gallery.** Over time, the user accumulates a portfolio of room transformations. This is inherently satisfying to scroll through and shareable. The photo storage exists but there is no gallery view.

### Biggest Churn Risks

| Risk | Severity | When It Hits | Mitigation |
|------|----------|-------------|------------|
| No daily loop after initial scan | CRITICAL | Day 3-5 | Add room freshness decay + daily mission generator |
| Timer stops in background | HIGH | First focus session | Use `expo-task-manager` or local notification for timer completion |
| Mascot is non-functional | HIGH | Day 1 (profile view) | Build feeding/interaction mechanics or hide mood bars |
| Social features are fake | HIGH | When user explores | Remove social/accountability screens from V1 |
| No celebration on room complete | MEDIUM | After first room completion | Build full-screen celebration experience |
| Paywall blocks focus timer | MEDIUM | When free user tries timer | Make basic timer free |
| Onboarding too long | MEDIUM | First open | Cut to 8 steps max |

### Day 1, Day 7, Day 30 Experience

**Day 1 (Current):**
1. Open app --> 13-step onboarding --> paywall --> home screen
2. Scan a room --> AI analysis (impressive!) --> accept tasks
3. Complete 2-3 tasks --> see progress on room card
4. Close app
5. **No trigger to return**

**Day 1 (Should Be):**
1. Open app --> 8-step onboarding (including first room scan) --> home screen with tasks already loaded
2. "Start 15-Min Blitz" --> guided single-task mode with timer --> 3 tasks done --> celebration
3. Dusty celebrates, XP earned, streak started
4. Soft paywall: "Want to keep going? Unlock Phase 2 tasks."
5. Evening notification: "Great first day! Tomorrow, Dusty will have a suggestion ready."

**Day 7 (Current):** Depends entirely on whether user has tasks left. If they completed everything, the app has nothing for them. No room decay, no daily missions, no new content.

**Day 7 (Should Be):** "Your bedroom from last week is ready for a refresh. Dusty spotted 3 quick tasks." Room freshness has decayed slightly. New tasks generated. Weekly summary shows "7-day streak! You've cleaned for 1.5 hours this week." Mascot has grown/evolved. New achievement unlocked.

**Day 30 (Should Be):** Monthly cleaning challenge active. Photo gallery shows 4 room transformations. Dusty is Level 8 with a custom accessory. Heatmap shows 22 out of 30 days active. User feels proud and invested.

---

## 8. Feature Priority for V1

### ESSENTIAL for Launch (Must Ship)

1. **AI Room Scan + Task Breakdown** -- This works. Polish, don't rebuild.
2. **15-Minute Blitz Mode** -- Unified timer + task view. The hero feature.
3. **Room Detail with Task Checklist** -- Exists and is solid. Add celebration on completion.
4. **Progress Tracking** -- Exists. Add streak prominence on home screen.
5. **Paywall + RevenueCat** -- Exists. Fix trial length and paywall timing.
6. **Onboarding** -- Exists. Trim to 8 steps, include first scan.
7. **Task Completion Celebrations** -- CelebrationEngine exists. Wire it up everywhere.
8. **Notifications** -- Exist and are well-designed. Need context-awareness.
9. **Room Freshness Decay** -- Does not exist. Critical for daily loop.
10. **Auth (Login/Signup)** -- Exists.

### V1.1 (1-2 Weeks After Launch)

1. **Mascot feeding/interaction** -- Build the care loop
2. **Before/after photo comparison** -- The AI analysis exists; build the UI gallery
3. **Difficulty feedback** -- "Was this easier or harder?" after tasks
4. **Re-scan room** -- Take new photo to get updated tasks
5. **Streak shields** -- Automatic 48-hour grace period (schema exists)

### V1.2 (1 Month After Launch)

1. **Mascot accessories/customization** -- Unlockable via XP
2. **Variable rewards** -- Mystery drops every 3rd task
3. **Activity heatmap** -- GitHub-style contribution graph
4. **Monthly challenges** -- Against Dusty or personal goals
5. **Widget** -- iOS home screen widget showing today's mission

### V2 (3+ Months After Launch)

1. **Social/accountability** -- Build it properly with real connections
2. **Household features** -- Multiple people, shared rooms
3. **Smart home integration** -- Trigger robot vacuums
4. **White noise/ambiance** -- Focus sounds during cleaning
5. **Apple Watch complication** -- Timer on wrist

### Cut Entirely

1. **Social features** (`social.tsx`, `accountability.tsx`) -- Remove from navigation. Not functional.
2. **Collection/Collectibles** (`collection.tsx`) -- Adds complexity without retention benefit at launch
3. **Challenges** (`challenge/[id].tsx`) -- No social foundation to build on
4. **Insights** (`insights.tsx`) -- Progress tab is sufficient
5. **AR Collection** -- Schema only, zero implementation
6. **Leaderboards** -- Schema only, no critical mass of users to make meaningful
7. **White Noise** -- Schema only, no audio implementation

---

## 9. Technical Architecture Issues

### God Context Problem

`DeclutterContext.tsx` manages 17+ state variables in a single context:
- `user`, `rooms`, `stats`, `settings`, `activeRoomId`, `currentSession`
- `isAnalyzing`, `analysisError`, `isLoaded`
- `mascot`, `focusSession`
- `collection`, `collectionStats`, `activeSpawn`
- `pendingCelebration`, `syncError`, `isHydratingCloud`

Any change to ANY value triggers a re-render of every component consuming this context. When a user checks off a task (updating `rooms`), the profile screen, progress screen, settings screen, and every other consumer re-renders.

**Impact:** Noticeable lag on older devices when completing tasks rapidly. The combo system in room detail (which rewards fast consecutive completions) is undermined by the re-render overhead it causes.

**Fix:** Split into focused contexts: `RoomContext` (rooms + active room + analysis), `StatsContext` (stats + achievements), `SessionContext` (focus session + current session), `MascotContext` (mascot state), `SettingsContext` (settings + theme).

### Dual-Write Race Conditions

Every state change writes to AsyncStorage AND triggers a debounced Convex sync. The hydration guard uses:

```typescript
setTimeout(() => {
  isHydratingCloudRef.current = false;
}, 0);
```

This `setTimeout(fn, 0)` is a hack to delay clearing the hydration flag until the next microtask, hoping React's batched state updates have settled. This is fragile. A slow device or React Concurrent Mode could break this assumption, causing the sync effect to fire during hydration and overwrite cloud data with stale local data.

**Fix:** Use a proper state machine (loading -> hydrating -> ready -> syncing) instead of boolean flags and setTimeout hacks.

### Focus Timer Background Issue

The focus timer (`app/focus.tsx`) uses `setInterval` at line 137:

```typescript
intervalRef.current = setInterval(() => {
  setRemainingSeconds(prev => { ... });
}, 1000);
```

When the app goes to background on iOS, this interval is suspended. The timer freezes. When the user returns, the timer shows the wrong remaining time.

**Fix options:**
1. Store `timerStartedAt` timestamp. On foreground, calculate `elapsedSeconds = now - timerStartedAt`. This is the simplest fix.
2. Use `expo-task-manager` for background execution.
3. Schedule a local notification for timer completion time so even if the app is killed, the user knows when their session ends.

### Offline Support

The app writes to AsyncStorage first and syncs to Convex in the background. This means basic functionality works offline. The `OfflineIndicator` component shows a banner when offline.

**But:** AI room analysis requires network. There is no offline fallback for the camera/scan flow -- if you take a photo while offline, the analysis will fail and return generic fallback tasks. The app should queue the photo and analyze when connectivity returns.

### Performance Concerns

1. **Large base64 images in Convex actions.** The `analyzeRoom` action receives a full base64 image. For a 12MP iPhone photo, this could be 5-10MB of base64 text. Convex actions have a 1MB argument size limit (or 16MB for large actions). The camera screen resizes images, but the target size is not visible in the code.

2. **Room list with photos.** Each room card on the rooms tab fetches a room photo. With 10+ rooms, this could cause memory pressure. The `expo-image` component handles caching, but there is no pagination.

3. **SVG progress rings animation.** The progress screen renders 3 animated SVG circles with gradient fills. On older devices, this could cause frame drops during the animation.

---

## 10. Top 20 Improvements Ranked by Impact

### Tier 1: Ship-Blocking (Do These or Don't Ship)

**1. Build the 15-Minute Blitz as a unified timer + task flow.**
Create a single screen that shows one task at a time with a 15-minute countdown timer. Auto-advance to the next task on completion. Use `getFilteredTasks()` to select optimal tasks. Add confetti + haptic on each task done. Show summary on completion. This is THE feature that makes the app unique.
- Files: Create new `app/blitz.tsx`, modify `app/(tabs)/index.tsx` to link to it
- Effort: 2-3 days

**2. Fix the focus timer background execution.**
Replace `setInterval` with a timestamp-based approach: store `startedAt`, calculate remaining on foreground. Schedule a local notification for timer completion using `expo-notifications`.
- Files: `app/focus.tsx`
- Effort: 4 hours

**3. Remove social/accountability/collection/challenges screens from navigation.**
These are non-functional facades that will generate 1-star reviews. Remove them from the Stack navigator in `_layout.tsx`. Keep the code but make it unreachable.
- Files: `app/_layout.tsx`, remove navigation targets
- Effort: 30 minutes

**4. Add room freshness decay to create a daily return loop.**
Every 7 days without activity, a room's status should change from "Fresh" to "Needs love." Every 14 days, it should change to "Ready for a refresh." This creates a passive daily check-in motivation without guilt.
- Files: `context/DeclutterContext.tsx`, `app/(tabs)/index.tsx`, `app/(tabs)/rooms.tsx`
- Effort: 1 day

**5. Wire up `optimizeTaskOrder()` to the room detail screen.**
The personalized task ordering code exists but is never called. Import it in `app/room/[id].tsx` and use it to sort the task list based on the user's energy level and completion history.
- Files: `app/room/[id].tsx`, import from `services/taskOptimizer.ts`
- Effort: 2 hours

### Tier 2: High Impact (Do These Before Launch)

**6. Build a room completion celebration screen.**
When all tasks in a room are marked complete, show a full-screen celebration: before/after photo side-by-side (if photos exist), confetti animation from `CelebrationEngine`, Dusty dancing, XP breakdown, streak update, "Share your win" button. Use `CelebrationEngine.celebrateRoomComplete()` which already exists.
- Files: Enhance `RoomCompleteModal` in `components/room/`, trigger from `app/room/[id].tsx`
- Effort: 1 day

**7. Add a 3-second confetti animation with haptic feedback when a task is checked off.**
The `CelebrationEngine` has confetti particles, `Haptics.impactAsync` is used throughout. Wire `celebrateTaskComplete()` to every task checkbox. Use `Haptics.impactAsync(ImpactFeedbackStyle.Medium)` on check, then 200ms delay, then `Haptics.notificationAsync(NotificationFeedbackType.Success)`. Fire 15 confetti particles from the checkbox position.
- Files: `app/room/[id].tsx` task completion handler, `components/ui/CelebrationEngine.tsx`
- Effort: 4 hours

**8. Trim onboarding from 13 steps to 8.**
Current 13 steps: welcome, name, problem, living, struggles, energy, time, motivation, guide, building, preview, commitment, paywall. Cut: problem (step 3 -- combine with welcome), preview (step 11 -- unnecessary), commitment (step 12 -- move to after first session). This brings it to 10. Then merge living + struggles into one "About your space" step and time + motivation into one "Your style" step. Final: 8 steps.
- Files: `app/onboarding.tsx`, modify `STEP_SEQUENCE` array
- Effort: 3 hours

**9. Extend trial from 3 days to 7 days.**
Update RevenueCat product configuration and update all UI references. 3 days is not enough to form a habit. 7 days = one full weekly cycle = user has experienced daily missions, streak, and at least one room completion.
- Files: RevenueCat dashboard, `hooks/useRevenueCat.ts` default plans, `app/paywall.tsx`
- Effort: 1 hour (code) + RevenueCat config

**10. Move paywall from end of onboarding to after first completed blitz session.**
After the user completes their first 15-minute blitz, show the paywall with context: "You just cleaned for 15 minutes and completed 4 tasks. Unlock unlimited rooms and Phase 2 tasks." This converts at 2-3x the rate of a cold onboarding paywall.
- Files: `app/onboarding.tsx` (remove paywall step), `app/blitz.tsx` (add paywall trigger), `app/_layout.tsx`
- Effort: 4 hours

### Tier 3: Retention Boosters (V1.1)

**11. Add Dusty to the blitz/room detail screen as a floating companion.**
Show a small Dusty avatar (48x48px) in the bottom-left corner during cleaning. Dusty should react to task completions with a bounce animation and speech bubble showing `dustyReaction` text from the AI analysis. Use the mascot personality to determine reaction tone.
- Files: New `components/ui/MascotBubble.tsx`, integrate into `app/room/[id].tsx` and `app/blitz.tsx`
- Effort: 1 day

**12. Build the "Was this easier or harder?" feedback prompt.**
After completing a task, 30% of the time show a quick 3-option feedback: "Easier than expected / Just right / Harder than expected." Store as `difficultyFeedback` on the task (field already exists in type). Feed to `updateProfileFromHistory()` in `taskOptimizer.ts` to improve future time estimates.
- Files: `app/room/[id].tsx`, `services/taskOptimizer.ts`
- Effort: 4 hours

**13. Build the before/after photo comparison view.**
When a room is complete, prompt the user to take an "after" photo. Display side-by-side with the original scan photo using a slider (swipe to reveal before vs. after). The `ProgressComparison` component already exists. The `analyzeProgressStructured` function already exists. Wire them together.
- Files: `app/room/[id].tsx`, `components/ui/ProgressComparison.tsx`
- Effort: 1 day

**14. Add streak display to home screen.**
The home screen has no streak indicator. Add a small "Day 3" badge with a flame icon next to the greeting. Tapping it should navigate to the progress tab. The streak data exists in `stats.currentStreak`.
- Files: `app/(tabs)/index.tsx`
- Effort: 2 hours

**15. Make AI fallback room-type-aware.**
When `analyzeRoomImage()` fails, use the `roomType` parameter (passed from camera screen) to serve curated fallback tasks. Kitchen fallback: "Clear dirty dishes from counter (3 min), Wipe down stove top (2 min), Take out trash (1 min)." Bedroom fallback: "Make the bed (3 min), Pick up clothes from floor (5 min), Clear nightstand (2 min)."
- Files: `services/ai.ts`, `getFallbackAnalysis()`
- Effort: 2 hours

### Tier 4: Polish (V1.2+)

**16. Build mascot feeding/care mechanics.**
Task completion = feeds Dusty. Every 3 completed tasks restores one hunger bar. Every room completion restores energy. Daily visit restores happiness. Visible animations when feeding occurs. Dusty's mood affects their speech bubbles ("I'm so happy you're here!" vs "I'm a bit sleepy today but let's try one task.")
- Files: `context/DeclutterContext.tsx` (mascot state updates), new `app/mascot-care.tsx`
- Effort: 2-3 days

**17. Build the activity heatmap.**
GitHub-style contribution graph showing cleaning activity over the last 12 weeks. Each day is colored by activity level: none (gray), light (pale green), moderate (green), heavy (dark green). Data source: `activityLog` table in Convex schema.
- Files: New component `components/ui/ActivityHeatmap.tsx`, integrate into `app/(tabs)/progress.tsx`
- Effort: 1 day

**18. Add "Daily Mission" generation.**
Each morning (or on app open), generate a single "daily mission" based on: which room has decayed the most, which room has the most remaining Phase 1 tasks, and the user's current energy level. Show as the hero card on home screen. "Today's mission: Kitchen counter quick reset (8 min, 3 tasks)."
- Files: `app/(tabs)/index.tsx`, new `services/dailyMission.ts`
- Effort: 1 day

**19. Context-aware notification content.**
Replace random notification messages with room-specific content: "Your kitchen has 2 quick tasks left -- one is just wiping the counter." Use `rooms` data from AsyncStorage in the notification scheduling service.
- Files: `services/notificationTiming.ts`, `services/notifications.ts`
- Effort: 4 hours

**20. Split the god context into focused providers.**
Break `DeclutterContext.tsx` into: `RoomProvider` (rooms, activeRoom, analysis state), `StatsProvider` (stats, achievements, streaks), `SessionProvider` (focus session, blitz session), `MascotProvider` (mascot state, feeding), `SettingsProvider` (settings, theme). Each consumer only re-renders when its specific data changes.
- Files: Major refactor of `context/DeclutterContext.tsx` into 5 files
- Effort: 2-3 days

---

## Final Verdict

### What Declutter Gets Right

1. **The AI analysis prompt is world-class.** The 287-line Gemini system prompt with phase-based task generation, doom pile detection, per-task psychology fields, energy-adaptive difficulty, and subtask breakdown under 2 minutes is the best cleaning AI prompt that exists. This is the moat.

2. **The notification system is ADHD-aware and shame-free.** Optimal timing, quiet hours, channel protection, comeback engine, and shame-free copy. This is better than most shipping apps.

3. **The task optimizer is sophisticated.** Energy-aware scoring, visual impact prioritization, decision load avoidance, and learning from completion patterns. It is just not connected to the UI.

4. **The onboarding copy is emotionally intelligent.** "Clutter is a systems problem, not a character flaw." "We will size your next actions to your real energy, not your aspirational energy." This resonates with ADHD users.

5. **The paywall has good social proof.** Star ratings, user quote, money-back guarantee, promo code option, and benefit-oriented copy (in the latest version).

### What Declutter Gets Wrong

1. **The 15-Minute Blitz -- the hero feature -- does not exist.** The timer and the task list are on separate, disconnected screens. This is like having a car with the steering wheel in the front seat and the pedals in the back seat.

2. **The mascot is a database schema, not a feature.** Hunger, energy, happiness bars exist but have no input mechanism, no interaction screen, no connection to cleaning behavior, and no growth visualization.

3. **There is no daily return loop.** Once you finish your initial tasks, the app has nothing new for you. Rooms don't decay, daily missions don't generate, and there is no content rotation.

4. **The task optimizer is dead code.** The most ADHD-aware part of the codebase -- personalized task ordering based on energy, completion history, and decision avoidance -- is never called from any screen.

5. **Non-functional features are still accessible.** Social, accountability, collection, and challenges screens are reachable from the navigation. Each one is a potential 1-star review.

### The One Thing That Would 10x Retention

**Build the 15-Minute Blitz as described in improvement #1.** A unified, guided, timed, one-task-at-a-time cleaning experience with AI-selected tasks, auto-advancement, celebration on each completion, and a summary screen at the end. If you only build one thing from this document, build this.

This feature:
- Creates a consistent 15-minute daily habit (the return loop)
- Uses the AI analysis (the moat) in an addictive format
- Provides immediate dopamine via task completion celebrations
- Generates shareable before/after content
- Gives the mascot a context to appear in
- Creates natural paywall moments (unlock more blitz sessions)
- Differentiates from every competitor

**The app has a world-class AI brain and a dead body.** Connect them. Wire the task optimizer to a guided session experience, put Dusty in the room while users clean, celebrate every completion, and generate something new to do tomorrow. Do those four things and this app ships.
