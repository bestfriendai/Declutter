/**
 * StreakCard -- Streak display with animated flame for streaks >= 3
 * Includes consistency score and today's progress dots.
 */

import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Flame, TrendingUp } from 'lucide-react-native';
import {
  V1,
  BODY_FONT,
  SPACING,
  cardStyle,
} from '@/constants/designTokens';
import type { ConsistencyResult } from '@/hooks/useConsistencyScore';

interface StreakCardProps {
  streak: number;
  todayDone: number;
  todayTotal: number;
  consistency?: ConsistencyResult;
  isDark: boolean;
  reducedMotion: boolean;
}

export function StreakCard({
  streak,
  todayDone,
  todayTotal,
  consistency,
  isDark,
  reducedMotion,
}: StreakCardProps) {
  const t = isDark ? V1.dark : V1.light;

  // Animated flame pulse for streaks >= 3
  const flameScale = useSharedValue(1);

  useEffect(() => {
    if (streak >= 3 && !reducedMotion) {
      flameScale.value = withRepeat(
        withSequence(
          withTiming(1.25, { duration: 600 }),
          withTiming(1, { duration: 600 }),
        ),
        -1,
      );
    }
  }, [streak, reducedMotion]);

  const flameAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: flameScale.value }],
  }));

  const dotsCount = Math.min(Math.max(todayTotal, 5), 5);

  return (
    <Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(80).duration(400)}>
      <View
        style={[
          styles.streakCard,
          cardStyle(isDark),
          isDark && { borderColor: 'rgba(255,107,107,0.12)' },
        ]}
      >
        <View style={styles.streakLeft}>
          <Animated.View style={streak >= 3 && !reducedMotion ? flameAnimatedStyle : undefined}>
            <Flame size={16} color={V1.coral} strokeWidth={2.5} />
          </Animated.View>
          <Text style={[styles.streakText, { color: t.text }]}>
            {streak} day streak
          </Text>
        </View>
        <View style={styles.streakRight}>
          {/* Consistency Score */}
          {consistency && (
            <View style={styles.consistencyBadge}>
              <TrendingUp size={12} color={V1.green} strokeWidth={2.5} />
              <Text style={[styles.consistencyText, { color: t.textSecondary }]}>
                {consistency.activeDays}/{consistency.windowDays}d
              </Text>
            </View>
          )}
          <Text style={[styles.streakProgress, { color: t.textSecondary }]}>
            {todayDone}/{Math.max(todayTotal, 5)} today
          </Text>
          <View style={styles.progressDots}>
            {Array.from({ length: dotsCount }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.progressDot,
                  {
                    backgroundColor:
                      i < todayDone
                        ? V1.coral
                        : isDark
                          ? 'rgba(255,255,255,0.15)'
                          : 'rgba(0,0,0,0.1)',
                  },
                ]}
              />
            ))}
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: SPACING.cardPadding,
    marginBottom: SPACING.cardPadding,
  },
  streakLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  streakText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: BODY_FONT,
  },
  streakRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  streakProgress: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: BODY_FONT,
  },
  progressDots: {
    flexDirection: 'row',
    gap: 4,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  consistencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginRight: 8,
  },
  consistencyText: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: BODY_FONT,
  },
});
