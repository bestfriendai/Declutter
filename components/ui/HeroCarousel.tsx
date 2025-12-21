/**
 * Declutterly - Hero Carousel Component
 * Apple TV style full-width carousel with parallax and snap
 */

import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  SharedValue,
} from 'react-native-reanimated';
import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/Colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface HeroCarouselProps {
  children: React.ReactNode[];
  itemWidth?: number;
  itemSpacing?: number;
  showPagination?: boolean;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  onIndexChange?: (index: number) => void;
}

export function HeroCarousel({
  children,
  itemWidth = SCREEN_WIDTH - 32,
  itemSpacing = 12,
  showPagination = true,
  autoPlay = false,
  autoPlayInterval = 5000,
  onIndexChange,
}: HeroCarouselProps) {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const scrollX = useSharedValue(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<Animated.ScrollView>(null);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const handleMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const contentOffset = event.nativeEvent.contentOffset.x;
      const index = Math.round(contentOffset / (itemWidth + itemSpacing));
      setCurrentIndex(index);
      onIndexChange?.(index);
    },
    [itemWidth, itemSpacing, onIndexChange]
  );

  // Auto play effect
  React.useEffect(() => {
    if (!autoPlay || children.length <= 1) return;

    const interval = setInterval(() => {
      const nextIndex = (currentIndex + 1) % children.length;
      scrollViewRef.current?.scrollTo({
        x: nextIndex * (itemWidth + itemSpacing),
        animated: true,
      });
      setCurrentIndex(nextIndex);
      onIndexChange?.(nextIndex);
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [autoPlay, autoPlayInterval, currentIndex, children.length, itemWidth, itemSpacing, onIndexChange]);

  return (
    <View style={styles.container}>
      <Animated.ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={itemWidth + itemSpacing}
        decelerationRate="fast"
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: (SCREEN_WIDTH - itemWidth) / 2 },
        ]}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        onMomentumScrollEnd={handleMomentumScrollEnd}
      >
        {children.map((child, index) => (
          <HeroCarouselItem
            key={index}
            index={index}
            scrollX={scrollX}
            itemWidth={itemWidth}
            itemSpacing={itemSpacing}
          >
            {child}
          </HeroCarouselItem>
        ))}
      </Animated.ScrollView>

      {showPagination && children.length > 1 && (
        <View style={styles.pagination}>
          {children.map((_, index) => (
            <PaginationDot
              key={index}
              index={index}
              scrollX={scrollX}
              itemWidth={itemWidth}
              itemSpacing={itemSpacing}
              activeColor={colors.primary}
              inactiveColor={colorScheme === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)'}
            />
          ))}
        </View>
      )}
    </View>
  );
}

// Individual carousel item with parallax
interface HeroCarouselItemProps {
  children: React.ReactNode;
  index: number;
  scrollX: SharedValue<number>;
  itemWidth: number;
  itemSpacing: number;
}

function HeroCarouselItem({
  children,
  index,
  scrollX,
  itemWidth,
  itemSpacing,
}: HeroCarouselItemProps) {
  const inputRange = [
    (index - 1) * (itemWidth + itemSpacing),
    index * (itemWidth + itemSpacing),
    (index + 1) * (itemWidth + itemSpacing),
  ];

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      scrollX.value,
      inputRange,
      [0.9, 1, 0.9],
      Extrapolation.CLAMP
    );

    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.6, 1, 0.6],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ scale }],
      opacity,
    };
  });

  return (
    <Animated.View
      style={[
        styles.carouselItem,
        { width: itemWidth, marginHorizontal: itemSpacing / 2 },
        animatedStyle,
      ]}
    >
      {children}
    </Animated.View>
  );
}

// Pagination dot component
interface PaginationDotProps {
  index: number;
  scrollX: SharedValue<number>;
  itemWidth: number;
  itemSpacing: number;
  activeColor: string;
  inactiveColor: string;
}

function PaginationDot({
  index,
  scrollX,
  itemWidth,
  itemSpacing,
  activeColor,
  inactiveColor,
}: PaginationDotProps) {
  const inputRange = [
    (index - 1) * (itemWidth + itemSpacing),
    index * (itemWidth + itemSpacing),
    (index + 1) * (itemWidth + itemSpacing),
  ];

  const animatedStyle = useAnimatedStyle(() => {
    const width = interpolate(
      scrollX.value,
      inputRange,
      [8, 24, 8],
      Extrapolation.CLAMP
    );

    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.4, 1, 0.4],
      Extrapolation.CLAMP
    );

    return {
      width,
      opacity,
      backgroundColor: interpolate(
        scrollX.value,
        inputRange,
        [0, 1, 0],
        Extrapolation.CLAMP
      ) > 0.5 ? activeColor : inactiveColor,
    };
  });

  return (
    <Animated.View style={[styles.dot, animatedStyle]} />
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  scrollContent: {
    alignItems: 'center',
  },
  carouselItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
});

export default HeroCarousel;
