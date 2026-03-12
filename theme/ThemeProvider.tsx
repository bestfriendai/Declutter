/**
 * Declutterly — Apple 2026 Theme Provider
 * Adaptive colors, elevation system, and theme context
 */

import { Colors, ColorTokens, Elevation, Shadows } from '@/constants/Colors';
import { Typography } from '@/theme/typography';
import React, { createContext, useCallback, useContext, useMemo } from 'react';
import { Appearance, ColorSchemeName, useColorScheme } from 'react-native';

// ─────────────────────────────────────────────────────────────────────────────
// Theme Context Types
// ─────────────────────────────────────────────────────────────────────────────
export type ColorScheme = 'light' | 'dark';
export type ElevationLevel = 0 | 1 | 2 | 3 | 4 | 5;

export interface ThemeContextValue {
  colorScheme: ColorScheme;
  isDark: boolean;
  isLight: boolean;
  colors: ColorTokens;
  elevation: Record<ElevationLevel, string>;
  shadows: typeof Shadows;
  typography: typeof Typography;

  // Helpers
  getElevatedColor: (level: ElevationLevel) => string;
  getAdaptiveColor: (light: string, dark: string) => string;
  getShadow: (level: 'none' | 'xs' | 'small' | 'medium' | 'large' | 'xl') => object;
  getGlowShadow: (color: string, intensity?: number) => object;
  getColoredShadow: (color: string) => object;
}

// ─────────────────────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────────────────────
const ThemeContext = createContext<ThemeContextValue | null>(null);

// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const rawScheme = useColorScheme();
  const colorScheme: ColorScheme = rawScheme === 'dark' ? 'dark' : 'light';
  const isDark = colorScheme === 'dark';
  const isLight = !isDark;

  const colors = Colors[colorScheme] as ColorTokens;
  const elevationColors = Elevation[colorScheme] as Record<ElevationLevel, string>;

  const getElevatedColor = useCallback(
    (level: ElevationLevel): string => elevationColors[level],
    [elevationColors]
  );

  const getAdaptiveColor = useCallback(
    (light: string, dark: string): string => (isDark ? dark : light),
    [isDark]
  );

  const getShadow = useCallback(
    (level: 'none' | 'xs' | 'small' | 'medium' | 'large' | 'xl') => {
      const shadow = Shadows[level];
      if (isDark && level !== 'none') {
        // Reduce shadow opacity in dark mode (shadows less visible on dark bg)
        return {
          ...shadow,
          shadowOpacity: (shadow as { shadowOpacity?: number }).shadowOpacity
            ? (shadow as { shadowOpacity: number }).shadowOpacity * 0.6
            : 0,
        };
      }
      return shadow;
    },
    [isDark]
  );

  const getGlowShadow = useCallback(
    (color: string, intensity: number = 0.4) => Shadows.glow(color, intensity),
    []
  );

  const getColoredShadow = useCallback(
    (color: string) => Shadows.colored(color),
    []
  );

  const value = useMemo<ThemeContextValue>(
    () => ({
      colorScheme,
      isDark,
      isLight,
      colors,
      elevation: elevationColors,
      shadows: Shadows,
      typography: Typography,
      getElevatedColor,
      getAdaptiveColor,
      getShadow,
      getGlowShadow,
      getColoredShadow,
    }),
    [
      colorScheme,
      isDark,
      isLight,
      colors,
      elevationColors,
      getElevatedColor,
      getAdaptiveColor,
      getShadow,
      getGlowShadow,
      getColoredShadow,
    ]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Hooks
// ─────────────────────────────────────────────────────────────────────────────

/** Primary theme hook — access all theme values */
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    // Fallback for components outside ThemeProvider
    const scheme = Appearance.getColorScheme() ?? 'dark';
    const colorScheme: ColorScheme = scheme === 'dark' ? 'dark' : 'light';
    const isDark = colorScheme === 'dark';
    return {
      colorScheme,
      isDark,
      isLight: !isDark,
      colors: Colors[colorScheme] as ColorTokens,
      elevation: Elevation[colorScheme] as Record<ElevationLevel, string>,
      shadows: Shadows,
      typography: Typography,
      getElevatedColor: (level) => Elevation[colorScheme][level] as string,
      getAdaptiveColor: (light, dark) => (isDark ? dark : light),
      getShadow: (level) => Shadows[level] ?? {},
      getGlowShadow: (color, intensity) => Shadows.glow(color, intensity),
      getColoredShadow: (color) => Shadows.colored(color),
    };
  }
  return ctx;
}

/** Shorthand hook — just colors */
export function useColors(): ColorTokens {
  return useTheme().colors;
}

/** Shorthand hook — color scheme */
export function useColorSchemeValue(): ColorScheme {
  return useTheme().colorScheme;
}

/** Shorthand hook — isDark boolean */
export function useIsDark(): boolean {
  return useTheme().isDark;
}

/** Adaptive color hook — returns correct value for current scheme */
export function useAdaptiveColor(light: string, dark: string): string {
  const { isDark } = useTheme();
  return isDark ? dark : light;
}

/** Elevation color hook — returns surface color at given elevation */
export function useElevatedColor(level: ElevationLevel): string {
  return useTheme().getElevatedColor(level);
}

/** Typography hook */
export function useTypography(): typeof Typography {
  return useTheme().typography;
}

// ─────────────────────────────────────────────────────────────────────────────
// Utility: Get colors without hook (for StyleSheet.create)
// ─────────────────────────────────────────────────────────────────────────────
export function getColors(scheme: ColorSchemeName): ColorTokens {
  return Colors[scheme === 'dark' ? 'dark' : 'light'] as ColorTokens;
}

export default ThemeProvider;
