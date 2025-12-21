/**
 * Declutterly - Typography System
 * Following Apple's Human Interface Guidelines for SF Pro
 */

import { Platform, TextStyle } from 'react-native';

// Font family based on platform
const fontFamily = Platform.select({
  ios: 'System',
  android: 'Roboto',
  default: 'System',
});

// Font weights following iOS conventions
export const FontWeights = {
  ultraLight: '100' as TextStyle['fontWeight'],
  thin: '200' as TextStyle['fontWeight'],
  light: '300' as TextStyle['fontWeight'],
  regular: '400' as TextStyle['fontWeight'],
  medium: '500' as TextStyle['fontWeight'],
  semibold: '600' as TextStyle['fontWeight'],
  bold: '700' as TextStyle['fontWeight'],
  heavy: '800' as TextStyle['fontWeight'],
  black: '900' as TextStyle['fontWeight'],
};

// Apple's Dynamic Type sizes
export const FontSizes = {
  caption2: 11,
  caption1: 12,
  footnote: 13,
  subheadline: 15,
  callout: 16,
  body: 17,
  headline: 17,
  title3: 20,
  title2: 22,
  title1: 28,
  largeTitle: 34,

  // Display sizes for hero sections
  display1: 48,
  display2: 56,
  display3: 64,
};

// Line height multipliers
export const LineHeights = {
  tight: 1.1,
  normal: 1.3,
  relaxed: 1.5,
  loose: 1.7,
};

// Letter spacing
export const LetterSpacing = {
  tighter: -0.5,
  tight: -0.25,
  normal: 0,
  wide: 0.25,
  wider: 0.5,
};

// Pre-defined text styles matching Apple's design system
export const Typography = {
  // Large Title - Major navigation or section headers
  largeTitle: {
    fontFamily,
    fontSize: FontSizes.largeTitle,
    fontWeight: FontWeights.bold,
    lineHeight: FontSizes.largeTitle * LineHeights.tight,
    letterSpacing: LetterSpacing.tight,
  } as TextStyle,

  // Title 1 - Screen titles
  title1: {
    fontFamily,
    fontSize: FontSizes.title1,
    fontWeight: FontWeights.bold,
    lineHeight: FontSizes.title1 * LineHeights.tight,
    letterSpacing: LetterSpacing.tight,
  } as TextStyle,

  // Title 2 - Section headers
  title2: {
    fontFamily,
    fontSize: FontSizes.title2,
    fontWeight: FontWeights.bold,
    lineHeight: FontSizes.title2 * LineHeights.normal,
    letterSpacing: LetterSpacing.normal,
  } as TextStyle,

  // Title 3 - Subsection headers
  title3: {
    fontFamily,
    fontSize: FontSizes.title3,
    fontWeight: FontWeights.semibold,
    lineHeight: FontSizes.title3 * LineHeights.normal,
    letterSpacing: LetterSpacing.normal,
  } as TextStyle,

  // Headline - Emphasized body text
  headline: {
    fontFamily,
    fontSize: FontSizes.headline,
    fontWeight: FontWeights.semibold,
    lineHeight: FontSizes.headline * LineHeights.normal,
    letterSpacing: LetterSpacing.normal,
  } as TextStyle,

  // Body - Default reading text
  body: {
    fontFamily,
    fontSize: FontSizes.body,
    fontWeight: FontWeights.regular,
    lineHeight: FontSizes.body * LineHeights.relaxed,
    letterSpacing: LetterSpacing.normal,
  } as TextStyle,

  // Body Bold
  bodyBold: {
    fontFamily,
    fontSize: FontSizes.body,
    fontWeight: FontWeights.semibold,
    lineHeight: FontSizes.body * LineHeights.relaxed,
    letterSpacing: LetterSpacing.normal,
  } as TextStyle,

  // Callout - Secondary information
  callout: {
    fontFamily,
    fontSize: FontSizes.callout,
    fontWeight: FontWeights.regular,
    lineHeight: FontSizes.callout * LineHeights.normal,
    letterSpacing: LetterSpacing.normal,
  } as TextStyle,

  // Subheadline - Supporting text
  subheadline: {
    fontFamily,
    fontSize: FontSizes.subheadline,
    fontWeight: FontWeights.regular,
    lineHeight: FontSizes.subheadline * LineHeights.normal,
    letterSpacing: LetterSpacing.normal,
  } as TextStyle,

  // Subheadline Medium
  subheadlineMedium: {
    fontFamily,
    fontSize: FontSizes.subheadline,
    fontWeight: FontWeights.medium,
    lineHeight: FontSizes.subheadline * LineHeights.normal,
    letterSpacing: LetterSpacing.normal,
  } as TextStyle,

  // Footnote - Small supporting text
  footnote: {
    fontFamily,
    fontSize: FontSizes.footnote,
    fontWeight: FontWeights.regular,
    lineHeight: FontSizes.footnote * LineHeights.normal,
    letterSpacing: LetterSpacing.normal,
  } as TextStyle,

  // Caption 1 - Labels and badges
  caption1: {
    fontFamily,
    fontSize: FontSizes.caption1,
    fontWeight: FontWeights.regular,
    lineHeight: FontSizes.caption1 * LineHeights.normal,
    letterSpacing: LetterSpacing.normal,
  } as TextStyle,

  // Caption 1 Medium
  caption1Medium: {
    fontFamily,
    fontSize: FontSizes.caption1,
    fontWeight: FontWeights.medium,
    lineHeight: FontSizes.caption1 * LineHeights.normal,
    letterSpacing: LetterSpacing.normal,
  } as TextStyle,

  // Caption 2 - Smallest text
  caption2: {
    fontFamily,
    fontSize: FontSizes.caption2,
    fontWeight: FontWeights.regular,
    lineHeight: FontSizes.caption2 * LineHeights.normal,
    letterSpacing: LetterSpacing.wide,
  } as TextStyle,

  // Display styles for hero sections
  display1: {
    fontFamily,
    fontSize: FontSizes.display1,
    fontWeight: FontWeights.bold,
    lineHeight: FontSizes.display1 * LineHeights.tight,
    letterSpacing: LetterSpacing.tighter,
  } as TextStyle,

  display2: {
    fontFamily,
    fontSize: FontSizes.display2,
    fontWeight: FontWeights.bold,
    lineHeight: FontSizes.display2 * LineHeights.tight,
    letterSpacing: LetterSpacing.tighter,
  } as TextStyle,

  // Stats/Numbers - Tabular figures
  stat: {
    fontFamily,
    fontSize: FontSizes.title1,
    fontWeight: FontWeights.bold,
    lineHeight: FontSizes.title1 * LineHeights.tight,
    letterSpacing: LetterSpacing.tight,
    fontVariant: ['tabular-nums'] as TextStyle['fontVariant'],
  } as TextStyle,

  statLarge: {
    fontFamily,
    fontSize: FontSizes.display1,
    fontWeight: FontWeights.bold,
    lineHeight: FontSizes.display1 * LineHeights.tight,
    letterSpacing: LetterSpacing.tight,
    fontVariant: ['tabular-nums'] as TextStyle['fontVariant'],
  } as TextStyle,

  // Button text
  button: {
    fontFamily,
    fontSize: FontSizes.body,
    fontWeight: FontWeights.semibold,
    lineHeight: FontSizes.body * LineHeights.normal,
    letterSpacing: LetterSpacing.normal,
  } as TextStyle,

  buttonSmall: {
    fontFamily,
    fontSize: FontSizes.subheadline,
    fontWeight: FontWeights.semibold,
    lineHeight: FontSizes.subheadline * LineHeights.normal,
    letterSpacing: LetterSpacing.normal,
  } as TextStyle,
};

export default Typography;
