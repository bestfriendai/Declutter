/**
 * Declutterly -- Shared V1 Design Tokens
 * Single source of truth for all screens.
 */

// ─── Fonts ──────────────────────────────────────────────────────────────────
export const BODY_FONT = 'DM Sans';
export const DISPLAY_FONT = 'Bricolage Grotesque';

// ─── V1 Color Palette ───────────────────────────────────────────────────────
export const V1 = {
  coral: '#FF6B6B',
  coralLight: '#FF8E8E',
  green: '#66BB6A',
  amber: '#FFB74D',
  gold: '#FFD54F',
  blue: '#64B5F6',
  indigo: '#6366F1',
  dark: {
    bg: '#0C0C0C',
    card: '#1A1A1A',
    cardElevated: '#222222',
    border: 'rgba(255,255,255,0.08)',
    text: '#FFFFFF',
    textSecondary: 'rgba(255,255,255,0.5)',
    textMuted: 'rgba(255,255,255,0.3)',
  },
  light: {
    bg: '#FAFAFA',
    card: '#FFFFFF',
    cardElevated: '#FFFFFF',
    border: '#E5E7EB',
    text: '#1A1A1A',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',
  },
} as const;

// ─── Theme Helper ───────────────────────────────────────────────────────────
export function getTheme(isDark: boolean) {
  return isDark ? V1.dark : V1.light;
}

// ─── Shadows ────────────────────────────────────────────────────────────────
export const CARD_SHADOW = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 2,
} as const;

export const CARD_SHADOW_SM = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.04,
  shadowRadius: 4,
  elevation: 1,
} as const;

export const CARD_SHADOW_LG = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.08,
  shadowRadius: 16,
  elevation: 4,
} as const;

// ─── Radii ──────────────────────────────────────────────────────────────────
export const RADIUS = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  pill: 9999,
} as const;

// ─── Spacing ────────────────────────────────────────────────────────────────
export const SPACING = {
  screenPadding: 20,
  cardPadding: 16,
  sectionGap: 20,
  itemGap: 12,
} as const;

// ─── Card Style Helpers ─────────────────────────────────────────────────────
export function cardStyle(isDark: boolean) {
  const t = isDark ? V1.dark : V1.light;
  return {
    backgroundColor: t.card,
    borderColor: t.border,
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    ...(isDark ? {} : CARD_SHADOW),
  } as const;
}

export function cardStyleSm(isDark: boolean) {
  const t = isDark ? V1.dark : V1.light;
  return {
    backgroundColor: t.card,
    borderColor: t.border,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    ...(isDark ? {} : CARD_SHADOW_SM),
  } as const;
}
