# Declutterly UI/UX Polishing Document

## Executive Summary

Declutterly demonstrates a sophisticated "Liquid Glass" UI foundation with excellent use of React Native Reanimated, expo-haptics, and themed components. The app targets ADHD-friendly design with gamification, AI-powered analysis, and a mascot companion system.

**Overall Assessment**: 8/10 - Production-ready foundation with polish needed in animation consistency, accessibility completeness, and memory safety.

**Accessibility Compliance**: 85% WCAG 2.1 AA

### Issue Counts by Severity

| Severity | Count | Category |
|----------|-------|----------|
| 🔴 Critical | 12 | Memory leaks, gesture accessibility, context architecture |
| 🟠 Major | 18 | Keyboard handling, accessibility roles, performance |
| 🟡 Minor | 35+ | Hardcoded colors, touch targets, animation polish |

### Critical Issues (Must Fix Before Launch)
1. **Memory leaks** in recursive setTimeout patterns (OverwhelmModal, Mascot, Toast, DeclutterContext)
2. **Missing KeyboardAvoidingView** on forms (Social, Join, Onboarding screens)
3. **Over-bouncy animations** (damping < 12 in several components)
4. **Missing reduced motion support** in high-intensity animations
5. **Monolithic Context** - DeclutterContext causes app-wide re-renders (performance critical)
6. **Gesture-only delete** - SwipeableTaskCard delete action inaccessible to screen readers
7. **Duplicate state management** - Mascot managed in both MascotContext AND DeclutterContext
8. **Context value instability** - MascotContext, FocusContext, AuthContext create new objects every render

### Major Issues (Should Fix)
1. Hardcoded colors throughout (~60% of components)
2. Missing `accessibilityRole="button"` on ~40% of custom Pressables
3. Touch targets below 44pt minimum on some controls
4. Inconsistent spring configurations across screens
5. Subtask checkboxes lack accessibility roles and state
6. Error messages missing `accessibilityLiveRegion`
7. Placebo refresh - pull-to-refresh doesn't actually sync
8. Remote audio URLs - sounds hosted on external CDN (offline risk)

---

## Table of Contents

1. [Animation System Issues](#1-animation-system-issues)
2. [Screen-by-Screen Issues](#2-screen-by-screen-issues)
3. [Component-Level Issues](#3-component-level-issues)
4. [Accessibility Audit](#4-accessibility-audit)
5. [Performance & Memory Safety](#5-performance--memory-safety)
6. [Theme Standardization](#6-theme-standardization)
7. [Quick Reference Fixes](#7-quick-reference-fixes)

---

## 1. Animation System Issues

### 1.1 Over-Bouncy Springs (CRITICAL)

**File**: `theme/animations.ts`
**Issue**: `SpringConfigs.bouncy` has damping: 8, which causes excessive oscillation and feels "cheap" rather than premium.

```typescript
// BEFORE (Line ~45)
bouncy: {
  damping: 8,
  stiffness: 150,
  mass: 0.8,
}

// AFTER - Apple-style refined bounce
bouncy: {
  damping: 14,
  stiffness: 180,
  mass: 0.8,
}
```

**Affected Components**:
- `components/features/Mascot.tsx` - Uses damping as low as 4-6
- `components/features/CollectibleSpawn.tsx` - Bounce animations
- `app/(tabs)/index.tsx` - Room card animations

### 1.2 Hardcoded Animation Durations

**Files**: Multiple screens use magic numbers instead of `Durations` constants.

**File**: `app/analysis.tsx` (Lines 107-127)
```typescript
// BEFORE
withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) })
withTiming(1.1, { duration: 800 })
withTiming(0.6, { duration: 1000 })

// AFTER - Use theme constants
import { Durations, Easings } from '@/theme/animations';

withTiming(1, { duration: Durations.slow, easing: Easings.easeInOut })
withTiming(1.1, { duration: Durations.normal })
withTiming(0.6, { duration: Durations.normal })
```

### 1.3 Missing Reduced Motion Support (CRITICAL)

**Files with high-intensity animations lacking reduced motion checks**:
- `app/analysis.tsx` - Scan line, pulse, glow animations
- `components/features/Mascot.tsx` - Floating, rotation, sparkles
- `components/features/CollectibleSpawn.tsx` - Particle effects
- `components/ui/Confetti.tsx` - Heavy particle system

**Fix Pattern**:
```typescript
// Add to all animated components
import { useReducedMotion } from 'react-native-reanimated';

function AnimatedComponent() {
  const reducedMotion = useReducedMotion();
  
  useEffect(() => {
    if (reducedMotion) {
      // Skip or simplify animation
      opacity.value = 1; // Instant show instead of fade
      return;
    }
    
    // Normal animation
    opacity.value = withTiming(1, { duration: Durations.normal });
  }, [reducedMotion]);
}
```

### 1.4 Spring Configuration Reference

Replace all custom springs with these standardized values:

```typescript
// theme/animations.ts - RECOMMENDED VALUES
export const SpringConfigs = {
  // For UI elements (buttons, cards, modals)
  snappy: { damping: 20, stiffness: 300, mass: 0.8 },
  
  // For gentle transitions (page transitions, reveals)
  gentle: { damping: 18, stiffness: 120, mass: 1 },
  
  // For controlled bounce (success celebrations, badges)
  bouncy: { damping: 14, stiffness: 180, mass: 0.8 },
  
  // For stiff, immediate response (toggles, checkboxes)
  stiff: { damping: 25, stiffness: 400, mass: 0.6 },
  
  // For floating/idle animations (mascot, decorative)
  float: { damping: 12, stiffness: 80, mass: 1.2 },
} as const;
```

---

## 2. Screen-by-Screen Issues

### 2.1 Home Screen (`app/(tabs)/index.tsx`)

| Line | Issue | Severity | Fix |
|------|-------|----------|-----|
| 295 | Hardcoded `#FF9500` for offline banner | Minor | Use `colors.warning` |
| 1085 | Avatar button exactly 44x44 (minimum) | Minor | Add `hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}` |
| ~850 | AddRoomModal uses custom modal instead of BottomSheet | Minor | Migrate to BottomSheet for consistency |

**Avatar Touch Target Fix**:
```tsx
// Line ~1085
<Pressable
  onPress={handleProfilePress}
  style={styles.avatarButton}
  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
  accessibilityRole="button"
  accessibilityLabel="Open profile"
>
```

### 2.2 Onboarding Screen (`app/onboarding.tsx`)

| Line | Issue | Severity | Fix |
|------|-------|----------|-----|
| 413 | Missing KeyboardAvoidingView | Major | Wrap setup form in KeyboardAvoidingView |
| 430 | TextInput missing proper keyboard handling | Minor | Add `onSubmitEditing` and `returnKeyType` |

**KeyboardAvoidingView Fix**:
```tsx
// Line ~413 - Wrap the setup content
import { KeyboardAvoidingView, Platform, Keyboard } from 'react-native';

<KeyboardAvoidingView
  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
  style={{ flex: 1 }}
  keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
>
  <ScrollView
    keyboardShouldPersistTaps="handled"
    contentContainerStyle={styles.setupContent}
  >
    {/* Setup form content */}
    <TextInput
      value={userName}
      onChangeText={setUserName}
      returnKeyType="done"
      onSubmitEditing={Keyboard.dismiss}
      placeholder="Your name"
    />
  </ScrollView>
</KeyboardAvoidingView>
```

### 2.3 Camera Screen (`app/camera.tsx`)

| Line | Issue | Severity | Fix |
|------|-------|----------|-----|
| 209 | Hardcoded gradient colors `#1a1a2e` | Minor | Move to Colors.ts |
| 737 | Capture button may be hard to hit on large screens | Minor | Add hitSlop or increase size |

### 2.4 Analysis Screen (`app/analysis.tsx`)

| Line | Issue | Severity | Fix |
|------|-------|----------|-----|
| 106-160 | No cleanup for all animation shared values | Major | Add cancelAnimation in cleanup |
| 329-333 | Hardcoded gradient colors | Minor | Use theme constants |
| 1106 | Hardcoded border radius and background | Minor | Use `colors.surface` and `BorderRadius` |

**Animation Cleanup Fix**:
```typescript
// Line ~103-160 - Already has cleanup, but verify ALL shared values are cancelled
useEffect(() => {
  if (isAnalyzing) {
    // ... animation setup ...
    
    return () => {
      clearInterval(stageInterval);
      clearInterval(progressInterval);
      // Cancel ALL animated values
      cancelAnimation(scanProgress);
      cancelAnimation(pulseScale);
      cancelAnimation(glowOpacity);
      // Reset to initial values
      scanProgress.value = 0;
      pulseScale.value = 1;
      glowOpacity.value = 0.3;
      setLoadingProgress(0);
    };
  }
}, [isAnalyzing]);
```

### 2.5 Social Screen (`app/social.tsx`)

| Line | Issue | Severity | Fix |
|------|-------|----------|-----|
| 269 | Missing KeyboardAvoidingView in CreateChallengeModal | Critical | Keyboard WILL cover inputs |
| 102 | Uses TouchableOpacity instead of Pressable + Haptics | Minor | Migrate for consistency |

**CreateChallengeModal Fix**:
```tsx
// Line ~269
<Modal visible={showCreateModal} animationType="slide">
  <KeyboardAvoidingView
    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    style={{ flex: 1 }}
  >
    <ScrollView
      contentContainerStyle={styles.modalContent}
      keyboardShouldPersistTaps="handled"
    >
      {/* Form inputs */}
    </ScrollView>
  </KeyboardAvoidingView>
</Modal>
```

### 2.6 Join Screen (`app/join.tsx`)

| Line | Issue | Severity | Fix |
|------|-------|----------|-----|
| 224 | Missing KeyboardAvoidingView for code entry | Major | Add KeyboardAvoidingView |

### 2.7 Focus Screen (`app/focus.tsx`)

| Line | Issue | Severity | Fix |
|------|-------|----------|-----|
| 597 | Hardcoded background hex strings | Minor | Move to `FocusColors` constant |

**Add FocusColors to Colors.ts**:
```typescript
// constants/Colors.ts
export const FocusColors = {
  gradientPurple: ['#667eea', '#764ba2'] as const,
  gradientGreen: ['#11998e', '#38ef7d'] as const,
  gradientOrange: ['#f093fb', '#f5576c'] as const,
  gradientBlue: ['#4facfe', '#00f2fe'] as const,
} as const;
```

### 2.8 Progress Screen (`app/(tabs)/progress.tsx`)

| Line | Issue | Severity | Fix |
|------|-------|----------|-----|
| 510 | Spring damping: 12 is borderline | Minor | Increase to 15 for smoother feel |
| 743-756 | `getTypeColor` uses hardcoded hex | Minor | Map to Colors constants |

**getTypeColor Fix**:
```typescript
// Line ~743 - Replace with themed version
function getTypeColor(type: string, colors: typeof Colors.dark): string {
  switch (type) {
    case 'tasks': return colors.error; // or add BadgeTypeColors
    case 'rooms': return colors.success;
    case 'streak': return colors.warning;
    case 'time': return colors.info;
    default: return colors.primary;
  }
}

// Or add to Colors.ts:
export const BadgeTypeColors = {
  tasks: '#F87171',
  rooms: '#34D399',
  streak: '#FBBF24',
  time: '#60A5FA',
  default: '#A78BFA',
} as const;
```

### 2.9 Room Detail Screen (`app/room/[id].tsx`)

| Line | Issue | Severity | Fix |
|------|-------|----------|-----|
| 412 | `celebrationOverlay` hardcodes `dark` tint | Minor | Use `colorScheme` variable |
| 947 | FAB may conflict with safe area | Minor | Add `insets.bottom` to bottom offset |

**FAB Position Fix**:
```tsx
// Line ~947
const fabStyle = useMemo(() => ({
  position: 'absolute' as const,
  bottom: insets.bottom + 100, // Account for tab bar + safe area
  right: 20,
}), [insets.bottom]);
```

### 2.10 Insights Screen (`app/insights.tsx`)

| Line | Issue | Severity | Fix |
|------|-------|----------|-----|
| 57 | Bar chart lacks accessibility labels | Major | Add accessibilityLabel to ChartBar |

**Chart Accessibility Fix**:
```tsx
// In ChartBar component
<View
  accessibilityRole="image"
  accessibilityLabel={`${label}: ${value} ${unit || 'tasks'}`}
>
  {/* Bar visualization */}
</View>
```

### 2.11 Auth Screens

**Login (`app/auth/login.tsx`)**:
| Line | Issue | Severity | Fix |
|------|-------|----------|-----|
| 259 | Eye icon button has small touch area | Minor | Add hitSlop |

**Signup (`app/auth/signup.tsx`)**:
| Line | Issue | Severity | Fix |
|------|-------|----------|-----|
| 326 | Password strength indicator missing accessibility | Major | Add progressbar role |

```tsx
// Line ~326
<View
  accessibilityRole="progressbar"
  accessibilityValue={{ min: 0, max: 4, now: passwordStrength }}
  accessibilityLabel={`Password strength: ${strengthLabels[passwordStrength]}`}
>
  {/* Strength indicator bars */}
</View>
```

---

## 3. Component-Level Issues

### 3.1 BottomSheet (`components/ui/BottomSheet.tsx`)

| Line | Issue | Severity | Fix |
|------|-------|----------|-----|
| 31 | `MAX_TRANSLATE_Y` doesn't account for dynamic safe area | Major | Use `useSafeAreaInsets` |

```typescript
// Line ~31
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function BottomSheet({ ... }) {
  const insets = useSafeAreaInsets();
  const MAX_TRANSLATE_Y = -SCREEN_HEIGHT + insets.top + 50;
  // ...
}
```

### 3.2 ActionSheet (`components/ui/ActionSheet.tsx`)

| Line | Issue | Severity | Fix |
|------|-------|----------|-----|
| 162 | Actions missing `accessibilityRole="button"` | Major | Add to all Pressable actions |

```tsx
// Line ~162
<Pressable
  onPress={action.onPress}
  accessibilityRole="button"
  accessibilityLabel={action.label}
  accessibilityHint={action.destructive ? 'This action cannot be undone' : undefined}
>
```

### 3.3 Toast (`components/ui/Toast.tsx`)

| Line | Issue | Severity | Fix |
|------|-------|----------|-----|
| 149 | `hideTimer` not cleared on unmount | Minor | Use useRef and cleanup |

```typescript
// Line ~149
const hideTimerRef = useRef<NodeJS.Timeout>();

useEffect(() => {
  // ... show logic ...
  
  hideTimerRef.current = setTimeout(() => {
    // hide logic
  }, duration);
  
  return () => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
    }
  };
}, []);
```

### 3.4 Chip (`components/ui/Chip.tsx`)

| Line | Issue | Severity | Fix |
|------|-------|----------|-----|
| 130-143 | Small/Medium sizes below 44pt minimum | Major | Add hitSlop or increase size |

```tsx
// Line ~130
<Pressable
  style={[styles.chip, sizeStyles[size]]}
  hitSlop={size === 'small' ? { top: 8, bottom: 8, left: 4, right: 4 } : undefined}
  accessibilityRole="button"
>
```

### 3.5 OverwhelmModal (`components/room/OverwhelmModal.tsx`)

| Line | Issue | Severity | Fix |
|------|-------|----------|-----|
| 35-59 | Recursive setTimeout without cleanup | Critical | Use ref for timer, clear on unmount |

```typescript
// Line ~35
const breathTimerRef = useRef<NodeJS.Timeout>();

const runBreathCycle = useCallback(() => {
  // ... breath logic ...
  
  breathTimerRef.current = setTimeout(() => {
    runBreathCycle();
  }, 4000);
}, []);

useEffect(() => {
  if (isVisible) {
    runBreathCycle();
  }
  
  return () => {
    if (breathTimerRef.current) {
      clearTimeout(breathTimerRef.current);
    }
  };
}, [isVisible, runBreathCycle]);
```

### 3.6 Mascot (`components/features/Mascot.tsx`)

| Line | Issue | Severity | Fix |
|------|-------|----------|-----|
| 227-238 | Hardcoded sparkle colors | Minor | Use theme constants |
| Various | Missing reduced motion support | Major | Add useReducedMotion check |
| Various | Animation cleanup incomplete | Critical | Cancel all animations on unmount |

**Mascot Animation Cleanup Pattern**:
```typescript
useEffect(() => {
  const floatAnimation = () => {
    if (reducedMotion) return;
    
    floatY.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 2000 }),
        withTiming(10, { duration: 2000 })
      ),
      -1,
      true
    );
  };
  
  floatAnimation();
  
  return () => {
    cancelAnimation(floatY);
    cancelAnimation(rotation);
    cancelAnimation(scale);
    // Reset to prevent stale values
    floatY.value = 0;
    rotation.value = 0;
    scale.value = 1;
  };
}, [reducedMotion]);
```

### 3.7 TaskCard (`components/room/TaskCard.tsx`)

| Line | Issue | Severity | Fix |
|------|-------|----------|-----|
| 28-36 | Energy colors hardcoded | Minor | Add to Colors.ts |

```typescript
// constants/Colors.ts
export const EnergyColors = {
  minimal: '#34D399', // Green
  light: '#60A5FA',   // Blue
  moderate: '#FBBF24', // Amber
  significant: '#F97316', // Orange
  intense: '#EF4444', // Red
} as const;
```

### 3.8 DecisionPointModal (`components/room/DecisionPointModal.tsx`)

| Line | Issue | Severity | Fix |
|------|-------|----------|-----|
| 32 | 5-second auto-select too fast for accessibility | Major | Check screen reader, increase/disable |

```typescript
// Line ~32
import { AccessibilityInfo } from 'react-native';

useEffect(() => {
  let timer: NodeJS.Timeout;
  
  const checkAccessibility = async () => {
    const isScreenReaderEnabled = await AccessibilityInfo.isScreenReaderEnabled();
    
    if (!isScreenReaderEnabled) {
      timer = setTimeout(() => {
        handleAutoSelect();
      }, 5000);
    }
    // If screen reader is enabled, don't auto-select
  };
  
  checkAccessibility();
  
  return () => {
    if (timer) clearTimeout(timer);
  };
}, []);
```

### 3.9 OnboardingTooltip (`components/ui/OnboardingTooltip.tsx`)

| Line | Issue | Severity | Fix |
|------|-------|----------|-----|
| 224-234 | Position calculation doesn't account for Dynamic Island | Minor | Use useSafeAreaFrame |

---

## 4. Accessibility Audit

### 4.1 Missing Accessibility Roles

Add `accessibilityRole="button"` to ALL interactive Pressables:

```typescript
// Pattern to apply everywhere
<Pressable
  onPress={handlePress}
  accessibilityRole="button"
  accessibilityLabel="Descriptive label"
  accessibilityHint="What happens when activated"
>
```

**Files needing this fix**:
- `components/ui/ActionSheet.tsx` - Action buttons
- `components/ui/OnboardingTooltip.tsx` - Tooltip buttons  
- `components/room/TaskModal.tsx` - Modal actions
- `app/achievements.tsx` - Badge cards
- Multiple screens with custom buttons

### 4.2 Missing Progress Bar Accessibility

All progress indicators need:
```tsx
<View
  accessibilityRole="progressbar"
  accessibilityValue={{ min: 0, max: 100, now: progressPercent }}
  accessibilityLabel={`Progress: ${progressPercent}%`}
>
```

**Files needing this**:
- `app/auth/signup.tsx` - Password strength
- `app/insights.tsx` - Chart bars
- `app/(tabs)/progress.tsx` - Already has good patterns (use as reference)

### 4.3 Emoji Accessibility

Emojis should be hidden from screen readers when decorative:
```tsx
<Text accessibilityElementsHidden>🎉</Text>
```

Or include in parent's accessibilityLabel when semantic.

**Good Example** (from progress.tsx):
```tsx
<View accessibilityLabel={`${label}: ${value}, ${description}`}>
  <Text accessibilityElementsHidden>{emoji}</Text>
  {/* content */}
</View>
```

### 4.4 Touch Target Checklist

Ensure ALL interactive elements are at least 44x44pt:

| Component | Current Size | Fix |
|-----------|--------------|-----|
| Eye icon (auth screens) | ~24x24 | Add hitSlop 10 |
| Chip (small) | 28px height | Add hitSlop 8 |
| Back buttons | 44x44 | OK |
| Filter chips | Variable | Verify padding |

---

## 5. Performance & Memory Safety

### 5.1 Memory Leak Patterns to Fix

**Pattern 1: Recursive setTimeout**
```typescript
// BAD
const runCycle = () => {
  // ... logic ...
  setTimeout(runCycle, 1000);
};

// GOOD
const timerRef = useRef<NodeJS.Timeout>();

const runCycle = useCallback(() => {
  // ... logic ...
  timerRef.current = setTimeout(runCycle, 1000);
}, []);

useEffect(() => {
  runCycle();
  return () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  };
}, [runCycle]);
```

**Affected Files**:
- `components/room/OverwhelmModal.tsx` - Breathing cycle
- `components/features/Mascot.tsx` - Idle animations
- `components/ui/Toast.tsx` - Hide timer
- `context/DeclutterContext.tsx` - Various timers

### 5.2 Context Re-render Optimization

**File**: `context/DeclutterContext.tsx`

The "God Context" pattern causes unnecessary re-renders. Consider splitting:

```typescript
// Option 1: Split into specialized contexts
const RoomsContext = createContext<RoomsContextType | null>(null);
const UserStatsContext = createContext<UserStatsContextType | null>(null);
const MascotContext = createContext<MascotContextType | null>(null);

// Option 2: Use React.memo on consuming components
const RoomCard = React.memo(({ room }: { room: Room }) => {
  // Only re-renders when room prop changes
});

// Option 3: Use useMemo for derived state
const completedRooms = useMemo(
  () => rooms.filter(r => r.currentProgress === 100),
  [rooms]
);
```

### 5.3 Animation Shared Value Cleanup

Every component using `useSharedValue` should cancel animations on unmount:

```typescript
useEffect(() => {
  // Animation setup
  scale.value = withRepeat(/* ... */);
  
  return () => {
    // ALWAYS cancel
    cancelAnimation(scale);
    // Optionally reset
    scale.value = 1;
  };
}, []);
```

---

## 6. Theme Standardization

### 6.1 Color Token Audit

**Files with hardcoded colors to fix**:

| File | Hardcoded Value | Replace With |
|------|-----------------|--------------|
| analysis.tsx:329 | `#A78BFA` | `colors.primary` |
| focus.tsx:597 | `#667eea` | `FocusColors.gradientPurple[0]` |
| camera.tsx:209 | `#1a1a2e` | `colors.backgroundDeep` |
| progress.tsx:292 | `#FB923C` | `colors.warning` |
| TaskCard.tsx:28 | Energy hex values | `EnergyColors.minimal` etc. |

### 6.2 New Color Constants to Add

```typescript
// constants/Colors.ts - Add these

export const FocusColors = {
  gradientPurple: ['#667eea', '#764ba2'] as readonly [string, string],
  gradientGreen: ['#11998e', '#38ef7d'] as readonly [string, string],
  gradientOrange: ['#f093fb', '#f5576c'] as readonly [string, string],
  gradientBlue: ['#4facfe', '#00f2fe'] as readonly [string, string],
} as const;

export const EnergyColors = {
  minimal: '#34D399',
  light: '#60A5FA',
  moderate: '#FBBF24',
  significant: '#F97316',
  intense: '#EF4444',
} as const;

export const BadgeTypeColors = {
  tasks: '#F87171',
  rooms: '#34D399',
  streak: '#FBBF24',
  time: '#60A5FA',
  default: '#A78BFA',
} as const;

export const MascotColors = {
  happy: '#34D399',
  neutral: '#60A5FA',
  sleepy: '#A78BFA',
  hungry: '#FBBF24',
  sad: '#F87171',
} as const;
```

### 6.3 Spacing Consistency

Replace all hardcoded spacing with `Spacing` constants:

```typescript
// BAD
marginTop: 4
padding: 16
gap: 8

// GOOD
import { Spacing } from '@/theme/spacing';

marginTop: Spacing.xxs  // 4
padding: Spacing.md     // 16
gap: Spacing.sm         // 8
```

---

## 7. Quick Reference Fixes

### 7.1 One-Line Fixes

```typescript
// Add hitSlop to small buttons
hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}

// Add accessibility role
accessibilityRole="button"

// Cancel animation on unmount
useEffect(() => () => cancelAnimation(sharedValue), []);

// Use theme color
backgroundColor: colors.surfaceSecondary // instead of rgba(...)

// Add reduced motion check
const reducedMotion = useReducedMotion();
if (reducedMotion) return;
```

### 7.2 Import Checklist for New Files

```typescript
// Animation system
import { SpringConfigs, Durations, Easings } from '@/theme/animations';
import { useReducedMotion, cancelAnimation } from 'react-native-reanimated';

// Theme system
import { Colors } from '@/constants/Colors';
import { Typography } from '@/theme/typography';
import { Spacing, BorderRadius } from '@/theme/spacing';

// Accessibility
import { AccessibilityInfo } from 'react-native';

// Safe areas
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Haptics
import * as Haptics from 'expo-haptics';
```

### 7.3 Component Checklist

Before shipping any component, verify:

- [ ] All Pressables have `accessibilityRole="button"`
- [ ] Touch targets are >= 44x44pt (or have hitSlop)
- [ ] Animations check `useReducedMotion`
- [ ] All timeouts are cleared on unmount
- [ ] All shared values are cancelled on unmount
- [ ] Colors use theme constants, not hardcoded hex
- [ ] Springs use `SpringConfigs`, not custom values
- [ ] Forms have KeyboardAvoidingView

---

## Appendix: File-by-File Priority

### Critical (Fix Before Launch)
1. `components/room/OverwhelmModal.tsx` - Memory leak
2. `app/social.tsx` - KeyboardAvoidingView
3. `app/join.tsx` - KeyboardAvoidingView
4. `components/features/Mascot.tsx` - Animation cleanup + reduced motion

### High Priority (Fix Soon)
5. `app/onboarding.tsx` - KeyboardAvoidingView
6. `theme/animations.ts` - Update SpringConfigs.bouncy
7. `components/ui/ActionSheet.tsx` - Accessibility roles
8. `app/insights.tsx` - Chart accessibility
9. `app/auth/signup.tsx` - Password strength accessibility

### Medium Priority (Polish)
10. All hardcoded color replacements
11. All hitSlop additions for small buttons
12. Context splitting for performance

### Low Priority (Nice to Have)
13. Migrate remaining TouchableOpacity to Pressable
14. Additional skeleton loading states
15. Animation duration standardization

---

---

## 8. Architecture & Context Issues (CRITICAL)

### 8.1 Monolithic Context Anti-Pattern

**File**: `context/DeclutterContext.tsx`
**Line**: 84
**Severity**: CRITICAL
**Issue**: Single "God Context" manages User, Rooms, Stats, Settings, Mascot, and Collection. ANY state change triggers re-render of EVERY consumer.

```typescript
// PROBLEM: All these in one context
{
  user, rooms, stats, settings, mascot, collection,
  activeRoomId, focusSession, ...
}

// SOLUTION: Split into specialized contexts
// context/DataContext.tsx - Low frequency updates
export const DataContext = createContext<{
  user: User | null;
  rooms: Room[];
  updateRoom: (id: string, updates: Partial<Room>) => void;
} | null>(null);

// context/UIContext.tsx - Medium frequency updates
export const UIContext = createContext<{
  settings: Settings;
  activeRoomId: string | null;
  setActiveRoomId: (id: string | null) => void;
} | null>(null);

// context/GameContext.tsx - High frequency updates (mascot, stats)
export const GameContext = createContext<{
  stats: UserStats;
  mascot: Mascot | null;
  collection: CollectedItem[];
  feedMascot: () => void;
  collectItem: (item: CollectedItem) => void;
} | null>(null);
```

### 8.2 Duplicate State Management

**Files**: `context/DeclutterContext.tsx` + `context/MascotContext.tsx`
**Severity**: CRITICAL
**Issue**: Mascot state exists in BOTH contexts, causing sync issues and double memory usage.

```typescript
// FILE: context/MascotContext.tsx - LINE 17
// This duplicates mascot from DeclutterContext!

// FIX: Choose ONE source of truth
// Option A: Remove MascotContext entirely, use DeclutterContext
// Option B: Remove mascot from DeclutterContext, use MascotContext exclusively

// If keeping MascotContext, remove from DeclutterContext:
// DELETE these lines from DeclutterContext.tsx:
// - mascot state (line ~95)
// - setMascot (line ~96)
// - feedMascotAction (lines 467-480)
// - interactWithMascot (lines 829-840)
```

**Same issue with Focus**:
- `context/FocusContext.tsx` LINE 17
- `context/DeclutterContext.tsx` also manages focus session

### 8.3 Context Value Reference Instability

**Files**: Multiple contexts create new objects every render

```typescript
// BAD - MascotContext.tsx LINE 185
return (
  <MascotContext.Provider value={{ mascot, feedMascot, interactWithMascot }}>
    {children}
  </MascotContext.Provider>
);

// GOOD - Memoize the value
const value = useMemo(() => ({
  mascot,
  feedMascot,
  interactWithMascot,
}), [mascot, feedMascot, interactWithMascot]);

return (
  <MascotContext.Provider value={value}>
    {children}
  </MascotContext.Provider>
);
```

**Apply to**:
- `context/MascotContext.tsx` LINE 185
- `context/FocusContext.tsx` LINE 82
- `context/AuthContext.tsx` LINE 363

### 8.4 Persistence Strategy Issues

**File**: `context/DeclutterContext.tsx`
**Line**: 133
**Severity**: CRITICAL
**Issue**: Persisting ENTIRE app state to AsyncStorage on EVERY change.

```typescript
// PROBLEM - Saves everything on any change
useEffect(() => {
  saveToStorage({ rooms, stats, settings, mascot, collection });
}, [rooms, stats, settings, mascot, collection]);

// FIX 1: Debounce writes
const debouncedSave = useMemo(
  () => debounce((data) => saveToStorage(data), 1000),
  []
);

useEffect(() => {
  debouncedSave({ rooms, stats, settings, mascot, collection });
  return () => debouncedSave.cancel();
}, [rooms, stats, settings, mascot, collection, debouncedSave]);

// FIX 2: Save only changed keys
useEffect(() => {
  saveToStorage('rooms', rooms);
}, [rooms]);

useEffect(() => {
  saveToStorage('stats', stats);
}, [stats]);
// etc.
```

### 8.5 Global Mutable Variables

**File**: `hooks/useColorScheme.ts`
**Line**: 8
**Severity**: MAJOR
**Issue**: `_forcedColorScheme` is a global mutable variable. Components won't re-render when it changes.

```typescript
// PROBLEM
let _forcedColorScheme: ColorSchemeName | null = null;

export function setForcedColorScheme(scheme: ColorSchemeName | null) {
  _forcedColorScheme = scheme;
}

// FIX: Use React Context or a reactive store
// theme/ThemeProvider.tsx
export const ThemeContext = createContext<{
  colorScheme: ColorSchemeName;
  setColorScheme: (scheme: ColorSchemeName) => void;
} | null>(null);
```

**Same issue in**:
- `services/haptics.ts` LINE 3 - `hapticsEnabled` global variable
- `theme/ThemeProvider.tsx` LINE 63 - Side-effect `setForcedColorScheme` call

---

## 9. Comprehensive Accessibility Audit (WCAG 2.1 AA)

### 9.1 Critical Accessibility Issues

#### Gesture-Only Delete (WCAG 2.5.1 - Pointer Gestures)

**File**: `components/room/TaskCard.tsx`
**Lines**: 62-147 (SwipeableTaskCard)
**Severity**: CRITICAL
**Issue**: Deleting a task REQUIRES swiping. No alternative for users who cannot perform gestures.

```tsx
// PROBLEM: Only way to delete is swipe
<Swipeable
  renderRightActions={renderRightActions}
  onSwipeableOpen={handleDelete}
>
  {/* Task content */}
</Swipeable>

// FIX: Add accessible delete button in expanded view
const TaskCard = ({ task, onDelete, ...props }) => {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <Swipeable {...swipeableProps}>
      <Pressable onPress={() => setExpanded(!expanded)}>
        {/* Task content */}
      </Pressable>
      
      {expanded && (
        <View style={styles.expandedActions}>
          <Pressable
            onPress={() => onDelete(task.id)}
            accessibilityRole="button"
            accessibilityLabel={`Delete task: ${task.title}`}
            accessibilityHint="Double tap to delete this task"
          >
            <Text>Delete</Text>
          </Pressable>
        </View>
      )}
    </Swipeable>
  );
};
```

#### Subtask Checkboxes Missing Semantics (WCAG 4.1.2)

**File**: `components/room/TaskCard.tsx`
**Lines**: 458-488
**Severity**: CRITICAL
**Issue**: Subtask items are `Pressable` but lack role, label, and state.

```tsx
// PROBLEM - Line 458-488
{subtasks.map((st) => (
  <Pressable
    key={st.id}
    onPress={() => toggleSubtask(st.id)}
  >
    <View style={[styles.checkbox, st.completed && styles.checked]} />
    <Text>{st.title}</Text>
  </Pressable>
))}

// FIX
{subtasks.map((st) => (
  <Pressable
    key={st.id}
    onPress={() => toggleSubtask(st.id)}
    accessibilityRole="checkbox"
    accessibilityState={{ checked: st.completed }}
    accessibilityLabel={st.title}
    accessibilityHint={st.completed ? "Double tap to mark incomplete" : "Double tap to complete"}
  >
    <View style={[styles.checkbox, st.completed && styles.checked]} />
    <Text>{st.title}</Text>
  </Pressable>
))}
```

#### AnimatedCheckbox Missing State (WCAG 4.1.2)

**File**: `components/room/TaskCard.tsx`
**Line**: 149
**Severity**: MAJOR

```tsx
// FIX AnimatedCheckbox
<AnimatedPressable
  onPress={onToggle}
  accessibilityRole="checkbox"
  accessibilityState={{ checked: completed }}
  accessibilityLabel={`${taskTitle} - ${completed ? 'completed' : 'not completed'}`}
>
```

### 9.2 Major Accessibility Issues

#### Error Messages Not Announced (WCAG 1.3.1)

**File**: `app/auth/login.tsx`
**Lines**: 172-190
**Issue**: Error messages appear but screen readers don't announce them.

```tsx
// PROBLEM
<Animated.View style={errorAnimatedStyle}>
  <Text style={styles.errorText}>{errorMessage}</Text>
</Animated.View>

// FIX
<Animated.View 
  style={errorAnimatedStyle}
  accessibilityLiveRegion="polite"
  accessibilityRole="alert"
>
  <Text style={styles.errorText}>{errorMessage}</Text>
</Animated.View>
```

**Apply to all error containers in**:
- `app/auth/login.tsx`
- `app/auth/signup.tsx`
- `app/auth/forgot-password.tsx`
- `app/join.tsx`

#### Missing Link Roles (WCAG 2.4.4)

**File**: `app/auth/login.tsx`
**Lines**: 292, 408
**Issue**: "Forgot password?" and "Sign Up" are not identified as links.

```tsx
// PROBLEM
<TouchableOpacity onPress={handleForgotPassword}>
  <Text>Forgot password?</Text>
</TouchableOpacity>

// FIX
<TouchableOpacity 
  onPress={handleForgotPassword}
  accessibilityRole="link"
  accessibilityLabel="Forgot password"
  accessibilityHint="Opens password reset page"
>
  <Text>Forgot password?</Text>
</TouchableOpacity>
```

#### Color Contrast Issue (WCAG 1.4.3)

**File**: `constants/Colors.ts`
**Lines**: 10-150
**Issue**: `textMuted` (#8E8E93) on white has 3.23:1 ratio (needs 4.5:1).

```typescript
// PROBLEM
textMuted: '#8E8E93',

// FIX - Darken to meet 4.5:1
textMuted: '#767676', // 4.54:1 on white
```

### 9.3 Minor Accessibility Issues

#### Double Announcement in Settings

**File**: `app/settings.tsx`
**Lines**: 271-298
**Issue**: Parent `View` and child `Switch` both have accessibility labels.

```tsx
// FIX: Remove label from inner Switch
<View
  accessibilityRole="switch"
  accessibilityState={{ checked: value }}
  accessibilityLabel={label}
>
  <Text>{label}</Text>
  <Switch 
    value={value} 
    onValueChange={onValueChange}
    // Remove accessibilityLabel here
  />
</View>
```

### 9.4 Accessibility Checklist

| Component | Role | State | Label | Hint | Status |
|-----------|------|-------|-------|------|--------|
| GlassButton | ✅ | ✅ | ✅ | ❌ | Good |
| TaskCard checkbox | ❌ | ❌ | ❌ | ❌ | **CRITICAL** |
| Subtask checkbox | ❌ | ❌ | ❌ | ❌ | **CRITICAL** |
| SwipeableTaskCard delete | N/A | N/A | N/A | N/A | **CRITICAL** (no alternative) |
| ActionSheet actions | ❌ | ✅ | ❌ | ❌ | Major |
| BottomSheet | ❌ modal | N/A | ❌ | N/A | Major |
| BeforeAfterSlider | ❌ adjustable | ❌ | ❌ | ❌ | Major |
| Error messages | N/A | N/A | N/A | N/A | Major (no live region) |

---

## 10. Performance & Memory Deep Dive

### 10.1 Critical Memory Leaks

#### Uncleaned Timeouts in Context Actions

**File**: `context/DeclutterContext.tsx`
**Severity**: CRITICAL

| Line | Function | Issue |
|------|----------|-------|
| 467 | `feedMascotAction` | setTimeout never cleared |
| 829 | `interactWithMascot` | setTimeout never cleared |
| 889 | `endFocusSession` | setTimeout never cleared |
| 950 | `collectItem` | setTimeout never cleared |

```typescript
// FIX: Add timeout refs and cleanup

// At top of component
const feedTimeoutRef = useRef<NodeJS.Timeout>();
const interactTimeoutRef = useRef<NodeJS.Timeout>();
const focusTimeoutRef = useRef<NodeJS.Timeout>();
const collectTimeoutRef = useRef<NodeJS.Timeout>();

// In feedMascotAction (line 467)
const feedMascotAction = useCallback(() => {
  if (!mascot) return;
  // ... state updates ...

  // Clear existing timeout
  if (feedTimeoutRef.current) clearTimeout(feedTimeoutRef.current);

  // Set new timeout with ref
  feedTimeoutRef.current = setTimeout(() => {
    setMascot(prev => prev ? { ...prev, activity: 'idle' } : null);
  }, 2000);
}, [mascot]);

// In cleanup useEffect
useEffect(() => {
  return () => {
    if (feedTimeoutRef.current) clearTimeout(feedTimeoutRef.current);
    if (interactTimeoutRef.current) clearTimeout(interactTimeoutRef.current);
    if (focusTimeoutRef.current) clearTimeout(focusTimeoutRef.current);
    if (collectTimeoutRef.current) clearTimeout(collectTimeoutRef.current);
  };
}, []);
```

#### Same Issue in MascotContext

**File**: `context/MascotContext.tsx`
**Lines**: 158, 176
**Issue**: `feedMascot` and `interactWithMascot` have uncleaned timeouts.

#### Async State Updates After Unmount

**File**: `app/analysis.tsx`
**Lines**: 198-230
**Issue**: If user navigates away during analysis, `setResult` fires on unmounted component.

```typescript
// FIX: Add isMounted check
const isMountedRef = useRef(true);

useEffect(() => {
  return () => {
    isMountedRef.current = false;
  };
}, []);

const runAnalysis = async () => {
  try {
    const result = await analyzeRoomImage(imageUri);
    
    // Only update if still mounted
    if (isMountedRef.current) {
      setResult(result);
      setIsAnalyzing(false);
    }
  } catch (error) {
    if (isMountedRef.current) {
      setError(error.message);
    }
  }
};
```

#### Interval Collision in Focus Screen

**File**: `app/focus.tsx`
**Line**: 440
**Issue**: `startBreak` sets interval without clearing existing one.

```typescript
// PROBLEM
const startBreak = () => {
  breakTimerRef.current = setInterval(() => {
    // ...
  }, 1000);
};

// FIX
const startBreak = () => {
  // Clear existing interval first
  if (breakTimerRef.current) {
    clearInterval(breakTimerRef.current);
  }
  
  breakTimerRef.current = setInterval(() => {
    // ...
  }, 1000);
};
```

### 10.2 Performance Optimizations

#### Expensive Computation Every Render

**File**: `app/room/[id].tsx`
**Line**: 188
**Issue**: `tasksByPriority` filters task list 3 times (O(3N)).

```typescript
// PROBLEM - 3 separate filter passes
const tasksByPriority = {
  high: filteredTasks.filter(t => t.priority === 'high'),
  medium: filteredTasks.filter(t => t.priority === 'medium'),
  low: filteredTasks.filter(t => t.priority === 'low'),
};

// FIX - Single reduce pass O(N)
const tasksByPriority = useMemo(() => {
  const acc: Record<string, Task[]> = { high: [], medium: [], low: [] };
  for (const task of filteredTasks) {
    acc[task.priority].push(task);
  }
  return acc;
}, [filteredTasks]);
```

#### Inefficient Context Updates

**File**: `context/DeclutterContext.tsx`
**Line**: 529
**Issue**: `toggleTask` iterates ALL rooms and ALL tasks.

```typescript
// PROBLEM
setRooms(prev => prev.map(r => ({
  ...r,
  tasks: r.tasks.map(t => 
    t.id === taskId ? { ...t, completed: !t.completed } : t
  )
})));

// FIX - Early return optimization
setRooms(prev => prev.map(r => {
  if (r.id !== roomId) return r; // Skip rooms that don't contain this task
  
  return {
    ...r,
    tasks: r.tasks.map(t => 
      t.id === taskId ? { ...t, completed: !t.completed } : t
    )
  };
}));
```

#### Array Creation Every Render

**File**: `app/focus.tsx`
**Line**: 577
**Issue**: `particles` array created on every render.

```typescript
// PROBLEM
const particles = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  x: Math.random() * width,
  y: Math.random() * height,
}));

// FIX - Memoize or move outside component
const particles = useMemo(() => 
  Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * width,
    y: Math.random() * height,
  })),
  [width, height]
);
```

### 10.3 Performance Action Items

| Priority | File | Line | Action |
|----------|------|------|--------|
| 🔴 High | `context/MascotContext.tsx` | 185 | Memoize `value` object |
| 🔴 High | `context/DeclutterContext.tsx` | 467,829,889,950 | Fix setTimeout leaks |
| 🔴 High | `app/analysis.tsx` | 198-230 | Add `isMounted` check |
| 🟠 Medium | `app/room/[id].tsx` | 188 | Single-pass task grouping |
| 🟠 Medium | `app/focus.tsx` | 577 | Memoize particles array |
| 🟠 Medium | `app/focus.tsx` | 440 | Clear interval before setting |
| 🟡 Low | `context/AuthContext.tsx` | 363 | Memoize `value` object |
| 🟡 Low | `context/FocusContext.tsx` | 82 | Memoize `value` object |

---

## 11. Error Handling & Edge Cases

### 11.1 Error Handling Score: 9/10

The app demonstrates excellent resilience with global error boundaries and safe failure modes. The "cinematic" loading states mask API latency well.

### 11.2 Issues Found

#### Placebo Refresh (MAJOR)

**File**: `app/room/[id].tsx`
**Issue**: Pull-to-refresh waits 1 second but doesn't actually sync.

```typescript
// PROBLEM
const onRefresh = useCallback(() => {
  setRefreshing(true);
  setTimeout(() => setRefreshing(false), 1000);
}, []);

// FIX
const { syncToCloud } = useAuth();

const onRefresh = useCallback(async () => {
  setRefreshing(true);
  try {
    await syncToCloud({ rooms, stats, settings });
  } catch (e) {
    console.error('Sync failed:', e);
    // Optionally show toast
  } finally {
    setRefreshing(false);
  }
}, [syncToCloud, rooms, stats, settings]);
```

#### Silent AI Parse Failure (MEDIUM)

**File**: `services/gemini.ts` (or `services/zai.ts`)
**Issue**: Returns default tasks if JSON parsing fails - user sees generic tasks.

```typescript
// CURRENT - Silent failure
} catch (error) {
  return getDefaultTasks();
}

// FIX - Log in dev, inform user
} catch (error) {
  if (__DEV__) {
    console.error('AI Parse Failed:', error);
  }
  return { 
    ...getDefaultTasks(), 
    summary: "We had trouble reading the exact details, but here's a starting plan." 
  };
}
```

#### Temporary Photo URI Fallback (LOW)

**File**: `services/storage.ts`
**Line**: 59
**Issue**: If `persistPhotoLocally` fails, it returns the cache URI which may be cleared.

```typescript
// FIX - Mark for retry
export async function persistPhotoLocally(tempUri: string): Promise<string> {
  try {
    // ... existing copy logic ...
  } catch (error) {
    console.error('Failed to persist photo:', error);
    // TODO: Add to "needs_backup" queue for retry
    return tempUri;
  }
}
```

### 11.3 Remote Asset Risk

**File**: `services/audio.ts`
**Line**: 12
**Severity**: MAJOR
**Issue**: Sound files hosted on mixkit.co CDN. App will fail offline or if CDN is down.

```typescript
// PROBLEM
const SOUNDS = {
  success: 'https://assets.mixkit.co/...',
  complete: 'https://assets.mixkit.co/...',
};

// FIX: Bundle locally
// 1. Download sounds to assets/sounds/
// 2. Use require()
const SOUNDS = {
  success: require('@/assets/sounds/success.mp3'),
  complete: require('@/assets/sounds/complete.mp3'),
};
```

### 11.4 Recommended ErrorBoundary Additions

Current boundaries:
- ✅ Global: `app/_layout.tsx`
- ✅ Analysis: `app/analysis.tsx`

**Add boundaries to**:
- `components/room/TaskCard.tsx` - Complex swipeable, prevents list crash
- `components/features/Mascot.tsx` - Animation-heavy, isolate failures

```tsx
// components/SafeTaskCard.tsx
import { ErrorBoundary } from '@/components/ErrorBoundary';

export function SafeTaskCard(props: TaskCardProps) {
  return (
    <ErrorBoundary fallback={<TaskCardErrorFallback />}>
      <TaskCard {...props} />
    </ErrorBoundary>
  );
}
```

---

## 12. Theme System Improvements

### 12.1 Missing Theme Tokens

Add these to `constants/Colors.ts`:

```typescript
// Semantic tokens to add
export const SemanticColors = {
  // Form elements
  placeholder: '#8E8E93',
  inputBackground: 'rgba(255,255,255,0.08)',
  
  // Overlays
  overlay: 'rgba(0,0,0,0.5)',
  overlayLight: 'rgba(0,0,0,0.3)',
  
  // Semantic aliases
  destructive: '#EF4444', // Alias for danger
  tint: '#A78BFA', // Global tint (matches primary)
} as const;
```

### 12.2 Typography System Gap

**File**: `theme/typography.ts`
**Line**: 8
**Issue**: Hardcoded 'System'/'Roboto' ignores custom fonts in `assets/fonts`.

```typescript
// PROBLEM
fontFamily: Platform.select({
  ios: 'System',
  android: 'Roboto',
}),

// FIX - Support custom fonts
import { useFonts } from 'expo-font';

export const Typography = {
  fontFamily: {
    regular: Platform.select({
      ios: 'System',
      android: 'Roboto',
    }),
    mono: 'SpaceMono', // Use loaded font
  },
  // ...
};
```

### 12.3 Animation System Improvements

**File**: `theme/animations.ts`
**Line**: 12
**Issue**: Spring config lacks `overshootClamping` for UI elements.

```typescript
// RECOMMENDED SpringConfigs
export const SpringConfigs = {
  // UI Elements (buttons, cards) - No overshoot
  snappy: { 
    damping: 20, 
    stiffness: 300, 
    mass: 0.8,
    overshootClamping: true,
  },
  
  // Page transitions - Smooth
  gentle: { 
    damping: 20, 
    stiffness: 200, 
    mass: 1.0,
  },
  
  // Success celebrations - Controlled bounce
  bouncy: { 
    damping: 14, // Was 8, too bouncy
    stiffness: 180, 
    mass: 0.8,
  },
  
  // Toggles, checkboxes - Immediate
  stiff: { 
    damping: 25, 
    stiffness: 400, 
    mass: 0.6,
    overshootClamping: true,
  },
  
  // Mascot, decorative - Floaty
  float: { 
    damping: 12, 
    stiffness: 80, 
    mass: 1.2,
  },
} as const;

// Standard durations
export const Durations = {
  fast: 150,      // Micro-interactions
  normal: 250,    // Standard (mobile-optimized)
  slow: 400,      // Modal entrances
  verySlow: 600,  // Page transitions
} as const;
```

---

## Appendix: Updated Priority List

### 🔴 Critical (Fix Before Launch) - 12 Issues

| # | File | Issue | Effort |
|---|------|-------|--------|
| 1 | `context/DeclutterContext.tsx` | Memory leaks (4 timeouts) | 30min |
| 2 | `context/DeclutterContext.tsx` | Split monolithic context | 2-3hr |
| 3 | `context/MascotContext.tsx` | Duplicate state management | 1hr |
| 4 | `context/MascotContext.tsx` | Memory leaks (2 timeouts) | 15min |
| 5 | `components/room/TaskCard.tsx` | Gesture-only delete | 1hr |
| 6 | `components/room/TaskCard.tsx` | Subtask accessibility | 30min |
| 7 | `app/social.tsx` | Missing KeyboardAvoidingView | 15min |
| 8 | `app/join.tsx` | Missing KeyboardAvoidingView | 15min |
| 9 | `app/analysis.tsx` | Async state on unmount | 15min |
| 10 | `theme/animations.ts` | Fix SpringConfigs.bouncy | 5min |
| 11 | `context/MascotContext.tsx` | Memoize context value | 10min |
| 12 | `services/audio.ts` | Bundle sounds locally | 30min |

### 🟠 Major (Fix Soon) - 18 Issues

| # | File | Issue | Effort |
|---|------|-------|--------|
| 1 | `app/auth/login.tsx` | Error accessibilityLiveRegion | 10min |
| 2 | `app/auth/login.tsx` | Link roles | 10min |
| 3 | `components/room/TaskCard.tsx` | AnimatedCheckbox state | 15min |
| 4 | `app/room/[id].tsx` | Placebo refresh | 30min |
| 5 | `app/room/[id].tsx` | Optimize tasksByPriority | 15min |
| 6 | `app/focus.tsx` | Clear interval before set | 5min |
| 7 | `app/focus.tsx` | Memoize particles | 10min |
| 8 | `context/AuthContext.tsx` | Memoize value | 10min |
| 9 | `context/FocusContext.tsx` | Memoize value | 10min |
| 10 | `hooks/useColorScheme.ts` | Global variable reactivity | 30min |
| 11 | `components/ui/ActionSheet.tsx` | Accessibility roles | 15min |
| 12 | `components/ui/BottomSheet.tsx` | accessibilityViewIsModal | 5min |
| 13 | `app/onboarding.tsx` | KeyboardAvoidingView | 15min |
| 14 | `app/insights.tsx` | Chart accessibility | 30min |
| 15 | `app/auth/signup.tsx` | Password strength a11y | 15min |
| 16 | `constants/Colors.ts` | textMuted contrast | 5min |
| 17 | `services/haptics.ts` | Global variable reactivity | 15min |
| 18 | Reduced motion support | Multiple files | 1hr |

### 🟡 Minor (Polish) - 35+ Issues

- All hardcoded color replacements (~30 instances)
- Touch target hitSlop additions (~10 instances)
- Typography custom font integration
- Spring overshootClamping additions
- Context persistence debouncing

---

## Implementation Checklist

```markdown
## Pre-Launch Checklist

### Memory Safety
- [ ] All setTimeout/setInterval have cleanup
- [ ] Async operations check isMounted
- [ ] Context values memoized
- [ ] Animations cancelled on unmount

### Accessibility (WCAG 2.1 AA)
- [ ] All Pressables have accessibilityRole
- [ ] All checkboxes have role + state
- [ ] Error messages have liveRegion
- [ ] Gesture actions have alternatives
- [ ] Color contrast meets 4.5:1

### Performance
- [ ] Context split into domains
- [ ] Expensive computations memoized
- [ ] No duplicate state management
- [ ] Persistence debounced

### Theme Consistency
- [ ] No hardcoded colors
- [ ] Using SpringConfigs constants
- [ ] Using Durations constants
- [ ] Using Spacing constants

### Error Handling
- [ ] All async ops have try/catch
- [ ] User feedback on errors
- [ ] Assets bundled locally
- [ ] ErrorBoundaries on complex components
```

---

# PART 2: DEEP FUNCTIONALITY & FEATURE AUDIT

*The following sections contain exhaustive findings from 8 parallel deep-dive analyses covering every aspect of functionality, features, data flow, and edge cases.*

---

## 13. Screen-by-Screen Functionality Audit

### 13.1 Home Screen (`app/(tabs)/index.tsx`)

**FUNCTIONALITY ISSUES:**

| Issue | Line | Severity | Description | Fix |
|-------|------|----------|-------------|-----|
| Streak warning logic incorrect | 150 | Minor | Checks `focusTasks.length > 0` before warning. User might lose streak without warning if no tasks exist but no activity today. | Check `stats.lastActiveDate` instead |
| Confetti race condition | 169 | Minor | Multiple rooms completing triggers overlapping celebrations | Debounce or queue celebrations |

**MISSING FEATURES:**
- **Room Reordering**: Users cannot prioritize rooms via drag-and-drop
- **Search/Filter**: No way to find rooms in long lists
- **Undo Delete**: Accidental room deletion is permanent

### 13.2 Progress Screen (`app/(tabs)/progress.tsx`)

**FUNCTIONALITY ISSUES:**

| Issue | Line | Severity | Description | Fix |
|-------|------|----------|-------------|-----|
| **Fabricated Weekly Data** | 77-105 | **MAJOR** | Chart data is algorithmically generated from totals, NOT real daily history | Implement `TaskCompletionHistory` storage |
| Ring overflow | - | Minor | Streak >7 shows 100% but no "overachievement" indication | Add visual for exceeding weekly goal |

### 13.3 Profile Screen (`app/(tabs)/profile.tsx`)

**FUNCTIONALITY ISSUES:**

| Issue | Line | Severity | Description | Fix |
|-------|------|----------|-------------|-----|
| **No Profile Editing** | 166 | **MAJOR** | Cannot change name or avatar after onboarding | Add `EditProfileModal` |

**MISSING FEATURES:**
- **Data Export**: No way to export user data (only "Reset All Data" exists)

### 13.4 Camera Screen (`app/camera.tsx`)

**FUNCTIONALITY ISSUES:**

| Issue | Line | Severity | Description | Fix |
|-------|------|----------|-------------|-----|
| **Global Scan creates new room only** | 377 | **MAJOR** | Cannot add progress photo to EXISTING room from Home scan button | Add room selector with existing rooms |
| No zoom slider | 75 | Minor | Pinch-to-zoom exists but no visual slider for accessibility | Add vertical slider overlay |
| No focus indicator | - | Minor | Users don't know where camera is focusing | Add tap-to-focus visualizer |

### 13.5 Analysis Screen (`app/analysis.tsx`)

**FUNCTIONALITY ISSUES:**

| Issue | Line | Severity | Description | Fix |
|-------|------|----------|-------------|-----|
| Infinite loading possible | 106 | Minor | No timeout if backend hangs | Add 60s timeout with error state |
| Mock progress | 138 | Minor | `loadingProgress` uses random increments, not real progress | Connect to actual upload/processing events |

### 13.6 Focus Screen (`app/focus.tsx`)

**FUNCTIONALITY ISSUES:**

| Issue | Line | Severity | Description | Fix |
|-------|------|----------|-------------|-----|
| **Screen dims during timer** | 1 | **CRITICAL** | Screen will lock based on system settings during 25m session | Install `expo-keep-awake` |
| Aggressive distraction counting | 407 | Minor | ANY backgrounding counts as distraction | Add 5s grace period |

**MISSING FEATURES:**
- **Music Integration**: Users clean with music but no controls provided

### 13.7 Settings Screen (`app/settings.tsx`)

**FUNCTIONALITY ISSUES:**

| Issue | Line | Severity | Description | Fix |
|-------|------|----------|-------------|-----|
| API Key storage verification | 517 | Major | Verify `saveApiKey` uses SecureStore, not AsyncStorage | Audit storage implementation |

**MISSING FEATURES:**
- **Profile Editing**: Still no place to edit name/avatar

### 13.8 Room Detail Screen (`app/room/[id].tsx`)

**FUNCTIONALITY ISSUES:**

| Issue | Line | Severity | Description | Fix |
|-------|------|----------|-------------|-----|
| "Just ONE" mode exit | 764 | Minor | Last task completion exits without room celebration | Show completion modal first |
| Silent delete | - | Minor | Room delete just navigates back with no confirmation toast | Add success feedback |

### 13.9 Social Screen (`app/social.tsx`)

**FUNCTIONALITY ISSUES:**

| Issue | Line | Severity | Description | Fix |
|-------|------|----------|-------------|-----|
| No real-time updates | 443 | Minor | Challenge progress requires manual refresh | Implement polling or `onSnapshot` |

### 13.10 Insights Screen (`app/insights.tsx`)

**FUNCTIONALITY ISSUES:**

| Issue | Line | Severity | Description | Fix |
|-------|------|----------|-------------|-----|
| **Fabricated Weekly Data** | 258 | **MAJOR** | Same issue as Progress - distributes totals evenly | Implement history logging |
| Imprecise hours | 445 | Minor | "Hours Cleaned" rounds to nearest hour | Show "2h 30m" format |

### 13.11 Auth Screens

**Login (`app/auth/login.tsx`):**

| Issue | Line | Severity | Description | Fix |
|-------|------|----------|-------------|-----|
| Link/TouchableOpacity conflict | 291 | Minor | `asChild` with `onPress` may race | Use one navigation method |

---

## 14. Feature Systems Deep Dive

### 14.1 Mascot System (CRITICAL BUGS)

**File**: `context/DeclutterContext.tsx`

#### Bug: Accelerating Hunger Decay
**Line**: 185
**Severity**: CRITICAL

```typescript
// PROBLEM: Subtracts total decay from already-decayed value every minute
mascot.hunger - hoursSinceFed * 5

// This means:
// Minute 1: 100 - (0.016 * 5) = 99.92
// Minute 2: 99.92 - (0.033 * 5) = 99.75
// Minute 60: Nearly 0 (accelerating decay)

// FIX: Calculate absolute hunger from last fed time
const newHunger = Math.max(0, 100 - (hoursSinceFed * HUNGER_DECAY_PER_HOUR));
```

#### Bug: Duplicate/Dead Context Files
**Files**: `context/MascotContext.tsx`, `context/FocusContext.tsx`
**Severity**: MAJOR
**Issue**: These files exist but are UNUSED - `DeclutterContext` has duplicate implementations.
**Fix**: Delete these files to prevent developer confusion.

#### Missing Feature: Mascot Death State
**Issue**: Hunger reaches 0 with no consequence (just 'sad' mood)
**Fix**: Add `status` field ('active', 'run_away'). If hunger = 0 for >24h, mascot "runs away" with recovery flow.

### 14.2 Gamification System (CRITICAL BUG)

#### Bug: Challenge Progress Never Updates
**File**: `services/social.ts` LINE 281, `context/DeclutterContext.tsx`
**Severity**: CRITICAL

```typescript
// PROBLEM: updateChallengeProgress is DEFINED but NEVER CALLED
// in toggleTask or anywhere in DeclutterContext

// FIX: Add to toggleTask callback
const toggleTask = async (roomId: string, taskId: string) => {
  // ... existing logic ...
  
  // ADD THIS:
  if (taskJustCompleted) {
    await updateChallengeProgress(user.id, 'tasks', 1);
  }
};
```

### 14.3 Focus/Pomodoro System

#### Edge Case: App Killed During Session
**Issue**: `remainingSeconds` persisted, but on restart resumes from that exact count (ignoring elapsed real time)
**Fix**: Store `targetEndTime = Date.now() + remainingSeconds * 1000`. On load: `remainingSeconds = Math.max(0, (targetEndTime - Date.now()) / 1000)`

### 14.4 AI Analysis System

#### Missing Feature: "Take After Photo" Prompt
**Issue**: User finishes tasks but isn't prompted to scan after photo
**Fix**: In `RoomCompleteModal`, add CTA linking to `camera?mode=compare&roomId=X`

---

## 15. Services & API Integration Audit

### 15.1 Authentication Service (`services/auth.ts`)

| Issue | Line | Severity | Description |
|-------|------|----------|-------------|
| Apple name persistence | 257 | Minor | Apple only provides name on FIRST sign-in. If missed, user has no name forever. |
| Generic error messages | - | Minor | Raw error codes masked, making production debugging difficult. Log to crash reporting before sanitizing. |

### 15.2 AI/Gemini Service (`services/gemini.ts`)

| Issue | Line | Severity | Description |
|-------|------|----------|-------------|
| **Fragile JSON parsing** | 335 | **MAJOR** | Relies on markdown code blocks. Chatty model output breaks parsing. |
| Rate limit UX | - | Minor | Returns generic error on 429. Should show "Cool down" timer. |

**Fix for JSON parsing:**
```typescript
// Improve regex to find JSON even without code blocks
const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/) 
  || response.match(/(\{[\s\S]*\})/); // Fallback: find raw JSON object
```

### 15.3 Firestore Service (`services/firestore.ts`)

| Issue | Line | Severity | Description |
|-------|------|----------|-------------|
| **Batch size limit** | 181 | **MAJOR** | `saveAllRooms` adds all to one batch. Firestore limit is 500 ops. |
| **Collection doc size** | 449 | **CRITICAL** | ALL collected items in single doc. 1MB limit will be hit by active users. |

**Fix for collection storage:**
```typescript
// PROBLEM: Single document with all items
await setDoc(doc(db, `users/${userId}/data/collection`), { items: allItems });

// FIX: Use subcollection
for (const item of newItems) {
  await setDoc(doc(db, `users/${userId}/collectedItems/${item.id}`), item);
}
```

### 15.4 Storage Service (`services/storage.ts`)

| Issue | Line | Severity | Description |
|-------|------|----------|-------------|
| Bulk delete fail-fast | 296 | Major | `Promise.all` for photo deletion - one failure rejects all. Use `Promise.allSettled`. |
| Expensive storage calc | 443 | Moderate | Lists ALL files to calculate usage. Track size in Firestore metadata instead. |

### 15.5 Audio Service (`services/audio.ts`)

| Issue | Line | Severity | Description |
|-------|------|----------|-------------|
| Recursion loop risk | 143 | Minor | `handlePlaybackError` calls `playAmbientSound` which can error again. Add max retry count. |
| Stateful module | - | Minor | `ambientSound` is module-level variable. Race conditions if multiple callers. |

### 15.6 Social Service (`services/social.ts`)

| Issue | Line | Severity | Description |
|-------|------|----------|-------------|
| N+1 query | 763 | Moderate | `getConnections` fetches list, then `getDoc` for EVERY user profile. Denormalize data. |
| Join race condition | 253 | Minor | Client-side check then update. Use `runTransaction` for atomic join. |

---

## 16. Data Flow & State Management Audit

### 16.1 Critical Architecture Issues

#### Issue: Inefficient Full-State Sync
**File**: `context/DeclutterContext.tsx` (Lines 141-166)
**Severity**: CRITICAL

The app uploads the ENTIRE state (Profile, Rooms, Stats, Settings, Mascot, Collection) every 5 seconds if ANY data changes. Completing one task re-uploads years of room history.

```typescript
// PROBLEM: Full state sync on any change
useEffect(() => {
  if (dataChanged) {
    syncToCloud({ rooms, stats, settings, mascot, collection }); // ALL DATA
  }
}, [rooms, stats, settings, mascot, collection]);

// FIX: Granular dirty tracking
const [dirtyKeys, setDirtyKeys] = useState<Set<string>>(new Set());

useEffect(() => {
  if (dirtyKeys.size > 0) {
    syncToCloud(Object.fromEntries(
      [...dirtyKeys].map(key => [key, state[key]])
    ));
    setDirtyKeys(new Set());
  }
}, [dirtyKeys]);
```

#### Issue: Unused Cloud Sync Hook
**Files**: `hooks/useCloudSync.ts` vs `context/DeclutterContext.tsx`
**Severity**: CRITICAL

The codebase has a sophisticated `useCloudSync` hook with offline queue, retry logic, and granular updates - **but it's completely bypassed**. `DeclutterContext` calls raw `syncToCloud` directly.

**Fix**: Refactor to use `queueSync` from `useCloudSync`.

### 16.2 Race Conditions

#### Task Toggle Side Effects
**File**: `context/DeclutterContext.tsx` LINE 558
**Severity**: Medium

`toggleTask` uses `requestAnimationFrame` for side effects (XP, Mascot) based on closure-captured variables. Rapid clicking can cause out-of-sync state.

**Fix**: Calculate derived state within the same state transition (reducer pattern).

### 16.3 Missing Validation

| Location | Risk | Fix |
|----------|------|-----|
| `addRoom`, `addTaskToRoom` | Empty names, negative durations, infinite tasks | Add Zod schema validation |
| `uploadPhoto` | Malicious file types | Validate mime-type and magic bytes |

---

## 17. Navigation & Routing Audit

### 17.1 Deep Link Issues

#### Bug: Deep Link Context Lost After Auth
**File**: `app/_layout.tsx` LINE 176
**Severity**: MAJOR

```
Steps to reproduce:
1. User is logged out
2. Open deep link: declutterly://room/123
3. AuthGate redirects to /auth/login
4. User logs in
5. EXPECTED: Redirect to /room/123
6. ACTUAL: Redirected to /(tabs) home screen
```

**Fix**: Store intended route before auth redirect, restore after login.

```typescript
// In AuthContext
const [intendedRoute, setIntendedRoute] = useState<string | null>(null);

// In AuthGate (before redirect to login)
setIntendedRoute(segments.join('/'));

// In Login (after successful auth)
router.replace(intendedRoute || '/(tabs)');
```

### 17.2 Hardcoded Redirects
**File**: `app/auth/login.tsx` LINES 71, 85, 98, 117
**Issue**: All auth success paths hardcode `router.replace('/(tabs)')`
**Fix**: Check for intended destination first

### 17.3 Missing Sync Indicator
**Issue**: No global UI showing "Syncing..." status
**Fix**: Add status bar indicator when `syncToCloud` is in progress

---

## 18. Form Validation Audit

### 18.1 Critical: Culturally Insensitive Name Validation

**File**: `app/onboarding.tsx`
**Severity**: MAJOR

```typescript
// PROBLEM: Blocks international names
const nameRegex = /^[a-zA-Z\s\-']+$/;
// Blocks: José, Zoë, 田中, محمد, Müller

// FIX: Remove restrictive regex
const validateName = (text: string): string => {
  if (text.length > 30) return 'Name must be 30 characters or less';
  if (text.trim().length < 1) return 'Name is required';
  return ''; // Allow all unicode characters
};
```

### 18.2 Form-by-Form Issues

| Form | Field | Issue | Fix |
|------|-------|-------|-----|
| Login | password | No focus chaining from email | Add ref + `onSubmitEditing` |
| Signup | all fields | No focus chaining | Chain Name → Email → Password → Confirm |
| Forgot Password | email | Uses `.includes('@')` instead of regex | Standardize with Zod |
| Join Challenge | code | Inconsistent maxLength (10 vs 6) | Standardize to 6 |
| Create Challenge | target/duration | No validation for non-numeric paste | Validate positive integers |

### 18.3 Security Note
**Issue**: Zod schemas exist (`types/schemas.ts`) but are largely UNUSED in UI forms
**Fix**: Refactor all forms to use centralized Zod validation

---

## 19. Edge Cases & Offline Behavior Audit

### 19.1 Offline Issues

| Issue | Severity | Current Behavior | Fix |
|-------|----------|------------------|-----|
| Last Write Wins | Major | Offline edits blindly overwrite server data on sync | Implement version vectors or timestamp checking |
| Permanent sync failures | Major | Failed items silently dropped after 3 retries | Add "dead letter queue" UI for user review |
| Clock manipulation | Minor | Sync uses `Date.now()` for ordering | Use monotonic counter or server timestamp |

### 19.2 Data Integrity

| Issue | Severity | Current Behavior | Fix |
|-------|----------|------------------|-----|
| **Storage corruption** | **CRITICAL** | If `JSON.parse` fails, app silently initializes empty data (DATA LOSS) | Alert user, offer recovery options before overwriting |
| Unbounded growth | Major | No limits on rooms/tasks. Memory issues for power users. | Implement pagination, add limits |

### 19.3 Missing UI States

| Screen | Missing State | Fix |
|--------|---------------|-----|
| Home | Initial load skeleton | Add skeleton loader for room list |
| Room Detail | Delete error feedback | Show toast on failure |
| Room Detail | Filtered empty state | Show "No matching tasks" when filters active |

### 19.4 Boundary Conditions

| Condition | Risk | Fix |
|-----------|------|-----|
| Large photos (10MB+) | Upload timeout | Compress to max 1024px dimension |
| Long text input | Layout break, Firestore limit | Add `maxLength` to all inputs |
| Rapid button taps | Toggle flapping | Debounce or disable during animation |
| Background sync interruption | Partial write corruption | Use `expo-background-fetch` for critical syncs |

---

## 20. Summary: All Critical Issues

### 🔴 CRITICAL (Must Fix Before Launch) - 25 Issues

| # | Category | Issue | File | Effort |
|---|----------|-------|------|--------|
| 1 | Memory | setTimeout leaks (4 instances) | DeclutterContext.tsx | 30min |
| 2 | Architecture | Monolithic context causes full re-renders | DeclutterContext.tsx | 2-3hr |
| 3 | Architecture | Duplicate mascot state management | MascotContext.tsx | 1hr |
| 4 | Architecture | Full-state sync every 5 seconds | DeclutterContext.tsx | 2hr |
| 5 | Architecture | useCloudSync hook bypassed | DeclutterContext.tsx | 1hr |
| 6 | Accessibility | Gesture-only delete (swipe) | TaskCard.tsx | 1hr |
| 7 | Accessibility | Subtask checkboxes no semantics | TaskCard.tsx | 30min |
| 8 | Feature | **Challenge progress never updates** | DeclutterContext.tsx | 30min |
| 9 | Feature | **Mascot hunger decays exponentially** | DeclutterContext.tsx | 30min |
| 10 | Feature | **Fabricated chart data** (not real history) | progress.tsx, insights.tsx | 3hr |
| 11 | Feature | **Screen dims during Focus timer** | focus.tsx | 15min |
| 12 | Feature | Cannot add photo to existing room | camera.tsx | 1hr |
| 13 | Feature | No profile editing after onboarding | profile.tsx | 1hr |
| 14 | Navigation | Deep link lost after auth | _layout.tsx | 30min |
| 15 | Data | Collection stored in single doc (1MB limit) | firestore.ts | 2hr |
| 16 | Data | Batch size limit (500) not respected | firestore.ts | 30min |
| 17 | Data | Silent data loss on storage corruption | DeclutterContext.tsx | 1hr |
| 18 | Validation | International names blocked | onboarding.tsx | 15min |
| 19 | Sync | Last-write-wins conflict resolution | useCloudSync.ts | 2hr |
| 20 | Sync | Failed syncs silently dropped | useCloudSync.ts | 1hr |
| 21 | AI | Fragile JSON parsing | gemini.ts | 30min |
| 22 | Audio | Remote URLs (offline failure) | audio.ts | 30min |
| 23 | KeyboardAvoidingView | Missing on social.tsx | social.tsx | 15min |
| 24 | KeyboardAvoidingView | Missing on join.tsx | join.tsx | 15min |
| 25 | Animation | Over-bouncy springs (damping: 8) | animations.ts | 5min |

### Estimated Total Fix Time: ~25-30 hours

---

## 21. Implementation Roadmap

### Phase 1: Critical Fixes (Week 1)
1. Install `expo-keep-awake` for Focus timer
2. Fix mascot hunger decay formula
3. Call `updateChallengeProgress` in `toggleTask`
4. Fix international name validation
5. Add KeyboardAvoidingView to social/join screens
6. Bundle audio files locally
7. Fix SpringConfigs.bouncy damping

### Phase 2: Data & Sync (Week 2)
1. Implement task completion history for real charts
2. Refactor collection to subcollection
3. Add batch chunking for Firestore
4. Integrate useCloudSync properly
5. Add conflict resolution strategy
6. Add storage corruption recovery UI

### Phase 3: Architecture (Week 3)
1. Split DeclutterContext into domains
2. Delete unused MascotContext/FocusContext files
3. Memoize all context values
4. Add Zod validation to all forms
5. Implement granular sync (dirty tracking)

### Phase 4: UX Polish (Week 4)
1. Add room selector to camera for existing rooms
2. Add profile editing
3. Add deep link restoration after auth
4. Add accessible delete button to TaskCard
5. Add all missing empty/loading/error states
6. Implement real-time social updates

---

## Expanded Implementation Checklist

```markdown
## Pre-Launch Checklist v2.0

### Critical Functionality
- [ ] expo-keep-awake installed for Focus timer
- [ ] Mascot hunger uses absolute calculation
- [ ] Challenge progress updates on task completion
- [ ] Charts show REAL daily history
- [ ] Profile can be edited after onboarding
- [ ] Camera can add photos to existing rooms

### Data Integrity
- [ ] Collection uses subcollection (not single doc)
- [ ] Batch operations chunked to 500
- [ ] Storage corruption shows recovery UI
- [ ] Sync conflicts handled (not last-write-wins)
- [ ] Failed syncs shown to user (not silently dropped)

### Memory Safety
- [ ] All setTimeout/setInterval have cleanup
- [ ] Async operations check isMounted
- [ ] Context values memoized
- [ ] Animations cancelled on unmount
- [ ] useCloudSync integrated (not bypassed)

### Accessibility (WCAG 2.1 AA)
- [ ] All Pressables have accessibilityRole
- [ ] All checkboxes have role + state
- [ ] Error messages have liveRegion
- [ ] Gesture actions have alternatives
- [ ] Color contrast meets 4.5:1
- [ ] International names supported

### Navigation
- [ ] Deep links restored after auth
- [ ] No hardcoded redirects
- [ ] Sync indicator shown during uploads

### Performance
- [ ] Context split into domains
- [ ] Expensive computations memoized
- [ ] No duplicate state management
- [ ] Granular sync (not full state)
- [ ] Collection pagination implemented

### Forms
- [ ] All inputs have focus chaining
- [ ] Zod schemas used for validation
- [ ] maxLength on all text inputs
- [ ] Consistent code length validation

### Services
- [ ] Audio bundled locally
- [ ] JSON parsing handles chatty AI
- [ ] Batch deletes use Promise.allSettled
- [ ] Storage size tracked in Firestore (not calculated)
```

---

# PART 3: EXPO-SPECIFIC BEST PRACTICES & DEEP DIVES

*The following sections contain findings from comprehensive Expo MCP documentation analysis and codebase exploration, providing Expo-idiomatic patterns for animations, performance, and native interactions.*

---

## 22. Expo Animation & Gesture Best Practices

### Overview

Declutterly demonstrates strong foundational understanding of React Native Reanimated and gesture handling with excellent organization in `theme/animations.ts` and custom hooks. This section documents current patterns, identifies improvements, and provides Expo-idiomatic best practices.

#### Current Implementation Status
- **Reanimated Version**: ~4.1.1
- **Gesture Handler Version**: ~2.28.0
- **Custom Hooks**: 4 (useAnimatedPress, useReducedMotion, useStaggeredList, useAnimatedPress variants)
- **Components Using Animations**: 39+ files with sophisticated gesture integration

---

### 22.1 React Native Reanimated Patterns

#### Current Implementation Analysis

**Strengths:**
- Centralized animation configuration in `/theme/animations.ts` (SpringConfigs, Durations, Easings)
- Proper `useReducedMotion` support for accessibility (`useReducedMotion.ts`)
- Clean hook-based architecture for press animations with variants
- Proper use of `withDelay`, `withSpring`, `withTiming` chains

**File Reference:** `theme/animations.ts:1-273`

**Example - Well-Configured Spring Values:**
```typescript
// Current implementation (file:line 59-72)
export const SpringConfigs = {
  default: {
    damping: 12,     // Within Expo best practice (10-20)
    mass: 0.8,
    stiffness: 180,  // Good range (100-300)
    overshootClamping: false,
  },
  // ... more configs with damping: 8-20, stiffness: 100-400
};
```

#### useSharedValue Cleanup Patterns

**Current Status:** ✅ GOOD - Hooks properly initialize shared values with no explicit cleanup needed.

**Reference:** `hooks/useAnimatedPress.ts:42-43`
```typescript
// Proper initialization (no cleanup needed - Reanimated handles internally)
const scale = useSharedValue(1);
const opacity = useSharedValue(1);
```

**Best Practice - When Cleanup IS Needed:**
```typescript
// EXPO PATTERN: For async animations that may complete after unmount
useEffect(() => {
  const animation = withSpring(1, config);

  return () => {
    // Cancel any pending animations
    cancelAnimation(sharedValue);
  };
}, []);
```

#### useAnimatedStyle Optimization

**Current Implementation:** ✅ EXCELLENT - Proper worklet usage and memoization

**File Reference:** `components/ui/SwipeableTaskCard.tsx:136-177`
```typescript
// Good: Isolated animated styles for different properties
const cardStyle = useAnimatedStyle(() => ({
  transform: [{ translateX: translateX.value }],
}));

const completeActionStyle = useAnimatedStyle(() => {
  const opacity = interpolate(translateX.value, [0, SWIPE_THRESHOLD], [0, 1], Extrapolation.CLAMP);
  const scale = interpolate(translateX.value, [0, SWIPE_THRESHOLD], [0.5, 1], Extrapolation.CLAMP);
  return { opacity, transform: [{ scale }] };
});
```

**Best Practice - Avoid Common Pitfalls:**
```typescript
// ANTI-PATTERN - Don't compute expensive calculations inside useAnimatedStyle
❌ useAnimatedStyle(() => ({
  opacity: JSON.parse(expensiveData).length > 0 ? 1 : 0,
}));

// CORRECT PATTERN - Pre-compute outside worklet
const computedValue = useMemo(() => JSON.parse(expensiveData), [expensiveData]);
✅ useAnimatedStyle(() => ({
  opacity: computedValue.length > 0 ? 1 : 0,
}));
```

#### withSpring/withTiming Configuration Best Practices

**Validated Configurations:**
| Config | Damping | Stiffness | Use Case | Status |
|--------|---------|-----------|----------|--------|
| `default` | 12 | 180 | Standard interactions | ✅ Perfect |
| `gentle` | 20 | 100 | Subtle movements | ✅ Perfect |
| `bouncy` | 8 | 200 | Playful feedback | ⚠️ Consider damping: 10 |
| `snappy` | 18 | 300 | Quick response | ✅ Perfect |
| `cardPress` | 12 | 180 | Button press | ✅ Perfect |

**Best Practice - Spring Physics Explanation:**
```typescript
// EXPO BEST PRACTICE RANGES
const nativeSpringConfigs = {
  // Light (for subtle micro-interactions)
  light: { damping: 18, stiffness: 300 },          // Very snappy, minimal bounce

  // Natural (feels most like iOS gestures)
  natural: { damping: 14, stiffness: 200 },        // Balanced, native-like

  // Playful (for engaging gamified moments)
  playful: { damping: 10, stiffness: 180 },        // Noticeable bounce, fun

  // Slow (for dramatic reveals)
  slow: { damping: 20, stiffness: 100 },           // Deliberate, almost dragging
};
```

#### useReducedMotion Accessibility Support

**Current Implementation:** ✅ EXCELLENT - Comprehensive accessibility coverage

**File Reference:** `hooks/useReducedMotion.ts:1-73`

**Coverage:**
- ✅ `hooks/useReducedMotion.ts` - Proper Reanimated hook integration
- ✅ `hooks/useAnimatedPress.ts:40-70` - Respects prefers-reduced-motion
- ✅ `components/ui/Confetti.tsx:61-83` - Graceful fallback for confetti
- ✅ Built-in fallback with AccessibilityInfo listener

**Best Practice Code (Already Implemented):**
```typescript
// From useAnimatedPress.ts (file:line 50-70)
const reducedMotion = useReducedMotion();

const onPressIn = useCallback(() => {
  if (reducedMotion) {
    // Instant feedback for reduced motion - no spring
    opacity.value = withTiming(0.7, { duration: 0 });
  } else {
    // Full spring animation
    scale.value = withSpring(scalePressed, springConfig);
    opacity.value = withSpring(0.9, springConfig);
  }
  if (hapticFeedback) {
    Haptics.impactAsync(hapticStyle);
  }
}, [scalePressed, springConfig, hapticFeedback, hapticStyle, reducedMotion]);
```

---

### 22.2 Gesture Handler Integration

#### GestureDetector Patterns - Current Implementation

**Strength:** Excellent gesture implementation across components with proper gesture chaining

**Reference:** `components/ui/SwipeableTaskCard.tsx:101-134`
```typescript
// EXCELLENT PATTERN - Proper Pan gesture with context management
const gesture = Gesture.Pan()
  .onStart(() => {
    context.value = { x: translateX.value };
  })
  .onUpdate((event) => {
    translateX.value = event.translationX + context.value.x;
  })
  .onEnd(() => {
    const x = translateX.value;
    // Threshold-based action determination
    if (x > COMPLETE_THRESHOLD) {
      translateX.value = withTiming(SCREEN_WIDTH, { duration: 200 });
      runOnJS(handleComplete)();
    } else if (x < -COMPLETE_THRESHOLD) {
      // ... snooze/skip logic
    } else {
      runOnJS(resetPosition)();
    }
  });
```

#### Pan/Tap/Fling Gesture Best Practices

**Multi-Component Analysis:**

1. **SwipeableTaskCard (Pan)** - `components/ui/SwipeableTaskCard.tsx:101-134`
   - ✅ Context management for position tracking
   - ✅ Proper threshold detection
   - ⚠️ Missing velocity-based physics (feels slightly stiff)

2. **BeforeAfterSlider (Pan)** - `components/ui/BeforeAfterSlider.tsx:80-92`
   - ✅ Bounded pan (min/max clamping)
   - ✅ Smooth position updates
   - ⚠️ No velocity consideration for flick

3. **BottomSheet (Pan with Velocity)** - `components/ui/BottomSheet.tsx:143-193`
   - ✅ EXCELLENT - Uses velocity for snap point determination
   - ✅ Proper snap point logic
   - ✅ Haptic feedback on snap

**Best Practice - Add Velocity Flick to SwipeableTaskCard:**
```typescript
// EXPO PATTERN - Velocity-aware gestures
const gesture = Gesture.Pan()
  .onEnd((event) => {
    const x = translateX.value;
    const velocity = event.velocityX; // USE THIS!

    // If flinging fast, complete immediately
    if (Math.abs(velocity) > 500) {
      if (velocity > 0) {
        translateX.value = withTiming(SCREEN_WIDTH, { duration: 200 });
        runOnJS(handleComplete)();
      } else {
        translateX.value = withTiming(-SCREEN_WIDTH, { duration: 200 });
        runOnJS(handleSnooze)();
      }
      return;
    }

    // Otherwise use position-based thresholds
    // ... rest of logic
  });
```

#### Gesture Accessibility Alternatives

**Current Status:** ⚠️ CRITICAL ISSUE - Swipe actions not accessible to screen readers

**Problem:** `components/ui/SwipeableTaskCard.tsx:216-235`
```tsx
<GestureDetector gesture={gesture}>
  <Animated.View style={[styles.cardWrapper, cardStyle]}>
    <Pressable
      onPress={() => { /* expand */ }}
      accessibilityRole="button"
      accessibilityLabel={`${task.title}, ${task.priority} priority`}
      // MISSING: accessibilityHint about swipe gestures
      // MISSING: keyboard alternative for complete/snooze
    >
```

**Best Practice - Accessible Gesture Alternative:**
```tsx
// EXPO PATTERN - Gesture + Keyboard accessibility
export function AccessibleSwipeCard({ task, onComplete, onSnooze }) {
  const [showActions, setShowActions] = useState(false);

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={task.title}
          // KEY: Tell users gesture is available
          accessibilityHint={`Swipe right to complete, left to snooze. Double-tap for actions.`}
          onPress={() => setShowActions(!showActions)}
        >
          {/* Card content */}
        </Pressable>

        {/* Keyboard alternative when expanded */}
        {showActions && (
          <View accessible={true} accessibilityRole="toolbar">
            <Pressable
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Complete task"
              onPress={onComplete}
            >
              <Text>✓ Complete</Text>
            </Pressable>
            <Pressable
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Snooze task"
              onPress={onSnooze}
            >
              <Text>⏰ Snooze</Text>
            </Pressable>
          </View>
        )}
      </Animated.View>
    </GestureDetector>
  );
}
```

---

### 22.3 Code Examples - Expo-Idiomatic Patterns

#### Properly Cleaned-Up Animated Component

```typescript
/**
 * EXPO-IDIOMATIC: Gesture-Animated Component with Proper Cleanup
 */
import React, { useEffect, useCallback, useRef } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  cancelAnimation,
  runOnJS,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';

export function CleanSlider({ beforeImage, afterImage }) {
  // Shared values
  const position = useSharedValue(0.5);
  const context = useSharedValue({ pos: 0.5 });
  const isDragging = useSharedValue(false);

  // Refs for cleanup tracking
  const animationRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cancel all pending animations
      cancelAnimation(position);
      cancelAnimation(isDragging);
      // Clear any pending callbacks
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
    };
  }, []);

  // Pan gesture with proper finalization
  const gesture = Gesture.Pan()
    .onStart(() => {
      context.value = { pos: position.value };
      isDragging.value = true;
      cancelAnimation(position); // Stop spring if mid-animation
    })
    .onUpdate((event) => {
      // Direct update while dragging
      position.value = Math.max(0.05, Math.min(0.95,
        context.value.pos + event.translationX / 300
      ));
    })
    .onEnd((event) => {
      isDragging.value = false;
      // Snap to nearest edge or center based on velocity
      if (Math.abs(event.velocityX) > 500) {
        position.value = withSpring(
          event.velocityX > 0 ? 0.8 : 0.2,
          { damping: 15, stiffness: 200 }
        );
      } else {
        position.value = withSpring(0.5, { damping: 18, stiffness: 180 });
      }
    });

  // Animated styles (memoized)
  const sliderStyle = useAnimatedStyle(() => ({
    width: position.value * 100 + '%',
    opacity: isDragging.value ? 0.9 : 1,
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={sliderStyle}>
        {/* Content */}
      </Animated.View>
    </GestureDetector>
  );
}
```

#### Spring Configurations - Native-Feeling Physics

```typescript
/**
 * EXPO ANIMATION PHYSICS - Production-Ready Configurations
 * Ranges: damping 10-20, stiffness 100-400
 */

export const ProductionSpringConfigs = {
  // Micro-interactions (buttons, checkboxes)
  microInteraction: {
    damping: 18,
    mass: 0.6,
    stiffness: 350,
    overshootClamping: false,
    // Result: Snappy, ~150ms settle time
  },

  // Standard gestures (drag, pan)
  gesture: {
    damping: 14,
    mass: 0.8,
    stiffness: 200,
    overshootClamping: false,
    // Result: Natural, ~250ms settle time (like iOS)
  },

  // Page transitions (push, modal)
  pageTransition: {
    damping: 16,
    mass: 1,
    stiffness: 160,
    overshootClamping: false,
    // Result: Graceful, ~300ms settle time
  },

  // List animations (cell entrance)
  listItem: {
    damping: 15,
    mass: 0.7,
    stiffness: 180,
    overshootClamping: false,
    // Result: Bouncy but controlled, ~220ms settle time
  },

  // Playful/gamification (achievement unlock, celebration)
  playful: {
    damping: 10,
    mass: 0.5,
    stiffness: 200,
    overshootClamping: false,
    // Result: Celebratory bounce, ~280ms settle time
  },
};
```

---

### 22.4 Animation & Gesture Issues Summary

| Issue | File | Line | Severity | Impact |
|-------|------|------|----------|--------|
| Swipe gesture not accessible to keyboard/screen readers | `components/ui/SwipeableTaskCard.tsx` | 216-235 | 🔴 Critical | Users with accessibility needs cannot complete tasks |
| Missing velocity consideration in SwipeableTaskCard | `components/ui/SwipeableTaskCard.tsx` | 108-134 | 🟠 Major | Flick gestures don't work intuitively |
| Bouncy spring config (damping: 8) could feel unnatural | `theme/animations.ts` | 27-32 | 🟡 Minor | Older devices might feel sluggish |
| Pan gesture cancellation not explicit on unmount | `components/ui/BeforeAfterSlider.tsx` | 80-92 | 🟡 Minor | Memory safety edge case |

---

## 23. Expo Performance & Image Optimization

Declutterly uses `expo-image` (v3.0.11) for superior image loading and rendering compared to the native React Native `Image` component.

### 23.1 expo-image Best Practices

#### Current Implementation Status

The app has **successfully migrated** to `expo-image` for all image rendering:

- **Room detail screen** (`app/room/[id].tsx:475-479`) - Uses `expo-image` with `contentFit="cover"` for room photos
- **Analysis screen** (`app/analysis.tsx:33, 312-316`) - Uses `expo-image` for progress comparisons
- **Photo lightbox** (`components/room/PhotoLightbox.tsx:159-163`) - Main image viewer with pinch-zoom
- **Photo thumbnails** (`components/room/PhotoLightbox.tsx:221-225`) - Thumbnail gallery

#### Recommended Enhancements

**1. Add Transition Animations for Progressive Loading**

```tsx
// Enhanced image component with fade transition
<Image
  source={{ uri: photo.uri }}
  style={styles.roomImage}
  contentFit="cover"
  transition={200}  // Milliseconds - fade in newly loaded images
  cachePolicy="memory-disk"  // Cache both in memory and disk
/>
```

**2. Implement Placeholder & Blurhash for Better UX**

```tsx
// With placeholder during load
<Image
  source={{ uri: room.photos[0].uri }}
  placeholder={require('@/assets/images/image-placeholder.png')}
  style={styles.heroImage}
  contentFit="cover"
  transition={300}
/>

// Or with blurhash for progressive reveal
<Image
  source={{ uri: room.photos[0].uri }}
  placeholder="L8QR#]MvMv%3"  // Blurhash string
  style={styles.heroImage}
  contentFit="cover"
  transition={200}
/>
```

**3. useImage Hook for Preloading (SDK 52+)**

```tsx
import { useImage } from 'expo-image';

function RoomGallery() {
  const image = useImage(room.photos[0].uri, {
    maxWidth: 800,
    onError(error, retry) {
      console.error('Loading failed:', error.message);
    }
  });

  if (!image) {
    return <Skeleton height={300} />;
  }

  return (
    <Image
      source={image}
      style={{ width: image.width / 2, height: image.height / 2 }}
    />
  );
}
```

**4. contentFit Options Reference**

| Option | Use Case | File References |
|--------|----------|-----------------|
| `cover` | Fill container, crop excess (thumbnails, gallery) | PhotoLightbox.tsx:224 |
| `contain` | Scale to fit, show all content (lightbox main) | PhotoLightbox.tsx:162 |
| `fill` | Stretch to fill (avoid for photos) | - |
| `center` | Center at original size | - |
| `scale-down` | Scale down if larger than container | - |

---

### 23.2 Asset Optimization

#### Current Implementation

**Image Compression & Storage** (`services/storage.ts:94-96`)

```typescript
// Current optimization settings
const MAX_IMAGE_DIMENSION = 1920;  // Max width/height
const IMAGE_QUALITY = 0.8;         // 80% quality
```

#### Asset Optimization Recommendations

**1. Run expo-optimize (Before Production)**

```bash
# Compress all assets in /assets directory
npx expo-optimize

# This will:
# - Optimize PNG files (remove metadata, optimize compression)
# - Convert non-optimized images to WebP
# - Reduce bundle size by 10-20%
```

**2. Implement Image Compression Pipeline**

```typescript
// Enhanced in services/storage.ts
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

async function compressImageForStorage(uri: string): Promise<string> {
  const result = await manipulateAsync(
    uri,
    [{ resize: { width: 1920, height: 1920 } }],
    { compress: 0.8, format: SaveFormat.JPEG }
  );
  return result.uri;
}
```

**3. Preload Critical Assets in Splash Screen**

```typescript
// app/_layout.tsx enhancement
import * as SplashScreen from 'expo-splash-screen';
import { Image } from 'expo-image';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Preload critical images
        await Image.prefetch([
          require('@/assets/images/splash-icon.png'),
          require('@/assets/images/mascot-greeting.png'),
        ]);
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
        SplashScreen.hideAsync();
      }
    }
    prepare();
  }, []);

  if (!appIsReady) return null;
  return <Stack />;
}
```

---

### 23.3 Loading States & Skeleton Components

#### Skeleton Component Overview

The app has a comprehensive skeleton system (`components/ui/Skeleton.tsx`) with:

- **Shimmer animation** with reduced motion support (lines 45-53)
- **Multiple preset variants** for different contexts
- **Accessibility labels** for screen readers

#### Skeleton Presets - Usage Locations

| Component | File | Lines | Use Case |
|-----------|------|-------|----------|
| `SkeletonText` | Skeleton.tsx | 111-135 | Text content loading |
| `SkeletonAvatar` | Skeleton.tsx | 142-156 | User/room photos |
| `SkeletonCard` | Skeleton.tsx | 162-192 | Card placeholders |
| `SkeletonListItem` | Skeleton.tsx | 200-231 | List items |
| `SkeletonRoomCard` | Skeleton.tsx | 387-412 | Room cards |
| `HomeScreenSkeleton` | Skeleton.tsx | 455-497 | Home page |
| `RoomScreenSkeleton` | Skeleton.tsx | 500-543 | Room detail |
| `ProgressScreenSkeleton` | Skeleton.tsx | 546-582 | Progress page |
| `InsightsScreenSkeleton` | Skeleton.tsx | 585-662 | Insights page |

#### Image Loading Skeleton Pattern

```tsx
// Combine expo-image transition with skeleton loading
import { Image } from 'expo-image';
import { Skeleton } from '@/components/ui/Skeleton';

function RoomPhotoWithSkeleton() {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <View>
      {isLoading && <Skeleton height={300} width="100%" borderRadius={16} />}

      <Image
        source={{ uri: room.photos[0].uri }}
        style={styles.roomImage}
        contentFit="cover"
        onLoad={() => setIsLoading(false)}
        transition={200}  // Fade in over 200ms
      />
    </View>
  );
}
```

---

### 23.4 Performance Optimization Checklist

| Issue | Location | Priority | Estimated Impact |
|-------|----------|----------|------------------|
| Add preloading for room photos | app/room/[id].tsx | Medium | 15-20% faster display |
| Implement blurhash placeholders | PhotoLightbox.tsx | Medium | Better perceived performance |
| Add image compression pipeline | services/storage.ts | High | 30-40% smaller uploads |
| Add analysis skeleton screen | app/analysis.tsx | Medium | Reduced perceived wait time |
| Implement lazy loading for galleries | app/collection.tsx | Low | 10-15% faster initial load |

---

## 24. Expo Haptics & Native Interactions

Declutterly implements comprehensive haptic feedback across the application using `expo-haptics` (v15.0.8).

### 24.1 Haptics Service Architecture

The app uses a centralized haptics service (`services/haptics.ts:1-30`) that wraps Expo's Haptics API with a global enable/disable state:

**Service Structure:**
- **Global State Management** - `setHapticsEnabled()` and `isHapticsEnabled()` functions
- **Three Core Functions:**
  - `impact(style)` - Wraps `Haptics.impactAsync()` (Light/Medium/Heavy/Rigid/Soft)
  - `notification(type)` - Wraps `Haptics.notificationAsync()` (Success/Error/Warning)
  - `selection()` - Wraps `Haptics.selectionAsync()` for lightweight selection feedback

---

### 24.2 Haptic Feedback Patterns by Interaction Type

#### Impact Feedback - Physical Actions

**Light Impact** - Subtle interactions:
- Button presses (`components/ui/SegmentedControl.tsx:73`, `components/ui/Chip.tsx:76`)
- Tab navigation (`components/HapticTab.tsx:12`)
- Filter/tag selection (`components/room/FilterPill.tsx:25`)
- List item taps (`components/ui/AnimatedListItem.tsx:82,192,362`)

**Medium Impact** - Intentional actions with consequences:
- Task completion (`components/room/TaskCard.tsx:85`)
- Modal confirmations (`components/room/GoodEnoughModal.tsx:48`)
- Swipe threshold reached (`components/room/TaskCard.tsx:85`)
- Session state changes (`components/room/SessionCheckIn.tsx:122`)

**Heavy Impact** - Major destructive actions:
- Data deletion (`app/settings.tsx:556`)

#### Selection Feedback - Toggle & Option Selection

**Selection Haptic** (`selectionAsync()`) - Lightweight picker feedback:
- Toggle switches (`components/ui/FocusableInput.tsx:115`)
- Radio button groups (auth flows: `login.tsx:256,277,294`, `signup.tsx:174,310`)
- Challenge selection (`challenge/[id].tsx:169,208,250`)
- Social interactions (`social.tsx:282,338,561,575,625,738`)

#### Notification Feedback - Confirmations & Alerts

**Success Notification:**
- Form submissions (`login.tsx:70`, `signup.tsx:111`)
- Data saves (`settings.tsx:521,544,568,595`)
- Challenge victories (`achievements.tsx:136`, `join.tsx:76,94,112`)
- Toast display (`ui/Toast.tsx:110-116`)

**Error Notification:**
- Form validation errors (`FocusableInput:95`, `ApiKeySetupWizard:115,120,158`)
- Auth failures (`login.tsx:73`, `signup.tsx:114`)
- Network errors

**Warning Notification:**
- Insufficient resources (`PhotoLightbox.tsx:131`)
- Validation warnings (`profile.tsx:68`)
- Low power states (`focus.tsx:535`)

---

### 24.3 Advanced Haptic Integration Patterns

#### Animated Press Hook with Haptics

The `useAnimatedPress()` hook (`hooks/useAnimatedPress.ts:1-132`) integrates haptics with spring animations:

```typescript
// From useAnimatedPress.ts:50-61
const onPressIn = useCallback(() => {
  if (reducedMotion) {
    opacity.value = withTiming(0.7, { duration: 0 });
  } else {
    scale.value = withSpring(scalePressed, springConfig);
  }
  if (hapticFeedback) {
    Haptics.impactAsync(hapticStyle);
  }
}, [...]);
```

#### Gesture Handler Integration

**Swipe-to-Delete Pattern** (`TaskCard:83-87`):
```typescript
if (newTranslateX <= -SWIPE_THRESHOLD && !hasTriggeredHaptic.value) {
  hasTriggeredHaptic.value = true;
  runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
}
```

---

### 24.4 Haptic Best Practice Examples

**Pressable with Haptics:**
```typescript
import * as Haptics from 'expo-haptics';

<Pressable
  onPress={async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }}
/>
```

**Toggle with Selection Haptic:**
```typescript
<Switch
  value={enabled}
  onValueChange={(value) => {
    Haptics.selectionAsync();
    setEnabled(value);
  }}
/>
```

**Success Confirmation:**
```typescript
const handleSuccess = async () => {
  await Haptics.notificationAsync(
    Haptics.NotificationFeedbackType.Success
  );
  showSuccessMessage();
};
```

**Custom Haptic Hook:**
```typescript
export function useHapticFeedback() {
  return {
    tap: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
    toggle: () => Haptics.selectionAsync(),
    success: () => Haptics.notificationAsync(
      Haptics.NotificationFeedbackType.Success
    ),
    error: () => Haptics.notificationAsync(
      Haptics.NotificationFeedbackType.Error
    ),
  };
}
```

---

### 24.5 Haptic Coverage Analysis

**Current Coverage:**

| Interaction Type | Coverage | Files Affected | Count |
|---|---|---|---|
| Button Presses | Comprehensive | SegmentedControl, Chip, ActionButton, Banner | 50+ |
| Selection/Toggles | Comprehensive | FocusableInput, Radio groups, Auth flows | 40+ |
| Swipe Gestures | Comprehensive | TaskCard, SwipeableTaskCard, BottomSheet | 25+ |
| Success Confirmations | High | Toast, Form submissions, Achievements | 60+ |
| Error Feedback | High | Form validation, Auth errors, API failures | 30+ |
| List Interactions | Medium | AnimatedListItem, FilterPill, Chip | 15+ |

**Identified Gaps:**

1. **Scroll Milestone Feedback** - No haptics on scroll completion or infinite scroll loading
2. **Long-Press Operations** - Not implemented for context menus
3. **Progress Transitions** - Progress animations lack milestone feedback (25%, 50%, 75%)

---

### 24.6 iOS-Specific Considerations

**Platform Detection** (`components/HapticTab.tsx:9-14`):
```typescript
onPressIn={(ev) => {
  if (process.env.EXPO_OS === 'ios') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
  props.onPressIn?.(ev);
}}
```

**Low Power Mode Handling:**
- Current implementation does not explicitly check for Low Power Mode
- Recommendation: Use `expo-device` to detect `isLowPowerMode` and disable non-essential haptics

---

## 25. Expo-Specific Testing Checklist

### Animation & Gesture Testing

```markdown
### Manual Testing Checklist
- [ ] Test all swipeable cards with VoiceOver (iOS) / TalkBack (Android)
- [ ] Verify keyboard alternatives work for all gesture interactions
- [ ] Test with prefers-reduced-motion enabled (Settings > Accessibility)
- [ ] Verify no animations stutter on low-end devices (Galaxy A12, iPhone SE)
- [ ] Test gesture responsiveness during rapid swipes
- [ ] Verify haptics fire at correct times (gesture start/end, not during)
- [ ] Test all spring configs feel consistent across app
```

### Image & Performance Testing

```markdown
### Asset Testing
- [ ] Run npx expo-optimize before deployment
- [ ] Test image load times < 500ms on 3G connection
- [ ] Verify skeleton loading appears during image load
- [ ] Test gallery scrolling at 60fps
- [ ] Monitor memory usage during image-heavy screens
```

### Haptics Testing

```markdown
### Haptic Testing (iOS Device Required)
- [ ] Test all button presses have Light impact
- [ ] Test toggles have Selection feedback
- [ ] Test success/error have Notification feedback
- [ ] Test swipe gestures have Medium impact at threshold
- [ ] Verify haptics respect global enable/disable setting
- [ ] Test in Low Power Mode (haptics may be disabled by OS)
```

---

## 26. Expo Implementation Roadmap

### Immediate Actions (Before Next Release)

1. Add keyboard alternative to SwipeableTaskCard swipe gesture
2. Add accessibility hints about gesture interactions
3. Implement velocity-based flick detection in pan gestures
4. Run `npx expo-optimize` for all assets
5. Add blurhash placeholders to main image galleries

### Short-term (Next Sprint)

1. Add explicit `cancelAnimation` cleanup on unmount for gesture handlers
2. Update bouncy spring config to damping: 10 (from 8)
3. Implement image preloading for room details
4. Add progress milestone haptics (25%, 50%, 75%, 100%)
5. Add analysis screen skeleton

### Future Enhancements (Roadmap)

1. Implement `useImage` hook for all critical images (SDK 52+)
2. Add haptic strength presets (subtle/normal/strong)
3. Create custom haptic patterns for app-specific flows
4. Implement progressive JPEG uploads
5. Add CDN for faster image delivery

---

*Document generated for Declutterly v1.0 - Last updated: January 2026*
*Total Issues: 125+ (25 Critical, 40 Major, 60+ Minor)*
*Estimated Fix Time: 35-40 hours (including Expo-specific improvements)*
*Expo SDK Version: 54 | Reanimated: 4.1.1 | Gesture Handler: 2.28.0 | Haptics: 15.0.8*
