/**
 * RoomGrid -- Room cards grid with freshness indicators
 * Uses FlatList when 10+ rooms for performance.
 * Dynamic spacePresses array instead of hardcoded 4.
 */

import React, { useCallback, useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Camera } from 'lucide-react-native';
import {
  V1,
  BODY_FONT,
  RADIUS,
  SPACING,
  cardStyle,
} from '@/constants/designTokens';
import type { Room } from '@/types/declutter';
import type { RoomFreshness } from '@/hooks/useRoomFreshness';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ── Helpers ─────────────────────────────────────────────────────────────────

function getRoomIcon(type: string): string {
  switch (type) {
    case 'bedroom': return '\uD83D\uDECF\uFE0F';
    case 'kitchen': return '\uD83C\uDF73';
    case 'bathroom': return '\uD83D\uDEBF';
    case 'livingRoom': return '\uD83D\uDECB\uFE0F';
    case 'office': return '\uD83D\uDCBB';
    case 'garage': return '\uD83D\uDD27';
    case 'closet': return '\uD83D\uDC55';
    default: return '\uD83C\uDFE0';
  }
}

function getFreshnessLabel(progress: number): { label: string; color: string } {
  if (progress >= 90) return { label: 'Sparkling', color: V1.green };
  if (progress >= 70) return { label: 'Fresh', color: V1.green };
  if (progress >= 40) return { label: 'Getting there', color: V1.amber };
  return { label: 'Needs love', color: V1.coral };
}

// ── Scale press hook ────────────────────────────────────────────────────────

function useScalePress(scaleTo = 0.97) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const onPressIn = useCallback(() => {
    scale.value = withSpring(scaleTo, { damping: 15, stiffness: 200 });
  }, [scale, scaleTo]);
  const onPressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
  }, [scale]);
  return { animatedStyle, onPressIn, onPressOut };
}

// ── Room Card ───────────────────────────────────────────────────────────────

interface RoomCardProps {
  room: Room;
  freshness: { label: string; color: string };
  freshnessValue: number;
  isStartHere: boolean;
  isDark: boolean;
  cardWidth: number;
  onPress: () => void;
}

function RoomCard({ room, freshness, freshnessValue, isStartHere, isDark, cardWidth, onPress }: RoomCardProps) {
  const t = isDark ? V1.dark : V1.light;
  const sp = useScalePress(0.97);

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={sp.onPressIn}
      onPressOut={sp.onPressOut}
      accessibilityRole="button"
      accessibilityLabel={`Room: ${room.name}, ${freshnessValue}% fresh, ${freshness.label}`}
      accessibilityHint="Double tap to open room"
      style={[
        sp.animatedStyle,
        styles.spaceCard,
        cardStyle(isDark),
        { width: cardWidth },
      ]}
    >
      {isStartHere && (
        <View style={styles.startHereBadge}>
          <Text style={styles.startHereBadgeText}>Start Here</Text>
        </View>
      )}
      <View style={[styles.freshnessDot, { backgroundColor: freshness.color }]} />
      <Text style={styles.spaceIcon}>{getRoomIcon(room.type)}</Text>
      <Text style={[styles.spaceName, { color: t.text }]} numberOfLines={1}>
        {room.name}
      </Text>
      <View
        style={[
          styles.freshnessBar,
          { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' },
        ]}
      >
        <View
          style={[
            styles.freshnessBarFill,
            { width: `${Math.max(freshnessValue, 5)}%`, backgroundColor: freshness.color },
          ]}
        />
      </View>
      <Text style={[styles.freshnessLabel, { color: freshness.color }]}>{freshness.label}</Text>
    </AnimatedPressable>
  );
}

// ── Props ───────────────────────────────────────────────────────────────────

interface RoomGridProps {
  rooms: Room[];
  roomFreshness: RoomFreshness[];
  startHereRoomId: string | null;
  isDark: boolean;
  reducedMotion: boolean;
  isPro: boolean;
  freeRoomLimit: number;
  onOpenRoom: (roomId: string) => void;
  onScanRoom: () => void;
}

export function RoomGrid({
  rooms,
  roomFreshness,
  startHereRoomId,
  isDark,
  reducedMotion,
  isPro,
  freeRoomLimit,
  onOpenRoom,
  onScanRoom,
}: RoomGridProps) {
  const t = isDark ? V1.dark : V1.light;
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const cardWidth = (SCREEN_WIDTH - SPACING.screenPadding * 2 - SPACING.itemGap) / 2;

  const roomsWithFreshness = useMemo(
    () =>
      rooms.map((room) => {
        const rf = roomFreshness.find((f) => f.roomId === room.id);
        const freshness = rf
          ? { label: rf.label, color: rf.color }
          : getFreshnessLabel(room.currentProgress);
        const freshnessValue = rf ? rf.freshness : room.currentProgress;
        return { room, freshness, freshnessValue };
      }),
    [rooms, roomFreshness],
  );

  const useFlatList = rooms.length >= 10;

  const renderItem = useCallback(
    ({ item, index }: { item: (typeof roomsWithFreshness)[0]; index: number }) => (
      <RoomCard
        room={item.room}
        freshness={item.freshness}
        freshnessValue={item.freshnessValue}
        isStartHere={startHereRoomId === item.room.id}
        isDark={isDark}
        cardWidth={cardWidth}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onOpenRoom(item.room.id);
        }}
      />
    ),
    [isDark, cardWidth, startHereRoomId, onOpenRoom],
  );

  return (
    <Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(160).duration(400)}>
      <Text style={[styles.sectionTitle, { color: t.textMuted }]}>YOUR SPACES</Text>

      {useFlatList ? (
        <FlatList
          data={roomsWithFreshness}
          renderItem={renderItem}
          keyExtractor={(item) => item.room.id}
          numColumns={2}
          columnWrapperStyle={styles.flatListRow}
          scrollEnabled={false}
        />
      ) : (
        <View style={styles.spacesRow}>
          {roomsWithFreshness.map((item) => (
            <RoomCard
              key={item.room.id}
              room={item.room}
              freshness={item.freshness}
              freshnessValue={item.freshnessValue}
              isStartHere={startHereRoomId === item.room.id}
              isDark={isDark}
              cardWidth={cardWidth}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onOpenRoom(item.room.id);
              }}
            />
          ))}
        </View>
      )}

      {/* Add room button */}
      {(isPro || rooms.length < freeRoomLimit) && (
        <Pressable
          onPress={onScanRoom}
          accessibilityRole="button"
          accessibilityLabel="Scan another room with camera"
          accessibilityHint="Double tap to open camera"
          style={({ pressed }) => [
            styles.addRoomButton,
            { borderColor: t.border, opacity: pressed ? 0.88 : 1 },
          ]}
        >
          <Camera size={18} color={t.textSecondary} />
          <Text style={[styles.addRoomText, { color: t.textSecondary }]}>
            Scan another room
          </Text>
        </Pressable>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: BODY_FONT,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: SPACING.itemGap,
    marginTop: 8,
  },
  spacesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.itemGap,
  },
  flatListRow: {
    gap: SPACING.itemGap,
  },
  spaceCard: {
    padding: SPACING.cardPadding,
    overflow: 'hidden',
  },
  startHereBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: V1.coral,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    zIndex: 1,
  },
  startHereBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    fontFamily: BODY_FONT,
    letterSpacing: 0.3,
  },
  freshnessDot: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
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
});
