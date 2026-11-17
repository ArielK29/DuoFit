// What each subscription tier gives (see docs/superpowers/plans/2026-11-12-subscriptions.md).
// Pure on purpose, so it is unit-tested. The real enforcement is on the server (database triggers and policies);
// the app uses these numbers to show the right screen and text. KEEP IN SYNC with private.invite_limit() in
// supabase/migrations/20261115_subscriptions_foundation.sql.

export type Tier = 'free' | 'plus' | 'pro';

// App Store Connect product ids (one subscription group "FitFriend", four products so a member can switch tier).
export const PRODUCT_IDS = {
  plusMonthly: 'com.arielk29.fitfriend.plus.monthly',
  plusYearly: 'com.arielk29.fitfriend.plus.yearly',
  proMonthly: 'com.arielk29.fitfriend.pro.monthly',
  proYearly: 'com.arielk29.fitfriend.pro.yearly',
} as const;

export interface TierLimits {
  // New invitations a member can send in a rolling 7 days.
  invitesPerWeek: number;
}

export const TIER_LIMITS: Record<Tier, TierLimits> = {
  free: { invitesPerWeek: 5 },
  plus: { invitesPerWeek: 40 },
  pro: { invitesPerWeek: 70 },
};

// Unknown, empty or missing ids are `free`: a paid tier is never granted by guess.
export function tierFromProductId(productId: string | null | undefined): Tier {
  switch (productId) {
    case PRODUCT_IDS.plusMonthly:
    case PRODUCT_IDS.plusYearly:
      return 'plus';
    case PRODUCT_IDS.proMonthly:
    case PRODUCT_IDS.proYearly:
      return 'pro';
    default:
      return 'free';
  }
}

export type BillingPeriod = 'monthly' | 'yearly' | 'other';

// The four RevenueCat packages are custom packages (two monthly and two yearly cannot share the standard ids), so their
// package type is CUSTOM. The billing period therefore comes from the store product id; the package type is the fallback.
export function billingPeriodOf(productId: string, packageType: string): BillingPeriod {
  if (productId.endsWith('.monthly')) return 'monthly';
  if (productId.endsWith('.yearly')) return 'yearly';
  if (packageType === 'MONTHLY') return 'monthly';
  if (packageType === 'ANNUAL') return 'yearly';
  return 'other';
}

export function isPaidTier(tier: Tier): boolean {
  return tier !== 'free';
}

export function inviteLimitFor(tier: Tier): number {
  return TIER_LIMITS[tier].invitesPerWeek;
}

// Invitations still available this week; never below zero. A negative or fractional count is read as a whole number >= 0.
export function invitesLeft(tier: Tier, usedThisWeek: number): number {
  const used = Math.max(0, Math.floor(usedThisWeek));
  return Math.max(0, inviteLimitFor(tier) - used);
}
