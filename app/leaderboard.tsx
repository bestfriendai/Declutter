/**
 * Declutterly -- Leaderboard Detail Screen
 * Full weekly league view with all 30 participants,
 * promotion/relegation zones, and user's position.
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
} from '@/constants/designTokens';
import { useWeeklyLeaderboard, useUserLeague } from '@/hooks/useConvex';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { ChevronLeft, ArrowUp, ArrowDown, Shield } from 'lucide-react-native';
import React, { useMemo, useRef } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const LEAGUE_EMOJIS: Record<string, string> = {
  bronze: '\u{1F949}',
  silver: '\u{1F948}',
  gold: '\u{1F947}',
  diamond: '\u{1F48E}',
  champion: '\u{1F451}',
};

const LEAGUE_COLORS: Record<string, string> = {
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#FFD700',
  diamond: '#B9F2FF',
  champion: '#FF6B6B',
};

interface LeaderboardEntry {
  _id: string;
  userId: string;
  userName: string;
  userEmoji: string;
  xpEarned: number;
  tasksCompleted: number;
  rank: number;
}

function LeaderboardContent() {
  const rawScheme = useColorScheme();
  const isDark = rawScheme === 'dark';
  const reducedMotion = useReducedMotion();
  const insets = useSafeAreaInsets();
  const t = getTheme(isDark);
  const flatListRef = useRef<FlatList>(null);

  const leaderboard = useWeeklyLeaderboard();
  const userLeague = useUserLeague();

  const league = leaderboard?.league ?? userLeague?.league ?? 'bronze';
  const leagueEmoji = LEAGUE_EMOJIS[league] ?? '\u{1F949}';
  const leagueColor = LEAGUE_COLORS[league] ?? '#CD7F32';
  const entries = leaderboard?.entries ?? [];
  const totalParticipants = leaderboard?.totalParticipants ?? entries.length;
  const userRank = leaderboard?.userRank;

  // Determine promotion/relegation thresholds
  const promoteCount = Math.max(1, Math.floor(totalParticipants * 0.1));
  const relegateStart = totalParticipants - Math.max(1, Math.floor(totalParticipants * 0.1));

  const isPromotion = (rank: number) => rank <= Math.min(promoteCount, 5);
  const isRelegation = (rank: number) => rank > Math.max(relegateStart, totalParticipants - 5);
  const isUserRow = (entry: LeaderboardEntry) =>
    leaderboard?.userEntry && entry.userId === leaderboard.userEntry.userId;

  const enter = (delay: number) =>
    reducedMotion ? undefined : FadeInDown.delay(delay).duration(350);

  if (leaderboard === undefined) {
    return (
      <View style={[styles.container, { backgroundColor: t.bg }]}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={t.text} />
        </View>
      </View>
    );
  }

  const renderItem = ({ item, index }: { item: LeaderboardEntry; index: number }) => {
    const rank = item.rank;
    const promotion = isPromotion(rank);
    const relegation = isRelegation(rank);
    const isMe = isUserRow(item);

    let rowBg = 'transparent';
    if (isMe) {
      rowBg = isDark ? 'rgba(255,107,107,0.12)' : 'rgba(255,107,107,0.08)';
    } else if (promotion) {
      rowBg = isDark ? 'rgba(102,187,106,0.08)' : 'rgba(102,187,106,0.06)';
    } else if (relegation) {
      rowBg = isDark ? 'rgba(255,183,77,0.08)' : 'rgba(255,183,77,0.06)';
    }

    return (
      <View
        style={[
          styles.row,
          {
            backgroundColor: rowBg,
            borderColor: isMe ? V1.coral + '30' : 'transparent',
            borderWidth: isMe ? 1 : 0,
          },
        ]}
      >
        {/* Rank */}
        <View style={styles.rankCol}>
          {promotion && <ArrowUp size={10} color={V1.green} style={{ marginBottom: 1 }} />}
          {relegation && <ArrowDown size={10} color={V1.amber} style={{ marginBottom: 1 }} />}
          <Text
            style={[
              styles.rankText,
              {
                color: rank <= 3 ? leagueColor : t.textSecondary,
                fontWeight: rank <= 3 ? '800' : '600',
              },
            ]}
          >
            {rank}
          </Text>
        </View>

        {/* Avatar + Name */}
        <View style={styles.nameCol}>
          <View
            style={[
              styles.avatar,
              { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' },
            ]}
          >
            <Text style={{ fontSize: 16 }}>{item.userEmoji}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={[
                styles.nameText,
                { color: isMe ? V1.coral : t.text, fontWeight: isMe ? '700' : '500' },
              ]}
              numberOfLines={1}
            >
              {item.userName}
              {isMe ? ' (You)' : ''}
            </Text>
            <Text style={[styles.tasksText, { color: t.textMuted }]}>
              {item.tasksCompleted} tasks
            </Text>
          </View>
        </View>

        {/* XP */}
        <Text
          style={[
            styles.xpText,
            { color: rank <= 3 ? leagueColor : t.textSecondary },
          ]}
        >
          {item.xpEarned} XP
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
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
        <Text style={[styles.pageTitle, { color: t.text }]}>Weekly League</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* League badge */}
      <Animated.View entering={enter(0)} style={styles.leagueBanner}>
        <Text style={{ fontSize: 40 }}>{leagueEmoji}</Text>
        <Text style={[styles.leagueName, { color: leagueColor }]}>
          {league.charAt(0).toUpperCase() + league.slice(1)} League
        </Text>
        <Text style={[styles.leagueSubtext, { color: t.textSecondary }]}>
          {totalParticipants} participants this week
        </Text>
        {userRank && (
          <View style={[styles.userRankBadge, { backgroundColor: V1.coral + '15' }]}>
            <Text style={[styles.userRankText, { color: V1.coral }]}>
              Your rank: #{userRank}
            </Text>
          </View>
        )}
      </Animated.View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <ArrowUp size={12} color={V1.green} />
          <Text style={[styles.legendText, { color: t.textMuted }]}>Promotion zone</Text>
        </View>
        <View style={styles.legendItem}>
          <ArrowDown size={12} color={V1.amber} />
          <Text style={[styles.legendText, { color: t.textMuted }]}>Relegation zone</Text>
        </View>
      </View>

      {/* Leaderboard list */}
      {entries.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: t.textSecondary }]}>
            No entries yet this week. Complete tasks to appear on the leaderboard!
          </Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={entries}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ paddingHorizontal: SPACING.screenPadding, paddingBottom: insets.bottom + 24 }}
          showsVerticalScrollIndicator={false}
          initialScrollIndex={
            userRank && userRank > 10 ? Math.min(userRank - 1, entries.length - 1) : undefined
          }
          getItemLayout={(_, index) => ({
            length: 64,
            offset: 64 * index,
            index,
          })}
          onScrollToIndexFailed={() => {}}
        />
      )}
    </View>
  );
}

export default function LeaderboardScreen() {
  return (
    <ScreenErrorBoundary screenName="leaderboard">
      <LeaderboardContent />
    </ScreenErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: SPACING.screenPadding,
    paddingBottom: 8,
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

  // League banner
  leagueBanner: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 4,
  },
  leagueName: {
    fontFamily: DISPLAY_FONT,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  leagueSubtext: {
    fontFamily: BODY_FONT,
    fontSize: 13,
    fontWeight: '500',
  },
  userRankBadge: {
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
  },
  userRankText: {
    fontFamily: BODY_FONT,
    fontSize: 14,
    fontWeight: '700',
  },

  // Legend
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    paddingBottom: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendText: {
    fontFamily: BODY_FONT,
    fontSize: 11,
    fontWeight: '500',
  },

  // Row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
    marginBottom: 4,
    height: 64,
  },
  rankCol: {
    width: 36,
    alignItems: 'center',
  },
  rankText: {
    fontFamily: DISPLAY_FONT,
    fontSize: 16,
  },
  nameCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameText: {
    fontFamily: BODY_FONT,
    fontSize: 14,
  },
  tasksText: {
    fontFamily: BODY_FONT,
    fontSize: 11,
  },
  xpText: {
    fontFamily: DISPLAY_FONT,
    fontSize: 15,
    fontWeight: '700',
    minWidth: 60,
    textAlign: 'right',
  },

  // Empty
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontFamily: BODY_FONT,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
