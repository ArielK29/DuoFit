// The only file that talks to RevenueCat (the layer that validates Apple receipts, renewals and refunds).
// The member id given to RevenueCat is the Supabase user id, so the webhook can write the right row.
// Needs a real build (EAS), not Expo Go; on the web and when the key is missing everything reports "unavailable"
// instead of failing. The key is the PUBLIC iOS SDK key (EXPO_PUBLIC_REVENUECAT_IOS_KEY), never a secret key.
import { Platform } from 'react-native';
import type { PurchasesPackage } from 'react-native-purchases';
import { billingPeriodOf, type BillingPeriod } from './entitlements';

export type PurchasesApi = typeof import('react-native-purchases').default;

const IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? '';

let configuredFor: string | null = null;

// Loaded on demand so the web build and the tests never pull in the native module.
function load(): PurchasesApi | null {
  if (Platform.OS !== 'ios') return null; // Google Play Billing comes with the Play release
  if (!IOS_KEY) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return (require('react-native-purchases') as { default: PurchasesApi }).default;
  } catch {
    return null;
  }
}

export function purchasesAvailable(): boolean {
  return load() !== null;
}

// Safe to call many times; logs in as `userId` (and switches account when a different member signs in).
export async function startPurchases(userId: string): Promise<boolean> {
  const api = load();
  if (!api) return false;
  try {
    if (configuredFor === null) {
      api.configure({ apiKey: IOS_KEY, appUserID: userId });
    } else if (configuredFor !== userId) {
      await api.logIn(userId);
    }
    configuredFor = userId;
    return true;
  } catch {
    return false;
  }
}

export async function stopPurchases(): Promise<void> {
  const api = load();
  if (!api || configuredFor === null) return;
  configuredFor = null;
  try {
    await api.logOut();
  } catch {
    // Already anonymous: nothing to do.
  }
}

export interface PlanOption {
  // RevenueCat package, passed back to buy().
  pkg: PurchasesPackage;
  productId: string;
  // Price text exactly as the store formats it for this member's country, e.g. "‏9.90 ‏₪" (never typed by hand).
  priceString: string;
  period: BillingPeriod;
  // Free trial text from the store, when the product has an introductory offer.
  trialDays: number | null;
}

function trialDaysOf(pkg: PurchasesPackage): number | null {
  const intro = pkg.product.introPrice;
  if (!intro || intro.price !== 0) return null;
  const unit = intro.periodUnit;
  const n = intro.periodNumberOfUnits * intro.cycles;
  if (unit === 'DAY') return n;
  if (unit === 'WEEK') return n * 7;
  if (unit === 'MONTH') return n * 30;
  return null;
}

// The current offering's packages, or null when the store has nothing to show yet (agreement not active, offline, no products).
export async function loadPlans(): Promise<PlanOption[] | null> {
  const api = load();
  if (!api || configuredFor === null) return null;
  try {
    const offerings = await api.getOfferings();
    const packages = offerings.current?.availablePackages ?? [];
    if (packages.length === 0) return null;
    return packages.map((pkg) => ({
      pkg,
      productId: pkg.product.identifier,
      priceString: pkg.product.priceString,
      period: billingPeriodOf(pkg.product.identifier, pkg.packageType),
      trialDays: trialDaysOf(pkg),
    }));
  } catch {
    return null;
  }
}

export type BuyResult = 'purchased' | 'cancelled' | 'failed';

export async function buy(pkg: PurchasesPackage): Promise<BuyResult> {
  const api = load();
  if (!api) return 'failed';
  try {
    await api.purchasePackage(pkg);
    return 'purchased';
  } catch (error) {
    return (error as { userCancelled?: boolean | null })?.userCancelled ? 'cancelled' : 'failed';
  }
}

export async function restore(): Promise<boolean> {
  const api = load();
  if (!api) return false;
  try {
    await api.restorePurchases();
    return true;
  } catch {
    return false;
  }
}

// Opens Apple's own "manage subscription" screen (cancel or change plan).
export async function manageSubscription(): Promise<void> {
  const api = load();
  if (!api) return;
  try {
    await api.showManageSubscriptions();
  } catch {
    // Nothing useful to show: the member can also cancel in the iPhone Settings.
  }
}
