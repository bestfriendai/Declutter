/**
 * FocusableInput - Enhanced text input with visible focus states
 * Includes focus ring, shake animation on error, and accessibility features
 */

import React, { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import {
  View,
  TextInput,
  TextInputProps,
  StyleSheet,
  useColorScheme,
  Pressable,
  Text,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, InteractiveStates } from '@/constants/Colors';
import { Typography } from '@/theme/typography';
import { BorderRadius, Spacing } from '@/theme/spacing';
import { SpringConfigs, Durations } from '@/theme/animations';

export interface FocusableInputRef {
  focus: () => void;
  blur: () => void;
  shake: () => void;
  getValue: () => string;
}

interface FocusableInputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  error?: string;
  hint?: string;
  showPasswordToggle?: boolean;
  containerStyle?: object;
  inputStyle?: object;
  onFocus?: () => void;
  onBlur?: () => void;
}

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

export const FocusableInput = forwardRef<FocusableInputRef, FocusableInputProps>(
  (
    {
      label,
      icon,
      error,
      hint,
      showPasswordToggle = false,
      containerStyle,
      inputStyle,
      onFocus,
      onBlur,
      secureTextEntry,
      value,
      onChangeText,
      ...textInputProps
    },
    ref
  ) => {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const interactive = InteractiveStates[colorScheme];
    const isDark = colorScheme === 'dark';

    const inputRef = useRef<TextInput>(null);
    const [isFocused, setIsFocused] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    const focusScale = useSharedValue(1);
    const shakeX = useSharedValue(0);
    const borderOpacity = useSharedValue(0);

    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
      blur: () => inputRef.current?.blur(),
      shake: () => {
        shakeX.value = withSequence(
          withTiming(-10, { duration: 50 }),
          withTiming(10, { duration: 50 }),
          withTiming(-10, { duration: 50 }),
          withTiming(10, { duration: 50 }),
          withTiming(0, { duration: 50 })
        );
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      },
      getValue: () => value || '',
    }));

    const handleFocus = () => {
      setIsFocused(true);
      focusScale.value = withSpring(1.02, SpringConfigs.gentle);
      borderOpacity.value = withTiming(1, { duration: Durations.fast });
      onFocus?.();
    };

    const handleBlur = () => {
      setIsFocused(false);
      focusScale.value = withSpring(1, SpringConfigs.gentle);
      borderOpacity.value = withTiming(0, { duration: Durations.fast });
      onBlur?.();
    };

    const togglePasswordVisibility = () => {
      Haptics.selectionAsync();
      setIsPasswordVisible(!isPasswordVisible);
    };

    const containerAnimatedStyle = useAnimatedStyle(() => ({
      transform: [
        { translateX: shakeX.value },
        { scale: focusScale.value },
      ],
    }));

    const focusRingStyle = useAnimatedStyle(() => ({
      opacity: borderOpacity.value,
    }));

    const hasError = !!error;
    const borderColor = hasError
      ? colors.error
      : isFocused
      ? interactive.focusRing
      : colors.border;

    return (
      <View style={[styles.wrapper, containerStyle]}>
        {/* Label */}
        {label && (
          <Text
            style={[
              Typography.subheadlineMedium,
              styles.label,
              { color: hasError ? colors.error : colors.textSecondary },
            ]}
          >
            {label}
          </Text>
        )}

        {/* Input Container */}
        <Animated.View style={[styles.container, containerAnimatedStyle]}>
          {/* Focus Ring */}
          <Animated.View
            style={[
              styles.focusRing,
              {
                borderColor: interactive.focusRing,
                borderRadius: BorderRadius.lg + 2,
              },
              focusRingStyle,
            ]}
          />

          <AnimatedBlurView
            intensity={isDark ? 20 : 40}
            tint={isDark ? 'dark' : 'light'}
            style={[
              styles.inputContainer,
              {
                borderColor,
                borderWidth: hasError || isFocused ? 2 : 1,
              },
            ]}
          >
            {/* Icon */}
            {icon && (
              <Ionicons
                name={icon}
                size={20}
                color={hasError ? colors.error : colors.textSecondary}
                style={styles.icon}
                accessibilityElementsHidden
              />
            )}

            {/* Text Input */}
            <TextInput
              ref={inputRef}
              style={[
                styles.input,
                { color: colors.text },
                inputStyle,
              ]}
              placeholderTextColor={colors.textTertiary}
              value={value}
              onChangeText={onChangeText}
              onFocus={handleFocus}
              onBlur={handleBlur}
              secureTextEntry={secureTextEntry && !isPasswordVisible}
              {...textInputProps}
            />

            {/* Password Toggle */}
            {showPasswordToggle && secureTextEntry && (
              <Pressable
                onPress={togglePasswordVisibility}
                style={styles.toggleButton}
                accessibilityRole="button"
                accessibilityLabel={
                  isPasswordVisible ? 'Hide password' : 'Show password'
                }
              >
                <Ionicons
                  name={isPasswordVisible ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color={colors.textSecondary}
                />
              </Pressable>
            )}
          </AnimatedBlurView>
        </Animated.View>

        {/* Error Message */}
        {hasError && (
          <Animated.View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={14} color={colors.error} />
            <Text style={[Typography.caption1, styles.errorText, { color: colors.error }]}>
              {error}
            </Text>
          </Animated.View>
        )}

        {/* Hint */}
        {hint && !hasError && (
          <Text style={[Typography.caption1, styles.hint, { color: colors.textTertiary }]}>
            {hint}
          </Text>
        )}
      </View>
    );
  }
);

FocusableInput.displayName = 'FocusableInput';

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: Spacing.sm,
  },
  label: {
    marginBottom: Spacing.xs,
    marginLeft: Spacing.xxs,
  },
  container: {
    position: 'relative',
  },
  focusRing: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderWidth: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  icon: {
    paddingLeft: Spacing.md,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: Spacing.sm,
    fontSize: 16,
  },
  toggleButton: {
    padding: Spacing.sm,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xxs,
    marginLeft: Spacing.xxs,
    gap: Spacing.xxs,
  },
  errorText: {
    flex: 1,
  },
  hint: {
    marginTop: Spacing.xxs,
    marginLeft: Spacing.xxs,
  },
});

export default FocusableInput;
