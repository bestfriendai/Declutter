import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef, useState } from 'react';
import {
    Modal,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import Animated, {
    FadeOut,
    SlideInUp,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Typography } from '@/theme/typography';
import { Spacing, BorderRadius } from '@/theme/spacing';
import { DecisionOption, DecisionPoint } from '@/types/declutter';

interface DecisionPointModalProps {
  visible: boolean;
  decisionPoint: DecisionPoint | null;
  onSelect: (option: DecisionOption) => void;
  onSkip: () => void;
  onClose: () => void;
}

const AUTO_SELECT_DELAY = 5000;

export function DecisionPointModal({
  visible,
  decisionPoint,
  onSelect,
  onSkip,
  onClose,
}: DecisionPointModalProps) {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  
  const [countdown, setCountdown] = useState(5);
  const [autoSelectEnabled, setAutoSelectEnabled] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  const progressWidth = useSharedValue(100);

  const defaultOption = decisionPoint?.options.find(
    opt => opt.answer === decisionPoint.fiveSecondDefault
  ) || decisionPoint?.options[0];

  useEffect(() => {
    if (visible && decisionPoint && autoSelectEnabled) {
      setCountdown(5);
      progressWidth.value = 100;
      progressWidth.value = withTiming(0, { duration: AUTO_SELECT_DELAY });

      countdownRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      timerRef.current = setTimeout(() => {
        if (defaultOption) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          onSelect(defaultOption);
        }
      }, AUTO_SELECT_DELAY);

      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        if (countdownRef.current) clearInterval(countdownRef.current);
      };
    }
  }, [visible, decisionPoint, autoSelectEnabled]);

  const cancelAutoSelect = () => {
    setAutoSelectEnabled(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    progressWidth.value = withTiming(100, { duration: 200 });
  };

  const handleOptionSelect = (option: DecisionOption) => {
    cancelAutoSelect();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSelect(option);
  };

  const handleSkip = () => {
    cancelAutoSelect();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSkip();
  };

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  if (!decisionPoint) return null;

  const triggerEmoji = decisionPoint.trigger.includes('clothes') ? '👔' :
    decisionPoint.trigger.includes('paper') ? '📄' :
    decisionPoint.trigger.includes('item') ? '📦' : '🤔';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      accessibilityViewIsModal={true}
    >
      <View
        style={styles.overlay}
        accessible={true}
        accessibilityLabel="Decision point dialog"
      >
        <BlurView intensity={40} tint={colorScheme} style={StyleSheet.absoluteFill} />
        
        <Animated.View
          entering={SlideInUp.springify().damping(20)}
          exiting={FadeOut.duration(200)}
          style={[styles.modalContent, { backgroundColor: colors.card }]}
        >
          <View style={[styles.header, { backgroundColor: colors.primaryMuted }]}>
            <Text style={styles.triggerEmoji}>{triggerEmoji}</Text>
            <Text style={[Typography.caption1, { color: colors.textSecondary }]}>
              {decisionPoint.trigger}
            </Text>
          </View>

          <View style={styles.questionSection}>
            <Text style={[Typography.title2, { color: colors.text, textAlign: 'center' }]}>
              {decisionPoint.question}
            </Text>
          </View>

          {autoSelectEnabled && defaultOption && (
            <View style={styles.countdownSection}>
              <View style={[styles.progressBar, { backgroundColor: colors.surfaceSecondary }]}>
                <Animated.View 
                  style={[
                    styles.progressFill,
                    { backgroundColor: colors.primary },
                    progressStyle
                  ]} 
                />
              </View>
              <Text style={[Typography.caption1, { color: colors.textSecondary, marginTop: 8 }]}>
                Auto-selecting &quot;{defaultOption.answer}&quot; in {countdown}s
              </Text>
              <Pressable onPress={cancelAutoSelect} style={styles.cancelAutoButton}>
                <Text style={[Typography.caption1Medium, { color: colors.primary }]}>
                  Give me more time
                </Text>
              </Pressable>
            </View>
          )}

          <View style={styles.optionsSection}>
            {decisionPoint.options.map((option, index) => {
              const isDefault = option.answer === decisionPoint.fiveSecondDefault;
              return (
                <Pressable
                  key={index}
                  onPress={() => handleOptionSelect(option)}
                  style={[
                    styles.optionButton,
                    {
                      backgroundColor: isDefault 
                        ? colors.primary 
                        : colors.surfaceSecondary,
                      borderColor: isDefault ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      Typography.body,
                      {
                        color: isDefault ? colors.textOnPrimary : colors.text,
                        fontWeight: isDefault ? '600' : '400',
                      },
                    ]}
                  >
                    {option.answer}
                  </Text>
                  {isDefault && (
                    <View style={[styles.defaultBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                      <Text style={[Typography.caption2, { color: colors.textOnPrimary }]}>
                        Recommended
                      </Text>
                    </View>
                  )}
                  <Text
                    style={[
                      Typography.caption1,
                      {
                        color: isDefault ? colors.textOnPrimary : colors.textSecondary,
                        marginTop: 4,
                        opacity: 0.8,
                      },
                    ]}
                  >
                    {option.action}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {decisionPoint.emotionalSupport && (
            <View style={[styles.supportBox, { backgroundColor: colors.successMuted }]}>
              <Text style={[Typography.caption1, { color: colors.success }]}>
                {decisionPoint.emotionalSupport}
              </Text>
            </View>
          )}

          {decisionPoint.adhd_tip && (
            <View style={[styles.adhdTipBox, { backgroundColor: colors.infoMuted }]}>
              <Text style={styles.adhdTipEmoji}>💡</Text>
              <Text style={[Typography.caption1, { color: colors.info, flex: 1 }]}>
                {decisionPoint.adhd_tip}
              </Text>
            </View>
          )}

          <Pressable onPress={handleSkip} style={styles.skipButton} accessibilityRole="button" accessibilityLabel="Skip this decision">
            <Text style={[Typography.subheadline, { color: colors.textTertiary }]}>
              Skip this decision for now
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  triggerEmoji: {
    fontSize: 28,
  },
  questionSection: {
    padding: 24,
    paddingTop: 16,
  },
  countdownSection: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  cancelAutoButton: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  optionsSection: {
    paddingHorizontal: 24,
    gap: 12,
  },
  optionButton: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  defaultBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 8,
  },
  supportBox: {
    marginHorizontal: 24,
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
  },
  adhdTipBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: 24,
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  adhdTipEmoji: {
    fontSize: 16,
  },
  skipButton: {
    padding: 20,
    alignItems: 'center',
  },
});
