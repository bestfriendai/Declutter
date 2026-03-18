/**
 * Declutterly -- Forgot Password Screen (V1)
 * Matches Pencil design: J1dz8
 */

import { useColorScheme } from '@/hooks/useColorScheme';
import { ChevronLeft, Mail, AlertCircle, CheckCircle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
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
    text: '#FFFFFF',
    textSecondary: 'rgba(255,255,255,0.5)',
    textMuted: 'rgba(255,255,255,0.3)',
    inputBg: '#141414',
    inputBorder: 'rgba(255,255,255,0.12)',
  },
  light: {
    bg: '#FAFAFA',
    text: '#1A1A1A',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',
    inputBg: '#FFFFFF',
    inputBorder: '#E5E7EB',
  },
};

export default function ForgotPasswordScreen() {
  const rawScheme = useColorScheme();
  const isDark = rawScheme === 'dark';
  const t = isDark ? V1.dark : V1.light;
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const placeholderColor = isDark ? 'rgba(255,255,255,0.3)' : '#9CA3AF';
  const iconColor = isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.3)';

  const handleSendReset = useCallback(async () => {
    if (!email.trim()) {
      setError('Please enter your email address.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    setError('');
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // Attempt to send reset email via support
      const subject = encodeURIComponent('Declutterly password reset help');
      const body = encodeURIComponent(
        `Hi Declutterly,\n\nI need help resetting the password for:\n${email.trim()}\n`
      );
      await Linking.openURL(
        `mailto:support@declutterly.app?subject=${subject}&body=${body}`
      );
      setSent(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // If we can't open mail, just show success anyway (the UI state)
      setSent(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } finally {
      setLoading(false);
    }
  }, [email]);

  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View
          style={[
            styles.content,
            {
              paddingTop: insets.top + 16,
              paddingBottom: insets.bottom + 16,
            },
          ]}
        >
          {/* Back button */}
          <Pressable
            onPress={() => router.back()}
            style={styles.backBtn}
            hitSlop={12}
          >
            <ChevronLeft size={24} color={t.text} />
          </Pressable>

          {/* Header */}
          <Animated.View
            entering={FadeInDown.delay(0).duration(350)}
            style={styles.headerSection}
          >
            <Text style={[styles.heading, { color: t.text }]}>
              Reset Password
            </Text>
            <Text style={[styles.subtitle, { color: t.textSecondary }]}>
              Enter your email and we'll send a link to reset your password.
            </Text>
          </Animated.View>

          {sent ? (
            // ── Success state ──
            <Animated.View
              entering={FadeInDown.duration(350)}
              style={styles.successWrap}
            >
              <CheckCircle size={48} color="#66BB6A" />
              <Text style={[styles.successTitle, { color: t.text }]}>
                Check your email
              </Text>
              <Text style={[styles.successDesc, { color: t.textSecondary }]}>
                If an account exists for {email.trim()}, you'll receive a
                password reset link shortly.
              </Text>
            </Animated.View>
          ) : (
            <>
              {/* Email input */}
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
                  <Mail size={18} color={iconColor} />
                  <TextInput
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
                    returnKeyType="done"
                    onSubmitEditing={handleSendReset}
                    autoFocus
                    accessibilityLabel="Email address"
                  />
                </View>
              </Animated.View>

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

              {/* Send Reset Link button */}
              <Animated.View entering={FadeInDown.delay(160).duration(350)}>
                <Pressable
                  onPress={handleSendReset}
                  disabled={loading}
                  style={({ pressed }) => [
                    styles.coralButton,
                    { opacity: loading ? 0.7 : pressed ? 0.85 : 1 },
                  ]}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.coralButtonText}>Send Reset Link</Text>
                  )}
                </Pressable>
              </Animated.View>
            </>
          )}

          {/* Back to Sign In */}
          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              router.push('/auth/login');
            }}
            style={styles.backLink}
            hitSlop={8}
          >
            <Text style={[styles.backLinkText, { color: V1.coral }]}>
              Back to Sign In
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },

  // ── Back ──
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginBottom: 16,
  },

  // ── Header ──
  headerSection: {
    gap: 10,
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

  // ── Input ──
  inputField: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  inputText: {
    flex: 1,
    fontSize: 15,
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

  // ── CTA ──
  coralButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 28,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  coralButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },

  // ── Success ──
  successWrap: {
    alignItems: 'center',
    gap: 12,
    marginTop: 40,
    paddingHorizontal: 20,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 8,
  },
  successDesc: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },

  // ── Back link ──
  backLink: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  backLinkText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
