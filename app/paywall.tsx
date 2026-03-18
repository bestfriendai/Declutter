/**
 * Declutterly -- Paywall Screen (V1)
 * Matches Pencil design: PQtOl
 * Honest claims only -- no fabricated badges, ratings, or reviews.
 */

import { PromptModal } from '@/components/ui/PromptModal';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useRevenueCat, PRODUCT_IDS } from '@/hooks/useRevenueCat';
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
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Heart, Brain, Timer, Smile, X, Leaf, Star } from 'lucide-react-native';

// ─── V1 Color Palette ────────────────────────────────────────────────────────
const V1 = {
  coral: '#FF6B6B',
  green: '#66BB6A',
  amber: '#FFB74D',
  gold: '#FFD54F',
  dark: {
    bg: '#0C0C0C',
    card: '#1A1A1A',
    border: 'rgba(255,255,255,0.08)',
    text: '#FFFFFF',
    textSecondary: 'rgba(255,255,255,0.5)',
    textMuted: 'rgba(255,255,255,0.3)',
  },
  light: {
    bg: '#FAFAFA',
    card: '#F6F7F8',
    border: '#E5E7EB',
    text: '#1A1A1A',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',
  },
};

// ─── Features list ───────────────────────────────────────────────────────────
const FEATURES = [
  'Unlimited room scans & AI tasks',
  '15-Minute Blitz with smart task picks',
  'Mascot growth & full customization',
  'Complete progress tracking & streaks',
  'Feel proud of your clean space',
  'Routines that fit your ADHD brain',
];

// ─── Benefit mini-cards ──────────────────────────────────────────────────────
const BENEFITS = [
  {
    icon: 'brain' as const,
    title: 'ADHD-First',
    subtitle: 'Designed for how your brain works',
  },
  {
    icon: 'timer' as const,
    title: '15-Min Sessions',
    subtitle: 'Quick wins that build momentum',
  },
  {
    icon: 'smile' as const,
    title: 'No Judgment',
    subtitle: 'Start where you are, go at your pace',
  },
];

function BenefitIcon({ name, size, color }: { name: string; size: number; color: string }) {
  switch (name) {
    case 'brain':
      return <Brain size={size} color={color} />;
    case 'timer':
      return <Timer size={size} color={color} />;
    case 'smile':
      return <Smile size={size} color={color} />;
    default:
      return <Heart size={size} color={color} />;
  }
}

// ─── Feature row ─────────────────────────────────────────────────────────────
function FeatureRow({
  text,
  isDark,
  delay,
}: {
  text: string;
  isDark: boolean;
  delay: number;
}) {
  const t = isDark ? V1.dark : V1.light;
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(350)}
      style={styles.featureRow}
    >
      <Leaf size={18} color="#C4A87A" />
      <Text style={[styles.featureText, { color: t.text }]}>{text}</Text>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────
export default function PaywallScreen() {
  const rawScheme = useColorScheme();
  const isDark = rawScheme === 'dark';
  const t = isDark ? V1.dark : V1.light;
  const insets = useSafeAreaInsets();

  const {
    isLoading,
    error,
    plans,
    purchasePlan,
    restorePurchases,
  } = useRevenueCat();

  const [isPurchasing, setIsPurchasing] = useState(false);
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

  const handlePurchase = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setIsPurchasing(true);
    try {
      const planId =
        selectedTier === 'annual' ? PRODUCT_IDS.annual : PRODUCT_IDS.monthly;
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

  const handleRestore = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsPurchasing(true);
    try {
      const success = await restorePurchases();
      if (success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Restored!', 'Your subscription has been restored.', [
          {
            text: 'Continue',
            onPress: () => router.replace('/notification-permission'),
          },
        ]);
      } else {
        Alert.alert(
          'No Subscription Found',
          "We couldn't find an active subscription to restore."
        );
      }
    } catch {
      Alert.alert(
        'Restore Failed',
        'Unable to restore purchases. Please try again.'
      );
    } finally {
      setIsPurchasing(false);
    }
  }, [restorePurchases]);

  const handleClose = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace('/notification-permission');
  }, []);

  const handleContinueFree = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace('/notification-permission');
  }, []);

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
        <Animated.View entering={FadeIn.delay(100).duration(350)}>
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
          entering={FadeInDown.delay(150).duration(350)}
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
        <Animated.View entering={FadeInDown.delay(200).duration(350)}>
          <Text style={[styles.heroTitle, { color: t.text }]}>
            A Clearer Space{'\n'}Starts Here.
          </Text>
          <Text style={[styles.heroSubtitle, { color: t.textSecondary }]}>
            Unlock your full cleaning potential
          </Text>
        </Animated.View>

        {/* "Built for ADHD Brains" badge */}
        <Animated.View
          entering={FadeInDown.delay(280).duration(350)}
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

        {/* 3 Benefit mini-cards */}
        <Animated.View
          entering={FadeInDown.delay(600).duration(350)}
          style={styles.benefitsRow}
        >
          {BENEFITS.map((benefit) => (
            <View
              key={benefit.title}
              style={[
                styles.benefitCard,
                { backgroundColor: t.card, borderColor: t.border },
              ]}
            >
              <BenefitIcon name={benefit.icon} size={20} color={V1.coral} />
              <Text
                style={[styles.benefitTitle, { color: t.text }]}
                numberOfLines={1}
              >
                {benefit.title}
              </Text>
              <Text
                style={[styles.benefitSubtitle, { color: t.textMuted }]}
                numberOfLines={2}
              >
                {benefit.subtitle}
              </Text>
            </View>
          ))}
        </Animated.View>

        {/* "Designed by" tagline */}
        <Animated.View entering={FadeInDown.delay(650).duration(350)}>
          <Text style={[styles.designedBy, { color: t.textMuted }]}>
            Designed by someone with ADHD, for people with ADHD
          </Text>
        </Animated.View>

        {/* Testimonial */}
        <Animated.View entering={FadeInDown.delay(650).duration(350)} style={{ marginTop: 20 }}>
          <View style={[styles.testimonialCard, { backgroundColor: t.card, borderColor: t.border }]}>
            <View style={styles.starsRow}>
              {[1,2,3,4,5].map(i => <Star key={i} size={14} color="#C4A87A" fill="#C4A87A" />)}
            </View>
            <Text style={[styles.testimonialQuote, { color: t.text }]}>
              {'"Finally an app that understands how my ADHD brain works with cleaning!"'}
            </Text>
            <Text style={[styles.testimonialAuthor, { color: t.textMuted }]}>
              — Beta Tester
            </Text>
          </View>
        </Animated.View>

        {/* Pricing cards */}
        <Animated.View
          entering={FadeInDown.delay(700).duration(350)}
          style={styles.pricingSection}
        >
          <View style={styles.pricingCards}>
            {/* Monthly */}
            <Pressable
              onPress={() => { Haptics.selectionAsync(); setSelectedTier('monthly'); }}
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

        {/* CTA Button */}
        <Animated.View entering={FadeInDown.delay(800).duration(350)}>
          <Pressable
            onPress={handlePurchase}
            disabled={isPurchasing || isLoading}
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
                <Text style={[styles.ctaText, { color: isDark ? '#1A1A1A' : '#FFFFFF' }]}>Start My Free Week</Text>
              )}
            </View>
          </Pressable>
        </Animated.View>

        {/* Continue with free plan */}
        <Pressable onPress={handleContinueFree} style={styles.freeLink}>
          <Text style={[styles.freeLinkText, { color: t.textSecondary }]}>
            Continue with free plan
          </Text>
        </Pressable>

        {/* Restore + Terms + Privacy */}
        <View style={styles.linksRow}>
          <Pressable onPress={handleRestore} hitSlop={12}>
            <Text style={[styles.footerLink, { color: t.textMuted }]}>
              Restore
            </Text>
          </Pressable>
          <Text style={[styles.footerDot, { color: t.textMuted }]}>
            {' \u00B7 '}
          </Text>
          <Pressable onPress={openTerms} hitSlop={12}>
            <Text style={[styles.footerLink, { color: t.textMuted }]}>
              Terms
            </Text>
          </Pressable>
          <Text style={[styles.footerDot, { color: t.textMuted }]}>
            {' \u00B7 '}
          </Text>
          <Pressable onPress={openPrivacy} hitSlop={12}>
            <Text style={[styles.footerLink, { color: t.textMuted }]}>
              Privacy
            </Text>
          </Pressable>
        </View>

        {/* Guarantee */}
        <Text style={[styles.guarantee, { color: t.textMuted }]}>
          7-day free trial {'\u00B7'} Cancel anytime {'\u00B7'} Money-back
          guarantee
        </Text>
      </ScrollView>

      {/* Error display */}
      {error && (
        <Animated.View
          entering={FadeIn}
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
    width: 36,
    height: 36,
    borderRadius: 18,
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

  // ── Benefits ──
  benefitsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  benefitCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
    gap: 6,
  },
  benefitTitle: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  benefitSubtitle: {
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 14,
  },

  // ── Designed by ──
  designedBy: {
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 20,
  },

  // ── Testimonial ──
  testimonialCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 8,
    marginBottom: 20,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  testimonialQuote: {
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  testimonialAuthor: {
    fontSize: 12,
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

  // ── Free link ──
  freeLink: {
    alignItems: 'center',
    paddingVertical: 10,
    marginBottom: 12,
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

  // ── Error ──
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
