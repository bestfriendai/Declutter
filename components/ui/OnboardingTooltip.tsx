/**
 * Declutterly - Onboarding Tooltip Component
 * Contextual tooltips to guide first-time users through the app
 * Supports light and dark mode themes
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Dimensions,
  Modal,
  LayoutRectangle,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  withSequence,
  useReducedMotion,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const STORAGE_KEY = '@declutterly_seen_tooltips';

// Available tooltip IDs
export type TooltipId =
  | 'home_add_room'
  | 'home_progress'
  | 'room_camera'
  | 'room_tasks'
  | 'task_swipe'
  | 'focus_mode'
  | 'profile_stats'
  | 'insights_chart';

// Tooltip content configuration
const TOOLTIP_CONTENT: Record<TooltipId, { title: string; description: string; emoji: string }> = {
  home_add_room: {
    title: 'Add Your First Room',
    description: 'Tap here to add a room and start decluttering! Just take a photo and our AI will create a personalized task list.',
    emoji: '📸',
  },
  home_progress: {
    title: 'Track Your Progress',
    description: 'See all your rooms and their completion status at a glance. Tap any room to continue cleaning!',
    emoji: '📊',
  },
  room_camera: {
    title: 'Take a Photo',
    description: 'Snap a picture of your messy area. The AI will analyze it and break down the cleanup into small, manageable tasks.',
    emoji: '🎯',
  },
  room_tasks: {
    title: 'Your Task List',
    description: 'Each task is broken down into simple steps. Tap to complete them one by one - no overwhelm!',
    emoji: '✅',
  },
  task_swipe: {
    title: 'Swipe to Delete',
    description: 'Swipe left on any task to remove it. Don\'t worry, you can always undo!',
    emoji: '👆',
  },
  focus_mode: {
    title: 'Focus Mode',
    description: 'Start a timed session to stay focused. The Pomodoro technique helps you clean in short bursts!',
    emoji: '⏱️',
  },
  profile_stats: {
    title: 'Your Achievements',
    description: 'View your cleaning stats and unlock badges as you complete more tasks and rooms!',
    emoji: '🏆',
  },
  insights_chart: {
    title: 'Weekly Activity',
    description: 'See your cleaning patterns over time. Consistency is key to a clutter-free life!',
    emoji: '📈',
  },
};

// Context for managing tooltip state
interface TooltipContextType {
  seenTooltips: TooltipId[];
  showTooltip: (id: TooltipId, targetRect: LayoutRectangle) => void;
  dismissTooltip: () => void;
  markAsSeen: (id: TooltipId) => void;
  resetTooltips: () => void;
  hasSeenTooltip: (id: TooltipId) => boolean;
  activeTooltip: TooltipId | null;
  isReady: boolean;
}

const TooltipContext = createContext<TooltipContextType | null>(null);

export function useOnboardingTooltip() {
  const context = useContext(TooltipContext);
  if (!context) {
    throw new Error('useOnboardingTooltip must be used within OnboardingTooltipProvider');
  }
  return context;
}

// Provider component
interface OnboardingTooltipProviderProps {
  children: ReactNode;
  enabled?: boolean;
}

export function OnboardingTooltipProvider({
  children,
  enabled = true,
}: OnboardingTooltipProviderProps) {
  const [seenTooltips, setSeenTooltips] = useState<TooltipId[]>([]);
  const [activeTooltip, setActiveTooltip] = useState<TooltipId | null>(null);
  const [targetRect, setTargetRect] = useState<LayoutRectangle | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Load seen tooltips from storage
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((data) => {
        if (data) {
          setSeenTooltips(JSON.parse(data));
        }
      })
      .finally(() => setIsReady(true));
  }, []);

  // Save seen tooltips to storage
  const saveSeen = useCallback(async (tooltips: TooltipId[]) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tooltips));
  }, []);

  const showTooltip = useCallback(
    (id: TooltipId, rect: LayoutRectangle) => {
      if (!enabled || seenTooltips.includes(id)) return;
      setTargetRect(rect);
      setActiveTooltip(id);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    [enabled, seenTooltips]
  );

  const dismissTooltip = useCallback(() => {
    setActiveTooltip(null);
    setTargetRect(null);
  }, []);

  const markAsSeen = useCallback(
    (id: TooltipId) => {
      if (!seenTooltips.includes(id)) {
        const updated = [...seenTooltips, id];
        setSeenTooltips(updated);
        saveSeen(updated);
      }
      dismissTooltip();
    },
    [seenTooltips, saveSeen, dismissTooltip]
  );

  const resetTooltips = useCallback(async () => {
    setSeenTooltips([]);
    await AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  const hasSeenTooltip = useCallback(
    (id: TooltipId) => seenTooltips.includes(id),
    [seenTooltips]
  );

  return (
    <TooltipContext.Provider
      value={{
        seenTooltips,
        showTooltip,
        dismissTooltip,
        markAsSeen,
        resetTooltips,
        hasSeenTooltip,
        activeTooltip,
        isReady,
      }}
    >
      {children}
      {activeTooltip && targetRect && (
        <TooltipOverlay
          id={activeTooltip}
          targetRect={targetRect}
          onDismiss={() => markAsSeen(activeTooltip)}
        />
      )}
    </TooltipContext.Provider>
  );
}

// Tooltip overlay component
interface TooltipOverlayProps {
  id: TooltipId;
  targetRect: LayoutRectangle;
  onDismiss: () => void;
}

function TooltipOverlay({ id, targetRect, onDismiss }: TooltipOverlayProps) {
  const reducedMotion = useReducedMotion();
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const content = TOOLTIP_CONTENT[id];

  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);
  const pulseScale = useSharedValue(1);

  // Calculate tooltip position
  const tooltipAbove = targetRect.y > SCREEN_HEIGHT / 2;
  const tooltipX = Math.max(
    16,
    Math.min(
      SCREEN_WIDTH - 16 - 280,
      targetRect.x + targetRect.width / 2 - 140
    )
  );
  const tooltipY = tooltipAbove
    ? targetRect.y - 140
    : targetRect.y + targetRect.height + 16;

  useEffect(() => {
    // Animate in
    opacity.value = withTiming(1, { duration: 200 });
    scale.value = reducedMotion
      ? withTiming(1, { duration: 200 })
      : withSpring(1, { damping: 20, stiffness: 300 });

    // Pulse animation for highlight
    if (!reducedMotion) {
      pulseScale.value = withDelay(
        300,
        withSequence(
          withTiming(1.05, { duration: 600 }),
          withTiming(1, { duration: 600 }),
          withTiming(1.05, { duration: 600 }),
          withTiming(1, { duration: 600 })
        )
      );
    }
  }, []);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const tooltipStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const highlightStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  // Theme-aware colors
  const isDark = colorScheme === 'dark';
  const accentColor = isDark ? '#0A84FF' : '#007AFF'; // iOS blue
  const highlightBgColor = isDark ? 'rgba(10, 132, 255, 0.3)' : 'rgba(0, 122, 255, 0.2)';
  const tooltipBgColor = isDark ? 'rgba(30, 30, 46, 0.98)' : 'rgba(255, 255, 255, 0.98)';
  const tooltipBorderColor = isDark ? 'rgba(10, 132, 255, 0.3)' : 'rgba(0, 122, 255, 0.3)';
  const titleColor = isDark ? '#FFFFFF' : '#000000';
  const descriptionColor = isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.7)';
  const buttonBgColor = accentColor;
  const buttonTextColor = '#FFFFFF';

  return (
    <Modal transparent visible animationType="none">
      <Animated.View style={[styles.overlay, overlayStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss}>
          <BlurView intensity={20} style={StyleSheet.absoluteFill} tint={isDark ? 'dark' : 'light'} />
        </Pressable>

        {/* Target highlight */}
        <Animated.View
          style={[
            styles.highlight,
            highlightStyle,
            {
              top: targetRect.y - 8,
              left: targetRect.x - 8,
              width: targetRect.width + 16,
              height: targetRect.height + 16,
              borderRadius: Math.min(targetRect.width, targetRect.height) / 2 + 8,
              backgroundColor: highlightBgColor,
              borderColor: accentColor,
            },
          ]}
        />

        {/* Tooltip card */}
        <Animated.View
          style={[
            styles.tooltip,
            tooltipStyle,
            {
              top: tooltipY,
              left: tooltipX,
              backgroundColor: tooltipBgColor,
              borderColor: tooltipBorderColor,
            },
          ]}
        >
          {/* Arrow */}
          <View
            style={[
              styles.arrow,
              tooltipAbove ? styles.arrowDown : styles.arrowUp,
              {
                left: Math.max(
                  16,
                  Math.min(248, targetRect.x + targetRect.width / 2 - tooltipX - 8)
                ),
                backgroundColor: tooltipBgColor,
                borderColor: tooltipBorderColor,
              },
            ]}
          />

          <View style={styles.tooltipHeader}>
            <Text style={styles.emoji}>{content.emoji}</Text>
            <Text style={[styles.title, { color: titleColor }]}>{content.title}</Text>
          </View>
          <Text style={[styles.description, { color: descriptionColor }]}>{content.description}</Text>

          <Pressable
            style={({ pressed }) => [
              styles.gotItButton,
              { backgroundColor: buttonBgColor },
              pressed && styles.pressed,
            ]}
            onPress={onDismiss}
          >
            <Text style={[styles.gotItText, { color: buttonTextColor }]}>Got it!</Text>
            <Ionicons name="checkmark" size={16} color={buttonTextColor} />
          </Pressable>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

// Helper hook to trigger tooltip on mount for a specific element
export function useTooltipTrigger(id: TooltipId, delay: number = 500) {
  const { showTooltip, hasSeenTooltip, isReady } = useOnboardingTooltip();
  const [ref, setRef] = useState<View | null>(null);

  useEffect(() => {
    if (!isReady || hasSeenTooltip(id) || !ref) return;

    const timer = setTimeout(() => {
      ref.measureInWindow((x, y, width, height) => {
        if (width > 0 && height > 0) {
          showTooltip(id, { x, y, width, height });
        }
      });
    }, delay);

    return () => clearTimeout(timer);
  }, [isReady, hasSeenTooltip, id, ref, delay, showTooltip]);

  return setRef;
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  highlight: {
    position: 'absolute',
    borderWidth: 2,
  },
  tooltip: {
    position: 'absolute',
    width: 280,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
  },
  arrow: {
    position: 'absolute',
    width: 16,
    height: 16,
    transform: [{ rotate: '45deg' }],
    borderWidth: 1,
  },
  arrowUp: {
    top: -8,
    borderBottomWidth: 0,
    borderRightWidth: 0,
  },
  arrowDown: {
    bottom: -8,
    borderTopWidth: 0,
    borderLeftWidth: 0,
  },
  tooltipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  emoji: {
    fontSize: 24,
    marginRight: 10,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    flex: 1,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  gotItButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    gap: 6,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  gotItText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default OnboardingTooltipProvider;
