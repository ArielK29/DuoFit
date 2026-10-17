import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildExampleWeights, buildWorkoutBars, computeGoalStreakWeeks, countWeeksMetGoal, formatKg, goalProgress,
  monthLabel, rangeStart, startOfWeek, toWeightPoints,
} from './progress.ts';

// Saturday 17 Oct 2026; its week (Sunday first) started on Sunday 11 Oct.
const NOW = new Date(2026, 9, 17, 12, 0, 0);
const iso = (y: number, m: number, d: number, h = 10) => new Date(y, m, d, h).toISOString();
const DAY = 86400000;

test('startOfWeek: the Sunday at midnight, for every day of the week', () => {
  for (let d = 11; d <= 17; d++) {
    const start = startOfWeek(new Date(2026, 9, d, 15, 30));
    assert.deepEqual([start.getFullYear(), start.getMonth(), start.getDate(), start.getHours(), start.getMinutes()], [2026, 9, 11, 0, 0], `day ${d}`);
  }
  assert.equal(startOfWeek(new Date(2026, 9, 10)).getDate(), 4);
});

test('startOfWeek: crosses a month boundary', () => {
  const start = startOfWeek(new Date(2026, 10, 3, 9)); // Tuesday 3 Nov
  assert.deepEqual([start.getMonth(), start.getDate()], [10, 1]);
  const early = startOfWeek(new Date(2026, 9, 1, 9)); // Thursday 1 Oct
  assert.deepEqual([early.getMonth(), early.getDate()], [8, 27]);
});

test('buildWorkoutBars 12w: twelve weeks, oldest first, counts per week, week edges respected', () => {
  const bars = buildWorkoutBars([iso(2026, 9, 11, 0), iso(2026, 9, 14), iso(2026, 9, 10, 23), iso(2026, 9, 4)], '12w', NOW);
  assert.equal(bars.length, 12);
  assert.equal(bars[11].value, 2, 'this week: Sun 11 00:00 and Wed 14');
  assert.equal(bars[10].value, 2, 'last week: Sat 10 23:00 and Sun 4');
  assert.equal(bars[11].label, '11.10');
  assert.equal(bars[0].label, '26.7');
  assert.ok(bars.slice(0, 10).every((bar) => bar.value === 0));
  assert.equal(buildWorkoutBars([], '12w', NOW).every((bar) => bar.value === 0), true);
});

test('buildWorkoutBars 6m and 1y: one bar per month, Hebrew labels, average per week', () => {
  const sixMonths = buildWorkoutBars([], '6m', NOW);
  assert.deepEqual(sixMonths.map((bar) => bar.label), ['מאי', 'יוני', 'יולי', 'אוג', 'ספט', 'אוק']);
  assert.equal(buildWorkoutBars([], '1y', NOW).length, 12);
  assert.equal(buildWorkoutBars([], '1y', NOW)[11].label, 'אוק');
  // September has 30 days = 4.29 weeks; 8 workouts average 1.9 per week.
  const dates = Array.from({ length: 8 }, (_, i) => iso(2026, 8, i + 1));
  assert.equal(buildWorkoutBars(dates, '6m', NOW)[4].value, 1.9);
  // The current month is divided by the time that has passed (plus one day), not by the whole month.
  const octDates = Array.from({ length: 6 }, (_, i) => iso(2026, 9, i + 1));
  const weeksSoFar = (NOW.getTime() + DAY - new Date(2026, 9, 1).getTime()) / (7 * DAY);
  assert.equal(buildWorkoutBars(octDates, '6m', NOW)[5].value, Math.round((6 / weeksSoFar) * 10) / 10);
});

test('computeGoalStreakWeeks: a current week below the goal does not break the streak', () => {
  const dates = [iso(2026, 9, 5), iso(2026, 9, 6), iso(2026, 9, 7), iso(2026, 9, 12)]; // goal 2: last week 3, this week 1
  assert.equal(computeGoalStreakWeeks(dates, 2, NOW), 1);
});

test('computeGoalStreakWeeks: one missed past week ends the streak even if older weeks met the goal', () => {
  const olderWeekOnly = [iso(2026, 9, 1), iso(2026, 9, 2)]; // the week of 27 Sep met goal 2; last week and this week did not
  assert.equal(computeGoalStreakWeeks(olderWeekOnly, 2, NOW), 0);
});

test('computeGoalStreakWeeks: counts this week once it met the goal, and stops at the first missed past week', () => {
  const dates = [iso(2026, 9, 11), iso(2026, 9, 12), iso(2026, 9, 4), iso(2026, 9, 5), iso(2026, 8, 20), iso(2026, 8, 21)]; // the week of 27 Sep missed
  assert.equal(computeGoalStreakWeeks(dates, 2, NOW), 2);
  assert.equal(computeGoalStreakWeeks([], 2, NOW), 0);
});

test('countWeeksMetGoal: counts met weeks inside the window only, current week included', () => {
  const dates = [iso(2026, 9, 11), iso(2026, 9, 12), iso(2026, 9, 5), iso(2026, 9, 6), iso(2026, 8, 20), iso(2026, 8, 21)];
  assert.equal(countWeeksMetGoal(dates, 2, 2, NOW), 2);
  assert.equal(countWeeksMetGoal(dates, 2, 3, NOW), 2, 'the week of 20 Sep is 3 weeks back, outside offsets 0-2');
  assert.equal(countWeeksMetGoal(dates, 2, 4, NOW), 3);
  assert.equal(countWeeksMetGoal(dates, 3, 5, NOW), 0);
  assert.equal(countWeeksMetGoal(dates, 2, 0, NOW), 0);
});

test('goalProgress: 0 to 1, clamped, works for losing and gaining, and a zero span is complete', () => {
  assert.equal(goalProgress(90, 90, 80), 0);
  assert.equal(goalProgress(90, 85, 80), 0.5);
  assert.equal(goalProgress(90, 80, 80), 1);
  assert.equal(goalProgress(90, 70, 80), 1, 'past the goal');
  assert.equal(goalProgress(90, 95, 80), 0, 'wrong direction');
  assert.equal(goalProgress(60, 65, 70), 0.5, 'gaining weight');
  assert.equal(goalProgress(80, 80, 80), 1);
});

test('formatKg: one decimal, rounded', () => {
  assert.equal(formatKg(80), '80.0');
  assert.equal(formatKg(79.44), '79.4');
  assert.equal(formatKg(79.46), '79.5');
  assert.equal(formatKg(0.04), '0.0');
});

test('rangeStart and monthLabel', () => {
  assert.equal(NOW.getTime() - rangeStart('90d', NOW), 90 * DAY);
  assert.equal(NOW.getTime() - rangeStart('6m', NOW), 183 * DAY);
  assert.equal(NOW.getTime() - rangeStart('1y', NOW), 365 * DAY);
  assert.equal(monthLabel(new Date(2026, 0, 15).getTime()), 'ינו');
  assert.equal(monthLabel(new Date(2026, 11, 15).getTime()), 'דצמ');
});

test('toWeightPoints: sorted oldest first and keeps the kilograms', () => {
  const points = toWeightPoints([
    { id: '2', kg: 81, loggedAt: iso(2026, 9, 12) },
    { id: '1', kg: 82.5, loggedAt: iso(2026, 9, 5) },
  ] as any);
  assert.deepEqual(points.map((p) => p.kg), [82.5, 81]);
  assert.ok(points[0].time < points[1].time);
  assert.deepEqual(toWeightPoints([]), []);
});

test('buildExampleWeights: a year of weekly points that starts at 86.8 and ends at 79.4 today', () => {
  const points = buildExampleWeights(NOW);
  assert.equal(points.length, 53);
  assert.equal(points[0].kg, 86.8);
  assert.equal(points[52].kg, 79.4);
  assert.equal(points[52].time, NOW.getTime());
  assert.equal(points[0].time, NOW.getTime() - 52 * 7 * DAY);
  assert.ok(points.every((p, i) => i === 0 || p.time > points[i - 1].time));
});
