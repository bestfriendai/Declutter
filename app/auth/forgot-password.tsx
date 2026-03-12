/**
 * Declutterly — Forgot Password Screen (Apple 2026)
 * Password reset flow with success state and resend cooldown
 */

import { GlassButton } from '@/components/ui/GlassButton';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/theme/ThemeProvider';
import { Typography } from '@/theme/typography';
import { Spacing, BorderRadius } from '@/theme/spacing';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { resetPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleResetPassword = useCallback(async () => {
    if (!email.trim()) {
      setError('Please enter your email');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    if (!email.includes('@')) {
      setError('Please enter a valid email');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    setError(null);
    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const result = await resetPassword(email.trim());
    setIsLoading(false);

    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSuccess(true);
      setResendCooldown(60);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(result.error || 'Failed to send reset email');
    }
  }, [email, resetPassword]);

  const handleBack = useCallback(() => {
    Haptics.selectionAsync();
    router.back();
  }, [router]);

  if (success) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]} accessibilityLabel="Password reset email sent">
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <LinearGradient
          colors={isDark
            ? ['#000000', '#0A0A0F', '#0D0D1A']
            : ['#F2F2F7', '#E8E8F0', '#FFFFFF']}
          style={StyleSheet.absoluteFill}
        />

        <View style={[styles.content, { paddingTop: insets.top + 80 }]}>
          <Animated.View
            entering={FadeInDown.springify()}
            style={styles.successContainer}
          >
            <View style={[styles.successIcon, { backgroundColor: colors.successMuted }]}>
              <Ionicons name="mail-open" size={48} color={colors.success} />
            </View>
            <Text
              style={[Typography.title1, styles.successTitle, { color: colors.text }]}
              accessibilityRole="header"
            >
              Check Your Email
            </Text>
            <Text style={[Typography.body, styles.successText, { color: colors.textSecondary }]}>
              {"We've sent password reset instructions to\n"}
              <Text style={[Typography.bodyMedium, { color: colors.text }]}>{email}</Text>
            </Text>

            {/* Spam folder hint */}
            <View style={[styles.hintContainer, { backgroundColor: colors.accentMuted }]}>
              <Ionicons name="information-circle-outline" size={18} color={colors.accent} />
              <Text style={[Typography.footnote, styles.hintText, { color: colors.textSecondary }]}>
                {"Can't find it? Check your spam folder"}
              </Text>
            </View>

            {/* Resend button with timer */}
            <Pressable
              style={[styles.resendButton, resendCooldown > 0 && styles.resendButtonDisabled]}
              onPress={() => {
                if (resendCooldown === 0) {
                  setSuccess(false);
                  handleResetPassword();
                }
              }}
              disabled={resendCooldown > 0}
              accessibilityRole="button"
              accessibilityLabel={resendCooldown > 0 ? `Resend in ${resendCooldown} seconds` : 'Resend email'}
              accessibilityState={{ disabled: resendCooldown > 0 }}
            >
              <Text style={[
                Typography.calloutMedium,
                { color: resendCooldown > 0 ? colors.textSecondary : colors.accent, textAlign: 'center' },
              ]}>
                {resendCooldown > 0
                  ? `Resend in ${resendCooldown}s`
                  : 'Resend Email'}
              </Text>
            </Pressable>

            <GlassButton
              title="Back to Sign In"
              onPress={() => router.replace('/auth/login')}
              style={styles.backButton}
              variant="secondary"
              fullWidth
              accessibilityLabel="Back to sign in"
            />
          </Animated.View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]} accessibilityLabel="Forgot password screen">
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Pressable style={styles.dismissKeyboard} onPress={Keyboard.dismiss} accessibilityElementsHidden>
        <LinearGradient
          colors={isDark
            ? ['#000000', '#0A0A0F', '#0D0D1A']
            : ['#F2F2F7', '#E8E8F0', '#FFFFFF']}
          style={StyleSheet.absoluteFill}
        />
      </Pressable>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + Spacing.ml, paddingBottom: insets.bottom + Spacing.ml },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back Button */}
          <Animated.View entering={FadeInDown.delay(50).springify()}>
            <Pressable
              style={styles.headerBackButton}
              onPress={handleBack}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              hitSlop={8}
            >
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </Pressable>
          </Animated.View>

          {/* Header */}
          <Animated.View
            entering={FadeInDown.delay(100).springify()}
            style={styles.header}
          >
            <View style={[styles.iconContainer, { backgroundColor: colors.accentMuted }]}>
              <Ionicons name="key" size={40} color={colors.accent} />
            </View>
            <Text
              style={[Typography.title1, styles.title, { color: colors.text }]}
              accessibilityRole="header"
            >
              Forgot Password?
            </Text>
            <Text style={[Typography.callout, styles.subtitle, { color: colors.textSecondary }]}>
              {"No worries! Enter your email and we'll send you instructions to reset your password."}
            </Text>
          </Animated.View>

          {/* Form */}
          <Animated.View
            entering={FadeInDown.delay(200).springify()}
            style={styles.form}
          >
            {/* Error */}
            {error && (
              <Animated.View
                entering={FadeInDown.springify()}
                style={[styles.errorContainer, { backgroundColor: colors.errorMuted }]}
                accessibilityRole="alert"
                accessibilityLiveRegion="assertive"
              >
                <Ionicons name="alert-circle" size={20} color={colors.error} />
                <Text style={[Typography.footnote, styles.errorText, { color: colors.error }]}>
                  {error}
                </Text>
                <Pressable
                  onPress={() => setError(null)}
                  accessibilityRole="button"
                  accessibilityLabel="Dismiss error"
                  hitSlop={8}
                  style={styles.errorDismiss}
                >
                  <Ionicons name="close" size={20} color={colors.error} />
                </Pressable>
              </Animated.View>
            )}

            {/* Email Input */}
            <BlurView
              intensity={isDark ? 20 : 40}
              tint={isDark ? 'dark' : 'light'}
              style={[styles.inputContainer, { borderColor: colors.border }]}
            >
              <Ionicons
                name="mail-outline"
                size={20}
                color={colors.textSecondary}
                style={styles.inputIcon}
                accessibilityElementsHidden
              />
              <TextInput
                style={[styles.input, Typography.callout, { color: colors.text }]}
                placeholder="Enter your email"
                placeholderTextColor={colors.textTertiary}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                textContentType="emailAddress"
                returnKeyType="done"
                onSubmitEditing={handleResetPassword}
                accessibilityLabel="Email address"
                accessibilityHint="Enter the email address associated with your account"
              />
            </BlurView>

            {/* Reset Button */}
            <GlassButton
              title={isLoading ? 'Sending...' : 'Send Reset Link'}
              onPress={handleResetPassword}
              disabled={isLoading}
              loading={isLoading}
              style={styles.resetButton}
              variant="primary"
              size="large"
              fullWidth
              icon={!isLoading ? (
                <Ionicons name="send" size={20} color={colors.textOnPrimary} />
              ) : undefined}
              accessibilityLabel="Send password reset link"
            />
          </Animated.View>

          {/* Back to Login */}
          <Animated.View
            entering={FadeInUp.delay(300).springify()}
            style={styles.footer}
          >
            <Pressable
              style={styles.backToLoginButton}
              onPress={handleBack}
              accessibilityRole="link"
              accessibilityLabel="Back to sign in"
              hitSlop={8}
            >
              <Ionicons name="arrow-back" size={16} color={colors.accent} />
              <Text style={[Typography.calloutMedium, { color: colors.accent }]}>
                Back to Sign In
              </Text>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  dismissKeyboard: {
    ...StyleSheet.absoluteFillObject,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
  },
  headerBackButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginTop: Spacing.xl,
    marginBottom: Spacing.xxl,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.ml,
  },
  title: {
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: Spacing.ml,
  },
  form: {
    gap: Spacing.md,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: BorderRadius.input,
    gap: Spacing.xs,
  },
  errorText: {
    flex: 1,
  },
  errorDismiss: {
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    minHeight: 52,
  },
  inputIcon: {
    paddingLeft: Spacing.md,
  },
  input: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  resetButton: {
    marginTop: Spacing.xs,
  },
  footer: {
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  backToLoginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xxs + 2,
    minHeight: 44,
  },
  successContainer: {
    alignItems: 'center',
    paddingHorizontal: Spacing.ml,
  },
  successIcon: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  successTitle: {
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  successText: {
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.md,
  },
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs + 2,
    paddingHorizontal: Spacing.sm + 2,
    borderRadius: BorderRadius.sm + 2,
    marginBottom: Spacing.md,
    gap: Spacing.xs,
  },
  hintText: {
    flex: 1,
  },
  resendButton: {
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.ml,
    minHeight: 44,
    justifyContent: 'center',
  },
  resendButtonDisabled: {
    opacity: 0.6,
  },
  backButton: {
    minWidth: 200,
  },
});
