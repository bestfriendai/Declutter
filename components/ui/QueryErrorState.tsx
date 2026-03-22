/**
 * QueryErrorState -- Reusable error/timeout state for Convex queries
 *
 * Shows when data is unexpectedly undefined after loading,
 * or when a query has failed. Provides a retry action.
 *
 * ADHD-friendly: clear message, obvious action, no jargon.
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AlertTriangle, WifiOff, RefreshCw } from 'lucide-react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { V1, getTheme, RADIUS, BODY_FONT, DISPLAY_FONT } from '@/constants/designTokens';
import * as Haptics from 'expo-haptics';

export type QueryErrorVariant = 'network' | 'timeout' | 'error';

interface QueryErrorStateProps {
  /** Which icon/message variant to show */
  variant?: QueryErrorVariant;
  /** Custom title override */
  title?: string;
  /** Custom message override */
  message?: string;
  /** Called when user taps "Try Again" */
  onRetry?: () => void;
  /** Hide the retry button entirely */
  hideRetry?: boolean;
}

export function QueryErrorState({
  variant = 'error',
  title,
  message,
  onRetry,
  hideRetry = false,
}: QueryErrorStateProps) {
  const rawScheme = useColorScheme() ?? 'dark';
  const isDark = rawScheme === 'dark';
  const t = getTheme(isDark);

  const config = VARIANT_CONFIG[variant];

  const handleRetry = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onRetry?.();
  };

  const IconComponent = config.icon;

  return (
    <View
      style={[styles.container, { backgroundColor: t.bg }]}
      accessibilityRole="alert"
      accessibilityLabel={title ?? config.title}
    >
      <View
        style={[
          styles.iconWrap,
          {
            backgroundColor: isDark
              ? 'rgba(255,107,107,0.12)'
              : 'rgba(255,107,107,0.08)',
          },
        ]}
      >
        <IconComponent size={32} color={V1.coral} />
      </View>

      <Text style={[styles.title, { color: t.text, fontFamily: DISPLAY_FONT }]}>
        {title ?? config.title}
      </Text>

      <Text style={[styles.message, { color: t.textSecondary, fontFamily: BODY_FONT }]}>
        {message ?? config.message}
      </Text>

      {!hideRetry && onRetry && (
        <Pressable
          onPress={handleRetry}
          accessibilityRole="button"
          accessibilityLabel="Try again"
          style={({ pressed }) => [
            styles.retryButton,
            {
              backgroundColor: V1.coral,
              borderRadius: RADIUS.md,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <RefreshCw size={16} color="#FFFFFF" />
          <Text style={styles.retryText}>Try Again</Text>
        </Pressable>
      )}
    </View>
  );
}

// ── Variant configs ──────────────────────────────────────────────────────────

const VARIANT_CONFIG: Record<
  QueryErrorVariant,
  { icon: typeof AlertTriangle; title: string; message: string }
> = {
  network: {
    icon: WifiOff,
    title: 'No connection',
    message: "Looks like you're offline. Check your internet and try again.",
  },
  timeout: {
    icon: AlertTriangle,
    title: 'Taking too long',
    message: "Data loading slowly. Tap to continue with cached data.",
  },
  error: {
    icon: AlertTriangle,
    title: 'Something went wrong',
    message: "Don't worry, your data is safe. Let's try loading it again.",
  },
};

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  message: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 28,
    paddingVertical: 14,
    marginTop: 8,
    minWidth: 160,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: BODY_FONT,
  },
});
