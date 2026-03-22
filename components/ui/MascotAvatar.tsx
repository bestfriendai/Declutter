/**
 * Declutterly -- MascotAvatar
 * Renders Dusty's illustration at any size, picking the right PNG
 * based on mood/activity. Used in headers, cards, and empty states.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { V1 } from '@/constants/designTokens';
import { getMascotImage, MascotImages, type MascotImageKey } from '@/constants/mascotImages';

interface MascotAvatarProps {
  /** Mood string from mascot state */
  mood?: string;
  /** Activity string from mascot state */
  activity?: string;
  /** Override with a specific image key */
  imageKey?: MascotImageKey;
  /** Pixel size (width & height) */
  size?: number;
  /** Whether to show the coral-tinted background circle */
  showBackground?: boolean;
  /** Border radius override (defaults to size/2 = circle) */
  borderRadius?: number;
}

export function MascotAvatar({
  mood = 'happy',
  activity = 'idle',
  imageKey,
  size = 60,
  showBackground = true,
  borderRadius,
}: MascotAvatarProps) {
  const source = imageKey ? MascotImages[imageKey] : getMascotImage(mood, activity);
  const radius = borderRadius ?? size / 2;

  return (
    <View
      style={[
        styles.container,
        showBackground && styles.backgroundCircle,
        {
          width: size,
          height: size,
          borderRadius: radius,
        },
      ]}
    >
      <Image
        source={source}
        style={{
          width: size * 0.85,
          height: size * 0.85,
        }}
        contentFit="contain"
        transition={200}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  backgroundCircle: {
    backgroundColor: V1.coral + '18',
  },
});

export default MascotAvatar;
