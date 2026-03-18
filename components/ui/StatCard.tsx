import { ModernCard } from '@/components/ui/ModernCard';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Typography } from '@/theme/typography';
import React, { useEffect } from 'react';
import {
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
  // Accessibility props
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
}

export function StatCard({
  value,
  label,
  icon,
  trend,
  size = 'medium',
  onPress,
  style,
  animationDelay = 0,
  accessibilityLabel,
  accessibilityHint,
  testID,
}: StatCardProps) {
  const colorScheme = useColorScheme() ?? 'dark';
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
          container: { minWidth: 80, flexShrink: 1 },
          value: Typography.title3,
          label: Typography.caption1,
          padding: 12,
        };
      case 'large':
        return {
          container: { minWidth: 120, flexShrink: 1 },
          value: Typography.displayMedium,
          label: Typography.subheadline,
          padding: 24,
        };
      default:
        return {
          container: { minWidth: 100, flexShrink: 1 },
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

  const getTrendAccessibilityLabel = () => {
    if (!trend) return '';
    switch (trend.direction) {
      case 'up': return `Trending up ${trend.value}`;
      case 'down': return `Trending down ${trend.value}`;
      default: return `No change ${trend.value}`;
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
          <View
            style={styles.trend}
            accessibilityLabel={getTrendAccessibilityLabel()}
            accessibilityRole="text"
          >
            <Text
              style={[Typography.caption1, { color: getTrendColor() }]}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            >
              {getTrendIcon()} {trend.value}
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  // Generate automatic accessibility label if not provided
  const autoAccessibilityLabel = accessibilityLabel ?? `${label}: ${value}`;

  return (
    <Animated.View style={[entranceStyle, style]}>
      <ModernCard
        onPress={onPress}
        style={sizeStyles.container}
        padding={sizeStyles.padding}
        accessibilityLabel={autoAccessibilityLabel}
        accessibilityHint={accessibilityHint}
        testID={testID}
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
}: {
  value: string | number;
  label: string;
  subtitle?: string;
  icon?: React.ReactNode;
}) {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];

  return (
    <ModernCard style={styles.heroCard} padding={24}>
      <View style={styles.heroContent}>
        {icon && <View style={styles.heroIcon}>{icon}</View>}
        <Text style={[Typography.displayMedium, { color: colors.text }]}>
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
    width: '100%',
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
