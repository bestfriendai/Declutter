/**
 * Declutterly - Collection Screen
 * View all collected items with rarity, stats, and animations
 */

import { Colors } from '@/constants/Colors';
import { useDeclutter } from '@/context/DeclutterContext';
import { Typography } from '@/theme/typography';
import { Spacing, BorderRadius } from '@/theme/spacing';
import {
    Collectible,
    CollectibleCategory,
    CollectibleRarity,
    COLLECTIBLES,
    RARITY_COLORS,
} from '@/types/declutter';
import { FlashList } from '@shopify/flash-list';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
    Pressable,
    Text as RNText,
    ScrollView,
    StyleSheet,
    useColorScheme,
    useWindowDimensions,
    View,
} from 'react-native';
import Animated, {
    FadeIn,
    FadeInDown,
    FadeOut,
    LinearTransition,
    SlideInDown,
    ZoomIn,
    ZoomOut
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type FilterType = 'all' | CollectibleCategory;

export default function CollectionScreen() {
  const rawColorScheme = useColorScheme();
  const colorScheme = rawColorScheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const ITEM_SIZE = (width - 60) / 4;

  const { collection, collectionStats, stats } = useDeclutter();
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedItem, setSelectedItem] = useState<Collectible | null>(null);

  // Get count of each collectible
  const collectibleCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    collection.forEach(item => {
      counts[item.collectibleId] = (counts[item.collectibleId] || 0) + 1;
    });
    return counts;
  }, [collection]);

  // Filter collectibles
  const filteredCollectibles = useMemo(() => {
    let items = COLLECTIBLES;
    if (filter !== 'all') {
      items = items.filter(c => c.category === filter);
    }
    return items;
  }, [filter]);

  // Calculate completion percentage
  const totalCollectibles = COLLECTIBLES.filter(c => !c.isSpecial).length;
  const uniqueOwned = collectionStats.uniqueCollected;
  const completionPercent = Math.round((uniqueOwned / totalCollectibles) * 100);

  const categories: { key: FilterType; label: string; emoji: string }[] = [
    { key: 'all', label: 'All', emoji: '📦' },
    { key: 'sparkles', label: 'Sparkles', emoji: '✨' },
    { key: 'tools', label: 'Tools', emoji: '🧹' },
    { key: 'creatures', label: 'Creatures', emoji: '🐰' },
    { key: 'treasures', label: 'Treasures', emoji: '💎' },
    { key: 'special', label: 'Special', emoji: '⭐' },
  ];

  function handleItemPress(item: Collectible) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedItem(item);
  }

  function getRarityGlow(rarity: CollectibleRarity): string {
    return RARITY_COLORS[rarity] + '40';
  }

  function isOwned(itemId: string): boolean {
    return collectibleCounts[itemId] > 0;
  }

  function canUnlock(item: Collectible): boolean {
    return stats.totalTasksCompleted >= item.requiredTasks;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <Animated.View
        entering={FadeInDown.delay(50).springify()}
        style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}
      >
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
        >
          <RNText style={[Typography.body, { color: colors.primary }]}>Back</RNText>
        </Pressable>
        <RNText style={[Typography.title3, { color: colors.text }]} accessibilityRole="header">Collection</RNText>
        <View style={styles.placeholder} />
      </Animated.View>

      {/* Stats Overview */}
      <Animated.View entering={FadeInDown.delay(100).springify()}>
        <View style={[styles.statsCard, { backgroundColor: colors.card }]}>
          <View style={styles.statsRow} accessibilityRole="summary" accessibilityLabel={`${collectionStats.totalCollected} total collected, ${uniqueOwned} of ${totalCollectibles} unique, ${completionPercent}% complete`}>
            <View style={styles.statItem}>
              <RNText style={[Typography.title1, { color: colors.text }]}>
                {collectionStats.totalCollected}
              </RNText>
              <RNText style={[Typography.caption1, { color: colors.textSecondary }]}>
                Total
              </RNText>
            </View>
            <View style={styles.statItem}>
              <RNText style={[Typography.title1, { color: colors.text }]}>
                {uniqueOwned}/{totalCollectibles}
              </RNText>
              <RNText style={[Typography.caption1, { color: colors.textSecondary }]}>
                Unique
              </RNText>
            </View>
            <View style={styles.statItem}>
              <RNText style={[Typography.title1, { color: colors.primary }]}>
                {completionPercent}%
              </RNText>
              <RNText style={[Typography.caption1, { color: colors.textSecondary }]}>
                Complete
              </RNText>
            </View>
          </View>

          {/* Rarity Breakdown */}
          <View style={styles.rarityRow}>
            {(['common', 'uncommon', 'rare', 'epic', 'legendary'] as CollectibleRarity[]).map(rarity => {
              const countKey = `${rarity}Count` as 'commonCount' | 'uncommonCount' | 'rareCount' | 'epicCount' | 'legendaryCount';
              return (
                <View key={rarity} style={styles.rarityItem} accessibilityLabel={`${rarity}: ${collectionStats[countKey]}`}>
                  <View style={[styles.rarityDot, { backgroundColor: RARITY_COLORS[rarity] }]} />
                  <RNText style={[Typography.caption1Medium, { color: colors.textSecondary }]}>
                    {collectionStats[countKey]}
                  </RNText>
                </View>
              );
            })}
          </View>
        </View>
      </Animated.View>

      {/* Category Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContent}
      >
        {categories.map(cat => (
          <Pressable
            key={cat.key}
            onPress={() => {
              setFilter(cat.key);
              Haptics.selectionAsync();
            }}
            style={[
              styles.filterButton,
              {
                backgroundColor: filter === cat.key ? colors.primary : colors.card,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Filter by ${cat.label}`}
            accessibilityState={{ selected: filter === cat.key }}
          >
            <RNText style={styles.filterEmoji} accessibilityElementsHidden>{cat.emoji}</RNText>
            <RNText
              style={[
                styles.filterText,
                { color: filter === cat.key ? colors.textOnPrimary : colors.text },
              ]}
            >
              {cat.label}
            </RNText>
          </Pressable>
        ))}
      </ScrollView>

      {/* Empty State */}
      {collectionStats.totalCollected === 0 && (
        <View style={[styles.emptyStateContainer, { backgroundColor: colors.background }]}>
          <View style={styles.emptyStateContent}>
            <View style={styles.emptyStateIllustration}>
              <RNText style={styles.emptyStateMainEmoji}>🎁</RNText>
              <View style={styles.emptyStateFloatingEmojis}>
                <RNText style={styles.floatingEmoji1}>✨</RNText>
                <RNText style={styles.floatingEmoji2}>⭐</RNText>
                <RNText style={styles.floatingEmoji3}>💫</RNText>
              </View>
            </View>
            <RNText style={[styles.emptyStateTitle, { color: colors.text }]}>
              Start Your Collection!
            </RNText>
            <RNText style={[styles.emptyStateSubtitle, { color: colors.textSecondary }]}>
              Complete cleaning tasks to discover rare collectibles. Each task has a chance to spawn magical items!
            </RNText>
            <View style={[styles.emptyStateTip, { backgroundColor: colors.primary + '15' }]}>
              <RNText style={[styles.emptyStateTipText, { color: colors.primary }]}>
                💡 Complete your first task to unlock collectible spawns
              </RNText>
            </View>
            <Pressable
              style={[styles.emptyStateCTA, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/camera')}
            >
              <RNText style={[styles.emptyStateCTAText, { color: colors.textOnPrimary }]}>Start Cleaning</RNText>
            </Pressable>
          </View>
        </View>
      )}

      {/* Collection Grid */}
      {collectionStats.totalCollected > 0 && (
      <FlashList
        data={filteredCollectibles}
        numColumns={4}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.gridContent}
        renderItem={({ item }) => {
            const owned = isOwned(item.id);
            const unlockable = canUnlock(item);
            const count = collectibleCounts[item.id] || 0;

            return (
              <AnimatedPressable
                onPress={() => handleItemPress(item)}
                layout={LinearTransition.springify()}
                entering={ZoomIn.delay(50).springify()}
                style={[
                  styles.gridItem,
                  {
                    width: ITEM_SIZE,
                    height: ITEM_SIZE,
                    backgroundColor: owned
                      ? getRarityGlow(item.rarity)
                      : colors.card,
                    borderColor: owned ? RARITY_COLORS[item.rarity] : colors.border,
                    opacity: unlockable ? 1 : 0.5,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={owned
                  ? `${item.name}, ${item.rarity} rarity${count > 1 ? `, owned ${count} times` : ''}`
                  : unlockable ? 'Unknown collectible, tap to view requirements' : 'Locked collectible'}
                accessibilityHint="Double tap to view details"
              >
                <RNText style={[styles.itemEmoji, { opacity: owned ? 1 : 0.3 }]} accessibilityElementsHidden>
                  {owned ? item.emoji : '❓'}
                </RNText>
                {count > 1 && (
                  <View style={[styles.countBadge, { backgroundColor: RARITY_COLORS[item.rarity] }]} accessibilityElementsHidden>
                    <RNText style={[styles.countText, { color: colors.textOnPrimary }]}>x{count}</RNText>
                  </View>
                )}
                {!unlockable && (
                  <View style={styles.lockBadge} accessibilityElementsHidden>
                    <RNText style={styles.lockText}>🔒</RNText>
                  </View>
                )}
              </AnimatedPressable>
            );
          }}
      />
      )}

      {/* Item Detail Modal */}
      {selectedItem && (
        <Animated.View
          style={StyleSheet.absoluteFill}
          pointerEvents="box-none"
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          accessibilityViewIsModal
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setSelectedItem(null)}
            accessibilityRole="button"
            accessibilityLabel="Close details"
          >
            <AnimatedPressable
              entering={SlideInDown.springify().damping(15)}
              exiting={ZoomOut.duration(200)}
              style={[styles.modalContent, { backgroundColor: colors.card, width: width * 0.85 }]}
              onPress={(e) => e.stopPropagation()}
              accessibilityRole="none"
            >
              <View
                style={[
                  styles.modalHeader,
                  { backgroundColor: RARITY_COLORS[selectedItem.rarity] + '30' },
                ]}
              >
              <RNText style={styles.modalEmoji}>{selectedItem.emoji}</RNText>
              <View
                style={[
                  styles.rarityBadge,
                  { backgroundColor: RARITY_COLORS[selectedItem.rarity] },
                ]}
              >
                <RNText style={[styles.rarityBadgeText, { color: colors.textOnPrimary }]}>
                  {selectedItem.rarity.toUpperCase()}
                </RNText>
              </View>
            </View>

            <View style={styles.modalBody}>
              <RNText style={[styles.modalName, { color: colors.text }]}>
                {selectedItem.name}
              </RNText>
              <RNText style={[styles.modalDescription, { color: colors.textSecondary }]}>
                {selectedItem.description}
              </RNText>

              <View style={styles.modalStats}>
                <View style={styles.modalStatItem}>
                  <RNText style={[styles.modalStatValue, { color: colors.primary }]}>
                    +{selectedItem.xpValue}
                  </RNText>
                  <RNText style={[styles.modalStatLabel, { color: colors.textSecondary }]}>
                    XP Value
                  </RNText>
                </View>
                <View style={styles.modalStatItem}>
                  <RNText style={[styles.modalStatValue, { color: colors.text }]}>
                    {collectibleCounts[selectedItem.id] || 0}
                  </RNText>
                  <RNText style={[styles.modalStatLabel, { color: colors.textSecondary }]}>
                    Owned
                  </RNText>
                </View>
                <View style={styles.modalStatItem}>
                  <RNText style={[styles.modalStatValue, { color: colors.text }]}>
                    {Math.round(selectedItem.spawnChance * 100)}%
                  </RNText>
                  <RNText style={[styles.modalStatLabel, { color: colors.textSecondary }]}>
                    Spawn Rate
                  </RNText>
                </View>
              </View>

              {selectedItem.requiredTasks > 0 && (
                <View style={[styles.requirementBox, { backgroundColor: colors.background }]}>
                  <RNText style={[styles.requirementText, { color: colors.textSecondary }]}>
                    {stats.totalTasksCompleted >= selectedItem.requiredTasks
                      ? '✅ Unlocked'
                      : `🔒 Complete ${selectedItem.requiredTasks} tasks to unlock`}
                  </RNText>
                </View>
              )}
            </View>

              <Pressable
                style={[styles.closeButton, { backgroundColor: colors.primary }]}
                onPress={() => setSelectedItem(null)}
                accessibilityRole="button"
                accessibilityLabel="Close details"
              >
                <RNText style={[styles.closeButtonText, { color: colors.textOnPrimary }]}>Close</RNText>
              </Pressable>
            </AnimatedPressable>
          </Pressable>
        </Animated.View>
      )}
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
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  backButton: {
    padding: Spacing.xs,
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
  },
  placeholder: {
    width: 50,
  },
  statsCard: {
    marginHorizontal: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.card,
    marginBottom: Spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.md,
  },
  statItem: {
    alignItems: 'center',
  },
  rarityRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  rarityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xxs,
  },
  rarityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  filterScroll: {
    maxHeight: 50,
    marginBottom: Spacing.md,
  },
  filterContent: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.xs,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.chip,
    gap: 6,
    minHeight: 44,
  },
  filterEmoji: {
    fontSize: 16,
  },
  filterText: {
    ...Typography.caption1Medium,
  },
  gridScroll: {
    flex: 1,
  },
  gridContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridItem: {
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemEmoji: {
    fontSize: 28,
  },
  countBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  countText: {
    fontSize: 10,
    fontWeight: '700',
  },
  lockBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
  },
  lockText: {
    fontSize: 12,
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: BorderRadius.card,
    overflow: 'hidden',
  },
  modalHeader: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  modalEmoji: {
    fontSize: 64,
  },
  rarityBadge: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rarityBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  modalBody: {
    padding: Spacing.ml,
  },
  modalName: {
    ...Typography.title2,
    textAlign: 'center',
  },
  modalDescription: {
    ...Typography.subheadline,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  modalStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: Spacing.ml,
    paddingTop: Spacing.ml,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(128,128,128,0.2)',
  },
  modalStatItem: {
    alignItems: 'center',
  },
  modalStatValue: {
    ...Typography.title3,
  },
  modalStatLabel: {
    ...Typography.caption2,
    marginTop: Spacing.hairline,
  },
  requirementBox: {
    marginTop: Spacing.md,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
  requirementText: {
    ...Typography.footnote,
  },
  closeButton: {
    margin: Spacing.ml,
    marginTop: 0,
    padding: Spacing.sm,
    borderRadius: BorderRadius.input,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  closeButtonText: {
    ...Typography.buttonMedium,
  },
  // Empty State Styles
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyStateContent: {
    alignItems: 'center',
    maxWidth: 300,
  },
  emptyStateIllustration: {
    position: 'relative',
    marginBottom: Spacing.lg,
  },
  emptyStateMainEmoji: {
    fontSize: 80,
  },
  emptyStateFloatingEmojis: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  floatingEmoji1: {
    position: 'absolute',
    top: -15,
    right: -20,
    fontSize: 24,
  },
  floatingEmoji2: {
    position: 'absolute',
    top: 5,
    left: -25,
    fontSize: 20,
  },
  floatingEmoji3: {
    position: 'absolute',
    bottom: -10,
    right: -25,
    fontSize: 22,
  },
  emptyStateTitle: {
    ...Typography.title1,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    ...Typography.body,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  emptyStateTip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.input,
    marginBottom: Spacing.lg,
  },
  emptyStateTipText: {
    ...Typography.calloutMedium,
    textAlign: 'center',
  },
  emptyStateCTA: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: 14,
    borderRadius: BorderRadius.button,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateCTAText: {
    ...Typography.buttonMedium,
  },
});
