/**
 * Declutterly -- Notification Permission Screen (V1)
 * Matches Pencil design: FEmgi
 * Mascot avatar, benefit cards with icons, coral CTA.
 */

import { MascotAvatar } from '@/components/ui';
import { convex } from '@/config/convex';
import { V1 } from '@/constants/designTokens';
import { api } from '@/convex/_generated/api';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import {
  registerForPushNotifications,
  scheduleShameFreeReminder,
  scheduleComebackNudge,
} from '@/services/notifications';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Bell, Flame, Heart, Trophy } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import Animated, {
    FadeIn,
    FadeInDown,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── Benefit items with notification previews ───────────────────────────────
const BENEFITS = [
  {
    icon: 'trophy' as const,
    color: V1.green,
    title: 'Achievements',
    subtitle: '"You just unlocked Streak Master!"',
  },
  {
    icon: 'flame' as const,
    color: V1.amber,
    title: 'Streak Alerts',
    subtitle: '"3 days in a row! Keep it going!"',
  },
  {
    icon: 'bell' as const,
    color: V1.coral,
    title: 'Gentle Reminders',
    subtitle: '"Good morning! Ready for a quick win?"',
  },
  {
    icon: 'heart' as const,
    color: V1.blue,
    title: 'Dusty Updates',
    subtitle: '"Dusty brought back a surprise!"',
  },
];

function BenefitIcon({ name, size, color }: { name: string; size: number; color: string }) {
  switch (name) {
    case 'bell':
      return <Bell size={size} color={color} />;
    case 'flame':
      return <Flame size={size} color={color} />;
    case 'trophy':
      return <Trophy size={size} color={color} />;
    case 'heart':
      return <Heart size={size} color={color} />;
    default:
      return <Bell size={size} color={color} />;
  }
}

function BenefitRow({
  icon,
  color,
  title,
  subtitle,
  isDark,
  delay,
}: {
  icon: string;
  color: string;
  title: string;
  subtitle: string;
  isDark: boolean;
  delay: number;
}) {
  const t = isDark ? V1.dark : V1.light;
  const reducedMotion = useReducedMotion();
  return (
    <Animated.View
      entering={reducedMotion ? undefined : FadeInDown.delay(delay).duration(350)}
      style={[
        styles.benefitItem,
        { backgroundColor: t.card, borderColor: t.border },
      ]}
    >
      <View style={[styles.benefitIconWrap, { backgroundColor: `${color}15` }]}>
        <BenefitIcon name={icon} size={20} color={color} />
      </View>
      <View style={styles.benefitTextWrap}>
        <Text style={[styles.benefitTitle, { color: t.text }]}>{title}</Text>
        <Text style={[styles.benefitSubtitle, { color: t.textSecondary }]}>
          {subtitle}
        </Text>
      </View>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────
export default function NotificationPermissionScreen() {
  const rawScheme = useColorScheme();
  const isDark = rawScheme === 'dark';
  const t = isDark ? V1.dark : V1.light;
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();

  const [isRequesting, setIsRequesting] = useState(false);

  const handleEnableNotifications = async () => {
    if (isRequesting) return;
    setIsRequesting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const token = await registerForPushNotifications();
      if (token) {
        try {
          await convex.mutation(api.notifications.savePushToken, { token });
        } catch (err) {
          if (__DEV__) console.info('Failed to save push token:', err);
        }
      }

      // Permission was granted — schedule the first daily reminder and comeback nudge
      try {
        await scheduleShameFreeReminder(9, 0);
        await scheduleComebackNudge(3);
      } catch (err) {
        if (__DEV__) console.info('Error scheduling initial notifications:', err);
      }
    } catch (err) {
      if (__DEV__) console.info('Error requesting notifications:', err);
    } finally {
      setIsRequesting(false);
    }
    router.replace('/paywall');
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace('/paywall');
  };

  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <View
        style={[
          styles.content,
          { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 16 },
        ]}
      >
        {/* Mascot */}
        <Animated.View
          entering={reducedMotion ? undefined : FadeIn.delay(100).duration(400)}
          style={styles.mascotWrap}
        >
          <View style={styles.mascotCircle}>
            <MascotAvatar imageKey="waving" size={130} showBackground={false} />
          </View>
        </Animated.View>

        {/* Title */}
        <Animated.Text
          entering={reducedMotion ? undefined : FadeIn.delay(200).duration(350)}
          style={[styles.title, { color: t.text }]}
        >
          Stay on Track
        </Animated.Text>

        {/* Subtitle */}
        <Animated.Text
          entering={reducedMotion ? undefined : FadeIn.delay(300).duration(350)}
          style={[styles.subtitle, { color: t.textSecondary }]}
        >
          Dusty wants to cheer you on!
        </Animated.Text>

        {/* Benefits */}
        <View style={styles.benefitsContainer}>
          {BENEFITS.map((benefit, idx) => (
            <BenefitRow
              key={benefit.title}
              {...benefit}
              isDark={isDark}
              delay={400 + idx * 100}
            />
          ))}
        </View>

        {/* Spacer */}
        <View style={{ flex: 1 }} />

        {/* CTA Button */}
        <Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(800).duration(350)}>
          <Pressable
            onPress={handleEnableNotifications}
            disabled={isRequesting}
            style={({ pressed }) => [
              styles.coralButton,
              { opacity: pressed || isRequesting ? 0.85 : 1 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Enable notifications"
          >
            <Text style={styles.coralButtonText}>
              {isRequesting ? 'Enabling...' : 'Enable Notifications'}
            </Text>
          </Pressable>
        </Animated.View>

        {/* Skip */}
        <Pressable
          onPress={handleSkip}
          disabled={isRequesting}
          style={styles.skipButton}
          accessibilityRole="button"
          accessibilityLabel="Skip notifications for now"
        >
          <Text style={[styles.skipText, { color: t.textMuted }]}>
            Maybe later
          </Text>
        </Pressable>

        {/* Reassurance */}
        <Text style={[{ fontSize: 12, color: t.textMuted, textAlign: 'center', marginTop: 4 }]}>
          You can adjust or turn off notifications anytime in Settings
        </Text>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
  },

  // ── Mascot ──
  mascotWrap: {
    marginBottom: 16,
  },
  mascotCircle: {
    width: 90,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Text ──
  title: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.4,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 28,
  },

  // ── Benefits ──
  benefitsContainer: {
    width: '100%',
    gap: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 14,
  },
  benefitIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitTextWrap: {
    flex: 1,
    gap: 2,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  benefitSubtitle: {
    fontSize: 13,
  },

  // ── CTA ──
  coralButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 28,
    height: 56,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  coralButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },

  // ── Skip ──
  skipButton: {
    paddingVertical: 12,
    minHeight: 44,
    justifyContent: 'center',
  },
  skipText: {
    fontSize: 15,
    textAlign: 'center',
  },
});
