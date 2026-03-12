/**
 * Retry Utility
 * Provides retry logic with exponential backoff for failed operations
 */

export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxAttempts?: number;
  /** Initial delay in milliseconds (default: 1000) */
  initialDelayMs?: number;
  /** Maximum delay in milliseconds (default: 30000) */
  maxDelayMs?: number;
  /** Backoff multiplier (default: 2) */
  backoffMultiplier?: number;
  /** Optional callback for each retry attempt */
  onRetry?: (attempt: number, error: Error, nextDelayMs: number) => void;
  /** Optional predicate to determine if error is retryable (default: all errors) */
  isRetryable?: (error: Error) => boolean;
  /** Add jitter to delay to prevent thundering herd (default: true) */
  useJitter?: boolean;
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'onRetry' | 'isRetryable'>> = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  useJitter: true,
};

/**
 * Calculate delay with exponential backoff and optional jitter
 */
function calculateDelay(
  attempt: number,
  initialDelayMs: number,
  maxDelayMs: number,
  backoffMultiplier: number,
  useJitter: boolean
): number {
  // Exponential backoff: initialDelay * (multiplier ^ attempt)
  const exponentialDelay = initialDelayMs * Math.pow(backoffMultiplier, attempt);

  // Cap at maximum delay
  const cappedDelay = Math.min(exponentialDelay, maxDelayMs);

  // Add jitter (random value between 0 and delay) to prevent thundering herd
  if (useJitter) {
    const jitter = Math.random() * cappedDelay * 0.5;
    return Math.floor(cappedDelay + jitter);
  }

  return Math.floor(cappedDelay);
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if an error is a network-related error that should be retried
 */
export function isNetworkError(error: Error): boolean {
  const networkErrorMessages = [
    'network request failed',
    'network error',
    'fetch failed',
    'connection refused',
    'connection reset',
    'timeout',
    'etimedout',
    'econnreset',
    'econnrefused',
    'socket hang up',
    'unable to resolve host',
    'no internet',
    'offline',
  ];

  const message = error.message.toLowerCase();
  return networkErrorMessages.some(msg => message.includes(msg));
}

/**
 * Check if an error is a temporary server error (5xx status codes)
 */
export function isServerError(error: Error & { status?: number; statusCode?: number }): boolean {
  const status = error.status || error.statusCode;
  if (typeof status === 'number') {
    return status >= 500 && status < 600;
  }

  const message = error.message.toLowerCase();
  return message.includes('internal server error') ||
         message.includes('service unavailable') ||
         message.includes('gateway timeout') ||
         message.includes('bad gateway');
}

/**
 * Default retryable error checker (network errors and server errors)
 */
export function isDefaultRetryableError(error: Error): boolean {
  return isNetworkError(error) || isServerError(error as Error & { status?: number });
}

/**
 * Retry a function with exponential backoff
 *
 * @param fn The async function to retry
 * @param options Retry configuration options
 * @returns Promise that resolves with the function result or rejects after all retries fail
 *
 * @example
 * ```typescript
 * // Basic usage
 * const result = await retry(() => fetchData());
 *
 * // With custom options
 * const result = await retry(
 *   () => api.call(),
 *   {
 *     maxAttempts: 5,
 *     initialDelayMs: 500,
 *     onRetry: (attempt, error) => console.log(`Retry ${attempt}: ${error.message}`)
 *   }
 * );
 * ```
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = DEFAULT_OPTIONS.maxAttempts,
    initialDelayMs = DEFAULT_OPTIONS.initialDelayMs,
    maxDelayMs = DEFAULT_OPTIONS.maxDelayMs,
    backoffMultiplier = DEFAULT_OPTIONS.backoffMultiplier,
    useJitter = DEFAULT_OPTIONS.useJitter,
    onRetry,
    isRetryable = isDefaultRetryableError,
  } = options;

  let lastError: Error;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if this is the last attempt
      if (attempt === maxAttempts - 1) {
        throw lastError;
      }

      // Check if the error is retryable
      if (!isRetryable(lastError)) {
        throw lastError;
      }

      // Calculate delay for next attempt
      const delayMs = calculateDelay(
        attempt,
        initialDelayMs,
        maxDelayMs,
        backoffMultiplier,
        useJitter
      );

      // Call onRetry callback if provided
      if (onRetry) {
        onRetry(attempt + 1, lastError, delayMs);
      }

      // Wait before retrying
      await sleep(delayMs);
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError!;
}

/**
 * Create a retryable version of an async function
 *
 * @param fn The async function to wrap
 * @param options Default retry options for the wrapped function
 * @returns A new function that automatically retries on failure
 *
 * @example
 * ```typescript
 * const fetchWithRetry = withRetry(fetchData, { maxAttempts: 3 });
 * const result = await fetchWithRetry();
 * ```
 */
export function withRetry<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  options: RetryOptions = {}
): (...args: TArgs) => Promise<TResult> {
  return (...args: TArgs) => retry(() => fn(...args), options);
}

/**
 * Retry with a timeout - fails if operation doesn't complete within timeout
 *
 * @param fn The async function to retry
 * @param timeoutMs Maximum time for all retries combined
 * @param options Retry configuration options
 * @returns Promise that resolves with the function result or rejects on timeout/failure
 */
export async function retryWithTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  options: RetryOptions = {}
): Promise<T> {
  const startTime = Date.now();

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Operation timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  const retryPromise = retry(fn, {
    ...options,
    // Adjust max delay based on remaining time
    onRetry: (attempt, error, nextDelayMs) => {
      const elapsed = Date.now() - startTime;
      const remaining = timeoutMs - elapsed;

      if (remaining <= 0) {
        throw new Error(`Operation timed out after ${timeoutMs}ms`);
      }

      options.onRetry?.(attempt, error, Math.min(nextDelayMs, remaining));
    },
  });

  return Promise.race([retryPromise, timeoutPromise]);
}
