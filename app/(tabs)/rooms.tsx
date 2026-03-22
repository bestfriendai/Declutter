/**
 * Declutterly -- Rooms List Screen (V1 Pencil Design)
 * Room cards with thumbnails, freshness bars, and empty state.
 *
 * Improvements:
 * - Uses useRoomFreshness hook for time-based decay
 * - Sorts rooms by urgency (lowest freshness first)
 * - Animated freshness bar fill on mount
 * - "Most urgent" callout card
 * - Shimmer skeleton animation
 * - Flame indicator on rooms < 25% fresh
 */

import {
  V1,
  BODY_FONT,
  DISPLAY_FONT,
  RADIUS,
  SPACING,
  cardStyle,
  getTheme,
  CARD_SHADOW,
} from '@/constants/designTokens';
import { useDeclutter } from '@/context/DeclutterContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useRoomFreshness, getMostUrgentRoom, type RoomFreshness } from '@/hooks/useRoomFreshness';
import { Room, CleaningTask, ROOM_TYPE_INFO, type RoomType } from '@/types/declutter';
import { generateId } from '@/utils/id';
import {
  Plus,
  ChevronRight,
  LayoutGrid,
  Bed,
  UtensilsCrossed,
  Droplets,
  Tv,
  Monitor,
  Car,
  Shirt,
  Box,
  Sparkles,
  Clock,
  Scan,
  Flame,
  AlertCircle,
} from 'lucide-react-native';
import { useSubscription, FREE_ROOM_LIMIT } from '@/hooks/useSubscription';
import type { LucideIcon } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ScreenErrorBoundary } from '@/components/ErrorBoundary';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const ROOM_ICON_MAP: Record<string, LucideIcon> = {
  bedroom: Bed,
  kitchen: UtensilsCrossed,
  bathroom: Droplets,
  livingRoom: Tv,
  living_room: Tv,
  office: Monitor,
  garage: Car,
  closet: Shirt,
  other: Box,
};

function getRoomIcon(type?: string): LucideIcon {
  if (!type) return Box;
  return ROOM_ICON_MAP[type] || Box;
}

function getTaskSummary(room: Room): string {
  const tasks = room.tasks ?? [];
  const pending = tasks.filter((t) => !t.completed).length;
  if (tasks.length === 0) return 'Ready for first scan';
  return `${pending} task${pending === 1 ? '' : 's'}`;
}

// ─── Shimmer Skeleton ─────────────────────────────────────────────────────────
function SkeletonShimmer({ width, height, borderRadius = 4, isDark }: {
  width: number | string;
  height: number;
  borderRadius?: number;
  isDark: boolean;
}) {
  const translateX = useSharedValue(-100);

  useEffect(() => {
    translateX.value = withRepeat(
      withTiming(100, { duration: 1200 }),
      -1,
      false,
    );
  }, []);

  const shimmerStyle = useAnimatedStyle(() => ({
    // Reanimated types don't support percentage strings for translateX, but RN does at runtime
    transform: [{ translateX: `${translateX.value}%` as unknown as number }],
  }));

  return (
    <View style={{
      // DimensionValue accepts string | number but ViewStyle narrowly types width as number
      width: width as unknown as number,
      height,
      borderRadius,
      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
      overflow: 'hidden',
    }}>
      <Animated.View style={[StyleSheet.absoluteFillObject, shimmerStyle]}>
        <LinearGradient
          colors={[
            'transparent',
            isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.03)',
            'transparent',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}

// ─── Room Card with animated freshness ────────────────────────────────────────
function RoomCard({
  isDark,
  room,
  freshness,
  onPress,
}: {
  isDark: boolean;
  room: Room;
  freshness: RoomFreshness;
  onPress: () => void;
}) {
  const t = getTheme(isDark);
  const summary = getTaskSummary(room);
  const photo = room.photos?.[0];
  const Icon = getRoomIcon(room.type);

  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 150 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
  }, [scale]);

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="button"
      accessibilityLabel={`Open ${room.name}, last cleaned ${freshness.label}`}
      style={animatedStyle}
    >
      <View style={[styles.roomCard, cardStyle(isDark)]}>
        {/* Urgency indicator for low freshness */}
        {freshness.freshness < 25 && (
          <View style={styles.urgencyIndicator}>
            <Flame size={12} color={V1.coral} />
          </View>
        )}

        {/* Thumbnail */}
        <View style={styles.roomThumb}>
          {photo?.uri ? (
            <Image
              source={{ uri: photo.uri }}
              style={styles.roomImage}
              contentFit="cover"
              transition={200}
              placeholder={{ blurhash: 'LGF5]+Yk^6#M@-5c,1J5@[or[Q6.' }}
              cachePolicy="memory-disk"
            />
          ) : (
            <View style={[styles.roomImagePlaceholder, {
              backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.03)',
            }]}>
              <Icon size={22} color={t.textMuted} />
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.roomContent}>
          <Text style={[styles.roomName, { color: t.text }]} numberOfLines={1}>
            {room.name}
          </Text>

          <Text style={[styles.roomStatus, { color: freshness.color }]}>
            {freshness.label}
          </Text>
          <Text style={[styles.roomStatusSub, { color: t.textSecondary }]}>
            {summary}
          </Text>
        </View>

        {/* Chevron */}
        <ChevronRight size={18} color={t.textMuted} />
      </View>
    </AnimatedPressable>
  );
}

function EmptyState({
  isDark,
  onAdd,
}: {
  isDark: boolean;
  onAdd: () => void;
}) {
  const t = getTheme(isDark);

  return (
    <View style={styles.emptyContainer}>
      {/* Icon */}
      <View style={styles.emptyIconWrap}>
        <LinearGradient
          colors={isDark
            ? ['rgba(255,107,107,0.20)', 'rgba(255,107,107,0.08)']
            : ['rgba(255,107,107,0.14)', 'rgba(255,107,107,0.06)']
          }
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <LayoutGrid size={36} color={V1.coral} />
      </View>

      <Text style={[styles.emptyTitle, { color: t.text }]}>No rooms yet</Text>
      <Text style={[styles.emptySubtitle, { color: t.textSecondary }]}>
        Scan a room to get started. Each room{'\n'}gets its own task list and freshness tracker.
      </Text>
      <Text style={[styles.emptyTip, { color: t.textMuted }]}>
        Tip: Start with the room that bothers you the most.
      </Text>

      {/* CTA */}
      <Pressable
        onPress={onAdd}
        accessibilityRole="button"
        accessibilityLabel="Add Your First Room"
        style={({ pressed }) => [{ opacity: pressed ? 0.88 : 1, width: '100%' }]}
      >
        <LinearGradient
          colors={['#FF6B6B', '#FF5252']}
          style={styles.ctaButton}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.ctaText}>Add Your First Room</Text>
        </LinearGradient>
      </Pressable>

      {/* Feature pills */}
      <View style={styles.featureList}>
        <FeaturePill isDark={isDark} icon={Scan} text="AI spots what needs cleaning" color={V1.amber} />
        <FeaturePill isDark={isDark} icon={Sparkles} text="Tasks broken into small steps" color={V1.green} />
        <FeaturePill isDark={isDark} icon={Clock} text="Time estimates for each task" color={V1.coral} />
      </View>
    </View>
  );
}

function FeaturePill({
  isDark,
  icon,
  text,
  color,
}: {
  isDark: boolean;
  icon: LucideIcon;
  text: string;
  color?: string;
}) {
  const t = getTheme(isDark);
  const iconColor = color || V1.green;
  return (
    <View style={[styles.featurePill, {
      backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF',
      borderWidth: isDark ? 0 : 1,
      borderColor: isDark ? 'transparent' : '#E5E7EB',
    }]}>
      {React.createElement(icon, { size: 16, color: iconColor })}
      <Text style={[styles.featureText, { color: t.text }]}>{text}</Text>
    </View>
  );
}

// ─── Most Urgent Room Callout ─────────────────────────────────────────────────
function UrgentRoomCallout({
  isDark,
  urgentRoom,
  onPress,
  reducedMotion,
}: {
  isDark: boolean;
  urgentRoom: RoomFreshness;
  onPress: () => void;
  reducedMotion: boolean;
}) {
  const t = getTheme(isDark);

  return (
    <Animated.View entering={reducedMotion ? undefined : FadeInDown.duration(380).delay(40)}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}
        accessibilityRole="button"
        accessibilityLabel={`${urgentRoom.roomName} needs your attention`}
      >
        <LinearGradient
          colors={isDark
            ? ['rgba(255,107,107,0.12)', 'rgba(255,107,107,0.04)']
            : ['rgba(255,107,107,0.08)', 'rgba(255,107,107,0.02)']
          }
          style={{
            borderRadius: RADIUS.lg,
            padding: SPACING.cardPadding,
            borderWidth: 1,
            borderColor: `${V1.coral}30`,
          }}
        >
          <Text style={{
            fontFamily: BODY_FONT, fontSize: 12, fontWeight: '700',
            color: V1.coral, letterSpacing: 0.5, marginBottom: 6,
          }}>
            NEEDS YOUR ATTENTION
          </Text>
          <Text style={{
            fontFamily: DISPLAY_FONT, fontSize: 18, fontWeight: '700',
            color: t.text, marginBottom: 4,
          }}>
            {urgentRoom.roomName}
          </Text>
          <Text style={{
            fontFamily: BODY_FONT, fontSize: 13, color: t.textSecondary,
          }}>
            Last cleaned: {urgentRoom.label}
          </Text>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

// ─── Template tasks for manual room setup ─────────────────────────────────────
const MANUAL_ROOM_TYPES: { type: RoomType; label: string; emoji: string }[] = [
  { type: 'bedroom', label: 'Bedroom', emoji: '\uD83D\uDECF\uFE0F' },
  { type: 'kitchen', label: 'Kitchen', emoji: '\uD83C\uDF73' },
  { type: 'bathroom', label: 'Bathroom', emoji: '\uD83D\uDEBF' },
  { type: 'livingRoom', label: 'Living Room', emoji: '\uD83D\uDECB\uFE0F' },
  { type: 'office', label: 'Office', emoji: '\uD83D\uDCBC' },
  { type: 'closet', label: 'Closet', emoji: '\uD83D\uDC54' },
];

function getTemplateTasks(roomType: RoomType): Omit<CleaningTask, 'id'>[] {
  const templates: Record<string, Omit<CleaningTask, 'id'>[]> = {
    bedroom: [
      { title: 'Make the bed', description: 'Pull up sheets and straighten pillows', emoji: '\uD83D\uDECF\uFE0F', priority: 'high', difficulty: 'quick', estimatedMinutes: 3, completed: false, phase: 1, phaseName: 'Quick Wins', visualImpact: 'high' },
      { title: 'Pick up clothes from floor', description: 'Gather all clothing items and sort into laundry/closet piles', emoji: '\uD83D\uDC55', priority: 'high', difficulty: 'quick', estimatedMinutes: 5, completed: false, phase: 1, phaseName: 'Quick Wins', visualImpact: 'high' },
      { title: 'Clear nightstand', description: 'Remove cups, wrappers, and items that don\'t belong', emoji: '\uD83E\uDDF9', priority: 'medium', difficulty: 'quick', estimatedMinutes: 3, completed: false, phase: 1, phaseName: 'Quick Wins', visualImpact: 'medium' },
      { title: 'Put away shoes', description: 'Gather shoes and return to closet or rack', emoji: '\uD83D\uDC5F', priority: 'medium', difficulty: 'quick', estimatedMinutes: 2, completed: false, phase: 2, phaseName: 'Surface Level', visualImpact: 'medium' },
      { title: 'Quick vacuum or sweep', description: 'Hit the main floor area', emoji: '\uD83E\uDDF9', priority: 'low', difficulty: 'medium', estimatedMinutes: 10, completed: false, phase: 3, phaseName: 'Deep Clean', visualImpact: 'high' },
    ],
    kitchen: [
      { title: 'Clear sink \u2014 wash or load dishwasher', description: 'Get all dishes out of the sink', emoji: '\uD83C\uDF7D\uFE0F', priority: 'high', difficulty: 'medium', estimatedMinutes: 10, completed: false, phase: 1, phaseName: 'Quick Wins', visualImpact: 'high' },
      { title: 'Wipe counters', description: 'Clear and wipe all counter surfaces', emoji: '\u2728', priority: 'high', difficulty: 'quick', estimatedMinutes: 5, completed: false, phase: 1, phaseName: 'Quick Wins', visualImpact: 'high' },
      { title: 'Take out trash', description: 'Empty the kitchen trash and recycling', emoji: '\uD83D\uDDD1\uFE0F', priority: 'high', difficulty: 'quick', estimatedMinutes: 3, completed: false, phase: 1, phaseName: 'Quick Wins', visualImpact: 'medium' },
      { title: 'Put away food and groceries', description: 'Return items to fridge, pantry, or cabinets', emoji: '\uD83E\uDD6B', priority: 'medium', difficulty: 'quick', estimatedMinutes: 5, completed: false, phase: 2, phaseName: 'Surface Level', visualImpact: 'medium' },
      { title: 'Sweep or mop floor', description: 'Quick sweep of the kitchen floor', emoji: '\uD83E\uDDF9', priority: 'low', difficulty: 'medium', estimatedMinutes: 8, completed: false, phase: 3, phaseName: 'Deep Clean', visualImpact: 'high' },
    ],
    bathroom: [
      { title: 'Clear counter clutter', description: 'Put away products and toss empties', emoji: '\uD83E\uDDF4', priority: 'high', difficulty: 'quick', estimatedMinutes: 3, completed: false, phase: 1, phaseName: 'Quick Wins', visualImpact: 'high' },
      { title: 'Wipe mirror and sink', description: 'Quick wipe with a cloth or paper towel', emoji: '\uD83E\uDE9E', priority: 'high', difficulty: 'quick', estimatedMinutes: 3, completed: false, phase: 1, phaseName: 'Quick Wins', visualImpact: 'high' },
      { title: 'Hang up towels', description: 'Fold and hang any towels on the floor', emoji: '\uD83D\uDEC1', priority: 'medium', difficulty: 'quick', estimatedMinutes: 2, completed: false, phase: 1, phaseName: 'Quick Wins', visualImpact: 'medium' },
      { title: 'Empty bathroom trash', description: 'Replace the bag while you\'re at it', emoji: '\uD83D\uDDD1\uFE0F', priority: 'medium', difficulty: 'quick', estimatedMinutes: 2, completed: false, phase: 2, phaseName: 'Surface Level', visualImpact: 'low' },
      { title: 'Quick toilet scrub', description: 'Swish the bowl and wipe the seat', emoji: '\uD83D\uDEBD', priority: 'low', difficulty: 'quick', estimatedMinutes: 3, completed: false, phase: 3, phaseName: 'Deep Clean', visualImpact: 'medium' },
    ],
  };
  const defaultTasks: Omit<CleaningTask, 'id'>[] = [
    { title: 'Pick up trash and recycling', description: 'Grab a bag and collect all visible trash', emoji: '\uD83D\uDDD1\uFE0F', priority: 'high', difficulty: 'quick', estimatedMinutes: 5, completed: false, phase: 1, phaseName: 'Quick Wins', visualImpact: 'high' },
    { title: 'Clear the floor', description: 'Pick up everything on the floor and put it on a surface', emoji: '\uD83E\uDDF9', priority: 'high', difficulty: 'quick', estimatedMinutes: 5, completed: false, phase: 1, phaseName: 'Quick Wins', visualImpact: 'high' },
    { title: 'Clear flat surfaces', description: 'Tables, desks, shelves \u2014 remove items that don\'t belong', emoji: '\u2728', priority: 'medium', difficulty: 'medium', estimatedMinutes: 10, completed: false, phase: 2, phaseName: 'Surface Level', visualImpact: 'high' },
    { title: 'Put things away', description: 'Return misplaced items to where they belong', emoji: '\uD83D\uDCE6', priority: 'medium', difficulty: 'medium', estimatedMinutes: 10, completed: false, phase: 2, phaseName: 'Surface Level', visualImpact: 'medium' },
    { title: 'Quick dust and wipe', description: 'Wipe down main surfaces', emoji: '\uD83E\uDDFD', priority: 'low', difficulty: 'medium', estimatedMinutes: 10, completed: false, phase: 3, phaseName: 'Deep Clean', visualImpact: 'medium' },
  ];
  return templates[roomType] || defaultTasks;
}

function RoomsScreenContent() {
  const rawScheme = useColorScheme();
  const isDark = rawScheme === 'dark';
  const reducedMotion = useReducedMotion();
  const insets = useSafeAreaInsets();
  const { rooms, setActiveRoom, addRoom, setTasksForRoom } = useDeclutter();
  const { isPro } = useSubscription();

  // State for manual room setup
  const [showRoomTypePicker, setShowRoomTypePicker] = React.useState(false);

  const safeRooms = rooms ?? [];
  const isLoading = rooms === undefined || rooms === null;
  const t = getTheme(isDark);

  // Use the real freshness hook
  const freshnessList = useRoomFreshness(safeRooms);

  // Sort rooms by urgency (lowest freshness first)
  const sortedRooms = useMemo(() => {
    return [...safeRooms].sort((a, b) => {
      const aFresh = freshnessList.find(f => f.roomId === a.id)?.freshness ?? 100;
      const bFresh = freshnessList.find(f => f.roomId === b.id)?.freshness ?? 100;
      return aFresh - bFresh;
    });
  }, [safeRooms, freshnessList]);

  // Most urgent room callout
  const urgentRoom = useMemo(() => {
    if (safeRooms.length === 0) return null;
    return getMostUrgentRoom(safeRooms);
  }, [safeRooms]);

  // Pull-to-refresh - trigger recalculation
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    // The Convex reactivity will auto-refresh; we just need to toggle the state
    setTimeout(() => setIsRefreshing(false), 600);
  }, []);

  // Header "+" press animation
  const addBtnScale = useSharedValue(1);
  const addBtnAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: addBtnScale.value }],
  }));

  // Count rooms needing attention
  const needsAttention = useMemo(() => {
    return freshnessList.filter(f => f.freshness < 50).length;
  }, [freshnessList]);

  const handleScan = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!isPro && safeRooms.length >= FREE_ROOM_LIMIT) {
      Alert.alert('Room limit reached', 'Upgrade to Pro to add more rooms.', [
        { text: 'Later', style: 'cancel' },
        { text: 'Upgrade', onPress: () => router.push('/paywall') },
      ]);
      return;
    }
    setActiveRoom(null);
    router.push('/camera');
  }, [setActiveRoom, isPro, safeRooms.length]);

  // Create a template room from a selected type
  const handleCreateTemplateRoom = useCallback(async (roomType: RoomType) => {
    const info = ROOM_TYPE_INFO[roomType] || { label: 'Room', emoji: '\uD83C\uDFE0' };
    try {
      const room = await addRoom({
        name: info.label,
        type: roomType,
        emoji: info.emoji,
        messLevel: 50,
      });
      const tasks = getTemplateTasks(roomType);
      setTasksForRoom(room.id, tasks.map((t) => ({ ...t, id: generateId() })));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.push({ pathname: '/room/[id]', params: { id: room.id } });
    } catch {
      Alert.alert('Error', 'Could not create room. Please try again.');
    }
  }, [addRoom, setTasksForRoom]);

  // Show add room options: scan or manual
  const handleAddRoom = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!isPro && safeRooms.length >= FREE_ROOM_LIMIT) {
      Alert.alert('Room limit reached', 'Upgrade to Pro to add more rooms.', [
        { text: 'Later', style: 'cancel' },
        { text: 'Upgrade', onPress: () => router.push('/paywall') },
      ]);
      return;
    }
    Alert.alert('Add a Room', 'How would you like to set up your room?', [
      {
        text: 'Scan with camera',
        onPress: () => {
          setActiveRoom(null);
          router.push('/camera');
        },
      },
      {
        text: 'Set up manually',
        onPress: () => setShowRoomTypePicker(true),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, [isPro, safeRooms.length, setActiveRoom]);

  // Handle room type selection for manual setup
  const handleSelectRoomType = useCallback((roomType: RoomType) => {
    setShowRoomTypePicker(false);
    handleCreateTemplateRoom(roomType);
  }, [handleCreateTemplateRoom]);

  const handleRoomPress = useCallback((roomId: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: '/room/[id]', params: { id: roomId } });
  }, []);

  const handleAddPressIn = useCallback(() => {
    addBtnScale.value = withSpring(0.9, { damping: 15, stiffness: 150 });
  }, [addBtnScale]);

  const handleAddPressOut = useCallback(() => {
    addBtnScale.value = withSpring(1, { damping: 15, stiffness: 150 });
  }, [addBtnScale]);

  const enter = (delay: number) =>
    reducedMotion ? undefined : FadeInDown.duration(380).delay(delay);

  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 14, paddingBottom: insets.bottom + 120 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={V1.coral}
            colors={[V1.coral]}
          />
        }
      >
        {/* Header */}
        <Animated.View entering={enter(0)} style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[styles.title, { color: t.text }]}>Your Rooms</Text>
            {safeRooms.length > 0 && (
              <Text style={[styles.subtitle, { color: t.textSecondary }]}>
                {safeRooms.length} room{safeRooms.length === 1 ? '' : 's'}
                {needsAttention > 0 ? `  \u00B7  ${needsAttention} need attention` : ''}
              </Text>
            )}
          </View>

          <AnimatedPressable
            onPress={handleAddRoom}
            onPressIn={handleAddPressIn}
            onPressOut={handleAddPressOut}
            accessibilityRole="button"
            accessibilityLabel="Add a new room"
            style={addBtnAnimatedStyle}
          >
            <View style={[
              styles.addButton,
              { backgroundColor: V1.coral },
              !isDark && {
                shadowColor: V1.coral,
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.25,
                shadowRadius: 6,
                elevation: 3,
              },
            ]}>
              <Plus size={20} color="#FFFFFF" strokeWidth={2.5} />
            </View>
          </AnimatedPressable>
        </Animated.View>

        {isLoading ? (
          /* Shimmer skeleton loading */
          <View style={styles.roomList}>
            {[0, 1, 2].map((i) => (
              <Animated.View key={i} entering={enter(60 + i * 40)}>
                <View style={[styles.roomCard, cardStyle(isDark)]}>
                  <SkeletonShimmer width={60} height={60} borderRadius={14} isDark={isDark} />
                  <View style={styles.roomContent}>
                    <SkeletonShimmer width="60%" height={14} borderRadius={4} isDark={isDark} />
                    <SkeletonShimmer width="100%" height={5} borderRadius={2.5} isDark={isDark} />
                    <SkeletonShimmer width="40%" height={12} borderRadius={4} isDark={isDark} />
                  </View>
                </View>
              </Animated.View>
            ))}
          </View>
        ) : safeRooms.length === 0 ? (
          <Animated.View entering={enter(60)}>
            <EmptyState isDark={isDark} onAdd={handleAddRoom} />
          </Animated.View>
        ) : (
          <View style={styles.roomList} accessibilityRole="list">
            {/* Most urgent room callout */}
            {urgentRoom && urgentRoom.freshness < 50 && (
              <UrgentRoomCallout
                isDark={isDark}
                urgentRoom={urgentRoom}
                onPress={() => handleRoomPress(urgentRoom.roomId)}
                reducedMotion={reducedMotion}
              />
            )}

            {sortedRooms.map((room, index) => {
              const freshness = freshnessList.find(f => f.roomId === room.id) ?? {
                roomId: room.id,
                roomName: room.name,
                freshness: 50,
                decayRate: 5,
                daysSinceClean: 0,
                color: V1.amber,
                label: 'Unknown',
              };

              return (
                <Animated.View
                  key={room.id}
                  entering={enter(60 + index * 40)}
                >
                  <RoomCard
                    isDark={isDark}
                    room={room}
                    freshness={freshness}
                    onPress={() => handleRoomPress(room.id)}
                  />
                </Animated.View>
              );
            })}

            {/* Add new room dashed card */}
            <Animated.View entering={enter(60 + sortedRooms.length * 40)}>
              <Pressable
                onPress={handleAddRoom}
                accessibilityRole="button"
                accessibilityLabel="Add a new room"
                style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
              >
                <View style={[styles.addRoomCard, {
                  borderColor: `rgba(255,107,107,0.20)`,
                }]}>
                  <Plus size={18} color={V1.coral} />
                  <Text style={[styles.addRoomText, { color: t.textSecondary }]}>
                    Add a new room
                  </Text>
                </View>
              </Pressable>
            </Animated.View>
          </View>
        )}
      </ScrollView>

      {/* Room Type Picker Modal for Manual Setup */}
      <Modal
        visible={showRoomTypePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRoomTypePicker(false)}
      >
        <Pressable
          style={styles.roomPickerOverlay}
          onPress={() => setShowRoomTypePicker(false)}
        >
          <Pressable
            style={[styles.roomPickerModal, { backgroundColor: isDark ? V1.dark.card : '#FFFFFF' }]}
            onPress={() => {}}
          >
            <Text style={[styles.roomPickerTitle, { color: t.text }]}>Pick a room type</Text>
            <Text style={[styles.roomPickerSubtitle, { color: t.textSecondary }]}>
              We'll add starter tasks for you
            </Text>
            <View style={styles.roomPickerGrid}>
              {MANUAL_ROOM_TYPES.map((rt) => (
                <Pressable
                  key={rt.type}
                  onPress={() => handleSelectRoomType(rt.type)}
                  style={({ pressed }) => [
                    styles.roomPickerItem,
                    {
                      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)',
                      borderColor: t.border,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Create ${rt.label} room`}
                >
                  <Text style={styles.roomPickerEmoji}>{rt.emoji}</Text>
                  <Text style={[styles.roomPickerLabel, { color: t.text }]}>{rt.label}</Text>
                </Pressable>
              ))}
            </View>
            <Pressable
              onPress={() => setShowRoomTypePicker(false)}
              style={[styles.roomPickerCancel, { borderColor: t.border }]}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
            >
              <Text style={[styles.roomPickerCancelText, { color: t.textSecondary }]}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

export default function RoomsScreen() {
  return (
    <ScreenErrorBoundary screenName="rooms">
      <RoomsScreenContent />
    </ScreenErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.screenPadding,
    gap: 16,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontFamily: DISPLAY_FONT,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: BODY_FONT,
    fontSize: 13,
    fontWeight: '500',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingWrap: {
    minHeight: 280,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Room list
  roomList: {
    gap: SPACING.itemGap,
  },

  // Room card
  roomCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
  },
  roomThumb: {
    width: 60,
    height: 60,
    borderRadius: 14,
    overflow: 'hidden',
  },
  roomImage: {
    width: 60,
    height: 60,
  },
  roomImagePlaceholder: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  roomContent: {
    flex: 1,
    gap: 4,
  },
  roomName: {
    fontFamily: BODY_FONT,
    fontSize: 15,
    fontWeight: '700',
  },
  roomStatus: {
    fontFamily: BODY_FONT,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  roomStatusSub: {
    fontFamily: BODY_FONT,
    fontSize: 11,
    fontWeight: '400',
    letterSpacing: 0.1,
  },
  urgencyIndicator: {
    position: 'absolute',
    top: 6,
    right: 6,
    zIndex: 1,
  },

  // Add room card
  addRoomCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 64,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  addRoomText: {
    fontFamily: BODY_FONT,
    fontSize: 14,
    fontWeight: '600',
  },

  // Empty state
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 40,
    gap: 16,
  },
  emptyIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    overflow: 'hidden',
  },
  emptyTitle: {
    fontFamily: DISPLAY_FONT,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontFamily: BODY_FONT,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    textAlign: 'center',
  },
  emptyTip: {
    fontFamily: BODY_FONT,
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 4,
  },
  ctaButton: {
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  ctaText: {
    fontFamily: BODY_FONT,
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  featureList: {
    gap: 12,
    marginTop: 8,
    width: '100%',
  },
  featurePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 14,
  },
  featureText: {
    fontFamily: BODY_FONT,
    fontSize: 14,
    fontWeight: '500',
  },

  // Room type picker modal
  roomPickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  roomPickerModal: {
    width: '100%',
    borderRadius: 20,
    padding: 24,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
  roomPickerTitle: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: DISPLAY_FONT,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  roomPickerSubtitle: {
    fontSize: 14,
    fontFamily: BODY_FONT,
    textAlign: 'center',
    marginBottom: 4,
  },
  roomPickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  roomPickerItem: {
    width: '30%',
    flexGrow: 1,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    gap: 6,
  },
  roomPickerEmoji: {
    fontSize: 28,
  },
  roomPickerLabel: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: BODY_FONT,
  },
  roomPickerCancel: {
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: 4,
  },
  roomPickerCancelText: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: BODY_FONT,
  },
});
