import test from 'node:test';
import assert from 'node:assert/strict';
import { keepLocalOnlyChat } from './chatMerge.ts';

const text = (id: string, pending = false) => ({ id, senderId: 'me' as const, sentAt: '2026-10-21T10:00:00Z', kind: 'text' as const, text: 'x', pending });

test('a chat opened on this phone with no message yet stays in the list', () => {
  assert.equal(keepLocalOnlyChat({ partnerId: 'a', partnerName: 'A', messages: [] }), true);
});

test('a chat whose only messages are still being sent stays in the list', () => {
  assert.equal(keepLocalOnlyChat({ partnerId: 'a', partnerName: 'A', messages: [text('1', true)] }), true);
});

test('a chat that had messages saved on the server, but the server no longer returns it (the member blocked, or was blocked by, the other person), leaves the list', () => {
  assert.equal(keepLocalOnlyChat({ partnerId: 'a', partnerName: 'A', messages: [text('1'), text('2', true)] }), false);
});

test('group chats are managed by the group store and are never dropped here', () => {
  assert.equal(keepLocalOnlyChat({ partnerId: 'g:1', partnerName: 'G', isGroup: true, messages: [text('1')] }), true);
});
