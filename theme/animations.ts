/**
 * Declutterly - Premium Animation System
 * Comprehensive animation configurations for a polished, ADHD-friendly UI.
 * Uses react-native-reanimated 4.x layout animations + spring/timing configs.
 */

import {
  Easing,
  WithSpringConfig,
  WithTimingConfig,
  FadeIn,
  FadeOut,
  FadeInDown,
  FadeInUp,
  FadeInLeft,
  FadeInRight,
  FadeOutDown,
  FadeOutUp,
  FadeOutLeft,
  FadeOutRight,
  SlideInDown,
  SlideInUp,
  SlideInLeft,
  SlideInRight,
  SlideOutDown,
  SlideOutUp,
  SlideOutLeft,
  SlideOutRight,
  ZoomIn,
  ZoomOut,
  ZoomInEasyDown,
  ZoomInEasyUp,
  ZoomOutEasyDown,
  ZoomOutEasyUp,
  BounceIn,
  BounceOut,
  BounceInDown,
  BounceInUp,
  FlipInXDown,
  FlipOutXUp,
  StretchInX,
  StretchInY,
  StretchOutX,
  StretchOutY,
  LinearTransition,
  SequencedTransition,
  FadingTransition,
  JumpingTransition,
  CurvedTransition,
  EntryExitTransition,
} from 'react-native-reanimated';

// ============================================================================
// SPRING CONFIGURATIONS
// ============================================================================

export const SpringConfigs = {
  /** Default spring for most interactive elements */
  default: {
    damping: 12,
    mass: 0.8,
    stiffness: 180,
    overshootClamping: false,
  } as WithSpringConfig,

  /** Gentle spring for subtle, calming movements (good for ADHD - not jarring) */
  gentle: {
    damping: 20,
    mass: 1,
    stiffness: 100,
    overshootClamping: false,
  } as WithSpringConfig,

  /** Bouncy spring for playful animations - Apple-style refined bounce */
  bouncy: {
    damping: 14,
    mass: 0.8,
    stiffness: 180,
    overshootClamping: false,
  } as WithSpringConfig,

  /** Snappy spring for quick, responsive feedback */
  snappy: {
    damping: 18,
    mass: 0.8,
    stiffness: 300,
    overshootClamping: false,
  } as WithSpringConfig,

  /** Stiff spring for precise, no-nonsense animations */
  stiff: {
    damping: 20,
    mass: 1,
    stiffness: 400,
    overshootClamping: true,
  } as WithSpringConfig,

  /** Ultra-responsive for micro-interactions (haptic feedback companion) */
  micro: {
    damping: 22,
    mass: 0.5,
    stiffness: 500,
    overshootClamping: true,
  } as WithSpringConfig,

  /** Slow, dramatic spring for celebration moments */
  slow: {
    damping: 16,
    mass: 1.5,
    stiffness: 80,
    overshootClamping: false,
  } as WithSpringConfig,

  /** Card press animation */
  cardPress: {
    damping: 12,
    mass: 0.8,
    stiffness: 180,
    overshootClamping: false,
  } as WithSpringConfig,

  /** Button press animation */
  buttonPress: {
    damping: 15,
    mass: 0.7,
    stiffness: 250,
    overshootClamping: false,
  } as WithSpringConfig,

  /** Page transition spring */
  pageTransition: {
    damping: 20,
    mass: 1,
    stiffness: 200,
    overshootClamping: false,
  } as WithSpringConfig,

  /** Sheet/modal spring - smooth and weighty */
  sheet: {
    damping: 24,
    mass: 1.2,
    stiffness: 260,
    overshootClamping: false,
  } as WithSpringConfig,

  /** Elastic spring for gamified reward reveals */
  elastic: {
    damping: 8,
    mass: 0.6,
    stiffness: 200,
    overshootClamping: false,
  } as WithSpringConfig,

  /** Wobbly spring for mascot animations */
  wobbly: {
    damping: 6,
    mass: 0.5,
    stiffness: 150,
    overshootClamping: false,
  } as WithSpringConfig,
} as const;

// ============================================================================
// TIMING DURATIONS
// ============================================================================

export const Durations = {
  /** Ultra fast for micro-interactions */
  instant: 50,
  /** Fast for quick feedback */
  fast: 100,
  /** Normal for standard transitions */
  normal: 200,
  /** Medium for noticeable transitions */
  medium: 300,
  /** Slow for emphasized animations */
  slow: 400,
  /** Very slow for dramatic effects */
  verySlow: 600,
  /** Extra slow for cinematic moments */
  cinematic: 800,
  /** Skeleton shimmer duration */
  shimmer: 1500,
  /** Glow pulse duration */
  glowPulse: 1200,
  /** Toast display duration */
  toast: 3000,
  /** Modal entrance/exit */
  modal: 300,
  /** List item stagger base */
  stagger: 50,
  /** Page fade */
  pageFade: 400,
  /** Celebration animation */
  celebration: 1000,
  /** Progress bar fill */
  progressFill: 600,
  /** Confetti duration */
  confetti: 2000,
} as const;

// ============================================================================
// ANIMATION DELAYS
// ============================================================================

export const Delays = {
  none: 0,
  tiny: 50,
  small: 100,
  medium: 200,
  large: 300,
  extraLarge: 500,
  /** Calculate stagger delay based on index */
  stagger: (index: number, baseDelay: number = 50) => index * baseDelay,
  /** Calculate stagger with max cap (prevents long waits for large lists) */
  staggerCapped: (index: number, baseDelay: number = 50, maxDelay: number = 400) =>
    Math.min(index * baseDelay, maxDelay),
} as const;

// ============================================================================
// EASING FUNCTIONS
// ============================================================================

export const Easings = {
  /** Standard ease in-out for most animations */
  default: Easing.inOut(Easing.ease),
  /** Ease out for entrance animations (decelerating) */
  easeOut: Easing.out(Easing.ease),
  /** Ease in for exit animations (accelerating) */
  easeIn: Easing.in(Easing.ease),
  /** Linear for constant speed */
  linear: Easing.linear,
  /** Cubic for smooth acceleration */
  cubic: Easing.inOut(Easing.cubic),
  /** Smooth bezier - iOS-style */
  smooth: Easing.bezier(0.25, 0.1, 0.25, 1),
  /** Bounce effect */
  bounce: Easing.bounce,
  /** Back easing for overshoot effect */
  back: Easing.back(1.5),
  /** Emphasized ease-out for premium feel */
  emphasizedDecelerate: Easing.bezier(0.05, 0.7, 0.1, 1.0),
  /** Emphasized ease-in for exits */
  emphasizedAccelerate: Easing.bezier(0.3, 0.0, 0.8, 0.15),
  /** Material 3 standard easing */
  standard: Easing.bezier(0.2, 0.0, 0.0, 1.0),
  /** Apple-style spring-like easing */
  appleSpring: Easing.bezier(0.22, 1, 0.36, 1),
} as const;

// ============================================================================
// TIMING CONFIGURATIONS
// ============================================================================

export const TimingConfigs = {
  /** Fast fade for quick state changes */
  fastFade: {
    duration: Durations.fast,
    easing: Easings.easeOut,
  } as WithTimingConfig,

  /** Normal transition */
  normal: {
    duration: Durations.normal,
    easing: Easings.default,
  } as WithTimingConfig,

  /** Medium transition */
  medium: {
    duration: Durations.medium,
    easing: Easings.default,
  } as WithTimingConfig,

  /** Slow emphasis */
  slowEmphasis: {
    duration: Durations.slow,
    easing: Easings.default,
  } as WithTimingConfig,

  /** Shimmer animation */
  shimmer: {
    duration: Durations.shimmer,
    easing: Easings.linear,
  } as WithTimingConfig,

  /** Glow pulse */
  glowPulse: {
    duration: Durations.glowPulse,
    easing: Easings.default,
  } as WithTimingConfig,

  /** Press feedback */
  pressFeedback: {
    duration: Durations.fast,
    easing: Easings.easeOut,
  } as WithTimingConfig,

  /** Modal transition */
  modal: {
    duration: Durations.modal,
    easing: Easings.cubic,
  } as WithTimingConfig,

  /** Premium entrance (iOS-like deceleration) */
  entrance: {
    duration: Durations.slow,
    easing: Easings.emphasizedDecelerate,
  } as WithTimingConfig,

  /** Premium exit (accelerating out) */
  exit: {
    duration: Durations.medium,
    easing: Easings.emphasizedAccelerate,
  } as WithTimingConfig,

  /** Progress bar fill */
  progressFill: {
    duration: Durations.progressFill,
    easing: Easings.appleSpring,
  } as WithTimingConfig,

  /** Celebration build-up */
  celebration: {
    duration: Durations.celebration,
    easing: Easings.emphasizedDecelerate,
  } as WithTimingConfig,
} as const;

// ============================================================================
// SCALE / OPACITY / TRANSFORM VALUES
// ============================================================================

export const ScaleValues = {
  cardPress: 0.97,
  buttonPress: 0.95,
  iconPress: 0.9,
  subtlePress: 0.98,
  bounceUp: 1.05,
  /** Scale for reward pop */
  rewardPop: 1.2,
  /** Scale for badge unlock */
  badgeUnlock: 1.3,
  /** Micro pulse scale */
  pulse: 1.02,
} as const;

export const OpacityValues = {
  visible: 1,
  pressed: 0.7,
  disabled: 0.5,
  hidden: 0,
  semiTransparent: 0.8,
  glowMin: 0.3,
  glowMax: 0.6,
  /** Overlay backdrop */
  backdrop: 0.4,
  /** Ghost/skeleton */
  skeleton: 0.15,
} as const;

export const TransformValues = {
  slideDistance: 100,
  lift: -4,
  fullRotation: 360,
  /** Subtle card tilt for 3D effect (degrees) */
  cardTilt: 2,
  /** Sheet peek distance */
  sheetPeek: 60,
  /** Tab bar bounce offset */
  tabBounce: -8,
} as const;

// ============================================================================
// ENTERING ANIMATIONS (Reanimated Layout Animations)
// ============================================================================

/**
 * Premium entering animations with sensible defaults.
 * Usage: <Animated.View entering={EnteringAnimations.fadeInUp()} />
 * All functions accept an optional delay parameter for staggering.
 */
export const EnteringAnimations = {
  // --- Fades ---
  fadeIn: (delay = 0) =>
    FadeIn.duration(Durations.medium).delay(delay),

  fadeInUp: (delay = 0) =>
    FadeInUp.duration(Durations.slow).delay(delay).easing(Easings.emphasizedDecelerate),

  fadeInDown: (delay = 0) =>
    FadeInDown.duration(Durations.slow).delay(delay).easing(Easings.emphasizedDecelerate),

  fadeInLeft: (delay = 0) =>
    FadeInLeft.duration(Durations.slow).delay(delay).easing(Easings.emphasizedDecelerate),

  fadeInRight: (delay = 0) =>
    FadeInRight.duration(Durations.slow).delay(delay).easing(Easings.emphasizedDecelerate),

  // --- Slides ---
  slideInUp: (delay = 0) =>
    SlideInDown.duration(Durations.slow).delay(delay).easing(Easings.emphasizedDecelerate),

  slideInDown: (delay = 0) =>
    SlideInUp.duration(Durations.slow).delay(delay).easing(Easings.emphasizedDecelerate),

  slideInLeft: (delay = 0) =>
    SlideInLeft.duration(Durations.slow).delay(delay).easing(Easings.emphasizedDecelerate),

  slideInRight: (delay = 0) =>
    SlideInRight.duration(Durations.slow).delay(delay).easing(Easings.emphasizedDecelerate),

  // --- Zooms ---
  zoomIn: (delay = 0) =>
    ZoomIn.duration(Durations.medium).delay(delay).easing(Easings.appleSpring),

  zoomInEasyDown: (delay = 0) =>
    ZoomInEasyDown.duration(Durations.slow).delay(delay),

  zoomInEasyUp: (delay = 0) =>
    ZoomInEasyUp.duration(Durations.slow).delay(delay),

  // --- Bounces (great for gamification / ADHD dopamine hits) ---
  bounceIn: (delay = 0) =>
    BounceIn.duration(Durations.verySlow).delay(delay),

  bounceInDown: (delay = 0) =>
    BounceInDown.duration(Durations.verySlow).delay(delay),

  bounceInUp: (delay = 0) =>
    BounceInUp.duration(Durations.verySlow).delay(delay),

  // --- Flips ---
  flipInX: (delay = 0) =>
    FlipInXDown.duration(Durations.verySlow).delay(delay),

  // --- Stretches ---
  stretchInX: (delay = 0) =>
    StretchInX.duration(Durations.medium).delay(delay),

  stretchInY: (delay = 0) =>
    StretchInY.duration(Durations.medium).delay(delay),

  // --- Springy entrance (for cards, list items) ---
  springIn: (delay = 0) =>
    FadeInUp
      .springify()
      .damping(14)
      .mass(0.8)
      .stiffness(180)
      .delay(delay),

  /** Premium card entrance - subtle slide up with fade */
  cardEntrance: (delay = 0) =>
    FadeInUp
      .duration(Durations.slow)
      .delay(delay)
      .easing(Easings.emphasizedDecelerate)
      .withInitialValues({ transform: [{ translateY: 24 }], opacity: 0 }),

  /** Reward/badge pop - bouncy zoom with spring */
  rewardPop: (delay = 0) =>
    ZoomIn
      .springify()
      .damping(8)
      .mass(0.6)
      .stiffness(200)
      .delay(delay),

  /** Tab content swap */
  tabSwap: (delay = 0) =>
    FadeIn.duration(Durations.normal).delay(delay).easing(Easings.easeOut),
} as const;

// ============================================================================
// EXITING ANIMATIONS
// ============================================================================

export const ExitingAnimations = {
  // --- Fades ---
  fadeOut: (delay = 0) =>
    FadeOut.duration(Durations.normal).delay(delay),

  fadeOutUp: (delay = 0) =>
    FadeOutUp.duration(Durations.medium).delay(delay).easing(Easings.emphasizedAccelerate),

  fadeOutDown: (delay = 0) =>
    FadeOutDown.duration(Durations.medium).delay(delay).easing(Easings.emphasizedAccelerate),

  fadeOutLeft: (delay = 0) =>
    FadeOutLeft.duration(Durations.medium).delay(delay).easing(Easings.emphasizedAccelerate),

  fadeOutRight: (delay = 0) =>
    FadeOutRight.duration(Durations.medium).delay(delay).easing(Easings.emphasizedAccelerate),

  // --- Slides ---
  slideOutUp: (delay = 0) =>
    SlideOutUp.duration(Durations.medium).delay(delay).easing(Easings.emphasizedAccelerate),

  slideOutDown: (delay = 0) =>
    SlideOutDown.duration(Durations.medium).delay(delay).easing(Easings.emphasizedAccelerate),

  slideOutLeft: (delay = 0) =>
    SlideOutLeft.duration(Durations.medium).delay(delay).easing(Easings.emphasizedAccelerate),

  slideOutRight: (delay = 0) =>
    SlideOutRight.duration(Durations.medium).delay(delay).easing(Easings.emphasizedAccelerate),

  // --- Zooms ---
  zoomOut: (delay = 0) =>
    ZoomOut.duration(Durations.normal).delay(delay),

  zoomOutEasyDown: (delay = 0) =>
    ZoomOutEasyDown.duration(Durations.medium).delay(delay),

  zoomOutEasyUp: (delay = 0) =>
    ZoomOutEasyUp.duration(Durations.medium).delay(delay),

  // --- Bounces ---
  bounceOut: (delay = 0) =>
    BounceOut.duration(Durations.slow).delay(delay),

  // --- Flips ---
  flipOutX: (delay = 0) =>
    FlipOutXUp.duration(Durations.slow).delay(delay),

  // --- Stretches ---
  stretchOutX: (delay = 0) =>
    StretchOutX.duration(Durations.normal).delay(delay),

  stretchOutY: (delay = 0) =>
    StretchOutY.duration(Durations.normal).delay(delay),

  // --- Springy exit ---
  springOut: (delay = 0) =>
    FadeOutDown
      .springify()
      .damping(18)
      .mass(0.8)
      .stiffness(200)
      .delay(delay),

  /** Task completion - satisfying swipe away */
  taskComplete: (delay = 0) =>
    FadeOutRight
      .duration(Durations.medium)
      .delay(delay)
      .easing(Easings.emphasizedAccelerate),

  /** Dismiss - quick slide down and fade */
  dismiss: (delay = 0) =>
    FadeOutDown
      .duration(Durations.normal)
      .delay(delay)
      .easing(Easings.easeIn),
} as const;

// ============================================================================
// LAYOUT TRANSITIONS (for when items reorder, resize, etc.)
// ============================================================================

export const LayoutTransitions = {
  /** Default smooth layout change */
  default: LinearTransition
    .springify()
    .damping(16)
    .mass(0.8)
    .stiffness(200),

  /** Sequenced transition for list reordering */
  sequenced: SequencedTransition.duration(Durations.medium),

  /** Fade-based transition for content swaps */
  fading: FadingTransition.duration(Durations.medium),

  /** Playful jumping transition */
  jumping: JumpingTransition.duration(Durations.medium),

  /** Curved path transition */
  curved: CurvedTransition.duration(Durations.medium),

  /** Custom entry/exit pair for layout changes */
  entryExit: EntryExitTransition
    .entering(FadeInUp.duration(Durations.medium).easing(Easings.emphasizedDecelerate))
    .exiting(FadeOutDown.duration(Durations.normal).easing(Easings.emphasizedAccelerate)),

  /** Snappy layout reorder for task lists */
  taskList: LinearTransition
    .springify()
    .damping(20)
    .mass(0.7)
    .stiffness(280),
} as const;

// ============================================================================
// STAGGER HELPERS
// ============================================================================

/**
 * Creates staggered entering animations for list items.
 * Usage:
 *   <Animated.View
 *     entering={staggeredEntrance(index)}
 *     key={item.id}
 *   />
 */
export const staggeredEntrance = (
  index: number,
  baseDelay: number = Durations.stagger,
  maxDelay: number = 500,
) =>
  FadeInUp
    .duration(Durations.slow)
    .delay(Math.min(index * baseDelay, maxDelay))
    .easing(Easings.emphasizedDecelerate);

/**
 * Creates staggered spring entrance (more playful).
 */
export const staggeredSpringEntrance = (
  index: number,
  baseDelay: number = 60,
  maxDelay: number = 500,
) =>
  FadeInUp
    .springify()
    .damping(14)
    .mass(0.8)
    .stiffness(180)
    .delay(Math.min(index * baseDelay, maxDelay));

/**
 * Creates staggered bounce entrance (for achievements, rewards).
 */
export const staggeredBounceEntrance = (
  index: number,
  baseDelay: number = 80,
  maxDelay: number = 600,
) =>
  BounceIn
    .duration(Durations.verySlow)
    .delay(Math.min(index * baseDelay, maxDelay));

/**
 * Creates staggered zoom entrance (for grid items).
 */
export const staggeredZoomEntrance = (
  index: number,
  baseDelay: number = 50,
  maxDelay: number = 400,
) =>
  ZoomIn
    .duration(Durations.medium)
    .delay(Math.min(index * baseDelay, maxDelay))
    .easing(Easings.appleSpring);

/**
 * Creates staggered exit animations.
 */
export const staggeredExit = (
  index: number,
  baseDelay: number = 30,
  maxDelay: number = 300,
) =>
  FadeOutDown
    .duration(Durations.normal)
    .delay(Math.min(index * baseDelay, maxDelay))
    .easing(Easings.emphasizedAccelerate);

/**
 * Creates staggered slide-in from left (for menu items, settings rows).
 */
export const staggeredSlideInLeft = (
  index: number,
  baseDelay: number = 40,
  maxDelay: number = 400,
) =>
  FadeInLeft
    .duration(Durations.medium)
    .delay(Math.min(index * baseDelay, maxDelay))
    .easing(Easings.emphasizedDecelerate);

// ============================================================================
// MOTI PRESET CONFIGS (for use with <MotiView />)
// ============================================================================

/**
 * Moti animation presets for declarative animations.
 * Usage: <MotiView {...MotiPresets.fadeInUp} />
 */
export const MotiPresets = {
  fadeInUp: {
    from: { opacity: 0, translateY: 20 },
    animate: { opacity: 1, translateY: 0 },
    transition: {
      type: 'timing' as const,
      duration: Durations.slow,
    },
  },

  fadeInDown: {
    from: { opacity: 0, translateY: -20 },
    animate: { opacity: 1, translateY: 0 },
    transition: {
      type: 'timing' as const,
      duration: Durations.slow,
    },
  },

  fadeInScale: {
    from: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    transition: {
      type: 'spring' as const,
      damping: 14,
      stiffness: 180,
    },
  },

  popIn: {
    from: { opacity: 0, scale: 0.5 },
    animate: { opacity: 1, scale: 1 },
    transition: {
      type: 'spring' as const,
      damping: 10,
      stiffness: 200,
    },
  },

  slideInLeft: {
    from: { opacity: 0, translateX: -30 },
    animate: { opacity: 1, translateX: 0 },
    transition: {
      type: 'timing' as const,
      duration: Durations.medium,
    },
  },

  slideInRight: {
    from: { opacity: 0, translateX: 30 },
    animate: { opacity: 1, translateX: 0 },
    transition: {
      type: 'timing' as const,
      duration: Durations.medium,
    },
  },

  pulse: {
    from: { scale: 1 },
    animate: { scale: 1.05 },
    transition: {
      type: 'timing' as const,
      duration: Durations.verySlow,
      loop: true,
    },
  },

  breathe: {
    from: { scale: 1, opacity: 0.7 },
    animate: { scale: 1.02, opacity: 1 },
    transition: {
      type: 'timing' as const,
      duration: 1500,
      loop: true,
    },
  },

  shimmer: {
    from: { opacity: 0.3 },
    animate: { opacity: 0.7 },
    transition: {
      type: 'timing' as const,
      duration: Durations.shimmer,
      loop: true,
    },
  },
} as const;

// ============================================================================
// SKIA ANIMATION CONFIGS (companion values for Skia canvas animations)
// ============================================================================

export const SkiaAnimationConfigs = {
  /** Mesh gradient animation speed (radians per second) */
  meshGradientSpeed: 0.5,
  /** Blur radius range for glassmorphism */
  glassBlur: { min: 8, max: 20 },
  /** Glow radius for neon effects */
  glowRadius: { min: 4, max: 12 },
  /** Particle system speed */
  particleSpeed: { min: 0.5, max: 2.0 },
  /** Background gradient rotation speed (degrees per second) */
  gradientRotationSpeed: 30,
} as const;

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
  SpringConfigs,
  Durations,
  Delays,
  Easings,
  TimingConfigs,
  ScaleValues,
  OpacityValues,
  TransformValues,
  EnteringAnimations,
  ExitingAnimations,
  LayoutTransitions,
  MotiPresets,
  SkiaAnimationConfigs,
  staggeredEntrance,
  staggeredSpringEntrance,
  staggeredBounceEntrance,
  staggeredZoomEntrance,
  staggeredExit,
  staggeredSlideInLeft,
};
