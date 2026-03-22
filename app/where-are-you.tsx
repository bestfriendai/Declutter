/**
 * Declutterly -- "Where Are You?" Fork Screen
 * Shows after paywall / trial start. Asks the user where they are
 * so we can route them to either scan their first room or set up templates.
 */

import { BODY_FONT, DISPLAY_FONT, V1, CARD_SHADOW_LG, RADIUS } from '@/constants/designTokens';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenErrorBoundary } from '@/components/ErrorBoundary';

// ─── Fork Card ───────────────────────────────────────────────────────────────
function ForkCard({
  emoji,
  title,
  subtitle,
  isDark,
  delay,
  onPress,
}: {
  emoji: string;
  title: string;
  subtitle: string;
  isDark: boolean;
  delay: number;
  onPress: () => void;
}) {
  const t = isDark ? V1.dark : V1.light;
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      entering={reducedMotion ? undefined : FadeInDown.delay(delay).duration(400)}
      style={animStyle}
    >
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onPress();
        }}
        onPressIn={() => {
          scale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 15, stiffness: 300 });
        }}
        accessibilityRole="button"
        accessibilityLabel={`${title}: ${subtitle}`}
        style={[
          styles.card,
          {
            backgroundColor: t.card,
            borderColor: t.border,
          },
          !isDark && CARD_SHADOW_LG,
        ]}
      >
        <Text style={styles.cardEmoji}>{emoji}</Text>
        <Text style={[styles.cardTitle, { color: t.text }]}>{title}</Text>
        <Text style={[styles.cardSubtitle, { color: t.textSecondary }]}>
          {subtitle}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────
export default function WhereAreYouScreen() {
  return (
    <ScreenErrorBoundary screenName="where-are-you">
      <WhereAreYouScreenContent />
    </ScreenErrorBoundary>
  );
}

function WhereAreYouScreenContent() {
  const { preselectedRoomType } = useLocalSearchParams<{ preselectedRoomType?: string }>();
  const rawScheme = useColorScheme();
  const isDark = rawScheme === 'dark';
  const t = isDark ? V1.dark : V1.light;
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();

  const handleHome = () => {
    router.replace({
      pathname: '/camera',
      params: preselectedRoomType ? { preselectedRoomType } : undefined,
    });
  };

  const handleNotHome = () => {
    router.replace('/(tabs)/rooms');
  };

  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <View
        style={[
          styles.content,
          {
            paddingTop: insets.top + 60,
            paddingBottom: insets.bottom + 24,
          },
        ]}
      >
        {/* Title */}
        <Animated.Text
          entering={
            reducedMotion ? undefined : FadeInDown.delay(100).duration(400)
          }
          style={[styles.title, { color: t.text }]}
        >
          Where are you{'\n'}right now?
        </Animated.Text>

        <Animated.Text
          entering={
            reducedMotion ? undefined : FadeInDown.delay(200).duration(400)
          }
          style={[styles.subtitle, { color: t.textSecondary }]}
        >
          This helps us set up your first experience
        </Animated.Text>

        {/* Cards */}
        <View style={styles.cardsContainer}>
          <ForkCard
            emoji={'\uD83C\uDFE0'}
            title="I'm home"
            subtitle="Let's scan your first room"
            isDark={isDark}
            delay={350}
            onPress={handleHome}
          />

          <ForkCard
            emoji={'\uD83D\uDEB6'}
            title="Not home yet"
            subtitle="Set up rooms from templates"
            isDark={isDark}
            delay={500}
            onPress={handleNotHome}
          />
        </View>
      </View>
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },

  // ── Text ──
  title: {
    fontSize: 32,
    fontWeight: '800',
    fontFamily: DISPLAY_FONT,
    letterSpacing: -1,
    textAlign: 'center',
    lineHeight: 40,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: BODY_FONT,
    textAlign: 'center',
    marginBottom: 40,
  },

  // ── Cards ──
  cardsContainer: {
    gap: 16,
  },
  card: {
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 8,
  },
  cardEmoji: {
    fontSize: 48,
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    fontFamily: DISPLAY_FONT,
    letterSpacing: -0.4,
  },
  cardSubtitle: {
    fontSize: 15,
    fontFamily: BODY_FONT,
    textAlign: 'center',
  },
});
