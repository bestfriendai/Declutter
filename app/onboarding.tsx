/**
 * Declutterly — Onboarding Screen (Apple 2026)
 * Paginated hero slides, animated progress dots, gradient CTAs
 */

import { Colors, ColorTokens } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Typography } from '@/theme/typography';
import { Spacing, BorderRadius } from '@/theme/spacing';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewToken,
} from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─────────────────────────────────────────────────────────────────────────────
// Slide Data
// ─────────────────────────────────────────────────────────────────────────────
const SLIDES = [
  {
    id: '1',
    emoji: '📸',
    title: 'Snap Any Room',
    subtitle: 'Take a photo of any messy space and our AI instantly creates a personalized decluttering plan.',
    gradient: ['#007AFF', '#5856D6'] as const,
    accentEmoji: '🤖',
    accentText: 'AI-powered analysis',
  },
  {
    id: '2',
    emoji: '✅',
    title: 'Task by Task',
    subtitle: 'Break overwhelming clutter into bite-sized tasks. Each small win builds momentum.',
    gradient: ['#30D158', '#25A244'] as const,
    accentEmoji: '⚡',
    accentText: 'Quick wins every day',
  },
  {
    id: '3',
    emoji: '🎯',
    title: 'Stay Focused',
    subtitle: 'Pomodoro timer keeps you in the zone. Your AI buddy cheers you on every step.',
    gradient: ['#667eea', '#764ba2'] as const,
    accentEmoji: '🧹',
    accentText: 'Your personal buddy',
  },
  {
    id: '4',
    emoji: '🏆',
    title: 'Level Up',
    subtitle: 'Earn XP, unlock badges, and watch your spaces transform. Decluttering has never been this rewarding.',
    gradient: ['#FF9F0A', '#FF6B00'] as const,
    accentEmoji: '🔥',
    accentText: 'Streaks & achievements',
  },
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// Slide Component
// ─────────────────────────────────────────────────────────────────────────────
interface SlideProps {
  item: typeof SLIDES[number];
  colors: ColorTokens;
  isDark: boolean;
}

function Slide({ item, colors, isDark }: SlideProps) {
  return (
    <View style={[styles.slide, { width: SCREEN_WIDTH }]} accessibilityRole="none">
      {/* Hero emoji */}
      <View style={styles.heroEmojiContainer}>
        <LinearGradient
          colors={item.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroEmojiBackground}
        >
          <Text style={styles.heroEmoji} accessibilityElementsHidden>{item.emoji}</Text>
        </LinearGradient>
      </View>

      {/* Text content */}
      <View style={styles.slideTextContent}>
        <Text
          style={[Typography.displaySmall, { color: colors.text, textAlign: 'center' }]}
          accessibilityRole="header"
        >
          {item.title}
        </Text>
        <Text style={[Typography.body, {
          color: colors.textSecondary,
          textAlign: 'center',
          marginTop: Spacing.sm,
          lineHeight: 24,
          paddingHorizontal: Spacing.xs,
        }]}>
          {item.subtitle}
        </Text>

        {/* Accent badge */}
        <View style={[styles.accentBadge, {
          backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
          borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
        }]}>
          <Text style={styles.accentBadgeEmoji} accessibilityElementsHidden>{item.accentEmoji}</Text>
          <Text style={[Typography.caption1Medium, { color: colors.textSecondary }]}>
            {item.accentText}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Progress Dots
// ─────────────────────────────────────────────────────────────────────────────
interface DotsProps {
  count: number;
  activeIndex: number;
  activeColor: string;
  inactiveColor: string;
}

function AnimatedDot({ isActive, activeColor, inactiveColor }: {
  isActive: boolean;
  activeColor: string;
  inactiveColor: string;
}) {
  const animatedStyle = useAnimatedStyle(() => ({
    width: withTiming(isActive ? 24 : 8, { duration: 250 }),
    backgroundColor: withTiming(isActive ? activeColor : inactiveColor, { duration: 250 }),
  }));

  return <Animated.View style={[styles.dot, animatedStyle]} />;
}

function ProgressDots({ count, activeIndex, activeColor, inactiveColor }: DotsProps) {
  return (
    <View style={styles.dotsRow} accessibilityRole="none" accessibilityLabel={`Page ${activeIndex + 1} of ${count}`}>
      {Array.from({ length: count }).map((_, i) => (
        <AnimatedDot
          key={i}
          isActive={i === activeIndex}
          activeColor={activeColor}
          inactiveColor={inactiveColor}
        />
      ))}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────
export default function OnboardingScreen() {
  const rawScheme = useColorScheme();
  const colorScheme = rawScheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const isLast = activeIndex === SLIDES.length - 1;
  const currentSlide = SLIDES[activeIndex];

  const handleViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setActiveIndex(viewableItems[0].index);
      }
    },
    []
  );

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const handleNext = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (activeIndex === SLIDES.length - 1) {
      router.replace('/auth/signup');
    } else {
      flatListRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
    }
  }, [activeIndex]);

  const handleSkip = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace('/auth/login');
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]} accessibilityLabel="Onboarding">
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Background gradient */}
      <LinearGradient
        colors={isDark
          ? ['#000000', '#0A0A14', '#000000']
          : ['#F2F2F7', '#FFFFFF', '#F2F2F7']}
        style={StyleSheet.absoluteFill}
      />

      {/* Skip button */}
      <View style={[styles.skipContainer, { paddingTop: insets.top + Spacing.sm }]}>
        {!isLast && (
          <Pressable
            onPress={handleSkip}
            style={[styles.skipButton, {
              backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
            }]}
            accessibilityRole="button"
            accessibilityLabel="Skip onboarding"
            hitSlop={8}
          >
            <Text style={[Typography.subheadlineMedium, { color: colors.textSecondary }]}>
              Skip
            </Text>
          </Pressable>
        )}
      </View>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={item => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        renderItem={({ item }) => (
          <Slide item={item} colors={colors} isDark={isDark} />
        )}
        style={styles.flatList}
        bounces={false}
        decelerationRate="fast"
        getItemLayout={(_data, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
      />

      {/* Bottom controls */}
      <View style={[styles.bottomControls, { paddingBottom: insets.bottom + Spacing.lg }]}>
        {/* Progress dots */}
        <ProgressDots
          count={SLIDES.length}
          activeIndex={activeIndex}
          activeColor={currentSlide.gradient[0]}
          inactiveColor={isDark ? 'rgba(255,255,255,0.20)' : 'rgba(0,0,0,0.15)'}
        />

        {/* CTA Button */}
        <Pressable
          onPress={handleNext}
          accessibilityRole="button"
          accessibilityLabel={isLast ? 'Get started' : 'Next slide'}
          accessibilityHint={isLast ? 'Creates your account' : 'Go to next onboarding slide'}
          style={({ pressed }) => [styles.ctaButton, { opacity: pressed ? 0.85 : 1 }]}
        >
          <LinearGradient
            colors={currentSlide.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.ctaGradient}
          >
            <Text style={[Typography.headline, { color: '#FFFFFF' }]}>
              {isLast ? 'Get Started' : 'Next'}
            </Text>
          </LinearGradient>
        </Pressable>

        {/* Sign in link */}
        {isLast && (
          <Animated.View entering={FadeInDown.springify()} style={styles.signInRow}>
            <Text style={[Typography.subheadline, { color: colors.textSecondary }]}>
              Already have an account?{' '}
            </Text>
            <Pressable
              onPress={handleSkip}
              accessibilityRole="button"
              accessibilityLabel="Sign in to existing account"
              hitSlop={8}
              style={styles.signInLink}
            >
              <Text style={[Typography.subheadlineMedium, { color: colors.accent }]}>
                Sign In
              </Text>
            </Pressable>
          </Animated.View>
        )}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },

  skipContainer: {
    position: 'absolute',
    top: 0,
    right: Spacing.ml,
    zIndex: 10,
  },
  skipButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xl,
    minHeight: 44,
    justifyContent: 'center',
  },

  flatList: {
    flex: 1,
  },

  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: 80,
    paddingBottom: 160,
  },

  heroEmojiContainer: {
    marginBottom: Spacing.xxl,
  },
  heroEmojiBackground: {
    width: 140,
    height: 140,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
  heroEmoji: {
    fontSize: 72,
  },

  slideTextContent: {
    alignItems: 'center',
  },

  accentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xxs + 2,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xl,
    borderWidth: 0.5,
    marginTop: Spacing.ml,
  },
  accentBadgeEmoji: { fontSize: 14 },

  bottomControls: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.ml,
    alignItems: 'center',
  },

  dotsRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },

  ctaButton: {
    width: '100%',
    borderRadius: BorderRadius.lg + 2,
    overflow: 'hidden',
    minHeight: 56,
  },
  ctaGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.lg + 2,
    minHeight: 56,
  },

  signInRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
  },
  signInLink: {
    minHeight: 44,
    justifyContent: 'center',
  },
});
