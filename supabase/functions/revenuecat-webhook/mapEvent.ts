// Pure mapping from a RevenueCat webhook event to a subscription row (or null = ignore the event).
// No network, no database, so it is unit-tested (mapEvent.test.ts). Deno and Node both read it.
// The four product ids and tiers must match duofit/lib/entitlements.ts (the test imports that file and checks it).

export interface SubscriptionRow {
  userId: string;
  tier: 'plus' | 'pro';
  productId: string;
  status: 'trial' | 'active' | 'grace' | 'cancelled';
  expiresAtMs: number;
  eventMs: number;
}

const PRODUCT_TIERS: Record<string, 'plus' | 'pro'> = {
  'com.arielk29.fitfriend.plus.monthly': 'plus',
  'com.arielk29.fitfriend.plus.yearly': 'plus',
  'com.arielk29.fitfriend.pro.monthly': 'pro',
  'com.arielk29.fitfriend.pro.yearly': 'pro',
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Events that keep or restore access for the period in the event.
const GRANT_TYPES = new Set(['INITIAL_PURCHASE', 'RENEWAL', 'UNCANCELLATION', 'SUBSCRIPTION_EXTENDED', 'REFUND_REVERSED', 'PRODUCT_CHANGE']);

function num(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export function mapEvent(raw: unknown, nowMs: number): SubscriptionRow | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const e = raw as Record<string, unknown>;
  const type = typeof e.type === 'string' ? e.type : '';
  const userId = typeof e.app_user_id === 'string' ? e.app_user_id : '';
  if (!UUID.test(userId)) return null; // anonymous ids and anything that is not a Supabase user id

  // After a product change the new product is the one that counts.
  const productId = type === 'PRODUCT_CHANGE' && typeof e.new_product_id === 'string' ? e.new_product_id : e.product_id;
  const tier = typeof productId === 'string' ? PRODUCT_TIERS[productId] : undefined;
  if (!tier || typeof productId !== 'string') return null; // never grant a paid tier for an unknown product

  const eventMs = num(e.event_timestamp_ms);
  if (eventMs === null) return null;
  const expiry = num(e.expiration_at_ms);
  const base = { userId, tier, productId, eventMs };

  if (GRANT_TYPES.has(type)) {
    if (expiry === null) return null;
    return { ...base, status: e.period_type === 'TRIAL' ? 'trial' : 'active', expiresAtMs: expiry };
  }
  if (type === 'CANCELLATION') {
    if (expiry === null) return null;
    // A refund ends access now. A normal cancel only stops renewal: the member keeps what they paid for.
    const refunded = e.cancel_reason === 'CUSTOMER_SUPPORT';
    return { ...base, status: 'cancelled', expiresAtMs: refunded ? nowMs : expiry };
  }
  if (type === 'EXPIRATION') {
    if (expiry === null) return null;
    return { ...base, status: 'cancelled', expiresAtMs: Math.min(expiry, nowMs) };
  }
  if (type === 'BILLING_ISSUE') {
    const grace = num(e.grace_period_expiration_at_ms);
    const until = grace ?? expiry;
    if (until === null) return null;
    return { ...base, status: 'grace', expiresAtMs: until };
  }
  return null; // TEST, TRANSFER, NON_RENEWING_PURCHASE, pauses, experiments and anything new
}
