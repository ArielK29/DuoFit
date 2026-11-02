import type { HealthRun } from './healthData.ts';

// "Real Life Time": hours spent really training this week (measured), and the screen time the member types in from the
// phone's Settings (Apple does not let any app read it). Pure helpers, no phone APIs.

// A shared workout has no recorded length, so each one counts as an hour.
const SHARED_WORKOUT_HOURS = 1;
// Two runs that start within this many minutes are the same run seen twice (Apple Health and the app's own recording).
const SAME_RUN_MINUTES = 5;

function weekStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay());
}

// The Sunday that starts the week, as YYYY-MM-DD (the key under which that week's screen time is saved).
export function weekKey(date: Date): string {
  const start = weekStart(date);
  const month = String(start.getMonth() + 1).padStart(2, '0');
  const day = String(start.getDate()).padStart(2, '0');
  return `${start.getFullYear()}-${month}-${day}`;
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

// Hours of screen time less than last week (positive = better). null until both weeks are entered.
export function screenTimeChange(thisWeekHours: number | undefined, lastWeekHours: number | undefined): number | null {
  if (thisWeekHours === undefined || lastWeekHours === undefined) return null;
  return Math.round((lastWeekHours - thisWeekHours) * 10) / 10;
}
