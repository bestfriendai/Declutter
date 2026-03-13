import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

import { ColorTokens } from '@/constants/Colors';
import { Typography } from '@/theme/typography';
import { Spacing, BorderRadius } from '@/theme/spacing';

interface GoodEnoughModalProps {
  visible: boolean;
  colors: ColorTokens;
  onKeepGoing: () => void;
  onDone: () => void;
}

export function GoodEnoughModal({
  visible,
  colors,
  onKeepGoing,
  onDone,
}: GoodEnoughModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDone}
      statusBarTranslucent
      accessibilityViewIsModal={true}
    >
      <View
        style={styles.container}
        accessible={true}
        accessibilityLabel="Progress celebration dialog"
      >
        <BlurView intensity={85} tint="dark" style={StyleSheet.absoluteFill} />
        <Animated.View
          entering={ZoomIn.springify()}
          style={styles.content}
        >
          <Text style={styles.emoji}>🌿</Text>
          <Text style={styles.title}>You did real work today.</Text>
          <Text style={styles.subtitle}>
            Progress isn&apos;t about finishing everything — it&apos;s about showing up. And you did.
          </Text>
          <Text style={styles.message}>
            Rest is part of the process.
          </Text>
          <View style={styles.buttons}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onKeepGoing();
              }}
              style={styles.buttonWrapper}
              accessibilityRole="button"
              accessibilityLabel="Keep going"
            >
              <LinearGradient
                colors={[...colors.gradientPrimary]}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>I want to keep going</Text>
              </LinearGradient>
            </Pressable>
            <Pressable
              onPress={() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                onDone();
              }}
              style={styles.secondaryButton}
              accessibilityRole="button"
              accessibilityLabel="Done for today"
            >
              <Text style={[styles.secondaryText, { color: colors.primary }]}>
                Done for today — and that&apos;s OK
              </Text>
            </Pressable>
          </View>
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
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    ...Typography.title1,
    color: '#FFFFFF',
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.body,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: Spacing.sm,
    lineHeight: 24,
  },
  message: {
    ...Typography.subheadline,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: Spacing.lg,
  },
  buttons: {
    width: '100%',
    gap: Spacing.sm,
  },
  buttonWrapper: {
    width: '100%',
    borderRadius: BorderRadius.button,
    overflow: 'hidden',
  },
  buttonGradient: {
    paddingVertical: Spacing.sm + Spacing.hairline,
    alignItems: 'center',
    borderRadius: BorderRadius.button,
  },
  buttonText: {
    ...Typography.buttonMedium,
    color: '#FFFFFF',
  },
  secondaryButton: {
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  secondaryText: {
    ...Typography.subheadlineMedium,
  },
});
