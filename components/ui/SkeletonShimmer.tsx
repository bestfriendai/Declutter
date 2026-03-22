/**
 * SkeletonShimmer -- Reusable shimmer placeholder animation
 * Drop-in loading placeholder for cards, text, and avatars.
 */

import React, { useEffect } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { V1 } from '@/constants/designTokens';

interface SkeletonShimmerProps {
  width: number | string;
  height: number;
  borderRadius?: number;
  isDark?: boolean;
  style?: ViewStyle;
}

export function SkeletonShimmer({
  width,
  height,
  borderRadius = 8,
  isDark = false,
  style,
}: SkeletonShimmerProps) {
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(shimmer.value, [0, 1], [0.3, 0.7]);
    return { opacity };
  });

  const baseColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  return (
    <Animated.View
      style={[
        {
          // DimensionValue accepts string | number but ViewStyle narrowly types width as number
          width: width as unknown as number,
          height,
          borderRadius,
          backgroundColor: baseColor,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({});
