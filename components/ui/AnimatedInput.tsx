/**
 * AnimatedInput - Input with animated focus border that transitions to coral.
 * Replaces raw TextInput + View pattern across auth screens.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, TextInput, TextInputProps, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { V1, BODY_FONT, ANIMATION } from '@/constants/designTokens';

interface AnimatedInputProps extends Omit<TextInputProps, 'style'> {
  isDark: boolean;
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
  /** Override container style */
  containerStyle?: object;
  /** Ref to underlying TextInput */
  inputRef?: React.Ref<TextInput>;
  /** Whether to show error state (red border) */
  hasError?: boolean;
}

export function AnimatedInput({
  isDark,
  icon,
  rightElement,
  containerStyle,
  inputRef,
  hasError = false,
  ...textInputProps
}: AnimatedInputProps) {
  const t = isDark ? V1.dark : V1.light;
  const [isFocused, setIsFocused] = useState(false);
  const focusAnim = useSharedValue(0);
  const errorAnim = useSharedValue(0);

  const placeholderColor = isDark ? 'rgba(255,255,255,0.3)' : '#9CA3AF';

  useEffect(() => {
    focusAnim.value = withTiming(isFocused ? 1 : 0, {
      duration: ANIMATION.duration.fast,
    });
  }, [isFocused, focusAnim]);

  useEffect(() => {
    errorAnim.value = withTiming(hasError ? 1 : 0, {
      duration: ANIMATION.duration.fast,
    });
  }, [hasError, errorAnim]);

  const borderStyle = useAnimatedStyle(() => {
    // Error state takes priority over focus state
    if (errorAnim.value > 0.5) {
      return {
        borderColor: '#FF453A',
        borderWidth: 1.5,
      };
    }
    return {
      borderColor: interpolateColor(
        focusAnim.value,
        [0, 1],
        [isDark ? 'rgba(255,255,255,0.12)' : '#E5E7EB', V1.coral],
      ),
      borderWidth: focusAnim.value > 0.5 ? 1.5 : 1,
    };
  });

  const handleFocus = useCallback(
    (e: any) => {
      setIsFocused(true);
      textInputProps.onFocus?.(e);
    },
    [textInputProps.onFocus],
  );

  const handleBlur = useCallback(
    (e: any) => {
      setIsFocused(false);
      textInputProps.onBlur?.(e);
    },
    [textInputProps.onBlur],
  );

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: t.inputBg },
        borderStyle,
        containerStyle,
      ]}
    >
      {icon}
      <TextInput
        ref={inputRef}
        style={[styles.input, { color: t.text }]}
        placeholderTextColor={placeholderColor}
        onFocus={handleFocus}
        onBlur={handleBlur}
        {...textInputProps}
      />
      {rightElement}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: BODY_FONT,
  },
});

export default AnimatedInput;
