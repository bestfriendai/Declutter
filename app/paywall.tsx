/**
 * Declutterly -- Paywall Screen (V1)
 * Matches Pencil design: PQtOl
 * Honest claims only -- no fabricated badges, ratings, or reviews.
 */

import { PromptModal } from '@/components/ui/PromptModal';
import { DEV_SKIP_AUTH } from '@/constants/app';
import { V1 } from '@/constants/designTokens';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { PRODUCT_IDS, useRevenueCat } from '@/hooks/useRevenueCat';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Heart, Leaf, Star, X } from 'lucide-react-native';
import { ScreenErrorBoundary } from '@/components/ErrorBoundary';
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
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── Features list (expanded for more value) ────────────────────────────────
const FEATURES = [
  { text: 'Unlimited AI room scans', color: V1.coral },
  { text: 'ADHD-optimized task breakdowns', color: V1.indigo },
  { text: '15-minute Blitz with smart picks', color: V1.blue },
  { text: 'Mascot companion & adventures', color: V1.amber },
  { text: 'Weekly cleaning leagues', color: V1.gold },
  { text: 'Variable rewards & rare collectibles', color: V1.green },
  { text: 'Accountability partners', color: V1.coral },
  { text: 'Full progress analytics & insights', color: V1.blue },
];

// ─── Feature row ─────────────────────────────────────────────────────────────
function FeatureRow({
  text,
  color,
  isDark,
  delay,
}: {
  text: string;
  color: string;
  isDark: boolean;
  delay: number;
}) {
  const t = isDark ? V1.dark : V1.light;
  const reducedMotion = useReducedMotion();
  return (
    <Animated.View
      entering={reducedMotion ? undefined : FadeInDown.delay(delay).duration(350)}
      style={styles.featureRow}
    >
      <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: color + '20', alignItems: 'center', justifyContent: 'center' }}>
        <Leaf size={14} color={color} />
      </View>
      <Text style={[styles.featureText, { color: t.text }]}>{text}</Text>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────
export default function PaywallScreen() {
  return (
    <ScreenErrorBoundary screenName="paywall">
      <PaywallScreenContent />
    </ScreenErrorBoundary>
  );
}

function PaywallScreenContent() {
  const { preselectedRoomType } = useLocalSearchParams<{ preselectedRoomType?: string }>();
  const rawScheme = useColorScheme();
  const isDark = rawScheme === 'dark';
  const t = isDark ? V1.dark : V1.light;
  const insets = useSafeAreaInsets();

  const reducedMotion = useReducedMotion();

  const {
    isLoading,
    error,
    plans,
    purchasePlan,
    restorePurchases,
  } = useRevenueCat();

  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [selectedTier, setSelectedTier] = useState<'monthly' | 'annual'>(
    'annual'
  );
  const [promoCodeDraft, setPromoCodeDraft] = useState('');
  const [isPromoVisible, setIsPromoVisible] = useState(false);

  const monthlyPlan = useMemo(
    () => plans.find((p) => p.id === PRODUCT_IDS.monthly),
    [plans]
  );
  const annualPlan = useMemo(
    () => plans.find((p) => p.id === PRODUCT_IDS.annual),
    [plans]
  );

  // Derive trial days from the currently selected plan
  const selectedPlanObj = selectedTier === 'annual' ? annualPlan : monthlyPlan;
  const trialDays = selectedPlanObj?.trialDays ?? 0;

  const navigateIntoApp = useCallback(() => {
    router.replace({
      pathname: '/where-are-you',
      params: preselectedRoomType ? { preselectedRoomType } : undefined,
    });
  }, [preselectedRoomType]);

  const handlePurchase = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setPurchaseError(null);
    setIsPurchasing(true);
    try {
      const planId =
        selectedTier === 'annual' ? PRODUCT_IDS.annual : PRODUCT_IDS.monthly;
      const success = await purchasePlan(planId);
      if (success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        navigateIntoApp();
        return;
      }
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setPurchaseError('Purchase failed. Please try again.');
    }
    setIsPurchasing(false);
  }, [navigateIntoApp, purchasePlan, selectedTier]);

  const handleRestore = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPurchaseError(null);
    setIsPurchasing(true);
    try {
      const success = await restorePurchases();
      if (success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        navigateIntoApp();
        return;
      }
      setPurchaseError("No active subscription found to restore.");
    } catch {
      setPurchaseError('Unable to restore purchases. Please try again.');
    }
    setIsPurchasing(false);
  }, [navigateIntoApp, restorePurchases]);

  const handleClose = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigateIntoApp();
  }, [navigateIntoApp]);

  const handleContinueFree = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigateIntoApp();
  }, [navigateIntoApp]);

  const openTerms = () => Linking.openURL('https://declutterly.app/terms');
  const openPrivacy = () => Linking.openURL('https://declutterly.app/privacy');

  const handlePromoSubmit = useCallback(async () => {
    const trimmedCode = promoCodeDraft.trim();
    if (!trimmedCode) return;
    setIsPromoVisible(false);
    setPromoCodeDraft('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const subject = encodeURIComponent(
        'Declutterly promo code redemption'
      );
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
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + 16,
            paddingBottom: insets.bottom + 24,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Close button */}
        <Animated.View entering={reducedMotion ? undefined : FadeIn.delay(100).duration(350)}>
          <Pressable
            onPress={handleClose}
            style={[
              styles.closeButton,
              { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <X size={18} color={t.textSecondary} />
          </Pressable>
        </Animated.View>

        {/* DECLUTTER PRO badge */}
        <Animated.View
          entering={reducedMotion ? undefined : FadeInDown.delay(150).duration(350)}
          style={styles.proBadgeWrap}
        >
          <LinearGradient
            colors={['#C4A87A', '#8A7A60']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.proBadge}
          >
            <Text style={styles.proBadgeText}>DECLUTTER PRO</Text>
          </LinearGradient>
        </Animated.View>

        {/* Hero heading */}
        <Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(200).duration(350)}>
          <Text style={[styles.heroTitle, { color: t.text }]}>
            A Clearer Space{'\n'}Starts Here.
          </Text>
          <Text style={[styles.heroSubtitle, { color: t.textSecondary }]}>
            Unlock your full cleaning potential
          </Text>
        </Animated.View>

        {/* "Built for ADHD Brains" badge */}
        <Animated.View
          entering={reducedMotion ? undefined : FadeInDown.delay(280).duration(350)}
          style={styles.adhdBadgeWrap}
        >
          <View
            style={[
              styles.adhdBadge,
              {
                backgroundColor: isDark
                  ? 'rgba(255,255,255,0.06)'
                  : 'rgba(0,0,0,0.04)',
                borderColor: isDark
                  ? 'rgba(255,255,255,0.07)'
                  : 'rgba(0,0,0,0.06)',
              },
            ]}
          >
            <Heart size={14} color={V1.coral} fill={V1.coral} />
            <Text
              style={[
                styles.adhdBadgeText,
                { color: t.textSecondary },
              ]}
            >
              Built for ADHD Brains
            </Text>
          </View>
        </Animated.View>

        {/* Social proof */}
        <Animated.View
          entering={reducedMotion ? undefined : FadeInDown.delay(290).duration(350)}
          style={{ alignItems: 'center', marginBottom: 8 }}
        >
          <Text style={[{ fontSize: 13, fontWeight: '500', color: t.textSecondary, textAlign: 'center' }]}>
            Join 2,400+ people decluttering with ADHD
          </Text>
        </Animated.View>

        {/* Feature list */}
        <View style={styles.featuresList}>
          {FEATURES.map((feature, idx) => (
            <FeatureRow
              key={feature.text}
              text={feature.text}
              color={feature.color}
              isDark={isDark}
              delay={300 + idx * 40}
            />
          ))}
        </View>

        {/* Pricing cards */}
        <Animated.View
          entering={reducedMotion ? undefined : FadeInDown.delay(700).duration(350)}
          style={styles.pricingSection}
        >
          <View style={styles.pricingCards}>
            {/* Monthly */}
            <Pressable
              onPress={() => { Haptics.selectionAsync(); setSelectedTier('monthly'); }}
              accessibilityRole="button"
              accessibilityLabel="Select monthly plan"
              accessibilityState={{ selected: selectedTier === 'monthly' }}
              style={[styles.priceCard, { borderColor: selectedTier === 'monthly' ? '#C4A87A' : t.border, backgroundColor: t.card }]}
            >
              <Text style={[styles.priceCardLabel, { color: t.textSecondary }]}>Monthly</Text>
              <Text style={[styles.priceCardAmount, { color: t.text }]}>
                {monthlyPlan?.price ?? '$4.99'}<Text style={[styles.priceCardPeriod, { color: t.textMuted }]}>/mo</Text>
              </Text>
            </Pressable>
            {/* Annual */}
            <Pressable
              onPress={() => { Haptics.selectionAsync(); setSelectedTier('annual'); }}
              accessibilityRole="button"
              accessibilityLabel="Select annual plan"
              accessibilityState={{ selected: selectedTier === 'annual' }}
              style={[styles.priceCard, styles.priceCardHighlight, { borderColor: selectedTier === 'annual' ? '#C4A87A' : t.border, backgroundColor: selectedTier === 'annual' ? (isDark ? 'rgba(196,168,122,0.12)' : 'rgba(196,168,122,0.08)') : t.card }]}
            >
              <View style={styles.saveBadge}><Text style={styles.saveBadgeText}>Save 33%</Text></View>
              <Text style={[styles.priceCardLabel, { color: t.textSecondary }]}>Annual</Text>
              <Text style={[styles.priceCardAmount, { color: t.text }]}>
                {annualPlan?.price ?? '$39.99'}<Text style={[styles.priceCardPeriod, { color: t.textMuted }]}>/yr</Text>
              </Text>
            </Pressable>
          </View>
        </Animated.View>

        {/* Trial banner */}
        {trialDays > 0 && (
          <Animated.View
            entering={reducedMotion ? undefined : FadeInDown.delay(750).duration(350)}
            style={{
              alignItems: 'center',
              gap: 4,
              paddingVertical: 12,
              paddingHorizontal: 20,
              borderRadius: 16,
              backgroundColor: isDark ? 'rgba(102,187,106,0.1)' : 'rgba(102,187,106,0.08)',
              borderWidth: 1,
              borderColor: isDark ? 'rgba(102,187,106,0.2)' : 'rgba(102,187,106,0.15)',
              marginBottom: 8,
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: '700', color: V1.green, textAlign: 'center' }}>
              {trialDays}-Day Free Trial
            </Text>
            <Text style={{ fontSize: 13, fontWeight: '500', color: t.textSecondary, textAlign: 'center' }}>
              No charge until the trial ends. Cancel anytime.
            </Text>
          </Animated.View>
        )}

        {/* CTA Button */}
        <Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(800).duration(350)}>
          <Pressable
            onPress={handlePurchase}
            disabled={isPurchasing || isLoading}
            accessibilityRole="button"
            accessibilityLabel={`${trialDays > 0 ? `Start ${trialDays}-day free trial` : 'Subscribe'}, ${selectedTier === 'annual' ? 'annual plan' : 'monthly plan'}`}
            style={({ pressed }) => [
              styles.ctaButton,
              { opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <View
              style={[styles.ctaGradient, { backgroundColor: isDark ? '#FFFFFF' : '#1A1A1A' }]}
            >
              {isPurchasing ? (
                <ActivityIndicator color={isDark ? '#1A1A1A' : '#FFFFFF'} />
              ) : (
                <Text style={[styles.ctaText, { color: isDark ? '#1A1A1A' : '#FFFFFF' }]}>
                  {trialDays > 0 ? 'Start My Free 7 Days' : 'Subscribe Now'}
                </Text>
              )}
            </View>
          </Pressable>
        </Animated.View>

        {/* Cancel anytime reassurance */}
        <Text style={[{ fontSize: 13, fontWeight: '500', color: t.textMuted, textAlign: 'center', marginBottom: 8 }]}>
          Cancel anytime. No questions asked.
        </Text>

        {/* Purchase / restore error banner */}
        {purchaseError ? (
          <Animated.View
            entering={reducedMotion ? undefined : FadeIn.duration(300)}
            style={[styles.purchaseErrorBanner, { backgroundColor: 'rgba(255,59,48,0.12)' }]}
          >
            <Text style={styles.purchaseErrorText}>{purchaseError}</Text>
          </Animated.View>
        ) : null}

        {/* Weekly + daily price breakdown */}
        {selectedTier === 'annual' && (
          <View style={{ alignItems: 'center', gap: 2, marginBottom: 4 }}>
            <Text style={[{ fontSize: 14, fontWeight: '700', color: V1.green, textAlign: 'center' }]}>
              Just $0.77/week
            </Text>
            <Text style={[{ fontSize: 12, fontWeight: '500', color: t.textMuted, textAlign: 'center' }]}>
              That's $0.11/day for a clearer space
            </Text>
          </View>
        )}

        {/* Auto-renewal disclosure */}
        <Text style={[styles.autoRenewalText, { color: t.textMuted }]}>
          {trialDays > 0
            ? `Free for ${trialDays} days, then ${selectedTier === 'annual' ? `${annualPlan?.price ?? '$39.99'}/year` : `${monthlyPlan?.price ?? '$4.99'}/month`}. Cancel anytime.`
            : `${selectedTier === 'annual' ? `${annualPlan?.price ?? '$39.99'}/year` : `${monthlyPlan?.price ?? '$4.99'}/month`}. Cancel anytime.`}
        </Text>

        {/* Continue with free plan */}
        <Pressable onPress={handleContinueFree} style={styles.freeLink} accessibilityRole="button" accessibilityLabel="Continue with free plan">
          <Text style={[styles.freeLinkText, { color: t.textSecondary }]}>
            Continue with free plan
          </Text>
        </Pressable>

        {/* Restore + Terms + Privacy */}
        <View style={styles.linksRow}>
          <Pressable onPress={handleRestore} hitSlop={12} accessibilityRole="button" accessibilityLabel="Restore purchases">
            <Text style={[styles.footerLink, { color: t.textMuted }]}>
              Restore
            </Text>
          </Pressable>
          <Text style={[styles.footerDot, { color: t.textMuted }]}>
            {' \u00B7 '}
          </Text>
          <Pressable onPress={openTerms} hitSlop={12} accessibilityRole="button" accessibilityLabel="Open terms">
            <Text style={[styles.footerLink, { color: t.textMuted }]}>
              Terms
            </Text>
          </Pressable>
          <Text style={[styles.footerDot, { color: t.textMuted }]}>
            {' \u00B7 '}
          </Text>
          <Pressable onPress={openPrivacy} hitSlop={12} accessibilityRole="button" accessibilityLabel="Open privacy policy">
            <Text style={[styles.footerLink, { color: t.textMuted }]}>
              Privacy
            </Text>
          </Pressable>
        </View>

        {/* Guarantee */}
        <Text style={[styles.guarantee, { color: t.textMuted }]}>
          {trialDays > 0 ? `${trialDays}-day free trial \u00B7 ` : ''}Cancel anytime {'\u00B7'} Money-back
          guarantee
        </Text>

        {/* Dev bypass button */}
        {DEV_SKIP_AUTH && (
          <Pressable
            onPress={() => router.replace({
              pathname: '/where-are-you',
              params: preselectedRoomType ? { preselectedRoomType } : undefined,
            })}
            style={{
              alignItems: 'center',
              paddingVertical: 12,
              marginTop: 8,
              backgroundColor: 'rgba(255,59,48,0.08)',
              borderRadius: 12,
            }}
            accessibilityRole="button"
            accessibilityLabel="Skip paywall for testing"
          >
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#FF453A' }}>
              Skip for Testing (DEV)
            </Text>
          </Pressable>
        )}
      </ScrollView>

      {/* RevenueCat load error */}
      {error && (
        <Animated.View
          entering={reducedMotion ? undefined : FadeIn}
          style={[
            styles.errorBanner,
            {
              backgroundColor: 'rgba(255,59,48,0.12)',
              top: insets.top + 60,
            },
          ]}
        >
          <Text style={styles.errorText}>{error}</Text>
        </Animated.View>
      )}

      <PromptModal
        visible={isPromoVisible}
        title="Redeem promo code"
        description="Enter your code and we'll open a support email with it filled in for you."
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
  scrollContent: { flexGrow: 1, paddingHorizontal: 24 },

  // ── Close ──
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
    marginBottom: 16,
  },

  // ── Pro Badge ──
  proBadgeWrap: { marginBottom: 20 },
  proBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  proBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },

  // ── Hero ──
  heroTitle: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.8,
    lineHeight: 36,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },

  // ── ADHD badge ──
  adhdBadgeWrap: { marginBottom: 24 },
  adhdBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  adhdBadgeText: {
    fontSize: 13,
    fontWeight: '500',
  },

  // ── Features ──
  featuresList: {
    gap: 16,
    marginBottom: 24,
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
  featureText: {
    fontSize: 15,
    flex: 1,
  },

  // ── Pricing cards ──
  pricingSection: {
    marginBottom: 16,
  },
  pricingCards: {
    flexDirection: 'row',
    gap: 12,
  },
  priceCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    alignItems: 'center',
    gap: 4,
  },
  priceCardHighlight: {
    position: 'relative',
  },
  priceCardLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  priceCardAmount: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  priceCardPeriod: {
    fontSize: 14,
    fontWeight: '400',
  },
  saveBadge: {
    backgroundColor: '#C4A87A',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    marginBottom: 4,
  },
  saveBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },

  // ── CTA ──
  ctaButton: {
    borderRadius: 28,
    overflow: 'hidden',
    marginBottom: 12,
  },
  ctaGradient: {
    height: 58,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
  },

  // ── Auto-renewal ──
  autoRenewalText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 8,
  },

  // ── Free link ──
  freeLink: {
    alignItems: 'center',
    paddingVertical: 10,
    marginBottom: 12,
    minHeight: 44,
    justifyContent: 'center',
  },
  freeLinkText: {
    fontSize: 14,
    fontWeight: '500',
  },

  // ── Footer links ──
  linksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  footerLink: {
    fontSize: 12,
  },
  footerDot: {
    fontSize: 12,
  },

  // ── Guarantee ──
  guarantee: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 8,
  },

  // ── Purchase error (inline, below CTA) ──
  purchaseErrorBanner: {
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  purchaseErrorText: {
    fontSize: 13,
    color: '#FF453A',
    textAlign: 'center',
  },

  // ── RevenueCat load error (floating) ──
  errorBanner: {
    position: 'absolute',
    left: 24,
    right: 24,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 13,
    color: '#FF453A',
  },
});
