/**
 * Declutterly -- Single Task Focus (V1 Pencil Design)
 * One task at a time view during blitz mode.
 * Timer, phase progress bars, big check button, skip option.
 */

import { AmbientBackdrop } from '@/components/ui/AmbientBackdrop';
import { MascotAvatar } from '@/components/ui/MascotAvatar';
import { BODY_FONT, DISPLAY_FONT, V1 } from '@/constants/designTokens';
import { useDeclutter } from '@/context/DeclutterContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useTimer } from '@/hooks/useTimer';
import { CleaningTask } from '@/types/declutter';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { CheckCircle, Clock, X } from 'lucide-react-native';
import { ScreenErrorBoundary } from '@/components/ErrorBoundary';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const DEFAULT_BLITZ_DURATION_SECONDS = 15 * 60; // 15 minutes

const PHASE_COLORS = [V1.green, V1.green, V1.coral, V1.amber, V1.blue];

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function getDustyTip(task: CleaningTask): string {
  if (task.tips && task.tips.length > 0) {
    return task.tips[0];
  }
  if (task.resistanceHandler) {
    return task.resistanceHandler;
  }
  return 'Start from left to right. Spray, wait 10 seconds, then wipe. Easy!';
}

export default function SingleTaskScreen() {
  return (
    <ScreenErrorBoundary screenName="single-task">
      <SingleTaskScreenContent />
    </ScreenErrorBoundary>
  );
}

function SingleTaskScreenContent() {
  const rawScheme = useColorScheme();
  const isDark = rawScheme === 'dark';
  const reducedMotion = useReducedMotion();
  const insets = useSafeAreaInsets();
  const { rooms: rawRooms, toggleTask, mascot } = useDeclutter();
  const rooms = rawRooms ?? [];
  const t = isDark ? V1.dark : V1.light;
  const params = useLocalSearchParams<{ roomId?: string; taskId?: string; duration?: string }>();

  // Gather incomplete tasks, filtered to a specific room if roomId is provided
  const allTasks = useMemo(() => {
    const tasks: Array<{ task: CleaningTask; roomId: string; roomName: string }> = [];
    const sourceRooms = params.roomId
      ? rooms.filter((r) => r.id === params.roomId)
      : rooms;
    sourceRooms.forEach((room) => {
      (room.tasks ?? []).forEach((task) => {
        if (!task.completed) {
          tasks.push({ task, roomId: room.id, roomName: room.name });
        }
      });
    });
    return tasks;
  }, [rooms, params.roomId]);

  // If a specific taskId was passed, start at that task's index
  const initialIndex = useMemo(() => {
    if (params.taskId) {
      const idx = allTasks.findIndex((t) => t.task.id === params.taskId);
      if (idx >= 0) return idx;
    }
    return 0;
  }, []);

  // Calculate timer duration: use param, or estimate from remaining tasks, or default 15 min
  const blitzDurationSeconds = useMemo(() => {
    if (params.duration) {
      const parsed = parseInt(params.duration, 10);
      if (!isNaN(parsed) && parsed > 0) return parsed * 60;
    }
    // Calculate from total estimated time of remaining tasks
    if (allTasks.length > 0) {
      const totalMinutes = allTasks.reduce((sum, t) => sum + (t.task.estimatedMinutes || 3), 0);
      return Math.max(totalMinutes * 60, 5 * 60); // At least 5 minutes
    }
    return DEFAULT_BLITZ_DURATION_SECONDS;
  }, []);

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [completedCount, setCompletedCount] = useState(0);

  const {
    remaining: secondsLeft,
    isRunning: _timerRunning,
    isComplete: timerExpired,
  } = useTimer({
    initialSeconds: blitzDurationSeconds,
    autoStart: true,
    pauseOnBackground: true,
  });

  // Decision help state
  const [showDecisionHelp, setShowDecisionHelp] = useState(false);

  // Undo support
  const [undoTask, setUndoTask] = useState<{ roomId: string; taskId: string; title: string } | null>(null);
  const undoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean up undo timeout on unmount
  useEffect(() => {
    return () => {
      if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    };
  }, []);

  // Navigate to session-complete when timer expires
  useEffect(() => {
    if (secondsLeft === 0 && completedCount > 0) {
      const elapsedSeconds = blitzDurationSeconds;
      const elapsedMinutes = Math.max(1, Math.round(elapsedSeconds / 60));
      const xpEarned = completedCount * 10;
      router.replace({
        pathname: '/session-complete',
        params: {
          tasksCompleted: String(completedCount),
          timeSpent: String(elapsedMinutes),
          xpEarned: String(xpEarned),
          roomId: currentTask?.roomId ?? '',
          roomName: currentTask?.roomName ?? '',
        },
      });
    }
  }, [secondsLeft]);

  const totalTasks = allTasks.length;
  const currentTask = allTasks[currentIndex];
  const phaseLabel = currentTask ? `Task ${currentIndex + 1}` : 'Done!';

  const handleComplete = useCallback(() => {
    if (!currentTask) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    toggleTask(currentTask.roomId, currentTask.task.id);
    const newCompleted = completedCount + 1;
    setCompletedCount(newCompleted);
    setShowDecisionHelp(false);

    // Show undo toast
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    setUndoTask({ roomId: currentTask.roomId, taskId: currentTask.task.id, title: currentTask.task.title });
    undoTimeoutRef.current = setTimeout(() => setUndoTask(null), 4000);

    if (currentIndex < totalTasks - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      // All done - navigate to session complete with stats
      const elapsedSeconds = blitzDurationSeconds - secondsLeft;
      const elapsedMinutes = Math.max(1, Math.round(elapsedSeconds / 60));
      const xpEarned = newCompleted * 10;
      router.replace({
        pathname: '/session-complete',
        params: {
          tasksCompleted: String(newCompleted),
          timeSpent: String(elapsedMinutes),
          xpEarned: String(xpEarned),
          roomId: currentTask.roomId,
          roomName: currentTask.roomName,
        },
      });
    }
  }, [currentTask, currentIndex, totalTasks, toggleTask, completedCount, secondsLeft]);

  const handleSkip = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentIndex < totalTasks - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      // Last task skipped — navigate to session complete with stats
      const elapsedSeconds = blitzDurationSeconds - secondsLeft;
      const elapsedMinutes = Math.max(1, Math.round(elapsedSeconds / 60));
      const xpEarned = completedCount * 10;
      if (completedCount > 0) {
        router.replace({
          pathname: '/session-complete',
          params: {
            tasksCompleted: String(completedCount),
            timeSpent: String(elapsedMinutes),
            xpEarned: String(xpEarned),
            roomId: currentTask?.roomId ?? '',
            roomName: currentTask?.roomName ?? '',
          },
        });
      } else {
        router.back();
      }
    }
  }, [currentIndex, totalTasks, blitzDurationSeconds, secondsLeft, completedCount, currentTask]);

  const handleClose = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (_timerRunning || completedCount > 0) {
      Alert.alert(
        'Leave session?',
        'Your progress on completed tasks is saved, but the timer will reset.',
        [
          { text: 'Stay', style: 'cancel' },
          { text: 'Leave', style: 'destructive', onPress: () => router.back() },
        ],
      );
    } else {
      router.back();
    }
  }, [_timerRunning, completedCount]);

  if (!currentTask) {
    return (
      <View style={[styles.container, { backgroundColor: t.bg }]}>
        <View style={[styles.centered, { paddingTop: insets.top + 40 }]}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>{'\u2728'}</Text>
          <Text style={[styles.doneTitle, { color: t.text }]}>All done!</Text>
          <Text style={[styles.doneSubtitle, { color: t.textSecondary }]}>
            You completed {completedCount} task{completedCount === 1 ? '' : 's'}. Amazing!
          </Text>
          {completedCount > 0 && (
            <Text style={{ fontFamily: BODY_FONT, fontSize: 14, color: V1.green, fontWeight: '600', marginBottom: 16 }}>
              +{completedCount * 10} XP earned
            </Text>
          )}
          <Pressable onPress={handleClose} style={styles.doneButton}>
            <Text style={styles.doneButtonText}>Back to Tasks</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const ENCOURAGEMENTS = [
    'You got this. One task at a time.',
    'Great start! Keep going!',
    "You're on a roll!",
    'Look at you go!',
    'Momentum is building!',
    'Almost there, keep pushing!',
    'Your space is transforming!',
  ];
  const encouragement = completedCount > 0
    ? ENCOURAGEMENTS[Math.min(completedCount, ENCOURAGEMENTS.length - 1)]
    : ENCOURAGEMENTS[0];

  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      <AmbientBackdrop isDark={isDark} variant="progress" />

      {/* Mascot avatar */}
      {mascot && (
        <View style={{ position: 'absolute', top: insets.top + 8, right: 16, zIndex: 10 }}>
          <MascotAvatar size={40} mood={mascot.mood} />
        </View>
      )}

      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Text style={[styles.counterText, { color: t.textSecondary }]}>
          {currentIndex + 1} of {totalTasks}
        </Text>

        {/* Timer badge */}
        <View style={[styles.timerBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
          <Clock size={14} color={V1.green} />
          <Text style={[styles.timerText, { color: V1.green }]}>
            {formatTime(secondsLeft)}
          </Text>
        </View>

        <Pressable
          onPress={handleClose}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Close single task view"
        >
          <X size={22} color={t.textSecondary} />
        </Pressable>
      </View>

      {/* Phase progress bars */}
      <Animated.View entering={reducedMotion ? undefined : FadeIn.duration(300)} style={styles.phaseBars}>
        {allTasks.slice(0, Math.min(totalTasks, 5)).map((_, i) => (
          <View
            key={i}
            style={[
              styles.phaseBar,
              {
                backgroundColor: i < currentIndex
                  ? PHASE_COLORS[i % PHASE_COLORS.length]
                  : i === currentIndex
                    ? PHASE_COLORS[i % PHASE_COLORS.length]
                    : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                opacity: i <= currentIndex ? 1 : 0.4,
              },
            ]}
          />
        ))}
      </Animated.View>

      {/* Task content */}
      <ScrollView
        style={styles.taskContent}
        contentContainerStyle={styles.taskContentInner}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={reducedMotion ? undefined : FadeInDown.duration(350)} style={styles.taskCenter}>
          {/* Phase info */}
          <Text style={[styles.phaseLabel, { color: V1.coral }]}>
            {currentTask.task.phase && currentTask.task.phaseName
              ? `Phase ${currentTask.task.phase} · ${currentTask.task.phaseName}`
              : phaseLabel}
          </Text>
          <Text style={[styles.taskName, { color: t.text }]}>{currentTask.task.title}</Text>
          <View style={styles.taskMeta}>
            <Clock size={14} color={t.textMuted} />
            <Text style={[styles.taskMetaText, { color: t.textMuted }]}>
              EST {currentTask.task.estimatedMinutes} min
            </Text>
          </View>
          {/* Location + destination context */}
          {(currentTask.task.targetObjects?.[0] || currentTask.task.destination?.location || currentTask.task.zone) && (
            <View style={{
              backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
              borderRadius: 10,
              padding: 12,
              marginTop: 8,
              gap: 6,
              width: '100%',
            }}>
              {currentTask.task.zone && (
                <Text style={{ fontSize: 13, color: isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.5)' }}>
                  📍 Zone: {currentTask.task.zone}
                </Text>
              )}
              {currentTask.task.targetObjects?.[0] && (
                <Text style={{ fontSize: 13, color: isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.5)' }}>
                  🎯 {currentTask.task.targetObjects.slice(0, 3).join(' · ')}
                </Text>
              )}
              {currentTask.task.destination?.location && (
                <Text style={{ fontSize: 13, color: isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.5)' }}>
                  → {currentTask.task.destination.location}
                  {currentTask.task.destination.instructions ? ` · ${currentTask.task.destination.instructions}` : ''}
                </Text>
              )}
            </View>
          )}
        </Animated.View>

        {/* Subtasks — the step-by-step breakdown */}
        {currentTask.task.subtasks && currentTask.task.subtasks.length > 0 && (
          <Animated.View entering={reducedMotion ? undefined : FadeInDown.duration(350).delay(80)}>
            <View style={[styles.subtasksCard, {
              backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
            }]}>
              <Text style={[styles.subtasksLabel, { color: t.textSecondary }]}>STEPS:</Text>
              {currentTask.task.subtasks.map((st, idx) => (
                <View key={st.id || idx} style={styles.subtaskStepRow}>
                  <View style={[styles.subtaskStepCircle, {
                    borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)',
                  }]}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: t.textMuted }}>{idx + 1}</Text>
                  </View>
                  <Text style={{ fontSize: 13, color: t.textSecondary, flex: 1 }}>
                    {st.title}
                    {st.estimatedSeconds ? ` (${st.estimatedSeconds}s)` : ''}
                  </Text>
                </View>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Mental benefit — ADHD motivation */}
        {currentTask.task.mentalBenefit && (
          <Animated.View entering={reducedMotion ? undefined : FadeInDown.duration(350).delay(90)}>
            <View style={[styles.mentalBenefitCard, {
              backgroundColor: isDark ? 'rgba(52,199,89,0.1)' : 'rgba(34,197,94,0.08)',
              borderColor: isDark ? 'rgba(52,199,89,0.2)' : 'rgba(34,197,94,0.15)',
            }]}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: V1.green, marginBottom: 4 }}>
                🧠 Why this helps:
              </Text>
              <Text style={{ fontSize: 13, color: t.textSecondary, lineHeight: 19 }}>
                {currentTask.task.mentalBenefit}
              </Text>
            </View>
          </Animated.View>
        )}

        {/* Dusty says tip */}
        <Animated.View entering={reducedMotion ? undefined : FadeInDown.duration(350).delay(100)}>
          <View style={[styles.tipCard, {
            backgroundColor: isDark ? 'rgba(255,183,77,0.1)' : 'rgba(255,183,77,0.08)',
            borderColor: isDark ? 'rgba(255,183,77,0.2)' : 'rgba(255,183,77,0.15)',
          }]}>
            <Text style={[styles.tipLabel, { color: V1.amber }]}>Dusty says:</Text>
            <Text style={[styles.tipText, { color: t.textSecondary }]}>
              {getDustyTip(currentTask.task)}
            </Text>
          </View>
        </Animated.View>

        {/* Decision Points */}
        {currentTask?.task?.decisionPoints && currentTask.task.decisionPoints.length > 0 && (
          <Animated.View entering={reducedMotion ? undefined : FadeInDown.duration(350).delay(120)}>
            {!showDecisionHelp ? (
              <Pressable
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowDecisionHelp(true);
                }}
                style={[styles.decisionHelpButton, {
                  backgroundColor: isDark ? 'rgba(255,107,107,0.08)' : 'rgba(255,107,107,0.06)',
                  borderColor: isDark ? 'rgba(255,107,107,0.15)' : 'rgba(255,107,107,0.12)',
                }]}
              >
                <Text style={[styles.decisionHelpText, { color: V1.coral }]}>
                  Need help deciding?
                </Text>
              </Pressable>
            ) : (
              <View style={[styles.decisionCard, {
                backgroundColor: isDark ? 'rgba(255,107,107,0.08)' : 'rgba(255,107,107,0.06)',
                borderColor: isDark ? 'rgba(255,107,107,0.15)' : 'rgba(255,107,107,0.12)',
              }]}>
                <Pressable
                  onPress={() => setShowDecisionHelp(false)}
                  style={{ alignSelf: 'flex-end' }}
                  hitSlop={8}
                >
                  <Text style={{ fontFamily: BODY_FONT, fontSize: 12, color: t.textMuted }}>Hide</Text>
                </Pressable>
                {currentTask.task.decisionPoints.map((dp, i) => (
                  <View key={dp.id || i} style={{ gap: 8 }}>
                    <Text style={{ fontFamily: BODY_FONT, fontSize: 14, fontWeight: '600', color: t.text }}>
                      {dp.question}
                    </Text>
                    {dp.options && dp.options.length > 0 && (
                      <View style={{ gap: 6 }}>
                        {dp.options.map((opt, oi) => {
                          const isDefault = opt.answer === dp.fiveSecondDefault;
                          return (
                            <View
                              key={oi}
                              style={{
                                backgroundColor: isDefault
                                  ? (isDark ? 'rgba(102,187,106,0.15)' : 'rgba(102,187,106,0.12)')
                                  : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'),
                                borderRadius: 10,
                                paddingHorizontal: 12,
                                paddingVertical: 8,
                                borderWidth: isDefault ? 1 : 0,
                                borderColor: V1.green + '40',
                              }}
                            >
                              <Text style={{ fontFamily: BODY_FONT, fontSize: 13, color: t.text }}>
                                {opt.answer}
                              </Text>
                              {opt.action && (
                                <Text style={{ fontFamily: BODY_FONT, fontSize: 12, color: t.textMuted, marginTop: 2 }}>
                                  {opt.action}
                                </Text>
                              )}
                              {isDefault && (
                                <Text style={{ fontFamily: BODY_FONT, fontSize: 11, color: V1.green, fontWeight: '600', marginTop: 2 }}>
                                  5-second default
                                </Text>
                              )}
                            </View>
                          );
                        })}
                      </View>
                    )}
                    {dp.emotionalSupport && (
                      <Text style={{ fontFamily: BODY_FONT, fontSize: 12, fontStyle: 'italic', color: t.textMuted }}>
                        {dp.emotionalSupport}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            )}
          </Animated.View>
        )}
      </ScrollView>

      {/* Bottom actions */}
      <View style={[styles.bottomArea, { paddingBottom: insets.bottom + 24 }]}>
        {/* Big check button */}
        <Pressable
          onPress={handleComplete}
          accessibilityRole="button"
          accessibilityLabel="Tap when done"
          style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
        >
          <View style={[styles.checkButton, { borderColor: V1.green }]}>
            <CheckCircle size={40} color={V1.green} />
          </View>
        </Pressable>
        <Text style={[styles.checkLabel, { color: t.textSecondary }]}>Tap when done</Text>

        {/* Skip */}
        <Pressable onPress={handleSkip} hitSlop={16}>
          <Text style={[styles.skipText, { color: t.textMuted }]}>Skip this task</Text>
        </Pressable>

        {/* Encouragement */}
        <Text style={[styles.encouragement, { color: t.textMuted }]}>
          {encouragement}
        </Text>
      </View>

      {/* Undo Toast */}
      {undoTask && (
        <Animated.View
          entering={FadeInDown.duration(250)}
          style={{
            position: 'absolute',
            bottom: insets.bottom + 120,
            left: 20,
            right: 20,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingVertical: 14,
            borderRadius: 14,
            backgroundColor: isDark ? '#2A2A2A' : '#333333',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 6,
            zIndex: 50,
          }}
        >
          <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600', fontFamily: BODY_FONT, flex: 1 }} numberOfLines={1}>
            Task complete!
          </Text>
          <Pressable
            onPress={() => {
              if (undoTask) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                toggleTask(undoTask.roomId, undoTask.taskId);
                setCompletedCount(c => Math.max(0, c - 1));
                setCurrentIndex(i => Math.max(0, i - 1));
                setUndoTask(null);
                if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
              }
            }}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Undo task completion"
          >
            <Text style={{ color: V1.coral, fontSize: 14, fontWeight: '700', fontFamily: BODY_FONT, marginLeft: 16 }}>
              Undo
            </Text>
          </Pressable>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },

  // Top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  counterText: {
    fontFamily: BODY_FONT,
    fontSize: 14,
    fontWeight: '500',
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  timerText: {
    fontFamily: BODY_FONT,
    fontSize: 14,
    fontWeight: '700',
  },

  // Phase bars
  phaseBars: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 4,
    marginBottom: 20,
  },
  phaseBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
  },

  // Task content
  taskContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  taskContentInner: {
    justifyContent: 'center',
    gap: 16,
    flexGrow: 1,
    paddingVertical: 12,
  },
  taskCenter: {
    alignItems: 'center',
    gap: 12,
  },
  phaseLabel: {
    fontFamily: BODY_FONT,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  taskName: {
    fontFamily: DISPLAY_FONT,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  taskMetaText: {
    fontFamily: BODY_FONT,
    fontSize: 13,
    fontWeight: '500',
  },

  // Subtasks card
  subtasksCard: {
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  subtasksLabel: {
    fontFamily: BODY_FONT,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  subtaskStepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  subtaskStepCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Mental benefit card
  mentalBenefitCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
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
    fontSize: 12,
    fontWeight: '700',
  },
  tipText: {
    fontFamily: BODY_FONT,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
  },

  // Bottom
  bottomArea: {
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
  },
  checkButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkLabel: {
    fontFamily: BODY_FONT,
    fontSize: 13,
    fontWeight: '500',
  },
  skipText: {
    fontFamily: BODY_FONT,
    fontSize: 13,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  encouragement: {
    fontFamily: BODY_FONT,
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 4,
  },

  // Decision help
  decisionHelpButton: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  decisionHelpText: {
    fontFamily: BODY_FONT,
    fontSize: 14,
    fontWeight: '600',
  },
  decisionCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },

  // Done state
  doneTitle: {
    fontFamily: DISPLAY_FONT,
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  doneSubtitle: {
    fontFamily: BODY_FONT,
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 24,
  },
  doneButton: {
    backgroundColor: '#66BB6A',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 26,
  },
  doneButtonText: {
    fontFamily: BODY_FONT,
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
