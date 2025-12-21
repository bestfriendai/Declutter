/**
 * Declutterly - Glass Card Component
 * iOS 26 Liquid Glass effect with fallback for older versions
 */

import React from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  ViewStyle,
  StyleProp,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import Animated from 'react-native-reanimated';
import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useCardPress } from '@/hooks/useAnimatedPress';
import { LinearGradient } from 'expo-linear-gradient';

type GlassVariant = 'default' | 'elevated' | 'subtle' | 'hero' | 'interactive' | 'liquid';

interface GlassCardProps {
  children: React.ReactNode;
  variant?: GlassVariant;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  blurIntensity?: number;
  padding?: number;
  borderRadius?: number;
  showGradientBorder?: boolean;
  gradientColors?: string[];
  /** Force use of legacy BlurView instead of LiquidGlass */
  forceLegacy?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Check if we can use native Liquid Glass (iOS 26+)
const canUseLiquidGlass = Platform.OS === 'ios' && isLiquidGlassAvailable();

export function GlassCard({
  children,
  variant = 'default',
  onPress,
  style,
  blurIntensity,
  padding = 16,
  borderRadius = 20,
  showGradientBorder = false,
  gradientColors,
  forceLegacy = false,
}: GlassCardProps) {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const { animatedStyle, onPressIn, onPressOut } = useCardPress();

  // Use Liquid Glass for 'liquid' or 'interactive' variants when available
  const useLiquidGlass = !forceLegacy && canUseLiquidGlass &&
    (variant === 'liquid' || variant === 'interactive' || variant === 'hero');

  const getBlurIntensity = () => {
    if (blurIntensity !== undefined) return blurIntensity;
    switch (variant) {
      case 'subtle':
        return 20;
      case 'elevated':
      case 'hero':
        return 80;
      case 'liquid':
      case 'interactive':
        return 100;
      default:
        return 60;
    }
  };

  const getBackgroundColor = () => {
    // For Liquid Glass, use more transparent backgrounds
    if (useLiquidGlass) {
      return 'transparent';
    }

    switch (variant) {
      case 'subtle':
        return colorScheme === 'dark'
          ? 'rgba(30, 30, 30, 0.4)'
          : 'rgba(255, 255, 255, 0.4)';
      case 'elevated':
      case 'hero':
        return colorScheme === 'dark'
          ? 'rgba(40, 40, 40, 0.8)'
          : 'rgba(255, 255, 255, 0.85)';
      case 'liquid':
      case 'interactive':
        return colorScheme === 'dark'
          ? 'rgba(30, 30, 30, 0.5)'
          : 'rgba(255, 255, 255, 0.5)';
      default:
        return colorScheme === 'dark'
          ? 'rgba(30, 30, 30, 0.65)'
          : 'rgba(255, 255, 255, 0.75)';
    }
  };

  const getElevationStyle = (): ViewStyle => {
    switch (variant) {
      case 'elevated':
        return {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: colorScheme === 'dark' ? 0.4 : 0.15,
          shadowRadius: 24,
          elevation: 8,
        };
      case 'hero':
      case 'liquid':
        return {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: colorScheme === 'dark' ? 0.5 : 0.2,
          shadowRadius: 32,
          elevation: 12,
        };
      case 'subtle':
        return {};
      default:
        return {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: colorScheme === 'dark' ? 0.3 : 0.1,
          shadowRadius: 12,
          elevation: 4,
        };
    }
  };

  const borderStyle: ViewStyle = {
    borderWidth: 0.5,
    borderColor: colorScheme === 'dark'
      ? 'rgba(255, 255, 255, 0.1)'
      : 'rgba(0, 0, 0, 0.05)',
  };

  // Render with native Liquid Glass (iOS 26+)
  const renderLiquidGlassContent = () => (
    <View style={[styles.container, { borderRadius }, getElevationStyle(), style]}>
      <GlassView
        style={[StyleSheet.absoluteFill, { borderRadius }]}
        glassEffectStyle={variant === 'interactive' ? 'clear' : 'regular'}
        isInteractive={variant === 'interactive'}
        tintColor={colorScheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}
      />
      <View style={[styles.content, { padding }]}>{children}</View>
    </View>
  );

  // Render with BlurView fallback (older iOS / Android)
  const renderBlurContent = () => (
    <View style={[styles.container, { borderRadius }, getElevationStyle(), style]}>
      <BlurView
        intensity={getBlurIntensity()}
        tint={colorScheme === 'dark' ? 'dark' : 'light'}
        style={[StyleSheet.absoluteFill, { borderRadius }]}
      />
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: getBackgroundColor(), borderRadius },
          borderStyle,
        ]}
      />
      {/* Top highlight gradient for glass effect */}
      <LinearGradient
        colors={
          colorScheme === 'dark'
            ? ['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0)']
            : ['rgba(255, 255, 255, 0.5)', 'rgba(255, 255, 255, 0)']
        }
        style={[
          styles.highlight,
          { borderTopLeftRadius: borderRadius, borderTopRightRadius: borderRadius },
        ]}
      />
      <View style={[styles.content, { padding }]}>{children}</View>
    </View>
  );

  const cardContent = useLiquidGlass ? renderLiquidGlassContent() : renderBlurContent();

  if (showGradientBorder) {
    const gradColors = gradientColors ?? [...colors.gradientPrimary];
    return (
      <View style={[styles.gradientWrapper, { borderRadius: borderRadius + 1 }]}>
        <LinearGradient
          colors={gradColors as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, { borderRadius: borderRadius + 1 }]}
        />
        <View style={[styles.gradientInner, { borderRadius }]}>
          {onPress ? (
            <AnimatedPressable
              onPress={onPress}
              onPressIn={onPressIn}
              onPressOut={onPressOut}
              style={animatedStyle}
            >
              {cardContent}
            </AnimatedPressable>
          ) : (
            cardContent
          )}
        </View>
      </View>
    );
  }

  if (onPress) {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={animatedStyle}
      >
        {cardContent}
      </AnimatedPressable>
    );
  }

  return cardContent;
}

// Hero Card with Liquid Glass
export function LiquidGlassHeroCard({
  children,
  style,
  onPress,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}) {
  return (
    <GlassCard
      variant="liquid"
      padding={24}
      borderRadius={28}
      style={style}
      onPress={onPress}
    >
      {children}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
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
    height: 60,
    zIndex: 0,
  },
  gradientWrapper: {
    padding: 1,
  },
  gradientInner: {
    overflow: 'hidden',
  },
});

export default GlassCard;
