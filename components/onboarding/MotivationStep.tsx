import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BarChart3, Award, Users, Sparkles } from 'lucide-react-native';
import { V1 } from '@/constants/designTokens';
import { OptionPill } from './OptionPill';

interface MotivationStepProps {
  isDark: boolean;
  motivationStyle?: string;
  canContinue: boolean;
  onSelect: (style: string) => void;
  onNext: () => void;
}

export function MotivationStep({ isDark, motivationStyle, canContinue, onSelect, onNext }: MotivationStepProps) {
  const t = isDark ? V1.dark : V1.light;

  return (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: t.text }]}>
        What keeps you going?
      </Text>
      <Text style={[styles.stepSubhead, { color: t.textSecondary }]}>
        We'll focus on what motivates you most
      </Text>

      <View style={styles.optionsList}>
        <OptionPill
          icon={<BarChart3 size={20} color={V1.coral} />}
          title="Visual Progress"
          subtitle="Seeing bars fill up and stats grow"
          selected={motivationStyle === 'celebration'}
          onPress={() => onSelect('celebration')}
          isDark={isDark}
        />
        <OptionPill
          icon={<Award size={20} color={V1.coral} />}
          title="Rewards & Streaks"
          subtitle="Earning badges and keeping streaks"
          selected={motivationStyle === 'challenge'}
          onPress={() => onSelect('challenge')}
          isDark={isDark}
        />
        <OptionPill
          icon={<Users size={20} color={V1.coral} />}
          title="Accountability"
          subtitle="Knowing someone's counting on me"
          selected={motivationStyle === 'structured'}
          onPress={() => onSelect('structured')}
          isDark={isDark}
        />
        <OptionPill
          icon={<Sparkles size={20} color={V1.coral} />}
          title="A Clean Space"
          subtitle="The feeling of a tidy room"
          selected={motivationStyle === 'gentle'}
          onPress={() => onSelect('gentle')}
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
