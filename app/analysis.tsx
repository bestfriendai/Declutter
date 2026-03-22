/**
 * Declutterly -- Analysis Screen (V1)
 * Thin orchestrator importing sub-components from components/analysis/
 *
 * Flow: Scanning animation -> AI detection overlay -> "Let's Do This" CTA -> Room created
 *
 * Improvements:
 * - 45-second analysis timeout with Promise.race
 * - Cancel/back button during scanning phase
 * - Rotating encouraging messages during scan
 * - Estimated progress bar (simulated)
 * - Photo retake from error state
 * - Offline detection with fallback tasks
 */

import { ScreenErrorBoundary } from '@/components/ErrorBoundary';
import { ScanningPhase, DetectionPhase, ResultsPhase } from '@/components/analysis';
import { V1, BODY_FONT, DISPLAY_FONT } from '@/constants/designTokens';
import { useAuth } from '@/context/AuthContext';
import { useDeclutter } from '@/context/DeclutterContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useSubscription, FREE_ROOM_LIMIT } from '@/hooks/useSubscription';
import { analyzeRoomImage } from '@/services/ai';
import { getUserCleaningProfile } from '@/services/taskOptimizer';
import { CleaningTask, RoomType } from '@/types/declutter';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, useWindowDimensions } from 'react-native';

import { STORAGE_KEYS } from '@/constants/storageKeys';
const GUEST_SCAN_KEY = STORAGE_KEYS.GUEST_SCAN_COUNT;
import {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import NetInfo from '@react-native-community/netinfo';

// ── Area colors ─────────────────────────────────────────────────────────────
const AREA_COLORS = [V1.coral, V1.amber, V1.blue, V1.green, V1.gold];

// ── Constants ───────────────────────────────────────────────────────────────
const MAX_RETRIES = 2;
const ANALYSIS_TIMEOUT_MS = 45000; // 45 seconds

// ── Types ───────────────────────────────────────────────────────────────────
interface DetectedArea {
  name: string;
  taskCount: number;
  tasks: string[];
  color: string;
  boundingBox?: { x: number; y: number; width: number; height: number };
  priority?: string;
}

interface AnalysisResult {
  areas: DetectedArea[];
  totalItems: number;
  totalMinutes: number;
  tasks: CleaningTask[];
  doomPiles?: Array<{
    location: string;
    description: string;
    itemTypes?: string[];
    anxietyLevel?: 'high' | 'medium' | 'low';
    estimatedMinutes?: number;
    recommendedApproach?: string;
  }>;
  taskClusters?: Array<{
    clusterType: string;
    taskIds: string[];
    clusterLabel: string;
    rationale: string;
    combinedEstimatedMinutes: number;
    savingsMinutes: number;
    emoji: string;
  }>;
  photoQualityWarning?: string | null;
  supplyChecklist?: string[];
  detectedObjects?: Array<{
    name: string;
    category?: string;
    zone?: string;
    suggestedAction?: string;
    confidence?: number;
  }>;
  zones?: Array<{
    name: string;
    type?: string;
    clutterDensity?: string;
    itemCount?: number;
  }>;
  timeProfiles?: {
    minimal?: { tasks: string[]; expectedImpact: number; estimatedMinutes?: number };
    quick?: { tasks: string[]; expectedImpact: number; estimatedMinutes?: number };
    standard?: { tasks: string[]; expectedImpact: number; estimatedMinutes?: number };
    complete?: { tasks: string[]; expectedImpact: number; estimatedMinutes?: number };
  } | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Analysis Screen
// ─────────────────────────────────────────────────────────────────────────────
export default function AnalysisScreen() {
  return (
    <ScreenErrorBoundary screenName="analysis">
      <AnalysisScreenContent />
    </ScreenErrorBoundary>
  );
}

function AnalysisScreenContent() {
  const { photoUri, roomType, roomName, energyLevel, timeAvailable } = useLocalSearchParams<{
    photoUri: string;
    roomType: RoomType;
    roomName: string;
    energyLevel?: string;
    timeAvailable?: string;
  }>();

  const rawScheme = useColorScheme();
  const isDark = rawScheme === 'dark';
  const reducedMotion = useReducedMotion();
  const t = isDark ? V1.dark : V1.light;
  const insets = useSafeAreaInsets();
  const { width: SCREEN_WIDTH } = useWindowDimensions();

  const { addRoom, setTasksForRoom, addPhotoToRoom, setActiveRoom, rooms, settings, user } =
    useDeclutter();
  const { isPro } = useSubscription();
  const { isAnonymous } = useAuth();

  const [phase, setPhase] = useState<'scanning' | 'detection' | 'results'>('scanning');
  const [scanStep, setScanStep] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isOffline, setIsOffline] = useState(false);

  // Track network status for offline fallback
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOffline(state.isConnected === false || state.isInternetReachable === false);
    });
    return () => unsubscribe();
  }, []);

  const cancelledRef = useRef(false);

  // Scanning animation
  const pulseScale = useSharedValue(1);
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  // Analysis with 45-second timeout via Promise.race
  const runAnalysis = useCallback(async () => {
    cancelledRef.current = false;

    setError(null);
    setAnalysisResult(null);
    setPhase('scanning');
    setScanStep(0);

    // Start pulse animation
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
    );

    try {
      if (!photoUri) {
        if (!cancelledRef.current) {
          setError('Photo not found. Please take another photo to continue.');
          setPhase('results');
        }
        return;
      }

      // Check room limit BEFORE starting analysis
      if (!isPro && rooms.length >= FREE_ROOM_LIMIT) {
        if (!cancelledRef.current) {
          Alert.alert('Room limit reached', 'Upgrade to Pro to add more rooms.', [
            { text: 'Cancel', style: 'cancel', onPress: () => router.back() },
            { text: 'Upgrade', onPress: () => router.push('/paywall') },
          ]);
        }
        return;
      }

      // Offline detection — offer fallback tasks immediately
      let isOffline = false;
      try {
        const netState = await NetInfo.fetch();
        isOffline = !(netState.isConnected && netState.isInternetReachable);
      } catch {
        // If NetInfo fails, assume online
      }

      if (isOffline) {
        if (cancelledRef.current) return;
        const fallbackTasks = generateFallbackTasks(roomType || 'bedroom');
        const totalMinutes = fallbackTasks.reduce((sum, tk) => sum + (tk.estimatedMinutes || 3), 0);
        setAnalysisResult({
          areas: [
            {
              name: 'General cleaning',
              taskCount: fallbackTasks.length,
              tasks: fallbackTasks.map((tk) => tk.title),
              color: V1.coral,
            },
          ],
          totalItems: fallbackTasks.length,
          totalMinutes,
          tasks: fallbackTasks,
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setPhase('results');
        return;
      }

      // Step 1: Scanning
      setScanStep(0);
      // Step 2: Spotting
      setScanStep(1);

      let analysisData: any = null;
      try {
        // Timeout wrapper
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Analysis timed out')), ANALYSIS_TIMEOUT_MS),
        );

        const analyzePromise = (async () => {
          const [base64, cleaningProfile] = await Promise.all([
            FileSystem.readAsStringAsync(photoUri, { encoding: 'base64' }),
            getUserCleaningProfile(),
          ]);
          if (cancelledRef.current) return null;

          const taskHistorySummary =
            cleaningProfile.taskHistory.length > 0
              ? cleaningProfile.taskHistory
                  .map(
                    (h) =>
                      `${h.category}: ${Math.round(h.completionRate * 100)}% completion, ${Math.round(h.skipRate * 100)}% skip rate`,
                  )
                  .join('; ')
              : '';

          const preferencesSummary = [
            `Preferred task size: ${cleaningProfile.preferences.preferredTaskSize}`,
            `Session length: ${cleaningProfile.preferences.preferredSessionLength} min`,
            cleaningProfile.preferences.prefersQuickWinsFirst ? 'Prefers quick wins first' : '',
            cleaningProfile.preferences.avoidsDecisionTasks ? 'Avoids decision-heavy tasks' : '',
            cleaningProfile.preferences.needsMoreBreakdown ? 'Needs extra task breakdown' : '',
          ]
            .filter(Boolean)
            .join(', ');

          const energyPatternsSummary =
            cleaningProfile.energyPatterns.length > 0
              ? cleaningProfile.energyPatterns
                  .map((p) => {
                    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                    return `${days[p.dayOfWeek]}: avg energy ${p.averageEnergy.toFixed(1)}/4`;
                  })
                  .join(', ')
              : '';

          return analyzeRoomImage(
            base64,
            `Room type: ${roomType || 'bedroom'}`,
            energyLevel || 'moderate',
            timeAvailable ? parseInt(timeAvailable, 10) : 30,
            undefined,
            {
              taskHistory: taskHistorySummary,
              preferences: preferencesSummary,
              energyPatterns: energyPatternsSummary,
              taskBreakdownLevel: settings.taskBreakdownLevel,
            },
          );
        })();

        // Race: analysis vs timeout
        analysisData = await Promise.race([analyzePromise, timeoutPromise]);
      } catch (aiError: any) {
        if (__DEV__) console.warn('AI analysis failed or timed out:', aiError?.message);
      }

      // Step 3: Building task list
      setScanStep(2);
      if (cancelledRef.current) return;

      // Process results
      let tasks: CleaningTask[] = [];
      let areas: DetectedArea[] = [];

      if (analysisData?.tasks && analysisData.tasks.length > 0) {
        tasks = analysisData.tasks;

        // Build areas from zones when available (includes boundingBox data)
        if (analysisData?.zones && analysisData.zones.length > 0) {
          areas = analysisData.zones.map((zone: any, i: number) => {
            const zoneTasks = tasks.filter(t => t.zone === zone.id || t.zone === zone.name);
            return {
              name: zone.name,
              taskCount: zoneTasks.length || zone.itemCount || 0,
              tasks: zoneTasks.map(t => t.title),
              color: AREA_COLORS[i % AREA_COLORS.length],
              boundingBox: zone.boundingBox,
              priority: zone.priority,
            };
          });
          // Filter out empty zones
          areas = areas.filter(a => a.taskCount > 0);
        }

        // Fall back to phase-based grouping if no zones or zones had no tasks
        if (areas.length === 0) {
          const phaseMap = new Map<string, CleaningTask[]>();
          tasks.forEach((task) => {
            const phaseKey = task.phase
              ? `Phase ${task.phase}: ${task.phaseName || ''}`
              : task.zone || 'General';
            if (!phaseMap.has(phaseKey)) phaseMap.set(phaseKey, []);
            phaseMap.get(phaseKey)!.push(task);
          });
          areas = Array.from(phaseMap.entries()).map(([name, phaseTasks], i) => ({
            name,
            taskCount: phaseTasks.length,
            tasks: phaseTasks.map((tk) => tk.title),
            color: AREA_COLORS[i % AREA_COLORS.length],
          }));
        }
      } else {
        tasks = generateFallbackTasks(roomType || 'bedroom');
        areas = [
          {
            name: 'General cleaning',
            taskCount: tasks.length,
            tasks: tasks.map((tk) => tk.title),
            color: V1.coral,
          },
        ];
      }

      const totalMinutes = tasks.reduce((sum, tk) => sum + (tk.estimatedMinutes || 3), 0);

      // Photo quality warning
      let photoQualityWarning: string | null = null;
      if (analysisData?.photoQuality && analysisData.photoQuality.confidence < 0.6) {
        const issues: string[] = [];
        if (analysisData.photoQuality.lighting === 'dim') issues.push('dim lighting');
        if (analysisData.photoQuality.clarity === 'blurry') issues.push('blurry');
        if (analysisData.photoQuality.coverage === 'limited') issues.push('limited coverage');
        if (issues.length > 0) {
          photoQualityWarning = `Lower confidence analysis (${issues.join(', ')}). Retaking with better lighting may improve results.`;
        }
      }

      if (cancelledRef.current) return;

      setAnalysisResult({
        areas,
        totalItems: tasks.length,
        totalMinutes,
        tasks,
        doomPiles: analysisData?.doomPiles || [],
        taskClusters: analysisData?.taskClusters || [],
        photoQualityWarning,
        supplyChecklist: analysisData?.supplyChecklist || [],
        detectedObjects: analysisData?.detectedObjects || [],
        zones: analysisData?.zones || [],
        timeProfiles: analysisData?.timeProfiles || null,
      });

      // Show detection overlay (user taps "Let's Do This" to proceed)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setPhase('detection');
    } catch (err) {
      if (cancelledRef.current) return;
      setError("Let's try a different angle -- sometimes the lighting or angle makes it tricky.");
      setPhase('results');
    }
  }, [
    photoUri,
    pulseScale,
    roomType,
    isPro,
    rooms.length,
    settings.taskBreakdownLevel,
    energyLevel,
    timeAvailable,
  ]);

  // Retry handler
  const handleRetry = useCallback(() => {
    if (retryCount >= MAX_RETRIES) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setRetryCount((prev) => prev + 1);
    void runAnalysis();
  }, [retryCount, runAnalysis]);

  // Run analysis on mount
  useEffect(() => {
    void runAnalysis();
    return () => {
      cancelledRef.current = true;
      cancelAnimation(pulseScale);
    };
  }, []);

  // Create room handler
  const handleCreateRoom = useCallback(async () => {
    if (!analysisResult || isCreating) return;

    // Guest gate: after 1 free scan, prompt signup
    if (isAnonymous) {
      try {
        const countStr = await AsyncStorage.getItem(GUEST_SCAN_KEY);
        const count = parseInt(countStr ?? '0');
        if (count >= 1) {
          Alert.alert(
            'Create an account to save your progress',
            'You\'ve tried your first scan! Sign up to save rooms, track progress, and unlock all features.',
            [
              { text: 'Maybe Later', style: 'cancel' },
              { text: 'Sign Up', onPress: () => router.push('/auth/signup') },
            ],
          );
          return;
        }
        await AsyncStorage.setItem(GUEST_SCAN_KEY, String(count + 1));
      } catch {
        // Non-critical - allow through
      }
    }

    if (!isPro && rooms.length >= FREE_ROOM_LIMIT) {
      Alert.alert('Room limit reached', 'Upgrade to Pro to add more rooms.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Upgrade', onPress: () => router.push('/paywall') },
      ]);
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const allTasksSorted = [...analysisResult.tasks].sort((a, b) => {
      const phaseA = a.phase ?? 99;
      const phaseB = b.phase ?? 99;
      if (phaseA !== phaseB) return phaseA - phaseB;
      const impactOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
      return (
        (impactOrder[a.visualImpact || 'medium'] ?? 1) -
        (impactOrder[b.visualImpact || 'medium'] ?? 1)
      );
    });

    setIsCreating(true);
    setCreateError(null);
    try {
      const room = await addRoom({
        name: roomName || 'Room',
        type: (roomType as RoomType) || 'bedroom',
        emoji: getRoomEmoji(roomType as RoomType),
        messLevel: 50,
        aiSummary: `${analysisResult.totalItems} things spotted`,
      });

      if (photoUri) {
        await addPhotoToRoom(room.id, {
          uri: photoUri,
          timestamp: new Date(),
          type: 'before',
        });
      }

      setTasksForRoom(room.id, allTasksSorted);
      setActiveRoom(room.id);
      router.replace({ pathname: '/room/[id]', params: { id: room.id } });
    } catch (err) {
      setCreateError("Couldn't save your room. Tap to try again.");
    } finally {
      setIsCreating(false);
    }
  }, [analysisResult, isCreating, isAnonymous, roomName, roomType, photoUri, isPro, rooms.length]);

  // Create room with only selected tasks (from inline customization)
  const handleCreateRoomWithTasks = useCallback(async (selectedTaskIds: Set<string>) => {
    if (!analysisResult || isCreating) return;

    const selectedTasks = analysisResult.tasks.filter(tk => selectedTaskIds.has(tk.id));
    if (selectedTasks.length === 0) return;

    // Sort: phase first, then visual impact
    const sortedTasks = [...selectedTasks].sort((a, b) => {
      const phaseA = a.phase ?? 99;
      const phaseB = b.phase ?? 99;
      if (phaseA !== phaseB) return phaseA - phaseB;
      const impactOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
      return (
        (impactOrder[a.visualImpact || 'medium'] ?? 1) -
        (impactOrder[b.visualImpact || 'medium'] ?? 1)
      );
    });

    setIsCreating(true);
    setCreateError(null);
    try {
      const room = await addRoom({
        name: roomName || 'Room',
        type: (roomType as RoomType) || 'bedroom',
        emoji: getRoomEmoji(roomType as RoomType),
        messLevel: 50,
        aiSummary: `${sortedTasks.length} tasks selected`,
      });

      if (photoUri) {
        await addPhotoToRoom(room.id, {
          uri: photoUri,
          timestamp: new Date(),
          type: 'before',
        });
      }

      setTasksForRoom(room.id, sortedTasks);
      setActiveRoom(room.id);
      router.replace({ pathname: '/room/[id]', params: { id: room.id } });
    } catch (err) {
      setCreateError("Couldn't save your room. Tap to try again.");
    } finally {
      setIsCreating(false);
    }
  }, [analysisResult, isCreating, roomName, roomType, photoUri]);

  const handleSeeAllTasks = useCallback(() => {
    if (!analysisResult) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: '/task-customize',
      params: {
        photoUri: photoUri || '',
        roomType: roomType || 'bedroom',
        roomName: roomName || 'Room',
        tasks: JSON.stringify(analysisResult.tasks),
      },
    });
  }, [analysisResult, photoUri, roomType, roomName]);

  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    cancelledRef.current = true;
    router.back();
  }, []);

  const handleUseFallback = useCallback(() => {
    const fallbackTasks = generateFallbackTasks(roomType || 'bedroom');
    const totalMinutes = fallbackTasks.reduce((sum, tk) => sum + (tk.estimatedMinutes || 3), 0);
    setAnalysisResult({
      areas: [
        {
          name: 'General cleaning',
          taskCount: fallbackTasks.length,
          tasks: fallbackTasks.map((tk) => tk.title),
          color: V1.coral,
        },
      ],
      totalItems: fallbackTasks.length,
      totalMinutes,
      tasks: fallbackTasks,
    });
    setError(null);
  }, [roomType]);

  // ── SCANNING PHASE ──────────────────────────────────────────────────────
  if (phase === 'scanning') {
    return (
      <ScanningPhase
        photoUri={photoUri || null}
        scanStep={scanStep}
        reducedMotion={reducedMotion}
        topInset={insets.top}
        pulseStyle={pulseStyle}
        onBack={handleBack}
        isOffline={isOffline}
        onUseFallback={handleUseFallback}
      />
    );
  }

  // ── DETECTION PHASE ─────────────────────────────────────────────────────
  if (phase === 'detection') {
    return (
      <DetectionPhase
        photoUri={photoUri || null}
        areas={analysisResult?.areas || []}
        totalItems={analysisResult?.totalItems || 0}
        reducedMotion={reducedMotion}
        topInset={insets.top}
        bottomInset={insets.bottom}
        onBack={handleBack}
        onContinue={handleCreateRoom}
      />
    );
  }

  // ── RESULTS PHASE ───────────────────────────────────────────────────────
  return (
    <ResultsPhase
      photoUri={photoUri || null}
      analysisResult={analysisResult}
      tasks={analysisResult?.tasks}
      error={error}
      isDark={isDark}
      reducedMotion={reducedMotion}
      topInset={insets.top}
      bottomInset={insets.bottom}
      retryCount={retryCount}
      maxRetries={MAX_RETRIES}
      isCreating={isCreating}
      createError={createError}
      onBack={handleBack}
      onRetry={handleRetry}
      onRetakePhoto={() => router.back()}
      onCreateRoom={handleCreateRoom}
      onCreateRoomWithTasks={handleCreateRoomWithTasks}
      onSeeAllTasks={handleSeeAllTasks}
      onUseFallback={handleUseFallback}
    />
  );
}

// ─── Fallback task generator ─────────────────────────────────────────────────
function generateFallbackTasks(roomType: RoomType): CleaningTask[] {
  const baseTasks: Record<
    string,
    Pick<
      CleaningTask,
      'title' | 'description' | 'estimatedMinutes' | 'phase' | 'phaseName' | 'visualImpact' | 'difficulty' | 'destination'
    >[]
  > = {
    bedroom: [
      { title: 'Grab any visible clothing off the floor near the bed -> laundry basket', description: "Scoop up everything within arm's reach", estimatedMinutes: 3, phase: 1, phaseName: 'Operation Floor Rescue', visualImpact: 'high', difficulty: 'quick' },
      { title: 'Straighten the sheets and pillows on the bed', description: 'Pull the duvet up, fluff the pillows -- instant room transformation', estimatedMinutes: 2, phase: 1, phaseName: 'Operation Floor Rescue', visualImpact: 'high', difficulty: 'quick' },
      { title: 'Clear items from the nightstand surface -> where they belong', description: 'Cups to kitchen, books to shelf, trash to bin', estimatedMinutes: 5, phase: 2, phaseName: 'Counter Strike', visualImpact: 'medium', difficulty: 'medium' },
      { title: "Stack loose papers on the desk into one pile -> don't sort yet", description: 'Just gather into a single stack for now', estimatedMinutes: 4, phase: 2, phaseName: 'Counter Strike', visualImpact: 'medium', difficulty: 'medium' },
      { title: 'Fold and put away clean laundry -> closet or dresser', description: 'Quick fold, no need to be perfect', estimatedMinutes: 5, phase: 3, phaseName: 'The Final Sparkle', visualImpact: 'medium', difficulty: 'medium' },
    ],
    kitchen: [
      { title: 'Wipe down the main counter surface with a paper towel', description: 'Clear crumbs and spills from the primary counter', estimatedMinutes: 4, phase: 1, phaseName: 'Operation Floor Rescue', visualImpact: 'high', difficulty: 'quick' },
      { title: 'Load dirty dishes from the sink -> dishwasher or drying rack', description: 'Biggest visual impact in the kitchen', estimatedMinutes: 5, phase: 1, phaseName: 'Operation Floor Rescue', visualImpact: 'high', difficulty: 'medium' },
      { title: 'Tie up the trash bag and carry to bin outside', description: 'Grab the bag, tie it, walk it out', estimatedMinutes: 3, phase: 1, phaseName: 'Operation Floor Rescue', visualImpact: 'high', difficulty: 'quick' },
      { title: 'Clear remaining dishes from the counter -> sink or dishwasher', description: 'Get all dishes off surfaces', estimatedMinutes: 5, phase: 2, phaseName: 'Counter Strike', visualImpact: 'medium', difficulty: 'medium' },
      { title: 'Wipe down the stovetop surface with cleaning spray', description: 'Spray, wait 10 seconds, wipe', estimatedMinutes: 3, phase: 2, phaseName: 'Counter Strike', visualImpact: 'medium', difficulty: 'quick' },
    ],
    bathroom: [
      { title: 'Wipe the bathroom mirror with a damp cloth', description: 'Instant sparkle', estimatedMinutes: 2, phase: 1, phaseName: 'Operation Floor Rescue', visualImpact: 'high', difficulty: 'quick' },
      { title: 'Scrub the sink basin with soap and water', description: 'Quick scrub, rinse, done', estimatedMinutes: 3, phase: 1, phaseName: 'Operation Floor Rescue', visualImpact: 'high', difficulty: 'quick' },
      { title: 'Clear items from the bathroom counter -> cabinet or basket', description: 'Put products back where they go', estimatedMinutes: 3, phase: 2, phaseName: 'Counter Strike', visualImpact: 'medium', difficulty: 'quick' },
      { title: 'Hang up towels neatly on the towel rack', description: 'Straighten and fold over rack', estimatedMinutes: 2, phase: 1, phaseName: 'Operation Floor Rescue', visualImpact: 'medium', difficulty: 'quick' },
    ],
    default: [
      { title: 'Pick up any visible items from the floor -> their proper spot', description: 'Gather everything on the floor within reach', estimatedMinutes: 5, phase: 1, phaseName: 'Operation Floor Rescue', visualImpact: 'high', difficulty: 'quick' },
      { title: 'Clear the main surface area -> items to where they belong', description: 'Focus on one flat surface at a time', estimatedMinutes: 5, phase: 2, phaseName: 'Counter Strike', visualImpact: 'high', difficulty: 'medium' },
      { title: 'Collect visible trash and toss in bag -> trash bin', description: 'Grab a bag and do one sweep', estimatedMinutes: 3, phase: 1, phaseName: 'Operation Floor Rescue', visualImpact: 'high', difficulty: 'quick' },
    ],
  };

  const tasks = baseTasks[roomType] || baseTasks.default;
  return tasks.map((task, i) => ({
    id: `task-${Date.now()}-${i}`,
    title: task.title,
    description: task.description,
    emoji: '\uD83E\uDDF9',
    priority: i < 2 ? ('high' as const) : i < 4 ? ('medium' as const) : ('low' as const),
    difficulty:
      task.difficulty ||
      ((task.estimatedMinutes || 3) <= 3 ? ('quick' as const) : ('medium' as const)),
    estimatedMinutes: task.estimatedMinutes,
    completed: false,
    phase: task.phase,
    phaseName: task.phaseName,
    visualImpact: task.visualImpact,
    destination: task.destination,
  }));
}

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
