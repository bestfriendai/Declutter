import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInUp,
  SlideOutDown,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Typography } from '@/theme/typography';
import { Spacing, BorderRadius } from '@/theme/spacing';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { EnergyLevel } from '@/types/declutter';

export type TimeAvailable = 'minimal' | 'quick' | 'standard' | 'complete';
export type Mood = 'overwhelmed' | 'low' | 'okay' | 'motivated';

export interface SessionPreferences {
  energy: EnergyLevel;
  time: TimeAvailable;
  mood: Mood;
}

interface SessionCheckInProps {
  visible: boolean;
  onComplete: (preferences: SessionPreferences) => void;
  onSkip: () => void;
}

const ENERGY_OPTIONS: { value: EnergyLevel; emoji: string; label: string; description: string }[] = [
  { value: 'minimal', emoji: '😴', label: 'Exhausted', description: 'Just the basics' },
  { value: 'low', emoji: '😐', label: 'Low', description: 'A few easy tasks' },
  { value: 'moderate', emoji: '🙂', label: 'Moderate', description: 'Ready to work' },
  { value: 'high', emoji: '⚡', label: 'High', description: "Let's do this!" },
];

const TIME_OPTIONS: { value: TimeAvailable; emoji: string; label: string; minutes: string }[] = [
  { value: 'minimal', emoji: '⏱️', label: '5 min', minutes: 'Just 5 minutes' },
  { value: 'quick', emoji: '🕐', label: '15 min', minutes: 'Quick session' },
  { value: 'standard', emoji: '🕑', label: '30 min', minutes: 'Good chunk' },
  { value: 'complete', emoji: '🕐', label: '60+ min', minutes: 'Deep clean' },
];

const MOOD_OPTIONS: { value: Mood; emoji: string; label: string; support: string }[] = [
  { value: 'overwhelmed', emoji: '😰', label: 'Overwhelmed', support: "We'll take it slow" },
  { value: 'low', emoji: '😔', label: 'Meh', support: 'Any progress counts' },
  { value: 'okay', emoji: '😊', label: 'Okay', support: "Let's make progress" },
  { value: 'motivated', emoji: '🔥', label: 'Motivated', support: "Let's crush it!" },
];

function OptionButton({
  selected,
  onPress,
  emoji,
  label,
  subtitle,
  colorScheme,
}: {
  selected: boolean;
  onPress: () => void;
  emoji: string;
  label: string;
  subtitle: string;
  colorScheme: 'light' | 'dark';
}) {
  const colors = Colors[colorScheme];

  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${label}: ${subtitle}`}
      style={[
        styles.optionButton,
        {
          backgroundColor: selected
            ? colors.primaryMuted
            : colors.surfaceSecondary,
          borderColor: selected
            ? colors.primary
            : 'transparent',
          borderWidth: selected ? 2 : 0,
        },
      ]}
    >
      <Text style={styles.optionEmoji}>{emoji}</Text>
      <Text style={[styles.optionLabel, { color: colors.text }]}>{label}</Text>
      <Text style={[styles.optionSubtitle, { color: colors.textSecondary }]}>
        {subtitle}
      </Text>
    </Pressable>
  );
}

export function SessionCheckIn({ visible, onComplete, onSkip }: SessionCheckInProps) {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];

  const [step, setStep] = useState<'energy' | 'time' | 'mood'>('energy');
  const [energy, setEnergy] = useState<EnergyLevel>('moderate');
  const [time, setTime] = useState<TimeAvailable>('standard');
  const [mood, setMood] = useState<Mood>('okay');

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step === 'energy') {
      setStep('time');
    } else if (step === 'time') {
      setStep('mood');
    } else {
      onComplete({ energy, time, mood });
    }
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step === 'time') {
      setStep('energy');
    } else if (step === 'mood') {
      setStep('time');
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 'energy':
        return 'How is your energy right now?';
      case 'time':
        return 'How much time do you have?';
      case 'mood':
        return "What's your mindset?";
    }
  };

  const getStepSubtitle = () => {
    switch (step) {
      case 'energy':
        return "No wrong answer -- we will size tasks to match";
      case 'time':
        return "Even 5 minutes counts";
      case 'mood':
        return "This changes how we cheer you on";
    }
  };

  const renderOptions = () => {
    switch (step) {
      case 'energy':
        return (
          <View style={styles.optionsGrid}>
            {ENERGY_OPTIONS.map((option) => (
              <OptionButton
                key={option.value}
                selected={energy === option.value}
                onPress={() => setEnergy(option.value)}
                emoji={option.emoji}
                label={option.label}
                subtitle={option.description}
                colorScheme={colorScheme}
              />
            ))}
          </View>
        );
      case 'time':
        return (
          <View style={styles.optionsGrid}>
            {TIME_OPTIONS.map((option) => (
              <OptionButton
                key={option.value}
                selected={time === option.value}
                onPress={() => setTime(option.value)}
                emoji={option.emoji}
                label={option.label}
                subtitle={option.minutes}
                colorScheme={colorScheme}
              />
            ))}
          </View>
        );
      case 'mood':
        return (
          <View style={styles.optionsGrid}>
            {MOOD_OPTIONS.map((option) => (
              <OptionButton
                key={option.value}
                selected={mood === option.value}
                onPress={() => setMood(option.value)}
                emoji={option.emoji}
                label={option.label}
                subtitle={option.support}
                colorScheme={colorScheme}
              />
            ))}
          </View>
        );
    }
  };

  const getProgressDots = () => {
    const steps = ['energy', 'time', 'mood'];
    return (
      <View style={styles.progressDots}>
        {steps.map((s, i) => (
          <View
            key={s}
            style={[
              styles.dot,
              {
                backgroundColor:
                  steps.indexOf(step) >= i
                    ? colors.primary
                    : colorScheme === 'dark'
                      ? 'rgba(255, 255, 255, 0.2)'
                      : 'rgba(0, 0, 0, 0.1)',
              },
            ]}
          />
        ))}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(200)}
        style={styles.overlay}
      >
        <BlurView
          intensity={40}
          tint={colorScheme}
          style={StyleSheet.absoluteFill}
        />
        <Animated.View
          entering={SlideInUp.duration(350).damping(20)}
          exiting={SlideOutDown.duration(200)}
          style={styles.content}
        >
          <GlassCard variant="elevated" radius="xxl" contentStyle={{ padding: Spacing.lg }}>
            <View style={styles.header}>
              <Text style={[styles.title, { color: colors.text }]}>
                {getStepTitle()}
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                {getStepSubtitle()}
              </Text>
            </View>

            {getProgressDots()}

            {renderOptions()}

            <View style={styles.buttons}>
              {step !== 'energy' && (
                <GlassButton
                  title="Back"
                  onPress={handleBack}
                  variant="secondary"
                  style={styles.backButton}
                />
              )}
              <GlassButton
                title={step === 'mood' ? "Let's Go!" : 'Next'}
                onPress={handleNext}
                variant="primary"
                style={styles.nextButton}
              />
            </View>

            <Pressable
              onPress={onSkip}
              style={styles.skipLink}
              accessibilityRole="button"
              accessibilityLabel="Skip session check-in"
            >
              <Text style={[styles.skipText, { color: colors.textTertiary }]}>
                Skip for now
              </Text>
            </Pressable>
          </GlassCard>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: Spacing.ml,
  },
  content: {
    width: '100%',
    maxWidth: 400,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.ml,
  },
  title: {
    ...Typography.title2,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.body,
    textAlign: 'center',
  },
  progressDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  dot: {
    width: Spacing.xs,
    height: Spacing.xs,
    borderRadius: Spacing.xxs,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  optionButton: {
    flex: 1,
    minWidth: '45%',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    minHeight: 44,
  },
  optionEmoji: {
    fontSize: 32,
    marginBottom: Spacing.xs,
  },
  optionLabel: {
    ...Typography.headline,
    fontWeight: '600',
    marginBottom: Spacing.xxs,
  },
  optionSubtitle: {
    ...Typography.caption1,
    textAlign: 'center',
  },
  buttons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  backButton: {
    flex: 1,
  },
  nextButton: {
    flex: 2,
  },
  skipLink: {
    marginTop: Spacing.md,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  skipText: {
    ...Typography.footnote,
  },
});

export default SessionCheckIn;
