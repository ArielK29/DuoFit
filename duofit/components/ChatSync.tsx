import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useAuth } from '@hooks/useAuth';
import { useChatStore } from '@hooks/useChatStore';
import { subscribeRemoteChat } from '@lib/remoteChat';
import { DEMO_DATA } from '@lib/demo';

// Keeps the chat in step with the server while a member is signed in. It connects to the live
// feed first and loads the conversations once connected (so nothing sent in between is missed),
// and loads again whenever the app returns to the foreground or the connection is restored.
// (Demo mode keeps the invented, on-phone chats and does not talk to the server.)
export function ChatSync() {
  const userId = useAuth((state) => state.user?.id);

  useEffect(() => {
    if (DEMO_DATA || !userId) return;
    const { hydrateRemote, applyRemoteInsert, applyRemoteUpdate } = useChatStore.getState();
    const stop = subscribeRemoteChat(userId, {
      onInsert: applyRemoteInsert,
      onUpdate: applyRemoteUpdate,
      onSubscribed: hydrateRemote,
    });
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') hydrateRemote();
    });
    return () => {
      stop();
      appState.remove();
    };
  }, [userId]);

  return null;
}
