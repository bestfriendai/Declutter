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
    inputBg: '#141414',
    inputBorder: 'rgba(255,255,255,0.12)',
  },
  light: {
    bg: '#FAFAFA',
    card: '#FFFFFF',
    cardElevated: '#FFFFFF',
    border: '#E5E7EB',
    text: '#1A1A1A',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',
    inputBg: '#FFFFFF',
    inputBorder: '#E5E7EB',
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

// ─── Animation Constants ───────────────────────────────────────────────────
export const ANIMATION = {
  spring: {
    gentle: { damping: 20, stiffness: 150, mass: 0.8 },
    snappy: { damping: 15, stiffness: 300, mass: 0.8 },
    bouncy: { damping: 8, stiffness: 200, mass: 0.8 },
    stiff: { damping: 20, stiffness: 400, mass: 0.6 },
  },
  duration: {
    instant: 100,
    fast: 200,
    normal: 350,
    slow: 600,
    entrance: 500,
  },
  stagger: {
    fast: 50,
    normal: 80,
    slow: 120,
  },
} as const;

// ─── Button Style Helpers ──────────────────────────────────────────────────
export function coralButtonStyle() {
  return {
    backgroundColor: V1.coral,
    borderRadius: 28,
    height: 56,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  } as const;
}

export function coralButtonTextStyle() {
  return {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700' as const,
    fontFamily: BODY_FONT,
    letterSpacing: 0.3,
  } as const;
}

export function outlineButtonStyle(isDark: boolean) {
  const t = isDark ? V1.dark : V1.light;
  return {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: t.border,
  } as const;
}

// ─── Input Field Style Helper ──────────────────────────────────────────────
export function inputFieldStyle(isDark: boolean) {
  const t = isDark ? V1.dark : V1.light;
  return {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    gap: 12,
    backgroundColor: t.inputBg,
    borderColor: t.inputBorder,
  } as const;
}
