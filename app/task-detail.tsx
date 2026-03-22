/**
 * Declutterly -- Task Detail (V1 Pencil Design)
 * Bottom-sheet style task detail with priority badge,
 * stats, Dusty's tip, adjust options, and CTA.
 */

import { AmbientBackdrop } from '@/components/ui/AmbientBackdrop';
import { useDeclutter } from '@/context/DeclutterContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { CleaningTask, Room } from '@/types/declutter';
import { Clock, Zap, TrendingUp, ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo, useCallback, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { V1, BODY_FONT, DISPLAY_FONT } from '@/constants/designTokens';

function getPriorityLabel(task: CleaningTask): string {
  if (task.priority === 'low' && (task.estimatedMinutes ?? 5) <= 3) return 'Quick Win';
  if (task.priority === 'high') return 'High Priority';
  if (task.priority === 'medium') return 'Medium Priority';
  return 'Low Priority';
}

function getDifficultyLabel(task: CleaningTask): string {
  switch (task.difficulty) {
    case 'quick': return 'Easy';
    case 'medium': return 'Medium';
    case 'challenging': return 'Hard';
    default: return 'Easy';
  }
}

function getImpactLabel(task: CleaningTask): string {
  switch (task.visualImpact) {
    case 'high': return 'High';
    case 'medium': return 'Medium';
    case 'low': return 'Low';
    default: return 'High';
  }
}

function StatCircle({
  isDark,
  icon,
  value,
  label,
  color,
}: {
  isDark: boolean;
  icon: React.ReactNode;
  value: string;
  label: string;
  color: string;
}) {
  const t = isDark ? V1.dark : V1.light;
  return (
    <View style={styles.statCircle}>
      <View style={[styles.statIcon, { backgroundColor: isDark ? `${color}22` : `${color}15` }]}>
        {icon}
      </View>
      <Text style={[styles.statValue, { color: t.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: t.textMuted }]}>{label}</Text>
    </View>
  );
}

export default function TaskDetailScreen() {
  const rawScheme = useColorScheme();
  const isDark = rawScheme === 'dark';
  const reducedMotion = useReducedMotion();
  const insets = useSafeAreaInsets();
  const { rooms: rawRooms, toggleTask, deleteTask, updateTask } = useDeclutter();
  const rooms = rawRooms ?? [];
  const params = useLocalSearchParams<{ taskId: string }>();
  const t = isDark ? V1.dark : V1.light;

  // Find the task across all rooms
  const found = useMemo(() => {
    for (const room of rooms) {
      const task = (room.tasks ?? []).find((t) => t.id === params.taskId);
      if (task) return { task, room };
    }
    return null;
  }, [rooms, params.taskId]);

  const handleStartTask = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: '/single-task',
      params: {
        roomId: found?.room.id ?? '',
        taskId: found?.task.id ?? '',
      },
    });
  }, [found]);

  const handleRemoveTask = useCallback(() => {
    if (!found) return;
    Alert.alert(
      'Remove Task',
      `Remove "${found.task.title}" from your task list?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            deleteTask?.(found.room.id, found.task.id);
            router.back();
          },
        },
      ],
    );
  }, [found, deleteTask]);

  if (!found) {
    return (
      <View style={[styles.container, { backgroundColor: t.bg }]}>
        <View style={[styles.centered, { paddingTop: insets.top + 40 }]}>
          <Text style={[styles.notFoundText, { color: t.textSecondary }]}>Task not found</Text>
          <Pressable onPress={() => router.back()}>
            <Text style={[styles.goBackText, { color: V1.coral }]}>Go back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const { task, room } = found;
  const priorityLabel = getPriorityLabel(task);
  const difficultyLabel = getDifficultyLabel(task);
  const impactLabel = getImpactLabel(task);
  const dustyTip = task.tips?.[0] || task.resistanceHandler || "Start by picking up items closest to you. Don't sort yet \u2014 just gather everything into one pile on the bed.";

  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      <AmbientBackdrop isDark={isDark} variant="home" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Priority badge */}
        <Animated.View entering={reducedMotion ? undefined : FadeInDown.duration(300)}>
          <View style={[styles.priorityBadge, {
            backgroundColor: isDark ? 'rgba(255,107,107,0.15)' : 'rgba(255,107,107,0.1)',
          }]}>
            <Text style={[styles.priorityText, { color: V1.coral }]}>{priorityLabel}</Text>
          </View>
        </Animated.View>

        {/* Task name */}
        <Animated.View entering={reducedMotion ? undefined : FadeInDown.duration(300).delay(40)}>
          <Text style={[styles.taskTitle, { color: t.text }]}>{task.title}</Text>
          <Text style={[styles.taskSubtitle, { color: t.textSecondary }]}>
            {room.name} {'\u00B7'} Added from AI scan
          </Text>
        </Animated.View>

        {/* Stats row */}
        <Animated.View entering={reducedMotion ? undefined : FadeInDown.duration(300).delay(80)} style={styles.statsRow}>
          <StatCircle
            isDark={isDark}
            icon={<Clock size={18} color={V1.coral} />}
            value={`about ${task.estimatedMinutes} min`}
            label="Est. Time"
            color={V1.coral}
          />
          <StatCircle
            isDark={isDark}
            icon={<Zap size={18} color={V1.green} />}
            value={difficultyLabel}
            label="Difficulty"
            color={V1.green}
          />
          <StatCircle
            isDark={isDark}
            icon={<TrendingUp size={18} color={V1.blue} />}
            value={impactLabel}
            label="Impact"
            color={V1.blue}
          />
        </Animated.View>

        {/* Dusty's Tip */}
        <Animated.View entering={reducedMotion ? undefined : FadeInDown.duration(300).delay(120)}>
          <View style={[styles.tipCard, {
            backgroundColor: isDark ? 'rgba(255,183,77,0.08)' : 'rgba(255,183,77,0.06)',
            borderColor: isDark ? 'rgba(255,183,77,0.15)' : 'rgba(255,183,77,0.12)',
          }]}>
            <Text style={[styles.tipLabel, { color: V1.amber }]}>
              {'\u2728'} Dusty's Tip
            </Text>
            <Text style={[styles.tipText, { color: t.textSecondary }]}>
              {dustyTip}
            </Text>
          </View>
        </Animated.View>

        {/* Subtask steps (inline) */}
        <Animated.View entering={reducedMotion ? undefined : FadeInDown.duration(300).delay(160)}>
          {task.subtasks && task.subtasks.length > 0 ? (
            <View style={[styles.subtaskSection, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', borderColor: t.border }]}>
              <Text style={[styles.subtaskSectionTitle, { color: t.text }]}>
                Steps ({task.subtasks.filter(s => s.completed).length}/{task.subtasks.length})
              </Text>
              {task.subtasks.map((st, idx) => (
                <View key={st.id} style={styles.subtaskItemRow}>
                  <View style={[styles.subtaskNumCircle, {
                    backgroundColor: st.completed ? V1.green : 'transparent',
                    borderColor: st.completed ? V1.green : (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'),
                  }]}>
                    {st.completed ? (
                      <Text style={{ fontSize: 10, color: '#FFFFFF', fontWeight: '700' }}>{'\u2713'}</Text>
                    ) : (
                      <Text style={{ fontSize: 10, color: t.textMuted, fontWeight: '700' }}>{idx + 1}</Text>
                    )}
                  </View>
                  <Text style={[styles.subtaskItemTitle, {
                    color: st.completed ? t.textMuted : t.text,
                    textDecorationLine: st.completed ? 'line-through' : 'none',
                    opacity: st.completed ? 0.6 : 1,
                  }]}>
                    {st.title}
                  </Text>
                  {(st.estimatedMinutes || st.estimatedSeconds) && (
                    <Text style={[styles.subtaskItemTime, { color: t.textMuted }]}>
                      {st.estimatedMinutes ? `${st.estimatedMinutes}m` : st.estimatedSeconds ? `${st.estimatedSeconds}s` : ''}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          ) : (
            <View style={[styles.subtaskSection, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', borderColor: t.border }]}>
              <Text style={[styles.subtaskEmptyText, { color: t.textMuted }]}>
                Use Ultra detail level in Settings for step-by-step breakdown
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Adjust Task */}
        <Animated.View entering={reducedMotion ? undefined : FadeInDown.duration(300).delay(200)}>
          <Text style={[styles.adjustTitle, { color: t.textMuted }]}>Adjust Task</Text>
          <View style={[styles.adjustCard, { backgroundColor: t.card, borderColor: t.border }]}>
            <Pressable
              style={styles.adjustRow}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                const options = [2, 5, 10, 15, 20, 30];
                Alert.alert(
                  'Change Time Estimate',
                  `Current: ${task.estimatedMinutes} min`,
                  [
                    ...options.map(min => ({
                      text: `${min} min`,
                      onPress: () => {
                        updateTask(room.id, task.id, { estimatedMinutes: min });
                      },
                    })),
                    { text: 'Cancel', style: 'cancel' as const },
                  ],
                );
              }}
              accessibilityRole="button"
              accessibilityLabel="Change time estimate"
            >
              <Text style={[styles.adjustText, { color: t.text }]}>Change time estimate</Text>
              <Text style={[styles.adjustMeta, { color: t.textMuted }]}>{task.estimatedMinutes} min</Text>
              <ChevronRight size={16} color={t.textMuted} />
            </Pressable>
          </View>
        </Animated.View>

        {/* Action CTAs */}
        <Animated.View entering={reducedMotion ? undefined : FadeInDown.duration(300).delay(240)} style={styles.ctaRow}>
          {/* Mark Done button */}
          {!task.completed && (
            <Pressable
              onPress={() => {
                void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                toggleTask(room.id, task.id);
                router.back();
              }}
              accessibilityRole="button"
              accessibilityLabel="Mark task as done"
              style={({ pressed }) => [{ opacity: pressed ? 0.88 : 1, flex: 1 }]}
            >
              <View style={[styles.markDoneButton, {
                backgroundColor: isDark ? 'rgba(52,199,89,0.15)' : 'rgba(34,197,94,0.1)',
                borderColor: V1.green,
              }]}>
                <Text style={[styles.markDoneText, { color: V1.green }]}>Mark Done</Text>
              </View>
            </Pressable>
          )}
          {/* Start This Task button */}
          <Pressable
            onPress={handleStartTask}
            accessibilityRole="button"
            accessibilityLabel="Start This Task"
            style={({ pressed }) => [{ opacity: pressed ? 0.88 : 1, flex: 1 }]}
          >
            <LinearGradient
              colors={[V1.coral, '#FF5252']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.ctaButton}
            >
              <Text style={styles.ctaText}>Start This Task</Text>
            </LinearGradient>
          </Pressable>
        </Animated.View>

        {/* Remove task link */}
        <Animated.View entering={reducedMotion ? undefined : FadeInDown.duration(300).delay(280)}>
          <Pressable onPress={handleRemoveTask} style={styles.removeWrap}>
            <Text style={[styles.removeText, { color: V1.coral }]}>Remove Task</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    gap: 20,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  notFoundText: {
    fontFamily: BODY_FONT,
    fontSize: 15,
  },
  goBackText: {
    fontFamily: BODY_FONT,
    fontSize: 15,
    fontWeight: '600',
  },

  // Priority badge
  priorityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  priorityText: {
    fontFamily: BODY_FONT,
    fontSize: 12,
    fontWeight: '700',
  },

  // Task info
  taskTitle: {
    fontFamily: DISPLAY_FONT,
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  taskSubtitle: {
    fontFamily: BODY_FONT,
    fontSize: 13,
    fontWeight: '500',
    marginTop: 4,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statCircle: {
    alignItems: 'center',
    gap: 6,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontFamily: BODY_FONT,
    fontSize: 14,
    fontWeight: '700',
  },
  statLabel: {
    fontFamily: BODY_FONT,
    fontSize: 11,
    fontWeight: '500',
  },

  // Tip card
  tipCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 6,
  },
  tipLabel: {
    fontFamily: BODY_FONT,
    fontSize: 13,
    fontWeight: '700',
  },
  tipText: {
    fontFamily: BODY_FONT,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
  },

  // Adjust
  adjustTitle: {
    fontFamily: BODY_FONT,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: -8,
  },
  adjustCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  adjustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 8,
  },
  adjustText: {
    flex: 1,
    fontFamily: BODY_FONT,
    fontSize: 14,
    fontWeight: '500',
  },
  adjustMeta: {
    fontFamily: BODY_FONT,
    fontSize: 13,
    fontWeight: '500',
  },
  adjustDivider: {
    height: 1,
    marginLeft: 16,
  },

  // Subtask section
  subtaskSection: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  subtaskSectionTitle: {
    fontFamily: DISPLAY_FONT,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  subtaskItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  subtaskNumCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtaskItemTitle: {
    fontFamily: BODY_FONT,
    fontSize: 14,
    flex: 1,
  },
  subtaskItemTime: {
    fontFamily: BODY_FONT,
    fontSize: 11,
  },
  subtaskEmptyText: {
    fontFamily: BODY_FONT,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 8,
  },

  // CTA row
  ctaRow: {
    flexDirection: 'row',
    gap: 10,
  },
  ctaButton: {
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontFamily: BODY_FONT,
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  markDoneButton: {
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markDoneText: {
    fontFamily: BODY_FONT,
    fontSize: 16,
    fontWeight: '700',
  },

  // Remove
  removeWrap: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  removeText: {
    fontFamily: BODY_FONT,
    fontSize: 14,
    fontWeight: '600',
  },
});
