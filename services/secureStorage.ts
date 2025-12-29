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
      await SecureStore.setItemAsync(SECURE_KEYS.API_KEY, trimmedKey, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
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
      return await SecureStore.getItemAsync(SECURE_KEYS.API_KEY);
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
      await SecureStore.deleteItemAsync(SECURE_KEYS.API_KEY);
    } else {
      await AsyncStorage.removeItem(SECURE_KEYS.API_KEY);
    }
  } catch (error) {
    console.error('Failed to delete API key');
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

  canMakeRequest(): boolean {
    const now = Date.now();
    // Remove expired requests
    this.requests = this.requests.filter(time => now - time < this.windowMs);

    if (this.requests.length >= this.maxRequests) {
      return false;
    }

    this.requests.push(now);
    return true;
  }

  getTimeUntilReset(): number {
    if (this.requests.length === 0) return 0;
    const oldestRequest = Math.min(...this.requests);
    return Math.max(0, this.windowMs - (Date.now() - oldestRequest));
  }

  getRemainingRequests(): number {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    return Math.max(0, this.maxRequests - this.requests.length);
  }
}

// Export singleton rate limiter (10 requests per minute)
export const apiRateLimiter = new RateLimiter(10, 60000);
