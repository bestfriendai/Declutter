/**
 * Declutterly Splash Screen (V1)
 * Matches Pencil design: BIEh1
 * Mascot centered, app name, tagline, 3 breathing dots.
 */

import React, { useEffect } from 'react';
import { useColorScheme } from '@/hooks/useColorScheme';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

// ─── V1 Color Palette ────────────────────────────────────────────────────────
const V1 = {
  coral: '#FF6B6B',
  dark: { bg: '#0C0C0C', text: '#FFFFFF', textMuted: 'rgba(255,255,255,0.35)' },
  light: { bg: '#FAFAFA', text: '#1A1A1A', textMuted: 'rgba(0,0,0,0.35)' },
};

function BreathingDot({ delay }: { delay: number; isDark: boolean }) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.3, { duration: 800, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        false
      )
    );
  }, [delay, opacity]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.dot,
        style,
        { backgroundColor: V1.coral },
      ]}
    />
  );
}

export default function SplashScreen() {
  const rawScheme = useColorScheme();
  const isDark = rawScheme === 'dark';
  const t = isDark ? V1.dark : V1.light;
  const insets = useSafeAreaInsets();

  const contentOpacity = useSharedValue(0);

  useEffect(() => {
    // Fade in
    contentOpacity.value = withTiming(1, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });

    // Navigate after brief delay
    const timer = setTimeout(() => {
      router.replace('/');
    }, 1600);
    return () => clearTimeout(timer);
  }, [contentOpacity]);

  const fadeStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: (1 - contentOpacity.value) * 16 }],
  }));

  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <Animated.View style={[styles.centerContent, fadeStyle]}>
        {/* Mascot circle */}
        <View style={[styles.mascotCircle, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}>
          <Text style={styles.mascotEmoji}>🐹</Text>
        </View>

        {/* App name */}
        <Text style={[styles.appName, { color: t.text }]}>Declutter</Text>

        {/* Tagline */}
        <Text style={[styles.tagline, { color: t.textMuted }]}>
          Organize your space, organize your mind
        </Text>
      </Animated.View>

      {/* 3 breathing dots */}
      <View style={[styles.dotsWrap, { bottom: insets.bottom + 48 }]}>
        <BreathingDot delay={0} isDark={isDark} />
        <BreathingDot delay={200} isDark={isDark} />
        <BreathingDot delay={400} isDark={isDark} />
      </View>
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
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  mascotEmoji: {
    fontSize: 52,
  },
  appName: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.8,
  },
  tagline: {
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
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
