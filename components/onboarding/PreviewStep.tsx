import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { V1 } from '@/constants/designTokens';
import { PlanStepCard } from './PlanStepCard';

interface PreviewStepProps {
  isDark: boolean;
  topInset: number;
  onNext: () => void;
}

export function PreviewStep({ isDark, topInset, onNext }: PreviewStepProps) {
  const t = isDark ? V1.dark : V1.light;

  return (
    <View style={[styles.stepContent, { paddingTop: topInset + 20 }]}>
      <Text style={[styles.stepTitle, { color: t.text }]}>
        Here's your path
      </Text>
      <Text style={[styles.stepTitleAccent, { color: V1.coral }]}>
        to a clearer mind
      </Text>
      <Text style={[styles.stepSubhead, { color: t.textSecondary }]}>
        Your personalized 3-step plan
      </Text>

      <View style={styles.planCards}>
        <PlanStepCard
          number={1}
          title="Scan your space"
          description="Take a photo and let AI find what needs attention"
          isDark={isDark}
          delay={200}
        />
        <PlanStepCard
          number={2}
          title="Follow bite-sized tasks"
          description="Short, doable tasks matched to your energy level"
          isDark={isDark}
          delay={400}
        />
        <PlanStepCard
          number={3}
          title="Celebrate your wins"
          description="Watch your space transform with Dusty cheering you on"
          isDark={isDark}
          delay={600}
        />
      </View>

      <View style={{ flex: 1 }} />

      <Pressable
        onPress={onNext}
        style={styles.coralButton}
        accessibilityRole="button"
        accessibilityLabel="Let's go"
      >
        <Text style={styles.coralButtonText}>Let's go</Text>
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
  stepTitleAccent: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.6,
    marginTop: -8,
    marginBottom: 8,
  },
  stepSubhead: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
  },
  planCards: {
    gap: 12,
    marginTop: 16,
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
