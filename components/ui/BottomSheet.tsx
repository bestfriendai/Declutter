/**
 * BottomSheet - Drawer-style interactions with gesture support
 * Smooth animations and snap points
 */

import { Colors } from '@/constants/Colors';
import { SpringConfigs } from '@/theme/animations';
import { BorderRadius, Spacing } from '@/theme/spacing';
import * as Haptics from 'expo-haptics';
import React, { forwardRef, useCallback, useEffect, useImperativeHandle } from 'react';
import {
    BackHandler,
    Dimensions,
    Pressable,
    StyleSheet,
    useColorScheme,
    View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    Extrapolation,
    interpolate,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MAX_TRANSLATE_Y = -SCREEN_HEIGHT + 50;

export interface BottomSheetRef {
  open: () => void;
  close: () => void;
  snapTo: (index: number) => void;
}

interface BottomSheetProps {
  children: React.ReactNode;
  snapPoints?: number[]; // Array of heights (e.g., [300, 500, SCREEN_HEIGHT - 100])
  initialSnapIndex?: number;
  onClose?: () => void;
  onOpen?: () => void;
  enablePanDownToClose?: boolean;
  enableBackdropDismiss?: boolean;
  backdropOpacity?: number;
  handleIndicator?: boolean;
  style?: object;
}

export const BottomSheet = forwardRef<BottomSheetRef, BottomSheetProps>(
  (
    {
      children,
      snapPoints = [300, SCREEN_HEIGHT * 0.5, SCREEN_HEIGHT * 0.9],
      initialSnapIndex = -1,
      onClose,
      onOpen,
      enablePanDownToClose = true,
      enableBackdropDismiss = true,
      backdropOpacity = 0.5,
      handleIndicator = true,
      style,
    },
    ref
  ) => {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const insets = useSafeAreaInsets();

    const translateY = useSharedValue(SCREEN_HEIGHT);
    const context = useSharedValue({ y: 0 });
    const active = useSharedValue(false);
    const currentSnapIndex = useSharedValue(initialSnapIndex);

    const snapToIndex = useCallback(
      (index: number) => {
        'worklet';
        if (index < 0) {
          translateY.value = withSpring(SCREEN_HEIGHT, SpringConfigs.gentle);
          active.value = false;
          currentSnapIndex.value = -1;
          if (onClose) runOnJS(onClose)();
        } else if (index < snapPoints.length) {
          const snapHeight = snapPoints[index];
          translateY.value = withSpring(
            SCREEN_HEIGHT - snapHeight,
            SpringConfigs.snappy
          );
          active.value = true;
          currentSnapIndex.value = index;
          if (onOpen) runOnJS(onOpen)();
        }
      },
      [snapPoints, onClose, onOpen]
    );

    const open = useCallback(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      snapToIndex(0);
    }, [snapToIndex]);

    const close = useCallback(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      snapToIndex(-1);
    }, [snapToIndex]);

    useImperativeHandle(ref, () => ({
      open,
      close,
      snapTo: (index: number) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        snapToIndex(index);
      },
    }));

    // Handle Android back button
    useEffect(() => {
      const backAction = () => {
        if (active.value) {
          close();
          return true;
        }
        return false;
      };

      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        backAction
      );

      return () => backHandler.remove();
    }, [close]);

    // Open to initial snap point if specified
    useEffect(() => {
      if (initialSnapIndex >= 0) {
        snapToIndex(initialSnapIndex);
      }
    }, []);

    const gesture = Gesture.Pan()
      .onStart(() => {
        context.value = { y: translateY.value };
      })
      .onUpdate((event) => {
        translateY.value = Math.max(
          event.translationY + context.value.y,
          MAX_TRANSLATE_Y
        );
      })
      .onEnd((event) => {
        // Determine which snap point to go to based on velocity and position
        const currentY = translateY.value;
        const velocity = event.velocityY;

        // If swiping down fast, close
        if (velocity > 500 && enablePanDownToClose) {
          snapToIndex(-1);
          runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
          return;
        }

        // If swiping up fast, go to highest snap point
        if (velocity < -500) {
          snapToIndex(snapPoints.length - 1);
          runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
          return;
        }

        // Find closest snap point
        let closestIndex = -1;
        let closestDistance = Infinity;

        snapPoints.forEach((height, index) => {
          const snapY = SCREEN_HEIGHT - height;
          const distance = Math.abs(currentY - snapY);
          if (distance < closestDistance) {
            closestDistance = distance;
            closestIndex = index;
          }
        });

        // Check if we should close (if dragged below the lowest snap point)
        const lowestSnapY = SCREEN_HEIGHT - snapPoints[0];
        if (enablePanDownToClose && currentY > lowestSnapY + 100) {
          snapToIndex(-1);
        } else {
          snapToIndex(closestIndex);
        }
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
      });

    const rBottomSheetStyle = useAnimatedStyle(() => {
      const borderRadius = interpolate(
        translateY.value,
        [MAX_TRANSLATE_Y + 50, MAX_TRANSLATE_Y],
        [BorderRadius.xxl, 0],
        Extrapolation.CLAMP
      );

      return {
        borderTopLeftRadius: borderRadius,
        borderTopRightRadius: borderRadius,
        transform: [{ translateY: translateY.value }],
      };
    });

    const rBackdropStyle = useAnimatedStyle(() => {
      const opacity = interpolate(
        translateY.value,
        [SCREEN_HEIGHT, SCREEN_HEIGHT - snapPoints[0]],
        [0, backdropOpacity],
        Extrapolation.CLAMP
      );

      return {
        opacity,
        pointerEvents: active.value ? 'auto' : 'none',
      };
    });

    return (
      <>
        {/* Backdrop */}
        <Animated.View
          style={[
            styles.backdrop,
            { backgroundColor: '#000' },
            rBackdropStyle,
          ]}
        >
          {enableBackdropDismiss && (
            <Pressable 
              style={StyleSheet.absoluteFill} 
              onPress={close}
              accessibilityRole="button"
              accessibilityLabel="Close bottom sheet"
            />
          )}
        </Animated.View>

        {/* Sheet */}
        <GestureDetector gesture={gesture}>
          <Animated.View
            style={[
              styles.container,
              {
                backgroundColor: colors.surface,
                paddingBottom: insets.bottom,
              },
              rBottomSheetStyle,
              style,
            ]}
            accessibilityViewIsModal={true}
            accessibilityRole="none"
          >
            {handleIndicator && (
              <View style={styles.handleContainer}>
                <View
                  style={[
                    styles.handle,
                    { backgroundColor: colors.border },
                  ]}
                  accessibilityLabel="Drag handle"
                  accessibilityHint="Swipe down to close"
                />
              </View>
            )}
            <View style={styles.content}>{children}</View>
          </Animated.View>
        </GestureDetector>
      </>
    );
  }
);

BottomSheet.displayName = 'BottomSheet';

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  container: {
    height: SCREEN_HEIGHT,
    width: '100%',
    position: 'absolute',
    top: SCREEN_HEIGHT,
    zIndex: 101,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 16,
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  handle: {
    width: 36,
    height: 5,
    borderRadius: 3,
  },
  content: {
    flex: 1,
  },
});

export default BottomSheet;
