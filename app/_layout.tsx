/**
 * Declutterly — Root Layout (Apple 2026)
 * ThemeProvider, safe area, status bar, font loading
 */

import { Colors } from '@/constants/Colors';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { CelebrationProvider } from '@/components/ui/CelebrationEngine';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ConvexClientProvider } from '@/context/ConvexProvider';
import { DeclutterProvider } from '@/context/DeclutterContext';
import { FocusProvider } from '@/context/FocusContext';
import { MascotProvider } from '@/context/MascotContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { recordAppOpen, scheduleOptimalNotification } from '@/services/notificationTiming';
import {
  addNotificationResponseListener,
  removeAllNotificationListeners,
} from '@/services/notifications';
import React, { useCallback, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Keep splash screen visible while loading
SplashScreen.preventAutoHideAsync();

/**
 * Auth guard: redirects unauthenticated users away from protected screens
 * and authenticated users away from auth screens.
 */
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAnonymous, isLoading, isAuthReady } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Wait until auth state is resolved before redirecting
    if (!isAuthReady || isLoading) return;

    const firstSegment = segments[0] ?? '';

    // Screens that don't require authentication
    const publicSegments = ['auth', 'onboarding', 'splash', '+not-found'];
    const isOnPublicScreen = publicSegments.includes(firstSegment);

    if (!isAuthenticated && !isOnPublicScreen) {
      // Not authenticated and trying to access a protected screen -> onboarding
      router.replace('/onboarding');
    } else if (isAuthenticated && !isAnonymous && firstSegment === 'auth') {
      // Authenticated (non-guest) but on auth screens -> home
      // Guest users are allowed on auth screens for account upgrade
      router.replace('/');
    }
  }, [isAuthenticated, isAnonymous, isLoading, isAuthReady, segments, router]);

  return <>{children}</>;
}

export default function RootLayout() {
  const rawScheme = useColorScheme();
  const colorScheme = rawScheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  const [loaded, error] = useFonts({
    'DM Sans': require('../assets/fonts/DMSans-VariableFont_opsz,wght.ttf'),
    'Bricolage Grotesque': require('../assets/fonts/BricolageGrotesque-VariableFont_opsz,wdth,wght.ttf'),
  });

  const onLayoutReady = useCallback(async () => {
    if (loaded || error) {
      await SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  useEffect(() => {
    onLayoutReady();
  }, [onLayoutReady]);

  useEffect(() => {
    // Record app open for optimal notification timing
    recordAppOpen().catch(() => {});
    scheduleOptimalNotification().catch(() => {});
  }, []);

  // Set up notification response listener for handling tapped notifications
  const router = useRouter();
  useEffect(() => {
    const unsubscribe = addNotificationResponseListener((response) => {
      const data = response.notification.request.content.data;
      if (data?.roomId) {
        router.push(`/room/${data.roomId}` as any);
      } else if (data?.category === 'achievement') {
        router.push('/achievements' as any);
      }
    });

    return () => {
      unsubscribe();
      removeAllNotificationListeners();
    };
  }, [router]);

  if (!loaded && !error) return null;

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ConvexClientProvider>
          <ThemeProvider>
            <CelebrationProvider>
              <AuthProvider>
                <AuthGuard>
                <DeclutterProvider>
                  <MascotProvider>
                    <FocusProvider>
                      <StatusBar style={isDark ? 'light' : 'dark'} animated />
                      <ErrorBoundary>
                      <Stack
                        screenOptions={{
                          headerShown: false,
                          contentStyle: { backgroundColor: colors.background },
                          animation: 'ios_from_right',
                          animationDuration: 350,
                          gestureEnabled: true,
                          gestureDirection: 'horizontal',
                        }}
                      >
                        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                        <Stack.Screen name="splash" options={{ headerShown: false, animation: 'fade', gestureEnabled: false }} />
                        <Stack.Screen name="auth" options={{ headerShown: false, animation: 'fade' }} />
                        <Stack.Screen name="onboarding" options={{ headerShown: false, animation: 'fade' }} />
                        <Stack.Screen name="paywall" options={{ headerShown: false, animation: 'fade', gestureEnabled: false }} />
                        <Stack.Screen name="notification-permission" options={{ headerShown: false, animation: 'fade', gestureEnabled: false }} />
                        <Stack.Screen name="camera" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
                        <Stack.Screen name="focus" options={{ headerShown: false, presentation: 'modal' }} />
                        <Stack.Screen name="room/[id]" options={{ headerShown: false, animation: 'ios_from_right' }} />
                        <Stack.Screen name="settings" options={{ headerShown: false }} />
                        <Stack.Screen name="achievements" options={{ headerShown: false }} />
                        <Stack.Screen name="insights" options={{ headerShown: false }} />
                        <Stack.Screen name="mascot" options={{ headerShown: false, presentation: 'modal' }} />
                        <Stack.Screen name="analysis" options={{ headerShown: false, animation: 'fade' }} />
                        <Stack.Screen name="social" options={{ headerShown: false }} />
                        <Stack.Screen name="accountability" options={{ headerShown: false }} />
                        <Stack.Screen name="collection" options={{ headerShown: false }} />
                        <Stack.Screen name="+not-found" options={{ headerShown: false }} />
                      </Stack>
                      </ErrorBoundary>
                    </FocusProvider>
                  </MascotProvider>
                </DeclutterProvider>
                </AuthGuard>
              </AuthProvider>
            </CelebrationProvider>
          </ThemeProvider>
        </ConvexClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
