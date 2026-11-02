import { Platform } from 'react-native';
import { buildWeekSteps, metersToKm, type HealthRun } from '@lib/healthData';

// Thin wrapper over Apple Health (HealthKit). iOS only, and only in a real build: Expo Go, the
// simulator without Health data, Android and the web all end up in "not available" and the app
// keeps showing its labelled example numbers there. The library is loaded on demand so that a
// phone without the native module never crashes at start-up.
//
// Privacy: everything is read on the phone and shown on the phone. Nothing from Apple Health is
// sent to our server or to any other service.

export interface HealthSnapshot {
  weekSteps: number[]; // Sunday first
  todaySteps: number;
  todayKcal: number;
  runs: HealthRun[]; // running workouts of the last 60 days, any order
  readAt: string; // ISO
}

type HealthKitModule = typeof import('@kingstinct/react-native-healthkit');

const STEPS = 'HKQuantityTypeIdentifierStepCount';
const ACTIVE_ENERGY = 'HKQuantityTypeIdentifierActiveEnergyBurned';
const WORKOUTS = 'HKWorkoutTypeIdentifier';
const RUN_HISTORY_DAYS = 60;

let cached: HealthKitModule | null | undefined;

function loadModule(): HealthKitModule | null {
  if (Platform.OS !== 'ios') return null;
  if (cached !== undefined) return cached;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cached = require('@kingstinct/react-native-healthkit') as HealthKitModule;
  } catch {
    cached = null;
  }
  return cached;
}

export async function isHealthAvailable(): Promise<boolean> {
  const healthKit = loadModule();
  if (!healthKit) return false;
  try {
    return await healthKit.isHealthDataAvailableAsync();
  } catch {
    return false;
  }
}

// Shows the system permission sheet the first time; afterwards it returns at once. Apple never says
// whether the member allowed or refused reading (a privacy rule), so a refusal simply shows zeros.
export async function requestHealthAccess(): Promise<boolean> {
  const healthKit = loadModule();
  if (!healthKit) return false;
  try {
    return await healthKit.requestAuthorization({ toRead: [STEPS, ACTIVE_ENERGY, WORKOUTS] });
  } catch {
    return false;
  }
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function distanceToMeters(quantity: number, unit: string): number {
  if (unit === 'km') return quantity * 1000;
  if (unit === 'mi') return quantity * 1609.344;
  return quantity;
}

// Reads this week's steps, today's active calories and the latest running workouts.
// Call requestHealthAccess() first (reading before authorization can crash the native side).
export async function readHealthSnapshot(now: Date = new Date()): Promise<HealthSnapshot> {
  const healthKit = loadModule();
  if (!healthKit) throw new Error('health-unavailable');

  const today = startOfDay(now);
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
  const historyStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - RUN_HISTORY_DAYS);

  const [stepDays, energyToday, workouts] = await Promise.all([
    healthKit.queryStatisticsCollectionForQuantity(STEPS, ['cumulativeSum'], weekStart, { day: 1 }, {
      filter: { date: { startDate: weekStart, endDate: now } },
      unit: 'count',
    }),
    healthKit.queryStatisticsForQuantity(ACTIVE_ENERGY, ['cumulativeSum'], {
      filter: { date: { startDate: today, endDate: now } },
      unit: 'kcal',
    }),
    healthKit.queryWorkoutSamples({
      filter: {
        workoutActivityType: healthKit.WorkoutActivityType.running,
        date: { startDate: historyStart, endDate: now },
      },
      limit: 100,
      ascending: false,
    }),
  ]);

  const daily = stepDays
    .filter((day) => day.startDate)
    .map((day) => ({ date: day.startDate as Date, steps: day.sumQuantity?.quantity ?? 0 }));
  const weekSteps = buildWeekSteps(daily, now);

  const runs: HealthRun[] = workouts.map((workout, index) => {
    const run: HealthRun = {
      id: `${workout.startDate.getTime()}-${index}`,
      startedAt: workout.startDate.toISOString(),
      km: workout.totalDistance
        ? metersToKm(distanceToMeters(workout.totalDistance.quantity, workout.totalDistance.unit))
        : 0,
      durationSec: Math.round(workout.duration.quantity),
    };
    // The workout object lives in native memory; release it as soon as the numbers are copied.
    workout.dispose();
    return run;
  });

  return {
    weekSteps,
    todaySteps: weekSteps[now.getDay()] ?? 0,
    todayKcal: Math.round(energyToday.sumQuantity?.quantity ?? 0),
    runs,
    readAt: now.toISOString(),
  };
}
