import test from 'node:test';
import assert from 'node:assert/strict';
import { inviteLimitMessage, isInviteLimitError, planFeatures, renewalText, subscriptionFromRow, tierLabel } from './subscription.ts';

const NOW = new Date('2026-11-15T12:00:00Z');

test('subscriptionFromRow: no row means free', () => {
  assert.deepEqual(subscriptionFromRow(null, NOW), { tier: 'free', status: 'none', expiresAt: null, willRenew: false });
});

test('subscriptionFromRow: a valid Plus row', () => {
  const sub = subscriptionFromRow({ tier: 'plus', status: 'active', expires_at: '2026-12-15T12:00:00Z' }, NOW);
  assert.equal(sub.tier, 'plus');
  assert.equal(sub.status, 'active');
  assert.equal(sub.willRenew, true);
  assert.equal(sub.expiresAt, '2026-12-15T12:00:00Z');
});

test('subscriptionFromRow: an expired row is free (the server says the same)', () => {
  const sub = subscriptionFromRow({ tier: 'pro', status: 'active', expires_at: '2026-11-14T12:00:00Z' }, NOW);
  assert.equal(sub.tier, 'free');
  assert.equal(sub.status, 'none');
});

test('subscriptionFromRow: cancelled keeps the tier until the end but will not renew', () => {
  const sub = subscriptionFromRow({ tier: 'pro', status: 'cancelled', expires_at: '2026-11-20T12:00:00Z' }, NOW);
  assert.equal(sub.tier, 'pro');
  assert.equal(sub.willRenew, false);
});

test('subscriptionFromRow: unknown tier, unknown status or a bad date never grant a paid tier', () => {
  assert.equal(subscriptionFromRow({ tier: 'gold', status: 'active', expires_at: '2026-12-15T12:00:00Z' }, NOW).tier, 'free');
  assert.equal(subscriptionFromRow({ tier: 'plus', status: 'weird', expires_at: '2026-12-15T12:00:00Z' }, NOW).tier, 'free');
  assert.equal(subscriptionFromRow({ tier: 'plus', status: 'active', expires_at: 'not a date' }, NOW).tier, 'free');
});

test('isInviteLimitError: recognises the server error in the shapes the app can see', () => {
  assert.equal(isInviteLimitError({ message: 'invite limit reached', code: 'P0001', hint: '5' }), true);
  assert.equal(isInviteLimitError(new Error('invite limit reached')), true);
  assert.equal(isInviteLimitError({ message: 'too many messages, slow down' }), false);
  assert.equal(isInviteLimitError(null), false);
  assert.equal(isInviteLimitError('invite limit reached'), false);
});

test('inviteLimitMessage: Hebrew, with the weekly number, and a way up for free and Plus', () => {
  assert.match(inviteLimitMessage('free'), /5/);
  assert.match(inviteLimitMessage('free'), /Plus/);
  assert.match(inviteLimitMessage('plus'), /40/);
  assert.match(inviteLimitMessage('plus'), /Pro/);
  assert.match(inviteLimitMessage('pro'), /70/);
  assert.doesNotMatch(inviteLimitMessage('pro'), /שדרג/);
});

test('tierLabel: Hebrew names for the screen', () => {
  assert.equal(tierLabel('free'), 'חינם');
  assert.equal(tierLabel('plus'), 'Plus');
  assert.equal(tierLabel('pro'), 'Pro');
});

test('planFeatures: lists only what is built and enforced today (no promises about future features)', () => {
  assert.deepEqual(planFeatures('free'), ['עד 5 הזמנות חדשות לאימון בשבוע']);
  assert.deepEqual(planFeatures('plus'), ['עד 40 הזמנות חדשות לאימון בשבוע']);
  assert.deepEqual(planFeatures('pro'), ['עד 70 הזמנות חדשות לאימון בשבוע']);
});

test('renewalText: says when the plan ends or renews, in Hebrew', () => {
  const when = new Date('2026-12-15T12:00:00Z');
  assert.match(renewalText({ tier: 'plus', status: 'active', expiresAt: when.toISOString(), willRenew: true }), /מתחדשת/);
  assert.match(renewalText({ tier: 'plus', status: 'cancelled', expiresAt: when.toISOString(), willRenew: false }), /מסתיימת/);
  assert.match(renewalText({ tier: 'plus', status: 'trial', expiresAt: when.toISOString(), willRenew: true }), /ניסיון/);
  assert.equal(renewalText({ tier: 'free', status: 'none', expiresAt: null, willRenew: false }), '');
});
