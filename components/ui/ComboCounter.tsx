/**
 * ComboCounter Component - Consecutive task combo tracker
 *
 * Shows a floating pill that tracks consecutive tasks completed
 * within 5 minutes of each other. Escalating visual intensity
 * as combo count increases.
 */

import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  ZoomIn,
} from 'react-native-reanimated';

import { useReducedMotion } from '@/hooks/useReducedMotion';

export interface ComboCounterProps {
  count: number;
  visible: boolean;
  position?: 'top' | 'floating';
}

function getComboGradient(count: number): readonly [string, string] {
  if (count >= 10) return ['#FFD700', '#FF8C00'] as const; // Golden
  if (count >= 5) return ['#FF453A', '#FF6B6B'] as const; // Red
  return ['#FF9500', '#FF6B00'] as const; // Orange
}

function getComboLabel(count: number): string | null {
  if (count >= 10) return 'LEGENDARY!';
  if (count >= 5) return 'UNSTOPPABLE!';
  return null;
}

export function ComboCounter({ count, visible, position = 'floating' }: ComboCounterProps) {
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const prevCount = useRef(count);

  useEffect(() => {
    if (!visible || count <= 1) return;

    // Pulse on each new combo level
    if (count > prevCount.current) {
      Haptics.impactAsync(
        count >= 5
          ? Haptics.ImpactFeedbackStyle.Heavy
          : Haptics.ImpactFeedbackStyle.Medium,
      );

      if (!reducedMotion) {
        scale.value = withSequence(
          withSpring(1.3, { damping: 6, stiffness: 300 }),
          withSpring(1, { damping: 10, stiffness: 200 }),
        );
      }
    }

    prevCount.current = count;
  }, [count, visible, reducedMotion, scale]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (!visible || count < 2) return null;

  const gradient = getComboGradient(count);
  const label = getComboLabel(count);

  const enterAnimation = reducedMotion
    ? undefined
    : ZoomIn.springify().damping(10);

  return (
    <Animated.View
      entering={enterAnimation}
      style={[
        styles.container,
        position === 'top' ? styles.positionTop : styles.positionFloating,
      ]}
      pointerEvents="none"
    >
      <Animated.View style={pulseStyle}>
        <LinearGradient
          colors={[...gradient]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.pill}
        >
          <Text style={styles.fireEmoji}>
            {count >= 10 ? '\uD83D\uDCAB' : '\uD83D\uDD25'}
          </Text>
          <Text style={styles.comboNumber}>{count}x</Text>
          <Text style={styles.comboLabel}>COMBO</Text>
          {label && <Text style={styles.specialLabel}>{label}</Text>}
        </LinearGradient>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 9998,
    pointerEvents: 'none',
  },
  positionTop: {
    top: 60,
    right: 16,
  },
  positionFloating: {
    top: 100,
    right: 16,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  fireEmoji: {
    fontSize: 16,
  },
  comboNumber: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  comboLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.9)',
    letterSpacing: 1.5,
  },
  specialLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    marginLeft: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

export default ComboCounter;
