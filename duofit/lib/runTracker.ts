import { distanceKm } from './distance.ts';

// Adds up the distance of a run from GPS points, ignoring the usual GPS mistakes. Pure: no React, no phone APIs.
export interface RunPoint {
  latitude: number;
  longitude: number;
  timestampMs: number;
  // Horizontal accuracy in metres as reported by the phone (smaller is better); null when unknown.
  accuracy: number | null;
}

export interface RunProgress {
  distanceMeters: number;
  last: RunPoint | null;
}

// A fix worse than this is a guess (tall buildings, tunnels).
const MAX_ACCURACY_M = 30;
// Faster than this is not a runner (about 30 km/h): a GPS jump.
const MAX_SPEED_MS = 8.5;
// Moving less than this from the last counted point is GPS jitter while standing still. The point is not counted and not
// kept, so a slow walk still adds up once it has gone far enough.
const MIN_STEP_M = 4;

export function emptyRunProgress(): RunProgress {
  return { distanceMeters: 0, last: null };
}

export function addRunPoint(progress: RunProgress, point: RunPoint): RunProgress {
  if (point.accuracy !== null && point.accuracy > MAX_ACCURACY_M) return progress;
  if (!progress.last) return { distanceMeters: 0, last: point };

  const seconds = (point.timestampMs - progress.last.timestampMs) / 1000;
  if (!(seconds > 0)) return progress;

  const meters = distanceKm(progress.last, point) * 1000;
  if (meters / seconds > MAX_SPEED_MS) return progress;
  if (meters < MIN_STEP_M) return progress;

  return { distanceMeters: progress.distanceMeters + meters, last: point };
}
