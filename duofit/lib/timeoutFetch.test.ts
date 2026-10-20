import test from 'node:test';
import assert from 'node:assert/strict';
import { createTimeoutFetch, timeoutFor } from './timeoutFetch.ts';

const options = { defaultMs: 30, longMs: 120, longPath: /\/(storage|functions)\/v1\// };

// A fetch that never answers, but honours an abort signal like the real one.
const hanging = (_input: string, init?: { signal?: AbortSignal | null }) =>
  new Promise<Response>((_resolve, reject) => {
    init?.signal?.addEventListener('abort', () => reject(new Error('aborted')));
  });

test('timeoutFor: ordinary calls get the short limit, uploads and functions the long one', () => {
  assert.equal(timeoutFor('https://x.supabase.co/rest/v1/posts?select=*', options), 30);
  assert.equal(timeoutFor('https://x.supabase.co/auth/v1/token', options), 30);
  assert.equal(timeoutFor('https://x.supabase.co/storage/v1/object/avatars/a.jpg', options), 120);
  assert.equal(timeoutFor('https://x.supabase.co/functions/v1/delete-account', options), 120);
});

test('createTimeoutFetch: an answer that never comes fails after the limit instead of waiting forever', async () => {
  const wrapped = createTimeoutFetch(hanging as unknown as typeof fetch, options);
  const started = Date.now();
  await assert.rejects(() => wrapped('https://x.supabase.co/rest/v1/posts'), /timed out/i);
  const took = Date.now() - started;
  assert.ok(took >= 25 && took < 110, 'took ' + took);
});

test('createTimeoutFetch: a quick answer passes through untouched', async () => {
  const response = new Response('ok');
  const wrapped = createTimeoutFetch((async () => response) as unknown as typeof fetch, options);
  assert.equal(await wrapped('https://x.supabase.co/rest/v1/posts'), response);
});

test('createTimeoutFetch: the caller can still abort, and that is not reported as a timeout', async () => {
  const wrapped = createTimeoutFetch(hanging as unknown as typeof fetch, options);
  const controller = new AbortController();
  const pending = wrapped('https://x.supabase.co/rest/v1/posts', { signal: controller.signal });
  controller.abort();
  await assert.rejects(() => pending, (error: Error) => !/timed out/i.test(error.message));
});

test('createTimeoutFetch: an upload gets the longer limit (not cut at the short one)', async () => {
  const slowButFine = (async () => { await new Promise((r) => setTimeout(r, 60)); return new Response('uploaded'); }) as unknown as typeof fetch;
  const wrapped = createTimeoutFetch(slowButFine, options);
  assert.equal(await (await wrapped('https://x.supabase.co/storage/v1/object/avatars/a.jpg')).text(), 'uploaded');
  await assert.rejects(() => wrapped('https://x.supabase.co/rest/v1/posts'), /timed out/i);
});

test('createTimeoutFetch: a network error from the base fetch is passed on as it is', async () => {
  const wrapped = createTimeoutFetch((async () => { throw new TypeError('Network request failed'); }) as unknown as typeof fetch, options);
  await assert.rejects(() => wrapped('https://x.supabase.co/rest/v1/posts'), /Network request failed/);
});
