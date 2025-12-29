/**
 * Declutterly - useReducedMotion Hook
 * Respects user's reduced motion accessibility preferences
 */

import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import { useReducedMotion as useReanimatedReducedMotion } from 'react-native-reanimated';

/**
 * Hook to detect if user prefers reduced motion
 * Uses React Native Reanimated's implementation with fallback
 */
export function useReducedMotion(): boolean {
  // Use Reanimated's built-in hook as primary source
  const reanimatedReducedMotion = useReanimatedReducedMotion();
  const [systemReducedMotion, setSystemReducedMotion] = useState(false);

  useEffect(() => {
    // Get initial value from system
    const checkReducedMotion = async () => {
      try {
        const isReducedMotionEnabled = await AccessibilityInfo.isReduceMotionEnabled();
        setSystemReducedMotion(isReducedMotionEnabled);
      } catch {
        // Fallback to false if check fails
        setSystemReducedMotion(false);
      }
    };

    checkReducedMotion();

    // Listen for changes
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (isEnabled) => {
        setSystemReducedMotion(isEnabled);
      }
    );

    return () => {
      subscription.remove();
    };
  }, []);

  // Return true if either source indicates reduced motion
  return reanimatedReducedMotion || systemReducedMotion;
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
