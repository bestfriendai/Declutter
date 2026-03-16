/**
 * ApiKeySetupWizard - Guided API key setup flow
 * Step-by-step wizard for configuring AI provider API keys
 */

import React, { useState, useCallback } from 'react';
import { useColorScheme } from '@/hooks/useColorScheme';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Linking,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import Animated, {
  FadeIn,
  SlideInRight,
  SlideOutLeft,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/theme/typography';
import { BorderRadius, Spacing, TouchTargets } from '@/theme/spacing';
import { ProgressSteps } from './ProgressSteps';
import { Banner } from './Banner';

type AIProvider = 'gemini' | 'openai' | 'custom';

interface ApiKeySetupWizardProps {
  initialProvider?: AIProvider;
  initialApiKey?: string;
  onComplete: (provider: AIProvider, apiKey: string) => void;
  onCancel: () => void;
  onTest?: (provider: AIProvider, apiKey: string) => Promise<boolean>;
}

const PROVIDER_INFO = {
  gemini: {
    name: 'Google Gemini',
    icon: '🤖',
    color: '#4285F4',
    instructionsUrl: 'https://aistudio.google.com/app/apikey',
    placeholder: 'AIzaSy...',
    description: 'Free tier available. Best for most users.',
    keyPrefix: 'AIzaSy',
  },
  openai: {
    name: 'OpenAI',
    icon: '🧠',
    color: '#10A37F',
    instructionsUrl: 'https://platform.openai.com/api-keys',
    placeholder: 'sk-...',
    description: 'Powerful models. Requires paid account.',
    keyPrefix: 'sk-',
  },
  custom: {
    name: 'Custom API',
    icon: '⚙️',
    color: '#8B5CF6',
    instructionsUrl: '',
    placeholder: 'Your API key',
    description: 'For advanced users with custom endpoints.',
    keyPrefix: '',
  },
};

const STEPS = [
  { label: 'Provider', icon: '1️⃣' },
  { label: 'API Key', icon: '2️⃣' },
  { label: 'Test', icon: '3️⃣' },
];

export function ApiKeySetupWizard({
  initialProvider = 'gemini',
  initialApiKey = '',
  onComplete,
  onCancel,
  onTest,
}: ApiKeySetupWizardProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const [currentStep, setCurrentStep] = useState(0);
  const [provider, setProvider] = useState<AIProvider>(initialProvider);
  const [apiKey, setApiKey] = useState(initialApiKey);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [validationSuccess, setValidationSuccess] = useState(false);

  const providerInfo = PROVIDER_INFO[provider];

  const handleProviderSelect = useCallback((selectedProvider: AIProvider) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setProvider(selectedProvider);
    setApiKey('');
    setValidationError(null);
    setValidationSuccess(false);
  }, []);

  const handleNext = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (currentStep === 0) {
      // Moving from provider selection to API key entry
      setCurrentStep(1);
    } else if (currentStep === 1) {
      // Validate API key format before proceeding
      const info = PROVIDER_INFO[provider];
      if (info.keyPrefix && !apiKey.startsWith(info.keyPrefix)) {
        setValidationError(`API key should start with "${info.keyPrefix}"`);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }
      if (apiKey.length < 10) {
        setValidationError('API key appears to be too short');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }
      setValidationError(null);
      setCurrentStep(2);
    }
  }, [currentStep, provider, apiKey]);

  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setValidationError(null);
      setValidationSuccess(false);
    }
  }, [currentStep]);

  const handleTestKey = useCallback(async () => {
    if (!onTest) {
      // If no test function provided, just complete
      setValidationSuccess(true);
      return;
    }

    setIsValidating(true);
    setValidationError(null);

    try {
      const success = await onTest(provider, apiKey);
      if (success) {
        setValidationSuccess(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        setValidationError('API key validation failed. Please check your key.');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch {
      setValidationError('Connection error. Please check your internet.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsValidating(false);
    }
  }, [provider, apiKey, onTest]);

  const handleComplete = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onComplete(provider, apiKey);
  }, [provider, apiKey, onComplete]);

  const openInstructions = useCallback(() => {
    const url = PROVIDER_INFO[provider].instructionsUrl;
    if (url) {
      Linking.openURL(url);
    }
  }, [provider]);

  // Step 1: Provider Selection
  const renderProviderSelection = () => (
    <Animated.View
      entering={SlideInRight.duration(350)}
      exiting={SlideOutLeft.duration(350)}
      style={styles.stepContent}
    >
      <Text style={[Typography.title3, styles.stepTitle, { color: colors.text }]}>
        Choose your AI provider
      </Text>
      <Text style={[Typography.subheadline, { color: colors.textSecondary }]}>
        Select where you have an API key
      </Text>

      <View style={styles.providerList}>
        {(Object.keys(PROVIDER_INFO) as AIProvider[]).map((providerId) => {
          const info = PROVIDER_INFO[providerId];
          const isSelected = provider === providerId;

          return (
            <Pressable
              key={providerId}
              onPress={() => handleProviderSelect(providerId)}
              style={[
                styles.providerCard,
                {
                  backgroundColor: isSelected ? info.color + '15' : colors.surfaceSecondary,
                  borderColor: isSelected ? info.color : colors.border,
                  borderWidth: isSelected ? 2 : 1,
                },
              ]}
            >
              <Text style={styles.providerIcon}>{info.icon}</Text>
              <View style={styles.providerInfo}>
                <Text style={[Typography.headline, { color: colors.text }]}>
                  {info.name}
                </Text>
                <Text style={[Typography.caption1, { color: colors.textSecondary }]}>
                  {info.description}
                </Text>
              </View>
              {isSelected && (
                <Ionicons name="checkmark-circle" size={24} color={info.color} />
              )}
            </Pressable>
          );
        })}
      </View>
    </Animated.View>
  );

  // Step 2: API Key Entry
  const renderApiKeyEntry = () => (
    <Animated.View
      entering={SlideInRight.duration(350)}
      exiting={SlideOutLeft.duration(350)}
      style={styles.stepContent}
    >
      <Text style={[Typography.title3, styles.stepTitle, { color: colors.text }]}>
        Enter your {providerInfo.name} API key
      </Text>

      {/* Instructions */}
      {providerInfo.instructionsUrl && (
        <Pressable
          onPress={openInstructions}
          style={[styles.instructionsLink, { backgroundColor: colors.infoMuted }]}
        >
          <Ionicons name="open-outline" size={18} color={colors.info} />
          <Text style={[Typography.subheadline, { color: colors.info }]}>
            Get your free API key →
          </Text>
        </Pressable>
      )}

      {/* API Key Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.apiKeyInput,
            {
              backgroundColor: colors.surfaceSecondary,
              borderColor: validationError ? colors.error : colors.border,
              color: colors.text,
            },
          ]}
          placeholder={providerInfo.placeholder}
          placeholderTextColor={colors.textTertiary}
          value={apiKey}
          onChangeText={(text) => {
            setApiKey(text);
            setValidationError(null);
          }}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry={!showApiKey}
          accessibilityLabel="API Key"
        />
        <Pressable
          onPress={() => setShowApiKey(!showApiKey)}
          style={styles.visibilityToggle}
        >
          <Ionicons
            name={showApiKey ? 'eye-outline' : 'eye-off-outline'}
            size={20}
            color={colors.textSecondary}
          />
        </Pressable>
      </View>

      {validationError && (
        <Banner type="error" message={validationError} dismissible={false} />
      )}

      <View style={[styles.securityNote, { backgroundColor: colors.surfaceSecondary }]}>
        <Ionicons name="shield-checkmark" size={18} color={colors.success} />
        <Text style={[Typography.caption1, { color: colors.textSecondary, flex: 1 }]}>
          Your API key is stored securely on your device and never sent to our servers.
        </Text>
      </View>
    </Animated.View>
  );

  // Step 3: Test & Confirm
  const renderTestStep = () => (
    <Animated.View
      entering={SlideInRight.duration(350)}
      exiting={SlideOutLeft.duration(350)}
      style={styles.stepContent}
    >
      <Text style={[Typography.title3, styles.stepTitle, { color: colors.text }]}>
        Test your connection
      </Text>

      <View style={[styles.summaryCard, { backgroundColor: colors.surfaceSecondary }]}>
        <View style={styles.summaryRow}>
          <Text style={[Typography.subheadline, { color: colors.textSecondary }]}>
            Provider
          </Text>
          <Text style={[Typography.body, { color: colors.text }]}>
            {providerInfo.icon} {providerInfo.name}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={[Typography.subheadline, { color: colors.textSecondary }]}>
            API Key
          </Text>
          <Text style={[Typography.body, { color: colors.text }]}>
            {apiKey.substring(0, 8)}...{apiKey.substring(apiKey.length - 4)}
          </Text>
        </View>
      </View>

      {!validationSuccess && !isValidating && (
        <Pressable
          onPress={handleTestKey}
          style={[styles.testButton, { backgroundColor: providerInfo.color }]}
        >
          <Ionicons name="flash" size={20} color="#FFFFFF" />
          <Text style={[Typography.buttonMedium, { color: '#FFFFFF' }]}>
            Test Connection
          </Text>
        </Pressable>
      )}

      {isValidating && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={providerInfo.color} />
          <Text style={[Typography.subheadline, { color: colors.textSecondary }]}>
            Testing connection...
          </Text>
        </View>
      )}

      {validationSuccess && (
        <Animated.View entering={FadeIn.duration(350)}>
          <Banner
            type="success"
            title="Connection successful!"
            message="Your API key is working. You're all set!"
            dismissible={false}
          />
        </Animated.View>
      )}

      {validationError && (
        <Banner type="error" message={validationError} dismissible={false} />
      )}

      {/* Skip test option for users who want to move fast */}
      {!validationSuccess && !isValidating && (
        <Pressable
          onPress={() => {
            setValidationSuccess(true);
          }}
          style={styles.skipTestLink}
        >
          <Text style={[Typography.caption1, { color: colors.textTertiary }]}>
            Skip test and save anyway
          </Text>
        </Pressable>
      )}
    </Animated.View>
  );

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Progress Steps */}
      <View style={styles.progressContainer}>
        <ProgressSteps steps={STEPS} currentStep={currentStep} />
      </View>

      {/* Step Content */}
      <View style={styles.contentContainer}>
        {currentStep === 0 && renderProviderSelection()}
        {currentStep === 1 && renderApiKeyEntry()}
        {currentStep === 2 && renderTestStep()}
      </View>

      {/* Navigation Buttons */}
      <View style={styles.buttonContainer}>
        <Pressable
          onPress={currentStep === 0 ? onCancel : handleBack}
          style={[styles.button, styles.secondaryButton, { borderColor: colors.border }]}
        >
          <Text style={[Typography.buttonMedium, { color: colors.textSecondary }]}>
            {currentStep === 0 ? 'Cancel' : 'Back'}
          </Text>
        </Pressable>

        {currentStep < 2 ? (
          <Pressable
            onPress={handleNext}
            disabled={currentStep === 1 && !apiKey}
            style={[
              styles.button,
              styles.primaryButton,
              {
                backgroundColor: currentStep === 1 && !apiKey
                  ? colors.disabled
                  : colors.primary,
              },
            ]}
          >
            <Text style={[Typography.buttonMedium, { color: colors.textOnPrimary }]}>
              Next
            </Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={handleComplete}
            disabled={!validationSuccess}
            style={[
              styles.button,
              styles.primaryButton,
              {
                backgroundColor: validationSuccess
                  ? colors.success
                  : colors.disabled,
              },
            ]}
          >
            <Text style={[Typography.buttonMedium, { color: '#FFFFFF' }]}>
              Save & Finish
            </Text>
          </Pressable>
        )}
      </View>
    </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  progressContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    marginBottom: Spacing.xs,
  },
  providerList: {
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  providerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  providerIcon: {
    fontSize: 28,
    marginRight: Spacing.sm,
  },
  providerInfo: {
    flex: 1,
  },
  instructionsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.md,
    gap: Spacing.xs,
  },
  inputContainer: {
    position: 'relative',
    marginTop: Spacing.md,
  },
  apiKeyInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    paddingRight: TouchTargets.minimum,
    fontSize: 16,
    fontFamily: 'monospace',
  },
  visibilityToggle: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: TouchTargets.minimum,
    alignItems: 'center',
    justifyContent: 'center',
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.md,
    gap: Spacing.xs,
  },
  summaryCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.lg,
    gap: Spacing.xs,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.sm,
  },
  skipTestLink: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    marginTop: Spacing.sm,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  button: {
    flex: 1,
    height: TouchTargets.large,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.lg,
  },
  primaryButton: {},
  secondaryButton: {
    borderWidth: 1,
  },
});

export default ApiKeySetupWizard;
