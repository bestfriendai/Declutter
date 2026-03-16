import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';

import { ColorTokens } from '@/constants/Colors';
import { Typography } from '@/theme/typography';
import { Spacing, BorderRadius } from '@/theme/spacing';

interface OverwhelmModalProps {
  visible: boolean;
  colors: ColorTokens;
  onClose: () => void;
  onSingleTaskMode: () => void;
  onTakeBreak: () => void;
  onComeBackTomorrow: () => void;
}

export function OverwhelmModal({
  visible,
  colors,
  onClose,
  onSingleTaskMode,
  onTakeBreak,
  onComeBackTomorrow,
}: OverwhelmModalProps) {
  const [breathingPhase, setBreathingPhase] = useState<'inhale' | 'hold' | 'exhale' | null>(null);
  const [breathCount, setBreathCount] = useState(0);
  
  // Refs for timer cleanup
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exhaleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextCycleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Clear all timers
  const clearAllTimers = useCallback(() => {
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    if (exhaleTimerRef.current) clearTimeout(exhaleTimerRef.current);
    if (nextCycleTimerRef.current) clearTimeout(nextCycleTimerRef.current);
  }, []);
  
  // Cleanup on unmount or when modal closes
  useEffect(() => {
    if (!visible) {
      clearAllTimers();
    }
    return () => {
      clearAllTimers();
    };
  }, [visible, clearAllTimers]);

  const handleClose = () => {
    clearAllTimers();
    setBreathingPhase(null);
    setBreathCount(0);
    onClose();
  };

  const startBreathing = () => {
    const runBreathCycle = (count: number) => {
      if (count > 3) {
        setBreathingPhase(null);
        return;
      }
      setBreathCount(count);
      setBreathingPhase('inhale');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      holdTimerRef.current = setTimeout(() => {
        setBreathingPhase('hold');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }, 4000);

      exhaleTimerRef.current = setTimeout(() => {
        setBreathingPhase('exhale');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }, 6000);

      nextCycleTimerRef.current = setTimeout(() => {
        runBreathCycle(count + 1);
      }, 10000);
    };
    runBreathCycle(1);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      statusBarTranslucent
      accessibilityViewIsModal={true}
    >
      <View
        style={styles.container}
        accessible={true}
        accessibilityLabel="Feeling overwhelmed? Let's take a pause"
      >
        <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />
        <Animated.View
          entering={ZoomIn.duration(350)}
          style={styles.content}
        >
          <Text style={styles.title}>Hey. You are safe.</Text>
          <Text style={styles.subtitle}>
            Feeling overwhelmed is normal -- your brain is just overloaded. Let&apos;s reset together. Take 3 breaths:
          </Text>

          {/* Breathing Circle */}
          <View style={styles.breathingContainer}>
            <Animated.View
              style={[
                styles.breathingCircle,
                {
                  backgroundColor: breathingPhase === 'inhale'
                    ? colors.primary
                    : breathingPhase === 'exhale'
                      ? colors.success
                      : colors.surfaceSecondary,
                  transform: [{
                    scale: breathingPhase === 'inhale' ? 1.5 : breathingPhase === 'hold' ? 1.5 : 1
                  }],
                }
              ]}
            >
              <Text style={styles.breathingText}>
                {breathingPhase === 'inhale' ? 'Breathe in...' :
                 breathingPhase === 'hold' ? 'Hold...' :
                 breathingPhase === 'exhale' ? 'Breathe out...' :
                 'Tap to start'}
              </Text>
            </Animated.View>
            <Text style={styles.breathCountText}>
              {breathCount > 0 ? `${breathCount}/3 breaths` : ''}
            </Text>
          </View>

          {/* Start Breathing Button */}
          {!breathingPhase && (
            <Pressable
              onPress={startBreathing}
              style={[styles.breathingStartButton, { backgroundColor: colors.primary }]}
              accessibilityRole="button"
              accessibilityLabel="Start breathing exercise"
            >
              <Text style={styles.breathingStartText}>🫁 Start Breathing</Text>
            </Pressable>
          )}

          {/* Options after breathing */}
          {breathCount >= 3 && !breathingPhase && (
            <Animated.View entering={FadeInDown.delay(300)} style={styles.options}>
              <Pressable
                onPress={() => {
                  setBreathCount(0);
                  onSingleTaskMode();
                }}
                style={[styles.optionButton, { backgroundColor: colors.primary }]}
                accessibilityRole="button"
                accessibilityLabel="Do just one tiny thing"
              >
                <Text style={styles.optionText}>Do just ONE tiny thing</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setBreathCount(0);
                  onTakeBreak();
                }}
                style={[styles.optionButton, { backgroundColor: colors.success }]}
                accessibilityRole="button"
                accessibilityLabel="Take a break"
              >
                <Text style={styles.optionText}>Take a break - you earned it</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setBreathCount(0);
                  onComeBackTomorrow();
                }}
                style={[styles.optionButton, { backgroundColor: colors.surfaceSecondary }]}
                accessibilityRole="button"
                accessibilityLabel="Come back tomorrow"
              >
                <Text style={[styles.optionText, { color: colors.textSecondary }]}>
                  Come back tomorrow
                </Text>
              </Pressable>
            </Animated.View>
          )}

          {/* Close button */}
          <Pressable
            onPress={handleClose}
            style={styles.closeButton}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <Text style={[styles.closeText, { color: colors.textSecondary }]}>
              ✕ Close
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 40,
    maxWidth: 340,
  },
  title: {
    ...Typography.title2,
    color: '#FFFFFF',
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.body,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  breathingContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  breathingCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  breathingText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  breathCountText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
  },
  breathingStartButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + Spacing.hairline,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    minHeight: 44,
    justifyContent: 'center',
  },
  breathingStartText: {
    ...Typography.buttonMedium,
    color: '#FFFFFF',
  },
  options: {
    width: '100%',
    gap: Spacing.sm,
  },
  optionButton: {
    paddingHorizontal: Spacing.ml,
    paddingVertical: Spacing.sm + Spacing.hairline,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  optionText: {
    ...Typography.subheadlineMedium,
    color: '#FFFFFF',
  },
  closeButton: {
    marginTop: Spacing.ml,
    padding: Spacing.sm,
    minHeight: 44,
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 14,
  },
});
