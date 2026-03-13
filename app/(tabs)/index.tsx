/**
 * Declutterly — Home Screen (Apple 2026)
 * Simplified: smart CTA, time selector, energy check-in, grace messaging
 * Designed for ADHD / executive dysfunction — minimal decisions, maximum encouragement
 */

import { Colors, ColorTokens } from '@/constants/Colors';
import { GlassCard } from '@/components/ui/GlassCard';
import { useDeclutter } from '@/context/DeclutterContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Typography } from '@/theme/typography';
import { Spacing, BorderRadius } from '@/theme/spacing';
import { MASCOT_PERSONALITIES, CleaningTask, EnergyLevel } from '@/types/declutter';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useMemo, useState } from 'react';
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
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useReducedMotion } from '@/hooks/useReducedMotion';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 48 - 12) / 2;

// ─────────────────────────────────────────────────────────────────────────────
// Time options for task filtering
// ─────────────────────────────────────────────────────────────────────────────
type TimeOption = 5 | 15 | 30 | 60;

const TIME_OPTIONS: { label: string; minutes: TimeOption }[] = [
  { label: '5 min', minutes: 5 },
  { label: '15 min', minutes: 15 },
  { label: '30 min', minutes: 30 },
  { label: '60 min', minutes: 60 },
];

// ─────────────────────────────────────────────────────────────────────────────
// Energy levels for task filtering
// ─────────────────────────────────────────────────────────────────────────────
type UserEnergy = 'exhausted' | 'low' | 'moderate' | 'high';

interface EnergyOption {
  level: UserEnergy;
  emoji: string;
  label: string;
}

const ENERGY_OPTIONS: EnergyOption[] = [
  { level: 'exhausted', emoji: '😴', label: 'Exhausted' },
  { level: 'low', emoji: '😐', label: 'Low' },
  { level: 'moderate', emoji: '🙂', label: 'Moderate' },
  { level: 'high', emoji: '⚡', label: 'High' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Smart Greeting — with grace messaging
// ─────────────────────────────────────────────────────────────────────────────
function getGreeting(
  name: string,
  lastActivityDate?: string,
): { greeting: string; emoji: string; subtitle: string; isWelcomeBack: boolean } {
  const hour = new Date().getHours();
  const firstName = name.split(' ')[0] || 'Friend';

  // Check if user has been away 2+ days
  let isWelcomeBack = false;
  if (lastActivityDate) {
    const lastDate = new Date(lastActivityDate);
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    isWelcomeBack = daysDiff >= 2;
  }

  if (isWelcomeBack) {
    return {
      greeting: `Hey, ${firstName}!`,
      emoji: '💜',
      subtitle: 'You came back. That\'s the hardest part.',
      isWelcomeBack: true,
    };
  }

  if (hour < 5)  return { greeting: `Night owl, ${firstName}`,  emoji: '🌙', subtitle: 'Still up? Even small wins count.', isWelcomeBack: false };
  if (hour < 12) return { greeting: `Good morning, ${firstName}`, emoji: '☀️', subtitle: 'Fresh start — what will you tackle?', isWelcomeBack: false };
  if (hour < 17) return { greeting: `Good afternoon, ${firstName}`, emoji: '🌤️', subtitle: 'Afternoon energy — let\'s use it!', isWelcomeBack: false };
  if (hour < 20) return { greeting: `Good evening, ${firstName}`, emoji: '🌅', subtitle: 'Wind down with a quick win.', isWelcomeBack: false };
  return { greeting: `Good night, ${firstName}`, emoji: '🌙', subtitle: 'One last task before bed?', isWelcomeBack: false };
}

// ─────────────────────────────────────────────────────────────────────────────
// Grace streak text
// ─────────────────────────────────────────────────────────────────────────────
function getStreakMessage(streak: number): string {
  if (streak >= 7) return `${streak} day streak — incredible!`;
  if (streak >= 3) return `${streak} day streak — keep it up!`;
  if (streak >= 1) return `${streak} day streak`;
  return 'Life happens. Start fresh today.';
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
    tasks: Array<{ completed: boolean; estimatedMinutes: number; completedAt?: Date }>;
    updatedAt?: Date;
  };
  colors: ColorTokens;
  isDark: boolean;
  onPress: () => void;
  weeklyDoneCount: number;
}

function RoomCard({ room, colors, isDark, onPress, weeklyDoneCount }: RoomCardProps) {
  const scale = useSharedValue(1);
  const pendingCount = room.tasks.filter(t => !t.completed).length;
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
      accessibilityLabel={`${room.name}, ${weeklyDoneCount} tasks done this week`}
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
            {pendingCount > 0
              ? `${weeklyDoneCount} tasks done this week!`
              : 'All done!'}
          </Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Energy Check-In Component
// ─────────────────────────────────────────────────────────────────────────────
function EnergyCheckIn({
  selectedEnergy,
  onSelect,
  colors,
  isDark,
}: {
  selectedEnergy: UserEnergy | null;
  onSelect: (energy: UserEnergy) => void;
  colors: ColorTokens;
  isDark: boolean;
}) {
  return (
    <View style={styles.energyCheckIn}>
      <Text style={[Typography.subheadlineMedium, { color: colors.text, marginBottom: Spacing.sm }]}>
        How&apos;s your energy?
      </Text>
      <View style={styles.energyOptions}>
        {ENERGY_OPTIONS.map((option) => {
          const isSelected = selectedEnergy === option.level;
          return (
            <Pressable
              key={option.level}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onSelect(option.level);
              }}
              style={[
                styles.energyOption,
                {
                  backgroundColor: isSelected
                    ? (isDark ? colors.accentMuted : colors.accent)
                    : (isDark ? colors.surface : colors.backgroundSecondary),
                  borderColor: isSelected
                    ? colors.accent
                    : (isDark ? colors.cardBorder : colors.borderLight),
                },
              ]}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`Energy: ${option.label}`}
            >
              <Text style={styles.energyEmoji}>{option.emoji}</Text>
              <Text style={[
                Typography.caption2,
                {
                  color: isSelected
                    ? (isDark ? colors.accent : colors.textOnPrimary)
                    : colors.textSecondary,
                  marginTop: 2,
                },
              ]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Time Selector Component
// ─────────────────────────────────────────────────────────────────────────────
function TimeSelector({
  selectedTime,
  onSelect,
  colors,
  isDark,
}: {
  selectedTime: TimeOption | null;
  onSelect: (time: TimeOption) => void;
  colors: ColorTokens;
  isDark: boolean;
}) {
  return (
    <View style={styles.timeSelector}>
      <Text style={[Typography.subheadlineMedium, { color: colors.text, marginBottom: Spacing.xs }]}>
        I have:
      </Text>
      <View style={styles.timeOptions}>
        {TIME_OPTIONS.map((option) => {
          const isSelected = selectedTime === option.minutes;
          return (
            <Pressable
              key={option.minutes}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onSelect(option.minutes);
              }}
              style={[
                styles.timeOption,
                {
                  backgroundColor: isSelected
                    ? colors.accent
                    : (isDark ? colors.surface : colors.backgroundSecondary),
                  borderColor: isSelected
                    ? colors.accent
                    : (isDark ? colors.cardBorder : colors.borderLight),
                },
              ]}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`${option.label} available`}
            >
              <Text style={[
                Typography.subheadlineMedium,
                {
                  color: isSelected ? colors.textOnPrimary : colors.text,
                },
              ]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
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
  const lastActivityDate = stats?.lastActivityDate;
  const reducedMotion = useReducedMotion();

  const [refreshing, setRefreshing] = React.useState(false);
  const [selectedTime, setSelectedTime] = useState<TimeOption | null>(null);
  const [selectedEnergy, setSelectedEnergy] = useState<UserEnergy | null>(null);
  const [showDoneForToday, setShowDoneForToday] = useState(false);

  const greeting = useMemo(
    () => getGreeting(user?.name || 'Friend', lastActivityDate),
    [user?.name, lastActivityDate],
  );

  const completedTasks = rooms.reduce((a, r) => a + r.tasks.filter(t => t.completed).length, 0);

  // Tasks done this week per room
  const weeklyDoneCounts = useMemo(() => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const counts: Record<string, number> = {};
    rooms.forEach(r => {
      counts[r.id] = r.tasks.filter(t => {
        if (!t.completed || !t.completedAt) return false;
        return new Date(t.completedAt) >= weekAgo;
      }).length;
    });
    return counts;
  }, [rooms]);

  const totalWeeklyDone = useMemo(() => {
    return Object.values(weeklyDoneCounts).reduce((a, b) => a + b, 0);
  }, [weeklyDoneCounts]);

  // Map UserEnergy to EnergyLevel for task filtering
  const energyToEnergyLevel = (energy: UserEnergy): EnergyLevel => {
    switch (energy) {
      case 'exhausted': return 'minimal';
      case 'low': return 'low';
      case 'moderate': return 'moderate';
      case 'high': return 'high';
    }
  };

  // Smart "next best task" — filters by time and energy
  const smartNextTask = useMemo(() => {
    const allPending = rooms.flatMap(r =>
      r.tasks
        .filter(t => !t.completed)
        .map(t => ({ ...t, roomId: r.id, roomName: r.name, roomEmoji: r.emoji }))
    );

    let candidates = allPending;

    // Filter by time
    if (selectedTime) {
      candidates = candidates.filter(t => t.estimatedMinutes <= selectedTime);
    }

    // Filter by energy
    if (selectedEnergy) {
      const energyOrder: EnergyLevel[] = ['minimal', 'low', 'moderate', 'high'];
      const maxIndex = energyOrder.indexOf(energyToEnergyLevel(selectedEnergy));
      if (selectedEnergy === 'exhausted') {
        // Only show zero-decision quick wins
        candidates = candidates.filter(t => {
          const energyOk = !t.energyRequired || energyOrder.indexOf(t.energyRequired) <= maxIndex;
          const lowDecision = !t.decisionLoad || t.decisionLoad === 'none' || t.decisionLoad === 'low';
          return energyOk && lowDecision;
        });
      } else {
        candidates = candidates.filter(t => {
          if (!t.energyRequired) return true;
          return energyOrder.indexOf(t.energyRequired) <= maxIndex;
        });
      }
    }

    // Sort by visual impact (high first), then by time (short first)
    candidates.sort((a, b) => {
      const impactOrder = { high: 0, medium: 1, low: 2, undefined: 1 };
      const aImpact = impactOrder[a.visualImpact as keyof typeof impactOrder] ?? 1;
      const bImpact = impactOrder[b.visualImpact as keyof typeof impactOrder] ?? 1;
      if (aImpact !== bImpact) return aImpact - bImpact;
      return a.estimatedMinutes - b.estimatedMinutes;
    });

    return candidates[0] ?? null;
  }, [rooms, selectedTime, selectedEnergy]);

  // Today's focus tasks — filtered
  const todaysFocusTasks = useMemo(() => {
    const allPending = rooms.flatMap(r =>
      r.tasks
        .filter(t => !t.completed)
        .map(t => ({ ...t, roomId: r.id, roomName: r.name, roomEmoji: r.emoji }))
    );

    let candidates = allPending;

    if (selectedTime) {
      let cumulativeTime = 0;
      candidates = candidates.filter(t => {
        if (cumulativeTime + t.estimatedMinutes <= selectedTime) {
          cumulativeTime += t.estimatedMinutes;
          return true;
        }
        return false;
      });
    }

    if (selectedEnergy) {
      const energyOrder: EnergyLevel[] = ['minimal', 'low', 'moderate', 'high'];
      const maxIndex = energyOrder.indexOf(energyToEnergyLevel(selectedEnergy));
      if (selectedEnergy === 'exhausted') {
        candidates = candidates.filter(t => {
          const energyOk = !t.energyRequired || energyOrder.indexOf(t.energyRequired) <= maxIndex;
          const lowDecision = !t.decisionLoad || t.decisionLoad === 'none' || t.decisionLoad === 'low';
          return energyOk && lowDecision;
        });
      } else {
        candidates = candidates.filter(t => {
          if (!t.energyRequired) return true;
          return energyOrder.indexOf(t.energyRequired) <= maxIndex;
        });
      }
    }

    return candidates.slice(0, 5);
  }, [rooms, selectedTime, selectedEnergy]);

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

  const handleSmartCTA = () => {
    if (!smartNextTask) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setActiveRoom(smartNextTask.roomId);
    router.push(`/room/${smartNextTask.roomId}`);
  };

  const handleDoneForToday = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowDoneForToday(true);
    setTimeout(() => setShowDoneForToday(false), 3000);
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
        <Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(0).springify()} style={styles.heroSection}>
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

          {/* Streak badge — always visible, with grace messaging */}
          <Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(100).springify()}>
            <View style={[styles.streakBadge, {
              backgroundColor: streak > 0
                ? (isDark ? colors.warningMuted : 'rgba(255, 149, 0, 0.10)')
                : (isDark ? colors.primaryMuted : 'rgba(0, 0, 0, 0.05)'),
              borderColor: streak > 0
                ? (isDark ? 'rgba(255, 159, 10, 0.30)' : 'rgba(255, 149, 0, 0.20)')
                : (isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(0, 0, 0, 0.08)'),
            }]}>
              <Text style={styles.streakFire}>{streak > 0 ? '🔥' : '🌱'}</Text>
              <Text style={[styles.streakText, {
                color: streak > 0 ? colors.warning : colors.textSecondary,
              }]}>
                {getStreakMessage(streak)}
              </Text>
            </View>
          </Animated.View>

          {/* Weekly summary */}
          {totalWeeklyDone > 0 && (
            <Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(150).springify()}>
              <Text style={[Typography.subheadline, { color: colors.success, marginTop: Spacing.xs }]}>
                {totalWeeklyDone} task{totalWeeklyDone !== 1 ? 's' : ''} done this week!
              </Text>
            </Animated.View>
          )}
        </Animated.View>

        {/* ── Time Selector ────────────────────────────────────────────── */}
        <Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(80).springify()} style={styles.section}>
          <TimeSelector
            selectedTime={selectedTime}
            onSelect={(time) => setSelectedTime(prev => prev === time ? null : time)}
            colors={colors}
            isDark={isDark}
          />
        </Animated.View>

        {/* ── Energy Check-In ──────────────────────────────────────────── */}
        <Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(100).springify()} style={styles.section}>
          <EnergyCheckIn
            selectedEnergy={selectedEnergy}
            onSelect={(energy) => setSelectedEnergy(prev => prev === energy ? null : energy)}
            colors={colors}
            isDark={isDark}
          />
        </Animated.View>

        {/* ── Today's Focus (moved to top) ─────────────────────────────── */}
        {todaysFocusTasks.length > 0 && rooms.length > 0 && (
          <Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(120).springify()} style={styles.section}>
            <Text style={[Typography.title3, { color: colors.text, marginBottom: Spacing.sm }]}>
              Today&apos;s Focus
            </Text>
            {todaysFocusTasks.slice(0, 3).map((task, index) => (
              <Pressable
                key={task.id}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setActiveRoom(task.roomId);
                  router.push(`/room/${task.roomId}`);
                }}
                accessibilityRole="button"
                accessibilityLabel={`Task: ${task.title}`}
                style={{ marginBottom: Spacing.xs }}
              >
                <GlassCard
                  variant="tinted"
                  tintColor={index === 0 ? colors.success : colors.accent}
                  tintOpacity={0.06}
                  style={styles.focusCard}
                >
                  <View style={styles.focusRow}>
                    <View style={[styles.focusIcon, {
                      backgroundColor: index === 0 ? colors.successMuted : colors.accentMuted,
                    }]}>
                      <Text style={{ fontSize: 18 }}>{task.emoji}</Text>
                    </View>
                    <View style={styles.focusInfo}>
                      <Text style={[Typography.headline, { color: colors.text }]} numberOfLines={1}>
                        {task.title}
                      </Text>
                      <Text style={[Typography.caption1, { color: colors.textSecondary, marginTop: 2 }]}>
                        {task.roomEmoji} {task.roomName} · ~{task.estimatedMinutes} min
                        {task.visualImpact === 'high' ? ' · High impact' : ''}
                      </Text>
                    </View>
                    <Text style={[Typography.headline, { color: index === 0 ? colors.success : colors.accent }]}>
                      {'\u2192'}
                    </Text>
                  </View>
                </GlassCard>
              </Pressable>
            ))}
          </Animated.View>
        )}

        {/* ── Smart CTA — "What should I do next?" ─────────────────────── */}
        <Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(160).springify()} style={styles.section}>
          {smartNextTask ? (
            <Pressable
              onPress={handleSmartCTA}
              accessibilityRole="button"
              accessibilityLabel={`Start next task: ${smartNextTask.title}`}
            >
              <LinearGradient
                colors={isDark ? ['#0A84FF', '#5856D6'] as const : ['#007AFF', '#5856D6'] as const}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.smartCTACard}
              >
                <Text style={styles.smartCTAEmoji}>{smartNextTask.emoji}</Text>
                <View style={styles.smartCTAContent}>
                  <Text style={[Typography.caption1, { color: 'rgba(255,255,255,0.75)' }]}>
                    What should I do next?
                  </Text>
                  <Text style={[Typography.headline, { color: '#FFFFFF', marginTop: 4 }]} numberOfLines={1}>
                    {smartNextTask.title}
                  </Text>
                  <Text style={[Typography.caption1, { color: 'rgba(255,255,255,0.7)', marginTop: 2 }]}>
                    {smartNextTask.roomEmoji} {smartNextTask.roomName} · ~{smartNextTask.estimatedMinutes} min
                  </Text>
                </View>
                <Text style={{ fontSize: 20, color: '#FFFFFF' }}>{'\u2192'}</Text>
              </LinearGradient>
            </Pressable>
          ) : rooms.length === 0 ? (
            /* Empty state — prompt to add first room */
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
                    colors={isDark ? ['#0A84FF', '#5856D6'] as const : ['#007AFF', '#5856D6'] as const}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.emptyButtonGradient}
                  >
                    <Text style={[Typography.headline, { color: '#FFFFFF' }]}>
                      Take a Photo
                    </Text>
                  </LinearGradient>
                </Pressable>
              </View>
            </GlassCard>
          ) : (
            /* All tasks done */
            <GlassCard
              variant="tinted"
              tintColor={colors.success}
              tintOpacity={0.08}
              style={styles.focusCard}
            >
              <View style={styles.focusRow}>
                <View style={[styles.focusIcon, { backgroundColor: colors.successMuted }]}>
                  <Text style={{ fontSize: 20 }}>🎉</Text>
                </View>
                <View style={styles.focusInfo}>
                  <Text style={[Typography.headline, { color: colors.text }]}>
                    All caught up!
                  </Text>
                  <Text style={[Typography.caption1, { color: colors.textSecondary, marginTop: 2 }]}>
                    No pending tasks. You&apos;re doing great.
                  </Text>
                </View>
              </View>
            </GlassCard>
          )}
        </Animated.View>

        {/* ── Mascot Greeting ─────────────────────────────────────────── */}
        {mascot && (
          <Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(200).springify()} style={styles.section}>
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
        {rooms.length > 0 && (
          <Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(240).springify()} style={styles.section}>
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
                  entering={reducedMotion ? undefined : FadeInDown.delay(240 + index * 60).springify()}
                >
                  <RoomCard
                    room={room}
                    colors={colors}
                    isDark={isDark}
                    onPress={() => handleOpenRoom(room.id)}
                    weeklyDoneCount={weeklyDoneCounts[room.id] ?? 0}
                  />
                </Animated.View>
              ))}
            </View>
          </Animated.View>
        )}

        {/* ── "Done for today" Button ─────────────────────────────────── */}
        {completedTasks > 0 && (
          <Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(300).springify()} style={styles.section}>
            <Pressable
              onPress={handleDoneForToday}
              style={[styles.doneForTodayButton, {
                backgroundColor: isDark ? colors.surface : colors.backgroundSecondary,
                borderColor: isDark ? colors.cardBorder : colors.borderLight,
              }]}
              accessibilityRole="button"
              accessibilityLabel="Done for today"
            >
              <Text style={[Typography.subheadlineMedium, { color: colors.textSecondary }]}>
                Done for today? That&apos;s OK.
              </Text>
              <Text style={[Typography.caption1, { color: colors.textTertiary, marginTop: 2 }]}>
                You showed up. That counts.
              </Text>
            </Pressable>
          </Animated.View>
        )}
      </ScrollView>

      {/* ── "Done for today" Celebration ──────────────────────────────── */}
      {showDoneForToday && (
        <Animated.View
          entering={reducedMotion ? undefined : FadeInDown.springify()}
          exiting={FadeOut.duration(300)}
          style={styles.doneForTodayCelebration}
        >
          <View style={[styles.doneForTodayCard, {
            backgroundColor: isDark ? 'rgba(28, 28, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          }]}>
            <Text style={styles.doneForTodayEmoji}>🌿</Text>
            <Text style={[Typography.headline, { color: colors.text, textAlign: 'center' }]}>
              You did enough today.
            </Text>
            <Text style={[Typography.subheadline, { color: colors.textSecondary, textAlign: 'center', marginTop: 4 }]}>
              Rest is part of the process. See you tomorrow.
            </Text>
          </View>
        </Animated.View>
      )}
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
    marginBottom: Spacing.md,
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
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 8,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    gap: 6,
  },
  streakFire: {
    fontSize: 16,
  },
  streakText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Section
  section: {
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },

  // Time Selector
  timeSelector: {
    marginBottom: 0,
  },
  timeOptions: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  timeOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },

  // Energy Check-In
  energyCheckIn: {
    marginBottom: 0,
  },
  energyOptions: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  energyOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  energyEmoji: {
    fontSize: 20,
  },

  // Smart CTA
  smartCTACard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.card,
    gap: Spacing.sm,
  },
  smartCTAEmoji: {
    fontSize: 32,
  },
  smartCTAContent: {
    flex: 1,
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

  // Done for today
  doneForTodayButton: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.card,
    borderWidth: 0.5,
  },
  doneForTodayCelebration: {
    position: 'absolute',
    bottom: 120,
    left: Spacing.ml,
    right: Spacing.ml,
    alignItems: 'center',
    zIndex: 100,
  },
  doneForTodayCard: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  doneForTodayEmoji: {
    fontSize: 40,
    marginBottom: Spacing.sm,
  },
});
