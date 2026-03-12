/**
 * Declutterly — Progress Screen (Apple 2026)
 * Apple Fitness-style rings, animated weekly chart, badge cards
 */

import { Colors, ColorTokens, RingColors } from '@/constants/Colors';
import { GlassCard } from '@/components/ui/GlassCard';
import { useDeclutter } from '@/context/DeclutterContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Typography } from '@/theme/typography';
import { Spacing, BorderRadius } from '@/theme/spacing';
import { Badge } from '@/types/declutter';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useMemo } from 'react';
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
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// ─────────────────────────────────────────────────────────────────────────────
// Activity Ring Component — Apple Fitness style
// ─────────────────────────────────────────────────────────────────────────────
interface ActivityRingProps {
  progress: number; // 0-1
  color: string;
  trackColor: string;
  size: number;
  strokeWidth: number;
}

function ActivityRing({ progress, color, trackColor, size, strokeWidth }: ActivityRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedProgress = Math.min(progress, 1);

  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    animatedProgress.value = withDelay(300, withTiming(clampedProgress, { duration: 1200 }));
  }, [clampedProgress]);

  // We use a static SVG with the progress value directly for simplicity
  const strokeDashoffset = circumference * (1 - clampedProgress);

  return (
    <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
      {/* Track */}
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={trackColor}
        strokeWidth={strokeWidth}
        fill="none"
      />
      {/* Progress */}
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
      />
    </Svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Triple Activity Rings
// ─────────────────────────────────────────────────────────────────────────────
interface TripleRingsProps {
  tasksProgress: number;
  timeProgress: number;
  streakProgress: number;
  colors: ColorTokens;
  isDark: boolean;
}

function TripleRings({ tasksProgress, timeProgress, streakProgress, isDark }: TripleRingsProps) {
  const trackOpacity = isDark ? 0.15 : 0.12;
  const outerSize = 180;
  const middleSize = 140;
  const innerSize = 100;
  const strokeWidth = 16;

  return (
    <View style={styles.ringsContainer}>
      {/* Outer ring — Tasks */}
      <View style={styles.ringLayer}>
        <ActivityRing
          progress={tasksProgress}
          color={RingColors.tasks}
          trackColor={`rgba(255, 55, 95, ${trackOpacity})`}
          size={outerSize}
          strokeWidth={strokeWidth}
        />
      </View>
      {/* Middle ring — Time */}
      <View style={[styles.ringLayer, { position: 'absolute', top: (outerSize - middleSize) / 2, left: (outerSize - middleSize) / 2 }]}>
        <ActivityRing
          progress={timeProgress}
          color={RingColors.time}
          trackColor={`rgba(48, 209, 88, ${trackOpacity})`}
          size={middleSize}
          strokeWidth={strokeWidth}
        />
      </View>
      {/* Inner ring — Streak */}
      <View style={[styles.ringLayer, { position: 'absolute', top: (outerSize - innerSize) / 2, left: (outerSize - innerSize) / 2 }]}>
        <ActivityRing
          progress={streakProgress}
          color={RingColors.streak}
          trackColor={`rgba(10, 132, 255, ${trackOpacity})`}
          size={innerSize}
          strokeWidth={strokeWidth}
        />
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Weekly Bar Chart
// ─────────────────────────────────────────────────────────────────────────────
interface WeeklyChartProps {
  data: number[];
  maxValue: number;
  colors: ColorTokens;
  isDark: boolean;
}

function WeeklyChart({ data, maxValue, colors, isDark }: WeeklyChartProps) {
  const today = new Date().getDay(); // 0=Sun, 1=Mon...
  const todayIndex = today === 0 ? 6 : today - 1; // Convert to Mon=0

  return (
    <View style={styles.chartContainer}>
      {data.map((value, index) => {
        const isToday = index === todayIndex;
        const barHeight = maxValue > 0 ? (value / maxValue) * 80 : 0;

        return (
          <View key={index} style={styles.chartBar}>
            <View style={[styles.chartBarTrack, { backgroundColor: isDark ? colors.fillTertiary : colors.surfaceTertiary }]}>
              <Animated.View
                entering={FadeInDown.delay(index * 80).springify()}
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

// ─────────────────────────────────────────────────────────────────────────────
// Badge Card
// ─────────────────────────────────────────────────────────────────────────────
interface BadgeCardProps {
  badge: Badge;
  colors: ColorTokens;
  isDark: boolean;
}

function BadgeCard({ badge, colors }: BadgeCardProps) {
  const earned = !!badge.unlockedAt;

  return (
    <GlassCard
      variant={earned ? 'tinted' : 'subtle'}
      tintColor={earned ? colors.warning : undefined}
      tintOpacity={0.08}
      style={styles.badgeCard}
    >
      <View style={styles.badgeContent}>
        <Text style={[styles.badgeEmoji, { opacity: earned ? 1 : 0.4 }]}>
          {badge.emoji}
        </Text>
        <View style={styles.badgeInfo}>
          <Text style={[Typography.footnoteMedium, { color: earned ? colors.text : colors.textSecondary }]}>
            {badge.name}
          </Text>
          {earned && (
            <Text style={[Typography.caption2, { color: colors.warning }]}>Earned</Text>
          )}
        </View>
      </View>
    </GlassCard>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────
export default function ProgressScreen() {
  const rawScheme = useColorScheme();
  const colorScheme = rawScheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  const { stats, rooms } = useDeclutter();

  const streak = stats?.currentStreak ?? 0;
  const badges = stats?.badges ?? [];

  // Compute weekly data (tasks completed per day this week)
  const weeklyData = useMemo(() => {
    const data = [0, 0, 0, 0, 0, 0, 0];
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - ((now.getDay() + 6) % 7)); // Monday
    startOfWeek.setHours(0, 0, 0, 0);

    rooms.forEach(room => {
      room.tasks.forEach(task => {
        if (task.completed && task.completedAt) {
          const completedDate = new Date(task.completedAt);
          if (completedDate >= startOfWeek) {
            const dayIndex = (completedDate.getDay() + 6) % 7; // Mon=0
            data[dayIndex]++;
          }
        }
      });
    });

    return data;
  }, [rooms]);

  const weeklyMax = Math.max(...weeklyData, 1);
  const weeklyTotal = weeklyData.reduce((a, b) => a + b, 0);

  // Progress calculations
  const totalTasks = rooms.reduce((a, r) => a + r.tasks.length, 0);
  const completedTasks = rooms.reduce((a, r) => a + r.tasks.filter(t => t.completed).length, 0);
  const tasksGoal = Math.max(totalTasks, 10);
  const tasksProgress = tasksGoal > 0 ? completedTasks / tasksGoal : 0;

  const focusMinutes = stats?.totalMinutesCleaned ?? 0;
  const focusGoal = 120; // 2 hours/week goal
  const timeProgress = Math.min(focusMinutes / focusGoal, 1);

  const streakGoal = 7;
  const streakProgress = Math.min(streak / streakGoal, 1);

  const earnedBadges = (badges ?? []).filter((b: Badge) => !!b.unlockedAt);
  const pendingBadges = (badges ?? []).filter((b: Badge) => !b.unlockedAt).slice(0, 4);

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
        {/* ── Header ──────────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(0).springify()} style={styles.header}>
          <Text style={[Typography.largeTitle, { color: colors.text }]}>Progress</Text>
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/achievements'); }}
            accessibilityRole="button"
            accessibilityLabel="View all achievements"
          >
            <Text style={[Typography.subheadlineMedium, { color: colors.accent }]}>
              Achievements →
            </Text>
          </Pressable>
        </Animated.View>

        {/* ── Activity Rings ───────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(60).springify()}>
          <GlassCard variant="elevated" style={styles.ringsCard} showHighlight>
            <Text style={[Typography.title3, { color: colors.text, marginBottom: Spacing.ml }]}>
              This Week
            </Text>

            <View style={styles.ringsRow}>
              <TripleRings
                tasksProgress={tasksProgress}
                timeProgress={timeProgress}
                streakProgress={streakProgress}
                colors={colors}
                isDark={isDark}
              />

              {/* Ring Legend */}
              <View style={styles.ringsLegend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: RingColors.tasks }]} />
                  <View>
                    <Text style={[Typography.footnoteMedium, { color: colors.text }]}>Tasks</Text>
                    <Text style={[Typography.caption2, { color: colors.textSecondary }]}>
                      {completedTasks}/{tasksGoal}
                    </Text>
                  </View>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: RingColors.time }]} />
                  <View>
                    <Text style={[Typography.footnoteMedium, { color: colors.text }]}>Focus</Text>
                    <Text style={[Typography.caption2, { color: colors.textSecondary }]}>
                      {focusMinutes}/{focusGoal}m
                    </Text>
                  </View>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: RingColors.streak }]} />
                  <View>
                    <Text style={[Typography.footnoteMedium, { color: colors.text }]}>Streak</Text>
                    <Text style={[Typography.caption2, { color: colors.textSecondary }]}>
                      {streak}/{streakGoal} days
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </GlassCard>
        </Animated.View>

        {/* ── Weekly Chart ─────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(120).springify()} style={styles.section}>
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
          </GlassCard>
        </Animated.View>

        {/* ── Stats Grid ───────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(160).springify()} style={styles.section}>
          <Text style={[Typography.title3, { color: colors.text, marginBottom: Spacing.sm }]}>
            All Time
          </Text>
          <View style={styles.statsGrid}>
            {[
              { label: 'Tasks Done', value: completedTasks, emoji: '✅', color: colors.success },
              { label: 'Rooms Cleaned', value: rooms.filter(r => r.currentProgress >= 100).length, emoji: '🏠', color: colors.accent },
              { label: 'Focus Minutes', value: focusMinutes, emoji: '🎯', color: colors.warning },
              { label: 'Day Streak', value: streak, emoji: '🔥', color: colors.error },
              { label: 'Total XP', value: stats?.xp ?? 0, emoji: '⭐', color: '#FFD700' },
              { label: 'Badges', value: earnedBadges.length, emoji: '🏆', color: colors.warning },
            ].map((stat, index) => (
              <Animated.View
                key={stat.label}
                entering={FadeInDown.delay(160 + index * 50).springify()}
                style={[styles.statCard, {
                  backgroundColor: isDark ? colors.surface : colors.backgroundSecondary,
                  borderColor: isDark ? colors.cardBorder : colors.borderLight,
                }]}
              >
                <Text style={styles.statEmoji}>{stat.emoji}</Text>
                <Text style={[styles.statValue, { color: stat.color }]}>
                  {stat.value.toLocaleString()}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  {stat.label}
                </Text>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        {/* ── Badges ───────────────────────────────────────────────────── */}
        {(badges ?? []).length > 0 && (
          <Animated.View entering={FadeInDown.delay(240).springify()} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[Typography.title3, { color: colors.text }]}>
                Badges {earnedBadges.length > 0 && `(${earnedBadges.length})`}
              </Text>
              <Pressable
                onPress={() => router.push('/achievements')}
                accessibilityRole="button"
              >
                <Text style={[Typography.caption1Medium, { color: colors.accent }]}>See all</Text>
              </Pressable>
            </View>
            <View style={styles.badgesGrid}>
              {[...earnedBadges.slice(0, 2), ...pendingBadges.slice(0, 2)].map((badge, index) => (
                <Animated.View
                  key={badge.id}
                  entering={FadeInDown.delay(240 + index * 60).springify()}
                  style={{ width: (SCREEN_WIDTH - 52) / 2 }}
                >
                  <BadgeCard badge={badge} colors={colors} isDark={isDark} />
                </Animated.View>
              ))}
            </View>
          </Animated.View>
        )}

        {/* ── Streak Info ──────────────────────────────────────────────── */}
        {streak > 0 && (
          <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.section}>
            <LinearGradient
              colors={['#FF9F0A', '#FF6B00']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.streakCard}
            >
              <Text style={styles.streakCardEmoji}>🔥</Text>
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

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },

  // Rings
  ringsCard: { padding: Spacing.ml, marginBottom: Spacing.lg },
  ringsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ringsContainer: {
    width: 180,
    height: 180,
    position: 'relative',
  },
  ringLayer: {},
  ringsLegend: {
    flex: 1,
    paddingLeft: Spacing.ml,
    gap: Spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
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

  // Stats Grid
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
  statEmoji: { fontSize: 24 },
  statValue: {
    ...Typography.title3,
  },
  statLabel: {
    ...Typography.caption2,
    textAlign: 'center',
  },

  // Badges
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  badgeCard: { padding: Spacing.sm },
  badgeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  badgeEmoji: { fontSize: 28 },
  badgeInfo: { flex: 1, gap: 4 },
  badgeProgressBar: {
    height: 3,
    backgroundColor: 'rgba(120,120,128,0.2)',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 4,
  },
  badgeProgressFill: {
    height: '100%',
    borderRadius: 2,
  },

  // Streak Card
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.ml,
    borderRadius: BorderRadius.card,
    gap: Spacing.md,
  },
  streakCardEmoji: { fontSize: 40 },
  streakCardInfo: { flex: 1 },
});
