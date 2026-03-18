/**
 * Declutterly -- Single Task Focus (V1 Pencil Design)
 * One task at a time view during blitz mode.
 * Timer, phase progress bars, big check button, skip option.
 */

import { AmbientBackdrop } from '@/components/ui/AmbientBackdrop';
import { useDeclutter } from '@/context/DeclutterContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { CleaningTask } from '@/types/declutter';
import { X, Clock, CheckCircle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const BODY_FONT = 'DM Sans';
const DISPLAY_FONT = 'Bricolage Grotesque';
const BLITZ_DURATION_SECONDS = 15 * 60; // 15 minutes

const V1 = {
  coral: '#FF6B6B',
  green: '#66BB6A',
  amber: '#FFB74D',
  gold: '#FFD54F',
  blue: '#64B5F6',
  dark: {
    bg: '#0C0C0C',
    card: '#1A1A1A',
    border: 'rgba(255,255,255,0.08)',
    text: '#FFFFFF',
    textSecondary: 'rgba(255,255,255,0.5)',
    textMuted: 'rgba(255,255,255,0.3)',
  },
  light: {
    bg: '#FAFAFA',
    card: '#F6F7F8',
    border: '#E5E7EB',
    text: '#1A1A1A',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',
  },
};

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
  const rawScheme = useColorScheme();
  const isDark = rawScheme === 'dark';
  const reducedMotion = useReducedMotion();
  const insets = useSafeAreaInsets();
  const { rooms: rawRooms, toggleTask } = useDeclutter();
  const rooms = rawRooms ?? [];
  const t = isDark ? V1.dark : V1.light;

  // Gather all incomplete tasks across rooms
  const allTasks = useMemo(() => {
    const tasks: Array<{ task: CleaningTask; roomId: string; roomName: string }> = [];
    rooms.forEach((room) => {
      (room.tasks ?? []).forEach((task) => {
        if (!task.completed) {
          tasks.push({ task, roomId: room.id, roomName: room.name });
        }
      });
    });
    return tasks;
  }, [rooms]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(BLITZ_DURATION_SECONDS);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Start timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const totalTasks = allTasks.length;
  const currentTask = allTasks[currentIndex];
  const phaseLabel = currentTask ? `Task ${currentIndex + 1}` : 'Done!';

  const handleComplete = useCallback(() => {
    if (!currentTask) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    toggleTask(currentTask.roomId, currentTask.task.id);
    setCompletedCount((c) => c + 1);
    if (currentIndex < totalTasks - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      // All done
      router.back();
    }
  }, [currentTask, currentIndex, totalTasks, toggleTask]);

  const handleSkip = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentIndex < totalTasks - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      router.back();
    }
  }, [currentIndex, totalTasks]);

  const handleClose = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, []);

  if (!currentTask) {
    return (
      <View style={[styles.container, { backgroundColor: t.bg }]}>
        <View style={[styles.centered, { paddingTop: insets.top + 40 }]}>
          <Text style={[styles.doneTitle, { color: t.text }]}>All done!</Text>
          <Text style={[styles.doneSubtitle, { color: t.textSecondary }]}>
            You completed {completedCount} task{completedCount === 1 ? '' : 's'}. Amazing!
          </Text>
          <Pressable onPress={handleClose} style={styles.doneButton}>
            <Text style={styles.doneButtonText}>Back to Tasks</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const encouragement = completedCount > 0
    ? `You're doing amazing \u2014 ${completedCount} down, ${totalTasks - currentIndex} to go!`
    : 'You got this. One task at a time.';

  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      <AmbientBackdrop isDark={isDark} variant="progress" />

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

        <Pressable onPress={handleClose} hitSlop={12}>
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
      <View style={styles.taskContent}>
        <Animated.View entering={reducedMotion ? undefined : FadeInDown.duration(350)} style={styles.taskCenter}>
          <Text style={[styles.phaseLabel, { color: V1.coral }]}>{phaseLabel}</Text>
          <Text style={[styles.taskName, { color: t.text }]}>{currentTask.task.title}</Text>
          <View style={styles.taskMeta}>
            <Clock size={14} color={t.textMuted} />
            <Text style={[styles.taskMetaText, { color: t.textMuted }]}>
              ~{currentTask.task.estimatedMinutes} minutes
            </Text>
          </View>
        </Animated.View>

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
      </View>

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
        <Pressable onPress={handleSkip} hitSlop={8}>
          <Text style={[styles.skipText, { color: t.textMuted }]}>Skip this task</Text>
        </Pressable>

        {/* Encouragement */}
        <Text style={[styles.encouragement, { color: t.textMuted }]}>
          {encouragement}
        </Text>
      </View>
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
    justifyContent: 'center',
    gap: 24,
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
