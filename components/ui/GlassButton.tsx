/**
 * Declutterly - Glass Button Component
 * Apple TV style buttons with glass effects and haptics
 */

import React from 'react';
import {
  StyleSheet,
  Pressable,
  Text,
  View,
  ViewStyle,
  TextStyle,
  StyleProp,
} from 'react-native';
import { BlurView } from 'expo-blur';
import Animated from 'react-native-reanimated';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/theme/typography';
import { useButtonPress } from '@/hooks/useAnimatedPress';
import { LinearGradient } from 'expo-linear-gradient';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'glass';
type ButtonSize = 'small' | 'medium' | 'large';

interface GlassButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function GlassButton({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  icon,
  iconPosition = 'left',
  disabled = false,
  fullWidth = false,
  style,
  textStyle,
}: GlassButtonProps) {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const { animatedStyle, onPressIn, onPressOut } = useButtonPress();

  const getSizeStyles = (): { container: ViewStyle; text: TextStyle } => {
    switch (size) {
      case 'small':
        return {
          container: {
            paddingVertical: 8,
            paddingHorizontal: 16,
            borderRadius: 10,
          },
          text: {
            ...Typography.buttonSmall,
          },
        };
      case 'large':
        return {
          container: {
            paddingVertical: 18,
            paddingHorizontal: 32,
            borderRadius: 16,
          },
          text: {
            ...Typography.button,
            fontSize: 18,
          },
        };
      default:
        return {
          container: {
            paddingVertical: 14,
            paddingHorizontal: 24,
            borderRadius: 14,
          },
          text: {
            ...Typography.button,
          },
        };
    }
  };

  const sizeStyles = getSizeStyles();

  const getVariantStyles = (): {
    container: ViewStyle;
    text: TextStyle;
    useGradient?: boolean;
    useBlur?: boolean;
  } => {
    switch (variant) {
      case 'primary':
        return {
          container: {},
          text: { color: '#FFFFFF' },
          useGradient: true,
        };
      case 'secondary':
        return {
          container: {
            backgroundColor: colorScheme === 'dark'
              ? 'rgba(255, 255, 255, 0.1)'
              : 'rgba(0, 0, 0, 0.05)',
            borderWidth: 1,
            borderColor: colorScheme === 'dark'
              ? 'rgba(255, 255, 255, 0.15)'
              : 'rgba(0, 0, 0, 0.1)',
          },
          text: { color: colors.text },
        };
      case 'ghost':
        return {
          container: {
            backgroundColor: 'transparent',
          },
          text: { color: colors.primary },
        };
      case 'destructive':
        return {
          container: {
            backgroundColor: colors.dangerMuted,
          },
          text: { color: colors.danger },
        };
      case 'glass':
        return {
          container: {
            borderWidth: 0.5,
            borderColor: colorScheme === 'dark'
              ? 'rgba(255, 255, 255, 0.1)'
              : 'rgba(0, 0, 0, 0.05)',
          },
          text: { color: colors.text },
          useBlur: true,
        };
      default:
        return {
          container: {},
          text: { color: '#FFFFFF' },
          useGradient: true,
        };
    }
  };

  const variantStyles = getVariantStyles();

  const renderContent = () => (
    <View style={styles.contentContainer}>
      {icon && iconPosition === 'left' && (
        <View style={styles.iconLeft}>{icon}</View>
      )}
      <Text
        style={[
          sizeStyles.text,
          variantStyles.text,
          disabled && styles.disabledText,
          textStyle,
        ]}
      >
        {title}
      </Text>
      {icon && iconPosition === 'right' && (
        <View style={styles.iconRight}>{icon}</View>
      )}
    </View>
  );

  const buttonContent = (
    <View
      style={[
        styles.container,
        sizeStyles.container,
        variantStyles.container,
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        style,
      ]}
    >
      {variantStyles.useBlur && (
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
      )}
      {variantStyles.useGradient && (
        <LinearGradient
          colors={disabled ? ['#6B7280', '#4B5563'] : ([...colors.gradientPrimary])}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      )}
      {renderContent()}
    </View>
  );

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={disabled}
      style={[animatedStyle, fullWidth && styles.fullWidth]}
    >
      {buttonContent}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
  disabled: {
    opacity: 0.5,
  },
  disabledText: {
    opacity: 0.7,
  },
});

// Icon button variant
export function IconButton({
  icon,
  onPress,
  variant = 'glass',
  size = 44,
  disabled = false,
}: {
  icon: React.ReactNode;
  onPress: () => void;
  variant?: 'glass' | 'ghost' | 'primary';
  size?: number;
  disabled?: boolean;
}) {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const { animatedStyle, onPressIn, onPressOut } = useButtonPress();

  const getBackground = () => {
    switch (variant) {
      case 'primary':
        return colors.primary;
      case 'ghost':
        return 'transparent';
      default:
        return colorScheme === 'dark'
          ? 'rgba(255, 255, 255, 0.1)'
          : 'rgba(0, 0, 0, 0.05)';
    }
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={disabled}
      style={[
        animatedStyle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: getBackground(),
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled ? 0.5 : 1,
        },
      ]}
    >
      {icon}
    </AnimatedPressable>
  );
}

export default GlassButton;
