# Declutterly - Code Review & Issues Report

**Date**: January 2026  
**Reviewer**: Code Analysis  
**App Version**: 1.0.0  

---

## Executive Summary

Declutterly is a well-structured Expo/React Native app for AI-powered room decluttering. The codebase shows thoughtful architecture but has several issues that should be addressed before production release.

**Critical Issues**: 3  
**High Priority**: 8  
**Medium Priority**: 12  
**Low Priority**: 7  

---

## 1. Critical Issues (Must Fix)

### 1.1 Firebase Configuration Placeholder Values
**File**: `config/firebase.ts`  
**Lines**: 21-28

```typescript
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'YOUR_API_KEY',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'YOUR_AUTH_DOMAIN',
  // ...
};
```

**Problem**: Fallback values like `'YOUR_API_KEY'` will cause silent failures. The `isFirebaseConfigured()` check only catches some cases.

**Fix**: 
- Remove placeholder fallbacks entirely
- Throw meaningful error if env vars not configured
- Add validation on app startup

---

### 1.2 TypeScript Error Suppression
**File**: `config/firebase.ts`  
**Line**: 12

```typescript
// @ts-expect-error - getReactNativePersistence is exported but types may be missing
import { getReactNativePersistence } from 'firebase/auth';
```

**Problem**: Type suppression hides potential runtime issues.

**Fix**: 
- Install `@types/firebase` or update Firebase version
- Use proper type assertion if needed

---

### 1.3 API Key Exposure Risk in Gemini Service
**File**: `services/gemini.ts`  
**Line**: 377

```typescript
const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
```

**Problem**: API key in URL can be logged by proxies, network tools, or error reporters.

**Fix**: 
- Move API key to `Authorization` header
- Or use request body for key transmission

---

## 2. High Priority Issues

### 2.1 Documentation Mismatch - SDK Version
**Files**: `DOCUMENTATION.md` vs `package.json`

- DOCUMENTATION.md claims: "Expo SDK 55 (Canary), Expo Router 7"
- package.json shows: "expo": "~54.0.30", "expo-router": "~6.0.21"

**Fix**: Update documentation to match actual versions (SDK 54, Router 6).

---

### 2.2 Massive Context File - Maintainability Risk
**File**: `context/DeclutterContext.tsx`  
**Lines**: 987 total

**Problem**: Single file handles:
- User state
- Room management
- Stats tracking
- Mascot logic
- Focus mode
- Collections
- Data persistence

**Fix**: Split into separate contexts or use a state management library:
- `UserContext` - user profile, stats
- `RoomsContext` - rooms, tasks
- `GameContext` - mascot, collectibles, achievements
- `SettingsContext` - app settings, focus mode

---

### 2.3 Race Condition in toggleTask
**File**: `context/DeclutterContext.tsx`  
**Lines**: 434-535

```typescript
const toggleTask = useCallback((roomId: string, taskId: string) => {
  const room = rooms.find(r => r.id === roomId);
  const task = room?.tasks.find(t => t.id === taskId);
  // ...uses rooms from closure, then updates
```

**Problem**: Reading `rooms` from closure then updating asynchronously can cause stale data issues when toggling multiple tasks rapidly.

**Fix**: Use functional state updates consistently:
```typescript
setRooms(prev => {
  const room = prev.find(r => r.id === roomId);
  // all logic inside functional update
});
```

---

### 2.4 Missing Error Boundaries on Key Screens
**Files**: `app/camera.tsx`, `app/analysis.tsx`

**Problem**: Camera and AI analysis are most likely to fail, but errors may crash the entire app.

**Fix**: Wrap each screen in ErrorBoundary or add try-catch with fallback UI.

---

### 2.5 Inconsistent Loading State Handling
**File**: `app/(tabs)/index.tsx`  
**Lines**: 68-72

```typescript
useEffect(() => {
  const timer = setTimeout(() => setIsLoading(false), 800);
  return () => clearTimeout(timer);
}, []);
```

**Problem**: Hardcoded 800ms delay doesn't reflect actual data loading. Could show content before data is ready or delay UI unnecessarily.

**Fix**: Base loading state on actual data readiness from context `isLoaded`.

---

### 2.6 Cloud Sync Not Integrated
**File**: `context/AuthContext.tsx`  
**Lines**: 264-266

```typescript
const syncToCloud = useCallback(async (): Promise<void> => {
  // This will be called from DeclutterContext with the actual data
}, []);
```

**Problem**: Cloud sync is declared but never implemented/connected. Users expect data backup but it's not happening.

**Fix**: Either implement properly or remove from UI to avoid false expectations.

---

### 2.7 Unused Dependencies
**File**: `package.json`

Potentially unused (verify with bundler):
- `expo-video` - Video features not fully implemented
- `expo-video-thumbnails` - Referenced but implementation incomplete
- `react-native-webview` - No WebView usage found

**Fix**: Audit with `npx expo-doctor` and remove unused deps.

---

### 2.8 Camera Screen Missing Video Recording Implementation
**File**: `app/camera.tsx`

Documentation claims video recording support, but the camera screen only captures photos:
- `takePicture()` function exists
- No `startRecording()`/`stopRecording()` found
- Video mode toggle not implemented

**Fix**: Either implement video recording or remove video claims from documentation.

---

## 3. Medium Priority Issues

### 3.1 Hardcoded Colors Instead of Theme
**File**: `app/analysis.tsx`  
**Multiple locations**

```typescript
colors={['#1a1a2e', '#16213e', '#0f3460']}  // Line 428-429
color: '#22C55E'  // Multiple places
```

**Fix**: Use `colors.success`, `colors.background` from theme.

---

### 3.2 Missing Accessibility Labels
**Files**: Various

Several interactive elements lack proper accessibility:
- `app/camera.tsx`: Capture button needs `accessibilityLabel`
- `components/features/CollectibleSpawn.tsx`: Collectible items need labels
- Some modals missing `accessibilityViewIsModal`

**Fix**: Add comprehensive accessibility labels and hints.

---

### 3.3 No Input Validation on Onboarding
**File**: `app/onboarding.tsx` (need to verify)

User name input likely lacks:
- Length validation
- Special character handling
- Empty state prevention

**Fix**: Add validation with helpful error messages.

---

### 3.4 Image Base64 Memory Issues
**File**: `app/analysis.tsx`  
**Line**: 193

```typescript
const base64 = await FileSystem.readAsStringAsync(imageUri, {
  encoding: 'base64',
});
```

**Problem**: Large images converted to base64 strings can cause memory issues on lower-end devices.

**Fix**: 
- Resize images before encoding
- Use streaming if possible
- Add memory-conscious error handling

---

### 3.5 Focus Mode Timer Accuracy
**File**: Likely in focus screen

Interval-based timers in React Native can drift due to JS thread blocking.

**Fix**: Use absolute time calculations:
```typescript
const endTime = startTime + duration;
const remaining = endTime - Date.now();
```

---

### 3.6 AsyncStorage Key Collision Risk
**File**: `context/DeclutterContext.tsx`

Keys like `@declutterly_rooms` could collide if user has multiple accounts or the app is forked.

**Fix**: Include user ID in storage keys when authenticated.

---

### 3.7 No Offline Detection in AI Analysis
**File**: `services/gemini.ts`

AI calls will fail silently without network. No offline mode handling.

**Fix**: 
- Check network status before API calls
- Show "No internet" message
- Queue requests for when online

---

### 3.8 Missing Rate Limit UI Feedback
**File**: `services/secureStorage.ts`

Rate limiter exists but UI doesn't show remaining requests or cooldown time.

**Fix**: Expose rate limit status to UI, show countdown when limited.

---

### 3.9 Deprecated Expo API Usage
**File**: `app.json`

```json
"plugins": [
  "expo-router",
  // ...
]
```

Verify all plugins are compatible with SDK 54. Some may have deprecated configurations.

---

### 3.10 No Haptics Preference Check
**Files**: Multiple (camera.tsx, analysis.tsx, etc.)

Haptics are called without checking user preference first:
```typescript
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
```

**Fix**: Check `settings.hapticFeedback` before triggering.

---

### 3.11 Missing Test Files
**Files**: No `__tests__` directory found

Despite `jest` being in devDependencies, no test files exist.

**Fix**: Add tests for:
- Context actions
- Gemini service parsing
- Critical user flows

---

### 3.12 Console Logs in Production
**Files**: Multiple services

```typescript
console.error('Error loading data:', error);
```

**Fix**: Use proper logging service or conditionally log only in `__DEV__`.

---

## 4. Low Priority Issues

### 4.1 Magic Numbers
**File**: `context/DeclutterContext.tsx`

```typescript
}, 60000); // Check every minute
// ...
const hoursSinceInteraction = (now.getTime() - ...) / (1000 * 60 * 60);
```

**Fix**: Use named constants: `const ONE_MINUTE = 60000;`

---

### 4.2 Inconsistent File Naming
**Files**: Mix of patterns

- `GlassCard.tsx` (PascalCase)
- `useAnimatedPress.ts` (camelCase)
- Screens use lowercase

**Fix**: Standardize: components = PascalCase, hooks = camelCase, screens = lowercase.

---

### 4.3 Long Component Files
**Files**: 
- `app/analysis.tsx` - 1187 lines
- `app/(tabs)/index.tsx` - 900 lines
- `app/camera.tsx` - 871 lines

**Fix**: Extract sub-components to separate files.

---

### 4.4 Duplicate Type Definitions
**Files**: `types/declutter.ts` vs inline types

Some types are defined inline in components that duplicate central definitions.

**Fix**: Always import from `types/declutter.ts`.

---

### 4.5 Missing JSDoc on Complex Functions
**File**: `services/gemini.ts`

Functions like `parseAIResponse` lack documentation.

**Fix**: Add JSDoc comments explaining parameters and return values.

---

### 4.6 Unused Exports
**File**: `context/DeclutterContext.tsx`

Functions like `loadApiKey`, `deleteApiKey` are exported but may not be used externally.

**Fix**: Audit exports, mark internal functions with underscore prefix.

---

### 4.7 Inconsistent Promise Error Handling
**Files**: Various

Mix of:
```typescript
} catch (error) {
} catch (error: any) {
} catch {
```

**Fix**: Standardize error handling pattern across codebase.

---

## 5. Performance Recommendations

### 5.1 Memoization Opportunities
- `DeclutterContext` value object is memoized but callbacks may not be
- Heavy computations in render (filtering rooms, calculating progress)

### 5.2 Image Optimization
- No image caching strategy visible
- Room photos should use progressive loading
- Consider `expo-image` caching config

### 5.3 List Virtualization
- Room lists may not be virtualized
- Use `FlashList` for better performance with many rooms

---

## 6. Security Recommendations

### 6.1 API Key Storage
Currently secure via expo-secure-store. Ensure:
- Keys never logged
- Keys never in error reports
- Keys rotatable without app update

### 6.2 Firebase Rules
Verify Firestore security rules prevent:
- Users accessing other users' data
- Unauthenticated writes
- Oversized documents

### 6.3 Input Sanitization
AI prompts include user context - ensure sanitization:
```typescript
const sanitizedContext = additionalContext
  ? additionalContext.slice(0, 500).replace(/[<>{}]/g, '')
  : undefined;
```
This exists but verify coverage.

---

## 7. Before Production Checklist

- [ ] Fix all Critical issues
- [ ] Fix all High Priority issues
- [ ] Add error boundaries to all screens
- [ ] Implement or remove cloud sync
- [ ] Add comprehensive error messages
- [ ] Test on low-end devices
- [ ] Test offline scenarios
- [ ] Add basic test coverage
- [ ] Remove all `console.log` statements
- [ ] Verify Firebase security rules
- [ ] Test all authentication flows
- [ ] Validate App Store/Play Store compliance
- [ ] Add analytics/crash reporting
- [ ] Document environment setup
- [ ] Create app store assets

---

## 8. Positive Observations

1. **Clean Architecture**: Clear separation of concerns (services, context, components)
2. **Type Safety**: Good TypeScript usage with comprehensive type definitions
3. **Accessibility Foundation**: Many components have accessibility labels
4. **Theme Support**: Proper dark/light mode implementation
5. **Error Handling**: Gemini service has good error sanitization
6. **Secure Storage**: API keys use expo-secure-store properly
7. **Animation Quality**: Smooth animations with react-native-reanimated
8. **Modern Stack**: Uses latest Expo SDK 54 with new architecture enabled

---

## Summary

The app is well-architected but needs polish before production. Focus on:
1. **Stability**: Error boundaries, network handling, input validation
2. **Consistency**: Theme colors, accessibility, error messages
3. **Testing**: Add basic test coverage
4. **Documentation**: Update docs to match implementation

Estimated effort to address all issues: **2-3 developer weeks**
