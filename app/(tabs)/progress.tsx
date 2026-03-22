/**
 * Declutterly -- Progress Screen (V1 Pencil Design)
 * Week view with day circles, streak card with freeze indicator,
 * animated stat counters, quick nav strip, motivation card, and empty state.
 */

import { useDeclutter } from '@/context/DeclutterContext';
import {
  V1,
  BODY_FONT,
  DISPLAY_FONT,
  RADIUS,
  SPACING,
  cardStyle,
  getTheme,
} from '@/constants/designTokens';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useSubscription } from '@/hooks/useSubscription';
import { useStreakFreeze, useCalendarData } from '@/hooks/useConvex';
import { Flame, Check, Sparkles, Award, Gem, BarChart3, Trophy, Lock, Shield, Calendar } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ScreenErrorBoundary } from '@/components/ErrorBoundary';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
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

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

const WEEKDAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const WEEKDAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

type DayStatus = 'completed' | 'today' | 'missed' | 'future';

function toMondayFirstIndex(jsDay: number): number {
  return (jsDay + 6) % 7;
}

function getDayStatuses(activeDays: boolean[]): DayStatus[] {
  const now = new Date();
  const todayIndex = toMondayFirstIndex(now.getDay());
  return activeDays.map((active, i) => {
    if (i === todayIndex) return 'today';
    if (i > todayIndex) return 'future';
    return active ? 'completed' : 'missed';
  });
}

function WeekView({
  isDark,
  activeDays,
}: {
  isDark: boolean;
  activeDays: boolean[];
}) {
  const statuses = getDayStatuses(activeDays);
  const t = getTheme(isDark);

  return (
    <View style={styles.weekRow}>
      {WEEKDAY_LABELS.map((label, i) => {
        const status = statuses[i];
        return (
          <View key={`${label}-${i}`} style={styles.weekDayCol}>
            <Text style={[styles.weekLabel, { color: t.textSecondary }]}>
              {label}
            </Text>
            <View
              accessibilityLabel={`${WEEKDAY_NAMES[i]}: ${status}`}
              style={[
                styles.weekCircle,
                status === 'completed' && {
                  backgroundColor: V1.green,
                  shadowColor: V1.green,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.3,
                  shadowRadius: 6,
                },
                status === 'today' && {
                  backgroundColor: V1.coral,
                  borderWidth: 2,
                  borderColor: 'rgba(255,107,107,0.4)',
                },
                status === 'missed' && {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#EEEFF1',
                },
                status === 'future' && {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#EEEFF1',
                },
              ]}
            >
              {status === 'completed' && (
                <Check size={16} color="#FFFFFF" strokeWidth={3} />
              )}
              {status === 'today' && (
                <Sparkles size={14} color="#FFFFFF" />
              )}
              {status === 'missed' && null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

// Animated stat counter component
function AnimatedStatBox({
  isDark,
  value,
  label,
  color,
}: {
  isDark: boolean;
  value: number;
  label: string;
  color: string;
}) {
  const t = getTheme(isDark);
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

  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  };
  const tintBg = hexToRgba(color, 0.04);

  return (
    <View style={[
      styles.statBox,
      cardStyle(isDark),
      { backgroundColor: tintBg },
    ]}
      accessibilityLabel={`${label}: ${value}`}
    >
      <AnimatedTextInput
        underlineColorAndroid="transparent"
        editable={false}
        animatedProps={animatedProps}
        style={[styles.statValue, { color }]}
      />
      <Text style={[styles.statLabel, { color: t.textSecondary }]}>{label}</Text>
    </View>
  );
}

function StatBox({
  isDark,
  value,
  label,
  color,
}: {
  isDark: boolean;
  value: string;
  label: string;
  color: string;
}) {
  const t = getTheme(isDark);
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  };
  const tintBg = hexToRgba(color, 0.04);

  return (
    <View style={[
      styles.statBox,
      cardStyle(isDark),
      { backgroundColor: tintBg },
    ]}
      accessibilityLabel={`${label}: ${value}`}
    >
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: t.textSecondary }]}>{label}</Text>
    </View>
  );
}

function StreakCard({
  isDark,
  streak,
  bestThisMonth,
  streakFreezes,
}: {
  isDark: boolean;
  streak: number;
  bestThisMonth: number;
  streakFreezes: number;
}) {
  const progressPercent = bestThisMonth > 0
    ? Math.min(Math.round((streak / bestThisMonth) * 100), 100)
    : streak > 0 ? 100 : 0;

  return (
    <View style={[
      styles.streakCard,
      cardStyle(isDark),
    ]}>
      <View style={styles.streakHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Flame size={20} color={V1.coral} />
          <Text style={[styles.streakTitle, { color: getTheme(isDark).text }]}>
            {streak} Day Streak!
          </Text>
        </View>
        {streakFreezes > 0 && (
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 4,
            backgroundColor: V1.blue + '15', borderRadius: 10,
            paddingHorizontal: 8, paddingVertical: 3,
          }}>
            <Shield size={12} color={V1.blue} />
            <Text style={{ fontFamily: BODY_FONT, fontSize: 11, fontWeight: '600', color: V1.blue }}>
              {streakFreezes} freeze{streakFreezes !== 1 ? 's' : ''}
            </Text>
          </View>
        )}
      </View>
      {streakFreezes > 0 && (
        <View style={styles.freezeContainer}>
          <Text style={[styles.freezeLabel, { color: getTheme(isDark).textSecondary }]}>
            {streakFreezes} streak freeze{streakFreezes > 1 ? 's' : ''} available
          </Text>
          <Text style={[styles.freezeHint, { color: getTheme(isDark).textMuted }]}>
            Auto-used if you miss a day
          </Text>
        </View>
      )}
      <Text style={[styles.streakSubtitle, { color: getTheme(isDark).textSecondary }]}>
        Your best this month
      </Text>
      <View style={[styles.streakTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
        <LinearGradient
          colors={[V1.coral, '#FF5252']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.streakFill, { width: `${Math.max(progressPercent, 6)}%` }]}
        />
      </View>
    </View>
  );
}

// Quick navigation strip for Achievements, Collection, Insights, League
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
      subtitle: `${collection?.length ?? 0} items`,
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
      icon: Calendar,
      label: 'Weekly',
      subtitle: 'Your recap',
      color: V1.coral,
      route: '/weekly-summary' as const,
    },
    {
      icon: Trophy,
      label: 'League',
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

function MotivationCard({
  isDark,
  message,
}: {
  isDark: boolean;
  message: string;
}) {
  return (
    <LinearGradient
      colors={isDark
        ? ['rgba(255,107,107,0.15)', 'rgba(255,107,107,0.05)']
        : ['rgba(255,107,107,0.10)', 'rgba(255,107,107,0.04)']
      }
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.motivationCard, {
        borderColor: isDark ? 'rgba(255,107,107,0.2)' : 'rgba(255,107,107,0.2)',
      }]}
      accessibilityRole="text"
    >
      <View style={styles.motivationContent}>
        <Sparkles size={16} color={isDark ? 'rgba(255,200,200,0.9)' : 'rgba(180,60,60,0.9)'} />
        <Text style={[styles.motivationText, {
          color: isDark ? 'rgba(255,200,200,0.9)' : 'rgba(180,60,60,0.9)',
        }]}>
          {message}
        </Text>
      </View>
    </LinearGradient>
  );
}

function EmptyState({
  isDark,
  onStart,
}: {
  isDark: boolean;
  onStart: () => void;
}) {
  const t = getTheme(isDark);
  return (
    <View style={styles.emptyContainer}>
      <LinearGradient
        colors={isDark ? ['rgba(255,107,107,0.2)', 'rgba(255,142,142,0.08)'] : ['rgba(255,107,107,0.15)', 'rgba(255,142,142,0.06)']}
        style={styles.mascotCircle}
      >
        <Sparkles size={40} color={V1.coral} strokeWidth={1.5} />
      </LinearGradient>

      <Text style={[styles.emptyTitle, { color: t.text }]}>
        Your journey starts here
      </Text>
      <Text style={[styles.emptySubtitle, { color: t.textSecondary }]}>
        Complete your first cleaning session and{'\n'}watch your progress grow.
      </Text>

      <View style={styles.emptyFeatures}>
        <View style={[styles.emptyFeatureRow, {
          backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
          borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
        }]}>
          <View style={[styles.emptyFeatureIcon, { backgroundColor: isDark ? 'rgba(102,187,106,0.15)' : 'rgba(102,187,106,0.12)' }]}>
            <Flame size={16} color={V1.green} />
          </View>
          <View style={styles.emptyFeatureText}>
            <Text style={[styles.emptyFeatureTitle, { color: t.text }]}>Daily streaks</Text>
            <Text style={[styles.emptyFeatureDesc, { color: t.textMuted }]}>Build momentum one day at a time</Text>
          </View>
        </View>

        <View style={[styles.emptyFeatureRow, {
          backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
          borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
        }]}>
          <View style={[styles.emptyFeatureIcon, { backgroundColor: isDark ? 'rgba(100,181,246,0.15)' : 'rgba(100,181,246,0.12)' }]}>
            <Check size={16} color={V1.blue} />
          </View>
          <View style={styles.emptyFeatureText}>
            <Text style={[styles.emptyFeatureTitle, { color: t.text }]}>Task tracking</Text>
            <Text style={[styles.emptyFeatureDesc, { color: t.textMuted }]}>See every small win add up</Text>
          </View>
        </View>

        <View style={[styles.emptyFeatureRow, {
          backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
          borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
        }]}>
          <View style={[styles.emptyFeatureIcon, { backgroundColor: isDark ? 'rgba(255,183,77,0.15)' : 'rgba(255,183,77,0.12)' }]}>
            <Sparkles size={16} color={V1.amber} />
          </View>
          <View style={styles.emptyFeatureText}>
            <Text style={[styles.emptyFeatureTitle, { color: t.text }]}>Weekly insights</Text>
            <Text style={[styles.emptyFeatureDesc, { color: t.textMuted }]}>Patterns that keep you going</Text>
          </View>
        </View>
      </View>

      <Pressable
        onPress={onStart}
        accessibilityRole="button"
        accessibilityLabel="Start your first session"
        style={({ pressed }) => [
          { opacity: pressed ? 0.85 : 1, width: '100%', transform: [{ scale: pressed ? 0.98 : 1 }] },
        ]}
      >
        <LinearGradient
          colors={['#FF6B6B', '#FF5252']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.ctaButton}
        >
          <Text style={styles.ctaText}>Scan your first room</Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

// ─── Streak Freeze Button/Modal ──────────────────────────────────────────────
function StreakFreezeSection({
  isDark,
  streakFreezes,
  streak,
}: {
  isDark: boolean;
  streakFreezes: number;
  streak: number;
}) {
  const t = getTheme(isDark);
  const streakFreeze = useStreakFreeze();
  const [showModal, setShowModal] = useState(false);
  const [isUsing, setIsUsing] = useState(false);

  const handleUseFreeze = useCallback(async () => {
    setIsUsing(true);
    try {
      const result = await streakFreeze({});
      if (result?.success) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Streak Protected!', result.message ?? 'Your streak is safe for 24 more hours.');
      } else {
        Alert.alert('No Freezes', result?.message ?? 'No streak freezes available.');
      }
    } catch (error: any) {
      Alert.alert('Error', error?.message ?? 'Could not use streak freeze.');
    } finally {
      setIsUsing(false);
      setShowModal(false);
    }
  }, [streakFreeze]);

  if (streakFreezes <= 0) return null;

  return (
    <>
      <Pressable
        onPress={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setShowModal(true);
        }}
        style={({ pressed }) => [{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          padding: 14,
          borderRadius: RADIUS.md,
          backgroundColor: isDark ? 'rgba(100,181,246,0.08)' : 'rgba(100,181,246,0.06)',
          borderWidth: 1,
          borderColor: isDark ? 'rgba(100,181,246,0.15)' : 'rgba(100,181,246,0.12)',
          opacity: pressed ? 0.8 : 1,
        }]}
        accessibilityRole="button"
        accessibilityLabel={`Use streak freeze. ${streakFreezes} available.`}
      >
        <Shield size={20} color={V1.blue} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: BODY_FONT, fontSize: 14, fontWeight: '600', color: t.text }}>
            Streak Freeze
          </Text>
          <Text style={{ fontFamily: BODY_FONT, fontSize: 12, color: t.textSecondary }}>
            {streakFreezes} freeze{streakFreezes !== 1 ? 's' : ''} available - protect your streak
          </Text>
        </View>
        <View style={{
          backgroundColor: V1.blue + '20',
          width: 28,
          height: 28,
          borderRadius: 14,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Text style={{ fontFamily: BODY_FONT, fontSize: 13, fontWeight: '700', color: V1.blue }}>
            {streakFreezes}
          </Text>
        </View>
      </Pressable>

      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 32,
          }}
          onPress={() => setShowModal(false)}
        >
          <Pressable
            onPress={() => {}}
            style={{
              width: '100%',
              maxWidth: 340,
              backgroundColor: isDark ? V1.dark.card : V1.light.card,
              borderRadius: RADIUS.lg,
              padding: 24,
              gap: 16,
              alignItems: 'center',
            }}
          >
            <Shield size={40} color={V1.blue} />
            <Text style={{
              fontFamily: DISPLAY_FONT,
              fontSize: 20,
              fontWeight: '700',
              color: t.text,
              textAlign: 'center',
            }}>
              Use Streak Freeze?
            </Text>
            <Text style={{
              fontFamily: BODY_FONT,
              fontSize: 14,
              color: t.textSecondary,
              textAlign: 'center',
              lineHeight: 20,
            }}>
              Use 1 streak freeze to protect your {streak}-day streak? Your grace period will extend by 24 hours.
            </Text>
            <Text style={{
              fontFamily: BODY_FONT,
              fontSize: 12,
              color: t.textMuted,
            }}>
              {streakFreezes} freeze{streakFreezes !== 1 ? 's' : ''} remaining after use
            </Text>

            <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
              <Pressable
                onPress={() => setShowModal(false)}
                style={{
                  flex: 1,
                  height: 44,
                  borderRadius: 22,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: t.border,
                }}
              >
                <Text style={{ fontFamily: BODY_FONT, fontSize: 15, fontWeight: '600', color: t.text }}>
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                onPress={handleUseFreeze}
                disabled={isUsing}
                style={{
                  flex: 1,
                  height: 44,
                  borderRadius: 22,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: V1.blue,
                  opacity: isUsing ? 0.6 : 1,
                }}
              >
                <Text style={{ fontFamily: BODY_FONT, fontSize: 15, fontWeight: '600', color: '#FFFFFF' }}>
                  {isUsing ? 'Using...' : 'Use Freeze'}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

// ─── Calendar Heatmap (last 12 weeks) ───────────────────────────────────────
function CalendarHeatmap({ isDark }: { isDark: boolean }) {
  const t = getTheme(isDark);
  const calendarData = useCalendarData();

  const heatmapData = useMemo(() => {
    if (!calendarData) return null;

    // Build a map of date -> task count
    const dateMap = new Map<string, number>();
    for (const entry of calendarData) {
      dateMap.set(entry.date, entry.tasksCompleted ?? 0);
    }

    // Generate 12 weeks of data (84 days), ending today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find the Monday 12 weeks ago
    const startDate = new Date(today);
    const todayDow = (today.getDay() + 6) % 7; // Mon=0
    startDate.setDate(startDate.getDate() - todayDow - (11 * 7));

    const weeks: { date: string; count: number; isFuture: boolean }[][] = [];
    let currentDate = new Date(startDate);

    for (let w = 0; w < 12; w++) {
      const week: { date: string; count: number; isFuture: boolean }[] = [];
      for (let d = 0; d < 7; d++) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const isFuture = currentDate > today;
        week.push({
          date: dateStr,
          count: isFuture ? -1 : (dateMap.get(dateStr) ?? 0),
          isFuture,
        });
        currentDate.setDate(currentDate.getDate() + 1);
      }
      weeks.push(week);
    }

    return weeks;
  }, [calendarData]);

  if (!heatmapData) return null;

  const getColor = (count: number, isFuture: boolean): string => {
    if (isFuture) return isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)';
    if (count === 0) return isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
    if (count <= 2) return V1.coral + '30';
    if (count <= 5) return V1.coral + '60';
    return V1.coral + 'BB';
  };

  const dayLabels = ['M', '', 'W', '', 'F', '', ''];

  return (
    <View style={{
      ...cardStyle(isDark),
      padding: SPACING.cardPadding,
      gap: 10,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Calendar size={16} color={V1.coral} />
        <Text style={{
          fontFamily: BODY_FONT,
          fontSize: 14,
          fontWeight: '600',
          color: t.text,
        }}>
          Activity (12 weeks)
        </Text>
      </View>

      <View style={{ flexDirection: 'row', gap: 3 }}>
        {/* Day labels */}
        <View style={{ gap: 3, marginRight: 4, justifyContent: 'flex-start' }}>
          {dayLabels.map((label, i) => (
            <View key={i} style={{ height: 12, width: 14, justifyContent: 'center' }}>
              <Text style={{
                fontFamily: BODY_FONT,
                fontSize: 9,
                color: t.textMuted,
              }}>
                {label}
              </Text>
            </View>
          ))}
        </View>

        {/* Weeks */}
        {heatmapData.map((week, wIdx) => (
          <View key={wIdx} style={{ gap: 3 }}>
            {week.map((day, dIdx) => (
              <View
                key={`${wIdx}-${dIdx}`}
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 2,
                  backgroundColor: getColor(day.count, day.isFuture),
                }}
                accessibilityLabel={
                  day.isFuture
                    ? 'Future day'
                    : `${day.date}: ${day.count} tasks`
                }
              />
            ))}
          </View>
        ))}
      </View>

      {/* Legend */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
        <Text style={{ fontFamily: BODY_FONT, fontSize: 9, color: t.textMuted }}>Less</Text>
        {[0, 1, 3, 6].map((count) => (
          <View
            key={count}
            style={{
              width: 10,
              height: 10,
              borderRadius: 2,
              backgroundColor: getColor(count, false),
            }}
          />
        ))}
        <Text style={{ fontFamily: BODY_FONT, fontSize: 9, color: t.textMuted }}>More</Text>
      </View>
    </View>
  );
}

export default function ProgressScreen() {
  return (
    <ScreenErrorBoundary screenName="progress">
      <ProgressScreenContent />
    </ScreenErrorBoundary>
  );
}

function ProgressSkeleton({ isDark }: { isDark: boolean }) {
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
        <View style={{ height: 32, width: 180, backgroundColor: placeholderColor, borderRadius: RADIUS.md, marginBottom: 16 }} />
        <View style={{ height: 60, backgroundColor: placeholderColor, borderRadius: RADIUS.md, marginBottom: 16 }} />
        <View style={{ height: 100, backgroundColor: placeholderColor, borderRadius: RADIUS.lg, marginBottom: 16 }} />
        <View style={{ flexDirection: 'row', gap: SPACING.itemGap }}>
          <View style={{ flex: 1, height: 80, backgroundColor: placeholderColor, borderRadius: RADIUS.md }} />
          <View style={{ flex: 1, height: 80, backgroundColor: placeholderColor, borderRadius: RADIUS.md }} />
        </View>
      </ScrollView>
    </View>
  );
}

function ProgressScreenContent() {
  const rawScheme = useColorScheme();
  const isDark = rawScheme === 'dark';
  const reducedMotion = useReducedMotion();
  const insets = useSafeAreaInsets();
  const { stats, rooms: rawRooms, setActiveRoom, isLoaded } = useDeclutter();
  const { isPro } = useSubscription();
  const rooms = rawRooms ?? [];

  // Pull-to-refresh
  const [isRefreshing, setIsRefreshing] = useState(false);
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 800);
  }, []);

  const streak = stats?.currentStreak ?? 0;
  const longestStreak = stats?.longestStreak ?? 0;
  const completedTasks = stats?.totalTasksCompleted ?? 0;
  const completedRooms = stats?.totalRoomsCleaned ?? 0;
  const totalMinutes = stats?.totalMinutesCleaned ?? 0;
  const streakFreezes = stats?.streakFreezesAvailable ?? 0;
  const t = getTheme(isDark);

  // Compute weekly active days (Monday-first: index 0=Mon, 6=Sun)
  const activeDays = useMemo(() => {
    const result = [false, false, false, false, false, false, false];
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - toMondayFirstIndex(now.getDay()));
    startOfWeek.setHours(0, 0, 0, 0);

    rooms.forEach((room) => {
      (room.tasks ?? []).forEach((task) => {
        if (!task.completed || !task.completedAt) return;
        const completedAt = new Date(task.completedAt);
        if (completedAt >= startOfWeek) {
          const dayIndex = toMondayFirstIndex(completedAt.getDay());
          result[dayIndex] = true;
        }
      });
    });
    return result;
  }, [rooms]);

  // Compute completion percentage
  const completionPercent = useMemo(() => {
    const totalTasksAvailable = rooms.reduce((sum, room) => sum + (room.tasks?.length ?? 0), 0);
    return totalTasksAvailable > 0
      ? Math.round((completedTasks / totalTasksAvailable) * 100)
      : 0;
  }, [rooms, completedTasks]);

  const timeFormatted = totalMinutes >= 60
    ? `${Math.floor(totalMinutes / 60)}h`
    : `${totalMinutes}m`;

  const isEmpty = rooms.length === 0 || (completedTasks === 0 && completedRooms === 0 && streak === 0);

  const bestThisMonth = Math.max(longestStreak, streak, 7);

  // Motivation message
  const motivationMessage = useMemo(() => {
    if (streak >= 7) {
      return `A whole week of consistency! You are proving that small steps create lasting change.`;
    }
    if (completedTasks > 10) {
      return `${completedTasks} tasks done! That is visible proof that calm spaces are possible for you.`;
    }
    if (completedTasks > 0) {
      return `Small progress is still progress. Every task you complete builds real momentum.`;
    }
    return 'Every room you reset is proof that calm is possible. Start small.';
  }, [completedTasks, streak]);

  const handleStartSession = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setActiveRoom(null);
    router.push('/camera');
  };

  const enter = (delay: number) =>
    reducedMotion ? undefined : FadeInDown.duration(380).delay(delay);

  // Show skeleton while initial data is loading (no blank screen gap)
  if (!isLoaded) {
    return <ProgressSkeleton isDark={isDark} />;
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
        {/* Title */}
        <Animated.View entering={enter(0)}>
          <Text style={[styles.title, { color: t.text }]}>Your Progress</Text>
        </Animated.View>

        {isEmpty ? (
          <Animated.View entering={enter(60)}>
            <WeekView isDark={isDark} activeDays={[false, false, false, false, false, false, false]} />
            <EmptyState isDark={isDark} onStart={handleStartSession} />
          </Animated.View>
        ) : (
          <>
            {/* Week view */}
            <Animated.View entering={enter(60)}>
              <WeekView isDark={isDark} activeDays={activeDays} />
            </Animated.View>

            {/* Streak card */}
            <Animated.View entering={enter(120)}>
              <StreakCard isDark={isDark} streak={streak} bestThisMonth={bestThisMonth} streakFreezes={streakFreezes} />
            </Animated.View>

            {/* Stats grid with animated counters */}
            <Animated.View entering={enter(180)}>
              <View style={styles.statsGrid}>
                <View style={styles.statsRow}>
                  <AnimatedStatBox isDark={isDark} value={completedRooms} label="Rooms" color={V1.green} />
                  <AnimatedStatBox isDark={isDark} value={completedTasks} label="Tasks Done" color={V1.coral} />
                </View>
                <View style={styles.statsRow}>
                  <StatBox isDark={isDark} value={timeFormatted} label="Time Cleaned" color={V1.blue} />
                  <StatBox isDark={isDark} value={`${completionPercent}%`} label="Completion" color={V1.amber} />
                </View>
              </View>
            </Animated.View>

            {/* Calendar heatmap */}
            <Animated.View entering={enter(200)}>
              <CalendarHeatmap isDark={isDark} />
            </Animated.View>

            {/* Streak freeze button */}
            {streakFreezes > 0 && (
              <Animated.View entering={enter(210)}>
                <StreakFreezeSection isDark={isDark} streakFreezes={streakFreezes} streak={streak} />
              </Animated.View>
            )}

            {/* Quick navigation strip */}
            <Animated.View entering={enter(240)}>
              <QuickNavStrip isDark={isDark} />
            </Animated.View>

            {/* Locked insights teaser for non-premium */}
            {!isPro && (
              <Animated.View entering={enter(260)}>
                <Pressable
                  onPress={() => {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push('/paywall');
                  }}
                  style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
                >
                  <LinearGradient
                    colors={isDark
                      ? ['rgba(99,102,241,0.12)', 'rgba(99,102,241,0.04)']
                      : ['rgba(99,102,241,0.08)', 'rgba(99,102,241,0.02)']
                    }
                    style={{
                      borderRadius: RADIUS.lg,
                      padding: 16,
                      borderWidth: 1,
                      borderColor: isDark ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.15)',
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    <Lock size={18} color={V1.indigo} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: BODY_FONT, fontSize: 14, fontWeight: '600', color: t.text }}>
                        Unlock Deep Insights
                      </Text>
                      <Text style={{ fontFamily: BODY_FONT, fontSize: 12, color: t.textSecondary }}>
                        AI-powered trends, weekly summaries & more
                      </Text>
                    </View>
                  </LinearGradient>
                </Pressable>
              </Animated.View>
            )}

            {/* Motivation card */}
            <Animated.View entering={enter(280)}>
              <MotivationCard isDark={isDark} message={motivationMessage} />
            </Animated.View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.screenPadding,
    gap: SPACING.sectionGap,
  },
  title: {
    fontFamily: DISPLAY_FONT,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },

  // Week view
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  weekDayCol: {
    alignItems: 'center',
    gap: 8,
  },
  weekLabel: {
    fontFamily: BODY_FONT,
    fontSize: 13,
    fontWeight: '700',
  },
  weekCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Streak card
  streakCard: {
    borderRadius: RADIUS.lg,
    padding: SPACING.cardPadding,
    gap: 8,
  },
  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  streakTitle: {
    fontFamily: DISPLAY_FONT,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  streakSubtitle: {
    fontFamily: BODY_FONT,
    fontSize: 13,
    fontWeight: '500',
  },
  streakTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 4,
  },
  streakFill: {
    height: '100%',
    borderRadius: 3,
  },
  freezeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(100,181,246,0.08)',
  },
  freezeLabel: {
    fontFamily: BODY_FONT,
    fontSize: 12,
    fontWeight: '600',
  },
  freezeHint: {
    fontFamily: BODY_FONT,
    fontSize: 11,
    fontWeight: '400',
  },

  // Stats grid
  statsGrid: {
    gap: SPACING.itemGap,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.itemGap,
  },
  statBox: {
    flex: 1,
    borderRadius: RADIUS.lg,
    padding: SPACING.cardPadding,
    gap: 4,
  },
  statValue: {
    fontFamily: DISPLAY_FONT,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.8,
  },
  statLabel: {
    fontFamily: BODY_FONT,
    fontSize: 13,
    fontWeight: '500',
  },

  // Motivation card
  motivationCard: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: 20,
  },
  motivationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  motivationText: {
    flex: 1,
    fontFamily: BODY_FONT,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
  },

  // Empty state
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 20,
    gap: 16,
  },
  mascotCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontFamily: DISPLAY_FONT,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontFamily: BODY_FONT,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    textAlign: 'center',
  },
  emptyFeatures: {
    width: '100%',
    gap: 10,
    marginTop: 4,
  },
  emptyFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  emptyFeatureIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyFeatureText: {
    flex: 1,
    gap: 2,
  },
  emptyFeatureTitle: {
    fontFamily: BODY_FONT,
    fontSize: 15,
    fontWeight: '600',
  },
  emptyFeatureDesc: {
    fontFamily: BODY_FONT,
    fontSize: 13,
    fontWeight: '400',
  },
  ctaButton: {
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontFamily: BODY_FONT,
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
