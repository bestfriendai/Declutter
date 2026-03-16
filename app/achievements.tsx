/**
 * Declutterly - Achievements Screen
 * Matches Pencil design: XP card, streak card, earned badges grid.
 * Dark/Light adaptive. Keeps all existing data logic.
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  Modal,
  Share,
  Platform,
} from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOut,
  SlideInUp,
  SlideOutDown,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { AmbientBackdrop } from '@/components/ui/AmbientBackdrop';
import { Colors } from '@/constants/Colors';
import { useDeclutter } from '@/context/DeclutterContext';
import { Ionicons } from '@expo/vector-icons';
import { Spacing, BorderRadius } from '@/theme/spacing';
import { Typography } from '@/theme/typography';
import { BADGES, Badge } from '@/types/declutter';

const DISPLAY_FONT = 'Bricolage Grotesque';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Badge display data for the design-matched grid
const DISPLAY_BADGES = [
  { emoji: '\u{2B50}', name: 'First Spark', stars: '\u{2605}\u{2605}\u{2605}', locked: false },
  { emoji: '\u{26A1}', name: 'Speed Demon', stars: '\u{2605}\u{2605}\u{2605}', locked: false },
  { emoji: '\u{1F525}', name: 'Flame Keeper', stars: '\u{2605}\u{2605}\u{2605}', locked: false },
  { emoji: '\u{1F680}', name: 'Unstoppable', stars: '\u{2605}\u{2605}\u{2605}', locked: false },
  { emoji: '\u{2728}', name: 'Neat Freak', stars: '\u{2605}\u{2605}\u{2606}', locked: false },
  { emoji: '\u{1F512}', name: '???', stars: 'Locked', locked: true },
];

type BadgeCategory = 'all' | 'tasks' | 'rooms' | 'streak' | 'time' | 'comeback' | 'longComeback' | 'sessions';

interface CategoryInfo {
  id: BadgeCategory;
  label: string;
  emoji: string;
  color: string;
}

const CATEGORIES: CategoryInfo[] = [
  { id: 'all', label: 'All', emoji: '\u{1F3C6}', color: '#F59E0B' },
  { id: 'tasks', label: 'Tasks', emoji: '\u{2705}', color: '#FF375F' },
  { id: 'rooms', label: 'Rooms', emoji: '\u{1F3E0}', color: '#30D158' },
  { id: 'streak', label: 'Streaks', emoji: '\u{1F525}', color: '#FBBF24' },
  { id: 'time', label: 'Time', emoji: '\u{23F1}\u{FE0F}', color: '#0A84FF' },
  { id: 'comeback', label: 'Comeback', emoji: '\u{1F49B}', color: '#FF9F0A' },
  { id: 'sessions', label: 'Sessions', emoji: '\u{1F331}', color: '#34D399' },
];

const BADGE_COLORS: Record<string, string> = {
  tasks: '#FF375F',
  rooms: '#30D158',
  streak: '#FBBF24',
  time: '#0A84FF',
  comeback: '#FF9F0A',
  longComeback: '#FF6B6B',
  sessions: '#34D399',
};

const XP_PER_LEVEL = 500;

export default function AchievementsScreen() {
  const colorScheme = (useColorScheme() ?? 'dark') as 'light' | 'dark';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  const { stats } = useDeclutter();

  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Get badges data — defensive: stats.badges may be undefined if loaded from old storage
  const unlockedBadges: Badge[] = stats?.badges ?? [];
  const unlockedIds = useMemo(() => new Set(unlockedBadges.map(b => b.id)), [unlockedBadges]);

  // Get progress for a badge — defensive null checks on all stats fields
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
      case 'comeback':
      case 'longComeback':
      case 'sessions':
        current = 0;
        break;
    }
    const target = badge.requirement || 1; // prevent division by zero
    return {
      current,
      target,
      percentage: Math.min(100, Math.round((current / target) * 100)),
    };
  }, [stats]);

  const handleBadgePress = (badge: Badge) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedBadge(badge);
    setShowModal(true);
  };

  const handleShare = async (badge: Badge) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      await Share.share({
        message: `\u{1F389} I earned the "${badge.name}" ${badge.emoji} badge in Declutterly! ${badge.description}`,
      });
    } catch {
      // User cancelled share
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setTimeout(() => setSelectedBadge(null), 300);
  };

  // Derive XP/level data from stats
  const currentXp = stats?.xp ?? 0;
  const level = Math.floor(currentXp / XP_PER_LEVEL) + 1;
  const xpInLevel = currentXp % XP_PER_LEVEL;
  const xpForNextLevel = XP_PER_LEVEL - xpInLevel;
  const xpProgressPercent = Math.min(100, Math.round((xpInLevel / XP_PER_LEVEL) * 100));

  // Streak data
  const currentStreak = stats?.currentStreak ?? 0;
  const longestStreak = stats?.longestStreak ?? 0;
  const nextMilestone = currentStreak < 7 ? 7 : currentStreak < 14 ? 14 : currentStreak < 30 ? 30 : currentStreak < 60 ? 60 : 100;

  // Map real earned badges to display format, fall back to design placeholders
  const displayBadgeData = useMemo(() => {
    const earned = BADGES.filter(b => unlockedIds.has(b.id)).slice(0, 5);
    const locked = BADGES.filter(b => !unlockedIds.has(b.id));

    if (earned.length === 0) {
      // Show design placeholders when no badges earned
      return DISPLAY_BADGES;
    }

    const result = earned.map(b => ({
      emoji: b.emoji,
      name: b.name,
      stars: '\u{2605}\u{2605}\u{2605}',
      locked: false,
      badge: b,
    }));

    // Fill remaining with locked
    while (result.length < 6) {
      const lockedBadge = locked[result.length - earned.length];
      if (lockedBadge) {
        result.push({
          emoji: '\u{1F512}',
          name: '???',
          stars: 'Locked',
          locked: true,
          badge: lockedBadge,
        });
      } else {
        result.push({
          emoji: '\u{1F512}',
          name: '???',
          stars: 'Locked',
          locked: true,
          badge: undefined as any,
        });
      }
    }

    return result.slice(0, 6);
  }, [unlockedIds]);

  return (
    <View style={[s.container, {
      backgroundColor: isDark ? '#0A0A0A' : '#F8F8F8',
    }]}>
      <AmbientBackdrop isDark={isDark} variant="progress" />
      <ScrollView
        style={s.scrollView}
        contentContainerStyle={[
          s.scrollContent,
          { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View
          entering={FadeInDown.delay(50).duration(350)}
          style={s.header}
        >
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            style={[s.backBtn, {
              backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.84)',
              borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
            }]}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={18} color={isDark ? '#FFFFFF' : '#17171A'} />
          </Pressable>

          <Text
            style={[s.pageTitle, { color: isDark ? '#FFFFFF' : '#1A1A1A' }]}
            accessibilityRole="header"
          >
            Achievements
          </Text>
          <Pressable
            onPress={async () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              try {
                await Share.share({
                  message: `I'm level ${level} with ${currentXp.toLocaleString()} XP on Declutterly! Check out my achievements!`,
                });
              } catch {
                // User cancelled share
              }
            }}
            style={[s.headerIconBtn, {
              backgroundColor: isDark ? '#141414' : 'rgba(255,255,255,0.84)',
              borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
              borderWidth: 1,
            }]}
            accessibilityLabel="Share achievements"
            accessibilityRole="button"
          >
            <Ionicons name="share-outline" size={18} color={isDark ? '#FFFFFF' : '#17171A'} />
          </Pressable>
        </Animated.View>

        {/* XP Level Card */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(350)}
          style={s.cardWrapper}
        >
          <View style={[s.lvlCard, {
            backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#FFFFFF',
            borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E8E8E8',
            ...(isDark ? {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 24,
            } : {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.04,
              shadowRadius: 12,
            }),
          }]}>
            {/* Level Badge */}
            <View style={[s.lvlBadge, {
              backgroundColor: isDark ? '#1A1A1A' : '#E0E0E0',
            }]}>
              <Text style={[s.lvlNumber, { color: isDark ? '#FFFFFF' : '#1A1A1A' }]}>
                {level}
              </Text>
              <Text style={[s.lvlLabel, { color: '#888888' }]}>
                LVL
              </Text>
            </View>

            {/* Level Info */}
            <View style={s.lvlRight}>
              <Text style={[s.lvlTitle, { color: isDark ? '#AAAAAA' : '#555555' }]}>
                {level >= 10 ? 'Master Organizer' : level >= 5 ? 'Cleaning Pro' : level >= 3 ? 'Rising Declutterer' : 'Getting Started'}
              </Text>
              <Text style={[s.xpText, { color: isDark ? '#FFFFFF' : '#1A1A1A' }]}>
                {currentXp.toLocaleString()} XP
              </Text>
              <Text style={[s.xpNext, { color: '#888888' }]}>
                {xpForNextLevel} XP to Level {level + 1}
              </Text>
              {/* XP Progress Bar */}
              <View style={[s.xpTrack, {
                backgroundColor: isDark ? '#1A1A1A' : '#E0E0E0',
              }]}>
                <View style={[s.xpFill, {
                  backgroundColor: isDark ? '#FFFFFF' : '#1A1A1A',
                  width: `${Math.max(xpProgressPercent, 6)}%`,
                }]} />
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Streak Card */}
        <Animated.View
          entering={FadeInDown.delay(150).duration(350)}
          style={s.cardWrapper}
        >
          <View style={[s.streakCard, {
            backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#FFFFFF',
            borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E8E8E8',
            ...(isDark ? {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 24,
            } : {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.04,
              shadowRadius: 12,
            }),
          }]}>
            {/* Left side: Fire + Number + DAYS */}
            <View style={s.streakLeft}>
              <Text style={s.streakFire}>{'\u{1F525}'}</Text>
              <Text style={[s.streakNumber, { color: isDark ? '#FFFFFF' : '#1A1A1A' }]}>
                {currentStreak}
              </Text>
              <Text style={[s.streakDays, { color: '#707070' }]}>
                DAYS
              </Text>
            </View>

            {/* Right side: Info */}
            <View style={s.streakRight}>
              <Text style={[s.streakTitle, { color: isDark ? '#FFFFFF' : '#1A1A1A' }]}>
                Current Streak
              </Text>
              <Text style={[s.streakRecord, { color: isDark ? '#707070' : '#888888' }]}>
                {isDark ? '\u{1F3C6}  ' : ''}Record: {longestStreak} days
              </Text>
              <Text style={[s.streakMilestone, { color: isDark ? '#AAAAAA' : '#555555' }]}>
                {nextMilestone - currentStreak <= 2
                  ? `Almost there! ${nextMilestone - currentStreak} day${nextMilestone - currentStreak === 1 ? '' : 's'} to ${nextMilestone}-day milestone`
                  : `Next milestone: ${nextMilestone} days`}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* EARNED BADGES Label */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(350)}
          style={s.badgesLabelWrapper}
        >
          <Text style={[s.badgesLabel, {
            color: isDark ? 'rgba(255,255,255,0.25)' : '#888888',
          }]}>
            EARNED BADGES
          </Text>
        </Animated.View>

        {/* Badge Grid (2 columns, 3 rows) */}
        <Animated.View
          entering={FadeInDown.delay(250).duration(350)}
          style={s.badgeGrid}
        >
          {displayBadgeData.map((badge, index) => (
            <Animated.View
              key={`badge-${index}`}
              entering={FadeInUp.delay(300 + index * 60).duration(350)}
            >
              <Pressable
                onPress={() => {
                  if (!badge.locked && (badge as any).badge) {
                    handleBadgePress((badge as any).badge);
                  } else {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                }}
                style={({ pressed }) => [
                  s.badgeCard,
                  {
                    backgroundColor: badge.locked
                      ? (isDark ? 'rgba(255,255,255,0.03)' : '#FFFFFF')
                      : (isDark ? 'rgba(255,255,255,0.06)' : '#FFFFFF'),
                    borderColor: badge.locked
                      ? (isDark ? 'rgba(255,255,255,0.06)' : '#E8E8E8')
                      : (isDark ? 'rgba(255,255,255,0.08)' : '#E8E8E8'),
                    transform: [{ scale: pressed ? 0.97 : 1 }],
                  },
                ]}
                accessibilityLabel={badge.locked ? 'Locked badge' : `${badge.name} badge`}
              >
                <Text style={[s.badgeEmoji, {
                  color: badge.locked ? '#555555' : (isDark ? '#FFFFFF' : '#1A1A1A'),
                }]}>
                  {badge.emoji}
                </Text>
                <Text style={[s.badgeName, {
                  color: badge.locked
                    ? (isDark ? '#555555' : '#999999')
                    : (index === 4
                      ? (isDark ? '#888888' : '#666666') // Neat Freak is muted
                      : (isDark ? '#FFFFFF' : (
                        index === 0 || index === 2 ? '#1A1A1A' : '#555555'
                      ))),
                }]}>
                  {badge.name}
                </Text>
                <Text style={[s.badgeStars, {
                  color: badge.locked
                    ? (isDark ? '#555555' : '#AAAAAA')
                    : (index === 4
                      ? (isDark ? 'rgba(136,136,136,0.38)' : '#666666') // Neat Freak muted stars
                      : (isDark ? 'rgba(255,255,255,0.38)' : (
                        index === 0 ? '#1A1A1A' : '#555555'
                      ))),
                  fontSize: badge.locked ? 11 : 12,
                }]}>
                  {badge.stars}
                </Text>
              </Pressable>
            </Animated.View>
          ))}
        </Animated.View>
      </ScrollView>


      {/* Badge Detail Modal */}
      <BadgeModal
        badge={selectedBadge}
        isUnlocked={selectedBadge ? unlockedIds.has(selectedBadge.id) : false}
        progress={selectedBadge ? getBadgeProgress(selectedBadge) : { current: 0, target: 0, percentage: 0 }}
        visible={showModal}
        onClose={closeModal}
        onShare={selectedBadge ? () => handleShare(selectedBadge) : undefined}
      />
    </View>
  );
}

// Badge Detail Modal
function BadgeModal({
  badge,
  isUnlocked,
  progress: _progress,
  visible,
  onClose,
  onShare,
}: {
  badge: Badge | null;
  isUnlocked: boolean;
  progress: { current: number; target: number; percentage: number };
  visible: boolean;
  onClose: () => void;
  onShare?: () => void;
}) {
  const colorScheme = (useColorScheme() ?? 'dark') as 'light' | 'dark';
  const colors = Colors[colorScheme];

  if (!badge) return null;

  const displayType = badge.type === 'longComeback' ? 'comeback' : badge.type;
  const categoryInfo = CATEGORIES.find(c => c.id === displayType);
  const categoryColor = BADGE_COLORS[badge.type] || categoryInfo?.color || '#6B7280';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(200)}
        style={s.modalOverlay}
      >
        <Pressable style={s.modalBackdrop} onPress={onClose}>
          <BlurView
            intensity={80}
            tint="dark"
            style={StyleSheet.absoluteFill}
          />
        </Pressable>

        <Animated.View
          entering={SlideInUp.duration(350).damping(20)}
          exiting={SlideOutDown.duration(200)}
          style={s.modalContent}
        >
          <View
            style={[
              s.modalCard,
              {
                backgroundColor: colorScheme === 'dark'
                  ? 'rgba(30, 30, 30, 0.95)'
                  : 'rgba(255, 255, 255, 0.98)',
              },
            ]}
          >
            {/* Close button */}
            <Pressable
              onPress={onClose}
              style={[
                s.modalCloseButton,
                {
                  backgroundColor: colorScheme === 'dark'
                    ? 'rgba(255, 255, 255, 0.1)'
                    : 'rgba(0, 0, 0, 0.05)',
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Close badge detail"
            >
              <Text style={[Typography.body, { color: colors.textSecondary }]}>{'\u{2715}'}</Text>
            </Pressable>

            {/* Badge display */}
            <View style={s.modalBadgeContainer}>
              {isUnlocked && (
                <LinearGradient
                  colors={[categoryColor + '40', categoryColor + '10']}
                  style={s.modalBadgeGlow}
                />
              )}
              <View
                style={[
                  s.modalBadgeCircle,
                  {
                    borderColor: isUnlocked ? categoryColor : 'rgba(255, 255, 255, 0.1)',
                    borderWidth: isUnlocked ? 3 : 1,
                  },
                ]}
              >
                <Text style={s.modalBadgeEmoji}>{badge.emoji}</Text>
                {!isUnlocked && (
                  <View style={s.modalLockOverlay}>
                    <Text style={{ fontSize: 28 }}>{'\u{1F512}'}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Badge info */}
            <Text style={[Typography.title1, { color: colors.text, textAlign: 'center', marginTop: 20 }]}>
              {badge.name}
            </Text>

            <Text style={[Typography.body, { color: colors.textSecondary, textAlign: 'center', marginTop: 8 }]}>
              {badge.description}
            </Text>

            {/* Category tag */}
            <View style={[s.modalCategoryTag, { backgroundColor: categoryColor + '20' }]}>
              <Text style={{ fontSize: 16 }}>{categoryInfo?.emoji}</Text>
              <Text style={[Typography.caption1, { color: categoryColor, marginLeft: 6, fontWeight: '500' }]}>
                {categoryInfo?.label}
              </Text>
            </View>

            {/* Celebration / locked */}
            <View style={s.modalProgressSection}>
              {isUnlocked ? (
                <View style={s.modalCelebration}>
                  <Text style={{ fontSize: 40 }}>{'\u{1F389}'}</Text>
                  <Text style={[Typography.headline, { color: colors.success, marginTop: 12 }]}>
                    Badge Earned!
                  </Text>
                </View>
              ) : (
                <View style={s.modalCelebration}>
                  <Text style={{ fontSize: 40 }}>{'\u{1F512}'}</Text>
                  <Text style={[Typography.headline, { color: colors.textSecondary, marginTop: 12 }]}>
                    Keep going!
                  </Text>
                  <Text style={[Typography.body, { color: colors.textTertiary, marginTop: 8, textAlign: 'center' }]}>
                    {_progress.current > 0
                      ? `${_progress.current}/${badge.requirement} ${badge.type} done (${_progress.percentage}%)`
                      : `${badge.requirement} ${badge.type} needed`}
                  </Text>
                  {_progress.current > 0 && (
                    <View style={{ width: '80%', height: 6, borderRadius: 3, backgroundColor: 'rgba(128,128,128,0.2)', marginTop: 12, overflow: 'hidden' }}>
                      <View style={{ height: '100%', borderRadius: 3, backgroundColor: categoryColor, width: `${Math.min(_progress.percentage, 100)}%` }} />
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* Share button for unlocked */}
            {isUnlocked && onShare && (
              <Pressable
                onPress={onShare}
                style={({ pressed }) => [
                  s.modalShareButton,
                  { opacity: pressed ? 0.8 : 1 },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Share this achievement"
              >
                <LinearGradient
                  colors={[categoryColor, categoryColor + 'CC']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <Text style={[Typography.headline, { color: '#FFFFFF' }]}>
                  Share Achievement
                </Text>
              </Pressable>
            )}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const BADGE_CARD_WIDTH = (SCREEN_WIDTH - 32 - 12) / 2; // 16px padding each side, 12px gap

const s = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 0 },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    height: 60,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: {
    fontFamily: DISPLAY_FONT,
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Card wrapper
  cardWrapper: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },

  // XP/Level Card
  lvlCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    paddingHorizontal: 20,
    gap: 20,
    height: 116,
  },
  lvlBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  lvlNumber: {
    fontSize: 26,
    fontWeight: '700',
  },
  lvlLabel: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 1,
  },
  lvlRight: {
    flex: 1,
    justifyContent: 'center',
    gap: 6,
  },
  lvlTitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  xpText: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  xpNext: {
    fontSize: 11,
    fontWeight: '400',
  },
  xpTrack: {
    height: 7,
    borderRadius: 4,
    overflow: 'hidden',
  },
  xpFill: {
    height: 7,
    borderRadius: 4,
    maxWidth: '100%',
  },

  // Streak Card
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 16,
    height: 100,
  },
  streakLeft: {
    width: 68,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  streakFire: {
    fontSize: 34,
  },
  streakNumber: {
    fontSize: 24,
    fontWeight: '700',
  },
  streakDays: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 1,
  },
  streakRight: {
    flex: 1,
    justifyContent: 'center',
    gap: 6,
  },
  streakTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  streakRecord: {
    fontSize: 12,
    fontWeight: '400',
  },
  streakMilestone: {
    fontSize: 11,
    fontWeight: '400',
  },

  // Badges Label
  badgesLabelWrapper: {
    paddingHorizontal: 20,
    marginTop: 14,
    marginBottom: 14,
  },
  badgesLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.5,
  },

  // Badge Grid
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  badgeCard: {
    width: BADGE_CARD_WIDTH,
    height: 106,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  badgeEmoji: {
    fontSize: 30,
  },
  badgeName: {
    fontSize: 13,
    fontWeight: '600',
  },
  badgeStars: {
    fontSize: 12,
    fontWeight: '400',
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    width: SCREEN_WIDTH - 48,
    maxWidth: 360,
  },
  modalCard: {
    borderRadius: BorderRadius.card,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  modalCloseButton: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  modalBadgeContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.ml,
  },
  modalBadgeGlow: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
  },
  modalBadgeCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  modalBadgeEmoji: {
    fontSize: 48,
  },
  modalLockOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  modalCategoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs,
    borderRadius: BorderRadius.input,
    marginTop: Spacing.md,
  },
  modalProgressSection: {
    marginTop: Spacing.lg,
    alignItems: 'center',
  },
  modalCelebration: {
    alignItems: 'center',
  },
  modalShareButton: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.button,
    overflow: 'hidden',
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
