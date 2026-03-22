/**
 * Declutterly -- Home Screen (V1 Core Flow)
 * Thin orchestrator that imports sub-components from components/home/
 * Matches Pencil designs: rSSHH (populated) + TPr0p (empty state)
 */

import { useDeclutter } from '@/context/DeclutterContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useSubscription, FREE_ROOM_LIMIT } from '@/hooks/useSubscription';
import { useRoomFreshness } from '@/hooks/useRoomFreshness';
import { useTodaysTasks } from '@/hooks/useTodaysTasks';
import {
  V1,
  SPACING,
  getTheme,
} from '@/constants/designTokens';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenErrorBoundary } from '@/components/ErrorBoundary';
import { QueryErrorState } from '@/components/ui/QueryErrorState';

// Sub-components
import {
  HomeHeader,
  StreakCard,
  RoomGrid,
  EmptyState,
  HomeSkeleton,
  ScanRoomFAB,
} from '@/components/home';

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
  const {
    rooms,
    user,
    stats,
    activeRoomId,
    setActiveRoom,
    isLoaded,
  } = useDeclutter();
  const { isPro } = useSubscription();
  const reducedMotion = useReducedMotion();
  const roomFreshness = useRoomFreshness(rooms);
  const todaysTasks = useTodaysTasks(rooms);

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

        {/* Streak Card */}
        <StreakCard
          streak={streak}
          todayDone={todayTasksDone.done}
          todayTotal={todayTasksDone.total}
          isDark={isDark}
          reducedMotion={reducedMotion}
        />

        {/* Room Grid */}
        <RoomGrid
          rooms={rooms}
          roomFreshness={roomFreshness}
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
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: SPACING.screenPadding },
});
