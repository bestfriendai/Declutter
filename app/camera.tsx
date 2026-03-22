/**
 * Declutterly -- Camera / Scan Room (V1)
 * Matches Pencil design: KzTY3
 *
 * - Full screen camera preview
 * - "Scan Room" title
 * - Corner bracket viewfinder
 * - "Capture the full room, floor to ceiling" hint
 * - Room type pills (Bedroom, Kitchen, Bathroom, Living)
 * - Shutter button + gallery picker
 * - Back arrow
 */

import { useColorScheme } from '@/hooks/useColorScheme';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ChevronLeft, ImageIcon, Zap, ZapOff } from 'lucide-react-native';
import React, { useCallback, useRef, useState } from 'react';
import {
    Alert,
    Linking,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

import { ScreenErrorBoundary } from '@/components/ErrorBoundary';
import {
  ROOM_TYPES as ROOM_TYPE_KEYS,
  ROOM_TYPE_LABELS,
} from '@/constants/app';
import { V1, BODY_FONT, DISPLAY_FONT, getTheme } from '@/constants/designTokens';
import { RoomType } from '@/types/declutter';

// Dimensions moved to useWindowDimensions() inside component for dynamic sizing

// Room types for quick selection (derived from shared constants)
const ROOM_EMOJIS: Record<string, string> = {
  bedroom: '🛏️', kitchen: '🍳', bathroom: '🚿', living: '🛋️', office: '💻', closet: '👕',
};
const ROOM_TYPES: { key: RoomType; label: string; emoji: string }[] = ROOM_TYPE_KEYS.map(key => ({
  key: key === 'living' ? 'livingRoom' as RoomType : key as RoomType,
  label: ROOM_TYPE_LABELS[key],
  emoji: ROOM_EMOJIS[key] || '📦',
}));


export default function CameraScreen() {
  return (
    <ScreenErrorBoundary screenName="camera">
      <CameraScreenContent />
    </ScreenErrorBoundary>
  );
}

function CameraScreenContent() {
  const rawScheme = useColorScheme();
  const isDark = rawScheme === 'dark';
  const t = getTheme(isDark);
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [selectedType, setSelectedType] = useState<RoomType>('bedroom');
  const [isCapturing, setIsCapturing] = useState(false);
  const reducedMotion = useReducedMotion();
  // Flash toggle: auto -> on -> off cycle
  const [flashMode, setFlashMode] = useState<'auto' | 'on' | 'off'>('auto');
  const handleFlashToggle = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFlashMode(prev => {
      if (prev === 'auto') return 'on';
      if (prev === 'on') return 'off';
      return 'auto';
    });
  }, []);
  // Shutter button scale animation
  const shutterScale = useSharedValue(1);
  const shutterAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: shutterScale.value }],
  }));

  const handleCapture = useCallback(async () => {
    if (isCapturing || !cameraRef.current) return;
    setIsCapturing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
      });
      if (photo?.uri) {
        handleGoToAnalysis(photo.uri);
      } else {
        Alert.alert('Camera not ready', 'Please wait a moment and try again.');
      }
    } catch (err) {
      Alert.alert('Photo capture failed', 'Please try again. Make sure the room is well-lit and hold steady.');
    } finally {
      setIsCapturing(false);
    }
  }, [isCapturing, selectedType]);

  const handlePickImage = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        handleGoToAnalysis(result.assets[0].uri);
      }
    } catch (err) {
      Alert.alert('Could not open photo library', 'Please check your permissions and try again.');
    }
  }, [selectedType]);

  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, []);

  // Go straight to analysis with defaults — skip energy/time picker for v1
  const handleGoToAnalysis = useCallback((photoUri: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: '/analysis',
      params: {
        photoUri,
        roomType: selectedType,
        roomName: ROOM_TYPES.find(r => r.key === selectedType)?.label || 'Room',
        energyLevel: 'moderate',
        timeAvailable: '15',
      },
    });
  }, [selectedType]);

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
          onPress={handlePickImage}
          style={({ pressed }) => [styles.permissionButton, { opacity: pressed ? 0.88 : 1 }]}
        >
          <LinearGradient
            colors={[V1.coral, '#FF5252']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.permissionButtonGradient}
          >
            <Text style={styles.permissionButtonText}>Choose from Gallery</Text>
          </LinearGradient>
        </Pressable>

        <Pressable
          onPress={async () => {
            const result = await requestPermission();
            if (!result.granted) {
              Linking.openSettings();
            }
          }}
          style={({ pressed }) => [styles.permissionButton, { opacity: pressed ? 0.88 : 1 }]}
        >
          <View style={[styles.permissionButtonGradient, {
            borderWidth: 1,
            borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)',
          }]}>
            <Text style={[styles.permissionButtonText, { color: isDark ? 'rgba(255,255,255,0.7)' : '#6B7280' }]}>Open Settings</Text>
          </View>
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
        enableTorch={flashMode === 'on'}
      />

      {/* Top bar */}
      <Animated.View
        entering={reducedMotion ? undefined : FadeIn.duration(300)}
        style={[styles.topBar, { paddingTop: insets.top + 8 }]}
      >
        <Pressable
          onPress={handleBack}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ChevronLeft size={28} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.title}>Scan Room</Text>
        <Pressable
          onPress={handleFlashToggle}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={`Flash ${flashMode}`}
          accessibilityHint="Double tap to change flash mode"
          style={styles.flashButton}
        >
          {flashMode === 'off' ? (
            <ZapOff size={20} color="#FFFFFF" />
          ) : (
            <Zap size={20} color={flashMode === 'on' ? V1.gold : '#FFFFFF'} fill={flashMode === 'on' ? V1.gold : 'transparent'} />
          )}
          <Text style={styles.flashLabel}>{flashMode === 'auto' ? 'Auto' : flashMode === 'on' ? 'On' : 'Off'}</Text>
        </Pressable>
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
        <Text style={styles.hintText}>Just capture what you can see</Text>
      </View>

      {/* Room type pills */}
      <Animated.View entering={reducedMotion ? undefined : FadeInUp.delay(100).duration(300)} style={styles.pillsContainer}>
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
                accessibilityRole="button"
                accessibilityLabel={`Room type: ${type.label}`}
                accessibilityState={{ selected: isSelected }}
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
        entering={reducedMotion ? undefined : FadeInDown.delay(100).duration(300)}
        style={[styles.bottomControls, { paddingBottom: insets.bottom + 20 }]}
      >
        {/* Gallery picker */}
        <Pressable
          onPress={handlePickImage}
          style={styles.galleryButton}
          accessibilityRole="button"
          accessibilityLabel="Choose from gallery"
          accessibilityHint="Double tap to pick a photo from your library"
        >
          <ImageIcon size={24} color="#FFFFFF" />
        </Pressable>

        {/* Shutter button */}
        <AnimatedPressable
          onPress={handleCapture}
          onPressIn={() => {
            shutterScale.value = withSpring(0.88, { damping: 15, stiffness: 200 });
          }}
          onPressOut={() => {
            shutterScale.value = withSpring(1, { damping: 15, stiffness: 200 });
          }}
          disabled={isCapturing}
          accessibilityRole="button"
          accessibilityLabel={isCapturing ? 'Capturing photo' : 'Take photo'}
          accessibilityHint="Double tap to capture a photo of your room"
          style={shutterAnimatedStyle}
        >
          <View style={styles.shutterOuter}>
            <View style={[styles.shutterInner, isCapturing && { opacity: 0.5 }]} />
          </View>
        </AnimatedPressable>

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
    fontFamily: DISPLAY_FONT,
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  permissionText: {
    fontFamily: BODY_FONT,
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
    fontFamily: BODY_FONT,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  permissionSecondary: {
    paddingVertical: 10,
  },
  permissionSecondaryText: {
    fontFamily: BODY_FONT,
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
    fontFamily: DISPLAY_FONT,
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  flashButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  flashLabel: {
    fontFamily: BODY_FONT,
    color: '#FFFFFF',
    fontSize: 12,
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
    fontFamily: BODY_FONT,
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
    fontFamily: BODY_FONT,
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
