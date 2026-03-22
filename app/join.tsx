/**
 * Declutterly - Join Screen
 * Challenge invite code entry
 * Accessible via deep link: declutterly://join or https://declutterly.app/join
 */

import { ChevronLeft, Ticket, LogIn, Clipboard as ClipboardIcon } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import * as ExpoClipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Keyboard,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { V1, BODY_FONT, DISPLAY_FONT, RADIUS, SPACING, cardStyle, getTheme } from '@/constants/designTokens';
import { AmbientBackdrop } from '@/components/ui/AmbientBackdrop';
import { ExpressiveStateView } from '@/components/ui/ExpressiveStateView';
import { useAuth } from '@/context/AuthContext';
import { joinChallenge } from '@/services/social';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useReducedMotion } from '@/hooks/useReducedMotion';
const ROUTES = {
  CHALLENGE: (id: string) => ({ pathname: '/challenge/[id]' as const, params: { id } }),
  AUTH: { LOGIN: '/auth/login' as const },
};

export default function JoinScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const rawScheme = useColorScheme();
  const isDark = rawScheme === 'dark';
  const reducedMotion = useReducedMotion();
  const colors = getTheme(isDark);
  const { isAuthenticated } = useAuth();
  const params = useLocalSearchParams<{ code?: string }>();

  const [code, setCode] = useState(params.code || '');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clipboardCode, setClipboardCode] = useState<string | null>(null);

  // Auto-focus on code input
  useEffect(() => {
    if (params.code) {
      setCode(params.code);
    }
  }, [params.code]);

  // Auto-detect clipboard code on mount
  useEffect(() => {
    (async () => {
      try {
        const hasString = await ExpoClipboard.hasStringAsync();
        if (hasString) {
          const text = await ExpoClipboard.getStringAsync();
          const trimmed = text.trim().toUpperCase();
          // Check if it looks like a challenge code (6-10 alphanumeric chars)
          if (trimmed.length >= 6 && trimmed.length <= 10 && /^[A-Z0-9]+$/.test(trimmed) && !code) {
            setClipboardCode(trimmed);
          }
        }
      } catch {
        // Clipboard access not available
      }
    })();
  }, []);

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
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const challenge = await joinChallenge(trimmedCode);
      if (challenge) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch (err) {
      if (__DEV__) console.info('Join error:', err);
      setError('Failed to join. Please try again.');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsJoining(false);
    }
  };

  // Not authenticated state
  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <AmbientBackdrop isDark={isDark} variant="profile" />
        <LinearGradient
          colors={isDark ? ['#0A0A0A', '#131313', '#141414'] as const : ['#FAFAFA', '#F7F7F7', '#F5F5F5'] as const}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <Pressable
            style={styles.backButton}
            onPress={() => {
              void Haptics.selectionAsync();
              router.back();
            }}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ChevronLeft size={24} color={colors.text} />
          </Pressable>
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
        <View style={[styles.container, { backgroundColor: colors.bg }]}>
          <LinearGradient
            colors={isDark ? ['#0A0A0A', '#131313', '#141414'] as const : ['#FAFAFA', '#F7F7F7', '#F5F5F5'] as const}
            style={StyleSheet.absoluteFill}
          />

          {/* Header */}
          <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
            <Pressable
              style={styles.backButton}
              onPress={() => {
                void Haptics.selectionAsync();
                router.back();
              }}
              accessibilityRole="button"
              accessibilityLabel="Go back"
          >
            <ChevronLeft size={24} color={colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Join</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={[styles.content, { paddingBottom: insets.bottom + 16 }]}>
          <Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(100).duration(350)}>
            <View style={styles.iconContainer}>
              <View style={[styles.iconCircle, { backgroundColor: V1.coral + '20' }]}>
                <Ticket size={48} color={V1.coral} />
              </View>
            </View>

            <Text style={[styles.title, { color: colors.text }]}>
              Join a Challenge
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Enter the code your friend shared. You will both earn XP for completing tasks together.
            </Text>
          </Animated.View>

          {/* Clipboard auto-paste banner */}
          {clipboardCode && !code && (
            <Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(150).duration(300)}>
              <Pressable
                onPress={() => {
                  setCode(clipboardCode);
                  setClipboardCode(null);
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                style={({ pressed }) => [{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  padding: 12,
                  borderRadius: 12,
                  backgroundColor: V1.coral + '12',
                  borderWidth: 1,
                  borderColor: V1.coral + '30',
                  marginBottom: 16,
                  opacity: pressed ? 0.8 : 1,
                }]}
                accessibilityRole="button"
                accessibilityLabel={`Paste code ${clipboardCode} from clipboard`}
              >
                <ClipboardIcon size={16} color={V1.coral} />
                <Text style={{ flex: 1, fontSize: 14, fontWeight: '500', color: colors.text }}>
                  Paste from clipboard: <Text style={{ fontWeight: '700', color: V1.coral }}>{clipboardCode}</Text>
                </Text>
              </Pressable>
            </Animated.View>
          )}

          <Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(200).duration(350)}>
            <View style={[cardStyle(isDark), styles.inputCard]}>
              <TextInput
                style={[
                  styles.codeInput,
                  { color: colors.text, borderColor: error ? '#FF453A' : colors.border },
                ]}
                placeholder="ABC123XY"
                placeholderTextColor={colors.textMuted}
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
                <Text style={[styles.errorText, { color: '#FF453A' }]}>
                  {error}
                </Text>
              )}
            </View>
          </Animated.View>

          <Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(300).duration(350)}>
            <Pressable
              onPress={handleJoin}
              disabled={isJoining || !code.trim()}
              style={[{
                backgroundColor: V1.coral,
                borderRadius: RADIUS.lg,
                paddingVertical: 16,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 8,
                opacity: (isJoining || !code.trim()) ? 0.6 : 1,
              }, styles.joinButton]}
            >
              {isJoining ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <LogIn size={20} color="#FFFFFF" />
              )}
              <Text style={{ color: '#FFFFFF', fontSize: 17, fontWeight: '600' }}>
                {isJoining ? 'Joining...' : 'Join'}
              </Text>
            </Pressable>
          </Animated.View>

          <Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(400).duration(350)}>
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
    fontFamily: DISPLAY_FONT,
    fontSize: 20, fontWeight: '600', lineHeight: 25,
    textAlign: 'center',
  },
  placeholder: {
    width: 44,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
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
    fontFamily: DISPLAY_FONT,
    fontSize: 28, fontWeight: '700', letterSpacing: -0.4, lineHeight: 34,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: BODY_FONT,
    fontSize: 16, fontWeight: '400', lineHeight: 21,
    textAlign: 'center',
    marginBottom: 32,
  },
  inputCard: {
    padding: 16,
    marginBottom: 24,
  },
  codeInput: {
    fontFamily: DISPLAY_FONT,
    fontSize: 28, fontWeight: '700', lineHeight: 34,
    textAlign: 'center',
    letterSpacing: 8,
    paddingVertical: 18,
    borderWidth: 2,
    borderRadius: 16,
  },
  errorText: {
    fontSize: 13, fontWeight: '400', lineHeight: 18,
    textAlign: 'center',
    marginTop: 12,
  },
  joinButton: {
    marginBottom: 24,
  },
  helpText: {
    fontSize: 13, fontWeight: '400', lineHeight: 18,
    textAlign: 'center',
  },
  authContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  authTitle: {
    fontSize: 20, fontWeight: '600', lineHeight: 25,
    marginTop: 16,
    marginBottom: 8,
  },
  authText: {
    fontSize: 15, fontWeight: '400', lineHeight: 20,
    textAlign: 'center',
    marginBottom: 24,
  },
  authButton: {
    minWidth: 150,
  },
  authCard: {
    width: '100%',
  },
});
