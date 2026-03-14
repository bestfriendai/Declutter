/**
 * Chip - Tags and filter pills (standardized)
 * Used for filters, tags, and selection states
 */

import { Colors, InteractiveStates } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { ScaleValues, SpringConfigs } from '@/theme/animations';
import { BorderRadius, Spacing, TouchTargets } from '@/theme/spacing';
import { Typography } from '@/theme/typography';
import * as Haptics from 'expo-haptics';
import React from 'react';
import {
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';

type ChipVariant = 'filled' | 'outlined' | 'soft';
type ChipSize = 'small' | 'medium' | 'large';
type ChipColor = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';

interface ChipProps {
  label: string;
  icon?: string;
  trailingIcon?: string;
  selected?: boolean;
  disabled?: boolean;
  variant?: ChipVariant;
  size?: ChipSize;
  color?: ChipColor;
  onPress?: () => void;
  onClose?: () => void;
  style?: object;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Chip({
  label,
  icon,
  trailingIcon,
  selected = false,
  disabled = false,
  variant = 'soft',
  size = 'medium',
  color = 'default',
  onPress,
  onClose,
  style,
}: ChipProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const interactive = InteractiveStates[colorScheme];

  const scale = useSharedValue(1);

  const handlePressIn = () => {
    if (!disabled && onPress) {
      scale.value = withSpring(ScaleValues.subtlePress, SpringConfigs.buttonPress);
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, SpringConfigs.buttonPress);
  };

  const handlePress = () => {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  const handleClose = () => {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose?.();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Get color based on color prop
  const getChipColor = () => {
    switch (color) {
      case 'primary':
        return colors.info;
      case 'success':
        return colors.success;
      case 'warning':
        return colors.warning;
      case 'error':
        return colors.error;
      case 'info':
        return colors.info;
      default:
        return colors.textSecondary;
    }
  };

  const getChipMutedColor = () => {
    switch (color) {
      case 'primary':
        return colors.infoMuted;
      case 'success':
        return colors.successMuted;
      case 'warning':
        return colors.warningMuted;
      case 'error':
        return colors.errorMuted;
      case 'info':
        return colors.infoMuted;
      default:
        return colors.surfaceSecondary;
    }
  };

  const chipColor = getChipColor();
  const chipMutedColor = getChipMutedColor();

  // Size configurations
  const sizeConfig = {
    small: {
      height: 28,
      paddingHorizontal: Spacing.sm,
      fontSize: Typography.caption1.fontSize,
      iconSize: 12,
    },
    medium: {
      height: 34,
      paddingHorizontal: Spacing.md,
      fontSize: Typography.subheadline.fontSize,
      iconSize: 16,
    },
    large: {
      height: TouchTargets.minimum,
      paddingHorizontal: Spacing.ml,
      fontSize: Typography.body.fontSize,
      iconSize: 18,
    },
  };

  const currentSize = sizeConfig[size];

  // Variant styles
  const getVariantStyles = () => {
    const isActive = selected;

    switch (variant) {
      case 'filled':
        return {
          backgroundColor: isActive ? chipColor : colors.surfaceSecondary,
          borderWidth: 0,
          textColor: isActive ? '#FFFFFF' : colors.text,
        };
      case 'outlined':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: isActive ? chipColor : colors.border,
          textColor: isActive ? chipColor : colors.text,
        };
      case 'soft':
      default:
        return {
          backgroundColor: isActive ? chipMutedColor : colors.surfaceSecondary,
          borderWidth: 0,
          textColor: isActive ? chipColor : colors.textSecondary,
        };
    }
  };

  const variantStyles = getVariantStyles();

  const ChipContent = (
    <>
      {icon && (
        <Text
          style={[
            styles.icon,
            { fontSize: currentSize.iconSize, color: variantStyles.textColor },
          ]}
        >
          {icon}
        </Text>
      )}
      <Text
        style={[
          styles.label,
          {
            fontSize: currentSize.fontSize,
            color: variantStyles.textColor,
            fontWeight: selected ? '600' : '400',
          },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
      {trailingIcon && !onClose && (
        <Text
          style={[
            styles.trailingIcon,
            { fontSize: currentSize.iconSize, color: variantStyles.textColor },
          ]}
        >
          {trailingIcon}
        </Text>
      )}
      {onClose && (
        <Pressable
          onPress={handleClose}
          disabled={disabled}
          hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
          style={styles.closeButton}
        >
          <Text
            style={[
              styles.closeIcon,
              {
                fontSize: currentSize.iconSize,
                color: variantStyles.textColor,
              },
            ]}
          >
            ✕
          </Text>
        </Pressable>
      )}
    </>
  );

  if (onPress) {
    return (
      <AnimatedPressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        hitSlop={size === 'small' ? { top: 8, bottom: 8, left: 4, right: 4 } : undefined}
        style={[
          styles.container,
          {
            height: currentSize.height,
            paddingHorizontal: currentSize.paddingHorizontal,
            backgroundColor: variantStyles.backgroundColor,
            borderWidth: variantStyles.borderWidth,
            borderColor: variantStyles.borderColor,
            opacity: disabled ? interactive.disabledOpacity : 1,
          },
          animatedStyle,
          style,
        ]}
        accessibilityRole="button"
        accessibilityState={{ selected, disabled }}
        accessibilityLabel={label}
      >
        {ChipContent}
      </AnimatedPressable>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          height: currentSize.height,
          paddingHorizontal: currentSize.paddingHorizontal,
          backgroundColor: variantStyles.backgroundColor,
          borderWidth: variantStyles.borderWidth,
          borderColor: variantStyles.borderColor,
          opacity: disabled ? interactive.disabledOpacity : 1,
        },
        style,
      ]}
      accessibilityRole="text"
      accessibilityLabel={label}
    >
      {ChipContent}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.chip,
  },
  icon: {
    marginRight: Spacing.xxs,
  },
  label: {
    flexShrink: 1,
  },
  trailingIcon: {
    marginLeft: Spacing.xxs,
  },
  closeButton: {
    marginLeft: Spacing.xxs,
    padding: 2,
  },
  closeIcon: {
    opacity: 0.7,
  },
});

export default Chip;
