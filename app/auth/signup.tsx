/**
 * Signup Screen
 * Create new account with email/password
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useRouter, Link } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/theme/ThemeProvider';
import { GlassButton } from '@/components/ui/GlassButton';

export default function SignupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { signUp, signInWithApple, isLoading, clearError } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const validateForm = useCallback(() => {
    if (!name.trim()) {
      setLocalError('Please enter your name');
      return false;
    }
    if (!email.trim()) {
      setLocalError('Please enter your email');
      return false;
    }
    if (!email.includes('@')) {
      setLocalError('Please enter a valid email');
      return false;
    }
    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters');
      return false;
    }
    if (password !== confirmPassword) {
      setLocalError('Passwords do not match');
      return false;
    }
    return true;
  }, [name, email, password, confirmPassword]);

  const handleSignUp = useCallback(async () => {
    if (!validateForm()) return;

    setLocalError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const result = await signUp(email.trim(), password, name.trim());

    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/onboarding');
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setLocalError(result.error || 'Sign up failed');
    }
  }, [validateForm, email, password, name, signUp, router]);

  const handleAppleSignIn = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const result = await signInWithApple();

    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/onboarding');
    } else if (result.error !== 'Sign-in cancelled') {
      setLocalError(result.error || 'Apple sign in failed');
    }
  }, [signInWithApple, router]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={isDark
          ? ['#1a1a2e', '#16213e', '#0f0f23']
          : ['#f8f9ff', '#e8ecff', '#f0f4ff']
        }
        style={StyleSheet.absoluteFill}
      />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back Button */}
          <Animated.View entering={FadeInDown.delay(50).springify()}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
          </Animated.View>

          {/* Header */}
          <Animated.View
            entering={FadeInDown.delay(100).springify()}
            style={styles.header}
          >
            <Text style={[styles.logo, { color: colors.primary }]}>🌟</Text>
            <Text style={[styles.title, { color: colors.text }]}>
              Create Account
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Start your decluttering journey
            </Text>
          </Animated.View>

          {/* Form */}
          <Animated.View
            entering={FadeInDown.delay(200).springify()}
            style={styles.form}
          >
            {/* Error */}
            {localError && (
              <Animated.View
                entering={FadeInDown.springify()}
                style={[styles.errorContainer, { backgroundColor: colors.error + '20' }]}
              >
                <Ionicons name="alert-circle" size={20} color={colors.error} />
                <Text style={[styles.errorText, { color: colors.error }]}>
                  {localError}
                </Text>
                <TouchableOpacity onPress={() => setLocalError(null)}>
                  <Ionicons name="close" size={20} color={colors.error} />
                </TouchableOpacity>
              </Animated.View>
            )}

            {/* Name Input */}
            <BlurView
              intensity={isDark ? 20 : 40}
              tint={isDark ? 'dark' : 'light'}
              style={[styles.inputContainer, { borderColor: colors.border }]}
            >
              <Ionicons
                name="person-outline"
                size={20}
                color={colors.textSecondary}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Your name"
                placeholderTextColor={colors.textTertiary}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                autoComplete="name"
                returnKeyType="next"
              />
            </BlurView>

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
              />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Email"
                placeholderTextColor={colors.textTertiary}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                returnKeyType="next"
              />
            </BlurView>

            {/* Password Input */}
            <BlurView
              intensity={isDark ? 20 : 40}
              tint={isDark ? 'dark' : 'light'}
              style={[styles.inputContainer, { borderColor: colors.border }]}
            >
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={colors.textSecondary}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Password (min 6 characters)"
                placeholderTextColor={colors.textTertiary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                returnKeyType="next"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                <Ionicons
                  name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </BlurView>

            {/* Confirm Password Input */}
            <BlurView
              intensity={isDark ? 20 : 40}
              tint={isDark ? 'dark' : 'light'}
              style={[styles.inputContainer, { borderColor: colors.border }]}
            >
              <Ionicons
                name="shield-checkmark-outline"
                size={20}
                color={colors.textSecondary}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Confirm password"
                placeholderTextColor={colors.textTertiary}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                returnKeyType="done"
                onSubmitEditing={handleSignUp}
              />
            </BlurView>

            {/* Sign Up Button */}
            <GlassButton
              title={isLoading ? 'Creating account...' : 'Create Account'}
              onPress={handleSignUp}
              disabled={isLoading}
              style={styles.signUpButton}
              variant="primary"
              size="large"
              icon={isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : undefined}
            />

            {/* Terms */}
            <Text style={[styles.terms, { color: colors.textTertiary }]}>
              By signing up, you agree to our{' '}
              <Text style={{ color: colors.primary }}>Terms of Service</Text>
              {' '}and{' '}
              <Text style={{ color: colors.primary }}>Privacy Policy</Text>
            </Text>
          </Animated.View>

          {/* Divider */}
          <Animated.View
            entering={FadeInDown.delay(300).springify()}
            style={styles.divider}
          >
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.textSecondary }]}>
              or
            </Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </Animated.View>

          {/* Apple Sign In */}
          {Platform.OS === 'ios' && (
            <Animated.View entering={FadeInDown.delay(400).springify()}>
              <TouchableOpacity
                style={[
                  styles.appleButton,
                  { backgroundColor: isDark ? '#fff' : '#000' },
                ]}
                onPress={handleAppleSignIn}
                disabled={isLoading}
              >
                <Ionicons
                  name="logo-apple"
                  size={24}
                  color={isDark ? '#000' : '#fff'}
                />
                <Text
                  style={[
                    styles.appleButtonText,
                    { color: isDark ? '#000' : '#fff' },
                  ]}
                >
                  Sign up with Apple
                </Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* Sign In Link */}
          <Animated.View
            entering={FadeInUp.delay(500).springify()}
            style={styles.footer}
          >
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              Already have an account?{' '}
            </Text>
            <Link href="/auth/login" asChild>
              <TouchableOpacity>
                <Text style={[styles.footerLink, { color: colors.primary }]}>
                  Sign In
                </Text>
              </TouchableOpacity>
            </Link>
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 8,
  },
  logo: {
    fontSize: 56,
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  form: {
    gap: 14,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  inputIcon: {
    paddingLeft: 16,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  eyeButton: {
    padding: 12,
  },
  signUpButton: {
    marginTop: 8,
  },
  terms: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 14,
  },
  appleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  appleButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 16,
  },
  footerLink: {
    fontSize: 16,
    fontWeight: '600',
  },
});
