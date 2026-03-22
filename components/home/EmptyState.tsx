/**
 * EmptyState -- Empty state with mascot and scan CTA
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { MascotAvatar } from '@/components/ui/MascotAvatar';
import { V1, BODY_FONT, DISPLAY_FONT, RADIUS, SPACING } from '@/constants/designTokens';
import { HomeHeader } from './HomeHeader';

interface EmptyStateProps {
  userName: string;
  isDark: boolean;
  reducedMotion: boolean;
  onScanRoom: () => void;
}

export function EmptyState({ userName, isDark, reducedMotion, onScanRoom }: EmptyStateProps) {
  const t = isDark ? V1.dark : V1.light;

  return (
    <>
      {/* Header without populated-state mascot tap */}
      <Animated.View entering={reducedMotion ? undefined : FadeInDown.duration(400)} style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: t.text }]}>Breathe in, {userName}</Text>
          <Text style={[styles.timeContext, { color: t.textSecondary }]}>
            {getTimeContext()}
          </Text>
        </View>
        <MascotAvatar mood="happy" activity="idle" size={44} imageKey="waving" />
      </Animated.View>

      {/* Mascot illustration */}
      <Animated.View
        entering={reducedMotion ? undefined : FadeInDown.delay(100).duration(400)}
        style={styles.emptyStateCenter}
      >
        <View style={{ marginBottom: 28 }}>
          <MascotAvatar mood="happy" activity="idle" size={160} imageKey="welcome" showBackground />
        </View>

        <Text style={[styles.emptyTitle, { color: t.text }]}>
          Let's scan your first room!
        </Text>
        <Text style={[styles.emptySubtitle, { color: t.textSecondary }]}>
          Take a photo of any room and Dusty will help you break it down into small, doable tasks.
        </Text>

        <Pressable
          onPress={onScanRoom}
          accessibilityRole="button"
          accessibilityLabel="Scan a Room"
          accessibilityHint="Double tap to open camera"
          style={({ pressed }) => [styles.scanCtaWrapper, { opacity: pressed ? 0.88 : 1 }]}
        >
          <LinearGradient
            colors={['#FF6B6B', '#FF5252']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.scanCta, styles.scanCtaShadow]}
          >
            <Text style={styles.scanCtaText}>Scan a Room</Text>
          </LinearGradient>
        </Pressable>
      </Animated.View>

      {/* Tip card */}
      <Animated.View
        entering={reducedMotion ? undefined : FadeInDown.delay(200).duration(400)}
        style={styles.tipCardWrapper}
      >
        <View
          style={[
            styles.tipCard,
            {
              backgroundColor: isDark ? 'rgba(255,107,107,0.08)' : 'rgba(255,107,107,0.06)',
              borderColor: isDark ? 'rgba(255,107,107,0.15)' : 'rgba(255,107,107,0.1)',
            },
          ]}
        >
          <Text style={styles.tipBulb}>{'\uD83D\uDCA1'}</Text>
          <Text style={[styles.tipText, { color: V1.coral }]}>
            Tip: Start with the room that bugs you most
          </Text>
        </View>
      </Animated.View>
    </>
  );
}

function getTimeContext(): string {
  const now = new Date();
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const day = days[now.getDay()];
  const hour = now.getHours();
  let timeOfDay = 'morning';
  if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
  else if (hour >= 17) timeOfDay = 'evening';
  return `${day} ${timeOfDay}`;
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '700',
    fontFamily: DISPLAY_FONT,
    letterSpacing: -0.4,
  },
  timeContext: {
    fontSize: 14,
    fontWeight: '400',
    fontFamily: BODY_FONT,
    marginTop: 2,
  },
  emptyStateCenter: {
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: SPACING.screenPadding,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    fontFamily: DISPLAY_FONT,
    textAlign: 'center',
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 15,
    fontFamily: BODY_FONT,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  scanCtaWrapper: {
    width: '100%',
  },
  scanCta: {
    paddingVertical: 16,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
  },
  scanCtaShadow: {
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  scanCtaText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: BODY_FONT,
  },
  tipCardWrapper: {
    marginTop: 24,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: SPACING.cardPadding,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  tipBulb: {
    fontSize: 18,
  },
  tipText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: BODY_FONT,
    flex: 1,
  },
});
