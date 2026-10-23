import test from 'node:test';
import assert from 'node:assert/strict';
import { isChatBlocked, keepLocalOnlyChat, omitBlockedChats } from './chatMerge.ts';

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
  assert.equal(keepLocalOnlyChat({ partnerId: 'group-1', partnerName: 'G', isGroup: true, messages: [text('1')] }), true);
});

test('an empty chat with a member the signed-in member blocked never stays (the empty row left behind after a block)', () => {
  assert.equal(keepLocalOnlyChat({ partnerId: 'a', partnerName: 'A', messages: [] }, ['a']), false);
  assert.equal(keepLocalOnlyChat({ partnerId: 'a', partnerName: 'A', messages: [] }, ['b']), true);
  assert.equal(keepLocalOnlyChat({ partnerId: 'a', partnerName: 'A', messages: [] }, null), true);
});

test('isChatBlocked: a one-to-one chat id is blocked when it is in the list, a group never is', () => {
  assert.equal(isChatBlocked('a', ['a', 'b']), true);
  assert.equal(isChatBlocked('c', ['a', 'b']), false);
  assert.equal(isChatBlocked('a', undefined), false);
  assert.equal(isChatBlocked('group-1', ['group-1']), false);
});

test('omitBlockedChats: drops the blocked member from a map of chats (rows built from conversations and from scheduled workouts), keeps groups', () => {
  const map = { a: 1, b: 2, 'group-1': 3 };
  assert.deepEqual(omitBlockedChats(map, ['a', 'group-1']), { b: 2, 'group-1': 3 });
  assert.deepEqual(omitBlockedChats(map, []), map);
  assert.deepEqual(omitBlockedChats(map, null), map);
});
