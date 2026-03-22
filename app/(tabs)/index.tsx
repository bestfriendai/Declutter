/**
 * Declutterly -- Home Screen (V1 Core Flow)
 * Thin orchestrator that imports sub-components from components/home/
 * Matches Pencil designs: rSSHH (populated) + TPr0p (empty state)
 */

import { useDeclutter } from '@/context/DeclutterContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useSubscription, FREE_ROOM_LIMIT } from '@/hooks/useSubscription';
import { useRoomFreshness } from '@/hooks/useRoomFreshness';
import { useTodaysTasks, type TodayTask } from '@/hooks/useTodaysTasks';
import { useConsistencyScore } from '@/hooks/useConsistencyScore';
import {
  V1,
  BODY_FONT,
  DISPLAY_FONT,
  RADIUS,
  SPACING,
  cardStyle,
  getTheme,
} from '@/constants/designTokens';
import {
  getWelcomeBackMessage,
  getOneTinyThingTask,
  shouldShowComebackFlow,
  formatGracePeriodBadge,
  type OneTinyThingTask,
  type ComebackStatus,
} from '@/services/comebackEngine';
import {
  scheduleShameFreeReminder,
  scheduleComebackNudge,
  checkNotificationPermissions,
} from '@/services/notifications';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Zap, Gift, Clock } from 'lucide-react-native';
import { useUnclaimedRewards, useClaimReward, useCheckComebackStatus } from '@/hooks/useConvex';
import { ScreenErrorBoundary } from '@/components/ErrorBoundary';
import { QueryErrorState } from '@/components/ui/QueryErrorState';
import { toConvexId } from '@/utils/convexIds';

// Sub-components
import {
  HomeHeader,
  StreakCard,
  TodaysTasksCard,
  RoomGrid,
  ComebackBanner,
  GracePeriodBadge,
  StreakNudge,
  EmptyState,
  HomeSkeleton,
  ScanRoomFAB,
} from '@/components/home';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ─── Animated press hook ─────────────────────────────────────────────────────
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

// ─── Room emoji helper ──────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// Main Home Screen
// ─────────────────────────────────────────────────────────────────────────────
export default function HomeScreen() {
  return (
    <ScreenErrorBoundary screenName="home">
      <HomeScreenContent />
    </ScreenErrorBoundary>
  );
}

function HomeScreenContent() {
  const rawScheme = useColorScheme();
  const isDark = rawScheme === 'dark';
  const t = getTheme(isDark);
  const insets = useSafeAreaInsets();
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const {
    rooms,
    user,
    stats,
    activeRoomId,
    setActiveRoom,
    toggleTask,
    isLoaded,
    pendingCelebration,
    clearCelebration,
  } = useDeclutter();
  const { isPro } = useSubscription();
  const reducedMotion = useReducedMotion();
  const roomFreshness = useRoomFreshness(rooms);
  const todaysTasks = useTodaysTasks(rooms);
  const consistency = useConsistencyScore(rooms, stats);
  const nudgeShownRef = useRef(false);

  // Track if loading has timed out (10s without data)
  const [loadTimedOut, setLoadTimedOut] = useState(false);
  useEffect(() => {
    if (isLoaded) {
      setLoadTimedOut(false);
      return;
    }
    const timer = setTimeout(() => {
      if (!isLoaded) setLoadTimedOut(true);
    }, 10000);
    return () => clearTimeout(timer);
  }, [isLoaded]);

  // Pull-to-refresh with Convex auto-sync
  const [isRefreshing, setIsRefreshing] = useState(false);
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    // Convex queries auto-sync; show loading indicator briefly for feedback
    setTimeout(() => setIsRefreshing(false), 800);
  }, []);

  // Server-side comeback status from Convex
  const comebackStatus = useCheckComebackStatus();

  // Comeback Engine state
  const [comebackData, setComebackData] = useState<{
    message: string;
    submessage: string;
    emoji: string;
    bonusActive: boolean;
    tinyTask: OneTinyThingTask;
  } | null>(null);

  const [tinyThingDone, setTinyThingDone] = useState(false);

  // Check for comeback on mount — use server data when available, local fallback otherwise
  useEffect(() => {
    // Prefer server-side comeback status if available
    if (comebackStatus && comebackStatus.isReturning) {
      const serverStatus: ComebackStatus = {
        isReturning: comebackStatus.isReturning,
        daysSinceActivity: comebackStatus.daysSinceActivity,
        comebackBonusXP: comebackStatus.comebackBonusXP ?? 0,
        totalSessions: comebackStatus.totalSessions ?? 0,
        isInGracePeriod: comebackStatus.isInGracePeriod,
        gracePeriodEndsAt: comebackStatus.gracePeriodEndsAt ?? null,
        streakSafe: comebackStatus.streakSafe,
        currentStreak: comebackStatus.currentStreak,
      };

      if (shouldShowComebackFlow(serverStatus)) {
        const welcome = getWelcomeBackMessage(serverStatus.daysSinceActivity);
        const tinyTask = getOneTinyThingTask();
        setComebackData({ ...welcome, tinyTask });
      }
      return;
    }

    // Local fallback while server data loads
    if (!stats?.lastActivityDate) return;
    const lastDate = new Date(stats.lastActivityDate);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    const localStatus: ComebackStatus = {
      isReturning: diffDays >= 2,
      daysSinceActivity: diffDays,
      comebackBonusXP: 0,
      totalSessions: stats.totalCleaningSessions ?? 0,
      isInGracePeriod: diffDays >= 1 && diffDays < 2,
      gracePeriodEndsAt:
        diffDays >= 1 && diffDays < 2
          ? new Date(lastDate.getTime() + 48 * 60 * 60 * 1000).toISOString()
          : null,
      streakSafe: diffDays < 2,
      currentStreak: stats.currentStreak,
    };

    if (shouldShowComebackFlow(localStatus)) {
      const welcome = getWelcomeBackMessage(diffDays);
      const tinyTask = getOneTinyThingTask();
      setComebackData({ ...welcome, tinyTask });
    }
  }, [comebackStatus]);

  // Schedule local notifications
  useEffect(() => {
    (async () => {
      try {
        const hasPermission = await checkNotificationPermissions();
        if (!hasPermission) return;
        await scheduleShameFreeReminder(9, 0);
        await scheduleComebackNudge(3);
      } catch (err) {
        if (__DEV__) console.info('Error scheduling notifications:', err);
      }
    })();
  }, []);

  // Haptic on celebration
  useEffect(() => {
    if (pendingCelebration && pendingCelebration.length > 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [pendingCelebration]);

  // Auto-dismiss badge unlock modal after 4 seconds
  useEffect(() => {
    if (pendingCelebration && pendingCelebration.length > 0) {
      const timer = setTimeout(() => {
        clearCelebration();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [pendingCelebration]);

  const userName = user?.name || 'there';
  const streak = stats?.currentStreak || 0;
  const todayTasksDone = useMemo(() => {
    const today = new Date().toDateString();
    let done = 0;
    let total = 0;
    rooms.forEach((r) => {
      r.tasks?.forEach((task) => {
        total++;
        if (
          task.completed &&
          task.completedAt &&
          new Date(task.completedAt).toDateString() === today
        ) {
          done++;
        }
      });
    });
    return { done, total: Math.min(total, 10) };
  }, [rooms]);

  // Hero room (most urgent / active)
  const heroRoom = useMemo(() => {
    if (rooms.length === 0) return null;
    const active = activeRoomId ? rooms.find((r) => r.id === activeRoomId) : null;
    if (active) return active;
    return [...rooms].sort((a, b) => {
      const aIncomplete = (a.tasks || []).filter((tk) => !tk.completed).length;
      const bIncomplete = (b.tasks || []).filter((tk) => !tk.completed).length;
      return bIncomplete - aIncomplete;
    })[0];
  }, [rooms, activeRoomId]);

  const heroTaskCount = heroRoom
    ? (heroRoom.tasks || []).filter((tk) => !tk.completed).length
    : 0;
  const heroTotalMinutes = heroRoom
    ? (heroRoom.tasks || [])
        .filter((tk) => !tk.completed)
        .reduce((sum, tk) => sum + (tk.estimatedMinutes || 3), 0)
    : 0;

  // Continue where you left off
  const continueRoom = useMemo(() => {
    if (!activeRoomId) return null;
    const room = rooms.find((r) => r.id === activeRoomId);
    if (!room) return null;
    const incomplete = (room.tasks || []).filter((tk) => !tk.completed);
    if (incomplete.length === 0) return null;
    const totalMin = incomplete.reduce((sum, tk) => sum + (tk.estimatedMinutes || 3), 0);
    return { room, taskCount: incomplete.length, totalMin };
  }, [activeRoomId, rooms]);

  // "Start Here" room
  const startHereRoomId = useMemo(() => {
    if (rooms.length <= 1) return null;
    let bestId: string | null = null;
    let bestScore = 0;
    rooms.forEach((room) => {
      const highImpactIncomplete = (room.tasks || []).filter(
        (tk) => !tk.completed && tk.visualImpact === 'high',
      ).length;
      if (highImpactIncomplete > bestScore) {
        bestScore = highImpactIncomplete;
        bestId = room.id;
      }
    });
    return bestScore > 0 ? bestId : null;
  }, [rooms]);

  // Grace period badge
  const gracePeriodBadge = useMemo(() => {
    if (!stats?.lastActivityDate || streak === 0) return null;
    const lastDate = new Date(stats.lastActivityDate);
    const now = new Date();
    const hoursSince = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60);
    if (hoursSince >= 24 && hoursSince < 48) {
      const gracePeriodEndsAt = new Date(
        lastDate.getTime() + 48 * 60 * 60 * 1000,
      ).toISOString();
      return formatGracePeriodBadge(gracePeriodEndsAt);
    }
    return null;
  }, [stats, streak]);

  // Streak nudge (only show once per session)
  const streakNudge = useMemo(() => {
    if (nudgeShownRef.current) return null;
    if (!stats || streak === 0) return null;
    const lastActivity = stats.lastActivityDate;
    if (!lastActivity) return null;
    const lastDate = new Date(lastActivity);
    const now = new Date();
    const hoursSince = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60);
    if (hoursSince >= 20) {
      nudgeShownRef.current = true;
      return "Your streak is safe until midnight! Just one tiny task to keep it going.";
    }
    return null;
  }, [stats, streak]);

  // Unclaimed rewards
  const unclaimedRewards = useUnclaimedRewards();
  const claimReward = useClaimReward();

  const handleClaimReward = useCallback(async (rewardId: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      await claimReward({ rewardId: toConvexId<'variableRewards'>(rewardId) });
    } catch {}
  }, [claimReward]);

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

  const handleStartBlitz = useCallback(
    (roomId: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setActiveRoom(roomId);
      router.push('/blitz');
    },
    [setActiveRoom],
  );

  const handleOpenRoom = useCallback((roomId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: '/room/[id]', params: { id: roomId } });
  }, []);

  // "Just 5 Minutes" handler — find room with most incomplete tasks
  const handleJust5Minutes = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (rooms.length === 0) {
      router.push('/camera');
      return;
    }
    // Find room with the most incomplete tasks
    const bestRoom = [...rooms].sort((a, b) => {
      const aInc = (a.tasks || []).filter(tk => !tk.completed).length;
      const bInc = (b.tasks || []).filter(tk => !tk.completed).length;
      return bInc - aInc;
    })[0];
    if (!bestRoom || (bestRoom.tasks || []).filter(tk => !tk.completed).length === 0) {
      router.push('/camera');
      return;
    }
    setActiveRoom(bestRoom.id);
    router.push({
      pathname: '/single-task',
      params: { roomId: bestRoom.id, duration: '300' },
    });
  }, [rooms, setActiveRoom]);

  const heroPress = useScalePress(0.97);

  // ── LOADING STATE ──────────────────────────────────────────────────────
  if (!isLoaded) {
    // Show error state if loading takes longer than 10 seconds
    if (loadTimedOut) {
      return (
        <View style={[styles.container, { backgroundColor: t.bg }]}>
          <QueryErrorState
            variant="timeout"
            title="Taking too long"
            message="Data loading slowly. Tap to continue with cached data."
            onRetry={() => {
              setLoadTimedOut(false);
              // Convex queries auto-reconnect; resetting the flag restarts the timer
            }}
          />
        </View>
      );
    }

    return (
      <View style={[styles.container, { backgroundColor: t.bg }]}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 100 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <HomeSkeleton />
        </ScrollView>
      </View>
    );
  }

  // ── EMPTY STATE ─────────────────────────────────────────────────────────
  if (rooms.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: t.bg }]}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 100 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <EmptyState
            userName={userName}
            isDark={isDark}
            reducedMotion={reducedMotion}
            onScanRoom={handleScanRoom}
          />
        </ScrollView>
      </View>
    );
  }

  // ── POPULATED STATE ─────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 100 },
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
        {/* Header with smart greeting */}
        <HomeHeader
          userName={userName}
          textColor={t.text}
          secondaryColor={t.textSecondary}
          mutedColor={t.textMuted}
          reducedMotion={reducedMotion}
          showMascot
        />

        {/* Unclaimed Rewards Banner */}
        {unclaimedRewards && unclaimedRewards.length > 0 && (
          <Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(40).duration(350)}>
            <Pressable
              onPress={() => handleClaimReward(unclaimedRewards[0]._id)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                marginHorizontal: SPACING.screenPadding,
                marginBottom: SPACING.itemGap,
                padding: 14,
                borderRadius: RADIUS.md,
                backgroundColor: isDark ? 'rgba(255,213,79,0.1)' : 'rgba(255,213,79,0.08)',
                borderWidth: 1,
                borderColor: isDark ? 'rgba(255,213,79,0.2)' : 'rgba(255,213,79,0.15)',
              }}
              accessibilityRole="button"
              accessibilityLabel={`Claim reward: ${unclaimedRewards.length} unclaimed`}
            >
              <Gift size={22} color={V1.gold} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: DISPLAY_FONT, fontSize: 15, fontWeight: '700', color: t.text }}>
                  {unclaimedRewards.length} Reward{unclaimedRewards.length > 1 ? 's' : ''} Waiting!
                </Text>
                <Text style={{ fontFamily: BODY_FONT, fontSize: 12, color: t.textSecondary }}>
                  Tap to claim your prize
                </Text>
              </View>
              <Text style={{ fontSize: 24 }}>{'\u{1F381}'}</Text>
            </Pressable>
          </Animated.View>
        )}

        {/* Continue Where You Left Off */}
        {continueRoom && (
          <Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(55).duration(400)}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push({ pathname: '/room/[id]', params: { id: continueRoom.room.id } });
              }}
              accessibilityRole="button"
              accessibilityLabel={`Continue ${continueRoom.room.name}, ${continueRoom.taskCount} tasks left`}
              style={({ pressed }) => [
                styles.continueBanner,
                {
                  backgroundColor: isDark
                    ? 'rgba(102,187,106,0.1)'
                    : 'rgba(102,187,106,0.08)',
                  borderColor: isDark
                    ? 'rgba(102,187,106,0.25)'
                    : 'rgba(102,187,106,0.2)',
                  opacity: pressed ? 0.88 : 1,
                },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.continueBannerTitle, { color: t.text }]}>
                  Continue: {continueRoom.room.name}
                </Text>
                <Text style={[styles.continueBannerSub, { color: t.textSecondary }]}>
                  {continueRoom.taskCount} task{continueRoom.taskCount !== 1 ? 's' : ''} left{' '}
                  {'\u00B7'} ~{continueRoom.totalMin} min
                </Text>
              </View>
              <View style={[styles.continueBannerButton, { backgroundColor: V1.green }]}>
                <Text style={styles.continueBannerButtonText}>Resume</Text>
              </View>
            </Pressable>
          </Animated.View>
        )}

        {/* Quick Blitz CTA */}
        {heroRoom && heroTaskCount > 0 && (
          <Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(60).duration(400)}>
            <Pressable
              onPress={() => handleStartBlitz(heroRoom.id)}
              accessibilityRole="button"
              accessibilityLabel={`Start a quick blitz cleaning session for ${heroRoom.name}`}
              style={({ pressed }) => [{ opacity: pressed ? 0.88 : 1 }]}
            >
              <LinearGradient
                colors={['#FF6B6B', '#FF5252']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.quickBlitzCta, styles.blitzCtaShadow]}
              >
                <Zap size={20} color="#FFFFFF" fill="#FFFFFF" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.quickBlitzTitle}>Start Cleaning</Text>
                  <Text style={styles.quickBlitzSub}>
                    {heroRoom.name} - {heroTaskCount} tasks - ~{heroTotalMinutes} min
                  </Text>
                </View>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        )}

        {/* Just 5 Minutes Quick Clean */}
        <Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(80).duration(400)}>
          <Pressable
            onPress={handleJust5Minutes}
            accessibilityRole="button"
            accessibilityLabel="Just 5 minutes quick clean"
            style={({ pressed }) => [{ opacity: pressed ? 0.88 : 1 }]}
          >
            <View
              style={[
                styles.just5MinButton,
                {
                  backgroundColor: V1.coral,
                },
              ]}
            >
              <Clock size={20} color="#FFFFFF" />
              <View style={{ flex: 1 }}>
                <Text style={styles.just5MinTitle}>Just 5 minutes</Text>
                <Text style={styles.just5MinSub}>
                  I'll pick the best tasks for you
                </Text>
              </View>
            </View>
          </Pressable>
        </Animated.View>

        {/* Streak Card */}
        <StreakCard
          streak={streak}
          todayDone={todayTasksDone.done}
          todayTotal={todayTasksDone.total}
          consistency={consistency}
          isDark={isDark}
          reducedMotion={reducedMotion}
        />

        {/* Grace Period Badge */}
        {gracePeriodBadge && (
          <GracePeriodBadge
            badge={gracePeriodBadge}
            isDark={isDark}
            reducedMotion={reducedMotion}
          />
        )}

        {/* Streak Nudge */}
        {streakNudge && (
          <StreakNudge message={streakNudge} isDark={isDark} reducedMotion={reducedMotion} />
        )}

        {/* Comeback Banner */}
        {comebackData && (
          <ComebackBanner
            message={comebackData.message}
            submessage={comebackData.submessage}
            emoji={comebackData.emoji}
            bonusActive={comebackData.bonusActive}
            tinyTask={comebackData.tinyTask}
            isDark={isDark}
            reducedMotion={reducedMotion}
            onDismiss={() => setComebackData(null)}
            onTinyTaskPress={() => {
              const tinyRoomId = comebackData?.tinyTask?.id;
              const matchingRoom = tinyRoomId
                ? rooms.find((r) => r.id === tinyRoomId)
                : null;
              if (matchingRoom) {
                setComebackData(null);
                router.push({ pathname: '/room/[id]', params: { id: matchingRoom.id } });
              } else {
                setComebackData(null);
                setTinyThingDone(true);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                setTimeout(() => setTinyThingDone(false), 2500);
              }
            }}
          />
        )}

        {/* Today's Tasks */}
        <TodaysTasksCard
          todaysTasks={todaysTasks}
          consistency={consistency}
          isDark={isDark}
          reducedMotion={reducedMotion}
          onToggleTask={toggleTask}
        />

        {/* Hero Mission Card */}
        {heroRoom && (
          <Animated.View
            entering={reducedMotion ? undefined : FadeInDown.delay(120).duration(400)}
          >
            <AnimatedPressable
              onPress={() => handleOpenRoom(heroRoom.id)}
              onPressIn={heroPress.onPressIn}
              onPressOut={heroPress.onPressOut}
              style={heroPress.animatedStyle}
              accessibilityRole="button"
              accessibilityLabel={`Today's mission: ${heroRoom.name} Refresh, ${heroTaskCount} tasks, about ${heroTotalMinutes} minutes`}
            >
              <View style={[styles.heroCard, isDark && styles.heroCardDarkBorder]}>
                {heroRoom.photos && heroRoom.photos.length > 0 ? (
                  <Image
                    source={{ uri: heroRoom.photos[0].uri }}
                    style={styles.heroImage}
                    contentFit="cover"
                    placeholder={{ blurhash: 'LGF5]+Yk^6#M@-5c,1J5@[or[Q6.' }}
                    cachePolicy="memory-disk"
                    transition={300}
                  />
                ) : (
                  <View
                    style={[
                      styles.heroImage,
                      { backgroundColor: isDark ? t.card : '#D0D0D0' },
                    ]}
                  />
                )}
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.85)']}
                  locations={[0, 0.4, 1]}
                  style={styles.heroGradient}
                />
                <View style={styles.heroContent}>
                  <View style={styles.heroPillsRow}>
                    <View style={[styles.heroPill, { backgroundColor: V1.coral }]}>
                      <Text style={styles.heroPillText}>Today's Mission</Text>
                    </View>
                    <Text style={styles.heroTimeText}>about {heroTotalMinutes} min</Text>
                  </View>
                  <Text style={styles.heroRoomName}>{heroRoom.name} Refresh</Text>
                  <Text style={styles.heroTaskCount}>
                    {heroTaskCount} quick tasks to feel the difference
                  </Text>
                  <Pressable
                    onPress={() => handleStartBlitz(heroRoom.id)}
                    accessibilityRole="button"
                    accessibilityLabel="Start a 15-minute blitz cleaning session"
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

        {/* Room Grid */}
        <RoomGrid
          rooms={rooms}
          roomFreshness={roomFreshness}
          startHereRoomId={startHereRoomId}
          isDark={isDark}
          reducedMotion={reducedMotion}
          isPro={isPro}
          freeRoomLimit={FREE_ROOM_LIMIT}
          onOpenRoom={handleOpenRoom}
          onScanRoom={handleScanRoom}
        />
      </ScrollView>

      {/* Floating Action Button */}
      <ScanRoomFAB onPress={handleScanRoom} bottomInset={insets.bottom} />

      {/* Tiny Thing Quick Completion Modal */}
      {tinyThingDone && (
        <Modal
          transparent
          animationType="fade"
          visible
          onRequestClose={() => setTinyThingDone(false)}
        >
          <Pressable
            style={styles.celebrationOverlay}
            onPress={() => setTinyThingDone(false)}
          >
            <View
              style={[
                styles.celebrationCard,
                { backgroundColor: t.card },
              ]}
            >
              <Text style={styles.celebrationEmoji}>{'Done! \u2728'}</Text>
              <Text
                style={[
                  styles.celebrationTitle,
                  { color: t.text },
                ]}
              >
                +5 XP
              </Text>
              <Text
                style={[
                  styles.celebrationDescription,
                  { color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)' },
                ]}
              >
                Every tiny thing counts. You showed up!
              </Text>
            </View>
          </Pressable>
        </Modal>
      )}

      {/* Celebration Modal for badge unlocks */}
      {pendingCelebration && pendingCelebration.length > 0 && (
        <Modal
          transparent
          animationType="fade"
          visible
          onRequestClose={clearCelebration}
        >
          <View style={styles.celebrationOverlay}>
            <View
              style={[
                styles.celebrationCard,
                { backgroundColor: t.card },
              ]}
            >
              <Text style={styles.celebrationEmoji}>
                {pendingCelebration[0]?.emoji || '\uD83C\uDFC6'}
              </Text>
              <Text
                style={[
                  styles.celebrationTitle,
                  { color: t.text },
                ]}
              >
                {pendingCelebration[0]?.name || 'Badge Unlocked!'}
              </Text>
              <Text
                style={[
                  styles.celebrationDescription,
                  { color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)' },
                ]}
              >
                {pendingCelebration[0]?.description || 'You earned a new badge!'}
              </Text>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  clearCelebration();
                }}
                style={[styles.celebrationButton, { backgroundColor: V1.coral }]}
                accessibilityRole="button"
                accessibilityLabel="Dismiss celebration"
              >
                <Text style={styles.celebrationButtonText}>Nice!</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: SPACING.screenPadding },

  // Continue Banner
  continueBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: SPACING.cardPadding,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    marginBottom: 12,
  },
  continueBannerTitle: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: BODY_FONT,
  },
  continueBannerSub: {
    fontSize: 13,
    fontFamily: BODY_FONT,
    marginTop: 2,
  },
  continueBannerButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
  },
  continueBannerButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: BODY_FONT,
  },

  // Just 5 Minutes
  just5MinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: RADIUS.lg,
    marginBottom: 16,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  just5MinTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    fontFamily: BODY_FONT,
  },
  just5MinSub: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '500',
    fontFamily: BODY_FONT,
    marginTop: 2,
  },

  // Quick Blitz CTA
  quickBlitzCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: RADIUS.lg,
    marginBottom: 16,
  },
  quickBlitzTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    fontFamily: BODY_FONT,
  },
  quickBlitzSub: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '500',
    fontFamily: BODY_FONT,
    marginTop: 2,
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

  // Celebration modal
  celebrationOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  celebrationCard: {
    width: '100%',
    borderRadius: RADIUS.lg,
    padding: 32,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
  celebrationEmoji: {
    fontSize: 56,
    marginBottom: 4,
  },
  celebrationTitle: {
    fontSize: 22,
    fontWeight: '700',
    fontFamily: DISPLAY_FONT,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  celebrationDescription: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: BODY_FONT,
    textAlign: 'center',
    lineHeight: 20,
  },
  celebrationButton: {
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 24,
    marginTop: 8,
  },
  celebrationButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: BODY_FONT,
  },
});
