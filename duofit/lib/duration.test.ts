import test from 'node:test';
import assert from 'node:assert/strict';
import { formatDuration, getDaysLeftInWeek } from './duration.ts';

test('formatDuration: minutes and two-digit seconds', () => {
  assert.equal(formatDuration(0), '0:00');
  assert.equal(formatDuration(9), '0:09');
  assert.equal(formatDuration(59), '0:59');
  assert.equal(formatDuration(60), '1:00');
  assert.equal(formatDuration(125), '2:05');
  assert.equal(formatDuration(3600), '60:00');
});

test('getDaysLeftInWeek: the week ends on Saturday', () => {
  assert.equal(getDaysLeftInWeek(new Date(2026, 9, 11)), 6, 'Sunday');
  assert.equal(getDaysLeftInWeek(new Date(2026, 9, 14)), 3, 'Wednesday');
  assert.equal(getDaysLeftInWeek(new Date(2026, 9, 17)), 0, 'Saturday');
});
