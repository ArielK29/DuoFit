import type { ScheduledWorkout } from '@hooks/useWorkoutStore';

// Longest run of consecutive calendar days ending at the most recent
// check-in — simple streak definition, no "did you break it today" logic.
// A calendar day as a whole number, taken from the phone's local date. Counting in UTC days of the
// local y/m/d keeps the 23 and 25 hour days of a clock change exactly one day apart.
const DAY_MS = 86400000;
function localDayNumber(iso: string): number {
  const date = new Date(iso);
  return Math.round(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY_MS);
}

export function computeStreak(workouts: ScheduledWorkout[]): number {
  if (workouts.length === 0) return 0;

  const days = Array.from(new Set(workouts.map((workout) => localDayNumber(workout.scheduledAt)))).sort((x, y) => y - x);

  let streak = 1;
  for (let i = 1; i < days.length; i++) {
    if (days[i - 1] - days[i] === 1) streak++;
    else break;
  }
  return streak;
}

export interface PartnerStreak {
  partnerId: string;
  partnerName: string;
  streak: number;
}

// Per-partner version of computeStreak, for the "ביחד ברצף" row.
export function computePartnerStreaks(completedWorkouts: ScheduledWorkout[]): PartnerStreak[] {
  const byPartner = new Map<string, ScheduledWorkout[]>();
  completedWorkouts.forEach((workout) => {
    const list = byPartner.get(workout.partnerId) ?? [];
    list.push(workout);
    byPartner.set(workout.partnerId, list);
  });

  return Array.from(byPartner.entries())
    .map(([partnerId, workouts]) => ({
      partnerId,
      partnerName: workouts[0].partnerName,
      streak: computeStreak(workouts),
    }))
    .filter((entry) => entry.streak > 1)
    .sort((a, b) => b.streak - a.streak);
}
