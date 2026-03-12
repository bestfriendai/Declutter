/**
 * Social & Challenges Screen
 * Challenges, room sharing, and body doubling sessions
 */

import { GlassButton } from '@/components/ui/GlassButton';
import { GlassCard } from '@/components/ui/GlassCard';
import { useAuth } from '@/context/AuthContext';
import {
    BodyDoublingSession,
    Challenge,
    ChallengeType,
    SharedRoom,
    createChallenge,
    getActiveSessions,
    getMyChallenges,
    getSharedWithMe,
    joinBodyDoublingSession,
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

// Tab type
type SocialTab = 'challenges' | 'sessions' | 'shared';

// Challenge type info
const CHALLENGE_TYPES: Record<ChallengeType, { icon: string; label: string; unit: string }> = {
  tasks_count: { icon: 'checkmark-done', label: 'Complete Tasks', unit: 'tasks' },
  time_spent: { icon: 'time', label: 'Time Spent', unit: 'minutes' },
  room_complete: { icon: 'home', label: 'Complete Room', unit: 'room' },
  streak: { icon: 'flame', label: 'Maintain Streak', unit: 'days' },
  collectibles: { icon: 'sparkles', label: 'Collect Items', unit: 'items' },
};

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

// Body doubling session card
function SessionCard({
  session,
  onJoin,
}: {
  session: BodyDoublingSession;
  onJoin: () => void;
}) {
  const { colors } = useTheme();
  const activeCount = session.participants.filter(p => p.isActive).length;

  return (
    <GlassCard style={styles.sessionCard}>
      <View style={styles.sessionHeader}>
        <View style={[styles.liveIndicator, { backgroundColor: colors.success }]}>
          <Text style={[styles.liveText, { color: colors.textOnSuccess }]}>LIVE</Text>
        </View>
        <Text style={[styles.sessionTitle, { color: colors.text }]}>
          {session.title}
        </Text>
      </View>

      <Text style={[styles.sessionHost, { color: colors.textSecondary }]}>
        Hosted by {session.hostName}
      </Text>

      {session.description && (
        <Text style={[styles.sessionDesc, { color: colors.textSecondary }]}>
          {session.description}
        </Text>
      )}

      <View style={styles.sessionMeta}>
        <View style={styles.metaItem}>
          <Ionicons name="people" size={16} color={colors.textSecondary} />
          <Text style={[styles.metaText, { color: colors.textSecondary }]}>
            {activeCount} / {session.maxParticipants}
          </Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="time" size={16} color={colors.textSecondary} />
          <Text style={[styles.metaText, { color: colors.textSecondary }]}>
            {session.duration} min
          </Text>
        </View>
      </View>

      <GlassButton
        title="Join Session"
        onPress={onJoin}
        variant="primary"
        size="small"
        icon={<Ionicons name="enter" size={18} color={colors.textOnPrimary} />}
        style={styles.joinButton}
      />
    </GlassCard>
  );
}

// Create challenge modal
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
  const [description, setDescription] = useState('');
  const [type, setType] = useState<ChallengeType>('tasks_count');
  const [target, setTarget] = useState('10');
  const [duration, setDuration] = useState('7');

  const handleCreate = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }

    onCreate({
      type,
      title: title.trim(),
      description: description.trim(),
      target: parseInt(target) || 10,
      startDate: new Date(),
      endDate: new Date(Date.now() + (parseInt(duration) || 7) * 24 * 60 * 60 * 1000),
    });

    // Reset form
    setTitle('');
    setDescription('');
    setType('tasks_count');
    setTarget('10');
    setDuration('7');
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
            />

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              Description
            </Text>
            <TextInput
              style={[
                styles.modalInput,
                styles.textArea,
                { color: colors.text, borderColor: colors.border },
              ]}
              placeholder="Describe the challenge..."
              placeholderTextColor={colors.textTertiary}
              value={description}
              onChangeText={setDescription}
              multiline
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

            <View style={styles.inputRow}>
              <View style={styles.inputHalf}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                  Target ({CHALLENGE_TYPES[type].unit})
                </Text>
                <TextInput
                  style={[
                    styles.modalInput,
                    { color: colors.text, borderColor: colors.border },
                  ]}
                  placeholder="10"
                  placeholderTextColor={colors.textTertiary}
                  value={target}
                  onChangeText={setTarget}
                  keyboardType="number-pad"
                />
              </View>
              <View style={styles.inputHalf}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                  Duration (days)
                </Text>
                <TextInput
                  style={[
                    styles.modalInput,
                    { color: colors.text, borderColor: colors.border },
                  ]}
                  placeholder="7"
                  placeholderTextColor={colors.textTertiary}
                  value={duration}
                  onChangeText={setDuration}
                  keyboardType="number-pad"
                />
              </View>
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

  const [activeTab, setActiveTab] = useState<SocialTab>('challenges');
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [sessions, setSessions] = useState<BodyDoublingSession[]>([]);
  const [sharedRooms, setSharedRooms] = useState<SharedRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [joinCode, setJoinCode] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [challengesData, sessionsData, sharedData] = await Promise.all([
        getMyChallenges(),
        getActiveSessions(),
        getSharedWithMe(),
      ]);

      setChallenges(challengesData);
      setSessions(sessionsData);
      setSharedRooms(sharedData);
    } catch {
      // Failed to load social data — user will see empty state
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

  const handleJoinWithCode = async () => {
    if (!joinCode.trim()) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Try joining challenge first
    const challenge = await joinChallenge(joinCode.trim());
    if (challenge) {
      setChallenges(prev => [challenge, ...prev]);
      setJoinCode('');
      Alert.alert('Success', `Joined challenge: ${challenge.title}`);
      return;
    }

    // Try joining session
    const session = await joinBodyDoublingSession(joinCode.trim());
    if (session) {
      setSessions(prev => [session, ...prev]);
      setJoinCode('');
      Alert.alert('Success', `Joined session: ${session.title}`);
      return;
    }

    Alert.alert('Error', 'Invalid code or challenge/session not found');
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
            Create and join challenges, participate in body doubling sessions, and connect with other declutterers.
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
          accessibilityLabel="Create challenge"
        >
          <Ionicons name="add" size={24} color={colors.primary} />
        </Pressable>
      </View>

      {/* Join Code Input */}
      <Animated.View
        entering={FadeInDown.delay(100).springify()}
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
            maxLength={6}
          />
          <Pressable
            style={[styles.joinButton, { backgroundColor: colors.primary }]}
            onPress={handleJoinWithCode}
            accessibilityRole="button"
            accessibilityLabel="Join with invite code"
            accessibilityHint="Join a challenge or session using the entered code"
          >
            <Text style={[styles.joinButtonText, { color: colors.textOnPrimary }]}>Join</Text>
          </Pressable>
        </View>
      </Animated.View>

      {/* Tabs */}
      <Animated.View
        entering={FadeInDown.delay(150).springify()}
        style={styles.tabs}
      >
        {(['challenges', 'sessions', 'shared'] as SocialTab[]).map(tab => (
          <Pressable
            key={tab}
            style={[
              styles.tab,
              activeTab === tab && { backgroundColor: colors.accentMuted },
            ]}
            onPress={() => {
              Haptics.selectionAsync();
              setActiveTab(tab);
            }}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === tab }}
            accessibilityLabel={`${tab.charAt(0).toUpperCase() + tab.slice(1)} tab`}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === tab ? colors.primary : colors.textSecondary },
              ]}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </Pressable>
        ))}
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
        {activeTab === 'challenges' && (
          <>
            {challenges.length === 0 ? (
              <View style={styles.emptyTabState}>
                <Ionicons name="trophy-outline" size={48} color={colors.textTertiary} />
                <Text style={[styles.emptyTabText, { color: colors.textSecondary }]}>
                  No challenges yet. Create one to get started!
                </Text>
              </View>
            ) : (
              challenges.map((challenge, index) => (
                <Animated.View
                  key={challenge.id}
                  entering={SlideInRight.delay(index * 100).springify()}
                >
                  <ChallengeCard
                    challenge={challenge}
                    currentUserId={user?.uid}
                  />
                </Animated.View>
              ))
            )}
          </>
        )}

        {activeTab === 'sessions' && (
          <>
            {sessions.length === 0 ? (
              <View style={styles.emptyTabState}>
                <Ionicons name="videocam-outline" size={48} color={colors.textTertiary} />
                <Text style={[styles.emptyTabText, { color: colors.textSecondary }]}>
                  No active sessions. Start body doubling with friends!
                </Text>
              </View>
            ) : (
              sessions.map((session, index) => (
                <Animated.View
                  key={session.id}
                  entering={SlideInRight.delay(index * 100).springify()}
                >
                  <SessionCard
                    session={session}
                    onJoin={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      Alert.alert(
                        'Join Session',
                        `Join "${session.title}" hosted by ${session.hostName}?`,
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { 
                            text: 'Join', 
                            onPress: () => {
                              // In a real app, navigate to video/chat screen
                              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                              Alert.alert('Joined!', 'You are now in the session (simulated).'); 
                            } 
                          }
                        ]
                      );
                    }}
                  />
                </Animated.View>
              ))
            )}
          </>
        )}

        {activeTab === 'shared' && (
          <>
            {sharedRooms.length === 0 ? (
              <View style={styles.emptyTabState}>
                <Ionicons name="share-outline" size={48} color={colors.textTertiary} />
                <Text style={[styles.emptyTabText, { color: colors.textSecondary }]}>
                  No shared rooms. Ask friends to share their progress with you!
                </Text>
              </View>
            ) : (
              sharedRooms.map((room, index) => (
                <Animated.View
                  key={room.id}
                  entering={SlideInRight.delay(index * 100).springify()}
                >
                  <Pressable
                    onPress={() => {
                      Haptics.selectionAsync();
                      router.push(`/room/${room.id}`);
                    }}
                    style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
                  >
                    <GlassCard style={styles.sharedRoomCard}>
                      <View style={styles.sharedRoomHeader}>
                        <Text style={styles.sharedRoomEmoji}>{room.roomEmoji}</Text>
                        <View>
                          <Text style={[styles.sharedRoomName, { color: colors.text }]}>
                            {room.roomName}
                          </Text>
                          <Text style={[styles.sharedRoomOwner, { color: colors.textSecondary }]}>
                            Shared by {room.ownerName}
                          </Text>
                        </View>
                      </View>
                    </GlassCard>
                  </Pressable>
                </Animated.View>
              ))
            )}
          </>
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
    width: 40,
    height: 40,
    borderRadius: 20,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
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
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
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
  sessionCard: {
    padding: 16,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  liveIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '700',
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  sessionHost: {
    fontSize: 13,
    marginBottom: 6,
  },
  sessionDesc: {
    fontSize: 13,
    marginBottom: 12,
  },
  sessionMeta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 13,
  },
  sharedRoomCard: {
    padding: 16,
  },
  sharedRoomHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sharedRoomEmoji: {
    fontSize: 32,
  },
  sharedRoomName: {
    fontSize: 16,
    fontWeight: '600',
  },
  sharedRoomOwner: {
    fontSize: 13,
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
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
  inputRow: {
    flexDirection: 'row',
    gap: 16,
  },
  inputHalf: {
    flex: 1,
  },
  createButton: {
    marginTop: 32,
    marginBottom: 40,
  },
});
