import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Building, Home, BedDouble, Users } from 'lucide-react-native';
import { LivingSituation } from '@/types/declutter';
import { V1 } from '@/constants/designTokens';
import { OptionPill } from './OptionPill';

interface LivingStepProps {
  isDark: boolean;
  livingSituation?: LivingSituation;
  canContinue: boolean;
  onSelect: (situation: LivingSituation) => void;
  onNext: () => void;
}

export function LivingStep({ isDark, livingSituation, canContinue, onSelect, onNext }: LivingStepProps) {
  const t = isDark ? V1.dark : V1.light;

  return (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: t.text }]}>
        What's your space?
      </Text>
      <Text style={[styles.stepSubhead, { color: t.textSecondary }]}>
        This helps us tailor tasks to your home
      </Text>

      <View style={styles.optionsList}>
        <OptionPill
          icon={<Building size={20} color={V1.coral} />}
          title="Apartment"
          subtitle="Compact living"
          selected={livingSituation === 'apartment'}
          onPress={() => onSelect('apartment')}
          isDark={isDark}
        />
        <OptionPill
          icon={<Home size={20} color={V1.coral} />}
          title="House"
          subtitle="Multiple rooms"
          selected={livingSituation === 'house'}
          onPress={() => onSelect('house')}
          isDark={isDark}
        />
        <OptionPill
          icon={<BedDouble size={20} color={V1.coral} />}
          title="Single Room"
          subtitle="One space to manage"
          selected={livingSituation === 'studio' || livingSituation === 'dorm'}
          onPress={() => onSelect('studio')}
          isDark={isDark}
        />
        <OptionPill
          icon={<Users size={20} color={V1.coral} />}
          title="Shared Space"
          subtitle="Living with others"
          selected={livingSituation === 'shared'}
          onPress={() => onSelect('shared')}
          isDark={isDark}
        />
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
  optionsList: {
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
