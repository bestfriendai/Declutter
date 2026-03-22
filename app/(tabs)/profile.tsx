/**
 * Declutterly -- Profile Screen (V1 Pencil Design)
 * Profile card with avatar, mascot companion section,
 * quick stats, comeback banner, quick nav, league badge, and upgrade banner.
 */

import { XP_PER_LEVEL } from '@/constants/app';
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
  ANIMATION,
} from '@/constants/designTokens';
import { Settings, ChevronRight, Flame, Star, Check, Award, Gem, BarChart3, Trophy, Camera, Shield } from 'lucide-react-native';
import { useSubscription } from '@/hooks/useSubscription';
import { MascotAvatar } from '@/components/ui/MascotAvatar';
import { getWelcomeBackMessage } from '@/services/comebackEngine';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ScreenErrorBoundary } from '@/components/ErrorBoundary';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
  useAnimatedStyle,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@/constants/storageKeys';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

// Adventure system constants
const ADVENTURE_DURATION_MS = 8 * 60 * 60 * 1000; // 8 hours

function getLevelTitle(level: number) {
  if (level >= 20) return 'Declutter Legend';
  if (level >= 15) return 'Master Organizer';
  if (level >= 10) return 'Space Transformer';
  if (level >= 7) return 'Tidy Explorer';
  if (level >= 5) return 'Tidy Champion';
  if (level >= 3) return 'Rising Declutterer';
  return 'Fresh Start';
}

const BarIndicator = React.memo(function BarIndicator({
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
    <View style={styles.barRow} accessibilityLabel={`${label}: ${percent} percent`}>
      <Text style={[styles.barLabel, { color: t.textSecondary }]}>{label}</Text>
      <View style={[styles.barTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
        <View style={[styles.barFill, { backgroundColor: color, width: `${Math.max(percent, 4)}%` }]} />
      </View>
    </View>
  );
});

// Animated stat counter
function AnimatedStat({ value, color, label, icon }: {
  value: number;
  color: string;
  label: string;
  icon: React.ReactNode;
}) {
  const animatedValue = useSharedValue(0);

  useEffect(() => {
    animatedValue.value = withTiming(value, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });
  }, [value]);

  const animatedProps = useAnimatedProps(() => ({
    text: String(Math.round(animatedValue.value)),
    defaultValue: '0',
  }));

  return (
    <View accessibilityLabel={`${label}: ${value}`}>
      {icon}
      <AnimatedTextInput
        underlineColorAndroid="transparent"
        editable={false}
        animatedProps={animatedProps}
        style={[styles.quickStatValue, { color }]}
      />
      <Text style={[styles.quickStatLabel, { color: 'rgba(128,128,128,0.7)' }]}>{label}</Text>
    </View>
  );
}

// Comeback welcome banner
function ComebackBanner({ isDark }: { isDark: boolean }) {
  const { stats } = useDeclutter();
  const t = getTheme(isDark);

  // Determine if user is returning (last activity > 2 days ago)
  const daysSinceActivity = useMemo(() => {
    if (!stats?.lastActivityDate) return 0;
    const diff = Date.now() - new Date(stats.lastActivityDate).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }, [stats?.lastActivityDate]);

  if (daysSinceActivity < 2) return null;

  const { message, submessage, emoji, bonusActive } = getWelcomeBackMessage(daysSinceActivity);

  return (
    <LinearGradient
      colors={isDark
        ? ['rgba(255,213,79,0.12)', 'rgba(255,183,77,0.06)']
        : ['rgba(255,213,79,0.15)', 'rgba(255,183,77,0.08)']
      }
      style={{
        borderRadius: RADIUS.lg,
        padding: 18,
        borderWidth: 1,
        borderColor: isDark ? 'rgba(255,213,79,0.2)' : 'rgba(255,213,79,0.35)',
        gap: 8,
      }}
    >
      <Text style={{ fontSize: 28, textAlign: 'center' }}>{emoji}</Text>
      <Text style={{
        fontFamily: DISPLAY_FONT, fontSize: 18, fontWeight: '700',
        color: t.text, textAlign: 'center',
      }}>
        {message}
      </Text>
      <Text style={{
        fontFamily: BODY_FONT, fontSize: 14, color: t.textSecondary, textAlign: 'center',
      }}>
        {submessage}
      </Text>
      {bonusActive && (
        <View style={{
          backgroundColor: V1.gold + '20',
          borderRadius: RADIUS.sm,
          paddingVertical: 6, paddingHorizontal: 12,
          alignSelf: 'center', marginTop: 4,
        }}>
          <Text style={{
            fontFamily: BODY_FONT, fontSize: 12, fontWeight: '700',
            color: V1.gold, textAlign: 'center',
          }}>
            Comeback bonus XP active!
          </Text>
        </View>
      )}
    </LinearGradient>
  );
}

// Quick navigation strip
function QuickNavStrip({ isDark }: { isDark: boolean }) {
  const t = getTheme(isDark);
  const { stats, collection } = useDeclutter();
  const badges = stats?.badges ?? [];

  const items = [
    {
      icon: Award,
      label: 'Achievements',
      subtitle: `${badges.length} earned`,
      color: V1.amber,
      route: '/achievements' as const,
    },
    {
      icon: Gem,
      label: 'Collection',
      subtitle: `${collection?.length ?? 0} found`,
      color: V1.indigo,
      route: '/collection' as const,
    },
    {
      icon: BarChart3,
      label: 'Insights',
      subtitle: 'View trends',
      color: V1.blue,
      route: '/insights' as const,
    },
    {
      icon: Trophy,
      label: 'Social',
      subtitle: 'Community',
      color: V1.gold,
      route: '/social' as const,
    },
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 10, paddingHorizontal: 2 }}
    >
      {items.map((item) => (
        <Pressable
          key={item.label}
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push(item.route);
          }}
          accessibilityRole="button"
          accessibilityLabel={`${item.label}: ${item.subtitle}`}
          style={({ pressed }) => [{
            ...cardStyle(isDark),
            padding: 12,
            width: 120,
            gap: 6,
            opacity: pressed ? 0.85 : 1,
          }]}
        >
          {React.createElement(item.icon, { size: 18, color: item.color })}
          <Text style={{ fontFamily: BODY_FONT, fontSize: 13, fontWeight: '600', color: t.text }}>
            {item.label}
          </Text>
          <Text style={{ fontFamily: BODY_FONT, fontSize: 11, color: t.textSecondary }}>
            {item.subtitle}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

// Mascot adventure timer
function MascotAdventureTimer({ isDark, mascotName }: { isDark: boolean; mascotName: string }) {
  const t = getTheme(isDark);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [remaining, setRemaining] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEYS.ADVENTURE_END).then((val) => {
      if (val) {
        const end = parseInt(val, 10);
        if (end > Date.now()) {
          setEndTime(end);
        } else {
          setIsReady(true);
        }
      }
    });
  }, []);

  useEffect(() => {
    if (!endTime) return;
    const interval = setInterval(() => {
      const diff = endTime - Date.now();
      if (diff <= 0) {
        setIsReady(true);
        setEndTime(null);
        clearInterval(interval);
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setRemaining(`${h}h ${m}m`);
    }, 30000);
    // Run immediately too
    const diff = endTime - Date.now();
    if (diff > 0) {
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setRemaining(`${h}h ${m}m`);
    }
    return () => clearInterval(interval);
  }, [endTime]);

  const startAdventure = useCallback(async () => {
    const end = Date.now() + ADVENTURE_DURATION_MS;
    await AsyncStorage.setItem(STORAGE_KEYS.ADVENTURE_END, String(end));
    setEndTime(end);
    setIsReady(false);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  if (isReady) {
    return (
      <Pressable
        onPress={startAdventure}
        accessibilityRole="button"
        accessibilityLabel={`${mascotName} returned from adventure. Tap to claim reward and send on another.`}
        style={({ pressed }) => [{
          backgroundColor: V1.gold + '15',
          borderRadius: RADIUS.md, padding: 12,
          borderWidth: 1, borderColor: V1.gold + '30',
          opacity: pressed ? 0.85 : 1,
          marginTop: 8,
        }]}
      >
        <Text style={{ fontFamily: BODY_FONT, fontSize: 13, fontWeight: '600', color: V1.gold, textAlign: 'center' }}>
          {mascotName} is back! Tap to claim reward
        </Text>
      </Pressable>
    );
  }

  if (remaining) {
    return (
      <View style={{
        backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
        borderRadius: RADIUS.md, padding: 10, marginTop: 8,
      }}>
        <Text style={{ fontFamily: BODY_FONT, fontSize: 12, color: t.textSecondary, textAlign: 'center' }}>
          {mascotName} is on an adventure... {remaining} left
        </Text>
      </View>
    );
  }

  return null;
}

export default function ProfileScreen() {
  return (
    <ScreenErrorBoundary screenName="profile">
      <ProfileScreenContent />
    </ScreenErrorBoundary>
  );
}

function ProfileSkeleton({ isDark }: { isDark: boolean }) {
  const t = getTheme(isDark);
  const insets = useSafeAreaInsets();
  const placeholderColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
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
        <View style={{ height: 32, width: 120, backgroundColor: placeholderColor, borderRadius: RADIUS.md, marginBottom: 16 }} />
        <View style={{ height: 90, backgroundColor: placeholderColor, borderRadius: RADIUS.lg, marginBottom: 16 }} />
        <View style={{ height: 80, backgroundColor: placeholderColor, borderRadius: RADIUS.lg, marginBottom: 16 }} />
        <View style={{ flexDirection: 'row', gap: SPACING.itemGap }}>
          <View style={{ flex: 1, height: 80, backgroundColor: placeholderColor, borderRadius: RADIUS.md }} />
          <View style={{ flex: 1, height: 80, backgroundColor: placeholderColor, borderRadius: RADIUS.md }} />
          <View style={{ flex: 1, height: 80, backgroundColor: placeholderColor, borderRadius: RADIUS.md }} />
        </View>
      </ScrollView>
    </View>
  );
}

function ProfileScreenContent() {
  const rawScheme = useColorScheme();
  const isDark = rawScheme === 'dark';
  const reducedMotion = useReducedMotion();
  const insets = useSafeAreaInsets();
  const { user, stats, rooms: rawRooms, mascot, isLoaded } = useDeclutter();
  const { user: authUser } = useAuth();
  const { isPro } = useSubscription();

  // Pull-to-refresh
  const [isRefreshing, setIsRefreshing] = useState(false);
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 800);
  }, []);

  const rooms = rawRooms ?? [];
  const streak = stats?.currentStreak ?? 0;
  const totalXP = stats?.xp ?? 0;
  const completedTasks = stats?.totalTasksCompleted ?? 0;
  const roomsDone = useMemo(() =>
    stats?.totalRoomsCleaned ??
    rooms.filter((room) => (room.tasks ?? []).length > 0 && (room.tasks ?? []).every((task) => task.completed))
      .length,
  [stats?.totalRoomsCleaned, rooms]);

  const displayName = authUser?.displayName?.trim() || user?.name || 'Declutterer';
  const level = Math.floor(totalXP / XP_PER_LEVEL) + 1;
  const xpInLevel = totalXP % XP_PER_LEVEL;
  const progressPercent = Math.max(Math.round((xpInLevel / XP_PER_LEVEL) * 100), 4);
  const levelTitle = useMemo(() => getLevelTitle(level), [level]);

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

  // Streak freeze indicator
  const streakFreezes = stats?.streakFreezesAvailable ?? 0;

  const enter = (delay: number) =>
    reducedMotion ? undefined : FadeInDown.duration(380).delay(delay);

  // Show skeleton while initial data loads (guard against blank screen)
  if (!isLoaded) {
    return <ProfileSkeleton isDark={isDark} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 14, paddingBottom: insets.bottom + 120 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={V1.coral}
            colors={[V1.coral]}
          />
        }
      >
        {/* Header */}
        <Animated.View entering={enter(0)} style={styles.header}>
          <Text style={[styles.title, { color: t.text }]}>Profile</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/camera');
              }}
              accessibilityRole="button"
              accessibilityLabel="Scan a room"
              style={({ pressed }) => [
                styles.settingsBtn,
                {
                  backgroundColor: isDark ? 'rgba(255,107,107,0.12)' : 'rgba(255,107,107,0.08)',
                  borderColor: isDark ? 'rgba(255,107,107,0.2)' : 'rgba(255,107,107,0.15)',
                  transform: [{ scale: pressed ? 0.93 : 1 }],
                  opacity: pressed ? 0.78 : 1,
                },
              ]}
            >
              <Camera size={18} color={V1.coral} />
            </Pressable>
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
          </View>
        </Animated.View>

        {/* Comeback banner for returning users */}
        <Animated.View entering={enter(30)}>
          <ComebackBanner isDark={isDark} />
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
                  Level {level} {'\u00B7'} {levelTitle}
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
          <Text style={[styles.sectionTitle, { color: t.textSecondary, marginBottom: 8 }]}>Your Companion</Text>
          <Pressable
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/mascot');
            }}
            accessibilityRole="button"
            accessibilityLabel={`View ${mascotName}'s profile`}
            style={({ pressed }) => [{ opacity: pressed ? 0.88 : 1 }]}
          >
            <View style={[styles.companionCard, card]}>
              <View style={styles.companionRow}>
                <MascotAvatar
                  mood={mascotMood}
                  activity="idle"
                  size={52}
                  borderRadius={16}
                />
                <View style={styles.companionInfo}>
                  <Text style={[styles.companionName, { color: t.text }]}>{mascotName}</Text>
                  <Text style={[styles.companionMood, { color: V1.green }]}>{moodLabel}</Text>
                  <BarIndicator isDark={isDark} label="Happiness" value={mascotHappiness} maxValue={100} color={V1.green} />
                  <BarIndicator isDark={isDark} label="Energy" value={mascotEnergy} maxValue={100} color={V1.blue} />
                  <BarIndicator isDark={isDark} label="Hunger" value={mascotHunger} maxValue={100} color={V1.coral} />
                </View>
              </View>
              <MascotAdventureTimer isDark={isDark} mascotName={mascotName} />
            </View>
          </Pressable>
        </Animated.View>

        {/* Quick Stats */}
        {streak === 0 && completedTasks === 0 && roomsDone === 0 ? (
          <Animated.View entering={enter(180)}>
            <View style={[styles.emptyStatsCard, card]}>
              <MascotAvatar
                mood="happy"
                activity="idle"
                size={64}
                imageKey="encouraging"
                showBackground
              />
              <Text style={[styles.emptyStatsTitle, { color: t.text }]}>
                Your journey starts here
              </Text>
              <Text style={[styles.emptyStatsDesc, { color: t.textSecondary }]}>
                Complete your first session to see your stats grow. Even 5 minutes counts!
              </Text>
              <Pressable
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  router.push('/camera');
                }}
                style={({ pressed }) => [{ opacity: pressed ? 0.88 : 1 }]}
              >
                <LinearGradient
                  colors={['#FF6B6B', '#FF5252']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.emptyStatsCta}
                >
                  <Text style={styles.emptyStatsCtaText}>Start your first session</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </Animated.View>
        ) : (
          <Animated.View entering={enter(180)} style={styles.quickStats}>
            <View style={[
              styles.quickStatCard,
              card,
              { backgroundColor: isDark ? t.card : `rgba(255,107,107,0.04)` },
            ]}
              accessibilityLabel={`${streak} day streak`}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Flame size={18} color={V1.coral} />
                {streakFreezes > 0 && (
                  <Shield size={12} color={V1.blue} />
                )}
              </View>
              <Text style={[styles.quickStatValue, { color: V1.coral }]}>{streak}</Text>
              <Text style={[styles.quickStatLabel, { color: t.textSecondary }]}>Streak</Text>
            </View>
            <View style={[
              styles.quickStatCard,
              card,
              { backgroundColor: isDark ? t.card : `rgba(102,187,106,0.04)` },
            ]}
              accessibilityLabel={`${roomsDone} rooms cleaned`}
            >
              <Check size={18} color={V1.green} />
              <Text style={[styles.quickStatValue, { color: V1.green }]}>{roomsDone}</Text>
              <Text style={[styles.quickStatLabel, { color: t.textSecondary }]}>Rooms</Text>
            </View>
            <View style={[
              styles.quickStatCard,
              card,
              { backgroundColor: isDark ? t.card : `rgba(255,183,77,0.04)` },
            ]}
              accessibilityLabel={`${completedTasks} tasks completed`}
            >
              <Star size={18} color={V1.amber} />
              <Text style={[styles.quickStatValue, { color: V1.amber }]}>{completedTasks}</Text>
              <Text style={[styles.quickStatLabel, { color: t.textSecondary }]}>Tasks</Text>
            </View>
          </Animated.View>
        )}

        {/* Quick Navigation */}
        {(completedTasks > 0 || roomsDone > 0) && (
          <Animated.View entering={enter(220)}>
            <Text style={[styles.sectionTitle, { color: t.textSecondary, marginBottom: 8 }]}>Explore</Text>
            <QuickNavStrip isDark={isDark} />
          </Animated.View>
        )}

        {/* Upgrade to Pro — hidden when user is already Pro */}
        {!isPro && (
          <Animated.View entering={enter(260)}>
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
                  <Text style={[styles.proSubtitle, { color: t.textSecondary }]}>Unlimited scans, mascot, leagues & more</Text>
                </View>
                <ChevronRight size={18} color={t.textMuted} />
              </LinearGradient>
            </Pressable>
          </Animated.View>
        )}
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

  // Empty stats
  emptyStatsCard: {
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
  emptyStatsTitle: {
    fontFamily: DISPLAY_FONT,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  emptyStatsDesc: {
    fontFamily: BODY_FONT,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  emptyStatsCta: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 9999,
    alignItems: 'center',
    marginTop: 4,
  },
  emptyStatsCtaText: {
    fontFamily: BODY_FONT,
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
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
