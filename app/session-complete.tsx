/**
 * Declutterly -- Session Complete Screen (V1)
 * Matches Pencil design: bcHfn
 *
 * - Mascot celebrating
 * - "Session Done!" title
 * - Stats row (tasks done, time, XP earned)
 * - Room progress bar
 * - "Continue Cleaning" / "I'm done for now" options
 */

import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDeclutter } from '@/context/DeclutterContext';

// ─── V1 Design Tokens ────────────────────────────────────────────────────────
const V1 = {
  coral: '#FF6B6B',
  green: '#66BB6A',
  amber: '#FFB74D',
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

export default function SessionCompleteScreen() {
  const { tasksCompleted, timeSpent, xpEarned, roomId, roomName } = useLocalSearchParams<{
    tasksCompleted: string;
    timeSpent: string;
    xpEarned: string;
    roomId: string;
    roomName: string;
  }>();

  const rawScheme = useColorScheme();
  const isDark = rawScheme === 'dark';
  const t = isDark ? V1.dark : V1.light;
  const insets = useSafeAreaInsets();
  const { rooms, stats, updateStats } = useDeclutter();

  const tasks = parseInt(tasksCompleted || '0');
  const time = parseInt(timeSpent || '0');
  const xp = parseInt(xpEarned || '0');

  const room = rooms.find(r => r.id === roomId);
  const totalRoomTasks = room?.tasks?.length || 0;
  const completedRoomTasks = room?.tasks?.filter(t => t.completed).length || 0;
  const roomProgress = totalRoomTasks > 0 ? (completedRoomTasks / totalRoomTasks) * 100 : 0;
  const remainingTasks = totalRoomTasks - completedRoomTasks;

  // Award XP on mount
  useEffect(() => {
    if (xp > 0) {
      updateStats({
        xp: (stats?.xp || 0) + xp,
        totalMinutesCleaned: (stats?.totalMinutesCleaned || 0) + time,
      });
    }
  }, []);

  const handleContinue = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (roomId) {
      router.replace(`/room/${roomId}`);
    } else {
      router.replace('/');
    }
  }, [roomId]);

  const handleDone = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace('/');
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      <View style={[styles.content, { paddingTop: insets.top + 60 }]}>
        {/* Mascot */}
        <Animated.View entering={ZoomIn.duration(500)} style={styles.mascotContainer}>
          <View style={[styles.mascotCircle, { backgroundColor: isDark ? '#2A2A2A' : '#E8E8E8' }]}>
            <Text style={styles.mascotEmoji}>🐹</Text>
          </View>
        </Animated.View>

        {/* Title */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <Text style={[styles.title, { color: t.text }]}>Session Done!</Text>
          <Text style={[styles.subtitle, { color: V1.green }]}>
            You crushed your 15-minute blitz
          </Text>
        </Animated.View>

        {/* Stats row */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)}>
          <View style={[styles.statsCard, { backgroundColor: t.card, borderColor: t.border }]}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: V1.coral }]}>{tasks}</Text>
              <Text style={[styles.statLabel, { color: t.textSecondary }]}>Tasks</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: t.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: t.text }]}>{time}m</Text>
              <Text style={[styles.statLabel, { color: t.textSecondary }]}>Time</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: t.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: V1.green }]}>+{xp}</Text>
              <Text style={[styles.statLabel, { color: t.textSecondary }]}>XP</Text>
            </View>
          </View>
        </Animated.View>

        {/* Room progress */}
        {room && (
          <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.roomProgressSection}>
            <View style={styles.roomProgressHeader}>
              <Text style={[styles.roomProgressName, { color: t.text }]}>{room.name}</Text>
              <Text style={[styles.roomProgressPercent, { color: V1.green }]}>
                {Math.round(roomProgress)}% fresh
              </Text>
            </View>
            <View style={[styles.roomProgressBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
              <View style={[styles.roomProgressFill, { width: `${Math.max(roomProgress, 3)}%`, backgroundColor: V1.green }]} />
            </View>
            {remainingTasks > 0 && (
              <Text style={[styles.remainingText, { color: t.textSecondary }]}>
                {remainingTasks} more tasks to finish this room. You've got this!
              </Text>
            )}
          </Animated.View>
        )}
      </View>

      {/* CTAs */}
      <View style={[styles.ctas, { paddingBottom: insets.bottom + 24 }]}>
        <Animated.View entering={FadeInDown.delay(500).duration(400)} style={{ width: '100%' }}>
          <Pressable onPress={handleContinue} style={[styles.primaryCta, { backgroundColor: V1.coral }]}>
            <Text style={styles.primaryCtaText}>Continue Cleaning</Text>
          </Pressable>
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(550).duration(400)}>
          <Pressable onPress={handleDone}>
            <Text style={[styles.secondaryCta, { color: t.textSecondary }]}>I'm done for now</Text>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
  },

  // Mascot
  mascotContainer: {
    marginBottom: 24,
  },
  mascotCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mascotEmoji: { fontSize: 52 },

  // Title
  title: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
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
    borderRadius: 18,
    borderWidth: 1,
    width: '100%',
    marginBottom: 24,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
  },
  statDivider: {
    width: 1,
    height: 32,
  },

  // Room progress
  roomProgressSection: {
    width: '100%',
    gap: 8,
  },
  roomProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roomProgressName: {
    fontSize: 16,
    fontWeight: '600',
  },
  roomProgressPercent: {
    fontSize: 14,
    fontWeight: '600',
  },
  roomProgressBar: {
    height: 8,
    borderRadius: 4,
  },
  roomProgressFill: {
    height: 8,
    borderRadius: 4,
  },
  remainingText: {
    fontSize: 13,
    lineHeight: 18,
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
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryCta: {
    fontSize: 15,
    paddingVertical: 8,
  },
});
