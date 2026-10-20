import test from 'node:test';
import assert from 'node:assert/strict';
import { createLinkStore } from './linkStore.ts';

test('the store keeps the latest link and starts empty', () => {
  const store = createLinkStore();
  assert.equal(store.get(), null);
  store.set('duofit://reset-password#a=1');
  assert.equal(store.get(), 'duofit://reset-password#a=1');
  store.set('duofit://auth-confirmed#b=2');
  assert.equal(store.get(), 'duofit://auth-confirmed#b=2');
});

test('a link that arrived BEFORE a screen existed is still there when the screen asks (the bug on a phone that was already running)', () => {
  const store = createLinkStore();
  store.set('exp://h/--/reset-password#access_token=x');
  const seenLater: Array<string | null> = [];
  store.subscribe(() => seenLater.push(store.get()));
  assert.equal(store.get(), 'exp://h/--/reset-password#access_token=x');
  assert.deepEqual(seenLater, []);
});

test('subscribers are told about a new link, not about the same link twice, and can unsubscribe', () => {
  const store = createLinkStore();
  const calls: Array<string | null> = [];
  const off = store.subscribe(() => calls.push(store.get()));
  store.set('a');
  store.set('a');
  store.set('b');
  off();
  store.set('c');
  assert.deepEqual(calls, ['a', 'b']);
});

test('empty or non-text values are ignored, and clear() empties the store and tells subscribers once', () => {
  const store = createLinkStore();
  store.set('');
  store.set(null as unknown as string);
  assert.equal(store.get(), null);
  store.set('a');
  const calls: Array<string | null> = [];
  store.subscribe(() => calls.push(store.get()));
  store.clear();
  store.clear();
  assert.equal(store.get(), null);
  assert.deepEqual(calls, [null]);
});
