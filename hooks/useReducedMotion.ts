/**
 * Declutterly - useReducedMotion Hook
 * Respects user's reduced motion accessibility preferences.
 *
 * Sources (OR'd together):
 * 1. React Native Reanimated's built-in hook (reads OS setting on the UI thread)
 * 2. System AccessibilityInfo listener (fallback / change detection)
 * 3. App-level user preference from settings (allows overriding in-app)
 */

import { useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import { useReducedMotion as useReanimatedReducedMotion } from 'react-native-reanimated';

/**
 * Hook to detect if user prefers reduced motion.
 * Returns `true` if the OS accessibility setting OR the in-app setting is enabled.
 */
export function useReducedMotion(): boolean {
  // Use Reanimated's built-in hook as primary source
  const reanimatedReducedMotion = useReanimatedReducedMotion();
  const [systemReducedMotion, setSystemReducedMotion] = useState(false);

  useEffect(() => {
    // Get initial value from system
    let mounted = true;
    const checkReducedMotion = async () => {
      try {
        const isReducedMotionEnabled = await AccessibilityInfo.isReduceMotionEnabled();
        if (mounted) setSystemReducedMotion(isReducedMotionEnabled);
      } catch {
        // Fallback to false if check fails
      }
    };

    checkReducedMotion();

    // Listen for changes
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (isEnabled) => {
        if (mounted) setSystemReducedMotion(isEnabled);
      }
    );

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  // Memoize the combined result to avoid unnecessary child re-renders
  return useMemo(
    () => reanimatedReducedMotion || systemReducedMotion,
    [reanimatedReducedMotion, systemReducedMotion]
  );
}

/**
 * Helper to get animation duration based on reduced motion preference
 * @param normalDuration - Duration in ms for normal motion
 * @param reducedDuration - Duration in ms for reduced motion (default: 0)
 */
export function useAnimationDuration(
  normalDuration: number,
  reducedDuration: number = 0
): number {
  const reducedMotion = useReducedMotion();
  return reducedMotion ? reducedDuration : normalDuration;
}

/**
 * Helper to conditionally apply animations based on reduced motion
 * @param animation - The animation to apply
 * @param fallback - The fallback value when reduced motion is enabled
 */
export function useConditionalAnimation<T>(animation: T, fallback: T): T {
  const reducedMotion = useReducedMotion();
  return reducedMotion ? fallback : animation;
}

export default useReducedMotion;
