import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useAuth } from '@hooks/useAuth';
import { useWorkoutStore } from '@hooks/useWorkoutStore';
import { DEMO_DATA } from '@lib/demo';

// Loads the member's shared workouts when they sign in and whenever the app comes back to the
// foreground, so both partners see the same list (the chat also asks for a refresh when an
// invitation is accepted).
export function WorkoutSync() {
  const userId = useAuth((state) => state.user?.id);

  useEffect(() => {
    if (DEMO_DATA || !userId) return;
    useWorkoutStore.getState().hydrate();
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') useWorkoutStore.getState().hydrate();
    });
    return () => appState.remove();
  }, [userId]);

  return null;
}
