import { WeightEntry } from '@hooks/useProgressStore';

const DAY_MS = 86400000;
const MONTH_LABELS = ['ינו', 'פבר', 'מרץ', 'אפר', 'מאי', 'יוני', 'יולי', 'אוג', 'ספט', 'אוק', 'נוב', 'דצמ'];

export type WorkoutRange = '12w' | '6m' | '1y';
export type WeightRange = '90d' | '6m' | '1y';

export interface BarPoint {
  label: string;
  value: number;
}

export function startOfWeek(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() - d.getDay());
  return d;
}

function countBetween(dates: Date[], from: Date, to: Date): number {
  return dates.filter((date) => date >= from && date < to).length;
}

// Workouts per week over the chosen range, oldest first. Longer ranges show
// the average workouts per week of each month so the bars stay comparable to
// the weekly goal line.
export function buildWorkoutBars(completedIso: string[], range: WorkoutRange, now: Date): BarPoint[] {
  const dates = completedIso.map((iso) => new Date(iso));

  if (range === '12w') {
    const thisWeek = startOfWeek(now);
    return Array.from({ length: 12 }, (_, index) => {
      const weekStart = new Date(thisWeek);
      weekStart.setDate(thisWeek.getDate() - (11 - index) * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);
      return { label: `${weekStart.getDate()}.${weekStart.getMonth() + 1}`, value: countBetween(dates, weekStart, weekEnd) };
    });
  }

  const months = range === '6m' ? 6 : 12;
  return Array.from({ length: months }, (_, index) => {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - (months - 1 - index), 1);
    const nextMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1);
    const isCurrent = index === months - 1;
    const end = isCurrent ? new Date(now.getTime() + DAY_MS) : nextMonth;
    const weeks = Math.max(1, (end.getTime() - monthStart.getTime()) / (7 * DAY_MS));
    const average = countBetween(dates, monthStart, nextMonth) / weeks;
    return { label: MONTH_LABELS[monthStart.getMonth()], value: Math.round(average * 10) / 10 };
  });
}

// Consecutive weeks that met the weekly goal, counting back from this week
// (a current week that hasn't reached the goal yet doesn't break the streak).
export function computeGoalStreakWeeks(completedIso: string[], goal: number, now: Date): number {
  const dates = completedIso.map((iso) => new Date(iso));
  const thisWeek = startOfWeek(now);
  let streak = 0;

  for (let offset = 0; offset < 520; offset++) {
    const weekStart = new Date(thisWeek);
    weekStart.setDate(thisWeek.getDate() - offset * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);
    const met = countBetween(dates, weekStart, weekEnd) >= goal;

    if (met) streak++;
    else if (offset > 0) break;
  }
  return streak;
}

export interface WeightPoint {
  time: number; // ms
  kg: number;
}

const EXAMPLE_START_KG = 86.8;
const EXAMPLE_NOW_KG = 79.4;
const EXAMPLE_WEEKS = 52;

// Example journey (86.8 -> 79.4 kg over a year) shown until the user logs
// their first real weight.
export function buildExampleWeights(now: Date): WeightPoint[] {
  return Array.from({ length: EXAMPLE_WEEKS + 1 }, (_, index) => {
    const weeksAgo = EXAMPLE_WEEKS - index;
    const progress = weeksAgo / EXAMPLE_WEEKS;
    // Fades to zero at both ends so the journey starts and ends on exact values.
    const wobble = Math.sin(weeksAgo * 1.3) * 0.7 * Math.sin(Math.PI * progress);
    const kg = EXAMPLE_NOW_KG + (EXAMPLE_START_KG - EXAMPLE_NOW_KG) * progress + wobble;
    return { time: now.getTime() - weeksAgo * 7 * DAY_MS, kg: Math.round(kg * 10) / 10 };
  });
}

export function toWeightPoints(log: WeightEntry[]): WeightPoint[] {
  return log
    .map((entry) => ({ time: new Date(entry.loggedAt).getTime(), kg: entry.kg }))
    .sort((a, b) => a.time - b.time);
}

export function rangeStart(range: WeightRange, now: Date): number {
  const days = range === '90d' ? 90 : range === '6m' ? 183 : 365;
  return now.getTime() - days * DAY_MS;
}

export function monthLabel(time: number): string {
  return MONTH_LABELS[new Date(time).getMonth()];
}

// Whole progress toward the goal weight, 0..1.
export function goalProgress(startKg: number, currentKg: number, goalKg: number): number {
  const span = startKg - goalKg;
  if (span === 0) return 1;
  return Math.min(1, Math.max(0, (startKg - currentKg) / span));
}

export function formatKg(kg: number): string {
  return (Math.round(kg * 10) / 10).toFixed(1);
}

export function countWeeksMetGoal(completedIso: string[], goal: number, weeks: number, now: Date): number {
  const dates = completedIso.map((iso) => new Date(iso));
  const thisWeek = startOfWeek(now);
  let met = 0;

  for (let offset = 0; offset < weeks; offset++) {
    const weekStart = new Date(thisWeek);
    weekStart.setDate(thisWeek.getDate() - offset * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);
    if (countBetween(dates, weekStart, weekEnd) >= goal) met++;
  }
  return met;
}
