/**
 * DetectionPhase -- AI detection overlay with info pills
 */

import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import { ChevronLeft } from 'lucide-react-native';
import { V1, BODY_FONT, DISPLAY_FONT } from '@/constants/designTokens';

interface DetectedArea {
  name: string;
  taskCount: number;
  tasks: string[];
  color: string;
}

// ── Scan Line ───────────────────────────────────────────────────────────────

function ScanLine({ reducedMotion }: { reducedMotion: boolean }) {
  const translateY = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) return;
    translateY.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    return () => cancelAnimation(translateY);
  }, [reducedMotion]);

  const lineStyle = useAnimatedStyle(() => ({
    position: 'absolute' as const,
    left: 0,
    right: 0,
    top: `${translateY.value * 100}%`,
    height: 2,
    backgroundColor: 'rgba(255,107,107,0.6)',
    shadowColor: V1.coral,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  }));

  if (reducedMotion) return null;
  return <Animated.View style={lineStyle} />;
}

// ── Position helper ─────────────────────────────────────────────────────────

const PILL_POSITIONS = [
  { top: '8%', left: '5%' },
  { top: '12%', right: '5%' },
  { top: '45%', left: '8%' },
  { top: '65%', right: '6%' },
  { top: '80%', left: '10%' },
];

function getPillPosition(i: number) {
  return PILL_POSITIONS[i] || PILL_POSITIONS[PILL_POSITIONS.length - 1];
}

// ── Props ───────────────────────────────────────────────────────────────────

interface DetectionPhaseProps {
  photoUri: string | null;
  areas: DetectedArea[];
  totalItems: number;
  reducedMotion: boolean;
  topInset: number;
  bottomInset: number;
  onBack: () => void;
  onContinue: () => void;
}

export function DetectionPhase({
  photoUri,
  areas,
  totalItems,
  reducedMotion,
  topInset,
  bottomInset,
  onBack,
  onContinue,
}: DetectionPhaseProps) {
  const displayAreas = areas.slice(0, 5);
  const extraCount = areas.length - 5;

  return (
    <View style={[styles.container, { backgroundColor: '#0C0C0C' }]}>
      {/* Header */}
      <View style={[styles.detectionHeader, { paddingTop: topInset + 8 }]}>
        <Pressable onPress={onBack} hitSlop={12}>
          <ChevronLeft size={24} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.detectionTitle}>AI Found {totalItems} Items</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Photo with info overlay pills */}
      <View style={styles.detectionPhotoContainer}>
        {photoUri && (
          <Image
            source={{ uri: photoUri }}
            style={styles.detectionPhoto}
            contentFit="cover"
            placeholder={{ blurhash: 'LGF5]+Yk^6#M@-5c,1J5@[or[Q6.' }}
            cachePolicy="memory-disk"
          />
        )}

        <ScanLine reducedMotion={reducedMotion} />

        {displayAreas.map((area, i) => (
          <Animated.View
            key={area.name}
            entering={reducedMotion ? undefined : FadeIn.delay(i * 150).duration(350)}
            style={[styles.infoPill, getPillPosition(i) as unknown as Record<string, string>]}
          >
            <View style={[styles.infoPillInner, { backgroundColor: area.color }]}>
              <Text style={styles.infoPillText}>{area.name}</Text>
              <Text style={styles.infoPillCount}>{area.taskCount}</Text>
            </View>
          </Animated.View>
        ))}

        {extraCount > 0 && (
          <Animated.View
            entering={
              reducedMotion
                ? undefined
                : FadeIn.delay(displayAreas.length * 150).duration(350)
            }
            style={[styles.infoPill, { bottom: '6%', right: '5%' }]}
          >
            <View
              style={[styles.infoPillInner, { backgroundColor: 'rgba(255,255,255,0.25)' }]}
            >
              <Text style={styles.infoPillText}>+{extraCount} more</Text>
            </View>
          </Animated.View>
        )}
      </View>

      {/* Detection summary */}
      <View style={styles.detectionSummary}>
        <Text style={styles.detectionSummaryTitle}>
          {areas.length} areas detected
        </Text>
        <View style={styles.detectionPills}>
          {areas.map((area) => (
            <View
              key={area.name}
              style={[styles.detectionPill, { backgroundColor: area.color }]}
            >
              <Text style={styles.detectionPillText}>
                {area.name} {'\u00B7'} {area.taskCount} tasks
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* CTA */}
      <View style={[styles.detectionCta, { paddingBottom: bottomInset + 20 }]}>
        <Pressable
          onPress={onContinue}
          accessibilityRole="button"
          accessibilityHint="Double tap to view your task breakdown"
          style={[styles.ctaButton, { backgroundColor: V1.coral }]}
        >
          <Text style={styles.ctaButtonText}>See Task Breakdown</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  detectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  detectionTitle: {
    fontFamily: DISPLAY_FONT,
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
  infoPill: {
    position: 'absolute',
    zIndex: 5,
  },
  infoPillInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  infoPillText: {
    fontFamily: BODY_FONT,
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  infoPillCount: {
    fontFamily: BODY_FONT,
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
    fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
    overflow: 'hidden',
  },
  detectionSummary: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  detectionSummaryTitle: {
    fontFamily: DISPLAY_FONT,
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
    fontFamily: BODY_FONT,
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  detectionCta: {
    paddingHorizontal: 20,
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
});
