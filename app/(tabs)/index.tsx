/**
 * Declutterly - Home Screen
 * Apple TV 2025 inspired design with horizontal carousels and glass effects
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  Image,
} from 'react-native';
import { useColorScheme } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInRight,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, RoomColors } from '@/constants/Colors';
import { Typography } from '@/theme/typography';
import { useDeclutter } from '@/context/DeclutterContext';
import { Room, ROOM_TYPE_INFO, RoomType, MASCOT_PERSONALITIES, FOCUS_QUOTES } from '@/types/declutter';
import { getMotivation } from '@/services/gemini';

import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { ContentRow } from '@/components/ui/ContentRow';
import { SingleRing } from '@/components/ui/ActivityRings';
import { StatCard } from '@/components/ui/StatCard';
import { CollectibleSpawn } from '@/components/features/CollectibleSpawn';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.75;

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
    mascot,
    activeSpawn,
    dismissSpawn,
    collectionStats,
  } = useDeclutter();

  const [showAddRoom, setShowAddRoom] = useState(false);
  const [motivationQuote, setMotivationQuote] = useState<string>(
    FOCUS_QUOTES[Math.floor(Math.random() * FOCUS_QUOTES.length)]
  );

  // Load motivation quote
  useEffect(() => {
    const loadMotivation = async () => {
      try {
        const context = rooms.length > 0
          ? `User has ${rooms.length} rooms and ${stats.totalTasksCompleted} tasks completed`
          : 'New user just getting started';
        const aiMotivation = await getMotivation(context);
        if (aiMotivation) setMotivationQuote(aiMotivation);
      } catch {
        setMotivationQuote(FOCUS_QUOTES[Math.floor(Math.random() * FOCUS_QUOTES.length)]);
      }
    };
    loadMotivation();
    const interval = setInterval(() => {
      setMotivationQuote(FOCUS_QUOTES[Math.floor(Math.random() * FOCUS_QUOTES.length)]);
    }, 300000);
    return () => clearInterval(interval);
  }, [rooms.length, stats.totalTasksCompleted]);

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
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[Typography.caption1, { color: colors.textSecondary }]}>
              Welcome back,
            </Text>
            <Text style={[Typography.largeTitle, { color: colors.text }]}>
              {user?.name || 'Friend'}
            </Text>
            <View style={styles.levelBadge}>
              <LinearGradient
                colors={[...colors.gradientPrimary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.levelGradient}
              />
              <Text style={[Typography.caption1Medium, { color: '#FFF' }]}>
                Level {stats.level} • {stats.xp} XP
              </Text>
            </View>
          </View>

          {mascot && (
            <Pressable
              onPress={() => router.push('/mascot')}
              style={({ pressed }) => [styles.mascotButton, pressed && { opacity: 0.8 }]}
            >
              <Text style={styles.mascotEmoji}>
                {MASCOT_PERSONALITIES[mascot.personality].emoji}
              </Text>
              <Text style={[Typography.caption2, { color: colors.textSecondary }]}>
                {mascot.name}
              </Text>
            </Pressable>
          )}
        </Animated.View>

        {/* Hero Section - Empty State or Featured Room */}
        {rooms.length === 0 ? (
          <Animated.View entering={FadeIn.delay(200)} style={styles.heroSection}>
            <GlassCard variant="hero" padding={24} style={styles.heroCard}>
              <View style={styles.heroContent}>
                <Text style={styles.heroEmoji}>🏠✨</Text>
                <Text style={[Typography.title1, { color: colors.text, textAlign: 'center' }]}>
                  Ready to declutter?
                </Text>
                <Text style={[Typography.body, { color: colors.textSecondary, textAlign: 'center', marginTop: 8 }]}>
                  Snap a photo of any room and our AI will create a personalized cleaning plan
                </Text>

                <View style={styles.heroSteps}>
                  <View style={styles.stepItem}>
                    <Text style={styles.stepEmoji}>📸</Text>
                    <Text style={[Typography.caption1, { color: colors.textSecondary }]}>Capture</Text>
                  </View>
                  <Text style={[Typography.title3, { color: colors.textTertiary }]}>→</Text>
                  <View style={styles.stepItem}>
                    <Text style={styles.stepEmoji}>🤖</Text>
                    <Text style={[Typography.caption1, { color: colors.textSecondary }]}>AI Plan</Text>
                  </View>
                  <Text style={[Typography.title3, { color: colors.textTertiary }]}>→</Text>
                  <View style={styles.stepItem}>
                    <Text style={styles.stepEmoji}>✅</Text>
                    <Text style={[Typography.caption1, { color: colors.textSecondary }]}>Clean</Text>
                  </View>
                </View>

                <GlassButton
                  title="Capture Your First Room"
                  onPress={() => router.push('/camera')}
                  variant="primary"
                  size="large"
                  icon={<Text style={{ fontSize: 18 }}>📸</Text>}
                  fullWidth
                />

                <Pressable
                  onPress={() => setShowAddRoom(true)}
                  style={({ pressed }) => [styles.textButton, pressed && { opacity: 0.7 }]}
                >
                  <Text style={[Typography.subheadlineMedium, { color: colors.primary }]}>
                    Or add a room manually
                  </Text>
                </Pressable>
              </View>
            </GlassCard>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeIn.delay(200)} style={styles.heroSection}>
            {/* Stats Cards Row */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.statsRow}
            >
              <StatCard
                value={totalProgress + '%'}
                label="Overall"
                variant="gradient"
                size="medium"
                animationDelay={100}
              />
              <StatCard
                value={stats.totalTasksCompleted}
                label="Tasks Done"
                variant="glass"
                size="medium"
                icon={<Text style={{ fontSize: 20 }}>✅</Text>}
                animationDelay={150}
              />
              <StatCard
                value={stats.currentStreak}
                label="Day Streak"
                variant="glass"
                size="medium"
                icon={<Text style={{ fontSize: 20 }}>🔥</Text>}
                animationDelay={200}
              />
              <StatCard
                value={collectionStats.uniqueCollected}
                label="Collected"
                variant="glass"
                size="medium"
                icon={<Text style={{ fontSize: 20 }}>✨</Text>}
                animationDelay={250}
              />
            </ScrollView>
          </Animated.View>
        )}

        {/* Quick Actions */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.section}>
          <Text style={[Typography.title2, { color: colors.text, marginBottom: 12, paddingHorizontal: 16 }]}>
            Quick Actions
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.actionsRow}
          >
            <QuickActionCard
              emoji="📸"
              title="Capture"
              subtitle="Scan a room"
              color={colors.primary}
              onPress={() => router.push('/camera')}
              delay={0}
            />
            <QuickActionCard
              emoji="⏱️"
              title="Focus"
              subtitle="25 min session"
              color="#34D399"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push('/focus?duration=25');
              }}
              delay={50}
            />
            <QuickActionCard
              emoji="✨"
              title="Collection"
              subtitle={`${collectionStats.uniqueCollected} items`}
              color="#FBBF24"
              onPress={() => router.push('/collection')}
              delay={100}
            />
            <QuickActionCard
              emoji="🏆"
              title="Achievements"
              subtitle={`${stats.badges.filter(b => b.unlockedAt).length} unlocked`}
              color="#F472B6"
              onPress={() => router.push('/achievements')}
              delay={150}
            />
          </ScrollView>
        </Animated.View>

        {/* Active Rooms - Horizontal Carousel */}
        {activeRooms.length > 0 && (
          <Animated.View entering={FadeInDown.delay(400)} style={styles.section}>
            <ContentRow
              title="Your Spaces"
              subtitle={`${activeRooms.length} rooms in progress`}
              onSeeAllPress={() => {}}
              showSeeAll={false}
              itemWidth={CARD_WIDTH * 0.6}
              itemSpacing={12}
            >
              {activeRooms.map((room, index) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  onPress={() => handleRoomPress(room)}
                  index={index}
                />
              ))}
              <AddRoomCard onPress={() => setShowAddRoom(true)} />
            </ContentRow>
          </Animated.View>
        )}

        {/* Completed Rooms */}
        {completedRooms.length > 0 && (
          <Animated.View entering={FadeInDown.delay(500)} style={styles.section}>
            <ContentRow
              title="Completed"
              subtitle={`${completedRooms.length} rooms sparkling clean`}
              itemWidth={CARD_WIDTH * 0.5}
              itemSpacing={12}
            >
              {completedRooms.map((room, index) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  onPress={() => handleRoomPress(room)}
                  index={index}
                  isCompleted
                />
              ))}
            </ContentRow>
          </Animated.View>
        )}

        {/* Mascot Card */}
        {mascot && rooms.length > 0 && (
          <Animated.View entering={FadeInDown.delay(600)} style={[styles.section, { paddingHorizontal: 16 }]}>
            <GlassCard
              variant="interactive"
              onPress={() => router.push('/mascot')}
              padding={16}
            >
              <View style={styles.mascotCard}>
                <Text style={{ fontSize: 48 }}>
                  {MASCOT_PERSONALITIES[mascot.personality].emoji}
                </Text>
                <View style={styles.mascotInfo}>
                  <Text style={[Typography.headline, { color: colors.text }]}>
                    {mascot.name} says:
                  </Text>
                  <Text style={[Typography.subheadline, { color: colors.textSecondary }]}>
                    {getMascotMessage(mascot.mood, stats.currentStreak)}
                  </Text>
                </View>
                <Text style={[Typography.title2, { color: colors.textTertiary }]}>›</Text>
              </View>
            </GlassCard>
          </Animated.View>
        )}

        {/* Motivation Quote */}
        <Animated.View entering={FadeInDown.delay(700)} style={[styles.section, { paddingHorizontal: 16 }]}>
          <GlassCard variant="subtle" padding={20}>
            <View style={styles.quoteCard}>
              <Text style={[Typography.caption1, { color: colors.textSecondary, marginBottom: 8 }]}>
                Today's motivation
              </Text>
              <Text style={[Typography.body, { color: colors.text, fontStyle: 'italic', textAlign: 'center' }]}>
                "{motivationQuote}"
              </Text>
              <Text style={{ fontSize: 20, marginTop: 8 }}>✨</Text>
            </View>
          </GlassCard>
        </Animated.View>

        {/* Add Room Modal */}
        {showAddRoom && (
          <Animated.View entering={FadeIn} style={[styles.section, { paddingHorizontal: 16 }]}>
            <GlassCard variant="elevated" padding={20}>
              <Text style={[Typography.title2, { color: colors.text, marginBottom: 16 }]}>
                Add a Room
              </Text>
              <View style={styles.roomTypeGrid}>
                {(Object.keys(ROOM_TYPE_INFO) as RoomType[]).map((type, index) => (
                  <Pressable
                    key={type}
                    onPress={() => handleAddRoom(type)}
                    style={({ pressed }) => [
                      styles.roomTypeButton,
                      {
                        backgroundColor: pressed
                          ? colors.cardPressed
                          : colorScheme === 'dark'
                          ? 'rgba(255,255,255,0.05)'
                          : 'rgba(0,0,0,0.03)',
                      },
                    ]}
                  >
                    <Text style={{ fontSize: 28 }}>{ROOM_TYPE_INFO[type].emoji}</Text>
                    <Text style={[Typography.caption1, { color: colors.text, marginTop: 4 }]}>
                      {ROOM_TYPE_INFO[type].label}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Pressable
                onPress={() => setShowAddRoom(false)}
                style={styles.cancelButton}
              >
                <Text style={[Typography.subheadlineMedium, { color: colors.textSecondary }]}>
                  Cancel
                </Text>
              </Pressable>
            </GlassCard>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

// Quick Action Card Component
function QuickActionCard({
  emoji,
  title,
  subtitle,
  color,
  onPress,
  delay,
}: {
  emoji: string;
  title: string;
  subtitle: string;
  color: string;
  onPress: () => void;
  delay: number;
}) {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View entering={FadeInRight.delay(delay)}>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
        onPressIn={() => { scale.value = withSpring(0.95); }}
        onPressOut={() => { scale.value = withSpring(1); }}
      >
        <Animated.View style={[styles.actionCard, animatedStyle]}>
          <BlurView
            intensity={60}
            tint={colorScheme === 'dark' ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />
          <View style={[StyleSheet.absoluteFill, {
            backgroundColor: colorScheme === 'dark' ? 'rgba(30,30,30,0.6)' : 'rgba(255,255,255,0.7)',
          }]} />
          <View style={[styles.actionIconBg, { backgroundColor: color + '20' }]}>
            <Text style={{ fontSize: 24 }}>{emoji}</Text>
          </View>
          <Text style={[Typography.subheadlineMedium, { color: colors.text }]}>{title}</Text>
          <Text style={[Typography.caption1, { color: colors.textSecondary }]}>{subtitle}</Text>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

// Room Card Component
function RoomCard({
  room,
  onPress,
  index,
  isCompleted = false,
}: {
  room: Room;
  onPress: () => void;
  index: number;
  isCompleted?: boolean;
}) {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const roomColor = RoomColors[room.type] || colors.primary;
  const completedTasks = room.tasks.filter(t => t.completed).length;
  const totalTasks = room.tasks.length;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.roomCard,
        {
          backgroundColor: colorScheme === 'dark' ? '#1C1C1E' : '#FFFFFF',
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
    >
      {/* Room photo or gradient background */}
      <LinearGradient
        colors={[roomColor + '40', roomColor + '10']}
        style={styles.roomCardGradient}
      />

      {room.photos.length > 0 && room.photos[0].uri && (
        <Image
          source={{ uri: room.photos[0].uri }}
          style={styles.roomCardImage}
        />
      )}

      <View style={styles.roomCardContent}>
        <View style={styles.roomCardHeader}>
          <Text style={{ fontSize: 32 }}>{room.emoji}</Text>
          {isCompleted && (
            <View style={styles.completedBadge}>
              <Text style={{ fontSize: 12 }}>✓</Text>
            </View>
          )}
        </View>

        <Text style={[Typography.headline, { color: colors.text }]} numberOfLines={1}>
          {room.name}
        </Text>

        <Text style={[Typography.caption1, { color: colors.textSecondary }]}>
          {totalTasks > 0 ? `${completedTasks}/${totalTasks} tasks` : 'No tasks yet'}
        </Text>

        {/* Progress bar */}
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBarBg, { backgroundColor: colors.separator }]}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${room.currentProgress}%`,
                  backgroundColor: roomColor,
                },
              ]}
            />
          </View>
          <Text style={[Typography.caption2, { color: colors.textSecondary }]}>
            {room.currentProgress}%
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

// Add Room Card
function AddRoomCard({ onPress }: { onPress: () => void }) {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.addRoomCard,
        {
          borderColor: colors.border,
          backgroundColor: pressed ? colors.cardPressed : 'transparent',
        },
      ]}
    >
      <Text style={{ fontSize: 32, opacity: 0.5 }}>+</Text>
      <Text style={[Typography.subheadline, { color: colors.textSecondary }]}>
        Add Room
      </Text>
    </Pressable>
  );
}

// Helper function
function getMascotMessage(mood: string, streak: number): string {
  if (streak >= 7) return "We're on fire! Keep it up!";
  if (streak >= 3) return "Great streak going! You're doing amazing!";

  switch (mood) {
    case 'ecstatic': return "I'm so happy we're cleaning together!";
    case 'happy': return "Ready to tackle some tasks? Let's go!";
    case 'excited': return "Ooh, what should we clean next?";
    case 'content': return "Nice and tidy! Want to do more?";
    case 'neutral': return "Hey there! Miss cleaning with you!";
    case 'sad': return "I miss you! Let's clean something together?";
    default: return "Let's make today sparkle!";
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  headerLeft: {
    flex: 1,
  },
  levelBadge: {
    marginTop: 8,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  levelGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  mascotButton: {
    alignItems: 'center',
    marginLeft: 16,
  },
  mascotEmoji: {
    fontSize: 44,
  },
  heroSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  heroCard: {
    width: '100%',
  },
  heroContent: {
    alignItems: 'center',
  },
  heroEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  heroSteps: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginVertical: 24,
  },
  stepItem: {
    alignItems: 'center',
  },
  stepEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  textButton: {
    marginTop: 16,
    paddingVertical: 8,
  },
  statsRow: {
    paddingHorizontal: 16,
    gap: 12,
  },
  section: {
    marginBottom: 24,
  },
  actionsRow: {
    paddingHorizontal: 16,
    gap: 12,
  },
  actionCard: {
    width: 100,
    padding: 16,
    borderRadius: 20,
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  actionIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  roomCard: {
    width: CARD_WIDTH * 0.6,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  roomCardGradient: {
    height: 80,
  },
  roomCardImage: {
    ...StyleSheet.absoluteFillObject,
    height: 80,
    opacity: 0.6,
  },
  roomCardContent: {
    padding: 16,
  },
  roomCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  completedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#34D399',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  progressBarBg: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  addRoomCard: {
    width: CARD_WIDTH * 0.6,
    height: 180,
    borderRadius: 20,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mascotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  mascotInfo: {
    flex: 1,
  },
  quoteCard: {
    alignItems: 'center',
  },
  roomTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  roomTypeButton: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
});
