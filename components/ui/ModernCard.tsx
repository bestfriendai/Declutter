import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import * as Haptics from 'expo-haptics';
import React, { useEffect } from 'react';
import {
    Pressable,
    StyleSheet,
    View,
    ViewStyle
} from 'react-native';
import Animated, {
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withSpring,
    withTiming,
    WithSpringConfig,
    Easing,
} from 'react-native-reanimated';

interface ModernCardProps {
    children: React.ReactNode;
    style?: ViewStyle;
    onPress?: () => void;
    active?: boolean;
    padding?: number;
    glow?: boolean;
    glowColor?: string;
    accessibilityLabel?: string;
    accessibilityHint?: string;
    testID?: string;
}

const SPRING_CONFIG: WithSpringConfig = {
    damping: 12,
    mass: 0.8,
    stiffness: 180,
    overshootClamping: false,
};

export function ModernCard({
    children,
    style,
    onPress,
    active = true,
    padding = 20,
    glow = false,
    glowColor,
    accessibilityLabel,
    accessibilityHint,
    testID,
}: ModernCardProps) {
    const colorScheme = useColorScheme() ?? 'dark';
    const colors = Colors[colorScheme];
    const scale = useSharedValue(1);
    const pressProgress = useSharedValue(0);
    const glowOpacity = useSharedValue(0.3);

    useEffect(() => {
        if (glow) {
            glowOpacity.value = withRepeat(
                withSequence(
                    withTiming(0.6, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
                    withTiming(0.3, { duration: 1200, easing: Easing.inOut(Easing.ease) })
                ),
                -1,
                false
            );
        } else {
            // Reset to initial value when glow is disabled
            glowOpacity.value = withTiming(0.3, { duration: 200 });
        }

        // Cleanup function to stop animations when component unmounts
        return () => {
            glowOpacity.value = 0.3;
        };
    }, [glow]);

    const containerStyle = [
        styles.card,
        {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderWidth: colorScheme === 'dark' ? 1 : 0,
            padding
        },
        colorScheme === 'light' ? styles.lightShadow : null,
        style,
    ];

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const overlayStyle = useAnimatedStyle(() => {
        const overlayOpacity = interpolate(pressProgress.value, [0, 1], [0, 0.08]);
        return {
            position: 'absolute' as const,
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: colorScheme === 'dark' ? '#FFFFFF' : '#000000',
            opacity: overlayOpacity,
            borderRadius: 20,
        };
    });

    const glowStyle = useAnimatedStyle(() => ({
        position: 'absolute' as const,
        top: -4,
        left: -4,
        right: -4,
        bottom: -4,
        borderRadius: 24,
        backgroundColor: glowColor || colors.primary,
        opacity: glowOpacity.value,
        zIndex: -1,
    }));

    const handlePressIn = () => {
        if (!active || !onPress) return;
        scale.value = withSpring(0.97, SPRING_CONFIG);
        pressProgress.value = withTiming(1, { duration: 100 });
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const handlePressOut = () => {
        if (!active || !onPress) return;
        scale.value = withSpring(1, SPRING_CONFIG);
        pressProgress.value = withTiming(0, { duration: 200 });
    };

    if (onPress) {
        return (
            <Pressable
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                accessibilityRole="button"
                accessibilityLabel={accessibilityLabel}
                accessibilityHint={accessibilityHint}
                testID={testID}
            >
                <Animated.View style={[containerStyle, animatedStyle]}>
                    {glow && <Animated.View style={glowStyle} />}
                    {children}
                    <Animated.View style={overlayStyle} />
                </Animated.View>
            </Pressable>
        );
    }

    return (
        <View style={containerStyle}>
            {glow && <Animated.View style={glowStyle} />}
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 20,
        borderCurve: 'continuous',
        overflow: 'hidden',
    },
    lightShadow: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
});
