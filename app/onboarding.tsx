import { api } from '@/convex/_generated/api';
import { useAuth } from '@/context/AuthContext';
import { useDeclutter } from '@/context/DeclutterContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import {
  LivingSituation,
  MascotPersonality,
  MASCOT_PERSONALITIES,
  OnboardingEnergyLevel,
  UserProfile,
} from '@/types/declutter';
import { Heart, Camera, ChevronLeft, Check, CheckCircle, Zap, BatteryLow, BatteryMedium, BatteryFull, Home, Building, BedDouble, Users, Play, Flag, Layers, Box, BarChart3, Award, Sparkles } from 'lucide-react-native';
import { useMutation } from 'convex/react';
import * as Haptics from 'expo-haptics';
import { Redirect, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeInDown, FadeOutUp, useAnimatedStyle, useSharedValue, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── V1 Color Palette ────────────────────────────────────────────────────────
const V1 = {
  coral: '#FF6B6B',
  green: '#66BB6A',
  amber: '#FFB74D',
  gold: '#FFD54F',
  blue: '#64B5F6',
  indigo: '#6366F1',
  dark: {
    bg: '#0C0C0C',
    card: '#1A1A1A',
    border: 'rgba(255,255,255,0.08)',
    text: '#FFFFFF',
    textSecondary: 'rgba(255,255,255,0.5)',
    textMuted: 'rgba(255,255,255,0.3)',
  },
  light: {
    bg: '#FAFAFA',
    card: '#F6F7F8',
    border: '#E5E7EB',
    text: '#1A1A1A',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',
  },
};

// ─── Step definitions ────────────────────────────────────────────────────────
type StepId =
  | 'welcome'
  | 'problem'
  | 'energy'
  | 'living'
  | 'struggle'
  | 'time'
  | 'motivation'
  | 'scan'
  | 'mascot'
  | 'building'
  | 'preview'
  | 'commitment';

interface OnboardingSelections {
  mascotName?: string;
  livingSituation?: LivingSituation;
  cleaningStruggles: string[];
  energyLevel?: OnboardingEnergyLevel;
  timeAvailability?: number;
  motivationStyle?: string;
  guidePersonality?: MascotPersonality;
  commitment?: boolean;
}

const STEP_IDS: StepId[] = [
  'welcome',
  'problem',
  'energy',
  'living',
  'struggle',
  'time',
  'motivation',
  'scan',
  'mascot',
  'building',
  'preview',
  'commitment',
];

// Steps that show the step indicator (1-10)
const NUMBERED_STEPS: StepId[] = [
  'welcome',
  'problem',
  'energy',
  'living',
  'struggle',
  'time',
  'motivation',
  'scan',
  'mascot',
  'building',
];

function getStepNumber(id: StepId): number | null {
  const idx = NUMBERED_STEPS.indexOf(id);
  return idx >= 0 ? idx + 1 : null;
}

// ─── Option pill component ──────────────────────────────────────────────────
function OptionPill({
  icon,
  title,
  subtitle,
  selected,
  onPress,
  isDark,
}: {
  icon?: React.ReactNode;
  title: string;
  subtitle: string;
  selected: boolean;
  onPress: () => void;
  isDark: boolean;
}) {
  const t = isDark ? V1.dark : V1.light;
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.optionPill,
        {
          backgroundColor: selected ? `${V1.coral}15` : t.card,
          borderColor: selected ? V1.coral : t.border,
          borderWidth: selected ? 1.5 : 1,
        },
      ]}
    >
      {icon && <View style={styles.optionIcon}>{icon}</View>}
      <View style={styles.optionTextWrap}>
        <Text style={[styles.optionTitle, { color: t.text }]}>{title}</Text>
        <Text style={[styles.optionSubtitle, { color: t.textSecondary }]}>
          {subtitle}
        </Text>
      </View>
    </Pressable>
  );
}

// ─── Time grid option ────────────────────────────────────────────────────────
function TimeOption({
  value: _value,
  label,
  subtitle,
  selected,
  onPress,
  isDark,
}: {
  value: number;
  label: string;
  subtitle: string;
  selected: boolean;
  onPress: () => void;
  isDark: boolean;
}) {
  const t = isDark ? V1.dark : V1.light;
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.timeOption,
        {
          backgroundColor: selected ? `${V1.coral}15` : t.card,
          borderColor: selected ? V1.coral : t.border,
          borderWidth: selected ? 1.5 : 1,
        },
      ]}
    >
      <Text style={[styles.timeValue, { color: t.text }]}>{label}</Text>
      <Text style={[styles.timeSubtitle, { color: t.textSecondary }]}>
        {subtitle}
      </Text>
    </Pressable>
  );
}

// ─── Step dots indicator ─────────────────────────────────────────────────────
function StepDots({
  total,
  current,
  isDark,
}: {
  total: number;
  current: number;
  isDark: boolean;
}) {
  return (
    <View style={styles.dotsRow}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            {
              backgroundColor:
                i < current
                  ? V1.coral
                  : i === current
                    ? V1.coral
                    : isDark
                      ? 'rgba(255,255,255,0.15)'
                      : 'rgba(0,0,0,0.12)',
              width: i === current ? 8 : 6,
              height: i === current ? 8 : 6,
            },
          ]}
        />
      ))}
    </View>
  );
}

// ─── Loading spinner with progress steps ─────────────────────────────────────
function BuildingPlanView({ isDark }: { isDark: boolean }) {
  const t = isDark ? V1.dark : V1.light;
  const rotation = useSharedValue(0);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 2000, easing: Easing.linear }),
      -1,
      false
    );
    const t1 = setTimeout(() => setActiveStep(1), 800);
    const t2 = setTimeout(() => setActiveStep(2), 1600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [rotation]);

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const steps = [
    'Analyzing preferences',
    'Building personal plan',
    'Matching your guide',
  ];

  return (
    <View style={styles.buildingWrap}>
      {/* Spinning pie chart icon */}
      <Animated.View style={[styles.buildingSpinner, spinStyle]}>
        <View style={[styles.pieChart, { borderColor: V1.coral }]}>
          <View style={[styles.pieSlice, { backgroundColor: V1.coral }]} />
        </View>
      </Animated.View>

      <Text style={[styles.buildingTitle, { color: t.text }]}>
        Building your plan...
      </Text>
      <Text style={[styles.buildingSubtitle, { color: t.textSecondary }]}>
        Analyzing your answers
      </Text>

      <View style={styles.buildingSteps}>
        {steps.map((step, i) => (
          <View key={step} style={styles.buildingStepRow}>
            <View
              style={[
                styles.buildingStepDot,
                {
                  backgroundColor:
                    i < activeStep
                      ? V1.green
                      : i === activeStep
                        ? V1.coral
                        : 'transparent',
                  borderColor:
                    i < activeStep
                      ? V1.green
                      : i === activeStep
                        ? V1.coral
                        : t.textMuted,
                },
              ]}
            >
              {i < activeStep && <Check size={12} color="#fff" />}
            </View>
            <Text
              style={[
                styles.buildingStepText,
                {
                  color:
                    i <= activeStep ? t.text : t.textMuted,
                },
              ]}
            >
              {step}
            </Text>
          </View>
        ))}
      </View>

      {/* Red progress bar */}
      <View style={[styles.buildingProgress, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}>
        <Animated.View
          style={[
            styles.buildingProgressFill,
            {
              backgroundColor: V1.coral,
              width: `${((activeStep + 1) / 3) * 100}%`,
            },
          ]}
        />
      </View>
    </View>
  );
}

// ─── Plan preview step card ──────────────────────────────────────────────────
function PlanStepCard({
  number,
  title,
  description,
  isDark,
  delay,
}: {
  number: number;
  title: string;
  description: string;
  isDark: boolean;
  delay: number;
}) {
  const t = isDark ? V1.dark : V1.light;
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(350)}
      style={[styles.planCard, { backgroundColor: t.card, borderColor: t.border }]}
    >
      <View style={styles.planCardNumber}>
        <Text style={styles.planCardNumberText}>{number}</Text>
      </View>
      <View style={styles.planCardContent}>
        <Text style={[styles.planCardTitle, { color: t.text }]}>{title}</Text>
        <Text style={[styles.planCardDesc, { color: t.textSecondary }]}>
          {description}
        </Text>
      </View>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────────────────────────────────────
export default function OnboardingScreen() {
  const rawScheme = useColorScheme();
  const isDark = rawScheme === 'dark';
  const t = isDark ? V1.dark : V1.light;
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const { isAuthenticated } = useAuth();
  const { user, setUser, createMascot } = useDeclutter();
  const updateUser = useMutation(api.users.update);

  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<OnboardingSelections>({
    cleaningStruggles: [],
    mascotName: 'Dusty',
    commitment: false,
  });

  const stepId = STEP_IDS[stepIndex];
  const stepNumber = getStepNumber(stepId);

  // Auto-advance from building step
  useEffect(() => {
    if (stepId !== 'building') return undefined;
    const timer = setTimeout(() => {
      setStepIndex((c) => Math.min(c + 1, STEP_IDS.length - 1));
    }, reducedMotion ? 800 : 2400);
    return () => clearTimeout(timer);
  }, [stepId, reducedMotion]);

  const canContinue = useMemo(() => {
    switch (stepId) {
      case 'welcome':
      case 'problem':
        return true;
      case 'energy':
        return !!answers.energyLevel;
      case 'living':
        return !!answers.livingSituation;
      case 'struggle':
        return answers.cleaningStruggles.length > 0;
      case 'time':
        return !!answers.timeAvailability;
      case 'motivation':
        return !!answers.motivationStyle;
      case 'scan':
        return true;
      case 'mascot':
        return !!answers.mascotName && answers.mascotName.trim().length >= 1;
      case 'preview':
        return true;
      case 'commitment':
        return true;
      case 'building':
        return false;
      default:
        return true;
    }
  }, [answers, stepId]);

  const persistOnboarding = useCallback(async () => {
    const baseUser: UserProfile = {
      id: user?.id ?? 'local-user',
      name: user?.name || 'Declutterer',
      avatar: user?.avatar,
      createdAt: user?.createdAt ?? new Date(),
      onboardingComplete: true,
      livingSituation: answers.livingSituation,
      cleaningStruggles: answers.cleaningStruggles,
      energyLevel: answers.energyLevel,
      timeAvailability: answers.timeAvailability,
      motivationStyle: answers.motivationStyle,
      guidePersonality: answers.guidePersonality ?? 'dusty',
      subscriptionStatus: user?.subscriptionStatus,
      subscriptionTier: user?.subscriptionTier,
      trialEndsAt: user?.trialEndsAt,
      subscriptionExpiresAt: user?.subscriptionExpiresAt,
      subscriptionId: user?.subscriptionId,
    };

    setUser(baseUser);

    const personality = answers.guidePersonality ?? 'dusty';
    const guide = MASCOT_PERSONALITIES[personality];
    createMascot(answers.mascotName || guide.name, personality);

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

  // Complete onboarding and navigate to paywall
  const completeOnboarding = useCallback(async () => {
    await persistOnboarding();
    router.push('/paywall');
  }, [persistOnboarding]);

  const handleNext = useCallback(() => {
    if (!canContinue) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStepIndex((c) => Math.min(c + 1, STEP_IDS.length - 1));
  }, [canContinue]);

  const handleBack = useCallback(() => {
    if (stepIndex === 0 || stepId === 'building') return;
    Haptics.selectionAsync();
    setStepIndex((c) => Math.max(c - 1, 0));
  }, [stepId, stepIndex]);

  const handleSkip = useCallback(() => {
    Haptics.selectionAsync();
    setStepIndex((c) => Math.min(c + 1, STEP_IDS.length - 1));
  }, []);

  // Redirect if already onboarded
  if (user?.onboardingComplete && isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  // ─── Step header with back + step counter ──────────────────────────────────
  const showBackButton = stepIndex > 0 && stepId !== 'building';
  const showSkip =
    stepId === 'living' ||
    stepId === 'struggle' ||
    stepId === 'time' ||
    stepId === 'motivation';

  const renderHeader = () => {
    if (stepId === 'welcome' || stepId === 'building' || stepId === 'preview' || stepId === 'commitment') {
      return null;
    }

    return (
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        {showBackButton ? (
          <Pressable onPress={handleBack} style={styles.backBtn} hitSlop={12}>
            <ChevronLeft size={22} color={t.text} />
          </Pressable>
        ) : (
          <View style={{ width: 32 }} />
        )}

        <View style={styles.headerCenter}>
          {stepNumber !== null && (
            <>
              <Text style={[styles.stepLabel, { color: V1.coral }]}>
                STEP {stepNumber} OF 10
              </Text>
              <StepDots total={10} current={stepNumber - 1} isDark={isDark} />
            </>
          )}
        </View>

        {showSkip ? (
          <Pressable onPress={handleSkip} hitSlop={12}>
            <Text style={[styles.skipText, { color: t.textSecondary }]}>
              Skip
            </Text>
          </Pressable>
        ) : (
          <View style={{ width: 32 }} />
        )}
      </View>
    );
  };

  // ─── Step content ──────────────────────────────────────────────────────────
  const renderStep = () => {
    switch (stepId) {
      // ── WELCOME ──────────────────────────────────────────────────────
      case 'welcome':
        return (
          <View style={[styles.centerContent, { paddingTop: insets.top + 60 }]}>
            {/* Mascot circle */}
            <View style={styles.mascotCircle}>
              <Text style={styles.mascotEmoji}>🐹</Text>
            </View>

            <Text style={[styles.appTitle, { color: t.text }]}>Declutter</Text>
            <Text style={[styles.appSubtitle, { color: t.textSecondary }]}>
              Your ADHD-friendly cleaning companion
            </Text>

            <View style={styles.welcomeActions}>
              <Pressable onPress={handleNext} style={styles.coralButton}>
                <Text style={styles.coralButtonText}>Get Started</Text>
              </Pressable>

              <Pressable
                onPress={() => router.push('/auth/login')}
                hitSlop={12}
              >
                <Text style={[styles.linkText, { color: t.textMuted }]}>
                  I already have an account
                </Text>
              </Pressable>
            </View>

            <StepDots total={6} current={0} isDark={isDark} />
          </View>
        );

      // ── PROBLEM ──────────────────────────────────────────────────────
      case 'problem':
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

            <Pressable onPress={handleNext} style={styles.coralButton}>
              <Text style={styles.coralButtonText}>That's me</Text>
            </Pressable>
          </View>
        );

      // ── ENERGY ───────────────────────────────────────────────────────
      case 'energy':
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
                selected={answers.energyLevel === 'exhausted'}
                onPress={() =>
                  setAnswers((c) => ({ ...c, energyLevel: 'exhausted' }))
                }
                isDark={isDark}
              />
              <OptionPill
                icon={<BatteryMedium size={20} color={V1.coral} />}
                title="Low Energy"
                subtitle="Small wins only"
                selected={answers.energyLevel === 'low'}
                onPress={() =>
                  setAnswers((c) => ({ ...c, energyLevel: 'low' }))
                }
                isDark={isDark}
              />
              <OptionPill
                icon={<Zap size={20} color={V1.coral} />}
                title="Feeling Okay"
                subtitle="Ready for a session"
                selected={answers.energyLevel === 'moderate'}
                onPress={() =>
                  setAnswers((c) => ({ ...c, energyLevel: 'moderate' }))
                }
                isDark={isDark}
              />
              <OptionPill
                icon={<BatteryFull size={20} color={V1.coral} />}
                title="Good Energy!"
                subtitle="Let's get stuff done"
                selected={answers.energyLevel === 'high'}
                onPress={() =>
                  setAnswers((c) => ({ ...c, energyLevel: 'high' }))
                }
                isDark={isDark}
              />
            </View>

            <View style={{ flex: 1 }} />

            <Pressable
              onPress={handleNext}
              style={[styles.coralButton, { opacity: canContinue ? 1 : 0.4 }]}
              disabled={!canContinue}
            >
              <Text style={styles.coralButtonText}>Next</Text>
            </Pressable>
          </View>
        );

      // ── LIVING ───────────────────────────────────────────────────────
      case 'living':
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
                selected={answers.livingSituation === 'apartment'}
                onPress={() =>
                  setAnswers((c) => ({ ...c, livingSituation: 'apartment' }))
                }
                isDark={isDark}
              />
              <OptionPill
                icon={<Home size={20} color={V1.coral} />}
                title="House"
                subtitle="Multiple rooms"
                selected={answers.livingSituation === 'house'}
                onPress={() =>
                  setAnswers((c) => ({ ...c, livingSituation: 'house' }))
                }
                isDark={isDark}
              />
              <OptionPill
                icon={<BedDouble size={20} color={V1.coral} />}
                title="Single Room"
                subtitle="One space to manage"
                selected={
                  answers.livingSituation === 'studio' ||
                  answers.livingSituation === 'dorm'
                }
                onPress={() =>
                  setAnswers((c) => ({ ...c, livingSituation: 'studio' }))
                }
                isDark={isDark}
              />
              <OptionPill
                icon={<Users size={20} color={V1.coral} />}
                title="Shared Space"
                subtitle="Living with others"
                selected={answers.livingSituation === 'shared'}
                onPress={() =>
                  setAnswers((c) => ({ ...c, livingSituation: 'shared' }))
                }
                isDark={isDark}
              />
            </View>

            <View style={{ flex: 1 }} />

            <Pressable
              onPress={handleNext}
              style={[styles.coralButton, { opacity: canContinue ? 1 : 0.4 }]}
              disabled={!canContinue}
            >
              <Text style={styles.coralButtonText}>Next</Text>
            </Pressable>
          </View>
        );

      // ── STRUGGLE ─────────────────────────────────────────────────────
      case 'struggle':
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
                selected={answers.cleaningStruggles.includes('starting')}
                onPress={() => {
                  Haptics.selectionAsync();
                  setAnswers((c) => ({
                    ...c,
                    cleaningStruggles: c.cleaningStruggles.includes('starting')
                      ? c.cleaningStruggles.filter((s) => s !== 'starting')
                      : [...c.cleaningStruggles, 'starting'],
                  }));
                }}
                isDark={isDark}
              />
              <OptionPill
                icon={<Flag size={20} color={V1.coral} />}
                title="Finishing"
                subtitle="I start but never complete"
                selected={answers.cleaningStruggles.includes('finishing')}
                onPress={() => {
                  Haptics.selectionAsync();
                  setAnswers((c) => ({
                    ...c,
                    cleaningStruggles: c.cleaningStruggles.includes('finishing')
                      ? c.cleaningStruggles.filter((s) => s !== 'finishing')
                      : [...c.cleaningStruggles, 'finishing'],
                  }));
                }}
                isDark={isDark}
              />
              <OptionPill
                icon={<Layers size={20} color={V1.coral} />}
                title="Staying Organized"
                subtitle="It gets messy again fast"
                selected={answers.cleaningStruggles.includes('maintenance')}
                onPress={() => {
                  Haptics.selectionAsync();
                  setAnswers((c) => ({
                    ...c,
                    cleaningStruggles: c.cleaningStruggles.includes(
                      'maintenance'
                    )
                      ? c.cleaningStruggles.filter((s) => s !== 'maintenance')
                      : [...c.cleaningStruggles, 'maintenance'],
                  }));
                }}
                isDark={isDark}
              />
              <OptionPill
                icon={<Box size={20} color={V1.coral} />}
                title="Everything"
                subtitle="It all feels overwhelming"
                selected={answers.cleaningStruggles.includes('overwhelm')}
                onPress={() => {
                  Haptics.selectionAsync();
                  setAnswers((c) => ({
                    ...c,
                    cleaningStruggles: c.cleaningStruggles.includes('overwhelm')
                      ? c.cleaningStruggles.filter((s) => s !== 'overwhelm')
                      : [...c.cleaningStruggles, 'overwhelm'],
                  }));
                }}
                isDark={isDark}
              />
            </View>

            <View style={{ flex: 1 }} />

            <Pressable
              onPress={handleNext}
              style={[styles.coralButton, { opacity: canContinue ? 1 : 0.4 }]}
              disabled={!canContinue}
            >
              <Text style={styles.coralButtonText}>Next</Text>
            </Pressable>
          </View>
        );

      // ── TIME ─────────────────────────────────────────────────────────
      case 'time':
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
                  selected={answers.timeAvailability === 5}
                  onPress={() =>
                    setAnswers((c) => ({ ...c, timeAvailability: 5 }))
                  }
                  isDark={isDark}
                />
                <TimeOption
                  value={15}
                  label="15 min"
                  subtitle="Power session"
                  selected={answers.timeAvailability === 15}
                  onPress={() =>
                    setAnswers((c) => ({ ...c, timeAvailability: 15 }))
                  }
                  isDark={isDark}
                />
              </View>
              <View style={styles.timeRow}>
                <TimeOption
                  value={30}
                  label="30 min"
                  subtitle="Deep clean"
                  selected={answers.timeAvailability === 30}
                  onPress={() =>
                    setAnswers((c) => ({ ...c, timeAvailability: 30 }))
                  }
                  isDark={isDark}
                />
                <TimeOption
                  value={60}
                  label="60 min"
                  subtitle="Full reset"
                  selected={answers.timeAvailability === 60}
                  onPress={() =>
                    setAnswers((c) => ({ ...c, timeAvailability: 60 }))
                  }
                  isDark={isDark}
                />
              </View>
            </View>

            <View style={{ flex: 1 }} />

            <Pressable
              onPress={handleNext}
              style={[styles.coralButton, { opacity: canContinue ? 1 : 0.4 }]}
              disabled={!canContinue}
            >
              <Text style={styles.coralButtonText}>Next</Text>
            </Pressable>
          </View>
        );

      // ── MOTIVATION ───────────────────────────────────────────────────
      case 'motivation':
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
                selected={answers.motivationStyle === 'celebration'}
                onPress={() =>
                  setAnswers((c) => ({ ...c, motivationStyle: 'celebration' }))
                }
                isDark={isDark}
              />
              <OptionPill
                icon={<Award size={20} color={V1.coral} />}
                title="Rewards & Streaks"
                subtitle="Earning badges and keeping streaks"
                selected={answers.motivationStyle === 'challenge'}
                onPress={() =>
                  setAnswers((c) => ({ ...c, motivationStyle: 'challenge' }))
                }
                isDark={isDark}
              />
              <OptionPill
                icon={<Users size={20} color={V1.coral} />}
                title="Accountability"
                subtitle="Knowing someone's counting on me"
                selected={answers.motivationStyle === 'structured'}
                onPress={() =>
                  setAnswers((c) => ({ ...c, motivationStyle: 'structured' }))
                }
                isDark={isDark}
              />
              <OptionPill
                icon={<Sparkles size={20} color={V1.coral} />}
                title="A Clean Space"
                subtitle="The feeling of a tidy room"
                selected={answers.motivationStyle === 'gentle'}
                onPress={() =>
                  setAnswers((c) => ({ ...c, motivationStyle: 'gentle' }))
                }
                isDark={isDark}
              />
            </View>

            <View style={{ flex: 1 }} />

            <Pressable
              onPress={handleNext}
              style={[styles.coralButton, { opacity: canContinue ? 1 : 0.4 }]}
              disabled={!canContinue}
            >
              <Text style={styles.coralButtonText}>Next</Text>
            </Pressable>
          </View>
        );

      // ── SCAN INTRO ───────────────────────────────────────────────────
      case 'scan':
        return (
          <View style={styles.stepContent}>
            <View style={[styles.iconCircleLarge, { borderColor: V1.coral }]}>
              <Camera size={36} color={V1.coral} />
            </View>

            <Text style={[styles.stepTitle, { color: t.text }]}>
              Let's see your space
            </Text>

            <Text style={[styles.stepDesc, { color: t.textSecondary }]}>
              Take a photo of any room. Our AI will spot what needs attention
              {' \u2014 '}no judgment, just a gentle starting point.
            </Text>

            <View style={{ flex: 1 }} />

            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push('/camera');
              }}
              style={styles.coralButton}
            >
              <Text style={styles.coralButtonText}>Open Camera</Text>
            </Pressable>

            <Pressable onPress={handleNext} hitSlop={12} style={styles.skipLink}>
              <Text style={[styles.linkText, { color: t.textMuted }]}>
                Skip for now
              </Text>
            </Pressable>
          </View>
        );

      // ── MEET MASCOT ──────────────────────────────────────────────────
      case 'mascot':
        return (
          <View style={styles.stepContent}>
            <View style={styles.mascotCircleLarge}>
              <Text style={{ fontSize: 80 }}>🐹</Text>
            </View>

            <Text style={[styles.stepTitle, { color: t.text }]}>
              Meet Dusty!
            </Text>
            <Text style={[styles.stepSubhead, { color: t.textSecondary }]}>
              Your cleaning companion
            </Text>

            <View style={[styles.nameInput, { borderColor: t.border, backgroundColor: t.card }]}>
              <Text style={{ fontSize: 16, marginRight: 8, color: t.textMuted }}>
                {'\u270F\uFE0F'}
              </Text>
              <TextInput
                style={[styles.nameInputText, { color: t.text }]}
                value={answers.mascotName}
                onChangeText={(text) =>
                  setAnswers((c) => ({ ...c, mascotName: text }))
                }
                placeholder="Dusty"
                placeholderTextColor={t.textMuted}
                autoCapitalize="words"
              />
            </View>
            <Text style={[styles.helperText, { color: t.textMuted }]}>
              You can always change this later
            </Text>

            <View style={{ flex: 1 }} />

            <Pressable
              onPress={handleNext}
              style={[styles.coralButton, { opacity: canContinue ? 1 : 0.4 }]}
              disabled={!canContinue}
            >
              <Text style={styles.coralButtonText}>Let's clean together!</Text>
            </Pressable>
          </View>
        );

      // ── BUILDING PLAN ────────────────────────────────────────────────
      case 'building':
        return (
          <View style={[styles.centerContent, { paddingTop: insets.top + 80 }]}>
            <BuildingPlanView isDark={isDark} />
          </View>
        );

      // ── PLAN PREVIEW ─────────────────────────────────────────────────
      case 'preview':
        return (
          <View style={[styles.stepContent, { paddingTop: insets.top + 20 }]}>
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

            <Pressable onPress={handleNext} style={styles.coralButton}>
              <Text style={styles.coralButtonText}>Looks great!</Text>
            </Pressable>
          </View>
        );

      // ── COMMITMENT ───────────────────────────────────────────────────
      case 'commitment':
        return (
          <View style={[styles.stepContent, { paddingTop: insets.top + 40 }]}>
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
                setAnswers((c) => ({ ...c, commitment: !c.commitment }));
              }}
              style={[
                styles.commitRow,
                {
                  backgroundColor: t.card,
                  borderColor: answers.commitment ? V1.coral : t.border,
                },
              ]}
            >
              <View
                style={[
                  styles.commitCheckbox,
                  {
                    backgroundColor: answers.commitment
                      ? V1.coral
                      : 'transparent',
                    borderColor: answers.commitment ? V1.coral : t.textMuted,
                  },
                ]}
              >
                {answers.commitment && <Check size={14} color="#fff" />}
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
              <Text style={[styles.proofNumber, { color: V1.coral }]}>
                92%
              </Text>
              <Text style={[styles.proofText, { color: t.textSecondary }]}>
                of users feel calmer after their first session
              </Text>
            </View>

            <View style={{ flex: 1 }} />

            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                completeOnboarding();
              }}
              style={styles.coralButton}
            >
              <Text style={styles.coralButtonText}>Let's do this</Text>
            </Pressable>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {renderHeader()}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View
          key={stepId}
          entering={FadeInDown.duration(reducedMotion ? 120 : 300)}
          exiting={FadeOutUp.duration(reducedMotion ? 120 : 200)}
        >
          {renderStep()}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    alignItems: 'center',
    gap: 6,
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  skipText: {
    fontSize: 15,
    fontWeight: '500',
  },

  // ── Dots ──
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 4,
  },
  dot: {
    borderRadius: 10,
  },

  // ── Center content (welcome, building) ──
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 60,
    gap: 16,
  },

  // ── Step content ──
  stepContent: {
    flex: 1,
    minHeight: 500,
    paddingTop: 20,
  },

  // ── Mascot ──
  mascotCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  mascotCircleLarge: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 20,
  },
  mascotEmoji: {
    fontSize: 60,
  },

  // ── Welcome ──
  appTitle: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.8,
  },
  appSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  welcomeActions: {
    width: '100%',
    gap: 16,
    marginTop: 32,
    marginBottom: 24,
    paddingHorizontal: 20,
  },

  // ── Step text ──
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
  stepDesc: {
    fontSize: 15,
    lineHeight: 23,
    textAlign: 'center',
    paddingHorizontal: 12,
    marginTop: 12,
  },

  // ── Icon circles ──
  iconCircle: {
    alignSelf: 'center',
    marginBottom: 24,
    marginTop: 40,
  },
  iconCircleLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 24,
    marginTop: 40,
  },

  // ── Options list ──
  optionsList: {
    gap: 12,
  },
  optionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    gap: 14,
  },
  optionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,107,107,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTextWrap: {
    flex: 1,
    gap: 2,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  optionSubtitle: {
    fontSize: 13,
  },

  // ── Time grid ──
  timeGrid: {
    gap: 12,
    marginTop: 4,
  },
  timeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  timeOption: {
    flex: 1,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 6,
  },
  timeValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  timeSubtitle: {
    fontSize: 13,
  },

  // ── Coral button ──
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

  // ── Link text ──
  linkText: {
    fontSize: 14,
    textAlign: 'center',
  },
  skipLink: {
    alignItems: 'center',
    paddingVertical: 8,
  },

  // ── Name input ──
  nameInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 52,
    marginTop: 16,
  },
  nameInputText: {
    flex: 1,
    fontSize: 16,
  },
  helperText: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
  },

  // ── Building plan ──
  buildingWrap: {
    alignItems: 'center',
    gap: 16,
  },
  buildingSpinner: {
    marginBottom: 16,
  },
  pieChart: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 4,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  pieSlice: {
    width: '50%',
    height: '50%',
    position: 'absolute',
    top: 0,
    left: 0,
    borderBottomRightRadius: 0,
  },
  buildingTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  buildingSubtitle: {
    fontSize: 15,
  },
  buildingSteps: {
    gap: 16,
    marginTop: 20,
    width: '100%',
    paddingHorizontal: 20,
  },
  buildingStepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  buildingStepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buildingStepText: {
    fontSize: 15,
    fontWeight: '500',
  },
  buildingProgress: {
    width: '80%',
    height: 4,
    borderRadius: 2,
    marginTop: 24,
    overflow: 'hidden',
  },
  buildingProgressFill: {
    height: '100%',
    borderRadius: 2,
  },

  // ── Plan preview cards ──
  planCards: {
    gap: 12,
    marginTop: 16,
  },
  planCard: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 14,
    alignItems: 'flex-start',
  },
  planCardNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: V1.coral,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planCardNumberText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  planCardContent: {
    flex: 1,
    gap: 4,
  },
  planCardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  planCardDesc: {
    fontSize: 14,
    lineHeight: 20,
  },

  // ── Commitment ──
  commitCheck: {
    alignSelf: 'center',
    marginBottom: 24,
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
  proofNumber: {
    fontSize: 36,
    fontWeight: '800',
  },
  proofText: {
    fontSize: 14,
    textAlign: 'center',
  },
});
