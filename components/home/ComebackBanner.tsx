/**
 * ComebackBanner -- Comeback flow for returning users
 * Shows welcome back message + one tiny thing CTA.
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { X, Gift, Shield } from 'lucide-react-native';
import { V1, BODY_FONT, DISPLAY_FONT, RADIUS, SPACING } from '@/constants/designTokens';
import type { OneTinyThingTask } from '@/services/comebackEngine';

// ── Grace Period Badge ──────────────────────────────────────────────────────

interface GracePeriodBadgeProps {
  badge: { emoji: string; text: string };
  isDark: boolean;
  reducedMotion: boolean;
}

export function GracePeriodBadge({ badge, isDark, reducedMotion }: GracePeriodBadgeProps) {
  const t = isDark ? V1.dark : V1.light;
  return (
    <Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(85).duration(400)}>
      <View
        style={[
          styles.streakNudge,
          {
            backgroundColor: isDark ? 'rgba(100,181,246,0.08)' : 'rgba(100,181,246,0.1)',
            borderColor: isDark ? 'rgba(100,181,246,0.2)' : 'rgba(100,181,246,0.25)',
          },
        ]}
      >
        <Text style={{ fontSize: 16 }}>{badge.emoji}</Text>
        <Text style={[styles.streakNudgeText, { color: isDark ? V1.blue : '#1565C0' }]}>
          {badge.text}
        </Text>
      </View>
    </Animated.View>
  );
}

// ── Streak Nudge ────────────────────────────────────────────────────────────

interface StreakNudgeProps {
  message: string;
  isDark: boolean;
  reducedMotion: boolean;
}

export function StreakNudge({ message, isDark, reducedMotion }: StreakNudgeProps) {
  return (
    <Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(90).duration(400)}>
      <View
        style={[
          styles.streakNudge,
          {
            backgroundColor: isDark ? 'rgba(255,213,79,0.08)' : 'rgba(255,213,79,0.1)',
            borderColor: isDark ? 'rgba(255,213,79,0.2)' : 'rgba(255,213,79,0.25)',
          },
        ]}
      >
        <Shield size={16} color={V1.gold} />
        <Text style={[styles.streakNudgeText, { color: isDark ? V1.gold : '#B8860B' }]}>
          {message}
        </Text>
      </View>
    </Animated.View>
  );
}

// ── Comeback Card ───────────────────────────────────────────────────────────

interface ComebackBannerProps {
  message: string;
  submessage: string;
  emoji: string;
  bonusActive: boolean;
  tinyTask: OneTinyThingTask;
  isDark: boolean;
  reducedMotion: boolean;
  onDismiss: () => void;
  onTinyTaskPress: () => void;
}

export function ComebackBanner({
  message,
  submessage,
  emoji,
  bonusActive,
  tinyTask,
  isDark,
  reducedMotion,
  onDismiss,
  onTinyTaskPress,
}: ComebackBannerProps) {
  const t = isDark ? V1.dark : V1.light;

  return (
    <Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(95).duration(400)}>
      <View
        style={[
          styles.comebackCard,
          {
            backgroundColor: isDark ? 'rgba(255,107,107,0.06)' : 'rgba(255,107,107,0.04)',
            borderColor: isDark ? 'rgba(255,107,107,0.2)' : 'rgba(255,107,107,0.15)',
          },
        ]}
      >
        {/* Dismiss */}
        <Pressable
          onPress={onDismiss}
          style={styles.comebackDismiss}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Dismiss welcome back card"
        >
          <X size={16} color={t.textMuted} />
        </Pressable>

        <Text style={styles.comebackEmoji}>{emoji}</Text>
        <Text style={[styles.comebackMessage, { color: t.text }]}>{message}</Text>
        <Text style={[styles.comebackSubmessage, { color: t.textSecondary }]}>
          {submessage}
        </Text>

        {bonusActive && (
          <View style={styles.comebackBonusBadge}>
            <Gift size={12} color="#FFFFFF" />
            <Text style={styles.comebackBonusText}>Bonus XP Active</Text>
          </View>
        )}

        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onTinyTaskPress();
          }}
          style={({ pressed }) => [
            styles.comebackTinyTask,
            {
              backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
              opacity: pressed ? 0.88 : 1,
            },
          ]}
        >
          <Text style={styles.comebackTinyEmoji}>{tinyTask.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.comebackTinyLabel, { color: t.textMuted }]}>ONE TINY THING</Text>
            <Text style={[styles.comebackTinyTitle, { color: t.text }]}>{tinyTask.title}</Text>
            <Text style={[styles.comebackTinyDesc, { color: t.textSecondary }]}>
              {tinyTask.description}
            </Text>
            <Text style={[styles.comebackTinyTap, { color: V1.coral }]}>Tap to start {'\u2192'}</Text>
          </View>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  streakNudge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: SPACING.cardPadding,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: 12,
  },
  streakNudgeText: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: BODY_FONT,
    flex: 1,
    lineHeight: 18,
  },
  comebackCard: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.cardPadding,
    marginBottom: 16,
    alignItems: 'center',
    position: 'relative',
  },
  comebackDismiss: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 1,
  },
  comebackEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  comebackMessage: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: DISPLAY_FONT,
    textAlign: 'center',
    marginBottom: 4,
  },
  comebackSubmessage: {
    fontSize: 14,
    fontFamily: BODY_FONT,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 20,
  },
  comebackBonusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: V1.coral,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    marginBottom: 14,
  },
  comebackBonusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: BODY_FONT,
  },
  comebackTinyTask: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 12,
    borderRadius: RADIUS.md,
    width: '100%',
  },
  comebackTinyEmoji: {
    fontSize: 24,
    marginTop: 2,
  },
  comebackTinyLabel: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: BODY_FONT,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  comebackTinyTitle: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: BODY_FONT,
    marginBottom: 2,
  },
  comebackTinyDesc: {
    fontSize: 13,
    fontFamily: BODY_FONT,
    lineHeight: 18,
  },
  comebackTinyTap: {
    fontSize: 12,
    fontFamily: BODY_FONT,
    fontWeight: '600',
    marginTop: 6,
  },
});
