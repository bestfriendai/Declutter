/**
 * Declutterly -- Accountability Screen
 * Matches Pencil design: "Accountability" title + people icon,
 * partner card, weekly check-in with checklist,
 * "Send Check-In to Jamie" CTA, check-in history dots, encouragement.
 */

import { Colors } from '@/constants/Colors';
import { AmbientBackdrop } from '@/components/ui/AmbientBackdrop';
import { ExpressiveStateView } from '@/components/ui/ExpressiveStateView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { Typography } from '@/theme/typography';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
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
// Check-in items (matching design)
// ─────────────────────────────────────────────────────────────────────────────
const CHECK_IN_ITEMS = [
  { text: 'Cleaned bedroom this week', checked: true },
  { text: '30-min declutter session', checked: false },
  { text: 'Donated 5 items', checked: false },
];

// Week history (W1-W5, first 3 complete)
const WEEK_HISTORY = [
  { label: 'W1', complete: true },
  { label: 'W2', complete: true },
  { label: 'W3', complete: true },
  { label: 'W4', complete: false },
  { label: 'W5', complete: false },
];

// ─────────────────────────────────────────────────────────────────────────────
// Partner Card
// ─────────────────────────────────────────────────────────────────────────────
function PartnerCard({ isDark }: { isDark: boolean }) {
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
            style={styles.partnerAvatar}
          />
        </View>

        {/* Partner info */}
        <View style={styles.partnerInfo}>
          <Text style={[styles.partnerName, {
            color: isDark ? '#FFFFFF' : '#1A1A1A',
          }]}>
            Jamie R.
          </Text>
          <Text style={[styles.partnerStatus, {
            color: isDark ? '#FFFFFF' : '#1A1A1A',
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
      borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
    }]}>
      {/* Header */}
      <View style={styles.checkInHeader}>
        <Text style={[styles.checkInTitle, {
          color: isDark ? '#FFFFFF' : '#1A1A1A',
        }]}>
          Weekly Check-In
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
function CheckInHistory({ isDark }: { isDark: boolean }) {
  return (
    <View style={styles.historySection}>
      <Text style={[styles.historyTitle, {
        color: isDark ? '#FFFFFF' : '#1A1A1A',
      }]}>
        Check-In History
      </Text>

      {/* Week dots */}
      <View style={styles.historyRow}>
        {WEEK_HISTORY.map((week, idx) => (
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
          3 week streak! You and Jamie are crushing it. Keep the momentum going!
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
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  const reducedMotion = useReducedMotion();
  const { isAuthenticated } = useAuth();

  // State
  const [checkItems, setCheckItems] = useState(CHECK_IN_ITEMS);

  const handleToggleCheck = (idx: number) => {
    setCheckItems(prev => prev.map((item, i) =>
      i === idx ? { ...item, checked: !item.checked } : item
    ));
  };

  const handleSendCheckIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Check-In Sent!', 'Jamie will see your progress. Keep it up!');
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
    reducedMotion ? undefined : FadeInDown.delay(delay).springify();

  // Show sign-in prompt for unauthenticated users
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
            kicker="ACCOUNTABILITY"
            emoji="🤝"
            title="Stay in it with someone beside you."
            description="Pair up with a friend for gentle check-ins, shared momentum, and shame-free consistency."
            primaryLabel="Sign In"
            onPrimary={handleOpenAuth}
            accentColors={isDark ? ['#FFD9A1', '#FFB547', '#FF8C63'] as const : ['#FFD39A', '#FFB547', '#FF9B71'] as const}
            style={styles.expressiveEmptyState}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0A0A0A' : '#FAFAFA' }]}>
      <LinearGradient
        colors={isDark
          ? ['#0A0A0A', '#141414'] as const
          : ['#FAFAFA', '#F5F5F5'] as const
        }
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, {
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 100,
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
              backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
            }]}
            accessibilityRole="button"
            accessibilityLabel="Partner settings"
          >
            <Ionicons
              name="people-outline"
              size={20}
              color={isDark ? '#FFFFFF' : '#1A1A1A'}
            />
          </Pressable>
        </Animated.View>

        {/* Partner Card */}
        <Animated.View entering={enterAnim(60)} style={styles.section}>
          <PartnerCard isDark={isDark} />
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
            accessibilityLabel="Send Check-In to Jamie"
            style={({ pressed }) => [styles.sendBtn, {
              backgroundColor: isDark ? '#FFFFFF' : '#1A1A1A',
              opacity: pressed ? 0.85 : 1,
            }]}
          >
            <Text style={[styles.sendBtnText, {
              color: isDark ? '#0A0A0A' : '#FFFFFF',
            }]}>
              Send Check-In to Jamie
            </Text>
          </Pressable>
        </Animated.View>

        {/* Check-In History */}
        <Animated.View entering={enterAnim(240)} style={styles.section}>
          <CheckInHistory isDark={isDark} />
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
  },
  checkInHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  checkInTitle: {
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: -0.3,
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
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: -0.3,
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
