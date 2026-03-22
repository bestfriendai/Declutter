/**
 * Declutterly -- Sign Up Screen (V1)
 * Matches Pencil design: OVP4z
 *
 * Improvements:
 * - Memoized password strength calculation (useMemo)
 * - Animated strength bar (withTiming)
 * - Password criteria checklist (visual checkmarks)
 * - In-app browser for terms/privacy (expo-web-browser)
 * - AnimatedInput + ErrorBanner components
 */

import { useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { User, Mail, Lock, Eye, EyeOff, Check, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useMemo, useRef, useState } from 'react';
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
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { V1, BODY_FONT, DISPLAY_FONT, ANIMATION } from '@/constants/designTokens';
import { AnimatedInput, CoralButton, ErrorBanner } from '@/components/ui';
import { useEffect } from 'react';

export default function SignupScreen() {
  const rawScheme = useColorScheme();
  const isDark = rawScheme === 'dark';
  const reducedMotion = useReducedMotion();
  const t = isDark ? V1.dark : V1.light;
  const insets = useSafeAreaInsets();

  const { signUp } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [shakeTrigger, setShakeTrigger] = useState(0);

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const iconColor = isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.3)';

  // Memoized password strength calculation
  const passwordStrength = useMemo(() => {
    if (!password) return { label: '', color: 'transparent', percent: 0, criteria: { length: false, upper: false, lower: false, number: false } };

    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasLength = password.length >= 8;
    const isStrong = password.length >= 10 && hasUpper && hasLower && hasNumber;

    const criteria = {
      length: hasLength,
      upper: hasUpper,
      lower: hasLower,
      number: hasNumber,
    };

    if (password.length < 6) {
      return { label: 'Weak', color: V1.coral, percent: 25, criteria };
    }
    if (password.length < 8) {
      return { label: 'Fair', color: V1.amber, percent: 50, criteria };
    }
    if (isStrong) {
      return { label: 'Strong', color: V1.green, percent: 100, criteria };
    }
    return { label: 'Good', color: V1.gold, percent: 75, criteria };
  }, [password]);

  // Animated strength bar width
  const strengthBarWidth = useSharedValue(0);

  useEffect(() => {
    strengthBarWidth.value = withTiming(passwordStrength.percent, {
      duration: reducedMotion ? 0 : ANIMATION.duration.normal,
    });
  }, [passwordStrength.percent, strengthBarWidth, reducedMotion]);

  const strengthBarAnimStyle = useAnimatedStyle(() => ({
    width: `${strengthBarWidth.value}%`,
  }));

  // Auto-dismiss error on input change
  const handleEmailChange = useCallback((text: string) => {
    setEmail(text);
    if (error) setError('');
  }, [error]);

  const handlePasswordChange = useCallback((text: string) => {
    setPassword(text);
    if (error) setError('');
  }, [error]);

  const handleNameChange = useCallback((text: string) => {
    setName(text);
    if (error) setError('');
  }, [error]);

  const triggerErrorShake = useCallback(() => {
    setShakeTrigger((prev) => prev + 1);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }, []);

  const handleSignup = useCallback(async () => {
    if (!email.trim()) {
      setError('Please enter your email.');
      triggerErrorShake();
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address.');
      triggerErrorShake();
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      triggerErrorShake();
      return;
    }

    setError('');
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const result = await signUp(
        email.trim(),
        password,
        name.trim() || undefined,
      );
      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace('/');
      } else {
        setError(result.error ?? 'Sign up failed. Please try again.');
        triggerErrorShake();
      }
    } catch (e: unknown) {
      setError(
        e instanceof Error ? e.message : 'Sign up failed. Please try again.',
      );
      triggerErrorShake();
    } finally {
      setLoading(false);
    }
  }, [name, email, password, signUp, triggerErrorShake]);

  const togglePassword = useCallback(() => {
    Haptics.selectionAsync();
    setShowPassword((v) => !v);
  }, []);

  const openTerms = useCallback(async () => {
    try {
      await WebBrowser.openBrowserAsync('https://declutterly.app/terms');
    } catch {
      // Fallback handled by expo-web-browser
    }
  }, []);

  const openPrivacy = useCallback(async () => {
    try {
      await WebBrowser.openBrowserAsync('https://declutterly.app/privacy');
    } catch {
      // Fallback handled by expo-web-browser
    }
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
              Create account
            </Text>
            <Text style={[styles.subtitle, { color: t.textSecondary }]}>
              Start your journey to a calmer space
            </Text>
          </Animated.View>

          {/* Full name input */}
          <Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(ANIMATION.stagger.normal).duration(ANIMATION.duration.normal)}>
            <AnimatedInput
              isDark={isDark}
              icon={<User size={18} color={iconColor} />}
              placeholder="Full name"
              value={name}
              onChangeText={handleNameChange}
              editable={!loading}
              autoCapitalize="words"
              autoComplete="name"
              textContentType="name"
              returnKeyType="next"
              onSubmitEditing={() => emailRef.current?.focus()}
              accessibilityLabel="Full name"
            />
          </Animated.View>

          {/* Email input */}
          <Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(ANIMATION.stagger.normal * 2).duration(ANIMATION.duration.normal)}>
            <AnimatedInput
              isDark={isDark}
              icon={<Mail size={18} color={iconColor} />}
              inputRef={emailRef}
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
          <Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(ANIMATION.stagger.normal * 3).duration(ANIMATION.duration.normal)}>
            <AnimatedInput
              isDark={isDark}
              icon={<Lock size={18} color={iconColor} />}
              inputRef={passwordRef}
              placeholder="Password"
              value={password}
              onChangeText={handlePasswordChange}
              editable={!loading}
              secureTextEntry={!showPassword}
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="done"
              onSubmitEditing={handleSignup}
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

          {/* Password strength bar + criteria */}
          {password.length > 0 && (
            <Animated.View
              entering={reducedMotion ? undefined : FadeIn.duration(250)}
              style={styles.strengthSection}
            >
              {/* Animated strength bar */}
              <View style={styles.strengthRow}>
                <View
                  style={[
                    styles.strengthTrack,
                    {
                      backgroundColor: isDark
                        ? 'rgba(255,255,255,0.06)'
                        : 'rgba(0,0,0,0.06)',
                    },
                  ]}
                >
                  <Animated.View
                    style={[
                      styles.strengthFill,
                      { backgroundColor: passwordStrength.color },
                      strengthBarAnimStyle,
                    ]}
                  />
                </View>
                <Text
                  style={[
                    styles.strengthHint,
                    { color: passwordStrength.color },
                  ]}
                >
                  {passwordStrength.label}
                </Text>
              </View>

              {/* Password criteria checklist */}
              <View style={styles.criteriaList}>
                <CriteriaItem
                  met={passwordStrength.criteria.length}
                  label="At least 8 characters"
                  isDark={isDark}
                />
                <CriteriaItem
                  met={passwordStrength.criteria.upper}
                  label="Uppercase letter"
                  isDark={isDark}
                />
                <CriteriaItem
                  met={passwordStrength.criteria.lower}
                  label="Lowercase letter"
                  isDark={isDark}
                />
                <CriteriaItem
                  met={passwordStrength.criteria.number}
                  label="Number"
                  isDark={isDark}
                />
              </View>
            </Animated.View>
          )}

          {/* Error */}
          {error ? (
            <ErrorBanner
              message={error}
              autoDismissMs={5000}
              onDismiss={() => setError('')}
              shakeTrigger={shakeTrigger}
            />
          ) : null}

          {/* Terms & Privacy - now opens in-app browser */}
          <Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(ANIMATION.stagger.normal * 4).duration(ANIMATION.duration.normal)}>
            <Text style={[styles.termsText, { color: t.textMuted }]}>
              By signing up, you agree to our{' '}
              <Text
                style={[styles.termsLink, { color: V1.coral }]}
                onPress={openTerms}
                accessibilityRole="link"
              >
                Terms of Service
              </Text>
              {' '}and{' '}
              <Text
                style={[styles.termsLink, { color: V1.coral }]}
                onPress={openPrivacy}
                accessibilityRole="link"
              >
                Privacy Policy
              </Text>
            </Text>
          </Animated.View>

          {/* Sign Up button */}
          <Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(ANIMATION.stagger.normal * 5).duration(ANIMATION.duration.normal)}>
            <CoralButton
              title="Sign Up"
              onPress={handleSignup}
              loading={loading}
              flat
              style={styles.signUpButton}
            />
          </Animated.View>

          {/* Sign In link */}
          <View style={{ flex: 1 }} />
          <Animated.View
            entering={reducedMotion ? undefined : FadeInDown.delay(ANIMATION.stagger.normal * 6).duration(ANIMATION.duration.normal)}
            style={styles.linkRow}
          >
            <Text style={[styles.linkText, { color: t.textMuted }]}>
              {'Already have an account? '}
            </Text>
            <Pressable
              onPress={() => {
                Haptics.selectionAsync();
                router.replace('/auth/login');
              }}
              hitSlop={8}
            >
              <Text style={[styles.linkTextBold, { color: V1.coral }]}>
                Sign In
              </Text>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

/** Individual criteria check item */
function CriteriaItem({
  met,
  label,
  isDark,
}: {
  met: boolean;
  label: string;
  isDark: boolean;
}) {
  const t = isDark ? V1.dark : V1.light;
  return (
    <View style={styles.criteriaRow}>
      {met ? (
        <Check size={12} color={V1.green} strokeWidth={3} />
      ) : (
        <X size={12} color={t.textMuted} strokeWidth={2} />
      )}
      <Text
        style={[
          styles.criteriaText,
          { color: met ? V1.green : t.textMuted },
        ]}
      >
        {label}
      </Text>
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

  // -- Password strength --
  strengthSection: {
    marginBottom: 16,
  },
  strengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  strengthTrack: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    borderRadius: 2,
  },
  strengthHint: {
    fontSize: 11,
    fontFamily: BODY_FONT,
    fontWeight: '600',
  },

  // -- Criteria checklist --
  criteriaList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: 4,
  },
  criteriaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: '45%',
  },
  criteriaText: {
    fontSize: 11,
    fontFamily: BODY_FONT,
  },

  // -- Terms --
  termsText: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: BODY_FONT,
  },
  termsLink: {
    fontWeight: '500',
  },

  // -- Button --
  signUpButton: {
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
