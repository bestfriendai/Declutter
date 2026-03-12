import React from 'react';
import { Text, StyleSheet, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { ColorTokens } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Typography } from '@/theme/typography';
import { Spacing, BorderRadius } from '@/theme/spacing';

interface ActionButtonProps {
  emoji: string;
  label: string;
  onPress: () => void;
  colors: ColorTokens;
}

export default function ActionButton({
  emoji,
  label,
  onPress,
  colors,
}: ActionButtonProps) {
  const colorScheme = useColorScheme() ?? 'dark';

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
          backgroundColor: colorScheme === 'dark'
            ? 'rgba(255, 255, 255, 0.08)'
            : 'rgba(0, 0, 0, 0.05)',
        },
      ]}
    >
      <Text style={styles.actionEmoji}>{emoji}</Text>
      <Text style={[Typography.caption1, { color: colors.text }]}>{label}</Text>
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
