/**
 * Declutterly - Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree
 * and displays a fallback UI instead of crashing the whole app.
 */

import React, { Component, ReactNode } from 'react';
import { View, Text, Pressable, StyleSheet, useColorScheme } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/Colors';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    
    // Log to error reporting service (Sentry, etc.)
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Call optional error callback
    this.props.onError?.(error, errorInfo);
    
    // In production, you would send this to an error tracking service
    // Example: Sentry.captureException(error, { extra: errorInfo });
  }

  handleRetry = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return <ErrorFallback error={this.state.error} onRetry={this.handleRetry} />;
    }

    return this.props.children;
  }
}

// Fallback UI component (uses hooks so it's a separate function)
interface ErrorFallbackProps {
  error: Error | null;
  onRetry: () => void;
}

function ErrorFallback({ error, onRetry }: ErrorFallbackProps) {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.iconContainer, { backgroundColor: colors.errorMuted }]}>
        <Text style={styles.emoji}>😵</Text>
      </View>
      
      <Text style={[styles.title, { color: colors.text }]}>
        Something went wrong
      </Text>
      
      <Text style={[styles.message, { color: colors.textSecondary }]}>
        {"Don't worry, your data is safe. Please try again."}
      </Text>
      
      {__DEV__ && error && (
        <View style={[styles.errorDetails, { backgroundColor: colors.surfaceSecondary }]}>
          <Text style={[styles.errorText, { color: colors.error }]}>
            {error.name}: {error.message}
          </Text>
        </View>
      )}
      
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
        <Text style={[styles.buttonText, { color: colorScheme === 'dark' ? '#000' : '#FFF' }]}>
          Try Again
        </Text>
      </Pressable>
      
      <Text style={[styles.supportText, { color: colors.textTertiary }]}>
        If this keeps happening, please restart the app
      </Text>
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
    console.error(`Error in screen ${screenName || 'unknown'}:`, error, errorInfo);
    // Log to analytics/error tracking
  };

  return (
    <ErrorBoundary onError={handleError}>
      {children}
    </ErrorBoundary>
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
    maxWidth: 280,
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
  button: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 14,
    minWidth: 160,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '600',
  },
  supportText: {
    fontSize: 13,
    marginTop: 24,
    textAlign: 'center',
  },
});

export default ErrorBoundary;
