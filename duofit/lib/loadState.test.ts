import test from 'node:test';
import assert from 'node:assert/strict';
import { createSubmitGuard, listState } from './loadState.ts';

test('listState: shows what is there first, even if a later reload failed', () => {
  assert.equal(listState({ loading: false, loaded: true, failed: false, count: 3 }), 'content');
  assert.equal(listState({ loading: false, loaded: true, failed: true, count: 3 }), 'content');
  assert.equal(listState({ loading: true, loaded: true, failed: false, count: 1 }), 'content');
});

test('listState: first load is "loading", a failed first load is "failed", an answered empty list is "empty"', () => {
  assert.equal(listState({ loading: true, loaded: false, failed: false, count: 0 }), 'loading');
  assert.equal(listState({ loading: false, loaded: false, failed: true, count: 0 }), 'failed');
  assert.equal(listState({ loading: false, loaded: true, failed: false, count: 0 }), 'empty');
});

test('listState: a retry after a failure goes back to "loading", not straight to "failed" or "empty"', () => {
  assert.equal(listState({ loading: true, loaded: false, failed: true, count: 0 }), 'loading');
});

test('listState: before anything started it is "loading", never a false "empty"', () => {
  assert.equal(listState({ loading: false, loaded: false, failed: false, count: 0 }), 'loading');
});

test('createSubmitGuard: a second tap inside the window is ignored, a later one goes through', () => {
  let clock = 1000;
  const guard = createSubmitGuard(2000, () => clock);
  let calls = 0;
  assert.equal(guard(() => calls++), true);
  clock += 10;
  assert.equal(guard(() => calls++), false, 'double tap');
  clock += 1989;
  assert.equal(guard(() => calls++), false, 'still inside 2000 ms of the first');
  clock += 1;
  assert.equal(guard(() => calls++), true, 'window over');
  assert.equal(calls, 2);
});

test('createSubmitGuard: the first tap always works, whatever the clock says', () => {
  const guard = createSubmitGuard(2000, () => 0);
  assert.equal(guard(() => {}), true);
});

test('createSubmitGuard: an action that throws still closes the window, so a retry tap is not a double send', () => {
  const guard = createSubmitGuard(2000, () => 5);
  assert.throws(() => guard(() => { throw new Error('x'); }));
  assert.equal(guard(() => {}), false);
});
