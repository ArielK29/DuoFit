import { Platform } from 'react-native';

// Live step count from the phone's motion sensor (iOS Core Motion). Apple Health only receives steps in batches, so on
// its own the number on the screen would trail behind by minutes; the sensor is read in parallel and the higher one is shown.
// The count is read and shown on the phone only; nothing is sent anywhere. Returns null when the sensor is not
// available (Android, web, Expo Go, the member refused the Motion & Fitness question).
type PedometerModule = typeof import('expo-sensors').Pedometer;

let cached: PedometerModule | null | undefined;

function loadPedometer(): PedometerModule | null {
  if (Platform.OS !== 'ios') return null;
  if (cached !== undefined) return cached;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cached = (require('expo-sensors') as typeof import('expo-sensors')).Pedometer;
  } catch {
    cached = null;
  }
  return cached;
}

export async function readSensorSteps(now: Date = new Date()): Promise<number | null> {
  const pedometer = loadPedometer();
  if (!pedometer) return null;
  try {
    if (!(await pedometer.isAvailableAsync())) return null;
    const permission = await pedometer.requestPermissionsAsync();
    if (!permission.granted) return null;
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const result = await pedometer.getStepCountAsync(startOfDay, now);
    return result.steps;
  } catch {
    return null;
  }
}
