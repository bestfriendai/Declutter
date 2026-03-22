import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { MascotAvatar } from '@/components/ui';
import {
  BODY_FONT,
  DISPLAY_FONT,
  V1,
  CARD_SHADOW_SM,
  CARD_SHADOW_LG,
  RADIUS,
} from '@/constants/designTokens';
import { MASCOT_PERSONALITIES, MascotPersonality } from '@/types/declutter';

interface MascotStepProps {
  isDark: boolean;
  mascotName?: string;
  guidePersonality?: MascotPersonality;
  canContinue: boolean;
  onChangeName: (name: string) => void;
  onSelectPersonality: (personality: MascotPersonality) => void;
  onNext: () => void;
}

const PERSONALITIES: { key: MascotPersonality; emoji: string; label: string; desc: string }[] = [
  { key: 'spark', emoji: '\u26A1', label: 'Spark', desc: 'Energetic' },
  { key: 'bubbles', emoji: '\uD83E\uDEE7', label: 'Bubbles', desc: 'Cheerful' },
  { key: 'dusty', emoji: '\uD83E\uDDF9', label: 'Dusty', desc: 'Encouraging' },
  { key: 'tidy', emoji: '\u2728', label: 'Tidy', desc: 'Calm' },
];

function PersonalityChip({
  personality,
  isSelected,
  isDark,
  onSelect,
}: {
  personality: typeof PERSONALITIES[number];
  isSelected: boolean;
  isDark: boolean;
  onSelect: () => void;
}) {
  const t = isDark ? V1.dark : V1.light;
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const onPressIn = useCallback(() => {
    scale.value = withSpring(0.93, { damping: 15, stiffness: 350 });
  }, []);

  const onPressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 350 });
  }, []);

  return (
    <Animated.View style={[{ flex: 1 }, animStyle]}>
      <Pressable
        onPress={onSelect}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        accessibilityRole="button"
        accessibilityLabel={`${personality.label}: ${personality.desc}`}
        accessibilityState={{ selected: isSelected }}
        style={[
          styles.personalityChip,
          {
            backgroundColor: isSelected
              ? isDark ? `${V1.coral}20` : `${V1.coral}12`
              : t.card,
            borderColor: isSelected ? V1.coral : t.border,
            borderWidth: isSelected ? 1.5 : 1,
          },
          isSelected && !isDark && {
            ...CARD_SHADOW_SM,
            shadowColor: V1.coral,
            shadowOpacity: 0.15,
          },
        ]}
      >
        {isSelected && (
          <LinearGradient
            colors={[`${V1.coral}15`, `${V1.coralLight}08`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
        )}
        <Text style={styles.personalityEmoji}>{personality.emoji}</Text>
        <Text style={[styles.personalityLabel, { color: isSelected ? V1.coral : t.text }]}>
          {personality.label}
        </Text>
        <Text style={[styles.personalityDesc, { color: t.textMuted }]}>
          {personality.desc}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

export function MascotStep({
  isDark,
  mascotName,
  guidePersonality,
  canContinue,
  onChangeName,
  onSelectPersonality,
  onNext,
}: MascotStepProps) {
  const t = isDark ? V1.dark : V1.light;
  const selectedPersonality = guidePersonality ?? 'dusty';
  const buttonScale = useSharedValue(1);
  const mascotBounce = useSharedValue(1);
  const [isFocused, setIsFocused] = useState(false);
  const inputBorderGlow = useSharedValue(0);

  // Bounce mascot when personality changes
  useEffect(() => {
    mascotBounce.value = withSequence(
      withSpring(0.88, { damping: 8, stiffness: 400 }),
      withSpring(1.05, { damping: 8, stiffness: 300 }),
      withSpring(1, { damping: 12, stiffness: 200 }),
    );
  }, [selectedPersonality]);

  // Input focus glow
  useEffect(() => {
    inputBorderGlow.value = withTiming(isFocused ? 1 : 0, { duration: 250 });
  }, [isFocused]);

  const mascotAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: mascotBounce.value }],
  }));

  const inputAnimStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      inputBorderGlow.value,
      [0, 1],
      [isDark ? 'rgba(255,255,255,0.08)' : '#E5E7EB', V1.coral],
    ),
    borderWidth: inputBorderGlow.value > 0.5 ? 1.5 : 1,
  }));

  const buttonAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const onButtonPressIn = useCallback(() => {
    buttonScale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
  }, []);

  const onButtonPressOut = useCallback(() => {
    buttonScale.value = withSpring(1, { damping: 15, stiffness: 300 });
  }, []);

  return (
    <View style={styles.stepContent}>
      {/* Mascot avatar with gradient glow */}
      <Animated.View
        entering={FadeInDown.duration(500).delay(100)}
        style={styles.mascotWrap}
      >
        <Animated.View style={mascotAnimStyle}>
          <View style={styles.glowContainer}>
            <LinearGradient
              colors={[
                `${V1.coral}28`,
                `${V1.coralLight}14`,
                'transparent',
              ]}
              style={styles.mascotGlow}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
            />
            <View style={[styles.mascotCircleLarge, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)' }]}>
              <MascotAvatar imageKey="happy" size={120} showBackground={false} />
            </View>
          </View>
        </Animated.View>
      </Animated.View>

      <Animated.Text
        entering={FadeInDown.duration(500).delay(200)}
        style={[styles.stepTitle, { color: t.text }]}
      >
        Meet your companion!
      </Animated.Text>
      <Animated.Text
        entering={FadeInDown.duration(500).delay(300)}
        style={[styles.stepSubhead, { color: t.textSecondary }]}
      >
        Choose a personality and give them a name
      </Animated.Text>

      {/* Personality selection */}
      <Animated.View
        entering={FadeInDown.duration(500).delay(400)}
        style={styles.personalityRow}
      >
        {PERSONALITIES.map((p) => (
          <PersonalityChip
            key={p.key}
            personality={p}
            isSelected={selectedPersonality === p.key}
            isDark={isDark}
            onSelect={() => {
              onSelectPersonality(p.key);
              if (!mascotName || mascotName === 'Dusty' || mascotName === 'Spark' || mascotName === 'Bubbles' || mascotName === 'Tidy') {
                onChangeName(MASCOT_PERSONALITIES[p.key].name);
              }
            }}
          />
        ))}
      </Animated.View>

      {/* Name input */}
      <Animated.View
        entering={FadeInDown.duration(500).delay(500)}
      >
        <Animated.View
          style={[
            styles.nameInput,
            { backgroundColor: t.card },
            inputAnimStyle,
          ]}
        >
          <Text style={{ fontSize: 18, marginRight: 10, color: t.textMuted }}>
            {'\u270F\uFE0F'}
          </Text>
          <TextInput
            style={[styles.nameInputText, { color: t.text }]}
            value={mascotName}
            onChangeText={onChangeName}
            placeholder={MASCOT_PERSONALITIES[selectedPersonality].name}
            placeholderTextColor={t.textMuted}
            autoCapitalize="words"
            accessibilityLabel="Mascot name"
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
        </Animated.View>
        <Text style={[styles.helperText, { color: t.textMuted }]}>
          You can always change this later
        </Text>
      </Animated.View>

      <View style={{ flex: 1 }} />

      {/* Button */}
      <Animated.View
        entering={FadeInDown.duration(500).delay(600)}
        style={[
          buttonAnimStyle,
          styles.buttonShadowWrap,
          { opacity: canContinue ? 1 : 0.4 },
        ]}
      >
        <Pressable
          onPress={onNext}
          onPressIn={onButtonPressIn}
          onPressOut={onButtonPressOut}
          disabled={!canContinue}
          accessibilityRole="button"
          accessibilityLabel="Let's clean together!"
          accessibilityState={{ disabled: !canContinue }}
        >
          <LinearGradient
            colors={[V1.coral, V1.coralLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.coralButton}
          >
            <Text style={styles.coralButtonText}>Let's clean together!</Text>
          </LinearGradient>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  stepContent: {
    flex: 1,
    minHeight: 500,
    paddingTop: 20,
  },
  mascotWrap: {
    alignSelf: 'center',
    marginBottom: 16,
  },
  glowContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mascotGlow: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
  },
  mascotCircleLarge: {
    width: 130,
    height: 130,
    borderRadius: 65,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepTitle: {
    fontSize: 30,
    fontWeight: '800',
    fontFamily: DISPLAY_FONT,
    letterSpacing: -0.6,
    marginBottom: 8,
  },
  stepSubhead: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: BODY_FONT,
    marginBottom: 24,
  },
  personalityRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  personalityChip: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 6,
    borderRadius: RADIUS.md,
    gap: 6,
    overflow: 'hidden',
  },
  personalityEmoji: {
    fontSize: 28,
  },
  personalityLabel: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: BODY_FONT,
  },
  personalityDesc: {
    fontSize: 11,
    fontWeight: '500',
    fontFamily: BODY_FONT,
  },
  nameInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: 16,
    height: 56,
    marginTop: 4,
  },
  nameInputText: {
    flex: 1,
    fontSize: 16,
    fontFamily: BODY_FONT,
  },
  helperText: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 10,
    fontFamily: BODY_FONT,
  },
  buttonShadowWrap: {
    borderRadius: 28,
    ...CARD_SHADOW_LG,
    shadowColor: V1.coral,
    shadowOpacity: 0.25,
    marginBottom: 16,
  },
  coralButton: {
    borderRadius: 28,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coralButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    fontFamily: BODY_FONT,
    letterSpacing: 0.3,
  },
});
