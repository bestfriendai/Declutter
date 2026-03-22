# Declutterly UX Improvements Audit

## Executive Summary

Declutterly is a well-architected Expo 54 app with strong foundations: proper use of `expo-image`, `react-native-reanimated`, safe area handling, haptic feedback, dark mode support, and custom screen transitions. The app already outperforms most competitors in ADHD-friendly design patterns (single-task focus, small steps, resistance handlers, decision helpers).

**Key gaps found:**
1. **Missing pull-to-refresh** on all main screens (Home, Rooms, Progress, Profile)
2. **No blurhash/placeholder** on any Image components -- causes jarring pop-in
3. **Static `Dimensions.get('window')`** used in 6 files instead of `useWindowDimensions` hook (causes issues on iPad/rotation)
4. **Missing keyboard handling** on Onboarding mascot name input and Join screen
5. **ScrollView used for long lists** where FlatList/FlashList would be better (Rooms list, Today Tasks, Achievements badges, Room task list)
6. **No image caching policy** set on room photos -- expo-image defaults may cause unnecessary re-downloads
7. **Timer SVG ring not animated** with native driver in Blitz/Focus screens
8. **Missing loading skeletons** on several screens (Rooms, Profile, Progress, Social)
9. **Pressable touch targets** below 44pt minimum in several places
10. **No swipe-to-dismiss** on modal screens (analysis, single-task)

---

## Competitive Analysis Matrix

| Feature | Declutterly | Tody | Sweepy | OurHome | Habitica | Duolingo | Finch |
|---|---|---|---|---|---|---|---|
| AI room scanning | YES (unique) | No | No | No | No | No | No |
| ADHD-focused task breakdown | YES (unique) | No | No | No | No | No | Partial |
| Gamification (XP/levels/streaks) | Good | Basic | Basic | Good | Excellent | Excellent | Good |
| Mascot companion | Good | No | No | No | Avatar | Duo | YES (best) |
| Onboarding quality | Good (5 steps) | Average | Average | Average | Good | Excellent | Excellent |
| Pull-to-refresh | MISSING | Yes | Yes | Yes | Yes | Yes | Yes |
| Haptic feedback | Excellent | None | None | Basic | None | Good | Good |
| Dark mode | Excellent | Partial | Yes | No | Yes | Yes | Yes |
| Offline support | Good | Yes | Yes | No | Partial | No | Partial |
| Social/accountability | Basic | No | Family | Family | Guilds | Leagues | No |
| Before/after photos | YES | No | No | No | No | No | No |
| Loading skeletons | Partial | No | No | No | No | Yes | Yes |
| Animations | Good | Basic | Basic | None | Good | Excellent | Excellent |
| Timer/Pomodoro | YES | No | No | No | No | No | No |
| Decision fatigue helpers | YES (unique) | No | No | No | No | No | No |

### What competitors do better:
- **Duolingo**: Streak freeze mechanics, daily goal celebrations, league system, lesson review animations
- **Finch**: Pet evolution tied to progress, emotional check-ins, garden metaphor, gentle tone throughout
- **Habitica**: Guild system, boss battles, equipment rewards, party quests
- **Tody**: Room scheduling calendar, "needs attention" push at right time
- **Sweepy**: Family member assignment, effort-based scheduling

### What Declutterly does better than ALL competitors:
- AI photo-to-tasks pipeline (unique selling point)
- ADHD-specific: decision point helpers, resistance handlers, doom pile detection
- Single-task focus mode (shows ONE task at a time)
- Energy-aware task ordering
- Comeback engine with grace periods (no shame)

### Features to steal/adapt:
1. **From Duolingo**: Animated streak celebrations, "streak freeze" item in collection
2. **From Finch**: Pet evolution stages based on cumulative progress, gentle encouragement copy
3. **From Tody**: "Last cleaned X days ago" per room with color coding
4. **From Habitica**: Collectible equipment/cosmetics for mascot
5. **From Sweepy**: Effort-based time estimates that learn from user behavior

---

## Screen-by-Screen Improvements

### 1. Home Screen `app/(tabs)/index.tsx`
**Current: 7/10**
- Good: Skeleton loading, comeback engine, streak card, mascot integration
- Issues found:
  - No pull-to-refresh
  - Uses `Dimensions.get('window')` at module level (line 68) -- stale on rotation
  - Task list uses inline rendering instead of FlatList -- could lag with 20+ tasks
  - `getQuote()` and `getTimeContext()` called on every render without memoization
  - Comeback modal uses RN `Modal` instead of bottom sheet (Android back button issues)
  - Missing haptic on task checkbox toggle in today's tasks section

### 2. Rooms Screen `app/(tabs)/rooms.tsx`
**Current: 7/10**
- Good: Animated press, empty state, freshness bars, image thumbnails
- Issues found:
  - No pull-to-refresh
  - Room list uses `.map()` inside ScrollView -- should use FlatList for 5+ rooms
  - Room card images missing `cachePolicy` and `placeholder` props
  - No skeleton loading state (just ActivityIndicator)

### 3. Progress Screen `app/(tabs)/progress.tsx`
**Current: 7/10**
- Good: Week view with day circles, streak card, stats grid
- Issues found:
  - No pull-to-refresh
  - No skeleton loading

### 4. Profile Screen `app/(tabs)/profile.tsx`
**Current: 7/10**
- Good: Level system, mascot companion card, empty state with CTA
- Issues found:
  - No pull-to-refresh
  - Mascot bar indicators not animated (static widths)
  - Settings button `transform: [{ scale: pressed ? 0.93 : 1 }]` in style prop -- should use Reanimated for 60fps

### 5. Camera Screen `app/camera.tsx`
**Current: 8/10**
- Good: Permission flow, context picker overlay, room type pills, viewfinder brackets
- Issues found:
  - No loading indicator while camera initializes
  - Shutter button has no scale animation on press
  - Gallery button icon could show last photo thumbnail (like native Camera app)
  - `Dimensions.get('window')` at module level

### 6. Analysis Screen `app/analysis.tsx`
**Current: 7/10**
- Good: Scan line animation, phase progression, detection overlay
- Issues found:
  - Uses `Dimensions.get('window')` at module level
  - No swipe-to-dismiss gesture
  - Error state has no retry animation

### 7. Room Detail Screen `app/room/[id].tsx`
**Current: 7/10**
- Good: Phase tabs, task detail panels, XP float-up animation, subtask checkboxes
- Issues found:
  - Task list uses map() in ScrollView -- needs FlatList for rooms with 15+ tasks
  - No pull-to-refresh
  - Room header photo missing blurhash placeholder
  - Task completion animation could be more celebratory (confetti for milestones)

### 8. Blitz Screen `app/blitz.tsx`
**Current: 8/10**
- Good: Timer ring, single-task focus, phase dots, combo counter, carry chain hints
- Issues found:
  - SVG timer ring updates via re-render not native animation
  - AppState background tracking is good
  - Phase transition celebration could use confetti

### 9. Focus Screen `app/focus.tsx`
**Current: 7/10**
- Good: Presets, break reminders, pulse animation
- Issues found:
  - SVG timer ring same issue as Blitz
  - Break reminder uses Alert instead of custom modal

### 10. Onboarding Screen `app/onboarding.tsx`
**Current: 8/10**
- Good: 5-step collapsed flow, progress bar, step animations
- Issues found:
  - Mascot name TextInput not wrapped with KeyboardAvoidingView (keyboard covers input)
  - ScrollView `keyboardShouldPersistTaps` is set (good) but no keyboard dismiss gesture

### 11. Session Complete `app/session-complete.tsx`
**Current: 7/10**
- Good: Haptic success feedback, progress bar animation, notification scheduling
- Issues found:
  - No confetti animation (room-complete has it, session-complete doesn't)
  - Stats row could animate count-up for numbers

### 12. Room Complete `app/room-complete.tsx`
**Current: 8/10**
- Good: Confetti animation, before/after photo, share progress
- Issues found:
  - Confetti implementation creates many Animated.Views (performance concern with 20+ pieces)

### 13. Paywall `app/paywall.tsx`
**Current: 7/10**
- Good: Plan toggle, promo code support, restore purchases
- Issues found:
  - No social proof (even simple "X rooms cleaned by community")
  - Feature comparison between free and pro could be clearer

### 14. Settings `app/settings.tsx`
**Current: 8/10**
- Good: Section grouping, toggle switches, legal links, account management
- Issues found:
  - No search/filter for settings
  - Could benefit from Section headers with icons

### 15. Auth Screens `app/auth/login.tsx`, `signup.tsx`, `forgot-password.tsx`
**Current: 8/10**
- Good: KeyboardAvoidingView, input chaining with returnKeyType, error states, haptics
- Issues found:
  - Using RN KeyboardAvoidingView instead of react-native-keyboard-controller (already in deps)
  - No "show password" animation

### 16. Collection Screen `app/collection.tsx`
**Current: 8/10**
- Good: Uses FlashList (correct), filter tabs, rarity glow, detail modal
- Issues found:
  - Good use of FlashList -- one of the few screens that does this right

### 17. Achievements Screen `app/achievements.tsx`
**Current: 7/10**
- Good: Badge grid, XP progress bar, streak card
- Issues found:
  - Badge grid uses hardcoded width calculation instead of responsive grid
  - Share badge functionality could be more polished

### 18. Social Screen `app/social.tsx`
**Current: 6/10**
- Good: RefreshControl (one of only 3 screens with it), challenge cards
- Issues found:
  - Empty state could be more engaging
  - No skeleton loading while data loads

### 19. Today Tasks Screen `app/today-tasks.tsx`
**Current: 7/10**
- Good: Room grouping, summary badges, task color coding
- Issues found:
  - Task list uses map() in ScrollView
  - No pull-to-refresh

### 20. Mascot Screen `app/mascot.tsx`
**Current: 7/10**
- Good: Interactive mascot, stat bars, personality info
- Issues found:
  - "Tap to interact" text could pulse to draw attention
  - Stat bars not animated

---

## Priority Ranking (Maximum User Impact)

### P0 -- Ship Blockers (Fix First)
1. Add pull-to-refresh to Home, Rooms, Progress screens
2. Add blurhash placeholders to all Image components
3. Replace `Dimensions.get('window')` with `useWindowDimensions`
4. Add KeyboardAvoidingView to Onboarding MascotStep

### P1 -- High Impact Polish
5. Add loading skeletons to Rooms screen
6. Add image caching policy to room photos
7. Animate freshness/progress bars with Reanimated
8. Add confetti to session-complete screen
9. Increase touch targets below 44pt
10. Add shutter button press animation on camera screen

### P2 -- Premium Feel
11. Add animated count-up to stat numbers
12. Pulse animation on "Tap to interact" mascot hint
13. Animated mascot stat bars on Profile screen
14. Task completion celebration micro-interactions
15. Smooth keyboard handling with react-native-keyboard-controller

### P3 -- Nice to Have
16. Last photo thumbnail in camera gallery button
17. Swipe-to-dismiss on modal screens
18. Search in Settings
19. Badge share card with shareable image
20. Streak freeze collectible item

---

## "Premium Feel" Checklist

- [x] Custom font family (DM Sans + Bricolage Grotesque)
- [x] Dark mode with proper contrast
- [x] Haptic feedback on interactions
- [x] Custom screen transitions
- [x] Floating pill tab bar with blur
- [x] Error boundaries on every screen
- [x] Accessibility labels and roles
- [x] Reduced motion support
- [x] Safe area handling
- [x] Offline indicator
- [ ] Pull-to-refresh on data screens
- [ ] Blurhash image placeholders
- [ ] Animated progress bars
- [ ] Loading skeletons everywhere
- [ ] Responsive dimensions (not static)
- [ ] Keyboard controller integration
- [ ] Confetti on all completion screens
- [ ] Count-up stat animations
