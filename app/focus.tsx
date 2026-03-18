/**
 * Declutterly — Focus Mode Screen (Apple 2026)
 * Pomodoro timer with glass card, animated ring, haptic milestones
 */

import { Colors } from '@/constants/Colors';
import { GlassCard } from '@/components/ui/GlassCard';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Typography } from '@/theme/typography';
import { Spacing, BorderRadius } from '@/theme/spacing';
import { useDeclutter } from '@/context/DeclutterContext';
import { useSubscription } from '@/hooks/useSubscription';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

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

function TimerRing({ progress, size, strokeWidth, color, trackColor }: TimerRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - Math.max(0, Math.min(1, progress)));

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
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
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
  const rawScheme = useColorScheme();
  const colorScheme = rawScheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  const { activeRoomId, rooms } = useDeclutter();
  const activeRoom = activeRoomId ? rooms.find(r => r.id === activeRoomId) : null;
  const { isPro } = useSubscription();

  const [selectedPreset, setSelectedPreset] = useState(2); // Default: 25 min
  const [totalSeconds, setTotalSeconds] = useState(PRESETS[2].seconds);
  const [remainingSeconds, setRemainingSeconds] = useState(PRESETS[2].seconds);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseScale = useSharedValue(1);

  const progress = totalSeconds > 0 ? remainingSeconds / totalSeconds : 0;

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

  // Timer tick
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setRemainingSeconds(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            setIsRunning(false);
            setIsComplete(true);
            setSessionsCompleted(s => s + 1);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            return 0;
          }
          // Haptic at halfway
          if (prev === Math.floor(totalSeconds / 2)) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, totalSeconds]);

  const handleSelectPreset = (index: number) => {
    if (isRunning) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedPreset(index);
    setTotalSeconds(PRESETS[index].seconds);
    setRemainingSeconds(PRESETS[index].seconds);
    setIsComplete(false);
  };

  const handleStartPause = () => {
    if (isComplete) {
      // Reset
      setRemainingSeconds(totalSeconds);
      setIsComplete(false);
      setIsRunning(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsRunning(v => !v);
  };

  const handleReset = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsRunning(false);
    setIsComplete(false);
    setRemainingSeconds(totalSeconds);
  };

  const handleEndSession = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsRunning(false);
    router.back();
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  // Ring color based on progress
  const ringColor = isComplete ? colors.success
    : progress < 0.25 ? colors.error
    : progress < 0.5 ? colors.warning
    : colors.accent;

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
              backgroundColor: isDark ? colors.fillTertiary : colors.surfaceTertiary,
            }]}
            accessibilityRole="button"
            accessibilityLabel="Close focus mode"
          >
            <Text style={[styles.closeIcon, { color: colors.text }]}>✕</Text>
          </Pressable>
          <Text style={[Typography.navTitle, { color: colors.text }]}>Focus Mode</Text>
          <View style={styles.sessionsBadge} />
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>🍅</Text>
          <Text style={[Typography.title2, { color: colors.text, textAlign: 'center', marginBottom: 8 }]}>
            Focus Mode is a Pro feature
          </Text>
          <Text style={[Typography.subheadline, { color: colors.textSecondary, textAlign: 'center', marginBottom: 24, lineHeight: 20 }]}>
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
              <Text style={{ color: isDark ? '#0A0A0A' : '#FFFFFF', fontSize: 16, fontWeight: '700' }}>
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
            backgroundColor: isDark ? colors.fillTertiary : colors.surfaceTertiary,
          }]}
          accessibilityRole="button"
          accessibilityLabel="Close focus mode"
        >
          <Text style={[styles.closeIcon, { color: colors.text }]}>✕</Text>
        </Pressable>
        <Text style={[Typography.navTitle, { color: colors.text }]}>Focus Mode</Text>
        <View style={styles.sessionsBadge}>
          {sessionsCompleted > 0 && (
            <View style={[styles.sessionsCount, { backgroundColor: colors.accentMuted }]}>
              <Text style={[Typography.caption1Medium, { color: colors.accent }]}>
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
        {/* ── Timer Ring ───────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(0).duration(350)} style={styles.timerSection}>
          <Animated.View style={[styles.ringWrapper, pulseStyle]}>
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
                  <Text style={[Typography.title2, { color: colors.success, marginTop: 8 }]}>
                    You did it!
                  </Text>
                  <Text style={[Typography.subheadline, { color: colors.textSecondary, marginTop: 4 }]}>
                    +{Math.round(totalSeconds / 60 * 2)} XP earned
                  </Text>
                </>
              ) : (
                <>
                  <Text style={[styles.timerText, { color: colors.text }]}>
                    {formatTime(remainingSeconds)}
                  </Text>
                  <Text style={[Typography.subheadline, { color: colors.textSecondary, marginTop: 4 }]}>
                    {isRunning ? PRESETS[selectedPreset].description : 'Tap Start when ready'}
                  </Text>
                </>
              )}
            </View>
          </Animated.View>
        </Animated.View>

        {/* ── Preset Selector ──────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(80).duration(350)} style={styles.presetsSection}>
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
                      ? colors.accent
                      : (isDark ? colors.fillTertiary : colors.surfaceTertiary),
                    opacity: isRunning && !isSelected ? 0.4 : 1,
                  }]}>
                    <Text style={styles.presetEmoji}>{preset.emoji}</Text>
                    <Text style={[styles.presetLabel, {
                      color: isSelected ? '#FFFFFF' : colors.text,
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
        <Animated.View entering={FadeInDown.delay(120).duration(350)} style={styles.controlsSection}>
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
              <Text style={[Typography.headline, { color: '#FFFFFF' }]}>
                {isComplete ? 'Start Again' : isRunning ? 'Pause' : 'Start Focus'}
              </Text>
            </LinearGradient>
          </Pressable>

          {/* Reset button */}
          {(isRunning || remainingSeconds !== totalSeconds) && !isComplete && (
            <Pressable
              onPress={handleReset}
              style={[styles.resetButton, {
                backgroundColor: isDark ? colors.fillTertiary : colors.surfaceTertiary,
              }]}
              accessibilityRole="button"
              accessibilityLabel="Reset timer"
            >
              <Text style={[Typography.subheadlineMedium, { color: colors.textSecondary }]}>
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
            <Text style={[Typography.subheadlineMedium, { color: '#FF453A' }]}>
              End Session
            </Text>
          </Pressable>
        </Animated.View>

        {/* ── Session Context ───────────────────────────────────────── */}
        {activeRoom && (
          <Animated.View entering={FadeInDown.delay(140).duration(350)} style={styles.sessionContextSection}>
            <GlassCard variant="subtle" style={styles.sessionContextCard}>
              <Text style={[Typography.caption1Medium, { color: colors.textSecondary, marginBottom: 6 }]}>
                🧹 CLEANING
              </Text>
              <View style={styles.sessionRoomRow}>
                <Text style={styles.sessionRoomEmoji}>{activeRoom.emoji}</Text>
                <View style={styles.sessionRoomInfo}>
                  <Text style={[Typography.subheadlineMedium, { color: colors.text }]}>
                    {activeRoom.name}
                  </Text>
                  {activeRoom.tasks && activeRoom.tasks.length > 0 && (
                    <Text style={[Typography.caption1, { color: colors.textSecondary }]}>
                      {activeRoom.tasks.filter(t => !t.completed).length} tasks remaining
                    </Text>
                  )}
                </View>
              </View>
            </GlassCard>
          </Animated.View>
        )}

        {/* ── Tips ─────────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(160).duration(350)} style={styles.tipsSection}>
          <GlassCard variant="subtle" style={styles.tipCard}>
            <Text style={[Typography.caption1Medium, { color: colors.textSecondary, marginBottom: 6 }]}>
              💡 FOCUS TIP
            </Text>
            <Text style={[Typography.subheadline, { color: colors.text }]}>
              {PRESETS[selectedPreset].hint}
            </Text>
          </GlassCard>
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
    ...Typography.monoHero,
    fontSize: 56,
  },
  completeEmoji: { fontSize: 48 },

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
    paddingVertical: Spacing.sm,
    paddingHorizontal: 14,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    gap: Spacing.xxs,
    minWidth: 72,
    minHeight: 44,
    justifyContent: 'center',
  },
  presetEmoji: { fontSize: 18 },
  presetLabel: {
    ...Typography.caption1Medium,
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
    gap: Spacing.sm,
    paddingVertical: 18,
    borderRadius: BorderRadius.card,
    minHeight: 60,
  },
  mainButtonIcon: { fontSize: 20 },
  resetButton: {
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: BorderRadius.lg,
    minHeight: 44,
    justifyContent: 'center',
  },
  endSessionButton: {
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: BorderRadius.lg,
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
