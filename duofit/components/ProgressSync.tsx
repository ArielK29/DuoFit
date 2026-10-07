import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useAuth } from '@hooks/useAuth';
import { hydrateProgress } from '@lib/hydrateProgress';
import { DEMO_DATA } from '@lib/demo';

// Loads the member's saved progress (weight log, goals, plank record) when they sign in and
// whenever the app comes back to the foreground, so every phone shows the same data.
export function ProgressSync() {
  const userId = useAuth((state) => state.user?.id);

  useEffect(() => {
    if (DEMO_DATA || !userId) return;
    hydrateProgress();
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') hydrateProgress();
    });
    return () => appState.remove();
  }, [userId]);

  return null;
}
