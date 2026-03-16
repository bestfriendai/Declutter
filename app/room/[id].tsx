/**
 * Declutterly - Room Detail Screen
 * Redesigned to match Pencil designs: hero photo with progress ring overlay,
 * clean task list, "Start to Declutter" CTA
 * With ADHD-friendly features: combo tracking, encouragement, single task mode
 */

import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Alert,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import Animated, {
    Easing,
    FadeIn,
    FadeInDown,
    FadeOut,
    useAnimatedProps,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSpring,
    withTiming,
    ZoomIn,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ComboCounter } from '@/components/ui/ComboCounter';
import { MysteryReward, RewardType } from '@/components/ui/MysteryReward';
import { ShareableCard } from '@/components/ui/ShareableCard';
import { Toast } from '@/components/ui/Toast';
import { XPPopup } from '@/components/ui/XPPopup';
import { AmbientBackdrop } from '@/components/ui/AmbientBackdrop';
import { ExpressiveStateView } from '@/components/ui/ExpressiveStateView';
import { Colors } from '@/constants/Colors';
import { useDeclutter } from '@/context/DeclutterContext';
import { Typography } from '@/theme/typography';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { CleaningTask, EnergyLevel, Room } from '@/types/declutter';

import type { SessionPreferences, TimeAvailable } from '@/components/room';
import {
    GoodEnoughModal,
    MilestoneParticles,
    OverwhelmModal,
    PhotoLightbox,
    RoomCompleteModal,
    SessionCheckIn,
    TaskCard,
    TaskModal,
} from '@/components/room';

const AnimatedCircle: any = Animated.createAnimatedComponent(Circle as any);

const ENCOURAGEMENT_MESSAGES = [
  "That's one less thing on your plate.",
  "Look at you actually doing it.",
  "One task at a time. That's the whole strategy.",
  "Progress, not perfection. You get it.",
  "Your space is literally getting calmer.",
  "Small wins add up faster than you think.",
  "Your brain just got a little dopamine. You're welcome.",
  "Your future self is already thanking you.",
  "This is what momentum feels like.",
  "See? Not as bad as the anxiety said it would be.",
  "Another one down. You're on a roll.",
  "The hardest part was starting. You already did that.",
];

// Progress ring component matching the Pencil design
function ProgressRing({
  progress,
  size = 160,
  strokeWidth = 10,
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
}) {
  const center = size / 2;
  const radius = center - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;
  const progressValue = Math.min(progress / 100, 1);

  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    animatedProgress.value = withDelay(
      300,
      withTiming(progressValue, {
        duration: 1400,
        easing: Easing.out(Easing.cubic),
      })
    );
  }, [progressValue]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - animatedProgress.value),
  }));

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        {/* Background track */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke="rgba(255,255,255,0.20)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress fill — always white over photo */}
        <AnimatedCircle
          cx={center}
          cy={center}
          r={radius}
          stroke="#FFFFFF"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          rotation="-90"
          origin={`${center}, ${center}`}
        />
      </Svg>
      {/* Center text — always white, it's over the photo */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{
            fontSize: 36,
            fontWeight: '700',
            color: '#FFFFFF',
            letterSpacing: -1,
            textShadowColor: 'rgba(0,0,0,0.4)',
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 3,
          }}>
            {Math.round(progress)}%
          </Text>
          <Text style={{
            fontSize: 13,
            fontWeight: '400',
            color: 'rgba(255,255,255,0.75)',
            marginTop: 2,
          }}>
            complete
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function RoomDetailScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
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
    stats,
  } = useDeclutter();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [filter, _setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [celebratingTask, setCelebratingTask] = useState<string | null>(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);

  const [comboCount, setComboCount] = useState(0);
  const [lastCompletionTime, setLastCompletionTime] = useState<number | null>(null);
  const [showEncouragement, setShowEncouragement] = useState<string | null>(null);

  // Reward system state
  const [xpPopup, setXPPopup] = useState<{
    visible: boolean;
    amount: number;
    combo?: number;
  } | null>(null);
  const [mysteryReward, setMysteryReward] = useState<{
    visible: boolean;
    type: RewardType;
    amount: number;
  } | null>(null);
  const tasksCompletedInSession = useRef(0);
  const sessionXPTotal = useRef(0);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_singleTaskMode, setSingleTaskMode] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_singleTaskId, setSingleTaskId] = useState<string | null>(null);

  const [showRoomComplete, setShowRoomComplete] = useState(false);
  const [showShareCard, setShowShareCard] = useState(false);
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

  // Reduced motion for accessibility
  const reducedMotion = useReducedMotion();

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

  const getTasksForSession = useCallback((preferences: SessionPreferences | null) => {
    if (!room) return [];

    let tasks = room.tasks ?? [];

    switch (filter) {
      case 'pending':
        tasks = tasks.filter(t => !t.completed);
        break;
      case 'completed':
        tasks = tasks.filter(t => t.completed);
        break;
    }

    if (preferences) {
      const energyOrder: EnergyLevel[] = ['minimal', 'low', 'moderate', 'high'];
      const userEnergyIndex = energyOrder.indexOf(preferences.energy);

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
      const availableMinutes = timeMinutes[preferences.time];

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
  }, [room, filter]);

  const filteredTasks = useMemo(
    () => getTasksForSession(sessionPreferences),
    [getTasksForSession, sessionPreferences]
  );

  const focusFirstPendingTask = useCallback((preferences: SessionPreferences | null) => {
    const nextTask = getTasksForSession(preferences).find(task => !task.completed);

    if (!nextTask) {
      return false;
    }

    setExpandedTasks(new Set([nextTask.id]));
    return true;
  }, [getTasksForSession]);

  const completedCount = room ? (room.tasks ?? []).filter(t => t.completed).length : 0;
  const totalCount = room ? (room.tasks ?? []).length : 0;
  const pendingCount = totalCount - completedCount;
  const totalTime = room ? (room.tasks ?? []).reduce((acc, t) => acc + (t.estimatedMinutes ?? 0), 0) : 0;

  const calculateNewProgress = useCallback((currentRoom: Room, completedTaskId: string) => {
    const tasks = currentRoom.tasks ?? [];
    if (tasks.length === 0) return 0;
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
    const tasks = room.tasks ?? [];
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    const task = tasks[taskIndex];

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
    const pendingTasks = (room.tasks ?? []).filter(t => !t.completed);
    if (pendingTasks.length > 0) {
      const quickWin = pendingTasks.find(t => t.difficulty === 'quick');
      setSingleTaskId(quickWin?.id || pendingTasks[0].id);
      setSingleTaskMode(true);
    }
  }, [room]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  if (!room) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? '#0A0A0A' : '#FAFAFA' }]}>
        <AmbientBackdrop isDark={isDark} variant="home" />
        <View style={styles.emptyContainer}>
          <ExpressiveStateView
            isDark={isDark}
            kicker="ROOM"
            icon="home-outline"
            title="Room not found"
            description="This room link no longer points to a saved space. Head back to your rooms and start a fresh flow."
            primaryLabel="Go Back"
            onPrimary={() => router.back()}
            secondaryLabel="Open Rooms"
            onSecondary={() => router.replace('/(tabs)/rooms')}
            style={styles.emptyStateCard}
          />
        </View>
      </View>
    );
  }

  const handleTaskToggle = (taskId: string) => {
    if (!room) return;
    const task = (room.tasks ?? []).find(t => t.id === taskId);
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
      tasksCompletedInSession.current += 1;

      const now = Date.now();
      let newCombo = 1;
      if (lastCompletionTime && now - lastCompletionTime < 5 * 60 * 1000) {
        newCombo = comboCount + 1;
        setComboCount(newCombo);
      } else {
        setComboCount(1);
      }
      setLastCompletionTime(now);

      const baseXP = 10;
      const comboBonus = newCombo > 1 ? newCombo * 2 : 0;
      const totalXP = baseXP + comboBonus;
      sessionXPTotal.current += totalXP;

      setXPPopup({
        visible: true,
        amount: totalXP,
        combo: newCombo > 1 ? newCombo : undefined,
      });

      if (tasksCompletedInSession.current % 3 === 0) {
        const rewards: RewardType[] = ['bonus_xp', 'streak_shield', 'mystery_collectible', 'mascot_treat'];
        const weights = [0.4, 0.25, 0.2, 0.15];
        const rand = Math.random();
        let cumulative = 0;
        let selectedReward: RewardType = 'bonus_xp';
        for (let i = 0; i < weights.length; i++) {
          cumulative += weights[i];
          if (rand <= cumulative) {
            selectedReward = rewards[i];
            break;
          }
        }
        setTimeout(() => {
          setMysteryReward({
            visible: true,
            type: selectedReward,
            amount: totalXP,
          });
        }, 2000);
      }

      if (Math.random() < 0.15) {
        const msg = ENCOURAGEMENT_MESSAGES[Math.floor(Math.random() * ENCOURAGEMENT_MESSAGES.length)];
        setShowEncouragement(msg);
        setTimeout(() => setShowEncouragement(null), 2500);
      }

      celebrateCompletion(taskId);

      const newProgress = calculateNewProgress(room, taskId);
      checkMilestones(newProgress, prevProgress);
    }
  };

  const handleStartFlow = () => {
    if (!room) return;
    if (settings.hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    if (!sessionPreferences) {
      setShowSessionCheckIn(true);
      return;
    }

    if (!focusFirstPendingTask(sessionPreferences)) {
      setShowSessionCheckIn(true);
    }
  };

  const handleSubTaskToggle = (taskId: string, subTaskId: string) => {
    if (!room) return;
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
    setShowShareCard(true);
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

  // Motivational message based on progress -- ADHD-friendly, specific and encouraging
  const getMotivationalText = () => {
    if (room.currentProgress >= 100) return 'Every task done. You crushed it.';
    if (room.currentProgress >= 75) return `Just ${pendingCount} ${pendingCount === 1 ? 'task' : 'tasks'} left. You can do this.`;
    if (room.currentProgress >= 50) return 'Halfway there -- momentum is real.';
    if (room.currentProgress >= 25) return `${completedCount} down. Keep the streak going.`;
    if (completedCount > 0) return 'Great start -- one task at a time.';
    return `${pendingCount} small steps. Pick the easiest one first.`;
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0A0A0A' : '#FAFAFA' }]}>
      {/* Celebration Overlay */}
      {celebratingTask && (
        <Animated.View
          entering={ZoomIn.duration(350)}
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
              entering={ZoomIn.delay(100).duration(350)}
              style={styles.celebrationEmojis}
            >
              {'\u{1F389}'} {'\u{1F3C6}'} {'\u2B50'} {'\u{1F31F}'} {'\u{1F4AB}'} {'\u{1F38A}'}
            </Animated.Text>
            <Animated.Text
              entering={FadeInDown.delay(200).duration(350)}
              style={[styles.celebrationText, { color: '#FFFFFF' }]}
            >
              Task Complete!
            </Animated.Text>
            {comboCount > 1 && (
              <Animated.View
                entering={ZoomIn.delay(300).duration(350)}
                style={[styles.comboIndicator, { backgroundColor: 'rgba(255,159,10,0.3)' }]}
              >
                <Text style={{ fontSize: 12, color: '#FF9F0A', fontWeight: '700' }}>
                  {'\u{1F525}'} {comboCount}x Combo!
                </Text>
              </Animated.View>
            )}
          </View>
        </Animated.View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bounces={true}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* ============================================= */}
        {/* HERO SECTION — Room photo with progress ring  */}
        {/* ============================================= */}
        <View style={styles.heroSection}>
          {/* Room photo background — tappable to open lightbox */}
          {room.photos.length > 0 ? (
            <Pressable
              onPress={() => setSelectedPhotoIndex(room.photos.length - 1)}
              accessibilityRole="button"
              accessibilityLabel="View room photo"
              style={StyleSheet.absoluteFill}
            >
              <Image
                source={{ uri: room.photos[room.photos.length - 1].uri }}
                style={styles.heroImage}
                contentFit="cover"
              />
            </Pressable>
          ) : (
            <View style={[styles.heroImage, { backgroundColor: isDark ? '#1C1C1E' : '#E5E5EA' }]}>
              <Text style={{ fontSize: 60 }}>{room.emoji}</Text>
            </View>
          )}

          {/* Gradient overlay — always dark so text is always legible over photo */}
          <LinearGradient
            colors={[
              'rgba(0,0,0,0.25)',
              'rgba(0,0,0,0)',
              'rgba(0,0,0,0.65)',
              'rgba(0,0,0,0.90)',
            ]}
            locations={[0, 0.2, 0.6, 1]}
            style={StyleSheet.absoluteFill}
          />

          {/* Header row — back button + room name */}
          <View style={[styles.heroHeader, { paddingTop: insets.top + 8 }]}>
            <Pressable
              onPress={() => router.back()}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Go back to Rooms"
              style={styles.heroBackButton}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="chevron-back" size={20} color="#FFFFFF" style={{
                  textShadowColor: 'rgba(0,0,0,0.5)',
                  textShadowOffset: { width: 0, height: 1 },
                  textShadowRadius: 3,
                }} />
                <Text style={{
                  fontSize: 17,
                  fontWeight: '400',
                  color: '#FFFFFF',
                  textShadowColor: 'rgba(0,0,0,0.5)',
                  textShadowOffset: { width: 0, height: 1 },
                  textShadowRadius: 3,
                }}>
                  Rooms
                </Text>
              </View>
            </Pressable>

            <Text style={{
              fontSize: 17,
              fontWeight: '600',
              color: '#FFFFFF',
              textAlign: 'center',
              textShadowColor: 'rgba(0,0,0,0.5)',
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 3,
            }}>
              {room.name}
            </Text>

            <Pressable
              onPress={handleDeleteRoom}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Room options"
              style={{ width: 60, alignItems: 'flex-end' }}
            >
              <Text style={{
                fontSize: 17,
                color: '#FFFFFF',
                textShadowColor: 'rgba(0,0,0,0.5)',
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 3,
              }}>
                {'\u2022\u2022\u2022'}
              </Text>
            </Pressable>
          </View>

          {/* Progress ring — centered */}
          <Animated.View
            entering={reducedMotion ? undefined : FadeIn.delay(300)}
            style={styles.progressRingContainer}
          >
            <ProgressRing
              progress={room.currentProgress}
              size={160}
              strokeWidth={10}
            />
          </Animated.View>

          {/* Motivational text — always white over photo */}
          <Animated.Text
            entering={reducedMotion ? undefined : FadeInDown.delay(500)}
            style={{
              fontSize: 15,
              fontWeight: '400',
              fontStyle: 'italic',
              color: 'rgba(255,255,255,0.70)',
              textAlign: 'center',
              marginTop: 12,
              paddingBottom: 20,
              textShadowColor: 'rgba(0,0,0,0.4)',
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 3,
            }}
          >
            {getMotivationalText()}
          </Animated.Text>
        </View>

        {/* ============================= */}
        {/* TO DO section header           */}
        {/* ============================= */}
        <Animated.View
          entering={reducedMotion ? undefined : FadeInDown.delay(400)}
          style={styles.todoHeader}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Text style={{
                fontSize: 11,
                fontWeight: '700',
                letterSpacing: 1.5,
                textTransform: 'uppercase',
                color: isDark ? '#808080' : '#6B6B6B',
              }}>
                TO DO
              </Text>
              <View style={{
                backgroundColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.07)',
                borderRadius: 10,
                paddingHorizontal: 8,
                paddingVertical: 3,
              }}>
                <Text style={{
                  fontSize: 11,
                  fontWeight: '700',
                  color: isDark ? 'rgba(255,255,255,0.60)' : 'rgba(0,0,0,0.45)',
                }}>
                  {pendingCount} {pendingCount !== 1 ? 'TASKS' : 'TASK'}
                </Text>
              </View>
            </View>

            {/* Time estimate -- helps ADHD brain commit */}
            {pendingCount > 0 && (
              <Text style={{
                fontSize: 11,
                fontWeight: '500',
                color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.30)',
              }}>
                ~{(room.tasks ?? []).filter(t => !t.completed).reduce((sum, t) => sum + (t.estimatedMinutes ?? 0), 0)} min total
              </Text>
            )}
          </View>

          {/* Session filter indicator */}
          {sessionPreferences && (
            <Pressable
              onPress={() => setShowSessionCheckIn(true)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                marginTop: 8,
                paddingHorizontal: 10,
                paddingVertical: 5,
                backgroundColor: isDark ? 'rgba(255,196,120,0.08)' : 'rgba(255,180,71,0.10)',
                borderRadius: 10,
                alignSelf: 'flex-start',
              }}
              accessibilityRole="button"
              accessibilityLabel="Adjust session preferences"
            >
              <Text style={{ fontSize: 11, color: isDark ? '#E6C28C' : '#8A6A3C' }}>
                Filtered for your energy
              </Text>
              <Text style={{ fontSize: 11, color: isDark ? 'rgba(230,194,140,0.6)' : 'rgba(138,106,60,0.6)' }}>
                Tap to adjust
              </Text>
            </Pressable>
          )}
        </Animated.View>

        {/* ============================= */}
        {/* Task cards list                */}
        {/* ============================= */}
        <View style={styles.taskListContainer}>
          {filteredTasks.map((task, index) => (
            <Animated.View
              key={task.id}
              entering={reducedMotion ? undefined : FadeInDown.delay(500 + index * 60)}
            >
              <TaskCard
                task={task}
                index={index}
                expanded={expandedTasks.has(task.id)}
                onToggle={() => handleTaskToggle(task.id)}
                onExpand={() => toggleTaskExpanded(task.id)}
                onSubTaskToggle={(subTaskId) => handleSubTaskToggle(task.id, subTaskId)}
                onDelete={() => handleDeleteTask(task.id)}
                onEdit={() => handleEditTask(task)}
                colors={colors}
                reducedMotion={reducedMotion}
                comboMultiplier={comboCount > 1 ? comboCount : undefined}
              />
            </Animated.View>
          ))}

          {filteredTasks.length === 0 && (
            <View style={styles.emptyTasks}>
              <Text style={{ fontSize: 40, marginBottom: 12 }}>{totalCount === 0 ? '\u{1F4F7}' : '\u{1F50D}'}</Text>
              <Text style={[Typography.body, { color: colors.textSecondary, textAlign: 'center' }]}>
                {totalCount === 0
                  ? 'Snap a photo of this room and AI will create small, doable tasks for you.'
                  : 'None of the remaining tasks match your current energy. That is okay -- you can adjust or view everything.'}
              </Text>

              <View style={styles.emptyActionsRow}>
                {totalCount === 0 ? (
                  <Pressable
                    onPress={handleTakePhoto}
                    style={[
                      styles.emptyActionButton,
                      { backgroundColor: isDark ? '#FFFFFF' : '#1A1A1A' },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Scan this room"
                  >
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: '600',
                        color: isDark ? '#0A0A0A' : '#FFFFFF',
                      }}
                    >
                      Scan this room
                    </Text>
                  </Pressable>
                ) : (
                  <>
                    <Pressable
                      onPress={() => setShowSessionCheckIn(true)}
                      style={[
                        styles.emptyActionButton,
                        { backgroundColor: isDark ? '#FFFFFF' : '#1A1A1A' },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel="Adjust your flow"
                    >
                      <Text
                        style={{
                          fontSize: 15,
                          fontWeight: '600',
                          color: isDark ? '#0A0A0A' : '#FFFFFF',
                        }}
                      >
                        Adjust your flow
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() => setSessionPreferences(null)}
                      style={[
                        styles.emptyActionButton,
                        styles.emptySecondaryButton,
                        {
                          backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                          borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                        },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel="Show all tasks"
                    >
                      <Text
                        style={{
                          fontSize: 15,
                          fontWeight: '600',
                          color: isDark ? '#FFFFFF' : '#1A1A1A',
                        }}
                      >
                        Show all tasks
                      </Text>
                    </Pressable>
                  </>
                )}
              </View>
            </View>
          )}
        </View>

        {/* "Start to Declutter" CTA — only show if there are pending tasks */}
        {pendingCount > 0 && (
          <Animated.View
            entering={reducedMotion ? undefined : FadeInDown.delay(700)}
            style={styles.ctaSection}
          >
            <Pressable
              onPress={handleStartFlow}
              style={({ pressed }) => [
                styles.ctaButton,
                {
                  backgroundColor: isDark ? '#FFFFFF' : '#1A1A1A',
                  opacity: pressed ? 0.9 : 1,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Start to Declutter"
            >
              <Text style={{
                fontSize: 17,
                fontWeight: '600',
                color: isDark ? '#0A0A0A' : '#FFFFFF',
              }}>
                {sessionPreferences ? 'Continue Decluttering' : 'Start to Declutter'}
              </Text>
              {!sessionPreferences && (
                <Text style={{
                  fontSize: 12,
                  fontWeight: '400',
                  color: isDark ? 'rgba(10,10,10,0.5)' : 'rgba(255,255,255,0.6)',
                  marginTop: 2,
                }}>
                  We will match tasks to your energy
                </Text>
              )}
            </Pressable>

            {/* Feeling stuck? — ADHD safety net always visible */}
            <View style={styles.stuckRow}>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowOverwhelm(true);
                }}
                style={({ pressed }) => [
                  styles.stuckButton,
                  {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Feeling overwhelmed"
              >
                <Text style={{
                  fontSize: 13,
                  fontWeight: '500',
                  color: isDark ? 'rgba(255,255,255,0.40)' : 'rgba(0,0,0,0.35)',
                }}>
                  Feeling stuck? Take a breath
                </Text>
              </Pressable>
            </View>
          </Animated.View>
        )}

        {/* Extra space so content doesn't hide behind tab bar */}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Encouragement Banner */}
      {showEncouragement && (
        <Animated.View
          entering={FadeInDown.duration(350)}
          exiting={FadeOut}
          style={styles.encouragementBanner}
        >
          <BlurView intensity={80} tint="dark" style={styles.encouragementBlur}>
            <Text style={[styles.encouragementText, { color: '#FFFFFF' }]}>{showEncouragement}</Text>
          </BlurView>
        </Animated.View>
      )}

      {/* Combo Counter */}
      <ComboCounter count={comboCount} visible={comboCount >= 2} position="floating" />

      {/* XP Popup */}
      {xpPopup?.visible && (
        <XPPopup
          amount={xpPopup.amount}
          isCombo={!!xpPopup.combo}
          comboCount={xpPopup.combo}
          visible={xpPopup.visible}
          onDismiss={() => setXPPopup(null)}
        />
      )}

      {/* Mystery Reward Modal */}
      {mysteryReward?.visible && (
        <MysteryReward
          visible={mysteryReward.visible}
          rewardType={mysteryReward.type}
          amount={mysteryReward.amount}
          onClaim={() => setMysteryReward(null)}
          onDismiss={() => setMysteryReward(null)}
        />
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

      {/* Shareable Before/After Card */}
      {showShareCard && room && (
        <ShareableCard
          beforeImageUri={room.photos.find(p => p.type === 'before')?.uri ?? ''}
          afterImageUri={room.photos.find(p => p.type === 'after')?.uri ?? room.photos[room.photos.length - 1]?.uri ?? ''}
          roomName={room.name}
          roomEmoji={room.emoji}
          tasksCompleted={room.tasks.filter(t => t.completed).length}
          timeSpent={totalTime}
          messLevelBefore={room.messLevel}
          messLevelAfter={Math.max(0, room.messLevel - room.currentProgress)}
          streak={stats?.currentStreak ?? 0}
          level={stats?.level ?? 1}
          visible={showShareCard}
          onShare={() => setShowShareCard(false)}
          onDismiss={() => setShowShareCard(false)}
        />
      )}

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
          focusFirstPendingTask(prefs);
        }}
        onSkip={() => {
          setShowSessionCheckIn(false);
          focusFirstPendingTask(null);
        }}
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
  // Hero section
  heroSection: {
    height: 360,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  heroBackButton: {
    width: 60,
    minHeight: 44,
    justifyContent: 'center',
  },
  progressRingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  // TO DO header
  todoHeader: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  // Task list
  taskListContainer: {
    paddingHorizontal: 20,
    gap: 10,
  },
  emptyTasks: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 16,
    gap: 16,
  },
  emptyActionsRow: {
    width: '100%',
    gap: 12,
    marginTop: 4,
  },
  emptyActionButton: {
    minHeight: 48,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  emptySecondaryButton: {
    borderWidth: 1,
  },
  // CTA button
  ctaSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 8,
  },
  ctaButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    minHeight: 56,
  },
  stuckRow: {
    alignItems: 'center',
    marginTop: 12,
  },
  stuckButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  // Celebration
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
  // Misc
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateCard: {
    width: '100%',
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
  milestoneOverlay: {
    position: 'absolute',
    top: '40%',
    alignSelf: 'center',
    zIndex: 100,
  },
});
