import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PRODUCT_IDS,
  TIER_LIMITS,
  inviteLimitFor,
  invitesLeft,
  isPaidTier,
  tierFromProductId,
} from './entitlements.ts';

test('TIER_LIMITS: new invitations per week are 5 / 40 / 70 (the owner-approved packages)', () => {
  assert.equal(TIER_LIMITS.free.invitesPerWeek, 5);
  assert.equal(TIER_LIMITS.plus.invitesPerWeek, 40);
  assert.equal(TIER_LIMITS.pro.invitesPerWeek, 70);
});

test('inviteLimitFor: reads the limit of the tier', () => {
  assert.equal(inviteLimitFor('free'), 5);
  assert.equal(inviteLimitFor('plus'), 40);
  assert.equal(inviteLimitFor('pro'), 70);
});

test('invitesLeft: counts down and never goes below zero', () => {
  assert.equal(invitesLeft('free', 0), 5);
  assert.equal(invitesLeft('free', 4), 1);
  assert.equal(invitesLeft('free', 5), 0);
  assert.equal(invitesLeft('free', 9), 0);
  assert.equal(invitesLeft('plus', 10), 30);
});

test('invitesLeft: a negative or fractional count is treated as a whole number of at least zero', () => {
  assert.equal(invitesLeft('free', -3), 5);
  assert.equal(invitesLeft('free', 1.9), 4);
});

test('tierFromProductId: the four store products map to their tier', () => {
  assert.equal(tierFromProductId(PRODUCT_IDS.plusMonthly), 'plus');
  assert.equal(tierFromProductId(PRODUCT_IDS.plusYearly), 'plus');
  assert.equal(tierFromProductId(PRODUCT_IDS.proMonthly), 'pro');
  assert.equal(tierFromProductId(PRODUCT_IDS.proYearly), 'pro');
});

test('tierFromProductId: unknown, empty or missing ids are free (never grant a paid tier by guess)', () => {
  assert.equal(tierFromProductId('com.someone.else.pro'), 'free');
  assert.equal(tierFromProductId(''), 'free');
  assert.equal(tierFromProductId(null), 'free');
  assert.equal(tierFromProductId(undefined), 'free');
});

test('isPaidTier: only plus and pro are paid', () => {
  assert.equal(isPaidTier('free'), false);
  assert.equal(isPaidTier('plus'), true);
  assert.equal(isPaidTier('pro'), true);
});

test('PRODUCT_IDS: all four ids are different and live under the app bundle id', () => {
  const ids = Object.values(PRODUCT_IDS);
  assert.equal(new Set(ids).size, 4);
  for (const id of ids) assert.match(id, /^com\.arielk29\.fitfriend\./);
});
