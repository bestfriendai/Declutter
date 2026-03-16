# Declutterly - Comprehensive App Improvement Document

> **AI-Powered Decluttering Assistant with ADHD-Friendly Features**
> 
> Document Version: 1.0 | January 2026

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [User Flow Analysis](#2-user-flow-analysis)
3. [Screen-by-Screen Analysis](#3-screen-by-screen-analysis)
4. [Cross-Cutting Improvements](#4-cross-cutting-improvements)
5. [Technical Recommendations](#5-technical-recommendations)
6. [Priority Roadmap](#6-priority-roadmap)

---

## 1. Executive Summary

Declutterly is a sophisticated React Native/Expo app that helps users declutter their spaces using AI-powered room analysis, gamification, and ADHD-friendly task management. This document provides a comprehensive analysis of every screen with actionable improvements across UI/UX, functionality, and user flow.

### Key Strengths
- ✅ Excellent haptic feedback throughout
- ✅ Beautiful glass morphism design language
- ✅ Strong ADHD support (combo tracking, single task mode, energy check-ins)
- ✅ Comprehensive gamification (mascot, collectibles, achievements)
- ✅ Good accessibility foundations (labels, roles, reduced motion support)

### Key Improvement Areas
- ⚠️ Onboarding-to-action friction
- ⚠️ Empty state guidance
- ⚠️ Social features discoverability
- ⚠️ Progress visualization consistency
- ⚠️ Error recovery flows

---

## 2. User Flow Analysis

### 2.1 Current Primary User Journey

```
┌─────────────────┐
│   First Launch  │
└────────┬────────┘
         ▼
┌─────────────────┐     ┌─────────────────┐
│   Onboarding    │────▶│  Auth Options   │
│  (3 slides +    │     │ Apple/Google/   │
│   mascot pick)  │     │ Email/Guest     │
└────────┬────────┘     └────────┬────────┘
         ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│   Home (Empty)  │◀────│   Login/Signup  │
│  "Add Room" CTA │     │                 │
└────────┬────────┘     └─────────────────┘
         ▼
┌─────────────────┐
│     Camera      │
│  Capture Room   │
└────────┬────────┘
         ▼
┌─────────────────┐
│    Analysis     │
│  AI Processing  │
└────────┬────────┘
         ▼
┌─────────────────┐
│  Room Detail    │
│   Task List     │
└────────┬────────┘
         ▼
┌─────────────────┐
│   Focus Mode    │
│ (Optional Timer)│
└────────┬────────┘
         ▼
┌─────────────────┐
│   Completion    │
│ Celebration! 🎉 │
└─────────────────┘
```

### 2.2 User Flow Issues

| Issue | Location | Impact | Recommendation |
|-------|----------|--------|----------------|
| No skip option in onboarding for returning users | Onboarding | Medium | Add "Already have account?" link on first slide |
| Camera permission denial has no recovery | Camera | High | Add "Open Settings" button when permission denied |
| Empty home state doesn't explain AI feature | Home | High | Add visual showing camera → AI → tasks flow |
| No offline task creation | Room Detail | Medium | Allow manual task entry when AI unavailable |
| Focus mode exit warning interrupts flow | Focus | Low | Add "Don't ask again" option |

---

## 3. Screen-by-Screen Analysis

---

### 3.1 Onboarding Screen (`app/onboarding.tsx`)

**Purpose:** Introduce app features and optional mascot selection

**Current State:**
- 3 tutorial slides explaining core features
- Mascot personality selection
- Name entry option
- Progress indicator with steps

#### UI/UX Improvements

| Area | Current State | Recommendation | Priority |
|------|---------------|----------------|----------|
| **Skip Flow** | No skip for returning users | Add "Already have an account? Sign in" link on slide 1 | High |
| **Mascot Preview** | Small emoji in selection | Show animated mascot preview with personality description | Medium |
| **Progress Bar** | Good step indicator | Add estimated time "~1 min" | Low |
| **Slide Animations** | FadeIn only | Add slide gesture with parallax effect | Low |

#### Functionality Improvements

| Feature | Current | Recommendation | Priority |
|---------|---------|----------------|----------|
| **Auto-advance** | Manual swipe only | Auto-advance after 3s with pause on tap | Medium |
| **Mascot Decision** | Required selection | Make optional, allow "Choose later" | Medium |
| **Name Entry** | Optional but prominent | Move to profile setup, reduce friction | High |

#### Accessibility

| Issue | Fix | Priority |
|-------|-----|----------|
| Slide content not announced on swipe | Add `accessibilityLiveRegion="polite"` to slide container | High |
| Mascot buttons lack selection state announcement | Add `accessibilityState={{ selected }}` | Medium |

---

### 3.2 Auth Screens (`app/auth/`)

#### 3.2.1 Login Screen (`login.tsx`)

**Purpose:** Sign in with email, Apple, Google, or continue as guest

**Current State:**
- Email/password form with remember me toggle
- Social sign-in buttons
- Guest mode with confirmation dialog
- Password visibility toggle

#### UI/UX Improvements

| Area | Current State | Recommendation | Priority |
|------|---------------|----------------|----------|
| **Biometric Login** | Not implemented | Add Face ID/Touch ID for returning users | High |
| **Password Input** | Standard input | Add shake animation on error | Low |
| **Social Buttons** | Equal prominence | Make Apple Sign-In larger per Apple HIG | Medium |
| **Guest Warning** | Alert dialog | Inline warning text, less disruptive | Medium |

#### Functionality Improvements

| Feature | Current | Recommendation | Priority |
|---------|---------|----------------|----------|
| **Session Persistence** | "Remember Me" toggle | Default to true, hide toggle | Low |
| **Magic Link** | Not available | Add email magic link option | Medium |
| **Rate Limiting UI** | No indication | Show "Try again in X seconds" on too many attempts | High |

#### 3.2.2 Signup Screen (`signup.tsx`)

**Current State:**
- Name, email, password, confirm password
- Password strength indicator
- Social sign-up options

#### UI/UX Improvements

| Area | Current State | Recommendation | Priority |
|------|---------------|----------------|----------|
| **Password Requirements** | Validated but not shown upfront | Show requirements checklist | High |
| **Name Field** | "Your Name" placeholder | Split into first/last for personalization | Low |
| **Form Progress** | No indication | Add step indicator (1/2) if multi-step | Low |

#### 3.2.3 Forgot Password (`forgot-password.tsx`)

**Current State:**
- Email input
- Success/error feedback
- Back to login link

#### Improvements

| Area | Recommendation | Priority |
|------|----------------|----------|
| **Email Confirmation** | Show masked email after submission | Medium |
| **Resend Timer** | Add 60s cooldown with visible countdown | High |
| **Check Spam Tip** | Add "Check spam folder" hint on success | Medium |

---

### 3.3 Home Screen (`app/(tabs)/index.tsx`)

**Purpose:** Dashboard showing rooms, focus tasks, stats, and quick actions

**Current State:**
- Greeting with user name
- Stats row (Progress %, Tasks Done, Streak)
- "Today's Focus" task list (top 5 prioritized)
- Room list with progress rings
- Empty state with "Scan a Room" CTA
- Streak warning system
- Offline indicator
- Undo toast for completed tasks

#### UI/UX Improvements

| Area | Current State | Recommendation | Priority |
|------|---------------|----------------|----------|
| **Empty State** | Generic illustration | Add animated demo of camera → AI → tasks flow | High |
| **Stats Cards** | Inline row | Make tappable → navigate to Insights | Medium |
| **Room Cards** | Progress ring only | Add last activity timestamp | Medium |
| **Focus Tasks** | List format | Add swipe-to-complete gesture | High |
| **Add Room FAB** | Hidden in menu | Always-visible floating action button | High |
| **Greeting** | Time-based only | Include motivational phrase rotating daily | Low |

#### Functionality Improvements

| Feature | Current | Recommendation | Priority |
|---------|---------|----------------|----------|
| **Quick Win Highlight** | Tasks sorted by priority | Add "Start with this" badge on easiest task | High |
| **Room Archiving** | Not available | Add archive completed rooms (not delete) | Medium |
| **Widget Support** | None | Add iOS/Android widget showing today's focus | Medium |
| **Pull-to-Refresh** | Visual only | Actually reload cloud data | High |
| **Task Batching** | Individual only | "Complete all" for multi-select | Low |

#### Accessibility

| Issue | Fix | Priority |
|-------|-----|----------|
| Stats row not grouped | Wrap in accessible container with combined label | Medium |
| Room progress not announced | Add `accessibilityValue={{ now: progress, min: 0, max: 100 }}` | High |

---

### 3.4 Camera Screen (`app/camera.tsx`)

**Purpose:** Capture room photos for AI analysis

**Current State:**
- Camera preview with flash toggle
- Photo library picker
- Countdown timer option
- Room type selector
- Pinch-to-zoom preview
- Corner frame guide

#### UI/UX Improvements

| Area | Current State | Recommendation | Priority |
|------|---------------|----------------|----------|
| **Camera Guide** | Corner frame only | Add overlay showing "Capture the whole room" tip | High |
| **Flash Auto** | Manual toggle only | Add auto-flash based on light levels | Low |
| **Multi-Photo** | Single capture | Allow 2-3 angles for better AI analysis | High |
| **Video Support** | Mentioned but unclear | Add pan-video mode for larger rooms | Medium |
| **Permission Denied** | Text explanation | Add animated illustration + "Open Settings" button | High |

#### Functionality Improvements

| Feature | Current | Recommendation | Priority |
|---------|---------|----------------|----------|
| **Image Quality** | Full resolution | Auto-compress large images for faster upload | Medium |
| **Offline Capture** | Not supported | Queue captures for when online | High |
| **Existing Room Photos** | New rooms only | Allow adding photos to existing rooms | High |
| **Grid Overlay** | None | Add optional rule-of-thirds grid | Low |

---

### 3.5 Analysis Screen (`app/analysis.tsx`)

**Purpose:** AI processes room image and generates task list

**Current State:**
- Cinematic loading animation with stages
- Progress percentage indicator
- Scan line effect over image
- Result reveal with tasks grouped by priority
- Before/after comparison mode

#### UI/UX Improvements

| Area | Current State | Recommendation | Priority |
|------|---------------|----------------|----------|
| **Loading Stages** | Text-based progress | Add estimated time remaining | Medium |
| **Error State** | Generic error | Show specific error (API limit, image quality, etc.) | High |
| **Retry Flow** | Hidden | Prominent "Try Again" with different angle suggestion | High |
| **Result Preview** | Full task list | Show "Quick Preview" of 3 tasks during analysis | Medium |
| **Cancel Option** | Back button | Confirm before canceling in-progress analysis | Medium |

#### Functionality Improvements

| Feature | Current | Recommendation | Priority |
|---------|---------|----------------|----------|
| **Task Editing** | None during analysis | Allow task name editing before saving | High |
| **Zone Mapping** | Shown on image | Make zones tappable to show related tasks | Medium |
| **Fallback Tasks** | None | Provide generic room-type tasks if AI fails | High |
| **Analysis History** | Not saved | Save previous analyses for comparison | Low |

---

### 3.6 Room Detail Screen (`app/room/[id].tsx`)

**Purpose:** View and complete tasks for a specific room

**Current State:**
- Room header with emoji and progress ring
- Photo gallery with lightbox
- Task list with filters (All/Pending/Completed)
- Task cards with swipe-to-delete
- Combo tracking for consecutive completions
- Single task mode for ADHD focus
- Session check-in for energy/time
- Milestone celebrations (25%, 50%, 75%, 100%)
- "Good Enough" modal at 70%+
- "Overwhelm" support modal

#### UI/UX Improvements

| Area | Current State | Recommendation | Priority |
|------|---------------|----------------|----------|
| **Photo Gallery** | Small thumbnails | Add before/after comparison slider | High |
| **Task Reordering** | Fixed order | Allow drag-to-reorder | Medium |
| **Time Estimates** | Per task | Show total remaining time at top | High |
| **Sub-task Display** | Collapsed | Inline checkbox list, no expand needed | Medium |
| **Overwhelm Trigger** | Manual button | Auto-detect based on time-on-screen without action | Medium |

#### Functionality Improvements

| Feature | Current | Recommendation | Priority |
|---------|---------|----------------|----------|
| **Task Notes** | Not available | Add optional notes/photos per task | Medium |
| **Recurring Tasks** | Not supported | Mark tasks as "weekly" or "monthly" | Low |
| **Bulk Actions** | None | "Complete all in zone" option | Medium |
| **Share Room** | To social only | Generate shareable link for accountability partner | High |
| **Task Templates** | AI-generated only | Save common tasks as templates | Low |

#### ADHD-Specific Improvements

| Feature | Current | Recommendation | Priority |
|---------|---------|----------------|----------|
| **Body Doubling Link** | Separate screen | Quick "Start body doubling" from room | High |
| **Timer Integration** | Links to focus mode | Inline mini-timer option | Medium |
| **Energy Matching** | Session check-in | Auto-suggest tasks matching selected energy | High |
| **Context Switching** | None | "Take a break" button with timer | Medium |

---

### 3.7 Focus Mode Screen (`app/focus.tsx`)

**Purpose:** Immersive timer session for distraction-free cleaning

**Current State:**
- Energy check-in before starting
- 5-4-3-2-1 launch countdown
- Circular progress timer
- Pause/resume/stop controls
- Motivational quotes rotation
- Ambient sound options
- Break mode with configurable duration
- Mascot encouragement
- Task list overlay (if room-specific)
- Background tracking

#### UI/UX Improvements

| Area | Current State | Recommendation | Priority |
|------|---------------|----------------|----------|
| **Timer Display** | Segments only | Add large digital time remaining | High |
| **Quick Actions** | None during timer | Add "Skip 5 min" and "+5 min" buttons | Medium |
| **Break Reminder** | At completion | Gentle nudge every 25 min for long sessions | Medium |
| **Sound Preview** | Play immediately | Preview 3s before applying | Low |
| **End Screen** | Basic celebration | Show detailed stats (tasks completed, XP earned) | High |

#### Functionality Improvements

| Feature | Current | Recommendation | Priority |
|---------|---------|----------------|----------|
| **Presets** | Single duration | Quick presets: 5/15/25/45 min | High |
| **Pomodoro Mode** | Manual breaks | Auto-start 5 min break after 25 min | Medium |
| **Siri/Shortcuts** | Not available | "Hey Siri, start cleaning focus" | Low |
| **Watch App** | None | Apple Watch timer companion | Low |
| **Live Activity** | None | iOS Live Activity/Dynamic Island | Medium |

---

### 3.8 Progress Screen (`app/(tabs)/progress.tsx`)

**Purpose:** Visualize cleaning journey and achievements

**Current State:**
- Activity rings (Tasks, Time, Streak)
- Level and XP progress
- Weekly activity chart
- Badges preview
- Collection preview
- Statistics grid

#### UI/UX Improvements

| Area | Current State | Recommendation | Priority |
|------|---------------|----------------|----------|
| **Activity Rings** | Always 100% max | Dynamic max based on goals | High |
| **Weekly Chart** | Bar chart | Add trendline overlay | Medium |
| **Goal Setting** | Not available | "Set weekly goal" modal | High |
| **Comparisons** | None | "This week vs last week" toggle | Medium |
| **Celebration Moments** | At completion | Add "Personal best!" highlights | Medium |

#### Functionality Improvements

| Feature | Current | Recommendation | Priority |
|---------|---------|----------------|----------|
| **Export Data** | None | Export progress report as PDF | Low |
| **Social Sharing** | Per badge only | Share weekly recap | Medium |
| **Streak Recovery** | Lost immediately | "Freeze" option (1 per month) | High |
| **Custom Goals** | Fixed metrics | User-defined daily/weekly goals | High |

---

### 3.9 Profile Screen (`app/(tabs)/profile.tsx`)

**Purpose:** User info and quick access to settings

**Current State:**
- Avatar with level ring
- XP progress bar
- Quick stats (Tasks, Rooms, Badges, Streak)
- Settings shortcuts
- Sign out option

#### UI/UX Improvements

| Area | Current State | Recommendation | Priority |
|------|---------------|----------------|----------|
| **Avatar** | Mascot emoji | Allow custom photo upload | Medium |
| **Level Badge** | Number only | Add level name (Novice → Master) | Low |
| **Stats Cards** | Tappable | Add micro-animations on tap | Low |
| **Achievement Teaser** | Basic count | Show "Next badge: X more tasks" | High |

---

### 3.10 Settings Screen (`app/settings.tsx`)

**Purpose:** App configuration and preferences

**Current State:**
- Grouped iOS-style list
- AI provider configuration
- Notifications settings
- Focus mode defaults
- Haptics toggle
- Theme options
- Data management
- About section

#### UI/UX Improvements

| Area | Current State | Recommendation | Priority |
|------|---------------|----------------|----------|
| **Search** | None | Add search for settings | Medium |
| **Quick Toggle** | Full screen | Add quick settings sheet from home | Medium |
| **API Key Entry** | Modal only | Add validation status indicator | High |
| **Backup Status** | Not shown | Show last sync timestamp | High |

#### Functionality Improvements

| Feature | Current | Recommendation | Priority |
|---------|---------|----------------|----------|
| **Export All Data** | Clear only | Add full export (JSON/PDF) | High |
| **Import Data** | Not available | Restore from backup | High |
| **Notification Scheduling** | Basic reminder | Add "Quiet hours" setting | Medium |
| **Focus Mode Presets** | Single config | Multiple saved presets | Low |

---

### 3.11 Achievements Screen (`app/achievements.tsx`)

**Purpose:** View all badges and track progress

**Current State:**
- Hero card with completion ring
- Category filter (Tasks, Rooms, Streaks, Time)
- Badge grid with locked/unlocked states
- Badge detail modal with share option
- Progress indicators for locked badges

#### UI/UX Improvements

| Area | Current State | Recommendation | Priority |
|------|---------------|----------------|----------|
| **Badge Animation** | ZoomIn only | Add particle burst on unlock | Medium |
| **Progress Preview** | Percentage | Add "X more to unlock" text | High |
| **Category Stats** | Small counts | Larger, more prominent | Medium |
| **Rarity Indication** | None | Add bronze/silver/gold tiers | Low |

---

### 3.12 Collection Screen (`app/collection.tsx`)

**Purpose:** View collected items earned during cleaning

**Current State:**
- Stats overview (Total, Unique, Completion %)
- Rarity breakdown
- Category filter
- Grid of collectibles with owned/locked states
- Detail modal for each item

#### UI/UX Improvements

| Area | Current State | Recommendation | Priority |
|------|---------------|----------------|----------|
| **Empty State** | No items text | Explain how to earn collectibles | High |
| **Rare Items** | Same size | Make legendary items larger | Medium |
| **Collection Album** | Flat grid | Add "pages" like a sticker album | Low |
| **Item Animation** | None | Add idle animations for owned items | Low |

---

### 3.13 Mascot Screen (`app/mascot.tsx`)

**Purpose:** View and interact with cleaning companion

**Current State:**
- Large mascot display
- Hunger/Energy/Happiness stats
- Level and XP
- Interaction buttons (Feed, Pet, Clean)
- Personality info

#### UI/UX Improvements

| Area | Current State | Recommendation | Priority |
|------|---------------|----------------|----------|
| **Mascot Animation** | Static with tap | Add idle breathing animation | Medium |
| **Stat Decay** | Hidden | Show "Hungry in 2h" warning | High |
| **Achievements** | None | Mascot-specific achievements | Low |
| **Dialogue** | None | Random encouraging messages | Medium |

#### Functionality Improvements

| Feature | Current | Recommendation | Priority |
|---------|---------|----------------|----------|
| **Customization** | Personality only | Add accessories/colors | Low |
| **Evolution** | Level only | Visual changes at milestone levels | Medium |
| **Mini-Games** | None | Simple games for break time | Low |

---

### 3.14 Insights Screen (`app/insights.tsx`)

**Purpose:** Detailed analytics and trends

**Current State:**
- Time period filter (Week/Month/Year/All)
- Stat tiles with change indicators
- Weekly activity chart
- Progress rings
- Room-by-room breakdown

#### UI/UX Improvements

| Area | Current State | Recommendation | Priority |
|------|---------------|----------------|----------|
| **Data Loading** | Skeleton | Add loading progress indicator | Low |
| **Chart Interaction** | Static | Add tap for daily details | High |
| **Trend Arrows** | Simple up/down | Add percentage change | Medium |
| **Export** | None | Share as image or PDF | Medium |

---

### 3.15 Social Screen (`app/social.tsx`)

**Purpose:** Challenges and body doubling sessions

**Current State:**
- Tab navigation (Challenges, Sessions, Shared)
- Challenge cards with progress
- Session cards with live indicator
- Create challenge modal
- Invite code sharing

#### UI/UX Improvements

| Area | Current State | Recommendation | Priority |
|------|---------------|----------------|----------|
| **Discovery** | Invite-only | Add "Find Public Challenges" | High |
| **Session Preview** | Text only | Add participant avatars/activity | Medium |
| **Challenge Templates** | Custom only | Pre-made challenge types | High |
| **Notifications** | None shown | In-app activity feed | Medium |

#### Functionality Improvements

| Feature | Current | Recommendation | Priority |
|---------|---------|----------------|----------|
| **Video Chat** | Simulated | Integrate real video (optional) | Low |
| **Leaderboard** | Per challenge | Global weekly leaderboard | Medium |
| **Team Challenges** | Individual only | Group challenges | Medium |
| **Challenge History** | Current only | Past challenges archive | Low |

---

### 3.16 Join Screen (`app/join.tsx`)

**Purpose:** Enter invite code to join challenge

**Current State:**
- Code input with paste button
- Validation feedback
- Preview of challenge before joining

#### Improvements

| Area | Recommendation | Priority |
|------|----------------|----------|
| **QR Code** | Add QR scanner option | High |
| **Deep Link** | Handle declutterly://join?code=X | High |
| **Recent Codes** | Store recently entered codes | Low |

---

## 4. Cross-Cutting Improvements

### 4.1 Onboarding & Retention

| Area | Current Gap | Recommendation | Impact |
|------|-------------|----------------|--------|
| **Day 1 Experience** | Empty home after signup | Show demo room or walkthrough | High |
| **Day 2-7 Retention** | No re-engagement | Push notification with streak reminder | High |
| **Feature Discovery** | All features visible | Gradual unlock (focus mode after first room) | Medium |
| **Tutorial Tips** | One-time onboarding | Contextual tooltips on first use of each feature | High |

### 4.2 Gamification Enhancements

| Feature | Current | Enhancement | Priority |
|---------|---------|-------------|----------|
| **XP System** | Linear progression | Bonus XP for combos, streaks, challenges | High |
| **Daily Rewards** | Streak only | Daily login reward (collectible chance) | Medium |
| **Seasonal Events** | None | Time-limited challenges and collectibles | Low |
| **Referrals** | None | Invite friends for bonus rewards | Medium |

### 4.3 Offline Experience

| Scenario | Current Behavior | Improvement | Priority |
|----------|------------------|-------------|----------|
| **No Connection** | Shows offline banner | Queue all actions, sync when online | High |
| **AI Unavailable** | Cannot analyze | Offer manual task entry | High |
| **Sync Conflict** | Last write wins | Show conflict resolution UI | Medium |

### 4.4 Performance

| Area | Issue | Solution | Priority |
|------|-------|----------|----------|
| **Large Room Lists** | Renders all | Virtual list (FlashList) ✅ Done for collection | Medium |
| **Image Loading** | Can be slow | Progressive loading + blurhash | Medium |
| **Focus Mode Particles** | 8 particles always | Reduce to 4 on older devices | Low |
| **Initial Load** | White flash | Add splash → skeleton transition | Medium |

---

## 5. Technical Recommendations

### 5.1 Architecture Improvements

| Area | Current | Recommendation |
|------|---------|----------------|
| **State Management** | Single DeclutterContext | Split into focused contexts (RoomContext, StatsContext) |
| **Data Fetching** | Custom hooks | Consider React Query for cache management |
| **Navigation** | Expo Router | Add deep linking for all major screens |
| **Error Handling** | Per-component | Global error boundary with Sentry |

### 5.2 Code Quality

| Area | Current | Recommendation |
|------|---------|----------------|
| **File Size** | focus.tsx: 1890 lines | Split into FocusTimer, FocusSettings, FocusComplete |
| **Component Reuse** | TaskCard variants | Consolidate into single configurable component |
| **Type Safety** | Good | Add Zod validation for API responses |
| **Testing** | Basic tests | Add integration tests for critical flows |

### 5.3 New Feature Infrastructure

| Feature | Requirements |
|---------|--------------|
| **Push Notifications** | Rich notifications with actions |
| **Background Sync** | Background fetch for offline data |
| **Widgets** | WidgetKit (iOS) / Glance (Android) |
| **Watch App** | Focus timer companion |
| **Siri Shortcuts** | "Start cleaning" intent |

---

## 6. Priority Roadmap

### Phase 1: Critical Fixes (1-2 Weeks)

| Task | Screen | Impact |
|------|--------|--------|
| Add "Skip to Login" in onboarding | Onboarding | User flow |
| Camera permission recovery | Camera | Conversion |
| Offline task creation | Room Detail | Usability |
| Quick win badge on home | Home | Engagement |
| Fix pull-to-refresh data reload | Home | Trust |

### Phase 2: High Value (2-4 Weeks)

| Task | Screen | Impact |
|------|--------|--------|
| Multi-angle room capture | Camera | AI quality |
| Focus mode presets | Focus | Ease of use |
| Before/after photo slider | Room Detail | Motivation |
| Goal setting | Progress | Retention |
| Streak freeze option | Progress | Retention |

### Phase 3: Engagement (1-2 Months)

| Task | Screen | Impact |
|------|--------|--------|
| Daily login rewards | Collection | Retention |
| Public challenge discovery | Social | Growth |
| Detailed focus session stats | Focus | Value |
| Mascot evolution | Mascot | Delight |
| QR code for joins | Join | UX |

### Phase 4: Platform (2-3 Months)

| Task | Impact |
|------|--------|
| iOS Widget | Engagement |
| Apple Watch timer | Convenience |
| Live Activities | Engagement |
| Export/Import data | Trust |

---

## Appendix A: User Personas

### Persona 1: "Overwhelmed Olivia" (Primary)
- **Profile:** 28, ADHD, works from home
- **Pain Points:** Paralyzed by mess, can't start
- **Key Features:** Energy check-in, single task mode, "Good Enough" modal
- **Improvement Focus:** Reduce friction, celebrate small wins

### Persona 2: "Weekend Warrior Will"
- **Profile:** 35, busy professional, cleans on weekends
- **Pain Points:** Limited time, wants efficiency
- **Key Features:** Focus mode, quick wins, time estimates
- **Improvement Focus:** Presets, batch actions

### Persona 3: "Social Sarah"
- **Profile:** 24, competitive, loves gamification
- **Pain Points:** Needs external motivation
- **Key Features:** Challenges, leaderboards, sharing
- **Improvement Focus:** Social discovery, team challenges

---

## Appendix B: Competitive Analysis

| Feature | Declutterly | Tody | Sweepy | Home Assistant |
|---------|-------------|------|--------|----------------|
| AI Room Analysis | ✅ Unique | ❌ | ❌ | ❌ |
| ADHD Features | ✅ Strong | ❌ | ⚠️ Basic | ❌ |
| Gamification | ✅ Strong | ⚠️ Basic | ✅ Good | ❌ |
| Social | ⚠️ Growing | ❌ | ❌ | ❌ |
| Smart Home | ❌ | ❌ | ❌ | ✅ Strong |

---

*Document generated: January 2026*
*Next review: April 2026*
