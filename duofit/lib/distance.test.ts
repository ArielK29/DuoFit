import test from 'node:test';
import assert from 'node:assert/strict';
import { distanceKm } from './distance.ts';

const TEL_AVIV = { latitude: 32.0809, longitude: 34.7806 };
const JERUSALEM = { latitude: 31.7683, longitude: 35.2137 };

test('distanceKm: the same point is zero', () => {
  assert.equal(distanceKm(TEL_AVIV, TEL_AVIV), 0);
});

test('distanceKm: Tel Aviv to Jerusalem is about 54 km, the same in both directions', () => {
  const there = distanceKm(TEL_AVIV, JERUSALEM);
  assert.ok(there > 52 && there < 56, String(there));
  assert.equal(distanceKm(JERUSALEM, TEL_AVIV), there);
});

test('distanceKm: one degree of latitude is about 111.2 km, and longitude shrinks away from the equator', () => {
  const lat = distanceKm({ latitude: 0, longitude: 0 }, { latitude: 1, longitude: 0 });
  assert.ok(Math.abs(lat - 111.19) < 0.05, String(lat));
  const lonEquator = distanceKm({ latitude: 0, longitude: 0 }, { latitude: 0, longitude: 1 });
  const lonAt32 = distanceKm({ latitude: 32, longitude: 0 }, { latitude: 32, longitude: 1 });
  assert.ok(Math.abs(lonEquator - 111.19) < 0.05);
  assert.ok(lonAt32 < lonEquator * 0.86 && lonAt32 > lonEquator * 0.84, String(lonAt32));
});

test('distanceKm: opposite sides of the earth are half the circumference', () => {
  const half = distanceKm({ latitude: 0, longitude: 0 }, { latitude: 0, longitude: 180 });
  assert.ok(Math.abs(half - 20015.1) < 1, String(half));
});

test('distanceKm: crossing the date line takes the short way', () => {
  const d = distanceKm({ latitude: 0, longitude: 179.5 }, { latitude: 0, longitude: -179.5 });
  assert.ok(Math.abs(d - 111.19) < 0.05, String(d));
});
