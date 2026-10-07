import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useAuth } from '@hooks/useAuth';
import { hydrateNotifications } from '@lib/hydrateNotifications';
import { subscribeNotifications } from '@lib/remoteNotifications';
import { DEMO_DATA } from '@lib/demo';

// Keeps the in-app notification list in step with the server while a member is signed in: loads
// when connected, when a new one arrives and when the app returns to the foreground.
export function NotificationSync() {
  const userId = useAuth((state) => state.user?.id);

  useEffect(() => {
    if (DEMO_DATA || !userId) return;
    const stop = subscribeNotifications(userId, { onInsert: hydrateNotifications, onSubscribed: hydrateNotifications });
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') hydrateNotifications();
    });
    return () => {
      stop();
      appState.remove();
    };
  }, [userId]);

  return null;
}
