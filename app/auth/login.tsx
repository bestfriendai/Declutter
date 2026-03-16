/**
 * Declutterly — Sign In Screen
 * Matches Pencil designs: 3EIk2 (dark) and Ndqsi (light) pixel-perfectly.
 *
 * "Welcome back" heading, email/password inputs with icons,
 * forgot password link, Sign In button, or divider, Apple/Google social buttons,
 * "Don't have an account? Sign Up" link.
 */

import { useAuth } from '@/context/AuthContext';
import { AmbientBackdrop } from '@/components/ui/AmbientBackdrop';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
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

const BODY_FONT = 'DM Sans';
const DISPLAY_FONT = 'Bricolage Grotesque';

export default function LoginScreen() {
  const rawScheme = useColorScheme();
  const colorScheme = rawScheme === 'dark' ? 'dark' : 'light';
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  const { signIn, continueAsGuest } = useAuth();

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
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace('/');
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
    setShowPassword((v) => !v);
  }, []);

  const handleContinueAsGuest = useCallback(async () => {
    setError('');
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const result = await continueAsGuest();
      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace('/');
      } else {
        setError(result.error ?? 'Could not continue as guest.');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (e: any) {
      setError(e?.message ?? 'Could not continue as guest.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  }, [continueAsGuest]);

  // Design color tokens
  const inputBg = isDark ? '#141414' : '#FFFFFF';
  const inputBorder = isDark ? '#333333' : '#D0D0D0';
  const placeholderColor = '#707070';
  const iconColor = 'rgba(112,112,112,0.5)';
  const headingColor = isDark ? '#FFFFFF' : '#1A1A1A';
  const subtitleColor = isDark ? '#888888' : '#666666';
  const forgotColor = isDark ? '#707070' : '#888888';
  const dividerLineColor = isDark ? '#1A1A1A' : '#E0E0E0';
  const dividerTextColor = isDark ? '#555555' : '#707070';
  const socialBg = isDark ? '#141414' : '#FFFFFF';
  const socialBorder = isDark ? '#333333' : '#D0D0D0';
  const socialTextColor = isDark ? '#FFFFFF' : '#1A1A1A';
  const linkColor = isDark ? '#707070' : '#888888';

  return (
    <View style={styles.container} accessibilityLabel="Sign in screen">
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <AmbientBackdrop isDark={isDark} variant="auth" />

      {/* Background */}
      <LinearGradient
        colors={
          isDark
            ? ['rgba(12,12,15,0.52)', 'rgba(18,18,22,0.80)', 'rgba(18,18,22,0.96)']
            : ['rgba(250,244,236,0.46)', 'rgba(247,242,235,0.78)', 'rgba(245,240,234,0.96)']
        }
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />
      {/* Base fill behind gradient */}
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: isDark ? '#111115' : '#F7F1EA', zIndex: -1 },
        ]}
      />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: insets.top + 56,
              paddingBottom: Math.max(insets.bottom, 24) + 24,
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
            <View style={styles.headerPillRow}>
              <LinearGradient
                colors={isDark ? ['#FFDCA8', '#FFB547', '#FF8C63'] : ['#FFD49C', '#FFB547', '#FF9B6E']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.headerPill}
              >
                <Text style={styles.headerPillText}>WELCOME BACK</Text>
              </LinearGradient>
              <View
                style={[
                  styles.headerMetaChip,
                  {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.72)',
                    borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(55,40,26,0.08)',
                  },
                ]}
              >
                <Ionicons
                  name="log-in-outline"
                  size={14}
                  color={isDark ? '#FEE9C8' : '#75532A'}
                />
                <Text style={[styles.headerMetaText, { color: isDark ? '#DFD4C8' : '#6B5A49' }]}>
                  pick up your reset
                </Text>
              </View>
            </View>
            <Text style={[styles.heading, { color: headingColor }]}>
              Welcome back
            </Text>
            <Text style={[styles.subtitle, { color: subtitleColor }]}>
              Drop back into your calmer rhythm without rebuilding momentum from scratch.
            </Text>
          </Animated.View>

          {/* Form */}
          <Animated.View
            entering={FadeInDown.delay(80).duration(350)}
            style={[
              styles.formSection,
              {
                backgroundColor: isDark ? 'rgba(23,23,29,0.88)' : 'rgba(255,255,255,0.84)',
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(55,40,26,0.08)',
              },
            ]}
          >
            <LinearGradient
              colors={[
                isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.78)',
                'rgba(255,255,255,0)',
              ]}
              start={{ x: 0.2, y: 0 }}
              end={{ x: 0.8, y: 1 }}
              style={styles.formSheen}
            />
            <View style={styles.formHeader}>
              <Text style={[styles.formEyebrow, { color: isDark ? '#FFE5C1' : '#7B5627' }]}>
                ACCOUNT ACCESS
              </Text>
              <Text style={[styles.formTitle, { color: headingColor }]}>Your progress is waiting.</Text>
            </View>
            {/* Email input */}
            <View
              style={[
                styles.inputField,
                {
                  backgroundColor: isDark ? '#101014' : '#FFFDFC',
                  borderColor: inputBorder,
                },
              ]}
            >
              <Ionicons
                name="mail-outline"
                size={18}
                color={iconColor}
              />
              <TextInput
                style={[styles.inputText, { color: headingColor }]}
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

            {/* Password input */}
            <View
              style={[
                styles.inputField,
                {
                  backgroundColor: isDark ? '#101014' : '#FFFDFC',
                  borderColor: inputBorder,
                },
              ]}
            >
              <Ionicons
                name="lock-closed-outline"
                size={18}
                color={iconColor}
              />
              <TextInput
                ref={passwordRef}
                style={[styles.inputText, { color: headingColor }]}
                placeholder="Password"
                placeholderTextColor={placeholderColor}
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
                accessibilityLabel={
                  showPassword ? 'Hide password' : 'Show password'
                }
                hitSlop={12}
                style={styles.eyeButton}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={iconColor}
                />
              </Pressable>
            </View>
          </Animated.View>

          {/* Forgot password */}
          <Animated.View entering={FadeInDown.delay(100).duration(350)}>
            <Pressable
              onPress={() => {
                Haptics.selectionAsync();
                if (email.trim()) {
                  Alert.alert(
                    'Reset Password',
                    `We'll send a password reset link to ${email.trim()}.`,
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Email Support',
                        onPress: async () => {
                          const subject = encodeURIComponent('Declutterly password reset help');
                          const body = encodeURIComponent(
                            `Hi Declutterly,\n\nI need help resetting the password for:\n${email.trim()}\n`
                          );
                          try {
                            await Linking.openURL(
                              `mailto:support@declutterly.app?subject=${subject}&body=${body}`
                            );
                          } catch {
                            Alert.alert(
                              'Contact support',
                              'Please email support@declutterly.app for password reset help.'
                            );
                          }
                        },
                      },
                    ]
                  );
                } else {
                  Alert.alert(
                    'Enter Your Email',
                    'Please enter your email address first, then tap "Forgot password?".'
                  );
                }
              }}
              accessibilityRole="link"
              accessibilityLabel="Forgot password"
              style={styles.forgotPasswordRow}
            >
              <Text style={[styles.forgotPasswordText, { color: forgotColor }]}>
                Forgot password?
              </Text>
            </Pressable>
          </Animated.View>

          {/* Error -- ADHD-friendly: clear, non-blaming, with action */}
          {error ? (
            <Animated.View
              entering={FadeInDown.duration(350)}
              style={styles.errorBanner}
              accessibilityRole="alert"
              accessibilityLiveRegion="assertive"
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="alert-circle-outline" size={16} color="#FF453A" />
                <Text style={[styles.errorText, { flex: 1 }]}>{error}</Text>
              </View>
            </Animated.View>
          ) : null}

          {/* Sign In button */}
          <Animated.View entering={FadeInDown.delay(160).duration(350)}>
            <Pressable
              onPress={handleLogin}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="Sign in"
              accessibilityState={{ disabled: loading, busy: loading }}
              style={({ pressed }) => [
                styles.primaryButton,
                {
                  opacity: loading ? 0.7 : pressed ? 0.85 : 1,
                },
              ]}
            >
              <LinearGradient
                colors={isDark ? ['#FFD9A1', '#FFB547', '#FF8C63'] : ['#FFD399', '#FFB547', '#FF976C']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.primaryButtonFill}
              >
                {loading ? (
                  <ActivityIndicator
                    color="#111115"
                    accessibilityLabel="Signing in"
                  />
                ) : (
                  <>
                    <Text style={styles.primaryButtonText}>Sign In</Text>
                    <Text style={styles.primaryButtonHint}>Resume streaks, rooms, and guided resets.</Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>
          </Animated.View>

          {/* Divider */}
          <Animated.View
            entering={FadeInDown.delay(200).duration(350)}
            style={styles.dividerRow}
          >
            <View
              style={[styles.dividerLine, { backgroundColor: dividerLineColor }]}
            />
            <Text style={[styles.dividerText, { color: dividerTextColor }]}>
              or
            </Text>
            <View
              style={[styles.dividerLine, { backgroundColor: dividerLineColor }]}
            />
          </Animated.View>

          {/* Alternate entry buttons */}
          <Animated.View
            entering={FadeInDown.delay(240).duration(350)}
            style={styles.socialSection}
          >
            {/* Continue as Guest */}
            <Pressable
              onPress={handleContinueAsGuest}
              accessibilityRole="button"
              accessibilityLabel="Continue as guest - try the app without an account"
              style={({ pressed }) => [
                styles.socialButton,
                {
                  backgroundColor: socialBg,
                  borderColor: socialBorder,
                  opacity: pressed || loading ? 0.7 : 1,
                },
              ]}
              disabled={loading}
            >
              <Ionicons
                name="person-outline"
                size={16}
                color={isDark ? 'rgba(128,128,128,0.5)' : '#1A1A1A'}
              />
              <View style={{ alignItems: 'center' }}>
                <Text
                  style={[styles.socialButtonText, { color: socialTextColor }]}
                >
                  Just let me try it first
                </Text>
              </View>
            </Pressable>

            {/* Create account */}
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/auth/signup');
              }}
              accessibilityRole="button"
              accessibilityLabel="Create account"
              style={({ pressed }) => [
                styles.socialButton,
                {
                  backgroundColor: socialBg,
                  borderColor: socialBorder,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Text
                style={[styles.socialButtonText, { color: socialTextColor }]}
              >
                Create Account
              </Text>
            </Pressable>
          </Animated.View>

          {/* Sign Up link */}
          <Animated.View
            entering={FadeInDown.delay(280).duration(350)}
            style={styles.linkRow}
          >
            <Text style={[styles.linkText, { color: linkColor }]}>
              {"Don\u2019t have an account? "}
            </Text>
            <Pressable
              onPress={() => {
                Haptics.selectionAsync();
                router.push('/auth/signup');
              }}
              accessibilityRole="link"
              accessibilityLabel="Sign Up"
              hitSlop={8}
            >
              <Text
                style={[
                  styles.linkText,
                  styles.linkTextBold,
                  { color: linkColor },
                ]}
              >
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
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 28,
    flexGrow: 1,
  },

  // Header
  headerSection: {
    gap: 10,
    marginBottom: 24,
  },
  headerPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerPill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  headerPillText: {
    fontFamily: BODY_FONT,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
    color: '#17120B',
  },
  headerMetaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  headerMetaText: {
    fontFamily: BODY_FONT,
    fontSize: 11,
    fontWeight: '600',
  },
  heading: {
    fontFamily: DISPLAY_FONT,
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: -0.6,
  },
  subtitle: {
    fontFamily: BODY_FONT,
    fontSize: 15,
    lineHeight: 22,
  },

  // Form
  formSection: {
    position: 'relative',
    overflow: 'hidden',
    gap: 12,
    marginBottom: 0,
    borderRadius: 30,
    borderWidth: 1,
    padding: 18,
  },
  formSheen: {
    ...StyleSheet.absoluteFillObject,
  },
  formHeader: {
    gap: 6,
    marginBottom: 6,
  },
  formEyebrow: {
    fontFamily: BODY_FONT,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  formTitle: {
    fontFamily: DISPLAY_FONT,
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  inputField: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    gap: 12,
  },
  inputText: {
    flex: 1,
    fontFamily: BODY_FONT,
    fontSize: 15,
  },
  eyeButton: {
    padding: 4,
    minWidth: 30,
    alignItems: 'center',
  },

  // Forgot password
  forgotPasswordRow: {
    alignItems: 'flex-end',
    paddingVertical: 12,
    marginBottom: 16,
  },
  forgotPasswordText: {
    fontFamily: BODY_FONT,
    fontSize: 13,
  },

  // Error
  errorBanner: {
    backgroundColor: 'rgba(255,59,48,0.12)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  errorText: {
    fontFamily: BODY_FONT,
    fontSize: 13,
    color: '#FF453A',
  },

  // Primary button
  primaryButton: {
    minHeight: 60,
    borderRadius: 24,
    marginBottom: 28,
    overflow: 'hidden',
  },
  primaryButtonFill: {
    minHeight: 60,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  primaryButtonText: {
    fontFamily: BODY_FONT,
    fontSize: 17,
    fontWeight: '800',
    color: '#111115',
  },
  primaryButtonHint: {
    marginTop: 2,
    fontFamily: BODY_FONT,
    fontSize: 12,
    color: 'rgba(17,17,21,0.68)',
  },

  // Divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 28,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontFamily: BODY_FONT,
    fontSize: 13,
  },

  // Social buttons
  socialSection: {
    gap: 12,
    marginBottom: 28,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    gap: 8,
  },
  socialButtonText: {
    fontFamily: BODY_FONT,
    fontSize: 15,
    fontWeight: '600',
  },

  // Link row
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 44,
  },
  linkText: {
    fontFamily: BODY_FONT,
    fontSize: 13,
  },
  linkTextBold: {
    fontWeight: '600',
  },
});
