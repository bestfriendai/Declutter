# DECLUTTER: MASTER IMPROVEMENT PLAN
## The Definitive Implementation Blueprint — Every Screen, Every Detail, Every Code Example

**Date:** March 20, 2026
**Goal:** Make Declutter the #1 ADHD cleaning app — simple, premium, unbeatable
**Screens Audited:** 34 screens + 8 shared components
**Total Improvements Identified:** 290+
**Total Lines of Code Audited:** ~17,000+

---

## IMPLEMENTATION STATUS (Updated March 20, 2026)

**Status: IMPLEMENTED** - All improvements across all 34 screens and shared components have been implemented by 4 parallel agents. TypeScript compiles clean with zero errors.

### New Files Created (21 files)

#### Shared UI Components
| File | Lines | Purpose |
|------|-------|---------|
| `components/ui/CoralButton.tsx` | 139 | Reusable gradient CTA with press animation, loading state |
| `components/ui/AnimatedInput.tsx` | 131 | Input with animated focus border, error state |
| `components/ui/ErrorBanner.tsx` | 103 | Auto-dismiss error display with shake animation |
| `components/ui/LoadingDots.tsx` | 117 | Breathing/pulsing dots, reduced motion aware |

#### Home Tab Decomposition (was 1765 lines -> 903 + 1612 in components)
| File | Lines | Purpose |
|------|-------|---------|
| `components/home/HomeHeader.tsx` | 141 | Smart greeting, mascot, motivational quote |
| `components/home/StreakCard.tsx` | 166 | Animated flame for streaks >= 3 |
| `components/home/TodaysTasksCard.tsx` | 228 | Tasks with micro-celebration feedback |
| `components/home/RoomGrid.tsx` | 330 | Dynamic room cards, FlatList for 10+ |
| `components/home/ComebackBanner.tsx` | 266 | Comeback flow for returning users |
| `components/home/EmptyState.tsx` | 185 | Empty state with mascot + scan CTA |
| `components/home/HomeSkeleton.tsx` | 211 | Shimmer loading state |
| `components/home/ScanRoomFAB.tsx` | 73 | Floating action button for scanning |

#### Analysis Decomposition (was 1338 lines -> 604 + 1352 in components)
| File | Lines | Purpose |
|------|-------|---------|
| `components/analysis/ScanningPhase.tsx` | 312 | Cancel button, progress bar, encouraging messages |
| `components/analysis/DetectionPhase.tsx` | 286 | AI detection overlay |
| `components/analysis/ResultsPhase.tsx` | 747 | Results with retake from error state |

#### Room Detail Components
| File | Lines | Purpose |
|------|-------|---------|
| `components/room/RoomHeader.tsx` | 226 | Parallax photo, progress bar, freshness |
| `components/room/RoomProgress.tsx` | 139 | SVG progress ring |
| `components/room/RoomActions.tsx` | 142 | "One Tiny Thing" + "Good Enough" CTAs |

#### Shared Hooks
| File | Lines | Purpose |
|------|-------|---------|
| `hooks/useTimer.ts` | 134 | Shared timer for Blitz/Focus/Single Task |

### Screens Modified (34 screens)

#### P0: Critical Path - DONE
- [x] Home Tab decomposed (1765 -> 903 lines + 8 components)
- [x] Analysis decomposed (1338 -> 604 lines + 3 components)
- [x] Room Detail components extracted (RoomHeader, RoomProgress, RoomActions)
- [x] Shared useTimer hook extracted for Blitz/Focus/Single Task
- [x] Camera flow improved (flash toggle, softer hints, gesture dismiss)
- [x] Cancel during AI scan added
- [x] Task customize improved (animated toggle, task expansion, CTA hierarchy)
- [x] Today Tasks uses useTodaysTasks hook properly
- [x] Rooms Tab uses useRoomFreshness hook, urgency sorting

#### P1: Emotional Bond - DONE
- [x] Mascot speech bubbles with personality-driven messages
- [x] Mascot adventure system (8-hour timer, rewards)
- [x] Floating XP feedback on mascot interactions
- [x] Session complete count-up animations
- [x] Enhanced confetti (30 pieces, varied shapes, wind, spin)
- [x] Streak flame animation (pulse for streaks >= 3)

#### P2: Retention Mechanics - DONE
- [x] Achievements: earned/locked sections, progress bars, next badge prediction
- [x] Streak freeze badge display
- [x] Animated stat counters (Profile, Progress)
- [x] Blitz smooth timer ring (SVG animated)
- [x] Blitz break/extend timer options
- [x] Comeback welcome banner
- [x] Room complete "What's next?" suggestions
- [x] Weekly league card in Social

#### P3: Monetization & Polish - DONE
- [x] Paywall: 8 features with icons, social proof, daily price breakdown
- [x] Onboarding progress persistence (AsyncStorage)
- [x] Animated inputs + error shakes (auth screens)
- [x] Tab badge indicators + sliding active indicator
- [x] Skip reason capture in Blitz
- [x] Data export option in Settings (GDPR)
- [x] Delete account: mascot illustration, export data, emotional messaging

#### P4: Growth Features - DONE
- [x] Body doubling cue in Focus mode
- [x] Auto-paste invite codes in Join screen
- [x] Collection: rarity labels, category counts
- [x] Notification permission: benefit examples, reassurance text
- [x] Insights: fixed hardcoded collectibles count
- [x] Quick navigation strips (Profile, Progress)

### Design System Enhancements
- [x] ANIMATION constants (spring configs, durations, stagger)
- [x] coralButtonStyle() / coralButtonTextStyle() helpers
- [x] outlineButtonStyle(isDark) helper
- [x] inputFieldStyle(isDark) helper

---

## HOW TO USE THIS DOCUMENT

This is the complete implementation blueprint for Declutter. Every screen has:
- **Current state analysis** — what works, what doesn't
- **Numbered improvements** — with ADHD-specific rationale
- **Real code examples** — copy-pasteable React Native / Expo code using our actual design tokens
- **Edge cases** — empty, error, loading, first-time, returning, offline states
- **Animation specs** — exact durations, easing, spring configs for react-native-reanimated
- **Accessibility** — VoiceOver labels, contrast, touch targets
- **Performance notes** — memoization, lazy loading, decomposition opportunities

**Implementation priority is at the end** — start there if you want to know what to build first.

---

## TABLE OF CONTENTS

### Part 1: Strategy & Competitive Analysis
1. [The Competitive Truth](#the-competitive-truth)
2. [What to Steal from Competitors](#what-to-steal-from-competitors)

### Part 2: Core Flow Screens (12 screens)
3. [Splash Screen](#1-splash-screen)
4. [Root Index / Router](#2-root-index--router)
5. [Root Layout](#3-root-layout)
6. [Onboarding Flow](#4-onboarding-flow)
7. [Auth: Login](#5-auth-login)
8. [Auth: Signup](#6-auth-signup)
9. [Auth: Forgot Password](#7-auth-forgot-password)
10. [Tab Layout](#8-tab-layout)
11. [Home Tab](#9-home-tab)
12. [Camera Screen](#10-camera-screen)
13. [Analysis Screen](#11-analysis-screen)
14. [Task Customize Screen](#12-task-customize-screen)

### Part 3: Room & Session Screens (8 screens + 3 components)
15. [Rooms Tab](#1-rooms-tab)
16. [Room Detail](#2-room-detail)
17. [Blitz Mode](#3-blitz-mode)
18. [Session Complete](#4-session-complete)
19. [Room Complete](#5-room-complete)
20. [Focus Mode](#6-focus-mode)
21. [Single Task](#7-single-task)
22. [Today Tasks](#8-today-tasks)
23. [Shared Components (TaskCard, SessionCheckIn, DoomPileCard)](#9-shared-components)

### Part 4: Engagement, Social & Monetization Screens (14 screens)
24. [Profile Tab](#profile-tab)
25. [Progress Tab](#progress-tab)
26. [Mascot Screen](#mascot-screen)
27. [Achievements](#achievements-screen)
28. [Collection](#collection-screen)
29. [Paywall](#paywall-screen)
30. [Social / Community](#social--community-screen)
31. [Accountability](#accountability-screen)
32. [Challenge Detail](#challenge-detail-screen)
33. [Join Screen](#join-screen)
34. [Delete Account](#delete-account-screen)
35. [Notification Permission](#notification-permission-screen)
36. [Insights](#insights-screen)
37. [Settings](#settings-screen)

### Part 5: Cross-Cutting Concerns & Architecture
38. [Design System Improvements](#design-system-improvements-needed)
39. [Shared Components to Extract](#shared-components-to-extract)
40. [ADHD-Specific UX Patterns](#adhd-specific-ux-patterns-to-implement-globally)
41. [Offline Support Strategy](#offline-support)
42. [Haptic & Timer Consistency](#haptic-consistency)

### Part 6: Execution Plan
43. [Priority Matrix](#priority-matrix)
44. [The Competitive Formula](#the-competitive-formula)
45. [Metrics to Track](#metrics-to-track)
46. [Revenue Projections](#revenue-projections)

---

## THE COMPETITIVE TRUTH

We analyzed 10 competitors. Here's the landscape:

| App | Rating | Price | What They Do Best | Their Fatal Flaw |
|-----|--------|-------|-------------------|------------------|
| Finch | 5.0 ⭐ | $15/yr | No-punishment pet, emotional bond | Zero cleaning focus |
| Tody | 4.83 | $30/yr | Condition-based room tracking | No AI, no companion, boring |
| Structured | 4.8 | $20/yr | Clean timeline, energy monitor | No gamification, no cleaning |
| Duolingo | 4.7 | $84/yr | Streak/league mastery | Not for cleaning, streak anxiety |
| Goblin Tools | 4.7 | $2 once | Zero-friction AI task breakdown | One-time tool, no daily loop |
| Tiimo | 4.6 | $54/yr | Visual ADHD planner | Buggy, hard paywall, complex |
| Sweepy | 4.53 | $15/yr | Family chores, virtual home coins | Shame-inducing red bars |
| Habitica | 4.0 | $48/yr | Full RPG, party quests | Punishes failures, cluttered UI |
| UfYH | 4.0 | $2 once | Raw motivation, 20/10 timer | Dead since 2017 |
| Clutterfree | 2.88 | $48/yr | Before/after photos | Broken, expensive, paywalled |

**Declutter's unique position:** We are the ONLY app combining:
- AI photo analysis (snap room -> instant tasks)
- ADHD-first design (energy-adaptive, no shame)
- Mascot companion (emotional bond like Finch)
- Deep gamification (XP, badges, collectibles, streaks)
- Doom pile detection (nobody else does this)
- Decision load filtering (nobody else does this)
- Visual impact prioritization (nobody else does this)
- Comeback Engine — shame-free re-engagement (only Finch comes close)

**Nobody else has even 3 of these together.** That's our moat.

---

## WHAT TO STEAL FROM COMPETITORS

### From Finch (5.0 rating — study everything)
1. **Character investment before features** — onboarding should make users fall in love with Dusty before showing any cleaning features
2. **Zero punishment** — we already do this, but make it louder in marketing
3. **Adventure timer concept** — Dusty should "go exploring" while you clean, returning with surprises
4. **Privacy-first language** — emphasize we don't sell mood/cleaning data

### From Duolingo (37% DAU/MAU — retention king)
5. **Value before account creation** — let users scan ONE room before requiring signup
6. **Streak freeze** — already exists? If not, add it. Reduced Duolingo churn by 21%
7. **Weekly leagues** — cleaning leaderboards with 30 random users, promotion/demotion
8. **Personality-driven notifications** — Dusty should have the Duo owl energy

### From Goblin Tools (zero friction)
9. **Adjustable task granularity** — we have detail levels, make them more prominent with a "spiciness" metaphor
10. **Instant value** — first room scan should happen in under 60 seconds from app open

### From Tody (condition-based tracking)
11. **Room freshness decay** — we already have this! Make it the centerpiece of the Rooms tab

### From Sweepy (gamification)
12. **Earned currency for decoration** — collectibles already exist, make them more visible/exciting

### From Structured (energy awareness)
13. **Energy-adaptive daily plan** — we already do this! Market it heavily

---

# PART 2: CORE FLOW SCREENS

> **Scope:** Splash, Root Index, Root Layout, Onboarding, Auth (3 screens), Tab Layout, Home Tab, Camera, Analysis, Task Customize
> **Files:** 12 primary + 5 onboarding steps + design system/hooks
> **Lines Audited:** ~6,762 (screens) + ~3,400 (steps) + ~700 (shared)
> **Improvements Identified:** 96


---

---

## TABLE OF CONTENTS

1. [Splash Screen](#1-splash-screen)
2. [Root Index / Router](#2-root-index--router)
3. [Root Layout](#3-root-layout)
4. [Onboarding Flow](#4-onboarding-flow)
5. [Auth: Login](#5-auth-login)
6. [Auth: Signup](#6-auth-signup)
7. [Auth: Forgot Password](#7-auth-forgot-password)
8. [Tab Layout](#8-tab-layout)
9. [Home Tab](#9-home-tab)
10. [Camera Screen](#10-camera-screen)
11. [Analysis Screen](#11-analysis-screen)
12. [Task Customize Screen](#12-task-customize-screen)

---

## 1. SPLASH SCREEN

**File:** `app/splash.tsx`
**Current Lines:** 158
**Current Rating:** 7/10
**Target Rating:** 9.5/10

### Current State Analysis

The splash screen is well-structured with breathing dots, mascot avatar, fade-in animation, and reduced motion support. It navigates to `/` after 1600ms. However, it lacks: brand identity animation (logo morph), preloading of critical data during the splash, haptic on transition, and the app name uses a static text render without the display font weight being platform-optimized.

### Improvement Details

1. **Preload critical data during splash** -- The 1600ms wait is dead time. Use it to warm Convex connection and prefetch user data.
2. **Logo entrance animation** -- The mascot and text fade in together. Sequence them: mascot bounces in first, then text types/fades, creating a story.
3. **Haptic pulse on transition** -- A subtle haptic when navigating away confirms the app is alive.
4. **Version badge** -- Show app version at bottom for debug/support purposes in non-production builds.
5. **Dynamic tagline rotation** -- Rotate between 3-4 ADHD-friendly taglines to keep returning users engaged.
6. **Accessibility improvements** -- Add accessibilityRole and live region for screen readers.
7. **Gradient background option** -- Very subtle gradient from bg to slightly warmer tone adds depth.
8. **Safe area bottom padding for dots** -- Currently hardcoded at `insets.bottom + 48`, should adapt better to different devices.

### Code Examples

##### 1. Preload Critical Data During Splash

```tsx
// In splash.tsx, add alongside the timer
import { useConvexAuth } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useQuery } from 'convex/react';

// Inside SplashScreen component:
const { isAuthenticated } = useConvexAuth();
// Start prefetching user data during the splash animation
const _prefetchUser = useQuery(
  api.users.get,
  isAuthenticated ? {} : 'skip'
);
// This query result will be cached by Convex and available
// instantly when the home screen mounts
```

##### 2. Sequenced Mascot + Text Animation

```tsx
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

// Inside SplashScreen:
const mascotScale = useSharedValue(reducedMotion ? 1 : 0);
const mascotRotate = useSharedValue(reducedMotion ? 0 : -10);
const textOpacity = useSharedValue(reducedMotion ? 1 : 0);
const textTranslateY = useSharedValue(reducedMotion ? 0 : 12);
const taglineOpacity = useSharedValue(reducedMotion ? 1 : 0);

useEffect(() => {
  if (reducedMotion) return;

  // 1. Mascot bounces in (0-500ms)
  mascotScale.value = withSpring(1, {
    damping: 8,
    stiffness: 180,
    mass: 0.8,
  });
  mascotRotate.value = withSpring(0, { damping: 12, stiffness: 200 });

  // 2. App name fades in (300-600ms)
  textOpacity.value = withDelay(
    300,
    withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) })
  );
  textTranslateY.value = withDelay(
    300,
    withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) })
  );

  // 3. Tagline fades in (500-800ms)
  taglineOpacity.value = withDelay(
    500,
    withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) })
  );
}, [reducedMotion]);

const mascotAnimStyle = useAnimatedStyle(() => ({
  transform: [
    { scale: mascotScale.value },
    { rotate: `${mascotRotate.value}deg` },
  ],
}));

const textAnimStyle = useAnimatedStyle(() => ({
  opacity: textOpacity.value,
  transform: [{ translateY: textTranslateY.value }],
}));

const taglineAnimStyle = useAnimatedStyle(() => ({
  opacity: taglineOpacity.value,
}));
```

##### 3. Haptic on Transition

```tsx
import * as Haptics from 'expo-haptics';

useEffect(() => {
  const timer = setTimeout(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
    router.replace('/');
  }, reducedMotion ? 800 : 1600);
  return () => clearTimeout(timer);
}, [reducedMotion]);
```

##### 4. Dynamic Tagline Rotation

```tsx
const TAGLINES = [
  'Organize your space, organize your mind',
  'One tiny step at a time',
  'Cleaning made calm',
  'Your space, your pace',
];

function getTagline(): string {
  // Rotate daily so returning users see variety
  const dayIndex = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  return TAGLINES[dayIndex % TAGLINES.length];
}
```

### Edge Cases & States

- **Empty state:** N/A (splash is always the same)
- **Error state:** If fonts fail to load, `_layout.tsx` handles this before splash renders. No additional error handling needed in splash.
- **Loading state:** The splash IS the loading state. If Convex is slow, the root index.tsx shows its own loading state after splash navigates away.
- **First-time user:** Same experience. The routing logic in `index.tsx` will redirect to onboarding.
- **Returning user:** Same experience. Could show a personalized micro-message if we detect returning user data during preload (stretch goal).
- **Offline:** Splash works offline since it has no data dependencies. The dots still animate.

### Animation Specifications

| Element | Animation | Duration | Easing | Delay |
|---------|-----------|----------|--------|-------|
| Mascot | spring scale 0->1 | ~500ms | spring(damping:8, stiffness:180) | 0ms |
| App Name | fade + translateY | 400ms | Easing.out(cubic) | 300ms |
| Tagline | fade | 400ms | Easing.out(cubic) | 500ms |
| Breathing dots | opacity 0.3<->1 | 1600ms cycle | Easing.inOut(sin) | 0/200/400ms staggered |
| Exit | opacity -> 0 + scale 0.95 | 300ms | Easing.in(cubic) | on navigate |

### Accessibility

- Add `accessibilityRole="header"` to the app name Text
- Add `accessibilityLabel="Declutter - Organize your space, organize your mind. Loading..."` to the container
- The breathing dots should have `accessibilityElementsHidden={true}` (decorative)
- Ensure the MascotAvatar has `accessible={false}` since it's decorative here

### Performance Notes

- Pre-warming the Convex connection during splash saves ~200-400ms on first data load
- The MascotAvatar image should use `priority="high"` and `cachePolicy="memory-disk"`
- Consider using `expo-splash-screen` to overlap the native splash with this custom one seamlessly

---

## 2. ROOT INDEX / ROUTER

**File:** `app/index.tsx`
**Current Lines:** 81
**Current Rating:** 6.5/10
**Target Rating:** 9/10

### Current State Analysis

This is the routing decision point: it checks auth state, cloud user, and onboarding completion, then redirects accordingly. The loading state is a simple spinner with emoji. Issues: the loading state is visually jarring compared to the splash screen, there is no timeout handling for stale auth states, and the emoji + spinner pattern feels dated.

### Improvement Details

1. **Match splash screen visual continuity** -- The loading state should look like a continuation of the splash, not a new screen.
2. **Add timeout with fallback** -- If auth/cloud resolution takes >5s, offer a "Having trouble? Try again" option.
3. **Skeleton shimmer instead of spinner** -- More modern and less anxiety-inducing for ADHD users.
4. **Smoother transition** -- Fade out before redirect instead of instant cut.
5. **Add error recovery** -- If cloudUser query fails, fall back to local state gracefully.

### Code Examples

##### 1. Visual Continuity with Splash

```tsx
import { MascotAvatar } from '@/components/ui';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

// Replace the current loading UI:
if (isLoading || !isLoaded || isResolvingCloudUser) {
  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={styles.loadingContent}>
        <MascotAvatar imageKey="splash" size={80} showBackground={false} />
        <LoadingDots isDark={isDark} />
        <Text
          style={[styles.loadingText, { color: t.textSecondary }]}
          accessibilityLabel="Loading your calm space"
          accessibilityRole="text"
        >
          Getting your calm space ready...
        </Text>
      </View>
    </View>
  );
}
```

##### 2. Timeout with Fallback

```tsx
const [isTimedOut, setIsTimedOut] = useState(false);

useEffect(() => {
  const timeout = setTimeout(() => {
    if (isLoading || !isLoaded || isResolvingCloudUser) {
      setIsTimedOut(true);
    }
  }, 8000); // 8 second timeout
  return () => clearTimeout(timeout);
}, [isLoading, isLoaded, isResolvingCloudUser]);

// In the loading UI, add after the loading text:
{isTimedOut && (
  <Pressable
    onPress={() => {
      // Force navigate to onboarding as safe fallback
      router.replace('/onboarding');
    }}
    style={styles.timeoutButton}
    accessibilityRole="button"
    accessibilityLabel="Skip loading and continue"
  >
    <Text style={[styles.timeoutText, { color: V1.coral }]}>
      Taking too long? Tap to continue
    </Text>
  </Pressable>
)}
```

##### 3. Loading Dots Component (reusable)

```tsx
function LoadingDots({ isDark }: { isDark: boolean }) {
  const dot1 = useSharedValue(0.3);
  const dot2 = useSharedValue(0.3);
  const dot3 = useSharedValue(0.3);

  useEffect(() => {
    const animate = (sv: Animated.SharedValue<number>, delay: number) => {
      sv.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(1, { duration: 400, easing: Easing.inOut(Easing.ease) }),
            withTiming(0.3, { duration: 400, easing: Easing.inOut(Easing.ease) })
          ),
          -1,
          false
        )
      );
    };
    animate(dot1, 0);
    animate(dot2, 150);
    animate(dot3, 300);
  }, []);

  const dotStyle = (sv: Animated.SharedValue<number>) =>
    useAnimatedStyle(() => ({
      opacity: sv.value,
      transform: [{ scale: 0.8 + sv.value * 0.2 }],
    }));

  return (
    <View style={{ flexDirection: 'row', gap: 6, marginVertical: 12 }}>
      {[dot1, dot2, dot3].map((dot, i) => (
        <Animated.View
          key={i}
          style={[
            {
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: V1.coral,
            },
            dotStyle(dot),
          ]}
        />
      ))}
    </View>
  );
}
```

### Edge Cases & States

- **Empty state:** N/A
- **Error state:** Convex query for cloud user fails -- should fall back to local `user` object from DeclutterContext. Currently no error handling for this.
- **Loading state:** The entire screen IS a loading state. Must feel seamless from splash.
- **First-time user:** No cloudUser, no local user -> redirect to `/onboarding`
- **Returning user:** Has cloudUser with `onboardingComplete: true` -> redirect to `/(tabs)`
- **Offline:** Cloud user query will stay `undefined` forever. Need the timeout fallback to prevent infinite loading.

### Accessibility

- Loading container: `accessibilityRole="progressbar"` with `accessibilityValue={{ text: 'Loading' }}`
- The timeout button must have a minimum 44x44 touch target

### Performance Notes

- The `useQuery(api.users.get)` call is duplicated between this file and `useCurrentUser()` hook. Convex deduplicates queries automatically but the code should reference the hook for consistency.
- Consider using `React.startTransition` for the redirect to avoid blocking the UI.

---

## 3. ROOT LAYOUT

**File:** `app/_layout.tsx`
**Current Lines:** 266
**Current Rating:** 7.5/10
**Target Rating:** 9/10

### Current State Analysis

Well-structured with proper provider nesting, auth guard, notification handling, custom transitions, and font loading. Issues: the notification handler runs in RootLayout which re-renders on every font/layout change, the AuthGuard has a potential race condition with hasRedirected ref, and there is no error boundary around the notification setup.

### Improvement Details

1. **Memoize notification handler** -- The `useNotificationObserver` runs unconditionally on every render cycle of RootLayout.
2. **Notification handler safety** -- Wrap notification URL parsing in try/catch to prevent crashes from malformed data.
3. **Font loading error recovery** -- Show a fallback UI if fonts fail to load instead of returning null.
4. **Provider order optimization** -- `DeclutterProvider` depends on `AuthProvider`, but `CelebrationProvider` doesn't depend on auth. Move it inside for clarity.
5. **Add ErrorBoundary around entire tree** -- The `RouteErrorBoundary` only wraps the navigation stack, but providers can throw too.
6. **Preload key assets during font load** -- Load mascot images and other static assets during the font loading phase.

### Code Examples

##### 1. Font Loading Error Recovery

```tsx
if (!loaded && !error) return null;

if (error) {
  // Font failed to load -- show degraded experience with system fonts
  console.warn('Font loading failed, using system fonts:', error);
  // Continue rendering -- the DISPLAY_FONT and BODY_FONT references
  // will fall back to system font since the custom ones aren't loaded
}
```

##### 2. Safe Notification URL Parsing

```tsx
function redirect(notification: Notifications.Notification) {
  try {
    const url = notification.request.content.data?.url;
    if (typeof url === 'string' && url.startsWith('/')) {
      expoRouter.push(url as any);
    }
  } catch (err) {
    if (__DEV__) console.warn('Failed to parse notification URL:', err);
  }
}
```

##### 3. Provider-Level Error Boundary

```tsx
import { ErrorBoundary as ReactErrorBoundary } from '@/components/ErrorBoundary';

// Wrap the entire provider tree:
return (
  <GestureHandlerRootView style={styles.root}>
    <SafeAreaProvider>
      <ReactErrorBoundary fallback={<CriticalErrorScreen />}>
        <ConvexClientProvider>
          {/* ...rest of providers */}
        </ConvexClientProvider>
      </ReactErrorBoundary>
    </SafeAreaProvider>
  </GestureHandlerRootView>
);
```

### Edge Cases & States

- **Font load failure:** Currently returns null forever. Should degrade gracefully.
- **Auth loading race:** AuthGuard's `hasRedirected` ref can cause missed redirects if auth state changes rapidly (e.g., token refresh).
- **Cold start from notification:** The `getLastNotificationResponse()` check may fire before providers are ready.

### Accessibility

- `StatusBar` style is correctly set based on theme
- Missing: `accessibilityIgnoresInvertColors` on the root GestureHandlerRootView

### Performance Notes

- Font loading blocks the entire app. Consider async font loading with a minimal UI that uses system fonts until custom fonts are ready.
- The duplicate notification listeners (useNotificationObserver + the second useEffect with addNotificationResponseListener) should be consolidated.

---

## 4. ONBOARDING FLOW

**File:** `app/onboarding.tsx` + `components/onboarding/*.tsx`
**Current Lines:** 416 (orchestrator) + ~1,800 (step components)
**Current Rating:** 7.5/10
**Target Rating:** 9.5/10

### Current State Analysis

Excellently collapsed from 12 steps to 5: welcome -> quickSetup -> mascot -> scan -> ready. Uses FadeInDown/FadeOutUp transitions, a progress bar, haptics, and proper error boundary. Step components are well-extracted with good accessibility labels.

Issues: no gesture-based navigation (swipe between steps), the progress bar jumps instantly (not animated), no skip confirmation for quickSetup, mascot personality selection doesn't preview the actual mascot appearance change, and the scroll bounce on some steps feels off on shorter content.

### Improvement Details

1. **Animated progress bar** -- Use `withTiming` to animate the progress bar width changes instead of instant jumps.
2. **Swipe gesture navigation** -- Add horizontal swipe to go back/forward between steps (ADHD users often explore by swiping).
3. **Welcome step: add social proof** -- "Join 10,000+ people who've tamed their spaces" (even if aspirational).
4. **QuickSetup: inline validation feedback** -- Show a green check next to each completed section.
5. **MascotStep: live avatar reaction** -- When personality changes, show the mascot's actual image changing (currently it always shows 'happy' regardless of personality selection).
6. **ScanStep: add a quick demo animation** -- Show a mini animation of a photo being analyzed with tasks appearing, so users understand what to expect.
7. **ReadyStep: add a time estimate** -- "Setup took only 45 seconds!" to reinforce the low-friction experience.
8. **Persist partial progress** -- If the user kills the app mid-onboarding, restore their progress on relaunch.
9. **Keyboard handling in MascotStep** -- The name input can get hidden behind the keyboard on smaller devices.

### Code Examples

##### 1. Animated Progress Bar

```tsx
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';

// In OnboardingScreenContent:
const progressWidth = useSharedValue(0);

useEffect(() => {
  if (stepNumber !== null) {
    progressWidth.value = withTiming(
      (stepNumber / NUMBERED_STEPS.length) * 100,
      { duration: 350, easing: Easing.out(Easing.cubic) }
    );
  }
}, [stepNumber]);

const progressAnimStyle = useAnimatedStyle(() => ({
  width: `${progressWidth.value}%`,
}));

// In JSX, replace the static View:
<Animated.View
  style={[
    styles.progressBarFill,
    { backgroundColor: V1.coral },
    progressAnimStyle,
  ]}
/>
```

##### 2. Swipe Gesture Navigation

```tsx
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';

// In OnboardingScreenContent:
const swipeGesture = Gesture.Pan()
  .activeOffsetX([-30, 30])
  .onEnd((event) => {
    if (event.velocityX > 500 && stepIndex > 0) {
      runOnJS(handleBack)();
    } else if (event.velocityX < -500 && canContinue) {
      runOnJS(handleNext)();
    }
  });

// Wrap the ScrollView:
<GestureDetector gesture={swipeGesture}>
  <ScrollView
    style={styles.scrollView}
    contentContainerStyle={styles.scrollContent}
    showsVerticalScrollIndicator={false}
    keyboardShouldPersistTaps="handled"
  >
    {/* ... */}
  </ScrollView>
</GestureDetector>
```

##### 3. QuickSetup Inline Validation Checks

```tsx
// In QuickSetupStep, add a check icon next to each completed section:
import { Check } from 'lucide-react-native';

function SectionHeader({ label, isComplete, isDark }: {
  label: string;
  isComplete: boolean;
  isDark: boolean;
}) {
  const t = isDark ? V1.dark : V1.light;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
      <Text style={[styles.sectionLabel, { color: t.textSecondary }]}>
        {label}
      </Text>
      {isComplete && (
        <Animated.View entering={FadeInDown.duration(200)}>
          <View style={{
            width: 20,
            height: 20,
            borderRadius: 10,
            backgroundColor: V1.green,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Check size={12} color="#FFFFFF" strokeWidth={3} />
          </View>
        </Animated.View>
      )}
    </View>
  );
}

// Usage:
<SectionHeader
  label="How's your energy today?"
  isComplete={!!energyLevel}
  isDark={isDark}
/>
```

##### 4. MascotStep Live Avatar by Personality

```tsx
// In MascotStep, map personality to different mascot image keys:
const PERSONALITY_IMAGE_MAP: Record<MascotPersonality, string> = {
  spark: 'excited',
  bubbles: 'happy',
  dusty: 'content',
  tidy: 'neutral',
};

// Replace the static MascotAvatar:
<MascotAvatar
  imageKey={PERSONALITY_IMAGE_MAP[selectedPersonality] || 'happy'}
  size={120}
  showBackground={false}
/>
```

##### 5. Persist Partial Onboarding Progress

```tsx
import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_PROGRESS_KEY = '@declutterly_onboarding_progress';

// Save on each step change:
useEffect(() => {
  AsyncStorage.setItem(ONBOARDING_PROGRESS_KEY, JSON.stringify({
    stepIndex,
    answers,
  })).catch(() => {}); // Fire and forget
}, [stepIndex, answers]);

// Restore on mount:
useEffect(() => {
  AsyncStorage.getItem(ONBOARDING_PROGRESS_KEY).then(data => {
    if (data) {
      try {
        const { stepIndex: savedStep, answers: savedAnswers } = JSON.parse(data);
        if (savedStep > 0) {
          setStepIndex(savedStep);
          setAnswers(prev => ({ ...prev, ...savedAnswers }));
        }
      } catch {}
    }
  }).catch(() => {});
}, []);

// Clear on completion:
// In completeOnboarding:
await AsyncStorage.removeItem(ONBOARDING_PROGRESS_KEY);
```

### Edge Cases & States

- **Empty state:** N/A (onboarding always has content)
- **Error state:** The `ScreenErrorBoundary` wraps the screen. If `updateUser` fails, it continues with local state (good).
- **Loading state:** The `isCompleting` state shows a spinner on the Ready step CTA. Should disable back navigation during completion.
- **First-time user:** Standard flow. Welcome -> QuickSetup -> Mascot -> Scan -> Ready.
- **Returning user:** If `user.onboardingComplete && isAuthenticated`, immediately redirects to `/(tabs)`. But what if they authenticated but haven't completed onboarding? The guard handles this.
- **Offline:** Guest auth `continueAsGuest()` may fail offline. The catch block allows continuing, but the user will be stuck in a weird state when they get back online.
- **Killed mid-onboarding:** Without persistence, all progress is lost. Improvement #5 above addresses this.

### Animation Specifications

| Element | Animation | Duration | Easing | Delay |
|---------|-----------|----------|--------|-------|
| Step content enter | FadeInDown | 300ms (120ms reduced) | default spring | 0ms |
| Step content exit | FadeOutUp | 200ms (120ms reduced) | default spring | 0ms |
| Progress bar fill | width animation | 350ms | Easing.out(cubic) | 0ms |
| Personality chip press | spring scale 0.93->1 | ~300ms | spring(damping:15, stiffness:350) | 0ms |
| Mascot bounce on personality change | spring sequence | ~600ms | spring(damping:8,stiffness:400) -> spring(damping:8,stiffness:300) -> spring(damping:12,stiffness:200) | 0ms |
| Ready check circle | spring scale 0->1.2->1 | ~500ms | spring(damping:6,stiffness:200) | 200ms |
| Sparkle particles | opacity + scale repeat | 1000ms cycle | timing 400ms + timing 600ms | staggered 0-900ms |

### Accessibility

- All steps have good `accessibilityRole="button"` and `accessibilityLabel` on interactive elements
- Progress bar should have `accessibilityRole="progressbar"` with `accessibilityValue={{ min: 0, max: NUMBERED_STEPS.length, now: stepNumber }}`
- The skip button needs `accessibilityHint="Double tap to skip this step and continue"`
- MascotStep: name input has `accessibilityLabel` but the personality chips should indicate current selection more clearly for screen readers
- ReadyStep: the sparkle particles should be `accessibilityElementsHidden={true}`

### Performance Notes

- The `Animated.View key={stepId}` causes a full unmount/remount of step content. This is correct for entering/exiting animations but could flash on slower devices. Consider cross-fade instead.
- The `useMemo` for `canContinue` is efficient and prevents unnecessary re-renders.
- Step components could be lazy-loaded with `React.lazy()` since only one is visible at a time.

---

## 5. AUTH: LOGIN

**File:** `app/auth/login.tsx`
**Current Lines:** 383
**Current Rating:** 7/10
**Target Rating:** 9/10

### Current State Analysis

Clean login screen with email/password inputs, password visibility toggle, forgot password link, error banner, and staggered FadeInDown animations. Good haptic feedback on all interactions. Uses proper `autoComplete` and `textContentType` props for password managers.

Issues: no biometric auth option, no "remember me" toggle, the error banner doesn't auto-dismiss, no input focus border color change, the "More sign-in options coming soon" text is a placeholder that should be removed or replaced, and the input fields don't shake on validation error.

### Improvement Details

1. **Input focus border animation** -- Highlight the active input border with coral color transition.
2. **Error banner auto-dismiss** -- Auto-clear after 5s or on any input change.
3. **Error shake animation** -- Shake the input field that has the error.
4. **Remove "More sign-in options" placeholder** -- Either implement social auth or remove the text entirely.
5. **Biometric auth prompt** -- If the user has previously logged in, offer FaceID/TouchID.
6. **Rate limiting feedback** -- If too many failed attempts, show a cooldown message.
7. **Input field icon color on focus** -- Match the icon color to coral when focused.
8. **Loading state improvements** -- Disable back navigation and inputs during auth.

### Code Examples

##### 1. Animated Input Focus Border

```tsx
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';

function AnimatedInput({
  icon: Icon,
  placeholder,
  value,
  onChangeText,
  isDark,
  loading,
  ...textInputProps
}: {
  icon: typeof Mail;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  isDark: boolean;
  loading: boolean;
} & Partial<React.ComponentProps<typeof TextInput>>) {
  const t = isDark ? V1.dark : V1.light;
  const focusProgress = useSharedValue(0);
  const inputRef = useRef<TextInput>(null);

  const containerStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      focusProgress.value,
      [0, 1],
      [t.inputBorder, V1.coral]
    ),
    borderWidth: focusProgress.value > 0.5 ? 1.5 : 1,
  }));

  const iconColor = useAnimatedStyle(() => ({
    color: interpolateColor(
      focusProgress.value,
      [0, 1],
      [isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.3)', V1.coral]
    ),
  }));

  return (
    <Animated.View style={[styles.inputField, { backgroundColor: t.inputBg }, containerStyle]}>
      <Icon size={18} color={isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.3)'} />
      <TextInput
        ref={inputRef}
        style={[styles.inputText, { color: t.text }]}
        placeholder={placeholder}
        placeholderTextColor={isDark ? 'rgba(255,255,255,0.3)' : '#9CA3AF'}
        value={value}
        onChangeText={(text) => {
          onChangeText(text);
          // Clear error on input change
        }}
        editable={!loading}
        onFocus={() => {
          focusProgress.value = withTiming(1, { duration: 200 });
        }}
        onBlur={() => {
          focusProgress.value = withTiming(0, { duration: 200 });
        }}
        {...textInputProps}
      />
    </Animated.View>
  );
}
```

##### 2. Error Auto-Dismiss on Input Change

```tsx
// Clear error whenever email or password changes:
const handleEmailChange = useCallback((text: string) => {
  setEmail(text);
  if (error) setError('');
}, [error]);

const handlePasswordChange = useCallback((text: string) => {
  setPassword(text);
  if (error) setError('');
}, [error]);

// Also auto-dismiss after 5 seconds:
useEffect(() => {
  if (!error) return;
  const timer = setTimeout(() => setError(''), 5000);
  return () => clearTimeout(timer);
}, [error]);
```

##### 3. Error Shake Animation

```tsx
const shakeTranslateX = useSharedValue(0);

const shakeStyle = useAnimatedStyle(() => ({
  transform: [{ translateX: shakeTranslateX.value }],
}));

function triggerShake() {
  shakeTranslateX.value = withSequence(
    withTiming(-8, { duration: 50 }),
    withTiming(8, { duration: 50 }),
    withTiming(-6, { duration: 50 }),
    withTiming(6, { duration: 50 }),
    withTiming(-3, { duration: 50 }),
    withTiming(0, { duration: 50 }),
  );
}

// In handleLogin error paths:
if (!email.trim() || !password.trim()) {
  setError('Please enter your email and password.');
  triggerShake();
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  return;
}
```

### Edge Cases & States

- **Empty state:** Form starts empty -- both fields required for submission.
- **Error state:** Error banner appears below inputs. Currently doesn't distinguish between network errors and credential errors.
- **Loading state:** Button shows ActivityIndicator, inputs are `editable={false}`. Missing: disable back navigation during auth.
- **First-time user:** They shouldn't be on this screen -- they should be on signup. The "Sign Up" link at bottom handles this.
- **Returning user:** Standard flow. Should eventually support biometric re-auth.
- **Offline:** `signIn()` will fail. Error message should detect offline state: "You appear to be offline. Please check your connection."

### Accessibility

- Input fields have `accessibilityLabel` -- good
- The eye toggle button needs `accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}`
- Error banner should use `accessibilityRole="alert"` and `accessibilityLiveRegion="assertive"` to announce errors immediately
- The "Don't have an account? Sign Up" section should be a single accessibility group

### Performance Notes

- Consider debouncing the email validation regex to avoid running it on every keystroke
- The `useRef<TextInput>` for password is correct for focus chaining

---

## 6. AUTH: SIGNUP

**File:** `app/auth/signup.tsx`
**Current Lines:** 518
**Current Rating:** 7/10
**Target Rating:** 9/10

### Current State Analysis

Complete signup flow with name, email, password fields, password strength indicator, terms/privacy links, and matching design patterns. The password strength meter is a nice ADHD-friendly touch -- visual feedback on progress.

Issues: the password strength IIFE in the render is expensive and re-runs on every render (not just password changes), name field is optional but this isn't clearly communicated, no email format validation in real-time (only on submit), the terms links open external browser which is jarring, and no confirmation dialog before leaving the screen.

### Improvement Details

1. **Memoize password strength calculation** -- Extract from render into `useMemo`.
2. **Real-time email validation hint** -- Show a subtle red border when email format is clearly wrong.
3. **Name field hint** -- Add placeholder text or helper text: "Optional -- you can add this later".
4. **In-app terms/privacy viewer** -- Use `expo-web-browser` or `WebBrowser.openBrowserAsync` for a seamless experience.
5. **Password strength: add criteria checklist** -- Show which criteria are met (length, uppercase, number, etc.) as ADHD users benefit from checklists.
6. **Animate password strength bar** -- Currently width changes instantly. Animate it.
7. **Form state persistence** -- If user accidentally navigates away, preserve their input.

### Code Examples

##### 1. Memoized Password Strength

```tsx
const passwordStrength = useMemo(() => {
  if (password.length === 0) return null;

  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const isStrong = password.length >= 10 && hasUpper && hasLower && hasNumber;

  const strengthColor = password.length < 6
    ? V1.coral
    : password.length < 8
      ? V1.amber
      : isStrong ? V1.green : V1.gold;

  const strengthLabel = password.length < 6
    ? 'Weak' : password.length < 8
      ? 'Fair' : isStrong ? 'Strong' : 'Good';

  const strengthPercent = password.length < 6
    ? 25 : password.length < 8
      ? 50 : isStrong ? 100 : 75;

  const criteria = [
    { label: '8+ characters', met: password.length >= 8 },
    { label: 'Uppercase letter', met: hasUpper },
    { label: 'Number', met: hasNumber },
  ];

  return { strengthColor, strengthLabel, strengthPercent, criteria };
}, [password]);
```

##### 2. Animated Strength Bar

```tsx
const strengthBarWidth = useSharedValue(0);

useEffect(() => {
  strengthBarWidth.value = withTiming(
    passwordStrength?.strengthPercent ?? 0,
    { duration: 300, easing: Easing.out(Easing.cubic) }
  );
}, [passwordStrength?.strengthPercent]);

const strengthBarStyle = useAnimatedStyle(() => ({
  width: `${strengthBarWidth.value}%`,
}));

// In JSX:
<Animated.View
  style={[
    styles.strengthFill,
    { backgroundColor: passwordStrength?.strengthColor },
    strengthBarStyle,
  ]}
/>
```

##### 3. Password Criteria Checklist

```tsx
{passwordStrength?.criteria && (
  <View style={styles.criteriaList}>
    {passwordStrength.criteria.map((item, i) => (
      <View key={i} style={styles.criteriaRow}>
        <View style={[
          styles.criteriaDot,
          {
            backgroundColor: item.met ? V1.green : (isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'),
          },
        ]}>
          {item.met && <Check size={8} color="#FFFFFF" strokeWidth={3} />}
        </View>
        <Text style={[
          styles.criteriaText,
          { color: item.met ? V1.green : t.textMuted },
        ]}>
          {item.label}
        </Text>
      </View>
    ))}
  </View>
)}

// Add styles:
criteriaList: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: 12,
  paddingHorizontal: 4,
  marginBottom: 16,
},
criteriaRow: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 6,
},
criteriaDot: {
  width: 16,
  height: 16,
  borderRadius: 8,
  alignItems: 'center',
  justifyContent: 'center',
},
criteriaText: {
  fontSize: 12,
  fontFamily: BODY_FONT,
},
```

##### 4. In-App Browser for Terms

```tsx
import * as WebBrowser from 'expo-web-browser';

const openTerms = useCallback(async () => {
  await WebBrowser.openBrowserAsync('https://declutterly.app/terms', {
    presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
    controlsColor: V1.coral,
  });
}, []);

const openPrivacy = useCallback(async () => {
  await WebBrowser.openBrowserAsync('https://declutterly.app/privacy', {
    presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
    controlsColor: V1.coral,
  });
}, []);
```

### Edge Cases & States

- **Empty state:** Form starts empty. All three fields visible. Name is optional.
- **Error state:** Same banner pattern as login. Should distinguish "email already exists" from other errors with a helpful "Sign in instead?" link.
- **Loading state:** Button spinner + disabled inputs. Same as login improvements needed.
- **Offline:** Show offline-specific error message.
- **Password too simple:** The strength meter provides visual feedback but the error on submit ("Password must be at least 8 characters") can still surprise users. Disable the button until password >= 8 chars.

### Accessibility

- Same improvements as login screen
- Password strength bar needs `accessibilityRole="progressbar"` and `accessibilityValue={{ text: strengthLabel }}`
- Criteria checkmarks need `accessibilityLabel={`${item.label}: ${item.met ? 'met' : 'not yet met'}`}`

### Performance Notes

- The IIFE for password strength re-renders the entire component. Extracting to `useMemo` fixes this.
- Consider `React.memo` on the strength bar sub-component.

---

## 7. AUTH: FORGOT PASSWORD

**File:** `app/auth/forgot-password.tsx`
**Current Lines:** 256
**Current Rating:** 6/10
**Target Rating:** 8.5/10

### Current State Analysis

Honest "contact support" screen since password reset isn't implemented yet. Has copy email and open mail client buttons. The messaging is transparent, which is good for trust.

Issues: no actual password reset flow, the screen feels barren (just email and two buttons), no visual hierarchy between the two action buttons, the copy feedback is only state-based (no animation), and the screen doesn't feel like it belongs to the same app visually.

### Improvement Details

1. **Implement actual password reset** -- This is a must for launch. Use Convex Auth's password reset flow.
2. **Add a friendly illustration** -- A mascot with a key or confused expression. ADHD users respond better to visual warmth.
3. **Copy animation** -- Animate the "Copied!" feedback with a checkmark and scale.
4. **Success state after email sent** -- When password reset is implemented, show a celebratory "Check your inbox!" screen.
5. **Fallback contact option** -- Keep the email support as a fallback even after implementing reset.
6. **Visual hierarchy** -- Make "Email Support" the primary CTA and "Copy Email" secondary.

### Code Examples

##### 1. Actual Password Reset Implementation (when ready)

```tsx
import { useAuth } from '@/context/AuthContext';

// In ForgotPasswordScreen:
const { resetPassword } = useAuth();
const [email, setEmail] = useState('');
const [isSending, setIsSending] = useState(false);
const [isSent, setIsSent] = useState(false);

const handleResetPassword = useCallback(async () => {
  if (!email.trim()) {
    setError('Please enter your email address.');
    return;
  }
  setIsSending(true);
  try {
    const result = await resetPassword(email.trim());
    if (result.success) {
      setIsSent(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      setError(result.error || 'Could not send reset email.');
    }
  } catch (err) {
    setError('Something went wrong. Please try again.');
  } finally {
    setIsSending(false);
  }
}, [email, resetPassword]);

// Success state:
if (isSent) {
  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      <View style={styles.successContent}>
        <MascotAvatar imageKey="happy" size={100} showBackground />
        <Text style={[styles.heading, { color: t.text }]}>Check your inbox!</Text>
        <Text style={[styles.subtitle, { color: t.textSecondary }]}>
          We sent a reset link to {email}. It may take a minute.
        </Text>
        <Pressable onPress={() => router.back()} style={styles.backLink}>
          <Text style={[styles.backLinkText, { color: V1.coral }]}>
            Back to Sign In
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
```

##### 2. Copy Animation with Checkmark

```tsx
import { Check, Copy } from 'lucide-react-native';

const copyScale = useSharedValue(1);
const copyAnimStyle = useAnimatedStyle(() => ({
  transform: [{ scale: copyScale.value }],
}));

const handleCopyEmail = useCallback(async () => {
  try {
    await Clipboard.setStringAsync(SUPPORT_EMAIL);
    setCopied(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    copyScale.value = withSequence(
      withSpring(0.9, { damping: 10, stiffness: 300 }),
      withSpring(1.1, { damping: 8, stiffness: 200 }),
      withSpring(1, { damping: 12, stiffness: 200 }),
    );
    setTimeout(() => setCopied(false), 2000);
  } catch {
    Alert.alert('Copy failed', `Please email us at ${SUPPORT_EMAIL}`);
  }
}, []);

// In JSX:
<Animated.View style={copyAnimStyle}>
  <Pressable onPress={handleCopyEmail} style={[styles.outlineButton, { borderColor: t.border }]}>
    {copied ? (
      <Check size={18} color={V1.green} />
    ) : (
      <Copy size={18} color={t.textSecondary} />
    )}
    <Text style={[styles.outlineButtonText, { color: copied ? V1.green : t.text }]}>
      {copied ? 'Copied!' : 'Copy Email'}
    </Text>
  </Pressable>
</Animated.View>
```

### Edge Cases & States

- **Success state:** After sending reset email (future), show confirmation screen with mascot.
- **Error state:** Invalid email format, email not found, network error -- all need distinct messages.
- **Offline:** Show "You need internet to reset your password" message.

### Accessibility

- Add `accessibilityRole="alert"` to the "copied" feedback
- The back button should have `accessibilityHint="Double tap to go back to sign in"`
- Email card should be selectable text: `selectable={true}` on the Text component

---

## 8. TAB LAYOUT

**File:** `app/(tabs)/_layout.tsx`
**Current Lines:** 237
**Current Rating:** 8/10
**Target Rating:** 9.5/10

### Current State Analysis

Custom floating pill-style tab bar with BlurView, spring animations on tab selection, active dot indicator, and haptic feedback. Well-coded with separate `TabItem` and `CustomTabBar` components.

Issues: the tab bar doesn't hide on scroll (obstructs content on long pages), no badge indicators for notifications/updates, the active tab background highlight uses hardcoded colors instead of design tokens, no animation on the active dot, and the pill width calculation could break on very narrow screens.

### Improvement Details

1. **Hide tab bar on scroll** -- Use a shared value from the scroll position to slide the tab bar down when scrolling down and back up when scrolling up.
2. **Badge indicators** -- Show a red dot on tabs that have pending actions (e.g., uncompleted daily tasks on Home, new achievements on Profile).
3. **Active indicator animation** -- The sliding indicator should smoothly transition between tabs (not just appear/disappear).
4. **Safe minimum width** -- Ensure `pillWidth` never goes below 280 for usability.
5. **Animated tab transition** -- When pressing a tab, add a subtle bounce to the entire tab bar.
6. **Dynamic icon fill** -- Active tab icons should have fill instead of just stroke color change.

### Code Examples

##### 1. Badge Indicator on Tabs

```tsx
import { useDeclutter } from '@/context/DeclutterContext';

function TabBadge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <View style={styles.badge}>
      {count > 0 && count <= 9 && (
        <Text style={styles.badgeText}>{count}</Text>
      )}
    </View>
  );
}

// In TabItem:
const { pendingCelebration } = useDeclutter();
const badgeCount = tab.name === 'profile' ? (pendingCelebration?.length ?? 0) : 0;

// Add after the icon:
<TabBadge count={badgeCount} />

// Styles:
badge: {
  position: 'absolute',
  top: -2,
  right: -4,
  minWidth: 8,
  height: 8,
  borderRadius: 4,
  backgroundColor: V1.coral,
},
badgeText: {
  fontSize: 8,
  color: '#FFFFFF',
  fontWeight: '700',
  textAlign: 'center',
},
```

##### 2. Active Sliding Indicator

```tsx
// In CustomTabBar:
const indicatorX = useSharedValue(0);
const tabWidth = pillWidth / TAB_CONFIG.length;

useEffect(() => {
  indicatorX.value = withSpring(
    state.index * tabWidth + (tabWidth - 40) / 2,
    { damping: 15, stiffness: 200, mass: 0.6 }
  );
}, [state.index, tabWidth]);

const indicatorStyle = useAnimatedStyle(() => ({
  transform: [{ translateX: indicatorX.value }],
}));

// In the pillInner View, add:
<Animated.View
  style={[
    {
      position: 'absolute',
      bottom: 4,
      width: 40,
      height: 3,
      borderRadius: 1.5,
      backgroundColor: V1.coral,
    },
    indicatorStyle,
  ]}
/>
```

##### 3. Tab Bar Auto-Hide on Scroll

```tsx
// Export a shared value from the tab layout that screens can use:
import { createContext, useContext } from 'react';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';

export const TabBarVisibilityContext = createContext<{
  translateY: Animated.SharedValue<number>;
} | null>(null);

// In CustomTabBar:
const { translateY } = useContext(TabBarVisibilityContext) ?? { translateY: useSharedValue(0) };

const containerAnimStyle = useAnimatedStyle(() => ({
  transform: [{ translateY: translateY.value }],
}));

// Wrap the container:
<Animated.View style={[styles.tabBarContainer, { paddingBottom: insets.bottom || 12 }, containerAnimStyle]}>

// In home screen, use onScroll to drive the animation:
const lastScrollY = useRef(0);
const tabBarTranslateY = useContext(TabBarVisibilityContext)?.translateY;

const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
  const currentY = event.nativeEvent.contentOffset.y;
  if (currentY > lastScrollY.current && currentY > 50) {
    // Scrolling down - hide tab bar
    if (tabBarTranslateY) tabBarTranslateY.value = withTiming(100, { duration: 200 });
  } else {
    // Scrolling up - show tab bar
    if (tabBarTranslateY) tabBarTranslateY.value = withTiming(0, { duration: 200 });
  }
  lastScrollY.current = currentY;
}, []);
```

### Edge Cases & States

- **No rooms (empty):** Home tab shows empty state. Tab bar should still show normally.
- **Very narrow screen:** `pillWidth` minimum should be `280` not just `screenWidth - 40`.
- **Reduced motion:** Spring animations are handled but the active dot snap should use `withTiming` instead of `withSpring` for reduced motion users.

### Accessibility

- Tab items have excellent `accessibilityRole="tab"`, `accessibilityState`, `accessibilityLabel`, and `accessibilityHint` -- well done
- Add `accessibilityRole="tablist"` to the pill container
- Active tab announcement: screen readers should announce "Home tab, selected, 1 of 4"

### Performance Notes

- `BlurView` is expensive on Android. Consider a fallback to semi-transparent background on lower-end devices.
- The `renderTabBar` function is correctly extracted outside the component to prevent re-creation on each render.

---

## 9. HOME TAB

**File:** `app/(tabs)/index.tsx`
**Current Lines:** 1,765
**Current Rating:** 7/10
**Target Rating:** 9.5/10

### Current State Analysis

The most complex screen with multiple states: loading (skeleton), empty, comeback, and populated. Features: greeting with time context, mascot avatar, motivational quotes, "Continue where you left off" banner, Quick Blitz CTA, streak card with consistency score, grace period badges, comeback flow, "Today's Tasks" card, hero room card, and room grid. Comprehensive feature set.

Issues: the file is too long at 1765 lines (should be split into sub-components), the skeleton loading state is comprehensive but inline (should be extracted), the comeback flow modal is inline and complex, the "Today's Tasks" card is calculated locally instead of using the `useTodaysTasks` hook consistently, the `spacePresses` array pattern with 4 hardcoded hooks is fragile, there are multiple `useMemo` hooks that could be consolidated, and the populated state has no pull-to-refresh indicator (it just simulates).

### Improvement Details

1. **Extract sub-components** -- Split into HomeHeader, StreakCard, TodaysTasksCard, RoomGrid, ComebackBanner, EmptyState, HomeSkeleton as separate files.
2. **Fix pull-to-refresh** -- The current implementation fakes it with a setTimeout. With Convex reactive queries, a simple re-mount or cache invalidation would be more honest.
3. **Replace hardcoded spacePresses array** -- Use a dynamic approach with `useCallback` that creates press animations per room.
4. **Add "Scan Room" FAB** -- A floating action button is more discoverable than only showing it in the empty state CTA.
5. **Today's Tasks completion animation** -- When a task is checked off, show a micro-celebration (confetti particle, check bounce).
6. **Streak card: add fire animation** -- The flame icon should subtly animate (glow, scale pulse) for streaks > 3.
7. **Room cards: add freshness decay visual** -- Show a subtle color gradient from green (fresh) to amber (needs attention) on each room card.
8. **"One Tiny Thing" standalone task** -- The comeback flow offers a tiny task but it's only in the comeback card. Make it always available as a prominent option.
9. **Smart greeting** -- Use the user's name + context-aware greetings. "Good morning, Alex" on first open, "Back for more?" on subsequent opens same day.
10. **Performance: virtualize room grid** -- If user has 10+ rooms, use FlatList instead of mapped Views.

### Code Examples

##### 1. Extract StreakCard Component

```tsx
// components/home/StreakCard.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Flame, TrendingUp } from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { V1, BODY_FONT, cardStyle } from '@/constants/designTokens';

interface StreakCardProps {
  streak: number;
  todayDone: number;
  todayTotal: number;
  consistency: { activeDays: number; windowDays: number };
  isDark: boolean;
}

export function StreakCard({ streak, todayDone, todayTotal, consistency, isDark }: StreakCardProps) {
  const t = isDark ? V1.dark : V1.light;

  // Animated flame glow for streaks >= 3
  const flameGlow = useSharedValue(1);
  React.useEffect(() => {
    if (streak >= 3) {
      flameGlow.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 800 }),
          withTiming(1, { duration: 800 }),
        ),
        -1,
        true,
      );
    }
  }, [streak]);

  const flameStyle = useAnimatedStyle(() => ({
    transform: [{ scale: flameGlow.value }],
  }));

  return (
    <View style={[styles.card, cardStyle(isDark)]}>
      <View style={styles.left}>
        <Animated.View style={flameStyle}>
          <Flame size={16} color={V1.coral} strokeWidth={2.5} />
        </Animated.View>
        <Text style={[styles.streakText, { color: t.text }]}>
          {streak} day streak
        </Text>
      </View>
      <View style={styles.right}>
        <View style={styles.consistencyBadge}>
          <TrendingUp size={12} color={V1.green} strokeWidth={2.5} />
          <Text style={[styles.consistencyText, { color: t.textSecondary }]}>
            {consistency.activeDays}/{consistency.windowDays}d
          </Text>
        </View>
        <Text style={[styles.progressText, { color: t.textSecondary }]}>
          {todayDone}/{Math.max(todayTotal, 5)} today
        </Text>
        <View style={styles.dots}>
          {Array.from({ length: Math.min(Math.max(todayTotal, 5), 5) }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: i < todayDone
                    ? V1.coral
                    : isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)',
                },
              ]}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  streakText: { fontSize: 15, fontWeight: '600', fontFamily: BODY_FONT },
  consistencyBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  consistencyText: { fontSize: 12, fontWeight: '500', fontFamily: BODY_FONT },
  progressText: { fontSize: 13, fontWeight: '500', fontFamily: BODY_FONT },
  dots: { flexDirection: 'row', gap: 3 },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
```

##### 2. Floating Action Button for Scan

```tsx
// In the populated state, add at the bottom:
<AnimatedPressable
  onPress={handleScanRoom}
  accessibilityRole="button"
  accessibilityLabel="Scan a new room"
  accessibilityHint="Double tap to open camera and scan a room"
  style={[styles.fab, fabAnimStyle]}
>
  <LinearGradient
    colors={[V1.coral, '#FF5252']}
    style={styles.fabGradient}
  >
    <Camera size={24} color="#FFFFFF" />
  </LinearGradient>
</AnimatedPressable>

// Styles:
fab: {
  position: 'absolute',
  bottom: 100, // Above tab bar
  right: 20,
  borderRadius: 28,
  shadowColor: V1.coral,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 12,
  elevation: 8,
},
fabGradient: {
  width: 56,
  height: 56,
  borderRadius: 28,
  alignItems: 'center',
  justifyContent: 'center',
},
```

##### 3. Task Completion Micro-Celebration

```tsx
import { useCelebration } from '@/components/ui/CelebrationEngine';

const { triggerMicroCelebration } = useCelebration();

const handleToggleTask = useCallback((roomId: string, taskId: string) => {
  toggleTask(roomId, taskId);
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  // Trigger a small confetti burst at the task's position
  triggerMicroCelebration('task_complete');
}, [toggleTask]);
```

### Edge Cases & States

- **Empty state:** Well-designed with mascot, CTA, and tip card. Consider adding an animated illustration showing the scan->analyze->clean flow.
- **Error state:** The `ScreenErrorBoundary` catches React errors. Network errors from Convex are handled by the Convex client. Missing: a "failed to load rooms" inline error state.
- **Loading state:** Comprehensive skeleton loader. Could add a shimmer animation for more polish.
- **First-time user (post-onboarding):** Empty state with mascot and "Scan first room" CTA.
- **Returning user (same day):** Shows populated state with today's tasks. The greeting should adapt: "Welcome back" -> "Keep it going" on same-day return.
- **Returning user (after days):** Comeback flow activates. The comeback card with "One Tiny Thing" is excellent for ADHD re-engagement.
- **Offline:** Convex queries will serve cached data. The room grid should still be interactive but show an "offline" indicator.
- **Many rooms (10+):** The room grid will overflow. Should use FlatList with virtualization.

### Animation Specifications

| Element | Animation | Duration | Config |
|---------|-----------|----------|--------|
| Header | FadeInDown | 400ms | delay 0 |
| Quote | FadeInDown | 400ms | delay 50ms |
| Continue banner | FadeInDown | 400ms | delay 55ms |
| Quick Blitz CTA | FadeInDown | 400ms | delay 60ms |
| Streak card | FadeInDown | 400ms | delay 80ms |
| Today's Tasks | FadeInDown | 400ms | delay 100ms |
| Room cards | FadeInDown | 400ms | staggered 100ms per card |
| FAB | spring scale on press | spring(damping:15, stiffness:200) | on press |
| Streak flame | scale pulse 1-1.15 | 1600ms cycle | when streak >= 3 |
| Skeleton shimmer | opacity 0.3-0.7 | 900ms | withRepeat |

### Accessibility

- Greeting: `accessibilityRole="header"`
- Streak card: `accessibilityLabel={`${streak} day streak, ${todayDone} of ${todayTotal} tasks completed today`}`
- Room cards need `accessibilityLabel={`${room.name}, ${freshnessLabel}, ${incompleteTasks} tasks remaining`}`
- FAB: needs `accessibilityLabel="Scan a new room"` and minimum 56x56 touch target (already satisfied)
- Today's tasks checkboxes: `accessibilityRole="checkbox"` with `accessibilityState={{ checked: task.completed }}`

### Performance Notes

- **Critical:** The 1765-line file causes slow module loading. Split into 6-8 sub-components.
- The `useMemo` hooks are correctly used but `todayTasksDone` duplicates logic from `useTodaysTasks` hook.
- The 4 hardcoded `useScalePress` hooks (`spacePress0` through `spacePress3`) will break if the user has more than 4 rooms. Use a Map or dynamic approach.
- `useWindowDimensions()` triggers re-renders on orientation change. Consider memoizing the derived values.
- The comeback check runs on mount with `[]` deps -- correct, but should also run when the app returns from background.

---

## 10. CAMERA SCREEN

**File:** `app/camera.tsx`
**Current Lines:** 843
**Current Rating:** 7.5/10
**Target Rating:** 9.5/10

### Current State Analysis

Full-featured camera screen with: live preview, viewfinder brackets, room type pills, shutter button with spring animation, gallery picker, and a "context picker" overlay after photo capture (energy level + time available). Smart pre-fill from user profile. Good accessibility labels.

Issues: no photo quality preview before proceeding (users may take a blurry photo), the context picker overlay doesn't have gesture dismissal, no flash toggle, no camera flip button (though only back camera is needed for rooms), the viewfinder brackets use percentage-based positioning that may not look right on all aspect ratios, and the room type pills overflow without a visible scroll indicator.

### Improvement Details

1. **Photo quality validation** -- After capture, run a quick local check for blur/darkness before showing context picker.
2. **Flash toggle** -- Add a flash button (auto/on/off) for poorly lit rooms.
3. **Gesture to dismiss context picker** -- Swipe down to dismiss the overlay.
4. **Photo retake within context picker** -- Currently "Retake photo" dismisses the overlay. Add a visible "Retake" button at the top of the thumbnail.
5. **Viewfinder guide text** -- Animate the hint text to pulse gently, drawing attention.
6. **Room type: auto-detect suggestion** -- After the AI analyzes, suggest updating the room type if it differs from selection.
7. **Multiple photo support** -- Allow capturing 2-3 photos for panoramic room coverage (stretch goal).
8. **Camera permission: better UX** -- The current permission denied screen is functional but could show the benefits more clearly.
9. **Haptic on room type selection** -- Already implemented, but missing on energy/time selection in context picker -- those have it too, actually. Good.
10. **Photo thumbnail in context picker** -- Add a subtle parallax or zoom animation on the thumbnail.

### Code Examples

##### 1. Flash Toggle

```tsx
import { Camera as CameraIcon, Zap, ZapOff } from 'lucide-react-native';

// State:
const [flashMode, setFlashMode] = useState<'off' | 'on' | 'auto'>('auto');

// Toggle handler:
const toggleFlash = useCallback(() => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  setFlashMode(prev => {
    if (prev === 'off') return 'auto';
    if (prev === 'auto') return 'on';
    return 'off';
  });
}, []);

// In the top bar, add next to the title:
<Pressable
  onPress={toggleFlash}
  hitSlop={12}
  accessibilityRole="button"
  accessibilityLabel={`Flash ${flashMode}`}
  style={styles.flashButton}
>
  {flashMode === 'off' ? (
    <ZapOff size={20} color="rgba(255,255,255,0.6)" />
  ) : (
    <Zap
      size={20}
      color={flashMode === 'on' ? V1.gold : 'rgba(255,255,255,0.8)'}
      fill={flashMode === 'on' ? V1.gold : 'none'}
    />
  )}
  <Text style={styles.flashLabel}>
    {flashMode === 'auto' ? 'AUTO' : flashMode === 'on' ? 'ON' : 'OFF'}
  </Text>
</Pressable>

// On CameraView:
<CameraView
  ref={cameraRef}
  style={StyleSheet.absoluteFill}
  facing="back"
  flash={flashMode}
/>
```

##### 2. Photo Blur Detection

```tsx
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

async function isPhotoBlurry(uri: string): Promise<boolean> {
  try {
    // Downscale to tiny image for quick analysis
    const small = await manipulateAsync(
      uri,
      [{ resize: { width: 100 } }],
      { format: SaveFormat.JPEG, compress: 0.5 }
    );
    // A very rough heuristic: if the file is tiny, the image likely has low detail (blurry)
    // For production, use a proper edge detection or Laplacian variance
    const info = await FileSystem.getInfoAsync(small.uri);
    // Very small compressed file = likely blurry (low detail)
    return info.exists && info.size < 2000;
  } catch {
    return false; // If we can't check, assume it's fine
  }
}

// In handleCapture, after taking photo:
const isBlurry = await isPhotoBlurry(photo.uri);
if (isBlurry) {
  Alert.alert(
    'Photo might be blurry',
    'The image looks a bit unclear. For best results, hold your phone steady. Use this photo anyway?',
    [
      { text: 'Retake', style: 'cancel' },
      {
        text: 'Use Anyway',
        onPress: () => {
          setPendingPhotoUri(photo.uri);
          setShowContextPicker(true);
        },
      },
    ]
  );
  return;
}
```

##### 3. Gesture-Dismissable Context Picker

```tsx
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';

// In the context picker:
const sheetTranslateY = useSharedValue(0);

const dismissSheet = useCallback(() => {
  setShowContextPicker(false);
  setPendingPhotoUri(null);
  sheetTranslateY.value = 0;
}, []);

const panGesture = Gesture.Pan()
  .onUpdate((event) => {
    if (event.translationY > 0) {
      sheetTranslateY.value = event.translationY;
    }
  })
  .onEnd((event) => {
    if (event.translationY > 100 || event.velocityY > 500) {
      sheetTranslateY.value = withTiming(400, { duration: 200 });
      runOnJS(dismissSheet)();
    } else {
      sheetTranslateY.value = withTiming(0, { duration: 200 });
    }
  });

const sheetAnimStyle = useAnimatedStyle(() => ({
  transform: [{ translateY: sheetTranslateY.value }],
}));

// Wrap the context sheet:
<GestureDetector gesture={panGesture}>
  <Animated.View style={[styles.contextSheet, { backgroundColor: t.card }, sheetAnimStyle]}>
    {/* Drag handle */}
    <View style={styles.dragHandle}>
      <View style={[styles.dragHandleBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)' }]} />
    </View>
    {/* ...rest of context picker content */}
  </Animated.View>
</GestureDetector>

// Styles:
dragHandle: {
  alignItems: 'center',
  paddingTop: 8,
  paddingBottom: 16,
},
dragHandleBar: {
  width: 36,
  height: 4,
  borderRadius: 2,
},
```

### Edge Cases & States

- **Permission denied:** Shows a clear "Camera Access Needed" screen with gallery fallback and settings link. Good.
- **Camera not ready:** The `takePictureAsync` can fail if camera isn't initialized. The catch block shows an alert.
- **Gallery permission denied:** `ImagePicker` handles its own permission request. No explicit handling needed.
- **Photo capture during transition:** The `isCapturing` guard prevents double-captures.
- **Offline:** Camera works offline. The issue comes when trying to analyze -- but that's the analysis screen's concern.
- **Low light:** Should suggest turning on flash. Currently no light level detection.
- **Very messy room (user anxiety):** The "Capture the full room, floor to ceiling" hint could feel overwhelming. Consider softening: "Just capture what you can see. Any angle works."

### Animation Specifications

| Element | Animation | Duration | Config |
|---------|-----------|----------|--------|
| Top bar | FadeIn | 300ms | delay 0 |
| Room type pills | FadeInUp | 300ms | delay 100ms |
| Bottom controls | FadeInDown | 300ms | delay 100ms |
| Shutter press | spring scale 0.88->1 | spring(damping:15, stiffness:200) | on press in/out |
| Context overlay | FadeIn | 200ms | on show |
| Context sheet | slide up from bottom | 300ms | gesture-driven |

### Accessibility

- Shutter button: has `accessibilityLabel` -- good. Add `accessibilityHint="Double tap to take a photo of the room"`
- Room type pills: have `accessibilityRole="button"` and `accessibilityState` -- excellent
- Viewfinder brackets should be `accessibilityElementsHidden={true}` (decorative)
- Flash toggle needs clear accessibility label
- Minimum touch targets: gallery button is 48x48 (good), shutter is 72x72 (good), room pills should be at least 44px height (they're 8+16+8=32px padded -- could be borderline)

### Performance Notes

- `CameraView` is a heavy component. It's correctly unmounted when the context picker is fullscreen.
- The `expo-image` component for the photo thumbnail uses `cachePolicy="memory-disk"` -- good but the blurhash placeholder is hardcoded. Consider generating it from the captured photo.
- Room type constants are computed at module level from shared constants -- efficient.

---

## 11. ANALYSIS SCREEN

**File:** `app/analysis.tsx`
**Current Lines:** 1,338
**Current Rating:** 7/10
**Target Rating:** 9.5/10

### Current State Analysis

Three-phase screen: scanning -> detection -> results. Has animated scan line, pulse effect on photo, step progress indicators, detection overlay with positioned pills, and comprehensive results view with supply checklist, detected objects, doom piles, task clusters, and photo quality warnings. Supports retry with fallback tasks.

Issues: the file is very large (1338 lines) and needs splitting, the scanning phase has no cancel/back button (user is trapped), the detection phase pill positioning is hardcoded and can overlap, the `generateFallbackTasks` function is at the bottom of the file making it hard to find, many styles are inline objects instead of stylesheet entries, type assertions with `as any` are widespread, and there is no progress percentage during the AI call (users don't know how long to wait).

### Improvement Details

1. **Add cancel during scanning** -- Show a back button during the scanning phase so users aren't trapped.
2. **Progress estimation** -- Show an estimated time remaining or progress bar during AI analysis.
3. **Extract sub-components** -- ScanningPhase, DetectionPhase, ResultsPhase should be separate files.
4. **Fix inline styles** -- Many views have inline style objects that create new references on every render.
5. **Remove `as any` type assertions** -- Properly type the analysis result.
6. **Detection pill layout** -- Use a proper layout algorithm instead of hardcoded positions that can overlap.
7. **Results: add task preview cards** -- Show task cards with expandable details instead of just area summaries.
8. **Scanning: add encouraging messages rotation** -- Rotate through ADHD-friendly messages during the wait.
9. **Error recovery: offer photo retake directly** -- When error occurs, show "Retake Photo" button alongside "Re-analyze".
10. **Network timeout** -- The AI call can hang. Add a 30-second timeout.
11. **Cache analysis results** -- If user navigates back and returns to the same photo, don't re-analyze.

### Code Examples

##### 1. Cancel During Scanning Phase

```tsx
// In the scanning phase JSX, add a back button:
<View style={[styles.scanHeader, { paddingTop: insets.top + 8 }]}>
  <Pressable
    onPress={() => {
      cancelledRef.current = true;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.back();
    }}
    hitSlop={12}
    accessibilityRole="button"
    accessibilityLabel="Cancel analysis and go back"
  >
    <ChevronLeft size={24} color="rgba(255,255,255,0.7)" />
  </Pressable>
  <View style={{ flex: 1 }} />
</View>

// Style:
scanHeader: {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  flexDirection: 'row',
  paddingHorizontal: 16,
  zIndex: 10,
},
```

##### 2. Encouraging Messages During Scan

```tsx
const SCAN_MESSAGES = [
  { text: 'No judgment here...', emoji: '🤗' },
  { text: 'Every room has potential', emoji: '✨' },
  { text: 'Small steps, big impact', emoji: '🌱' },
  { text: 'You got this!', emoji: '💪' },
  { text: 'Finding your starting point...', emoji: '🎯' },
];

function RotatingMessage() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex(prev => (prev + 1) % SCAN_MESSAGES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Animated.View
      key={index}
      entering={FadeInDown.duration(300)}
      style={styles.rotatingMessage}
    >
      <Text style={styles.rotatingEmoji}>{SCAN_MESSAGES[index].emoji}</Text>
      <Text style={styles.rotatingText}>{SCAN_MESSAGES[index].text}</Text>
    </Animated.View>
  );
}
```

##### 3. Analysis Timeout

```tsx
const ANALYSIS_TIMEOUT_MS = 30000; // 30 seconds

// In runAnalysis, wrap the AI call with a timeout:
const analysisPromise = analyzeRoomImage(base64, ...args);
const timeoutPromise = new Promise<never>((_, reject) =>
  setTimeout(() => reject(new Error('Analysis timed out')), ANALYSIS_TIMEOUT_MS)
);

try {
  analysisData = await Promise.race([analysisPromise, timeoutPromise]);
} catch (aiError) {
  if (aiError instanceof Error && aiError.message === 'Analysis timed out') {
    if (__DEV__) console.warn('AI analysis timed out, using fallback tasks');
    // Fall through to fallback tasks
  } else {
    if (__DEV__) console.warn('AI analysis failed:', aiError);
  }
}
```

##### 4. Estimated Progress Bar

```tsx
// Simulated progress that accelerates and slows at the end:
const estimatedProgress = useSharedValue(0);

useEffect(() => {
  if (phase !== 'scanning') return;

  // Fast to 60%, slow to 90%, then wait for actual completion
  estimatedProgress.value = withSequence(
    withTiming(60, { duration: 3000, easing: Easing.out(Easing.quad) }),
    withTiming(85, { duration: 5000, easing: Easing.out(Easing.quad) }),
    withTiming(92, { duration: 10000, easing: Easing.linear }),
  );
}, [phase]);

// When analysis completes, jump to 100%:
useEffect(() => {
  if (phase === 'detection' || phase === 'results') {
    estimatedProgress.value = withTiming(100, { duration: 300 });
  }
}, [phase]);

const progressStyle = useAnimatedStyle(() => ({
  width: `${estimatedProgress.value}%`,
}));

// In scanning phase UI:
<View style={styles.estimatedProgressTrack}>
  <Animated.View style={[styles.estimatedProgressFill, progressStyle]} />
</View>
```

### Edge Cases & States

- **Empty/No photo:** Shows error "Photo not found" -- good.
- **AI failure:** Falls through to fallback tasks. Error screen offers re-analyze and "Use suggested tasks instead".
- **Photo quality poor:** Shows a warning banner with suggestions.
- **Room limit reached:** Shows alert before starting analysis -- smart, saves time.
- **Offline:** AI call will fail. Should detect offline early and offer fallback tasks immediately with a message: "You're offline. Here are suggested tasks for a typical [room type]."
- **User navigates back during analysis:** `cancelledRef.current` is set on unmount. Good.
- **Very few objects detected (1-2):** The detection overlay looks sparse. Should still show a positive "Looks manageable!" message.
- **Many objects detected (20+):** The results list can be very long. Should collapse less important items.

### Accessibility

- Scanning phase: needs `accessibilityRole="progressbar"` on the step list -- already has it.
- Detection overlay: pills should have `accessibilityLabel={`${area.name}: ${area.taskCount} tasks`}`
- Results: detected object pills are inline and missing accessibility labels
- Error state: the "!" icon circle should be `accessibilityElementsHidden={true}`, with the error title being the accessible element

### Performance Notes

- The `FileSystem.readAsStringAsync` for base64 encoding is a blocking operation on large photos. Consider using a background thread or compressing the image first.
- The `getUserCleaningProfile()` call is parallelized with the base64 read -- good.
- The `Promise.race` timeout pattern prevents hanging indefinitely.
- Image caching: the `cachePolicy="memory-disk"` on Image components is correct.
- The many inline styles create new objects on every render. Extract to StyleSheet.

---

## 12. TASK CUSTOMIZE SCREEN

**File:** `app/task-customize.tsx`
**Current Lines:** 501
**Current Rating:** 7/10
**Target Rating:** 9/10

### Current State Analysis

Task customization screen with grouped tasks by zone, individual checkboxes, group toggles, task detail level selector (Simple/Detailed/Ultra), and two CTAs: "Start with Easy Wins" (top 3 tasks) and "See all N tasks". The detail level is wired to the app settings.

Issues: no drag-to-reorder for task priority, the "Start with Easy Wins" is the primary CTA but positioned above "See all tasks" (which seems inverted), no task preview/expansion to see descriptions or subtasks, the total time estimate doesn't update smoothly when toggling tasks, no undo for bulk deselection, the toggle switch is custom-built but doesn't animate the thumb movement, and tasks are parsed from JSON search params which has a URL length limit risk.

### Improvement Details

1. **Animate toggle switch** -- The thumb position should smoothly transition instead of snapping.
2. **Drag to reorder tasks** -- Allow users to reorder tasks by dragging, which helps ADHD users feel in control.
3. **Task expansion** -- Tap a task to see its description, subtasks, and estimated time.
4. **Animated time counter** -- When toggling tasks, animate the total time change in the header.
5. **Undo bulk deselection** -- When a group is deselected, show a brief "Undo" toast.
6. **CTA hierarchy fix** -- "Easy Wins" should be the primary action. "See all tasks" should be secondary. Currently they're visually swapped.
7. **Search/filter tasks** -- For rooms with 20+ tasks, add a search bar.
8. **Task JSON size issue** -- For many tasks, the JSON in URL params can exceed limits. Consider passing via context or temp storage.
9. **Empty group handling** -- If all tasks in a group are deselected, show a gentle "No tasks selected in this area" message.
10. **Bottom gradient fade** -- The fixed bottom section should have a gradient fade-out effect above it.

### Code Examples

##### 1. Animated Toggle Switch

```tsx
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

function AnimatedToggle({
  isOn,
  onToggle,
  isDark,
}: {
  isOn: boolean;
  onToggle: () => void;
  isDark: boolean;
}) {
  const thumbX = useSharedValue(isOn ? 18 : 0);

  React.useEffect(() => {
    thumbX.value = withSpring(isOn ? 18 : 0, {
      damping: 15,
      stiffness: 250,
      mass: 0.5,
    });
  }, [isOn]);

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: thumbX.value }],
  }));

  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="switch"
      accessibilityState={{ checked: isOn }}
      style={[
        styles.toggleSwitch,
        {
          backgroundColor: isOn
            ? V1.blue
            : isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)',
        },
      ]}
    >
      <Animated.View style={[styles.toggleThumb, thumbStyle]} />
    </Pressable>
  );
}
```

##### 2. Animated Time Counter in Header

```tsx
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

const AnimatedText = Animated.createAnimatedComponent(Text);

// Track total minutes as shared value:
const animatedMinutes = useSharedValue(totalMinutes);

useEffect(() => {
  animatedMinutes.value = withTiming(totalMinutes, { duration: 300 });
}, [totalMinutes]);

// Use a regular Text that updates from the memoized value:
// (Animated text props are complex in RN; simpler to use state-driven)
<Text style={[styles.headerSubtitle, { color: t.textSecondary }]}>
  {selectedCount} tasks selected {'\u00B7'} about {totalMinutes} min
</Text>
```

##### 3. Task Expansion

```tsx
const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

// In the task row:
<Pressable
  key={task.id}
  onPress={() => toggleTask(task.id)}
  onLongPress={() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedTaskId(prev => prev === task.id ? null : task.id);
  }}
  style={[styles.taskRow, { borderBottomColor: t.border }]}
>
  {/* ...existing checkbox, name, time... */}
</Pressable>

{expandedTaskId === task.id && (
  <Animated.View
    entering={FadeInDown.duration(200)}
    style={[styles.taskExpanded, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }]}
  >
    {task.description && (
      <Text style={[styles.taskDesc, { color: t.textSecondary }]}>
        {task.description}
      </Text>
    )}
    {task.subtasks && task.subtasks.length > 0 && (
      <View style={styles.subtaskList}>
        {task.subtasks.map(sub => (
          <View key={sub.id} style={styles.subtaskRow}>
            <View style={[styles.subtaskDot, { backgroundColor: t.textMuted }]} />
            <Text style={[styles.subtaskText, { color: t.textSecondary }]}>
              {sub.title}
            </Text>
          </View>
        ))}
      </View>
    )}
    {task.whyThisMatters && (
      <Text style={[styles.taskWhy, { color: V1.coral }]}>
        Why: {task.whyThisMatters}
      </Text>
    )}
  </Animated.View>
)}
```

##### 4. Bottom Gradient Fade

```tsx
import { LinearGradient } from 'expo-linear-gradient';

// Above the bottom section, add:
<LinearGradient
  colors={[
    'transparent',
    isDark ? V1.dark.bg : V1.light.bg,
  ]}
  style={styles.bottomGradient}
  pointerEvents="none"
/>

// Style:
bottomGradient: {
  position: 'absolute',
  bottom: 120, // Height of bottom section
  left: 0,
  right: 0,
  height: 40,
},
```

##### 5. Fix CTA Hierarchy

```tsx
{/* Primary CTA: Start with Easy Wins (already the main action for ADHD) */}
<Pressable
  onPress={handleEasyWins}
  disabled={isSubmitting}
  style={({ pressed }) => [
    styles.addButton,
    { backgroundColor: V1.coral, opacity: isSubmitting ? 0.6 : pressed ? 0.88 : 1 },
  ]}
  accessibilityRole="button"
  accessibilityLabel={`Start with ${Math.min(3, selectedCount)} easy wins`}
>
  <Text style={styles.addButtonText}>
    Start with Easy Wins
  </Text>
</Pressable>

{/* Secondary CTA: See all tasks */}
<Pressable
  onPress={handleAddToRoom}
  disabled={isSubmitting}
  accessibilityRole="button"
  accessibilityLabel={`Add all ${selectedCount} tasks to room`}
>
  <Text style={[styles.easyWinsText, { color: V1.coral, opacity: isSubmitting ? 0.5 : 1 }]}>
    Add all {selectedCount} tasks to room
  </Text>
</Pressable>
```

### Edge Cases & States

- **Empty state:** No tasks passed (empty JSON or parse failure) -- should show a "No tasks found" message with a "Go back and retake" CTA.
- **Error state:** Room creation failure shows an alert. Should show inline error with retry.
- **Loading state:** `isSubmitting` disables buttons but doesn't show a spinner.
- **All tasks deselected:** Shows "0 tasks selected". The "Add to Room" button should be disabled. Currently it shows an alert.
- **Very many tasks (30+):** The ScrollView may lag. Consider using FlatList for the task list.
- **Task JSON too large:** URL params have size limits. For 30+ detailed tasks, the JSON could exceed ~2KB. Pass via DeclutterContext or AsyncStorage instead.
- **Offline:** Room creation via `addRoom` will try to sync to Convex. Should work offline with local-first approach.

### Animation Specifications

| Element | Animation | Duration | Config |
|---------|-----------|----------|--------|
| Group headers | FadeInDown | 300ms | staggered 60ms per group |
| Toggle switch thumb | spring translateX | spring(damping:15, stiffness:250, mass:0.5) | on toggle |
| Task expansion | FadeInDown | 200ms | on long press |
| Checkbox check | scale spring 0->1 | spring(damping:12, stiffness:200) | on toggle |
| Total time counter | numeric interpolation | 300ms | on change |

### Accessibility

- Group toggles: should use `accessibilityRole="switch"` with `accessibilityState={{ checked: allSelected }}`
- Task checkboxes: need `accessibilityRole="checkbox"` with `accessibilityState={{ checked: isSelected }}`
- Detail level chips: have `accessibilityRole="button"` and `accessibilityState` -- good
- Bottom section: should announce updates. Add `accessibilityLiveRegion="polite"` to the removed count text
- Long press for expansion: needs `accessibilityHint="Long press to see task details"`

### Performance Notes

- JSON parsing in `useMemo` with `tasksJson` dependency is efficient.
- The `groupedTasks` calculation uses a Map which is O(n) -- good.
- The `toggleGroup` creates a new Set each time. For very large task lists (100+), consider using an object/Map instead.
- The `handleAddToRoom` and `handleEasyWins` share 90% of their code. Extract a common `createRoomWithTasks` helper.

---

## CROSS-CUTTING CONCERNS

### Design System Improvements Needed

1. **Add animation constants** to `designTokens.ts`:
```tsx
export const ANIMATION = {
  spring: { damping: 15, stiffness: 200, mass: 0.8 },
  springLight: { damping: 12, stiffness: 250, mass: 0.5 },
  springBouncy: { damping: 8, stiffness: 180, mass: 0.8 },
  duration: {
    fast: 150,
    normal: 300,
    slow: 500,
  },
  stagger: 60,
} as const;
```

2. **Add button style helpers** to `designTokens.ts`:
```tsx
export function coralButtonStyle() {
  return {
    backgroundColor: V1.coral,
    borderRadius: 28,
    height: 56,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  };
}

export function outlineButtonStyle(isDark: boolean) {
  const t = isDark ? V1.dark : V1.light;
  return {
    borderColor: t.border,
    borderWidth: 1.5,
    borderRadius: 26,
    height: 52,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    flexDirection: 'row' as const,
    gap: 8,
  };
}
```

3. **Add input style helper**:
```tsx
export function inputFieldStyle(isDark: boolean) {
  const t = isDark ? V1.dark : V1.light;
  return {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    gap: 12,
    backgroundColor: t.inputBg,
    borderColor: t.inputBorder,
  };
}
```

### Shared Components to Extract

1. **CoralButton** -- Used identically in 8+ screens. Extract to `components/ui/CoralButton.tsx`.
2. **AnimatedInput** -- Input field with focus border animation. Used in login, signup, mascot step.
3. **ErrorBanner** -- The error display pattern is identical across login, signup, analysis.
4. **LoadingDots** -- Breathing/pulsing dots used in splash and root index.
5. **SectionLabel** -- Uppercase label pattern used in camera context picker, onboarding, task customize.

### ADHD-Specific UX Patterns to Implement Globally

1. **Time estimates everywhere** -- Every action should show expected time ("This will take ~2 min").
2. **Escape hatches** -- Every multi-step flow should have a skip/later option.
3. **Celebration on completion** -- Every task completion, however small, gets visual feedback.
4. **Low-decision defaults** -- Pre-select the best option so users can just tap "Continue".
5. **Progress visibility** -- Always show where the user is in any flow (step X of Y).
6. **Body doubling cues** -- "Dusty is working alongside you" during active cleaning sessions.

---

*End of Core Flow Improvement Plan. Total improvements identified: 96 across 12 screens.*

---

# PART 3: ROOM & SESSION SCREENS

> **Area:** Rooms Tab, Room Detail, Blitz Mode, Session Complete, Room Complete, Focus, Single Task, Today Tasks
> **Files:** 11 source files totaling 7,772 lines
> **Improvements Identified:** 74+


## TABLE OF CONTENTS

1. [Rooms Tab](#1-rooms-tab)
2. [Room Detail](#2-room-detail)
3. [Blitz Mode](#3-blitz-mode)
4. [Session Complete](#4-session-complete)
5. [Room Complete](#5-room-complete)
6. [Focus Mode](#6-focus-mode)
7. [Single Task](#7-single-task)
8. [Today Tasks](#8-today-tasks)
9. [Shared Components](#9-shared-components)
10. [Cross-Cutting Concerns](#10-cross-cutting-concerns)

---

## 1. ROOMS TAB

### ROOMS TAB
**File:** `app/(tabs)/rooms.tsx`
**Current Lines:** 646
**Current Rating:** 6.5/10
**Target Rating:** 9/10

#### Current State Analysis
- Clean implementation with skeleton loading, empty state, and room cards
- Freshness bars show task completion percentage (NOT the useRoomFreshness hook -- they diverge)
- Pull-to-refresh is a dummy 800ms timeout that does nothing
- No sorting/filtering of rooms
- No urgency indicators (rooms needing attention are counted but not visually differentiated)
- Room cards are uniform -- no visual distinction between "on fire" rooms and fresh ones
- The `useRoomFreshness` hook exists but is NOT used here -- freshness is recalculated inline with a different algorithm

#### Improvement Details

1. **Use the actual `useRoomFreshness` hook** -- The rooms tab calculates freshness based on task completion percentage, but `useRoomFreshness` uses time-based decay which is more meaningful. These should be unified.

2. **Sort rooms by urgency** -- Rooms needing attention should float to the top. ADHD users forget which room needs work; surface it for them.

3. **Freshness decay indicator** -- Show a small flame/alert icon on rooms with freshness below 25%. Visual urgency drives action.

4. **Pull-to-refresh should actually sync** -- Currently it fakes a refresh. Should trigger Convex re-query or at minimum recalculate freshness.

5. **Swipe-to-archive room** -- Users need a way to remove rooms without digging into settings. Use `react-native-gesture-handler` Pan gesture like TaskCard already does.

6. **Animated freshness bar fill** -- On mount, bars should animate from 0 to their value for visual delight.

7. **"Most urgent" callout card** -- Before the room list, show a highlighted card for the room most in need. Uses `getMostUrgentRoom()` from useRoomFreshness.

8. **Long-press room for quick actions** -- Quick delete, re-scan, start blitz. Reduce navigation depth.

9. **Room count badge in tab bar** -- Show count of rooms needing attention as a badge on the tab icon.

10. **Staggered skeleton shimmer** -- Replace static placeholder views with actual shimmer animation.

#### Code Examples

##### 1. Integrate useRoomFreshness and sort by urgency
```tsx
// In RoomsScreenContent, replace the existing freshness calculation:
import { useRoomFreshness, RoomFreshness } from '@/hooks/useRoomFreshness';

// Inside component:
const freshnessList = useRoomFreshness(safeRooms);

// Sort rooms by freshness (lowest = most urgent first)
const sortedRooms = useMemo(() => {
  return [...safeRooms].sort((a, b) => {
    const aFresh = freshnessList.find(f => f.roomId === a.id)?.freshness ?? 100;
    const bFresh = freshnessList.find(f => f.roomId === b.id)?.freshness ?? 100;
    return aFresh - bFresh;
  });
}, [safeRooms, freshnessList]);

// In RoomCard, accept freshness data:
function RoomCard({
  isDark,
  room,
  freshness,
  onPress,
}: {
  isDark: boolean;
  room: Room;
  freshness: RoomFreshness;
  onPress: () => void;
}) {
  const t = getTheme(isDark);
  const Icon = getRoomIcon(room.type);
  // ...existing scale animation...

  return (
    <AnimatedPressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}
      accessibilityRole="button"
      accessibilityLabel={`Open ${room.name}, ${freshness.label}, ${freshness.freshness}% fresh`}
      style={animatedStyle}
    >
      <View style={[styles.roomCard, cardStyle(isDark)]}>
        {/* Urgency indicator for low freshness */}
        {freshness.freshness < 25 && (
          <View style={styles.urgencyDot}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: V1.coral }} />
          </View>
        )}
        {/* ...existing thumbnail, content, chevron... */}
        <View style={styles.roomContent}>
          <Text style={[styles.roomName, { color: t.text }]} numberOfLines={1}>
            {room.name}
          </Text>
          {/* Use real freshness data */}
          <View style={[styles.freshnessTrack, {
            backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
          }]}>
            <Animated.View
              style={[styles.freshnessFill, {
                backgroundColor: freshness.color,
                width: `${Math.max(freshness.freshness, 4)}%`,
              }]}
            />
          </View>
          <Text style={[styles.roomStatus, { color: t.textSecondary }]}>
            {freshness.label}{'  \u00B7  '}{getTaskSummary(room)}
          </Text>
        </View>
        <ChevronRight size={18} color={t.textMuted} />
      </View>
    </AnimatedPressable>
  );
}
```

##### 2. Most Urgent Room Callout
```tsx
import { getMostUrgentRoom } from '@/hooks/useRoomFreshness';

// Inside RoomsScreenContent:
const urgentRoom = useMemo(() => {
  if (safeRooms.length === 0) return null;
  return getMostUrgentRoom(safeRooms);
}, [safeRooms]);

// Render before room list:
{urgentRoom && urgentRoom.freshness < 50 && (
  <Animated.View entering={enter(40)}>
    <Pressable
      onPress={() => handleRoomPress(urgentRoom.roomId)}
      style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}
    >
      <LinearGradient
        colors={isDark
          ? ['rgba(255,107,107,0.12)', 'rgba(255,107,107,0.04)']
          : ['rgba(255,107,107,0.08)', 'rgba(255,107,107,0.02)']
        }
        style={{
          borderRadius: RADIUS.lg,
          padding: SPACING.cardPadding,
          borderWidth: 1,
          borderColor: `${V1.coral}30`,
        }}
      >
        <Text style={{
          fontFamily: BODY_FONT, fontSize: 12, fontWeight: '700',
          color: V1.coral, letterSpacing: 0.5, marginBottom: 6,
        }}>
          NEEDS YOUR ATTENTION
        </Text>
        <Text style={{
          fontFamily: DISPLAY_FONT, fontSize: 18, fontWeight: '700',
          color: t.text, marginBottom: 4,
        }}>
          {urgentRoom.roomName}
        </Text>
        <Text style={{
          fontFamily: BODY_FONT, fontSize: 13, color: t.textSecondary,
        }}>
          {urgentRoom.label} -- {Math.round(urgentRoom.daysSinceClean)} days since last clean
        </Text>
      </LinearGradient>
    </Pressable>
  </Animated.View>
)}
```

##### 3. Animated freshness bar fill on mount
```tsx
import { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';

// Inside RoomCard:
const fillWidth = useSharedValue(0);

useEffect(() => {
  fillWidth.value = withTiming(freshness.freshness, {
    duration: 600,
    easing: Easing.out(Easing.cubic),
  });
}, [freshness.freshness]);

const fillAnimatedStyle = useAnimatedStyle(() => ({
  width: `${Math.max(fillWidth.value, 4)}%`,
  backgroundColor: freshness.color,
}));

// Replace static View with:
<Animated.View style={[styles.freshnessFill, fillAnimatedStyle]} />
```

##### 4. Skeleton shimmer animation
```tsx
import { useSharedValue, useAnimatedStyle, withRepeat, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

function SkeletonShimmer({ width, height, borderRadius = 4 }: {
  width: number | string;
  height: number;
  borderRadius?: number;
}) {
  const translateX = useSharedValue(-100);

  useEffect(() => {
    translateX.value = withRepeat(
      withTiming(100, { duration: 1200 }),
      -1,
      false,
    );
  }, []);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: `${translateX.value}%` as any }],
  }));

  return (
    <View style={{
      width: width as any,
      height,
      borderRadius,
      backgroundColor: 'rgba(255,255,255,0.06)',
      overflow: 'hidden',
    }}>
      <Animated.View style={[{
        ...StyleSheet.absoluteFillObject,
      }, shimmerStyle]}>
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.08)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}
```

#### Edge Cases & States
- **Empty state:** Well-handled with CTA and feature pills. Add a subtle animation to the icon (gentle bounce or float).
- **Error state:** Missing -- add ScreenErrorBoundary (already wrapped). Add retry on error.
- **Loading state:** Skeleton exists but is static. Add shimmer animation.
- **First-time user:** Empty state shows "Start with the room that bothers you most" -- good ADHD framing. Consider adding mascot avatar.
- **Returning user:** No "Welcome back" or comeback indicator. If lastActivityDate > 3 days, show warm re-engagement message.
- **Offline:** No offline indicator. Rooms are persisted locally via AsyncStorage, so they render, but fresh data won't sync. Show subtle "Offline" badge.

#### Animation Specifications
- Freshness bar fill: `withTiming(targetPercent, { duration: 600, easing: Easing.out(Easing.cubic) })`
- Room card press: `withSpring(0.98, { damping: 15, stiffness: 150 })` (already implemented)
- Stagger entrance: `FadeInDown.duration(380).delay(60 + index * 40)` (already implemented)
- Skeleton shimmer: `withRepeat(withTiming(100, { duration: 1200 }), -1, false)`

#### Accessibility
- Room cards have `accessibilityRole="button"` and labels -- good. Expand labels to include freshness: "Open Kitchen, Needs attention, 25% fresh"
- Add button has accessibility -- good
- Empty state CTA has accessibility -- good
- Missing: `accessibilityRole="list"` on the room list container
- Missing: Announce room count changes with `AccessibilityInfo.announceForAccessibility`
- Touch targets: Add button is 40x40 (meets 44pt minimum with hitSlop). Room cards are well-sized.

#### Performance Notes
- `useRoomFreshness` is memoized with `useMemo` -- good
- Room list doesn't use FlatList -- for <20 rooms, ScrollView is acceptable. If room limit increases, switch to FlashList.
- `getFreshnessInfo` and `getTaskSummary` are called per render -- should be memoized or computed once per room
- Room photos use `expo-image` with `cachePolicy="memory-disk"` -- excellent

---

## 2. ROOM DETAIL

### ROOM DETAIL
**File:** `app/room/[id].tsx`
**Current Lines:** 1,618
**Current Rating:** 6/10
**Target Rating:** 9/10

#### Current State Analysis
This is the most complex screen in the app and desperately needs decomposition. At 1,618 lines, it contains:
- Hero photo header with gradient overlay
- Freshness progress bar
- Time estimate summary
- Zone progress bars
- View toggle row (Focus Mode / My Energy / By Zone)
- Phase tabs (Quick Wins / Deep Clean / Organize)
- Task list with inline expansion
- TaskDetailPanel sub-component (inline, 130 lines)
- XPFloatUp sub-component (inline)
- Combo counter
- Undo toast
- Dependency hint toast
- Completion prompt
- Floating Blitz CTA

**What works well:**
- Phase-based task grouping (Quick Wins first = ADHD-friendly)
- Visual impact sorting (high-impact tasks surface for dopamine hit)
- Zone view for spatial thinkers
- Energy filter integration
- XP float-up micro-interaction
- Combo counter for rapid completions
- Undo toast for accidental completions
- Dependency hints (non-blocking, suggestion-only)

**What needs work:**
- Single 1,200-line component -- impossible to maintain
- Pull-to-refresh fakes it (same as rooms tab)
- No drag-to-reorder tasks
- Hero section doesn't use Parallax scrolling
- No offline queue for task completions
- Progress bar in hero is not animated
- Missing AI summary display (room has `aiSummary` field but it's never shown)
- No "Good Enough" mode (user can't declare a room "done enough")
- Doom piles from AI analysis are not rendered here (DoomPileCard exists but isn't used)
- Session check-in (SessionCheckIn component) is not triggered from room detail

#### Improvement Details

1. **Decompose into sub-components** -- Extract HeroHeader, TaskListSection, ZoneView, PhaseView, ViewToggleBar, TimeSummary, CompletionPrompt as separate files.

2. **Add parallax hero** -- Scroll-linked parallax on the room photo creates depth. Use `useAnimatedScrollHandler`.

3. **Animated progress bar** -- Hero progress bar should animate from old to new value on task completion.

4. **Show AI summary** -- Display `room.aiSummary` below the hero as a dismissible card.

5. **Integrate DoomPileCard** -- If room analysis found doom piles, show them at the top of the task list.

6. **Trigger SessionCheckIn** -- On first visit to room detail (or after 24h gap), show the energy/mood/time check-in to personalize task filtering.

7. **Drag-to-reorder tasks** -- Let users manually prioritize. Use `react-native-draggable-flatlist` or gesture-based reorder.

8. **"Good Enough" button** -- For ADHD users who get stuck on perfectionism. Declares room "done enough" at any progress level, celebrates anyway.

9. **Animated task completion** -- Task card should animate (scale, strikethrough, fade) when completed, not just change opacity.

10. **Batch action mode** -- Long-press to enter multi-select, complete multiple tasks at once.

11. **Quick-add task** -- Inline text input at bottom of task list to add custom tasks.

12. **Room photo gallery** -- Tap hero photo to see all before/progress/after photos in a lightbox.

13. **Share room progress** -- Share button to export progress screenshot.

14. **Task difficulty feedback** -- After completing a task, quick thumbs-up/down on difficulty estimate accuracy (feeds back to AI).

15. **Offline task completion queue** -- Queue task toggles when offline, sync when back online.

#### Code Examples

##### 1. Decomposed HeroHeader component
```tsx
// components/room/HeroHeader.tsx
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft } from 'lucide-react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
  interpolate,
  Extrapolation,
  SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { V1, BODY_FONT, DISPLAY_FONT } from '@/constants/designTokens';
import { Room } from '@/types/declutter';

interface HeroHeaderProps {
  room: Room;
  progress: number;
  freshnessLabel: string;
  freshnessColor: string;
  scrollY: SharedValue<number>;
  isDark: boolean;
}

export function HeroHeader({
  room,
  progress,
  freshnessLabel,
  freshnessColor,
  scrollY,
  isDark,
}: HeroHeaderProps) {
  const insets = useSafeAreaInsets();
  const photoUri = room.photos?.[0]?.uri;

  // Parallax effect on hero photo
  const heroStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      scrollY.value,
      [-100, 0, 240],
      [-50, 0, 60],
      Extrapolation.CLAMP,
    );
    const scale = interpolate(
      scrollY.value,
      [-100, 0],
      [1.3, 1],
      Extrapolation.CLAMP,
    );
    return {
      transform: [{ translateY }, { scale }],
    };
  });

  // Animated progress bar
  const progressWidth = useSharedValue(0);
  React.useEffect(() => {
    progressWidth.value = withTiming(progress, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${Math.max(progressWidth.value, 3)}%`,
    backgroundColor: freshnessColor,
  }));

  return (
    <View style={styles.heroSection}>
      <Animated.View style={[StyleSheet.absoluteFillObject, heroStyle]}>
        {photoUri ? (
          <Image
            source={{ uri: photoUri }}
            style={StyleSheet.absoluteFillObject}
            contentFit="cover"
            placeholder={{ blurhash: 'LGF5]+Yk^6#M@-5c,1J5@[or[Q6.' }}
            cachePolicy="memory-disk"
            transition={300}
          />
        ) : (
          <View style={[StyleSheet.absoluteFillObject, {
            backgroundColor: isDark ? '#1A1A1A' : '#E8E8E8',
            alignItems: 'center',
            justifyContent: 'center',
          }]}>
            <Text style={{ fontSize: 14, color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.35)', fontFamily: BODY_FONT }}>
              Take a photo of this room
            </Text>
          </View>
        )}
      </Animated.View>
      <LinearGradient
        colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
        style={StyleSheet.absoluteFillObject}
      />
      <Pressable
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }}
        style={[styles.backButton, { top: insets.top + 8 }]}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <ChevronLeft size={24} color="#FFFFFF" />
      </Pressable>
      <View style={[styles.statusPill, { top: insets.top + 8 }]}>
        <Text style={[styles.statusPillText, { color: freshnessColor }]}>
          {freshnessLabel}
        </Text>
      </View>
      <View style={styles.heroBottom}>
        <Text style={styles.heroRoomName}>{room.name}</Text>
        <View style={styles.heroProgressBar}>
          <Animated.View style={[styles.heroProgressFill, progressStyle]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heroSection: { height: 240, position: 'relative', overflow: 'hidden' },
  backButton: {
    position: 'absolute', left: 16, width: 40, height: 40,
    borderRadius: 20, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  statusPill: {
    position: 'absolute', right: 16,
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  statusPillText: { fontSize: 12, fontWeight: '600', fontFamily: BODY_FONT },
  heroBottom: { position: 'absolute', bottom: 20, left: 20, right: 20 },
  heroRoomName: {
    color: '#FFFFFF', fontSize: 28, fontWeight: '700',
    letterSpacing: -0.5, marginBottom: 12, fontFamily: DISPLAY_FONT,
  },
  heroProgressBar: { height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.15)' },
  heroProgressFill: { height: 6, borderRadius: 3 },
});
```

##### 2. Good Enough Mode
```tsx
// In room detail, after the completion prompt section:
function GoodEnoughButton({
  isDark,
  onPress,
  progress,
}: {
  isDark: boolean;
  onPress: () => void;
  progress: number;
}) {
  const t = isDark ? V1.dark : V1.light;
  if (progress >= 90 || progress < 20) return null; // Only show in the middle range

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel="Declare this room good enough for now"
      style={({ pressed }) => [{
        opacity: pressed ? 0.8 : 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: isDark ? 'rgba(102,187,106,0.3)' : 'rgba(102,187,106,0.25)',
        backgroundColor: isDark ? 'rgba(102,187,106,0.08)' : 'rgba(102,187,106,0.06)',
        marginHorizontal: 20,
        marginTop: 8,
      }]}
    >
      <Text style={{ fontSize: 16 }}>{'\\u2728'}</Text>
      <Text style={{
        fontFamily: BODY_FONT,
        fontSize: 14,
        fontWeight: '600',
        color: V1.green,
      }}>
        Good enough for today!
      </Text>
    </Pressable>
  );
}

// Handler:
const handleGoodEnough = useCallback(() => {
  if (!room) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  router.push({
    pathname: '/session-complete',
    params: {
      tasksCompleted: String(completedTasks),
      timeSpent: String(allTasks.filter(t => t.completed).reduce((s, t) => s + (t.actualMinutes || t.estimatedMinutes || 3), 0)),
      xpEarned: String(completedTasks * 10),
      roomId: room.id,
      roomName: room.name,
    },
  });
}, [room, completedTasks, allTasks]);
```

##### 3. Animated task completion with strikethrough
```tsx
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';

function AnimatedTaskCard({
  task,
  onComplete,
  isDark,
}: {
  task: CleaningTask;
  onComplete: (taskId: string) => void;
  isDark: boolean;
}) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(task.completed ? 0.5 : 1);

  const cardAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handleComplete = () => {
    if (!task.completed) {
      // Celebration animation: pop then settle
      scale.value = withSequence(
        withSpring(1.05, { damping: 8, stiffness: 400 }),
        withSpring(1, { damping: 15, stiffness: 200 }),
      );
      opacity.value = withTiming(0.5, { duration: 400 });
    } else {
      // Restore animation
      opacity.value = withTiming(1, { duration: 300 });
    }
    onComplete(task.id);
  };

  return (
    <Animated.View style={cardAnimStyle}>
      {/* ...existing task card content... */}
    </Animated.View>
  );
}
```

##### 4. Display AI Summary
```tsx
// Below hero section, before time summary:
{room.aiSummary && (
  <Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(100).duration(300)}>
    <View style={{
      marginHorizontal: 20,
      marginTop: 12,
      padding: 14,
      borderRadius: 14,
      backgroundColor: isDark ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.06)',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.12)',
    }}>
      <Text style={{
        fontFamily: BODY_FONT, fontSize: 12, fontWeight: '700',
        color: V1.indigo, marginBottom: 6,
      }}>
        AI ANALYSIS
      </Text>
      <Text style={{
        fontFamily: BODY_FONT, fontSize: 13, lineHeight: 19,
        color: t.textSecondary,
      }}>
        {room.aiSummary}
      </Text>
    </View>
  </Animated.View>
)}
```

##### 5. Integrate DoomPileCard
```tsx
// In the task list area, before phase tabs:
import { DoomPileCard } from '@/components/room/DoomPileCard';

// Assuming room has doomPiles from AI analysis stored somewhere
// You'd need to add doomPiles to the Room type or fetch from analysis
{room.doomPiles && room.doomPiles.length > 0 && (
  <View style={{ marginBottom: 8 }}>
    {room.doomPiles.map((pile, index) => (
      <DoomPileCard
        key={index}
        doomPile={pile}
        index={index}
        onStart={() => {
          // Navigate to single-task mode with doom pile tasks
          if (pile.linkedTaskIds && pile.linkedTaskIds.length > 0) {
            setActiveRoom(room.id);
            router.push({
              pathname: '/single-task',
              params: { roomId: room.id, taskId: pile.linkedTaskIds[0] },
            });
          }
        }}
        onSkip={() => {
          // Collapse/dismiss
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }}
      />
    ))}
  </View>
)}
```

#### Edge Cases & States
- **Empty state (no tasks):** Currently just shows "No tasks in this phase". Should show a CTA to re-scan the room or add tasks manually.
- **Error state:** Room not found is handled well. Missing: network error when syncing task completions.
- **Loading state:** No loading indicator when task optimizer is computing. Add a brief skeleton or spinner for `getUserCleaningProfile`.
- **First-time user:** First room visit should trigger SessionCheckIn modal for energy/mood calibration.
- **Returning user (>3 days):** Show "Welcome back! Here's where you left off" with the next task highlighted.
- **Offline:** Task completions should queue and sync later. Show "Saved locally" badge.
- **All tasks completed:** `showCompletionPrompt` card appears inline. Consider auto-navigating to room-complete after a 2-second delay.

#### Animation Specifications
- Hero parallax: `interpolate(scrollY, [-100, 0, 240], [-50, 0, 60])` with scale `[-100, 0] -> [1.3, 1]`
- Progress bar: `withTiming(progress, { duration: 800, easing: Easing.out(Easing.cubic) })`
- Task completion pop: `withSequence(withSpring(1.05, { damping: 8 }), withSpring(1, { damping: 15 }))`
- XP float-up: `translateY withTiming(-60, 900ms)`, `opacity withDelay(400, withTiming(0, 500ms))` (already implemented)
- Phase transition: `FadeInDown.delay(index * 40).duration(300)` (already implemented)
- Combo badge: `FadeInDown.springify()` (already implemented)

#### Accessibility
- Back button: has `accessibilityRole="button"` and label -- good
- Checkboxes: have `accessibilityRole="checkbox"` with state -- good
- Phase tabs: have `accessibilityRole="tab"` with `accessibilityState.selected` -- excellent
- Missing: `accessibilityRole="tablist"` on phase container (it IS there -- good)
- Missing: task reorder instructions for VoiceOver users
- Missing: time estimate should be announced when task is focused: "5 minutes estimated"
- Touch targets: checkbox is 28x28 with hitSlop 8 = 44pt effective -- meets minimum
- Skip button is small (14px icon with 4px padding) = 22pt. Needs larger hitSlop or padding.

#### Performance Notes
- **Critical:** 1,618 lines in one file. Extract at least HeroHeader, TaskDetailPanel, ZoneView into separate files to improve tree-shaking and code-splitting.
- `phaseTasks` and `zoneTasks` are memoized -- good
- `renderTaskCard` uses `useCallback` but has many dependencies -- may not actually prevent re-renders. Consider `React.memo` for individual task cards.
- `optimizeTaskOrder` runs on every rawTasks change -- should be debounced if tasks change rapidly during a session.
- The inline `StyleSheet.create` at bottom is fine but many inline styles exist in JSX -- extract to stylesheet for consistency and performance.

---

## 3. BLITZ MODE

### BLITZ MODE
**File:** `app/blitz.tsx`
**Current Lines:** 1,238
**Current Rating:** 7/10
**Target Rating:** 9.5/10

#### Current State Analysis
This is the hero feature. It has two views: Timer view (ring countdown) and Focus view (single task). Both work well. Notable features:
- Timer ring with SVG circle animation
- Two view modes: timer (clock-focused) and focus (task-focused)
- Combo counter for rapid completions
- Phase transition celebrations
- Carry chain hints (same-zone/same-destination optimization)
- Before photo thumbnail + modal preview
- Task subtask steps display
- Dusty says tip bubble
- Auto-pause on background

**Issues:**
- Timer ring uses SVG `strokeDashoffset` which doesn't animate smoothly. Should use Reanimated SVG or Skia.
- No break enforcement -- 15-min blitz should prompt a break after completion
- Combo badge position is fixed at `top: 100` -- doesn't account for dynamic header heights
- No audio/haptic at time milestones (halfway, 5-min warning, 1-min warning)
- No motivational music/ambience option
- Skip task doesn't record skip reason (feedback for AI)
- No "extend timer" option when timer expires but tasks remain
- View mode toggle isn't visually clear about which mode you're in
- No task completion celebration animation (just haptic)

#### Improvement Details

1. **Smooth animated timer ring** -- Use `react-native-reanimated` animated props with `react-native-svg` for buttery smooth ring animation, or switch to Skia `Path` with `useAnimatedProps`.

2. **Time milestone haptics** -- Haptic feedback at 50% (already exists), 75%, 2-minute warning, and 30-second warning. Different intensities for each.

3. **Extend timer option** -- When timer hits 0 but tasks remain, show "Add 5 more minutes?" instead of immediately ending.

4. **Task completion celebration** -- Confetti burst on task complete, scale animation on the check circle, XP float up.

5. **Skip reason capture** -- Quick one-tap reason: "Too hard", "Need supplies", "Not now". Feeds back to AI for better task ordering.

6. **Break enforcement** -- After session ends, show break timer (5 min) before allowing restart. Configurable in settings.

7. **Ambient sound toggle** -- White noise / lo-fi beats during session. Use `expo-audio`.

8. **Streak indicator** -- Show how many consecutive sessions completed today.

9. **Dynamic combo badge position** -- Use safe area insets + header height calculation.

10. **Current task micro-timer** -- Small countdown showing estimated time for current task specifically.

#### Code Examples

##### 1. Animated Timer Ring with Reanimated
```tsx
import Animated, {
  useAnimatedProps,
  useDerivedValue,
  withTiming,
} from 'react-native-reanimated';
import { Circle, Svg } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function SmoothTimerRing({
  progress,
  size,
  strokeWidth,
  color,
  trackColor,
}: {
  progress: number; // 0-1 (remaining / total)
  size: number;
  strokeWidth: number;
  color: string;
  trackColor: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const animatedProgress = useDerivedValue(() => {
    return withTiming(progress, { duration: 1000 });
  }, [progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - Math.max(0, Math.min(1, animatedProgress.value))),
  }));

  return (
    <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={trackColor}
        strokeWidth={strokeWidth}
        fill="none"
      />
      <AnimatedCircle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={circumference}
        animatedProps={animatedProps}
        strokeLinecap="round"
      />
    </Svg>
  );
}
```

##### 2. Time milestone haptics
```tsx
// Inside timer tick effect, add milestone checks:
useEffect(() => {
  if (!isRunning) return;

  const elapsed = blitzDuration - remainingSeconds;
  const quarterTime = Math.floor(blitzDuration * 0.25);
  const halfTime = Math.floor(blitzDuration * 0.5);
  const threeQuarterTime = Math.floor(blitzDuration * 0.75);

  // 25% milestone
  if (elapsed === quarterTime) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
  // 50% milestone (already exists but let's make it more distinct)
  if (elapsed === halfTime) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }
  // 75% milestone
  if (elapsed === threeQuarterTime) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }
  // 2-minute warning
  if (remainingSeconds === 120) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }
  // 30-second warning
  if (remainingSeconds === 30) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }
}, [remainingSeconds, isRunning, blitzDuration]);
```

##### 3. Extend timer when it expires
```tsx
const [showExtendPrompt, setShowExtendPrompt] = useState(false);

// Modify handleSessionEnd to check if tasks remain:
const handleSessionEnd = useCallback(() => {
  if (hasEndedRef.current) return;
  const remaining = tasks.filter(t => !t.completed).length;

  if (remaining > 0 && completedCountRef.current > 0) {
    // Tasks remain -- offer extension
    setShowExtendPrompt(true);
    setIsRunning(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    return;
  }

  // ...existing end logic...
}, [tasks, activeRoom, blitzDuration, comebackMultiplier]);

// Extend prompt UI:
{showExtendPrompt && (
  <Animated.View
    entering={FadeInDown.duration(300)}
    style={{
      position: 'absolute',
      bottom: insets.bottom + 80,
      left: 20,
      right: 20,
      zIndex: 200,
      backgroundColor: isDark ? V1.dark.cardElevated : '#FFFFFF',
      borderRadius: 20,
      padding: 20,
      borderWidth: 1,
      borderColor: t.border,
      ...CARD_SHADOW_LG,
    }}
  >
    <Text style={{
      fontFamily: DISPLAY_FONT, fontSize: 18, fontWeight: '700',
      color: t.text, textAlign: 'center', marginBottom: 6,
    }}>
      Time's up! Keep going?
    </Text>
    <Text style={{
      fontFamily: BODY_FONT, fontSize: 14,
      color: t.textSecondary, textAlign: 'center', marginBottom: 16,
    }}>
      {tasks.filter(t => !t.completed).length} tasks remaining
    </Text>
    <View style={{ flexDirection: 'row', gap: 10 }}>
      <Pressable
        onPress={() => {
          setShowExtendPrompt(false);
          setRemainingSeconds(5 * 60); // Add 5 minutes
          setIsRunning(true);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }}
        style={{
          flex: 1, backgroundColor: V1.coral,
          paddingVertical: 14, borderRadius: 14, alignItems: 'center',
        }}
      >
        <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 15, fontFamily: BODY_FONT }}>
          +5 min
        </Text>
      </Pressable>
      <Pressable
        onPress={() => {
          setShowExtendPrompt(false);
          hasEndedRef.current = true;
          handleSessionEnd();
        }}
        style={{
          flex: 1, borderWidth: 1, borderColor: t.border,
          paddingVertical: 14, borderRadius: 14, alignItems: 'center',
        }}
      >
        <Text style={{ color: t.textSecondary, fontWeight: '600', fontSize: 15, fontFamily: BODY_FONT }}>
          I'm done
        </Text>
      </Pressable>
    </View>
  </Animated.View>
)}
```

##### 4. Skip reason capture
```tsx
const [showSkipReason, setShowSkipReason] = useState(false);
const [pendingSkipIndex, setPendingSkipIndex] = useState<number | null>(null);

const SKIP_REASONS = [
  { id: 'too_hard', label: 'Too hard right now', emoji: '😓' },
  { id: 'need_supplies', label: 'Need supplies', emoji: '🛒' },
  { id: 'not_applicable', label: 'Doesn\'t apply', emoji: '🤷' },
  { id: 'later', label: 'Save for later', emoji: '⏰' },
] as const;

const handleSkipWithReason = (reason: string) => {
  if (pendingSkipIndex !== null && currentTask) {
    // Record skip reason for AI feedback
    // This could be stored in task.skipReason via updateTask
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentTaskIndex(i => Math.min(i + 1, totalTasks - 1));
  }
  setShowSkipReason(false);
  setPendingSkipIndex(null);
};

// Skip reason bottom sheet:
{showSkipReason && (
  <View style={{
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: isDark ? V1.dark.card : '#FFFFFF',
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingBottom: insets.bottom + 16, paddingTop: 20, paddingHorizontal: 20,
    zIndex: 300,
  }}>
    <Text style={{
      fontFamily: DISPLAY_FONT, fontSize: 17, fontWeight: '700',
      color: t.text, marginBottom: 16,
    }}>
      Why skip this one?
    </Text>
    {SKIP_REASONS.map(reason => (
      <Pressable
        key={reason.id}
        onPress={() => handleSkipWithReason(reason.id)}
        style={{
          flexDirection: 'row', alignItems: 'center', gap: 12,
          paddingVertical: 14, borderBottomWidth: 1,
          borderBottomColor: t.border,
        }}
      >
        <Text style={{ fontSize: 20 }}>{reason.emoji}</Text>
        <Text style={{ fontFamily: BODY_FONT, fontSize: 15, color: t.text }}>
          {reason.label}
        </Text>
      </Pressable>
    ))}
  </View>
)}
```

#### Edge Cases & States
- **Empty state (no tasks):** Well-handled with "All caught up!" and scan CTA
- **Error state:** Missing -- if room data is corrupted, show recovery option
- **Loading state:** No loading while tasks are being fetched/computed
- **Timer at 0:** Currently ends session immediately. Should offer extension.
- **All tasks completed before timer:** Handled via `handleSessionEnd` timeout. Good.
- **App backgrounded:** Timer pauses correctly. Good. But elapsed background time should be communicated on return ("You were away for 3 minutes, timer was paused").
- **Offline:** No specific handling. Task completions should still work (local state), but XP sync may fail.

#### Animation Specifications
- Timer ring: `withTiming(progress, { duration: 1000 })` for smooth 1-second transitions
- Combo badge: `FadeInDown.springify()` (exists)
- Phase transition banner: `FadeIn.duration(300)` / `FadeOut.duration(300)` (exists)
- Task completion: `withSequence(withSpring(1.15), withSpring(1))` on check circle
- Timer badge pulse at <2 min: `withRepeat(withSequence(withTiming(1.05), withTiming(1)), -1)`

#### Accessibility
- Close button: has role and label -- good
- Timer badge: has label with remaining time -- good
- Complete button: has descriptive label -- good
- Missing: announce task changes with `AccessibilityInfo.announceForAccessibility("Next task: Wipe counters")`
- Missing: screen reader should announce timer milestones
- Touch targets: Big check circle is 72x72 -- excellent. Skip text is small -- needs larger hitSlop.

#### Performance Notes
- Timer uses `setInterval` with 1-second tick -- standard, works fine
- SVG re-renders every second -- switching to Reanimated animated props would reduce JS thread work
- `tasks` memo depends on `activeRoom` which changes on every task completion -- consider stabilizing with `useRef`
- Two large render paths (timer view vs focus view) -- consider lazy rendering with `React.lazy` or just conditional unmounting (current approach)

---

## 4. SESSION COMPLETE

### SESSION COMPLETE
**File:** `app/session-complete.tsx`
**Current Lines:** 441
**Current Rating:** 7/10
**Target Rating:** 9/10

#### Current State Analysis
- Shows mascot celebrating, stats row, room progress, completed tasks list, and upcoming tasks
- Auto-redirects to room-complete when progress is 100%
- Schedules celebration notification and refreshes daily reminder
- Animated progress bar
- Clean cascading entrance animations

**Issues:**
- No confetti animation (room-complete has it, session-complete doesn't)
- Stats are just static numbers -- no counting animation
- No streak update display
- No level-up celebration if XP crosses threshold
- "Continue Cleaning" just navigates back, doesn't pre-select next task
- No social sharing option
- Before photo thumbnail is shown but not tappable for lightbox
- The "What you cleared" section is plain -- could be more celebratory

#### Improvement Details

1. **Counting animation for stats** -- Numbers should count up from 0 like the XP counter in room-complete.

2. **Level-up detection and celebration** -- Check if XP crossed a level threshold. If so, show level-up animation.

3. **Light confetti for sessions > 3 tasks** -- Not as intense as room-complete, but reward effort.

4. **Streak update callout** -- "Day 5 streak!" or "You're back! Streak restored."

5. **Before photo lightbox** -- Tap the room thumbnail to see the full before photo.

6. **Social sharing** -- Share progress card with stats and before photo.

7. **Personalized celebration copy** -- Based on mood from SessionCheckIn, vary the celebration message intensity.

8. **Consistency score display** -- Show "3 of last 7 days active" from useConsistencyScore.

#### Code Examples

##### 1. Counting animation for stats
```tsx
function CountUpStat({
  value,
  label,
  color,
  suffix,
  duration = 800,
}: {
  value: number;
  label: string;
  color: string;
  suffix?: string;
  duration?: number;
}) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (value === 0) return;
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setDisplayValue(Math.round(eased * value));
      if (progress >= 1) clearInterval(interval);
    }, 16);
    return () => clearInterval(interval);
  }, [value, duration]);

  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text style={{
        fontFamily: DISPLAY_FONT, fontSize: 24, fontWeight: '800',
        color, marginBottom: 4,
      }}>
        {displayValue}{suffix}
      </Text>
      <Text style={{
        fontFamily: BODY_FONT, fontSize: 13,
        color: 'rgba(255,255,255,0.5)',
      }}>
        {label}
      </Text>
    </View>
  );
}

// Usage in stats card:
<View style={[styles.statsCard, { backgroundColor: t.card, borderColor: t.border }]}>
  <CountUpStat value={tasks} label="Tasks" color={V1.coral} />
  <View style={[styles.statDivider, { backgroundColor: t.border }]} />
  <CountUpStat value={time} label="Time" color={t.text} suffix="m" />
  <View style={[styles.statDivider, { backgroundColor: t.border }]} />
  <CountUpStat value={xp} label="XP" color={V1.green} suffix="" />
</View>
```

##### 2. Streak callout
```tsx
import { useConsistencyScore } from '@/hooks/useConsistencyScore';

// Inside component:
const consistency = useConsistencyScore(rooms, stats);

// Render after stats:
{(stats.currentStreak > 1 || consistency.activeDays > 2) && (
  <Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(350).duration(400)}>
    <View style={{
      flexDirection: 'row', alignItems: 'center', gap: 10,
      paddingHorizontal: 16, paddingVertical: 12,
      borderRadius: 14, marginTop: 16,
      backgroundColor: isDark ? 'rgba(255,213,79,0.08)' : 'rgba(255,213,79,0.06)',
      borderWidth: 1, borderColor: isDark ? 'rgba(255,213,79,0.15)' : 'rgba(255,213,79,0.12)',
    }}>
      <Text style={{ fontSize: 20 }}>
        {stats.currentStreak >= 7 ? '🔥' : stats.currentStreak >= 3 ? '💪' : '✨'}
      </Text>
      <View style={{ flex: 1 }}>
        <Text style={{
          fontFamily: BODY_FONT, fontSize: 14, fontWeight: '700',
          color: V1.gold,
        }}>
          {stats.currentStreak > 1
            ? `${stats.currentStreak}-day streak!`
            : `${consistency.activeDays} of 7 days active`}
        </Text>
        <Text style={{
          fontFamily: BODY_FONT, fontSize: 12, color: t.textMuted,
        }}>
          {consistency.label}
        </Text>
      </View>
    </View>
  </Animated.View>
)}
```

#### Edge Cases & States
- **All stats zero:** Handled with "Session recorded" message -- good
- **Room not found:** Progress section gracefully skips -- good
- **100% room progress:** Auto-redirect to room-complete -- good
- **Missing params:** Default to 0 with `parseInt(...) || 0` -- good
- **No remaining tasks:** "Keep Going" button should change text or hide
- **First session ever:** Should show extra celebration ("Your very first session!")

#### Animation Specifications
- Mascot: `ZoomIn.duration(500)` (exists)
- Title/subtitle: `FadeInDown.delay(200).duration(400)` (exists)
- Stats card: `FadeInDown.delay(300).duration(400)` (exists)
- Progress bar: `withDelay(400, withTiming(roomProgress, { duration: 800, easing: Easing.out }))` (exists)
- Count-up stats: JS interval with ease-out cubic, 16ms interval, 800ms duration (proposed)

#### Accessibility
- Good overall. Missing: announce total XP earned for screen readers.
- CTA buttons have adequate size (52pt height) -- good

---

## 5. ROOM COMPLETE

### ROOM COMPLETE
**File:** `app/room-complete.tsx`
**Current Lines:** 546
**Current Rating:** 7.5/10
**Target Rating:** 9.5/10

#### Current State Analysis
- Confetti animation with repeating colored squares
- Mascot celebrating
- Stats row with animated XP counter
- Before/after photo comparison (side by side)
- "Take a progress photo" prompt if no after photo
- Share progress button
- Completed tasks list
- Scan again option

**Issues:**
- Confetti animation is basic (falling squares) -- should be more varied (shapes, sizes, rotation)
- Before/after photos are side-by-side but not interactive -- no slider comparison
- XP counter animation uses JS interval instead of Reanimated
- No level-up detection
- Share only generates text, not an image card
- No screenshot generation for shareable content
- Confetti renders 20 pieces with individual components -- not performant

#### Improvement Details

1. **Before/After photo slider** -- Interactive slider that wipes between before and after photos. Major "wow" factor.

2. **Enhanced confetti** -- Use varied shapes (circles, squares, triangles), random sizes, spin, wind effect. Consider `react-native-confetti-cannon` or custom Skia-based confetti.

3. **Level-up celebration** -- Detect if XP crossed level boundary, show level-up animation with new level number.

4. **Shareable progress card** -- Generate a card image with before/after, stats, and branding. Use `react-native-view-shot`.

5. **Badge unlock notification** -- Check if any badges were earned during this room completion.

6. **Motivational message rotation** -- Different celebration messages based on task count, time spent, room type.

7. **Room history timeline** -- Show mini timeline of when this room was scanned, sessions completed, and now finished.

#### Code Examples

##### 1. Before/After Photo Slider
```tsx
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  clamp,
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import { View, StyleSheet, useWindowDimensions } from 'react-native';

function BeforeAfterSlider({
  beforeUri,
  afterUri,
  height = 200,
}: {
  beforeUri: string;
  afterUri: string;
  height?: number;
}) {
  const { width: screenWidth } = useWindowDimensions();
  const sliderWidth = screenWidth - 48; // 24px padding each side
  const sliderPosition = useSharedValue(sliderWidth / 2);

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      sliderPosition.value = clamp(
        sliderPosition.value + e.changeX,
        20,
        sliderWidth - 20,
      );
    });

  const beforeClipStyle = useAnimatedStyle(() => ({
    width: sliderPosition.value,
  }));

  const sliderHandleStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: sliderPosition.value - 16 }],
  }));

  return (
    <View style={{ width: sliderWidth, height, borderRadius: 14, overflow: 'hidden' }}>
      {/* After photo (full width, behind) */}
      <Image
        source={{ uri: afterUri }}
        style={[StyleSheet.absoluteFillObject]}
        contentFit="cover"
      />

      {/* Before photo (clipped to slider position) */}
      <Animated.View style={[StyleSheet.absoluteFillObject, beforeClipStyle, { overflow: 'hidden' }]}>
        <Image
          source={{ uri: beforeUri }}
          style={{ width: sliderWidth, height }}
          contentFit="cover"
        />
      </Animated.View>

      {/* Slider handle */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[{
          position: 'absolute',
          top: 0,
          bottom: 0,
          width: 32,
          alignItems: 'center',
          justifyContent: 'center',
        }, sliderHandleStyle]}>
          <View style={{
            width: 3,
            height: '100%',
            backgroundColor: '#FFFFFF',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.5,
            shadowRadius: 4,
          }} />
          <View style={{
            position: 'absolute',
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: '#FFFFFF',
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
          }}>
            <Text style={{ fontSize: 12, color: '#333' }}>{'<>'}</Text>
          </View>
        </Animated.View>
      </GestureDetector>

      {/* Labels */}
      <View style={{
        position: 'absolute', top: 8, left: 8,
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
      }}>
        <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '700' }}>Before</Text>
      </View>
      <View style={{
        position: 'absolute', top: 8, right: 8,
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
      }}>
        <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '700' }}>After</Text>
      </View>
    </View>
  );
}
```

##### 2. Enhanced confetti with variety
```tsx
const CONFETTI_SHAPES = ['square', 'circle', 'strip'] as const;
type ConfettiShape = typeof CONFETTI_SHAPES[number];

function ConfettiPiece({
  color,
  delay,
  x,
  shape,
  size,
}: {
  color: string;
  delay: number;
  x: number;
  shape: ConfettiShape;
  size: number;
}) {
  const translateY = useSharedValue(-30);
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    // Wind drift
    translateX.value = withRepeat(
      withSequence(
        withTiming(Math.random() * 40 - 20, { duration: 800 }),
        withTiming(Math.random() * 40 - 20, { duration: 800 }),
      ),
      3,
    );
    // Fall
    translateY.value = withRepeat(
      withSequence(
        withTiming(500, { duration: 2500 + delay * 400, easing: Easing.in(Easing.quad) }),
        withTiming(-30, { duration: 0 }),
      ),
      2,
    );
    // Spin
    rotate.value = withRepeat(
      withTiming(360 * (Math.random() > 0.5 ? 1 : -1), { duration: 1200 + delay * 200 }),
      4,
    );
    opacity.value = withDelay(4500, withTiming(0, { duration: 800 }));
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  const shapeStyle = shape === 'circle'
    ? { width: size, height: size, borderRadius: size / 2 }
    : shape === 'strip'
      ? { width: size * 0.4, height: size * 1.5, borderRadius: 2 }
      : { width: size, height: size, borderRadius: 2 };

  return (
    <Animated.View
      style={[{
        position: 'absolute', top: -10, left: x,
        backgroundColor: color, ...shapeStyle,
      }, style]}
    />
  );
}

// Generate pieces:
const confettiPieces = useMemo(() => {
  return Array.from({ length: 30 }).map((_, i) => ({
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    delay: Math.random() * 3,
    x: Math.random() * 340 + 10,
    shape: CONFETTI_SHAPES[i % CONFETTI_SHAPES.length],
    size: 6 + Math.random() * 6,
  }));
}, []);
```

#### Edge Cases & States
- **No before photo:** Side-by-side section is hidden -- good
- **No after photo:** Shows camera CTA to take one -- good
- **Room not found in state:** Renders with defaults -- acceptable
- **Zero tasks (edge case):** XP animation still triggers with 0 -- should check
- **Share fails:** Empty catch block -- should show toast

#### Animation Specifications
- Confetti: varied fall speed 2000-3500ms, wind drift +/-20px, rotation 360deg in 1200-1600ms
- XP counter: JS interval 16ms, ease-out cubic, 1200ms total (exists)
- XP badge pulse: `withDelay(1200, withSequence(withSpring(1.2), withSpring(1)))` (exists)
- Mascot: `ZoomIn.duration(600)` (exists)

#### Accessibility
- Missing: announce "Room complete! You earned X XP" for screen readers
- Share button has accessibility -- good
- Before/after slider needs VoiceOver alternative (static side-by-side with labels)

---

## 6. FOCUS MODE

### FOCUS MODE
**File:** `app/focus.tsx`
**Current Lines:** 761
**Current Rating:** 7/10
**Target Rating:** 9/10

#### Current State Analysis
- Pomodoro timer with SVG ring (same issue as blitz -- not smoothly animated)
- Four presets (5/15/25/45 min) with descriptions and ADHD-relevant hints
- Pro-only gating with upgrade prompt
- Pulse animation when running
- Break reminder at preset intervals
- Session context showing active room
- Auto-pause on background
- XP awarded on completion

**Issues:**
- Ring animation stutters (same SVG issue as blitz)
- Break reminder is only shown once, should be recurring for long sessions
- No session history display
- No ambient sound options (white noise, lo-fi)
- Completion state is too minimal -- just emoji and XP text
- No connection to room tasks -- timer runs independently
- No Pomodoro session count tracking across app sessions
- Custom duration is not supported (only presets)

#### Improvement Details

1. **Custom duration input** -- Long-press on a preset to edit, or add a "Custom" option with a wheel/slider.

2. **Ambient sound integration** -- Rain, cafe, forest sounds during focus. Toggle in the tips section.

3. **Session history** -- Show recent focus sessions: when, duration, associated room.

4. **Connect to room tasks** -- Show current room's next task during focus, with "Done" button to mark it complete.

5. **Recurring break reminders** -- For sessions >25 min, remind at every 25-min interval, not just once.

6. **Completion celebration** -- Show confetti or mascot animation on timer complete, not just emoji.

7. **Background notification** -- Schedule a local notification for when the timer would expire, in case user leaves the app.

8. **Daily focus goal** -- Track total focus minutes today, show progress toward daily goal.

#### Code Examples

##### 1. Custom duration picker
```tsx
const [showCustomPicker, setShowCustomPicker] = useState(false);
const [customMinutes, setCustomMinutes] = useState(20);

// Add to presets row:
<Pressable
  onPress={() => {
    if (isRunning) return;
    setShowCustomPicker(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }}
  disabled={isRunning}
  accessibilityRole="button"
  accessibilityLabel="Set custom duration"
>
  <View style={[styles.presetChip, {
    backgroundColor: selectedPreset === -1
      ? V1.coral
      : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'),
    opacity: isRunning ? 0.4 : 1,
  }]}>
    <Text style={styles.presetEmoji}>{'\\u2699\\uFE0F'}</Text>
    <Text style={[styles.presetLabel, {
      color: selectedPreset === -1 ? '#FFFFFF' : t.text,
    }]}>
      Custom
    </Text>
  </View>
</Pressable>

// Custom picker modal:
{showCustomPicker && (
  <View style={{
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: isDark ? V1.dark.card : '#FFFFFF',
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 24, paddingBottom: insets.bottom + 24,
    zIndex: 100,
  }}>
    <Text style={{
      fontFamily: DISPLAY_FONT, fontSize: 18, fontWeight: '700',
      color: t.text, textAlign: 'center', marginBottom: 20,
    }}>
      Set Timer
    </Text>
    <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 20 }}>
      <Pressable
        onPress={() => setCustomMinutes(m => Math.max(1, m - 5))}
        style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', alignItems: 'center', justifyContent: 'center' }}
      >
        <Text style={{ fontSize: 24, color: t.text }}>-</Text>
      </Pressable>
      <Text style={{
        fontFamily: DISPLAY_FONT, fontSize: 48, fontWeight: '200',
        color: t.text, minWidth: 80, textAlign: 'center',
      }}>
        {customMinutes}
      </Text>
      <Pressable
        onPress={() => setCustomMinutes(m => Math.min(120, m + 5))}
        style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', alignItems: 'center', justifyContent: 'center' }}
      >
        <Text style={{ fontSize: 24, color: t.text }}>+</Text>
      </Pressable>
    </View>
    <Text style={{
      fontFamily: BODY_FONT, fontSize: 14, color: t.textSecondary,
      textAlign: 'center', marginTop: 8, marginBottom: 20,
    }}>
      minutes
    </Text>
    <Pressable
      onPress={() => {
        setSelectedPreset(-1);
        setTotalSeconds(customMinutes * 60);
        setRemainingSeconds(customMinutes * 60);
        setIsComplete(false);
        setShowCustomPicker(false);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }}
      style={{ backgroundColor: V1.coral, paddingVertical: 16, borderRadius: 16, alignItems: 'center' }}
    >
      <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700', fontFamily: BODY_FONT }}>
        Set Timer
      </Text>
    </Pressable>
  </View>
)}
```

##### 2. Task completion during focus
```tsx
// In session context section, add task display:
{activeRoom && activeRoom.tasks && (() => {
  const nextTask = activeRoom.tasks.find(tk => !tk.completed);
  if (!nextTask) return null;
  return (
    <View style={{ marginTop: 8 }}>
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 10,
        paddingVertical: 10, paddingHorizontal: 12,
        borderRadius: 10,
        backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
      }}>
        <Pressable
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            toggleTask(activeRoom.id, nextTask.id);
          }}
          style={{
            width: 28, height: 28, borderRadius: 14,
            borderWidth: 2, borderColor: V1.green,
            alignItems: 'center', justifyContent: 'center',
          }}
          accessibilityRole="checkbox"
          accessibilityLabel={`Complete task: ${nextTask.title}`}
        >
          {/* Empty circle -- tap to complete */}
        </Pressable>
        <Text style={{
          fontFamily: BODY_FONT, fontSize: 14, color: t.text, flex: 1,
        }} numberOfLines={1}>
          {nextTask.title}
        </Text>
        <Text style={{
          fontFamily: BODY_FONT, fontSize: 12, color: t.textMuted,
        }}>
          {nextTask.estimatedMinutes}m
        </Text>
      </View>
    </View>
  );
})()}
```

#### Edge Cases & States
- **Not Pro:** Shows upgrade prompt -- good, well-designed
- **No active room:** Timer works standalone with generic context -- good
- **App backgrounded:** Timer pauses -- good
- **Timer complete:** Shows emoji and XP -- functional but could be more celebratory
- **Multiple sessions:** Session count badge shows -- good

#### Animation Specifications
- Ring pulse: `withTiming(1.02, { duration: 1000 })` / `withTiming(1, { duration: 1000 })` (exists)
- Ring progress: Should use `useAnimatedProps` on SVG circle (proposed)
- Preset selection: Should add `withSpring` scale feedback on press
- Completion: Should add `ZoomIn` on the completion emoji

#### Accessibility
- Close button: has role and label -- good
- Preset chips: have role, label, and selected state -- excellent
- Timer: has `accessibilityLabel` with progress -- good
- Missing: announce time remaining periodically for screen readers
- Missing: announce break reminders for VoiceOver users

---

## 7. SINGLE TASK

### SINGLE TASK
**File:** `app/single-task.tsx`
**Current Lines:** 567
**Current Rating:** 6.5/10
**Target Rating:** 8.5/10

#### Current State Analysis
- Single-task focus view used during blitz mode
- Shows one task at a time with phase info, timer, steps, mental benefit, and Dusty tip
- Phase progress bars at top
- Big check button at bottom
- Skip option
- Timer badge showing remaining time

**Issues:**
- Timer doesn't pause when screen loses focus
- No app state handling (no auto-pause on background)
- Phase bars only show first 5 tasks -- what if there are 20?
- No swipe gesture for completion (only tap)
- No "undo" after completing a task
- No subtask progress tracking (subtasks shown but can't be individually toggled)
- The "done" state is too minimal
- No connection back to blitz mode timer
- Encouragement messages are static

#### Improvement Details

1. **Add app state handling** -- Pause timer on background, same as blitz.tsx pattern.

2. **Swipe-to-complete gesture** -- Swipe right on the task card to complete. More satisfying than tapping.

3. **Subtask toggle support** -- Let users check off individual subtasks. Use `toggleSubTask` from DeclutterContext.

4. **Undo last completion** -- 4-second undo toast after completing a task, same as room detail.

5. **Adaptive encouragement** -- Vary messages based on completion ratio and speed. Use more ADHD-friendly copy.

6. **Progress ring** -- Replace phase bars with a mini progress ring showing overall completion.

7. **Auto-advance animation** -- When task completes, animate the card sliding left and new card sliding in from right.

8. **Task difficulty feedback** -- After completing, quick "Was this easier or harder than expected?" for AI training.

#### Code Examples

##### 1. App state handling
```tsx
import { AppState, AppStateStatus } from 'react-native';

// Add to component:
const isRunningRef = useRef(true);

useEffect(() => {
  const handleAppState = (nextState: AppStateStatus) => {
    if (nextState === 'background' || nextState === 'inactive') {
      // Pause timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    } else if (nextState === 'active') {
      // Resume timer
      if (!timerRef.current) {
        timerRef.current = setInterval(() => {
          setSecondsLeft((prev) => {
            if (prev <= 1) {
              if (timerRef.current) clearInterval(timerRef.current);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    }
  };

  const sub = AppState.addEventListener('change', handleAppState);
  return () => sub.remove();
}, []);
```

##### 2. Swipe-to-complete gesture
```tsx
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolateColor,
} from 'react-native-reanimated';

// Inside component:
const swipeX = useSharedValue(0);
const COMPLETE_THRESHOLD = 120;

const swipeGesture = Gesture.Pan()
  .activeOffsetX([10, 10])
  .failOffsetY([-10, 10])
  .onUpdate((e) => {
    swipeX.value = Math.max(0, e.translationX);
  })
  .onEnd(() => {
    if (swipeX.value >= COMPLETE_THRESHOLD) {
      runOnJS(handleComplete)();
      swipeX.value = withTiming(400, { duration: 200 });
    } else {
      swipeX.value = withSpring(0, { damping: 20 });
    }
  });

const swipeStyle = useAnimatedStyle(() => ({
  transform: [{ translateX: swipeX.value }],
}));

const checkRevealStyle = useAnimatedStyle(() => {
  const progress = Math.min(swipeX.value / COMPLETE_THRESHOLD, 1);
  return {
    opacity: progress,
    transform: [{ scale: 0.5 + progress * 0.5 }],
  };
});

// Render:
<View style={{ position: 'relative', overflow: 'hidden' }}>
  {/* Green background revealed on swipe */}
  <Animated.View style={[{
    position: 'absolute', left: 0, top: 0, bottom: 0,
    width: COMPLETE_THRESHOLD, backgroundColor: V1.green,
    borderRadius: 16, alignItems: 'center', justifyContent: 'center',
  }, checkRevealStyle]}>
    <CheckCircle size={32} color="#FFFFFF" />
  </Animated.View>

  <GestureDetector gesture={swipeGesture}>
    <Animated.View style={[styles.taskCenter, swipeStyle]}>
      {/* ...existing task content... */}
    </Animated.View>
  </GestureDetector>
</View>
```

#### Edge Cases & States
- **No tasks:** Shows "All done!" with back button -- functional but plain. Add celebration mascot.
- **Timer expires:** Just hits 0 and stays -- should navigate to session-complete.
- **Last task:** Navigates to session-complete -- good
- **All skipped:** If user skips all tasks, returns with 0 completions -- should still celebrate the attempt.
- **Offline:** No specific handling needed -- all local state.

#### Accessibility
- Check button: has role and label -- good
- Close button: has hitSlop but no role -- add `accessibilityRole="button"`
- Missing: announce task changes when navigating between tasks
- Skip text is small -- add larger `hitSlop={16}`

---

## 8. TODAY TASKS

### TODAY TASKS
**File:** `app/today-tasks.tsx`
**Current Lines:** 475
**Current Rating:** 6/10
**Target Rating:** 8.5/10

#### Current State Analysis
- Cross-room daily task list grouped by room
- Summary badges (total tasks, time, rooms)
- Room sections with freshness labels
- Task rows with priority dots, checkboxes, and time estimates
- Floating "Start 15-Min Blitz" CTA
- Pull-to-refresh (fake)

**Issues:**
- Does NOT use the `useTodaysTasks` hook at all -- it manually groups all incomplete tasks by room
- This means no curated daily list, no quick wins prioritization, no "One Tiny Thing"
- No task completion celebration/animation
- No sorting within rooms (tasks are in whatever order they come)
- Task press navigates to task-detail which may not exist as a route
- No progress tracking through the day
- Empty state is plain
- Blitz CTA doesn't pass any context

#### Improvement Details

1. **Use `useTodaysTasks` hook** -- The hook exists and curates 5-7 tasks intelligently. USE IT.

2. **Daily progress tracker** -- Show "3 of 7 today's tasks done" progress bar at top.

3. **Task completion animation** -- Check marks should animate, XP float should appear.

4. **Celebrate daily completion** -- When all today's tasks are done, show celebration screen.

5. **Task source badges** -- Show why each task was selected: "Most urgent room", "Quick win", "One Tiny Thing".

6. **Drag to reorder** -- Let users prioritize their daily list.

7. **Time-of-day awareness** -- Morning tasks first, evening tasks later. Adapt based on current time.

8. **Blitz CTA with context** -- Pass the curated task IDs to blitz mode so it works on today's tasks specifically.

#### Code Examples

##### 1. Integrate useTodaysTasks
```tsx
import { useTodaysTasks, TodayTask } from '@/hooks/useTodaysTasks';

// Inside component:
const todaysTasks = useTodaysTasks(rooms);
const completedToday = todaysTasks.filter(t => t.completed).length;
const totalToday = todaysTasks.length;
const todayProgress = totalToday > 0 ? (completedToday / totalToday) * 100 : 0;

// Daily progress bar:
<Animated.View entering={enter(20)} style={{ marginBottom: 8 }}>
  <View style={{
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginBottom: 8,
  }}>
    <Text style={{
      fontFamily: DISPLAY_FONT, fontSize: 15, fontWeight: '700', color: t.text,
    }}>
      {completedToday} of {totalToday} done
    </Text>
    <View style={{ flex: 1 }} />
    <Text style={{
      fontFamily: BODY_FONT, fontSize: 12, color: V1.green, fontWeight: '600',
    }}>
      {Math.round(todayProgress)}%
    </Text>
  </View>
  <View style={{
    height: 6, borderRadius: 3,
    backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
  }}>
    <View style={{
      height: 6, borderRadius: 3,
      width: `${Math.max(todayProgress, 3)}%`,
      backgroundColor: todayProgress >= 100 ? V1.green : V1.coral,
    }} />
  </View>
</Animated.View>
```

##### 2. Task source badges
```tsx
function SourceBadge({ source }: { source: TodayTask['source'] }) {
  const config = {
    'freshness': { label: 'Priority', color: V1.coral, emoji: '🔥' },
    'quick-win': { label: 'Quick Win', color: V1.green, emoji: '⚡' },
    'tiny-thing': { label: 'Tiny Thing', color: V1.blue, emoji: '✨' },
  }[source];

  return (
    <View style={{
      backgroundColor: `${config.color}18`,
      paddingHorizontal: 6, paddingVertical: 2,
      borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 3,
    }}>
      <Text style={{ fontSize: 10 }}>{config.emoji}</Text>
      <Text style={{
        fontSize: 10, fontWeight: '700', color: config.color,
        letterSpacing: 0.3,
      }}>
        {config.label.toUpperCase()}
      </Text>
    </View>
  );
}
```

##### 3. Daily completion celebration
```tsx
// When all tasks done:
{completedToday >= totalToday && totalToday > 0 && (
  <Animated.View entering={enter(100)} style={{
    alignItems: 'center', paddingVertical: 40, gap: 12,
  }}>
    <Text style={{ fontSize: 48 }}>{'\\u2728'}</Text>
    <Text style={{
      fontFamily: DISPLAY_FONT, fontSize: 22, fontWeight: '700',
      color: t.text, textAlign: 'center',
    }}>
      All done for today!
    </Text>
    <Text style={{
      fontFamily: BODY_FONT, fontSize: 14, color: t.textSecondary,
      textAlign: 'center', lineHeight: 20,
    }}>
      You completed all {totalToday} tasks. Your space thanks you.
    </Text>
  </Animated.View>
)}
```

#### Edge Cases & States
- **Empty state:** Current "No tasks for today" is too plain. Show mascot + "All caught up!" with scan CTA.
- **All completed:** No celebration -- add one (above).
- **No rooms:** Should redirect to rooms tab or camera.
- **Task from deleted room:** Could crash if room reference is stale. Guard with null checks.

#### Accessibility
- Task rows have role and label -- good
- Back button has role and label -- good
- Missing: daily progress should be announced to screen readers
- Floating CTA needs `accessibilityLabel` with context

---

## 9. SHARED COMPONENTS

### TaskCard Component
**File:** `components/room/TaskCard.tsx`
**Current Lines:** 830
**Current Rating:** 7/10
**Target Rating:** 9/10

**Improvements:**
1. AnimatedCheckbox celebration burst -- add particle effect on completion
2. Swipe-to-complete in addition to swipe-to-delete
3. Task card height animation on expand/collapse
4. Haptic feedback on subtask completion
5. Memoize with `React.memo` -- currently re-renders on every parent render

### SessionCheckIn Component
**File:** `components/room/SessionCheckIn.tsx`
**Current Lines:** 402
**Current Rating:** 7.5/10
**Target Rating:** 9/10

**Improvements:**
1. Remember last selections -- pre-fill from previous session
2. Animate between steps with horizontal swipe
3. Add "I don't know" option for energy (maps to moderate)
4. Keyboard dismiss on tap outside
5. Progress should be 3 animated dots, not static

### DoomPileCard Component
**File:** `components/room/DoomPileCard.tsx`
**Current Lines:** 248
**Current Rating:** 7/10
**Target Rating:** 8.5/10

**Improvements:**
1. Collapsible -- should be dismissible with animation
2. Progress tracking -- show how many linked tasks are done
3. "I dealt with this" button that marks all linked tasks complete
4. Anxiety level should have accessible alternative to color (text label exists -- good)

---

## 10. CROSS-CUTTING CONCERNS

### Offline Support
All screens lack offline awareness. Implementation plan:
1. Add `useNetworkStatus` hook that wraps `@react-native-community/netinfo`
2. Show subtle "Offline" badge in headers when disconnected
3. Queue mutations (task completions, XP updates) in local storage
4. Sync queue on reconnection with conflict resolution (server wins for stats, client wins for task state)

### Haptic Consistency
Haptic patterns vary across screens. Standardize:
- Task completion: `NotificationFeedbackType.Success`
- Navigation: `ImpactFeedbackStyle.Light`
- Destructive action: `ImpactFeedbackStyle.Medium`
- Celebration: `NotificationFeedbackType.Success` + `ImpactFeedbackStyle.Heavy`
- Selection change: `selectionAsync()`
- Error: `NotificationFeedbackType.Error`

### Timer Consistency
Three different timer implementations exist (blitz.tsx, focus.tsx, single-task.tsx). Extract a shared `useTimer` hook:

```tsx
// hooks/useTimer.ts
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

interface TimerOptions {
  initialSeconds: number;
  autoStart?: boolean;
  pauseOnBackground?: boolean;
  onComplete?: () => void;
  onTick?: (remaining: number) => void;
}

export function useTimer({
  initialSeconds,
  autoStart = false,
  pauseOnBackground = true,
  onComplete,
  onTick,
}: TimerOptions) {
  const [remaining, setRemaining] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(autoStart);
  const [isComplete, setIsComplete] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isRunningRef = useRef(isRunning);
  isRunningRef.current = isRunning;
  const remainingRef = useRef(remaining);
  remainingRef.current = remaining;

  // Timer tick
  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
      return;
    }
    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        const next = prev <= 1 ? 0 : prev - 1;
        return next;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    };
  }, [isRunning]);

  // Completion detection
  useEffect(() => {
    if (isRunning && remaining === 0) {
      setIsRunning(false);
      setIsComplete(true);
      onComplete?.();
    }
  }, [remaining, isRunning]);

  // Tick callback
  useEffect(() => {
    if (isRunning) onTick?.(remaining);
  }, [remaining, isRunning]);

  // Background handling
  useEffect(() => {
    if (!pauseOnBackground) return;
    const handleAppState = (state: AppStateStatus) => {
      if (state === 'background' || state === 'inactive') {
        if (isRunningRef.current) setIsRunning(false);
      }
    };
    const sub = AppState.addEventListener('change', handleAppState);
    return () => sub.remove();
  }, [pauseOnBackground]);

  const start = useCallback(() => { setIsRunning(true); setIsComplete(false); }, []);
  const pause = useCallback(() => setIsRunning(false), []);
  const toggle = useCallback(() => setIsRunning(r => !r), []);
  const reset = useCallback((newSeconds?: number) => {
    setIsRunning(false);
    setIsComplete(false);
    setRemaining(newSeconds ?? initialSeconds);
  }, [initialSeconds]);
  const extend = useCallback((seconds: number) => {
    setRemaining(r => r + seconds);
    setIsComplete(false);
  }, []);

  return {
    remaining,
    isRunning,
    isComplete,
    progress: initialSeconds > 0 ? remaining / initialSeconds : 0,
    elapsed: initialSeconds - remaining,
    start,
    pause,
    toggle,
    reset,
    extend,
  };
}
```

### Design Token Gaps
The design token system is solid but missing:
- Transition durations (fast: 200ms, normal: 350ms, slow: 600ms)
- Haptic patterns (as constants)
- Z-index layers (modal: 100, toast: 50, fab: 40)
- Font sizes scale (xs: 11, sm: 12, md: 14, lg: 16, xl: 20, xxl: 28)

Add to `constants/designTokens.ts`:
```tsx
export const TIMING = {
  fast: 200,
  normal: 350,
  slow: 600,
  spring: { damping: 15, stiffness: 150 },
  springBouncy: { damping: 8, stiffness: 400 },
} as const;

export const Z_INDEX = {
  base: 0,
  card: 1,
  fab: 40,
  toast: 50,
  modal: 100,
  overlay: 200,
} as const;

export const FONT_SIZE = {
  xs: 11,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 20,
  xxl: 28,
  display: 32,
} as const;
```

### Performance Priority Matrix

| Screen | Priority | Est. Hours | Impact |
|--------|----------|------------|--------|
| Room Detail decomposition | P0 | 8h | Maintainability, perf |
| Shared useTimer hook | P0 | 2h | DRY, bug prevention |
| Rooms tab freshness unification | P1 | 2h | Data accuracy |
| Today Tasks -- use useTodaysTasks | P1 | 3h | Feature completeness |
| Blitz smooth timer ring | P1 | 3h | Visual polish |
| Before/After slider | P2 | 4h | Wow factor |
| Session complete count animations | P2 | 2h | Celebration feel |
| Offline support | P2 | 8h | Reliability |
| Custom focus duration | P2 | 2h | User flexibility |
| Skip reason capture | P3 | 2h | AI training data |
| Drag-to-reorder tasks | P3 | 6h | Power user feature |
| Ambient sounds | P3 | 4h | Focus enhancement |
| Shareable progress card | P3 | 4h | Growth/viral |

**Total estimated effort: ~50 hours**

---

# PART 4: ENGAGEMENT, SOCIAL & MONETIZATION SCREENS

> **Area:** Profile, Progress, Mascot, Achievements, Collection, Paywall, Social, Settings, Notifications, Insights, Accountability, Challenge, Join, Delete Account
> **Files:** 14 screen files + 6 backend/hook files
> **Improvements Identified:** 120+

---

# ENGAGEMENT, SOCIAL & MONETIZATION SCREENS -- Comprehensive Improvement Plan

---

## PART 1: PROFILE & PROGRESS

---

### PROFILE TAB
**File:** `app/(tabs)/profile.tsx`
**Current Lines:** 580
**Current Rating:** 6.5/10
**Target Rating:** 9/10

#### Current State Analysis
The Profile screen has a solid foundation: gradient avatar with initial, mascot companion card with happiness/energy/hunger bars, quick stats (streak/rooms/tasks), empty state with CTA, and an upgrade-to-Pro banner. It uses `FadeInDown` entry animations, pull-to-refresh (simulated), and dark/light theming with design tokens.

What works:
- Clean layout, proper use of design tokens
- MascotAvatar component with real PNG images
- Empty state encourages first session
- Pro upgrade card is conditionally hidden

What doesn't:
- Pull-to-refresh is faked (setTimeout, no actual data refetch)
- No league/leaderboard card (the leaderboard system exists but is invisible here)
- No comeback engine integration (returning users see the same static screen)
- No calendar heatmap or weekly activity summary
- No link to achievements, insights, or collection
- Avatar is just an initial letter -- no photo upload support
- Mascot companion section doesn't show adventure timer or customization
- No animated level-up celebration
- No variable reward display (unclaimed rewards)
- Stats are purely numeric with no trend indicators

#### Improvement Details

1. **Real Pull-to-Refresh** -- Wire refresh to `useCurrentUser()` re-query via Convex's reactivity. The fake setTimeout should be replaced with an actual refetch signal.

2. **Weekly Activity Heatmap** -- Add a 7-day activity strip (like Progress screen's WeekView) directly on profile for at-a-glance engagement. ADHD users need visible proof of consistency.

3. **League Badge Card** -- Show current league rank (Bronze/Silver/Gold/Diamond/Champion) with weekly XP and promotion/relegation status. The `useUserLeague()` hook already exists.

4. **Comeback Welcome Banner** -- When `useCheckComebackStatus()` returns `isReturning: true`, show a warm welcome-back card with bonus XP multiplier using `getWelcomeBackMessage()`.

5. **Unclaimed Rewards Indicator** -- When `useUnclaimedRewards()` returns non-empty, show a pulsing notification dot on the profile or a "Claim Rewards" card.

6. **Quick Navigation Cards** -- Add tappable cards for Achievements, Insights, Collection, and Social. Currently these screens are buried in navigation with no easy entry point from Profile.

7. **Avatar Photo Upload** -- Allow users to upload a profile photo via `expo-image-picker`. Store in Convex storage with `useGenerateUploadUrl()`.

8. **Mascot Adventure Timer (Finch-like)** -- Add an 8-hour countdown timer on the companion card. When timer completes and user returns, mascot brings back a collectible reward. This drives re-engagement loops.

9. **Animated Level-Up Celebration** -- When level changes, trigger confetti and a modal celebration using `react-native-reanimated` spring animations.

10. **Streak Freeze Badge** -- Show available streak freezes (from `stats.streakFreezesAvailable`) as a small shield icon next to streak count.

11. **Consistency Score** -- Display the `useConsistencyScore()` hook value as a visual ring or number to give ADHD users a non-streak metric of progress.

12. **Memoize Sub-Components** -- `BarIndicator` renders on every parent re-render. Wrap with `React.memo` for performance.

#### Code Examples

##### League Badge Card
```tsx
import { useUserLeague } from '@/hooks/useConvex';
import { Trophy } from 'lucide-react-native';

function LeagueBadgeCard({ isDark }: { isDark: boolean }) {
  const league = useUserLeague();
  const t = getTheme(isDark);

  if (!league || league.rank === null) return null;

  const leagueColors: Record<string, string> = {
    bronze: '#CD7F32',
    silver: '#C0C0C0',
    gold: '#FFD700',
    diamond: '#B9F2FF',
    champion: '#FF6B6B',
  };

  const color = leagueColors[league.league] ?? V1.amber;

  return (
    <Pressable
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push('/social');
      }}
      accessibilityRole="button"
      accessibilityLabel={`${league.leagueInfo.name} League, rank ${league.rank}`}
      style={({ pressed }) => [{ opacity: pressed ? 0.88 : 1 }]}
    >
      <View style={[cardStyle(isDark), { padding: SPACING.cardPadding, flexDirection: 'row', alignItems: 'center', gap: 14 }]}>
        <View style={{
          width: 44, height: 44, borderRadius: 22,
          backgroundColor: color + '20',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Trophy size={22} color={color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: DISPLAY_FONT, fontSize: 16, fontWeight: '700', color: t.text }}>
            {league.leagueInfo.emoji} {league.leagueInfo.name} League
          </Text>
          <Text style={{ fontFamily: BODY_FONT, fontSize: 12, color: t.textSecondary }}>
            Rank #{league.rank} {'\\u00B7'} {league.xpEarned} XP this week
          </Text>
        </View>
        <ChevronRight size={16} color={t.textMuted} />
      </View>
    </Pressable>
  );
}
```

##### Comeback Welcome Banner
```tsx
import { useCheckComebackStatus } from '@/hooks/useConvex';
import { getWelcomeBackMessage } from '@/services/comebackEngine';

function ComebackBanner({ isDark }: { isDark: boolean }) {
  const comebackStatus = useCheckComebackStatus();
  const t = getTheme(isDark);

  if (!comebackStatus?.isReturning || comebackStatus.daysSinceActivity < 2) return null;

  const { message, submessage, emoji, bonusActive } = getWelcomeBackMessage(comebackStatus.daysSinceActivity);

  return (
    <LinearGradient
      colors={isDark
        ? ['rgba(255,213,79,0.12)', 'rgba(255,183,77,0.06)']
        : ['rgba(255,213,79,0.15)', 'rgba(255,183,77,0.08)']
      }
      style={{
        borderRadius: RADIUS.lg,
        padding: 18,
        borderWidth: 1,
        borderColor: isDark ? 'rgba(255,213,79,0.2)' : 'rgba(255,213,79,0.35)',
        gap: 8,
      }}
    >
      <Text style={{ fontSize: 28, textAlign: 'center' }}>{emoji}</Text>
      <Text style={{
        fontFamily: DISPLAY_FONT, fontSize: 18, fontWeight: '700',
        color: t.text, textAlign: 'center',
      }}>
        {message}
      </Text>
      <Text style={{
        fontFamily: BODY_FONT, fontSize: 14, color: t.textSecondary, textAlign: 'center',
      }}>
        {submessage}
      </Text>
      {bonusActive && (
        <View style={{
          backgroundColor: V1.gold + '20',
          borderRadius: RADIUS.sm,
          paddingVertical: 6, paddingHorizontal: 12,
          alignSelf: 'center', marginTop: 4,
        }}>
          <Text style={{
            fontFamily: BODY_FONT, fontSize: 12, fontWeight: '700',
            color: V1.gold, textAlign: 'center',
          }}>
            {comebackStatus.comebackBonusXP > 0
              ? `+${comebackStatus.comebackBonusXP} bonus XP active`
              : 'Comeback bonus active'}
          </Text>
        </View>
      )}
    </LinearGradient>
  );
}
```

##### Mascot Adventure Timer
```tsx
import { useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ADVENTURE_KEY = '@declutterly_adventure_end';
const ADVENTURE_DURATION_MS = 8 * 60 * 60 * 1000; // 8 hours

function MascotAdventureTimer({ isDark, mascotName }: { isDark: boolean; mascotName: string }) {
  const t = getTheme(isDark);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [remaining, setRemaining] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(ADVENTURE_KEY).then((val) => {
      if (val) {
        const end = parseInt(val, 10);
        if (end > Date.now()) {
          setEndTime(end);
        } else {
          setIsReady(true);
        }
      }
    });
  }, []);

  useEffect(() => {
    if (!endTime) return;
    const interval = setInterval(() => {
      const diff = endTime - Date.now();
      if (diff <= 0) {
        setIsReady(true);
        setEndTime(null);
        clearInterval(interval);
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setRemaining(`${h}h ${m}m`);
    }, 30000);
    return () => clearInterval(interval);
  }, [endTime]);

  const startAdventure = useCallback(async () => {
    const end = Date.now() + ADVENTURE_DURATION_MS;
    await AsyncStorage.setItem(ADVENTURE_KEY, String(end));
    setEndTime(end);
    setIsReady(false);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  if (isReady) {
    return (
      <Pressable
        onPress={startAdventure}
        accessibilityRole="button"
        accessibilityLabel={`${mascotName} returned from adventure. Tap to claim reward and send on another.`}
        style={({ pressed }) => [{
          backgroundColor: V1.gold + '15',
          borderRadius: RADIUS.md, padding: 12,
          borderWidth: 1, borderColor: V1.gold + '30',
          opacity: pressed ? 0.85 : 1,
        }]}
      >
        <Text style={{ fontFamily: BODY_FONT, fontSize: 13, fontWeight: '600', color: V1.gold, textAlign: 'center' }}>
          {mascotName} is back! Tap to claim reward
        </Text>
      </Pressable>
    );
  }

  if (remaining) {
    return (
      <View style={{
        backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
        borderRadius: RADIUS.md, padding: 10,
      }}>
        <Text style={{ fontFamily: BODY_FONT, fontSize: 12, color: t.textSecondary, textAlign: 'center' }}>
          {mascotName} is on an adventure... {remaining} left
        </Text>
      </View>
    );
  }

  return null;
}
```

#### Edge Cases & States
- **Empty state:** Already handled -- shows MascotAvatar with "Your journey starts here" and CTA to camera. Improvement: add the feature preview cards from Progress screen here too.
- **Error state:** No error handling for Convex query failures. Add an ErrorBoundary wrapper and a retry-able error card.
- **Loading state:** No skeleton UI while `useDeclutter()` loads. Add a shimmer placeholder for avatar, stats, and mascot card.
- **First-time user:** Works well. Improvement: the empty stats card should pulse gently to draw attention.
- **Returning user (comeback):** Currently invisible. Add ComebackBanner shown above.
- **Offline:** Convex queries will show stale cache. Add a subtle offline indicator.

#### Animation Specifications
- Entry animations: `FadeInDown.duration(380).delay(N)` with staggered delays (0, 60, 120, 180, 240) -- already implemented
- Level-up: `withSpring({ damping: 12, stiffness: 120 })` on a scale transform from 0.5 to 1.0 for celebration badge
- Comeback banner: `FadeInDown.duration(500).springify()` with damping 14
- Unclaimed rewards dot: `withRepeat(withSequence(withTiming(1.2, {duration: 400}), withTiming(1.0, {duration: 400})), -1)` on scale

#### Accessibility
- Settings button: `accessibilityRole="button"` and `accessibilityLabel="Open settings"` -- already present
- Companion card: `accessibilityLabel` includes mascot name -- already present
- Quick stat cards: Missing `accessibilityLabel`. Add: `accessibilityLabel={`${streak} day streak`}` etc.
- League card: Add `accessibilityLabel` with rank and league name
- Touch targets: All buttons are 44pt minimum -- good
- Color contrast: V1.coral (#FF6B6B) on dark bg (#0C0C0C) = 5.2:1 ratio -- passes AA

#### Performance Notes
- `BarIndicator` should be wrapped in `React.memo` -- it takes simple props and renders frequently
- `getLevelTitle` is called on every render -- memoize with `useMemo`
- The rooms array filter for `roomsDone` is O(n*m) -- memoize with `useMemo`
- Consider using `useCallback` for `handleRefresh` with actual Convex invalidation

---

### PROGRESS TAB
**File:** `app/(tabs)/progress.tsx`
**Current Lines:** 643
**Current Rating:** 6/10
**Target Rating:** 9/10

#### Current State Analysis
Shows a Monday-first week view with day circles (completed/today/missed/future), streak card with progress bar, 2x2 stats grid (rooms, tasks, time, completion %), motivation card, and a thoughtful empty state with feature previews.

What works:
- Week view correctly uses Monday-first ordering
- Empty state shows feature previews instead of sad zeroes
- Motivation card with coral gradient
- Proper dark/light theming

What doesn't:
- `activeDays` computation scans ALL rooms and tasks on every render -- O(n*m) with no memoization for the dependency
- Motivation message is static/hardcoded, not from AI or comeback engine
- No link to Insights screen
- No "View Achievements" or "View Collection" entry points
- No calendar heatmap (just the current week)
- `bestThisMonth` calculation uses `Math.max(longestStreak, streak, 7)` which means the bar never shows less than 7 even for new users
- No streak freeze indicator
- No leaderboard teaser
- Pull-to-refresh is faked
- `completionPercent` compares total completed tasks to total available tasks across all rooms, which is misleading if rooms have been deleted

#### Improvement Details

1. **Calendar Heatmap Component** -- Replace the simple week view with a GitHub-style contribution graph showing 12+ weeks of activity. Use `useCalendarData()` hook.

2. **Streak Freeze Shield Display** -- Show available freezes next to streak count. When streak is at risk, show a pulsing shield icon with "Use freeze?" prompt.

3. **AI-Powered Motivation Messages** -- Use `useGetMotivation()` action to fetch personalized messages based on recent activity patterns. Cache locally with `AsyncStorage`.

4. **Quick Navigation Strip** -- Add horizontal scroll of cards: "Achievements (3/17)", "Collection (12/20)", "Insights", "Leaderboard (Rank #5)".

5. **Weekly Comparison** -- Show "vs last week" delta on stats (e.g., "+3 tasks", "+15 min"). The insights computation already calculates period comparisons.

6. **Animated Stat Counters** -- Use `react-native-reanimated` `withTiming` to animate stat numbers from 0 to their current value on screen entry.

7. **Grace Period Badge** -- When user is in the 48-hour grace period, show `formatGracePeriodBadge()` as a reassuring indicator.

8. **Real Pull-to-Refresh** -- Same as Profile -- wire to actual data invalidation.

9. **Streak Calendar (Past Weeks)** -- Show the last 4 weeks of streak data, not just the current week. Use the `useWeeklyActivity()` hook.

10. **Session Length Trend** -- Small spark-line chart showing average session length over the past 2 weeks.

#### Code Examples

##### Animated Stat Counter
```tsx
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { TextInput } from 'react-native';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

function AnimatedStatBox({
  isDark,
  value,
  label,
  color,
}: {
  isDark: boolean;
  value: number;
  label: string;
  color: string;
}) {
  const t = getTheme(isDark);
  const animatedValue = useSharedValue(0);

  useEffect(() => {
    animatedValue.value = withTiming(value, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });
  }, [value]);

  const animatedProps = useAnimatedProps(() => ({
    text: String(Math.round(animatedValue.value)),
  }));

  return (
    <View style={[styles.statBox, cardStyle(isDark)]}>
      <AnimatedTextInput
        underlineColorAndroid="transparent"
        editable={false}
        animatedProps={animatedProps}
        style={[styles.statValue, { color }]}
        accessibilityLabel={`${label}: ${value}`}
      />
      <Text style={[styles.statLabel, { color: t.textSecondary }]}>{label}</Text>
    </View>
  );
}
```

##### Quick Navigation Strip
```tsx
import { useCollectionStats, useBadges, useUserLeague } from '@/hooks/useConvex';
import { Award, Gem, BarChart3, Trophy } from 'lucide-react-native';

function QuickNavStrip({ isDark }: { isDark: boolean }) {
  const t = getTheme(isDark);
  const badges = useBadges();
  const collectionStats = useCollectionStats();
  const league = useUserLeague();

  const items = [
    {
      icon: Award,
      label: 'Achievements',
      subtitle: `${badges?.length ?? 0}/${17} earned`,
      color: V1.amber,
      onPress: () => router.push('/achievements'),
    },
    {
      icon: Gem,
      label: 'Collection',
      subtitle: `${collectionStats?.uniqueCollected ?? 0} found`,
      color: V1.indigo,
      onPress: () => router.push('/collection'),
    },
    {
      icon: BarChart3,
      label: 'Insights',
      subtitle: 'View trends',
      color: V1.blue,
      onPress: () => router.push('/insights'),
    },
    {
      icon: Trophy,
      label: 'League',
      subtitle: league ? `${league.leagueInfo?.emoji} #${league.rank ?? '-'}` : 'Join',
      color: V1.gold,
      onPress: () => router.push('/social'),
    },
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 10, paddingHorizontal: 2 }}
    >
      {items.map((item) => (
        <Pressable
          key={item.label}
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            item.onPress();
          }}
          accessibilityRole="button"
          accessibilityLabel={`${item.label}: ${item.subtitle}`}
          style={({ pressed }) => [{
            ...cardStyle(isDark),
            padding: 12,
            width: 120,
            gap: 6,
            opacity: pressed ? 0.85 : 1,
          }]}
        >
          {React.createElement(item.icon, { size: 18, color: item.color })}
          <Text style={{ fontFamily: BODY_FONT, fontSize: 13, fontWeight: '600', color: t.text }}>
            {item.label}
          </Text>
          <Text style={{ fontFamily: BODY_FONT, fontSize: 11, color: t.textSecondary }}>
            {item.subtitle}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}
```

#### Edge Cases & States
- **Empty state:** Well-designed with feature previews. Improvement: animate the feature icons with a gentle pulse.
- **Error state:** No error boundary. Add `ScreenErrorBoundary`.
- **Loading state:** No skeleton. Add shimmer placeholders for week view and stats grid.
- **First-time user:** Empty state CTA correctly routes to camera. Consider showing "Day 0" on the week view instead of all grey.
- **Returning user:** No comeback integration. Show the comeback bonus message above the motivation card.
- **Offline:** Stats from `useDeclutter()` context will be stale. Show a subtle "Offline - showing cached data" banner.

#### Animation Specifications
- Entry: `FadeInDown.duration(380).delay(N)` -- already present
- Week circle completion: `ZoomIn.duration(300).springify()` when a day transitions from missed to completed
- Stat counter: `withTiming` from 0 to final value, 800ms, `Easing.out(Easing.cubic)`
- Streak fire emoji: `withRepeat(withSequence(withTiming(1.05, {duration: 600}), withTiming(1.0, {duration: 600})), -1)` subtle breathe

#### Accessibility
- Week view circles: Missing `accessibilityLabel`. Each circle should announce "Monday: completed" or "Tuesday: today" etc.
- Stats grid: Missing `accessibilityLabel` on stat boxes
- Motivation card: Should have `accessibilityRole="text"` for VoiceOver
- Touch targets: CTA button at 52pt height -- good

#### Performance Notes
- `activeDays` useMemo depends on `[rooms]` which is an array reference that may change on every Convex update. Consider deep comparison or computing from `useWeeklyActivity()` instead.
- `completionPercent` recomputes on every render. Move into the `useMemo` block.
- `motivationMessage` useMemo depends on `[completedTasks]` but the message is generic. When switching to AI messages, add proper caching.

---

## PART 2: MASCOT, ACHIEVEMENTS & COLLECTION

---

### MASCOT SCREEN
**File:** `app/mascot.tsx`
**Current Lines:** 548
**Current Rating:** 5.5/10
**Target Rating:** 9.5/10

#### Current State Analysis
Shows the mascot with stats (level, hunger, energy, happiness), 3 action buttons (Feed, Pet, Clean), about card with personality/mood/tasks/days, and contextual tips.

What works:
- Proper loading and empty state handling
- Action buttons with haptic feedback
- `Mascot` component with interactive press

What doesn't:
- No dress-up/customization system (accessories defined in types but no UI)
- No adventure system (8-hour timer, Finch-like)
- No mood animations (mascot image is static)
- No speech bubbles with personality-driven messages
- Feed/Pet actions have no visual feedback beyond haptics
- No inventory/wardrobe UI for collected accessories
- Stat bar animations are not animated (just static widths)
- No "Dusty's Tips" that adapt to user behavior patterns
- `interactWithMascot` and `feedMascot` are called directly without visual reward display

#### Improvement Details

1. **Mascot Dress-Up System** -- Add a wardrobe panel where users can equip accessories from their collection. Unlock new accessories via achievements and collectibles.

2. **Adventure System (Finch-like)** -- Send mascot on 8-hour adventures. When they return, they bring back collectibles, XP, or accessories. Timer persists in AsyncStorage.

3. **Speech Bubbles** -- Mascot says things based on mood, recent activity, and personality. Messages should use the mascot personality data from `MASCOT_PERSONALITIES`.

4. **Animated Stat Bars** -- Use `react-native-reanimated` `withTiming` to animate bar widths when values change (feeding, petting).

5. **Visual Reward Feedback** -- When tapping Feed or Pet, show floating +XP/+Happiness text that rises and fades out.

6. **Mood-Reactive Background** -- Change the background gradient based on mascot mood (happy = warm, sad = cool, ecstatic = sparkly).

7. **Daily Mascot Diary** -- Show a "Dusty's Journal" section with entries generated from recent user activity (e.g., "Today we cleaned 3 tasks together!").

8. **Customization Store** -- Pro users can access exclusive mascot outfits. Free users earn items through gameplay.

9. **Animated Mascot Transitions** -- When mood changes, crossfade between mascot images using `Image` transition prop.

10. **Personality Quiz Retake** -- Allow users to retake personality quiz from the About section.

#### Code Examples

##### Floating XP Feedback
```tsx
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  runOnJS,
} from 'react-native-reanimated';
import { useState, useCallback } from 'react';

function FloatingFeedback({ children, visible, onDone }: {
  children: React.ReactNode;
  visible: boolean;
  onDone: () => void;
}) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      opacity.value = withSequence(
        withTiming(1, { duration: 150 }),
        withTiming(1, { duration: 500 }),
        withTiming(0, { duration: 300 })
      );
      translateY.value = withTiming(-60, { duration: 950 }, () => {
        runOnJS(onDone)();
      });
    } else {
      opacity.value = 0;
      translateY.value = 0;
    }
  }, [visible]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[{
      position: 'absolute',
      alignSelf: 'center',
      zIndex: 10,
    }, animStyle]}>
      {children}
    </Animated.View>
  );
}

// Usage in mascot screen:
const [feedbackText, setFeedbackText] = useState<string | null>(null);

const handleFeed = () => {
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  feedMascot();
  setFeedbackText('+20 Hunger');
};

// In render:
// <FloatingFeedback visible={!!feedbackText} onDone={() => setFeedbackText(null)}>
//   <Text style={{ color: V1.green, fontWeight: '700', fontSize: 18 }}>{feedbackText}</Text>
// </FloatingFeedback>
```

##### Speech Bubble Component
```tsx
function SpeechBubble({ message, isDark }: { message: string; isDark: boolean }) {
  const t = getTheme(isDark);

  return (
    <Animated.View
      entering={FadeInDown.duration(300).springify()}
      style={{
        backgroundColor: t.card,
        borderRadius: RADIUS.lg,
        borderWidth: 1,
        borderColor: t.border,
        padding: 14,
        marginHorizontal: 32,
        marginTop: 12,
        alignItems: 'center',
        position: 'relative',
      }}
    >
      {/* Tail triangle */}
      <View style={{
        position: 'absolute',
        top: -8,
        width: 16,
        height: 16,
        backgroundColor: t.card,
        borderTopWidth: 1,
        borderLeftWidth: 1,
        borderColor: t.border,
        transform: [{ rotate: '45deg' }],
      }} />
      <Text style={{
        fontFamily: BODY_FONT,
        fontSize: 14,
        lineHeight: 20,
        color: t.text,
        textAlign: 'center',
        fontStyle: 'italic',
      }}>
        "{message}"
      </Text>
    </Animated.View>
  );
}

function getMascotSpeech(
  mood: string,
  personality: string,
  streak: number,
  hunger: number
): string {
  if (hunger < 20) return "I'm so hungry... complete a task to feed me!";
  if (mood === 'sad') return "I miss cleaning together. Wanna do one tiny thing?";
  if (streak >= 7) return "A whole week together! We're unstoppable!";
  if (mood === 'ecstatic') return "I'm SO proud of us! Look how clean everything is!";
  if (personality === 'dusty') return "Slow and steady, friend. Every small step counts.";
  if (personality === 'spark') return "LET'S GO! I can feel the energy today!";
  if (personality === 'bubbles') return "Hehe, cleaning is so much fun with you!";
  return "Hey there! Ready for another adventure?";
}
```

#### Edge Cases & States
- **Empty state (no mascot):** Shows onboarding redirect -- good. Add animation to the empty card.
- **Loading:** Shows ActivityIndicator. Switch to skeleton with mascot silhouette shape.
- **Mascot at 0 hunger/energy:** Should show distressed state with urgent but non-guilt messaging.
- **First visit after onboarding:** Show a "Welcome to Dusty's Home!" tutorial overlay.
- **Returning user after days away:** Mascot should look sleepy with welcome-back speech.
- **Offline:** Feed/Pet actions use Convex mutations which will queue. Show optimistic UI updates.

#### Animation Specifications
- Mascot tap interaction: `withSpring({ damping: 10, stiffness: 200 })` on scale (1.0 -> 0.95 -> 1.05 -> 1.0)
- Stat bar fill: `withTiming(newWidth, { duration: 600, easing: Easing.out(Easing.cubic) })`
- Speech bubble: `FadeInDown.duration(300).springify()` with `damping: 15`
- Floating feedback: translateY from 0 to -60 over 950ms, opacity fade sequence
- Mood change crossfade: `Image` component's `transition={400}` prop (already set to 200, increase)

#### Accessibility
- Action buttons have proper `accessibilityRole`, `accessibilityLabel`, and `accessibilityHint` -- good
- Stat bars: Add `accessibilityLabel` like "Hunger: 50 percent"
- Mascot tap area: Add `accessibilityLabel="Interact with mascot, tap to pet"`
- Speech bubble: Add `accessibilityLiveRegion="polite"` so VoiceOver announces new messages

#### Performance Notes
- `getMoodEmoji` is a pure function -- could be a static map lookup
- `personalityInfo.color + '20'` creates new strings on render -- extract to computed style
- `Date.now() - new Date(mascot.createdAt).getTime()` in render -- memoize "days together" calculation
- `Mascot` component from `@/components/features/Mascot` should use `React.memo`

---

### ACHIEVEMENTS SCREEN
**File:** `app/achievements.tsx`
**Current Lines:** 423
**Current Rating:** 6/10
**Target Rating:** 9/10

#### Current State Analysis
Shows XP level card with gradient bar, streak card (current/best), and a badge grid. Badges show earned (with emoji) or locked (dimmed + progress). Tap to share earned badges.

What works:
- Badge progress calculation is correct
- Share functionality on earned badges
- Proper error boundary wrapper
- Good loading state

What doesn't:
- Badge grid is limited to 8 items (`slice(0, 8)`) -- hides most badges
- No badge rarity system (all badges look the same)
- No animated unlock celebration
- No badge detail modal (just Share on tap)
- No progress toward next badge shown visually (just text "5/7 days")
- No "Recently Unlocked" highlight section
- No milestone predictions ("3 more tasks to unlock Cleaning Machine!")
- `BADGE_CARD_WIDTH` is computed twice (module-level and component-level)

#### Improvement Details

1. **Remove Badge Limit** -- Show all 17+ badges, not just 8. Use sections: "Earned" and "Locked".

2. **Badge Rarity Visual System** -- Color-code badges by type: tasks=green, rooms=blue, streak=amber, time=coral, comeback=gold, sessions=indigo. Add subtle glow for earned badges.

3. **Badge Detail Modal** -- On tap, show a modal with badge name, description, unlock date (if earned), progress bar, and share button. Similar to Collection's item detail modal.

4. **"Next Badge" Prediction Card** -- Show the closest-to-unlock badge with a progress bar and motivational message ("Just 3 more tasks!").

5. **Recently Unlocked Section** -- Badges unlocked in the last 7 days get a "NEW" badge and appear at the top with a shimmer effect.

6. **Animated Badge Unlock** -- When navigating to this screen with a newly-unlocked badge, play a celebration animation.

7. **Progress Ring per Badge** -- Replace text progress ("5/7 days") with a small circular progress indicator.

8. **Badge Categories Tabs** -- Filter badges by type: All, Tasks, Rooms, Streaks, Time, Comeback, Sessions.

#### Code Examples

##### Next Badge Prediction Card
```tsx
function NextBadgeCard({ isDark, stats }: { isDark: boolean; stats: any }) {
  const t = getTheme(isDark);

  const nextBadge = useMemo(() => {
    const unlockedIds = new Set((stats?.badges ?? []).map((b: any) => b.id));
    let closest: { badge: Badge; current: number; remaining: number } | null = null;

    for (const badge of BADGES) {
      if (unlockedIds.has(badge.id)) continue;
      let current = 0;
      switch (badge.type) {
        case 'tasks': current = stats?.totalTasksCompleted ?? 0; break;
        case 'rooms': current = stats?.totalRoomsCleaned ?? 0; break;
        case 'streak': current = Math.max(stats?.currentStreak ?? 0, stats?.longestStreak ?? 0); break;
        case 'time': current = stats?.totalMinutesCleaned ?? 0; break;
        case 'sessions': current = stats?.totalCleaningSessions ?? 0; break;
        default: continue;
      }
      const remaining = badge.requirement - current;
      if (remaining > 0 && (!closest || remaining < closest.remaining)) {
        closest = { badge, current, remaining };
      }
    }
    return closest;
  }, [stats]);

  if (!nextBadge) return null;

  const progress = Math.round((nextBadge.current / nextBadge.badge.requirement) * 100);

  return (
    <View style={[{
      backgroundColor: t.card,
      borderColor: V1.gold + '40',
      borderWidth: 1.5,
      borderRadius: 20,
      padding: 18,
      gap: 10,
    }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{
          width: 48, height: 48, borderRadius: 24,
          backgroundColor: V1.gold + '15',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Text style={{ fontSize: 24 }}>{nextBadge.badge.emoji}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: DISPLAY_FONT, fontSize: 16, fontWeight: '700', color: t.text }}>
            Next: {nextBadge.badge.name}
          </Text>
          <Text style={{ fontFamily: BODY_FONT, fontSize: 13, color: V1.gold }}>
            {nextBadge.remaining} more {nextBadge.badge.type} to go!
          </Text>
        </View>
      </View>
      <View style={{
        height: 8, borderRadius: 4, overflow: 'hidden',
        backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
      }}>
        <LinearGradient
          colors={[V1.gold, V1.amber]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ height: '100%', borderRadius: 4, width: `${Math.max(progress, 4)}%` }}
        />
      </View>
    </View>
  );
}
```

#### Edge Cases & States
- **No badges earned:** Shows placeholder badges -- good but confusing. Instead show "Start cleaning to earn your first badge" with a progress indicator toward "First Step".
- **All badges earned:** Show a congratulatory "Collection Complete!" card.
- **Loading:** ActivityIndicator -- switch to skeleton grid.
- **Offline:** Badges from Convex cache will display. New unlocks won't show until reconnection.

#### Animation Specifications
- Badge grid entry: `ZoomIn.delay(index * 40).duration(300)` for staggered appearance
- New badge shimmer: Use reanimated's `withRepeat(withSequence(withTiming(0.6, {duration: 800}), withTiming(1, {duration: 800})), 3)` on opacity
- Progress bar fill: `withTiming(width, { duration: 700, easing: Easing.out(Easing.cubic) })`
- Unlock celebration: Scale 0 -> 1.2 -> 1.0 with `withSpring({ damping: 8, stiffness: 100 })`

#### Accessibility
- Badge cards have `accessibilityLabel` with earned/locked status -- good
- Missing: progress bar on locked badges should announce current/target
- Badge grid: Add `accessibilityRole="list"` to grid container
- Share action: Already accessible via long-press hint

#### Performance Notes
- `displayBadges` useMemo is correctly memoized
- `getBadgeProgress` useCallback depends on `[stats]` which may reference-change frequently
- `useWindowDimensions` for badge card width is correct but recalculates on rotation -- fine for this use case
- Consider `FlashList` instead of flex-wrap grid for >20 badges

---

### COLLECTION SCREEN
**File:** `app/collection.tsx`
**Current Lines:** 702
**Current Rating:** 7/10
**Target Rating:** 9/10

#### Current State Analysis
Shows stats overview (total, unique, completion %), rarity breakdown dots, category filter tabs, grid of collectibles (4 columns via FlashList), and a detail modal. Owned items glow with rarity colors. Locked items show a lock icon.

What works:
- FlashList for performance
- Category filter with haptic selection
- Detail modal with rarity badge and stats
- Good empty state with tip about streaks

What doesn't:
- No "recently collected" highlight or animation
- Grid items are small with no labels
- Modal has no animation for the emoji (should bounce/spin)
- No collection milestones ("50% complete! Here's a reward")
- Rarity dots in stats card have no labels (just colored dots + numbers)
- No sorting options (by rarity, by date collected, by name)
- Filter tabs don't show count per category
- `canUnlock` function checks total tasks but doesn't communicate how many more needed

#### Improvement Details

1. **Recently Collected Section** -- Show the 3 most recently collected items at the top with a "NEW" badge and golden shimmer.

2. **Category Counts in Filters** -- Show "(3/7)" next to each category label so users see progress per category.

3. **Sorting Options** -- Add sort by: Default, Rarity, Recently Collected, Name.

4. **Collection Milestones** -- When reaching 25%, 50%, 75%, 100% completion, show celebration and unlock a reward.

5. **Improved Modal** -- Add bounce animation for emoji, show "first collected on [date]" for owned items, and a "How to find" hint for unowned items.

6. **Rarity Legend** -- Replace the dots-only rarity breakdown with labeled rows: "Common: 5", "Uncommon: 2", etc.

7. **Grid Item Labels** -- Show item name below emoji on hover/long-press, or always show name for owned items.

8. **Streak Boost Indicator** -- Show a banner "Streak x5 = 2x rare spawn chance!" when user has an active streak.

#### Edge Cases & States
- **Empty collection:** Well-designed empty state with CTA and floating emojis. Add subtle animation to floating emojis (bob up/down).
- **All collected:** Show "Master Collector!" celebration with special rewards.
- **Filter shows no items:** Show "No [category] items yet. Keep cleaning!"
- **Offline:** Grid will show cached state. Modal will work.

#### Animation Specifications
- Grid items: `ZoomIn.delay(50).duration(350)` -- already present
- Modal entry: `SlideInDown.duration(350).damping(15)` -- already present
- Modal emoji: Add `withSpring({ damping: 6, stiffness: 120 })` on scale for a bounce
- Recently collected: `FadeIn.duration(400)` with golden border pulse
- Filter tab switch: `LinearTransition.duration(350)` -- already present

#### Accessibility
- Grid items have `accessibilityRole="button"` and descriptive labels -- good
- Stats card has `accessibilityRole="summary"` with full description -- excellent
- Filter buttons have `accessibilityState={{ selected }}` -- good
- Modal has `accessibilityViewIsModal` -- good
- Improvement: Add `accessibilityHint="Double tap to view details"` to all grid items

#### Performance Notes
- `FlashList` is used -- good
- `collectibleCounts` and `filteredCollectibles` are properly memoized
- `ITEM_SIZE` is computed from `useWindowDimensions` -- will recompute on rotation, fine
- Consider adding `estimatedItemSize` prop to FlashList for better performance

---

## PART 3: MONETIZATION & SETTINGS

---

### PAYWALL SCREEN
**File:** `app/paywall.tsx`
**Current Lines:** 651
**Current Rating:** 7/10
**Target Rating:** 9.5/10

#### Current State Analysis
Clean paywall with "DECLUTTER PRO" badge, hero heading, "Built for ADHD Brains" badge, feature list (3 items), monthly/annual pricing cards, CTA button, auto-renewal disclosure, "Continue free" link, restore/terms/privacy footer. Uses RevenueCat for purchases.

What works:
- Honest claims (no fabricated reviews)
- Apple-compliant legal links
- Proper error handling for purchases
- Annual plan pre-selected with "Save 33%" badge
- Promo code support via email

What doesn't:
- Only 3 feature bullets (should show more value)
- No social proof (even basic "Join X declutterers")
- No before/after preview or benefit visualization
- No trial countdown urgency
- No testimonials or value illustrations
- CTA is a solid color button, not a gradient
- No animated feature reveals
- Weekly plan is excluded from the UI (only monthly/annual)
- No "What you'll lose" messaging for users who dismiss

#### Improvement Details

1. **Expanded Feature List (6-8 items)** -- Add: "AI-powered room analysis", "Mascot companion with dress-up", "Weekly cleaning leagues", "Variable rewards & collectibles", "Accountability partners".

2. **Value Visualization** -- Add a before/after comparison card: "Free: 1 scan/day" vs "Pro: Unlimited scans, AI tasks, mascot, leagues".

3. **Social Proof Banner** -- "2,400+ people decluttering with Pro" (update with real numbers post-launch). Non-fabricated, updatable.

4. **Trial Countdown Timer** -- If user has a pending trial, show a countdown: "Free trial ends in 2d 14h". Creates urgency without guilt.

5. **Animated Feature Icons** -- Each feature row gets an icon that animates in (slide from left, fade in).

6. **Gradient CTA Button** -- Replace solid color with gradient for more visual appeal.

7. **"What Pro Members Unlock" Screenshots** -- Carousel of app screenshots showing Pro-only features.

8. **Exit Intent** -- When user tries to close, show a small "Sure? Your free trial starts the moment you go Pro" nudge.

9. **Dynamic Pricing Display** -- Show daily price breakdown: "$0.11/day for a clearer mind".

10. **Mascot on Paywall** -- Show Dusty encouraging the purchase: "I'd love to go on adventures with you!"

#### Code Examples

##### Enhanced Feature List
```tsx
const ENHANCED_FEATURES = [
  { icon: 'camera', text: 'Unlimited AI room scans', color: V1.coral },
  { icon: 'brain', text: 'ADHD-optimized task breakdowns', color: V1.indigo },
  { icon: 'timer', text: '15-minute Blitz with smart picks', color: V1.blue },
  { icon: 'pet', text: 'Mascot companion & dress-up', color: V1.amber },
  { icon: 'trophy', text: 'Weekly cleaning leagues', color: V1.gold },
  { icon: 'gift', text: 'Variable rewards & rare collectibles', color: V1.green },
  { icon: 'users', text: 'Accountability partners & challenges', color: V1.coral },
  { icon: 'chart', text: 'Full progress analytics & insights', color: V1.blue },
];
```

##### Daily Price Breakdown
```tsx
function DailyPriceBreakdown({ plan, isDark }: { plan: PlanOption | undefined; isDark: boolean }) {
  const t = isDark ? V1.dark : V1.light;
  if (!plan) return null;

  // Extract numeric price from string like "$39.99/year"
  const priceMatch = plan.price.match(/\\$?([\\d.]+)/);
  const price = priceMatch ? parseFloat(priceMatch[1]) : 0;

  let dailyPrice = 0;
  if (plan.tier === 'annual') dailyPrice = price / 365;
  else if (plan.tier === 'monthly') dailyPrice = price / 30;
  else if (plan.tier === 'weekly') dailyPrice = price / 7;

  return (
    <Text style={{
      fontFamily: BODY_FONT, fontSize: 13, color: t.textSecondary,
      textAlign: 'center', marginTop: 4,
    }}>
      That's just ${dailyPrice.toFixed(2)}/day for a clearer space
    </Text>
  );
}
```

#### Edge Cases & States
- **RevenueCat unavailable (Expo Go):** Shows error banner -- good. Improve: show a cleaner message explaining dev builds don't support purchases.
- **Purchase in progress:** Shows ActivityIndicator in CTA -- good.
- **Purchase failed:** Error banner below CTA -- good. Add retry suggestion.
- **Already subscribed:** Navigating here from settings should show subscription management, not purchase UI.
- **No network:** Purchase will fail. Show offline-specific error message.
- **Restore success:** Navigates to tabs -- good. Consider showing a celebration.

#### Animation Specifications
- Feature rows: Staggered `FadeInDown.delay(300 + idx * 50)` -- already present
- CTA button: Add subtle pulse animation on idle: `withRepeat(withSequence(withTiming(1.02, {duration: 1200}), withTiming(1.0, {duration: 1200})), -1)` on scale
- Pricing card selection: `withTiming` border color transition over 200ms
- Pro badge: Add shimmer sweep animation across gradient

#### Accessibility
- Close button: Properly labeled -- good
- Plan selection: Has `accessibilityState={{ selected }}` -- good
- CTA: Dynamic label with trial info -- excellent
- Footer links: All labeled -- good
- Improvement: pricing cards should announce the full price and period, e.g., "$39.99 per year, Save 33%"

#### Performance Notes
- Plans are memoized with `useMemo` -- good
- No unnecessary re-renders during purchase flow
- `PromptModal` for promo code loads only when visible -- good

---

### SETTINGS SCREEN
**File:** `app/settings.tsx`
**Current Lines:** 722
**Current Rating:** 7.5/10
**Target Rating:** 9/10

#### Current State Analysis
Well-organized settings with 5 groups: General, Appearance, How I Clean, Account, Support & Legal, and Account Actions. Uses Row and PickerRow components for consistent UI. Includes edit profile modal, theme picker, task detail level, encouragement level, session length, haptic/sound toggles, and all required Apple compliance links.

What works:
- Apple-compliant (all required links present)
- Clean, consistent row-based layout
- PickerRow for segmented options is excellent for ADHD (no modals/pickers)
- Error boundary wrapper
- Version number at bottom

What doesn't:
- No "Manage Notifications" detail (just routes to permission screen)
- No data export option
- No "Reset Onboarding" option
- No mascot personality change option
- No "Reduced Motion" toggle (uses system setting but no override)
- Edit profile only supports name (no avatar)
- No indication of current subscription status
- `APP_STORE_ID` is empty string (review link won't work)

#### Improvement Details

1. **Subscription Status Display** -- Show current plan (Free/Monthly/Annual), expiration date, and management URL in the Account section.

2. **Data Export** -- Add "Export My Data" option that generates a JSON/CSV of rooms, tasks, stats. GDPR compliance bonus.

3. **Notification Schedule Settings** -- Instead of routing to permission screen, show inline: reminder time picker, frequency, notification types (achievements, streaks, mascot).

4. **Mascot Settings** -- Allow changing mascot name and viewing personality (with option to retake quiz as a Pro feature).

5. **Reduced Motion Toggle** -- Explicit toggle for users who want reduced animations regardless of system setting.

6. **Profile Avatar Upload** -- In edit profile, allow photo selection with `expo-image-picker`.

7. **Cache Management** -- "Clear Image Cache" for users with storage concerns.

8. **About Screen** -- Credits, acknowledgments, open-source licenses.

#### Edge Cases & States
- **Not authenticated:** Settings that require auth (edit profile, subscription) should show sign-in prompt instead of crashing.
- **Restore in progress:** Shows ActivityIndicator -- good.
- **No subscription:** "Manage Subscription" should say "Upgrade to Pro" and route to paywall.
- **Sign-out confirmation:** Alert dialog -- good.
- **Delete account:** Routes to dedicated screen -- excellent.

#### Animation Specifications
- Entry: Staggered `FadeInDown.delay(N * 40).duration(350)` -- already present
- Toggle switch: iOS native animation -- no custom needed
- Picker chip selection: `withTiming` background color transition

#### Accessibility
- Row component: Proper `accessibilityRole` (switch or button) -- excellent
- PickerRow: Has `accessibilityState={{ selected }}` -- good
- Switch: Proper track colors for visibility
- All destructive actions use Alert confirmation

#### Performance Notes
- Settings use local state synced with `useEffect` -- could cause flicker on mount. Consider initializing from settings directly.
- `useRevenueCat()` hook initializes RevenueCat SDK on mount -- may be unnecessary if user doesn't need purchase features.

---

### NOTIFICATION PERMISSION SCREEN
**File:** `app/notification-permission.tsx`
**Current Lines:** 345
**Current Rating:** 7/10
**Target Rating:** 8.5/10

#### Current State Analysis
Clean permission request screen with Dusty mascot waving, "Stay on Track" title, 4 benefit cards (Achievements, Streak Alerts, Gentle Reminders, Dusty Updates), coral CTA, and "Maybe later" skip. Schedules shame-free reminders and comeback nudges on grant.

What works:
- Benefits-focused framing (not permission-focused)
- Mascot adds personality
- Shame-free messaging aligns with comeback engine philosophy
- Skip option is clear and unpunished
- Schedules initial notifications on grant

What doesn't:
- No preview of actual notification content
- No time-of-day picker for reminders
- Benefits are generic (should preview actual notification text)
- No "You can change this later in Settings" reassurance
- MascotAvatar is relatively small (90px container with 130px image overflows)
- Status bar style is set but may conflict with navigation

#### Improvement Details

1. **Notification Preview Cards** -- Instead of abstract benefits, show actual notification previews: "Good morning! Dusty says: Ready for a quick win?"

2. **Reminder Time Picker** -- Let user choose their preferred reminder time right here. Default to 9:00 AM but allow adjustment.

3. **Reassurance Text** -- Add "You can adjust or turn off notifications anytime in Settings" below the skip button.

4. **Animated Notification Preview** -- Show a mock iOS notification sliding in at the top of the screen, matching the actual notification style.

5. **Fix MascotAvatar Overflow** -- The container is 90px but Image is 130px, causing overflow. Either increase container or reduce image size.

#### Edge Cases & States
- **Already granted:** Should detect and skip this screen. Check permission status on mount.
- **Denied permanently:** Should link to iOS Settings app to re-enable.
- **Requesting state:** Shows "Enabling..." -- good.
- **Error requesting:** Caught and logged but user sees no feedback. Show a gentle error message.

#### Animation Specifications
- Mascot: `FadeIn.delay(100).duration(400)` -- already present
- Benefit rows: Staggered `FadeInDown.delay(400 + idx * 100)` -- already present
- CTA: `FadeInDown.delay(800)` -- already present
- Mock notification: `SlideInDown.duration(300).delay(200)` from top of screen

#### Accessibility
- CTA has `accessibilityRole="button"` and `accessibilityLabel` -- good
- Skip button has `accessibilityLabel` -- good
- Benefit items: Missing `accessibilityRole`. Add `accessibilityRole="text"`.
- MascotAvatar: Missing `accessibilityLabel="Dusty the mascot waving"`

---

## PART 4: SOCIAL FEATURES

---

### SOCIAL / COMMUNITY SCREEN
**File:** `app/social.tsx`
**Current Lines:** 931
**Current Rating:** 6/10
**Target Rating:** 9/10

#### Current State Analysis
Shows Community header, weekly challenge card (active or empty), Your Circle with avatar grid, Circle Activity feed, and Grow Your Circle invite CTA. Supports unauthenticated state with sign-in prompt.

What works:
- Real data from `getMyChallenges()` and `getConnections()`
- Challenge progress bar with participant count
- Activity feed with relative timestamps
- Invite sharing with pre-filled message

What doesn't:
- Uses service functions (`getMyChallenges`, `getConnections`) instead of Convex hooks -- data is not reactive
- No leaderboard display (the league system exists but isn't shown)
- No "Create Challenge" button
- No encouragement sending between connections
- Circle Activity feed is limited and generic
- No notifications count or unread indicator
- Loading state is just a spinner
- Error state has a plain "Try Again" button with no mascot or personality

#### Improvement Details

1. **Switch to Convex Hooks** -- Replace `getMyChallenges()`/`getConnections()` with `useChallenges()`/`useConnections()` for reactive updates.

2. **Weekly Leaderboard Card** -- Show the user's league leaderboard (top 5 + user's rank) using `useWeeklyLeaderboard()`.

3. **Create Challenge CTA** -- Add a prominent "Create Challenge" button that routes to a challenge creation flow.

4. **Send Encouragement** -- Add a "Send Nudge" button on each connection that uses `useSendNudge()`.

5. **Improved Empty States** -- Use `ExpressiveStateView` consistently for all empty states (no challenge, no connections).

6. **Challenge History** -- Show past completed challenges with results.

7. **Connection Online Status** -- Show green dot for recently active connections.

8. **Animated Leaderboard** -- Each leaderboard entry slides in from the right with staggered delay.

#### Code Examples

##### Leaderboard Preview Card
```tsx
import { useWeeklyLeaderboard } from '@/hooks/useConvex';

function LeaderboardPreviewCard({ isDark }: { isDark: boolean }) {
  const leaderboard = useWeeklyLeaderboard();
  const t = getTheme(isDark);

  if (!leaderboard) return null;

  const topEntries = leaderboard.entries.slice(0, 5);
  const leagueColors: Record<string, string> = {
    bronze: '#CD7F32', silver: '#C0C0C0', gold: '#FFD700',
    diamond: '#B9F2FF', champion: '#FF6B6B',
  };
  const color = leagueColors[leaderboard.league] ?? V1.amber;

  return (
    <View style={[{
      backgroundColor: t.card,
      borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
      borderWidth: 1, borderRadius: 20, padding: 18, gap: 12,
    }]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{
          fontFamily: BODY_FONT, fontSize: 11, fontWeight: '600',
          letterSpacing: 1.5, textTransform: 'uppercase',
          color: isDark ? 'rgba(255,255,255,0.21)' : 'rgba(0,0,0,0.25)',
        }}>
          {leaderboard.leagueInfo.emoji} {leaderboard.leagueInfo.name} LEAGUE
        </Text>
        {leaderboard.userRank && (
          <Text style={{ fontFamily: BODY_FONT, fontSize: 12, fontWeight: '600', color }}>
            You: #{leaderboard.userRank}
          </Text>
        )}
      </View>

      {topEntries.map((entry, idx) => (
        <View key={entry._id ?? idx} style={{
          flexDirection: 'row', alignItems: 'center', gap: 10,
        }}>
          <Text style={{
            width: 24, fontFamily: BODY_FONT, fontSize: 13, fontWeight: '600',
            color: idx === 0 ? '#FFD700' : idx === 1 ? '#C0C0C0' : idx === 2 ? '#CD7F32' : t.textSecondary,
          }}>
            #{idx + 1}
          </Text>
          <Text style={{ fontFamily: BODY_FONT, fontSize: 14, color: t.text, flex: 1 }}>
            {entry.userEmoji} {entry.userName}
            {entry.userId === leaderboard.userEntry?.userId ? ' (You)' : ''}
          </Text>
          <Text style={{ fontFamily: BODY_FONT, fontSize: 13, fontWeight: '600', color }}>
            {entry.xpEarned} XP
          </Text>
        </View>
      ))}
    </View>
  );
}
```

#### Edge Cases & States
- **Not authenticated:** ExpressiveStateView with sign-in -- good.
- **No challenges or connections:** Each section shows empty state -- could be better. Combine into a single onboarding card.
- **Error loading:** Shows retry button -- functional but plain.
- **Offline:** Data won't load from service functions. With Convex hooks, cached data would display.
- **First social visit:** Show an onboarding tutorial explaining challenges and circles.

#### Animation Specifications
- Sections: Staggered `FadeInDown.delay(N * 60)` -- already present
- Leaderboard entries: `SlideInRight.delay(idx * 50).duration(300)`
- Send nudge button: `withSpring({ damping: 12 })` on scale for tap feedback
- New activity items: `FadeInDown.duration(300)` when feed updates

#### Accessibility
- Header icon: `accessibilityLabel="People"` -- too vague. Change to "Manage connections and accountability"
- Challenge card: `accessibilityLabel` includes title -- good
- Circle avatars: Missing `accessibilityLabel` on individual avatars
- Feed items: Missing `accessibilityRole="text"`

#### Performance Notes
- `formatRelativeTime` is called on every render for each feed item -- memoize
- `getMyChallenges()` and `getConnections()` are Promise-based and called in useEffect -- switch to reactive Convex queries
- Avatar colors computed via modulo -- fine, no memoization needed

---

### ACCOUNTABILITY SCREEN
**File:** `app/accountability.tsx`
**Current Lines:** 767
**Current Rating:** 6.5/10
**Target Rating:** 8.5/10

#### Current State Analysis
Partner card (with avatar/name/status), weekly check-in card with dynamic checklist, send check-in CTA, check-in history dots, and motivation message. Unauthenticated state uses ExpressiveStateView.

What works:
- Dynamic check-in items based on actual weekly activity
- Partner card with error/empty/loaded states
- Motivation message adapts to streak length
- Error boundary wrapper

What doesn't:
- Check-in "send" is just an Alert dialog -- no actual notification sent to partner
- History dots use a simple streak count, not actual week-by-week data
- "Due in 2 days" is hardcoded, not computed
- No actual Convex hooks for accountability (`getConnections()` service function used)
- Partner status shows static "Active" with green dot -- not real-time
- No nudge/poke button
- No encouragement messages from partner

#### Improvement Details

1. **Wire to Convex Hooks** -- Use `useMyPartner()`, `useSendNudge()`, `useUpdateActivity()` from hooks/useConvex.ts.

2. **Real Check-In Sending** -- Call `useSendNudge()` or a new `sendCheckIn` mutation that pushes a notification to the partner.

3. **Compute "Due in" Dynamically** -- Calculate days until next Sunday (or weekly reset) instead of hardcoded "2 days".

4. **Partner Activity Status** -- Use `useBothActiveBonus()` to show if both partners were active today.

5. **Received Encouragement** -- Show messages/nudges received from partner with timestamps.

6. **Both-Active Bonus Banner** -- When both partners are active, show "+50% XP bonus active!" using the `useBothActiveBonus()` hook.

7. **Invite Partner Flow** -- Add "Invite Partner" button using `useInviteCode()` to generate a shareable invite code.

#### Edge Cases & States
- **No partner:** Shows "No partner yet" with redirect to Community -- good. Add a direct "Generate Invite Code" button.
- **Partner load error:** Shows retry button -- good.
- **Not authenticated:** ExpressiveStateView -- good.
- **All check-in items complete:** CTA turns green "Send Check-In (all done!)" -- nice touch.
- **No items complete:** Alert prevents sending -- good but could show inline message instead.

#### Accessibility
- Checkboxes have proper `accessibilityRole="checkbox"` and `accessibilityState` -- excellent
- Send button label includes partner name -- good
- History dots: Missing `accessibilityLabel`. Each dot should announce "Week 1: completed" or "Week 2: not completed"

---

### CHALLENGE DETAIL SCREEN
**File:** `app/challenge/[id].tsx`
**Current Lines:** 693
**Current Rating:** 7/10
**Target Rating:** 8.5/10

#### Current State Analysis
Full challenge view with type icon, title, description, meta row (target, days left, participants), progress bar (if participant), join button (if not), invite code display, leaderboard, and challenge info card. Loading/error/unauthenticated states all use ExpressiveStateView.

What works:
- Comprehensive state handling (loading, error, not found, not authenticated)
- Leaderboard with rank indicators (gold/silver/bronze)
- Share functionality for invite codes
- Progress with halfway encouragement
- 15-second timeout on data loading

What doesn't:
- Uses service functions instead of Convex hooks (not reactive)
- Leaderboard sorts in-component on every render (should be server-side)
- No celebration animation when challenge is completed
- No "time remaining" countdown timer (just static "X days left")
- No way to create a new challenge from this screen
- Challenge invite code is displayed but no "copy to clipboard" button

#### Improvement Details

1. **Reactive Data** -- Switch to Convex `useQuery` for challenge data so updates from other participants appear in real-time.

2. **Copy Invite Code** -- Add clipboard copy with `expo-clipboard` and toast confirmation.

3. **Completion Celebration** -- When `myProgress?.completed` is true, show confetti animation.

4. **Live Countdown** -- Replace static "X days left" with a live HH:MM countdown on the last day.

5. **Create Challenge CTA** -- "Create your own challenge" link at the bottom.

6. **Participant Avatars** -- Show actual mascot emojis or profile photos instead of initial letters.

#### Edge Cases & States
- All states well-handled with ExpressiveStateView.
- **Challenge ended:** Should show final results with winner announcement.
- **User already joined:** Join button correctly hidden.
- **Invalid challenge ID:** Error state handles it.

---

### JOIN SCREEN
**File:** `app/join.tsx`
**Current Lines:** 363
**Current Rating:** 7.5/10
**Target Rating:** 8.5/10

#### Current State Analysis
Clean code entry screen with ticket icon, title, subtitle, large centered code input, join button, and help text. Uses KeyboardAvoidingView. Handles auth state, validation, and error display.

What works:
- Auto-capitalize characters
- Pre-fill from URL params
- Clear error messages
- Keyboard-aware layout
- 10-character limit

What doesn't:
- No paste detection (auto-paste from clipboard)
- No success animation
- Input field is plain styled, could use more visual personality
- Help text is static

#### Improvement Details

1. **Auto-Paste from Clipboard** -- On screen mount, check clipboard for an 8-character code and prompt "Paste from clipboard?"

2. **Success Animation** -- After successful join, show confetti and the challenge title before navigating.

3. **Input Formatting** -- Add dashes between character groups for readability (ABC-123-XY).

4. **Recent Codes** -- Remember last 3 entered codes for quick re-entry.

---

### DELETE ACCOUNT SCREEN
**File:** `app/delete-account.tsx`
**Current Lines:** 354
**Current Rating:** 8/10
**Target Rating:** 9/10

#### Current State Analysis
Clean, serious screen with sad mascot emoji, deletion summary card (5 items that will be deleted), warning text, and two buttons (Delete red, Keep outlined). Double confirmation via Alert dialog.

What works:
- Clear about what gets deleted
- Double confirmation (button + Alert)
- Sad mascot adds emotional weight
- "Keep My Account" is visually prominent
- Clears local data after deletion
- Proper loading state during deletion

What doesn't:
- Uses emoji instead of actual sad Dusty mascot image
- No "Export my data first" option
- No cool-down period ("Account will be deleted in 48 hours, cancel anytime")
- No feedback/reason collection

#### Improvement Details

1. **Use MascotAvatar** -- Replace the emoji with `<MascotAvatar imageKey="sad" size={100} />`.

2. **Export Data Option** -- Add "Download my data" button before deletion.

3. **Feedback Collection** -- Optional single-select: "Why are you leaving?" with options like "Not useful", "Too expensive", "Privacy concerns", "Other".

4. **Retention Offer** -- If user is on paid plan, offer: "How about we pause your subscription instead?"

5. **Cool-Down Period** -- Instead of immediate deletion, schedule deletion in 7 days with ability to cancel.

---

## PART 5: INSIGHTS SCREEN

### INSIGHTS SCREEN
**File:** `app/insights.tsx`
**Current Lines:** 1065
**Current Rating:** 7/10
**Target Rating:** 9/10

#### Current State Analysis
Comprehensive analytics dashboard with time period filter (week/month/year/all), stats grid (tasks, streak, hours, level), weekly activity bar chart, progress rings (tasks/streak/collection), room performance bars, collection rarity breakdown, and personalized ADHD tips. Empty state uses ExpressiveStateView.

What works:
- Time period filtering
- SVG-based progress rings
- BlurView stat tiles
- Activity chart with per-day bars
- ADHD-specific tips that adapt to user state
- Pull-to-refresh
- Proper skeleton loading

What doesn't:
- Charts use static heights, not animated
- No "compare to last period" feature
- Room performance doesn't filter by time period
- Collection stats hardcode `totalCollectibles = 20` instead of using COLLECTIBLES array length
- No shareable summary card ("My Week in Review")
- Avg time per task uses total tasks, not filtered tasks
- Chart bars don't animate their height
- No heatmap calendar
- Tips section could be more personalized using AI

#### Improvement Details

1. **Animated Chart Bars** -- Use `useSharedValue` and `withTiming` to animate bar heights on period change.

2. **Period Comparison** -- Add "+15% vs last week" indicators on stat tiles (the `change` prop exists on StatTile but is never used).

3. **Fix Collection Stats** -- Replace `const totalCollectibles = 20` with `COLLECTIBLES.filter(c => !c.isSpecial).length`.

4. **Shareable Weekly Summary** -- "Share my week" button that generates an image with stats using `react-native-view-shot`.

5. **Calendar Heatmap** -- Add a 12-week heatmap showing daily activity intensity.

6. **AI-Powered Insights** -- Use `useGetMotivation()` to generate personalized insight paragraphs.

7. **Goal Setting** -- Let users set weekly task/time goals and track progress toward them.

8. **Trend Lines** -- Add simple spark-line trends on stat tiles showing 4-week direction.

#### Edge Cases & States
- **No data:** ExpressiveStateView -- excellent.
- **Loading:** Skeleton component -- good.
- **Single room:** Room performance shows one bar -- functional but lonely.
- **New user with 1 task:** All charts show minimal data. Add "Keep going!" encouragement.
- **Period with no activity:** Show empty period message, not zero-filled charts.

#### Animation Specifications
- Chart bars: `FadeInDown.delay(N).duration(350)` -- already present but height not animated
- Progress rings: Should animate the `strokeDashoffset` from circumference to final value
- Stat tiles: `FadeInRight.delay(N)` -- already present
- Period switch: Animate all cards fading out and back in with new data

#### Accessibility
- Period selector: `accessibilityRole="tablist"` with `accessibilityRole="tab"` -- excellent
- Chart: Hidden from screen readers with accessible summary -- excellent
- Progress rings: Label with `accessibilityLabel` including percentage -- good
- Room performance: Missing `accessibilityLabel` on individual bars

#### Performance Notes
- `insights` useMemo correctly depends on `[rooms, stats, collectionStats, timePeriod, getDateRange]`
- `getDateRange` useCallback has no dependencies -- correct
- `allCompletedTasks` iterates all rooms/tasks on every period change -- acceptable for <100 rooms
- Consider lazy-loading chart and collection sections for initial render performance

---

## CROSS-CUTTING CONCERNS

### Design Token Gaps
The design tokens in `constants/designTokens.ts` are well-structured but missing:
- **Animation durations:** Standardize entry/exit durations (currently 350-400ms everywhere)
- **Touch feedback:** Standardize pressed opacity (currently varies: 0.7, 0.78, 0.85, 0.88)
- **Font sizes:** No size scale (currently ad-hoc: 11, 12, 13, 14, 15, 16, 17, 20, 22, 24, 28)

### ADHD-Specific Patterns to Apply Everywhere
1. **Never show zero-filled stats screens** -- Always use encouraging empty states
2. **Cumulative metrics over streaks** -- "47 sessions total" beats "Day 3 streak"
3. **One Tiny Thing** -- Every screen should offer a 60-second re-entry task
4. **No guilt messaging** -- The comeback engine philosophy must extend to all copy
5. **Variable rewards** -- Show unclaimed rewards prominently on every relevant screen
6. **Mascot presence** -- Dusty should appear on most screens with contextual messages

### Revenue Optimization Opportunities
1. **Paywall touchpoints:** Profile (upgrade card), Settings (manage subscription), Progress (locked insights), Social (locked leagues), Collection (locked rare items)
2. **Trial conversion:** Show trial countdown on home screen
3. **Lapsed subscriber win-back:** Special comeback offer for expired subscriptions
4. **Feature gating strategy:** Free: 1 scan/day, 3 rooms max. Pro: Unlimited everything
5. **RevenueCat placement tracking:** Tag each paywall entry point for conversion analytics

### Missing Screens to Build
1. **Leaderboard Detail Screen** -- Full league view with all 30 participants, promotion/relegation zones
2. **Challenge Creation Screen** -- Form to create new challenges with type, target, and duration
3. **Mascot Wardrobe Screen** -- Browse and equip accessories
4. **Weekly Summary Screen** -- Shareable recap of the week's achievements

---

This document covers all 14 screens in the engagement, social, and monetization area with specific, implementable improvements. Every code example uses the project's actual imports, design tokens, hooks, and patterns. The total improvement count across all screens is approximately 120 distinct items.
---

# PART 5: CROSS-CUTTING CONCERNS & ARCHITECTURE

## Design System Improvements Needed

### Animation Constants (add to designTokens.ts)
```tsx
export const ANIMATION = {
  spring: { damping: 15, stiffness: 200, mass: 0.8 },
  springLight: { damping: 12, stiffness: 250, mass: 0.5 },
  springBouncy: { damping: 8, stiffness: 180, mass: 0.8 },
  duration: { fast: 150, normal: 300, slow: 500 },
  stagger: 60,
} as const;

export const TIMING = {
  fast: 200,
  normal: 350,
  slow: 600,
} as const;

export const Z_INDEX = {
  base: 0, card: 1, fab: 40, toast: 50, modal: 100, overlay: 200,
} as const;

export const FONT_SIZE = {
  xs: 11, sm: 12, md: 14, lg: 16, xl: 20, xxl: 28, display: 32,
} as const;
```

### Button Style Helpers
```tsx
export function coralButtonStyle() {
  return {
    backgroundColor: V1.coral,
    borderRadius: 28,
    height: 56,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  };
}

export function outlineButtonStyle(isDark: boolean) {
  const t = isDark ? V1.dark : V1.light;
  return {
    borderColor: t.border,
    borderWidth: 1.5,
    borderRadius: 26,
    height: 52,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    flexDirection: 'row' as const,
    gap: 8,
  };
}
```

## Shared Components to Extract

1. **CoralButton** -- Used identically in 8+ screens. Extract to `components/ui/CoralButton.tsx`.
2. **AnimatedInput** -- Input field with focus border animation. Used in login, signup, mascot step.
3. **ErrorBanner** -- The error display pattern is identical across login, signup, analysis.
4. **LoadingDots** -- Breathing/pulsing dots used in splash and root index.
5. **SectionLabel** -- Uppercase label pattern used in camera, onboarding, task customize.
6. **SkeletonShimmer** -- Shimmer placeholder used across rooms, profile, progress.
7. **CountUpStat** -- Animated counting number used in session-complete, room-complete, insights.

## ADHD-Specific UX Patterns to Implement Globally

1. **Time estimates everywhere** -- Every action should show expected time ("This will take ~2 min")
2. **Escape hatches** -- Every multi-step flow should have a skip/later option
3. **Celebration on completion** -- Every task completion, however small, gets visual feedback
4. **Low-decision defaults** -- Pre-select the best option so users can just tap "Continue"
5. **Progress visibility** -- Always show where the user is in any flow (step X of Y)
6. **Body doubling cues** -- "Dusty is working alongside you" during active cleaning sessions
7. **Never show zero-filled stats** -- Always use encouraging empty states
8. **Cumulative metrics over streaks** -- "47 sessions total" beats "Day 3 streak"
9. **One Tiny Thing** -- Every screen should offer a 60-second re-entry task
10. **No guilt messaging** -- The comeback engine philosophy must extend to ALL copy
11. **Variable rewards** -- Show unclaimed rewards prominently on every relevant screen
12. **Mascot presence** -- Dusty should appear on most screens with contextual messages

## Offline Support Strategy

All screens currently lack offline awareness. Implementation plan:
1. Add `useNetworkStatus` hook wrapping `@react-native-community/netinfo`
2. Show subtle "Offline" badge in headers when disconnected
3. Queue mutations (task completions, XP updates) in local storage
4. Sync queue on reconnection with conflict resolution (server wins for stats, client wins for task state)

## Haptic Consistency

Standardize across all screens:
- Task completion: `NotificationFeedbackType.Success`
- Navigation: `ImpactFeedbackStyle.Light`
- Destructive action: `ImpactFeedbackStyle.Medium`
- Celebration: `NotificationFeedbackType.Success` + `ImpactFeedbackStyle.Heavy`
- Selection change: `selectionAsync()`
- Error: `NotificationFeedbackType.Error`

## Timer Consistency

Three different timer implementations exist (blitz.tsx, focus.tsx, single-task.tsx). Extract shared `useTimer` hook (see Room & Session section for full implementation).

---

# PART 6: EXECUTION PLAN

## PRIORITY MATRIX

### P0: Critical Path (Week 1-2) — Highest Impact

| # | Improvement | Screen | Est. Hours | Impact |
|---|------------|--------|------------|--------|
| 1 | Decompose Home tab (1765 lines -> 6 components) | Home | 8h | Maintainability |
| 2 | Decompose Room Detail (1618 lines -> 6 components) | Room Detail | 8h | Maintainability |
| 3 | Extract shared useTimer hook | Blitz/Focus/Single | 2h | DRY, bug prevention |
| 4 | Simplify home to one CTA | Home | 4h | ADHD conversion |
| 5 | Fix camera flow (3 taps max) | Camera | 3h | Core UX |
| 6 | Add cancel during AI scan | Analysis | 1h | User trust |
| 7 | Merge task-customize into analysis | Analysis/Customize | 6h | Fewer screens = less dropout |
| 8 | Default room detail to single-task focus | Room Detail | 4h | ADHD focus |
| 9 | Use useTodaysTasks hook in today-tasks | Today Tasks | 3h | Feature correctness |
| 10 | Unify freshness calculation (use hook) | Rooms Tab | 2h | Data accuracy |

### P1: Emotional Bond (Week 2-3)

| # | Improvement | Screen | Est. Hours | Impact |
|---|------------|--------|------------|--------|
| 11 | Dusty adventures (8-hour timer, rewards) | Mascot | 6h | Retention |
| 12 | Dusty reactions on every task completion | Room Detail | 3h | Dopamine |
| 13 | Mascot dress-up with collectibles | Mascot/Collection | 8h | Premium driver |
| 14 | Personality-driven push notifications | Notifications | 4h | Re-engagement |
| 15 | Speech bubbles on mascot screen | Mascot | 3h | Emotional bond |
| 16 | Before/after photo slider | Room Complete | 4h | Wow factor |
| 17 | Session complete counting animations | Session Complete | 2h | Celebration |
| 18 | Enhanced confetti (shapes, wind, spin) | Room Complete | 3h | Peak moment |

### P2: Retention Mechanics (Week 3-4)

| # | Improvement | Screen | Est. Hours | Impact |
|---|------------|--------|------------|--------|
| 19 | Weekly cleaning leagues (30 users) | Social | 8h | DAU/MAU boost |
| 20 | Achievement progress tracking | Achievements | 4h | Goal visibility |
| 21 | Streak freeze implementation | Progress | 3h | 21% churn reduction |
| 22 | Share cards (before/after + badges) | Room Complete/Achievements | 6h | Viral growth |
| 23 | Blitz mode smooth timer ring | Blitz | 3h | Visual polish |
| 24 | Blitz break enforcement | Blitz | 2h | ADHD-friendly |
| 25 | Blitz extend timer option | Blitz | 2h | User flexibility |
| 26 | Comeback welcome banner | Profile | 2h | Re-engagement |
| 27 | Animated stat counters everywhere | Progress/Insights | 3h | Visual delight |
| 28 | Calendar heatmap | Progress | 4h | Activity visibility |

### P3: Monetization & Polish (Week 4-5)

| # | Improvement | Screen | Est. Hours | Impact |
|---|------------|--------|------------|--------|
| 29 | Paywall optimization (Finch model) | Paywall | 6h | Conversion |
| 30 | Guest mode -> delayed signup | Auth | 4h | Onboarding conversion |
| 31 | 7-day free trial (no CC) | Paywall | 2h | Trial starts |
| 32 | Onboarding progress persistence | Onboarding | 2h | Completion rate |
| 33 | Animated inputs + error shakes | Auth screens | 3h | Polish |
| 34 | Tab badge indicators | Tab Layout | 2h | Discoverability |
| 35 | Skip reason capture in blitz | Blitz | 2h | AI training data |
| 36 | Data export option | Settings | 3h | GDPR / trust |
| 37 | Delete account cool-down | Delete Account | 2h | Retention |
| 38 | Offline support across all screens | Global | 8h | Reliability |

### P4: Growth Features (Week 5+)

| # | Improvement | Screen | Est. Hours | Impact |
|---|------------|--------|------------|--------|
| 39 | Drag-to-reorder tasks | Room Detail/Customize | 6h | Power users |
| 40 | Ambient sounds in focus/blitz | Focus/Blitz | 4h | ADHD focus |
| 41 | Shareable weekly summary | Insights | 4h | Viral |
| 42 | Challenge creation screen | Social | 6h | Engagement |
| 43 | Mascot wardrobe screen | Mascot | 6h | Premium |
| 44 | Leaderboard detail screen | Social | 4h | Competition |
| 45 | Auto-paste invite codes | Join | 1h | Friction reduction |
| 46 | Photo blur detection | Camera | 2h | Quality |
| 47 | Multiple photo support | Camera | 6h | Analysis quality |
| 48 | AI-powered insights paragraphs | Insights | 4h | Premium value |

**Total estimated effort:** ~200 hours across all priorities

---

## THE COMPETITIVE FORMULA

```
Declutter = Finch's emotional bond
           + Goblin Tools' AI task magic
           + Duolingo's retention mechanics
           + Tody's room health tracking
           + UfYH's timed cleaning bursts
           - Habitica's punishment
           - Tiimo's complexity
           - Clutterfree's paywall frustration
```

**No competitor has this combination. That's why we win.**

---

## METRICS TO TRACK

| Metric | Target | Why |
|--------|--------|-----|
| Onboarding completion | >80% | Currently unknown |
| First room scanned (Day 1) | >60% | The "aha" moment |
| Day 7 retention | >40% | Industry avg is 20% |
| Day 30 retention | >20% | Finch achieves ~25% |
| DAU/MAU ratio | >25% | Duolingo is 37%, Finch ~20% |
| Rooms scanned per user/week | >2 | Core engagement metric |
| Tasks completed per session | >5 | Indicates value delivery |
| App Store rating | >4.7 | Table stakes for growth |
| Free -> Pro conversion | >5% | Finch-level is 3-5% |
| Monthly churn (Pro) | <8% | Industry avg is 12% |
| Blitz sessions per user/week | >3 | Hero feature engagement |
| Mascot interaction rate | >60% DAU | Emotional bond indicator |
| Before/after shares per week | >100 | Viral growth metric |

---

## REVENUE PROJECTIONS

Based on Finch's revenue model ($15/yr, 3-5% conversion, $900K-2M/mo revenue):

**At $6.99/mo ($39.99/yr) pricing:**
| Users | Free | Pro (5%) | Revenue/mo | Revenue/yr |
|-------|------|----------|------------|------------|
| 10K | 9,500 | 500 | $3,500 | $42K |
| 50K | 47,500 | 2,500 | $17,500 | $210K |
| 100K | 95,000 | 5,000 | $35,000 | $420K |
| 500K | 475,000 | 25,000 | $175,000 | $2.1M |
| 1M | 950,000 | 50,000 | $350,000 | $4.2M |

---

## REVENUE OPTIMIZATION TOUCHPOINTS

1. **Paywall touchpoints:** Profile (upgrade card), Settings (manage subscription), Progress (locked insights), Social (locked leagues), Collection (locked rare items)
2. **Trial conversion:** Show trial countdown on home screen
3. **Lapsed subscriber win-back:** Special comeback offer for expired subscriptions
4. **Feature gating strategy:** Free: 1 scan/day, 3 rooms max. Pro: Unlimited everything
5. **RevenueCat placement tracking:** Tag each paywall entry point for conversion analytics

---

## MISSING SCREENS TO BUILD

1. **Leaderboard Detail Screen** -- Full league view with all 30 participants, promotion/relegation zones
2. **Challenge Creation Screen** -- Form to create new challenges with type, target, and duration
3. **Mascot Wardrobe Screen** -- Browse and equip accessories
4. **Weekly Summary Screen** -- Shareable recap of the week's achievements

---

## FINAL WORD

The cleaning app market is fragmented. No clear winner. No app has cracked the code of:
**AI + emotional companion + ADHD-first + gamification**

Declutter has ALL FOUR. The competition has 1-2 at most.

The biggest risk is not the competition — it's complexity. Keep it simple. One clear action per screen. Fall in love with Dusty first, clean second. Make the AI analysis moment feel like magic.

**This document contains 290+ specific, implementable improvements with real code examples. Ship the P0 items first. Everything else is a growth lever for later.**

**Ship the core flow perfectly. Everything else is a growth lever for later.**
