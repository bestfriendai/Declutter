# API Keys

## Principle

Secrets stay server-side. The mobile client must not ship privileged API keys in `EXPO_PUBLIC_*` variables.

## Current Secrets

- `GEMINI_API_KEY`
  Purpose: AI room analysis and motivation flows via Convex actions.
  Storage: Convex environment variables.

## Set a Secret

```bash
npx convex env set GEMINI_API_KEY your_key_here
```

## Rotate a Secret

1. Generate the replacement key with your provider.
2. Update Convex:
   ```bash
   npx convex env set GEMINI_API_KEY your_new_key_here
   ```
3. Restart local dev servers that depend on Convex actions.
4. Verify:
   ```bash
   npm run typecheck
   npm test -- --runInBand
   ```

## Local Environment Files

- `.env` is gitignored and should only contain local, non-public development values.
- `.env.local` is also gitignored.
- `.env.example` documents the non-secret variables a contributor may need locally.

## Do Not

- Do not add `EXPO_PUBLIC_GEMINI_API_KEY`.
- Do not paste secrets into screenshots, tests, or committed fixtures.
- Do not keep legacy client-side API key code paths alive.
