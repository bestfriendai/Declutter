/**
 * Declutterly - Toast/Snackbar Component
 * iOS-style toast notifications with haptic feedback
 */

import React, { useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  AccessibilityInfo,
  DimensionValue,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  useReducedMotion,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/theme/typography';

// Toast context for global toast management
import { createContext, useContext, useState, ReactNode } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';
export type ToastPosition = 'top' | 'bottom';

interface ToastProps {
  visible: boolean;
  message: string;
  type?: ToastType;
  position?: ToastPosition;
  duration?: number;
  action?: {
    label: string;
    onPress: () => void;
  };
  onDismiss: () => void;
  icon?: React.ReactNode;
}

const TOAST_ICONS: Record<ToastType, string> = {
  success: '',
  error: '',
  warning: '',
  info: '',
};

export function Toast({
  visible,
  message,
  type = 'info',
  position = 'top',
  duration = 3000,
  action,
  onDismiss,
  icon,
}: ToastProps) {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  
  const translateY = useSharedValue(position === 'top' ? -100 : 100);
  const opacity = useSharedValue(0);

  const getTypeColor = useCallback(() => {
    switch (type) {
      case 'success':
        return colors.success;
      case 'error':
        return colors.error;
      case 'warning':
        return colors.warning;
      case 'info':
      default:
        return colors.info;
    }
  }, [type, colors]);

  const getTypeIcon = useCallback(() => {
    if (icon) return icon;
    return TOAST_ICONS[type];
  }, [type, icon]);

  useEffect(() => {
    if (visible) {
      // Haptic feedback on show
      Haptics.notificationAsync(
        type === 'error' 
          ? Haptics.NotificationFeedbackType.Error
          : type === 'success'
          ? Haptics.NotificationFeedbackType.Success
          : Haptics.NotificationFeedbackType.Warning
      );

      // Announce to screen readers
      AccessibilityInfo.announceForAccessibility(message);

      // Animate in
      if (reducedMotion) {
        opacity.value = withTiming(1, { duration: 150 });
        translateY.value = 0;
      } else {
        opacity.value = withSpring(1, { damping: 20, stiffness: 300 });
        translateY.value = withSpring(0, { damping: 20, stiffness: 300 });
      }

      // Auto dismiss
      if (duration > 0) {
        const timer = setTimeout(() => {
          handleDismiss();
        }, duration);
        return () => clearTimeout(timer);
      }
    } else {
      // Animate out
      if (reducedMotion) {
        opacity.value = withTiming(0, { duration: 150 });
      } else {
        opacity.value = withTiming(0, { duration: 200 });
        translateY.value = withTiming(
          position === 'top' ? -100 : 100,
          { duration: 200 }
        );
      }
    }
  }, [visible, duration, reducedMotion, position]);

  const handleDismiss = useCallback(() => {
    if (reducedMotion) {
      opacity.value = withTiming(0, { duration: 150 }, () => {
        runOnJS(onDismiss)();
      });
    } else {
      translateY.value = withSpring(
        position === 'top' ? -100 : 100,
        { damping: 20, stiffness: 300 }
      );
      opacity.value = withTiming(0, { duration: 200 }, () => {
        runOnJS(onDismiss)();
      });
    }
  }, [onDismiss, position, reducedMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const typeColor = getTypeColor();

  if (!visible && opacity.value === 0) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        position === 'top'
          ? { top: insets.top + 8 }
          : { bottom: insets.bottom + 8 },
        animatedStyle,
      ]}
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
    >
      <View style={styles.toastWrapper}>
        <BlurView
          intensity={80}
          tint={colorScheme === 'dark' ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: colorScheme === 'dark'
                ? 'rgba(30, 30, 30, 0.8)'
                : 'rgba(255, 255, 255, 0.9)',
            },
          ]}
        />
        <View
          style={[
            styles.typeIndicator,
            { backgroundColor: typeColor },
          ]}
        />
        <View style={styles.content}>
          <Text style={styles.icon}>{getTypeIcon()}</Text>
          <Text
            style={[
              Typography.subheadline,
              styles.message,
              { color: colors.text },
            ]}
            numberOfLines={2}
          >
            {message}
          </Text>
          {action && (
            <Pressable
              onPress={() => {
                action.onPress();
                handleDismiss();
              }}
              style={({ pressed }) => [
                styles.actionButton,
                pressed && styles.actionButtonPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={action.label}
            >
              <Text
                style={[
                  Typography.footnote,
                  styles.actionLabel,
                  { color: typeColor },
                ]}
              >
                {action.label}
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

interface ToastContextType {
  showToast: (options: Omit<ToastProps, 'visible' | 'onDismiss'>) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toastState, setToastState] = useState<{
    visible: boolean;
    props: Omit<ToastProps, 'visible' | 'onDismiss'>;
  }>({
    visible: false,
    props: { message: '' },
  });

  const showToast = useCallback((options: Omit<ToastProps, 'visible' | 'onDismiss'>) => {
    setToastState({ visible: true, props: options });
  }, []);

  const hideToast = useCallback(() => {
    setToastState(prev => ({ ...prev, visible: false }));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      <Toast
        {...toastState.props}
        visible={toastState.visible}
        onDismiss={hideToast}
      />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  toastWrapper: {
    borderRadius: 14,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  typeIndicator: {
    width: 4,
    height: '100%' as DimensionValue,
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingLeft: 16,
    paddingRight: 12,
  },
  icon: {
    fontSize: 20,
    marginRight: 10,
  },
  message: {
    flex: 1,
  },
  actionButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginLeft: 8,
    borderRadius: 8,
  },
  actionButtonPressed: {
    opacity: 0.7,
  },
  actionLabel: {
    fontWeight: '600',
  },
});

export default Toast;
