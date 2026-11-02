// Example numbers, shown only where Apple Health is not available (Android, web, Expo Go) or before
// the member connects it. Android would need a Health Connect reader, which is not built yet.

// Daily and monthly targets shown next to the real Apple Health numbers too.
export const HEALTH_GOALS = {
  steps: 10000,
  calories: 2600, // example only (a whole day of burning)
  activeCalories: 500, // the goal for real numbers: calories burned by moving
  runKm: 25,
};

export const MOCK_HEALTH = {
  steps: 8432,
  stepsGoal: HEALTH_GOALS.steps,
  calories: 2140,
  caloriesGoal: HEALTH_GOALS.calories,
  runKm: 17.2,
  runKmGoal: HEALTH_GOALS.runKm,
};

// Example step counts for the days of the week before today (Sunday first).
// Today uses MOCK_HEALTH.steps and later days are empty.
export const MOCK_STEPS_BEFORE_TODAY = [9300, 5200, 10900, 11300, 7800, 9600];

export interface MockRun {
  daysAgo: number;
  km: number;
  duration: string;
  pace: string;
  company: string;
}

export const MOCK_RUNS: MockRun[] = [
  { daysAgo: 2, km: 5.2, duration: '26:40', pace: '5:08', company: 'לבד' },
  { daysAgo: 4, km: 4, duration: '21:05', pace: '5:16', company: 'עם קבוצה' },
  { daysAgo: 7, km: 8, duration: '43:30', pace: '5:26', company: 'עם שותף' },
];
