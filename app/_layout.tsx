/**
 * Declutterly -- Root Layout (Apple 2026)
 * ThemeProvider, safe area, status bar, font loading
 *
 * Improvements:
 * - Font loading error recovery (degrade gracefully instead of returning null)
 * - Safe notification URL parsing (try/catch)
 * - Provider-level error boundary wrapping entire tree
 */

import { isPublicRouteSegment } from '@/utils/publicRoutes';
import { ErrorBoundary, RouteErrorBoundary } from '@/components/ErrorBoundary';
import { CelebrationProvider } from '@/components/ui/CelebrationEngine';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { OfflineIndicator } from '@/components/ui/OfflineIndicator';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ConvexClientProvider } from '@/context/ConvexProvider';
import { DeclutterProvider, useDeclutter } from '@/context/DeclutterContext';
import { TransitionStack } from '@/components/navigation/TransitionStack';
import {
    BottomSheet,
    DraggableCard,
    FadeScale,
    ModalSlideUp,
    SlideFromRight,
    ZoomIn,
} from '@/constants/transitions';
import { useColorScheme } from '@/hooks/useColorScheme';
import { recordAppOpen, scheduleOptimalNotification } from '@/services/notificationTiming';
import { addNotificationResponseListener } from '@/services/notifications';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { useFonts } from 'expo-font';
import * as Notifications from 'expo-notifications';
import { router as expoRouter, useRouter, useSegments, type Href } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { V1, BODY_FONT, getTheme } from '@/constants/designTokens';
import { DEV_SKIP_AUTH } from '@/constants/app';
import { logger } from '@/services/logger';

// Configure foreground notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Keep splash screen visible while loading
SplashScreen.preventAutoHideAsync();

/**
 * Handles notification deep linking on both cold-start and while-running.
 * Reads a generic `url` field from notification data and navigates via expo-router.
 * Wrapped in try/catch for safe URL parsing.
 */
function useNotificationObserver() {
  useEffect(() => {
    function redirect(notification: Notifications.Notification) {
      try {
        const url = notification.request.content.data?.url;
        if (typeof url === 'string' && url.length > 0) {
          expoRouter.push(url as Href);
        }
      } catch (e) {
        if (__DEV__) console.warn('Failed to parse notification URL:', e);
      }
    }

    // Cold-start: check if the app was opened from a notification
    try {
      const lastResponse = Notifications.getLastNotificationResponse();
      if (lastResponse?.notification) {
        redirect(lastResponse.notification);
      }
    } catch (e) {
      if (__DEV__) console.warn('Failed to get last notification response:', e);
    }

    // While-running: listen for tapped notifications
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        redirect(response.notification);
      },
    );

    return () => {
      subscription.remove();
    };
  }, []);
}

/**
 * Notification response router - lives inside DeclutterProvider to access rooms.
 * Validates room existence before deep-linking to prevent navigating to deleted rooms.
 */
function NotificationRouter() {
  const router = useRouter();
  const { rooms } = useDeclutter();

  useEffect(() => {
    const unsubscribe = addNotificationResponseListener((response) => {
      try {
        const data = response.notification.request.content.data;
        if (data?.roomId) {
          // Verify room still exists before navigating
          const roomId = String(data.roomId);
          const roomExists = (rooms ?? []).some(r => r.id === roomId);
          if (roomExists) {
            router.push({ pathname: '/room/[id]', params: { id: roomId } });
          } else {
            router.push('/(tabs)/rooms');
          }
        } else if (data?.challengeId) {
          router.push({ pathname: '/challenge/[id]', params: { id: String(data.challengeId) } });
        } else if (data?.type === 'badge' || data?.category === 'achievement' || data?.achievementId) {
          router.push('/achievements');
        } else if (data?.type === 'streak') {
          router.push('/');
        } else if (data?.category === 'collectible' || data?.collectibleId) {
          router.push('/collection');
        }
      } catch (e) {
        if (__DEV__) console.warn('Failed to handle notification response:', e);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [router, rooms]);

  return null;
}

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
    // Dev bypass: skip all auth redirects when DEV_SKIP_AUTH is enabled
    if (DEV_SKIP_AUTH) return;

    // Wait until auth state is resolved before redirecting
    if (!isAuthReady || isLoading) {
      // Reset redirect flag while still loading so we can redirect once resolved
      hasRedirected.current = false;
      return;
    }

    // Prevent re-redirecting if we already redirected this auth cycle
    if (hasRedirected.current) return;

    const isOnPublicScreen = isPublicRouteSegment(firstSegment);

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
    if (DEV_SKIP_AUTH) return;
    const prev = prevAuthRef.current;
    if (prev.isAuthenticated !== isAuthenticated || prev.isAnonymous !== isAnonymous) {
      hasRedirected.current = false;
      prevAuthRef.current = { isAuthenticated, isAnonymous };
    }
  }, [isAuthenticated, isAnonymous]);

  return <>{children}</>;
}

/**
 * Minimal fallback UI when fonts fail to load.
 * Degrades gracefully with system fonts instead of returning null.
 */
function FontErrorFallback({ isDark }: { isDark: boolean }) {
  const t = getTheme(isDark);
  return (
    <View style={[styles.fontErrorContainer, { backgroundColor: t.bg }]}>
      <Text style={[styles.fontErrorText, { color: t.textSecondary }]}>
        Loading...
      </Text>
    </View>
  );
}

export default function RootLayout() {
  useNotificationObserver();

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

  // Log font loading error but continue with degraded experience
  useEffect(() => {
    if (error) {
      logger.error('Font loading failed, using system fonts:', error);
    }
  }, [error]);

  useEffect(() => {
    // Record app open for optimal notification timing
    recordAppOpen().catch((err) => {
      if (__DEV__) console.warn('Failed to record app open:', err);
    });
    scheduleOptimalNotification().catch((err) => {
      if (__DEV__) console.warn('Failed to schedule optimal notification:', err);
    });
  }, []);

  // Notification response listener is in NotificationRouter (inside DeclutterProvider)
  // so it has access to rooms for deep-link validation.

  // Graceful font error recovery: show degraded UI instead of null
  if (!loaded && !error) return null;
  if (error && !loaded) {
    // Fonts failed to load -- continue with system fonts by proceeding
    // The app will render with fallback fonts instead of crashing
  }

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={styles.root}>
        <SafeAreaProvider>
          <ConvexClientProvider>
            <ThemeProvider>
              <CelebrationProvider>
                <AuthProvider>
                  <AuthGuard>
                  <DeclutterProvider>
                        <NotificationRouter />
                        <StatusBar style={isDark ? 'light' : 'dark'} animated />
                        <OfflineBanner />
                        <OfflineIndicator />
                        <RouteErrorBoundary>
                        <TransitionStack
                          screenOptions={{
                            ...SlideFromRight(),
                          }}
                        >
                          {/* -- Tabs ------------------------------------------------- */}
                          <TransitionStack.Screen name="(tabs)" />

                          {/* -- Auth / Onboarding (fade + scale) -------------------- */}
                          <TransitionStack.Screen name="splash" options={{ ...FadeScale(), gestureEnabled: false }} />
                          <TransitionStack.Screen name="auth" options={{ ...FadeScale() }} />
                          <TransitionStack.Screen name="onboarding" options={{ ...FadeScale(), gestureEnabled: false }} />
                          <TransitionStack.Screen name="notification-permission" options={{ ...FadeScale(), gestureEnabled: false }} />

                          {/* -- Push screens (slide from right) -------------------- */}
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
                          <TransitionStack.Screen name="leaderboard" options={{ ...SlideFromRight() }} />
                          <TransitionStack.Screen name="wardrobe" options={{ ...SlideFromRight() }} />
                          <TransitionStack.Screen name="weekly-summary" options={{ ...SlideFromRight() }} />
                          <TransitionStack.Screen name="challenge/create" options={{ ...SlideFromRight() }} />

                          {/* -- Modals (slide from bottom) ------------------------- */}
                          <TransitionStack.Screen name="camera" options={{ ...ModalSlideUp(), gestureEnabled: true }} />
                          <TransitionStack.Screen name="focus" options={{ ...ModalSlideUp() }} />
                          <TransitionStack.Screen name="blitz" options={{ ...ModalSlideUp(), gestureEnabled: false }} />
                          <TransitionStack.Screen name="single-task" options={{ ...ModalSlideUp(), gestureEnabled: false }} />

                          {/* -- Bottom sheets -------------------------------------- */}
                          <TransitionStack.Screen name="mascot" options={{ ...BottomSheet() }} />
                          <TransitionStack.Screen name="join" options={{ ...BottomSheet() }} />
                          <TransitionStack.Screen name="task-detail" options={{ ...BottomSheet() }} />

                          {/* -- Danger screens ------------------------------------ */}
                          <TransitionStack.Screen name="delete-account" options={{ ...SlideFromRight() }} />

                          {/* -- Special transitions -------------------------------- */}
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
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  fontErrorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fontErrorText: {
    fontSize: 16,
  },
});
