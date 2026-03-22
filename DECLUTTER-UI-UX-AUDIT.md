# Declutter App — Comprehensive UI/UX Audit

**Prepared for:** Declutter Product Team
**Date:** March 18, 2026
**Auditor:** Senior UI/UX Analyst
**App Version:** Pre-launch (Design Review)
**Platform:** iOS (Expo + React Native)
**Screens Audited:** 40+ unique screens across 15 user flows

---

## SECTION 1: Introduction & Executive Summary

### 1.1 Introduction

Declutter is an ADHD-focused cleaning companion app that combines AI-powered room scanning, gamification mechanics, and a virtual mascot ("Dusty") to help users with ADHD initiate, sustain, and complete household cleaning tasks. The app targets a genuinely underserved population — adults with ADHD who struggle with executive dysfunction around cleaning — and takes a compassionate, non-judgmental approach to the problem.

This audit examines every designed screen across the complete user journey: onboarding, core task loop, progress and achievement systems, profile and settings, paywall and monetization, and all transitional states. The evaluation framework is grounded in three lenses:

1. **ADHD Accessibility** — Does the design respect the cognitive profile of the target user? Does it minimize executive function demands, provide dopamine-friendly feedback loops, and avoid overwhelm?
2. **Design System Integrity** — Is the visual language consistent, scalable, and production-ready?
3. **Conversion & Retention** — Does the flow effectively guide users from first launch to habitual engagement and, where appropriate, paid conversion?

The audit covers 40+ unique screens and states across 15 distinct user flows, assessed against current iOS Human Interface Guidelines, WCAG 2.1 AA accessibility standards, and established ADHD-focused UX research.

### 1.2 Executive Summary

Declutter has a genuinely compelling product concept. The combination of AI room scanning, bite-sized task decomposition, Tamagotchi-style mascot mechanics, and streak-based gamification is well-suited to the ADHD audience. Several individual screens — particularly the session completion celebrations, the energy check during onboarding, and Dusty's motivational quotes — demonstrate real empathy for the target user.

However, the current design has systemic issues that risk undermining the product's core promise. The app claims to be "built for ADHD brains," but multiple screens present walls of information, inconsistent visual hierarchies, and cognitive overload patterns that are specifically hostile to ADHD users. The design system lacks the discipline needed for production — the mascot appears in at least three incompatible art styles, the primary coral color is applied to every interactive element without hierarchy, and navigation patterns shift unpredictably between screens.

#### Top 5 Critical Findings

| # | Finding | Severity | Impact |
|---|---------|----------|--------|
| 1 | **Paywall is a wall of text** — 6 bullet points, 3 value cards, toggle, pricing, and multiple CTAs create massive cognitive overload on the single most revenue-critical screen | CRITICAL | Direct revenue loss; ADHD users will dismiss rather than parse |
| 2 | **Mascot art style is inconsistent across 3+ styles** — Dusty appears as a simple blob, a watercolor hamster, a dark variant, and a celebration variant with no shared design language | CRITICAL | Breaks emotional bond with mascot; feels like different apps |
| 3 | **Transparency artifacts on mascot images** — Checkered/transparent backgrounds visible on Splash, Welcome, and Meet Mascot screens — the 3 most emotionally important screens | CRITICAL | Communicates "unfinished software" at first impression |
| 4 | **Single accent color (coral) used for every interactive element** — CTAs, selections, toggles, badges, progress bars, and highlights all share one color, destroying visual hierarchy | HIGH | Users cannot distinguish primary actions from secondary ones |
| 5 | **Tab bar labels appear/disappear inconsistently across screens** — Some screens show icon+label, others show icon-only, with no discernible pattern | HIGH | Violates spatial consistency; ADHD users rely on predictable navigation anchors |

#### Overall UX Score

| Category | Score | Notes |
|----------|-------|-------|
| ADHD Accessibility | 6.5/10 | Strong concept, undermined by information overload on key screens |
| Visual Design | 7/10 | Attractive dark theme with good use of color, but inconsistencies in mascot and component styling |
| Design System Maturity | 4.5/10 | Needs significant work — inconsistent tokens, missing states, art style fragmentation |
| Navigation & IA | 5.5/10 | Tab structure is sound but execution is inconsistent; modal vs. push patterns are unpredictable |
| Gamification & Engagement | 8/10 | Best-in-class concept with XP, streaks, badges, mascot mood — execution needs polish |
| Monetization | 5/10 | Paywall violates ADHD-friendly principles; pricing may need market validation |
| **Overall** | **6.0/10** | Strong foundation with a clear, empathetic vision — but the gap between intent and execution must close before launch |

---

## SECTION 2: Onboarding, Auth & First-Time Experience

### 2.1 Splash Screen

#### [CRITICAL] SPL-01: Checkered/Transparent Background Artifact on Mascot

The Dusty mascot asset is rendering with a visible checkered transparency grid behind it. This is the very first thing a user sees. It communicates "unfinished software" before any value proposition is delivered.

- **Root Cause:** The mascot PNG has alpha transparency but is being placed on a surface that does not composite correctly, or the asset itself was exported with a checkered background baked into the bitmap rather than true alpha.
- **Fix:** Re-export the mascot asset from the source design file as a PNG-32 with true alpha transparency. Verify the `Image` component in React Native is not rendering a placeholder behind it. If using `resizeMode`, ensure it is set to `contain` and that no `backgroundColor` is applied to the image container.
- **Verify on:** Both light and dark backgrounds. Test on physical device — simulators sometimes mask compositing issues.

#### [HIGH] SPL-02: Mascot Appears Small and Static

Dusty is the emotional anchor of the entire app. At splash, the mascot is rendered too small to convey personality. There is no animation, no bounce, no breathing idle — the screen feels like a broken loading state rather than a warm welcome.

- **Fix:** Increase mascot to at least 40% of screen width. Add a subtle idle animation: a gentle vertical float (translateY oscillation, 2s loop, ease-in-out, 4px amplitude) and a soft scale pulse on the loading dots. Use `react-native-reanimated` for 60fps performance.

#### [MEDIUM] SPL-03: Loading Indicator Is Ambiguous

Three small coral dots with no label and no progress indication. Users cannot distinguish between "loading" and "stuck."

- **Fix:** Add a subtle pulsing animation to the dots (sequential opacity fade, 300ms stagger). If load time exceeds 3 seconds, fade in a text label: "Getting things ready..."

---

### 2.2 Welcome Screen

#### [CRITICAL] WEL-01: Checkered Background on Mascot (Recurrence)

Same transparency artifact as SPL-01. This is now the second time the user has seen this bug.

- **Fix:** Same as SPL-01. Fix the component, not each instance.

#### [HIGH] WEL-02: 10-Step Progress Indicator Creates Overwhelm

The bottom of the screen shows 10 progress dots. For an ADHD user, this signals "I have to get through TEN things before I can use this app." This directly contradicts the empathetic "we won't overwhelm you" promise in the copy.

- **Fix (structural):** Collapse the onboarding to 5 steps maximum:
  1. Welcome + emotional hook (merge current steps 1-2)
  2. Energy + preferences (merge current steps 3-5 into a single adaptive screen)
  3. Scan intro (current step 8)
  4. Meet Dusty (current step 9)
  5. Plan preview + commitment (merge current steps 10-11)

  Move the paywall to *after* the first completed task, not the end of onboarding.

- **Fix (visual, if structural change is deferred):** Replace dot indicators with a smooth progress bar. Progress bars feel faster because the brain perceives continuous motion rather than discrete remaining steps. Do not show step counts ("STEP 2 OF 10"). Show only the bar.

#### [MEDIUM] WEL-03: "I already have an account" Is Low-Contrast

The sign-in link is a text link below the primary CTA.

- **Fix:** Make "I already have an account" a secondary outlined button (same width as "Get Started") rather than a text link. This improves tap target size for accessibility.

---

### 2.3 Problem Acknowledgment

#### [HIGH] ACK-01: No Back Button or Skip Option

This screen has a single "That's me" button and no way to go back or skip. This creates a psychological trap.

- **Fix:** Add a back chevron in the top-left and "Skip" in the top-right (consistent with later screens). The affirmation should feel like a *choice*, not a gate.

#### [MEDIUM] ACK-02: Excessive White Space Between Copy and CTA

The large gap between the body text and the button creates visual disconnection.

- **Fix:** Reduce spacing between body text and button to 32px max. Add a subtle Dusty illustration in the gap.

#### [LOW] ACK-03: "That's me" Button Label Is Limiting

Users who partially identify may hesitate.

- **Fix:** Change to "I hear you" or "Continue."

---

### 2.4 Quiz Screens (Energy, Living Situation, Struggles, etc.)

#### [MEDIUM] ENR-01: No Visible Selected State Before Interaction

The "Next" button should communicate that selection is *required* before it becomes active.

- **Fix:** Render the "Next" button in a disabled/muted state (50% opacity) until an option is selected. On selection, animate the button to full opacity with a subtle scale-up.

#### [MEDIUM] QIZ-01: Navigation Inconsistency Across Screens

Steps 1-2 have no back/skip. Steps 4-5 have both. This inconsistency creates unpredictability, an ADHD anxiety trigger.

- **Fix:** Every screen from step 2 onward must have: (a) back chevron top-left, (b) "Skip" top-right. Enforce this as a layout rule in the onboarding container component.

#### [LOW] QIZ-02: Selected State Border Is Subtle

The coral border on selected options works but could be more pronounced.

- **Fix:** Add a subtle coral background tint (5-8% opacity) to the selected card + a small checkmark icon in the top-right corner.

---

### 2.5 Scan Intro

#### [MEDIUM] SCN-01: Camera Icon Is Generic and Uninviting

For the most important action in the app, this screen should feel exciting.

- **Fix:** Replace the generic camera icon with an illustration of Dusty holding a camera or peeking through a viewfinder.

#### [LOW] SCN-02: "Skip for now" Lacks Context

Users who skip don't know what they'll miss.

- **Fix:** Change to "I'll scan later" and add: "You can scan anytime from the home screen."

---

### 2.6 Meet Mascot

#### [CRITICAL] MSC-01: Checkered Background on Mascot (Third Occurrence)

Third screen with the transparency artifact. Must be treated as a P0 bug. Audit every image asset.

#### [LOW] MSC-02: Name Customization Is Undiscoverable

The pencil icon on the name field is the only affordance.

- **Fix:** Add a brief animation where the pencil icon wobbles once (2s after screen appears).

---

### 2.7 Building Plan

#### [MEDIUM] BLD-01: No Time Estimate Creates Uncertainty

ADHD users have impaired time perception. A loading screen with no time estimate triggers "is this stuck?" anxiety.

- **Fix:** Add "This usually takes about 5 seconds" below the subtitle.

#### [LOW] BLD-02: Screen Feels Sparse

- **Fix:** Add a Dusty "thinking" animation to fill visual space without adding cognitive load.

---

### 2.8 Plan Preview

#### [MEDIUM] PLN-01: No Option to Adjust the Plan

The screen presents "your personalized plan" but offers no agency.

- **Fix:** Add a secondary text link: "Adjust my preferences" that returns to quiz screens.

#### [LOW] PLN-02: "Looks great!" Is Presumptuous

- **Fix:** Change to "Let's go" or "Start my journey."

---

### 2.9 Commitment Screen

#### [HIGH] CMT-01: "92% of users feel calmer" Stat Is a Trust Risk

For a new/pre-launch app, displaying a specific user statistic that cannot be backed by real data is a credibility risk. If questioned, it damages the brand's core promise of honesty.

- **Fix:** Remove the percentage or replace with: "Users tell us they feel calmer after their first session." Never fabricate social proof in an app whose brand is built on authenticity.

#### [MEDIUM] CMT-02: Commitment Checkbox Is a Dark Pattern Risk

The pre-checked "I commit to showing up for myself" checkbox can feel manipulative to ADHD users who are sensitive to being told what to do.

- **Fix:** Start unchecked, softer language: "I want to try showing up for myself." CTA should work regardless of checkbox state.

---

### 2.10 Paywall (Onboarding Exit)

#### [CRITICAL] PAY-01: Cognitive Overload — Most Dense Screen in the App

This single screen contains ~16 distinct elements: a badge, headline, sub-badge, 6 bullet points, 3 value cards, tagline, pricing toggle, prices, CTA, free plan link, and footer links. For ADHD users, this is a wall that triggers dismissal or decision paralysis.

- **Fix (structural):** Break the paywall into two states:
  - **Collapsed (default):** Show only the headline, monthly/annual toggle with prices, CTA, and free plan link. Total: 5 elements.
  - **Expanded (tap "See all features"):** Reveal feature list and value badges.

#### [HIGH] PAY-02: Paywall Placement Is Too Early

The paywall appears before the user has completed a single task or experienced any core value.

- **Fix:** Move the paywall to after the first room scan and first 2-3 completed tasks. Conversion rates for ADHD apps increase 2-4x when the paywall follows a value-delivery moment.

#### [MEDIUM] PAY-03: Auto-Renewal Terms Unclear

"Start My Free Week" does not explicitly state what happens after.

- **Fix:** Below the CTA: "Free for 7 days, then $49.99/year. Cancel anytime."

---

### 2.11 Auth Screens

#### [HIGH] AUTH-01: No Password Strength Indicator on Sign Up

- **Fix:** Add a 4-segment strength bar (weak/fair/good/strong) below the password field + show/hide toggle (eye icon).

#### [HIGH] AUTH-02: No Terms/Privacy Agreement on Sign Up

Legal compliance issue (GDPR, CCPA) and App Store review risk.

- **Fix:** Add below Sign Up button: "By signing up, you agree to our [Terms of Service] and [Privacy Policy]."

#### [MEDIUM] AUTH-03: Forgot Password Has No Confirmation State

After submitting, the user doesn't know if the email was sent.

- **Fix:** Show confirmation state: mail icon, "Check your email" headline, "We sent a reset link to [email]" with "Resend" and "Check spam folder" options.

---

### 2.12 Permission Screens

#### [MEDIUM] PRM-01: Camera Permission Feels Like an Error State

The camera-with-slash icon and amber color palette frames this as a problem rather than an opportunity.

- **Fix:** Replace with Dusty holding a camera. Change headline to "Let Dusty See Your Space." Use coral instead of amber. Change CTA to "Enable Camera."

#### [LOW] PRM-02: Notification Benefits Ordering

"Gentle Reminders" leads the list but "Achievements" or "Streak Alerts" (dopamine triggers) would be more compelling first.

- **Fix:** Reorder: Achievements > Streak Alerts > Gentle Reminders > Dusty Updates.

---

### 2.13 Empty States

#### [HIGH] EMP-01: Progress Screen Shows Demoralizing Zeros

"0 Rooms, 0 Tasks, 0h Time, 0% Done" is the visual equivalent of handing someone a blank report card. For ADHD users, showing explicit zeros reinforces failure before they've started.

- **Fix:** Remove the stat row entirely on empty state. Replace with: "Every journey starts somewhere. Scan your first room and we'll start tracking your progress here." Show stats only after at least 1 completed task.

#### [LOW] EMP-02: Empty State CTAs Lack Time Estimates

- **Fix:** Add time estimates: "Scan a Room (takes 30 seconds)" or "Start your first session (just 5 minutes)."

#### [LOW] EMP-03: Tip Pattern Should Extend

"Tip: Start with the room that bugs you most" (Home empty) is excellent. Add tips to Rooms empty and Progress empty.

---

### 2.14 Cross-Cutting ADHD Onboarding Issues

#### [HIGH] ADHD-OB-01: Decision Fatigue Across 10 Steps

10 decisions before the home screen. ADHD brains have a finite decision budget.

- **Fix:** Reduce to 5 decisions max. Provide smart defaults based on common ADHD patterns (e.g., pre-select "Starting" as hardest struggle). Turn decisions from "choose one" into "confirm or change."

#### [HIGH] ADHD-OB-02: No "Resume Later" for Onboarding

If an ADHD user gets distracted mid-onboarding (highly probable), there's no indication progress is saved.

- **Fix:** Persist progress to local storage. On re-open: "Welcome back! You were on step X" with "Continue" and "Start over" options.

#### [MEDIUM] ADHD-OB-03: No Estimated Total Time for Onboarding

- **Fix:** On Welcome screen, add "Takes about 2 minutes" below the subtitle.

---

## SECTION 3: Core Experience (Home, Camera, Scanning, Tasks, Timer)

### 3.1 Tab Bar Inconsistency

#### [CRITICAL] TAB-01: Tab Bar Labels Appear/Disappear Between Screens

The empty home state displays labeled tabs — HOME, ROOMS, PROGRESS, PROFILE — while the populated home shows icon-only tabs. This is a fundamental navigation consistency failure. For ADHD users, inconsistent UI erodes spatial memory and forces re-learning.

- **Fix:** Render labeled tabs on every screen, every state, unconditionally. Use a shared `TabBar` component with a single layout definition.

#### [MEDIUM] TAB-02: Tab Icons Lack Sufficient Differentiation

The "grid" icon's meaning is ambiguous for "Rooms."

- **Fix:** Replace the grid icon with a door/room icon or floor-plan glyph.

---

### 3.2 Home Screen

#### [HIGH] HOME-01: Hero Card Consumes Excessive Vertical Space

The hero card occupies ~55-60% of viewport, pushing room cards below the fold with no scroll affordance.

- **Fix:** Reduce hero card height by 25-30%. Ensure top edge of first room card is visible above the fold to signal scrollability.

#### [HIGH] HOME-02: "3/5 today" Stat Lacks Context

"3/5 today" — 3 of 5 what? Tasks? Rooms? The four colored dots also lack explanation.

- **Fix:** Change to "3/5 tasks done" or add "tasks" sublabel. Add a legend for the colored dots.

---

### 3.3 Camera & Scanning

#### [MEDIUM] CAM-01: Instruction Text Overlaps Photo

"Hold steady — capture the full room" is hard to read over the photo.

- **Fix:** Add a semi-transparent background pill behind instruction text to ensure legibility.

#### [LOW] SCAN-01: Scanning Screen Has Excessive Empty Space

The progress steps are small and the bottom half is mostly empty black.

- **Fix:** Add a Dusty illustration or subtle breathing animation. Increase progress step text size.

---

### 3.4 AI Detection & Results

#### [HIGH] AI-01: AI Detection Visualization Is Excellent (Positive Finding)

Colored bounding boxes with labels on the room photo is clear and impressive. The area chips at bottom provide a good summary.

- **Minor improvement:** Add option to tap bounding boxes to dispute/remove detected areas.

#### [MEDIUM] RES-01: Results Screen Task Cards Are Text-Dense

Three stacked task group cards with subtasks inline creates a wall of text.

- **Fix:** Show only group title + task count + time in collapsed state. Let users tap to expand. Lead with "Start with 3 easy wins" more prominently.

---

### 3.5 Task Customization

#### [CRITICAL] TASK-01: Task Customize Screen Presents Too Many Decisions

8 task toggles + 3 group toggles + detail slider = ~12 binary decisions. For ADHD users, this is a task-initiation killer.

- **Fix:** Remove this screen from the default flow entirely. The AI's recommendation should be trusted by default. If users want to customize, they can do so from within the Blitz mode (tap task → toggle off, long-press → remove). Goal: zero decisions between "Scan" and "Start cleaning."

---

### 3.6 Scan-to-Clean Pipeline

#### [CRITICAL] FLOW-01: Pipeline Has Too Many Intermediate Screens

Current flow: Camera → Scanning → AI Detection → Results → Task Customize → Task Detail → Focus/Blitz = 6-7 screens before cleaning starts.

- **Fix:** Collapse to 4 screens:
  1. **Camera** — capture
  2. **Scanning** — processing animation
  3. **Results + Quick Start** — merge AI Detection, Results, and Customize into one screen. Show bounding boxes at top, task summary beneath, prominent "Start Cleaning" button. Customization as an expandable drawer.
  4. **Blitz / Focus Mode** — cleaning begins

  Task Detail should be accessible as a drill-down from within Blitz mode, not a mandatory pre-step.

---

### 3.7 Timer & Blitz UX

#### [HIGH] TIMER-01: Blitz Timer May Induce Time Anxiety

The large red/coral pie-chart countdown is visually dominant. For ADHD users with time blindness, it can be panic-inducing.

- **Fix:** (a) Add "Pause & Breathe" option — when tapped, show a 4-7-8 breathing animation with Dusty. (b) Offer timer style preference in settings: countdown, count-up (less anxiety), or hidden (task-only). (c) Change fill color from coral to calmer teal, reserving coral only for final 2 minutes.

#### [MEDIUM] TIMER-02: Transport Controls Lack Labels

Stop, pause, and skip buttons are icon-only. In a cleaning context, icon ambiguity costs seconds.

- **Fix:** Add labels beneath each control: "End," "Pause," "Skip." Increase tap targets to 48x48pt minimum.

---

### 3.8 Color Coding System

#### [HIGH] COLOR-01: Task Priority Dot Colors Are Undefined

Colored dots (green, amber, red) next to tasks have no legend. Users must guess their meaning.

- **Fix:** Add a dismissible tooltip on first encounter, or replace dots with text chips ("Easy," "Medium," "Hard").

#### [MEDIUM] COLOR-02: Multi-Segment Progress Bar Is Ambiguous

The green/coral/red progress bar in Single Task Focus has no context for what each color means.

- **Fix:** Use a single-color bar that grows. Mark completed segments with checkmarks, skipped with gray.

#### [MEDIUM] COLOR-03: Room Status Labels Use Inconsistent Tone

"Needs love" is warm; "Needs attention" is clinical. "Sparkling" is celebratory; "Fresh" is neutral.

- **Fix:** Unified scale: "Sparkling" (green) → "Looking good" (teal) → "Getting messy" (amber) → "Needs love" (red).

---

### 3.9 Celebration & Reward Design

#### [HIGH] CELEB-01: Session Complete Is Underwhelming

After a 15-minute Blitz, the celebration shows static Dusty, plain stats, a progress bar. No animation, confetti, sound, or haptic indicated.

- **Fix:** (a) Confetti burst animation on entry. (b) Stats count up with micro-interactions. (c) Haptic success tap. (d) Dusty celebration dance. (e) Shareable achievement card.

#### [HIGH] CELEB-02: Micro-Celebrations for Individual Tasks Are Absent

Completing a task appears to simply advance to the next with no reward.

- **Fix:** On each task completion: (a) checkmark burst animation, (b) "+15 XP" flyup, (c) new Dusty encouragement phrase, (d) light haptic tap.

#### [MEDIUM] CELEB-03: Room Complete Is Good but Could Be Better

Before/after comparison is a standout feature.

- **Fix:** Make before/after a full-width swipe comparison slider. Add "Save to Photos" option. Include streak/level-up callouts.

---

### 3.10 Error Handling

#### [MEDIUM] ERR-01: AI Error Uses Alarming Visual Language

Red circle with "!" can trigger outsized emotional response in ADHD users with rejection sensitive dysphoria.

- **Fix:** Replace with Dusty looking confused. Change to amber. Reframe headline: "Let's try a different angle."

---

### 3.11 ADHD-Specific Core Experience Issues

#### [HIGH] ADHD-CORE-01: No Body-Doubling Feature

Dusty is currently passive during Blitz mode. ADHD users benefit dramatically from virtual body-doubling.

- **Fix:** During Blitz, show Dusty "cleaning" in a small animation loop. Have Dusty react on completion (celebration) or on pause (gentle nudge: "Still there? No rush!").

#### [HIGH] ADHD-CORE-02: No Transition Support Between Tasks

The moment between finishing one task and starting the next is a high-risk dropout point.

- **Fix:** Insert 3-second micro-celebration + auto-advance between tasks. Never show a blank state between tasks.

#### [HIGH] ADHD-CORE-03: No "Just One Thing" Minimal Mode

Some days, even 15 minutes is overwhelming. No visible path for "I can only do one thing."

- **Fix:** Add "Just One Thing" mode from home. Dusty suggests one task. One tap to start, one tap to complete, full celebration. Keeps streak alive on hard days.

#### [MEDIUM] ADHD-CORE-04: Time Estimates Lack Confidence Framing

"~25 min" and "~3 minutes" — the tilde implies uncertainty, triggering time-anxiety.

- **Fix:** "About 25 min — most people finish in 20-30" or "3 min or less." After calibration: "Based on your speed, about 3 min."

#### [MEDIUM] ADHD-CORE-05: No Re-Engagement Nudge After Pause

If a user pauses mid-Blitz and gets distracted, nothing pulls them back.

- **Fix:** After 2 min inactivity: "Your Blitz is paused — 8 minutes left whenever you're ready!" After 5 min: "Dusty saved your spot." Zero-guilt language always.

#### [HIGH] ADHD-CORE-06: Back Arrow Tap Targets Too Small

Navigation back arrows appear ~32pt. During cleaning, users may have wet/dirty hands.

- **Fix:** All navigation targets minimum 44x44pt (Apple HIG), recommended 48x48pt. Extend tappable area with invisible padding.

#### [HIGH] ADHD-CORE-07: Scroll Affordance Missing on Populated Home

Room cards cut off at bottom with no visual indicator content continues.

- **Fix:** Show last visible element at ~30% visibility to signal scrollability.

---

## SECTION 4: Progress & Achievements

### 4.1 Progress — Populated

**What works:**
- Weekly streak visualization with green checks and fire icon is immediately legible
- "5 Day Streak!" card is prominently displayed and emotionally resonant
- Dusty's encouragement quote ("Small progress is still progress. You cleaned 3 more tasks than last week!") uses relative comparison rather than absolute judgment — perfect for ADHD

#### [MEDIUM] PROG-01: Missing Status Bar

The populated progress state is missing the iOS status bar. The empty state has it. Inconsistency.

- **Fix:** Add status bar to all screen states.

#### [HIGH] PROG-02: No Time-Range Toggle

Weekly view only shows current week. Users who had a bad week see only failure. No month/all-time view.

- **Fix:** Add segmented control: Week / Month / All Time. Default to the most flattering view.

#### [MEDIUM] PROG-03: Stats Feel Like a Wall of Numbers

Four stat boxes with equal visual weight create a "number dump."

- **Fix:** Highlight the single most improved stat with a "Personal Best" badge. Make others secondary.

---

### 4.2 Achievements

**What works:**
- Level system with XP bar provides persistent progression
- Mix of earned, in-progress, and locked badges creates healthy goal ecosystem
- "Mystery" badge with "???" is an excellent curiosity hook for novelty-seeking ADHD brains

#### [HIGH] ACH-01: Badge Icons Are Too Small

2-column grid creates visually similar cards. Icons are tiny and don't read well.

- **Fix:** Increase to single-column layout with larger icons (48x48pt minimum), or keep 2-column with 32x32pt icons and bolder artwork.

#### [MEDIUM] ACH-02: No Badge Detail View

Tapping a badge should open a detail sheet with description, progress, and motivational message.

- **Fix:** Build badge detail bottom sheet modal.

#### [MEDIUM] ACH-03: XP Earning Is Opaque

Screen shows XP but never explains how it's earned. ADHD users are more motivated when they understand the rules.

- **Fix:** Add "XP Guide" accessible from the level card.

---

## SECTION 5: Profile & Settings

### 5.1 Profile

**What works:**
- Dusty mood system (Happiness/Energy/Hunger) is a Tamagotchi mechanic — genius for ADHD engagement
- User card with level and XP creates clear identity anchor

#### [HIGH] PROF-01: Mascot Mood Stat Bars Are Too Small

If the Tamagotchi mechanic is a core engagement driver, it needs visual prominence.

- **Fix:** Make companion section 40% taller with readable bars. Add numeric values (e.g., "Happiness: 85%").

#### [MEDIUM] PROF-02: Profile Feels Sparse

Below companion and stats, only "Upgrade to Pro" card. No recent activity or milestones.

- **Fix:** Add "Recent Activity" section showing last 3-5 completed tasks or achievements.

#### [MEDIUM] PROF-03: "Upgrade to Pro" Placement Feels Intrusive

Profile is where users see themselves, not where they want to be sold to.

- **Fix:** Move upsell to Progress or Achievements screen, or show contextually when hitting free-tier limits.

#### [MEDIUM] PROF-04: No Way to Customize Dusty From Profile

Companion section shows Dusty but provides no interaction.

- **Fix:** Make Dusty portrait tappable → companion detail/customization screen (also a Pro feature opportunity).

---

### 5.2 Settings

#### [HIGH] SET-01: Missing Data/Privacy Management

No option to export data, view collection practices, or manage privacy. GDPR/CCPA compliance risk.

- **Fix:** Add "Privacy & Data" section with export, deletion request, and policy access.

#### [MEDIUM] SET-02: No Notification Schedule Customization

"Notifications" is listed but no way to customize timing or frequency.

- **Fix:** Expand into sub-screen: reminder times, frequency, types, quiet hours.

#### [MEDIUM] SET-03: Theme Color UI Is Inadequate

Only shows a single coral dot. No mechanism to select alternatives.

- **Fix:** Implement proper color picker (swatch row, 5-8 options) or remove until functional.

#### [MEDIUM] SET-04: No Sign-Out Option

The Account section has no logout. Users must be able to sign out.

- **Fix:** Add "Sign Out" to Account section.

---

## SECTION 6: Design System Consistency

### 6.1 Color Usage

#### [HIGH] DS-01: Coral Is Overused for Every Interactive Element

When one color means "button," "selected tab," "toggle on," "progress bar," "badge," "link," and "highlight" simultaneously, it means nothing.

- **Fix:** Introduce three-tier hierarchy:
  - **Primary action** (coral): CTA buttons only
  - **Secondary accent** (lighter coral/peach): Toggles, selections, progress
  - **Tertiary accent** (warm gray/muted coral): Decorative highlights, borders

#### [MEDIUM] DS-02: No Semantic Color Tokens

The design doesn't use semantic naming (`color-action-primary`, `color-feedback-success`).

- **Fix:** Define and enforce semantic color tokens across all screens.

---

### 6.2 Mascot Consistency

#### [CRITICAL] DS-03: Dusty Appears in 3+ Incompatible Art Styles

The mascot is the emotional core of the app. Currently: (1) Splash: simple minimal blob, (2) Welcome/Meet: detailed watercolor hamster, (3) Session Done: darker less refined variant, (4) Room Complete: celebration variant. These feel like four different characters.

- **Fix:** Commission a unified Dusty style guide with fixed proportions, color palette, expression sheet, and pose library. The watercolor style from Welcome is most emotionally appealing — use as baseline but simplify for consistency and animation readiness. Redraw all instances.

---

### 6.3 Typography & Spacing

#### [MEDIUM] DS-04: Inconsistent Text Sizing

Some screens use noticeably smaller text than comparable elements elsewhere.

- **Fix:** Define type scale: Display (28pt+), Title (22-24pt), Body (16-17pt), Caption (13-14pt), Micro (11-12pt).

#### [MEDIUM] DS-05: Vertical Rhythm Is Inconsistent

Spacing between card elements varies screen to screen.

- **Fix:** Define 8pt spacing grid and enforce across all screens.

---

### 6.4 Navigation Consistency

#### [HIGH] NAV-01: Mix of Push and Modal Without Clear Rules

Some screens use back arrows (push), others use "x" close (modal). No discernible rule.

- **Fix:** Define: modals for interruptions/overlays (paywall, permissions). Push for hierarchical drilling (settings > sub-pages).

#### [HIGH] NAV-02: Inconsistent Header Patterns

Some screens show status bar, some don't. Header layouts vary.

- **Fix:** Consistent template: Status bar (always) + Back button (when navigable) + Title + Optional right action.

---

### 6.5 Missing States

#### [HIGH] NAV-03: No Offline State Design

No visible offline handling. AI scanning requires connectivity, but existing data should be accessible.

- **Fix:** Design offline banner and graceful degradation for all screens.

#### [MEDIUM] NAV-04: No Skeleton/Loading Screens

No loading state designs for data-heavy screens.

- **Fix:** Skeleton screens (gray placeholder shapes) instead of spinners — reduce perceived wait time.

---

## SECTION 7: Complete User Flow Analysis

### 7.1 Journey Map

**Phase 1: Onboarding (11+ screens)**
Splash → Welcome → Problem → Energy → 6 Quiz Questions → Scan Intro → Meet Mascot → Building Plan → Plan Preview → Commitment → Paywall

**Phase 2: Auth (3 screens)**
Sign In / Sign Up / Forgot Password

**Phase 3: Core Loop (11 screens)**
Home → Camera Permission → Camera → Scanning → AI Detection → Results → Task Customize → Room Detail → Task Detail → Focus/Blitz → Session/Room Complete

**Phase 4: Engagement (6 screens)**
Today's Tasks → Rooms List → Progress → Achievements → Profile → Notifications

**Phase 5: Settings (2 screens)**
Settings → Delete Account

**Phase 6: Error States (2 screens)**
AI Error → Camera Permission Denied

### 7.2 Drop-Off Risk Points

| Risk Point | Severity | Analysis |
|------------|----------|----------|
| **11+ screens before core value** | CRITICAL | Users must tap through 11+ screens before scanning a room. Each screen loses ~8-12% of ADHD users. |
| **Paywall before experience** | HIGH | Asking for $49.99/year with zero evidence the app works. |
| **Empty home → first scan** | HIGH | Transition from guided onboarding to unguided app is a cliff. First home visit needs aggressive prompt. |
| **Session complete → next session** | MEDIUM | After celebration, the "what next?" moment needs explicit guidance. |

### 7.3 Recommended Flow Optimizations

1. **Reduce onboarding to 5-7 screens.** Merge steps, reduce quiz questions from 6 to 3.
2. **Move paywall to after first completed task.** "Aha-moment paywall" converts 2-4x better.
3. **Add "Quick Start" bypass.** "Skip to scanning" link on second screen.
4. **Implement "gentle re-entry."** After 2+ days inactive: "Hey! Want a quick 5-minute session?" (not guilt-inducing home screen).
5. **Never show a dead end.** Every screen must answer "What should I do next?"

---

## SECTION 8: Prioritized Implementation Roadmap

### CRITICAL — Ship Blockers (Must fix before any public release)

| # | Issue | Est. Effort | Rationale |
|---|-------|-------------|-----------|
| C1 | Fix mascot transparency artifacts (SPL-01, WEL-01, MSC-01) | 0.5-1 day | First impression is "broken app" |
| C2 | Redesign paywall — reduce to 3 bullets, remove value cards, single price display (PAY-01) | 2-3 days design, 1-2 days dev | Direct revenue impact; current design repels ADHD users |
| C3 | Unify Dusty mascot art style (DS-03) | 5-7 days illustration, 1-2 days swap | Brand integrity; emotional bond requires visual consistency |
| C4 | Fix tab bar consistency — always show labels (TAB-01) | 0.5 days | Baseline accessibility; spatial consistency |
| C5 | Shorten onboarding to 5-7 screens (WEL-02, ADHD-OB-01) | 2-3 days design, 2-3 days dev | Each unnecessary screen loses 8-12% of ADHD users |
| C6 | Collapse scan-to-clean pipeline from 7 to 4 screens (FLOW-01) | 2-3 days design, 3-4 days dev | Too many screens before first clean = abandonment |
| C7 | Remove Task Customize from default flow (TASK-01) | 1-2 days | Zero decisions between scan and cleaning |
| C8 | Add terms/privacy to sign-up (AUTH-02) | 0.5 days | Legal compliance (GDPR, CCPA, App Store) |

### HIGH — Before v1 Launch

| # | Issue | Est. Effort | Rationale |
|---|-------|-------------|-----------|
| H1 | Move paywall to after first room scan (PAY-02) | 2-3 days | 2-4x conversion improvement potential |
| H2 | Add back/skip to all onboarding screens (ACK-01, QIZ-01) | 1 day | Navigation consistency; reduce ADHD anxiety |
| H3 | Three-tier color hierarchy (DS-01) | 2-3 days design, 2-3 days dev | Visual hierarchy currently non-functional |
| H4 | Remove/substantiate "92%" claim (CMT-01) | 0.5 days | Trust risk for authenticity-first brand |
| H5 | Redesign progress empty state — hide zeros (EMP-01) | 1-2 days | Zeros reinforce failure at most fragile moment |
| H6 | Add onboarding resume mechanism (ADHD-OB-02) | 1-2 days dev | ADHD users will get distracted mid-onboarding |
| H7 | Add password strength indicator (AUTH-01) | 0.5 days | Security baseline |
| H8 | Add micro-celebrations between tasks (CELEB-02) | 2-3 days | Continuous dopamine loop, not just at session end |
| H9 | Improve Session Complete celebration (CELEB-01) | 1-2 days | Dopamine payoff must match effort investment |
| H10 | Add "Just One Thing" mode (ADHD-CORE-03) | 2-3 days | Lowers engagement floor for hard days |
| H11 | Consistent headers & navigation patterns (NAV-01, NAV-02) | 2-3 days | Predictable navigation reduces ADHD disorientation |
| H12 | Increase badge sizes + add detail view (ACH-01, ACH-02) | 2-3 days | Key retention mechanic; currently too small |
| H13 | Enlarge mascot mood stat bars (PROF-01) | 0.5-1 day | Core differentiator needs visual prominence |
| H14 | Add data privacy management (SET-01) | 1-2 days | Regulatory compliance |
| H15 | Design offline state + skeleton screens (NAV-03, NAV-04) | 2-3 days design, 3-4 days dev | Broken experience on poor connectivity |
| H16 | Add social proof to paywall (testimonials, user count) | 1 day | Empty trust signals on $49.99/year ask |
| H17 | Undefined color dots — add legend or text labels (COLOR-01) | 1 day | Accessibility; colorblind users can't read red/green |

### MEDIUM — Soon After Launch (v1.1-v1.2)

| # | Issue | Est. Effort | Rationale |
|---|-------|-------------|-----------|
| M1 | Time-range toggle on Progress (PROG-02) | 2-3 days | Trapped in "bad week" view is demotivating |
| M2 | Notification schedule customization (SET-02) | 2-3 days | ADHD users need timing control |
| M3 | Timer style preferences (TIMER-01) | 1-2 days | Countdown is anxiety-inducing for some |
| M4 | Body-doubling Dusty animations (ADHD-CORE-01) | 2-3 days | Virtual body-double transforms passive mascot |
| M5 | Task transition micro-celebrations (ADHD-CORE-02) | 1-2 days | Momentum between tasks |
| M6 | Forgot password confirmation state (AUTH-03) | 1 day | Basic flow completeness |
| M7 | Camera permission redesign (PRM-01) | 1 day | Core feature shouldn't feel like an error |
| M8 | Re-engagement nudges mid-Blitz (ADHD-CORE-05) | 1-2 days | Pull back distracted users |
| M9 | Recent activity feed on Profile (PROF-02) | 2-3 days | Profile richness |
| M10 | XP earning transparency (ACH-03) | 1-2 days | Users need to understand reward rules |
| M11 | Theme color picker or remove (SET-03) | 1-2 days | Non-functional UI element |
| M12 | Sign-out option (SET-04) | 0.5 days | Standard account management |
| M13 | Room status label consistency (COLOR-03) | 0.5 days | Tonal register should be unified |
| M14 | Auto-renewal terms explicit (PAY-03) | 0.5 days | App Store compliance |
| M15 | Define & document type scale (DS-04) | 1-2 days | Consistency |
| M16 | 8pt spacing grid (DS-05) | 1-2 days | Vertical rhythm consistency |
| M17 | Transport control labels (TIMER-02) | 0.5 days | Clarity during cleaning |
| M18 | Commitment checkbox start unchecked (CMT-02) | 0.5 days | Reduce dark pattern perception |
| M19 | Semantic color tokens (DS-02) | 2-3 days | Scalability |

### LOW — Future Improvements (v1.3+)

| # | Issue | Est. Effort | Rationale |
|---|-------|-------------|-----------|
| L1 | Social sharing for badges/achievements | 2-3 days | Engagement + organic acquisition |
| L2 | Custom branded tab icons | 1-2 days | Brand differentiation |
| L3 | Level roadmap preview | 1 day | Long-term aspiration |
| L4 | "DELETE" typing confirmation | 0.5 days | Safety net for irreversible action |
| L5 | Consider $39.99/year launch pricing | Analysis | Lower friction; increase later |
| L6 | Tab bar notification badges | 1 day | Dusty mood + achievement alerts |
| L7 | Avatar system review (AI vs illustrated) | 2-3 days | Uncanny valley risk |
| L8 | Sensory customization in settings (ADHD-CORE-06) | 2-3 days | Haptics, sounds, commentary toggles |
| L9 | Swipe gestures on task lists | 1-2 days | Fluid cleaning flow |
| L10 | Before/after full-width swipe comparison (CELEB-03) | 1-2 days | Enhanced celebration |
| L11 | Room complete save to photos | 0.5 days | User-requested feature likely |
| L12 | Onboarding time estimate (ADHD-OB-03) | 0.5 days | Sets expectations |
| L13 | Scan intro Dusty illustration (SCN-01) | 1 day | Engagement opportunity |
| L14 | Empty state time estimates (EMP-02) | 0.5 days | ADHD-friendly urgency |
| L15 | Building plan time estimate (BLD-01) | 0.5 days | Reduce anxiety |

---

## Final Recommendation

The **highest-leverage investment** before launch is the **paywall redesign** (C2) combined with **paywall repositioning** (H1). Together, these address the app's most critical revenue and retention risks. A paywall that is ADHD-friendly in design *and* positioned after the first "aha moment" could improve free-to-paid conversion by 2-4x.

The **second highest-leverage** investment is **mascot consistency** (C3). Dusty is the soul of this product. Every screen where Dusty looks like a different character breaks the emotional thread. A unified style guide is not cosmetic — it is brand integrity.

The **third highest-leverage** investment is **pipeline compression** (C6 + C7). Reducing scan-to-clean from 7 screens to 4, and removing Task Customize from the default flow, directly attacks the biggest behavioral barrier for ADHD users: initiating action.

**Declutter is building something genuinely needed.** The path from here to a successful launch is not about adding more — it is about refining what exists until the execution matches the empathy of the vision.

---

*Total issues identified: 78*
*Critical: 10 | High: 24 | Medium: 30 | Low: 14*
