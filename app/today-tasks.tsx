/**
 * Declutterly -- Today's Tasks (V1 Pencil Design)
 * Cross-room daily task list grouped by room.
 * Summary badges, room sections with tasks, floating CTA.
 */

import { AmbientBackdrop } from '@/components/ui/AmbientBackdrop';
import { useDeclutter } from '@/context/DeclutterContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { Room, CleaningTask } from '@/types/declutter';
import {
  Bed,
  UtensilsCrossed,
  Droplets,
  Tv,
  Monitor,
  Car,
  Shirt,
  Box,
  Clock,
  CheckCircle2,
  Circle,
  Zap,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useMemo, useCallback } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const BODY_FONT = 'DM Sans';
const DISPLAY_FONT = 'Bricolage Grotesque';

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

const ROOM_ICON_MAP: Record<string, LucideIcon> = {
  bedroom: Bed,
  kitchen: UtensilsCrossed,
  bathroom: Droplets,
  livingRoom: Tv,
  living_room: Tv,
  office: Monitor,
  garage: Car,
  closet: Shirt,
  other: Box,
};

function getRoomIcon(type?: string): LucideIcon {
  if (!type) return Box;
  return ROOM_ICON_MAP[type] || Box;
}

function getFreshnessLabel(room: Room): string {
  const tasks = room.tasks ?? [];
  const total = tasks.length;
  if (total === 0) return 'New';
  const completed = tasks.filter((t) => t.completed).length;
  const percent = Math.round((completed / total) * 100);
  if (percent >= 90) return 'Sparkling';
  if (percent >= 60) return 'Fresh';
  if (percent >= 30) return 'Needs love';
  return 'Needs attention';
}

function getTaskColor(priority: string): string {
  switch (priority) {
    case 'high': return V1.coral;
    case 'medium': return V1.amber;
    case 'low': return V1.green;
    default: return V1.blue;
  }
}

interface RoomGroup {
  room: Room;
  tasks: CleaningTask[];
  totalMinutes: number;
}

function SummaryBadge({
  isDark,
  label,
  color,
}: {
  isDark: boolean;
  label: string;
  color: string;
}) {
  return (
    <View style={[styles.badge, {
      backgroundColor: isDark ? `${color}22` : `${color}18`,
    }]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

function TaskRow({
  isDark,
  task,
  onToggle,
  onPress,
}: {
  isDark: boolean;
  task: CleaningTask;
  onToggle: () => void;
  onPress: () => void;
}) {
  const t = isDark ? V1.dark : V1.light;
  const dotColor = getTaskColor(task.priority);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.taskRow, { opacity: pressed ? 0.8 : 1 }]}
    >
      {/* Color dot */}
      <View style={[styles.taskDot, { backgroundColor: dotColor }]} />

      {/* Checkbox */}
      <Pressable onPress={onToggle} hitSlop={8} accessibilityRole="checkbox" accessibilityState={{ checked: task.completed }}>
        {task.completed ? (
          <CheckCircle2 size={22} color={V1.green} />
        ) : (
          <Circle size={22} color={t.textMuted} />
        )}
      </Pressable>

      {/* Task info */}
      <View style={styles.taskInfo}>
        <Text
          style={[
            styles.taskTitle,
            { color: t.text },
            task.completed && { textDecorationLine: 'line-through', color: t.textMuted },
          ]}
          numberOfLines={1}
        >
          {task.title}
        </Text>
      </View>

      {/* Time estimate */}
      <View style={styles.taskTime}>
        <Clock size={12} color={t.textMuted} />
        <Text style={[styles.taskTimeText, { color: t.textMuted }]}>
          {task.estimatedMinutes} min
        </Text>
      </View>
    </Pressable>
  );
}

export default function TodayTasksScreen() {
  const rawScheme = useColorScheme();
  const isDark = rawScheme === 'dark';
  const reducedMotion = useReducedMotion();
  const insets = useSafeAreaInsets();
  const { rooms: rawRooms, toggleTask } = useDeclutter();
  const rooms = rawRooms ?? [];
  const t = isDark ? V1.dark : V1.light;

  // Group tasks by room, only include rooms with incomplete tasks
  const roomGroups = useMemo((): RoomGroup[] => {
    return rooms
      .map((room) => {
        const tasks = (room.tasks ?? []).filter((t) => !t.completed);
        const totalMinutes = tasks.reduce((sum, t) => sum + (t.estimatedMinutes ?? 0), 0);
        return { room, tasks, totalMinutes };
      })
      .filter((g) => g.tasks.length > 0);
  }, [rooms]);

  const totalTasks = roomGroups.reduce((sum, g) => sum + g.tasks.length, 0);
  const totalMinutes = roomGroups.reduce((sum, g) => sum + g.totalMinutes, 0);
  const totalRooms = roomGroups.length;

  const handleToggleTask = useCallback((roomId: string, taskId: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleTask(roomId, taskId);
  }, [toggleTask]);

  const handleTaskPress = useCallback((taskId: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/task-detail?taskId=${taskId}`);
  }, []);

  const handleStartBlitz = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/single-task');
  }, []);

  const enter = (delay: number) =>
    reducedMotion ? undefined : FadeInDown.duration(380).delay(delay);

  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      <AmbientBackdrop isDark={isDark} variant="home" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 14, paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <Animated.View entering={enter(0)}>
          <Text style={[styles.title, { color: t.text }]}>Today's Tasks</Text>
        </Animated.View>

        {/* Summary badges */}
        <Animated.View entering={enter(40)} style={styles.badgeRow}>
          <SummaryBadge isDark={isDark} label={`${totalTasks} tasks`} color={V1.green} />
          <SummaryBadge isDark={isDark} label={`~${totalMinutes} min`} color={V1.blue} />
          <SummaryBadge isDark={isDark} label={`${totalRooms} rooms`} color={V1.amber} />
        </Animated.View>

        {/* Room groups */}
        {roomGroups.length === 0 ? (
          <Animated.View entering={enter(80)} style={styles.emptyWrap}>
            <Text style={[styles.emptyText, { color: t.textSecondary }]}>
              No tasks for today. Scan a room to get started!
            </Text>
          </Animated.View>
        ) : (
          roomGroups.map((group, gIndex) => {
            const Icon = getRoomIcon(group.room.type);
            const freshness = getFreshnessLabel(group.room);
            const freshnessColor = freshness === 'Sparkling' ? V1.green :
              freshness === 'Fresh' ? V1.green :
              freshness === 'Needs love' ? V1.amber : V1.coral;

            return (
              <Animated.View key={group.room.id} entering={enter(80 + gIndex * 50)}>
                {/* Room section header */}
                <View style={styles.sectionHeader}>
                  <Icon size={16} color={t.textSecondary} />
                  <Text style={[styles.sectionName, { color: t.text }]}>
                    {group.room.name}
                  </Text>
                  <Text style={[styles.sectionMeta, { color: t.textMuted }]}>
                    {group.tasks.length} task{group.tasks.length === 1 ? '' : 's'} {'\u00B7'} {group.totalMinutes} min
                  </Text>
                  <View style={{ flex: 1 }} />
                  <Text style={[styles.sectionFreshness, { color: freshnessColor }]}>
                    {freshness}
                  </Text>
                </View>

                {/* Tasks */}
                <View style={[styles.taskList, { backgroundColor: t.card, borderColor: t.border }]}>
                  {group.tasks.map((task, tIndex) => (
                    <View key={task.id}>
                      <TaskRow
                        isDark={isDark}
                        task={task}
                        onToggle={() => handleToggleTask(group.room.id, task.id)}
                        onPress={() => handleTaskPress(task.id)}
                      />
                      {tIndex < group.tasks.length - 1 && (
                        <View style={[styles.taskDivider, {
                          backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                        }]} />
                      )}
                    </View>
                  ))}
                </View>
              </Animated.View>
            );
          })
        )}
      </ScrollView>

      {/* Floating CTA */}
      {totalTasks > 0 && (
        <View style={[styles.ctaWrap, { paddingBottom: insets.bottom + 88 }]}>
          <Pressable
            onPress={handleStartBlitz}
            accessibilityRole="button"
            accessibilityLabel="Start 15-Min Blitz"
            style={({ pressed }) => [{ opacity: pressed ? 0.88 : 1 }]}
          >
            <LinearGradient
              colors={[V1.coral, '#FF5252']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.ctaButton}
            >
              <Zap size={18} color="#FFFFFF" />
              <Text style={styles.ctaText}>Start 15-Min Blitz</Text>
            </LinearGradient>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    gap: 16,
  },
  title: {
    fontFamily: DISPLAY_FONT,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },

  // Summary badges
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  badgeText: {
    fontFamily: BODY_FONT,
    fontSize: 12,
    fontWeight: '700',
  },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  sectionName: {
    fontFamily: BODY_FONT,
    fontSize: 14,
    fontWeight: '700',
  },
  sectionMeta: {
    fontFamily: BODY_FONT,
    fontSize: 12,
    fontWeight: '500',
  },
  sectionFreshness: {
    fontFamily: BODY_FONT,
    fontSize: 12,
    fontWeight: '600',
  },

  // Task list
  taskList: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  taskDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontFamily: BODY_FONT,
    fontSize: 14,
    fontWeight: '500',
  },
  taskTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  taskTimeText: {
    fontFamily: BODY_FONT,
    fontSize: 11,
    fontWeight: '500',
  },
  taskDivider: {
    height: 1,
    marginLeft: 52,
  },

  // Empty
  emptyWrap: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: BODY_FONT,
    fontSize: 14,
    textAlign: 'center',
  },

  // CTA
  ctaWrap: {
    position: 'absolute',
    bottom: 0,
    left: 20,
    right: 20,
  },
  ctaButton: {
    height: 52,
    borderRadius: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ctaText: {
    fontFamily: BODY_FONT,
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
