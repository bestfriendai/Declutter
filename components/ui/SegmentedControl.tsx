/**
 * SegmentedControl - iOS-style segmented control with smooth animations
 * Provides tab-like selection with native feel
 */

import React, { useCallback, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  useColorScheme,
  LayoutChangeEvent,
  AccessibilityRole,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Colors, InteractiveStates } from '@/constants/Colors';
import { Typography } from '@/theme/typography';
import { BorderRadius, Spacing, TouchTargets } from '@/theme/spacing';
import { SpringConfigs } from '@/theme/animations';

export interface SegmentOption {
  label: string;
  value: string;
  icon?: string;
  accessibilityLabel?: string;
}

interface SegmentedControlProps {
  options: SegmentOption[];
  selectedValue: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  style?: object;
}

export function SegmentedControl({
  options,
  selectedValue,
  onValueChange,
  disabled = false,
  size = 'medium',
  fullWidth = false,
  style,
}: SegmentedControlProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const interactive = InteractiveStates[colorScheme];

  const selectedIndex = options.findIndex((opt) => opt.value === selectedValue);
  const indicatorPosition = useSharedValue(selectedIndex >= 0 ? selectedIndex : 0);
  const segmentWidths = useSharedValue<number[]>(options.map(() => 0));
  const segmentOffsets = useSharedValue<number[]>(options.map(() => 0));

  useEffect(() => {
    const index = options.findIndex((opt) => opt.value === selectedValue);
    if (index >= 0) {
      indicatorPosition.value = withSpring(index, SpringConfigs.snappy);
    }
  }, [selectedValue, options]);

  const handlePress = useCallback(
    (value: string) => {
      if (disabled) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onValueChange(value);
    },
    [disabled, onValueChange]
  );

  const handleSegmentLayout = useCallback(
    (event: LayoutChangeEvent, index: number) => {
      const { width, x } = event.nativeEvent.layout;
      segmentWidths.value = segmentWidths.value.map((w, i) =>
        i === index ? width : w
      );
      segmentOffsets.value = segmentOffsets.value.map((o, i) =>
        i === index ? x : o
      );
    },
    []
  );

  const indicatorStyle = useAnimatedStyle(() => {
    const widths = segmentWidths.value;
    const offsets = segmentOffsets.value;
    const position = indicatorPosition.value;

    const currentIndex = Math.floor(position);
    const nextIndex = Math.min(currentIndex + 1, widths.length - 1);
    const progress = position - currentIndex;

    const width = interpolate(
      progress,
      [0, 1],
      [widths[currentIndex] || 0, widths[nextIndex] || 0]
    );

    const translateX = interpolate(
      progress,
      [0, 1],
      [offsets[currentIndex] || 0, offsets[nextIndex] || 0]
    );

    return {
      width,
      transform: [{ translateX }],
    };
  });

  const sizeStyles = {
    small: {
      height: 32,
      paddingHorizontal: Spacing.sm,
      fontSize: Typography.caption1.fontSize,
    },
    medium: {
      height: TouchTargets.minimum,
      paddingHorizontal: Spacing.md,
      fontSize: Typography.subheadline.fontSize,
    },
    large: {
      height: TouchTargets.comfortable,
      paddingHorizontal: Spacing.lg,
      fontSize: Typography.body.fontSize,
    },
  };

  const currentSize = sizeStyles[size];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surfaceSecondary,
          height: currentSize.height,
          opacity: disabled ? interactive.disabledOpacity : 1,
        },
        fullWidth && styles.fullWidth,
        style,
      ]}
      accessibilityRole="tablist"
    >
      {/* Animated indicator background */}
      <Animated.View
        style={[
          styles.indicator,
          {
            backgroundColor: colors.surface,
            height: currentSize.height - 4,
          },
          indicatorStyle,
        ]}
      />

      {/* Segment buttons */}
      {options.map((option, index) => {
        const isSelected = option.value === selectedValue;

        return (
          <Pressable
            key={option.value}
            onPress={() => handlePress(option.value)}
            onLayout={(e) => handleSegmentLayout(e, index)}
            disabled={disabled}
            style={[
              styles.segment,
              { paddingHorizontal: currentSize.paddingHorizontal },
              fullWidth && styles.segmentFullWidth,
            ]}
            accessibilityRole={'tab' as AccessibilityRole}
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={option.accessibilityLabel || option.label}
          >
            {option.icon && (
              <Text
                style={[
                  styles.icon,
                  { fontSize: currentSize.fontSize },
                  isSelected && { opacity: 1 },
                ]}
              >
                {option.icon}
              </Text>
            )}
            <Text
              style={[
                styles.label,
                {
                  fontSize: currentSize.fontSize,
                  color: isSelected ? colors.text : colors.textSecondary,
                  fontWeight: isSelected ? '600' : '400',
                },
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: BorderRadius.md,
    padding: 2,
    position: 'relative',
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  indicator: {
    position: 'absolute',
    top: 2,
    borderRadius: BorderRadius.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segment: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  segmentFullWidth: {
    flex: 1,
  },
  icon: {
    marginRight: Spacing.xxs,
    opacity: 0.7,
  },
  label: {
    textAlign: 'center',
  },
});

export default SegmentedControl;
