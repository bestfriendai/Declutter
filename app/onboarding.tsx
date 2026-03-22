/**
 * Declutterly -- Simplified Onboarding
 * 6-step flow: fast, warm/friendly tone, animated transitions.
 *
 * Steps:
 *  1. Welcome
 *  2. What's your name?
 *  3. Worst Room (creates first room)
 *  4. Meet Your Guide (pick mascot personality)
 *  5. Loading/Processing
 *  6. → Navigate to notification-permission
 */

import { MascotAvatar, LoadingDots } from '@/components/ui';
import { BODY_FONT, DISPLAY_FONT, V1, CARD_SHADOW_LG, CARD_SHADOW_SM, RADIUS, ANIMATION } from '@/constants/designTokens';
import { useAuth } from '@/context/AuthContext';
import { useDeclutter } from '@/context/DeclutterContext';
import { api } from '@/convex/_generated/api';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import {
  MASCOT_PERSONALITIES,
  MascotPersonality,
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
import React, { useCallback, useEffect, useRef, useState } from 'react';
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
const TOTAL_STEPS = 6;
const STORAGE_KEY = STORAGE_KEYS.ONBOARDING_PROGRESS;

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
  userName: string;
  worstRoom?: RoomType;
  mascotName: string;
  guidePersonality: MascotPersonality;
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
    userName: '',
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
    const personality = selections.guidePersonality;

    const baseUser: UserProfile = {
      id: user?.id ?? 'local-user',
      name: selections.userName.trim() || user?.name || 'Declutterer',
      avatar: user?.avatar,
      createdAt: user?.createdAt ?? new Date(),
      onboardingComplete: true,
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
          name: selections.userName.trim() || undefined,
          onboardingComplete: true,
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

    // Step 5: Loading auto-advance after 2.5s
    if (step === 5) {
      autoAdvanceTimer.current = setTimeout(() => {
        setStep(6);
      }, 2500);
    }

    return () => {
      if (autoAdvanceTimer.current) {
        clearTimeout(autoAdvanceTimer.current);
      }
    };
  }, [step]);

  // Step 6 triggers navigation to notification-permission
  useEffect(() => {
    if (step === 6) {
      completeOnboarding();
    }
  }, [step, completeOnboarding]);

  // ─── Step header (back + progress bar) ────────────────────────────────────
  const showHeader = step > 1 && step < 6;
  const showBack = step > 1 && step !== 5;

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

      // ── Step 2: What's your name? ────────────────────────────────────────
      case 2:
        return (
          <View style={styles.stepContent}>
            <Animated.Text
              entering={FadeInDown.duration(400).delay(100)}
              style={[styles.stepTitle, { color: t.text }]}
            >
              What should we call you?
            </Animated.Text>

            <Animated.View
              entering={FadeInDown.duration(400).delay(250)}
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
                <TextInput
                  style={[styles.nameInputText, { color: t.text }]}
                  value={selections.userName}
                  onChangeText={(text) =>
                    setSelections((prev) => ({ ...prev, userName: text }))
                  }
                  placeholder="Your name"
                  placeholderTextColor={t.textMuted}
                  autoCapitalize="words"
                  autoFocus
                  accessibilityLabel="Your name"
                />
              </View>
            </Animated.View>

            <View style={{ flex: 1 }} />

            <Animated.View entering={FadeInDown.duration(400).delay(400)}>
              <CoralCTA
                label="Continue"
                onPress={goNext}
                disabled={!selections.userName.trim()}
              />
            </Animated.View>
          </View>
        );

      // ── Step 3: Worst Room ───────────────────────────────────────────────
      case 3:
        return (
          <View style={styles.stepContent}>
            <Animated.Text
              entering={FadeInDown.duration(400).delay(100)}
              style={[styles.stepTitle, { color: t.text }]}
            >
              Which room stresses you out the most?
            </Animated.Text>

            <Animated.Text
              entering={FadeInDown.duration(400).delay(200)}
              style={[styles.stepSubhead, { color: t.textSecondary }]}
            >
              We'll start here
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

      // ── Step 4: Meet Your Guide (pick personality) ───────────────────────
      case 4: {
        const personalityKeys = Object.keys(MASCOT_PERSONALITIES) as MascotPersonality[];

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
              Pick your cleaning{'\n'}companion
            </Animated.Text>

            <Animated.View
              entering={FadeInDown.duration(500).delay(350)}
              style={styles.optionsColumn}
            >
              {personalityKeys.map((key) => {
                const p = MASCOT_PERSONALITIES[key];
                return (
                  <PillButton
                    key={key}
                    label={p.name}
                    subtitle={p.description}
                    emoji={p.emoji}
                    isSelected={selections.guidePersonality === key}
                    isDark={isDark}
                    large
                    onPress={() =>
                      setSelections((prev) => ({
                        ...prev,
                        guidePersonality: key,
                        mascotName: p.name,
                      }))
                    }
                  />
                );
              })}
            </Animated.View>

            <View style={{ flex: 1 }} />

            <Animated.View entering={FadeInDown.duration(500).delay(500)}>
              <CoralCTA
                label="Nice to meet you!"
                onPress={goNext}
              />
            </Animated.View>
          </View>
        );
      }

      // ── Step 5: Loading/Processing (auto-advance) ───────────────────────
      case 5:
        return (
          <View style={[styles.centeredContent, { paddingTop: insets.top + 100 }]}>
            <Animated.Text
              entering={FadeInDown.duration(500).delay(100)}
              style={[styles.stepTitle, { color: t.text, textAlign: 'center' }]}
            >
              Setting up your space...
            </Animated.Text>

            <View style={{ marginTop: 32 }}>
              <LoadingDots color={V1.coral} dotSize={12} gap={12} />
            </View>
          </View>
        );

      // ── Step 6: Navigate to notification-permission (handled by useEffect)
      case 6:
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

});
