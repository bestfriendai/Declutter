/**
 * Declutterly -- Task Customize Screen (V1)
 * Matches Pencil design: 6iIOk
 *
 * - "Customize Tasks" header with task count & total time
 * - Task Detail Level slider (Simple <-> Detailed)
 * - Grouped task cards by area with toggle switches
 * - Individual task checkboxes with time estimates
 * - "Add to Room" CTA
 * - "Start with easy wins instead" secondary action
 */

import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Check } from 'lucide-react-native';
import { useDeclutter } from '@/context/DeclutterContext';
import { CleaningTask, RoomType } from '@/types/declutter';

// ─── V1 Design Tokens ────────────────────────────────────────────────────────
const V1 = {
  coral: '#FF6B6B',
  green: '#66BB6A',
  amber: '#FFB74D',
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

function getRoomEmoji(type: RoomType): string {
  const map: Record<string, string> = {
    bedroom: '🛏️', kitchen: '🍳', bathroom: '🚿', livingRoom: '🛋️',
    office: '💻', garage: '🔧', closet: '👕', other: '🏠',
  };
  return map[type] || '🏠';
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Task Customize Screen
// ─────────────────────────────────────────────────────────────────────────────
export default function TaskCustomizeScreen() {
  const { photoUri, roomType, roomName, tasks: tasksJson } = useLocalSearchParams<{
    photoUri: string;
    roomType: RoomType;
    roomName: string;
    tasks: string;
  }>();

  const rawScheme = useColorScheme();
  const isDark = rawScheme === 'dark';
  const t = isDark ? V1.dark : V1.light;
  const insets = useSafeAreaInsets();
  const { addRoom, setTasksForRoom, addPhotoToRoom, setActiveRoom } = useDeclutter();

  // Parse tasks
  const allTasks: CleaningTask[] = useMemo(() => {
    try {
      return JSON.parse(tasksJson || '[]');
    } catch {
      return [];
    }
  }, [tasksJson]);

  // Track which tasks are selected
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(allTasks.map(t => t.id))
  );

  // Group tasks by zone
  const groupedTasks = useMemo(() => {
    const map = new Map<string, CleaningTask[]>();
    allTasks.forEach(task => {
      const zone = task.zone || 'General';
      if (!map.has(zone)) map.set(zone, []);
      map.get(zone)!.push(task);
    });
    return Array.from(map.entries());
  }, [allTasks]);

  const selectedCount = selectedIds.size;
  const removedCount = allTasks.length - selectedCount;
  const totalMinutes = allTasks
    .filter(t => selectedIds.has(t.id))
    .reduce((sum, t) => sum + (t.estimatedMinutes || 3), 0);

  const toggleTask = useCallback((taskId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  }, []);

  const toggleGroup = useCallback((tasks: CleaningTask[]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedIds(prev => {
      const next = new Set(prev);
      const allSelected = tasks.every(t => next.has(t.id));
      if (allSelected) {
        tasks.forEach(t => next.delete(t.id));
      } else {
        tasks.forEach(t => next.add(t.id));
      }
      return next;
    });
  }, []);

  const handleAddToRoom = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const selectedTasks = allTasks.filter(t => selectedIds.has(t.id));
    if (selectedTasks.length === 0) {
      Alert.alert('No tasks selected', 'Please select at least one task.');
      return;
    }

    try {
      const room = await addRoom({
        name: roomName || 'Room',
        type: (roomType as RoomType) || 'bedroom',
        emoji: getRoomEmoji(roomType as RoomType),
        messLevel: 50,
        aiSummary: `${selectedTasks.length} tasks to do`,
      });

      if (photoUri) {
        await addPhotoToRoom(room.id, {
          uri: photoUri,
          timestamp: new Date(),
          type: 'before',
        });
      }

      setTasksForRoom(room.id, selectedTasks);
      setActiveRoom(room.id);
      router.replace(`/room/${room.id}`);
    } catch (err) {
      Alert.alert('Error', 'Failed to create room');
    }
  }, [allTasks, selectedIds, roomName, roomType, photoUri]);

  const handleEasyWins = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const easyTasks = allTasks
      .sort((a, b) => (a.estimatedMinutes || 3) - (b.estimatedMinutes || 3))
      .slice(0, 3);

    try {
      const room = await addRoom({
        name: roomName || 'Room',
        type: (roomType as RoomType) || 'bedroom',
        emoji: getRoomEmoji(roomType as RoomType),
        messLevel: 50,
        aiSummary: '3 easy wins to start',
      });

      if (photoUri) {
        await addPhotoToRoom(room.id, {
          uri: photoUri,
          timestamp: new Date(),
          type: 'before',
        });
      }

      setTasksForRoom(room.id, easyTasks);
      setActiveRoom(room.id);
      router.replace(`/room/${room.id}`);
    } catch (err) {
      Alert.alert('Error', 'Failed to create room');
    }
  }, [allTasks, roomName, roomType, photoUri]);

  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }} hitSlop={12}>
          <ChevronLeft size={24} color={t.text} />
        </Pressable>
        <View>
          <Text style={[styles.headerTitle, { color: t.text }]}>Customize Tasks</Text>
          <Text style={[styles.headerSubtitle, { color: t.textSecondary }]}>
            {selectedCount} tasks selected {'\u00B7'} ~{totalMinutes} min
          </Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      {/* Detail Level slider (decorative) */}
      <View style={styles.detailLevel}>
        <Text style={[styles.detailLabel, { color: t.textSecondary }]}>Task Detail Level</Text>
        <View style={styles.detailSlider}>
          <Text style={[styles.detailEndLabel, { color: t.textMuted }]}>Simple</Text>
          <View style={[styles.sliderTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
            <View style={[styles.sliderFill, { backgroundColor: V1.coral }]} />
            <View style={[styles.sliderThumb, { backgroundColor: '#FFFFFF' }]} />
          </View>
          <Text style={[styles.detailEndLabel, { color: t.textMuted }]}>Detailed</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 140 }}
        showsVerticalScrollIndicator={false}
      >
        {groupedTasks.map(([groupName, tasks], groupIndex) => {
          const groupSelected = tasks.filter(t => selectedIds.has(t.id)).length;
          const allSelected = groupSelected === tasks.length;

          return (
            <Animated.View
              key={groupName}
              entering={FadeInDown.delay(groupIndex * 60).duration(300)}
            >
              {/* Group header */}
              <View style={styles.groupHeader}>
                <View style={styles.groupHeaderLeft}>
                  <View style={[styles.groupDot, { backgroundColor: V1.coral }]} />
                  <Text style={[styles.groupName, { color: t.text }]}>{groupName}</Text>
                  <View style={[styles.groupCountPill, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
                    <Text style={[styles.groupCountText, { color: t.textSecondary }]}>
                      {tasks.length} tasks
                    </Text>
                  </View>
                </View>
                {/* Group toggle */}
                <Pressable
                  onPress={() => toggleGroup(tasks)}
                  style={[
                    styles.toggleSwitch,
                    allSelected
                      ? { backgroundColor: V1.blue }
                      : { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' },
                  ]}
                >
                  <View style={[
                    styles.toggleThumb,
                    allSelected && { transform: [{ translateX: 18 }] },
                  ]} />
                </Pressable>
              </View>

              {/* Tasks */}
              {tasks.map(task => {
                const isSelected = selectedIds.has(task.id);
                return (
                  <Pressable
                    key={task.id}
                    onPress={() => toggleTask(task.id)}
                    style={[styles.taskRow, { borderBottomColor: t.border }]}
                  >
                    <View style={[
                      styles.taskCheckbox,
                      isSelected
                        ? { backgroundColor: V1.green, borderColor: V1.green }
                        : { borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)' },
                    ]}>
                      {isSelected && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
                    </View>
                    <Text style={[
                      styles.taskName,
                      { color: isSelected ? t.text : t.textMuted },
                    ]} numberOfLines={1}>
                      {task.title}
                    </Text>
                    <Text style={[styles.taskTime, { color: t.textMuted }]}>
                      {task.estimatedMinutes || 3}m
                    </Text>
                  </Pressable>
                );
              })}
            </Animated.View>
          );
        })}
      </ScrollView>

      {/* Bottom CTAs */}
      <View style={[styles.bottomSection, { paddingBottom: insets.bottom + 20, backgroundColor: t.bg }]}>
        <Text style={[styles.removedText, { color: t.textMuted }]}>
          {removedCount} tasks removed
        </Text>
        <Pressable onPress={handleAddToRoom} style={[styles.addButton, { backgroundColor: V1.coral }]}>
          <Text style={styles.addButtonText}>Add to Room</Text>
        </Pressable>
        <Pressable onPress={handleEasyWins}>
          <Text style={[styles.easyWinsText, { color: V1.coral }]}>
            Start with easy wins instead
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },

  // Detail level
  detailLevel: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  detailLabel: {
    fontSize: 13,
    marginBottom: 8,
  },
  detailSlider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailEndLabel: {
    fontSize: 12,
  },
  sliderTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    position: 'relative',
    justifyContent: 'center',
  },
  sliderFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '60%',
    borderRadius: 3,
  },
  sliderThumb: {
    position: 'absolute',
    left: '56%',
    width: 18,
    height: 18,
    borderRadius: 9,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },

  // Groups
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  groupHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  groupDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '700',
  },
  groupCountPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  groupCountText: {
    fontSize: 12,
    fontWeight: '500',
  },

  // Toggle switch
  toggleSwitch: {
    width: 44,
    height: 26,
    borderRadius: 13,
    padding: 2,
    justifyContent: 'center',
  },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
  },

  // Tasks
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    paddingLeft: 36,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  taskCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskName: {
    flex: 1,
    fontSize: 15,
  },
  taskTime: {
    fontSize: 13,
    fontWeight: '500',
  },

  // Bottom
  bottomSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    alignItems: 'center',
    gap: 10,
  },
  removedText: {
    fontSize: 13,
  },
  addButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 28,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  easyWinsText: {
    fontSize: 14,
    fontWeight: '600',
    paddingVertical: 8,
  },
});
