import { Platform } from 'react-native';

// Raw accelerometer samples (in g) for the instant step count, see lib/stepDetector.ts. Read on the phone only, never sent
// anywhere. Does nothing where the sensor is missing (Android build today, web, Expo Go without the module).
const SAMPLE_INTERVAL_MS = 40;

export function watchAccelerometer(onSample: (x: number, y: number, z: number, timeMs: number) => void): () => void {
  if (Platform.OS !== 'ios') return () => {};
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Accelerometer } = require('expo-sensors') as typeof import('expo-sensors');
    Accelerometer.setUpdateInterval(SAMPLE_INTERVAL_MS);
    const subscription = Accelerometer.addListener(({ x, y, z }) => onSample(x, y, z, Date.now()));
    return () => subscription.remove();
  } catch {
    return () => {};
  }
}
