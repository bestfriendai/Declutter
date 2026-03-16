/**
 * Declutterly - Mascot Screen
 * Full mascot view with stats, interactions, and customization
 */

import { Colors, ColorTokens } from '@/constants/Colors';
import { AmbientBackdrop } from '@/components/ui/AmbientBackdrop';
import { ExpressiveStateView } from '@/components/ui/ExpressiveStateView';
import { useDeclutter } from '@/context/DeclutterContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { MASCOT_PERSONALITIES } from '@/types/declutter';
import { Mascot } from '@/components/features/Mascot';
import { Typography } from '@/theme/typography';
import { Spacing, BorderRadius } from '@/theme/spacing';
import { router } from 'expo-router';
import React from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Text as RNText,
  ScrollView,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

export default function MascotScreen() {
  const rawColorScheme = useColorScheme();
  const colorScheme = rawColorScheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  const { mascot, interactWithMascot, feedMascot, stats } = useDeclutter();

  if (!mascot) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <AmbientBackdrop isDark={isDark} variant="profile" />
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <RNText style={[styles.backText, { color: colors.primary }]}>Back</RNText>
          </Pressable>
        </View>
        <View style={styles.emptyState}>
          <ExpressiveStateView
            isDark={isDark}
            kicker="CLEANING BUDDY"
            emoji="🥺"
            title="No buddy yet"
            description="Finish onboarding to choose the guide who matches your energy, tone, and cleaning style."
            primaryLabel="Choose Your Buddy"
            onPrimary={() => router.push('/onboarding')}
            accentColors={['#FFD9A1', '#FFB547', '#FF8C63'] as const}
            style={styles.emptyCard}
          />
        </View>
      </View>
    );
  }

  const personalityInfo = MASCOT_PERSONALITIES[mascot.personality];
  const xpToNextLevel = (mascot.level * 50) - mascot.xp;

  const handlePet = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    interactWithMascot();
  };

  const handleFeed = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    feedMascot();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <RNText style={[styles.backText, { color: colors.primary }]}>Back</RNText>
        </Pressable>
        <RNText style={[styles.title, { color: colors.text }]} accessibilityRole="header">Your Buddy</RNText>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic">
        {/* Mascot Display */}
        <View style={[styles.mascotSection, { backgroundColor: personalityInfo.color + '20' }]}>
          <Mascot size="large" showStats interactive onPress={handlePet} />
          <RNText style={[styles.tapHint, { color: colors.textSecondary }]}>
            Tap to interact!
          </RNText>
        </View>

        {/* Stats Card */}
        <Animated.View entering={FadeInDown.delay(60).duration(350)} style={[styles.statsCard, {
          backgroundColor: colors.card,
          borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
        }]}>
          <RNText style={styles.sectionTitle}>STATS</RNText>

          {/* Level Progress */}
          <View style={styles.levelSection}>
            <View style={styles.levelHeader}>
              <RNText style={[styles.levelText, { color: colors.text }]}>
                Level {mascot.level}
              </RNText>
              <RNText style={[styles.xpText, { color: colors.textSecondary }]}>
                {mascot.xp} / {mascot.level * 50} XP
              </RNText>
            </View>
            <View style={[styles.xpBar, { backgroundColor: colors.border }]}>
              <View
                style={[
                  styles.xpFill,
                  {
                    width: `${(mascot.xp / (mascot.level * 50)) * 100}%`,
                    backgroundColor: personalityInfo.color,
                  },
                ]}
              />
            </View>
            <RNText style={[styles.xpHint, { color: colors.textSecondary }]}>
              {xpToNextLevel} XP to next level
            </RNText>
          </View>

          {/* Stat Bars */}
          <View style={styles.statBars}>
            <StatBar
              label="Hunger"
              value={mascot.hunger}
              color={colors.success}
              colors={colors}
            />
            <StatBar
              label="Energy"
              value={mascot.energy}
              color={colors.accent}
              colors={colors}
            />
            <StatBar
              label="Happiness"
              value={mascot.happiness}
              color={colors.warning}
              colors={colors}
            />
          </View>
        </Animated.View>

        {/* Actions */}
        <Animated.View entering={FadeInDown.delay(120).duration(350)} style={styles.actionsSection}>
          <RNText style={styles.sectionTitle}>ACTIONS</RNText>

          <View style={styles.actionButtons}>
            <Pressable
              style={[styles.actionButton, { backgroundColor: colors.success }]}
              onPress={handleFeed}
              accessibilityRole="button"
              accessibilityLabel="Feed your buddy"
              accessibilityHint="Increases hunger by 20 points"
            >
              <RNText style={styles.actionEmoji} accessibilityElementsHidden>🍎</RNText>
              <RNText style={[styles.actionText, { color: colors.textOnSuccess }]}>Feed</RNText>
              <RNText style={[styles.actionHint, { color: colors.textOnSuccess }]} accessibilityElementsHidden>+20 Hunger</RNText>
            </Pressable>

            <Pressable
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={handlePet}
              accessibilityRole="button"
              accessibilityLabel="Pet your buddy"
              accessibilityHint="Increases happiness by 15 points"
            >
              <RNText style={styles.actionEmoji} accessibilityElementsHidden>👋</RNText>
              <RNText style={[styles.actionText, { color: colors.textOnPrimary }]}>Pet</RNText>
              <RNText style={[styles.actionHint, { color: colors.textOnPrimary }]} accessibilityElementsHidden>+15 Happy</RNText>
            </Pressable>

            <Pressable
              style={[styles.actionButton, { backgroundColor: isDark ? '#BF5AF2' : '#AF52DE' }]}
              onPress={() => router.push('/focus?duration=25')}
              accessibilityRole="button"
              accessibilityLabel="Clean together"
              accessibilityHint="Start a 25 minute focus cleaning session"
            >
              <RNText style={styles.actionEmoji} accessibilityElementsHidden>🧹</RNText>
              <RNText style={[styles.actionText, { color: colors.textOnPrimary }]}>Clean</RNText>
              <RNText style={[styles.actionHint, { color: colors.textOnPrimary }]} accessibilityElementsHidden>Together!</RNText>
            </Pressable>
          </View>
        </Animated.View>

        {/* Info Card */}
        <Animated.View entering={FadeInDown.delay(180).duration(350)} style={[styles.infoCard, {
          backgroundColor: colors.card,
          borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
        }]}>
          <RNText style={styles.sectionTitle}>ABOUT</RNText>
          <View style={[styles.infoRow, { borderBottomColor: isDark ? colors.divider : colors.borderLight }]}>
            <RNText style={[styles.infoLabel, { color: colors.textSecondary }]}>
              Personality
            </RNText>
            <RNText style={[styles.infoValue, { color: colors.text }]}>
              {personalityInfo.emoji} {personalityInfo.name}
            </RNText>
          </View>
          <View style={[styles.infoRow, { borderBottomColor: isDark ? colors.divider : colors.borderLight }]}>
            <RNText style={[styles.infoLabel, { color: colors.textSecondary }]}>
              Current Mood
            </RNText>
            <RNText style={[styles.infoValue, { color: colors.text }]}>
              {getMoodEmoji(mascot.mood)} {mascot.mood}
            </RNText>
          </View>
          <View style={[styles.infoRow, { borderBottomColor: isDark ? colors.divider : colors.borderLight }]}>
            <RNText style={[styles.infoLabel, { color: colors.textSecondary }]}>
              Tasks Together
            </RNText>
            <RNText style={[styles.infoValue, { color: colors.text }]}>
              {stats.totalTasksCompleted}
            </RNText>
          </View>
          <View style={[styles.infoRow, { borderBottomColor: isDark ? colors.divider : colors.borderLight }]}>
            <RNText style={[styles.infoLabel, { color: colors.textSecondary }]}>
              Days Together
            </RNText>
            <RNText style={[styles.infoValue, { color: colors.text }]}>
              {Math.floor((Date.now() - new Date(mascot.createdAt).getTime()) / (1000 * 60 * 60 * 24)) + 1}
            </RNText>
          </View>
        </Animated.View>

        {/* Tips */}
        <Animated.View entering={FadeInDown.delay(240).duration(350)} style={[styles.tipsCard, { backgroundColor: personalityInfo.color + '20' }]}>
          <RNText style={styles.tipsEmoji}>💡</RNText>
          <RNText style={[styles.tipsText, { color: colors.text }]}>
            {mascot.happiness < 30
              ? `${mascot.name} is feeling a bit down. A quick cleaning session or a pet can lift their mood!`
              : mascot.hunger < 30
              ? `${mascot.name} is getting hungry! Complete a task to fill them up with energy.`
              : `${mascot.name} is doing great! Keep up the rhythm and you will both level up together.`}
          </RNText>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function StatBar({
  label,
  value,
  color,
  colors,
}: {
  label: string;
  value: number;
  color: string;
  colors: ColorTokens;
}) {
  return (
    <View style={styles.statBarContainer}>
      <View style={styles.statBarHeader}>
        <RNText style={[styles.statBarLabel, { color: colors.textSecondary }]}>
          {label}
        </RNText>
        <RNText style={[styles.statBarValue, { color: colors.text }]}>
          {value}%
        </RNText>
      </View>
      <View style={[styles.statBarBg, { backgroundColor: colors.border }]}>
        <View
          style={[
            styles.statBarFill,
            { width: `${value}%`, backgroundColor: color },
          ]}
        />
      </View>
    </View>
  );
}

function getMoodEmoji(mood: string): string {
  switch (mood) {
    case 'ecstatic': return '🤩';
    case 'happy': return '😊';
    case 'excited': return '😄';
    case 'content': return '🙂';
    case 'neutral': return '😐';
    case 'sad': return '😢';
    case 'sleepy': return '😴';
    default: return '😊';
  }
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
    justifyContent: 'center',
  },
  backText: {
    ...Typography.subheadlineMedium,
  },
  title: {
    ...Typography.title3,
  },
  placeholder: {
    width: 50,
  },
  content: {
    paddingHorizontal: Spacing.md,
    paddingBottom: 100,
  },
  mascotSection: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    borderRadius: BorderRadius.xxl,
    marginBottom: Spacing.ml,
  },
  tapHint: {
    fontSize: 13,
    marginTop: 8,
  },
  statsCard: {
    padding: Spacing.ml,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.ml,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: '#808080',
    marginBottom: Spacing.md,
  },
  levelSection: {
    marginBottom: Spacing.ml,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  levelText: {
    ...Typography.subheadlineMedium,
  },
  xpText: {
    ...Typography.subheadline,
  },
  xpBar: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  xpFill: {
    height: '100%',
    borderRadius: 5,
  },
  xpHint: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'right',
  },
  statBars: {
    gap: Spacing.sm,
  },
  statBarContainer: {
    gap: 4,
  },
  statBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statBarLabel: {
    fontSize: 13,
  },
  statBarValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  statBarBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  statBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  actionsSection: {
    marginBottom: Spacing.ml,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.ml,
    paddingHorizontal: Spacing.sm,
    borderRadius: 20,
  },
  actionEmoji: {
    fontSize: 28,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  actionHint: {
    fontSize: 10,
    marginTop: 2,
    opacity: 0.8,
  },
  infoCard: {
    padding: Spacing.ml,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.ml,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  tipsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  tipsEmoji: {
    fontSize: 24,
  },
  tipsText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxl,
  },
  emptyEmoji: {
    fontSize: 64,
  },
  emptyTitle: {
    ...Typography.title2,
    marginTop: Spacing.md,
  },
  emptyText: {
    ...Typography.subheadline,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  emptyButton: {
    marginTop: Spacing.lg,
    minHeight: 48,
    minWidth: 180,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  emptyButtonText: {
    ...Typography.callout,
    fontWeight: '600',
  },
  emptyCard: {
    width: '100%',
  },
});
