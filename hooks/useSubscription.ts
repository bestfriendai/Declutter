/**
 * Declutterly -- Subscription gate hook
 * Thin wrapper around useRevenueCat that exposes isPro and room limits.
 *
 * Free users: 3 room scans
 * Pro users: unlimited
 */

import { useRevenueCat } from '@/hooks/useRevenueCat';
import { DEV_SKIP_AUTH } from '@/constants/app';

export const FREE_ROOM_LIMIT = 3;

export interface SubscriptionGate {
  /** True when the user has an active Pro subscription or trial */
  isPro: boolean;
  /** Max rooms a user can create (Infinity for Pro) */
  roomLimit: number;
  /** Whether the subscription system has finished loading */
  isLoading: boolean;
}

export function useSubscription(): SubscriptionGate {
  const { subscription, isLoading } = useRevenueCat();

  // Dev bypass: treat as Pro when testing
  if (DEV_SKIP_AUTH) {
    return { isPro: true, roomLimit: Infinity, isLoading: false };
  }

  return {
    isPro: subscription.isPro,
    roomLimit: subscription.isPro ? Infinity : FREE_ROOM_LIMIT,
    isLoading,
  };
}
