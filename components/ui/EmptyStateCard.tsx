/**
 * Declutterly - Empty State Card Component
 * Reusable empty state with animation and CTA
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ViewStyle,
  StyleProp,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { ModernCard } from '@/components/ui/ModernCard';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/theme/typography';

interface EmptyStateCardProps {
  emoji?: string;
  emojiAccessibilityLabel?: string;
  title: string;
  subtitle?: string;
  primaryActionLabel?: string;
  primaryActionOnPress?: () => void;
  secondaryActionLabel?: string;
  secondaryActionOnPress?: () => void;
  style?: StyleProp<ViewStyle>;
  animateIcon?: boolean;
  // Accessibility
  accessibilityLabel?: string;
}

export function EmptyStateCard({
  emoji = '📭',
  emojiAccessibilityLabel = 'Empty mailbox',
  title,
  subtitle,
  primaryActionLabel,
  primaryActionOnPress,
  secondaryActionLabel,
  secondaryActionOnPress,
  style,
  animateIcon = true,
  accessibilityLabel,
}: EmptyStateCardProps) {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];

  // Animation values
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.15);

  useEffect(() => {
    if (!animateIcon) return;

    // Gentle pulse animation
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );

    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(0.25, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.15, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, [animateIcon]);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const animatedGlowStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  const handlePrimaryAction = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    primaryActionOnPress?.();
  };

  const handleSecondaryAction = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    secondaryActionOnPress?.();
  };

  return (
    <Animated.View
      entering={FadeIn.duration(600)}
      style={[styles.container, style]}
      accessibilityLabel={accessibilityLabel || title}
      accessibilityRole="text"
    >
      {/* Icon with glow effect */}
      <View style={styles.iconContainer}>
        <Animated.View
          style={[
            styles.iconGlow,
            animatedGlowStyle,
            { backgroundColor: colors.primary },
          ]}
        />
        <Animated.View
          style={[
            styles.iconCircle,
            animatedIconStyle,
            { backgroundColor: colors.surfaceSecondary },
          ]}
        >
          <Text
            style={styles.emoji}
            accessibilityLabel={emojiAccessibilityLabel}
            accessibilityRole="image"
          >
            {emoji}
          </Text>
        </Animated.View>
      </View>

      {/* Title */}
      <Animated.Text
        entering={FadeInDown.delay(200).duration(400)}
        style={[styles.title, { color: colors.text }]}
        accessibilityRole="header"
      >
        {title}
      </Animated.Text>

      {/* Subtitle */}
      {subtitle && (
        <Animated.Text
          entering={FadeInDown.delay(300).duration(400)}
          style={[styles.subtitle, { color: colors.textSecondary }]}
        >
          {subtitle}
        </Animated.Text>
      )}

      {/* Primary Action */}
      {primaryActionLabel && primaryActionOnPress && (
        <Animated.View entering={FadeInDown.delay(400).duration(400)} style={{ width: '100%' }}>
          <ModernCard
            onPress={handlePrimaryAction}
            active
            style={{ ...styles.primaryButton, backgroundColor: colors.primary }}
            accessibilityLabel={primaryActionLabel}
            accessibilityHint="Double tap to perform this action"
          >
            <Text style={[styles.primaryButtonText, { color: colorScheme === 'dark' ? '#000' : '#FFF' }]}>
              {primaryActionLabel}
            </Text>
          </ModernCard>
        </Animated.View>
      )}

      {/* Secondary Action */}
      {secondaryActionLabel && secondaryActionOnPress && (
        <Animated.View entering={FadeInDown.delay(500).duration(400)}>
          <Pressable
            onPress={handleSecondaryAction}
            style={styles.secondaryButton}
            accessibilityRole="button"
            accessibilityLabel={secondaryActionLabel}
          >
            <Text style={[styles.secondaryButtonText, { color: colors.textSecondary }]}>
              {secondaryActionLabel}
            </Text>
          </Pressable>
        </Animated.View>
      )}
    </Animated.View>
  );
}

// Compact variant for inline empty states
interface CompactEmptyStateProps {
  emoji?: string;
  emojiAccessibilityLabel?: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function CompactEmptyState({
  emoji = '📭',
  emojiAccessibilityLabel = 'Empty mailbox',
  message,
  actionLabel,
  onAction,
  style,
}: CompactEmptyStateProps) {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];

  return (
    <Animated.View
      entering={FadeIn.duration(400)}
      style={[styles.compactContainer, style]}
      accessibilityLabel={message}
    >
      <Text
        style={styles.compactEmoji}
        accessibilityLabel={emojiAccessibilityLabel}
        accessibilityRole="image"
      >
        {emoji}
      </Text>
      <Text style={[styles.compactMessage, { color: colors.textSecondary }]}>
        {message}
      </Text>
      {actionLabel && onAction && (
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onAction();
          }}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
        >
          <Text style={[styles.compactAction, { color: colors.primary }]}>
            {actionLabel}
          </Text>
        </Pressable>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  iconGlow: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    borderRadius: 60,
    opacity: 0.15,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 40,
  },
  title: {
    ...Typography.title2,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    ...Typography.body,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 22,
  },
  primaryButton: {
    marginTop: 24,
    width: '100%',
    alignItems: 'center',
  },
  primaryButtonText: {
    ...Typography.buttonLarge,
  },
  secondaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  secondaryButtonText: {
    ...Typography.subheadline,
  },
  // Compact variant
  compactContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  compactEmoji: {
    fontSize: 32,
    marginBottom: 12,
  },
  compactMessage: {
    ...Typography.subheadline,
    textAlign: 'center',
    marginBottom: 12,
  },
  compactAction: {
    ...Typography.subheadlineMedium,
  },
});

export default EmptyStateCard;
