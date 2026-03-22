/**
 * Declutterly - Wardrobe Screen
 * Full wardrobe browsing experience for mascot accessories
 * Navigate here from mascot.tsx "Customize" button
 */

import { BODY_FONT, DISPLAY_FONT, getTheme, RADIUS, V1 } from '@/constants/designTokens';
import { useDeclutter } from '@/context/DeclutterContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import {
  Collectible,
  CollectibleCategory,
  COLLECTIBLES,
  RARITY_COLORS,
} from '@/types/declutter';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ScreenErrorBoundary } from '@/components/ErrorBoundary';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  FadeInDown,
  ZoomIn,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { STORAGE_KEYS } from '@/constants/storageKeys';
const EQUIPPED_KEY = STORAGE_KEYS.EQUIPPED_ACCESSORIES;

// Category definitions
const CATEGORIES: { key: 'all' | CollectibleCategory; label: string; emoji: string }[] = [
  { key: 'all', label: 'All', emoji: '\u{1F4E6}' },
  { key: 'sparkles', label: 'Sparkles', emoji: '\u{1F48E}' },
  { key: 'tools', label: 'Tools', emoji: '\u{1F9F9}' },
  { key: 'creatures', label: 'Creatures', emoji: '\u{1F430}' },
  { key: 'treasures', label: 'Treasures', emoji: '\u{1F48E}' },
  { key: 'special', label: 'Special', emoji: '\u{2B50}' },
];

// How to unlock hints
function getUnlockHint(item: Collectible): string {
  if (item.requiredTasks > 0) {
    return `Complete ${item.requiredTasks} tasks to unlock`;
  }
  if (item.isSpecial) {
    return 'Special event item';
  }
  return 'Keep cleaning to find this!';
}

export default function WardrobeScreen() {
  return (
    <ScreenErrorBoundary screenName="wardrobe">
      <WardrobeScreenContent />
    </ScreenErrorBoundary>
  );
}

function WardrobeScreenContent() {
  const rawColorScheme = useColorScheme();
  const isDark = rawColorScheme === 'dark';
  const reducedMotion = useReducedMotion();
  const t = getTheme(isDark);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const ITEM_SIZE = (width - 60) / 4;

  const { collection, mascot, stats } = useDeclutter();
  const [filter, setFilter] = useState<'all' | CollectibleCategory>('all');
  const [equippedIds, setEquippedIds] = useState<string[]>([]);

  // Load equipped items from storage
  useEffect(() => {
    AsyncStorage.getItem(EQUIPPED_KEY).then(val => {
      if (val) {
        try {
          setEquippedIds(JSON.parse(val));
        } catch {}
      }
    });
  }, []);

  // Persist equipped items
  const persistEquipped = useCallback(async (ids: string[]) => {
    await AsyncStorage.setItem(EQUIPPED_KEY, JSON.stringify(ids));
  }, []);

  // Owned collectible IDs
  const ownedIds = useMemo(() => {
    const ids = new Set<string>();
    collection.forEach(item => ids.add(item.collectibleId));
    return ids;
  }, [collection]);

  // Filter collectibles
  const filteredCollectibles = useMemo(() => {
    let items = COLLECTIBLES;
    if (filter !== 'all') {
      items = items.filter(c => c.category === filter);
    }
    // Sort: owned first, then by rarity
    return [...items].sort((a, b) => {
      const aOwned = ownedIds.has(a.id) ? 0 : 1;
      const bOwned = ownedIds.has(b.id) ? 0 : 1;
      if (aOwned !== bOwned) return aOwned - bOwned;
      return 0;
    });
  }, [filter, ownedIds]);

  const handleToggleEquip = useCallback((itemId: string) => {
    if (!ownedIds.has(itemId)) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    setEquippedIds(prev => {
      const next = prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId].slice(-4); // Max 4 equipped
      persistEquipped(next);
      return next;
    });
  }, [ownedIds, persistEquipped]);

  const isOwned = useCallback((id: string) => ownedIds.has(id), [ownedIds]);
  const isEquipped = useCallback((id: string) => equippedIds.includes(id), [equippedIds]);

  return (
    <LinearGradient
      colors={isDark ? ['#0A0A0A', '#131313', '#141414'] : ['#FAFAFA', '#F7F7F7', '#F5F5F5']}
      style={styles.container}
    >
      {/* Header */}
      <Animated.View
        entering={reducedMotion ? undefined : FadeInDown.delay(50).duration(350)}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
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
          <Text style={[styles.backText, { color: V1.coral }]}>Back</Text>
        </Pressable>
        <Text style={[styles.title, { color: t.text }]} accessibilityRole="header">Wardrobe</Text>
        <View style={styles.placeholder} />
      </Animated.View>

      {/* Equipped preview */}
      <Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(100).duration(350)}>
        <View style={[styles.equippedSection, {
          backgroundColor: t.card,
          borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
        }]}>
          <Text style={[styles.sectionLabel, { color: isDark ? 'rgba(255,255,255,0.21)' : 'rgba(0,0,0,0.25)' }]}>
            EQUIPPED ({equippedIds.length}/4)
          </Text>
          <View style={styles.equippedRow}>
            {equippedIds.length > 0 ? equippedIds.map(id => {
              const collectible = COLLECTIBLES.find(c => c.id === id);
              if (!collectible) return null;
              return (
                <Pressable
                  key={id}
                  onPress={() => handleToggleEquip(id)}
                  style={[styles.equippedItem, { backgroundColor: RARITY_COLORS[collectible.rarity] + '30' }]}
                  accessibilityRole="button"
                  accessibilityLabel={`Unequip ${collectible.name}`}
                >
                  <Text style={{ fontSize: 28 }}>{collectible.emoji}</Text>
                </Pressable>
              );
            }) : (
              <Text style={[styles.emptyText, { color: t.textMuted }]}>
                Tap owned items below to equip them
              </Text>
            )}
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
        {CATEGORIES.map(cat => (
          <Pressable
            key={cat.key}
            onPress={() => {
              setFilter(cat.key);
              Haptics.selectionAsync();
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
            <Text style={styles.filterEmoji}>{cat.emoji}</Text>
            <Text
              style={[
                styles.filterText,
                { color: filter === cat.key ? '#FFFFFF' : t.text },
              ]}
            >
              {cat.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Grid */}
      <ScrollView
        style={styles.gridScroll}
        contentContainerStyle={[styles.gridContent, { paddingBottom: insets.bottom + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.grid}>
          {filteredCollectibles.map((item, index) => {
            const owned = isOwned(item.id);
            const equipped = isEquipped(item.id);
            const canUnlock = (stats?.totalTasksCompleted ?? 0) >= item.requiredTasks;

            return (
              <Animated.View
                key={item.id}
                entering={reducedMotion ? undefined : ZoomIn.delay(index * 30).duration(300)}
              >
                <Pressable
                  onPress={() => handleToggleEquip(item.id)}
                  style={[
                    styles.gridItem,
                    {
                      width: ITEM_SIZE,
                      height: ITEM_SIZE + 20,
                      backgroundColor: owned
                        ? RARITY_COLORS[item.rarity] + '20'
                        : t.card,
                      borderColor: equipped
                        ? V1.coral
                        : owned
                        ? RARITY_COLORS[item.rarity]
                        : t.border,
                      borderWidth: equipped ? 3 : 2,
                      opacity: canUnlock || owned ? 1 : 0.5,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={
                    owned
                      ? `${item.name}, ${equipped ? 'equipped' : 'tap to equip'}`
                      : `${item.name}, locked. ${getUnlockHint(item)}`
                  }
                >
                  <Text style={[styles.itemEmoji, { opacity: owned ? 1 : 0.3 }]}>
                    {owned ? item.emoji : '\u{2753}'}
                  </Text>

                  {/* Equipped badge */}
                  {equipped && (
                    <View style={[styles.equippedBadge, { backgroundColor: V1.coral }]}>
                      <Text style={styles.equippedBadgeText}>ON</Text>
                    </View>
                  )}

                  {/* Lock icon for unowned */}
                  {!owned && (
                    <View style={styles.lockBadge}>
                      <Text style={styles.lockText}>{'\u{1F512}'}</Text>
                    </View>
                  )}

                  {/* Item name (short) */}
                  {owned && (
                    <Text
                      style={[styles.itemName, { color: t.textSecondary }]}
                      numberOfLines={1}
                    >
                      {item.name}
                    </Text>
                  )}

                  {/* Unlock hint for locked items */}
                  {!owned && canUnlock && (
                    <Text style={[styles.unlockHint, { color: t.textMuted }]} numberOfLines={2}>
                      {getUnlockHint(item)}
                    </Text>
                  )}
                </Pressable>
              </Animated.View>
            );
          })}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  backText: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 20,
  },
  title: {
    fontFamily: DISPLAY_FONT,
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 25,
  },
  placeholder: { width: 50 },
  equippedSection: {
    marginHorizontal: 16,
    padding: 16,
    borderRadius: RADIUS.lg,
    marginBottom: 16,
    borderWidth: 1,
  },
  sectionLabel: {
    fontFamily: BODY_FONT,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  equippedRow: {
    flexDirection: 'row',
    gap: 12,
    minHeight: 56,
    alignItems: 'center',
  },
  equippedItem: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontFamily: BODY_FONT,
    fontSize: 14,
    fontStyle: 'italic',
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
  filterEmoji: { fontSize: 16 },
  filterText: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  gridScroll: { flex: 1 },
  gridContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  gridItem: {
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  itemEmoji: { fontSize: 28 },
  itemName: {
    fontFamily: BODY_FONT,
    fontSize: 10,
    marginTop: 2,
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  equippedBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  equippedBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    fontFamily: BODY_FONT,
  },
  lockBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
  },
  lockText: { fontSize: 12 },
  unlockHint: {
    fontFamily: BODY_FONT,
    fontSize: 8,
    textAlign: 'center',
    paddingHorizontal: 4,
    marginTop: 2,
  },
});
