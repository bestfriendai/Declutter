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

import { V1, BODY_FONT, DISPLAY_FONT } from '@/constants/designTokens';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useDeclutter } from '@/context/DeclutterContext';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useTimer } from '@/hooks/useTimer';
import { playAmbientSound, stopAmbientSound, SOUND_INFO } from '@/services/audio';
import { STORAGE_KEYS } from '@/constants/storageKeys';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { Check, Clock, Pause, SkipForward, Square, X } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Alert,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
    useWindowDimensions,
} from 'react-native';
import Animated, {
    FadeIn,
    FadeInDown,
    FadeOut,
    useAnimatedProps,
    useDerivedValue,
    withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { ScreenErrorBoundary } from '@/components/ErrorBoundary';
import { MascotAvatar } from '@/components/ui/MascotAvatar';

// TIMER_SIZE now computed inside component via useWindowDimensions
const TIMER_STROKE = 10;
const DEFAULT_BLITZ_DURATION = 15 * 60; // 15 minutes in seconds

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

function getDustyTip(index: number, task?: { tips?: string[]; resistanceHandler?: string; whyThisMatters?: string } | null): string {
  // Prefer task-specific tips from AI, fall back to generic
  if (task?.tips && task.tips.length > 0) {
    return task.tips[index % task.tips.length];
  }
  if (task?.resistanceHandler) {
    return task.resistanceHandler;
  }
  if (task?.whyThisMatters) {
    return task.whyThisMatters;
  }
  return DUSTY_TIPS[index % DUSTY_TIPS.length];
}

// ─── Encouragement messages ──────────────────────────────────────────────────
function getEncouragement(done: number, total: number): string {
  if (done === 0) return "Let's do this!";
  if (done === 1) return "Great start! Keep going!";
  if (done >= total) return "You did it all! Amazing!";
  return `You're doing amazing -- ${done} down, ${total - done} to go!`;
}

// ─── Smooth Animated Timer Ring Component ────────────────────────────────────
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function TimerRing({ progress, size, strokeWidth, isDark = true }: { progress: number; size: number; strokeWidth: number; isDark?: boolean }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const animatedProgress = useDerivedValue(() => {
    return withTiming(progress, { duration: 1000 });
  }, [progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - Math.max(0, Math.min(1, animatedProgress.value))),
  }));

  return (
    <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}
        strokeWidth={strokeWidth}
        fill="none"
      />
      <AnimatedCircle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={V1.coral}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={circumference}
        animatedProps={animatedProps}
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
  return (
    <ScreenErrorBoundary screenName="blitz">
      <BlitzScreenContent />
    </ScreenErrorBoundary>
  );
}

function BlitzScreenContent() {
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const rawScheme = useColorScheme();
  const isDark = rawScheme === 'dark';
  const t = isDark ? V1.dark : V1.light;
  const { width: screenWidth } = useWindowDimensions();
  const TIMER_SIZE = Math.min(screenWidth * 0.6, 220);
  const { duration: durationParam } = useLocalSearchParams<{ duration?: string }>();
  const blitzDuration = durationParam ? Math.max(60, parseInt(durationParam, 10) * 60) : DEFAULT_BLITZ_DURATION;
  const blitzMinutes = Math.round(blitzDuration / 60);
  const { rooms, activeRoomId, toggleTask, comebackMultiplier, mascot } = useDeclutter();

  const activeRoom = activeRoomId ? (rooms ?? []).find(r => r.id === activeRoomId) : (rooms ?? [])[0];

  // Stabilize incomplete tasks list: depend on room tasks' IDs and completion
  // status rather than the room object reference. This prevents unnecessary
  // re-renders when unrelated room data changes.
  const activeRoomTasks = activeRoom?.tasks;
  const tasks = useMemo(() => {
    if (!activeRoomTasks) return [];
    return activeRoomTasks.filter(tk => !tk.completed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRoomTasks?.map(tk => `${tk.id}:${tk.completed}`).join(',')]);

  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [viewMode, setViewMode] = useState<'timer' | 'focus'>('timer'); // Toggle between timer view and focus view
  const completionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasEndedRef = useRef(false);

  const {
    remaining: remainingSeconds,
    isRunning,
    start: timerStart,
    pause: timerPause,
    toggle: timerToggle,
    reset: timerReset,
    setSeconds: timerSetSeconds,
    setIsRunning,
  } = useTimer({
    initialSeconds: blitzDuration,
    autoStart: true,
    pauseOnBackground: true,
    onTick: (remaining) => {
      const elapsed = blitzDuration - remaining;
      const quarterTime = Math.floor(blitzDuration * 0.25);
      const halfTime = Math.floor(blitzDuration * 0.5);
      const threeQuarterTime = Math.floor(blitzDuration * 0.75);

      if (elapsed === quarterTime) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      if (elapsed === halfTime) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      if (elapsed === threeQuarterTime) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      if (remaining === 120) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
      if (remaining === 30) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
    },
  });

  // Ambient sound for blitz sessions
  const SOUND_TYPES_LIST = ['none', 'rain', 'ocean', 'forest', 'cafe'] as const;
  type BlitzSoundType = typeof SOUND_TYPES_LIST[number];
  const [ambientSound, setAmbientSound] = useState<BlitzSoundType>('none');
  const [audioError, setAudioError] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEYS.AMBIENT_SOUND).then(val => {
      if (val && SOUND_TYPES_LIST.includes(val as BlitzSoundType)) {
        setAmbientSound(val as BlitzSoundType);
      }
    });
  }, []);

  useEffect(() => {
    if (isRunning && ambientSound !== 'none') {
      playAmbientSound(ambientSound).then(result => {
        if (!result.success) {
          setAudioError("Couldn't load sound. Continuing without audio.");
          setAmbientSound('none');
          AsyncStorage.setItem(STORAGE_KEYS.AMBIENT_SOUND, 'none');
          setTimeout(() => setAudioError(null), 3000);
        } else {
          setAudioError(null);
        }
      });
    } else {
      stopAmbientSound();
    }
    return () => { stopAmbientSound(); };
  }, [isRunning, ambientSound]);

  const handleCycleBlitzSound = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAudioError(null);
    setAmbientSound(prev => {
      const idx = SOUND_TYPES_LIST.indexOf(prev);
      const next = SOUND_TYPES_LIST[(idx + 1) % SOUND_TYPES_LIST.length];
      AsyncStorage.setItem(STORAGE_KEYS.AMBIENT_SOUND, next);
      return next;
    });
  }, []);

  // H6: Combo counter for task completion feedback
  const [comboCount, setComboCount] = useState(0);
  const comboTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Phase transition celebration state
  const [phaseTransition, setPhaseTransition] = useState<{ from: string; to: string } | null>(null);
  const phaseTransitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Before photo preview
  const [showPhotoPreview, setShowPhotoPreview] = useState(false);
  const roomPhotoUri = activeRoom?.photos?.[0]?.uri;

  // Extend timer prompt
  const [showExtendPrompt, setShowExtendPrompt] = useState(false);

  // Skip reason capture
  const [showSkipReason, setShowSkipReason] = useState(false);
  const [pendingSkipIndex, setPendingSkipIndex] = useState<number | null>(null);

  const SKIP_REASONS = [
    { id: 'too_hard', label: 'Too hard right now' },
    { id: 'need_supplies', label: 'Need supplies' },
    { id: 'not_applicable', label: "Doesn't apply" },
    { id: 'later', label: 'Save for later' },
  ] as const;

  // Encouraging messages that rotate during session
  const ENCOURAGING_MESSAGES = [
    "You're doing amazing!",
    "Every task counts!",
    "Look at you go!",
    "Your space is thanking you!",
    "Small steps, big impact!",
    "You've got this!",
    "Momentum is building!",
    "Keep that energy going!",
  ];

  const currentEncouragingMessage = ENCOURAGING_MESSAGES[
    Math.floor((blitzDuration - remainingSeconds) / 30) % ENCOURAGING_MESSAGES.length
  ];

  // Clean up combo timeout on unmount
  useEffect(() => {
    return () => {
      if (comboTimeoutRef.current) clearTimeout(comboTimeoutRef.current);
      if (completionTimeoutRef.current) clearTimeout(completionTimeoutRef.current);
      if (phaseTransitionTimeoutRef.current) clearTimeout(phaseTransitionTimeoutRef.current);
    };
  }, []);

  const totalTasks = tasks.length;
  const currentTask = tasks[currentTaskIndex] || null;
  const timerProgress = remainingSeconds / blitzDuration;

  // Carry chain hint: if next task shares destination with current task
  const carryChainHint = useMemo(() => {
    if (!currentTask || currentTaskIndex >= totalTasks - 1) return null;
    const nextTask = tasks[currentTaskIndex + 1];
    if (!nextTask) return null;
    const curDest = currentTask.destination?.location?.toLowerCase();
    const nextDest = nextTask.destination?.location?.toLowerCase();
    if (curDest && nextDest && curDest === nextDest) {
      return `Heading to the ${currentTask.destination?.location}? Also grab the ${nextTask.title.toLowerCase()}`;
    }
    // Also check if both tasks are in the same zone
    if (currentTask.zone && nextTask.zone && currentTask.zone === nextTask.zone && nextTask.targetObjects?.[0]) {
      return `While in ${currentTask.zone}, also grab ${nextTask.targetObjects[0]}`;
    }
    return null;
  }, [currentTask, currentTaskIndex, totalTasks, tasks]);

  // Keep refs for values needed by handleSessionEnd to avoid stale closures
  const completedCountRef = useRef(completedCount);
  const remainingSecondsRef = useRef(remainingSeconds);
  completedCountRef.current = completedCount;
  remainingSecondsRef.current = remainingSeconds;

  const handleSessionEnd = useCallback(() => {
    if (hasEndedRef.current) return;

    // Check if tasks remain — offer extension instead of ending
    const remaining = tasks.filter(t => !t.completed).length;
    if (remaining > 0 && completedCountRef.current > 0 && !showExtendPrompt) {
      setShowExtendPrompt(true);
      timerPause();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    hasEndedRef.current = true;
    if (completionTimeoutRef.current) clearTimeout(completionTimeoutRef.current);
    timerPause();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const completed = completedCountRef.current;
    const seconds = remainingSecondsRef.current;
    const timeSpent = blitzDuration - seconds;
    const xpEarned = Math.round(completed * 10 * comebackMultiplier); // 10 XP per task * comeback multiplier
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
  }, [activeRoom, blitzDuration, comebackMultiplier, tasks, showExtendPrompt, timerPause]);

  // Timer tick, milestone haptics, and background handling are now managed by useTimer hook.
  // Detect timer expiry to trigger session end.
  useEffect(() => {
    if (remainingSeconds === 0 && isRunning) {
      timerPause();
      handleSessionEnd();
    }
  }, [remainingSeconds, isRunning, handleSessionEnd, timerPause]);

  const handleCompleteTask = useCallback(() => {
    if (!currentTask || !activeRoom) return;

    // H6: Track combo
    if (comboTimeoutRef.current) clearTimeout(comboTimeoutRef.current);
    setComboCount(prev => prev + 1);
    comboTimeoutRef.current = setTimeout(() => {
      setComboCount(0);
    }, 60000);

    // H6: Enhanced haptic for multi-completions
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (comboCount >= 2) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }

    toggleTask(activeRoom.id, currentTask.id);
    setCompletedCount(c => c + 1);

    // Phase transition detection
    const currentPhase = currentTask.phase;
    const nextTask = currentTaskIndex < totalTasks - 1 ? tasks[currentTaskIndex + 1] : null;
    if (currentPhase && nextTask?.phase && nextTask.phase !== currentPhase) {
      const fromName = currentTask.phaseName || `Phase ${currentPhase}`;
      const toName = nextTask.phaseName || `Phase ${nextTask.phase}`;
      setPhaseTransition({ from: fromName, to: toName });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (phaseTransitionTimeoutRef.current) clearTimeout(phaseTransitionTimeoutRef.current);
      phaseTransitionTimeoutRef.current = setTimeout(() => {
        setPhaseTransition(null);
      }, 2000);
    }

    // Check if all tasks done.
    // NOTE: do NOT increment currentTaskIndex here. The completed task is filtered
    // out of `tasks` (which shows only incomplete tasks), so tasks[currentTaskIndex]
    // naturally becomes the next item. Incrementing would skip one task.
    if (currentTaskIndex >= totalTasks - 1) {
      // All tasks completed!
      completionTimeoutRef.current = setTimeout(() => handleSessionEnd(), 500);
    }
  }, [currentTask, activeRoom, currentTaskIndex, totalTasks, toggleTask, handleSessionEnd, comboCount]);

  const handleSkipTask = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPendingSkipIndex(currentTaskIndex);
    setShowSkipReason(true);
  }, [currentTaskIndex]);

  const handleSkipWithReason = useCallback((reason: string) => {
    if (pendingSkipIndex !== null) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (pendingSkipIndex < totalTasks - 1) {
        setCurrentTaskIndex(i => Math.min(i + 1, totalTasks - 1));
      }
    }
    setShowSkipReason(false);
    setPendingSkipIndex(null);
  }, [pendingSkipIndex, totalTasks]);

  const handlePauseResume = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    timerToggle();
  }, [timerToggle]);

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

  const handleToggleView = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setViewMode(v => v === 'timer' ? 'focus' : 'timer');
  }, []);

  // ── EMPTY STATE: No tasks to blitz ──────────────────────────────────────
  if (tasks.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: t.bg }]}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
          <Text style={{ fontSize: 40, marginBottom: 12 }}>{'\u2728'}</Text>
          <Text style={{ color: t.text, fontSize: 24, fontWeight: '700', textAlign: 'center', marginBottom: 12, fontFamily: DISPLAY_FONT }}>
            All caught up!
          </Text>
          <Text style={{ color: t.textSecondary, fontSize: 15, textAlign: 'center', marginBottom: 32, lineHeight: 22, fontFamily: BODY_FONT }}>
            No incomplete tasks to blitz right now. Scan a new room to get started.
          </Text>
          <Pressable
            onPress={() => {
              router.back();
              setTimeout(() => router.push('/camera'), 100);
            }}
            style={{ backgroundColor: V1.coral, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 24, marginBottom: 12 }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700', fontFamily: BODY_FONT }}>Scan New Room</Text>
          </Pressable>
          <Pressable
            onPress={() => router.back()}
            style={{ paddingHorizontal: 28, paddingVertical: 10 }}
          >
            <Text style={{ color: t.textSecondary, fontSize: 14, fontWeight: '500', fontFamily: BODY_FONT }}>Go Back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ── FOCUS VIEW (Single Task Focus - HxiD0) ─────────────────────────────
  if (viewMode === 'focus') {
    return (
      <View style={[styles.container, { backgroundColor: t.bg }]}>
        {/* Mascot avatar */}
        {mascot && (
          <View style={{ position: 'absolute', top: insets.top + 8, right: 56, zIndex: 10 }}>
            <MascotAvatar size={40} mood={mascot.mood} />
          </View>
        )}

        {/* H6: Combo Badge */}
        {comboCount > 1 && (
          <Animated.View
            entering={reducedMotion ? undefined : FadeInDown.springify()}
            style={styles.comboBadge}
          >
            <Text style={styles.comboBadgeText}>
              {comboCount}x Combo! {'\uD83D\uDD25'}
            </Text>
          </Animated.View>
        )}

        {/* Phase transition celebration overlay */}
        {phaseTransition && (
          <Animated.View
            entering={reducedMotion ? undefined : FadeIn.duration(300)}
            exiting={reducedMotion ? undefined : FadeOut.duration(300)}
            style={styles.phaseTransitionBanner}
          >
            <Text style={styles.phaseTransitionText}>
              {phaseTransition.from} Complete! {'\u2728'} Moving to {phaseTransition.to}...
            </Text>
          </Animated.View>
        )}

        {/* Top bar */}
        <View style={[styles.focusTopBar, { paddingTop: insets.top + 8 }]}>
          <Text style={[styles.focusProgress, { color: t.textSecondary }]}>
            {completedCount + 1} of {totalTasks}
          </Text>
          <Pressable
            onPress={handleToggleView}
            style={styles.timerBadge}
            accessibilityRole="button"
            accessibilityLabel={`Switch to timer view, ${formatTime(remainingSeconds)} remaining`}
          >
            <Clock size={12} color="#FFFFFF" />
            <Text style={styles.timerBadgeText}>{formatTime(remainingSeconds)}</Text>
          </Pressable>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            {/* Before photo thumbnail */}
            {roomPhotoUri && (
              <Pressable
                onPress={() => setShowPhotoPreview(true)}
                accessibilityRole="button"
                accessibilityLabel="View room before photo"
                style={styles.photoThumb}
              >
                <Image source={{ uri: roomPhotoUri }} style={styles.photoThumbImage} contentFit="cover" />
              </Pressable>
            )}
            <Pressable
              onPress={handleClose}
              accessibilityRole="button"
              accessibilityLabel="Close blitz session"
            >
              <X size={22} color={t.textMuted} />
            </Pressable>
          </View>
        </View>

        {/* Before photo expanded modal */}
        {showPhotoPreview && roomPhotoUri && (
          <Modal transparent animationType="fade" visible={showPhotoPreview} onRequestClose={() => setShowPhotoPreview(false)}>
            <Pressable
              style={styles.photoModalOverlay}
              onPress={() => setShowPhotoPreview(false)}
            >
              <View style={styles.photoModalContent}>
                <Image source={{ uri: roomPhotoUri }} style={styles.photoModalImage} contentFit="contain" />
                <Text style={styles.photoModalLabel}>Before photo</Text>
              </View>
            </Pressable>
          </Modal>
        )}

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
                      : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                  opacity: i <= currentTaskIndex ? 1 : 0.3,
                  flex: 1,
                },
              ]}
            />
          ))}
        </View>

        {/* Task content */}
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingVertical: 12 }} showsVerticalScrollIndicator={false}>
          <Animated.View entering={reducedMotion ? undefined : FadeIn.duration(300)} key={currentTaskIndex} style={styles.focusCenter}>
            {/* Phase label */}
            <Text style={styles.focusTaskLabel}>
              {currentTask?.phase && currentTask?.phaseName
                ? `Phase ${currentTask.phase} \u00B7 ${currentTask.phaseName}`
                : `Task ${currentTaskIndex + 1}`}
            </Text>
            <Text style={[styles.focusTaskName, { color: t.text }]}>
              {currentTask?.title || 'All done!'}
            </Text>
            {/* Zone */}
            {currentTask?.zone && (
              <Text style={[styles.focusDetailText, { color: t.textMuted }]}>
                {'\uD83D\uDCCD'} {currentTask.zone}
              </Text>
            )}
            {/* Target objects */}
            {currentTask?.targetObjects && currentTask.targetObjects.length > 0 && (
              <Text style={[styles.focusDetailText, { color: t.textMuted }]}>
                {'\uD83C\uDFAF'} {currentTask.targetObjects.slice(0, 3).join(' \u00B7 ')}
              </Text>
            )}
            {/* Destination */}
            {currentTask?.destination?.location && (
              <Text style={[styles.focusDetailText, { color: t.textMuted }]}>
                {'\u2192'} {currentTask.destination.location}
                {currentTask.destination.instructions ? ` \u00B7 ${currentTask.destination.instructions}` : ''}
              </Text>
            )}
            <View style={styles.focusTimeRow}>
              <Clock size={14} color={t.textMuted} />
              <Text style={[styles.focusTimeText, { color: t.textSecondary }]}>
                about {currentTask?.estimatedMinutes || 3} minutes
              </Text>
            </View>
          </Animated.View>

          {/* Subtask steps */}
          {currentTask?.subtasks && currentTask.subtasks.length > 0 && (
            <View style={[styles.focusSubtasksCard, {
              backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
            }]}>
              <Text style={[styles.focusSubtasksLabel, { color: t.textMuted }]}>STEPS:</Text>
              {currentTask.subtasks.map((st, idx) => (
                <View key={st.id || idx} style={styles.focusSubtaskRow}>
                  <View style={[styles.focusSubtaskCircle, {
                    borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)',
                  }]}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: t.textMuted }}>{idx + 1}</Text>
                  </View>
                  <Text style={{ fontSize: 13, color: t.textSecondary, flex: 1, fontFamily: BODY_FONT }}>
                    {st.title}
                    {st.estimatedSeconds ? ` (${st.estimatedSeconds}s)` : st.estimatedMinutes ? ` (${st.estimatedMinutes}m)` : ''}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Carry chain hint */}
          {carryChainHint && (
            <View style={[styles.carryChainBanner, {
              backgroundColor: isDark ? 'rgba(52,199,89,0.1)' : 'rgba(34,197,94,0.08)',
              borderColor: isDark ? 'rgba(52,199,89,0.2)' : 'rgba(34,197,94,0.15)',
            }]}>
              <Text style={{ fontSize: 12, color: V1.green, fontWeight: '600', fontFamily: BODY_FONT }}>
                {'\uD83D\uDCA1'} {carryChainHint}
              </Text>
            </View>
          )}

          {/* Dusty says bubble */}
          <View style={[styles.dustyBubble, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}>
            <Text style={styles.dustySays}>Dusty says:</Text>
            <Text style={[styles.dustyTip, { color: t.textSecondary }]}>
              {getDustyTip(currentTaskIndex, currentTask)}
            </Text>
          </View>
        </ScrollView>

        {/* Big check button */}
        <View style={styles.focusActions}>
          <Pressable
            onPress={handleCompleteTask}
            style={styles.bigCheckButton}
            accessibilityRole="button"
            accessibilityLabel={`Complete task: ${currentTask?.title || 'current task'}`}
          >
            <View style={styles.bigCheckCircle}>
              <Check size={32} color={V1.green} strokeWidth={3} />
            </View>
            <Text style={[styles.bigCheckText, { color: t.textSecondary }]}>Tap when done</Text>
          </Pressable>

          <Pressable
            onPress={handleSkipTask}
            accessibilityRole="button"
            accessibilityLabel="Skip this task"
          >
            <Text style={[styles.skipText, { color: t.textMuted }]}>Skip this task</Text>
          </Pressable>
        </View>

        {/* Encouragement */}
        <Text style={[styles.encouragement, { color: t.textMuted, paddingBottom: insets.bottom + 16 }]}>
          {getEncouragement(completedCount, totalTasks)}
        </Text>
      </View>
    );
  }

  // ── TIMER VIEW (0mb7F) ──────────────────────────────────────────────────
  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      {/* Mascot avatar */}
      {mascot && (
        <View style={{ position: 'absolute', top: insets.top + 8, right: 56, zIndex: 10 }}>
          <MascotAvatar size={40} mood={mascot.mood} />
        </View>
      )}

      {/* H6: Combo Badge */}
      {comboCount > 1 && (
        <Animated.View
          entering={reducedMotion ? undefined : FadeInDown.springify()}
          style={styles.comboBadge}
        >
          <Text style={styles.comboBadgeText}>
            {comboCount}x Combo! {'\uD83D\uDD25'}
          </Text>
        </Animated.View>
      )}

      {/* Phase transition celebration overlay */}
      {phaseTransition && (
        <Animated.View
          entering={reducedMotion ? undefined : FadeIn.duration(300)}
          exiting={reducedMotion ? undefined : FadeOut.duration(300)}
          style={styles.phaseTransitionBanner}
        >
          <Text style={styles.phaseTransitionText}>
            {phaseTransition.from} Complete! {'\u2728'} Moving to {phaseTransition.to}...
          </Text>
        </Animated.View>
      )}

      {/* Header */}
      <View style={[styles.timerHeader, { paddingTop: insets.top + 8 }]}>
        {roomPhotoUri ? (
          <Pressable
            onPress={() => setShowPhotoPreview(true)}
            accessibilityRole="button"
            accessibilityLabel="View room before photo"
            style={styles.photoThumb}
          >
            <Image source={{ uri: roomPhotoUri }} style={styles.photoThumbImage} contentFit="cover" />
          </Pressable>
        ) : (
          <View style={{ width: 40 }} />
        )}
        <View style={styles.timerHeaderCenter}>
          <Text style={styles.timerLabel}>{blitzMinutes}-Minute Blitz</Text>
          <Text style={[styles.timerRoomName, { color: t.text }]}>{activeRoom?.name || 'Room'} Refresh</Text>
        </View>
        <Pressable
          onPress={handleClose}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Close blitz session"
        >
          <X size={22} color={t.textMuted} />
        </Pressable>
      </View>

      {/* Audio error toast (blitz) */}
      {audioError && (
        <View style={{
          marginHorizontal: 20,
          marginBottom: 8,
          paddingVertical: 10,
          paddingHorizontal: 14,
          borderRadius: 12,
          backgroundColor: isDark ? 'rgba(255,183,77,0.12)' : 'rgba(255,183,77,0.1)',
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255,183,77,0.25)' : 'rgba(255,183,77,0.2)',
        }}>
          <Text style={{
            fontFamily: BODY_FONT, fontSize: 13, fontWeight: '500',
            color: isDark ? '#FFB74D' : '#E65100', textAlign: 'center',
          }}>
            {audioError}
          </Text>
        </View>
      )}

      {/* Ambient sound toggle (blitz) */}
      <View style={{ alignItems: 'flex-end', paddingHorizontal: 20, marginBottom: 8 }}>
        <Pressable
          onPress={handleCycleBlitzSound}
          style={{
            flexDirection: 'row', alignItems: 'center', gap: 6,
            paddingHorizontal: 14, paddingVertical: 8,
            borderRadius: 12, minHeight: 36,
            backgroundColor: ambientSound !== 'none'
              ? (isDark ? 'rgba(100,181,246,0.15)' : 'rgba(99,102,241,0.1)')
              : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'),
          }}
          accessibilityRole="button"
          accessibilityLabel={`Ambient sound: ${SOUND_INFO[ambientSound]?.label ?? 'Off'}`}
        >
          <Text style={{ fontSize: 16 }}>{SOUND_INFO[ambientSound]?.emoji ?? '\u{1F507}'}</Text>
          <Text style={{
            fontFamily: BODY_FONT, fontSize: 12, fontWeight: '500',
            color: ambientSound !== 'none' ? V1.blue : t.textSecondary,
          }}>
            {SOUND_INFO[ambientSound]?.label ?? 'Off'}
          </Text>
        </Pressable>
      </View>

      {/* Before photo expanded modal (timer view) */}
      {showPhotoPreview && roomPhotoUri && (
        <Modal transparent animationType="fade" visible={showPhotoPreview} onRequestClose={() => setShowPhotoPreview(false)}>
          <Pressable
            style={styles.photoModalOverlay}
            onPress={() => setShowPhotoPreview(false)}
          >
            <View style={styles.photoModalContent}>
              <Image source={{ uri: roomPhotoUri }} style={styles.photoModalImage} contentFit="contain" />
              <Text style={styles.photoModalLabel}>Before photo</Text>
            </View>
          </Pressable>
        </Modal>
      )}

      {/* Timer Ring */}
      <View style={styles.timerRingSection}>
        <View
          style={styles.timerRingWrapper}
          accessibilityLabel={`Timer progress: ${Math.round((1 - timerProgress) * 100)}% elapsed`}
        >
          <TimerRing
            progress={timerProgress}
            size={TIMER_SIZE}
            strokeWidth={TIMER_STROKE}
            isDark={isDark}
          />
          <View style={styles.timerCenter}>
            <Text style={[styles.timerTime, { color: t.text }]}>{formatTime(remainingSeconds)}</Text>
            <Text style={[styles.timerRemaining, { color: t.textMuted }]}>remaining</Text>
          </View>
        </View>
      </View>

      {/* Current task */}
      <View style={styles.taskSection}>
        <View style={[styles.currentTaskCard, { borderLeftColor: V1.coral, backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }]}>
          <View style={[styles.nowPill, { backgroundColor: V1.coral }]}>
            <Text style={styles.nowPillText}>NOW</Text>
          </View>
          <Text style={[styles.currentTaskName, { color: t.text }]}>
            {currentTask?.title || 'All tasks done!'}
          </Text>
          {/* Zone + destination compact line */}
          {(currentTask?.zone || currentTask?.destination?.location) && (
            <Text style={[styles.currentTaskMeta, { color: t.textMuted }]}>
              {currentTask.zone ? `\uD83D\uDCCD ${currentTask.zone}` : ''}
              {currentTask.zone && currentTask.destination?.location ? '  \u00B7  ' : ''}
              {currentTask.destination?.location ? `\u2192 ${currentTask.destination.location}` : ''}
            </Text>
          )}
          <Text style={[styles.currentTaskTime, { color: t.textMuted }]}>
            about {currentTask?.estimatedMinutes || 0} minutes
          </Text>
        </View>

        {/* Up next */}
        {currentTaskIndex < totalTasks - 1 && (
          <View style={[styles.nextTaskCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', borderLeftColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]}>
            <Text style={[styles.upNextLabel, { color: t.textMuted }]}>UP NEXT</Text>
            <Text style={[styles.nextTaskName, { color: t.textSecondary }]}>
              {tasks[currentTaskIndex + 1]?.title || ''}
            </Text>
          </View>
        )}
      </View>

      {/* Progress dots */}
      <View style={styles.progressSection}>
        <Text style={[styles.progressText, { color: t.textSecondary }]}>
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
                      : isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)',
                },
              ]}
            />
          ))}
        </View>
      </View>

      {/* Controls */}
      <View style={[styles.controls, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          onPress={handleToggleView}
          style={styles.controlButton}
          accessibilityRole="button"
          accessibilityLabel="Switch to focus view"
        >
          <Square size={22} color={t.textSecondary} />
        </Pressable>
        <Pressable
          onPress={handlePauseResume}
          style={[styles.controlButtonMain, { backgroundColor: V1.coral }]}
          accessibilityRole="button"
          accessibilityLabel={isRunning ? 'Pause timer' : 'Resume timer'}
        >
          {isRunning ? (
            <Pause size={28} color="#FFFFFF" fill="#FFFFFF" />
          ) : (
            <View style={styles.playIcon}>
              <Text style={styles.playIconText}>{'\u25B6'}</Text>
            </View>
          )}
        </Pressable>
        <Pressable
          onPress={handleCompleteTask}
          style={styles.controlButton}
          accessibilityRole="button"
          accessibilityLabel="Complete current task"
        >
          <SkipForward size={22} color={t.textSecondary} />
        </Pressable>
      </View>

      {/* Encouragement footer */}
      <Text style={[styles.footerEncouragement, { color: t.textMuted }]}>
        {isRunning ? currentEncouragingMessage : getEncouragement(completedCount, totalTasks)}
      </Text>

      {/* Extend Timer Prompt */}
      {showExtendPrompt && (
        <Animated.View
          entering={FadeInDown.duration(300)}
          style={{
            position: 'absolute',
            bottom: insets.bottom + 80,
            left: 20,
            right: 20,
            zIndex: 200,
            backgroundColor: isDark ? V1.dark.cardElevated : '#FFFFFF',
            borderRadius: 20,
            padding: 20,
            borderWidth: 1,
            borderColor: t.border,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.08,
            shadowRadius: 16,
            elevation: 4,
          }}
        >
          <Text style={{
            fontFamily: DISPLAY_FONT, fontSize: 18, fontWeight: '700',
            color: t.text, textAlign: 'center', marginBottom: 6,
          }}>
            Time's up! Keep going?
          </Text>
          <Text style={{
            fontFamily: BODY_FONT, fontSize: 14,
            color: t.textSecondary, textAlign: 'center', marginBottom: 16,
          }}>
            {tasks.filter(tk => !tk.completed).length} tasks remaining
          </Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Pressable
              onPress={() => {
                setShowExtendPrompt(false);
                timerSetSeconds(5 * 60);
                timerStart();
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              }}
              style={{
                flex: 1, backgroundColor: V1.coral,
                paddingVertical: 14, borderRadius: 14, alignItems: 'center',
              }}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 15, fontFamily: BODY_FONT }}>
                +5 min
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setShowExtendPrompt(false);
                timerSetSeconds(10 * 60);
                timerStart();
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              }}
              style={{
                flex: 1, backgroundColor: V1.amber,
                paddingVertical: 14, borderRadius: 14, alignItems: 'center',
              }}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 15, fontFamily: BODY_FONT }}>
                +10 min
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setShowExtendPrompt(false);
                hasEndedRef.current = true;
                handleSessionEnd();
              }}
              style={{
                flex: 1, borderWidth: 1, borderColor: t.border,
                paddingVertical: 14, borderRadius: 14, alignItems: 'center',
              }}
            >
              <Text style={{ color: t.textSecondary, fontWeight: '600', fontSize: 15, fontFamily: BODY_FONT }}>
                I'm done
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      )}

      {/* Skip Reason Bottom Sheet */}
      {showSkipReason && (
        <View style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          backgroundColor: isDark ? V1.dark.card : '#FFFFFF',
          borderTopLeftRadius: 20, borderTopRightRadius: 20,
          paddingBottom: insets.bottom + 16, paddingTop: 20, paddingHorizontal: 20,
          zIndex: 300,
        }}>
          <Text style={{
            fontFamily: DISPLAY_FONT, fontSize: 17, fontWeight: '700',
            color: t.text, marginBottom: 16,
          }}>
            Why skip this one?
          </Text>
          {SKIP_REASONS.map(reason => (
            <Pressable
              key={reason.id}
              onPress={() => handleSkipWithReason(reason.id)}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 12,
                paddingVertical: 14, borderBottomWidth: 1,
                borderBottomColor: t.border,
              }}
            >
              <Text style={{ fontFamily: BODY_FONT, fontSize: 15, color: t.text }}>
                {reason.label}
              </Text>
            </Pressable>
          ))}
          <Pressable
            onPress={() => {
              setShowSkipReason(false);
              setPendingSkipIndex(null);
            }}
            style={{ paddingVertical: 14, alignItems: 'center' }}
          >
            <Text style={{ fontFamily: BODY_FONT, fontSize: 14, color: t.textMuted }}>
              Never mind
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },

  // H6: Combo badge
  comboBadge: {
    position: 'absolute',
    top: 100,
    alignSelf: 'center',
    backgroundColor: V1.coral,
    borderRadius: 9999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    zIndex: 100,
  },
  comboBadgeText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
    fontFamily: DISPLAY_FONT,
  },

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
    fontFamily: BODY_FONT,
  },
  timerRoomName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    fontFamily: DISPLAY_FONT,
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
    fontFamily: DISPLAY_FONT,
  },
  timerRemaining: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
    marginTop: 2,
    fontFamily: BODY_FONT,
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
    fontFamily: BODY_FONT,
  },
  currentTaskName: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
    fontFamily: DISPLAY_FONT,
  },
  currentTaskTime: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
    fontFamily: BODY_FONT,
  },
  currentTaskMeta: {
    fontSize: 12,
    fontFamily: BODY_FONT,
    marginBottom: 2,
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
    fontFamily: BODY_FONT,
  },
  nextTaskName: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 15,
    fontFamily: BODY_FONT,
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
    fontFamily: BODY_FONT,
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
    fontFamily: DISPLAY_FONT,
  },
  footerEncouragement: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 13,
    textAlign: 'center',
    paddingBottom: 8,
    fontFamily: BODY_FONT,
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
    fontFamily: BODY_FONT,
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
    fontFamily: DISPLAY_FONT,
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    marginBottom: 16,
  },
  focusTaskLabel: {
    color: V1.coral,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: BODY_FONT,
  },
  focusTaskName: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 12,
    fontFamily: DISPLAY_FONT,
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
    fontFamily: BODY_FONT,
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
    fontFamily: BODY_FONT,
  },
  dustyTip: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    lineHeight: 20,
    fontFamily: BODY_FONT,
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
    fontFamily: BODY_FONT,
  },
  skipText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 14,
    fontFamily: BODY_FONT,
  },
  encouragement: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 13,
    textAlign: 'center',
    paddingTop: 12,
    fontFamily: BODY_FONT,
  },

  // ── Focus view enrichment ───────────────────────────────────────────
  focusDetailText: {
    fontSize: 13,
    fontFamily: BODY_FONT,
    textAlign: 'center',
    marginTop: 2,
  },
  focusSubtasksCard: {
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 14,
    gap: 8,
    marginBottom: 12,
  },
  focusSubtasksLabel: {
    fontFamily: BODY_FONT,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  focusSubtaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  focusSubtaskCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Carry chain hint ───────────────────────────────────────────────
  carryChainBanner: {
    marginHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    marginBottom: 8,
  },

  // ── Phase transition celebration ───────────────────────────────────
  phaseTransitionBanner: {
    position: 'absolute',
    top: 120,
    left: 20,
    right: 20,
    zIndex: 200,
    backgroundColor: V1.green,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: V1.green,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  phaseTransitionText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    fontFamily: DISPLAY_FONT,
    textAlign: 'center',
  },

  // ── Before photo thumbnail ─────────────────────────────────────────
  photoThumb: {
    width: 40,
    height: 40,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  photoThumbImage: {
    width: '100%',
    height: '100%',
  },
  photoModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoModalContent: {
    width: '85%',
    aspectRatio: 4 / 3,
    borderRadius: 16,
    overflow: 'hidden',
  },
  photoModalImage: {
    width: '100%',
    height: '100%',
  },
  photoModalLabel: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: BODY_FONT,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
});
