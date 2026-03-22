/**
 * Declutterly -- Room Detail Screen
 *
 * THE PHOTO IS THE INTERFACE.
 * Your room photo fills the screen with tappable rectangles on each item.
 * Tap a rectangle → it turns green → done. Like a game.
 * Bottom bar shows progress + time remaining + blitz button.
 * Swipe up to see a minimal list if needed.
 */

import { Check, ChevronLeft, Flame, Camera, Clock, ChevronUp } from 'lucide-react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  SlideInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useColorScheme } from '@/hooks/useColorScheme';
import { V1, BODY_FONT, DISPLAY_FONT } from '@/constants/designTokens';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDeclutter } from '@/context/DeclutterContext';
import { ScreenErrorBoundary } from '@/components/ErrorBoundary';
import { CleaningTask } from '@/types/declutter';

// ─── Helpers ────────────────────────────────────────────────────────────────

function getPriorityColor(priority?: string): string {
  if (priority === 'high') return V1.coral;
  if (priority === 'medium') return V1.amber;
  return V1.green;
}

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) || 0;
  const g = parseInt(clean.substring(2, 4), 16) || 0;
  const b = parseInt(clean.substring(4, 6), 16) || 0;
  return `rgba(${r},${g},${b},${alpha})`;
}

function shortLabel(title: string, maxWords = 3): string {
  // Take text before → if present, otherwise full title
  const before = title.split('→')[0]?.trim() || title;
  const words = before.split(' ');
  if (words.length <= maxWords) return before;
  return words.slice(0, maxWords).join(' ') + '…';
}

// ─────────────────────────────────────────────────────────────────────────────
// Task Rectangle on Photo
// ─────────────────────────────────────────────────────────────────────────────
function TaskBox({
  task,
  onToggle,
}: {
  task: CleaningTask;
  onToggle: (id: string) => void;
}) {
  const box = task.boundingBox;
  if (!box) return null;

  const done = task.completed;
  const color = done ? V1.green : getPriorityColor(task.priority);
  const fill = done ? 'rgba(102,187,106,0.35)' : hexToRgba(color, 0.18);
  const label = done ? 'Done!' : `${shortLabel(task.title)} · ${task.estimatedMinutes || 2}m`;

  const minW = Math.max(box.width, 12);
  const minH = Math.max(box.height, 12);

  return (
    <Pressable
      onPress={() => onToggle(task.id)}
      style={[
        styles.taskBox,
        {
          left: `${box.x}%`,
          top: `${box.y}%`,
          width: `${minW}%`,
          height: `${minH}%`,
          backgroundColor: fill,
          borderColor: color,
          borderWidth: done ? 2.5 : 2,
        },
        done && {
          shadowColor: V1.green,
          shadowOpacity: 0.3,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 0 },
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${done ? 'Done' : 'To do'}: ${task.title}, ${task.estimatedMinutes || 2} minutes`}
    >
      {/* Label chip */}
      <View style={[styles.taskBoxLabel, { backgroundColor: color }]}>
        {done && <Check size={9} color="#FFF" strokeWidth={3} />}
        <Text style={styles.taskBoxLabelText} numberOfLines={1}>{label}</Text>
      </View>
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────
function RoomDetailContent() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const rawScheme = useColorScheme();
  const isDark = rawScheme === 'dark';
  const t = isDark ? V1.dark : V1.light;
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const { rooms, toggleTask, setActiveRoom } = useDeclutter();
  const [listExpanded, setListExpanded] = useState(false);

  const room = rooms.find(r => r.id === id);
  const photoUri = room?.photos?.[0]?.uri;

  const tasks = useMemo(() => [...(room?.tasks || [])], [room?.tasks]);
  const totalTasks = tasks.length;
  const completedCount = tasks.filter(tk => tk.completed).length;
  const remainingCount = totalTasks - completedCount;
  const progress = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;
  const timeRemaining = tasks
    .filter(tk => !tk.completed)
    .reduce((sum, tk) => sum + (tk.estimatedMinutes || 2), 0);
  const allDone = totalTasks > 0 && remainingCount === 0;

  const handleToggle = useCallback((taskId: string) => {
    if (!room) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    toggleTask(room.id, taskId);
  }, [room, toggleTask]);

  const handleBlitz = useCallback(() => {
    if (!room) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setActiveRoom(room.id);
    router.push('/blitz');
  }, [room, setActiveRoom]);

  // ── Not found ──
  if (!room) {
    return (
      <View style={[styles.container, { backgroundColor: t.bg }]}>
        <View style={styles.centered}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>{'\uD83C\uDFE0'}</Text>
          <Text style={[styles.centeredTitle, { color: t.text }]}>Room not found</Text>
          <Pressable
            onPress={() => router.replace('/(tabs)/rooms')}
            style={[styles.pill, { backgroundColor: V1.coral }]}
          >
            <Text style={styles.pillText}>Go to Rooms</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ── Empty — no tasks ──
  if (totalTasks === 0) {
    return (
      <View style={[styles.container, { backgroundColor: '#0C0C0C' }]}>
        {photoUri && (
          <Image source={{ uri: photoUri }} style={StyleSheet.absoluteFillObject} contentFit="cover" />
        )}
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.55)' }]} />
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { top: insets.top + 8 }]} hitSlop={12}>
          <ChevronLeft size={24} color="#FFF" />
        </Pressable>
        <View style={styles.centered}>
          <Camera size={48} color="rgba(255,255,255,0.5)" />
          {photoUri ? (
            <>
              <Text style={[styles.centeredTitle, { color: '#FFF', marginTop: 16 }]}>
                Couldn't detect items
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontFamily: BODY_FONT, fontSize: 15, textAlign: 'center', marginBottom: 24 }}>
                Try retaking the photo with better lighting,{'\n'}or from a different angle
              </Text>
              <Pressable onPress={() => router.push('/camera')} style={[styles.pill, { backgroundColor: V1.coral }]}>
                <Camera size={18} color="#FFF" />
                <Text style={styles.pillText}>Retake Photo</Text>
              </Pressable>
              <Text style={{ color: 'rgba(255,255,255,0.4)', fontFamily: BODY_FONT, fontSize: 13, marginTop: 16 }}>
                Or add tasks manually
              </Text>
            </>
          ) : (
            <>
              <Text style={[styles.centeredTitle, { color: '#FFF', marginTop: 16 }]}>
                Scan this room
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontFamily: BODY_FONT, fontSize: 15, textAlign: 'center', marginBottom: 24 }}>
                Take a photo and AI will find{'\n'}everything that needs cleaning
              </Text>
              <Pressable onPress={() => router.push('/camera')} style={[styles.pill, { backgroundColor: V1.coral }]}>
                <Camera size={18} color="#FFF" />
                <Text style={styles.pillText}>Scan Room</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    );
  }

  // ── Main view — photo is the interface ──
  return (
    <View style={[styles.container, { backgroundColor: '#0C0C0C' }]}>
      {/* Full-screen photo with task rectangles */}
      <View style={[styles.photoFull, { paddingTop: 0 }]}>
        {photoUri ? (
          <Image
            source={{ uri: photoUri }}
            style={StyleSheet.absoluteFillObject}
            contentFit="cover"
            cachePolicy="memory-disk"
          />
        ) : (
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: isDark ? '#1A1A1A' : '#E8E8E8' }]} />
        )}

        {/* Subtle scrim for readability */}
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.20)' }]} />

        {/* Task rectangles */}
        {tasks.map(task => (
          <TaskBox key={task.id} task={task} onToggle={handleToggle} />
        ))}

        {/* Back button */}
        <Pressable
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }}
          style={[styles.backBtn, { top: insets.top + 8 }]}
          hitSlop={12}
        >
          <ChevronLeft size={24} color="#FFF" />
        </Pressable>

        {/* Room name + progress */}
        <View style={[styles.topRight, { top: insets.top + 12 }]}>
          <Text style={styles.topRightText}>
            {completedCount}/{totalTasks}
          </Text>
        </View>
      </View>

      {/* Bottom bar — progress + time + actions */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 8 }]}>
        {/* Progress row */}
        <View style={styles.progressRow}>
          <View style={styles.progressInfo}>
            <Text style={styles.roomName}>{room.name}</Text>
            <View style={styles.statsRow}>
              <Clock size={12} color="rgba(255,255,255,0.5)" />
              <Text style={styles.statText}>
                {allDone ? 'All done! \uD83C\uDF89' : `${remainingCount} left · ~${timeRemaining} min`}
              </Text>
            </View>
          </View>
          <Text style={[styles.progressPercent, { color: allDone ? V1.green : V1.coral }]}>
            {progress}%
          </Text>
        </View>

        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, {
            width: `${Math.max(progress, 2)}%`,
            backgroundColor: allDone ? V1.green : V1.coral,
          }]} />
        </View>

        {/* Action buttons */}
        <View style={styles.actions}>
          {!allDone ? (
            <Pressable onPress={handleBlitz} style={styles.blitzBtn}>
              <Flame size={18} color="#FFF" />
              <Text style={styles.blitzBtnText}>Start 15-Min Blitz</Text>
            </Pressable>
          ) : (
            <Pressable onPress={() => router.back()} style={[styles.blitzBtn, { backgroundColor: V1.green }]}>
              <Check size={18} color="#FFF" strokeWidth={3} />
              <Text style={styles.blitzBtnText}>Room Complete!</Text>
            </Pressable>
          )}

          {/* Expand list toggle */}
          <Pressable
            onPress={() => setListExpanded(!listExpanded)}
            style={styles.listToggle}
          >
            <ChevronUp
              size={20}
              color="rgba(255,255,255,0.6)"
              style={{ transform: [{ rotate: listExpanded ? '180deg' : '0deg' }] }}
            />
          </Pressable>
        </View>

        {/* Expandable task list (swipe-up style) */}
        {listExpanded && (
          <ScrollView
            style={styles.expandedList}
            showsVerticalScrollIndicator={false}
          >
            {tasks.map(task => (
              <Pressable
                key={task.id}
                onPress={() => handleToggle(task.id)}
                style={styles.listItem}
              >
                <View style={[
                  styles.listCheck,
                  task.completed
                    ? { backgroundColor: V1.green, borderColor: V1.green }
                    : { borderColor: 'rgba(255,255,255,0.25)' },
                ]}>
                  {task.completed && <Check size={12} color="#FFF" strokeWidth={3} />}
                </View>
                <Text
                  style={[
                    styles.listTitle,
                    task.completed && { textDecorationLine: 'line-through', opacity: 0.4 },
                  ]}
                  numberOfLines={1}
                >
                  {task.title}
                </Text>
                <Text style={styles.listTime}>{task.estimatedMinutes || 2}m</Text>
              </Pressable>
            ))}
          </ScrollView>
        )}
      </View>
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

  // Full-screen photo
  photoFull: {
    flex: 1,
    position: 'relative',
  },

  // Task bounding box
  taskBox: {
    position: 'absolute',
    borderRadius: 5,
    justifyContent: 'flex-end',
    zIndex: 5,
  },
  taskBoxLabel: {
    position: 'absolute',
    bottom: -1,
    left: -1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
  },
  taskBoxLabelText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '700',
    fontFamily: BODY_FONT,
  },

  // Nav
  backBtn: {
    position: 'absolute',
    left: 16,
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    zIndex: 20,
  },
  topRight: {
    position: 'absolute',
    right: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 20,
  },
  topRightText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: BODY_FONT,
  },

  // Bottom bar
  bottomBar: {
    backgroundColor: '#111',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  progressInfo: { flex: 1, gap: 3 },
  roomName: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
    fontFamily: DISPLAY_FONT,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    fontFamily: BODY_FONT,
  },
  progressPercent: {
    fontSize: 28,
    fontWeight: '800',
    fontFamily: DISPLAY_FONT,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginBottom: 14,
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
  },

  // Actions
  actions: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  blitzBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
    borderRadius: 25,
    backgroundColor: V1.coral,
  },
  blitzBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: BODY_FONT,
  },
  listToggle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Expandable list
  expandedList: {
    maxHeight: 250,
    marginTop: 14,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  listCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listTitle: {
    flex: 1,
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    fontFamily: BODY_FONT,
  },
  listTime: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 12,
    fontFamily: BODY_FONT,
  },

  // Shared
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  centeredTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: DISPLAY_FONT,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 25,
  },
  pillText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: BODY_FONT,
  },
});
