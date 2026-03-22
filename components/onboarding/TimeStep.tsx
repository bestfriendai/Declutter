import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { V1 } from '@/constants/designTokens';
import { TimeOption } from './TimeOption';

interface TimeStepProps {
  isDark: boolean;
  timeAvailability?: number;
  canContinue: boolean;
  onSelect: (minutes: number) => void;
  onNext: () => void;
}

export function TimeStep({ isDark, timeAvailability, canContinue, onSelect, onNext }: TimeStepProps) {
  const t = isDark ? V1.dark : V1.light;

  return (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: t.text }]}>
        How much time do you have?
      </Text>
      <Text style={[styles.stepSubhead, { color: t.textSecondary }]}>
        Even 5 minutes can make a difference
      </Text>

      <View style={styles.timeGrid}>
        <View style={styles.timeRow}>
          <TimeOption
            value={5}
            label="5 min"
            subtitle="Quick tidy"
            selected={timeAvailability === 5}
            onPress={() => onSelect(5)}
            isDark={isDark}
          />
          <TimeOption
            value={15}
            label="15 min"
            subtitle="Power session"
            selected={timeAvailability === 15}
            onPress={() => onSelect(15)}
            isDark={isDark}
          />
        </View>
        <View style={styles.timeRow}>
          <TimeOption
            value={30}
            label="30 min"
            subtitle="Deep clean"
            selected={timeAvailability === 30}
            onPress={() => onSelect(30)}
            isDark={isDark}
          />
          <TimeOption
            value={60}
            label="60 min"
            subtitle="Full reset"
            selected={timeAvailability === 60}
            onPress={() => onSelect(60)}
            isDark={isDark}
          />
        </View>
      </View>

      <View style={{ flex: 1 }} />

      <Pressable
        onPress={onNext}
        style={[styles.coralButton, { opacity: canContinue ? 1 : 0.4 }]}
        disabled={!canContinue}
        accessibilityRole="button"
        accessibilityLabel="Next"
        accessibilityState={{ disabled: !canContinue }}
      >
        <Text style={styles.coralButtonText}>Next</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  stepContent: {
    flex: 1,
    minHeight: 500,
    paddingTop: 20,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.6,
    marginBottom: 8,
  },
  stepSubhead: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
  },
  timeGrid: {
    gap: 12,
    marginTop: 4,
  },
  timeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  coralButton: {
    backgroundColor: V1.coral,
    borderRadius: 28,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  coralButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
});
