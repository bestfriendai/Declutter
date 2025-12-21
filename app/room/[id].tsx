/**
 * Declutterly - Room Detail Screen
 * Apple TV style room progress, tasks, and photos
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  useColorScheme,
  Dimensions,
  Switch,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeInRight,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  runOnJS,
  Easing,
  ZoomIn,
  SlideInRight,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { Colors, PriorityColors } from '@/constants/Colors';
import { Typography } from '@/theme/typography';
import { useDeclutter } from '@/context/DeclutterContext';
import { CleaningTask, Priority } from '@/types/declutter';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton, IconButton } from '@/components/ui/GlassButton';
import { SingleRing } from '@/components/ui/ActivityRings';
import { useCardPress, useFABPress } from '@/hooks/useAnimatedPress';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function RoomDetailScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    rooms,
    toggleTask,
    toggleSubTask,
    deleteRoom,
    setActiveRoom,
    settings,
  } = useDeclutter();

  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [celebratingTask, setCelebratingTask] = useState<string | null>(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);

  const celebrationOpacity = useSharedValue(0);
  const celebrationScale = useSharedValue(0.5);

  const room = rooms.find(r => r.id === id);

  // Celebration animation
  const celebrateCompletion = (taskId: string) => {
    setCelebratingTask(taskId);
    celebrationOpacity.value = withTiming(1, { duration: 200 });
    celebrationScale.value = withSpring(1, { damping: 10, stiffness: 200 });

    setTimeout(() => {
      celebrationOpacity.value = withTiming(0, { duration: 400 });
      celebrationScale.value = withTiming(0.5, { duration: 400 });
      setCelebratingTask(null);
    }, 1500);
  };

  const celebrationStyle = useAnimatedStyle(() => ({
    opacity: celebrationOpacity.value,
    transform: [{ scale: celebrationScale.value }],
  }));

  if (!room) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🔍</Text>
          <Text style={[Typography.title2, { color: colors.text, marginTop: 16 }]}>
            Room not found
          </Text>
          <GlassButton
            title="Go Back"
            onPress={() => router.back()}
            style={{ marginTop: 24 }}
          />
        </View>
      </View>
    );
  }

  // Filter tasks
  const filteredTasks = useMemo(() => {
    switch (filter) {
      case 'pending':
        return room.tasks.filter(t => !t.completed);
      case 'completed':
        return room.tasks.filter(t => t.completed);
      default:
        return room.tasks;
    }
  }, [room.tasks, filter]);

  // Group tasks by priority
  const tasksByPriority = useMemo(() => {
    const high = filteredTasks.filter(t => t.priority === 'high');
    const medium = filteredTasks.filter(t => t.priority === 'medium');
    const low = filteredTasks.filter(t => t.priority === 'low');
    return { high, medium, low };
  }, [filteredTasks]);

  // Quick wins
  const quickWins = useMemo(() => {
    return room.tasks.filter(t => t.difficulty === 'quick' && !t.completed).slice(0, 3);
  }, [room.tasks]);

  // Calculate stats
  const completedCount = room.tasks.filter(t => t.completed).length;
  const totalTime = room.tasks.reduce((acc, t) => acc + t.estimatedMinutes, 0);
  const remainingTime = room.tasks
    .filter(t => !t.completed)
    .reduce((acc, t) => acc + t.estimatedMinutes, 0);

  const handleTaskToggle = (taskId: string) => {
    const task = room.tasks.find(t => t.id === taskId);
    const wasCompleted = task?.completed;

    if (settings.hapticFeedback) {
      if (!wasCompleted) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }

    toggleTask(room.id, taskId);

    if (!wasCompleted) {
      celebrateCompletion(taskId);
    }
  };

  const handleStartFocusMode = () => {
    setActiveRoom(room.id);
    router.push('/focus');
  };

  const handleSubTaskToggle = (taskId: string, subTaskId: string) => {
    if (settings.hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    toggleSubTask(room.id, taskId, subTaskId);
  };

  const toggleTaskExpanded = (taskId: string) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  const handleTakePhoto = () => {
    setActiveRoom(room.id);
    router.push('/camera');
  };

  const handleDeleteRoom = () => {
    Alert.alert(
      'Delete Room',
      'Are you sure you want to delete this room and all its tasks?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteRoom(room.id);
            router.back();
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Celebration Overlay */}
      {celebratingTask && (
        <Animated.View style={[styles.celebrationOverlay, celebrationStyle]}>
          <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={styles.celebrationContent}>
            <Text style={styles.celebrationEmojis}>🎉 ✨ ⭐ 🌟 💫 🎊</Text>
            <Text style={styles.celebrationText}>Task Complete!</Text>
          </View>
        </Animated.View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with back button */}
        <Animated.View
          entering={FadeInDown.delay(100).springify()}
          style={styles.header}
        >
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <BlurView
              intensity={40}
              tint={colorScheme}
              style={styles.backButtonBlur}
            >
              <Text style={[Typography.body, { color: colors.text }]}>← Back</Text>
            </BlurView>
          </Pressable>
          <View style={{ flex: 1 }} />
          <Pressable
            style={styles.deleteButton}
            onPress={handleDeleteRoom}
          >
            <Text style={{ fontSize: 20 }}>🗑️</Text>
          </Pressable>
        </Animated.View>

        {/* Room Hero Section */}
        <Animated.View
          entering={FadeInDown.delay(200).springify()}
          style={styles.heroSection}
        >
          <GlassCard variant="hero" style={styles.heroCard}>
            <View style={styles.heroContent}>
              {/* Room image or emoji */}
              <View style={styles.roomImageContainer}>
                {room.photos.length > 0 ? (
                  <Image
                    source={{ uri: room.photos[room.photos.length - 1].uri }}
                    style={styles.roomImage}
                    contentFit="cover"
                  />
                ) : (
                  <View style={[styles.roomEmojiContainer, { backgroundColor: colors.surfaceSecondary }]}>
                    <Text style={styles.roomEmoji}>{room.emoji}</Text>
                  </View>
                )}
              </View>

              {/* Room info */}
              <View style={styles.roomInfo}>
                <Text style={[Typography.title1, { color: colors.text }]}>
                  {room.name}
                </Text>
                <Text style={[Typography.subheadline, { color: colors.textSecondary, marginTop: 4 }]}>
                  {completedCount}/{room.tasks.length} tasks • ~{remainingTime} min left
                </Text>
              </View>

              {/* Progress ring */}
              <SingleRing
                value={room.currentProgress}
                maxValue={100}
                size={80}
                strokeWidth={8}
                label="%"
                gradientColors={[...colors.gradientPrimary]}
              />
            </View>

            {room.aiSummary && (
              <View style={styles.aiSummary}>
                <Text style={[Typography.caption1, { color: colors.textSecondary }]}>
                  {room.aiSummary}
                </Text>
              </View>
            )}
          </GlassCard>
        </Animated.View>

        {/* Focus Mode CTA */}
        {room.tasks.filter(t => !t.completed).length > 0 && (
          <Animated.View
            entering={FadeInDown.delay(300).springify()}
            style={styles.focusSection}
          >
            <Pressable onPress={handleStartFocusMode}>
              <LinearGradient
                colors={[...colors.gradientPrimary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.focusModeCard}
              >
                <View style={styles.focusModeIcon}>
                  <Text style={{ fontSize: 28 }}>🎯</Text>
                </View>
                <View style={styles.focusModeText}>
                  <Text style={[Typography.headline, { color: '#FFFFFF' }]}>
                    Start Focus Session
                  </Text>
                  <Text style={[Typography.caption1, { color: 'rgba(255,255,255,0.8)' }]}>
                    {room.tasks.filter(t => !t.completed).length} tasks • ~{remainingTime} min
                  </Text>
                </View>
                <Text style={styles.focusModeArrow}>→</Text>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        )}

        {/* Photos Gallery */}
        {room.photos.length > 0 && (
          <Animated.View
            entering={FadeInDown.delay(400).springify()}
            style={styles.photosSection}
          >
            <View style={styles.sectionHeader}>
              <Text style={[Typography.title3, { color: colors.text }]}>Photos</Text>
              <Pressable onPress={handleTakePhoto}>
                <Text style={[Typography.subheadlineMedium, { color: colors.primary }]}>
                  + Add
                </Text>
              </Pressable>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.photosScroll}
            >
              {room.photos.map((photo, index) => (
                <Pressable
                  key={photo.id}
                  onPress={() => setSelectedPhotoIndex(index)}
                >
                  <View style={styles.photoCard}>
                    <Image
                      source={{ uri: photo.uri }}
                      style={styles.photoImage}
                      contentFit="cover"
                    />
                    <View style={[styles.photoLabel, { backgroundColor: colors.surfaceSecondary }]}>
                      <Text style={[Typography.caption2, { color: colors.text }]}>
                        {photo.type}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </Animated.View>
        )}

        {/* Quick Actions */}
        <Animated.View
          entering={FadeInDown.delay(450).springify()}
          style={styles.actionsSection}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.actionsScroll}
          >
            <ActionButton
              emoji="📸"
              label="Take Photo"
              onPress={handleTakePhoto}
              colors={colors}
            />
            {room.photos.length >= 2 && (
              <ActionButton
                emoji="📊"
                label="Compare"
                onPress={() => router.push({
                  pathname: '/analysis',
                  params: { roomId: room.id, mode: 'compare' }
                })}
                colors={colors}
              />
            )}
          </ScrollView>
        </Animated.View>

        {/* Filter Pills */}
        {room.tasks.length > 0 && (
          <Animated.View
            entering={FadeInDown.delay(500).springify()}
            style={styles.filterSection}
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterScroll}
            >
              <FilterPill
                label="All"
                count={room.tasks.length}
                active={filter === 'all'}
                onPress={() => setFilter('all')}
                colors={colors}
              />
              <FilterPill
                label="To Do"
                count={room.tasks.filter(t => !t.completed).length}
                active={filter === 'pending'}
                onPress={() => setFilter('pending')}
                colors={colors}
              />
              <FilterPill
                label="Done"
                count={room.tasks.filter(t => t.completed).length}
                active={filter === 'completed'}
                onPress={() => setFilter('completed')}
                colors={colors}
              />
            </ScrollView>
          </Animated.View>
        )}

        {/* Quick Wins */}
        {quickWins.length > 0 && filter !== 'completed' && (
          <Animated.View
            entering={FadeInDown.delay(550).springify()}
            style={styles.taskSection}
          >
            <View style={styles.sectionHeader}>
              <Text style={[Typography.title3, { color: colors.text }]}>
                ⚡ Quick Wins
              </Text>
              <Text style={[Typography.caption1, { color: colors.textSecondary }]}>
                Under 5 min
              </Text>
            </View>
            <View style={styles.taskList}>
              {quickWins.map((task, index) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  index={index}
                  expanded={expandedTasks.has(task.id)}
                  onToggle={() => handleTaskToggle(task.id)}
                  onExpand={() => toggleTaskExpanded(task.id)}
                  onSubTaskToggle={(subTaskId) => handleSubTaskToggle(task.id, subTaskId)}
                  showQuickWinBadge
                  colors={colors}
                />
              ))}
            </View>
          </Animated.View>
        )}

        {/* High Priority Tasks */}
        {tasksByPriority.high.length > 0 && (
          <Animated.View
            entering={FadeInDown.delay(600).springify()}
            style={styles.taskSection}
          >
            <View style={styles.sectionHeader}>
              <Text style={[Typography.title3, { color: colors.text }]}>
                🔴 High Priority
              </Text>
            </View>
            <View style={styles.taskList}>
              {tasksByPriority.high.map((task, index) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  index={index}
                  expanded={expandedTasks.has(task.id)}
                  onToggle={() => handleTaskToggle(task.id)}
                  onExpand={() => toggleTaskExpanded(task.id)}
                  onSubTaskToggle={(subTaskId) => handleSubTaskToggle(task.id, subTaskId)}
                  colors={colors}
                />
              ))}
            </View>
          </Animated.View>
        )}

        {/* Medium Priority Tasks */}
        {tasksByPriority.medium.length > 0 && (
          <Animated.View
            entering={FadeInDown.delay(650).springify()}
            style={styles.taskSection}
          >
            <View style={styles.sectionHeader}>
              <Text style={[Typography.title3, { color: colors.text }]}>
                🟡 Medium Priority
              </Text>
            </View>
            <View style={styles.taskList}>
              {tasksByPriority.medium.map((task, index) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  index={index}
                  expanded={expandedTasks.has(task.id)}
                  onToggle={() => handleTaskToggle(task.id)}
                  onExpand={() => toggleTaskExpanded(task.id)}
                  onSubTaskToggle={(subTaskId) => handleSubTaskToggle(task.id, subTaskId)}
                  colors={colors}
                />
              ))}
            </View>
          </Animated.View>
        )}

        {/* Low Priority Tasks */}
        {tasksByPriority.low.length > 0 && (
          <Animated.View
            entering={FadeInDown.delay(700).springify()}
            style={styles.taskSection}
          >
            <View style={styles.sectionHeader}>
              <Text style={[Typography.title3, { color: colors.text }]}>
                🟢 Low Priority
              </Text>
            </View>
            <View style={styles.taskList}>
              {tasksByPriority.low.map((task, index) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  index={index}
                  expanded={expandedTasks.has(task.id)}
                  onToggle={() => handleTaskToggle(task.id)}
                  onExpand={() => toggleTaskExpanded(task.id)}
                  onSubTaskToggle={(subTaskId) => handleSubTaskToggle(task.id, subTaskId)}
                  colors={colors}
                />
              ))}
            </View>
          </Animated.View>
        )}

        {/* No Tasks Empty State */}
        {room.tasks.length === 0 && (
          <Animated.View
            entering={FadeInDown.delay(500).springify()}
            style={styles.emptyStateSection}
          >
            <GlassCard style={styles.emptyStateCard}>
              <View style={styles.emptyStateIllustration}>
                <Text style={styles.emptyStateEmoji}>📋</Text>
                <Text style={styles.emptyStateSparkle1}>✨</Text>
                <Text style={styles.emptyStateSparkle2}>🧹</Text>
              </View>
              <Text style={[Typography.title2, { color: colors.text, textAlign: 'center' }]}>
                Ready for AI Analysis
              </Text>
              <Text style={[Typography.subheadline, { color: colors.textSecondary, textAlign: 'center', marginTop: 8 }]}>
                Take a photo of this space and our AI will create a personalized cleaning plan.
              </Text>

              <View style={styles.emptyStateFeatures}>
                <View style={styles.emptyStateFeature}>
                  <Text style={styles.featureEmoji}>📸</Text>
                  <Text style={[Typography.caption1, { color: colors.textSecondary }]}>
                    Capture
                  </Text>
                </View>
                <View style={styles.emptyStateFeature}>
                  <Text style={styles.featureEmoji}>🤖</Text>
                  <Text style={[Typography.caption1, { color: colors.textSecondary }]}>
                    Analyze
                  </Text>
                </View>
                <View style={styles.emptyStateFeature}>
                  <Text style={styles.featureEmoji}>⚡</Text>
                  <Text style={[Typography.caption1, { color: colors.textSecondary }]}>
                    Declutter
                  </Text>
                </View>
              </View>

              <GlassButton
                title="📸 Capture Space"
                variant="primary"
                onPress={handleTakePhoto}
                style={{ marginTop: 20, width: '100%' }}
              />
            </GlassCard>
          </Animated.View>
        )}

        {/* Motivation */}
        {room.motivationalMessage && (
          <Animated.View
            entering={FadeInDown.delay(750).springify()}
            style={styles.motivationSection}
          >
            <GlassCard variant="subtle" style={styles.motivationCard}>
              <Text style={[Typography.body, { color: colors.text, textAlign: 'center' }]}>
                {room.motivationalMessage}
              </Text>
            </GlassCard>
          </Animated.View>
        )}
      </ScrollView>

      {/* Floating Camera Button */}
      <Animated.View
        entering={ZoomIn.delay(800)}
        style={[styles.fab, { bottom: insets.bottom + 90 }]}
      >
        <Pressable onPress={handleTakePhoto}>
          <LinearGradient
            colors={[...colors.gradientPrimary]}
            style={styles.fabGradient}
          >
            <Text style={styles.fabIcon}>📸</Text>
          </LinearGradient>
        </Pressable>
      </Animated.View>
    </View>
  );
}

// Action Button
function ActionButton({
  emoji,
  label,
  onPress,
  colors,
}: {
  emoji: string;
  label: string;
  onPress: () => void;
  colors: typeof Colors.dark;
}) {
  const colorScheme = useColorScheme() ?? 'dark';

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={[
        styles.actionButton,
        {
          backgroundColor: colorScheme === 'dark'
            ? 'rgba(255, 255, 255, 0.08)'
            : 'rgba(0, 0, 0, 0.05)',
        },
      ]}
    >
      <Text style={styles.actionEmoji}>{emoji}</Text>
      <Text style={[Typography.caption1, { color: colors.text }]}>{label}</Text>
    </Pressable>
  );
}

// Filter Pill
function FilterPill({
  label,
  count,
  active,
  onPress,
  colors,
}: {
  label: string;
  count: number;
  active: boolean;
  onPress: () => void;
  colors: typeof Colors.dark;
}) {
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={[
        styles.filterPill,
        {
          backgroundColor: active ? colors.primary : 'rgba(255, 255, 255, 0.08)',
          borderColor: active ? colors.primary : 'rgba(255, 255, 255, 0.15)',
        },
      ]}
    >
      <Text
        style={[
          Typography.subheadlineMedium,
          { color: active ? '#FFFFFF' : colors.text },
        ]}
      >
        {label}
      </Text>
      <View
        style={[
          styles.filterCount,
          { backgroundColor: active ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)' },
        ]}
      >
        <Text style={[Typography.caption2, { color: active ? '#FFFFFF' : colors.textSecondary }]}>
          {count}
        </Text>
      </View>
    </Pressable>
  );
}

// Task Card
function TaskCard({
  task,
  index,
  expanded,
  onToggle,
  onExpand,
  onSubTaskToggle,
  showQuickWinBadge,
  colors,
}: {
  task: CleaningTask;
  index: number;
  expanded: boolean;
  onToggle: () => void;
  onExpand: () => void;
  onSubTaskToggle: (subTaskId: string) => void;
  showQuickWinBadge?: boolean;
  colors: typeof Colors.dark;
}) {
  const colorScheme = useColorScheme() ?? 'dark';
  const priorityColor = PriorityColors[task.priority];
  const hasSubtasks = task.subtasks && task.subtasks.length > 0;
  const completedSubtasks = task.subtasks?.filter(st => st.completed).length || 0;

  const { animatedStyle, onPressIn, onPressOut } = useCardPress();

  return (
    <Animated.View entering={SlideInRight.delay(index * 50).springify()}>
      <AnimatedPressable
        onPress={onExpand}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={animatedStyle}
      >
        <View
          style={[
            styles.taskCard,
            {
              backgroundColor: colorScheme === 'dark'
                ? 'rgba(255, 255, 255, 0.06)'
                : 'rgba(0, 0, 0, 0.03)',
              opacity: task.completed ? 0.6 : 1,
            },
          ]}
        >
          {/* Main row */}
          <View style={styles.taskRow}>
            {/* Checkbox */}
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                onToggle();
              }}
              style={[
                styles.checkbox,
                {
                  backgroundColor: task.completed ? colors.success : 'transparent',
                  borderColor: task.completed ? colors.success : colors.textTertiary,
                },
              ]}
            >
              {task.completed && <Text style={styles.checkmark}>✓</Text>}
            </Pressable>

            {/* Task info */}
            <View style={styles.taskInfo}>
              <View style={styles.taskTitleRow}>
                <Text style={styles.taskEmoji}>{task.emoji}</Text>
                <Text
                  style={[
                    Typography.body,
                    {
                      color: colors.text,
                      textDecorationLine: task.completed ? 'line-through' : 'none',
                      flex: 1,
                    },
                  ]}
                  numberOfLines={expanded ? undefined : 1}
                >
                  {task.title}
                </Text>
              </View>

              <View style={styles.taskMeta}>
                <Text style={[Typography.caption1, { color: colors.textSecondary }]}>
                  ~{task.estimatedMinutes} min
                </Text>
                {showQuickWinBadge && (
                  <View style={[styles.quickWinBadge, { backgroundColor: colors.success + '20' }]}>
                    <Text style={[Typography.caption2, { color: colors.success }]}>
                      ⚡ Quick Win
                    </Text>
                  </View>
                )}
                {hasSubtasks && (
                  <Text style={[Typography.caption1, { color: colors.textSecondary }]}>
                    {completedSubtasks}/{task.subtasks!.length} steps
                  </Text>
                )}
              </View>
            </View>

            {/* Priority dot */}
            <View style={[styles.priorityDot, { backgroundColor: priorityColor }]} />

            {/* Expand indicator */}
            <Text style={[styles.expandArrow, { color: colors.textTertiary }]}>
              {expanded ? '▼' : '▶'}
            </Text>
          </View>

          {/* Expanded content */}
          {expanded && (
            <View style={styles.expandedContent}>
              {/* Description */}
              {task.description && (
                <Text style={[Typography.subheadline, { color: colors.textSecondary, marginBottom: 12 }]}>
                  {task.description}
                </Text>
              )}

              {/* Tips */}
              {task.tips && task.tips.length > 0 && (
                <View style={styles.tipsContainer}>
                  <Text style={[Typography.caption1Medium, { color: colors.primary, marginBottom: 6 }]}>
                    💡 Tips:
                  </Text>
                  {task.tips.map((tip, i) => (
                    <Text key={i} style={[Typography.caption1, { color: colors.textSecondary, marginBottom: 4 }]}>
                      • {tip}
                    </Text>
                  ))}
                </View>
              )}

              {/* Subtasks */}
              {hasSubtasks && (
                <View style={styles.subtasksContainer}>
                  <Text style={[Typography.caption1Medium, { color: colors.text, marginBottom: 8 }]}>
                    Steps:
                  </Text>
                  {task.subtasks!.map(st => (
                    <Pressable
                      key={st.id}
                      onPress={() => onSubTaskToggle(st.id)}
                      style={styles.subtaskRow}
                    >
                      <View
                        style={[
                          styles.subtaskCheckbox,
                          {
                            backgroundColor: st.completed ? colors.success : 'transparent',
                            borderColor: st.completed ? colors.success : colors.textTertiary,
                          },
                        ]}
                      >
                        {st.completed && <Text style={styles.subtaskCheck}>✓</Text>}
                      </View>
                      <Text
                        style={[
                          Typography.subheadline,
                          {
                            color: colors.text,
                            textDecorationLine: st.completed ? 'line-through' : 'none',
                            opacity: st.completed ? 0.6 : 1,
                          },
                        ]}
                      >
                        {st.title}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  backButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  backButtonBlur: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  deleteButton: {
    padding: 8,
  },
  heroSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  heroCard: {
    padding: 20,
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roomImageContainer: {
    marginRight: 16,
  },
  roomImage: {
    width: 72,
    height: 72,
    borderRadius: 16,
  },
  roomEmojiContainer: {
    width: 72,
    height: 72,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roomEmoji: {
    fontSize: 36,
  },
  roomInfo: {
    flex: 1,
  },
  aiSummary: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  focusSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  focusModeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
  },
  focusModeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  focusModeText: {
    flex: 1,
  },
  focusModeArrow: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '300',
  },
  photosSection: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  photosScroll: {
    paddingHorizontal: 20,
    gap: 12,
  },
  photoCard: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  photoImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  photoLabel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 4,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  actionsSection: {
    marginBottom: 16,
  },
  actionsScroll: {
    paddingHorizontal: 20,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  actionEmoji: {
    fontSize: 18,
  },
  filterSection: {
    marginBottom: 20,
  },
  filterScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
  },
  filterCount: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  taskSection: {
    marginBottom: 24,
  },
  taskList: {
    paddingHorizontal: 20,
    gap: 8,
  },
  taskCard: {
    padding: 16,
    borderRadius: 16,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  taskInfo: {
    flex: 1,
  },
  taskTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskEmoji: {
    fontSize: 18,
    marginRight: 8,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  quickWinBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  expandArrow: {
    marginLeft: 8,
    fontSize: 10,
  },
  expandedContent: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  tipsContainer: {
    marginBottom: 12,
  },
  subtasksContainer: {
    marginTop: 12,
  },
  subtaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  subtaskCheckbox: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  subtaskCheck: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  emptyStateSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  emptyStateCard: {
    padding: 32,
    alignItems: 'center',
  },
  emptyStateIllustration: {
    position: 'relative',
    marginBottom: 20,
  },
  emptyStateEmoji: {
    fontSize: 64,
  },
  emptyStateSparkle1: {
    position: 'absolute',
    top: -8,
    right: -20,
    fontSize: 24,
  },
  emptyStateSparkle2: {
    position: 'absolute',
    bottom: -5,
    left: -20,
    fontSize: 20,
  },
  emptyStateFeatures: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 24,
  },
  emptyStateFeature: {
    alignItems: 'center',
    flex: 1,
  },
  featureEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  motivationSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  motivationCard: {
    padding: 20,
  },
  celebrationOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  celebrationContent: {
    alignItems: 'center',
  },
  celebrationEmojis: {
    fontSize: 32,
    letterSpacing: 8,
    marginBottom: 16,
  },
  celebrationText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  fab: {
    position: 'absolute',
    right: 20,
    zIndex: 50,
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabIcon: {
    fontSize: 24,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyEmoji: {
    fontSize: 64,
  },
});
