import { V1 } from '@/constants/designTokens';
import { useColorScheme } from '@/hooks/useColorScheme';
import { DoomPile } from '@/types/declutter';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface DoomPileCardProps {
  doomPile: DoomPile;
  onStart: () => void;
  onSkip: () => void;
  index?: number;
}

export function DoomPileCard({ doomPile, onStart, onSkip, index = 0 }: DoomPileCardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const t = isDark ? V1.dark : V1.light;

  const anxietyColor = doomPile.anxietyLevel === 'high'
    ? V1.coral
    : doomPile.anxietyLevel === 'medium'
      ? V1.amber
      : V1.green;

  return (
    <Animated.View entering={FadeInDown.delay(index * 100).duration(400)}>
      <View style={[
        styles.card,
        {
          backgroundColor: isDark ? 'rgba(255,107,107,0.08)' : 'rgba(255,107,107,0.06)',
          borderColor: `${V1.coral}40`,
          borderWidth: 1,
          borderLeftWidth: 3,
          borderLeftColor: V1.coral,
        },
      ]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.warningEmoji}>⚠️</Text>
          <View style={styles.headerText}>
            <Text style={[styles.headerTitle, { color: V1.coral }]}>DOOM PILE DETECTED</Text>
            <Text style={[styles.headerLocation, { color: t.text }]} numberOfLines={1}>
              {doomPile.location}
            </Text>
          </View>
          {doomPile.estimatedMinutes && (
            <View style={[styles.timeBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
              <Text style={[styles.timeBadgeText, { color: t.textSecondary }]}>
                ~{doomPile.estimatedMinutes}m
              </Text>
            </View>
          )}
        </View>

        {/* Description */}
        {doomPile.description && (
          <Text style={[styles.description, { color: t.textSecondary }]} numberOfLines={2}>
            {doomPile.description}
          </Text>
        )}

        {/* Item types + anxiety level */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {doomPile.itemTypes && doomPile.itemTypes.length > 0 && (
            <Text style={[styles.description, { color: t.textMuted, fontSize: 12 }]}>
              I see: {doomPile.itemTypes.join(', ')}
            </Text>
          )}
          {doomPile.anxietyLevel && (
            <View style={{
              backgroundColor: `${anxietyColor}20`,
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: 8,
            }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: anxietyColor }}>
                Anxiety: {doomPile.anxietyLevel.toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        {/* 3-Pile Method */}
        <View style={[styles.methodContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', borderRadius: 10 }]}>
          <Text style={[styles.methodTitle, { color: t.text }]}>The 3-Pile Method:</Text>
          <View style={styles.pileRow}>
            <View style={styles.pileItem}>
              <Text style={styles.pileEmoji}>🗑️</Text>
              <Text style={[styles.pileLabel, { color: t.textSecondary }]}>Trash</Text>
            </View>
            <View style={[styles.pileDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]} />
            <View style={styles.pileItem}>
              <Text style={styles.pileEmoji}>📦</Text>
              <Text style={[styles.pileLabel, { color: t.textSecondary }]}>Belongs elsewhere</Text>
            </View>
            <View style={[styles.pileDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]} />
            <View style={styles.pileItem}>
              <Text style={styles.pileEmoji}>🤔</Text>
              <Text style={[styles.pileLabel, { color: t.textSecondary }]}>Needs decision</Text>
            </View>
          </View>
          <Text style={[styles.methodHint, { color: t.textMuted }]}>
            Box up "needs decision" items — no guilt. Come back later.
          </Text>
        </View>

        {/* Action buttons */}
        <View style={styles.actionRow}>
          <Pressable
            onPress={onStart}
            style={({ pressed }) => [
              styles.startButton,
              { backgroundColor: V1.coral, opacity: pressed ? 0.88 : 1 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Start the doom pile"
          >
            <Text style={styles.startButtonText}>Start this pile</Text>
          </Pressable>
          <Pressable
            onPress={onSkip}
            style={({ pressed }) => [
              styles.skipButton,
              {
                borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)',
                opacity: pressed ? 0.7 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Skip for now"
          >
            <Text style={[styles.skipButtonText, { color: t.textSecondary }]}>Skip for now</Text>
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  warningEmoji: {
    fontSize: 22,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  headerLocation: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 2,
  },
  timeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  timeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  description: {
    fontSize: 13,
    lineHeight: 19,
  },
  methodContainer: {
    padding: 12,
    gap: 8,
  },
  methodTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  pileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pileItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  pileDivider: {
    width: 1,
    height: 32,
  },
  pileEmoji: {
    fontSize: 20,
  },
  pileLabel: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  methodHint: {
    fontSize: 11,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 4,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  startButton: {
    flex: 2,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  skipButton: {
    flex: 1,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
