/**
 * Social & Challenges Screen
 * Convex-backed challenge hub with quick challenge templates
 * Simplified create form: title + type (auto-fill defaults)
 */

import { GlassButton } from '@/components/ui/GlassButton';
import { GlassCard } from '@/components/ui/GlassCard';
import { useAuth } from '@/context/AuthContext';
import {
    Challenge,
    ChallengeType,
    createChallenge,
    getMyChallenges,
    joinChallenge,
} from '@/services/social';
import { useTheme } from '@/theme/ThemeProvider';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    RefreshControl,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import Animated, {
    FadeInDown,
    SlideInRight,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useReducedMotion } from '@/hooks/useReducedMotion';

// Challenge type info
const CHALLENGE_TYPES: Record<ChallengeType, { icon: string; label: string; unit: string }> = {
  tasks_count: { icon: 'checkmark-done', label: 'Complete Tasks', unit: 'tasks' },
  time_spent: { icon: 'time', label: 'Time Spent', unit: 'minutes' },
  room_complete: { icon: 'home', label: 'Complete Room', unit: 'room' },
  streak: { icon: 'flame', label: 'Maintain Streak', unit: 'days' },
  collectibles: { icon: 'sparkles', label: 'Collect Items', unit: 'items' },
};

// Quick Challenge Templates
const QUICK_CHALLENGES: Array<{
  title: string;
  type: ChallengeType;
  target: number;
  duration: number;
  description: string;
  icon: string;
}> = [
  {
    title: '15-Minute Speed Clean',
    type: 'time_spent',
    target: 15,
    duration: 1,
    description: 'Spend 15 minutes cleaning as fast as you can!',
    icon: 'flash',
  },
  {
    title: 'Trash Bag Challenge',
    type: 'tasks_count',
    target: 5,
    duration: 3,
    description: 'Complete 5 tasks focused on clearing trash',
    icon: 'trash',
  },
  {
    title: 'Weekend Room Blitz',
    type: 'room_complete',
    target: 1,
    duration: 2,
    description: 'Fully clean one room over the weekend',
    icon: 'home',
  },
  {
    title: '7-Day Streak',
    type: 'streak',
    target: 7,
    duration: 7,
    description: 'Clean something every day for a week',
    icon: 'flame',
  },
];

// Challenge card component
function ChallengeCard({
  challenge,
  currentUserId,
}: {
  challenge: Challenge;
  currentUserId?: string;
}) {
  const { colors } = useTheme();
  const typeInfo = CHALLENGE_TYPES[challenge.type];
  const myProgress = challenge.participants.find(p => p.userId === currentUserId);
  const progressPercent = myProgress
    ? Math.min((myProgress.progress / challenge.target) * 100, 100)
    : 0;

  const daysLeft = Math.max(
    0,
    Math.ceil((challenge.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  );

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Join my Declutterly challenge: "${challenge.title}"! Use code: ${challenge.inviteCode}`,
      });
    } catch {
      // User cancelled share
    }
  };

  return (
    <GlassCard style={styles.challengeCard}>
      <View style={styles.challengeHeader}>
        <View style={[styles.typeIcon, { backgroundColor: colors.accentMuted }]}>
          <Ionicons name={typeInfo.icon as any} size={20} color={colors.primary} />
        </View>
        <View style={styles.challengeInfo}>
          <Text style={[styles.challengeTitle, { color: colors.text }]}>
            {challenge.title}
          </Text>
          <Text style={[styles.challengeDesc, { color: colors.textSecondary }]}>
            {challenge.description}
          </Text>
        </View>
        <Pressable
          onPress={handleShare}
          accessibilityRole="button"
          accessibilityLabel="Share challenge"
          hitSlop={8}
        >
          <Ionicons name="share-outline" size={22} color={colors.textSecondary} />
        </Pressable>
      </View>

      <View style={styles.challengeProgress}>
        <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${progressPercent}%`,
                backgroundColor: colors.primary,
              },
            ]}
          />
        </View>
        <View style={styles.progressLabels}>
          <Text style={[styles.progressText, { color: colors.textSecondary }]}>
            {myProgress?.progress || 0} / {challenge.target} {typeInfo.unit}
          </Text>
          <Text style={[styles.daysLeft, { color: colors.warning }]}>
            {daysLeft} days left
          </Text>
        </View>
      </View>

      <View style={styles.participantsRow}>
        <View style={styles.avatarStack}>
          {challenge.participants.slice(0, 3).map((p, i) => (
            <View
              key={p.userId}
              style={[
                styles.avatar,
                { backgroundColor: colors.primary, borderColor: colors.avatarBorder, marginLeft: i > 0 ? -8 : 0 },
              ]}
            >
              <Text style={[styles.avatarText, { color: colors.textOnPrimary }]}>
                {p.displayName.charAt(0).toUpperCase()}
              </Text>
            </View>
          ))}
        </View>
        <Text style={[styles.participantCount, { color: colors.textSecondary }]}>
          {challenge.participants.length} participant
          {challenge.participants.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <View style={styles.inviteCodeRow}>
        <Text style={[styles.inviteLabel, { color: colors.textSecondary }]}>
          Invite code:
        </Text>
        <Text style={[styles.inviteCode, { color: colors.primary }]}>
          {challenge.inviteCode}
        </Text>
      </View>
    </GlassCard>
  );
}

// Simplified Create Challenge Modal — just title + type
function CreateChallengeModal({
  visible,
  onClose,
  onCreate,
}: {
  visible: boolean;
  onClose: () => void;
  onCreate: (challenge: Omit<Challenge, 'id' | 'createdAt' | 'participants' | 'status' | 'inviteCode' | 'creatorId' | 'creatorName'>) => void;
}) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [title, setTitle] = useState('');
  const [type, setType] = useState<ChallengeType>('tasks_count');

  // Default values based on type
  const getDefaults = (t: ChallengeType) => {
    switch (t) {
      case 'tasks_count': return { target: 10, duration: 7, description: 'Complete tasks together!' };
      case 'time_spent': return { target: 60, duration: 7, description: 'Spend time cleaning together!' };
      case 'room_complete': return { target: 1, duration: 7, description: 'Finish a room together!' };
      case 'streak': return { target: 7, duration: 7, description: 'Build a streak together!' };
      case 'collectibles': return { target: 10, duration: 7, description: 'Collect items while cleaning!' };
    }
  };

  const handleCreate = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }

    const defaults = getDefaults(type);

    onCreate({
      type,
      title: title.trim(),
      description: defaults.description,
      target: defaults.target,
      startDate: new Date(),
      endDate: new Date(Date.now() + defaults.duration * 24 * 60 * 60 * 1000),
    });

    setTitle('');
    setType('tasks_count');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <BlurView
          intensity={isDark ? 40 : 80}
          tint={isDark ? 'dark' : 'light'}
          style={[styles.modalContent, { paddingTop: insets.top + 20 }]}
        >
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Create Challenge
            </Text>
            <Pressable
              onPress={() => {
                Haptics.selectionAsync();
                onClose();
              }}
              accessibilityRole="button"
              accessibilityLabel="Close modal"
              hitSlop={8}
              style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>

          <ScrollView style={styles.modalScroll}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              Title
            </Text>
            <TextInput
              style={[
                styles.modalInput,
                { color: colors.text, borderColor: colors.border },
              ]}
              placeholder="e.g., Weekend Cleaning Sprint"
              placeholderTextColor={colors.textTertiary}
              value={title}
              onChangeText={setTitle}
              accessibilityLabel="Challenge title"
            />

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              Challenge Type
            </Text>
            <View style={styles.typeGrid}>
              {(Object.keys(CHALLENGE_TYPES) as ChallengeType[]).map(t => (
                <Pressable
                  key={t}
                  style={[
                    styles.typeOption,
                    {
                      borderColor: type === t ? colors.primary : colors.border,
                      backgroundColor: type === t ? colors.accentMuted : 'transparent',
                    },
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setType(t);
                  }}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: type === t }}
                  accessibilityLabel={CHALLENGE_TYPES[t].label}
                >
                  <Ionicons
                    name={CHALLENGE_TYPES[t].icon as any}
                    size={20}
                    color={type === t ? colors.primary : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.typeLabel,
                      { color: type === t ? colors.primary : colors.textSecondary },
                    ]}
                  >
                    {CHALLENGE_TYPES[t].label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Auto-generated defaults info */}
            <View style={[styles.defaultsInfo, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
              <Text style={[styles.defaultsText, { color: colors.textSecondary }]}>
                Target: {getDefaults(type).target} {CHALLENGE_TYPES[type].unit} in {getDefaults(type).duration} days
              </Text>
            </View>

            <GlassButton
              title="Create Challenge"
              onPress={handleCreate}
              variant="primary"
              size="large"
              style={styles.createButton}
            />
          </ScrollView>
        </BlurView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function SocialScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { isAuthenticated, user } = useAuth();
  const reducedMotion = useReducedMotion();

  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [joinCode, setJoinCode] = useState('');

  const loadData = useCallback(async () => {
    try {
      setChallenges(await getMyChallenges());
    } catch {
      // Failed to load challenges
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated, loadData]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  const handleCreateChallenge = async (data: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const newChallenge = await createChallenge(
      data.type,
      data.title,
      data.description,
      data.target,
      Math.ceil((data.endDate.getTime() - data.startDate.getTime()) / (1000 * 60 * 60 * 24))
    );

    if (newChallenge) {
      setChallenges(prev => [newChallenge, ...prev]);
      setShowCreateModal(false);
      Alert.alert(
        'Challenge Created!',
        `Share code: ${newChallenge.inviteCode}`,
        [{ text: 'OK' }]
      );
    }
  };

  const handleQuickChallenge = async (template: typeof QUICK_CHALLENGES[0]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const newChallenge = await createChallenge(
      template.type,
      template.title,
      template.description,
      template.target,
      template.duration
    );

    if (newChallenge) {
      setChallenges(prev => [newChallenge, ...prev]);
      Alert.alert(
        'Challenge Created!',
        `Share code: ${newChallenge.inviteCode}`,
        [{ text: 'OK' }]
      );
    }
  };

  const handleJoinWithCode = async () => {
    if (!joinCode.trim()) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const challenge = await joinChallenge(joinCode.trim());
    if (challenge) {
      setChallenges(prev => [challenge, ...prev]);
      setJoinCode('');
      Alert.alert('Success', `Joined challenge: ${challenge.title}`);
      return;
    }

    Alert.alert('Error', 'Invalid code or challenge not found');
  };

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <LinearGradient
          colors={colors.backgroundGradient}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.emptyState, { paddingTop: insets.top + 80 }]}>
          <Ionicons name="people" size={64} color={colors.textTertiary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            Sign in to access social features
          </Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Create and join challenges with other declutterers.
          </Text>
          <GlassButton
            title="Sign In"
            onPress={() => router.push('/auth/login')}
            variant="primary"
            style={styles.signInButton}
          />
        </View>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <LinearGradient
          colors={colors.backgroundGradient}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.emptyState, { paddingTop: insets.top + 80 }]}>
          <Ionicons name="hourglass-outline" size={48} color={colors.textTertiary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            Loading...
          </Text>
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
        <Pressable
          style={styles.backButton}
          onPress={() => {
            Haptics.selectionAsync();
            router.back();
          }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Social
        </Text>
        <Pressable
          style={styles.addButton}
          onPress={() => {
            Haptics.selectionAsync();
            setShowCreateModal(true);
          }}
          accessibilityRole="button"
          accessibilityLabel="Create custom challenge"
        >
          <Ionicons name="add" size={24} color={colors.primary} />
        </Pressable>
      </View>

      {/* Quick Challenge Templates */}
      <Animated.View
        entering={reducedMotion ? undefined : FadeInDown.delay(50).springify()}
        style={styles.quickSection}
      >
        <Text style={[styles.quickTitle, { color: colors.text }]}>Quick Challenges</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickRow}
        >
          {QUICK_CHALLENGES.map((template, index) => (
            <Pressable
              key={template.title}
              onPress={() => handleQuickChallenge(template)}
              style={({ pressed }) => [
                styles.quickCard,
                {
                  backgroundColor: colors.accentMuted,
                  borderColor: colors.accent,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Start ${template.title} challenge`}
              accessibilityHint={template.description}
            >
              <Ionicons name={template.icon as any} size={24} color={colors.accent} />
              <Text style={[styles.quickCardTitle, { color: colors.text }]} numberOfLines={1}>
                {template.title}
              </Text>
              <Text style={[styles.quickCardDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                {template.description}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </Animated.View>

      {/* Join Code Input */}
      <Animated.View
        entering={reducedMotion ? undefined : FadeInDown.delay(100).springify()}
        style={styles.joinSection}
      >
        <View style={[styles.joinInput, { borderColor: colors.border }]}>
          <TextInput
            style={[styles.codeInput, { color: colors.text }]}
            placeholder="Enter invite code"
            placeholderTextColor={colors.textTertiary}
            value={joinCode}
            onChangeText={setJoinCode}
            autoCapitalize="characters"
            maxLength={8}
            accessibilityLabel="Invite code"
            accessibilityHint="Enter a code to join an existing challenge"
          />
          <Pressable
            style={[styles.joinButton, { backgroundColor: colors.primary }]}
            onPress={handleJoinWithCode}
            accessibilityRole="button"
            accessibilityLabel="Join with invite code"
            accessibilityHint="Join a challenge using the entered code"
          >
            <Text style={[styles.joinButtonText, { color: colors.textOnPrimary }]}>Join</Text>
          </Pressable>
        </View>
      </Animated.View>

      {/* Content */}
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 20 },
        ]}
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {challenges.length === 0 ? (
          <View style={styles.emptyTabState}>
            <Ionicons name="trophy-outline" size={48} color={colors.textTertiary} />
            <Text style={[styles.emptyTabText, { color: colors.textSecondary }]}>
              No challenges yet. Tap a quick challenge above to get started!
            </Text>
          </View>
        ) : (
          challenges.map((challenge, index) => (
            <Animated.View
              key={challenge.id}
              entering={reducedMotion ? undefined : SlideInRight.delay(index * 100).springify()}
            >
              <ChallengeCard
                challenge={challenge}
                currentUserId={user?.uid}
              />
            </Animated.View>
          ))
        )}
      </ScrollView>

      {/* Create Challenge Modal */}
      <CreateChallengeModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateChallenge}
      />
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
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Quick Challenge Templates
  quickSection: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  quickTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  quickRow: {
    gap: 10,
  },
  quickCard: {
    width: 150,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
  },
  quickCardTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  quickCardDesc: {
    fontSize: 11,
    lineHeight: 15,
  },
  joinSection: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  joinInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  codeInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    letterSpacing: 2,
  },
  joinButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 0,
    borderTopRightRadius: 11,
    borderBottomRightRadius: 11,
  },
  joinButtonText: {
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  challengeCard: {
    padding: 16,
  },
  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  typeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  challengeInfo: {
    flex: 1,
  },
  challengeTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  challengeDesc: {
    fontSize: 13,
  },
  challengeProgress: {
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressText: {
    fontSize: 12,
  },
  daysLeft: {
    fontSize: 12,
    fontWeight: '600',
  },
  participantsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  avatarStack: {
    flexDirection: 'row',
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  avatarText: {
    fontWeight: '600',
    fontSize: 12,
  },
  participantCount: {
    fontSize: 12,
  },
  inviteCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inviteLabel: {
    fontSize: 12,
  },
  inviteCode: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 2,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  signInButton: {
    minWidth: 150,
  },
  emptyTabState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTabText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  modalScroll: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  typeLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  defaultsInfo: {
    marginTop: 16,
    padding: 12,
    borderRadius: 10,
  },
  defaultsText: {
    fontSize: 13,
    textAlign: 'center',
  },
  createButton: {
    marginTop: 24,
    marginBottom: 40,
  },
});
