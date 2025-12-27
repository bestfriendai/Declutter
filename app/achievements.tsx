/**
 * Declutterly - Achievements Gallery Screen
 * Apple TV style badge collection with categories and detail modals
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  useColorScheme,
  Dimensions,
  Modal,
  Share,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInRight,
  FadeInUp,
  FadeOut,
  SlideInUp,
  SlideOutDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { Colors } from '@/constants/Colors';
import { Typography } from '@/theme/typography';
import { useDeclutter } from '@/context/DeclutterContext';
import { BADGES, Badge } from '@/types/declutter';
import { GlassCard } from '@/components/ui/GlassCard';
import { useCardPress } from '@/hooks/useAnimatedPress';
import { SingleRing } from '@/components/ui/ActivityRings';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type BadgeCategory = 'all' | 'tasks' | 'rooms' | 'streak' | 'time';

interface CategoryInfo {
  id: BadgeCategory;
  label: string;
  emoji: string;
  color: string;
}

const CATEGORIES: CategoryInfo[] = [
  { id: 'all', label: 'All', emoji: '🏆', color: '#F59E0B' },
  { id: 'tasks', label: 'Tasks', emoji: '✅', color: '#22C55E' },
  { id: 'rooms', label: 'Rooms', emoji: '🏠', color: '#3B82F6' },
  { id: 'streak', label: 'Streaks', emoji: '🔥', color: '#EF4444' },
  { id: 'time', label: 'Time', emoji: '⏱️', color: '#8B5CF6' },
];

export default function AchievementsScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const { stats } = useDeclutter();

  const [selectedCategory, setSelectedCategory] = useState<BadgeCategory>('all');
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Get badges data
  const unlockedBadges = stats.badges;
  const unlockedIds = new Set(unlockedBadges.map(b => b.id));

  // Filter badges by category
  const filteredBadges = useMemo(() => {
    if (selectedCategory === 'all') return BADGES;
    return BADGES.filter(b => b.type === selectedCategory);
  }, [selectedCategory]);

  // Group badges by type
  const badgesByCategory = useMemo(() => {
    const grouped: Record<string, Badge[]> = {
      tasks: [],
      rooms: [],
      streak: [],
      time: [],
    };
    BADGES.forEach(badge => {
      if (grouped[badge.type]) {
        grouped[badge.type].push(badge);
      }
    });
    return grouped;
  }, []);

  // Calculate stats
  const totalBadges = BADGES.length;
  const earnedBadges = unlockedBadges.length;
  const completionPercentage = Math.round((earnedBadges / totalBadges) * 100);

  // Get progress for a badge
  const getBadgeProgress = useCallback((badge: Badge) => {
    let current = 0;
    switch (badge.type) {
      case 'tasks':
        current = stats.totalTasksCompleted;
        break;
      case 'rooms':
        current = stats.totalRoomsCleaned;
        break;
      case 'streak':
        current = Math.max(stats.currentStreak, stats.longestStreak);
        break;
      case 'time':
        current = stats.totalMinutesCleaned;
        break;
    }
    return {
      current,
      target: badge.requirement,
      percentage: Math.min(100, Math.round((current / badge.requirement) * 100)),
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
        message: `🎉 I earned the "${badge.name}" ${badge.emoji} badge in Declutterly! ${badge.description}`,
      });
    } catch (error) {
      console.log('Share error:', error);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setTimeout(() => setSelectedBadge(null), 300);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <Animated.View
          entering={FadeInDown.delay(100).springify()}
          style={styles.heroSection}
        >
          <GlassCard variant="hero" style={styles.heroCard}>
            <LinearGradient
              colors={['rgba(139, 92, 246, 0.3)', 'rgba(59, 130, 246, 0.2)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />

            <View style={styles.heroContent}>
              <View style={styles.heroRingContainer}>
                <SingleRing
                  progress={completionPercentage}
                  size={120}
                  strokeWidth={10}
                  color="#F59E0B"
                  backgroundColor="rgba(255, 255, 255, 0.1)"
                />
                <View style={styles.heroRingCenter}>
                  <Text style={[Typography.display1, { color: '#FFFFFF' }]}>
                    {earnedBadges}
                  </Text>
                  <Text style={[Typography.caption1, { color: 'rgba(255,255,255,0.7)' }]}>
                    of {totalBadges}
                  </Text>
                </View>
              </View>

              <View style={styles.heroTextContent}>
                <Text style={[Typography.title1, { color: '#FFFFFF' }]}>
                  Achievement Progress
                </Text>
                <Text style={[Typography.body, { color: 'rgba(255,255,255,0.7)', marginTop: 8 }]}>
                  {earnedBadges === 0
                    ? "Start your journey to unlock badges!"
                    : earnedBadges === totalBadges
                    ? "🎉 You've unlocked all badges!"
                    : `${totalBadges - earnedBadges} more to go!`}
                </Text>

                {/* Quick stats */}
                <View style={styles.heroStats}>
                  {CATEGORIES.slice(1).map((cat, index) => {
                    const categoryBadges = badgesByCategory[cat.id] || [];
                    const unlockedInCategory = categoryBadges.filter(b => unlockedIds.has(b.id)).length;
                    return (
                      <View key={cat.id} style={styles.heroStat}>
                        <Text style={{ fontSize: 20 }}>{cat.emoji}</Text>
                        <Text style={[Typography.caption1Medium, { color: '#FFFFFF', marginTop: 4 }]}>
                          {unlockedInCategory}/{categoryBadges.length}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </View>
          </GlassCard>
        </Animated.View>

        {/* Category Filter Pills */}
        <Animated.View
          entering={FadeInDown.delay(200).springify()}
          style={styles.filterSection}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            {CATEGORIES.map((category, index) => (
              <FilterPill
                key={category.id}
                category={category}
                isSelected={selectedCategory === category.id}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedCategory(category.id);
                }}
                delay={index * 50}
              />
            ))}
          </ScrollView>
        </Animated.View>

        {/* Badges Grid or Categories */}
        {selectedCategory === 'all' ? (
          // Show by categories with horizontal scrolling
          <>
            {CATEGORIES.slice(1).map((category, categoryIndex) => {
              const categoryBadges = badgesByCategory[category.id] || [];
              if (categoryBadges.length === 0) return null;

              const unlockedInCategory = categoryBadges.filter(b => unlockedIds.has(b.id));

              return (
                <Animated.View
                  key={category.id}
                  entering={FadeInDown.delay(300 + categoryIndex * 100).springify()}
                  style={styles.categorySection}
                >
                  <View style={styles.categoryHeader}>
                    <View style={styles.categoryTitleRow}>
                      <Text style={{ fontSize: 24, marginRight: 8 }}>{category.emoji}</Text>
                      <Text style={[Typography.title3, { color: colors.text }]}>
                        {category.label}
                      </Text>
                      <View style={[styles.categoryCount, { backgroundColor: category.color }]}>
                        <Text style={[Typography.caption2, { color: '#FFFFFF' }]}>
                          {unlockedInCategory.length}/{categoryBadges.length}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.badgesScroll}
                  >
                    {categoryBadges.map((badge, index) => (
                      <BadgeCard
                        key={badge.id}
                        badge={badge}
                        isUnlocked={unlockedIds.has(badge.id)}
                        progress={getBadgeProgress(badge)}
                        onPress={() => handleBadgePress(badge)}
                        delay={index * 50}
                        categoryColor={category.color}
                      />
                    ))}
                  </ScrollView>
                </Animated.View>
              );
            })}
          </>
        ) : (
          // Show grid for selected category
          <Animated.View
            entering={FadeIn.duration(300)}
            style={styles.gridSection}
          >
            <View style={styles.badgesGrid}>
              {filteredBadges.map((badge, index) => (
                <BadgeCard
                  key={badge.id}
                  badge={badge}
                  isUnlocked={unlockedIds.has(badge.id)}
                  progress={getBadgeProgress(badge)}
                  onPress={() => handleBadgePress(badge)}
                  delay={index * 50}
                  categoryColor={CATEGORIES.find(c => c.id === badge.type)?.color || '#6B7280'}
                  style={styles.gridBadge}
                />
              ))}
            </View>
          </Animated.View>
        )}

        {/* Motivation Section */}
        <Animated.View
          entering={FadeInDown.delay(600).springify()}
          style={styles.motivationSection}
        >
          <GlassCard variant="elevated" style={styles.motivationCard}>
            <Text style={styles.motivationEmoji}>
              {earnedBadges === 0 ? '🌱' : earnedBadges < 5 ? '🚀' : earnedBadges < 10 ? '⭐' : '👑'}
            </Text>
            <Text style={[Typography.headline, { color: colors.text, textAlign: 'center', marginTop: 12 }]}>
              {earnedBadges === 0
                ? "Every journey starts with a single step"
                : earnedBadges < 5
                ? "You're making great progress!"
                : earnedBadges < 10
                ? "You're a decluttering star!"
                : "You're a true Declutter Master!"}
            </Text>
            <Text style={[Typography.subheadline, { color: colors.textSecondary, textAlign: 'center', marginTop: 8 }]}>
              Keep completing tasks to unlock more badges
            </Text>
          </GlassCard>
        </Animated.View>
      </ScrollView>

      {/* Back Button */}
      <Animated.View
        entering={FadeInDown.delay(50)}
        style={[styles.backButton, { top: insets.top + 12 }]}
      >
        <AnimatedPressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          style={({ pressed }) => [
            styles.backButtonInner,
            {
              backgroundColor: colorScheme === 'dark'
                ? 'rgba(255, 255, 255, 0.1)'
                : 'rgba(0, 0, 0, 0.05)',
              transform: [{ scale: pressed ? 0.95 : 1 }],
            },
          ]}
        >
          <BlurView
            intensity={60}
            tint={colorScheme === 'dark' ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />
          <Text style={[Typography.body, { color: colors.text }]}>← Achievements</Text>
        </AnimatedPressable>
      </Animated.View>

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

// Filter Pill Component
function FilterPill({
  category,
  isSelected,
  onPress,
  delay,
}: {
  category: CategoryInfo;
  isSelected: boolean;
  onPress: () => void;
  delay: number;
}) {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View entering={FadeInRight.delay(delay)}>
      <AnimatedPressable
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.95); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        style={animatedStyle}
      >
        <View
          style={[
            styles.filterPill,
            {
              backgroundColor: isSelected
                ? category.color
                : colorScheme === 'dark'
                ? 'rgba(255, 255, 255, 0.08)'
                : 'rgba(0, 0, 0, 0.05)',
              borderColor: isSelected
                ? category.color
                : colorScheme === 'dark'
                ? 'rgba(255, 255, 255, 0.1)'
                : 'rgba(0, 0, 0, 0.08)',
            },
          ]}
        >
          <Text style={{ fontSize: 16 }}>{category.emoji}</Text>
          <Text
            style={[
              Typography.subheadlineMedium,
              { color: isSelected ? '#FFFFFF' : colors.text, marginLeft: 6 },
            ]}
          >
            {category.label}
          </Text>
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
}

// Badge Card Component
function BadgeCard({
  badge,
  isUnlocked,
  progress,
  onPress,
  delay,
  categoryColor,
  style,
}: {
  badge: Badge;
  isUnlocked: boolean;
  progress: { current: number; target: number; percentage: number };
  onPress: () => void;
  delay: number;
  categoryColor: string;
  style?: any;
}) {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const { animatedStyle, onPressIn, onPressOut } = useCardPress();

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={[animatedStyle, style]}
    >
      <Animated.View
        entering={FadeInUp.delay(delay).springify()}
        style={[
          styles.badgeCard,
          {
            backgroundColor: colorScheme === 'dark'
              ? isUnlocked
                ? 'rgba(255, 255, 255, 0.1)'
                : 'rgba(255, 255, 255, 0.05)'
              : isUnlocked
              ? 'rgba(0, 0, 0, 0.05)'
              : 'rgba(0, 0, 0, 0.02)',
            borderColor: isUnlocked
              ? categoryColor
              : colorScheme === 'dark'
              ? 'rgba(255, 255, 255, 0.08)'
              : 'rgba(0, 0, 0, 0.05)',
            borderWidth: isUnlocked ? 2 : 0.5,
          },
        ]}
      >
        {/* Glow effect for unlocked */}
        {isUnlocked && (
          <View
            style={[
              styles.badgeGlow,
              { backgroundColor: categoryColor, opacity: 0.15 },
            ]}
          />
        )}

        {/* Badge emoji */}
        <View style={[styles.badgeEmojiContainer, !isUnlocked && styles.locked]}>
          <Text style={styles.badgeEmoji}>{badge.emoji}</Text>
          {!isUnlocked && (
            <View style={styles.lockOverlay}>
              <Text style={styles.lockIcon}>🔒</Text>
            </View>
          )}
        </View>

        {/* Badge name */}
        <Text
          style={[
            Typography.caption1Medium,
            {
              color: isUnlocked ? colors.text : colors.textSecondary,
              textAlign: 'center',
              marginTop: 8,
            },
          ]}
          numberOfLines={2}
        >
          {badge.name}
        </Text>

        {/* Progress or checkmark */}
        {isUnlocked ? (
          <View style={[styles.unlockedBadge, { backgroundColor: categoryColor }]}>
            <Text style={styles.checkmark}>✓</Text>
          </View>
        ) : (
          <View style={styles.progressContainer}>
            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${progress.percentage}%`, backgroundColor: categoryColor },
                ]}
              />
            </View>
            <Text style={[Typography.caption2, { color: colors.textTertiary, marginTop: 4 }]}>
              {progress.percentage}%
            </Text>
          </View>
        )}
      </Animated.View>
    </AnimatedPressable>
  );
}

// Badge Detail Modal
function BadgeModal({
  badge,
  isUnlocked,
  progress,
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
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];

  if (!badge) return null;

  const categoryInfo = CATEGORIES.find(c => c.id === badge.type);
  const categoryColor = categoryInfo?.color || '#6B7280';

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
        style={styles.modalOverlay}
      >
        <Pressable style={styles.modalBackdrop} onPress={onClose}>
          <BlurView
            intensity={80}
            tint="dark"
            style={StyleSheet.absoluteFill}
          />
        </Pressable>

        <Animated.View
          entering={SlideInUp.springify().damping(20)}
          exiting={SlideOutDown.duration(200)}
          style={styles.modalContent}
        >
          <View
            style={[
              styles.modalCard,
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
                styles.modalCloseButton,
                {
                  backgroundColor: colorScheme === 'dark'
                    ? 'rgba(255, 255, 255, 0.1)'
                    : 'rgba(0, 0, 0, 0.05)',
                },
              ]}
            >
              <Text style={[Typography.body, { color: colors.textSecondary }]}>✕</Text>
            </Pressable>

            {/* Badge display */}
            <View style={styles.modalBadgeContainer}>
              {isUnlocked && (
                <LinearGradient
                  colors={[categoryColor + '40', categoryColor + '10']}
                  style={styles.modalBadgeGlow}
                />
              )}
              <View
                style={[
                  styles.modalBadgeCircle,
                  {
                    borderColor: isUnlocked ? categoryColor : 'rgba(255, 255, 255, 0.1)',
                    borderWidth: isUnlocked ? 3 : 1,
                  },
                ]}
              >
                <Text style={styles.modalBadgeEmoji}>{badge.emoji}</Text>
                {!isUnlocked && (
                  <View style={styles.modalLockOverlay}>
                    <Text style={{ fontSize: 28 }}>🔒</Text>
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
            <View style={[styles.modalCategoryTag, { backgroundColor: categoryColor + '20' }]}>
              <Text style={{ fontSize: 16 }}>{categoryInfo?.emoji}</Text>
              <Text style={[Typography.caption1Medium, { color: categoryColor, marginLeft: 6 }]}>
                {categoryInfo?.label}
              </Text>
            </View>

            {/* Progress ring or celebration */}
            <View style={styles.modalProgressSection}>
              {isUnlocked ? (
                <View style={styles.modalCelebration}>
                  <Text style={{ fontSize: 40 }}>🎉</Text>
                  <Text style={[Typography.headline, { color: colors.success, marginTop: 12 }]}>
                    Badge Unlocked!
                  </Text>
                </View>
              ) : (
                <>
                  <SingleRing
                    progress={progress.percentage}
                    size={100}
                    strokeWidth={8}
                    color={categoryColor}
                    backgroundColor="rgba(255, 255, 255, 0.1)"
                  />
                  <View style={styles.modalProgressCenter}>
                    <Text style={[Typography.title2, { color: colors.text }]}>
                      {progress.percentage}%
                    </Text>
                  </View>
                  <Text style={[Typography.body, { color: colors.textSecondary, marginTop: 12 }]}>
                    {progress.current} / {progress.target} {badge.type}
                  </Text>
                </>
              )}
            </View>

            {/* Share button for unlocked */}
            {isUnlocked && onShare && (
              <Pressable
                onPress={onShare}
                style={({ pressed }) => [
                  styles.modalShareButton,
                  { opacity: pressed ? 0.8 : 1 },
                ]}
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
  backButton: {
    position: 'absolute',
    left: 16,
    zIndex: 100,
  },
  backButtonInner: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    overflow: 'hidden',
  },
  heroSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  heroCard: {
    padding: 24,
    overflow: 'hidden',
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroRingContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroRingCenter: {
    position: 'absolute',
    alignItems: 'center',
  },
  heroTextContent: {
    flex: 1,
    marginLeft: 20,
  },
  heroStats: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 16,
  },
  heroStat: {
    alignItems: 'center',
  },
  filterSection: {
    marginBottom: 20,
  },
  filterScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryHeader: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  categoryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryCount: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgesScroll: {
    paddingHorizontal: 20,
    gap: 12,
  },
  gridSection: {
    paddingHorizontal: 20,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridBadge: {
    width: (SCREEN_WIDTH - 64) / 3,
  },
  badgeCard: {
    width: 120,
    height: 150,
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  badgeGlow: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    height: 80,
    borderRadius: 40,
  },
  badgeEmojiContainer: {
    position: 'relative',
  },
  locked: {
    opacity: 0.5,
  },
  badgeEmoji: {
    fontSize: 40,
  },
  lockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockIcon: {
    fontSize: 18,
  },
  unlockedBadge: {
    marginTop: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  progressContainer: {
    marginTop: 8,
    width: '100%',
    alignItems: 'center',
  },
  progressBarBg: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  motivationSection: {
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
  },
  motivationCard: {
    padding: 24,
    alignItems: 'center',
  },
  motivationEmoji: {
    fontSize: 48,
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
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  modalBadgeContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 16,
  },
  modalProgressSection: {
    marginTop: 24,
    alignItems: 'center',
    position: 'relative',
  },
  modalProgressCenter: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCelebration: {
    alignItems: 'center',
  },
  modalShareButton: {
    marginTop: 24,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 16,
    overflow: 'hidden',
  },
});
