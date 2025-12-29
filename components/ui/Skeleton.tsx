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
    ? 'rgba(255, 255, 255, 0.08)' 
    : 'rgba(0, 0, 0, 0.08)';
  const highlightColor = colorScheme === 'dark' 
    ? 'rgba(255, 255, 255, 0.15)' 
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
    <View style={[styles.textContainer, style]}>
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
    <Skeleton
      width={size}
      height={size}
      borderRadius={size / 2}
      style={style}
    />
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
            ? 'rgba(255, 255, 255, 0.08)'
            : 'rgba(0, 0, 0, 0.05)',
        },
        style,
      ]}
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
});

export default Skeleton;
