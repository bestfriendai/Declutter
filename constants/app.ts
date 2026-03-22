/**
 * Declutterly -- Shared App Constants
 * Single source of truth for room types, energy levels, time options, and XP.
 */

// Dev/test bypass — set to true to skip auth and paywall screens
export const DEV_SKIP_AUTH = __DEV__ && true; // Flip to true for testing

// Room types used across the app
export const ROOM_TYPES = ['bedroom', 'kitchen', 'bathroom', 'living', 'office', 'closet'] as const;
export type RoomType = typeof ROOM_TYPES[number];

export const ROOM_TYPE_LABELS: Record<RoomType, string> = {
  bedroom: 'Bedroom',
  kitchen: 'Kitchen',
  bathroom: 'Bathroom',
  living: 'Living Room',
  office: 'Office',
  closet: 'Closet',
};

// Energy levels
export const ENERGY_LEVELS = ['exhausted', 'low', 'moderate', 'high', 'hyperfocused'] as const;
export type EnergyLevel = typeof ENERGY_LEVELS[number];

export const ENERGY_LEVEL_LABELS: Record<EnergyLevel, string> = {
  exhausted: 'Exhausted',
  low: 'Low Energy',
  moderate: 'Moderate',
  high: 'High Energy',
  hyperfocused: 'Hyperfocused',
};

// Time options for sessions
export const TIME_OPTIONS = [5, 15, 30, 60] as const;

// XP system — must match context/DeclutterContext.tsx calculateLevel()
export const XP_PER_LEVEL = 100;
