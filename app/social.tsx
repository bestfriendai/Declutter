/**
 * Declutterly -- Social / Community Screen
 * Matches Pencil design: "Community" title + people icon,
 * weekly challenge card, your circle with avatars,
 * circle activity feed, grow your circle CTA.
 */

import { useAuth } from '@/context/AuthContext';
import { AmbientBackdrop } from '@/components/ui/AmbientBackdrop';
import { ExpressiveStateView } from '@/components/ui/ExpressiveStateView';
import {
  Challenge,
  Connection,
  getMyChallenges,
  getConnections,
} from '@/services/social';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { Users } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  FadeInDown,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ─────────────────────────────────────────────────────────────────────────────
// Avatar color palette for connections
// ─────────────────────────────────────────────────────────────────────────────
const AVATAR_COLORS = ['#FFFFFF', '#CCCCCC', '#999999', '#707070', '#B0B0B0', '#D0D0D0'];

function getAvatarColor(index: number): string {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

function getInitial(name: string): string {
  return (name.charAt(0) || '?').toUpperCase();
}

// ─────────────────────────────────────────────────────────────────────────────
// Weekly Challenge Card
// ─────────────────────────────────────────────────────────────────────────────
function WeeklyChallengeCard({ isDark, challenge, onPress }: { isDark: boolean; challenge: Challenge | null; onPress?: () => void }) {
  if (!challenge) {
    return (
      <LinearGradient
        colors={isDark
          ? ['#1A1A1A', '#151515', '#121212'] as const
          : ['#F5F5F5', '#F0F0F0', '#EBEBEB'] as const
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={[styles.challengeCard, {
          borderColor: isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.06)',
        }]}
      >
        <View style={styles.challengeHeaderRow}>
          <View style={[styles.challengeBadge, {
            backgroundColor: isDark ? 'rgba(255,255,255,0.13)' : 'rgba(0,0,0,0.06)',
          }]}>
            <Text style={{ fontSize: 12 }}>{'\u{1F3C6}'}</Text>
            <Text style={[styles.challengeBadgeText, {
              color: isDark ? 'rgba(255,255,255,0.56)' : 'rgba(0,0,0,0.5)',
            }]}>
              WEEKLY CHALLENGE
            </Text>
          </View>
        </View>
        <Text style={[styles.challengeTitle, {
          color: isDark ? 'rgba(255,255,255,0.38)' : 'rgba(0,0,0,0.4)',
          fontSize: 16,
        }]}>
          No active challenge
        </Text>
        <Text style={[styles.progressText, {
          color: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.3)',
        }]}>
          Create or join a challenge to get started
        </Text>
      </LinearGradient>
    );
  }

  // Compute progress from participants
  const myProgress = challenge.participants?.[0]?.progress ?? 0;
  const progressPercent = challenge.target > 0
    ? Math.min(100, Math.round((myProgress / challenge.target) * 100))
    : 0;

  // Compute days left
  const now = new Date();
  const end = new Date(challenge.endDate);
  const daysLeft = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`View challenge: ${challenge.title}`}
      style={({ pressed }) => [{ opacity: pressed && onPress ? 0.85 : 1 }]}
    >
      <LinearGradient
        colors={isDark
          ? ['#1A1A1A', '#151515', '#121212'] as const
          : ['#F5F5F5', '#F0F0F0', '#EBEBEB'] as const
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={[styles.challengeCard, {
          borderColor: isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.06)',
        }]}
      >
        {/* Badge */}
        <View style={styles.challengeHeaderRow}>
          <View style={[styles.challengeBadge, {
            backgroundColor: isDark ? 'rgba(255,255,255,0.13)' : 'rgba(0,0,0,0.06)',
          }]}>
            <Text style={{ fontSize: 12 }}>{'\u{1F3C6}'}</Text>
            <Text style={[styles.challengeBadgeText, {
              color: isDark ? 'rgba(255,255,255,0.56)' : 'rgba(0,0,0,0.5)',
            }]}>
              WEEKLY CHALLENGE
            </Text>
          </View>
          <View style={[styles.challengeTimeBadge, {
            backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
          }]}>
            <Text style={[styles.challengeTimeText, {
              color: isDark ? 'rgba(255,255,255,0.44)' : 'rgba(0,0,0,0.44)',
            }]}>
              {daysLeft === 0 ? 'Ends today' : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`}
            </Text>
          </View>
        </View>

        {/* Title */}
        <Text style={[styles.challengeTitle, {
          color: isDark ? '#FFFFFF' : '#1A1A1A',
        }]}>
          {challenge.title}
        </Text>

        {/* Progress bar + text */}
        <View style={styles.challengeProgress}>
          <View style={[styles.progressTrack, {
            backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
          }]}>
            <LinearGradient
              colors={['#FFFFFF', '#888888'] as const}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.progressFill, { width: `${progressPercent}%` }]}
            />
          </View>
          <View style={styles.challengeProgressRow}>
            <Text style={[styles.progressText, {
              color: isDark ? 'rgba(255,255,255,0.38)' : 'rgba(0,0,0,0.4)',
            }]}>
              {myProgress} of {challenge.target} complete
            </Text>
            <Text style={[styles.progressText, {
              color: isDark ? '#C4A87A' : '#8A6A3A',
              fontWeight: '600',
            }]}>
              {challenge.participants?.length ?? 1} participant{(challenge.participants?.length ?? 1) !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Your Circle Section
// ─────────────────────────────────────────────────────────────────────────────
function YourCircle({ isDark, onManage, connections }: { isDark: boolean; onManage: () => void; connections: Connection[] }) {
  if (connections.length === 0) {
    return (
      <View style={styles.circleSection}>
        <View style={styles.circleSectionHeader}>
          <Text style={[styles.circleSectionTitle, { color: isDark ? 'rgba(255,255,255,0.21)' : 'rgba(0,0,0,0.25)' }]}>
            YOUR CIRCLE
          </Text>
        </View>
        <View style={[styles.collectiveStats, {
          backgroundColor: isDark ? '#141414' : '#FFFFFF',
          borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
        }]}>
          <Text style={[styles.collectiveLabel, { color: '#707070' }]}>
            No connections yet
          </Text>
          <Text style={[styles.collectiveUnit, { color: isDark ? 'rgba(255,255,255,0.38)' : 'rgba(0,0,0,0.4)' }]}>
            Invite friends to build your accountability circle
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.circleSection}>
      {/* Header */}
      <View style={styles.circleSectionHeader}>
        <Text style={[styles.circleSectionTitle, { color: isDark ? 'rgba(255,255,255,0.21)' : 'rgba(0,0,0,0.25)' }]}>
          YOUR CIRCLE
        </Text>
        <Pressable
          onPress={onManage}
          accessibilityRole="button"
          accessibilityLabel="Manage circle"
        >
          <Text style={[styles.circleManage, {
            color: isDark ? '#FFFFFF' : '#1A1A1A',
          }]}>
            Manage
          </Text>
        </Pressable>
      </View>

      {/* Avatar row */}
      <View style={styles.avatarRow}>
        {connections.slice(0, 6).map((conn, idx) => (
          <View key={conn.userId} style={styles.avatarWrap}>
            <View style={[styles.circleAvatar, { backgroundColor: getAvatarColor(idx) }]}>
              <Text style={[styles.circleAvatarInitial, {
                color: isDark ? '#1A1A1A' : '#FFFFFF',
              }]}>
                {getInitial(conn.displayName)}
              </Text>
            </View>
            <View style={styles.avatarNameRow}>
              <View style={[styles.avatarDot, { backgroundColor: getAvatarColor(idx) }]} />
              <Text style={[styles.avatarName, {
                color: isDark ? '#FFFFFF' : '#1A1A1A',
              }]} numberOfLines={1}>
                {conn.displayName}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Collective stats */}
      <View style={[styles.collectiveStats, {
        backgroundColor: isDark ? '#141414' : '#FFFFFF',
        borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
      }]}>
        <Text style={[styles.collectiveLabel, { color: '#707070' }]}>
          Your circle
        </Text>
        <View style={styles.collectiveRow}>
          <Text style={[styles.collectiveValue, { color: isDark ? '#FFFFFF' : '#1A1A1A' }]}>{connections.length}</Text>
          <Text style={[styles.collectiveUnit, { color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }]}> connection{connections.length !== 1 ? 's' : ''}</Text>
        </View>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Circle Activity Feed
// ─────────────────────────────────────────────────────────────────────────────
function CircleActivity({ isDark, challenges }: { isDark: boolean; challenges: Challenge[] }) {
  // Build activity feed from real challenge data
  const activityItems = challenges.flatMap((challenge) =>
    (challenge.participants ?? []).map((p) => ({
      initial: getInitial(p.displayName),
      color: AVATAR_COLORS[Math.abs(p.displayName.charCodeAt(0)) % AVATAR_COLORS.length],
      message: p.completed
        ? `${p.displayName} completed "${challenge.title}"`
        : `${p.displayName} joined "${challenge.title}"`,
      time: p.completed && p.completedAt
        ? formatRelativeTime(p.completedAt)
        : formatRelativeTime(p.joined),
    }))
  ).slice(0, 5);

  if (activityItems.length === 0) {
    return (
      <View style={styles.activitySection}>
        <Text style={[styles.activityTitle, { color: isDark ? 'rgba(255,255,255,0.21)' : 'rgba(0,0,0,0.25)' }]}>
          CIRCLE ACTIVITY
        </Text>
        <Text style={{
          fontSize: 13,
          color: isDark ? 'rgba(255,255,255,0.38)' : 'rgba(0,0,0,0.4)',
        }}>
          Activity from your challenges and connections will appear here.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.activitySection}>
      <Text style={[styles.activityTitle, { color: isDark ? 'rgba(255,255,255,0.21)' : 'rgba(0,0,0,0.25)' }]}>
        CIRCLE ACTIVITY
      </Text>

      {activityItems.map((item, idx) => (
        <React.Fragment key={idx}>
          <View style={styles.feedItem}>
            <View style={[styles.feedAvatar, { backgroundColor: item.color }]}>
              <Text style={[styles.feedAvatarInitial, {
                color: isDark ? '#1A1A1A' : '#FFFFFF',
              }]}>
                {item.initial}
              </Text>
            </View>
            <View style={styles.feedContent}>
              <Text style={[styles.feedMessage, {
                color: isDark ? '#FFFFFF' : '#1A1A1A',
              }]} numberOfLines={1}>
                {item.message}
              </Text>
              <Text style={[styles.feedTime, { color: '#707070' }]}>
                {item.time}
              </Text>
            </View>
          </View>
          {idx < activityItems.length - 1 && (
            <View style={[styles.feedDivider, {
              backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
            }]} />
          )}
        </React.Fragment>
      ))}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Grow Your Circle CTA
// ─────────────────────────────────────────────────────────────────────────────
function GrowCircle({ isDark }: { isDark: boolean }) {
  return (
    <View style={[styles.inviteCard, {
      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#FFFFFF',
      borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
    }]}>
      <View style={styles.inviteLeft}>
        <Text style={[styles.inviteTitle, {
          color: isDark ? '#FFFFFF' : '#1A1A1A',
        }]}>
          Grow Your Circle
        </Text>
        <Text style={[styles.inviteDesc, {
          color: isDark ? 'rgba(255,255,255,0.38)' : 'rgba(0,0,0,0.45)',
        }]}>
          Invite a friend and you both earn +200 XP instantly. People who clean with a buddy stick with it 3x longer.
        </Text>
      </View>

      <Pressable
        onPress={async () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          try {
            await Share.share({
              message: 'Hey! Join me on Declutterly - it makes cleaning actually fun with AI + gamification. We both get +200 XP when you join. Download: https://declutterly.app/invite',
            });
          } catch {
            // User cancelled share
          }
        }}
        accessibilityRole="button"
        accessibilityLabel="Invite friend"
      >
        <LinearGradient
          colors={['#C4A87A', '#8A7A60'] as const}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.inviteBtn}
        >
          <Text style={styles.inviteBtnText}>Invite</Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// Relative time formatter
// ─────────────────────────────────────────────────────────────────────────────
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return `${Math.floor(diffDays / 7)}w ago`;
}

export default function SocialScreen() {
  const insets = useSafeAreaInsets();
  const rawScheme = useColorScheme();
  const colorScheme = rawScheme === 'dark' ? 'dark' : 'light';
  const isDark = colorScheme === 'dark';
  const { isAuthenticated } = useAuth();
  const reducedMotion = useReducedMotion();

  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [_isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [challengeData, connectionData] = await Promise.all([
        getMyChallenges(),
        getConnections(),
      ]);
      setChallenges(challengeData);
      setConnections(connectionData);
    } catch {
      // Failed to load
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

  // Active challenge = first in_progress challenge
  const activeChallenge = challenges.find(c => c.status === 'in_progress') ?? null;

  const handleManageCircle = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/accountability');
  }, []);

  const handleOpenAuth = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/auth/login');
  }, []);

  const enterAnim = (delay: number) =>
    reducedMotion ? undefined : FadeInDown.delay(delay).duration(350);

  if (!isAuthenticated) {
    return (
      <LinearGradient
        colors={isDark ? ['#0A0A0A', '#131313', '#141414'] : ['#FAFAFA', '#F7F7F7', '#F5F5F5']}
        style={styles.container}
      >
        <AmbientBackdrop isDark={isDark} variant="profile" />
        <View style={[styles.emptyState, { paddingTop: insets.top + 80 }]}>
          <ExpressiveStateView
            isDark={isDark}
            kicker="COMMUNITY"
            emoji="👥"
            title="Bring other people into the reset."
            description="Create challenges, invite friends, and make progress feel shared instead of lonely."
            primaryLabel="Sign In"
            onPrimary={handleOpenAuth}
            accentColors={isDark ? ['#D8D0FF', '#8B82FF', '#5B6DFF'] as const : ['#D5CEFF', '#9387FF', '#6572FF'] as const}
            style={styles.expressiveEmptyState}
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

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, {
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 16,
        }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header: Community + people icon */}
        <Animated.View entering={enterAnim(0)} style={styles.header}>
          <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#1A1A1A' }]}>
            Community
          </Text>
          <Pressable
            onPress={handleManageCircle}
            style={[styles.headerIcon, {
              backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
            }]}
            accessibilityRole="button"
            accessibilityLabel="People"
          >
            <Users
              size={20}
              color={isDark ? '#FFFFFF' : '#1A1A1A'}
            />
          </Pressable>
        </Animated.View>

        {/* Weekly Challenge */}
        <Animated.View entering={enterAnim(60)} style={styles.section}>
          <WeeklyChallengeCard
            isDark={isDark}
            challenge={activeChallenge}
            onPress={activeChallenge ? () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push(`/challenge/${activeChallenge.id}`);
            } : undefined}
          />
        </Animated.View>

        {/* Your Circle */}
        <Animated.View entering={enterAnim(120)} style={styles.section}>
          <YourCircle isDark={isDark} onManage={handleManageCircle} connections={connections} />
        </Animated.View>

        {/* Circle Activity */}
        <Animated.View entering={enterAnim(180)} style={styles.section}>
          <CircleActivity isDark={isDark} challenges={challenges} />
        </Animated.View>

        {/* Grow Your Circle */}
        <Animated.View entering={enterAnim(240)} style={styles.section}>
          <GrowCircle isDark={isDark} />
        </Animated.View>
      </ScrollView>
    </LinearGradient>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 20 },
  section: { marginBottom: 24 },

  // ── Header ──
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Challenge Card ──
  challengeCard: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    gap: 14,
  },
  challengeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  challengeBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  challengeTimeBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  challengeTimeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  challengeProgressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  challengeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  challengeTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  challengeProgress: {
    gap: 8,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '400',
  },

  // ── Your Circle ──
  circleSection: {
    gap: 16,
  },
  circleSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  circleSectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  circleManage: {
    fontSize: 13,
    fontWeight: '500',
  },
  avatarRow: {
    flexDirection: 'row',
    gap: 20,
  },
  avatarWrap: {
    alignItems: 'center',
    width: 48,
    gap: 4,
  },
  circleAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleAvatarInitial: {
    fontSize: 18,
    fontWeight: '600',
  },
  avatarNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  avatarDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  avatarName: {
    fontSize: 11,
    fontWeight: '400',
  },

  // ── Collective Stats ──
  collectiveStats: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  collectiveLabel: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  collectiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  collectiveValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  collectiveUnit: {
    fontSize: 14,
    fontWeight: '400',
  },
  collectiveSep: {
    fontSize: 16,
  },

  // ── Activity Feed ──
  activitySection: {
    gap: 12,
  },
  activityTitle: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  feedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  feedAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedAvatarInitial: {
    fontSize: 12,
    fontWeight: '600',
  },
  feedContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feedMessage: {
    fontSize: 13,
    fontWeight: '400',
    flex: 1,
  },
  feedTime: {
    fontSize: 11,
    fontWeight: '400',
    marginLeft: 8,
  },
  feedDivider: {
    height: 1,
  },

  // ── Invite Card ──
  inviteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  inviteLeft: {
    flex: 1,
    gap: 4,
  },
  inviteTitle: {
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: -0.3,
  },
  inviteDesc: {
    fontSize: 12,
    fontWeight: '400',
  },
  inviteBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // ── Empty State ──
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyButton: {
    marginTop: 20,
    height: 48,
    minWidth: 148,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  expressiveEmptyState: {
    width: '100%',
  },
});
