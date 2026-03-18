/**
 * Declutterly - Join Screen
 * Challenge invite code entry
 * Accessible via deep link: declutterly://join or https://declutterly.app/join
 */

import { ChevronLeft, Ticket, LogIn } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Keyboard,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassButton } from '@/components/ui/GlassButton';
import { GlassCard } from '@/components/ui/GlassCard';
import { AmbientBackdrop } from '@/components/ui/AmbientBackdrop';
import { ExpressiveStateView } from '@/components/ui/ExpressiveStateView';
import { useAuth } from '@/context/AuthContext';
import { joinChallenge } from '@/services/social';
import { useTheme } from '@/theme/ThemeProvider';
import { Typography } from '@/theme/typography';
import { Spacing } from '@/theme/spacing';
const ROUTES = {
  CHALLENGE: (id: string) => `/challenge/${id}` as const,
  AUTH: { LOGIN: '/auth/login' as const },
};

export default function JoinScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { isAuthenticated } = useAuth();
  const params = useLocalSearchParams<{ code?: string }>();

  const [code, setCode] = useState(params.code || '');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-focus on code input
  useEffect(() => {
    if (params.code) {
      setCode(params.code);
    }
  }, [params.code]);

  const handleJoin = async () => {
    const trimmedCode = code.trim().toUpperCase();

    if (!trimmedCode) {
      setError('Please enter an invite code');
      return;
    }

    if (trimmedCode.length < 6) {
      setError('Invite code is too short');
      return;
    }

    setIsJoining(true);
    setError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const challenge = await joinChallenge(trimmedCode);
      if (challenge) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          'Joined Challenge!',
          `You've joined "${challenge.title}"`,
          [
            {
              text: 'View Challenge',
              onPress: () => router.replace(ROUTES.CHALLENGE(challenge.id)),
            },
          ]
        );
        setIsJoining(false);
        return;
      }

      setError('Invalid code. Make sure the challenge code is correct and still active.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch (err) {
      if (__DEV__) console.info('Join error:', err);
      setError('Failed to join. Please try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsJoining(false);
    }
  };

  // Not authenticated state
  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <AmbientBackdrop isDark={isDark} variant="profile" />
        <LinearGradient
          colors={colors.backgroundGradient}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              Haptics.selectionAsync();
              router.back();
            }}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ChevronLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Join</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.authContainer}>
          <ExpressiveStateView
            isDark={isDark}
            kicker="CHALLENGE CODE"
            icon="lock-closed-outline"
            title="Sign in to join"
            description="Create an account or sign in to join challenges from a friend or your declutter circle."
            primaryLabel="Sign In"
            onPrimary={() => router.push(ROUTES.AUTH.LOGIN)}
            accentColors={['#D8D0FF', '#8B82FF', '#5B6DFF'] as const}
            style={styles.authCard}
          />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior="padding"
      style={{ flex: 1 }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <LinearGradient
            colors={colors.backgroundGradient}
            style={StyleSheet.absoluteFill}
          />

          {/* Header */}
          <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                Haptics.selectionAsync();
                router.back();
              }}
              accessibilityRole="button"
              accessibilityLabel="Go back"
          >
            <ChevronLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Join</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={[styles.content, { paddingBottom: insets.bottom + 16 }]}>
          <Animated.View entering={FadeInDown.delay(100).duration(350)}>
            <View style={styles.iconContainer}>
              <View style={[styles.iconCircle, { backgroundColor: colors.primary + '20' }]}>
                <Ticket size={48} color={colors.primary} />
              </View>
            </View>

            <Text style={[styles.title, { color: colors.text }]}>
              Join a Challenge
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Enter the code your friend shared. You will both earn XP for completing tasks together.
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).duration(350)}>
            <GlassCard style={styles.inputCard}>
              <TextInput
                style={[
                  styles.codeInput,
                  { color: colors.text, borderColor: error ? colors.error : colors.border },
                ]}
                placeholder="ABC123XY"
                placeholderTextColor={colors.textTertiary}
                value={code}
                onChangeText={(text) => {
                  setCode(text.toUpperCase());
                  setError(null);
                }}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={10}
                returnKeyType="done"
                onSubmitEditing={handleJoin}
                editable={!isJoining}
              />
              {error && (
                <Text style={[styles.errorText, { color: colors.error }]}>
                  {error}
                </Text>
              )}
            </GlassCard>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(300).duration(350)}>
            <GlassButton
              title={isJoining ? 'Joining...' : 'Join'}
              onPress={handleJoin}
              variant="primary"
              size="large"
              disabled={isJoining || !code.trim()}
              icon={
                isJoining ? (
                  <ActivityIndicator size="small" color={colors.textOnPrimary} />
                ) : (
                  <LogIn size={20} color={colors.textOnPrimary} />
                )
              }
              style={styles.joinButton}
            />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(400).duration(350)}>
            <Text style={[styles.helpText, { color: colors.textSecondary }]}>
              Codes are 8 characters and case-insensitive.{'\n'}
              Cleaning together makes it 3x more likely to stick.
            </Text>
          </Animated.View>
        </View>
      </View>
    </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    ...Typography.title3,
    textAlign: 'center',
  },
  placeholder: {
    width: 44,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxl,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(128,128,128,0.15)',
  },
  title: {
    ...Typography.title1,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.callout,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  inputCard: {
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  codeInput: {
    ...Typography.title1,
    textAlign: 'center',
    letterSpacing: 8,
    paddingVertical: 18,
    borderWidth: 2,
    borderRadius: 16,
  },
  errorText: {
    ...Typography.footnote,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  joinButton: {
    marginBottom: Spacing.lg,
  },
  helpText: {
    ...Typography.footnote,
    textAlign: 'center',
  },
  authContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  authTitle: {
    ...Typography.title3,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  authText: {
    ...Typography.subheadline,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  authButton: {
    minWidth: 150,
  },
  authCard: {
    width: '100%',
  },
});
