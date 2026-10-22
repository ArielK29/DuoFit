import test from 'node:test';
import assert from 'node:assert/strict';
import { scheduleHint } from './scheduleHint.ts';

const now = new Date(2026, 9, 22, 21, 30); // 22 October 2026, evening

test('scheduleHint: today, tomorrow and the day after in plain words, by calendar day and not by hours', () => {
  assert.deepEqual(scheduleHint(new Date(2026, 9, 22, 23, 0), now), { text: 'היום', warn: false });
  assert.deepEqual(scheduleHint(new Date(2026, 9, 23, 1, 0), now), { text: 'מחר', warn: false });
  assert.deepEqual(scheduleHint(new Date(2026, 9, 24, 8, 0), now), { text: 'מחרתיים', warn: false });
});

test('scheduleHint: up to a month away it counts the days', () => {
  assert.deepEqual(scheduleHint(new Date(2026, 9, 27, 18, 0), now), { text: 'בעוד 5 ימים', warn: false });
  assert.deepEqual(scheduleHint(new Date(2026, 10, 21, 18, 0), now), { text: 'בעוד 30 ימים', warn: false });
});

test('scheduleHint: more than a month away warns and names the month count (the 22 December mistake from the device pass)', () => {
  const december = scheduleHint(new Date(2026, 11, 22, 1, 58), now);
  assert.equal(december.warn, true);
  assert.match(december.text, /בעוד 61 ימים/);
  assert.match(december.text, /חודשיים/);
  assert.match(december.text, /החודש/);
});

test('scheduleHint: a time in the past is flagged, not described as the future', () => {
  assert.deepEqual(scheduleHint(new Date(2026, 9, 21, 18, 0), now), { text: 'התאריך כבר עבר', warn: true });
});
