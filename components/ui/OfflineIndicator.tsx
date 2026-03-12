/**
 * Declutterly - Offline Indicator Component
 * Shows a subtle banner when the device is offline
 * Supports light and dark mode themes
 */

import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, Pressable } from 'react-native';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  interpolate,
  useReducedMotion,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';

interface OfflineIndicatorProps {
  onPress?: () => void;
}

export function OfflineIndicator({ onPress }: OfflineIndicatorProps) {
  const [isOffline, setIsOffline] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const colorScheme = useColorScheme() ?? 'dark';

  // Animation values
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);
  const showReconnected = useSharedValue(0);

  useEffect(() => {
    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const offline = !state.isConnected || !state.isInternetReachable;

      if (offline !== isOffline) {
        if (!offline && isOffline) {
          // Just came back online - show reconnected briefly
          setWasOffline(true);
          showReconnected.value = 1;

          // Hide after 2 seconds
          setTimeout(() => {
            showReconnected.value = 0;
            setTimeout(() => setWasOffline(false), 300);
          }, 2000);
        }
        setIsOffline(offline);
      }
    });

    // Check initial state
    NetInfo.fetch().then((state) => {
      setIsOffline(!state.isConnected || !state.isInternetReachable);
    });

    return () => unsubscribe();
  }, [isOffline]);

  // Animate in/out based on offline status
  useEffect(() => {
    if (isOffline || wasOffline) {
      translateY.value = reducedMotion
        ? withTiming(0, { duration: 200 })
        : withSpring(0, { damping: 20, stiffness: 300 });
      opacity.value = withTiming(1, { duration: 200 });
    } else {
      translateY.value = reducedMotion
        ? withTiming(-100, { duration: 200 })
        : withTiming(-100, { duration: 300 });
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [isOffline, wasOffline, reducedMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const reconnectedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(showReconnected.value, [0, 1], [0, 1]),
  }));

  const offlineStyle = useAnimatedStyle(() => ({
    opacity: interpolate(showReconnected.value, [0, 1], [1, 0]),
  }));

  if (!isOffline && !wasOffline) {
    return null;
  }

  // Theme-aware colors
  const offlineBackgroundColor = colorScheme === 'dark'
    ? 'rgba(255, 69, 58, 0.95)'  // Dark mode red (iOS system red dark)
    : 'rgba(255, 59, 48, 0.95)'; // Light mode red (iOS system red light)

  const reconnectedBackgroundColor = colorScheme === 'dark'
    ? 'rgba(48, 209, 88, 0.95)'  // Dark mode green (iOS system green dark)
    : 'rgba(52, 199, 89, 0.95)'; // Light mode green (iOS system green light)

  const textColor = '#FFFFFF'; // White text has good contrast on both colored backgrounds
  const subtextColor = 'rgba(255, 255, 255, 0.85)';

  return (
    <Animated.View
      style={[
        styles.container,
        { paddingTop: insets.top + 4 },
        animatedStyle,
      ]}
    >
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.banner,
          {
            backgroundColor: wasOffline && !isOffline
              ? reconnectedBackgroundColor
              : offlineBackgroundColor,
          },
          pressed && styles.pressed,
        ]}
      >
        {/* Offline state */}
        <Animated.View style={[styles.content, offlineStyle]}>
          <Ionicons
            name="cloud-offline-outline"
            size={16}
            color={textColor}
            style={styles.icon}
          />
          <Text style={[styles.text, { color: textColor }]}>You&apos;re offline</Text>
          <Text style={[styles.subtext, { color: subtextColor }]}>Some features may be limited</Text>
        </Animated.View>

        {/* Reconnected state */}
        <Animated.View style={[styles.content, styles.absolute, reconnectedStyle]}>
          <Ionicons
            name="checkmark-circle-outline"
            size={16}
            color={textColor}
            style={styles.icon}
          />
          <Text style={[styles.text, { color: textColor }]}>Back online!</Text>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9998,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  banner: {
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  absolute: {
    position: 'absolute',
    left: 0,
    right: 0,
    justifyContent: 'center',
  },
  icon: {
    marginRight: 8,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 6,
  },
  subtext: {
    fontSize: 12,
  },
});

export default OfflineIndicator;
