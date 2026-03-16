# Declutterly V1 - Required Improvements

> Comprehensive analysis of changes needed to ship a production-ready V1.
> Organized by priority and effort level.

---

## Executive Summary

**Product Vision**: An ADHD-friendly decluttering app that uses AI to analyze messy spaces and generate manageable cleaning tasks with gamification to maintain motivation.

**Current State**: The app has a solid foundation with beautiful UI, comprehensive type system, and thoughtful ADHD-friendly features. However, critical gaps in authentication flow, data persistence, and cloud sync prevent production readiness.

**V1 Goal**: A stable, working app where users can:
1. Sign up or use as guest
2. Take photos of rooms and get AI-generated tasks
3. Complete tasks with gamification rewards
4. Have data persist reliably (local-first, cloud-synced when authenticated)

---

## CHUNK 1: Critical Blockers (Must Fix)

### 1.1 Authentication Flow Broken

**Problem**: Auth screens exist but aren't connected to the main app flow.

**Files Affected**:
- `app/_layout.tsx`
- `app/index.tsx`
- `app/auth/_layout.tsx`

**Current Issues**:
- No routing logic to check auth state on app launch
- Guest users go through onboarding but AuthContext isn't consulted
- No conversion path from guest to full account
- SignOut redirects to `/auth/login` but user could be stuck

**Required Changes**:

```typescript
// app/_layout.tsx - Add auth gate
export default function RootLayout() {
  const { isAuthenticated, isLoading, isFirebaseReady } = useAuth();
  const { user } = useDeclutter();
  
  if (isLoading) return <SplashScreen />;
  
  // Determine initial route
  if (!isFirebaseReady) {
    // Firebase not configured - allow offline mode
    if (!user?.onboardingComplete) return <Redirect href="/onboarding" />;
    return <Slot />;
  }
  
  if (!isAuthenticated) {
    return <Redirect href="/auth/login" />;
  }
  
  if (!user?.onboardingComplete) {
    return <Redirect href="/onboarding" />;
  }
  
  return <Slot />;
}
```

**Effort**: Medium (2-3 days)

---

### 1.2 Gemini API Model Invalid

**Problem**: The model `gemini-3-pro-image-preview` doesn't exist.

**File**: `services/gemini.ts` (line 88)

**Current Code**:
```typescript
const GEMINI_MODEL = 'gemini-3-pro-image-preview';
```

**Fix**:
```typescript
// Use actual available model
const GEMINI_MODEL = 'gemini-1.5-flash'; // or 'gemini-1.5-pro' for better quality
```

**Additional Fixes Needed**:
- Add model validation on startup
- Add fallback model if primary fails
- Consider making model configurable

**Effort**: Low (1 hour)

---

### 1.3 API Key Input Missing

**Problem**: Users can't enter their Gemini API key in the app.

**Current State**:
- Settings shows "Get Key" link to Google AI Studio
- `saveApiKey` function exists in DeclutterContext
- secureStorage service exists
- But NO UI to actually input the key

**Required Changes**:

Add to `app/settings.tsx`:
```typescript
// New state
const [showApiKeyInput, setShowApiKeyInput] = useState(false);
const [apiKeyInput, setApiKeyInput] = useState('');

// In AI Configuration section, add:
<SettingsItem
  icon={...}
  title="Enter API Key"
  subtitle="Paste your Gemini API key"
  onPress={() => setShowApiKeyInput(true)}
  showChevron
/>

// Add modal for key input with validation
```

**Effort**: Medium (1 day)

---

### 1.4 Cloud Sync Not Implemented

**Problem**: `syncToCloud` in AuthContext is a no-op stub.

**File**: `context/AuthContext.tsx` (line 300-302)

**Current Code**:
```typescript
const syncToCloud = useCallback(async (): Promise<void> => {
  // This will be called from DeclutterContext with the actual data
}, []);
```

**Required Implementation**:

```typescript
// AuthContext.tsx
const syncToCloud = useCallback(async (data: SyncData): Promise<void> => {
  if (!state.isAuthenticated || state.isAnonymous) return;
  
  try {
    await syncAllDataToCloud(data);
  } catch (error) {
    console.error('Sync failed:', error);
    // Queue for retry
  }
}, [state.isAuthenticated, state.isAnonymous]);

// DeclutterContext.tsx - Add sync triggers
useEffect(() => {
  if (isLoaded && isAuthenticated) {
    const syncData = { profile: user, rooms, stats, settings, mascot, collection, collectionStats };
    syncToCloud(syncData);
  }
}, [rooms, stats, settings, mascot, collection]); // Debounce this!
```

**Additional Requirements**:
- Add debouncing (don't sync on every change)
- Add sync status indicator in UI
- Add manual "Sync Now" button
- Handle merge conflicts (last-write-wins for v1)

**Effort**: High (3-5 days)

---

### 1.5 Photo Storage Fragile

**Problem**: Photos stored as local `file://` URIs that won't survive app reinstall.

**Current Flow**:
1. Camera captures photo → local URI
2. URI stored in Room.photos array
3. AsyncStorage saves URI string
4. On reinstall: URI invalid, images gone

**Required Changes**:

Option A: Copy to app's document directory
```typescript
// services/storage.ts
import * as FileSystem from 'expo-file-system';

export async function persistPhoto(tempUri: string): Promise<string> {
  const filename = `photo_${Date.now()}.jpg`;
  const permanentUri = `${FileSystem.documentDirectory}photos/${filename}`;
  
  await FileSystem.makeDirectoryAsync(
    `${FileSystem.documentDirectory}photos/`,
    { intermediates: true }
  );
  
  await FileSystem.copyAsync({ from: tempUri, to: permanentUri });
  return permanentUri;
}
```

Option B (Better for cloud): Upload to Firebase Storage
```typescript
// services/storage.ts
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export async function uploadPhoto(localUri: string, roomId: string): Promise<string> {
  const response = await fetch(localUri);
  const blob = await response.blob();
  
  const storage = getStorage();
  const photoRef = ref(storage, `users/${userId}/rooms/${roomId}/${Date.now()}.jpg`);
  
  await uploadBytes(photoRef, blob);
  return getDownloadURL(photoRef);
}
```

**Effort**: Medium-High (2-3 days)

---

## CHUNK 2: Stability & Bug Fixes

### 2.1 Streak Calculation Bug

**Problem**: Streak increments on every session end, not once per day.

**File**: `context/DeclutterContext.tsx` (line 647-649)

**Current Code**:
```typescript
const endSession = useCallback(() => {
  setCurrentSession(prevSession => {
    if (prevSession && prevSession.tasksCompletedIds.length > 0) {
      setStats(prev => ({
        ...prev,
        currentStreak: prev.currentStreak + 1, // BUG: Always increments
        longestStreak: Math.max(prev.longestStreak, prev.currentStreak + 1),
      }));
    }
    return null;
  });
}, []);
```

**Fix**:
```typescript
const endSession = useCallback(() => {
  setCurrentSession(prevSession => {
    if (prevSession && prevSession.tasksCompletedIds.length > 0) {
      const today = new Date().toDateString();
      const lastActivityDate = localStorage.getItem('lastActivityDate');
      
      if (lastActivityDate !== today) {
        // First activity of the day
        localStorage.setItem('lastActivityDate', today);
        
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const wasYesterday = lastActivityDate === yesterday.toDateString();
        
        setStats(prev => ({
          ...prev,
          currentStreak: wasYesterday ? prev.currentStreak + 1 : 1,
          longestStreak: Math.max(prev.longestStreak, wasYesterday ? prev.currentStreak + 1 : 1),
        }));
      }
    }
    return null;
  });
}, []);
```

**Effort**: Low (2-3 hours)

---

### 2.2 toggleTask Side Effects Race Condition

**Problem**: Side effects (feedMascot, spawnCollectible) called inside state setter causing potential race conditions.

**File**: `context/DeclutterContext.tsx` (lines 511-537)

**Current Issue**:
```typescript
// Inside setRooms callback:
if (task?.completed) {
  if (mascot) {
    feedMascotAction(); // Side effect in setter!
  }
  if (settings.arCollectionEnabled) {
    const spawn = spawnCollectibleAction();
    if (spawn) {
      setActiveSpawn(spawn); // Another state update!
    }
  }
}
```

**Fix**: Move side effects outside state setters
```typescript
const toggleTask = useCallback((roomId: string, taskId: string) => {
  let taskWasJustCompleted = false;
  
  setRooms(prev => {
    // ... existing logic
    // Just set taskWasJustCompleted = true if appropriate
    return newRooms;
  });
  
  // Side effects AFTER state update
  if (taskWasJustCompleted) {
    requestAnimationFrame(() => {
      if (mascot) feedMascotAction();
      if (settings.arCollectionEnabled) {
        const spawn = spawnCollectibleAction();
        if (spawn) setActiveSpawn(spawn);
      }
    });
  }
}, [/* deps */]);
```

**Effort**: Medium (4-6 hours)

---

### 2.3 Memory Leaks - Interval Cleanup

**Problem**: Multiple setInterval/setTimeout without proper cleanup.

**Files Affected**:
- `context/DeclutterContext.tsx` (mascot status update)
- `app/(tabs)/index.tsx` (various animations)
- `app/room/[id].tsx` (breathing exercise)

**Example Fix** for mascot interval:
```typescript
// Current (line 137-144):
useEffect(() => {
  if (mascot) {
    const interval = setInterval(() => {
      updateMascotStatus();
    }, 60000);
    return () => clearInterval(interval);
  }
}, [mascot?.name]); // Problem: updateMascotStatus not in deps

// Fixed:
const updateMascotStatusRef = useRef(updateMascotStatus);
updateMascotStatusRef.current = updateMascotStatus;

useEffect(() => {
  if (!mascot) return;
  
  const interval = setInterval(() => {
    updateMascotStatusRef.current();
  }, 60000);
  
  return () => clearInterval(interval);
}, [!!mascot]); // Only re-run if mascot exists/doesn't exist
```

**Effort**: Medium (1 day to audit all)

---

### 2.4 Error Boundary Gaps

**Problem**: Some screens have error boundaries, but errors could crash entire app.

**Required Changes**:

1. Wrap entire app in root error boundary
2. Add error recovery UI
3. Add error reporting (Sentry/Crashlytics)

```typescript
// app/_layout.tsx
<ErrorBoundary fallback={<CrashScreen onRetry={() => /* reload */} />}>
  <AuthProvider>
    <DeclutterProvider>
      <ThemeProvider>
        <Slot />
      </ThemeProvider>
    </DeclutterProvider>
  </AuthProvider>
</ErrorBoundary>
```

**Effort**: Low-Medium (1 day)

---

### 2.5 Network Error Handling

**Problem**: Network failures during AI analysis don't have good UX.

**File**: `app/analysis.tsx` (if exists), `services/gemini.ts`

**Required Changes**:
- Add retry button on failure
- Add offline detection before starting
- Show helpful error messages
- Cache partial results

```typescript
// In analysis screen
const [error, setError] = useState<string | null>(null);
const [retryCount, setRetryCount] = useState(0);

const analyze = async () => {
  try {
    setError(null);
    const result = await analyzeRoomImage(base64Image);
    // success
  } catch (err) {
    if (err.message.includes('network')) {
      setError('No internet connection. Please check your connection and try again.');
    } else if (err.message.includes('rate limit')) {
      setError('Too many requests. Please wait a moment and try again.');
    } else {
      setError('Analysis failed. Please try again.');
    }
  }
};

// Render retry button when error exists
```

**Effort**: Medium (1 day)

---

## CHUNK 3: Feature Completeness

### 3.1 Manual Task Creation

**Problem**: Users can only get AI-generated tasks, can't add their own.

**Required Changes**:

Add "Add Task" button to room detail screen:
```typescript
// app/room/[id].tsx - Add to task section header
<Pressable onPress={() => setShowAddTask(true)}>
  <Text style={{ color: colors.primary }}>+ Add Task</Text>
</Pressable>

// Add task modal with:
// - Title input
// - Description input (optional)
// - Priority picker (high/medium/low)
// - Difficulty picker (quick/medium/challenging)
// - Time estimate slider
// - Emoji picker
```

**Also Need**:
- Edit task (tap to edit)
- Reorder tasks (drag and drop)

**Effort**: Medium-High (2-3 days)

---

### 3.2 Room Editing

**Problem**: Can't rename rooms or change room type after creation.

**Required Changes**:

Add edit mode to room detail screen:
```typescript
// Long press on room name or add edit button
const [isEditingRoom, setIsEditingRoom] = useState(false);

// Edit modal:
// - Name input
// - Room type picker
// - Custom emoji picker
// - Archive option (hide from main list)
```

**Effort**: Low-Medium (1 day)

---

### 3.3 Notifications Implementation

**Problem**: Settings has notification toggles but nothing happens.

**File**: `services/notifications.ts` exists but needs completion.

**Required Implementation**:

```typescript
// services/notifications.ts
import * as Notifications from 'expo-notifications';

export async function scheduleStreakReminder() {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Don't break your streak! 🔥",
      body: "You haven't cleaned anything today. Just one small task keeps it alive!",
    },
    trigger: {
      hour: 20, // 8 PM
      minute: 0,
      repeats: true,
    },
  });
}

export async function scheduleDailyReminder(time: string) {
  const [hours, minutes] = time.split(':').map(Number);
  // ... schedule notification
}

export async function notifyCollectibleFound(collectible: Collectible) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `${collectible.emoji} New collectible!`,
      body: `You found a ${collectible.name}!`,
    },
    trigger: null, // Immediate
  });
}
```

**Effort**: Medium (2 days)

---

### 3.4 Photo Management

**Problem**: Can't delete individual photos, no before/after comparison view.

**Required Changes**:

1. **Delete photos**: Add delete button in photo lightbox
2. **Before/After slider**: Add comparison view component
3. **Photo annotations**: Allow drawing/marking on photos

```typescript
// components/features/BeforeAfterSlider.tsx
export function BeforeAfterSlider({ before, after }: Props) {
  const [sliderPosition, setSliderPosition] = useState(0.5);
  
  return (
    <GestureDetector gesture={panGesture}>
      <View style={styles.container}>
        <Image source={{ uri: after }} style={StyleSheet.absoluteFill} />
        <View style={[styles.beforeContainer, { width: `${sliderPosition * 100}%` }]}>
          <Image source={{ uri: before }} style={styles.beforeImage} />
        </View>
        <View style={[styles.slider, { left: `${sliderPosition * 100}%` }]} />
      </View>
    </GestureDetector>
  );
}
```

**Effort**: Medium (2 days)

---

### 3.5 Progress/Analytics Screen

**Problem**: Progress tab exists but needs meaningful content.

**Required Features**:

1. **Weekly activity chart**: Bar chart of tasks completed per day
2. **Time breakdown**: Pie chart of time spent per room type
3. **Streak history**: Calendar view with activity dots
4. **Milestones**: List of achievements with dates
5. **Collection progress**: Grid of collectibles (found vs total)

```typescript
// app/(tabs)/progress.tsx
export default function ProgressScreen() {
  return (
    <ScrollView>
      <WeeklyChart data={weeklyActivity} />
      <StreakCalendar currentStreak={stats.currentStreak} history={streakHistory} />
      <TimeBreakdown rooms={rooms} />
      <CollectionGrid items={collection} total={COLLECTIBLES.length} />
      <AchievementsList badges={stats.badges} />
    </ScrollView>
  );
}
```

**Effort**: High (3-4 days)

---

## CHUNK 4: Polish & UX Improvements

### 4.1 Loading States

**Problem**: Some screens flash or show incomplete states while loading.

**Required Changes**:
- Add skeleton loaders to all data-dependent screens
- Add pull-to-refresh where appropriate
- Add loading indicators for async operations

**Effort**: Medium (1-2 days)

---

### 4.2 Empty States

**Problem**: Empty states exist but could be more engaging.

**Improvements**:
- Add illustrations instead of just emoji
- Make CTAs more prominent
- Add tips for getting started

**Effort**: Low (1 day)

---

### 4.3 Accessibility Audit

**Problem**: Inconsistent accessibility labels and hints.

**Required Changes**:
- Audit all interactive elements for accessibility labels
- Add accessibilityRole to all buttons
- Test with VoiceOver/TalkBack
- Ensure color contrast meets WCAG AA
- Add accessibility hints for complex interactions

**Effort**: Medium (2 days)

---

### 4.4 Haptic Feedback Consistency

**Problem**: Some interactions have haptics, others don't.

**Required Changes**:
- Create haptic utility functions
- Apply consistently across all interactions
- Respect user's haptic preference setting

```typescript
// services/haptics.ts
export const haptic = {
  light: () => settings.hapticFeedback && Haptics.impactAsync(ImpactFeedbackStyle.Light),
  medium: () => settings.hapticFeedback && Haptics.impactAsync(ImpactFeedbackStyle.Medium),
  success: () => settings.hapticFeedback && Haptics.notificationAsync(NotificationFeedbackType.Success),
  warning: () => settings.hapticFeedback && Haptics.notificationAsync(NotificationFeedbackType.Warning),
  error: () => settings.hapticFeedback && Haptics.notificationAsync(NotificationFeedbackType.Error),
};
```

**Effort**: Low (4 hours)

---

### 4.5 Onboarding Improvements

**Problem**: Onboarding doesn't explain API key requirement.

**Required Changes**:
1. Add API key setup step (optional, can skip)
2. Explain what Gemini AI does
3. Show sample task output
4. Add "Take a tour" option for returning users

**Effort**: Medium (1-2 days)

---

## CHUNK 5: Technical Debt

### 5.1 Split DeclutterContext

**Problem**: 996-line context file with too many responsibilities.

**Recommended Split**:
```
context/
  DeclutterContext.tsx    → Core app state (user, rooms, settings)
  GameContext.tsx         → Stats, badges, XP, collectibles
  MascotContext.tsx       → Mascot state and actions
  FocusContext.tsx        → Focus session state
  SyncContext.tsx         → Cloud sync logic
```

**Effort**: High (3-4 days)

---

### 5.2 Extract Room Detail Components

**Problem**: Room detail screen is 1440+ lines.

**Recommended Split**:
```
app/room/[id].tsx                  → Main screen (routing, state)
components/room/
  RoomHero.tsx                     → Hero section with progress
  TaskList.tsx                     → Task list with filters
  TaskCard.tsx                     → Individual task card
  PhotoGallery.tsx                 → Photo section
  FocusModeCard.tsx                → Focus mode CTA
  OverwhelmModal.tsx               → Breathing exercise modal
  GoodEnoughModal.tsx              → 70% celebration modal
  RoomCompleteModal.tsx            → 100% celebration modal
```

**Effort**: Medium-High (2-3 days)

---

### 5.3 Add Type Validation

**Problem**: AI responses parsed with type assertions, no runtime validation.

**Solution**: Add Zod schemas for runtime validation

```typescript
// types/schemas.ts
import { z } from 'zod';

export const AITaskSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  emoji: z.string(),
  priority: z.enum(['high', 'medium', 'low']),
  difficulty: z.enum(['quick', 'medium', 'challenging']),
  estimatedMinutes: z.number().min(1).max(120),
  tips: z.array(z.string()).optional(),
  subtasks: z.array(z.object({
    title: z.string(),
  })).optional(),
});

export const AIAnalysisResultSchema = z.object({
  messLevel: z.number().min(0).max(100),
  summary: z.string(),
  encouragement: z.string(),
  tasks: z.array(AITaskSchema),
  quickWins: z.array(z.string()),
  estimatedTotalTime: z.number(),
  roomType: z.string().optional(),
});

// In gemini.ts
function parseAIResponse(responseText: string): AIAnalysisResult {
  // ... existing JSON extraction ...
  const result = AIAnalysisResultSchema.safeParse(parsed);
  if (!result.success) {
    console.error('Invalid AI response:', result.error);
    return getDefaultTasks();
  }
  return transformToInternalFormat(result.data);
}
```

**Effort**: Medium (1 day)

---

### 5.4 Add Unit Tests

**Problem**: No test coverage for critical business logic.

**Priority Test Files**:
1. `context/DeclutterContext.test.ts` - State management
2. `services/gemini.test.ts` - AI parsing
3. `types/declutter.test.ts` - Type validation
4. `services/auth.test.ts` - Auth flows

**Effort**: High (ongoing, 1 week initial)

---

## Implementation Priority

### Phase 1: Critical (Week 1)
1. Fix Gemini model name
2. Add API key input UI
3. Fix authentication flow routing
4. Fix streak calculation bug

### Phase 2: Stability (Week 2)
1. Fix photo storage
2. Fix toggleTask race conditions
3. Add error boundaries
4. Add network error handling

### Phase 3: Cloud Sync (Week 3)
1. Implement syncToCloud
2. Add sync status indicator
3. Add offline indicator
4. Handle merge conflicts

### Phase 4: Features (Week 4)
1. Manual task creation
2. Room editing
3. Photo deletion

### Phase 5: Polish (Week 5)
1. Notifications
2. Progress analytics
3. Accessibility audit
4. Loading states

### Phase 6: Technical Debt (Ongoing)
1. Split contexts
2. Add tests
3. Add Zod validation

---

## Summary

**Critical Fixes**: 5 items (blocking production)
**Stability Fixes**: 5 items (high crash/bug risk)
**Feature Completeness**: 5 items (core user expectations)
**Polish**: 5 items (professional quality)
**Technical Debt**: 4 items (maintainability)

**Estimated Total Effort**: 6-8 weeks for single developer, 3-4 weeks with 2 developers.

**Recommended V1 Scope**: Phases 1-3 (Critical + Stability + Cloud Sync) = ~3 weeks
- This gives users a working, stable app with data persistence
- Features and polish can be added in V1.1, V1.2 releases
