/**
 * Declutterly — Notification Permission Pre-Primer
 * Custom pre-primer screen (NOT the system dialog yet)
 * ADHD-friendly explanation of why notifications help
 */

import { Colors, ColorTokens } from '@/constants/Colors';
import { api } from '@/convex/_generated/api';
import { convex } from '@/config/convex';
import { useColorScheme } from '@/hooks/useColorScheme';
import { registerForPushNotifications } from '@/services/notifications';
import { BorderRadius, Spacing } from '@/theme/spacing';
import { Typography } from '@/theme/typography';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
    Dimensions,
    Pressable,
    StyleSheet,
    Text,
    View
} from 'react-native';
import Animated, {
    FadeIn,
    FadeInDown,
    FadeInUp,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─────────────────────────────────────────────────────────────────────────────
// Animated Dusty Mascot
// ─────────────────────────────────────────────────────────────────────────────
function AnimatedDusty() {
  const bounce = useSharedValue(0);
  
  React.useEffect(() => {
    bounce.value = withRepeat(
      withSequence(
        withSpring(-8, { damping: 4, stiffness: 80 }),
        withSpring(0, { damping: 4, stiffness: 80 })
      ),
      -1,
      false
    );
  }, [bounce]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bounce.value }],
  }));
  
  return (
    <Animated.View style={[styles.mascotContainer, animatedStyle]}>
      <Text style={styles.mascotEmoji}>🧹</Text>
      <View style={styles.speechBubble}>
        <Text style={styles.speechText}>💬</Text>
      </View>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Benefit Item
// ─────────────────────────────────────────────────────────────────────────────
function BenefitItem({ 
  emoji, 
  text, 
  colors, 
  delay 
}: { 
  emoji: string; 
  text: string; 
  colors: ColorTokens; 
  delay: number;
}) {
  return (
    <Animated.View 
      entering={FadeInDown.delay(delay).duration(350)}
      style={[styles.benefitItem, { backgroundColor: colors.surface }]}
    >
      <Text style={styles.benefitEmoji}>{emoji}</Text>
      <Text style={[styles.benefitText, { color: colors.text }]}>{text}</Text>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────
export default function NotificationPermissionScreen() {
  const rawColorScheme = useColorScheme();
  const colorScheme = rawColorScheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  
  const [isRequesting, setIsRequesting] = useState(false);

  const handleEnableNotifications = async () => {
    setIsRequesting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      const token = await registerForPushNotifications();
      if (token) {
        try {
          await convex.mutation(api.notifications.savePushToken, { token });
        } catch (error) {
          if (__DEV__) console.info('Failed to save push token to backend:', error);
        }
      }

      // Navigate to home regardless of permission result
      router.replace('/(tabs)');
    } catch (error) {
      if (__DEV__) console.info('Error requesting notification permissions:', error);
      router.replace('/(tabs)');
    } finally {
      setIsRequesting(false);
    }
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace('/(tabs)');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      <LinearGradient
        colors={isDark
          ? ['rgba(103,126,234,0.22)', 'rgba(118,75,162,0.14)', 'rgba(10,10,10,0)'] as const
          : ['rgba(103,126,234,0.10)', 'rgba(118,75,162,0.06)', 'rgba(250,250,250,0)'] as const
        }
        style={styles.gradient}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.65 }}
      />

      <View style={[styles.content, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 20 }]}>
        {/* Mascot */}
        <AnimatedDusty />

        {/* Title */}
        <Animated.Text
          entering={FadeIn.delay(200)}
          style={[Typography.title1, { color: colors.text, textAlign: 'center', marginTop: Spacing.xl }]}
        >
          Dusty wants to cheer you on!
        </Animated.Text>

        {/* Subtitle */}
        <Animated.Text
          entering={FadeIn.delay(300)}
          style={[Typography.body, { color: colors.textSecondary, textAlign: 'center', marginTop: Spacing.sm, paddingHorizontal: Spacing.xl }]}
        >
          Get gentle reminders that actually help — never guilt, always encouragement
        </Animated.Text>

        {/* Benefits */}
        <View style={styles.benefitsContainer}>
          <BenefitItem 
            emoji="🌅" 
            text="Morning motivation that meets you where you are" 
            colors={colors} 
            delay={400}
          />
          <BenefitItem 
            emoji="🎯" 
            text="Gentle nudges, never guilt trips" 
            colors={colors} 
            delay={500}
          />
          <BenefitItem 
            emoji="🧠" 
            text="ADHD brains need external cues. Let Dusty be yours." 
            colors={colors} 
            delay={600}
          />
          <BenefitItem 
            emoji="🔥" 
            text="Celebrate streaks without the shame" 
            colors={colors} 
            delay={700}
          />
        </View>

        {/* Spacer */}
        <View style={{ flex: 1 }} />

        {/* CTA Button */}
        <Animated.View entering={FadeInUp.delay(800).duration(350)}>
          <Pressable
            onPress={handleEnableNotifications}
            disabled={isRequesting}
            accessibilityRole="button"
            accessibilityLabel="Enable gentle cleaning reminders"
            style={({ pressed }) => [
              styles.ctaButton,
              { opacity: pressed || isRequesting ? 0.9 : 1 }
            ]}
          >
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.ctaGradient}
            >
              <Text style={styles.ctaText}>
                {isRequesting ? 'Enabling...' : 'Enable Reminders'}
              </Text>
            </LinearGradient>
          </Pressable>
        </Animated.View>

        {/* Skip Button */}
        <Pressable
          onPress={handleSkip}
          style={styles.skipButton}
          accessibilityRole="button"
          accessibilityLabel="Skip notifications for now"
          accessibilityHint="You can always enable notifications later in Settings"
        >
          <Text style={[styles.skipText, { color: colors.textSecondary }]}>
            Maybe Later
          </Text>
          <Text style={[styles.skipHint, { color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.25)' }]}>
            You can turn these on in Settings anytime
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
  },
  mascotContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mascotEmoji: {
    fontSize: 80,
  },
  speechBubble: {
    position: 'absolute',
    top: -10,
    right: -20,
  },
  speechText: {
    fontSize: 24,
  },
  benefitsContainer: {
    width: '100%',
    marginTop: Spacing.xxl,
    gap: Spacing.md,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(128,128,128,0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 1,
  },
  benefitEmoji: {
    fontSize: 24,
  },
  benefitText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
  },
  ctaButton: {
    width: SCREEN_WIDTH - (Spacing.lg * 2),
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  ctaGradient: {
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  skipButton: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xl,
  },
  skipText: {
    fontSize: 15,
    textAlign: 'center',
  },
  skipHint: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
});
