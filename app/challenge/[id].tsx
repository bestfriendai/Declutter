/**
 * Declutterly - Challenge Detail Screen
 * View and participate in a specific challenge
 * Accessible via deep link: declutterly://challenge/:id
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  RefreshControl,
  Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Share2, CheckCheck, Clock, Home, Flame, Gem, HelpCircle, Flag, Users, CircleCheck, TrendingUp, Plus } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, SlideInRight } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import * as Clipboard from 'expo-clipboard';
import { useAuth } from '@/context/AuthContext';
import { V1, BODY_FONT, DISPLAY_FONT, RADIUS, SPACING, cardStyle, getTheme } from '@/constants/designTokens';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { AmbientBackdrop } from '@/components/ui/AmbientBackdrop';
import { ExpressiveStateView } from '@/components/ui/ExpressiveStateView';
import { ScreenErrorBoundary } from '@/components/ErrorBoundary';
import {
  Challenge,
  ChallengeType,
  getChallengeById,
  joinChallenge,
} from '@/services/social';

// Challenge type info
const CHALLENGE_TYPES: Record<ChallengeType, { icon: React.FC<{size?: number; color?: string}>; label: string; unit: string }> = {
  tasks_count: { icon: CheckCheck, label: 'Complete Tasks', unit: 'tasks' },
  time_spent: { icon: Clock, label: 'Time Spent', unit: 'minutes' },
  room_complete: { icon: Home, label: 'Complete Room', unit: 'room' },
  streak: { icon: Flame, label: 'Maintain Streak', unit: 'days' },
  collectibles: { icon: Gem, label: 'Collect Items', unit: 'items' },
};

const LOAD_TIMEOUT_MS = 15000; // 15 seconds

function ChallengeDetailContent() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const rawScheme = useColorScheme();
  const isDark = rawScheme === 'dark';
  const reducedMotion = useReducedMotion();
  const colors = getTheme(isDark);
  const { isAuthenticated, user } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load challenge data with timeout
  const loadChallenge = useCallback(async () => {
    if (!id) {
      setError('Invalid challenge ID');
      setIsLoading(false);
      return;
    }

    try {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), LOAD_TIMEOUT_MS)
      );
      const data = await Promise.race([getChallengeById(id), timeoutPromise]);
      if (data) {
        setChallenge(data);
        setError(null);
      } else {
        setError('Challenge not found');
      }
    } catch (err) {
      if (__DEV__) {
        console.info('Error loading challenge:', err);
      }
      const isTimeout = err instanceof Error && err.message === 'timeout';
      setError(isTimeout ? 'Loading timed out. Please try again.' : 'Failed to load challenge');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    loadChallenge();
  }, [loadChallenge]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadChallenge();
  };

  const handleJoinChallenge = async () => {
    if (!challenge?.inviteCode) return;

    setIsJoining(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const joined = await joinChallenge(challenge.inviteCode);
      if (joined) {
        setChallenge(joined);
        Alert.alert('Success', `You've joined "${challenge.title}"!`);
      } else {
        Alert.alert('Error', 'Failed to join challenge. You may already be a participant.');
      }
    } catch {
      Alert.alert('Error', 'Failed to join challenge');
    } finally {
      setIsJoining(false);
    }
  };

  const handleShare = async () => {
    if (!challenge) return;

    try {
      await Share.share({
        message: `Join my Declutterly challenge: "${challenge.title}"! Use code: ${challenge.inviteCode}\n\nOr open this link: https://declutterly.app/challenge/${challenge.id}`,
      });
    } catch (err) {
      if (__DEV__) console.info('Share error:', err);
    }
  };

  // Check if current user is a participant
  const isParticipant = challenge?.participants.some(p => p.userId === user?.uid);
  const myProgress = challenge?.participants.find(p => p.userId === user?.uid);
  const progressPercent = myProgress && challenge
    ? Math.min((myProgress.progress / challenge.target) * 100, 100)
    : 0;

  const daysLeft = challenge
    ? Math.max(0, Math.ceil((challenge.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  const typeInfo = challenge ? CHALLENGE_TYPES[challenge.type] : null;

  // Loading state
  if (isLoading) {
    return (
      <LinearGradient
        colors={isDark ? ['#0A0A0A', '#131313', '#141414'] : ['#FAFAFA', '#F7F7F7', '#F5F5F5']}
        style={styles.container}
      >
        <AmbientBackdrop isDark={isDark} variant="profile" />
        <View style={[styles.stateContainer, { paddingTop: insets.top + 32 }]}>
          <ExpressiveStateView
            isDark={isDark}
            kicker="CHALLENGE"
            icon="trophy-outline"
            title="Loading challenge"
            description="Pulling in the latest progress, invite code, and leaderboard so this challenge opens with context."
            accentColors={isDark ? ['#D8D0FF', '#8B82FF', '#5B6DFF'] as const : ['#D5CEFF', '#9387FF', '#6572FF'] as const}
            style={styles.stateCard}
          />
        </View>
      </LinearGradient>
    );
  }

  // Error state
  if (error || !challenge) {
    return (
      <LinearGradient
        colors={isDark ? ['#0A0A0A', '#131313', '#141414'] : ['#FAFAFA', '#F7F7F7', '#F5F5F5']}
        style={styles.container}
      >
        <AmbientBackdrop isDark={isDark} variant="profile" />
        <View style={[styles.stateContainer, { paddingTop: insets.top + 32 }]}>
          <ExpressiveStateView
            isDark={isDark}
            kicker="CHALLENGE"
            icon="alert-circle-outline"
            title="Challenge unavailable"
            description={error || 'This challenge could not be loaded right now.'}
            primaryLabel="Go Back"
            onPrimary={() => router.back()}
            secondaryLabel="Open Community"
            onSecondary={() => router.replace('/social')}
            accentColors={isDark ? ['#FFD5C5', '#FF9A7A', '#FF746A'] as const : ['#FFD4C7', '#FFA07D', '#FF7A70'] as const}
            style={styles.stateCard}
          />
        </View>
      </LinearGradient>
    );
  }

  // Not authenticated state
  if (!isAuthenticated) {
    return (
      <LinearGradient
        colors={isDark ? ['#0A0A0A', '#131313', '#141414'] : ['#FAFAFA', '#F7F7F7', '#F5F5F5']}
        style={styles.container}
      >
        <AmbientBackdrop isDark={isDark} variant="profile" />
        <View style={[styles.stateContainer, { paddingTop: insets.top + 32 }]}>
          <ExpressiveStateView
            isDark={isDark}
            kicker="CHALLENGE"
            icon="lock-closed-outline"
            title="Sign in to join"
            description={`Create an account or sign in to participate in "${challenge.title}" and see the live leaderboard.`}
            primaryLabel="Sign In"
            onPrimary={() => router.push('/auth/login')}
            secondaryLabel="Go Back"
            onSecondary={() => router.back()}
            accentColors={isDark ? ['#D8D0FF', '#8B82FF', '#5B6DFF'] as const : ['#D5CEFF', '#9387FF', '#6572FF'] as const}
            style={styles.stateCard}
          />
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={isDark ? ['#0A0A0A', '#131313', '#141414'] : ['#FAFAFA', '#F7F7F7', '#F5F5F5']}
      style={styles.container}
    >

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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Challenge</Text>
        <Pressable
          style={styles.shareButton}
          onPress={handleShare}
          accessibilityRole="button"
          accessibilityLabel="Share challenge"
        >
          <Share2 size={22} color={colors.text} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { flexGrow: 1, paddingBottom: insets.bottom + 16 }]}
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Challenge Header Card */}
        <Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(100).duration(350)}>
          <View style={[cardStyle(isDark), styles.challengeCard]}>
            <View style={styles.challengeHeader}>
              <View style={[styles.typeIcon, { backgroundColor: V1.coral + '20' }]}>
                {typeInfo?.icon ? React.createElement(typeInfo.icon, { size: 28, color: V1.coral }) : <HelpCircle size={28} color={V1.coral} />}
              </View>
              <View style={styles.challengeInfo}>
                <Text style={[styles.challengeTitle, { color: colors.text }]}>
                  {challenge.title}
                </Text>
                <Text style={[styles.challengeType, { color: V1.coral }]}>
                  {typeInfo?.label}
                </Text>
              </View>
            </View>

            {challenge.description && (
              <Text style={[styles.description, { color: colors.textSecondary }]}>
                {challenge.description}
              </Text>
            )}

            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Flag size={16} color={colors.textSecondary} />
                <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                  {challenge.target} {typeInfo?.unit}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Clock size={16} color={daysLeft <= 3 ? V1.amber : colors.textSecondary} />
                <Text style={[styles.metaText, { color: daysLeft <= 3 ? V1.amber : colors.textSecondary }]}>
                  {daysLeft === 0 ? 'Last day!' : daysLeft === 1 ? '1 day left!' : `${daysLeft} days left`}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Users size={16} color={colors.textSecondary} />
                <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                  {challenge.participants.length} participant{challenge.participants.length !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>

            {/* Progress bar if participant */}
            {isParticipant && (
              <View style={styles.progressSection}>
                <View style={styles.progressHeader}>
                  <Text style={[styles.progressLabel, { color: colors.text }]}>Your Progress</Text>
                  <Text style={[styles.progressValue, { color: V1.coral }]}>
                    {myProgress?.progress || 0} / {challenge.target}
                  </Text>
                </View>
                <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${progressPercent}%`, backgroundColor: V1.coral },
                    ]}
                  />
                </View>
                {myProgress?.completed && (
                  <View style={styles.completedBadge}>
                    <CircleCheck size={16} color={V1.green} />
                    <Text style={[styles.completedText, { color: V1.green }]}>
                      Challenge Complete! You did it!
                    </Text>
                  </View>
                )}
                {!myProgress?.completed && progressPercent >= 50 && (
                  <View style={styles.completedBadge}>
                    <TrendingUp size={16} color={V1.amber} />
                    <Text style={[styles.completedText, { color: V1.amber }]}>
                      Over halfway! Keep pushing!
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Join button if not participant */}
            {!isParticipant && (
              <Pressable
                onPress={handleJoinChallenge}
                disabled={isJoining}
                style={[{
                  backgroundColor: V1.coral,
                  borderRadius: RADIUS.lg,
                  paddingVertical: 16,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 8,
                  opacity: isJoining ? 0.6 : 1,
                }, styles.joinButton]}
              >
                <Plus size={20} color="#FFFFFF" />
                <Text style={{ color: '#FFFFFF', fontSize: 17, fontWeight: '600' }}>
                  {isJoining ? 'Joining...' : 'Join Challenge'}
                </Text>
              </Pressable>
            )}
          </View>
        </Animated.View>

        {/* Invite Code */}
        <Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(200).duration(350)}>
          <View style={[cardStyle(isDark), styles.inviteCard]}>
            <Text style={[styles.inviteLabel, { color: colors.textSecondary }]}>
              Invite Code
            </Text>
            <Text style={[styles.inviteCode, { color: V1.coral }]}>
              {challenge.inviteCode}
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Pressable
                onPress={async () => {
                  if (challenge?.inviteCode) {
                    await Clipboard.setStringAsync(challenge.inviteCode);
                    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    Alert.alert('Copied!', 'Invite code copied to clipboard.');
                  }
                }}
                style={[styles.copyButton, { borderColor: colors.border }]}
                accessibilityRole="button"
                accessibilityLabel="Copy invite code to clipboard"
              >
                <Text style={[styles.copyText, { color: V1.coral }]}>Copy</Text>
              </Pressable>
              <Pressable
                onPress={handleShare}
                style={[styles.copyButton, { borderColor: colors.border }]}
                accessibilityRole="button"
                accessibilityLabel="Share invite code"
              >
                <Share2 size={18} color={V1.coral} />
                <Text style={[styles.copyText, { color: V1.coral }]}>Share</Text>
              </Pressable>
            </View>
          </View>
        </Animated.View>

        {/* Leaderboard */}
        <Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(300).duration(350)}>
          <Text style={[styles.sectionTitle, { color: isDark ? 'rgba(255,255,255,0.21)' : 'rgba(0,0,0,0.25)' }]}>LEADERBOARD</Text>
          {challenge.participants
            .sort((a, b) => b.progress - a.progress)
            .map((participant, index) => (
              <Animated.View
                key={participant.userId}
                entering={reducedMotion ? undefined : SlideInRight.delay(index * 50).duration(350)}
              >
                <View style={[cardStyle(isDark), styles.participantCard]}>
                  <View style={styles.rankBadge}>
                    <Text style={[styles.rankText, {
                      color: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : colors.textSecondary
                    }]}>
                      #{index + 1}
                    </Text>
                  </View>
                  <View style={[styles.avatar, { backgroundColor: V1.coral }]}>
                    <Text style={[styles.avatarText, { color: '#FFFFFF' }]}>
                      {participant.displayName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.participantInfo}>
                    <Text style={[styles.participantName, { color: colors.text }]}>
                      {participant.displayName}
                      {participant.userId === user?.uid && (
                        <Text style={{ color: colors.textSecondary }}> (You)</Text>
                      )}
                    </Text>
                    <View style={[styles.miniProgressBar, { backgroundColor: colors.border }]}>
                      <View
                        style={[
                          styles.miniProgressFill,
                          {
                            width: `${Math.min((participant.progress / challenge.target) * 100, 100)}%`,
                            backgroundColor: participant.completed ? V1.green : V1.coral,
                          },
                        ]}
                      />
                    </View>
                  </View>
                  <Text style={[styles.participantProgress, { color: colors.textSecondary }]}>
                    {participant.progress}/{challenge.target}
                  </Text>
                  {participant.completed && (
                    <CircleCheck size={20} color={V1.green} />
                  )}
                </View>
              </Animated.View>
            ))}
        </Animated.View>

        {/* Challenge Info */}
        <Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(400).duration(350)}>
          <View style={[cardStyle(isDark), styles.infoCard]}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Created by</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{challenge.creatorName}</Text>
            <Text style={[styles.infoLabel, { color: colors.textSecondary, marginTop: 12 }]}>
              Duration
            </Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {challenge.startDate.toLocaleDateString()} - {challenge.endDate.toLocaleDateString()}
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </LinearGradient>
  );
}

export default function ChallengeDetailScreen() {
  return (
    <ScreenErrorBoundary screenName="challenge/[id]">
      <ChallengeDetailContent />
    </ScreenErrorBoundary>
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
    backgroundColor: 'rgba(128,128,128,0.12)',
  },
  headerTitle: {
    flex: 1,
    fontFamily: DISPLAY_FONT,
    fontSize: 20, fontWeight: '600', lineHeight: 25,
    textAlign: 'center',
  },
  shareButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(128,128,128,0.12)',
  },
  placeholder: {
    width: 44,
  },
  stateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  stateCard: {
    width: '100%',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 16,
  },
  challengeCard: {
    padding: 20,
  },
  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  typeIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  challengeInfo: {
    flex: 1,
  },
  challengeTitle: {
    fontFamily: DISPLAY_FONT,
    fontSize: 22, fontWeight: '700', letterSpacing: -0.4, lineHeight: 28,
    marginBottom: 4,
  },
  challengeType: {
    fontFamily: BODY_FONT,
    fontSize: 15, fontWeight: '500', lineHeight: 20,
  },
  description: {
    fontFamily: BODY_FONT,
    fontSize: 17, fontWeight: '400', lineHeight: 22,
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 15, fontWeight: '400', lineHeight: 20,
  },
  progressSection: {
    marginTop: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 15, fontWeight: '500', lineHeight: 20,
  },
  progressValue: {
    fontSize: 15, fontWeight: '500', lineHeight: 20,
  },
  progressBar: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  completedText: {
    fontSize: 15, fontWeight: '500', lineHeight: 20,
  },
  joinButton: {
    marginTop: 16,
  },
  inviteCard: {
    padding: 16,
    alignItems: 'center',
  },
  inviteLabel: {
    fontSize: 12, fontWeight: '400', lineHeight: 16,
    marginBottom: 4,
  },
  inviteCode: {
    fontFamily: DISPLAY_FONT,
    fontSize: 28, fontWeight: '700', lineHeight: 34,
    letterSpacing: 4,
    marginBottom: 12,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    minHeight: 44,
  },
  copyText: {
    fontSize: 15, fontWeight: '500', lineHeight: 20,
  },
  sectionTitle: {
    fontFamily: BODY_FONT,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 12,
    marginTop: 8,
  },
  participantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    gap: 12,
  },
  rankBadge: {
    width: 32,
    alignItems: 'center',
  },
  rankText: {
    fontSize: 15, fontWeight: '500', lineHeight: 20,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 17, fontWeight: '600', lineHeight: 22,
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    fontSize: 15, fontWeight: '500', lineHeight: 20,
    marginBottom: 4,
  },
  miniProgressBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  miniProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  participantProgress: {
    fontSize: 12, fontWeight: '500', lineHeight: 16,
  },
  infoCard: {
    padding: 16,
  },
  infoLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '500',
  },
});
