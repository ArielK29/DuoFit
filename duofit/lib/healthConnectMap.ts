import type { HealthRun } from './healthData.ts';
import { metersToKm } from './healthData.ts';

// Pure helpers for the Android side (Health Connect). No phone APIs here, so they are tested with plain node.

// Health Connect exercise types that count as a run: RUNNING and RUNNING_TREADMILL (see the library's ExerciseType).
export const HC_RUNNING_TYPE = 56;
export const HC_RUNNING_TREADMILL_TYPE = 57;

export function isRunningType(exerciseType: number): boolean {
  return exerciseType === HC_RUNNING_TYPE || exerciseType === HC_RUNNING_TREADMILL_TYPE;
}

export interface HcSession {
  startTime: string;
  endTime: string;
  exerciseType: number;
}

// The start of each of the seven days of the week that contains `now`, Sunday first, in the phone's local time,
// with the end of each (the next midnight, or `now` for today). Days after today are left out.
export function weekDayRanges(now: Date): { start: Date; end: Date }[] {
  const sunday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
  const ranges: { start: Date; end: Date }[] = [];
  for (let i = 0; i <= now.getDay(); i += 1) {
    const start = new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate() + i);
    const nextMidnight = new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate() + i + 1);
    ranges.push({ start, end: nextMidnight.getTime() > now.getTime() ? now : nextMidnight });
  }
  return ranges;
}

// A whole week (Sunday to Saturday) that ended already, for "last week": seven day ranges starting at `weekStart`.
export function fullWeekRanges(weekStart: Date): { start: Date; end: Date }[] {
  const ranges: { start: Date; end: Date }[] = [];
  for (let i = 0; i < 7; i += 1) {
    ranges.push({
      start: new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + i),
      end: new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + i + 1),
    });
  }
  return ranges;
}

// Only the running sessions, newest first, at most `limit`.
export function runningSessions(sessions: HcSession[], limit: number): HcSession[] {
  return sessions
    .filter((session) => isRunningType(session.exerciseType))
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
    .slice(0, limit);
}

// One run from its session and the distance Health Connect measured inside the session's time window.
export function sessionToRun(session: HcSession, distanceMeters: number, index: number): HealthRun {
  const started = new Date(session.startTime).getTime();
  const ended = new Date(session.endTime).getTime();
  return {
    id: `${started}-${index}`,
    startedAt: new Date(started).toISOString(),
    km: metersToKm(distanceMeters),
    durationSec: Math.max(0, Math.round((ended - started) / 1000)),
  };
}
