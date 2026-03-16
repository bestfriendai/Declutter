/**
 * MysteryReward Component - Variable reward modal
 *
 * Appears every 3rd task with a mystery gift box that opens to reveal
 * a random reward. Uses slot-machine psychology for engagement.
 */

import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';

import { Confetti } from '@/components/ui/Confetti';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { BorderRadius, Spacing } from '@/theme/spacing';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const DUOLINGO_GREEN = '#34C759';
const GOLDEN = '#FFD700';

export type RewardType =
  | 'bonus_xp'
  | 'streak_shield'
  | 'mystery_collectible'
  | 'mascot_treat';

export interface MysteryRewardProps {
  visible: boolean;
  rewardType: RewardType;
  amount: number;
  onClaim: () => void;
  onDismiss: () => void;
}

const REWARD_CONFIG: Record<
  RewardType,
  {
    emoji: string;
    title: string;
    subtitle: string;
    gradient: readonly [string, string];
    glowColor: string;
  }
> = {
  bonus_xp: {
    emoji: '\uD83C\uDF1F',
    title: '2x XP Bonus!',
    subtitle: 'Your next task earns double. Make it count!',
    gradient: ['#FFD700', '#FF8C00'] as const,
    glowColor: '#FFD700',
  },
  streak_shield: {
    emoji: '\u2744\uFE0F',
    title: 'Streak Shield!',
    subtitle: 'Miss a day and your streak stays safe. Breathe easy.',
    gradient: ['#00BFFF', '#1E90FF'] as const,
    glowColor: '#00BFFF',
  },
  mystery_collectible: {
    emoji: '\uD83C\uDFB0',
    title: 'Rare Find!',
    subtitle: 'A unique collectible just dropped into your collection!',
    gradient: ['#BF5AF2', '#6E6CF0'] as const,
    glowColor: '#BF5AF2',
  },
  mascot_treat: {
    emoji: '\uD83E\uDDF9',
    title: 'Your Buddy Loves This!',
    subtitle: '+20 happiness for your cleaning companion',
    gradient: ['#FF375F', '#FF6B6B'] as const,
    glowColor: '#FF375F',
  },
};

function BouncingGiftBox({ onTap, reducedMotion }: { onTap: () => void; reducedMotion: boolean }) {
  const bounceY = useSharedValue(0);
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) return;
    // Bouncing animation
    bounceY.value = withRepeat(
      withSequence(
        withTiming(-15, { duration: 500 }),
        withTiming(0, { duration: 500 }),
      ),
      -1,
      true,
    );
    // Subtle rotation
    rotation.value = withRepeat(
      withSequence(
        withTiming(5, { duration: 600 }),
        withTiming(-5, { duration: 600 }),
      ),
      -1,
      true,
    );
  }, [reducedMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: bounceY.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  return (
    <Pressable onPress={onTap} accessibilityRole="button" accessibilityLabel="Open mystery reward">
      <Animated.View style={[styles.giftBoxContainer, animatedStyle]}>
        <Text style={styles.giftBoxEmoji}>{'\uD83C\uDF81'}</Text>
      </Animated.View>
    </Pressable>
  );
}

export function MysteryReward({
  visible,
  rewardType,
  amount,
  onClaim,
  onDismiss,
}: MysteryRewardProps) {
  const reducedMotion = useReducedMotion();
  const [revealed, setRevealed] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const cardScale = useSharedValue(0);
  const claimScale = useSharedValue(1);

  useEffect(() => {
    if (visible) {
      setRevealed(false);
      setShowConfetti(false);
      cardScale.value = 0;
    }
  }, [visible]);

  const handleReveal = useCallback(() => {
    setRevealed(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    if (reducedMotion) {
      cardScale.value = 1;
    } else {
      cardScale.value = withSpring(1, { damping: 8, stiffness: 180 });
    }
  }, [reducedMotion]);

  const handleClaim = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowConfetti(true);

    if (!reducedMotion) {
      claimScale.value = withSequence(
        withSpring(0.9, { damping: 10, stiffness: 400 }),
        withSpring(1, { damping: 10, stiffness: 300 }),
      );
    }

    // Wait for confetti, then claim
    setTimeout(() => {
      onClaim();
      setShowConfetti(false);
    }, 1200);
  }, [onClaim, reducedMotion]);

  const rewardCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
    opacity: cardScale.value,
  }));

  const claimButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: claimScale.value }],
  }));

  if (!visible) return null;

  const reward = REWARD_CONFIG[rewardType];

  return (
    <Modal transparent visible={visible} animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <Animated.View
          entering={reducedMotion ? undefined : FadeIn.duration(300)}
          style={styles.content}
        >
          {!revealed ? (
            // Gift box state
            <Animated.View
              entering={reducedMotion ? undefined : ZoomIn.duration(350).damping(10)}
              style={styles.giftBoxSection}
            >
              <Text style={styles.mysteryTitle}>Mystery Reward!</Text>
              <Text style={styles.mysterySubtitle}>Tap to open</Text>
              <BouncingGiftBox onTap={handleReveal} reducedMotion={reducedMotion} />
            </Animated.View>
          ) : (
            // Revealed state
            <Animated.View style={[styles.rewardCard, rewardCardStyle]}>
              <LinearGradient
                colors={[...reward.gradient]}
                style={styles.rewardGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.rewardEmoji}>{reward.emoji}</Text>
                <Text style={styles.rewardTitle}>{reward.title}</Text>
                <Text style={styles.rewardSubtitle}>{reward.subtitle}</Text>

                {rewardType === 'bonus_xp' && (
                  <View style={styles.xpBonusContainer}>
                    <Text style={styles.xpBonusAmount}>+{amount * 2} XP</Text>
                  </View>
                )}

                <Animated.View style={claimButtonStyle}>
                  <Pressable
                    onPress={handleClaim}
                    style={styles.claimButton}
                    accessibilityRole="button"
                    accessibilityLabel="Claim reward"
                  >
                    <Text style={styles.claimButtonText}>Claim!</Text>
                  </Pressable>
                </Animated.View>
              </LinearGradient>
            </Animated.View>
          )}

          {/* Close/Skip */}
          {!revealed && (
            <Pressable
              onPress={onDismiss}
              style={styles.skipButton}
              accessibilityRole="button"
              accessibilityLabel="Skip mystery reward"
            >
              <Text style={styles.skipButtonText}>Skip</Text>
            </Pressable>
          )}
        </Animated.View>

        {/* Confetti on claim */}
        <Confetti visible={showConfetti} intensity="heavy" />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    width: SCREEN_WIDTH * 0.85,
  },
  giftBoxSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mysteryTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: GOLDEN,
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: GOLDEN,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },
  mysterySubtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 24,
  },
  giftBoxContainer: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: GOLDEN,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 30,
    elevation: 15,
  },
  giftBoxEmoji: {
    fontSize: 80,
  },
  rewardCard: {
    width: '100%',
    borderRadius: BorderRadius.xxl,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  rewardGradient: {
    padding: Spacing.xl,
    alignItems: 'center',
    borderRadius: BorderRadius.xxl,
  },
  rewardEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  rewardTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  rewardSubtitle: {
    fontSize: 15,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    marginBottom: 24,
  },
  xpBonusContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginBottom: 20,
  },
  xpBonusAmount: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  claimButton: {
    backgroundColor: DUOLINGO_GREEN,
    borderRadius: 50,
    paddingHorizontal: 48,
    paddingVertical: 16,
    shadowColor: DUOLINGO_GREEN,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  claimButtonText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  skipButton: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.5)',
  },
});

export default MysteryReward;
