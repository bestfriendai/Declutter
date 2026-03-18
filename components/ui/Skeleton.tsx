/**
 * Declutterly - Skeleton Loading Component
 * Shimmer effect for loading states with reduced motion support
 */

import React, { useEffect } from 'react';
import { StyleSheet, View, ViewStyle, StyleProp, DimensionValue } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  useReducedMotion,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from '@/hooks/useColorScheme';

interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

export function Skeleton({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
}: SkeletonProps) {
  const colorScheme = useColorScheme() ?? 'dark';
  const reducedMotion = useReducedMotion();
  const shimmerProgress = useSharedValue(0);

  // Base colors for skeleton
  const baseColor = colorScheme === 'dark' 
    ? 'rgba(255, 255, 255, 0.06)'
    : 'rgba(0, 0, 0, 0.06)';
  const highlightColor = colorScheme === 'dark'
    ? 'rgba(255, 255, 255, 0.12)'
    : 'rgba(0, 0, 0, 0.04)';

  useEffect(() => {
    if (!reducedMotion) {
      shimmerProgress.value = withRepeat(
        withTiming(1, { duration: 1500, easing: Easing.ease }),
        -1, // Infinite repeat
        false // Don't reverse
      );
    }
  }, [reducedMotion]);

  const shimmerStyle = useAnimatedStyle(() => {
    if (reducedMotion) {
      // Static pulse for reduced motion
      return { opacity: 0.7 };
    }
    return {
      transform: [
        {
          translateX: interpolate(
            shimmerProgress.value,
            [0, 1],
            [-200, 200]
          ),
        },
      ],
    };
  });

  return (
    <View
      style={[
        styles.container,
        {
          width,
          height,
          borderRadius,
          backgroundColor: baseColor,
        },
        style,
      ]}
      accessibilityRole="progressbar"
      accessibilityLabel="Loading content"
    >
      {!reducedMotion && (
        <Animated.View style={[styles.shimmer, shimmerStyle]}>
          <LinearGradient
            colors={['transparent', highlightColor, 'transparent']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.gradient}
          />
        </Animated.View>
      )}
    </View>
  );
}

// Preset skeleton variants
interface SkeletonTextProps {
  lines?: number;
  lineHeight?: number;
  spacing?: number;
  lastLineWidth?: DimensionValue;
  style?: StyleProp<ViewStyle>;
}

export function SkeletonText({
  lines = 3,
  lineHeight = 16,
  spacing = 8,
  lastLineWidth = '60%',
  style,
}: SkeletonTextProps) {
  return (
    <View
      style={[styles.textContainer, style]}
      accessibilityRole="progressbar"
      accessibilityLabel={`Loading text content with ${lines} lines`}
    >
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          height={lineHeight}
          width={index === lines - 1 ? lastLineWidth : '100%'}
          borderRadius={4}
          style={{ marginBottom: index < lines - 1 ? spacing : 0 }}
        />
      ))}
    </View>
  );
}

interface SkeletonAvatarProps {
  size?: number;
  style?: StyleProp<ViewStyle>;
}

export function SkeletonAvatar({ size = 48, style }: SkeletonAvatarProps) {
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel="Loading avatar"
    >
      <Skeleton
        width={size}
        height={size}
        borderRadius={size / 2}
        style={style}
      />
    </View>
  );
}

interface SkeletonCardProps {
  style?: StyleProp<ViewStyle>;
}

export function SkeletonCard({ style }: SkeletonCardProps) {
  const colorScheme = useColorScheme() ?? 'dark';

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colorScheme === 'dark'
            ? 'rgba(255, 255, 255, 0.05)'
            : 'rgba(0, 0, 0, 0.02)',
          borderColor: colorScheme === 'dark'
            ? 'rgba(255, 255, 255, 0.07)'
            : 'rgba(0, 0, 0, 0.06)',
        },
        style,
      ]}
      accessibilityRole="progressbar"
      accessibilityLabel="Loading card content"
    >
      <View style={styles.cardHeader}>
        <SkeletonAvatar size={40} />
        <View style={styles.cardHeaderText}>
          <Skeleton height={14} width="70%" borderRadius={4} />
          <Skeleton height={12} width="40%" borderRadius={4} style={{ marginTop: 6 }} />
        </View>
      </View>
      <SkeletonText lines={2} style={{ marginTop: 16 }} />
    </View>
  );
}

interface SkeletonListItemProps {
  style?: StyleProp<ViewStyle>;
  showAvatar?: boolean;
  showSubtitle?: boolean;
}

export function SkeletonListItem({
  style,
  showAvatar = true,
  showSubtitle = true,
}: SkeletonListItemProps) {
  const colorScheme = useColorScheme() ?? 'dark';

  return (
    <View
      style={[
        styles.listItem,
        {
          backgroundColor: colorScheme === 'dark'
            ? 'rgba(255, 255, 255, 0.05)'
            : 'rgba(0, 0, 0, 0.02)',
        },
        style,
      ]}
      accessibilityRole="progressbar"
      accessibilityLabel="Loading list item"
    >
      {showAvatar && <SkeletonAvatar size={44} style={{ marginRight: 12 }} />}
      <View style={styles.listItemContent}>
        <Skeleton height={16} width="60%" borderRadius={4} />
        {showSubtitle && (
          <Skeleton height={12} width="40%" borderRadius={4} style={{ marginTop: 6 }} />
        )}
      </View>
      <Skeleton height={24} width={24} borderRadius={4} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  shimmer: {
    ...StyleSheet.absoluteFillObject,
    width: 200,
  },
  gradient: {
    flex: 1,
  },
  textContainer: {
    width: '100%',
  },
  card: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 0.5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardHeaderText: {
    flex: 1,
    marginLeft: 12,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    minHeight: 72,
  },
  listItemContent: {
    flex: 1,
  },
  // Additional skeleton styles
  roomCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
  },
  roomCardContent: {
    flex: 1,
    marginLeft: 12,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  statItemSkeleton: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionButton: {
    alignItems: 'center',
  },
  homeScreenSkeleton: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  headerSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  sectionSkeleton: {
    marginBottom: 28,
  },
  sectionHeaderSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressScreenSkeleton: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  ringsCardSkeleton: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    marginBottom: 20,
  },
  legendSkeleton: {
    width: '100%',
    marginTop: 24,
  },
  statsGridSkeleton: {
    marginBottom: 24,
  },
  statsGridRow: {
    flexDirection: 'row',
  },
  roomScreenSkeleton: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  roomHeaderSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  roomHeaderInfo: {
    flex: 1,
    marginLeft: 12,
  },
  progressBarSkeleton: {
    marginBottom: 20,
  },
  progressBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filtersSkeleton: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  chartHeaderSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartBarsSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
  },
  chartBarItemSkeleton: {
    alignItems: 'center',
    flex: 1,
  },
});

// Room Card Skeleton
export function SkeletonRoomCard({ style }: { style?: StyleProp<ViewStyle> }) {
  const colorScheme = useColorScheme() ?? 'dark';

  return (
    <View
      style={[
        styles.roomCard,
        {
          backgroundColor: colorScheme === 'dark'
            ? 'rgba(255, 255, 255, 0.05)'
            : 'rgba(0, 0, 0, 0.02)',
        },
        style,
      ]}
      accessibilityRole="progressbar"
      accessibilityLabel="Loading room card"
    >
      <SkeletonAvatar size={48} style={{ borderRadius: 12 }} />
      <View style={styles.roomCardContent}>
        <Skeleton height={16} width="60%" borderRadius={4} />
        <Skeleton height={12} width="40%" borderRadius={4} style={{ marginTop: 6 }} />
      </View>
      <Skeleton height={40} width={40} borderRadius={20} />
    </View>
  );
}

// Stats Row Skeleton
export function SkeletonStatsRow({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <View
      style={[styles.statsRow, style]}
      accessibilityRole="progressbar"
      accessibilityLabel="Loading statistics"
    >
      <View style={styles.statItemSkeleton}>
        <Skeleton height={28} width={50} borderRadius={4} />
        <Skeleton height={12} width={60} borderRadius={4} style={{ marginTop: 4 }} />
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItemSkeleton}>
        <Skeleton height={28} width={40} borderRadius={4} />
        <Skeleton height={12} width={70} borderRadius={4} style={{ marginTop: 4 }} />
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItemSkeleton}>
        <Skeleton height={28} width={45} borderRadius={4} />
        <Skeleton height={12} width={65} borderRadius={4} style={{ marginTop: 4 }} />
      </View>
    </View>
  );
}

// Action Button Skeleton
export function SkeletonActionButton({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <View
      style={[styles.actionButton, style]}
      accessibilityRole="progressbar"
      accessibilityLabel="Loading action button"
    >
      <Skeleton height={56} width={56} borderRadius={20} />
      <Skeleton height={12} width={40} borderRadius={4} style={{ marginTop: 8 }} />
    </View>
  );
}

// Home Screen Loading Skeleton
export function HomeScreenSkeleton() {
  return (
    <View
      style={styles.homeScreenSkeleton}
      accessibilityRole="progressbar"
      accessibilityLabel="Loading home screen"
    >
      {/* Header */}
      <View style={styles.headerSkeleton}>
        <View>
          <Skeleton height={14} width={100} borderRadius={4} />
          <Skeleton height={28} width={140} borderRadius={4} style={{ marginTop: 4 }} />
        </View>
        <SkeletonAvatar size={44} />
      </View>

      {/* Stats Row */}
      <SkeletonStatsRow style={{ marginBottom: 24 }} />

      {/* Quick Actions */}
      <View style={styles.sectionSkeleton}>
        <Skeleton height={18} width={100} borderRadius={4} style={{ marginBottom: 12 }} />
        <View style={styles.actionsRow}>
          <SkeletonActionButton />
          <SkeletonActionButton />
          <SkeletonActionButton />
          <SkeletonActionButton />
        </View>
      </View>

      {/* Rooms Section */}
      <View style={styles.sectionSkeleton}>
        <View style={styles.sectionHeaderSkeleton}>
          <Skeleton height={18} width={80} borderRadius={4} />
          <Skeleton height={14} width={40} borderRadius={4} />
        </View>
        <SkeletonRoomCard style={{ marginBottom: 12 }} />
        <SkeletonRoomCard style={{ marginBottom: 12 }} />
        <SkeletonRoomCard />
      </View>
    </View>
  );
}

// Room Screen Loading Skeleton
export function RoomScreenSkeleton() {
  return (
    <View
      style={styles.roomScreenSkeleton}
      accessibilityRole="progressbar"
      accessibilityLabel="Loading room details"
    >
      {/* Room Header */}
      <View style={styles.roomHeaderSkeleton}>
        <SkeletonAvatar size={60} style={{ borderRadius: 16 }} />
        <View style={styles.roomHeaderInfo}>
          <Skeleton height={24} width="50%" borderRadius={4} />
          <Skeleton height={14} width="30%" borderRadius={4} style={{ marginTop: 6 }} />
        </View>
        <Skeleton height={40} width={40} borderRadius={20} />
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarSkeleton}>
        <View style={styles.progressBarHeader}>
          <Skeleton height={14} width={80} borderRadius={4} />
          <Skeleton height={14} width={40} borderRadius={4} />
        </View>
        <Skeleton height={8} width="100%" borderRadius={4} style={{ marginTop: 8 }} />
      </View>

      {/* Filters */}
      <View style={styles.filtersSkeleton}>
        <Skeleton height={32} width={70} borderRadius={16} />
        <Skeleton height={32} width={80} borderRadius={16} style={{ marginLeft: 8 }} />
        <Skeleton height={32} width={90} borderRadius={16} style={{ marginLeft: 8 }} />
      </View>

      {/* Task Items */}
      <View style={{ marginTop: 16 }}>
        <SkeletonListItem style={{ marginBottom: 12 }} />
        <SkeletonListItem style={{ marginBottom: 12 }} />
        <SkeletonListItem style={{ marginBottom: 12 }} />
        <SkeletonListItem style={{ marginBottom: 12 }} />
        <SkeletonListItem />
      </View>
    </View>
  );
}

// Progress Screen Loading Skeleton
export function ProgressScreenSkeleton() {
  return (
    <View
      style={styles.progressScreenSkeleton}
      accessibilityRole="progressbar"
      accessibilityLabel="Loading progress data"
    >
      {/* Header */}
      <View style={{ marginBottom: 24 }}>
        <Skeleton height={32} width={120} borderRadius={4} />
        <Skeleton height={16} width={180} borderRadius={4} style={{ marginTop: 4 }} />
      </View>

      {/* Rings Card */}
      <View style={styles.ringsCardSkeleton}>
        <Skeleton height={180} width={180} borderRadius={90} />
        <View style={styles.legendSkeleton}>
          <SkeletonListItem showAvatar={false} style={{ marginBottom: 8 }} />
          <SkeletonListItem showAvatar={false} style={{ marginBottom: 8 }} />
          <SkeletonListItem showAvatar={false} />
        </View>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGridSkeleton}>
        <View style={styles.statsGridRow}>
          <SkeletonCard style={{ flex: 1, marginRight: 6 }} />
          <SkeletonCard style={{ flex: 1, marginLeft: 6 }} />
        </View>
        <View style={[styles.statsGridRow, { marginTop: 12 }]}>
          <SkeletonCard style={{ flex: 1, marginRight: 6 }} />
          <SkeletonCard style={{ flex: 1, marginLeft: 6 }} />
        </View>
      </View>
    </View>
  );
}

// Insights Screen Loading Skeleton
export function InsightsScreenSkeleton() {
  const colorScheme = useColorScheme() ?? 'dark';

  return (
    <View
      style={styles.homeScreenSkeleton}
      accessibilityRole="progressbar"
      accessibilityLabel="Loading insights"
    >
      {/* Time Period Selector */}
      <View style={[styles.filtersSkeleton, { justifyContent: 'center', marginBottom: 16 }]}>
        <Skeleton height={36} width={60} borderRadius={18} />
        <Skeleton height={36} width={60} borderRadius={18} style={{ marginLeft: 8 }} />
        <Skeleton height={36} width={60} borderRadius={18} style={{ marginLeft: 8 }} />
        <Skeleton height={36} width={50} borderRadius={18} style={{ marginLeft: 8 }} />
      </View>

      {/* Stats Grid - 2x2 */}
      <View style={styles.statsGridSkeleton}>
        <View style={styles.statsGridRow}>
          <InsightsStatTileSkeleton style={{ flex: 1, marginRight: 6 }} />
          <InsightsStatTileSkeleton style={{ flex: 1, marginLeft: 6 }} />
        </View>
        <View style={[styles.statsGridRow, { marginTop: 12 }]}>
          <InsightsStatTileSkeleton style={{ flex: 1, marginRight: 6 }} />
          <InsightsStatTileSkeleton style={{ flex: 1, marginLeft: 6 }} />
        </View>
      </View>

      {/* Weekly Activity Chart */}
      <View style={[styles.card, { backgroundColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)', borderColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.05)', marginBottom: 16 }]}>
        <View style={styles.chartHeaderSkeleton}>
          <Skeleton height={16} width={120} borderRadius={4} />
          <Skeleton height={12} width={50} borderRadius={4} />
        </View>
        <View style={styles.chartBarsSkeleton}>
          {[...Array(7)].map((_, i) => (
            <View key={i} style={styles.chartBarItemSkeleton}>
              <Skeleton
                height={Math.random() * 60 + 20}
                width={24}
                borderRadius={12}
              />
              <Skeleton height={10} width={24} borderRadius={4} style={{ marginTop: 6 }} />
            </View>
          ))}
        </View>
      </View>

      {/* Progress Rings */}
      <View style={[styles.card, { backgroundColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)', borderColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.05)', marginBottom: 16, padding: 16 }]}>
        <Skeleton height={16} width={120} borderRadius={4} style={{ marginBottom: 16 }} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
          <View style={{ alignItems: 'center' }}>
            <Skeleton height={80} width={80} borderRadius={40} />
            <Skeleton height={12} width={40} borderRadius={4} style={{ marginTop: 8 }} />
          </View>
          <View style={{ alignItems: 'center' }}>
            <Skeleton height={80} width={80} borderRadius={40} />
            <Skeleton height={12} width={60} borderRadius={4} style={{ marginTop: 8 }} />
          </View>
          <View style={{ alignItems: 'center' }}>
            <Skeleton height={80} width={80} borderRadius={40} />
            <Skeleton height={12} width={50} borderRadius={4} style={{ marginTop: 8 }} />
          </View>
        </View>
      </View>

      {/* Room Performance */}
      <View style={[styles.card, { backgroundColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)', borderColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.05)', padding: 16 }]}>
        <Skeleton height={16} width={130} borderRadius={4} style={{ marginBottom: 16 }} />
        <InsightsRoomRowSkeleton />
        <InsightsRoomRowSkeleton />
        <InsightsRoomRowSkeleton />
      </View>
    </View>
  );
}

// Helper skeleton components for Insights
function InsightsStatTileSkeleton({ style }: { style?: StyleProp<ViewStyle> }) {
  const colorScheme = useColorScheme() ?? 'dark';

  return (
    <View style={[{
      padding: 16,
      borderRadius: 16,
      backgroundColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
    }, style]}>
      <Skeleton height={36} width={36} borderRadius={18} style={{ marginBottom: 8 }} />
      <Skeleton height={24} width={50} borderRadius={4} />
      <Skeleton height={12} width={70} borderRadius={4} style={{ marginTop: 4 }} />
    </View>
  );
}

function InsightsRoomRowSkeleton() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', width: 120 }}>
        <Skeleton height={24} width={24} borderRadius={4} />
        <Skeleton height={14} width={60} borderRadius={4} style={{ marginLeft: 8 }} />
      </View>
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Skeleton height={8} width="70%" borderRadius={4} />
        <Skeleton height={12} width={30} borderRadius={4} />
      </View>
    </View>
  );
}

export default Skeleton;
