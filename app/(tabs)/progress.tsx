/**
 * Declutterly -- Progress Screen (V1 Pencil Design)
 * Week view with day circles, streak card, 2x2 stats grid,
 * motivation card, and empty state with mascot.
 */

import { useDeclutter } from '@/context/DeclutterContext';
import {
  V1,
  BODY_FONT,
  DISPLAY_FONT,
  RADIUS,
  SPACING,
  cardStyle,
  getTheme,
} from '@/constants/designTokens';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { Flame, Check, Sparkles } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useMemo } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const WEEKDAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

type DayStatus = 'completed' | 'today' | 'missed' | 'future';

function getDayStatuses(activeDays: boolean[]): DayStatus[] {
  const now = new Date();
  const todayIndex = (now.getDay() + 6) % 7; // Monday = 0
  return activeDays.map((active, i) => {
    if (i === todayIndex) return 'today';
    if (i > todayIndex) return 'future';
    return active ? 'completed' : 'missed';
  });
}

function WeekView({
  isDark,
  activeDays,
}: {
  isDark: boolean;
  activeDays: boolean[];
}) {
  const statuses = getDayStatuses(activeDays);
  const t = getTheme(isDark);

  return (
    <View style={styles.weekRow}>
      {WEEKDAY_LABELS.map((label, i) => {
        const status = statuses[i];
        return (
          <View key={`${label}-${i}`} style={styles.weekDayCol}>
            <Text style={[styles.weekLabel, { color: t.textSecondary }]}>
              {label}
            </Text>
            <View
              style={[
                styles.weekCircle,
                status === 'completed' && {
                  backgroundColor: V1.green,
                  shadowColor: V1.green,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.3,
                  shadowRadius: 6,
                },
                status === 'today' && {
                  backgroundColor: V1.coral,
                  borderWidth: 2,
                  borderColor: 'rgba(255,107,107,0.4)',
                },
                status === 'missed' && {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#EEEFF1',
                },
                status === 'future' && {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#EEEFF1',
                },
              ]}
            >
              {status === 'completed' && (
                <Check size={16} color="#FFFFFF" strokeWidth={3} />
              )}
              {status === 'today' && (
                <Sparkles size={14} color="#FFFFFF" />
              )}
              {status === 'missed' && null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

function StreakCard({
  isDark,
  streak,
  bestThisMonth,
}: {
  isDark: boolean;
  streak: number;
  bestThisMonth: number;
}) {
  const progressPercent = bestThisMonth > 0
    ? Math.min(Math.round((streak / bestThisMonth) * 100), 100)
    : streak > 0 ? 100 : 0;

  return (
    <View style={[
      styles.streakCard,
      cardStyle(isDark),
    ]}>
      <View style={styles.streakHeader}>
        <Flame size={20} color={V1.coral} />
        <Text style={[styles.streakTitle, { color: getTheme(isDark).text }]}>
          🔥 {streak} Day Streak!
        </Text>
      </View>
      <Text style={[styles.streakSubtitle, { color: getTheme(isDark).textSecondary }]}>
        Your best this month
      </Text>
      <View style={[styles.streakTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
        <LinearGradient
          colors={[V1.coral, '#FF5252']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.streakFill, { width: `${Math.max(progressPercent, 6)}%` }]}
        />
      </View>
    </View>
  );
}

function StatBox({
  isDark,
  value,
  label,
  color,
}: {
  isDark: boolean;
  value: string;
  label: string;
  color: string;
}) {
  const t = getTheme(isDark);
  // Parse hex color to rgba at 4% opacity for background tint
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  };
  const tintBg = hexToRgba(color, 0.04);

  return (
    <View style={[
      styles.statBox,
      cardStyle(isDark),
      { backgroundColor: tintBg },
    ]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: t.textSecondary }]}>{label}</Text>
    </View>
  );
}

function MotivationCard({
  isDark,
  message,
}: {
  isDark: boolean;
  message: string;
}) {
  return (
    <LinearGradient
      colors={isDark
        ? ['rgba(255,107,107,0.15)', 'rgba(255,107,107,0.05)']
        : ['rgba(255,107,107,0.10)', 'rgba(255,107,107,0.04)']
      }
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.motivationCard, {
        borderColor: isDark ? 'rgba(255,107,107,0.2)' : 'rgba(255,107,107,0.2)',
      }]}
    >
      <View style={styles.motivationContent}>
        <Sparkles size={16} color={isDark ? 'rgba(255,200,200,0.9)' : 'rgba(180,60,60,0.9)'} />
        <Text style={[styles.motivationText, {
          color: isDark ? 'rgba(255,200,200,0.9)' : 'rgba(180,60,60,0.9)',
        }]}>
          {message}
        </Text>
      </View>
    </LinearGradient>
  );
}

function EmptyState({
  isDark,
  onStart,
}: {
  isDark: boolean;
  onStart: () => void;
}) {
  const t = getTheme(isDark);
  return (
    <View style={styles.emptyContainer}>
      {/* Mascot illustration */}
      <LinearGradient
        colors={isDark ? ['rgba(255,107,107,0.2)', 'rgba(255,142,142,0.08)'] : ['rgba(255,107,107,0.15)', 'rgba(255,142,142,0.06)']}
        style={styles.mascotCircle}
      >
        <Sparkles size={40} color={V1.coral} strokeWidth={1.5} />
      </LinearGradient>

      <Text style={[styles.emptyTitle, { color: t.text }]}>
        Your journey starts here
      </Text>
      <Text style={[styles.emptySubtitle, { color: t.textSecondary }]}>
        Complete your first cleaning session and{'\n'}watch your progress grow.
      </Text>

      {/* What you'll unlock - feature previews instead of sad zeroes */}
      <View style={styles.emptyFeatures}>
        <View style={[styles.emptyFeatureRow, {
          backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
          borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
        }]}>
          <View style={[styles.emptyFeatureIcon, { backgroundColor: isDark ? 'rgba(102,187,106,0.15)' : 'rgba(102,187,106,0.12)' }]}>
            <Flame size={16} color={V1.green} />
          </View>
          <View style={styles.emptyFeatureText}>
            <Text style={[styles.emptyFeatureTitle, { color: t.text }]}>Daily streaks</Text>
            <Text style={[styles.emptyFeatureDesc, { color: t.textMuted }]}>Build momentum one day at a time</Text>
          </View>
        </View>

        <View style={[styles.emptyFeatureRow, {
          backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
          borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
        }]}>
          <View style={[styles.emptyFeatureIcon, { backgroundColor: isDark ? 'rgba(100,181,246,0.15)' : 'rgba(100,181,246,0.12)' }]}>
            <Check size={16} color={V1.blue} />
          </View>
          <View style={styles.emptyFeatureText}>
            <Text style={[styles.emptyFeatureTitle, { color: t.text }]}>Task tracking</Text>
            <Text style={[styles.emptyFeatureDesc, { color: t.textMuted }]}>See every small win add up</Text>
          </View>
        </View>

        <View style={[styles.emptyFeatureRow, {
          backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
          borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
        }]}>
          <View style={[styles.emptyFeatureIcon, { backgroundColor: isDark ? 'rgba(255,183,77,0.15)' : 'rgba(255,183,77,0.12)' }]}>
            <Sparkles size={16} color={V1.amber} />
          </View>
          <View style={styles.emptyFeatureText}>
            <Text style={[styles.emptyFeatureTitle, { color: t.text }]}>Weekly insights</Text>
            <Text style={[styles.emptyFeatureDesc, { color: t.textMuted }]}>Patterns that keep you going</Text>
          </View>
        </View>
      </View>

      {/* CTA */}
      <Pressable
        onPress={onStart}
        accessibilityRole="button"
        accessibilityLabel="Start your first session"
        style={({ pressed }) => [
          { opacity: pressed ? 0.85 : 1, width: '100%', transform: [{ scale: pressed ? 0.98 : 1 }] },
        ]}
      >
        <LinearGradient
          colors={['#FF6B6B', '#FF5252']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.ctaButton}
        >
          <Text style={styles.ctaText}>Scan your first room</Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

export default function ProgressScreen() {
  const rawScheme = useColorScheme();
  const isDark = rawScheme === 'dark';
  const reducedMotion = useReducedMotion();
  const insets = useSafeAreaInsets();
  const { stats, rooms: rawRooms, setActiveRoom } = useDeclutter();
  const rooms = rawRooms ?? [];

  const streak = stats?.currentStreak ?? 0;
  const longestStreak = stats?.longestStreak ?? 0;
  const completedTasks = stats?.totalTasksCompleted ?? 0;
  const completedRooms = stats?.totalRoomsCleaned ?? 0;
  const totalMinutes = stats?.totalMinutesCleaned ?? 0;
  const t = getTheme(isDark);

  // Compute weekly active days
  const activeDays = useMemo(() => {
    const result = [false, false, false, false, false, false, false];
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    startOfWeek.setHours(0, 0, 0, 0);

    rooms.forEach((room) => {
      (room.tasks ?? []).forEach((task) => {
        if (!task.completed || !task.completedAt) return;
        const completedAt = new Date(task.completedAt);
        if (completedAt >= startOfWeek) {
          const dayIndex = (completedAt.getDay() + 6) % 7;
          result[dayIndex] = true;
        }
      });
    });
    return result;
  }, [rooms]);

  // Compute completion percentage
  const totalTasksAvailable = rooms.reduce((sum, room) => sum + (room.tasks?.length ?? 0), 0);
  const completionPercent = totalTasksAvailable > 0
    ? Math.round((completedTasks / totalTasksAvailable) * 100)
    : 0;

  const timeFormatted = totalMinutes >= 60
    ? `${Math.floor(totalMinutes / 60)}h`
    : `${totalMinutes}m`;

  const isEmpty = rooms.length === 0 || (completedTasks === 0 && completedRooms === 0 && streak === 0);

  const bestThisMonth = Math.max(longestStreak, streak, 7);

  // Motivation message
  const motivationMessage = useMemo(() => {
    if (completedTasks > 0) {
      return `Small progress is still progress. You cleaned ${completedTasks} more tasks than last week!`;
    }
    return 'Every room you reset is proof that calm is possible. Start small.';
  }, [completedTasks]);

  const handleStartSession = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setActiveRoom(null);
    router.push('/camera');
  };

  const enter = (delay: number) =>
    reducedMotion ? undefined : FadeInDown.duration(380).delay(delay);

  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      {/* Background blobs removed -- clean gradient bg only */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 14, paddingBottom: insets.bottom + 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <Animated.View entering={enter(0)}>
          <Text style={[styles.title, { color: t.text }]}>Your Progress</Text>
        </Animated.View>

        {isEmpty ? (
          <Animated.View entering={enter(60)}>
            {/* Week view (empty) */}
            <WeekView isDark={isDark} activeDays={[false, false, false, false, false, false, false]} />
            <EmptyState isDark={isDark} onStart={handleStartSession} />
          </Animated.View>
        ) : (
          <>
            {/* Week view */}
            <Animated.View entering={enter(60)}>
              <WeekView isDark={isDark} activeDays={activeDays} />
            </Animated.View>

            {/* Streak card */}
            <Animated.View entering={enter(120)}>
              <StreakCard isDark={isDark} streak={streak} bestThisMonth={bestThisMonth} />
            </Animated.View>

            {/* Stats grid */}
            <Animated.View entering={enter(180)}>
              <View style={styles.statsGrid}>
                <View style={styles.statsRow}>
                  <StatBox isDark={isDark} value={String(completedRooms)} label="Rooms" color={V1.green} />
                  <StatBox isDark={isDark} value={String(completedTasks)} label="Tasks Done" color={V1.coral} />
                </View>
                <View style={styles.statsRow}>
                  <StatBox isDark={isDark} value={timeFormatted} label="Time Cleaned" color={V1.blue} />
                  <StatBox isDark={isDark} value={`${completionPercent}%`} label="Completion" color={V1.amber} />
                </View>
              </View>
            </Animated.View>

            {/* Motivation card */}
            <Animated.View entering={enter(240)}>
              <MotivationCard isDark={isDark} message={motivationMessage} />
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.screenPadding,
    gap: SPACING.sectionGap,
  },
  title: {
    fontFamily: DISPLAY_FONT,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },

  // Week view
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  weekDayCol: {
    alignItems: 'center',
    gap: 8,
  },
  weekLabel: {
    fontFamily: BODY_FONT,
    fontSize: 13,
    fontWeight: '700',
  },
  weekCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Streak card
  streakCard: {
    borderRadius: RADIUS.lg,
    padding: SPACING.cardPadding,
    gap: 8,
  },
  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  streakTitle: {
    fontFamily: DISPLAY_FONT,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  streakSubtitle: {
    fontFamily: BODY_FONT,
    fontSize: 13,
    fontWeight: '500',
  },
  streakTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 4,
  },
  streakFill: {
    height: '100%',
    borderRadius: 3,
  },

  // Stats grid
  statsGrid: {
    gap: SPACING.itemGap,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.itemGap,
  },
  statBox: {
    flex: 1,
    borderRadius: RADIUS.lg,
    padding: SPACING.cardPadding,
    gap: 4,
  },
  statValue: {
    fontFamily: DISPLAY_FONT,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.8,
  },
  statLabel: {
    fontFamily: BODY_FONT,
    fontSize: 13,
    fontWeight: '500',
  },

  // Motivation card
  motivationCard: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: 20,
  },
  motivationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  motivationText: {
    flex: 1,
    fontFamily: BODY_FONT,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
  },

  // Empty state
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 20,
    gap: 16,
  },
  mascotCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontFamily: DISPLAY_FONT,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontFamily: BODY_FONT,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    textAlign: 'center',
  },
  emptyFeatures: {
    width: '100%',
    gap: 10,
    marginTop: 4,
  },
  emptyFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  emptyFeatureIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyFeatureText: {
    flex: 1,
    gap: 2,
  },
  emptyFeatureTitle: {
    fontFamily: BODY_FONT,
    fontSize: 15,
    fontWeight: '600',
  },
  emptyFeatureDesc: {
    fontFamily: BODY_FONT,
    fontSize: 13,
    fontWeight: '400',
  },
  ctaButton: {
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontFamily: BODY_FONT,
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
