/**
 * Declutterly — Not Found Screen
 * Friendly 404 page with navigation back to home
 */

import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Typography } from '@/theme/typography';
import { Spacing, BorderRadius } from '@/theme/spacing';
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
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();

  const entering = (delay: number) =>
    reducedMotion ? undefined : FadeInDown.delay(delay).springify();

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={styles.content}>
        <Animated.Text
          entering={reducedMotion ? undefined : FadeInUp.delay(100).springify()}
          style={[styles.emoji]}
        >
          {'🧹'}
        </Animated.Text>

        <Animated.Text
          entering={entering(200)}
          style={[styles.title, { color: colors.text }]}
        >
          Page Not Found
        </Animated.Text>

        <Animated.Text
          entering={entering(300)}
          style={[styles.subtitle, { color: colors.textSecondary }]}
        >
          Looks like this room got a little too decluttered.{'\n'}
          Let's get you back on track!
        </Animated.Text>

        <Animated.View entering={entering(400)}>
          <Pressable
            style={({ pressed }) => [
              styles.button,
              { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
            ]}
            onPress={() => router.replace('/(tabs)')}
          >
            <Text style={[styles.buttonText, { color: colors.textOnPrimary }]}>
              Back to Home
            </Text>
          </Pressable>
        </Animated.View>
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
});
