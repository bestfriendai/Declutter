# Declutter V1 — Master Review & Action Plan
**Date:** March 18, 2026
**Scope:** Design (54 screens), Codebase, User Flow, Functionality, Missing Screens

---

## Current State: B- (6.8/10 average)

The app has world-class AI analysis, excellent ADHD-friendly copy, and a compelling core concept. But the execution has critical gaps: fabricated paywall claims, inconsistent mascot art, dead code features, no daily return loop, and 8+ missing screens required for launch.

---

## P0: APP STORE REJECTION RISKS (Fix Immediately)

| Issue | Screen | Action |
|-------|--------|--------|
| Fabricated "Editor's Choice" badge | Paywall (PQtOl/VfgR5) | REMOVE — Apple will reject instantly |
| "165K+ ratings" for pre-launch app | Paywall | REMOVE — fabricated data |
| Fake review from "Sarah K." | Paywall | REMOVE or replace with real beta feedback |
| Missing Delete Account option | Settings (SQBKW/kHQIP) | ADD — Apple requires since 2022 |
| Missing Terms of Service on Sign Up | Sign Up (OVP4z/rv44t) | ADD checkbox or link |
| Mascot PNG transparency artifacts | Welcome (DQ8lf), Meet Dusty (he85Z), Notification (FEmgi) | Re-export with solid backgrounds |

---

## P1: CRITICAL DESIGN ISSUES

### 1. Mascot Art Inconsistency (4+ different styles)
- Welcome: Gray chinchilla with broom
- Meet Dusty: Thumbs up (dark) vs cloth (light)
- Celebration: Gray bunny with party hat
- Profile: Hamster with blue mug
- **Fix:** Create ONE consistent character with defined poses. Re-generate ALL mascot images with same prompt style.

### 2. Step Indicator Broken
- Original onboarding: "Step X of 5" with page dots
- Extended quiz: "STEP X OF 8" uppercase coral
- **Fix:** Unify to ONE system across the full 13-step flow

### 3. Text Contrast Failures
- Multiple subtitle/secondary texts below WCAG AA (4.5:1)
- Card borders nearly invisible in light mode
- Quiz option descriptions almost illegible in dark mode
- **Fix:** Increase secondary text to #FFFFFF99 (dark) / #4B5563 (light) minimum

### 4. Small Icons & Touch Targets
- Quiz card icons ~16px (should be 28-32px)
- Page dots too small to tap
- Close button on paywall too small
- **Fix:** All interactive elements 44x44px minimum

---

## P2: MISSING SCREENS (Must Design for V1)

### Must Have (8 screens x 2 = 16 frames)
1. **Splash/Loading Screen** — Branded launch screen with Dusty
2. **Home Empty State** — New user, 0 rooms: "Scan your first room!"
3. **Rooms Empty State** — "Add your first room" with guidance
4. **Progress Empty State** — Day 1: "Your journey starts here"
5. **Camera Permission Denied** — Explanation + "Open Settings" button
6. **AI Analysis Error** — "Let's try again" with retry
7. **Forgot Password** — Email entry for reset
8. **Session Complete** — Blitz timer finished (different from Room Complete)

### Should Have (6 screens x 2 = 12 frames)
9. **Achievements Screen** — Badge grid, XP, streak records
10. **Insights/Analytics** — Charts, trends, time period toggle
11. **Welcome Back State** — Returning after 5+ days absence
12. **Overwhelm Modal** — "Feeling overwhelmed?" intervention
13. **Task Detail Modal** — Edit/view individual task
14. **Account Deletion Confirmation** — Required by Apple

---

## P3: CRITICAL FUNCTIONALITY GAPS

### 1. 15-Minute Blitz Doesn't Exist
The hero feature advertised on the home screen is not a unified experience. The focus timer and task list are disconnected screens. **Build `app/blitz.tsx` as a guided session: timer + single-task view + AI task selection + auto-advance + celebration.**

### 2. Task Optimizer is Dead Code
`services/taskOptimizer.ts` has a sophisticated ADHD-aware scoring algorithm (energy matching, visual impact, decision load avoidance) that is NEVER CALLED from any screen. **Wire it up to Results and Room Detail.**

### 3. No Daily Return Loop
Once initial tasks are done, there's nothing new. Rooms don't decay, daily missions don't generate. **Implement room freshness decay + daily AI-generated missions.**

### 4. Mascot Has No Mechanics
Hunger/energy/happiness exist in schema but there's no feeding, no interaction, no connection to cleaning. **Connect mascot mood to real cleaning activity. Feed = complete task. Happy = streak maintained.**

### 5. Non-Functional Features Still Accessible
Social, accountability, collection, challenges are reachable but are facades. **Hide or remove from navigation until functional.**

---

## TOP 20 IMPROVEMENTS (Ranked by Impact)

| # | Improvement | Impact | Effort |
|---|------------|--------|--------|
| 1 | Build unified 15-Min Blitz guided session | 10/10 | High |
| 2 | Wire up taskOptimizer.ts to Results + Room Detail | 9/10 | Medium |
| 3 | Implement room freshness decay + daily missions | 9/10 | High |
| 4 | Add confetti + haptic on task completion (Lottie + expo-haptics) | 9/10 | Low |
| 5 | Fix mascot consistency (one art style, all screens) | 8/10 | Medium |
| 6 | Connect mascot mood to real cleaning behavior | 8/10 | Medium |
| 7 | Fix focus timer to work in background (expo-notifications) | 8/10 | Medium |
| 8 | Remove fabricated paywall claims | 8/10 | Trivial |
| 9 | Design + build all empty states | 7/10 | Medium |
| 10 | Shorten onboarding to 8 steps (combine Q1+Q3) | 7/10 | Low |
| 11 | Add streak forgiveness ("best week this month") | 7/10 | Low |
| 12 | Before/after photo comparison on room complete | 7/10 | Medium |
| 13 | Push notifications with warm ADHD-friendly copy | 6/10 | Medium |
| 14 | Add ambient sounds to Blitz timer | 6/10 | Medium |
| 15 | Weekly shareable progress card | 6/10 | Medium |
| 16 | Hide non-functional features (social, accountability) | 6/10 | Trivial |
| 17 | Fix text contrast across all screens | 5/10 | Low |
| 18 | Add loading skeletons for all data screens | 5/10 | Medium |
| 19 | Implement offline support with queue | 5/10 | High |
| 20 | Add "spiciness level" to task breakdown (Goblin Tools pattern) | 5/10 | High |

---

## COMPLETE V1 SCREEN INVENTORY

### Designed (27 unique screens, 54 dark+light)
| Flow | Screen | Dark | Light | Score |
|------|--------|------|-------|-------|
| Onboarding | Welcome | DQ8lf | q2KNR | 5/10 |
| Onboarding | Problem | 0vlrV | Z3UV5 | 7/10 |
| Onboarding | Energy | benVE | KYQ8r | 7/10 |
| Onboarding | Q1 Living | XXg5C | mih2N | 7/10 |
| Onboarding | Q2 Struggle | 00w1I | rrIvs | 7/10 |
| Onboarding | Q3 Time | f0TBA | hX52r | 6/10 |
| Onboarding | Q4 Motivation | ywEjk | bvrem | 7/10 |
| Onboarding | Scan Intro | ziWlG | RdUBT | 6/10 |
| Onboarding | Meet Mascot | he85Z | fI252 | 6/10 |
| Onboarding | Building Plan | Mg2zo | tNdGB | 6/10 |
| Onboarding | Plan Preview | 4HZpf | nJvGh | 8/10 |
| Onboarding | Commitment | KpLD1 | uEtJh | 7/10 |
| Onboarding | Paywall | PQtOl | VfgR5 | 7/10 |
| Core | Home | rSSHH | oDOBX | 8/10 |
| Core | Camera | KzTY3 | KaGUR | 7/10 |
| Core | Scanning | 7iGXL | hWBVs | 7/10 |
| Core | Results | 30nGD | oHsuc | 7/10 |
| Core | Room Detail | gRNd7 | bSDRz | 7/10 |
| Core | Blitz Timer | 0mb7F | MZhKY | 7/10 |
| Auth | Sign In | Al4tq | PKklH | 6/10 |
| Auth | Sign Up | OVP4z | rv44t | 6/10 |
| Extra | Notification | FEmgi | rAs9n | 7/10 |
| Extra | Celebration | oRx3i | 0yQpL | 8/10 |
| Extra | Rooms List | gl9CC | vrGH2 | 7/10 |
| Profile | Progress | jWOvn | RLHTy | 7/10 |
| Profile | Profile | qscRN | v5MmJ | 7/10 |
| Profile | Settings | SQBKW | kHQIP | 7/10 |

### Still Missing (Must Design)
1. Splash Screen
2. Home Empty State
3. Rooms Empty State
4. Progress Empty State
5. Camera Permission Denied
6. AI Error State
7. Forgot Password
8. Session Complete (Blitz Done)
9. Achievements
10. Account Deletion

---

## WHAT SHIPS IN V1 (Final Feature List)

### Core (ship at launch)
- AI Room Scan + Task Breakdown (with taskOptimizer wired up)
- 15-Minute Blitz guided session (NEW — must build)
- Room freshness tracking
- Progress + streaks (with forgiveness)
- Mascot (consistent art, connected to behavior)
- Paywall (clean — no fabricated claims)

### Deferred to V1.1
- Social / Community features
- Accountability partner
- Leaderboards / Challenges
- Collection system
- Insights / Analytics dashboard
- Ambient sounds in timer

### Cut Entirely from V1
- AR collection
- White noise types
- Variable rewards schema
- Accountability pairs schema
