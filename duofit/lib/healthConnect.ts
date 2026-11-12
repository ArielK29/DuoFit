import { Platform } from 'react-native';
import { buildWeekSteps, metersToKm, weekTotal } from '@lib/healthData';
import { fullWeekRanges, runningSessions, sessionToRun, weekDayRanges, type HcSession } from './healthConnectMap';
import type { HealthSnapshot } from '@lib/healthKit';

// Android side of the health numbers: Health Connect (Google's counterpart of Apple Health). It gives the same
// HealthSnapshot as lib/healthKit.ts, so the Home and Progress screens do not know which phone they run on.
// Android only, and only in a real build: Expo Go, the iPhone and the web end up in "not available". The library is
// loaded on demand so that a phone without the native module never crashes at start-up.
//
// Privacy: everything is read on the phone and shown on the phone. Nothing from Health Connect is sent to our server
// or to any other service, and the app only asks to READ (steps, active calories, distance, exercise sessions).

type HealthConnectModule = typeof import('react-native-health-connect');

const RUN_HISTORY_DAYS = 60;
const MAX_RUNS = 30;

let cached: HealthConnectModule | null | undefined;

function loadModule(): HealthConnectModule | null {
  if (Platform.OS !== 'android') return null;
  if (cached !== undefined) return cached;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cached = require('react-native-health-connect') as HealthConnectModule;
  } catch {
    cached = null;
  }
  return cached;
}

// Health Connect is built into Android 14 and later; on older phones it is a separate app from Google Play. "Update
// required" still counts as available here: the connect card is shown, and a failed connect tells the member what to do.
export async function isHealthConnectAvailable(): Promise<boolean> {
  const hc = loadModule();
  if (!hc) return false;
  try {
    const status = await hc.getSdkStatus();
    return status === hc.SdkAvailabilityStatus.SDK_AVAILABLE || status === hc.SdkAvailabilityStatus.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED;
  } catch {
    return false;
  }
}

// Shows the system permission screen the first time. True when at least the steps were allowed.
export async function requestHealthConnectAccess(): Promise<boolean> {
  const hc = loadModule();
  if (!hc) return false;
  try {
    if (!(await hc.initialize())) return false;
    const granted = await hc.requestPermission([
      { accessType: 'read', recordType: 'Steps' },
      { accessType: 'read', recordType: 'ActiveCaloriesBurned' },
      { accessType: 'read', recordType: 'Distance' },
      { accessType: 'read', recordType: 'ExerciseSession' },
    ]);
    return granted.some((permission) => 'recordType' in permission && permission.recordType === 'Steps');
  } catch {
    return false;
  }
}

function between(start: Date, end: Date) {
  return { operator: 'between' as const, startTime: start.toISOString(), endTime: end.toISOString() };
}

// Reads this week's steps, today's active calories, the month's distance and the latest running sessions.
// Call requestHealthConnectAccess() first.
export async function readHealthConnectSnapshot(now: Date = new Date()): Promise<HealthSnapshot> {
  const hc = loadModule();
  if (!hc) throw new Error('health-unavailable');
  if (!(await hc.initialize())) throw new Error('health-unavailable');

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const lastWeekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() - 7);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const historyStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - RUN_HISTORY_DAYS);

  // One call per day (not a "group by day" call) so that every day is exactly midnight to midnight in the phone's time zone.
  const stepsOf = async (start: Date, end: Date): Promise<number> => {
    const result = await hc.aggregateRecord({ recordType: 'Steps', timeRangeFilter: between(start, end) });
    return result.COUNT_TOTAL ?? 0;
  };
  const metersOf = async (start: Date, end: Date): Promise<number> => {
    const result = await hc.aggregateRecord({ recordType: 'Distance', timeRangeFilter: between(start, end) });
    return result.DISTANCE?.inMeters ?? 0;
  };
  const kcalOf = async (start: Date, end: Date): Promise<number> => {
    const result = await hc.aggregateRecord({ recordType: 'ActiveCaloriesBurned', timeRangeFilter: between(start, end) });
    return result.ACTIVE_CALORIES_TOTAL?.inKilocalories ?? 0;
  };

  const thisWeek = await Promise.all(
    weekDayRanges(now).map(async (range) => ({ date: range.start, steps: await stepsOf(range.start, range.end) }))
  );
  const weekSteps = buildWeekSteps(thisWeek, now);

  // Everything below is extra: a failure in one part must not hide the numbers above.
  const lastWeekDays = await Promise.all(
    fullWeekRanges(lastWeekStart).map(async (range) => ({ date: range.start, steps: await stepsOf(range.start, range.end).catch(() => 0) }))
  ).catch(() => null);
  let lastWeekSameDays: number | undefined;
  let lastWeekTotal: number | undefined;
  if (lastWeekDays) {
    const lastWeekSteps = buildWeekSteps(lastWeekDays, new Date(lastWeekStart.getFullYear(), lastWeekStart.getMonth(), lastWeekStart.getDate() + 6));
    const sameDayLastWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
    lastWeekSameDays = weekTotal(lastWeekSteps, sameDayLastWeek);
    lastWeekTotal = lastWeekSteps.reduce((sum, value) => sum + value, 0);
  }

  const todayKcal = await kcalOf(today, now).catch(() => 0);
  const monthMeters = await metersOf(monthStart, now).catch(() => 0);

  // Walking + running distance of today in 5-minute pieces (km), oldest first.
  const pieces = await hc
    .aggregateGroupByDuration({
      recordType: 'Distance',
      timeRangeFilter: between(today, now),
      timeRangeSlicer: { duration: 'MINUTES', length: 5 },
    })
    .catch(() => []);
  const distanceFiveMinKm = pieces.map((piece) => (piece.result?.DISTANCE?.inMeters ?? 0) / 1000);

  // Running sessions of the last 60 days (any app or watch that writes to Health Connect), and the energy of today's sessions.
  const sessionRecords = await hc
    .readRecords('ExerciseSession', { timeRangeFilter: between(historyStart, now), ascendingOrder: false, pageSize: 200 })
    .then((response) => response.records)
    .catch(() => []);
  const sessions: HcSession[] = sessionRecords.map((record) => ({
    startTime: record.startTime,
    endTime: record.endTime,
    exerciseType: record.exerciseType,
  }));

  const runs = await Promise.all(
    runningSessions(sessions, MAX_RUNS).map(async (session, index) =>
      sessionToRun(session, await metersOf(new Date(session.startTime), new Date(session.endTime)).catch(() => 0), index)
    )
  );

  const todaySessions = sessions.filter((session) => new Date(session.startTime).getTime() >= today.getTime());
  const workoutParts = await Promise.all(
    todaySessions.map((session) => kcalOf(new Date(session.startTime), new Date(session.endTime)).catch(() => 0))
  );
  const workoutKcalToday = workoutParts.reduce((sum, value) => sum + value, 0);

  return {
    weekSteps,
    lastWeekSameDays,
    lastWeekTotal,
    todaySteps: weekSteps[now.getDay()] ?? 0,
    todayKcal: Math.round(todayKcal),
    workoutKcalToday: Math.round(workoutKcalToday),
    distanceFiveMinKm,
    runs,
    monthKm: metersToKm(monthMeters),
    readAt: now.toISOString(),
  };
}
