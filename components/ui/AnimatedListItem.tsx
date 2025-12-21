/**
 * Declutterly - Animated List Item Component
 * iOS Settings style list items with animations
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Switch,
  ViewStyle,
  StyleProp,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeInRight,
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';
import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/theme/typography';
import * as Haptics from 'expo-haptics';

interface ListItemProps {
  title: string;
  subtitle?: string;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
  showChevron?: boolean;
  onPress?: () => void;
  index?: number;
  disabled?: boolean;
  destructive?: boolean;
  style?: StyleProp<ViewStyle>;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function AnimatedListItem({
  title,
  subtitle,
  leftIcon,
  rightElement,
  showChevron = false,
  onPress,
  index = 0,
  disabled = false,
  destructive = false,
  style,
}: ListItemProps) {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const handlePress = () => {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  const titleColor = destructive
    ? colors.danger
    : disabled
    ? colors.textTertiary
    : colors.text;

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 50).springify()}
    >
      <AnimatedPressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || !onPress}
        style={[animatedStyle]}
      >
        <View
          style={[
            styles.container,
            {
              backgroundColor: colorScheme === 'dark'
                ? 'rgba(255, 255, 255, 0.05)'
                : 'rgba(0, 0, 0, 0.02)',
            },
            style,
          ]}
        >
          {leftIcon && (
            <View style={styles.leftIcon}>{leftIcon}</View>
          )}

          <View style={styles.content}>
            <Text
              style={[Typography.body, { color: titleColor }]}
              numberOfLines={1}
            >
              {title}
            </Text>
            {subtitle && (
              <Text
                style={[Typography.caption1, { color: colors.textSecondary, marginTop: 2 }]}
                numberOfLines={2}
              >
                {subtitle}
              </Text>
            )}
          </View>

          {rightElement && (
            <View style={styles.rightElement}>{rightElement}</View>
          )}

          {showChevron && (
            <Text style={[styles.chevron, { color: colors.textTertiary }]}>
              ›
            </Text>
          )}
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
}

// Toggle list item variant
interface ToggleListItemProps {
  title: string;
  subtitle?: string;
  leftIcon?: React.ReactNode;
  value: boolean;
  onValueChange: (value: boolean) => void;
  index?: number;
  disabled?: boolean;
}

export function ToggleListItem({
  title,
  subtitle,
  leftIcon,
  value,
  onValueChange,
  index = 0,
  disabled = false,
}: ToggleListItemProps) {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];

  const handleToggle = (newValue: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onValueChange(newValue);
  };

  return (
    <AnimatedListItem
      title={title}
      subtitle={subtitle}
      leftIcon={leftIcon}
      index={index}
      disabled={disabled}
      rightElement={
        <Switch
          value={value}
          onValueChange={handleToggle}
          disabled={disabled}
          trackColor={{
            false: colorScheme === 'dark' ? '#3A3A3C' : '#E5E5EA',
            true: colors.primary,
          }}
          thumbColor="#FFFFFF"
          ios_backgroundColor={colorScheme === 'dark' ? '#3A3A3C' : '#E5E5EA'}
        />
      }
    />
  );
}

// Section header for grouped lists
interface ListSectionHeaderProps {
  title: string;
  index?: number;
}

export function ListSectionHeader({ title, index = 0 }: ListSectionHeaderProps) {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];

  return (
    <Animated.View
      entering={FadeInRight.delay(index * 50)}
      style={styles.sectionHeader}
    >
      <Text
        style={[
          Typography.caption1,
          {
            color: colors.textSecondary,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          },
        ]}
      >
        {title}
      </Text>
    </Animated.View>
  );
}

// Grouped list container (iOS Settings style)
interface GroupedListProps {
  children: React.ReactNode;
  header?: string;
  footer?: string;
}

export function GroupedList({ children, header, footer }: GroupedListProps) {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];

  return (
    <View style={styles.groupedContainer}>
      {header && (
        <Text
          style={[
            Typography.caption1,
            styles.groupedHeader,
            { color: colors.textSecondary },
          ]}
        >
          {header}
        </Text>
      )}
      <View
        style={[
          styles.groupedList,
          {
            backgroundColor: colorScheme === 'dark'
              ? 'rgba(255, 255, 255, 0.05)'
              : '#FFFFFF',
            borderColor: colorScheme === 'dark'
              ? 'rgba(255, 255, 255, 0.08)'
              : 'rgba(0, 0, 0, 0.05)',
          },
        ]}
      >
        {React.Children.map(children, (child, index) => (
          <>
            {child}
            {index < React.Children.count(children) - 1 && (
              <View
                style={[
                  styles.separator,
                  {
                    backgroundColor: colorScheme === 'dark'
                      ? 'rgba(255, 255, 255, 0.08)'
                      : 'rgba(0, 0, 0, 0.05)',
                  },
                ]}
              />
            )}
          </>
        ))}
      </View>
      {footer && (
        <Text
          style={[
            Typography.caption1,
            styles.groupedFooter,
            { color: colors.textTertiary },
          ]}
        >
          {footer}
        </Text>
      )}
    </View>
  );
}

// Simple list item for grouped lists (no background)
export function GroupedListItem({
  title,
  subtitle,
  leftIcon,
  rightElement,
  showChevron = false,
  onPress,
  disabled = false,
  destructive = false,
}: Omit<ListItemProps, 'index' | 'style'>) {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const handlePress = () => {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  const titleColor = destructive
    ? colors.danger
    : disabled
    ? colors.textTertiary
    : colors.text;

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || !onPress}
      style={[animatedStyle, styles.groupedItem]}
    >
      {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}

      <View style={styles.content}>
        <Text style={[Typography.body, { color: titleColor }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle && (
          <Text
            style={[Typography.caption1, { color: colors.textSecondary, marginTop: 2 }]}
            numberOfLines={2}
          >
            {subtitle}
          </Text>
        )}
      </View>

      {rightElement && <View style={styles.rightElement}>{rightElement}</View>}

      {showChevron && (
        <Text style={[styles.chevron, { color: colors.textTertiary }]}>›</Text>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginVertical: 4,
  },
  leftIcon: {
    marginRight: 12,
    width: 28,
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  rightElement: {
    marginLeft: 12,
  },
  chevron: {
    fontSize: 24,
    fontWeight: '300',
    marginLeft: 8,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 8,
  },
  groupedContainer: {
    marginVertical: 8,
  },
  groupedHeader: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  groupedFooter: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  groupedList: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 0.5,
  },
  groupedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  separator: {
    height: 0.5,
    marginLeft: 56,
  },
});

export default AnimatedListItem;
