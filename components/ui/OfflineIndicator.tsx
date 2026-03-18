/**
 * Declutterly - Offline Indicator Component
 * Shows a subtle banner when the device is offline
 * Supports light and dark mode themes
 */

import { OFFLINE_STATUS_COPY } from '@/constants/copy';
import { Time } from '@/constants/time';
import { useColorScheme } from '@/hooks/useColorScheme';
import { CloudOff, CircleCheck } from 'lucide-react-native';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
    interpolate,
    useAnimatedStyle,
    useReducedMotion,
    useSharedValue,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

  // Ref tracks current offline state so the subscription closure never goes stale
  // and we can avoid putting `isOffline` in the effect deps (which caused an infinite loop
  // because every setIsOffline() call would re-create the NetInfo subscription).
  const isOfflineRef = React.useRef(false);

  useEffect(() => {
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
    let hideTimeout: ReturnType<typeof setTimeout> | null = null;

    const handleState = (state: NetInfoState) => {
      // Treat null isInternetReachable as "unknown/checking", not offline
      const offline = !state.isConnected || state.isInternetReachable === false;
      const prev = isOfflineRef.current;

      if (offline === prev) return;

      if (!offline && prev) {
        // Just came back online - show reconnected briefly
        setWasOffline(true);
        showReconnected.value = 1;

        if (reconnectTimeout) clearTimeout(reconnectTimeout);
        if (hideTimeout) clearTimeout(hideTimeout);

        reconnectTimeout = setTimeout(() => {
          showReconnected.value = 0;
          hideTimeout = setTimeout(() => setWasOffline(false), Time.OFFLINE_BANNER_EXIT_MS);
        }, Time.OFFLINE_RECONNECTED_MS);
      }

      isOfflineRef.current = offline;
      setIsOffline(offline);
    };

    // Subscribe to network state changes (subscribe once, never re-subscribe)
    const unsubscribe = NetInfo.addEventListener(handleState);

    // Check initial state
    NetInfo.fetch().then(handleState);

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (hideTimeout) clearTimeout(hideTimeout);
      unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
  }, [isOffline, wasOffline, reducedMotion, opacity, translateY]);

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
        disabled={!onPress}
        style={({ pressed }) => [
          styles.banner,
          {
            backgroundColor: wasOffline && !isOffline
              ? reconnectedBackgroundColor
              : offlineBackgroundColor,
          },
          onPress && pressed && styles.pressed,
        ]}
        accessibilityRole={onPress ? 'button' : undefined}
        accessibilityLabel={
          wasOffline && !isOffline
            ? `${OFFLINE_STATUS_COPY.reconnectedTitle}. ${OFFLINE_STATUS_COPY.reconnectedMessage}`
            : `${OFFLINE_STATUS_COPY.offlineTitle}. ${OFFLINE_STATUS_COPY.offlineMessage}`
        }
      >
        {/* Offline state */}
        <Animated.View style={[styles.content, offlineStyle]}>
          <CloudOff
            size={16}
            color={textColor}
            style={styles.icon}
          />
          <View style={styles.textGroup}>
            <Text style={[styles.text, { color: textColor }]}>
              {OFFLINE_STATUS_COPY.offlineTitle}
            </Text>
            <Text style={[styles.subtext, { color: subtextColor }]}>
              {OFFLINE_STATUS_COPY.offlineMessage}
            </Text>
          </View>
        </Animated.View>

        {/* Reconnected state */}
        <Animated.View style={[styles.content, styles.absolute, reconnectedStyle]}>
          <CircleCheck
            size={16}
            color={textColor}
            style={styles.icon}
          />
          <View style={styles.textGroup}>
            <Text style={[styles.text, { color: textColor }]}>
              {OFFLINE_STATUS_COPY.reconnectedTitle}
            </Text>
            <Text style={[styles.subtext, { color: subtextColor }]}>
              {OFFLINE_STATUS_COPY.reconnectedMessage}
            </Text>
          </View>
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
    justifyContent: 'flex-start',
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
    justifyContent: 'flex-start',
    flex: 1,
  },
  absolute: {
    position: 'absolute',
    left: 16,
    right: 16,
    justifyContent: 'flex-start',
  },
  icon: {
    marginRight: 8,
    marginTop: 1,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
  },
  textGroup: {
    flex: 1,
    gap: 2,
  },
  subtext: {
    fontSize: 12,
    lineHeight: 16,
  },
});

export default OfflineIndicator;
