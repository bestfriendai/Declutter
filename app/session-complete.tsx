/**
 * Declutterly -- Session Complete Screen (V1)
 * Matches Pencil design: bcHfn
 *
 * Improvements:
 * - Counting animation for stats (tasks, time, XP)
 * - Light confetti for sessions > 3 tasks
 * - Streak callout
 * - "Continue Cleaning?" CTA with task count
 */

import { MascotAvatar } from '@/components/ui';
import { useDeclutter } from '@/context/DeclutterContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { V1, BODY_FONT, DISPLAY_FONT, RADIUS } from '@/constants/designTokens';
import { ScreenErrorBoundary } from '@/components/ErrorBoundary';
import {
  scheduleSessionEndCelebration,
  scheduleShameFreeReminder,
  checkNotificationPermissions,
} from '@/services/notifications';

// ─── Count-Up Stat ────────────────────────────────────────────────────────────
function CountUpStat({
  value,
  label,
  color,
  suffix,
  prefix,
  duration = 800,
}: {
  value: number;
  label: string;
  color: string;
  suffix?: string;
  prefix?: string;
  duration?: number;
}) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (value === 0) {
      setDisplayValue(0);
      return;
    }
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setDisplayValue(Math.round(eased * value));
      if (progress >= 1) clearInterval(interval);
    }, 16);
    return () => clearInterval(interval);
  }, [value, duration]);

  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text style={[styles.statValue, { color }]}>
        {prefix}{displayValue}{suffix}
      </Text>
      <Text style={[styles.statLabel, { color: 'rgba(255,255,255,0.5)' }]}>
        {label}
      </Text>
    </View>
  );
}

// ─── Light Confetti ───────────────────────────────────────────────────────────
const CONFETTI_COLORS = [V1.coral, V1.green, V1.amber, V1.gold, '#64B5F6', '#E040FB'];
const CONFETTI_SHAPES = ['square', 'circle', 'strip'] as const;

function ConfettiPiece({ color, delay, x, shape, size }: {
  color: string; delay: number; x: number;
  shape: typeof CONFETTI_SHAPES[number]; size: number;
}) {
  const translateY = useSharedValue(-30);
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    translateX.value = withRepeat(
      withSequence(
        withTiming(Math.random() * 40 - 20, { duration: 800 }),
        withTiming(Math.random() * 40 - 20, { duration: 800 }),
      ),
      3,
    );
    translateY.value = withRepeat(
      withSequence(
        withTiming(500, { duration: 2500 + delay * 400, easing: Easing.in(Easing.quad) }),
        withTiming(-30, { duration: 0 }),
      ),
      2,
    );
    rotate.value = withRepeat(
      withTiming(360 * (Math.random() > 0.5 ? 1 : -1), { duration: 1200 + delay * 200 }),
      4,
    );
    opacity.value = withDelay(4000, withTiming(0, { duration: 800 }));
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  const shapeStyle = shape === 'circle'
    ? { width: size, height: size, borderRadius: size / 2 }
    : shape === 'strip'
      ? { width: size * 0.4, height: size * 1.5, borderRadius: 2 }
      : { width: size, height: size, borderRadius: 2 };

  return (
    <Animated.View
      style={[{
        position: 'absolute', top: -10, left: x,
        backgroundColor: color, ...shapeStyle,
      }, style]}
    />
  );
}

export default function SessionCompleteScreen() {
  return (
    <ScreenErrorBoundary screenName="session-complete">
      <SessionCompleteScreenContent />
    </ScreenErrorBoundary>
  );
}

function SessionCompleteScreenContent() {
  const { tasksCompleted, timeSpent, xpEarned, roomId, roomName } = useLocalSearchParams<{
    tasksCompleted: string;
    timeSpent: string;
    xpEarned: string;
    roomId: string;
    roomName: string;
  }>();

  const rawScheme = useColorScheme();
  const isDark = rawScheme === 'dark';
  const reducedMotion = useReducedMotion();
  const t = isDark ? V1.dark : V1.light;
  const insets = useSafeAreaInsets();
  const { rooms: rawRooms, stats } = useDeclutter();
  const rooms = rawRooms ?? [];

  const tasks = Math.max(0, parseInt(String(tasksCompleted), 10) || 0);
  const time = Math.max(0, parseInt(String(timeSpent), 10) || 0);
  const xp = Math.max(0, parseInt(String(xpEarned), 10) || 0);
  const allZero = tasks === 0 && time === 0 && xp === 0;

  // Fire success haptic when screen appears
  useEffect(() => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  // Schedule celebration notification & refresh daily reminder
  useEffect(() => {
    (async () => {
      try {
        const hasPermission = await checkNotificationPermissions();
        if (!hasPermission) return;
        if (tasks > 0) {
          await scheduleSessionEndCelebration(tasks, xp);
        }
        await scheduleShameFreeReminder(9, 0);
      } catch (err) {
        if (__DEV__) console.info('Error scheduling post-session notifications:', err);
      }
    })();
  }, [tasks, xp]);

  const room = rooms.find(r => r.id === roomId);
  const totalRoomTasks = room?.tasks?.length || 0;
  const completedRoomTasks = room?.tasks?.filter(task => task.completed).length || 0;
  const roomProgress = totalRoomTasks > 0 ? (completedRoomTasks / totalRoomTasks) * 100 : 0;
  const remainingTasks = totalRoomTasks - completedRoomTasks;
  const roomIsComplete = roomProgress >= 100;

  // Streak info
  const currentStreak = stats?.currentStreak ?? 0;

  // If room is 100% complete, redirect to room-complete instead
  useEffect(() => {
    if (roomProgress >= 100 && room) {
      router.replace({
        pathname: '/room-complete',
        params: {
          roomId: room.id,
          roomName: room.name || roomName || 'Room',
          tasksCompleted: String(totalRoomTasks),
          timeSpent: String(time),
        },
      });
    }
  }, [roomProgress, room, totalRoomTasks, time, roomName]);

  // Confetti pieces (only for sessions with > 2 tasks)
  const confettiPieces = useMemo(() => {
    if (tasks <= 2 || reducedMotion) return [];
    return Array.from({ length: 20 }).map((_, i) => ({
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      delay: Math.random() * 3,
      x: Math.random() * 340 + 10,
      shape: CONFETTI_SHAPES[i % CONFETTI_SHAPES.length],
      size: 5 + Math.random() * 5,
    }));
  }, [tasks, reducedMotion]);

  const handleContinue = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (roomId) {
      router.replace({ pathname: '/room/[id]', params: { id: roomId } });
    } else {
      router.replace('/');
    }
  }, [roomId]);

  const handleDone = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace('/');
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      {/* Light confetti for productive sessions */}
      {confettiPieces.length > 0 && (
        <View style={styles.confettiContainer}>
          {confettiPieces.map((piece, i) => (
            <ConfettiPiece key={i} {...piece} />
          ))}
        </View>
      )}

      <View style={[styles.content, { paddingTop: insets.top + 60 }]}>
        {/* Mascot */}
        <Animated.View entering={reducedMotion ? undefined : ZoomIn.duration(500)} style={styles.mascotContainer}>
          <MascotAvatar imageKey="celebrating" size={130} showBackground={false} />
        </Animated.View>

        {/* Title */}
        <Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(200).duration(400)}>
          <Text style={[styles.title, { color: t.text }]}>Session Done!</Text>
          <Text style={[styles.subtitle, { color: V1.green }]}>
            {allZero
              ? 'Session recorded'
              : time > 0
                ? `You crushed your ${time}-minute session`
                : 'You crushed it'}
          </Text>
        </Animated.View>

        {/* Stats row with count-up animation */}
        <Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(300).duration(400)}>
          <View style={[styles.statsCard, { backgroundColor: t.card, borderColor: t.border }]}>
            <CountUpStat value={tasks} label="Tasks" color={V1.coral} />
            <View style={[styles.statDivider, { backgroundColor: t.border }]} />
            <CountUpStat value={time} label="Time" color={t.text} suffix="m" />
            <View style={[styles.statDivider, { backgroundColor: t.border }]} />
            <CountUpStat value={xp} label="XP" color={V1.green} prefix="+" />
          </View>
        </Animated.View>

        {/* Streak callout */}
        {currentStreak > 1 && (
          <Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(350).duration(400)}>
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 10,
              paddingHorizontal: 16, paddingVertical: 12,
              borderRadius: 14, marginTop: 4, width: '100%',
              backgroundColor: isDark ? 'rgba(255,213,79,0.08)' : 'rgba(255,213,79,0.06)',
              borderWidth: 1, borderColor: isDark ? 'rgba(255,213,79,0.15)' : 'rgba(255,213,79,0.12)',
            }}>
              <Text style={{ fontSize: 20 }}>
                {currentStreak >= 7 ? '\uD83D\uDD25' : currentStreak >= 3 ? '\uD83D\uDCAA' : '\u2728'}
              </Text>
              <Text style={{
                fontFamily: BODY_FONT, fontSize: 14, fontWeight: '700',
                color: V1.gold, flex: 1,
              }}>
                {currentStreak}-day streak!
              </Text>
            </View>
          </Animated.View>
        )}

      </View>

      {/* CTAs — exactly 2 choices to avoid decision paralysis */}
      <View style={[styles.ctas, { paddingBottom: insets.bottom + 24 }]}>
        <Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(500).duration(400)} style={{ width: '100%' }}>
          <Pressable onPress={handleContinue} style={[styles.primaryCta, { backgroundColor: remainingTasks > 0 ? V1.coral : V1.green }]}>
            <Text style={styles.primaryCtaText}>
              {roomIsComplete ? 'See Your Room' : 'Keep Cleaning'}
            </Text>
          </Pressable>
        </Animated.View>
        <Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(550).duration(400)}>
          <Pressable onPress={handleDone} style={styles.textLinkCta}>
            <Text style={[styles.textLinkCtaText, { color: t.textSecondary }]}>I'm done for now</Text>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 400,
    overflow: 'hidden',
    zIndex: 10,
    pointerEvents: 'none',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
  },

  // Mascot
  mascotContainer: {
    marginBottom: 24,
  },

  // Title
  title: {
    fontFamily: DISPLAY_FONT,
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: BODY_FONT,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 28,
  },

  // Stats
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    width: '100%',
    marginBottom: 24,
  },
  statValue: {
    fontFamily: DISPLAY_FONT,
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: BODY_FONT,
    fontSize: 13,
  },
  statDivider: {
    width: 1,
    height: 32,
  },

  // CTAs
  ctas: {
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
  primaryCta: {
    paddingVertical: 16,
    borderRadius: 28,
    alignItems: 'center',
    width: '100%',
  },
  primaryCtaText: {
    fontFamily: BODY_FONT,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  textLinkCta: {
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  textLinkCtaText: {
    fontFamily: BODY_FONT,
    fontSize: 15,
  },
});
