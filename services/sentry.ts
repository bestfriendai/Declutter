/**
 * Sentry Error Tracking — Initialization & Helpers
 *
 * SETUP REQUIRED:
 * 1. Run `npx @sentry/wizard@latest -i reactNative` to configure metro + plugins
 * 2. Set SENTRY_DSN in your environment (Expo env var or hardcoded below for now)
 * 3. Set SENTRY_AUTH_TOKEN in EAS build secrets for source map uploads
 *
 * This file provides a thin wrapper so the rest of the app can import
 * from `@/services/sentry` without coupling directly to the Sentry SDK.
 */

import * as Sentry from '@sentry/react-native';

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN ?? '';

let initialized = false;

/**
 * Initialize Sentry. Call once at app startup (e.g., in _layout.tsx).
 * Safe to call multiple times — subsequent calls are no-ops.
 */
export function initSentry(): void {
  if (initialized || !SENTRY_DSN) {
    if (__DEV__ && !SENTRY_DSN) {
      console.warn('[Sentry] No DSN configured — error tracking disabled.');
    }
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    // Capture 100% of errors, sample 20% of performance transactions
    tracesSampleRate: __DEV__ ? 1.0 : 0.2,
    // Disable in dev to avoid noise
    enabled: !__DEV__,
    // Attach session replay for crash context (Sentry mobile replays)
    _experiments: {
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
    },
    debug: __DEV__,
  });

  initialized = true;
}

/**
 * Capture an exception with optional extra context.
 */
export function captureException(
  error: unknown,
  context?: Record<string, unknown>,
): void {
  if (!initialized) return;

  Sentry.captureException(error, {
    extra: context,
  });
}

/**
 * Capture a breadcrumb message (non-fatal).
 */
export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = 'info',
): void {
  if (!initialized) return;
  Sentry.captureMessage(message, level);
}

/**
 * Set the authenticated user for Sentry context.
 * Call after login, clear on logout with `clearUser()`.
 */
export function setUser(user: { id: string; email?: string; username?: string }): void {
  if (!initialized) return;
  Sentry.setUser(user);
}

/**
 * Clear user context (e.g., on logout).
 */
export function clearUser(): void {
  if (!initialized) return;
  Sentry.setUser(null);
}

/**
 * Wrap the root component with Sentry's error boundary for automatic crash reporting.
 */
export const SentryWrap = Sentry.wrap;

export { Sentry };
