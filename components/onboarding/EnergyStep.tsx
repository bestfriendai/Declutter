import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BatteryLow, BatteryMedium, Zap, BatteryFull } from 'lucide-react-native';
import { OnboardingEnergyLevel } from '@/types/declutter';
import { V1 } from '@/constants/designTokens';
import { OptionPill } from './OptionPill';

interface EnergyStepProps {
  isDark: boolean;
  energyLevel?: OnboardingEnergyLevel;
  canContinue: boolean;
  onSelect: (level: OnboardingEnergyLevel) => void;
  onNext: () => void;
}

export function EnergyStep({ isDark, energyLevel, canContinue, onSelect, onNext }: EnergyStepProps) {
  const t = isDark ? V1.dark : V1.light;

  return (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: t.text }]}>
        How's your energy right now?
      </Text>
      <Text style={[styles.stepSubhead, { color: t.textSecondary }]}>
        This helps us suggest the right tasks
      </Text>

      <View style={styles.optionsList}>
        <OptionPill
          icon={<BatteryLow size={20} color={V1.coral} />}
          title="Exhausted"
          subtitle="Just basics today"
          selected={energyLevel === 'exhausted'}
          onPress={() => onSelect('exhausted')}
          isDark={isDark}
        />
        <OptionPill
          icon={<BatteryMedium size={20} color={V1.coral} />}
          title="Low Energy"
          subtitle="Small wins only"
          selected={energyLevel === 'low'}
          onPress={() => onSelect('low')}
          isDark={isDark}
        />
        <OptionPill
          icon={<Zap size={20} color={V1.coral} />}
          title="Feeling Okay"
          subtitle="Ready for a session"
          selected={energyLevel === 'moderate'}
          onPress={() => onSelect('moderate')}
          isDark={isDark}
        />
        <OptionPill
          icon={<BatteryFull size={20} color={V1.coral} />}
          title="Good Energy!"
          subtitle="Let's get stuff done"
          selected={energyLevel === 'high'}
          onPress={() => onSelect('high')}
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
