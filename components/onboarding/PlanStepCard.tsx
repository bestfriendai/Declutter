import { useReducedMotion } from '@/hooks/useReducedMotion';
import { V1 } from '@/constants/designTokens';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

export function PlanStepCard({
  number,
  title,
  description,
  isDark,
  delay,
}: {
  number: number;
  title: string;
  description: string;
  isDark: boolean;
  delay: number;
}) {
  const t = isDark ? V1.dark : V1.light;
  const reducedMotion = useReducedMotion();
  return (
    <Animated.View
      entering={reducedMotion ? undefined : FadeInDown.delay(delay).duration(350)}
      style={[styles.planCard, { backgroundColor: t.card, borderColor: t.border }]}
    >
      <View style={styles.planCardNumber}>
        <Text style={styles.planCardNumberText}>{number}</Text>
      </View>
      <View style={styles.planCardContent}>
        <Text style={[styles.planCardTitle, { color: t.text }]}>{title}</Text>
        <Text style={[styles.planCardDesc, { color: t.textSecondary }]}>
          {description}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  planCard: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 14,
    alignItems: 'flex-start',
  },
  planCardNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: V1.coral,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planCardNumberText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  planCardContent: {
    flex: 1,
    gap: 4,
  },
  planCardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  planCardDesc: {
    fontSize: 14,
    lineHeight: 20,
  },
});
