/**
 * Declutterly -- Room Detail Screen (V1)
 * Matches Pencil design: gRNd7
 *
 * - Room photo header with gradient overlay
 * - "Getting Fresh" status pill
 * - Freshness progress bar
 * - Phase tabs (Quick Wins / Deep Clean / Organize)
 * - Task list with big checkboxes, color-coded left accents, time estimates
 * - "15-Min Blitz" floating CTA
 */

import { Clock, Check, Flame, Plus, Sparkles, ChevronDown, ChevronUp, AlertTriangle, Zap, Eye, MapPin, X, GripVertical } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { V1, BODY_FONT, DISPLAY_FONT, getTheme, RADIUS } from '@/constants/designTokens';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  runOnJS,
  Easing,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDeclutter } from '@/context/DeclutterContext';
import { ScreenErrorBoundary } from '@/components/ErrorBoundary';
import { RoomActions, RoomHeader, RoomProgress } from '@/components/room';
import { DoomPileCard } from '@/components/room/DoomPileCard';
import { CleaningTask, SubTask } from '@/types/declutter';
import { toConvexId } from '@/utils/convexIds';
import { optimizeTaskOrder, getUserCleaningProfile } from '@/services/taskOptimizer';
import { getFilteredTasks } from '@/services/ai';
import { useReorderTasks } from '@/hooks/useConvex';
import type { UserCleaningProfile } from '@/types/declutter';

// ─── Phase definitions ───────────────────────────────────────────────────────
type Phase = 'quickWins' | 'deepClean' | 'organize';
const PHASES: { key: Phase; label: string }[] = [
  { key: 'quickWins', label: 'Quick Wins' },
  { key: 'deepClean', label: 'Deep Clean' },
  { key: 'organize', label: 'Organize' },
];

// ─── Visual impact sort weight ──────────────────────────────────────────────
function getVisualImpactWeight(impact?: string): number {
  if (impact === 'high') return 0;
  if (impact === 'medium') return 1;
  return 2; // low or undefined
}

// ─── Task color accent by priority ──────────────────────────────────────────
function getTaskAccent(task: CleaningTask): string {
  if (task.priority === 'high') return V1.coral;
  if (task.priority === 'medium') return V1.amber;
  return V1.green;
}

// ─── Freshness label ─────────────────────────────────────────────────────────
function getFreshnessInfo(progress: number): { label: string; color: string } {
  if (progress >= 90) return { label: 'Sparkling', color: V1.green };
  if (progress >= 60) return { label: 'Getting Fresh', color: V1.green };
  if (progress >= 30) return { label: 'In Progress', color: V1.amber };
  return { label: 'Needs Love', color: V1.coral };
}

// ─── Classify tasks into phases ──────────────────────────────────────────────
function classifyPhase(task: CleaningTask): Phase {
  // Use the AI's phase assignment when available
  if (task.phase === 1) return 'quickWins';
  if (task.phase === 2) return 'deepClean';
  if (task.phase === 3) return 'organize';

  // Fallback: only used if phase field is missing
  if ((task.estimatedMinutes || 0) <= 3 || task.difficulty === 'quick') return 'quickWins';
  if (task.category === 'organization' || task.category === 'donation_sorting') return 'organize';
  return 'deepClean';
}

// ─── XP Float-Up Component ───────────────────────────────────────────────────
function XPFloatUp({ xp, onDone }: { xp: number; onDone: () => void }) {
  const opacity = useSharedValue(1);
  const translateY = useSharedValue(0);

  React.useEffect(() => {
    translateY.value = withTiming(-60, {
      duration: 900,
      easing: Easing.out(Easing.ease),
    });
    opacity.value = withDelay(
      400,
      withTiming(0, { duration: 500 }, (finished) => {
        if (finished) runOnJS(onDone)();
      }),
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[xpFloatStyles.container, style]} pointerEvents="none">
      <Text style={xpFloatStyles.text}>+{xp} XP</Text>
    </Animated.View>
  );
}

const xpFloatStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 16,
    top: -8,
    zIndex: 10,
  },
  text: {
    color: V1.green,
    fontSize: 16,
    fontWeight: '800',
    fontFamily: DISPLAY_FONT,
  },
});

// ─── Mascot Reaction on Task Completion ─────────────────────────────────────
const MASCOT_REACTIONS = [
  "Nice one! \u{1F44F}",
  "Keep going! \u{1F4AA}",
  "That's the spirit! \u{2728}",
  "You're on fire! \u{1F525}",
  "Awesome work! \u{1F389}",
  "One less thing! \u{1F60A}",
  "Crushed it! \u{1F4A5}",
  "Look at you go! \u{1F31F}",
];

function MascotTaskReaction({ visible, onDone }: { visible: boolean; onDone: () => void }) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const [message] = React.useState(() =>
    MASCOT_REACTIONS[Math.floor(Math.random() * MASCOT_REACTIONS.length)]
  );

  React.useEffect(() => {
    if (visible) {
      // Spring in
      scale.value = withSpring(1, { damping: 8, stiffness: 200 });
      opacity.value = withTiming(1, { duration: 200 });
      // Fade out after 2 seconds
      opacity.value = withDelay(
        1800,
        withTiming(0, { duration: 400 }, (finished) => {
          if (finished) runOnJS(onDone)();
        }),
      );
      scale.value = withDelay(
        1800,
        withTiming(0.5, { duration: 400 }),
      );
    } else {
      scale.value = 0;
      opacity.value = 0;
    }
  }, [visible]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  if (!visible) return null;

  return (
    <Animated.View
      style={[{
        position: 'absolute',
        right: 10,
        top: -40,
        zIndex: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
      }, animStyle]}
      pointerEvents="none"
    >
      <View style={{
        backgroundColor: V1.coral + '15',
        borderRadius: 14,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: V1.coral + '30',
        maxWidth: 160,
      }}>
        <Text style={{
          fontFamily: BODY_FONT,
          fontSize: 13,
          fontWeight: '600',
          color: V1.coral,
          textAlign: 'center',
        }}>
          {message}
        </Text>
      </View>
      <Text style={{ fontSize: 24 }}>{'\u{1F9F9}'}</Text>
    </Animated.View>
  );
}

// ─── Task Detail Panel ──────────────────────────────────────────────────────
function TaskDetailPanel({
  task,
  roomId,
  isDark,
  onToggleSubTask,
}: {
  task: CleaningTask;
  roomId: string;
  isDark: boolean;
  onToggleSubTask: (roomId: string, taskId: string, subTaskId: string) => void;
}) {
  const t = isDark ? V1.dark : V1.light;
  const hasSubtasks = task.subtasks && task.subtasks.length > 0;
  const hasTips = task.tips && task.tips.length > 0;
  const hasDecisionPoints = task.decisionPoints && task.decisionPoints.length > 0;

  return (
    <View style={[detailStyles.panel, { backgroundColor: isDark ? V1.dark.cardElevated : '#F7F7F8', borderColor: t.border }]}>
      {/* Description */}
      {task.description ? (
        <Text style={[detailStyles.description, { color: t.textSecondary }]}>
          {task.description}
        </Text>
      ) : null}

      {/* Why This Matters */}
      {task.whyThisMatters ? (
        <View style={detailStyles.infoRow}>
          <Zap size={14} color={V1.amber} />
          <Text style={[detailStyles.infoText, { color: t.textSecondary }]}>
            {task.whyThisMatters}
          </Text>
        </View>
      ) : null}

      {/* Estimated time + energy */}
      <View style={detailStyles.metaRow}>
        <View style={detailStyles.metaChip}>
          <Clock size={12} color={t.textMuted} />
          <Text style={[detailStyles.metaText, { color: t.textMuted }]}>
            ~{task.estimatedMinutes || 3} min
          </Text>
        </View>
        {task.energyRequired ? (
          <View style={detailStyles.metaChip}>
            <Text style={[detailStyles.metaText, { color: t.textMuted }]}>
              Energy: {task.energyRequired}
            </Text>
          </View>
        ) : null}
        {task.decisionLoad && task.decisionLoad !== 'none' ? (
          <View style={detailStyles.metaChip}>
            <Text style={[detailStyles.metaText, { color: t.textMuted }]}>
              Decisions: {task.decisionLoad}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Subtasks */}
      {hasSubtasks ? (
        <View style={detailStyles.section}>
          <Text style={[detailStyles.sectionTitle, { color: t.text }]}>Steps</Text>
          {task.subtasks!.map((st) => (
            <Pressable
              key={st.id}
              onPress={() => {
                Haptics.selectionAsync();
                onToggleSubTask(roomId, task.id, st.id);
              }}
              style={detailStyles.subtaskRow}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: st.completed }}
              accessibilityLabel={st.title}
            >
              <View style={[
                detailStyles.subtaskCheck,
                st.completed
                  ? { backgroundColor: V1.green, borderColor: V1.green }
                  : { borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)' },
              ]}>
                {st.completed && <Check size={10} color="#FFFFFF" strokeWidth={3} />}
              </View>
              <Text style={[
                detailStyles.subtaskTitle,
                { color: st.completed ? t.textMuted : t.text },
                st.completed && { textDecorationLine: 'line-through', opacity: 0.5 },
              ]}>
                {st.title}
              </Text>
              {st.estimatedMinutes ? (
                <Text style={[detailStyles.subtaskTime, { color: t.textMuted }]}>
                  {st.estimatedMinutes}m
                </Text>
              ) : null}
            </Pressable>
          ))}
        </View>
      ) : null}

      {/* Tips */}
      {hasTips ? (
        <View style={detailStyles.section}>
          <Text style={[detailStyles.sectionTitle, { color: t.text }]}>Tips</Text>
          {task.tips!.map((tip, i) => (
            <View key={i} style={detailStyles.tipRow}>
              <Text style={[detailStyles.tipBullet, { color: V1.green }]}>{'*'}</Text>
              <Text style={[detailStyles.tipText, { color: t.textSecondary }]}>{tip}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {/* Decision Points */}
      {hasDecisionPoints ? (
        <View style={detailStyles.section}>
          <Text style={[detailStyles.sectionTitle, { color: t.text }]}>Decision Help</Text>
          {task.decisionPoints!.map((dp, i) => (
            <View key={dp.id || i} style={[detailStyles.decisionCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', borderColor: t.border }]}>
              <Text style={[detailStyles.decisionQuestion, { color: t.text }]}>
                {dp.question}
              </Text>
              {dp.fiveSecondDefault ? (
                <View style={detailStyles.defaultRow}>
                  <AlertTriangle size={12} color={V1.amber} />
                  <Text style={[detailStyles.defaultText, { color: V1.amber }]}>
                    5-second default: {dp.fiveSecondDefault}
                  </Text>
                </View>
              ) : null}
              {dp.emotionalSupport ? (
                <Text style={[detailStyles.emotionalSupport, { color: t.textMuted }]}>
                  {dp.emotionalSupport}
                </Text>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}

      {/* Resistance Handler */}
      {task.resistanceHandler ? (
        <View style={[detailStyles.resistanceBox, { backgroundColor: isDark ? 'rgba(255,107,107,0.08)' : 'rgba(255,107,107,0.06)', borderColor: isDark ? 'rgba(255,107,107,0.15)' : 'rgba(255,107,107,0.12)' }]}>
          <Text style={[detailStyles.resistanceLabel, { color: V1.coral }]}>Feeling stuck?</Text>
          <Text style={[detailStyles.resistanceText, { color: t.textSecondary }]}>
            {task.resistanceHandler}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const detailStyles = StyleSheet.create({
  panel: {
    marginTop: 4,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    gap: 10,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: BODY_FONT,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingTop: 2,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: BODY_FONT,
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    fontFamily: BODY_FONT,
  },
  section: {
    gap: 6,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: DISPLAY_FONT,
  },
  subtaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  subtaskCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtaskTitle: {
    fontSize: 14,
    fontFamily: BODY_FONT,
    flex: 1,
  },
  subtaskTime: {
    fontSize: 11,
    fontFamily: BODY_FONT,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  tipBullet: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 1,
  },
  tipText: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: BODY_FONT,
    flex: 1,
  },
  decisionCard: {
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    gap: 6,
  },
  decisionQuestion: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: BODY_FONT,
  },
  defaultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  defaultText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: BODY_FONT,
  },
  emotionalSupport: {
    fontSize: 12,
    fontStyle: 'italic',
    fontFamily: BODY_FONT,
  },
  resistanceBox: {
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    gap: 4,
  },
  resistanceLabel: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: DISPLAY_FONT,
  },
  resistanceText: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: BODY_FONT,
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Main Room Detail Screen
// ─────────────────────────────────────────────────────────────────────────────
function RoomDetailContent() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const rawScheme = useColorScheme();
  const isDark = rawScheme === 'dark';
  const reducedMotion = useReducedMotion();
  const t = isDark ? V1.dark : V1.light;
  const insets = useSafeAreaInsets();
  const { rooms, toggleTask, toggleSubTask, setActiveRoom, addTaskToRoom } = useDeclutter();

  const room = rooms.find(r => r.id === id);
  const [activePhase, setActivePhase] = useState<Phase>('quickWins');
  const [xpFloatTaskId, setXpFloatTaskId] = useState<string | null>(null);
  const [mascotReactionTaskId, setMascotReactionTaskId] = useState<string | null>(null);
  const [showAllPhases, setShowAllPhases] = useState(false);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [focusViewEnabled, setFocusViewEnabled] = useState(true); // Default to single-task focus
  const [energyFilterEnabled, setEnergyFilterEnabled] = useState(false);
  const [showCompletionPrompt, setShowCompletionPrompt] = useState(false);
  const [viewByZone, setViewByZone] = useState(false);
  const [skippedTaskIds, setSkippedTaskIds] = useState<Set<string>>(new Set());
  const [reorderMode, setReorderMode] = useState(false);
  const reorderTasks = useReorderTasks();

  // Add Task modal state
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDifficulty, setNewTaskDifficulty] = useState<'quick' | 'medium' | 'challenging'>('quick');

  const handleAddTask = useCallback(() => {
    if (!room || !newTaskTitle.trim()) return;
    const estimatedMinutes = newTaskDifficulty === 'quick' ? 5 : newTaskDifficulty === 'medium' ? 15 : 30;
    addTaskToRoom(room.id, {
      title: newTaskTitle.trim(),
      description: '',
      emoji: '\uD83D\uDCCB',
      priority: 'medium',
      difficulty: newTaskDifficulty,
      estimatedMinutes,
      completed: false,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setNewTaskTitle('');
    setNewTaskDifficulty('quick');
    setShowAddTaskModal(false);
  }, [room, newTaskTitle, newTaskDifficulty, addTaskToRoom]);

  // Pull-to-refresh
  const [isRefreshing, setIsRefreshing] = useState(false);
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 800);
  }, []);

  // H6: Combo counter for task completion feedback
  const [comboCount, setComboCount] = useState(0);
  const comboTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Undo toast state
  const [undoTask, setUndoTask] = useState<{ id: string; title: string } | null>(null);
  const undoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean up combo timeout on unmount
  useEffect(() => {
    return () => {
      if (comboTimeoutRef.current) clearTimeout(comboTimeoutRef.current);
      if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    };
  }, []);

  // Task optimizer: load user cleaning profile for smart reordering
  const [cleaningProfile, setCleaningProfile] = useState<UserCleaningProfile | null>(null);
  useEffect(() => {
    getUserCleaningProfile().then(setCleaningProfile).catch(() => {});
  }, []);

  // Optimize task order using the learning profile
  const rawTasks = room?.tasks || [];
  const allTasks = useMemo(() => {
    if (!cleaningProfile || rawTasks.length === 0) return rawTasks;
    return optimizeTaskOrder(rawTasks, cleaningProfile);
  }, [rawTasks, cleaningProfile]);
  const totalTasks = allTasks.length;
  const completedTasks = allTasks.filter(tk => tk.completed).length;
  const skippedCount = skippedTaskIds.size;
  const activeTasks = totalTasks - skippedCount;
  const progress = activeTasks > 0 ? (completedTasks / activeTasks) * 100 : 0;
  const freshness = getFreshnessInfo(progress);

  // Energy-filtered tasks: when energy filter is on, only show tasks matching user energy
  const energyFilteredTasks = useMemo(() => {
    if (!energyFilterEnabled) return allTasks;
    // Default to moderate energy; 60 min time budget
    return getFilteredTasks(allTasks, 60, 'moderate');
  }, [allTasks, energyFilterEnabled]);

  // Task 3: Time estimate summary for remaining tasks (helps with time blindness)
  const remainingTasks = energyFilteredTasks.filter(tk => !tk.completed);
  const totalRemainingMinutes = remainingTasks.reduce((sum, tk) => sum + (tk.estimatedMinutes || 3), 0);

  // Group tasks by phase, then sort by visual impact
  const phaseTasks = useMemo(() => {
    const grouped: Record<Phase, CleaningTask[]> = {
      quickWins: [],
      deepClean: [],
      organize: [],
    };
    energyFilteredTasks.forEach(task => {
      const phase = classifyPhase(task);
      grouped[phase].push(task);
    });
    // Sort each phase by visual impact (high first for max dopamine)
    for (const phase of Object.keys(grouped) as Phase[]) {
      grouped[phase].sort((a, b) => {
        // Completed tasks sink to the bottom
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        // Then sort by visual impact
        return getVisualImpactWeight(a.visualImpact) - getVisualImpactWeight(b.visualImpact);
      });
    }
    return grouped;
  }, [energyFilteredTasks]);

  // Group tasks by zone for "By Zone" view
  const zoneTasks = useMemo(() => {
    const grouped = new Map<string, CleaningTask[]>();
    energyFilteredTasks.forEach(task => {
      const zone = task.zone || 'General';
      if (!grouped.has(zone)) grouped.set(zone, []);
      grouped.get(zone)!.push(task);
    });
    // Sort each zone: incomplete first, then by visual impact
    for (const [, tasks] of grouped) {
      tasks.sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        return getVisualImpactWeight(a.visualImpact) - getVisualImpactWeight(b.visualImpact);
      });
    }
    return grouped;
  }, [energyFilteredTasks]);

  const currentPhaseTasks = phaseTasks[activePhase];

  // Dependency hint toast state
  const [dependencyHint, setDependencyHint] = useState<string | null>(null);
  const dependencyHintTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMoveTask = useCallback((taskId: string, direction: 'up' | 'down') => {
    if (!room) return;
    const tasks = [...(room.tasks || [])];
    const idx = tasks.findIndex(tk => tk.id === taskId);
    if (idx < 0) return;
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= tasks.length) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Swap
    [tasks[idx], tasks[newIdx]] = [tasks[newIdx], tasks[idx]];

    // Build updates array for Convex: { id, order }[]
    const updates = tasks.map((tk, i) => ({
      id: toConvexId<'tasks'>(tk.id),
      order: i,
    }));

    // Persist via Convex (best effort)
    try {
      reorderTasks({ updates });
    } catch {
      // Silent fail — local reorder still works visually
    }
  }, [room, reorderTasks]);

  const handleSkipTask = useCallback((taskId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSkippedTaskIds(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  }, []);

  const handleToggleTask = useCallback((taskId: string) => {
    if (!room) return;

    // Check completion BEFORE toggling so we know the task's current state
    const task = allTasks.find(tk => tk.id === taskId);
    const isBeingCompleted = task && !task.completed;
    const willBeComplete = isBeingCompleted && completedTasks + 1 >= activeTasks;

    // Task dependency awareness — show hint, don't block
    if (isBeingCompleted && task?.dependencies && task.dependencies.length > 0) {
      const incompleteDeps = task.dependencies
        .map((depId: string) => allTasks.find(tk => tk.id === depId))
        .filter((dep): dep is CleaningTask => !!dep && !dep.completed);
      if (incompleteDeps.length > 0) {
        const depName = incompleteDeps[0].title;
        setDependencyHint(`Tip: Complete '${depName}' first for best results`);
        if (dependencyHintTimeoutRef.current) clearTimeout(dependencyHintTimeoutRef.current);
        dependencyHintTimeoutRef.current = setTimeout(() => {
          setDependencyHint(null);
        }, 3000);
      }
    }

    if (isBeingCompleted) {
      // H6: Track combo
      if (comboTimeoutRef.current) clearTimeout(comboTimeoutRef.current);
      setComboCount(prev => prev + 1);
      comboTimeoutRef.current = setTimeout(() => {
        setComboCount(0);
      }, 60000);

      // H6: Enhanced haptic for multi-completions
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (comboCount >= 2) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }
      // Show XP float-up and mascot reaction
      setXpFloatTaskId(taskId);
      setMascotReactionTaskId(taskId);

      // Show undo toast
      if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
      setUndoTask({ id: taskId, title: task.title });
      undoTimeoutRef.current = setTimeout(() => {
        setUndoTask(null);
      }, 4000);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      // Clear undo toast if user manually uncompletes
      setUndoTask(null);
    }

    try {
      toggleTask(room.id, taskId);
    } catch (err) {
      // Revert optimistic UI state on failure
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Oops',
        "Couldn't save that change. Please try again.",
        [{ text: 'OK' }],
      );
      // Clear undo toast since the toggle didn't persist
      setUndoTask(null);
      return;
    }

    if (willBeComplete) {
      setShowCompletionPrompt(true);
    }
  }, [room, toggleTask, allTasks, completedTasks, totalTasks, activeTasks, comboCount]);

  const handleGoToComplete = useCallback(() => {
    if (!room) return;
    setShowCompletionPrompt(false);
    router.push({
      pathname: '/room-complete',
      params: {
        roomId: room.id,
        roomName: room.name,
        tasksCompleted: String(totalTasks),
        timeSpent: String(allTasks.reduce((sum, tk) => sum + (tk.estimatedMinutes || 3), 0)),
      },
    });
  }, [room, totalTasks, allTasks]);

  // "Good Enough" handler -- celebrate whatever progress was made
  const handleGoodEnough = useCallback(() => {
    if (!room) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.push({
      pathname: '/session-complete',
      params: {
        tasksCompleted: String(completedTasks),
        timeSpent: String(allTasks.filter(tk => tk.completed).reduce((s, tk) => s + (tk.actualMinutes || tk.estimatedMinutes || 3), 0)),
        xpEarned: String(completedTasks * 10),
        roomId: room.id,
        roomName: room.name,
      },
    });
  }, [room, completedTasks, allTasks]);

  // "One Tiny Thing" -- jump to single-task with the first incomplete task
  const handleOneTinyThing = useCallback(() => {
    if (!room) return;
    const firstIncomplete = remainingTasks[0];
    if (!firstIncomplete) return;
    setActiveRoom(room.id);
    router.push({
      pathname: '/single-task',
      params: { roomId: room.id, taskId: firstIncomplete.id },
    });
  }, [room, remainingTasks, setActiveRoom]);

  // Render a task card with skip support. Used across all view modes.
  const renderTaskCard = useCallback((task: CleaningTask, { showImpactChip = false }: { showImpactChip?: boolean } = {}) => {
    const isExpanded = expandedTaskId === task.id;
    const isSkipped = skippedTaskIds.has(task.id);

    return (
      <View key={task.id} style={{ position: 'relative' }}>
        {xpFloatTaskId === task.id && (
          <XPFloatUp xp={10} onDone={() => setXpFloatTaskId(null)} />
        )}
        <MascotTaskReaction
          visible={mascotReactionTaskId === task.id}
          onDone={() => setMascotReactionTaskId(null)}
        />
        <View
          style={[
            styles.taskCard,
            {
              backgroundColor: t.card,
              borderColor: t.border,
              borderLeftColor: getTaskAccent(task),
            },
            isSkipped && { opacity: 0.45 },
          ]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            {/* Drag handle for reorder */}
            {reorderMode && !task.completed && (
              <View style={{ gap: 2 }}>
                <Pressable
                  onPress={() => handleMoveTask(task.id, 'up')}
                  hitSlop={4}
                  accessibilityRole="button"
                  accessibilityLabel={`Move ${task.title} up`}
                  style={{ padding: 2 }}
                >
                  <ChevronUp size={14} color={t.textMuted} />
                </Pressable>
                <GripVertical size={14} color={t.textMuted} />
                <Pressable
                  onPress={() => handleMoveTask(task.id, 'down')}
                  hitSlop={4}
                  accessibilityRole="button"
                  accessibilityLabel={`Move ${task.title} down`}
                  style={{ padding: 2 }}
                >
                  <ChevronDown size={14} color={t.textMuted} />
                </Pressable>
              </View>
            )}
            <Pressable
              onPress={() => handleToggleTask(task.id)}
              accessibilityRole="checkbox"
              accessibilityLabel={`${task.completed ? 'Undo' : 'Complete'} task: ${task.title}`}
              hitSlop={8}
            >
              <View style={[
                styles.checkbox,
                task.completed
                  ? { backgroundColor: V1.green, borderColor: V1.green }
                  : { borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)' },
              ]}>
                {task.completed && (
                  <Check size={16} color="#FFFFFF" strokeWidth={3} />
                )}
              </View>
            </Pressable>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setExpandedTaskId(isExpanded ? null : task.id);
              }}
              style={{ flex: 1 }}
              accessibilityRole="button"
              accessibilityLabel={`${isExpanded ? 'Collapse' : 'Expand'} details for: ${task.title}`}
            >
              <View style={styles.taskContent}>
                <Text
                  style={[
                    styles.taskTitle,
                    { color: (task.completed || isSkipped) ? t.textMuted : t.text },
                    (task.completed || isSkipped) && styles.taskTitleCompleted,
                  ]}
                  numberOfLines={isExpanded ? undefined : 1}
                >
                  {task.title}
                </Text>
                <View style={styles.taskMeta}>
                  <Clock size={12} color={t.textMuted} />
                  <Text style={[styles.taskTime, { color: t.textMuted }]}>
                    {task.estimatedMinutes || 3} min
                  </Text>
                  {isSkipped && (
                    <Text style={{ fontSize: 11, color: t.textMuted, fontFamily: BODY_FONT, marginLeft: 4 }}>Skipped</Text>
                  )}
                  {showImpactChip && task.visualImpact === 'high' && !task.completed && !isSkipped && (
                    <View style={styles.impactChip}>
                      <Sparkles size={10} color={V1.gold} />
                      <Text style={styles.impactChipText}>High Impact</Text>
                    </View>
                  )}
                </View>
              </View>
            </Pressable>
            {!task.completed && (
              <Pressable
                onPress={() => handleSkipTask(task.id)}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityLabel={isSkipped ? `Unskip task: ${task.title}` : `Skip task: ${task.title}`}
                style={[styles.skipButton, isSkipped && styles.skipButtonActive]}
              >
                <X size={14} color={isSkipped ? V1.coral : t.textMuted} />
              </Pressable>
            )}
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setExpandedTaskId(isExpanded ? null : task.id);
              }}
              hitSlop={8}
            >
              {isExpanded ? (
                <ChevronUp size={16} color={t.textMuted} />
              ) : (
                <ChevronDown size={16} color={t.textMuted} />
              )}
            </Pressable>
          </View>
          {isExpanded && (
            <TaskDetailPanel task={task} roomId={room!.id} isDark={isDark} onToggleSubTask={toggleSubTask} />
          )}
        </View>
      </View>
    );
  }, [expandedTaskId, xpFloatTaskId, mascotReactionTaskId, skippedTaskIds, reorderMode, t, isDark, handleToggleTask, handleSkipTask, handleMoveTask, room, toggleSubTask]);

  const handleStartBlitz = useCallback(() => {
    if (!room) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setActiveRoom(room.id);
    router.push('/blitz');
  }, [room, setActiveRoom]);

  if (!room) {
    return (
      <View style={[styles.container, { backgroundColor: t.bg }]}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>{'\uD83C\uDFE0'}</Text>
          <Text style={{ color: t.text, fontSize: 18, fontWeight: '600', marginBottom: 8, textAlign: 'center', fontFamily: DISPLAY_FONT }}>Room not found</Text>
          <Text style={{ color: t.textSecondary, fontSize: 14, textAlign: 'center', marginBottom: 24, fontFamily: BODY_FONT }}>
            This room may have been deleted.
          </Text>
          <Pressable
            onPress={() => router.replace('/(tabs)/rooms')}
            accessibilityRole="button"
            accessibilityLabel="Go to Rooms"
            style={{
              backgroundColor: V1.coral,
              paddingVertical: 12,
              paddingHorizontal: 24,
              borderRadius: 12,
            }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600', fontFamily: BODY_FONT }}>Go to Rooms</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={V1.coral}
            colors={[V1.coral]}
          />
        }
      >
        {/* ── Hero Photo Header (extracted component) ──────────── */}
        <RoomHeader
          room={room}
          progress={progress}
          freshnessLabel={freshness.label}
          freshnessColor={freshness.color}
          isDark={isDark}
          aiSummary={room.aiSummary}
        />

        {/* ── Progress Ring + Stats (extracted component) ──────── */}
        <RoomProgress
          completedTasks={completedTasks}
          totalTasks={totalTasks}
          remainingMinutes={totalRemainingMinutes}
          skippedCount={skippedCount}
          isDark={isDark}
        />

        {/* ── One Tiny Thing + Good Enough CTAs ── */}
        <RoomActions
          isDark={isDark}
          progress={progress}
          hasIncompleteTasks={remainingTasks.length > 0}
          firstIncompleteTask={remainingTasks[0] ?? null}
          onStartBlitz={handleStartBlitz}
          onOneTinyThing={handleOneTinyThing}
          onGoodEnough={handleGoodEnough}
        />

        {/* ── Doom Piles (from analysis, if available) ──────────── */}
        {(room as any).doomPiles && (room as any).doomPiles.length > 0 && (
          <View style={{ marginTop: 8, marginBottom: 8 }}>
            <Text style={{
              fontFamily: BODY_FONT,
              fontSize: 13,
              fontWeight: '700',
              color: V1.coral,
              letterSpacing: 0.5,
              textTransform: 'uppercase',
              marginHorizontal: 20,
              marginBottom: 8,
            }}>
              Doom Piles
            </Text>
            {(room as any).doomPiles.map((pile: any, i: number) => (
              <DoomPileCard
                key={i}
                doomPile={pile}
                index={i}
                onStart={() => {
                  if (!room) return;
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setActiveRoom(room.id);
                  router.push('/blitz');
                }}
                onSkip={() => {}}
              />
            ))}
          </View>
        )}

        {/* ── Zone Progress Summary ──────────────────────────────── */}
        {zoneTasks.size > 1 && (
          <View style={styles.zoneSummary}>
            {Array.from(zoneTasks.entries()).map(([zoneName, tasks]) => {
              const done = tasks.filter(tk => tk.completed).length;
              const total = tasks.length;
              const pct = total > 0 ? (done / total) * 100 : 0;
              return (
                <View key={zoneName} style={styles.zoneRow}>
                  <Text style={[styles.zoneLabel, { color: t.textSecondary }]} numberOfLines={1}>
                    {zoneName}
                  </Text>
                  <View style={[styles.zoneBarTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
                    <View style={[styles.zoneBarFill, { width: `${Math.max(pct, 3)}%`, backgroundColor: pct >= 100 ? V1.green : V1.amber }]} />
                  </View>
                  <Text style={[styles.zoneFraction, { color: pct >= 100 ? V1.green : t.textMuted }]}>
                    {done}/{total}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* ── Focus View Toggle + Energy Filter ──────────────────── */}
        <View style={styles.viewToggleRow}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setFocusViewEnabled(f => !f);
            }}
            accessibilityRole="button"
            accessibilityLabel={focusViewEnabled ? 'Switch to list view' : 'Switch to focus view (one task at a time)'}
            style={[styles.viewToggleButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}
          >
            <Eye size={14} color={focusViewEnabled ? V1.coral : t.textSecondary} />
            <Text style={[styles.viewToggleText, { color: focusViewEnabled ? V1.coral : t.textSecondary }]}>
              {focusViewEnabled ? 'Show List' : 'Focus Mode'}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setEnergyFilterEnabled(f => !f);
            }}
            accessibilityRole="button"
            accessibilityLabel={energyFilterEnabled ? 'Show all tasks' : 'Filter tasks by energy level'}
            style={[styles.viewToggleButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}
          >
            <Flame size={14} color={energyFilterEnabled ? V1.amber : t.textSecondary} />
            <Text style={[styles.viewToggleText, { color: energyFilterEnabled ? V1.amber : t.textSecondary }]}>
              {energyFilterEnabled ? 'All Tasks' : 'My Energy'}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setViewByZone(z => !z);
            }}
            accessibilityRole="button"
            accessibilityLabel={viewByZone ? 'View by phase' : 'View by zone'}
            style={[styles.viewToggleButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}
          >
            <MapPin size={14} color={viewByZone ? V1.blue : t.textSecondary} />
            <Text style={[styles.viewToggleText, { color: viewByZone ? V1.blue : t.textSecondary }]}>
              {viewByZone ? 'By Phase' : 'By Zone'}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setReorderMode(r => !r);
            }}
            accessibilityRole="button"
            accessibilityLabel={reorderMode ? 'Exit reorder mode' : 'Reorder tasks'}
            style={[styles.viewToggleButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}
          >
            <GripVertical size={14} color={reorderMode ? V1.coral : t.textSecondary} />
            <Text style={[styles.viewToggleText, { color: reorderMode ? V1.coral : t.textSecondary }]}>
              {reorderMode ? 'Done' : 'Reorder'}
            </Text>
          </Pressable>
        </View>

        {/* ── FOCUS VIEW: One task prominently (default) ──────────── */}
        {focusViewEnabled ? (() => {
          const focusTask = remainingTasks[0];
          if (!focusTask) {
            return (
              <View style={styles.emptyPhase}>
                <Text style={{ fontSize: 32, marginBottom: 8 }}>{'\u2728'}</Text>
                <Text style={[styles.emptyPhaseText, { color: t.text, fontWeight: '600' }]}>All tasks done!</Text>
              </View>
            );
          }
          return (
            <View style={{ paddingHorizontal: 20, paddingTop: 12, gap: 12 }}>
              {/* Prominent focus card */}
              <Animated.View
                entering={reducedMotion ? undefined : FadeInDown.duration(300)}
                style={[styles.focusCard, {
                  backgroundColor: t.card,
                  borderColor: t.border,
                  borderLeftColor: V1.coral,
                }]}
              >
                <Text style={{ fontFamily: BODY_FONT, fontSize: 11, fontWeight: '700', color: V1.coral, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 }}>
                  UP NEXT
                </Text>
                <Text style={{ fontFamily: DISPLAY_FONT, fontSize: 22, fontWeight: '700', color: t.text, letterSpacing: -0.3, marginBottom: 8 }}>
                  {focusTask.title}
                </Text>
                {focusTask.description && (
                  <Text style={{ fontFamily: BODY_FONT, fontSize: 14, color: t.textSecondary, lineHeight: 20, marginBottom: 8 }}>
                    {focusTask.description}
                  </Text>
                )}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Clock size={14} color={t.textMuted} />
                    <Text style={{ fontFamily: BODY_FONT, fontSize: 13, color: t.textMuted }}>
                      ~{focusTask.estimatedMinutes || 3} min
                    </Text>
                  </View>
                  {focusTask.zone && (
                    <Text style={{ fontFamily: BODY_FONT, fontSize: 13, color: t.textMuted }}>
                      {focusTask.zone}
                    </Text>
                  )}
                </View>
                {/* Subtasks preview */}
                {focusTask.subtasks && focusTask.subtasks.length > 0 && (
                  <View style={{ marginTop: 10, gap: 6 }}>
                    {focusTask.subtasks.slice(0, 3).map((st, idx) => (
                      <View key={st.id || idx} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View style={{ width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)', alignItems: 'center', justifyContent: 'center' }}>
                          <Text style={{ fontSize: 9, fontWeight: '700', color: t.textMuted }}>{idx + 1}</Text>
                        </View>
                        <Text style={{ fontFamily: BODY_FONT, fontSize: 13, color: t.textSecondary, flex: 1 }} numberOfLines={1}>
                          {st.title}
                        </Text>
                      </View>
                    ))}
                    {focusTask.subtasks.length > 3 && (
                      <Text style={{ fontFamily: BODY_FONT, fontSize: 12, color: t.textMuted, marginLeft: 26 }}>
                        +{focusTask.subtasks.length - 3} more steps
                      </Text>
                    )}
                  </View>
                )}
              </Animated.View>

              {/* One Tiny Thing CTA */}
              <Pressable
                onPress={handleOneTinyThing}
                accessibilityRole="button"
                accessibilityLabel={`Start task: ${focusTask.title}`}
                style={[styles.oneTinyThingButton, { backgroundColor: V1.coral }]}
              >
                <Text style={{ fontFamily: BODY_FONT, fontSize: 16, fontWeight: '700', color: '#FFFFFF' }}>
                  One Tiny Thing
                </Text>
              </Pressable>

              {/* See all tasks toggle */}
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setFocusViewEnabled(false);
                }}
                style={{ paddingVertical: 8, alignItems: 'center' }}
                accessibilityRole="button"
                accessibilityLabel={`See all ${allTasks.length} tasks`}
              >
                <Text style={{ fontFamily: BODY_FONT, fontSize: 14, fontWeight: '500', color: V1.coral }}>
                  See all {allTasks.length} tasks
                </Text>
              </Pressable>

              {/* Remaining count */}
              {remainingTasks.length > 1 && (
                <Text style={{ fontFamily: BODY_FONT, fontSize: 13, color: t.textMuted, textAlign: 'center' }}>
                  {remainingTasks.length - 1} more task{remainingTasks.length - 1 !== 1 ? 's' : ''} after this
                </Text>
              )}
            </View>
          );
        })() : viewByZone ? (
          <>
            {/* ── ZONE VIEW ──────────────────────────────────────────── */}
            {Array.from(zoneTasks.entries()).map(([zoneName, zTasks], zoneIndex) => {
              const zoneRemaining = zTasks.filter(tk => !tk.completed).length;
              const zoneMinutes = zTasks.filter(tk => !tk.completed).reduce((sum, tk) => sum + (tk.estimatedMinutes || 3), 0);
              return (
                <Animated.View
                  key={zoneName}
                  entering={reducedMotion ? undefined : FadeInDown.delay(zoneIndex * 60).duration(300)}
                >
                  <View style={styles.zoneHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <MapPin size={14} color={V1.blue} />
                      <Text style={[styles.zoneHeaderTitle, { color: t.text }]}>{zoneName}</Text>
                    </View>
                    <Text style={[styles.zoneHeaderMeta, { color: t.textMuted }]}>
                      {zoneRemaining} task{zoneRemaining !== 1 ? 's' : ''} {'\u00B7'} ~{zoneMinutes} min
                    </Text>
                  </View>
                  <View style={styles.taskList}>
                    {zTasks.map((task) => renderTaskCard(task))}
                  </View>
                </Animated.View>
              );
            })}
          </>
        ) : (
          <>
            {/* ── LIST VIEW (Phase-based) ────────────────────────────── */}
            {!showAllPhases ? (
              <>
                {/* Simple header */}
                <View style={styles.simpleHeader}>
                  <Text style={[styles.simpleHeaderTitle, { color: t.text }]}>
                    Quick Wins
                  </Text>
                </View>

                {/* Quick Wins task list only */}
                <View style={styles.taskList}>
                  {phaseTasks.quickWins.length === 0 ? (
                    <View style={styles.emptyPhase}>
                      <Text style={[styles.emptyPhaseText, { color: t.textMuted }]}>
                        No quick win tasks
                      </Text>
                    </View>
                  ) : (
                    phaseTasks.quickWins.map((task, index) => (
                      <Animated.View
                        key={task.id}
                        entering={reducedMotion ? undefined : FadeInDown.delay(index * 40).duration(300)}
                        style={{ position: 'relative' }}
                      >
                        {renderTaskCard(task, { showImpactChip: true })}
                      </Animated.View>
                    ))
                  )}
                </View>

                {/* "Show all phases" link */}
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setShowAllPhases(true);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Show all ${allTasks.length} tasks across all phases`}
                  style={{ paddingVertical: 12, alignItems: 'center' }}
                >
                  <Text style={{ color: V1.coral, fontSize: 14, fontWeight: '500', fontFamily: BODY_FONT }}>
                    Show all {allTasks.length} tasks {'\u2192'}
                  </Text>
                </Pressable>
              </>
            ) : (
              <>
                {/* ── Full view: Phase Tabs ─────────────────────────── */}

                {/* Phase Tabs */}
                <View style={styles.phaseTabs} accessibilityRole="tablist">
                  {PHASES.map(phase => {
                    const isActive = activePhase === phase.key;
                    const count = phaseTasks[phase.key].filter(tk => !tk.completed).length;
                    return (
                      <Pressable
                        key={phase.key}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setActivePhase(phase.key);
                        }}
                        accessibilityRole="tab"
                        accessibilityLabel={`${phase.label}, ${count} tasks remaining`}
                        accessibilityState={{ selected: isActive }}
                        accessibilityHint={`Double tap to view ${phase.label} tasks`}
                        style={[
                          styles.phaseTab,
                          isActive && { backgroundColor: V1.coral },
                        ]}
                      >
                        <Text style={[
                          styles.phaseTabText,
                          { color: isActive ? '#FFFFFF' : t.textSecondary },
                        ]}>
                          {phase.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {/* Task List */}
                <View style={styles.taskList}>
                  {currentPhaseTasks.length === 0 ? (
                    <View style={styles.emptyPhase}>
                      <Text style={[styles.emptyPhaseText, { color: t.textMuted }]}>
                        No tasks in this phase
                      </Text>
                    </View>
                  ) : (
                    currentPhaseTasks.map((task, index) => (
                      <Animated.View
                        key={task.id}
                        entering={reducedMotion ? undefined : FadeInDown.delay(index * 40).duration(300)}
                        style={{ position: 'relative' }}
                      >
                        {renderTaskCard(task, { showImpactChip: true })}
                      </Animated.View>
                    ))
                  )}
                </View>
              </>
            )}
          </>
        )}

        {/* ── Inline Completion Prompt ─────────────────────────────── */}
        {showCompletionPrompt && (
          <Animated.View
            entering={reducedMotion ? undefined : FadeInDown.duration(300)}
            style={[styles.completionPrompt, { backgroundColor: isDark ? V1.dark.cardElevated : '#F0FFF0', borderColor: V1.green }]}
          >
            <Text style={{ fontSize: 28, textAlign: 'center', marginBottom: 8 }}>{'\u2728'}</Text>
            <Text style={[styles.completionTitle, { color: t.text }]}>Room Complete!</Text>
            <Text style={[styles.completionSubtitle, { color: t.textSecondary }]}>
              Amazing work. Ready to see your results?
            </Text>
            <Pressable
              onPress={handleGoToComplete}
              style={[styles.completionButton, { backgroundColor: V1.green }]}
              accessibilityRole="button"
              accessibilityLabel="View completion summary"
            >
              <Text style={styles.completionButtonText}>See Results</Text>
            </Pressable>
          </Animated.View>
        )}
      </ScrollView>

      {/* ── H6: Combo Badge ──────────────────────────────────────── */}
      {comboCount > 1 && (
        <Animated.View
          entering={reducedMotion ? undefined : FadeInDown.springify()}
          style={styles.comboBadge}
        >
          <Text style={styles.comboBadgeText}>
            {comboCount}x Combo! {'\uD83D\uDD25'}
          </Text>
        </Animated.View>
      )}

      {/* ── Undo Toast ─────────────────────────────────────────── */}
      {undoTask && (
        <Animated.View
          entering={reducedMotion ? undefined : FadeInDown.duration(250)}
          style={[styles.undoToast, { bottom: insets.bottom + 80, backgroundColor: isDark ? '#2A2A2A' : '#333333' }]}
        >
          <Text style={styles.undoToastText} numberOfLines={1}>
            Task complete!
          </Text>
          <Pressable
            onPress={() => {
              if (room && undoTask) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                toggleTask(room.id, undoTask.id);
                setUndoTask(null);
                if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
              }
            }}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Undo task completion"
          >
            <Text style={styles.undoToastButton}>Undo</Text>
          </Pressable>
        </Animated.View>
      )}

      {/* ── Dependency Hint Toast ────────────────────────────────── */}
      {dependencyHint && (
        <Animated.View
          entering={reducedMotion ? undefined : FadeInDown.duration(250)}
          style={[styles.dependencyHintToast, { bottom: insets.bottom + 130, backgroundColor: isDark ? 'rgba(255,183,77,0.95)' : 'rgba(255,183,77,0.95)' }]}
        >
          <Text style={styles.dependencyHintText}>{dependencyHint}</Text>
        </Animated.View>
      )}

      {/* ── Floating Blitz + Add Task CTAs ────────────────────── */}
      {!showCompletionPrompt && (
        <View style={[styles.floatingCta, { paddingBottom: insets.bottom + 16 }]}>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {allTasks.some(tk => !tk.completed) && (
              <Pressable
                onPress={handleStartBlitz}
                accessibilityRole="button"
                accessibilityLabel="Start a 15-minute blitz cleaning session"
              >
                <View style={[styles.blitzButton, { backgroundColor: V1.coral }]}>
                  <Flame size={18} color="#FFFFFF" />
                  <Text style={styles.blitzButtonText}>15-Min Blitz</Text>
                </View>
              </Pressable>
            )}
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowAddTaskModal(true);
              }}
              accessibilityRole="button"
              accessibilityLabel="Add a new task"
            >
              <View style={[styles.blitzButton, { backgroundColor: isDark ? V1.dark.cardElevated : '#FFFFFF', borderWidth: 1.5, borderColor: V1.coral }]}>
                <Plus size={18} color={V1.coral} />
                <Text style={[styles.blitzButtonText, { color: V1.coral }]}>Add Task</Text>
              </View>
            </Pressable>
          </View>
        </View>
      )}

      {/* ── Add Task Modal ─────────────────────────────────────── */}
      <Modal
        visible={showAddTaskModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddTaskModal(false)}
      >
        <Pressable
          style={styles.addTaskOverlay}
          onPress={() => setShowAddTaskModal(false)}
        >
          <Pressable
            style={[styles.addTaskModal, { backgroundColor: isDark ? V1.dark.card : '#FFFFFF' }]}
            onPress={() => {}}
          >
            <Text style={[styles.addTaskModalTitle, { color: t.text }]}>Add a Task</Text>

            <TextInput
              placeholder="What needs doing?"
              placeholderTextColor={t.textMuted}
              value={newTaskTitle}
              onChangeText={setNewTaskTitle}
              autoFocus
              style={[
                styles.addTaskInput,
                {
                  color: t.text,
                  backgroundColor: isDark ? V1.dark.inputBg : V1.light.inputBg,
                  borderColor: isDark ? V1.dark.inputBorder : V1.light.inputBorder,
                },
              ]}
            />

            <Text style={[styles.addTaskLabel, { color: t.textSecondary }]}>Difficulty</Text>
            <View style={styles.addTaskDifficultyRow}>
              {(['quick', 'medium', 'challenging'] as const).map((diff) => {
                const isSelected = newTaskDifficulty === diff;
                const label = diff === 'quick' ? 'Quick (5m)' : diff === 'medium' ? 'Medium (15m)' : 'Hard (30m)';
                return (
                  <Pressable
                    key={diff}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setNewTaskDifficulty(diff);
                    }}
                    style={[
                      styles.addTaskDifficultyButton,
                      {
                        backgroundColor: isSelected ? V1.coral : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'),
                        borderColor: isSelected ? V1.coral : t.border,
                      },
                    ]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    accessibilityLabel={label}
                  >
                    <Text style={[
                      styles.addTaskDifficultyText,
                      { color: isSelected ? '#FFFFFF' : t.textSecondary },
                    ]}>
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.addTaskActions}>
              <Pressable
                onPress={() => setShowAddTaskModal(false)}
                style={[styles.addTaskCancelButton, { borderColor: t.border }]}
                accessibilityRole="button"
                accessibilityLabel="Cancel"
              >
                <Text style={[styles.addTaskCancelText, { color: t.textSecondary }]}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleAddTask}
                disabled={!newTaskTitle.trim()}
                style={[
                  styles.addTaskSubmitButton,
                  { backgroundColor: V1.coral, opacity: newTaskTitle.trim() ? 1 : 0.5 },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Add task"
              >
                <Text style={styles.addTaskSubmitText}>Add Task</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

export default function RoomDetailScreen() {
  return (
    <ScreenErrorBoundary screenName="room/[id]">
      <RoomDetailContent />
    </ScreenErrorBoundary>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },

  // Hero styles are now in RoomHeader component

  // Zone progress summary
  zoneSummary: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 4,
    gap: 6,
  },
  zoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  zoneLabel: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: BODY_FONT,
    width: 80,
  },
  zoneBarTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  zoneBarFill: {
    height: 4,
    borderRadius: 2,
  },
  zoneFraction: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: BODY_FONT,
    width: 30,
    textAlign: 'right',
  },

  // Focus mode card (default single-task view)
  focusCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderLeftWidth: 4,
  },
  oneTinyThingButton: {
    paddingVertical: 16,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },

  // H1: Simple header with filter icon
  simpleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 4,
  },
  simpleHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: DISPLAY_FONT,
  },
  filterIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // H6: Combo badge
  comboBadge: {
    position: 'absolute',
    top: 100,
    alignSelf: 'center',
    backgroundColor: V1.coral,
    borderRadius: 9999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    zIndex: 100,
  },
  comboBadgeText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
    fontFamily: DISPLAY_FONT,
  },

  // Energy Filters (Task 1)
  energyFilters: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 2,
    gap: 8,
  },
  energyFilterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  energyFilterEmoji: {
    fontSize: 12,
  },
  energyFilterText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: BODY_FONT,
  },

  // Phase Tabs
  phaseTabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 8,
    gap: 8,
  },
  phaseTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  phaseTabText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: BODY_FONT,
  },

  // Task List
  taskList: {
    paddingHorizontal: 20,
    gap: 8,
    paddingTop: 8,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderLeftWidth: 3,
    gap: 14,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskContent: {
    flex: 1,
    gap: 4,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: BODY_FONT,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    opacity: 0.5,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  taskTime: {
    fontSize: 12,
    fontFamily: BODY_FONT,
  },
  // Visual Impact chip (Task 2)
  impactChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255,213,79,0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
  },
  impactChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFD54F',
    fontFamily: BODY_FONT,
  },
  emptyPhase: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyPhaseText: {
    fontSize: 15,
    fontFamily: BODY_FONT,
  },

  // Floating CTA
  floatingCta: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingTop: 12,
  },
  blitzButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 28,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  blitzButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: BODY_FONT,
  },

  // Focus view toggle
  viewToggleRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  viewToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  viewToggleText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: BODY_FONT,
  },

  // Zone view
  zoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 6,
  },
  zoneHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: DISPLAY_FONT,
  },
  zoneHeaderMeta: {
    fontSize: 12,
    fontFamily: BODY_FONT,
  },

  // Inline completion prompt
  completionPrompt: {
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    padding: 24,
    borderWidth: 2,
    alignItems: 'center',
    gap: 4,
  },
  completionTitle: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: DISPLAY_FONT,
    textAlign: 'center',
  },
  completionSubtitle: {
    fontSize: 14,
    fontFamily: BODY_FONT,
    textAlign: 'center',
    marginBottom: 12,
  },
  completionButton: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 24,
  },
  completionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: BODY_FONT,
  },

  // Undo toast
  undoToast: {
    position: 'absolute',
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 50,
  },
  undoToastText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    fontFamily: BODY_FONT,
    flex: 1,
  },
  undoToastButton: {
    color: V1.coral,
    fontSize: 15,
    fontWeight: '700',
    fontFamily: BODY_FONT,
    marginLeft: 16,
  },

  // Dependency hint toast
  dependencyHintToast: {
    position: 'absolute',
    left: 20,
    right: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 60,
  },
  dependencyHintText: {
    color: '#333333',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: BODY_FONT,
    textAlign: 'center',
  },

  // Skip button
  skipButton: {
    padding: 4,
    borderRadius: 12,
    opacity: 0.5,
  },
  skipButtonActive: {
    opacity: 1,
  },

  // Add Task Modal
  addTaskOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  addTaskModal: {
    width: '100%',
    borderRadius: 20,
    padding: 24,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
  addTaskModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: DISPLAY_FONT,
    letterSpacing: -0.3,
  },
  addTaskInput: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: BODY_FONT,
  },
  addTaskLabel: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: BODY_FONT,
  },
  addTaskDifficultyRow: {
    flexDirection: 'row',
    gap: 8,
  },
  addTaskDifficultyButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  addTaskDifficultyText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: BODY_FONT,
  },
  addTaskActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  addTaskCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  addTaskCancelText: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: BODY_FONT,
  },
  addTaskSubmitButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  addTaskSubmitText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    fontFamily: BODY_FONT,
  },
});
