/**
 * ErrorBanner - Error display with auto-dismiss and optional shake animation.
 * Used across auth screens and forms for consistent error messaging.
 */

import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeInDown,
  FadeOutUp,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { AlertCircle } from 'lucide-react-native';
import { BODY_FONT, ANIMATION } from '@/constants/designTokens';

interface ErrorBannerProps {
  message: string;
  /** Auto-dismiss timeout in ms (0 = no auto-dismiss). Default: 5000 */
  autoDismissMs?: number;
  /** Callback when the error should be cleared */
  onDismiss?: () => void;
  /** Trigger a shake animation (set to a changing value to re-trigger) */
  shakeTrigger?: number;
  /** Custom style */
  style?: object;
}

export function ErrorBanner({
  message,
  autoDismissMs = 5000,
  onDismiss,
  shakeTrigger,
  style,
}: ErrorBannerProps) {
  const shakeX = useSharedValue(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

  // Auto-dismiss timer
  useEffect(() => {
    if (autoDismissMs > 0 && onDismiss) {
      timerRef.current = setTimeout(onDismiss, autoDismissMs);
      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    }
  }, [message, autoDismissMs, onDismiss]);

  // Shake animation
  useEffect(() => {
    if (shakeTrigger !== undefined && shakeTrigger > 0) {
      shakeX.value = withSequence(
        withTiming(-8, { duration: 50 }),
        withTiming(8, { duration: 50 }),
        withTiming(-6, { duration: 50 }),
        withTiming(6, { duration: 50 }),
        withTiming(-3, { duration: 50 }),
        withTiming(0, { duration: 50 }),
      );
    }
  }, [shakeTrigger, shakeX]);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  if (!message) return null;

  return (
    <Animated.View
      entering={FadeInDown.duration(ANIMATION.duration.normal)}
      exiting={FadeOutUp.duration(ANIMATION.duration.fast)}
      style={[styles.container, shakeStyle, style]}
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
    >
      <AlertCircle size={16} color="#FF453A" />
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,59,48,0.12)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  text: {
    fontSize: 13,
    color: '#FF453A',
    flex: 1,
    fontFamily: BODY_FONT,
  },
});

export default ErrorBanner;
