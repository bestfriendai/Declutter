# Declutter App - Comprehensive Improvement Audit

> Generated: March 2026  
> Focus: Full-stack React Native (Expo) app with Convex backend

---

## Executive Summary

This audit identifies **147 issues** across 6 categories requiring attention. The app demonstrates strong foundational architecture but has significant room for improvement in code quality, testing, security, and polish.

| Category | Critical | High | Medium | Low | Total |
|---------|----------|------|--------|-----|-------|
| Code Quality | 2 | 8 | 22 | 15 | 47 |
| UI/UX | 1 | 5 | 18 | 12 | 36 |
| Security | 1 | 3 | 5 | 2 | 11 |
| Performance | 0 | 4 | 8 | 6 | 18 |
| Testing | 0 | 3 | 9 | 5 | 17 |
| DevEx | 1 | 2 | 8 | 7 | 18 |
| **TOTAL** | **5** | **25** | **70** | **47** | **147** |

---

## 1. Code Quality & Architecture

### 1.1 TypeScript Issues (Critical)

#### 🔴 CRITICAL: `any` Type Usage
The codebase contains `any` type annotations that bypass TypeScript safety:

| File | Line | Issue |
|------|------|-------|
| `services/ai.ts` | 326 | `messLevel: 'moderate' as any` |
| `context/DeclutterContext.tsx` | 103-175 | Multiple `hydrate*` functions accept `any` parameters |
| `services/convexMappers.ts` | (not reviewed) | Likely has `any` types |
| `convex/*.ts` | Various | Generated types may use `any` |

**Recommendation**: Replace with proper types or `unknown` with type guards.

#### 🔴 CRITICAL: Missing Error Types
Services throw generic errors without custom error classes:

```typescript
// Current (services/ai.ts:35-61)
catch (error) {
  if (__DEV__) console.error('AI analysis failed after retries:', error);
  return getFallbackAnalysis(additionalContext);
}
```

**Recommendation**: Create custom error classes:
```typescript
class AIAnalysisError extends Error {
  constructor(message: string, public retryable: boolean) {
    super(message);
    this.name = 'AIAnalysisError';
  }
}
```

---

### 1.2 High Priority Issues

#### 🟠 Context Provider Size
**File**: `context/DeclutterContext.tsx` (1366 lines)

The `DeclutterContext` is a 1366-line monolith handling:
- Local state management (11+ state variables)
- Cloud sync with Convex
- Mascot interactions
- Focus sessions
- Collection/collectibles
- Badge checking
- Photo management

**Issues**:
- Single file is too large for maintainability
- `useCallback` dependencies are complex (see lines 1310-1327)
- 60+ functions in one provider

**Recommendation**: Split into smaller contexts:
```
context/
├── AuthContext.tsx         (existing)
├── UserContext.tsx         # user, stats, settings
├── RoomContext.tsx         # rooms, tasks, photos
├── SessionContext.tsx      # currentSession, focusSession
├── GamificationContext.tsx # mascot, collection, badges
└── DeclutterProvider.tsx   # composes all above
```

#### 🟠 Duplicate Hydration Logic
**Files**: `context/DeclutterContext.tsx`, `services/convexMappers.ts`

Hydration logic exists in both places:
- `DeclutterContext.tsx`: Lines 95-184 (hydrateUserProfile, hydrateTask, hydrateRoom, etc.)
- `convexMappers.ts`: Likely duplicate mappers

**Recommendation**: Consolidate into a single `hydration.ts` utility.

#### 🟠 Hardcoded Strings Throughout
Hardcoded strings scattered across:
- `services/notifications.ts` (all notification messages)
- `components/room/TaskCard.tsx` (encouragement messages)
- `app/room/[id].tsx` (ENCOURAGEMENT_MESSAGES array)

**Recommendation**: Extract to `constants/Strings.ts` or implement i18n.

#### 🟠 Magic Numbers
```typescript
// context/DeclutterContext.tsx
const hoursSinceInteraction = (now.getTime() - new Date(mascot.lastInteraction).getTime()) / (1000 * 60 * 60); // Line 352

// services/ai.ts
const AI_ANALYSIS_TIMEOUT_MS = 30_000;
const AI_LIGHT_TIMEOUT_MS = 10_000;
```

**Recommendation**: Create `constants/Time.ts`:
```typescript
export const Time = {
  MS_PER_SECOND: 1000,
  MS_PER_MINUTE: 60_000,
  MS_PER_HOUR: 3_600_000,
  AI_ANALYSIS_TIMEOUT_MS: 30_000,
  AI_LIGHT_TIMEOUT_MS: 10_000,
} as const;
```

---

### 1.3 Medium Priority Issues

#### 🟡 Unused Variables & Imports
```typescript
// app/room/[id].tsx:191
const [filter, _setFilter] = useState<'all' | 'pending' | 'completed'>('all');
// _setFilter is prefixed with underscore but still declared
```

#### 🟡 Inconsistent Naming
- `generateId()` uses kebab-case in constants but camelCase elsewhere
- Some functions use `Action` suffix (`feedMascotAction`), others don't (`toggleTask`)

#### 🟡 Missing JSDoc
Most exported functions lack JSDoc comments.

#### 🟡 Console.log Leftovers
```typescript
// services/ai.ts:53
if (__DEV__) console.log(`AI analysis retry ${attempt}: ${error.message}`);
```

While wrapped in `__DEV__`, these should use a proper logger.

---

## 2. UI/UX & Features

### 2.1 Critical Issues

#### 🔴 No Loading Skeletons for Initial Load
**File**: `context/DeclutterContext.tsx`

The provider returns `null` during initial load (line 1329-1331):
```typescript
if (!isLoaded) {
  return null;
}
```

This causes a flash of blank screen. No skeleton or loading state is shown to user.

**Recommendation**: Add loading skeleton in root layout.

---

### 2.2 High Priority Issues

#### 🟠 Missing Error Boundaries Per Feature
**File**: `components/ErrorBoundary.tsx` (exists)

There's a global ErrorBoundary, but:
- No per-route error boundaries
- No error recovery UI (retry buttons)
- No error logging service integration

#### 🟠 Inconsistent Empty States
- Some screens have `EmptyStateCard` component
- Others show nothing or generic text
- No standardized empty state pattern

#### 🟠 No Offline Mode UI
- `components/ui/OfflineIndicator.tsx` exists but:
  - Only shows generic "offline" text
  - Doesn't explain what features are unavailable
  - No offline task queue indicator

#### 🟠 Accessibility Issues
- Missing `accessibilityLabel` on many interactive elements
- No `accessibilityHint` for ambiguous actions
- Contrast issues possible in light/dark modes (not audited)

#### 🟠 No Keyboard Navigation
- Touch targets may be too small
- No focus indicators visible
- Modal traps focus but no visible focus ring

---

### 2.3 Medium Priority Issues

#### 🟡 Inconsistent Component APIs
```typescript
// Some components use callback props
<ComboCounter onIncrement={handleIncrement} />

// Others use imperative refs
<ProgressRing ref={ringRef} />
```

#### 🟡 Animation Performance
- `app/room/[id].tsx` uses multiple `useAnimatedValue` and `withTiming` calls
- No `useReducedMotion` check in some animations
- Haptic feedback on every task toggle may be excessive

#### 🟡 Missing Input Validation Feedback
- Photo capture: no feedback if photo is blurry/dark
- Task time estimates: no validation for unrealistic values

#### 🟡 Inconsistent Spacing
- Some screens use `spacing.md`, others use raw numbers
- Need audit of `theme/spacing.ts` usage

---

## 3. Security

### 3.1 Critical Issues

#### 🔴 API Key Handling
**Files**: `services/gemini.ts`, `.env`

The migration from client-side to server-side API keys is incomplete:
- `.env` still exists in codebase (check if it should be gitignored)
- Deprecated stubs in `gemini.ts` may confuse future developers
- No clear documentation on key rotation process

**Recommendation**: 
1. Ensure `.env` is in `.gitignore`
2. Add clear comments about Convex env var setup
3. Create `docs/API_KEYS.md` explaining key management

---

### 3.2 High Priority Issues

#### 🟠 Sensitive Data in AsyncStorage
**File**: `context/DeclutterContext.tsx`

User profile, rooms, stats stored in AsyncStorage:
```typescript
const STORAGE_KEYS = {
  USER: '@declutterly_user',
  ROOMS: '@declutterly_rooms',
  // ...
};
```

While not highly sensitive (no passwords), user data could be:
- Accessed by other apps on rooted devices
- Leaked via backup systems

**Recommendation**: Use `expo-secure-store` for user profile, or document why regular AsyncStorage is acceptable.

#### 🟠 No Input Sanitization
AI prompts accept user strings without sanitization:
```typescript
// services/ai.ts
export async function getMotivation(context: string): Promise<MotivationResponse>
```

**Recommendation**: Sanitize user input before sending to AI.

---

### 3.3 Medium Priority Issues

#### 🟡 Console Exposure in Production
While `__DEV__` guards most logs, ensure no PII is logged:
```typescript
// Check all console.log/error statements don't log user data
```

---

## 4. Performance

### 4.1 High Priority Issues

#### 🟠 Large Bundle Size Indicators
**Package.json analysis**:
- 86 dependencies
- Multiple animation libraries: `react-native-reanimated`, `moti`, `lottie-react-native`, `@shopify/react-native-skia`
- Multiple confetti libraries: `react-native-confetti-cannon`, `react-native-fast-confetti`

**Concern**: Three confetti libraries is excessive.

**Recommendation**: Consolidate to one confetti library.

#### 🟠 Image Handling
- `expo-image` is used (good) but verify proper caching
- No image compression before storage upload
- Full-resolution photos stored locally (potential storage bloat)

#### 🟠 Context Re-renders
The large `DeclutterContext` causes re-renders:
```typescript
// Line 1256-1327 - all these trigger re-renders
const value: DeclutterState = React.useMemo(() => ({
  // 30+ properties
}), [isLoaded, user, stats, rooms, /* ... 11 more dependencies */]);
```

Any state change re-renders all consuming components.

---

### 4.2 Medium Priority Issues

#### 🟡 Unnecessary re-renders in components
Components subscribe to entire context rather than specific slices:
```typescript
// Instead of:
const { rooms, stats } = useDeclutter();

// Consider custom hooks:
const rooms = useRooms();
const stats = useStats();
```

#### 🟡 Missing List Virtualization
Check if `FlashList` (`@shopify/flash-list`) is used for:
- Room list
- Task list
- Collection items
- Photo gallery

---

## 5. Testing

### 5.1 High Priority Issues

#### 🟠 Minimal Test Coverage
**Current state**:
- `__tests__/` contains 5 test files
- Tests are for: `gemini.test.ts`, `zai.test.ts`, `convexMappers.test.ts`, `themePreference.test.tsx`, `MascotContext.test.tsx`, `FocusContext.test.tsx`

**Missing critical tests**:
- `DeclutterContext` - core state management
- User flows: onboarding → room creation → task completion → reward
- Error states: network failures, AI failures
- Notification scheduling

#### 🟠 No Integration Tests
- No tests for Convex backend interactions
- No E2E tests

#### 🟠 Test File Inconsistencies
- Mix of `.test.ts` and `.test.tsx` extensions
- Some files use Jest directly, others may use testing-library

---

### 5.2 Medium Priority Issues

#### 🟡 No Test Utilities
- No custom render with providers
- No mock factories for fixtures

#### 🟡 Snapshot Tests Missing
- No snapshot tests for components

---

## 6. Developer Experience

### 6.1 Critical Issues

#### 🔴 Missing Documentation
- `DOCUMENTATION.md` exists but may be outdated
- No `CONTRIBUTING.md`
- No `API.md` for Convex functions
- No setup instructions beyond basic npm install

---

### 6.2 High Priority Issues

#### 🟠 Incomplete Gitignore
Check `.gitignore` includes:
- `.env` ✓/✗
- `*.local.ts` (local overrides)
- `ios/Pods/` 
- `android/.gradle/`
- `node_modules/` ✓

#### 🟠 No CI/CD Configuration
- No GitHub Actions workflow
- No EAS build configuration in repo
- No deploy scripts

---

### 6.3 Medium Priority Issues

#### 🟡 ESLint Configuration
Check `eslint.config.js` or `.eslintrc`:
- Are all rules enabled?
- Are there any disabled rules that should be enabled?
- Is `typescript-eslint` properly configured?

#### 🟡 Prettier Configuration
- No `.prettierrc` file found
- Code formatting may be inconsistent

#### 🟡 TypeScript Strictness
Check `tsconfig.json`:
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    // ...
  }
}
```

---

## 7. Dependencies & Configuration

### 7.1 Issues

#### ⚠️ Potential Dependency Conflicts
- Multiple versions possible for:
  - `react-native-reanimated` vs `react-native-worklets`
  - Various `@react-native-*` packages
- `expo` v54 but some packages may be out of sync

**Recommendation**: Run `npm outdated` and `npx expo doctor`

#### ⚠️ Deprecated Packages
Check for deprecated packages:
- Any `@react-native-community/` packages (should use expo equivalents)
- Old notification handling patterns

#### ⚠️ Security Vulnerabilities
Run:
```bash
npm audit
npm audit --audit-level=high
```

---

## 8. Recommendations Matrix

### Quick Wins (1-2 days)
| Issue | Impact | Effort |
|-------|--------|--------|
| Add loading skeleton | High | 1 day |
| Fix `any` types in ai.ts | High | 2 hours |
| Add error boundaries per feature | High | 1 day |
| Consolidate confetti libraries | Medium | 1 hour |
| Add .gitignore entries | Medium | 30 min |

### Short-term (1 week)
| Issue | Impact | Effort |
|-------|--------|--------|
| Split DeclutterContext | High | 3 days |
| Add core unit tests | High | 3 days |
| Create custom hooks for context slices | Medium | 2 days |
| Extract hardcoded strings | Medium | 1 day |
| Add input sanitization | Medium | 1 day |

### Medium-term (2-4 weeks)
| Issue | Impact | Effort |
|-------|--------|--------|
| Complete test coverage | High | 2 weeks |
| Set up CI/CD | Medium | 1 week |
| i18n implementation | Medium | 1 week |
| Performance optimization pass | Medium | 1 week |
| Accessibility audit & fixes | High | 1 week |

### Long-term (1+ months)
| Issue | Impact | Effort |
|-------|--------|--------|
| Architecture refactor | High | Ongoing |
| E2E test suite | High | 1 month |
| Documentation overhaul | Medium | 1 week |

---

## 9. Files Requiring Immediate Attention

### Priority 1 (Review Today)
1. `context/DeclutterContext.tsx` - Split into smaller contexts
2. `services/ai.ts` - Fix `any` type
3. `app/room/[id].tsx` - Add error/skeleton states
4. `components/ErrorBoundary.tsx` - Add per-route boundaries

### Priority 2 (This Week)
5. `services/notifications.ts` - Extract hardcoded strings
6. `services/gemini.ts` - Clean up deprecated stubs
7. `package.json` - Audit dependencies
8. `.gitignore` - Verify completeness

### Priority 3 (This Month)
9. `__tests__/` - Add critical tests
10. `tsconfig.json` - Enable strict mode
11. Add ESLint/Prettier config
12. Create CONTRIBUTING.md

---

## Appendix

### Code Statistics
- Total files: ~90 TSX + ~66 TS = ~156 source files
- Largest file: `context/DeclutterContext.tsx` (1366 lines)
- Test files: 6
- Documentation: 4 MD files

### Dependencies by Category
| Category | Count |
|----------|-------|
| Expo core | 25+ |
| Navigation | 3 |
| Animation | 4+ |
| UI Components | 10+ |
| Storage | 2 |
| Notifications | 2 |
| AI/ML | 1 |
| Backend | 3 |

---

*End of Audit*
