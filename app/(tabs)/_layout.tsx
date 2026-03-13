/**
 * Declutterly — Apple 2026 Tab Bar Layout
 * iOS 26 floating pill tab bar with text labels and adaptive colors
 * Improved active indicator contrast for both light and dark mode
 */

import { Colors, ColorTokens } from '@/constants/Colors';
import { Typography } from '@/theme/typography';
import { Spacing, BorderRadius } from '@/theme/spacing';
import { Tabs } from 'expo-router';
import React, { useCallback } from 'react';
import { StyleSheet, View, Pressable, Text } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

// Tab icon mapping — SF Symbol / Ionicons fallbacks alongside emoji
const TAB_ICONS = {
  index:    { icon: 'home', iconActive: 'home' },
  progress: { icon: 'bar-chart-outline', iconActive: 'bar-chart' },
  profile:  { icon: 'person-outline', iconActive: 'person' },
} as const;

// Tab labels
const TAB_LABELS = {
  index:    'Home',
  progress: 'Progress',
  profile:  'Profile',
} as const;

export default function TabLayout() {
  const rawScheme = useColorScheme();
  const colorScheme = rawScheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} colors={colors} isDark={isDark} insets={insets} />}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.tabIconDefault,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: TAB_LABELS.index,
          tabBarAccessibilityLabel: 'Home tab',
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: TAB_LABELS.progress,
          tabBarAccessibilityLabel: 'Progress tab',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: TAB_LABELS.profile,
          tabBarAccessibilityLabel: 'Profile tab',
        }}
      />
    </Tabs>
  );
}

// Custom Tab Bar
interface CustomTabBarProps {
  state: { index: number; routes: Array<{ key: string; name: string }> };
  descriptors: Record<string, { options: { title?: string; tabBarAccessibilityLabel?: string } }>;
  navigation: any;
  colors: ColorTokens;
  isDark: boolean;
  insets: { bottom: number };
}

function CustomTabBar({ state, descriptors, navigation, colors, isDark, insets }: CustomTabBarProps) {
  return (
    <View
      style={[styles.tabBarWrapper, { paddingBottom: Math.max(insets.bottom, Spacing.xs) }]}
      accessibilityRole="tablist"
    >
      <View style={[
        styles.tabBarContainer,
        {
          backgroundColor: isDark
            ? 'rgba(28, 28, 30, 0.92)'
            : 'rgba(255, 255, 255, 0.92)',
          borderColor: isDark
            ? 'rgba(255, 255, 255, 0.10)'
            : 'rgba(0, 0, 0, 0.08)',
        }
      ]}>
        {/* Blur background */}
        <BlurView
          intensity={isDark ? 80 : 60}
          tint={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />

        {/* Tab items */}
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label = options.title ?? route.name;
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.navigate(route.name);
            }
          };

          return (
            <TabItem
              key={route.key}
              label={label}
              routeName={route.name as keyof typeof TAB_ICONS}
              isFocused={isFocused}
              onPress={onPress}
              colors={colors}
              isDark={isDark}
              accessibilityLabel={options.tabBarAccessibilityLabel ?? `${label} tab`}
            />
          );
        })}
      </View>
    </View>
  );
}

// Individual Tab Item
interface TabItemProps {
  label: string;
  routeName: keyof typeof TAB_ICONS;
  isFocused: boolean;
  onPress: () => void;
  colors: ColorTokens;
  isDark: boolean;
  accessibilityLabel: string;
}

function TabItem({ label, routeName, isFocused, onPress, colors, isDark, accessibilityLabel }: TabItemProps) {
  const scale = useSharedValue(1);
  const indicatorOpacity = useSharedValue(isFocused ? 1 : 0);
  const indicatorScale = useSharedValue(isFocused ? 1 : 0.6);

  React.useEffect(() => {
    indicatorOpacity.value = withTiming(isFocused ? 1 : 0, { duration: 200 });
    indicatorScale.value = withSpring(isFocused ? 1 : 0.6, {
      damping: 15,
      stiffness: 300,
    });
  }, [isFocused]);

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.88, { damping: 15, stiffness: 400 });
  }, []);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 12, stiffness: 300 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const indicatorStyle = useAnimatedStyle(() => ({
    opacity: indicatorOpacity.value,
    transform: [{ scale: indicatorScale.value }],
  }));

  const iconData = TAB_ICONS[routeName];
  const iconName = iconData?.[isFocused ? 'iconActive' : 'icon'] ?? 'ellipse';

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="tab"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected: isFocused }}
      style={styles.tabItem}
    >
      <Animated.View style={[styles.tabItemInner, animatedStyle]}>
        {/* Active indicator pill — higher contrast */}
        <Animated.View
          style={[
            styles.activeIndicator,
            {
              backgroundColor: isDark
                ? 'rgba(10, 132, 255, 0.25)'
                : 'rgba(0, 122, 255, 0.12)',
            },
            indicatorStyle,
          ]}
        />

        {/* Icon — using Ionicons for proper SF Symbol fallback */}
        <View style={styles.iconContainer}>
          <Ionicons
            name={iconName as any}
            size={22}
            color={isFocused
              ? (isDark ? '#0A84FF' : '#007AFF')
              : (colors.tabIconDefault as string)}
          />
        </View>

        {/* Text label under icon */}
        <Text
          style={[
            styles.tabLabel,
            {
              color: isFocused
                ? (isDark ? '#0A84FF' : '#007AFF')
                : (colors.tabIconDefault as string),
              fontWeight: isFocused ? '600' : '400',
            },
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tabBarWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
  },
  tabBarContainer: {
    flexDirection: 'row',
    borderRadius: 28,
    borderWidth: 0.5,
    overflow: 'hidden',
    width: '100%',
    paddingVertical: Spacing.xxs,
    paddingHorizontal: Spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  tabItemInner: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxs + 2,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.xl,
    position: 'relative',
    minWidth: 64,
  },
  activeIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: BorderRadius.xl,
  },
  iconContainer: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 2,
  },
});
