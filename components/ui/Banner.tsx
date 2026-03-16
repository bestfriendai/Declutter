/**
 * Banner - Informational banners for important messages
 * Used for alerts, notifications, and announcements
 */

import React from 'react';
import { useColorScheme } from '@/hooks/useColorScheme';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';
import Animated, {
  SlideInUp,
  SlideOutUp,
  LinearTransition,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/theme/typography';
import { BorderRadius, Spacing, TouchTargets } from '@/theme/spacing';

type BannerType = 'info' | 'success' | 'warning' | 'error';

interface BannerProps {
  type?: BannerType;
  title?: string;
  message: string;
  icon?: string;
  action?: {
    label: string;
    onPress: () => void;
  };
  onDismiss?: () => void;
  dismissible?: boolean;
  style?: object;
}

export function Banner({
  type = 'info',
  title,
  message,
  icon,
  action,
  onDismiss,
  dismissible = true,
  style,
}: BannerProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const handleDismiss = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onDismiss?.();
  };

  const handleAction = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    action?.onPress();
  };

  // Get colors based on type
  const getTypeColors = () => {
    switch (type) {
      case 'success':
        return {
          background: colors.successMuted,
          border: colors.success,
          icon: '✓',
          iconColor: colors.success,
          textColor: colors.success,
        };
      case 'warning':
        return {
          background: colors.warningMuted,
          border: colors.warning,
          icon: '⚠',
          iconColor: colors.warning,
          textColor: colorScheme === 'dark' ? colors.warning : '#996600',
        };
      case 'error':
        return {
          background: colors.errorMuted,
          border: colors.error,
          icon: '✕',
          iconColor: colors.error,
          textColor: colors.error,
        };
      case 'info':
      default:
        return {
          background: colors.infoMuted,
          border: colors.info,
          icon: 'ℹ',
          iconColor: colors.info,
          textColor: colors.info,
        };
    }
  };

  const typeColors = getTypeColors();
  const displayIcon = icon || typeColors.icon;

  return (
    <Animated.View
      entering={SlideInUp.duration(350).damping(18)}
      exiting={SlideOutUp.duration(200)}
      layout={LinearTransition.duration(350)}
      style={[
        styles.container,
        {
          backgroundColor: typeColors.background,
          borderLeftColor: typeColors.border,
        },
        style,
      ]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      {/* Icon */}
      <View style={styles.iconContainer}>
        <Text style={[styles.icon, { color: typeColors.iconColor }]}>
          {displayIcon}
        </Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {title && (
          <Text
            style={[
              Typography.subheadlineMedium,
              styles.title,
              { color: typeColors.textColor },
            ]}
          >
            {title}
          </Text>
        )}
        <Text
          style={[
            Typography.subheadline,
            styles.message,
            { color: colors.textSecondary },
          ]}
        >
          {message}
        </Text>

        {/* Action Button */}
        {action && (
          <Pressable
            onPress={handleAction}
            style={({ pressed }) => [
              styles.actionButton,
              pressed && styles.actionButtonPressed,
            ]}
          >
            <Text
              style={[
                Typography.subheadlineMedium,
                { color: typeColors.textColor },
              ]}
            >
              {action.label}
            </Text>
          </Pressable>
        )}
      </View>

      {/* Dismiss Button */}
      {dismissible && onDismiss && (
        <Pressable
          onPress={handleDismiss}
          style={styles.dismissButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel="Dismiss"
          accessibilityRole="button"
        >
          <Text style={[styles.dismissIcon, { color: colors.textTertiary }]}>
            ✕
          </Text>
        </Pressable>
      )}
    </Animated.View>
  );
}

// Compact inline banner variant
export function InlineBanner({
  type = 'info',
  message,
  icon,
  style,
}: Omit<BannerProps, 'title' | 'action' | 'onDismiss' | 'dismissible'>) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const getTypeColors = () => {
    switch (type) {
      case 'success':
        return { background: colors.successMuted, text: colors.success, icon: '✓' };
      case 'warning':
        return { background: colors.warningMuted, text: colors.warning, icon: '⚠' };
      case 'error':
        return { background: colors.errorMuted, text: colors.error, icon: '✕' };
      default:
        return { background: colors.infoMuted, text: colors.info, icon: 'ℹ' };
    }
  };

  const typeColors = getTypeColors();

  return (
    <View
      style={[
        styles.inlineContainer,
        { backgroundColor: typeColors.background },
        style,
      ]}
    >
      <Text style={[styles.inlineIcon, { color: typeColors.text }]}>
        {icon || typeColors.icon}
      </Text>
      <Text
        style={[
          Typography.footnote,
          styles.inlineMessage,
          { color: typeColors.text },
        ]}
      >
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderLeftWidth: 4,
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  icon: {
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  title: {
    marginBottom: Spacing.xxs,
  },
  message: {
    lineHeight: 20,
  },
  actionButton: {
    marginTop: Spacing.xs,
    paddingVertical: Spacing.xxs,
    alignSelf: 'flex-start',
  },
  actionButtonPressed: {
    opacity: 0.7,
  },
  dismissButton: {
    width: TouchTargets.minimum,
    height: TouchTargets.minimum,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.xs,
    marginTop: -Spacing.xs,
    marginRight: -Spacing.xs,
  },
  dismissIcon: {
    fontSize: 14,
  },
  // Inline Banner styles
  inlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  inlineIcon: {
    fontSize: 12,
    marginRight: Spacing.xs,
  },
  inlineMessage: {
    flex: 1,
  },
});

export default Banner;
