/**
 * Declutterly - Stat Card Component
 * Apple TV style statistics display cards
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ViewStyle,
  StyleProp,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  Easing,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/theme/typography';
import { useCardPress } from '@/hooks/useAnimatedPress';

type StatCardSize = 'small' | 'medium' | 'large';
type StatCardVariant = 'default' | 'glass' | 'gradient' | 'outlined';

interface StatCardProps {
  value: string | number;
  label: string;
  icon?: React.ReactNode;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    value: string;
  };
  size?: StatCardSize;
  variant?: StatCardVariant;
  gradientColors?: string[];
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  animateValue?: boolean;
  animationDelay?: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function StatCard({
  value,
  label,
  icon,
  trend,
  size = 'medium',
  variant = 'glass',
  gradientColors,
  onPress,
  style,
  animateValue = true,
  animationDelay = 0,
}: StatCardProps) {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const { animatedStyle: pressStyle, onPressIn, onPressOut } = useCardPress();

  // Animate entrance
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    opacity.value = withDelay(
      animationDelay,
      withTiming(1, { duration: 400 })
    );
    translateY.value = withDelay(
      animationDelay,
      withSpring(0, { damping: 18, stiffness: 200 })
    );
  }, [animationDelay]);

  const entranceStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          container: { padding: 12, minWidth: 100 },
          value: Typography.title3,
          label: Typography.caption1,
          iconSize: 20,
        };
      case 'large':
        return {
          container: { padding: 20, minWidth: 160 },
          value: Typography.display1,
          label: Typography.subheadline,
          iconSize: 32,
        };
      default:
        return {
          container: { padding: 16, minWidth: 130 },
          value: Typography.title1,
          label: Typography.caption1,
          iconSize: 24,
        };
    }
  };

  const sizeStyles = getSizeStyles();

  const getTrendColor = () => {
    if (!trend) return colors.textSecondary;
    switch (trend.direction) {
      case 'up':
        return colors.success;
      case 'down':
        return colors.danger;
      default:
        return colors.textSecondary;
    }
  };

  const getTrendIcon = () => {
    if (!trend) return null;
    switch (trend.direction) {
      case 'up':
        return '↑';
      case 'down':
        return '↓';
      default:
        return '→';
    }
  };

  const renderBackground = () => {
    switch (variant) {
      case 'gradient':
        const gradColors = gradientColors ?? [...colors.gradientPrimary];
        return (
          <LinearGradient
            colors={gradColors as [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        );
      case 'outlined':
        return (
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                borderWidth: 1,
                borderColor: colorScheme === 'dark'
                  ? 'rgba(255, 255, 255, 0.15)'
                  : 'rgba(0, 0, 0, 0.1)',
                borderRadius: 16,
              },
            ]}
          />
        );
      case 'glass':
      default:
        return (
          <>
            <BlurView
              intensity={60}
              tint={colorScheme === 'dark' ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: colorScheme === 'dark'
                    ? 'rgba(30, 30, 30, 0.6)'
                    : 'rgba(255, 255, 255, 0.7)',
                },
              ]}
            />
          </>
        );
    }
  };

  const textColor = variant === 'gradient' ? '#FFFFFF' : colors.text;
  const secondaryTextColor = variant === 'gradient' ? 'rgba(255,255,255,0.7)' : colors.textSecondary;

  const content = (
    <View style={[styles.container, sizeStyles.container, { borderRadius: 16 }, style]}>
      {renderBackground()}

      {/* Top highlight */}
      <LinearGradient
        colors={
          colorScheme === 'dark'
            ? ['rgba(255, 255, 255, 0.06)', 'rgba(255, 255, 255, 0)']
            : ['rgba(255, 255, 255, 0.4)', 'rgba(255, 255, 255, 0)']
        }
        style={styles.highlight}
      />

      <View style={styles.content}>
        {icon && (
          <View style={[styles.iconContainer, { marginBottom: size === 'small' ? 6 : 8 }]}>
            {icon}
          </View>
        )}

        <Text
          style={[
            sizeStyles.value,
            { color: textColor },
            styles.value,
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {value}
        </Text>

        <View style={styles.labelRow}>
          <Text
            style={[
              sizeStyles.label,
              { color: secondaryTextColor },
            ]}
            numberOfLines={1}
          >
            {label}
          </Text>

          {trend && (
            <View style={styles.trend}>
              <Text style={[Typography.caption1, { color: getTrendColor() }]}>
                {getTrendIcon()} {trend.value}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );

  if (onPress) {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={[pressStyle, entranceStyle]}
      >
        {content}
      </AnimatedPressable>
    );
  }

  return (
    <Animated.View style={entranceStyle}>
      {content}
    </Animated.View>
  );
}

// Bento grid layout component
interface BentoGridProps {
  children: React.ReactNode;
  columns?: number;
  gap?: number;
}

export function BentoGrid({
  children,
  columns = 2,
  gap = 12,
}: BentoGridProps) {
  return (
    <View style={[styles.bentoGrid, { gap }]}>
      {children}
    </View>
  );
}

// Large stat card for hero sections
export function HeroStatCard({
  value,
  label,
  subtitle,
  icon,
  gradientColors,
}: {
  value: string | number;
  label: string;
  subtitle?: string;
  icon?: React.ReactNode;
  gradientColors?: string[];
}) {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const gradColors = gradientColors ?? [...colors.gradientPrimary];

  return (
    <View style={styles.heroCard}>
      <LinearGradient
        colors={gradColors as [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.heroContent}>
        {icon && <View style={styles.heroIcon}>{icon}</View>}
        <Text style={[Typography.display1, { color: '#FFFFFF' }]}>
          {value}
        </Text>
        <Text style={[Typography.headline, { color: 'rgba(255,255,255,0.9)' }]}>
          {label}
        </Text>
        {subtitle && (
          <Text style={[Typography.subheadline, { color: 'rgba(255,255,255,0.7)', marginTop: 4 }]}>
            {subtitle}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  content: {
    position: 'relative',
    zIndex: 1,
  },
  highlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 40,
    zIndex: 0,
  },
  iconContainer: {
    alignSelf: 'flex-start',
  },
  value: {
    marginBottom: 4,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  trend: {
    marginLeft: 8,
  },
  bentoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  heroCard: {
    borderRadius: 24,
    padding: 24,
    overflow: 'hidden',
    minHeight: 160,
  },
  heroContent: {
    position: 'relative',
    zIndex: 1,
  },
  heroIcon: {
    marginBottom: 12,
  },
});

export default StatCard;
