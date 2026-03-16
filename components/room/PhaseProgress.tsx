/**
 * PhaseProgress - Phase progress indicator showing current phase (1, 2, or 3)
 * Visual indicator for multi-phase cleaning sessions
 */

import * as Haptics from 'expo-haptics';
import { useColorScheme } from '@/hooks/useColorScheme';
import React, { useEffect } from 'react';
import {
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import Animated, {
    Easing,
    FadeIn,
    SlideInLeft,
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withSpring,
    withTiming
} from 'react-native-reanimated';

import { Colors } from '@/constants/Colors';
import { BorderRadius, Spacing } from '@/theme/spacing';
import { Typography } from '@/theme/typography';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
export interface Phase {
  id: number;
  name: string;
  description?: string;
  emoji?: string;
  isCompleted: boolean;
  isCurrent: boolean;
  isLocked: boolean;
  progress?: number; // 0-100 for current phase
}

export interface PhaseProgressProps {
  /** Array of phases */
  phases: Phase[];
  /** Current phase ID */
  currentPhaseId: number;
  /** Callback when phase is tapped (only for completed phases) */
  onPhasePress?: (phaseId: number) => void;
  /** Compact mode for smaller displays */
  compact?: boolean;
  /** Show phase names */
  showNames?: boolean;
  /** Animated entrance */
  animated?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Default Phases
// ─────────────────────────────────────────────────────────────────────────────
export const DEFAULT_PHASES: Omit<Phase, 'isCompleted' | 'isCurrent' | 'isLocked' | 'progress'>[] = [
  {
    id: 1,
    name: 'Operation Floor Rescue',
    description: 'Clear walkable paths and floor space',
    emoji: '🚶',
  },
  {
    id: 2,
    name: 'Surface Liberation',
    description: 'Reclaim tables, desks, and counters',
    emoji: '🪑',
  },
  {
    id: 3,
    name: 'Organization Station',
    description: 'Store, organize, and finalize',
    emoji: '📦',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Phase Node Component
// ─────────────────────────────────────────────────────────────────────────────
function PhaseNode({
  phase,
  index,
  totalPhases,
  onPress,
  compact,
  animated,
}: {
  phase: Phase;
  index: number;
  totalPhases: number;
  onPress?: (phaseId: number) => void;
  compact?: boolean;
  animated?: boolean;
}) {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  
  const scale = useSharedValue(1);
  const progressWidth = useSharedValue(0);
  const nodeOpacity = useSharedValue(phase.isLocked ? 0.4 : 1);

  useEffect(() => {
    if (phase.isCurrent && phase.progress !== undefined) {
      progressWidth.value = withTiming(phase.progress, {
        duration: 1000,
        easing: Easing.out(Easing.cubic),
      });
    }
  }, [phase.progress, phase.isCurrent, progressWidth]);

  // Animate current phase
  useEffect(() => {
    if (phase.isCurrent) {
      scale.value = withSequence(
        withTiming(1.1, { duration: 300 }),
        withSpring(1, { damping: 15, stiffness: 200 })
      );
    }
  }, [phase.isCurrent, scale]);

  const handlePress = () => {
    if (phase.isCompleted && onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress(phase.id);
    }
  };

  const nodeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: nodeOpacity.value,
  }));

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  const nodeSize = compact ? 40 : 56;
  const isLastNode = index === totalPhases - 1;

  const getNodeColors = () => {
    if (phase.isCompleted) {
      return {
        bg: colors.success,
        text: colors.textOnSuccess,
        border: colors.success,
      };
    }
    if (phase.isCurrent) {
      return {
        bg: colors.accent,
        text: colors.textOnPrimary,
        border: colors.accent,
      };
    }
    return {
      bg: colors.fillTertiary,
      text: colors.textTertiary,
      border: colors.border,
    };
  };

  const nodeColors = getNodeColors();

  return (
    <View style={styles.phaseNodeContainer}>
      {/* Connection line before node (except first) */}
      {index > 0 && (
        <View 
          style={[
            styles.connectionLine,
            styles.connectionLineBefore,
            {
              backgroundColor: phase.isCompleted || phase.isCurrent 
                ? colors.success 
                : colors.fillTertiary,
            },
          ]}
        />
      )}

      <Animated.View
        entering={animated ? SlideInLeft.delay(index * 150).duration(350) : undefined}
        style={[styles.phaseNode, nodeStyle]}
      >
        <Pressable
          onPress={handlePress}
          disabled={phase.isLocked}
          style={({ pressed }) => [
            styles.nodeCircle,
            {
              width: nodeSize,
              height: nodeSize,
              borderRadius: nodeSize / 2,
              backgroundColor: nodeColors.bg,
              borderColor: nodeColors.border,
              borderWidth: phase.isCurrent ? 3 : 2,
              opacity: pressed && phase.isCompleted ? 0.8 : 1,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={`Phase ${phase.id}: ${phase.name}`}
          accessibilityState={{
            selected: phase.isCurrent,
            disabled: phase.isLocked,
          }}
        >
          {phase.isCompleted ? (
            <Text style={[styles.checkmark, { color: nodeColors.text }]}>✓</Text>
          ) : phase.isLocked ? (
            <Text style={[styles.lockIcon, { color: nodeColors.text }]}>🔒</Text>
          ) : (
            <Text style={[styles.phaseNumber, { color: nodeColors.text }]}>
              {phase.emoji || phase.id}
            </Text>
          )}
        </Pressable>

        {/* Phase name and progress for current */}
        {!compact && (
          <View style={styles.phaseInfo}>
            <Text 
              style={[
                Typography.caption1Medium,
                { 
                  color: phase.isLocked ? colors.textTertiary : colors.text,
                  textAlign: 'center',
                },
              ]}
              numberOfLines={1}
            >
              {phase.name}
            </Text>
            
            {phase.isCurrent && phase.progress !== undefined && (
              <View style={styles.progressBarContainer}>
                <View 
                  style={[
                    styles.progressBarBg, 
                    { backgroundColor: colors.fillTertiary }
                  ]}
                >
                  <Animated.View
                    style={[
                      styles.progressBarFill,
                      { backgroundColor: colors.accent },
                      progressBarStyle,
                    ]}
                  />
                </View>
                <Text style={[Typography.caption2, { color: colors.textSecondary, marginTop: 2 }]}>
                  {phase.progress}%
                </Text>
              </View>
            )}
          </View>
        )}
      </Animated.View>

      {/* Connection line after node (except last) */}
      {!isLastNode && (
        <View 
          style={[
            styles.connectionLine,
            styles.connectionLineAfter,
            {
              backgroundColor: phase.isCompleted 
                ? colors.success 
                : colors.fillTertiary,
            },
          ]}
        />
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
export function PhaseProgress({
  phases,
  currentPhaseId,
  onPhasePress,
  compact = false,
  showNames: _showNames = true,
  animated = true,
}: PhaseProgressProps) {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];

  // Enrich phases with state
  const enrichedPhases: Phase[] = phases.map(phase => ({
    ...phase,
    isCurrent: phase.id === currentPhaseId,
    isLocked: phase.id > currentPhaseId && !phase.isCompleted,
  }));

  const currentPhase = enrichedPhases.find(p => p.isCurrent);

  return (
    <View style={styles.container}>
      {/* Current phase header */}
      {currentPhase && !compact && (
        <Animated.View 
          entering={animated ? FadeIn.delay(300) : undefined}
          style={styles.currentPhaseHeader}
        >
          <View style={[styles.currentPhaseBadge, { backgroundColor: colors.accentMuted }]}>
            <Text style={[Typography.caption1Medium, { color: colors.accent }]}>
              Phase {currentPhase.id} of {phases.length}
            </Text>
          </View>
          {currentPhase.description && (
            <Text style={[Typography.caption1, { color: colors.textSecondary, marginTop: Spacing.xxs }]}>
              {currentPhase.description}
            </Text>
          )}
        </Animated.View>
      )}

      {/* Phase nodes */}
      <View style={[styles.phaseNodesContainer, compact && styles.compactContainer]}>
        {enrichedPhases.map((phase, index) => (
          <PhaseNode
            key={phase.id}
            phase={phase}
            index={index}
            totalPhases={phases.length}
            onPress={onPhasePress}
            compact={compact}
            animated={animated}
          />
        ))}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Convenience Component with Default Phases
// ─────────────────────────────────────────────────────────────────────────────
export function SimplePhaseProgress({
  currentPhase,
  phaseProgress,
  completedPhases = [],
  onPhasePress,
  compact = false,
}: {
  currentPhase: 1 | 2 | 3;
  phaseProgress?: number;
  completedPhases?: number[];
  onPhasePress?: (phaseId: number) => void;
  compact?: boolean;
}) {
  const phases: Phase[] = DEFAULT_PHASES.map(phase => ({
    ...phase,
    isCompleted: completedPhases.includes(phase.id),
    isCurrent: phase.id === currentPhase,
    isLocked: phase.id > currentPhase && !completedPhases.includes(phase.id),
    progress: phase.id === currentPhase ? phaseProgress : undefined,
  }));

  return (
    <PhaseProgress
      phases={phases}
      currentPhaseId={currentPhase}
      onPhasePress={onPhasePress}
      compact={compact}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  currentPhaseHeader: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  currentPhaseBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs,
    borderRadius: BorderRadius.sm,
  },
  phaseNodesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.md,
  },
  compactContainer: {
    paddingHorizontal: Spacing.sm,
  },
  phaseNodeContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  connectionLine: {
    position: 'absolute',
    height: 3,
    top: 26, // Half of node size
    borderRadius: 1.5,
  },
  connectionLineBefore: {
    left: 0,
    right: '50%',
    marginRight: 28,
  },
  connectionLineAfter: {
    left: '50%',
    right: 0,
    marginLeft: 28,
  },
  phaseNode: {
    alignItems: 'center',
    zIndex: 1,
  },
  nodeCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  checkmark: {
    fontSize: 20,
    fontWeight: '700',
  },
  lockIcon: {
    fontSize: 16,
  },
  phaseNumber: {
    fontSize: 18,
    fontWeight: '700',
  },
  phaseInfo: {
    marginTop: Spacing.sm,
    alignItems: 'center',
    width: 100,
  },
  progressBarContainer: {
    width: '100%',
    marginTop: Spacing.xxs,
    alignItems: 'center',
  },
  progressBarBg: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
});

export default PhaseProgress;
