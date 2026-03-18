import React from 'react';
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Lock, AlertCircle, Trophy, Scan, Camera, HelpCircle } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';

const BODY_FONT = 'DM Sans';
const DISPLAY_FONT = 'Bricolage Grotesque';

const ICON_MAP: Record<string, LucideIcon> = {
  'lock-closed-outline': Lock,
  'alert-circle-outline': AlertCircle,
  'trophy-outline': Trophy,
  'scan-outline': Scan,
  'camera-outline': Camera,
};

interface ExpressiveStateViewProps {
  isDark: boolean;
  title: string;
  description: string;
  kicker?: string;
  emoji?: string;
  icon?: string;
  primaryLabel?: string;
  onPrimary?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  accentColors?: readonly [string, string, string];
  style?: StyleProp<ViewStyle>;
}

export function ExpressiveStateView({
  isDark,
  title,
  description,
  kicker,
  emoji,
  icon,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
  accentColors,
  style,
}: ExpressiveStateViewProps) {
  const gradient = accentColors ?? (
    isDark
      ? (['#D9C9A8', '#C4A87A', '#A8895C'] as const)
      : (['#D4BD96', '#C4A87A', '#9E8260'] as const)
  );

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? 'rgba(22,22,28,0.92)' : 'rgba(255,255,255,0.88)',
          borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(55,40,26,0.08)',
        },
        style,
      ]}
    >
      <View
        style={[
          styles.glow,
          { backgroundColor: isDark ? 'rgba(255,184,111,0.18)' : 'rgba(255,203,158,0.34)' },
        ]}
      />
      <LinearGradient
        colors={[
          isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.82)',
          'rgba(255,255,255,0)',
        ]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={styles.sheen}
      />

      {(emoji || icon) ? (
        <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.iconChip}>
          {emoji ? (
            <Text style={styles.emoji}>{emoji}</Text>
          ) : (
            React.createElement(ICON_MAP[icon!] ?? HelpCircle, { size: 24, color: '#17120B' })
          )}
        </LinearGradient>
      ) : null}

      {kicker ? (
        <Text style={[styles.kicker, { color: isDark ? '#F9DFC1' : '#8A5A29' }]}>
          {kicker}
        </Text>
      ) : null}

      <Text style={[styles.title, { color: isDark ? '#FFF8EF' : '#1A1A1A' }]}>
        {title}
      </Text>
      <Text style={[styles.description, { color: isDark ? 'rgba(255,255,255,0.58)' : 'rgba(23,23,26,0.56)' }]}>
        {description}
      </Text>

      {primaryLabel ? (
        <Pressable onPress={onPrimary} style={({ pressed }) => [{ opacity: pressed ? 0.88 : 1 }]}>
          <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>{primaryLabel}</Text>
          </LinearGradient>
        </Pressable>
      ) : null}

      {secondaryLabel ? (
        <Pressable
          onPress={onSecondary}
          style={[
            styles.secondaryButton,
            {
              borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(55,40,26,0.08)',
              backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.74)',
            },
          ]}
        >
          <Text style={[styles.secondaryButtonText, { color: isDark ? '#F5ECE2' : '#4C4036' }]}>
            {secondaryLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    borderWidth: 1,
    borderRadius: 28,
    paddingHorizontal: 22,
    paddingVertical: 24,
    alignItems: 'center',
  },
  glow: {
    position: 'absolute',
    top: -30,
    right: -20,
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  sheen: {
    ...StyleSheet.absoluteFillObject,
  },
  iconChip: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emoji: {
    fontSize: 30,
  },
  kicker: {
    fontFamily: BODY_FONT,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.4,
    marginBottom: 8,
    textAlign: 'center',
  },
  title: {
    fontFamily: DISPLAY_FONT,
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '700',
    letterSpacing: -0.6,
    textAlign: 'center',
  },
  description: {
    fontFamily: BODY_FONT,
    marginTop: 10,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  primaryButton: {
    minHeight: 56,
    borderRadius: 999,
    paddingHorizontal: 24,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    minWidth: 190,
  },
  primaryButtonText: {
    fontFamily: BODY_FONT,
    color: '#17120B',
    fontSize: 16,
    fontWeight: '800',
  },
  secondaryButton: {
    minHeight: 48,
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    borderWidth: 1,
    minWidth: 190,
  },
  secondaryButtonText: {
    fontFamily: BODY_FONT,
    fontSize: 15,
    fontWeight: '700',
  },
});

export default ExpressiveStateView;
