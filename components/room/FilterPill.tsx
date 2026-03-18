import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { ColorTokens } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Typography } from '@/theme/typography';
import { Spacing, BorderRadius } from '@/theme/spacing';

interface FilterPillProps {
  label: string;
  count: number;
  active: boolean;
  onPress: () => void;
  colors: ColorTokens;
}

export default function FilterPill({
  label,
  count,
  active,
  onPress,
  colors,
}: FilterPillProps) {
  const colorScheme = useColorScheme() ?? 'dark';
  const isDark = colorScheme === 'dark';

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={`${label}, ${count} items`}
      style={[
        styles.filterPill,
        {
          backgroundColor: active
            ? colors.primary
            : isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)',
          borderColor: active
            ? colors.primary
            : isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.10)',
        },
      ]}
    >
      <Text
        style={[
          Typography.subheadlineMedium,
          { color: active ? '#FFFFFF' : colors.text },
        ]}
      >
        {label}
      </Text>
      <View
        style={[
          styles.filterCount,
          { backgroundColor: active ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)' },
        ]}
      >
        <Text style={[Typography.caption2, { color: active ? '#FFFFFF' : colors.textSecondary }]}>
          {count}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    gap: Spacing.xs,
    minHeight: 44,
  },
  filterCount: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: Spacing.hairline,
    borderRadius: 10,
  },
});
