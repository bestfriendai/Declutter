/**
 * Declutterly — Progress Screen (Apple 2026)
 * Meaningful metrics: rooms improved, tasks this week, before/after placeholder
 * Simplified activity rings, this week vs last week comparison
 */

import { Colors, ColorTokens, RingColors } from '@/constants/Colors';
import { GlassCard } from '@/components/ui/GlassCard';
import { useDeclutter } from '@/context/DeclutterContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Typography } from '@/theme/typography';
import { Spacing, BorderRadius } from '@/theme/spacing';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import React, { useMemo } from 'react';
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  FadeInDown,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useReducedMotion } from '@/hooks/useReducedMotion';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Weekly Bar Chart
interface WeeklyChartProps {
  data: number[];
  maxValue: number;
  colors: ColorTokens;
  isDark: boolean;
}

function WeeklyChart({ data, maxValue, colors, isDark }: WeeklyChartProps) {
  const today = new Date().getDay();
  const todayIndex = today === 0 ? 6 : today - 1;
  const reducedMotion = useReducedMotion();

  return (
    <View style={styles.chartContainer}>
      {data.map((value, index) => {
        const isToday = index === todayIndex;
        const barHeight = maxValue > 0 ? (value / maxValue) * 80 : 0;

        return (
          <View key={index} style={styles.chartBar}>
            <View style={[styles.chartBarTrack, { backgroundColor: isDark ? colors.fillTertiary : colors.surfaceTertiary }]}>
              <Animated.View
                entering={reducedMotion ? undefined : FadeInDown.delay(index * 80).springify()}
                style={[
                  styles.chartBarFill,
                  {
                    height: `${Math.max(barHeight, value > 0 ? 8 : 0)}%`,
                    backgroundColor: isToday ? colors.accent : colors.success,
                    opacity: isToday ? 1 : 0.6,
                  },
                ]}
              />
            </View>
            <Text style={[styles.chartDayLabel, {
              color: isToday ? colors.accent : colors.textSecondary,
              fontWeight: isToday ? '700' : '400',
            }]}>
              {DAYS[index]}
            </Text>
            {value > 0 && (
              <Text style={[styles.chartValueLabel, { color: isToday ? colors.accent : colors.textTertiary }]}>
                {value}
              </Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

// Main Screen
export default function ProgressScreen() {
  const rawScheme = useColorScheme();
  const colorScheme = rawScheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();

  const { stats, rooms } = useDeclutter();

  const streak = stats?.currentStreak ?? 0;

  // Compute weekly data (tasks completed per day this week)
  const { weeklyData, lastWeekTotal } = useMemo(() => {
    const data = [0, 0, 0, 0, 0, 0, 0];
    let lastWeek = 0;
    const now = new Date();

    // This week start (Monday)
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    startOfWeek.setHours(0, 0, 0, 0);

    // Last week start
    const startOfLastWeek = new Date(startOfWeek);
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

    rooms.forEach(room => {
      room.tasks.forEach(task => {
        if (task.completed && task.completedAt) {
          const completedDate = new Date(task.completedAt);
          if (completedDate >= startOfWeek) {
            const dayIndex = (completedDate.getDay() + 6) % 7;
            data[dayIndex]++;
          } else if (completedDate >= startOfLastWeek && completedDate < startOfWeek) {
            lastWeek++;
          }
        }
      });
    });

    return { weeklyData: data, lastWeekTotal: lastWeek };
  }, [rooms]);

  const weeklyMax = Math.max(...weeklyData, 1);
  const weeklyTotal = weeklyData.reduce((a, b) => a + b, 0);

  // Meaningful metrics
  const completedTasks = rooms.reduce((a, r) => a + r.tasks.filter(t => t.completed).length, 0);
  const roomsImproved = rooms.filter(r => r.currentProgress > 0).length;
  const roomsComplete = rooms.filter(r => r.currentProgress >= 100).length;
  const focusMinutes = stats?.totalMinutesCleaned ?? 0;

  // Week comparison
  const weekDiff = weeklyTotal - lastWeekTotal;
  const weekComparisonText = weekDiff > 0
    ? `+${weekDiff} more than last week`
    : weekDiff < 0
      ? `${Math.abs(weekDiff)} fewer than last week`
      : 'Same as last week';
  const weekComparisonColor = weekDiff > 0 ? colors.success : weekDiff < 0 ? colors.warning : colors.textSecondary;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
      >
        {/* Header */}
        <Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(0).springify()} style={styles.header}>
          <Text style={[Typography.largeTitle, { color: colors.text }]} accessibilityRole="header">Progress</Text>
        </Animated.View>

        {/* Key Metrics — meaningful stats */}
        <Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(60).springify()} style={styles.section}>
          <View style={styles.statsGrid}>
            {[
              { label: 'Rooms Improved', value: roomsImproved, color: colors.accent },
              { label: 'Tasks This Week', value: weeklyTotal, color: colors.success },
              { label: 'Total Tasks Done', value: completedTasks, color: colors.warning },
              { label: 'Rooms Complete', value: roomsComplete, color: RingColors.tasks },
              { label: 'Focus Minutes', value: focusMinutes, color: RingColors.time },
              { label: 'Day Streak', value: streak, color: RingColors.streak },
            ].map((stat, index) => (
              <Animated.View
                key={stat.label}
                entering={reducedMotion ? undefined : FadeInDown.delay(60 + index * 50).springify()}
                style={[styles.statCard, {
                  backgroundColor: isDark ? colors.surface : colors.backgroundSecondary,
                  borderColor: isDark ? colors.cardBorder : colors.borderLight,
                }]}
              >
                <Text style={[styles.statValue, { color: stat.color }]}
                  accessibilityLabel={`${stat.value} ${stat.label}`}
                >
                  {stat.value.toLocaleString()}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  {stat.label}
                </Text>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        {/* Weekly Chart with comparison */}
        <Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(120).springify()} style={styles.section}>
          <GlassCard variant="flat" style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <Text style={[Typography.title3, { color: colors.text }]}>Daily Tasks</Text>
              <View style={[styles.weeklyBadge, { backgroundColor: colors.accentMuted }]}>
                <Text style={[Typography.caption1Medium, { color: colors.accent }]}>
                  {weeklyTotal} this week
                </Text>
              </View>
            </View>
            <WeeklyChart
              data={weeklyData}
              maxValue={weeklyMax}
              colors={colors}
              isDark={isDark}
            />
            {/* This week vs last week */}
            <View style={styles.weekComparison}>
              <Text style={[Typography.caption1, { color: weekComparisonColor }]}>
                {weekComparisonText}
              </Text>
            </View>
          </GlassCard>
        </Animated.View>

        {/* Before/After Photo Placeholder */}
        <Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(180).springify()} style={styles.section}>
          <GlassCard variant="subtle" style={styles.beforeAfterCard}>
            <View style={styles.beforeAfterContent}>
              <View style={[styles.beforeAfterIcon, { backgroundColor: isDark ? colors.fillTertiary : colors.surfaceTertiary }]}>
                <Text style={{ fontSize: 32 }} accessibilityElementsHidden>P</Text>
              </View>
              <Text style={[Typography.headline, { color: colors.text, marginTop: Spacing.sm }]}>
                Before & After
              </Text>
              <Text style={[Typography.subheadline, { color: colors.textSecondary, textAlign: 'center', marginTop: Spacing.xxs, lineHeight: 20 }]}>
                Take a progress photo to see how far you&apos;ve come!
              </Text>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  router.push('/camera');
                }}
                style={[styles.progressPhotoButton, { backgroundColor: colors.accentMuted }]}
                accessibilityRole="button"
                accessibilityLabel="Take a progress photo"
              >
                <Text style={[Typography.subheadlineMedium, { color: colors.accent }]}>
                  Take Progress Photo
                </Text>
              </Pressable>
            </View>
          </GlassCard>
        </Animated.View>

        {/* Streak Info */}
        {streak > 0 && (
          <Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(240).springify()} style={styles.section}>
            <LinearGradient
              colors={['#FF9F0A', '#FF6B00']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.streakCard}
            >
              <View style={styles.streakCardInfo}>
                <Text style={[Typography.title2, { color: '#FFFFFF' }]}>
                  {streak} Day Streak!
                </Text>
                <Text style={[Typography.subheadline, { color: 'rgba(255,255,255,0.85)' }]}>
                  {streak >= 7 ? 'You\'re on fire! Keep it up!' :
                   streak >= 3 ? `${7 - streak} more days for a week streak!` :
                   'Keep going to build your streak!'}
                </Text>
              </View>
            </LinearGradient>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.ml },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.ml,
  },

  section: { marginBottom: Spacing.lg },

  // Stats Grid — meaningful metrics
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    width: (SCREEN_WIDTH - 60) / 3,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 0.5,
    alignItems: 'center',
    gap: Spacing.xxs,
  },
  statValue: {
    ...Typography.title3,
  },
  statLabel: {
    ...Typography.caption2,
    textAlign: 'center',
  },

  // Chart
  chartCard: { padding: Spacing.ml },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.ml,
  },
  weeklyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 120,
    gap: 4,
  },
  chartBar: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  chartBarTrack: {
    width: '100%',
    height: 80,
    borderRadius: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  chartBarFill: {
    width: '100%',
    borderRadius: 6,
    minHeight: 4,
  },
  chartDayLabel: {
    fontSize: 10,
    fontWeight: '500',
  },
  chartValueLabel: {
    fontSize: 9,
    fontWeight: '600',
  },
  weekComparison: {
    marginTop: Spacing.sm,
    alignItems: 'center',
  },

  // Before/After placeholder
  beforeAfterCard: {
    padding: Spacing.lg,
  },
  beforeAfterContent: {
    alignItems: 'center',
  },
  beforeAfterIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressPhotoButton: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.button,
    minHeight: 44,
    justifyContent: 'center',
  },

  // Streak Card
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.ml,
    borderRadius: BorderRadius.card,
    gap: Spacing.md,
  },
  streakCardInfo: { flex: 1 },
});
