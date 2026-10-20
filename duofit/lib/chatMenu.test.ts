import test from 'node:test';
import assert from 'node:assert/strict';
import { messageMenuKind } from './chatMenu.ts';

test('messageMenuKind: only another member\'s text message in a real chat opens the report / block menu', () => {
  assert.equal(messageMenuKind({ demo: false, isGroup: true, fromMe: false }), 'group');
  assert.equal(messageMenuKind({ demo: false, isGroup: false, fromMe: false }), 'direct');
});

test('messageMenuKind: never for my own message, and never in demo mode (the invented partner is not a real member)', () => {
  assert.equal(messageMenuKind({ demo: false, isGroup: true, fromMe: true }), null);
  assert.equal(messageMenuKind({ demo: false, isGroup: false, fromMe: true }), null);
  assert.equal(messageMenuKind({ demo: true, isGroup: true, fromMe: false }), null);
  assert.equal(messageMenuKind({ demo: true, isGroup: false, fromMe: false }), null);
});
