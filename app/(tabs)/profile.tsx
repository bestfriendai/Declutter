/**
 * Declutterly — Profile Screen (Apple 2026)
 * iOS 26 hero card, XP bar, grouped settings list
 */

import { Colors, ColorTokens } from '@/constants/Colors';
import { GlassCard } from '@/components/ui/GlassCard';
import { useDeclutter } from '@/context/DeclutterContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Typography } from '@/theme/typography';
import { Spacing, BorderRadius } from '@/theme/spacing';
import { Badge, MASCOT_PERSONALITIES } from '@/types/declutter';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import React from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// XP thresholds per level
const XP_PER_LEVEL = 500;

function getLevelInfo(xp: number): { level: number; xpInLevel: number; xpToNext: number; progress: number } {
  const level = Math.floor(xp / XP_PER_LEVEL) + 1;
  const xpInLevel = xp % XP_PER_LEVEL;
  const xpToNext = XP_PER_LEVEL - xpInLevel;
  const progress = xpInLevel / XP_PER_LEVEL;
  return { level, xpInLevel, xpToNext, progress };
}

// ─────────────────────────────────────────────────────────────────────────────
// Settings Row
// ─────────────────────────────────────────────────────────────────────────────
interface SettingsRowProps {
  emoji: string;
  label: string;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
  colors: ColorTokens;
  isDark: boolean;
  showChevron?: boolean;
  isLast?: boolean;
}

function SettingsRow({ emoji, label, value, onPress, destructive, colors, isDark, showChevron = true, isLast = false }: SettingsRowProps) {
  return (
    <Pressable
      onPress={() => { if (onPress) { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(); } }}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : 'none'}
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.settingsRow,
        {
          backgroundColor: isDark ? colors.surface : colors.backgroundSecondary,
          opacity: pressed && onPress ? 0.7 : 1,
        },
        !isLast && { borderBottomWidth: 0.5, borderBottomColor: isDark ? colors.divider : colors.borderLight },
      ]}
    >
      <View style={[styles.settingsRowIcon, {
        backgroundColor: destructive ? colors.dangerMuted : (isDark ? colors.fillTertiary : colors.surfaceTertiary),
      }]}>
        <Text style={styles.settingsRowEmoji}>{emoji}</Text>
      </View>
      <Text style={[styles.settingsRowLabel, {
        color: destructive ? colors.danger : colors.text,
        flex: 1,
      }]}>
        {label}
      </Text>
      {value && (
        <Text style={[styles.settingsRowValue, { color: colors.textSecondary }]}>{value}</Text>
      )}
      {showChevron && onPress && (
        <Text style={[styles.settingsChevron, { color: colors.textTertiary }]}>›</Text>
      )}
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Settings Group
// ─────────────────────────────────────────────────────────────────────────────
interface SettingsGroupProps {
  title?: string;
  footer?: string;
  children: React.ReactNode;
  colors: ColorTokens;
  isDark: boolean;
}

function SettingsGroup({ title, footer, children, colors, isDark }: SettingsGroupProps) {
  return (
    <View style={styles.settingsGroup}>
      {title && (
        <Text style={[styles.settingsGroupTitle, { color: colors.textSecondary }]}>
          {title.toUpperCase()}
        </Text>
      )}
      <View style={[styles.settingsGroupContent, {
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 0.5,
        borderColor: isDark ? colors.divider : colors.borderLight,
      }]}>
        {children}
      </View>
      {footer && (
        <Text style={[styles.settingsGroupFooter, { color: colors.textSecondary }]}>
          {footer}
        </Text>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const rawScheme = useColorScheme();
  const colorScheme = rawScheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  const { user, mascot, stats, rooms, resetStats } = useDeclutter();

  const streak = stats?.currentStreak ?? 0;
  const badges = stats?.badges ?? [];

  const totalXP = stats?.xp ?? 0;
  const { level, xpInLevel, xpToNext, progress } = getLevelInfo(totalXP);
  const completedTasks = rooms.reduce((a, r) => a + r.tasks.filter(t => t.completed).length, 0);
  const earnedBadges = (badges ?? []).filter((b: Badge) => !!b.unlockedAt).length;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `🧹 I'm Level ${level} on Declutterly! I've completed ${completedTasks} tasks and earned ${earnedBadges} badges. Join me in decluttering! 🏆`,
        title: 'My Declutterly Progress',
      });
    } catch {
      // User cancelled
    }
  };

  const handleReset = () => {
    Alert.alert(
      'Reset Progress',
      'This will delete all your rooms, tasks, and progress. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Everything',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            resetStats?.();
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
      >
        {/* ── Header ──────────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(0).springify()} style={styles.header}>
          <Text style={[Typography.largeTitle, { color: colors.text }]}>Profile</Text>
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/settings'); }}
            accessibilityRole="button"
            accessibilityLabel="Open settings"
          >
            <Text style={{ fontSize: 22 }}>⚙️</Text>
          </Pressable>
        </Animated.View>

        {/* ── Hero Card ───────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(60).springify()} style={styles.section}>
          <LinearGradient
            colors={isDark ? ['#1C1C1E', '#2C2C2E'] : ['#FFFFFF', '#F2F2F7']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.heroCard, {
              borderColor: isDark ? colors.cardBorder : colors.borderLight,
              borderWidth: 0.5,
            }]}
          >
            {/* Avatar */}
            <View style={styles.avatarRow}>
              <View style={[styles.avatar, {
                backgroundColor: isDark ? colors.fillPrimary : colors.surfaceTertiary,
                borderColor: isDark ? colors.cardBorder : colors.borderLight,
              }]}>
                <Text style={styles.avatarEmoji}>{mascot ? MASCOT_PERSONALITIES[mascot.personality]?.emoji ?? '🧹' : '🧹'}</Text>
              </View>
              <View style={styles.avatarInfo}>
                <Text style={[Typography.title2, { color: colors.text }]}>
                  {user?.name || 'Declutterer'}
                </Text>
                <View style={[styles.levelBadge, { backgroundColor: colors.accentMuted }]}>
                  <Text style={[Typography.caption1Medium, { color: colors.accent }]}>
                    Level {level} · {mascot?.name ?? 'Explorer'}
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={handleShare}
                style={[styles.shareButton, { backgroundColor: isDark ? colors.fillTertiary : colors.surfaceTertiary }]}
                accessibilityRole="button"
                accessibilityLabel="Share progress"
              >
                <Text style={{ fontSize: 18 }}>↗️</Text>
              </Pressable>
            </View>

            {/* XP Bar */}
            <View style={styles.xpSection}>
              <View style={styles.xpLabelRow}>
                <Text style={[Typography.caption1Medium, { color: colors.textSecondary }]}>
                  {xpInLevel.toLocaleString()} XP
                </Text>
                <Text style={[Typography.caption1Medium, { color: colors.textSecondary }]}>
                  {xpToNext.toLocaleString()} XP to Level {level + 1}
                </Text>
              </View>
              <View style={[styles.xpTrack, { backgroundColor: isDark ? colors.fillTertiary : colors.surfaceTertiary }]}>
                <LinearGradient
                  colors={['#007AFF', '#5856D6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.xpFill, { width: `${progress * 100}%` }]}
                />
              </View>
            </View>

            {/* Quick Stats */}
            <View style={styles.heroStats}>
              {[
                { value: completedTasks, label: 'Tasks', emoji: '✅' },
                { value: streak, label: 'Streak', emoji: '🔥' },
                { value: earnedBadges, label: 'Badges', emoji: '🏆' },
                { value: totalXP.toLocaleString(), label: 'XP', emoji: '⭐' },
              ].map((stat) => (
                <View key={stat.label} style={styles.heroStat}>
                  <Text style={styles.heroStatEmoji}>{stat.emoji}</Text>
                  <Text style={[styles.heroStatValue, { color: colors.text }]}>{stat.value}</Text>
                  <Text style={[styles.heroStatLabel, { color: colors.textSecondary }]}>{stat.label}</Text>
                </View>
              ))}
            </View>
          </LinearGradient>
        </Animated.View>

        {/* ── Mascot Section ───────────────────────────────────────────── */}
        {mascot && (
          <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.section}>
            <SettingsGroup title="Your Buddy" colors={colors} isDark={isDark}>
              <SettingsRow
                emoji={MASCOT_PERSONALITIES[mascot.personality]?.emoji ?? '🧹'}
                label={mascot.name}
                value={mascot.personality}
                onPress={() => router.push('/mascot')}
                colors={colors}
                isDark={isDark}
                isLast
              />
            </SettingsGroup>
          </Animated.View>
        )}

        {/* ── Account ──────────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(140).springify()} style={styles.section}>
          <SettingsGroup title="Account" colors={colors} isDark={isDark}>
            <SettingsRow
              emoji="👤"
              label="Edit Profile"
              onPress={() => router.push('/settings')}
              colors={colors}
              isDark={isDark}
            />
            <SettingsRow
              emoji="🔔"
              label="Notifications"
              onPress={() => router.push('/settings')}
              colors={colors}
              isDark={isDark}
            />
            <SettingsRow
              emoji="🔒"
              label="Privacy"
              onPress={() => router.push('/settings')}
              colors={colors}
              isDark={isDark}
              isLast
            />
          </SettingsGroup>
        </Animated.View>

        {/* ── App ──────────────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(180).springify()} style={styles.section}>
          <SettingsGroup title="App" colors={colors} isDark={isDark}>
            <SettingsRow
              emoji="🏆"
              label="Achievements"
              onPress={() => router.push('/achievements')}
              colors={colors}
              isDark={isDark}
            />
            <SettingsRow
              emoji="📊"
              label="Insights"
              onPress={() => router.push('/insights')}
              colors={colors}
              isDark={isDark}
            />
            <SettingsRow
              emoji="⚙️"
              label="Settings"
              onPress={() => router.push('/settings')}
              colors={colors}
              isDark={isDark}
              isLast
            />
          </SettingsGroup>
        </Animated.View>

        {/* ── Danger Zone ──────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(220).springify()} style={styles.section}>
          <SettingsGroup
            title="Danger Zone"
            footer="This will permanently delete all your rooms, tasks, and progress."
            colors={colors}
            isDark={isDark}
          >
            <SettingsRow
              emoji="🗑️"
              label="Reset All Progress"
              onPress={handleReset}
              destructive
              colors={colors}
              isDark={isDark}
              isLast
            />
          </SettingsGroup>
        </Animated.View>

        {/* ── App Version ──────────────────────────────────────────────── */}
        <Text style={[styles.versionText, { color: colors.textTertiary }]}>
          Declutterly v1.0 · Made with ❤️
        </Text>
      </ScrollView>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.ml },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.ml,
  },

  section: { marginBottom: Spacing.lg },

  // Hero Card
  heroCard: {
    borderRadius: BorderRadius.card,
    padding: Spacing.ml,
    gap: Spacing.ml,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm + Spacing.hairline,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  avatarEmoji: { fontSize: 32 },
  avatarInfo: { flex: 1, gap: 6 },
  levelBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  shareButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // XP Bar
  xpSection: { gap: Spacing.xs },
  xpLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  xpTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  xpFill: {
    height: '100%',
    borderRadius: 3,
    minWidth: 8,
  },

  // Hero Stats
  heroStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heroStat: {
    alignItems: 'center',
    gap: 2,
  },
  heroStatEmoji: { fontSize: 20 },
  heroStatValue: {
    ...Typography.title3,
  },
  heroStatLabel: {
    ...Typography.caption2,
  },

  // Settings
  settingsGroup: { gap: 6 },
  settingsGroupTitle: {
    ...Typography.overline,
    marginBottom: 6,
    marginLeft: Spacing.xxs,
  },
  settingsGroupContent: {},
  settingsGroupFooter: {
    ...Typography.caption1,
    lineHeight: 18,
    marginTop: 6,
    marginLeft: Spacing.xxs,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm + Spacing.hairline,
    gap: Spacing.sm,
    minHeight: 44,
  },
  settingsRowIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsRowEmoji: { fontSize: 16 },
  settingsRowLabel: {
    ...Typography.body,
  },
  settingsRowValue: {
    ...Typography.subheadline,
  },
  settingsChevron: {
    fontSize: 20,
    fontWeight: '300',
  },

  versionText: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 8,
    marginBottom: 16,
  },
});
