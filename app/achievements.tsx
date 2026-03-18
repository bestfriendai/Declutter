/**
 * Declutterly -- Achievements Screen (V1 Pencil Design)
 * XP level card with gradient bar, streak card, badge grid.
 */

import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  Share,
} from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { AmbientBackdrop } from '@/components/ui/AmbientBackdrop';
import { useDeclutter } from '@/context/DeclutterContext';
import { ChevronLeft, Lock, Flame } from 'lucide-react-native';
import { BADGES, Badge } from '@/types/declutter';

const BODY_FONT = 'DM Sans';
const DISPLAY_FONT = 'Bricolage Grotesque';
const XP_PER_LEVEL = 500;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BADGE_CARD_WIDTH = (SCREEN_WIDTH - 40 - 12) / 2;

const V1 = {
  coral: '#FF6B6B',
  green: '#66BB6A',
  amber: '#FFB74D',
  gold: '#FFD54F',
  blue: '#64B5F6',
  dark: {
    bg: '#0C0C0C',
    card: '#1A1A1A',
    border: 'rgba(255,255,255,0.08)',
    text: '#FFFFFF',
    textSecondary: 'rgba(255,255,255,0.5)',
    textMuted: 'rgba(255,255,255,0.3)',
  },
  light: {
    bg: '#FAFAFA',
    card: '#F6F7F8',
    border: '#E5E7EB',
    text: '#1A1A1A',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',
  },
};

function getLevelTitle(level: number) {
  if (level >= 20) return 'Declutter Legend';
  if (level >= 15) return 'Master Organizer';
  if (level >= 10) return 'Space Transformer';
  if (level >= 7) return 'Tidy Explorer';
  if (level >= 5) return 'Tidy Champion';
  if (level >= 3) return 'Rising Declutterer';
  return 'Getting Started';
}

// Badge display data
interface DisplayBadge {
  emoji: string;
  name: string;
  subtitle: string;
  earned: boolean;
  badge: Badge | null;
}

export default function AchievementsScreen() {
  const rawScheme = useColorScheme();
  const isDark = rawScheme === 'dark';
  const reducedMotion = useReducedMotion();
  const insets = useSafeAreaInsets();
  const { stats } = useDeclutter();
  const t = isDark ? V1.dark : V1.light;

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
    return { current, target };
  }, [stats]);

  // Build display badges
  const displayBadges = useMemo((): DisplayBadge[] => {
    const earned = BADGES.filter(b => unlockedIds.has(b.id));
    const locked = BADGES.filter(b => !unlockedIds.has(b.id));

    const result: DisplayBadge[] = earned.map(b => ({
      emoji: b.emoji,
      name: b.name,
      subtitle: 'Earned',
      earned: true,
      badge: b,
    }));

    locked.forEach(b => {
      const prog = getBadgeProgress(b);
      result.push({
        emoji: b.emoji,
        name: b.name,
        subtitle: `${prog.current}/${prog.target} ${b.type}`,
        earned: false,
        badge: b,
      });
    });

    // If no real badges, show design placeholders
    if (result.length === 0) {
      return [
        { emoji: '\u2B50', name: 'First Spark', subtitle: 'Earned', earned: true, badge: null },
        { emoji: '\u26A1', name: 'Speed Demon', subtitle: 'Earned', earned: true, badge: null },
        { emoji: '\u{1F525}', name: 'Streak Master', subtitle: '5/7 days', earned: false, badge: null },
        { emoji: '\u{1F3E0}', name: 'Room Champ', subtitle: '3/5 rooms', earned: false, badge: null },
        { emoji: '\u{2728}', name: 'Deep Cleaner', subtitle: '1/3 deep cleans', earned: false, badge: null },
        { emoji: '\u{1F512}', name: 'Mystery', subtitle: '???', earned: false, badge: null },
      ];
    }

    return result.slice(0, 8);
  }, [unlockedIds, getBadgeProgress]);

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
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            style={[styles.backBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ChevronLeft size={18} color={t.text} />
          </Pressable>
          <Text style={[styles.pageTitle, { color: t.text }]}>Achievements</Text>
          <View style={{ width: 36 }} />
        </Animated.View>

        {/* XP Level Card */}
        <Animated.View entering={enter(60)}>
          <View style={[styles.xpCard, { backgroundColor: t.card, borderColor: isDark ? t.border : '#E0E2E6' }]}>
            <View style={styles.xpHeader}>
              <Text style={[styles.xpLevel, { color: V1.coral }]}>Level {level}</Text>
              <Text style={[styles.xpTitle, { color: t.textSecondary }]}>{getLevelTitle(level)}</Text>
            </View>
            {/* Gradient progress bar */}
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

        {/* BADGES section */}
        <Animated.View entering={enter(180)}>
          <Text style={[styles.badgesTitle, { color: t.textMuted }]}>BADGES</Text>
        </Animated.View>

        <Animated.View entering={enter(220)} style={styles.badgeGrid}>
          {displayBadges.map((badge, index) => (
            <Pressable
              key={`badge-${index}`}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                if (badge.earned && badge.badge) {
                  Share.share({
                    message: `I earned the "${badge.name}" ${badge.emoji} badge in Declutterly!`,
                  });
                }
              }}
              style={({ pressed }) => [
                styles.badgeCard,
                {
                  backgroundColor: t.card,
                  borderColor: isDark ? t.border : '#E0E2E6',
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
              accessibilityLabel={badge.earned ? `${badge.name} badge - earned` : `${badge.name} badge - locked`}
            >
              {badge.earned ? (
                <View style={[styles.badgeIconCircle, {
                  backgroundColor: isDark ? 'rgba(255,107,107,0.12)' : 'rgba(255,107,107,0.08)',
                }]}>
                  <Text style={styles.badgeEmoji}>{badge.emoji}</Text>
                </View>
              ) : (
                <View style={[styles.badgeIconCircle, {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                }]}>
                  {badge.name === 'Mystery' ? (
                    <Lock size={20} color={t.textMuted} />
                  ) : (
                    <Text style={[styles.badgeEmoji, { opacity: 0.4 }]}>{badge.emoji}</Text>
                  )}
                </View>
              )}
              <Text style={[styles.badgeName, { color: badge.earned ? t.text : t.textSecondary }]}>
                {badge.name}
              </Text>
              <Text style={[styles.badgeSubtitle, { color: t.textMuted }]}>
                {badge.subtitle}
              </Text>
            </Pressable>
          ))}
        </Animated.View>
      </ScrollView>
    </View>
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
    width: 36,
    height: 36,
    borderRadius: 18,
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
    width: BADGE_CARD_WIDTH,
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
