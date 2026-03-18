/**
 * ProgressComparison - Full progress comparison card component
 * Shows before/after slider, progress percentage, detected changes,
 * mascot reaction, and confetti celebration
 */

import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from '@/hooks/useColorScheme';
import React, { useEffect, useRef } from 'react';
import {
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import Animated, {
    Easing,
    FadeIn,
    FadeInDown,
    FadeInUp,
    runOnJS,
    SlideInRight,
    useSharedValue,
    withDelay,
    withTiming
} from 'react-native-reanimated';

import { Colors } from '@/constants/Colors';
import { BorderRadius, Spacing } from '@/theme/spacing';
import { Typography } from '@/theme/typography';
import { MASCOT_PERSONALITIES, MascotPersonality } from '@/types/declutter';
import { BeforeAfterSlider } from './BeforeAfterSlider';
import { Confetti } from './Confetti';
import { GlassCard } from './GlassCard';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
export interface ProgressComparisonProps {
  /** Before photo URI */
  beforeImage: string;
  /** After photo URI */
  afterImage: string;
  /** Progress percentage (0-100) */
  progressPercentage: number;
  /** List of detected changes */
  changesDetected: string[];
  /** Mascot reaction message */
  mascotMessage?: string;
  /** Mascot personality for emoji */
  mascotPersonality?: MascotPersonality;
  /** CTA button text */
  ctaText?: string;
  /** CTA button callback */
  onCtaPress?: () => void;
  /** Show confetti on reveal */
  showConfetti?: boolean;
  /** Current phase number (1, 2, or 3) */
  currentPhase?: number;
  /** Phase name */
  phaseName?: string;
  /** Custom slider height */
  sliderHeight?: number;
  /** Callback when animation completes */
  onAnimationComplete?: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Animated Progress Counter
// ─────────────────────────────────────────────────────────────────────────────
function AnimatedProgressCounter({
  value,
  duration = 2000,
  delay = 500,
}: {
  value: number;
  duration?: number;
  delay?: number;
}) {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  
  const animatedValue = useSharedValue(0);
  const [displayValue, setDisplayValue] = React.useState(0);

  useEffect(() => {
    animatedValue.value = withDelay(
      delay,
      withTiming(value, {
        duration,
        easing: Easing.out(Easing.cubic),
      }, () => {
        runOnJS(Haptics.notificationAsync)(Haptics.NotificationFeedbackType.Success);
      })
    );

    // Update display value during animation
    const interval = setInterval(() => {
      const currentValue = Math.round(animatedValue.value);
      setDisplayValue(currentValue);
      if (currentValue >= value) {
        clearInterval(interval);
      }
    }, 16);

    return () => clearInterval(interval);
  }, [value, duration, delay, animatedValue]);

  const progressColor = value >= 70 
    ? colors.success 
    : value >= 40 
      ? colors.warning 
      : colors.accent;

  return (
    <View style={styles.progressCounterContainer}>
      <Text
        style={[styles.progressNumber, { color: progressColor }]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {displayValue}
        <Text style={styles.progressPercent}>%</Text>
      </Text>
      <Text style={[Typography.caption1, { color: colors.textSecondary }]}>
        improvement
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Change Item Component
// ─────────────────────────────────────────────────────────────────────────────
function ChangeItem({ 
  text, 
  index 
}: { 
  text: string; 
  index: number;
}) {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];

  return (
    <Animated.View
      entering={SlideInRight.delay(800 + index * 150).duration(350)}
      style={styles.changeItem}
    >
      <View style={[styles.changeCheckmark, { backgroundColor: colors.successMuted }]}>
        <Text style={{ color: colors.success }}>✓</Text>
      </View>
      <Text style={[Typography.body, { color: colors.text, flex: 1 }]}>
        {text}
      </Text>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
export function ProgressComparison({
  beforeImage,
  afterImage,
  progressPercentage,
  changesDetected,
  mascotMessage,
  mascotPersonality = 'dusty',
  ctaText = 'Continue to Next Phase',
  onCtaPress,
  showConfetti = true,
  currentPhase,
  phaseName,
  sliderHeight = 280,
  onAnimationComplete,
}: ProgressComparisonProps) {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  
  const [confettiVisible, setConfettiVisible] = React.useState(false);
  const hasTriggeredConfetti = useRef(false);

  const mascotInfo = MASCOT_PERSONALITIES[mascotPersonality];

  // Trigger confetti after initial reveal
  useEffect(() => {
    if (showConfetti && !hasTriggeredConfetti.current) {
      const timer = setTimeout(() => {
        setConfettiVisible(true);
        hasTriggeredConfetti.current = true;
        
        // Hide confetti after animation
        setTimeout(() => {
          setConfettiVisible(false);
          onAnimationComplete?.();
        }, 3000);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [showConfetti, onAnimationComplete]);

  const handleCtaPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onCtaPress?.();
  };

  return (
    <View style={styles.container}>
      {/* Confetti overlay */}
      {showConfetti && <Confetti visible={confettiVisible} intensity="heavy" />}

      {/* Phase indicator if provided */}
      {currentPhase && phaseName && (
        <Animated.View 
          entering={FadeInDown.delay(100)}
          style={styles.phaseHeader}
        >
          <View style={[styles.phaseBadge, { backgroundColor: colors.accentMuted }]}>
            <Text style={[Typography.caption1Medium, { color: colors.accent }]}>
              Phase {currentPhase}
            </Text>
          </View>
          <Text style={[Typography.headline, { color: colors.text, marginLeft: Spacing.sm }]}>
            {phaseName}
          </Text>
        </Animated.View>
      )}

      {/* Before/After Slider */}
      <Animated.View entering={FadeIn.delay(200)}>
        <GlassCard style={[styles.sliderCard, { minHeight: sliderHeight + 40 }]}>
          <BeforeAfterSlider
            beforeImage={beforeImage}
            afterImage={afterImage}
            beforeLabel="Before"
            afterLabel="After"
            aspectRatio={4 / 3}
            style={{ height: sliderHeight }}
            showLabels
          />
        </GlassCard>
      </Animated.View>

      {/* Progress percentage */}
      <Animated.View entering={FadeInUp.delay(400)}>
        <GlassCard variant="hero" style={styles.progressCard}>
          <LinearGradient
            colors={
              colorScheme === 'dark'
                ? ['rgba(34, 197, 94, 0.2)', 'rgba(59, 130, 246, 0.15)']
                : ['rgba(34, 197, 94, 0.15)', 'rgba(59, 130, 246, 0.1)']
            }
            style={StyleSheet.absoluteFill}
          />
          <Text style={styles.progressEmoji}>🎯</Text>
          <AnimatedProgressCounter value={progressPercentage} />
        </GlassCard>
      </Animated.View>

      {/* Changes detected */}
      {changesDetected.length > 0 && (
        <Animated.View entering={FadeInDown.delay(600)}>
          <GlassCard style={styles.changesCard}>
            <Text style={[Typography.title3, { color: colors.text, marginBottom: Spacing.md }]}>
              Changes Detected
            </Text>
            {changesDetected.map((change, index) => (
              <ChangeItem key={index} text={change} index={index} />
            ))}
          </GlassCard>
        </Animated.View>
      )}

      {/* Mascot reaction */}
      {mascotMessage && (
        <Animated.View entering={FadeInUp.delay(1200)}>
          <GlassCard variant="tinted" style={styles.mascotCard}>
            <View style={styles.mascotHeader}>
              <Text style={styles.mascotEmoji}>{mascotInfo?.emoji || '🧹'}</Text>
              <Text style={[Typography.headline, { color: colors.text, marginLeft: Spacing.sm }]}>
                {mascotInfo?.name || 'Your Buddy'} says:
              </Text>
            </View>
            <Text style={[Typography.body, { color: colors.textSecondary, marginTop: Spacing.sm }]}>
              &ldquo;{mascotMessage}&rdquo;
            </Text>
          </GlassCard>
        </Animated.View>
      )}

      {/* CTA Button */}
      {onCtaPress && (
        <Animated.View entering={FadeInUp.delay(1400)} style={styles.ctaContainer}>
          <Pressable
            onPress={handleCtaPress}
            style={({ pressed }) => [
              styles.ctaButton,
              { opacity: pressed ? 0.9 : 1 }
            ]}
            accessibilityRole="button"
            accessibilityLabel={ctaText}
          >
            <LinearGradient
              colors={[...colors.gradientPrimary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <Text style={[Typography.headline, { color: '#FFFFFF' }]}>
              🚀 {ctaText}
            </Text>
          </Pressable>
        </Animated.View>
      )}
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
  phaseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  phaseBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs,
    borderRadius: BorderRadius.sm,
  },
  sliderCard: {
    padding: Spacing.sm,
    marginBottom: Spacing.md,
  },
  progressCard: {
    alignItems: 'center',
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  progressEmoji: {
    fontSize: 40,
    marginBottom: Spacing.sm,
  },
  progressCounterContainer: {
    alignItems: 'center',
  },
  progressNumber: {
    fontSize: 56,
    fontWeight: '800',
    letterSpacing: -2,
    fontVariant: ['tabular-nums'],
  },
  progressPercent: {
    fontSize: 32,
    fontWeight: '600',
  },
  changesCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  changeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  changeCheckmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mascotCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  mascotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mascotEmoji: {
    fontSize: 32,
  },
  ctaContainer: {
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  ctaButton: {
    height: 56,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});

export default ProgressComparison;
