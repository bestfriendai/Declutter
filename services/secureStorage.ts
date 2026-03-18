/**
 * Declutterly - Secure Storage Service
 * Handles secure storage of sensitive data using expo-secure-store
 * Falls back to AsyncStorage for non-sensitive data
 */

import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Keys for secure storage
export const SECURE_KEYS = {
  API_KEY: 'declutterly_api_key',
  AUTH_TOKEN: 'declutterly_auth_token',
  REFRESH_TOKEN: 'declutterly_refresh_token',
  USER_PROFILE: 'declutterly_user_profile',
  AUTH_STATE: 'declutterly_auth_state',
} as const;

// Check if SecureStore is available
const isSecureStoreAvailable = async (): Promise<boolean> => {
  try {
    // SecureStore is only available on iOS and Android
    if (Platform.OS === 'web') {
      return false;
    }
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
};

export async function saveSecureValue(key: string, value: string): Promise<void> {
  const secureAvailable = await isSecureStoreAvailable();

  if (secureAvailable) {
    await SecureStore.setItemAsync(key, value, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
    return;
  }

  await AsyncStorage.setItem(key, value);
}

export async function loadSecureValue(key: string): Promise<string | null> {
  const secureAvailable = await isSecureStoreAvailable();

  if (secureAvailable) {
    return SecureStore.getItemAsync(key);
  }

  return AsyncStorage.getItem(key);
}

export async function deleteSecureValue(key: string): Promise<void> {
  const secureAvailable = await isSecureStoreAvailable();

  if (secureAvailable) {
    await SecureStore.deleteItemAsync(key);
    return;
  }

  await AsyncStorage.removeItem(key);
}

export async function saveSecureJson<T>(key: string, value: T): Promise<void> {
  await saveSecureValue(key, JSON.stringify(value));
}

export async function loadSecureJson<T>(key: string): Promise<T | null> {
  const storedValue = await loadSecureValue(key);
  if (!storedValue) {
    return null;
  }

  try {
    return JSON.parse(storedValue) as T;
  } catch {
    return null;
  }
}

/**
 * Validates API key format (Gemini API keys are typically 39 characters)
 */
export function isValidApiKeyFormat(key: string): boolean {
  if (!key || typeof key !== 'string') return false;
  // Gemini API keys are alphanumeric with possible dashes/underscores
  return /^[A-Za-z0-9_-]{30,50}$/.test(key.trim());
}

/**
 * Securely save the API key
 * Uses SecureStore on iOS/Android, falls back to AsyncStorage on web
 */
export async function saveApiKeySecure(apiKey: string): Promise<void> {
  const trimmedKey = apiKey.trim();
  
  if (!isValidApiKeyFormat(trimmedKey)) {
    throw new Error('Invalid API key format');
  }

  try {
    const secureAvailable = await isSecureStoreAvailable();
    
    if (secureAvailable) {
      await saveSecureValue(SECURE_KEYS.API_KEY, trimmedKey);
    } else {
      // Fallback for web - warn in dev
      if (__DEV__) {
        console.warn('SecureStore not available, falling back to AsyncStorage');
      }
      await AsyncStorage.setItem(SECURE_KEYS.API_KEY, trimmedKey);
    }
  } catch (error) {
    // Don't log the key itself
    console.error('Failed to save API key securely');
    throw new Error('Failed to save API key');
  }
}

/**
 * Load the API key from secure storage
 */
export async function loadApiKeySecure(): Promise<string | null> {
  try {
    const secureAvailable = await isSecureStoreAvailable();
    
    if (secureAvailable) {
      return await loadSecureValue(SECURE_KEYS.API_KEY);
    } else {
      return await AsyncStorage.getItem(SECURE_KEYS.API_KEY);
    }
  } catch (error) {
    console.error('Failed to load API key');
    return null;
  }
}

/**
 * Delete the API key from secure storage
 */
export async function deleteApiKeySecure(): Promise<void> {
  try {
    const secureAvailable = await isSecureStoreAvailable();
    
    if (secureAvailable) {
      await deleteSecureValue(SECURE_KEYS.API_KEY);
    } else {
      await AsyncStorage.removeItem(SECURE_KEYS.API_KEY);
    }
  } catch (error) {
    console.error('Failed to delete API key');
  }
}

/**
 * Save auth token securely
 */
export async function saveAuthToken(token: string): Promise<void> {
  try {
    const secureAvailable = await isSecureStoreAvailable();
    if (secureAvailable) {
      await saveSecureValue(SECURE_KEYS.AUTH_TOKEN, token);
    } else {
      await AsyncStorage.setItem(SECURE_KEYS.AUTH_TOKEN, token);
    }
  } catch (error) {
    console.error('Failed to save auth token');
    throw new Error('Failed to save auth token');
  }
}

/**
 * Load auth token from secure storage
 */
export async function loadAuthToken(): Promise<string | null> {
  try {
    const secureAvailable = await isSecureStoreAvailable();
    if (secureAvailable) {
      return await loadSecureValue(SECURE_KEYS.AUTH_TOKEN);
    }
    return await AsyncStorage.getItem(SECURE_KEYS.AUTH_TOKEN);
  } catch {
    return null;
  }
}

/**
 * Delete auth token from secure storage
 */
export async function deleteAuthToken(): Promise<void> {
  try {
    const secureAvailable = await isSecureStoreAvailable();
    if (secureAvailable) {
      await deleteSecureValue(SECURE_KEYS.AUTH_TOKEN);
    } else {
      await AsyncStorage.removeItem(SECURE_KEYS.AUTH_TOKEN);
    }
  } catch {
    console.error('Failed to delete auth token');
  }
}

/**
 * Clear all secure storage (for sign-out / account deletion)
 */
export async function clearAllSecureStorage(): Promise<void> {
  const keys = Object.values(SECURE_KEYS);
  for (const key of keys) {
    try {
      const secureAvailable = await isSecureStoreAvailable();
      if (secureAvailable) {
        await deleteSecureValue(key);
      } else {
        await AsyncStorage.removeItem(key);
      }
    } catch {
      // Best-effort cleanup
    }
  }
}

/**
 * Rate limiter for API calls
 * Prevents abuse and helps stay within API quotas
 */
class RateLimiter {
  private requests: number[] = [];
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests = 10, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  /** Prune expired timestamps before any check */
  private prune(): void {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);
  }

  canMakeRequest(): boolean {
    const now = Date.now();
    // Atomic: prune, check, and push in one operation to prevent race conditions
    this.requests = this.requests.filter(time => now - time < this.windowMs);

    if (this.requests.length >= this.maxRequests) {
      return false;
    }

    this.requests.push(now);
    return true;
  }

  getTimeUntilReset(): number {
    this.prune();
    if (this.requests.length === 0) return 0;
    const oldestRequest = Math.min(...this.requests);
    return Math.max(0, this.windowMs - (Date.now() - oldestRequest));
  }

  getRemainingRequests(): number {
    this.prune();
    return Math.max(0, this.maxRequests - this.requests.length);
  }

  /**
   * Wait until a request slot is available (useful for queuing)
   * Returns immediately if a slot is open.
   */
  async waitForSlot(): Promise<void> {
    if (this.canMakeRequest()) return;
    const waitMs = this.getTimeUntilReset();
    if (waitMs > 0) {
      await new Promise(resolve => setTimeout(resolve, waitMs + 50));
    }
    // Re-record the request
    if (!this.canMakeRequest()) {
      throw new Error('Rate limit exceeded. Please wait a moment and try again.');
    }
  }
}

// Export singleton rate limiter (10 requests per minute)
export const apiRateLimiter = new RateLimiter(10, 60000);
