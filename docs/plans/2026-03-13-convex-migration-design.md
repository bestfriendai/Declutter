# Declutter Full Convex Migration Design

**Date:** 2026-03-13

## Goal

Make Convex the single backend for the Declutter app so auth, server data, uploads, and AI actions all flow through Convex consistently.

## Current State

The repository has a healthy Convex backend deployment and generated client bindings, but the app runtime is still primarily Firebase-driven:

- `context/ConvexProvider.tsx` wraps the app in `ConvexAuthProvider`.
- `hooks/useConvex.ts` exposes Convex queries, mutations, and actions.
- `context/AuthContext.tsx` still uses Firebase auth and Firebase-backed cloud sync.
- `context/DeclutterContext.tsx` keeps app state in local AsyncStorage and syncs through Firebase-oriented helpers.
- `services/auth.ts`, `services/firestore.ts`, `services/storage.ts`, and `services/social.ts` remain Firebase-based.
- `app/analysis.tsx` calls `services/ai` instead of using Convex actions directly.

This leaves the codebase in a half-migrated state where Convex exists, but it is not the authoritative runtime.

## Target Architecture

### 1. Backend authority

Convex becomes the source of truth for:

- user identity and profile
- rooms
- photos and upload URLs
- tasks and subtasks
- user stats
- settings
- social connections and challenges
- AI analysis and motivation actions

### 2. Client authority

The app client will:

- authenticate through Convex Auth
- read server state through Convex `useQuery`
- mutate server state through Convex `useMutation`
- run AI flows through Convex `useAction`
- keep only explicit UI state and local cache client-side

### 3. Local state boundary

`DeclutterContext` will no longer own the canonical data model for rooms, tasks, stats, settings, or social state. It will either:

- become a thin UI coordination context layered on top of Convex data, or
- be split so only ephemeral UI state remains there.

AsyncStorage remains only for explicitly local concerns such as temporary UI preferences or migration fallback, not as the primary app database.

## Migration Strategy

### Phase 1: Core data flows

Move these app surfaces to Convex first:

- auth entry and session state
- current user profile
- rooms
- tasks and subtasks
- stats
- settings
- AI analysis actions

This establishes one coherent data path for the most-used flows.

### Phase 2: Asset and photo flows

Replace Firebase Storage upload logic with Convex upload URLs and Convex-backed photo records.

### Phase 3: Social flows

Replace Firestore challenge and connection services with Convex queries and mutations.

### Phase 4: Cleanup

Remove dead Firebase runtime paths, stale env references, and misleading provider/service code.

## Key Design Decisions

### Auth

Use Convex Auth as the session system because the app is already wrapped by `ConvexAuthProvider` and backend functions already call `getAuthUserId`.

### AI

Use Convex actions for Gemini. This keeps server secrets server-side and avoids leaking backend credentials into the Expo client.

### Photos

Use Convex file upload URLs for backend-owned upload flow. Any local persistence should be temporary client convenience, not the system of record.

### Migration posture

Prefer direct replacement over long-lived dual write logic. A prolonged hybrid Firebase + Convex runtime would keep the architecture ambiguous and increase regression risk.

## Risks

- Existing screens depend heavily on `DeclutterContext` shape and synchronous local updates.
- Some Convex backend functions may not yet match the exact frontend data contracts used by current UI code.
- Convex Auth UI integration may require additional client-side adapters for the current login/signup screens.
- Firebase-only features may expose hidden assumptions in social or storage flows.

## Success Criteria

The migration is complete when:

- the app no longer depends on Firebase auth/storage/firestore for normal runtime
- the main app flows read and write through Convex hooks/actions
- local env and example env files describe Convex as the backend
- Convex type generation and TypeScript checks pass
- core user journeys work against Convex without Firebase fallbacks
