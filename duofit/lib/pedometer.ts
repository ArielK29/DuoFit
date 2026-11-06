import { Platform } from 'react-native';

// Live step count from the phone's motion sensor (iOS Core Motion). Apple Health only receives steps in batches, so on
// its own the number on the screen would trail behind by minutes; the sensor is read in parallel and the higher one is shown.
// The count is read and shown on the phone only; nothing is sent anywhere. Returns null when the sensor is not
// available (Android, web, Expo Go, the member refused the Motion & Fitness question).
type PedometerModule = typeof import('expo-sensors').Pedometer;

let cached: PedometerModule | null | undefined;
// Once the member has allowed the sensor, the answer is kept so a read every second does not ask the phone again.
let allowed = false;

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

async function ready(pedometer: PedometerModule): Promise<boolean> {
  if (allowed) return true;
  if (!(await pedometer.isAvailableAsync())) return false;
  const permission = await pedometer.requestPermissionsAsync();
  allowed = permission.granted;
  return allowed;
}

export async function readSensorSteps(now: Date = new Date()): Promise<number | null> {
  const pedometer = loadPedometer();
  if (!pedometer) return null;
  try {
    if (!(await ready(pedometer))) return null;
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const result = await pedometer.getStepCountAsync(startOfDay, now);
    return result.steps;
  } catch {
    return null;
  }
}

// Steps as they happen: the count of today so far, then an update on every few steps while the screen is open. The
// starting total is read first and the live count since then is added to it. Returns a function that stops the updates.
export async function watchSensorSteps(onSteps: (todaySteps: number) => void): Promise<() => void> {
  const pedometer = loadPedometer();
  if (!pedometer) return () => {};
  try {
    if (!(await ready(pedometer))) return () => {};
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const base = (await pedometer.getStepCountAsync(startOfDay, now)).steps;
    onSteps(base);
    const subscription = pedometer.watchStepCount((result) => onSteps(base + result.steps));
    return () => subscription.remove();
  } catch {
    return () => {};
  }
}
