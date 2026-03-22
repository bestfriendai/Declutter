import React, { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Camera } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import {
  BODY_FONT,
  DISPLAY_FONT,
  V1,
  CARD_SHADOW_LG,
  RADIUS,
} from '@/constants/designTokens';

interface ScanStepProps {
  isDark: boolean;
  onNext: () => void;
}

export function ScanStep({ isDark, onNext }: ScanStepProps) {
  const t = isDark ? V1.dark : V1.light;
  const buttonScale = useSharedValue(1);

  const buttonAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const onPressIn = useCallback(() => {
    buttonScale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
  }, []);

  const onPressOut = useCallback(() => {
    buttonScale.value = withSpring(1, { damping: 15, stiffness: 300 });
  }, []);

  return (
    <View style={styles.stepContent}>
      {/* Camera icon with gradient background */}
      <Animated.View
        entering={FadeInDown.duration(500).delay(100)}
        style={styles.iconWrap}
      >
        <View style={styles.glowContainer}>
          <LinearGradient
            colors={[`${V1.coral}25`, `${V1.coralLight}10`, 'transparent']}
            style={styles.iconGlow}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          />
          <View style={[styles.iconCircleLarge, {
            borderColor: V1.coral,
            backgroundColor: isDark ? `${V1.coral}12` : `${V1.coral}08`,
          }]}>
            <Camera size={36} color={V1.coral} />
          </View>
        </View>
      </Animated.View>

      <Animated.Text
        entering={FadeInDown.duration(500).delay(250)}
        style={[styles.stepTitle, { color: t.text }]}
      >
        Let's see your space
      </Animated.Text>

      <Animated.Text
        entering={FadeInDown.duration(500).delay(400)}
        style={[styles.stepDesc, { color: t.textSecondary }]}
      >
        After setup, you'll scan your rooms with our AI camera.{' '}
        It will spot what needs attention
        {' \u2014 '}no judgment, just a gentle starting point.
      </Animated.Text>

      {/* Feature hints */}
      <Animated.View
        entering={FadeInDown.duration(500).delay(550)}
        style={styles.hintsContainer}
      >
        {[
          { icon: '\uD83D\uDCF8', text: 'Quick photo scan of any room' },
          { icon: '\uD83E\uDDE0', text: 'AI breaks mess into tiny tasks' },
          { icon: '\uD83C\uDFAF', text: 'Start with just one small win' },
        ].map((hint, index) => (
          <View key={index} style={[styles.hintRow, {
            backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
            borderColor: t.border,
          }]}>
            <Text style={styles.hintIcon}>{hint.icon}</Text>
            <Text style={[styles.hintItemText, { color: t.text }]}>{hint.text}</Text>
          </View>
        ))}
      </Animated.View>

      <View style={{ flex: 1 }} />

      {/* Button */}
      <Animated.View
        entering={FadeInDown.duration(500).delay(700)}
        style={[buttonAnimStyle, styles.buttonShadowWrap]}
      >
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onNext();
          }}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          accessibilityRole="button"
          accessibilityLabel="Sounds Good, Continue"
        >
          <LinearGradient
            colors={[V1.coral, V1.coralLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.coralButton}
          >
            <Text style={styles.coralButtonText}>Sounds Good</Text>
          </LinearGradient>
        </Pressable>
      </Animated.View>

      <Animated.Text
        entering={FadeInDown.duration(500).delay(850)}
        style={[styles.hintText, { color: t.textMuted }]}
      >
        You'll scan rooms from the home screen after setup
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stepContent: {
    flex: 1,
    minHeight: 500,
    paddingTop: 20,
  },
  iconWrap: {
    alignSelf: 'center',
    marginBottom: 24,
    marginTop: 30,
  },
  glowContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGlow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  iconCircleLarge: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepTitle: {
    fontSize: 30,
    fontWeight: '800',
    fontFamily: DISPLAY_FONT,
    letterSpacing: -0.6,
    marginBottom: 8,
    textAlign: 'center',
  },
  stepDesc: {
    fontSize: 15,
    lineHeight: 23,
    fontFamily: BODY_FONT,
    textAlign: 'center',
    paddingHorizontal: 12,
    marginTop: 8,
    marginBottom: 28,
  },
  hintsContainer: {
    gap: 10,
    paddingHorizontal: 4,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
  },
  hintIcon: {
    fontSize: 20,
  },
  hintItemText: {
    fontSize: 15,
    fontWeight: '500',
    fontFamily: BODY_FONT,
    flex: 1,
  },
  buttonShadowWrap: {
    borderRadius: 28,
    ...CARD_SHADOW_LG,
    shadowColor: V1.coral,
    shadowOpacity: 0.25,
    marginBottom: 16,
  },
  coralButton: {
    borderRadius: 28,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coralButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    fontFamily: BODY_FONT,
    letterSpacing: 0.3,
  },
  hintText: {
    fontSize: 13,
    textAlign: 'center',
    fontFamily: BODY_FONT,
    marginTop: 8,
    paddingHorizontal: 16,
  },
});
