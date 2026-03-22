/**
 * Declutterly -- Onboarding Commitment Funnel (Noom-style)
 * 15-step personalized flow: one question per screen, fast tapping,
 * warm/friendly tone, animated transitions.
 *
 * Steps:
 *  1. Welcome
 *  2. ADHD Question
 *  3. Biggest Struggle
 *  4. Emotional Impact (multi-select)
 *  5. Social Proof Insert
 *  6. Living Situation
 *  7. Worst Room
 *  8. Energy Level
 *  9. Time Available
 * 10. Encouragement Insert
 * 11. Commitment
 * 12. Meet Your Guide (mascot)
 * 13. Loading/Processing
 * 14. Your Profile summary
 * 15. → Navigate to notification-permission
 */

import { MascotAvatar, LoadingDots } from '@/components/ui';
import { BODY_FONT, DISPLAY_FONT, V1, CARD_SHADOW_LG, CARD_SHADOW_SM, RADIUS, ANIMATION } from '@/constants/designTokens';
import { useAuth } from '@/context/AuthContext';
import { useDeclutter } from '@/context/DeclutterContext';
import { api } from '@/convex/_generated/api';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import {
  LivingSituation,
  MASCOT_PERSONALITIES,
  MascotPersonality,
  OnboardingEnergyLevel,
  RoomType,
  UserProfile,
} from '@/types/declutter';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation } from 'convex/react';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOutUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenErrorBoundary } from '@/components/ErrorBoundary';
import { STORAGE_KEYS } from '@/constants/storageKeys';

// ─── Constants ───────────────────────────────────────────────────────────────
const TOTAL_STEPS = 15;
const STORAGE_KEY = STORAGE_KEYS.ONBOARDING_PROGRESS;

const ENERGY_EMOJIS: Record<OnboardingEnergyLevel, string> = {
  exhausted: '\uD83D\uDE34',
  low: '\uD83D\uDE14',
  moderate: '\uD83D\uDE10',
  high: '\uD83D\uDE04',
  hyperfocused: '\u26A1',
};

const ROOM_OPTIONS: { type: RoomType; emoji: string; label: string }[] = [
  { type: 'bedroom', emoji: '\uD83D\uDECF\uFE0F', label: 'Bedroom' },
  { type: 'kitchen', emoji: '\uD83C\uDF73', label: 'Kitchen' },
  { type: 'bathroom', emoji: '\uD83D\uDEBF', label: 'Bathroom' },
  { type: 'livingRoom', emoji: '\uD83D\uDECB\uFE0F', label: 'Living Room' },
  { type: 'office', emoji: '\uD83D\uDCBC', label: 'Office' },
  { type: 'closet', emoji: '\uD83D\uDC54', label: 'Closet' },
];

// ─── Selections State ────────────────────────────────────────────────────────
interface OnboardingSelections {
  adhdAnswer?: 'yes' | 'maybe' | 'no';
  biggestStruggle?: string;
  emotionalImpact: string[];
  livingSituation?: LivingSituation;
  worstRoom?: RoomType;
  energyLevel?: OnboardingEnergyLevel;
  timeAvailability?: number;
  commitment?: 'yes' | 'try';
  mascotName: string;
  guidePersonality: MascotPersonality;
  cleaningStruggles: string[];
  motivationStyle?: string;
}

// ─── Reusable Pill Button ────────────────────────────────────────────────────
function PillButton({
  label,
  isSelected,
  isDark,
  onPress,
  emoji,
  subtitle,
  large,
}: {
  label: string;
  isSelected: boolean;
  isDark: boolean;
  onPress: () => void;
  emoji?: string;
  subtitle?: string;
  large?: boolean;
}) {
  const t = isDark ? V1.dark : V1.light;
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
        onPressIn={() => {
          scale.value = withSpring(0.95, { damping: 15, stiffness: 350 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 15, stiffness: 350 });
        }}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ selected: isSelected }}
        style={[
          styles.pill,
          large && styles.pillLarge,
          {
            backgroundColor: isSelected
              ? isDark ? `${V1.coral}20` : `${V1.coral}12`
              : t.card,
            borderColor: isSelected ? V1.coral : t.border,
            borderWidth: isSelected ? 1.5 : 1,
          },
          isSelected && !isDark && {
            ...CARD_SHADOW_SM,
            shadowColor: V1.coral,
            shadowOpacity: 0.15,
          },
        ]}
      >
        {emoji && <Text style={styles.pillEmoji}>{emoji}</Text>}
        <View style={emoji ? { flex: 1 } : undefined}>
          <Text
            style={[
              styles.pillText,
              large && styles.pillTextLarge,
              { color: isSelected ? V1.coral : t.text },
            ]}
          >
            {label}
          </Text>
          {subtitle && (
            <Text style={[styles.pillSubtitle, { color: t.textSecondary }]}>
              {subtitle}
            </Text>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ─── Coral CTA Button ────────────────────────────────────────────────────────
function CoralCTA({
  label,
  onPress,
  disabled,
  loading,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        animStyle,
        styles.ctaShadowWrap,
        { opacity: disabled ? 0.5 : 1 },
      ]}
    >
      <Pressable
        onPress={() => {
          if (disabled || loading) return;
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onPress();
        }}
        onPressIn={() => {
          scale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 15, stiffness: 300 });
        }}
        disabled={disabled || loading}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <LinearGradient
          colors={[V1.coral, V1.coralLight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.ctaButton}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.ctaText}>{label}</Text>
          )}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────────────────────────────────────
export default function OnboardingScreen() {
  return (
    <ScreenErrorBoundary screenName="onboarding">
      <OnboardingScreenContent />
    </ScreenErrorBoundary>
  );
}

function OnboardingScreenContent() {
  const rawScheme = useColorScheme();
  const isDark = rawScheme === 'dark';
  const t = isDark ? V1.dark : V1.light;
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const { isAuthenticated, continueAsGuest } = useAuth();
  const { user, setUser, createMascot } = useDeclutter();
  const updateUser = useMutation(api.users.update);

  const [step, setStep] = useState(1);
  const [selections, setSelections] = useState<OnboardingSelections>({
    emotionalImpact: [],
    cleaningStruggles: [],
    mascotName: 'Dusty',
    guidePersonality: 'dusty',
  });
  const [isCompleting, setIsCompleting] = useState(false);

  // Animated progress bar
  const progressWidth = useSharedValue(0);

  // ─── Restore partial progress from AsyncStorage ───────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.step != null && parsed.step > 1) {
            setStep(parsed.step);
          }
          if (parsed.selections) {
            setSelections((prev) => ({ ...prev, ...parsed.selections }));
          }
        }
      } catch {
        // Start fresh
      }
    })();
  }, []);

  // ─── Persist partial progress ─────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        await AsyncStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ step, selections }),
        );
      } catch {
        // Non-critical
      }
    })();
  }, [step, selections]);

  // ─── Animate progress bar ────────────────────────────────────────────────
  useEffect(() => {
    const percent = (step / TOTAL_STEPS) * 100;
    progressWidth.value = withTiming(percent, {
      duration: reducedMotion ? 0 : ANIMATION.duration.normal,
    });
  }, [step, progressWidth, reducedMotion]);

  const progressBarAnimStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  // ─── Navigation ──────────────────────────────────────────────────────────
  const goNext = useCallback(() => {
    if (step < TOTAL_STEPS) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setStep((s) => s + 1);
    }
  }, [step]);

  const goBack = useCallback(() => {
    if (step > 1) {
      Haptics.selectionAsync();
      setStep((s) => s - 1);
    }
  }, [step]);

  // Auto-select and advance helper
  const selectAndAdvance = useCallback(
    (updater: (prev: OnboardingSelections) => OnboardingSelections) => {
      setSelections(updater);
      setTimeout(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setStep((s) => Math.min(s + 1, TOTAL_STEPS));
      }, 300);
    },
    [],
  );

  // ─── Swipe gesture ────────────────────────────────────────────────────────
  const swipeGesture = Gesture.Pan()
    .activeOffsetX([-30, 30])
    .onEnd((event) => {
      if (event.translationX < -50) {
        runOnJS(goNext)();
      } else if (event.translationX > 50 && step > 1) {
        runOnJS(goBack)();
      }
    });

  // ─── Persist and complete ─────────────────────────────────────────────────
  const persistOnboarding = useCallback(async () => {
    // Derive guide personality from answers
    let personality = selections.guidePersonality;
    if (
      selections.emotionalImpact.includes('It drains my energy') ||
      selections.biggestStruggle === 'It stresses me out but I can\'t act'
    ) {
      personality = 'tidy'; // calm
    } else if (
      selections.biggestStruggle === 'I don\'t know where to start'
    ) {
      personality = 'spark'; // energetic
    }

    const baseUser: UserProfile = {
      id: user?.id ?? 'local-user',
      name: user?.name || 'Declutterer',
      avatar: user?.avatar,
      createdAt: user?.createdAt ?? new Date(),
      onboardingComplete: true,
      livingSituation: selections.livingSituation,
      cleaningStruggles: selections.cleaningStruggles.length > 0
        ? selections.cleaningStruggles
        : selections.biggestStruggle
          ? [selections.biggestStruggle]
          : [],
      energyLevel: selections.energyLevel,
      timeAvailability: selections.timeAvailability,
      motivationStyle: selections.motivationStyle,
      guidePersonality: personality,
      subscriptionStatus: user?.subscriptionStatus,
      subscriptionTier: user?.subscriptionTier,
      trialEndsAt: user?.trialEndsAt,
      subscriptionExpiresAt: user?.subscriptionExpiresAt,
      subscriptionId: user?.subscriptionId,
    };

    setUser(baseUser);

    const guide = MASCOT_PERSONALITIES[personality];
    createMascot(selections.mascotName || guide.name, personality);

    if (isAuthenticated) {
      try {
        await updateUser({
          onboardingComplete: true,
          livingSituation: selections.livingSituation,
          cleaningStruggles: selections.cleaningStruggles.length > 0
            ? selections.cleaningStruggles
            : selections.biggestStruggle
              ? [selections.biggestStruggle]
              : [],
          energyLevel: selections.energyLevel,
          timeAvailability: selections.timeAvailability,
          motivationStyle: selections.motivationStyle,
        });
      } catch (error) {
        if (__DEV__) console.error('Failed to persist onboarding answers', error);
      }
    }

    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch {
      // Non-critical
    }
  }, [selections, createMascot, isAuthenticated, setUser, updateUser, user]);

  const completeOnboarding = useCallback(async () => {
    setIsCompleting(true);
    try {
      await persistOnboarding();
    } catch {
      if (__DEV__) console.info('Onboarding persist partial failure, continuing');
    }

    if (!isAuthenticated) {
      try {
        await continueAsGuest();
      } catch {
        if (__DEV__) console.warn('Guest auth failed during onboarding completion');
      }
    }

    setIsCompleting(false);
    router.replace('/notification-permission');
  }, [persistOnboarding, isAuthenticated, continueAsGuest]);

  // Redirect if already onboarded
  if (user?.onboardingComplete && isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  // ─── Auto-advance for timed steps ────────────────────────────────────────
  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (autoAdvanceTimer.current) {
      clearTimeout(autoAdvanceTimer.current);
      autoAdvanceTimer.current = null;
    }

    // Step 5: Social proof auto-advance after 3s
    if (step === 5) {
      autoAdvanceTimer.current = setTimeout(() => {
        setStep(6);
      }, 3000);
    }

    // Step 10: Encouragement auto-advance after 2.5s
    if (step === 10) {
      autoAdvanceTimer.current = setTimeout(() => {
        setStep(11);
      }, 2500);
    }

    // Step 13: Loading auto-advance after 2.5s
    if (step === 13) {
      autoAdvanceTimer.current = setTimeout(() => {
        setStep(14);
      }, 2500);
    }

    return () => {
      if (autoAdvanceTimer.current) {
        clearTimeout(autoAdvanceTimer.current);
      }
    };
  }, [step]);

  // Step 15 triggers navigation to notification-permission
  useEffect(() => {
    if (step === 15) {
      completeOnboarding();
    }
  }, [step, completeOnboarding]);

  // ─── Step header (back + progress bar) ────────────────────────────────────
  const showHeader = step > 1 && step < 15;
  const showBack = step > 1 && step !== 5 && step !== 10 && step !== 13;

  const renderHeader = () => {
    if (!showHeader) return null;

    return (
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        {showBack ? (
          <Pressable
            onPress={goBack}
            style={styles.backBtn}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ChevronLeft size={22} color={t.text} />
          </Pressable>
        ) : (
          <View style={{ width: 44 }} />
        )}

        <View style={styles.headerCenter}>
          <View
            style={styles.progressBarContainer}
            accessibilityRole="progressbar"
            accessibilityValue={{
              min: 0,
              max: TOTAL_STEPS,
              now: step,
            }}
            accessibilityLabel={`Step ${step} of ${TOTAL_STEPS}`}
          >
            <View
              style={[
                styles.progressBarTrack,
                {
                  backgroundColor: isDark
                    ? 'rgba(255,255,255,0.08)'
                    : 'rgba(0,0,0,0.06)',
                },
              ]}
            >
              <Animated.View
                style={[
                  styles.progressBarFill,
                  { backgroundColor: V1.coral },
                  progressBarAnimStyle,
                ]}
              />
            </View>
          </View>
        </View>

        <View style={{ width: 44 }} />
      </View>
    );
  };

  // ─── Step content ─────────────────────────────────────────────────────────
  const renderStep = () => {
    switch (step) {
      // ── Step 1: Welcome ──────────────────────────────────────────────────
      case 1:
        return (
          <View style={[styles.centeredContent, { paddingTop: insets.top + 60 }]}>
            <Animated.View entering={FadeInDown.duration(600).delay(100)} style={styles.mascotWrap}>
              <View style={styles.glowContainer}>
                <LinearGradient
                  colors={[`${V1.coral}30`, `${V1.coralLight}18`, 'transparent']}
                  style={styles.mascotGlow}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                />
                <MascotAvatar imageKey="welcome" size={130} showBackground={false} />
              </View>
            </Animated.View>

            <Animated.Text
              entering={FadeInDown.duration(600).delay(250)}
              style={[styles.heroTitle, { color: t.text }]}
            >
              Ready to take back{'\n'}your space?
            </Animated.Text>

            <Animated.Text
              entering={FadeInDown.duration(600).delay(400)}
              style={[styles.heroSubtitle, { color: t.textSecondary }]}
            >
              Declutter helps you clean without the overwhelm
            </Animated.Text>

            <Animated.View
              entering={FadeInDown.duration(600).delay(600)}
              style={styles.welcomeActions}
            >
              <CoralCTA label="Let's get started" onPress={goNext} />

              <Pressable
                onPress={() => router.replace('/auth/login')}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="Sign in to existing account"
              >
                <Text style={[styles.linkText, { color: t.textMuted }]}>
                  I already have an account
                </Text>
              </Pressable>
            </Animated.View>
          </View>
        );

      // ── Step 2: ADHD Question ────────────────────────────────────────────
      case 2:
        return (
          <View style={styles.stepContent}>
            <Animated.Text
              entering={FadeInDown.duration(400).delay(100)}
              style={[styles.stepTitle, { color: t.text }]}
            >
              Do you have ADHD, or{'\n'}suspect you might?
            </Animated.Text>

            <View style={styles.optionsColumn}>
              {[
                { value: 'yes' as const, label: 'Yes' },
                { value: 'maybe' as const, label: 'I think so' },
                { value: 'no' as const, label: 'No, but I struggle with cleaning' },
              ].map((opt) => (
                <Animated.View
                  key={opt.value}
                  entering={FadeInDown.duration(400).delay(200)}
                >
                  <PillButton
                    label={opt.label}
                    isSelected={selections.adhdAnswer === opt.value}
                    isDark={isDark}
                    large
                    onPress={() =>
                      selectAndAdvance((prev) => ({
                        ...prev,
                        adhdAnswer: opt.value,
                      }))
                    }
                  />
                </Animated.View>
              ))}
            </View>

            <Animated.Text
              entering={FadeInDown.duration(400).delay(400)}
              style={[styles.helperText, { color: t.textMuted }]}
            >
              This helps us personalize your experience
            </Animated.Text>
          </View>
        );

      // ── Step 3: Biggest Struggle ─────────────────────────────────────────
      case 3:
        return (
          <View style={styles.stepContent}>
            <Animated.Text
              entering={FadeInDown.duration(400).delay(100)}
              style={[styles.stepTitle, { color: t.text }]}
            >
              What's your biggest frustration with clutter?
            </Animated.Text>

            <View style={styles.optionsColumn}>
              {[
                'I don\'t know where to start',
                'I start but can\'t finish',
                'It builds up again fast',
                'It stresses me out but I can\'t act',
              ].map((label) => (
                <Animated.View
                  key={label}
                  entering={FadeInDown.duration(400).delay(200)}
                >
                  <PillButton
                    label={label}
                    isSelected={selections.biggestStruggle === label}
                    isDark={isDark}
                    large
                    onPress={() =>
                      selectAndAdvance((prev) => ({
                        ...prev,
                        biggestStruggle: label,
                        cleaningStruggles: [label],
                      }))
                    }
                  />
                </Animated.View>
              ))}
            </View>
          </View>
        );

      // ── Step 4: Emotional Impact (multi-select) ──────────────────────────
      case 4: {
        const emotionalOptions = [
          'I avoid having people over',
          'I can\'t find things I need',
          'It drains my energy',
        ];
        return (
          <View style={styles.stepContent}>
            <Animated.Text
              entering={FadeInDown.duration(400).delay(100)}
              style={[styles.stepTitle, { color: t.text }]}
            >
              How does clutter affect your daily life?
            </Animated.Text>

            <Animated.Text
              entering={FadeInDown.duration(400).delay(200)}
              style={[styles.stepSubhead, { color: t.textSecondary }]}
            >
              Select all that apply
            </Animated.Text>

            <View style={styles.optionsColumn}>
              {emotionalOptions.map((label) => (
                <PillButton
                  key={label}
                  label={label}
                  isSelected={selections.emotionalImpact.includes(label)}
                  isDark={isDark}
                  large
                  onPress={() => {
                    setSelections((prev) => {
                      const already = prev.emotionalImpact.includes(label);
                      return {
                        ...prev,
                        emotionalImpact: already
                          ? prev.emotionalImpact.filter((i) => i !== label)
                          : [...prev.emotionalImpact, label],
                      };
                    });
                  }}
                />
              ))}
            </View>

            <View style={{ flex: 1 }} />

            <CoralCTA
              label="Continue"
              onPress={goNext}
              disabled={selections.emotionalImpact.length === 0}
            />
          </View>
        );
      }

      // ── Step 5: Social Proof Insert (auto-advance) ───────────────────────
      case 5:
        return (
          <Pressable
            style={[styles.centeredContent, { paddingTop: insets.top + 80 }]}
            onPress={goNext}
          >
            <Animated.Text
              entering={FadeInDown.duration(500).delay(100)}
              style={[styles.socialProofTitle, { color: t.text }]}
            >
              You're not alone
            </Animated.Text>

            <Animated.Text
              entering={FadeInDown.duration(500).delay(300)}
              style={[styles.socialProofStat, { color: t.textSecondary }]}
            >
              3 in 4 adults with ADHD struggle with household management
            </Animated.Text>

            <Animated.Text
              entering={FadeInDown.duration(500).delay(500)}
              style={[styles.socialProofBody, { color: V1.coral }]}
            >
              Declutter has helped thousands take back their space
            </Animated.Text>

            <Animated.View entering={FadeIn.delay(800).duration(300)} style={{ marginTop: 40 }}>
              <Text style={[styles.tapToContinue, { color: t.textMuted }]}>
                Tap to continue
              </Text>
            </Animated.View>
          </Pressable>
        );

      // ── Step 6: Living Situation ─────────────────────────────────────────
      case 6:
        return (
          <View style={styles.stepContent}>
            <Animated.Text
              entering={FadeInDown.duration(400).delay(100)}
              style={[styles.stepTitle, { color: t.text }]}
            >
              What kind of space do you live in?
            </Animated.Text>

            <View style={styles.optionsColumn}>
              {([
                { value: 'studio' as const, emoji: '\uD83C\uDFE0', label: 'Studio' },
                { value: 'apartment' as const, emoji: '\uD83C\uDFE2', label: 'Apartment' },
                { value: 'house' as const, emoji: '\uD83C\uDFE1', label: 'House' },
                { value: 'dorm' as const, emoji: '\uD83C\uDFEB', label: 'Dorm' },
                { value: 'shared' as const, emoji: '\uD83D\uDC65', label: 'Shared' },
              ] as { value: LivingSituation; emoji: string; label: string }[]).map(
                (opt) => (
                  <PillButton
                    key={opt.value}
                    label={opt.label}
                    emoji={opt.emoji}
                    isSelected={selections.livingSituation === opt.value}
                    isDark={isDark}
                    large
                    onPress={() =>
                      selectAndAdvance((prev) => ({
                        ...prev,
                        livingSituation: opt.value,
                      }))
                    }
                  />
                ),
              )}
            </View>
          </View>
        );

      // ── Step 7: Worst Room ───────────────────────────────────────────────
      case 7:
        return (
          <View style={styles.stepContent}>
            <Animated.Text
              entering={FadeInDown.duration(400).delay(100)}
              style={[styles.stepTitle, { color: t.text }]}
            >
              Which room stresses you out the most?
            </Animated.Text>

            <View style={styles.optionsGrid}>
              {ROOM_OPTIONS.map((opt) => (
                <View key={opt.type} style={styles.gridItem}>
                  <PillButton
                    label={opt.label}
                    emoji={opt.emoji}
                    isSelected={selections.worstRoom === opt.type}
                    isDark={isDark}
                    large
                    onPress={() =>
                      selectAndAdvance((prev) => ({
                        ...prev,
                        worstRoom: opt.type,
                      }))
                    }
                  />
                </View>
              ))}
            </View>
          </View>
        );

      // ── Step 8: Energy Level ─────────────────────────────────────────────
      case 8:
        return (
          <View style={styles.stepContent}>
            <Animated.Text
              entering={FadeInDown.duration(400).delay(100)}
              style={[styles.stepTitle, { color: t.text }]}
            >
              How much energy do you have for cleaning right now?
            </Animated.Text>

            <View style={styles.optionsColumn}>
              {([
                { value: 'exhausted' as const, label: 'Exhausted' },
                { value: 'low' as const, label: 'Low Energy' },
                { value: 'moderate' as const, label: 'Moderate' },
                { value: 'high' as const, label: 'High Energy' },
                { value: 'hyperfocused' as const, label: 'Hyperfocused' },
              ] as { value: OnboardingEnergyLevel; label: string }[]).map(
                (opt) => (
                  <PillButton
                    key={opt.value}
                    label={opt.label}
                    emoji={ENERGY_EMOJIS[opt.value]}
                    isSelected={selections.energyLevel === opt.value}
                    isDark={isDark}
                    large
                    onPress={() =>
                      selectAndAdvance((prev) => ({
                        ...prev,
                        energyLevel: opt.value,
                      }))
                    }
                  />
                ),
              )}
            </View>
          </View>
        );

      // ── Step 9: Time Available ───────────────────────────────────────────
      case 9:
        return (
          <View style={styles.stepContent}>
            <Animated.Text
              entering={FadeInDown.duration(400).delay(100)}
              style={[styles.stepTitle, { color: t.text }]}
            >
              How much time could you clean today?
            </Animated.Text>

            <View style={styles.timeGrid}>
              {[
                { value: 5, label: '5 min' },
                { value: 15, label: '15 min' },
                { value: 30, label: '30 min' },
                { value: 60, label: '1 hour+' },
              ].map((opt) => (
                <Pressable
                  key={opt.value}
                  onPress={() =>
                    selectAndAdvance((prev) => ({
                      ...prev,
                      timeAvailability: opt.value,
                    }))
                  }
                  style={[
                    styles.timeCard,
                    {
                      backgroundColor:
                        selections.timeAvailability === opt.value
                          ? isDark ? `${V1.coral}20` : `${V1.coral}12`
                          : t.card,
                      borderColor:
                        selections.timeAvailability === opt.value
                          ? V1.coral
                          : t.border,
                      borderWidth: selections.timeAvailability === opt.value ? 1.5 : 1,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={opt.label}
                  accessibilityState={{
                    selected: selections.timeAvailability === opt.value,
                  }}
                >
                  <Text
                    style={[
                      styles.timeCardText,
                      {
                        color:
                          selections.timeAvailability === opt.value
                            ? V1.coral
                            : t.text,
                      },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        );

      // ── Step 10: Encouragement Insert (auto-advance) ─────────────────────
      case 10:
        return (
          <Pressable
            style={[styles.centeredContent, { paddingTop: insets.top + 80 }]}
            onPress={goNext}
          >
            <Animated.Text
              entering={FadeInDown.duration(500).delay(100)}
              style={[styles.stepTitle, { color: t.textSecondary, textAlign: 'center' }]}
            >
              Based on your answers...
            </Animated.Text>

            <Animated.Text
              entering={FadeInDown.duration(500).delay(400)}
              style={[styles.encouragementText, { color: t.text }]}
            >
              People like you typically see their first room transformed in just 1 session
            </Animated.Text>

            <Animated.View entering={FadeIn.delay(600).duration(400)} style={{ marginTop: 32 }}>
              <LoadingDots color={V1.coral} dotSize={10} />
            </Animated.View>
          </Pressable>
        );

      // ── Step 11: Commitment ──────────────────────────────────────────────
      case 11:
        return (
          <View style={styles.stepContent}>
            <Animated.Text
              entering={FadeInDown.duration(400).delay(100)}
              style={[styles.stepTitle, { color: t.text }]}
            >
              Can you commit to just{'\n'}5 minutes a day?
            </Animated.Text>

            <Animated.Text
              entering={FadeInDown.duration(400).delay(250)}
              style={[styles.stepSubhead, { color: t.textSecondary }]}
            >
              That's all it takes to build the habit
            </Animated.Text>

            <View style={{ flex: 1 }} />

            <Animated.View entering={FadeInDown.duration(400).delay(400)}>
              <CoralCTA
                label="Yes, I can do 5 minutes"
                onPress={() => {
                  setSelections((prev) => ({ ...prev, commitment: 'yes' }));
                  goNext();
                }}
              />
            </Animated.View>

            <Animated.View entering={FadeInDown.duration(400).delay(500)}>
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync();
                  setSelections((prev) => ({ ...prev, commitment: 'try' }));
                  goNext();
                }}
                style={styles.subtleLink}
                accessibilityRole="button"
                accessibilityLabel="I'll try"
              >
                <Text style={[styles.subtleLinkText, { color: t.textSecondary }]}>
                  I'll try
                </Text>
              </Pressable>
            </Animated.View>
          </View>
        );

      // ── Step 12: Meet Your Guide ─────────────────────────────────────────
      case 12: {
        // Auto-assign personality based on answers
        let autoPersonality: MascotPersonality = selections.guidePersonality;
        if (
          selections.emotionalImpact.includes('It drains my energy') ||
          selections.biggestStruggle === 'It stresses me out but I can\'t act'
        ) {
          autoPersonality = 'tidy';
        } else if (
          selections.biggestStruggle === 'I don\'t know where to start'
        ) {
          autoPersonality = 'spark';
        }

        return (
          <View style={styles.stepContent}>
            <Animated.View
              entering={FadeInDown.duration(500).delay(100)}
              style={styles.mascotWrap}
            >
              <View style={styles.glowContainer}>
                <LinearGradient
                  colors={[`${V1.coral}28`, `${V1.coralLight}14`, 'transparent']}
                  style={styles.mascotGlow}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                />
                <MascotAvatar imageKey="happy" size={130} showBackground={false} />
              </View>
            </Animated.View>

            <Animated.Text
              entering={FadeInDown.duration(500).delay(250)}
              style={[styles.stepTitle, { color: t.text, textAlign: 'center' }]}
            >
              Meet {selections.mascotName},{'\n'}your cleaning companion
            </Animated.Text>

            <Animated.Text
              entering={FadeInDown.duration(500).delay(400)}
              style={[styles.stepSubhead, { color: t.textSecondary, textAlign: 'center' }]}
            >
              {MASCOT_PERSONALITIES[autoPersonality].description}
            </Animated.Text>

            {/* Name input */}
            <Animated.View
              entering={FadeInDown.duration(500).delay(500)}
              style={styles.nameInputWrap}
            >
              <View
                style={[
                  styles.nameInput,
                  {
                    backgroundColor: t.card,
                    borderColor: t.border,
                  },
                ]}
              >
                <Text style={{ fontSize: 18, marginRight: 10, color: t.textMuted }}>
                  {MASCOT_PERSONALITIES[autoPersonality].emoji}
                </Text>
                <TextInput
                  style={[styles.nameInputText, { color: t.text }]}
                  value={selections.mascotName}
                  onChangeText={(text) =>
                    setSelections((prev) => ({ ...prev, mascotName: text }))
                  }
                  placeholder="Name your companion"
                  placeholderTextColor={t.textMuted}
                  autoCapitalize="words"
                  accessibilityLabel="Companion name"
                />
              </View>
              <Text style={[styles.helperText, { color: t.textMuted }]}>
                You can always change this later
              </Text>
            </Animated.View>

            <View style={{ flex: 1 }} />

            <Animated.View entering={FadeInDown.duration(500).delay(600)}>
              <CoralCTA
                label="Nice to meet you!"
                onPress={() => {
                  setSelections((prev) => ({
                    ...prev,
                    guidePersonality: autoPersonality,
                  }));
                  goNext();
                }}
                disabled={!selections.mascotName.trim()}
              />
            </Animated.View>
          </View>
        );
      }

      // ── Step 13: Loading/Processing (auto-advance) ───────────────────────
      case 13:
        return (
          <View style={[styles.centeredContent, { paddingTop: insets.top + 100 }]}>
            <Animated.Text
              entering={FadeInDown.duration(500).delay(100)}
              style={[styles.stepTitle, { color: t.text, textAlign: 'center' }]}
            >
              Creating your{'\n'}personalized plan...
            </Animated.Text>

            <View style={{ marginTop: 32 }}>
              <LoadingDots color={V1.coral} dotSize={12} gap={12} />
            </View>
          </View>
        );

      // ── Step 14: Your Profile Summary ────────────────────────────────────
      case 14: {
        const energyLabel =
          selections.energyLevel
            ? selections.energyLevel.charAt(0).toUpperCase() +
              selections.energyLevel.slice(1)
            : 'Not set';

        const worstRoomLabel =
          selections.worstRoom
            ? ROOM_OPTIONS.find((r) => r.type === selections.worstRoom)?.label ??
              selections.worstRoom
            : 'Not set';

        const timeLabel = selections.timeAvailability
          ? selections.timeAvailability >= 60
            ? '1 hour+'
            : `${selections.timeAvailability} min`
          : 'Not set';

        return (
          <View style={styles.stepContent}>
            <Animated.Text
              entering={FadeInDown.duration(400).delay(100)}
              style={[styles.stepTitle, { color: t.text, textAlign: 'center' }]}
            >
              Your Declutter Profile
            </Animated.Text>

            <Animated.View
              entering={FadeInDown.duration(400).delay(250)}
              style={[
                styles.profileCard,
                {
                  backgroundColor: t.card,
                  borderColor: t.border,
                },
              ]}
            >
              <ProfileRow
                label="Energy"
                value={`${ENERGY_EMOJIS[selections.energyLevel ?? 'moderate']} ${energyLabel}`}
                isDark={isDark}
              />
              <View style={[styles.divider, { backgroundColor: t.border }]} />
              <ProfileRow
                label="Focus room"
                value={worstRoomLabel}
                isDark={isDark}
              />
              <View style={[styles.divider, { backgroundColor: t.border }]} />
              <ProfileRow
                label="Time today"
                value={timeLabel}
                isDark={isDark}
              />
              <View style={[styles.divider, { backgroundColor: t.border }]} />
              <ProfileRow
                label="Your guide"
                value={`${MASCOT_PERSONALITIES[selections.guidePersonality].emoji} ${selections.mascotName}`}
                isDark={isDark}
              />
            </Animated.View>

            <View style={{ flex: 1 }} />

            <Animated.View entering={FadeInDown.duration(400).delay(500)}>
              <CoralCTA
                label="Looks good!"
                onPress={() => setStep(15)}
                loading={isCompleting}
              />
            </Animated.View>
          </View>
        );
      }

      // ── Step 15: Navigate to notification-permission (handled by useEffect)
      case 15:
        return (
          <View style={[styles.centeredContent, { paddingTop: insets.top + 100 }]}>
            <ActivityIndicator size="large" color={V1.coral} />
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

      <GestureDetector gesture={swipeGesture}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View
            key={step}
            entering={FadeInDown.duration(reducedMotion ? 120 : 300)}
            exiting={FadeOutUp.duration(reducedMotion ? 120 : 200)}
          >
            {renderStep()}
          </Animated.View>
        </ScrollView>
      </GestureDetector>
    </View>
  );
}

// ─── Profile Row ─────────────────────────────────────────────────────────────
function ProfileRow({
  label,
  value,
  isDark,
}: {
  label: string;
  value: string;
  isDark: boolean;
}) {
  const t = isDark ? V1.dark : V1.light;
  return (
    <View style={styles.profileRow}>
      <Text style={[styles.profileLabel, { color: t.textSecondary }]}>
        {label}
      </Text>
      <Text style={[styles.profileValue, { color: t.text }]}>{value}</Text>
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
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  progressBarContainer: {
    width: '100%',
  },
  progressBarTrack: {
    height: 5,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },

  // ── Content layouts ──
  centeredContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 60,
    gap: 16,
  },
  stepContent: {
    flex: 1,
    minHeight: 500,
    paddingTop: 20,
  },

  // ── Welcome ──
  mascotWrap: {
    alignSelf: 'center',
    marginBottom: 24,
  },
  glowContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mascotGlow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  welcomeActions: {
    width: '100%',
    gap: 16,
    marginTop: 36,
    paddingHorizontal: 0,
  },

  // ── Typography ──
  heroTitle: {
    fontSize: 32,
    fontWeight: '800',
    fontFamily: DISPLAY_FONT,
    letterSpacing: -1,
    textAlign: 'center',
    lineHeight: 40,
  },
  heroSubtitle: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    fontFamily: BODY_FONT,
    paddingHorizontal: 20,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: '800',
    fontFamily: DISPLAY_FONT,
    letterSpacing: -0.6,
    marginBottom: 12,
    lineHeight: 36,
  },
  stepSubhead: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: BODY_FONT,
    marginBottom: 24,
  },
  linkText: {
    fontSize: 14,
    textAlign: 'center',
    fontFamily: BODY_FONT,
  },
  helperText: {
    fontSize: 13,
    textAlign: 'center',
    fontFamily: BODY_FONT,
    marginTop: 10,
  },
  tapToContinue: {
    fontSize: 14,
    fontFamily: BODY_FONT,
    textAlign: 'center',
  },

  // ── Social proof ──
  socialProofTitle: {
    fontSize: 34,
    fontWeight: '800',
    fontFamily: DISPLAY_FONT,
    letterSpacing: -1,
    textAlign: 'center',
    marginBottom: 24,
  },
  socialProofStat: {
    fontSize: 18,
    lineHeight: 28,
    textAlign: 'center',
    fontFamily: BODY_FONT,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  socialProofBody: {
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: BODY_FONT,
    paddingHorizontal: 24,
  },

  // ── Encouragement ──
  encouragementText: {
    fontSize: 22,
    fontWeight: '700',
    fontFamily: DISPLAY_FONT,
    letterSpacing: -0.4,
    textAlign: 'center',
    lineHeight: 32,
    paddingHorizontal: 16,
    marginTop: 20,
  },

  // ── Options ──
  optionsColumn: {
    gap: 12,
    marginTop: 8,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  gridItem: {
    width: '47%',
  },

  // ── Pill button ──
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  pillLarge: {
    paddingVertical: 18,
  },
  pillEmoji: {
    fontSize: 24,
  },
  pillText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: BODY_FONT,
  },
  pillTextLarge: {
    fontSize: 16,
  },
  pillSubtitle: {
    fontSize: 13,
    fontFamily: BODY_FONT,
    marginTop: 2,
  },

  // ── Time grid ──
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
  },
  timeCard: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: 28,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeCardText: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: DISPLAY_FONT,
  },

  // ── CTA button ──
  ctaShadowWrap: {
    borderRadius: 28,
    ...CARD_SHADOW_LG,
    shadowColor: V1.coral,
    shadowOpacity: 0.25,
    marginBottom: 16,
  },
  ctaButton: {
    borderRadius: 28,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    fontFamily: BODY_FONT,
    letterSpacing: 0.3,
  },

  // ── Subtle link ──
  subtleLink: {
    alignItems: 'center',
    paddingVertical: 14,
    minHeight: 44,
    justifyContent: 'center',
  },
  subtleLinkText: {
    fontSize: 15,
    fontWeight: '500',
    fontFamily: BODY_FONT,
  },

  // ── Name input ──
  nameInputWrap: {
    marginTop: 24,
  },
  nameInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: 16,
    height: 56,
  },
  nameInputText: {
    flex: 1,
    fontSize: 16,
    fontFamily: BODY_FONT,
  },

  // ── Profile card ──
  profileCard: {
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: 20,
    marginTop: 8,
  },
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  profileLabel: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: BODY_FONT,
  },
  profileValue: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: BODY_FONT,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
});
