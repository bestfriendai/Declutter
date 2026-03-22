/**
 * CountUpStat -- Animated counting number (from 0 to target)
 * Smoothly animates a number from 0 to the target value over a configurable duration.
 */

import React, { useEffect } from 'react';
import { StyleSheet, Text, TextStyle } from 'react-native';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
  Easing,
  useDerivedValue,
} from 'react-native-reanimated';
import { DISPLAY_FONT, V1 } from '@/constants/designTokens';

const AnimatedText = Animated.createAnimatedComponent(Text);

interface CountUpStatProps {
  target: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  color?: string;
  fontSize?: number;
  fontWeight?: TextStyle['fontWeight'];
  isDark?: boolean;
}

export function CountUpStat({
  target,
  duration = 1000,
  prefix = '',
  suffix = '',
  color,
  fontSize = 32,
  fontWeight = '700',
  isDark = false,
}: CountUpStatProps) {
  const t = isDark ? V1.dark : V1.light;
  const textColor = color ?? t.text;

  const animatedValue = useSharedValue(0);
  const displayValue = useDerivedValue(() => Math.round(animatedValue.value));

  useEffect(() => {
    animatedValue.value = withTiming(target, {
      duration,
      easing: Easing.out(Easing.cubic),
    });
  }, [target, duration]);

  // Since Animated text props are limited, we use a regular re-rendering approach
  // with a derived value and render on the JS thread
  return <CountUpText displayValue={displayValue} prefix={prefix} suffix={suffix} color={textColor} fontSize={fontSize} fontWeight={fontWeight} />;
}

function CountUpText({
  displayValue,
  prefix,
  suffix,
  color,
  fontSize,
  fontWeight,
}: {
  displayValue: { value: number };
  prefix: string;
  suffix: string;
  color: string;
  fontSize: number;
  fontWeight: TextStyle['fontWeight'];
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Reanimated's createAnimatedComponent(Text) doesn't type the 'text' prop, but it works at runtime for animated text updates
  const animatedProps = useAnimatedProps<any>(() => ({
    text: `${prefix}${displayValue.value}${suffix}`,
  }));

  return (
    <AnimatedText
      style={[styles.text, { color, fontSize, fontWeight }]}
      animatedProps={animatedProps}
    >
      {`${prefix}0${suffix}`}
    </AnimatedText>
  );
}

const styles = StyleSheet.create({
  text: {
    fontFamily: DISPLAY_FONT,
    fontVariant: ['tabular-nums'],
  },
});
