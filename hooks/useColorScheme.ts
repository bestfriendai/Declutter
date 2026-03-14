/**
 * Declutterly - Color Scheme Hook
 * Returns the effective color scheme based on user's theme preference
 */

import { useSyncExternalStore } from 'react';
import { useColorScheme as useRNColorScheme, ColorSchemeName } from 'react-native';

// Module-level variable to store the forced color scheme from ThemeProvider
let _forcedColorScheme: ColorSchemeName = null;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return _forcedColorScheme;
}

export function setForcedColorScheme(scheme: ColorSchemeName) {
  if (_forcedColorScheme === scheme) {
    return;
  }
  _forcedColorScheme = scheme;
  listeners.forEach((listener) => listener());
}

export function getForcedColorScheme(): ColorSchemeName {
  return _forcedColorScheme;
}

export function useColorScheme(): 'light' | 'dark' {
  const systemScheme = useRNColorScheme();
  const forcedScheme = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  // If a forced scheme is set by ThemeProvider, use it
  if (forcedScheme) {
    return forcedScheme === 'dark' ? 'dark' : 'light';
  }

  // Otherwise fall back to system scheme
  return systemScheme === 'light' ? 'light' : 'dark';
}
