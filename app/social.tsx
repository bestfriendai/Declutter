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
  getMyChallenges,
} from '@/services/social';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { Ionicons } from '@expo/vector-icons';
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
// Mock Circle Data (matching Pencil design)
// ─────────────────────────────────────────────────────────────────────────────
const CIRCLE_MEMBERS = [
  { name: 'Sarah', initial: 'S', color: '#FFFFFF', dotColor: '#FFFFFF' },
  { name: 'Jamie', initial: 'J', color: '#CCCCCC', dotColor: '#FFFFFF' },
  { name: 'Alex', initial: 'A', color: '#999999', dotColor: '#707070' },
  { name: 'Mia', initial: 'M', color: '#707070', dotColor: '#FFFFFF' },
];

const ACTIVITY_FEED = [
  { initial: 'J', color: '#CCCCCC', message: 'Jamie finished Kitchen Reset \u{1F389}', time: '2h ago' },
  { initial: 'S', color: '#FFFFFF', message: 'You completed 3 tasks in Bedroom', time: '5h ago' },
  { initial: 'A', color: '#999999', message: 'Alex started Living Room \u{1F9F9}', time: 'Yesterday' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Weekly Challenge Card
// ─────────────────────────────────────────────────────────────────────────────
function WeeklyChallengeCard({ isDark }: { isDark: boolean }) {
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
      {/* Badge */}
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

      {/* Title */}
      <Text style={[styles.challengeTitle, {
        color: isDark ? '#FFFFFF' : '#1A1A1A',
      }]}>
        Clean 5 rooms this week
      </Text>

      {/* Progress bar + text */}
      <View style={styles.challengeProgress}>
        <View style={[styles.progressTrack, {
          backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
        }]}>
          <LinearGradient
            colors={['#FFFFFF', '#888888'] as const}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progressFill, { width: '60%' }]}
          />
        </View>
        <Text style={[styles.progressText, {
          color: isDark ? 'rgba(255,255,255,0.38)' : 'rgba(0,0,0,0.4)',
        }]}>
          3 of 5 complete {'\u00B7'} 250 XP reward
        </Text>
      </View>
    </LinearGradient>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Your Circle Section
// ─────────────────────────────────────────────────────────────────────────────
function YourCircle({ isDark, onManage }: { isDark: boolean; onManage: () => void }) {
  return (
    <View style={styles.circleSection}>
      {/* Header */}
      <View style={styles.circleSectionHeader}>
        <Text style={[styles.circleSectionTitle, {
          color: isDark ? '#FFFFFF' : '#1A1A1A',
        }]}>
          Your Circle
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
        {CIRCLE_MEMBERS.map((member, idx) => (
          <View key={idx} style={styles.avatarWrap}>
            <View style={[styles.circleAvatar, { backgroundColor: member.color }]}>
              <Text style={[styles.circleAvatarInitial, {
                color: isDark ? '#1A1A1A' : '#FFFFFF',
              }]}>
                {member.initial}
              </Text>
            </View>
            <View style={styles.avatarNameRow}>
              <View style={[styles.avatarDot, { backgroundColor: member.dotColor }]} />
              <Text style={[styles.avatarName, {
                color: isDark ? '#FFFFFF' : '#1A1A1A',
              }]}>
                {member.name}
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
          Together this week
        </Text>
        <View style={styles.collectiveRow}>
          <Text style={[styles.collectiveValue, { color: isDark ? '#FFFFFF' : '#1A1A1A' }]}>23</Text>
          <Text style={[styles.collectiveUnit, { color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }]}> tasks</Text>
          <Text style={[styles.collectiveSep, { color: '#707070' }]}> {'\u00B7'} </Text>
          <Text style={[styles.collectiveValue, { color: isDark ? '#FFFFFF' : '#1A1A1A' }]}>4</Text>
          <Text style={[styles.collectiveUnit, { color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }]}> rooms</Text>
          <Text style={[styles.collectiveSep, { color: '#707070' }]}> {'\u00B7'} </Text>
          <Text style={[styles.collectiveValue, { color: isDark ? '#FFFFFF' : '#1A1A1A' }]}>12</Text>
          <Text style={[styles.collectiveUnit, { color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }]}> hours</Text>
        </View>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Circle Activity Feed
// ─────────────────────────────────────────────────────────────────────────────
function CircleActivity({ isDark }: { isDark: boolean }) {
  return (
    <View style={styles.activitySection}>
      <Text style={[styles.activityTitle, {
        color: isDark ? '#FFFFFF' : '#1A1A1A',
      }]}>
        Circle Activity
      </Text>

      {ACTIVITY_FEED.map((item, idx) => (
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
          {idx < ACTIVITY_FEED.length - 1 && (
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
      borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
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
          Invite a friend to clean together. Both earn +200 XP.
        </Text>
      </View>

      <Pressable
        onPress={async () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          try {
            await Share.share({
              message: 'Join me on Declutterly! We can clean together and earn XP. Download: https://declutterly.app/invite',
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
export default function SocialScreen() {
  const insets = useSafeAreaInsets();
  const rawScheme = useColorScheme();
  const colorScheme = rawScheme === 'dark' ? 'dark' : 'light';
  const isDark = colorScheme === 'dark';
  const { isAuthenticated } = useAuth();
  const reducedMotion = useReducedMotion();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_challenges, setChallenges] = useState<Challenge[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setChallenges(await getMyChallenges());
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

  const handleManageCircle = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/accountability');
  }, []);

  const handleOpenAuth = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/auth/login');
  }, []);

  const enterAnim = (delay: number) =>
    reducedMotion ? undefined : FadeInDown.delay(delay).springify();

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? '#0A0A0A' : '#FAFAFA' }]}>
        <AmbientBackdrop isDark={isDark} variant="profile" />
        <LinearGradient
          colors={isDark ? ['rgba(10,10,10,0.78)', 'rgba(20,20,20,0.96)'] as const : ['rgba(250,250,250,0.42)', 'rgba(245,245,245,0.92)'] as const}
          style={StyleSheet.absoluteFill}
        />
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
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0A0A0A' : '#FAFAFA' }]}>
      <LinearGradient
        colors={isDark ? ['#0A0A0A', '#141414'] as const : ['#FAFAFA', '#F5F5F5'] as const}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, {
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 100,
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
              backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
            }]}
            accessibilityRole="button"
            accessibilityLabel="People"
          >
            <Ionicons
              name="people-outline"
              size={20}
              color={isDark ? '#FFFFFF' : '#1A1A1A'}
            />
          </Pressable>
        </Animated.View>

        {/* Weekly Challenge */}
        <Animated.View entering={enterAnim(60)} style={styles.section}>
          <WeeklyChallengeCard isDark={isDark} />
        </Animated.View>

        {/* Your Circle */}
        <Animated.View entering={enterAnim(120)} style={styles.section}>
          <YourCircle isDark={isDark} onManage={handleManageCircle} />
        </Animated.View>

        {/* Circle Activity */}
        <Animated.View entering={enterAnim(180)} style={styles.section}>
          <CircleActivity isDark={isDark} />
        </Animated.View>

        {/* Grow Your Circle */}
        <Animated.View entering={enterAnim(240)} style={styles.section}>
          <GrowCircle isDark={isDark} />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },
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
  challengeBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
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
    fontSize: 17,
    fontWeight: '500',
    letterSpacing: -0.3,
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
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: -0.3,
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
