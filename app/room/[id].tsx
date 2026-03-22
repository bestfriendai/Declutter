/**
 * Declutterly -- Room Detail Screen (Simplified)
 *
 * - Room photo header with parallax + progress bar
 * - Simple flat task checklist
 * - Floating "Start 15-Min Blitz" CTA
 * - Empty state with camera prompt
 */

import { Check, Flame, Camera } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useMemo } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { V1, BODY_FONT, DISPLAY_FONT } from '@/constants/designTokens';
import { useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDeclutter } from '@/context/DeclutterContext';
import { ScreenErrorBoundary } from '@/components/ErrorBoundary';
import { RoomHeader } from '@/components/room';
import { CleaningTask } from '@/types/declutter';

// ─── Visual impact sort weight ──────────────────────────────────────────────
function getVisualImpactWeight(impact?: string): number {
  if (impact === 'high') return 0;
  if (impact === 'medium') return 1;
  return 2; // low or undefined
}

// ─── Freshness label ─────────────────────────────────────────────────────────
function getFreshnessInfo(progress: number): { label: string; color: string } {
  if (progress >= 90) return { label: 'Sparkling', color: V1.green };
  if (progress >= 60) return { label: 'Getting Fresh', color: V1.green };
  if (progress >= 30) return { label: 'In Progress', color: V1.amber };
  return { label: 'Needs Love', color: V1.coral };
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Room Detail Screen
// ─────────────────────────────────────────────────────────────────────────────
function RoomDetailContent() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const rawScheme = useColorScheme();
  const isDark = rawScheme === 'dark';
  const t = isDark ? V1.dark : V1.light;
  const insets = useSafeAreaInsets();
  const { rooms, toggleTask, setActiveRoom } = useDeclutter();
  const scrollY = useSharedValue(0);

  const room = rooms.find(r => r.id === id);

  // Sort tasks: incomplete first, then by visual impact
  const sortedTasks = useMemo(() => {
    const tasks = [...(room?.tasks || [])];
    tasks.sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return getVisualImpactWeight(a.visualImpact) - getVisualImpactWeight(b.visualImpact);
    });
    return tasks;
  }, [room?.tasks]);

  const totalTasks = sortedTasks.length;
  const completedTasks = sortedTasks.filter(tk => tk.completed).length;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  const freshness = getFreshnessInfo(progress);

  const handleToggleTask = useCallback((taskId: string) => {
    if (!room) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleTask(room.id, taskId);
  }, [room, toggleTask]);

  const handleStartBlitz = useCallback(() => {
    if (!room) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setActiveRoom(room.id);
    router.push('/blitz');
  }, [room, setActiveRoom]);

  // Room not found
  if (!room) {
    return (
      <View style={[styles.container, { backgroundColor: t.bg }]}>
        <View style={styles.notFound}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>{'\uD83C\uDFE0'}</Text>
          <Text style={[styles.notFoundTitle, { color: t.text }]}>Room not found</Text>
          <Text style={[styles.notFoundSubtitle, { color: t.textSecondary }]}>
            This room may have been deleted.
          </Text>
          <Pressable
            onPress={() => router.replace('/(tabs)/rooms')}
            accessibilityRole="button"
            accessibilityLabel="Go to Rooms"
            style={[styles.notFoundButton, { backgroundColor: V1.coral }]}
          >
            <Text style={styles.notFoundButtonText}>Go to Rooms</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // Empty state — no tasks yet
  if (totalTasks === 0) {
    return (
      <View style={[styles.container, { backgroundColor: t.bg }]}>
        <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false}>
          <RoomHeader
            room={room}
            progress={0}
            freshnessLabel="Needs Love"
            freshnessColor={V1.coral}
            scrollY={scrollY}
            isDark={isDark}
          />
          <View style={styles.emptyState}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>{'\uD83D\uDCF7'}</Text>
            <Text style={[styles.emptyTitle, { color: t.text }]}>Scan this room to get started</Text>
            <Text style={[styles.emptySubtitle, { color: t.textSecondary }]}>
              Take a photo and AI will create your cleaning checklist.
            </Text>
            <Pressable
              onPress={() => router.push('/camera')}
              accessibilityRole="button"
              accessibilityLabel="Open camera to scan room"
              style={[styles.cameraButton, { backgroundColor: V1.coral }]}
            >
              <Camera size={20} color="#FFFFFF" />
              <Text style={styles.cameraButtonText}>Scan Room</Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Photo Header */}
        <RoomHeader
          room={room}
          progress={progress}
          freshnessLabel={freshness.label}
          freshnessColor={freshness.color}
          scrollY={scrollY}
          isDark={isDark}
          aiSummary={room.aiSummary}
        />

        {/* Task List */}
        <View style={styles.taskList}>
          {sortedTasks.map((task: CleaningTask) => (
            <Pressable
              key={task.id}
              onPress={() => handleToggleTask(task.id)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: task.completed }}
              accessibilityLabel={`${task.completed ? 'Completed' : 'Incomplete'}: ${task.title}`}
              style={[styles.taskRow, { backgroundColor: t.card, borderColor: t.border }]}
            >
              {/* Checkbox */}
              <View
                style={[
                  styles.checkbox,
                  task.completed
                    ? { backgroundColor: V1.coral, borderColor: V1.coral }
                    : { borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)' },
                ]}
              >
                {task.completed && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
              </View>

              {/* Title + time */}
              <View style={styles.taskContent}>
                <Text
                  style={[
                    styles.taskTitle,
                    { color: task.completed ? t.textMuted : t.text },
                    task.completed && styles.taskTitleDone,
                  ]}
                  numberOfLines={2}
                >
                  {task.title}
                </Text>
                <Text style={[styles.taskTime, { color: t.textMuted }]}>
                  {task.estimatedMinutes || 3} min
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* Floating Blitz Button */}
      {sortedTasks.some(tk => !tk.completed) && (
        <View style={[styles.floatingCta, { paddingBottom: insets.bottom + 16 }]}>
          <Pressable
            onPress={handleStartBlitz}
            accessibilityRole="button"
            accessibilityLabel="Start a 15-minute blitz cleaning session"
            style={[styles.blitzButton, { backgroundColor: V1.coral }]}
          >
            <Flame size={18} color="#FFFFFF" />
            <Text style={styles.blitzButtonText}>Start 15-Min Blitz</Text>
          </Pressable>
        </View>
      )}
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

  // Not found
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  notFoundTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: DISPLAY_FONT,
  },
  notFoundSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: BODY_FONT,
  },
  notFoundButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  notFoundButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: BODY_FONT,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 48,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: DISPLAY_FONT,
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    fontFamily: BODY_FONT,
  },
  cameraButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 28,
  },
  cameraButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: BODY_FONT,
  },

  // Task list
  taskList: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 8,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 14,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskContent: {
    flex: 1,
    gap: 2,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: BODY_FONT,
  },
  taskTitleDone: {
    textDecorationLine: 'line-through',
    opacity: 0.5,
  },
  taskTime: {
    fontSize: 12,
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
});
