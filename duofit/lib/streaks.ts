import { ScheduledWorkout } from '@hooks/useWorkoutStore';

// Longest run of consecutive calendar days ending at the most recent
// check-in — simple streak definition, no "did you break it today" logic.
export function computeStreak(workouts: ScheduledWorkout[]): number {
  if (workouts.length === 0) return 0;

  const dayKeys = Array.from(
    new Set(workouts.map((workout) => new Date(workout.scheduledAt).toDateString()))
  ).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  let streak = 1;
  for (let i = 1; i < dayKeys.length; i++) {
    const diff = (new Date(dayKeys[i - 1]).getTime() - new Date(dayKeys[i]).getTime()) / 86400000;
    if (diff === 1) streak++;
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
