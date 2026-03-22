import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Heart } from 'lucide-react-native';
import { V1 } from '@/constants/designTokens';

interface ProblemStepProps {
  isDark: boolean;
  onNext: () => void;
}

export function ProblemStep({ isDark, onNext }: ProblemStepProps) {
  const t = isDark ? V1.dark : V1.light;

  return (
    <View style={styles.stepContent}>
      <View style={styles.iconCircle}>
        <Heart size={32} color={V1.coral} />
      </View>

      <Text style={[styles.stepTitle, { color: t.text }]}>
        Cleaning feels impossible sometimes
      </Text>

      <Text style={[styles.stepDesc, { color: t.textSecondary }]}>
        And that's okay. You're not lazy {'\u2014'} your brain just works
        differently. We're here to help, not judge.
      </Text>

      <View style={{ flex: 1 }} />

      <Pressable
        onPress={onNext}
        style={styles.coralButton}
        accessibilityRole="button"
        accessibilityLabel="I hear you"
      >
        <Text style={styles.coralButtonText}>I hear you</Text>
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
  iconCircle: {
    alignSelf: 'center',
    marginBottom: 24,
    marginTop: 40,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.6,
    marginBottom: 8,
  },
  stepDesc: {
    fontSize: 15,
    lineHeight: 23,
    textAlign: 'center',
    paddingHorizontal: 12,
    marginTop: 12,
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
