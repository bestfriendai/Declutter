import * as Haptics from 'expo-haptics';
import { Check, CheckCircle } from 'lucide-react-native';
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { V1 } from '@/constants/designTokens';

interface CommitmentStepProps {
  isDark: boolean;
  topInset: number;
  commitment: boolean;
  isCompleting?: boolean;
  onToggleCommitment: () => void;
  onComplete: () => void;
}

export function CommitmentStep({ isDark, topInset, commitment, isCompleting, onToggleCommitment, onComplete }: CommitmentStepProps) {
  const t = isDark ? V1.dark : V1.light;

  return (
    <View style={[styles.stepContent, { paddingTop: topInset + 40 }]}>
      <View style={[styles.commitCheck, { borderColor: V1.green }]}>
        <CheckCircle size={48} color={V1.green} />
      </View>

      <Text style={[styles.stepTitle, { color: t.text, textAlign: 'center' }]}>
        I'm ready to organize my space and my mind.
      </Text>

      {/* Commitment checkbox */}
      <Pressable
        onPress={() => {
          Haptics.selectionAsync();
          onToggleCommitment();
        }}
        style={[
          styles.commitRow,
          {
            backgroundColor: t.card,
            borderColor: commitment ? V1.coral : t.border,
          },
        ]}
        accessibilityRole="checkbox"
        accessibilityLabel="I commit to showing up for myself"
        accessibilityState={{ checked: commitment }}
      >
        <View
          style={[
            styles.commitCheckbox,
            {
              backgroundColor: commitment
                ? V1.coral
                : 'transparent',
              borderColor: commitment ? V1.coral : t.textMuted,
            },
          ]}
        >
          {commitment && <Check size={14} color="#fff" />}
        </View>
        <Text style={[styles.commitText, { color: t.text }]}>
          I commit to showing up for myself
        </Text>
      </Pressable>

      {/* Social proof */}
      <View
        style={[
          styles.socialProof,
          { backgroundColor: t.card, borderColor: t.border },
        ]}
      >
        <Text style={[styles.proofText, { color: t.textSecondary }]}>
          Built by someone with ADHD, for people with ADHD.{'\n'}Small steps lead to big change.
        </Text>
      </View>

      <View style={{ flex: 1 }} />

      <Pressable
        onPress={() => {
          if (isCompleting) return;
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onComplete();
        }}
        disabled={isCompleting}
        style={[styles.coralButton, { opacity: isCompleting ? 0.7 : 1 }]}
        accessibilityRole="button"
        accessibilityLabel={isCompleting ? 'Setting up your plan' : "Let's do this"}
      >
        {isCompleting ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.coralButtonText}>Let's do this</Text>
        )}
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
  commitCheck: {
    alignSelf: 'center',
    marginBottom: 24,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.6,
    marginBottom: 8,
  },
  commitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    marginTop: 16,
  },
  commitCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commitText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  socialProof: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
  },
  proofText: {
    fontSize: 14,
    textAlign: 'center',
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
