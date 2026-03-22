import { useReducedMotion } from '@/hooks/useReducedMotion';
import { V1 } from '@/constants/designTokens';
import { Check } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

export function BuildingPlanView({ isDark }: { isDark: boolean }) {
  const t = isDark ? V1.dark : V1.light;
  const reducedMotion = useReducedMotion();
  const rotation = useSharedValue(0);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    if (!reducedMotion) {
      rotation.value = withRepeat(
        withTiming(360, { duration: 2000, easing: Easing.linear }),
        -1,
        false
      );
    }
    const t1 = setTimeout(() => setActiveStep(1), 800);
    const t2 = setTimeout(() => setActiveStep(2), 1600);
    return () => {
      cancelAnimation(rotation);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [rotation, reducedMotion]);

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const steps = [
    'Analyzing preferences',
    'Building personal plan',
    'Matching your guide',
  ];

  return (
    <View style={styles.buildingWrap}>
      {/* Spinning pie chart icon */}
      <Animated.View style={[styles.buildingSpinner, spinStyle]}>
        <View style={[styles.pieChart, { borderColor: V1.coral }]}>
          <View style={[styles.pieSlice, { backgroundColor: V1.coral }]} />
        </View>
      </Animated.View>

      <Text style={[styles.buildingTitle, { color: t.text }]}>
        Building your plan...
      </Text>
      <Text style={[styles.buildingSubtitle, { color: t.textSecondary }]}>
        Analyzing your answers
      </Text>

      <View style={styles.buildingSteps}>
        {steps.map((step, i) => (
          <View key={step} style={styles.buildingStepRow}>
            <View
              style={[
                styles.buildingStepDot,
                {
                  backgroundColor:
                    i < activeStep
                      ? V1.green
                      : i === activeStep
                        ? V1.coral
                        : 'transparent',
                  borderColor:
                    i < activeStep
                      ? V1.green
                      : i === activeStep
                        ? V1.coral
                        : t.textMuted,
                },
              ]}
            >
              {i < activeStep && <Check size={12} color="#fff" />}
            </View>
            <Text
              style={[
                styles.buildingStepText,
                {
                  color:
                    i <= activeStep ? t.text : t.textMuted,
                },
              ]}
            >
              {step}
            </Text>
          </View>
        ))}
      </View>

      {/* Red progress bar */}
      <View style={[styles.buildingProgress, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}>
        <Animated.View
          style={[
            styles.buildingProgressFill,
            {
              backgroundColor: V1.coral,
              width: `${((activeStep + 1) / 3) * 100}%`,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  buildingWrap: {
    alignItems: 'center',
    gap: 16,
  },
  buildingSpinner: {
    marginBottom: 16,
  },
  pieChart: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 4,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  pieSlice: {
    width: '50%',
    height: '50%',
    position: 'absolute',
    top: 0,
    left: 0,
    borderBottomRightRadius: 0,
  },
  buildingTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  buildingSubtitle: {
    fontSize: 15,
  },
  buildingSteps: {
    gap: 16,
    marginTop: 20,
    width: '100%',
    paddingHorizontal: 20,
  },
  buildingStepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  buildingStepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buildingStepText: {
    fontSize: 15,
    fontWeight: '500',
  },
  buildingProgress: {
    width: '80%',
    height: 4,
    borderRadius: 2,
    marginTop: 24,
    overflow: 'hidden',
  },
  buildingProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
});
