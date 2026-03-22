/**
 * LoadingDots - Breathing/pulsing dots reusable component.
 * Replaces ActivityIndicator for brand-consistent loading states.
 */

import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { V1 } from '@/constants/designTokens';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface LoadingDotsProps {
  /** Color of the dots. Defaults to V1.coral */
  color?: string;
  /** Size of each dot in pixels. Default: 8 */
  dotSize?: number;
  /** Number of dots. Default: 3 */
  count?: number;
  /** Gap between dots. Default: 8 */
  gap?: number;
  /** Custom style for the container */
  style?: object;
}

function Dot({
  delay,
  size,
  color,
  reducedMotion,
}: {
  delay: number;
  size: number;
  color: string;
  reducedMotion: boolean;
}) {
  const opacity = useSharedValue(reducedMotion ? 1 : 0.3);

  useEffect(() => {
    if (reducedMotion) return;
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.3, { duration: 800, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      ),
    );
  }, [delay, opacity, reducedMotion]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
}

export function LoadingDots({
  color = V1.coral,
  dotSize = 8,
  count = 3,
  gap = 8,
  style,
}: LoadingDotsProps) {
  const reducedMotion = useReducedMotion();
  const staggerDelay = 200;

  return (
    <View
      style={[styles.container, { gap }, style]}
      accessibilityLabel="Loading"
      accessibilityRole="progressbar"
    >
      {Array.from({ length: count }, (_, i) => (
        <Dot
          key={i}
          delay={i * staggerDelay}
          size={dotSize}
          color={color}
          reducedMotion={reducedMotion}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default LoadingDots;
