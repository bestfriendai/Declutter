import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { V1 } from '@/constants/designTokens';

export function TimeOption({
  label,
  subtitle,
  selected,
  onPress,
  isDark,
}: {
  value: number;
  label: string;
  subtitle: string;
  selected: boolean;
  onPress: () => void;
  isDark: boolean;
}) {
  const t = isDark ? V1.dark : V1.light;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${subtitle}`}
      accessibilityState={{ selected }}
      style={[
        styles.timeOption,
        {
          backgroundColor: selected ? `${V1.coral}15` : t.card,
          borderColor: selected ? V1.coral : t.border,
          borderWidth: selected ? 1.5 : 1,
        },
      ]}
    >
      <Text style={[styles.timeValue, { color: t.text }]}>{label}</Text>
      <Text style={[styles.timeSubtitle, { color: t.textSecondary }]}>
        {subtitle}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  timeOption: {
    flex: 1,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 6,
  },
  timeValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  timeSubtitle: {
    fontSize: 13,
  },
});
