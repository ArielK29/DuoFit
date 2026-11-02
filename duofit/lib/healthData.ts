// Pure helpers that turn what Apple Health returns (per-day step totals, running workouts)
// into the numbers the Home and Progress screens show. No native code here, so it is unit-tested.

export interface DailySteps {
  date: Date;
  steps: number;
}

export interface HealthRun {
  id: string;
  startedAt: string; // ISO
  km: number;
  durationSec: number;
}

// Runs shorter than this are walks to the bus or a watch glitch, not a run worth listing.
const MIN_RUN_KM = 0.1;

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function cleanNumber(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

// Step totals for the current week, Sunday first (the Progress chart's order). Days after today stay 0.
export function buildWeekSteps(daily: DailySteps[], now: Date): number[] {
  const today = startOfDay(now);
  // Calendar arithmetic, not milliseconds: the day the clocks change is 23 or 25 hours long.
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()).getTime();
  const totals = [0, 0, 0, 0, 0, 0, 0];
  for (const entry of daily) {
    const day = startOfDay(entry.date);
    if (day < weekStart || day > today) continue;
    const index = Math.round((day - weekStart) / 86400000);
    totals[index] += cleanNumber(entry.steps);
  }
  return totals.map((value) => Math.round(value));
}

// Average of the days that already happened this week (today included).
export function weekAverage(values: number[], now: Date): number {
  const counted = values.slice(0, now.getDay() + 1);
  if (counted.length === 0) return 0;
  return Math.round(counted.reduce((sum, value) => sum + value, 0) / counted.length);
}

export function metersToKm(meters: number): number {
  return Math.round((cleanNumber(meters) / 1000) * 10) / 10;
}

// Pace as "m:ss" per km; "—" when there is no distance or time.
export function paceText(km: number, durationSec: number): string {
  if (!(km > 0) || !(durationSec > 0)) return '—';
  const secondsPerKm = Math.round(durationSec / km);
  const minutes = Math.floor(secondsPerKm / 60);
  const seconds = secondsPerKm % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function monthRunKm(runs: HealthRun[], now: Date): number {
  const total = runs
    .filter((run) => {
      const started = new Date(run.startedAt);
      return started.getFullYear() === now.getFullYear() && started.getMonth() === now.getMonth();
    })
    .reduce((sum, run) => sum + run.km, 0);
  return Math.round(total * 10) / 10;
}

export function recentRuns(runs: HealthRun[], limit: number): HealthRun[] {
  return runs
    .filter((run) => run.km >= MIN_RUN_KM)
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
    .slice(0, limit);
}

// "26:40" for a short run, "1:02:05" once it passes an hour.
export function runDurationText(totalSeconds: number): string {
  const total = Math.max(0, Math.round(Number.isFinite(totalSeconds) ? totalSeconds : 0));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const ss = String(seconds).padStart(2, '0');
  return hours > 0 ? `${hours}:${String(minutes).padStart(2, '0')}:${ss}` : `${minutes}:${ss}`;
}
