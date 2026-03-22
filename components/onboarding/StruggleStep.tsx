import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Play, Flag, Layers, Box } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { V1 } from '@/constants/designTokens';
import { OptionPill } from './OptionPill';

interface StruggleStepProps {
  isDark: boolean;
  cleaningStruggles: string[];
  canContinue: boolean;
  onToggle: (struggle: string) => void;
  onNext: () => void;
}

export function StruggleStep({ isDark, cleaningStruggles, canContinue, onToggle, onNext }: StruggleStepProps) {
  const t = isDark ? V1.dark : V1.light;

  const handleToggle = (struggle: string) => {
    Haptics.selectionAsync();
    onToggle(struggle);
  };

  return (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: t.text }]}>
        What feels hardest?
      </Text>
      <Text style={[styles.stepSubhead, { color: t.textSecondary }]}>
        No judgment. Just so we know where to start.
      </Text>

      <View style={styles.optionsList}>
        <OptionPill
          icon={<Play size={20} color={V1.coral} />}
          title="Starting"
          subtitle="Getting going is the hardest part"
          selected={cleaningStruggles.includes('starting')}
          onPress={() => handleToggle('starting')}
          isDark={isDark}
        />
        <OptionPill
          icon={<Flag size={20} color={V1.coral} />}
          title="Finishing"
          subtitle="I start but never complete"
          selected={cleaningStruggles.includes('finishing')}
          onPress={() => handleToggle('finishing')}
          isDark={isDark}
        />
        <OptionPill
          icon={<Layers size={20} color={V1.coral} />}
          title="Staying Organized"
          subtitle="It gets messy again fast"
          selected={cleaningStruggles.includes('maintenance')}
          onPress={() => handleToggle('maintenance')}
          isDark={isDark}
        />
        <OptionPill
          icon={<Box size={20} color={V1.coral} />}
          title="Everything"
          subtitle="It all feels overwhelming"
          selected={cleaningStruggles.includes('overwhelm')}
          onPress={() => handleToggle('overwhelm')}
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
