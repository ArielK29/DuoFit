import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useAuth } from '@hooks/useAuth';
import { useGroupStore } from '@hooks/useGroupStore';
import { subscribeGroupMessages } from '@lib/remoteGroups';
import { DEMO_DATA } from '@lib/demo';

// Keeps the member's groups and group chats in step with the server while signed in: loads when
// connected and when the app returns to the foreground, and receives new messages live.
export function GroupSync() {
  const userId = useAuth((state) => state.user?.id);

  useEffect(() => {
    if (DEMO_DATA || !userId) return;
    const { load, applyRemoteMessage } = useGroupStore.getState();
    const stop = subscribeGroupMessages(userId, { onInsert: applyRemoteMessage, onSubscribed: load });
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') useGroupStore.getState().load();
    });
    return () => {
      stop();
      appState.remove();
    };
  }, [userId]);

  return null;
}
