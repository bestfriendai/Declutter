/**
 * Declutterly - Settings Screen
 * Apple TV style with iOS Settings grouped lists
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Linking,
  TextInput,
  useColorScheme,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, {
  FadeInDown,
  FadeInRight,
  SlideInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { Colors } from '@/constants/Colors';
import { Typography } from '@/theme/typography';
import { useDeclutter, saveApiKey, loadApiKey } from '@/context/DeclutterContext';
import { useCardPress } from '@/hooks/useAnimatedPress';

// =============================================================================
// Types
// =============================================================================

type SettingsSectionProps = {
  title: string;
  children: React.ReactNode;
  index?: number;
  footer?: string;
};

type SettingsItemProps = {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  showChevron?: boolean;
  destructive?: boolean;
  index?: number;
};

type ToggleItemProps = {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  index?: number;
};

type PickerOption = {
  label: string;
  value: string;
};

type PickerItemProps = {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  options: PickerOption[];
  selectedValue: string;
  onValueChange: (value: string) => void;
  index?: number;
};

// =============================================================================
// Reusable Components
// =============================================================================

function SettingsSection({ title, children, index = 0, footer }: SettingsSectionProps) {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 100).springify()}
      style={styles.sectionContainer}
    >
      {title && (
        <Text
          style={[
            Typography.caption1,
            styles.sectionTitle,
            { color: colors.textSecondary },
          ]}
        >
          {title.toUpperCase()}
        </Text>
      )}
      <View
        style={[
          styles.sectionContent,
          {
            backgroundColor:
              colorScheme === 'dark'
                ? 'rgba(255, 255, 255, 0.05)'
                : 'rgba(0, 0, 0, 0.02)',
            borderColor:
              colorScheme === 'dark'
                ? 'rgba(255, 255, 255, 0.08)'
                : 'rgba(0, 0, 0, 0.05)',
          },
        ]}
      >
        {React.Children.map(children, (child, idx) => (
          <>
            {child}
            {idx < React.Children.count(children) - 1 && (
              <View
                style={[
                  styles.separator,
                  {
                    backgroundColor:
                      colorScheme === 'dark'
                        ? 'rgba(255, 255, 255, 0.08)'
                        : 'rgba(0, 0, 0, 0.05)',
                  },
                ]}
              />
            )}
          </>
        ))}
      </View>
      {footer && (
        <Text
          style={[
            Typography.caption2,
            styles.sectionFooter,
            { color: colors.textTertiary },
          ]}
        >
          {footer}
        </Text>
      )}
    </Animated.View>
  );
}

function SettingsItem({
  icon,
  title,
  subtitle,
  onPress,
  rightElement,
  showChevron = false,
  destructive = false,
  index = 0,
}: SettingsItemProps) {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  const titleColor = destructive ? colors.danger : colors.text;

  return (
    <Animated.View entering={FadeInRight.delay(index * 50)}>
      <Pressable
        onPress={onPress ? handlePress : undefined}
        onPressIn={onPress ? handlePressIn : undefined}
        onPressOut={onPress ? handlePressOut : undefined}
        disabled={!onPress}
      >
        <Animated.View style={[styles.settingsItem, animatedStyle]}>
          <View style={styles.itemIconContainer}>{icon}</View>

          <View style={styles.itemContent}>
            <Text style={[Typography.body, { color: titleColor }]}>{title}</Text>
            {subtitle && (
              <Text
                style={[
                  Typography.caption2,
                  { color: colors.textSecondary, marginTop: 2 },
                ]}
                numberOfLines={2}
              >
                {subtitle}
              </Text>
            )}
          </View>

          {rightElement && (
            <View style={styles.itemRight}>{rightElement}</View>
          )}

          {showChevron && (
            <Ionicons
              name="chevron-forward"
              size={18}
              color={colors.textTertiary}
              style={{ marginLeft: 4 }}
            />
          )}
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

function ToggleItem({
  icon,
  title,
  subtitle,
  value,
  onValueChange,
  index = 0,
}: ToggleItemProps) {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];

  const handleToggle = (newValue: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onValueChange(newValue);
  };

  return (
    <SettingsItem
      icon={icon}
      title={title}
      subtitle={subtitle}
      index={index}
      rightElement={
        <Switch
          value={value}
          onValueChange={handleToggle}
          trackColor={{
            false: colorScheme === 'dark' ? '#3A3A3C' : '#E5E5EA',
            true: colors.primary,
          }}
          thumbColor="#FFFFFF"
          ios_backgroundColor={colorScheme === 'dark' ? '#3A3A3C' : '#E5E5EA'}
        />
      }
    />
  );
}

function PickerItem({
  icon,
  title,
  subtitle,
  options,
  selectedValue,
  onValueChange,
  index = 0,
}: PickerItemProps) {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const [showOptions, setShowOptions] = useState(false);

  const selectedLabel =
    options.find((o) => o.value === selectedValue)?.label || selectedValue;

  const handleSelect = (value: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onValueChange(value);
    setShowOptions(false);
  };

  return (
    <View>
      <SettingsItem
        icon={icon}
        title={title}
        subtitle={subtitle}
        index={index}
        onPress={() => setShowOptions(!showOptions)}
        rightElement={
          <View style={styles.pickerValue}>
            <Text style={[Typography.body, { color: colors.textSecondary }]}>
              {selectedLabel}
            </Text>
          </View>
        }
        showChevron
      />

      {showOptions && (
        <Animated.View
          entering={FadeInDown.duration(200)}
          style={[
            styles.pickerOptions,
            {
              backgroundColor:
                colorScheme === 'dark'
                  ? 'rgba(60, 60, 67, 0.6)'
                  : 'rgba(0, 0, 0, 0.05)',
            },
          ]}
        >
          {options.map((option, idx) => (
            <Pressable
              key={option.value}
              onPress={() => handleSelect(option.value)}
              style={[
                styles.pickerOption,
                idx < options.length - 1 && {
                  borderBottomWidth: 0.5,
                  borderBottomColor:
                    colorScheme === 'dark'
                      ? 'rgba(255, 255, 255, 0.1)'
                      : 'rgba(0, 0, 0, 0.1)',
                },
              ]}
            >
              <Text
                style={[
                  Typography.body,
                  {
                    color:
                      option.value === selectedValue
                        ? colors.primary
                        : colors.text,
                  },
                ]}
              >
                {option.label}
              </Text>
              {option.value === selectedValue && (
                <Ionicons name="checkmark" size={20} color={colors.primary} />
              )}
            </Pressable>
          ))}
        </Animated.View>
      )}
    </View>
  );
}

// =============================================================================
// Icon Backgrounds
// =============================================================================

function IconBackground({
  color,
  children,
}: {
  color: string;
  children: React.ReactNode;
}) {
  return (
    <View style={[styles.iconBackground, { backgroundColor: color }]}>
      {children}
    </View>
  );
}

// =============================================================================
// Main Settings Screen
// =============================================================================

export default function SettingsScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const { settings, updateSettings, rooms, stats, clearAllData } = useDeclutter();

  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [apiKeyExpanded, setApiKeyExpanded] = useState(false);

  const scrollY = useSharedValue(0);

  useEffect(() => {
    loadApiKey().then((key) => {
      if (key) setApiKey(key);
    });
  }, []);

  const validateApiKey = async (key: string): Promise<boolean> => {
    if (!key || key.length < 20) {
      return false;
    }

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Hello' }] }],
            generationConfig: { maxOutputTokens: 10 },
          }),
        }
      );
      return response.ok;
    } catch {
      return false;
    }
  };

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      Alert.alert('Error', 'Please enter an API key.');
      return;
    }

    if (apiKey.length < 20) {
      Alert.alert('Error', 'API key appears to be too short. Please check your key.');
      return;
    }

    setIsValidating(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const isValid = await validateApiKey(apiKey);
    setIsValidating(false);

    if (isValid) {
      await saveApiKey(apiKey);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Your API key has been validated and saved!');
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert(
        'Invalid API Key',
        'The API key could not be validated. Please check that you have a valid Gemini API key.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Save Anyway',
            onPress: async () => {
              await saveApiKey(apiKey);
              Alert.alert('Saved', 'API key saved without validation.');
            },
          },
        ]
      );
    }
  };

  const handleClearData = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      'Clear All Data',
      'This will delete all your rooms, tasks, progress, mascot, and collection. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearAllData();
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert(
                'Data Cleared',
                'All data has been cleared successfully. The app will restart fresh.',
                [{ text: 'OK', onPress: () => router.replace('/onboarding') }]
              );
            } catch (error) {
              Alert.alert('Error', 'Failed to clear data. Please try again.');
            }
          },
        },
      ]
    );
  };

  const openGeminiDocs = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL('https://ai.google.dev/');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Background gradient */}
      <LinearGradient
        colors={
          colorScheme === 'dark'
            ? ['#0A0A0A', '#141414', '#0A0A0A']
            : ['#F8F8FA', '#FFFFFF', '#F8F8FA']
        }
        style={StyleSheet.absoluteFill}
      />

      {/* Glass Header */}
      <Animated.View
        entering={SlideInUp.duration(500)}
        style={[styles.header, { paddingTop: insets.top }]}
      >
        <BlurView
          intensity={80}
          tint={colorScheme === 'dark' ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.headerContent}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            style={styles.headerButton}
          >
            <Ionicons name="chevron-back" size={24} color={colors.primary} />
          </Pressable>

          <Text style={[Typography.headline, { color: colors.text }]}>Settings</Text>

          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            style={styles.headerButton}
          >
            <Text style={[Typography.body, { color: colors.primary }]}>Done</Text>
          </Pressable>
        </View>
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* AI Configuration */}
        <SettingsSection
          title="AI Configuration"
          index={0}
          footer="Your API key is stored locally and never shared. Get a free key from Google AI Studio."
        >
          <SettingsItem
            icon={
              <IconBackground color="#34C759">
                <Ionicons name="key" size={18} color="#FFFFFF" />
              </IconBackground>
            }
            title="Gemini API Key"
            subtitle={apiKey ? (showApiKey ? apiKey.substring(0, 20) + '...' : '••••••••••••••••') : 'Not configured'}
            onPress={() => setApiKeyExpanded(!apiKeyExpanded)}
            showChevron
            index={0}
          />

          {apiKeyExpanded && (
            <Animated.View
              entering={FadeInDown.duration(200)}
              style={styles.apiKeySection}
            >
              <View
                style={[
                  styles.apiKeyInput,
                  {
                    backgroundColor:
                      colorScheme === 'dark'
                        ? 'rgba(255, 255, 255, 0.08)'
                        : 'rgba(0, 0, 0, 0.05)',
                    borderColor:
                      colorScheme === 'dark'
                        ? 'rgba(255, 255, 255, 0.1)'
                        : 'rgba(0, 0, 0, 0.1)',
                  },
                ]}
              >
                <TextInput
                  style={[Typography.body, { color: colors.text, flex: 1 }]}
                  placeholder="Enter your API key"
                  placeholderTextColor={colors.textTertiary}
                  value={showApiKey ? apiKey : apiKey ? '•'.repeat(Math.min(apiKey.length, 30)) : ''}
                  onChangeText={setApiKey}
                  secureTextEntry={!showApiKey}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Pressable
                  onPress={() => setShowApiKey(!showApiKey)}
                  style={styles.eyeButton}
                >
                  <Ionicons
                    name={showApiKey ? 'eye-off' : 'eye'}
                    size={20}
                    color={colors.textSecondary}
                  />
                </Pressable>
              </View>

              <View style={styles.apiKeyButtons}>
                <Pressable
                  onPress={handleSaveApiKey}
                  style={[styles.saveButton, { backgroundColor: colors.primary }]}
                >
                  <Text style={[Typography.callout, { color: '#FFFFFF' }]}>
                    {isValidating ? 'Validating...' : 'Save & Validate'}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={openGeminiDocs}
                  style={styles.linkButton}
                >
                  <Text style={[Typography.callout, { color: colors.primary }]}>
                    Get Free Key
                  </Text>
                  <Ionicons name="open-outline" size={16} color={colors.primary} />
                </Pressable>
              </View>
            </Animated.View>
          )}
        </SettingsSection>

        {/* Appearance */}
        <SettingsSection title="Appearance" index={1}>
          <PickerItem
            icon={
              <IconBackground color="#5856D6">
                <Ionicons name="color-palette" size={18} color="#FFFFFF" />
              </IconBackground>
            }
            title="Theme"
            options={[
              { label: 'Auto', value: 'auto' },
              { label: 'Light', value: 'light' },
              { label: 'Dark', value: 'dark' },
            ]}
            selectedValue={settings.theme}
            onValueChange={(value) =>
              updateSettings({ theme: value as 'light' | 'dark' | 'auto' })
            }
            index={0}
          />

          <ToggleItem
            icon={
              <IconBackground color="#FF9500">
                <Ionicons name="phone-portrait" size={18} color="#FFFFFF" />
              </IconBackground>
            }
            title="Haptic Feedback"
            subtitle="Vibration on interactions"
            value={settings.hapticFeedback}
            onValueChange={(value) => updateSettings({ hapticFeedback: value })}
            index={1}
          />
        </SettingsSection>

        {/* Notifications */}
        <SettingsSection title="Notifications" index={2}>
          <ToggleItem
            icon={
              <IconBackground color="#FF3B30">
                <Ionicons name="notifications" size={18} color="#FFFFFF" />
              </IconBackground>
            }
            title="Push Notifications"
            subtitle="Reminders and updates"
            value={settings.notifications}
            onValueChange={(value) => updateSettings({ notifications: value })}
            index={0}
          />

          <ToggleItem
            icon={
              <IconBackground color="#FF2D55">
                <MaterialCommunityIcons name="diamond" size={18} color="#FFFFFF" />
              </IconBackground>
            }
            title="Collectible Alerts"
            subtitle="New collectibles earned"
            value={settings.collectibleNotifications}
            onValueChange={(value) =>
              updateSettings({ collectibleNotifications: value })
            }
            index={1}
          />
        </SettingsSection>

        {/* Focus Mode */}
        <SettingsSection
          title="Focus Mode"
          index={3}
          footer="Strict mode warns you when leaving the app during focus sessions."
        >
          <ToggleItem
            icon={
              <IconBackground color="#007AFF">
                <Ionicons name="timer" size={18} color="#FFFFFF" />
              </IconBackground>
            }
            title="Strict Mode"
            subtitle="Stay focused during sessions"
            value={settings.focusMode.strictMode}
            onValueChange={(value) =>
              updateSettings({
                focusMode: { ...settings.focusMode, strictMode: value },
              })
            }
            index={0}
          />

          <ToggleItem
            icon={
              <IconBackground color="#AF52DE">
                <Ionicons name="chatbubble-ellipses" size={18} color="#FFFFFF" />
              </IconBackground>
            }
            title="Motivational Quotes"
            subtitle="Inspiring messages during breaks"
            value={settings.focusMode.showMotivationalQuotes}
            onValueChange={(value) =>
              updateSettings({
                focusMode: { ...settings.focusMode, showMotivationalQuotes: value },
              })
            }
            index={1}
          />

          <ToggleItem
            icon={
              <IconBackground color="#32ADE6">
                <Ionicons name="cafe" size={18} color="#FFFFFF" />
              </IconBackground>
            }
            title="Auto-start Breaks"
            subtitle="Automatic break reminders"
            value={settings.focusMode.autoStartBreak}
            onValueChange={(value) =>
              updateSettings({
                focusMode: { ...settings.focusMode, autoStartBreak: value },
              })
            }
            index={2}
          />

          <ToggleItem
            icon={
              <IconBackground color="#64D2FF">
                <Ionicons name="moon" size={18} color="#FFFFFF" />
              </IconBackground>
            }
            title="Block Notifications"
            subtitle="Silence during focus"
            value={settings.focusMode.blockNotifications}
            onValueChange={(value) =>
              updateSettings({
                focusMode: { ...settings.focusMode, blockNotifications: value },
              })
            }
            index={3}
          />
        </SettingsSection>

        {/* ADHD-Friendly Options */}
        <SettingsSection
          title="ADHD-Friendly Options"
          index={4}
          footer="Higher encouragement = more positive messages. Ultra breakdown = smallest possible task steps."
        >
          <PickerItem
            icon={
              <IconBackground color="#30D158">
                <Ionicons name="heart" size={18} color="#FFFFFF" />
              </IconBackground>
            }
            title="Encouragement Level"
            subtitle="How much motivation you receive"
            options={[
              { label: 'Minimal', value: 'minimal' },
              { label: 'Moderate', value: 'moderate' },
              { label: 'Maximum', value: 'maximum' },
            ]}
            selectedValue={settings.encouragementLevel}
            onValueChange={(value) =>
              updateSettings({
                encouragementLevel: value as 'minimal' | 'moderate' | 'maximum',
              })
            }
            index={0}
          />

          <PickerItem
            icon={
              <IconBackground color="#FFD60A">
                <Ionicons name="list" size={18} color="#FFFFFF" />
              </IconBackground>
            }
            title="Task Breakdown"
            subtitle="How detailed tasks are split"
            options={[
              { label: 'Normal', value: 'normal' },
              { label: 'Detailed', value: 'detailed' },
              { label: 'Ultra', value: 'ultra' },
            ]}
            selectedValue={settings.taskBreakdownLevel}
            onValueChange={(value) =>
              updateSettings({
                taskBreakdownLevel: value as 'normal' | 'detailed' | 'ultra',
              })
            }
            index={1}
          />
        </SettingsSection>

        {/* Collection */}
        <SettingsSection title="Collection" index={5}>
          <ToggleItem
            icon={
              <IconBackground color="#BF5AF2">
                <MaterialCommunityIcons name="cube-scan" size={18} color="#FFFFFF" />
              </IconBackground>
            }
            title="AR Collectibles"
            subtitle="View collectibles in augmented reality"
            value={settings.arCollectionEnabled}
            onValueChange={(value) =>
              updateSettings({ arCollectionEnabled: value })
            }
            index={0}
          />
        </SettingsSection>

        {/* Your Data */}
        <SettingsSection title="Your Data" index={6}>
          <SettingsItem
            icon={
              <IconBackground color="#5AC8FA">
                <Ionicons name="home" size={18} color="#FFFFFF" />
              </IconBackground>
            }
            title="Rooms"
            rightElement={
              <Text style={[Typography.body, { color: colors.textSecondary }]}>
                {rooms.length}
              </Text>
            }
            index={0}
          />

          <SettingsItem
            icon={
              <IconBackground color="#34C759">
                <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
              </IconBackground>
            }
            title="Tasks Completed"
            rightElement={
              <Text style={[Typography.body, { color: colors.textSecondary }]}>
                {stats.totalTasksCompleted}
              </Text>
            }
            index={1}
          />

          <SettingsItem
            icon={
              <IconBackground color="#FF9500">
                <Ionicons name="flame" size={18} color="#FFFFFF" />
              </IconBackground>
            }
            title="Current Streak"
            rightElement={
              <Text style={[Typography.body, { color: colors.textSecondary }]}>
                {stats.currentStreak} days
              </Text>
            }
            index={2}
          />

          <SettingsItem
            icon={
              <IconBackground color="#AF52DE">
                <Ionicons name="time" size={18} color="#FFFFFF" />
              </IconBackground>
            }
            title="Total Time Cleaning"
            rightElement={
              <Text style={[Typography.body, { color: colors.textSecondary }]}>
                {Math.round(stats.totalMinutesCleaned / 60)}h {stats.totalMinutesCleaned % 60}m
              </Text>
            }
            index={3}
          />
        </SettingsSection>

        {/* About */}
        <SettingsSection title="About" index={7}>
          <SettingsItem
            icon={
              <IconBackground color="#007AFF">
                <Ionicons name="information-circle" size={18} color="#FFFFFF" />
              </IconBackground>
            }
            title="App Version"
            rightElement={
              <Text style={[Typography.body, { color: colors.textSecondary }]}>
                1.0.0
              </Text>
            }
            index={0}
          />

          <SettingsItem
            icon={
              <IconBackground color="#5856D6">
                <MaterialCommunityIcons name="react" size={18} color="#FFFFFF" />
              </IconBackground>
            }
            title="Built With"
            rightElement={
              <Text style={[Typography.body, { color: colors.textSecondary }]}>
                Expo + React Native
              </Text>
            }
            index={1}
          />

          <SettingsItem
            icon={
              <IconBackground color="#4285F4">
                <MaterialCommunityIcons name="robot" size={18} color="#FFFFFF" />
              </IconBackground>
            }
            title="AI Powered By"
            rightElement={
              <Text style={[Typography.body, { color: colors.textSecondary }]}>
                Google Gemini
              </Text>
            }
            index={2}
          />
        </SettingsSection>

        {/* Danger Zone */}
        <SettingsSection title="Danger Zone" index={8}>
          <SettingsItem
            icon={
              <IconBackground color="#FF3B30">
                <Ionicons name="trash" size={18} color="#FFFFFF" />
              </IconBackground>
            }
            title="Clear All Data"
            subtitle="Delete rooms, tasks, and progress"
            onPress={handleClearData}
            destructive
            showChevron
            index={0}
          />
        </SettingsSection>

        {/* Footer */}
        <Animated.View
          entering={FadeInDown.delay(900)}
          style={styles.footer}
        >
          <Text style={[Typography.caption1, { color: colors.textTertiary }]}>
            Made with ❤️ for people who struggle with cleaning
          </Text>
          <Text
            style={[
              Typography.caption2,
              { color: colors.textTertiary, marginTop: 4 },
            ]}
          >
            Remember: Progress, not perfection!
          </Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    overflow: 'hidden',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerButton: {
    padding: 8,
    minWidth: 60,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 100,
    paddingHorizontal: 16,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    letterSpacing: 0.5,
  },
  sectionContent: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 0.5,
  },
  sectionFooter: {
    paddingHorizontal: 16,
    paddingTop: 8,
    lineHeight: 18,
  },
  separator: {
    height: 0.5,
    marginLeft: 56,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 52,
  },
  itemIconContainer: {
    marginRight: 12,
  },
  iconBackground: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemContent: {
    flex: 1,
  },
  itemRight: {
    marginLeft: 12,
  },
  pickerValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pickerOptions: {
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  apiKeySection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  apiKeyInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  eyeButton: {
    padding: 4,
  },
  apiKeyButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
});
