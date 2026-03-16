import { AmbientBackdrop } from '@/components/ui/AmbientBackdrop';
import { useAuth } from '@/context/AuthContext';
import { useDeclutter } from '@/context/DeclutterContext';
import { api } from '@/convex/_generated/api';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { Badge } from '@/types/declutter';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from 'convex/react';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useMemo } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const XP_PER_LEVEL = 500;
const BODY_FONT = 'DM Sans';
const DISPLAY_FONT = 'Bricolage Grotesque';
const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function getLevelInfo(xp: number) {
  const level = Math.floor(xp / XP_PER_LEVEL) + 1;
  const xpInLevel = xp % XP_PER_LEVEL;
  const xpToNext = XP_PER_LEVEL - xpInLevel;
  return {
    level,
    xpToNext,
  };
}

function getMoodLine(streak: number, roomsDone: number) {
  if (streak >= 14) return 'Two weeks strong. This is who you are now.';
  if (streak >= 7) return 'Your calm rhythm is getting real.';
  if (streak >= 3) return 'Consistency is starting to stick.';
  if (roomsDone >= 5) return 'Five rooms down. You are unstoppable.';
  if (roomsDone > 0) return 'You already have proof that small resets work.';
  return 'One small reset is all it takes to start.';
}

function getLevelTitle(level: number) {
  if (level >= 20) return 'Declutter Legend';
  if (level >= 15) return 'Master Organizer';
  if (level >= 10) return 'Space Transformer';
  if (level >= 7) return 'Cleaning Pro';
  if (level >= 5) return 'Tidy Champion';
  if (level >= 3) return 'Rising Declutterer';
  return 'Fresh Start';
}

function useCleanRate(weeklyActivity: Array<{ date: string; tasksCompleted: number }> | undefined) {
  return useMemo(() => {
    if (!weeklyActivity || weeklyActivity.length === 0) {
      return {
        cleanRate: 0,
        activeDays: [false, false, false, false, false, false, false],
        note: 'One small reset today is enough to start the streak.',
      };
    }

    const now = new Date();
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const activeDays: boolean[] = [];

    for (let index = 0; index < 7; index += 1) {
      const day = new Date(now);
      day.setDate(day.getDate() + mondayOffset + index);
      const iso = day.toISOString().split('T')[0];
      const entry = weeklyActivity.find((item) => item.date === iso);
      activeDays.push((entry?.tasksCompleted ?? 0) > 0);
    }

    const daysWithActivity = activeDays.filter(Boolean).length;
    const cleanRate = Math.round((daysWithActivity / 7) * 100);

    return {
      cleanRate,
      activeDays,
      note:
        daysWithActivity > 0
          ? `You showed up on ${daysWithActivity} of the last 7 days.`
          : 'One small reset today is enough to start the streak.',
    };
  }, [weeklyActivity]);
}

function ProfileSummaryCard({
  isDark,
  name,
  subtitle,
  level,
  xp,
  xpToNext,
  streak,
  roomsDone,
}: {
  isDark: boolean;
  name: string;
  subtitle: string;
  level: number;
  xp: number;
  xpToNext: number;
  streak: number;
  roomsDone: number;
}) {
  const avatarInitial = name.charAt(0).toUpperCase();
  const xpInLevel = XP_PER_LEVEL - xpToNext;
  const progressPercent = Math.max(Math.round((xpInLevel / XP_PER_LEVEL) * 100), 8);
  const streakLabel = streak > 0 ? `${streak} day streak` : 'Fresh start';
  const roomLabel = `${roomsDone} room${roomsDone === 1 ? '' : 's'} finished`;

  return (
    <LinearGradient
      colors={
        isDark
          ? ['rgba(24,24,29,0.96)', 'rgba(18,18,23,0.98)']
          : ['rgba(255,255,255,0.98)', 'rgba(248,244,238,0.96)']
      }
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.summaryCard,
        { borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' },
      ]}
    >
      <View
        style={[
          styles.summaryGlow,
          { backgroundColor: isDark ? 'rgba(255,196,138,0.14)' : 'rgba(255,208,162,0.24)' },
        ]}
      />

      <View style={styles.summaryHeader}>
        <View
          style={[
            styles.avatarRing,
            { borderColor: isDark ? 'rgba(255,220,182,0.28)' : 'rgba(153,112,68,0.2)' },
          ]}
        >
          <LinearGradient
            colors={isDark ? ['#5D4B3D', '#8D6D53'] : ['#D0B08E', '#B78D67']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatarFill}
          >
            <Text style={styles.avatarInitial}>{avatarInitial}</Text>
          </LinearGradient>
        </View>

        <View style={styles.summaryIdentity}>
          <Text style={[styles.summaryEyebrow, { color: isDark ? '#DAB58C' : '#8A5926' }]}>
            LEVEL {level} {'\u00B7'} {getLevelTitle(level).toUpperCase()}
          </Text>
          <Text style={[styles.summaryName, { color: isDark ? '#FFFFFF' : '#17171A' }]}>
            {name}
          </Text>
          <Text
            style={[
              styles.summarySubtitle,
              { color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(23,23,26,0.5)' },
            ]}
          >
            {subtitle}
          </Text>
        </View>

        <View
          style={[
            styles.levelChip,
            {
              backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.84)',
              borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
            },
          ]}
        >
          <Text style={[styles.levelChipValue, { color: isDark ? '#FFFFFF' : '#17171A' }]}>
            Lv. {level}
          </Text>
          <Text
            style={[
              styles.levelChipLabel,
              { color: isDark ? 'rgba(255,255,255,0.42)' : 'rgba(23,23,26,0.42)' },
            ]}
          >
            {xp} XP
          </Text>
        </View>
      </View>

      <View style={styles.summaryChipRow}>
        <View
          style={[
            styles.summaryChip,
            {
              backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,248,241,0.9)',
              borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
            },
          ]}
        >
          <Ionicons name="flame-outline" size={14} color={isDark ? '#FFD29A' : '#A96525'} />
          <Text style={[styles.summaryChipText, { color: isDark ? '#FFF3E0' : '#5A3815' }]}>
            {streakLabel}
          </Text>
        </View>

        <View
          style={[
            styles.summaryChip,
            {
              backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,248,241,0.9)',
              borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
            },
          ]}
        >
          <Ionicons name="home-outline" size={14} color={isDark ? '#C8D7FF' : '#4460A4'} />
          <Text style={[styles.summaryChipText, { color: isDark ? '#EEF2FF' : '#30477E' }]}>
            {roomLabel}
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.summaryProgressTrack,
          { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(23,23,26,0.08)' },
        ]}
      >
        <LinearGradient
          colors={isDark ? ['#FFD39A', '#FFAA63'] : ['#1B1B20', '#5E5B66']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.summaryProgressFill, { width: `${progressPercent}%` }]}
        />
      </View>

      <View style={styles.summaryFooter}>
        <Text
          style={[
            styles.summaryProgressText,
            { color: isDark ? 'rgba(255,255,255,0.58)' : 'rgba(23,23,26,0.5)' },
          ]}
        >
          {xpToNext} XP to Level {level + 1}
        </Text>
        <Text
          style={[
            styles.summaryProgressPercent,
            { color: isDark ? '#DAB58C' : '#8A5926' },
          ]}
        >
          {progressPercent}%
        </Text>
      </View>
    </LinearGradient>
  );
}

function WeeklyRhythmCard({
  isDark,
  cleanRate,
  activeDays,
  note,
}: {
  isDark: boolean;
  cleanRate: number;
  activeDays: boolean[];
  note: string;
}) {
  const activeCount = activeDays.filter(Boolean).length;

  return (
    <View
      style={[
        styles.rhythmCard,
        {
          backgroundColor: isDark ? 'rgba(20,20,24,0.96)' : 'rgba(255,255,255,0.96)',
          borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
        },
      ]}
    >
      <View style={styles.rhythmHeader}>
        <Text
          style={[
            styles.rhythmEyebrow,
            { color: isDark ? 'rgba(255,255,255,0.44)' : 'rgba(23,23,26,0.44)' },
          ]}
        >
          WEEKLY RHYTHM
        </Text>

        <View
          style={[
            styles.rhythmChip,
            {
              backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(248,244,238,0.95)',
              borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
            },
          ]}
        >
          <Text style={[styles.rhythmChipValue, { color: isDark ? '#FFFFFF' : '#17171A' }]}>
            {activeCount}/7
          </Text>
          <Text
            style={[
              styles.rhythmChipLabel,
              { color: isDark ? 'rgba(255,255,255,0.42)' : 'rgba(23,23,26,0.4)' },
            ]}
          >
            ACTIVE DAYS
          </Text>
        </View>
      </View>

      <Text style={[styles.rhythmValue, { color: isDark ? '#FFFFFF' : '#17171A' }]}>
        {cleanRate}%
      </Text>
      <Text
        style={[
          styles.rhythmNote,
          { color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(23,23,26,0.5)' },
        ]}
      >
        {note}
      </Text>

      <View style={styles.dayRow}>
        {activeDays.map((active, index) => (
          <View key={`${DAY_LABELS[index]}-${index}`} style={styles.dayColumn}>
            {active ? (
              <LinearGradient
                colors={
                  isDark ? ['#FFF3E3', '#D8D8D8'] : ['#1B1B20', '#7E7E86']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.dayDot}
              />
            ) : (
              <View
                style={[
                  styles.dayDot,
                  {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(23,23,26,0.08)',
                    borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(23,23,26,0.06)',
                  },
                ]}
              />
            )}
            <Text
              style={[
                styles.dayLabel,
                { color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(23,23,26,0.32)' },
              ]}
            >
              {DAY_LABELS[index]}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function StatCard({
  isDark,
  value,
  label,
  icon,
}: {
  isDark: boolean;
  value: string;
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View
      style={[
        styles.statCard,
        {
          backgroundColor: isDark ? 'rgba(20,20,24,0.96)' : 'rgba(255,255,255,0.96)',
          borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
        },
      ]}
    >
      <View style={styles.statValueRow}>
        {icon ? (
          <Ionicons
            name={icon}
            size={16}
            color={isDark ? '#FFD29A' : '#A96525'}
            style={{ marginRight: 4 }}
          />
        ) : null}
        <Text style={[styles.statValue, { color: isDark ? '#FFFFFF' : '#17171A' }]}>
          {value}
        </Text>
      </View>
      <Text
        style={[
          styles.statLabel,
          { color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(23,23,26,0.44)' },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

function RecentBadges({
  isDark,
  badges,
}: {
  isDark: boolean;
  badges: Badge[];
}) {
  const recentBadges = useMemo(() => {
    const sorted = [...badges]
      .filter((badge) => !!badge.unlockedAt)
      .sort((left, right) => {
        const leftTime = left.unlockedAt ? new Date(left.unlockedAt).getTime() : 0;
        const rightTime = right.unlockedAt ? new Date(right.unlockedAt).getTime() : 0;
        return rightTime - leftTime;
      });

    if (sorted.length >= 3) {
      return sorted.slice(0, 3);
    }

    return [
      ...sorted,
      { id: 'fresh-start', emoji: '🌱', name: 'Fresh Start', description: 'First room', type: 'rooms', requirement: 1 },
      { id: 'quiet-fire', emoji: '🔥', name: 'On Fire', description: '7-day streak', type: 'streak', requirement: 7 },
      { id: 'top-ten', emoji: '🏆', name: 'Top 10%', description: 'Leaderboard', type: 'rooms', requirement: 10 },
    ].slice(0, 3) as Badge[];
  }, [badges]);

  return (
    <View style={styles.badgesSection}>
      <View style={styles.badgesHeader}>
        <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#17171A' }]}>
          Recent Badges
        </Text>
        <Pressable
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/achievements');
          }}
          accessibilityRole="button"
          accessibilityLabel="View all badges"
        >
          <Text
            style={[
              styles.viewAll,
              { color: isDark ? 'rgba(255,255,255,0.58)' : 'rgba(23,23,26,0.58)' },
            ]}
          >
            View All
          </Text>
        </Pressable>
      </View>

      <View style={styles.badgesRow}>
        {recentBadges.map((badge) => (
          <Pressable
            key={badge.id}
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/achievements');
            }}
            accessibilityRole="button"
            accessibilityLabel={`${badge.name} badge`}
            style={({ pressed }) => [
              styles.badgeCard,
              {
                backgroundColor: isDark ? 'rgba(20,20,24,0.96)' : 'rgba(255,255,255,0.96)',
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                opacity: pressed ? 0.82 : 1,
              },
            ]}
          >
            <Text style={styles.badgeEmoji}>{badge.emoji}</Text>
            <Text style={[styles.badgeName, { color: isDark ? '#FFFFFF' : '#17171A' }]}>
              {badge.name}
            </Text>
            <Text
              style={[
                styles.badgeSubtitle,
                { color: isDark ? 'rgba(255,255,255,0.42)' : 'rgba(23,23,26,0.44)' },
              ]}
            >
              {badge.description || 'Quiet progress'}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function ConnectedSurfaces({ isDark }: { isDark: boolean }) {
  const items = [
    {
      title: 'Community',
      subtitle: 'Friends and challenges',
      icon: 'people-outline' as const,
      route: '/social' as const,
      colors: isDark
        ? (['rgba(156,170,255,0.18)', 'rgba(156,170,255,0.08)'] as const)
        : (['rgba(221,227,255,0.92)', 'rgba(170,184,255,0.36)'] as const),
    },
    {
      title: 'Insights',
      subtitle: 'Trends and patterns',
      icon: 'analytics-outline' as const,
      route: '/insights' as const,
      colors: isDark
        ? (['rgba(255,196,138,0.18)', 'rgba(255,196,138,0.08)'] as const)
        : (['rgba(255,238,214,0.92)', 'rgba(255,196,138,0.36)'] as const),
    },
  ];

  return (
    <View style={styles.connectedRow}>
      {items.map((item) => (
        <Pressable
          key={item.route}
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push(item.route);
          }}
          accessibilityRole="button"
          accessibilityLabel={`Open ${item.title}`}
          style={({ pressed }) => [
            styles.connectedCard,
            {
              backgroundColor: isDark ? 'rgba(20,20,24,0.96)' : 'rgba(255,255,255,0.96)',
              borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
              opacity: pressed ? 0.82 : 1,
            },
          ]}
        >
          <LinearGradient
            colors={item.colors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.connectedIcon}
          >
            <Ionicons name={item.icon} size={18} color={isDark ? '#FFFFFF' : '#3E2C18'} />
          </LinearGradient>
          <Text style={[styles.connectedTitle, { color: isDark ? '#FFFFFF' : '#17171A' }]}>
            {item.title}
          </Text>
          <Text
            style={[
              styles.connectedSubtitle,
              { color: isDark ? 'rgba(255,255,255,0.42)' : 'rgba(23,23,26,0.44)' },
            ]}
          >
            {item.subtitle}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function ProCard({ isDark, xpToNext }: { isDark: boolean; xpToNext: number }) {
  return (
    <Pressable
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        router.push('/paywall');
      }}
      accessibilityRole="button"
      accessibilityLabel="Upgrade to Declutter Pro"
      style={({ pressed }) => [{ opacity: pressed ? 0.88 : 1 }]}
    >
      <LinearGradient
        colors={
          isDark
            ? ['rgba(255,207,160,0.24)', 'rgba(210,162,106,0.18)']
            : ['rgba(255,231,200,0.94)', 'rgba(240,195,142,0.62)']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.proCard,
          { borderColor: isDark ? 'rgba(255,223,189,0.18)' : 'rgba(182,136,88,0.16)' },
        ]}
      >
        <View style={styles.proCardIcon}>
          <Ionicons name="ribbon-outline" size={18} color={isDark ? '#FFF8F0' : '#5F3A12'} />
        </View>

        <View style={styles.proCardCopy}>
          <Text style={[styles.proCardEyebrow, { color: isDark ? '#FFF1DE' : '#8D5A24' }]}>
            DECLUTTER PRO
          </Text>
          <Text style={[styles.proCardTitle, { color: isDark ? '#FFF8F0' : '#3A240C' }]}>
            Level up 2x faster with Pro.
          </Text>
          <Text
            style={[
              styles.proCardSubtitle,
              { color: isDark ? 'rgba(255,255,255,0.58)' : 'rgba(58,36,12,0.62)' },
            ]}
          >
            AI coaching, unlimited rooms, streak shields. Try free for 7 days.
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={18} color={isDark ? '#FFF8F0' : '#5F3A12'} />
      </LinearGradient>
    </Pressable>
  );
}

export default function ProfileScreen() {
  const rawScheme = useColorScheme();
  const isDark = rawScheme === 'dark';
  const reducedMotion = useReducedMotion();
  const insets = useSafeAreaInsets();
  const { user, stats, rooms: rawRooms } = useDeclutter();
  const { user: authUser, isAuthenticated } = useAuth();
  const weeklyActivity = useQuery(api.activityLog.getWeeklyActivity, isAuthenticated ? {} : 'skip');

  const rooms = rawRooms ?? [];
  const streak = stats?.currentStreak ?? 0;
  const totalXP = stats?.xp ?? 0;
  const roomsDone =
    stats?.totalRoomsCleaned ??
    rooms.filter((room) => (room.tasks ?? []).length > 0 && (room.tasks ?? []).every((task) => task.completed))
      .length;
  const badges = stats?.badges ?? [];
  const displayName = authUser?.displayName?.trim() || user?.name || 'Declutterer';
  const subtitle = getMoodLine(streak, roomsDone);
  const { level, xpToNext } = getLevelInfo(totalXP);
  const { cleanRate, activeDays, note } = useCleanRate(weeklyActivity ?? undefined);

  const enter = (delay: number) =>
    reducedMotion ? undefined : FadeInDown.duration(380).delay(delay);

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0A0A0A' : '#F8F8F8' }]}>
      <AmbientBackdrop isDark={isDark} variant="profile" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 14, paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={enter(0)} style={styles.header}>
          <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#17171A' }]}>
            Profile
          </Text>
          <Pressable
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/settings');
            }}
            accessibilityRole="button"
            accessibilityLabel="Open settings"
            style={({ pressed }) => [
              styles.settingsButton,
              {
                backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.84)',
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                opacity: pressed ? 0.78 : 1,
              },
            ]}
          >
            <Ionicons name="settings-outline" size={18} color={isDark ? '#FFFFFF' : '#17171A'} />
          </Pressable>
        </Animated.View>

        <Animated.View entering={enter(60)}>
          <ProfileSummaryCard
            isDark={isDark}
            name={displayName}
            subtitle={subtitle}
            level={level}
            xp={totalXP}
            xpToNext={xpToNext}
            streak={streak}
            roomsDone={roomsDone}
          />
        </Animated.View>

        <Animated.View entering={enter(120)}>
          <WeeklyRhythmCard
            isDark={isDark}
            cleanRate={cleanRate}
            activeDays={activeDays}
            note={note}
          />
        </Animated.View>

        <Animated.View entering={enter(180)} style={styles.statsRow}>
          <StatCard isDark={isDark} value={String(streak)} label="Day Streak" icon="flame-outline" />
          <StatCard isDark={isDark} value={String(roomsDone)} label="Rooms Done" />
          <StatCard isDark={isDark} value={totalXP.toLocaleString()} label="Total XP" />
        </Animated.View>

        <Animated.View entering={enter(240)}>
          <RecentBadges isDark={isDark} badges={badges} />
        </Animated.View>

        <Animated.View entering={enter(300)}>
          <ProCard isDark={isDark} xpToNext={xpToNext} />
        </Animated.View>

        <Animated.View entering={enter(360)}>
          <ConnectedSurfaces isDark={isDark} />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontFamily: DISPLAY_FONT,
    fontSize: 32,
    lineHeight: 36,
    fontWeight: '700',
    letterSpacing: -0.7,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCard: {
    overflow: 'hidden',
    borderRadius: 28,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 18,
    gap: 14,
  },
  summaryGlow: {
    position: 'absolute',
    top: -18,
    right: -10,
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    padding: 3,
  },
  avatarFill: {
    flex: 1,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#FFF8EF',
    fontFamily: DISPLAY_FONT,
    fontSize: 24,
    fontWeight: '700',
  },
  summaryIdentity: {
    flex: 1,
    gap: 4,
  },
  summaryEyebrow: {
    fontFamily: BODY_FONT,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.9,
  },
  summaryName: {
    fontFamily: DISPLAY_FONT,
    fontSize: 28,
    lineHeight: 30,
    fontWeight: '700',
    letterSpacing: -0.7,
  },
  summarySubtitle: {
    fontFamily: BODY_FONT,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  levelChip: {
    minWidth: 76,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  summaryChipRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  summaryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  summaryChipText: {
    fontFamily: BODY_FONT,
    fontSize: 12,
    fontWeight: '700',
  },
  summaryProgressTrack: {
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
  },
  summaryProgressFill: {
    height: '100%',
    borderRadius: 999,
  },
  summaryFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryProgressText: {
    flex: 1,
    fontFamily: BODY_FONT,
    fontSize: 12,
    fontWeight: '600',
  },
  summaryProgressPercent: {
    fontFamily: BODY_FONT,
    fontSize: 12,
    fontWeight: '800',
  },
  levelChipValue: {
    fontFamily: BODY_FONT,
    fontSize: 13,
    fontWeight: '700',
  },
  levelChipLabel: {
    fontFamily: BODY_FONT,
    fontSize: 11,
    fontWeight: '500',
  },
  rhythmCard: {
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  rhythmHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 10,
  },
  rhythmEyebrow: {
    fontFamily: BODY_FONT,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  rhythmChip: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
  },
  rhythmChipValue: {
    fontFamily: BODY_FONT,
    fontSize: 12,
    fontWeight: '700',
  },
  rhythmChipLabel: {
    fontFamily: BODY_FONT,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.6,
  },
  rhythmValue: {
    fontFamily: DISPLAY_FONT,
    fontSize: 52,
    lineHeight: 54,
    fontWeight: '700',
    letterSpacing: -1.2,
  },
  rhythmNote: {
    fontFamily: BODY_FONT,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 2,
  },
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  dayColumn: {
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  dayDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
  },
  dayLabel: {
    fontFamily: BODY_FONT,
    fontSize: 11,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontFamily: DISPLAY_FONT,
    fontSize: 28,
    lineHeight: 30,
    fontWeight: '700',
    letterSpacing: -0.8,
  },
  statLabel: {
    fontFamily: BODY_FONT,
    fontSize: 12,
    fontWeight: '500',
  },
  badgesSection: {
    gap: 12,
  },
  badgesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontFamily: BODY_FONT,
    fontSize: 17,
    fontWeight: '700',
  },
  viewAll: {
    fontFamily: BODY_FONT,
    fontSize: 13,
    fontWeight: '600',
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 10,
  },
  badgeCard: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 102,
  },
  badgeEmoji: {
    fontSize: 22,
  },
  badgeName: {
    fontFamily: BODY_FONT,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  badgeSubtitle: {
    fontFamily: BODY_FONT,
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
  connectedRow: {
    flexDirection: 'row',
    gap: 10,
  },
  connectedCard: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 8,
  },
  connectedIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectedTitle: {
    fontFamily: BODY_FONT,
    fontSize: 15,
    fontWeight: '700',
  },
  connectedSubtitle: {
    fontFamily: BODY_FONT,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
  proCard: {
    minHeight: 98,
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  proCardIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  proCardCopy: {
    flex: 1,
    gap: 4,
  },
  proCardEyebrow: {
    fontFamily: BODY_FONT,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  proCardTitle: {
    fontFamily: DISPLAY_FONT,
    fontSize: 22,
    lineHeight: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  proCardSubtitle: {
    fontFamily: BODY_FONT,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
});
