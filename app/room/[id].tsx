/**
 * Declutterly - Room Detail Screen
 * Apple TV style room progress, tasks, and photos
 * With ADHD-friendly features: combo tracking, encouragement, single task mode
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  useColorScheme,
  RefreshControl,
  Share,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { Colors } from '@/constants/Colors';
import { Typography } from '@/theme/typography';
import { Spacing, BorderRadius } from '@/theme/spacing';
import { useDeclutter } from '@/context/DeclutterContext';
import { CleaningTask, Room } from '@/types/declutter';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { SingleRing } from '@/components/ui/ActivityRings';
import { Toast } from '@/components/ui/Toast';

import {
  TaskCard,
  PhotoLightbox,
  RoomCompleteModal,
  GoodEnoughModal,
  OverwhelmModal,
  FilterPill,
  ActionButton,
  MilestoneParticles,
  TaskModal,
  SessionCheckIn,
} from '@/components/room';
import type { SessionPreferences, TimeAvailable } from '@/components/room';
import { EnergyLevel } from '@/types/declutter';

const ENCOURAGEMENT_MESSAGES = [
  "You're doing amazing!",
  "Look at you go!",
  "One task at a time, you've got this!",
  "Progress, not perfection!",
  "You're unstoppable!",
  "Small wins add up!",
  "Crushing it!",
  "Your future self thanks you!",
  "That's the spirit!",
  "Keep the momentum!",
];

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
    deleteTask,
    restoreTask,
    updateTask,
    addTaskToRoom,
    deletePhotoFromRoom,
    setActiveRoom,
    settings,
  } = useDeclutter();

  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [celebratingTask, setCelebratingTask] = useState<string | null>(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);

  const [comboCount, setComboCount] = useState(0);
  const [lastCompletionTime, setLastCompletionTime] = useState<number | null>(null);
  const [showEncouragement, setShowEncouragement] = useState<string | null>(null);
  const [singleTaskMode, setSingleTaskMode] = useState(false);
  const [singleTaskId, setSingleTaskId] = useState<string | null>(null);

  const [showRoomComplete, setShowRoomComplete] = useState(false);
  const [showSessionCheckIn, setShowSessionCheckIn] = useState(false);
  const [sessionPreferences, setSessionPreferences] = useState<SessionPreferences | null>(null);
  const [showGoodEnough, setShowGoodEnough] = useState(false);
  const [showOverwhelm, setShowOverwhelm] = useState(false);
  const [triggeredGoodEnough, setTriggeredGoodEnough] = useState(false);

  const [currentMilestone, setCurrentMilestone] = useState<number | null>(null);

  const [showAddTask, setShowAddTask] = useState(false);
  const [editingTask, setEditingTask] = useState<CleaningTask | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [deletedTask, setDeletedTask] = useState<{ task: CleaningTask; index: number } | null>(null);

  const [refreshing, setRefreshing] = useState(false);

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

  const filteredTasks = useMemo(() => {
    if (!room) return [];
    
    let tasks = room.tasks;
    
    switch (filter) {
      case 'pending':
        tasks = tasks.filter(t => !t.completed);
        break;
      case 'completed':
        tasks = tasks.filter(t => t.completed);
        break;
    }
    
    if (sessionPreferences) {
      const energyOrder: EnergyLevel[] = ['minimal', 'low', 'moderate', 'high'];
      const userEnergyIndex = energyOrder.indexOf(sessionPreferences.energy);
      
      tasks = tasks.filter(t => {
        if (!t.energyRequired) return true;
        const taskEnergyIndex = energyOrder.indexOf(t.energyRequired);
        return taskEnergyIndex <= userEnergyIndex;
      });
      
      const timeMinutes: Record<TimeAvailable, number> = {
        minimal: 5,
        quick: 15,
        standard: 30,
        complete: 120,
      };
      const availableMinutes = timeMinutes[sessionPreferences.time];
      
      let cumulativeTime = 0;
      tasks = tasks.filter(t => {
        if (cumulativeTime + t.estimatedMinutes <= availableMinutes) {
          cumulativeTime += t.estimatedMinutes;
          return true;
        }
        return false;
      });
    }
    
    return tasks;
  }, [room, filter, sessionPreferences]);

  // Group tasks by priority
  const tasksByPriority = useMemo(() => {
    const high = filteredTasks.filter(t => t.priority === 'high');
    const medium = filteredTasks.filter(t => t.priority === 'medium');
    const low = filteredTasks.filter(t => t.priority === 'low');
    return { high, medium, low };
  }, [filteredTasks]);

  // Quick wins
  const quickWins = useMemo(() => {
    if (!room) return [];
    return room.tasks.filter(t => t.difficulty === 'quick' && !t.completed).slice(0, 3);
  }, [room]);

  const completedCount = room ? room.tasks.filter(t => t.completed).length : 0;
  const totalTime = room ? room.tasks.reduce((acc, t) => acc + t.estimatedMinutes, 0) : 0;
  const remainingTime = room
    ? room.tasks.filter(t => !t.completed).reduce((acc, t) => acc + t.estimatedMinutes, 0)
    : 0;

  const calculateNewProgress = useCallback((currentRoom: Room, completedTaskId: string) => {
    const tasks = currentRoom.tasks;
    const completed = tasks.filter(t => t.completed || t.id === completedTaskId).length;
    return Math.round((completed / tasks.length) * 100);
  }, []);

  const checkMilestones = useCallback((progress: number, prevProgress: number) => {
    if (progress >= 70 && progress < 100 && !triggeredGoodEnough) {
      setTriggeredGoodEnough(true);
      setTimeout(() => setShowGoodEnough(true), 500);
    }
    
    if (progress === 100) {
      setTimeout(() => setShowRoomComplete(true), 500);
    }
    
    const milestones = [25, 50, 75, 100];
    for (const milestone of milestones) {
      if (progress >= milestone && prevProgress < milestone) {
        setCurrentMilestone(milestone);
        setTimeout(() => setCurrentMilestone(null), 2000);
        break;
      }
    }
  }, [triggeredGoodEnough]);

  const handleDeleteTask = useCallback((taskId: string) => {
    if (!room) return;
    const taskIndex = room.tasks.findIndex(t => t.id === taskId);
    const task = room.tasks[taskIndex];
    
    if (task) {
      setDeletedTask({ task, index: taskIndex });
      deleteTask(room.id, taskId);
      setToastMessage(`"${task.title}" deleted`);
      
      setTimeout(() => {
        setToastMessage(null);
        setDeletedTask(null);
      }, 4000);
    }
  }, [room, deleteTask]);

  const handleUndoDelete = useCallback(() => {
    if (deletedTask && room) {
      restoreTask(room.id, deletedTask.task, deletedTask.index);
      setDeletedTask(null);
      setToastMessage(null);
    }
  }, [deletedTask, room, restoreTask]);

  const handleEditTask = useCallback((task: CleaningTask) => {
    setEditingTask(task);
  }, []);

  const handleSaveTask = useCallback((taskData: Omit<CleaningTask, 'id'> | { id: string } & Partial<CleaningTask>) => {
    if (!room) return;
    if ('id' in taskData && taskData.id) {
      updateTask(room.id, taskData.id, taskData);
    } else {
      addTaskToRoom(room.id, taskData as Omit<CleaningTask, 'id'>);
    }
    setEditingTask(null);
    setShowAddTask(false);
  }, [room, updateTask, addTaskToRoom]);

  const enterSingleTaskMode = useCallback(() => {
    if (!room) return;
    const pendingTasks = room.tasks.filter(t => !t.completed);
    if (pendingTasks.length > 0) {
      const quickWin = pendingTasks.find(t => t.difficulty === 'quick');
      setSingleTaskId(quickWin?.id || pendingTasks[0].id);
      setSingleTaskMode(true);
    }
  }, [room]);

  const exitSingleTaskMode = useCallback(() => {
    setSingleTaskMode(false);
    setSingleTaskId(null);
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

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

  const handleTaskToggle = (taskId: string) => {
    const task = room.tasks.find(t => t.id === taskId);
    const wasCompleted = task?.completed;
    const prevProgress = room.currentProgress;

    if (settings.hapticFeedback) {
      if (!wasCompleted) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }

    toggleTask(room.id, taskId);

    if (!wasCompleted) {
      const now = Date.now();
      if (lastCompletionTime && now - lastCompletionTime < 60000) {
        setComboCount(prev => prev + 1);
      } else {
        setComboCount(1);
      }
      setLastCompletionTime(now);

      if (Math.random() < 0.25) {
        const msg = ENCOURAGEMENT_MESSAGES[Math.floor(Math.random() * ENCOURAGEMENT_MESSAGES.length)];
        setShowEncouragement(msg);
        setTimeout(() => setShowEncouragement(null), 2500);
      }

      celebrateCompletion(taskId);
      
      const newProgress = calculateNewProgress(room, taskId);
      checkMilestones(newProgress, prevProgress);
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

  const handleShare = async () => {
    try {
      const completedCount = room.tasks.filter(t => t.completed).length;
      const message = `🎉 I just finished decluttering my ${room.name}! Completed ${completedCount} tasks and achieved ${Math.round(room.currentProgress)}% progress with Declutterly!`;

      await Share.share({
        message,
        title: `${room.emoji} ${room.name} Complete!`,
      });
    } catch (error) {
      // User cancelled or share failed - no need to show error
      console.log('Share cancelled or failed:', error);
    }
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
        <Animated.View
          entering={ZoomIn.springify()}
          exiting={FadeOut.duration(300)}
          style={[styles.celebrationOverlay, celebrationStyle]}
        >
          <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
          <LinearGradient
            colors={['rgba(99, 102, 241, 0.2)', 'rgba(168, 85, 247, 0.15)', 'transparent']}
            style={[StyleSheet.absoluteFill, { borderRadius: 24 }]}
          />
          <View style={styles.celebrationContent}>
            <Animated.Text
              entering={ZoomIn.delay(100).springify()}
              style={styles.celebrationEmojis}
            >
              🎉 ✨ ⭐ 🌟 💫 🎊
            </Animated.Text>
            <Animated.Text
              entering={FadeInDown.delay(200).springify()}
              style={[styles.celebrationText, { color: colors.textOnPrimary }]}
            >
              Task Complete!
            </Animated.Text>
            {comboCount > 1 && (
              <Animated.View
                entering={ZoomIn.delay(300).springify()}
                style={[styles.comboIndicator, { backgroundColor: colors.warning + '30' }]}
              >
                <Text style={[Typography.caption1, { color: colors.warning, fontWeight: '700' }]}>
                  🔥 {comboCount}x Combo!
                </Text>
              </Animated.View>
            )}
          </View>
        </Animated.View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 120 },
        ]}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bounces={true}
        alwaysBounceVertical={true}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header with back button */}
        <Animated.View
          entering={FadeInDown.delay(100).springify()}
          style={styles.header}
        >
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
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
            accessibilityRole="button"
            accessibilityLabel="Delete room"
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
                  <Text style={[Typography.headline, { color: colors.textOnPrimary }]}>
                    Start Focus Session
                  </Text>
                  <Text style={[Typography.caption1, { color: colors.textOnPrimary, opacity: 0.8 }]}>
                    {room.tasks.filter(t => !t.completed).length} tasks • ~{remainingTime} min
                  </Text>
                </View>
                <Text style={[styles.focusModeArrow, { color: colors.textOnPrimary }]}>→</Text>
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
        {!singleTaskMode && (
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
              {room.tasks.filter(t => !t.completed).length > 0 && (
                <ActionButton
                  emoji="☝️"
                  label="Just ONE"
                  onPress={enterSingleTaskMode}
                  colors={colors}
                />
              )}
              <ActionButton
                emoji="😰"
                label="Overwhelmed?"
                onPress={() => setShowOverwhelm(true)}
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
        )}

        {/* Filter Pills */}
        {room.tasks.length > 0 && !singleTaskMode && (
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
              {sessionPreferences && (
                <Pressable
                  onPress={() => setShowSessionCheckIn(true)}
                  style={[
                    styles.sessionIndicator,
                    { backgroundColor: colors.primaryMuted }
                  ]}
                >
                  <Text style={styles.sessionIndicatorEmoji}>
                    {sessionPreferences.energy === 'minimal' ? '😴' :
                     sessionPreferences.energy === 'low' ? '😐' :
                     sessionPreferences.energy === 'moderate' ? '🙂' : '⚡'}
                  </Text>
                  <Text style={[Typography.caption2, { color: colors.textSecondary }]}>
                    {sessionPreferences.time === 'minimal' ? '5m' :
                     sessionPreferences.time === 'quick' ? '15m' :
                     sessionPreferences.time === 'standard' ? '30m' : '60m+'}
                  </Text>
                </Pressable>
              )}
            </ScrollView>
          </Animated.View>
        )}

        {/* Add Task Button */}
        {room.tasks.length > 0 && !singleTaskMode && (
          <Animated.View
            entering={FadeInDown.delay(525).springify()}
            style={styles.addTaskSection}
          >
            <Pressable 
              onPress={() => setShowAddTask(true)}
              style={[styles.addTaskButton, { backgroundColor: colors.surfaceSecondary }]}
            >
              <Text style={styles.addTaskIcon}>+</Text>
              <Text style={[Typography.body, { color: colors.primary }]}>Add Custom Task</Text>
            </Pressable>
          </Animated.View>
        )}

        {/* Quick Wins */}
        {quickWins.length > 0 && filter !== 'completed' && !singleTaskMode && (
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
                  onDelete={() => handleDeleteTask(task.id)}
                  onEdit={() => handleEditTask(task)}
                  showQuickWinBadge
                  colors={colors}
                />
              ))}
            </View>
          </Animated.View>
        )}

        {/* Single Task Mode */}
        {singleTaskMode && singleTaskId && (
          <Animated.View entering={FadeInDown.springify()}>
            <View style={[styles.singleTaskModeHeader, { backgroundColor: colors.primary + '20' }]}>
              <View style={styles.singleTaskModeTitle}>
                <Text style={{ fontSize: 24 }}>☝️</Text>
                <Text style={[Typography.headline, { color: colors.text }]}>Just ONE Task</Text>
              </View>
              <Pressable 
                onPress={exitSingleTaskMode}
                style={[styles.exitButton, { backgroundColor: colors.surfaceSecondary }]}
              >
                <Text style={[Typography.caption1, { color: colors.primary }]}>Show All</Text>
              </Pressable>
            </View>
            <View style={styles.taskList}>
              {room.tasks.filter(t => t.id === singleTaskId).map((task, index) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  index={index}
                  expanded={true}
                  onToggle={() => {
                    handleTaskToggle(task.id);
                    if (!task.completed) {
                      const nextPending = room.tasks.find(t => !t.completed && t.id !== task.id);
                      if (nextPending) {
                        setSingleTaskId(nextPending.id);
                      } else {
                        exitSingleTaskMode();
                      }
                    }
                  }}
                  onExpand={() => {}}
                  onSubTaskToggle={(subTaskId) => handleSubTaskToggle(task.id, subTaskId)}
                  onDelete={() => handleDeleteTask(task.id)}
                  onEdit={() => handleEditTask(task)}
                  colors={colors}
                />
              ))}
            </View>
            <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
              <Text style={[Typography.body, { color: colors.textSecondary, textAlign: 'center' }]}>
                Focus on just this one task. You&apos;ve got this! 💪
              </Text>
            </View>
          </Animated.View>
        )}

        {/* High Priority Tasks */}
        {tasksByPriority.high.length > 0 && !singleTaskMode && (
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
                  onDelete={() => handleDeleteTask(task.id)}
                  onEdit={() => handleEditTask(task)}
                  colors={colors}
                />
              ))}
            </View>
          </Animated.View>
        )}

        {/* Medium Priority Tasks */}
        {tasksByPriority.medium.length > 0 && !singleTaskMode && (
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
                  onDelete={() => handleDeleteTask(task.id)}
                  onEdit={() => handleEditTask(task)}
                  colors={colors}
                />
              ))}
            </View>
          </Animated.View>
        )}

        {/* Low Priority Tasks */}
        {tasksByPriority.low.length > 0 && !singleTaskMode && (
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
                  onDelete={() => handleDeleteTask(task.id)}
                  onEdit={() => handleEditTask(task)}
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

      {/* Encouragement Banner */}
      {showEncouragement && (
        <Animated.View 
          entering={FadeInDown.springify()}
          exiting={FadeOut}
          style={styles.encouragementBanner}
        >
          <BlurView intensity={80} tint="dark" style={styles.encouragementBlur}>
            <Text style={[styles.encouragementText, { color: colors.textOnPrimary }]}>{showEncouragement}</Text>
          </BlurView>
        </Animated.View>
      )}

      {/* Combo Counter */}
      {comboCount >= 2 && (
        <Animated.View entering={ZoomIn.springify()} style={styles.comboCounter}>
          <Text style={[styles.comboText, { color: colors.textOnWarning }]}>{comboCount}x Combo!</Text>
        </Animated.View>
      )}

      {/* Milestone Particles */}
      {currentMilestone && (
        <View style={styles.milestoneOverlay}>
          <MilestoneParticles milestone={currentMilestone} colors={colors} />
        </View>
      )}

      {/* Photo Lightbox */}
      <PhotoLightbox
        photos={room.photos}
        selectedIndex={selectedPhotoIndex}
        onClose={() => setSelectedPhotoIndex(null)}
        onChangeIndex={setSelectedPhotoIndex}
        onDelete={(photoId) => deletePhotoFromRoom(room.id, photoId)}
        colors={colors}
        insets={insets}
      />

      {/* Room Complete Modal */}
      <RoomCompleteModal
        visible={showRoomComplete}
        room={room}
        totalTime={totalTime}
        onClose={() => setShowRoomComplete(false)}
        onTakePhoto={handleTakePhoto}
        onShare={handleShare}
        colors={colors}
      />

      {/* Good Enough Modal */}
      <GoodEnoughModal
        visible={showGoodEnough}
        colors={colors}
        onKeepGoing={() => setShowGoodEnough(false)}
        onDone={() => {
          setShowGoodEnough(false);
          router.back();
        }}
      />

      {/* Overwhelm Modal */}
      <OverwhelmModal
        visible={showOverwhelm}
        colors={colors}
        onClose={() => setShowOverwhelm(false)}
        onSingleTaskMode={() => {
          setShowOverwhelm(false);
          enterSingleTaskMode();
        }}
        onTakeBreak={() => {
          setShowOverwhelm(false);
          router.back();
        }}
        onComeBackTomorrow={() => {
          setShowOverwhelm(false);
          router.back();
        }}
      />

      {/* Toast for Undo */}
      <Toast
        visible={!!toastMessage}
        message={toastMessage || ''}
        action={deletedTask ? { label: 'Undo', onPress: handleUndoDelete } : undefined}
        onDismiss={() => {
          setToastMessage(null);
          setDeletedTask(null);
        }}
      />

      <TaskModal
        visible={showAddTask || !!editingTask}
        task={editingTask}
        colors={colors}
        onClose={() => {
          setShowAddTask(false);
          setEditingTask(null);
        }}
        onSave={handleSaveTask}
      />

      <SessionCheckIn
        visible={showSessionCheckIn}
        onComplete={(prefs) => {
          setSessionPreferences(prefs);
          setShowSessionCheckIn(false);
        }}
        onSkip={() => setShowSessionCheckIn(false)}
      />
    </View>
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
    flexGrow: 1,
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
    padding: Spacing.xs,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroSection: {
    paddingHorizontal: Spacing.ml,
    marginBottom: Spacing.md,
  },
  heroCard: {
    padding: Spacing.ml,
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
    paddingHorizontal: Spacing.ml,
    marginBottom: Spacing.md,
  },
  focusModeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
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
    ...Typography.title2,
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
  sessionIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 6,
    marginLeft: 4,
  },
  sessionIndicatorEmoji: {
    fontSize: 16,
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
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
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
    fontSize: 10,
    fontWeight: 'bold',
  },
  emptyStateSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  emptyStateCard: {
    padding: Spacing.xl,
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
    padding: Spacing.ml,
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
    ...Typography.title1,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  comboIndicator: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
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
    padding: Spacing.xxl,
  },
  emptyEmoji: {
    fontSize: 64,
  },
  encouragementBanner: {
    position: 'absolute',
    top: 120,
    alignSelf: 'center',
    zIndex: 90,
    borderRadius: 20,
    overflow: 'hidden',
  },
  encouragementBlur: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  encouragementText: {
    ...Typography.subheadlineMedium,
  },
  comboCounter: {
    position: 'absolute',
    top: 100,
    right: 20,
    backgroundColor: 'rgba(255, 149, 0, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 80,
  },
  comboText: {
    ...Typography.caption1Medium,
    fontWeight: '700',
  },
  milestoneOverlay: {
    position: 'absolute',
    top: '40%',
    alignSelf: 'center',
    zIndex: 100,
  },
  addTaskSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  addTaskButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.ml,
    borderRadius: BorderRadius.input,
    gap: Spacing.xs,
    minHeight: 44,
  },
  addTaskIcon: {
    fontSize: 20,
    fontWeight: '600',
    color: '#007AFF',
  },
  singleTaskModeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 16,
  },
  singleTaskModeTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  exitButton: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.card,
    minHeight: 44,
    justifyContent: 'center',
  },
});
