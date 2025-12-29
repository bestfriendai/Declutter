/**
 * Forgot Password Screen
 * Send password reset email
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
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
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

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { resetPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleResetPassword = useCallback(async () => {
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }
    if (!email.includes('@')) {
      setError('Please enter a valid email');
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
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(result.error || 'Failed to send reset email');
    }
  }, [email, resetPassword]);

  if (success) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <LinearGradient
          colors={isDark
            ? ['#1a1a2e', '#16213e', '#0f0f23']
            : ['#f8f9ff', '#e8ecff', '#f0f4ff']
          }
          style={StyleSheet.absoluteFill}
        />

        <View style={[styles.content, { paddingTop: insets.top + 80 }]}>
          <Animated.View
            entering={FadeInDown.springify()}
            style={styles.successContainer}
          >
            <View style={[styles.successIcon, { backgroundColor: colors.success + '20' }]}>
              <Ionicons name="mail-open" size={48} color={colors.success} />
            </View>
            <Text style={[styles.successTitle, { color: colors.text }]}>
              Check Your Email
            </Text>
            <Text style={[styles.successText, { color: colors.textSecondary }]}>
              We've sent password reset instructions to{'\n'}
              <Text style={{ fontWeight: '600', color: colors.text }}>{email}</Text>
            </Text>
            <GlassButton
              title="Back to Sign In"
              onPress={() => router.replace('/auth/login')}
              style={styles.backButton}
              variant="secondary"
            />
          </Animated.View>
        </View>
      </View>
    );
  }

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
        <View style={[styles.content, { paddingTop: insets.top + 20 }]}>
          {/* Back Button */}
          <Animated.View entering={FadeInDown.delay(50).springify()}>
            <TouchableOpacity
              style={styles.headerBackButton}
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
            <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
              <Ionicons name="key" size={40} color={colors.primary} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>
              Forgot Password?
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              No worries! Enter your email and we'll send you instructions to reset your password.
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
                style={[styles.errorContainer, { backgroundColor: colors.error + '20' }]}
              >
                <Ionicons name="alert-circle" size={20} color={colors.error} />
                <Text style={[styles.errorText, { color: colors.error }]}>
                  {error}
                </Text>
                <TouchableOpacity onPress={() => setError(null)}>
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
                placeholder="Enter your email"
                placeholderTextColor={colors.textTertiary}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                returnKeyType="done"
                onSubmitEditing={handleResetPassword}
              />
            </BlurView>

            {/* Reset Button */}
            <GlassButton
              title={isLoading ? 'Sending...' : 'Send Reset Link'}
              onPress={handleResetPassword}
              disabled={isLoading}
              style={styles.resetButton}
              variant="primary"
              size="large"
              icon={isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="send" size={20} color="#fff" />
              )}
            />
          </Animated.View>

          {/* Back to Login */}
          <Animated.View
            entering={FadeInUp.delay(300).springify()}
            style={styles.footer}
          >
            <TouchableOpacity
              style={styles.backToLoginButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={16} color={colors.primary} />
              <Text style={[styles.backToLoginText, { color: colors.primary }]}>
                Back to Sign In
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  headerBackButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
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
  resetButton: {
    marginTop: 8,
  },
  footer: {
    alignItems: 'center',
    marginTop: 32,
  },
  backToLoginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  backToLoginText: {
    fontSize: 16,
    fontWeight: '600',
  },
  successContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  successIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
  },
  successText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  backButton: {
    minWidth: 200,
  },
});
