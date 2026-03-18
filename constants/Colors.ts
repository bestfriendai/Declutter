/**
 * Declutterly — Apple 2026 Design System
 * iOS 26 adaptive material colors, vibrancy, and semantic tokens
 */

import { DynamicColorIOS, Platform } from 'react-native';

// Gradient tuple types for LinearGradient compatibility
type GradientTuple = readonly [string, string];
type GradientTriple = readonly [string, string, string];

// ─────────────────────────────────────────────────────────────────────────────
// iOS 26 Adaptive Color Helper
// Returns DynamicColorIOS on iOS, falls back to dark value on Android/web
// ─────────────────────────────────────────────────────────────────────────────
export function adaptiveColor(light: string, dark: string): string {
  if (Platform.OS === 'ios') {
    return DynamicColorIOS({ light, dark }) as unknown as string;
  }
  return dark;
}

// ─────────────────────────────────────────────────────────────────────────────
// Core Color Palette — iOS 26 System Colors
// ─────────────────────────────────────────────────────────────────────────────
export const SystemColors = {
  // Blues
  blue:    { light: '#007AFF', dark: '#0A84FF' },
  // Greens
  green:   { light: '#34C759', dark: '#30D158' },
  // Reds
  red:     { light: '#FF3B30', dark: '#FF453A' },
  // Oranges
  orange:  { light: '#FF9500', dark: '#FF9F0A' },
  // Yellows
  yellow:  { light: '#FFCC00', dark: '#FFD60A' },
  // Purples
  purple:  { light: '#AF52DE', dark: '#BF5AF2' },
  // Pinks
  pink:    { light: '#FF2D55', dark: '#FF375F' },
  // Teals
  teal:    { light: '#5AC8FA', dark: '#64D2FF' },
  // Indigos
  indigo:  { light: '#5856D6', dark: '#6E6CF0' },
  // Mints
  mint:    { light: '#00C7BE', dark: '#63E6E2' },
  // Cyans
  cyan:    { light: '#32ADE6', dark: '#32ADE6' },
  // Browns
  brown:   { light: '#A2845E', dark: '#AC8E68' },
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Main Color Tokens
// ─────────────────────────────────────────────────────────────────────────────
export const Colors = {
  light: {
    // ── Text ──────────────────────────────────────────────────────────────
    text:           '#000000',
    textSecondary:  '#3C3C43',          // iOS label secondary
    textTertiary:   '#3C3C4399',        // iOS label tertiary (60% opacity)
    textQuaternary: '#3C3C432E',        // iOS label quaternary (18% opacity)
    textMuted:      '#8E8E93',          // Placeholder text
    textOnPrimary:  '#FFFFFF',
    textOnSuccess:  '#FFFFFF',
    textOnDanger:   '#FFFFFF',
    textOnWarning:  '#000000',
    textOnInfo:     '#FFFFFF',

    // ── Backgrounds ───────────────────────────────────────────────────────
    background:           '#F2F2F7',    // iOS systemBackground
    backgroundSecondary:  '#FFFFFF',    // iOS secondarySystemBackground
    backgroundTertiary:   '#F2F2F7',    // iOS tertiarySystemBackground

    // ── Grouped Backgrounds ───────────────────────────────────────────────
    groupedBackground:          '#F2F2F7',
    groupedBackgroundSecondary: '#FFFFFF',
    groupedBackgroundTertiary:  '#F2F2F7',

    // ── Surfaces / Cards ──────────────────────────────────────────────────
    surface:          '#FFFFFF',
    surfaceSecondary: '#F2F2F7',
    surfaceTertiary:  '#E5E5EA',
    surfaceElevated:  '#FFFFFF',
    card:             '#FFFFFF',

    // ── Fill Colors (for controls) ────────────────────────────────────────
    fillPrimary:    'rgba(120, 120, 128, 0.20)',
    fillSecondary:  'rgba(120, 120, 128, 0.16)',
    fillTertiary:   'rgba(118, 118, 128, 0.12)',
    fillQuaternary: 'rgba(116, 116, 128, 0.08)',

    // ── Primary / Accent ──────────────────────────────────────────────────
    primary:        '#000000',
    primaryMuted:   'rgba(0, 0, 0, 0.08)',
    primarySubtle:  'rgba(0, 0, 0, 0.04)',
    accent:         '#007AFF',          // iOS system blue
    accentMuted:    'rgba(0, 122, 255, 0.12)',

    // ── Borders & Separators ──────────────────────────────────────────────
    border:         '#C6C6C8',          // iOS separator
    borderLight:    '#E5E5EA',
    divider:        '#C6C6C8',
    separator:      'rgba(60, 60, 67, 0.29)',  // iOS opaque separator

    // ── Icons ─────────────────────────────────────────────────────────────
    icon:           '#000000',
    iconSecondary:  '#8E8E93',
    tabIconDefault: '#8E8E93',
    tabIconSelected:'#000000',

    // ── Semantic ──────────────────────────────────────────────────────────
    success:        '#34C759',
    successMuted:   'rgba(52, 199, 89, 0.15)',
    warning:        '#FF9500',
    warningMuted:   'rgba(255, 149, 0, 0.15)',
    error:          '#FF3B30',
    errorMuted:     'rgba(255, 59, 48, 0.15)',
    danger:         '#FF3B30',
    dangerMuted:    'rgba(255, 59, 48, 0.15)',
    info:           '#007AFF',
    infoMuted:      'rgba(0, 122, 255, 0.15)',

    // ── Interactive States ────────────────────────────────────────────────
    pressed:            'rgba(0, 0, 0, 0.08)',
    disabled:           '#C7C7CC',
    disabledBackground: 'rgba(0, 0, 0, 0.04)',
    focus:              'rgba(0, 122, 255, 0.30)',

    // ── Overlays ──────────────────────────────────────────────────────────
    cardOverlay:    'rgba(0, 0, 0, 0.03)',
    cardBorder:     'rgba(0, 0, 0, 0.06)',
    avatarBorder:   '#FFFFFF',
    modalOverlay:   'rgba(0, 0, 0, 0.40)',

    // ── Material / Glass ──────────────────────────────────────────────────
    // iOS 26 material backgrounds (used with BlurView)
    materialUltraThin:  'rgba(255, 255, 255, 0.30)',
    materialThin:       'rgba(255, 255, 255, 0.50)',
    materialRegular:    'rgba(255, 255, 255, 0.72)',
    materialThick:      'rgba(255, 255, 255, 0.85)',
    materialChromatic:  'rgba(255, 255, 255, 0.92)',

    // ── Gradients ─────────────────────────────────────────────────────────
    backgroundGradient: ['#F2F2F7', '#FFFFFF', '#F2F2F7'] as GradientTriple,
    heroGradient:       ['#FFFFFF', '#F2F2F7'] as GradientTuple,
    gradientPrimary:    ['#1C1C1E', '#3A3A3C'] as GradientTuple,
    gradientSuccess:    ['#34C759', '#30D158'] as GradientTuple,
    gradientAccent:     ['#007AFF', '#5856D6'] as GradientTuple,
    gradientWarm:       ['#FF9500', '#FF6B00'] as GradientTuple,
    gradientCool:       ['#007AFF', '#5AC8FA'] as GradientTuple,
    gradientPremium:    ['#AF52DE', '#5856D6'] as GradientTuple,
    gradientAction:     ['#007AFF', '#0A84FF'] as GradientTuple,
    gradientFocus:      ['#667eea', '#764ba2'] as GradientTuple,
    gradientEnergy:     ['#f093fb', '#f5576c'] as GradientTuple,

    // ── Charts ────────────────────────────────────────────────────────────
    chart: ['#000000', '#636366', '#8E8E93', '#C7C7CC'],
  },

  dark: {
    // ── Text ──────────────────────────────────────────────────────────────
    text:           '#FFFFFF',
    textSecondary:  '#EBEBF5',          // iOS dark label secondary
    textTertiary:   '#EBEBF599',        // iOS dark label tertiary
    textQuaternary: '#EBEBF52E',        // iOS dark label quaternary
    textMuted:      '#8E8E93',
    textOnPrimary:  '#000000',
    textOnSuccess:  '#000000',
    textOnDanger:   '#FFFFFF',
    textOnWarning:  '#000000',
    textOnInfo:     '#FFFFFF',

    // ── Backgrounds ───────────────────────────────────────────────────────
    background:           '#000000',    // True black for OLED
    backgroundSecondary:  '#1C1C1E',    // iOS dark secondarySystemBackground
    backgroundTertiary:   '#2C2C2E',    // iOS dark tertiarySystemBackground

    // ── Grouped Backgrounds ───────────────────────────────────────────────
    groupedBackground:          '#000000',
    groupedBackgroundSecondary: '#1C1C1E',
    groupedBackgroundTertiary:  '#2C2C2E',

    // ── Surfaces / Cards ──────────────────────────────────────────────────
    surface:          '#1C1C1E',        // System Gray 6
    surfaceSecondary: '#2C2C2E',        // System Gray 5
    surfaceTertiary:  '#3A3A3C',        // System Gray 4
    surfaceElevated:  '#2C2C2E',
    card:             '#1C1C1E',

    // ── Fill Colors ───────────────────────────────────────────────────────
    fillPrimary:    'rgba(120, 120, 128, 0.36)',
    fillSecondary:  'rgba(120, 120, 128, 0.32)',
    fillTertiary:   'rgba(118, 118, 128, 0.24)',
    fillQuaternary: 'rgba(118, 118, 128, 0.18)',

    // ── Primary / Accent ──────────────────────────────────────────────────
    primary:        '#FFFFFF',
    primaryMuted:   'rgba(255, 255, 255, 0.12)',
    primarySubtle:  'rgba(255, 255, 255, 0.06)',
    accent:         '#0A84FF',          // iOS dark system blue
    accentMuted:    'rgba(10, 132, 255, 0.15)',

    // ── Borders & Separators ──────────────────────────────────────────────
    border:         '#38383A',          // iOS dark separator
    borderLight:    '#2C2C2E',
    divider:        '#38383A',
    separator:      'rgba(84, 84, 88, 0.65)',

    // ── Icons ─────────────────────────────────────────────────────────────
    icon:           '#FFFFFF',
    iconSecondary:  '#8E8E93',
    tabIconDefault: '#8E8E93',
    tabIconSelected:'#FFFFFF',

    // ── Semantic ──────────────────────────────────────────────────────────
    success:        '#30D158',
    successMuted:   'rgba(48, 209, 88, 0.20)',
    warning:        '#FF9F0A',
    warningMuted:   'rgba(255, 159, 10, 0.20)',
    error:          '#FF453A',
    errorMuted:     'rgba(255, 69, 58, 0.20)',
    danger:         '#FF453A',
    dangerMuted:    'rgba(255, 69, 58, 0.20)',
    info:           '#0A84FF',
    infoMuted:      'rgba(10, 132, 255, 0.20)',

    // ── Interactive States ────────────────────────────────────────────────
    pressed:            'rgba(255, 255, 255, 0.12)',
    disabled:           '#636366',
    disabledBackground: 'rgba(255, 255, 255, 0.06)',
    focus:              'rgba(10, 132, 255, 0.40)',

    // ── Overlays ──────────────────────────────────────────────────────────
    cardOverlay:    'rgba(255, 255, 255, 0.06)',
    cardBorder:     'rgba(255, 255, 255, 0.07)',
    avatarBorder:   '#000000',
    modalOverlay:   'rgba(0, 0, 0, 0.60)',

    // ── Material / Glass ──────────────────────────────────────────────────
    materialUltraThin:  'rgba(28, 28, 30, 0.30)',
    materialThin:       'rgba(28, 28, 30, 0.50)',
    materialRegular:    'rgba(28, 28, 30, 0.72)',
    materialThick:      'rgba(28, 28, 30, 0.85)',
    materialChromatic:  'rgba(44, 44, 46, 0.92)',

    // ── Gradients ─────────────────────────────────────────────────────────
    backgroundGradient: ['#000000', '#0A0A0F', '#000000'] as GradientTriple,
    heroGradient:       ['#1C1C1E', '#000000'] as GradientTuple,
    gradientPrimary:    ['#FFFFFF', '#E5E5EA'] as GradientTuple,
    gradientSuccess:    ['#30D158', '#34C759'] as GradientTuple,
    gradientAccent:     ['#0A84FF', '#6E6CF0'] as GradientTuple,
    gradientWarm:       ['#FF9F0A', '#FF6B00'] as GradientTuple,
    gradientCool:       ['#0A84FF', '#64D2FF'] as GradientTuple,
    gradientPremium:    ['#BF5AF2', '#6E6CF0'] as GradientTuple,
    gradientAction:     ['#0A84FF', '#0A84FF'] as GradientTuple,
    gradientFocus:      ['#667eea', '#764ba2'] as GradientTuple,
    gradientEnergy:     ['#f093fb', '#f5576c'] as GradientTuple,

    // ── Charts ────────────────────────────────────────────────────────────
    chart: ['#FFFFFF', '#EBEBF5', '#8E8E93', '#48484A'],
  },
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Color Tokens Type — widened so light/dark are interchangeable as props
// ─────────────────────────────────────────────────────────────────────────────
type Widen<T> = {
  [K in keyof T]:
    T[K] extends readonly [string, string, string] ? readonly [string, string, string] :
    T[K] extends readonly [string, string] ? readonly [string, string] :
    T[K] extends readonly string[] ? readonly string[] :
    T[K] extends string ? string :
    T[K];
};
export type ColorTokens = Widen<typeof Colors.dark>;

// ─────────────────────────────────────────────────────────────────────────────
// Elevation System — iOS 26 surface layering
// ─────────────────────────────────────────────────────────────────────────────
export const Elevation = {
  light: {
    0: '#F2F2F7',   // Base background
    1: '#FFFFFF',   // Cards, sheets
    2: '#FFFFFF',   // Elevated cards
    3: '#FFFFFF',   // Modals
    4: '#FFFFFF',   // Popovers
    5: '#FFFFFF',   // Tooltips
  },
  dark: {
    0: '#000000',   // Base background
    1: '#1C1C1E',   // Cards, sheets
    2: '#2C2C2E',   // Elevated cards
    3: '#3A3A3C',   // Modals
    4: '#48484A',   // Popovers
    5: '#636366',   // Tooltips
  },
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Room Type Colors — vibrant, accessible
// ─────────────────────────────────────────────────────────────────────────────
export const RoomColors = {
  bedroom:    '#A78BFA',  // Purple
  kitchen:    '#FBBF24',  // Amber
  bathroom:   '#22D3EE',  // Cyan
  livingRoom: '#34D399',  // Emerald
  office:     '#818CF8',  // Indigo
  garage:     '#9CA3AF',  // Gray
  closet:     '#F472B6',  // Pink
  other:      '#A78BFA',  // Purple
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Priority Colors
// ─────────────────────────────────────────────────────────────────────────────
export const PriorityColors = {
  high:   '#FF453A',
  medium: '#FF9F0A',
  low:    '#30D158',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Progress / Achievement Colors
// ─────────────────────────────────────────────────────────────────────────────
export const ProgressColors = {
  bronze:   '#CD7F32',
  silver:   '#C0C0C0',
  gold:     '#FFD700',
  platinum: '#E5E4E2',
  diamond:  '#B9F2FF',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Activity Ring Colors — Apple Fitness style
// ─────────────────────────────────────────────────────────────────────────────
export const RingColors = {
  tasks:  '#FF375F',  // Red — Move ring
  time:   '#30D158',  // Green — Exercise ring
  streak: '#0A84FF',  // Blue — Stand ring
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Rarity Colors for Collectibles
// ─────────────────────────────────────────────────────────────────────────────
export const RarityColors = {
  common:    '#9CA3AF',
  uncommon:  '#34D399',
  rare:      '#60A5FA',
  epic:      '#A78BFA',
  legendary: '#FBBF24',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Energy Level Colors
// ─────────────────────────────────────────────────────────────────────────────
export const EnergyColors = {
  minimal:     '#34D399',
  light:       '#60A5FA',
  moderate:    '#FBBF24',
  significant: '#F97316',
  intense:     '#EF4444',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Focus Mode Gradient Colors
// ─────────────────────────────────────────────────────────────────────────────
export const FocusColors = {
  gradientPurple: ['#667eea', '#764ba2'] as readonly [string, string],
  gradientGreen:  ['#11998e', '#38ef7d'] as readonly [string, string],
  gradientOrange: ['#f093fb', '#f5576c'] as readonly [string, string],
  gradientBlue:   ['#4facfe', '#00f2fe'] as readonly [string, string],
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Badge Type Colors
// ─────────────────────────────────────────────────────────────────────────────
export const BadgeTypeColors = {
  tasks:   '#FF375F',
  rooms:   '#30D158',
  streak:  '#FBBF24',
  time:    '#0A84FF',
  default: '#BF5AF2',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Mascot Mood Colors
// ─────────────────────────────────────────────────────────────────────────────
export const MascotColors = {
  happy:    '#30D158',
  neutral:  '#0A84FF',
  sleepy:   '#BF5AF2',
  hungry:   '#FBBF24',
  sad:      '#FF453A',
  excited:  '#FF375F',
  ecstatic: '#FFD700',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Shadow Presets — iOS 26 style with colored shadows
// ─────────────────────────────────────────────────────────────────────────────
export const Shadows = {
  none: {},
  xs: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.20,
    shadowRadius: 16,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.24,
    shadowRadius: 32,
    elevation: 12,
  },
  glow: (color: string, intensity: number = 0.4) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: intensity,
    shadowRadius: 16,
    elevation: 8,
  }),
  colored: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 12,
    elevation: 6,
  }),
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Interactive States
// ─────────────────────────────────────────────────────────────────────────────
export const InteractiveStates = {
  light: {
    hoverOverlay:    'rgba(0, 0, 0, 0.04)',
    pressedOverlay:  'rgba(0, 0, 0, 0.08)',
    focusRing:       '#007AFF',
    focusRingWidth:  2,
    disabledOpacity: 0.38,
    activeOpacity:   0.70,
  },
  dark: {
    hoverOverlay:    'rgba(255, 255, 255, 0.08)',
    pressedOverlay:  'rgba(255, 255, 255, 0.12)',
    focusRing:       '#0A84FF',
    focusRingWidth:  2,
    disabledOpacity: 0.38,
    activeOpacity:   0.70,
  },
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Colorblind-Safe Palette
// ─────────────────────────────────────────────────────────────────────────────
export const ColorBlindSafe = {
  light: {
    success: '#0072B2',
    warning: '#E69F00',
    error:   '#D55E00',
    info:    '#56B4E9',
    neutral: '#999999',
  },
  dark: {
    success: '#56B4E9',
    warning: '#F0E442',
    error:   '#CC79A7',
    info:    '#009E73',
    neutral: '#BBBBBB',
  },
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// High Contrast Mode
// ─────────────────────────────────────────────────────────────────────────────
export const HighContrast = {
  light: {
    text:        '#000000',
    textSecondary:'#1A1A1A',
    background:  '#FFFFFF',
    surface:     '#F5F5F5',
    primary:     '#0000EE',
    border:      '#000000',
    success:     '#006400',
    warning:     '#CC6600',
    error:       '#CC0000',
    focus:       '#0000FF',
  },
  dark: {
    text:        '#FFFFFF',
    textSecondary:'#E5E5E5',
    background:  '#000000',
    surface:     '#1A1A1A',
    primary:     '#00FFFF',
    border:      '#FFFFFF',
    success:     '#00FF00',
    warning:     '#FFFF00',
    error:       '#FF6666',
    focus:       '#00FFFF',
  },
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// ADHD-Friendly Calm Palette
// ─────────────────────────────────────────────────────────────────────────────
export const CalmPalette = {
  light: {
    background:      '#F8F9FA',
    surface:         '#FFFFFF',
    surfaceSecondary:'#F1F3F4',
    primary:         '#5F6368',
    accent:          '#1A73E8',
    text:            '#202124',
    textSecondary:   '#5F6368',
    success:         '#34A853',
    border:          '#DADCE0',
  },
  dark: {
    background:      '#1F1F1F',
    surface:         '#2D2D2D',
    surfaceSecondary:'#3C3C3C',
    primary:         '#E8EAED',
    accent:          '#8AB4F8',
    text:            '#E8EAED',
    textSecondary:   '#9AA0A6',
    success:         '#81C995',
    border:          '#5F6368',
  },
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Pencil Design Tokens — exact spec values from Pencil designs
// ─────────────────────────────────────────────────────────────────────────────
export const DesignTokens = {
  dark: {
    background: ['#0A0A0A', '#131313', '#141414'] as const,
    cardFill: 'rgba(255,255,255,0.06)',
    cardBorder: 'rgba(255,255,255,0.07)',
    textPrimary: '#FFFFFF',
    textSecondary: '#707070',
    textMuted: '#888888',
    sectionLabel: 'rgba(255,255,255,0.21)',
    goldAccent: '#C4A87A',
    buttonPrimary: '#FFFFFF',
    buttonSecondary: 'rgba(255,255,255,0.08)',
  },
  light: {
    background: ['#FAFAFA', '#F7F7F7', '#F5F5F5'] as const,
    cardFill: 'rgba(0,0,0,0.03)',
    cardBorder: 'rgba(0,0,0,0.06)',
    textPrimary: '#1A1A1A',
    textSecondary: '#707070',
    textMuted: '#888888',
    sectionLabel: 'rgba(0,0,0,0.25)',
    goldAccent: '#C4A87A',
    buttonPrimary: '#1A1A1A',
    buttonSecondary: 'rgba(0,0,0,0.04)',
  },
} as const;
