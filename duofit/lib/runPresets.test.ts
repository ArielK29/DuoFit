import test from 'node:test';
import assert from 'node:assert/strict';
import { DISTANCE_CHIPS_KM, TIME_CHIPS_MIN, stepKm, stepMinutes, suggestMinutes } from './runPresets.ts';
import type { HealthRun } from './healthData.ts';

const run = (km: number, minutes: number): HealthRun => ({ id: String(km), startedAt: '2026-10-28T07:00:00.000Z', km, durationSec: minutes * 60 });

test('chips: common distances up to a marathon and common times up to two hours', () => {
  assert.deepEqual(DISTANCE_CHIPS_KM.slice(0, 4), [1, 1.5, 2, 3]);
  assert.ok(DISTANCE_CHIPS_KM.includes(21.1) && DISTANCE_CHIPS_KM.includes(42.2));
  assert.deepEqual(TIME_CHIPS_MIN.slice(0, 3), [10, 15, 20]);
  assert.ok(TIME_CHIPS_MIN.includes(120));
});

test('stepKm: moves in the given step, rounded to one decimal, between 0.5 and 100 km', () => {
  assert.equal(stepKm(5, 0.5), 5.5);
  assert.equal(stepKm(5.5, 1), 6.5);
  assert.equal(stepKm(0.5, -0.5), 0.5);
  assert.equal(stepKm(99.8, 1), 100);
  assert.equal(stepKm(null, 1), 1);
  assert.equal(stepKm(21.1, -0.1), 21);
});

test('stepMinutes: moves by the step between 1 and 1000 minutes', () => {
  assert.equal(stepMinutes(30, 5), 35);
  assert.equal(stepMinutes(3, -5), 1);
  assert.equal(stepMinutes(998, 5), 1000);
  assert.equal(stepMinutes(null, 5), 5);
});

test('suggestMinutes: the member\'s own average pace over the last runs, else 6 minutes per km', () => {
  assert.equal(suggestMinutes(5, []), 30);
  assert.equal(suggestMinutes(10, [run(5, 25), run(10, 50)]), 50); // 5 min/km
  assert.equal(suggestMinutes(3, [run(0.05, 20)]), 18); // a run too short to learn from is ignored
});
