/**
 * Declutterly - Analysis Screen
 * Cinematic AI analysis with Apple TV style results reveal
 */

import { BlurView } from 'expo-blur';
import * as FileSystem from 'expo-file-system/legacy';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
    useColorScheme,
} from 'react-native';
import Animated, {
    Easing,
    FadeIn,
    FadeInDown,
    FadeInRight,
    FadeInUp,
    SlideInUp,
    ZoomIn,
    cancelAnimation,
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenErrorBoundary } from '@/components/ErrorBoundary';
import { SingleRing } from '@/components/ui/ActivityRings';
import { Confetti } from '@/components/ui/Confetti';
import { GlassCard } from '@/components/ui/GlassCard';
import { Colors, PriorityColors } from '@/constants/Colors';
import { useDeclutter } from '@/context/DeclutterContext';
import { useCardPress } from '@/hooks/useAnimatedPress';
import { analyzeProgress, analyzeRoomImage, getMotivation } from '@/services/ai';
import { Typography } from '@/theme/typography';
import { Spacing, BorderRadius } from '@/theme/spacing';
import { AIAnalysisResult, CleaningTask, MASCOT_PERSONALITIES, RoomType, Zone } from '@/types/declutter';

// Fallback task templates when AI is unavailable
type FallbackTask = {
  title: string;
  description: string;
  emoji: string;
  priority: 'high' | 'medium' | 'low';
  difficulty: 'quick' | 'medium' | 'challenging';
  estimatedMinutes: number;
};

const FALLBACK_TASKS: Record<RoomType, FallbackTask[]> = {
  bedroom: [
    { title: 'Make the bed', description: 'Straighten sheets and arrange pillows', emoji: '🛏️', priority: 'high', difficulty: 'quick', estimatedMinutes: 3 },
    { title: 'Pick up clothes from floor', description: 'Gather clothes and put in hamper or closet', emoji: '👕', priority: 'high', difficulty: 'quick', estimatedMinutes: 5 },
    { title: 'Clear nightstand clutter', description: 'Organize items on nightstand', emoji: '🪴', priority: 'medium', difficulty: 'quick', estimatedMinutes: 5 },
    { title: 'Put away clean laundry', description: 'Fold and store clean clothes', emoji: '🧺', priority: 'medium', difficulty: 'medium', estimatedMinutes: 10 },
    { title: 'Dust surfaces', description: 'Wipe down dresser and nightstands', emoji: '✨', priority: 'low', difficulty: 'quick', estimatedMinutes: 8 },
  ],
  kitchen: [
    { title: 'Wash dishes in sink', description: 'Clean and dry dishes', emoji: '🍽️', priority: 'high', difficulty: 'medium', estimatedMinutes: 10 },
    { title: 'Wipe down counters', description: 'Clean all counter surfaces', emoji: '🧽', priority: 'high', difficulty: 'quick', estimatedMinutes: 5 },
    { title: 'Put away items on counter', description: 'Store loose items in cabinets', emoji: '📦', priority: 'medium', difficulty: 'quick', estimatedMinutes: 8 },
    { title: 'Take out trash', description: 'Empty trash and recycling bins', emoji: '🗑️', priority: 'medium', difficulty: 'quick', estimatedMinutes: 3 },
    { title: 'Organize one cabinet or drawer', description: 'Sort and arrange items', emoji: '🗄️', priority: 'low', difficulty: 'medium', estimatedMinutes: 15 },
  ],
  bathroom: [
    { title: 'Wipe down sink and counter', description: 'Clean sink and counter area', emoji: '🚰', priority: 'high', difficulty: 'quick', estimatedMinutes: 5 },
    { title: 'Put away toiletries', description: 'Organize personal care items', emoji: '🧴', priority: 'medium', difficulty: 'quick', estimatedMinutes: 5 },
    { title: 'Clean mirror', description: 'Wipe mirror until streak-free', emoji: '🪞', priority: 'medium', difficulty: 'quick', estimatedMinutes: 3 },
    { title: 'Empty trash', description: 'Take out bathroom trash', emoji: '🗑️', priority: 'low', difficulty: 'quick', estimatedMinutes: 2 },
    { title: 'Organize under-sink cabinet', description: 'Sort items under sink', emoji: '📦', priority: 'low', difficulty: 'medium', estimatedMinutes: 10 },
  ],
  livingRoom: [
    { title: 'Pick up items from floor', description: 'Clear floor of clutter', emoji: '🧹', priority: 'high', difficulty: 'quick', estimatedMinutes: 5 },
    { title: 'Fluff and arrange pillows', description: 'Tidy up couch cushions', emoji: '🛋️', priority: 'medium', difficulty: 'quick', estimatedMinutes: 3 },
    { title: 'Clear coffee table', description: 'Remove items and wipe surface', emoji: '☕', priority: 'medium', difficulty: 'quick', estimatedMinutes: 5 },
    { title: 'Organize remote controls', description: 'Gather and store remotes', emoji: '📺', priority: 'low', difficulty: 'quick', estimatedMinutes: 3 },
    { title: 'Put away books and magazines', description: 'Shelve or recycle reading material', emoji: '📚', priority: 'low', difficulty: 'quick', estimatedMinutes: 8 },
  ],
  office: [
    { title: 'Clear desk surface', description: 'Remove items and organize', emoji: '🖥️', priority: 'high', difficulty: 'medium', estimatedMinutes: 10 },
    { title: 'Organize papers and files', description: 'Sort and file documents', emoji: '📄', priority: 'high', difficulty: 'medium', estimatedMinutes: 15 },
    { title: 'Untangle and organize cables', description: 'Bundle and route cables neatly', emoji: '🔌', priority: 'medium', difficulty: 'medium', estimatedMinutes: 10 },
    { title: 'Empty trash/recycling', description: 'Clear waste bins', emoji: '🗑️', priority: 'medium', difficulty: 'quick', estimatedMinutes: 3 },
    { title: 'Dust monitor and keyboard', description: 'Clean electronics', emoji: '💻', priority: 'low', difficulty: 'quick', estimatedMinutes: 5 },
  ],
  garage: [
    { title: 'Clear walkway', description: 'Remove obstacles from path', emoji: '🚗', priority: 'high', difficulty: 'medium', estimatedMinutes: 10 },
    { title: 'Return tools to storage', description: 'Put tools back in place', emoji: '🔧', priority: 'medium', difficulty: 'medium', estimatedMinutes: 15 },
    { title: 'Organize one shelf or bin', description: 'Sort items on one shelf', emoji: '📦', priority: 'medium', difficulty: 'medium', estimatedMinutes: 20 },
    { title: 'Sweep floor', description: 'Clean garage floor', emoji: '🧹', priority: 'low', difficulty: 'medium', estimatedMinutes: 10 },
    { title: 'Take recycling out', description: 'Move recyclables to bin', emoji: '♻️', priority: 'low', difficulty: 'quick', estimatedMinutes: 5 },
  ],
  closet: [
    { title: 'Pick up items from floor', description: 'Clear closet floor', emoji: '👟', priority: 'high', difficulty: 'quick', estimatedMinutes: 5 },
    { title: 'Hang up loose clothes', description: 'Put clothes on hangers', emoji: '👔', priority: 'high', difficulty: 'quick', estimatedMinutes: 10 },
    { title: 'Fold and organize one shelf', description: 'Tidy one shelf area', emoji: '👕', priority: 'medium', difficulty: 'quick', estimatedMinutes: 10 },
    { title: 'Match and pair shoes', description: 'Organize footwear', emoji: '👠', priority: 'medium', difficulty: 'quick', estimatedMinutes: 8 },
    { title: 'Donate pile - bag up 5 items', description: 'Select items to donate', emoji: '🎁', priority: 'low', difficulty: 'quick', estimatedMinutes: 10 },
  ],
  other: [
    { title: 'Pick up items from floor', description: 'Clear floor space', emoji: '🧹', priority: 'high', difficulty: 'quick', estimatedMinutes: 5 },
    { title: 'Clear main surfaces', description: 'Declutter tables and counters', emoji: '✨', priority: 'high', difficulty: 'quick', estimatedMinutes: 8 },
    { title: 'Put items in their homes', description: 'Return items to proper places', emoji: '🏠', priority: 'medium', difficulty: 'quick', estimatedMinutes: 10 },
    { title: 'Wipe down surfaces', description: 'Clean all surfaces', emoji: '🧽', priority: 'medium', difficulty: 'quick', estimatedMinutes: 8 },
    { title: 'Quick organization pass', description: 'General tidying', emoji: '📋', priority: 'low', difficulty: 'quick', estimatedMinutes: 10 },
  ],
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function AnalysisScreenContent() {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const { roomId, imageUri, mode } = useLocalSearchParams<{
    roomId: string;
    imageUri?: string;
    mode?: 'compare';
  }>();
  const {
    rooms,
    updateRoom,
    setTasksForRoom,
    isAnalyzing,
    setAnalyzing,
    analysisError,
    setAnalysisError,
    mascot,
  } = useDeclutter();

  const [result, setResult] = useState<AIAnalysisResult | null>(null);
  const [progressResult, setProgressResult] = useState<{
    progressPercentage: number;
    completedTasks: string[];
    remainingTasks: string[];
    encouragement: string;
  } | null>(null);
  const [motivation, setMotivation] = useState<string>('');
  const [loadingStage, setLoadingStage] = useState(0);
  // Results are shown when 'result' state is populated and celebration is done
  const [showCelebration, setShowCelebration] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [retryCount, setRetryCount] = useState(0);

  const room = rooms.find(r => r.id === roomId);

  // Animations
  const scanProgress = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.3);

  // Loading stages with emojis and descriptions
  const loadingStages = [
    { emoji: '📷', title: 'Capturing', subtitle: 'Processing your photo...' },
    { emoji: '🔍', title: 'Scanning', subtitle: 'Analyzing room layout...' },
    { emoji: '🧠', title: 'Thinking', subtitle: 'AI identifying clutter...' },
    { emoji: '📋', title: 'Planning', subtitle: 'Creating your tasks...' },
    { emoji: '✨', title: 'Finishing', subtitle: 'Almost ready!' },
  ];

  // Animate loading
  useEffect(() => {
    if (isAnalyzing) {
      // Scan line animation
      scanProgress.value = withRepeat(
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );

      // Pulse animation
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 800 }),
          withTiming(1, { duration: 800 })
        ),
        -1
      );

      // Glow animation
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 1000 }),
          withTiming(0.3, { duration: 1000 })
        ),
        -1
      );

      // Progress through stages
      const stageInterval = setInterval(() => {
        setLoadingStage(prev =>
          prev < loadingStages.length - 1 ? prev + 1 : prev
        );
      }, 2500);

      // Animate progress percentage
      const progressInterval = setInterval(() => {
        setLoadingProgress(prev => {
          // Progress more slowly as we approach completion
          if (prev < 60) return prev + Math.random() * 8 + 2;
          if (prev < 85) return prev + Math.random() * 4 + 1;
          if (prev < 95) return prev + Math.random() * 2 + 0.5;
          return Math.min(prev + 0.3, 98); // Cap at 98% until actual completion
        });
      }, 400);

      return () => {
        clearInterval(stageInterval);
        clearInterval(progressInterval);
        cancelAnimation(scanProgress);
        cancelAnimation(pulseScale);
        cancelAnimation(glowOpacity);
        scanProgress.value = 0;
        pulseScale.value = 1;
        glowOpacity.value = 0.3;
        setLoadingProgress(0);
      };
    }
  }, [isAnalyzing, scanProgress, pulseScale, glowOpacity]);

  useEffect(() => {
    if (mode === 'compare' && room && room.photos.length >= 2) {
      runProgressAnalysis();
    } else if (imageUri) {
      runAnalysis();
    }
    // Note: room is included to catch photo count changes for compare mode
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, imageUri, mode, room?.photos.length]);

  const scanLineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(scanProgress.value, [0, 1], [0, 300]) }],
    opacity: interpolate(scanProgress.value, [0, 0.5, 1], [0.5, 1, 0.5]),
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const runAnalysis = async () => {
    if (!imageUri || !roomId) return;

    setAnalyzing(true);
    setAnalysisError(null);
    setLoadingStage(0);

    try {
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: 'base64',
      });

      const analysisResult = await analyzeRoomImage(base64);
      setResult(analysisResult);

      updateRoom(roomId, {
        messLevel: analysisResult.messLevel,
        aiSummary: analysisResult.summary,
        motivationalMessage: analysisResult.encouragement,
        lastAnalyzedAt: new Date(),
      });

      setTasksForRoom(roomId, analysisResult.tasks);

      const motivationalMessage = await getMotivation(
        `User just analyzed their ${room?.type || 'room'}. Mess level: ${analysisResult.messLevel}%`
      );
      setMotivation(motivationalMessage);

      // Show celebration phase first, then results
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowCelebration(true);

      // Transition to results after celebration
      setTimeout(() => {
        setShowCelebration(false);
      }, 2500);
    } catch (error) {
      console.error('Analysis error:', error);
      setAnalysisError(
        error instanceof Error
          ? error.message
          : 'Failed to analyze image. Please try again.'
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const runProgressAnalysis = async () => {
    if (!room || room.photos.length < 2) return;

    setAnalyzing(true);
    setAnalysisError(null);

    try {
      const beforePhoto = room.photos.find(p => p.type === 'before') || room.photos[0];
      const latestPhoto = room.photos[room.photos.length - 1];

      const [beforeBase64, afterBase64] = await Promise.all([
        FileSystem.readAsStringAsync(beforePhoto.uri, { encoding: 'base64' }),
        FileSystem.readAsStringAsync(latestPhoto.uri, { encoding: 'base64' }),
      ]);

      const progress = await analyzeProgress(beforeBase64, afterBase64);
      setProgressResult(progress);

      if (roomId) {
        updateRoom(roomId, {
          currentProgress: Math.max(room.currentProgress, progress.progressPercentage),
        });
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Progress analysis error:', error);
      setAnalysisError(
        error instanceof Error
          ? error.message
          : 'Failed to analyze progress. Please try again.'
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const handleGoToRoom = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.replace(`/room/${roomId}`);
  };

  const handleRetry = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRetryCount(prev => prev + 1);
    setAnalysisError(null);
    if (mode === 'compare') {
      runProgressAnalysis();
    } else {
      runAnalysis();
    }
  };

  // Use fallback tasks when AI fails
  const handleUseFallbackTasks = async () => {
    if (!room) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    const roomType = room.type || 'other';
    const fallbackTemplates = FALLBACK_TASKS[roomType] || FALLBACK_TASKS.other;
    
    // Generate tasks from templates
    const tasks: CleaningTask[] = fallbackTemplates.map((template, index) => ({
      id: `fallback-${Date.now()}-${index}`,
      title: template.title,
      description: template.description,
      emoji: template.emoji,
      priority: template.priority,
      difficulty: template.difficulty,
      estimatedMinutes: template.estimatedMinutes,
      completed: false,
    }));
    
    // Update room with fallback tasks
    await setTasksForRoom(roomId, tasks);
    
    // Update room with fallback data
    if (imageUri && room) {
      updateRoom(roomId, {
        currentProgress: 0,
        lastAnalyzedAt: new Date(),
      });
    }
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace(`/room/${roomId}`);
  };

  const getErrorDetails = (error: string) => {
    if (error.includes('API key') || error.includes('configuration')) {
      return { emoji: '🔑', hint: 'Check your API key in Settings' };
    }
    if (error.includes('network') || error.includes('connection') || error.includes('internet')) {
      return { emoji: '📡', hint: 'Check your internet connection' };
    }
    if (error.includes('rate limit') || error.includes('Too many')) {
      return { emoji: '⏱️', hint: 'Wait a moment before trying again' };
    }
    if (error.includes('timeout')) {
      return { emoji: '⏳', hint: 'The request took too long. Try again.' };
    }
    return { emoji: '😕', hint: null };
  };

  // Cinematic Loading State
  if (isAnalyzing) {
    const currentStage = loadingStages[loadingStage];

    return (
      <View style={styles.container}>
        {/* Full screen image with effects */}
        {imageUri && (
          <View style={styles.loadingImageContainer}>
            <Image
              source={{ uri: imageUri }}
              style={styles.loadingImage}
              contentFit="cover"
            />

            {/* Dark overlay with gradient */}
            <LinearGradient
              colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.8)']}
              style={StyleSheet.absoluteFill}
            />

            {/* Scanning effect */}
            <View style={styles.scanContainer}>
              {/* Animated scan line */}
              <Animated.View style={[styles.scanLine, scanLineStyle]}>
                <LinearGradient
                  colors={['transparent', '#A78BFA', '#818CF8', 'transparent']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
              </Animated.View>

              {/* Corner brackets */}
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />

              {/* Glow effect */}
              <Animated.View style={[styles.scanGlow, glowStyle]}>
                <LinearGradient
                  colors={['transparent', 'rgba(139, 92, 246, 0.3)', 'transparent']}
                  style={StyleSheet.absoluteFill}
                />
              </Animated.View>
            </View>
          </View>
        )}

        {/* Loading card */}
        <Animated.View
          entering={SlideInUp.springify()}
          style={[styles.loadingCard, { paddingBottom: insets.bottom + 20 }]}
        >
          <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />

          <View style={styles.loadingContent}>
            {/* Stage emoji with pulse */}
            <Animated.View style={[styles.stageEmojiContainer, pulseStyle]}>
              <LinearGradient
                colors={['rgba(139, 92, 246, 0.3)', 'rgba(59, 130, 246, 0.2)']}
                style={styles.stageEmojiGradient}
              />
              <Text style={styles.stageEmoji}>{currentStage.emoji}</Text>
            </Animated.View>

            {/* Stage text */}
            <Text style={[Typography.title2, { color: '#FFFFFF', marginTop: 16 }]}>
              {currentStage.title}
            </Text>
            <Text style={[Typography.body, { color: 'rgba(255,255,255,0.7)', marginTop: 4 }]}>
              {currentStage.subtitle}
            </Text>

            {/* Progress percentage */}
            <View style={styles.progressPercentContainer}>
              <Text style={styles.progressPercentText}>
                {Math.round(loadingProgress)}%
              </Text>
              <View style={styles.progressBarBg}>
                <Animated.View
                  style={[
                    styles.progressBarFill,
                    { width: `${Math.min(loadingProgress, 100)}%` },
                  ]}
                >
                  <LinearGradient
                    colors={['#A78BFA', '#818CF8', '#6366F1']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFill}
                  />
                </Animated.View>
              </View>
            </View>

            {/* Progress indicators */}
            <View style={styles.stageIndicators}>
              {loadingStages.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.stageIndicator,
                    {
                      backgroundColor: index <= loadingStage
                        ? '#A78BFA'
                        : 'rgba(255,255,255,0.2)',
                      width: index <= loadingStage ? 24 : 8,
                    },
                  ]}
                />
              ))}
            </View>

            {/* Tip */}
            <View style={styles.tipBadge}>
              <Text style={[Typography.caption1, { color: 'rgba(255,255,255,0.8)' }]}>
                💡 The more visible your room, the better the analysis!
              </Text>
            </View>

            {/* Time estimate */}
            <Text style={[Typography.caption2, { color: 'rgba(255,255,255,0.5)', marginTop: 12, textAlign: 'center' }]}>
              Usually takes about 30 seconds
            </Text>

            {/* Mascot encouragement */}
            {mascot && (
              <View style={styles.mascotEncouragement}>
                <Text style={styles.mascotLoadingEmoji}>
                  {MASCOT_PERSONALITIES[mascot.personality]?.emoji || '🧹'}
                </Text>
                <Text style={[Typography.caption1, { color: 'rgba(255,255,255,0.7)', marginLeft: 8, flex: 1 }]}>
                  {mascot.name || 'Your buddy'} is analyzing your space...
                </Text>
              </View>
            )}
          </View>
        </Animated.View>

        {/* Back button */}
        <Animated.View
          entering={FadeIn.delay(200)}
          style={[styles.backButton, { top: insets.top + 12 }]}
        >
          <Pressable
            onPress={() => router.back()}
            style={styles.glassButton}
            accessibilityRole="button"
            accessibilityLabel="Close analysis"
          >
            <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
            <Text style={{ color: '#FFFFFF', fontSize: 18 }}>✕</Text>
          </Pressable>
        </Animated.View>
      </View>
    );
  }

  // Celebration phase - brief moment of joy before results
  if (showCelebration && result) {
    return (
      <View style={[styles.container, styles.celebrationContainer]}>
        <LinearGradient
          colors={colorScheme === 'dark'
            ? ['#1a1a2e', '#16213e', '#0f3460']
            : ['#f8f9fa', '#e9ecef', '#dee2e6']}
          style={StyleSheet.absoluteFill}
        />

        {/* Confetti */}
        <Confetti visible={showCelebration} intensity="heavy" />

        {/* Celebration content */}
        <Animated.View
          entering={ZoomIn.springify()}
          style={styles.celebrationContent}
        >
          <Text style={styles.celebrationEmoji}>🎉</Text>
          <Text style={[Typography.largeTitle, { color: colors.text, marginTop: 16 }]}>
            Analysis Complete!
          </Text>
          <Text style={[Typography.body, { color: colors.textSecondary, marginTop: 8, textAlign: 'center' }]}>
            Found {result.tasks.length} tasks to transform your space
          </Text>

          {/* Quick stats preview */}
          <View style={styles.celebrationStats}>
            <View style={styles.celebrationStat}>
              <Text style={[styles.celebrationStatValue, { color: colors.primary }]}>
                {result.messLevel}%
              </Text>
              <Text style={[Typography.caption1, { color: colors.textSecondary }]}>
                Clutter
              </Text>
            </View>
            <View style={[styles.celebrationStatDivider, { backgroundColor: colors.border }]} />
            <View style={styles.celebrationStat}>
              <Text style={[styles.celebrationStatValue, { color: colors.success }]}>
                {result.tasks.length}
              </Text>
              <Text style={[Typography.caption1, { color: colors.textSecondary }]}>
                Tasks
              </Text>
            </View>
            <View style={[styles.celebrationStatDivider, { backgroundColor: colors.border }]} />
            <View style={styles.celebrationStat}>
              <Text style={[styles.celebrationStatValue, { color: colors.warning }]}>
                {result.quickWins.length}
              </Text>
              <Text style={[Typography.caption1, { color: colors.textSecondary }]}>
                Quick Wins
              </Text>
            </View>
          </View>

          {/* Loading to results indicator */}
          <View style={styles.celebrationLoader}>
            <Text style={[Typography.caption1, { color: colors.textTertiary }]}>
              Preparing your plan...
            </Text>
          </View>
        </Animated.View>
      </View>
    );
  }

  // Error state
  if (analysisError) {
    const { emoji, hint } = getErrorDetails(analysisError);
    
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <LinearGradient
          colors={colorScheme === 'dark'
            ? ['#1a1a2e', '#16213e', '#0f3460']
            : ['#f8f9fa', '#e9ecef', '#dee2e6']}
          style={StyleSheet.absoluteFill}
        />

        <Animated.View
          entering={ZoomIn.springify()}
          style={styles.errorContent}
        >
          <Text style={styles.errorEmoji}>{emoji}</Text>
          <Text style={[Typography.title1, { color: colors.text, marginTop: 20 }]}>
            Oops!
          </Text>
          <Text style={[Typography.body, { color: colors.textSecondary, textAlign: 'center', marginTop: 8, maxWidth: 280 }]}>
            {analysisError}
          </Text>
          
          {hint && (
            <Animated.View entering={FadeIn.delay(200)}>
              <Text style={[Typography.caption1, { color: colors.primary, textAlign: 'center', marginTop: 12 }]}>
                💡 {hint}
              </Text>
            </Animated.View>
          )}
          
          {retryCount > 0 && (
            <Text style={[Typography.caption2, { color: colors.textTertiary, marginTop: 8 }]}>
              Attempt {retryCount + 1}
            </Text>
          )}

          <View style={styles.errorButtons}>
            <Pressable
              onPress={handleRetry}
              style={({ pressed }) => [styles.primaryButton, { opacity: pressed ? 0.8 : 1 }]}
            >
              <LinearGradient
                colors={[...colors.gradientPrimary]}
                style={StyleSheet.absoluteFill}
              />
              <Text style={[Typography.headline, { color: '#FFFFFF' }]}>Try Again</Text>
            </Pressable>

            {/* Fallback option - use default tasks */}
            {mode !== 'compare' && room && (
              <Pressable
                onPress={handleUseFallbackTasks}
                style={({ pressed }) => [styles.fallbackButton, { 
                  opacity: pressed ? 0.8 : 1,
                  backgroundColor: colors.success + '20',
                  borderColor: colors.success,
                }]}
              >
                <Text style={[Typography.headline, { color: colors.success }]}>
                  Use Default Tasks
                </Text>
                <Text style={[Typography.caption2, { color: colors.textSecondary, marginTop: 2 }]}>
                  Start with common {room.type || 'room'} tasks
                </Text>
              </Pressable>
            )}

            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [styles.secondaryButton, { opacity: pressed ? 0.8 : 1 }]}
            >
              <Text style={[Typography.body, { color: colors.textSecondary }]}>Go Back</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    );
  }

  // Progress comparison results
  if (mode === 'compare' && progressResult) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 100 },
          ]}
          contentInsetAdjustmentBehavior="automatic"
          showsVerticalScrollIndicator={false}
        >
          {/* Hero section */}
          <Animated.View entering={FadeInDown.delay(100).springify()}>
            <GlassCard variant="hero" style={styles.progressHero}>
              <LinearGradient
                colors={['rgba(34, 197, 94, 0.3)', 'rgba(59, 130, 246, 0.2)']}
                style={StyleSheet.absoluteFill}
              />
              <Text style={styles.heroEmoji}>🎉</Text>
              <Text style={[Typography.largeTitle, { color: '#FFFFFF', marginTop: 12 }]}>
                Great Progress!
              </Text>

              <View style={styles.progressRingContainer}>
                <SingleRing
                  progress={progressResult.progressPercentage}
                  size={140}
                  strokeWidth={12}
                  color={colors.success}
                  backgroundColor="rgba(255,255,255,0.1)"
                />
                <View style={styles.progressRingCenter}>
                  <Text style={[Typography.displayMedium, { color: '#FFFFFF' }]}>
                    {progressResult.progressPercentage}%
                  </Text>
                  <Text style={[Typography.caption1, { color: 'rgba(255,255,255,0.7)' }]}>
                    improvement
                  </Text>
                </View>
              </View>
            </GlassCard>
          </Animated.View>

          {/* Completed tasks */}
          {progressResult.completedTasks.length > 0 && (
            <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.section}>
              <Text style={[Typography.title3, { color: colors.text, marginBottom: 12 }]}>
                ✅ What You Accomplished
              </Text>
              <GlassCard style={styles.tasksList}>
                {progressResult.completedTasks.map((task, i) => (
                  <Animated.View
                    key={i}
                    entering={FadeInRight.delay(i * 50)}
                    style={styles.completedTask}
                  >
                    <View style={styles.taskCheckmark}>
                      <Text style={{ color: colors.success }}>✓</Text>
                    </View>
                    <Text style={[Typography.body, { color: colors.text, flex: 1 }]}>
                      {task}
                    </Text>
                  </Animated.View>
                ))}
              </GlassCard>
            </Animated.View>
          )}

          {/* Remaining tasks */}
          {progressResult.remainingTasks.length > 0 && (
            <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.section}>
              <Text style={[Typography.title3, { color: colors.text, marginBottom: 12 }]}>
                📋 Still To Do
              </Text>
              <GlassCard style={styles.tasksList}>
                {progressResult.remainingTasks.map((task, i) => (
                  <View key={i} style={styles.remainingTask}>
                    <View style={styles.taskBullet} />
                    <Text style={[Typography.body, { color: colors.textSecondary, flex: 1 }]}>
                      {task}
                    </Text>
                  </View>
                ))}
              </GlassCard>
            </Animated.View>
          )}

          {/* Encouragement */}
          <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.section}>
            <GlassCard variant="elevated" style={styles.encouragementCard}>
              <Text style={styles.encouragementEmoji}>💪</Text>
              <Text style={[Typography.body, { color: colors.text, textAlign: 'center', marginTop: 12 }]}>
                {progressResult.encouragement}
              </Text>
            </GlassCard>
          </Animated.View>

          {/* Action button */}
          <Animated.View entering={FadeInUp.delay(500).springify()} style={styles.actionSection}>
            <Pressable
              onPress={handleGoToRoom}
              style={({ pressed }) => [styles.actionButton, { opacity: pressed ? 0.9 : 1 }]}
            >
              <LinearGradient
                colors={[...colors.gradientPrimary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <Text style={[Typography.headline, { color: '#FFFFFF' }]}>
                Continue Cleaning
              </Text>
            </Pressable>
          </Animated.View>
        </ScrollView>

        {/* Back button */}
        <Animated.View
          entering={FadeIn}
          style={[styles.backButton, { top: insets.top + 12 }]}
        >
          <Pressable
            onPress={() => router.back()}
            style={styles.glassButtonDark}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <BlurView intensity={60} tint={colorScheme} style={StyleSheet.absoluteFill} />
            <Text style={[Typography.body, { color: colors.text }]}>← Back</Text>
          </Pressable>
        </Animated.View>
      </View>
    );
  }

  // Analysis results
  if (result) {
    const totalTime = result.tasks.reduce((acc, t) => acc + t.estimatedMinutes, 0);
    const hours = Math.floor(totalTime / 60);
    const minutes = totalTime % 60;
    const timeString = hours > 0 ? `${hours}h ${minutes}m` : `${minutes} min`;

    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 100 },
          ]}
          contentInsetAdjustmentBehavior="automatic"
          showsVerticalScrollIndicator={false}
        >
          {/* Hero with image preview */}
          <Animated.View entering={FadeInDown.delay(100).springify()}>
            <View style={styles.resultHero}>
              {imageUri && (
                <Image
                  source={{ uri: imageUri }}
                  style={styles.resultHeroImage}
                  contentFit="cover"
                />
              )}
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.8)']}
                style={styles.resultHeroGradient}
              />
              <View style={styles.resultHeroContent}>
                <Text style={styles.resultEmoji}>✨</Text>
                <Text style={[Typography.largeTitle, { color: '#FFFFFF' }]}>
                  Analysis Complete!
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* Stats row */}
          <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.statsRow}>
            <View style={styles.statItem}>
              <SingleRing
                progress={100 - result.messLevel}
                size={80}
                strokeWidth={8}
                color={result.messLevel > 70 ? colors.error : result.messLevel > 40 ? colors.warning : colors.success}
                backgroundColor={colorScheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}
              />
              <View style={styles.statCenter}>
                <Text style={[Typography.title2, { color: colors.text }]}>
                  {result.messLevel}%
                </Text>
              </View>
              <Text style={[Typography.caption1, { color: colors.textSecondary, marginTop: 8 }]}>
                Clutter Level
              </Text>
            </View>

            <View style={styles.statItem}>
              <View style={styles.statCircle}>
                <Text style={styles.statNumber}>{result.tasks.length}</Text>
              </View>
              <Text style={[Typography.caption1, { color: colors.textSecondary, marginTop: 8 }]}>
                Tasks
              </Text>
            </View>

            <View style={styles.statItem}>
              <View style={styles.statCircle}>
                <Text style={styles.statTime}>{timeString}</Text>
              </View>
              <Text style={[Typography.caption1, { color: colors.textSecondary, marginTop: 8 }]}>
                Est. Time
              </Text>
            </View>
          </Animated.View>

          {result.zones && result.zones.length > 0 && (
            <Animated.View entering={FadeInDown.delay(250).springify()} style={styles.section}>
              <Text style={[Typography.title3, { color: colors.text, marginBottom: 12 }]}>
                🗺️ Room Zones
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.zonesScroll}
              >
                {result.zones.map((zone, i) => (
                  <ZoneCard key={zone.id || i} zone={zone} index={i} />
                ))}
              </ScrollView>
            </Animated.View>
          )}

          <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.section}>
            <GlassCard style={styles.summaryCard}>
              <Text style={[Typography.body, { color: colors.text }]}>
                {result.summary}
              </Text>
            </GlassCard>
          </Animated.View>

          {/* Quick wins */}
          {result.quickWins.length > 0 && (
            <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.section}>
              <Text style={[Typography.title3, { color: colors.text, marginBottom: 12 }]}>
                ⚡ Quick Wins
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.quickWinsScroll}
              >
                {result.quickWins.slice(0, 4).map((win, i) => {
                  let displayText: string;
                  if (typeof win === 'string') {
                    displayText = win;
                  } else {
                    displayText = win.task ?? win.reason ?? 'Quick win';
                  }
                  return <QuickWinCard key={i} text={displayText} delay={i * 50} />;
                })}
              </ScrollView>
            </Animated.View>
          )}

          {/* Tasks preview */}
          <Animated.View entering={FadeInDown.delay(500).springify()} style={styles.section}>
            <Text style={[Typography.title3, { color: colors.text, marginBottom: 12 }]}>
              📋 Your Plan
            </Text>
            <GlassCard style={styles.tasksList}>
              {result.tasks.slice(0, 5).map((task, i) => (
                <TaskPreviewCard key={task.id} task={task} index={i} />
              ))}
              {result.tasks.length > 5 && (
                <View style={styles.moreTasks}>
                  <Text style={[Typography.caption1, { color: colors.textSecondary }]}>
                    +{result.tasks.length - 5} more tasks
                  </Text>
                </View>
              )}
            </GlassCard>
          </Animated.View>

          {/* Encouragement */}
          <Animated.View entering={FadeInDown.delay(600).springify()} style={styles.section}>
            <GlassCard variant="elevated" style={styles.encouragementCard}>
              <Text style={styles.encouragementEmoji}>💪</Text>
              <Text style={[Typography.body, { color: colors.text, textAlign: 'center', marginTop: 12 }]}>
                {result.encouragement}
              </Text>
              {motivation && (
                <Text style={[Typography.caption1, { color: colors.textSecondary, textAlign: 'center', marginTop: 8 }]}>
                  {motivation}
                </Text>
              )}
            </GlassCard>
          </Animated.View>

          {/* Action button */}
          <Animated.View entering={FadeInUp.delay(700).springify()} style={styles.actionSection}>
            <Pressable
              onPress={handleGoToRoom}
              style={({ pressed }) => [styles.actionButton, { opacity: pressed ? 0.9 : 1 }]}
            >
              <LinearGradient
                colors={[...colors.gradientPrimary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <Text style={[Typography.headline, { color: '#FFFFFF' }]}>
                🚀 Start Cleaning
              </Text>
            </Pressable>
          </Animated.View>
        </ScrollView>

        {/* Back button */}
        <Animated.View
          entering={FadeIn}
          style={[styles.backButton, { top: insets.top + 12 }]}
        >
          <Pressable
            onPress={() => router.back()}
            style={styles.glassButtonDark}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <BlurView intensity={60} tint={colorScheme} style={StyleSheet.absoluteFill} />
            <Text style={[Typography.body, { color: colors.text }]}>← Back</Text>
          </Pressable>
        </Animated.View>
      </View>
    );
  }

  // Fallback
  return (
    <View style={[styles.container, styles.fallbackContainer, { backgroundColor: colors.background }]}>
      <Text style={[Typography.title2, { color: colors.text }]}>No analysis data</Text>
      <Pressable onPress={() => router.back()} style={styles.fallbackGoBackButton}>
        <Text style={[Typography.body, { color: colors.primary }]}>Go Back</Text>
      </Pressable>
    </View>
  );
}

// Quick Win Card
function QuickWinCard({ text, delay }: { text: string; delay: number }) {
  const colorScheme = useColorScheme() ?? 'dark';
  const { animatedStyle, onPressIn, onPressOut } = useCardPress();

  return (
    <Animated.View entering={FadeInRight.delay(delay)}>
      <AnimatedPressable
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={animatedStyle}
      >
        <View
          style={[
            styles.quickWinCard,
            {
              backgroundColor: colorScheme === 'dark'
                ? 'rgba(251, 146, 60, 0.15)'
                : 'rgba(251, 146, 60, 0.1)',
            },
          ]}
        >
          <Text style={{ fontSize: 20 }}>⚡</Text>
          <Text
            style={[Typography.caption1Medium, { color: '#FB923C', marginTop: 8 }]}
            numberOfLines={3}
          >
            {text}
          </Text>
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
}

function TaskPreviewCard({ task, index }: { task: CleaningTask; index: number }) {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const priorityColor = PriorityColors[task.priority];

  return (
    <Animated.View
      entering={FadeInRight.delay(index * 50)}
      style={styles.taskPreview}
    >
      <Text style={styles.taskEmoji}>{task.emoji}</Text>
      <View style={styles.taskInfo}>
        <Text style={[Typography.body, { color: colors.text }]} numberOfLines={1}>
          {task.title}
        </Text>
        <View style={styles.taskMeta}>
          <Text style={[Typography.caption1, { color: colors.textSecondary }]}>
            ~{task.estimatedMinutes} min
          </Text>
          <View style={[styles.priorityBadge, { backgroundColor: priorityColor + '20' }]}>
            <Text style={[Typography.caption2, { color: priorityColor }]}>
              {task.priority}
            </Text>
          </View>
          {task.difficulty === 'quick' && (
            <Text style={[Typography.caption2, { color: colors.success }]}>Quick!</Text>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

function ZoneCard({ zone, index }: { zone: Zone; index: number }) {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const priorityColor = PriorityColors[zone.priority];
  
  const densityEmoji = {
    low: '🟢',
    medium: '🟡',
    high: '🟠',
    extreme: '🔴',
  }[zone.clutterDensity] || '⚪';

  const typeEmoji = {
    floor: '🚶',
    surface: '🪑',
    storage: '📦',
    fixture: '🛁',
  }[zone.type] || '📍';

  return (
    <Animated.View entering={FadeInRight.delay(index * 80)}>
      <View
        style={[
          styles.zoneCard,
          {
            backgroundColor: colorScheme === 'dark'
              ? 'rgba(255, 255, 255, 0.08)'
              : 'rgba(0, 0, 0, 0.04)',
            borderColor: priorityColor + '40',
          },
        ]}
      >
        <View style={styles.zoneHeader}>
          <Text style={styles.zoneTypeEmoji}>{typeEmoji}</Text>
          <View style={[styles.zonePriorityDot, { backgroundColor: priorityColor }]} />
        </View>
        <Text
          style={[Typography.headline, { color: colors.text, marginBottom: 4 }]}
          numberOfLines={1}
        >
          {zone.name}
        </Text>
        <Text
          style={[Typography.caption1, { color: colors.textSecondary, marginBottom: 8 }]}
          numberOfLines={2}
        >
          {zone.description}
        </Text>
        <View style={styles.zoneStats}>
          <Text style={[Typography.caption2, { color: colors.textTertiary }]}>
            {densityEmoji} {zone.itemCount} items
          </Text>
          <Text style={[Typography.caption2, { color: colors.textTertiary }]}>
            ~{zone.estimatedClearTime} min
          </Text>
        </View>
      </View>
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
    paddingHorizontal: 20,
  },
  // Loading styles
  loadingImageContainer: {
    flex: 1,
  },
  loadingImage: {
    flex: 1,
    width: '100%',
  },
  scanContainer: {
    ...StyleSheet.absoluteFillObject,
    margin: 24,
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 4,
    borderRadius: 2,
  },
  corner: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderColor: 'rgba(167, 139, 250, 0.8)',
  },
  cornerTL: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 16 },
  cornerTR: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 16 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 16 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 16 },
  scanGlow: {
    ...StyleSheet.absoluteFillObject,
  },
  loadingCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: BorderRadius.card + 12,
    borderTopRightRadius: BorderRadius.card + 12,
    overflow: 'hidden',
    paddingTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  loadingContent: {
    alignItems: 'center',
  },
  stageEmojiContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  stageEmojiGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 40,
  },
  stageEmoji: {
    fontSize: 36,
  },
  progressPercentContainer: {
    alignItems: 'center',
    marginTop: 20,
    width: '100%',
  },
  progressPercentText: {
    ...Typography.monoHero,
    fontSize: 42,
    color: '#FFFFFF',
    letterSpacing: -1,
    marginBottom: Spacing.sm,
  },
  progressBarBg: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
    overflow: 'hidden',
  },
  stageIndicators: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 20,
  },
  stageIndicator: {
    height: 4,
    borderRadius: 2,
  },
  tipBadge: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.chip,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  mascotEncouragement: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.chip,
    backgroundColor: 'rgba(167, 139, 250, 0.15)',
  },
  mascotLoadingEmoji: {
    fontSize: 24,
  },
  backButton: {
    position: 'absolute',
    left: 16,
    zIndex: 10,
  },
  glassButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  glassButtonDark: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.card,
    overflow: 'hidden',
    minHeight: 44,
    justifyContent: 'center',
  },
  // Error styles
  errorContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  errorEmoji: {
    fontSize: 64,
  },
  errorButtons: {
    marginTop: Spacing.xl,
    gap: Spacing.sm,
    width: '100%',
    maxWidth: 280,
  },
  primaryButton: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.button,
    overflow: 'hidden',
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  fallbackButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.button,
    alignItems: 'center',
    borderWidth: 2,
    minHeight: 44,
    justifyContent: 'center',
  },
  secondaryButton: {
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  // Progress results
  progressHero: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  heroEmoji: {
    fontSize: 48,
  },
  progressRingContainer: {
    marginTop: 24,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressRingCenter: {
    position: 'absolute',
    alignItems: 'center',
  },
  // Result styles
  resultHero: {
    height: 200,
    borderRadius: BorderRadius.card,
    overflow: 'hidden',
    marginBottom: Spacing.ml,
  },
  resultHeroImage: {
    ...StyleSheet.absoluteFillObject,
  },
  resultHeroGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  resultHeroContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    alignItems: 'center',
  },
  resultEmoji: {
    fontSize: 36,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.lg,
  },
  statItem: {
    alignItems: 'center',
    position: 'relative',
  },
  statCenter: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statNumber: {
    ...Typography.title1,
    color: '#A78BFA',
  },
  statTime: {
    ...Typography.subheadlineMedium,
    color: '#A78BFA',
  },
  section: {
    marginBottom: Spacing.lg,
  },
  summaryCard: {
    padding: Spacing.md,
  },
  quickWinsScroll: {
    gap: 12,
  },
  quickWinCard: {
    width: 140,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  tasksList: {
    padding: 12,
    gap: 8,
  },
  taskPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  taskEmoji: {
    fontSize: 28,
    marginRight: 12,
  },
  taskInfo: {
    flex: 1,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  moreTasks: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  completedTask: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  taskCheckmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  remainingTask: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  taskBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginRight: 12,
  },
  encouragementCard: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  encouragementEmoji: {
    fontSize: 40,
  },
  actionSection: {
    marginTop: 8,
    marginBottom: 20,
  },
  actionButton: {
    paddingVertical: 18,
    borderRadius: BorderRadius.button,
    overflow: 'hidden',
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  fallbackContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackGoBackButton: {
    marginTop: 16,
    padding: 12,
  },
  zonesScroll: {
    gap: 12,
    paddingRight: 16,
  },
  zoneCard: {
    width: 180,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  zoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  zoneTypeEmoji: {
    fontSize: 20,
  },
  zonePriorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  zoneStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  celebrationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  celebrationContent: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  celebrationEmoji: {
    fontSize: 72,
  },
  celebrationStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 32,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  celebrationStat: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  celebrationStatValue: {
    ...Typography.title1,
  },
  celebrationStatDivider: {
    width: 1,
    height: 40,
  },
  celebrationLoader: {
    marginTop: 32,
    opacity: 0.6,
  },
});

export default function AnalysisScreen() {
  return (
    <ScreenErrorBoundary screenName="Analysis">
      <AnalysisScreenContent />
    </ScreenErrorBoundary>
  );
}
