/**
 * Declutterly -- 15-Minute Blitz Session (V1 Hero Feature)
 * Matches Pencil designs: 0mb7F (timer view) + HxiD0 (single task focus)
 *
 * Unified guided cleaning session:
 * - Timer countdown (15 min default)
 * - Shows ONE task at a time (single task focus)
 * - Dusty says tip bubble
 * - Auto-advances to next task
 * - Progress bar, phase indicator
 * - Pause/resume, skip
 */

import { useDeclutter } from '@/context/DeclutterContext';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  Dimensions,
} from 'react-native';
import Animated, {
  FadeIn,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { Square, Pause, SkipForward, X, Check, Clock } from 'lucide-react-native';

// ─── V1 Design Tokens ────────────────────────────────────────────────────────
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

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TIMER_SIZE = Math.min(SCREEN_WIDTH * 0.6, 220);
const TIMER_STROKE = 10;
const BLITZ_DURATION = 15 * 60; // 15 minutes in seconds

// ─── Helper: format time ─────────────────────────────────────────────────────
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ─── Dusty tips for tasks ────────────────────────────────────────────────────
const DUSTY_TIPS = [
  "Start from left to right. Spray, wait 10 seconds, then wipe. Easy!",
  "Just toss the obvious trash first. Don't think, just toss!",
  "Put on your favorite song. This task takes about one track!",
  "Grab a bag or box first. Then just walk and collect.",
  "Focus on surfaces first -- it makes the biggest visual difference.",
  "You don't have to sort everything perfectly. Good enough is great!",
  "Set a 3-minute timer for this one. Race yourself!",
  "Stack similar items together. Don't decide where yet, just group.",
];

function getDustyTip(index: number): string {
  return DUSTY_TIPS[index % DUSTY_TIPS.length];
}

// ─── Encouragement messages ──────────────────────────────────────────────────
function getEncouragement(done: number, total: number): string {
  if (done === 0) return "Let's do this!";
  if (done === 1) return "Great start! Keep going!";
  if (done >= total) return "You did it all! Amazing!";
  return `You're doing amazing -- ${done} down, ${total - done} to go!`;
}

// ─── Timer Ring Component ────────────────────────────────────────────────────
function TimerRing({ progress, size, strokeWidth }: { progress: number; size: number; strokeWidth: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - Math.max(0, Math.min(1, progress)));

  return (
    <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="rgba(255,255,255,0.08)"
        strokeWidth={strokeWidth}
        fill="none"
      />
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={V1.coral}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
      />
    </Svg>
  );
}

// ─── Phase dot colors ────────────────────────────────────────────────────────
const PHASE_COLORS = [V1.green, V1.green, V1.amber, V1.coral, V1.coral];

// ─────────────────────────────────────────────────────────────────────────────
// Main Blitz Screen
// ─────────────────────────────────────────────────────────────────────────────
export default function BlitzScreen() {
  const insets = useSafeAreaInsets();
  const { rooms, activeRoomId, toggleTask } = useDeclutter();

  const activeRoom = activeRoomId ? rooms.find(r => r.id === activeRoomId) : rooms[0];
  const tasks = useMemo(() => {
    if (!activeRoom) return [];
    return (activeRoom.tasks || []).filter(t => !t.completed);
  }, [activeRoom]);

  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(BLITZ_DURATION);
  const [isRunning, setIsRunning] = useState(true);
  const [viewMode, setViewMode] = useState<'timer' | 'focus'>('timer'); // Toggle between timer view and focus view
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalTasks = tasks.length;
  const currentTask = tasks[currentTaskIndex] || null;
  const timerProgress = remainingSeconds / BLITZ_DURATION;

  // Timer tick
  useEffect(() => {
    if (isRunning && remainingSeconds > 0) {
      intervalRef.current = setInterval(() => {
        setRemainingSeconds(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            setIsRunning(false);
            // Navigate to session complete
            handleSessionEnd();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, remainingSeconds]);

  const handleSessionEnd = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const timeSpent = BLITZ_DURATION - remainingSeconds;
    const xpEarned = completedCount * 25;
    (router.replace as any)({
      pathname: '/session-complete',
      params: {
        tasksCompleted: String(completedCount),
        timeSpent: String(Math.round(timeSpent / 60)),
        xpEarned: String(xpEarned),
        roomId: activeRoom?.id || '',
        roomName: activeRoom?.name || '',
      },
    });
  }, [completedCount, remainingSeconds, activeRoom]);

  const handleCompleteTask = useCallback(() => {
    if (!currentTask || !activeRoom) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    toggleTask(activeRoom.id, currentTask.id);
    setCompletedCount(c => c + 1);

    // Check if all tasks done
    if (currentTaskIndex >= totalTasks - 1) {
      // All tasks completed!
      setTimeout(() => handleSessionEnd(), 500);
    } else {
      setCurrentTaskIndex(i => i + 1);
    }
  }, [currentTask, activeRoom, currentTaskIndex, totalTasks, toggleTask, handleSessionEnd]);

  const handleSkipTask = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentTaskIndex < totalTasks - 1) {
      setCurrentTaskIndex(i => i + 1);
    }
  }, [currentTaskIndex, totalTasks]);

  const handlePauseResume = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsRunning(r => !r);
  }, []);

  const handleClose = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (completedCount > 0) {
      handleSessionEnd();
    } else {
      router.back();
    }
  }, [completedCount, handleSessionEnd]);

  const handleToggleView = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setViewMode(v => v === 'timer' ? 'focus' : 'timer');
  }, []);

  // ── FOCUS VIEW (Single Task Focus - HxiD0) ─────────────────────────────
  if (viewMode === 'focus') {
    return (
      <View style={[styles.container, { backgroundColor: V1.dark.bg }]}>
        {/* Top bar */}
        <View style={[styles.focusTopBar, { paddingTop: insets.top + 8 }]}>
          <Text style={styles.focusProgress}>
            {completedCount + 1} of {totalTasks}
          </Text>
          <Pressable onPress={handleToggleView} style={styles.timerBadge}>
            <Clock size={12} color="#FFFFFF" />
            <Text style={styles.timerBadgeText}>{formatTime(remainingSeconds)}</Text>
          </Pressable>
          <Pressable onPress={handleClose}>
            <X size={22} color="rgba(255,255,255,0.5)" />
          </Pressable>
        </View>

        {/* Phase indicator bars */}
        <View style={styles.phaseBars}>
          {tasks.slice(0, Math.min(totalTasks, 5)).map((_, i) => (
            <View
              key={i}
              style={[
                styles.phaseBar,
                {
                  backgroundColor: i < completedCount
                    ? PHASE_COLORS[i % PHASE_COLORS.length]
                    : i === currentTaskIndex
                      ? PHASE_COLORS[i % PHASE_COLORS.length]
                      : 'rgba(255,255,255,0.1)',
                  opacity: i <= currentTaskIndex ? 1 : 0.3,
                  flex: 1,
                },
              ]}
            />
          ))}
        </View>

        {/* Task content */}
        <View style={styles.focusCenter}>
          <Animated.View entering={FadeIn.duration(300)} key={currentTaskIndex}>
            <Text style={styles.focusTaskLabel}>Task {currentTaskIndex + 1}</Text>
            <Text style={styles.focusTaskName}>
              {currentTask?.title || 'All done!'}
            </Text>
            <View style={styles.focusTimeRow}>
              <Clock size={14} color="rgba(255,255,255,0.5)" />
              <Text style={styles.focusTimeText}>
                ~{currentTask?.estimatedMinutes || 3} minutes
              </Text>
            </View>
          </Animated.View>
        </View>

        {/* Dusty says bubble */}
        <View style={styles.dustyBubble}>
          <Text style={styles.dustySays}>Dusty says:</Text>
          <Text style={styles.dustyTip}>
            {getDustyTip(currentTaskIndex)}
          </Text>
        </View>

        {/* Big check button */}
        <View style={styles.focusActions}>
          <Pressable onPress={handleCompleteTask} style={styles.bigCheckButton}>
            <View style={styles.bigCheckCircle}>
              <Check size={32} color={V1.green} strokeWidth={3} />
            </View>
            <Text style={styles.bigCheckText}>Tap when done</Text>
          </Pressable>

          <Pressable onPress={handleSkipTask}>
            <Text style={styles.skipText}>Skip this task</Text>
          </Pressable>
        </View>

        {/* Encouragement */}
        <Text style={[styles.encouragement, { paddingBottom: insets.bottom + 16 }]}>
          {getEncouragement(completedCount, totalTasks)}
        </Text>
      </View>
    );
  }

  // ── TIMER VIEW (0mb7F) ──────────────────────────────────────────────────
  return (
    <View style={[styles.container, { backgroundColor: V1.dark.bg }]}>
      {/* Header */}
      <View style={[styles.timerHeader, { paddingTop: insets.top + 8 }]}>
        <View style={{ width: 40 }} />
        <View style={styles.timerHeaderCenter}>
          <Text style={styles.timerLabel}>15-Minute Blitz</Text>
          <Text style={styles.timerRoomName}>{activeRoom?.name || 'Room'} Refresh</Text>
        </View>
        <Pressable onPress={handleClose} hitSlop={12}>
          <X size={22} color="rgba(255,255,255,0.5)" />
        </Pressable>
      </View>

      {/* Timer Ring */}
      <View style={styles.timerRingSection}>
        <View style={styles.timerRingWrapper}>
          <TimerRing
            progress={timerProgress}
            size={TIMER_SIZE}
            strokeWidth={TIMER_STROKE}
          />
          <View style={styles.timerCenter}>
            <Text style={styles.timerTime}>{formatTime(remainingSeconds)}</Text>
            <Text style={styles.timerRemaining}>remaining</Text>
          </View>
        </View>
      </View>

      {/* Current task */}
      <View style={styles.taskSection}>
        <View style={[styles.currentTaskCard, { borderLeftColor: V1.coral }]}>
          <View style={[styles.nowPill, { backgroundColor: V1.coral }]}>
            <Text style={styles.nowPillText}>NOW</Text>
          </View>
          <Text style={styles.currentTaskName}>
            {currentTask?.title || 'All tasks done!'}
          </Text>
          <Text style={styles.currentTaskTime}>
            ~{currentTask?.estimatedMinutes || 0} minutes
          </Text>
        </View>

        {/* Up next */}
        {currentTaskIndex < totalTasks - 1 && (
          <View style={styles.nextTaskCard}>
            <Text style={styles.upNextLabel}>UP NEXT</Text>
            <Text style={styles.nextTaskName}>
              {tasks[currentTaskIndex + 1]?.title || ''}
            </Text>
          </View>
        )}
      </View>

      {/* Progress dots */}
      <View style={styles.progressSection}>
        <Text style={styles.progressText}>
          {completedCount} of {totalTasks} done
        </Text>
        <View style={styles.progressDotsRow}>
          {tasks.slice(0, Math.min(totalTasks, 6)).map((_, i) => (
            <View
              key={i}
              style={[
                styles.progressDotLarge,
                {
                  backgroundColor: i < completedCount
                    ? V1.green
                    : i === currentTaskIndex
                      ? V1.coral
                      : 'rgba(255,255,255,0.15)',
                },
              ]}
            />
          ))}
        </View>
      </View>

      {/* Controls */}
      <View style={[styles.controls, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable onPress={handleToggleView} style={styles.controlButton}>
          <Square size={22} color="rgba(255,255,255,0.6)" />
        </Pressable>
        <Pressable onPress={handlePauseResume} style={[styles.controlButtonMain, { backgroundColor: V1.coral }]}>
          {isRunning ? (
            <Pause size={28} color="#FFFFFF" fill="#FFFFFF" />
          ) : (
            <View style={styles.playIcon}>
              <Text style={styles.playIconText}>▶</Text>
            </View>
          )}
        </Pressable>
        <Pressable onPress={() => { handleCompleteTask(); }} style={styles.controlButton}>
          <SkipForward size={22} color="rgba(255,255,255,0.6)" />
        </Pressable>
      </View>

      {/* Encouragement footer */}
      <Text style={styles.footerEncouragement}>
        {getEncouragement(completedCount, totalTasks)}
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },

  // ── Timer View ─────────────────────────────────────────────────────────
  timerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  timerHeaderCenter: {
    alignItems: 'center',
  },
  timerLabel: {
    color: V1.coral,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  timerRoomName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  timerRingSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  timerRingWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerCenter: {
    position: 'absolute',
    alignItems: 'center',
  },
  timerTime: {
    color: '#FFFFFF',
    fontSize: 48,
    fontWeight: '200',
    fontVariant: ['tabular-nums'],
    letterSpacing: -1,
  },
  timerRemaining: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
    marginTop: 2,
  },

  // ── Task Cards ─────────────────────────────────────────────────────────
  taskSection: {
    paddingHorizontal: 20,
    gap: 1,
  },
  currentTaskCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderLeftWidth: 3,
    borderRadius: 12,
    padding: 16,
    marginBottom: 1,
  },
  nowPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 8,
  },
  nowPillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  currentTaskName: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  currentTaskTime: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
  },
  nextTaskCard: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: 'rgba(255,255,255,0.1)',
  },
  upNextLabel: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 6,
  },
  nextTaskName: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 15,
  },

  // ── Progress ───────────────────────────────────────────────────────────
  progressSection: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  progressText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
  },
  progressDotsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  progressDotLarge: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  // ── Controls ───────────────────────────────────────────────────────────
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
    paddingVertical: 8,
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlButtonMain: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    marginLeft: 3,
  },
  playIconText: {
    color: '#FFFFFF',
    fontSize: 24,
  },
  footerEncouragement: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 13,
    textAlign: 'center',
    paddingBottom: 8,
  },

  // ── Focus View ─────────────────────────────────────────────────────────
  focusTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  focusProgress: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: V1.coral,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  timerBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },

  phaseBars: {
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  phaseBar: {
    height: 4,
    borderRadius: 2,
  },

  focusCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  focusTaskLabel: {
    color: V1.coral,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  focusTaskName: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  focusTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  focusTimeText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
  },

  // ── Dusty Bubble ───────────────────────────────────────────────────────
  dustyBubble: {
    marginHorizontal: 20,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  dustySays: {
    color: V1.gold,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  dustyTip: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    lineHeight: 20,
  },

  // ── Big Check ──────────────────────────────────────────────────────────
  focusActions: {
    alignItems: 'center',
    gap: 16,
    paddingBottom: 8,
  },
  bigCheckButton: {
    alignItems: 'center',
    gap: 8,
  },
  bigCheckCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2.5,
    borderColor: V1.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigCheckText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
  },
  skipText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 14,
  },
  encouragement: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 13,
    textAlign: 'center',
    paddingTop: 12,
  },
});
