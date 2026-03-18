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

import { ChevronLeft, Clock, Check, Flame } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import Animated, {
  FadeInDown,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDeclutter } from '@/context/DeclutterContext';
import { CleaningTask } from '@/types/declutter';

// ─── V1 Design Tokens ────────────────────────────────────────────────────────
const V1 = {
  coral: '#FF6B6B',
  green: '#66BB6A',
  amber: '#FFB74D',
  gold: '#FFD54F',
  blue: '#64B5F6',
  dark: {
    bg: '#0C0C0C',
    card: '#1A1A1A',
    border: 'rgba(255,255,255,0.08)',
    text: '#FFFFFF',
    textSecondary: 'rgba(255,255,255,0.5)',
    textMuted: 'rgba(255,255,255,0.3)',
  },
  light: {
    bg: '#FAFAFA',
    card: '#F6F7F8',
    border: '#E5E7EB',
    text: '#1A1A1A',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',
  },
};

// ─── Phase definitions ───────────────────────────────────────────────────────
type Phase = 'quickWins' | 'deepClean' | 'organize';
const PHASES: { key: Phase; label: string }[] = [
  { key: 'quickWins', label: 'Quick Wins' },
  { key: 'deepClean', label: 'Deep Clean' },
  { key: 'organize', label: 'Organize' },
];

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
  // Quick wins: fast or high visual impact
  if ((task.estimatedMinutes || 0) <= 3 || task.difficulty === 'quick') return 'quickWins';
  // Organize: organizational tasks
  if (task.category === 'organization' || task.category === 'donation_sorting') return 'organize';
  // Deep clean: everything else
  return 'deepClean';
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Room Detail Screen
// ─────────────────────────────────────────────────────────────────────────────
export default function RoomDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const rawScheme = useColorScheme();
  const isDark = rawScheme === 'dark';
  const t = isDark ? V1.dark : V1.light;
  const insets = useSafeAreaInsets();
  const { rooms, toggleTask, setActiveRoom } = useDeclutter();

  const room = rooms.find(r => r.id === id);
  const [activePhase, setActivePhase] = useState<Phase>('quickWins');

  const allTasks = room?.tasks || [];
  const totalTasks = allTasks.length;
  const completedTasks = allTasks.filter(t => t.completed).length;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  const freshness = getFreshnessInfo(progress);

  // Group tasks by phase
  const phaseTasks = useMemo(() => {
    const grouped: Record<Phase, CleaningTask[]> = {
      quickWins: [],
      deepClean: [],
      organize: [],
    };
    allTasks.forEach(task => {
      const phase = classifyPhase(task);
      grouped[phase].push(task);
    });
    return grouped;
  }, [allTasks]);

  const currentPhaseTasks = phaseTasks[activePhase];

  const handleToggleTask = useCallback((taskId: string) => {
    if (!room) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    toggleTask(room.id, taskId);

    // Check if room is complete after toggle
    const task = allTasks.find(t => t.id === taskId);
    if (task && !task.completed) {
      // Task is being marked as complete
      const willBeComplete = completedTasks + 1 >= totalTasks;
      if (willBeComplete) {
        setTimeout(() => {
          (router.push as any)({
            pathname: '/room-complete',
            params: {
              roomId: room.id,
              roomName: room.name,
              tasksCompleted: String(totalTasks),
              timeSpent: String(allTasks.reduce((sum, t) => sum + (t.estimatedMinutes || 3), 0)),
            },
          });
        }, 600);
      }
    }
  }, [room, toggleTask, allTasks, completedTasks, totalTasks]);

  const handleStartBlitz = useCallback(() => {
    if (!room) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setActiveRoom(room.id);
    router.push('/blitz' as any);
  }, [room, setActiveRoom]);

  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, []);

  if (!room) {
    return (
      <View style={[styles.container, { backgroundColor: t.bg }]}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: t.text, fontSize: 16 }}>Room not found</Text>
        </View>
      </View>
    );
  }

  const photoUri = room.photos?.[0]?.uri;

  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero Photo Header ──────────────────────────────────── */}
        <View style={styles.heroSection}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.heroPhoto} contentFit="cover" />
          ) : (
            <View style={[styles.heroPhoto, { backgroundColor: isDark ? '#2A2A2A' : '#D0D0D0' }]} />
          )}
          <LinearGradient
            colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
            style={styles.heroGradient}
          />

          {/* Back button */}
          <Pressable
            onPress={handleBack}
            style={[styles.backButton, { top: insets.top + 8 }]}
            hitSlop={12}
          >
            <ChevronLeft size={24} color="#FFFFFF" />
          </Pressable>

          {/* Status pill */}
          <View style={[styles.statusPill, { top: insets.top + 8, backgroundColor: 'rgba(0,0,0,0.5)' }]}>
            <Text style={[styles.statusPillText, { color: freshness.color }]}>
              {freshness.label}
            </Text>
          </View>

          {/* Room name */}
          <View style={styles.heroBottom}>
            <Text style={styles.heroRoomName}>{room.name}</Text>
            {/* Progress bar */}
            <View style={styles.heroProgressBar}>
              <View style={[styles.heroProgressFill, { width: `${Math.max(progress, 3)}%`, backgroundColor: freshness.color }]} />
            </View>
          </View>
        </View>

        {/* ── Phase Tabs ─────────────────────────────────────────── */}
        <View style={styles.phaseTabs}>
          {PHASES.map(phase => {
            const isActive = activePhase === phase.key;
            return (
              <Pressable
                key={phase.key}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setActivePhase(phase.key);
                }}
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

        {/* ── Task List ──────────────────────────────────────────── */}
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
                entering={FadeInDown.delay(index * 40).duration(300)}
              >
                <Pressable
                  onPress={() => handleToggleTask(task.id)}
                  style={[
                    styles.taskCard,
                    {
                      backgroundColor: t.card,
                      borderColor: t.border,
                      borderLeftColor: getTaskAccent(task),
                    },
                  ]}
                >
                  {/* Checkbox */}
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

                  {/* Task content */}
                  <View style={styles.taskContent}>
                    <Text
                      style={[
                        styles.taskTitle,
                        { color: task.completed ? t.textMuted : t.text },
                        task.completed && styles.taskTitleCompleted,
                      ]}
                      numberOfLines={1}
                    >
                      {task.title}
                    </Text>
                    <View style={styles.taskMeta}>
                      <Clock size={12} color={t.textMuted} />
                      <Text style={[styles.taskTime, { color: t.textMuted }]}>
                        {task.estimatedMinutes || 3} min
                      </Text>
                    </View>
                  </View>
                </Pressable>
              </Animated.View>
            ))
          )}
        </View>
      </ScrollView>

      {/* ── Floating Blitz CTA ─────────────────────────────────── */}
      {allTasks.some(t => !t.completed) && (
        <View style={[styles.floatingCta, { paddingBottom: insets.bottom + 16 }]}>
          <Pressable onPress={handleStartBlitz}>
            <View style={[styles.blitzButton, { backgroundColor: V1.coral }]}>
              <Flame size={18} color="#FFFFFF" />
              <Text style={styles.blitzButtonText}>15-Min Blitz</Text>
            </View>
          </Pressable>
        </View>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },

  // Hero
  heroSection: {
    height: 240,
    position: 'relative',
  },
  heroPhoto: {
    ...StyleSheet.absoluteFillObject,
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  backButton: {
    position: 'absolute',
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  statusPill: {
    position: 'absolute',
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  heroBottom: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  heroRoomName: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  heroProgressBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  heroProgressFill: {
    height: 6,
    borderRadius: 3,
  },

  // Phase Tabs
  phaseTabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
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
  },
  emptyPhase: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyPhaseText: {
    fontSize: 15,
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
  },
});
