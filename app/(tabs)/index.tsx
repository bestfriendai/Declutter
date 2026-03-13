/**
 * Declutterly — Home Screen (Apple 2026)
 * Smart greeting, tinted glass cards, room progress, quick actions
 */

import { Colors, ColorTokens } from '@/constants/Colors';
import { GlassCard } from '@/components/ui/GlassCard';
import { useDeclutter } from '@/context/DeclutterContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Typography } from '@/theme/typography';
import { Spacing, BorderRadius } from '@/theme/spacing';
import { MASCOT_PERSONALITIES } from '@/types/declutter';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useMemo } from 'react';
import {
  Dimensions,
  Pressable,
  RefreshControl,
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

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 48 - 12) / 2;

// ─────────────────────────────────────────────────────────────────────────────
// Smart Greeting
// ─────────────────────────────────────────────────────────────────────────────
function getGreeting(name: string): { greeting: string; emoji: string; subtitle: string } {
  const hour = new Date().getHours();
  const firstName = name.split(' ')[0] || 'Friend';

  if (hour < 5)  return { greeting: `Night owl, ${firstName}`,  emoji: '🌙', subtitle: 'Still up? Even small wins count.' };
  if (hour < 12) return { greeting: `Good morning, ${firstName}`, emoji: '☀️', subtitle: 'Fresh start — what will you tackle?' };
  if (hour < 17) return { greeting: `Good afternoon, ${firstName}`, emoji: '🌤️', subtitle: 'Afternoon energy — let\'s use it!' };
  if (hour < 20) return { greeting: `Good evening, ${firstName}`, emoji: '🌅', subtitle: 'Wind down with a quick win.' };
  return { greeting: `Good night, ${firstName}`, emoji: '🌙', subtitle: 'One last task before bed?' };
}

// ─────────────────────────────────────────────────────────────────────────────
// Quick Action Button
// ─────────────────────────────────────────────────────────────────────────────
interface QuickActionProps {
  emoji: string;
  label: string;
  sublabel?: string;
  onPress: () => void;
  gradient: readonly [string, string];
  colors: ColorTokens;
}

function QuickActionButton({ emoji, label, sublabel, onPress, gradient, colors: _colors }: QuickActionProps) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onPress(); }}
      onPressIn={() => { scale.value = withSpring(0.94, { damping: 15, stiffness: 400 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 12, stiffness: 300 }); }}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Animated.View style={animStyle}>
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.quickActionCard}
        >
          <Text style={styles.quickActionEmoji}>{emoji}</Text>
          <Text style={[styles.quickActionLabel, { color: '#FFFFFF' }]}>{label}</Text>
          {sublabel && (
            <Text style={[styles.quickActionSublabel, { color: 'rgba(255,255,255,0.75)' }]}>
              {sublabel}
            </Text>
          )}
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Room Card
// ─────────────────────────────────────────────────────────────────────────────
interface RoomCardProps {
  room: {
    id: string;
    name: string;
    emoji: string;
    currentProgress: number;
    tasks: Array<{ completed: boolean; estimatedMinutes: number }>;
    updatedAt?: Date;
  };
  colors: ColorTokens;
  isDark: boolean;
  onPress: () => void;
}

function RoomCard({ room, colors, isDark, onPress }: RoomCardProps) {
  const scale = useSharedValue(1);
  const pendingCount = room.tasks.filter(t => !t.completed).length;
  const remainingMin = room.tasks.filter(t => !t.completed).reduce((a, t) => a + t.estimatedMinutes, 0);
  const progress = Math.round(room.currentProgress);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Progress ring color
  const ringColor = progress >= 100 ? colors.success
    : progress >= 70 ? colors.warning
    : colors.accent;

  return (
    <Pressable
      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(); }}
      onPressIn={() => { scale.value = withSpring(0.95, { damping: 15, stiffness: 400 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 12, stiffness: 300 }); }}
      accessibilityRole="button"
      accessibilityLabel={`${room.name}, ${progress}% complete`}
    >
      <Animated.View style={[styles.roomCard, animStyle, {
        backgroundColor: isDark ? colors.surface : colors.backgroundSecondary,
        borderColor: isDark ? colors.cardBorder : colors.borderLight,
      }]}>
        {/* Progress bar at top */}
        <View style={[styles.roomProgressBar, { backgroundColor: isDark ? colors.fillTertiary : colors.surfaceTertiary }]}>
          <View style={[styles.roomProgressFill, {
            width: `${progress}%`,
            backgroundColor: ringColor,
          }]} />
        </View>

        <View style={styles.roomCardContent}>
          {/* Emoji */}
          <Text style={styles.roomCardEmoji}>{room.emoji}</Text>

          {/* Info */}
          <Text style={[styles.roomCardName, { color: colors.text }]} numberOfLines={1}>
            {room.name}
          </Text>

          <Text style={[styles.roomCardMeta, { color: colors.textSecondary }]}>
            {pendingCount > 0 ? `${pendingCount} tasks · ~${remainingMin}m` : '✓ Complete!'}
          </Text>

          {/* Progress % */}
          <View style={styles.roomCardFooter}>
            <Text style={[styles.roomCardProgress, { color: ringColor }]}>
              {progress}%
            </Text>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Stat Pill
// ─────────────────────────────────────────────────────────────────────────────
function StatPill({ value, label, color, colors, isDark }: {
  value: string | number;
  label: string;
  color: string;
  colors: ColorTokens;
  isDark: boolean;
}) {
  return (
    <View style={[styles.statPill, {
      backgroundColor: isDark ? colors.surface : colors.backgroundSecondary,
      borderColor: isDark ? colors.cardBorder : colors.borderLight,
    }]}>
      <Text style={[styles.statPillValue, { color }]}>{value}</Text>
      <Text style={[styles.statPillLabel, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const rawScheme = useColorScheme();
  const colorScheme = rawScheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  const {
    user,
    rooms,
    mascot,
    stats,
    setActiveRoom,
  } = useDeclutter();

  const streak = stats?.currentStreak ?? 0;

  const [refreshing, setRefreshing] = React.useState(false);

  const greeting = useMemo(() => getGreeting(user?.name || 'Friend'), [user?.name]);

  const totalRooms = rooms.length;
  const completedRooms = rooms.filter(r => r.currentProgress >= 100).length;
  const completedTasks = rooms.reduce((a, r) => a + r.tasks.filter(t => t.completed).length, 0);

  // Quick win — fastest incomplete task
  const quickWinTask = useMemo(() => {
    const allPending = rooms.flatMap(r =>
      r.tasks
        .filter(t => !t.completed)
        .map(t => ({ ...t, roomId: r.id, roomName: r.name, roomEmoji: r.emoji }))
    );
    return allPending.sort((a, b) => a.estimatedMinutes - b.estimatedMinutes)[0] ?? null;
  }, [rooms]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  const handleAddRoom = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/camera');
  };

  const handleOpenRoom = (roomId: string) => {
    setActiveRoom(roomId);
    router.push(`/room/${roomId}`);
  };

  const handleFocusMode = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/focus');
  };

  const handleQuickWin = () => {
    if (!quickWinTask) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setActiveRoom(quickWinTask.roomId);
    router.push(`/room/${quickWinTask.roomId}`);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
          />
        }
      >
        {/* ── Hero Header ─────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(0).springify()} style={styles.heroSection}>
          <View style={styles.greetingRow}>
            <View style={styles.greetingText}>
              <Text style={[Typography.displaySmall, { color: colors.text }]} numberOfLines={1}>
                {greeting.greeting}
              </Text>
              <Text style={[Typography.subheadline, { color: colors.textSecondary, marginTop: 4 }]}>
                {greeting.subtitle}
              </Text>
            </View>
            <Text style={styles.greetingEmoji}>{greeting.emoji}</Text>
          </View>

          {/* Streak badge */}
          {streak > 0 && (
            <Animated.View entering={FadeInDown.delay(100).springify()}>
              <View style={[styles.streakBadge, {
                backgroundColor: isDark ? colors.warningMuted : 'rgba(255, 149, 0, 0.10)',
                borderColor: isDark ? 'rgba(255, 159, 10, 0.30)' : 'rgba(255, 149, 0, 0.20)',
              }]}>
                <Text style={styles.streakFire}>🔥</Text>
                <Text style={[styles.streakText, { color: colors.warning }]}>
                  {streak} day streak
                </Text>
              </View>
            </Animated.View>
          )}
        </Animated.View>

        {/* ── Stats Row ───────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(80).springify()} style={styles.statsRow}>
          <StatPill
            value={completedTasks}
            label="tasks done"
            color={colors.success}
            colors={colors}
            isDark={isDark}
          />
          <StatPill
            value={`${completedRooms}/${totalRooms}`}
            label="rooms"
            color={colors.accent}
            colors={colors}
            isDark={isDark}
          />
          <StatPill
            value={stats?.xp ?? 0}
            label="XP"
            color={colors.warning}
            colors={colors}
            isDark={isDark}
          />
        </Animated.View>

        {/* ── Quick Actions ───────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(120).springify()} style={styles.section}>
          <Text style={[Typography.title3, { color: colors.text, marginBottom: Spacing.sm }]}>
            Quick Actions
          </Text>
          <View style={styles.quickActionsGrid}>
            <QuickActionButton
              emoji="📸"
              label="New Room"
              sublabel="Snap & analyze"
              onPress={handleAddRoom}
              gradient={isDark ? ['#0A84FF', '#5856D6'] : ['#007AFF', '#5856D6']}
              colors={colors}
            />
            <QuickActionButton
              emoji="🎯"
              label="Focus Mode"
              sublabel="Deep work timer"
              onPress={handleFocusMode}
              gradient={['#667eea', '#764ba2']}
              colors={colors}
            />
            {quickWinTask && (
              <QuickActionButton
                emoji="⚡"
                label="Quick Win"
                sublabel={`~${quickWinTask.estimatedMinutes}m task`}
                onPress={handleQuickWin}
                gradient={['#11998e', '#38ef7d']}
                colors={colors}
              />
            )}
            <QuickActionButton
              emoji="📊"
              label="Insights"
              sublabel="Your progress"
              onPress={() => router.push('/insights')}
              gradient={['#f093fb', '#f5576c']}
              colors={colors}
            />
          </View>
        </Animated.View>

        {/* ── Mascot Greeting ─────────────────────────────────────────── */}
        {mascot && (
          <Animated.View entering={FadeInDown.delay(160).springify()} style={styles.section}>
            <GlassCard
              variant="subtle"
              style={styles.mascotCard}
              tintColor={colors.accent}
              tintOpacity={0.05}
            >
              <View style={styles.mascotRow}>
                <Text style={styles.mascotEmoji}>{MASCOT_PERSONALITIES[mascot.personality]?.emoji ?? '🧹'}</Text>
                <View style={styles.mascotInfo}>
                  <Text style={[Typography.headline, { color: colors.text }]}>
                    {mascot.name} says hi!
                  </Text>
                  <Text style={[Typography.subheadline, { color: colors.textSecondary, marginTop: 2 }]}>
                    {completedTasks > 0
                      ? `You've completed ${completedTasks} tasks. Keep going!`
                      : 'Ready to start decluttering? Let\'s go!'}
                  </Text>
                </View>
              </View>
            </GlassCard>
          </Animated.View>
        )}

        {/* ── Rooms ───────────────────────────────────────────────────── */}
        {rooms.length > 0 ? (
          <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[Typography.title3, { color: colors.text }]}>Your Rooms</Text>
              <Pressable
                onPress={handleAddRoom}
                accessibilityRole="button"
                accessibilityLabel="Add new room"
              >
                <Text style={[Typography.subheadlineMedium, { color: colors.accent }]}>
                  + Add Room
                </Text>
              </Pressable>
            </View>

            <View style={styles.roomsGrid}>
              {rooms.map((room, index) => (
                <Animated.View
                  key={room.id}
                  entering={FadeInDown.delay(200 + index * 60).springify()}
                >
                  <RoomCard
                    room={room}
                    colors={colors}
                    isDark={isDark}
                    onPress={() => handleOpenRoom(room.id)}
                  />
                </Animated.View>
              ))}
            </View>
          </Animated.View>
        ) : (
          /* ── Empty State ──────────────────────────────────────────── */
          <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.section}>
            <GlassCard variant="elevated" style={styles.emptyCard} showHighlight>
              <View style={styles.emptyContent}>
                <Text style={styles.emptyEmoji}>🏠</Text>
                <Text style={[Typography.title2, { color: colors.text, textAlign: 'center', marginTop: Spacing.md }]}>
                  No rooms yet
                </Text>
                <Text style={[Typography.subheadline, { color: colors.textSecondary, textAlign: 'center', marginTop: Spacing.xs, lineHeight: 22 }]}>
                  Take a photo of any messy space and our AI will create a personalized cleaning plan.
                </Text>

                <Pressable
                  onPress={handleAddRoom}
                  style={styles.emptyButton}
                  accessibilityRole="button"
                  accessibilityLabel="Add your first room"
                >
                  <LinearGradient
                    colors={isDark ? ['#0A84FF', '#5856D6'] : ['#007AFF', '#5856D6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.emptyButtonGradient}
                  >
                    <Text style={[Typography.headline, { color: '#FFFFFF' }]}>
                      📸 Add Your First Room
                    </Text>
                  </LinearGradient>
                </Pressable>
              </View>
            </GlassCard>
          </Animated.View>
        )}

        {/* ── Today's Focus ───────────────────────────────────────────── */}
        {quickWinTask && rooms.length > 0 && (
          <Animated.View entering={FadeInDown.delay(280).springify()} style={styles.section}>
            <Text style={[Typography.title3, { color: colors.text, marginBottom: Spacing.sm }]}>
              Today&apos;s Focus
            </Text>
            <Pressable
              onPress={handleQuickWin}
              accessibilityRole="button"
              accessibilityLabel={`Quick win: ${quickWinTask.title}`}
            >
              <GlassCard
                variant="tinted"
                tintColor={colors.success}
                tintOpacity={0.08}
                style={styles.focusCard}
              >
                <View style={styles.focusRow}>
                  <View style={[styles.focusIcon, { backgroundColor: colors.successMuted }]}>
                    <Text style={{ fontSize: 20 }}>⚡</Text>
                  </View>
                  <View style={styles.focusInfo}>
                    <Text style={[Typography.headline, { color: colors.text }]} numberOfLines={1}>
                      {quickWinTask.title}
                    </Text>
                    <Text style={[Typography.caption1, { color: colors.textSecondary, marginTop: 2 }]}>
                      {(quickWinTask as { roomEmoji?: string }).roomEmoji} {(quickWinTask as { roomName?: string }).roomName} · ~{quickWinTask.estimatedMinutes} min
                    </Text>
                  </View>
                  <Text style={[Typography.headline, { color: colors.success }]}>→</Text>
                </View>
              </GlassCard>
            </Pressable>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.ml,
  },

  // Hero
  heroSection: {
    marginBottom: Spacing.ml,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  greetingText: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  greetingEmoji: {
    fontSize: 40,
    marginTop: 4,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    gap: 6,
  },
  streakFire: {
    fontSize: 14,
  },
  streakText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: Spacing.lg,
  },
  statPill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    borderRadius: BorderRadius.lg,
    borderWidth: 0.5,
  },
  statPillValue: {
    ...Typography.title2,
  },
  statPillLabel: {
    ...Typography.caption2,
    marginTop: Spacing.hairline,
    textAlign: 'center',
  },

  // Section
  section: {
    marginBottom: Spacing.lg + Spacing.xxs,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },

  // Quick Actions
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  quickActionCard: {
    width: (SCREEN_WIDTH - 52) / 2,
    paddingVertical: 18,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.card,
    gap: Spacing.xxs,
  },
  quickActionEmoji: {
    fontSize: 28,
    marginBottom: Spacing.xxs,
  },
  quickActionLabel: {
    ...Typography.subheadlineMedium,
    color: undefined,
  },
  quickActionSublabel: {
    ...Typography.caption1,
    color: undefined,
  },

  // Mascot
  mascotCard: {
    padding: Spacing.md,
  },
  mascotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm + Spacing.hairline,
  },
  mascotEmoji: {
    fontSize: 40,
  },
  mascotInfo: {
    flex: 1,
  },

  // Rooms Grid
  roomsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  roomCard: {
    width: CARD_WIDTH,
    borderRadius: BorderRadius.card,
    borderWidth: 0.5,
    overflow: 'hidden',
  },
  roomProgressBar: {
    height: 3,
    width: '100%',
  },
  roomProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  roomCardContent: {
    padding: Spacing.sm + Spacing.hairline,
  },
  roomCardEmoji: {
    fontSize: 32,
    marginBottom: Spacing.xs,
  },
  roomCardName: {
    ...Typography.subheadlineMedium,
    marginBottom: Spacing.xxs,
  },
  roomCardMeta: {
    ...Typography.caption1,
  },
  roomCardFooter: {
    marginTop: 10,
  },
  roomCardProgress: {
    ...Typography.title3,
  },

  // Empty State
  emptyCard: {
    padding: Spacing.xl,
  },
  emptyContent: {
    alignItems: 'center',
  },
  emptyEmoji: {
    fontSize: 64,
  },
  emptyButton: {
    marginTop: Spacing.lg,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    width: '100%',
  },
  emptyButtonGradient: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
  },

  // Focus Card
  focusCard: {
    padding: Spacing.md,
  },
  focusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  focusIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  focusInfo: {
    flex: 1,
  },
});
