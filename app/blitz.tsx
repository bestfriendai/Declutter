/**
 * Declutterly -- 15-Minute Blitz Session
 * Simple, focused one-task-at-a-time cleaning session.
 */

import { V1, BODY_FONT, DISPLAY_FONT } from '@/constants/designTokens';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useDeclutter } from '@/context/DeclutterContext';
import { useTimer } from '@/hooks/useTimer';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { X } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenErrorBoundary } from '@/components/ErrorBoundary';

const DEFAULT_BLITZ_DURATION = 15 * 60;

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function BlitzScreen() {
  return (
    <ScreenErrorBoundary screenName="blitz">
      <BlitzScreenContent />
    </ScreenErrorBoundary>
  );
}

function BlitzScreenContent() {
  const insets = useSafeAreaInsets();
  const rawScheme = useColorScheme();
  const isDark = rawScheme === 'dark';
  const t = isDark ? V1.dark : V1.light;
  const { duration: durationParam } = useLocalSearchParams<{ duration?: string }>();
  const blitzDuration = durationParam
    ? Math.max(60, parseInt(durationParam, 10) * 60)
    : DEFAULT_BLITZ_DURATION;
  const { rooms, activeRoomId, toggleTask, comebackMultiplier } = useDeclutter();

  const activeRoom = activeRoomId
    ? (rooms ?? []).find(r => r.id === activeRoomId)
    : (rooms ?? [])[0];

  const activeRoomTasks = activeRoom?.tasks;
  const tasks = useMemo(() => {
    if (!activeRoomTasks) return [];
    return activeRoomTasks.filter(tk => !tk.completed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRoomTasks?.map(tk => `${tk.id}:${tk.completed}`).join(',')]);

  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const hasEndedRef = useRef(false);
  const completedCountRef = useRef(completedCount);
  const remainingSecondsRef = useRef(0);
  completedCountRef.current = completedCount;

  const totalTasks = tasks.length;
  const currentTask = tasks[currentTaskIndex] || null;

  // --- Timer ---
  const {
    remaining: remainingSeconds,
    isRunning,
    pause: timerPause,
    toggle: timerToggle,
  } = useTimer({
    initialSeconds: blitzDuration,
    autoStart: true,
    pauseOnBackground: true,
  });
  remainingSecondsRef.current = remainingSeconds;

  // --- Session end ---
  const handleSessionEnd = useCallback(() => {
    if (hasEndedRef.current) return;
    hasEndedRef.current = true;
    timerPause();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const completed = completedCountRef.current;
    const timeSpent = blitzDuration - remainingSecondsRef.current;
    const xpEarned = Math.round(completed * 10 * comebackMultiplier);
    router.replace({
      pathname: '/session-complete',
      params: {
        tasksCompleted: String(completed),
        timeSpent: String(Math.round(timeSpent / 60)),
        xpEarned: String(xpEarned),
        roomId: activeRoom?.id || '',
        roomName: activeRoom?.name || '',
      },
    });
  }, [activeRoom, blitzDuration, comebackMultiplier, timerPause]);

  // Timer hits 0 -> end session
  useEffect(() => {
    if (remainingSeconds === 0 && isRunning) {
      timerPause();
      handleSessionEnd();
    }
  }, [remainingSeconds, isRunning, handleSessionEnd, timerPause]);

  // --- Complete task ---
  const handleCompleteTask = useCallback(() => {
    if (!currentTask || !activeRoom) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    toggleTask(activeRoom.id, currentTask.id);
    setCompletedCount(c => c + 1);

    // If this was the last task, end session
    if (currentTaskIndex >= totalTasks - 1) {
      setTimeout(() => handleSessionEnd(), 400);
    }
  }, [currentTask, activeRoom, currentTaskIndex, totalTasks, toggleTask, handleSessionEnd]);

  // --- Skip task (no modal, just advance) ---
  const handleSkipTask = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentTaskIndex < totalTasks - 1) {
      setCurrentTaskIndex(i => i + 1);
    }
  }, [currentTaskIndex, totalTasks]);

  // --- Pause/resume ---
  const handlePauseResume = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    timerToggle();
  }, [timerToggle]);

  // --- Close ---
  const handleClose = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (completedCount > 0) {
      handleSessionEnd();
    } else {
      Alert.alert(
        'Leave session?',
        "Your progress won't be saved.",
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Leave', style: 'destructive', onPress: () => router.back() },
        ],
      );
    }
  }, [completedCount, handleSessionEnd]);

  // --- Empty state ---
  if (tasks.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: t.bg }]}>
        <View style={styles.emptyContainer}>
          <Text style={{ fontSize: 40, marginBottom: 12 }}>{'\u2728'}</Text>
          <Text style={[styles.emptyTitle, { color: t.text }]}>All caught up!</Text>
          <Text style={[styles.emptySubtitle, { color: t.textSecondary }]}>
            No incomplete tasks to blitz right now. Scan a new room to get started.
          </Text>
          <Pressable
            onPress={() => {
              router.back();
              setTimeout(() => router.push('/camera'), 100);
            }}
            style={styles.scanButton}
          >
            <Text style={styles.scanButtonText}>Scan New Room</Text>
          </Pressable>
          <Pressable onPress={() => router.back()} style={{ paddingVertical: 10 }}>
            <Text style={{ color: t.textSecondary, fontSize: 14, fontWeight: '500', fontFamily: BODY_FONT }}>
              Go Back
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // --- Main view ---
  const taskEmoji = currentTask?.emoji || '\uD83E\uDDF9'; // fallback: broom
  const taskTitle = currentTask?.title || 'All done!';
  const taskDescription = currentTask?.description || '';
  const estimatedMin = currentTask?.estimatedMinutes || 2;

  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      {/* Top bar: X ... timer */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Pressable
          onPress={handleClose}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Close blitz session"
        >
          <X size={24} color={t.textMuted} />
        </Pressable>

        <Pressable
          onPress={handlePauseResume}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={`${isRunning ? 'Pause' : 'Resume'} timer, ${formatTime(remainingSeconds)} remaining`}
        >
          <Text style={[styles.timerText, { color: t.textSecondary, opacity: isRunning ? 1 : 0.5 }]}>
            {formatTime(remainingSeconds)}
          </Text>
        </Pressable>
      </View>

      {/* Task counter */}
      <Text style={[styles.taskCounter, { color: t.textSecondary }]}>
        Task {currentTaskIndex + 1} of {totalTasks}
      </Text>

      {/* Task card */}
      <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 24 }}>
        <Animated.View
          entering={FadeIn.duration(250)}
          key={`task-${currentTaskIndex}`}
          style={[styles.taskCard, {
            backgroundColor: isDark ? V1.dark.card : V1.light.card,
            borderColor: t.border,
          }]}
        >
          <Text style={styles.taskEmoji}>{taskEmoji}</Text>
          <Text style={[styles.taskTitle, { color: t.text }]}>{taskTitle}</Text>
          {taskDescription ? (
            <Text style={[styles.taskDescription, { color: t.textSecondary }]}>
              {taskDescription}
            </Text>
          ) : null}
          <Text style={[styles.taskTime, { color: t.textMuted }]}>
            ~{estimatedMin} min
          </Text>
        </Animated.View>
      </View>

      {/* Bottom actions */}
      <View style={[styles.bottomArea, { paddingBottom: insets.bottom + 20 }]}>
        <Pressable
          onPress={handleCompleteTask}
          style={styles.doneButton}
          accessibilityRole="button"
          accessibilityLabel={`Complete task: ${taskTitle}`}
        >
          <Text style={styles.doneButtonText}>{'\u2713'}  Done!</Text>
        </Pressable>

        <Pressable
          onPress={handleSkipTask}
          style={styles.skipButton}
          accessibilityRole="button"
          accessibilityLabel="Skip this task"
        >
          <Text style={[styles.skipText, { color: t.textMuted }]}>
            Skip this {'\u2192'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  timerText: {
    fontSize: 18,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    fontFamily: DISPLAY_FONT,
  },
  taskCounter: {
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
    fontFamily: BODY_FONT,
    marginTop: 4,
  },
  taskCard: {
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 36,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  taskEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  taskTitle: {
    fontSize: 23,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 30,
    fontFamily: DISPLAY_FONT,
    marginBottom: 10,
  },
  taskDescription: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    fontFamily: BODY_FONT,
    marginBottom: 12,
  },
  taskTime: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: BODY_FONT,
  },
  bottomArea: {
    paddingHorizontal: 24,
    gap: 14,
    alignItems: 'center',
  },
  doneButton: {
    backgroundColor: V1.green,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    fontFamily: DISPLAY_FONT,
  },
  skipButton: {
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 15,
    fontWeight: '500',
    fontFamily: BODY_FONT,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: DISPLAY_FONT,
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
    fontFamily: BODY_FONT,
  },
  scanButton: {
    backgroundColor: V1.coral,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 24,
    marginBottom: 12,
  },
  scanButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: BODY_FONT,
  },
});
