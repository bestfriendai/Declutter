/**
 * SwipeableTaskCard - Task card with swipe actions
 * Swipe right to complete, swipe left to snooze/skip
 * High priority item from UI/UX improvement guide
 */

import React, { useCallback, useState } from 'react';
import { useColorScheme } from '@/hooks/useColorScheme';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { Colors, PriorityColors } from '@/constants/Colors';
import { Typography } from '@/theme/typography';
import { BorderRadius, Spacing } from '@/theme/spacing';
import { SpringConfigs, ScaleValues } from '@/theme/animations';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;
const COMPLETE_THRESHOLD = SCREEN_WIDTH * 0.5;

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'high' | 'medium' | 'low';
  timeEstimate?: number; // minutes
  roomEmoji?: string;
  roomName?: string;
  isCompleted?: boolean;
}

interface SwipeableTaskCardProps {
  task: Task;
  onComplete: (taskId: string) => void;
  onSnooze?: (taskId: string) => void;
  onSkip?: (taskId: string) => void;
  onPress?: (task: Task) => void;
  onLongPress?: (task: Task) => void;
  showRoomInfo?: boolean;
  showWhyThis?: boolean;
  whyThisReason?: string;
  expanded?: boolean;
  style?: object;
}

export function SwipeableTaskCard({
  task,
  onComplete,
  onSnooze,
  onSkip,
  onPress,
  onLongPress,
  showRoomInfo = true,
  showWhyThis = false,
  whyThisReason,
  expanded = false,
  style,
}: SwipeableTaskCardProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [isExpanded, setIsExpanded] = useState(expanded);

  const translateX = useSharedValue(0);
  const scale = useSharedValue(1);
  const context = useSharedValue({ x: 0 });

  const handleComplete = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onComplete(task.id);
  }, [task.id, onComplete]);

  const handleSnooze = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSnooze?.(task.id);
  }, [task.id, onSnooze]);

  const handleSkip = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSkip?.(task.id);
  }, [task.id, onSkip]);

  const resetPosition = useCallback(() => {
    translateX.value = withSpring(0, SpringConfigs.snappy);
  }, []);

  const gesture = Gesture.Pan()
    .onStart(() => {
      context.value = { x: translateX.value };
    })
    .onUpdate((event) => {
      translateX.value = event.translationX + context.value.x;
    })
    .onEnd(() => {
      const x = translateX.value;

      // Swipe right - Complete
      if (x > COMPLETE_THRESHOLD) {
        translateX.value = withTiming(SCREEN_WIDTH, { duration: 200 });
        runOnJS(handleComplete)();
        return;
      }

      // Swipe left - Snooze/Skip
      if (x < -COMPLETE_THRESHOLD) {
        if (onSnooze) {
          translateX.value = withTiming(-SCREEN_WIDTH, { duration: 200 });
          runOnJS(handleSnooze)();
        } else if (onSkip) {
          translateX.value = withTiming(-SCREEN_WIDTH, { duration: 200 });
          runOnJS(handleSkip)();
        } else {
          runOnJS(resetPosition)();
        }
        return;
      }

      // Return to center
      runOnJS(resetPosition)();
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const completeActionStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD],
      [0, 1],
      Extrapolation.CLAMP
    );
    const scale = interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD],
      [0.5, 1],
      Extrapolation.CLAMP
    );
    return {
      opacity,
      transform: [{ scale }],
    };
  });

  const snoozeActionStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [0, -SWIPE_THRESHOLD],
      [0, 1],
      Extrapolation.CLAMP
    );
    const scale = interpolate(
      translateX.value,
      [0, -SWIPE_THRESHOLD],
      [0.5, 1],
      Extrapolation.CLAMP
    );
    return {
      opacity,
      transform: [{ scale }],
    };
  });

  const handlePressIn = () => {
    scale.value = withSpring(ScaleValues.cardPress, SpringConfigs.cardPress);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, SpringConfigs.cardPress);
  };

  const priorityColor = PriorityColors[task.priority];
  const priorityEmoji =
    task.priority === 'high' ? '🔥' : task.priority === 'medium' ? '⚡' : '💚';

  return (
    <View style={[styles.container, style]}>
      {/* Background Actions */}
      <View style={styles.actionsContainer}>
        {/* Complete Action (Right swipe) */}
        <Animated.View
          style={[styles.actionLeft, { backgroundColor: colors.success }, completeActionStyle]}
        >
          <Text style={styles.actionIcon}>✓</Text>
          <Text style={styles.actionText}>Complete</Text>
        </Animated.View>

        {/* Snooze Action (Left swipe) */}
        <Animated.View
          style={[
            styles.actionRight,
            { backgroundColor: onSnooze ? colors.warning : colors.textTertiary },
            snoozeActionStyle,
          ]}
        >
          <Text style={styles.actionIcon}>{onSnooze ? '⏰' : '⏭'}</Text>
          <Text style={styles.actionText}>{onSnooze ? 'Snooze' : 'Skip'}</Text>
        </Animated.View>
      </View>

      {/* Card */}
      <GestureDetector gesture={gesture}>
        <Animated.View style={[styles.cardWrapper, cardStyle]}>
          <Pressable
            onPress={() => {
              if (onPress) onPress(task);
              else setIsExpanded(!isExpanded);
            }}
            onLongPress={() => onLongPress?.(task)}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
                borderLeftColor: priorityColor,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={`${task.title}, ${task.priority} priority${
              task.timeEstimate ? `, estimated ${task.timeEstimate} minutes` : ''
            }`}
          >
            {/* Main Row */}
            <View style={styles.mainRow}>
              {/* Priority Indicator */}
              <Text style={styles.priorityEmoji}>{priorityEmoji}</Text>

              {/* Content */}
              <View style={styles.content}>
                <Text
                  style={[
                    Typography.body,
                    styles.title,
                    { color: colors.text },
                    task.isCompleted && styles.completedTitle,
                  ]}
                  numberOfLines={isExpanded ? undefined : 1}
                >
                  {task.title}
                </Text>

                {/* Room Info */}
                {showRoomInfo && task.roomEmoji && task.roomName && (
                  <Text
                    style={[
                      Typography.caption1,
                      { color: colors.textTertiary },
                    ]}
                  >
                    {task.roomEmoji} {task.roomName}
                  </Text>
                )}
              </View>

              {/* Time Estimate */}
              {task.timeEstimate && (
                <View style={[styles.timeBadge, { backgroundColor: colors.surfaceSecondary }]}>
                  <Text style={[Typography.caption1, { color: colors.textSecondary }]}>
                    ~{task.timeEstimate}m
                  </Text>
                </View>
              )}

              {/* Checkbox */}
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  onComplete(task.id);
                }}
                style={[
                  styles.checkbox,
                  {
                    borderColor: task.isCompleted ? colors.success : colors.border,
                    backgroundColor: task.isCompleted ? colors.success : 'transparent',
                  },
                ]}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: task.isCompleted }}
              >
                {task.isCompleted && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </Pressable>
            </View>

            {/* Expanded Content */}
            {isExpanded && (
              <View style={styles.expandedContent}>
                {task.description && (
                  <Text
                    style={[
                      Typography.subheadline,
                      styles.description,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {task.description}
                  </Text>
                )}

                {/* Why This Task */}
                {showWhyThis && whyThisReason && (
                  <View
                    style={[
                      styles.whyThisContainer,
                      { backgroundColor: colors.infoMuted },
                    ]}
                  >
                    <Text style={[Typography.caption1, { color: colors.info }]}>
                      💡 {whyThisReason}
                    </Text>
                  </View>
                )}

                {/* Quick Actions */}
                <View style={styles.quickActions}>
                  <Pressable
                    style={[styles.quickActionButton, { backgroundColor: colors.surfaceSecondary }]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      // TODO: Start timer
                    }}
                  >
                    <Text style={styles.quickActionIcon}>⏰</Text>
                    <Text style={[Typography.caption1, { color: colors.textSecondary }]}>
                      Start Timer
                    </Text>
                  </Pressable>

                  <Pressable
                    style={[styles.quickActionButton, { backgroundColor: colors.surfaceSecondary }]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      // TODO: Edit task
                    }}
                  >
                    <Text style={styles.quickActionIcon}>✏️</Text>
                    <Text style={[Typography.caption1, { color: colors.textSecondary }]}>
                      Edit
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}
          </Pressable>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.xs,
  },
  actionsContainer: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  actionLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingLeft: Spacing.lg,
    height: '100%',
  },
  actionRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingRight: Spacing.lg,
    height: '100%',
  },
  actionIcon: {
    fontSize: 24,
    color: '#FFFFFF',
    marginHorizontal: Spacing.xs,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cardWrapper: {
    borderRadius: BorderRadius.lg,
  },
  card: {
    borderRadius: BorderRadius.lg,
    borderLeftWidth: 4,
    padding: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityEmoji: {
    fontSize: 18,
    marginRight: Spacing.sm,
  },
  content: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  title: {
    marginBottom: 2,
  },
  completedTitle: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  timeBadge: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: Spacing.xxs,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  expandedContent: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  description: {
    marginBottom: Spacing.sm,
  },
  whyThisContainer: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  quickActions: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    gap: Spacing.xxs,
  },
  quickActionIcon: {
    fontSize: 14,
  },
});

export default SwipeableTaskCard;
