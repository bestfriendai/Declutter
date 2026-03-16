/**
 * ActionSheet - Bottom sheet with action options
 * iOS-style action sheet with customizable actions
 */

import { Colors, InteractiveStates } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Durations } from '@/theme/animations';
import { BorderRadius, Spacing, TouchTargets } from '@/theme/spacing';
import { Typography } from '@/theme/typography';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect } from 'react';
import {
    BackHandler,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import Animated, {
    FadeIn,
    FadeOut,
    SlideInDown,
    SlideOutDown,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface ActionSheetAction {
  label: string;
  icon?: string;
  onPress: () => void;
  destructive?: boolean;
  disabled?: boolean;
}

interface ActionSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  actions: ActionSheetAction[];
  cancelLabel?: string;
}

export function ActionSheet({
  visible,
  onClose,
  title,
  message,
  actions,
  cancelLabel = 'Cancel',
}: ActionSheetProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const interactive = InteractiveStates[colorScheme];
  const insets = useSafeAreaInsets();

  // Handle Android back button
  useEffect(() => {
    if (!visible) return;

    const backAction = () => {
      onClose();
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [visible, onClose]);

  const handleActionPress = useCallback(
    (action: ActionSheetAction) => {
      if (action.disabled) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onClose();
      // Small delay to allow sheet to close before action
      setTimeout(() => {
        action.onPress();
      }, 100);
    },
    [onClose]
  );

  const handleCancel = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  }, [onClose]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Backdrop */}
      <Animated.View
        entering={FadeIn.duration(Durations.normal)}
        exiting={FadeOut.duration(Durations.normal)}
        style={[styles.backdrop, { backgroundColor: 'rgba(0, 0, 0, 0.4)' }]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={handleCancel} />
      </Animated.View>

      {/* Sheet Content */}
      <View style={[styles.container, { paddingBottom: insets.bottom + Spacing.md }]}>
        <Animated.View
          entering={SlideInDown.duration(350).damping(18).stiffness(200)}
          exiting={SlideOutDown.duration(Durations.normal)}
        >
          {/* Actions Group */}
          <View
            style={[
              styles.actionsGroup,
              { backgroundColor: colors.surface },
            ]}
          >
            {/* Header */}
            {(title || message) && (
              <View style={styles.header}>
                {title && (
                  <Text
                    style={[
                      Typography.subheadlineMedium,
                      styles.title,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {title}
                  </Text>
                )}
                {message && (
                  <Text
                    style={[
                      Typography.footnote,
                      styles.message,
                      { color: colors.textTertiary },
                    ]}
                  >
                    {message}
                  </Text>
                )}
              </View>
            )}

            {/* Actions */}
            {actions.map((action, index) => (
              <React.Fragment key={action.label}>
                {(index > 0 || title || message) && (
                  <View
                    style={[styles.separator, { backgroundColor: colors.border }]}
                  />
                )}
                <Pressable
                  onPress={() => handleActionPress(action)}
                  disabled={action.disabled}
                  accessibilityRole="button"
                  accessibilityLabel={action.label}
                  accessibilityHint={action.destructive ? 'This action cannot be undone' : undefined}
                  accessibilityState={{ disabled: action.disabled }}
                  style={({ pressed }) => [
                    styles.actionButton,
                    pressed && { backgroundColor: interactive.pressedOverlay },
                    action.disabled && { opacity: interactive.disabledOpacity },
                  ]}
                >
                  {action.icon && (
                    <Text style={styles.actionIcon} accessibilityElementsHidden>{action.icon}</Text>
                  )}
                  <Text
                    style={[
                      Typography.body,
                      styles.actionLabel,
                      {
                        color: action.destructive
                          ? colors.error
                          : colors.info,
                        fontWeight: action.destructive ? '600' : '400',
                      },
                    ]}
                  >
                    {action.label}
                  </Text>
                </Pressable>
              </React.Fragment>
            ))}
          </View>

          {/* Cancel Button */}
          <Pressable
            onPress={handleCancel}
            accessibilityRole="button"
            accessibilityLabel={cancelLabel}
            style={({ pressed }) => [
              styles.cancelButton,
              {
                backgroundColor: colors.surface,
              },
              pressed && { backgroundColor: interactive.pressedOverlay },
            ]}
          >
            <Text
              style={[
                Typography.body,
                styles.cancelLabel,
                { color: colors.info, fontWeight: '600' },
              ]}
            >
              {cancelLabel}
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.sm,
  },
  actionsGroup: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  header: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
    marginTop: Spacing.xxs,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: TouchTargets.large,
    paddingHorizontal: Spacing.md,
  },
  actionIcon: {
    fontSize: 20,
    marginRight: Spacing.xs,
  },
  actionLabel: {
    textAlign: 'center',
  },
  cancelButton: {
    marginTop: Spacing.xs,
    borderRadius: BorderRadius.lg,
    height: TouchTargets.large,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelLabel: {
    textAlign: 'center',
  },
});

export default ActionSheet;
