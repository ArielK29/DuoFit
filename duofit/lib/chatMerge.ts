import type { Conversation } from '@hooks/useChatStore';

// A one-to-one chat with a member the signed-in member blocked must not exist on this phone. Groups are never blocked here (a group id
// starts with "group-", see GROUP_PREFIX in remoteGroups.ts and is managed by the group store). A block list that is not known (null or undefined) blocks nothing.
export function isChatBlocked(partnerId: string, blockedIds: string[] | null | undefined): boolean {
  if (partnerId.startsWith('group-')) return false;
  return Boolean(blockedIds && blockedIds.includes(partnerId));
}

// While the server's list of chats is merged with the phone's copy, a chat that the server does NOT return stays only if it is new on
// this phone (nothing saved yet, or only messages still being sent) or a group. A chat that had saved messages and is no longer
// returned is gone for a reason (a block hides the one-to-one chat from both sides): showing it from the phone's old copy would keep a
// blocked person in the list. An empty chat with a blocked member (the row left behind when the chat screen was closed by the block)
// goes too.
export function keepLocalOnlyChat(
  conversation: Pick<Conversation, 'partnerId' | 'isGroup' | 'messages'>,
  blockedIds?: string[] | null
): boolean {
  if (conversation.isGroup) return true;
  if (isChatBlocked(conversation.partnerId, blockedIds)) return false;
  return conversation.messages.every((message) => message.pending === true);
}

// The same rule for a map keyed by the other member's id (the chat rows are built from the saved conversations and from the scheduled
// workouts; a workout with a blocked member must not bring the chat row back).
export function omitBlockedChats<T>(byPartnerId: Record<string, T>, blockedIds: string[] | null | undefined): Record<string, T> {
  if (!blockedIds || blockedIds.length === 0) return byPartnerId;
  return Object.fromEntries(Object.entries(byPartnerId).filter(([partnerId]) => !isChatBlocked(partnerId, blockedIds)));
}
