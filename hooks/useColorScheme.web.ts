import { useEffect, useState, useSyncExternalStore } from 'react';
import { ColorSchemeName, useColorScheme as useRNColorScheme } from 'react-native';

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

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web
 */
export function useColorScheme() {
  const [hasHydrated, setHasHydrated] = useState(false);
  const forcedScheme = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const colorScheme = useRNColorScheme();

  if (hasHydrated) {
    if (forcedScheme) {
      return forcedScheme === 'dark' ? 'dark' : 'light';
    }

    return colorScheme === 'light' ? 'light' : 'dark';
  }

  return 'light';
}
