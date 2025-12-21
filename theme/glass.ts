/**
 * Declutterly - Glass Effect System
 * Apple TV / visionOS style glass morphism
 */

import { ViewStyle } from 'react-native';

// Glass intensity presets
export type GlassIntensity = 'ultraThin' | 'thin' | 'regular' | 'thick' | 'opaque';

// Blur intensity values (for expo-blur)
export const BlurIntensity: Record<GlassIntensity, number> = {
  ultraThin: 20,
  thin: 40,
  regular: 60,
  thick: 80,
  opaque: 100,
};

// Background opacity values
export const GlassOpacity: Record<GlassIntensity, number> = {
  ultraThin: 0.3,
  thin: 0.5,
  regular: 0.65,
  thick: 0.8,
  opaque: 0.95,
};

// Glass tint modes
export type GlassTint = 'light' | 'dark' | 'default' | 'extraLight' | 'prominent';

// Get glass background color based on color scheme
export const getGlassBackground = (
  colorScheme: 'light' | 'dark',
  intensity: GlassIntensity = 'regular'
): string => {
  const opacity = GlassOpacity[intensity];

  if (colorScheme === 'dark') {
    return `rgba(30, 30, 30, ${opacity})`;
  }
  return `rgba(255, 255, 255, ${opacity})`;
};

// Glass border styles
export const getGlassBorder = (colorScheme: 'light' | 'dark'): ViewStyle => {
  if (colorScheme === 'dark') {
    return {
      borderWidth: 0.5,
      borderColor: 'rgba(255, 255, 255, 0.1)',
    };
  }
  return {
    borderWidth: 0.5,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  };
};

// Pre-built glass card styles
export const GlassCardStyles = {
  // Standard glass card
  card: (colorScheme: 'light' | 'dark'): ViewStyle => ({
    backgroundColor: getGlassBackground(colorScheme, 'regular'),
    borderRadius: 20,
    ...getGlassBorder(colorScheme),
    overflow: 'hidden',
  }),

  // Elevated glass card (more prominent)
  elevated: (colorScheme: 'light' | 'dark'): ViewStyle => ({
    backgroundColor: getGlassBackground(colorScheme, 'thick'),
    borderRadius: 24,
    ...getGlassBorder(colorScheme),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: colorScheme === 'dark' ? 0.4 : 0.15,
    shadowRadius: 24,
    elevation: 8,
  }),

  // Subtle glass (less prominent)
  subtle: (colorScheme: 'light' | 'dark'): ViewStyle => ({
    backgroundColor: getGlassBackground(colorScheme, 'ultraThin'),
    borderRadius: 16,
    ...getGlassBorder(colorScheme),
    overflow: 'hidden',
  }),

  // Pill-shaped glass (for buttons, tabs)
  pill: (colorScheme: 'light' | 'dark'): ViewStyle => ({
    backgroundColor: getGlassBackground(colorScheme, 'thin'),
    borderRadius: 100,
    ...getGlassBorder(colorScheme),
    overflow: 'hidden',
  }),

  // Full-width section glass
  section: (colorScheme: 'light' | 'dark'): ViewStyle => ({
    backgroundColor: getGlassBackground(colorScheme, 'regular'),
    borderRadius: 0,
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: colorScheme === 'dark'
      ? 'rgba(255, 255, 255, 0.08)'
      : 'rgba(0, 0, 0, 0.05)',
  }),

  // Floating action button glass
  fab: (colorScheme: 'light' | 'dark'): ViewStyle => ({
    backgroundColor: getGlassBackground(colorScheme, 'thick'),
    borderRadius: 28,
    ...getGlassBorder(colorScheme),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  }),

  // Navigation bar glass
  navbar: (colorScheme: 'light' | 'dark'): ViewStyle => ({
    backgroundColor: getGlassBackground(colorScheme, 'regular'),
    borderBottomWidth: 0.5,
    borderBottomColor: colorScheme === 'dark'
      ? 'rgba(255, 255, 255, 0.1)'
      : 'rgba(0, 0, 0, 0.1)',
  }),

  // Tab bar glass
  tabbar: (colorScheme: 'light' | 'dark'): ViewStyle => ({
    backgroundColor: getGlassBackground(colorScheme, 'regular'),
    borderTopWidth: 0.5,
    borderTopColor: colorScheme === 'dark'
      ? 'rgba(255, 255, 255, 0.1)'
      : 'rgba(0, 0, 0, 0.08)',
  }),

  // Input field glass
  input: (colorScheme: 'light' | 'dark'): ViewStyle => ({
    backgroundColor: getGlassBackground(colorScheme, 'thin'),
    borderRadius: 12,
    ...getGlassBorder(colorScheme),
  }),

  // Modal/Sheet glass
  modal: (colorScheme: 'light' | 'dark'): ViewStyle => ({
    backgroundColor: getGlassBackground(colorScheme, 'thick'),
    borderRadius: 32,
    borderWidth: 0.5,
    borderColor: colorScheme === 'dark'
      ? 'rgba(255, 255, 255, 0.15)'
      : 'rgba(0, 0, 0, 0.05)',
    overflow: 'hidden',
  }),
};

// Gradient overlay for glass cards (top highlight)
export const GlassGradient = {
  light: ['rgba(255, 255, 255, 0.3)', 'rgba(255, 255, 255, 0)'],
  dark: ['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0)'],
};

// Shimmer effect colors for loading states
export const ShimmerColors = {
  light: ['#F3F4F6', '#E5E7EB', '#F3F4F6'],
  dark: ['#1F2937', '#374151', '#1F2937'],
};

export default {
  BlurIntensity,
  GlassOpacity,
  getGlassBackground,
  getGlassBorder,
  GlassCardStyles,
  GlassGradient,
  ShimmerColors,
};
