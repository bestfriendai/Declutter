/**
 * ScanRoomFAB -- Floating action button with gradient for scanning rooms
 */

import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Camera } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { BODY_FONT, RADIUS } from '@/constants/designTokens';

interface ScanRoomFABProps {
  onPress: () => void;
  bottomInset: number;
}

export function ScanRoomFAB({ onPress, bottomInset }: ScanRoomFABProps) {
  return (
    <Animated.View
      entering={FadeInDown.delay(300).duration(400)}
      style={[styles.fabContainer, { bottom: bottomInset + 90 }]}
    >
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onPress();
        }}
        accessibilityRole="button"
        accessibilityLabel="Scan a room"
        accessibilityHint="Open camera to scan a new room"
        style={({ pressed }) => [{ opacity: pressed ? 0.88 : 1 }]}
      >
        <LinearGradient
          colors={['#FF6B6B', '#FF5252']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fab}
        >
          <Camera size={22} color="#FFFFFF" strokeWidth={2.5} />
          <Text style={styles.fabText}>Scan Room</Text>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fabContainer: {
    position: 'absolute',
    right: 20,
    zIndex: 10,
  },
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: RADIUS.pill,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    fontFamily: BODY_FONT,
  },
});
