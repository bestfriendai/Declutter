# Declutter App -- Brutal Honest Review
**Date:** March 17, 2026
**Scope:** Design (Pencil), Codebase, User Flow, Competitor Analysis

> This document is a no-bullshit audit of the Declutter app. It covers what's broken, what's mediocre, and what needs to change before this ships. Read it all before touching any code.

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Design Review (Pencil)](#design-review)
3. [Codebase & Functionality Review](#codebase--functionality-review)
4. [Competitor Analysis Summary](#competitor-analysis-summary)
5. [The Redesign Playbook](#the-redesign-playbook)

---

## Executive Summary

**Current grade: C+**

The app has a solid concept -- ADHD-first cleaning with AI + gamification -- but the execution is spread too thin. There are ~17 screens, half of which are half-built facades. The design is monochromatic and visually monotonous. The mascot -- the emotional core of the app -- is literally a gray circle. Social features are fake. The focus timer breaks in background. The onboarding is 10 steps for an app targeting people who can't start things.

**The core problem:** This is a prototype with 15 features pretending to be a shipping app with 5. Strip it down, polish what matters, and ship that.

**What should ship in v1:**
1. AI Room Scan -> Task Breakdown
2. Timer-Guided Cleaning Sessions (15-min blitz)
3. Progress Tracking (rooms + streaks)
4. Mascot (actually designed, actually animated)
5. Paywall

**What should NOT ship in v1:** Social, Accountability, Leaderboards, Collection, Insights, Challenges. Cut them all.

---

## Design Review

### Overall Verdict
This is a **B- / C+ effort**. The dark mode has decent bones, but every screen uses the same frosted-glass card treatment, the color palette is almost entirely monochrome, and light mode is an afterthought. It looks like a "competent indie app," not a "premium wellness product." It would not compete visually with Calm, Headspace, or Finch.

### Systemic Design Issues

#### 1. Monochromatic Everything
The dark mode palette is almost entirely `#0A0A0A` backgrounds with `#FFFFFF0F` (6% white) card fills and `#FFFFFF12` (7% white) borders. Every card, button, and section uses the same frosted-glass-on-black treatment. The result is **visually monotonous**. Nothing pops. Nothing surprises. The only real color is on the paywall (gold gradient) and the task card left borders (3px colored accents).

Compare to:
- **Headspace:** Playful illustrations, varied color per section
- **Calm:** Nature photography, deep blues and greens
- **Finch:** Pastel character art, warm and inviting
- **Tiimo:** 3,000+ colors and custom icons

Those apps use color to create emotional states. This app uses the absence of color and calls it "calm." **Calm and boring are not the same thing.**

#### 2. Glass-Morphism Overuse
Every single card uses: `cornerRadius: 20`, `fill: #FFFFFF0F`, `stroke: #FFFFFF12`, `effect: background_blur + shadow`. The streak card, room cards, stat cards, badge cards, XP card, challenge card, task cards -- they ALL look identical. When everything is glass, nothing stands out.

#### 3. Light Mode is an Afterthought
The dark mode is the primary design. Light mode is a mechanical inversion. The glass-morphism cards that work in dark mode become **nearly invisible** in light mode. `#FFFFFF0F` fill on `#F8F8F8` background = 1% difference. Cards vanish. Light mode looks like a wireframe.

#### 4. ADHD-Hostile Patterns (Ironic)
Despite targeting ADHD users, several patterns work against the ADHD brain:
- **Too many items** visible at once on Home and Progress screens
- **No clear single action** -- multiple CTAs compete for attention
- **Low contrast text** everywhere (gray on dark gray) requires focused reading
- **Identical-looking cards** require careful reading to differentiate (can't scan)
- **Small tap targets** -- 22px checkboxes (Apple HIG minimum is 44px)
- **"Accept All 9 Tasks"** with no gentler option creates overwhelm
- **Zero dopamine moments** -- no celebration animations, no color bursts, no sound effects

#### 5. Missing States
The designs show only happy-path completed states. There are NO:
- Empty states (new user with 0 rooms, 0 tasks, 0 badges)
- Error states
- Loading states (except one screen)
- Celebration/completion states (what happens when you finish a room?)
- Streak-broken states (what shows when you miss a day?)
- "Welcome back after absence" states

**These are critical for an ADHD app where emotional safety around failure is paramount.**

#### 6. The Mascot Doesn't Exist
The mascot customization screen -- the screen where you're supposed to meet and bond with your cleaning companion -- shows **a blank gray circle** where the mascot should be. "Dusty" is referenced throughout the app but has no visual design. This is the single most important emotional anchor in the app and it's missing entirely.

#### 7. Price Inconsistency
Main paywall shows $4.99/month or **$39.99/year**.
Onboarding V2 paywall shows $4.99/month or **$29.99/year**.
That's a 25% price difference on the annual plan between two screens in the same app.

### Screen-by-Screen Issues

#### Home Screen
- Greeting + date + motivational quote = 4 lines of low-contrast text before anything actionable
- The quote at 12px italic with 0.56 opacity is essentially invisible
- Streak card and hero card compete for attention -- neither wins
- Room cards (Bedroom 42%, Kitchen 25%) are visually identical. No differentiation between almost-done and barely-started
- Sparkle decorations feel randomly placed at 20-35% opacity

#### Onboarding V1 (3-screen)
- **The top 60% of each onboarding screen is a black void.** Presumably placeholder for illustrations. Cannot ship like this.
- The copy is decent ("Scan Any Room", "AI Breaks It Down") but without visual support it lands flat

#### Splash Screen
- A leaf icon, the word "Declutter", a tagline, and two buttons. Zero emotional hook.
- Compare to Finch's charming egg hatching or Calm's landscape. This looks like a template.

#### Auth (Sign In / Sign Up)
- Social auth buttons are styled identically to form inputs -- no visual differentiation between an input field and a button
- The "or" divider has no line. Looks unfinished.

#### Room Detail
- One of the better screens. Room photo at top, 65% progress ring, color-coded task list.
- But: checkboxes are 22x22px (too small), phase progress bars are 4px tall, all task cards look identical

#### Analysis Results
- "Accept All 9 Tasks" is a high-commitment action. No "Start with just 3" option. Decision paralysis territory for ADHD users.

#### Progress Screen
- Triple-redundancy: activity rings show 82%, sub-percentages show 85%/72%/90%, stat cards show 24/156/12. Pick ONE way to tell the story.
- Weekly bar chart has no labels, no axis, no values. Meaningless data visualization.

#### Achievements
- Badge icons are standard Unicode emoji (star, lightning, fire). Not custom art. Every competitor (Duolingo, Finch, Habitica) has custom illustrated badges. These feel cheap.
- Locked badges with `#555555` lock icon barely register visually

#### Social
- Avatar row is 5 identical gray circles with single letters. No personality.
- Activity feed ("Jamie finished Kitchen Reset") has zero celebration. No confetti, no congrats.

#### Accountability
- Check-in history dots (W1-W5) are unlabeled gray circles. No visual encoding of state.

#### Focus Mode
- Timer ring with gold accent is visually strong
- "Small progress is still progress" motivational text at bottom is at such low opacity it's invisible

#### Collection
- Badge icons are lucide icons -- a "Legendary" badge should feel LEGENDARY, not like a settings menu icon
- 4 unlocked to 2 locked visible makes collection feel empty and discouraging

#### Camera
- No clear indication of which room type pill is selected
- Instruction text is very small and easy to miss

---

## Codebase & Functionality Review

### Critical: Features That Don't Work

| Feature | Status | Problem |
|---------|--------|---------|
| Social connections | Facade | Every connection displays as "Connection" -- names are hardcoded |
| Accountability check-ins | Fake | "Send Check-In" shows an `Alert.alert()`. Nothing is actually sent. |
| removeConnection() | Stub | Literally a no-op with a TODO comment |
| Focus timer | Broken | Uses `setInterval` in JS. Stops when app goes to background. No background timer, no completion notification. |
| Promo codes | Misleading | Opens a `mailto:` link to support. Not actual promo code redemption. |
| Leaderboards | Schema only | Database schema exists, no UI |
| Variable rewards | Schema only | Database schema exists, unclear if drops fire |
| Accountability pairs | Schema only | Database schema with nudge tracking, but UI doesn't use it |
| White noise | Schema only | `focusWhiteNoiseType` in settings schema (rain, ocean, forest, cafe) but no audio playback exists |
| AR collection | Schema only | `arCollectionEnabled` in settings but no AR feature exists |
| XP system | Display only | Focus timer shows "+XP earned" but doesn't actually call any XP-granting function |

### Critical: Onboarding is an ADHD Dropout Factory
The onboarding is **10 steps** before a user can do anything:
1. Welcome
2. Intro
3. Name
4. Living situation (quiz)
5. Cleaning struggles (quiz)
6. Energy level (quiz)
7. Time availability (quiz)
8. Motivation style (quiz)
9. Mascot selection
10. Loading / Plan preview
11. Commitment
12. Paywall (gesture-disabled -- can't swipe back)

For ADHD users -- the target audience -- most will abandon by step 4. The V2 12-screen flow has better psychological design but is even longer.

### Critical: The App Won't Pass App Store Review
1. Social features that don't work will generate immediate 1-star reviews
2. Focus timer that stops in background is a core feature failure
3. Paywall with `gestureEnabled: false` (can't swipe back) may be flagged as manipulative
4. Two different prices for the same annual plan

### Major: Dual Design Systems
The codebase uses TWO different styling approaches:
1. **Pencil-matched screens** (home, rooms, progress, profile): Inline hex colors like `isDark ? '#FFFFFF' : '#1A1A1A'`, custom fonts
2. **Legacy screens** (collection, focus, challenge, mascot): Import from `Typography`, `Spacing`, `BorderRadius` theme files

Half the app looks like a polished 2026 design, half looks like a different app entirely.

### Major: God Context
`DeclutterContext.tsx` manages 17+ pieces of state in a single context: user, rooms, stats, settings, activeRoomId, currentSession, isAnalyzing, analysisError, isLoaded, mascot, focusSession, collection, collectionStats, activeSpawn, pendingCelebration, syncError, isHydratingCloud. Any change to ANY value re-renders every consumer.

### Major: AI Failures Are Silent
`services/ai.ts` catches ALL errors and returns `getFallbackAnalysis()` -- 3 generic tasks regardless of room type. Users get "Pick up any visible trash" with no indication that AI failed. The `_context` parameter in the fallback is completely unused.

### Major: Dual-Write Race Conditions
Every state change writes to AsyncStorage AND triggers a debounced Convex sync. The hydration logic has a `setTimeout(() => { isHydratingCloudRef.current = false; }, 0)` hack that screams race condition.

### Moderate Issues
- XP/Level calculation duplicated in 3 places (profile, achievements, context)
- Room icon mapping duplicated in home and rooms tabs
- Date formatting scattered instead of centralized
- `TouchableOpacity` (deprecated) still used in some screens while others use `Pressable`
- Hundreds of hardcoded rgba values instead of using Colors constant
- Deleted `MascotContext.tsx` means mascot test coverage is gone
- Tab bar font is 9pt -- borderline unreadable
- No `accessibilityHint` on most interactive elements
- Progress rings (SVG) have no accessible text alternative

---

## Competitor Analysis Summary

### The Core Insight
**No ADHD-first cleaning app exists.** ADHD apps (Finch, Tiimo, Goblin Tools) ignore cleaning. Cleaning apps (Sweepy, Tody, FlyLady) ignore ADHD. This is Declutter's entire opportunity -- but it must execute brilliantly to own this gap.

### What to Steal

| From | What | How Declutter Should Use It |
|------|------|-----------------------------|
| **Finch** | Virtual pet + positive-only reinforcement | Mascot must be the emotional core. Never punish. Celebrate everything. |
| **Goblin Tools** | "Spiciness level" for task breakdown | Let users rate overwhelm (1-5). AI adjusts task granularity automatically. |
| **Tiimo** | 3,000+ colors, visual timelines | Let users personalize room colors/icons. Show time as visual blocks, not numbers. |
| **Structured** | Drag-to-reschedule without guilt | Missed tasks silently move to tomorrow. No red badges. No shame. |
| **FlyLady** | 15-minute timer rule | "15-Minute Blitz" as a CORE free feature. AI picks highest-impact tasks that fit. |
| **Tody** | Dusty the mascot + priority by impact | Mascot with personality. Always show "biggest visual difference" task first. |
| **Calm** | Referral before paywall, price anchoring | Show referral option before paywall. Anchor expensive monthly to make annual attractive. |
| **Fabulous** | Commitment contract + "letter from future self" | Onboarding should include visualization of organized space or commitment checkbox. |
| **Balance** | One big button, zero choice paralysis | Home screen = ONE clear CTA: "Start Today's Clean" |
| **Headspace** | Breathing-cycle loading animations | Loading states should feel calming, not empty. Animate the mascot. |
| **Habitica** | Party boss battles (positive-only version) | Household "cleaning boss" challenge where everyone contributes. No HP loss. |

### What to Avoid

| Anti-Pattern | Who Does It | Why It Fails |
|-------------|-------------|-------------|
| HP loss / punishment | Habitica | Creates anxiety and shame spirals |
| Red "overdue" indicators | Sweepy | Triggers guilt and overwhelm |
| Complex manual setup | Sweepy, OurHome | Cognitive overload before first use |
| Rigid streaks that break | Duolingo-style | One break = total abandonment |
| Locking all content | Headspace | ADHD users need to try before committing |
| Feature bloat | Habitica, OurHome | More options = more paralysis (Hick's Law) |
| Nagging notification tone | Generic apps | Leads to resentment and deletion |

### Market Context
- ADHD Apps market: projected $1.1 billion by 2030
- Tiimo won iPhone App of the Year 2025 -- validates massive demand for neurodivergent-first design
- 1/3 of ADDitude readers say clutter causes them the most stress
- Adults with ADHD are 3x more likely to struggle with organization and clutter

---

## The Redesign Playbook

### Phase 1: Strip Down (Cut Ruthlessly)

**REMOVE from v1 entirely:**
- Social features (social.tsx, accountability.tsx)
- Collection system (collection.tsx)
- Insights (insights.tsx)
- Challenges/Leaderboards (challenge/[id].tsx)
- All schema fields for features that don't exist (white noise, AR, variable rewards)

**KEEP and POLISH:**
- AI Room Scan + Analysis (camera.tsx, analysis.tsx) -- this IS the app
- Room Detail + Tasks (room/[id].tsx) -- the core loop
- Focus/Timer Mode (focus.tsx) -- but fix background execution
- Progress (progress.tsx) -- simplify to one visualization
- Mascot (mascot.tsx) -- but actually design the character
- Onboarding -- but cut to 6-7 steps max
- Paywall -- fix pricing, add soft placement after first completed session

### Phase 2: Fix the Design

#### Home Screen Redesign
- **ONE big button:** "Start Today's Clean" or "What should I do?" (steal from Balance)
- Remove the motivational quote, reduce the greeting to one line
- Show the SINGLE most impactful room/task, not a dashboard of everything
- Add color -- a warm accent for "fresh" rooms, soft amber for "needs attention"
- Make the mascot visible on the home screen, reacting to the state of your spaces

#### Color System
- **Primary:** Warm, calming palette. Soft greens (#4CAF50) for "fresh/clean"
- **Secondary:** Soft amber (#FFB74D) for "ready for a refresh" (NEVER red)
- **Accent:** Gold/warm for rewards, celebrations, premium
- **Neutral:** Keep the dark mode base but add 3-4 intentional accent colors
- **Rule:** Every screen must have at least one color moment. No more monochrome walls.

#### Card Variety
Stop using the same glass-morphism card for everything. Create 3-4 card styles:
1. **Hero card** -- Large, with room photo, prominent (for active room)
2. **Task card** -- Compact, with clear checkbox and color-coded difficulty
3. **Stat card** -- Small, number-focused, accent color background
4. **Reward card** -- Celebratory, with glow/shimmer effect

#### Typography
- Increase body text to 14-16px minimum (currently 12-15px)
- Use size contrast, not just weight/opacity, for hierarchy
- Commit to dual typeface system (Bricolage Grotesque for headlines, Inter for body) across ALL screens, or drop Bricolage

#### Tap Targets
- All interactive elements: 44x44px minimum (Apple HIG)
- Checkboxes: increase from 22px to 44px with generous hit area
- Tab bar labels: increase from 9pt to 11pt minimum

#### Celebrations
Design specific celebration states:
- **Task completed:** Confetti burst, mascot happy reaction, satisfying sound
- **Room completed:** Before/after photo comparison, big mascot celebration, XP animation
- **Streak milestone:** Special animation, mascot outfit unlock
- **First session done:** Welcome-to-the-club moment

#### Empty States
Design for EVERY screen when there's no data:
- Home with 0 rooms: "Let's scan your first room!" with mascot pointing at camera
- Progress with 0 tasks: "Your journey starts with one room"
- Achievements with 0 badges: "These are waiting for you..." with grayed-out previews

### Phase 3: Fix the Code

#### Priority 1: Fix Broken Core Features
1. **Focus timer:** Use `expo-notifications` to schedule completion notification. Use `expo-task-manager` for background execution or at minimum show a local notification when timer would complete.
2. **AI fallback:** Make fallback room-type-aware. Show user that AI failed with "We couldn't analyze your photo. Here are suggested tasks for [room type]."
3. **Remove or hide social features** until they actually work. A fake feature is worse than no feature.

#### Priority 2: Simplify Architecture
1. **Split the god context** into focused providers: `RoomContext`, `SessionContext`, `MascotContext`, `SettingsContext`
2. **Unify styling** -- pick ONE approach (inline Pencil-matched styles OR theme imports) and convert everything
3. **Centralize utilities** -- XP calc, room icons, date formatting in `utils/`
4. **Clean up schema** -- remove fields for features that don't exist

#### Priority 3: Onboarding
1. Cut to **6 steps max:** Welcome -> Energy/Overwhelm level -> Scan first room -> See task breakdown -> Mascot intro -> Optional paywall
2. Let users **skip to value** -- "Just let me scan a room" option on step 1
3. Move paywall to **after first completed session** (user has experienced value)
4. Add mascot to onboarding from step 1 (emotional hook)

### Phase 4: Monetization

**Recommended pricing:**
- **Free tier:** 1 room, basic tasks, mascot, 15-min blitz mode (genuinely useful)
- **Premium:** $49.99/year ($4.17/month effective), 7-day free trial
- **Behind paywall:** Multi-room, AI task breakdown, photo progress, advanced mascot, analytics
- **Paywall timing:** After first completed 15-minute session
- **Display:** Show monthly cost ($4.17/mo), strikethrough monthly plan ($9.99/mo)

### Phase 5: The Mascot (This Is Everything)

The mascot is the #1 retention driver for ADHD users (proven by Finch with 500K+ 5-star reviews). It must be:
1. **Actually designed** -- custom illustration, not a gray circle or stock icon
2. **Emotionally expressive** -- happy when you clean, sleepy when you haven't, excited for streaks
3. **Connected to real behavior** -- reacts to actual cleaning progress, not just button taps
4. **Present everywhere** -- home screen, during sessions, celebrations, push notifications
5. **Positive only** -- NEVER sad or disappointed if you miss a day. "Welcome back!" not "Where were you?"

---

## Final Verdict

This app has the right idea in the wrong execution. The market gap is real -- no ADHD-first cleaning app exists, and Tiimo winning App of the Year proves the demand. But right now Declutter is trying to be Finch + Sweepy + Habitica + Focusmate all at once, and succeeding at none of them.

**The path forward:**
1. Cut 60% of features
2. Fix the 40% that remain
3. Design a real mascot
4. Add color and celebration
5. Ship

The AI room scan is genuinely clever and well-built. The ADHD-specific copy is thoughtful. The onboarding V2 psychology is smart. These are real strengths. But they're buried under feature sprawl, fake social features, and a monochromatic design that makes every screen feel the same.

**Ship less. Polish more. Make someone smile when they open this app.**
