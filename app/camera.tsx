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
import { Image } from 'expo-image';
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
  ENERGY_LEVELS,
  TIME_OPTIONS as TIME_OPTION_VALUES,
} from '@/constants/app';
import { V1, BODY_FONT, DISPLAY_FONT, getTheme } from '@/constants/designTokens';
import { useDeclutter } from '@/context/DeclutterContext';
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

// Energy options (derived from shared constants)
const ENERGY_EMOJIS: Record<string, string> = { exhausted: '😴', low: '🔋', moderate: '😊', high: '⚡', hyperfocused: '🔥' };
const ENERGY_DISPLAY_LABELS: Record<string, string> = { exhausted: 'Running on empty', low: 'Low energy', moderate: 'Normal', high: "Let's go!", hyperfocused: 'In the zone!' };
const ENERGY_OPTIONS: { key: string; label: string; emoji: string }[] = ENERGY_LEVELS.map(key => ({
  key,
  label: ENERGY_DISPLAY_LABELS[key] || key,
  emoji: ENERGY_EMOJIS[key] || '😊',
}));

// Time options (derived from shared constants)
const TIME_OPTIONS: { minutes: number; label: string }[] = TIME_OPTION_VALUES.map(m => ({
  minutes: m,
  label: m >= 60 ? '1 hour+' : `${m} min`,
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
  const [pendingPhotoUri, setPendingPhotoUri] = useState<string | null>(null);
  const [showContextPicker, setShowContextPicker] = useState(false);
  const [contextExpanded, setContextExpanded] = useState(false);
  const { user } = useDeclutter();
  // Pre-fill energy and time from user profile when available
  const [selectedEnergy, setSelectedEnergy] = useState<string>(() => {
    const energy = user?.energyLevel;
    if (energy && ENERGY_LEVELS.includes(energy as typeof ENERGY_LEVELS[number])) return energy;
    return 'moderate';
  });
  const [selectedTime, setSelectedTime] = useState<number>(() => {
    // Snap to nearest available option (5, 15, 30, 60)
    const t = user?.timeAvailability;
    if (!t) return 30;
    if (t <= 5) return 5;
    if (t <= 15) return 15;
    if (t <= 30) return 30;
    return 60;
  });

  // Pre-filled if user has energy level and time set in their profile
  const isPreFilled = !!(user?.energyLevel && user?.timeAvailability);

  const handleCapture = useCallback(async () => {
    if (isCapturing || !cameraRef.current) return;
    setIsCapturing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
      });
      if (photo?.uri) {
        setPendingPhotoUri(photo.uri);
        setShowContextPicker(true);
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
        setPendingPhotoUri(result.assets[0].uri);
        setShowContextPicker(true);
      }
    } catch (err) {
      Alert.alert('Could not open photo library', 'Please check your permissions and try again.');
    }
  }, [selectedType]);

  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, []);

  const handleContextConfirm = useCallback(() => {
    if (!pendingPhotoUri) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowContextPicker(false);

    router.push({
      pathname: '/analysis',
      params: {
        photoUri: pendingPhotoUri,
        roomType: selectedType,
        roomName: ROOM_TYPES.find(r => r.key === selectedType)?.label || 'Room',
        energyLevel: selectedEnergy,
        timeAvailable: String(selectedTime),
      },
    });
  }, [pendingPhotoUri, selectedType, selectedEnergy, selectedTime]);

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

      {/* Pre-scan context picker overlay */}
      {showContextPicker && (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          <Animated.View
            entering={FadeIn.duration(200)}
            style={[
              styles.contextOverlay,
              { paddingBottom: insets.bottom + 20, paddingTop: insets.top + 20 },
            ]}
          >
            <Pressable
              style={styles.contextOverlayDismiss}
              onPress={() => { setShowContextPicker(false); setPendingPhotoUri(null); }}
            />
            <View style={[styles.contextSheet, { backgroundColor: t.card }]}>
              {/* Drag handle */}
              <View style={styles.dragHandle} />
              {/* Photo preview */}
              {pendingPhotoUri && (
                <View style={[styles.contextPhotoPreview, { marginBottom: 16 }]}>
                  <Image
                    source={{ uri: pendingPhotoUri }}
                    style={styles.contextPhotoImage}
                    contentFit="cover"
                    placeholder={{ blurhash: 'LGF5]+Yk^6#M@-5c,1J5@[or[Q6.' }}
                    transition={200}
                  />
                </View>
              )}
              {/* Collapsed summary when pre-filled (saves 2-3 taps) */}
              {isPreFilled && !contextExpanded ? (
                <>
                  <Text style={[styles.contextTitle, { color: t.text }]}>Ready to analyze</Text>

                  {/* Summary row */}
                  <View style={styles.contextSummaryRow}>
                    <Text style={[styles.contextSummaryText, { color: t.textSecondary }]}>
                      {ENERGY_OPTIONS.find(o => o.key === selectedEnergy)?.emoji}{' '}
                      {ENERGY_OPTIONS.find(o => o.key === selectedEnergy)?.label}
                      {'  \u00B7  '}
                      {TIME_OPTIONS.find(o => o.minutes === selectedTime)?.label}
                    </Text>
                    <Pressable
                      onPress={() => setContextExpanded(true)}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel="Change energy and time settings"
                    >
                      <Text style={[styles.contextChangeLink, { color: V1.coral }]}>Change</Text>
                    </Pressable>
                  </View>

                  {/* Prominent Analyze button */}
                  <Pressable
                    onPress={handleContextConfirm}
                    style={({ pressed }) => [styles.contextConfirmButton, { opacity: pressed ? 0.88 : 1 }]}
                    accessibilityRole="button"
                    accessibilityLabel="Analyze my room"
                  >
                    <LinearGradient
                      colors={[V1.coral, '#FF5252']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.contextConfirmGradient}
                    >
                      <Text style={styles.contextConfirmText}>Analyze My Room</Text>
                    </LinearGradient>
                  </Pressable>

                  <Pressable
                    onPress={() => { setShowContextPicker(false); setPendingPhotoUri(null); }}
                    style={styles.contextCancelButton}
                    accessibilityRole="button"
                    accessibilityLabel="Retake photo"
                  >
                    <Text style={[styles.contextCancelText, { color: t.textMuted }]}>Retake photo</Text>
                  </Pressable>
                </>
              ) : (
                <>
                  <Text style={[styles.contextTitle, { color: t.text }]}>Quick check before we scan</Text>
                  <Text style={[styles.contextSubtitle, { color: t.textSecondary }]}>This helps AI scale the tasks to your session</Text>

                  {/* Energy level */}
                  <Text style={[styles.contextSectionLabel, { color: t.textSecondary }]}>How's your energy?</Text>
                  <View style={styles.contextOptionRow}>
                    {ENERGY_OPTIONS.map(opt => (
                      <Pressable
                        key={opt.key}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setSelectedEnergy(opt.key);
                        }}
                        style={[
                          styles.contextOption,
                          { borderColor: t.inputBorder },
                          selectedEnergy === opt.key && { backgroundColor: V1.coral, borderColor: V1.coral },
                        ]}
                      >
                        <Text style={styles.contextOptionEmoji}>{opt.emoji}</Text>
                        <Text style={[
                          styles.contextOptionLabel,
                          { color: selectedEnergy === opt.key ? '#FFFFFF' : t.textSecondary },
                        ]}>
                          {opt.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>

                  {/* Time available */}
                  <Text style={[styles.contextSectionLabel, { color: t.textSecondary }]}>How much time do you have?</Text>
                  <View style={styles.contextTimeRow}>
                    {TIME_OPTIONS.map(opt => (
                      <Pressable
                        key={opt.minutes}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setSelectedTime(opt.minutes);
                        }}
                        style={[
                          styles.contextTimeOption,
                          { borderColor: t.inputBorder },
                          selectedTime === opt.minutes && { backgroundColor: V1.coral, borderColor: V1.coral },
                        ]}
                      >
                        <Text style={[
                          styles.contextTimeLabel,
                          { color: selectedTime === opt.minutes ? '#FFFFFF' : t.textSecondary },
                        ]}>
                          {opt.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>

                  {/* Confirm */}
                  <Pressable
                    onPress={handleContextConfirm}
                    style={({ pressed }) => [styles.contextConfirmButton, { opacity: pressed ? 0.88 : 1 }]}
                    accessibilityRole="button"
                    accessibilityLabel="Analyze my room"
                  >
                    <LinearGradient
                      colors={[V1.coral, '#FF5252']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.contextConfirmGradient}
                    >
                      <Text style={styles.contextConfirmText}>Analyze My Room</Text>
                    </LinearGradient>
                  </Pressable>

                  <Pressable
                    onPress={() => { setShowContextPicker(false); setPendingPhotoUri(null); }}
                    style={styles.contextCancelButton}
                    accessibilityRole="button"
                    accessibilityLabel="Retake photo"
                  >
                    <Text style={[styles.contextCancelText, { color: t.textMuted }]}>Retake photo</Text>
                  </Pressable>
                </>
              )}
            </View>
          </Animated.View>
        </View>
      )}
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
  contextOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  contextOverlayDismiss: {
    flex: 1,
  },
  contextSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 8,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(128,128,128,0.3)',
    alignSelf: 'center',
    marginBottom: 16,
  },
  contextPhotoPreview: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  contextPhotoImage: {
    width: '100%',
    height: '100%',
  },
  contextTitle: {
    fontFamily: DISPLAY_FONT,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  contextSubtitle: {
    fontFamily: BODY_FONT,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  contextSectionLabel: {
    fontFamily: BODY_FONT,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  contextOptionRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  contextOption: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  contextOptionEmoji: {
    fontSize: 20,
  },
  contextOptionLabel: {
    fontFamily: BODY_FONT,
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  contextTimeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  contextTimeOption: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contextTimeLabel: {
    fontFamily: BODY_FONT,
    fontSize: 13,
    fontWeight: '600',
  },
  contextConfirmButton: {
    width: '100%',
    marginBottom: 12,
  },
  contextConfirmGradient: {
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contextConfirmText: {
    fontFamily: BODY_FONT,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  contextCancelButton: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  contextCancelText: {
    fontFamily: BODY_FONT,
    fontSize: 14,
  },
  contextSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 4,
    marginBottom: 16,
  },
  contextSummaryText: {
    fontFamily: BODY_FONT,
    fontSize: 15,
    fontWeight: '500',
  },
  contextChangeLink: {
    fontFamily: BODY_FONT,
    fontSize: 14,
    fontWeight: '600',
  },
});
