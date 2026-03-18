/**
 * Declutterly -- Screen Transition Presets
 *
 * Curated transitions using react-native-screen-transitions.
 * Each preset is tuned for its specific use case in the app.
 */

import Transition from 'react-native-screen-transitions';
import { interpolate, Extrapolation } from 'react-native-reanimated';
import type { ScreenTransitionConfig } from 'react-native-screen-transitions';

// ─── Specs ──────────────────────────────────────────────────────────────────

const snappySpec = {
  stiffness: 800,
  damping: 80,
  mass: 1.5,
};

const gentleSpec = {
  stiffness: 500,
  damping: 50,
  mass: 2,
};

// ─── App-specific Transitions ───────────────────────────────────────────────

/**
 * iOS-style slide from right with parallax on the underlying screen.
 * Used for: room detail, settings, achievements, today-tasks
 */
export const SlideFromRight = (): ScreenTransitionConfig => ({
  // enableTransitions is implicit in blank-stack
  gestureEnabled: true,
  gestureDirection: 'horizontal',
  screenStyleInterpolator: ({ progress, layouts: { screen } }) => {
    'worklet';

    const translateX = interpolate(
      progress,
      [0, 1, 2],
      [screen.width, 0, -screen.width * 0.3],
    );

    const opacity = interpolate(
      progress,
      [0, 0.5, 1, 1.5, 2],
      [0.3, 1, 1, 1, 0.7],
      Extrapolation.CLAMP,
    );

    return {
      contentStyle: {
        transform: [{ translateX }],
        opacity,
      },
    };
  },
  transitionSpec: {
    open: snappySpec,
    close: snappySpec,
  },
});

/**
 * Modal-style slide from bottom with backdrop dimming.
 * Used for: camera, blitz, single-task, focus
 */
export const ModalSlideUp = (): ScreenTransitionConfig => ({
  // enableTransitions is implicit in blank-stack
  gestureEnabled: true,
  gestureDirection: 'vertical',
  screenStyleInterpolator: ({ progress, layouts: { screen } }) => {
    'worklet';

    const translateY = interpolate(
      progress,
      [0, 1],
      [screen.height, 0],
      Extrapolation.CLAMP,
    );

    const borderRadius = interpolate(
      progress,
      [0, 1],
      [40, 0],
      Extrapolation.CLAMP,
    );

    const backdropOpacity = interpolate(
      progress,
      [0, 1],
      [0, 0.5],
      Extrapolation.CLAMP,
    );

    return {
      contentStyle: {
        transform: [{ translateY }],
        borderTopLeftRadius: borderRadius,
        borderTopRightRadius: borderRadius,
        overflow: 'hidden' as const,
      },
      backdropStyle: {
        backgroundColor: `rgba(0,0,0,${backdropOpacity})`,
      },
    };
  },
  transitionSpec: {
    open: gentleSpec,
    close: gentleSpec,
  },
});

/**
 * Smooth crossfade with subtle scale.
 * Used for: splash, auth, onboarding, analysis, session-complete
 */
export const FadeScale = (): ScreenTransitionConfig => ({
  // enableTransitions is implicit in blank-stack
  gestureEnabled: false,
  screenStyleInterpolator: ({ progress }) => {
    'worklet';

    const opacity = interpolate(
      progress,
      [0, 1, 2],
      [0, 1, 0],
      Extrapolation.CLAMP,
    );

    const scale = interpolate(
      progress,
      [0, 1, 2],
      [0.94, 1, 0.94],
      Extrapolation.CLAMP,
    );

    return {
      contentStyle: {
        opacity,
        transform: [{ scale }],
      },
    };
  },
  transitionSpec: {
    open: { stiffness: 600, damping: 60, mass: 1 },
    close: { stiffness: 600, damping: 60, mass: 1 },
  },
});

/**
 * Bottom sheet with snap points and swipe-to-dismiss.
 * Used for: mascot, join, task-detail
 */
export const BottomSheet = (): ScreenTransitionConfig => ({
  ...Transition.Presets.SlideFromBottom(),
  gestureEnabled: true,
  gestureDirection: 'vertical',
  backdropBehavior: 'dismiss',
});

/**
 * Elastic draggable card - dismissible in any direction.
 * Used for: paywall, collection
 */
export const DraggableCard = (): ScreenTransitionConfig => ({
  ...Transition.Presets.ElasticCard(),
});

/**
 * Zoom in with fade - punchy entrance.
 * Used for: room-complete, celebration screens
 */
export const ZoomIn = (): ScreenTransitionConfig => ({
  ...Transition.Presets.ZoomIn(),
  gestureEnabled: false,
});
