/**
 * Declutterly — Apple 2026 Glass Card
 * iOS 26 Liquid Glass with BlurView fallback, tinted variants, and elevation
 */

import { Colors, Shadows } from '@/constants/Colors';
import { BlurView } from 'expo-blur';
import React, { useCallback } from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  useColorScheme,
  View,
  ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
export type GlassVariant =
  | 'default'     // Standard glass card
  | 'hero'        // Large hero card with stronger blur
  | 'subtle'      // Minimal glass effect
  | 'elevated'    // Elevated with shadow
  | 'tinted'      // Tinted with accent color
  | 'ultraThin'   // Ultra-thin material
  | 'chromatic'   // Opaque chromatic material
  | 'flat'        // No blur, just surface color
  | 'outlined';   // Border only, transparent

export type GlassRadius =
  | 'none'    // 0
  | 'small'   // 12
  | 'medium'  // 16
  | 'large'   // 20
  | 'xl'      // 24
  | 'xxl'     // 32
  | 'full';   // 9999

interface GlassCardProps {
  children: React.ReactNode;
  variant?: GlassVariant;
  radius?: GlassRadius;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  tintColor?: string;
  tintOpacity?: number;
  onPress?: () => void;
  onLongPress?: () => void;
  haptic?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityRole?: 'button' | 'none' | 'link' | 'header' | 'image' | 'text';
  accessibilityHint?: string;
  /** Override blur intensity (0-100) */
  blurIntensity?: number;
  /** Show top highlight shimmer */
  showHighlight?: boolean;
  /** Animate on press */
  pressable?: boolean;
  testID?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Radius Map
// ─────────────────────────────────────────────────────────────────────────────
const RADIUS_MAP: Record<GlassRadius, number> = {
  none:   0,
  small:  12,
  medium: 16,
  large:  20,
  xl:     24,
  xxl:    32,
  full:   9999,
};

// ─────────────────────────────────────────────────────────────────────────────
// Variant Config
// ─────────────────────────────────────────────────────────────────────────────
interface VariantConfig {
  blurIntensity: number;
  lightBg: string;
  darkBg: string;
  lightBorder: string;
  darkBorder: string;
  defaultRadius: GlassRadius;
  shadow: object;
}

const VARIANT_CONFIG: Record<GlassVariant, VariantConfig> = {
  default: {
    blurIntensity: 60,
    lightBg:       'rgba(255, 255, 255, 0.72)',
    darkBg:        'rgba(28, 28, 30, 0.72)',
    lightBorder:   'rgba(0, 0, 0, 0.06)',
    darkBorder:    'rgba(255, 255, 255, 0.10)',
    defaultRadius: 'large',
    shadow:        Shadows.small,
  },
  hero: {
    blurIntensity: 80,
    lightBg:       'rgba(255, 255, 255, 0.85)',
    darkBg:        'rgba(28, 28, 30, 0.85)',
    lightBorder:   'rgba(0, 0, 0, 0.05)',
    darkBorder:    'rgba(255, 255, 255, 0.12)',
    defaultRadius: 'xl',
    shadow:        Shadows.medium,
  },
  subtle: {
    blurIntensity: 30,
    lightBg:       'rgba(255, 255, 255, 0.40)',
    darkBg:        'rgba(28, 28, 30, 0.40)',
    lightBorder:   'rgba(0, 0, 0, 0.04)',
    darkBorder:    'rgba(255, 255, 255, 0.06)',
    defaultRadius: 'medium',
    shadow:        Shadows.xs,
  },
  elevated: {
    blurIntensity: 70,
    lightBg:       'rgba(255, 255, 255, 0.90)',
    darkBg:        'rgba(44, 44, 46, 0.90)',
    lightBorder:   'rgba(0, 0, 0, 0.06)',
    darkBorder:    'rgba(255, 255, 255, 0.14)',
    defaultRadius: 'xl',
    shadow:        Shadows.large,
  },
  tinted: {
    blurIntensity: 50,
    lightBg:       'rgba(255, 255, 255, 0.60)',
    darkBg:        'rgba(28, 28, 30, 0.60)',
    lightBorder:   'rgba(0, 0, 0, 0.06)',
    darkBorder:    'rgba(255, 255, 255, 0.10)',
    defaultRadius: 'large',
    shadow:        Shadows.small,
  },
  ultraThin: {
    blurIntensity: 20,
    lightBg:       'rgba(255, 255, 255, 0.25)',
    darkBg:        'rgba(28, 28, 30, 0.25)',
    lightBorder:   'rgba(0, 0, 0, 0.03)',
    darkBorder:    'rgba(255, 255, 255, 0.06)',
    defaultRadius: 'medium',
    shadow:        Shadows.none,
  },
  chromatic: {
    blurIntensity: 100,
    lightBg:       'rgba(255, 255, 255, 0.95)',
    darkBg:        'rgba(28, 28, 30, 0.95)',
    lightBorder:   'rgba(0, 0, 0, 0.08)',
    darkBorder:    'rgba(255, 255, 255, 0.15)',
    defaultRadius: 'large',
    shadow:        Shadows.medium,
  },
  flat: {
    blurIntensity: 0,
    lightBg:       '#FFFFFF',
    darkBg:        '#1C1C1E',
    lightBorder:   'rgba(0, 0, 0, 0.08)',
    darkBorder:    'rgba(255, 255, 255, 0.08)',
    defaultRadius: 'large',
    shadow:        Shadows.small,
  },
  outlined: {
    blurIntensity: 0,
    lightBg:       'transparent',
    darkBg:        'transparent',
    lightBorder:   'rgba(0, 0, 0, 0.12)',
    darkBorder:    'rgba(255, 255, 255, 0.15)',
    defaultRadius: 'large',
    shadow:        Shadows.none,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// GlassCard Component
// ─────────────────────────────────────────────────────────────────────────────
export function GlassCard({
  children,
  variant = 'default',
  radius,
  style,
  contentStyle,
  tintColor,
  tintOpacity = 0.12,
  onPress,
  onLongPress,
  haptic = true,
  disabled = false,
  accessibilityLabel,
  accessibilityRole = 'none',
  accessibilityHint,
  blurIntensity: blurIntensityOverride,
  showHighlight = false,
  pressable = false,
  testID,
}: GlassCardProps) {
  const rawScheme = useColorScheme();
  const colorScheme = rawScheme === 'dark' ? 'dark' : 'light';
  const isDark = colorScheme === 'dark';

  const config = VARIANT_CONFIG[variant];
  const borderRadius = RADIUS_MAP[radius ?? config.defaultRadius];
  const blurIntensity = blurIntensityOverride ?? config.blurIntensity;
  const isInteractive = !!(onPress || onLongPress || pressable);

  // Press animation
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const handlePressIn = useCallback(() => {
    if (!isInteractive || disabled) return;
    scale.value = withSpring(0.97, { damping: 20, stiffness: 400 });
    opacity.value = withSpring(0.85, { damping: 20, stiffness: 400 });
  }, [isInteractive, disabled]);

  const handlePressOut = useCallback(() => {
    if (!isInteractive || disabled) return;
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    opacity.value = withSpring(1, { damping: 15, stiffness: 300 });
  }, [isInteractive, disabled]);

  const handlePress = useCallback(() => {
    if (disabled) return;
    if (haptic) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress?.();
  }, [disabled, haptic, onPress]);

  const handleLongPress = useCallback(() => {
    if (disabled) return;
    if (haptic) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onLongPress?.();
  }, [disabled, haptic, onLongPress]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  // Background color
  const backgroundColor = isDark ? config.darkBg : config.lightBg;
  const borderColor = isDark ? config.darkBorder : config.lightBorder;

  const containerStyle: ViewStyle = {
    borderRadius,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor,
    ...config.shadow,
  };

  const content = (
    <Animated.View style={[containerStyle, style, isInteractive && animatedStyle]}>
      {/* Blur layer (skip for flat/outlined/zero intensity) */}
      {blurIntensity > 0 && variant !== 'flat' && variant !== 'outlined' && (
        <BlurView
          intensity={blurIntensity}
          tint={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
      )}

      {/* Solid background fallback */}
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor },
        ]}
      />

      {/* Tint overlay */}
      {tintColor && (
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: tintColor, opacity: tintOpacity },
          ]}
        />
      )}

      {/* Top highlight shimmer */}
      {showHighlight && (
        <View
          style={[
            styles.highlight,
            {
              backgroundColor: isDark
                ? 'rgba(255, 255, 255, 0.06)'
                : 'rgba(255, 255, 255, 0.60)',
            },
          ]}
        />
      )}

      {/* Content */}
      <View style={[styles.content, contentStyle]}>
        {children}
      </View>
    </Animated.View>
  );

  if (isInteractive) {
    return (
      <Pressable
        onPress={handlePress}
        onLongPress={handleLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole={accessibilityRole === 'none' ? 'button' : accessibilityRole}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled }}
        testID={testID}
        style={{ opacity: disabled ? 0.5 : 1 }}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityRole}
      testID={testID}
    >
      {content}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Specialized Variants
// ─────────────────────────────────────────────────────────────────────────────

/** Hero card — large, prominent, strong blur */
export function HeroCard(props: Omit<GlassCardProps, 'variant'>) {
  return <GlassCard {...props} variant="hero" showHighlight />;
}

/** Subtle card — minimal glass effect */
export function SubtleCard(props: Omit<GlassCardProps, 'variant'>) {
  return <GlassCard {...props} variant="subtle" />;
}

/** Elevated card — with prominent shadow */
export function ElevatedCard(props: Omit<GlassCardProps, 'variant'>) {
  return <GlassCard {...props} variant="elevated" showHighlight />;
}

/** Flat card — no blur, solid surface */
export function FlatCard(props: Omit<GlassCardProps, 'variant'>) {
  return <GlassCard {...props} variant="flat" />;
}

/** Outlined card — border only */
export function OutlinedCard(props: Omit<GlassCardProps, 'variant'>) {
  return <GlassCard {...props} variant="outlined" />;
}

/** Tinted card — with accent color overlay */
export function TintedCard({
  color,
  ...props
}: Omit<GlassCardProps, 'variant' | 'tintColor'> & { color: string }) {
  return <GlassCard {...props} variant="tinted" tintColor={color} tintOpacity={0.15} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  content: {
    position: 'relative',
  },
  highlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    zIndex: 1,
  },
});

export default GlassCard;
