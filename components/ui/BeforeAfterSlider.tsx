/**
 * BeforeAfterSlider - Interactive before/after photo comparison
 * Drag slider to reveal transformation
 * High priority item from UI/UX improvement guide
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useColorScheme } from '@/hooks/useColorScheme';
import {
  View,
  StyleSheet,
  Image,
  Pressable,
  Text,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { BorderRadius, Spacing } from '@/theme/spacing';
import { SpringConfigs } from '@/theme/animations';

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
  aspectRatio?: number;
  borderRadius?: number;
  showLabels?: boolean;
  showShareButton?: boolean;
  onShare?: () => void;
  autoPlay?: boolean;
  autoPlayDuration?: number;
  style?: object;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function BeforeAfterSlider({
  beforeImage,
  afterImage,
  beforeLabel = 'Before',
  afterLabel = 'After',
  aspectRatio = 4 / 3,
  borderRadius = BorderRadius.lg,
  showLabels = true,
  showShareButton = false,
  onShare,
  autoPlay = false,
  autoPlayDuration = 3000,
  style,
}: BeforeAfterSliderProps) {
  useColorScheme();
  const [containerWidth, setContainerWidth] = useState(SCREEN_WIDTH - Spacing.lg * 2);

  const sliderPosition = useSharedValue(0.5); // 0 = all before, 1 = all after
  const context = useSharedValue({ position: 0.5 });
  const isDragging = useSharedValue(false);

  const handleAutoPlay = useCallback(() => {
    // Animate from before to after and back
    sliderPosition.value = withTiming(0.9, { duration: autoPlayDuration / 2 }, () => {
      sliderPosition.value = withTiming(0.1, { duration: autoPlayDuration / 2 }, () => {
        sliderPosition.value = withSpring(0.5, SpringConfigs.gentle);
      });
    });
  }, [autoPlayDuration, sliderPosition]);

  useEffect(() => {
    if (autoPlay) {
      handleAutoPlay();
    }
  }, [autoPlay, handleAutoPlay]);

  const gesture = Gesture.Pan()
    .onStart(() => {
      context.value = { position: sliderPosition.value };
      isDragging.value = true;
    })
    .onUpdate((event) => {
      const newPosition = context.value.position + event.translationX / containerWidth;
      sliderPosition.value = Math.max(0.05, Math.min(0.95, newPosition));
    })
    .onEnd(() => {
      isDragging.value = false;
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
    });

  const handleLayout = useCallback(
    (event: { nativeEvent: { layout: { width: number } } }) => {
      setContainerWidth(event.nativeEvent.layout.width);
    },
    []
  );

  // Animated style for the "After" image clip
  const afterClipStyle = useAnimatedStyle(() => ({
    width: sliderPosition.value * containerWidth,
  }));

  // Animated style for the slider handle
  const handleStyle = useAnimatedStyle(() => ({
    left: sliderPosition.value * containerWidth - 20,
    transform: [
      { scale: isDragging.value ? 1.1 : 1 },
    ],
  }));

  // Animated style for labels
  const beforeLabelStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      sliderPosition.value,
      [0.3, 0.5],
      [1, 0.5],
      Extrapolation.CLAMP
    );
    return { opacity };
  });

  const afterLabelStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      sliderPosition.value,
      [0.5, 0.7],
      [0.5, 1],
      Extrapolation.CLAMP
    );
    return { opacity };
  });

  const containerHeight = containerWidth / aspectRatio;

  return (
    <View
      style={[
        styles.container,
        { borderRadius, height: containerHeight },
        style,
      ]}
      onLayout={handleLayout}
    >
      {/* Before Image (Full) */}
      <Image
        source={{ uri: beforeImage }}
        style={[styles.image, { borderRadius }]}
        resizeMode="cover"
      />

      {/* After Image (Clipped) */}
      <Animated.View
        style={[
          styles.afterContainer,
          { borderRadius },
          afterClipStyle,
        ]}
      >
        <Image
          source={{ uri: afterImage }}
          style={[
            styles.image,
            styles.afterImage,
            { borderRadius, width: containerWidth },
          ]}
          resizeMode="cover"
        />
      </Animated.View>

      {/* Slider Handle */}
      <GestureDetector gesture={gesture}>
        <Animated.View style={[styles.handleContainer, handleStyle]}>
          <View style={[styles.handleLine, { backgroundColor: '#FFFFFF' }]} />
          <View
            style={[
              styles.handleKnob,
              {
                backgroundColor: '#FFFFFF',
                shadowColor: '#000',
              },
            ]}
          >
            <Text style={styles.handleIcon}>↔</Text>
          </View>
          <View style={[styles.handleLine, { backgroundColor: '#FFFFFF' }]} />
        </Animated.View>
      </GestureDetector>

      {/* Labels */}
      {showLabels && (
        <>
          <Animated.View style={[styles.labelLeft, beforeLabelStyle]}>
            <View
              style={[
                styles.labelBadge,
                { backgroundColor: 'rgba(0, 0, 0, 0.6)' },
              ]}
            >
              <Text style={styles.labelText}>{beforeLabel}</Text>
            </View>
          </Animated.View>

          <Animated.View style={[styles.labelRight, afterLabelStyle]}>
            <View
              style={[
                styles.labelBadge,
                { backgroundColor: 'rgba(0, 0, 0, 0.6)' },
              ]}
            >
              <Text style={styles.labelText}>{afterLabel}</Text>
            </View>
          </Animated.View>
        </>
      )}

      {/* Share Button */}
      {showShareButton && onShare && (
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onShare();
          }}
          style={[styles.shareButton, { backgroundColor: 'rgba(0, 0, 0, 0.6)' }]}
        >
          <Text style={styles.shareIcon}>📤</Text>
          <Text style={styles.shareText}>Share</Text>
        </Pressable>
      )}

      {/* Auto-play Button (if not auto-playing) */}
      {!autoPlay && (
        <Pressable
          onPress={handleAutoPlay}
          style={[styles.playButton, { backgroundColor: 'rgba(0, 0, 0, 0.6)' }]}
        >
          <Text style={styles.playIcon}>▶</Text>
        </Pressable>
      )}
    </View>
  );
}

// Vertical slider variant
export function VerticalBeforeAfterSlider({
  beforeImage,
  afterImage,
  beforeLabel = 'Before',
  afterLabel = 'After',
  aspectRatio = 3 / 4,
  borderRadius = BorderRadius.lg,
  showLabels = true,
  style,
}: Omit<BeforeAfterSliderProps, 'showShareButton' | 'onShare' | 'autoPlay' | 'autoPlayDuration'>) {
  useColorScheme();
  const [containerHeight, setContainerHeight] = useState(400);

  const sliderPosition = useSharedValue(0.5);
  const context = useSharedValue({ position: 0.5 });

  const gesture = Gesture.Pan()
    .onStart(() => {
      context.value = { position: sliderPosition.value };
    })
    .onUpdate((event) => {
      const newPosition = context.value.position + event.translationY / containerHeight;
      sliderPosition.value = Math.max(0.05, Math.min(0.95, newPosition));
    })
    .onEnd(() => {
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
    });

  const handleLayout = useCallback(
    (event: { nativeEvent: { layout: { height: number } } }) => {
      setContainerHeight(event.nativeEvent.layout.height);
    },
    []
  );

  const afterClipStyle = useAnimatedStyle(() => ({
    height: sliderPosition.value * containerHeight,
  }));

  const handleStyle = useAnimatedStyle(() => ({
    top: sliderPosition.value * containerHeight - 20,
  }));

  const containerWidth = containerHeight * aspectRatio;

  return (
    <View
      style={[
        styles.container,
        { borderRadius, width: containerWidth },
        style,
      ]}
      onLayout={handleLayout}
    >
      <Image
        source={{ uri: beforeImage }}
        style={[styles.image, { borderRadius }]}
        resizeMode="cover"
      />

      <Animated.View
        style={[
          styles.afterContainerVertical,
          { borderRadius },
          afterClipStyle,
        ]}
      >
        <Image
          source={{ uri: afterImage }}
          style={[
            styles.image,
            { borderRadius, height: containerHeight },
          ]}
          resizeMode="cover"
        />
      </Animated.View>

      <GestureDetector gesture={gesture}>
        <Animated.View style={[styles.handleContainerVertical, handleStyle]}>
          <View style={[styles.handleLineVertical, { backgroundColor: '#FFFFFF' }]} />
          <View
            style={[
              styles.handleKnob,
              {
                backgroundColor: '#FFFFFF',
                shadowColor: '#000',
              },
            ]}
          >
            <Text style={styles.handleIconVertical}>↕</Text>
          </View>
          <View style={[styles.handleLineVertical, { backgroundColor: '#FFFFFF' }]} />
        </Animated.View>
      </GestureDetector>

      {showLabels && (
        <>
          <View style={styles.labelTop}>
            <View
              style={[
                styles.labelBadge,
                { backgroundColor: 'rgba(0, 0, 0, 0.6)' },
              ]}
            >
              <Text style={styles.labelText}>{beforeLabel}</Text>
            </View>
          </View>
          <View style={styles.labelBottom}>
            <View
              style={[
                styles.labelBadge,
                { backgroundColor: 'rgba(0, 0, 0, 0.6)' },
              ]}
            >
              <Text style={styles.labelText}>{afterLabel}</Text>
            </View>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  afterContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  afterContainerVertical: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
  },
  afterImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
  },
  handleContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 40,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  handleContainerVertical: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  handleLine: {
    flex: 1,
    width: 3,
    borderRadius: 1.5,
  },
  handleLineVertical: {
    flex: 1,
    height: 3,
    borderRadius: 1.5,
  },
  handleKnob: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  handleIcon: {
    fontSize: 18,
    color: '#333',
  },
  handleIconVertical: {
    fontSize: 18,
    color: '#333',
  },
  labelLeft: {
    position: 'absolute',
    bottom: Spacing.sm,
    left: Spacing.sm,
  },
  labelRight: {
    position: 'absolute',
    bottom: Spacing.sm,
    right: Spacing.sm,
  },
  labelTop: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
  },
  labelBottom: {
    position: 'absolute',
    bottom: Spacing.sm,
    left: Spacing.sm,
  },
  labelBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs,
    borderRadius: BorderRadius.sm,
  },
  labelText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  shareButton: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    gap: Spacing.xxs,
  },
  shareIcon: {
    fontSize: 14,
  },
  shareText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  playButton: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    color: '#FFFFFF',
    fontSize: 12,
    marginLeft: 2,
  },
});

export default BeforeAfterSlider;
