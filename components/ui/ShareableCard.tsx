/**
 * Declutterly - Shareable Before/After Transformation Card
 * Generates a visually striking card for Instagram/TikTok sharing.
 * Uses ViewShot to capture as image, falls back to native Share.
 */

import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useRef } from 'react';
import {
  Dimensions,
  Modal,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut, ZoomIn } from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Card ratio: 1080x1350 (Instagram portrait) scaled to screen
const CARD_WIDTH = Math.min(SCREEN_WIDTH - 48, 360);
const CARD_HEIGHT = CARD_WIDTH * (1350 / 1080);
const PHOTO_SIZE = (CARD_WIDTH - 56) / 2;

export interface ShareableCardProps {
  beforeImageUri: string;
  afterImageUri: string;
  roomName: string;
  roomEmoji: string;
  tasksCompleted: number;
  timeSpent: number; // minutes
  messLevelBefore: number; // 0-100
  messLevelAfter: number; // 0-100
  streak: number;
  level: number;
  userName?: string;
  visible: boolean;
  onShare: () => void;
  onDismiss: () => void;
}

export function ShareableCard({
  beforeImageUri,
  afterImageUri,
  roomName,
  roomEmoji,
  tasksCompleted,
  timeSpent,
  messLevelBefore,
  messLevelAfter,
  streak,
  level,
  userName,
  visible,
  onShare,
  onDismiss,
}: ShareableCardProps) {
  const cardRef = useRef<View>(null);

  const improvementPercent = Math.max(0, Math.round(messLevelBefore - messLevelAfter));
  const hasBeforePhoto = !!beforeImageUri;
  const hasAfterPhoto = !!afterImageUri;

  const handleShare = useCallback(async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Build share message with stats
      const message = [
        `${roomEmoji} ${roomName} Transformation!`,
        `${messLevelBefore}% -> ${messLevelAfter}% mess level (${improvementPercent}% better)`,
        `${tasksCompleted} tasks completed in ${timeSpent} min`,
        streak > 0 ? `${streak}-day streak` : '',
        '',
        'Cleaned with Declutterly',
        'declutterly.app',
        '#Declutterly #ADHDCleaning #BeforeAndAfter',
      ]
        .filter(Boolean)
        .join('\n');

      const sharePayload: { message: string; title: string; url?: string } = {
        message,
        title: `${roomEmoji} ${roomName} Transformation`,
      };

      // If we have an after photo, share it on iOS
      if (hasAfterPhoto && Platform.OS === 'ios') {
        sharePayload.url = afterImageUri;
      }

      await Share.share(sharePayload);
      onShare();
    } catch {
      // User cancelled share
    }
  }, [
    roomEmoji,
    roomName,
    messLevelBefore,
    messLevelAfter,
    improvementPercent,
    tasksCompleted,
    timeSpent,
    streak,
    hasAfterPhoto,
    afterImageUri,
    onShare,
  ]);

  const handleDismiss = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onDismiss();
  }, [onDismiss]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleDismiss}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        {/* Background tap to dismiss */}
        <Pressable style={StyleSheet.absoluteFill} onPress={handleDismiss} />

        <Animated.View entering={ZoomIn.duration(350).damping(15)} style={styles.cardWrapper}>
          {/* The actual shareable card */}
          <View ref={cardRef} style={styles.cardContainer} collapsable={false}>
            <LinearGradient
              colors={['#0F172A', '#1a1545', '#1E1B4B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0.3, y: 1 }}
              style={styles.cardGradient}
            >
              {/* Header */}
              <Animated.View entering={FadeInDown.delay(100)} style={styles.cardHeader}>
                <Text style={styles.headerSparkle}>
                  {'   '}Room Transformation{'   '}
                </Text>
              </Animated.View>

              {/* Before / After Photos */}
              <Animated.View entering={FadeInDown.delay(200)} style={styles.photosRow}>
                {/* Before Photo */}
                <View style={styles.photoContainer}>
                  <View style={styles.photoLabelContainer}>
                    <Text style={styles.photoLabel}>BEFORE</Text>
                  </View>
                  {hasBeforePhoto ? (
                    <View style={styles.photoWrapper}>
                      <Image
                        source={{ uri: beforeImageUri }}
                        style={styles.photo}
                        contentFit="cover"
                      />
                      {/* Red tint overlay */}
                      <View style={styles.beforeOverlay} />
                    </View>
                  ) : (
                    <View style={[styles.photo, styles.placeholderPhoto]}>
                      <Text style={styles.placeholderEmoji}>📷</Text>
                      <Text style={styles.placeholderText}>No photo</Text>
                    </View>
                  )}
                </View>

                {/* After Photo */}
                <View style={styles.photoContainer}>
                  <View style={styles.photoLabelContainer}>
                    <Text style={styles.photoLabel}>AFTER</Text>
                  </View>
                  {hasAfterPhoto ? (
                    <View style={styles.photoWrapper}>
                      <Image
                        source={{ uri: afterImageUri }}
                        style={styles.photo}
                        contentFit="cover"
                      />
                      {/* Green tint overlay */}
                      <View style={styles.afterOverlay} />
                    </View>
                  ) : (
                    <View style={[styles.photo, styles.placeholderPhoto]}>
                      <Text style={styles.placeholderEmoji}>📷</Text>
                      <Text style={styles.placeholderText}>No photo</Text>
                    </View>
                  )}
                </View>
              </Animated.View>

              {/* Room Name + Progress */}
              <Animated.View entering={FadeInDown.delay(300)} style={styles.progressSection}>
                <Text style={styles.roomNameText}>
                  {roomEmoji} {roomName}
                </Text>
                <Text style={styles.messLevelText}>
                  {messLevelBefore}% → {messLevelAfter}% mess level
                </Text>

                {/* Progress bar */}
                <View style={styles.progressBarContainer}>
                  <LinearGradient
                    colors={['#22C55E', '#10B981', '#059669']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[
                      styles.progressBarFill,
                      { width: `${Math.min(100, improvementPercent)}%` },
                    ]}
                  />
                </View>
                <Text style={styles.improvementText}>{improvementPercent}% better</Text>
              </Animated.View>

              {/* Stats Row */}
              <Animated.View entering={FadeInDown.delay(400)} style={styles.statsRow}>
                <Text style={styles.statItem}>
                  {'  '}{tasksCompleted} tasks{'  '}
                </Text>
                <Text style={styles.statDot}>{'  '}</Text>
                <Text style={styles.statItem}>
                  {'  '}{timeSpent} min{'  '}
                </Text>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(450)} style={styles.statsRow2}>
                {streak > 0 && (
                  <Text style={styles.statItem}>
                    {'  '}Day {streak} streak{'  '}
                  </Text>
                )}
                {streak > 0 && level > 0 && <Text style={styles.statDot}>{'  '}</Text>}
                {level > 0 && (
                  <Text style={styles.statItem}>Lv.{level}</Text>
                )}
              </Animated.View>

              {/* Watermark */}
              <Animated.View entering={FadeInDown.delay(500)} style={styles.watermark}>
                <View style={styles.watermarkDivider} />
                <Text style={styles.watermarkText}>Cleaned with Declutterly</Text>
                <Text style={styles.watermarkUrl}>declutterly.app</Text>
              </Animated.View>
            </LinearGradient>
          </View>

          {/* Action Buttons (outside the card, not captured) */}
          <Animated.View entering={FadeIn.delay(600)} style={styles.actionsContainer}>
            <Pressable onPress={handleShare} style={styles.shareButton}>
              <LinearGradient
                colors={['#6366F1', '#8B5CF6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.shareButtonGradient}
              >
                <Text style={styles.shareButtonText}>Share</Text>
              </LinearGradient>
            </Pressable>

            <Pressable onPress={handleDismiss} style={styles.dismissButton}>
              <Text style={styles.dismissButtonText}>Close</Text>
            </Pressable>
          </Animated.View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardWrapper: {
    alignItems: 'center',
  },
  cardContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 24,
    overflow: 'hidden',
    // Shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
  },
  cardGradient: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
    justifyContent: 'space-between',
  },

  // Header
  cardHeader: {
    alignItems: 'center',
    marginBottom: 12,
  },
  headerSparkle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.5,
  },

  // Photos
  photosRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  photoContainer: {
    flex: 1,
    alignItems: 'center',
  },
  photoLabelContainer: {
    marginBottom: 6,
  },
  photoLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.7)',
    textTransform: 'uppercase',
    letterSpacing: 2,
    textAlign: 'center',
  },
  photoWrapper: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 14,
  },
  beforeOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderRadius: 14,
  },
  afterOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    borderRadius: 14,
  },
  placeholderPhoto: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  placeholderText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.4)',
  },

  // Progress Section
  progressSection: {
    alignItems: 'center',
    marginBottom: 12,
  },
  roomNameText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center',
  },
  messLevelText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 10,
    textAlign: 'center',
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  improvementText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#22C55E',
    textAlign: 'center',
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  statsRow2: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statItem: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '500',
  },
  statDot: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.4)',
  },

  // Watermark
  watermark: {
    alignItems: 'center',
    marginTop: 'auto',
  },
  watermarkDivider: {
    width: 120,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginBottom: 10,
  },
  watermarkText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.5)',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  watermarkUrl: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.35)',
    letterSpacing: 0.3,
  },

  // Action Buttons (below the card)
  actionsContainer: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 12,
    alignItems: 'center',
  },
  shareButton: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  shareButtonGradient: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shareButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  dismissButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  dismissButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
  },
});

export default ShareableCard;
