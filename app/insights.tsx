/**
 * Insights & Analytics Dashboard
 * Detailed cleaning statistics, trends, and progress visualization
 */

import { useSubscription } from '@/hooks/useSubscription';
import { useGetMotivation } from '@/hooks/useConvex';
import { AmbientBackdrop } from '@/components/ui/AmbientBackdrop';
import { ExpressiveStateView } from '@/components/ui/ExpressiveStateView';
import { InsightsScreenSkeleton } from '@/components/ui/Skeleton';
import { BODY_FONT, DISPLAY_FONT, RADIUS, V1, cardStyle, getTheme } from '@/constants/designTokens';
import { useDeclutter } from '@/context/DeclutterContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { RARITY_COLORS, COLLECTIBLES } from '@/types/declutter';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, router } from 'expo-router';
import type { LucideIcon } from 'lucide-react-native';
import { CheckCheck, ChevronLeft, Clock, Flame, Home, Lightbulb, Star, TrendingDown, TrendingUp } from 'lucide-react-native';
import Svg, { Circle as SvgCircle } from 'react-native-svg';
import { ScreenErrorBoundary } from '@/components/ErrorBoundary';
import React, { useCallback, useMemo, useState } from 'react';
import {
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
    useWindowDimensions,
} from 'react-native';
import Animated, {
    FadeInDown,
    FadeInRight,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// SCREEN_WIDTH now obtained via useWindowDimensions() inside components

// Time period for filtering
type TimePeriod = 'week' | 'month' | 'year' | 'all';

// Chart bar component
function ChartBar({
  value,
  maxValue,
  label,
  color,
  delay,
  isDark,
}: {
  value: number;
  maxValue: number;
  label: string;
  color: string;
  delay: number;
  isDark: boolean;
}) {
  const colors = getTheme(isDark);
  const reducedMotion = useReducedMotion();
  const height = maxValue > 0 ? (value / maxValue) * 100 : 0;

  return (
    <Animated.View
      entering={reducedMotion ? undefined : FadeInDown.delay(delay).duration(350)}
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
  isDark,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  change?: { value: number; positive: boolean };
  color: string;
  delay: number;
  isDark: boolean;
}) {
  const colors = getTheme(isDark);
  const reducedMotion = useReducedMotion();

  return (
    <Animated.View
      entering={reducedMotion ? undefined : FadeInRight.delay(delay).duration(350)}
      style={styles.statTile}
    >
      <BlurView
        intensity={isDark ? 20 : 40}
        tint={isDark ? 'dark' : 'light'}
        style={[styles.statTileInner, { borderColor: colors.border }]}
      >
        <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
          {React.createElement(icon, { size: 20, color: color })}
        </View>
        <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
        {change && (
          <View style={styles.changeContainer}>
            {change.positive ? <TrendingUp size={12} color={V1.green} /> : <TrendingDown size={12} color={V1.coral} />}
            <Text
              style={[
                styles.changeText,
                { color: change.positive ? V1.green : V1.coral },
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

// Progress ring component — uses SVG for accurate rendering at any progress %
function ProgressRing({
  progress,
  size,
  strokeWidth,
  color,
  label,
  isDark,
}: {
  progress: number;
  size: number;
  strokeWidth: number;
  color: string;
  label: string;
  isDark: boolean;
}) {
  const colors = getTheme(isDark);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedProgress = Math.max(0, Math.min(100, progress));
  const strokeDashoffset = circumference * (1 - clampedProgress / 100);

  return (
    <View style={styles.progressRingContainer}>
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }], position: 'absolute' }}>
          <SvgCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors.border}
            strokeWidth={strokeWidth}
            fill="none"
          />
          <SvgCircle
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

// ─── AI Insights Card (Premium-gated) ───────────────────────────────────────
function AIInsightsCard({ isDark, stats, insights, rooms }: {
  isDark: boolean;
  stats: any;
  insights: any;
  rooms: any[];
}) {
  const colors = getTheme(isDark);
  const { isPro } = useSubscription();
  const getMotivation = useGetMotivation();
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [hasAttempted, setHasAttempted] = useState(false);

  const handleGetInsight = useCallback(async () => {
    if (!isPro || isLoadingAI) return;
    setIsLoadingAI(true);
    try {
      const context = `User has completed ${stats?.totalTasksCompleted ?? 0} tasks across ${rooms.length} rooms. Level ${stats?.level ?? 1}. ${stats?.totalMinutesCleaned ?? 0} minutes cleaned total. Current streak: ${stats?.currentStreak ?? 0} days. Provide an encouraging insight about their progress patterns.`;
      const result = await getMotivation({
        context,
        currentStreak: stats?.currentStreak ?? 0,
      });
      if (result && typeof result === 'object' && 'message' in result) {
        setAiInsight((result as { message: string }).message);
      } else if (result && typeof result === 'string') {
        setAiInsight(result);
      }
    } catch {
      setAiInsight('Keep going! Your cleaning habits are building real momentum.');
    } finally {
      setIsLoadingAI(false);
      setHasAttempted(true);
    }
  }, [isPro, getMotivation, stats, rooms, isLoadingAI]);

  // Local insight generation (non-AI fallback)
  const localInsight = useMemo(() => {
    const streak = stats?.currentStreak ?? 0;
    const tasks = stats?.totalTasksCompleted ?? 0;
    const minutes = stats?.totalMinutesCleaned ?? 0;

    if (streak >= 7) return `Your ${streak}-day streak shows real consistency. That is the hardest part of building a habit.`;
    if (tasks > 50) return `${tasks} tasks completed! You have cleaned the equivalent of a small apartment several times over.`;
    if (minutes > 120) return `${Math.round(minutes / 60)} hours of cleaning logged. That is real, measurable progress.`;
    if (rooms.length >= 3) return `Maintaining ${rooms.length} rooms shows impressive organization. Focus on one at a time.`;
    return 'Your cleaning journey is just getting started. Every session builds the habit.';
  }, [stats, rooms]);

  return (
    <View style={[cardStyle(isDark), { padding: 20, position: 'relative', overflow: 'hidden' }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <Star size={18} color={V1.gold} />
        <Text style={[styles.sectionTitle, { marginBottom: 0, color: isDark ? 'rgba(255,255,255,0.21)' : 'rgba(0,0,0,0.25)' }]}>
          AI INSIGHTS
        </Text>
        {!isPro && (
          <View style={{ backgroundColor: V1.gold + '20', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginLeft: 'auto' }}>
            <Text style={{ fontSize: 10, fontWeight: '700', color: V1.gold, fontFamily: BODY_FONT }}>PRO</Text>
          </View>
        )}
      </View>

      {isPro ? (
        <>
          <Text style={[styles.tipText, { color: colors.text, fontSize: 15, lineHeight: 22, marginBottom: 8 }]}>
            {aiInsight ?? localInsight}
          </Text>
          {!hasAttempted && (
            <Pressable
              onPress={handleGetInsight}
              style={{
                backgroundColor: V1.indigo + '15',
                paddingVertical: 10,
                paddingHorizontal: 16,
                borderRadius: RADIUS.sm,
                alignItems: 'center',
              }}
              accessibilityRole="button"
              accessibilityLabel="Get AI-powered insight"
            >
              <Text style={{ fontFamily: BODY_FONT, fontSize: 14, fontWeight: '600', color: V1.indigo }}>
                {isLoadingAI ? 'Analyzing...' : 'Get AI Insight'}
              </Text>
            </Pressable>
          )}
        </>
      ) : (
        <>
          {/* Blurred preview for free users */}
          <Text style={[styles.tipText, {
            color: colors.textMuted,
            fontSize: 15,
            lineHeight: 22,
            marginBottom: 12,
          }]} numberOfLines={2}>
            {localInsight}
          </Text>
          <View style={{
            position: 'absolute', top: 50, left: 0, right: 0, bottom: 0,
            backgroundColor: isDark ? 'rgba(12,12,12,0.85)' : 'rgba(250,250,250,0.85)',
            alignItems: 'center', justifyContent: 'center',
            borderBottomLeftRadius: RADIUS.lg, borderBottomRightRadius: RADIUS.lg,
          }}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push('/paywall');
              }}
              style={{
                backgroundColor: V1.gold,
                paddingVertical: 10,
                paddingHorizontal: 20,
                borderRadius: RADIUS.pill,
              }}
              accessibilityRole="button"
              accessibilityLabel="Upgrade for AI insights"
            >
              <Text style={{ fontFamily: BODY_FONT, fontSize: 14, fontWeight: '700', color: '#FFFFFF' }}>
                Upgrade for AI Insights
              </Text>
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}

export default function InsightsScreen() {
  return (
    <ScreenErrorBoundary screenName="insights">
      <InsightsScreenContent />
    </ScreenErrorBoundary>
  );
}

function InsightsScreenContent() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const rawScheme = useColorScheme();
  const isDark = rawScheme === 'dark';
  const reducedMotion = useReducedMotion();
  const colors = getTheme(isDark);
  const { stats, rooms: rawRooms, collectionStats } = useDeclutter();
  const rooms = rawRooms ?? [];
  const { width: SCREEN_WIDTH } = useWindowDimensions();

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
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  // Check if user has any data
  const hasData = (stats?.totalTasksCompleted ?? 0) > 0 || rooms.length > 0;

  // Helper: get date range for time period filter
  const getDateRange = useCallback((period: TimePeriod): { start: Date; end: Date } => {
    const now = new Date();
    const end = now;
    let start: Date;
    switch (period) {
      case 'week': {
        start = new Date(now);
        start.setDate(start.getDate() - 7);
        break;
      }
      case 'month': {
        start = new Date(now);
        start.setMonth(start.getMonth() - 1);
        break;
      }
      case 'year': {
        start = new Date(now);
        start.setFullYear(start.getFullYear() - 1);
        break;
      }
      default:
        start = new Date(0); // all time
    }
    return { start, end };
  }, []);

  // Calculate insights — now filtered by time period
  const insights = useMemo(() => {
    const { start } = getDateRange(timePeriod);

    // Gather all completed tasks with their completedAt dates
    const allCompletedTasks: { completedAt: Date; task: any; roomName: string }[] = [];
    rooms.forEach(r => {
      (r.tasks ?? []).forEach(task => {
        if (task.completed && task.completedAt) {
          const completedDate = new Date(task.completedAt);
          allCompletedTasks.push({ completedAt: completedDate, task, roomName: r.name });
        }
      });
    });

    // Filter by time period
    const filteredCompleted = allCompletedTasks.filter(t => t.completedAt >= start);

    const totalTasks = rooms.reduce((sum, r) => sum + (r.tasks?.length ?? 0), 0);
    const completedTasks = filteredCompleted.length;
    const taskCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Room completion rates
    const roomCompletionRates = rooms.map(r => ({
      name: r.name,
      emoji: r.emoji,
      progress: r.currentProgress,
      tasks: (r.tasks?.length ?? 0),
      completed: (r.tasks ?? []).filter(t => {
        if (!t.completed || !t.completedAt) return false;
        return new Date(t.completedAt) >= start;
      }).length,
    }));

    // Most active room
    const mostActiveRoom = [...roomCompletionRates].sort(
      (a, b) => b.completed - a.completed
    )[0];

    // Weekly activity — use actual task completedAt dates
    const weeklyData = [
      { day: 'Mon', tasks: 0 },
      { day: 'Tue', tasks: 0 },
      { day: 'Wed', tasks: 0 },
      { day: 'Thu', tasks: 0 },
      { day: 'Fri', tasks: 0 },
      { day: 'Sat', tasks: 0 },
      { day: 'Sun', tasks: 0 },
    ];

    // Map JS getDay() (0=Sun..6=Sat) to our array (0=Mon..6=Sun)
    const dayMap: Record<number, number> = { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 0: 6 };

    // For week view, use last 7 days; for others, aggregate by day of week
    filteredCompleted.forEach(({ completedAt }) => {
      const dayIdx = dayMap[completedAt.getDay()] ?? 0;
      weeklyData[dayIdx].tasks++;
    });

    const maxWeeklyTasks = Math.max(...weeklyData.map(d => d.tasks), 5);

    // Average time per task
    const avgTimePerSession = completedTasks > 0
      ? Math.round((stats?.totalMinutesCleaned ?? 0) / (stats?.totalTasksCompleted ?? 1) * 10)
      : 0;

    // Collection progress - use actual COLLECTIBLES array length
    const totalCollectiblesCount = COLLECTIBLES?.filter((c: any) => !c.isSpecial)?.length ?? 20;
    const collectionProgress = totalCollectiblesCount > 0
      ? (collectionStats.uniqueCollected / totalCollectiblesCount) * 100
      : 0;

    // Period-specific stats for the stat tiles
    const periodTasksDone = completedTasks;
    const periodMinutes = filteredCompleted.reduce(
      (sum, t) => sum + (t.task.estimatedMinutes || 3), 0
    );

    return {
      taskCompletionRate,
      roomCompletionRates,
      mostActiveRoom,
      weeklyData,
      maxWeeklyTasks,
      avgTimePerSession,
      collectionProgress,
      periodTasksDone,
      periodMinutes,
    };
  }, [rooms, stats, collectionStats, timePeriod, getDateRange]);

  return (
    <LinearGradient
      colors={isDark ? ['#0A0A0A', '#131313', '#141414'] : ['#FAFAFA', '#F7F7F7', '#F5F5F5']}
      style={styles.container}
    >
      <AmbientBackdrop isDark={isDark} variant="progress" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable
          style={styles.backButton}
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
        >
          <ChevronLeft size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Insights
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { flexGrow: 1, paddingBottom: insets.bottom + 16 },
        ]}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={V1.coral}
            colors={[V1.coral]}
          />
        }
      >
        {/* Loading State */}
        {isLoading ? (
          <InsightsScreenSkeleton />
        ) : !hasData ? (
          /* Empty State for New Users */
          <Animated.View
            entering={reducedMotion ? undefined : FadeInDown.delay(100).duration(350)}
            style={styles.emptyStateContainer}
          >
            <ExpressiveStateView
              isDark={isDark}
              kicker="INSIGHTS"
              emoji="📊"
              title="Your patterns will appear here"
              description="After a few cleaning sessions, you will see your best days, peak times, and progress trends. Data makes the invisible visible."
              primaryLabel="Scan your first room"
              onPrimary={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
          entering={reducedMotion ? undefined : FadeInDown.delay(100).duration(350)}
          style={styles.periodSelector}
          accessibilityRole="tablist"
        >
          {(['week', 'month', 'year', 'all'] as TimePeriod[]).map((period) => (
            <Pressable
              key={period}
              style={[
                styles.periodButton,
                timePeriod === period && {
                  backgroundColor: V1.coral,
                },
              ]}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setTimePeriod(period);
              }}
              accessibilityRole="tab"
              accessibilityLabel={`View ${period === 'all' ? 'all time' : `this ${period}`} insights`}
              accessibilityState={{ selected: timePeriod === period }}
            >
              <Text
                style={[
                  styles.periodText,
                  { color: timePeriod === period ? '#FFFFFF' : colors.textSecondary },
                ]}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </Text>
            </Pressable>
          ))}
        </Animated.View>

        {/* Overview Stats */}
        <View style={styles.statsGrid}>
          <StatTile
            icon={CheckCheck}
            label={timePeriod === 'all' ? 'Tasks Done' : `Tasks (${timePeriod})`}
            value={timePeriod === 'all' ? (stats?.totalTasksCompleted ?? 0) : insights.periodTasksDone}
            color={V1.green}
            delay={200}
            isDark={isDark}
          />
          <StatTile
            icon={Flame}
            label="Day Streak"
            value={stats?.currentStreak ?? 0}
            color="#F59E0B"
            delay={250}
            isDark={isDark}
          />
          <StatTile
            icon={Clock}
            label={timePeriod === 'all' ? 'Hours Cleaned' : `Hours (${timePeriod})`}
            value={timePeriod === 'all'
              ? Math.round((stats?.totalMinutesCleaned ?? 0) / 60)
              : Math.round(insights.periodMinutes / 60)}
            color={V1.blue}
            delay={300}
            isDark={isDark}
          />
          <StatTile
            icon={Star}
            label="Level"
            value={stats?.level ?? 1}
            color={V1.coral}
            delay={350}
            isDark={isDark}
          />
        </View>

        {/* Weekly Activity Chart */}
        <Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(400).duration(350)}>
          <View style={[cardStyle(isDark), styles.chartCard]}>
            <View style={styles.chartHeader}>
              <Text style={[styles.chartTitle, { color: isDark ? 'rgba(255,255,255,0.21)' : 'rgba(0,0,0,0.25)' }]}>
                WEEKLY ACTIVITY
              </Text>
              <View style={styles.chartLegend}>
                <View
                  style={[styles.legendDot, { backgroundColor: V1.coral }]}
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
                  color={V1.coral}
                  delay={450 + index * 50}
                  isDark={isDark}
                />
              ))}
            </View>
          </View>
        </Animated.View>

        {/* Progress Rings */}
        <Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(500).duration(350)}>
          <View
            style={[cardStyle(isDark), styles.progressCard]}
            accessibilityLabel={`Overall progress: Task completion ${Math.round(insights.taskCompletionRate)}%, Streak goal ${Math.min((stats?.currentStreak ?? 0) * 10, 100)}%, Collection ${Math.round(insights.collectionProgress)}%`}
          >
            <Text style={[styles.sectionTitle, { color: isDark ? 'rgba(255,255,255,0.21)' : 'rgba(0,0,0,0.25)' }]}>
              OVERALL PROGRESS
            </Text>
            <View style={styles.progressRings} accessibilityElementsHidden={true}>
              <ProgressRing
                progress={insights.taskCompletionRate}
                size={80}
                strokeWidth={8}
                color={V1.green}
                label="Tasks"
                isDark={isDark}
              />
              <ProgressRing
                progress={Math.min((stats?.currentStreak ?? 0) * 10, 100)}
                size={80}
                strokeWidth={8}
                color="#F59E0B"
                label="Streak Goal"
                isDark={isDark}
              />
              <ProgressRing
                progress={insights.collectionProgress}
                size={80}
                strokeWidth={8}
                color={V1.coral}
                label="Collection"
                isDark={isDark}
              />
            </View>
          </View>
        </Animated.View>

        {/* Room Performance */}
        <Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(600).duration(350)}>
          <View style={[cardStyle(isDark), styles.roomsCard]}>
            <Text style={[styles.sectionTitle, { color: isDark ? 'rgba(255,255,255,0.21)' : 'rgba(0,0,0,0.25)' }]}>
              ROOM PERFORMANCE
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
                            backgroundColor: V1.coral,
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
          </View>
        </Animated.View>

        {/* Collection Stats */}
        <Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(700).duration(350)}>
          <View style={[cardStyle(isDark), styles.collectionCard]}>
            <Text style={[styles.sectionTitle, { color: isDark ? 'rgba(255,255,255,0.21)' : 'rgba(0,0,0,0.25)' }]}>
              COLLECTION STATS
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
          </View>
        </Animated.View>

        {/* AI Insights (Premium) */}
        <Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(750).duration(350)}>
          <AIInsightsCard
            isDark={isDark}
            stats={stats}
            insights={insights}
            rooms={rooms}
          />
        </Animated.View>

        {/* Quick Tips */}
        <Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(800).duration(350)}>
          <View style={[cardStyle(isDark), styles.tipsCard]}>
            <View style={styles.tipsHeader}>
              <Lightbulb size={24} color="#F59E0B" />
              <Text style={[styles.sectionTitle, { marginLeft: 8, color: isDark ? 'rgba(255,255,255,0.21)' : 'rgba(0,0,0,0.25)' }]}>
                PERSONALIZED TIPS
              </Text>
            </View>
            <View style={styles.tipsList}>
              {(stats?.currentStreak ?? 0) < 3 && (
                <View style={styles.tipItem}>
                  <Flame size={16} color={V1.amber} />
                  <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                    ADHD tip: Just do one tiny task today. Consistency beats intensity. Even 2 minutes counts.
                  </Text>
                </View>
              )}
              {(stats?.currentStreak ?? 0) >= 3 && (stats?.currentStreak ?? 0) < 7 && (
                <View style={styles.tipItem}>
                  <Flame size={16} color={V1.amber} />
                  <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                    {7 - (stats?.currentStreak ?? 0)} more days to a 7-day streak badge! You are building real momentum.
                  </Text>
                </View>
              )}
              {insights.roomCompletionRates.some(r => r.progress < 50) && (
                <View style={styles.tipItem}>
                  <Home size={16} color={V1.blue} />
                  <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                    ADHD-friendly approach: finish one room before starting the next. Visible progress keeps you motivated.
                  </Text>
                </View>
              )}
              <View style={styles.tipItem}>
                <Clock size={16} color={V1.green} />
                <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                  Try a 5-minute focus session if 25 feels too long. Short wins build confidence for longer ones.
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>
        </>
        )}
      </ScrollView>
    </LinearGradient>
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
    fontFamily: DISPLAY_FONT,
    fontSize: 20, fontWeight: '600', lineHeight: 25,
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
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: RADIUS.md,
    minHeight: 44,
    justifyContent: 'center',
  },
  periodText: {
    fontFamily: BODY_FONT,
    fontSize: 15, fontWeight: '500', lineHeight: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statTile: {
    flex: 1,
    minWidth: '45%',
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
    fontFamily: DISPLAY_FONT,
    fontSize: 28, fontWeight: '700', letterSpacing: -0.4, lineHeight: 34,
  },
  statLabel: {
    fontFamily: BODY_FONT,
    fontSize: 12, fontWeight: '400', lineHeight: 16,
    marginTop: 2,
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
    fontFamily: BODY_FONT,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
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
    backgroundColor: 'rgba(128,128,128,0.12)',
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
    fontFamily: BODY_FONT,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 16,
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
    fontFamily: BODY_FONT,
    fontSize: 15, fontWeight: '500', lineHeight: 20,
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
    fontFamily: DISPLAY_FONT,
    fontSize: 22, fontWeight: '700', letterSpacing: -0.4, lineHeight: 28,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontFamily: BODY_FONT,
    fontSize: 17, fontWeight: '400', lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyStateButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: RADIUS.md,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateButtonText: {
    fontFamily: BODY_FONT,
    fontSize: 16, fontWeight: '600', lineHeight: 21,
  },
});
