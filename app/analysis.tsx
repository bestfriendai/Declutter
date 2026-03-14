/**
 * Declutterly - Analysis Screen
 * Redesigned to match Pencil designs:
 * - Scanning: dark overlay, corner brackets, pulsing circle, "Gently scanning..." text
 * - Results: room photo header with badge, detected item cards, "Accept All Tasks" CTA
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
    Share,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import Animated, {
    Easing,
    FadeIn,
    FadeInDown,
    FadeInUp,
    ZoomIn,
    cancelAnimation,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenErrorBoundary } from '@/components/ErrorBoundary';
import { ProgressComparison } from '@/components/ui/ProgressComparison';
import { SimplePhaseProgress } from '@/components/room/PhaseProgress';
import { GlassCard } from '@/components/ui/GlassCard';
import { AmbientBackdrop } from '@/components/ui/AmbientBackdrop';
import { ExpressiveStateView } from '@/components/ui/ExpressiveStateView';
import { Colors } from '@/constants/Colors';
import { useDeclutter } from '@/context/DeclutterContext';
import { analyzeProgress, analyzeRoomImage, getMotivation } from '@/services/ai';
import { Typography } from '@/theme/typography';
import { AIAnalysisResult, CleaningTask, RoomType } from '@/types/declutter';

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
    { title: 'Make the bed', description: 'Straighten sheets and arrange pillows', emoji: '\u{1F6CF}\uFE0F', priority: 'high', difficulty: 'quick', estimatedMinutes: 3 },
    { title: 'Pick up clothes from floor', description: 'Gather clothes and put in hamper or closet', emoji: '\u{1F455}', priority: 'high', difficulty: 'quick', estimatedMinutes: 5 },
    { title: 'Clear nightstand clutter', description: 'Organize items on nightstand', emoji: '\u{1FAB4}', priority: 'medium', difficulty: 'quick', estimatedMinutes: 5 },
    { title: 'Put away clean laundry', description: 'Fold and store clean clothes', emoji: '\u{1F9FA}', priority: 'medium', difficulty: 'medium', estimatedMinutes: 10 },
    { title: 'Dust surfaces', description: 'Wipe down dresser and nightstands', emoji: '\u2728', priority: 'low', difficulty: 'quick', estimatedMinutes: 8 },
  ],
  kitchen: [
    { title: 'Wash dishes in sink', description: 'Clean and dry dishes', emoji: '\u{1F37D}\uFE0F', priority: 'high', difficulty: 'medium', estimatedMinutes: 10 },
    { title: 'Wipe down counters', description: 'Clean all counter surfaces', emoji: '\u{1F9FD}', priority: 'high', difficulty: 'quick', estimatedMinutes: 5 },
    { title: 'Put away items on counter', description: 'Store loose items in cabinets', emoji: '\u{1F4E6}', priority: 'medium', difficulty: 'quick', estimatedMinutes: 8 },
    { title: 'Take out trash', description: 'Empty trash and recycling bins', emoji: '\u{1F5D1}\uFE0F', priority: 'medium', difficulty: 'quick', estimatedMinutes: 3 },
    { title: 'Organize one cabinet or drawer', description: 'Sort and arrange items', emoji: '\u{1F5C4}\uFE0F', priority: 'low', difficulty: 'medium', estimatedMinutes: 15 },
  ],
  bathroom: [
    { title: 'Wipe down sink and counter', description: 'Clean sink and counter area', emoji: '\u{1F6B0}', priority: 'high', difficulty: 'quick', estimatedMinutes: 5 },
    { title: 'Put away toiletries', description: 'Organize personal care items', emoji: '\u{1F9F4}', priority: 'medium', difficulty: 'quick', estimatedMinutes: 5 },
    { title: 'Clean mirror', description: 'Wipe mirror until streak-free', emoji: '\u{1FA9E}', priority: 'medium', difficulty: 'quick', estimatedMinutes: 3 },
    { title: 'Empty trash', description: 'Take out bathroom trash', emoji: '\u{1F5D1}\uFE0F', priority: 'low', difficulty: 'quick', estimatedMinutes: 2 },
    { title: 'Organize under-sink cabinet', description: 'Sort items under sink', emoji: '\u{1F4E6}', priority: 'low', difficulty: 'medium', estimatedMinutes: 10 },
  ],
  livingRoom: [
    { title: 'Pick up items from floor', description: 'Clear floor of clutter', emoji: '\u{1F9F9}', priority: 'high', difficulty: 'quick', estimatedMinutes: 5 },
    { title: 'Fluff and arrange pillows', description: 'Tidy up couch cushions', emoji: '\u{1F6CB}\uFE0F', priority: 'medium', difficulty: 'quick', estimatedMinutes: 3 },
    { title: 'Clear coffee table', description: 'Remove items and wipe surface', emoji: '\u2615', priority: 'medium', difficulty: 'quick', estimatedMinutes: 5 },
    { title: 'Organize remote controls', description: 'Gather and store remotes', emoji: '\u{1F4FA}', priority: 'low', difficulty: 'quick', estimatedMinutes: 3 },
    { title: 'Put away books and magazines', description: 'Shelve or recycle reading material', emoji: '\u{1F4DA}', priority: 'low', difficulty: 'quick', estimatedMinutes: 8 },
  ],
  office: [
    { title: 'Clear desk surface', description: 'Remove items and organize', emoji: '\u{1F5A5}\uFE0F', priority: 'high', difficulty: 'medium', estimatedMinutes: 10 },
    { title: 'Organize papers and files', description: 'Sort and file documents', emoji: '\u{1F4C4}', priority: 'high', difficulty: 'medium', estimatedMinutes: 15 },
    { title: 'Untangle and organize cables', description: 'Bundle and route cables neatly', emoji: '\u{1F50C}', priority: 'medium', difficulty: 'medium', estimatedMinutes: 10 },
    { title: 'Empty trash/recycling', description: 'Clear waste bins', emoji: '\u{1F5D1}\uFE0F', priority: 'medium', difficulty: 'quick', estimatedMinutes: 3 },
    { title: 'Dust monitor and keyboard', description: 'Clean electronics', emoji: '\u{1F4BB}', priority: 'low', difficulty: 'quick', estimatedMinutes: 5 },
  ],
  garage: [
    { title: 'Clear walkway', description: 'Remove obstacles from path', emoji: '\u{1F697}', priority: 'high', difficulty: 'medium', estimatedMinutes: 10 },
    { title: 'Return tools to storage', description: 'Put tools back in place', emoji: '\u{1F527}', priority: 'medium', difficulty: 'medium', estimatedMinutes: 15 },
    { title: 'Organize one shelf or bin', description: 'Sort items on one shelf', emoji: '\u{1F4E6}', priority: 'medium', difficulty: 'medium', estimatedMinutes: 20 },
    { title: 'Sweep floor', description: 'Clean garage floor', emoji: '\u{1F9F9}', priority: 'low', difficulty: 'medium', estimatedMinutes: 10 },
    { title: 'Take recycling out', description: 'Move recyclables to bin', emoji: '\u267B\uFE0F', priority: 'low', difficulty: 'quick', estimatedMinutes: 5 },
  ],
  closet: [
    { title: 'Pick up items from floor', description: 'Clear closet floor', emoji: '\u{1F45F}', priority: 'high', difficulty: 'quick', estimatedMinutes: 5 },
    { title: 'Hang up loose clothes', description: 'Put clothes on hangers', emoji: '\u{1F454}', priority: 'high', difficulty: 'quick', estimatedMinutes: 10 },
    { title: 'Fold and organize one shelf', description: 'Tidy one shelf area', emoji: '\u{1F455}', priority: 'medium', difficulty: 'quick', estimatedMinutes: 10 },
    { title: 'Match and pair shoes', description: 'Organize footwear', emoji: '\u{1F460}', priority: 'medium', difficulty: 'quick', estimatedMinutes: 8 },
    { title: 'Donate pile - bag up 5 items', description: 'Select items to donate', emoji: '\u{1F381}', priority: 'low', difficulty: 'quick', estimatedMinutes: 10 },
  ],
  other: [
    { title: 'Pick up items from floor', description: 'Clear floor space', emoji: '\u{1F9F9}', priority: 'high', difficulty: 'quick', estimatedMinutes: 5 },
    { title: 'Clear main surfaces', description: 'Declutter tables and counters', emoji: '\u2728', priority: 'high', difficulty: 'quick', estimatedMinutes: 8 },
    { title: 'Put items in their homes', description: 'Return items to proper places', emoji: '\u{1F3E0}', priority: 'medium', difficulty: 'quick', estimatedMinutes: 10 },
    { title: 'Wipe down surfaces', description: 'Clean all surfaces', emoji: '\u{1F9FD}', priority: 'medium', difficulty: 'quick', estimatedMinutes: 8 },
    { title: 'Quick organization pass', description: 'General tidying', emoji: '\u{1F4CB}', priority: 'low', difficulty: 'quick', estimatedMinutes: 10 },
  ],
};

function AnalysisScreenContent() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_motivation, setMotivation] = useState<string>('');
  const [showCelebration, setShowCelebration] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_retryCount, setRetryCount] = useState(0);

  const room = rooms.find(r => r.id === roomId);

  // Animations for scanning
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.4);
  const scanBadgePulse = useSharedValue(1);

  useEffect(() => {
    if (isAnalyzing) {
      // Pulsing circle in center
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.3, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) })
        ),
        -1
      );

      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.7, { duration: 1200 }),
          withTiming(0.3, { duration: 1200 })
        ),
        -1
      );

      // Scanning badge pulse
      scanBadgePulse.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 800 }),
          withTiming(1, { duration: 800 })
        ),
        -1
      );

      return () => {
        cancelAnimation(pulseScale);
        cancelAnimation(pulseOpacity);
        cancelAnimation(scanBadgePulse);
        pulseScale.value = 1;
        pulseOpacity.value = 0.4;
        scanBadgePulse.value = 1;
      };
    }
  }, [isAnalyzing]);

  useEffect(() => {
    if (mode === 'compare' && room && room.photos.length >= 2) {
      runProgressAnalysis();
    } else if (imageUri) {
      runAnalysis();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, imageUri, mode, room?.photos.length]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  const scanBadgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scanBadgePulse.value }],
  }));

  const runAnalysis = async () => {
    if (!imageUri || !roomId) return;

    setAnalyzing(true);
    setAnalysisError(null);

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

      const motivationalResponse = await getMotivation(
        `User just analyzed their ${room?.type || 'room'}. Mess level: ${analysisResult.messLevel}%`
      );
      setMotivation(typeof motivationalResponse === 'string' ? motivationalResponse : motivationalResponse.message);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 2500);
    } catch (error) {
      if (__DEV__) console.error('Analysis error:', error);
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

      if (!beforePhoto?.uri || !latestPhoto?.uri) {
        setAnalysisError('No photos available for comparison.');
        setAnalyzing(false);
        return;
      }

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
      if (__DEV__) console.error('Progress analysis error:', error);
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
    if (roomId) {
      router.replace(`/room/${roomId}`);
      return;
    }

    router.replace('/camera');
  };

  const handleDismissAnalysis = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (mode === 'compare' || roomId) {
      handleGoToRoom();
      return;
    }

    router.replace('/camera');
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

  const handleUseFallbackTasks = async () => {
    if (!room) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const roomType = room.type || 'other';
    const fallbackTemplates = FALLBACK_TASKS[roomType] || FALLBACK_TASKS.other;

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

    await setTasksForRoom(roomId, tasks);

    if (imageUri && room) {
      updateRoom(roomId, {
        currentProgress: 0,
        lastAnalyzedAt: new Date(),
      });
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace(`/room/${roomId}`);
  };

  // ============================================
  // SCANNING STATE — matches Pencil "oVtRa"
  // ============================================
  if (isAnalyzing) {
    return (
      <View style={styles.container}>
        {/* Full-screen camera/image with dark overlay */}
        {imageUri && (
          <View style={StyleSheet.absoluteFill}>
            <Image
              source={{ uri: imageUri }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
            />
            <LinearGradient
              colors={['rgba(9,9,9,0.4)', 'rgba(9,9,9,0.5)', 'rgba(17,17,17,0.85)']}
              style={StyleSheet.absoluteFill}
            />
          </View>
        )}

        {/* Header: X button + "Scan Room" + info icon */}
        <Animated.View
          entering={FadeIn.delay(200)}
          style={[styles.scanHeader, { paddingTop: insets.top + 8 }]}
        >
          <Pressable
            onPress={handleDismissAnalysis}
            hitSlop={12}
            style={styles.scanHeaderBtn}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: '300' }}>{'\u2715'}</Text>
          </Pressable>
          <Text style={{ color: '#FFFFFF', fontSize: 17, fontWeight: '600' }}>Scan Room</Text>
          <View style={styles.scanHeaderBtn}>
            <Text style={{ color: '#FFFFFF', fontSize: 16 }}>{'\u24D8'}</Text>
          </View>
        </Animated.View>

        {/* SCANNING badge */}
        <Animated.View style={[styles.scanBadge, scanBadgeStyle]}>
          <View style={styles.scanBadgeDot} />
          <Text style={styles.scanBadgeText}>SCANNING</Text>
        </Animated.View>

        {/* Corner brackets — scanning frame */}
        <View style={styles.scanFrame}>
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />

          {/* Central pulsing circle */}
          <Animated.View style={[styles.scanPulse, pulseStyle]}>
            <View style={styles.scanPulseInner} />
          </Animated.View>
        </View>

        {/* Bottom text */}
        <View style={[styles.scanBottomContent, { paddingBottom: insets.bottom + 20 }]}>
          <Text style={styles.scanTitle}>Gently scanning{'\u2026'}</Text>
          <Text style={styles.scanSubtitle}>
            Taking a calm look at your space and finding ways to help
          </Text>

          {/* Pagination dots */}
          <View style={styles.scanDots}>
            <View style={[styles.scanDot, styles.scanDotActive]} />
            <View style={styles.scanDot} />
            <View style={styles.scanDot} />
          </View>

          {/* Cancel button */}
          <Pressable
            onPress={handleDismissAnalysis}
            style={styles.cancelButton}
            accessibilityRole="button"
            accessibilityLabel="Cancel scanning"
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ============================================
  // CELEBRATION — brief transition before results
  // ============================================
  if (showCelebration && result) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? '#0A0A0A' : '#FAFAFA', alignItems: 'center', justifyContent: 'center' }]}>
        <Animated.View entering={ZoomIn.springify()} style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 72 }}>{'\u{1F389}'}</Text>
          <Text style={[Typography.largeTitle, { color: colors.text, marginTop: 16 }]}>
            Analysis Complete!
          </Text>
          <Text style={[Typography.body, { color: colors.textSecondary, marginTop: 8, textAlign: 'center' }]}>
            Found {result.tasks.length} tasks to transform your space
          </Text>
        </Animated.View>
      </View>
    );
  }

  // ============================================
  // ERROR STATE
  // ============================================
  if (analysisError) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? '#0A0A0A' : '#FAFAFA', alignItems: 'center', justifyContent: 'center', padding: 32 }]}>
        <Text style={{ fontSize: 64 }}>{'\u{1F615}'}</Text>
        <Text style={[Typography.title1, { color: colors.text, marginTop: 20 }]}>Oops!</Text>
        <Text style={[Typography.body, { color: colors.textSecondary, textAlign: 'center', marginTop: 8, maxWidth: 280 }]}>
          {analysisError}
        </Text>

        <View style={{ marginTop: 32, gap: 12, width: '100%', maxWidth: 280 }}>
          <Pressable
            onPress={handleRetry}
            style={[styles.resultsCTA, { backgroundColor: isDark ? '#FFFFFF' : '#1A1A1A' }]}
          >
            <Text style={[Typography.headline, { color: isDark ? '#0A0A0A' : '#FFFFFF' }]}>Try Again</Text>
          </Pressable>

          {mode !== 'compare' && room && (
            <Pressable
              onPress={handleUseFallbackTasks}
              style={[styles.resultsCTA, {
                backgroundColor: 'transparent',
                borderWidth: 2,
                borderColor: colors.success,
              }]}
            >
              <Text style={[Typography.headline, { color: colors.success }]}>Use Default Tasks</Text>
            </Pressable>
          )}

          <Pressable onPress={handleDismissAnalysis} style={{ alignItems: 'center', paddingVertical: 12 }}>
            <Text style={[Typography.body, { color: colors.textSecondary }]}>Go Back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ============================================
  // PROGRESS COMPARISON RESULTS
  // ============================================
  if (mode === 'compare' && progressResult && room) {
    const beforePhoto = room.photos.find(p => p.type === 'before') || room.photos[0];
    const latestPhoto = room.photos[room.photos.length - 1] ?? beforePhoto;

    return (
      <View style={[styles.container, { backgroundColor: isDark ? '#0A0A0A' : '#FAFAFA' }]}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingTop: insets.top + 60, paddingBottom: insets.bottom + 100, paddingHorizontal: 20 }}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInDown.delay(50).springify()} style={{ marginBottom: 24 }}>
            <SimplePhaseProgress
              currentPhase={1}
              phaseProgress={progressResult.progressPercentage}
              completedPhases={progressResult.progressPercentage >= 100 ? [1] : []}
            />
          </Animated.View>

          <ProgressComparison
            beforeImage={beforePhoto?.uri ?? ''}
            afterImage={latestPhoto?.uri ?? ''}
            progressPercentage={progressResult.progressPercentage}
            changesDetected={progressResult.completedTasks}
            mascotMessage={progressResult.encouragement}
            mascotPersonality={mascot?.personality}
            ctaText={progressResult.progressPercentage >= 100 ? "Start Phase 2" : "Continue Cleaning"}
            onCtaPress={handleGoToRoom}
            showConfetti={progressResult.progressPercentage >= 30}
            currentPhase={1}
            phaseName="Operation Floor Rescue"
            sliderHeight={280}
          />

          {progressResult.remainingTasks.length > 0 && (
            <Animated.View entering={FadeInDown.delay(1500).springify()} style={{ marginTop: 24 }}>
              <Text style={[Typography.title3, { color: colors.text, marginBottom: 12 }]}>
                {'\u{1F4CB}'} Still To Do
              </Text>
              <GlassCard style={{ padding: 12, gap: 8 }}>
                {progressResult.remainingTasks.map((task, i) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.3)', marginRight: 12 }} />
                    <Text style={[Typography.body, { color: colors.textSecondary, flex: 1 }]}>{task}</Text>
                  </View>
                ))}
              </GlassCard>
            </Animated.View>
          )}
        </ScrollView>

        {/* Back button */}
        <Animated.View entering={FadeIn} style={[styles.floatingBackBtn, { top: insets.top + 12 }]}>
          <Pressable onPress={handleGoToRoom} style={styles.backPill} accessibilityRole="button" accessibilityLabel="Go back">
            <BlurView intensity={60} tint={colorScheme} style={StyleSheet.absoluteFill} />
            <Text style={[Typography.body, { color: colors.text }]}>{'\u2190'} Back</Text>
          </Pressable>
        </Animated.View>
      </View>
    );
  }

  // ============================================
  // ANALYSIS RESULTS — matches Pencil "xNwnE" / "i3LPe"
  // ============================================
  if (result) {
    const totalTaskCount = result.tasks.length;
    const cleanPercent = 100 - result.messLevel;

    // Group tasks by zone/category for the "detected items" cards
    // The design shows: "Pile of clothes" -> 3 tasks, "Papers on desk" -> 2 tasks, etc.
    const detectedItems = result.zones && result.zones.length > 0
      ? result.zones.map(zone => ({
          id: zone.id || zone.name,
          title: zone.name,
          taskCount: zone.itemCount || result.tasks.filter(t =>
            t.description?.toLowerCase().includes(zone.name.toLowerCase()) ||
            t.title.toLowerCase().includes(zone.name.toLowerCase())
          ).length || Math.ceil(totalTaskCount / (result.zones?.length || 1)),
          icon: zone.type === 'floor' ? '\u{1F9F9}' :
                zone.type === 'surface' ? '\u{1FA91}' :
                zone.type === 'storage' ? '\u{1F4E6}' :
                '\u2728',
        }))
      : [
          {
            id: 'general',
            title: `Items in ${room?.name || 'room'}`,
            taskCount: totalTaskCount,
            icon: '\u2728',
          }
        ];

    return (
      <View style={[styles.container, { backgroundColor: isDark ? '#0A0A0A' : '#FAFAFA' }]}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero image with badge overlay */}
          <Animated.View entering={FadeIn.delay(100)}>
            <View style={styles.resultsHero}>
              {imageUri && (
                <Image
                  source={{ uri: imageUri }}
                  style={styles.resultsHeroImage}
                  contentFit="cover"
                />
              )}
              <LinearGradient
                colors={isDark
                  ? ['transparent', 'rgba(10,10,10,0.6)', 'rgba(10,10,10,0.95)']
                  : ['transparent', 'rgba(250,250,250,0.6)', 'rgba(250,250,250,0.95)']
                }
                locations={[0, 0.5, 1]}
                style={styles.resultsHeroGradient}
              />
              {/* Stats badge on the photo */}
              <View
                style={[
                  styles.resultsStatsBadge,
                  {
                    backgroundColor: isDark ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.82)',
                    borderColor: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.88)',
                  },
                ]}
              >
                <Text style={{ fontSize: 14, marginRight: 6 }}>{'\u2728'}</Text>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: isDark ? '#FFFFFF' : '#1A1A1A',
                  }}
                >
                  {cleanPercent}% Clean {'\u00B7'} {totalTaskCount} tasks found
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* Header row: Back + "Analysis Complete" + share */}
          <Animated.View
            entering={FadeInDown.delay(200)}
            style={[styles.resultsHeaderRow, { paddingHorizontal: 20 }]}
          >
            <Pressable onPress={handleGoToRoom} hitSlop={12} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 17, color: isDark ? '#FFFFFF' : '#1A1A1A' }}>{'<'} Back</Text>
            </Pressable>
            <Text style={{ fontSize: 18, fontWeight: '700', color: isDark ? '#FFFFFF' : '#1A1A1A' }}>
              Analysis Complete
            </Text>
            <Pressable
              onPress={async () => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                try {
                  await Share.share({
                    message: `I just analyzed my ${room?.name || 'room'} with Declutterly! Found ${totalTaskCount} tasks to tackle. ${cleanPercent}% clean so far!`,
                  });
                } catch {
                  // User cancelled share
                }
              }}
              hitSlop={12}
              style={{ width: 32, alignItems: 'flex-end' }}
              accessibilityRole="button"
              accessibilityLabel="Share analysis results"
            >
              <Text style={{ fontSize: 18, color: isDark ? '#FFFFFF' : '#1A1A1A' }}>{'\u{1F4E4}'}</Text>
            </Pressable>
          </Animated.View>

          {/* Subtitle */}
          <Animated.View entering={FadeInDown.delay(300)} style={{ paddingHorizontal: 20, marginTop: 8, marginBottom: 20 }}>
            <Text style={{ fontSize: 15, color: isDark ? '#808080' : '#808080' }}>
              {detectedItems.length} item{detectedItems.length !== 1 ? 's' : ''} detected in {room?.name || 'room'}
            </Text>
          </Animated.View>

          {/* Detected items cards */}
          <View style={{ paddingHorizontal: 20, gap: 12 }}>
            {detectedItems.map((item, i) => (
              <Animated.View
                key={item.id}
                entering={FadeInDown.delay(400 + i * 80)}
              >
                <View style={[
                  styles.detectedItemCard,
                  {
                    backgroundColor: isDark ? '#1C1C1C' : '#FFFFFF',
                    borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)',
                    // Light mode shadow
                    ...(isDark ? {} : {
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.06,
                      shadowRadius: 8,
                      elevation: 2,
                    }),
                  }
                ]}>
                  {/* Icon circle */}
                  <View style={[styles.detectedItemIcon, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)' }]}>
                    <Text style={{ fontSize: 20 }}>{item.icon}</Text>
                  </View>

                  {/* Title and subtitle */}
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: isDark ? '#FFFFFF' : '#1A1A1A' }}>
                      {item.title}
                    </Text>
                    <Text style={{ fontSize: 13, color: '#808080', marginTop: 2 }}>
                      {item.taskCount} task{item.taskCount !== 1 ? 's' : ''} generated
                    </Text>
                  </View>

                  {/* Count badge */}
                  <View
                    style={[
                      styles.countBadge,
                      {
                        backgroundColor: isDark ? '#1A1A1A' : '#F5F5F5',
                        borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                      },
                    ]}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: '600',
                        color: isDark ? '#FFFFFF' : '#1A1A1A',
                      }}
                    >
                      {item.taskCount}
                    </Text>
                  </View>
                </View>
              </Animated.View>
            ))}
          </View>

          {/* Extra space before bottom CTA */}
          <View style={{ height: 32 }} />
        </ScrollView>

        {/* Bottom CTA: "Accept All N Tasks" */}
        <Animated.View
          entering={FadeInUp.delay(600)}
          style={[styles.bottomCTAContainer, { paddingBottom: insets.bottom + 80, backgroundColor: isDark ? '#0A0A0A' : '#FAFAFA' }]}
        >
          <Pressable
            onPress={handleGoToRoom}
            style={({ pressed }) => [
              styles.resultsCTA,
              {
                backgroundColor: isDark ? '#FFFFFF' : '#1A1A1A',
                opacity: pressed ? 0.9 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Accept All ${totalTaskCount} Tasks`}
          >
            <Text style={{
              fontSize: 17,
              fontWeight: '600',
              color: isDark ? '#0A0A0A' : '#FFFFFF',
            }}>
              Accept All {totalTaskCount} Tasks
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    );
  }

  // ============================================
  // FALLBACK — no data
  // ============================================
  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0A0A0A' : '#FAFAFA', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 }]}>
      <AmbientBackdrop isDark={isDark} variant="progress" />
      <ExpressiveStateView
        isDark={isDark}
        kicker="ANALYSIS"
        icon="sparkles-outline"
        title="No analysis data"
        description="Capture a room photo first and Declutterly will break the mess into guided tasks you can actually start."
        primaryLabel="Go Back"
        onPrimary={handleDismissAnalysis}
        accentColors={['#D8D0FF', '#8B82FF', '#5B6DFF'] as const}
        style={styles.fallbackCard}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090909',
  },
  fallbackCard: {
    width: '100%',
  },
  // ─── Scanning ─────────────────────────────
  scanHeader: {
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
  scanHeaderBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanBadge: {
    position: 'absolute',
    top: 110,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 10,
  },
  scanBadgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#30D158',
    marginRight: 8,
  },
  scanBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: '#FFFFFF',
  },
  scanFrame: {
    position: 'absolute',
    top: '20%',
    left: 40,
    right: 40,
    bottom: '35%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  cornerTL: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 12 },
  cornerTR: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 12 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 12 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 12 },
  scanPulse: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanPulseInner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  scanBottomContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  scanTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  scanSubtitle: {
    fontSize: 15,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  scanDots: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  scanDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  scanDotActive: {
    backgroundColor: '#FFFFFF',
  },
  cancelButton: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 28,
    marginBottom: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  // ─── Results ──────────────────────────────
  resultsHero: {
    height: 220,
    position: 'relative',
    overflow: 'hidden',
  },
  resultsHeroImage: {
    ...StyleSheet.absoluteFillObject,
  },
  resultsHeroGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  resultsStatsBadge: {
    position: 'absolute',
    bottom: 16,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  resultsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingBottom: 4,
  },
  detectedItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  detectedItemIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  countBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
    borderWidth: 1,
  },
  bottomCTAContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  resultsCTA: {
    paddingVertical: 16,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  // ─── Misc / shared ────────────────────────
  floatingBackBtn: {
    position: 'absolute',
    left: 16,
    zIndex: 10,
  },
  backPill: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    overflow: 'hidden',
    minHeight: 44,
    justifyContent: 'center',
  },
});

export default function AnalysisScreen() {
  return (
    <ScreenErrorBoundary screenName="Analysis">
      <AnalysisScreenContent />
    </ScreenErrorBoundary>
  );
}
