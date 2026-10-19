import test from 'node:test';
import assert from 'node:assert/strict';
import { initialConnectivity, nextConnectivity, probeReachable, probeDelayMs, OFFLINE_AFTER_FAILURES } from './connectivity.ts';

test('nextConnectivity: one failed check is not enough to say "offline" (a single slow answer must not flash the banner)', () => {
  const after = nextConnectivity(initialConnectivity, false);
  assert.equal(after.online, true);
  assert.equal(after.failures, 1);
});

test('nextConnectivity: offline only after OFFLINE_AFTER_FAILURES failures in a row', () => {
  let state = initialConnectivity;
  for (let i = 0; i < OFFLINE_AFTER_FAILURES; i++) state = nextConnectivity(state, false);
  assert.equal(state.online, false);
});

test('nextConnectivity: one success brings the member back online and resets the count', () => {
  let state = initialConnectivity;
  for (let i = 0; i < OFFLINE_AFTER_FAILURES + 2; i++) state = nextConnectivity(state, false);
  state = nextConnectivity(state, true);
  assert.deepEqual(state, { online: true, failures: 0 });
  // after the reset it takes the full number of failures again
  assert.equal(nextConnectivity(state, false).online, true);
});

test('probeReachable: any HTTP answer, even an error status, means the server is reachable', async () => {
  for (const status of [200, 401, 404, 500]) {
    assert.equal(await probeReachable(async () => ({ status }), 1000), true);
  }
});

test('probeReachable: a network failure or a too slow answer means not reachable', async () => {
  assert.equal(await probeReachable(async () => { throw new TypeError('Network request failed'); }, 1000), false);
  assert.equal(await probeReachable(() => new Promise(() => {}), 20), false);
});

test('probeDelayMs: gentle while online and fine; quick while offline or while a failure is being confirmed', () => {
  assert.equal(probeDelayMs({ online: true, failures: 0 }), 30000);
  assert.equal(probeDelayMs({ online: true, failures: 1 }), 5000);
  assert.equal(probeDelayMs({ online: false, failures: 2 }), 5000);
});
