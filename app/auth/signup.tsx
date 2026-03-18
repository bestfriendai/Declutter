/**
 * Declutterly -- Sign Up Screen (V1)
 * Matches Pencil design: OVP4z
 */

import { useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { User, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
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

// ─── V1 Color Palette ────────────────────────────────────────────────────────
const V1 = {
  coral: '#FF6B6B',
  dark: {
    bg: '#0C0C0C',
    card: '#1A1A1A',
    border: 'rgba(255,255,255,0.08)',
    text: '#FFFFFF',
    textSecondary: 'rgba(255,255,255,0.5)',
    textMuted: 'rgba(255,255,255,0.3)',
    inputBg: '#141414',
    inputBorder: 'rgba(255,255,255,0.12)',
  },
  light: {
    bg: '#FAFAFA',
    card: '#F6F7F8',
    border: '#E5E7EB',
    text: '#1A1A1A',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',
    inputBg: '#FFFFFF',
    inputBorder: '#E5E7EB',
  },
};

export default function SignupScreen() {
  const rawScheme = useColorScheme();
  const isDark = rawScheme === 'dark';
  const t = isDark ? V1.dark : V1.light;
  const insets = useSafeAreaInsets();

  const { signUp } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const handleSignup = useCallback(async () => {
    if (!email.trim()) {
      setError('Please enter your email.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    setError('');
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const result = await signUp(
        email.trim(),
        password,
        name.trim() || undefined
      );
      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace('/');
      } else {
        setError(result.error ?? 'Sign up failed. Please try again.');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (e: unknown) {
      setError(
        e instanceof Error ? e.message : 'Sign up failed. Please try again.'
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  }, [name, email, password, signUp]);

  const togglePassword = useCallback(() => {
    Haptics.selectionAsync();
    setShowPassword((v) => !v);
  }, []);

  const placeholderColor = isDark ? 'rgba(255,255,255,0.3)' : '#9CA3AF';
  const iconColor = isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.3)';

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
            entering={FadeInDown.delay(0).duration(350)}
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
          <Animated.View entering={FadeInDown.delay(80).duration(350)}>
            <View
              style={[
                styles.inputField,
                {
                  backgroundColor: t.inputBg,
                  borderColor: t.inputBorder,
                },
              ]}
            >
              <User size={18} color={iconColor} />
              <TextInput
                style={[styles.inputText, { color: t.text }]}
                placeholder="Full name"
                placeholderTextColor={placeholderColor}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                autoComplete="name"
                textContentType="name"
                returnKeyType="next"
                onSubmitEditing={() => emailRef.current?.focus()}
                accessibilityLabel="Full name"
              />
            </View>
          </Animated.View>

          {/* Email input */}
          <Animated.View entering={FadeInDown.delay(120).duration(350)}>
            <View
              style={[
                styles.inputField,
                {
                  backgroundColor: t.inputBg,
                  borderColor: t.inputBorder,
                },
              ]}
            >
              <Mail size={18} color={iconColor} />
              <TextInput
                ref={emailRef}
                style={[styles.inputText, { color: t.text }]}
                placeholder="Email address"
                placeholderTextColor={placeholderColor}
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
          </Animated.View>

          {/* Password input */}
          <Animated.View entering={FadeInDown.delay(160).duration(350)}>
            <View
              style={[
                styles.inputField,
                {
                  backgroundColor: t.inputBg,
                  borderColor: t.inputBorder,
                },
              ]}
            >
              <Lock size={18} color={iconColor} />
              <TextInput
                ref={passwordRef}
                style={[styles.inputText, { color: t.text }]}
                placeholder="Password"
                placeholderTextColor={placeholderColor}
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
                hitSlop={12}
                style={styles.eyeButton}
              >
                {showPassword ? (
                  <EyeOff size={18} color={iconColor} />
                ) : (
                  <Eye size={18} color={iconColor} />
                )}
              </Pressable>
            </View>
          </Animated.View>

          {/* Password strength */}
          {password.length > 0 && password.length < 8 && (
            <Animated.View
              entering={FadeInDown.duration(250)}
              style={styles.strengthRow}
            >
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
                <View
                  style={[
                    styles.strengthFill,
                    {
                      width: `${Math.min(100, (password.length / 8) * 100)}%`,
                      backgroundColor:
                        password.length < 4
                          ? '#FF453A'
                          : password.length < 6
                            ? '#FFD60A'
                            : '#32D74B',
                    },
                  ]}
                />
              </View>
              <Text
                style={[
                  styles.strengthHint,
                  {
                    color:
                      password.length < 4
                        ? '#FF453A'
                        : password.length < 6
                          ? '#FFD60A'
                          : '#32D74B',
                  },
                ]}
              >
                {8 - password.length} more{' '}
                {8 - password.length === 1 ? 'character' : 'characters'}
              </Text>
            </Animated.View>
          )}

          {/* Error */}
          {error ? (
            <Animated.View
              entering={FadeInDown.duration(350)}
              style={styles.errorBanner}
            >
              <AlertCircle size={16} color="#FF453A" />
              <Text style={styles.errorText}>{error}</Text>
            </Animated.View>
          ) : null}

          {/* Sign Up button */}
          <Animated.View entering={FadeInDown.delay(200).duration(350)}>
            <Pressable
              onPress={handleSignup}
              disabled={loading}
              style={({ pressed }) => [
                styles.coralButton,
                { opacity: loading ? 0.7 : pressed ? 0.85 : 1 },
              ]}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.coralButtonText}>Sign Up</Text>
              )}
            </Pressable>
          </Animated.View>

          {/* Divider */}
          <Animated.View
            entering={FadeInDown.delay(240).duration(350)}
            style={styles.dividerRow}
          >
            <View
              style={[
                styles.dividerLine,
                {
                  backgroundColor: isDark
                    ? 'rgba(255,255,255,0.08)'
                    : '#E5E7EB',
                },
              ]}
            />
            <Text style={[styles.dividerText, { color: t.textMuted }]}>
              or
            </Text>
            <View
              style={[
                styles.dividerLine,
                {
                  backgroundColor: isDark
                    ? 'rgba(255,255,255,0.08)'
                    : '#E5E7EB',
                },
              ]}
            />
          </Animated.View>

          {/* Social buttons */}
          <Animated.View
            entering={FadeInDown.delay(280).duration(350)}
            style={styles.socialSection}
          >
            <Pressable
              style={[
                styles.socialButton,
                {
                  backgroundColor: t.inputBg,
                  borderColor: t.inputBorder,
                },
              ]}
            >
              <Text style={[styles.appleIcon, { color: t.text }]}>{'\uF8FF'}</Text>
              <Text style={[styles.socialButtonText, { color: t.text }]}>
                Continue with Apple
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.socialButton,
                {
                  backgroundColor: t.inputBg,
                  borderColor: t.inputBorder,
                },
              ]}
            >
              <Text style={[styles.googleIcon, { color: V1.coral }]}>G</Text>
              <Text style={[styles.socialButtonText, { color: t.text }]}>
                Continue with Google
              </Text>
            </Pressable>
          </Animated.View>

          {/* Sign In link */}
          <View style={{ flex: 1 }} />
          <Animated.View
            entering={FadeInDown.delay(320).duration(350)}
            style={styles.linkRow}
          >
            <Text style={[styles.linkText, { color: t.textMuted }]}>
              {'Already have an account? '}
            </Text>
            <Pressable
              onPress={() => {
                Haptics.selectionAsync();
                router.push('/auth/login');
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

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 24,
    flexGrow: 1,
  },

  // ── Header ──
  headerSection: {
    gap: 8,
    marginBottom: 32,
  },
  heading: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.6,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
  },

  // ── Inputs ──
  inputField: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 12,
  },
  inputText: {
    flex: 1,
    fontSize: 15,
  },
  eyeButton: {
    padding: 4,
    minWidth: 30,
    alignItems: 'center',
  },

  // ── Password strength ──
  strengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
    marginBottom: 12,
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
  },

  // ── Error ──
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,59,48,0.12)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 13,
    color: '#FF453A',
    flex: 1,
  },

  // ── Coral button ──
  coralButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 28,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  coralButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },

  // ── Divider ──
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 14,
  },

  // ── Social ──
  socialSection: {
    gap: 12,
    marginBottom: 24,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    gap: 10,
  },
  appleIcon: {
    fontSize: 18,
  },
  googleIcon: {
    fontSize: 18,
    fontWeight: '700',
  },
  socialButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },

  // ── Link row ──
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  linkText: {
    fontSize: 14,
  },
  linkTextBold: {
    fontSize: 14,
    fontWeight: '600',
  },
});
