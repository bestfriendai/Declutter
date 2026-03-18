# Contributing

## Prerequisites

- Node.js 20+
- npm 10+
- Expo CLI tooling via `npx expo`
- A Convex deployment configured for this workspace

## Local Setup

1. Install dependencies:
   ```bash
   npm ci
   ```
2. Copy the example env file if you need local web or Firebase configuration:
   ```bash
   cp .env.example .env.local
   ```
3. Configure server-side secrets in Convex:
   ```bash
   npx convex env set GEMINI_API_KEY your_key_here
   ```
4. Start the app:
   ```bash
   npm run start
   ```

## Verification

Run the full local check before opening a PR:

```bash
npm run typecheck
npm run lint
npm test -- --runInBand
```

## Implementation Notes

- Keep API keys server-side. Do not add `EXPO_PUBLIC_GEMINI_API_KEY`.
- Prefer `expo-secure-store` for auth state and user profile cache.
- Keep user-facing copy non-judgmental and ADHD-friendly.
- Use `apply_patch`-style minimal edits for targeted changes.

## Pull Requests

- Keep changes scoped and testable.
- Add or update tests for behavior changes.
- Document any new environment variables in [docs/API_KEYS.md](/Users/iamabillionaire/Downloads/Declutter/docs/API_KEYS.md).
