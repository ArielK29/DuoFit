import test from 'node:test';
import assert from 'node:assert/strict';
import { addRunPoint, emptyRunProgress, type RunPoint } from './runTracker.ts';

// Tel Aviv, walking north: 0.0001 degrees of latitude is about 11.1 m.
const at = (step: number, seconds: number, accuracy = 5): RunPoint => ({
  latitude: 32.08 + step * 0.0001,
  longitude: 34.78,
  timestampMs: 1_000_000 + seconds * 1000,
  accuracy,
});

test('addRunPoint: the first good point only becomes the starting point', () => {
  const next = addRunPoint(emptyRunProgress(), at(0, 0));
  assert.equal(next.distanceMeters, 0);
  assert.ok(next.last);
});

test('addRunPoint: distance adds up along the way', () => {
  let progress = emptyRunProgress();
  for (let i = 0; i <= 10; i++) progress = addRunPoint(progress, at(i, i * 4)); // 11 m every 4 s, about 2.8 m/s
  assert.ok(progress.distanceMeters > 108 && progress.distanceMeters < 114, String(progress.distanceMeters));
});

test('addRunPoint: a point with a poor GPS fix is ignored', () => {
  let progress = addRunPoint(emptyRunProgress(), at(0, 0));
  progress = addRunPoint(progress, at(5, 10, 80));
  assert.equal(progress.distanceMeters, 0);
});

test('addRunPoint: a jump faster than a person can run (GPS glitch) is ignored', () => {
  let progress = addRunPoint(emptyRunProgress(), at(0, 0));
  progress = addRunPoint(progress, at(500, 5)); // 55 km in 5 seconds
  assert.equal(progress.distanceMeters, 0);
  progress = addRunPoint(progress, at(1, 8)); // the real next point still counts from the last good one
  assert.ok(progress.distanceMeters > 9 && progress.distanceMeters < 13, String(progress.distanceMeters));
});

test('addRunPoint: standing still (GPS jitter of a few metres) adds nothing, but slow steps still add up', () => {
  let progress = addRunPoint(emptyRunProgress(), at(0, 0));
  for (let i = 1; i <= 20; i++) progress = addRunPoint(progress, { ...at(0, i * 2), latitude: 32.08 + (i % 2) * 0.00001 });
  assert.equal(progress.distanceMeters, 0);
  progress = addRunPoint(progress, at(3, 60));
  assert.ok(progress.distanceMeters > 30, String(progress.distanceMeters));
});

test('addRunPoint: a point that is not later than the last one is ignored', () => {
  let progress = addRunPoint(emptyRunProgress(), at(0, 10));
  progress = addRunPoint(progress, at(3, 10));
  progress = addRunPoint(progress, at(3, 5));
  assert.equal(progress.distanceMeters, 0);
});
