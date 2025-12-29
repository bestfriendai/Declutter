import { Colors } from '@/constants/Colors';
import * as Haptics from 'expo-haptics';
import React from 'react';
import {
    Pressable,
    StyleSheet,
    useColorScheme,
    View,
    ViewStyle
} from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    WithSpringConfig
} from 'react-native-reanimated';

interface ModernCardProps {
    children: React.ReactNode;
    style?: ViewStyle;
    onPress?: () => void;
    // If true, card acts as a button
    active?: boolean;
    padding?: number;
}

const SPRING_CONFIG: WithSpringConfig = {
    damping: 15,
    mass: 1,
    stiffness: 200,
};

export function ModernCard({
    children,
    style,
    onPress,
    active = true,
    padding = 20
}: ModernCardProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const scale = useSharedValue(1);

    const containerStyle = [
        styles.card,
        {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            // In dark mode, we use border opacity for separation. In light mode, shadow.
            borderWidth: colorScheme === 'dark' ? 1 : 0,
            padding
        },
        colorScheme === 'light' ? styles.lightShadow : null,
        style,
    ];

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const handlePressIn = () => {
        if (!active || !onPress) return;
        scale.value = withSpring(0.98, SPRING_CONFIG);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const handlePressOut = () => {
        if (!active || !onPress) return;
        scale.value = withSpring(1, SPRING_CONFIG);
    };

    if (onPress) {
        return (
            <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
                <Animated.View style={[containerStyle, animatedStyle]}>
                    {children}
                </Animated.View>
            </Pressable>
        );
    }

    return (
        <View style={containerStyle}>
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 20,
        overflow: 'hidden',
    },
    lightShadow: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
        elevation: 2,
    },
});
