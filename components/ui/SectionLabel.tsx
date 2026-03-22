/**
 * SectionLabel -- Uppercase section label with optional icon
 * Used for section headers throughout the app.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BODY_FONT, V1 } from '@/constants/designTokens';

interface SectionLabelProps {
  label: string;
  icon?: React.ReactNode;
  color?: string;
  isDark?: boolean;
}

export function SectionLabel({ label, icon, color, isDark = false }: SectionLabelProps) {
  const t = isDark ? V1.dark : V1.light;
  const textColor = color ?? t.textSecondary;

  return (
    <View style={styles.container}>
      {icon && <View style={styles.iconWrap}>{icon}</View>}
      <Text style={[styles.label, { color: textColor }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconWrap: {
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: BODY_FONT,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
