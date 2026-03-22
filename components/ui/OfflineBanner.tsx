/**
 * OfflineBanner -- Subtle yellow banner shown when the device is offline.
 * "You're offline. Changes will sync when you reconnect."
 * Slides in from top with animation.
 */

import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { BODY_FONT, V1 } from '@/constants/designTokens';

export function OfflineBanner() {
  const { isOffline } = useNetworkStatus();
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(-60);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (isOffline) {
      translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
      opacity.value = withTiming(1, { duration: 300 });
    } else {
      translateY.value = withTiming(-60, { duration: 250 });
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [isOffline]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!isOffline) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { paddingTop: insets.top + 4 },
        animatedStyle,
      ]}
      pointerEvents="none"
    >
      <View style={styles.inner}>
        <Text style={styles.icon}>{'\u26A0\uFE0F'}</Text>
        <Text style={styles.text}>
          You're offline. Changes will sync when you reconnect.
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    backgroundColor: 'rgba(255, 183, 77, 0.95)',
    paddingBottom: 8,
    paddingHorizontal: 16,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  icon: {
    fontSize: 14,
  },
  text: {
    fontFamily: BODY_FONT,
    fontSize: 13,
    fontWeight: '600',
    color: '#333333',
  },
});
