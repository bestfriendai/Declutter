/**
 * ProgressSteps - Multi-step process indicator
 * Shows progress through a multi-step flow
 */

import React from 'react';
import { useColorScheme } from '@/hooks/useColorScheme';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import Animated, {
  FadeIn,
} from 'react-native-reanimated';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/theme/typography';
import { Spacing } from '@/theme/spacing';

export interface Step {
  label: string;
  description?: string;
  icon?: string;
}

interface ProgressStepsProps {
  steps: Step[];
  currentStep: number;
  orientation?: 'horizontal' | 'vertical';
  showLabels?: boolean;
  showDescription?: boolean;
  completedIcon?: string;
  style?: object;
}

export function ProgressSteps({
  steps,
  currentStep,
  orientation = 'horizontal',
  showLabels = true,
  showDescription = false,
  completedIcon = '✓',
  style,
}: ProgressStepsProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const isHorizontal = orientation === 'horizontal';

  return (
    <View
      style={[
        styles.container,
        isHorizontal ? styles.horizontal : styles.vertical,
        style,
      ]}
    >
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;

        return (
          <React.Fragment key={index}>
            {/* Step Item */}
            <View
              style={[
                styles.stepItem,
                isHorizontal ? styles.stepItemHorizontal : styles.stepItemVertical,
              ]}
            >
              {/* Step Circle */}
              <Animated.View
                entering={FadeIn.delay(index * 100)}
                style={[
                  styles.stepCircle,
                  {
                    backgroundColor: isCompleted
                      ? colors.success
                      : isCurrent
                      ? colors.info
                      : colors.surfaceSecondary,
                    borderColor: isCompleted
                      ? colors.success
                      : isCurrent
                      ? colors.info
                      : colors.border,
                  },
                ]}
              >
                {isCompleted ? (
                  <Text style={[styles.stepIcon, { color: '#FFFFFF' }]}>
                    {completedIcon}
                  </Text>
                ) : step.icon ? (
                  <Text
                    style={[
                      styles.stepIcon,
                      {
                        color: isCurrent ? '#FFFFFF' : colors.textSecondary,
                      },
                    ]}
                  >
                    {step.icon}
                  </Text>
                ) : (
                  <Text
                    style={[
                      styles.stepNumber,
                      {
                        color: isCurrent ? '#FFFFFF' : colors.textSecondary,
                        fontWeight: isCurrent ? '600' : '400',
                      },
                    ]}
                  >
                    {index + 1}
                  </Text>
                )}
              </Animated.View>

              {/* Step Label */}
              {showLabels && (
                <View
                  style={[
                    styles.labelContainer,
                    isHorizontal
                      ? styles.labelContainerHorizontal
                      : styles.labelContainerVertical,
                  ]}
                >
                  <Text
                    style={[
                      Typography.subheadline,
                      styles.stepLabel,
                      {
                        color: isCurrent
                          ? colors.text
                          : isCompleted
                          ? colors.success
                          : colors.textTertiary,
                        fontWeight: isCurrent ? '600' : '400',
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {step.label}
                  </Text>
                  {showDescription && step.description && (
                    <Text
                      style={[
                        Typography.caption1,
                        styles.stepDescription,
                        { color: colors.textTertiary },
                      ]}
                      numberOfLines={2}
                    >
                      {step.description}
                    </Text>
                  )}
                </View>
              )}
            </View>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <View
                style={[
                  styles.connector,
                  isHorizontal ? styles.connectorHorizontal : styles.connectorVertical,
                  {
                    backgroundColor: index < currentStep
                      ? colors.success
                      : colors.border,
                  },
                ]}
              />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const CIRCLE_SIZE = 32;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  horizontal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  vertical: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  stepItem: {
    alignItems: 'center',
  },
  stepItemHorizontal: {
    flex: 0,
  },
  stepItemVertical: {
    flexDirection: 'row',
  },
  stepCircle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIcon: {
    fontSize: 14,
  },
  stepNumber: {
    fontSize: 14,
  },
  labelContainer: {
    alignItems: 'center',
  },
  labelContainerHorizontal: {
    marginTop: Spacing.xs,
    maxWidth: 80,
  },
  labelContainerVertical: {
    marginLeft: Spacing.sm,
    alignItems: 'flex-start',
    flex: 1,
  },
  stepLabel: {
    textAlign: 'center',
  },
  stepDescription: {
    marginTop: 2,
    textAlign: 'center',
  },
  connector: {
    backgroundColor: '#ccc',
  },
  connectorHorizontal: {
    flex: 1,
    height: 2,
    marginHorizontal: Spacing.xs,
    marginTop: CIRCLE_SIZE / 2 - 1,
    alignSelf: 'flex-start',
  },
  connectorVertical: {
    width: 2,
    height: Spacing.lg,
    marginLeft: CIRCLE_SIZE / 2 - 1,
    marginVertical: Spacing.xxs,
  },
});

export default ProgressSteps;
