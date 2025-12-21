/**
 * Declutterly - Home Screen
 * Clean, minimal Apple-style design
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  Image,
  RefreshControl,
} from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, RoomColors } from '@/constants/Colors';
import { useDeclutter } from '@/context/DeclutterContext';
import { Room, ROOM_TYPE_INFO, RoomType, FOCUS_QUOTES } from '@/types/declutter';
import { isApiKeyConfigured } from '@/services/gemini';

import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { SingleRing } from '@/components/ui/ActivityRings';
import { CollectibleSpawn } from '@/components/features/CollectibleSpawn';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function HomeScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();

  const {
    user,
    rooms,
    stats,
    addRoom,
    setActiveRoom,
    activeSpawn,
    dismissSpawn,
    collectionStats,
  } = useDeclutter();

  const [showAddRoom, setShowAddRoom] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [motivationQuote] = useState<string>(
    FOCUS_QUOTES[Math.floor(Math.random() * FOCUS_QUOTES.length)]
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleAddRoom = (type: RoomType) => {
    const info = ROOM_TYPE_INFO[type];
    const newRoom = addRoom({
      name: info.label,
      type,
      emoji: info.emoji,
      messLevel: 0,
    });
    setShowAddRoom(false);
    if (newRoom) {
      setActiveRoom(newRoom.id);
      router.push(`/room/${newRoom.id}`);
    }
  };

  const handleRoomPress = (room: Room) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveRoom(room.id);
    router.push(`/room/${room.id}`);
  };

  const totalProgress = rooms.length > 0
    ? Math.round(rooms.reduce((acc, r) => acc + r.currentProgress, 0) / rooms.length)
    : 0;

  const activeRooms = rooms.filter(r => r.currentProgress < 100);
  const completedRooms = rooms.filter(r => r.currentProgress === 100);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Collectible Spawn Overlay */}
      {activeSpawn && (
        <CollectibleSpawn
          spawn={activeSpawn}
          onCollect={() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)}
          onDismiss={dismissSpawn}
        />
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 120 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.textSecondary} />
        }
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>
              {getGreeting()}
            </Text>
            <Text style={[styles.userName, { color: colors.text }]}>
              {user?.name || 'Welcome'}
            </Text>
          </View>
          <Pressable
            onPress={() => router.push('/settings')}
            style={({ pressed }) => [styles.avatarButton, pressed && { opacity: 0.7 }]}
          >
            <View style={[styles.avatar, { backgroundColor: colors.primary + '20' }]}>
              <Text style={styles.avatarText}>
                {(user?.name || 'U')[0].toUpperCase()}
              </Text>
            </View>
          </Pressable>
        </Animated.View>

        {/* Stats Row */}
        {rooms.length > 0 && (
          <Animated.View entering={FadeInDown.duration(500).delay(100)} style={styles.statsRow}>
            <StatItem value={totalProgress} label="Progress" suffix="%" colors={colors} />
            <View style={[styles.statDivider, { backgroundColor: colors.separator }]} />
            <StatItem value={stats.totalTasksCompleted} label="Tasks Done" colors={colors} />
            <View style={[styles.statDivider, { backgroundColor: colors.separator }]} />
            <StatItem value={stats.currentStreak} label="Day Streak" suffix="🔥" colors={colors} />
          </Animated.View>
        )}

        {/* Empty State */}
        {rooms.length === 0 && (
          <Animated.View entering={FadeIn.duration(600)} style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.primary + '10' }]}>
              <Text style={styles.emptyEmoji}>🏠</Text>
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              Ready to declutter?
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Take a photo of any room and get an AI-powered cleaning plan
            </Text>
            <GlassButton
              title="Scan Your First Room"
              onPress={() => router.push('/camera')}
              variant="primary"
              size="large"
              style={{ marginTop: 24, width: '100%' }}
            />
            <Pressable
              onPress={() => setShowAddRoom(true)}
              style={styles.textButton}
            >
              <Text style={[styles.textButtonLabel, { color: colors.textSecondary }]}>
                or add manually
              </Text>
            </Pressable>
          </Animated.View>
        )}

        {/* Quick Actions */}
        <Animated.View entering={FadeInDown.duration(500).delay(200)} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
          <View style={styles.actionsRow}>
            <ActionButton
              icon="📸"
              label="Scan"
              onPress={() => router.push('/camera')}
              colors={colors}
            />
            <ActionButton
              icon="⏱"
              label="Focus"
              onPress={() => router.push('/focus?duration=25')}
              colors={colors}
            />
            <ActionButton
              icon="✨"
              label="Collection"
              badge={collectionStats.uniqueCollected > 0 ? collectionStats.uniqueCollected : undefined}
              onPress={() => router.push('/collection')}
              colors={colors}
            />
            <ActionButton
              icon="🏆"
              label="Badges"
              onPress={() => router.push('/achievements')}
              colors={colors}
            />
          </View>
        </Animated.View>

        {/* Active Rooms */}
        {activeRooms.length > 0 && (
          <Animated.View entering={FadeInDown.duration(500).delay(300)} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>In Progress</Text>
              <Pressable onPress={() => setShowAddRoom(true)}>
                <Text style={[styles.addButton, { color: colors.primary }]}>+ Add</Text>
              </Pressable>
            </View>
            {activeRooms.map((room, index) => (
              <RoomListItem
                key={room.id}
                room={room}
                onPress={() => handleRoomPress(room)}
                colors={colors}
                delay={index * 50}
              />
            ))}
          </Animated.View>
        )}

        {/* Completed Rooms */}
        {completedRooms.length > 0 && (
          <Animated.View entering={FadeInDown.duration(500).delay(400)} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Completed</Text>
            {completedRooms.map((room, index) => (
              <RoomListItem
                key={room.id}
                room={room}
                onPress={() => handleRoomPress(room)}
                colors={colors}
                isCompleted
                delay={index * 50}
              />
            ))}
          </Animated.View>
        )}

        {/* Motivation */}
        {rooms.length > 0 && (
          <Animated.View entering={FadeInDown.duration(500).delay(500)} style={styles.section}>
            <View style={[styles.quoteCard, { backgroundColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }]}>
              <Text style={[styles.quoteText, { color: colors.textSecondary }]}>
                "{motivationQuote}"
              </Text>
            </View>
          </Animated.View>
        )}
      </ScrollView>

      {/* Add Room Modal */}
      {showAddRoom && (
        <AddRoomModal
          onAdd={handleAddRoom}
          onClose={() => setShowAddRoom(false)}
          colors={colors}
          colorScheme={colorScheme}
        />
      )}
    </View>
  );
}

// Stat Item
function StatItem({
  value,
  label,
  suffix = '',
  colors,
}: {
  value: number;
  label: string;
  suffix?: string;
  colors: typeof Colors.dark;
}) {
  return (
    <View style={styles.statItem}>
      <Text style={[styles.statValue, { color: colors.text }]}>
        {value}{suffix}
      </Text>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

// Action Button
function ActionButton({
  icon,
  label,
  badge,
  onPress,
  colors,
}: {
  icon: string;
  label: string;
  badge?: number;
  onPress: () => void;
  colors: typeof Colors.dark;
}) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      onPressIn={() => { scale.value = withSpring(0.95); }}
      onPressOut={() => { scale.value = withSpring(1); }}
    >
      <Animated.View style={[styles.actionButton, animatedStyle]}>
        <View style={[styles.actionIcon, { backgroundColor: colors.card }]}>
          <Text style={styles.actionEmoji}>{icon}</Text>
          {badge !== undefined && (
            <View style={styles.actionBadge}>
              <Text style={styles.actionBadgeText}>{badge}</Text>
            </View>
          )}
        </View>
        <Text style={[styles.actionLabel, { color: colors.textSecondary }]}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

// Room List Item
function RoomListItem({
  room,
  onPress,
  colors,
  isCompleted = false,
  delay = 0,
}: {
  room: Room;
  onPress: () => void;
  colors: typeof Colors.dark;
  isCompleted?: boolean;
  delay?: number;
}) {
  const completedTasks = room.tasks.filter(t => t.completed).length;
  const totalTasks = room.tasks.length;

  return (
    <Animated.View entering={FadeIn.delay(delay)}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.roomItem,
          { backgroundColor: colors.card },
          pressed && { opacity: 0.8 },
        ]}
      >
        <View style={styles.roomEmoji}>
          <Text style={{ fontSize: 28 }}>{room.emoji}</Text>
        </View>
        <View style={styles.roomInfo}>
          <Text style={[styles.roomName, { color: colors.text }]}>{room.name}</Text>
          <Text style={[styles.roomMeta, { color: colors.textSecondary }]}>
            {totalTasks > 0 ? `${completedTasks}/${totalTasks} tasks` : 'No tasks yet'}
          </Text>
        </View>
        {isCompleted ? (
          <View style={styles.completedCheck}>
            <Text style={{ fontSize: 16 }}>✓</Text>
          </View>
        ) : (
          <SingleRing
            progress={room.currentProgress}
            size={44}
            strokeWidth={4}
            color={colors.primary}
            showValue={false}
          >
            <Text style={[styles.ringValue, { color: colors.text }]}>{room.currentProgress}%</Text>
          </SingleRing>
        )}
      </Pressable>
    </Animated.View>
  );
}

// Add Room Modal
function AddRoomModal({
  onAdd,
  onClose,
  colors,
  colorScheme,
}: {
  onAdd: (type: RoomType) => void;
  onClose: () => void;
  colors: typeof Colors.dark;
  colorScheme: string;
}) {
  return (
    <Animated.View entering={FadeIn} style={styles.modalOverlay}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <BlurView intensity={80} tint={colorScheme as 'dark' | 'light'} style={styles.modalContent}>
        <View style={[styles.modalInner, { backgroundColor: colorScheme === 'dark' ? 'rgba(30,30,30,0.9)' : 'rgba(255,255,255,0.95)' }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Add Room</Text>
          <View style={styles.roomTypeGrid}>
            {(Object.keys(ROOM_TYPE_INFO) as RoomType[]).map((type) => (
              <Pressable
                key={type}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onAdd(type);
                }}
                style={({ pressed }) => [
                  styles.roomTypeItem,
                  { backgroundColor: pressed ? colors.cardPressed : 'transparent' },
                ]}
              >
                <Text style={{ fontSize: 32 }}>{ROOM_TYPE_INFO[type].emoji}</Text>
                <Text style={[styles.roomTypeLabel, { color: colors.text }]}>
                  {ROOM_TYPE_INFO[type].label}
                </Text>
              </Pressable>
            ))}
          </View>
          <Pressable onPress={onClose} style={styles.modalCancel}>
            <Text style={[styles.modalCancelText, { color: colors.textSecondary }]}>Cancel</Text>
          </Pressable>
        </View>
      </BlurView>
    </Animated.View>
  );
}

// Helper
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 2,
  },
  userName: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  avatarButton: {},
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6366F1',
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    marginBottom: 24,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyEmoji: {
    fontSize: 36,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 22,
  },
  textButton: {
    marginTop: 16,
    paddingVertical: 8,
  },
  textButtonLabel: {
    fontSize: 14,
    fontWeight: '500',
  },

  // Sections
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.3,
    marginBottom: 12,
  },
  addButton: {
    fontSize: 15,
    fontWeight: '600',
  },

  // Actions
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    alignItems: 'center',
    width: (SCREEN_WIDTH - 60) / 4,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  actionEmoji: {
    fontSize: 24,
  },
  actionBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#6366F1',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  actionBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFF',
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '500',
  },

  // Room Items
  roomItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
  },
  roomEmoji: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roomInfo: {
    flex: 1,
    marginLeft: 12,
  },
  roomName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  roomMeta: {
    fontSize: 13,
    fontWeight: '500',
  },
  ringValue: {
    fontSize: 10,
    fontWeight: '700',
  },
  completedCheck: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#34D399',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Quote
  quoteCard: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  quoteText: {
    fontSize: 14,
    fontWeight: '500',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 22,
  },

  // Modal
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  modalInner: {
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
  },
  roomTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  roomTypeItem: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  roomTypeLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
  },
  modalCancel: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 8,
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
