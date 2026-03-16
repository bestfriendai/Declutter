import { api } from '@/convex/_generated/api';
import { useAuth } from '@/context/AuthContext';
import { useDeclutter } from '@/context/DeclutterContext';
import { AmbientBackdrop } from '@/components/ui/AmbientBackdrop';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { PRODUCT_IDS, useRevenueCat } from '@/hooks/useRevenueCat';
import {
  LivingSituation,
  MascotPersonality,
  MASCOT_PERSONALITIES,
  OnboardingEnergyLevel,
  UserProfile,
} from '@/types/declutter';
import { Ionicons } from '@expo/vector-icons';
import { useMutation } from 'convex/react';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type StepKind =
  | 'welcome'
  | 'intro'
  | 'single'
  | 'multi'
  | 'guide'
  | 'loading'
  | 'preview'
  | 'commitment'
  | 'paywall';

type OptionValue = string | number;

interface StepOption<T extends OptionValue = string> {
  value: T;
  title: string;
  subtitle: string;
  emoji?: string;
}

interface OnboardingStep {
  id: string;
  kind: StepKind;
  kicker: string;
  title: string;
  description: string;
  accent: string;
}

interface OnboardingSelections {
  livingSituation?: LivingSituation;
  cleaningStruggles: string[];
  energyLevel?: OnboardingEnergyLevel;
  timeAvailability?: number;
  motivationStyle?: string;
  guidePersonality?: MascotPersonality;
  commitment?: string;
}

const BODY_FONT = 'DM Sans';
const DISPLAY_FONT = 'Bricolage Grotesque';

const STEP_SEQUENCE: OnboardingStep[] = [
  {
    id: 'welcome',
    kind: 'welcome',
    kicker: 'Step 1 of 12',
    title: 'Your space deserves to feel calm.',
    description:
      'Declutterly builds a plan around how your brain actually works -- not how a productivity app wishes it did.',
    accent: '#FFB547',
  },
  {
    id: 'problem',
    kind: 'intro',
    kicker: 'Step 2 of 12',
    title: 'Clutter is a systems problem, not a character flaw.',
    description:
      'In 2 minutes, we will build a plan around your space, your energy, and the kind of support that keeps you moving -- even on hard days.',
    accent: '#E85A4F',
  },
  {
    id: 'living',
    kind: 'single',
    kicker: 'Step 3 of 12',
    title: 'What kind of space are you managing?',
    description: 'Your plan should match the amount of visual noise and shared chaos around you.',
    accent: '#6366F1',
  },
  {
    id: 'struggles',
    kind: 'multi',
    kicker: 'Step 4 of 12',
    title: 'What gets you stuck most often?',
    description: 'Pick every one that feels true. No judgment -- we are building around the pattern, not blaming it.',
    accent: '#E85A4F',
  },
  {
    id: 'energy',
    kind: 'single',
    kicker: 'Step 5 of 12',
    title: 'How much energy do you realistically have today?',
    description: 'We will size your next actions to your real energy, not your aspirational energy.',
    accent: '#32D583',
  },
  {
    id: 'time',
    kind: 'single',
    kicker: 'Step 6 of 12',
    title: 'How much time can you reliably give this?',
    description: 'Consistency matters more than heroic clean-up bursts.',
    accent: '#FFB547',
  },
  {
    id: 'motivation',
    kind: 'single',
    kicker: 'Step 7 of 12',
    title: 'What kind of motivation actually works on you?',
    description: 'The app will lean into the tone that helps you start and stay with it.',
    accent: '#6366F1',
  },
  {
    id: 'guide',
    kind: 'guide',
    kicker: 'Step 8 of 12',
    title: 'Choose the guide you want in your corner.',
    description: 'Different kinds of encouragement feel right to different brains. Pick the one you would actually listen to.',
    accent: '#32D583',
  },
  {
    id: 'building',
    kind: 'loading',
    kicker: 'Step 9 of 12',
    title: 'Building your personal rhythm...',
    description: 'Matching tasks to your energy, sizing sessions to your time, and keeping it all doable.',
    accent: '#FFB547',
  },
  {
    id: 'preview',
    kind: 'preview',
    kicker: 'Step 10 of 12',
    title: 'Here is your starting plan.',
    description: 'This is designed to feel possible on your hardest days, not just your best ones.',
    accent: '#6366F1',
  },
  {
    id: 'commitment',
    kind: 'commitment',
    kicker: 'Step 11 of 12',
    title: 'Pick the promise you can actually keep.',
    description: 'A smaller promise you keep beats a bigger promise you resent.',
    accent: '#32D583',
  },
  {
    id: 'paywall',
    kind: 'paywall',
    kicker: 'Step 12 of 12',
    title: 'Lock in momentum while it is fresh.',
    description:
      'Get the full guided plan, streak support, and room-by-room coaching. You can absolutely continue without upgrading.',
    accent: '#FFB547',
  },
];

const LIVING_OPTIONS: StepOption<LivingSituation>[] = [
  { value: 'studio', title: 'Studio or one-room space', subtitle: 'Everything is visible all at once', emoji: '🛋️' },
  { value: 'apartment', title: 'Apartment', subtitle: 'A few zones, limited storage, fast clutter spread', emoji: '🏢' },
  { value: 'house', title: 'House', subtitle: 'Multiple rooms, multiple mess hotspots', emoji: '🏠' },
  { value: 'dorm', title: 'Dorm or temporary setup', subtitle: 'Tight footprint, high friction, very little room to hide mess', emoji: '🛏️' },
  { value: 'shared', title: 'Shared home', subtitle: 'Other people affect your systems and surfaces', emoji: '👥' },
];

const STRUGGLE_OPTIONS: StepOption<string>[] = [
  { value: 'overwhelm', title: 'I shut down when it looks too big', subtitle: 'You need smaller entry points', emoji: '🫠' },
  { value: 'starting', title: 'Starting is the hardest part', subtitle: 'You need activation, not more advice', emoji: '🚀' },
  { value: 'finishing', title: 'I start strong and then trail off', subtitle: 'You need momentum protection', emoji: '🏃' },
  { value: 'decision-fatigue', title: 'I get stuck deciding what to do first', subtitle: 'You need clear sequencing', emoji: '🧠' },
  { value: 'maintenance', title: 'I can reset once, but I cannot keep it going', subtitle: 'You need lighter daily systems', emoji: '♻️' },
  { value: 'shame', title: 'Mess makes me feel ashamed or behind', subtitle: 'You need encouragement without guilt', emoji: '❤️' },
];

const ENERGY_OPTIONS: StepOption<OnboardingEnergyLevel>[] = [
  { value: 'exhausted', title: 'Barely functioning', subtitle: 'Give me the smallest possible wins', emoji: '😮‍💨' },
  { value: 'low', title: 'Low energy', subtitle: 'I can do a little, but not much', emoji: '🌙' },
  { value: 'moderate', title: 'Steady enough', subtitle: 'I can follow a focused short plan', emoji: '🌤️' },
  { value: 'high', title: 'Good energy', subtitle: 'I can make real progress today', emoji: '⚡' },
  { value: 'hyperfocused', title: 'Locked in', subtitle: 'Give me something meaty while I have the window', emoji: '🔥' },
];

const TIME_OPTIONS: StepOption<number>[] = [
  { value: 10, title: '10 minutes', subtitle: 'A quick reset I can actually repeat', emoji: '⏱️' },
  { value: 20, title: '20 minutes', subtitle: 'Short but meaningful', emoji: '🕒' },
  { value: 30, title: '30 minutes', subtitle: 'A solid focused block', emoji: '🧹' },
  { value: 45, title: '45+ minutes', subtitle: 'I can go deeper when needed', emoji: '🏁' },
];

const MOTIVATION_OPTIONS: StepOption<string>[] = [
  { value: 'gentle', title: 'Gentle encouragement', subtitle: 'Compassion helps me stay in it', emoji: '🌿' },
  { value: 'structured', title: 'Clear structure', subtitle: 'Tell me exactly what comes next', emoji: '🧭' },
  { value: 'celebration', title: 'Visible wins and celebration', subtitle: 'I need momentum and payoff', emoji: '🎯' },
  { value: 'challenge', title: 'A bit of challenge', subtitle: 'I like goals, streaks, and momentum', emoji: '🏆' },
];

const COMMITMENT_OPTIONS: StepOption<string>[] = [
  { value: 'tiny', title: 'I will protect 10 minutes a day.', subtitle: 'Keep the bar low and keep it sacred.' },
  { value: 'steady', title: 'I will do one guided reset every day.', subtitle: 'Consistency over intensity.' },
  { value: 'focused', title: 'I will follow the plan this week.', subtitle: 'I want momentum fast.' },
];

function getTheme(isDark: boolean) {
  return {
    background: isDark ? '#09090D' : '#F7F2EB',
    surface: isDark ? 'rgba(21,21,28,0.94)' : 'rgba(255,255,255,0.86)',
    elevated: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(244,238,233,0.95)',
    text: isDark ? '#FAF6F0' : '#111114',
    textSecondary: isDark ? '#B7B1A8' : '#6D6761',
    textMuted: isDark ? '#7B766E' : '#9A948F',
    border: isDark ? 'rgba(255,255,255,0.09)' : 'rgba(52,39,28,0.08)',
    strongBorder: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(52,39,28,0.16)',
    primaryButton: isDark ? '#FAF6F0' : '#111114',
    primaryButtonText: isDark ? '#111114' : '#FAF6F0',
    secondaryButton: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.72)',
    secondaryButtonText: isDark ? '#FAF6F0' : '#111114',
    progressTrack: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(52,39,28,0.10)',
  };
}

function getAccentGradient(accent: string, isDark: boolean): readonly [string, string, string] {
  if (accent === '#FFB547') {
    return isDark
      ? ['#FFDCA7', '#FFB547', '#FF8C62']
      : ['#FFD188', '#FFB547', '#FF9667'];
  }

  if (accent === '#E85A4F') {
    return isDark
      ? ['#FFBBB1', '#E85A4F', '#D93B79']
      : ['#FFB7A9', '#F06C5E', '#DE5C8D'];
  }

  if (accent === '#32D583') {
    return isDark
      ? ['#BDF5D7', '#32D583', '#1DAE8F']
      : ['#B3F0D0', '#3BCA86', '#29B19C'];
  }

  return isDark
    ? ['#D9D2FF', '#8B82FF', '#5B6DFF']
    : ['#D5CFFF', '#9387FF', '#6572FF'];
}

function buildPlanSummary(selections: OnboardingSelections) {
  const roomCopy: Record<LivingSituation, string> = {
    studio: 'single-zone resets that lower visual chaos fast',
    apartment: 'surface-first routines that stop clutter from spreading room to room',
    house: 'rotating room focus so the whole house stops feeling impossible',
    dorm: 'tight-space systems that reduce friction immediately',
    shared: 'shared-space boundaries and personal reset anchors',
  };

  const energyCopy: Record<OnboardingEnergyLevel, string> = {
    exhausted: 'tiny wins and no-shame entry points',
    low: 'gentle pacing that still creates visible progress',
    moderate: 'clear short sessions with satisfying momentum',
    high: 'deeper blocks that convert energy into relief',
    hyperfocused: 'structured sprint targets while you have the window',
  };

  const motivationCopy: Record<string, string> = {
    gentle: 'warm prompts and low-pressure support',
    structured: 'clear sequencing and fewer decisions',
    celebration: 'visible wins, rewards, and momentum markers',
    challenge: 'streaks, targets, and stronger progress pressure',
  };

  return {
    rhythm: `${selections.timeAvailability ?? 10}-minute daily resets`,
    focus:
      selections.livingSituation
        ? roomCopy[selections.livingSituation]
        : 'calmer room-by-room resets',
    support:
      selections.energyLevel
        ? energyCopy[selections.energyLevel]
        : 'energy-aware guidance',
    motivation:
      selections.motivationStyle
        ? motivationCopy[selections.motivationStyle]
        : 'steady accountability',
  };
}

function buildPreviewChecklist(selections: OnboardingSelections) {
  const struggleLead =
    selections.cleaningStruggles[0] === 'decision-fatigue'
      ? 'Start with a single obvious surface so there is zero planning friction.'
      : selections.cleaningStruggles[0] === 'overwhelm'
        ? 'Start with one micro-zone to get a fast nervous-system win.'
        : 'Start with the easiest visible win so momentum shows up immediately.';

  return [
    struggleLead,
    `Use ${selections.timeAvailability ?? 10}-minute guided sessions until the habit feels automatic.`,
    selections.energyLevel === 'exhausted'
      ? 'Default to maintenance mode on hard days. Progress still counts.'
      : 'Scale the session to your current energy instead of forcing the same plan every day.',
    selections.motivationStyle === 'celebration'
      ? 'Lean on streaks, rewards, and before/after progress markers.'
      : 'Lean on one clear next step instead of a full-room overhaul.',
  ];
}

function OnboardingOption({
  title,
  subtitle,
  emoji,
  selected,
  colors,
  accent,
  onPress,
}: {
  title: string;
  subtitle: string;
  emoji?: string;
  selected: boolean;
  colors: ReturnType<typeof getTheme>;
  accent: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.optionCard,
        {
          backgroundColor: selected ? `${accent}18` : colors.surface,
          borderColor: selected ? accent : colors.border,
        },
      ]}
    >
      <View style={styles.optionTextWrap}>
        <View style={styles.optionTitleRow}>
          {emoji ? <Text style={styles.optionEmoji}>{emoji}</Text> : null}
          <Text style={[styles.optionTitle, { color: colors.text }]}>{title}</Text>
        </View>
        <Text style={[styles.optionSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
      </View>
      <View
        style={[
          styles.optionCheck,
          {
            borderColor: selected ? accent : colors.strongBorder,
            backgroundColor: selected ? accent : 'transparent',
          },
        ]}
      >
        {selected ? <Ionicons name="checkmark" size={14} color="#0B0B0E" /> : null}
      </View>
    </Pressable>
  );
}

export default function OnboardingScreen() {
  const rawScheme = useColorScheme();
  const isDark = rawScheme === 'dark';
  const colors = getTheme(isDark);
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const { isAuthenticated } = useAuth();
  const { user, setUser, createMascot } = useDeclutter();
  const updateUser = useMutation(api.users.update);
  const {
    plans,
    selectedPlan,
    setSelectedPlan,
    purchaseSelectedPlan,
    restorePurchases,
    isLoading: revenueLoading,
    error: revenueError,
  } = useRevenueCat();

  const [stepIndex, setStepIndex] = useState(0);
  const [isFinishing, setIsFinishing] = useState(false);
  const [answers, setAnswers] = useState<OnboardingSelections>({
    cleaningStruggles: [],
  });

  const step = STEP_SEQUENCE[stepIndex];
  const accentGradient = getAccentGradient(step.accent, isDark);
  const previewPlan = useMemo(() => buildPlanSummary(answers), [answers]);
  const previewChecklist = useMemo(() => buildPreviewChecklist(answers), [answers]);
  const displayPlans = useMemo(() => {
    const filtered = plans.filter((plan) => plan.tier === 'monthly' || plan.tier === 'annual');
    return filtered.length > 0 ? filtered : plans;
  }, [plans]);

  useEffect(() => {
    if (selectedPlan) return;
    setSelectedPlan(PRODUCT_IDS.annual);
  }, [selectedPlan, setSelectedPlan]);

  useEffect(() => {
    if (step.kind !== 'loading') return undefined;

    const timer = setTimeout(() => {
      setStepIndex((current) => Math.min(current + 1, STEP_SEQUENCE.length - 1));
    }, reducedMotion ? 600 : 1700);

    return () => clearTimeout(timer);
  }, [step.kind, reducedMotion]);

  const canContinue = useMemo(() => {
    switch (step.id) {
      case 'living':
        return !!answers.livingSituation;
      case 'struggles':
        return answers.cleaningStruggles.length > 0;
      case 'energy':
        return !!answers.energyLevel;
      case 'time':
        return !!answers.timeAvailability;
      case 'motivation':
        return !!answers.motivationStyle;
      case 'guide':
        return !!answers.guidePersonality;
      case 'commitment':
        return !!answers.commitment;
      case 'loading':
      case 'paywall':
        return false;
      default:
        return true;
    }
  }, [answers, step.id, step.kind]);

  const persistOnboarding = useCallback(async () => {
    const baseUser: UserProfile = {
      id: user?.id ?? 'local-user',
      name: user?.name ?? 'Declutterer',
      avatar: user?.avatar,
      createdAt: user?.createdAt ?? new Date(),
      onboardingComplete: true,
      livingSituation: answers.livingSituation,
      cleaningStruggles: answers.cleaningStruggles,
      energyLevel: answers.energyLevel,
      timeAvailability: answers.timeAvailability,
      motivationStyle: answers.motivationStyle,
      guidePersonality: answers.guidePersonality,
      subscriptionStatus: user?.subscriptionStatus,
      subscriptionTier: user?.subscriptionTier,
      trialEndsAt: user?.trialEndsAt,
      subscriptionExpiresAt: user?.subscriptionExpiresAt,
      subscriptionId: user?.subscriptionId,
    };

    setUser(baseUser);

    if (answers.guidePersonality) {
      const guide = MASCOT_PERSONALITIES[answers.guidePersonality];
      createMascot(guide.name, answers.guidePersonality);
    }

    if (isAuthenticated) {
      try {
        await updateUser({
          onboardingComplete: true,
          livingSituation: answers.livingSituation,
          cleaningStruggles: answers.cleaningStruggles,
          energyLevel: answers.energyLevel,
          timeAvailability: answers.timeAvailability,
          motivationStyle: answers.motivationStyle,
        });
      } catch (error) {
        console.error('Failed to persist onboarding answers', error);
      }
    }
  }, [answers, createMascot, isAuthenticated, setUser, updateUser, user]);

  const finishOnboarding = useCallback(async () => {
    if (isFinishing) return;
    setIsFinishing(true);
    try {
      await persistOnboarding();
      router.replace('/notification-permission');
    } finally {
      setIsFinishing(false);
    }
  }, [isFinishing, persistOnboarding]);

  const handlePrimaryAction = useCallback(async () => {
    if (step.kind === 'paywall') {
      const success = await purchaseSelectedPlan();
      if (success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await finishOnboarding();
      } else if (revenueError) {
        Alert.alert('Subscription unavailable', revenueError);
      }
      return;
    }

    if (!canContinue) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStepIndex((current) => Math.min(current + 1, STEP_SEQUENCE.length - 1));
  }, [canContinue, finishOnboarding, purchaseSelectedPlan, revenueError, step.kind]);

  const handleBack = useCallback(() => {
    if (stepIndex === 0 || step.kind === 'loading') return;
    Haptics.selectionAsync();
    setStepIndex((current) => Math.max(current - 1, 0));
  }, [step.kind, stepIndex]);

  const toggleStruggle = useCallback((value: string) => {
    Haptics.selectionAsync();
    setAnswers((current) => ({
      ...current,
      cleaningStruggles: current.cleaningStruggles.includes(value)
        ? current.cleaningStruggles.filter((item) => item !== value)
        : [...current.cleaningStruggles, value],
    }));
  }, []);

  const selectGuide = useCallback((value: MascotPersonality) => {
    Haptics.selectionAsync();
    setAnswers((current) => ({ ...current, guidePersonality: value }));
  }, []);

  const planTitle =
    answers.energyLevel === 'exhausted'
      ? 'Gentle reset mode'
      : answers.energyLevel === 'hyperfocused'
        ? 'Momentum sprint mode'
        : 'Steady reset mode';

  if (user?.onboardingComplete) {
    return <Redirect href="/(tabs)" />;
  }

  const headerRight =
    stepIndex === 0 ? (
      <View style={styles.authShortcuts}>
        <Pressable
          onPress={() => router.push('/auth/login')}
          style={[styles.shortcutButton, { borderColor: colors.border }]}
        >
          <Text style={[styles.shortcutLabel, { color: colors.textSecondary }]}>Log In</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push('/auth/signup')}
          style={[styles.shortcutButton, { borderColor: colors.border }]}
        >
          <Text style={[styles.shortcutLabel, { color: colors.textSecondary }]}>Sign Up</Text>
        </Pressable>
      </View>
    ) : (
      <Text style={[styles.progressLabel, { color: colors.textMuted }]}>
        {STEP_SEQUENCE.length - stepIndex} left
      </Text>
    );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <AmbientBackdrop isDark={isDark} variant="onboarding" />
      <LinearGradient
        colors={
          isDark
            ? ['rgba(255,181,71,0.14)', 'rgba(99,102,241,0.10)', 'rgba(11,11,14,0)']
            : ['rgba(255,181,71,0.18)', 'rgba(99,102,241,0.10)', 'rgba(247,242,235,0)']
        }
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View
        style={[
          styles.shell,
          {
            paddingTop: insets.top + 12,
            paddingBottom: Math.max(insets.bottom, 18),
          },
        ]}
      >
        <View style={styles.headerRow}>
          <Pressable
            onPress={handleBack}
            disabled={stepIndex === 0 || step.kind === 'loading'}
            style={[
              styles.backButton,
              {
                opacity: stepIndex === 0 || step.kind === 'loading' ? 0.35 : 1,
                borderColor: colors.border,
                backgroundColor: colors.surface,
              },
            ]}
          >
            <Ionicons name="chevron-back" size={18} color={colors.text} />
          </Pressable>

          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressBar,
                {
                  width: `${((stepIndex + 1) / STEP_SEQUENCE.length) * 100}%`,
                  backgroundColor: step.accent,
                },
              ]}
            />
          </View>

          <View style={styles.headerRight}>{headerRight}</View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            key={step.id}
            entering={FadeInDown.duration(reducedMotion ? 120 : 280)}
            exiting={FadeOutUp.duration(reducedMotion ? 120 : 180)}
            style={[styles.heroCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <View
              style={[
                styles.heroGlow,
                { backgroundColor: isDark ? `${step.accent}20` : `${step.accent}22` },
              ]}
            />
            <LinearGradient
              colors={[
                isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.76)',
                'rgba(255,255,255,0)',
              ]}
              start={{ x: 0.2, y: 0 }}
              end={{ x: 0.8, y: 1 }}
              style={styles.heroSheen}
            />

            <View style={styles.heroTopRow}>
              <LinearGradient colors={accentGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.kickerPill}>
                <Text style={styles.kickerText}>{step.kicker}</Text>
              </LinearGradient>
              {step.id === 'welcome' ? (
                <View
                  style={[
                    styles.heroMicroChip,
                    {
                      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.72)',
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Ionicons name="checkmark-circle-outline" size={14} color={isDark ? '#FFEBD0' : '#6B4B24'} />
                  <Text style={[styles.heroMicroChipText, { color: isDark ? '#E8DDD0' : '#6D5B49' }]}>
                    built around real energy
                  </Text>
                </View>
              ) : null}
            </View>

            <Text style={[styles.title, { color: colors.text }]}>{step.title}</Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>{step.description}</Text>

            {step.kind === 'welcome' ? (
              <View style={styles.stack}>
                <View style={[styles.calloutCard, { backgroundColor: colors.elevated, borderColor: colors.border }]}>
                  <Text style={[styles.calloutTitle, { color: colors.text }]}>What happens next</Text>
                  <Text style={[styles.calloutBody, { color: colors.textSecondary }]}>
                    You will answer six short questions, choose your guide, preview your first plan,
                    and decide how you want to start.
                  </Text>
                </View>

                <View style={styles.metricRow}>
                  {[
                    { label: 'Questions', value: '6' },
                    { label: 'Plan preview', value: '1' },
                    { label: 'Time needed', value: '2 min' },
                  ].map((item) => (
                    <View
                      key={item.label}
                      style={[styles.metricCard, { backgroundColor: colors.elevated, borderColor: colors.border }]}
                    >
                      <LinearGradient
                        colors={[
                          isDark ? `${step.accent}1E` : `${step.accent}26`,
                          'rgba(255,255,255,0)',
                        ]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={StyleSheet.absoluteFill}
                      />
                      <Text style={[styles.metricValue, { color: colors.text }]}>{item.value}</Text>
                      <Text style={[styles.metricLabel, { color: colors.textMuted }]}>{item.label}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            {step.kind === 'intro' ? (
              <View style={styles.stack}>
                {[
                  'No giant checklists when your energy is low.',
                  'No guilt spiral when life gets messy again.',
                  'No guessing what to do first when everything feels urgent.',
                ].map((item) => (
                  <View
                    key={item}
                    style={[styles.bulletRow, { backgroundColor: colors.elevated, borderColor: colors.border }]}
                  >
                    <View style={[styles.bulletDot, { backgroundColor: step.accent }]} />
                    <Text style={[styles.bulletText, { color: colors.textSecondary }]}>{item}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            {step.id === 'living' ? (
              <View style={styles.stack}>
                {LIVING_OPTIONS.map((option) => (
                  <OnboardingOption
                    key={option.value}
                    {...option}
                    colors={colors}
                    accent={step.accent}
                    selected={answers.livingSituation === option.value}
                    onPress={() =>
                      setAnswers((current) => ({ ...current, livingSituation: option.value }))
                    }
                  />
                ))}
              </View>
            ) : null}

            {step.id === 'struggles' ? (
              <View style={styles.stack}>
                {STRUGGLE_OPTIONS.map((option) => (
                  <OnboardingOption
                    key={option.value}
                    {...option}
                    colors={colors}
                    accent={step.accent}
                    selected={answers.cleaningStruggles.includes(option.value)}
                    onPress={() => toggleStruggle(option.value)}
                  />
                ))}
              </View>
            ) : null}

            {step.id === 'energy' ? (
              <View style={styles.stack}>
                {ENERGY_OPTIONS.map((option) => (
                  <OnboardingOption
                    key={option.value}
                    {...option}
                    colors={colors}
                    accent={step.accent}
                    selected={answers.energyLevel === option.value}
                    onPress={() =>
                      setAnswers((current) => ({ ...current, energyLevel: option.value }))
                    }
                  />
                ))}
              </View>
            ) : null}

            {step.id === 'time' ? (
              <View style={styles.stack}>
                {TIME_OPTIONS.map((option) => (
                  <OnboardingOption
                    key={option.value}
                    {...option}
                    colors={colors}
                    accent={step.accent}
                    selected={answers.timeAvailability === option.value}
                    onPress={() =>
                      setAnswers((current) => ({ ...current, timeAvailability: option.value }))
                    }
                  />
                ))}
              </View>
            ) : null}

            {step.id === 'motivation' ? (
              <View style={styles.stack}>
                {MOTIVATION_OPTIONS.map((option) => (
                  <OnboardingOption
                    key={option.value}
                    {...option}
                    colors={colors}
                    accent={step.accent}
                    selected={answers.motivationStyle === option.value}
                    onPress={() =>
                      setAnswers((current) => ({ ...current, motivationStyle: option.value }))
                    }
                  />
                ))}
              </View>
            ) : null}

            {step.kind === 'guide' ? (
              <View style={styles.stack}>
                {(Object.keys(MASCOT_PERSONALITIES) as MascotPersonality[]).map((personality) => {
                  const guide = MASCOT_PERSONALITIES[personality];
                  const selected = answers.guidePersonality === personality;
                  return (
                    <Pressable
                      key={personality}
                      onPress={() => selectGuide(personality)}
                      style={[
                        styles.guideCard,
                        {
                          backgroundColor: selected ? `${step.accent}15` : colors.surface,
                          borderColor: selected ? step.accent : colors.border,
                        },
                      ]}
                    >
                      <View style={styles.guideHeader}>
                        <Text style={styles.guideEmoji}>{guide.emoji}</Text>
                        <View style={styles.guideTextWrap}>
                          <Text style={[styles.guideTitle, { color: colors.text }]}>{guide.name}</Text>
                          <Text style={[styles.guideSubtitle, { color: colors.textSecondary }]}>
                            {guide.description}
                          </Text>
                        </View>
                      </View>
                      <Text style={[styles.guideBody, { color: colors.textSecondary }]}>
                        {personality === 'dusty'
                          ? 'Steady, reassuring, and ideal when shame shows up fast.'
                          : personality === 'spark'
                            ? 'High-energy momentum for when you want a push.'
                            : personality === 'bubbles'
                              ? 'Playful encouragement that makes the work feel lighter.'
                              : 'Calm structure that keeps decisions simple.'}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}

            {step.kind === 'loading' ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator size="large" color={step.accent} />
                <View style={styles.loadingBars}>
                  {['Your space profile', 'Task pacing', 'Motivation style'].map((label, index) => (
                    <View key={label} style={styles.loadingBarRow}>
                      <Text style={[styles.loadingLabel, { color: colors.textSecondary }]}>{label}</Text>
                      <View style={[styles.loadingTrack, { backgroundColor: colors.progressTrack }]}>
                        <View
                          style={[
                            styles.loadingFill,
                            {
                              width: `${55 + index * 18}%`,
                              backgroundColor: step.accent,
                            },
                          ]}
                        />
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            {step.kind === 'preview' ? (
              <View style={styles.stack}>
                <View style={[styles.planHero, { backgroundColor: `${step.accent}14`, borderColor: colors.border }]}>
                  <Text style={[styles.planHeroTitle, { color: colors.text }]}>{planTitle}</Text>
                  <Text style={[styles.planHeroBody, { color: colors.textSecondary }]}>
                    {previewPlan.rhythm} with {previewPlan.support}.
                  </Text>
                </View>

                {[
                  { label: 'Focus', value: previewPlan.focus },
                  { label: 'Support style', value: previewPlan.motivation },
                  { label: 'Daily rhythm', value: previewPlan.rhythm },
                ].map((item) => (
                  <View
                    key={item.label}
                    style={[styles.previewRow, { backgroundColor: colors.elevated, borderColor: colors.border }]}
                  >
                    <Text style={[styles.previewLabel, { color: colors.textMuted }]}>{item.label}</Text>
                    <Text style={[styles.previewValue, { color: colors.text }]}>{item.value}</Text>
                  </View>
                ))}

                <View style={[styles.checklistCard, { backgroundColor: colors.elevated, borderColor: colors.border }]}>
                  <Text style={[styles.checklistTitle, { color: colors.text }]}>Your first-week checklist</Text>
                  {previewChecklist.map((item) => (
                    <View key={item} style={styles.checklistRow}>
                      <Ionicons name="checkmark-circle" size={14} color={step.accent} />
                      <Text style={[styles.checklistText, { color: colors.textSecondary }]}>{item}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            {step.kind === 'commitment' ? (
              <View style={styles.stack}>
                {COMMITMENT_OPTIONS.map((option) => (
                  <OnboardingOption
                    key={option.value}
                    {...option}
                    colors={colors}
                    accent={step.accent}
                    selected={answers.commitment === option.value}
                    onPress={() =>
                      setAnswers((current) => ({ ...current, commitment: option.value }))
                    }
                  />
                ))}

                <View style={[styles.calloutCard, { backgroundColor: colors.elevated, borderColor: colors.border }]}>
                  <Text style={[styles.calloutTitle, { color: colors.text }]}>Why this matters</Text>
                  <Text style={[styles.calloutBody, { color: colors.textSecondary }]}>
                    The app will shape reminders, streak pressure, and task pacing around the promise you choose here.
                  </Text>
                </View>
              </View>
            ) : null}

            {step.kind === 'paywall' ? (
              <View style={styles.stack}>
                <View style={[styles.calloutCard, { backgroundColor: colors.elevated, borderColor: colors.border }]}>
                  <Text style={[styles.calloutTitle, { color: colors.text }]}>Included with Pro</Text>
                  {[
                    'Personalized room plans based on your answers',
                    'Guided streak support and accountability',
                    'Better AI breakdowns and progress nudges',
                  ].map((item) => (
                    <View key={item} style={styles.checklistRow}>
                      <Ionicons name="checkmark-circle" size={16} color={step.accent} />
                      <Text style={[styles.checklistText, { color: colors.textSecondary }]}>{item}</Text>
                    </View>
                  ))}
                </View>

                {displayPlans.map((plan) => {
                  const selected = selectedPlan === plan.id;
                  return (
                    <Pressable
                      key={plan.id}
                      onPress={() => setSelectedPlan(plan.id)}
                      style={[
                        styles.planCard,
                        {
                          backgroundColor: selected ? `${step.accent}16` : colors.surface,
                          borderColor: selected ? step.accent : colors.border,
                        },
                      ]}
                    >
                      <View style={styles.planCardHeader}>
                        <View>
                          <Text style={[styles.planCardTitle, { color: colors.text }]}>{plan.title}</Text>
                          <Text style={[styles.planCardSubtitle, { color: colors.textSecondary }]}>
                            {plan.subtitle}
                          </Text>
                        </View>
                        {plan.badge ? (
                          <View style={[styles.planBadge, { backgroundColor: `${step.accent}20` }]}>
                            <Text style={[styles.planBadgeText, { color: step.accent }]}>{plan.badge}</Text>
                          </View>
                        ) : null}
                      </View>
                      <Text style={[styles.planPrice, { color: colors.text }]}>{plan.price}</Text>
                      <Text style={[styles.planPriceMeta, { color: colors.textMuted }]}>
                        {plan.hasTrial ? `${plan.trialDays}-day free trial` : plan.pricePerMonth}
                      </Text>
                    </Pressable>
                  );
                })}

                <Pressable onPress={handlePrimaryAction} style={styles.primaryButton}>
                  <LinearGradient colors={accentGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.primaryButtonFill}>
                    <Text style={[styles.primaryButtonText, { color: '#111114' }]}>
                      {revenueLoading ? 'Starting...' : 'Start my trial'}
                    </Text>
                    <Text style={styles.primaryButtonHint}>Unlock the full guided plan while momentum is fresh.</Text>
                  </LinearGradient>
                </Pressable>

                <Pressable
                  onPress={finishOnboarding}
                  style={[styles.secondaryButton, { backgroundColor: colors.secondaryButton, borderColor: colors.border }]}
                >
                  <Text style={[styles.secondaryButtonText, { color: colors.secondaryButtonText }]}>
                    Continue without upgrading
                  </Text>
                </Pressable>

                <Pressable
                  onPress={async () => {
                    const restored = await restorePurchases();
                    if (restored) {
                      await finishOnboarding();
                    } else if (revenueError) {
                      Alert.alert('Restore unavailable', revenueError);
                    }
                  }}
                >
                  <Text style={[styles.restoreLabel, { color: colors.textMuted }]}>Restore purchases</Text>
                </Pressable>
              </View>
            ) : null}
          </Animated.View>
        </ScrollView>

        {step.kind !== 'paywall' ? (
          <Pressable
            disabled={!canContinue || step.kind === 'loading'}
            onPress={handlePrimaryAction}
            style={[
              styles.primaryButton,
              {
                opacity: canContinue && step.kind !== 'loading' ? 1 : 0.45,
              },
            ]}
          >
            <LinearGradient colors={accentGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.primaryButtonFill}>
              <Text style={[styles.primaryButtonText, { color: '#111114' }]}>
                {step.kind === 'commitment' ? 'Lock in my plan' : 'Continue'}
              </Text>
              <Text style={styles.primaryButtonHint}>
                {step.kind === 'commitment' ? 'This becomes your default rhythm.' : 'Takes about two minutes to finish.'}
              </Text>
            </LinearGradient>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  shell: {
    flex: 1,
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  progressTrack: {
    flex: 1,
    height: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(127,127,127,0.18)',
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 999,
  },
  headerRight: {
    minWidth: 92,
    alignItems: 'flex-end',
  },
  authShortcuts: {
    flexDirection: 'row',
    gap: 8,
  },
  shortcutButton: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  shortcutLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20,
    paddingBottom: 16,
  },
  heroCard: {
    overflow: 'hidden',
    borderRadius: 32,
    borderWidth: 1,
    padding: 24,
    gap: 18,
  },
  heroGlow: {
    position: 'absolute',
    top: -36,
    right: -24,
    width: 168,
    height: 168,
    borderRadius: 84,
  },
  heroSheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 140,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  kickerPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  heroMicroChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  heroMicroChipText: {
    fontFamily: BODY_FONT,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  kickerText: {
    fontFamily: BODY_FONT,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
    color: '#17120B',
  },
  title: {
    fontFamily: DISPLAY_FONT,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  description: {
    fontFamily: BODY_FONT,
    fontSize: 15,
    lineHeight: 23,
  },
  stack: {
    gap: 12,
  },
  calloutCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 18,
    gap: 8,
  },
  calloutTitle: {
    fontFamily: BODY_FONT,
    fontSize: 16,
    fontWeight: '700',
  },
  calloutBody: {
    fontFamily: BODY_FONT,
    fontSize: 14,
    lineHeight: 21,
  },
  metricRow: {
    flexDirection: 'row',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    gap: 6,
  },
  metricValue: {
    fontFamily: DISPLAY_FONT,
    fontSize: 20,
    fontWeight: '800',
  },
  metricLabel: {
    fontFamily: BODY_FONT,
    fontSize: 12,
    fontWeight: '600',
  },
  bulletRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
  },
  bulletDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  bulletText: {
    fontFamily: BODY_FONT,
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  optionCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  optionTextWrap: {
    flex: 1,
    gap: 6,
  },
  optionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  optionEmoji: {
    fontSize: 18,
  },
  optionTitle: {
    fontFamily: BODY_FONT,
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
  },
  optionSubtitle: {
    fontFamily: BODY_FONT,
    fontSize: 13,
    lineHeight: 19,
  },
  optionCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    gap: 12,
  },
  guideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  guideEmoji: {
    fontSize: 32,
  },
  guideTextWrap: {
    flex: 1,
    gap: 4,
  },
  guideTitle: {
    fontFamily: BODY_FONT,
    fontSize: 18,
    fontWeight: '700',
  },
  guideSubtitle: {
    fontFamily: BODY_FONT,
    fontSize: 13,
  },
  guideBody: {
    fontFamily: BODY_FONT,
    fontSize: 14,
    lineHeight: 21,
  },
  loadingWrap: {
    alignItems: 'center',
    gap: 20,
    paddingVertical: 28,
  },
  loadingBars: {
    width: '100%',
    gap: 12,
  },
  loadingBarRow: {
    gap: 6,
  },
  loadingLabel: {
    fontFamily: BODY_FONT,
    fontSize: 13,
    fontWeight: '600',
  },
  loadingTrack: {
    height: 10,
    borderRadius: 999,
    overflow: 'hidden',
  },
  loadingFill: {
    height: '100%',
    borderRadius: 999,
  },
  planHero: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    gap: 8,
  },
  planHeroTitle: {
    fontFamily: DISPLAY_FONT,
    fontSize: 18,
    fontWeight: '800',
  },
  planHeroBody: {
    fontFamily: BODY_FONT,
    fontSize: 14,
    lineHeight: 21,
  },
  previewRow: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    gap: 6,
  },
  previewLabel: {
    fontFamily: BODY_FONT,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  previewValue: {
    fontFamily: BODY_FONT,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '600',
  },
  checklistCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    gap: 12,
  },
  checklistTitle: {
    fontFamily: BODY_FONT,
    fontSize: 16,
    fontWeight: '700',
  },
  checklistRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  checklistText: {
    fontFamily: BODY_FONT,
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  planCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    gap: 10,
  },
  planCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  planCardTitle: {
    fontFamily: BODY_FONT,
    fontSize: 16,
    fontWeight: '800',
  },
  planCardSubtitle: {
    fontFamily: BODY_FONT,
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  planBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  planBadgeText: {
    fontFamily: BODY_FONT,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  planPrice: {
    fontFamily: DISPLAY_FONT,
    fontSize: 22,
    fontWeight: '800',
  },
  planPriceMeta: {
    fontFamily: BODY_FONT,
    fontSize: 13,
    fontWeight: '600',
  },
  primaryButton: {
    marginTop: 12,
    minHeight: 56,
    borderRadius: 28,
    overflow: 'hidden',
  },
  primaryButtonFill: {
    minHeight: 60,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  primaryButtonText: {
    fontFamily: BODY_FONT,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  primaryButtonHint: {
    marginTop: 2,
    fontFamily: BODY_FONT,
    fontSize: 12,
    color: 'rgba(17,17,20,0.66)',
  },
  secondaryButton: {
    minHeight: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontFamily: BODY_FONT,
    fontSize: 15,
    fontWeight: '700',
  },
  restoreLabel: {
    textAlign: 'center',
    fontFamily: BODY_FONT,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
});
