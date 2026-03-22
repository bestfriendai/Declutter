/**
 * Declutterly -- Sign In Screen (V1)
 * Matches Pencil design: Al4tq
 *
 * Improvements:
 * - AnimatedInput with focus border animation
 * - Error auto-dismiss on input change + 5s timeout
 * - Error shake animation on validation failures
 * - Removed "More sign-in options coming soon" placeholder text
 * - Accessibility improvements (alert role on error banner, eye toggle labels)
 */

import { useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useRef, useState } from 'react';
import {
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
import { V1, BODY_FONT, DISPLAY_FONT, ANIMATION } from '@/constants/designTokens';
import { AnimatedInput, CoralButton, ErrorBanner } from '@/components/ui';

export default function LoginScreen() {
  const rawScheme = useColorScheme();
  const isDark = rawScheme === 'dark';
  const reducedMotion = useReducedMotion();
  const t = isDark ? V1.dark : V1.light;
  const insets = useSafeAreaInsets();

  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [shakeTrigger, setShakeTrigger] = useState(0);

  const passwordRef = useRef<TextInput>(null);

  const iconColor = isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.3)';

  // Auto-dismiss error on input change
  const handleEmailChange = useCallback((text: string) => {
    setEmail(text);
    if (error) setError('');
  }, [error]);

  const handlePasswordChange = useCallback((text: string) => {
    setPassword(text);
    if (error) setError('');
  }, [error]);

  const triggerErrorShake = useCallback(() => {
    setShakeTrigger((prev) => prev + 1);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }, []);

  const handleLogin = useCallback(async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      triggerErrorShake();
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address.');
      triggerErrorShake();
      return;
    }
    setError('');
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const result = await signIn(email.trim(), password);
      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace('/');
      } else {
        setError(result.error ?? 'Login failed. Please try again.');
        triggerErrorShake();
      }
    } catch (e: unknown) {
      setError(
        e instanceof Error ? e.message : 'Login failed. Please try again.',
      );
      triggerErrorShake();
    } finally {
      setLoading(false);
    }
  }, [email, password, signIn, triggerErrorShake]);

  const togglePassword = useCallback(() => {
    Haptics.selectionAsync();
    setShowPassword((v) => !v);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: insets.top + 48,
              paddingBottom: insets.bottom + 16,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Animated.View
            entering={reducedMotion ? undefined : FadeInDown.delay(0).duration(ANIMATION.duration.normal)}
            style={styles.headerSection}
          >
            <Text style={[styles.heading, { color: t.text }]}>
              Welcome back
            </Text>
            <Text style={[styles.subtitle, { color: t.textSecondary }]}>
              Sign in to continue your journey
            </Text>
          </Animated.View>

          {/* Email input */}
          <Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(ANIMATION.stagger.normal).duration(ANIMATION.duration.normal)}>
            <AnimatedInput
              isDark={isDark}
              icon={<Mail size={18} color={iconColor} />}
              placeholder="Email address"
              value={email}
              onChangeText={handleEmailChange}
              editable={!loading}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              accessibilityLabel="Email address"
              hasError={!!error}
            />
          </Animated.View>

          {/* Password input */}
          <Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(ANIMATION.stagger.normal * 2).duration(ANIMATION.duration.normal)}>
            <AnimatedInput
              isDark={isDark}
              icon={<Lock size={18} color={iconColor} />}
              inputRef={passwordRef}
              placeholder="Password"
              value={password}
              onChangeText={handlePasswordChange}
              editable={!loading}
              secureTextEntry={!showPassword}
              autoComplete="password"
              textContentType="password"
              returnKeyType="done"
              onSubmitEditing={handleLogin}
              accessibilityLabel="Password"
              hasError={!!error}
              rightElement={
                <Pressable
                  onPress={togglePassword}
                  hitSlop={12}
                  style={styles.eyeButton}
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff size={18} color={iconColor} />
                  ) : (
                    <Eye size={18} color={iconColor} />
                  )}
                </Pressable>
              }
            />
          </Animated.View>

          {/* Forgot password */}
          <Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(ANIMATION.stagger.normal * 3).duration(ANIMATION.duration.normal)}>
            <Pressable
              onPress={() => {
                Haptics.selectionAsync();
                router.push('/auth/forgot-password');
              }}
              style={styles.forgotRow}
            >
              <Text style={[styles.forgotText, { color: V1.coral }]}>
                Forgot password?
              </Text>
            </Pressable>
          </Animated.View>

          {/* Error with auto-dismiss + shake */}
          {error ? (
            <ErrorBanner
              message={error}
              autoDismissMs={5000}
              onDismiss={() => setError('')}
              shakeTrigger={shakeTrigger}
            />
          ) : null}

          {/* Sign In button */}
          <Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(ANIMATION.stagger.normal * 4).duration(ANIMATION.duration.normal)}>
            <CoralButton
              title="Sign In"
              onPress={handleLogin}
              loading={loading}
              flat
              style={styles.signInButton}
            />
          </Animated.View>

          {/* Sign Up link */}
          <View style={{ flex: 1 }} />
          <Animated.View
            entering={reducedMotion ? undefined : FadeInDown.delay(ANIMATION.stagger.normal * 5).duration(ANIMATION.duration.normal)}
            style={styles.linkRow}
          >
            <Text style={[styles.linkText, { color: t.textMuted }]}>
              {"Don't have an account? "}
            </Text>
            <Pressable
              onPress={() => {
                Haptics.selectionAsync();
                router.replace('/auth/signup');
              }}
              hitSlop={8}
            >
              <Text style={[styles.linkTextBold, { color: V1.coral }]}>
                Sign Up
              </Text>
            </Pressable>
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
    paddingHorizontal: 24,
    flexGrow: 1,
  },

  // -- Header --
  headerSection: {
    gap: 8,
    marginBottom: 32,
  },
  heading: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.6,
    fontFamily: DISPLAY_FONT,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: BODY_FONT,
  },

  // -- Inputs --
  eyeButton: {
    padding: 4,
    minWidth: 30,
    alignItems: 'center',
  },

  // -- Forgot --
  forgotRow: {
    alignItems: 'flex-end',
    paddingVertical: 4,
    marginBottom: 20,
  },
  forgotText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: BODY_FONT,
  },

  // -- Button --
  signInButton: {
    marginBottom: 24,
  },

  // -- Link row --
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  linkText: {
    fontSize: 14,
    fontFamily: BODY_FONT,
  },
  linkTextBold: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: BODY_FONT,
  },
});
