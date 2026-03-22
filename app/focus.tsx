/**
 * Declutterly — Focus Mode Screen (Apple 2026)
 * Pomodoro timer with glass card, animated ring, haptic milestones
 */

import { BODY_FONT, DISPLAY_FONT, RADIUS, V1, cardStyle, getTheme } from '@/constants/designTokens';
import { useDeclutter } from '@/context/DeclutterContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useSubscription } from '@/hooks/useSubscription';
import { useTimer } from '@/hooks/useTimer';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { playAmbientSound, stopAmbientSound, SOUND_INFO } from '@/services/audio';
import { STORAGE_KEYS } from '@/constants/storageKeys';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    AppState,
    AppStateStatus,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import Animated, {
    FadeInDown,
    useAnimatedProps,
    useAnimatedStyle,
    useDerivedValue,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { ScreenErrorBoundary } from '@/components/ErrorBoundary';

// ─────────────────────────────────────────────────────────────────────────────
// Timer Presets
// ─────────────────────────────────────────────────────────────────────────────
const PRESETS = [
  { label: '5 min',  seconds: 5 * 60,  emoji: '⚡', description: 'Quick win', hint: 'Perfect when starting feels hard' },
  { label: '15 min', seconds: 15 * 60, emoji: '🎯', description: 'Short focus', hint: 'Clear one small area or surface' },
  { label: '25 min', seconds: 25 * 60, emoji: '🍅', description: 'Pomodoro', hint: 'The classic. Work then 5-min break' },
  { label: '45 min', seconds: 45 * 60, emoji: '🔥', description: 'Deep work', hint: 'For when you are in the zone' },
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// Timer Ring
// ─────────────────────────────────────────────────────────────────────────────
interface TimerRingProps {
  progress: number; // 0-1
  size: number;
  strokeWidth: number;
  color: string;
  trackColor: string;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function TimerRing({ progress, size, strokeWidth, color, trackColor }: TimerRingProps) {
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
        stroke={trackColor}
        strokeWidth={strokeWidth}
        fill="none"
      />
      <AnimatedCircle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={circumference}
        animatedProps={animatedProps}
        strokeLinecap="round"
      />
    </Svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Format time
// ─────────────────────────────────────────────────────────────────────────────
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────
export default function FocusScreen() {
  return (
    <ScreenErrorBoundary screenName="focus">
      <FocusScreenContent />
    </ScreenErrorBoundary>
  );
}

function FocusScreenContent() {
  const rawScheme = useColorScheme();
  const isDark = rawScheme === 'dark';
  const t = getTheme(isDark);
  const reducedMotion = useReducedMotion();
  const insets = useSafeAreaInsets();
  const { activeRoomId, rooms, updateStats, stats } = useDeclutter();
  const activeRoom = activeRoomId ? rooms.find(r => r.id === activeRoomId) : null;
  const { isPro } = useSubscription();

  const [selectedPreset, setSelectedPreset] = useState(2); // Default: 25 min
  const [totalSeconds, setTotalSeconds] = useState(PRESETS[2].seconds);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [showBreakReminder, setShowBreakReminder] = useState(false);
  const breakReminderShownRef = useRef(false);

  const {
    remaining: remainingSeconds,
    isRunning,
    isComplete,
    progress,
    start: timerStart,
    pause: timerPause,
    toggle: timerToggle,
    reset: timerReset,
    setIsRunning,
  } = useTimer({
    initialSeconds: PRESETS[2].seconds,
    autoStart: false,
    pauseOnBackground: true,
    onComplete: () => {
      setSessionsCompleted(s => s + 1);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Award XP for focus session completion (2 XP per minute focused)
      const minutesFocused = Math.round(totalSeconds / 60);
      const xpEarned = minutesFocused * 2;
      if (xpEarned > 0) {
        const newXp = (stats?.xp ?? 0) + xpEarned;
        updateStats({
          xp: newXp,
          level: Math.floor(newXp / 100) + 1,
          totalMinutesCleaned: (stats?.totalMinutesCleaned ?? 0) + minutesFocused,
          lastActivityDate: new Date().toDateString(),
        });
      }
    },
    onTick: (remaining) => {
      // Halfway haptic
      if (remaining === Math.floor(totalSeconds / 2)) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      // Break reminder — only for timers >= 20 min
      if (remaining > 1) {
        const elapsed = totalSeconds - remaining;
        const breakInterval = Math.min(totalSeconds, 25 * 60);
        if (
          totalSeconds >= 20 * 60 &&
          elapsed === breakInterval &&
          !breakReminderShownRef.current
        ) {
          breakReminderShownRef.current = true;
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          setShowBreakReminder(true);
        }
      }
    },
  });

  const pulseScale = useSharedValue(1);

  // Ambient sound state
  const SOUND_TYPES = ['none', 'rain', 'ocean', 'forest', 'cafe'] as const;
  type SoundType = typeof SOUND_TYPES[number];
  const [ambientSound, setAmbientSound] = useState<SoundType>('none');
  const [audioError, setAudioError] = useState<string | null>(null);

  // Load saved ambient preference
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEYS.AMBIENT_SOUND).then(val => {
      if (val && SOUND_TYPES.includes(val as SoundType)) {
        setAmbientSound(val as SoundType);
      }
    });
  }, []);

  // Play/stop ambient sound when toggled or timer starts/stops
  useEffect(() => {
    if (isRunning && ambientSound !== 'none') {
      playAmbientSound(ambientSound).then(result => {
        if (!result.success) {
          setAudioError("Couldn't load sound. Continuing without audio.");
          setAmbientSound('none');
          AsyncStorage.setItem(STORAGE_KEYS.AMBIENT_SOUND, 'none');
          // Auto-dismiss after 3 seconds
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

  const handleCycleSound = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAudioError(null);
    setAmbientSound(prev => {
      const idx = SOUND_TYPES.indexOf(prev);
      const next = SOUND_TYPES[(idx + 1) % SOUND_TYPES.length];
      AsyncStorage.setItem(STORAGE_KEYS.AMBIENT_SOUND, next);
      return next;
    });
  }, []);

  const progressPercent = Math.round((1 - progress) * 100);

  // Task 5: Warm break reminder messages — dynamically use the preset duration
  const breakMinutes = Math.min(Math.round(totalSeconds / 60), 25);
  const BREAK_MESSAGES = [
    `You've been at it for ${breakMinutes} min \u2014 take a breather! You've earned it.`,
    `${breakMinutes} minutes of cleaning! Your space thanks you. Rest for a bit?`,
    `Wow, ${breakMinutes} minutes strong! Time for a quick stretch and a glass of water.`,
    `You've been awesome for ${breakMinutes} min! A short break will recharge you.`,
  ];
  const breakMessage = BREAK_MESSAGES[sessionsCompleted % BREAK_MESSAGES.length];

  // Pulse animation when running
  useEffect(() => {
    if (isRunning) {
      const pulse = () => {
        pulseScale.value = withTiming(1.02, { duration: 1000 }, () => {
          pulseScale.value = withTiming(1, { duration: 1000 });
        });
      };
      pulse();
      const id = setInterval(pulse, 2000);
      return () => clearInterval(id);
    } else {
      pulseScale.value = withTiming(1, { duration: 350 });
    }
  }, [isRunning]);

  // Timer tick, completion, and background handling are now managed by useTimer hook

  const handleSelectPreset = (index: number) => {
    if (isRunning) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedPreset(index);
    setTotalSeconds(PRESETS[index].seconds);
    timerReset(PRESETS[index].seconds);
    setShowBreakReminder(false);
    breakReminderShownRef.current = false;
  };

  const handleStartPause = () => {
    if (isComplete) {
      // Reset for another session — clear the break-reminder guard too
      timerReset(totalSeconds);
      timerStart();
      breakReminderShownRef.current = false;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    timerToggle();
  };

  const handleReset = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    timerReset(totalSeconds);
    breakReminderShownRef.current = false;
  };

  const handleEndSession = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    timerPause();
    router.back();
  }, [timerPause]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  // Ring color based on progress
  const ringColor = isComplete ? V1.green
    : progress < 0.25 ? V1.coral
    : progress < 0.5 ? V1.amber
    : V1.blue;

  const RING_SIZE = 260;
  const RING_STROKE = 14;

  // Pro gate -- focus timer is Pro-only
  if (!isPro) {
    return (
      <LinearGradient
        colors={isDark ? ['#0A0A0A', '#131313', '#141414'] : ['#FAFAFA', '#F7F7F7', '#F5F5F5']}
        style={styles.container}
      >
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }}
            style={[styles.closeButton, {
              backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
            }]}
            accessibilityRole="button"
            accessibilityLabel="Close focus mode"
          >
            <Text style={[styles.closeIcon, { color: t.text }]}>✕</Text>
          </Pressable>
          <Text style={[{ fontFamily: DISPLAY_FONT, fontSize: 17, fontWeight: '600', lineHeight: 22 }, { color: t.text }]}>Focus Mode</Text>
          <View style={styles.sessionsBadge} />
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>🍅</Text>
          <Text style={[{ fontFamily: DISPLAY_FONT, fontSize: 22, fontWeight: '700', letterSpacing: -0.4, lineHeight: 28 }, { color: t.text, textAlign: 'center', marginBottom: 8 }]}>
            Focus Mode is a Pro feature
          </Text>
          <Text style={[{ fontFamily: BODY_FONT, fontSize: 15, fontWeight: '400', lineHeight: 20 }, { color: t.textSecondary, textAlign: 'center', marginBottom: 24 }]}>
            Stay on track with guided Pomodoro timers, haptic milestones, and session tracking. Upgrade to unlock.
          </Text>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push('/paywall');
            }}
            accessibilityRole="button"
            accessibilityLabel="Upgrade to Pro"
          >
            <LinearGradient
              colors={isDark ? ['#C4A87A', '#8A7A60'] : ['#1A1A1A', '#333333']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                paddingVertical: 16,
                paddingHorizontal: 32,
                borderRadius: 28,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontFamily: BODY_FONT, color: isDark ? '#0A0A0A' : '#FFFFFF', fontSize: 16, fontWeight: '700' }}>
                Upgrade to Pro
              </Text>
            </LinearGradient>
          </Pressable>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={isDark ? ['#0A0A0A', '#131313', '#141414'] : ['#FAFAFA', '#F7F7F7', '#F5F5F5']}
      style={styles.container}
    >

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }}
          style={[styles.closeButton, {
            backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
          }]}
          accessibilityRole="button"
          accessibilityLabel="Close focus mode"
        >
          <Text style={[styles.closeIcon, { color: t.text }]}>✕</Text>
        </Pressable>
        <Text style={[{ fontFamily: DISPLAY_FONT, fontSize: 17, fontWeight: '600', lineHeight: 22 }, { color: t.text }]}>Focus Mode</Text>
        <View style={styles.sessionsBadge}>
          {sessionsCompleted > 0 && (
            <View style={[styles.sessionsCount, { backgroundColor: isDark ? 'rgba(100,181,246,0.15)' : 'rgba(99,102,241,0.1)' }]}>
              <Text style={[{ fontFamily: BODY_FONT, fontSize: 12, fontWeight: '500', lineHeight: 16 }, { color: V1.blue }]}>
                🍅 {sessionsCompleted}
              </Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { flexGrow: 1, paddingBottom: insets.bottom + 16 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Audio Error Toast ──────────────────────────────────── */}
        {audioError && (
          <View style={{
            width: '100%',
            marginBottom: 8,
            paddingVertical: 10,
            paddingHorizontal: 14,
            borderRadius: RADIUS.md,
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

        {/* ── Ambient Sound Toggle ────────────────────────────────── */}
        <Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(0).duration(300)} style={styles.ambientSoundRow}>
          <Pressable
            onPress={handleCycleSound}
            style={[styles.ambientSoundButton, {
              backgroundColor: ambientSound !== 'none'
                ? (isDark ? 'rgba(100,181,246,0.15)' : 'rgba(99,102,241,0.1)')
                : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'),
            }]}
            accessibilityRole="button"
            accessibilityLabel={`Ambient sound: ${SOUND_INFO[ambientSound]?.label ?? 'Off'}. Tap to change.`}
          >
            <Text style={{ fontSize: 16 }}>{SOUND_INFO[ambientSound]?.emoji ?? '\u{1F507}'}</Text>
            <Text style={[{
              fontFamily: BODY_FONT, fontSize: 12, fontWeight: '500',
              color: ambientSound !== 'none' ? V1.blue : t.textSecondary,
            }]}>
              {SOUND_INFO[ambientSound]?.label ?? 'Off'}
            </Text>
          </Pressable>
        </Animated.View>

        {/* ── Timer Ring ───────────────────────────────────────────── */}
        <Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(0).duration(350)} style={styles.timerSection}>
          <Animated.View
            style={[styles.ringWrapper, pulseStyle]}
            accessibilityLabel={`Timer progress: ${progressPercent}% complete`}
          >
            <TimerRing
              progress={progress}
              size={RING_SIZE}
              strokeWidth={RING_STROKE}
              color={ringColor}
              trackColor={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}
            />

            {/* Center content */}
            <View style={styles.ringCenter}>
              {isComplete ? (
                <>
                  <Text style={styles.completeEmoji}>🎉</Text>
                  <Text style={[{ fontFamily: DISPLAY_FONT, fontSize: 22, fontWeight: '700', letterSpacing: -0.4, lineHeight: 28 }, { color: V1.green, marginTop: 8 }]}>
                    You did it!
                  </Text>
                  <Text style={[{ fontFamily: BODY_FONT, fontSize: 15, fontWeight: '400', lineHeight: 20 }, { color: t.textSecondary, marginTop: 4 }]}>
                    +{Math.round(totalSeconds / 60 * 2)} XP earned
                  </Text>
                </>
              ) : (
                <>
                  <Text style={[styles.timerText, { color: t.text }]}>
                    {formatTime(remainingSeconds)}
                  </Text>
                  <Text style={[{ fontFamily: BODY_FONT, fontSize: 15, fontWeight: '400', lineHeight: 20 }, { color: t.textSecondary, marginTop: 4 }]}>
                    {isRunning ? PRESETS[selectedPreset].description : 'Tap Start when ready'}
                  </Text>
                </>
              )}
            </View>
          </Animated.View>
        </Animated.View>

        {/* ── Break Reminder (Task 5) ────────────────────────────────── */}
        {showBreakReminder && (
          <Animated.View entering={reducedMotion ? undefined : FadeInDown.duration(300)} style={styles.breakReminderSection}>
            <View style={[styles.breakReminderCard, {
              backgroundColor: isDark ? 'rgba(102,187,106,0.1)' : 'rgba(102,187,106,0.08)',
              borderColor: isDark ? 'rgba(102,187,106,0.25)' : 'rgba(102,187,106,0.2)',
            }]}>
              <Text style={styles.breakReminderEmoji}>{'\uD83C\uDF3F'}</Text>
              <Text style={[styles.breakReminderText, { color: isDark ? '#66BB6A' : '#388E3C' }]}>
                {breakMessage}
              </Text>
              <Pressable
                onPress={() => setShowBreakReminder(false)}
                style={styles.breakReminderDismiss}
                accessibilityRole="button"
                accessibilityLabel="Dismiss break reminder"
              >
                <Text style={[styles.breakReminderDismissText, { color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)' }]}>
                  {'\u2715'}
                </Text>
              </Pressable>
            </View>
          </Animated.View>
        )}

        {/* ── Preset Selector ──────────────────────────────────────── */}
        <Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(80).duration(350)} style={styles.presetsSection}>
          <View style={styles.presetsRow}>
            {PRESETS.map((preset, index) => {
              const isSelected = selectedPreset === index;
              return (
                <Pressable
                  key={preset.label}
                  onPress={() => handleSelectPreset(index)}
                  disabled={isRunning}
                  accessibilityRole="button"
                  accessibilityLabel={`${preset.label} ${preset.description}`}
                  accessibilityState={{ selected: isSelected }}
                >
                  <View style={[styles.presetChip, {
                    backgroundColor: isSelected
                      ? V1.coral
                      : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'),
                    opacity: isRunning && !isSelected ? 0.4 : 1,
                  }]}>
                    <Text style={styles.presetEmoji}>{preset.emoji}</Text>
                    <Text style={[styles.presetLabel, {
                      color: isSelected ? '#FFFFFF' : t.text,
                    }]}>
                      {preset.label}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>

        {/* ── Controls ─────────────────────────────────────────────── */}
        <Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(120).duration(350)} style={styles.controlsSection}>
          {/* Main button */}
          <Pressable
            onPress={handleStartPause}
            accessibilityRole="button"
            accessibilityLabel={isComplete ? 'Start again' : isRunning ? 'Pause' : 'Start'}
          >
            <LinearGradient
              colors={isComplete
                ? ['#30D158', '#25A244']
                : isRunning
                ? ['#FF453A', '#D93025']
                : ['#007AFF', '#5856D6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.mainButton}
            >
              <Text style={styles.mainButtonIcon}>
                {isComplete ? '🔄' : isRunning ? '⏸' : '▶'}
              </Text>
              <Text style={{ fontFamily: BODY_FONT, fontSize: 17, fontWeight: '600', lineHeight: 22, color: '#FFFFFF' }}>
                {isComplete ? 'Start Again' : isRunning ? 'Pause' : 'Start Focus'}
              </Text>
            </LinearGradient>
          </Pressable>

          {/* Reset button */}
          {(isRunning || remainingSeconds !== totalSeconds) && !isComplete && (
            <Pressable
              onPress={handleReset}
              style={[styles.resetButton, {
                backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
              }]}
              accessibilityRole="button"
              accessibilityLabel="Reset timer"
            >
              <Text style={{ fontFamily: BODY_FONT, fontSize: 15, fontWeight: '500', lineHeight: 20, color: t.textSecondary }}>
                Reset
              </Text>
            </Pressable>
          )}

          {/* End Session button — distinct, destructive-tinted */}
          <Pressable
            onPress={handleEndSession}
            style={[styles.endSessionButton, {
              backgroundColor: isDark ? 'rgba(255,69,58,0.12)' : 'rgba(255,69,58,0.08)',
              borderColor: isDark ? 'rgba(255,69,58,0.25)' : 'rgba(255,69,58,0.18)',
            }]}
            accessibilityRole="button"
            accessibilityLabel="End session"
            accessibilityHint="Stop the timer and go back"
          >
            <Text style={{ fontFamily: BODY_FONT, fontSize: 15, fontWeight: '500', lineHeight: 20, color: '#FF453A' }}>
              End Session
            </Text>
          </Pressable>
        </Animated.View>

        {/* ── Session Context with Task Integration ───────────────── */}
        {activeRoom && (
          <Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(140).duration(350)} style={styles.sessionContextSection}>
            <View style={[cardStyle(isDark), styles.sessionContextCard]}>
              <Text style={{ fontFamily: BODY_FONT, fontSize: 12, fontWeight: '500', lineHeight: 16, color: t.textSecondary, marginBottom: 6 }}>
                {'\uD83E\uDDF9'} CLEANING
              </Text>
              <View style={styles.sessionRoomRow}>
                <Text style={styles.sessionRoomEmoji}>{activeRoom.emoji}</Text>
                <View style={styles.sessionRoomInfo}>
                  <Text style={{ fontFamily: BODY_FONT, fontSize: 15, fontWeight: '500', lineHeight: 20, color: t.text }}>
                    {activeRoom.name}
                  </Text>
                  {activeRoom.tasks && activeRoom.tasks.length > 0 && (
                    <Text style={{ fontFamily: BODY_FONT, fontSize: 12, fontWeight: '400', lineHeight: 16, color: t.textSecondary }}>
                      {activeRoom.tasks.filter(tk => !tk.completed).length} tasks remaining
                    </Text>
                  )}
                </View>
              </View>
              {/* Next task during focus */}
              {activeRoom.tasks && (() => {
                const nextTask = activeRoom.tasks.find(tk => !tk.completed);
                if (!nextTask) return null;
                return (
                  <View style={{ marginTop: 8 }}>
                    <View style={{
                      flexDirection: 'row', alignItems: 'center', gap: 10,
                      paddingVertical: 10, paddingHorizontal: 12,
                      borderRadius: 10,
                      backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                    }}>
                      <View style={{
                        width: 24, height: 24, borderRadius: 12,
                        borderWidth: 2, borderColor: V1.green,
                        alignItems: 'center', justifyContent: 'center',
                      }} />
                      <Text style={{
                        fontFamily: BODY_FONT, fontSize: 14, color: t.text, flex: 1,
                      }} numberOfLines={1}>
                        {nextTask.title}
                      </Text>
                      <Text style={{
                        fontFamily: BODY_FONT, fontSize: 12, color: t.textMuted,
                      }}>
                        {nextTask.estimatedMinutes || 3}m
                      </Text>
                    </View>
                  </View>
                );
              })()}
            </View>
          </Animated.View>
        )}

        {/* Body doubling cue */}
        {isRunning && (
          <Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(180).duration(350)} style={{ width: '100%', marginBottom: 12 }}>
            <View style={[cardStyle(isDark), { padding: 14 }]}>
              <Text style={{ fontFamily: BODY_FONT, fontSize: 12, fontWeight: '500', lineHeight: 16, color: t.textSecondary, marginBottom: 4 }}>
                {'\uD83E\uDDF9'} BODY DOUBLING
              </Text>
              <Text style={{ fontFamily: BODY_FONT, fontSize: 14, lineHeight: 20, color: t.text }}>
                Dusty is cleaning alongside you. You're not alone in this!
              </Text>
            </View>
          </Animated.View>
        )}

        {/* ── Tips ─────────────────────────────────────────────────── */}
        <Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(160).duration(350)} style={styles.tipsSection}>
          <View style={[cardStyle(isDark), styles.tipCard]}>
            <Text style={{ fontFamily: BODY_FONT, fontSize: 12, fontWeight: '500', lineHeight: 16, color: t.textSecondary, marginBottom: 6 }}>
              💡 FOCUS TIP
            </Text>
            <Text style={{ fontFamily: BODY_FONT, fontSize: 15, fontWeight: '400', lineHeight: 20, color: t.text }}>
              {PRESETS[selectedPreset].hint}
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </LinearGradient>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: { fontSize: 14, fontWeight: '600' },
  sessionsBadge: { minWidth: 36, alignItems: 'flex-end' },
  sessionsCount: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },

  scrollContent: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },

  // Ambient Sound
  ambientSoundRow: {
    width: '100%',
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  ambientSoundButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    minHeight: 36,
  },

  // Timer
  timerSection: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 32,
  },
  ringWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerText: {
    fontSize: 56,
    fontWeight: '100',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.8,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
  },
  completeEmoji: { fontSize: 48 },

  // Break Reminder (Task 5)
  breakReminderSection: {
    width: '100%',
    marginBottom: 16,
  },
  breakReminderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  breakReminderEmoji: {
    fontSize: 18,
  },
  breakReminderText: {
    fontFamily: BODY_FONT,
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
    lineHeight: 18,
  },
  breakReminderDismiss: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  breakReminderDismissText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Presets
  presetsSection: {
    width: '100%',
    marginBottom: 32,
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
  },
  presetChip: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    gap: 4,
    minWidth: 72,
    minHeight: 44,
    justifyContent: 'center',
  },
  presetEmoji: { fontSize: 18 },
  presetLabel: {
    fontFamily: BODY_FONT,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },

  // Controls
  controlsSection: {
    width: '100%',
    gap: 12,
    marginBottom: 20,
  },
  mainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 18,
    borderRadius: RADIUS.lg,
    minHeight: 60,
  },
  mainButtonIcon: { fontSize: 20 },
  resetButton: {
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    minHeight: 44,
    justifyContent: 'center',
  },
  endSessionButton: {
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    minHeight: 44,
    justifyContent: 'center',
    borderWidth: 1,
    marginTop: 4,
  },

  // Session context
  sessionContextSection: {
    width: '100%',
    marginBottom: 20,
  },
  sessionContextCard: { padding: 16 },
  sessionRoomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sessionRoomEmoji: {
    fontSize: 28,
  },
  sessionRoomInfo: {
    flex: 1,
    gap: 2,
  },

  // Tips
  tipsSection: { width: '100%', marginBottom: 20 },
  tipCard: { padding: 16 },
});
