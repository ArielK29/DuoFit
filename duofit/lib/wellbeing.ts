import type { HealthRun } from './healthData.ts';

// Hours spent really training this week (runs from Apple Health or recorded in the app, plus shared workouts). Pure helper, no phone APIs.
// (Screen time is not tracked: Apple does not let an app read it, and only what really works stays in the app.)

// A shared workout has no recorded length, so each one counts as an hour.
const SHARED_WORKOUT_HOURS = 1;
// Two runs that start within this many minutes are the same run seen twice (Apple Health and the app's own recording).
const SAME_RUN_MINUTES = 5;

function weekStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay());
}

export function workoutHoursThisWeek(runs: HealthRun[], sharedWorkoutIsos: string[], now: Date): number {
  const start = weekStart(now).getTime();
  const thisWeek = runs
    .filter((run) => new Date(run.startedAt).getTime() >= start)
    .sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime());

  const distinct: HealthRun[] = [];
  for (const run of thisWeek) {
    const previous = distinct[distinct.length - 1];
    const gap = previous ? (new Date(run.startedAt).getTime() - new Date(previous.startedAt).getTime()) / 60000 : Infinity;
    if (gap < SAME_RUN_MINUTES) {
      if (run.durationSec > previous.durationSec) distinct[distinct.length - 1] = run;
    } else {
      distinct.push(run);
    }
  }

  const runHours = distinct.reduce((sum, run) => sum + run.durationSec / 3600, 0);
  const sharedHours = sharedWorkoutIsos.filter((iso) => new Date(iso).getTime() >= start).length * SHARED_WORKOUT_HOURS;
  return Math.round((runHours + sharedHours) * 10) / 10;
}
