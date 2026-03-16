/**
 * Declutterly -- Native Liquid Glass Tab Bar
 * Uses expo-router NativeTabs for real iOS 26 liquid glass rendering.
 * Falls back to native UITabBar on older iOS, Material 3 on Android.
 * 4 tabs: HOME, ROOMS, PROGRESS, PROFILE
 */

import { useColorScheme } from '@/hooks/useColorScheme';
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';
import React from 'react';
import { DynamicColorIOS, Platform } from 'react-native';

export default function TabLayout() {
  const rawScheme = useColorScheme();
  const isDark = rawScheme === 'dark';

  // Tint color adapts to theme
  const tintColor = Platform.OS === 'ios'
    ? DynamicColorIOS({ dark: '#FFFFFF', light: '#1A1A1A' })
    : isDark ? '#FFFFFF' : '#1A1A1A';

  return (
    <NativeTabs
      minimizeBehavior="onScrollDown"
      tintColor={tintColor}
    >
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: 'house', selected: 'house.fill' }} />
        <Label>Home</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="rooms">
        <Icon sf={{ default: 'square.grid.2x2', selected: 'square.grid.2x2.fill' }} />
        <Label>Rooms</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="progress">
        <Icon sf={{ default: 'chart.line.uptrend.xyaxis', selected: 'chart.line.uptrend.xyaxis' }} />
        <Label>Progress</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <Icon sf={{ default: 'person', selected: 'person.fill' }} />
        <Label>Profile</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
