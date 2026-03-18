/**
 * Declutterly -- Room Complete Celebration Screen (V1)
 * Matches Pencil design: oRx3i
 *
 * - Confetti animation
 * - Large celebrating mascot
 * - "Room Complete!" title
 * - Stats row (Tasks, Time, XP)
 * - Before/After photo comparison
 * - "Share Progress" + "Continue" buttons
 */

import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import Animated, { FadeIn, FadeInDown, ZoomIn, withRepeat, withSequence, withTiming, useSharedValue, useAnimatedStyle, Easing } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Upload } from 'lucide-react-native';
import { useDeclutter } from '@/context/DeclutterContext';

// ─── V1 Design Tokens ────────────────────────────────────────────────────────
const V1 = {
  coral: '#FF6B6B',
  green: '#66BB6A',
  amber: '#FFB74D',
  gold: '#FFD54F',
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

// ─── Confetti pieces ─────────────────────────────────────────────────────────
const CONFETTI_COLORS = [V1.coral, V1.green, V1.amber, V1.gold, '#64B5F6', '#E040FB'];

function ConfettiPiece({ color, delay, x }: { color: string; delay: number; x: number }) {
  const translateY = useSharedValue(-20);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    translateY.value = withRepeat(
      withSequence(
        withTiming(400, { duration: 2000 + delay * 500, easing: Easing.in(Easing.ease) }),
        withTiming(-20, { duration: 0 }),
      ),
      -1,
    );
    rotate.value = withRepeat(
      withTiming(360, { duration: 1500 + delay * 300 }),
      -1,
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: 0,
          left: x,
          width: 8,
          height: 8,
          borderRadius: 2,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
}

export default function RoomCompleteScreen() {
  const { roomId, roomName, tasksCompleted, timeSpent } = useLocalSearchParams<{
    roomId: string;
    roomName: string;
    tasksCompleted: string;
    timeSpent: string;
  }>();

  const rawScheme = useColorScheme();
  const isDark = rawScheme === 'dark';
  const t = isDark ? V1.dark : V1.light;
  const insets = useSafeAreaInsets();
  const { rooms, stats, updateStats } = useDeclutter();

  const room = rooms.find(r => r.id === roomId);
  const tasks = parseInt(tasksCompleted || '0');
  const time = parseInt(timeSpent || '0');
  const xp = tasks * 24;

  const beforePhoto = room?.photos?.find(p => p.type === 'before')?.uri;
  const afterPhoto = room?.photos?.find(p => p.type === 'after')?.uri || beforePhoto;

  // Award XP
  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (xp > 0) {
      updateStats({
        xp: (stats?.xp || 0) + xp,
        totalRoomsCleaned: (stats?.totalRoomsCleaned || 0) + 1,
      });
    }
  }, []);

  const handleShare = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({
        message: `I just finished cleaning my ${roomName || 'room'} with Declutterly! ${tasks} tasks done in ${time} minutes. #Declutterly`,
      });
    } catch {}
  }, [roomName, tasks, time]);

  const handleContinue = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.replace('/');
  }, []);

  // Confetti pieces
  const confettiPieces = useMemo(() => {
    return Array.from({ length: 20 }).map((_, i) => ({
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      delay: Math.random() * 3,
      x: Math.random() * 300 + 30,
    }));
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      {/* Confetti */}
      <View style={styles.confettiContainer}>
        {confettiPieces.map((piece, i) => (
          <ConfettiPiece key={i} {...piece} />
        ))}
      </View>

      <View style={[styles.content, { paddingTop: insets.top + 40 }]}>
        {/* Mascot celebrating */}
        <Animated.View entering={ZoomIn.duration(600)} style={styles.mascotSection}>
          <View style={[styles.mascotCircle, { backgroundColor: isDark ? '#2A2A2A' : '#E8E8E8' }]}>
            <Text style={styles.mascotEmoji}>🐰</Text>
          </View>
        </Animated.View>

        {/* Title */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <Text style={[styles.title, { color: t.text }]}>Room Complete!</Text>
          <Text style={[styles.subtitle, { color: V1.green }]}>
            {roomName || 'Room'} is sparkling clean
          </Text>
        </Animated.View>

        {/* Stats row */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: V1.coral }]}>{tasks}</Text>
            <Text style={[styles.statLabel, { color: t.textSecondary }]}>Tasks</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: t.text }]}>{time}m</Text>
            <Text style={[styles.statLabel, { color: t.textSecondary }]}>Time</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: V1.green }]}>+{xp}</Text>
            <Text style={[styles.statLabel, { color: t.textSecondary }]}>XP</Text>
          </View>
        </Animated.View>

        {/* Before/After photos */}
        {(beforePhoto || afterPhoto) && (
          <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.photosRow}>
            {beforePhoto && (
              <View style={styles.photoCard}>
                <View style={[styles.photoLabel, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
                  <Text style={styles.photoLabelText}>Before</Text>
                </View>
                <Image source={{ uri: beforePhoto }} style={styles.photo} contentFit="cover" />
              </View>
            )}
            {afterPhoto && (
              <View style={styles.photoCard}>
                <View style={[styles.photoLabel, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
                  <Text style={styles.photoLabelText}>After</Text>
                </View>
                <Image source={{ uri: afterPhoto }} style={styles.photo} contentFit="cover" />
              </View>
            )}
          </Animated.View>
        )}

        {/* Share button */}
        <Animated.View entering={FadeInDown.delay(500).duration(400)}>
          <Pressable onPress={handleShare} style={[styles.shareButton, { borderColor: t.border }]}>
            <Upload size={18} color={t.text} />
            <Text style={[styles.shareText, { color: t.text }]}>Share Progress</Text>
          </Pressable>
        </Animated.View>
      </View>

      {/* Continue CTA */}
      <View style={[styles.bottomCta, { paddingBottom: insets.bottom + 24 }]}>
        <Pressable onPress={handleContinue} style={[styles.continueButton, { backgroundColor: V1.coral }]}>
          <Text style={styles.continueText}>Continue</Text>
        </Pressable>
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
  mascotSection: {
    marginBottom: 20,
  },
  mascotCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mascotEmoji: { fontSize: 60 },

  // Title
  title: {
    fontSize: 32,
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
  statsRow: {
    flexDirection: 'row',
    gap: 32,
    marginBottom: 28,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
  },

  // Photos
  photosRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  photoCard: {
    flex: 1,
    height: 140,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoLabel: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    zIndex: 1,
  },
  photoLabelText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },

  // Share
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
  },
  shareText: {
    fontSize: 15,
    fontWeight: '600',
  },

  // Continue
  bottomCta: {
    paddingHorizontal: 24,
  },
  continueButton: {
    paddingVertical: 16,
    borderRadius: 28,
    alignItems: 'center',
  },
  continueText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
