/**
 * XPPopup Component - Duolingo-style floating XP animation
 *
 * Shows "+10 XP" popup when tasks are completed.
 * Supports combo multipliers and comeback bonuses.
 * Auto-dismisses after 1.5 seconds.
 */

import * as Haptics from 'expo-haptics';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';

import { useReducedMotion } from '@/hooks/useReducedMotion';

const DUOLINGO_GREEN = '#34C759';
const GOLDEN = '#FFD700';
const AUTO_DISMISS_MS = 1500;

// Sparkle positions around the XP number
const SPARKLE_CONFIGS = [
  { x: -40, y: -20, delay: 0, size: 14 },
  { x: 35, y: -25, delay: 100, size: 12 },
  { x: -30, y: 15, delay: 200, size: 10 },
  { x: 45, y: 10, delay: 150, size: 13 },
  { x: -10, y: -35, delay: 50, size: 11 },
  { x: 20, y: 25, delay: 250, size: 9 },
];

export interface XPPopupProps {
  amount: number;
  bonusMultiplier?: number;
  isCombo?: boolean;
  comboCount?: number;
  visible: boolean;
  onDismiss: () => void;
}

function Sparkle({
  x,
  y,
  delay,
  size,
  reducedMotion,
}: {
  x: number;
  y: number;
  delay: number;
  size: number;
  reducedMotion: boolean;
}) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) {
      scale.value = 1;
      opacity.value = 1;
      return;
    }
    scale.value = withDelay(
      delay,
      withSequence(
        withSpring(1.2, { damping: 6, stiffness: 200 }),
        withSpring(0.8, { damping: 8, stiffness: 150 }),
        withDelay(600, withTiming(0, { duration: 300 })),
      ),
    );
    opacity.value = withDelay(
      delay,
      withSequence(
        withTiming(1, { duration: 150 }),
        withDelay(600, withTiming(0, { duration: 300 })),
      ),
    );
  }, [reducedMotion, delay, scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.Text
      style={[
        {
          position: 'absolute',
          left: x,
          top: y,
          fontSize: size,
        },
        animatedStyle,
      ]}
    >
      {'\u2728'}
    </Animated.Text>
  );
}

export function XPPopup({
  amount,
  bonusMultiplier,
  isCombo,
  comboCount,
  visible,
  onDismiss,
}: XPPopupProps) {
  const reducedMotion = useReducedMotion();
  const floatY = useSharedValue(0);

  useEffect(() => {
    if (!visible) return;

    // Haptic on appear
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Float upward animation
    if (!reducedMotion) {
      floatY.value = withDelay(
        800,
        withTiming(-60, { duration: 700 }),
      );
    }

    // Auto-dismiss
    const timer = setTimeout(() => {
      onDismiss();
    }, AUTO_DISMISS_MS);

    return () => {
      clearTimeout(timer);
      floatY.value = 0;
    };
  }, [visible, reducedMotion, onDismiss, floatY]);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));

  if (!visible) return null;

  const displayAmount = bonusMultiplier
    ? Math.round(amount * bonusMultiplier)
    : amount;

  const enterAnimation = reducedMotion
    ? undefined
    : ZoomIn.springify().damping(10).stiffness(200);

  const exitAnimation = reducedMotion ? undefined : FadeOut.duration(300);

  return (
    <Animated.View
      entering={enterAnimation}
      exiting={exitAnimation}
      style={[styles.container, floatStyle]}
      pointerEvents="none"
    >
      <View style={styles.pillContainer}>
        {/* Sparkle particles */}
        {!reducedMotion &&
          SPARKLE_CONFIGS.map((sparkle, i) => (
            <Sparkle
              key={i}
              x={sparkle.x + 60}
              y={sparkle.y + 20}
              delay={sparkle.delay}
              size={sparkle.size}
              reducedMotion={reducedMotion}
            />
          ))}

        {/* Main XP number */}
        <Text style={styles.xpAmount}>+{displayAmount} XP</Text>

        {/* Combo indicator */}
        {isCombo && comboCount && comboCount > 1 && (
          <Text style={styles.comboText}>
            x{comboCount} COMBO!
          </Text>
        )}

        {/* Bonus multiplier */}
        {bonusMultiplier && bonusMultiplier > 1 && !isCombo && (
          <Text style={styles.bonusText}>
            ({bonusMultiplier}x Comeback Bonus!)
          </Text>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 200,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
    pointerEvents: 'none',
  },
  pillContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: DUOLINGO_GREEN,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'visible',
  },
  xpAmount: {
    fontSize: 32,
    fontWeight: '900',
    color: DUOLINGO_GREEN,
    letterSpacing: -0.5,
    textShadowColor: DUOLINGO_GREEN,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  comboText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FF6B00',
    letterSpacing: 1,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  bonusText: {
    fontSize: 12,
    fontWeight: '600',
    color: GOLDEN,
    marginTop: 2,
  },
});

export default XPPopup;
