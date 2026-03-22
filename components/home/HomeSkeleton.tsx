/**
 * HomeSkeleton -- Skeleton loading state with shimmer animation
 */

import React, { useEffect } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useColorScheme } from '@/hooks/useColorScheme';
import { getTheme, RADIUS, SPACING } from '@/constants/designTokens';

// ── Skeleton box with shimmer ───────────────────────────────────────────────

function SkeletonBox({
  width,
  height,
  borderRadius = 8,
  style,
}: {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: any;
}) {
  const rawScheme = useColorScheme();
  const isDark = rawScheme === 'dark';
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.7, { duration: 900 }), -1, true);
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          // DimensionValue accepts string | number but ViewStyle narrowly types width as number
          width: width as unknown as number,
          height,
          borderRadius,
          backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
        },
        animStyle,
        style,
      ]}
    />
  );
}

function SkeletonTaskRow() {
  return (
    <View style={styles.taskRow}>
      <SkeletonBox width={22} height={22} borderRadius={11} />
      <View style={{ flex: 1, gap: 6 }}>
        <SkeletonBox width="70%" height={14} borderRadius={4} />
        <SkeletonBox width="40%" height={12} borderRadius={4} />
      </View>
    </View>
  );
}

function SkeletonSpaceCard({ screenWidth }: { screenWidth: number }) {
  const rawScheme = useColorScheme();
  const isDark = rawScheme === 'dark';
  const t = getTheme(isDark);
  return (
    <View
      style={{
        width: (screenWidth - SPACING.screenPadding * 2 - SPACING.itemGap) / 2,
        padding: SPACING.cardPadding,
        borderRadius: RADIUS.lg,
        borderWidth: 1,
        backgroundColor: t.card,
        borderColor: t.border,
      }}
    >
      <SkeletonBox width={28} height={28} borderRadius={6} style={{ marginBottom: 10 }} />
      <SkeletonBox width="65%" height={15} borderRadius={4} style={{ marginBottom: 10 }} />
      <SkeletonBox width="100%" height={5} borderRadius={3} style={{ marginBottom: 6 }} />
      <SkeletonBox width="45%" height={12} borderRadius={4} />
    </View>
  );
}

// ── Main Skeleton ───────────────────────────────────────────────────────────

export function HomeSkeleton() {
  const rawScheme = useColorScheme();
  const isDark = rawScheme === 'dark';
  const t = getTheme(isDark);
  const { width: screenWidth } = useWindowDimensions();

  return (
    <View style={{ paddingHorizontal: SPACING.screenPadding }}>
      {/* Header skeleton */}
      <View style={styles.headerSkeleton}>
        <View style={{ gap: 6 }}>
          <SkeletonBox width={160} height={22} borderRadius={6} />
          <SkeletonBox width={110} height={14} borderRadius={4} />
        </View>
        <SkeletonBox width={44} height={44} borderRadius={22} />
      </View>

      {/* Quote skeleton */}
      <SkeletonBox width="55%" height={13} borderRadius={4} style={{ marginBottom: 16 }} />

      {/* Quick Blitz CTA skeleton */}
      <SkeletonBox width="100%" height={56} borderRadius={RADIUS.lg} style={{ marginBottom: 16 }} />

      {/* Streak card skeleton */}
      <View
        style={[
          styles.streakSkeleton,
          { backgroundColor: t.card, borderColor: t.border },
        ]}
      >
        <SkeletonBox width={100} height={14} borderRadius={4} />
        <SkeletonBox width={80} height={14} borderRadius={4} />
      </View>

      {/* Today's Tasks skeleton */}
      <SkeletonBox width={100} height={11} borderRadius={4} style={{ marginBottom: SPACING.itemGap, marginTop: 4 }} />
      <View
        style={[
          styles.tasksSkeleton,
          { backgroundColor: t.card, borderColor: t.border },
        ]}
      >
        <View style={styles.tasksSkeletonHeader}>
          <SkeletonBox width={120} height={13} borderRadius={4} />
          <SkeletonBox width={60} height={12} borderRadius={4} />
        </View>
        <SkeletonTaskRow />
        <View
          style={[
            styles.divider,
            { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' },
          ]}
        />
        <SkeletonTaskRow />
        <View
          style={[
            styles.divider,
            { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' },
          ]}
        />
        <SkeletonTaskRow />
      </View>

      {/* Hero card skeleton */}
      <SkeletonBox width="100%" height={240} borderRadius={RADIUS.lg} style={{ marginBottom: 24 }} />

      {/* Your Spaces skeleton */}
      <SkeletonBox width={90} height={11} borderRadius={4} style={{ marginBottom: SPACING.itemGap, marginTop: 8 }} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.itemGap }}>
        <SkeletonSpaceCard screenWidth={screenWidth} />
        <SkeletonSpaceCard screenWidth={screenWidth} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  streakSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: SPACING.cardPadding,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    marginBottom: SPACING.cardPadding,
  },
  tasksSkeleton: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
  },
  tasksSkeletonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.cardPadding,
    paddingTop: 14,
    paddingBottom: 10,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.cardPadding,
    paddingVertical: 12,
    gap: 12,
  },
  divider: {
    height: 1,
    marginHorizontal: SPACING.cardPadding,
  },
});
