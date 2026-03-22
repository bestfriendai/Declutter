/**
 * RoomHeader — Hero section for Room Detail screen
 * Parallax photo header with gradient overlay, back button, freshness status, progress bar.
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft } from 'lucide-react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
  interpolate,
  Extrapolation,
  SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { V1, BODY_FONT, DISPLAY_FONT } from '@/constants/designTokens';
import { Room } from '@/types/declutter';

interface RoomHeaderProps {
  room: Room;
  progress: number;
  freshnessLabel: string;
  freshnessColor: string;
  scrollY?: SharedValue<number>;
  isDark: boolean;
  aiSummary?: string;
}

export function RoomHeader({
  room,
  progress,
  freshnessLabel,
  freshnessColor,
  scrollY,
  isDark,
  aiSummary,
}: RoomHeaderProps) {
  const insets = useSafeAreaInsets();
  const photoUri = room.photos?.[0]?.uri;
  const t = isDark ? V1.dark : V1.light;

  // Parallax effect on hero photo
  const heroStyle = useAnimatedStyle(() => {
    if (!scrollY) return {};
    const translateY = interpolate(
      scrollY.value,
      [-100, 0, 240],
      [-50, 0, 60],
      Extrapolation.CLAMP,
    );
    const scale = interpolate(
      scrollY.value,
      [-100, 0],
      [1.3, 1],
      Extrapolation.CLAMP,
    );
    return {
      transform: [{ translateY }, { scale }],
    };
  });

  // Animated progress bar
  const progressWidth = useSharedValue(0);
  React.useEffect(() => {
    progressWidth.value = withTiming(progress, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${Math.max(progressWidth.value, 3)}%`,
    backgroundColor: freshnessColor,
  }));

  return (
    <>
      <View style={styles.heroSection}>
        <Animated.View style={[StyleSheet.absoluteFillObject, scrollY ? heroStyle : undefined]}>
          {photoUri ? (
            <Image
              source={{ uri: photoUri }}
              style={StyleSheet.absoluteFillObject}
              contentFit="cover"
              placeholder={{ blurhash: 'LGF5]+Yk^6#M@-5c,1J5@[or[Q6.' }}
              cachePolicy="memory-disk"
              transition={300}
            />
          ) : (
            <Pressable
              style={[StyleSheet.absoluteFillObject, {
                backgroundColor: isDark ? '#1A1A1A' : '#E8E8E8',
                alignItems: 'center',
                justifyContent: 'center',
              }]}
              onPress={() => router.push('/camera')}
              accessibilityRole="button"
              accessibilityLabel="Take a photo of this room"
            >
              <Text style={{
                fontSize: 14, fontWeight: '500',
                color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.35)',
                fontFamily: BODY_FONT,
              }}>
                Take a photo of this room
              </Text>
            </Pressable>
          )}
        </Animated.View>
        <LinearGradient
          colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
          style={StyleSheet.absoluteFillObject}
        />
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          style={[styles.backButton, { top: insets.top + 8 }]}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ChevronLeft size={24} color="#FFFFFF" />
        </Pressable>
        <View style={[styles.statusPill, { top: insets.top + 8, backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <Text style={[styles.statusPillText, { color: freshnessColor }]}>
            {freshnessLabel}
          </Text>
        </View>
        <View style={styles.heroBottom}>
          <Text style={styles.heroRoomName}>{room.name}</Text>
          <View style={styles.heroProgressBar}>
            <Animated.View style={[styles.heroProgressFill, progressStyle]} />
          </View>
        </View>
      </View>

      {/* AI Summary */}
      {aiSummary && (
        <View style={{
          marginHorizontal: 20,
          marginTop: 12,
          padding: 14,
          borderRadius: 14,
          backgroundColor: isDark ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.06)',
          borderWidth: 1,
          borderColor: isDark ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.12)',
        }}>
          <Text style={{
            fontFamily: BODY_FONT, fontSize: 12, fontWeight: '700',
            color: V1.indigo, marginBottom: 6,
          }}>
            AI ANALYSIS
          </Text>
          <Text style={{
            fontFamily: BODY_FONT, fontSize: 13, lineHeight: 19,
            color: t.textSecondary,
          }}>
            {aiSummary}
          </Text>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  heroSection: {
    height: 240,
    position: 'relative',
    overflow: 'hidden',
  },
  backButton: {
    position: 'absolute',
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  statusPill: {
    position: 'absolute',
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: BODY_FONT,
  },
  heroBottom: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  heroRoomName: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 12,
    fontFamily: DISPLAY_FONT,
  },
  heroProgressBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  heroProgressFill: {
    height: 6,
    borderRadius: 3,
  },
});
