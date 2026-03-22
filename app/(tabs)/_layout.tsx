/**
 * Declutterly -- Custom Pill-Style Floating Tab Bar
 * Matches Pencil design: floating pill with backdrop blur, 4 tabs equally spaced.
 * Uses expo-router Tabs with custom tabBar renderer.
 *
 * Improvements:
 * - Badge indicators on tabs (red dot for pending actions)
 * - Active sliding indicator (smooth transition between tabs)
 * - Safe minimum pill width (280)
 * - accessibilityRole="tablist" on tab bar container
 */

import { V1, BODY_FONT, ANIMATION } from '@/constants/designTokens';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { BlurView } from 'expo-blur';
import { ImpactFeedbackStyle } from 'expo-haptics';
import { impact } from '@/services/haptics';
import { Tabs } from 'expo-router';
import { Home, TrendingUp, LayoutGrid, User } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TAB_CONFIG = [
  { name: 'index', icon: Home, label: 'Home', accessibilityDescription: "Home: View your rooms and today's tasks" },
  { name: 'rooms', icon: LayoutGrid, label: 'Rooms', accessibilityDescription: 'Rooms: Browse and manage your spaces' },
  { name: 'progress', icon: TrendingUp, label: 'Progress', accessibilityDescription: 'Progress: View cleaning stats and streaks' },
  { name: 'profile', icon: User, label: 'Profile', accessibilityDescription: 'Profile: Settings and account' },
] as const;

const SPRING_CONFIG = ANIMATION.spring.snappy;

// Minimum pill width to prevent cramped layout on small screens
const MIN_PILL_WIDTH = 280;

function TabItem({
  tab,
  isActive,
  isDark,
  onPress,
  badge,
}: {
  tab: (typeof TAB_CONFIG)[number];
  isActive: boolean;
  isDark: boolean;
  onPress: () => void;
  badge?: boolean;
}) {
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(isActive ? 1.15 : 1.0);
  const dotOpacity = useSharedValue(isActive ? 1 : 0);

  useEffect(() => {
    if (reducedMotion) {
      scale.value = isActive ? 1.15 : 1.0;
      dotOpacity.value = isActive ? 1 : 0;
    } else {
      scale.value = withSpring(isActive ? 1.15 : 1.0, SPRING_CONFIG);
      dotOpacity.value = withSpring(isActive ? 1 : 0, SPRING_CONFIG);
    }
  }, [isActive, scale, dotOpacity, reducedMotion]);

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
    impact(ImpactFeedbackStyle.Light);
    onPress();
  }, [onPress]);

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="tab"
      accessibilityState={{ selected: isActive }}
      accessibilityLabel={tab.accessibilityDescription}
      accessibilityHint={`Double tap to switch to ${tab.label} tab`}
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
      <View>
        <Animated.View style={iconAnimatedStyle}>
          <Icon size={20} color={color} strokeWidth={isActive ? 2.2 : 1.8} />
        </Animated.View>
        {/* Badge indicator */}
        {badge && (
          <View style={styles.badge} accessibilityLabel={`${tab.label} has pending items`} />
        )}
      </View>
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
  const reducedMotion = useReducedMotion();

  // Safe minimum pill width
  const pillWidth = Math.max(MIN_PILL_WIDTH, Math.min(350, screenWidth - 40));

  // Active sliding indicator
  const tabWidth = pillWidth / TAB_CONFIG.length;
  const indicatorLeft = useSharedValue(state.index * tabWidth);

  useEffect(() => {
    if (reducedMotion) {
      indicatorLeft.value = state.index * tabWidth;
    } else {
      indicatorLeft.value = withSpring(state.index * tabWidth, SPRING_CONFIG);
    }
  }, [state.index, tabWidth, indicatorLeft, reducedMotion]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorLeft.value }],
    width: tabWidth,
  }));

  return (
    <View
      style={[styles.tabBarContainer, { paddingBottom: insets.bottom || 12 }]}
      accessibilityRole="tablist"
    >
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
          {/* Sliding active indicator */}
          <Animated.View
            style={[
              styles.activeIndicator,
              {
                backgroundColor: isDark
                  ? 'rgba(255,107,107,0.06)'
                  : 'rgba(255,107,107,0.08)',
              },
              indicatorStyle,
            ]}
            pointerEvents="none"
          />

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

const renderTabBar = (props: React.ComponentProps<typeof CustomTabBar>) => <CustomTabBar {...props} />;

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
    position: 'relative',
  },
  activeIndicator: {
    position: 'absolute',
    top: 6,
    bottom: 6,
    borderRadius: 18,
    zIndex: 0,
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
    zIndex: 1,
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
  badge: {
    position: 'absolute',
    top: -2,
    right: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: V1.coral,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
});
