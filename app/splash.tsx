/**
 * Declutterly Splash Screen (V1)
 * Matches Pencil design: BIEh1
 * Mascot centered, app name, tagline, 3 breathing dots.
 *
 * Improvements:
 * - Sequenced mascot + text animation (mascot bounces first, then text, then tagline)
 * - Haptic pulse on transition
 * - Dynamic tagline rotation (daily rotation)
 * - Accessibility improvements (accessibilityRole, live regions)
 */

import React, { useEffect, useMemo } from 'react';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { StyleSheet, Text, View } from 'react-native';
import { MascotAvatar, LoadingDots } from '@/components/ui';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { V1, BODY_FONT, DISPLAY_FONT, ANIMATION } from '@/constants/designTokens';

const TAGLINES = [
  'Organize your space, organize your mind',
  'Small steps, big change',
  'Cleaning made calm',
  'One tiny task at a time',
  'Your space, your pace',
  'Less mess, less stress',
  'Tidy space, clear head',
];

function getDailyTagline(): string {
  // Rotate based on day of year so it changes daily but stays consistent within a day
  const now = new Date();
  const dayOfYear = Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000,
  );
  return TAGLINES[dayOfYear % TAGLINES.length];
}

export default function SplashScreen() {
  const rawScheme = useColorScheme();
  const isDark = rawScheme === 'dark';
  const t = isDark ? V1.dark : V1.light;
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();

  const tagline = useMemo(() => getDailyTagline(), []);

  // Sequenced animation values
  const mascotScale = useSharedValue(reducedMotion ? 1 : 0.5);
  const mascotOpacity = useSharedValue(reducedMotion ? 1 : 0);
  const titleOpacity = useSharedValue(reducedMotion ? 1 : 0);
  const titleTranslateY = useSharedValue(reducedMotion ? 0 : 12);
  const taglineOpacity = useSharedValue(reducedMotion ? 1 : 0);
  const taglineTranslateY = useSharedValue(reducedMotion ? 0 : 10);
  const dotsOpacity = useSharedValue(reducedMotion ? 1 : 0);

  useEffect(() => {
    if (!reducedMotion) {
      // 1. Mascot bounces in first
      mascotOpacity.value = withTiming(1, {
        duration: ANIMATION.duration.normal,
        easing: Easing.out(Easing.cubic),
      });
      mascotScale.value = withSequence(
        withTiming(1.08, { duration: 400, easing: Easing.out(Easing.back(2)) }),
        withSpring(1, ANIMATION.spring.gentle),
      );

      // 2. Title fades in after mascot
      titleOpacity.value = withDelay(
        350,
        withTiming(1, { duration: ANIMATION.duration.normal, easing: Easing.out(Easing.cubic) }),
      );
      titleTranslateY.value = withDelay(
        350,
        withTiming(0, { duration: ANIMATION.duration.normal, easing: Easing.out(Easing.cubic) }),
      );

      // 3. Tagline fades in after title
      taglineOpacity.value = withDelay(
        600,
        withTiming(1, { duration: ANIMATION.duration.normal, easing: Easing.out(Easing.cubic) }),
      );
      taglineTranslateY.value = withDelay(
        600,
        withTiming(0, { duration: ANIMATION.duration.normal, easing: Easing.out(Easing.cubic) }),
      );

      // 4. Dots appear last
      dotsOpacity.value = withDelay(
        800,
        withTiming(1, { duration: ANIMATION.duration.fast }),
      );
    }

    // Navigate after brief delay with haptic pulse
    const timer = setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      router.replace('/');
    }, reducedMotion ? 800 : 1800);
    return () => clearTimeout(timer);
  }, [
    reducedMotion,
    mascotScale,
    mascotOpacity,
    titleOpacity,
    titleTranslateY,
    taglineOpacity,
    taglineTranslateY,
    dotsOpacity,
  ]);

  const mascotStyle = useAnimatedStyle(() => ({
    opacity: mascotOpacity.value,
    transform: [{ scale: mascotScale.value }],
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
    transform: [{ translateY: taglineTranslateY.value }],
  }));

  const dotsStyle = useAnimatedStyle(() => ({
    opacity: dotsOpacity.value,
  }));

  return (
    <View
      style={[styles.container, { backgroundColor: t.bg }]}
      accessibilityRole="none"
      accessibilityLabel="Declutterly is loading"
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <View style={styles.centerContent}>
        {/* Mascot */}
        <Animated.View
          style={[styles.mascotCircle, mascotStyle]}
          accessibilityElementsHidden
        >
          <MascotAvatar imageKey="splash" size={130} showBackground={false} />
        </Animated.View>

        {/* App name */}
        <Animated.Text
          style={[styles.appName, { color: t.text }, titleStyle]}
          accessibilityRole="header"
        >
          Declutter
        </Animated.Text>

        {/* Tagline */}
        <Animated.Text
          style={[styles.tagline, { color: t.textMuted }, taglineStyle]}
          accessibilityLiveRegion="polite"
        >
          {tagline}
        </Animated.Text>
      </View>

      {/* 3 breathing dots */}
      <Animated.View style={[styles.dotsWrap, { bottom: insets.bottom + 48 }, dotsStyle]}>
        <LoadingDots color={V1.coral} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContent: {
    alignItems: 'center',
    gap: 16,
  },
  mascotCircle: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  appName: {
    fontFamily: DISPLAY_FONT,
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.8,
  },
  tagline: {
    fontFamily: BODY_FONT,
    fontSize: 14,
    letterSpacing: 0.2,
  },
  dotsWrap: {
    position: 'absolute',
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
