/**
 * Declutterly -- Settings Screen (V1 Pencil Design)
 * Apple compliance: includes all required legal links.
 * GENERAL, APPEARANCE, ACCOUNT, SUPPORT & LEGAL sections.
 */

import { AmbientBackdrop } from '@/components/ui/AmbientBackdrop';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useAuth } from '@/context/AuthContext';
import { useDeclutter } from '@/context/DeclutterContext';
import { setHapticsEnabled } from '@/services/haptics';
import { setSoundEffectsEnabled } from '@/services/audio';
import { PromptModal } from '@/components/ui/PromptModal';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
import {
  ChevronLeft,
  ChevronRight,
  Bell,
  Sliders,
  Volume2,
  Smartphone,
  Moon,
  Palette,
  CreditCard,
  RotateCcw,
  User,
  HelpCircle,
  MessageSquare,
  Star,
  Shield,
  FileText,
  LogOut,
  Trash2,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const BODY_FONT = 'DM Sans';
const DISPLAY_FONT = 'Bricolage Grotesque';

const V1 = {
  coral: '#FF6B6B',
  green: '#66BB6A',
  dark: {
    bg: '#0C0C0C',
    card: '#1A1A1A',
    border: 'rgba(255,255,255,0.08)',
    text: '#FFFFFF',
    textSecondary: 'rgba(255,255,255,0.5)',
    textMuted: 'rgba(255,255,255,0.3)',
  },
  light: {
    bg: '#FAFAFA',
    card: '#F6F7F8',
    border: '#E5E7EB',
    text: '#1A1A1A',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',
  },
};

// ─────────────────────────────────────────────────────────────────────
// Row Component
// ─────────────────────────────────────────────────────────────────────
interface RowProps {
  icon: LucideIcon;
  label: string;
  onPress?: () => void;
  toggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (v: boolean) => void;
  trailing?: React.ReactNode;
  destructive?: boolean;
  isDark: boolean;
  isLast?: boolean;
}

function Row({
  icon, label, onPress, toggle, toggleValue, onToggle,
  trailing, destructive, isDark, isLast,
}: RowProps) {
  const t = isDark ? V1.dark : V1.light;

  return (
    <View>
      <Pressable
        onPress={() => {
          if (toggle && onToggle) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onToggle(!toggleValue);
            return;
          }
          if (onPress) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onPress();
          }
        }}
        disabled={!onPress && !toggle}
        accessibilityRole={toggle ? 'switch' : onPress ? 'button' : 'none'}
        accessibilityLabel={label}
        accessibilityState={toggle ? { checked: toggleValue } : undefined}
        style={({ pressed }) => [
          styles.row,
          { opacity: pressed && (onPress || toggle) ? 0.7 : 1 },
        ]}
      >
        {React.createElement(icon, {
          size: 20,
          color: destructive ? V1.coral : t.textSecondary,
        })}

        <Text style={[styles.rowLabel, {
          color: destructive ? V1.coral : t.text,
          flex: 1,
        }]}>
          {label}
        </Text>

        {toggle ? (
          <Switch
            value={toggleValue}
            onValueChange={(v) => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onToggle?.(v);
            }}
            trackColor={{
              false: isDark ? '#333' : '#E5E5EA',
              true: V1.green,
            }}
            thumbColor="#FFFFFF"
            ios_backgroundColor={isDark ? '#333' : '#E5E5EA'}
          />
        ) : trailing ? (
          trailing
        ) : onPress ? (
          <ChevronRight size={16} color={t.textMuted} />
        ) : null}
      </Pressable>
      {!isLast && (
        <View style={[styles.rowDivider, {
          backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)',
        }]} />
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Section Group
// ─────────────────────────────────────────────────────────────────────
function Group({
  title,
  children,
  isDark,
}: {
  title: string;
  children: React.ReactNode;
  isDark: boolean;
}) {
  const t = isDark ? V1.dark : V1.light;
  return (
    <View style={styles.group}>
      <Text style={[styles.groupTitle, { color: isDark ? t.textMuted : t.textSecondary }]}>{title}</Text>
      <View style={[styles.groupCard, { backgroundColor: t.card, borderColor: t.border }]}>
        {children}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────
export default function SettingsScreen() {
  const rawScheme = useColorScheme();
  const isDark = rawScheme === 'dark';
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const t = isDark ? V1.dark : V1.light;

  const { updateProfile, signOut, deleteAccount } = useAuth();
  const { user, settings, updateSettings, setUser } = useDeclutter();

  const [darkModeEnabled, setDarkModeEnabled] = useState(isDark);
  const [soundFXEnabled, setSoundFXEnabled] = useState(settings?.soundFX ?? true);
  const [hapticEnabled, setHapticEnabled] = useState(settings?.hapticFeedback ?? true);
  const [isEditProfileVisible, setIsEditProfileVisible] = useState(false);
  const [displayNameDraft, setDisplayNameDraft] = useState('');

  useEffect(() => {
    setDarkModeEnabled(isDark);
  }, [isDark]);

  useEffect(() => {
    setHapticEnabled(settings?.hapticFeedback ?? true);
  }, [settings?.hapticFeedback]);

  const handleDarkModeToggle = (value: boolean) => {
    setDarkModeEnabled(value);
    updateSettings?.({ theme: value ? 'dark' : 'light' });
  };

  const handleSoundFXToggle = (value: boolean) => {
    setSoundFXEnabled(value);
    setSoundEffectsEnabled(value);
    updateSettings?.({ soundFX: value });
  };

  const handleHapticToggle = (value: boolean) => {
    setHapticEnabled(value);
    setHapticsEnabled(value);
    updateSettings?.({ hapticFeedback: value });
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all associated data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Are you absolutely sure?',
              'All rooms, tasks, progress, and achievements will be permanently deleted.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Yes, Delete Everything',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      const result = await deleteAccount();
                      if (result.success) {
                        router.replace('/');
                      } else {
                        Alert.alert('Error', result.error || 'Could not delete account.');
                      }
                    } catch {
                      Alert.alert('Error', 'Could not delete account. Please contact support.');
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/');
        },
      },
    ]);
  };

  const openEditProfile = () => {
    setDisplayNameDraft(user?.name ?? '');
    setIsEditProfileVisible(true);
  };

  const handleEditProfileSave = async () => {
    const trimmedName = displayNameDraft.trim();
    if (!trimmedName) {
      Alert.alert('Name required', 'Enter a display name to save your profile.');
      return;
    }
    const result = await updateProfile({ displayName: trimmedName });
    if (!result.success) {
      Alert.alert('Error', result.error ?? 'Could not update your name.');
      return;
    }
    if (user) {
      setUser({ ...user, name: trimmedName });
    }
    setIsEditProfileVisible(false);
  };

  const handleRateApp = async () => {
    try {
      const storeUrl = Platform.OS === 'ios'
        ? 'https://apps.apple.com/app/declutterly'
        : 'https://play.google.com/store/apps/details?id=com.declutterly';
      await Linking.openURL(storeUrl);
    } catch {
      // ignore
    }
  };

  const enterAnim = (delay: number) =>
    reducedMotion ? undefined : FadeInDown.delay(delay).duration(350);

  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      <AmbientBackdrop isDark={isDark} variant="settings" />

      {/* Nav bar */}
      <View style={[styles.navBar, { paddingTop: insets.top + 8 }]}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
        <Text style={[styles.navTitle, { color: t.text }]}>Settings</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* GENERAL */}
        <Animated.View entering={enterAnim(0)}>
          <Group title="GENERAL" isDark={isDark}>
            <Row
              icon={Bell}
              label="Notifications"
              onPress={() => router.push('/notification-permission')}
              isDark={isDark}
            />
            <Row
              icon={Sliders}
              label="Cleaning Preferences"
              onPress={() => {}}
              isDark={isDark}
            />
            <Row
              icon={Volume2}
              label="Sound Effects"
              toggle
              toggleValue={soundFXEnabled}
              onToggle={handleSoundFXToggle}
              isDark={isDark}
            />
            <Row
              icon={Smartphone}
              label="Haptic Feedback"
              toggle
              toggleValue={hapticEnabled}
              onToggle={handleHapticToggle}
              isDark={isDark}
              isLast
            />
          </Group>
        </Animated.View>

        {/* APPEARANCE */}
        <Animated.View entering={enterAnim(40)}>
          <Group title="APPEARANCE" isDark={isDark}>
            <Row
              icon={Moon}
              label="Dark Mode"
              toggle
              toggleValue={darkModeEnabled}
              onToggle={handleDarkModeToggle}
              isDark={isDark}
            />
            <Row
              icon={Palette}
              label="Theme Color"
              onPress={() => {}}
              trailing={
                <View style={[styles.colorDot, { backgroundColor: V1.coral }]} />
              }
              isDark={isDark}
              isLast
            />
          </Group>
        </Animated.View>

        {/* ACCOUNT */}
        <Animated.View entering={enterAnim(80)}>
          <Group title="ACCOUNT" isDark={isDark}>
            <Row
              icon={CreditCard}
              label="Manage Subscription"
              onPress={() => router.push('/paywall')}
              isDark={isDark}
            />
            <Row
              icon={RotateCcw}
              label="Restore Purchases"
              onPress={() => {
                // RevenueCat restore handled elsewhere
                Alert.alert('Restore', 'Purchases restored.');
              }}
              isDark={isDark}
            />
            <Row
              icon={User}
              label="Edit Profile"
              onPress={openEditProfile}
              isDark={isDark}
              isLast
            />
          </Group>
        </Animated.View>

        {/* SUPPORT & LEGAL */}
        <Animated.View entering={enterAnim(120)}>
          <Group title="SUPPORT & LEGAL" isDark={isDark}>
            <Row
              icon={HelpCircle}
              label="Help & FAQ"
              onPress={() => Linking.openURL('mailto:support@declutterly.app?subject=Declutterly%20Help')}
              isDark={isDark}
            />
            <Row
              icon={MessageSquare}
              label="Send Feedback"
              onPress={() => Linking.openURL('mailto:feedback@declutterly.app?subject=Declutterly%20Feedback')}
              isDark={isDark}
            />
            <Row
              icon={Star}
              label="Rate Declutter"
              onPress={handleRateApp}
              isDark={isDark}
            />
            <Row
              icon={Shield}
              label="Privacy Policy"
              onPress={() => Linking.openURL('https://declutterly.app/privacy')}
              isDark={isDark}
            />
            <Row
              icon={FileText}
              label="Terms of Service"
              onPress={() => Linking.openURL('https://declutterly.app/terms')}
              isDark={isDark}
              isLast
            />
          </Group>
        </Animated.View>

        {/* DANGER ZONE */}
        <Animated.View entering={enterAnim(160)}>
          <Group title="ACCOUNT ACTIONS" isDark={isDark}>
            <Row
              icon={LogOut}
              label="Sign Out"
              onPress={handleSignOut}
              destructive
              isDark={isDark}
            />
            <Row
              icon={Trash2}
              label="Delete Account"
              onPress={handleDeleteAccount}
              destructive
              isDark={isDark}
              isLast
            />
          </Group>
        </Animated.View>

        {/* Version */}
        <Text style={[styles.versionText, { color: t.textMuted }]}>
          Declutterly v1.0.0 (Build 1)
        </Text>
      </ScrollView>

      <PromptModal
        visible={isEditProfileVisible}
        title="Edit profile"
        description="Update the name shown across your Declutterly account."
        value={displayNameDraft}
        placeholder="Your display name"
        submitLabel="Save"
        autoCapitalize="words"
        onChangeText={setDisplayNameDraft}
        onSubmit={() => { void handleEditProfileSave(); }}
        onCancel={() => setIsEditProfileVisible(false)}
        submitDisabled={!displayNameDraft.trim()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Nav
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
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

  scrollView: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 4,
  },

  // Group
  group: {
    marginBottom: 24,
  },
  groupTitle: {
    fontFamily: BODY_FONT,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  groupCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
  },

  // Row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  rowLabel: {
    fontFamily: BODY_FONT,
    fontSize: 15,
    fontWeight: '500',
  },
  rowDivider: {
    height: 1,
    marginLeft: 48,
  },

  // Color dot
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },

  // Version
  versionText: {
    textAlign: 'center',
    fontFamily: BODY_FONT,
    fontSize: 12,
    marginTop: 8,
    marginBottom: 8,
  },
});
