/**
 * Declutterly - Camera Screen
 * Apple TV style camera with glass overlay controls
 */

import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Pressable,
  useColorScheme,
  Alert,
  ScrollView,
  Linking,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOut,
  ZoomIn,
  SlideInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { Colors } from '@/constants/Colors';
import { Typography } from '@/theme/typography';
import { Spacing, BorderRadius } from '@/theme/spacing';
import { useDeclutter } from '@/context/DeclutterContext';
import { ROOM_TYPE_INFO, RoomType } from '@/types/declutter';
import { useCardPress } from '@/hooks/useAnimatedPress';
import { ScreenErrorBoundary } from '@/components/ErrorBoundary';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function CameraScreenContent() {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const { activeRoomId, rooms, addRoom, addPhotoToRoom, setActiveRoom } = useDeclutter();
  const cameraRef = useRef<CameraView>(null);

  const [permission, requestPermission] = useCameraPermissions();
  const [capturedMedia, setCapturedMedia] = useState<{ uri: string; type: 'photo' | 'video' } | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [showRoomSelector, setShowRoomSelector] = useState(false);
  const [selectedRoomType, setSelectedRoomType] = useState<RoomType | null>(null);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [countdownActive, setCountdownActive] = useState(false);
  const [countdownValue, setCountdownValue] = useState(0);

  const activeRoom = activeRoomId ? rooms.find(r => r.id === activeRoomId) : null;

  // Animations
  const captureScale = useSharedValue(1);
  const flashOpacity = useSharedValue(0);
  const cornerScale = useSharedValue(1);

  // Pinch-to-zoom for preview
  const previewScale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const previewTranslateX = useSharedValue(0);
  const previewTranslateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  // Reset zoom when media changes
  useEffect(() => {
    previewScale.value = 1;
    savedScale.value = 1;
    previewTranslateX.value = 0;
    previewTranslateY.value = 0;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  }, [capturedMedia]);

  // Pinch gesture for zooming
  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      previewScale.value = Math.min(Math.max(savedScale.value * e.scale, 1), 4);
    })
    .onEnd(() => {
      savedScale.value = previewScale.value;
      // Snap back to 1 if close
      if (previewScale.value < 1.1) {
        previewScale.value = withSpring(1);
        savedScale.value = 1;
        previewTranslateX.value = withSpring(0);
        previewTranslateY.value = withSpring(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      }
    });

  // Pan gesture for moving zoomed image
  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (savedScale.value > 1) {
        previewTranslateX.value = savedTranslateX.value + e.translationX;
        previewTranslateY.value = savedTranslateY.value + e.translationY;
      }
    })
    .onEnd(() => {
      savedTranslateX.value = previewTranslateX.value;
      savedTranslateY.value = previewTranslateY.value;
    });

  // Double tap to reset zoom
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (savedScale.value > 1) {
        previewScale.value = withSpring(1);
        savedScale.value = 1;
        previewTranslateX.value = withSpring(0);
        previewTranslateY.value = withSpring(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else {
        previewScale.value = withSpring(2);
        savedScale.value = 2;
      }
    });

  const composedGesture = Gesture.Simultaneous(
    pinchGesture,
    panGesture,
    doubleTapGesture
  );

  const previewAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: previewScale.value },
      { translateX: previewTranslateX.value },
      { translateY: previewTranslateY.value },
    ],
  }));

  // Pulsing animation for capture button
  useEffect(() => {
    const pulse = () => {
      cornerScale.value = withSequence(
        withTiming(1.02, { duration: 1500 }),
        withTiming(1, { duration: 1500 })
      );
    };
    const interval = setInterval(pulse, 3000);
    pulse();
    return () => clearInterval(interval);
  }, []);

  const cornerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cornerScale.value }],
  }));

  const captureAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: captureScale.value }],
  }));

  const flashAnimatedStyle = useAnimatedStyle(() => ({
    opacity: flashOpacity.value,
  }));

  // Handle permission states
  if (!permission) {
    return (
      <View style={[styles.container, styles.permissionContainer]}>
        <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
        <Animated.View entering={ZoomIn.springify()} style={styles.permissionContent}>
          <Text style={styles.permissionEmoji}>📸</Text>
          <Text style={[Typography.title2, { color: '#FFFFFF', marginTop: 16 }]}>
            Loading Camera...
          </Text>
        </Animated.View>
      </View>
    );
  }

  if (!permission.granted) {
    const isPermanentlyDenied = permission.canAskAgain === false;

    const openSettings = () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      if (process.env.EXPO_OS === 'ios') {
        Linking.openURL('app-settings:');
      } else {
        Linking.openSettings();
      }
    };

    return (
      <View style={[styles.container, styles.permissionContainer]}>
        <LinearGradient
          colors={['#1a1a2e', '#16213e', '#0f3460']}
          style={StyleSheet.absoluteFill}
        />
        <Animated.View entering={FadeInDown.springify()} style={styles.permissionContent}>
          <Text style={styles.permissionEmoji} accessibilityElementsHidden>📸</Text>
          <Text style={[Typography.title1, { color: '#FFFFFF', marginTop: 20 }]} accessibilityRole="header">
            Camera Access Needed
          </Text>
          <Text style={[Typography.body, { color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginTop: 12, maxWidth: 280 }]}>
            {isPermanentlyDenied
              ? 'Camera access was denied. Please enable it in your device settings to capture photos.'
              : 'We need camera access to capture photos of your spaces for AI analysis.'}
          </Text>

          <View style={styles.permissionButtons}>
            {isPermanentlyDenied ? (
              <Pressable
                onPress={openSettings}
                style={({ pressed }) => [styles.primaryButton, { opacity: pressed ? 0.8 : 1 }]}
                accessibilityRole="button"
                accessibilityLabel="Open device settings"
                accessibilityHint="Opens settings to enable camera permission"
              >
                <LinearGradient
                  colors={[...colors.gradientPrimary]}
                  style={StyleSheet.absoluteFill}
                />
                <Text style={[Typography.headline, { color: '#FFFFFF' }]}>
                  Open Settings
                </Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={requestPermission}
                style={({ pressed }) => [styles.primaryButton, { opacity: pressed ? 0.8 : 1 }]}
                accessibilityRole="button"
                accessibilityLabel="Grant camera permission"
                accessibilityHint="Opens system dialog to allow camera access"
              >
                <LinearGradient
                  colors={[...colors.gradientPrimary]}
                  style={StyleSheet.absoluteFill}
                />
                <Text style={[Typography.headline, { color: '#FFFFFF' }]}>
                  Grant Permission
                </Text>
              </Pressable>
            )}

            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [styles.secondaryButton, { opacity: pressed ? 0.8 : 1 }]}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Text style={[Typography.body, { color: 'rgba(255,255,255,0.7)' }]}>
                Go Back
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    );
  }

  const startCountdown = () => {
    if (isCapturing || countdownActive) return;

    setCountdownActive(true);
    setCountdownValue(3);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Countdown sequence
    let count = 3;
    const countdownInterval = setInterval(() => {
      count--;
      if (count > 0) {
        setCountdownValue(count);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else {
        clearInterval(countdownInterval);
        setCountdownActive(false);
        setCountdownValue(0);
        takePictureNow();
      }
    }, 1000);
  };

  const takePictureNow = async () => {
    if (!cameraRef.current || isCapturing) return;

    try {
      setIsCapturing(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Flash animation
      flashOpacity.value = withSequence(
        withTiming(1, { duration: 50 }),
        withTiming(0, { duration: 200 })
      );

      // Capture scale animation
      captureScale.value = withSequence(
        withSpring(0.9, { damping: 10, stiffness: 400 }),
        withSpring(1, { damping: 12, stiffness: 300 })
      );

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85,
        base64: false,
      });

      if (photo?.uri) {
        setCapturedMedia({ uri: photo.uri, type: 'photo' });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  };

  const takePicture = async () => {
    // Use countdown for more deliberate capture
    startCountdown();
  };

  const pickMedia = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        quality: 0.85,
        allowsEditing: true,
        videoMaxDuration: 30,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const isVideo = asset.type === 'video' || asset.uri.includes('.mp4') || asset.uri.includes('.mov');
        setCapturedMedia({
          uri: asset.uri,
          type: isVideo ? 'video' : 'photo',
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Error picking media:', error);
      Alert.alert('Error', 'Failed to select media. Please try again.');
    }
  };

  const handleRetake = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCapturedMedia(null);
    setShowRoomSelector(false);
    setSelectedRoomType(null);
  };

  const handleAnalyze = async (roomTypeOverride?: RoomType) => {
    if (!capturedMedia) return;

    let roomId = activeRoomId;
    const effectiveRoomType = roomTypeOverride ?? selectedRoomType;

    if (!roomId) {
      if (!effectiveRoomType) {
        setShowRoomSelector(true);
        return;
      }

      const info = ROOM_TYPE_INFO[effectiveRoomType];
      const newRoom = addRoom({
        name: info.label,
        type: effectiveRoomType,
        emoji: info.emoji,
        messLevel: 0,
      });
      roomId = newRoom.id;
      setActiveRoom(roomId);
    }

    const photoType = activeRoom && activeRoom.photos.length > 0
      ? (activeRoom.currentProgress > 0 ? 'progress' : 'after')
      : 'before';

    if (!roomId) {
      Alert.alert('Error', 'Could not determine room. Please try again.');
      return;
    }

    await addPhotoToRoom(roomId, {
      uri: capturedMedia.uri,
      timestamp: new Date(),
      type: photoType,
    });

    router.replace({
      pathname: '/analysis',
      params: {
        roomId,
        imageUri: capturedMedia.uri,
        mediaType: capturedMedia.type,
      },
    });
  };

  const selectRoomType = (type: RoomType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedRoomType(type);
    setShowRoomSelector(false);
    // Pass type directly to avoid race condition with state update
    handleAnalyze(type);
  };

  // Room selector modal
  if (showRoomSelector && capturedMedia) {
    return (
      <View style={styles.container} accessibilityViewIsModal>
        <Image
          source={{ uri: capturedMedia.uri }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          blurRadius={20}
          accessibilityElementsHidden
        />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.6)' }]} accessibilityElementsHidden />

        <Animated.View
          entering={SlideInUp.springify()}
          style={[styles.roomSelectorContainer, { paddingTop: insets.top + 20 }]}
        >
          {/* Header */}
          <Pressable
            onPress={() => setShowRoomSelector(false)}
            style={styles.selectorBackButton}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
            <Text style={[Typography.body, { color: '#FFFFFF' }]}>← Back</Text>
          </Pressable>

          <Text style={[Typography.largeTitle, { color: '#FFFFFF', textAlign: 'center', marginTop: 24 }]} accessibilityRole="header">
            What type of space?
          </Text>
          <Text style={[Typography.body, { color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginTop: 8 }]}>
            Select the room type for better analysis
          </Text>

          {/* Room type grid */}
          <ScrollView
            style={styles.roomTypeScroll}
            contentContainerStyle={styles.roomTypeGrid}
            showsVerticalScrollIndicator={false}
            accessibilityRole="list"
          >
            {(Object.keys(ROOM_TYPE_INFO) as RoomType[]).map((type, index) => (
              <RoomTypeCard
                key={type}
                type={type}
                info={ROOM_TYPE_INFO[type]}
                onPress={() => selectRoomType(type)}
                delay={index * 50}
              />
            ))}
          </ScrollView>
        </Animated.View>
      </View>
    );
  }

  // Preview captured media
  if (capturedMedia) {
    return (
      <View style={styles.container}>
        {/* Full screen preview with pinch-to-zoom */}
        <GestureDetector gesture={composedGesture}>
          <Animated.View style={[StyleSheet.absoluteFill, previewAnimatedStyle]}>
            <Image
              source={{ uri: capturedMedia.uri }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
            />
          </Animated.View>
        </GestureDetector>

        {/* Zoom hint */}
        <Animated.View entering={FadeIn.delay(500)} exiting={FadeOut} style={styles.zoomHint}>
          <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
          <Text style={[Typography.caption2, { color: 'rgba(255,255,255,0.8)' }]}>
            Pinch to zoom • Double-tap to reset
          </Text>
        </Animated.View>

        {/* Top gradient overlay */}
        <LinearGradient
          colors={['rgba(0,0,0,0.6)', 'transparent']}
          style={styles.topGradient}
        />

        {/* Video indicator */}
        {capturedMedia.type === 'video' && (
          <Animated.View entering={FadeIn} style={styles.videoIndicator}>
            <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
            <Text style={styles.videoIndicatorText}>VIDEO</Text>
          </Animated.View>
        )}

        {/* Bottom controls */}
        <Animated.View
          entering={SlideInUp.delay(200).springify()}
          style={[styles.previewControls, { paddingBottom: insets.bottom + 20 }]}
        >
          <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />

          <View style={styles.previewContent}>
            <Text style={styles.previewEmoji}>
              {capturedMedia.type === 'video' ? '🎬' : '📸'}
            </Text>
            <Text style={[Typography.title2, { color: '#FFFFFF', marginTop: 8 }]}>
              {capturedMedia.type === 'video' ? 'Video Ready' : 'Photo Ready'}
            </Text>
            <Text style={[Typography.subheadline, { color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginTop: 4 }]}>
              AI will analyze this for cleaning tasks
            </Text>

            {activeRoom && (
              <View style={styles.roomTag}>
                <Text style={[Typography.caption1Medium, { color: '#FFFFFF' }]}>
                  {activeRoom.emoji} {activeRoom.name}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.previewButtons}>
            <Pressable
              onPress={handleRetake}
              style={({ pressed }) => [
                styles.retakeButton,
                { opacity: pressed ? 0.8 : 1 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Retake photo"
              accessibilityHint="Discard this photo and take a new one"
            >
              <Text style={[Typography.headline, { color: '#FFFFFF' }]}>Retake</Text>
            </Pressable>

            <Pressable
              onPress={() => handleAnalyze()}
              style={({ pressed }) => [
                styles.analyzeButton,
                { opacity: pressed ? 0.8 : 1 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Analyze photo"
              accessibilityHint="Send this photo to AI for analysis and get cleaning tasks"
            >
              <LinearGradient
                colors={[...colors.gradientPrimary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <Text style={[Typography.headline, { color: '#FFFFFF' }]}>
                ✨ Analyze
              </Text>
            </Pressable>
          </View>
        </Animated.View>

        {/* Back button */}
        <Animated.View
          entering={FadeIn}
          style={[styles.previewBackButton, { top: insets.top + 12 }]}
        >
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setCapturedMedia(null);
            }}
            style={styles.glassButton}
            accessibilityRole="button"
            accessibilityLabel="Discard photo"
            accessibilityHint="Remove this photo and return to camera"
          >
            <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
            <Text style={{ color: '#FFFFFF', fontSize: 18 }}>✕</Text>
          </Pressable>
        </Animated.View>
      </View>
    );
  }

  // Camera view - CameraView doesn't support children, so overlay is a sibling
  return (
    <View style={styles.container}>
      {/* Camera - no children allowed */}
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
        flash={flashEnabled ? 'on' : 'off'}
      />

      {/* Overlay container - positioned absolutely over camera */}
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        {/* Flash overlay */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: '#FFFFFF' },
            flashAnimatedStyle,
          ]}
          pointerEvents="none"
        />

        {/* Top gradient */}
        <LinearGradient
          colors={['rgba(0,0,0,0.5)', 'transparent']}
          style={styles.topGradient}
        />

        {/* Header */}
        <Animated.View
          entering={FadeInDown.delay(100)}
          style={[styles.header, { paddingTop: insets.top + 8 }]}
        >
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            style={styles.glassButton}
            accessibilityRole="button"
            accessibilityLabel="Close camera"
            accessibilityHint="Go back to previous screen"
          >
            <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
            <Text style={{ color: '#FFFFFF', fontSize: 18 }}>✕</Text>
          </Pressable>

          {activeRoom && (
            <Animated.View entering={FadeIn.delay(200)} style={styles.roomBadge}>
              <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
              <Text style={[Typography.caption1Medium, { color: '#FFFFFF' }]}>
                {activeRoom.emoji} {activeRoom.name}
              </Text>
            </Animated.View>
          )}

          <View style={{ width: 44 }} />
        </Animated.View>

        {/* Guide overlay */}
        <View style={styles.guideOverlay}>
          <Animated.View style={[styles.corners, cornerAnimatedStyle]}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </Animated.View>

          {/* Countdown overlay */}
          {countdownActive && countdownValue > 0 && (
            <Animated.View
              entering={ZoomIn.springify()}
              style={styles.countdownOverlay}
              accessibilityLiveRegion="polite"
              accessibilityLabel={`Taking photo in ${countdownValue}`}
            >
              <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
              <Text style={styles.countdownText} accessibilityElementsHidden>{countdownValue}</Text>
            </Animated.View>
          )}

          {!countdownActive && (
            <Animated.View entering={FadeIn.delay(400)} style={styles.guideBadge}>
              <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
              <Text style={[Typography.caption1, { color: 'rgba(255,255,255,0.9)' }]}>
                Position the room in frame
              </Text>
            </Animated.View>
          )}
        </View>

        {/* Bottom gradient */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={styles.bottomGradient}
        />

        {/* Controls */}
        <Animated.View
          entering={FadeInUp.delay(200).springify()}
          style={[styles.controls, { paddingBottom: insets.bottom + 20 }]}
        >
          {/* Tip */}
          <View style={styles.tipContainer}>
            <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
            <Text style={[Typography.caption1, { color: 'rgba(255,255,255,0.9)' }]}>
              💡 Capture the whole area for best results
            </Text>
          </View>

          {/* Capture controls */}
          <View style={styles.captureRow}>
            {/* Gallery button */}
            <Pressable
              onPress={pickMedia}
              style={({ pressed }) => [
                styles.sideControlButton,
                { transform: [{ scale: pressed ? 0.9 : 1 }] },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Open gallery"
              accessibilityHint="Choose a photo from your gallery instead"
            >
              <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
              <Text style={{ fontSize: 24 }}>🖼️</Text>
            </Pressable>

            {/* Capture button */}
            <AnimatedPressable
              onPress={takePicture}
              disabled={isCapturing}
              style={[styles.captureButton, captureAnimatedStyle, isCapturing && { opacity: 0.6 }]}
              accessibilityRole="button"
              accessibilityLabel={isCapturing ? "Taking photo" : "Take photo"}
              accessibilityHint="Capture a photo of the room"
              accessibilityState={{ disabled: isCapturing }}
            >
              <View style={styles.captureButtonOuter}>
                <View style={styles.captureButtonInner} />
              </View>
            </AnimatedPressable>

            {/* Flash toggle */}
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setFlashEnabled(prev => !prev);
              }}
              style={({ pressed }) => [
                styles.sideControlButton,
                flashEnabled && styles.flashEnabledButton,
                { transform: [{ scale: pressed ? 0.9 : 1 }] },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Flash ${flashEnabled ? 'on' : 'off'}`}
              accessibilityHint="Toggle camera flash"
            >
              <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
              <Text style={{ fontSize: 20 }}>{flashEnabled ? '⚡' : '🔦'}</Text>
              <Text style={[styles.flashLabel, flashEnabled && styles.flashLabelEnabled]}>{flashEnabled ? 'On' : 'Off'}</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

// Room Type Card Component
function RoomTypeCard({
  type: _type,
  info,
  onPress,
  delay,
}: {
  type: RoomType;
  info: { emoji: string; label: string };
  onPress: () => void;
  delay: number;
}) {
  const { animatedStyle, onPressIn, onPressOut } = useCardPress();

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={animatedStyle}
      accessibilityRole="button"
      accessibilityLabel={`${info.label} room`}
      accessibilityHint={`Double tap to create a ${info.label.toLowerCase()} room`}
    >
      <Animated.View
        entering={FadeInDown.delay(delay).springify()}
        style={styles.roomTypeCard}
      >
        <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
        <Text style={styles.roomTypeEmoji} accessibilityElementsHidden>{info.emoji}</Text>
        <Text style={[Typography.headline, { color: '#FFFFFF', marginTop: 8 }]} accessibilityElementsHidden>
          {info.label}
        </Text>
      </Animated.View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  permissionContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionContent: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  permissionEmoji: {
    fontSize: 64,
  },
  permissionButtons: {
    marginTop: Spacing.xl,
    gap: Spacing.sm,
    width: '100%',
  },
  primaryButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.button,
    overflow: 'hidden',
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  secondaryButton: {
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  glassButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  roomBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    overflow: 'hidden',
  },
  guideOverlay: {
    flex: 1,
    margin: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  corners: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  corner: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 16,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 16,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 16,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 16,
  },
  guideBadge: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    overflow: 'hidden',
  },
  countdownOverlay: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  countdownText: {
    ...Typography.monoHero,
    fontSize: 64,
    color: '#FFFFFF',
  },
  flashLabel: {
    ...Typography.caption2,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
    marginTop: 2,
  },
  flashEnabledButton: {
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  flashLabelEnabled: {
    color: '#FFD700',
  },
  zoomHint: {
    position: 'absolute',
    top: 100,
    alignSelf: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.chip,
    overflow: 'hidden',
  },
  controls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  tipContainer: {
    paddingHorizontal: Spacing.ml,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.card,
    marginBottom: Spacing.lg,
    overflow: 'hidden',
  },
  captureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 40,
  },
  sideControlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  captureButton: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButtonOuter: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  captureButtonInner: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FFFFFF',
  },
  // Preview styles
  previewBackButton: {
    position: 'absolute',
    left: 16,
    zIndex: 10,
  },
  videoIndicator: {
    position: 'absolute',
    top: 100,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    overflow: 'hidden',
  },
  videoIndicatorText: {
    ...Typography.caption2,
    color: '#EF4444',
    fontWeight: '700',
    letterSpacing: 1,
  },
  previewControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    paddingTop: 24,
    paddingHorizontal: 20,
  },
  previewContent: {
    alignItems: 'center',
    marginBottom: 24,
  },
  previewEmoji: {
    fontSize: 40,
  },
  roomTag: {
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.chip,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  previewButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  retakeButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.button,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  analyzeButton: {
    flex: 2,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.button,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  // Room selector styles
  roomSelectorContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  selectorBackButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.card,
    overflow: 'hidden',
    minHeight: 44,
    justifyContent: 'center',
  },
  roomTypeScroll: {
    flex: 1,
    marginTop: 32,
  },
  roomTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingBottom: 40,
  },
  roomTypeCard: {
    width: (SCREEN_WIDTH - 52) / 2,
    height: 120,
    borderRadius: BorderRadius.card,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  roomTypeEmoji: {
    fontSize: 36,
  },
});

export default function CameraScreen() {
  return (
    <ScreenErrorBoundary screenName="Camera">
      <CameraScreenContent />
    </ScreenErrorBoundary>
  );
}
