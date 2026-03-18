/**
 * Declutterly -- Profile Screen (V1 Pencil Design)
 * Profile card with avatar, mascot companion section,
 * quick stats, and upgrade banner.
 */

import { useAuth } from '@/context/AuthContext';
import { useDeclutter } from '@/context/DeclutterContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import {
  V1,
  BODY_FONT,
  DISPLAY_FONT,
  RADIUS,
  SPACING,
  cardStyle,
  getTheme,
  CARD_SHADOW,
} from '@/constants/designTokens';
import { Settings, ChevronRight, Flame, Star, Sparkles, Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const XP_PER_LEVEL = 500;

function getLevelTitle(level: number) {
  if (level >= 20) return 'Declutter Legend';
  if (level >= 15) return 'Master Organizer';
  if (level >= 10) return 'Space Transformer';
  if (level >= 7) return 'Tidy Explorer';
  if (level >= 5) return 'Tidy Champion';
  if (level >= 3) return 'Rising Declutterer';
  return 'Fresh Start';
}

function BarIndicator({
  isDark,
  label,
  value,
  maxValue,
  color,
}: {
  isDark: boolean;
  label: string;
  value: number;
  maxValue: number;
  color: string;
}) {
  const t = getTheme(isDark);
  const percent = Math.min(Math.round((value / maxValue) * 100), 100);

  return (
    <View style={styles.barRow}>
      <Text style={[styles.barLabel, { color: t.textSecondary }]}>{label}</Text>
      <View style={[styles.barTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
        <View style={[styles.barFill, { backgroundColor: color, width: `${Math.max(percent, 4)}%` }]} />
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const rawScheme = useColorScheme();
  const isDark = rawScheme === 'dark';
  const reducedMotion = useReducedMotion();
  const insets = useSafeAreaInsets();
  const { user, stats, rooms: rawRooms, mascot } = useDeclutter();
  const { user: authUser } = useAuth();

  const rooms = rawRooms ?? [];
  const streak = stats?.currentStreak ?? 0;
  const totalXP = stats?.xp ?? 0;
  const completedTasks = stats?.totalTasksCompleted ?? 0;
  const roomsDone =
    stats?.totalRoomsCleaned ??
    rooms.filter((room) => (room.tasks ?? []).length > 0 && (room.tasks ?? []).every((task) => task.completed))
      .length;

  const displayName = authUser?.displayName?.trim() || user?.name || 'Declutterer';
  const level = Math.floor(totalXP / XP_PER_LEVEL) + 1;
  const xpInLevel = totalXP % XP_PER_LEVEL;
  const progressPercent = Math.max(Math.round((xpInLevel / XP_PER_LEVEL) * 100), 4);

  const t = getTheme(isDark);
  const card = cardStyle(isDark);

  // Mascot data
  const mascotName = mascot?.name ?? 'Dusty';
  const mascotMood = mascot?.mood ?? 'happy';
  const mascotHappiness = mascot?.happiness ?? 70;
  const mascotEnergy = mascot?.energy ?? 60;
  const mascotHunger = mascot?.hunger ?? 50;

  const moodLabel = mascotMood === 'ecstatic' ? 'Ecstatic' :
    mascotMood === 'happy' ? 'Happy & energized' :
    mascotMood === 'content' ? 'Content' :
    mascotMood === 'neutral' ? 'Neutral' :
    mascotMood === 'sad' ? 'Needs attention' :
    mascotMood === 'sleepy' ? 'Sleepy' :
    mascotMood === 'excited' ? 'Excited' : 'Happy & energized';

  const enter = (delay: number) =>
    reducedMotion ? undefined : FadeInDown.duration(380).delay(delay);

  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 14, paddingBottom: insets.bottom + 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={enter(0)} style={styles.header}>
          <Text style={[styles.title, { color: t.text }]}>Profile</Text>
          <Pressable
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/settings');
            }}
            accessibilityRole="button"
            accessibilityLabel="Open settings"
            style={({ pressed }) => [
              styles.settingsBtn,
              {
                backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                borderColor: t.border,
                transform: [{ scale: pressed ? 0.93 : 1 }],
                opacity: pressed ? 0.78 : 1,
              },
            ]}
          >
            <Settings size={18} color={t.textSecondary} />
          </Pressable>
        </Animated.View>

        {/* Profile card */}
        <Animated.View entering={enter(60)}>
          <View style={[styles.profileCard, card]}>
            <View style={styles.profileRow}>
              <View style={[
                styles.avatar,
                isDark && {
                  shadowColor: V1.coral,
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 0 },
                },
              ]}>
                <LinearGradient
                  colors={isDark ? ['#CC5555', '#FF6B6B'] : ['#FF6B6B', '#FF8E8E']}
                  style={styles.avatarGradient}
                >
                  <Text style={styles.avatarInitial}>
                    {displayName.charAt(0).toUpperCase()}
                  </Text>
                </LinearGradient>
              </View>
              <View style={styles.profileInfo}>
                <Text style={[styles.profileName, { color: t.text }]}>{displayName}</Text>
                <Text style={[styles.profileLevel, { color: V1.coral }]}>
                  Level {level} {'\u00B7'} {getLevelTitle(level)}
                </Text>
                {/* XP bar */}
                <View style={[styles.xpTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
                  <LinearGradient
                    colors={[V1.coral, V1.gold]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.xpFill, { width: `${progressPercent}%` }]}
                  />
                </View>
                <Text style={[styles.xpText, { color: t.textSecondary }]}>
                  {xpInLevel} / {XP_PER_LEVEL} XP
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Your Companion */}
        <Animated.View entering={enter(120)}>
          <Text style={[styles.sectionTitle, { color: t.textSecondary }]}>Your Companion</Text>
          <View style={[styles.companionCard, card]}>
            <View style={styles.companionRow}>
              <LinearGradient
                colors={isDark ? ['#CC5555', '#FF6B6B'] : ['#FF6B6B', '#FF8E8E']}
                style={styles.companionAvatar}
              >
                <Sparkles size={24} color="#FFFFFF" />
              </LinearGradient>
              <View style={styles.companionInfo}>
                <Text style={[styles.companionName, { color: t.text }]}>{mascotName}</Text>
                <Text style={[styles.companionMood, { color: V1.green }]}>{moodLabel}</Text>
                <BarIndicator isDark={isDark} label="Happiness" value={mascotHappiness} maxValue={100} color={V1.green} />
                <BarIndicator isDark={isDark} label="Energy" value={mascotEnergy} maxValue={100} color={V1.blue} />
                <BarIndicator isDark={isDark} label="Hunger" value={mascotHunger} maxValue={100} color={V1.coral} />
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Quick Stats */}
        <Animated.View entering={enter(180)} style={styles.quickStats}>
          <View style={[
            styles.quickStatCard,
            card,
            { backgroundColor: isDark ? t.card : `rgba(255,107,107,0.04)` },
          ]}>
            <Flame size={18} color={V1.coral} />
            <Text style={[styles.quickStatValue, { color: V1.coral }]}>{streak}</Text>
            <Text style={[styles.quickStatLabel, { color: t.textSecondary }]}>Streak</Text>
          </View>
          <View style={[
            styles.quickStatCard,
            card,
            { backgroundColor: isDark ? t.card : `rgba(102,187,106,0.04)` },
          ]}>
            <Check size={18} color={V1.green} />
            <Text style={[styles.quickStatValue, { color: V1.green }]}>{roomsDone}</Text>
            <Text style={[styles.quickStatLabel, { color: t.textSecondary }]}>Rooms</Text>
          </View>
          <View style={[
            styles.quickStatCard,
            card,
            { backgroundColor: isDark ? t.card : `rgba(255,183,77,0.04)` },
          ]}>
            <Star size={18} color={V1.amber} />
            <Text style={[styles.quickStatValue, { color: V1.amber }]}>{completedTasks}</Text>
            <Text style={[styles.quickStatLabel, { color: t.textSecondary }]}>Tasks</Text>
          </View>
        </Animated.View>

        {/* Upgrade to Pro */}
        <Animated.View entering={enter(240)}>
          <Pressable
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push('/paywall');
            }}
            accessibilityRole="button"
            accessibilityLabel="Upgrade to Pro"
            style={({ pressed }) => [{ opacity: pressed ? 0.88 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}
          >
            <LinearGradient
              colors={isDark
                ? ['rgba(255,215,107,0.15)', 'rgba(255,183,77,0.08)']
                : ['rgba(255,215,107,0.18)', 'rgba(255,183,77,0.08)']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.proCard, { borderColor: isDark ? 'rgba(255,215,107,0.25)' : 'rgba(255,213,79,0.5)' }]}
            >
              <View style={styles.proStarWrap}>
                <Star size={22} color="#FFD54F" fill="#FFD54F" />
              </View>
              <View style={styles.proCopy}>
                <Text style={[styles.proTitle, { color: t.text }]}>Upgrade to Pro</Text>
                <Text style={[styles.proSubtitle, { color: t.textSecondary }]}>Unlock all features</Text>
              </View>
              <ChevronRight size={18} color={t.textMuted} />
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.screenPadding,
    gap: SPACING.sectionGap,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: DISPLAY_FONT,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  settingsBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Profile card
  profileCard: {
    padding: SPACING.cardPadding,
  },
  profileRow: {
    flexDirection: 'row',
    gap: 14,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
  },
  avatarGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#FFF8EF',
    fontFamily: DISPLAY_FONT,
    fontSize: 22,
    fontWeight: '700',
  },
  profileInfo: {
    flex: 1,
    gap: 4,
  },
  profileName: {
    fontFamily: DISPLAY_FONT,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  profileLevel: {
    fontFamily: BODY_FONT,
    fontSize: 13,
    fontWeight: '600',
  },
  xpTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 4,
  },
  xpFill: {
    height: '100%',
    borderRadius: 3,
    minWidth: 16,
  },
  xpText: {
    fontFamily: BODY_FONT,
    fontSize: 11,
    fontWeight: '500',
  },

  // Section title
  sectionTitle: {
    fontFamily: BODY_FONT,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 0,
  },

  // Companion card
  companionCard: {
    padding: SPACING.cardPadding,
  },
  companionRow: {
    flexDirection: 'row',
    gap: 14,
  },
  companionAvatar: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  companionInfo: {
    flex: 1,
    gap: 4,
  },
  companionName: {
    fontFamily: DISPLAY_FONT,
    fontSize: 17,
    fontWeight: '700',
  },
  companionMood: {
    fontFamily: BODY_FONT,
    fontSize: 12,
    fontWeight: '600',
  },

  // Bar indicators
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  barLabel: {
    fontFamily: BODY_FONT,
    fontSize: 11,
    fontWeight: '500',
    width: 55,
  },
  barTrack: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },

  // Quick stats
  quickStats: {
    flexDirection: 'row',
    gap: SPACING.itemGap,
  },
  quickStatCard: {
    flex: 1,
    padding: 14,
    alignItems: 'center',
    gap: 4,
  },
  quickStatValue: {
    fontFamily: DISPLAY_FONT,
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  quickStatLabel: {
    fontFamily: BODY_FONT,
    fontSize: 11,
    fontWeight: '500',
  },

  // Pro card
  proCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: 18,
  },
  proStarWrap: {
    shadowColor: '#FFD54F',
    shadowOpacity: 0.4,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  proCopy: {
    flex: 1,
    gap: 2,
  },
  proTitle: {
    fontFamily: BODY_FONT,
    fontSize: 15,
    fontWeight: '800',
  },
  proSubtitle: {
    fontFamily: BODY_FONT,
    fontSize: 12,
    fontWeight: '500',
  },
});
