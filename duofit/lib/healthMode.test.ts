import test from 'node:test';
import assert from 'node:assert/strict';
import { healthMode, isSameDay } from './healthMode.ts';

const base = { hydrated: true, connected: false, available: null as boolean | null, failed: false, hasFreshSnapshot: false };

test('healthMode: before the saved settings are loaded nothing is shown yet (no example numbers flash)', () => {
  assert.equal(healthMode({ ...base, hydrated: false }), 'loading');
  assert.equal(healthMode({ ...base, hydrated: false, connected: true, hasFreshSnapshot: false }), 'loading');
});

test('healthMode: a connected member with today\'s last numbers sees them at once', () => {
  assert.equal(healthMode({ ...base, connected: true, available: null, hasFreshSnapshot: true }), 'live');
  assert.equal(healthMode({ ...base, connected: true, available: true, failed: true, hasFreshSnapshot: true }), 'live');
});

test('healthMode: a connected member waiting for the first read of the day sees a loading state, never the examples', () => {
  assert.equal(healthMode({ ...base, connected: true, available: true }), 'loading');
  assert.equal(healthMode({ ...base, connected: true, available: null }), 'loading');
});

test('healthMode: a connected member whose read failed is invited to connect again', () => {
  assert.equal(healthMode({ ...base, connected: true, available: true, failed: true }), 'connect');
});

test('healthMode: not connected: loading until the phone says whether it has Apple Health, then connect or examples', () => {
  assert.equal(healthMode({ ...base, available: null }), 'loading');
  assert.equal(healthMode({ ...base, available: true }), 'connect');
  assert.equal(healthMode({ ...base, available: false }), 'example');
});

test('isSameDay: compares the calendar day on the phone', () => {
  assert.equal(isSameDay('2026-11-02T08:00:00.000Z', new Date('2026-11-02T10:00:00.000Z')), true);
  assert.equal(isSameDay('2026-11-01T08:00:00.000Z', new Date('2026-11-02T10:00:00.000Z')), false);
  assert.equal(isSameDay('not a date', new Date('2026-11-02T10:00:00.000Z')), false);
});
