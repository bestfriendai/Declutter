import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

import { Confetti } from '@/components/ui/Confetti';
import { ColorTokens } from '@/constants/Colors';
import { Room } from '@/types/declutter';

interface RoomCompleteModalProps {
  visible: boolean;
  room: Room | undefined;
  totalTime: number;
  onClose: () => void;
  onTakePhoto: () => void;
  onShare: () => void;
  colors: ColorTokens;
}

export function RoomCompleteModal({
  visible,
  room,
  totalTime,
  onClose,
  onTakePhoto,
  onShare,
  colors,
}: RoomCompleteModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      accessibilityViewIsModal={true}
    >
      <View
        style={styles.roomCompleteContainer}
        accessible={true}
        accessibilityLabel="Room complete celebration dialog"
      >
        <BlurView intensity={95} tint="dark" style={StyleSheet.absoluteFill} />

        {/* Confetti Animation */}
        <Confetti visible={visible} intensity="heavy" />

        <Animated.View
          entering={ZoomIn.springify()}
          style={styles.roomCompleteContent}
        >
          {/* Room emoji with glow */}
          <View style={styles.roomCompleteEmojiContainer}>
            <Text style={styles.roomCompleteEmoji}>{room?.emoji || '🏠'}</Text>
            <Text style={styles.roomCompleteSparkle1}>✨</Text>
            <Text style={styles.roomCompleteSparkle2}>🌟</Text>
            <Text style={styles.roomCompleteSparkle3}>💫</Text>
          </View>

          {/* Celebration message */}
          <Text style={styles.roomCompleteTitle}>Room Complete!</Text>
          <Text style={styles.roomCompleteSubtitle}>
            {room?.name || 'This room'} is now sparkling clean!
          </Text>

          {/* Stats summary */}
          <View style={styles.roomCompleteStats}>
            <View style={styles.roomCompleteStat}>
              <Text style={styles.roomCompleteStatValue}>{room?.tasks.length || 0}</Text>
              <Text style={styles.roomCompleteStatLabel}>Tasks Done</Text>
            </View>
            <View style={[styles.roomCompleteStatDivider, { backgroundColor: 'rgba(255,255,255,0.2)' }]} />
            <View style={styles.roomCompleteStat}>
              <Text style={styles.roomCompleteStatValue}>~{totalTime}</Text>
              <Text style={styles.roomCompleteStatLabel}>Min Saved</Text>
            </View>
            <View style={[styles.roomCompleteStatDivider, { backgroundColor: 'rgba(255,255,255,0.2)' }]} />
            <View style={styles.roomCompleteStat}>
              <Text style={styles.roomCompleteStatValue}>+{(room?.tasks.length || 0) * 10}</Text>
              <Text style={styles.roomCompleteStatLabel}>XP Earned</Text>
            </View>
          </View>

          {/* Motivational message */}
          <Text style={styles.roomCompleteMotivation}>
            You did amazing! Keep up the momentum 💪
          </Text>

          {/* Continue button */}
          <Pressable
            onPress={() => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              onClose();
            }}
            style={styles.roomCompleteContinueButton}
            accessibilityRole="button"
            accessibilityLabel="Continue"
            accessibilityHint="Dismiss this celebration and continue"
          >
            <LinearGradient
              colors={[...colors.gradientPrimary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.roomCompleteContinueGradient}
            >
              <Text style={styles.roomCompleteContinueText}>Continue</Text>
            </LinearGradient>
          </Pressable>

          {/* Secondary action buttons */}
          <View style={styles.roomCompleteSecondaryButtons}>
            {/* Take after photo prompt */}
            <Pressable
              onPress={() => {
                onClose();
                onTakePhoto();
              }}
              style={styles.roomCompleteSecondaryButton}
              accessibilityRole="button"
              accessibilityLabel="Take after photo"
            >
              <Text style={[styles.roomCompleteSecondaryText, { color: colors.primary }]}>
                📸 Take Photo
              </Text>
            </Pressable>

            {/* Share button */}
            <Pressable
              onPress={() => {
                onClose();
                onShare();
              }}
              style={styles.roomCompleteSecondaryButton}
              accessibilityRole="button"
              accessibilityLabel="Share your progress"
            >
              <Text style={[styles.roomCompleteSecondaryText, { color: colors.primary }]}>
                📤 Share
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  roomCompleteContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roomCompleteContent: {
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 40,
    maxWidth: 360,
  },
  roomCompleteEmojiContainer: {
    position: 'relative',
    marginBottom: 24,
  },
  roomCompleteEmoji: {
    fontSize: 80,
  },
  roomCompleteSparkle1: {
    position: 'absolute',
    top: -10,
    right: -25,
    fontSize: 28,
  },
  roomCompleteSparkle2: {
    position: 'absolute',
    top: 10,
    left: -30,
    fontSize: 24,
  },
  roomCompleteSparkle3: {
    position: 'absolute',
    bottom: 0,
    right: -20,
    fontSize: 20,
  },
  roomCompleteTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  roomCompleteSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 32,
  },
  roomCompleteStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 24,
    width: '100%',
  },
  roomCompleteStat: {
    flex: 1,
    alignItems: 'center',
  },
  roomCompleteStatValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  roomCompleteStatLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  roomCompleteStatDivider: {
    width: 1,
    height: 32,
    marginHorizontal: 12,
  },
  roomCompleteMotivation: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 32,
    fontStyle: 'italic',
  },
  roomCompleteContinueButton: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 16,
  },
  roomCompleteContinueGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 14,
  },
  roomCompleteContinueText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  roomCompleteSecondaryButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
  },
  roomCompleteSecondaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  roomCompleteSecondaryText: {
    fontSize: 15,
    fontWeight: '500',
  },
});
