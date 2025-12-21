/**
 * Declutterly - Profile Screen
 * iOS Settings style user profile and app settings
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  useColorScheme,
  Alert,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeInRight,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';

import { Colors } from '@/constants/Colors';
import { Typography } from '@/theme/typography';
import { useDeclutter } from '@/context/DeclutterContext';
import { GlassCard } from '@/components/ui/GlassCard';
import {
  GroupedList,
  GroupedListItem,
  ToggleListItem,
} from '@/components/ui/AnimatedListItem';
import { SingleRing } from '@/components/ui/ActivityRings';
import { isApiKeyConfigured } from '@/services/gemini';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function ProfileScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const { user, settings, updateSettings, stats, rooms, clearAllData, mascot } = useDeclutter();

  const apiKeyConfigured = isApiKeyConfigured();

  const handleResetData = () => {
    Alert.alert(
      'Reset All Data',
      'This will delete all your rooms, progress, and settings. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await clearAllData();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          },
        },
      ]
    );
  };

  // Calculate XP progress
  const xpProgress = (stats.xp % 100);
  const xpForNextLevel = 100;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View
          entering={FadeInDown.delay(100).springify()}
          style={styles.header}
        >
          <Text style={[Typography.largeTitle, { color: colors.text }]}>
            Profile
          </Text>
        </Animated.View>

        {/* Profile Card */}
        <Animated.View
          entering={FadeInDown.delay(200).springify()}
          style={styles.profileSection}
        >
          <GlassCard variant="hero" style={styles.profileCard}>
            {/* Avatar with Level Ring */}
            <View style={styles.avatarContainer}>
              <SingleRing
                value={xpProgress}
                maxValue={100}
                size={100}
                strokeWidth={6}
                showValue={false}
                gradientColors={[...colors.gradientPrimary]}
              >
                <View style={styles.avatarInner}>
                  <Text style={styles.avatarEmoji}>
                    {mascot?.personality ? (mascot.personality === 'spark' ? '⚡' : mascot.personality === 'bubbles' ? '🫧' : mascot.personality === 'dusty' ? '🧹' : '✨') : '👤'}
                  </Text>
                </View>
              </SingleRing>
              <View style={styles.levelBadge}>
                <LinearGradient
                  colors={[...colors.gradientPrimary]}
                  style={styles.levelBadgeGradient}
                >
                  <Text style={styles.levelText}>{stats.level}</Text>
                </LinearGradient>
              </View>
            </View>

            {/* User Info */}
            <View style={styles.userInfo}>
              <Text style={[Typography.title1, { color: colors.text }]}>
                {user?.name || 'Declutterer'}
              </Text>
              <Text style={[Typography.subheadline, { color: colors.textSecondary, marginTop: 4 }]}>
                Level {stats.level} • {xpProgress} / {xpForNextLevel} XP
              </Text>

              {/* XP Bar */}
              <View style={styles.xpBarContainer}>
                <View style={[styles.xpBarBg, { backgroundColor: colors.surfaceSecondary }]}>
                  <Animated.View style={[styles.xpBarFill, { width: `${xpProgress}%` }]}>
                    <LinearGradient
                      colors={[...colors.gradientPrimary]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={StyleSheet.absoluteFill}
                    />
                  </Animated.View>
                </View>
              </View>
            </View>

            {/* Quick Stats */}
            <View style={styles.quickStats}>
              <QuickStatItem
                value={stats.totalTasksCompleted}
                label="Tasks"
                colors={colors}
              />
              <View style={styles.statDivider} />
              <QuickStatItem
                value={rooms.length}
                label="Rooms"
                colors={colors}
              />
              <View style={styles.statDivider} />
              <QuickStatItem
                value={stats.currentStreak}
                label="Streak"
                colors={colors}
              />
              <View style={styles.statDivider} />
              <QuickStatItem
                value={stats.badges.length}
                label="Badges"
                colors={colors}
              />
            </View>
          </GlassCard>
        </Animated.View>

        {/* Preferences Section */}
        <Animated.View
          entering={FadeInDown.delay(300).springify()}
          style={styles.section}
        >
          <GroupedList header="PREFERENCES">
            <ToggleListItem
              title="Notifications"
              subtitle="Daily reminders to declutter"
              leftIcon={<Text style={styles.listIcon}>🔔</Text>}
              value={settings.notifications}
              onValueChange={(value) => updateSettings({ notifications: value })}
            />
            <ToggleListItem
              title="Haptic Feedback"
              subtitle="Vibration on interactions"
              leftIcon={<Text style={styles.listIcon}>📳</Text>}
              value={settings.hapticFeedback}
              onValueChange={(value) => updateSettings({ hapticFeedback: value })}
            />
            <GroupedListItem
              title="Theme"
              leftIcon={<Text style={styles.listIcon}>🎨</Text>}
              rightElement={
                <Text style={[Typography.body, { color: colors.textSecondary }]}>
                  {settings.theme === 'auto' ? 'System' : settings.theme === 'dark' ? 'Dark' : 'Light'}
                </Text>
              }
              showChevron
              onPress={() => {
                const next = settings.theme === 'auto' ? 'light' : settings.theme === 'light' ? 'dark' : 'auto';
                updateSettings({ theme: next });
              }}
            />
          </GroupedList>
        </Animated.View>

        {/* AI Settings Section */}
        <Animated.View
          entering={FadeInDown.delay(400).springify()}
          style={styles.section}
        >
          <GroupedList
            header="AI ASSISTANT"
            footer={apiKeyConfigured ? "AI features are ready." : "Configure API key in .env file."}
          >
            <GroupedListItem
              title="Gemini AI"
              leftIcon={<Text style={styles.listIcon}>{apiKeyConfigured ? '✅' : '🔑'}</Text>}
              rightElement={
                <Text style={[Typography.body, { color: apiKeyConfigured ? colors.success : colors.warning }]}>
                  {apiKeyConfigured ? 'Ready' : 'Not configured'}
                </Text>
              }
            />
            <GroupedListItem
              title="Encouragement Level"
              leftIcon={<Text style={styles.listIcon}>💪</Text>}
              rightElement={
                <Text style={[Typography.body, { color: colors.textSecondary, textTransform: 'capitalize' }]}>
                  {settings.encouragementLevel}
                </Text>
              }
              showChevron
              onPress={() => {
                const levels = ['minimal', 'moderate', 'maximum'] as const;
                const currentIndex = levels.indexOf(settings.encouragementLevel);
                const next = levels[(currentIndex + 1) % levels.length];
                updateSettings({ encouragementLevel: next });
              }}
            />
            <GroupedListItem
              title="Task Breakdown"
              subtitle="How detailed the AI breaks down tasks"
              leftIcon={<Text style={styles.listIcon}>📋</Text>}
              rightElement={
                <Text style={[Typography.body, { color: colors.textSecondary, textTransform: 'capitalize' }]}>
                  {settings.taskBreakdownLevel}
                </Text>
              }
              showChevron
              onPress={() => {
                const levels = ['normal', 'detailed', 'ultra'] as const;
                const currentIndex = levels.indexOf(settings.taskBreakdownLevel);
                const next = levels[(currentIndex + 1) % levels.length];
                updateSettings({ taskBreakdownLevel: next });
              }}
            />
          </GroupedList>
        </Animated.View>

        {/* About Section */}
        <Animated.View
          entering={FadeInDown.delay(500).springify()}
          style={styles.section}
        >
          <GroupedList header="ABOUT">
            <GroupedListItem
              title="Version"
              leftIcon={<Text style={styles.listIcon}>📱</Text>}
              rightElement={
                <Text style={[Typography.body, { color: colors.textSecondary }]}>
                  1.0.0
                </Text>
              }
            />
            <GroupedListItem
              title="Rate App"
              leftIcon={<Text style={styles.listIcon}>⭐</Text>}
              showChevron
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                // Would open app store link
              }}
            />
            <GroupedListItem
              title="Send Feedback"
              leftIcon={<Text style={styles.listIcon}>💬</Text>}
              showChevron
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                Linking.openURL('mailto:support@declutterly.app');
              }}
            />
            <GroupedListItem
              title="Privacy Policy"
              leftIcon={<Text style={styles.listIcon}>🔒</Text>}
              showChevron
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            />
          </GroupedList>
        </Animated.View>

        {/* Tips Section */}
        <Animated.View
          entering={FadeInDown.delay(600).springify()}
          style={styles.section}
        >
          <GlassCard variant="subtle" style={styles.tipsCard}>
            <Text style={styles.tipsEmoji}>💡</Text>
            <Text style={[Typography.headline, { color: colors.text, marginBottom: 12 }]}>
              Quick Tips
            </Text>
            <View style={styles.tipsList}>
              <TipItem text="Start small - even 5 minutes counts!" colors={colors} />
              <TipItem text="Focus on one area at a time" colors={colors} />
              <TipItem text="Celebrate every completed task" colors={colors} />
              <TipItem text="It's okay to take breaks" colors={colors} />
              <TipItem text="Progress, not perfection" colors={colors} />
            </View>
          </GlassCard>
        </Animated.View>

        {/* Made with Love */}
        <Animated.View
          entering={FadeInDown.delay(700).springify()}
          style={styles.footer}
        >
          <Text style={[Typography.caption1, { color: colors.textTertiary, textAlign: 'center' }]}>
            Made with ❤️ for ADHD minds
          </Text>
        </Animated.View>

        {/* Danger Zone */}
        <Animated.View
          entering={FadeInDown.delay(800).springify()}
          style={styles.section}
        >
          <GroupedList header="DANGER ZONE">
            <GroupedListItem
              title="Reset All Data"
              leftIcon={<Text style={styles.listIcon}>⚠️</Text>}
              destructive
              showChevron
              onPress={handleResetData}
            />
          </GroupedList>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

// Quick Stat Item
function QuickStatItem({
  value,
  label,
  colors,
}: {
  value: number;
  label: string;
  colors: typeof Colors.dark;
}) {
  return (
    <View style={styles.quickStatItem}>
      <Text style={[Typography.title2, { color: colors.text }]}>{value}</Text>
      <Text style={[Typography.caption2, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

// Tip Item
function TipItem({ text, colors }: { text: string; colors: typeof Colors.dark }) {
  return (
    <View style={styles.tipItem}>
      <Text style={[styles.tipBullet, { color: colors.primary }]}>•</Text>
      <Text style={[Typography.subheadline, { color: colors.textSecondary, flex: 1 }]}>
        {text}
      </Text>
    </View>
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
  header: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  profileSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  profileCard: {
    padding: 24,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 36,
  },
  levelBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
  },
  levelBadgeGradient: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#000000',
  },
  levelText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  xpBarContainer: {
    width: '80%',
    marginTop: 12,
  },
  xpBarBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  xpBarFill: {
    height: '100%',
    borderRadius: 3,
    overflow: 'hidden',
  },
  quickStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingTop: 16,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  quickStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 0.5,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  listIcon: {
    fontSize: 20,
  },
  tipsCard: {
    padding: 20,
    alignItems: 'center',
  },
  tipsEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  tipsList: {
    width: '100%',
    gap: 8,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tipBullet: {
    fontSize: 16,
    marginRight: 8,
    marginTop: 1,
  },
  footer: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
});
