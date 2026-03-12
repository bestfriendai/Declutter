/**
 * Declutterly - Spacing Constants
 * Standardized spacing values for consistent layout throughout the app
 * Based on an 8-point grid system with Apple HIG compliance
 */

// Base spacing unit (8px)
const BASE_UNIT = 8;

// Core spacing scale
export const Spacing = {
  // 0px - No spacing
  none: 0,

  // 2px - Hairline spacing
  hairline: 2,

  // 4px - Extra extra small
  xxs: 4,

  // 8px - Extra small
  xs: BASE_UNIT,

  // 12px - Small
  sm: BASE_UNIT * 1.5,

  // 16px - Medium (default)
  md: BASE_UNIT * 2,

  // 20px - Medium large
  ml: BASE_UNIT * 2.5,

  // 24px - Large
  lg: BASE_UNIT * 3,

  // 32px - Extra large
  xl: BASE_UNIT * 4,

  // 40px - Extra extra large
  xxl: BASE_UNIT * 5,

  // 48px - Huge
  huge: BASE_UNIT * 6,

  // 56px - Giant
  giant: BASE_UNIT * 7,

  // 64px - Massive
  massive: BASE_UNIT * 8,
};

// Screen/Container padding
export const ScreenPadding = {
  // Horizontal padding for screens
  horizontal: Spacing.ml, // 20px

  // Vertical padding for screens
  vertical: Spacing.ml, // 20px

  // Top padding (below safe area)
  top: Spacing.ml, // 20px

  // Bottom padding (above tab bar/safe area)
  bottom: Spacing.lg, // 24px
};

// Card-specific spacing
export const CardSpacing = {
  // Default card padding
  padding: Spacing.ml, // 20px

  // Compact card padding
  paddingCompact: Spacing.md, // 16px

  // Large card padding
  paddingLarge: Spacing.lg, // 24px

  // Card margin between cards
  margin: Spacing.sm, // 12px

  // Inner content spacing
  contentGap: Spacing.sm, // 12px
};

// Component gaps
export const Gaps = {
  // Tiny gap between inline elements
  inline: Spacing.xxs, // 4px

  // Small gap for tight layouts
  small: Spacing.xs, // 8px

  // Default gap for most layouts
  default: Spacing.sm, // 12px

  // Medium gap for section content
  medium: Spacing.md, // 16px

  // Large gap between sections
  section: Spacing.lg, // 24px

  // Extra large gap for major sections
  sectionLarge: Spacing.xl, // 32px
};

// List item spacing
export const ListSpacing = {
  // Vertical padding for list items
  itemPadding: Spacing.md, // 16px

  // Horizontal padding for list items
  itemPaddingHorizontal: Spacing.md, // 16px

  // Gap between list items
  itemGap: Spacing.sm, // 12px

  // Section header margin
  sectionHeaderMargin: Spacing.xs, // 8px

  // Separator inset
  separatorInset: Spacing.md, // 16px
};

// Button spacing
export const ButtonSpacing = {
  // Small button padding
  paddingSmall: {
    vertical: Spacing.xs, // 8px
    horizontal: Spacing.md, // 16px
  },

  // Medium button padding
  paddingMedium: {
    vertical: 14,
    horizontal: Spacing.lg, // 24px
  },

  // Large button padding
  paddingLarge: {
    vertical: 18,
    horizontal: Spacing.xl, // 32px
  },

  // Icon button size
  iconButtonSize: 44, // Apple HIG minimum touch target

  // Gap between button and icon
  iconGap: Spacing.xs, // 8px
};

// Form spacing
export const FormSpacing = {
  // Gap between form fields
  fieldGap: Spacing.md, // 16px

  // Label margin bottom
  labelMargin: Spacing.xs, // 8px

  // Input padding
  inputPadding: {
    vertical: Spacing.sm, // 12px
    horizontal: Spacing.md, // 16px
  },

  // Helper text margin
  helperTextMargin: Spacing.xxs, // 4px

  // Section gap in forms
  sectionGap: Spacing.xl, // 32px
};

// Modal and sheet spacing
export const ModalSpacing = {
  // Modal padding
  padding: Spacing.lg, // 24px

  // Modal header margin bottom
  headerMargin: Spacing.ml, // 20px

  // Modal footer margin top
  footerMargin: Spacing.lg, // 24px

  // Bottom sheet handle margin
  handleMargin: Spacing.sm, // 12px
};

// Icon spacing
export const IconSpacing = {
  // Small icon container
  containerSmall: 32,

  // Medium icon container
  containerMedium: 40,

  // Large icon container
  containerLarge: 48,

  // Icon margin in lists
  listMargin: Spacing.sm, // 12px
};

// Border radius values
export const BorderRadius = {
  // No radius
  none: 0,

  // Small radius for subtle rounding
  xs: 4,

  // Small radius
  sm: 8,

  // Medium radius for cards
  md: 12,

  // Default radius for most components
  default: 14,

  // Large radius for cards and modals
  lg: 16,

  // Extra large radius
  xl: 20,

  // Extra extra large radius
  xxl: 24,

  // Full circle
  full: 9999,

  // Specific component radii
  button: 14,
  card: 20,
  input: 12,
  modal: 24,
  chip: 16,
  avatar: 9999, // Full circle
};

// Touch target sizes (Apple HIG compliance)
export const TouchTargets = {
  // Minimum touch target size (iOS HIG minimum)
  minimum: 44,

  // Recommended touch target size (comfortable for all users)
  recommended: 48,

  // Comfortable touch target for better accessibility
  comfortable: 48,

  // Large touch target for primary actions
  large: 56,

  // Accessible touch target for motor impairments
  accessible: 56,
};

// Responsive multipliers for different device sizes
export const ResponsiveMultipliers = {
  // Standard phone (iPhone SE, iPhone 13 mini)
  phone: 1.0,

  // Large phone (iPhone 13, 14, 15)
  phoneLarge: 1.1,

  // Tablet (iPad Mini)
  tablet: 1.25,

  // Large tablet (iPad Pro)
  tabletLarge: 1.4,
};

// ADHD-friendly comfortable spacing variants
export const ComfortableSpacing = {
  // Increased spacing for reduced visual clutter
  screenPadding: Spacing.lg, // 24px instead of 20px

  // More breathing room between cards
  cardGap: Spacing.md, // 16px instead of 12px

  // Larger margins between sections
  sectionGap: Spacing.xl, // 32px instead of 24px

  // More padding inside cards
  cardPadding: Spacing.lg, // 24px instead of 20px

  // Larger text spacing
  lineHeight: 1.6, // vs standard 1.4
};

// Safe area defaults (fallbacks when insets are not available)
export const SafeAreaDefaults = {
  top: 44,
  bottom: 34,
  left: 0,
  right: 0,
};

// Helper function to calculate responsive spacing
export const responsive = {
  // Scale spacing based on screen width
  scale: (baseValue: number, screenWidth: number, baseWidth: number = 375) => {
    return baseValue * (screenWidth / baseWidth);
  },

  // Clamp spacing between min and max
  clamp: (value: number, min: number, max: number) => {
    return Math.min(Math.max(value, min), max);
  },
};

export default {
  Spacing,
  ScreenPadding,
  CardSpacing,
  Gaps,
  ListSpacing,
  ButtonSpacing,
  FormSpacing,
  ModalSpacing,
  IconSpacing,
  BorderRadius,
  TouchTargets,
  SafeAreaDefaults,
  responsive,
  ResponsiveMultipliers,
  ComfortableSpacing,
};
