/**
 * DetectionPhase -- AI detection overlay with bounding box rectangles
 * Shows the room photo with real zone overlays, scan animation, and summary CTA.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
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

// ── Types ───────────────────────────────────────────────────────────────────

export interface DetectedArea {
  name: string;
  taskCount: number;
  tasks: string[];
  color: string;
  boundingBox?: {
    x: number;      // percentage 0-100
    y: number;      // percentage 0-100
    width: number;  // percentage 0-100
    height: number; // percentage 0-100
  };
}

export interface DetectionPhaseProps {
  photoUri: string | null;
  areas: DetectedArea[];
  totalItems: number;
  reducedMotion: boolean;
  topInset: number;
  bottomInset: number;
  onBack: () => void;
  onContinue: () => void;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Parse a hex color like #FF6B6B into {r, g, b} */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return { r: r || 0, g: g || 0, b: b || 0 };
}

/** Generate a fallback grid of bounding boxes for zones that lack one */
function generateFallbackBoxes(
  count: number,
): Array<{ x: number; y: number; width: number; height: number }> {
  if (count === 0) return [];

  const cols = count <= 2 ? count : count <= 4 ? 2 : 3;
  const rows = Math.ceil(count / cols);
  const padding = 4;
  const cellW = (100 - padding * 2) / cols;
  const cellH = (100 - padding * 2) / rows;
  const inset = 3;

  const boxes: Array<{ x: number; y: number; width: number; height: number }> = [];
  for (let i = 0; i < count; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    boxes.push({
      x: padding + col * cellW + inset,
      y: padding + row * cellH + inset,
      width: cellW - inset * 2,
      height: cellH - inset * 2,
    });
  }
  return boxes;
}

// ── Scan Line ───────────────────────────────────────────────────────────────

function ScanLine({ reducedMotion, containerHeight }: { reducedMotion: boolean; containerHeight: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion || containerHeight === 0) return;
    progress.value = withRepeat(
      withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    return () => cancelAnimation(progress);
  }, [reducedMotion, containerHeight]);

  const lineStyle = useAnimatedStyle(() => ({
    position: 'absolute' as const,
    left: 0,
    right: 0,
    top: progress.value * containerHeight,
    height: 2,
    backgroundColor: 'rgba(255,107,107,0.5)',
    shadowColor: V1.coral,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 10,
    zIndex: 20,
  }));

  if (reducedMotion || containerHeight === 0) return null;
  return <Animated.View style={lineStyle} />;
}

// ── Corner Bracket ──────────────────────────────────────────────────────────

const BRACKET_SIZE = 10;
const BRACKET_THICKNESS = 2;

function CornerBracket({
  position,
  color,
}: {
  position: 'tl' | 'tr' | 'bl' | 'br';
  color: string;
}) {
  const isTop = position === 'tl' || position === 'tr';
  const isLeft = position === 'tl' || position === 'bl';

  return (
    <View
      style={[
        styles.cornerBracket,
        {
          [isTop ? 'top' : 'bottom']: -1,
          [isLeft ? 'left' : 'right']: -1,
          [isTop ? 'borderTopWidth' : 'borderBottomWidth']: BRACKET_THICKNESS,
          [isLeft ? 'borderLeftWidth' : 'borderRightWidth']: BRACKET_THICKNESS,
          borderColor: color,
        },
      ]}
    />
  );
}

// ── Zone Overlay ────────────────────────────────────────────────────────────

function ZoneOverlay({
  area,
  box,
  index,
  isHighestPriority,
  reducedMotion,
}: {
  area: DetectedArea;
  box: { x: number; y: number; width: number; height: number };
  index: number;
  isHighestPriority: boolean;
  reducedMotion: boolean;
}) {
  const rgb = hexToRgb(area.color);
  const fillColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.20)`;
  const borderColor = area.color;
  const borderWidth = isHighestPriority ? 2.5 : 2;

  return (
    <Animated.View
      entering={reducedMotion ? undefined : FadeIn.delay(index * 180 + 200).duration(400)}
      style={[
        styles.zoneOverlay,
        {
          left: `${box.x}%`,
          top: `${box.y}%`,
          width: `${box.width}%`,
          height: `${box.height}%`,
          backgroundColor: fillColor,
          borderColor,
          borderWidth,
        },
        isHighestPriority && {
          shadowColor: area.color,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.4,
          shadowRadius: 8,
        },
      ]}
    >
      {/* Corner brackets */}
      <CornerBracket position="tl" color={borderColor} />
      <CornerBracket position="tr" color={borderColor} />
      <CornerBracket position="bl" color={borderColor} />
      <CornerBracket position="br" color={borderColor} />

      {/* Label */}
      <View style={[styles.zoneLabel, { backgroundColor: area.color }]}>
        <Text style={styles.zoneLabelText} numberOfLines={1}>
          {area.name}
        </Text>
      </View>
    </Animated.View>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────

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
  // Track photo container height for scan line animation
  const [photoHeight, setPhotoHeight] = useState(0);
  const handlePhotoLayout = (e: LayoutChangeEvent) => {
    setPhotoHeight(e.nativeEvent.layout.height);
  };

  // Highest-priority zone = the one with the most tasks
  const highestPriorityIndex = useMemo(() => {
    if (areas.length === 0) return -1;
    let maxIdx = 0;
    let maxCount = areas[0]?.taskCount ?? 0;
    areas.forEach((a, i) => {
      if (a.taskCount > maxCount) {
        maxCount = a.taskCount;
        maxIdx = i;
      }
    });
    return maxIdx;
  }, [areas]);

  // Resolve bounding boxes: use provided ones or generate a fallback grid
  const areasWithBoxes = useMemo(() => {
    const areasNeedingBoxes = areas.filter((a) => !a.boundingBox);
    const fallbacks = generateFallbackBoxes(areasNeedingBoxes.length);
    let fallbackIdx = 0;

    return areas.map((area) => {
      if (area.boundingBox) {
        return { area, box: area.boundingBox };
      }
      const box = fallbacks[fallbackIdx] ?? { x: 10, y: 10, width: 30, height: 30 };
      fallbackIdx++;
      return { area, box };
    });
  }, [areas]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topInset + 8 }]}>
        <Pressable onPress={onBack} hitSlop={12}>
          <ChevronLeft size={24} color="#FFFFFF" />
        </Pressable>
        <Animated.Text
          entering={reducedMotion ? undefined : FadeIn.duration(400)}
          style={styles.headerTitle}
        >
          {totalItems} {totalItems === 1 ? 'Thing' : 'Things'} Detected
        </Animated.Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Photo with bounding box overlays */}
      <View style={styles.photoContainer} onLayout={handlePhotoLayout}>
        {photoUri && (
          <Image
            source={{ uri: photoUri }}
            style={styles.photo}
            contentFit="cover"
            placeholder={{ blurhash: 'LGF5]+Yk^6#M@-5c,1J5@[or[Q6.' }}
            cachePolicy="memory-disk"
          />
        )}

        {/* Dark scrim for contrast */}
        <View style={styles.darkOverlay} />

        {/* Scan line animation */}
        <ScanLine reducedMotion={reducedMotion} containerHeight={photoHeight} />

        {/* Zone bounding boxes */}
        {areasWithBoxes.map(({ area, box }, i) => (
          <ZoneOverlay
            key={area.name}
            area={area}
            box={box}
            index={i}
            isHighestPriority={i === highestPriorityIndex}
            reducedMotion={reducedMotion}
          />
        ))}
      </View>

      {/* Bottom summary */}
      <Animated.View
        entering={
          reducedMotion
            ? undefined
            : FadeIn.delay(areas.length * 180 + 400).duration(400)
        }
        style={styles.summary}
      >
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>
            {areas.length} {areas.length === 1 ? 'zone' : 'zones'} detected
          </Text>
          <Text style={styles.summaryCount}>
            {totalItems} {totalItems === 1 ? 'item' : 'items'} total
          </Text>
        </View>

        {/* Zone list pills */}
        <View style={styles.zonePills}>
          {areas.map((area) => {
            const rgb = hexToRgb(area.color);
            return (
              <View
                key={area.name}
                style={[
                  styles.zonePill,
                  { backgroundColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)` },
                ]}
              >
                <View style={[styles.zonePillDot, { backgroundColor: area.color }]} />
                <Text style={styles.zonePillText}>
                  {area.name} {'\u00B7'} {area.taskCount}
                </Text>
              </View>
            );
          })}
        </View>
      </Animated.View>

      {/* CTA */}
      <View style={[styles.cta, { paddingBottom: bottomInset + 20 }]}>
        <Pressable
          onPress={onContinue}
          accessibilityRole="button"
          accessibilityHint="Double tap to start tackling your tasks"
          style={styles.ctaButton}
        >
          <Text style={styles.ctaButtonText}>Let's do this</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0C0C0C',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontFamily: DISPLAY_FONT,
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },

  // Photo
  photoContainer: {
    flex: 1,
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    zIndex: 1,
  },

  // Zone overlay rectangles
  zoneOverlay: {
    position: 'absolute',
    zIndex: 10,
    borderRadius: 4,
  },
  zoneLabel: {
    position: 'absolute',
    top: -1,
    left: -1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    borderTopLeftRadius: 4,
    maxWidth: '100%',
  },
  zoneLabelText: {
    fontFamily: BODY_FONT,
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  // Corner brackets for tech/scan feel
  cornerBracket: {
    position: 'absolute',
    width: BRACKET_SIZE,
    height: BRACKET_SIZE,
    borderColor: 'transparent',
    zIndex: 11,
  },

  // Summary section
  summary: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryLabel: {
    fontFamily: DISPLAY_FONT,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  summaryCount: {
    fontFamily: BODY_FONT,
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    fontWeight: '500',
  },
  zonePills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  zonePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  zonePillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  zonePillText: {
    fontFamily: BODY_FONT,
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },

  // CTA button
  cta: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  ctaButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 28,
    alignItems: 'center',
    backgroundColor: V1.coral,
  },
  ctaButtonText: {
    fontFamily: BODY_FONT,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
