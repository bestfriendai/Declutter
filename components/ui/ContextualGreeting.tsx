/**
 * ContextualGreeting - Smart greeting based on time, progress, and user state
 * Provides personalized, time-aware greetings with encouragement
 */

import React, { useMemo } from 'react';
import { useColorScheme } from '@/hooks/useColorScheme';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/theme/typography';
import { Spacing } from '@/theme/spacing';

interface ContextualGreetingProps {
  userName?: string;
  streakDays?: number;
  tasksCompletedToday?: number;
  totalPendingTasks?: number;
  lastActiveDate?: Date;
  style?: object;
}

interface Greeting {
  title: string;
  subtitle: string;
  emoji?: string;
}

export function ContextualGreeting({
  userName = 'Friend',
  streakDays = 0,
  tasksCompletedToday = 0,
  totalPendingTasks = 0,
  lastActiveDate,
  style,
}: ContextualGreetingProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const greeting = useMemo((): Greeting => {
    const hour = new Date().getHours();
    const dayOfWeek = new Date().getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const firstName = userName.split(' ')[0];

    // Check if user has been away
    if (lastActiveDate) {
      const daysSinceActive = Math.floor(
        (Date.now() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceActive >= 7) {
        return {
          title: `Welcome back, ${firstName}!`,
          subtitle: "We missed you! Let's start with something small today.",
          emoji: '👋',
        };
      }

      if (daysSinceActive >= 3) {
        return {
          title: `Hey ${firstName}!`,
          subtitle: "Ready to pick up where you left off?",
          emoji: '✨',
        };
      }
    }

    // Streak-based greetings
    if (streakDays >= 7) {
      return {
        title: `Day ${streakDays} streak! 🔥`,
        subtitle: `You're on fire, ${firstName}! Keep it going!`,
        emoji: '🔥',
      };
    }

    if (streakDays >= 3) {
      return {
        title: `${streakDays} days strong!`,
        subtitle: "Your consistency is paying off!",
        emoji: '💪',
      };
    }

    // Task completion-based greetings
    if (tasksCompletedToday >= 5) {
      return {
        title: `Amazing progress, ${firstName}!`,
        subtitle: `${tasksCompletedToday} tasks done today! Take a well-deserved break.`,
        emoji: '🎉',
      };
    }

    if (tasksCompletedToday >= 3) {
      return {
        title: `Great momentum!`,
        subtitle: `${tasksCompletedToday} tasks completed. Keep crushing it!`,
        emoji: '⚡',
      };
    }

    // Time-based greetings
    if (hour >= 5 && hour < 12) {
      // Morning
      if (totalPendingTasks > 0) {
        return {
          title: `Good morning, ${firstName}!`,
          subtitle: isWeekend
            ? "Perfect weekend morning to tackle some tasks!"
            : "Fresh start! What shall we conquer first?",
          emoji: '☀️',
        };
      }
      return {
        title: `Good morning, ${firstName}!`,
        subtitle: "Ready to start fresh today?",
        emoji: '🌅',
      };
    }

    if (hour >= 12 && hour < 17) {
      // Afternoon
      if (tasksCompletedToday === 0 && totalPendingTasks > 0) {
        return {
          title: `Afternoon, ${firstName}!`,
          subtitle: "Got a few minutes? One quick task can shift your day!",
          emoji: '⏰',
        };
      }
      return {
        title: `Good afternoon!`,
        subtitle: tasksCompletedToday > 0
          ? "Nice progress so far! Ready for more?"
          : "Great time for a quick decluttering session!",
        emoji: '☀️',
      };
    }

    if (hour >= 17 && hour < 21) {
      // Evening
      if (tasksCompletedToday === 0 && streakDays > 0) {
        return {
          title: `Evening, ${firstName}!`,
          subtitle: `Quick! A 2-minute task will save your ${streakDays}-day streak!`,
          emoji: '🔥',
        };
      }
      return {
        title: `Good evening!`,
        subtitle: tasksCompletedToday > 0
          ? "Wind down with satisfaction of a productive day!"
          : "Perfect time to prepare for a fresh tomorrow.",
        emoji: '🌆',
      };
    }

    // Night (21+)
    return {
      title: `Night owl, ${firstName}?`,
      subtitle: totalPendingTasks > 0
        ? "Set yourself up for success tomorrow!"
        : "Rest well, you've earned it!",
      emoji: '🌙',
    };
  }, [userName, streakDays, tasksCompletedToday, totalPendingTasks, lastActiveDate]);

  return (
    <Animated.View
      entering={FadeInDown.delay(100).springify()}
      style={[styles.container, style]}
    >
      <View style={styles.greetingRow}>
        {greeting.emoji && (
          <Text style={styles.emoji}>{greeting.emoji}</Text>
        )}
        <View style={styles.textContainer}>
          <Text style={[Typography.title2, styles.title, { color: colors.text }]}>
            {greeting.title}
          </Text>
          <Text
            style={[
              Typography.subheadline,
              styles.subtitle,
              { color: colors.textSecondary },
            ]}
          >
            {greeting.subtitle}
          </Text>
        </View>
      </View>

      {/* Streak indicator */}
      {streakDays > 0 && (
        <View style={[styles.streakBadge, { backgroundColor: colors.warningMuted }]}>
          <Text style={styles.streakEmoji}>🔥</Text>
          <Text style={[Typography.caption1Medium, { color: colors.warning }]}>
            {streakDays} day streak
          </Text>
        </View>
      )}
    </Animated.View>
  );
}

// Compact version for smaller spaces
export function CompactGreeting({
  userName = 'Friend',
  streakDays = 0,
}: {
  userName?: string;
  streakDays?: number;
}) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const hour = new Date().getHours();
  const firstName = userName.split(' ')[0];

  let timeGreeting = 'Hello';
  if (hour >= 5 && hour < 12) timeGreeting = 'Good morning';
  else if (hour >= 12 && hour < 17) timeGreeting = 'Good afternoon';
  else if (hour >= 17 && hour < 21) timeGreeting = 'Good evening';
  else timeGreeting = 'Good night';

  return (
    <View style={styles.compactContainer}>
      <Text style={[Typography.headline, { color: colors.text }]}>
        {timeGreeting}, {firstName}!
      </Text>
      {streakDays > 0 && (
        <Text style={[Typography.caption1, { color: colors.warning }]}>
          🔥 {streakDays}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  emoji: {
    fontSize: 32,
    marginRight: Spacing.sm,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    marginBottom: Spacing.xxs,
  },
  subtitle: {
    lineHeight: 20,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs,
    borderRadius: 12,
    marginTop: Spacing.sm,
    gap: Spacing.xxs,
  },
  streakEmoji: {
    fontSize: 14,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});

export default ContextualGreeting;
