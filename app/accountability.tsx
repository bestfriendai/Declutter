/**
 * Declutterly -- Accountability Screen
 * Matches Pencil design: "Accountability" title + people icon,
 * partner card, weekly check-in with checklist,
 * "Send Check-In to Jamie" CTA, check-in history dots, encouragement.
 */

import { AmbientBackdrop } from '@/components/ui/AmbientBackdrop';
import { ExpressiveStateView } from '@/components/ui/ExpressiveStateView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { Users } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { useDeclutter } from '@/context/DeclutterContext';
import { Connection, getConnections } from '@/services/social';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ─────────────────────────────────────────────────────────────────────────────
// Partner Card
// ─────────────────────────────────────────────────────────────────────────────
function PartnerCard({ isDark, partner }: { isDark: boolean; partner: Connection | null }) {
  if (!partner) {
    return (
      <View style={[styles.partnerCard, {
        backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF',
        borderColor: isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.06)',
      }]}>
        <View style={styles.partnerTop}>
          <View style={styles.partnerAvatarOuter}>
            <View style={[styles.partnerAvatar, {
              backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
              alignItems: 'center',
              justifyContent: 'center',
            }]}>
              <Text style={{ fontSize: 20, color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)' }}>?</Text>
            </View>
          </View>
          <View style={styles.partnerInfo}>
            <Text style={[styles.partnerName, {
              color: isDark ? 'rgba(255,255,255,0.38)' : 'rgba(0,0,0,0.4)',
            }]}>
              No partner yet
            </Text>
            <Text style={[styles.partnerStatus, {
              color: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.3)',
            }]}>
              Invite a friend from the Community tab
            </Text>
          </View>
        </View>
      </View>
    );
  }

  const initial = (partner.displayName.charAt(0) || '?').toUpperCase();

  return (
    <View style={[styles.partnerCard, {
      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF',
      borderColor: isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.06)',
    }]}>
      <View style={styles.partnerTop}>
        {/* Partner avatar */}
        <View style={styles.partnerAvatarOuter}>
          <LinearGradient
            colors={['#CCCCCC', '#808080'] as const}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.partnerAvatar, { alignItems: 'center', justifyContent: 'center' }]}
          >
            <Text style={{ fontSize: 18, fontWeight: '600', color: '#FFFFFF' }}>{initial}</Text>
          </LinearGradient>
        </View>

        {/* Partner info */}
        <View style={styles.partnerInfo}>
          <Text style={[styles.partnerName, {
            color: isDark ? '#FFFFFF' : '#1A1A1A',
          }]}>
            {partner.displayName}
          </Text>
          <Text style={[styles.partnerStatus, {
            color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)',
          }]}>
            Accountability Partner {'\u00B7'} Active {'\u{1F7E2}'}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Weekly Check-In Card
// ─────────────────────────────────────────────────────────────────────────────
function CheckInCard({ isDark, checkItems, onToggle }: {
  isDark: boolean;
  checkItems: Array<{ text: string; checked: boolean }>;
  onToggle: (idx: number) => void;
}) {
  return (
    <View style={[styles.checkInCard, {
      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#FFFFFF',
      borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
    }]}>
      {/* Header */}
      <View style={styles.checkInHeader}>
        <Text style={[styles.checkInTitle, { color: isDark ? 'rgba(255,255,255,0.21)' : 'rgba(0,0,0,0.25)' }]}>
          WEEKLY CHECK-IN
        </Text>
        <Text style={[styles.checkInDue, {
          color: isDark ? '#E0E0E0' : '#707070',
        }]}>
          Due in 2 days
        </Text>
      </View>

      {/* Checklist */}
      {checkItems.map((item, idx) => (
        <Pressable
          key={idx}
          style={styles.checkRow}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onToggle(idx);
          }}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: item.checked }}
          accessibilityLabel={item.text}
        >
          {item.checked ? (
            <LinearGradient
              colors={['#FFFFFF', '#AAAAAA'] as const}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.checkbox}
            />
          ) : (
            <View style={[styles.checkbox, {
              backgroundColor: isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.04)',
              borderWidth: 1.5,
              borderColor: isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.1)',
            }]} />
          )}
          <Text style={[styles.checkText, {
            color: item.checked
              ? (isDark ? '#FFFFFF' : '#1A1A1A')
              : (isDark ? 'rgba(255,255,255,0.38)' : 'rgba(0,0,0,0.45)'),
          }]}>
            {item.text}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Check-In History
// ─────────────────────────────────────────────────────────────────────────────
function CheckInHistory({ isDark, currentStreak }: { isDark: boolean; currentStreak: number }) {
  // Build week history from current streak
  const totalWeeks = 5;
  const completedWeeks = Math.min(currentStreak, totalWeeks);
  const weekHistory = Array.from({ length: totalWeeks }, (_, i) => ({
    label: `W${i + 1}`,
    complete: i < completedWeeks,
  }));

  const motivationMessage = currentStreak >= 3
    ? `${currentStreak} week streak! You're crushing it. Keep the momentum going!`
    : currentStreak >= 1
    ? `${currentStreak} week${currentStreak !== 1 ? 's' : ''} in. Every step counts!`
    : 'Complete your first check-in to start building your streak.';

  return (
    <View style={styles.historySection}>
      <Text style={[styles.historyTitle, { color: isDark ? 'rgba(255,255,255,0.21)' : 'rgba(0,0,0,0.25)' }]}>
        CHECK-IN HISTORY
      </Text>

      {/* Week dots */}
      <View style={styles.historyRow}>
        {weekHistory.map((week, idx) => (
          <View key={idx} style={styles.historyItem}>
            {week.complete ? (
              <View style={styles.historyDotComplete}>
                <LinearGradient
                  colors={['#E0E0E0', '#888888'] as const}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.historyDotGradient}
                />
              </View>
            ) : (
              <View style={[styles.historyDotEmpty, {
                backgroundColor: isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.06)',
                borderColor: isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.1)',
              }]} />
            )}
            <Text style={[styles.historyLabel, {
              color: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.3)',
            }]}>
              {week.label}
            </Text>
          </View>
        ))}
      </View>

      {/* Motivation message */}
      <View style={[styles.motivCard, {
        backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
        borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
      }]}>
        <Text style={styles.motivIcon}>{'\u{1F3AF}'}</Text>
        <Text style={[styles.motivText, {
          color: isDark ? 'rgba(255,255,255,0.44)' : 'rgba(0,0,0,0.45)',
        }]}>
          {motivationMessage}
        </Text>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────
export default function AccountabilityScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const rawScheme = useColorScheme();
  const colorScheme = rawScheme === 'dark' ? 'dark' : 'light';
  const isDark = colorScheme === 'dark';
  const reducedMotion = useReducedMotion();
  const { isAuthenticated } = useAuth();
  const { rooms, stats } = useDeclutter();

  // Load connections
  const [partner, setPartner] = useState<Connection | null>(null);
  const loadPartner = useCallback(async () => {
    try {
      const conns = await getConnections();
      setPartner(conns.length > 0 ? conns[0] : null);
    } catch {
      // No connections
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadPartner();
    }
  }, [isAuthenticated, loadPartner]);

  // Build dynamic check-in items based on actual user activity this week
  const buildCheckInItems = useCallback(() => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    // Count rooms cleaned this week
    const roomsCleanedThisWeek = (rooms ?? []).filter(r =>
      (r?.tasks ?? []).some(t => t?.completed && t?.completedAt && new Date(t.completedAt) >= weekStart)
    ).length;

    // Count tasks completed this week
    let tasksThisWeek = 0;
    for (const room of rooms ?? []) {
      for (const task of room?.tasks ?? []) {
        if (task?.completed && task?.completedAt && new Date(task.completedAt) >= weekStart) {
          tasksThisWeek++;
        }
      }
    }

    // Total minutes this week
    const totalMinutes = stats?.totalMinutesCleaned ?? 0;

    return [
      { text: `Cleaned a room this week`, checked: roomsCleanedThisWeek > 0 },
      { text: `Completed 5+ tasks`, checked: tasksThisWeek >= 5 },
      { text: `Spent 30+ min cleaning`, checked: totalMinutes >= 30 },
    ];
  }, [rooms, stats]);

  const [checkItems, setCheckItems] = useState(() => buildCheckInItems());

  // Refresh check-in items when data changes
  useEffect(() => {
    setCheckItems(buildCheckInItems());
  }, [buildCheckInItems]);

  const handleToggleCheck = (idx: number) => {
    setCheckItems(prev => prev.map((item, i) =>
      i === idx ? { ...item, checked: !item.checked } : item
    ));
  };

  const completedCount = checkItems.filter(item => item.checked).length;
  const allComplete = completedCount === checkItems.length;

  const partnerName = partner?.displayName ?? 'your partner';

  const handleSendCheckIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!partner) {
      Alert.alert(
        'No partner yet',
        'Add a connection from the Community tab to start sending check-ins.'
      );
      return;
    }
    if (completedCount === 0) {
      Alert.alert(
        'Check something off first!',
        'Complete at least one item before sending your check-in. Even one small thing counts.'
      );
      return;
    }
    Alert.alert(
      allComplete ? 'All done! Check-In Sent!' : 'Check-In Sent!',
      allComplete
        ? `${partnerName} will be so proud. You crushed it this week!`
        : `${partnerName} will see your ${completedCount}/${checkItems.length} progress. Keep it up!`
    );
  };

  const handleOpenSocial = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/social');
  };

  const handleOpenAuth = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/auth/login');
  };

  const enterAnim = (delay: number) =>
    reducedMotion ? undefined : FadeInDown.delay(delay).duration(350);

  // Show sign-in prompt for unauthenticated users
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
            kicker="ACCOUNTABILITY"
            emoji="🤝"
            title="Stay in it with someone beside you."
            description="Pair up with a friend for gentle check-ins, shared momentum, and shame-free consistency."
            primaryLabel="Sign In"
            onPrimary={handleOpenAuth}
            accentColors={isDark ? ['#D9C9A8', '#C4A87A', '#A8895C'] as const : ['#D4BD96', '#C4A87A', '#9E8260'] as const}
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
      >
        {/* Header: Accountability + people icon */}
        <Animated.View entering={enterAnim(0)} style={styles.header}>
          <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#1A1A1A' }]}>
            Accountability
          </Text>
          <Pressable
            onPress={handleOpenSocial}
            style={[styles.headerIconBtn, {
              backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
            }]}
            accessibilityRole="button"
            accessibilityLabel="Partner settings"
          >
            <Users
              size={20}
              color={isDark ? '#FFFFFF' : '#1A1A1A'}
            />
          </Pressable>
        </Animated.View>

        {/* Partner Card */}
        <Animated.View entering={enterAnim(60)} style={styles.section}>
          <PartnerCard isDark={isDark} partner={partner} />
        </Animated.View>

        {/* Weekly Check-In */}
        <Animated.View entering={enterAnim(120)} style={styles.section}>
          <CheckInCard
            isDark={isDark}
            checkItems={checkItems}
            onToggle={handleToggleCheck}
          />
        </Animated.View>

        {/* Send Check-In Button */}
        <Animated.View entering={enterAnim(180)} style={styles.section}>
          <Pressable
            onPress={handleSendCheckIn}
            accessibilityRole="button"
            accessibilityLabel={partner ? `Send Check-In to ${partnerName}` : 'Send Check-In'}
            style={({ pressed }) => [styles.sendBtn, {
              backgroundColor: allComplete
                ? (isDark ? '#30D158' : '#30D158')
                : (isDark ? '#FFFFFF' : '#1A1A1A'),
              opacity: pressed ? 0.85 : 1,
            }]}
          >
            <Text style={[styles.sendBtnText, {
              color: allComplete ? '#FFFFFF' : (isDark ? '#0A0A0A' : '#FFFFFF'),
            }]}>
              {allComplete
                ? 'Send Check-In (all done!)'
                : partner
                  ? `Send Check-In to ${partnerName} (${completedCount}/${checkItems.length})`
                  : `Check-In (${completedCount}/${checkItems.length})`
              }
            </Text>
          </Pressable>
        </Animated.View>

        {/* Check-In History */}
        <Animated.View entering={enterAnim(240)} style={styles.section}>
          <CheckInHistory isDark={isDark} currentStreak={stats?.currentStreak ?? 0} />
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
  section: { marginBottom: 20 },

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
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Partner Card ──
  partnerCard: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  partnerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  partnerAvatarOuter: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 2.5,
    borderColor: '#E0E0E0',
  },
  partnerAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
  },
  partnerInfo: {
    flex: 1,
    gap: 4,
  },
  partnerName: {
    fontSize: 16,
    fontWeight: '500',
  },
  partnerStatus: {
    fontSize: 12,
    fontWeight: '500',
  },

  // ── Check-In Card ──
  checkInCard: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  checkInHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  checkInTitle: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  checkInDue: {
    fontSize: 12,
    fontWeight: '500',
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
  },
  checkText: {
    fontSize: 14,
    fontWeight: '400',
    flex: 1,
  },

  // ── Send Button ──
  sendBtn: {
    height: 52,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },

  // ── History Section ──
  historySection: {
    gap: 14,
  },
  historyTitle: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  historyItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  historyDotComplete: {
    width: 28,
    height: 28,
    borderRadius: 14,
    overflow: 'hidden',
  },
  historyDotGradient: {
    width: '100%',
    height: '100%',
  },
  historyDotEmpty: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
  },
  historyLabel: {
    fontSize: 9,
    fontWeight: '400',
    textAlign: 'center',
  },

  // ── Motivation Card ──
  motivCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    gap: 10,
  },
  motivIcon: {
    fontSize: 16,
  },
  motivText: {
    fontSize: 13,
    fontWeight: '400',
    flex: 1,
    lineHeight: 18,
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
