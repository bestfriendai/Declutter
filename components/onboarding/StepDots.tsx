import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { V1 } from '@/constants/designTokens';

export function StepDots({
  total,
  current,
  isDark,
}: {
  total: number;
  current: number;
  isDark: boolean;
}) {
  return (
    <View style={styles.dotsRow}>
      {Array.from({ length: total }).map((_, i) => (
        <Dot
          key={i}
          index={i}
          current={current}
          isDark={isDark}
        />
      ))}
    </View>
  );
}

function Dot({
  index,
  current,
  isDark,
}: {
  index: number;
  current: number;
  isDark: boolean;
}) {
  const isActive = index === current;
  const isPast = index < current;
  const scale = useSharedValue(1);

  useEffect(() => {
    if (isActive) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.25, { duration: 800 }),
          withTiming(1, { duration: 800 }),
        ),
        -1,
        true,
      );
    } else {
      scale.value = withSpring(1);
    }
  }, [isActive]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    width: isActive ? 24 : isPast ? 8 : 6,
    height: isActive ? 8 : isPast ? 8 : 6,
    borderRadius: 10,
    backgroundColor: isActive
      ? V1.coral
      : isPast
        ? V1.coralLight
        : isDark
          ? 'rgba(255,255,255,0.15)'
          : 'rgba(0,0,0,0.10)',
  }));

  return <Animated.View style={[styles.dot, animatedStyle]} />;
}

const styles = StyleSheet.create({
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
  },
  dot: {
    borderRadius: 10,
  },
});
