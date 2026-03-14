import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

type AmbientVariant = 'home' | 'progress' | 'profile' | 'onboarding' | 'auth' | 'settings';

interface AmbientBackdropProps {
  isDark: boolean;
  variant: AmbientVariant;
}

type Orb = {
  size: number;
  top?: number;
  left?: number;
  right?: number;
  bottom?: number;
  colors: readonly [string, string, string];
};

function getOrbs(isDark: boolean, variant: AmbientVariant): Orb[] {
  if (variant === 'home') {
    return isDark
      ? [
          { size: 230, top: -78, right: -72, colors: ['rgba(255,188,117,0.14)', 'rgba(255,120,70,0.06)', 'rgba(255,120,70,0)'] as const },
          { size: 210, top: 132, left: -122, colors: ['rgba(106,126,255,0.10)', 'rgba(74,93,210,0.04)', 'rgba(74,93,210,0)'] as const },
          { size: 170, bottom: 150, right: -70, colors: ['rgba(80,201,172,0.07)', 'rgba(80,201,172,0.03)', 'rgba(80,201,172,0)'] as const },
        ]
      : [
          { size: 240, top: -92, right: -66, colors: ['rgba(255,196,133,0.22)', 'rgba(255,156,96,0.08)', 'rgba(255,156,96,0)'] as const },
          { size: 210, top: 130, left: -116, colors: ['rgba(123,149,255,0.12)', 'rgba(123,149,255,0.05)', 'rgba(123,149,255,0)'] as const },
          { size: 180, bottom: 126, right: -76, colors: ['rgba(101,191,164,0.10)', 'rgba(101,191,164,0.04)', 'rgba(101,191,164,0)'] as const },
        ];
  }

  if (variant === 'progress') {
    return isDark
      ? [
          { size: 240, top: -92, left: -92, colors: ['rgba(111,129,255,0.14)', 'rgba(85,101,220,0.06)', 'rgba(85,101,220,0)'] as const },
          { size: 190, top: 200, right: -84, colors: ['rgba(255,194,99,0.08)', 'rgba(255,161,87,0.03)', 'rgba(255,161,87,0)'] as const },
          { size: 190, bottom: 84, left: -10, colors: ['rgba(121,225,214,0.08)', 'rgba(121,225,214,0.03)', 'rgba(121,225,214,0)'] as const },
        ]
      : [
          { size: 240, top: -92, left: -92, colors: ['rgba(121,146,255,0.14)', 'rgba(121,146,255,0.05)', 'rgba(121,146,255,0)'] as const },
          { size: 200, top: 198, right: -86, colors: ['rgba(255,199,123,0.10)', 'rgba(255,171,97,0.04)', 'rgba(255,171,97,0)'] as const },
          { size: 190, bottom: 86, left: -6, colors: ['rgba(121,216,204,0.10)', 'rgba(121,216,204,0.04)', 'rgba(121,216,204,0)'] as const },
        ];
  }

  if (variant === 'profile') {
    return isDark
      ? [
          { size: 210, top: -74, left: -82, colors: ['rgba(255,197,141,0.12)', 'rgba(255,156,101,0.05)', 'rgba(255,156,101,0)'] as const },
          { size: 200, top: 150, right: -88, colors: ['rgba(129,145,255,0.10)', 'rgba(129,145,255,0.04)', 'rgba(129,145,255,0)'] as const },
          { size: 170, bottom: 90, left: 10, colors: ['rgba(121,225,214,0.08)', 'rgba(121,225,214,0.03)', 'rgba(121,225,214,0)'] as const },
        ]
      : [
          { size: 220, top: -76, left: -80, colors: ['rgba(255,215,178,0.18)', 'rgba(255,173,124,0.07)', 'rgba(255,173,124,0)'] as const },
          { size: 205, top: 150, right: -88, colors: ['rgba(174,184,255,0.12)', 'rgba(174,184,255,0.05)', 'rgba(174,184,255,0)'] as const },
          { size: 178, bottom: 90, left: 8, colors: ['rgba(176,234,223,0.10)', 'rgba(176,234,223,0.04)', 'rgba(176,234,223,0)'] as const },
        ];
  }

  if (variant === 'onboarding') {
    return isDark
      ? [
          { size: 320, top: -120, right: -70, colors: ['rgba(255,188,117,0.22)', 'rgba(255,120,82,0.10)', 'rgba(255,120,82,0)'] as const },
          { size: 280, top: 150, left: -110, colors: ['rgba(112,129,255,0.20)', 'rgba(85,101,220,0.08)', 'rgba(85,101,220,0)'] as const },
          { size: 220, bottom: 140, right: 10, colors: ['rgba(103,221,188,0.14)', 'rgba(103,221,188,0.05)', 'rgba(103,221,188,0)'] as const },
        ]
      : [
          { size: 320, top: -120, right: -70, colors: ['rgba(255,208,154,0.34)', 'rgba(255,165,111,0.16)', 'rgba(255,165,111,0)'] as const },
          { size: 280, top: 150, left: -110, colors: ['rgba(140,159,255,0.24)', 'rgba(123,142,255,0.10)', 'rgba(123,142,255,0)'] as const },
          { size: 220, bottom: 140, right: 10, colors: ['rgba(142,229,207,0.20)', 'rgba(142,229,207,0.08)', 'rgba(142,229,207,0)'] as const },
        ];
  }

  if (variant === 'auth') {
    return isDark
      ? [
          { size: 300, top: -100, left: -80, colors: ['rgba(255,175,118,0.18)', 'rgba(255,120,79,0.08)', 'rgba(255,120,79,0)'] as const },
          { size: 260, top: 180, right: -70, colors: ['rgba(120,136,255,0.18)', 'rgba(120,136,255,0.08)', 'rgba(120,136,255,0)'] as const },
          { size: 220, bottom: 80, left: 20, colors: ['rgba(121,225,214,0.10)', 'rgba(121,225,214,0.04)', 'rgba(121,225,214,0)'] as const },
        ]
      : [
          { size: 300, top: -100, left: -80, colors: ['rgba(255,212,168,0.30)', 'rgba(255,177,128,0.14)', 'rgba(255,177,128,0)'] as const },
          { size: 260, top: 180, right: -70, colors: ['rgba(166,178,255,0.22)', 'rgba(166,178,255,0.10)', 'rgba(166,178,255,0)'] as const },
          { size: 220, bottom: 80, left: 20, colors: ['rgba(173,234,223,0.16)', 'rgba(173,234,223,0.06)', 'rgba(173,234,223,0)'] as const },
        ];
  }

  if (variant === 'settings') {
    return isDark
      ? [
          { size: 280, top: -80, right: -70, colors: ['rgba(255,188,117,0.16)', 'rgba(255,188,117,0.06)', 'rgba(255,188,117,0)'] as const },
          { size: 240, top: 220, left: -90, colors: ['rgba(150,135,255,0.14)', 'rgba(150,135,255,0.06)', 'rgba(150,135,255,0)'] as const },
          { size: 200, bottom: 90, right: 20, colors: ['rgba(119,220,200,0.10)', 'rgba(119,220,200,0.04)', 'rgba(119,220,200,0)'] as const },
        ]
      : [
          { size: 280, top: -80, right: -70, colors: ['rgba(255,221,183,0.28)', 'rgba(255,198,149,0.12)', 'rgba(255,198,149,0)'] as const },
          { size: 240, top: 220, left: -90, colors: ['rgba(188,178,255,0.18)', 'rgba(188,178,255,0.08)', 'rgba(188,178,255,0)'] as const },
          { size: 200, bottom: 90, right: 20, colors: ['rgba(173,234,223,0.15)', 'rgba(173,234,223,0.06)', 'rgba(173,234,223,0)'] as const },
        ];
  }

  return isDark
    ? [
        { size: 300, top: -110, right: -70, colors: ['rgba(199,167,110,0.20)', 'rgba(199,167,110,0.08)', 'rgba(199,167,110,0)'] as const },
        { size: 250, top: 160, left: -90, colors: ['rgba(153,120,255,0.16)', 'rgba(153,120,255,0.06)', 'rgba(153,120,255,0)'] as const },
        { size: 220, bottom: 140, right: 10, colors: ['rgba(255,122,122,0.10)', 'rgba(255,122,122,0.04)', 'rgba(255,122,122,0)'] as const },
      ]
    : [
        { size: 300, top: -110, right: -70, colors: ['rgba(209,181,126,0.26)', 'rgba(209,181,126,0.11)', 'rgba(209,181,126,0)'] as const },
        { size: 250, top: 160, left: -90, colors: ['rgba(166,138,255,0.18)', 'rgba(166,138,255,0.08)', 'rgba(166,138,255,0)'] as const },
        { size: 220, bottom: 140, right: 10, colors: ['rgba(255,144,144,0.13)', 'rgba(255,144,144,0.05)', 'rgba(255,144,144,0)'] as const },
      ];
}

export function AmbientBackdrop({ isDark, variant }: AmbientBackdropProps) {
  const baseOverlay = isDark ? 'rgba(8,8,12,0.26)' : 'rgba(255,255,255,0.12)';
  const orbs = getOrbs(isDark, variant);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {orbs.map((orb, index) => (
        <LinearGradient
          key={`${variant}-${index}`}
          colors={orb.colors}
          style={[
            styles.orb,
            {
              width: orb.size,
              height: orb.size,
              borderRadius: orb.size / 2,
              top: orb.top,
              left: orb.left,
              right: orb.right,
              bottom: orb.bottom,
            },
          ]}
          start={{ x: 0.15, y: 0.15 }}
          end={{ x: 0.85, y: 0.85 }}
        />
      ))}
      <LinearGradient
        colors={[baseOverlay, 'transparent']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.7 }}
        style={styles.topFade}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  orb: {
    position: 'absolute',
  },
  topFade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 280,
  },
});

export default AmbientBackdrop;
