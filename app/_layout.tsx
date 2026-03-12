/**
 * Declutterly — Root Layout (Apple 2026)
 * ThemeProvider, safe area, status bar, font loading
 */

import { ThemeProvider } from '@/theme/ThemeProvider';
import { ConvexClientProvider } from '@/context/ConvexProvider';
import { AuthProvider } from '@/context/AuthContext';
import { DeclutterProvider } from '@/context/DeclutterContext';
import { MascotProvider } from '@/context/MascotContext';
import { FocusProvider } from '@/context/FocusContext';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect } from 'react';
import { useColorScheme } from '@/hooks/useColorScheme';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { StyleSheet } from 'react-native';

// Keep splash screen visible while loading
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const rawScheme = useColorScheme();
  const colorScheme = rawScheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  const onLayoutReady = useCallback(async () => {
    if (loaded || error) {
      await SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  useEffect(() => {
    onLayoutReady();
  }, [onLayoutReady]);

  if (!loaded && !error) return null;

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ConvexClientProvider>
          <ThemeProvider>
            <AuthProvider>
              <DeclutterProvider>
                <MascotProvider>
                  <FocusProvider>
                    <StatusBar style={isDark ? 'light' : 'dark'} animated />
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
                      <Stack.Screen name="auth" options={{ headerShown: false, animation: 'fade' }} />
                      <Stack.Screen name="onboarding" options={{ headerShown: false, animation: 'fade' }} />
                      <Stack.Screen name="camera" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
                      <Stack.Screen name="focus" options={{ headerShown: false, presentation: 'modal' }} />
                      <Stack.Screen name="room/[id]" options={{ headerShown: false }} />
                      <Stack.Screen name="settings" options={{ headerShown: false }} />
                      <Stack.Screen name="achievements" options={{ headerShown: false }} />
                      <Stack.Screen name="insights" options={{ headerShown: false }} />
                      <Stack.Screen name="mascot" options={{ headerShown: false, presentation: 'modal' }} />
                      <Stack.Screen name="analysis" options={{ headerShown: false }} />
                      <Stack.Screen name="social" options={{ headerShown: false }} />
                      <Stack.Screen name="collection" options={{ headerShown: false }} />
                      <Stack.Screen name="+not-found" options={{ headerShown: false }} />
                    </Stack>
                  </FocusProvider>
                </MascotProvider>
              </DeclutterProvider>
            </AuthProvider>
          </ThemeProvider>
        </ConvexClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
