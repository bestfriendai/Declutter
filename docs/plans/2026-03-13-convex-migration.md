# Declutter Full Convex Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the app use Convex end to end for auth, data, uploads, and AI flows, removing Firebase as the active runtime backend.

**Architecture:** Replace Firebase-backed auth and cloud data services with Convex-authenticated queries, mutations, and actions. Keep only ephemeral UI state on the client while moving canonical rooms, tasks, settings, stats, social data, and analysis flows to Convex. Migrate screen-level consumers incrementally so the app remains coherent during the transition.

**Tech Stack:** Expo Router, React Native, Convex, Convex Auth, TypeScript, AsyncStorage, Expo image/file APIs

---

### Task 1: Audit and lock the migration boundaries

**Files:**
- Review: `context/AuthContext.tsx`
- Review: `context/DeclutterContext.tsx`
- Review: `context/ConvexProvider.tsx`
- Review: `hooks/useConvex.ts`
- Review: `services/auth.ts`
- Review: `services/firestore.ts`
- Review: `services/storage.ts`
- Review: `services/social.ts`
- Review: `services/ai.ts`
- Review: `app/_layout.tsx`

**Step 1: Write the failing test**

Add a focused integration-oriented test file that encodes the target backend boundary. The first test should assert that Firebase runtime services are no longer imported by the root auth/data providers.

**Step 2: Run test to verify it fails**

Run: `npm test -- --runInBand __tests__/convex-migration-boundaries.test.ts`

Expected: FAIL because the current providers still depend on Firebase services.

**Step 3: Write minimal implementation**

Create the boundary test and any small helper needed to inspect provider imports.

**Step 4: Run test to verify it passes**

Run: `npm test -- --runInBand __tests__/convex-migration-boundaries.test.ts`

Expected: Still failing until implementation tasks remove Firebase provider dependencies.

**Step 5: Commit**

```bash
git add __tests__/convex-migration-boundaries.test.ts
git commit -m "test: add convex migration boundary checks"
```

### Task 2: Convert auth state to Convex Auth

**Files:**
- Modify: `context/AuthContext.tsx`
- Modify: `context/ConvexProvider.tsx`
- Modify: `app/auth/login.tsx`
- Modify: `app/auth/signup.tsx`
- Modify: `app/auth/forgot-password.tsx`
- Modify: `app/index.tsx`
- Test: `__tests__/auth-context.test.tsx`

**Step 1: Write the failing test**

Write tests that assert:

- `AuthContext` derives auth state from Convex auth instead of Firebase
- login and signup screens call Convex auth entry points
- unauthenticated app boot routes correctly

**Step 2: Run test to verify it fails**

Run: `npm test -- --runInBand __tests__/auth-context.test.tsx`

Expected: FAIL because auth state still reads from Firebase.

**Step 3: Write minimal implementation**

Refactor `AuthContext` to use Convex auth/session hooks and expose the same high-level contract needed by screens. Remove Firebase auth as the runtime authority.

**Step 4: Run test to verify it passes**

Run: `npm test -- --runInBand __tests__/auth-context.test.tsx`

Expected: PASS

**Step 5: Commit**

```bash
git add context/AuthContext.tsx context/ConvexProvider.tsx app/auth/login.tsx app/auth/signup.tsx app/auth/forgot-password.tsx app/index.tsx __tests__/auth-context.test.tsx
git commit -m "feat: migrate auth flow to convex auth"
```

### Task 3: Refactor Declutter state to consume Convex server data

**Files:**
- Modify: `context/DeclutterContext.tsx`
- Modify: `hooks/useConvex.ts`
- Test: `__tests__/declutter-context.test.tsx`

**Step 1: Write the failing test**

Write tests asserting that rooms, tasks, stats, and settings originate from Convex-backed hooks or adapters rather than AsyncStorage-owned canonical state.

**Step 2: Run test to verify it fails**

Run: `npm test -- --runInBand __tests__/declutter-context.test.tsx`

Expected: FAIL because the context currently owns canonical app data locally.

**Step 3: Write minimal implementation**

Refactor `DeclutterContext` into a thin orchestration layer. Preserve ephemeral UI state but move canonical reads and writes onto Convex query/mutation calls.

**Step 4: Run test to verify it passes**

Run: `npm test -- --runInBand __tests__/declutter-context.test.tsx`

Expected: PASS

**Step 5: Commit**

```bash
git add context/DeclutterContext.tsx hooks/useConvex.ts __tests__/declutter-context.test.tsx
git commit -m "feat: source declutter state from convex"
```

### Task 4: Migrate room, task, and stats mutations

**Files:**
- Modify: `context/DeclutterContext.tsx`
- Modify: `app/room/[id].tsx`
- Modify: `app/(tabs)/index.tsx`
- Modify: `app/(tabs)/progress.tsx`
- Modify: `app/achievements.tsx`
- Modify: `app/insights.tsx`
- Test: `__tests__/room-task-stats-flow.test.tsx`

**Step 1: Write the failing test**

Add a test for create room, add task, toggle task, and stats updates using mocked Convex hooks/actions.

**Step 2: Run test to verify it fails**

Run: `npm test -- --runInBand __tests__/room-task-stats-flow.test.tsx`

Expected: FAIL because state updates are still local-first and not wired to Convex.

**Step 3: Write minimal implementation**

Update room/task/stat flows to call Convex mutations and consume returned state. Remove local-only logic that diverges from backend behavior.

**Step 4: Run test to verify it passes**

Run: `npm test -- --runInBand __tests__/room-task-stats-flow.test.tsx`

Expected: PASS

**Step 5: Commit**

```bash
git add context/DeclutterContext.tsx app/room/[id].tsx app/(tabs)/index.tsx app/(tabs)/progress.tsx app/achievements.tsx app/insights.tsx __tests__/room-task-stats-flow.test.tsx
git commit -m "feat: migrate room and task flows to convex"
```

### Task 5: Migrate photo upload and photo records

**Files:**
- Modify: `services/storage.ts`
- Modify: `context/DeclutterContext.tsx`
- Modify: `app/camera.tsx`
- Modify: `convex/photos.ts`
- Test: `__tests__/photo-upload-flow.test.tsx`

**Step 1: Write the failing test**

Write a test covering upload URL generation, upload completion, and photo record creation through Convex-backed logic.

**Step 2: Run test to verify it fails**

Run: `npm test -- --runInBand __tests__/photo-upload-flow.test.tsx`

Expected: FAIL because storage still points to Firebase Storage.

**Step 3: Write minimal implementation**

Replace Firebase Storage upload flow with Convex upload URLs and Convex photo mutations. Keep local persistence only if needed for cached display.

**Step 4: Run test to verify it passes**

Run: `npm test -- --runInBand __tests__/photo-upload-flow.test.tsx`

Expected: PASS

**Step 5: Commit**

```bash
git add services/storage.ts context/DeclutterContext.tsx app/camera.tsx convex/photos.ts __tests__/photo-upload-flow.test.tsx
git commit -m "feat: migrate photo uploads to convex storage"
```

### Task 6: Migrate AI analysis and motivation to Convex actions

**Files:**
- Modify: `services/ai.ts`
- Modify: `app/analysis.tsx`
- Modify: `hooks/useConvex.ts`
- Test: `__tests__/analysis-flow.test.tsx`

**Step 1: Write the failing test**

Write tests asserting that analysis and motivation flows call Convex actions instead of direct client-side provider services.

**Step 2: Run test to verify it fails**

Run: `npm test -- --runInBand __tests__/analysis-flow.test.tsx`

Expected: FAIL because the screen still depends on `services/ai`.

**Step 3: Write minimal implementation**

Refactor analysis helpers and the analysis screen to run through Convex actions and adapt responses to the existing UI shape.

**Step 4: Run test to verify it passes**

Run: `npm test -- --runInBand __tests__/analysis-flow.test.tsx`

Expected: PASS

**Step 5: Commit**

```bash
git add services/ai.ts app/analysis.tsx hooks/useConvex.ts __tests__/analysis-flow.test.tsx
git commit -m "feat: route ai analysis through convex actions"
```

### Task 7: Migrate social and connection flows

**Files:**
- Modify: `services/social.ts`
- Modify: `app/social.tsx`
- Modify: `app/join.tsx`
- Modify: `app/challenge/[id].tsx`
- Modify: `hooks/useConvex.ts`
- Modify: `convex/social.ts`
- Modify: `convex/users.ts`
- Test: `__tests__/social-flow.test.tsx`

**Step 1: Write the failing test**

Write a social flow test covering challenge listing, joining, and connection management against Convex hooks.

**Step 2: Run test to verify it fails**

Run: `npm test -- --runInBand __tests__/social-flow.test.tsx`

Expected: FAIL because the social layer still uses Firestore.

**Step 3: Write minimal implementation**

Replace Firestore social service logic with Convex query/mutation adapters and update the affected screens.

**Step 4: Run test to verify it passes**

Run: `npm test -- --runInBand __tests__/social-flow.test.tsx`

Expected: PASS

**Step 5: Commit**

```bash
git add services/social.ts app/social.tsx app/join.tsx app/challenge/[id].tsx hooks/useConvex.ts convex/social.ts convex/users.ts __tests__/social-flow.test.tsx
git commit -m "feat: migrate social flows to convex"
```

### Task 8: Remove Firebase runtime dependencies and stale config

**Files:**
- Modify: `config/firebase.ts`
- Modify: `services/auth.ts`
- Modify: `services/firestore.ts`
- Modify: `services/storage.ts`
- Modify: `services/social.ts`
- Modify: `.env.example`
- Modify: `package.json`
- Test: `__tests__/convex-migration-boundaries.test.ts`

**Step 1: Write the failing test**

Extend the boundary test to assert that root runtime paths no longer import Firebase-backed cloud services.

**Step 2: Run test to verify it fails**

Run: `npm test -- --runInBand __tests__/convex-migration-boundaries.test.ts`

Expected: FAIL until Firebase runtime dependencies are removed or isolated.

**Step 3: Write minimal implementation**

Delete or quarantine Firebase runtime code, remove stale env references, and keep only code still needed for legacy fallback if absolutely necessary.

**Step 4: Run test to verify it passes**

Run: `npm test -- --runInBand __tests__/convex-migration-boundaries.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add config/firebase.ts services/auth.ts services/firestore.ts services/storage.ts services/social.ts .env.example package.json __tests__/convex-migration-boundaries.test.ts
git commit -m "refactor: remove firebase runtime backend"
```

### Task 9: Regenerate Convex types and verify the app

**Files:**
- Modify: `convex/_generated/*`
- Review: `convex/*.ts`
- Review: project-wide TypeScript errors

**Step 1: Write the failing test**

Use type and integration verification as the failing gate for the completed migration.

**Step 2: Run test to verify it fails**

Run:

```bash
npx convex codegen
npm run typecheck
npm test -- --runInBand
```

Expected: At least one command fails before all migration tasks are complete.

**Step 3: Write minimal implementation**

Resolve remaining schema/client typing mismatches and finish any small wiring gaps exposed by verification.

**Step 4: Run test to verify it passes**

Run:

```bash
npx convex codegen
npm run typecheck
npm test -- --runInBand
```

Expected: PASS

**Step 5: Commit**

```bash
git add convex/_generated package.json package-lock.json
git commit -m "chore: finalize convex migration verification"
```
