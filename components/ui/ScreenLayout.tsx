/**
 * Declutterly — Screen Layout (Apple 2026)
 * Adaptive background, safe area, optional nav bar, scroll wrapper
 */

import { Colors } from '@/constants/Colors';
import { Typography } from '@/theme/typography';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/useColorScheme';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface ScreenLayoutProps {
  children: React.ReactNode;

  /** Screen title shown in nav bar */
  title?: string;

  /** Show back button */
  showBack?: boolean;

  /** Custom back handler */
  onBack?: () => void;

  /** Right nav bar item */
  rightItem?: React.ReactNode;

  /** Wrap content in ScrollView */
  scrollable?: boolean;

  /** Use gradient background */
  gradient?: boolean;

  /** Custom gradient colors */
  gradientColors?: readonly [string, string, ...string[]];

  /** Extra padding at bottom (for tab bar) */
  bottomPadding?: number;

  /** Horizontal padding */
  horizontalPadding?: number;

  /** Style for the content container */
  contentStyle?: StyleProp<ViewStyle>;

  /** Keyboard avoiding behavior */
  keyboardAvoiding?: boolean;

  /** Hide nav bar entirely */
  hideNavBar?: boolean;

  /** Large title style (iOS style) */
  largeTitleMode?: boolean;

  /** Accessibility label for the screen */
  accessibilityLabel?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// ScreenLayout Component
// ─────────────────────────────────────────────────────────────────────────────
export function ScreenLayout({
  children,
  title,
  showBack = false,
  onBack,
  rightItem,
  scrollable = false,
  gradient = false,
  gradientColors,
  bottomPadding = 0,
  horizontalPadding = 20,
  contentStyle,
  keyboardAvoiding = false,
  hideNavBar = false,
  largeTitleMode = false,
  accessibilityLabel,
}: ScreenLayoutProps) {
  const rawScheme = useColorScheme();
  const colorScheme = rawScheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  // Default gradient colors
  const defaultGradient = isDark
    ? (['#000000', '#0A0A0F', '#000000'] as const)
    : (['#F2F2F7', '#FFFFFF', '#F2F2F7'] as const);

  const activeGradient = gradientColors ?? defaultGradient;

  // Nav bar
  const navBar = !hideNavBar && (title || showBack || rightItem) ? (
    <View
      style={[
        styles.navBar,
        {
          paddingTop: insets.top + 8,
          borderBottomWidth: largeTitleMode ? 0 : StyleSheet.hairlineWidth,
          borderBottomColor: isDark ? colors.divider : colors.borderLight,
        },
      ]}
      accessibilityRole="header"
    >
      {/* Back button */}
      <View style={styles.navLeft}>
        {showBack && (
          <Pressable
            onPress={handleBack}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={8}
          >
            <Text style={[styles.backChevron, { color: colors.accent }]}>‹</Text>
            <Text style={[Typography.body, { color: colors.accent }]}>Back</Text>
          </Pressable>
        )}
      </View>

      {/* Title */}
      {title && !largeTitleMode && (
        <Text
          style={[Typography.navTitle, { color: colors.text }]}
          numberOfLines={1}
          accessibilityRole="header"
        >
          {title}
        </Text>
      )}

      {/* Right item */}
      <View style={styles.navRight}>
        {rightItem}
      </View>
    </View>
  ) : (
    // Just safe area top padding when no nav bar
    !hideNavBar ? <View style={{ height: insets.top }} /> : null
  );

  // Large title (below nav bar)
  const largeTitle = largeTitleMode && title ? (
    <View style={[styles.largeTitleContainer, { paddingHorizontal: horizontalPadding }]}>
      <Text style={[Typography.largeTitle, { color: colors.text }]}>{title}</Text>
    </View>
  ) : null;

  // Content
  const contentPaddingStyle: ViewStyle = {
    paddingHorizontal: horizontalPadding,
    paddingBottom: insets.bottom + bottomPadding + 16,
    paddingTop: largeTitleMode ? 8 : 16,
  };

  const content = scrollable ? (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={[contentPaddingStyle, contentStyle]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentInsetAdjustmentBehavior="automatic"
    >
      {largeTitle}
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, contentPaddingStyle, contentStyle]}>
      {largeTitle}
      {children}
    </View>
  );

  const inner = (
    <View
      style={[styles.container, { backgroundColor: colors.background }]}
      accessibilityLabel={accessibilityLabel}
    >
      {gradient && (
        <LinearGradient
          colors={activeGradient}
          style={StyleSheet.absoluteFill}
        />
      )}
      {navBar}
      {content}
    </View>
  );

  if (keyboardAvoiding) {
    return (
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {inner}
      </KeyboardAvoidingView>
    );
  }

  return inner;
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1 },

  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    minHeight: 44,
  },
  navLeft: {
    minWidth: 80,
    alignItems: 'flex-start',
  },
  navRight: {
    minWidth: 80,
    alignItems: 'flex-end',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    minHeight: 44,
    minWidth: 44,
  },
  backChevron: {
    fontSize: 28,
    fontWeight: '300',
    lineHeight: 32,
    marginTop: -2,
  },

  largeTitleContainer: {
    paddingBottom: 8,
  },

  scrollView: { flex: 1 },
  content: { flex: 1 },
});

export default ScreenLayout;
