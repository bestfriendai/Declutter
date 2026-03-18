import { ColorTokens } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { BorderRadius, Spacing } from '@/theme/spacing';
import { Typography } from '@/theme/typography';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

interface ActionButtonProps {
  emoji: string;
  label: string;
  onPress: () => void;
  colors: ColorTokens;
  /** Variant style for the button */
  variant?: 'default' | 'accent' | 'success' | 'warning';
}

export default function ActionButton({
  emoji,
  label,
  onPress,
  colors,
  variant = 'default',
}: ActionButtonProps) {
  const colorScheme = useColorScheme() ?? 'dark';
  const isDark = colorScheme === 'dark';

  const getBackgroundColor = () => {
    switch (variant) {
      case 'accent':
        return colors.accentMuted;
      case 'success':
        return colors.successMuted;
      case 'warning':
        return colors.warningMuted;
      default:
        return isDark
          ? 'rgba(255, 255, 255, 0.06)'
          : 'rgba(0, 0, 0, 0.05)';
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'accent':
        return colors.accent;
      case 'success':
        return colors.success;
      case 'warning':
        return colors.warning;
      default:
        return colors.text;
    }
  };

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[
        styles.actionButton,
        {
          backgroundColor: getBackgroundColor(),
        },
      ]}
    >
      <Text style={styles.actionEmoji}>{emoji}</Text>
      <Text style={[Typography.caption1, { color: getTextColor() }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
    minHeight: 44,
  },
  actionEmoji: {
    fontSize: 18,
  },
});
