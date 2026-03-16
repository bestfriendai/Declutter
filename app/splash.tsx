/**
 * Declutterly Splash Screen
 * Premium loading screen shown briefly before the app shell loads.
 * ADHD-friendly: calm, dark, minimal with a gentle breathing animation.
 */

import React, { useEffect } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

const DISPLAY_FONT = 'Bricolage Grotesque';
const BODY_FONT = 'DM Sans';

export default function SplashScreen() {
  // Breathing dot animation
  const dotOpacity = useSharedValue(0.3);
  const dotScale = useSharedValue(0.85);
  const wordmarkOpacity = useSharedValue(0);
  const taglineOpacity = useSharedValue(0);

  useEffect(() => {
    // Fade in wordmark with slight stagger for tagline
    wordmarkOpacity.value = withTiming(1, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });
    taglineOpacity.value = withSequence(
      withTiming(0, { duration: 400 }),
      withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) })
    );

    // Gentle breathing loop on the dot
    dotOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.3, { duration: 1100, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );
    dotScale.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.72, { duration: 1100, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );

    // Navigate faster -- reduce wait time for ADHD brains that lose interest
    const timer = setTimeout(() => {
      router.replace('/');
    }, 1600);
    return () => clearTimeout(timer);
  }, [dotOpacity, dotScale, wordmarkOpacity, taglineOpacity]);

  const wordmarkStyle = useAnimatedStyle(() => ({
    opacity: wordmarkOpacity.value,
    transform: [{ translateY: (1 - wordmarkOpacity.value) * 12 }],
  }));

  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
    transform: [{ translateY: (1 - taglineOpacity.value) * 6 }],
  }));

  const dotStyle = useAnimatedStyle(() => ({
    opacity: dotOpacity.value,
    transform: [{ scale: dotScale.value }],
  }));

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0A0A0A', '#0D0D12', '#0A0A0A']}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Soft ambient glow */}
      <View style={styles.glowWrap} pointerEvents="none">
        <LinearGradient
          colors={['rgba(255,184,107,0.12)', 'transparent']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.glow}
        />
      </View>

      <Animated.View style={[styles.wordmarkWrap, wordmarkStyle]}>
        {/* App name */}
        <Text style={styles.appName}>Declutterly</Text>
        <Animated.Text style={[styles.tagline, taglineStyle]}>Calm space, clear mind.</Animated.Text>
      </Animated.View>

      {/* Breathing loading indicator */}
      <View style={styles.dotWrap}>
        <Animated.View style={[styles.dot, dotStyle]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  glow: {
    flex: 1,
  },
  wordmarkWrap: {
    alignItems: 'center',
    gap: 10,
  },
  appName: {
    fontFamily: DISPLAY_FONT,
    fontSize: 48,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -1.2,
  },
  tagline: {
    fontFamily: BODY_FONT,
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.38)',
    letterSpacing: 0.2,
  },
  dotWrap: {
    position: 'absolute',
    bottom: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(255,196,120,0.85)',
  },
});
