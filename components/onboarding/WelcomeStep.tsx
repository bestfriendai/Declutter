import { MascotAvatar } from '@/components/ui';
import { BODY_FONT, DISPLAY_FONT, V1, CARD_SHADOW_LG } from '@/constants/designTokens';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { StepDots } from './StepDots';

interface WelcomeStepProps {
  isDark: boolean;
  topInset: number;
  onNext: () => void;
}

export function WelcomeStep({ isDark, topInset, onNext }: WelcomeStepProps) {
  const t = isDark ? V1.dark : V1.light;
  const buttonScale = useSharedValue(1);

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const onPressIn = useCallback(() => {
    buttonScale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
  }, []);

  const onPressOut = useCallback(() => {
    buttonScale.value = withSpring(1, { damping: 15, stiffness: 300 });
  }, []);

  return (
    <View style={[styles.centerContent, { paddingTop: topInset + 60 }]}>
      {/* Mascot with gradient glow */}
      <Animated.View
        entering={FadeInDown.duration(600).delay(100)}
        style={styles.mascotWrapper}
      >
        <View style={styles.glowContainer}>
          <LinearGradient
            colors={[
              `${V1.coral}30`,
              `${V1.coralLight}18`,
              'transparent',
            ]}
            style={styles.mascotGlow}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          />
          <View style={styles.mascotCircle}>
            <MascotAvatar imageKey="welcome" size={130} showBackground={false} />
          </View>
        </View>
      </Animated.View>

      {/* Title */}
      <Animated.Text
        entering={FadeInDown.duration(600).delay(250)}
        style={[styles.appTitle, { color: t.text }]}
      >
        Declutter
      </Animated.Text>

      {/* Tagline */}
      <Animated.Text
        entering={FadeInDown.duration(600).delay(400)}
        style={[styles.appSubtitle, { color: t.textSecondary }]}
      >
        Cleaning made simple,{'\n'}one tiny step at a time
      </Animated.Text>

      {/* Actions */}
      <Animated.View
        entering={FadeInUp.duration(600).delay(600)}
        style={styles.welcomeActions}
      >
        <Animated.View style={[buttonAnimatedStyle, styles.buttonShadowWrap]}>
          <Pressable
            onPress={onNext}
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            accessibilityRole="button"
            accessibilityLabel="Get Started"
          >
            <LinearGradient
              colors={[V1.coral, V1.coralLight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.coralButton}
            >
              <Text style={styles.coralButtonText}>Get Started</Text>
            </LinearGradient>
          </Pressable>
        </Animated.View>

        <Pressable
          onPress={() => router.replace('/auth/login')}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Sign in to existing account"
        >
          <Text style={[styles.linkText, { color: t.textMuted }]}>
            I already have an account
          </Text>
        </Pressable>
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(600).delay(800)}>
        <StepDots total={5} current={0} isDark={isDark} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 60,
    gap: 12,
  },
  mascotWrapper: {
    marginBottom: 24,
  },
  glowContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mascotGlow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  mascotCircle: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appTitle: {
    fontSize: 38,
    fontWeight: '800',
    fontFamily: DISPLAY_FONT,
    letterSpacing: -1.2,
  },
  appSubtitle: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    fontFamily: BODY_FONT,
    paddingHorizontal: 40,
  },
  welcomeActions: {
    width: '100%',
    gap: 16,
    marginTop: 36,
    marginBottom: 28,
    paddingHorizontal: 24,
  },
  buttonShadowWrap: {
    borderRadius: 28,
    ...CARD_SHADOW_LG,
    shadowColor: V1.coral,
    shadowOpacity: 0.3,
    marginBottom: 8,
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
  linkText: {
    fontSize: 14,
    textAlign: 'center',
    fontFamily: BODY_FONT,
  },
});
