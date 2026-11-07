import test from 'node:test';
import assert from 'node:assert/strict';
process.env.TZ = 'Asia/Jerusalem';

import {
  bestKcal,
  bestMonthKm,
  buildWeekSteps,
  displayKcal,
  runExtraKcal,
  estimateKcal,
  kcalFromDistancePieces,
  mergeTodaySteps,
  metersToKm,
  monthRunKm,
  paceText,
  runDurationText,
  recentRuns,
  todayRunKm,
  weekAverage,
  activityKind,
  isWeekSummaryTime,
  runKcalAdjustments,
  percentChange,
  weekTotal,
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

test("runExtraKcal: running burns about twice what walking does, and the steps already count the walking half", () => {
  assert.equal(runExtraKcal(5, 70), 175);
  assert.equal(runExtraKcal(0, 70), 0);
  assert.equal(runExtraKcal(5, null), 175);
});

test("todayRunKm: only recorded runs that started today", () => {
  const runs = [run("a", new Date(2026, 9, 28, 7), 5, 1500), run("b", new Date(2026, 9, 27, 7), 8, 2400), run("c", new Date(2026, 9, 28, 18), 2.5, 800)];
  assert.equal(todayRunKm(runs, wed), 7.5);
});

test("kcalFromDistancePieces: walking pieces cost 0.5 kcal per kg per km, running pieces (7.5 km/h or more) cost 1.0", () => {
  // 5 minutes at 5 km/h is 0.4167 km; 5 minutes at 12 km/h is 1 km.
  assert.equal(kcalFromDistancePieces([0.4167], 70), 15);
  assert.equal(kcalFromDistancePieces([1], 70), 70);
  assert.equal(kcalFromDistancePieces([1, 1, 1, 1, 1, 1], 70), 420);
  assert.equal(kcalFromDistancePieces([0.4167, 1, 0, 0], 70), 85);
  assert.equal(kcalFromDistancePieces([], 70), 0);
  assert.equal(kcalFromDistancePieces([1], null), 70);
  assert.equal(kcalFromDistancePieces([Number.NaN, -2], 70), 0);
});

test("bestKcal: the biggest of what the phone measured (active energy, workouts) and what is worked out from distance and steps", () => {
  const base = { activeKcal: 0, workoutKcal: 0, pieceKcal: 0, stepsKcal: 0, runExtraKcal: 0 };
  assert.deepEqual(bestKcal({ ...base, activeKcal: 400, pieceKcal: 100 }), { kcal: 400, estimated: false });
  assert.deepEqual(bestKcal({ ...base, workoutKcal: 392, activeKcal: 50, pieceKcal: 300 }), { kcal: 392, estimated: false });
  assert.deepEqual(bestKcal({ ...base, pieceKcal: 392, stepsKcal: 168 }), { kcal: 392, estimated: true });
  assert.deepEqual(bestKcal({ ...base, stepsKcal: 168, runExtraKcal: 100 }), { kcal: 268, estimated: true });
  assert.deepEqual(bestKcal(base), { kcal: 0, estimated: false });
});

test("weekTotal: all the steps of the days up to today, later days and broken numbers do not count", () => {
  assert.equal(weekTotal([6000, 8000, 4000, 6000, 9999, 0, 0], wed), 24000);
  assert.equal(weekTotal([6000, 8000, 4000, Number.NaN, 9999, 5000, 5000], wed), 18000);
  assert.equal(weekTotal([0, 0, 0, 0, 0, 0, 0], wed), 0);
});

test("percentChange: up, down, equal, and nothing to compare with", () => {
  assert.equal(percentChange(54000, 50000), 8);
  assert.equal(percentChange(45000, 50000), -10);
  assert.equal(percentChange(50000, 50000), 0);
  assert.equal(percentChange(1000, 0), null);
  assert.equal(percentChange(Number.NaN, 50000), -100);
});

test("last week read with buildWeekSteps and a date a week back: the same weekdays line up", () => {
  const lastWed = new Date(wed.getFullYear(), wed.getMonth(), wed.getDate() - 7);
  const daily = [
    { date: at(9, 18), steps: 5000 }, // Sunday of last week
    { date: at(9, 19), steps: 7000 }, // Monday
    { date: at(9, 21), steps: 9000 }, // Wednesday (the same weekday as today)
    { date: at(9, 22), steps: 3000 }, // Thursday: after that weekday, not part of the comparison
  ];
  const lastWeek = buildWeekSteps(daily, lastWed);
  assert.equal(weekTotal(lastWeek, lastWed), 21000);
});

test("isWeekSummaryTime: only on Saturday night from 20:00", () => {
  assert.equal(isWeekSummaryTime(new Date(2026, 9, 31, 20, 0)), true); // Saturday 20:00
  assert.equal(isWeekSummaryTime(new Date(2026, 9, 31, 23, 59)), true);
  assert.equal(isWeekSummaryTime(new Date(2026, 9, 31, 19, 59)), false); // Shabbat is not over
  assert.equal(isWeekSummaryTime(new Date(2026, 9, 31, 9, 0)), false);
  assert.equal(isWeekSummaryTime(new Date(2026, 10, 1, 21, 0)), false); // Sunday
  assert.equal(isWeekSummaryTime(new Date(2026, 9, 30, 21, 0)), false); // Friday night
});

test("runKcalAdjustments: a run with the member's calories replaces the steps estimate for its distance, a run without adds the running extra", () => {
  const todayRun = (km: number, minutes: number, kcal?: number): HealthRun => ({
    id: String(km),
    startedAt: new Date(wed.getFullYear(), wed.getMonth(), wed.getDate(), 7, 0, 0).toISOString(),
    km,
    durationSec: minutes * 60,
    ...(kcal === undefined ? {} : { kcal }),
  });
  // A walk of 2.4 km in 30 minutes (4.8 km/h), 70 kg: the steps already counted 2.4 * 70 * 0.5 = 84, the member says 126.
  assert.deepEqual(runKcalAdjustments([todayRun(2.4, 30, 126)], wed, 70), { extraKcal: 0, stepsAdjust: 42, pieceAdjust: 42 });
  // A run of 5 km in 25 minutes (12 km/h): the pieces counted 5 * 70 * 1.0 = 350, the steps 175, the member says 392.
  assert.deepEqual(runKcalAdjustments([todayRun(5, 25, 392)], wed, 70), { extraKcal: 0, stepsAdjust: 217, pieceAdjust: 42 });
  // Without calories the run adds the running extra, like before.
  assert.deepEqual(runKcalAdjustments([todayRun(5, 25)], wed, 70), { extraKcal: 175, stepsAdjust: 0, pieceAdjust: 0 });
  // A run of another day does not count today; broken numbers are ignored.
  const yesterday = { ...todayRun(5, 25, 392), startedAt: new Date(wed.getFullYear(), wed.getMonth(), wed.getDate() - 1, 7).toISOString() };
  assert.deepEqual(runKcalAdjustments([yesterday], wed, 70), { extraKcal: 0, stepsAdjust: 0, pieceAdjust: 0 });
});

test("bestKcal: the member's calories for a run lift the estimate by the difference, a watch measurement is not added to", () => {
  const base = { activeKcal: 0, workoutKcal: 0, pieceKcal: 0, stepsKcal: 83, runExtraKcal: 0 };
  assert.deepEqual(bestKcal({ ...base, stepsAdjust: 42 }), { kcal: 125, estimated: true });
  assert.deepEqual(bestKcal({ ...base, activeKcal: 300, stepsAdjust: 42 }), { kcal: 300, estimated: false });
  assert.deepEqual(bestKcal({ ...base, stepsAdjust: -500 }), { kcal: 0, estimated: false });
});

test("activityKind: a 9:30 pace is a walk, a 6:00 pace is a run, broken numbers count as a run", () => {
  assert.equal(activityKind(5, 47 * 60 + 31), 'walk');
  assert.equal(activityKind(5, 30 * 60), 'run');
  assert.equal(activityKind(5, 0), 'run');
  assert.equal(activityKind(Number.NaN, 1800), 'walk');
});
