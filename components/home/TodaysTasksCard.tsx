/**
 * TodaysTasksCard -- Today's tasks with completion checkboxes
 * Includes micro-celebration haptic + visual feedback on completion.
 */

import React, { useCallback, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Check } from 'lucide-react-native';
import {
  V1,
  BODY_FONT,
  SPACING,
  RADIUS,
  cardStyle,
} from '@/constants/designTokens';
import type { TodayTask } from '@/hooks/useTodaysTasks';
import type { ConsistencyResult } from '@/hooks/useConsistencyScore';

interface TodaysTasksCardProps {
  todaysTasks: TodayTask[];
  consistency: ConsistencyResult;
  isDark: boolean;
  reducedMotion: boolean;
  onToggleTask: (roomId: string, taskId: string) => void;
}

export function TodaysTasksCard({
  todaysTasks,
  consistency,
  isDark,
  reducedMotion,
  onToggleTask,
}: TodaysTasksCardProps) {
  const t = isDark ? V1.dark : V1.light;

  // Micro-celebration scale value
  const celebrationScale = useSharedValue(1);
  const celebrationAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: celebrationScale.value }],
  }));

  const handleTaskPress = useCallback(
    (task: TodayTask) => {
      if (task.source === 'tiny-thing') return;
      if (task.originalTask) {
        // Micro-celebration: haptic + scale pulse
        if (!task.completed) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          celebrationScale.value = withSequence(
            withTiming(1.03, { duration: 100 }),
            withTiming(1, { duration: 200 }),
          );
        } else {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        onToggleTask(task.roomId, task.id);
      }
    },
    [onToggleTask, celebrationScale],
  );

  if (todaysTasks.length === 0) return null;

  return (
    <Animated.View
      entering={reducedMotion ? undefined : FadeInDown.delay(100).duration(400)}
      style={celebrationAnimStyle}
    >
      <Text style={[styles.sectionTitle, { color: t.textMuted, marginTop: 4 }]}>
        TODAY'S TASKS
      </Text>
      <View style={[styles.todayTasksCard, cardStyle(isDark)]}>
        {/* Consistency label */}
        <View style={styles.todayTasksHeader}>
          <Text style={[styles.todayTasksHeaderText, { color: t.textSecondary }]}>
            {consistency.activeDays} of {consistency.windowDays} days this week
          </Text>
          <Text style={[styles.todayTasksLabel, { color: V1.green }]}>
            {consistency.label}
          </Text>
        </View>

        {todaysTasks.map((task, idx) => (
          <Pressable
            key={task.id}
            onPress={() => handleTaskPress(task)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: task.completed }}
            accessibilityLabel={`${task.title} in ${task.roomName}, about ${task.estimatedMinutes} minutes`}
            style={({ pressed }) => [
              styles.todayTaskRow,
              idx < todaysTasks.length - 1 && {
                borderBottomWidth: 1,
                borderBottomColor: isDark
                  ? 'rgba(255,255,255,0.06)'
                  : 'rgba(0,0,0,0.05)',
              },
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            {/* Checkbox */}
            <View
              style={[
                styles.todayTaskCheck,
                {
                  borderColor: task.completed
                    ? V1.green
                    : isDark
                      ? 'rgba(255,255,255,0.2)'
                      : 'rgba(0,0,0,0.15)',
                  backgroundColor: task.completed ? V1.green : 'transparent',
                },
              ]}
            >
              {task.completed && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
            </View>

            {/* Task info */}
            <View style={styles.todayTaskInfo}>
              <Text
                style={[
                  styles.todayTaskTitle,
                  { color: task.completed ? t.textMuted : t.text },
                  task.completed && styles.todayTaskTitleDone,
                ]}
              >
                {task.emoji} {task.title}
              </Text>
              <View style={styles.todayTaskMeta}>
                <Text style={[styles.todayTaskRoom, { color: t.textMuted }]}>
                  {task.roomName}
                </Text>
                <Text style={[styles.todayTaskTime, { color: t.textMuted }]}>
                  ~{task.estimatedMinutes}m
                </Text>
              </View>
            </View>
          </Pressable>
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: BODY_FONT,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: SPACING.itemGap,
    marginTop: 8,
  },
  todayTasksCard: {
    marginBottom: 16,
    overflow: 'hidden',
  },
  todayTasksHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.cardPadding,
    paddingTop: 14,
    paddingBottom: 10,
  },
  todayTasksHeaderText: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: BODY_FONT,
  },
  todayTasksLabel: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: BODY_FONT,
  },
  todayTaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.cardPadding,
    paddingVertical: 12,
    gap: 12,
  },
  todayTaskCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayTaskInfo: {
    flex: 1,
  },
  todayTaskTitle: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: BODY_FONT,
    marginBottom: 2,
  },
  todayTaskTitleDone: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  todayTaskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  todayTaskRoom: {
    fontSize: 12,
    fontWeight: '400',
    fontFamily: BODY_FONT,
  },
  todayTaskTime: {
    fontSize: 12,
    fontWeight: '400',
    fontFamily: BODY_FONT,
  },
});
