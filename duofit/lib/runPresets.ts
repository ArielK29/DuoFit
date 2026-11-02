import type { HealthRun } from './healthData.ts';

// Quick entry of a run without typing: tap a common distance or time, or step it up and down.
export const DISTANCE_CHIPS_KM = [1, 1.5, 2, 3, 4, 5, 6, 8, 10, 12, 15, 21.1, 30, 42.2];
export const TIME_CHIPS_MIN = [10, 15, 20, 25, 30, 40, 45, 60, 75, 90, 120];

const MIN_KM = 0.5;
const MAX_KM = 100;
const MAX_MINUTES = 1000;
const DEFAULT_MIN_PER_KM = 6;
// Runs shorter than this say nothing about the member's pace.
const MIN_RUN_KM_FOR_PACE = 0.5;
const RUNS_FOR_PACE = 5;

export function stepKm(current: number | null, delta: number): number {
  const next = Math.round(((current ?? 0) + delta) * 10) / 10;
  return Math.min(MAX_KM, Math.max(MIN_KM, next));
}

export function stepMinutes(current: number | null, delta: number): number {
  return Math.min(MAX_MINUTES, Math.max(1, Math.round((current ?? 0) + delta)));
}

// A starting guess for the time, so one tap on "save" is often enough: the distance at the member's average pace of the last
// runs (newest first), or 6 minutes per km when there is nothing to learn from.
export function suggestMinutes(km: number, recentRuns: HealthRun[]): number {
  const useful = recentRuns.filter((run) => run.km >= MIN_RUN_KM_FOR_PACE && run.durationSec > 0).slice(0, RUNS_FOR_PACE);
  const totalKm = useful.reduce((sum, run) => sum + run.km, 0);
  const totalMinutes = useful.reduce((sum, run) => sum + run.durationSec / 60, 0);
  const minPerKm = totalKm > 0 ? totalMinutes / totalKm : DEFAULT_MIN_PER_KM;
  return Math.max(1, Math.round(km * minPerKm));
}
