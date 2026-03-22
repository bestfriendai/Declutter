/**
 * Quick Setup Step -- merges energy, living, and time into one screen
 * with 3 inline selectors. Reduces onboarding friction for ADHD users.
 */

import React, { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import {
  BatteryLow,
  BatteryMedium,
  Zap,
  BatteryFull,
  Building,
  Home,
  BedDouble,
  Users,
  CheckCircle,
} from 'lucide-react-native';
import { OnboardingEnergyLevel, LivingSituation } from '@/types/declutter';
import {
  BODY_FONT,
  DISPLAY_FONT,
  V1,
  CARD_SHADOW_SM,
  CARD_SHADOW_LG,
  RADIUS,
} from '@/constants/designTokens';

interface QuickSetupStepProps {
  isDark: boolean;
  energyLevel?: OnboardingEnergyLevel;
  livingSituation?: LivingSituation;
  timeAvailability?: number;
  canContinue: boolean;
  onSelectEnergy: (level: OnboardingEnergyLevel) => void;
  onSelectLiving: (situation: LivingSituation) => void;
  onSelectTime: (minutes: number) => void;
  onNext: () => void;
}

const ENERGY_OPTIONS: {
  value: OnboardingEnergyLevel;
  label: string;
  icon: typeof BatteryLow;
}[] = [
  { value: 'exhausted', label: 'Exhausted', icon: BatteryLow },
  { value: 'low', label: 'Low', icon: BatteryMedium },
  { value: 'moderate', label: 'Okay', icon: Zap },
  { value: 'high', label: 'Good!', icon: BatteryFull },
];

const LIVING_OPTIONS: {
  value: LivingSituation;
  label: string;
  icon: typeof Building;
}[] = [
  { value: 'apartment', label: 'Apartment', icon: Building },
  { value: 'house', label: 'House', icon: Home },
  { value: 'studio', label: 'Single Room', icon: BedDouble },
  { value: 'shared', label: 'Shared', icon: Users },
];

const TIME_OPTIONS = [
  { value: 5, label: '5 min' },
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 60, label: '60 min' },
];

function AnimatedChip<T extends string | number>({
  option,
  isSelected,
  onSelect,
  isDark,
  renderIcon,
  index,
}: {
  option: { value: T; label: string };
  isSelected: boolean;
  onSelect: (value: T) => void;
  isDark: boolean;
  renderIcon?: (value: T, color: string) => React.ReactNode;
  index: number;
}) {
  const t = isDark ? V1.dark : V1.light;
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const onPressIn = useCallback(() => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 350 });
  }, []);

  const onPressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 350 });
  }, []);

  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPress={() => onSelect(option.value)}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        accessibilityRole="button"
        accessibilityLabel={option.label}
        accessibilityState={{ selected: isSelected }}
        style={[
          styles.chip,
          {
            backgroundColor: isSelected
              ? isDark
                ? `${V1.coral}20`
                : `${V1.coral}12`
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
            colors={[`${V1.coral}18`, `${V1.coralLight}08`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
        )}
        {renderIcon && renderIcon(option.value, isSelected ? V1.coral : t.textSecondary)}
        <Text
          style={[
            styles.chipLabel,
            { color: isSelected ? V1.coral : t.text },
          ]}
        >
          {option.label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

function ChipRow<T extends string | number>({
  options,
  selected,
  onSelect,
  isDark,
  renderIcon,
}: {
  options: { value: T; label: string }[];
  selected?: T;
  onSelect: (value: T) => void;
  isDark: boolean;
  renderIcon?: (value: T, color: string) => React.ReactNode;
}) {
  return (
    <View style={styles.chipRow}>
      {options.map((opt, index) => (
        <AnimatedChip
          key={String(opt.value)}
          option={opt}
          isSelected={selected === opt.value}
          onSelect={onSelect}
          isDark={isDark}
          renderIcon={renderIcon}
          index={index}
        />
      ))}
    </View>
  );
}

export function QuickSetupStep({
  isDark,
  energyLevel,
  livingSituation,
  timeAvailability,
  canContinue,
  onSelectEnergy,
  onSelectLiving,
  onSelectTime,
  onNext,
}: QuickSetupStepProps) {
  const t = isDark ? V1.dark : V1.light;
  const buttonScale = useSharedValue(1);

  const buttonAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const onButtonPressIn = useCallback(() => {
    buttonScale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
  }, []);

  const onButtonPressOut = useCallback(() => {
    buttonScale.value = withSpring(1, { damping: 15, stiffness: 300 });
  }, []);

  const renderEnergyIcon = (value: OnboardingEnergyLevel, color: string) => {
    const opt = ENERGY_OPTIONS.find((o) => o.value === value);
    if (!opt) return null;
    const Icon = opt.icon;
    return <Icon size={20} color={color} />;
  };

  const renderLivingIcon = (value: LivingSituation, color: string) => {
    const opt = LIVING_OPTIONS.find((o) => o.value === value);
    if (!opt) return null;
    const Icon = opt.icon;
    return <Icon size={20} color={color} />;
  };

  return (
    <View style={styles.stepContent}>
      <Animated.Text
        entering={FadeInDown.duration(500).delay(100)}
        style={[styles.stepTitle, { color: t.text }]}
      >
        Quick setup
      </Animated.Text>
      <Animated.Text
        entering={FadeInDown.duration(500).delay(200)}
        style={[styles.stepSubhead, { color: t.textSecondary }]}
      >
        Help us personalize your experience
      </Animated.Text>

      {/* Energy level */}
      <Animated.View
        entering={FadeInDown.duration(500).delay(300)}
        style={styles.section}
      >
        <View style={styles.sectionLabelRow}>
          <Text style={[styles.sectionLabel, { color: t.textSecondary }]}>
            How's your energy today?
          </Text>
          {energyLevel != null && (
            <Animated.View entering={FadeIn.duration(300)}>
              <CheckCircle size={16} color={V1.green} />
            </Animated.View>
          )}
        </View>
        <ChipRow
          options={ENERGY_OPTIONS}
          selected={energyLevel}
          onSelect={onSelectEnergy}
          isDark={isDark}
          renderIcon={renderEnergyIcon}
        />
      </Animated.View>

      {/* Living situation */}
      <Animated.View
        entering={FadeInDown.duration(500).delay(450)}
        style={styles.section}
      >
        <View style={styles.sectionLabelRow}>
          <Text style={[styles.sectionLabel, { color: t.textSecondary }]}>
            Your space
          </Text>
          {livingSituation != null && (
            <Animated.View entering={FadeIn.duration(300)}>
              <CheckCircle size={16} color={V1.green} />
            </Animated.View>
          )}
        </View>
        <ChipRow
          options={LIVING_OPTIONS}
          selected={livingSituation}
          onSelect={onSelectLiving}
          isDark={isDark}
          renderIcon={renderLivingIcon}
        />
      </Animated.View>

      {/* Time availability */}
      <Animated.View
        entering={FadeInDown.duration(500).delay(600)}
        style={styles.section}
      >
        <View style={styles.sectionLabelRow}>
          <Text style={[styles.sectionLabel, { color: t.textSecondary }]}>
            Time you can spare
          </Text>
          {timeAvailability != null && (
            <Animated.View entering={FadeIn.duration(300)}>
              <CheckCircle size={16} color={V1.green} />
            </Animated.View>
          )}
        </View>
        <ChipRow
          options={TIME_OPTIONS}
          selected={timeAvailability}
          onSelect={onSelectTime}
          isDark={isDark}
        />
      </Animated.View>

      <View style={{ flex: 1 }} />

      {/* Next button */}
      <Animated.View
        entering={FadeInDown.duration(500).delay(750)}
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
          accessibilityLabel="Next"
          accessibilityState={{ disabled: !canContinue }}
        >
          <LinearGradient
            colors={canContinue ? [V1.coral, V1.coralLight] : [`${V1.coral}80`, `${V1.coralLight}80`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.coralButton}
          >
            <Text style={styles.coralButtonText}>Next</Text>
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
    marginBottom: 28,
  },
  section: {
    marginBottom: 32,
  },
  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: BODY_FONT,
    letterSpacing: 0.1,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
  },
  chipLabel: {
    fontSize: 14,
    fontWeight: '600',
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
