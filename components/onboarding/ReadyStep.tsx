/**
 * Ready Step -- combined commitment + preview "You're all set!" screen
 * Final step of the collapsed onboarding flow.
 */

import * as Haptics from 'expo-haptics';
import { CheckCircle, Sparkles } from 'lucide-react-native';
import React, { useCallback, useEffect } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
  withRepeat,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import {
  BODY_FONT,
  DISPLAY_FONT,
  V1,
  CARD_SHADOW_LG,
  CARD_SHADOW_SM,
  RADIUS,
} from '@/constants/designTokens';

interface ReadyStepProps {
  isDark: boolean;
  topInset: number;
  isCompleting?: boolean;
  onComplete: () => void;
}

// Sparkle particle for celebration effect
function SparkleParticle({
  delay,
  x,
  y,
  size,
}: {
  delay: number;
  x: number;
  y: number;
  size: number;
}) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0, { duration: 600 }),
        ),
        -1,
        false,
      ),
    );
    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withSpring(1, { damping: 8, stiffness: 200 }),
          withTiming(0.3, { duration: 600 }),
        ),
        -1,
        false,
      ),
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
    position: 'absolute' as const,
    left: x,
    top: y,
  }));

  return (
    <Animated.Text style={[{ fontSize: size }, animStyle]}>
      {'\u2728'}
    </Animated.Text>
  );
}

export function ReadyStep({ isDark, topInset, isCompleting, onComplete }: ReadyStepProps) {
  const t = isDark ? V1.dark : V1.light;
  const checkScale = useSharedValue(0);
  const buttonScale = useSharedValue(1);

  // Animate check circle on mount
  useEffect(() => {
    checkScale.value = withDelay(
      200,
      withSequence(
        withSpring(1.2, { damping: 6, stiffness: 200 }),
        withSpring(1, { damping: 10, stiffness: 200 }),
      ),
    );
  }, []);

  const checkAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));

  const buttonAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const onButtonPressIn = useCallback(() => {
    buttonScale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
  }, []);

  const onButtonPressOut = useCallback(() => {
    buttonScale.value = withSpring(1, { damping: 15, stiffness: 300 });
  }, []);

  return (
    <View style={[styles.stepContent, { paddingTop: topInset + 40 }]}>
      {/* Sparkle celebration */}
      <View style={styles.sparkleContainer}>
        <SparkleParticle delay={0} x={20} y={10} size={18} />
        <SparkleParticle delay={300} x={220} y={5} size={14} />
        <SparkleParticle delay={600} x={80} y={-5} size={16} />
        <SparkleParticle delay={900} x={180} y={20} size={12} />
        <SparkleParticle delay={150} x={260} y={40} size={15} />
        <SparkleParticle delay={450} x={40} y={45} size={13} />
      </View>

      {/* Animated check icon */}
      <Animated.View style={[styles.iconWrap, checkAnimStyle]}>
        <View style={[styles.checkCircleBg, {
          backgroundColor: isDark ? `${V1.green}18` : `${V1.green}12`,
        }]}>
          <CheckCircle size={56} color={V1.green} />
        </View>
      </Animated.View>

      <Animated.Text
        entering={FadeInDown.duration(500).delay(300)}
        style={[styles.stepTitle, { color: t.text }]}
      >
        You're all set!
      </Animated.Text>

      <Animated.Text
        entering={FadeInDown.duration(500).delay(450)}
        style={[styles.stepDesc, { color: t.textSecondary }]}
      >
        Scan your first room from the home screen and your cleaning companion will break it into small, doable tasks.
      </Animated.Text>

      {/* Value props card with subtle gradient border */}
      <Animated.View
        entering={FadeInDown.duration(500).delay(600)}
      >
        <View style={[styles.propsCardOuter, {
          borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
        }]}>
          <LinearGradient
            colors={[
              `${V1.coral}08`,
              isDark ? V1.dark.card : V1.light.card,
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={[styles.propsCard, {
              backgroundColor: t.card,
              borderColor: t.border,
            }]}
          >
            <PropRow
              icon={<Sparkles size={18} color={V1.coral} />}
              text="AI spots what needs cleaning"
              isDark={isDark}
              delay={700}
            />
            <View style={[styles.divider, { backgroundColor: t.border }]} />
            <PropRow
              icon={<Sparkles size={18} color={V1.amber} />}
              text="Tasks broken into small steps"
              isDark={isDark}
              delay={800}
            />
            <View style={[styles.divider, { backgroundColor: t.border }]} />
            <PropRow
              icon={<Sparkles size={18} color={V1.green} />}
              text="Built for ADHD brains"
              isDark={isDark}
              delay={900}
            />
          </LinearGradient>
        </View>
      </Animated.View>

      <Animated.Text
        entering={FadeInDown.duration(500).delay(1000)}
        style={[styles.proofText, { color: t.textMuted }]}
      >
        Built by someone with ADHD, for people with ADHD.{'\n'}Small steps lead to big change.
      </Animated.Text>

      <View style={{ flex: 1 }} />

      {/* CTA button */}
      <Animated.View
        entering={FadeInDown.duration(500).delay(1100)}
        style={[
          buttonAnimStyle,
          styles.buttonShadowWrap,
          { opacity: isCompleting ? 0.7 : 1 },
        ]}
      >
        <Pressable
          onPress={() => {
            if (isCompleting) return;
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onComplete();
          }}
          onPressIn={onButtonPressIn}
          onPressOut={onButtonPressOut}
          disabled={isCompleting}
          accessibilityRole="button"
          accessibilityLabel={isCompleting ? 'Setting up your plan' : "Let's do this!"}
        >
          <LinearGradient
            colors={[V1.coral, V1.coralLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.coralButton}
          >
            {isCompleting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <View style={styles.buttonContent}>
                <Sparkles size={20} color="#FFFFFF" />
                <Text style={styles.coralButtonText}>Let's do this!</Text>
              </View>
            )}
          </LinearGradient>
        </Pressable>
      </Animated.View>
    </View>
  );
}

function PropRow({
  icon,
  text,
  isDark,
  delay,
}: {
  icon: React.ReactNode;
  text: string;
  isDark: boolean;
  delay: number;
}) {
  const t = isDark ? V1.dark : V1.light;
  return (
    <Animated.View
      entering={FadeInDown.duration(400).delay(delay)}
      style={styles.propRow}
    >
      <View style={[styles.propIconWrap, {
        backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
      }]}>
        {icon}
      </View>
      <Text style={[styles.propText, { color: t.text }]}>
        {text}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  stepContent: {
    flex: 1,
    minHeight: 500,
    paddingTop: 20,
    alignItems: 'center',
  },
  sparkleContainer: {
    width: 300,
    height: 60,
    position: 'relative',
    marginBottom: -20,
  },
  iconWrap: {
    marginBottom: 20,
  },
  checkCircleBg: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepTitle: {
    fontSize: 30,
    fontWeight: '800',
    fontFamily: DISPLAY_FONT,
    letterSpacing: -0.6,
    marginBottom: 12,
    textAlign: 'center',
  },
  stepDesc: {
    fontSize: 15,
    lineHeight: 23,
    fontFamily: BODY_FONT,
    textAlign: 'center',
    paddingHorizontal: 12,
    marginBottom: 28,
  },
  propsCardOuter: {
    borderRadius: RADIUS.lg + 2,
    overflow: 'hidden',
  },
  propsCard: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: 20,
    gap: 0,
    width: '100%',
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  propRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  propIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  propText: {
    fontSize: 15,
    fontWeight: '500',
    fontFamily: BODY_FONT,
    flex: 1,
  },
  proofText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    fontStyle: 'italic',
    fontFamily: BODY_FONT,
    marginTop: 16,
    paddingHorizontal: 20,
  },
  buttonShadowWrap: {
    borderRadius: 28,
    ...CARD_SHADOW_LG,
    shadowColor: V1.coral,
    shadowOpacity: 0.3,
    marginBottom: 16,
    width: '100%',
  },
  coralButton: {
    borderRadius: 28,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  coralButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    fontFamily: BODY_FONT,
    letterSpacing: 0.3,
  },
});
