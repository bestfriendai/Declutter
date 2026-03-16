/**
 * Declutterly -- Settings Screen
 * Matches Pencil design: back arrow + title, grouped card sections,
 * rows with Lucide-style icons, chevrons, and toggle switches.
 */

import { Colors, ColorTokens } from '@/constants/Colors';
import { AmbientBackdrop } from '@/components/ui/AmbientBackdrop';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
import { Ionicons } from '@expo/vector-icons';
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
import { useAuth } from '@/context/AuthContext';
import { useDeclutter } from '@/context/DeclutterContext';
import { setHapticsEnabled } from '@/services/haptics';
import { setSoundEffectsEnabled } from '@/services/audio';
import { LinearGradient } from 'expo-linear-gradient';
import { PromptModal } from '@/components/ui/PromptModal';

// ─────────────────────────────────────────────────────────────────────────────
// Settings Row
// ─────────────────────────────────────────────────────────────────────────────
interface RowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  sublabel?: string;
  onPress?: () => void;
  toggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (v: boolean) => void;
  destructive?: boolean;
  colors: ColorTokens;
  isDark: boolean;
  isLast?: boolean;
  highlightIcon?: boolean;
}

function Row({
  icon, label, sublabel, onPress, toggle, toggleValue, onToggle,
  destructive, colors, isDark, isLast, highlightIcon,
}: RowProps) {
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
        accessibilityHint={sublabel}
        accessibilityState={toggle ? { checked: toggleValue } : undefined}
        style={({ pressed }) => [
          styles.row,
          { opacity: pressed && (onPress || toggle) ? 0.7 : 1 },
        ]}
      >
        {/* Icon */}
        <View
          style={[
            styles.rowIconWrap,
            {
              backgroundColor: highlightIcon
                ? (isDark ? 'rgba(255,196,126,0.18)' : 'rgba(255,213,166,0.44)')
                : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'),
              borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
            },
          ]}
        >
          <Ionicons
            name={icon}
            size={18}
            color={
              highlightIcon
                ? (isDark ? '#FDE7C6' : '#7B5326')
                : (isDark ? '#D7D7DD' : '#4B4B56')
            }
          />
        </View>

        {/* Label + sublabel */}
        <View style={styles.rowContent}>
          <Text style={[styles.rowLabel, {
            color: destructive ? colors.danger : (isDark ? '#FFFFFF' : '#1A1A1A'),
          }]}>
            {label}
          </Text>
          {sublabel && (
            <Text style={[styles.rowSublabel, { color: isDark ? 'rgba(255,255,255,0.44)' : 'rgba(23,23,26,0.46)' }]}>
              {sublabel}
            </Text>
          )}
        </View>

        {/* Right side: toggle or chevron */}
        {toggle ? (
          <Switch
            value={toggleValue}
            onValueChange={(v) => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onToggle?.(v);
            }}
            trackColor={{
              false: isDark ? '#141414' : '#E5E5EA',
              true: isDark ? '#0A84FF' : '#007AFF',
            }}
            thumbColor="#FFFFFF"
            ios_backgroundColor={isDark ? '#141414' : '#E5E5EA'}
          />
        ) : onPress ? (
          <Text style={[styles.rowChevron, {
            color: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.2)',
          }]}>
            {'\u203A'}
          </Text>
        ) : null}
      </Pressable>
      {!isLast && (
        <View style={[styles.rowDivider, {
          backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
        }]} />
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Settings Group
// ─────────────────────────────────────────────────────────────────────────────
interface GroupProps {
  title: string;
  children: React.ReactNode;
  isDark: boolean;
}

function Group({ title, children, isDark }: GroupProps) {
  return (
    <View style={styles.group}>
      <Text style={[styles.groupTitle, {
        color: isDark ? 'rgba(255,255,255,0.38)' : 'rgba(0,0,0,0.4)',
      }]}>
        {title}
      </Text>
      <View style={[styles.groupCard, {
        backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#FFFFFF',
        borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
      }]}>
        {children}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────
export default function SettingsScreen() {
  const rawScheme = useColorScheme();
  const colorScheme = rawScheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();

  const { updateProfile, signOut, deleteAccount, isAnonymous } = useAuth();
  const { user, settings, updateSettings, setUser } = useDeclutter();

  // Toggle states
  const [darkModeEnabled, setDarkModeEnabled] = useState(isDark);
  const [soundFXEnabled, setSoundFXEnabled] = useState(settings?.soundFX ?? true);
  const [hapticEnabled, setHapticEnabled] = useState(settings?.hapticFeedback ?? true);
  const [reducedMotionEnabled, setReducedMotionEnabled] = useState(reducedMotion);
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

  const handleReducedMotionToggle = (value: boolean) => {
    setReducedMotionEnabled(value);
    updateSettings?.({ reducedMotion: value });
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Local Cache',
      'This removes cached photos and temporary data. Your rooms, tasks, and progress are safely stored in the cloud and will not be affected.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Cache',
          onPress: async () => {
            try {
              const AsyncStorage = require('@react-native-async-storage/async-storage').default;
              const cacheKeys = (await AsyncStorage.getAllKeys()).filter(
                (k: string) => k.startsWith('@declutterly_cache') || k.startsWith('@declutterly_session_times')
              );
              if (cacheKeys.length > 0) {
                await AsyncStorage.multiRemove(cacheKeys);
              }
              Alert.alert('Done', 'Cache cleared successfully.');
            } catch {
              Alert.alert('Error', 'Could not clear cache. Please try again.');
            }
          },
        },
      ]
    );
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
                        Alert.alert('Error', result.error || 'Could not delete account. Please contact support.');
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
      setUser({
        ...user,
        name: trimmedName,
      });
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
      // Unable to open App Store
    }
  };

  const handleContactSupport = () => {
    Linking.openURL('mailto:support@declutterly.app?subject=Declutterly%20Support');
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/');
          },
        },
      ]
    );
  };

  const enterAnim = (delay: number) =>
    reducedMotion ? undefined : FadeInDown.delay(delay).duration(350);

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0A0A0A' : '#F8F8F8' }]}>
      <AmbientBackdrop isDark={isDark} variant="settings" />
      <LinearGradient
        colors={isDark
          ? ['rgba(10,10,10,0.72)', 'rgba(10,10,10,0.92)'] as const
          : ['rgba(248,248,248,0.44)', 'rgba(248,248,248,0.92)'] as const
        }
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={[styles.navBar, { paddingTop: insets.top + 8 }]}>
        <View style={styles.navTopRow}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            style={[styles.backButton, {
              backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.84)',
              borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
            }]}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={18} color={isDark ? '#FFFFFF' : '#1A1A1A'} />
          </Pressable>
        </View>
        <Text style={[styles.navTitle, { color: isDark ? '#FFFFFF' : '#1A1A1A' }]}>
          Settings
        </Text>
        <Text style={[styles.navSubtitle, { color: isDark ? 'rgba(255,255,255,0.52)' : 'rgba(23,23,26,0.48)' }]}>
          Tune the app so your resets feel lighter, calmer, and easier to repeat.
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={enterAnim(0)} style={styles.heroCard}>
          <LinearGradient
            colors={
              isDark
                ? ['rgba(255,198,127,0.20)', 'rgba(139,130,255,0.10)', 'rgba(255,255,255,0.03)']
                : ['rgba(255,221,183,0.74)', 'rgba(203,198,255,0.40)', 'rgba(255,255,255,0.30)']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.heroCardFill,
              {
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF',
              },
            ]}
          >
            <View style={styles.heroHeader}>
              <View>
                <Text style={[styles.heroEyebrow, { color: isDark ? '#FFE6C4' : '#7D572A' }]}>
                  YOUR RHYTHM
                </Text>
                <Text style={[styles.heroTitle, { color: isDark ? '#FFF8EF' : '#1A1A1A' }]}>
                  Keep the app working with your brain.
                </Text>
              </View>
              <View
                style={[
                  styles.heroStateChip,
                  {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.72)',
                    borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                  },
                ]}
              >
                <Ionicons name={darkModeEnabled ? 'moon' : 'sunny'} size={14} color={isDark ? '#FFF2DE' : '#6F522E'} />
                <Text style={[styles.heroStateChipText, { color: isDark ? '#FFF2DE' : '#6F522E' }]}>
                  {darkModeEnabled ? 'dark mode' : 'light mode'}
                </Text>
              </View>
            </View>

            <Text style={[styles.heroBody, { color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.56)' }]}>
              Save the theme, trim friction, and set up the kind of nudges that keep you from dropping the routine.
            </Text>

            <View style={styles.heroMetrics}>
              {[
                { label: 'Theme', value: darkModeEnabled ? 'Dark' : 'Light' },
                { label: 'Haptics', value: hapticEnabled ? 'On' : 'Off' },
                { label: 'Account', value: user?.name ? 'Ready' : 'Guest' },
              ].map((item) => (
                <View
                  key={item.label}
                  style={[
                    styles.heroMetricCard,
                    {
                      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.74)',
                      borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
                    },
                  ]}
                >
                  <Text style={[styles.heroMetricValue, { color: isDark ? '#FFF8EF' : '#1A1A1A' }]}>
                    {item.value}
                  </Text>
                  <Text style={[styles.heroMetricLabel, { color: isDark ? 'rgba(255,255,255,0.42)' : 'rgba(0,0,0,0.42)' }]}>
                    {item.label}
                  </Text>
                </View>
              ))}
            </View>
          </LinearGradient>
        </Animated.View>

        {/* PROFILE & NOTIFICATIONS */}
        <Animated.View entering={enterAnim(40)}>
          <Group title="PROFILE & NOTIFICATIONS" isDark={isDark}>
            <Row
              icon="person-outline"
              label="Edit Profile"
              sublabel="Change your display name"
              onPress={openEditProfile}
              colors={colors}
              isDark={isDark}
            />
            <Row
              icon="notifications-outline"
              label="Notifications"
              sublabel="Gentle nudges & reminders"
              onPress={() => {
                router.push('/notification-permission');
              }}
              colors={colors}
              isDark={isDark}
              isLast
            />
          </Group>
        </Animated.View>

        {/* LOOK & FEEL */}
        <Animated.View entering={enterAnim(80)}>
          <Group title="LOOK & FEEL" isDark={isDark}>
            <Row
              icon="moon-outline"
              label="Dark Mode"
              sublabel="Easier on the eyes at night"
              toggle
              toggleValue={darkModeEnabled}
              onToggle={handleDarkModeToggle}
              colors={colors}
              isDark={isDark}
            />
            <Row
              icon="volume-high-outline"
              label="Sound Effects"
              sublabel="Completion dings & ambient sounds"
              toggle
              toggleValue={soundFXEnabled}
              onToggle={handleSoundFXToggle}
              colors={colors}
              isDark={isDark}
            />
            <Row
              icon="flash-outline"
              label="Haptic Feedback"
              sublabel="Vibrations on key actions"
              toggle
              toggleValue={hapticEnabled}
              onToggle={handleHapticToggle}
              colors={colors}
              isDark={isDark}
            />
            <Row
              icon="accessibility-outline"
              label="Reduce Animations"
              sublabel="Simpler transitions for comfort"
              toggle
              toggleValue={reducedMotionEnabled}
              onToggle={handleReducedMotionToggle}
              colors={colors}
              isDark={isDark}
              isLast
            />
          </Group>
        </Animated.View>

        {/* SUPPORT & ABOUT */}
        <Animated.View entering={enterAnim(140)}>
          <Group title="SUPPORT & ABOUT" isDark={isDark}>
            <Row
              icon="help-circle-outline"
              label="Help & FAQ"
              sublabel="Get answers or email us"
              onPress={handleContactSupport}
              colors={colors}
              isDark={isDark}
            />
            <Row
              icon="shield-checkmark-outline"
              label="Privacy Policy"
              onPress={() => Linking.openURL('https://declutterly.app/privacy')}
              colors={colors}
              isDark={isDark}
            />
            <Row
              icon="document-text-outline"
              label="Terms of Service"
              onPress={() => Linking.openURL('https://declutterly.app/terms')}
              colors={colors}
              isDark={isDark}
            />
            <Row
              icon="star-outline"
              label="Rate Declutterly"
              sublabel="Your review helps others with ADHD find us"
              onPress={handleRateApp}
              colors={colors}
              isDark={isDark}
              highlightIcon
              isLast
            />
          </Group>
        </Animated.View>

        {/* DATA & STORAGE */}
        <Animated.View entering={enterAnim(200)}>
          <Group title="DATA & STORAGE" isDark={isDark}>
            <Row
              icon="trash-outline"
              label="Clear Cache"
              sublabel="Free up space without losing data"
              onPress={handleClearCache}
              colors={colors}
              isDark={isDark}
              isLast
            />
          </Group>
        </Animated.View>

        {/* ACCOUNT */}
        <Animated.View entering={enterAnim(260)}>
          <Group title="ACCOUNT" isDark={isDark}>
            {isAnonymous && (
              <Row
                icon="person-add-outline"
                label="Upgrade to Full Account"
                sublabel="Keep your data and add email sign-in"
                onPress={() => {
                  router.push('/auth/signup');
                }}
                colors={colors}
                isDark={isDark}
                highlightIcon
              />
            )}
            <Row
              icon="log-out-outline"
              label="Sign Out"
              onPress={handleSignOut}
              destructive
              colors={colors}
              isDark={isDark}
            />
            <Row
              icon="close-circle-outline"
              label="Delete Account"
              sublabel="Permanently remove all your data"
              onPress={handleDeleteAccount}
              destructive
              colors={colors}
              isDark={isDark}
              isLast
            />
          </Group>
        </Animated.View>

        {/* Version */}
        <Text style={[styles.versionText, { color: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.3)' }]}>
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
        onSubmit={() => {
          void handleEditProfileSave();
        }}
        onCancel={() => setIsEditProfileVisible(false)}
        submitDisabled={!displayNameDraft.trim()}
      />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },

  // ── Nav Bar ──
  navBar: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  navTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitle: {
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  navSubtitle: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 21,
  },

  scrollView: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  heroCard: {
    marginBottom: 28,
  },
  heroCardFill: {
    borderRadius: 28,
    borderWidth: 1,
    padding: 20,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  heroEyebrow: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  heroTitle: {
    marginTop: 6,
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '700',
    letterSpacing: -0.6,
  },
  heroStateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  heroStateChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  heroBody: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 21,
  },
  heroMetrics: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  heroMetricCard: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    gap: 4,
  },
  heroMetricValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  heroMetricLabel: {
    fontSize: 12,
    fontWeight: '600',
  },

  // ── Group ──
  group: {
    marginBottom: 28,
  },
  groupTitle: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  groupCard: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
  },

  // ── Row ──
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  rowIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  rowContent: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  rowSublabel: {
    fontSize: 13,
    fontWeight: '400',
  },
  rowChevron: {
    fontSize: 28,
    fontWeight: '300',
    lineHeight: 28,
  },
  rowDivider: {
    height: 1,
    marginLeft: 48,
  },

  // ── Version ──
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
  },
});
