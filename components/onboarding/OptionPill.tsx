import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { V1 } from '@/constants/designTokens';

export function OptionPill({
  icon,
  title,
  subtitle,
  selected,
  onPress,
  isDark,
}: {
  icon?: React.ReactNode;
  title: string;
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
      accessibilityLabel={`${title}: ${subtitle}`}
      accessibilityState={{ selected }}
      style={[
        styles.optionPill,
        {
          backgroundColor: selected ? `${V1.coral}15` : t.card,
          borderColor: selected ? V1.coral : t.border,
          borderWidth: selected ? 1.5 : 1,
        },
      ]}
    >
      {icon && <View style={styles.optionIcon}>{icon}</View>}
      <View style={styles.optionTextWrap}>
        <Text style={[styles.optionTitle, { color: t.text }]}>{title}</Text>
        <Text style={[styles.optionSubtitle, { color: t.textSecondary }]}>
          {subtitle}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  optionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    gap: 14,
  },
  optionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,107,107,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTextWrap: {
    flex: 1,
    gap: 2,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  optionSubtitle: {
    fontSize: 13,
  },
});
