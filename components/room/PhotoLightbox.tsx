import React from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  Alert,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { PhotoCapture } from '@/types/declutter';
import { ColorTokens } from '@/constants/Colors';
import { Typography } from '@/theme/typography';
import { Spacing, BorderRadius } from '@/theme/spacing';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function PhotoLightbox({
  photos,
  selectedIndex,
  onClose,
  onChangeIndex,
  onDelete,
  colors,
  insets,
}: {
  photos: PhotoCapture[];
  selectedIndex: number | null;
  onClose: () => void;
  onChangeIndex: (index: number | null) => void;
  onDelete: (photoId: string) => void;
  colors: ColorTokens;
  insets: { top: number; bottom: number };
}) {
  const translateX = useSharedValue(0);
  const scale = useSharedValue(1);

  const imageStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { scale: scale.value },
    ],
  }));

  if (selectedIndex === null || photos.length === 0) return null;

  const currentPhoto = photos[selectedIndex];

  const handlePrev = () => {
    if (selectedIndex > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onChangeIndex(selectedIndex - 1);
    }
  };

  const handleNext = () => {
    if (selectedIndex < photos.length - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onChangeIndex(selectedIndex + 1);
    }
  };

  const swipeGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
    })
    .onEnd((event) => {
      if (event.translationX > 100 && selectedIndex > 0) {
        runOnJS(handlePrev)();
      } else if (event.translationX < -100 && selectedIndex < photos.length - 1) {
        runOnJS(handleNext)();
      }
      translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
    });

  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      scale.value = Math.min(Math.max(event.scale, 0.5), 3);
    })
    .onEnd(() => {
      scale.value = withSpring(1, { damping: 20, stiffness: 200 });
    });

  const composedGestures = Gesture.Simultaneous(swipeGesture, pinchGesture);

  return (
    <Modal
      visible={true}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      accessibilityViewIsModal={true}
    >
      <View style={styles.lightboxContainer}>
        <BlurView intensity={95} tint="dark" style={StyleSheet.absoluteFill} />

        <Pressable
          style={[styles.lightboxCloseButton, { top: insets.top + Spacing.md }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onClose();
          }}
          accessibilityRole="button"
          accessibilityLabel="Close photo viewer"
        >
          <BlurView intensity={40} tint="dark" style={styles.lightboxButtonBlur}>
            <Text style={styles.lightboxCloseText}>✕</Text>
          </BlurView>
        </Pressable>

        <Pressable
          style={[styles.lightboxDeleteButton, { top: insets.top + Spacing.md }]}
          accessibilityRole="button"
          accessibilityLabel="Delete this photo"
          onPress={() => {
            Alert.alert(
              'Delete Photo',
              'Are you sure you want to delete this photo?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: () => {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                    onDelete(currentPhoto.id);
                    if (photos.length <= 1) {
                      onClose();
                    } else if (selectedIndex >= photos.length - 1) {
                      onChangeIndex(selectedIndex - 1);
                    }
                  },
                },
              ]
            );
          }}
        >
          <BlurView intensity={40} tint="dark" style={styles.lightboxButtonBlur}>
            <Text style={styles.lightboxDeleteText}>🗑️</Text>
          </BlurView>
        </Pressable>

        <View style={[styles.lightboxCounter, { top: insets.top + Spacing.md }]}>
          <BlurView intensity={40} tint="dark" style={styles.lightboxButtonBlur}>
            <Text style={styles.lightboxCounterText}>
              {selectedIndex + 1} / {photos.length}
            </Text>
          </BlurView>
        </View>

        <GestureDetector gesture={composedGestures}>
          <Animated.View style={[styles.lightboxImageContainer, imageStyle]}>
            <Image
              source={{ uri: currentPhoto.uri }}
              style={styles.lightboxImage}
              contentFit="contain"
            />
          </Animated.View>
        </GestureDetector>

        <View style={[styles.lightboxPhotoInfo, { bottom: insets.bottom + Spacing.massive + Spacing.md }]}>
          <BlurView intensity={40} tint="dark" style={styles.lightboxInfoBlur}>
            <Text style={styles.lightboxPhotoType}>{currentPhoto.type}</Text>
            <Text style={styles.lightboxPhotoDate}>
              {currentPhoto.timestamp.toLocaleDateString()}
            </Text>
          </BlurView>
        </View>

        <View style={styles.lightboxNav}>
          {selectedIndex > 0 && (
            <Pressable
              style={[styles.lightboxNavButton, styles.lightboxNavLeft]}
              onPress={handlePrev}
              accessibilityRole="button"
              accessibilityLabel="Previous photo"
            >
              <BlurView intensity={40} tint="dark" style={styles.lightboxNavBlur}>
                <Text style={styles.lightboxNavText}>←</Text>
              </BlurView>
            </Pressable>
          )}

          {selectedIndex < photos.length - 1 && (
            <Pressable
              style={[styles.lightboxNavButton, styles.lightboxNavRight]}
              onPress={handleNext}
              accessibilityRole="button"
              accessibilityLabel="Next photo"
            >
              <BlurView intensity={40} tint="dark" style={styles.lightboxNavBlur}>
                <Text style={styles.lightboxNavText}>→</Text>
              </BlurView>
            </Pressable>
          )}
        </View>

        {photos.length > 1 && (
          <View style={[styles.lightboxThumbnails, { bottom: insets.bottom + Spacing.md }]}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.lightboxThumbnailsContent}
            >
              {photos.map((photo, index) => (
                <Pressable
                  key={photo.id}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onChangeIndex(index);
                  }}
                >
                  <View
                    style={[
                      styles.lightboxThumbnail,
                      index === selectedIndex && styles.lightboxThumbnailActive,
                    ]}
                  >
                    <Image
                      source={{ uri: photo.uri }}
                      style={styles.lightboxThumbnailImage}
                      contentFit="cover"
                    />
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  lightboxContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  lightboxCloseButton: {
    position: 'absolute',
    right: Spacing.md,
    zIndex: 10,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  lightboxButtonBlur: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: BorderRadius.xl,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightboxCloseText: {
    ...Typography.subheadlineMedium,
    color: '#FFFFFF',
  },
  lightboxDeleteButton: {
    position: 'absolute',
    right: 70,
    zIndex: 10,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  lightboxDeleteText: {
    fontSize: 18,
  },
  lightboxCounter: {
    position: 'absolute',
    left: Spacing.md,
    zIndex: 10,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  lightboxCounterText: {
    ...Typography.caption1Medium,
    color: '#FFFFFF',
  },
  lightboxImageContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.ml,
  },
  lightboxImage: {
    width: SCREEN_WIDTH - Spacing.xxl * 2,
    height: SCREEN_HEIGHT * 0.6,
    borderRadius: BorderRadius.md,
  },
  lightboxPhotoInfo: {
    position: 'absolute',
    alignSelf: 'center',
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  lightboxInfoBlur: {
    paddingHorizontal: Spacing.ml,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  lightboxPhotoType: {
    ...Typography.subheadlineMedium,
    color: '#FFFFFF',
    textTransform: 'capitalize',
  },
  lightboxPhotoDate: {
    ...Typography.caption2,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: Spacing.hairline,
  },
  lightboxNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '50%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
  },
  lightboxNavButton: {
    borderRadius: BorderRadius.xxl,
    overflow: 'hidden',
  },
  lightboxNavLeft: {},
  lightboxNavRight: {},
  lightboxNavBlur: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.xxl,
  },
  lightboxNavText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '300',
  },
  lightboxThumbnails: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  lightboxThumbnailsContent: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.xs,
  },
  lightboxThumbnail: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  lightboxThumbnailActive: {
    borderColor: '#FFFFFF',
  },
  lightboxThumbnailImage: {
    width: '100%',
    height: '100%',
  },
});
