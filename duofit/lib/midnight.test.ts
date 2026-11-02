import test from 'node:test';
import assert from 'node:assert/strict';
process.env.TZ = 'Asia/Jerusalem';

import { msUntilNextMidnight } from './midnight.ts';

test('msUntilNextMidnight: from the afternoon to the coming 00:00', () => {
  assert.equal(msUntilNextMidnight(new Date(2026, 9, 28, 15, 0, 0)), 9 * 3600 * 1000);
});

test('msUntilNextMidnight: one second before midnight, and exactly at midnight (a full day ahead)', () => {
  assert.equal(msUntilNextMidnight(new Date(2026, 9, 28, 23, 59, 59)), 1000);
  assert.equal(msUntilNextMidnight(new Date(2026, 9, 28, 0, 0, 0)), 24 * 3600 * 1000);
});

test('msUntilNextMidnight: the night the clocks go back (25 October 2026) is counted in real time', () => {
  // 24 October 22:00 to 25 October 00:00 is 2 hours; the next midnight after that is 25 hours later.
  assert.equal(msUntilNextMidnight(new Date(2026, 9, 24, 22, 0, 0)), 2 * 3600 * 1000);
  assert.equal(msUntilNextMidnight(new Date(2026, 9, 25, 0, 0, 0)), 25 * 3600 * 1000);
});
