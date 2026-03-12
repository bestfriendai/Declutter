/**
 * Declutterly - Animation Constants
 * Standardized animation configurations for consistent motion throughout the app
 */

import { Easing, WithSpringConfig, WithTimingConfig } from 'react-native-reanimated';

// Spring configurations for different interaction types
export const SpringConfigs = {
  // Default spring for most interactive elements
  default: {
    damping: 12,
    mass: 0.8,
    stiffness: 180,
    overshootClamping: false,
  } as WithSpringConfig,

  // Gentle spring for subtle movements
  gentle: {
    damping: 20,
    mass: 1,
    stiffness: 100,
    overshootClamping: false,
  } as WithSpringConfig,

  // Bouncy spring for playful animations (damping 14 for Apple-style refined bounce)
  bouncy: {
    damping: 14,
    mass: 0.8,
    stiffness: 180,
    overshootClamping: false,
  } as WithSpringConfig,

  // Snappy spring for quick, responsive feedback
  snappy: {
    damping: 18,
    mass: 0.8,
    stiffness: 300,
    overshootClamping: false,
  } as WithSpringConfig,

  // Stiff spring for precise animations
  stiff: {
    damping: 20,
    mass: 1,
    stiffness: 400,
    overshootClamping: true,
  } as WithSpringConfig,

  // Card press animation
  cardPress: {
    damping: 12,
    mass: 0.8,
    stiffness: 180,
    overshootClamping: false,
  } as WithSpringConfig,

  // Button press animation
  buttonPress: {
    damping: 15,
    mass: 0.7,
    stiffness: 250,
    overshootClamping: false,
  } as WithSpringConfig,

  // Page transition spring
  pageTransition: {
    damping: 20,
    mass: 1,
    stiffness: 200,
    overshootClamping: false,
  } as WithSpringConfig,
};

// Timing durations in milliseconds
export const Durations = {
  // Ultra fast for micro-interactions
  instant: 50,

  // Fast for quick feedback
  fast: 100,

  // Normal for standard transitions
  normal: 200,

  // Medium for noticeable transitions
  medium: 300,

  // Slow for emphasized animations
  slow: 400,

  // Very slow for dramatic effects
  verySlow: 600,

  // Skeleton shimmer duration
  shimmer: 1500,

  // Glow pulse duration
  glowPulse: 1200,

  // Toast display duration
  toast: 3000,

  // Modal entrance/exit
  modal: 300,

  // List item stagger
  stagger: 50,

  // Page fade
  pageFade: 400,
};

// Animation delays
export const Delays = {
  // No delay
  none: 0,

  // Tiny delay for stagger effects
  tiny: 50,

  // Small delay
  small: 100,

  // Medium delay
  medium: 200,

  // Large delay
  large: 300,

  // Extra large delay
  extraLarge: 500,

  // Calculate stagger delay based on index
  stagger: (index: number, baseDelay: number = 50) => index * baseDelay,
};

// Common easing functions
export const Easings = {
  // Standard ease in-out for most animations
  default: Easing.inOut(Easing.ease),

  // Ease out for entrance animations
  easeOut: Easing.out(Easing.ease),

  // Ease in for exit animations
  easeIn: Easing.in(Easing.ease),

  // Linear for constant speed
  linear: Easing.linear,

  // Cubic for smooth acceleration
  cubic: Easing.inOut(Easing.cubic),

  // Bezier for custom curves
  smooth: Easing.bezier(0.25, 0.1, 0.25, 1),

  // Bounce effect
  bounce: Easing.bounce,

  // Back easing for overshoot effect
  back: Easing.back(1.5),
};

// Timing configurations
export const TimingConfigs = {
  // Fast fade
  fastFade: {
    duration: Durations.fast,
    easing: Easings.easeOut,
  } as WithTimingConfig,

  // Normal transition
  normal: {
    duration: Durations.normal,
    easing: Easings.default,
  } as WithTimingConfig,

  // Slow emphasis
  slowEmphasis: {
    duration: Durations.slow,
    easing: Easings.default,
  } as WithTimingConfig,

  // Shimmer animation
  shimmer: {
    duration: Durations.shimmer,
    easing: Easings.linear,
  } as WithTimingConfig,

  // Glow pulse
  glowPulse: {
    duration: Durations.glowPulse,
    easing: Easings.default,
  } as WithTimingConfig,

  // Press feedback
  pressFeedback: {
    duration: Durations.fast,
    easing: Easings.easeOut,
  } as WithTimingConfig,

  // Modal transition
  modal: {
    duration: Durations.modal,
    easing: Easings.cubic,
  } as WithTimingConfig,
};

// Scale values for press animations
export const ScaleValues = {
  // Card press scale
  cardPress: 0.97,

  // Button press scale
  buttonPress: 0.95,

  // Icon press scale
  iconPress: 0.9,

  // Subtle press scale
  subtlePress: 0.98,

  // Bounce scale (for overshoot)
  bounceUp: 1.05,
};

// Opacity values
export const OpacityValues = {
  // Fully visible
  visible: 1,

  // Pressed state
  pressed: 0.7,

  // Disabled state
  disabled: 0.5,

  // Hidden
  hidden: 0,

  // Semi-transparent
  semiTransparent: 0.8,

  // Glow minimum
  glowMin: 0.3,

  // Glow maximum
  glowMax: 0.6,
};

// Transform values
export const TransformValues = {
  // Slide distance for modals/sheets
  slideDistance: 100,

  // Slight lift for hover effects
  lift: -4,

  // Rotation for loading spinners (degrees)
  fullRotation: 360,
};

export default {
  SpringConfigs,
  Durations,
  Delays,
  Easings,
  TimingConfigs,
  ScaleValues,
  OpacityValues,
  TransformValues,
};
