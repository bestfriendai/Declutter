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

import { MascotAvatar } from '@/components/ui';
import { useDeclutter } from '@/context/DeclutterContext';
import { useAnalyzeProgress } from '@/hooks/useConvex';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { Upload, Camera } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Pressable,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import Animated, { Easing, FadeInDown, ZoomIn, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { V1, BODY_FONT, DISPLAY_FONT, RADIUS } from '@/constants/designTokens';
import { ScreenErrorBoundary } from '@/components/ErrorBoundary';

// ─── Before/After Slider (inline, lightweight) ───────────────────────────────
function BeforeAfterSliderSimple({ beforeUri, afterUri, height = 200 }: {
  beforeUri: string; afterUri: string; height?: number;
}) {
  const [sliderPosition, setSliderPosition] = React.useState(0.5);
  const containerRef = React.useRef<View>(null);
  const [containerWidth, setContainerWidth] = React.useState(0);

  return (
    <View
      ref={containerRef}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
      style={{ width: '100%', height, borderRadius: RADIUS.md, overflow: 'hidden', position: 'relative' }}
    >
      {/* After (bottom layer) */}
      <Image source={{ uri: afterUri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />

      {/* Before (top layer, clipped) */}
      <View style={[StyleSheet.absoluteFill, { width: containerWidth * sliderPosition, overflow: 'hidden' }]}>
        <Image source={{ uri: beforeUri }} style={{ width: containerWidth, height }} contentFit="cover" transition={200} />
      </View>

      {/* Labels */}
      <View style={{ position: 'absolute', top: 8, left: 8, backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
        <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '700', fontFamily: BODY_FONT }}>Before</Text>
      </View>
      <View style={{ position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
        <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '700', fontFamily: BODY_FONT }}>After</Text>
      </View>

      {/* Slider line */}
      <View style={{
        position: 'absolute', top: 0, bottom: 0,
        left: containerWidth * sliderPosition - 1.5,
        width: 3, backgroundColor: '#FFFFFF',
        shadowColor: '#000', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 4,
      }} />

      {/* Drag handle */}
      <View style={{
        position: 'absolute', top: '50%', marginTop: -16,
        left: containerWidth * sliderPosition - 16,
        width: 32, height: 32, borderRadius: 16,
        backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4,
      }}>
        <Text style={{ fontSize: 12, color: '#333' }}>{'\u{2194}'}</Text>
      </View>

      {/* Touch handler */}
      <Pressable
        style={StyleSheet.absoluteFill}
        onTouchMove={(e) => {
          if (containerWidth > 0) {
            const x = e.nativeEvent.locationX;
            setSliderPosition(Math.max(0.05, Math.min(0.95, x / containerWidth)));
          }
        }}
        onPress={(e) => {
          if (containerWidth > 0) {
            const x = e.nativeEvent.locationX;
            setSliderPosition(Math.max(0.05, Math.min(0.95, x / containerWidth)));
          }
        }}
        accessibilityRole="adjustable"
        accessibilityLabel="Drag to compare before and after photos"
      />
    </View>
  );
}

// ─── Confetti pieces ─────────────────────────────────────────────────────────
const CONFETTI_COLORS = [V1.coral, V1.green, V1.amber, V1.gold, '#64B5F6', '#E040FB'];

const CONFETTI_SHAPES = ['square', 'circle', 'strip'] as const;
type ConfettiShape = typeof CONFETTI_SHAPES[number];

function ConfettiPiece({ color, delay, x, shape, size }: {
  color: string; delay: number; x: number;
  shape?: ConfettiShape; size?: number;
}) {
  const pieceSize = size ?? 8;
  const pieceShape = shape ?? 'square';
  const translateY = useSharedValue(-30);
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    // Wind drift
    translateX.value = withRepeat(
      withSequence(
        withTiming(Math.random() * 40 - 20, { duration: 800 }),
        withTiming(Math.random() * 40 - 20, { duration: 800 }),
      ),
      3,
    );
    // Fall
    translateY.value = withRepeat(
      withSequence(
        withTiming(500, { duration: 2500 + delay * 400, easing: Easing.in(Easing.quad) }),
        withTiming(-30, { duration: 0 }),
      ),
      2,
    );
    // Spin
    rotate.value = withRepeat(
      withTiming(360 * (Math.random() > 0.5 ? 1 : -1), { duration: 1200 + delay * 200 }),
      4,
    );
    opacity.value = withDelay(4500, withTiming(0, { duration: 800 }));
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  const shapeStyle = pieceShape === 'circle'
    ? { width: pieceSize, height: pieceSize, borderRadius: pieceSize / 2 }
    : pieceShape === 'strip'
      ? { width: pieceSize * 0.4, height: pieceSize * 1.5, borderRadius: 2 }
      : { width: pieceSize, height: pieceSize, borderRadius: 2 };

  return (
    <Animated.View
      style={[{
        position: 'absolute', top: -10, left: x,
        backgroundColor: color, ...shapeStyle,
      }, style]}
    />
  );
}

export default function RoomCompleteScreen() {
  return (
    <ScreenErrorBoundary screenName="room-complete">
      <RoomCompleteScreenContent />
    </ScreenErrorBoundary>
  );
}

function RoomCompleteScreenContent() {
  const { roomId, roomName, tasksCompleted, timeSpent } = useLocalSearchParams<{
    roomId: string;
    roomName: string;
    tasksCompleted: string;
    timeSpent: string;
  }>();

  const rawScheme = useColorScheme();
  const isDark = rawScheme === 'dark';
  const reducedMotion = useReducedMotion();
  const t = isDark ? V1.dark : V1.light;
  const insets = useSafeAreaInsets();
  const { rooms: rawRooms, addPhotoToRoom } = useDeclutter();
  const analyzeProgress = useAnalyzeProgress();
  const [progressAnalysis, setProgressAnalysis] = useState<any>(null);
  const rooms = rawRooms ?? [];

  const room = rooms.find(r => r.id === roomId);
  const tasks = parseInt(tasksCompleted || '0');
  const time = parseInt(timeSpent || '0');
  const xp = tasks * 10; // 10 XP per task, consistent with backend (stats.incrementTask)

  const beforePhoto = room?.photos?.find(p => p.type === 'before')?.uri;
  const afterPhoto = room?.photos?.find(p => p.type === 'after')?.uri;
  const hasAfterPhoto = !!afterPhoto;

  // Analyze progress when screen mounts if before photo exists
  useEffect(() => {
    async function analyze() {
      if (!beforePhoto) return;
      try {
        const result = await analyzeProgress({
          beforeImage: beforePhoto,
          afterImage: afterPhoto || beforePhoto, // Use after photo if available, otherwise before
        });
        setProgressAnalysis(result);
      } catch {
        // Silent — progress analysis is a bonus, not critical
      }
    }
    analyze();
  }, []);

  // Specific items cleared for rich celebration
  const completedTaskTitles = room?.tasks
    ?.filter(task => task.completed)
    ?.map(task => task.title) || [];

  // Zones that were fully cleared
  const clearedZones = [...new Set(
    room?.tasks
      ?.filter(task => task.completed)
      ?.map(task => task.zone)
      ?.filter(Boolean) || []
  )];

  // Animated XP counter
  const [displayXP, setDisplayXP] = useState(0);
  const xpScale = useSharedValue(1);

  const xpBadgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: xpScale.value }],
  }));

  // Animate celebration only. Stats are already updated when tasks are completed.
  useEffect(() => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (xp > 0) {
      // Animate XP counter from 0 to final value
      const duration = 1200;
      const startTime = Date.now();
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Ease-out curve
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplayXP(Math.round(eased * xp));
        if (progress >= 1) clearInterval(interval);
      }, 16);

      // Pulse the XP badge when counter finishes
      xpScale.value = withDelay(
        1200,
        withSequence(
          withSpring(1.2, { damping: 8, stiffness: 300 }),
          withSpring(1, { damping: 10, stiffness: 200 }),
        ),
      );

      return () => clearInterval(interval);
    }
  }, [xp, xpScale]);

  const handleShare = useCallback(async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const shareLines = [
        `Room Complete! ${roomName || 'My room'} is sparkling clean.`,
        '',
        `Tasks done: ${tasks}`,
        `Time spent: ${time} minutes`,
        `XP earned: +${xp}`,
        beforePhoto && hasAfterPhoto ? '\nBefore & After transformation!' : '',
        '',
        'Made possible with Declutterly #Declutterly',
      ];
      await Share.share({
        message: shareLines.filter(Boolean).join('\n'),
      });
    } catch {}
  }, [roomName, tasks, time, xp, beforePhoto, hasAfterPhoto]);

  const handleContinue = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.replace('/');
  }, []);

  const handleTakeAfterPhoto = useCallback(async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0] && roomId) {
        await addPhotoToRoom(roomId, {
          uri: result.assets[0].uri,
          timestamp: new Date(),
          type: 'after',
        });
      }
    } catch {
      // Fallback to image library if camera fails
      try {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          quality: 0.8,
        });
        if (!result.canceled && result.assets[0] && roomId) {
          await addPhotoToRoom(roomId, {
            uri: result.assets[0].uri,
            timestamp: new Date(),
            type: 'after',
          });
        }
      } catch {}
    }
  }, [roomId, addPhotoToRoom]);

  const handleContinueCleaning = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.replace('/(tabs)/rooms');
  }, []);

  const handleScanAgain = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/camera');
  }, []);

  // Enhanced confetti pieces with variety
  const confettiPieces = useMemo(() => {
    return Array.from({ length: 30 }).map((_, i) => ({
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      delay: Math.random() * 3,
      x: Math.random() * 340 + 10,
      shape: CONFETTI_SHAPES[i % CONFETTI_SHAPES.length],
      size: 6 + Math.random() * 6,
    }));
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      {/* Confetti - skip for reduced motion */}
      {!reducedMotion && (
        <View style={styles.confettiContainer}>
          {confettiPieces.map((piece, i) => (
            <ConfettiPiece key={i} {...piece} />
          ))}
        </View>
      )}

      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Mascot celebrating */}
        <Animated.View entering={reducedMotion ? undefined : ZoomIn.duration(600)} style={styles.mascotSection}>
          <MascotAvatar imageKey="proud" size={130} showBackground={false} />
        </Animated.View>

        {/* Title */}
        <Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(200).duration(400)}>
          <Text style={[styles.title, { color: t.text }]}>Room Complete!</Text>
          <Text style={[styles.subtitle, { color: V1.green }]}>
            {roomName || 'Room'} is sparkling clean
          </Text>
        </Animated.View>

        {/* Stats row */}
        <Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(300).duration(400)} style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: V1.coral }]}>{tasks}</Text>
            <Text style={[styles.statLabel, { color: t.textSecondary }]}>Tasks</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: t.text }]}>{time}m</Text>
            <Text style={[styles.statLabel, { color: t.textSecondary }]}>Time</Text>
          </View>
          <Animated.View style={[styles.statItem, styles.xpStatItem, xpBadgeStyle]}>
            <Text style={[styles.statValue, styles.xpValue]}>+{displayXP}</Text>
            <Text style={[styles.statLabel, { color: t.textSecondary }]}>XP</Text>
          </Animated.View>
        </Animated.View>

        {/* AI Progress Analysis */}
        {progressAnalysis && (progressAnalysis.encouragingMessage || progressAnalysis.mindClarityBoost) && (
          <Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(350).duration(400)} style={{ width: '100%', marginBottom: 20, paddingHorizontal: 4 }}>
            {progressAnalysis.encouragingMessage && (
              <View style={{
                backgroundColor: isDark ? 'rgba(102,187,106,0.1)' : 'rgba(102,187,106,0.08)',
                borderRadius: 14,
                padding: 14,
                borderWidth: 1,
                borderColor: isDark ? 'rgba(102,187,106,0.2)' : 'rgba(102,187,106,0.15)',
                marginBottom: 8,
              }}>
                <Text style={{ fontFamily: BODY_FONT, fontSize: 14, color: V1.green, fontWeight: '600', marginBottom: 4 }}>
                  AI Progress Report
                </Text>
                <Text style={{ fontFamily: BODY_FONT, fontSize: 13, color: t.textSecondary, lineHeight: 19 }}>
                  {progressAnalysis.encouragingMessage}
                </Text>
              </View>
            )}
            {progressAnalysis.mindClarityBoost && (
              <View style={{
                backgroundColor: isDark ? 'rgba(255,183,77,0.1)' : 'rgba(255,183,77,0.08)',
                borderRadius: 14,
                padding: 14,
                borderWidth: 1,
                borderColor: isDark ? 'rgba(255,183,77,0.2)' : 'rgba(255,183,77,0.15)',
              }}>
                <Text style={{ fontFamily: BODY_FONT, fontSize: 12, fontWeight: '700', color: V1.amber }}>
                  Mind Clarity Boost
                </Text>
                <Text style={{ fontFamily: BODY_FONT, fontSize: 13, color: t.textSecondary, lineHeight: 19, marginTop: 4 }}>
                  {progressAnalysis.mindClarityBoost}
                </Text>
              </View>
            )}
          </Animated.View>
        )}

        {/* Before/After photos with interactive slider */}
        {beforePhoto && (
          <Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(400).duration(400)} style={{ width: '100%', marginBottom: 24 }}>
            {hasAfterPhoto ? (
              <View style={{ width: '100%' }}>
                <BeforeAfterSliderSimple beforeUri={beforePhoto} afterUri={afterPhoto!} height={200} />
              </View>
            ) : (
              <View style={styles.photosRow}>
                <View style={styles.photoCard}>
                  <View style={[styles.photoLabel, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
                    <Text style={styles.photoLabelText}>Before</Text>
                  </View>
                  <Image source={{ uri: beforePhoto }} style={styles.photo} contentFit="cover" placeholder={{ blurhash: 'LGF5]+Yk^6#M@-5c,1J5@[or[Q6.' }} cachePolicy="memory-disk" transition={300} />
                </View>
                <Pressable
                  onPress={handleTakeAfterPhoto}
                  style={[styles.photoCard, {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                    borderStyle: 'dashed',
                    borderRadius: RADIUS.md,
                  }]}
                >
                  <Camera size={24} color={V1.coral} />
                  <Text style={[{ fontFamily: BODY_FONT, fontSize: 13, fontWeight: '600', color: V1.coral, marginTop: 8, textAlign: 'center' }]}>
                    Take a progress photo!
                  </Text>
                  <Text style={[{ fontFamily: BODY_FONT, fontSize: 11, color: t.textMuted, marginTop: 4, textAlign: 'center' }]}>
                    See how far you've come
                  </Text>
                </Pressable>
              </View>
            )}
          </Animated.View>
        )}

        {/* Specific items cleared */}
        {completedTaskTitles.length > 0 && (
          <Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(500).duration(400)} style={styles.clearedSection}>
            <Text style={[styles.clearedTitle, { color: V1.green }]}>
              Everything you cleared:
            </Text>
            {completedTaskTitles.slice(0, 6).map((title, idx) => (
              <View key={idx} style={styles.clearedRow}>
                <Text style={{ fontSize: 14, color: V1.green }}>✓</Text>
                <Text style={[styles.clearedText, { color: t.textSecondary }]} numberOfLines={1}>
                  {title}
                </Text>
              </View>
            ))}
            {completedTaskTitles.length > 6 && (
              <Text style={[styles.clearedMore, { color: t.textMuted }]}>
                + {completedTaskTitles.length - 6} more tasks
              </Text>
            )}
            {clearedZones.length > 0 && (
              <Text style={[styles.clearedZones, { color: t.textMuted }]}>
                Zones conquered: {clearedZones.join(', ')}
              </Text>
            )}
          </Animated.View>
        )}

        {/* Share button */}
        <Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(600).duration(400)}>
          <Pressable onPress={handleShare} style={[styles.shareButton, { borderColor: t.border }]}>
            <Upload size={18} color={t.text} />
            <Text style={[styles.shareText, { color: t.text }]}>Share Progress</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>

      {/* What's next? — suggest other rooms needing attention */}
      {(() => {
        const otherRooms = rooms.filter(r => r.id !== roomId && (r.tasks ?? []).some(tk => !tk.completed));
        if (otherRooms.length === 0) return null;
        return (
          <Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(650).duration(400)} style={{ width: '100%', paddingHorizontal: 24, marginBottom: 16 }}>
            <Text style={[styles.clearedTitle, { color: V1.amber, marginBottom: 8 }]}>
              What's next?
            </Text>
            {otherRooms.slice(0, 2).map((r) => {
              const pending = (r.tasks ?? []).filter(tk => !tk.completed).length;
              return (
                <Pressable
                  key={r.id}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push({ pathname: '/room/[id]', params: { id: r.id } });
                  }}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 }}
                >
                  <Text style={{ fontSize: 14, color: t.textMuted }}>{'\u2192'}</Text>
                  <Text style={{ fontFamily: BODY_FONT, fontSize: 14, color: t.text, flex: 1 }} numberOfLines={1}>
                    {r.name}
                  </Text>
                  <Text style={{ fontFamily: BODY_FONT, fontSize: 12, color: t.textMuted }}>
                    {pending} task{pending !== 1 ? 's' : ''}
                  </Text>
                </Pressable>
              );
            })}
          </Animated.View>
        );
      })()}

      {/* Continue CTA */}
      <View style={[styles.bottomCta, { paddingBottom: insets.bottom + 24 }]}>
        <Pressable onPress={handleContinueCleaning} style={[styles.continueCleaningButton, { backgroundColor: V1.coral }]}>
          <Text style={styles.continueText}>Continue Cleaning</Text>
        </Pressable>
        <Pressable onPress={handleContinue} style={[styles.continueButton, { backgroundColor: 'transparent', borderWidth: 1, borderColor: t.border }]}>
          <Text style={[styles.continueText, { color: t.text }]}>Done for Now</Text>
        </Pressable>
        <Pressable onPress={handleScanAgain} style={[styles.scanAgainButton, { borderColor: t.border }]}>
          <Text style={[styles.scanAgainText, { color: t.textSecondary }]}>Room changed? Scan again</Text>
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
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 20,
  },

  // Mascot
  mascotSection: {
    marginBottom: 20,
  },

  // Title
  title: {
    fontFamily: DISPLAY_FONT,
    fontSize: 32,
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
  statsRow: {
    flexDirection: 'row',
    gap: 32,
    marginBottom: 28,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontFamily: DISPLAY_FONT,
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: BODY_FONT,
    fontSize: 13,
  },
  xpStatItem: {
    backgroundColor: 'rgba(102,187,106,0.12)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  xpValue: {
    color: V1.green,
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
    fontFamily: BODY_FONT,
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },

  // Cleared section
  clearedSection: {
    width: '100%',
    marginBottom: 20,
    gap: 6,
  },
  clearedTitle: {
    fontFamily: BODY_FONT,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  clearedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 4,
  },
  clearedText: {
    fontFamily: BODY_FONT,
    fontSize: 13,
    flex: 1,
  },
  clearedMore: {
    fontFamily: BODY_FONT,
    fontSize: 12,
    paddingLeft: 26,
    marginTop: 2,
  },
  clearedZones: {
    fontFamily: BODY_FONT,
    fontSize: 12,
    marginTop: 8,
    fontStyle: 'italic',
  },

  // Share
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  shareText: {
    fontFamily: BODY_FONT,
    fontSize: 15,
    fontWeight: '600',
  },

  // Continue
  bottomCta: {
    paddingHorizontal: 24,
  },
  continueCleaningButton: {
    paddingVertical: 16,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
  },
  continueButton: {
    paddingVertical: 16,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
  },
  continueText: {
    fontFamily: BODY_FONT,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  // Scan again
  scanAgainButton: {
    paddingVertical: 12,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    borderWidth: 1,
    marginTop: 10,
  },
  scanAgainText: {
    fontFamily: BODY_FONT,
    fontSize: 14,
    fontWeight: '500',
  },
});
