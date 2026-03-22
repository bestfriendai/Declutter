/**
 * ScanningPhase -- Scanning animation with rotating encouraging messages
 * Includes cancel/back button, progress bar, and encouraging messages.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import { ChevronLeft, Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { V1, BODY_FONT, DISPLAY_FONT } from '@/constants/designTokens';

// ── Scanning steps ──────────────────────────────────────────────────────────
const SCAN_STEPS = [
  { label: 'Scanning your space', done: false },
  { label: 'Spotting areas to tidy', done: false },
  { label: 'Building your task list', done: false },
];

// ── Rotating encouraging messages ───────────────────────────────────────────
const ENCOURAGING_MESSAGES = [
  'No judgment here...',
  'Every room has potential',
  'Just finding where to start',
  'Your space, your pace',
  'Small steps, big difference',
  'You are already doing great by starting',
];

// ── Simulated progress bar ──────────────────────────────────────────────────

interface ProgressBarProps {
  scanStep: number;
  reducedMotion: boolean;
}

function ProgressBar({ scanStep, reducedMotion }: ProgressBarProps) {
  const progressWidth = useSharedValue(0);

  useEffect(() => {
    // Fast to 60%, slow to 90%, then wait
    if (scanStep === 0) {
      progressWidth.value = withTiming(30, { duration: 2000 });
    } else if (scanStep === 1) {
      progressWidth.value = withTiming(60, { duration: 1500 });
    } else if (scanStep === 2) {
      progressWidth.value = withTiming(90, { duration: 3000 });
    }
  }, [scanStep]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  return (
    <View style={styles.progressBarContainer}>
      <Animated.View style={[styles.progressBarFill, barStyle]} />
    </View>
  );
}

// ── Props ───────────────────────────────────────────────────────────────────

interface ScanningPhaseProps {
  photoUri: string | null;
  scanStep: number;
  reducedMotion: boolean;
  topInset: number;
  pulseStyle: any;
  onBack: () => void;
  isOffline?: boolean;
  onUseFallback?: () => void;
}

export function ScanningPhase({
  photoUri,
  scanStep,
  reducedMotion,
  topInset,
  pulseStyle,
  onBack,
  isOffline = false,
  onUseFallback,
}: ScanningPhaseProps) {
  // Rotating encouragement messages
  const [messageIndex, setMessageIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % ENCOURAGING_MESSAGES.length);
    }, 3000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: '#0C0C0C' }]}>
      {/* Back/cancel button */}
      <View style={[styles.cancelHeader, { paddingTop: topInset + 8 }]}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onBack();
          }}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Cancel scanning"
        >
          <ChevronLeft size={24} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.cancelText}>Cancel</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Photo with scanning effect */}
      <View style={styles.scanPhotoContainer}>
        {photoUri && (
          <Animated.View style={[styles.scanPhotoWrapper, pulseStyle]}>
            <Image
              source={{ uri: photoUri }}
              style={styles.scanPhoto}
              contentFit="cover"
              placeholder={{ blurhash: 'LGF5]+Yk^6#M@-5c,1J5@[or[Q6.' }}
              cachePolicy="memory-disk"
            />
            {/* Corner brackets (coral) */}
            <View style={[styles.scanBracket, styles.scanBracketTL]} />
            <View style={[styles.scanBracket, styles.scanBracketTR]} />
            <View style={[styles.scanBracket, styles.scanBracketBL]} />
            <View style={[styles.scanBracket, styles.scanBracketBR]} />
          </Animated.View>
        )}
      </View>

      {/* Offline fallback */}
      {isOffline && onUseFallback && (
        <View style={styles.offlineSection}>
          <Text style={styles.offlineTitle}>You're offline</Text>
          <Text style={styles.offlineSubtitle}>
            AI scanning needs an internet connection, but you can still get started with suggested tasks.
          </Text>
          <Pressable
            onPress={onUseFallback}
            style={styles.offlineCta}
            accessibilityRole="button"
            accessibilityLabel="Use suggested tasks"
          >
            <Text style={styles.offlineCtaText}>Use Suggested Tasks</Text>
          </Pressable>
        </View>
      )}

      {/* Scanning text */}
      <View style={styles.scanTextSection}>
        <Text style={styles.scanTitle}>
          {isOffline ? 'Waiting for connection...' : 'Taking a calm look...'}
        </Text>
        <Text style={styles.scanSubtitle}>
          {isOffline ? 'Connect to Wi-Fi or cellular to scan' : ENCOURAGING_MESSAGES[messageIndex]}
        </Text>

        {/* Progress bar */}
        <ProgressBar scanStep={scanStep} reducedMotion={reducedMotion} />

        {/* Steps */}
        <View
          style={styles.scanSteps}
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 0, max: SCAN_STEPS.length, now: scanStep }}
        >
          {SCAN_STEPS.map((step, i) => (
            <View key={i} style={styles.scanStepRow}>
              <View
                style={[
                  styles.scanStepDot,
                  i < scanStep
                    ? { backgroundColor: V1.green }
                    : i === scanStep
                      ? { backgroundColor: V1.coral, borderWidth: 0 }
                      : {
                          borderColor: 'rgba(255,255,255,0.2)',
                          borderWidth: 1.5,
                          backgroundColor: 'transparent',
                        },
                ]}
              >
                {i < scanStep && <Check size={10} color="#FFFFFF" strokeWidth={3} />}
              </View>
              <Text
                style={[
                  styles.scanStepText,
                  { color: i <= scanStep ? '#FFFFFF' : 'rgba(255,255,255,0.3)' },
                ]}
              >
                {step.label}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  cancelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  cancelText: {
    fontFamily: BODY_FONT,
    color: 'rgba(255,255,255,0.6)',
    fontSize: 15,
    fontWeight: '500',
  },
  scanPhotoContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
  },
  scanPhotoWrapper: {
    width: '70%',
    aspectRatio: 1,
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
    fontFamily: DISPLAY_FONT,
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  scanSubtitle: {
    fontFamily: BODY_FONT,
    color: 'rgba(255,255,255,0.5)',
    fontSize: 15,
    fontStyle: 'italic',
    marginBottom: 20,
    minHeight: 22,
  },
  progressBarContainer: {
    width: '80%',
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginBottom: 24,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 4,
    borderRadius: 2,
    backgroundColor: V1.coral,
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
    fontFamily: BODY_FONT,
    fontSize: 15,
    fontWeight: '500',
  },

  // Offline fallback
  offlineSection: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 16,
    gap: 12,
  },
  offlineTitle: {
    fontFamily: DISPLAY_FONT,
    color: V1.amber,
    fontSize: 18,
    fontWeight: '700',
  },
  offlineSubtitle: {
    fontFamily: BODY_FONT,
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  offlineCta: {
    backgroundColor: V1.amber,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 24,
    marginTop: 4,
  },
  offlineCtaText: {
    fontFamily: BODY_FONT,
    color: '#333333',
    fontSize: 15,
    fontWeight: '700',
  },
});
