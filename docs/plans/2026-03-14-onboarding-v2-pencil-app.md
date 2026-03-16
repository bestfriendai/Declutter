# Onboarding V2 Pencil App Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the app use the Pencil `Onboarding V2 - 12 Screen Personalization Flow` as the canonical new-user journey and finish the remaining Pencil-aligned mobile surfaces.

**Architecture:** Keep the existing Expo Router structure and Convex-backed auth/data model, but replace the current onboarding entry flow with a data-driven 12-step experience that feeds into paywall and notification permission. Reuse the existing designed app surfaces where they already match the Pencil file, patch only the gaps, and verify the routing/state handoff so authenticated and unauthenticated users land on the correct screens.

**Tech Stack:** Expo Router, React Native, TypeScript, Convex, Reanimated, Expo Linear Gradient, Expo Haptics, existing app theme/context stack.

---

### Task 1: Route And State Canonicalization

**Files:**
- Modify: `/Users/iamabillionaire/Downloads/Declutter/app/index.tsx`
- Modify: `/Users/iamabillionaire/Downloads/Declutter/app/splash.tsx`
- Modify: `/Users/iamabillionaire/Downloads/Declutter/app/onboarding.tsx`
- Modify: `/Users/iamabillionaire/Downloads/Declutter/context/DeclutterContext.tsx`
- Modify: `/Users/iamabillionaire/Downloads/Declutter/types/declutter.ts`

**Step 1: Define onboarding completion behavior**
- Use `user.onboardingComplete` as the canonical signal for whether a signed-in user has finished onboarding.
- Route unauthenticated users into the V2 onboarding flow instead of the legacy 3-screen path.
- Route authenticated users with incomplete onboarding back into V2 until completion.

**Step 2: Persist onboarding completion**
- Make `completeOnboarding()` update local state and persist the flag through the existing Convex user update pathway when possible.
- Keep the implementation tolerant of guest/local-only use.

**Step 3: Keep legacy entry points safe**
- Make `/splash` a lightweight alias/entry that forwards into the V2 flow rather than leaving dead-end legacy onboarding.
- Preserve `/auth/login` and `/auth/signup` as dedicated auth screens.

**Step 4: Verify routing**
- Check the unauthenticated path: `index -> onboarding`.
- Check the authenticated incomplete path: `index -> onboarding`.
- Check the authenticated complete path: `index -> (tabs)`.

### Task 2: Implement Pencil Onboarding V2

**Files:**
- Modify: `/Users/iamabillionaire/Downloads/Declutter/app/onboarding.tsx`
- Create or modify as needed under: `/Users/iamabillionaire/Downloads/Declutter/components/ui/`
- Optionally create: `/Users/iamabillionaire/Downloads/Declutter/constants/` or `/Users/iamabillionaire/Downloads/Declutter/types/`

**Step 1: Build a data-driven 12-step flow**
- Represent the 12 Pencil V2 screens as a typed step array with copy, question metadata, option sets, and special step kinds.
- Include dark/light styling and transitions that match the `.pen` flow directionally.

**Step 2: Cover all V2 screens**
- `01 Welcome`
- `02 Problem Acknowledgment`
- `03 Q1 Living Situation`
- `04 Q2 Biggest Struggle`
- `05 Q3 Energy Today`
- `06 Q4 Time Available`
- `07 Q5 Motivation`
- `08 Q6 Meet Your Guide`
- `09 Building Your Plan`
- `10 Your Plan Preview`
- `11 Commitment`
- `12 Paywall`

**Step 3: Preserve functional handoff**
- Keep auth/paywall/notification transitions working.
- Finish onboarding by calling `completeOnboarding()` and route into the appropriate next screen.

**Step 4: Maintain accessibility and mobile constraints**
- Safe-area aware layout
- Keyboard-safe auth/CTA moments
- Touchable targets for answers and navigation
- Reduced-motion tolerant animations

### Task 3: Pencil Surface Audit And Gap Patches

**Files:**
- Modify as needed:
  - `/Users/iamabillionaire/Downloads/Declutter/app/analysis.tsx`
  - `/Users/iamabillionaire/Downloads/Declutter/app/room/[id].tsx`
  - `/Users/iamabillionaire/Downloads/Declutter/app/(tabs)/index.tsx`
  - `/Users/iamabillionaire/Downloads/Declutter/app/(tabs)/progress.tsx`
  - `/Users/iamabillionaire/Downloads/Declutter/app/(tabs)/profile.tsx`
  - `/Users/iamabillionaire/Downloads/Declutter/app/settings.tsx`
  - `/Users/iamabillionaire/Downloads/Declutter/app/paywall.tsx`
  - `/Users/iamabillionaire/Downloads/Declutter/app/social.tsx`
  - `/Users/iamabillionaire/Downloads/Declutter/app/achievements.tsx`
  - `/Users/iamabillionaire/Downloads/Declutter/app/accountability.tsx`

**Step 1: Compare implemented screens to Pencil groups**
- Core app: Home, Room Detail, Analysis Scan/Results
- Secondary app: Progress, Achievements
- Account/monetization/social: Profile, Settings, Paywall, Social, Accountability

**Step 2: Patch only material gaps**
- Fix routing dead ends
- Fix missing CTA/state hookups
- Fix obvious styling regressions that prevent screens from resembling the Pencil designs
- Avoid broad rewrites of already aligned screens

**Step 3: Keep shared patterns consistent**
- Reuse existing theme and component primitives
- Avoid duplicating button/card/list patterns unless a Pencil-specific variant is required

### Task 4: Verification

**Files:**
- Modify only if verification reveals issues

**Step 1: Static verification**
- Run `npm run typecheck`
- Run `npm test -- --runInBand`

**Step 2: Runtime verification**
- Start Expo and smoke-test the primary route flow
- Confirm onboarding progression, paywall handoff, notification permission route, and post-completion landing

**Step 3: Final cleanup**
- Fix any type/runtime regressions introduced during onboarding V2 work
- Summarize any remaining design gaps that require true visual/manual QA on device
