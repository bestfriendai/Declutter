import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ColorTokens } from '@/constants/Colors';

interface ProgressDotsProps {
  completed: number;
  total: number;
  maxDots?: number;
  colors: ColorTokens;
}

export default function ProgressDots({
  completed,
  total,
  maxDots = 10,
  colors,
}: ProgressDotsProps) {
  const displayTotal = Math.min(total, maxDots);
  const displayCompleted = Math.round((completed / total) * displayTotal);

  return (
    <View style={styles.container}>
      {Array.from({ length: displayTotal }, (_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            {
              backgroundColor: i < displayCompleted ? colors.success : colors.surfaceSecondary,
            },
          ]}
        />
      ))}
      {total > maxDots && (
        <Text style={[styles.overflow, { color: colors.textSecondary }]}>
          +{total - maxDots}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  overflow: {
    fontSize: 11,
    marginLeft: 4,
  },
});
