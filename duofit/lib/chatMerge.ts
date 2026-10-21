import type { Conversation } from '@hooks/useChatStore';

// While the server's list of chats is merged with the phone's copy, a chat that the server does NOT return stays only if it is new on
// this phone (nothing saved yet, or only messages still being sent) or a group. A chat that had saved messages and is no longer
// returned is gone for a reason (a block hides the one-to-one chat from both sides): showing it from the phone's old copy would keep a
// blocked person in the list.
export function keepLocalOnlyChat(conversation: Pick<Conversation, 'isGroup' | 'messages'>): boolean {
  if (conversation.isGroup) return true;
  return conversation.messages.every((message) => message.pending === true);
}
