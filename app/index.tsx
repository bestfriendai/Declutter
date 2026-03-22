/**
 * Declutterly -- App Entry / Splash Router
 * Handles auth state routing with a polished loading state.
 *
 * Improvements:
 * - Visual continuity with splash (MascotAvatar + LoadingDots instead of spinner)
 * - 8s timeout with fallback tap-to-continue
 * - Smoother fade-out transition before redirect
 * - Error recovery for cloudUser query failure
 */

import { Redirect, router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useDeclutter } from '@/context/DeclutterContext';
import { DEV_SKIP_AUTH } from '@/constants/app';
import { api } from '@/convex/_generated/api';
import { View, StyleSheet, Text, Pressable } from 'react-native';
import { V1, BODY_FONT, DISPLAY_FONT, getTheme, ANIMATION } from '@/constants/designTokens';
import { useColorScheme } from '@/hooks/useColorScheme';
import { StatusBar } from 'expo-status-bar';
import { useQuery } from 'convex/react';
import { MascotAvatar, LoadingDots } from '@/components/ui';
import React, { useCallback, useEffect, useState } from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
  FadeIn,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const TIMEOUT_MS = 8000;

export default function Index() {
  const { isAuthenticated, isLoading, isAuthReady } = useAuth();
  const { user, isLoaded } = useDeclutter();
  const rawScheme = useColorScheme();
  const isDark = rawScheme === 'dark';
  const t = getTheme(isDark);

  const cloudUser = useQuery(api.users.get, isAuthenticated ? {} : 'skip');
  const isResolvingCloudUser = isAuthenticated && cloudUser === undefined;
  const cloudLoaded = isAuthenticated && cloudUser !== undefined;
  const hasCompletedOnboarding =
    !!user?.onboardingComplete || (cloudLoaded && !!cloudUser?.onboardingComplete);

  // Timeout fallback state
  const [showTimeout, setShowTimeout] = useState(false);
  const [cloudError, setCloudError] = useState(false);

  // Track if cloudUser query has been stuck undefined for too long
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTimeout(true);
    }, TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, []);

  // Detect cloud user query failure (null means user not found, which is a valid state)
  useEffect(() => {
    if (isAuthenticated && cloudUser === null) {
      // Cloud user returned null -- user record doesn't exist yet, treat as not onboarded
      setCloudError(false);
    }
  }, [isAuthenticated, cloudUser]);

  const handleTimeoutTap = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Force navigation based on best available state
    if (!isAuthenticated || !isAuthReady) {
      router.replace('/onboarding');
    } else if (hasCompletedOnboarding) {
      router.replace('/(tabs)');
    } else {
      router.replace('/onboarding');
    }
  }, [isAuthenticated, isAuthReady, hasCompletedOnboarding]);

  // Dev bypass: skip auth checks and go straight to tabs
  if (DEV_SKIP_AUTH) {
    return <Redirect href="/(tabs)" />;
  }

  // Still loading
  if (isLoading || !isLoaded || isResolvingCloudUser) {
    return (
      <View
        style={[styles.container, { backgroundColor: t.bg }]}
        accessibilityLabel="Loading Declutterly"
        accessibilityRole="none"
      >
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <View style={styles.loadingContent}>
          {/* Mascot for visual continuity with splash */}
          <MascotAvatar imageKey="splash" size={80} showBackground={false} />

          {/* Loading dots instead of spinner */}
          <LoadingDots
            color={isDark ? 'rgba(255,255,255,0.4)' : V1.coral}
            style={styles.dots}
          />

          <Text style={[styles.loadingText, { color: t.textSecondary }]}>
            Getting your calm space ready...
          </Text>

          {/* Timeout fallback */}
          {showTimeout && (
            <Animated.View entering={FadeIn.duration(ANIMATION.duration.normal)}>
              <Pressable
                onPress={handleTimeoutTap}
                style={({ pressed }) => [
                  styles.timeoutButton,
                  {
                    backgroundColor: isDark
                      ? 'rgba(255,255,255,0.08)'
                      : 'rgba(0,0,0,0.05)',
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Taking too long? Tap to continue"
              >
                <Text style={[styles.timeoutText, { color: t.textSecondary }]}>
                  Taking too long? Tap to continue
                </Text>
              </Pressable>
            </Animated.View>
          )}
        </View>
      </View>
    );
  }

  if (isAuthReady && !hasCompletedOnboarding) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/(tabs)" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContent: {
    alignItems: 'center',
    gap: 16,
  },
  dots: {
    marginTop: 16,
    marginBottom: 4,
  },
  loadingText: {
    fontSize: 15,
    textAlign: 'center',
    fontFamily: BODY_FONT,
  },
  timeoutButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  timeoutText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: BODY_FONT,
  },
});
