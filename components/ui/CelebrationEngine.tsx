/**
 * CelebrationEngine — The delight layer for Declutterly
 *
 * Context-based celebration system that provides haptic + visual feedback
 * for task completions, streaks, level ups, and milestones.
 *
 * Usage:
 *   1. Wrap your app with <CelebrationProvider>
 *   2. Call useCelebration() from any component to trigger celebrations
 */

import { useColorScheme } from '@/hooks/useColorScheme';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { Typography } from '@/theme/typography';
import * as Haptics from 'expo-haptics';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CelebrationType =
  | { kind: 'taskComplete'; xpEarned: number }
  | { kind: 'streakMilestone'; streak: number }
  | { kind: 'roomComplete'; roomName: string }
  | { kind: 'levelUp'; newLevel: number }
  | { kind: 'dailyGoal' }
  | { kind: 'xpPopup'; amount: number; label?: string };

interface CelebrationAPI {
  celebrateTaskComplete: (xpEarned: number) => void;
  celebrateStreakMilestone: (streak: number) => void;
  celebrateRoomComplete: (roomName: string) => void;
  celebrateLevelUp: (newLevel: number) => void;
  celebrateDailyGoal: () => void;
  showXPPopup: (amount: number, label?: string) => void;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const CelebrationContext = createContext<CelebrationAPI | null>(null);

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const CONFETTI_COLORS = [
  '#FF6B6B', '#4ECDC4', '#FFE66D', '#A78BFA',
  '#6366F1', '#34D399', '#F472B6', '#FB923C',
  '#FF375F', '#0A84FF', '#30D158', '#FFD60A',
];

// ---------------------------------------------------------------------------
// Confetti Particle (pure Reanimated — no Skia dependency for fallback)
// ---------------------------------------------------------------------------

interface ConfettiParticle {
  id: number;
  startX: number;
  startY: number;
  color: string;
  size: number;
  angle: number;      // radians, launch direction
  velocity: number;    // initial velocity
  rotationSpeed: number;
  delay: number;
}

function generateParticles(count: number): ConfettiParticle[] {
  const particles: ConfettiParticle[] = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      id: i,
      startX: SCREEN_WIDTH * 0.3 + Math.random() * SCREEN_WIDTH * 0.4,
      startY: SCREEN_HEIGHT * 0.35,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size: 6 + Math.random() * 8,
      angle: -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.8,
      velocity: 400 + Math.random() * 500,
      rotationSpeed: 360 + Math.random() * 720,
      delay: Math.random() * 200,
    });
  }
  return particles;
}

function ConfettiPiece({ p, duration }: { p: ConfettiParticle; duration: number }) {
  const progress = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    progress.value = withDelay(
      p.delay,
      withTiming(1, { duration: duration - p.delay, easing: Easing.out(Easing.quad) }),
    );
    opacity.value = withDelay(
      duration - 400,
      withTiming(0, { duration: 400 }),
    );
  }, []);

  const style = useAnimatedStyle(() => {
    const t = progress.value;
    const time = t * (duration - p.delay) / 1000; // seconds
    const gravity = 800;
    const vx = Math.cos(p.angle) * p.velocity;
    const vy = Math.sin(p.angle) * p.velocity;
    const x = p.startX + vx * time;
    const y = p.startY + vy * time + 0.5 * gravity * time * time;
    const rotation = p.rotationSpeed * time;

    return {
      transform: [
        { translateX: x },
        { translateY: y },
        { rotate: `${rotation}deg` },
      ],
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: 0,
          top: 0,
          width: p.size,
          height: p.size * 0.6,
          borderRadius: p.size * 0.15,
          backgroundColor: p.color,
        },
        style,
      ]}
    />
  );
}

function ConfettiBurst({ count = 60, duration = 2500 }: { count?: number; duration?: number }) {
  const particles = useMemo(() => generateParticles(count), [count]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((p) => (
        <ConfettiPiece key={p.id} p={p} duration={duration} />
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// XP Float Overlay
// ---------------------------------------------------------------------------

function XPFloat({
  amount,
  label,
  onDone,
}: {
  amount: number;
  label?: string;
  onDone: () => void;
}) {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(0.5);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    scale.value = withSpring(1, { damping: 10, stiffness: 250 });
    translateY.value = withTiming(-80, { duration: 1000, easing: Easing.out(Easing.quad) });
    opacity.value = withDelay(800, withTiming(0, { duration: 400 }));

    const timer = setTimeout(onDone, 1200);
    return () => clearTimeout(timer);
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.xpFloatContainer, style]} pointerEvents="none">
      <Animated.Text
        style={[
          styles.xpFloatText,
          {
            color: isDark ? '#30D158' : '#34C759',
            textShadowColor: isDark ? 'rgba(48,209,88,0.6)' : 'rgba(52,199,89,0.5)',
          },
        ]}
      >
        +{amount} XP
      </Animated.Text>
      {label ? (
        <Animated.Text
          style={[
            styles.xpFloatLabel,
            { color: isDark ? '#EBEBF599' : '#3C3C4399' },
          ]}
        >
          {label}
        </Animated.Text>
      ) : null}
    </Animated.View>
  );
}

function ReducedMotionOverlay({
  text,
  onDone,
}: {
  text: string;
  onDone: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onDone, 900);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <Animated.View
      entering={FadeIn.duration(100)}
      exiting={FadeOut.duration(100)}
      style={styles.reducedMotionOverlay}
      pointerEvents="none"
    >
      <Animated.Text style={styles.reducedMotionText}>{text}</Animated.Text>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Task Complete Overlay — checkmark pulse + XP
// ---------------------------------------------------------------------------

function TaskCompleteOverlay({
  xpEarned,
  onDone,
}: {
  xpEarned: number;
  onDone: () => void;
}) {
  const checkScale = useSharedValue(0);
  const checkOpacity = useSharedValue(0);

  useEffect(() => {
    checkScale.value = withSequence(
      withSpring(1.3, { damping: 6, stiffness: 300 }),
      withSpring(1, { damping: 10, stiffness: 200 }),
    );
    checkOpacity.value = withSequence(
      withTiming(1, { duration: 100 }),
      withDelay(500, withTiming(0, { duration: 200 })),
    );

    const timer = setTimeout(onDone, 800);
    return () => clearTimeout(timer);
  }, []);

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
    opacity: checkOpacity.value,
  }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Green checkmark pulse */}
      <Animated.View style={[styles.checkContainer, checkStyle]}>
        <Animated.Text style={styles.checkText}>{'\u2705'}</Animated.Text>
      </Animated.View>
      {/* XP float */}
      <XPFloat amount={xpEarned} onDone={() => {}} />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Streak Milestone Overlay
// ---------------------------------------------------------------------------

function StreakOverlay({ streak, onDone }: { streak: number; onDone: () => void }) {
  const textScale = useSharedValue(0.3);
  const textOpacity = useSharedValue(0);
  const glowOpacity = useSharedValue(0);

  useEffect(() => {
    glowOpacity.value = withSequence(
      withTiming(0.4, { duration: 400 }),
      withDelay(1500, withTiming(0, { duration: 600 })),
    );
    textScale.value = withSpring(1, { damping: 8, stiffness: 180 });
    textOpacity.value = withSequence(
      withTiming(1, { duration: 200 }),
      withDelay(1800, withTiming(0, { duration: 500 })),
    );

    const timer = setTimeout(onDone, 2500);
    return () => clearTimeout(timer);
  }, []);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const textStyle = useAnimatedStyle(() => ({
    transform: [{ scale: textScale.value }],
    opacity: textOpacity.value,
  }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Warm amber glow */}
      <Animated.View style={[styles.fullScreenGlow, styles.warmGlow, glowStyle]} />
      {/* Confetti */}
      <ConfettiBurst count={50} duration={2500} />
      {/* Streak text */}
      <Animated.View style={[styles.centerTextContainer, textStyle]}>
        <Animated.Text style={styles.streakEmoji}>{'\uD83D\uDD25'}</Animated.Text>
        <Animated.Text style={styles.streakNumber}>{streak}</Animated.Text>
        <Animated.Text style={styles.streakLabel}>Day Streak!</Animated.Text>
      </Animated.View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Room Complete Overlay
// ---------------------------------------------------------------------------

function RoomCompleteOverlay({ roomName, onDone }: { roomName: string; onDone: () => void }) {
  const bannerY = useSharedValue(-100);
  const bannerOpacity = useSharedValue(0);
  const sparkleOpacity = useSharedValue(0);

  useEffect(() => {
    // Banner slides down
    bannerY.value = withSpring(0, { damping: 12, stiffness: 150 });
    bannerOpacity.value = withTiming(1, { duration: 300 });

    // Sparkle effects
    sparkleOpacity.value = withSequence(
      withDelay(300, withTiming(1, { duration: 200 })),
      withDelay(2000, withTiming(0, { duration: 500 })),
    );

    // Banner slides away
    bannerY.value = withDelay(
      2200,
      withTiming(-100, { duration: 400, easing: Easing.in(Easing.quad) }),
    );
    bannerOpacity.value = withDelay(2200, withTiming(0, { duration: 400 }));

    const timer = setTimeout(onDone, 3000);
    return () => clearTimeout(timer);
  }, []);

  const bannerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bannerY.value }],
    opacity: bannerOpacity.value,
  }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Confetti */}
      <ConfettiBurst count={70} duration={3000} />

      {/* "Room Complete!" banner */}
      <Animated.View style={[styles.bannerContainer, bannerStyle]}>
        <Animated.Text style={styles.bannerEmoji}>{'\u2728'}</Animated.Text>
        <Animated.Text style={styles.bannerTitle}>Room Complete!</Animated.Text>
        <Animated.Text style={styles.bannerSubtitle}>{roomName}</Animated.Text>
      </Animated.View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Level Up Overlay
// ---------------------------------------------------------------------------

function LevelUpOverlay({ newLevel, onDone }: { newLevel: number; onDone: () => void }) {
  const glowOpacity = useSharedValue(0);
  const textScale = useSharedValue(0.2);
  const textOpacity = useSharedValue(0);
  const levelScale = useSharedValue(0);
  const levelOpacity = useSharedValue(0);

  useEffect(() => {
    // Golden glow pulse
    glowOpacity.value = withSequence(
      withTiming(0.5, { duration: 400 }),
      withTiming(0.3, { duration: 300 }),
      withTiming(0.5, { duration: 300 }),
      withDelay(1200, withTiming(0, { duration: 800 })),
    );

    // "LEVEL UP!" text
    textScale.value = withSpring(1, { damping: 6, stiffness: 200 });
    textOpacity.value = withSequence(
      withTiming(1, { duration: 200 }),
      withDelay(2200, withTiming(0, { duration: 600 })),
    );

    // Level number reveal
    levelScale.value = withDelay(
      500,
      withSpring(1, { damping: 8, stiffness: 180 }),
    );
    levelOpacity.value = withDelay(
      500,
      withSequence(
        withTiming(1, { duration: 200 }),
        withDelay(1800, withTiming(0, { duration: 500 })),
      ),
    );

    const timer = setTimeout(onDone, 3000);
    return () => clearTimeout(timer);
  }, []);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const textStyle = useAnimatedStyle(() => ({
    transform: [{ scale: textScale.value }],
    opacity: textOpacity.value,
  }));

  const levelStyle = useAnimatedStyle(() => ({
    transform: [{ scale: levelScale.value }],
    opacity: levelOpacity.value,
  }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Golden glow */}
      <Animated.View style={[styles.fullScreenGlow, styles.goldenGlow, glowStyle]} />
      {/* Confetti */}
      <ConfettiBurst count={80} duration={3000} />
      {/* Text */}
      <View style={styles.centerTextContainer}>
        <Animated.Text style={[styles.levelUpTitle, textStyle]}>LEVEL UP!</Animated.Text>
        <Animated.View style={[styles.levelCircle, levelStyle]}>
          <Animated.Text style={styles.levelNumber}>{newLevel}</Animated.Text>
        </Animated.View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Daily Goal Overlay — activity ring closing
// ---------------------------------------------------------------------------

function DailyGoalOverlay({ onDone }: { onDone: () => void }) {
  const ringProgress = useSharedValue(0);
  const ringOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const textScale = useSharedValue(0.5);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    // Ring draws in
    ringOpacity.value = withTiming(1, { duration: 200 });
    ringProgress.value = withTiming(1, {
      duration: 1200,
      easing: Easing.out(Easing.cubic),
    });

    // Text appears after ring completes
    textOpacity.value = withDelay(
      1200,
      withSequence(
        withTiming(1, { duration: 200 }),
        withDelay(800, withTiming(0, { duration: 300 })),
      ),
    );
    textScale.value = withDelay(1200, withSpring(1, { damping: 8, stiffness: 200 }));

    const timer = setTimeout(onDone, 2500);
    return () => clearTimeout(timer);
  }, []);

  const ringStyle = useAnimatedStyle(() => {
    // Simple circular progress representation using a rotating half-circle
    // We show the ring closing via a border width and rotation trick
    const deg = ringProgress.value * 360;
    return {
      opacity: ringOpacity.value,
      transform: [{ rotate: `${deg}deg` }],
    };
  });

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ scale: textScale.value }],
  }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Activity ring animation */}
      <View style={styles.ringCenter}>
        <View style={[styles.ringTrack, { borderColor: isDark ? '#1C1C1E' : '#E5E5EA' }]}>
          <Animated.View
            style={[
              styles.ringFill,
              {
                borderColor: '#30D158',
                borderTopColor: 'transparent',
              },
              ringStyle,
            ]}
          />
        </View>
        {/* Checkmark in center */}
        <Animated.Text style={[styles.ringCheckmark, textStyle]}>{'\u2705'}</Animated.Text>
      </View>

      {/* Confetti after ring closes */}
      <ConfettiBurst count={50} duration={2500} />

      {/* "Daily Goal Complete!" text */}
      <Animated.View style={[styles.dailyGoalTextContainer, textStyle]}>
        <Animated.Text
          style={[
            styles.dailyGoalText,
            { color: isDark ? '#FFFFFF' : '#000000' },
          ]}
        >
          Daily Goal Complete!
        </Animated.Text>
      </Animated.View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Celebration Provider
// ---------------------------------------------------------------------------

export function CelebrationProvider({ children }: { children: React.ReactNode }) {
  const [queue, setQueue] = useState<CelebrationType[]>([]);
  const [active, setActive] = useState<CelebrationType | null>(null);
  const processingRef = useRef(false);
  const reducedMotion = useReducedMotion();

  // Process queue — one celebration at a time
  useEffect(() => {
    if (processingRef.current || active || queue.length === 0) return;

    processingRef.current = true;
    const next = queue[0];
    setQueue((q) => q.slice(1));
    setActive(next);
    processingRef.current = false;
  }, [queue, active]);

  const enqueue = useCallback((celebration: CelebrationType) => {
    setQueue((q) => [...q, celebration]);
  }, []);

  const handleDone = useCallback(() => {
    // Small gap between celebrations
    setTimeout(() => setActive(null), 150);
  }, []);

  // --- Haptic helpers ---
  const hapticMedium = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  }, []);

  const hapticLight = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }, []);

  const hapticSuccess = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  }, []);

  const hapticDoubleSuccess = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setTimeout(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }, 200);
  }, []);

  // --- API ---
  const api = useMemo<CelebrationAPI>(
    () => ({
      celebrateTaskComplete: (xpEarned: number) => {
        hapticMedium();
        enqueue({ kind: 'taskComplete', xpEarned });
      },
      celebrateStreakMilestone: (streak: number) => {
        hapticSuccess();
        enqueue({ kind: 'streakMilestone', streak });
      },
      celebrateRoomComplete: (roomName: string) => {
        hapticSuccess();
        enqueue({ kind: 'roomComplete', roomName });
      },
      celebrateLevelUp: (newLevel: number) => {
        hapticDoubleSuccess();
        enqueue({ kind: 'levelUp', newLevel });
      },
      celebrateDailyGoal: () => {
        hapticSuccess();
        enqueue({ kind: 'dailyGoal' });
      },
      showXPPopup: (amount: number, label?: string) => {
        hapticLight();
        enqueue({ kind: 'xpPopup', amount, label });
      },
    }),
    [enqueue, hapticMedium, hapticLight, hapticSuccess, hapticDoubleSuccess],
  );

  // --- Render active celebration ---
  const renderOverlay = () => {
    if (!active) return null;

    // Reduced motion: show simplified static feedback
    if (reducedMotion) {
      let text = '';
      switch (active.kind) {
        case 'taskComplete':
          text = `+${active.xpEarned} XP`;
          break;
        case 'streakMilestone':
          text = `${active.streak} Day Streak!`;
          break;
        case 'roomComplete':
          text = `Room Complete: ${active.roomName}`;
          break;
        case 'levelUp':
          text = `Level Up! Level ${active.newLevel}`;
          break;
        case 'dailyGoal':
          text = 'Daily Goal Complete!';
          break;
        case 'xpPopup':
          text = `+${active.amount} XP${active.label ? ` ${active.label}` : ''}`;
          break;
      }

      return (
        <ReducedMotionOverlay text={text} onDone={handleDone} />
      );
    }

    switch (active.kind) {
      case 'taskComplete':
        return <TaskCompleteOverlay xpEarned={active.xpEarned} onDone={handleDone} />;
      case 'streakMilestone':
        return <StreakOverlay streak={active.streak} onDone={handleDone} />;
      case 'roomComplete':
        return <RoomCompleteOverlay roomName={active.roomName} onDone={handleDone} />;
      case 'levelUp':
        return <LevelUpOverlay newLevel={active.newLevel} onDone={handleDone} />;
      case 'dailyGoal':
        return <DailyGoalOverlay onDone={handleDone} />;
      case 'xpPopup':
        return <XPFloat amount={active.amount} label={active.label} onDone={handleDone} />;
      default:
        return null;
    }
  };

  return (
    <CelebrationContext.Provider value={api}>
      {children}
      {/* Overlay — absolute positioned on top of everything */}
      <View style={styles.overlayRoot} pointerEvents="none">
        {renderOverlay()}
      </View>
    </CelebrationContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useCelebration(): CelebrationAPI {
  const ctx = useContext(CelebrationContext);
  if (!ctx) {
    throw new Error('useCelebration must be used within a CelebrationProvider');
  }
  return ctx;
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  overlayRoot: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 99999,
    elevation: 99999,
  },

  // XP Float
  xpFloatContainer: {
    position: 'absolute',
    bottom: 200,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  xpFloatText: {
    ...Typography.title1,
    fontWeight: '900',
    fontSize: 28,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },
  xpFloatLabel: {
    ...Typography.caption1Medium,
    marginTop: 2,
  },

  // Checkmark
  checkContainer: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.38,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  checkText: {
    fontSize: 56,
  },

  // Full-screen glow
  fullScreenGlow: {
    ...StyleSheet.absoluteFillObject,
  },
  goldenGlow: {
    backgroundColor: '#FFD700',
  },
  warmGlow: {
    backgroundColor: '#FF9F0A',
  },

  // Center text (streak, level up)
  centerTextContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Streak
  streakEmoji: {
    fontSize: 56,
    marginBottom: 4,
  },
  streakNumber: {
    ...Typography.displayHero,
    color: '#FFFFFF',
    textShadowColor: 'rgba(255, 159, 10, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 24,
  },
  streakLabel: {
    ...Typography.title2,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
    marginTop: 4,
  },

  // Banner (room complete)
  bannerContainer: {
    position: 'absolute',
    top: 80,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#30D158',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  bannerEmoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  bannerTitle: {
    ...Typography.title1,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  bannerSubtitle: {
    ...Typography.callout,
    color: '#EBEBF599',
    marginTop: 4,
    textAlign: 'center',
  },

  // Level up
  levelUpTitle: {
    ...Typography.displayLarge,
    color: '#FFD700',
    letterSpacing: 4,
    textShadowColor: 'rgba(255, 215, 0, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 24,
    marginBottom: 16,
  },
  levelCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderWidth: 3,
    borderColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 8,
  },
  levelNumber: {
    ...Typography.displayMedium,
    color: '#FFD700',
    textShadowColor: 'rgba(255, 215, 0, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },

  // Daily goal ring
  ringCenter: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.3,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringTrack: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringFill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 50,
    borderWidth: 8,
  },
  ringCheckmark: {
    fontSize: 36,
    position: 'absolute',
  },
  dailyGoalTextContainer: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.3 + 130,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  dailyGoalText: {
    ...Typography.title1,
    textAlign: 'center',
  },

  // Reduced motion fallback
  reducedMotionOverlay: {
    position: 'absolute',
    bottom: 200,
    left: 40,
    right: 40,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  reducedMotionText: {
    ...Typography.headline,
    color: '#FFFFFF',
    textAlign: 'center',
  },
});

export default CelebrationProvider;
