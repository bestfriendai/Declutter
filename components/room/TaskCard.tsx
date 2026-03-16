/**
 * TaskCard Component - Redesigned to match Pencil designs
 *
 * Clean, minimal task cards:
 * - Unfilled circle checkbox on the left
 * - Task title
 * - Estimated time in muted text on the right
 * - Dark: #141414 bg, white text, #808080 time
 * - Light: #FFFFFF bg, #1A1A1A text, subtle shadow
 *
 * Retains all existing business logic:
 * - Swipe-to-delete gesture
 * - Expandable details with subtasks
 * - Checkbox animations
 */

import * as Haptics from 'expo-haptics';
import React, { useEffect } from 'react';
import {
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
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

import { ColorTokens, EnergyColors } from '@/constants/Colors';
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
    case 'minimal': return '\u{1F634}';
    case 'low': return '\u{1F610}';
    case 'moderate': return '\u{1F642}';
    case 'high': return '\u26A1';
    default: return '\u2753';
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
        <Text style={styles.deleteActionIcon}>{'\u{1F5D1}\uFE0F'}</Text>
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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
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
  }, [completed, reducedMotion, fillScale]);

  const handlePress = (e: any) => {
    e.stopPropagation();
    if (!reducedMotion) {
      if (!completed) {
        scale.value = withSequence(
          withSpring(1.2, { damping: 8, stiffness: 400 }),
          withSpring(1, { damping: 12, stiffness: 200 }),
        );
      } else {
        scale.value = withSequence(
          withSpring(0.85, { damping: 10, stiffness: 400 }),
          withSpring(1, { damping: 15, stiffness: 300 })
        );
      }
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
        {
          borderColor: completed
            ? colors.success
            : isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.2)',
        },
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
          entering={reducedMotion ? undefined : ZoomIn.duration(350)}
          style={[styles.checkmark, { color: colors.textOnSuccess }]}
          accessibilityElementsHidden
        >
          {'\u2713'}
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
  showQuickWinBadge: _showQuickWinBadge,
  colors,
  reducedMotion = false,
  phase: _phase,
  showXPPreview: _showXPPreview = true,
  showDifficultyBadge: _showDifficultyBadge = true,
  comboMultiplier: _comboMultiplier,
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
  phase?: number;
  showXPPreview?: boolean;
  showDifficultyBadge?: boolean;
  comboMultiplier?: number;
}) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const hasSubtasks = task.subtasks && task.subtasks.length > 0;
  const completedSubtasks = task.subtasks?.filter(st => st.completed).length || 0;

  const { animatedStyle, onPressIn, onPressOut } = useCardPress();

  const enteringAnimation = reducedMotion
    ? undefined
    : SlideInRight.delay(index * 50).duration(350);

  // Card background: Dark = #141414, Light = #FFFFFF
  const cardBg = isDark ? '#141414' : '#FFFFFF';
  // Text color: Dark = white, Light = #1A1A1A
  const textColor = isDark ? '#FFFFFF' : '#1A1A1A';
  // Time color: muted gray
  const timeColor = '#808080';

  // Priority left-border color
  const priorityBorderColor = task.difficulty === 'challenging'
    ? '#FF6B6B'
    : task.difficulty === 'medium'
      ? '#FFB347'
      : 'rgba(128,128,128,0.25)';

  return (
    <Animated.View entering={enteringAnimation}>
      <SwipeableTaskCard onDelete={onDelete} colors={colors} reducedMotion={reducedMotion}>
        <AnimatedPressable
          onPress={onExpand}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          style={animatedStyle}
          accessibilityRole="button"
          accessibilityLabel={`${task.title}, ${task.estimatedMinutes} minutes${task.completed ? ', completed' : ''}`}
          accessibilityHint="Swipe left to delete, tap to expand"
        >
          <View
            style={[
              styles.taskCard,
              {
                backgroundColor: cardBg,
                opacity: task.completed ? 0.5 : 1,
                borderLeftWidth: 3,
                borderLeftColor: priorityBorderColor,
                // Light mode: stronger shadow + subtle border
                ...(isDark ? {} : {
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.10,
                  shadowRadius: 12,
                  elevation: 3,
                  borderWidth: 1,
                  borderColor: 'rgba(0,0,0,0.06)',
                  borderLeftWidth: 3,
                  borderLeftColor: priorityBorderColor,
                }),
              },
            ]}
          >
            {/* Main row: checkbox + title + time */}
            <View style={styles.taskRow}>
              <AnimatedCheckbox
                completed={task.completed}
                onToggle={onToggle}
                colors={colors}
                reducedMotion={reducedMotion}
              />

              <View style={styles.taskInfo}>
                <Text
                  style={[
                    {
                      fontSize: 16,
                      fontWeight: '500',
                      color: textColor,
                      textDecorationLine: task.completed ? 'line-through' : 'none',
                    },
                  ]}
                  numberOfLines={expanded ? undefined : 1}
                >
                  {task.title}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 3 }}>
                  <Text style={{
                    fontSize: 13,
                    fontWeight: '400',
                    color: timeColor,
                  }}>
                    {task.estimatedMinutes} min
                  </Text>
                  {/* Quick win badge for tasks under 5 min -- ADHD loves knowing it is fast */}
                  {!task.completed && task.estimatedMinutes <= 5 && task.difficulty === 'quick' && (
                    <View style={{
                      backgroundColor: isDark ? 'rgba(52,211,153,0.12)' : 'rgba(34,197,94,0.10)',
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                      borderRadius: 6,
                    }}>
                      <Text style={{
                        fontSize: 10,
                        fontWeight: '700',
                        color: isDark ? '#34D399' : '#22C55E',
                        letterSpacing: 0.3,
                      }}>
                        QUICK WIN
                      </Text>
                    </View>
                  )}
                  {/* High impact badge */}
                  {!task.completed && task.visualImpact === 'high' && !expanded && (
                    <View style={{
                      backgroundColor: isDark ? 'rgba(251,191,36,0.12)' : 'rgba(251,191,36,0.10)',
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                      borderRadius: 6,
                    }}>
                      <Text style={{
                        fontSize: 10,
                        fontWeight: '700',
                        color: isDark ? '#FBBF24' : '#D97706',
                        letterSpacing: 0.3,
                      }}>
                        BIG IMPACT
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Expand arrow — styled chevron container */}
              <View style={{
                backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                borderRadius: 12,
                padding: 6,
                marginLeft: 8,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Text style={{ fontSize: 14, color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.35)', lineHeight: 14 }}>
                  {expanded ? '\u25BC' : '\u25B6'}
                </Text>
              </View>
            </View>

            {/* Expanded content */}
            {expanded && (
              <View style={[styles.expandedContent, { borderTopColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
                {task.description && (
                  <Text style={[Typography.subheadline, { color: isDark ? '#ABABAB' : '#666666', marginBottom: 12 }]}>
                    {task.description}
                  </Text>
                )}

                {/* Metadata badges */}
                {(task.energyRequired || task.visualImpact) && (
                  <View style={styles.metadataRow}>
                    {task.energyRequired && (
                      <View style={[
                        styles.metadataBadge,
                        {
                          backgroundColor: `${getEnergyColor(task.energyRequired)}20`,
                          borderWidth: 1,
                          borderColor: `${getEnergyColor(task.energyRequired)}4D`,
                        },
                      ]}>
                        <Text style={{ fontSize: 12, fontWeight: '600', color: getEnergyColor(task.energyRequired) }}>
                          {getEnergyEmoji(task.energyRequired)} {task.energyRequired}
                        </Text>
                      </View>
                    )}
                    {task.visualImpact && (
                      <View style={[
                        styles.metadataBadge,
                        {
                          backgroundColor: `${getImpactColor(task.visualImpact)}20`,
                          borderWidth: 1,
                          borderColor: `${getImpactColor(task.visualImpact)}4D`,
                        },
                      ]}>
                        <Text style={{ fontSize: 12, fontWeight: '600', color: getImpactColor(task.visualImpact) }}>
                          {task.visualImpact === 'high' ? '\u{1F525}' : task.visualImpact === 'medium' ? '\u{1F44D}' : '\u{1F4E6}'} {task.visualImpact} impact
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {task.whyThisMatters && (
                  <View style={[
                    styles.motivationBox,
                    {
                      backgroundColor: isDark ? 'rgba(52,199,89,0.15)' : 'rgba(34,197,94,0.12)',
                      borderLeftWidth: 3,
                      borderLeftColor: colors.success,
                    },
                  ]}>
                    <Text style={[Typography.caption1Medium, { color: colors.success, fontSize: 13, fontWeight: '600' }]}>{'\u{1F49A}'} Why this matters:</Text>
                    <Text style={[Typography.caption1, { color: isDark ? '#ABABAB' : '#555555', marginTop: 4 }]}>
                      {task.whyThisMatters}
                    </Text>
                  </View>
                )}

                {task.resistanceHandler && (
                  <View style={[
                    styles.resistanceBox,
                    {
                      backgroundColor: isDark ? 'rgba(10,132,255,0.15)' : 'rgba(59,130,246,0.12)',
                      borderLeftWidth: 3,
                      borderLeftColor: colors.info,
                    },
                  ]}>
                    <Text style={[Typography.caption1Medium, { color: colors.info, fontSize: 13, fontWeight: '600' }]}>{'\u{1F917}'} Feeling stuck?</Text>
                    <Text style={[Typography.caption1, { color: isDark ? '#ABABAB' : '#555555', marginTop: 4 }]}>
                      {task.resistanceHandler}
                    </Text>
                  </View>
                )}

                {task.tips && task.tips.length > 0 && (
                  <View style={[
                    styles.tipsContainer,
                    {
                      backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                      borderRadius: 10,
                      padding: 12,
                    },
                  ]}>
                    <Text style={[Typography.caption1Medium, { color: colors.primary, marginBottom: 6 }]}>
                      {'\u{1F4A1}'} Tips:
                    </Text>
                    {task.tips.map((tip, i) => (
                      <Text key={i} style={[Typography.caption1, { color: isDark ? '#ABABAB' : '#555555', marginBottom: 4 }]}>
                        {'\u2022'} {tip}
                      </Text>
                    ))}
                  </View>
                )}

                {hasSubtasks && (
                  <View style={[
                    styles.subtasksContainer,
                    {
                      backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                      borderRadius: 10,
                      padding: 12,
                    },
                  ]}>
                    <Text style={[Typography.caption1Medium, { color: textColor, marginBottom: 8 }]}>
                      Steps ({completedSubtasks}/{task.subtasks!.length}):
                    </Text>
                    {task.subtasks!.map(st => (
                      <Pressable
                        key={st.id}
                        onPress={() => onSubTaskToggle(st.id)}
                        style={styles.subtaskRow}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: st.completed }}
                        accessibilityLabel={st.title}
                      >
                        <View
                          style={[
                            styles.subtaskCheckbox,
                            {
                              backgroundColor: st.completed ? colors.success : 'transparent',
                              borderColor: st.completed ? colors.success : timeColor,
                            },
                          ]}
                        >
                          {st.completed && <Text style={[styles.subtaskCheck, { color: colors.textOnSuccess }]}>{'\u2713'}</Text>}
                        </View>
                        <Text
                          style={[
                            Typography.subheadline,
                            {
                              color: textColor,
                              textDecorationLine: st.completed ? 'line-through' : 'none',
                              opacity: st.completed ? 0.5 : 1,
                            },
                          ]}
                        >
                          {st.title}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                )}

                <View style={styles.actionButtonRow}>
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation();
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      onEdit();
                    }}
                    style={[styles.editTaskButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', flex: 1 }]}
                    accessibilityRole="button"
                    accessibilityLabel="Edit task"
                  >
                    <Text style={[Typography.subheadlineMedium, { color: colors.primary }]}>
                      {'\u270F\uFE0F'} Edit
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation();
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      onDelete();
                    }}
                    style={[styles.deleteTaskButton, { backgroundColor: isDark ? 'rgba(255,69,58,0.12)' : 'rgba(255,59,48,0.08)', flex: 1 }]}
                    accessibilityRole="button"
                    accessibilityLabel={`Delete task: ${task.title}`}
                  >
                    <Text style={[Typography.subheadlineMedium, { color: colors.error }]}>
                      {'\u{1F5D1}\uFE0F'} Delete
                    </Text>
                  </Pressable>
                </View>
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
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    overflow: 'hidden',
  },
  checkboxFill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 13,
  },
  checkmark: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  taskInfo: {
    flex: 1,
  },
  expandedContent: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 0.5,
  },
  metadataRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  metadataBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
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
  tipsContainer: {
    marginBottom: 12,
  },
  subtasksContainer: {
    marginTop: 12,
    marginBottom: 4,
  },
  actionButtonRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
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
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderRadius: 10,
  },
  deleteTaskButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderRadius: 10,
  },
});
