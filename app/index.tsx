/**
 * Declutterly — App Entry / Splash Router
 * Handles auth state routing with a polished loading state
 */

import { Redirect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useDeclutter } from '@/context/DeclutterContext';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Typography } from '@/theme/typography';
import { Spacing } from '@/theme/spacing';
import { StatusBar } from 'expo-status-bar';
import Animated, { FadeIn } from 'react-native-reanimated';

export default function Index() {
  const { isAuthenticated, isLoading, isFirebaseReady } = useAuth();
  const { user } = useDeclutter();
  const { colors, isDark } = useTheme();

  if (isLoading) {
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
            size="large"
            color={colors.accent}
            style={styles.spinner}
            accessibilityLabel="Loading"
          />
          <Text style={[Typography.subheadline, { color: colors.textSecondary }]}>
            Loading your spaces...
          </Text>
        </Animated.View>
      </View>
    );
  }

  if (isFirebaseReady && !isAuthenticated) {
    return <Redirect href="/auth/login" />;
  }

  if (!user?.onboardingComplete) {
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
