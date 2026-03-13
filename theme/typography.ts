/**
 * Declutterly — Apple 2026 Typography System
 * SF Pro Display, SF Pro Text, SF Mono — optical sizing & proper weights
 */

import { Dimensions, Platform, TextStyle } from 'react-native';

// ─────────────────────────────────────────────────────────────────────────────
// Font Family Tokens
// ─────────────────────────────────────────────────────────────────────────────
export const FontFamily = {
  // SF Pro Display — for large text (≥20pt)
  display:        Platform.OS === 'ios' ? 'System' : 'sans-serif',
  displayBold:    Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',

  // SF Pro Text — for body text (<20pt)
  text:           Platform.OS === 'ios' ? 'System' : 'sans-serif',
  textMedium:     Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  textBold:       Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',

  // SF Mono — for code, timers, numbers
  mono:           Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  monoMedium:     Platform.OS === 'ios' ? 'Courier New' : 'monospace',

  // Rounded — for friendly UI elements
  rounded:        Platform.OS === 'ios' ? 'System' : 'sans-serif',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Font Size Scale — iOS 26 Dynamic Type compatible
// ─────────────────────────────────────────────────────────────────────────────
export const FontSize = {
  // Display sizes (SF Pro Display optical sizing)
  displayHero:    64,   // Hero numbers, splash
  displayXL:      56,   // Large hero titles
  displayLarge:   48,   // Section heroes
  displayMedium:  40,   // Feature titles
  displaySmall:   34,   // Large title (iOS nav)

  // Title sizes
  title1:         28,   // Primary screen title
  title2:         22,   // Section title
  title3:         20,   // Card title

  // Body sizes
  headline:       17,   // Emphasized body (semibold)
  body:           17,   // Standard body
  callout:        16,   // Slightly smaller body
  subheadline:    15,   // Secondary body
  footnote:       13,   // Supporting text
  caption1:       12,   // Labels, captions
  caption2:       11,   // Smallest readable text

  // Special
  tabLabel:       10,   // Tab bar labels
  badge:          10,   // Badge numbers
  micro:           9,   // Micro labels
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Font Weight Tokens
// ─────────────────────────────────────────────────────────────────────────────
export const FontWeight = {
  ultraLight: '100' as TextStyle['fontWeight'],
  thin:       '200' as TextStyle['fontWeight'],
  light:      '300' as TextStyle['fontWeight'],
  regular:    '400' as TextStyle['fontWeight'],
  medium:     '500' as TextStyle['fontWeight'],
  semibold:   '600' as TextStyle['fontWeight'],
  bold:       '700' as TextStyle['fontWeight'],
  heavy:      '800' as TextStyle['fontWeight'],
  black:      '900' as TextStyle['fontWeight'],
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Line Height Scale
// ─────────────────────────────────────────────────────────────────────────────
export const LineHeight = {
  tight:    1.1,
  snug:     1.2,
  normal:   1.4,
  relaxed:  1.6,
  loose:    1.8,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Letter Spacing
// ─────────────────────────────────────────────────────────────────────────────
export const LetterSpacing = {
  tighter:  -0.8,
  tight:    -0.4,
  normal:    0,
  wide:      0.4,
  wider:     0.8,
  widest:    1.6,
  caps:      2.0,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Typography Presets — iOS 26 Text Styles
// ─────────────────────────────────────────────────────────────────────────────
export const Typography = {
  // ── Display ─────────────────────────────────────────────────────────────
  displayHero: {
    fontSize:      FontSize.displayHero,
    fontWeight:    FontWeight.black,
    letterSpacing: LetterSpacing.tighter,
    lineHeight:    FontSize.displayHero * LineHeight.tight,
  } as TextStyle,

  displayXL: {
    fontSize:      FontSize.displayXL,
    fontWeight:    FontWeight.black,
    letterSpacing: LetterSpacing.tighter,
    lineHeight:    FontSize.displayXL * LineHeight.tight,
  } as TextStyle,

  displayLarge: {
    fontSize:      FontSize.displayLarge,
    fontWeight:    FontWeight.heavy,
    letterSpacing: LetterSpacing.tight,
    lineHeight:    FontSize.displayLarge * LineHeight.snug,
  } as TextStyle,

  displayMedium: {
    fontSize:      FontSize.displayMedium,
    fontWeight:    FontWeight.bold,
    letterSpacing: LetterSpacing.tight,
    lineHeight:    FontSize.displayMedium * LineHeight.snug,
  } as TextStyle,

  displaySmall: {
    fontSize:      FontSize.displaySmall,
    fontWeight:    FontWeight.bold,
    letterSpacing: LetterSpacing.tight,
    lineHeight:    FontSize.displaySmall * LineHeight.snug,
  } as TextStyle,

  // ── Titles ───────────────────────────────────────────────────────────────
  largeTitle: {
    fontSize:      FontSize.displaySmall,
    fontWeight:    FontWeight.bold,
    letterSpacing: LetterSpacing.tight,
    lineHeight:    41,
  } as TextStyle,

  title1: {
    fontSize:      FontSize.title1,
    fontWeight:    FontWeight.bold,
    letterSpacing: LetterSpacing.tight,
    lineHeight:    34,
  } as TextStyle,

  title2: {
    fontSize:      FontSize.title2,
    fontWeight:    FontWeight.bold,
    letterSpacing: LetterSpacing.tight,
    lineHeight:    28,
  } as TextStyle,

  title3: {
    fontSize:      FontSize.title3,
    fontWeight:    FontWeight.semibold,
    letterSpacing: LetterSpacing.normal,
    lineHeight:    25,
  } as TextStyle,

  // ── Body ─────────────────────────────────────────────────────────────────
  headline: {
    fontSize:      FontSize.headline,
    fontWeight:    FontWeight.semibold,
    letterSpacing: LetterSpacing.normal,
    lineHeight:    22,
  } as TextStyle,

  headlineMedium: {
    fontSize:      FontSize.headline,
    fontWeight:    FontWeight.medium,
    letterSpacing: LetterSpacing.normal,
    lineHeight:    22,
  } as TextStyle,

  body: {
    fontSize:      FontSize.body,
    fontWeight:    FontWeight.regular,
    letterSpacing: LetterSpacing.normal,
    lineHeight:    22,
  } as TextStyle,

  bodyMedium: {
    fontSize:      FontSize.body,
    fontWeight:    FontWeight.medium,
    letterSpacing: LetterSpacing.normal,
    lineHeight:    22,
  } as TextStyle,

  callout: {
    fontSize:      FontSize.callout,
    fontWeight:    FontWeight.regular,
    letterSpacing: LetterSpacing.normal,
    lineHeight:    21,
  } as TextStyle,

  calloutMedium: {
    fontSize:      FontSize.callout,
    fontWeight:    FontWeight.medium,
    letterSpacing: LetterSpacing.normal,
    lineHeight:    21,
  } as TextStyle,

  subheadline: {
    fontSize:      FontSize.subheadline,
    fontWeight:    FontWeight.regular,
    letterSpacing: LetterSpacing.normal,
    lineHeight:    20,
  } as TextStyle,

  subheadlineMedium: {
    fontSize:      FontSize.subheadline,
    fontWeight:    FontWeight.medium,
    letterSpacing: LetterSpacing.normal,
    lineHeight:    20,
  } as TextStyle,

  footnote: {
    fontSize:      FontSize.footnote,
    fontWeight:    FontWeight.regular,
    letterSpacing: LetterSpacing.normal,
    lineHeight:    18,
  } as TextStyle,

  footnoteMedium: {
    fontSize:      FontSize.footnote,
    fontWeight:    FontWeight.medium,
    letterSpacing: LetterSpacing.normal,
    lineHeight:    18,
  } as TextStyle,

  caption1: {
    fontSize:      FontSize.caption1,
    fontWeight:    FontWeight.regular,
    letterSpacing: LetterSpacing.normal,
    lineHeight:    16,
  } as TextStyle,

  caption1Medium: {
    fontSize:      FontSize.caption1,
    fontWeight:    FontWeight.medium,
    letterSpacing: LetterSpacing.normal,
    lineHeight:    16,
  } as TextStyle,

  caption2: {
    fontSize:      FontSize.caption2,
    fontWeight:    FontWeight.regular,
    letterSpacing: LetterSpacing.normal,
    lineHeight:    13,
  } as TextStyle,

  caption2Medium: {
    fontSize:      FontSize.caption2,
    fontWeight:    FontWeight.medium,
    letterSpacing: LetterSpacing.normal,
    lineHeight:    13,
  } as TextStyle,

  // ── Monospaced (timers, stats, code) ─────────────────────────────────────
  monoHero: {
    fontSize:      FontSize.displayHero,
    fontWeight:    FontWeight.ultraLight,
    fontVariant:   ['tabular-nums'],
    letterSpacing: LetterSpacing.tighter,
    lineHeight:    FontSize.displayHero * LineHeight.tight,
    fontFamily:    FontFamily.mono,
  } as TextStyle,

  monoLarge: {
    fontSize:      FontSize.displaySmall,
    fontWeight:    FontWeight.light,
    fontVariant:   ['tabular-nums'],
    letterSpacing: LetterSpacing.tight,
    lineHeight:    FontSize.displaySmall * LineHeight.snug,
    fontFamily:    FontFamily.mono,
  } as TextStyle,

  monoBody: {
    fontSize:      FontSize.body,
    fontWeight:    FontWeight.regular,
    fontVariant:   ['tabular-nums'],
    letterSpacing: LetterSpacing.normal,
    lineHeight:    22,
    fontFamily:    FontFamily.mono,
  } as TextStyle,

  monoCaption: {
    fontSize:      FontSize.caption1,
    fontWeight:    FontWeight.medium,
    fontVariant:   ['tabular-nums'],
    letterSpacing: LetterSpacing.wide,
    lineHeight:    16,
    fontFamily:    FontFamily.mono,
  } as TextStyle,

  // ── Special ──────────────────────────────────────────────────────────────
  tabLabel: {
    fontSize:      FontSize.tabLabel,
    fontWeight:    FontWeight.medium,
    letterSpacing: LetterSpacing.normal,
    lineHeight:    12,
  } as TextStyle,

  badge: {
    fontSize:      FontSize.badge,
    fontWeight:    FontWeight.bold,
    letterSpacing: LetterSpacing.normal,
    lineHeight:    12,
  } as TextStyle,

  // Uppercase label (for section headers, tags)
  overline: {
    fontSize:      FontSize.caption2,
    fontWeight:    FontWeight.semibold,
    letterSpacing: LetterSpacing.caps,
    textTransform: 'uppercase',
    lineHeight:    16,
  } as TextStyle,

  // Button text
  buttonLarge: {
    fontSize:      FontSize.headline,
    fontWeight:    FontWeight.semibold,
    letterSpacing: LetterSpacing.normal,
    lineHeight:    22,
  } as TextStyle,

  buttonMedium: {
    fontSize:      FontSize.callout,
    fontWeight:    FontWeight.semibold,
    letterSpacing: LetterSpacing.normal,
    lineHeight:    21,
  } as TextStyle,

  buttonSmall: {
    fontSize:      FontSize.subheadline,
    fontWeight:    FontWeight.semibold,
    letterSpacing: LetterSpacing.normal,
    lineHeight:    20,
  } as TextStyle,

  // Navigation
  navTitle: {
    fontSize:      FontSize.headline,
    fontWeight:    FontWeight.semibold,
    letterSpacing: LetterSpacing.normal,
    lineHeight:    22,
  } as TextStyle,

  navLargeTitle: {
    fontSize:      FontSize.displaySmall,
    fontWeight:    FontWeight.bold,
    letterSpacing: LetterSpacing.tight,
    lineHeight:    41,
  } as TextStyle,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Responsive Typography — scales with screen size
// ─────────────────────────────────────────────────────────────────────────────
const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Scale factor based on screen width (375 = iPhone 14 base)
const scaleFactor = Math.min(SCREEN_WIDTH / 375, 1.3);

export function scaleFont(size: number): number {
  return Math.round(size * scaleFactor);
}

// ─────────────────────────────────────────────────────────────────────────────
// Text Shadow Presets
// ─────────────────────────────────────────────────────────────────────────────
export const TextShadows = {
  none: {},
  subtle: {
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  medium: {
    textShadowColor: 'rgba(0, 0, 0, 0.30)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  strong: {
    textShadowColor: 'rgba(0, 0, 0, 0.50)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  glow: (color: string) => ({
    textShadowColor: color,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  }),
} as const;

export default Typography;
