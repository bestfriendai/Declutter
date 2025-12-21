/**
 * Declutterly - Color Scheme Hook
 * Returns the effective color scheme based on user's theme preference
 */

import { useColorScheme as useRNColorScheme, ColorSchemeName } from 'react-native';

// Module-level variable to store the forced color scheme from ThemeProvider
let _forcedColorScheme: ColorSchemeName = null;

export function setForcedColorScheme(scheme: ColorSchemeName) {
  _forcedColorScheme = scheme;
}

export function useColorScheme(): 'light' | 'dark' {
  const systemScheme = useRNColorScheme();

  // If a forced scheme is set by ThemeProvider, use it
  if (_forcedColorScheme) {
    return _forcedColorScheme;
  }

  // Otherwise fall back to system scheme
  return systemScheme ?? 'dark';
}
