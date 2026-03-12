/**
 * Declutterly - Confetti Celebration Component
 * Animated confetti burst for achievements and milestones
 */

import React, { useEffect, useMemo } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  Easing,
  runOnJS,
  useReducedMotion,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Confetti particle colors
const CONFETTI_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#FFE66D', // Yellow
  '#A78BFA', // Purple
  '#6366F1', // Indigo
  '#34D399', // Green
  '#F472B6', // Pink
  '#FB923C', // Orange
];

interface ConfettiPiece {
  id: number;
  x: number;
  color: string;
  size: number;
  rotation: number;
  delay: number;
}

interface ConfettiProps {
  visible: boolean;
  onComplete?: () => void;
  intensity?: 'light' | 'medium' | 'heavy';
  duration?: number;
}

// Single confetti piece component
function ConfettiPieceAnimated({
  piece,
  duration,
  onComplete,
  isLast,
}: {
  piece: ConfettiPiece;
  duration: number;
  onComplete?: () => void;
  isLast: boolean;
}) {
  const reducedMotion = useReducedMotion();

  const translateY = useSharedValue(-50);
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) {
      // Simplified animation for reduced motion
      scale.value = withDelay(
        piece.delay,
        withSequence(
          withTiming(1, { duration: 200 }),
          withTiming(0, { duration: 800 })
        )
      );
      if (isLast && onComplete) {
        setTimeout(() => onComplete(), duration);
      }
      return;
    }

    const endY = SCREEN_HEIGHT + 100;
    const endX = (Math.random() - 0.5) * 200;

    // Animate entrance
    scale.value = withDelay(piece.delay, withTiming(1, { duration: 150 }));

    // Fall animation
    translateY.value = withDelay(
      piece.delay,
      withTiming(endY, {
        duration: duration - piece.delay,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      })
    );

    // Horizontal drift
    translateX.value = withDelay(
      piece.delay,
      withTiming(endX, {
        duration: duration - piece.delay,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      })
    );

    // Rotation
    rotate.value = withDelay(
      piece.delay,
      withTiming(piece.rotation + 720, {
        duration: duration - piece.delay,
        easing: Easing.linear,
      })
    );

    // Fade out at the end
    opacity.value = withDelay(
      duration - 500,
      withTiming(0, { duration: 500 })
    );

    // Callback when animation completes
    if (isLast && onComplete) {
      setTimeout(() => {
        runOnJS(onComplete)();
      }, duration);
    }
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.confettiPiece,
        {
          left: piece.x,
          width: piece.size,
          height: piece.size * 0.6,
          backgroundColor: piece.color,
          borderRadius: piece.size * 0.15,
        },
        animatedStyle,
      ]}
    />
  );
}

export function Confetti({
  visible,
  onComplete,
  intensity = 'medium',
  duration = 3000,
}: ConfettiProps) {
  // Generate confetti pieces
  const pieces = useMemo(() => {
    if (!visible) return [];

    const count = intensity === 'light' ? 30 : intensity === 'medium' ? 50 : 80;
    const confetti: ConfettiPiece[] = [];

    for (let i = 0; i < count; i++) {
      confetti.push({
        id: i,
        x: Math.random() * SCREEN_WIDTH,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        size: Math.random() * 10 + 8,
        rotation: Math.random() * 360,
        delay: Math.random() * 300,
      });
    }

    return confetti;
  }, [visible, intensity]);

  if (!visible || pieces.length === 0) {
    return null;
  }

  return (
    <View style={styles.container} pointerEvents="none">
      {pieces.map((piece, index) => (
        <ConfettiPieceAnimated
          key={piece.id}
          piece={piece}
          duration={duration}
          onComplete={onComplete}
          isLast={index === pieces.length - 1}
        />
      ))}
    </View>
  );
}

// Hook for easy confetti trigger
export function useConfetti() {
  const [showConfetti, setShowConfetti] = React.useState(false);

  const triggerConfetti = React.useCallback(() => {
    setShowConfetti(true);
  }, []);

  const hideConfetti = React.useCallback(() => {
    setShowConfetti(false);
  }, []);

  return {
    showConfetti,
    triggerConfetti,
    hideConfetti,
    ConfettiComponent: (
      <Confetti
        visible={showConfetti}
        onComplete={hideConfetti}
        intensity="medium"
      />
    ),
  };
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    overflow: 'hidden',
  },
  confettiPiece: {
    position: 'absolute',
    top: 0,
  },
});

export default Confetti;
