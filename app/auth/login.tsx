/**
 * Login Screen
 * Sign in with email/password or Apple
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
  Alert,
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

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, glass, isDark } = useTheme();
  const { signIn, signInWithApple, continueAsGuest, isLoading, error, clearError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSignIn = useCallback(async () => {
    if (!email.trim()) {
      setLocalError('Please enter your email');
      return;
    }
    if (!password) {
      setLocalError('Please enter your password');
      return;
    }

    setLocalError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const result = await signIn(email.trim(), password);

    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)');
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setLocalError(result.error || 'Sign in failed');
    }
  }, [email, password, signIn, router]);

  const handleAppleSignIn = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const result = await signInWithApple();

    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)');
    } else if (result.error !== 'Sign-in cancelled') {
      setLocalError(result.error || 'Apple sign in failed');
    }
  }, [signInWithApple, router]);

  const handleGuestMode = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    Alert.alert(
      'Continue as Guest?',
      'Your progress will be saved locally but won\'t sync across devices. You can create an account later.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: async () => {
            const result = await continueAsGuest();
            if (result.success) {
              router.replace('/(tabs)');
            }
          },
        },
      ]
    );
  }, [continueAsGuest, router]);

  const displayError = localError || error;

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
            { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 20 },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <Animated.View
            entering={FadeInDown.delay(100).springify()}
            style={styles.header}
          >
            <Text style={[styles.logo, { color: colors.primary }]}>✨</Text>
            <Text style={[styles.title, { color: colors.text }]}>
              Welcome Back
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Sign in to continue decluttering
            </Text>
          </Animated.View>

          {/* Form */}
          <Animated.View
            entering={FadeInDown.delay(200).springify()}
            style={styles.form}
          >
            {/* Error */}
            {displayError && (
              <Animated.View
                entering={FadeInDown.springify()}
                style={[styles.errorContainer, { backgroundColor: colors.error + '20' }]}
              >
                <Ionicons name="alert-circle" size={20} color={colors.error} />
                <Text style={[styles.errorText, { color: colors.error }]}>
                  {displayError}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setLocalError(null);
                    clearError();
                  }}
                >
                  <Ionicons name="close" size={20} color={colors.error} />
                </TouchableOpacity>
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
                placeholder="Password"
                placeholderTextColor={colors.textTertiary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoComplete="password"
                returnKeyType="done"
                onSubmitEditing={handleSignIn}
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

            {/* Forgot Password */}
            <Link href="/auth/forgot-password" asChild>
              <TouchableOpacity style={styles.forgotButton}>
                <Text style={[styles.forgotText, { color: colors.primary }]}>
                  Forgot password?
                </Text>
              </TouchableOpacity>
            </Link>

            {/* Sign In Button */}
            <GlassButton
              title={isLoading ? 'Signing in...' : 'Sign In'}
              onPress={handleSignIn}
              disabled={isLoading}
              style={styles.signInButton}
              variant="primary"
              size="large"
              icon={isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : undefined}
            />
          </Animated.View>

          {/* Divider */}
          <Animated.View
            entering={FadeInDown.delay(300).springify()}
            style={styles.divider}
          >
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.textSecondary }]}>
              or continue with
            </Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </Animated.View>

          {/* Social Sign In */}
          <Animated.View
            entering={FadeInDown.delay(400).springify()}
            style={styles.socialButtons}
          >
            {Platform.OS === 'ios' && (
              <TouchableOpacity
                style={[
                  styles.socialButton,
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
                    styles.socialButtonText,
                    { color: isDark ? '#000' : '#fff' },
                  ]}
                >
                  Sign in with Apple
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.guestButton, { borderColor: colors.border }]}
              onPress={handleGuestMode}
              disabled={isLoading}
            >
              <Ionicons name="person-outline" size={20} color={colors.textSecondary} />
              <Text style={[styles.guestButtonText, { color: colors.textSecondary }]}>
                Continue as Guest
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Sign Up Link */}
          <Animated.View
            entering={FadeInUp.delay(500).springify()}
            style={styles.footer}
          >
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              Don't have an account?{' '}
            </Text>
            <Link href="/auth/signup" asChild>
              <TouchableOpacity>
                <Text style={[styles.footerLink, { color: colors.primary }]}>
                  Sign Up
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
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  form: {
    gap: 16,
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
  forgotButton: {
    alignSelf: 'flex-end',
  },
  forgotText: {
    fontSize: 14,
    fontWeight: '600',
  },
  signInButton: {
    marginTop: 8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 32,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 14,
  },
  socialButtons: {
    gap: 12,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  guestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
  },
  guestButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
  },
  footerText: {
    fontSize: 16,
  },
  footerLink: {
    fontSize: 16,
    fontWeight: '600',
  },
});
