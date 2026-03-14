/**
 * Declutterly — RevenueCat Hook
 * Subscription management for iOS/Android in-app purchases
 * 
 * Product IDs:
 * - declutter_weekly: $6.99/week
 * - declutter_monthly: $6.99/month (3-day free trial)
 * - declutter_annual: $39.99/year (3-day free trial)
 */

import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';

// Safely import react-native-purchases to avoid crash when native module is unavailable
let Purchases: any = null;
let LOG_LEVEL: any = {};
let _purchasesAvailable = false;
try {
  const rnPurchases = require('react-native-purchases');
  Purchases = rnPurchases.default || rnPurchases;
  LOG_LEVEL = rnPurchases.LOG_LEVEL || {};
  _purchasesAvailable = true;
} catch {
  // Native module not available (Expo Go or unconfigured dev build)
  _purchasesAvailable = false;
}

type CustomerInfo = any;
type PurchasesOfferings = any;
type PurchasesPackage = any;

// RevenueCat API Keys (configured in EAS secrets)
const REVENUECAT_IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || '';
const REVENUECAT_ANDROID_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY || '';

// Product identifiers
export const PRODUCT_IDS = {
  weekly: 'declutter_weekly',
  monthly: 'declutter_monthly',
  annual: 'declutter_annual',
} as const;

export type SubscriptionTier = keyof typeof PRODUCT_IDS | null;
export type SubscriptionStatus = 'free' | 'trial' | 'active' | 'expired';

export interface SubscriptionState {
  isSubscribed: boolean;
  isPro: boolean;
  isTrialing: boolean;
  status: SubscriptionStatus;
  tier: SubscriptionTier;
  expirationDate: Date | null;
  trialEndsAt: Date | null;
  managementUrl: string | null;
}

export interface PlanOption {
  id: string;
  tier: SubscriptionTier;
  title: string;
  subtitle: string;
  price: string;
  pricePerMonth: string;
  hasTrial: boolean;
  trialDays: number;
  badge?: 'POPULAR' | 'BEST VALUE';
  package?: PurchasesPackage;
}

interface UseRevenueCatReturn {
  // State
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  subscription: SubscriptionState;
  offerings: PurchasesOfferings | null;
  plans: PlanOption[];
  selectedPlan: string | null;
  
  // Actions
  setSelectedPlan: (planId: string) => void;
  purchaseSelectedPlan: () => Promise<boolean>;
  purchasePlan: (planId: string) => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
  refreshSubscription: () => Promise<void>;
}

// Default subscription state
const defaultSubscription: SubscriptionState = {
  isSubscribed: false,
  isPro: false,
  isTrialing: false,
  status: 'free',
  tier: null,
  expirationDate: null,
  trialEndsAt: null,
  managementUrl: null,
};

// Default plan options (used as fallback)
const defaultPlans: PlanOption[] = [
  {
    id: PRODUCT_IDS.weekly,
    tier: 'weekly',
    title: 'Casual',
    subtitle: "I'll clean when I feel like it",
    price: '$6.99/week',
    pricePerMonth: '$27.96/month',
    hasTrial: false,
    trialDays: 0,
  },
  {
    id: PRODUCT_IDS.monthly,
    tier: 'monthly',
    title: 'Committed',
    subtitle: 'I want a cleaner space & clearer mind',
    price: '$6.99/month',
    pricePerMonth: '$6.99/month',
    hasTrial: true,
    trialDays: 3,
    badge: 'POPULAR',
  },
  {
    id: PRODUCT_IDS.annual,
    tier: 'annual',
    title: 'All-In',
    subtitle: "I'm transforming my life starting today",
    price: '$39.99/year',
    pricePerMonth: '$3.33/month',
    hasTrial: true,
    trialDays: 3,
    badge: 'BEST VALUE',
  },
];

/**
 * RevenueCat subscription management hook
 */
export function useRevenueCat(): UseRevenueCatReturn {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionState>(defaultSubscription);
  const [offerings, setOfferings] = useState<PurchasesOfferings | null>(null);
  const [plans, setPlans] = useState<PlanOption[]>(defaultPlans);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(PRODUCT_IDS.monthly);

  // Initialize RevenueCat
  useEffect(() => {
    let isSubscribed = true;

    // Guard: if Purchases native module is not available, bail out early
    if (!_purchasesAvailable || !Purchases) {
      setIsLoading(false);
      setError('Subscriptions are not available in this build.');
      return;
    }

    const init = async () => {
      try {
        const apiKey = Platform.OS === 'ios' ? REVENUECAT_IOS_KEY : REVENUECAT_ANDROID_KEY;

        if (!apiKey) {
          console.warn('RevenueCat API key not configured');
          setIsLoading(false);
          return;
        }

        // Configure RevenueCat
        if (__DEV__) {
          Purchases.setLogLevel(LOG_LEVEL.DEBUG);
        }

        await Purchases.configure({ apiKey });

        if (isSubscribed) {
          setIsInitialized(true);

          // Fetch initial data
          await Promise.all([
            fetchOfferings(),
            fetchSubscription(),
          ]);
        }
      } catch (err) {
        console.error('Failed to initialize RevenueCat:', err);
        if (isSubscribed) {
          setError('Failed to initialize subscription service');
        }
      } finally {
        if (isSubscribed) {
          setIsLoading(false);
        }
      }
    };

    init();

    // Listen for subscription changes
    if (Purchases?.addCustomerInfoUpdateListener) {
      Purchases.addCustomerInfoUpdateListener((info: CustomerInfo) => {
        if (isSubscribed) {
          updateSubscriptionState(info);
        }
      });
    }

    return () => {
      isSubscribed = false;
    };
  }, []);

  // Fetch available offerings
  const fetchOfferings = useCallback(async () => {
    if (!_purchasesAvailable || !Purchases) return;
    try {
      const fetchedOfferings = await Purchases.getOfferings();
      setOfferings(fetchedOfferings);

      // Build plans from offerings
      if (fetchedOfferings.current?.availablePackages) {
        const fetchedPlans = buildPlansFromPackages(fetchedOfferings.current.availablePackages);
        if (fetchedPlans.length > 0) {
          setPlans(fetchedPlans);
        }
      }
    } catch (err) {
      console.error('Failed to fetch offerings:', err);
    }
  }, []);

  // Fetch current subscription status
  const fetchSubscription = useCallback(async () => {
    if (!_purchasesAvailable || !Purchases) return;
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      updateSubscriptionState(customerInfo);
    } catch (err) {
      console.error('Failed to fetch subscription:', err);
    }
  }, []);

  // Update subscription state from customer info
  const updateSubscriptionState = useCallback((info: CustomerInfo) => {
    const entitlements = info.entitlements.active;
    const proEntitlement = entitlements['pro'] || entitlements['premium'];

    if (proEntitlement) {
      const isTrialing = proEntitlement.periodType === 'TRIAL';
      const expirationDate = proEntitlement.expirationDate
        ? new Date(proEntitlement.expirationDate)
        : null;

      // Determine tier from product identifier
      let tier: SubscriptionTier = null;
      const productId = proEntitlement.productIdentifier;
      if (productId?.includes('weekly')) tier = 'weekly';
      else if (productId?.includes('monthly')) tier = 'monthly';
      else if (productId?.includes('annual')) tier = 'annual';

      setSubscription({
        isSubscribed: true,
        isPro: true,
        isTrialing,
        status: isTrialing ? 'trial' : 'active',
        tier,
        expirationDate,
        trialEndsAt: isTrialing ? expirationDate : null,
        managementUrl: info.managementURL ?? null,
      });
    } else {
      // Check for expired subscription
      const allEntitlements = info.entitlements.all;
      const expiredPro = allEntitlements['pro'] || allEntitlements['premium'];
      
      setSubscription({
        ...defaultSubscription,
        status: expiredPro ? 'expired' : 'free',
      });
    }
  }, []);

  // Build plan options from RevenueCat packages
  const buildPlansFromPackages = (packages: PurchasesPackage[]): PlanOption[] => {
    return packages.map((pkg) => {
      const product = pkg.product;
      const identifier = product.identifier;
      
      let tier: SubscriptionTier = null;
      let title = '';
      let subtitle = '';
      let badge: 'POPULAR' | 'BEST VALUE' | undefined;

      if (identifier.includes('weekly')) {
        tier = 'weekly';
        title = 'Casual';
        subtitle = "I'll clean when I feel like it";
      } else if (identifier.includes('monthly')) {
        tier = 'monthly';
        title = 'Committed';
        subtitle = 'I want a cleaner space & clearer mind';
        badge = 'POPULAR';
      } else if (identifier.includes('annual')) {
        tier = 'annual';
        title = 'All-In';
        subtitle = "I'm transforming my life starting today";
        badge = 'BEST VALUE';
      }

      // Calculate price per month
      let pricePerMonth = product.priceString;
      if (tier === 'weekly') {
        pricePerMonth = `$${(product.price * 4).toFixed(2)}/month`;
      } else if (tier === 'annual') {
        pricePerMonth = `$${(product.price / 12).toFixed(2)}/month`;
      }

      // Check for intro offer (free trial)
      const introOffer = product.introPrice;
      const hasTrial = introOffer?.price === 0;
      const trialDays = hasTrial ? Math.round((introOffer?.periodNumberOfUnits ?? 0) * 
        (introOffer?.periodUnit === 'DAY' ? 1 : 
         introOffer?.periodUnit === 'WEEK' ? 7 : 
         introOffer?.periodUnit === 'MONTH' ? 30 : 365)) : 0;

      return {
        id: identifier,
        tier,
        title,
        subtitle,
        price: `${product.priceString}/${tier === 'weekly' ? 'week' : tier === 'monthly' ? 'month' : 'year'}`,
        pricePerMonth,
        hasTrial,
        trialDays,
        badge,
        package: pkg,
      };
    }).sort((a, b) => {
      // Sort: weekly, monthly, annual
      const order = { weekly: 0, monthly: 1, annual: 2 };
      return (order[a.tier ?? 'monthly'] ?? 1) - (order[b.tier ?? 'monthly'] ?? 1);
    });
  };

  // Purchase selected plan
  const purchaseSelectedPlan = useCallback(async (): Promise<boolean> => {
    if (!selectedPlan) {
      setError('Please select a plan');
      return false;
    }
    return purchasePlan(selectedPlan);
  }, [selectedPlan]);

  // Purchase a specific plan
  const purchasePlan = useCallback(async (planId: string): Promise<boolean> => {
    if (!_purchasesAvailable || !Purchases) {
      setError('Subscriptions are not available in this build.');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Find the package
      const plan = plans.find(p => p.id === planId);

      if (plan?.package) {
        // Use the package from offerings
        const { customerInfo } = await Purchases.purchasePackage(plan.package);
        updateSubscriptionState(customerInfo);
        return customerInfo.entitlements.active['pro'] !== undefined ||
               customerInfo.entitlements.active['premium'] !== undefined;
      } else {
        // Fallback to product ID
        const { customerInfo } = await Purchases.purchaseProduct(planId);
        updateSubscriptionState(customerInfo);
        return customerInfo.entitlements.active['pro'] !== undefined ||
               customerInfo.entitlements.active['premium'] !== undefined;
      }
    } catch (err: any) {
      // Handle user cancellation
      if (err.userCancelled) {
        return false;
      }

      console.error('Purchase failed:', err);
      setError(err.message || 'Purchase failed. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [plans, updateSubscriptionState]);

  // Restore purchases
  const restorePurchases = useCallback(async (): Promise<boolean> => {
    if (!_purchasesAvailable || !Purchases) {
      setError('Subscriptions are not available in this build.');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const customerInfo = await Purchases.restorePurchases();
      updateSubscriptionState(customerInfo);

      const hasActiveSubscription =
        customerInfo.entitlements.active['pro'] !== undefined ||
        customerInfo.entitlements.active['premium'] !== undefined;

      if (!hasActiveSubscription) {
        setError('No active subscription found to restore');
      }

      return hasActiveSubscription;
    } catch (err: any) {
      console.error('Restore failed:', err);
      setError(err.message || 'Failed to restore purchases');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [updateSubscriptionState]);

  // Refresh subscription
  const refreshSubscription = useCallback(async () => {
    await fetchSubscription();
  }, [fetchSubscription]);

  return {
    isInitialized,
    isLoading,
    error,
    subscription,
    offerings,
    plans,
    selectedPlan,
    setSelectedPlan,
    purchaseSelectedPlan,
    purchasePlan,
    restorePurchases,
    refreshSubscription,
  };
}

/**
 * Check if user has active subscription (for use outside React components)
 */
export async function checkSubscriptionStatus(): Promise<SubscriptionState> {
  if (!_purchasesAvailable || !Purchases) return defaultSubscription;
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    const entitlements = customerInfo.entitlements.active;
    const proEntitlement = entitlements['pro'] || entitlements['premium'];

    if (proEntitlement) {
      const isTrialing = proEntitlement.periodType === 'TRIAL';
      const expirationDate = proEntitlement.expirationDate
        ? new Date(proEntitlement.expirationDate)
        : null;

      let tier: SubscriptionTier = null;
      const productId = proEntitlement.productIdentifier;
      if (productId?.includes('weekly')) tier = 'weekly';
      else if (productId?.includes('monthly')) tier = 'monthly';
      else if (productId?.includes('annual')) tier = 'annual';

      return {
        isSubscribed: true,
        isPro: true,
        isTrialing,
        status: isTrialing ? 'trial' : 'active',
        tier,
        expirationDate,
        trialEndsAt: isTrialing ? expirationDate : null,
        managementUrl: customerInfo.managementURL ?? null,
      };
    }

    return defaultSubscription;
  } catch {
    return defaultSubscription;
  }
}
