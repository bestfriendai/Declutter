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
import { useRevenueCat } from '@/hooks/useRevenueCat';
import { setHapticsEnabled } from '@/services/haptics';
import { setSoundEffectsEnabled } from '@/services/audio';
import { PromptModal } from '@/components/ui/PromptModal';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
import {
  ChevronLeft,
  ChevronRight,
  Bell,
  Volume2,
  Smartphone,
  Moon,
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
  Heart,
  Target,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import { ScreenErrorBoundary } from '@/components/ErrorBoundary';

import {
  V1,
  BODY_FONT,
  DISPLAY_FONT,
} from '@/constants/designTokens';

// Set after first App Store submission
const APP_STORE_ID = '';

// ─────────────────────────────────────────────────────────────────────
// Row Component
// ─────────────────────────────────────────────────────────────────────
interface RowProps {
  icon: LucideIcon;
  label: string;
  subtitle?: string;
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
  icon, label, subtitle, onPress, toggle, toggleValue, onToggle,
  trailing, destructive, isDark, isLast,
}: RowProps) {
  const t = isDark ? V1.dark : V1.light;

  return (
    <View>
      <Pressable
        onPress={() => {
          if (toggle && onToggle) {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onToggle(!toggleValue);
            return;
          }
          if (onPress) {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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

        <View style={{ flex: 1 }}>
          <Text style={[styles.rowLabel, {
            color: destructive ? V1.coral : t.text,
          }]}>
            {label}
          </Text>
          {subtitle ? (
            <Text style={[styles.rowSubtitle, { color: t.textMuted }]}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        {toggle ? (
          <Switch
            value={toggleValue}
            onValueChange={(v) => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
// Picker Row Component (segmented picker for settings)
// ─────────────────────────────────────────────────────────────────────
interface PickerRowProps {
  icon: LucideIcon;
  label: string;
  options: { value: string; label: string }[];
  selectedValue: string;
  onSelect: (value: string) => void;
  isDark: boolean;
  isLast?: boolean;
}

function PickerRow({ icon, label, options, selectedValue, onSelect, isDark, isLast }: PickerRowProps) {
  const t = isDark ? V1.dark : V1.light;
  return (
    <View>
      <View style={styles.row}>
        {React.createElement(icon, { size: 20, color: t.textSecondary })}
        <View style={{ flex: 1, gap: 8 }}>
          <Text style={[styles.rowLabel, { color: t.text }]}>{label}</Text>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {options.map((opt) => {
              const isSelected = selectedValue === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onSelect(opt.value);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`${label}: ${opt.label}`}
                  accessibilityState={{ selected: isSelected }}
                  style={[
                    styles.pickerChip,
                    {
                      backgroundColor: isSelected
                        ? V1.coral
                        : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                    },
                  ]}
                >
                  <Text style={[
                    styles.pickerChipText,
                    { color: isSelected ? '#FFFFFF' : t.textSecondary },
                  ]}>
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
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
  return (
    <ScreenErrorBoundary screenName="settings">
      <SettingsScreenContent />
    </ScreenErrorBoundary>
  );
}

function SettingsScreenContent() {
  const rawScheme = useColorScheme();
  const isDark = rawScheme === 'dark';
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const t = isDark ? V1.dark : V1.light;

  const { updateProfile, signOut } = useAuth();
  const { user, settings, updateSettings, setUser, stats, updateStats } = useDeclutter();
  const { restorePurchases } = useRevenueCat();

  const [themeMode, setThemeMode] = useState<'auto' | 'light' | 'dark'>(settings?.theme ?? 'auto');
  const [soundFXEnabled, setSoundFXEnabled] = useState(settings?.soundFX ?? true);
  const [hapticEnabled, setHapticEnabled] = useState(settings?.hapticFeedback ?? true);
  const [isEditProfileVisible, setIsEditProfileVisible] = useState(false);
  const [displayNameDraft, setDisplayNameDraft] = useState('');
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    setThemeMode(settings?.theme ?? 'auto');
  }, [settings?.theme]);

  useEffect(() => {
    setHapticEnabled(settings?.hapticFeedback ?? true);
  }, [settings?.hapticFeedback]);

  const handleThemeChange = (value: string) => {
    const theme = value as 'auto' | 'light' | 'dark';
    setThemeMode(theme);
    updateSettings?.({ theme });
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
    router.push('/delete-account');
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
    if (!APP_STORE_ID) {
      Alert.alert('Rating available soon', 'App Store rating will be available after our first release.');
      return;
    }
    try {
      const androidId = Constants.expoConfig?.android?.package ?? 'com.theblockbrowser.declutter';
      const storeUrl = Platform.OS === 'ios'
        ? `itms-apps://itunes.apple.com/app/viewContentsUserReviews/id${APP_STORE_ID}?action=write-review`
        : `https://play.google.com/store/apps/details?id=${androidId}`;
      await Linking.openURL(storeUrl);
    } catch {
      // Fallback to web URL
      try {
        await Linking.openURL('https://apps.apple.com/app/declutterly');
      } catch {
        // ignore
      }
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
        <Text style={[styles.navTitle, { color: t.text }]}>Settings</Text>
        <View style={{ width: 44 }} />
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
            <PickerRow
              icon={Moon}
              label="Theme"
              options={[
                { value: 'auto', label: 'Auto' },
                { value: 'light', label: 'Light' },
                { value: 'dark', label: 'Dark' },
              ]}
              selectedValue={themeMode}
              onSelect={handleThemeChange}
              isDark={isDark}
              isLast
            />
          </Group>
        </Animated.View>

        {/* HOW I CLEAN */}
        <Animated.View entering={enterAnim(60)}>
          <Group title="HOW I CLEAN" isDark={isDark}>
            <PickerRow
              icon={Heart}
              label="Encouragement Level"
              options={[
                { value: 'minimal', label: 'Chill' },
                { value: 'moderate', label: 'Moderate' },
                { value: 'maximum', label: 'Maximum' },
              ]}
              selectedValue={settings?.encouragementLevel ?? 'moderate'}
              onSelect={(v) => updateSettings?.({ encouragementLevel: v as 'minimal' | 'moderate' | 'maximum' })}
              isDark={isDark}
              isLast
            />
          </Group>
        </Animated.View>

        {/* WEEKLY GOALS */}
        <Animated.View entering={enterAnim(80)}>
          <Group title="WEEKLY GOALS" isDark={isDark}>
            <Row
              icon={Target}
              label="Task goal per week"
              trailing={
                <Text style={{ fontFamily: BODY_FONT, fontSize: 13, fontWeight: '600', color: t.textSecondary }}>
                  {stats?.weeklyTaskGoal ?? 10} tasks
                </Text>
              }
              onPress={() => {
                Alert.alert('Weekly Task Goal', 'How many tasks per week?',
                  [5, 10, 15, 20, 25].map(n => ({
                    text: `${n} tasks`,
                    onPress: () => updateStats?.({ weeklyTaskGoal: n }),
                  }))
                );
              }}
              isDark={isDark}
              isLast
            />
          </Group>
        </Animated.View>

        {/* ACCOUNT */}
        <Animated.View entering={enterAnim(100)}>
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
              onPress={async () => {
                setIsRestoring(true);
                try {
                  const success = await restorePurchases();
                  if (success) {
                    Alert.alert('Restored', 'Your purchases have been restored successfully.');
                  } else {
                    Alert.alert('No Purchases Found', 'We could not find any active subscriptions to restore.');
                  }
                } catch {
                  Alert.alert('Error', 'Failed to restore purchases. Please try again.');
                } finally {
                  setIsRestoring(false);
                }
              }}
              trailing={isRestoring ? <ActivityIndicator size="small" color={t.textMuted} /> : undefined}
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
        <Animated.View entering={enterAnim(160)}>
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
              label="Privacy & Data"
              onPress={() => {
                Alert.alert(
                  'Privacy & Data',
                  'Your photos are securely analyzed using AI and are not permanently stored. All cleaning data is synced securely to your account.\n\nYou can delete all your data at any time from Account Actions below.',
                  [
                    { text: 'View Privacy Policy', onPress: () => Linking.openURL('https://declutterly.app/privacy') },
                    { text: 'OK', style: 'cancel' },
                  ]
                );
              }}
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
        <Animated.View entering={enterAnim(180)}>
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
          Declutterly v{Constants.expoConfig?.version ?? '1.0.0'} (Build {Constants.expoConfig?.ios?.buildNumber ?? Constants.expoConfig?.android?.versionCode ?? '1'})
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
  rowSubtitle: {
    fontFamily: BODY_FONT,
    fontSize: 12,
    fontWeight: '400',
    marginTop: 2,
  },
  rowDivider: {
    height: 1,
    marginLeft: 48,
  },

  // Picker chips
  pickerChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  pickerChipText: {
    fontFamily: BODY_FONT,
    fontSize: 13,
    fontWeight: '600',
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
