/**
 * Declutterly — App Entry / Splash Router
 * Handles auth state routing with a polished loading state
 */

import { Redirect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useDeclutter } from '@/context/DeclutterContext';
import { api } from '@/convex/_generated/api';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Typography } from '@/theme/typography';
import { Spacing } from '@/theme/spacing';
import { StatusBar } from 'expo-status-bar';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useQuery } from 'convex/react';

export default function Index() {
  const { isAuthenticated, isLoading, isAuthReady } = useAuth();
  const { user, isLoaded } = useDeclutter();
  const { colors, isDark } = useTheme();
  const cloudUser = useQuery(api.users.get, isAuthenticated ? {} : 'skip');
  const isResolvingCloudUser = isAuthenticated && cloudUser === undefined;
  const hasCompletedLocalOnboarding = !!user?.onboardingComplete;
  const hasCompletedCloudOnboarding = !!cloudUser?.onboardingComplete;
  const hasCompletedOnboarding =
    hasCompletedLocalOnboarding || hasCompletedCloudOnboarding;

  if (isLoading || !isLoaded || isResolvingCloudUser) {
    return (
      <View
        style={[styles.container, { backgroundColor: colors.background }]}
        accessibilityLabel="Loading Declutterly"
        accessibilityRole="none"
      >
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <Animated.View entering={FadeIn.duration(400)} style={styles.loadingContent}>
          <Text style={[styles.loadingEmoji]} accessibilityElementsHidden>
            {'🧹'}
          </Text>
          <ActivityIndicator
            size="small"
            color={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.25)'}
            style={styles.spinner}
            accessibilityLabel="Loading"
          />
          <Text style={[Typography.subheadline, { color: colors.textSecondary, textAlign: 'center' }]}>
            Getting your calm space ready...
          </Text>
        </Animated.View>
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
    gap: Spacing.md,
  },
  loadingEmoji: {
    fontSize: 48,
    marginBottom: Spacing.xs,
  },
  spinner: {
    marginVertical: Spacing.xs,
  },
});
