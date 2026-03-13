/**
 * Declutterly — Signup Screen (Apple 2026)
 * Full-bleed gradient, glass form card, password strength, animated entry
 * Name field is optional, guest mode available
 */

import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Typography } from '@/theme/typography';
import { Spacing, BorderRadius } from '@/theme/spacing';
import { PasswordStrengthBar } from '@/components/ui/PasswordRequirements';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { useAuth } from '@/context/AuthContext';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export default function SignupScreen() {
  const rawScheme = useColorScheme();
  const colorScheme = rawScheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();

  const { signUp, continueAsGuest } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const handleSignup = useCallback(async () => {
    // Name is now optional — skip validation for it
    if (!email.trim()) {
      setError('Please enter your email.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    setError('');
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const result = await signUp(email.trim(), password, name.trim() || undefined);
      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace('/(tabs)');
      } else {
        setError(result.error ?? 'Sign up failed. Please try again.');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (e: any) {
      setError(e?.message ?? 'Sign up failed. Please try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  }, [name, email, password, signUp]);

  const handleGuestLogin = useCallback(async () => {
    setError('');
    setGuestLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const result = await continueAsGuest();
      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace('/(tabs)');
      } else {
        setError(result.error ?? 'Guest login failed. Please try again.');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (e: any) {
      setError(e?.message ?? 'Guest login failed. Please try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setGuestLoading(false);
    }
  }, [continueAsGuest]);

  const togglePassword = useCallback(() => {
    Haptics.selectionAsync();
    setShowPassword(v => !v);
  }, []);

  const isAnyLoading = loading || guestLoading;

  return (
    <View style={styles.container} accessibilityLabel="Create account screen">
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Background gradient — lightened dark mode base */}
      <LinearGradient
        colors={isDark
          ? ['#1C1C1E', '#141418', '#1A1A24']
          : ['#F2F2F7', '#E8E8F0', '#FFFFFF']}
        style={StyleSheet.absoluteFill}
      />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + Spacing.xxl, paddingBottom: insets.bottom + Spacing.xxl },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Brand */}
          <Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(0).springify()} style={styles.brandSection}>
            <View style={[styles.logoContainer, {
              backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
              borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
            }]}>
              <Text style={styles.logoEmoji} accessibilityElementsHidden>{'B'}</Text>
            </View>
            <Text
              style={[Typography.displaySmall, { color: colors.text, marginTop: Spacing.md }]}
              accessibilityRole="header"
            >
              Create account
            </Text>
            <Text style={[Typography.subheadline, { color: colors.textSecondary, marginTop: Spacing.xxs + 2 }]}>
              Start your decluttering journey
            </Text>
          </Animated.View>

          {/* Form Card */}
          <Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(80).springify()} style={styles.formSection}>
            <View style={[styles.formCard, {
              backgroundColor: isDark ? 'rgba(28,28,30,0.85)' : 'rgba(255,255,255,0.90)',
              borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)',
            }]}>
              <BlurView
                intensity={isDark ? 60 : 40}
                tint={isDark ? 'dark' : 'light'}
                style={StyleSheet.absoluteFill}
              />

              {/* Email — primary field */}
              <View style={styles.inputGroup}>
                <Text style={[Typography.footnoteMedium, styles.inputLabel, { color: colors.textSecondary }]}>
                  Email
                </Text>
                <View style={[styles.inputContainer, {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                  borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)',
                }]}>
                  <TextInput
                    ref={emailRef}
                    style={[styles.input, Typography.callout, { color: colors.text }]}
                    placeholder="you@example.com"
                    placeholderTextColor={colors.textTertiary}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="email"
                    textContentType="emailAddress"
                    returnKeyType="next"
                    onSubmitEditing={() => passwordRef.current?.focus()}
                    accessibilityLabel="Email address"
                  />
                </View>
              </View>

              <View style={[styles.inputDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }]} />

              {/* Password */}
              <View style={styles.inputGroup}>
                <Text style={[Typography.footnoteMedium, styles.inputLabel, { color: colors.textSecondary }]}>
                  Password
                </Text>
                <View style={[styles.inputContainer, {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                  borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)',
                }]}>
                  <TextInput
                    ref={passwordRef}
                    style={[styles.input, Typography.callout, { color: colors.text }]}
                    placeholder="Min. 6 characters"
                    placeholderTextColor={colors.textTertiary}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoComplete="new-password"
                    textContentType="newPassword"
                    returnKeyType="done"
                    onSubmitEditing={handleSignup}
                    accessibilityLabel="Password"
                  />
                  <Pressable
                    onPress={togglePassword}
                    accessibilityRole="button"
                    accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                    hitSlop={12}
                    style={styles.showPasswordButton}
                  >
                    <Text style={[Typography.calloutMedium, { color: colors.accent }]}>
                      {showPassword ? 'Hide' : 'Show'}
                    </Text>
                  </Pressable>
                </View>

                {/* Password Strength Indicator */}
                <PasswordStrengthBar password={password} />
              </View>

              <View style={[styles.inputDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }]} />

              {/* Name — optional, moved to end */}
              <View style={styles.inputGroup}>
                <Text style={[Typography.footnoteMedium, styles.inputLabel, { color: colors.textSecondary }]}>
                  Name <Text style={{ color: colors.textTertiary }}>(optional)</Text>
                </Text>
                <View style={[styles.inputContainer, {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                  borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)',
                }]}>
                  <TextInput
                    style={[styles.input, Typography.callout, { color: colors.text }]}
                    placeholder="What should we call you?"
                    placeholderTextColor={colors.textTertiary}
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                    autoComplete="name"
                    textContentType="name"
                    returnKeyType="done"
                    onSubmitEditing={handleSignup}
                    accessibilityLabel="Your name, optional"
                    accessibilityHint="You can add your name later in settings"
                  />
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Error */}
          {error ? (
            <Animated.View
              entering={reducedMotion ? undefined : FadeInDown.springify()}
              style={[styles.errorBanner, {
                backgroundColor: colors.errorMuted,
                borderColor: colors.error,
              }]}
              accessibilityRole="alert"
              accessibilityLiveRegion="assertive"
            >
              <Text style={[Typography.footnote, { color: colors.error }]}>{error}</Text>
            </Animated.View>
          ) : null}

          {/* CTA */}
          <Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(160).springify()} style={styles.ctaSection}>
            <Pressable
              onPress={handleSignup}
              disabled={isAnyLoading}
              accessibilityRole="button"
              accessibilityLabel="Create account"
              accessibilityState={{ disabled: isAnyLoading, busy: loading }}
              style={({ pressed }) => ({
                opacity: isAnyLoading ? 0.7 : pressed ? 0.85 : 1,
              })}
            >
              <LinearGradient
                colors={[...colors.gradientAccent]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.signUpButton}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" accessibilityLabel="Creating account" />
                ) : (
                  <Text style={[Typography.headline, { color: '#FFFFFF' }]}>
                    Create Account
                  </Text>
                )}
              </LinearGradient>
            </Pressable>

            {/* Continue as Guest */}
            <Pressable
              onPress={handleGuestLogin}
              disabled={isAnyLoading}
              accessibilityRole="button"
              accessibilityLabel="Try without account"
              accessibilityHint="Continue as a guest without creating an account"
              accessibilityState={{ disabled: isAnyLoading, busy: guestLoading }}
              style={({ pressed }) => [
                styles.guestButton,
                {
                  opacity: isAnyLoading ? 0.5 : pressed ? 0.7 : 1,
                  borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.10)',
                },
              ]}
            >
              {guestLoading ? (
                <ActivityIndicator color={colors.textSecondary} size="small" accessibilityLabel="Setting up guest account" />
              ) : (
                <Text style={[Typography.subheadlineMedium, { color: colors.textSecondary }]}>
                  Try without account
                </Text>
              )}
            </Pressable>

            {/* Terms */}
            <Text style={[Typography.caption1, { color: colors.textSecondary, textAlign: 'center', lineHeight: 18 }]}>
              {'By signing up, you agree to our '}
              <Text style={{ color: colors.accent }}>Terms</Text>
              {' and '}
              <Text style={{ color: colors.accent }}>Privacy Policy</Text>
            </Text>

            {/* Sign In Link */}
            <View style={styles.signInRow}>
              <Text style={[Typography.subheadline, { color: colors.textSecondary }]}>
                {'Already have an account? '}
              </Text>
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync();
                  router.push('/auth/login');
                }}
                accessibilityRole="link"
                accessibilityLabel="Sign in to existing account"
                hitSlop={8}
                style={styles.signInLink}
              >
                <Text style={[Typography.subheadlineMedium, { color: colors.accent }]}>
                  Sign In
                </Text>
              </Pressable>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    flexGrow: 1,
    justifyContent: 'center',
  },

  brandSection: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  logoEmoji: { fontSize: 40 },

  formSection: { marginBottom: Spacing.md },
  formCard: {
    borderRadius: BorderRadius.card,
    borderWidth: 0.5,
    overflow: 'hidden',
    padding: Spacing.ml,
    gap: Spacing.md,
  },
  inputGroup: { gap: Spacing.xs },
  inputLabel: {
    marginLeft: Spacing.xxs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.input,
    borderWidth: 0.5,
    paddingHorizontal: Spacing.sm + 2,
    minHeight: 48,
    gap: Spacing.xs + 2,
  },
  input: {
    flex: 1,
    paddingVertical: Spacing.sm,
  },
  showPasswordButton: {
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputDivider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: -Spacing.ml,
  },

  errorBanner: {
    borderRadius: BorderRadius.input,
    borderWidth: 0.5,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
  },

  ctaSection: { gap: Spacing.md },
  signUpButton: {
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  guestButton: {
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    borderWidth: 1,
  },
  signInRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 44,
  },
  signInLink: {
    minHeight: 44,
    justifyContent: 'center',
  },
});
