/**
 * Declutterly - Theme Provider
 * Centralized theme management with Apple TV 2025 design system
 */

import React, { createContext, useContext, useMemo, useEffect } from 'react';
import { useColorScheme as useRNColorScheme, ColorSchemeName } from 'react-native';
import { Colors, Shadows, RoomColors, PriorityColors, RingColors, RarityColors } from '@/constants/Colors';
import { Typography, FontSizes, FontWeights, LineHeights } from './typography';
import { GlassCardStyles, BlurIntensity, getGlassBackground, getGlassBorder } from './glass';
import { setForcedColorScheme } from '@/hooks/useColorScheme';

// Spacing scale (based on 4pt grid)
export const Spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
  massive: 64,
} as const;

// Border radius scale
export const BorderRadius = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  full: 9999,
} as const;

// Animation timing
export const AnimationConfig = {
  // Spring configs for Reanimated
  spring: {
    gentle: { damping: 20, stiffness: 180 },
    snappy: { damping: 15, stiffness: 300 },
    bouncy: { damping: 10, stiffness: 200 },
    stiff: { damping: 25, stiffness: 400 },
  },
  // Duration configs
  duration: {
    instant: 100,
    fast: 200,
    normal: 300,
    slow: 500,
    slower: 700,
  },
  // Easing presets (for non-spring animations)
  easing: {
    ease: [0.25, 0.1, 0.25, 1],
    easeIn: [0.42, 0, 1, 1],
    easeOut: [0, 0, 0.58, 1],
    easeInOut: [0.42, 0, 0.58, 1],
  },
} as const;

// Theme context type
interface ThemeContextType {
  colorScheme: 'light' | 'dark';
  colors: typeof Colors.light | typeof Colors.dark;
  typography: typeof Typography;
  spacing: typeof Spacing;
  borderRadius: typeof BorderRadius;
  shadows: typeof Shadows;
  animation: typeof AnimationConfig;
  glass: {
    card: ReturnType<typeof GlassCardStyles.card>;
    elevated: ReturnType<typeof GlassCardStyles.elevated>;
    subtle: ReturnType<typeof GlassCardStyles.subtle>;
    pill: ReturnType<typeof GlassCardStyles.pill>;
    section: ReturnType<typeof GlassCardStyles.section>;
    fab: ReturnType<typeof GlassCardStyles.fab>;
    navbar: ReturnType<typeof GlassCardStyles.navbar>;
    tabbar: ReturnType<typeof GlassCardStyles.tabbar>;
    input: ReturnType<typeof GlassCardStyles.input>;
    modal: ReturnType<typeof GlassCardStyles.modal>;
  };
  blurIntensity: typeof BlurIntensity;
  roomColors: typeof RoomColors;
  priorityColors: typeof PriorityColors;
  ringColors: typeof RingColors;
  rarityColors: typeof RarityColors;
}

// Create context
const ThemeContext = createContext<ThemeContextType | null>(null);

// Provider props
interface ThemeProviderProps {
  children: React.ReactNode;
  forcedColorScheme?: ColorSchemeName;
}

// Theme Provider component
export function ThemeProvider({ children, forcedColorScheme }: ThemeProviderProps) {
  const systemColorScheme = useRNColorScheme();
  const colorScheme = (forcedColorScheme ?? systemColorScheme ?? 'dark') as 'light' | 'dark';

  // Sync the color scheme to the global hook so all components get the right value
  useEffect(() => {
    setForcedColorScheme(colorScheme);
  }, [colorScheme]);

  const theme = useMemo<ThemeContextType>(() => ({
    colorScheme,
    colors: Colors[colorScheme],
    typography: Typography,
    spacing: Spacing,
    borderRadius: BorderRadius,
    shadows: Shadows,
    animation: AnimationConfig,
    glass: {
      card: GlassCardStyles.card(colorScheme),
      elevated: GlassCardStyles.elevated(colorScheme),
      subtle: GlassCardStyles.subtle(colorScheme),
      pill: GlassCardStyles.pill(colorScheme),
      section: GlassCardStyles.section(colorScheme),
      fab: GlassCardStyles.fab(colorScheme),
      navbar: GlassCardStyles.navbar(colorScheme),
      tabbar: GlassCardStyles.tabbar(colorScheme),
      input: GlassCardStyles.input(colorScheme),
      modal: GlassCardStyles.modal(colorScheme),
    },
    blurIntensity: BlurIntensity,
    roomColors: RoomColors,
    priorityColors: PriorityColors,
    ringColors: RingColors,
    rarityColors: RarityColors,
  }), [colorScheme]);

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}

// Hook to use theme
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Convenience hooks
export function useColors() {
  return useTheme().colors;
}

export function useTypography() {
  return useTheme().typography;
}

export function useSpacing() {
  return useTheme().spacing;
}

export function useGlass() {
  return useTheme().glass;
}

export function useAnimation() {
  return useTheme().animation;
}

// Export for direct imports
export { Typography, FontSizes, FontWeights, LineHeights };
export { Colors, Shadows, RoomColors, PriorityColors, RingColors, RarityColors };
export { BlurIntensity, getGlassBackground, getGlassBorder, GlassCardStyles };

export default ThemeProvider;
