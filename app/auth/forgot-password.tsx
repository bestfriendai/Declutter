/**
 * Declutterly -- Forgot Password Screen (V1)
 * Honest messaging: password reset coming soon, contact support for now.
 *
 * Improvements:
 * - Mascot illustration for visual warmth
 * - Copy animation with checkmark
 * - Visual hierarchy fix (Email Support primary, Copy Email secondary)
 */

import { useColorScheme } from '@/hooks/useColorScheme';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { ChevronLeft, Mail, Copy, CheckCircle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Clipboard from 'expo-clipboard';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { V1, BODY_FONT, DISPLAY_FONT, ANIMATION } from '@/constants/designTokens';
import { MascotAvatar, CoralButton } from '@/components/ui';

const SUPPORT_EMAIL = 'support@declutterly.app';

export default function ForgotPasswordScreen() {
  const rawScheme = useColorScheme();
  const isDark = rawScheme === 'dark';
  const reducedMotion = useReducedMotion();
  const t = isDark ? V1.dark : V1.light;
  const insets = useSafeAreaInsets();

  const [copied, setCopied] = useState(false);

  const handleCopyEmail = useCallback(async () => {
    try {
      await Clipboard.setStringAsync(SUPPORT_EMAIL);
      setCopied(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      Alert.alert('Copy failed', `Please email us at ${SUPPORT_EMAIL}`);
    }
  }, []);

  const handleOpenMail = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const subject = encodeURIComponent('Declutterly password reset help');
    const body = encodeURIComponent(
      'Hi Declutterly,\n\nI need help resetting my password.\n\nMy email: \n',
    );
    try {
      await Linking.openURL(
        `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`,
      );
    } catch {
      Alert.alert(
        'Could not open email',
        `Please email us directly at ${SUPPORT_EMAIL}`,
      );
    }
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

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
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ChevronLeft size={24} color={t.text} />
        </Pressable>

        {/* Mascot illustration */}
        <Animated.View
          entering={reducedMotion ? undefined : FadeInDown.delay(0).duration(ANIMATION.duration.entrance)}
          style={styles.mascotWrap}
        >
          <MascotAvatar imageKey="happy" size={80} showBackground />
        </Animated.View>

        {/* Header */}
        <Animated.View
          entering={reducedMotion ? undefined : FadeInDown.delay(100).duration(ANIMATION.duration.normal)}
          style={styles.headerSection}
        >
          <Text style={[styles.heading, { color: t.text }]}>
            Reset Password
          </Text>
          <Text style={[styles.subtitle, { color: t.textSecondary }]}>
            Password reset is coming soon. For now, please contact our support team and we'll help you regain access.
          </Text>
        </Animated.View>

        {/* Support email card */}
        <Animated.View
          entering={reducedMotion ? undefined : FadeInDown.delay(200).duration(ANIMATION.duration.normal)}
        >
          <View style={[styles.emailCard, { backgroundColor: t.card, borderColor: t.border }]}>
            <Mail size={20} color={V1.coral} />
            <Text style={[styles.emailText, { color: t.text }]}>
              {SUPPORT_EMAIL}
            </Text>
          </View>
        </Animated.View>

        {/* Action buttons - Email Support is now primary (coral), Copy is secondary */}
        <Animated.View
          entering={reducedMotion ? undefined : FadeInDown.delay(300).duration(ANIMATION.duration.normal)}
          style={styles.actionsSection}
        >
          {/* Email Support - PRIMARY */}
          <CoralButton
            title="Email Support"
            onPress={handleOpenMail}
            icon={<Mail size={18} color="#FFFFFF" />}
            flat
          />

          {/* Copy email button - SECONDARY */}
          <Pressable
            onPress={handleCopyEmail}
            style={({ pressed }) => [
              styles.outlineButton,
              { borderColor: t.border, opacity: pressed ? 0.7 : 1 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Copy support email address"
          >
            {copied ? (
              <Animated.View entering={FadeIn.duration(200)} style={styles.copiedRow}>
                <CheckCircle size={18} color={V1.green} />
                <Text style={[styles.outlineButtonText, { color: V1.green }]}>
                  Copied!
                </Text>
              </Animated.View>
            ) : (
              <View style={styles.copiedRow}>
                <Copy size={18} color={t.textSecondary} />
                <Text style={[styles.outlineButtonText, { color: t.text }]}>
                  Copy Email
                </Text>
              </View>
            )}
          </Pressable>
        </Animated.View>

        {/* Back to Sign In */}
        <Pressable
          onPress={() => {
            Haptics.selectionAsync();
            router.back();
          }}
          style={styles.backLink}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Back to sign in"
        >
          <Text style={[styles.backLinkText, { color: V1.coral }]}>
            Back to Sign In
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },

  // -- Back --
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginBottom: 16,
  },

  // -- Mascot --
  mascotWrap: {
    alignSelf: 'center',
    marginBottom: 20,
  },

  // -- Header --
  headerSection: {
    gap: 10,
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

  // -- Email card --
  emailCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 24,
  },
  emailText: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    fontFamily: BODY_FONT,
  },

  // -- Actions --
  actionsSection: {
    gap: 12,
    marginBottom: 24,
  },
  outlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
  },
  outlineButtonText: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: BODY_FONT,
  },
  copiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  // -- Back link --
  backLink: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  backLinkText: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: BODY_FONT,
  },
});
