/**
 * Declutterly -- Room Detail Screen
 *
 * - Full-width room photo with per-task bounding box overlays
 * - Color-coded rectangles by priority (coral/amber/green)
 * - Completed tasks show green overlay with checkmark
 * - Simple flat task checklist below the photo
 * - Floating "Start 15-Min Blitz" CTA
 * - Empty state with camera prompt
 */

import { Check, ChevronLeft, Flame, Camera } from 'lucide-react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { V1, BODY_FONT, DISPLAY_FONT } from '@/constants/designTokens';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDeclutter } from '@/context/DeclutterContext';
import { ScreenErrorBoundary } from '@/components/ErrorBoundary';
import { CleaningTask } from '@/types/declutter';

// ─── Priority color mapping ────────────────────────────────────────────────
function getPriorityColor(priority?: string): string {
  if (priority === 'high') return V1.coral;
  if (priority === 'medium') return V1.amber;
  return V1.green; // low or undefined
}

function getPriorityFill(priority?: string): string {
  if (priority === 'high') return 'rgba(255,107,107,0.20)';
  if (priority === 'medium') return 'rgba(255,183,77,0.20)';
  return 'rgba(102,187,106,0.20)';
}

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

// ─── Truncate title to first 3-4 words ──────────────────────────────────────
function truncateTitle(title: string): string {
  const words = title.split(' ');
  if (words.length <= 4) return title;
  return words.slice(0, 3).join(' ') + '...';
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
  const { height: windowHeight } = useWindowDimensions();
  const { rooms, toggleTask, setActiveRoom } = useDeclutter();
  const [highlightedTaskId, setHighlightedTaskId] = useState<string | null>(null);

  const room = rooms.find(r => r.id === id);
  const photoUri = room?.photos?.[0]?.uri;
  const photoHeight = windowHeight * 0.55;

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

  const handleTaskPress = useCallback((taskId: string) => {
    // Highlight the corresponding bounding box on the photo
    setHighlightedTaskId(prev => prev === taskId ? null : taskId);
    handleToggleTask(taskId);
  }, [handleToggleTask]);

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
          {/* Minimal photo header for empty state */}
          <View style={[styles.photoContainer, { height: photoHeight }]}>
            {photoUri ? (
              <Image
                source={{ uri: photoUri }}
                style={StyleSheet.absoluteFillObject}
                contentFit="cover"
                cachePolicy="memory-disk"
                transition={300}
              />
            ) : (
              <View style={[StyleSheet.absoluteFillObject, {
                backgroundColor: isDark ? '#1A1A1A' : '#E8E8E8',
              }]} />
            )}
            <View style={styles.darkOverlay} />
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.back();
              }}
              style={[styles.backButton, { top: insets.top + 8 }]}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <ChevronLeft size={24} color="#FFFFFF" />
            </Pressable>
          </View>
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
        {/* Photo with task bounding box overlays */}
        <View style={[styles.photoContainer, { height: photoHeight }]}>
          {photoUri ? (
            <Image
              source={{ uri: photoUri }}
              style={StyleSheet.absoluteFillObject}
              contentFit="cover"
              placeholder={{ blurhash: 'LGF5]+Yk^6#M@-5c,1J5@[or[Q6.' }}
              cachePolicy="memory-disk"
              transition={300}
            />
          ) : (
            <Pressable
              style={[StyleSheet.absoluteFillObject, {
                backgroundColor: isDark ? '#1A1A1A' : '#E8E8E8',
                alignItems: 'center',
                justifyContent: 'center',
              }]}
              onPress={() => router.push('/camera')}
              accessibilityRole="button"
              accessibilityLabel="Take a photo of this room"
            >
              <Text style={{
                fontSize: 14, fontWeight: '500',
                color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.35)',
                fontFamily: BODY_FONT,
              }}>
                Take a photo of this room
              </Text>
            </Pressable>
          )}

          {/* Dark scrim */}
          <View style={styles.darkOverlay} />

          {/* Task bounding box rectangles */}
          {sortedTasks.map((task: CleaningTask) => {
            const box = task.boundingBox;
            if (!box) return null;

            const isCompleted = task.completed;
            const isHighlighted = highlightedTaskId === task.id;
            const borderColor = isCompleted ? V1.green : getPriorityColor(task.priority);
            const fillColor = isCompleted
              ? 'rgba(102,187,106,0.30)'
              : isHighlighted
                ? getPriorityFill(task.priority).replace('0.20', '0.40')
                : getPriorityFill(task.priority);
            const shortTitle = truncateTitle(task.title);
            const time = task.estimatedMinutes || 3;

            return (
              <Pressable
                key={`bbox-${task.id}`}
                onPress={() => handleToggleTask(task.id)}
                style={[
                  styles.boundingBox,
                  {
                    left: `${box.x}%`,
                    top: `${box.y}%`,
                    width: `${box.width}%`,
                    height: `${box.height}%`,
                    backgroundColor: fillColor,
                    borderColor: borderColor,
                    borderWidth: 2,
                  },
                  isHighlighted && {
                    borderWidth: 3,
                    shadowColor: borderColor,
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.6,
                    shadowRadius: 8,
                    elevation: 8,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={`${isCompleted ? 'Completed' : 'Incomplete'}: ${task.title}, ${time} minutes`}
              >
                {/* Label */}
                <View style={[
                  styles.boxLabel,
                  { backgroundColor: isCompleted ? V1.green : borderColor },
                ]}>
                  {isCompleted ? (
                    <View style={styles.boxLabelRow}>
                      <Check size={10} color="#FFFFFF" strokeWidth={3} />
                      <Text style={styles.boxLabelText} numberOfLines={1}>Done</Text>
                    </View>
                  ) : (
                    <Text style={styles.boxLabelText} numberOfLines={1}>
                      {shortTitle} · {time} min
                    </Text>
                  )}
                </View>
              </Pressable>
            );
          })}

          {/* Back button overlaid on top-left */}
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            style={[styles.backButton, { top: insets.top + 8 }]}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ChevronLeft size={24} color="#FFFFFF" />
          </Pressable>

          {/* Progress indicator on top-right */}
          <View style={[styles.progressBadge, { top: insets.top + 8 }]}>
            <Text style={[styles.progressBadgeText, { color: freshness.color }]}>
              {completedTasks}/{totalTasks}
            </Text>
          </View>

          {/* Room name at bottom */}
          <View style={styles.photoBottom}>
            <Text style={styles.photoRoomName}>{room.name}</Text>
            <View style={styles.photoProgressBar}>
              <View style={[styles.photoProgressFill, {
                width: `${Math.max(progress, 3)}%`,
                backgroundColor: freshness.color,
              }]} />
            </View>
          </View>
        </View>

        {/* AI Summary */}
        {room.aiSummary && (
          <View style={{
            marginHorizontal: 20,
            marginTop: 12,
            padding: 14,
            borderRadius: 14,
            backgroundColor: isDark ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.06)',
            borderWidth: 1,
            borderColor: isDark ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.12)',
          }}>
            <Text style={{
              fontFamily: BODY_FONT, fontSize: 12, fontWeight: '700',
              color: V1.indigo, marginBottom: 6,
            }}>
              AI ANALYSIS
            </Text>
            <Text style={{
              fontFamily: BODY_FONT, fontSize: 13, lineHeight: 19,
              color: t.textSecondary,
            }}>
              {room.aiSummary}
            </Text>
          </View>
        )}

        {/* Task Checklist */}
        <View style={styles.taskList}>
          {sortedTasks.map((task: CleaningTask) => {
            const hasBbox = !!task.boundingBox;
            const isHighlighted = highlightedTaskId === task.id;

            return (
              <Pressable
                key={task.id}
                onPress={() => handleTaskPress(task.id)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: task.completed }}
                accessibilityLabel={`${task.completed ? 'Completed' : 'Incomplete'}: ${task.title}`}
                style={[
                  styles.taskRow,
                  { backgroundColor: t.card, borderColor: t.border },
                  isHighlighted && {
                    borderColor: getPriorityColor(task.priority),
                    borderWidth: 2,
                  },
                ]}
              >
                {/* Priority color indicator */}
                {hasBbox && (
                  <View style={[styles.priorityDot, {
                    backgroundColor: task.completed ? V1.green : getPriorityColor(task.priority),
                  }]} />
                )}

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
            );
          })}
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

  // Photo container with overlays
  photoContainer: {
    position: 'relative',
    overflow: 'hidden',
    width: '100%',
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },

  // Bounding box rectangles
  boundingBox: {
    position: 'absolute',
    borderRadius: 6,
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    overflow: 'visible',
  },
  boxLabel: {
    position: 'absolute',
    bottom: -2,
    left: -2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    maxWidth: '120%',
  },
  boxLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  boxLabelText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
    fontFamily: BODY_FONT,
    letterSpacing: 0.2,
  },

  // Back button
  backButton: {
    position: 'absolute',
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    zIndex: 10,
  },

  // Progress badge
  progressBadge: {
    position: 'absolute',
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 10,
  },
  progressBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: BODY_FONT,
  },

  // Room name at bottom of photo
  photoBottom: {
    position: 'absolute',
    bottom: 16,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  photoRoomName: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 10,
    fontFamily: DISPLAY_FONT,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  photoProgressBar: {
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  photoProgressFill: {
    height: 5,
    borderRadius: 3,
  },

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
  priorityDot: {
    width: 4,
    height: 28,
    borderRadius: 2,
    marginLeft: -4,
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
