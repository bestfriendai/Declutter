/**
 * Declutterly - Animated Press Hook
 * Reusable press animation with spring physics
 */

import { useCallback } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  WithSpringConfig,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

interface AnimatedPressConfig {
  scalePressed?: number;
  springConfig?: WithSpringConfig;
  hapticFeedback?: boolean;
  hapticStyle?: Haptics.ImpactFeedbackStyle;
}

const defaultSpringConfig: WithSpringConfig = {
  damping: 15,
  stiffness: 300,
  mass: 0.8,
};

export function useAnimatedPress(config: AnimatedPressConfig = {}) {
  const {
    scalePressed = 0.97,
    springConfig = defaultSpringConfig,
    hapticFeedback = true,
    hapticStyle = Haptics.ImpactFeedbackStyle.Light,
  } = config;

  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const onPressIn = useCallback(() => {
    scale.value = withSpring(scalePressed, springConfig);
    opacity.value = withSpring(0.9, springConfig);
    if (hapticFeedback) {
      Haptics.impactAsync(hapticStyle);
    }
  }, [scalePressed, springConfig, hapticFeedback, hapticStyle]);

  const onPressOut = useCallback(() => {
    scale.value = withSpring(1, springConfig);
    opacity.value = withSpring(1, springConfig);
  }, [springConfig]);

  return {
    animatedStyle,
    onPressIn,
    onPressOut,
    scale,
    opacity,
  };
}

// Variant for cards (less scale, more subtle)
export function useCardPress() {
  return useAnimatedPress({
    scalePressed: 0.98,
    springConfig: {
      damping: 20,
      stiffness: 400,
      mass: 0.6,
    },
  });
}

// Variant for buttons (more pronounced)
export function useButtonPress() {
  return useAnimatedPress({
    scalePressed: 0.95,
    springConfig: {
      damping: 12,
      stiffness: 350,
      mass: 0.5,
    },
  });
}

// Variant for icons/small elements
export function useIconPress() {
  return useAnimatedPress({
    scalePressed: 0.85,
    springConfig: {
      damping: 10,
      stiffness: 400,
      mass: 0.4,
    },
  });
}

// Variant for FAB (floating action button)
export function useFABPress() {
  return useAnimatedPress({
    scalePressed: 0.9,
    springConfig: {
      damping: 12,
      stiffness: 300,
      mass: 0.5,
    },
  });
}

export default useAnimatedPress;
