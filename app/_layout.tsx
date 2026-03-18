/**
 * Declutterly — Root Layout (Apple 2026)
 * ThemeProvider, safe area, status bar, font loading
 */

import { RouteErrorBoundary } from '@/components/ErrorBoundary';
import { CelebrationProvider } from '@/components/ui/CelebrationEngine';
import { OfflineIndicator } from '@/components/ui/OfflineIndicator';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ConvexClientProvider } from '@/context/ConvexProvider';
import { DeclutterProvider } from '@/context/DeclutterContext';
// FocusProvider removed — focus session state is managed by DeclutterContext
import { useColorScheme } from '@/hooks/useColorScheme';
import { recordAppOpen, scheduleOptimalNotification } from '@/services/notificationTiming';
import { addNotificationResponseListener } from '@/services/notifications';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { TransitionStack } from '@/components/navigation/TransitionStack';
import {
  SlideFromRight,
  ModalSlideUp,
  FadeScale,
  BottomSheet,
  DraggableCard,
  ZoomIn,
} from '@/constants/transitions';
import { useFonts } from 'expo-font';
import { useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useRef } from 'react';
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
  const hasRedirected = useRef(false);

  // Use string primitive as dep to avoid infinite loop from array identity changes
  const firstSegment = segments[0] ?? '';

  useEffect(() => {
    // Wait until auth state is resolved before redirecting
    if (!isAuthReady || isLoading) {
      // Reset redirect flag while still loading so we can redirect once resolved
      hasRedirected.current = false;
      return;
    }

    // Prevent re-redirecting if we already redirected this auth cycle
    if (hasRedirected.current) return;

    // Screens that don't require authentication
    const publicSegments = ['auth', 'onboarding', 'splash', '+not-found'];
    const isOnPublicScreen = publicSegments.includes(firstSegment);

    if (!isAuthenticated && !isOnPublicScreen) {
      // Not authenticated and trying to access a protected screen -> onboarding
      hasRedirected.current = true;
      router.replace('/onboarding');
    } else if (isAuthenticated && !isAnonymous && firstSegment === 'auth') {
      // Authenticated (non-guest) but on auth screens -> home
      // Guest users are allowed on auth screens for account upgrade
      hasRedirected.current = true;
      router.replace('/');
    }
  }, [isAuthenticated, isAnonymous, isLoading, isAuthReady, firstSegment, router]);

  // Reset the redirect flag when auth state genuinely changes
  // (e.g. user signs in or signs out) so new redirects can happen
  const prevAuthRef = useRef({ isAuthenticated, isAnonymous });
  useEffect(() => {
    const prev = prevAuthRef.current;
    if (prev.isAuthenticated !== isAuthenticated || prev.isAnonymous !== isAnonymous) {
      hasRedirected.current = false;
      prevAuthRef.current = { isAuthenticated, isAnonymous };
    }
  }, [isAuthenticated, isAnonymous]);

  return <>{children}</>;
}

export default function RootLayout() {
  const rawScheme = useColorScheme();
  const isDark = rawScheme === 'dark';

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
        router.push(`/room/${String(data.roomId)}`);
      } else if (data?.category === 'achievement' || data?.achievementId) {
        router.push('/achievements');
      } else if (data?.category === 'collectible' || data?.collectibleId) {
        router.push('/collection');
      }
      // Other categories (reminder, streak, mascot, focus, motivation)
      // open the app to the default screen — no explicit navigation needed
    });

    return () => {
      unsubscribe();
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
                      <StatusBar style={isDark ? 'light' : 'dark'} animated />
                      <OfflineIndicator />
                      <RouteErrorBoundary>
                      <TransitionStack
                        screenOptions={{
                          ...SlideFromRight(),
                        }}
                      >
                        {/* ── Tabs ─────────────────────────────────────────── */}
                        <TransitionStack.Screen name="(tabs)" />

                        {/* ── Auth / Onboarding (fade + scale) ─────────────── */}
                        <TransitionStack.Screen name="splash" options={{ ...FadeScale(), gestureEnabled: false }} />
                        <TransitionStack.Screen name="auth" options={{ ...FadeScale() }} />
                        <TransitionStack.Screen name="onboarding" options={{ ...FadeScale(), gestureEnabled: false }} />
                        <TransitionStack.Screen name="notification-permission" options={{ ...FadeScale(), gestureEnabled: false }} />

                        {/* ── Push screens (slide from right) ──────────────── */}
                        <TransitionStack.Screen name="room/[id]" options={{ ...SlideFromRight() }} />
                        <TransitionStack.Screen name="settings" options={{ ...SlideFromRight() }} />
                        <TransitionStack.Screen name="achievements" options={{ ...SlideFromRight() }} />
                        <TransitionStack.Screen name="insights" options={{ ...SlideFromRight() }} />
                        <TransitionStack.Screen name="social" options={{ ...SlideFromRight() }} />
                        <TransitionStack.Screen name="accountability" options={{ ...SlideFromRight() }} />
                        <TransitionStack.Screen name="collection" options={{ ...SlideFromRight() }} />
                        <TransitionStack.Screen name="challenge/[id]" options={{ ...SlideFromRight() }} />
                        <TransitionStack.Screen name="task-customize" options={{ ...SlideFromRight() }} />
                        <TransitionStack.Screen name="today-tasks" options={{ ...SlideFromRight() }} />

                        {/* ── Modals (slide from bottom) ───────────────────── */}
                        <TransitionStack.Screen name="camera" options={{ ...ModalSlideUp(), gestureEnabled: true }} />
                        <TransitionStack.Screen name="focus" options={{ ...ModalSlideUp() }} />
                        <TransitionStack.Screen name="blitz" options={{ ...ModalSlideUp(), gestureEnabled: false }} />
                        <TransitionStack.Screen name="single-task" options={{ ...ModalSlideUp(), gestureEnabled: false }} />

                        {/* ── Bottom sheets ────────────────────────────────── */}
                        <TransitionStack.Screen name="mascot" options={{ ...BottomSheet() }} />
                        <TransitionStack.Screen name="join" options={{ ...BottomSheet() }} />
                        <TransitionStack.Screen name="task-detail" options={{ ...BottomSheet() }} />

                        {/* ── Special transitions ──────────────────────────── */}
                        <TransitionStack.Screen name="paywall" options={{ ...DraggableCard() }} />
                        <TransitionStack.Screen name="analysis" options={{ ...FadeScale() }} />
                        <TransitionStack.Screen name="session-complete" options={{ ...ZoomIn() }} />
                        <TransitionStack.Screen name="room-complete" options={{ ...ZoomIn() }} />

                        <TransitionStack.Screen name="+not-found" options={{ ...FadeScale() }} />
                      </TransitionStack>
                      </RouteErrorBoundary>
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
