/**
 * RoomProgress — Progress ring and completion percentage for Room Detail
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { V1, BODY_FONT, DISPLAY_FONT } from '@/constants/designTokens';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface RoomProgressProps {
  completedTasks: number;
  totalTasks: number;
  remainingMinutes: number;
  skippedCount: number;
  isDark: boolean;
}

export function RoomProgress({
  completedTasks,
  totalTasks,
  remainingMinutes,
  skippedCount,
  isDark,
}: RoomProgressProps) {
  const t = isDark ? V1.dark : V1.light;
  const activeTasks = totalTasks - skippedCount;
  const progress = activeTasks > 0 ? (completedTasks / activeTasks) * 100 : 0;
  const remaining = activeTasks - completedTasks;

  return (
    <View style={styles.container}>
      {/* Mini progress ring */}
      <View style={styles.ringContainer}>
        <ProgressRing
          progress={progress / 100}
          size={48}
          strokeWidth={4}
          color={progress >= 90 ? V1.green : progress >= 50 ? V1.amber : V1.coral}
          trackColor={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}
        />
        <Text style={[styles.ringPercent, { color: t.text }]}>
          {Math.round(progress)}%
        </Text>
      </View>

      {/* Stats */}
      <View style={styles.stats}>
        <Text style={[styles.statLine, { color: t.textSecondary }]}>
          {completedTasks} of {activeTasks} tasks done
        </Text>
        <Text style={[styles.statLine, { color: t.textMuted }]}>
          ~{remainingMinutes} min remaining
          {skippedCount > 0 ? `  \u00B7  ${skippedCount} skipped` : ''}
        </Text>
      </View>
    </View>
  );
}

function ProgressRing({
  progress,
  size,
  strokeWidth,
  color,
  trackColor,
}: {
  progress: number;
  size: number;
  strokeWidth: number;
  color: string;
  trackColor: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - Math.max(0, Math.min(1, progress)));

  return (
    <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={trackColor}
        strokeWidth={strokeWidth}
        fill="none"
      />
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 6,
  },
  ringContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringPercent: {
    position: 'absolute',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: BODY_FONT,
  },
  stats: {
    flex: 1,
    gap: 2,
  },
  statLine: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: BODY_FONT,
  },
});
