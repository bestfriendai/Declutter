/**
 * Declutterly - App Color Scheme Hook
 * Returns the effective color scheme based on user preference
 */

import { useColorScheme as useRNColorScheme } from 'react-native';
import { useDeclutter } from '@/context/DeclutterContext';

/**
 * Returns the effective color scheme based on user's theme preference.
 * - 'auto': follows system theme
 * - 'light': always light
 * - 'dark': always dark
 */
export function useAppColorScheme(): 'light' | 'dark' {
  const systemScheme = useRNColorScheme();

  // Try to get settings, but handle the case where context isn't available
  let themePreference: 'auto' | 'light' | 'dark' = 'auto';

  try {
    const { settings } = useDeclutter();
    themePreference = settings.theme;
  } catch {
    // Context not available, use system default
  }

  if (themePreference === 'auto') {
    return systemScheme ?? 'dark';
  }

  return themePreference;
}

export default useAppColorScheme;
