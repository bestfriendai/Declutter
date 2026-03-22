/**
 * Declutterly -- Task Customize Screen (V1)
 * Matches Pencil design: 6iIOk
 *
 * Improvements:
 * - Animated toggle switch (spring translateX for thumb)
 * - Task expansion on long press (show description, subtasks)
 * - Bottom gradient fade above fixed section
 * - Fixed CTA hierarchy: "Easy Wins" = primary coral, "Add all tasks" = secondary text
 * - Empty group handling (message when all tasks deselected)
 * - Loading spinner on submit buttons during submission
 */

import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Check } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useDeclutter } from '@/context/DeclutterContext';
import { V1, BODY_FONT, DISPLAY_FONT, RADIUS, SPACING } from '@/constants/designTokens';
import { CleaningTask, RoomType } from '@/types/declutter';

function getRoomEmoji(type: RoomType): string {
  const map: Record<string, string> = {
    bedroom: '\uD83D\uDECF\uFE0F',
    kitchen: '\uD83C\uDF73',
    bathroom: '\uD83D\uDEBF',
    livingRoom: '\uD83D\uDECB\uFE0F',
    office: '\uD83D\uDCBB',
    garage: '\uD83D\uDD27',
    closet: '\uD83D\uDC55',
    other: '\uD83C\uDFE0',
  };
  return map[type] || '\uD83C\uDFE0';
}

// ── Animated Toggle Switch ──────────────────────────────────────────────────

function AnimatedToggle({
  isOn,
  onToggle,
  isDark,
}: {
  isOn: boolean;
  onToggle: () => void;
  isDark: boolean;
}) {
  const translateX = useSharedValue(isOn ? 18 : 0);

  // Sync with external state
  React.useEffect(() => {
    translateX.value = withSpring(isOn ? 18 : 0, {
      damping: 15,
      stiffness: 200,
    });
  }, [isOn]);

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="switch"
      accessibilityState={{ checked: isOn }}
      style={[
        styles.toggleSwitch,
        isOn
          ? { backgroundColor: V1.blue }
          : { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' },
      ]}
    >
      <Animated.View style={[styles.toggleThumb, thumbStyle]} />
    </Pressable>
  );
}

// ── Expandable Task Row ─────────────────────────────────────────────────────

function TaskRow({
  task,
  isSelected,
  isDark,
  onToggle,
}: {
  task: CleaningTask;
  isSelected: boolean;
  isDark: boolean;
  onToggle: () => void;
}) {
  const t = isDark ? V1.dark : V1.light;
  const [expanded, setExpanded] = useState(false);

  return (
    <View>
      <Pressable
        onPress={onToggle}
        onLongPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          setExpanded((prev) => !prev);
        }}
        style={[styles.taskRow, { borderBottomColor: t.border }]}
      >
        <View
          style={[
            styles.taskCheckbox,
            isSelected
              ? { backgroundColor: V1.green, borderColor: V1.green }
              : {
                  borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)',
                },
          ]}
        >
          {isSelected && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
        </View>
        <Text
          style={[styles.taskName, { color: isSelected ? t.text : t.textMuted }]}
          numberOfLines={expanded ? undefined : 1}
        >
          {task.title}
        </Text>
        <Text style={[styles.taskTime, { color: t.textMuted }]}>
          {task.estimatedMinutes || 3}m
        </Text>
      </Pressable>

      {/* Expanded details */}
      {expanded && (
        <View style={[styles.expandedDetails, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }]}>
          {task.description ? (
            <Text style={[styles.expandedDesc, { color: t.textSecondary }]}>
              {task.description}
            </Text>
          ) : null}
          {task.subtasks && task.subtasks.length > 0 && (
            <View style={styles.expandedSubtasks}>
              <Text style={[styles.expandedSubLabel, { color: t.textMuted }]}>Subtasks:</Text>
              {task.subtasks.map((st) => (
                <Text key={st.id} style={[styles.expandedSubItem, { color: t.textSecondary }]}>
                  {'\u2022'} {st.title}
                </Text>
              ))}
            </View>
          )}
          {task.whyThisMatters ? (
            <Text style={[styles.expandedWhy, { color: V1.coral }]}>
              Why: {task.whyThisMatters}
            </Text>
          ) : null}
        </View>
      )}
    </View>
  );
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
  const reducedMotion = useReducedMotion();
  const t = isDark ? V1.dark : V1.light;
  const insets = useSafeAreaInsets();
  const { addRoom, setTasksForRoom, addPhotoToRoom, setActiveRoom, settings, updateSettings } =
    useDeclutter();
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    new Set(allTasks.map((tk) => tk.id)),
  );

  // Group tasks by zone
  const groupedTasks = useMemo(() => {
    const map = new Map<string, CleaningTask[]>();
    allTasks.forEach((task) => {
      const zone = task.zone || 'General';
      if (!map.has(zone)) map.set(zone, []);
      map.get(zone)!.push(task);
    });
    return Array.from(map.entries());
  }, [allTasks]);

  const selectedCount = selectedIds.size;
  const removedCount = allTasks.length - selectedCount;
  const totalMinutes = allTasks
    .filter((tk) => selectedIds.has(tk.id))
    .reduce((sum, tk) => sum + (tk.estimatedMinutes || 3), 0);

  const toggleTask = useCallback((taskId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedIds((prev) => {
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
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const allSelected = tasks.every((t) => next.has(t.id));
      if (allSelected) {
        tasks.forEach((t) => next.delete(t.id));
      } else {
        tasks.forEach((t) => next.add(t.id));
      }
      return next;
    });
  }, []);

  const handleAddToRoom = useCallback(async () => {
    if (isSubmitting) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const selectedTasks = allTasks.filter((tk) => selectedIds.has(tk.id));
    if (selectedTasks.length === 0) {
      Alert.alert('No tasks selected', 'Please select at least one task.');
      return;
    }

    setIsSubmitting(true);
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
      router.replace({ pathname: '/room/[id]', params: { id: room.id } });
    } catch (err) {
      Alert.alert('Error', 'Failed to create room');
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, allTasks, selectedIds, roomName, roomType, photoUri]);

  const handleEasyWins = useCallback(async () => {
    if (isSubmitting) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const easyTasks = [...allTasks]
      .sort((a, b) => {
        const phaseA = a.phase ?? 99;
        const phaseB = b.phase ?? 99;
        if (phaseA !== phaseB) return phaseA - phaseB;
        return (a.estimatedMinutes || 3) - (b.estimatedMinutes || 3);
      })
      .slice(0, 3);

    setIsSubmitting(true);
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
      router.replace({ pathname: '/room/[id]', params: { id: room.id } });
    } catch (err) {
      Alert.alert('Error', 'Failed to create room');
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, allTasks, roomName, roomType, photoUri]);

  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          hitSlop={12}
        >
          <ChevronLeft size={24} color={t.text} />
        </Pressable>
        <View>
          <Text style={[styles.headerTitle, { color: t.text }]}>Customize Tasks</Text>
          <Text style={[styles.headerSubtitle, { color: t.textSecondary }]}>
            {selectedCount} tasks selected {'\u00B7'} about {totalMinutes} min
          </Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      {/* Detail Level selector */}
      <View style={styles.detailLevel}>
        <Text style={[styles.detailLabel, { color: t.textSecondary }]}>Task Detail Level</Text>
        <View style={styles.detailSlider}>
          {(['normal', 'detailed', 'ultra'] as const).map((level) => {
            const isActive = (settings?.taskBreakdownLevel ?? 'detailed') === level;
            const labels = { normal: 'Simple', detailed: 'Detailed', ultra: 'Ultra' };
            return (
              <Pressable
                key={level}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  updateSettings?.({ taskBreakdownLevel: level });
                }}
                accessibilityRole="button"
                accessibilityLabel={`Set task detail level to ${labels[level]}`}
                accessibilityState={{ selected: isActive }}
                style={[
                  styles.detailChip,
                  {
                    backgroundColor: isActive
                      ? V1.coral
                      : isDark
                        ? 'rgba(255,255,255,0.08)'
                        : 'rgba(0,0,0,0.06)',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.detailChipText,
                    { color: isActive ? '#FFFFFF' : t.textSecondary },
                  ]}
                >
                  {labels[level]}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 160 }}
        showsVerticalScrollIndicator={false}
      >
        {groupedTasks.map(([groupName, tasks], groupIndex) => {
          const groupSelected = tasks.filter((tk) => selectedIds.has(tk.id)).length;
          const allSelected = groupSelected === tasks.length;
          const noneSelected = groupSelected === 0;

          return (
            <Animated.View
              key={groupName}
              entering={
                reducedMotion ? undefined : FadeInDown.delay(groupIndex * 60).duration(300)
              }
            >
              {/* Group header */}
              <View style={styles.groupHeader}>
                <View style={styles.groupHeaderLeft}>
                  <View style={[styles.groupDot, { backgroundColor: V1.coral }]} />
                  <Text style={[styles.groupName, { color: t.text }]}>{groupName}</Text>
                  <View
                    style={[
                      styles.groupCountPill,
                      {
                        backgroundColor: isDark
                          ? 'rgba(255,255,255,0.08)'
                          : 'rgba(0,0,0,0.06)',
                      },
                    ]}
                  >
                    <Text style={[styles.groupCountText, { color: t.textSecondary }]}>
                      {tasks.length} tasks
                    </Text>
                  </View>
                </View>
                {/* Animated group toggle */}
                <AnimatedToggle
                  isOn={allSelected}
                  onToggle={() => toggleGroup(tasks)}
                  isDark={isDark}
                />
              </View>

              {/* Empty group message */}
              {noneSelected && (
                <View style={styles.emptyGroupMessage}>
                  <Text style={[styles.emptyGroupText, { color: t.textMuted }]}>
                    All tasks removed. Toggle to add them back.
                  </Text>
                </View>
              )}

              {/* Tasks */}
              {tasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  isSelected={selectedIds.has(task.id)}
                  isDark={isDark}
                  onToggle={() => toggleTask(task.id)}
                />
              ))}
            </Animated.View>
          );
        })}
      </ScrollView>

      {/* Bottom gradient fade */}
      <LinearGradient
        colors={[
          isDark ? 'rgba(12,12,12,0)' : 'rgba(250,250,250,0)',
          isDark ? 'rgba(12,12,12,0.95)' : 'rgba(250,250,250,0.95)',
          t.bg,
        ]}
        style={styles.bottomGradient}
        pointerEvents="none"
      />

      {/* Bottom CTAs -- Fixed hierarchy: Easy Wins = primary, See all = secondary */}
      <View style={[styles.bottomSection, { paddingBottom: insets.bottom + 20, backgroundColor: t.bg }]}>
        <Text style={[styles.removedText, { color: t.textMuted }]}>
          {removedCount} tasks removed
        </Text>

        {/* Primary: Easy Wins with gradient */}
        <Pressable
          onPress={handleEasyWins}
          disabled={isSubmitting}
          style={({ pressed }) => [{ opacity: pressed ? 0.88 : 1, width: '100%' }]}
        >
          <LinearGradient
            colors={[V1.coral, '#FF5252']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.primaryButton, { opacity: isSubmitting ? 0.6 : 1 }]}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.primaryButtonText}>Start with Easy Wins</Text>
            )}
          </LinearGradient>
        </Pressable>

        {/* Secondary: See all tasks */}
        <Pressable onPress={handleAddToRoom} disabled={isSubmitting}>
          {isSubmitting ? (
            <ActivityIndicator color={V1.coral} size="small" style={{ paddingVertical: 8 }} />
          ) : (
            <Text style={[styles.secondaryText, { color: V1.coral, opacity: isSubmitting ? 0.5 : 1 }]}>
              Add all {selectedCount} tasks
            </Text>
          )}
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
    fontFamily: DISPLAY_FONT,
    fontSize: 20,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontFamily: BODY_FONT,
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
  detailChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  detailChipText: {
    fontFamily: BODY_FONT,
    fontSize: 13,
    fontWeight: '600',
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
    fontFamily: DISPLAY_FONT,
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

  // Animated toggle switch
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

  // Empty group
  emptyGroupMessage: {
    paddingHorizontal: 36,
    paddingVertical: 10,
  },
  emptyGroupText: {
    fontSize: 13,
    fontStyle: 'italic',
    fontFamily: BODY_FONT,
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
    fontFamily: BODY_FONT,
    flex: 1,
    fontSize: 15,
  },
  taskTime: {
    fontFamily: BODY_FONT,
    fontSize: 13,
    fontWeight: '500',
  },

  // Expanded task details
  expandedDetails: {
    paddingHorizontal: 36,
    paddingVertical: 10,
    paddingLeft: 70,
    gap: 6,
  },
  expandedDesc: {
    fontFamily: BODY_FONT,
    fontSize: 13,
    lineHeight: 18,
  },
  expandedSubtasks: {
    gap: 2,
  },
  expandedSubLabel: {
    fontFamily: BODY_FONT,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  expandedSubItem: {
    fontFamily: BODY_FONT,
    fontSize: 13,
    paddingLeft: 8,
  },
  expandedWhy: {
    fontFamily: BODY_FONT,
    fontSize: 12,
    fontWeight: '500',
    fontStyle: 'italic',
    marginTop: 4,
  },

  // Bottom gradient
  bottomGradient: {
    position: 'absolute',
    bottom: 130,
    left: 0,
    right: 0,
    height: 40,
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
  primaryButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 28,
    alignItems: 'center',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    fontFamily: BODY_FONT,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryText: {
    fontFamily: BODY_FONT,
    fontSize: 14,
    fontWeight: '600',
    paddingVertical: 8,
  },
});
