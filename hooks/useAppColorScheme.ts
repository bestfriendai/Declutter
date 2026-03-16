/**
 * Declutterly - App Color Scheme Hook
 * Returns the effective color scheme based on user preference.
 *
 * Priority:
 * 1. User's explicit theme choice in settings ('light' | 'dark')
 * 2. System color scheme
 * 3. Falls back to 'dark' if nothing is available
 */

import { useColorScheme as useRNColorScheme } from 'react-native';
import { useDeclutter } from '@/context/DeclutterContext';

/**
 * Returns the effective color scheme based on user's theme preference.
 * - 'auto': follows system theme
 * - 'light': always light
 * - 'dark': always dark
 *
 * Safe to call even if DeclutterContext hasn't loaded settings yet.
 */
export function useAppColorScheme(): 'light' | 'dark' {
  const systemScheme = useRNColorScheme();

  let themePreference: 'auto' | 'light' | 'dark' = 'auto';
  try {
    const { settings } = useDeclutter();
    themePreference = settings?.theme ?? 'auto';
  } catch {
    // Context not available yet (e.g., before provider mounts) — use system
  }

  if (themePreference === 'auto') {
    return systemScheme ?? 'dark';
  }

  return themePreference;
}

export default useAppColorScheme;
