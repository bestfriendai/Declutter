/**
 * ResultsPhase -- Results display with area cards, doom piles, task clusters
 * Extracts inline styles to StyleSheet. Offers photo retake from error state.
 */

import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Check, ChevronLeft, RefreshCw } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { DoomPileCard } from '@/components/room/DoomPileCard';
import { V1, BODY_FONT, DISPLAY_FONT } from '@/constants/designTokens';
import type { CleaningTask } from '@/types/declutter';

// ── Types ───────────────────────────────────────────────────────────────────

interface DetectedArea {
  name: string;
  taskCount: number;
  tasks: string[];
  color: string;
}

interface AnalysisResultData {
  areas: DetectedArea[];
  totalItems: number;
  totalMinutes: number;
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
  timeProfiles?: {
    minimal?: { tasks: string[]; expectedImpact: number; estimatedMinutes?: number };
    quick?: { tasks: string[]; expectedImpact: number; estimatedMinutes?: number };
    standard?: { tasks: string[]; expectedImpact: number; estimatedMinutes?: number };
    complete?: { tasks: string[]; expectedImpact: number; estimatedMinutes?: number };
  } | null;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function getCategoryEmoji(category?: string): string {
  const map: Record<string, string> = {
    trash: '\uD83D\uDDD1\uFE0F',
    dishes: '\uD83C\uDF7D\uFE0F',
    clothes: '\uD83D\uDC55',
    papers: '\uD83D\uDCC4',
    belongs_elsewhere: '\uD83D\uDCE6',
    misc: '\uD83D\uDD39',
  };
  return map[category || ''] || '\uD83D\uDD39';
}

// ── Props ───────────────────────────────────────────────────────────────────

interface ResultsPhaseProps {
  photoUri: string | null;
  analysisResult: AnalysisResultData | null;
  tasks?: CleaningTask[];
  error: string | null;
  isDark: boolean;
  reducedMotion: boolean;
  topInset: number;
  bottomInset: number;
  retryCount: number;
  maxRetries: number;
  isCreating: boolean;
  createError: string | null;
  onBack: () => void;
  onRetry: () => void;
  onRetakePhoto: () => void;
  onCreateRoom: () => void;
  onCreateRoomWithTasks?: (selectedTaskIds: Set<string>) => void;
  onSeeAllTasks: () => void;
  onUseFallback: () => void;
}

export function ResultsPhase({
  photoUri,
  analysisResult,
  tasks: tasksProp,
  error,
  isDark,
  reducedMotion,
  topInset,
  bottomInset,
  retryCount,
  maxRetries,
  isCreating,
  createError,
  onBack,
  onRetry,
  onRetakePhoto,
  onCreateRoom,
  onCreateRoomWithTasks,
  onSeeAllTasks,
  onUseFallback,
}: ResultsPhaseProps) {
  const t = isDark ? V1.dark : V1.light;

  // Time profile selection state
  const [selectedTimeProfile, setSelectedTimeProfile] = useState<string | null>(null);

  // Inline task customization state
  const allTasks = tasksProp ?? [];
  const [showCustomize, setShowCustomize] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(allTasks.map(tk => tk.id)),
  );

  // Filter tasks by time profile if one is selected
  const filteredTasks = useMemo(() => {
    if (!selectedTimeProfile || !analysisResult?.timeProfiles) return allTasks;
    const profile = analysisResult.timeProfiles[selectedTimeProfile as keyof typeof analysisResult.timeProfiles];
    if (!profile || !profile.tasks || profile.tasks.length === 0) return allTasks;
    const profileTaskIds = new Set(profile.tasks);
    const filtered = allTasks.filter(tk => profileTaskIds.has(tk.id));
    return filtered.length > 0 ? filtered : allTasks;
  }, [allTasks, selectedTimeProfile, analysisResult?.timeProfiles]);

  // When a time profile is selected, update the selectedIds
  const handleSelectTimeProfile = useCallback((profileKey: string | null) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (profileKey === selectedTimeProfile) {
      // Deselect — go back to all tasks
      setSelectedTimeProfile(null);
      setSelectedIds(new Set(allTasks.map(tk => tk.id)));
      return;
    }
    setSelectedTimeProfile(profileKey);
    if (profileKey && analysisResult?.timeProfiles) {
      const profile = analysisResult.timeProfiles[profileKey as keyof typeof analysisResult.timeProfiles];
      if (profile?.tasks && profile.tasks.length > 0) {
        const profileTaskIds = new Set(profile.tasks);
        const matchingIds = allTasks.filter(tk => profileTaskIds.has(tk.id)).map(tk => tk.id);
        if (matchingIds.length > 0) {
          setSelectedIds(new Set(matchingIds));
          return;
        }
      }
    }
    // Fallback — keep all selected
    setSelectedIds(new Set(allTasks.map(tk => tk.id)));
  }, [selectedTimeProfile, allTasks, analysisResult?.timeProfiles]);

  // Group tasks by zone
  const groupedTasks = useMemo(() => {
    const map = new Map<string, CleaningTask[]>();
    allTasks.forEach(task => {
      const zone = task.zone || 'General';
      if (!map.has(zone)) map.set(zone, []);
      map.get(zone)!.push(task);
    });
    return Array.from(map.entries());
  }, [allTasks]);

  const selectedCount = selectedIds.size;
  const selectedMinutes = allTasks
    .filter(tk => selectedIds.has(tk.id))
    .reduce((sum, tk) => sum + (tk.estimatedMinutes || 3), 0);

  const toggleTask = useCallback((taskId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  }, []);

  const toggleGroup = useCallback((tasks: CleaningTask[]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedIds(prev => {
      const next = new Set(prev);
      const allSelected = tasks.every(tk => next.has(tk.id));
      if (allSelected) tasks.forEach(tk => next.delete(tk.id));
      else tasks.forEach(tk => next.add(tk.id));
      return next;
    });
  }, []);

  const handleStartEasyWins = useCallback(() => {
    // Select only quick-win tasks (phase 1 or < 3 min)
    const easyWinIds = new Set(
      allTasks
        .filter(tk => tk.phase === 1 || (tk.estimatedMinutes || 3) <= 3)
        .map(tk => tk.id),
    );
    if (easyWinIds.size === 0) {
      // Fall back to first 3 tasks
      allTasks.slice(0, 3).forEach(tk => easyWinIds.add(tk.id));
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (onCreateRoomWithTasks) {
      onCreateRoomWithTasks(easyWinIds);
    } else {
      onCreateRoom();
    }
  }, [allTasks, onCreateRoomWithTasks, onCreateRoom]);

  const handleAddAllTasks = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (onCreateRoomWithTasks) {
      onCreateRoomWithTasks(selectedIds);
    } else {
      onCreateRoom();
    }
  }, [selectedIds, onCreateRoomWithTasks, onCreateRoom]);

  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      {/* Header */}
      <View style={[styles.resultsHeader, { paddingTop: topInset + 8 }]}>
        <Pressable onPress={onBack} hitSlop={12}>
          <ChevronLeft size={24} color={t.text} />
        </Pressable>
        <Text style={[styles.resultsTitle, { color: t.text }]}>Results</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: bottomInset + 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Photo thumbnail */}
        {photoUri && (
          <Animated.View
            entering={reducedMotion ? undefined : FadeInDown.duration(400)}
            style={styles.resultPhotoContainer}
          >
            <Image
              source={{ uri: photoUri }}
              style={styles.resultPhoto}
              contentFit="cover"
              placeholder={{ blurhash: 'LGF5]+Yk^6#M@-5c,1J5@[or[Q6.' }}
              cachePolicy="memory-disk"
            />
          </Animated.View>
        )}

        {/* Summary pills */}
        {analysisResult && (
          <Animated.View
            entering={reducedMotion ? undefined : FadeInDown.delay(50).duration(400)}
            style={styles.summaryPills}
          >
            <View
              style={[
                styles.summaryPill,
                { backgroundColor: isDark ? 'rgba(102,187,106,0.15)' : 'rgba(102,187,106,0.1)' },
              ]}
            >
              <Text style={[styles.summaryPillText, { color: V1.green }]}>
                {analysisResult.totalItems} things spotted
              </Text>
            </View>
            <View
              style={[
                styles.summaryPill,
                { backgroundColor: isDark ? 'rgba(255,183,77,0.15)' : 'rgba(255,183,77,0.1)' },
              ]}
            >
              <Text style={[styles.summaryPillText, { color: V1.amber }]}>
                about {analysisResult.totalMinutes} min total
              </Text>
            </View>
          </Animated.View>
        )}

        {/* Time Profile Selector */}
        {analysisResult?.timeProfiles && (
          analysisResult.timeProfiles.minimal?.tasks?.length ||
          analysisResult.timeProfiles.quick?.tasks?.length ||
          analysisResult.timeProfiles.standard?.tasks?.length ||
          analysisResult.timeProfiles.complete?.tasks?.length
        ) ? (
          <Animated.View
            entering={reducedMotion ? undefined : FadeInDown.delay(55).duration(400)}
            style={styles.timeProfileSection}
          >
            <Text style={[styles.timeProfileTitle, { color: t.text }]}>
              How much time do you have?
            </Text>
            <View style={styles.timeProfileRow}>
              {([
                { key: 'minimal', label: '5 min', minutes: analysisResult.timeProfiles.minimal?.estimatedMinutes },
                { key: 'quick', label: '15 min', minutes: analysisResult.timeProfiles.quick?.estimatedMinutes },
                { key: 'standard', label: '30 min', minutes: analysisResult.timeProfiles.standard?.estimatedMinutes },
                { key: 'complete', label: '1 hr+', minutes: analysisResult.timeProfiles.complete?.estimatedMinutes },
              ] as const).map((option) => {
                const profile = analysisResult.timeProfiles?.[option.key as keyof typeof analysisResult.timeProfiles];
                if (!profile?.tasks?.length) return null;
                const isSelected = selectedTimeProfile === option.key;
                return (
                  <Pressable
                    key={option.key}
                    onPress={() => handleSelectTimeProfile(option.key)}
                    style={[
                      styles.timeProfileButton,
                      {
                        backgroundColor: isSelected
                          ? V1.coral
                          : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                        borderColor: isSelected ? V1.coral : 'transparent',
                      },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`${option.label} plan, ${profile.tasks.length} tasks`}
                    accessibilityState={{ selected: isSelected }}
                  >
                    <Text style={[
                      styles.timeProfileButtonText,
                      { color: isSelected ? '#FFFFFF' : t.text },
                    ]}>
                      {option.label}
                    </Text>
                    <Text style={[
                      styles.timeProfileTaskCount,
                      { color: isSelected ? 'rgba(255,255,255,0.8)' : t.textMuted },
                    ]}>
                      {profile.tasks.length} tasks
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>
        ) : null}

        {/* Supply Checklist */}
        {analysisResult?.supplyChecklist && analysisResult.supplyChecklist.length > 0 && (
          <Animated.View
            entering={reducedMotion ? undefined : FadeInDown.delay(60).duration(400)}
            style={styles.supplySection}
          >
            <Text style={styles.supplyTitle}>Before you start, grab:</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.supplyScroll}
            >
              {analysisResult.supplyChecklist.map((supply, i) => (
                <View
                  key={`supply-${i}`}
                  style={[
                    styles.supplyPill,
                    {
                      backgroundColor: isDark
                        ? 'rgba(255,183,77,0.12)'
                        : 'rgba(255,183,77,0.10)',
                      borderColor: isDark
                        ? 'rgba(255,183,77,0.2)'
                        : 'rgba(255,183,77,0.15)',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.supplyText,
                      { color: isDark ? V1.amber : '#B8860B' },
                    ]}
                  >
                    {supply}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </Animated.View>
        )}

        {/* Detected Objects */}
        {analysisResult?.detectedObjects && analysisResult.detectedObjects.length > 0 && (
          <Animated.View
            entering={reducedMotion ? undefined : FadeInDown.delay(70).duration(400)}
            style={styles.objectsSection}
          >
            <Text style={styles.objectsTitle}>I spotted:</Text>
            <View style={styles.objectsGrid}>
              {(() => {
                const grouped = new Map<
                  string,
                  { name: string; category?: string; count: number }
                >();
                analysisResult.detectedObjects!.forEach((obj) => {
                  const key = obj.name.toLowerCase();
                  const existing = grouped.get(key);
                  if (existing) {
                    existing.count++;
                  } else {
                    grouped.set(key, { name: obj.name, category: obj.category, count: 1 });
                  }
                });
                return Array.from(grouped.values())
                  .slice(0, 12)
                  .map((obj, i) => (
                    <View
                      key={`obj-${i}`}
                      style={[
                        styles.objectPill,
                        {
                          backgroundColor: isDark
                            ? 'rgba(100,181,246,0.10)'
                            : 'rgba(100,181,246,0.08)',
                        },
                      ]}
                    >
                      <Text style={styles.objectEmoji}>{getCategoryEmoji(obj.category)}</Text>
                      <Text style={[styles.objectName, { color: t.text }]}>
                        {obj.count > 1 ? `${obj.count} ` : ''}
                        {obj.name}
                      </Text>
                    </View>
                  ));
              })()}
            </View>
          </Animated.View>
        )}

        {/* Error state */}
        {error && (
          <View style={styles.errorContainer}>
            <View style={styles.errorIconWrap}>
              <View style={styles.errorIconCircle}>
                <Text style={styles.errorIconText}>!</Text>
              </View>
            </View>
            <Text style={[styles.errorTitle, { color: t.text }]}>
              Let's try a different angle
            </Text>
            <Text style={[styles.errorDescription, { color: t.textSecondary }]}>
              Sometimes tricky lighting or angles make it hard to spot things. No worries -- let's
              give it another shot!
            </Text>
            {retryCount < maxRetries ? (
              <Pressable
                onPress={onRetry}
                style={({ pressed }) => [{ opacity: pressed ? 0.88 : 1, width: '100%' }]}
                accessibilityRole="button"
                accessibilityLabel="Re-analyze this photo"
              >
                <LinearGradient
                  colors={[V1.coral, '#FF5252']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.errorCTA}
                >
                  <View style={styles.errorCTARow}>
                    <RefreshCw size={18} color="#FFFFFF" />
                    <Text style={styles.errorCTAText}>Re-analyze</Text>
                  </View>
                </LinearGradient>
              </Pressable>
            ) : (
              <Pressable
                onPress={onRetakePhoto}
                style={({ pressed }) => [{ opacity: pressed ? 0.88 : 1, width: '100%' }]}
              >
                <LinearGradient
                  colors={[V1.coral, '#FF5252']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.errorCTA}
                >
                  <Text style={styles.errorCTAText}>Retake Photo</Text>
                </LinearGradient>
              </Pressable>
            )}
            <Pressable onPress={onUseFallback}>
              <Text style={styles.errorFallbackLink}>Use suggested tasks instead</Text>
            </Pressable>
            <Text style={[styles.errorFallbackHint, { color: t.textMuted }]}>
              We'll give you a starter task list for your room type
            </Text>
          </View>
        )}

        {/* Photo quality warning */}
        {analysisResult?.photoQualityWarning && (
          <Animated.View
            entering={reducedMotion ? undefined : FadeInDown.delay(80).duration(400)}
            style={styles.warningSection}
          >
            <View
              style={[
                styles.warningCard,
                {
                  backgroundColor: isDark
                    ? 'rgba(255,183,77,0.12)'
                    : 'rgba(255,183,77,0.10)',
                },
              ]}
            >
              <Text style={styles.warningIcon}>{'\uD83D\uDCF7'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.warningTitle}>Lower Confidence Analysis</Text>
                <Text style={[styles.warningText, { color: t.textSecondary }]}>
                  {analysisResult.photoQualityWarning}
                </Text>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Doom piles */}
        {analysisResult?.doomPiles && analysisResult.doomPiles.length > 0 && (
          <>
            <Animated.View
              entering={reducedMotion ? undefined : FadeInDown.delay(90).duration(400)}
              style={styles.doomHeader}
            >
              <Text style={styles.doomTitle}>
                Doom Piles ({analysisResult.doomPiles.length})
              </Text>
            </Animated.View>
            {analysisResult.doomPiles.map((pile, idx) => (
              <DoomPileCard
                key={`doom-${idx}`}
                doomPile={pile}
                index={idx}
                onStart={onCreateRoom}
                onSkip={() => {}}
              />
            ))}
          </>
        )}

        {/* Task clusters */}
        {analysisResult?.taskClusters && analysisResult.taskClusters.length > 0 && (
          <>
            <Animated.View
              entering={reducedMotion ? undefined : FadeInDown.delay(95).duration(400)}
              style={styles.clusterHeader}
            >
              <Text style={styles.clusterTitle}>
                {'\uD83D\uDD17'} Task Bundles -- Save Time
              </Text>
            </Animated.View>
            {analysisResult.taskClusters.slice(0, 2).map((cluster, idx) => (
              <Animated.View
                key={`cluster-${idx}`}
                entering={
                  reducedMotion ? undefined : FadeInDown.delay(100 + idx * 50).duration(400)
                }
                style={[
                  styles.clusterCard,
                  {
                    backgroundColor: isDark
                      ? 'rgba(52,211,153,0.08)'
                      : 'rgba(52,211,153,0.06)',
                  },
                ]}
              >
                <View style={styles.clusterRow}>
                  <Text style={styles.clusterLabel}>
                    {cluster.emoji || '\uD83D\uDD17'} {cluster.clusterLabel}
                  </Text>
                  <Text style={[styles.clusterTime, { color: t.textMuted }]}>
                    {cluster.combinedEstimatedMinutes} min
                  </Text>
                </View>
                <Text style={[styles.clusterRationale, { color: t.textSecondary }]}>
                  {cluster.rationale}
                </Text>
                {cluster.savingsMinutes > 0 && (
                  <Text style={styles.clusterSavings}>
                    {'\u26A1'} Saves ~{cluster.savingsMinutes} min vs doing separately
                  </Text>
                )}
              </Animated.View>
            ))}
          </>
        )}

        {/* Area cards */}
        {analysisResult?.areas.map((area, index) => (
          <Animated.View
            key={area.name}
            entering={
              reducedMotion ? undefined : FadeInDown.delay(100 + index * 60).duration(400)
            }
            style={styles.areaCardContainer}
          >
            <View style={[styles.areaCard, { backgroundColor: t.card, borderColor: t.border }]}>
              <View style={styles.areaCardHeader}>
                <Text style={[styles.areaName, { color: t.text }]}>{area.name}</Text>
                <View
                  style={[
                    styles.areaCountPill,
                    {
                      backgroundColor: isDark
                        ? 'rgba(255,255,255,0.08)'
                        : 'rgba(0,0,0,0.06)',
                    },
                  ]}
                >
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

        {/* ── Inline Task Customization ──────────────────────────── */}
        {analysisResult && allTasks.length > 0 && (
          <Animated.View
            entering={reducedMotion ? undefined : FadeInDown.delay(200).duration(400)}
            style={styles.customizeSection}
          >
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowCustomize(prev => !prev);
              }}
              style={styles.customizeToggle}
              accessibilityRole="button"
              accessibilityLabel={showCustomize ? 'Hide task customization' : 'Customize tasks'}
            >
              <Text style={[styles.customizeToggleText, { color: V1.coral }]}>
                {showCustomize ? 'Hide task list' : `Customize tasks (${selectedCount}/${allTasks.length})`}
              </Text>
            </Pressable>

            {showCustomize && (
              <View style={styles.customizeList}>
                {/* Summary */}
                <Text style={[styles.customizeSummary, { color: t.textSecondary }]}>
                  {selectedCount} task{selectedCount !== 1 ? 's' : ''} selected \u00B7 ~{selectedMinutes} min
                </Text>

                {/* Task groups by zone */}
                {groupedTasks.map(([zone, zoneTasks]) => {
                  const allSelected = zoneTasks.every(tk => selectedIds.has(tk.id));
                  return (
                    <View key={zone} style={styles.customizeGroup}>
                      <Pressable
                        onPress={() => toggleGroup(zoneTasks)}
                        style={styles.customizeGroupHeader}
                        accessibilityRole="button"
                        accessibilityLabel={`Toggle all tasks in ${zone}`}
                      >
                        <View style={[
                          styles.customizeGroupCheck,
                          allSelected
                            ? { backgroundColor: V1.green, borderColor: V1.green }
                            : { borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)' },
                        ]}>
                          {allSelected && <Check size={10} color="#FFFFFF" strokeWidth={3} />}
                        </View>
                        <Text style={[styles.customizeGroupName, { color: t.text }]}>{zone}</Text>
                        <Text style={[styles.customizeGroupCount, { color: t.textMuted }]}>
                          {zoneTasks.length}
                        </Text>
                      </Pressable>
                      {zoneTasks.map(task => {
                        const isSelected = selectedIds.has(task.id);
                        return (
                          <Pressable
                            key={task.id}
                            onPress={() => toggleTask(task.id)}
                            style={styles.customizeTaskRow}
                            accessibilityRole="checkbox"
                            accessibilityState={{ checked: isSelected }}
                          >
                            <View style={[
                              styles.customizeTaskCheck,
                              isSelected
                                ? { backgroundColor: V1.green, borderColor: V1.green }
                                : { borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' },
                            ]}>
                              {isSelected && <Check size={10} color="#FFFFFF" strokeWidth={3} />}
                            </View>
                            <Text
                              style={[styles.customizeTaskName, { color: isSelected ? t.text : t.textMuted }]}
                              numberOfLines={1}
                            >
                              {task.title}
                            </Text>
                            <Text style={[styles.customizeTaskTime, { color: t.textMuted }]}>
                              {task.estimatedMinutes || 3}m
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  );
                })}
              </View>
            )}
          </Animated.View>
        )}
      </ScrollView>

      {/* Bottom CTAs */}
      {analysisResult && (
        <View style={[styles.bottomCtas, { paddingBottom: bottomInset + 20, backgroundColor: t.bg }]}>
          {createError ? (
            <Pressable
              onPress={onCreateRoom}
              style={[
                styles.ctaButton,
                { backgroundColor: 'transparent', borderWidth: 1, borderColor: V1.coral },
              ]}
            >
              <Text style={[styles.ctaButtonText, { color: V1.coral }]}>{createError}</Text>
            </Pressable>
          ) : allTasks.length > 0 && onCreateRoomWithTasks ? (
            /* Enhanced CTAs when inline customization is available */
            <>
              <Pressable
                onPress={handleStartEasyWins}
                disabled={isCreating}
                accessibilityRole="button"
                accessibilityLabel="Start with easy wins"
                style={[
                  styles.ctaButton,
                  { backgroundColor: V1.coral, opacity: isCreating ? 0.6 : 1 },
                ]}
              >
                <Text style={styles.ctaButtonText}>
                  Start with Easy Wins
                </Text>
              </Pressable>
              <Pressable
                onPress={handleAddAllTasks}
                disabled={isCreating}
                accessibilityRole="button"
                accessibilityLabel={`Add ${showCustomize ? selectedCount : 'all'} tasks`}
                style={[
                  styles.ctaButtonSecondary,
                  { borderColor: t.border, opacity: isCreating ? 0.6 : 1 },
                ]}
              >
                <Text style={[styles.ctaButtonSecondaryText, { color: t.text }]}>
                  {showCustomize ? `Add ${selectedCount} task${selectedCount !== 1 ? 's' : ''}` : `Add all ${allTasks.length} tasks`}
                </Text>
              </Pressable>
            </>
          ) : (
            <Pressable
              onPress={onCreateRoom}
              disabled={isCreating}
              accessibilityRole="button"
              accessibilityHint="Double tap to create room and start cleaning"
              style={[
                styles.ctaButton,
                { backgroundColor: V1.coral, opacity: isCreating ? 0.6 : 1 },
              ]}
            >
              <Text style={styles.ctaButtonText}>
                Start Cleaning ({analysisResult.totalItems} tasks)
              </Text>
            </Pressable>
          )}
          <View style={styles.bottomSecondaryRow}>
            {retryCount < maxRetries ? (
              <Pressable
                onPress={onRetry}
                accessibilityRole="button"
                accessibilityLabel="Re-scan this photo"
              >
                <Text style={[styles.seeAllText, { color: t.textMuted }]}>
                  Not quite right? Re-scan
                </Text>
              </Pressable>
            ) : (
              <Pressable onPress={onRetakePhoto}>
                <Text style={[styles.seeAllText, { color: t.textSecondary }]}>Retake photo</Text>
              </Pressable>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  resultsTitle: {
    fontFamily: DISPLAY_FONT,
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
  // Time profile selector
  timeProfileSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  timeProfileTitle: {
    fontFamily: DISPLAY_FONT,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 10,
    textAlign: 'center',
  },
  timeProfileRow: {
    flexDirection: 'row',
    gap: 8,
  },
  timeProfileButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  timeProfileButtonText: {
    fontFamily: BODY_FONT,
    fontSize: 14,
    fontWeight: '700',
  },
  timeProfileTaskCount: {
    fontFamily: BODY_FONT,
    fontSize: 11,
    marginTop: 2,
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

  // Supply checklist
  supplySection: { marginBottom: 16 },
  supplyTitle: {
    paddingHorizontal: 20,
    fontSize: 13,
    fontWeight: '700',
    color: V1.amber,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  supplyScroll: { paddingHorizontal: 20, gap: 8 },
  supplyPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  supplyText: { fontSize: 13, fontWeight: '600' },

  // Detected objects
  objectsSection: { marginBottom: 16, paddingHorizontal: 20 },
  objectsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: V1.blue,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  objectsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  objectPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  objectEmoji: { fontSize: 14 },
  objectName: { fontSize: 12, fontWeight: '600' },

  // Error
  errorContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 32,
    gap: 12,
  },
  errorIconWrap: { marginBottom: 8 },
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
  errorIconText: { color: V1.coral, fontSize: 24, fontWeight: '700' },
  errorTitle: {
    fontFamily: DISPLAY_FONT,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  errorDescription: {
    fontFamily: BODY_FONT,
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
  errorCTARow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  errorCTAText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  errorFallbackLink: {
    color: V1.coral,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  errorFallbackHint: { fontSize: 12, textAlign: 'center' },

  // Photo quality warning
  warningSection: { marginHorizontal: 16, marginBottom: 12 },
  warningCard: {
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    gap: 10,
    borderLeftWidth: 3,
    borderLeftColor: V1.amber,
  },
  warningIcon: { fontSize: 16 },
  warningTitle: { fontSize: 13, fontWeight: '600', color: V1.amber, marginBottom: 2 },
  warningText: { fontSize: 12, lineHeight: 17 },

  // Doom piles
  doomHeader: { paddingHorizontal: 16, marginBottom: 8 },
  doomTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: V1.coral,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  // Clusters
  clusterHeader: { paddingHorizontal: 16, marginBottom: 8 },
  clusterTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: V1.green,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  clusterCard: {
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 14,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: V1.green,
  },
  clusterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  clusterLabel: { fontSize: 13, fontWeight: '700', color: V1.green },
  clusterTime: { fontSize: 11 },
  clusterRationale: { fontSize: 12 },
  clusterSavings: { fontSize: 11, color: V1.green, marginTop: 4 },

  // Area cards
  areaCardContainer: { paddingHorizontal: 20, marginBottom: 10 },
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
  areaName: { fontFamily: DISPLAY_FONT, fontSize: 16, fontWeight: '600' },
  areaCountPill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  areaCountText: { fontSize: 12, fontWeight: '500' },
  areaTasks: { fontFamily: BODY_FONT, fontSize: 14, lineHeight: 20 },

  // Inline task customization
  customizeSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  customizeToggle: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  customizeToggleText: {
    fontFamily: BODY_FONT,
    fontSize: 14,
    fontWeight: '600',
  },
  customizeList: {
    marginTop: 8,
    gap: 12,
  },
  customizeSummary: {
    fontFamily: BODY_FONT,
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 4,
  },
  customizeGroup: {
    gap: 2,
  },
  customizeGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  customizeGroupCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customizeGroupName: {
    fontFamily: DISPLAY_FONT,
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  customizeGroupCount: {
    fontFamily: BODY_FONT,
    fontSize: 12,
  },
  customizeTaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
    paddingLeft: 8,
  },
  customizeTaskCheck: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customizeTaskName: {
    fontFamily: BODY_FONT,
    fontSize: 14,
    flex: 1,
  },
  customizeTaskTime: {
    fontFamily: BODY_FONT,
    fontSize: 12,
  },

  // CTA button secondary
  ctaButtonSecondary: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 28,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  ctaButtonSecondaryText: {
    fontFamily: BODY_FONT,
    fontSize: 15,
    fontWeight: '600',
  },

  // Bottom CTAs
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
    fontFamily: BODY_FONT,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  seeAllText: {
    fontFamily: BODY_FONT,
    fontSize: 14,
    fontWeight: '600',
  },
  bottomSecondaryRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
  },
});
