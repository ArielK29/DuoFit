import test from 'node:test';
import assert from 'node:assert/strict';
process.env.TZ = 'Asia/Jerusalem';

import { workoutHoursThisWeek } from './wellbeing.ts';
import type { HealthRun } from './healthData.ts';

// 2026-10-28 is a Wednesday; the week started on Sunday 25 October.
const wed = new Date(2026, 9, 28, 15, 0, 0);
const run = (id: string, start: Date, minutes: number): HealthRun => ({ id, startedAt: start.toISOString(), km: 5, durationSec: minutes * 60 });

test('workoutHoursThisWeek: runs this week plus an hour for each shared workout checked in this week', () => {
  const runs = [run('a', new Date(2026, 9, 26, 7), 30), run('b', new Date(2026, 9, 27, 18), 45), run('old', new Date(2026, 9, 20, 7), 90)];
  const shared = [new Date(2026, 9, 27, 19).toISOString(), new Date(2026, 9, 10, 19).toISOString()];
  assert.equal(workoutHoursThisWeek(runs, shared, wed), 2.3);
});

test('workoutHoursThisWeek: the same run read from Apple Health and recorded in the app counts once', () => {
  const runs = [run('health', new Date(2026, 9, 26, 7, 0), 30), run('app', new Date(2026, 9, 26, 7, 2), 29)];
  assert.equal(workoutHoursThisWeek(runs, [], wed), 0.5);
});

test('workoutHoursThisWeek: nothing this week is 0', () => {
  assert.equal(workoutHoursThisWeek([], [], wed), 0);
});
