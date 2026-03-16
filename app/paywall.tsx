/**
 * Declutterly -- Paywall Screen
 * Matches Pencil design: Close X, "DECLUTTER PRO" badge, hero heading,
 * feature list with checkmarks, star rating + quote, pricing toggle,
 * "Start My Free Week" CTA, fine print, guarantee.
 */

import { Colors } from '@/constants/Colors';
import { PromptModal } from '@/components/ui/PromptModal';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useRevenueCat, PRODUCT_IDS } from '@/hooks/useRevenueCat';
import { Typography } from '@/theme/typography';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ─────────────────────────────────────────────────────────────────────────────
// Features
// ─────────────────────────────────────────────────────────────────────────────
const FEATURES = [
  'AI breaks big messes into tiny, doable tasks',
  'Streak shields so one bad day doesn\'t erase progress',
  'Unlimited room scans with smart priority ordering',
  'Your personal cleaning buddy who gets ADHD',
  'Focus timer + celebration moments that keep you going',
];

// ─────────────────────────────────────────────────────────────────────────────
// Feature Row
// ─────────────────────────────────────────────────────────────────────────────
function FeatureRow({ text, isDark, delay }: { text: string; isDark: boolean; delay: number }) {
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(350)}
      style={styles.featureRow}
    >
      <View style={[styles.featureCheck, {
        backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
      }]}>
        <Text style={[styles.featureCheckIcon, {
          color: isDark ? '#FFFFFF' : '#1A1A1A',
        }]}>
          {'\u2713'}
        </Text>
      </View>
      <Text style={[styles.featureText, {
        color: isDark ? '#FFFFFF' : '#1A1A1A',
      }]}>
        {text}
      </Text>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────
export default function PaywallScreen() {
  const rawScheme = useColorScheme();
  const colorScheme = rawScheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  const {
    isLoading,
    error,
    plans,
    purchasePlan,
    restorePurchases,
  } = useRevenueCat();

  const [isPurchasing, setIsPurchasing] = useState(false);
  const [selectedTier, setSelectedTier] = useState<'monthly' | 'annual'>('annual');
  const [promoCodeDraft, setPromoCodeDraft] = useState('');
  const [isPromoVisible, setIsPromoVisible] = useState(false);

  const monthlyPlan = useMemo(
    () => plans.find((plan) => plan.id === PRODUCT_IDS.monthly),
    [plans]
  );
  const annualPlan = useMemo(
    () => plans.find((plan) => plan.id === PRODUCT_IDS.annual),
    [plans]
  );
  const selectedPlan = selectedTier === 'annual' ? annualPlan : monthlyPlan;
  const postTrialCopy = useMemo(() => {
    if (selectedTier === 'annual') {
      return annualPlan?.price ?? '$39.99/year';
    }
    return monthlyPlan?.price ?? '$4.99/month';
  }, [annualPlan, monthlyPlan, selectedTier]);

  // Handle purchase
  const handlePurchase = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setIsPurchasing(true);

    try {
      const planId = selectedTier === 'annual' ? PRODUCT_IDS.annual : PRODUCT_IDS.monthly;
      const success = await purchasePlan(planId);
      if (success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace('/notification-permission');
      }
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Purchase Failed', 'Something went wrong. Please try again.');
    } finally {
      setIsPurchasing(false);
    }
  }, [purchasePlan, selectedTier]);

  // Handle restore
  const handleRestore = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsPurchasing(true);

    try {
      const success = await restorePurchases();
      if (success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Restored!', 'Your subscription has been restored.', [
          { text: 'Continue', onPress: () => router.replace('/notification-permission') }
        ]);
      } else {
        Alert.alert('No Subscription Found', 'We couldn\'t find an active subscription to restore.');
      }
    } catch {
      Alert.alert('Restore Failed', 'Unable to restore purchases. Please try again.');
    } finally {
      setIsPurchasing(false);
    }
  }, [restorePurchases]);

  // Handle close
  const handleClose = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, []);

  // Open terms/privacy
  const openTerms = () => Linking.openURL('https://declutterly.app/terms');
  const openPrivacy = () => Linking.openURL('https://declutterly.app/privacy');

  const handlePromoSubmit = useCallback(async () => {
    const trimmedCode = promoCodeDraft.trim();
    if (!trimmedCode) {
      return;
    }

    setIsPromoVisible(false);
    setPromoCodeDraft('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const subject = encodeURIComponent('Declutterly promo code redemption');
      const body = encodeURIComponent(
        `Hi Declutterly,\n\nI'd like help redeeming this promo code:\n${trimmedCode}\n`
      );
      await Linking.openURL(
        `mailto:support@declutterly.app?subject=${subject}&body=${body}`
      );
    } catch {
      Alert.alert(
        'Promo code',
        'We could not open your email app. Please send your code to support@declutterly.app.'
      );
    }
  }, [promoCodeDraft]);

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0A0A0A' : '#FFFFFF' }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, {
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 40,
        }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Close button */}
        <Animated.View entering={FadeIn.delay(100).duration(350)}>
          <Pressable
            onPress={handleClose}
            style={[styles.closeButton, {
              backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
            }]}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <Text style={[styles.closeIcon, { color: isDark ? '#FFFFFF' : '#1A1A1A' }]}>
              {'\u2715'}
            </Text>
          </Pressable>
        </Animated.View>

        {/* DECLUTTER PRO badge */}
        <Animated.View entering={FadeInDown.delay(150).duration(350)} style={styles.proBadgeContainer}>
          <LinearGradient
            colors={isDark
              ? ['#C4A87A', '#8A7A60'] as const
              : ['#1A1A1A', '#333333'] as const
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.proBadge}
          >
            <Text style={styles.proBadgeText}>DECLUTTER PRO</Text>
          </LinearGradient>
        </Animated.View>

        {/* Hero heading */}
        <Animated.View entering={FadeInDown.delay(200).duration(350)}>
          <Text style={[styles.heroHeading, { color: isDark ? '#FFFFFF' : '#1A1A1A' }]}>
            Finally Finish{'\n'}What You Start.
          </Text>
        </Animated.View>

        {/* Subtitle */}
        <Animated.View entering={FadeInDown.delay(250).duration(350)}>
          <Text style={[styles.heroSubtitle, { color: isDark ? 'rgba(255,255,255,0.55)' : '#606060' }]}>
            Built for ADHD brains. AI breaks the overwhelm{'\n'}into small wins that actually stick.
          </Text>
        </Animated.View>

        {/* Editor's Choice badge */}
        <Animated.View entering={FadeInDown.delay(280).duration(350)} style={styles.editorBadgeContainer}>
          <View style={[styles.editorBadge, {
            backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
            borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
          }]}>
            <Text style={{ fontSize: 12 }}>{'\u{1F9E0}'}</Text>
            <Text style={[styles.editorBadgeText, {
              color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
            }]}>
              Built for ADHD brains
            </Text>
          </View>
        </Animated.View>

        {/* Feature list */}
        <View style={styles.featuresList}>
          {FEATURES.map((feature, idx) => (
            <FeatureRow
              key={feature}
              text={feature}
              isDark={isDark}
              delay={300 + idx * 50}
            />
          ))}
        </View>

        {/* Star rating + quote */}
        <Animated.View entering={FadeInDown.delay(600).duration(350)} style={styles.socialProofSection}>
          {/* Stars */}
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((i) => (
              <Text key={i} style={styles.star}>{'\u2605'}</Text>
            ))}
            <Text style={[styles.ratingText, { color: isDark ? '#FFFFFF' : '#1A1A1A' }]}>
              Loved by ADHD community
            </Text>
          </View>

          {/* Quote */}
          <Text style={[styles.quoteText, {
            color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
          }]}>
            {'\u201C'}I went from paralyzed by mess to actually enjoying cleaning. The small tasks thing is genius for ADHD.{'\u201D'}
          </Text>
          <Text style={[styles.quoteAuthor, {
            color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)',
          }]}>
            -- Verified Pro subscriber
          </Text>
        </Animated.View>

        {/* Pricing toggle */}
        <Animated.View entering={FadeInDown.delay(650).duration(350)} style={styles.pricingSection}>
          <View style={[styles.pricingToggleTrack, {
            backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
            borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
          }]}>
            {/* Monthly */}
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedTier('monthly');
              }}
              style={[styles.pricePill, selectedTier === 'monthly' && [
                styles.pricePillSelected,
                { backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : '#FFFFFF' },
              ]]}
              accessibilityRole="radio"
              accessibilityState={{ checked: selectedTier === 'monthly' }}
            >
              <Text style={[styles.pricePillLabel, {
                color: selectedTier === 'monthly'
                  ? (isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)')
                  : (isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)'),
              }]}>
                Monthly
              </Text>
              <Text style={[styles.pricePillPrice, {
                color: selectedTier === 'monthly'
                  ? (isDark ? '#FFFFFF' : '#1A1A1A')
                  : (isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)'),
              }]}>
                {monthlyPlan?.price ?? '$4.99/mo'}
              </Text>
            </Pressable>

            {/* Annual */}
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedTier('annual');
              }}
              style={[styles.pricePill, styles.pricePillAnnual, selectedTier === 'annual' && [
                styles.pricePillSelected,
                { backgroundColor: '#D4A843' },
              ]]}
              accessibilityRole="radio"
              accessibilityState={{ checked: selectedTier === 'annual' }}
            >
              <Text style={[styles.annualSaveBadge, {
                color: selectedTier === 'annual' ? '#1A1A1A' : (isDark ? '#D4A843' : '#8A7A60'),
              }]}>
                Annual {'\u00B7'} Save 33%
              </Text>
              <Text style={[styles.pricePillPrice, {
                color: selectedTier === 'annual'
                  ? '#1A1A1A'
                  : (isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)'),
                fontWeight: '700',
              }]}>
                {annualPlan?.price ?? '$39.99/yr'}
              </Text>
            </Pressable>
          </View>
        </Animated.View>

        {/* CTA Button */}
        <Animated.View entering={FadeInDown.delay(700).duration(350)}>
          <Text style={[styles.ctaPretext, {
            color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
          }]}>
            No charge today. Cancel anytime in Settings.
          </Text>
          <Pressable
            onPress={handlePurchase}
            disabled={isPurchasing || isLoading}
            accessibilityRole="button"
            accessibilityLabel="Start My Free Week"
            style={({ pressed }) => [styles.ctaButton, {
              backgroundColor: isDark ? '#FFFFFF' : '#1A1A1A',
              opacity: pressed ? 0.85 : 1,
            }]}
          >
            {isPurchasing ? (
              <ActivityIndicator color={isDark ? '#000000' : '#FFFFFF'} />
            ) : (
              <Text style={[styles.ctaText, {
                color: isDark ? '#0A0A0A' : '#FFFFFF',
              }]}>
                Start My Free Week
              </Text>
            )}
          </Pressable>
        </Animated.View>

        {/* Fine print */}
        <Animated.View entering={FadeIn.delay(750)} style={styles.finePrint}>
          {/* Redeem promo */}
          <Pressable
            onPress={() => setIsPromoVisible(true)}
            style={styles.redeemRow}
          >
            <Text style={[styles.finePrintText, { color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)' }]}>
              {'\u{1F381}'} Have a promo code? <Text style={{ textDecorationLine: 'underline' }}>Redeem</Text>
            </Text>
          </Pressable>

          <Text style={[styles.finePrintText, { color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)' }]}>
            {`Try ${selectedPlan?.trialDays || 7} days free, then ${postTrialCopy}. Cancel anytime.`}
          </Text>

          {/* Restore + Terms + Privacy */}
          <View style={styles.linksRow}>
            <Pressable onPress={handleRestore} hitSlop={12}>
              <Text style={[styles.linkText, { color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.4)' }]}>
                Restore Purchases
              </Text>
            </Pressable>
            <Text style={[styles.linkDot, { color: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)' }]}> {'\u00B7'} </Text>
            <Pressable onPress={openTerms} hitSlop={12}>
              <Text style={[styles.linkText, { color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.4)' }]}>
                Terms
              </Text>
            </Pressable>
            <Text style={[styles.linkDot, { color: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)' }]}> {'\u00B7'} </Text>
            <Pressable onPress={openPrivacy} hitSlop={12}>
              <Text style={[styles.linkText, { color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.4)' }]}>
                Privacy
              </Text>
            </Pressable>
          </View>
        </Animated.View>

        {/* Guarantee */}
        <Animated.View entering={FadeIn.delay(800)} style={styles.guaranteeRow}>
          <Text style={{ fontSize: 14 }}>{'\u{1F6E1}\uFE0F'}</Text>
          <Text style={[styles.guaranteeText, {
            color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)',
          }]}>
            7-day money-back guarantee
          </Text>
        </Animated.View>
      </ScrollView>

      {/* Error display */}
      {error && (
        <Animated.View
          entering={FadeIn}
          style={[styles.errorBanner, { backgroundColor: colors.errorMuted }]}
        >
          <Text style={[Typography.caption1, { color: colors.error }]}>{error}</Text>
        </Animated.View>
      )}

      <PromptModal
        visible={isPromoVisible}
        title="Redeem promo code"
        description="Enter your code and we’ll open a support email with it filled in for you."
        value={promoCodeDraft}
        placeholder="Enter promo code"
        submitLabel="Continue"
        autoCapitalize="characters"
        onChangeText={setPromoCodeDraft}
        onSubmit={() => {
          void handlePromoSubmit();
        }}
        onCancel={() => {
          setIsPromoVisible(false);
          setPromoCodeDraft('');
        }}
        submitDisabled={!promoCodeDraft.trim()}
      />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 24 },

  // ── Close button ──
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  closeIcon: {
    fontSize: 16,
    fontWeight: '400',
  },

  // ── Pro Badge ──
  proBadgeContainer: {
    marginBottom: 20,
  },
  proBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  proBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },

  // ── Hero ──
  heroHeading: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -1,
    lineHeight: 43,
    marginBottom: 10,
  },
  heroSubtitle: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 22,
    marginBottom: 12,
  },

  // ── Editor's Choice badge ──
  editorBadgeContainer: {
    marginBottom: 24,
  },
  editorBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  editorBadgeText: {
    fontSize: 12,
    fontWeight: '400',
  },

  // ── Features ──
  featuresList: {
    gap: 16,
    marginBottom: 28,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  featureCheck: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureCheckIcon: {
    fontSize: 14,
    fontWeight: '600',
  },
  featureText: {
    fontSize: 15,
    fontWeight: '400',
    flex: 1,
  },

  // ── Social Proof ──
  socialProofSection: {
    marginBottom: 28,
    gap: 10,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  star: {
    fontSize: 16,
    color: '#FFD700',
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 6,
  },
  quoteText: {
    fontSize: 13,
    fontWeight: '400',
    fontStyle: 'italic',
    lineHeight: 19,
  },
  quoteAuthor: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },

  // ── Pricing ──
  pricingSection: {
    marginBottom: 20,
  },
  pricingToggleTrack: {
    flexDirection: 'row',
    borderRadius: 20,
    borderWidth: 1,
    padding: 4,
    gap: 4,
  },
  pricePill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 16,
    gap: 3,
  },
  pricePillSelected: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  pricePillAnnual: {},
  pricePillLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  pricePillPrice: {
    fontSize: 19,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  annualSaveBadge: {
    fontSize: 11,
    fontWeight: '600',
  },

  // ── CTA ──
  ctaPretext: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 10,
  },
  ctaButton: {
    width: '100%',
    height: 58,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  ctaText: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
  },

  // ── Fine print ──
  finePrint: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  redeemRow: {
    marginBottom: 2,
  },
  finePrintText: {
    fontSize: 12,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 17,
  },
  linksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkText: {
    fontSize: 12,
    fontWeight: '400',
  },
  linkDot: {
    fontSize: 12,
  },

  // ── Guarantee ──
  guaranteeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 20,
  },
  guaranteeText: {
    fontSize: 12,
    fontWeight: '500',
  },

  // ── Error ──
  errorBanner: {
    position: 'absolute',
    top: 100,
    left: 24,
    right: 24,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
});
