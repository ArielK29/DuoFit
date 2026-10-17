import test from 'node:test';
import assert from 'node:assert/strict';
// The phone's own clock decides what a calendar day is; the DST tests below need a zone that changes its clock.
process.env.TZ = 'Asia/Jerusalem';

import { computePartnerStreaks, computeStreak } from './streaks.ts';

// Local-time dates, because the streak counts calendar days on the phone.
const day = (d: number, hour = 18) => new Date(2026, 9, d, hour, 0, 0).toISOString();
const workout = (id: string, d: number, partnerId = 'p1', partnerName = 'דנה', hour = 18) => ({
  id, partnerId, partnerName, activity: 'ריצה', scheduledAt: day(d, hour), location: 'פארק', checkedIn: true,
});

test('computeStreak: no workouts is 0, one workout is 1', () => {
  assert.equal(computeStreak([]), 0);
  assert.equal(computeStreak([workout('a', 10)]), 1);
});

test('computeStreak: counts consecutive calendar days ending at the latest one, in any input order', () => {
  assert.equal(computeStreak([workout('a', 10), workout('b', 11), workout('c', 12)]), 3);
  assert.equal(computeStreak([workout('c', 12), workout('a', 10), workout('b', 11)]), 3);
});

test('computeStreak: a gap ends the run; only the run at the latest day counts', () => {
  assert.equal(computeStreak([workout('a', 1), workout('b', 2), workout('c', 3), workout('d', 4), workout('e', 10), workout('f', 11)]), 2);
  assert.equal(computeStreak([workout('a', 10), workout('b', 12)]), 1);
});

test('computeStreak: two workouts on the same day count once, whatever the hour', () => {
  assert.equal(computeStreak([workout('a', 10, 'p1', 'דנה', 7), workout('b', 10, 'p1', 'דנה', 21), workout('c', 11)]), 2);
});

test('computeStreak: duplicates in the middle of a run do not break it', () => {
  assert.equal(computeStreak([workout('a', 10), workout('b', 11, 'p1', 'דנה', 7), workout('c', 11, 'p1', 'דנה', 21), workout('d', 12)]), 3);
});

test('computeStreak: the nights the clocks change (23 and 25 hour days) do not break a streak', () => {
  // Israel: clocks go back on Sunday 25 Oct 2026 (25-hour day) and forward on Friday 27 Mar 2026 (23-hour day).
  const at = (m: number, d: number) => ({ ...workout('x', 1), id: `${m}-${d}`, scheduledAt: new Date(2026, m, d, 12).toISOString() });
  assert.equal(computeStreak([at(9, 24), at(9, 25), at(9, 26)]), 3, 'autumn');
  assert.equal(computeStreak([at(2, 26), at(2, 27), at(2, 28)]), 3, 'spring');
});

test('computeStreak: works across a month end', () => {
  const sep30 = new Date(2026, 8, 30, 12).toISOString();
  const oct1 = new Date(2026, 9, 1, 12).toISOString();
  assert.equal(computeStreak([{ ...workout('a', 1), scheduledAt: sep30 }, { ...workout('b', 1), scheduledAt: oct1 }]), 2);
});

test('computePartnerStreaks: one entry per partner, only streaks above 1, longest first', () => {
  const result = computePartnerStreaks([
    workout('a', 10, 'dana', 'דנה'), workout('b', 11, 'dana', 'דנה'),
    workout('c', 10, 'avi', 'אבי'), workout('d', 11, 'avi', 'אבי'), workout('e', 12, 'avi', 'אבי'),
    workout('f', 10, 'noa', 'נועה'),
  ]);
  assert.deepEqual(result, [
    { partnerId: 'avi', partnerName: 'אבי', streak: 3 },
    { partnerId: 'dana', partnerName: 'דנה', streak: 2 },
  ]);
  assert.deepEqual(computePartnerStreaks([]), []);
});
