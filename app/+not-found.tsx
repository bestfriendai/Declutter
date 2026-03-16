/**
 * Declutterly — Not Found Screen
 * Friendly, on-brand 404 page with helpful navigation options
 */

import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Typography } from '@/theme/typography';
import { Spacing, BorderRadius } from '@/theme/spacing';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export default function NotFoundScreen() {
  const rawScheme = useColorScheme();
  const colorScheme = rawScheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();

  const entering = (delay: number) =>
    reducedMotion ? undefined : FadeInDown.delay(delay).duration(350);

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={styles.content}>
        <Animated.Text
          entering={reducedMotion ? undefined : FadeInUp.delay(100).duration(350)}
          style={styles.emoji}
        >
          {'🧹'}
        </Animated.Text>

        <Animated.Text
          entering={entering(200)}
          style={[styles.title, { color: colors.text }]}
        >
          Oops, too clean!
        </Animated.Text>

        <Animated.Text
          entering={entering(300)}
          style={[styles.subtitle, { color: colors.textSecondary }]}
        >
          This page got completely decluttered{'\n'}
          and now there is nothing here.
        </Animated.Text>

        <Animated.View entering={entering(400)} style={styles.actionsWrap}>
          <Pressable
            style={({ pressed }) => [
              styles.button,
              { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.replace('/(tabs)');
            }}
            accessibilityRole="button"
            accessibilityLabel="Go to home screen"
          >
            <Text style={[styles.buttonText, { color: colors.textOnPrimary }]}>
              Back to Home
            </Text>
          </Pressable>

          {router.canGoBack() && (
            <Pressable
              style={({ pressed }) => [
                styles.secondaryButton,
                {
                  borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)',
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.back();
              }}
              accessibilityRole="button"
              accessibilityLabel="Go back to the previous page"
            >
              <Text style={[styles.secondaryButtonText, { color: colors.textSecondary }]}>
                Go Back
              </Text>
            </Pressable>
          )}
        </Animated.View>

        <Animated.Text
          entering={entering(500)}
          style={[styles.hint, { color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.25)' }]}
        >
          If you keep ending up here, try restarting the app.
        </Animated.Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    maxWidth: 340,
  },
  emoji: {
    fontSize: 80,
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.displaySmall,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.bodyMedium,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  actionsWrap: {
    width: '100%',
    gap: 12,
    alignItems: 'center',
  },
  button: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    minWidth: 200,
    alignItems: 'center',
  },
  buttonText: {
    ...Typography.calloutMedium,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    minWidth: 200,
    alignItems: 'center',
    borderWidth: 1,
  },
  secondaryButtonText: {
    ...Typography.calloutMedium,
    fontWeight: '500',
  },
  hint: {
    marginTop: 32,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
  },
});
