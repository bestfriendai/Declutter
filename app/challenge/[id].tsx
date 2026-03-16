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
  TouchableOpacity,
  Alert,
  RefreshControl,
  Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, SlideInRight } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/theme/ThemeProvider';
import { Typography } from '@/theme/typography';
import { Spacing, BorderRadius } from '@/theme/spacing';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { AmbientBackdrop } from '@/components/ui/AmbientBackdrop';
import { ExpressiveStateView } from '@/components/ui/ExpressiveStateView';
import {
  Challenge,
  ChallengeType,
  getChallengeById,
  joinChallenge,
} from '@/services/social';

// Challenge type info
const CHALLENGE_TYPES: Record<ChallengeType, { icon: string; label: string; unit: string }> = {
  tasks_count: { icon: 'checkmark-done', label: 'Complete Tasks', unit: 'tasks' },
  time_spent: { icon: 'time', label: 'Time Spent', unit: 'minutes' },
  room_complete: { icon: 'home', label: 'Complete Room', unit: 'room' },
  streak: { icon: 'flame', label: 'Maintain Streak', unit: 'days' },
  collectibles: { icon: 'diamond', label: 'Collect Items', unit: 'items' },
};

export default function ChallengeDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { isAuthenticated, user } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load challenge data
  const loadChallenge = useCallback(async () => {
    if (!id) {
      setError('Invalid challenge ID');
      setIsLoading(false);
      return;
    }

    try {
      const data = await getChallengeById(id);
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
      setError('Failed to load challenge');
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

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
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <AmbientBackdrop isDark={isDark} variant="profile" />
        <LinearGradient
          colors={colors.backgroundGradient}
          style={StyleSheet.absoluteFill}
        />
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
      </View>
    );
  }

  // Error state
  if (error || !challenge) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <AmbientBackdrop isDark={isDark} variant="profile" />
        <LinearGradient
          colors={colors.backgroundGradient}
          style={StyleSheet.absoluteFill}
        />
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
      </View>
    );
  }

  // Not authenticated state
  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <AmbientBackdrop isDark={isDark} variant="profile" />
        <LinearGradient
          colors={colors.backgroundGradient}
          style={StyleSheet.absoluteFill}
        />
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
      </View>
    );
  }

  return (
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
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Challenge</Text>
        <TouchableOpacity
          style={styles.shareButton}
          onPress={handleShare}
          accessibilityRole="button"
          accessibilityLabel="Share challenge"
        >
          <Ionicons name="share-outline" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Challenge Header Card */}
        <Animated.View entering={FadeInDown.delay(100).duration(350)}>
          <GlassCard style={styles.challengeCard}>
            <View style={styles.challengeHeader}>
              <View style={[styles.typeIcon, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name={typeInfo?.icon as any} size={28} color={colors.primary} />
              </View>
              <View style={styles.challengeInfo}>
                <Text style={[styles.challengeTitle, { color: colors.text }]}>
                  {challenge.title}
                </Text>
                <Text style={[styles.challengeType, { color: colors.primary }]}>
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
                <Ionicons name="flag" size={16} color={colors.textSecondary} />
                <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                  {challenge.target} {typeInfo?.unit}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="time" size={16} color={daysLeft <= 3 ? colors.warning : colors.textSecondary} />
                <Text style={[styles.metaText, { color: daysLeft <= 3 ? colors.warning : colors.textSecondary }]}>
                  {daysLeft === 0 ? 'Last day!' : daysLeft === 1 ? '1 day left!' : `${daysLeft} days left`}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="people" size={16} color={colors.textSecondary} />
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
                  <Text style={[styles.progressValue, { color: colors.primary }]}>
                    {myProgress?.progress || 0} / {challenge.target}
                  </Text>
                </View>
                <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${progressPercent}%`, backgroundColor: colors.primary },
                    ]}
                  />
                </View>
                {myProgress?.completed && (
                  <View style={styles.completedBadge}>
                    <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                    <Text style={[styles.completedText, { color: colors.success }]}>
                      Challenge Complete! You did it!
                    </Text>
                  </View>
                )}
                {!myProgress?.completed && progressPercent >= 50 && (
                  <View style={styles.completedBadge}>
                    <Ionicons name="trending-up" size={16} color={colors.warning} />
                    <Text style={[styles.completedText, { color: colors.warning }]}>
                      Over halfway! Keep pushing!
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Join button if not participant */}
            {!isParticipant && (
              <GlassButton
                title={isJoining ? 'Joining...' : 'Join Challenge'}
                onPress={handleJoinChallenge}
                variant="primary"
                size="large"
                disabled={isJoining}
                icon={<Ionicons name="add" size={20} color={colors.textOnPrimary} />}
                style={styles.joinButton}
              />
            )}
          </GlassCard>
        </Animated.View>

        {/* Invite Code */}
        <Animated.View entering={FadeInDown.delay(200).duration(350)}>
          <GlassCard style={styles.inviteCard}>
            <Text style={[styles.inviteLabel, { color: colors.textSecondary }]}>
              Invite Code
            </Text>
            <Text style={[styles.inviteCode, { color: colors.primary }]}>
              {challenge.inviteCode}
            </Text>
            <TouchableOpacity
              onPress={handleShare}
              style={[styles.copyButton, { borderColor: colors.border }]}
              accessibilityRole="button"
              accessibilityLabel="Share invite code"
            >
              <Ionicons name="share-social" size={18} color={colors.primary} />
              <Text style={[styles.copyText, { color: colors.primary }]}>Share</Text>
            </TouchableOpacity>
          </GlassCard>
        </Animated.View>

        {/* Leaderboard */}
        <Animated.View entering={FadeInDown.delay(300).duration(350)}>
          <Text style={styles.sectionTitle}>LEADERBOARD</Text>
          {challenge.participants
            .sort((a, b) => b.progress - a.progress)
            .map((participant, index) => (
              <Animated.View
                key={participant.userId}
                entering={SlideInRight.delay(index * 50).duration(350)}
              >
                <GlassCard style={styles.participantCard}>
                  <View style={styles.rankBadge}>
                    <Text style={[styles.rankText, {
                      color: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : colors.textSecondary
                    }]}>
                      #{index + 1}
                    </Text>
                  </View>
                  <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                    <Text style={[styles.avatarText, { color: colors.textOnPrimary }]}>
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
                            backgroundColor: participant.completed ? colors.success : colors.primary,
                          },
                        ]}
                      />
                    </View>
                  </View>
                  <Text style={[styles.participantProgress, { color: colors.textSecondary }]}>
                    {participant.progress}/{challenge.target}
                  </Text>
                  {participant.completed && (
                    <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                  )}
                </GlassCard>
              </Animated.View>
            ))}
        </Animated.View>

        {/* Challenge Info */}
        <Animated.View entering={FadeInDown.delay(400).duration(350)}>
          <GlassCard style={styles.infoCard}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Created by</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{challenge.creatorName}</Text>
            <Text style={[styles.infoLabel, { color: colors.textSecondary, marginTop: 12 }]}>
              Duration
            </Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {challenge.startDate.toLocaleDateString()} - {challenge.endDate.toLocaleDateString()}
            </Text>
          </GlassCard>
        </Animated.View>
      </ScrollView>
    </View>
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
    ...Typography.title3,
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
    ...Typography.title2,
    marginBottom: Spacing.xxs,
  },
  challengeType: {
    ...Typography.subheadlineMedium,
  },
  description: {
    ...Typography.body,
    marginBottom: Spacing.md,
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
    ...Typography.subheadline,
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
    ...Typography.subheadlineMedium,
  },
  progressValue: {
    ...Typography.subheadlineMedium,
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
    ...Typography.subheadlineMedium,
  },
  joinButton: {
    marginTop: 16,
  },
  inviteCard: {
    padding: 16,
    alignItems: 'center',
  },
  inviteLabel: {
    ...Typography.caption1,
    marginBottom: Spacing.xxs,
  },
  inviteCode: {
    ...Typography.title1,
    letterSpacing: 4,
    marginBottom: Spacing.sm,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.chip,
    borderWidth: 1,
    minHeight: 44,
  },
  copyText: {
    ...Typography.subheadlineMedium,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: '#808080',
    marginBottom: Spacing.sm,
    marginTop: Spacing.xs,
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
    ...Typography.subheadlineMedium,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...Typography.headline,
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    ...Typography.subheadlineMedium,
    marginBottom: Spacing.xxs,
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
    ...Typography.caption1Medium,
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
