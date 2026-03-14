/**
 * Declutterly -- Home Screen
 * Pixel-perfect implementation matching Pencil designs (dark + light mode).
 * Minimal, calm, ADHD-friendly layout with no visual clutter.
 *
 * Design tokens extracted from Pencil (declutter.pen, nodes EaNi8 / BrrUT):
 *   Background:       dark #0A0A0A  |  light #F8F8F8
 *   Greeting:          dark #888888  |  light #999999  (DM Sans 13/500)
 *   Title:             dark #FFFFFF  |  light #1A1A1A  (Bricolage Grotesque 32/700, ls -0.4)
 *   Date:              #707070 both                    (DM Sans 12)
 *   Quote:             dark #70707090 | light #AAAAAA80 (DM Sans 12 italic)
 *   Streak card:       dark bg #141414, border #1C1C1C60 | light bg #FFFFFF, border #E0E0E0
 *   Hero card:         240h, radius 28, gradient overlay
 *   Flow cards:        bg #141414/#FFFFFF, radius 20, left border 3px
 *   CTA:               dark bg #FFFFFF h52 | light bg #1A1A1A h54, radius 28
 *   Tab bar:           floating pill 350w 64h radius 28 (handled in _layout)
 */

import { useDeclutter } from '@/context/DeclutterContext';
import { api } from '@/convex/_generated/api';
import { AmbientBackdrop } from '@/components/ui/AmbientBackdrop';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useConvexAuth, useQuery } from 'convex/react';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
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
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// ---------------------------------------------------------------------------
// Constants & helpers
// ---------------------------------------------------------------------------

const DAILY_TASK_GOAL = 5;

const ROOM_ICON_MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
  bedroom: 'bed-outline',
  kitchen: 'restaurant-outline',
  bathroom: 'water-outline',
  livingRoom: 'tv-outline',
  living_room: 'tv-outline',
  office: 'desktop-outline',
  garage: 'car-outline',
  closet: 'shirt-outline',
  other: 'cube-outline',
};

function getRoomIcon(type?: string): keyof typeof Ionicons.glyphMap {
  if (!type) return 'cube-outline';
  return ROOM_ICON_MAP[type] || 'cube-outline';
}

function getGreeting(name: string): string {
  const hour = new Date().getHours();
  if (hour < 12) return `Good morning, ${name}`;
  if (hour < 17) return `Good afternoon, ${name}`;
  return `Breathe in, ${name}`;
}

function getDayLabel(): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const day = days[new Date().getDay()];
  const hour = new Date().getHours();
  let ritual = 'Morning reset';
  if (hour >= 17) ritual = 'Evening ritual';
  else if (hour >= 12) ritual = 'Afternoon flow';
  return `${day} / ${ritual}`;
}

// ---------------------------------------------------------------------------
// Main Home Screen
// ---------------------------------------------------------------------------

export default function HomeScreen() {
  const rawScheme = useColorScheme();
  const isDark = rawScheme === 'dark';
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();

  // Data -- all safely optional-chained
  const { rooms, user, stats, setActiveRoom } = useDeclutter();
  const { isAuthenticated } = useConvexAuth();
  const streakInfo = useQuery(api.stats.getStreakInfo, isAuthenticated ? {} : 'skip');

  const streak = streakInfo?.currentStreak ?? stats?.currentStreak ?? 0;
  const userName = user?.name ?? 'Friend';
  const greeting = useMemo(() => getGreeting(userName), [userName]);
  const dateLabel = useMemo(() => getDayLabel(), []);

  // Daily task progress
  const todayCompletedTasks = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let count = 0;
    for (const room of rooms ?? []) {
      for (const task of room?.tasks ?? []) {
        if (task?.completed && task?.completedAt) {
          const completedDate = new Date(task.completedAt);
          completedDate.setHours(0, 0, 0, 0);
          if (completedDate.getTime() === today.getTime()) count++;
        }
      }
    }
    return count;
  }, [rooms]);

  // First 2 rooms for "Today's Flow"
  const flowRooms = useMemo(() => (rooms ?? []).slice(0, 2), [rooms]);

  // Hero room: first room with remaining tasks, or first room overall
  const heroRoom = useMemo(() => {
    const allRooms = rooms ?? [];
    return allRooms.find(r => (r?.tasks ?? []).some(t => !t?.completed)) ?? allRooms[0] ?? null;
  }, [rooms]);

  // Time stats
  const totalMinutes = stats?.totalMinutesCleaned ?? 0;
  const dailyGoalMinutes = 20;
  const dailyPercent = Math.min(
    100,
    Math.round((todayCompletedTasks / Math.max(DAILY_TASK_GOAL, 1)) * 100)
  );

  // Left border colors for flow cards (design: dark #808080 / #E0E0E0, light #E0E0E0 / #E0E0E0)
  const leftBorderColors = isDark ? ['#808080', '#E0E0E0'] : ['#E0E0E0', '#E0E0E0'];

  // -- Handlers --
  const handleStartFlow = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (heroRoom?.id) {
      router.push(`/room/${heroRoom.id}`);
    } else {
      setActiveRoom(null);
      router.push('/camera');
    }
  }, [heroRoom, setActiveRoom]);

  const handleRoomPress = useCallback((roomId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/room/${roomId}`);
  }, []);

  const handleScanPress = useCallback((roomId?: string | null) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveRoom(roomId ?? null);
    router.push('/camera');
  }, [setActiveRoom]);

  const handleHeroPress = useCallback(() => {
    if (heroRoom?.id) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.push(`/room/${heroRoom.id}`);
    }
  }, [heroRoom]);

  const bgColor = isDark ? '#0A0A0A' : '#F8F8F8';

  // Loading state -- rooms is undefined while hydrating from storage
  const isLoading = rooms === undefined || rooms === null;

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <AmbientBackdrop isDark={isDark} variant="home" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 14, paddingBottom: 120 },
        ]}
        showsVerticalScrollIndicator={false}
        bounces
      >
        {/* -- Header Section ------------------------------------------------ */}
        <Animated.View
          entering={reducedMotion ? undefined : FadeInDown.duration(400).delay(0)}
          style={styles.headerSection}
        >
          <View style={styles.kickerRow}>
            <LinearGradient
              colors={
                isDark
                  ? ['rgba(255,196,126,0.32)', 'rgba(255,140,92,0.08)']
                  : ['rgba(255,205,156,0.85)', 'rgba(255,236,214,0.55)']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                styles.kickerPill,
                { borderColor: isDark ? 'rgba(255,214,163,0.22)' : 'rgba(196,151,98,0.16)' },
              ]}
            >
              <Text style={[styles.kickerText, { color: isDark ? '#FCE7C8' : '#78572B' }]}>
                SOFT RESET
              </Text>
            </LinearGradient>

            <View
              style={[
                styles.kickerStat,
                {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.78)',
                  borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                },
              ]}
            >
              <Text style={[styles.kickerStatValue, { color: isDark ? '#FFFFFF' : '#151515' }]}>
                {dailyPercent}%
              </Text>
              <Text style={[styles.kickerStatLabel, { color: isDark ? '#9E9EA6' : '#73737C' }]}>
                today
              </Text>
            </View>
          </View>

          <Text style={[styles.greetingText, { color: isDark ? '#888888' : '#999999' }]}>
            {greeting}
          </Text>

          <Text style={[styles.titleText, { color: isDark ? '#FFFFFF' : '#1A1A1A' }]}>
            Your quiet space
          </Text>

          <Text style={[styles.dateText, { color: '#707070' }]}>
            {dateLabel}
          </Text>

          <Text style={[styles.quoteText, { color: isDark ? '#70707090' : '#AAAAAA80' }]}>
            {'\u2018'}Small steps create big change.{'\u2019'}
          </Text>

          {/* Streak Card */}
          <Animated.View entering={reducedMotion ? undefined : FadeInDown.duration(400).delay(80)}>
            <StreakCard
              isDark={isDark}
              totalMinutes={totalMinutes}
              dailyGoalMinutes={dailyGoalMinutes}
              todayCompletedTasks={todayCompletedTasks}
            />
          </Animated.View>
        </Animated.View>

        {/* -- Hero Card ----------------------------------------------------- */}
        {isLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={isDark ? '#FFFFFF' : '#1A1A1A'} />
          </View>
        ) : heroRoom ? (
          <Animated.View entering={reducedMotion ? undefined : FadeInDown.duration(400).delay(160)}>
            <HeroCard
              isDark={isDark}
              room={heroRoom}
              onScanPress={handleScanPress}
              onPress={handleHeroPress}
            />
          </Animated.View>
        ) : (
          /* Empty state -- no rooms yet */
          <Animated.View entering={reducedMotion ? undefined : FadeInDown.duration(400).delay(160)}>
            <EmptyHeroCard isDark={isDark} onScanPress={handleScanPress} />
          </Animated.View>
        )}

        {/* -- Today's Flow Section ------------------------------------------ */}
        {flowRooms.length > 0 && (
          <Animated.View
            entering={reducedMotion ? undefined : FadeInDown.duration(400).delay(240)}
            style={styles.flowSection}
          >
            <Text style={[styles.sectionLabel, { color: '#707070' }]}>
              TODAY{'\u2019'}S FLOW
            </Text>

            {flowRooms.map((room, index) => (
              <FlowCard
                key={room?.id ?? index}
                isDark={isDark}
                room={room}
                leftBorderColor={leftBorderColors[index] ?? leftBorderColors[0]}
                onPress={() => room?.id && handleRoomPress(room.id)}
              />
            ))}
          </Animated.View>
        )}

        {/* -- CTA Button ---------------------------------------------------- */}
        {heroRoom || flowRooms.length > 0 ? (
          <Animated.View entering={reducedMotion ? undefined : FadeInDown.duration(400).delay(320)}>
            <CTAButton isDark={isDark} onPress={handleStartFlow} />
          </Animated.View>
        ) : null}
      </ScrollView>

      {/* Decorative sparkles */}
      <View style={styles.sparkleContainer} pointerEvents="none">
        <Ionicons
          name="sparkles-outline"
          size={16}
          color={isDark ? '#FFFFFF' : '#1A1A1A'}
          style={[styles.sparkle1, { opacity: isDark ? 0.3 : 0.25 }]}
        />
        <Ionicons
          name="sparkles-outline"
          size={12}
          color={isDark ? '#FFFFFF' : '#1A1A1A'}
          style={[styles.sparkle2, { opacity: 0.2 }]}
        />
        <Ionicons
          name="sparkles"
          size={20}
          color={isDark ? '#FFFFFF' : '#1A1A1A'}
          style={[styles.sparkle3, { opacity: isDark ? 0.35 : 0.3 }]}
        />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Streak Card
// ---------------------------------------------------------------------------

interface StreakCardProps {
  isDark: boolean;
  totalMinutes: number;
  dailyGoalMinutes: number;
  todayCompletedTasks: number;
}

function StreakCard({ isDark, totalMinutes, dailyGoalMinutes, todayCompletedTasks }: StreakCardProps) {
  const hour = new Date().getHours();
  const emoji = hour >= 17 ? '\uD83C\uDF19' : hour >= 12 ? '\u2600\uFE0F' : '\uD83C\uDF24\uFE0F';

  return (
    <View
      style={[
        styles.streakCard,
        {
          backgroundColor: isDark ? '#141414' : '#FFFFFF',
          borderColor: isDark ? '#1C1C1C60' : '#E0E0E0',
          // Design: dark shadow #030611 blur 24 offset y8 | light shadow #000008 blur 12 offset y4
          shadowColor: isDark ? '#030611' : '#000000',
          shadowOffset: { width: 0, height: isDark ? 8 : 4 },
          shadowOpacity: isDark ? 0.33 : 0.03,
          shadowRadius: isDark ? 24 : 12,
        },
      ]}
    >
      <LinearGradient
        colors={
          isDark
            ? ['rgba(255,255,255,0.08)', 'rgba(255,169,98,0.04)', 'rgba(255,255,255,0.02)']
            : ['rgba(255,255,255,0.92)', 'rgba(255,247,236,0.9)', 'rgba(255,255,255,0.86)']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.streakCardGradient}
      >
        <View style={styles.streakContent}>
          {/* Ring */}
          <View style={styles.ringWrap}>
            <View
              style={[
                styles.ringCircle,
                {
                  borderColor: isDark ? '#1C1C1C' : '#E0E0E0',
                  borderWidth: isDark ? 4 : 3.5,
                },
              ]}
            />
            <View style={styles.ringEmojiWrap}>
              <Text style={styles.ringEmoji}>{emoji}</Text>
            </View>
          </View>

          {/* Streak Info */}
          <View style={styles.streakInfo}>
            <Text style={[styles.streakLabel, { color: isDark ? '#8C8C92' : '#8C8377' }]}>
              WIND DOWN
            </Text>
            <Text style={[styles.streakName, { color: isDark ? '#FFFFFF' : '#1A1A1A' }]}>
              Mindful Streak
            </Text>
            <Text style={[styles.streakSub, { color: isDark ? '#A7A7B0' : '#8A8176' }]}>
              {totalMinutes} min / {dailyGoalMinutes} min
            </Text>
          </View>

          {/* Daily Goal */}
          <View style={styles.dailyGoal}>
            <Text style={[styles.goalNum, { color: isDark ? '#FFFFFF' : '#1A1A1A' }]}>
              {todayCompletedTasks}/{DAILY_TASK_GOAL}
            </Text>
            <Text style={[styles.goalLabel, { color: isDark ? '#8C8C92' : '#8A8176' }]}>
              tasks
            </Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Hero Card
// ---------------------------------------------------------------------------

interface HeroCardProps {
  isDark: boolean;
  room: {
    id: string;
    name?: string;
    currentProgress?: number;
    photos?: { uri: string }[];
  };
  onScanPress: (roomId?: string | null) => void;
  onPress: () => void;
}

function HeroCard({ isDark, room, onScanPress, onPress }: HeroCardProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.97, { damping: 20, stiffness: 400 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  }, [scale]);

  const progress = Math.round(room?.currentProgress ?? 0);
  const heroImage = room?.photos?.[0]?.uri;
  const remainingTasks = Math.max(
    0,
    (room as { tasks?: { completed?: boolean }[] } | undefined)?.tasks?.filter((task) => !task?.completed)
      .length ?? 0
  );

  // Gradient overlay colors (from design)
  const gradientColors: [string, string, string, string] = isDark
    ? ['#0A0A0A00', '#0A0A0A70', '#0A0A0AD8', '#0A0A0AF0']
    : ['#F8F8F800', '#F8F8F840', '#F8F8F8B0', '#F8F8F8E0'];

  const gradientLocations: [number, number, number, number] = isDark
    ? [0, 0.4, 0.75, 1]
    : [0, 0.35, 0.7, 1];

  return (
    <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View style={[styles.heroCard, animatedStyle]}>
        {/* Background gradient fill */}
        <LinearGradient
          colors={
            isDark
              ? ['#121212', '#0D0D0D', '#0A0A0A']
              : ['#E8E8E8', '#F0F0F0', '#F5F5F5', '#F8F8F8']
          }
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Background image */}
        {heroImage ? (
          <Image source={{ uri: heroImage }} style={styles.heroImage} resizeMode="cover" />
        ) : null}

        {/* Gradient overlay */}
        <LinearGradient
          colors={gradientColors}
          locations={gradientLocations}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        <LinearGradient
          colors={
            isDark
              ? ['rgba(255,184,107,0.18)', 'rgba(255,184,107,0.03)', 'transparent']
              : ['rgba(255,203,155,0.38)', 'rgba(255,203,155,0.10)', 'transparent']
          }
          start={{ x: 0.1, y: 0.1 }}
          end={{ x: 0.9, y: 0.9 }}
          style={styles.heroGlow}
        />

        {/* Top row: badge + scan */}
        <View style={styles.heroTopRow}>
          <View
            style={[
              styles.heroBadge,
              {
                backgroundColor: isDark ? '#1A1A1A1a' : '#11111150',
                borderColor: isDark ? '#FFFFFF18' : '#D8D8D8',
              },
            ]}
          >
            <Ionicons name="leaf-outline" size={12} color={isDark ? '#FFFFFF' : '#1A1A1A'} />
            <Text style={[styles.heroBadgeText, { color: isDark ? '#FFFFFF' : '#1A1A1A' }]}>
              Evening Pick
            </Text>
          </View>

          <Pressable
            onPress={(event) => {
              event.stopPropagation();
              onScanPress(room.id);
            }}
            style={[
              styles.heroScanBtn,
              {
                backgroundColor: isDark ? '#FFFFFF12' : '#1A1A1A30',
                borderColor: isDark ? '#FFFFFF20' : '#1A1A1AB5',
              },
            ]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="scan-outline" size={12} color={isDark ? '#FFFFFF' : '#1A1A1A'} />
            <Text style={[styles.heroScanText, { color: isDark ? '#FFFFFF' : '#1A1A1A' }]}>
              Scan
            </Text>
          </Pressable>
        </View>

        {/* Bottom: title + progress */}
        <View style={styles.heroBottom}>
          <Text style={[styles.heroEyebrow, { color: isDark ? '#E6C28C' : '#72512C' }]}>
            {remainingTasks > 0 ? `${remainingTasks} tasks waiting for you` : 'Ready for a fresh pass'}
          </Text>
          <Text
            style={[styles.heroTitle, { color: isDark ? '#FFFFFF' : '#1A1A1A' }]}
            numberOfLines={1}
          >
            {room?.name || 'Living Room Reset'}
          </Text>

          <View style={styles.heroProgressRow}>
            <View
              style={[
                styles.heroProgressTrack,
                { backgroundColor: isDark ? '#1C1C1C60' : '#00000015' },
              ]}
            >
              <View
                style={[
                  styles.heroProgressFill,
                  {
                    width: `${progress}%`,
                    backgroundColor: isDark ? '#FFFFFF' : '#1A1A1A',
                  },
                ]}
              />
            </View>
            <Text style={[styles.heroProgressText, { color: isDark ? '#FFFFFF' : '#1A1A1A' }]}>
              {progress}%
            </Text>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Empty Hero Card (no rooms yet)
// ---------------------------------------------------------------------------

function EmptyHeroCard({ isDark, onScanPress }: { isDark: boolean; onScanPress: () => void }) {
  return (
    <LinearGradient
      colors={
        isDark
          ? ['rgba(22,22,26,0.98)', 'rgba(12,12,16,0.98)']
          : ['rgba(255,255,255,0.98)', 'rgba(248,244,238,0.96)']
      }
      style={[
        styles.heroCard,
        styles.emptyHeroCard,
        {
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
        },
      ]}
    >
      <LinearGradient
        colors={isDark ? ['#FFD39A', '#FFAA63'] : ['#FFC888', '#FFA36A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.emptyHeroIcon}
      >
        <Ionicons name="camera-outline" size={22} color="#17120B" />
      </LinearGradient>

      <Text style={[styles.emptyHeroEyebrow, { color: isDark ? '#F9DFC1' : '#8A5A29' }]}>
        FIRST RESET
      </Text>

      <Text style={[styles.emptyHeroTitle, { color: isDark ? '#FFF8EF' : '#17171A' }]}>
        Start with the room you notice most.
      </Text>

      <Text
        style={[
          styles.emptyHeroSubtext,
          { color: isDark ? 'rgba(255,255,255,0.56)' : 'rgba(23,23,26,0.54)' },
        ]}
      >
        One photo is enough. Declutterly will turn it into a short, calm next step instead of a giant project.
      </Text>

      <Text
        style={[
          styles.emptyHeroNote,
          { color: isDark ? 'rgba(249,223,193,0.72)' : 'rgba(122,80,39,0.72)' },
        ]}
      >
        Try first: kitchen counter or bedroom floor.
      </Text>

      <Pressable
        onPress={onScanPress}
        accessibilityRole="button"
        accessibilityLabel="Scan first room"
        style={({ pressed }) => [{ opacity: pressed ? 0.88 : 1 }]}
      >
        <LinearGradient
          colors={isDark ? ['#FFF4E3', '#F7D19B'] : ['#1B1B20', '#33323A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.emptyHeroButton}
        >
          <Ionicons name="scan-outline" size={16} color={isDark ? '#17120B' : '#FFFFFF'} />
          <Text style={[styles.emptyHeroButtonText, { color: isDark ? '#17120B' : '#FFFFFF' }]}>
            Scan first room
          </Text>
        </LinearGradient>
      </Pressable>
    </LinearGradient>
  );
}

// ---------------------------------------------------------------------------
// Flow Card
// ---------------------------------------------------------------------------

interface FlowCardProps {
  isDark: boolean;
  room: {
    id?: string;
    name?: string;
    type?: string;
    currentProgress?: number;
    tasks?: { completed?: boolean }[];
  };
  leftBorderColor: string;
  onPress: () => void;
}

function FlowCard({ isDark, room, leftBorderColor, onPress }: FlowCardProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.98, { damping: 20, stiffness: 400 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  }, [scale]);

  const tasks = room?.tasks ?? [];
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t?.completed).length;
  const remainingTasks = totalTasks - completedTasks;
  const progress = Math.round(room?.currentProgress ?? 0);
  const subtitle = totalTasks > 0
    ? `${remainingTasks} task${remainingTasks !== 1 ? 's' : ''} left`
    : 'No tasks yet';

  return (
    <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View
        style={[
          styles.flowCard,
          {
            backgroundColor: isDark ? '#141414' : '#FFFFFF',
            borderLeftColor: leftBorderColor,
            borderLeftWidth: 3,
            // Design: dark shadow #020612 blur 20 offset y6 | light shadow #000008 blur 12 offset y4
            shadowColor: isDark ? '#020612' : '#000000',
            shadowOffset: { width: 0, height: isDark ? 6 : 4 },
            shadowOpacity: isDark ? 0.27 : 0.03,
            shadowRadius: isDark ? 20 : 12,
          },
          animatedStyle,
        ]}
      >
        <LinearGradient
          colors={
            isDark
              ? ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.015)']
              : ['rgba(255,248,238,0.95)', 'rgba(255,255,255,0.82)']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        {/* Icon */}
        {isDark ? (
          <View style={[styles.flowCardIcon, { backgroundColor: '#1A1A1A' }]}>
            <Ionicons name={getRoomIcon(room?.type)} size={18} color="#FFFFFF" />
          </View>
        ) : (
          <LinearGradient
            colors={['#D5CEBF', '#C4B49A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.flowCardIcon}
          >
            <Ionicons name={getRoomIcon(room?.type)} size={18} color="#888888" />
          </LinearGradient>
        )}

        {/* Info */}
        <View style={styles.flowCardInfo}>
          <Text
            style={[styles.flowCardName, { color: isDark ? '#FFFFFF' : '#1A1A1A' }]}
            numberOfLines={1}
          >
            {room?.name ?? 'Room'}
          </Text>
          <Text
            style={[styles.flowCardSub, { color: isDark ? '#707070' : '#999999' }]}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
          <View
            style={[
              styles.flowProgressTrack,
              { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' },
            ]}
          >
            <View
              style={[
                styles.flowProgressFill,
                {
                  width: `${Math.max(progress, 8)}%`,
                  backgroundColor: isDark ? '#F6D2A0' : '#8C6436',
                },
              ]}
            />
          </View>
        </View>

        {/* Percentage */}
        <View style={styles.flowCardTrailing}>
          <Text style={[styles.flowCardPct, { color: isDark ? '#FFFFFF' : '#1A1A1A' }]}>
            {progress}%
          </Text>
          <Ionicons
            name="arrow-forward"
            size={14}
            color={isDark ? '#9E9EA6' : '#7D7D84'}
          />
        </View>
      </Animated.View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// CTA Button
// ---------------------------------------------------------------------------

interface CTAButtonProps {
  isDark: boolean;
  onPress: () => void;
}

function CTAButton({ isDark, onPress }: CTAButtonProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.96, { damping: 20, stiffness: 400 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  }, [scale]);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="button"
      accessibilityLabel="Start Your Flow"
    >
      <Animated.View
        style={[
          styles.ctaButton,
          styles.ctaButtonShadow,
          animatedStyle,
        ]}
      >
        <LinearGradient
          colors={
            isDark
              ? ['#FFF6EB', '#F7D8AE']
              : ['#1C1C21', '#3B3845']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.ctaButton, { height: isDark ? 56 : 58 }]}
        >
          <View
            style={[
              styles.ctaIconWrap,
              { backgroundColor: isDark ? 'rgba(14,14,18,0.16)' : 'rgba(255,255,255,0.10)' },
            ]}
          >
            <Ionicons name="scan-outline" size={18} color={isDark ? '#121212' : '#FFFFFF'} />
          </View>
          <View style={styles.ctaCopy}>
            <Text style={[styles.ctaText, { color: isDark ? '#121212' : '#FFFFFF' }]}>
              Start Your Flow
            </Text>
            <Text style={[styles.ctaSubtext, { color: isDark ? '#3F372F' : '#D7D4DD' }]}>
              Pick up momentum in one tap
            </Text>
          </View>
          <Ionicons name="arrow-forward" size={18} color={isDark ? '#121212' : '#FFFFFF'} />
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    gap: 12,
  },

  // -- Header ---------------------------------------------------------------
  headerSection: {
    gap: 8,
    marginBottom: 4,
  },
  kickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  kickerPill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  kickerText: {
    fontFamily: Platform.OS === 'ios' ? 'DM Sans' : 'sans-serif',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  kickerStat: {
    minWidth: 70,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
  },
  kickerStatValue: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 13,
    fontWeight: '800',
  },
  kickerStatLabel: {
    fontFamily: Platform.OS === 'ios' ? 'DM Sans' : 'sans-serif',
    fontSize: 10,
    fontWeight: '500',
  },
  greetingText: {
    fontFamily: Platform.OS === 'ios' ? 'DM Sans' : 'sans-serif',
    fontSize: 13,
    fontWeight: '500',
  },
  titleText: {
    fontFamily: Platform.OS === 'ios' ? 'Bricolage Grotesque' : 'sans-serif',
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  dateText: {
    fontFamily: Platform.OS === 'ios' ? 'DM Sans' : 'sans-serif',
    fontSize: 12,
    fontWeight: '400',
  },
  quoteText: {
    fontFamily: Platform.OS === 'ios' ? 'DM Sans' : 'sans-serif',
    fontSize: 12,
    fontStyle: 'italic',
    fontWeight: '400',
  },

  // -- Streak Card ----------------------------------------------------------
  streakCard: {
    borderRadius: 22,
    borderWidth: 1,
    elevation: 8,
    overflow: 'hidden',
  },
  streakCardGradient: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  streakContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  ringWrap: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringCircle: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  ringEmojiWrap: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringEmoji: {
    fontSize: 18,
  },
  streakInfo: {
    flex: 1,
    gap: 3,
  },
  streakLabel: {
    fontFamily: Platform.OS === 'ios' ? 'DM Sans' : 'sans-serif',
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.8,
  },
  streakName: {
    fontFamily: Platform.OS === 'ios' ? 'Bricolage Grotesque' : 'sans-serif',
    fontSize: 15,
    fontWeight: '700',
  },
  streakSub: {
    fontFamily: Platform.OS === 'ios' ? 'DM Sans' : 'sans-serif',
    fontSize: 11,
    fontWeight: '400',
  },
  dailyGoal: {
    alignItems: 'center',
    gap: 2,
  },
  goalNum: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 18,
    fontWeight: '700',
  },
  goalLabel: {
    fontFamily: Platform.OS === 'ios' ? 'DM Sans' : 'sans-serif',
    fontSize: 10,
    fontWeight: '400',
  },

  // -- Hero Card ------------------------------------------------------------
  heroCard: {
    width: '100%',
    height: 256,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#071132',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 28,
    elevation: 12,
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  heroGlow: {
    position: 'absolute',
    top: -24,
    right: -32,
    width: 180,
    height: 180,
    borderRadius: 999,
  },
  heroTopRow: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  heroBadgeText: {
    fontFamily: Platform.OS === 'ios' ? 'DM Sans' : 'sans-serif',
    fontSize: 11,
    fontWeight: '600',
  },
  heroScanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  heroScanText: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 11,
    fontWeight: '600',
  },
  heroBottom: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    gap: 6,
    zIndex: 2,
  },
  heroEyebrow: {
    fontFamily: Platform.OS === 'ios' ? 'DM Sans' : 'sans-serif',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontFamily: Platform.OS === 'ios' ? 'Bricolage Grotesque' : 'sans-serif',
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  heroProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroProgressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 4,
    overflow: 'hidden',
  },
  heroProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  heroProgressText: {
    fontFamily: Platform.OS === 'ios' ? 'DM Sans' : 'sans-serif',
    fontSize: 12,
    fontWeight: '700',
  },

  // -- Flow Section ---------------------------------------------------------
  flowSection: {
    gap: 12,
  },
  sectionLabel: {
    fontFamily: Platform.OS === 'ios' ? 'DM Sans' : 'sans-serif',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
  },

  // -- Flow Card ------------------------------------------------------------
  flowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    padding: 16,
    gap: 12,
    elevation: 6,
  },
  flowCardIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flowCardInfo: {
    flex: 1,
    gap: 4,
  },
  flowCardName: {
    fontFamily: Platform.OS === 'ios' ? 'DM Sans' : 'sans-serif',
    fontSize: 15,
    fontWeight: '700',
  },
  flowCardSub: {
    fontFamily: Platform.OS === 'ios' ? 'DM Sans' : 'sans-serif',
    fontSize: 11,
    fontWeight: '400',
  },
  flowCardPct: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 14,
    fontWeight: '700',
  },
  flowProgressTrack: {
    height: 5,
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: 2,
    width: '92%',
  },
  flowProgressFill: {
    height: '100%',
    borderRadius: 999,
  },
  flowCardTrailing: {
    alignItems: 'flex-end',
    gap: 8,
  },

  // -- CTA Button -----------------------------------------------------------
  ctaButtonShadow: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 10,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 28,
    gap: 12,
    paddingHorizontal: 16,
  },
  ctaIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaCopy: {
    flex: 1,
    alignItems: 'center',
  },
  ctaText: {
    fontFamily: Platform.OS === 'ios' ? 'DM Sans' : 'sans-serif',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  ctaSubtext: {
    fontFamily: Platform.OS === 'ios' ? 'DM Sans' : 'sans-serif',
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },

  // -- Loading --------------------------------------------------------------
  loadingWrap: {
    height: 240,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyHeroCard: {
    height: 272,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 16,
    gap: 6,
  },
  emptyHeroIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyHeroEyebrow: {
    fontFamily: Platform.OS === 'ios' ? 'DM Sans' : 'sans-serif',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  emptyHeroTitle: {
    fontFamily: Platform.OS === 'ios' ? 'Bricolage Grotesque' : 'sans-serif',
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '700',
    letterSpacing: -0.7,
    textAlign: 'center',
  },
  emptyHeroSubtext: {
    fontFamily: Platform.OS === 'ios' ? 'DM Sans' : 'sans-serif',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
    textAlign: 'center',
  },
  emptyHeroNote: {
    fontFamily: Platform.OS === 'ios' ? 'DM Sans' : 'sans-serif',
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '700',
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  emptyHeroButton: {
    minHeight: 44,
    minWidth: 220,
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 6,
  },
  emptyHeroButtonText: {
    fontFamily: Platform.OS === 'ios' ? 'DM Sans' : 'sans-serif',
    fontSize: 15,
    fontWeight: '800',
  },

  // -- Sparkle decorations --------------------------------------------------
  sparkleContainer: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'none',
  },
  sparkle1: {
    position: 'absolute',
    top: 90,
    right: 16,
  },
  sparkle2: {
    position: 'absolute',
    top: 105,
    left: 24,
  },
  sparkle3: {
    position: 'absolute',
    top: 190,
    right: 26,
  },
});
