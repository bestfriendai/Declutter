/**
 * Declutterly -- Rooms List Screen (V1 Pencil Design)
 * Room cards with thumbnails, freshness bars, and empty state.
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
import { Room } from '@/types/declutter';
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
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
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

function getFreshnessInfo(room: Room): { label: string; color: string; percent: number } {
  const tasks = room.tasks ?? [];
  const total = tasks.length;
  if (total === 0) return { label: 'New', color: V1.blue, percent: 0 };

  const completed = tasks.filter((t) => t.completed).length;
  const percent = Math.round((completed / total) * 100);

  if (percent >= 90) return { label: 'Sparkling', color: V1.green, percent };
  if (percent >= 60) return { label: 'Fresh', color: V1.green, percent };
  if (percent >= 30) return { label: 'Needs love', color: V1.amber, percent };
  return { label: 'Needs attention', color: V1.coral, percent };
}

function getTaskSummary(room: Room): string {
  const tasks = room.tasks ?? [];
  const pending = tasks.filter((t) => !t.completed).length;
  if (tasks.length === 0) return 'Ready for first scan';
  return `${pending} task${pending === 1 ? '' : 's'}`;
}

function RoomCard({
  isDark,
  room,
  onPress,
}: {
  isDark: boolean;
  room: Room;
  onPress: () => void;
}) {
  const t = getTheme(isDark);
  const freshness = getFreshnessInfo(room);
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
      accessibilityLabel={`Open ${room.name}`}
      style={animatedStyle}
    >
      <View style={[styles.roomCard, cardStyle(isDark)]}>
        {/* Thumbnail */}
        <View style={styles.roomThumb}>
          {photo?.uri ? (
            <Image
              source={{ uri: photo.uri }}
              style={styles.roomImage}
              contentFit="cover"
              transition={200}
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

          {/* Freshness bar */}
          <View style={[styles.freshnessTrack, {
            backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
          }]}>
            <View
              style={[styles.freshnessFill, {
                backgroundColor: freshness.color,
                width: `${Math.max(freshness.percent, 4)}%`,
              }]}
            />
          </View>

          <Text style={[styles.roomStatus, { color: t.textSecondary }]}>
            {freshness.label}{'  \u00B7  '}{summary}
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

export default function RoomsScreen() {
  const rawScheme = useColorScheme();
  const isDark = rawScheme === 'dark';
  const reducedMotion = useReducedMotion();
  const insets = useSafeAreaInsets();
  const { rooms, setActiveRoom } = useDeclutter();

  const safeRooms = rooms ?? [];
  const isLoading = rooms === undefined || rooms === null;
  const t = getTheme(isDark);

  // Header "+" press animation
  const addBtnScale = useSharedValue(1);
  const addBtnAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: addBtnScale.value }],
  }));

  // Count rooms needing attention
  const needsAttention = useMemo(() => {
    return safeRooms.filter((r) => {
      const tasks = r.tasks ?? [];
      const completed = tasks.filter((tk) => tk.completed).length;
      return tasks.length > 0 && completed / tasks.length < 0.5;
    }).length;
  }, [safeRooms]);

  const handleScan = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setActiveRoom(null);
    router.push('/camera');
  }, [setActiveRoom]);

  const handleRoomPress = useCallback((roomId: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/room/${roomId}`);
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
            onPress={handleScan}
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
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={t.text} />
          </View>
        ) : safeRooms.length === 0 ? (
          <Animated.View entering={enter(60)}>
            <EmptyState isDark={isDark} onAdd={handleScan} />
          </Animated.View>
        ) : (
          <View style={styles.roomList}>
            {safeRooms.map((room, index) => (
              <Animated.View
                key={room.id}
                entering={enter(60 + index * 40)}
              >
                <RoomCard
                  isDark={isDark}
                  room={room}
                  onPress={() => handleRoomPress(room.id)}
                />
              </Animated.View>
            ))}

            {/* Add new room dashed card */}
            <Animated.View entering={enter(60 + safeRooms.length * 40)}>
              <Pressable
                onPress={handleScan}
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
    </View>
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
  freshnessTrack: {
    height: 5,
    borderRadius: 2.5,
    overflow: 'hidden',
  },
  freshnessFill: {
    height: '100%',
    borderRadius: 2.5,
  },
  roomStatus: {
    fontFamily: BODY_FONT,
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.1,
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
});
