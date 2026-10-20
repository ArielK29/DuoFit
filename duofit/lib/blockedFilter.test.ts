import test from 'node:test';
import assert from 'node:assert/strict';
import { withoutBlocked } from './blockedFilter.ts';

const rows = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];

test('withoutBlocked: leaves out exactly the blocked members', () => {
  assert.deepEqual(withoutBlocked(rows, ['b']).map((row) => row.id), ['a', 'c']);
  assert.deepEqual(withoutBlocked(rows, ['a', 'c']).map((row) => row.id), ['b']);
});

test('withoutBlocked: nothing blocked (or an unreadable block list) keeps everyone', () => {
  assert.equal(withoutBlocked(rows, []).length, 3);
  assert.equal(withoutBlocked(rows, null).length, 3);
  assert.equal(withoutBlocked(rows, undefined).length, 3);
});

test('withoutBlocked: an unknown blocked id changes nothing and the input is not modified', () => {
  const copy = [...rows];
  assert.equal(withoutBlocked(rows, ['zzz']).length, 3);
  assert.deepEqual(rows, copy);
});
