/**
 * Declutterly -- Achievements Screen (V1 Pencil Design)
 * XP level card with gradient bar, streak card, next badge prediction,
 * and full badge grid with earned/locked sections.
 */

import React, { useMemo, useCallback } from 'react';
import {
  ActivityIndicator,
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Share,
  useWindowDimensions,
} from 'react-native';
import { ScreenErrorBoundary } from '@/components/ErrorBoundary';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { AmbientBackdrop } from '@/components/ui/AmbientBackdrop';
import { useDeclutter } from '@/context/DeclutterContext';
import { ChevronLeft, Lock, Flame, Share2 } from 'lucide-react-native';
import { BADGES, Badge } from '@/types/declutter';
import { XP_PER_LEVEL } from '@/constants/app';
import {
  V1,
  BODY_FONT,
  DISPLAY_FONT,
  RADIUS,
} from '@/constants/designTokens';

function getLevelTitle(level: number) {
  if (level >= 20) return 'Declutter Legend';
  if (level >= 15) return 'Master Organizer';
  if (level >= 10) return 'Space Transformer';
  if (level >= 7) return 'Tidy Explorer';
  if (level >= 5) return 'Tidy Champion';
  if (level >= 3) return 'Rising Declutterer';
  return 'Getting Started';
}

// Badge type colors for visual distinction
const BADGE_TYPE_COLORS: Record<string, string> = {
  tasks: V1.green,
  rooms: V1.blue,
  streak: V1.amber,
  time: V1.coral,
  comeback: V1.gold,
  sessions: V1.indigo,
};

interface DisplayBadge {
  emoji: string;
  name: string;
  subtitle: string;
  earned: boolean;
  badge: Badge | null;
  progress?: number;
  typeColor: string;
}

function AchievementsContent() {
  const rawScheme = useColorScheme();
  const isDark = rawScheme === 'dark';
  const reducedMotion = useReducedMotion();
  const insets = useSafeAreaInsets();
  const { stats } = useDeclutter();
  const t = isDark ? V1.dark : V1.light;
  const { width: screenWidth } = useWindowDimensions();
  const BADGE_CARD_WIDTH = (screenWidth - 40 - 12) / 2;

  const unlockedBadges: Badge[] = stats?.badges ?? [];
  const unlockedIds = useMemo(() => new Set(unlockedBadges.map(b => b.id)), [unlockedBadges]);

  const currentXp = stats?.xp ?? 0;
  const level = Math.floor(currentXp / XP_PER_LEVEL) + 1;
  const xpInLevel = currentXp % XP_PER_LEVEL;
  const xpForNextLevel = XP_PER_LEVEL;
  const xpProgressPercent = Math.min(100, Math.round((xpInLevel / XP_PER_LEVEL) * 100));

  const currentStreak = stats?.currentStreak ?? 0;
  const longestStreak = stats?.longestStreak ?? 0;

  // Get badge progress
  const getBadgeProgress = useCallback((badge: Badge) => {
    let current = 0;
    switch (badge.type) {
      case 'tasks':
        current = stats?.totalTasksCompleted ?? 0;
        break;
      case 'rooms':
        current = stats?.totalRoomsCleaned ?? 0;
        break;
      case 'streak':
        current = Math.max(stats?.currentStreak ?? 0, stats?.longestStreak ?? 0);
        break;
      case 'time':
        current = stats?.totalMinutesCleaned ?? 0;
        break;
      default:
        current = 0;
    }
    const target = badge.requirement || 1;
    return { current, target, percent: Math.min(100, Math.round((current / target) * 100)) };
  }, [stats]);

  // Build display badges - NO limit, show all
  const { earnedBadges, lockedBadges } = useMemo(() => {
    const earned: DisplayBadge[] = BADGES.filter(b => unlockedIds.has(b.id)).map(b => ({
      emoji: b.emoji,
      name: b.name,
      subtitle: 'Earned',
      earned: true,
      badge: b,
      typeColor: BADGE_TYPE_COLORS[b.type] ?? V1.coral,
    }));

    const locked: DisplayBadge[] = BADGES.filter(b => !unlockedIds.has(b.id)).map(b => {
      const prog = getBadgeProgress(b);
      return {
        emoji: b.emoji,
        name: b.name,
        subtitle: `${prog.current}/${prog.target} ${b.type}`,
        earned: false,
        badge: b,
        progress: prog.percent,
        typeColor: BADGE_TYPE_COLORS[b.type] ?? V1.coral,
      };
    });

    return { earnedBadges: earned, lockedBadges: locked };
  }, [unlockedIds, getBadgeProgress]);

  // Next badge prediction
  const nextBadge = useMemo(() => {
    let closest: { badge: Badge; current: number; remaining: number; percent: number } | null = null;

    for (const badge of BADGES) {
      if (unlockedIds.has(badge.id)) continue;
      const prog = getBadgeProgress(badge);
      const remaining = prog.target - prog.current;
      if (remaining > 0 && (!closest || remaining < closest.remaining)) {
        closest = { badge, current: prog.current, remaining, percent: prog.percent };
      }
    }
    return closest;
  }, [unlockedIds, getBadgeProgress]);

  // Loading state
  if (!stats) {
    return (
      <View style={[styles.container, { backgroundColor: t.bg }]}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={t.text} />
        </View>
      </View>
    );
  }

  const enter = (delay: number) =>
    reducedMotion ? undefined : FadeInDown.delay(delay).duration(350);

  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      <AmbientBackdrop isDark={isDark} variant="progress" />
      <ScrollView
        style={styles.scrollView}
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
            style={[styles.backBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ChevronLeft size={18} color={t.text} />
          </Pressable>
          <Text style={[styles.pageTitle, { color: t.text }]}>Achievements</Text>
          <View style={{ width: 44 }} />
        </Animated.View>

        {/* XP Level Card */}
        <Animated.View entering={enter(60)}>
          <View style={[styles.xpCard, { backgroundColor: t.card, borderColor: isDark ? t.border : '#E0E2E6' }]}>
            <View style={styles.xpHeader}>
              <Text style={[styles.xpLevel, { color: V1.coral }]}>Level {level}</Text>
              <Text style={[styles.xpTitle, { color: t.textSecondary }]}>{getLevelTitle(level)}</Text>
            </View>
            <View style={[styles.xpTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
              <LinearGradient
                colors={[V1.coral, V1.gold]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.xpFill, { width: `${Math.max(xpProgressPercent, 4)}%` }]}
              />
            </View>
            <Text style={[styles.xpSubtext, { color: t.textSecondary }]}>
              {xpInLevel}/{xpForNextLevel} XP to Level {level + 1}
            </Text>
          </View>
        </Animated.View>

        {/* Streak Card */}
        <Animated.View entering={enter(120)}>
          <View style={[styles.streakCard, { backgroundColor: t.card, borderColor: isDark ? t.border : '#E0E2E6' }]}>
            <View style={styles.streakRow}>
              <View style={styles.streakCol}>
                <Flame size={24} color={V1.coral} />
                <Text style={[styles.streakLabel, { color: t.textSecondary }]}>Current Streak</Text>
                <Text style={[styles.streakValue, { color: V1.coral }]}>{currentStreak} Days</Text>
              </View>
              <View style={styles.streakCol}>
                <Text style={[styles.streakLabel, { color: t.textSecondary }]}>Best</Text>
                <Text style={[styles.streakValue, { color: V1.green }]}>{longestStreak} Days</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Next Badge Prediction */}
        {nextBadge && (
          <Animated.View entering={enter(160)}>
            <View style={[{
              backgroundColor: t.card,
              borderColor: V1.gold + '40',
              borderWidth: 1.5,
              borderRadius: 20,
              padding: 18,
              gap: 10,
            }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{
                  width: 48, height: 48, borderRadius: 24,
                  backgroundColor: V1.gold + '15',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Text style={{ fontSize: 24 }}>{nextBadge.badge.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: DISPLAY_FONT, fontSize: 16, fontWeight: '700', color: t.text }}>
                    Next: {nextBadge.badge.name}
                  </Text>
                  <Text style={{ fontFamily: BODY_FONT, fontSize: 13, color: V1.gold }}>
                    {nextBadge.remaining} more {nextBadge.badge.type} to go!
                  </Text>
                </View>
              </View>
              <View style={{
                height: 8, borderRadius: 4, overflow: 'hidden',
                backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
              }}>
                <LinearGradient
                  colors={[V1.gold, V1.amber]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ height: '100%', borderRadius: 4, width: `${Math.max(nextBadge.percent, 4)}%` }}
                />
              </View>
            </View>
          </Animated.View>
        )}

        {/* EARNED BADGES section */}
        {earnedBadges.length > 0 && (
          <>
            <Animated.View entering={enter(200)}>
              <Text style={[styles.badgesTitle, { color: t.textMuted }]}>
                EARNED ({earnedBadges.length})
              </Text>
            </Animated.View>

            <Animated.View entering={enter(220)} style={styles.badgeGrid} accessibilityRole="list">
              {earnedBadges.map((badge, index) => (
                <Pressable
                  key={`earned-${index}`}
                  onPress={() => {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    if (badge.badge) {
                      Share.share({
                        message: `I earned the "${badge.name}" ${badge.emoji} badge in Declutterly!`,
                      });
                    }
                  }}
                  style={({ pressed }) => [
                    styles.badgeCard,
                    {
                      width: BADGE_CARD_WIDTH,
                      backgroundColor: t.card,
                      borderColor: badge.typeColor + '40',
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}
                  accessibilityLabel={`${badge.name} badge - earned. Tap to share.`}
                >
                  <View style={[styles.badgeIconCircle, {
                    backgroundColor: badge.typeColor + '15',
                  }]}>
                    <Text style={styles.badgeEmoji}>{badge.emoji}</Text>
                  </View>
                  <Text style={[styles.badgeName, { color: t.text }]}>
                    {badge.name}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Share2 size={10} color={badge.typeColor} />
                    <Text style={[styles.badgeSubtitle, { color: badge.typeColor }]}>
                      Tap to share
                    </Text>
                  </View>
                </Pressable>
              ))}
            </Animated.View>
          </>
        )}

        {/* LOCKED BADGES section */}
        {lockedBadges.length > 0 && (
          <>
            <Animated.View entering={enter(260)}>
              <Text style={[styles.badgesTitle, { color: t.textMuted }]}>
                LOCKED ({lockedBadges.length})
              </Text>
            </Animated.View>

            <Animated.View entering={enter(280)} style={styles.badgeGrid} accessibilityRole="list">
              {lockedBadges.map((badge, index) => (
                <View
                  key={`locked-${index}`}
                  style={[
                    styles.badgeCard,
                    {
                      width: BADGE_CARD_WIDTH,
                      backgroundColor: t.card,
                      borderColor: isDark ? t.border : '#E0E2E6',
                    },
                  ]}
                  accessibilityLabel={`${badge.name} badge - locked. Progress: ${badge.subtitle}`}
                >
                  <View style={[styles.badgeIconCircle, {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                  }]}>
                    <Text style={[styles.badgeEmoji, { opacity: 0.4 }]}>{badge.emoji}</Text>
                  </View>
                  <Text style={[styles.badgeName, { color: t.textSecondary }]}>
                    {badge.name}
                  </Text>
                  {/* Progress bar */}
                  {badge.progress !== undefined && (
                    <View style={{
                      width: '100%', height: 4, borderRadius: 2, overflow: 'hidden',
                      backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                      marginTop: 4,
                    }}>
                      <View style={{
                        height: '100%', borderRadius: 2,
                        backgroundColor: badge.typeColor,
                        width: `${Math.max(badge.progress, 2)}%`,
                      }} />
                    </View>
                  )}
                  <Text style={[styles.badgeSubtitle, { color: t.textMuted }]}>
                    {badge.subtitle}
                  </Text>
                </View>
              ))}
            </Animated.View>
          </>
        )}

        {/* No badges at all */}
        {earnedBadges.length === 0 && lockedBadges.length === 0 && (
          <Animated.View entering={enter(200)}>
            <View style={{
              alignItems: 'center', padding: 24, gap: 12,
              backgroundColor: t.card, borderRadius: 20, borderWidth: 1, borderColor: t.border,
            }}>
              <Text style={{ fontSize: 40 }}>{'\u{2B50}'}</Text>
              <Text style={{ fontFamily: DISPLAY_FONT, fontSize: 18, fontWeight: '700', color: t.text, textAlign: 'center' }}>
                Start cleaning to earn badges
              </Text>
              <Text style={{ fontFamily: BODY_FONT, fontSize: 14, color: t.textSecondary, textAlign: 'center' }}>
                Complete tasks, build streaks, and clean rooms to unlock achievements.
              </Text>
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

export default function AchievementsScreen() {
  return (
    <ScreenErrorBoundary screenName="achievements">
      <AchievementsContent />
    </ScreenErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    gap: 16,
  },

  // Header
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

  // XP Card
  xpCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    gap: 10,
  },
  xpHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  xpLevel: {
    fontFamily: DISPLAY_FONT,
    fontSize: 18,
    fontWeight: '700',
  },
  xpTitle: {
    fontFamily: BODY_FONT,
    fontSize: 14,
    fontWeight: '500',
  },
  xpTrack: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  xpFill: {
    height: '100%',
    borderRadius: 5,
  },
  xpSubtext: {
    fontFamily: BODY_FONT,
    fontSize: 12,
    fontWeight: '500',
  },

  // Streak Card
  streakCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
  },
  streakRow: {
    flexDirection: 'row',
    gap: 24,
  },
  streakCol: {
    gap: 4,
  },
  streakLabel: {
    fontFamily: BODY_FONT,
    fontSize: 12,
    fontWeight: '500',
  },
  streakValue: {
    fontFamily: DISPLAY_FONT,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
  },

  // Badges
  badgesTitle: {
    fontFamily: BODY_FONT,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    marginTop: 8,
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  badgeCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
    gap: 8,
  },
  badgeIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeEmoji: {
    fontSize: 24,
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
});
