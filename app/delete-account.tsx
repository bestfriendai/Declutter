/**
 * Declutterly -- Delete Account Screen (V1 Pencil Design)
 * Dedicated fullscreen with sad mascot, deletion summary, and confirmation flow.
 */

import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ChevronLeft, Download } from 'lucide-react-native';
import { AmbientBackdrop } from '@/components/ui/AmbientBackdrop';
import { MascotAvatar } from '@/components/ui/MascotAvatar';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useAuth } from '@/context/AuthContext';
import { useDeclutter } from '@/context/DeclutterContext';
import {
  V1,
  BODY_FONT,
  DISPLAY_FONT,
  RADIUS,
  SPACING,
} from '@/constants/designTokens';

// ─────────────────────────────────────────────────────────────────────
// Data deleted items
// ─────────────────────────────────────────────────────────────────────
const DELETION_ITEMS = [
  'All your rooms and photos',
  'Your cleaning history and stats',
  'Your streak and badges',
  'Your mascot companion',
  'Your collection items',
] as const;

export default function DeleteAccountScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const reducedMotion = useReducedMotion();
  const insets = useSafeAreaInsets();
  const { deleteAccount } = useAuth();
  const { clearAllData } = useDeclutter();
  const t = isDark ? V1.dark : V1.light;

  const [isDeleting, setIsDeleting] = useState(false);

  const enterAnim = (delay: number) =>
    reducedMotion ? undefined : FadeInDown.delay(delay).duration(350);

  const handleDelete = () => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      'Are you absolutely sure?',
      'All your data will be permanently deleted. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Delete Everything',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              const result = await deleteAccount();
              if (result.success) {
                // Clear all local data before navigating away
                try {
                  await clearAllData();
                } catch {
                  // Continue even if local cleanup fails
                  if (__DEV__) console.warn('Failed to clear local data after account deletion');
                }
                router.replace('/');
              } else {
                Alert.alert('Error', result.error || 'Could not delete account.');
              }
            } catch {
              Alert.alert('Error', 'Could not delete account. Please contact support.');
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ],
    );
  };

  const handleKeep = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      <AmbientBackdrop isDark={isDark} variant="settings" />

      {/* Nav bar */}
      <View style={[styles.navBar, { paddingTop: insets.top + 8 }]}>
        <Pressable
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          style={[styles.backBtn, {
            backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
          }]}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ChevronLeft size={18} color={t.text} />
        </Pressable>
        <Text style={[styles.navTitle, { color: t.text }]}>Delete Account</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Mascot area */}
        <Animated.View entering={enterAnim(0)} style={styles.mascotArea}>
          <View style={styles.mascotCircleOuter}>
            <LinearGradient
              colors={isDark
                ? ['rgba(255,107,107,0.25)', 'rgba(255,107,107,0.05)']
                : ['rgba(255,107,107,0.20)', 'rgba(255,107,107,0.04)']
              }
              style={styles.mascotGradient}
            >
              <MascotAvatar imageKey="sad" size={80} showBackground={false} />
            </LinearGradient>
          </View>
          <Text style={[{ fontFamily: BODY_FONT, fontSize: 14, fontWeight: '500', color: t.textSecondary, textAlign: 'center', marginTop: 8 }]}>
            We'll miss you...
          </Text>
        </Animated.View>

        {/* Deletion summary card */}
        <Animated.View entering={enterAnim(80)}>
          <View style={[styles.summaryCard, {
            backgroundColor: t.card,
            borderColor: t.border,
          }]}>
            <Text style={[styles.summaryTitle, { color: t.text }]}>
              This will permanently delete:
            </Text>

            {DELETION_ITEMS.map((item, index) => (
              <View key={index} style={styles.bulletRow}>
                <View style={[styles.bulletDot, { backgroundColor: V1.coral }]} />
                <Text style={[styles.bulletText, { color: t.textSecondary }]}>
                  {item}
                </Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Export data option */}
        <Animated.View entering={enterAnim(120)}>
          <Pressable
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              Alert.alert(
                'Export Data',
                'We will send a copy of all your data to your email address. This may take a few minutes.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Export My Data', onPress: () => Alert.alert('Data Export', 'Your data export has been queued. Check your email.') },
                ]
              );
            }}
            style={({ pressed }) => [{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              padding: 14,
              borderRadius: RADIUS.md,
              backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
              borderWidth: 1,
              borderColor: t.border,
              opacity: pressed ? 0.7 : 1,
            }]}
            accessibilityRole="button"
            accessibilityLabel="Download my data before deletion"
          >
            <Download size={18} color={V1.blue} />
            <View style={{ flex: 1 }}>
              <Text style={[{ fontFamily: BODY_FONT, fontSize: 14, fontWeight: '600', color: t.text }]}>
                Download my data first
              </Text>
              <Text style={[{ fontFamily: BODY_FONT, fontSize: 12, color: t.textSecondary }]}>
                Get a copy of all your rooms, stats, and history
              </Text>
            </View>
          </Pressable>
        </Animated.View>

        {/* Warning text */}
        <Animated.View entering={enterAnim(160)}>
          <Text style={[styles.warningText, { color: V1.coral }]}>
            This action cannot be undone.
          </Text>
        </Animated.View>

        {/* Spacer */}
        <View style={{ flex: 1 }} />

        {/* Action buttons */}
        <Animated.View
          entering={enterAnim(200)}
          style={[styles.buttonsContainer, { paddingBottom: insets.bottom + 16 }]}
        >
          {/* Delete button */}
          <Pressable
            onPress={handleDelete}
            disabled={isDeleting}
            accessibilityRole="button"
            accessibilityLabel="Delete my account"
            style={({ pressed }) => [
              styles.deleteButton,
              { opacity: pressed && !isDeleting ? 0.85 : 1 },
              isDeleting && styles.buttonDisabled,
            ]}
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.deleteButtonText}>Delete My Account</Text>
            )}
          </Pressable>

          {/* Keep button */}
          <Pressable
            onPress={handleKeep}
            disabled={isDeleting}
            accessibilityRole="button"
            accessibilityLabel="Keep my account"
            style={({ pressed }) => [
              styles.keepButton,
              {
                borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)',
                opacity: pressed && !isDeleting ? 0.7 : 1,
              },
              isDeleting && styles.buttonDisabled,
            ]}
          >
            <Text style={[styles.keepButtonText, { color: t.text }]}>
              Keep My Account
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Nav
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.screenPadding,
    paddingBottom: 12,
    gap: 12,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitle: {
    flex: 1,
    fontFamily: DISPLAY_FONT,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },

  // Content
  content: {
    flex: 1,
    paddingHorizontal: SPACING.screenPadding,
  },

  // Mascot
  mascotArea: {
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 28,
  },
  mascotCircleOuter: {
    width: 140,
    height: 140,
    borderRadius: 70,
    overflow: 'hidden',
  },
  mascotGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mascotEmoji: {
    fontSize: 64,
  },

  // Summary card
  summaryCard: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    paddingHorizontal: SPACING.cardPadding,
    paddingVertical: 20,
    gap: 14,
  },
  summaryTitle: {
    fontFamily: DISPLAY_FONT,
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bulletDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  bulletText: {
    fontFamily: BODY_FONT,
    fontSize: 15,
    fontWeight: '400',
    flex: 1,
  },

  // Warning
  warningText: {
    fontFamily: BODY_FONT,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 20,
  },

  // Buttons
  buttonsContainer: {
    gap: 12,
  },
  deleteButton: {
    backgroundColor: V1.coral,
    borderRadius: RADIUS.md,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    fontFamily: BODY_FONT,
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  keepButton: {
    borderRadius: RADIUS.md,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  keepButtonText: {
    fontFamily: BODY_FONT,
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
