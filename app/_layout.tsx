/**
 * Declutterly - Root Layout
 * Main navigation structure with tab bar
 */

import { DeclutterProvider, useDeclutter } from '@/context/DeclutterContext';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

function RootLayoutNav() {
  const { user, settings } = useDeclutter();
  const systemScheme = useRNColorScheme();

  // Determine effective color scheme based on user preference
  const effectiveScheme = settings.theme === 'auto'
    ? systemScheme ?? 'dark'
    : settings.theme;

  return (
    <ThemeProvider forcedColorScheme={effectiveScheme}>
      <StatusBar style={effectiveScheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        {!user?.onboardingComplete ? (
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        ) : (
          <>
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
          </>
        )}
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <DeclutterProvider>
      <RootLayoutNav />
    </DeclutterProvider>
  );
}
