import test from 'node:test';
import assert from 'node:assert/strict';
import { mapEvent } from './mapEvent.ts';
import { PRODUCT_IDS } from '../../../duofit/lib/entitlements.ts';

const USER = '11111111-2222-4333-8444-555555555555';
const NOW = Date.UTC(2026, 10, 15, 12, 0, 0);
const DAY = 24 * 60 * 60 * 1000;

function ev(extra: Record<string, unknown>) {
  return {
    type: 'INITIAL_PURCHASE',
    app_user_id: USER,
    product_id: PRODUCT_IDS.plusMonthly,
    period_type: 'NORMAL',
    expiration_at_ms: NOW + 30 * DAY,
    event_timestamp_ms: NOW - 1000,
    ...extra,
  };
}

test('initial purchase: a valid paid row with the tier of the product', () => {
  const row = mapEvent(ev({}), NOW);
  assert.deepEqual(row, {
    userId: USER,
    tier: 'plus',
    productId: PRODUCT_IDS.plusMonthly,
    status: 'active',
    expiresAtMs: NOW + 30 * DAY,
    eventMs: NOW - 1000,
  });
});

test('free trial period is stored as trial', () => {
  const row = mapEvent(ev({ period_type: 'TRIAL', product_id: PRODUCT_IDS.proYearly }), NOW);
  assert.equal(row?.status, 'trial');
  assert.equal(row?.tier, 'pro');
});

test('renewal, uncancellation, extension and refund reversal keep or restore access', () => {
  for (const type of ['RENEWAL', 'UNCANCELLATION', 'SUBSCRIPTION_EXTENDED', 'REFUND_REVERSED']) {
    const row = mapEvent(ev({ type }), NOW);
    assert.equal(row?.status, 'active', type);
    assert.equal(row?.expiresAtMs, NOW + 30 * DAY, type);
  }
});

test('cancellation: stays valid until the period ends (will not renew)', () => {
  const row = mapEvent(ev({ type: 'CANCELLATION', cancel_reason: 'UNSUBSCRIBE' }), NOW);
  assert.equal(row?.status, 'cancelled');
  assert.equal(row?.expiresAtMs, NOW + 30 * DAY);
});

test('cancellation caused by a refund removes access immediately', () => {
  const row = mapEvent(ev({ type: 'CANCELLATION', cancel_reason: 'CUSTOMER_SUPPORT' }), NOW);
  assert.equal(row?.status, 'cancelled');
  assert.equal(row?.expiresAtMs, NOW);
});

test('expiration: access ends now at the latest, never in the future', () => {
  const past = mapEvent(ev({ type: 'EXPIRATION', expiration_at_ms: NOW - DAY }), NOW);
  assert.equal(past?.expiresAtMs, NOW - DAY);
  const early = mapEvent(ev({ type: 'EXPIRATION', expiration_at_ms: NOW + DAY }), NOW);
  assert.equal(early?.expiresAtMs, NOW);
  assert.equal(early?.status, 'cancelled');
});

test('billing issue: grace period until the grace expiry, otherwise the normal expiry', () => {
  const withGrace = mapEvent(ev({ type: 'BILLING_ISSUE', grace_period_expiration_at_ms: NOW + 3 * DAY, expiration_at_ms: NOW - DAY }), NOW);
  assert.equal(withGrace?.status, 'grace');
  assert.equal(withGrace?.expiresAtMs, NOW + 3 * DAY);
  const noGrace = mapEvent(ev({ type: 'BILLING_ISSUE', expiration_at_ms: NOW + DAY }), NOW);
  assert.equal(noGrace?.expiresAtMs, NOW + DAY);
});

test('product change uses the new product (switching Plus to Pro)', () => {
  const row = mapEvent(ev({ type: 'PRODUCT_CHANGE', product_id: PRODUCT_IDS.plusMonthly, new_product_id: PRODUCT_IDS.proMonthly }), NOW);
  assert.equal(row?.tier, 'pro');
  assert.equal(row?.productId, PRODUCT_IDS.proMonthly);
});

test('ignored: unknown product, anonymous id, test event, transfer, missing expiry, junk', () => {
  assert.equal(mapEvent(ev({ product_id: 'com.other.app.pro' }), NOW), null);
  assert.equal(mapEvent(ev({ app_user_id: '$RCAnonymousID:abc123' }), NOW), null);
  assert.equal(mapEvent(ev({ type: 'TEST' }), NOW), null);
  assert.equal(mapEvent(ev({ type: 'TRANSFER' }), NOW), null);
  assert.equal(mapEvent(ev({ type: 'NON_RENEWING_PURCHASE' }), NOW), null);
  assert.equal(mapEvent(ev({ expiration_at_ms: undefined }), NOW), null);
  assert.equal(mapEvent(ev({ expiration_at_ms: 'soon' }), NOW), null);
  assert.equal(mapEvent(ev({ event_timestamp_ms: undefined }), NOW), null);
  assert.equal(mapEvent(null, NOW), null);
  assert.equal(mapEvent('hello', NOW), null);
  assert.equal(mapEvent({}, NOW), null);
});

test('the user id must be a real uuid (never trust a free-form string)', () => {
  assert.equal(mapEvent(ev({ app_user_id: "1' or '1'='1" }), NOW), null);
  assert.equal(mapEvent(ev({ app_user_id: '' }), NOW), null);
});
