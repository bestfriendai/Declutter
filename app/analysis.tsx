/**
 * Declutterly - Analysis Screen
 * Cinematic AI analysis with Apple TV style results reveal
 */

import React, { useEffect, useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  useColorScheme,
  Dimensions,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeInRight,
  FadeOut,
  SlideInUp,
  SlideOutDown,
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  withRepeat,
  Easing,
  interpolate,
  runOnJS,
  cancelAnimation,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system';
import * as Haptics from 'expo-haptics';

import { Colors, PriorityColors } from '@/constants/Colors';
import { Typography } from '@/theme/typography';
import { useDeclutter } from '@/context/DeclutterContext';
import { analyzeRoomImage, analyzeProgress, getMotivation } from '@/services/gemini';
import { AIAnalysisResult, CleaningTask } from '@/types/declutter';
import { GlassCard } from '@/components/ui/GlassCard';
import { SingleRing } from '@/components/ui/ActivityRings';
import { useCardPress } from '@/hooks/useAnimatedPress';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function AnalysisScreen() {
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
  const [showResults, setShowResults] = useState(false);

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

      return () => {
        clearInterval(stageInterval);
        cancelAnimation(scanProgress);
        cancelAnimation(pulseScale);
        cancelAnimation(glowOpacity);
        scanProgress.value = 0;
        pulseScale.value = 1;
        glowOpacity.value = 0.3;
      };
    }
  }, [isAnalyzing, scanProgress, pulseScale, glowOpacity]);

  useEffect(() => {
    if (mode === 'compare' && room && room.photos.length >= 2) {
      runProgressAnalysis();
    } else if (imageUri) {
      runAnalysis();
    }
  }, [roomId, imageUri, mode]);

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

      // Show results with animation delay
      setTimeout(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setShowResults(true);
      }, 500);
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
    if (mode === 'compare') {
      runProgressAnalysis();
    } else {
      runAnalysis();
    }
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
          >
            <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
            <Text style={{ color: '#FFFFFF', fontSize: 18 }}>✕</Text>
          </Pressable>
        </Animated.View>
      </View>
    );
  }

  // Error state
  if (analysisError) {
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
          <Text style={styles.errorEmoji}>😕</Text>
          <Text style={[Typography.title1, { color: colors.text, marginTop: 20 }]}>
            Oops!
          </Text>
          <Text style={[Typography.body, { color: colors.textSecondary, textAlign: 'center', marginTop: 8, maxWidth: 280 }]}>
            {analysisError}
          </Text>

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
                  color="#22C55E"
                  backgroundColor="rgba(255,255,255,0.1)"
                />
                <View style={styles.progressRingCenter}>
                  <Text style={[Typography.display1, { color: '#FFFFFF' }]}>
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
                      <Text style={{ color: '#22C55E' }}>✓</Text>
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
          <Pressable onPress={() => router.back()} style={styles.glassButtonDark}>
            <BlurView intensity={60} tint={colorScheme} style={StyleSheet.absoluteFill} />
            <Text style={{ color: colors.text }}>← Back</Text>
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
                color={result.messLevel > 70 ? '#EF4444' : result.messLevel > 40 ? '#F59E0B' : '#22C55E'}
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

          {/* Summary */}
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
                {result.quickWins.slice(0, 4).map((win, i) => (
                  <QuickWinCard key={i} text={win} delay={i * 50} />
                ))}
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
          <Pressable onPress={() => router.back()} style={styles.glassButtonDark}>
            <BlurView intensity={60} tint={colorScheme} style={StyleSheet.absoluteFill} />
            <Text style={{ color: colors.text }}>← Back</Text>
          </Pressable>
        </Animated.View>
      </View>
    );
  }

  // Fallback
  return (
    <View style={[styles.container, styles.fallbackContainer, { backgroundColor: colors.background }]}>
      <Text style={[Typography.title2, { color: colors.text }]}>No analysis data</Text>
      <Pressable onPress={() => router.back()} style={styles.fallbackButton}>
        <Text style={[Typography.body, { color: colors.primary }]}>Go Back</Text>
      </Pressable>
    </View>
  );
}

// Quick Win Card
function QuickWinCard({ text, delay }: { text: string; delay: number }) {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
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

// Task Preview Card
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
            <Text style={[Typography.caption2, { color: '#22C55E' }]}>Quick!</Text>
          )}
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
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
    paddingTop: 32,
    paddingHorizontal: 24,
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
  stageIndicators: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 24,
  },
  stageIndicator: {
    height: 4,
    borderRadius: 2,
  },
  tipBadge: {
    marginTop: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
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
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    overflow: 'hidden',
  },
  // Error styles
  errorContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  errorEmoji: {
    fontSize: 64,
  },
  errorButtons: {
    marginTop: 32,
    gap: 12,
    width: '100%',
    maxWidth: 280,
  },
  primaryButton: {
    paddingVertical: 16,
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
  },
  secondaryButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  // Progress results
  progressHero: {
    padding: 32,
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
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 20,
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
    marginBottom: 24,
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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#A78BFA',
  },
  statTime: {
    fontSize: 16,
    fontWeight: '600',
    color: '#A78BFA',
  },
  section: {
    marginBottom: 24,
  },
  summaryCard: {
    padding: 16,
  },
  quickWinsScroll: {
    gap: 12,
  },
  quickWinCard: {
    width: 140,
    padding: 16,
    borderRadius: 16,
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
    padding: 24,
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
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
  },
  fallbackContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackButton: {
    marginTop: 16,
    padding: 12,
  },
});
