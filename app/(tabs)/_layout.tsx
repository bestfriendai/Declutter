/**
 * Declutterly -- Custom Pill-Style Floating Tab Bar
 * Matches Pencil design: floating pill with backdrop blur, 4 tabs equally spaced.
 * Uses expo-router Tabs with custom tabBar renderer.
 */

import { V1, BODY_FONT } from '@/constants/designTokens';
import { useColorScheme } from '@/hooks/useColorScheme';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Tabs } from 'expo-router';
import { Home, TrendingUp, LayoutGrid, User } from 'lucide-react-native';
import React, { useCallback, useEffect } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TAB_CONFIG = [
  { name: 'index', icon: Home, label: 'Home' },
  { name: 'rooms', icon: LayoutGrid, label: 'Rooms' },
  { name: 'progress', icon: TrendingUp, label: 'Progress' },
  { name: 'profile', icon: User, label: 'Profile' },
] as const;

const SPRING_CONFIG = {
  damping: 15,
  stiffness: 200,
  mass: 0.8,
};

function TabItem({
  tab,
  isActive,
  isDark,
  onPress,
}: {
  tab: (typeof TAB_CONFIG)[number];
  isActive: boolean;
  isDark: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(isActive ? 1.15 : 1.0);
  const dotOpacity = useSharedValue(isActive ? 1 : 0);

  useEffect(() => {
    scale.value = withSpring(isActive ? 1.15 : 1.0, SPRING_CONFIG);
    dotOpacity.value = withSpring(isActive ? 1 : 0, SPRING_CONFIG);
  }, [isActive, scale, dotOpacity]);

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const dotAnimatedStyle = useAnimatedStyle(() => ({
    opacity: dotOpacity.value,
  }));

  const Icon = tab.icon;
  const color = isActive
    ? V1.coral
    : isDark
      ? V1.dark.textMuted
      : V1.light.textMuted;

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }, [onPress]);

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="tab"
      accessibilityState={{ selected: isActive }}
      accessibilityLabel={tab.label}
      style={({ pressed }) => [
        styles.tabItem,
        isActive && {
          backgroundColor: isDark
            ? 'rgba(255,107,107,0.1)'
            : 'rgba(255,107,107,0.12)',
        },
        pressed && { opacity: 0.7 },
      ]}
    >
      <Animated.View style={iconAnimatedStyle}>
        <Icon size={20} color={color} strokeWidth={isActive ? 2.2 : 1.8} />
      </Animated.View>
      <Text
        style={[
          styles.tabLabel,
          {
            color,
            fontWeight: isActive ? '700' : '600',
          },
        ]}
      >
        {tab.label}
      </Text>
      <Animated.View
        style={[
          styles.activeDot,
          { backgroundColor: V1.coral },
          dotAnimatedStyle,
        ]}
      />
    </Pressable>
  );
}

function CustomTabBar({
  state,
  navigation,
}: {
  state: { index: number; routes: Array<{ key: string; name: string }> };
  descriptors: Record<string, unknown>;
  navigation: { navigate: (name: string) => void };
}) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const pillWidth = Math.min(350, screenWidth - 40);

  return (
    <View style={[styles.tabBarContainer, { paddingBottom: insets.bottom || 12 }]}>
      <BlurView intensity={50} tint={isDark ? 'dark' : 'light'} style={styles.pill}>
        <View
          style={[
            styles.pillInner,
            {
              width: pillWidth,
              backgroundColor: isDark
                ? 'rgba(18,18,18,0.75)'
                : 'rgba(255,255,255,0.92)',
              borderColor: isDark ? 'rgba(255,255,255,0.07)' : V1.light.border,
            },
          ]}
        >
          {TAB_CONFIG.map((tab, index) => {
            const isActive = state.index === index;
            return (
              <TabItem
                key={tab.name}
                tab={tab}
                isActive={isActive}
                isDark={isDark}
                onPress={() => navigation.navigate(tab.name)}
              />
            );
          })}
        </View>
      </BlurView>
    </View>
  );
}

const renderTabBar = (props: any) => <CustomTabBar {...props} />;

export default function TabLayout() {
  return (
    <Tabs
      tabBar={renderTabBar}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="rooms" options={{ title: 'Rooms' }} />
      <Tabs.Screen name="progress" options={{ title: 'Progress' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  pill: {
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  pillInner: {
    flexDirection: 'row',
    height: 66,
    borderRadius: 28,
    borderWidth: 1,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 14,
    minHeight: 44,
    minWidth: 44,
  },
  tabLabel: {
    fontSize: 10,
    fontFamily: BODY_FONT,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 1,
  },
});
