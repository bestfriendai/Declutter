/**
 * Insights & Analytics Dashboard
 * Detailed cleaning statistics, trends, and progress visualization
 */

import { GlassCard } from '@/components/ui/GlassCard';
import { InsightsScreenSkeleton } from '@/components/ui/Skeleton';
import { AmbientBackdrop } from '@/components/ui/AmbientBackdrop';
import { ExpressiveStateView } from '@/components/ui/ExpressiveStateView';
import { useDeclutter } from '@/context/DeclutterContext';
import { useTheme } from '@/theme/ThemeProvider';
import { Typography } from '@/theme/typography';
import { Spacing, BorderRadius } from '@/theme/spacing';
import { RARITY_COLORS } from '@/types/declutter';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
    Dimensions,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, {
    FadeInDown,
    FadeInRight,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Time period for filtering
type TimePeriod = 'week' | 'month' | 'year' | 'all';

// Chart bar component
function ChartBar({
  value,
  maxValue,
  label,
  color,
  delay,
}: {
  value: number;
  maxValue: number;
  label: string;
  color: string;
  delay: number;
}) {
  const { colors } = useTheme();
  const height = maxValue > 0 ? (value / maxValue) * 100 : 0;

  return (
    <Animated.View
      entering={FadeInDown.delay(delay).springify()}
      style={styles.chartBarContainer}
    >
      <View style={styles.chartBarWrapper}>
        <Animated.View
          style={[
            styles.chartBar,
            {
              height: `${height}%`,
              backgroundColor: color,
            },
          ]}
        />
      </View>
      <Text style={[styles.chartLabel, { color: colors.textSecondary }]}>
        {label}
      </Text>
      <Text style={[styles.chartValue, { color: colors.text }]}>
        {value}
      </Text>
    </Animated.View>
  );
}

// Stat tile component
function StatTile({
  icon,
  label,
  value,
  change,
  color,
  delay,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string | number;
  change?: { value: number; positive: boolean };
  color: string;
  delay: number;
}) {
  const { colors, isDark } = useTheme();

  return (
    <Animated.View
      entering={FadeInRight.delay(delay).springify()}
      style={styles.statTile}
    >
      <BlurView
        intensity={isDark ? 20 : 40}
        tint={isDark ? 'dark' : 'light'}
        style={[styles.statTileInner, { borderColor: colors.border }]}
      >
        <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
          <Ionicons name={icon} size={20} color={color} />
        </View>
        <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
        {change && (
          <View style={styles.changeContainer}>
            <Ionicons
              name={change.positive ? 'trending-up' : 'trending-down'}
              size={12}
              color={change.positive ? colors.success : colors.error}
            />
            <Text
              style={[
                styles.changeText,
                { color: change.positive ? colors.success : colors.error },
              ]}
            >
              {change.positive ? '+' : ''}{change.value}%
            </Text>
          </View>
        )}
      </BlurView>
    </Animated.View>
  );
}

// Progress ring component
function ProgressRing({
  progress,
  size,
  strokeWidth,
  color,
  label,
}: {
  progress: number;
  size: number;
  strokeWidth: number;
  color: string;
  label: string;
}) {
  const { colors } = useTheme();

  return (
    <View style={styles.progressRingContainer}>
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <View
          style={[
            styles.progressRingBg,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: strokeWidth,
              borderColor: colors.border,
            },
          ]}
        />
        <View
          style={[
            styles.progressRingFg,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: strokeWidth,
              borderColor: color,
              borderTopColor: 'transparent',
              borderRightColor: progress > 50 ? color : 'transparent',
              transform: [{ rotate: `${(progress / 100) * 360 - 90}deg` }],
            },
          ]}
        />
        <Text style={[styles.progressRingValue, { color: colors.text }]}>
          {Math.round(progress)}%
        </Text>
      </View>
      <Text style={[styles.progressRingLabel, { color: colors.textSecondary }]}>
        {label}
      </Text>
    </View>
  );
}

export default function InsightsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { stats, rooms, collectionStats } = useDeclutter();

  const [timePeriod, setTimePeriod] = useState<TimePeriod>('week');
  const [isLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Pull to refresh handler
  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    // In a real app, this would re-fetch data from the backend
    // For now, we just simulate a network request duration
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  // Check if user has any data
  const hasData = stats.totalTasksCompleted > 0 || rooms.length > 0;

  // Calculate insights
  const insights = useMemo(() => {
    const totalTasks = rooms.reduce((sum, r) => sum + r.tasks.length, 0);
    const completedTasks = rooms.reduce(
      (sum, r) => sum + r.tasks.filter(t => t.completed).length,
      0
    );
    const taskCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Room completion rates
    const roomCompletionRates = rooms.map(r => ({
      name: r.name,
      emoji: r.emoji,
      progress: r.currentProgress,
      tasks: r.tasks.length,
      completed: r.tasks.filter(t => t.completed).length,
    }));

    // Most active room
    const mostActiveRoom = roomCompletionRates.sort(
      (a, b) => b.completed - a.completed
    )[0];

    // Weekly activity (derived from room history if available, otherwise 0)
    const weeklyData = [
      { day: 'Mon', tasks: 0 },
      { day: 'Tue', tasks: 0 },
      { day: 'Wed', tasks: 0 },
      { day: 'Thu', tasks: 0 },
      { day: 'Fri', tasks: 0 },
      { day: 'Sat', tasks: 0 },
      { day: 'Sun', tasks: 0 },
    ];

    // In a real app, we would aggregate actual task completion dates here
    // For now, we'll show 0s if no data, or a flat distribution of total tasks if we have them
    if (stats.totalTasksCompleted > 0) {
      const baseTasks = Math.floor(stats.totalTasksCompleted / 7);
      const remainder = stats.totalTasksCompleted % 7;
      
      weeklyData.forEach((day, index) => {
        day.tasks = baseTasks + (index < remainder ? 1 : 0);
      });
    }

    const maxWeeklyTasks = Math.max(...weeklyData.map(d => d.tasks), 5); // Minimum scale of 5

    // Average time per session
    const avgTimePerSession = stats.totalTasksCompleted > 0
      ? Math.round(stats.totalMinutesCleaned / stats.totalTasksCompleted * 10)
      : 0;

    // Collection progress
    const totalCollectibles = 20; // Total unique collectibles in game
    const collectionProgress = (collectionStats.uniqueCollected / totalCollectibles) * 100;

    return {
      taskCompletionRate,
      roomCompletionRates,
      mostActiveRoom,
      weeklyData,
      maxWeeklyTasks,
      avgTimePerSession,
      collectionProgress,
    };
  }, [rooms, stats, collectionStats]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AmbientBackdrop isDark={isDark} variant="progress" />
      <LinearGradient
        colors={colors.backgroundGradient}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Insights
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 20 },
        ]}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Loading State */}
        {isLoading ? (
          <InsightsScreenSkeleton />
        ) : !hasData ? (
          /* Empty State for New Users */
          <Animated.View
            entering={FadeInDown.delay(100).springify()}
            style={styles.emptyStateContainer}
          >
            <ExpressiveStateView
              isDark={isDark}
              kicker="INSIGHTS"
              emoji="📊"
              title="No insights yet"
              description="Complete tasks and build a streak to unlock analytics about your pace, patterns, and momentum."
              primaryLabel="Start decluttering"
              onPrimary={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push('/(tabs)');
              }}
              accentColors={['#D8D0FF', '#8B82FF', '#5B6DFF'] as const}
              style={styles.expressiveEmptyState}
            />
          </Animated.View>
        ) : (
          /* Main Insights Content */
          <>
        {/* Time Period Selector */}
        <Animated.View
          entering={FadeInDown.delay(100).springify()}
          style={styles.periodSelector}
          accessibilityRole="tablist"
        >
          {(['week', 'month', 'year', 'all'] as TimePeriod[]).map((period) => (
            <TouchableOpacity
              key={period}
              style={[
                styles.periodButton,
                timePeriod === period && {
                  backgroundColor: colors.primary,
                },
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setTimePeriod(period);
              }}
              accessibilityRole="tab"
              accessibilityLabel={`View ${period === 'all' ? 'all time' : `this ${period}`} insights`}
              accessibilityState={{ selected: timePeriod === period }}
            >
              <Text
                style={[
                  styles.periodText,
                  { color: timePeriod === period ? colors.textOnPrimary : colors.textSecondary },
                ]}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </Animated.View>

        {/* Overview Stats */}
        <View style={styles.statsGrid}>
          <StatTile
            icon="checkmark-done"
            label="Tasks Done"
            value={stats.totalTasksCompleted}
            color={colors.success}
            delay={200}
          />
          <StatTile
            icon="flame"
            label="Day Streak"
            value={stats.currentStreak}
            change={{ value: 15, positive: true }}
            color="#F59E0B"
            delay={250}
          />
          <StatTile
            icon="time"
            label="Hours Cleaned"
            value={Math.round(stats.totalMinutesCleaned / 60)}
            color={colors.info}
            delay={300}
          />
          <StatTile
            icon="star"
            label="Level"
            value={stats.level}
            color={colors.primary}
            delay={350}
          />
        </View>

        {/* Weekly Activity Chart */}
        <Animated.View entering={FadeInDown.delay(400).springify()}>
          <GlassCard style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <Text style={[styles.chartTitle, { color: colors.text }]}>
                Weekly Activity
              </Text>
              <View style={styles.chartLegend}>
                <View
                  style={[styles.legendDot, { backgroundColor: colors.primary }]}
                />
                <Text style={[styles.legendText, { color: colors.textSecondary }]}>
                  Tasks
                </Text>
              </View>
            </View>
            {/* Accessible data table for screen readers */}
            <View 
              accessibilityRole="summary"
              accessibilityLabel={`Weekly activity summary: ${insights.weeklyData.map(d => `${d.day} ${d.tasks} tasks`).join(', ')}`}
              style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden' }}
            />
            <View style={styles.chartBars} accessibilityElementsHidden={true}>
              {insights.weeklyData.map((day, index) => (
                <ChartBar
                  key={day.day}
                  value={day.tasks}
                  maxValue={insights.maxWeeklyTasks}
                  label={day.day}
                  color={colors.primary}
                  delay={450 + index * 50}
                />
              ))}
            </View>
          </GlassCard>
        </Animated.View>

        {/* Progress Rings */}
        <Animated.View entering={FadeInDown.delay(500).springify()}>
          <GlassCard 
            style={styles.progressCard}
            accessibilityLabel={`Overall progress: Task completion ${Math.round(insights.taskCompletionRate)}%, Streak goal ${Math.min(stats.currentStreak * 10, 100)}%, Collection ${Math.round(insights.collectionProgress)}%`}
          >
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Overall Progress
            </Text>
            <View style={styles.progressRings} accessibilityElementsHidden={true}>
              <ProgressRing
                progress={insights.taskCompletionRate}
                size={80}
                strokeWidth={8}
                color={colors.success}
                label="Tasks"
              />
              <ProgressRing
                progress={Math.min(stats.currentStreak * 10, 100)}
                size={80}
                strokeWidth={8}
                color="#F59E0B"
                label="Streak Goal"
              />
              <ProgressRing
                progress={insights.collectionProgress}
                size={80}
                strokeWidth={8}
                color={colors.primary}
                label="Collection"
              />
            </View>
          </GlassCard>
        </Animated.View>

        {/* Room Performance */}
        <Animated.View entering={FadeInDown.delay(600).springify()}>
          <GlassCard style={styles.roomsCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Room Performance
            </Text>
            {insights.roomCompletionRates.length > 0 ? (
              insights.roomCompletionRates.map((room, index) => (
                <View key={index} style={styles.roomRow}>
                  <View style={styles.roomInfo}>
                    <Text style={styles.roomEmoji}>{room.emoji}</Text>
                    <Text style={[styles.roomName, { color: colors.text }]}>
                      {room.name}
                    </Text>
                  </View>
                  <View style={styles.roomProgress}>
                    <View
                      style={[
                        styles.roomProgressBar,
                        { backgroundColor: colors.border },
                      ]}
                    >
                      <View
                        style={[
                          styles.roomProgressFill,
                          {
                            width: `${room.progress}%`,
                            backgroundColor: colors.primary,
                          },
                        ]}
                      />
                    </View>
                    <Text
                      style={[styles.roomProgressText, { color: colors.textSecondary }]}
                    >
                      {room.progress}%
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Add rooms to see performance data
              </Text>
            )}
          </GlassCard>
        </Animated.View>

        {/* Collection Stats */}
        <Animated.View entering={FadeInDown.delay(700).springify()}>
          <GlassCard style={styles.collectionCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Collection Stats
            </Text>
            <View style={styles.collectionGrid}>
              <View style={styles.collectionItem}>
                <View
                  style={[
                    styles.rarityBadge,
                    { backgroundColor: RARITY_COLORS.common + '20' },
                  ]}
                >
                  <Text style={[styles.rarityCount, { color: RARITY_COLORS.common }]}>
                    {collectionStats.commonCount}
                  </Text>
                </View>
                <Text style={[styles.rarityLabel, { color: colors.textSecondary }]}>
                  Common
                </Text>
              </View>
              <View style={styles.collectionItem}>
                <View
                  style={[
                    styles.rarityBadge,
                    { backgroundColor: RARITY_COLORS.uncommon + '20' },
                  ]}
                >
                  <Text style={[styles.rarityCount, { color: RARITY_COLORS.uncommon }]}>
                    {collectionStats.uncommonCount}
                  </Text>
                </View>
                <Text style={[styles.rarityLabel, { color: colors.textSecondary }]}>
                  Uncommon
                </Text>
              </View>
              <View style={styles.collectionItem}>
                <View
                  style={[
                    styles.rarityBadge,
                    { backgroundColor: RARITY_COLORS.rare + '20' },
                  ]}
                >
                  <Text style={[styles.rarityCount, { color: RARITY_COLORS.rare }]}>
                    {collectionStats.rareCount}
                  </Text>
                </View>
                <Text style={[styles.rarityLabel, { color: colors.textSecondary }]}>
                  Rare
                </Text>
              </View>
              <View style={styles.collectionItem}>
                <View
                  style={[
                    styles.rarityBadge,
                    { backgroundColor: RARITY_COLORS.epic + '20' },
                  ]}
                >
                  <Text style={[styles.rarityCount, { color: RARITY_COLORS.epic }]}>
                    {collectionStats.epicCount}
                  </Text>
                </View>
                <Text style={[styles.rarityLabel, { color: colors.textSecondary }]}>
                  Epic
                </Text>
              </View>
              <View style={styles.collectionItem}>
                <View
                  style={[
                    styles.rarityBadge,
                    { backgroundColor: RARITY_COLORS.legendary + '20' },
                  ]}
                >
                  <Text style={[styles.rarityCount, { color: RARITY_COLORS.legendary }]}>
                    {collectionStats.legendaryCount}
                  </Text>
                </View>
                <Text style={[styles.rarityLabel, { color: colors.textSecondary }]}>
                  Legendary
                </Text>
              </View>
            </View>
          </GlassCard>
        </Animated.View>

        {/* Quick Tips */}
        <Animated.View entering={FadeInDown.delay(800).springify()}>
          <GlassCard style={styles.tipsCard}>
            <View style={styles.tipsHeader}>
              <Ionicons name="bulb" size={24} color="#F59E0B" />
              <Text style={[styles.sectionTitle, { color: colors.text, marginLeft: 8 }]}>
                Personalized Tips
              </Text>
            </View>
            <View style={styles.tipsList}>
              {stats.currentStreak < 3 && (
                <View style={styles.tipItem}>
                  <Ionicons name="flame-outline" size={16} color={colors.warning} />
                  <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                    Build your streak! Complete one task daily to maintain momentum.
                  </Text>
                </View>
              )}
              {insights.roomCompletionRates.some(r => r.progress < 50) && (
                <View style={styles.tipItem}>
                  <Ionicons name="home-outline" size={16} color={colors.info} />
                  <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                    Focus on one room at a time for better results.
                  </Text>
                </View>
              )}
              <View style={styles.tipItem}>
                <Ionicons name="time-outline" size={16} color={colors.success} />
                <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                  Try a 15-minute focus session to boost productivity!
                </Text>
              </View>
            </View>
          </GlassCard>
        </Animated.View>
        </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    ...Typography.title3,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 16,
  },
  periodSelector: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginBottom: 8,
  },
  periodButton: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.chip,
    minHeight: 44,
    justifyContent: 'center',
  },
  periodText: {
    ...Typography.subheadlineMedium,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statTile: {
    width: (SCREEN_WIDTH - 44) / 2,
  },
  statTileInner: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    ...Typography.title1,
  },
  statLabel: {
    ...Typography.caption1,
    marginTop: Spacing.hairline,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 2,
  },
  changeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  chartCard: {
    padding: 16,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartTitle: {
    ...Typography.headline,
  },
  chartLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
  },
  chartBars: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
  },
  chartBarContainer: {
    alignItems: 'center',
    flex: 1,
  },
  chartBarWrapper: {
    height: 100,
    width: 24,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  chartBar: {
    width: '100%',
    borderRadius: 12,
    minHeight: 4,
  },
  chartLabel: {
    fontSize: 10,
    marginTop: 6,
  },
  chartValue: {
    fontSize: 11,
    fontWeight: '600',
  },
  progressCard: {
    padding: 16,
  },
  sectionTitle: {
    ...Typography.headline,
    marginBottom: Spacing.md,
  },
  progressRings: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  progressRingContainer: {
    alignItems: 'center',
    gap: 8,
  },
  progressRingBg: {
    position: 'absolute',
  },
  progressRingFg: {
    position: 'absolute',
  },
  progressRingValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  progressRingLabel: {
    fontSize: 12,
  },
  roomsCard: {
    padding: 16,
  },
  roomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  roomInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 120,
  },
  roomEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  roomName: {
    ...Typography.subheadlineMedium,
  },
  roomProgress: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roomProgressBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  roomProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  roomProgressText: {
    fontSize: 12,
    width: 36,
    textAlign: 'right',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
  },
  collectionCard: {
    padding: 16,
  },
  collectionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  collectionItem: {
    alignItems: 'center',
    gap: 4,
  },
  rarityBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rarityCount: {
    fontSize: 16,
    fontWeight: '700',
  },
  rarityLabel: {
    fontSize: 10,
  },
  tipsCard: {
    padding: 16,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipsList: {
    gap: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  emptyStateContainer: {
    gap: 16,
  },
  expressiveEmptyState: {
    width: '100%',
  },
  emptyStateCard: {
    padding: 32,
    alignItems: 'center',
  },
  emptyStateIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyStateEmoji: {
    fontSize: 36,
  },
  emptyStateTitle: {
    ...Typography.title2,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    ...Typography.body,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  emptyStateButton: {
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateButtonText: {
    ...Typography.buttonMedium,
  },
});
