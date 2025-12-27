/**
 * Declutterly - Activity Rings Component
 * Apple Fitness style animated progress rings
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors, RingColors } from '@/constants/Colors';
import { Typography } from '@/theme/typography';

// Typed as any to avoid reanimated/svg type incompatibilities
const AnimatedCircle: any = Animated.createAnimatedComponent(Circle as any);

interface RingData {
  value: number; // 0-100
  maxValue?: number;
  color: string;
  gradientColors?: string[];
  label: string;
  icon?: string;
}

interface ActivityRingsProps {
  rings: RingData[];
  size?: number;
  strokeWidth?: number;
  showLabels?: boolean;
  showCenter?: boolean;
  centerContent?: React.ReactNode;
  animationDelay?: number;
  animationDuration?: number;
}

export function ActivityRings({
  rings,
  size = 200,
  strokeWidth = 20,
  showLabels = true,
  showCenter = true,
  centerContent,
  animationDelay = 300,
  animationDuration = 1500,
}: ActivityRingsProps) {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];

  // Calculate ring dimensions
  const center = size / 2;
  const ringGap = strokeWidth * 0.3;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Defs>
          {rings.map((ring, index) => (
            <LinearGradient
              key={`gradient-${index}`}
              id={`ring-gradient-${index}`}
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <Stop
                offset="0%"
                stopColor={ring.gradientColors?.[0] ?? ring.color}
              />
              <Stop
                offset="100%"
                stopColor={ring.gradientColors?.[1] ?? ring.color}
              />
            </LinearGradient>
          ))}
        </Defs>

        {rings.map((ring, index) => {
          const radius = center - strokeWidth / 2 - index * (strokeWidth + ringGap);
          return (
            <Ring
              key={index}
              index={index}
              cx={center}
              cy={center}
              radius={radius}
              strokeWidth={strokeWidth}
              progress={ring.value / (ring.maxValue ?? 100)}
              gradientId={`ring-gradient-${index}`}
              backgroundColor={colorScheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}
              animationDelay={animationDelay + index * 150}
              animationDuration={animationDuration}
            />
          );
        })}
      </Svg>

      {showCenter && (
        <View style={styles.centerContent}>
          {centerContent ?? (
            <View style={styles.defaultCenter}>
              <Text style={[Typography.statLarge, { color: colors.text }]}>
                {Math.round(
                  rings.reduce((sum, r) => sum + r.value, 0) / rings.length
                )}%
              </Text>
              <Text style={[Typography.caption1, { color: colors.textSecondary }]}>
                Average
              </Text>
            </View>
          )}
        </View>
      )}

      {showLabels && (
        <View style={styles.labels}>
          {rings.map((ring, index) => (
            <View key={index} style={styles.labelItem}>
              <View style={[styles.labelDot, { backgroundColor: ring.color }]} />
              <Text style={[Typography.caption1, { color: colors.textSecondary }]}>
                {ring.label}
              </Text>
              <Text style={[Typography.caption1Medium, { color: colors.text, marginLeft: 4 }]}>
                {ring.value}%
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// Individual ring component
interface RingProps {
  index: number;
  cx: number;
  cy: number;
  radius: number;
  strokeWidth: number;
  progress: number;
  gradientId: string;
  backgroundColor: string;
  animationDelay: number;
  animationDuration: number;
}

function Ring({
  index,
  cx,
  cy,
  radius,
  strokeWidth,
  progress,
  gradientId,
  backgroundColor,
  animationDelay,
  animationDuration,
}: RingProps) {
  const circumference = 2 * Math.PI * radius;
  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    animatedProgress.value = withDelay(
      animationDelay,
      withTiming(Math.min(progress, 1), {
        duration: animationDuration,
        easing: Easing.out(Easing.cubic),
      })
    );
  }, [progress, animationDelay, animationDuration]);

  const animatedProps = useAnimatedProps(() => {
    const strokeDashoffset = circumference * (1 - animatedProgress.value);
    return {
      strokeDashoffset,
    };
  });

  return (
    <>
      {/* Background ring */}
      <Circle
        cx={cx}
        cy={cy}
        r={radius}
        stroke={backgroundColor}
        strokeWidth={strokeWidth}
        fill="none"
      />
      {/* Progress ring */}
      <AnimatedCircle
        cx={cx}
        cy={cy}
        r={radius}
        stroke={`url(#${gradientId})`}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={circumference}
        animatedProps={animatedProps}
        rotation="-90"
        origin={`${cx}, ${cy}`}
      />
    </>
  );
}

// Single ring component for simpler use cases
interface SingleRingProps {
  value?: number;
  progress?: number; // Alias for value (0-100)
  maxValue?: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  gradientColors?: string[];
  showValue?: boolean;
  label?: string;
  children?: React.ReactNode;
}

export function SingleRing({
  value,
  progress,
  maxValue = 100,
  size = 120,
  strokeWidth = 12,
  color,
  backgroundColor,
  gradientColors,
  showValue = true,
  label,
  children,
}: SingleRingProps) {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const ringColor = color ?? colors.primary;
  const actualValue = value ?? progress ?? 0;
  const bgColor = backgroundColor ?? (colorScheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)');

  const center = size / 2;
  const radius = center - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;
  const progressValue = Math.min(actualValue / maxValue, 1);

  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    animatedProgress.value = withDelay(
      300,
      withTiming(progressValue, {
        duration: 1200,
        easing: Easing.out(Easing.cubic),
      })
    );
  }, [progressValue]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - animatedProgress.value),
  }));

  return (
    <View style={[styles.singleRingContainer, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="single-ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={gradientColors?.[0] ?? ringColor} />
            <Stop offset="100%" stopColor={gradientColors?.[1] ?? ringColor} />
          </LinearGradient>
        </Defs>
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={bgColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={center}
          cy={center}
          r={radius}
          stroke="url(#single-ring-gradient)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          rotation="-90"
          origin={`${center}, ${center}`}
        />
      </Svg>
      <View style={styles.singleRingCenter}>
        {children ?? (
          <>
            {showValue && (
              <Text style={[Typography.title2, { color: colors.text }]}>
                {value}
              </Text>
            )}
            {label && (
              <Text style={[Typography.caption1, { color: colors.textSecondary }]}>
                {label}
              </Text>
            )}
          </>
        )}
      </View>
    </View>
  );
}

// Default ring configuration for Declutterly
export function DeclutterRings({
  tasksProgress,
  timeProgress,
  streakProgress,
  size = 200,
}: {
  tasksProgress: number;
  timeProgress: number;
  streakProgress: number;
  size?: number;
}) {
  return (
    <ActivityRings
      size={size}
      rings={[
        {
          value: tasksProgress,
          color: RingColors.tasks,
          gradientColors: ['#F87171', '#EF4444'],
          label: 'Tasks',
        },
        {
          value: timeProgress,
          color: RingColors.time,
          gradientColors: ['#34D399', '#10B981'],
          label: 'Time',
        },
        {
          value: streakProgress,
          color: RingColors.streak,
          gradientColors: ['#60A5FA', '#3B82F6'],
          label: 'Streak',
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  defaultCenter: {
    alignItems: 'center',
  },
  labels: {
    position: 'absolute',
    bottom: -50,
    flexDirection: 'row',
    gap: 16,
  },
  labelItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  labelDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  singleRingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  singleRingCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ActivityRings;
