import test from 'node:test';
import assert from 'node:assert/strict';
import { HOLD_START_DELAY_MS, nextRepeatDelay, steppedValue } from './holdRepeat.ts';

test('steppedValue: one step up or down, kept inside the limits and free of floating point crumbs', () => {
  assert.equal(steppedValue(70, 0.1, 1, 30, 300), 70.1);
  assert.equal(steppedValue(70.3, 0.1, -1, 30, 300), 70.2);
  assert.equal(steppedValue(0.1 + 0.2, 0.1, 1, 0, 10), 0.4);
  assert.equal(steppedValue(299.95, 0.1, 1, 30, 300), 300);
  assert.equal(steppedValue(300, 0.1, 1, 30, 300), 300);
  assert.equal(steppedValue(30, 0.1, -1, 30, 300), 30);
});

test('steppedValue: a goal that moves in halves stays on halves', () => {
  assert.equal(steppedValue(76, 0.5, 1, 30, 300), 76.5);
  assert.equal(steppedValue(76.5, 0.5, -1, 30, 300), 76);
});

test('nextRepeatDelay: a hold starts slowly and speeds up, never below the fastest speed', () => {
  assert.equal(HOLD_START_DELAY_MS, 400);
  const slow = nextRepeatDelay(0);
  const mid = nextRepeatDelay(1500);
  const fast = nextRepeatDelay(5000);
  assert.ok(slow > mid && mid > fast, `${slow} ${mid} ${fast}`);
  assert.equal(nextRepeatDelay(60000), fast);
  assert.ok(fast >= 25);
});
