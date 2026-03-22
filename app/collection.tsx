/**
 * Declutterly - Collection Screen
 * View all collected items with rarity, stats, and animations
 */

import { BODY_FONT, DISPLAY_FONT, getTheme, RADIUS, V1 } from '@/constants/designTokens';
import { useDeclutter } from '@/context/DeclutterContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import {
    Collectible,
    CollectibleCategory,
    CollectibleRarity,
    COLLECTIBLES,
    RARITY_COLORS,
} from '@/types/declutter';
import { FlashList } from '@shopify/flash-list';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Sparkles } from 'lucide-react-native';
import { ScreenErrorBoundary } from '@/components/ErrorBoundary';
import React, { useMemo, useState } from 'react';
import {
    Pressable,
    Text as RNText,
    ScrollView,
    StyleSheet,
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
  return (
    <ScreenErrorBoundary screenName="collection">
      <CollectionScreenContent />
    </ScreenErrorBoundary>
  );
}

function CollectionScreenContent() {
  const rawColorScheme = useColorScheme();
  const isDark = rawColorScheme === 'dark';
  const reducedMotion = useReducedMotion();
  const t = getTheme(isDark);
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
  const completionPercent = totalCollectibles > 0
    ? Math.round((uniqueOwned / totalCollectibles) * 100)
    : 0;

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, { total: number; owned: number }> = {};
    COLLECTIBLES.forEach(c => {
      const key = c.category;
      if (!counts[key]) counts[key] = { total: 0, owned: 0 };
      counts[key].total++;
      if (collectibleCounts[c.id] > 0) counts[key].owned++;
    });
    return counts;
  }, [collectibleCounts]);

  const categories: { key: FilterType; label: string; emoji: string }[] = [
    { key: 'all', label: `All (${uniqueOwned}/${totalCollectibles})`, emoji: '\u{1F4E6}' },
    { key: 'sparkles', label: `Sparkles (${categoryCounts['sparkles']?.owned ?? 0}/${categoryCounts['sparkles']?.total ?? 0})`, emoji: '\u{1F48E}' },
    { key: 'tools', label: `Tools (${categoryCounts['tools']?.owned ?? 0}/${categoryCounts['tools']?.total ?? 0})`, emoji: '\u{1F9F9}' },
    { key: 'creatures', label: `Creatures (${categoryCounts['creatures']?.owned ?? 0}/${categoryCounts['creatures']?.total ?? 0})`, emoji: '\u{1F430}' },
    { key: 'treasures', label: `Treasures (${categoryCounts['treasures']?.owned ?? 0}/${categoryCounts['treasures']?.total ?? 0})`, emoji: '\u{1F48E}' },
    { key: 'special', label: `Special (${categoryCounts['special']?.owned ?? 0}/${categoryCounts['special']?.total ?? 0})`, emoji: '\u{2B50}' },
  ];

  function handleItemPress(item: Collectible) {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedItem(item);
  }

  function getRarityGlow(rarity: CollectibleRarity): string {
    return RARITY_COLORS[rarity] + '40';
  }

  function isOwned(itemId: string): boolean {
    return collectibleCounts[itemId] > 0;
  }

  function canUnlock(item: Collectible): boolean {
    return (stats?.totalTasksCompleted ?? 0) >= item.requiredTasks;
  }

  return (
    <LinearGradient
      colors={isDark ? ['#0A0A0A', '#131313', '#141414'] : ['#FAFAFA', '#F7F7F7', '#F5F5F5']}
      style={styles.container}
    >
      {/* Decorative sparkles */}
      <Sparkles
        size={14}
        color={isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.12)'}
        style={{ position: 'absolute', top: insets.top + 20, right: 26, zIndex: 1 }}
      />
      <Sparkles
        size={11}
        color={isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)'}
        style={{ position: 'absolute', top: insets.top + 56, left: 22, zIndex: 1 }}
      />

      {/* Header */}
      <Animated.View
        entering={reducedMotion ? undefined : FadeInDown.delay(50).duration(350)}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <Pressable
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
        >
          <RNText style={[{ fontSize: 17, fontWeight: '400', lineHeight: 22 }, { color: V1.coral }]}>Back</RNText>
        </Pressable>
        <RNText style={[{ fontSize: 20, fontWeight: '600', lineHeight: 25 }, { color: t.text }]} accessibilityRole="header">Collection</RNText>
        <View style={styles.placeholder} />
      </Animated.View>

      {/* Stats Overview */}
      <Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(100).duration(350)}>
        <View style={[styles.statsCard, {
          backgroundColor: t.card,
          borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
        }]}>
          <View style={styles.statsRow} accessibilityRole="summary" accessibilityLabel={`${collectionStats.totalCollected} total collected, ${uniqueOwned} of ${totalCollectibles} unique, ${completionPercent}% complete`}>
            <View style={styles.statItem}>
              <RNText style={[{ fontSize: 28, fontWeight: '700', letterSpacing: -0.4, lineHeight: 34 }, { color: t.text }]}>
                {collectionStats.totalCollected}
              </RNText>
              <RNText style={[{ fontSize: 12, fontWeight: '400', lineHeight: 16 }, { color: t.textSecondary }]}>
                Total
              </RNText>
            </View>
            <View style={styles.statItem}>
              <RNText style={[{ fontSize: 28, fontWeight: '700', letterSpacing: -0.4, lineHeight: 34 }, { color: t.text }]}>
                {uniqueOwned}/{totalCollectibles}
              </RNText>
              <RNText style={[{ fontSize: 12, fontWeight: '400', lineHeight: 16 }, { color: t.textSecondary }]}>
                Unique
              </RNText>
            </View>
            <View style={styles.statItem}>
              <RNText style={[{ fontSize: 28, fontWeight: '700', letterSpacing: -0.4, lineHeight: 34 }, { color: V1.coral }]}>
                {completionPercent}%
              </RNText>
              <RNText style={[{ fontSize: 12, fontWeight: '400', lineHeight: 16 }, { color: t.textSecondary }]}>
                Complete
              </RNText>
            </View>
          </View>

          {/* Rarity Breakdown with labels */}
          <View style={styles.rarityRow}>
            {(['common', 'uncommon', 'rare', 'epic', 'legendary'] as CollectibleRarity[]).map(rarity => {
              const countKey = `${rarity}Count` as 'commonCount' | 'uncommonCount' | 'rareCount' | 'epicCount' | 'legendaryCount';
              return (
                <View key={rarity} style={styles.rarityItem} accessibilityLabel={`${rarity}: ${collectionStats[countKey]}`}>
                  <View style={[styles.rarityDot, { backgroundColor: RARITY_COLORS[rarity] }]} />
                  <View style={{ alignItems: 'center' }}>
                    <RNText style={[{ fontSize: 12, fontWeight: '600', lineHeight: 16 }, { color: RARITY_COLORS[rarity] }]}>
                      {collectionStats[countKey]}
                    </RNText>
                    <RNText style={[{ fontSize: 9, fontWeight: '400' }, { color: t.textMuted }]}>
                      {rarity.charAt(0).toUpperCase() + rarity.slice(1)}
                    </RNText>
                  </View>
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
              void Haptics.selectionAsync();
            }}
            style={[
              styles.filterButton,
              {
                backgroundColor: filter === cat.key ? V1.coral : t.card,
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
                { color: filter === cat.key ? '#FFFFFF' : t.text },
              ]}
            >
              {cat.label}
            </RNText>
          </Pressable>
        ))}
      </ScrollView>

      {/* Empty State */}
      {collectionStats.totalCollected === 0 && (
        <View style={[styles.emptyStateContainer, { backgroundColor: t.bg }]}>
          <View style={styles.emptyStateContent}>
            <View style={styles.emptyStateIllustration}>
              <RNText style={styles.emptyStateMainEmoji}>🎁</RNText>
              <View style={styles.emptyStateFloatingEmojis}>
                <RNText style={styles.floatingEmoji1}>🎁</RNText>
                <RNText style={styles.floatingEmoji2}>🧹</RNText>
                <RNText style={styles.floatingEmoji3}>🏆</RNText>
              </View>
            </View>
            <RNText style={[styles.emptyStateTitle, { color: t.text }]}>
              Your Collection Awaits
            </RNText>
            <RNText style={[styles.emptyStateSubtitle, { color: t.textSecondary }]}>
              Every cleaning task has a chance to spawn a collectible. Rarer items appear as you build your streak. How many can you find?
            </RNText>
            <View style={[styles.emptyStateTip, { backgroundColor: V1.coral + '15' }]}>
              <RNText style={[styles.emptyStateTipText, { color: V1.coral }]}>
                Tip: Complete your first task to start spawning collectibles. Streaks boost rare spawn rates!
              </RNText>
            </View>
            <Pressable
              style={[styles.emptyStateCTA, { backgroundColor: V1.coral }]}
              onPress={() => router.push('/camera')}
            >
              <RNText style={[styles.emptyStateCTAText, { color: '#FFFFFF' }]}>Start Cleaning</RNText>
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
        contentContainerStyle={{ ...styles.gridContent, paddingBottom: insets.bottom + 16 }}
        renderItem={({ item }) => {
            const owned = isOwned(item.id);
            const unlockable = canUnlock(item);
            const count = collectibleCounts[item.id] || 0;

            return (
              <AnimatedPressable
                onPress={() => handleItemPress(item)}
                layout={LinearTransition.duration(350)}
                entering={reducedMotion ? undefined : ZoomIn.delay(50).duration(350)}
                style={[
                  styles.gridItem,
                  {
                    width: ITEM_SIZE,
                    height: ITEM_SIZE,
                    backgroundColor: owned
                      ? getRarityGlow(item.rarity)
                      : t.card,
                    borderColor: owned ? RARITY_COLORS[item.rarity] : t.border,
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
                    <RNText style={[styles.countText, { color: '#FFFFFF' }]}>x{count}</RNText>
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
          entering={reducedMotion ? undefined : FadeIn.duration(200)}
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
              entering={reducedMotion ? undefined : SlideInDown.duration(350).damping(15)}
              exiting={ZoomOut.duration(200)}
              style={[styles.modalContent, { backgroundColor: t.card, width: width * 0.85 }]}
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
                <RNText style={[styles.rarityBadgeText, { color: '#FFFFFF' }]}>
                  {selectedItem.rarity.toUpperCase()}
                </RNText>
              </View>
            </View>

            <View style={styles.modalBody}>
              <RNText style={[styles.modalName, { color: t.text }]}>
                {selectedItem.name}
              </RNText>
              <RNText style={[styles.modalDescription, { color: t.textSecondary }]}>
                {selectedItem.description}
              </RNText>

              <View style={styles.modalStats}>
                <View style={styles.modalStatItem}>
                  <RNText style={[styles.modalStatValue, { color: V1.coral }]}>
                    +{selectedItem.xpValue}
                  </RNText>
                  <RNText style={[styles.modalStatLabel, { color: t.textSecondary }]}>
                    XP Value
                  </RNText>
                </View>
                <View style={styles.modalStatItem}>
                  <RNText style={[styles.modalStatValue, { color: t.text }]}>
                    {collectibleCounts[selectedItem.id] || 0}
                  </RNText>
                  <RNText style={[styles.modalStatLabel, { color: t.textSecondary }]}>
                    Owned
                  </RNText>
                </View>
                <View style={styles.modalStatItem}>
                  <RNText style={[styles.modalStatValue, { color: t.text }]}>
                    {Math.round(selectedItem.spawnChance * 100)}%
                  </RNText>
                  <RNText style={[styles.modalStatLabel, { color: t.textSecondary }]}>
                    Spawn Rate
                  </RNText>
                </View>
              </View>

              {selectedItem.requiredTasks > 0 && (
                <View style={[styles.requirementBox, { backgroundColor: t.bg }]}>
                  <RNText style={[styles.requirementText, { color: t.textSecondary }]}>
                    {(stats?.totalTasksCompleted ?? 0) >= selectedItem.requiredTasks
                      ? '✅ Unlocked'
                      : `🔒 Complete ${selectedItem.requiredTasks} tasks to unlock`}
                  </RNText>
                </View>
              )}
            </View>

              <Pressable
                style={[styles.closeButton, { backgroundColor: V1.coral }]}
                onPress={() => setSelectedItem(null)}
                accessibilityRole="button"
                accessibilityLabel="Close details"
              >
                <RNText style={[styles.closeButtonText, { color: '#FFFFFF' }]}>Close</RNText>
              </Pressable>
            </AnimatedPressable>
          </Pressable>
        </Animated.View>
      )}
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
  },
  placeholder: {
    width: 50,
  },
  statsCard: {
    marginHorizontal: 16,
    padding: 16,
    borderRadius: RADIUS.lg,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
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
    gap: 4,
  },
  rarityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  filterScroll: {
    maxHeight: 50,
    marginBottom: 16,
  },
  filterContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    gap: 6,
    minHeight: 44,
  },
  filterEmoji: {
    fontSize: 16,
  },
  filterText: {
    fontSize: 12, fontWeight: '500', lineHeight: 16,
  },
  gridScroll: {
    flex: 1,
  },
  gridContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridItem: {
    borderRadius: RADIUS.md,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 4,
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
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  modalHeader: {
    alignItems: 'center',
    paddingVertical: 24,
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
    padding: 20,
  },
  modalName: {
    fontFamily: DISPLAY_FONT,
    fontSize: 22, fontWeight: '700', letterSpacing: -0.4, lineHeight: 28,
    textAlign: 'center',
  },
  modalDescription: {
    fontFamily: BODY_FONT,
    fontSize: 15, fontWeight: '400', lineHeight: 20,
    textAlign: 'center',
    marginTop: 8,
  },
  modalStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(128,128,128,0.2)',
  },
  modalStatItem: {
    alignItems: 'center',
  },
  modalStatValue: {
    ...{ fontSize: 20, fontWeight: '600', lineHeight: 25 },
  },
  modalStatLabel: {
    fontSize: 11, fontWeight: '400', lineHeight: 13,
    marginTop: 2,
  },
  requirementBox: {
    marginTop: 16,
    padding: 12,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
  },
  requirementText: {
    fontSize: 13, fontWeight: '400', lineHeight: 18,
  },
  closeButton: {
    margin: 20,
    marginTop: 0,
    padding: 12,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 16, fontWeight: '600', lineHeight: 21,
  },
  // Empty State Styles
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyStateContent: {
    alignItems: 'center',
    maxWidth: 300,
  },
  emptyStateIllustration: {
    position: 'relative',
    marginBottom: 24,
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
    fontFamily: DISPLAY_FONT,
    fontSize: 28, fontWeight: '700', letterSpacing: -0.4, lineHeight: 34,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontFamily: BODY_FONT,
    fontSize: 17, fontWeight: '400', lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyStateTip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: RADIUS.sm,
    marginBottom: 24,
  },
  emptyStateTipText: {
    fontSize: 16, fontWeight: '500', lineHeight: 21,
    textAlign: 'center',
  },
  emptyStateCTA: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 28,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateCTAText: {
    fontFamily: BODY_FONT,
    fontSize: 16, fontWeight: '600', lineHeight: 21,
  },
});
