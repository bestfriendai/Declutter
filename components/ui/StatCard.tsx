import { ModernCard } from '@/components/ui/ModernCard';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Typography } from '@/theme/typography';
import React, { useEffect } from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

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
  variant = 'default',
  gradientColors,
  onPress,
  style,
  animateValue = true,
  animationDelay = 0,
}: StatCardProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

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
          container: { minWidth: 100 },
          value: Typography.title3,
          label: Typography.caption1,
          padding: 12,
        };
      case 'large':
        return {
          container: { minWidth: 160 },
          value: Typography.display1,
          label: Typography.subheadline,
          padding: 24,
        };
      default:
        return {
          container: { minWidth: 130 },
          value: Typography.title1,
          label: Typography.caption1,
          padding: 16,
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
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  const getTrendIcon = () => {
    if (!trend) return null;
    switch (trend.direction) {
      case 'up': return '↑';
      case 'down': return '↓';
      default: return '→';
    }
  };

  const content = (
    <View style={styles.innerContent}>
      {icon && (
        <View style={[styles.iconContainer, { marginBottom: size === 'small' ? 6 : 8 }]}>
          {icon}
        </View>
      )}

      <Text
        style={[
          sizeStyles.value,
          { color: colors.text },
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
            { color: colors.textSecondary },
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
  );

  return (
    <Animated.View style={[entranceStyle, style]}>
      <ModernCard
        onPress={onPress}
        style={sizeStyles.container}
        padding={sizeStyles.padding}
      >
        {content}
      </ModernCard>
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
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  // Use primary color if no gradient provided, but keep it solid/minimal
  const bgStyle = {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: colorScheme === 'dark' ? 1 : 0,
  };

  return (
    <ModernCard style={styles.heroCard}>
      <View style={styles.heroContent}>
        {icon && <View style={styles.heroIcon}>{icon}</View>}
        <Text style={[Typography.display1, { color: colors.text }]}>
          {value}
        </Text>
        <Text style={[Typography.headline, { color: colors.textSecondary }]}>
          {label}
        </Text>
        {subtitle && (
          <Text style={[Typography.subheadline, { color: colors.textTertiary, marginTop: 4 }]}>
            {subtitle}
          </Text>
        )}
      </View>
    </ModernCard>
  );
}

const styles = StyleSheet.create({
  innerContent: {
    width: '100%',
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
    minHeight: 160,
    justifyContent: 'center',
  },
  heroContent: {
    position: 'relative',
    zIndex: 1,
  },
  heroIcon: {
    marginBottom: 12,
  },
});
