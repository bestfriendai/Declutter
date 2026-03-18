/**
 * Declutterly -- Home Screen (V1 Core Flow)
 * Matches Pencil designs: rSSHH (populated) + TPr0p (empty state)
 */

import { useDeclutter } from '@/context/DeclutterContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useSubscription, FREE_ROOM_LIMIT } from '@/hooks/useSubscription';
import {
  V1,
  BODY_FONT,
  DISPLAY_FONT,
  RADIUS,
  SPACING,
  cardStyle,
  getTheme,
} from '@/constants/designTokens';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useCallback, useMemo } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Dimensions,
} from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Flame, Camera, Sparkles } from 'lucide-react-native';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Helper: Day greeting ────────────────────────────────────────────────────
function getTimeContext(): string {
  const now = new Date();
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const day = days[now.getDay()];
  const hour = now.getHours();
  let timeOfDay = 'morning';
  if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
  else if (hour >= 17) timeOfDay = 'evening';
  return `${day} ${timeOfDay}`;
}

// ─── Motivational quotes ─────────────────────────────────────────────────────
const QUOTES = [
  'Small steps create big change',
  'Progress, not perfection',
  'Every tidy corner is a tiny victory',
  'You deserve a space that feels good',
  'One thing at a time, one room at a time',
];

function getQuote(): string {
  const idx = Math.floor(Date.now() / (1000 * 60 * 60 * 6)) % QUOTES.length; // Changes every 6h
  return QUOTES[idx];
}

// ─── Freshness label helper ──────────────────────────────────────────────────
function getFreshnessLabel(progress: number): { label: string; color: string } {
  if (progress >= 90) return { label: 'Sparkling', color: V1.green };
  if (progress >= 70) return { label: 'Fresh', color: V1.green };
  if (progress >= 40) return { label: 'Getting there', color: V1.amber };
  return { label: 'Needs love', color: V1.coral };
}

// ─── Room emoji by type ──────────────────────────────────────────────────────
function getRoomIcon(type: string): string {
  switch (type) {
    case 'bedroom': return '🛏️';
    case 'kitchen': return '🍳';
    case 'bathroom': return '🚿';
    case 'livingRoom': return '🛋️';
    case 'office': return '💻';
    case 'garage': return '🔧';
    case 'closet': return '👕';
    default: return '🏠';
  }
}

// ─── Animated press hook ─────────────────────────────────────────────────────
function useScalePress(scaleTo = 0.97) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const onPressIn = useCallback(() => {
    'worklet';
    scale.value = withSpring(scaleTo, { damping: 15, stiffness: 200 });
  }, [scale, scaleTo]);
  const onPressOut = useCallback(() => {
    'worklet';
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
  }, [scale]);
  return { animatedStyle, onPressIn, onPressOut };
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Home Screen
// ─────────────────────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const rawScheme = useColorScheme();
  const isDark = rawScheme === 'dark';
  const t = getTheme(isDark);
  const insets = useSafeAreaInsets();
  const { rooms, user, stats, activeRoomId, setActiveRoom } = useDeclutter();
  const { isPro } = useSubscription();

  const heroPress = useScalePress(0.97);
  const spacePress0 = useScalePress(0.97);
  const spacePress1 = useScalePress(0.97);
  const spacePress2 = useScalePress(0.97);
  const spacePress3 = useScalePress(0.97);
  const spacePresses = [spacePress0, spacePress1, spacePress2, spacePress3];

  const userName = user?.name || 'there';
  const streak = stats?.currentStreak || 0;
  const todayTasksDone = useMemo(() => {
    const today = new Date().toDateString();
    let done = 0;
    let total = 0;
    rooms.forEach(r => {
      r.tasks?.forEach(task => {
        total++;
        if (task.completed && task.completedAt && new Date(task.completedAt).toDateString() === today) {
          done++;
        }
      });
    });
    return { done, total: Math.min(total, 10) }; // Show max 10 as daily target
  }, [rooms]);

  // Find "hero" room (most urgent / active)
  const heroRoom = useMemo(() => {
    if (rooms.length === 0) return null;
    // Prefer active room, else the room with most incomplete tasks
    const active = activeRoomId ? rooms.find(r => r.id === activeRoomId) : null;
    if (active) return active;
    return [...rooms].sort((a, b) => {
      const aIncomplete = (a.tasks || []).filter(t => !t.completed).length;
      const bIncomplete = (b.tasks || []).filter(t => !t.completed).length;
      return bIncomplete - aIncomplete;
    })[0];
  }, [rooms, activeRoomId]);

  const heroTaskCount = heroRoom ? (heroRoom.tasks || []).filter(t => !t.completed).length : 0;
  const heroTotalMinutes = heroRoom
    ? (heroRoom.tasks || []).filter(t => !t.completed).reduce((sum, t) => sum + (t.estimatedMinutes || 3), 0)
    : 0;

  const handleScanRoom = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!isPro && rooms.length >= FREE_ROOM_LIMIT) {
      Alert.alert('Room limit reached', 'Upgrade to Pro to add more rooms.', [
        { text: 'Later', style: 'cancel' },
        { text: 'Upgrade', onPress: () => router.push('/paywall') },
      ]);
      return;
    }
    router.push('/camera');
  }, [isPro, rooms.length]);

  const handleStartBlitz = useCallback((roomId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setActiveRoom(roomId);
    router.push('/blitz' as any);
  }, [setActiveRoom]);

  const handleOpenRoom = useCallback((roomId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/room/${roomId}`);
  }, []);

  // ── EMPTY STATE ─────────────────────────────────────────────────────────
  if (rooms.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: t.bg }]}>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
            <View>
              <Text style={[styles.greeting, { color: t.text }]}>
                Breathe in, {userName}
              </Text>
              <Text style={[styles.timeContext, { color: t.textSecondary }]}>
                {getTimeContext()}
              </Text>
            </View>
            <LinearGradient
              colors={['#FF6B6B', '#FF8E8E']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.mascotAvatar}
            >
              <Text style={styles.mascotInitial}>{userName.charAt(0).toUpperCase()}</Text>
            </LinearGradient>
          </Animated.View>

          {/* Empty state mascot illustration */}
          <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.emptyStateCenter}>
            <LinearGradient
              colors={isDark ? ['rgba(255,107,107,0.2)', 'rgba(255,142,142,0.1)'] : ['rgba(255,107,107,0.12)', 'rgba(255,142,142,0.06)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.emptyMascotCircle}
            >
              <Sparkles size={64} color={V1.coral} strokeWidth={1.5} />
            </LinearGradient>

            <Text style={[styles.emptyTitle, { color: t.text }]}>
              Let's scan your first room!
            </Text>
            <Text style={[styles.emptySubtitle, { color: t.textSecondary }]}>
              Take a photo of any room and Dusty will help you break it down into small, doable tasks.
            </Text>

            {/* Scan CTA */}
            <Pressable
              onPress={handleScanRoom}
              style={({ pressed }) => [styles.scanCtaWrapper, { opacity: pressed ? 0.88 : 1 }]}
            >
              <LinearGradient
                colors={['#FF6B6B', '#FF5252']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.scanCta, styles.scanCtaShadow]}
              >
                <Text style={styles.scanCtaText}>Scan a Room</Text>
              </LinearGradient>
            </Pressable>
          </Animated.View>

          {/* Tip card */}
          <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.tipCardWrapper}>
            <View style={[styles.tipCard, { backgroundColor: isDark ? 'rgba(255,107,107,0.08)' : 'rgba(255,107,107,0.06)', borderColor: isDark ? 'rgba(255,107,107,0.15)' : 'rgba(255,107,107,0.1)' }]}>
              <Text style={styles.tipBulb}>💡</Text>
              <Text style={[styles.tipText, { color: V1.coral }]}>
                Tip: Start with the room that bugs you most
              </Text>
            </View>
          </Animated.View>
        </ScrollView>
      </View>
    );
  }

  // ── POPULATED STATE ─────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ──────────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.greeting, { color: t.text }]}>
              Breathe in, {userName}
            </Text>
            <Text style={[styles.timeContext, { color: t.textSecondary }]}>
              {getTimeContext()}
            </Text>
          </View>
          <Pressable
            onPress={() => router.push('/mascot')}
            style={({ pressed }) => [{ opacity: pressed ? 0.88 : 1 }]}
          >
            <LinearGradient
              colors={['#FF6B6B', '#FF8E8E']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.mascotAvatar}
            >
              <Text style={styles.mascotInitial}>{userName.charAt(0).toUpperCase()}</Text>
            </LinearGradient>
          </Pressable>
        </Animated.View>

        {/* ── Quote ───────────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(50).duration(400)}>
          <Text style={[styles.quote, { color: t.textMuted }]}>
            {getQuote()}
          </Text>
        </Animated.View>

        {/* ── Streak Card ─────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(80).duration(400)}>
          <View style={[
            styles.streakCard,
            cardStyle(isDark),
            isDark && { borderColor: 'rgba(255,107,107,0.12)' },
          ]}>
            <View style={styles.streakLeft}>
              <Flame size={16} color={V1.coral} strokeWidth={2.5} />
              <Text style={[styles.streakText, { color: t.text }]}>
                {streak} day streak
              </Text>
            </View>
            <View style={styles.streakRight}>
              <Text style={[styles.streakProgress, { color: t.textSecondary }]}>
                {todayTasksDone.done}/{Math.max(todayTasksDone.total, 5)} today
              </Text>
              <View style={styles.progressDots}>
                {Array.from({ length: Math.min(Math.max(todayTasksDone.total, 5), 5) }).map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.progressDot,
                      {
                        backgroundColor: i < todayTasksDone.done
                          ? V1.coral
                          : isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)',
                      },
                    ]}
                  />
                ))}
              </View>
            </View>
          </View>
        </Animated.View>

        {/* ── Hero Mission Card ─────────────────────────────────────── */}
        {heroRoom && (
          <Animated.View entering={FadeInDown.delay(120).duration(400)}>
            <AnimatedPressable
              onPress={() => handleOpenRoom(heroRoom.id)}
              onPressIn={heroPress.onPressIn}
              onPressOut={heroPress.onPressOut}
              style={heroPress.animatedStyle}
            >
              <View style={[
                styles.heroCard,
                isDark && styles.heroCardDarkBorder,
              ]}>
                {/* Room photo background */}
                {heroRoom.photos && heroRoom.photos.length > 0 ? (
                  <Image
                    source={{ uri: heroRoom.photos[0].uri }}
                    style={styles.heroImage}
                    contentFit="cover"
                  />
                ) : (
                  <View style={[styles.heroImage, { backgroundColor: isDark ? '#2A2A2A' : '#D0D0D0' }]} />
                )}

                {/* Gradient overlay */}
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.85)']}
                  locations={[0, 0.4, 1]}
                  style={styles.heroGradient}
                />

                {/* Content */}
                <View style={styles.heroContent}>
                  {/* Pills row */}
                  <View style={styles.heroPillsRow}>
                    <View style={[styles.heroPill, { backgroundColor: V1.coral }]}>
                      <Text style={styles.heroPillText}>Today's Mission</Text>
                    </View>
                    <Text style={styles.heroTimeText}>~{heroTotalMinutes} min</Text>
                  </View>

                  {/* Room name */}
                  <Text style={styles.heroRoomName}>
                    {heroRoom.name} Refresh
                  </Text>
                  <Text style={styles.heroTaskCount}>
                    {heroTaskCount} quick tasks to feel the difference
                  </Text>

                  {/* Start Blitz CTA */}
                  <Pressable
                    onPress={() => handleStartBlitz(heroRoom.id)}
                    style={({ pressed }) => [
                      styles.blitzCta,
                      styles.blitzCtaShadow,
                      { backgroundColor: V1.coral, opacity: pressed ? 0.88 : 1 },
                    ]}
                  >
                    <Text style={styles.blitzCtaText}>Start 15-Min Blitz</Text>
                  </Pressable>
                </View>
              </View>
            </AnimatedPressable>
          </Animated.View>
        )}

        {/* ── YOUR SPACES ─────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(160).duration(400)}>
          <Text style={[styles.sectionTitle, { color: t.textMuted }]}>
            YOUR SPACES
          </Text>

          <View style={styles.spacesRow}>
            {rooms.slice(0, 4).map((room, idx) => {
              const totalTasks = (room.tasks || []).length;
              const doneTasks = (room.tasks || []).filter(t => t.completed).length;
              const progress = totalTasks > 0 ? (doneTasks / totalTasks) * 100 : 0;
              const freshness = getFreshnessLabel(progress);
              const sp = spacePresses[idx] || spacePresses[0];

              return (
                <AnimatedPressable
                  key={room.id}
                  onPress={() => handleOpenRoom(room.id)}
                  onPressIn={sp.onPressIn}
                  onPressOut={sp.onPressOut}
                  style={[
                    sp.animatedStyle,
                    styles.spaceCard,
                    cardStyle(isDark),
                  ]}
                >
                  <Text style={styles.spaceIcon}>{getRoomIcon(room.type)}</Text>
                  <Text style={[styles.spaceName, { color: t.text }]} numberOfLines={1}>
                    {room.name}
                  </Text>

                  {/* Freshness bar */}
                  <View style={[styles.freshnessBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
                    <View style={[styles.freshnessBarFill, { width: `${Math.max(progress, 5)}%`, backgroundColor: freshness.color }]} />
                  </View>

                  <Text style={[styles.freshnessLabel, { color: freshness.color }]}>
                    {freshness.label}
                  </Text>
                </AnimatedPressable>
              );
            })}
          </View>

          {/* Add room button if under limit */}
          {(isPro || rooms.length < FREE_ROOM_LIMIT) && (
            <Pressable
              onPress={handleScanRoom}
              style={({ pressed }) => [
                styles.addRoomButton,
                { borderColor: t.border, opacity: pressed ? 0.88 : 1 },
              ]}
            >
              <Camera size={18} color={t.textSecondary} />
              <Text style={[styles.addRoomText, { color: t.textSecondary }]}>Scan another room</Text>
            </Pressable>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: SPACING.screenPadding },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '700',
    fontFamily: DISPLAY_FONT,
    letterSpacing: -0.4,
  },
  timeContext: {
    fontSize: 14,
    fontWeight: '400',
    fontFamily: BODY_FONT,
    marginTop: 2,
  },
  mascotAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mascotInitial: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: DISPLAY_FONT,
    color: '#FFFFFF',
  },

  // Quote
  quote: {
    fontSize: 13,
    fontStyle: 'italic',
    fontFamily: BODY_FONT,
    marginBottom: 12,
    marginTop: 8,
  },

  // Streak Card
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: SPACING.cardPadding,
    marginBottom: SPACING.cardPadding,
  },
  streakLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  streakText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: BODY_FONT,
  },
  streakRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  streakProgress: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: BODY_FONT,
  },
  progressDots: {
    flexDirection: 'row',
    gap: 4,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  // Hero Mission Card
  heroCard: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    marginBottom: 24,
    height: 240,
    position: 'relative',
  },
  heroCardDarkBorder: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  heroContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.screenPadding,
  },
  heroPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  heroPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  heroPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: BODY_FONT,
  },
  heroTimeText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '500',
    fontFamily: BODY_FONT,
  },
  heroRoomName: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    fontFamily: DISPLAY_FONT,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  heroTaskCount: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontFamily: BODY_FONT,
    marginBottom: 14,
  },
  blitzCta: {
    paddingVertical: 14,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
  },
  blitzCtaShadow: {
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  blitzCtaText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    fontFamily: BODY_FONT,
  },

  // Section Title
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: BODY_FONT,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: SPACING.itemGap,
    marginTop: 8,
  },

  // Space Cards
  spacesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.itemGap,
  },
  spaceCard: {
    width: (SCREEN_WIDTH - SPACING.screenPadding * 2 - SPACING.itemGap) / 2,
    padding: SPACING.cardPadding,
    overflow: 'hidden',
  },
  spaceIcon: {
    fontSize: 24,
    marginBottom: 10,
  },
  spaceName: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: BODY_FONT,
    marginBottom: 10,
  },
  freshnessBar: {
    height: 5,
    borderRadius: 3,
    marginBottom: 6,
  },
  freshnessBarFill: {
    height: 5,
    borderRadius: 3,
  },
  freshnessLabel: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: BODY_FONT,
  },

  // Add Room
  addRoomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginTop: SPACING.itemGap,
  },
  addRoomText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: BODY_FONT,
  },

  // Empty State
  emptyStateCenter: {
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: SPACING.screenPadding,
  },
  emptyMascotCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    fontFamily: DISPLAY_FONT,
    textAlign: 'center',
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 15,
    fontFamily: BODY_FONT,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  scanCtaWrapper: {
    width: '100%',
  },
  scanCta: {
    paddingVertical: 16,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
  },
  scanCtaShadow: {
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  scanCtaText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: BODY_FONT,
  },

  // Tip Card
  tipCardWrapper: {
    marginTop: 24,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: SPACING.cardPadding,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  tipBulb: {
    fontSize: 18,
  },
  tipText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: BODY_FONT,
    flex: 1,
  },
});
