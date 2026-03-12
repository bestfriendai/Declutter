import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { ZoomIn, FadeInDown, FadeOut } from 'react-native-reanimated';
import { ColorTokens } from '@/constants/Colors';
import { Typography } from '@/theme/typography';
import { Spacing } from '@/theme/spacing';

interface MilestoneParticlesProps {
  milestone: number;
  colors: ColorTokens;
}

export default function MilestoneParticles({
  milestone,
  colors,
}: MilestoneParticlesProps) {
  const particles = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      id: i,
      angle: (i * 30) * (Math.PI / 180),
      delay: i * 30,
    }));
  }, []);

  const milestoneColors: Record<number, string> = {
    25: colors.success,
    50: colors.accent,
    75: '#BF5AF2',  // iOS system purple (dark)
    100: colors.warning,
  };

  const milestoneEmojis: Record<number, string> = {
    25: '\u{1F331}',
    50: '\u2B50',
    75: '\u{1F525}',
    100: '\u{1F389}',
  };

  return (
    <View style={styles.container}>
      <Animated.View
        entering={ZoomIn.springify()}
        style={[styles.badge, { backgroundColor: milestoneColors[milestone] }]}
      >
        <Text style={styles.badgeEmoji}>{milestoneEmojis[milestone]}</Text>
        <Text style={styles.badgeText}>{milestone}%</Text>
      </Animated.View>

      {particles.map((particle) => (
        <Animated.View
          key={particle.id}
          entering={FadeInDown.delay(particle.delay).springify()}
          exiting={FadeOut.delay(1000 + particle.delay)}
          style={[
            styles.particle,
            {
              backgroundColor: milestoneColors[milestone],
              transform: [
                { translateX: Math.cos(particle.angle) * 50 },
                { translateY: Math.sin(particle.angle) * 50 },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xxs,
    zIndex: 10,
  },
  badgeEmoji: {
    fontSize: 14,
  },
  badgeText: {
    ...Typography.caption1Medium,
    color: '#FFFFFF',
  },
  particle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
