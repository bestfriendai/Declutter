/**
 * Declutterly -- Floating Pill Tab Bar
 * Pixel-perfect implementation matching Pencil designs.
 * 4 tabs: HOME, ROOMS, PROGRESS, PROFILE
 * Floating centered pill with blur background and subtle active indicator.
 *
 * Design tokens (declutter.pen):
 *   Pill:          350w, 64h, radius 28
 *   Dark:          bg #14141480, border #FFFFFF14, active bg #FFFFFF14
 *   Light:         bg #F8F8F8B3, border #E8E8E8, active bg #1A1A1A0D
 *   Active icon:   dark #FFFFFF | light #1A1A1A
 *   Inactive:      #707070
 *   Label:         Inter 10/500, letter-spacing 0.5, uppercase
 *   Icons:         house, grid-2x2, trending-up, user (Lucide names -> Ionicons equivalents)
 */

import { useColorScheme } from '@/hooks/useColorScheme';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { Tabs } from 'expo-router';
import React, { useCallback, useEffect, useRef } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TAB_COUNT = 4;
const TAB_BAR_HEIGHT = 64;
const TAB_BAR_WIDTH = 350;
const PILL_RADIUS = 28;
const ACTIVE_INDICATOR_RADIUS = 14;

const INDICATOR_SPRING = { damping: 20, stiffness: 220, mass: 0.8 };
const PRESS_SPRING_IN = { damping: 15, stiffness: 450 };
const PRESS_SPRING_OUT = { damping: 12, stiffness: 280 };

// Tab configuration (Lucide equivalents in Ionicons)
const TAB_CONFIG = {
  index: {
    label: 'HOME',
    icon: 'home-outline' as const,
    iconActive: 'home' as const,
  },
  rooms: {
    label: 'ROOMS',
    icon: 'grid-outline' as const,
    iconActive: 'grid' as const,
  },
  progress: {
    label: 'PROGRESS',
    icon: 'trending-up-outline' as const,
    iconActive: 'trending-up' as const,
  },
  profile: {
    label: 'PROFILE',
    icon: 'person-outline' as const,
    iconActive: 'person' as const,
  },
} as const;

type TabRoute = keyof typeof TAB_CONFIG;

// ---------------------------------------------------------------------------
// Root Layout
// ---------------------------------------------------------------------------

export default function TabLayout() {
  const rawScheme = useColorScheme();
  const isDark = rawScheme === 'dark';
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();

  return (
    <Tabs
      tabBar={(props) => (
        <FloatingPillTabBar
          state={props.state}
          descriptors={props.descriptors}
          navigation={props.navigation}
          insets={insets}
          isDark={isDark}
          reducedMotion={reducedMotion}
        />
      )}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: TAB_CONFIG.index.label,
          tabBarAccessibilityLabel: 'Home tab',
        }}
      />
      <Tabs.Screen
        name="rooms"
        options={{
          title: TAB_CONFIG.rooms.label,
          tabBarAccessibilityLabel: 'Rooms tab',
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: TAB_CONFIG.progress.label,
          tabBarAccessibilityLabel: 'Progress tab',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: TAB_CONFIG.profile.label,
          tabBarAccessibilityLabel: 'Profile tab',
        }}
      />
    </Tabs>
  );
}

// ---------------------------------------------------------------------------
// Floating Pill Tab Bar
// ---------------------------------------------------------------------------

interface FloatingPillTabBarProps {
  state: {
    index: number;
    routes: Array<{ key: string; name: string }>;
  };
  descriptors: Record<string, { options: { title?: string; tabBarAccessibilityLabel?: string } }>;
  navigation: any;
  insets: { top: number; right: number; bottom: number; left: number };
  isDark: boolean;
  reducedMotion: boolean;
}

function FloatingPillTabBar({
  state,
  descriptors,
  navigation,
  insets,
  isDark,
  reducedMotion,
}: FloatingPillTabBarProps) {
  const indicatorX = useSharedValue(0);
  const tabWidth = useSharedValue(TAB_BAR_WIDTH / TAB_COUNT);

  // Update indicator position on tab change
  useEffect(() => {
    const newX = (TAB_BAR_WIDTH / TAB_COUNT) * state.index;
    if (tabWidth.value > 0) {
      indicatorX.value = withSpring(newX, INDICATOR_SPRING);
    } else {
      indicatorX.value = newX;
    }
  }, [state.index, indicatorX, tabWidth]);

  // Set initial position
  useEffect(() => {
    tabWidth.value = TAB_BAR_WIDTH / TAB_COUNT;
    indicatorX.value = (TAB_BAR_WIDTH / TAB_COUNT) * state.index;
  }, [indicatorX, tabWidth, state.index]);

  const indicatorStyle = useAnimatedStyle(() => {
    const insetH = 4;
    return {
      width: tabWidth.value - insetH * 2,
      transform: [{ translateX: indicatorX.value + insetH }],
    };
  });

  const bottomPadding = Math.max(insets.bottom, 12);

  // Design-matched pill colors
  const pillBg = isDark ? '#14141480' : '#F8F8F8B3';
  const pillBorderColor = isDark ? '#FFFFFF14' : '#E8E8E8';
  const indicatorBg = isDark ? '#FFFFFF14' : '#1A1A1A0D';

  return (
    <View
      style={[styles.wrapper, { paddingBottom: bottomPadding }]}
      pointerEvents="box-none"
    >
      <View style={styles.pillOuter}>
        <LinearGradient
          colors={
            isDark
              ? ['rgba(255,184,111,0.22)', 'rgba(124,138,255,0.12)', 'rgba(124,138,255,0)']
              : ['rgba(255,205,157,0.42)', 'rgba(153,170,255,0.18)', 'rgba(153,170,255,0)']
          }
          start={{ x: 0.1, y: 0.1 }}
          end={{ x: 0.9, y: 0.85 }}
          style={styles.haloLayer}
          pointerEvents="none"
        />
        {/* Shadow layer */}
        <View style={[styles.shadowLayer, isDark && styles.shadowLayerDark]} />

        {/* Blur background */}
        <BlurView
          intensity={20}
          tint={isDark ? 'dark' : 'light'}
          style={[
            styles.pillContainer,
            {
              backgroundColor: pillBg,
              borderColor: pillBorderColor,
            },
          ]}
        >
          <LinearGradient
            colors={
              isDark
                ? ['rgba(255,255,255,0.09)', 'rgba(255,255,255,0.03)', 'rgba(255,255,255,0.04)']
                : ['rgba(255,255,255,0.72)', 'rgba(255,255,255,0.38)', 'rgba(255,255,255,0.56)']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.pillTint}
            pointerEvents="none"
          />
          <LinearGradient
            colors={
              isDark
                ? ['rgba(255,255,255,0.16)', 'rgba(255,255,255,0.03)', 'transparent']
                : ['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.35)', 'transparent']
            }
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.pillSheen}
            pointerEvents="none"
          />
          {/* Active tab indicator pill */}
          <Animated.View
            style={[
              styles.activeIndicator,
              { backgroundColor: indicatorBg },
              indicatorStyle,
            ]}
            pointerEvents="none"
          >
            <LinearGradient
              colors={
                isDark
                  ? ['rgba(255,255,255,0.22)', 'rgba(255,196,126,0.12)']
                  : ['rgba(255,255,255,0.9)', 'rgba(255,214,176,0.58)']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.indicatorGradient}
            />
          </Animated.View>

          {/* Tab buttons */}
          {state.routes.map((route: { key: string; name: string }, index: number) => {
            const descriptor = descriptors[route.key];
            if (!descriptor) return null;
            const { options } = descriptor;
            const routeName = route.name as TabRoute;
            const config = TAB_CONFIG[routeName];
            const isFocused = state.index === index;

            if (!config) return null;

            return (
              <TabButton
                key={route.key}
                routeName={routeName}
                label={config.label}
                isFocused={isFocused}
                isDark={isDark}
                reducedMotion={reducedMotion}
                accessibilityLabel={
                  options.tabBarAccessibilityLabel ?? `${config.label} tab`
                }
                onPress={() => {
                  const event = navigation.emit({
                    type: 'tabPress',
                    target: route.key,
                    canPreventDefault: true,
                  });
                  if (!isFocused && !event.defaultPrevented) {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    navigation.navigate(route.name);
                  }
                }}
                onLongPress={() => {
                  navigation.emit({
                    type: 'tabLongPress',
                    target: route.key,
                  });
                }}
              />
            );
          })}
        </BlurView>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Tab Button
// ---------------------------------------------------------------------------

interface TabButtonProps {
  routeName: TabRoute;
  label: string;
  isFocused: boolean;
  isDark: boolean;
  reducedMotion: boolean;
  accessibilityLabel: string;
  onPress: () => void;
  onLongPress: () => void;
}

function TabButton({
  routeName,
  label,
  isFocused,
  isDark,
  reducedMotion,
  accessibilityLabel,
  onPress,
  onLongPress,
}: TabButtonProps) {
  const scale = useSharedValue(1);
  const prevFocused = useRef(isFocused);

  useEffect(() => {
    if (isFocused && !prevFocused.current && !reducedMotion) {
      scale.value = withSequence(
        withSpring(0.85, { damping: 15, stiffness: 450 }),
        withSpring(1.08, { damping: 10, stiffness: 280 }),
        withSpring(1.0, { damping: 14, stiffness: 200 }),
      );
    }
    prevFocused.current = isFocused;
  }, [isFocused, reducedMotion, scale]);

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.88, PRESS_SPRING_IN);
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, PRESS_SPRING_OUT);
  }, [scale]);

  const animatedContainer = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const config = TAB_CONFIG[routeName];
  const iconName = config
    ? isFocused
      ? config.iconActive
      : config.icon
    : ('ellipse' as const);

  // Design: active = white/#1A1A1A, inactive = #707070
  const activeColor = isDark ? '#FFFFFF' : '#1A1A1A';
  const inactiveColor = '#707070';
  const tintColor = isFocused ? activeColor : inactiveColor;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="tab"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected: isFocused }}
      style={styles.tabButton}
      hitSlop={{ top: 8, bottom: 8 }}
    >
      <Animated.View style={[styles.tabButtonInner, animatedContainer]}>
        <Ionicons
          name={iconName as keyof typeof Ionicons.glyphMap}
          size={22}
          color={tintColor}
        />
        <Text
          style={[
            styles.tabLabel,
            { color: tintColor },
          ]}
          numberOfLines={1}
          allowFontScaling={false}
        >
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  pillOuter: {
    width: TAB_BAR_WIDTH,
  },
  haloLayer: {
    position: 'absolute',
    top: -12,
    left: 20,
    right: 20,
    bottom: -8,
    borderRadius: PILL_RADIUS + 14,
  },

  shadowLayer: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: PILL_RADIUS,
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 12,
  },
  shadowLayerDark: {
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },

  pillContainer: {
    flexDirection: 'row',
    height: TAB_BAR_HEIGHT,
    borderRadius: PILL_RADIUS,
    overflow: 'hidden',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'space-around',
    position: 'relative',
  },
  pillTint: {
    ...StyleSheet.absoluteFillObject,
  },
  pillSheen: {
    position: 'absolute',
    top: 0,
    left: 14,
    right: 14,
    height: 18,
    borderTopLeftRadius: PILL_RADIUS,
    borderTopRightRadius: PILL_RADIUS,
  },

  activeIndicator: {
    position: 'absolute',
    top: 6,
    bottom: 6,
    borderRadius: ACTIVE_INDICATOR_RADIUS,
    overflow: 'hidden',
  },
  indicatorGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: ACTIVE_INDICATOR_RADIUS,
  },

  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: TAB_BAR_HEIGHT,
  },

  tabButtonInner: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },

  tabLabel: {
    fontFamily: Platform.OS === 'ios' ? 'DM Sans' : 'sans-serif',
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.5,
    lineHeight: 12,
    textTransform: 'uppercase',
  },
});
