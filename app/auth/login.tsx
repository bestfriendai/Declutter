/**
 * Declutterly — Login Screen (Apple 2026)
 * Full-bleed gradient, glass form card, animated entry
 */

import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Typography } from '@/theme/typography';
import { Spacing, BorderRadius } from '@/theme/spacing';
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

export default function LoginScreen() {
  const rawScheme = useColorScheme();
  const colorScheme = rawScheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const passwordRef = useRef<TextInput>(null);

  const handleLogin = useCallback(async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    setError('');
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const result = await signIn(email.trim(), password);
      if (result.success) {
        router.replace('/(tabs)');
      } else {
        setError(result.error ?? 'Login failed. Please try again.');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (e: any) {
      setError(e?.message ?? 'Login failed. Please try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  }, [email, password, signIn]);

  const togglePassword = useCallback(() => {
    Haptics.selectionAsync();
    setShowPassword(v => !v);
  }, []);

  return (
    <View style={styles.container} accessibilityLabel="Sign in screen">
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Background gradient */}
      <LinearGradient
        colors={isDark
          ? ['#000000', '#0A0A0F', '#0D0D1A']
          : ['#F2F2F7', '#E8E8F0', '#FFFFFF']}
        style={StyleSheet.absoluteFill}
      />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + Spacing.xxl, paddingBottom: insets.bottom + Spacing.xxl },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Logo / Brand ─────────────────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(0).springify()} style={styles.brandSection}>
            <View style={[styles.logoContainer, {
              backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
              borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
            }]}>
              <Text style={styles.logoEmoji} accessibilityElementsHidden>{'🧹'}</Text>
            </View>
            <Text
              style={[Typography.displaySmall, { color: colors.text, marginTop: Spacing.md }]}
              accessibilityRole="header"
            >
              Welcome back
            </Text>
            <Text style={[Typography.subheadline, { color: colors.textSecondary, marginTop: Spacing.xxs + 2 }]}>
              Sign in to continue decluttering
            </Text>
          </Animated.View>

          {/* ── Form Card ────────────────────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(80).springify()} style={styles.formSection}>
            <View style={[styles.formCard, {
              backgroundColor: isDark ? 'rgba(28,28,30,0.85)' : 'rgba(255,255,255,0.90)',
              borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)',
            }]}>
              <BlurView
                intensity={isDark ? 60 : 40}
                tint={isDark ? 'dark' : 'light'}
                style={StyleSheet.absoluteFill}
              />

              {/* Email */}
              <View style={styles.inputGroup}>
                <Text style={[Typography.footnoteMedium, styles.inputLabel, { color: colors.textSecondary }]}>
                  Email
                </Text>
                <View style={[styles.inputContainer, {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                  borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)',
                }]}>
                  <Text style={styles.inputIcon} accessibilityElementsHidden>{'✉️'}</Text>
                  <TextInput
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
                    accessibilityHint="Enter your email address to sign in"
                  />
                </View>
              </View>

              {/* Divider */}
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
                  <Text style={styles.inputIcon} accessibilityElementsHidden>{'🔒'}</Text>
                  <TextInput
                    ref={passwordRef}
                    style={[styles.input, Typography.callout, { color: colors.text }]}
                    placeholder="Your password"
                    placeholderTextColor={colors.textTertiary}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoComplete="password"
                    textContentType="password"
                    returnKeyType="done"
                    onSubmitEditing={handleLogin}
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
              </View>
            </View>

          </Animated.View>

          {/* ── Error ────────────────────────────────────────────────── */}
          {error ? (
            <Animated.View
              entering={FadeInDown.springify()}
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

          {/* ── Sign In Button ───────────────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(160).springify()} style={styles.ctaSection}>
            <Pressable
              onPress={handleLogin}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="Sign in"
              accessibilityState={{ disabled: loading, busy: loading }}
              style={({ pressed }) => ({
                opacity: loading ? 0.7 : pressed ? 0.85 : 1,
              })}
            >
              <LinearGradient
                colors={[...colors.gradientAccent]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.signInButton}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" accessibilityLabel="Signing in" />
                ) : (
                  <Text style={[Typography.headline, { color: '#FFFFFF' }]}>Sign In</Text>
                )}
              </LinearGradient>
            </Pressable>

            {/* Sign Up Link */}
            <View style={styles.signUpRow}>
              <Text style={[Typography.subheadline, { color: colors.textSecondary }]}>
                {"Don't have an account? "}
              </Text>
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync();
                  router.push('/auth/signup');
                }}
                accessibilityRole="link"
                accessibilityLabel="Create account"
                hitSlop={8}
                style={styles.signUpLink}
              >
                <Text style={[Typography.subheadlineMedium, { color: colors.accent }]}>
                  Sign Up
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
    marginBottom: Spacing.xxl,
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
  inputIcon: { fontSize: 16 },
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

  forgotButton: {
    alignSelf: 'flex-end',
    marginTop: Spacing.sm,
    paddingVertical: Spacing.xxs,
    minHeight: 44,
    justifyContent: 'center',
  },

  errorBanner: {
    borderRadius: BorderRadius.input,
    borderWidth: 0.5,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
  },

  ctaSection: { gap: Spacing.ml },
  signInButton: {
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  signUpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 44,
  },
  signUpLink: {
    minHeight: 44,
    justifyContent: 'center',
  },
});
