# Declutter: Competitive Strategy & Architecture Audit

**Date:** 2026-03-20
**Prepared by:** Product Architecture AI Audit

---

## Section 1: Competitive Landscape

### 1.1 Competitor Matrix

| App | Rating | Pricing | ADHD-First | AI Photo | Mascot/Pet | Gamification | Social | Offline |
|-----|--------|---------|------------|----------|------------|-------------|--------|---------|
| **Declutter** | N/A (pre-launch) | TBD | YES | YES | YES | Deep (XP, badges, streaks, leagues, collectibles) | Challenges, accountability partners | Partial |
| **Tody** | 4.8/5 (8.5K) | $7 one-time / $30/yr family sync | No | No | No | Light (visual progress bars) | Family sync only | Yes |
| **Sweepy** | ~4.7/5 | $3.99/mo or $19.99/yr | No | No | No | Moderate (streaks, leaderboard, currency) | Household collaboration | No |
| **Unfuck Your Habitat** | ~3.5/5 | $1.99 one-time | Sort-of (motivational) | No | No | Light (achievement stars) | Facebook sharing only | Yes |
| **Habitica** | ~4.2/5 | Free / $4.99/mo premium | No (general habits) | No | Avatar (RPG) | Deep (RPG mechanics, quests, parties) | Parties, guilds, shared health | No |
| **Finch** | 4.9/5 (460K ratings) | Free / ~$15/yr iOS | Mental health focus | No | YES (pet bird) | Moderate (pet growth, accessories) | Friend trees | Partial |
| **Goblin Tools** | Mixed (fake app issues) | Free website / $3 app | YES | No | No | None | None | Yes (web) |
| **Clutterfree** | 3.7/5 | $3.99/mo after 14-day trial | No | Room photos (manual) | No | Light (achievements) | No | No |
| **Tidy/Chore Snap** | ~4.5/5 | Freemium | Somewhat | YES (AI photo) | No | Light | No | No |
| **Tiimo** | 4.7/5 (App of the Year 2025) | ~$9.99/mo | YES (neurodivergent) | No | No | Moderate (visual timelines) | No | No |

### 1.2 Market Size & Opportunity

- **ADHD Apps Market:** $1.91B (2024) growing to $4.06B (2029) at 11.9% CAGR
- **Adult ADHD Segment:** $1.16B (2025), 41% market share, growing at 15.3% CAGR
- **Home Organization Products:** $13.69B (2024), growing at 4.3% CAGR
- **Key stat:** 62% of ADHD users rely on mobile apps to manage symptoms
- **Benchmark:** Finch earns ~$2.9M/month across platforms with 13M+ total downloads

### 1.3 User Sentiment Analysis (from reviews)

**What users LOVE in competing apps:**
- Tody: "Game-changer for cleaning routines," visual progress tracking
- Sweepy: "Stopped arguments about chores," collaborative leaderboards
- Finch: "Only self-care app I've been consistent with," pet companionship drives retention
- Habitica: Party damage system creates social accountability
- Goblin Tools: "Life-changing for my ADHD brain," instant task breakdown

**What users HATE in competing apps:**
- Tody: No ADHD accommodations, overwhelming for disorganized people
- Sweepy: Subscription fatigue, no AI assistance
- Unfuck Your Habitat: Outdated UI, aggressive tone doesn't work for everyone
- Habitica: Too complex for non-gamers, steep learning curve
- Clutterfree: Low quality (3.7 stars), can't delete photos, basic functionality
- Goblin Tools: Fake app store clones, no cleaning-specific features

---

## Section 2: Declutter's Competitive Advantages

### 2.1 What We Do That NO ONE Else Does

**The Declutter Moat: AI + ADHD + Mascot + Gamification in ONE app**

No competitor combines all four pillars:

| Capability | Closest Competitor | Declutter Advantage |
|-----------|-------------------|-------------------|
| AI photo room analysis | Tidy/Chore Snap | We generate ADHD-optimized tasks with energy levels, decision load, resistance handlers |
| ADHD-first design | Goblin Tools, Tiimo | We're the only app that combines ADHD task design WITH cleaning-specific AI |
| Virtual pet companion | Finch | Finch is general self-care; our mascot is cleaning-specific and reacts to room progress |
| Deep gamification | Habitica | Habitica is general; our XP/leagues/collectibles are cleaning-contextual |
| Comeback Engine | Nobody | Shame-free re-engagement with grace periods is genuinely novel |
| Visual impact prioritization | Nobody | AI sorts tasks by "what will look most different" -- critical for ADHD dopamine |
| Energy-adaptive tasks | Nobody | Exhausted? Get mindless tasks. High energy? Get challenging ones |
| Decision load filtering | Nobody | ADHD users who can't handle choices get zero-decision tasks |

### 2.2 Unique Moats (Hard to Copy)

1. **Comeback Engine Philosophy:** The entire shame-free re-engagement system (48hr grace, cumulative > streak, comeback bonus XP) is a product philosophy, not just a feature. Competitors would need to redesign their entire engagement model.

2. **AI + ADHD Task Model:** Tasks have `energyRequired`, `decisionLoad`, `visualImpact`, `resistanceHandler`, `whyThisMatters`, and `destination` fields. This is a deeply ADHD-informed data model that took real user research. The task schema is 25+ fields deep -- competitors have 5-6.

3. **Room Freshness Decay System:** Different rooms decay at different rates (kitchen 15pts/day vs garage 2pts/day). This drives re-engagement without guilt messaging.

4. **Variable Reward Hooks:** Duolingo-style mystery drops every 3rd task (bonus XP, streak shields, collectibles, mascot treats). Weighted randomness creates anticipation.

### 2.3 Positioning Statement

> **Declutter is the only cleaning app built for ADHD brains.**
> Take a photo of your messy room. AI breaks it into tiny, dopamine-friendly tasks sorted by energy level and visual impact. Your virtual companion cheers you on. No guilt. No shame. Just progress.

---

## Section 3: Architecture Issues & Fixes

### 3.1 Critical: DeclutterContext.tsx is a God Object (1100+ lines)

**Problem:** DeclutterContext.tsx manages user state, rooms, stats, settings, mascot, focus sessions, collections, sync, celebrations, and comeback bonuses ALL in a single React Context. This causes:
- Every state change re-renders every consumer
- Extremely difficult to test individual features
- Stale closure bugs (already mitigated with refs but fragile)
- New developers can't navigate the file

**Recommendation:** Split into 3-4 focused contexts post-launch. Pre-launch this is NOT ship-blocking because:
- The ref-based approach for statsRef prevents the worst stale-closure bugs
- React batching handles most re-render concerns
- The debounced save/sync prevents excessive I/O

**Post-Launch Split Plan:**
```
UserContext       - user profile, auth state, onboarding
RoomContext       - rooms, tasks, photos, analysis
EngagementContext - stats, badges, streaks, comebacks, XP, leaderboard
CompanionContext  - mascot, collectibles, spawn events, focus sessions
```

**Priority:** Post-launch (Week 2-3 after launch)

### 3.2 Critical: N+1 Query Problem in `sync.getUserState`

**Problem:** In `convex/sync.ts`, the `getUserState` query fetches rooms, then for EACH room fetches photos + tasks, then for EACH task fetches subtasks. For a user with 10 rooms, 15 tasks each, 3 subtasks each: that's 1 + 10 + 10 + 150 + 150 = 321 database queries in a single call.

**Impact:** At scale (10K+ users), this will hit Convex rate limits and cause slow cold loads.

**Fix:** Convex doesn't support JOINs, but we can optimize by:
1. Using `by_userId` indexes on tasks/subtasks/photos to fetch all at once
2. Client-side assembly instead of per-room loops

**Priority:** Ship-blocking at scale (fix before 5K users)

### 3.3 High: Full-Replace Sync Strategy is Wasteful

**Problem:** `replaceUserState` deletes ALL user data then re-inserts everything on every sync. A user with 200 tasks triggers 200+ delete operations and 200+ insert operations every 5 seconds (debounce).

**Impact:**
- Unnecessary Convex bandwidth/compute costs
- Risk of data loss during partial writes (delete succeeded, insert failed)
- ID instability (new Convex IDs generated each sync)

**Recommendation:** Move to incremental sync:
1. Track dirty flags on local state changes
2. Only sync changed entities
3. Use `patch` operations for updates instead of delete+insert

**Priority:** Post-launch but before 1K users (cost optimization)

### 3.4 High: Dual Badge Check (Client + Server)

**Problem:** Badge checking runs in BOTH DeclutterContext (client-side `checkBadges`) AND Convex (`badges._checkAndUnlockInternal`). The client-side check uses `checkBadges()` which duplicates the exact same logic. This means:
- Same badge can be unlocked twice (race condition)
- Client badge list gets out of sync with server badge list
- Wasted computation

**Fix:** Remove client-side badge checking entirely. Trust the server. The server already sends push notifications for new badges.

**Priority:** Pre-launch (data integrity issue)

### 3.5 Medium: Offline Capability Gaps

**Problem:** The app works offline for local data (AsyncStorage), but several features fail silently:
- AI photo analysis requires internet (has fallback -- good)
- Cloud sync fails silently (shows error -- good)
- Room creation calls Convex API but falls back to local ID (good)
- Photo upload requires internet (no queue for retry -- bad)
- Leaderboard, accountability, social features all require internet (expected)

**What breaks:** Photo uploads are fire-and-forget. If the user takes a photo offline, it's stored locally but the Convex upload never retries. When they come back online, the photo won't be in the cloud.

**Fix:** Implement a simple upload queue in AsyncStorage that retries on next app open.

**Priority:** Post-launch (edge case for most users)

### 3.6 Medium: Task History Unbounded in AsyncStorage

**Problem:** `taskOptimizer.ts` stores up to 500 task completion events in AsyncStorage under `@declutterly_task_history`. This grows linearly and is parsed/stringified on every task completion.

**Current mitigation:** Capped at 500 (line 107), which is reasonable.

**Verdict:** Acceptable for launch. Monitor AsyncStorage size in production.

### 3.7 Low: Schema Missing Compound Indexes

**Problem:** Several queries would benefit from compound indexes:
- `tasks` table: `by_userId_completed` for "get all incomplete tasks for user"
- `activityLog`: `by_userId_date` exists (good)
- `badges`: `by_userId_badgeId` would prevent duplicate badge insertion race conditions

**Priority:** Post-launch optimization

### 3.8 Low: Collectible Spawn Probability Bug

**Problem:** In `spawnCollectibleAction`, cumulative probability can exceed 1.0 because all collectible spawn chances are summed. If total spawn chances add up to more than 1.0, lower-rarity items at the end of the array never spawn.

**Current collectible spawn chances sum:** 0.4 + 0.3 + 0.15 + 0.05 + 0.12 + 0.12 + 0.06 + 0.05 + 0.02 + 0.04 + 0.04 + 0.015 + 0.005 + 0.2 + 0.03 + 0.003 = 1.593

The cumulative probability exceeds 1.0, so legendary items (Clean Dragon at 0.005, Cleaning Crown at 0.003) have ZERO chance of spawning because earlier items consume the entire probability space.

**Fix:** Normalize probabilities or use independent rolls per rarity tier.

**Priority:** Post-launch (affects engagement but not core functionality)

---

## Section 4: Feature Gap Analysis

### 4.1 Table Stakes (MUST have for launch)

| Feature | Status | Notes |
|---------|--------|-------|
| AI photo analysis | DONE | Gemini 2.5 Flash Lite via Convex server actions |
| Task breakdown with subtasks | DONE | Rich task model with phases, zones, dependencies |
| Streaks with grace period | DONE | 48hr grace, comeback bonus XP |
| Push notifications | DONE | Shame-free, room-aware smart reminders |
| Onboarding flow | DONE | Energy level, living situation, mascot selection |
| Room management (CRUD) | DONE | 20 room cap, all 8 room types |
| Progress photos (before/after) | DONE | Photo upload to Convex storage |
| Cloud sync | DONE | Full state sync with debouncing |
| Auth (signup/login) | DONE | Convex Auth with anonymous support |
| Settings (theme, notifications, etc.) | DONE | Full settings screen |
| Paywall/subscription | DONE | RevenueCat integration |

### 4.2 Moat Features (Differentiators we have)

| Feature | Status | Competitor Gap |
|---------|--------|---------------|
| ADHD energy-level filtering | DONE | NO competitor does this |
| Decision load filtering | DONE | NO competitor does this |
| Visual impact task sorting | DONE | NO competitor does this |
| Comeback Engine (shame-free) | DONE | NO competitor does this |
| Virtual pet mascot | DONE | Only Finch has pet (different domain) |
| Variable rewards (mystery drops) | DONE | Only Habitica (different domain) |
| Weekly leagues | DONE | Only Duolingo/Sweepy |
| Accountability partners | DONE | Only Sweepy (household only) |
| Room freshness decay | DONE | NO competitor does this |
| "One Tiny Thing" micro-tasks | DONE | NO competitor does this |
| Task resistance handlers | DONE | NO competitor does this |
| Collectible system | DONE | Only Habitica (different domain) |

### 4.3 Growth Drivers (Add post-launch)

| Feature | Priority | Rationale |
|---------|----------|-----------|
| **Recurring tasks / maintenance mode** | P1 (Month 1) | After initial declutter, users need daily maintenance tasks to stay engaged |
| **Apple Watch / widget** | P1 (Month 1) | Quick task check-off from wrist/home screen drives daily engagement |
| **Smart home integration** | P2 (Month 2) | Sweepy added this in 2025 -- Siri shortcuts, HomeKit triggers |
| **Family/household sharing** | P2 (Month 2) | Sweepy's #1 feature; our accountability partners are 1:1 only |
| **Before/after gallery** | P2 (Month 2) | Social proof + personal motivation; shareable content |
| **Timer/Pomodoro improvements** | P2 (Month 2) | Focus session with ambient sounds exists but needs polish |
| **Seasonal events / limited collectibles** | P3 (Month 3) | Duolingo-style FOMO drives daily opens |
| **AI chat assistant** | P3 (Month 3) | "How do I organize my closet?" -- conversational cleaning advice |
| **Donation tracking with tax receipts** | P3 (Month 3) | Clutterfree has this; useful for decluttering |

### 4.4 Features to NEVER Add (Stay Focused)

| Feature | Why NOT |
|---------|---------|
| General habit tracking | Habitica owns this; dilutes our cleaning focus |
| Full home inventory | Different product category entirely |
| Professional cleaning service booking | Marketplace complexity, liability issues |
| Social media feed / timeline | Engagement trap; conflicts with "get off your phone and clean" |
| Complex scheduling (weekly/monthly calendars) | ADHD users don't follow schedules; that's the whole point |
| Ads | Kills premium positioning and ADHD users are especially distracted by ads |

---

## Section 5: Monetization Strategy

### 5.1 Competitor Pricing Comparison

| App | Model | Free Tier | Premium Price | Revenue Estimate |
|-----|-------|-----------|--------------|-----------------|
| Tody | One-time + subscription | Full app (solo) | $7 one-time / $30/yr | Low millions |
| Sweepy | Freemium | 1 user, basic rooms | $3.99/mo or $19.99/yr | Low millions |
| Finch | Freemium | Generous free tier | ~$15/yr iOS | ~$2.9M/month |
| Habitica | Freemium | Core features free | $4.99/mo | ~$1M/month |
| Clutterfree | Free trial + subscription | 14-day trial | $3.99/mo ($48/yr) | < $500K/month |
| Tiimo | Freemium | Basic planner | ~$9.99/mo | Growing rapidly |

### 5.2 Recommended Pricing for Declutter

**Model: Generous Free Tier + Premium Subscription**

Following Finch's proven strategy (generous free tier drives word-of-mouth, premium unlocks "nice to have" features).

**Free Tier (forever):**
- 3 rooms max
- 1 AI photo analysis per day
- Basic task breakdown
- Mascot with limited customization
- Streak tracking with grace period
- Basic badges

**Premium ("Declutter Pro"):**
- Unlimited rooms
- Unlimited AI photo analyses
- Progress comparison (before/after AI analysis)
- All mascot accessories and customization
- Full collectible collection
- Weekly leagues and leaderboard
- Accountability partner feature
- Priority support
- Advanced stats and insights
- Focus mode with ambient sounds

**Pricing:**
- **Weekly:** $2.99/week (for impulse buyers -- high LTV if they stay)
- **Monthly:** $6.99/month
- **Annual:** $39.99/year ($3.33/month -- 52% savings, anchor this)
- **Lifetime:** $99.99 (limited offer for early adopters)

**Why this pricing:**
- Below Tiimo ($9.99/mo) and Clutterfree ($3.99/mo)
- Comparable to Sweepy ($3.99/mo) but with far more features
- Annual price matches Finch territory (~$15-40/yr)
- Weekly option captures ADHD impulse purchases (Duolingo does this successfully)

### 5.3 Revenue Projections

| Users | Free % | Paid % | Monthly Revenue | Annual Revenue |
|-------|--------|--------|----------------|---------------|
| 10K | 95% | 5% (500 paid) | $3,495 | $41,940 |
| 50K | 93% | 7% (3,500 paid) | $24,465 | $293,580 |
| 100K | 92% | 8% (8,000 paid) | $55,920 | $671,040 |
| 500K | 90% | 10% (50,000 paid) | $349,500 | $4,194,000 |

*Assumes average $6.99/mo across all tiers (weighted toward annual)*

### 5.4 Trial Strategy

- **7-day free trial** of all premium features for new users
- Trial starts AFTER onboarding (so they've already set up a room and seen value)
- Soft paywall: show premium features greyed out with "PRO" badge, not hard block
- Comeback bonus: Returning users after 7+ days get 3-day premium trial as welcome back gift

---

## Section 6: App Store Optimization (ASO)

### 6.1 Keyword Strategy

**Primary Keywords (high volume, medium competition):**
- "cleaning app" / "house cleaning app"
- "declutter" / "decluttering app"
- "ADHD cleaning" / "ADHD chores"
- "cleaning motivation"

**Secondary Keywords (lower volume, low competition):**
- "messy room help"
- "cleaning for ADHD"
- "photo cleaning app"
- "AI cleaning"
- "cleaning game"
- "room organizer"

**Long-tail Keywords (very low competition, high intent):**
- "ADHD cleaning app"
- "AI room cleaning helper"
- "cleaning app with pet"
- "shame free cleaning app"
- "cleaning app for overwhelmed"

### 6.2 App Store Title & Subtitle

**Title:** Declutter: AI Cleaning for ADHD
**Subtitle:** Photo Tasks, Pet Companion & XP

This hits: AI, cleaning, ADHD (primary keywords) + photo, pet, gamification (differentiators)

### 6.3 Screenshot Strategy (6 screenshots)

1. **Hero shot:** Messy room photo -> AI-generated task list (shows core value prop)
2. **Energy selector:** "How's your energy?" with exhausted/low/moderate/high options
3. **Mascot companion:** Mascot cheering during task completion with XP animation
4. **Before/After:** Progress comparison with AI encouragement
5. **Achievements:** Badge collection, streak display, weekly league
6. **Comeback:** "Welcome back!" screen with bonus XP (shows ADHD empathy)

### 6.4 App Store Description (First 3 lines most important)

> Messy room? Take a photo. AI breaks it into tiny, ADHD-friendly tasks sorted by your energy level. Your virtual companion cheers you on. No guilt, no shame -- just progress.
>
> Declutter is the first cleaning app designed specifically for ADHD brains. We know starting is the hardest part, so we make it ridiculously easy.

### 6.5 Category Positioning

**Primary Category:** Productivity
**Secondary Category:** Health & Fitness

Productivity ranks better for "cleaning app" searches. Health & Fitness captures the ADHD/mental health audience.

---

## Appendix: Technical Debt Priority Matrix

| Issue | Impact | Effort | Priority |
|-------|--------|--------|----------|
| Collectible spawn probability bug | Low (engagement) | 30 min | Fix now |
| Dual badge checking (client+server) | Medium (data integrity) | 2 hours | Fix now |
| N+1 query in getUserState | High at scale | 4 hours | Fix before 5K users |
| Full-replace sync strategy | High (cost) | 2-3 days | Fix before 1K users |
| Split DeclutterContext | Medium (maintainability) | 1 week | Post-launch Week 2 |
| Photo upload retry queue | Low (edge case) | 4 hours | Post-launch Month 1 |
| Compound indexes on schema | Low (performance) | 1 hour | Post-launch Month 1 |
