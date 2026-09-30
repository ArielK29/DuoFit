import { useChatStore } from '@hooks/useChatStore';
import { getTotalUnread } from '@lib/chat';

export function useUnreadCount(): number {
  const conversations = useChatStore((state) => state.conversations);
  return getTotalUnread(conversations);
}
