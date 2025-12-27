/**
 * Declutterly - Progress Screen
 * Apple Fitness + Apple TV style progress tracking
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  useColorScheme,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeInRight,
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { Colors, RingColors } from '@/constants/Colors';
import { Typography } from '@/theme/typography';
import { useDeclutter } from '@/context/DeclutterContext';
import { BADGES, Badge } from '@/types/declutter';
import { DeclutterRings } from '@/components/ui/ActivityRings';
import { StatCard } from '@/components/ui/StatCard';
import { GlassCard } from '@/components/ui/GlassCard';
import { ContentRow } from '@/components/ui/ContentRow';
import { useCardPress } from '@/hooks/useAnimatedPress';
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function ProgressScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const { stats, rooms } = useDeclutter();

  // Calculate progress metrics
  const xpProgress = (stats.xp % 100);

  // Ring calculations (0-100)
  const tasksProgress = Math.min(100, stats.totalTasksCompleted * 5);
  const timeProgress = Math.min(100, (stats.totalMinutesCleaned / 60) * 10);
  const streakProgress = Math.min(100, stats.currentStreak * 14.28); // 7 days = 100%

  // Get badges
  const unlockedBadges = stats.badges;
  const lockedBadges = BADGES.filter(
    b => !unlockedBadges.some(ub => ub.id === b.id)
  );

  // Calculate time spent
  const hours = Math.floor(stats.totalMinutesCleaned / 60);
  const minutes = stats.totalMinutesCleaned % 60;
  const timeString = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

  // Generate weekly activity data
  const weeklyData = useMemo(() => {
    const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    const today = new Date().getDay();
    const adjustedToday = today === 0 ? 6 : today - 1;

    return days.map((day, index) => {
      let value = 0;
      if (index <= adjustedToday && stats.currentStreak > 0) {
        const daysFromToday = adjustedToday - index;
        if (daysFromToday < stats.currentStreak) {
          value = Math.max(20, Math.min(100, stats.totalTasksCompleted * 5 - daysFromToday * 10));
        }
      }
      return {
        day,
        value: Math.max(0, value),
        isToday: index === adjustedToday,
      };
    });
  }, [stats.currentStreak, stats.totalTasksCompleted]);

  const maxWeeklyValue = Math.max(...weeklyData.map(d => d.value), 1);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View
          entering={FadeInDown.delay(100).springify()}
          style={styles.header}
        >
          <Text style={[Typography.largeTitle, { color: colors.text }]}>
            Progress
          </Text>
          <Text style={[Typography.subheadline, { color: colors.textSecondary, marginTop: 4 }]}>
            Your decluttering journey
          </Text>
        </Animated.View>

        {/* Activity Rings Hero Section */}
        <Animated.View
          entering={FadeInDown.delay(200).springify()}
          style={styles.ringsSection}
        >
          <GlassCard variant="hero" style={styles.ringsCard}>
            <View style={styles.ringsContent}>
              <DeclutterRings
                tasksProgress={tasksProgress}
                timeProgress={timeProgress}
                streakProgress={streakProgress}
                size={180}
              />

              <View style={styles.ringsLegend}>
                <RingLegendItem
                  color={RingColors.tasks}
                  label="Tasks"
                  value={`${Math.round(tasksProgress)}%`}
                  description={`${stats.totalTasksCompleted} completed`}
                />
                <RingLegendItem
                  color={RingColors.time}
                  label="Time"
                  value={`${Math.round(timeProgress)}%`}
                  description={timeString}
                />
                <RingLegendItem
                  color={RingColors.streak}
                  label="Streak"
                  value={`${Math.round(streakProgress)}%`}
                  description={`${stats.currentStreak} days`}
                />
              </View>
            </View>
          </GlassCard>
        </Animated.View>

        {/* Level Progress */}
        <Animated.View
          entering={FadeInDown.delay(300).springify()}
          style={styles.levelSection}
        >
          <GlassCard style={styles.levelCard}>
            <View style={styles.levelContent}>
              <View style={styles.levelBadge}>
                <LinearGradient
                  colors={[...colors.gradientPrimary]}
                  style={styles.levelBadgeGradient}
                >
                  <Text style={styles.levelNumber}>{stats.level}</Text>
                </LinearGradient>
              </View>
              <View style={styles.levelInfo}>
                <Text style={[Typography.headline, { color: colors.text }]}>
                  Level {stats.level}
                </Text>
                <Text style={[Typography.caption1, { color: colors.textSecondary, marginTop: 2 }]}>
                  {xpProgress} / 100 XP to Level {stats.level + 1}
                </Text>
                <View style={styles.xpBarContainer}>
                  <View style={[styles.xpBarBg, { backgroundColor: colors.surfaceSecondary }]}>
                    <Animated.View
                      style={[
                        styles.xpBarFill,
                        { width: `${xpProgress}%` },
                      ]}
                    >
                      <LinearGradient
                        colors={[...colors.gradientPrimary]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={StyleSheet.absoluteFill}
                      />
                    </Animated.View>
                  </View>
                </View>
              </View>
            </View>
          </GlassCard>
        </Animated.View>

        {/* Weekly Activity Chart */}
        <Animated.View
          entering={FadeInDown.delay(400).springify()}
          style={styles.weeklySection}
        >
          <Text style={[Typography.title3, { color: colors.text, marginBottom: 12, paddingHorizontal: 20 }]}>
            This Week
          </Text>
          <GlassCard style={styles.weeklyCard}>
            <View style={styles.weeklyChart}>
              {weeklyData.map((item, index) => (
                <WeeklyBarItem
                  key={index}
                  day={item.day}
                  value={item.value}
                  maxValue={maxWeeklyValue}
                  isToday={item.isToday}
                  delay={index * 50}
                  colors={colors}
                />
              ))}
            </View>
            {stats.currentStreak > 0 && (
              <View style={[styles.streakBanner, { backgroundColor: 'rgba(251, 146, 60, 0.15)' }]}>
                <Text style={styles.streakEmoji}>🔥</Text>
                <Text style={[Typography.subheadlineMedium, { color: '#FB923C' }]}>
                  {stats.currentStreak} day streak! Keep it going!
                </Text>
              </View>
            )}
          </GlassCard>
        </Animated.View>

        {/* Statistics Bento Grid */}
        <Animated.View
          entering={FadeInDown.delay(500).springify()}
          style={styles.statsSection}
        >
          <Text style={[Typography.title3, { color: colors.text, marginBottom: 12, paddingHorizontal: 20 }]}>
            Statistics
          </Text>
          <View style={styles.bentoContainer}>
            <View style={styles.bentoRow}>
              <StatCard
                value={stats.totalTasksCompleted}
                label="Tasks Done"
                icon={<Text style={{ fontSize: 24 }}>✅</Text>}
                variant="glass"
                size="medium"
                style={styles.bentoItem}
                animationDelay={100}
              />
              <StatCard
                value={stats.totalRoomsCleaned}
                label="Rooms Cleaned"
                icon={<Text style={{ fontSize: 24 }}>🏠</Text>}
                variant="glass"
                size="medium"
                style={styles.bentoItem}
                animationDelay={150}
              />
            </View>
            <View style={styles.bentoRow}>
              <StatCard
                value={stats.longestStreak}
                label="Best Streak"
                icon={<Text style={{ fontSize: 24 }}>🏆</Text>}
                trend={stats.currentStreak >= stats.longestStreak ? { direction: 'up', value: 'Record!' } : undefined}
                variant="glass"
                size="medium"
                style={styles.bentoItem}
                animationDelay={200}
              />
              <StatCard
                value={unlockedBadges.length}
                label="Badges"
                icon={<Text style={{ fontSize: 24 }}>🎖️</Text>}
                variant="glass"
                size="medium"
                style={styles.bentoItem}
                animationDelay={250}
              />
            </View>
          </View>
        </Animated.View>

        {/* Achievements Carousel */}
        {unlockedBadges.length > 0 && (
          <Animated.View
            entering={FadeInDown.delay(600).springify()}
            style={styles.achievementsSection}
          >
            <ContentRow
              title="Achievements"
              subtitle={`${unlockedBadges.length} badges earned`}
              showSeeAll={true}
              onSeeAllPress={() => router.push('/achievements')}
              itemWidth={140}
            >
              {unlockedBadges.map((badge, index) => (
                <BadgeCard
                  key={badge.id}
                  badge={badge}
                  unlocked={true}
                  delay={index * 50}
                  colors={colors}
                />
              ))}
            </ContentRow>
          </Animated.View>
        )}

        {/* Locked Badges */}
        <Animated.View
          entering={FadeInDown.delay(700).springify()}
          style={styles.lockedSection}
        >
          <Text style={[Typography.title3, { color: colors.text, marginBottom: 12, paddingHorizontal: 20 }]}>
            Next Goals
          </Text>
          <View style={styles.lockedBadges}>
            {lockedBadges.slice(0, 3).map((badge, index) => (
              <LockedBadgeRow
                key={badge.id}
                badge={badge}
                stats={stats}
                index={index}
                colors={colors}
              />
            ))}
          </View>
        </Animated.View>

        {/* Room Progress */}
        {rooms.length > 0 && (
          <Animated.View
            entering={FadeInDown.delay(800).springify()}
            style={styles.roomsSection}
          >
            <Text style={[Typography.title3, { color: colors.text, marginBottom: 12, paddingHorizontal: 20 }]}>
              Room Progress
            </Text>
            <View style={styles.roomsList}>
              {rooms.map((room, index) => (
                <RoomProgressItem
                  key={room.id}
                  room={room}
                  index={index}
                  colors={colors}
                  onPress={() => router.push(`/room/${room.id}`)}
                />
              ))}
            </View>
          </Animated.View>
        )}

        {/* Motivation Card */}
        <Animated.View
          entering={FadeInDown.delay(900).springify()}
          style={styles.motivationSection}
        >
          <GlassCard variant="elevated" style={styles.motivationCard}>
            <Text style={styles.motivationEmoji}>
              {stats.totalTasksCompleted === 0 ? '💪' :
               stats.totalTasksCompleted < 10 ? '🚀' :
               stats.totalTasksCompleted < 50 ? '🌟' : '👑'}
            </Text>
            <Text style={[Typography.body, { color: colors.text, textAlign: 'center', marginTop: 8 }]}>
              {stats.totalTasksCompleted === 0
                ? "Your journey begins with a single task. You've got this!"
                : stats.totalTasksCompleted < 10
                ? "Great start! Keep the momentum going!"
                : stats.totalTasksCompleted < 50
                ? "You're making amazing progress!"
                : "You're a decluttering superstar!"}
            </Text>
          </GlassCard>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

// Ring Legend Item
function RingLegendItem({
  color,
  label,
  value,
  description,
}: {
  color: string;
  label: string;
  value: string;
  description: string;
}) {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];

  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <View style={styles.legendText}>
        <Text style={[Typography.caption1Medium, { color: colors.text }]}>
          {label}
        </Text>
        <Text style={[Typography.caption1, { color: colors.textSecondary }]}>
          {description}
        </Text>
      </View>
      <Text style={[Typography.headline, { color }]}>{value}</Text>
    </View>
  );
}

// Weekly Bar Item
function WeeklyBarItem({
  day,
  value,
  maxValue,
  isToday,
  delay,
  colors,
}: {
  day: string;
  value: number;
  maxValue: number;
  isToday: boolean;
  delay: number;
  colors: typeof Colors.dark;
}) {
  const height = useSharedValue(0);
  const barHeight = Math.max(4, (value / Math.max(maxValue, 100)) * 80);

  React.useEffect(() => {
    height.value = withDelay(
      delay + 400,
      withSpring(barHeight, { damping: 12, stiffness: 100 })
    );
  }, [value, maxValue]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: height.value,
  }));

  return (
    <View style={styles.barItem}>
      <View style={styles.barContainer}>
        <Animated.View style={[styles.bar, animatedStyle]}>
          <LinearGradient
            colors={isToday ? ['#A78BFA', '#818CF8'] : ['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>
      <Text
        style={[
          Typography.caption2,
          {
            color: isToday ? colors.primary : colors.textSecondary,
            fontWeight: isToday ? '600' : '400',
            marginTop: 6,
          },
        ]}
      >
        {day}
      </Text>
    </View>
  );
}

// Badge Card Component
function BadgeCard({
  badge,
  unlocked,
  delay,
  colors,
}: {
  badge: Badge;
  unlocked: boolean;
  delay: number;
  colors: typeof Colors.dark;
}) {
  const { animatedStyle, onPressIn, onPressOut } = useCardPress();
  const colorScheme = useColorScheme() ?? 'dark';

  return (
    <AnimatedPressable
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={animatedStyle}
    >
      <View
        style={[
          styles.badgeCard,
          {
            backgroundColor: colorScheme === 'dark'
              ? 'rgba(255, 255, 255, 0.08)'
              : 'rgba(0, 0, 0, 0.04)',
          },
        ]}
      >
        <Text style={styles.badgeEmoji}>{badge.emoji}</Text>
        <Text
          style={[Typography.caption1Medium, { color: colors.text, textAlign: 'center' }]}
          numberOfLines={2}
        >
          {badge.name}
        </Text>
        <View style={[styles.rarityBadge, { backgroundColor: getTypeColor(badge.type) }]}>
          <Text style={[Typography.caption2, { color: '#FFFFFF' }]}>
            {badge.type}
          </Text>
        </View>
      </View>
    </AnimatedPressable>
  );
}

// Locked Badge Row
function LockedBadgeRow({
  badge,
  stats,
  index,
  colors,
}: {
  badge: Badge;
  stats: any;
  index: number;
  colors: typeof Colors.dark;
}) {
  const colorScheme = useColorScheme() ?? 'dark';

  // Calculate progress
  let progress = 0;
  let current = 0;
  switch (badge.type) {
    case 'tasks':
      current = stats.totalTasksCompleted;
      progress = Math.min(1, current / badge.requirement);
      break;
    case 'rooms':
      current = stats.totalRoomsCleaned;
      progress = Math.min(1, current / badge.requirement);
      break;
    case 'streak':
      current = stats.currentStreak;
      progress = Math.min(1, current / badge.requirement);
      break;
    case 'time':
      current = stats.totalMinutesCleaned;
      progress = Math.min(1, current / badge.requirement);
      break;
  }

  return (
    <Animated.View
      entering={FadeInRight.delay(index * 100 + 500)}
      style={[
        styles.lockedBadgeRow,
        {
          backgroundColor: colorScheme === 'dark'
            ? 'rgba(255, 255, 255, 0.05)'
            : 'rgba(0, 0, 0, 0.03)',
        },
      ]}
    >
      <Text style={[styles.lockedBadgeEmoji, { opacity: 0.5 }]}>{badge.emoji}</Text>
      <View style={styles.lockedBadgeInfo}>
        <Text style={[Typography.body, { color: colors.textSecondary }]}>
          {badge.name}
        </Text>
        <Text style={[Typography.caption1, { color: colors.textTertiary, marginTop: 2 }]}>
          {current} / {badge.requirement} {badge.type}
        </Text>
        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${progress * 100}%`, backgroundColor: getTypeColor(badge.type) },
            ]}
          />
        </View>
      </View>
      <Text style={[Typography.caption1, { color: colors.textTertiary }]}>
        {Math.round(progress * 100)}%
      </Text>
    </Animated.View>
  );
}

// Room Progress Item
function RoomProgressItem({
  room,
  index,
  colors,
  onPress,
}: {
  room: any;
  index: number;
  colors: typeof Colors.dark;
  onPress: () => void;
}) {
  const colorScheme = useColorScheme() ?? 'dark';
  const { animatedStyle, onPressIn, onPressOut } = useCardPress();

  return (
    <AnimatedPressable
      entering={FadeInRight.delay(index * 100 + 600)}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={animatedStyle}
    >
      <View
        style={[
          styles.roomProgressRow,
          {
            backgroundColor: colorScheme === 'dark'
              ? 'rgba(255, 255, 255, 0.05)'
              : 'rgba(0, 0, 0, 0.03)',
          },
        ]}
      >
        <Text style={styles.roomEmoji}>{room.emoji}</Text>
        <View style={styles.roomInfo}>
          <Text style={[Typography.body, { color: colors.text }]}>{room.name}</Text>
          <View style={styles.roomProgressBar}>
            <View
              style={[
                styles.roomProgressFill,
                { width: `${room.currentProgress}%` },
              ]}
            >
              <LinearGradient
                colors={[...colors.gradientPrimary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
            </View>
          </View>
        </View>
        <Text style={[Typography.headline, { color: colors.primary }]}>
          {room.currentProgress}%
        </Text>
        <Text style={[styles.chevron, { color: colors.textTertiary }]}>›</Text>
      </View>
    </AnimatedPressable>
  );
}

function getTypeColor(type: string): string {
  switch (type) {
    case 'tasks':
      return '#F87171'; // Red
    case 'rooms':
      return '#34D399'; // Green
    case 'streak':
      return '#FBBF24'; // Amber
    case 'time':
      return '#60A5FA'; // Blue
    default:
      return '#A78BFA'; // Purple
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 0,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  ringsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  ringsCard: {
    padding: 24,
  },
  ringsContent: {
    alignItems: 'center',
  },
  ringsLegend: {
    marginTop: 24,
    width: '100%',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  legendText: {
    flex: 1,
  },
  levelSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  levelCard: {
    padding: 16,
  },
  levelContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  levelBadge: {
    marginRight: 16,
  },
  levelBadgeGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  levelInfo: {
    flex: 1,
  },
  xpBarContainer: {
    marginTop: 8,
  },
  xpBarBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  xpBarFill: {
    height: '100%',
    borderRadius: 4,
    overflow: 'hidden',
  },
  weeklySection: {
    marginBottom: 20,
  },
  weeklyCard: {
    marginHorizontal: 20,
    padding: 20,
  },
  weeklyChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
  },
  barItem: {
    alignItems: 'center',
    flex: 1,
  },
  barContainer: {
    width: 24,
    height: 80,
    justifyContent: 'flex-end',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  bar: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    minHeight: 4,
  },
  streakBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  streakEmoji: {
    fontSize: 18,
    marginRight: 8,
  },
  statsSection: {
    marginBottom: 24,
  },
  bentoContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  bentoRow: {
    flexDirection: 'row',
    gap: 12,
  },
  bentoItem: {
    flex: 1,
  },
  achievementsSection: {
    marginBottom: 24,
  },
  badgeCard: {
    width: 140,
    height: 160,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  rarityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 8,
  },
  lockedSection: {
    marginBottom: 24,
  },
  lockedBadges: {
    paddingHorizontal: 20,
    gap: 8,
  },
  lockedBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
  },
  lockedBadgeEmoji: {
    fontSize: 32,
    marginRight: 16,
  },
  lockedBadgeInfo: {
    flex: 1,
  },
  progressBarBg: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  roomsSection: {
    marginBottom: 24,
  },
  roomsList: {
    paddingHorizontal: 20,
    gap: 8,
  },
  roomProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
  },
  roomEmoji: {
    fontSize: 28,
    marginRight: 12,
  },
  roomInfo: {
    flex: 1,
  },
  roomProgressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    marginTop: 6,
    overflow: 'hidden',
  },
  roomProgressFill: {
    height: '100%',
    borderRadius: 3,
    overflow: 'hidden',
  },
  chevron: {
    fontSize: 24,
    fontWeight: '300',
    marginLeft: 8,
  },
  motivationSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  motivationCard: {
    padding: 24,
    alignItems: 'center',
  },
  motivationEmoji: {
    fontSize: 48,
  },
});
