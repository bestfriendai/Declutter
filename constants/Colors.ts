/**
 * Declutterly - Apple TV 2025 Design System
 * Cinematic dark theme with glass effects and premium aesthetics
 */

// Gradient tuple type for LinearGradient compatibility
type GradientTuple = readonly [string, string];

// Primary accent - Vibrant purple-blue gradient base
const primaryLight = '#7C3AED';
const primaryDark = '#A78BFA';

// Success colors for task completion
const successLight = '#10B981';
const successDark = '#34D399';

// Warning/Priority colors
const warningLight = '#F59E0B';
const warningDark = '#FBBF24';
const dangerLight = '#EF4444';
const dangerDark = '#F87171';

export const Colors = {
  light: {
    // Text hierarchy
    text: '#000000',
    textSecondary: '#3C3C43',
    textTertiary: '#8E8E93',

    // Backgrounds - Apple TV light style
    background: '#F2F2F7',
    backgroundElevated: '#FFFFFF',
    backgroundSecondary: '#E5E5EA',

    // Cards and surfaces
    card: '#FFFFFF',
    cardElevated: '#FFFFFF',
    cardPressed: '#F2F2F7',
    surfaceSecondary: '#E5E5EA',

    // Primary colors
    tint: primaryLight,
    primary: primaryLight,
    primaryMuted: 'rgba(124, 58, 237, 0.15)',

    // Semantic colors
    success: successLight,
    successMuted: 'rgba(16, 185, 129, 0.15)',
    warning: warningLight,
    warningMuted: 'rgba(245, 158, 11, 0.15)',
    danger: dangerLight,
    dangerMuted: 'rgba(239, 68, 68, 0.15)',

    // Icons
    icon: '#3C3C43',
    iconSecondary: '#8E8E93',
    tabIconDefault: '#8E8E93',
    tabIconSelected: primaryLight,

    // Borders and separators
    border: 'rgba(60, 60, 67, 0.12)',
    separator: 'rgba(60, 60, 67, 0.08)',

    // Glass materials
    glassBg: 'rgba(255, 255, 255, 0.8)',
    glassUltraThin: 'rgba(255, 255, 255, 0.4)',
    glassThin: 'rgba(255, 255, 255, 0.6)',
    glassRegular: 'rgba(255, 255, 255, 0.75)',
    glassThick: 'rgba(255, 255, 255, 0.9)',

    // Overlays
    overlay: 'rgba(0, 0, 0, 0.3)',
    overlayLight: 'rgba(0, 0, 0, 0.1)',

    // Gradients (as tuples for LinearGradient)
    gradientPrimary: ['#7C3AED', '#6366F1'] as GradientTuple,
    gradientSuccess: ['#10B981', '#059669'] as GradientTuple,
    gradientAccent: ['#EC4899', '#8B5CF6'] as GradientTuple,
    gradientWarm: ['#F59E0B', '#EF4444'] as GradientTuple,
    gradientCool: ['#06B6D4', '#3B82F6'] as GradientTuple,
  },

  dark: {
    // Text hierarchy - Apple TV style
    text: '#FFFFFF',
    textSecondary: 'rgba(255, 255, 255, 0.7)',
    textTertiary: 'rgba(255, 255, 255, 0.5)',

    // Backgrounds - Cinematic black
    background: '#000000',
    backgroundElevated: '#1C1C1E',
    backgroundSecondary: '#2C2C2E',

    // Cards and surfaces - Apple TV elevated style
    card: '#1C1C1E',
    cardElevated: '#2C2C2E',
    cardPressed: '#3A3A3C',
    surfaceSecondary: '#2C2C2E',

    // Primary colors
    tint: primaryDark,
    primary: primaryDark,
    primaryMuted: 'rgba(167, 139, 250, 0.2)',

    // Semantic colors
    success: successDark,
    successMuted: 'rgba(52, 211, 153, 0.2)',
    warning: warningDark,
    warningMuted: 'rgba(251, 191, 36, 0.2)',
    danger: dangerDark,
    dangerMuted: 'rgba(248, 113, 113, 0.2)',

    // Icons
    icon: 'rgba(255, 255, 255, 0.85)',
    iconSecondary: 'rgba(255, 255, 255, 0.55)',
    tabIconDefault: 'rgba(255, 255, 255, 0.5)',
    tabIconSelected: primaryDark,

    // Borders and separators
    border: 'rgba(255, 255, 255, 0.1)',
    separator: 'rgba(255, 255, 255, 0.06)',

    // Glass materials - Apple TV style
    glassBg: 'rgba(30, 30, 30, 0.8)',
    glassUltraThin: 'rgba(30, 30, 30, 0.4)',
    glassThin: 'rgba(30, 30, 30, 0.6)',
    glassRegular: 'rgba(40, 40, 40, 0.75)',
    glassThick: 'rgba(50, 50, 50, 0.9)',

    // Overlays
    overlay: 'rgba(0, 0, 0, 0.6)',
    overlayLight: 'rgba(0, 0, 0, 0.3)',

    // Gradients (as tuples for LinearGradient)
    gradientPrimary: ['#A78BFA', '#818CF8'] as GradientTuple,
    gradientSuccess: ['#34D399', '#10B981'] as GradientTuple,
    gradientAccent: ['#F472B6', '#A78BFA'] as GradientTuple,
    gradientWarm: ['#FBBF24', '#F87171'] as GradientTuple,
    gradientCool: ['#22D3EE', '#60A5FA'] as GradientTuple,
  },
};

// Room type colors with enhanced vibrancy
export const RoomColors = {
  bedroom: '#A78BFA',    // Purple
  kitchen: '#FBBF24',    // Amber
  bathroom: '#22D3EE',   // Cyan
  livingRoom: '#34D399', // Emerald
  office: '#818CF8',     // Indigo
  garage: '#9CA3AF',     // Gray
  closet: '#F472B6',     // Pink
  other: '#A78BFA',      // Purple
};

// Priority colors
export const PriorityColors = {
  high: '#F87171',
  medium: '#FBBF24',
  low: '#34D399',
};

// Progress/Achievement colors
export const ProgressColors = {
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#FFD700',
  platinum: '#E5E4E2',
  diamond: '#B9F2FF',
};

// Activity ring colors (Apple Fitness style)
export const RingColors = {
  tasks: '#F87171',     // Red - Move ring style
  time: '#34D399',      // Green - Exercise ring style
  streak: '#60A5FA',    // Blue - Stand ring style
};

// Rarity colors for collectibles
export const RarityColors = {
  common: '#9CA3AF',
  uncommon: '#34D399',
  rare: '#60A5FA',
  epic: '#A78BFA',
  legendary: '#FBBF24',
};

// Shadow presets
export const Shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  glow: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 6,
  }),
};
