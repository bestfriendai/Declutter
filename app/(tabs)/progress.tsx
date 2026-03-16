import { AmbientBackdrop } from '@/components/ui/AmbientBackdrop';
import { useDeclutter } from '@/context/DeclutterContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const AnimatedCircle: any = Animated.createAnimatedComponent(Circle as any);

const BODY_FONT = 'DM Sans';
const DISPLAY_FONT = 'Bricolage Grotesque';
const WEEKDAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

type WindowMode = 'weekly' | 'monthly';

function AnimatedRing({
  cx,
  cy,
  radius,
  strokeWidth,
  circumference,
  gradientId,
  progress,
}: {
  cx: number;
  cy: number;
  radius: number;
  strokeWidth: number;
  circumference: number;
  gradientId: string;
  progress: SharedValue<number>;
}) {
  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  return (
    <AnimatedCircle
      cx={cx}
      cy={cy}
      r={radius}
      stroke={`url(#${gradientId})`}
      strokeWidth={strokeWidth}
      fill="none"
      strokeLinecap="round"
      strokeDasharray={circumference}
      rotation="-90"
      origin={`${cx}, ${cy}`}
      animatedProps={animatedProps}
    />
  );
}

function ConcentricRings({
  roomsPercent,
  tasksPercent,
  streakPercent,
  overallPercent,
  isDark,
  reducedMotion,
}: {
  roomsPercent: number;
  tasksPercent: number;
  streakPercent: number;
  overallPercent: number;
  isDark: boolean;
  reducedMotion: boolean;
}) {
  const size = 184;
  const center = size / 2;

  const rings = [
    {
      key: 'rooms',
      radius: 78,
      strokeWidth: 16,
      bg: isDark ? '#222226' : '#E7E7EA',
      gradientStart: isDark ? '#FFFFFF' : '#A9A9AD',
      gradientEnd: isDark ? '#F4F4F6' : '#C9C9CF',
      value: roomsPercent / 100,
    },
    {
      key: 'tasks',
      radius: 56,
      strokeWidth: 16,
      bg: isDark ? '#242427' : '#ECECEF',
      gradientStart: isDark ? '#D9E3D2' : '#C9D3C4',
      gradientEnd: isDark ? '#A9B99F' : '#B6C0B0',
      value: tasksPercent / 100,
    },
    {
      key: 'streak',
      radius: 34,
      strokeWidth: 14,
      bg: isDark ? '#262629' : '#EFEFF2',
      gradientStart: isDark ? '#BFBFBF' : '#D8D8DB',
      gradientEnd: isDark ? '#8E8E92' : '#B8B8BE',
      value: streakPercent / 100,
    },
  ];

  const outer = useSharedValue(reducedMotion ? rings[0].value : 0);
  const middle = useSharedValue(reducedMotion ? rings[1].value : 0);
  const inner = useSharedValue(reducedMotion ? rings[2].value : 0);

  useEffect(() => {
    const duration = 900;

    if (reducedMotion) {
      outer.value = rings[0].value;
      middle.value = rings[1].value;
      inner.value = rings[2].value;
      return;
    }

    outer.value = withDelay(80, withTiming(rings[0].value, { duration, easing: Easing.out(Easing.cubic) }));
    middle.value = withDelay(180, withTiming(rings[1].value, { duration, easing: Easing.out(Easing.cubic) }));
    inner.value = withDelay(280, withTiming(rings[2].value, { duration, easing: Easing.out(Easing.cubic) }));
  }, [inner, middle, outer, reducedMotion, rings]);

  const shared = [outer, middle, inner];

  return (
    <View style={styles.ringShell}>
      <Svg width={size} height={size}>
        <Defs>
          {rings.map((ring) => (
            <SvgGradient
              key={ring.key}
              id={`progress-${ring.key}`}
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <Stop offset="0%" stopColor={ring.gradientStart} />
              <Stop offset="100%" stopColor={ring.gradientEnd} />
            </SvgGradient>
          ))}
        </Defs>

        {rings.map((ring, index) => {
          const circumference = 2 * Math.PI * ring.radius;
          return (
            <React.Fragment key={ring.key}>
              <Circle
                cx={center}
                cy={center}
                r={ring.radius}
                stroke={ring.bg}
                strokeWidth={ring.strokeWidth}
                fill="none"
              />
              <AnimatedRing
                cx={center}
                cy={center}
                radius={ring.radius}
                strokeWidth={ring.strokeWidth}
                circumference={circumference}
                gradientId={`progress-${ring.key}`}
                progress={shared[index]}
              />
            </React.Fragment>
          );
        })}
      </Svg>

      <View style={styles.ringCenter}>
        <Text style={[styles.ringPercent, { color: isDark ? '#FFFFFF' : '#17171A' }]}>
          {overallPercent}%
        </Text>
        <Text
          style={[
            styles.ringLabel,
            { color: isDark ? 'rgba(255,255,255,0.46)' : 'rgba(23,23,26,0.42)' },
          ]}
        >
          {overallPercent >= 100 ? 'complete!' : overallPercent >= 50 ? 'halfway there' : 'done'}
        </Text>
      </View>
    </View>
  );
}

function MetricCard({
  isDark,
  value,
  label,
  icon,
  onPress,
}: {
  isDark: boolean;
  value: string;
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={({ pressed }) => [
        styles.metricCard,
        {
          backgroundColor: isDark ? 'rgba(20,20,24,0.96)' : 'rgba(255,255,255,0.96)',
          borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <View style={styles.metricValueRow}>
        {icon ? (
          <Ionicons
            name={icon}
            size={16}
            color={isDark ? '#FFD39A' : '#A76423'}
            style={{ marginRight: 4 }}
          />
        ) : null}
        <Text style={[styles.metricNumber, { color: isDark ? '#FFFFFF' : '#17171A' }]}>
          {value}
        </Text>
      </View>
      <Text
        style={[
          styles.metricCaption,
          { color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(23,23,26,0.44)' },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function ProgressChart({
  isDark,
  mode,
  data,
  total,
  max,
  empty,
  onStartReset,
}: {
  isDark: boolean;
  mode: WindowMode;
  data: number[];
  total: number;
  max: number;
  empty: boolean;
  onStartReset: () => void;
}) {
  const labels = mode === 'weekly' ? WEEKDAY_LABELS : ['W1', 'W2', 'W3', 'W4'];
  const highlightIndex =
    mode === 'weekly'
      ? (new Date().getDay() + 6) % 7
      : Math.min(3, Math.floor((new Date().getDate() - 1) / 7));

  return (
    <View
      style={[
        styles.chartCard,
        {
          backgroundColor: isDark ? 'rgba(20,20,24,0.96)' : 'rgba(255,255,255,0.96)',
          borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
        },
      ]}
    >
      <View style={styles.chartHeader}>
        <View>
          <Text style={[styles.chartTitle, { color: isDark ? '#FFFFFF' : '#17171A' }]}>
            {mode === 'weekly' ? 'This Week' : 'This Month'}
          </Text>
          <Text
            style={[
              styles.chartSubtitle,
              { color: isDark ? 'rgba(255,255,255,0.48)' : 'rgba(23,23,26,0.46)' },
            ]}
          >
            {empty ? 'Your first reset lights up the chart.' : `${total} task${total === 1 ? '' : 's'} completed`}
          </Text>
        </View>

        <Text
          style={[
            styles.chartChip,
            {
              color: isDark ? '#F4D0A0' : '#8E5E28',
              backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(249,244,236,0.92)',
            },
          ]}
        >
          {empty ? 'Start here' : `${Math.max(...data)} best`}
        </Text>
      </View>

      {empty ? (
        <>
          <Text
            style={[
              styles.emptyCardBody,
              { color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(23,23,26,0.48)' },
            ]}
          >
            One room, one photo, one calm win. Takes 2 minutes to start your rhythm.
          </Text>

          <View style={styles.emptyTrackRow}>
            {labels.map((label, index) => {
              const selected = index === highlightIndex;

              return (
                <View key={`${label}-${index}`} style={styles.emptyTrackItem}>
                  <View
                    style={[
                      styles.emptyTrackPill,
                      {
                        backgroundColor: selected
                          ? isDark
                            ? '#FFF4E3'
                            : '#1B1B20'
                          : isDark
                            ? 'rgba(255,255,255,0.10)'
                            : 'rgba(23,23,26,0.10)',
                      },
                    ]}
                  />
                  <Text
                    style={[
                      styles.emptyTrackLabel,
                      {
                        color: selected
                          ? isDark
                            ? '#FFF4E3'
                            : '#1B1B20'
                          : isDark
                            ? 'rgba(255,255,255,0.32)'
                            : 'rgba(23,23,26,0.32)',
                      },
                    ]}
                  >
                    {label}
                  </Text>
                </View>
              );
            })}
          </View>
        </>
      ) : (
        <View style={styles.chartBars}>
          {data.map((value, index) => {
            const heightPercent = max > 0 ? value / max : 0;
            const barHeight = Math.max(18, 78 * heightPercent);
            const isPrimary = value === max && value > 0;

            return (
              <View key={`${labels[index]}-${index}`} style={styles.chartBarWrap}>
                <View
                  style={[
                    styles.chartBar,
                    {
                      height: barHeight,
                      backgroundColor: isPrimary
                        ? isDark
                          ? '#FFFFFF'
                          : '#1B1B20'
                        : isDark
                          ? 'rgba(255,255,255,0.14)'
                          : 'rgba(23,23,26,0.16)',
                    },
                  ]}
                />
                <Text
                  style={[
                    styles.chartLabel,
                    { color: isDark ? 'rgba(255,255,255,0.34)' : 'rgba(23,23,26,0.34)' },
                  ]}
                >
                  {labels[index]}
                </Text>
              </View>
            );
          })}
        </View>
      )}

      {empty ? (
        <Pressable
          onPress={onStartReset}
          accessibilityRole="button"
          accessibilityLabel="Scan first room"
          style={({ pressed }) => [{ opacity: pressed ? 0.86 : 1 }]}
        >
          <LinearGradient
            colors={isDark ? ['#FFF4E3', '#F7D19B'] : ['#1B1B20', '#33323A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.chartButton}
          >
            <Ionicons name="scan-outline" size={16} color={isDark ? '#17120B' : '#FFFFFF'} />
            <Text style={[styles.chartButtonText, { color: isDark ? '#17120B' : '#FFFFFF' }]}>
              Scan first room
            </Text>
          </LinearGradient>
        </Pressable>
      ) : null}
    </View>
  );
}

export default function ProgressScreen() {
  const rawScheme = useColorScheme();
  const isDark = rawScheme === 'dark';
  const reducedMotion = useReducedMotion();
  const insets = useSafeAreaInsets();
  const { stats, rooms: rawRooms, setActiveRoom } = useDeclutter();
  const rooms = rawRooms ?? [];
  const [mode, setMode] = useState<WindowMode>('weekly');

  const streak = stats?.currentStreak ?? 0;
  const completedTasks = stats?.totalTasksCompleted ?? 0;
  const completedRooms = stats?.totalRoomsCleaned ?? 0;

  const { weeklyData, monthlyData } = useMemo(() => {
    const weekly = [0, 0, 0, 0, 0, 0, 0];
    const monthly = [0, 0, 0, 0];
    const now = new Date();

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    rooms.forEach((room) => {
      (room.tasks ?? []).forEach((task) => {
        if (!task.completed || !task.completedAt) {
          return;
        }

        const completedAt = new Date(task.completedAt);
        if (completedAt >= startOfWeek) {
          const weeklyIndex = (completedAt.getDay() + 6) % 7;
          weekly[weeklyIndex] += 1;
        }

        if (completedAt >= startOfMonth) {
          const monthlyIndex = Math.min(3, Math.floor((completedAt.getDate() - 1) / 7));
          monthly[monthlyIndex] += 1;
        }
      });
    });

    return { weeklyData: weekly, monthlyData: monthly };
  }, [rooms]);

  const totalTasksAvailable = rooms.reduce((sum, room) => sum + (room.tasks?.length ?? 0), 0);
  const fullyCompletedRooms = rooms.filter((room) => (room.currentProgress ?? 0) >= 100).length;
  const roomsPercent = rooms.length > 0 ? Math.round((fullyCompletedRooms / rooms.length) * 100) : 0;
  const tasksPercent = totalTasksAvailable > 0 ? Math.round((completedTasks / totalTasksAvailable) * 100) : 0;
  const streakPercent = streak > 0 ? Math.min(Math.round((streak / 7) * 100), 100) : 0;
  const overallPercent = Math.round((roomsPercent + tasksPercent + streakPercent) / 3);

  const activeData = mode === 'weekly' ? weeklyData : monthlyData;
  const activeTotal = activeData.reduce((sum, value) => sum + value, 0);
  const activeMax = Math.max(...activeData, 1);
  const isEmpty = rooms.length === 0 || (completedTasks === 0 && completedRooms === 0 && streak === 0);

  const handleAchievements = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/achievements');
  };

  const handleStartReset = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setActiveRoom(null);
    router.push('/camera');
  };

  const enter = (delay: number) =>
    reducedMotion ? undefined : FadeInDown.duration(380).delay(delay);

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0A0A0A' : '#F8F8F8' }]}>
      <AmbientBackdrop isDark={isDark} variant="progress" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 14, paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={enter(0)} style={styles.header}>
          <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#17171A' }]}>Progress</Text>

          <Pressable
            onPress={handleAchievements}
            accessibilityRole="button"
            accessibilityLabel="View achievements"
            style={({ pressed }) => [
              styles.iconButton,
              {
                backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.82)',
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                opacity: pressed ? 0.78 : 1,
              },
            ]}
          >
            <Ionicons name="calendar-outline" size={18} color={isDark ? '#FFFFFF' : '#17171A'} />
          </Pressable>
        </Animated.View>

        <Animated.View entering={enter(70)} style={styles.segmentWrap}>
          <View
            style={[
              styles.segment,
              { backgroundColor: isDark ? 'rgba(22,22,26,0.92)' : 'rgba(23,23,26,0.08)' },
            ]}
          >
            {(['weekly', 'monthly'] as const).map((item) => {
              const selected = mode === item;
              return (
                <Pressable
                  key={item}
                  onPress={() => {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setMode(item);
                  }}
                  style={[
                    styles.segmentButton,
                    selected && {
                      backgroundColor: isDark ? '#2B2B30' : '#FFFFFF',
                    },
                  ]}
                  accessibilityRole="tab"
                  accessibilityState={{ selected }}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      {
                        color: selected
                          ? isDark
                            ? '#FFFFFF'
                            : '#17171A'
                          : isDark
                            ? 'rgba(255,255,255,0.44)'
                            : 'rgba(23,23,26,0.44)',
                      },
                    ]}
                  >
                    {item === 'weekly' ? 'Weekly' : 'Monthly'}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>

        <Animated.View entering={enter(120)} style={styles.ringsBlock}>
          <ConcentricRings
            roomsPercent={roomsPercent}
            tasksPercent={tasksPercent}
            streakPercent={streakPercent}
            overallPercent={overallPercent}
            isDark={isDark}
            reducedMotion={reducedMotion}
          />

          {isEmpty ? (
            <Text
              style={[
                styles.emptyHint,
                { color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(23,23,26,0.46)' },
              ]}
            >
              Scan one room to fill these rings. It takes less than 2 minutes.
            </Text>
          ) : null}

          <View style={styles.legendRow}>
            <LegendStat isDark={isDark} value={`${roomsPercent}%`} label="Rooms" />
            <LegendStat isDark={isDark} value={`${tasksPercent}%`} label="Tasks" />
            <LegendStat isDark={isDark} value={`${streakPercent}%`} label="Streak" />
          </View>
        </Animated.View>

        {!isEmpty ? (
          <Animated.View entering={enter(180)} style={styles.metricRow}>
            <MetricCard
              isDark={isDark}
              value={String(completedRooms)}
              label="Rooms"
              onPress={() => router.push('/rooms')}
            />
            <MetricCard
              isDark={isDark}
              value={String(completedTasks)}
              label="Tasks Done"
              onPress={handleAchievements}
            />
            <MetricCard
              isDark={isDark}
              value={String(streak)}
              label="Day Streak"
              icon="flame-outline"
              onPress={handleAchievements}
            />
          </Animated.View>
        ) : null}

        <Animated.View entering={enter(240)}>
          <ProgressChart
            isDark={isDark}
            mode={mode}
            data={activeData}
            total={activeTotal}
            max={activeMax}
            empty={isEmpty}
            onStartReset={handleStartReset}
          />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function LegendStat({
  isDark,
  value,
  label,
}: {
  isDark: boolean;
  value: string;
  label: string;
}) {
  return (
    <View style={styles.legendStat}>
      <Text style={[styles.legendValue, { color: isDark ? '#FFFFFF' : '#17171A' }]}>
        {value}
      </Text>
      <Text
        style={[
          styles.legendLabel,
          { color: isDark ? 'rgba(255,255,255,0.38)' : 'rgba(23,23,26,0.38)' },
        ]}
      >
        {label}
      </Text>
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
    paddingHorizontal: 20,
    gap: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: DISPLAY_FONT,
    fontSize: 32,
    lineHeight: 36,
    fontWeight: '700',
    letterSpacing: -0.7,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentWrap: {
    alignItems: 'center',
  },
  segment: {
    width: 194,
    borderRadius: 999,
    padding: 4,
    flexDirection: 'row',
  },
  segmentButton: {
    flex: 1,
    minHeight: 34,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentText: {
    fontFamily: BODY_FONT,
    fontSize: 13,
    fontWeight: '700',
  },
  ringsBlock: {
    alignItems: 'center',
    gap: 12,
  },
  ringShell: {
    width: 184,
    height: 184,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  ringPercent: {
    fontFamily: DISPLAY_FONT,
    fontSize: 34,
    lineHeight: 38,
    fontWeight: '700',
    letterSpacing: -0.8,
  },
  ringLabel: {
    fontFamily: BODY_FONT,
    fontSize: 13,
    fontWeight: '600',
  },
  emptyHint: {
    fontFamily: BODY_FONT,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    paddingHorizontal: 18,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 28,
  },
  legendStat: {
    alignItems: 'center',
    gap: 3,
    minWidth: 64,
  },
  legendValue: {
    fontFamily: DISPLAY_FONT,
    fontSize: 24,
    lineHeight: 26,
    fontWeight: '700',
  },
  legendLabel: {
    fontFamily: BODY_FONT,
    fontSize: 12,
    fontWeight: '500',
  },
  metricRow: {
    flexDirection: 'row',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  metricValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricNumber: {
    fontFamily: DISPLAY_FONT,
    fontSize: 28,
    lineHeight: 30,
    fontWeight: '700',
    letterSpacing: -0.7,
  },
  metricCaption: {
    fontFamily: BODY_FONT,
    fontSize: 12,
    fontWeight: '500',
  },
  chartCard: {
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 14,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  chartTitle: {
    fontFamily: DISPLAY_FONT,
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  chartSubtitle: {
    fontFamily: BODY_FONT,
    fontSize: 13,
    fontWeight: '500',
    marginTop: 4,
  },
  emptyCardBody: {
    fontFamily: BODY_FONT,
    fontSize: 13,
    lineHeight: 19,
  },
  chartChip: {
    overflow: 'hidden',
    fontFamily: BODY_FONT,
    fontSize: 12,
    fontWeight: '700',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 8,
    minHeight: 86,
  },
  chartBarWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
  },
  chartBar: {
    width: '100%',
    borderRadius: 8,
  },
  chartLabel: {
    fontFamily: BODY_FONT,
    fontSize: 11,
    fontWeight: '600',
  },
  emptyTrackRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  emptyTrackItem: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  emptyTrackPill: {
    width: '100%',
    height: 12,
    borderRadius: 999,
  },
  emptyTrackLabel: {
    fontFamily: BODY_FONT,
    fontSize: 11,
    fontWeight: '700',
  },
  chartButton: {
    minHeight: 52,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  chartButtonText: {
    fontFamily: BODY_FONT,
    fontSize: 15,
    fontWeight: '800',
  },
});
