/**
 * Declutterly -- Create Challenge Screen
 * ADHD-friendly form with pre-filled defaults and minimal decisions.
 */

import { ScreenErrorBoundary } from '@/components/ErrorBoundary';
import {
  V1,
  BODY_FONT,
  DISPLAY_FONT,
  RADIUS,
  SPACING,
  cardStyle,
  getTheme,
  coralButtonStyle,
  coralButtonTextStyle,
  inputFieldStyle,
} from '@/constants/designTokens';
import { useCreateChallenge } from '@/hooks/useConvex';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { ChevronLeft, Trophy, Clock, Target, Zap, Share2 } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Challenge type options
const CHALLENGE_TYPES = [
  { key: 'tasks_count' as const, label: 'Tasks', icon: Target, description: 'Complete X tasks' },
  { key: 'room_complete' as const, label: 'Rooms', icon: Zap, description: 'Clean X rooms' },
  { key: 'time_spent' as const, label: 'Time', icon: Clock, description: 'Clean for X minutes' },
];

// Duration options
const DURATION_OPTIONS = [
  { days: 3, label: '3 days' },
  { days: 7, label: '1 week' },
  { days: 14, label: '2 weeks' },
  { days: 30, label: '1 month' },
];

// Default target values per type
const DEFAULT_TARGETS: Record<string, number> = {
  tasks_count: 10,
  room_complete: 3,
  time_spent: 60,
};

function CreateChallengeContent() {
  const rawScheme = useColorScheme();
  const isDark = rawScheme === 'dark';
  const reducedMotion = useReducedMotion();
  const insets = useSafeAreaInsets();
  const t = getTheme(isDark);

  const createChallenge = useCreateChallenge();

  // Form state with ADHD-friendly defaults
  const [title, setTitle] = useState('Weekly Cleaning Sprint');
  const [description, setDescription] = useState('Let\'s clean together and stay accountable!');
  const [type, setType] = useState<'tasks_count' | 'room_complete' | 'time_spent'>('tasks_count');
  const [target, setTarget] = useState('10');
  const [durationDays, setDurationDays] = useState(7);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Success state
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);

  const enter = (delay: number) =>
    reducedMotion ? undefined : FadeInDown.delay(delay).duration(350);

  const handleCreate = useCallback(async () => {
    if (!title.trim()) {
      Alert.alert('Missing title', 'Give your challenge a name.');
      return;
    }

    const targetNum = parseInt(target) || DEFAULT_TARGETS[type];
    if (targetNum <= 0) {
      Alert.alert('Invalid target', 'Target must be a positive number.');
      return;
    }

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsSubmitting(true);

    try {
      const result = await createChallenge({
        title: title.trim(),
        description: description.trim(),
        type,
        target: targetNum,
        durationDays,
      });

      // The result is the challenge ID - we need to find the invite code
      // For now, show a success state. The invite code is generated server-side.
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Show success with a placeholder -- user can share the challenge from the detail page
      setInviteCode('CREATED');
    } catch (error: any) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', error?.message ?? 'Could not create challenge. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [title, description, type, target, durationDays, createChallenge]);

  const handleShare = useCallback(async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({
        message: `Join my cleaning challenge "${title}" on Declutterly! Download the app and search for the challenge: https://declutterly.app`,
      });
    } catch {}
  }, [title]);

  const handleDone = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, []);

  // Success state
  if (inviteCode) {
    return (
      <View style={[styles.container, { backgroundColor: t.bg }]}>
        <View style={[styles.successContainer, { paddingTop: insets.top + 60 }]}>
          <Animated.View entering={enter(0)} style={styles.successIcon}>
            <Text style={{ fontSize: 56 }}>{'\u{1F389}'}</Text>
          </Animated.View>
          <Animated.View entering={enter(100)}>
            <Text style={[styles.successTitle, { color: t.text }]}>Challenge Created!</Text>
          </Animated.View>
          <Animated.View entering={enter(150)}>
            <Text style={[styles.successSubtitle, { color: t.textSecondary }]}>
              Your "{title}" challenge is live. Invite friends to join!
            </Text>
          </Animated.View>

          <Animated.View entering={enter(200)} style={{ width: '100%', gap: 12, marginTop: 24 }}>
            <Pressable
              onPress={handleShare}
              style={[coralButtonStyle(), { flexDirection: 'row', gap: 8 }]}
            >
              <Share2 size={18} color="#FFFFFF" />
              <Text style={coralButtonTextStyle()}>Share Challenge</Text>
            </Pressable>

            <Pressable
              onPress={handleDone}
              style={({ pressed }) => [
                {
                  height: 52,
                  borderRadius: 26,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: t.border,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <Text style={[{ fontFamily: BODY_FONT, fontSize: 16, fontWeight: '600', color: t.text }]}>
                Done
              </Text>
            </Pressable>
          </Animated.View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <Animated.View entering={enter(0)} style={styles.header}>
            <Pressable
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.back();
              }}
              style={[
                styles.backBtn,
                { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <ChevronLeft size={18} color={t.text} />
            </Pressable>
            <Text style={[styles.pageTitle, { color: t.text }]}>Create Challenge</Text>
            <View style={{ width: 44 }} />
          </Animated.View>

          {/* Challenge Name */}
          <Animated.View entering={enter(60)}>
            <Text style={[styles.label, { color: t.textSecondary }]}>Challenge Name</Text>
            <View style={inputFieldStyle(isDark)}>
              <Trophy size={18} color={V1.coral} />
              <TextInput
                style={[styles.input, { color: t.text }]}
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. Weekly Cleaning Sprint"
                placeholderTextColor={t.textMuted}
                maxLength={100}
              />
            </View>
          </Animated.View>

          {/* Description */}
          <Animated.View entering={enter(100)}>
            <Text style={[styles.label, { color: t.textSecondary }]}>Description (optional)</Text>
            <View style={[inputFieldStyle(isDark), { height: 80, alignItems: 'flex-start', paddingTop: 12 }]}>
              <TextInput
                style={[styles.input, { color: t.text, flex: 1, textAlignVertical: 'top' }]}
                value={description}
                onChangeText={setDescription}
                placeholder="What's this challenge about?"
                placeholderTextColor={t.textMuted}
                maxLength={500}
                multiline
              />
            </View>
          </Animated.View>

          {/* Challenge Type */}
          <Animated.View entering={enter(140)}>
            <Text style={[styles.label, { color: t.textSecondary }]}>Challenge Type</Text>
            <View style={styles.typeRow}>
              {CHALLENGE_TYPES.map((ct) => {
                const isSelected = type === ct.key;
                const Icon = ct.icon;
                return (
                  <Pressable
                    key={ct.key}
                    onPress={() => {
                      void Haptics.selectionAsync();
                      setType(ct.key);
                      setTarget(String(DEFAULT_TARGETS[ct.key]));
                    }}
                    style={[
                      styles.typeCard,
                      cardStyle(isDark),
                      isSelected && {
                        borderColor: V1.coral,
                        borderWidth: 2,
                        backgroundColor: isDark ? 'rgba(255,107,107,0.08)' : 'rgba(255,107,107,0.05)',
                      },
                    ]}
                  >
                    <Icon size={20} color={isSelected ? V1.coral : t.textSecondary} />
                    <Text
                      style={[
                        styles.typeLabel,
                        { color: isSelected ? V1.coral : t.text },
                      ]}
                    >
                      {ct.label}
                    </Text>
                    <Text style={[styles.typeDesc, { color: t.textMuted }]}>{ct.description}</Text>
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>

          {/* Target Number */}
          <Animated.View entering={enter(180)}>
            <Text style={[styles.label, { color: t.textSecondary }]}>
              Target ({type === 'time_spent' ? 'minutes' : type === 'room_complete' ? 'rooms' : 'tasks'})
            </Text>
            <View style={inputFieldStyle(isDark)}>
              <Target size={18} color={V1.amber} />
              <TextInput
                style={[styles.input, { color: t.text }]}
                value={target}
                onChangeText={setTarget}
                placeholder="10"
                placeholderTextColor={t.textMuted}
                keyboardType="number-pad"
                maxLength={5}
              />
            </View>
          </Animated.View>

          {/* Duration */}
          <Animated.View entering={enter(220)}>
            <Text style={[styles.label, { color: t.textSecondary }]}>Duration</Text>
            <View style={styles.durationRow}>
              {DURATION_OPTIONS.map((opt) => {
                const isSelected = durationDays === opt.days;
                return (
                  <Pressable
                    key={opt.days}
                    onPress={() => {
                      void Haptics.selectionAsync();
                      setDurationDays(opt.days);
                    }}
                    style={[
                      styles.durationPill,
                      {
                        backgroundColor: isSelected
                          ? V1.coral
                          : isDark
                            ? 'rgba(255,255,255,0.06)'
                            : 'rgba(0,0,0,0.04)',
                        borderColor: isSelected ? V1.coral : t.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.durationText,
                        { color: isSelected ? '#FFFFFF' : t.textSecondary },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>

          {/* Create button */}
          <Animated.View entering={enter(260)} style={{ marginTop: 8 }}>
            <Pressable
              onPress={handleCreate}
              disabled={isSubmitting}
              style={({ pressed }) => [
                coralButtonStyle(),
                { opacity: pressed || isSubmitting ? 0.7 : 1 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Create challenge"
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={coralButtonTextStyle()}>Create Challenge</Text>
              )}
            </Pressable>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

export default function CreateChallengeScreen() {
  return (
    <ScreenErrorBoundary screenName="challenge-create">
      <CreateChallengeContent />
    </ScreenErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.screenPadding,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: {
    flex: 1,
    fontFamily: DISPLAY_FONT,
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  label: {
    fontFamily: BODY_FONT,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  input: {
    flex: 1,
    fontFamily: BODY_FONT,
    fontSize: 15,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  typeCard: {
    flex: 1,
    padding: 14,
    alignItems: 'center',
    gap: 6,
    borderRadius: RADIUS.md,
  },
  typeLabel: {
    fontFamily: BODY_FONT,
    fontSize: 13,
    fontWeight: '700',
  },
  typeDesc: {
    fontFamily: BODY_FONT,
    fontSize: 10,
    textAlign: 'center',
  },
  durationRow: {
    flexDirection: 'row',
    gap: 8,
  },
  durationPill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
  },
  durationText: {
    fontFamily: BODY_FONT,
    fontSize: 13,
    fontWeight: '600',
  },

  // Success
  successContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  successIcon: {
    marginBottom: 16,
  },
  successTitle: {
    fontFamily: DISPLAY_FONT,
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  successSubtitle: {
    fontFamily: BODY_FONT,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
});
