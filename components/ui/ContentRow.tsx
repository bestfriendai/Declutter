/**
 * Declutterly - Content Row Component
 * Apple TV style horizontal scrolling content row
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';
import Animated, {
  FadeInRight,
} from 'react-native-reanimated';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/theme/typography';

interface ContentRowProps {
  title: string;
  subtitle?: string;
  onSeeAllPress?: () => void;
  showSeeAll?: boolean;
  children: React.ReactNode;
  itemWidth?: number;
  itemSpacing?: number;
  contentInset?: number;
}

export function ContentRow({
  title,
  subtitle,
  onSeeAllPress,
  showSeeAll = true,
  children,
  itemWidth = 160,
  itemSpacing = 12,
  contentInset = 16,
}: ContentRowProps) {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];

  const childArray = React.Children.toArray(children);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: contentInset }]}>
        <View style={styles.titleContainer}>
          <Text style={[Typography.title2, { color: colors.text }]}>
            {title}
          </Text>
          {subtitle && (
            <Text
              style={[
                Typography.subheadline,
                { color: colors.textSecondary, marginTop: 2 },
              ]}
            >
              {subtitle}
            </Text>
          )}
        </View>
        {showSeeAll && onSeeAllPress && (
          <Pressable onPress={onSeeAllPress} hitSlop={8}>
            <Text style={[Typography.subheadlineMedium, { color: colors.primary }]}>
              See All
            </Text>
          </Pressable>
        )}
      </View>

      {/* Horizontal scroll */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: contentInset },
        ]}
        decelerationRate="fast"
        snapToInterval={itemWidth + itemSpacing}
      >
        {childArray.map((child, index) => (
          <Animated.View
            key={index}
            entering={FadeInRight.delay(index * 50).springify()}
            style={[
              styles.itemWrapper,
              {
                width: itemWidth,
                marginRight: index < childArray.length - 1 ? itemSpacing : 0,
              },
            ]}
          >
            {child}
          </Animated.View>
        ))}
      </ScrollView>
    </View>
  );
}

// Content Row Card for consistent styling
interface ContentRowCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  aspectRatio?: number;
  width?: number;
}

export function ContentRowCard({
  children,
  onPress,
  aspectRatio = 1,
  width = 160,
}: ContentRowCardProps) {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];

  const content = (
    <View
      style={[
        styles.card,
        {
          width,
          height: width * aspectRatio,
          backgroundColor: colors.card,
        },
      ]}
    >
      {children}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.cardPressable,
          pressed && { transform: [{ scale: 0.98 }], opacity: 0.9 },
        ]}
      >
        {content}
      </Pressable>
    );
  }

  return content;
}

// Compact variant for smaller items
interface CompactRowProps {
  title: string;
  children: React.ReactNode;
  contentInset?: number;
}

export function CompactRow({
  title,
  children,
  contentInset = 16,
}: CompactRowProps) {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];

  return (
    <View style={styles.compactContainer}>
      <Text
        style={[
          Typography.caption1Medium,
          {
            color: colors.textSecondary,
            paddingHorizontal: contentInset,
            marginBottom: 8,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          },
        ]}
      >
        {title}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[
          styles.compactScrollContent,
          { paddingHorizontal: contentInset },
        ]}
      >
        {children}
      </ScrollView>
    </View>
  );
}

// Pill button for compact rows
interface PillButtonProps {
  label: string;
  icon?: React.ReactNode;
  isActive?: boolean;
  onPress: () => void;
}

export function PillButton({
  label,
  icon,
  isActive = false,
  onPress,
}: PillButtonProps) {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.pill,
        {
          backgroundColor: isActive
            ? colors.primary
            : colorScheme === 'dark'
            ? 'rgba(255, 255, 255, 0.1)'
            : 'rgba(0, 0, 0, 0.05)',
          borderColor: isActive
            ? colors.primary
            : colorScheme === 'dark'
            ? 'rgba(255, 255, 255, 0.15)'
            : 'rgba(0, 0, 0, 0.1)',
        },
        pressed && { opacity: 0.8 },
      ]}
    >
      {icon && <View style={styles.pillIcon}>{icon}</View>}
      <Text
        style={[
          Typography.subheadlineMedium,
          {
            color: isActive
              ? '#FFFFFF'
              : colors.text,
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 4,
  },
  itemWrapper: {
    // Item styling
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardPressable: {
    // Press state handled inline
  },
  compactContainer: {
    width: '100%',
  },
  compactScrollContent: {
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  pillIcon: {
    marginRight: 6,
  },
});

export default ContentRow;
