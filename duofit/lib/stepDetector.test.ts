import test from 'node:test';
import assert from 'node:assert/strict';
import { createStepDetector } from './stepDetector.ts';

const SAMPLE_MS = 40; // 25 samples a second

// A phone carried while walking: gravity (1 g) plus a wave at the step rate.
function simulate(seconds: number, stepsPerSecond: number, amplitudeG: number, noiseG = 0.005): number {
  const detector = createStepDetector();
  let total = 0;
  let seed = 7;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647 - 0.5;
  };
  for (let t = 0; t < seconds * 1000; t += SAMPLE_MS) {
    const wave = amplitudeG * Math.sin(2 * Math.PI * stepsPerSecond * (t / 1000));
    total += detector.feed(0.1 * random(), 0.1 * random(), 1 + wave + noiseG * random(), t);
  }
  return total;
}

test("stepDetector: ten seconds of walking at two steps a second counts about twenty steps", () => {
  const steps = simulate(10, 2, 0.25);
  assert.ok(steps >= 16 && steps <= 22, `counted ${steps}`);
});

test("stepDetector: a slow walk (1.4 steps a second) is counted too", () => {
  const steps = simulate(10, 1.4, 0.25);
  assert.ok(steps >= 10 && steps <= 15, `counted ${steps}`);
});

test("stepDetector: a phone lying still counts nothing", () => {
  assert.equal(simulate(20, 2, 0), 0);
});

test("stepDetector: a slow rocking (one wave every two seconds) is not walking", () => {
  assert.equal(simulate(20, 0.5, 0.5), 0);
});

test("stepDetector: tiny vibrations (a table, a car engine) count nothing", () => {
  assert.equal(simulate(20, 2, 0.02), 0);
});

test("stepDetector: bad samples are ignored", () => {
  const detector = createStepDetector();
  assert.equal(detector.feed(Number.NaN, 0, 1, 0), 0);
  assert.equal(detector.feed(0, 0, 1, Number.NaN), 0);
});
