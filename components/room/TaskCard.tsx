/**
 * TaskCard Component - Unified task card for room details
 * 
 * Features:
 * - Swipe-to-delete gesture
 * - Expandable details with subtasks
 * - Priority indicators (colorblind-safe with shapes)
 * - Energy level badges
 * - Checkbox with animations
 * 
 * Note: components/ui/SwipeableTaskCard.tsx is a separate component
 * designed for focus sessions with swipe-to-complete/snooze actions.
 * Consider consolidating if feature sets converge.
 */

import * as Haptics from 'expo-haptics';
import React, { useEffect } from 'react';
import {
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    Extrapolation,
    interpolate,
    runOnJS,
    SlideInRight,
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withSpring,
    withTiming,
    ZoomIn,
} from 'react-native-reanimated';

import { ColorTokens, EnergyColors, PriorityColors } from '@/constants/Colors';
import { useCardPress } from '@/hooks/useAnimatedPress';
import { Typography } from '@/theme/typography';
import { CleaningTask, EnergyLevel, VisualImpact } from '@/types/declutter';

function getEnergyColor(energy: EnergyLevel): string {
  switch (energy) {
    case 'minimal': return EnergyColors.minimal;
    case 'low': return EnergyColors.light;
    case 'moderate': return EnergyColors.moderate;
    case 'high': return EnergyColors.intense;
    default: return '#9CA3AF';
  }
}

function getEnergyEmoji(energy: EnergyLevel): string {
  switch (energy) {
    case 'minimal': return '😴';
    case 'low': return '😐';
    case 'moderate': return '🙂';
    case 'high': return '⚡';
    default: return '❓';
  }
}

function getImpactColor(impact: VisualImpact): string {
  switch (impact) {
    case 'high': return '#34D399';
    case 'medium': return '#FBBF24';
    case 'low': return '#9CA3AF';
    default: return '#9CA3AF';
  }
}

const SWIPE_THRESHOLD = 80;
const DELETE_ACTION_WIDTH = 80;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function SwipeableTaskCard({
  children,
  onDelete,
  colors,
  reducedMotion = false,
}: {
  children: React.ReactNode;
  onDelete: () => void;
  colors: ColorTokens;
  reducedMotion?: boolean;
}) {
  const translateX = useSharedValue(0);
  const hasTriggeredHaptic = useSharedValue(false);

  const panGesture = Gesture.Pan()
    .activeOffsetX([-20, 20])
    .failOffsetY([-10, 10])
    .onUpdate((event) => {
      const newTranslateX = Math.min(0, Math.max(-DELETE_ACTION_WIDTH * 1.5, event.translationX));
      translateX.value = newTranslateX;

      if (newTranslateX <= -SWIPE_THRESHOLD && !hasTriggeredHaptic.value) {
        hasTriggeredHaptic.value = true;
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
      } else if (newTranslateX > -SWIPE_THRESHOLD && hasTriggeredHaptic.value) {
        hasTriggeredHaptic.value = false;
      }
    })
    .onEnd(() => {
      if (translateX.value <= -SWIPE_THRESHOLD) {
        translateX.value = withTiming(-DELETE_ACTION_WIDTH, { duration: reducedMotion ? 100 : 200 });
        runOnJS(onDelete)();
      } else {
        if (reducedMotion) {
          translateX.value = withTiming(0, { duration: 100 });
        } else {
          translateX.value = withSpring(0, { damping: 20, stiffness: 300 });
        }
      }
      hasTriggeredHaptic.value = false;
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const deleteActionStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [0, -SWIPE_THRESHOLD / 2, -SWIPE_THRESHOLD],
      [0, 0.5, 1],
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

  return (
    <View style={styles.swipeableContainer}>
      <Animated.View
        style={[
          styles.deleteAction,
          { backgroundColor: colors.danger },
          deleteActionStyle,
        ]}
      >
        <Text style={styles.deleteActionIcon}>🗑️</Text>
        <Text style={[styles.deleteActionText, { color: colors.textOnDanger }]}>Delete</Text>
      </Animated.View>

      <GestureDetector gesture={panGesture}>
        <Animated.View style={cardStyle}>
          {children}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

export function AnimatedCheckbox({
  completed,
  onToggle,
  colors,
  reducedMotion = false,
}: {
  completed: boolean;
  onToggle: () => void;
  colors: ColorTokens;
  reducedMotion?: boolean;
}) {
  const scale = useSharedValue(1);
  const fillScale = useSharedValue(completed ? 1 : 0);

  useEffect(() => {
    if (reducedMotion) {
      fillScale.value = completed ? 1 : 0;
    } else {
      fillScale.value = withSpring(completed ? 1 : 0, {
        damping: 12,
        stiffness: 180,
      });
    }
  }, [completed, reducedMotion]);

  const handlePress = (e: any) => {
    e.stopPropagation();
    if (!reducedMotion) {
      scale.value = withSequence(
        withSpring(0.85, { damping: 10, stiffness: 400 }),
        withSpring(1.1, { damping: 10, stiffness: 400 }),
        withSpring(1, { damping: 15, stiffness: 300 })
      );
    }
    onToggle();
  };

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const fillStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fillScale.value }],
    opacity: fillScale.value,
  }));

  return (
    <AnimatedPressable
      onPress={handlePress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: completed }}
      accessibilityLabel={completed ? 'Task completed' : 'Task not completed'}
      accessibilityHint="Double tap to toggle completion"
      style={[
        styles.checkbox,
        containerStyle,
        { borderColor: completed ? colors.success : colors.textTertiary },
      ]}
    >
      <Animated.View
        style={[
          styles.checkboxFill,
          { backgroundColor: colors.success },
          fillStyle,
        ]}
      />
      {completed && (
        <Animated.Text
          entering={reducedMotion ? undefined : ZoomIn.springify()}
          style={[styles.checkmark, { color: colors.textOnSuccess }]}
          accessibilityElementsHidden
        >
          ✓
        </Animated.Text>
      )}
    </AnimatedPressable>
  );
}

export default function TaskCard({
  task,
  index,
  expanded,
  onToggle,
  onExpand,
  onSubTaskToggle,
  onDelete,
  onEdit,
  showQuickWinBadge,
  colors,
  reducedMotion = false,
}: {
  task: CleaningTask;
  index: number;
  expanded: boolean;
  onToggle: () => void;
  onExpand: () => void;
  onSubTaskToggle: (subTaskId: string) => void;
  onDelete: () => void;
  onEdit: () => void;
  showQuickWinBadge?: boolean;
  colors: ColorTokens;
  reducedMotion?: boolean;
}) {
  const priorityColor = PriorityColors[task.priority];
  const hasSubtasks = task.subtasks && task.subtasks.length > 0;
  const completedSubtasks = task.subtasks?.filter(st => st.completed).length || 0;

  const { animatedStyle, onPressIn, onPressOut } = useCardPress();

  const enteringAnimation = reducedMotion
    ? undefined
    : SlideInRight.delay(index * 50).springify();

  return (
    <Animated.View entering={enteringAnimation}>
      <SwipeableTaskCard onDelete={onDelete} colors={colors} reducedMotion={reducedMotion}>
        <AnimatedPressable
          onPress={onExpand}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          style={animatedStyle}
          accessibilityRole="button"
          accessibilityLabel={`${task.title}, ${task.priority} priority, ${task.estimatedMinutes} minutes${task.completed ? ', completed' : ''}`}
          accessibilityHint="Swipe left to delete, tap to expand"
        >
          <View
            style={[
              styles.taskCard,
              {
                backgroundColor: colors.cardOverlay,
                opacity: task.completed ? 0.6 : 1,
                borderLeftWidth: 4,
                borderLeftColor: priorityColor,
              },
            ]}
          >
          <View style={styles.taskRow}>
            <AnimatedCheckbox
              completed={task.completed}
              onToggle={onToggle}
              colors={colors}
              reducedMotion={reducedMotion}
            />

            <View style={styles.taskInfo}>
              <View style={styles.taskTitleRow}>
                <Text style={styles.taskEmoji}>{task.emoji}</Text>
                <Text
                  style={[
                    Typography.body,
                    {
                      color: colors.text,
                      textDecorationLine: task.completed ? 'line-through' : 'none',
                      flex: 1,
                    },
                  ]}
                  numberOfLines={expanded ? undefined : 1}
                >
                  {task.title}
                </Text>
              </View>

              <View style={styles.taskMeta}>
                <Text style={[Typography.caption1, { color: colors.textSecondary }]}>
                  ~{task.estimatedMinutes} min
                </Text>
                {showQuickWinBadge && (
                  <View style={[styles.quickWinBadge, { backgroundColor: colors.successMuted }]}>
                    <Text style={[Typography.caption2, { color: colors.success }]}>
                      ⚡ Quick Win
                    </Text>
                  </View>
                )}
                {hasSubtasks && (
                  <Text style={[Typography.caption1, { color: colors.textSecondary }]}>
                    {completedSubtasks}/{task.subtasks!.length} steps
                  </Text>
                )}
              </View>

              {!expanded && task.description && (
                <Text
                  style={[
                    Typography.caption1,
                    {
                      color: colors.textTertiary,
                      marginTop: 6,
                      lineHeight: 18,
                    },
                  ]}
                  numberOfLines={2}
                >
                  {task.description}
                </Text>
              )}
            </View>

            <View 
              style={[styles.priorityBadge, { backgroundColor: `${priorityColor}20` }]}
              accessibilityLabel={`${task.priority} priority`}
            >
              {/* Color-blind friendly indicators: different shapes for each priority */}
              <Text style={[styles.priorityIcon, { color: priorityColor }]} accessibilityElementsHidden>
                {task.priority === 'high' ? '▲' : task.priority === 'medium' ? '◆' : '●'}
              </Text>
              <Text style={[styles.priorityBadgeText, { color: priorityColor }]}>
                {task.priority === 'high' ? 'High' : task.priority === 'medium' ? 'Med' : 'Low'}
              </Text>
            </View>

            <Text style={[styles.expandArrow, { color: colors.textTertiary }]}>
              {expanded ? '▼' : '▶'}
            </Text>
          </View>

          {expanded && (
            <View style={[styles.expandedContent, { borderTopColor: colors.cardBorder }]}>
              {task.description && (
                <Text style={[Typography.subheadline, { color: colors.textSecondary, marginBottom: 12 }]}>
                  {task.description}
                </Text>
              )}

              {(task.energyRequired || task.visualImpact || task.whyThisMatters) && (
                <View style={styles.metadataRow}>
                  {task.energyRequired && (
                    <View style={[styles.metadataBadge, { backgroundColor: `${getEnergyColor(task.energyRequired)}20` }]}>
                      <Text style={[Typography.caption2, { color: getEnergyColor(task.energyRequired) }]}>
                        {getEnergyEmoji(task.energyRequired)} {task.energyRequired}
                      </Text>
                    </View>
                  )}
                  {task.visualImpact && (
                    <View style={[styles.metadataBadge, { backgroundColor: `${getImpactColor(task.visualImpact)}20` }]}>
                      <Text style={[Typography.caption2, { color: getImpactColor(task.visualImpact) }]}>
                        {task.visualImpact === 'high' ? '✨' : task.visualImpact === 'medium' ? '👍' : '📦'} {task.visualImpact} impact
                      </Text>
                    </View>
                  )}
                  {task.decisionLoad && task.decisionLoad !== 'none' && (
                    <View style={[styles.metadataBadge, { backgroundColor: colors.warningMuted }]}>
                      <Text style={[Typography.caption2, { color: colors.warning }]}>
                        🧠 {task.decisionLoad} decisions
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {(task.enables && task.enables.length > 0) && (
                <View style={[styles.dependencyBox, { backgroundColor: colors.accentMuted }]}>
                  <Text style={[Typography.caption1, { color: colors.primary }]}>
                    🔓 Unlocks {task.enables.length} task{task.enables.length > 1 ? 's' : ''} after completion
                  </Text>
                </View>
              )}

              {(task.dependencies && task.dependencies.length > 0 && !task.completed) && (
                <View style={[styles.dependencyBox, { backgroundColor: colors.warningMuted }]}>
                  <Text style={[Typography.caption1, { color: colors.warning }]}>
                    ⏳ Waiting on {task.dependencies.length} other task{task.dependencies.length > 1 ? 's' : ''}
                  </Text>
                </View>
              )}

              {(task.parallelWith && task.parallelWith.length > 0) && (
                <View style={[styles.dependencyBox, { backgroundColor: colors.infoMuted }]}>
                  <Text style={[Typography.caption1, { color: colors.info }]}>
                    ⚡ Can do alongside {task.parallelWith.length} other task{task.parallelWith.length > 1 ? 's' : ''}
                  </Text>
                </View>
              )}

              {task.whyThisMatters && (
                <View style={[styles.motivationBox, { backgroundColor: colors.successMuted }]}>
                  <Text style={[Typography.caption1Medium, { color: colors.success }]}>💚 Why this matters:</Text>
                  <Text style={[Typography.caption1, { color: colors.textSecondary, marginTop: 4 }]}>
                    {task.whyThisMatters}
                  </Text>
                </View>
              )}

              {task.resistanceHandler && (
                <View style={[styles.resistanceBox, { backgroundColor: colors.infoMuted }]}>
                  <Text style={[Typography.caption1Medium, { color: colors.info }]}>🤗 Feeling stuck?</Text>
                  <Text style={[Typography.caption1, { color: colors.textSecondary, marginTop: 4 }]}>
                    {task.resistanceHandler}
                  </Text>
                </View>
              )}

              {task.destination && (
                <View style={styles.destinationBox}>
                  <Text style={[Typography.caption1Medium, { color: colors.primary }]}>📍 Destination:</Text>
                  <Text style={[Typography.caption1, { color: colors.textSecondary, marginTop: 2 }]}>
                    {task.destination.location}
                    {task.destination.instructions && ` - ${task.destination.instructions}`}
                  </Text>
                </View>
              )}

              {task.tips && task.tips.length > 0 && (
                <View style={styles.tipsContainer}>
                  <Text style={[Typography.caption1Medium, { color: colors.primary, marginBottom: 6 }]}>
                    💡 Tips:
                  </Text>
                  {task.tips.map((tip, i) => (
                    <Text key={i} style={[Typography.caption1, { color: colors.textSecondary, marginBottom: 4 }]}>
                      • {tip}
                    </Text>
                  ))}
                </View>
              )}

              {hasSubtasks && (
                <View style={styles.subtasksContainer}>
                  <Text style={[Typography.caption1Medium, { color: colors.text, marginBottom: 8 }]}>
                    Steps:
                  </Text>
                  {task.subtasks!.map(st => (
                    <Pressable
                      key={st.id}
                      onPress={() => onSubTaskToggle(st.id)}
                      style={styles.subtaskRow}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: st.completed }}
                      accessibilityLabel={st.title}
                      accessibilityHint={st.completed ? 'Double tap to mark as incomplete' : 'Double tap to complete'}
                    >
                      <View
                        style={[
                          styles.subtaskCheckbox,
                          {
                            backgroundColor: st.completed ? colors.success : 'transparent',
                            borderColor: st.completed ? colors.success : colors.textTertiary,
                          },
                        ]}
                      >
                        {st.completed && <Text style={[styles.subtaskCheck, { color: colors.textOnSuccess }]} accessibilityElementsHidden>✓</Text>}
                      </View>
                      <Text
                        style={[
                          Typography.subheadline,
                          {
                            color: colors.text,
                            textDecorationLine: st.completed ? 'line-through' : 'none',
                            opacity: st.completed ? 0.6 : 1,
                          },
                        ]}
                      >
                        {st.title}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}

              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onEdit();
                }}
                style={[styles.editTaskButton, { backgroundColor: colors.cardOverlay }]}
                accessibilityRole="button"
                accessibilityLabel="Edit task"
              >
                <Text style={[Typography.subheadlineMedium, { color: colors.primary }]}>
                  ✏️ Edit Task
                </Text>
              </Pressable>

              {/* Accessible delete button (alternative to swipe gesture) */}
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  onDelete();
                }}
                style={[styles.deleteTaskButton, { backgroundColor: colors.errorMuted }]}
                accessibilityRole="button"
                accessibilityLabel={`Delete task: ${task.title}`}
                accessibilityHint="Double tap to delete this task"
              >
                <Text style={[Typography.subheadlineMedium, { color: colors.error }]}>
                  🗑️ Delete Task
                </Text>
              </Pressable>
            </View>
          )}
        </View>
        </AnimatedPressable>
      </SwipeableTaskCard>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  swipeableContainer: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 16,
  },
  deleteAction: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: DELETE_ACTION_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  deleteActionIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  deleteActionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  taskCard: {
    padding: 16,
    borderRadius: 16,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  checkboxFill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
  },
  checkmark: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  taskInfo: {
    flex: 1,
  },
  taskTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskEmoji: {
    fontSize: 18,
    marginRight: 8,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  quickWinBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 8,
    gap: 4,
  },
  priorityIcon: {
    fontSize: 10,
    fontWeight: '700',
  },
  priorityBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  priorityBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  expandArrow: {
    marginLeft: 8,
    fontSize: 10,
  },
  expandedContent: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 0.5,
  },
  tipsContainer: {
    marginBottom: 12,
  },
  subtasksContainer: {
    marginTop: 12,
  },
  subtaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  subtaskCheckbox: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  subtaskCheck: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  editTaskButton: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderRadius: 8,
  },
  deleteTaskButton: {
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderRadius: 8,
  },
  metadataRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  metadataBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  motivationBox: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  resistanceBox: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  dependencyBox: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  destinationBox: {
    marginBottom: 12,
  },
});
