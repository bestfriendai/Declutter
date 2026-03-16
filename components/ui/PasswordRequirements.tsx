/**
 * PasswordRequirements - Interactive checklist for password validation
 * Shows requirements with animated checkmarks as they're met
 */

import React, { useMemo } from 'react';
import { useColorScheme } from '@/hooks/useColorScheme';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  withSequence,
} from 'react-native-reanimated';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/theme/typography';
import { Spacing } from '@/theme/spacing';
import { SpringConfigs } from '@/theme/animations';

interface Requirement {
  id: string;
  label: string;
  test: (password: string) => boolean;
}

interface PasswordRequirementsProps {
  password: string;
  requirements?: Requirement[];
  showAll?: boolean;
  style?: object;
}

const DEFAULT_REQUIREMENTS: Requirement[] = [
  {
    id: 'length',
    label: '8+ characters long',
    test: (pwd) => pwd.length >= 8,
  },
  {
    id: 'uppercase',
    label: 'One uppercase letter (A-Z)',
    test: (pwd) => /[A-Z]/.test(pwd),
  },
  {
    id: 'lowercase',
    label: 'One lowercase letter (a-z)',
    test: (pwd) => /[a-z]/.test(pwd),
  },
  {
    id: 'number',
    label: 'One number (0-9)',
    test: (pwd) => /[0-9]/.test(pwd),
  },
  {
    id: 'special',
    label: 'One special character (!@#...)',
    test: (pwd) => /[^a-zA-Z0-9]/.test(pwd),
  },
];

function RequirementItem({
  requirement,
  isMet,
  index,
}: {
  requirement: Requirement;
  isMet: boolean;
  index: number;
}) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const scale = useSharedValue(1);

  // Trigger bounce animation when requirement is met
  React.useEffect(() => {
    if (isMet) {
      scale.value = withSequence(
        withSpring(1.2, SpringConfigs.bouncy),
        withSpring(1, SpringConfigs.gentle)
      );
    }
  }, [isMet]);

  const checkmarkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      entering={FadeIn.delay(index * 50)}
      style={styles.requirementItem}
    >
      <Animated.View
        style={[
          styles.checkboxContainer,
          {
            backgroundColor: isMet ? colors.success : 'transparent',
            borderColor: isMet ? colors.success : colors.border,
          },
          checkmarkStyle,
        ]}
      >
        {isMet && (
          <Text style={styles.checkmark}>✓</Text>
        )}
      </Animated.View>
      <Text
        style={[
          Typography.subheadline,
          styles.requirementLabel,
          {
            color: isMet ? colors.success : colors.textSecondary,
            textDecorationLine: isMet ? 'line-through' : 'none',
          },
        ]}
      >
        {requirement.label}
      </Text>
    </Animated.View>
  );
}

export function PasswordRequirements({
  password,
  requirements = DEFAULT_REQUIREMENTS,
  showAll = true,
  style,
}: PasswordRequirementsProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const requirementResults = useMemo(() => {
    return requirements.map((req) => ({
      ...req,
      isMet: req.test(password),
    }));
  }, [password, requirements]);

  const metCount = requirementResults.filter((r) => r.isMet).length;
  const totalCount = requirements.length;
  const allMet = metCount === totalCount;

  // Filter to show only unmet requirements if showAll is false
  const displayRequirements = showAll
    ? requirementResults
    : requirementResults.filter((r) => !r.isMet);

  if (!password) return null;

  return (
    <View style={[styles.container, style]}>
      {/* Progress Header */}
      <View style={styles.header}>
        <Text
          style={[
            Typography.caption1Medium,
            { color: allMet ? colors.success : colors.textSecondary },
          ]}
        >
          {allMet ? '✓ Password is strong!' : `Password strength: ${metCount}/${totalCount}`}
        </Text>
      </View>

      {/* Progress Bar */}
      <View style={[styles.progressBar, { backgroundColor: colors.surfaceSecondary }]}>
        <Animated.View
          style={[
            styles.progressFill,
            {
              backgroundColor: allMet
                ? colors.success
                : metCount >= 3
                ? colors.warning
                : colors.error,
              width: `${(metCount / totalCount) * 100}%`,
            },
          ]}
        />
      </View>

      {/* Requirements List */}
      {!allMet && (
        <View style={styles.requirementsList}>
          {displayRequirements.map((req, index) => (
            <RequirementItem
              key={req.id}
              requirement={req}
              isMet={req.isMet}
              index={index}
            />
          ))}
        </View>
      )}

      {/* Success Message */}
      {allMet && (
        <Animated.View
          entering={FadeIn.duration(350)}
          style={[styles.successMessage, { backgroundColor: colors.successMuted }]}
        >
          <Text style={styles.successIcon}>🎉</Text>
          <Text style={[Typography.caption1, { color: colors.success }]}>
            Great password! You&apos;re all set.
          </Text>
        </Animated.View>
      )}
    </View>
  );
}

// Compact inline version
export function PasswordStrengthBar({
  password,
  requirements = DEFAULT_REQUIREMENTS,
}: {
  password: string;
  requirements?: Requirement[];
}) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const metCount = useMemo(() => {
    return requirements.filter((req) => req.test(password)).length;
  }, [password, requirements]);

  const totalCount = requirements.length;
  const strength = metCount / totalCount;

  const getStrengthLabel = () => {
    if (strength === 0) return { label: '', color: colors.border };
    if (strength < 0.4) return { label: 'Weak', color: colors.error };
    if (strength < 0.6) return { label: 'Fair', color: colors.warning };
    if (strength < 0.8) return { label: 'Good', color: colors.info };
    if (strength < 1) return { label: 'Strong', color: colors.success };
    return { label: 'Excellent', color: colors.success };
  };

  const strengthInfo = getStrengthLabel();

  if (!password) return null;

  return (
    <View style={styles.strengthBarContainer}>
      <View style={styles.strengthBars}>
        {Array.from({ length: 5 }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.strengthSegment,
              {
                backgroundColor:
                  index < metCount ? strengthInfo.color : colors.border,
              },
            ]}
          />
        ))}
      </View>
      <Text style={[Typography.caption1, { color: strengthInfo.color }]}>
        {strengthInfo.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: Spacing.xs,
  },
  header: {
    marginBottom: Spacing.xs,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  requirementsList: {
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  checkboxContainer: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  requirementLabel: {
    flex: 1,
  },
  successMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: 8,
    gap: Spacing.xs,
  },
  successIcon: {
    fontSize: 16,
  },
  strengthBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
  strengthBars: {
    flexDirection: 'row',
    flex: 1,
    marginRight: Spacing.sm,
    gap: 4,
  },
  strengthSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
});

export default PasswordRequirements;
