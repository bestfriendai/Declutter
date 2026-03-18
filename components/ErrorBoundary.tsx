/**
 * Declutterly - Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree
 * and displays a fallback UI instead of crashing the whole app.
 *
 * ADHD-friendly:
 * - Clear, calming language (no jargon)
 * - Obvious primary action (Try Again)
 * - Secondary escape hatch (Go Home)
 * - Never blames the user
 */

import React, { Component, ReactNode } from 'react';
import { View, Text, Pressable, StyleSheet, Linking } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/Colors';
import { router, useSegments } from 'expo-router';
import { logger } from '@/services/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  retryCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    retryCount: 0,
  };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });

    // Log to error reporting service (Sentry, etc.)
    logger.error('ErrorBoundary caught an error:', error, errorInfo);

    // Call optional error callback
    this.props.onError?.(error, errorInfo);

    // In production, you would send this to an error tracking service
    // Example: Sentry.captureException(error, { extra: errorInfo });
  }

  handleRetry = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    this.setState(prev => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prev.retryCount + 1,
    }));
  };

  handleGoHome = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    this.setState({ hasError: false, error: null, errorInfo: null, retryCount: 0 });
    try {
      router.replace('/(tabs)');
    } catch {
      // If router fails too, at least we cleared the error state
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorFallback
          error={this.state.error}
          retryCount={this.state.retryCount}
          onRetry={this.handleRetry}
          onGoHome={this.handleGoHome}
        />
      );
    }

    return this.props.children;
  }
}

// Fallback UI component (uses hooks so it's a separate function)
interface ErrorFallbackProps {
  error: Error | null;
  retryCount: number;
  onRetry: () => void;
  onGoHome: () => void;
}

function ErrorFallback({ error, retryCount, onRetry, onGoHome }: ErrorFallbackProps) {
  const colorScheme = useColorScheme() ?? 'dark';
  const isDark = colorScheme === 'dark';
  const colors = Colors[colorScheme];

  const showHomeButton = retryCount >= 1; // Show home button after first retry fails

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.iconContainer, { backgroundColor: colors.errorMuted }]}>
        <Text style={styles.emoji}>{retryCount >= 2 ? '🧹' : '😵'}</Text>
      </View>

      <Text style={[styles.title, { color: colors.text }]}>
        {retryCount >= 2 ? 'Still having trouble' : 'Something went sideways'}
      </Text>

      <Text style={[styles.message, { color: colors.textSecondary }]}>
        {retryCount >= 2
          ? "This part of the app is being stubborn. Try heading home or restarting the app."
          : "Don't worry, your data is safe. This is a glitch, not your fault."}
      </Text>

      {__DEV__ && error && (
        <View style={[styles.errorDetails, { backgroundColor: colors.surfaceSecondary }]}>
          <Text style={[styles.errorText, { color: colors.error }]} numberOfLines={4}>
            {error.name}: {error.message}
          </Text>
        </View>
      )}

      <View style={styles.buttonGroup}>
        <Pressable
          onPress={onRetry}
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Try again"
          accessibilityHint="Attempts to reload the content"
        >
          <Text style={[styles.buttonText, { color: colors.textOnPrimary }]}>
            Try Again
          </Text>
        </Pressable>

        {showHomeButton && (
          <Pressable
            onPress={onGoHome}
            style={({ pressed }) => [
              styles.secondaryButton,
              {
                borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)',
                opacity: pressed ? 0.7 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Go to home screen"
          >
            <Text style={[styles.secondaryBtnText, { color: colors.textSecondary }]}>
              Go Home
            </Text>
          </Pressable>
        )}
      </View>

      <Pressable
        onPress={() => Linking.openURL('mailto:support@declutterly.app?subject=App%20Error%20Report')}
        accessibilityRole="link"
      >
        <Text style={[styles.supportText, { color: colors.textTertiary }]}>
          {retryCount >= 2
            ? 'Still broken? Tap here to report it.'
            : 'If this keeps happening, contact support.'}
        </Text>
      </Pressable>
    </View>
  );
}

// Screen-level error boundary for individual screens
interface ScreenErrorBoundaryProps {
  children: ReactNode;
  screenName?: string;
}

export function ScreenErrorBoundary({ children, screenName }: ScreenErrorBoundaryProps) {
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    logger.error(`Error in screen ${screenName || 'unknown'}:`, error, errorInfo);
    // Log to analytics/error tracking
  };

  return (
    <ErrorBoundary onError={handleError}>
      {children}
    </ErrorBoundary>
  );
}

export function RouteErrorBoundary({ children }: { children: ReactNode }) {
  const segments = useSegments();
  const screenName = segments.join('/') || 'root';

  return (
    <ScreenErrorBoundary screenName={screenName}>
      {children}
    </ScreenErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emoji: {
    fontSize: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
    maxWidth: 300,
  },
  errorDetails: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    maxWidth: '100%',
  },
  errorText: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
  buttonGroup: {
    gap: 12,
    alignItems: 'center',
    width: '100%',
    maxWidth: 240,
  },
  button: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 14,
    minWidth: 200,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
    minWidth: 200,
    alignItems: 'center',
    borderWidth: 1,
  },
  secondaryBtnText: {
    fontSize: 16,
    fontWeight: '500',
  },
  supportText: {
    fontSize: 13,
    marginTop: 24,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
});

export default ErrorBoundary;
