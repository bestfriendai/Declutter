/**
 * Declutterly -- Weekly Summary Screen
 * Shareable weekly recap: tasks, rooms, time, XP, streak.
 */

import { ScreenErrorBoundary } from '@/components/ErrorBoundary';
import {
  V1,
  BODY_FONT,
  DISPLAY_FONT,
  RADIUS,
  SPACING,
  cardStyle,
  getTheme,
  CARD_SHADOW,
} from '@/constants/designTokens';
import { useWeeklyActivity, useStats, useStreakInfo } from '@/hooks/useConvex';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ChevronLeft, Share2, Flame, CheckCircle, Clock, Star, Zap } from 'lucide-react-native';
import React, { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function WeeklySummaryContent() {
  const rawScheme = useColorScheme();
  const isDark = rawScheme === 'dark';
  const reducedMotion = useReducedMotion();
  const insets = useSafeAreaInsets();
  const t = getTheme(isDark);

  const weeklyActivity = useWeeklyActivity();
  const stats = useStats();
  const streakInfo = useStreakInfo();

  // Aggregate weekly stats
  const weeklyStats = useMemo(() => {
    if (!weeklyActivity) return null;

    const tasksCompleted = weeklyActivity.reduce((sum, d) => sum + (d.tasksCompleted ?? 0), 0);
    const minutesCleaned = weeklyActivity.reduce((sum, d) => sum + (d.minutesCleaned ?? 0), 0);
    const xpEarned = weeklyActivity.reduce((sum, d) => sum + (d.xpEarned ?? 0), 0);
    const sessionsCount = weeklyActivity.reduce((sum, d) => sum + (d.sessionsCount ?? 0), 0);
    const activeDays = weeklyActivity.length;

    return { tasksCompleted, minutesCleaned, xpEarned, sessionsCount, activeDays };
  }, [weeklyActivity]);

  const streak = streakInfo?.currentStreak ?? stats?.currentStreak ?? 0;
  const roomsCleaned = stats?.totalRoomsCleaned ?? 0;

  const enter = (delay: number) =>
    reducedMotion ? undefined : FadeInDown.delay(delay).duration(350);

  const handleShare = useCallback(async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const tasks = weeklyStats?.tasksCompleted ?? 0;
    const mins = weeklyStats?.minutesCleaned ?? 0;
    const xp = weeklyStats?.xpEarned ?? 0;

    try {
      await Share.share({
        message: [
          'My Declutterly Weekly Recap:',
          `${tasks} tasks completed`,
          `${mins} minutes cleaned`,
          `${xp} XP earned`,
          streak > 0 ? `${streak}-day streak` : '',
          '',
          'Making my space better, one task at a time. #Declutterly',
        ].filter(Boolean).join('\n'),
      });
    } catch {}
  }, [weeklyStats, streak]);

  if (weeklyActivity === undefined || stats === undefined) {
    return (
      <View style={[styles.container, { backgroundColor: t.bg }]}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={t.text} />
        </View>
      </View>
    );
  }

  const ws = weeklyStats ?? { tasksCompleted: 0, minutesCleaned: 0, xpEarned: 0, sessionsCount: 0, activeDays: 0 };
  const timeFormatted = ws.minutesCleaned >= 60
    ? `${Math.floor(ws.minutesCleaned / 60)}h ${ws.minutesCleaned % 60}m`
    : `${ws.minutesCleaned}m`;

  // Day labels for the week bar
  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const activeDayMap = new Set(
    (weeklyActivity ?? []).map((d) => {
      const date = new Date(d.date + 'T00:00:00');
      return (date.getDay() + 6) % 7; // Mon=0
    })
  );

  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={enter(0)} style={styles.header}>
          <Pressable
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            style={[
              styles.backBtn,
              { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ChevronLeft size={18} color={t.text} />
          </Pressable>
          <Text style={[styles.pageTitle, { color: t.text }]}>Weekly Summary</Text>
          <Pressable
            onPress={handleShare}
            style={[
              styles.backBtn,
              { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Share summary"
          >
            <Share2 size={18} color={t.text} />
          </Pressable>
        </Animated.View>

        {/* Title card */}
        <Animated.View entering={enter(60)}>
          <LinearGradient
            colors={isDark
              ? ['rgba(255,107,107,0.15)', 'rgba(255,107,107,0.05)']
              : ['rgba(255,107,107,0.10)', 'rgba(255,107,107,0.03)']
            }
            style={styles.titleCard}
          >
            <Text style={{ fontSize: 32 }}>{'\u{1F4CA}'}</Text>
            <Text style={[styles.titleText, { color: t.text }]}>This Week</Text>
            <Text style={[styles.subtitleText, { color: t.textSecondary }]}>
              {ws.activeDays} active day{ws.activeDays !== 1 ? 's' : ''} out of 7
            </Text>
          </LinearGradient>
        </Animated.View>

        {/* Week activity bar */}
        <Animated.View entering={enter(100)}>
          <View style={styles.weekBar}>
            {dayLabels.map((label, i) => {
              const isActive = activeDayMap.has(i);
              return (
                <View key={`${label}-${i}`} style={styles.weekDayCol}>
                  <Text style={[styles.weekLabel, { color: t.textMuted }]}>{label}</Text>
                  <View
                    style={[
                      styles.weekDot,
                      {
                        backgroundColor: isActive
                          ? V1.coral
                          : isDark
                            ? 'rgba(255,255,255,0.08)'
                            : 'rgba(0,0,0,0.06)',
                      },
                    ]}
                  />
                </View>
              );
            })}
          </View>
        </Animated.View>

        {/* Stats grid */}
        <Animated.View entering={enter(140)} style={styles.statsGrid}>
          <View style={[styles.statCard, cardStyle(isDark)]}>
            <CheckCircle size={20} color={V1.green} />
            <Text style={[styles.statValue, { color: V1.green }]}>{ws.tasksCompleted}</Text>
            <Text style={[styles.statLabel, { color: t.textSecondary }]}>Tasks Done</Text>
          </View>
          <View style={[styles.statCard, cardStyle(isDark)]}>
            <Clock size={20} color={V1.blue} />
            <Text style={[styles.statValue, { color: V1.blue }]}>{timeFormatted}</Text>
            <Text style={[styles.statLabel, { color: t.textSecondary }]}>Time Cleaned</Text>
          </View>
          <View style={[styles.statCard, cardStyle(isDark)]}>
            <Star size={20} color={V1.amber} />
            <Text style={[styles.statValue, { color: V1.amber }]}>{ws.xpEarned}</Text>
            <Text style={[styles.statLabel, { color: t.textSecondary }]}>XP Earned</Text>
          </View>
          <View style={[styles.statCard, cardStyle(isDark)]}>
            <Flame size={20} color={V1.coral} />
            <Text style={[styles.statValue, { color: V1.coral }]}>{streak}</Text>
            <Text style={[styles.statLabel, { color: t.textSecondary }]}>Day Streak</Text>
          </View>
        </Animated.View>

        {/* Sessions summary */}
        <Animated.View entering={enter(180)}>
          <View style={[styles.sessionsCard, cardStyle(isDark)]}>
            <Zap size={18} color={V1.indigo} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.sessionsTitle, { color: t.text }]}>
                {ws.sessionsCount} cleaning session{ws.sessionsCount !== 1 ? 's' : ''}
              </Text>
              <Text style={[styles.sessionsSubtitle, { color: t.textSecondary }]}>
                Keep it going next week!
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Motivation */}
        <Animated.View entering={enter(220)}>
          <LinearGradient
            colors={isDark
              ? ['rgba(102,187,106,0.12)', 'rgba(102,187,106,0.04)']
              : ['rgba(102,187,106,0.08)', 'rgba(102,187,106,0.02)']
            }
            style={styles.motivationCard}
          >
            <Text style={[styles.motivationText, { color: isDark ? 'rgba(180,230,180,0.9)' : 'rgba(40,120,40,0.9)' }]}>
              {ws.tasksCompleted > 20
                ? 'Incredible week! You are building lasting habits.'
                : ws.tasksCompleted > 5
                  ? 'Great progress! Small wins compound over time.'
                  : ws.tasksCompleted > 0
                    ? 'Every task counts. You showed up this week.'
                    : 'A fresh week ahead. Start with just one task.'}
            </Text>
          </LinearGradient>
        </Animated.View>

        {/* Share CTA */}
        <Animated.View entering={enter(260)}>
          <Pressable
            onPress={handleShare}
            style={({ pressed }) => [
              styles.shareBtn,
              {
                backgroundColor: V1.coral,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Share your weekly summary"
          >
            <Share2 size={18} color="#FFFFFF" />
            <Text style={styles.shareBtnText}>Share Your Week</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

export default function WeeklySummaryScreen() {
  return (
    <ScreenErrorBoundary screenName="weekly-summary">
      <WeeklySummaryContent />
    </ScreenErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.screenPadding,
    gap: SPACING.sectionGap,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: {
    flex: 1,
    fontFamily: DISPLAY_FONT,
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
  },

  // Title card
  titleCard: {
    alignItems: 'center',
    padding: 24,
    borderRadius: RADIUS.lg,
    gap: 8,
  },
  titleText: {
    fontFamily: DISPLAY_FONT,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitleText: {
    fontFamily: BODY_FONT,
    fontSize: 14,
    fontWeight: '500',
  },

  // Week bar
  weekBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  weekDayCol: {
    alignItems: 'center',
    gap: 6,
  },
  weekLabel: {
    fontFamily: BODY_FONT,
    fontSize: 12,
    fontWeight: '600',
  },
  weekDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },

  // Stats grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '47%',
    flexGrow: 1,
    padding: 16,
    borderRadius: RADIUS.lg,
    gap: 6,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: DISPLAY_FONT,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.8,
  },
  statLabel: {
    fontFamily: BODY_FONT,
    fontSize: 12,
    fontWeight: '500',
  },

  // Sessions card
  sessionsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: RADIUS.lg,
    gap: 12,
  },
  sessionsTitle: {
    fontFamily: BODY_FONT,
    fontSize: 15,
    fontWeight: '600',
  },
  sessionsSubtitle: {
    fontFamily: BODY_FONT,
    fontSize: 12,
    fontWeight: '400',
  },

  // Motivation
  motivationCard: {
    borderRadius: RADIUS.lg,
    padding: 20,
  },
  motivationText: {
    fontFamily: BODY_FONT,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
    textAlign: 'center',
  },

  // Share
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 26,
  },
  shareBtnText: {
    fontFamily: BODY_FONT,
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
