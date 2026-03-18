/**
 * Declutterly -- Analysis Screen (V1)
 * Combines Pencil designs: 7iGXL (scanning), ldgnk (AI detection), 30nGD (results)
 *
 * Flow: Scanning animation -> AI detection overlay -> Results grouped by detected items
 * -> "Start with 3 easy wins" CTA -> Task Customize screen
 */

import * as FileSystem from 'expo-file-system/legacy';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState, useCallback } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Dimensions,
} from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Check } from 'lucide-react-native';
import { useDeclutter } from '@/context/DeclutterContext';
import { analyzeRoomImage } from '@/services/ai';
import { CleaningTask, RoomType } from '@/types/declutter';

// ─── V1 Design Tokens ────────────────────────────────────────────────────────
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

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Scanning steps ──────────────────────────────────────────────────────────
const SCAN_STEPS = [
  { label: 'Scanning your space', done: false },
  { label: 'Spotting areas to tidy', done: false },
  { label: 'Building your task list', done: false },
];

// ─── Area colors for detection overlay ───────────────────────────────────────
const AREA_COLORS = [V1.coral, V1.amber, V1.blue, V1.green, V1.gold];

// ─── Types ───────────────────────────────────────────────────────────────────
interface DetectedArea {
  name: string;
  taskCount: number;
  tasks: string[];
  color: string;
}

interface AnalysisResult {
  areas: DetectedArea[];
  totalItems: number;
  totalMinutes: number;
  tasks: CleaningTask[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Analysis Screen
// ─────────────────────────────────────────────────────────────────────────────
export default function AnalysisScreen() {
  const { photoUri, roomType, roomName } = useLocalSearchParams<{
    photoUri: string;
    roomType: RoomType;
    roomName: string;
  }>();

  const rawScheme = useColorScheme();
  const isDark = rawScheme === 'dark';
  const t = isDark ? V1.dark : V1.light;
  const insets = useSafeAreaInsets();

  const { addRoom, setTasksForRoom, addPhotoToRoom, setActiveRoom } = useDeclutter();

  const [phase, setPhase] = useState<'scanning' | 'detection' | 'results'>('scanning');
  const [scanStep, setScanStep] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Scanning animation
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    // Start pulse animation
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
    );

    // Simulate scan steps and perform AI analysis
    const runAnalysis = async () => {
      try {
        // Step 1: Scanning
        setScanStep(0);
        await new Promise(r => setTimeout(r, 1200));

        // Step 2: Spotting
        setScanStep(1);

        // Read image and analyze
        let analysisData: any = null;
        try {
          const base64 = await FileSystem.readAsStringAsync(photoUri!, { encoding: 'base64' });
          analysisData = await analyzeRoomImage(base64, `Room type: ${roomType || 'bedroom'}`);
        } catch (aiError) {
          // If AI fails, generate fallback tasks
          console.warn('AI analysis failed, using fallback:', aiError);
        }

        // Step 3: Building task list
        setScanStep(2);
        await new Promise(r => setTimeout(r, 800));

        // Process results
        let tasks: CleaningTask[] = [];
        let areas: DetectedArea[] = [];

        if (analysisData?.tasks && analysisData.tasks.length > 0) {
          tasks = analysisData.tasks;
          // Group tasks by zone/area
          const zoneMap = new Map<string, CleaningTask[]>();
          tasks.forEach(task => {
            const zone = task.zone || 'General';
            if (!zoneMap.has(zone)) zoneMap.set(zone, []);
            zoneMap.get(zone)!.push(task);
          });
          areas = Array.from(zoneMap.entries()).map(([name, zoneTasks], i) => ({
            name,
            taskCount: zoneTasks.length,
            tasks: zoneTasks.map(t => t.title),
            color: AREA_COLORS[i % AREA_COLORS.length],
          }));
        } else {
          // Fallback: generate basic tasks
          tasks = generateFallbackTasks(roomType || 'bedroom');
          areas = [
            { name: 'General cleaning', taskCount: tasks.length, tasks: tasks.map(t => t.title), color: V1.coral },
          ];
        }

        const totalMinutes = tasks.reduce((sum, t) => sum + (t.estimatedMinutes || 3), 0);

        setAnalysisResult({
          areas,
          totalItems: tasks.length,
          totalMinutes,
          tasks,
        });

        // Briefly show detection overlay
        setPhase('detection');
        await new Promise(r => setTimeout(r, 2000));

        // Show results
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setPhase('results');
      } catch (err) {
        setError('Something went wrong. Please try again.');
        setPhase('results');
      }
    };

    runAnalysis();

    return () => {
      cancelAnimation(pulseScale);
    };
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const handleEasyWins = useCallback(async () => {
    if (!analysisResult) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Create room and add tasks (just easy wins)
    const easyTasks = analysisResult.tasks
      .sort((a, b) => (a.estimatedMinutes || 3) - (b.estimatedMinutes || 3))
      .slice(0, 3);

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

      setTasksForRoom(room.id, easyTasks);
      setActiveRoom(room.id);
      router.replace(`/room/${room.id}`);
    } catch (err) {
      Alert.alert('Error', 'Failed to create room');
    }
  }, [analysisResult, roomName, roomType, photoUri]);

  const handleSeeAllTasks = useCallback(() => {
    if (!analysisResult) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Navigate to task customize
    (router.push as any)({
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
    router.back();
  }, []);

  // ── SCANNING PHASE ──────────────────────────────────────────────────────
  if (phase === 'scanning') {
    return (
      <View style={[styles.container, { backgroundColor: '#0C0C0C' }]}>
        {/* Photo with scanning effect */}
        <View style={styles.scanPhotoContainer}>
          {photoUri && (
            <Animated.View style={[styles.scanPhotoWrapper, pulseStyle]}>
              <Image source={{ uri: photoUri }} style={styles.scanPhoto} contentFit="cover" />
              {/* Corner brackets (coral) */}
              <View style={[styles.scanBracket, styles.scanBracketTL]} />
              <View style={[styles.scanBracket, styles.scanBracketTR]} />
              <View style={[styles.scanBracket, styles.scanBracketBL]} />
              <View style={[styles.scanBracket, styles.scanBracketBR]} />
            </Animated.View>
          )}
        </View>

        {/* Scanning text */}
        <View style={styles.scanTextSection}>
          <Text style={styles.scanTitle}>Taking a calm look...</Text>
          <Text style={styles.scanSubtitle}>No judgment -- just finding where to start</Text>

          {/* Steps */}
          <View style={styles.scanSteps}>
            {SCAN_STEPS.map((step, i) => (
              <View key={i} style={styles.scanStepRow}>
                <View style={[
                  styles.scanStepDot,
                  i < scanStep
                    ? { backgroundColor: V1.green }
                    : i === scanStep
                      ? { backgroundColor: V1.coral, borderWidth: 0 }
                      : { borderColor: 'rgba(255,255,255,0.2)', borderWidth: 1.5, backgroundColor: 'transparent' },
                ]}>
                  {i < scanStep && <Check size={10} color="#FFFFFF" strokeWidth={3} />}
                </View>
                <Text style={[
                  styles.scanStepText,
                  { color: i <= scanStep ? '#FFFFFF' : 'rgba(255,255,255,0.3)' },
                ]}>
                  {step.label}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  }

  // ── DETECTION PHASE (overlay) ───────────────────────────────────────────
  if (phase === 'detection') {
    return (
      <View style={[styles.container, { backgroundColor: '#0C0C0C' }]}>
        {/* Header */}
        <View style={[styles.detectionHeader, { paddingTop: insets.top + 8 }]}>
          <Pressable onPress={handleBack} hitSlop={12}>
            <ChevronLeft size={24} color="#FFFFFF" />
          </Pressable>
          <Text style={styles.detectionTitle}>
            AI Found {analysisResult?.totalItems || 0} Items
          </Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Photo with detection boxes */}
        <View style={styles.detectionPhotoContainer}>
          {photoUri && (
            <Image source={{ uri: photoUri }} style={styles.detectionPhoto} contentFit="cover" />
          )}

          {/* Fake detection boxes */}
          {analysisResult?.areas.map((area, i) => (
            <Animated.View
              key={area.name}
              entering={FadeIn.delay(i * 200).duration(400)}
              style={[
                styles.detectionBox,
                {
                  borderColor: area.color,
                  top: `${20 + i * 20}%`,
                  left: `${10 + (i % 2) * 30}%`,
                  width: '45%',
                  height: '25%',
                },
              ]}
            >
              <View style={[styles.detectionLabel, { backgroundColor: area.color }]}>
                <Text style={styles.detectionLabelText}>{area.name}</Text>
              </View>
            </Animated.View>
          ))}
        </View>

        {/* Detection summary */}
        <View style={styles.detectionSummary}>
          <Text style={styles.detectionSummaryTitle}>
            {analysisResult?.areas.length || 0} areas detected
          </Text>
          <View style={styles.detectionPills}>
            {analysisResult?.areas.map(area => (
              <View key={area.name} style={[styles.detectionPill, { backgroundColor: area.color }]}>
                <Text style={styles.detectionPillText}>
                  {area.name} {'\u00B7'} {area.taskCount} tasks
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* CTA */}
        <View style={[styles.detectionCta, { paddingBottom: insets.bottom + 20 }]}>
          <Pressable onPress={() => setPhase('results')} style={[styles.ctaButton, { backgroundColor: V1.coral }]}>
            <Text style={styles.ctaButtonText}>See Task Breakdown</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ── RESULTS PHASE ───────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      {/* Header */}
      <View style={[styles.resultsHeader, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={handleBack} hitSlop={12}>
          <ChevronLeft size={24} color={t.text} />
        </Pressable>
        <Text style={[styles.resultsTitle, { color: t.text }]}>Results</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Photo thumbnail */}
        {photoUri && (
          <Animated.View entering={FadeInDown.duration(400)} style={styles.resultPhotoContainer}>
            <Image source={{ uri: photoUri }} style={styles.resultPhoto} contentFit="cover" />
          </Animated.View>
        )}

        {/* Summary pills */}
        {analysisResult && (
          <Animated.View entering={FadeInDown.delay(50).duration(400)} style={styles.summaryPills}>
            <View style={[styles.summaryPill, { backgroundColor: isDark ? 'rgba(102,187,106,0.15)' : 'rgba(102,187,106,0.1)' }]}>
              <Text style={[styles.summaryPillText, { color: V1.green }]}>
                {analysisResult.totalItems} things spotted
              </Text>
            </View>
            <View style={[styles.summaryPill, { backgroundColor: isDark ? 'rgba(255,183,77,0.15)' : 'rgba(255,183,77,0.1)' }]}>
              <Text style={[styles.summaryPillText, { color: V1.amber }]}>
                ~{analysisResult.totalMinutes} min total
              </Text>
            </View>
          </Animated.View>
        )}

        {/* Error state — V1 Pencil "AI Error" design */}
        {error && (
          <View style={styles.errorContainer}>
            <View style={styles.errorIconWrap}>
              <View style={styles.errorIconCircle}>
                <Text style={styles.errorIconText}>!</Text>
              </View>
            </View>
            <Text style={[styles.errorTitle, { color: t.text }]}>Hmm, that didn't work</Text>
            <Text style={[styles.errorDescription, { color: t.textSecondary }]}>
              Our AI had trouble analyzing your photo. This can happen with tricky lighting or angles. Let's try again!
            </Text>
            <Pressable
              onPress={handleBack}
              style={({ pressed }) => [{ opacity: pressed ? 0.88 : 1, width: '100%' }]}
            >
              <LinearGradient
                colors={[V1.coral, '#FF5252']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.errorCTA}
              >
                <Text style={styles.errorCTAText}>Try Again</Text>
              </LinearGradient>
            </Pressable>
            <Pressable onPress={() => setError(null)}>
              <Text style={styles.errorFallbackLink}>Use suggested tasks instead</Text>
            </Pressable>
            <Text style={[styles.errorFallbackHint, { color: t.textMuted }]}>
              We'll give you a starter task list for your room type
            </Text>
          </View>
        )}

        {/* Area cards */}
        {analysisResult?.areas.map((area, index) => (
          <Animated.View
            key={area.name}
            entering={FadeInDown.delay(100 + index * 60).duration(400)}
            style={styles.areaCardContainer}
          >
            <View style={[styles.areaCard, { backgroundColor: t.card, borderColor: t.border }]}>
              <View style={styles.areaCardHeader}>
                <Text style={[styles.areaName, { color: t.text }]}>{area.name}</Text>
                <View style={[styles.areaCountPill, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
                  <Text style={[styles.areaCountText, { color: t.textSecondary }]}>
                    {area.taskCount} tasks
                  </Text>
                </View>
              </View>
              <Text style={[styles.areaTasks, { color: t.textSecondary }]} numberOfLines={2}>
                {area.tasks.join(' \u00B7 ')}
              </Text>
            </View>
          </Animated.View>
        ))}
      </ScrollView>

      {/* Bottom CTAs */}
      {analysisResult && (
        <View style={[styles.bottomCtas, { paddingBottom: insets.bottom + 20, backgroundColor: t.bg }]}>
          <Pressable onPress={handleEasyWins} style={[styles.ctaButton, { backgroundColor: V1.coral }]}>
            <Text style={styles.ctaButtonText}>Start with 3 easy wins</Text>
          </Pressable>
          <Pressable onPress={handleSeeAllTasks}>
            <Text style={[styles.seeAllText, { color: V1.coral }]}>
              See all {analysisResult.totalItems} tasks
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

// ─── Fallback task generator ─────────────────────────────────────────────────
function generateFallbackTasks(roomType: RoomType): CleaningTask[] {
  const baseTasks: Record<string, Pick<CleaningTask, 'title' | 'description' | 'estimatedMinutes'>[]> = {
    bedroom: [
      { title: 'Pick up clothes from floor', description: 'Gather all loose clothing', estimatedMinutes: 3 },
      { title: 'Make the bed', description: 'Straighten sheets and pillows', estimatedMinutes: 2 },
      { title: 'Clear bedside table', description: 'Remove clutter from nightstand', estimatedMinutes: 5 },
      { title: 'Sort desk papers', description: 'Organize loose papers', estimatedMinutes: 4 },
      { title: 'Put away clean laundry', description: 'Fold and store clean clothes', estimatedMinutes: 5 },
    ],
    kitchen: [
      { title: 'Wipe counters', description: 'Clean all counter surfaces', estimatedMinutes: 4 },
      { title: 'Load dishwasher', description: 'Put dirty dishes in dishwasher', estimatedMinutes: 5 },
      { title: 'Take out trash', description: 'Empty kitchen trash', estimatedMinutes: 3 },
      { title: 'Clear sink', description: 'Wash remaining dishes', estimatedMinutes: 5 },
      { title: 'Wipe stovetop', description: 'Clean the stove surface', estimatedMinutes: 3 },
    ],
    bathroom: [
      { title: 'Wipe mirror', description: 'Clean bathroom mirror', estimatedMinutes: 2 },
      { title: 'Clean sink', description: 'Scrub the sink', estimatedMinutes: 3 },
      { title: 'Wipe counter', description: 'Clean bathroom counter', estimatedMinutes: 3 },
      { title: 'Hang towels', description: 'Organize towels neatly', estimatedMinutes: 2 },
    ],
    default: [
      { title: 'Pick up floor items', description: 'Gather items from the floor', estimatedMinutes: 5 },
      { title: 'Clear surfaces', description: 'Remove clutter from surfaces', estimatedMinutes: 5 },
      { title: 'Take out trash', description: 'Empty trash bin', estimatedMinutes: 3 },
    ],
  };

  const tasks = baseTasks[roomType] || baseTasks.default;
  return tasks.map((t, i) => ({
    id: `task-${Date.now()}-${i}`,
    title: t.title,
    description: t.description,
    emoji: '🧹',
    priority: i < 2 ? 'high' as const : i < 4 ? 'medium' as const : 'low' as const,
    difficulty: (t.estimatedMinutes || 3) <= 3 ? 'quick' as const : 'medium' as const,
    estimatedMinutes: t.estimatedMinutes,
    completed: false,
  }));
}

function getRoomEmoji(type: RoomType): string {
  const map: Record<string, string> = {
    bedroom: '🛏️', kitchen: '🍳', bathroom: '🚿', livingRoom: '🛋️',
    office: '💻', garage: '🔧', closet: '👕', other: '🏠',
  };
  return map[type] || '🏠';
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },

  // ── Scanning Phase ─────────────────────────────────────────────────────
  scanPhotoContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  scanPhotoWrapper: {
    width: SCREEN_WIDTH * 0.7,
    height: SCREEN_WIDTH * 0.7,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  scanPhoto: {
    width: '100%',
    height: '100%',
  },
  scanBracket: {
    position: 'absolute',
    width: 30,
    height: 30,
  },
  scanBracketTL: {
    top: 8,
    left: 8,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: V1.coral,
  },
  scanBracketTR: {
    top: 8,
    right: 8,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: V1.coral,
  },
  scanBracketBL: {
    bottom: 8,
    left: 8,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: V1.coral,
  },
  scanBracketBR: {
    bottom: 8,
    right: 8,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: V1.coral,
  },
  scanTextSection: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: 60,
    paddingTop: 32,
  },
  scanTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  scanSubtitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 15,
    fontStyle: 'italic',
    marginBottom: 28,
  },
  scanSteps: {
    gap: 16,
    alignItems: 'flex-start',
  },
  scanStepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  scanStepDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanStepText: {
    fontSize: 15,
    fontWeight: '500',
  },

  // ── Detection Phase ────────────────────────────────────────────────────
  detectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  detectionTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  detectionPhotoContainer: {
    flex: 1,
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  detectionPhoto: {
    width: '100%',
    height: '100%',
  },
  detectionBox: {
    position: 'absolute',
    borderWidth: 2,
    borderRadius: 8,
  },
  detectionLabel: {
    position: 'absolute',
    top: -1,
    left: -1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  detectionLabelText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  detectionSummary: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  detectionSummaryTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  detectionPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  detectionPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  detectionPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  detectionCta: {
    paddingHorizontal: 20,
  },

  // ── Results Phase ──────────────────────────────────────────────────────
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  resultsTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  resultPhotoContainer: {
    marginHorizontal: 20,
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  resultPhoto: {
    width: '100%',
    height: '100%',
  },
  summaryPills: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  summaryPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  summaryPillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  areaCardContainer: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  areaCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  areaCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  areaName: {
    fontSize: 16,
    fontWeight: '600',
  },
  areaCountPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  areaCountText: {
    fontSize: 12,
    fontWeight: '500',
  },
  areaTasks: {
    fontSize: 14,
    lineHeight: 20,
  },
  errorContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 32,
    gap: 12,
  },
  errorIconWrap: {
    marginBottom: 8,
  },
  errorIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,107,107,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,107,107,0.3)',
  },
  errorIconText: {
    color: V1.coral,
    fontSize: 24,
    fontWeight: '700',
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  errorDescription: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 8,
  },
  errorCTA: {
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorCTAText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  errorFallbackLink: {
    color: V1.coral,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  errorFallbackHint: {
    fontSize: 12,
    textAlign: 'center',
  },
  bottomCtas: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 12,
    alignItems: 'center',
  },
  ctaButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 28,
    alignItems: 'center',
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
