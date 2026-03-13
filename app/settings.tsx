/**
 * Declutterly — Settings Screen (Apple 2026)
 * Consolidated to 3 groups: Account, Preferences, Support
 * Reset requires typing "RESET", no-op handlers removed
 */

import { Colors, ColorTokens } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Typography } from '@/theme/typography';
import { Spacing, BorderRadius } from '@/theme/spacing';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { useDeclutter } from '@/context/DeclutterContext';
import { useReducedMotion } from '@/hooks/useReducedMotion';

// Settings Row
interface RowProps {
  emoji: string;
  label: string;
  sublabel?: string;
  value?: string;
  onPress?: () => void;
  toggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (v: boolean) => void;
  destructive?: boolean;
  colors: ColorTokens;
  isDark: boolean;
  isFirst?: boolean;
  isLast?: boolean;
}

function Row({
  emoji, label, sublabel, value, onPress, toggle, toggleValue, onToggle,
  destructive, colors, isDark, isFirst, isLast,
}: RowProps) {
  const isInteractive = !!(onPress || toggle);

  return (
    <Pressable
      onPress={() => {
        if (onPress) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }
      }}
      disabled={!isInteractive}
      accessibilityRole={toggle ? 'switch' : onPress ? 'button' : 'none'}
      accessibilityLabel={label}
      accessibilityHint={sublabel}
      accessibilityState={toggle ? { checked: toggleValue } : undefined}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: isDark ? colors.surface : '#FFFFFF',
          opacity: pressed && onPress ? 0.7 : 1,
        },
        isFirst && styles.rowFirst,
        isLast && styles.rowLast,
        !isLast && {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: isDark ? colors.divider : colors.borderLight,
        },
      ]}
    >
      {/* Icon */}
      <View style={[styles.rowIcon, {
        backgroundColor: destructive
          ? colors.dangerMuted
          : (isDark ? colors.fillTertiary : colors.surfaceTertiary),
      }]}>
        <Text style={styles.rowEmoji} accessibilityElementsHidden>{emoji}</Text>
      </View>

      {/* Label */}
      <View style={styles.rowContent}>
        <Text style={[styles.rowLabel, {
          color: destructive ? colors.danger : colors.text,
        }]}>
          {label}
        </Text>
        {sublabel && (
          <Text style={[styles.rowSublabel, { color: colors.textSecondary }]}>
            {sublabel}
          </Text>
        )}
      </View>

      {/* Right side */}
      {toggle ? (
        <Switch
          value={toggleValue}
          onValueChange={(v) => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onToggle?.(v);
          }}
          trackColor={{ false: colors.fillTertiary, true: colors.accent }}
          thumbColor="#FFFFFF"
          ios_backgroundColor={colors.fillTertiary}
        />
      ) : value ? (
        <Text style={[styles.rowValue, { color: colors.textSecondary }]}>{value}</Text>
      ) : onPress ? (
        <Text style={[styles.rowChevron, { color: colors.textTertiary }]}>{'>'}</Text>
      ) : null}
    </Pressable>
  );
}

// Settings Group
interface GroupProps {
  title?: string;
  footer?: string;
  children: React.ReactNode;
  colors: ColorTokens;
  isDark: boolean;
}

function Group({ title, footer, children, colors, isDark }: GroupProps) {
  return (
    <View style={styles.group}>
      {title && (
        <Text style={[styles.groupTitle, { color: colors.textSecondary }]}>
          {title.toUpperCase()}
        </Text>
      )}
      <View style={[styles.groupContent, {
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: isDark ? colors.divider : colors.borderLight,
      }]}>
        {children}
      </View>
      {footer && (
        <Text style={[styles.groupFooter, { color: colors.textSecondary }]}>
          {footer}
        </Text>
      )}
    </View>
  );
}

// Main Screen
export default function SettingsScreen() {
  const rawScheme = useColorScheme();
  const colorScheme = rawScheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();

  const { signOut } = useAuth();
  const { user, resetStats } = useDeclutter();

  // Toggle states
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [dailyReminder, setDailyReminder] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hapticEnabled, setHapticEnabled] = useState(true);

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          await signOut();
          router.replace('/auth/login');
        },
      },
    ]);
  };

  // Reset requires typing "RESET"
  const handleResetProgress = () => {
    Alert.prompt(
      'Reset All Progress',
      'This will permanently delete all your rooms, tasks, and progress. Type "RESET" to confirm.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Everything',
          style: 'destructive',
          onPress: (input?: string) => {
            if (input?.trim().toUpperCase() === 'RESET') {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              resetStats?.();
            } else {
              Alert.alert('Reset Cancelled', 'You must type "RESET" to confirm.');
            }
          },
        },
      ],
      'plain-text'
    );
  };

  const handleRateApp = async () => {
    try {
      // Open App Store page for rating
      await Linking.openURL('https://apps.apple.com/app/declutterly');
    } catch {
      // Unable to open App Store
    }
  };

  const handleContactSupport = () => {
    Linking.openURL('mailto:support@declutterly.app?subject=Declutterly%20Support');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.navBar, {
        paddingTop: insets.top,
        backgroundColor: colors.background,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: isDark ? colors.divider : colors.borderLight,
      }]}>
        <Pressable
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={[styles.backIcon, { color: colors.accent }]}>{'<'}</Text>
          <Text style={[Typography.body, { color: colors.accent }]}>Back</Text>
        </Pressable>
        <Text style={[Typography.navTitle, { color: colors.text }]}>Settings</Text>
        <View style={styles.navSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Account */}
        <Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(0).springify()}>
          <Group title="Account" colors={colors} isDark={isDark}>
            <Row
              emoji="N"
              label={user?.name || 'Your Name'}
              sublabel="Tap to edit your profile"
              onPress={() => router.push('/profile/edit' as any)}
              colors={colors}
              isDark={isDark}
              isFirst
            />
            <Row
              emoji="B"
              label="Push Notifications"
              toggle
              toggleValue={notificationsEnabled}
              onToggle={setNotificationsEnabled}
              colors={colors}
              isDark={isDark}
            />
            <Row
              emoji="R"
              label="Daily Reminder"
              sublabel="Get reminded to declutter each day"
              toggle
              toggleValue={dailyReminder}
              onToggle={setDailyReminder}
              colors={colors}
              isDark={isDark}
              isLast
            />
          </Group>
        </Animated.View>

        {/* Preferences */}
        <Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(60).springify()}>
          <Group
            title="Preferences"
            footer="Sound and haptic feedback enhance the decluttering experience."
            colors={colors}
            isDark={isDark}
          >
            <Row
              emoji="S"
              label="Sound Effects"
              toggle
              toggleValue={soundEnabled}
              onToggle={setSoundEnabled}
              colors={colors}
              isDark={isDark}
              isFirst
            />
            <Row
              emoji="H"
              label="Haptic Feedback"
              toggle
              toggleValue={hapticEnabled}
              onToggle={setHapticEnabled}
              colors={colors}
              isDark={isDark}
              isLast
            />
          </Group>
        </Animated.View>

        {/* Support & Account Actions */}
        <Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(120).springify()}>
          <Group
            title="Support"
            footer="These destructive actions are permanent and cannot be undone."
            colors={colors}
            isDark={isDark}
          >
            <Row
              emoji="R"
              label="Rate the App"
              onPress={handleRateApp}
              colors={colors}
              isDark={isDark}
              isFirst
            />
            <Row
              emoji="C"
              label="Contact Support"
              onPress={handleContactSupport}
              colors={colors}
              isDark={isDark}
            />
            <Row
              emoji="T"
              label="Reset All Progress"
              sublabel="Requires typing RESET to confirm"
              onPress={handleResetProgress}
              destructive
              colors={colors}
              isDark={isDark}
            />
            <Row
              emoji="X"
              label="Sign Out"
              onPress={handleSignOut}
              destructive
              colors={colors}
              isDark={isDark}
              isLast
            />
          </Group>
        </Animated.View>

        {/* Version */}
        <Text style={[styles.versionText, { color: colors.textTertiary }]}>
          Declutterly v1.0.0 {'\n'} Made with care for a cleaner life
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    minHeight: 44,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    minWidth: 70,
    minHeight: 44,
  },
  backIcon: {
    fontSize: 28,
    fontWeight: '300',
    lineHeight: 32,
  },
  navSpacer: { minWidth: 70 },

  scrollView: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.ml,
    paddingTop: Spacing.md,
    gap: 0,
  },

  group: {
    marginBottom: Spacing.lg + Spacing.xxs,
  },
  groupTitle: {
    ...Typography.overline,
    marginBottom: Spacing.xs,
    marginLeft: Spacing.xxs,
  },
  groupContent: {},
  groupFooter: {
    ...Typography.caption1,
    lineHeight: 18,
    marginTop: Spacing.xs,
    marginLeft: Spacing.xxs,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    minHeight: 52,
  },
  rowFirst: {
    borderTopLeftRadius: BorderRadius.md,
    borderTopRightRadius: BorderRadius.md,
  },
  rowLast: {
    borderBottomLeftRadius: BorderRadius.md,
    borderBottomRightRadius: BorderRadius.md,
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowEmoji: { fontSize: 16 },
  rowContent: { flex: 1, gap: 2 },
  rowLabel: {
    ...Typography.body,
  },
  rowSublabel: {
    ...Typography.caption1,
  },
  rowValue: {
    ...Typography.subheadline,
  },
  rowChevron: {
    fontSize: 22,
    fontWeight: '300',
  },

  versionText: {
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
  },
});
