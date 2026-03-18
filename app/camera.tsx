/**
 * Declutterly -- Camera / Scan Room (V1)
 * Matches Pencil design: KzTY3
 *
 * - Full screen camera preview
 * - "Scan Room" title
 * - Corner bracket viewfinder
 * - "Hold steady -- capture the full room" hint
 * - Room type pills (Bedroom, Kitchen, Bathroom, Living)
 * - Shutter button + gallery picker
 * - Back arrow
 */

import React, { useRef, useState, useCallback } from 'react';
import { useColorScheme } from '@/hooks/useColorScheme';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Pressable,
  Alert,
  Linking,
  ScrollView,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, ImageIcon } from 'lucide-react-native';

import { useDeclutter } from '@/context/DeclutterContext';
import { RoomType } from '@/types/declutter';

// ─── V1 Design Tokens ────────────────────────────────────────────────────────
const V1 = {
  coral: '#FF6B6B',
  green: '#66BB6A',
  amber: '#FFB74D',
};

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Room types for quick selection
const ROOM_TYPES: { key: RoomType; label: string; emoji: string }[] = [
  { key: 'bedroom', label: 'Bedroom', emoji: '🛏️' },
  { key: 'kitchen', label: 'Kitchen', emoji: '🍳' },
  { key: 'bathroom', label: 'Bathroom', emoji: '🚿' },
  { key: 'livingRoom', label: 'Living', emoji: '🛋️' },
  { key: 'office', label: 'Office', emoji: '💻' },
  { key: 'closet', label: 'Closet', emoji: '👕' },
];

export default function CameraScreen() {
  const rawScheme = useColorScheme();
  const isDark = rawScheme === 'dark';
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [selectedType, setSelectedType] = useState<RoomType>('bedroom');
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const handleCapture = useCallback(async () => {
    if (isCapturing || !cameraRef.current) return;
    setIsCapturing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
      });
      if (photo?.uri) {
        router.push({
          pathname: '/analysis',
          params: {
            photoUri: photo.uri,
            roomType: selectedType,
            roomName: ROOM_TYPES.find(r => r.key === selectedType)?.label || 'Room',
          },
        });
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to capture photo. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  }, [isCapturing, selectedType]);

  const handlePickImage = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      router.push({
        pathname: '/analysis',
        params: {
          photoUri: result.assets[0].uri,
          roomType: selectedType,
          roomName: ROOM_TYPES.find(r => r.key === selectedType)?.label || 'Room',
        },
      });
    }
  }, [selectedType]);

  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, []);

  // Permission not granted — V1 Pencil "Camera Access Needed" design
  if (!permission?.granted) {
    return (
      <View style={[styles.permissionContainer, { backgroundColor: isDark ? '#0C0C0C' : '#FAFAFA' }]}>
        {/* Camera-off icon circle */}
        <View style={styles.permissionIconWrap}>
          <View style={styles.permissionIconCircle}>
            <Text style={styles.permissionIconEmoji}>{'\uD83D\uDEAB'}</Text>
          </View>
        </View>

        <Text style={[styles.permissionTitle, { color: isDark ? '#FFFFFF' : '#1A1A1A' }]}>Camera Access Needed</Text>
        <Text style={[styles.permissionText, { color: isDark ? 'rgba(255,255,255,0.6)' : '#6B7280' }]}>
          To scan your rooms, Declutter needs camera{'\n'}access. Don't worry — photos stay on your device.
        </Text>

        <Pressable
          onPress={async () => {
            const result = await requestPermission();
            if (!result.granted) {
              Linking.openSettings();
            }
          }}
          style={({ pressed }) => [styles.permissionButton, { opacity: pressed ? 0.88 : 1 }]}
        >
          <LinearGradient
            colors={[V1.coral, '#FF5252']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.permissionButtonGradient}
          >
            <Text style={styles.permissionButtonText}>Open Settings</Text>
          </LinearGradient>
        </Pressable>

        <Pressable onPress={handleBack} style={styles.permissionSecondary}>
          <Text style={[styles.permissionSecondaryText, { color: isDark ? 'rgba(255,255,255,0.5)' : '#6B7280' }]}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Camera preview */}
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="back"
      />

      {/* Top bar */}
      <Animated.View
        entering={FadeIn.duration(300)}
        style={[styles.topBar, { paddingTop: insets.top + 8 }]}
      >
        <Pressable onPress={handleBack} hitSlop={12}>
          <ChevronLeft size={28} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.title}>Scan Room</Text>
        <View style={{ width: 28 }} />
      </Animated.View>

      {/* Viewfinder brackets */}
      <View style={styles.viewfinder}>
        {/* Top-left */}
        <View style={[styles.bracket, styles.bracketTL]} />
        {/* Top-right */}
        <View style={[styles.bracket, styles.bracketTR]} />
        {/* Bottom-left */}
        <View style={[styles.bracket, styles.bracketBL]} />
        {/* Bottom-right */}
        <View style={[styles.bracket, styles.bracketBR]} />
      </View>

      {/* Hint text */}
      <View style={styles.hintContainer}>
        <Text style={styles.hintText}>Hold steady -- capture the full room</Text>
      </View>

      {/* Room type pills */}
      <Animated.View entering={FadeInUp.delay(100).duration(300)} style={styles.pillsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsScroll}>
          {ROOM_TYPES.map(type => {
            const isSelected = selectedType === type.key;
            return (
              <Pressable
                key={type.key}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedType(type.key);
                }}
                style={[
                  styles.pill,
                  isSelected && { backgroundColor: V1.coral },
                  !isSelected && { backgroundColor: 'rgba(0,0,0,0.4)' },
                ]}
              >
                <Text style={[styles.pillText, isSelected && { color: '#FFFFFF' }]}>
                  {type.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </Animated.View>

      {/* Bottom controls */}
      <Animated.View
        entering={FadeInDown.delay(100).duration(300)}
        style={[styles.bottomControls, { paddingBottom: insets.bottom + 20 }]}
      >
        {/* Gallery picker */}
        <Pressable onPress={handlePickImage} style={styles.galleryButton}>
          <ImageIcon size={24} color="#FFFFFF" />
        </Pressable>

        {/* Shutter button */}
        <Pressable onPress={handleCapture} disabled={isCapturing}>
          <View style={styles.shutterOuter}>
            <View style={[styles.shutterInner, isCapturing && { opacity: 0.5 }]} />
          </View>
        </Pressable>

        {/* Spacer for alignment */}
        <View style={{ width: 48 }} />
      </Animated.View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const BRACKET_SIZE = 40;
const BRACKET_THICKNESS = 3;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },

  // Permission screen — V1 Pencil design
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  permissionIconWrap: {
    marginBottom: 28,
  },
  permissionIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,183,77,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionIconEmoji: {
    fontSize: 32,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  permissionButton: {
    width: '100%',
    marginBottom: 16,
  },
  permissionButtonGradient: {
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  permissionSecondary: {
    paddingVertical: 10,
  },
  permissionSecondaryText: {
    fontSize: 14,
  },

  // Top bar
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },

  // Viewfinder brackets
  viewfinder: {
    position: 'absolute',
    top: '25%',
    left: '15%',
    right: '15%',
    bottom: '35%',
  },
  bracket: {
    position: 'absolute',
    width: BRACKET_SIZE,
    height: BRACKET_SIZE,
  },
  bracketTL: {
    top: 0,
    left: 0,
    borderTopWidth: BRACKET_THICKNESS,
    borderLeftWidth: BRACKET_THICKNESS,
    borderColor: '#FFFFFF',
  },
  bracketTR: {
    top: 0,
    right: 0,
    borderTopWidth: BRACKET_THICKNESS,
    borderRightWidth: BRACKET_THICKNESS,
    borderColor: '#FFFFFF',
  },
  bracketBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: BRACKET_THICKNESS,
    borderLeftWidth: BRACKET_THICKNESS,
    borderColor: '#FFFFFF',
  },
  bracketBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: BRACKET_THICKNESS,
    borderRightWidth: BRACKET_THICKNESS,
    borderColor: '#FFFFFF',
  },

  // Hint
  hintContainer: {
    position: 'absolute',
    top: '55%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  hintText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
  },

  // Pills
  pillsContainer: {
    position: 'absolute',
    bottom: 140,
    left: 0,
    right: 0,
  },
  pillsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  pillText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '600',
  },

  // Bottom controls
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 40,
  },
  galleryButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterOuter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#FFFFFF',
  },
});
