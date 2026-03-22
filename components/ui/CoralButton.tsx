/**
 * CoralButton - Reusable coral CTA button with gradient, press animation, and shadow.
 * Used across 8+ screens for consistent primary actions.
 */

import React, { useCallback } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { ImpactFeedbackStyle } from 'expo-haptics';
import { impact } from '@/services/haptics';
import { V1, BODY_FONT, CARD_SHADOW_LG, ANIMATION } from '@/constants/designTokens';

interface CoralButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  /** Use flat coral (no gradient) */
  flat?: boolean;
  /** Custom haptic feedback style */
  hapticStyle?: ImpactFeedbackStyle;
  /** Extra style for the outer wrapper */
  style?: object;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export function CoralButton({
  title,
  onPress,
  disabled = false,
  loading = false,
  icon,
  flat = false,
  hapticStyle = ImpactFeedbackStyle.Medium,
  style,
  accessibilityLabel,
  accessibilityHint,
}: CoralButtonProps) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const onPressIn = useCallback(() => {
    scale.value = withSpring(0.96, ANIMATION.spring.snappy);
  }, [scale]);

  const onPressOut = useCallback(() => {
    scale.value = withSpring(1, ANIMATION.spring.snappy);
  }, [scale]);

  const handlePress = useCallback(() => {
    if (disabled || loading) return;
    impact(hapticStyle);
    onPress();
  }, [disabled, loading, hapticStyle, onPress]);

  const isDisabled = disabled || loading;
  const opacity = isDisabled ? 0.6 : 1;

  const content = loading ? (
    <ActivityIndicator color="#FFFFFF" />
  ) : (
    <View style={styles.content}>
      {icon}
      <Text style={styles.text}>{title}</Text>
    </View>
  );

  return (
    <Animated.View
      style={[
        styles.shadowWrap,
        animStyle,
        { opacity },
        style,
      ]}
    >
      <Pressable
        onPress={handlePress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={isDisabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? title}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled: isDisabled }}
      >
        {flat ? (
          <View style={styles.button}>
            {content}
          </View>
        ) : (
          <LinearGradient
            colors={isDisabled ? [`${V1.coral}80`, `${V1.coralLight}80`] : [V1.coral, V1.coralLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.button}
          >
            {content}
          </LinearGradient>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  shadowWrap: {
    borderRadius: 28,
    ...CARD_SHADOW_LG,
    shadowColor: V1.coral,
    shadowOpacity: 0.25,
  },
  button: {
    backgroundColor: V1.coral,
    borderRadius: 28,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    fontFamily: BODY_FONT,
    letterSpacing: 0.3,
  },
});

export default CoralButton;
