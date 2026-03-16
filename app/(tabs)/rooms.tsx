import { AmbientBackdrop } from '@/components/ui/AmbientBackdrop';
import { useDeclutter } from '@/context/DeclutterContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { Room } from '@/types/declutter';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const BODY_FONT = 'DM Sans';
const DISPLAY_FONT = 'Bricolage Grotesque';

const ROOM_ICON_MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
  bedroom: 'bed-outline',
  kitchen: 'restaurant-outline',
  bathroom: 'water-outline',
  livingRoom: 'tv-outline',
  living_room: 'tv-outline',
  office: 'desktop-outline',
  garage: 'car-outline',
  closet: 'shirt-outline',
  other: 'cube-outline',
};

const STARTER_ROOMS = [
  { label: 'Kitchen counter', icon: 'restaurant-outline' as const, note: 'Fast visible win' },
  { label: 'Bedroom floor', icon: 'bed-outline' as const, note: 'Low-friction start' },
  { label: 'Bathroom sink', icon: 'water-outline' as const, note: 'Quick reset' },
];

function getRoomIcon(type?: string): keyof typeof Ionicons.glyphMap {
  if (!type) return 'cube-outline';
  return ROOM_ICON_MAP[type] || 'cube-outline';
}

function getRoomSummary(room: Room) {
  const tasks = room.tasks ?? [];
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => task.completed).length;
  const pendingTasks = Math.max(totalTasks - completedTasks, 0);

  if (totalTasks === 0) {
    return 'Ready for its first plan';
  }

  if (pendingTasks === 0) {
    return `${completedTasks}/${totalTasks} tasks complete`;
  }

  return `${pendingTasks} task${pendingTasks === 1 ? '' : 's'} left`;
}

function getRoomsMomentum(rooms: Room[]) {
  const totalTasks = rooms.reduce((sum, room) => sum + (room.tasks?.length ?? 0), 0);
  const completedTasks = rooms.reduce(
    (sum, room) => sum + (room.tasks ?? []).filter((task) => task.completed).length,
    0
  );

  return {
    totalRooms: rooms.length,
    totalTasks,
    completedTasks,
    pendingTasks: Math.max(totalTasks - completedTasks, 0),
  };
}

export default function RoomsScreen() {
  const rawScheme = useColorScheme();
  const isDark = rawScheme === 'dark';
  const reducedMotion = useReducedMotion();
  const insets = useSafeAreaInsets();
  const { rooms, setActiveRoom } = useDeclutter();

  const safeRooms = rooms ?? [];
  const isLoading = rooms === undefined || rooms === null;
  const momentum = useMemo(() => getRoomsMomentum(safeRooms), [safeRooms]);

  const handleScan = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setActiveRoom(null);
    router.push('/camera');
  }, [setActiveRoom]);

  const handleRoomPress = useCallback((roomId: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/room/${roomId}`);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0A0A0A' : '#F8F8F8' }]}>
      <AmbientBackdrop isDark={isDark} variant="home" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={reducedMotion ? undefined : FadeInDown.duration(360)}>
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#17171A' }]}>
                Your Rooms
              </Text>
              <Text
                style={[
                  styles.subtitle,
                  { color: isDark ? 'rgba(255,255,255,0.56)' : 'rgba(23,23,26,0.52)' },
                ]}
              >
                {safeRooms.length > 0
                  ? `${momentum.pendingTasks} task${momentum.pendingTasks === 1 ? '' : 's'} left across ${momentum.totalRooms} room${momentum.totalRooms === 1 ? '' : 's'}.`
                  : 'Start with the space that gives you the fastest visible relief.'}
              </Text>
            </View>

            <Pressable
              onPress={handleScan}
              accessibilityRole="button"
              accessibilityLabel="Scan a new room"
              style={({ pressed }) => [
                styles.headerAction,
                {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.78)',
                  borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                  opacity: pressed ? 0.78 : 1,
                },
              ]}
            >
              <Ionicons name="camera-outline" size={18} color={isDark ? '#FFFFFF' : '#17171A'} />
            </Pressable>
          </View>
        </Animated.View>

        {isLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={isDark ? '#FFFFFF' : '#17171A'} />
          </View>
        ) : safeRooms.length === 0 ? (
          <Animated.View entering={reducedMotion ? undefined : FadeInDown.duration(380).delay(70)}>
            <StarterCard isDark={isDark} onScan={handleScan} />
          </Animated.View>
        ) : (
          <>
            <Animated.View entering={reducedMotion ? undefined : FadeInDown.duration(380).delay(70)}>
              <OverviewCard
                isDark={isDark}
                totalRooms={momentum.totalRooms}
                pendingTasks={momentum.pendingTasks}
                completedTasks={momentum.completedTasks}
                onScan={handleScan}
              />
            </Animated.View>

            <View style={styles.roomList}>
              {safeRooms.map((room, index) => (
                <Animated.View
                  key={room.id}
                  entering={reducedMotion ? undefined : FadeInDown.duration(380).delay(110 + index * 45)}
                >
                  <RoomCard
                    isDark={isDark}
                    room={room}
                    onPress={() => handleRoomPress(room.id)}
                  />
                </Animated.View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function StarterCard({ isDark, onScan }: { isDark: boolean; onScan: () => void }) {
  return (
    <LinearGradient
      colors={
        isDark
          ? ['rgba(23,23,28,0.96)', 'rgba(14,14,18,0.98)']
          : ['rgba(255,255,255,0.98)', 'rgba(249,245,239,0.96)']
      }
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.starterCard,
        { borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' },
      ]}
    >
      <View
        style={[
          styles.starterGlow,
          { backgroundColor: isDark ? 'rgba(255,184,111,0.14)' : 'rgba(255,207,160,0.26)' },
        ]}
      />

      <LinearGradient
        colors={
          isDark
            ? ['#FFD39A', '#FFAA63']
            : ['#FFC888', '#FFA36A']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.starterIcon}
      >
        <Ionicons name="camera-outline" size={24} color="#17120B" />
      </LinearGradient>

      <Text style={[styles.starterEyebrow, { color: isDark ? '#F7DAB5' : '#8A5926' }]}>
        FIRST ROOM
      </Text>
      <Text style={[styles.starterTitle, { color: isDark ? '#FFF9F1' : '#17171A' }]}>
        Start with the room you see most.
      </Text>
      <Text
        style={[
          styles.starterDescription,
          { color: isDark ? 'rgba(255,255,255,0.56)' : 'rgba(23,23,26,0.56)' },
        ]}
      >
        One photo is enough. Declutterly will turn it into a calm, ordered next step instead of a giant project.
      </Text>

      <Text style={[styles.starterSuggestionLabel, { color: isDark ? '#D4B48B' : '#84511D' }]}>
        Easiest first wins
      </Text>

      <View style={styles.starterSuggestionWrap}>
        {STARTER_ROOMS.map((suggestion) => (
          <Pressable
            key={suggestion.label}
            onPress={onScan}
            accessibilityRole="button"
            accessibilityLabel={`Scan ${suggestion.label}`}
            style={({ pressed }) => [{ opacity: pressed ? 0.84 : 1 }]}
          >
            <View
              style={[
                styles.starterSuggestionPill,
                {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,248,241,0.94)',
                  borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                },
              ]}
            >
              <Ionicons
                name={suggestion.icon}
                size={14}
                color={isDark ? '#FFCE96' : '#7A5021'}
              />
              <Text
                style={[
                  styles.starterSuggestionText,
                  { color: isDark ? '#FFF3E2' : '#56361A' },
                ]}
              >
                {suggestion.label}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>

      <Pressable
        onPress={onScan}
        accessibilityRole="button"
        accessibilityLabel="Scan first room"
        style={({ pressed }) => [{ opacity: pressed ? 0.88 : 1 }]}
      >
        <LinearGradient
          colors={isDark ? ['#FFF4E3', '#F9D39C'] : ['#1B1B20', '#35333D']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.starterButton}
        >
          <Text style={[styles.starterButtonText, { color: isDark ? '#17120B' : '#FFFFFF' }]}>
            Scan first room
          </Text>
          <Ionicons name="arrow-forward" size={16} color={isDark ? '#17120B' : '#FFFFFF'} />
        </LinearGradient>
      </Pressable>
    </LinearGradient>
  );
}

function OverviewCard({
  isDark,
  totalRooms,
  pendingTasks,
  completedTasks,
  onScan,
}: {
  isDark: boolean;
  totalRooms: number;
  pendingTasks: number;
  completedTasks: number;
  onScan: () => void;
}) {
  return (
    <View
      style={[
        styles.overviewCard,
        {
          backgroundColor: isDark ? 'rgba(19,19,23,0.94)' : 'rgba(255,255,255,0.92)',
          borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
        },
      ]}
    >
      <View style={styles.overviewHeader}>
        <View style={styles.overviewCopy}>
          <Text style={[styles.overviewEyebrow, { color: isDark ? '#F3C37A' : '#956631' }]}>
            ROOM MAP
          </Text>
          <Text style={[styles.overviewTitle, { color: isDark ? '#FFFFFF' : '#17171A' }]}>
            Keep going room by room.
          </Text>
          <Text
            style={[
              styles.overviewDescription,
              { color: isDark ? 'rgba(255,255,255,0.52)' : 'rgba(23,23,26,0.52)' },
            ]}
          >
            {completedTasks} tasks finished, {pendingTasks} still waiting for the next pass.
          </Text>
        </View>

        <Pressable
          onPress={onScan}
          accessibilityRole="button"
          accessibilityLabel="Scan another room"
          style={({ pressed }) => [
            styles.scanPill,
            {
              backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(248,244,238,0.95)',
              borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
              opacity: pressed ? 0.82 : 1,
            },
          ]}
        >
          <Ionicons name="scan-outline" size={14} color={isDark ? '#FFFFFF' : '#17171A'} />
          <Text style={[styles.scanPillText, { color: isDark ? '#FFFFFF' : '#17171A' }]}>
            Scan another
          </Text>
        </Pressable>
      </View>

      <View style={styles.metricRow}>
        <MetricCard isDark={isDark} value={String(totalRooms)} label="Rooms" />
        <MetricCard isDark={isDark} value={String(pendingTasks)} label="Tasks left" />
        <MetricCard isDark={isDark} value={String(completedTasks)} label="Done" />
      </View>
    </View>
  );
}

function MetricCard({
  isDark,
  value,
  label,
}: {
  isDark: boolean;
  value: string;
  label: string;
}) {
  return (
    <View
      style={[
        styles.metricCard,
        {
          backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(248,245,241,0.88)',
          borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
        },
      ]}
    >
      <Text style={[styles.metricValue, { color: isDark ? '#FFFFFF' : '#17171A' }]}>
        {value}
      </Text>
      <Text
        style={[
          styles.metricLabel,
          { color: isDark ? 'rgba(255,255,255,0.42)' : 'rgba(23,23,26,0.44)' },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

function RoomCard({
  isDark,
  room,
  onPress,
}: {
  isDark: boolean;
  room: Room;
  onPress: () => void;
}) {
  const progress = Math.round(room.currentProgress ?? 0);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Open ${room.name}`}
      style={({ pressed }) => [{ opacity: pressed ? 0.84 : 1 }]}
    >
      <View
        style={[
          styles.roomCard,
          {
            backgroundColor: isDark ? 'rgba(20,20,24,0.94)' : 'rgba(255,255,255,0.96)',
            borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
          },
        ]}
      >
        <LinearGradient
          colors={
            isDark
              ? ['rgba(255,201,148,0.22)', 'rgba(255,142,88,0.1)']
              : ['rgba(255,223,189,0.92)', 'rgba(255,188,139,0.42)']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.roomIcon}
        >
          <Ionicons name={getRoomIcon(room.type)} size={18} color={isDark ? '#FFF6E8' : '#5B3916'} />
        </LinearGradient>

        <View style={styles.roomCopy}>
          <Text style={[styles.roomName, { color: isDark ? '#FFFFFF' : '#17171A' }]}>
            {room.name}
          </Text>
          <Text
            style={[
              styles.roomDescription,
              { color: isDark ? 'rgba(255,255,255,0.48)' : 'rgba(23,23,26,0.5)' },
            ]}
          >
            {getRoomSummary(room)}
          </Text>
          <View
            style={[
              styles.progressTrack,
              { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)' },
            ]}
          >
            <LinearGradient
              colors={isDark ? ['#FFD7A6', '#F5A06C'] : ['#D9B080', '#B98556']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.progressFill, { width: `${Math.max(progress, 6)}%` }]}
            />
          </View>
        </View>

        <View style={styles.roomTrailing}>
          <Text style={[styles.roomPercent, { color: isDark ? '#FFFFFF' : '#17171A' }]}>
            {progress}%
          </Text>
          <Text
            style={[
              styles.roomContinue,
              { color: isDark ? 'rgba(255,255,255,0.42)' : 'rgba(23,23,26,0.42)' },
            ]}
          >
            Continue
          </Text>
        </View>
      </View>
    </Pressable>
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
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
  },
  headerCopy: {
    flex: 1,
    gap: 6,
  },
  title: {
    fontFamily: DISPLAY_FONT,
    fontSize: 32,
    lineHeight: 36,
    fontWeight: '700',
    letterSpacing: -0.7,
  },
  subtitle: {
    fontFamily: BODY_FONT,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  headerAction: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingWrap: {
    minHeight: 280,
    alignItems: 'center',
    justifyContent: 'center',
  },
  starterCard: {
    overflow: 'hidden',
    borderRadius: 30,
    borderWidth: 1,
    paddingHorizontal: 24,
    paddingVertical: 24,
    alignItems: 'center',
  },
  starterGlow: {
    position: 'absolute',
    top: -24,
    right: -18,
    width: 136,
    height: 136,
    borderRadius: 68,
  },
  starterIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  starterEyebrow: {
    fontFamily: BODY_FONT,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8,
  },
  starterTitle: {
    fontFamily: DISPLAY_FONT,
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '700',
    letterSpacing: -0.7,
    textAlign: 'center',
  },
  starterDescription: {
    fontFamily: BODY_FONT,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 10,
  },
  starterSuggestionLabel: {
    fontFamily: BODY_FONT,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginTop: 18,
  },
  starterSuggestionWrap: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginTop: 12,
    marginBottom: 20,
  },
  starterSuggestionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  starterSuggestionText: {
    fontFamily: BODY_FONT,
    fontSize: 12,
    fontWeight: '700',
  },
  starterButton: {
    minHeight: 54,
    minWidth: 220,
    borderRadius: 999,
    paddingHorizontal: 24,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  starterButtonText: {
    fontFamily: BODY_FONT,
    fontSize: 16,
    fontWeight: '800',
  },
  overviewCard: {
    borderRadius: 26,
    borderWidth: 1,
    padding: 20,
    gap: 18,
  },
  overviewHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  overviewCopy: {
    flex: 1,
    gap: 6,
  },
  overviewEyebrow: {
    fontFamily: BODY_FONT,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  overviewTitle: {
    fontFamily: DISPLAY_FONT,
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '700',
    letterSpacing: -0.6,
  },
  overviewDescription: {
    fontFamily: BODY_FONT,
    fontSize: 14,
    lineHeight: 20,
  },
  scanPill: {
    minHeight: 40,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  scanPillText: {
    fontFamily: BODY_FONT,
    fontSize: 13,
    fontWeight: '700',
  },
  metricRow: {
    flexDirection: 'row',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  metricValue: {
    fontFamily: DISPLAY_FONT,
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '700',
  },
  metricLabel: {
    fontFamily: BODY_FONT,
    fontSize: 12,
    fontWeight: '500',
  },
  roomList: {
    gap: 12,
  },
  roomCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  roomIcon: {
    width: 48,
    height: 48,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roomCopy: {
    flex: 1,
    gap: 6,
  },
  roomName: {
    fontFamily: BODY_FONT,
    fontSize: 16,
    fontWeight: '700',
  },
  roomDescription: {
    fontFamily: BODY_FONT,
    fontSize: 13,
    fontWeight: '500',
  },
  progressTrack: {
    height: 7,
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: 2,
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  roomTrailing: {
    alignItems: 'flex-end',
    gap: 4,
  },
  roomPercent: {
    fontFamily: DISPLAY_FONT,
    fontSize: 20,
    lineHeight: 22,
    fontWeight: '700',
  },
  roomContinue: {
    fontFamily: BODY_FONT,
    fontSize: 12,
    fontWeight: '600',
  },
});
