// What the app knows about the member's subscription, and the Hebrew texts around it. Pure on purpose (unit-tested).
// The server is the source of truth (public.subscriptions, written by the RevenueCat webhook); the app only reads and shows it.
import { inviteLimitFor, type Tier } from './entitlements.ts';

export type SubscriptionStatus = 'none' | 'trial' | 'active' | 'grace' | 'cancelled';

export interface Subscription {
  tier: Tier;
  status: SubscriptionStatus;
  // ISO time the paid period ends (null when free).
  expiresAt: string | null;
  // False once the member cancelled: the plan stays until expiresAt but will not renew.
  willRenew: boolean;
}

export const FREE_SUBSCRIPTION: Subscription = { tier: 'free', status: 'none', expiresAt: null, willRenew: false };

interface SubscriptionRow {
  tier: string;
  status: string;
  expires_at: string;
}

// An expired, malformed or unknown row means free: a paid tier is never granted by guess (the server applies the same rule).
export function subscriptionFromRow(row: SubscriptionRow | null, now: Date = new Date()): Subscription {
  if (!row) return FREE_SUBSCRIPTION;
  const tier: Tier | null = row.tier === 'plus' || row.tier === 'pro' ? row.tier : null;
  const status: SubscriptionStatus | null =
    row.status === 'trial' || row.status === 'active' || row.status === 'grace' || row.status === 'cancelled' ? row.status : null;
  const expires = new Date(row.expires_at);
  if (!tier || !status || Number.isNaN(expires.getTime()) || expires.getTime() <= now.getTime()) return FREE_SUBSCRIPTION;
  return { tier, status, expiresAt: row.expires_at, willRenew: status !== 'cancelled' };
}

// The database refuses a new invitation over the weekly limit with the text "invite limit reached" (see
// supabase/migrations/20261115_subscriptions_foundation.sql). Old and new builds read the same message.
export function isInviteLimitError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const message = (error as { message?: unknown }).message;
  return typeof message === 'string' && message.includes('invite limit reached');
}

export function tierLabel(tier: Tier): string {
  if (tier === 'plus') return 'Plus';
  if (tier === 'pro') return 'Pro';
  return 'חינם';
}

export function inviteLimitMessage(tier: Tier): string {
  const limit = inviteLimitFor(tier);
  if (tier === 'free') return `הגעת ל-${limit} הזמנות חדשות בשבוע. עם FitFriend Plus אפשר לשלוח עד ${inviteLimitFor('plus')} בשבוע. ההזמנות מתחדשות מעצמן.`;
  if (tier === 'plus') return `הגעת ל-${limit} הזמנות חדשות בשבוע. עם FitFriend Pro אפשר לשלוח עד ${inviteLimitFor('pro')} בשבוע. ההזמנות מתחדשות מעצמן.`;
  return `הגעת ל-${limit} הזמנות חדשות בשבוע, המקסימום. ההזמנות מתחדשות מעצמן, אפשר לנסות שוב בהמשך.`;
}

// What a plan gives, as shown on the paywall. Only features that are built AND enforced by the server today: add a line here
// in the same change that adds the feature, never before (a promise the app does not keep is misleading).
export function planFeatures(tier: Tier): string[] {
  return [`עד ${inviteLimitFor(tier)} הזמנות חדשות לאימון בשבוע`];
}

// "Your plan renews on ..." or "ends on ...", for the account and paywall screens.
export function renewalText(sub: Subscription): string {
  if (sub.tier === 'free' || !sub.expiresAt) return '';
  const date = new Date(sub.expiresAt).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' });
  if (sub.status === 'trial') return `תקופת ניסיון חינם עד ${date}, ואז החבילה מתחדשת בתשלום`;
  if (!sub.willRenew) return `החבילה מסתיימת ב-${date} ולא תתחדש`;
  return `החבילה מתחדשת ב-${date}`;
}
