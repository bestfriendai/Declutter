/**
 * Declutterly - Root Layout
 * Main navigation structure with authentication and tab bar
 */

import { DeclutterProvider, useDeclutter } from '@/context/DeclutterContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ToastProvider } from '@/components/ui/Toast';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { useColorScheme as useRNColorScheme, ActivityIndicator, View } from 'react-native';
import { isFirebaseConfigured } from '@/config/firebase';

// Auth gate component - redirects based on auth state
function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, isFirebaseReady } = useAuth();
  const { user } = useDeclutter();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    // Skip auth redirect if Firebase is not configured (development mode)
    if (!isFirebaseReady) return;

    const inAuthGroup = segments[0] === 'auth';

    if (!isLoading) {
      if (!isAuthenticated && !inAuthGroup) {
        // Not authenticated and not on auth screen - redirect to login
        router.replace('/auth/login');
      } else if (isAuthenticated && inAuthGroup) {
        // Authenticated but on auth screen - redirect to main app
        if (user?.onboardingComplete) {
          router.replace('/(tabs)');
        } else {
          router.replace('/onboarding');
        }
      }
    }
  }, [isAuthenticated, isLoading, segments, isFirebaseReady, user?.onboardingComplete]);

  if (isLoading && isFirebaseReady) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  return <>{children}</>;
}

function RootLayoutNav() {
  const { user, settings } = useDeclutter();
  const { isAuthenticated, isFirebaseReady } = useAuth();
  const systemScheme = useRNColorScheme();

  // Determine effective color scheme based on user preference
  const effectiveScheme = settings.theme === 'auto'
    ? systemScheme ?? 'dark'
    : settings.theme;

  // Skip auth checks if Firebase is not configured (development mode)
  const needsAuth = isFirebaseReady && !isAuthenticated;
  const needsOnboarding = !user?.onboardingComplete && (isAuthenticated || !isFirebaseReady);

  return (
    <ThemeProvider forcedColorScheme={effectiveScheme}>
      <AuthGate>
        <StatusBar style={effectiveScheme === 'dark' ? 'light' : 'dark'} />
        <Stack screenOptions={{ headerShown: false }}>
          {/* Auth screens */}
          <Stack.Screen name="auth" options={{ headerShown: false }} />

          {/* Onboarding */}
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />

          {/* Main app screens */}
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

          <Stack.Screen
            name="room/[id]"
            options={{
              presentation: 'card',
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="camera"
            options={{
              presentation: 'fullScreenModal',
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="analysis"
            options={{
              presentation: 'modal',
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="settings"
            options={{
              presentation: 'modal',
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="insights"
            options={{
              presentation: 'card',
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="focus"
            options={{
              presentation: 'fullScreenModal',
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="social"
            options={{
              presentation: 'card',
              headerShown: false,
            }}
          />
        </Stack>
      </AuthGate>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <DeclutterProvider>
          <ToastProvider>
            <RootLayoutNav />
          </ToastProvider>
        </DeclutterProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
