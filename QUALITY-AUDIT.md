# Declutter App -- Quality Audit Report

**Date:** 2026-03-20
**Auditor:** Claude Opus 4.6 (automated)
**Files analyzed:** 176 files, 1079 code graph nodes, 8044 edges

---

## CRITICAL ISSUES

### 1. XP Level Calculation Inconsistency (CRITICAL)

**Files:**
- `context/DeclutterContext.tsx:503` -- `Math.floor(xp / 100) + 1`
- `convex/stats.ts:17` -- `Math.floor(xp / 100) + 1`
- `app/focus.tsx:216` -- `Math.floor(newXp / 100) + 1`
- `app/(tabs)/profile.tsx:37,94` -- `XP_PER_LEVEL = 500`, `Math.floor(totalXP / 500) + 1`
- `app/achievements.tsx:35,70` -- `XP_PER_LEVEL = 500`, `Math.floor(currentXp / 500) + 1`
- `constants/app.ts:34` -- `XP_PER_LEVEL = 500`

**Bug:** The core context and backend use 100 XP per level, but profile and achievements screens use 500 XP per level. A user with 250 XP sees Level 3 on the home screen but Level 1 on their profile. The progress bar on profile shows 250/500 XP instead of 50/100 XP.

**Fix:** Centralize on `constants/app.ts` value (100 XP). Update profile and achievements to import from constants.

---

### 2. `lastCollected` Type Mismatch -- `Date` vs `number` (CRITICAL)

**Files:**
- `types/declutter.ts:137` -- `lastCollected?: Date`
- `context/DeclutterContext.tsx:1222` -- `lastCollected: Date.now() as any`
- `convex/schema.ts:293` -- `lastCollected: v.optional(v.number())`
- `services/hydration.ts:488` -- `asOptionalDate(stats.lastCollected)`

**Bug:** The type says `Date` but the value assigned is `Date.now()` (a number), cast with `as any` to silence the error. Convex schema also stores it as `number`. The hydration layer converts it back to `Date`. While the hydration fixes it on read, the `as any` bypasses type safety and the interface is misleading.

**Fix:** Change the type to `number` to match the actual storage format, remove `as any`.

---

### 3. Stale Closure in `toggleTask` -- `rooms.find()` uses stale `rooms` (HIGH)

**File:** `context/DeclutterContext.tsx:871`

```typescript
// Inside requestAnimationFrame callback:
if (roomJustCompleted) {
  const completedRoom = rooms.find(r => r.id === roomId);  // <-- stale closure
  if (completedRoom) {
    notifyRoomComplete(completedRoom.name, completedRoom.id).catch(() => {});
  }
}
```

**Bug:** The `rooms` variable captured in the `toggleTask` useCallback closure is stale -- it refers to the rooms array from when the callback was created, not the updated rooms after `setRooms`. The room name used in the notification could be outdated if it was renamed between renders.

**Fix:** Capture room name during the `setRooms` updater where fresh data is available.

---

### 4. `as any` Type Casts Hiding Real Issues (HIGH)

**Files (27 occurrences across 9 files):**
- `services/ai.ts:83` -- `energyLevel: energyLevel as any`
- `app/analysis.tsx` -- 14 `as any` casts in task processing
- `context/DeclutterContext.tsx:898,1222` -- `roomTypeRef as any`, `Date.now() as any`
- `app/task-customize.tsx` -- 2 casts

**Fix:** Replace `as any` with proper type assertions or fix the underlying type mismatches.

---

## HIGH SEVERITY ISSUES

### 5. `Dimensions.get('window')` Called at Module Level (HIGH)

**Files:** 18 files use `Dimensions.get('window')` at module scope.

**Bug:** Module-level `Dimensions.get('window')` captures the value once at import time. On iPad multitasking, screen rotation, or foldable devices, the cached dimensions become incorrect. Layouts will be wrong.

**Key files:**
- `app/camera.tsx:48`
- `app/(tabs)/index.tsx:68`
- `app/blitz.tsx:44`
- `app/analysis.tsx:48`
- `components/ui/CelebrationEngine.tsx:69`

**Fix:** Use `useWindowDimensions()` hook inside components instead. For rare cases where module-level is needed, use `Dimensions.addEventListener('change')`.

---

### 6. Missing `useEffect` Cleanup for Reanimated Shared Values (MEDIUM)

**File:** `app/room-complete.tsx:44-57`

```typescript
useEffect(() => {
  translateY.value = withRepeat(...);
  rotate.value = withRepeat(...);
  opacity.value = withDelay(5000, withTiming(0, { duration: 500 }));
}, []);
```

**Bug:** No cleanup -- `cancelAnimation` is not called on unmount. Can cause warnings or unexpected behavior if the component unmounts during animation.

---

### 7. `ConfettiPiece` Missing Cleanup -- Shared Values Animate After Unmount (MEDIUM)

**File:** `app/room-complete.tsx:44-57`

Empty deps array `[]` and no cleanup return. Same pattern appears in `SkeletonBox` in `app/(tabs)/index.tsx:149-155`.

---

### 8. Focus Screen XP Calculation Duplicates Core Logic (HIGH)

**File:** `app/focus.tsx:210-220`

```typescript
const newXp = (stats?.xp ?? 0) + xpEarned;
updateStats({
  xp: newXp,
  level: Math.floor(newXp / 100) + 1,
  ...
});
```

**Bug:** Uses `Math.floor(newXp / 100) + 1` which matches the context but not the profile page (which uses 500). This is a manifestation of Issue #1. Also, `updateStats` does a shallow merge which could cause race conditions with `toggleTask`'s `setStats` if both fire on the same render cycle.

---

### 9. `deleteRoom` Silently Swallows Convex Mutation Errors (MEDIUM)

**File:** `context/DeclutterContext.tsx:552-558`

```typescript
try {
  convex.mutation(api.rooms.remove, { id: toConvexId<'rooms'>(roomId) });
} catch (error) {
  if (__DEV__) console.error('Failed to delete room in Convex:', error);
}
```

**Bug:** `convex.mutation()` returns a Promise, but it's not `await`ed. The `try/catch` will never catch async errors. The room is deleted locally but may persist on the server.

**Fix:** Add `void` prefix and move error handling to `.catch()`.

---

### 10. `analysis.tsx` Navigates Without Unmount Guard (MEDIUM)

**File:** `app/analysis.tsx:199-314`

The `runAnalysis` function uses `cancelledRef.current` checks but the `useEffect` on line 165 doesn't handle rapid remounts. If the user navigates away and back quickly, two analyses could run in parallel.

---

### 11. `Haptics.impactAsync` Called Without Checking `hapticFeedback` Setting (MEDIUM)

**Files:** Multiple screens call `Haptics.impactAsync()` directly without checking `settings.hapticFeedback`. The central `setHapticsEnabled` controls a global flag, but several screens import Haptics directly and call it unconditionally.

**Key offenders:**
- `app/blitz.tsx`
- `app/focus.tsx`
- `app/room-complete.tsx`
- `app/session-complete.tsx`
- `app/camera.tsx`
- `app/task-customize.tsx`

**Fix:** All haptic calls should use the centralized `haptics` service that respects the user's setting.

---

### 12. `useMemo` Dependencies Incomplete in Home Screen (MEDIUM)

**File:** `app/(tabs)/index.tsx:399-411`

```typescript
const todayTasksDone = useMemo(() => {
  const today = new Date().toDateString();
  ...
}, [rooms]);
```

The computation uses `new Date()` which means it won't update when the day rolls over while the app is open. Not a crash bug but leads to stale data.

---

## MEDIUM SEVERITY ISSUES

### 13. `v.any()` Used Extensively in `convex/sync.ts` (MEDIUM)

**File:** `convex/sync.ts:194-204`

```typescript
args: {
  profile: v.optional(v.any()),
  rooms: v.array(v.any()),
  stats: v.any(),
  settings: v.any(),
  ...
}
```

The `replaceUserState` mutation uses `v.any()` for every argument. This bypasses Convex's type validation, allowing malformed data to enter the database. The `validateSyncData` function adds manual validation, but it only checks a subset of fields.

---

### 14. Empty `catch` Blocks Silently Swallow Errors (MEDIUM)

**File:** `context/DeclutterContext.tsx:401-431`

Multiple instances of:
```typescript
try { setRooms(hydrateRooms(JSON.parse(roomsStr))); } catch { /* corrupted */ }
```

While the comment says "corrupted", there's no logging or recovery. A user's data could silently fail to load with no indication.

---

### 15. `requestAnimationFrame` in `toggleTask` Can Cause State Tearing (MEDIUM)

**File:** `context/DeclutterContext.tsx:810`

```typescript
requestAnimationFrame(() => {
  if (taskJustCompleted) {
    setStats(prevStats => { ... });
    ...
  }
});
```

The `requestAnimationFrame` defers stat updates to the next frame. During the gap, the UI shows the task as completed but stats/XP haven't updated yet. If the user navigates away in that gap, stat updates are lost.

---

### 16. Profile Screen Uses Different XP_PER_LEVEL Than Backend (see #1) (HIGH)

Already covered in Issue #1 but impacts profile.tsx specifically:
- Profile shows Level 1 at 499 XP
- Home/Context shows Level 5 at 499 XP
- This is visible to users and damages trust

---

### 17. `clearUserState` in sync.ts Deletes Everything Before Re-inserting (MEDIUM)

**File:** `convex/sync.ts:20-107, 231`

The `replaceUserState` mutation calls `clearUserState` which deletes ALL user data (rooms, tasks, photos, stats, badges, etc.) before re-inserting from the sync payload. If the sync payload is incomplete or the insertion fails partway, the user loses data with no rollback.

---

### 18. `order` Field Not Set on Task Creation from Client (LOW)

**File:** `context/DeclutterContext.tsx:676-688`

`addTaskToRoom` creates tasks without an `order` field. The sync layer and room detail screen rely on `order` for sorting. Tasks added locally won't sort correctly after a round-trip through cloud sync.

---

## LOW SEVERITY ISSUES

### 19. Console Statements (95 Across 21 Files)

All console statements are guarded by `__DEV__` which is good. No production console leaks found.

### 20. Module-Level `Dimensions.get` in Components (see #5)

Lower-risk for simple phone-only use but should be fixed for iPad support.

### 21. `generatePhasesFromTasks` and `extractSuppliesFromTasks` Used But Not Shown

These helper functions in `convex/gemini.ts` are called but their return types use `any[]`. Should be properly typed.

### 22. `ScreenErrorBoundary` Wrapping is Inconsistent

Most screens wrap in `ScreenErrorBoundary` which is good. Verified coverage:
- `app/(tabs)/index.tsx` -- yes
- `app/camera.tsx` -- yes
- `app/analysis.tsx` -- yes
- `app/blitz.tsx` -- yes
- `app/focus.tsx` -- yes
- `app/settings.tsx` -- yes (already wrapped)
- `app/onboarding.tsx` -- wrapped internally per step
- `app/session-complete.tsx` -- FIXED (was missing)
- `app/room-complete.tsx` -- FIXED (was missing)

### 23. No Debounce on Task Toggle Haptics

Rapid task toggling can fire many haptic events without throttling.

---

## PERFORMANCE ISSUES

### 24. DeclutterProvider is 1325 Lines (CRITICAL REFACTOR)

The `DeclutterProvider` function is 1325 lines long. This single component manages rooms, stats, settings, mascot, focus, collection, sync, badges, and more. Every state change re-renders the entire tree because the context value changes.

**Recommendation:** Split into smaller contexts (RoomContext, StatsContext, MascotContext, FocusContext, SyncContext).

### 25. `useMemo` Context Value Dependencies Miss Callback Functions

**File:** `context/DeclutterContext.tsx:1305-1381`

The `useMemo` for the context value only depends on state values, not callback functions. This means the callbacks are re-created on every render but the context object is only updated when state changes. This is actually correct (callbacks are stable `useCallback` refs), but the ESLint disable comment should be more specific.

### 26. Module-Level Dimensions (see #5)

Static `SCREEN_WIDTH` won't update on rotation or iPad split view.

### 27. Large File Sizes

Several files exceed 700 lines and should be decomposed:
- `app/(tabs)/index.tsx` -- 1743 lines
- `app/room/[id].tsx` -- 1603 lines
- `context/DeclutterContext.tsx` -- 1429 lines
- `app/analysis.tsx` -- 1338 lines
- `app/blitz.tsx` -- 1238 lines
- `convex/gemini.ts` -- 1203 lines

---

## FIXES APPLIED

TypeScript check after fixes: **0 new errors introduced** (4 pre-existing SCREEN_WIDTH errors in unmodified files remain).

### Fix 1: XP Level Calculation Consistency (Issue #1 -- CRITICAL)
**Files modified:**
- `constants/app.ts` -- Changed `XP_PER_LEVEL = 500` to `XP_PER_LEVEL = 100` to match `context/DeclutterContext.tsx` and `convex/stats.ts`
- `app/(tabs)/profile.tsx` -- Removed local `XP_PER_LEVEL = 500`, now imports from `@/constants/app`
- `app/achievements.tsx` -- Removed local `XP_PER_LEVEL = 500`, now imports from `@/constants/app`

**Impact:** Users now see consistent level numbers across all screens.

### Fix 2: `lastCollected` Type Fix (Issue #2 -- CRITICAL)
**Files modified:**
- `types/declutter.ts` -- Changed `lastCollected?: Date` to `lastCollected?: number`
- `context/DeclutterContext.tsx` -- Removed `as any` cast, now `lastCollected: Date.now()` is type-safe
- `services/hydration.ts` -- Changed hydration to return `number` instead of `Date` for `lastCollected`

### Fix 3: `deleteRoom` Async Error Handling (Issue #9 -- MEDIUM)
**File modified:** `context/DeclutterContext.tsx`
- Changed from `try { convex.mutation(...) } catch` (which can't catch async errors) to `void convex.mutation(...).catch()`

### Fix 4: Missing ScreenErrorBoundary (Issue #22 -- LOW)
**Files modified:**
- `app/session-complete.tsx` -- Wrapped in `ScreenErrorBoundary`, extracted content to `SessionCompleteScreenContent`
- `app/room-complete.tsx` -- Wrapped in `ScreenErrorBoundary`, extracted content to `RoomCompleteScreenContent`

### Fix 5: `as any` Type Casts Removed (Issues #3, #4 -- HIGH)
**Files modified:**
- `services/ai.ts` -- Changed `energyLevel as any` to proper union type assertion
- `context/DeclutterContext.tsx` -- Changed `roomTypeRef` from `string | undefined` to `RoomType | undefined`, removed `as any` cast, added `RoomType` import

### Fix 6: Stale `rooms` Closure in toggleTask (Issue #3 -- HIGH)
**File modified:** `context/DeclutterContext.tsx`
- Added `completedRoomName` variable captured inside `setRooms` updater (where data is fresh)
- Changed room completion notification to use captured name instead of stale `rooms.find()`

### Fix 7: Pre-existing Linter Issue in achievements.tsx
**File modified:** `app/achievements.tsx`
- Added fallback `BADGE_CARD_WIDTH` constant for StyleSheet (linter had removed `Dimensions` import but left reference in styles)
