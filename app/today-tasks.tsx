/**
 * Declutterly -- Today's Tasks (V1 Pencil Design)
 * Cross-room daily task list with curated tasks from useTodaysTasks.
 *
 * Improvements:
 * - Uses useTodaysTasks hook for intelligent curation
 * - Daily progress tracker at top
 * - Task source badges (Priority, Quick Win, Tiny Thing)
 * - Daily completion celebration
 * - Task completion animation
 * - Real pull-to-refresh
 */

import { AmbientBackdrop } from '@/components/ui/AmbientBackdrop';
import { MascotAvatar } from '@/components/ui';
import { BODY_FONT, DISPLAY_FONT, V1 } from '@/constants/designTokens';
import { useDeclutter } from '@/context/DeclutterContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useTodaysTasks, type TodayTask } from '@/hooks/useTodaysTasks';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
    CheckCircle2,
    ChevronLeft,
    Circle,
    Clock,
    Zap,
} from 'lucide-react-native';
import { ScreenErrorBoundary } from '@/components/ErrorBoundary';
import React, { useCallback, useMemo, useState } from 'react';
import {
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── Source Badge ──────────────────────────────────────────────────────────────
function SourceBadge({ source }: { source: TodayTask['source'] }) {
  const config: Record<string, { label: string; color: string }> = {
    'freshness': { label: 'PRIORITY', color: V1.coral },
    'quick-win': { label: 'QUICK WIN', color: V1.green },
    'tiny-thing': { label: 'TINY THING', color: V1.blue },
  };
  const c = config[source] ?? config['freshness'];

  return (
    <View style={{
      backgroundColor: `${c.color}18`,
      paddingHorizontal: 6, paddingVertical: 2,
      borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 3,
    }}>
      <Text style={{
        fontSize: 10, fontWeight: '700', color: c.color,
        letterSpacing: 0.3, fontFamily: BODY_FONT,
      }}>
        {c.label}
      </Text>
    </View>
  );
}

// ─── Task Row ─────────────────────────────────────────────────────────────────
function TaskRow({
  isDark,
  task,
  onToggle,
}: {
  isDark: boolean;
  task: TodayTask;
  onToggle: () => void;
}) {
  const t = isDark ? V1.dark : V1.light;

  return (
    <View style={styles.taskRow}>
      {/* Checkbox */}
      <Pressable
        onPress={onToggle}
        hitSlop={8}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: task.completed }}
        accessibilityLabel={`${task.completed ? 'Undo' : 'Complete'} task: ${task.title}`}
      >
        {task.completed ? (
          <CheckCircle2 size={22} color={V1.green} />
        ) : (
          <Circle size={22} color={t.textMuted} />
        )}
      </Pressable>

      {/* Task info */}
      <View style={styles.taskInfo}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
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
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <SourceBadge source={task.source} />
          <Text style={{ fontFamily: BODY_FONT, fontSize: 11, color: t.textMuted }}>
            {task.roomName}
          </Text>
        </View>
      </View>

      {/* Time estimate */}
      <View style={styles.taskTime}>
        <Clock size={12} color={t.textMuted} />
        <Text style={[styles.taskTimeText, { color: t.textMuted }]}>
          {task.estimatedMinutes}m
        </Text>
      </View>
    </View>
  );
}

export default function TodayTasksScreen() {
  return (
    <ScreenErrorBoundary screenName="today-tasks">
      <TodayTasksScreenContent />
    </ScreenErrorBoundary>
  );
}

function TodayTasksScreenContent() {
  const rawScheme = useColorScheme();
  const isDark = rawScheme === 'dark';
  const reducedMotion = useReducedMotion();
  const insets = useSafeAreaInsets();
  const { rooms: rawRooms, toggleTask } = useDeclutter();
  const rooms = rawRooms ?? [];
  const t = isDark ? V1.dark : V1.light;

  // Use the curated today's tasks hook
  const todaysTasks = useTodaysTasks(rooms);
  const completedToday = todaysTasks.filter(tk => tk.completed).length;
  const totalToday = todaysTasks.length;
  const todayProgress = totalToday > 0 ? (completedToday / totalToday) * 100 : 0;
  const totalMinutes = todaysTasks
    .filter(tk => !tk.completed)
    .reduce((sum, tk) => sum + tk.estimatedMinutes, 0);
  const allDone = completedToday >= totalToday && totalToday > 0;

  // Pull-to-refresh
  const [isRefreshing, setIsRefreshing] = useState(false);
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 600);
  }, []);

  const handleToggleTask = useCallback((task: TodayTask) => {
    if (task.source === 'tiny-thing') {
      // Tiny things don't have a real room to toggle
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return;
    }
    void Haptics.notificationAsync(
      task.completed ? Haptics.NotificationFeedbackType.Warning : Haptics.NotificationFeedbackType.Success
    );
    toggleTask(task.roomId, task.id);
  }, [toggleTask]);

  const handleStartBlitz = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/blitz');
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
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={V1.coral}
            colors={[V1.coral]}
          />
        }
      >
        {/* Header with back button */}
        <Animated.View entering={enter(0)} style={styles.headerRow}>
          <Pressable
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={styles.backButton}
          >
            <ChevronLeft size={22} color={t.text} />
          </Pressable>
          <Text style={[styles.title, { color: t.text }]}>Today's Tasks</Text>
        </Animated.View>

        {/* Daily progress tracker */}
        {totalToday > 0 && (
          <Animated.View entering={enter(20)} style={{ marginBottom: 8 }}>
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 10,
              marginBottom: 8,
            }}>
              <Text style={{
                fontFamily: DISPLAY_FONT, fontSize: 15, fontWeight: '700', color: t.text,
              }}>
                {completedToday} of {totalToday} done
              </Text>
              <View style={{ flex: 1 }} />
              <Text style={{
                fontFamily: BODY_FONT, fontSize: 12, color: allDone ? V1.green : V1.coral, fontWeight: '600',
              }}>
                {Math.round(todayProgress)}%
              </Text>
            </View>
            <View style={{
              height: 6, borderRadius: 3,
              backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
            }}>
              <View style={{
                height: 6, borderRadius: 3,
                width: `${Math.max(todayProgress, 3)}%`,
                backgroundColor: allDone ? V1.green : V1.coral,
              }} />
            </View>
          </Animated.View>
        )}

        {/* Summary badges */}
        <Animated.View entering={enter(40)} style={styles.badgeRow}>
          <View style={[styles.badge, { backgroundColor: isDark ? `${V1.green}22` : `${V1.green}18` }]}>
            <Text style={[styles.badgeText, { color: V1.green }]}>{totalToday} tasks</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: isDark ? `${V1.blue}22` : `${V1.blue}18` }]}>
            <Text style={[styles.badgeText, { color: V1.blue }]}>about {totalMinutes} min</Text>
          </View>
        </Animated.View>

        {/* All done celebration */}
        {allDone && (
          <Animated.View entering={enter(80)} style={{
            alignItems: 'center', paddingVertical: 40, gap: 12,
          }}>
            <MascotAvatar imageKey="celebrating" size={80} showBackground={false} />
            <Text style={{
              fontFamily: DISPLAY_FONT, fontSize: 22, fontWeight: '700',
              color: t.text, textAlign: 'center',
            }}>
              All done for today!
            </Text>
            <Text style={{
              fontFamily: BODY_FONT, fontSize: 14, color: t.textSecondary,
              textAlign: 'center', lineHeight: 20,
            }}>
              You completed all {totalToday} tasks. Your space thanks you.
            </Text>
          </Animated.View>
        )}

        {/* Task list */}
        {todaysTasks.length === 0 ? (
          <Animated.View entering={enter(80)} style={styles.emptyWrap}>
            <Text style={{ fontSize: 32, marginBottom: 12 }}>{'\u2728'}</Text>
            <Text style={[styles.emptyText, { color: t.text, fontWeight: '600', fontSize: 16, marginBottom: 4 }]}>
              All caught up!
            </Text>
            <Text style={[styles.emptyText, { color: t.textSecondary, marginBottom: 20 }]}>
              Scan a room to get tasks for today.
            </Text>
            <Pressable
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push('/camera');
              }}
              accessibilityRole="button"
              accessibilityLabel="Scan a Room"
              style={({ pressed }) => [{
                backgroundColor: V1.coral,
                paddingHorizontal: 28,
                paddingVertical: 14,
                borderRadius: 16,
                opacity: pressed ? 0.88 : 1,
              }]}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700', fontFamily: BODY_FONT }}>
                Scan a Room
              </Text>
            </Pressable>
          </Animated.View>
        ) : !allDone && (
          <View style={[styles.taskList, { backgroundColor: t.card, borderColor: t.border }]}>
            {todaysTasks.map((task, tIndex) => (
              <Animated.View key={task.id} entering={enter(80 + tIndex * 30)}>
                <TaskRow
                  isDark={isDark}
                  task={task}
                  onToggle={() => handleToggleTask(task)}
                />
                {tIndex < todaysTasks.length - 1 && (
                  <View style={[styles.taskDivider, {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                  }]} />
                )}
              </Animated.View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Floating CTA */}
      {totalToday > 0 && !allDone && (
        <View style={[styles.ctaWrap, { paddingBottom: insets.bottom + 20 }]}>
          <Pressable
            onPress={handleStartBlitz}
            accessibilityRole="button"
            accessibilityLabel="Start 15-Min Blitz with today's tasks"
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
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
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontFamily: BODY_FONT,
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
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
    marginLeft: 46,
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
