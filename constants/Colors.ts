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
    text: '#000000',
    textSecondary: '#666666',
    textTertiary: '#999999',
    background: '#FFFFFF',

    // Surface colors - Clean & Flat
    surface: '#FFFFFF',
    surfaceSecondary: '#F5F5F7', // Off-white for contrast
    surfaceTertiary: '#E5E5EA',
    card: '#FFFFFF',

    primary: '#000000',
    primaryMuted: 'rgba(0, 0, 0, 0.05)',

    border: '#E5E5EA',
    icon: '#000000',
    tabIconDefault: '#999999',
    tabIconSelected: '#000000',

    // Semantic - Clean, standard iOS colors
    success: '#34C759',
    successMuted: 'rgba(52, 199, 89, 0.12)',
    warning: '#FF9500',
    warningMuted: 'rgba(255, 149, 0, 0.12)',
    error: '#FF3B30',
    errorMuted: 'rgba(255, 59, 48, 0.12)',
    danger: '#FF3B30',
    dangerMuted: 'rgba(255, 59, 48, 0.12)',
    info: '#007AFF',
    infoMuted: 'rgba(0, 122, 255, 0.12)',

    // Legacy Gradient support (mapped to solids/subtle gradients for compatibility)
    gradientPrimary: ['#000000', '#333333'] as GradientTuple,
    gradientSuccess: ['#34C759', '#34C759'] as GradientTuple,
    gradientAccent: ['#000000', '#333333'] as GradientTuple,
    gradientWarm: ['#FF9500', '#FF9500'] as GradientTuple,
    gradientCool: ['#007AFF', '#007AFF'] as GradientTuple,
    gradientPremium: ['#000000', '#000000'] as GradientTuple,
    gradientAction: ['#007AFF', '#007AFF'] as GradientTuple,

    chart: ['#000000', '#666666', '#999999', '#D1D1D6'],
  },
  dark: {
    text: '#FFFFFF',
    textSecondary: '#999999', // Higher contrast for dark mode
    textTertiary: '#666666',
    background: '#000000',

    // Surface colors - Dark Mode
    surface: '#1C1C1E', // System Gray 6
    surfaceSecondary: '#2C2C2E', // System Gray 5
    surfaceTertiary: '#3A3A3C',

    primary: '#FFFFFF',
    primaryMuted: 'rgba(255, 255, 255, 0.1)',

    border: '#38383A',
    icon: '#FFFFFF',
    tabIconDefault: '#666666',
    tabIconSelected: '#FFFFFF',

    // Semantic
    success: '#30D158',
    successMuted: 'rgba(48, 209, 88, 0.15)',
    warning: '#FF9F0A',
    warningMuted: 'rgba(255, 159, 10, 0.15)',
    error: '#FF453A',
    errorMuted: 'rgba(255, 69, 58, 0.15)',
    danger: '#FF453A',
    dangerMuted: 'rgba(255, 69, 58, 0.15)',
    info: '#0A84FF',
    infoMuted: 'rgba(10, 132, 255, 0.15)',
    card: '#1C1C1E',

    // Legacy Gradient support
    gradientPrimary: ['#FFFFFF', '#E5E5EA'] as GradientTuple,
    gradientSuccess: ['#30D158', '#30D158'] as GradientTuple,
    gradientAccent: ['#FFFFFF', '#E5E5EA'] as GradientTuple,
    gradientWarm: ['#FF9F0A', '#FF9F0A'] as GradientTuple,
    gradientCool: ['#0A84FF', '#0A84FF'] as GradientTuple,
    gradientPremium: ['#FFFFFF', '#E5E5EA'] as GradientTuple,
    gradientAction: ['#0A84FF', '#0A84FF'] as GradientTuple,

    chart: ['#FFFFFF', '#D1D1D6', '#8E8E93', '#48484A'],
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
