import test from 'node:test';
import assert from 'node:assert/strict';
process.env.TZ = 'Asia/Jerusalem';

import {
  bestMonthKm,
  buildWeekSteps,
  displayKcal,
  estimateKcal,
  mergeTodaySteps,
  metersToKm,
  monthRunKm,
  paceText,
  runDurationText,
  recentRuns,
  weekAverage,
  type HealthRun,
} from './healthData.ts';

// 2026-10-28 is a Wednesday (getDay() === 3).
const wed = new Date(2026, 9, 28, 15, 0, 0);
const at = (month: number, d: number, hour = 7) => new Date(2026, month, d, hour, 0, 0);

test('buildWeekSteps: Sunday first, days after today stay 0, today counts', () => {
  const daily = [
    { date: at(9, 25), steps: 6000 }, // Sunday
    { date: at(9, 26), steps: 8000 }, // Monday
    { date: at(9, 28), steps: 4200.4 }, // Wednesday (today)
    { date: at(9, 29), steps: 999 }, // Thursday (future, must be ignored)
  ];
  assert.deepEqual(buildWeekSteps(daily, wed), [6000, 8000, 0, 4200, 0, 0, 0]);
});

test('buildWeekSteps: a day from a previous week is ignored and two entries for a day add up', () => {
  const daily = [
    { date: at(9, 24), steps: 5000 }, // Saturday of the previous week
    { date: at(9, 27, 8), steps: 1000 },
    { date: at(9, 27, 20), steps: 500 },
  ];
  assert.deepEqual(buildWeekSteps(daily, wed), [0, 0, 1500, 0, 0, 0, 0]);
});

test('buildWeekSteps: negative or broken numbers become 0', () => {
  assert.deepEqual(buildWeekSteps([{ date: at(9, 25), steps: -5 }, { date: at(9, 26), steps: Number.NaN }], wed), [0, 0, 0, 0, 0, 0, 0]);
});

test('weekAverage: averages the days up to today, empty week is 0', () => {
  assert.equal(weekAverage([6000, 8000, 4000, 6000, 9999, 0, 0], wed), 6000);
  assert.equal(weekAverage([0, 0, 0, 0, 0, 0, 0], wed), 0);
});

test('metersToKm: one decimal, never negative', () => {
  assert.equal(metersToKm(5234), 5.2);
  assert.equal(metersToKm(0), 0);
  assert.equal(metersToKm(-40), 0);
  assert.equal(metersToKm(Number.NaN), 0);
});

test('paceText: minutes and seconds per km', () => {
  assert.equal(paceText(5, 1500), '5:00');
  assert.equal(paceText(5.2, 1600), '5:08');
  assert.equal(paceText(0, 600), '—');
  assert.equal(paceText(3, 0), '—');
});

test('paceText: carries 59.6 seconds into the next minute', () => {
  assert.equal(paceText(1, 359.6), '6:00');
});

const run = (id: string, start: Date, km: number, durationSec: number): HealthRun => ({
  id,
  startedAt: start.toISOString(),
  km,
  durationSec,
});

test('monthRunKm: only runs of the current month, summed to one decimal', () => {
  const runs = [run('a', at(9, 3), 5.2, 1600), run('b', at(9, 20), 4.04, 1300), run('c', at(8, 29), 10, 3000)];
  assert.equal(monthRunKm(runs, wed), 9.2);
  assert.equal(monthRunKm([], wed), 0);
});

test('recentRuns: newest first, limited, runs shorter than 100 m are dropped', () => {
  const runs = [
    run('old', at(9, 1), 3, 1000),
    run('new', at(9, 27), 6, 2000),
    run('tiny', at(9, 28), 0.05, 20),
    run('mid', at(9, 20), 4, 1500),
  ];
  assert.deepEqual(recentRuns(runs, 2).map((r) => r.id), ['new', 'mid']);
});

test("runDurationText: m:ss under an hour, h:mm:ss from an hour", () => {
  assert.equal(runDurationText(1600), "26:40");
  assert.equal(runDurationText(59), "0:59");
  assert.equal(runDurationText(3725), "1:02:05");
  assert.equal(runDurationText(-5), "0:00");
});

test("mergeTodaySteps: the higher of Apple Health and the phone motion sensor wins, a missing sensor changes nothing", () => {
  assert.equal(mergeTodaySteps(103, 137), 137);
  assert.equal(mergeTodaySteps(500, 480), 500);
  assert.equal(mergeTodaySteps(120, null), 120);
  assert.equal(mergeTodaySteps(0, 12.6), 13);
  assert.equal(mergeTodaySteps(50, Number.NaN), 50);
  assert.equal(mergeTodaySteps(50, -3), 50);
});

test("estimateKcal: about 0.5 kcal per kg per km of walking, 1300 steps to a km, default 70 kg", () => {
  assert.equal(estimateKcal(1300, 70), 35);
  assert.equal(estimateKcal(10000, 70), 269);
  assert.equal(estimateKcal(10000, 90), 346);
  assert.equal(estimateKcal(0, 70), 0);
  assert.equal(estimateKcal(1300, null), 35);
  assert.equal(estimateKcal(1300, Number.NaN), 35);
});

test("displayKcal: the measured value (watch, workout) wins when it is higher than the estimate", () => {
  assert.equal(displayKcal(400, 1300, 70), 400);
  assert.equal(displayKcal(1, 10000, 70), 269);
  assert.equal(displayKcal(0, 0, 70), 0);
});

test("bestMonthKm: the iPhone distance already contains runs recorded in the app, so take the larger, never the sum", () => {
  const mine = [run("a", at(9, 3), 5.2, 1600), run("b", at(9, 20), 4, 1300)];
  assert.equal(bestMonthKm(12, mine, wed), 12);
  assert.equal(bestMonthKm(3, mine, wed), 9.2);
  assert.equal(bestMonthKm(null, mine, wed), 9.2);
  assert.equal(bestMonthKm(null, [], wed), 0);
});
