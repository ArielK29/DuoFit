// Example numbers only — steps/calories/running need Health Connect
// (Android) / HealthKit (iOS), which aren't available in Expo Go. Replace
// with real sensor data once the app moves to a development build.
export const MOCK_HEALTH = {
  steps: 8432,
  stepsGoal: 10000,
  calories: 2140,
  caloriesGoal: 2600,
  runKm: 17.2,
  runKmGoal: 25,
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
  { daysAgo: 4, km: 4, duration: '21:05', pace: '5:16', company: 'עם שיר ועוד 6' },
  { daysAgo: 7, km: 8, duration: '43:30', pace: '5:26', company: 'עם נועה' },
];
