/**
 * Declutterly - Staggered List Animation Hook
 * Creates beautiful entrance animations for list items
 */

import { useCallback, useEffect } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
  interpolate,
  Extrapolation,
  WithSpringConfig,
} from 'react-native-reanimated';

interface StaggeredListConfig {
  delayPerItem?: number;
  initialDelay?: number;
  springConfig?: WithSpringConfig;
  translateY?: number;
}

const defaultSpringConfig: WithSpringConfig = {
  damping: 18,
  stiffness: 200,
  mass: 0.8,
};

// Hook for individual item animation
export function useStaggeredItem(
  index: number,
  config: StaggeredListConfig = {}
) {
  const {
    delayPerItem = 50,
    initialDelay = 100,
    springConfig = defaultSpringConfig,
    translateY = 30,
  } = config;

  const progress = useSharedValue(0);

  useEffect(() => {
    const delay = initialDelay + index * delayPerItem;
    progress.value = withDelay(
      delay,
      withSpring(1, springConfig)
    );
  }, [index, initialDelay, delayPerItem]);

  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      progress.value,
      [0, 1],
      [0, 1],
      Extrapolation.CLAMP
    );

    const y = interpolate(
      progress.value,
      [0, 1],
      [translateY, 0],
      Extrapolation.CLAMP
    );

    const scale = interpolate(
      progress.value,
      [0, 0.5, 1],
      [0.95, 1.02, 1],
      Extrapolation.CLAMP
    );

    return {
      opacity,
      transform: [
        { translateY: y },
        { scale },
      ],
    };
  });

  return animatedStyle;
}

// Hook for managing a list of items
export function useStaggeredList(
  itemCount: number,
  config: StaggeredListConfig = {}
) {
  const {
    delayPerItem = 50,
    initialDelay = 100,
    springConfig = defaultSpringConfig,
  } = config;

  const getItemDelay = useCallback(
    (index: number) => initialDelay + index * delayPerItem,
    [initialDelay, delayPerItem]
  );

  const getItemProps = useCallback(
    (index: number) => ({
      entering: () => {
        'worklet';
        const delay = initialDelay + index * delayPerItem;
        return {
          initialValues: {
            opacity: 0,
            transform: [{ translateY: 30 }, { scale: 0.95 }],
          },
          animations: {
            opacity: withDelay(delay, withSpring(1, springConfig)),
            transform: [
              { translateY: withDelay(delay, withSpring(0, springConfig)) },
              { scale: withDelay(delay, withSpring(1, springConfig)) },
            ],
          },
        };
      },
    }),
    [initialDelay, delayPerItem, springConfig]
  );

  return {
    getItemDelay,
    getItemProps,
    totalDuration: initialDelay + itemCount * delayPerItem + 300,
  };
}

// Fade in animation for sections
export function useFadeInSection(delay: number = 0) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration: 400 })
    );
    translateY.value = withDelay(
      delay,
      withSpring(0, { damping: 20, stiffness: 200 })
    );
  }, [delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return animatedStyle;
}

// Scale in animation for hero elements
export function useScaleIn(delay: number = 0) {
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 300 }));
    scale.value = withDelay(
      delay,
      withSpring(1, { damping: 15, stiffness: 200 })
    );
  }, [delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return animatedStyle;
}

export default useStaggeredItem;
