import { useCallback } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useHealthStore } from '@hooks/useHealthStore';
import type { HealthSnapshot } from '@lib/healthKit';

// 'live'    = real Apple Health numbers.
// 'connect' = this phone has Apple Health but the member did not connect it yet (screens show the connect card).
// 'example' = no Apple Health here (Android, web, Expo Go) or the first read is still running: labelled example numbers.
export type HealthMode = 'live' | 'connect' | 'example';

// While a screen with the numbers is open they are re-read this often (the phone saves steps in batches).
const REFRESH_EVERY_MS = 4000;

export function useHealthData(): {
  mode: HealthMode;
  snapshot: HealthSnapshot | null;
  loading: boolean;
  failed: boolean;
  connect: () => Promise<void>;
} {
  const { connected, available, snapshot, loading, failed } = useHealthStore();

  // Re-read when the screen comes into view, when the app returns from the background, and every few seconds
  // while the screen stays open, so steps taken just now show up without leaving the screen.
  useFocusEffect(
    useCallback(() => {
      const refresh = () => {
        useHealthStore.getState().refresh();
      };
      refresh();
      const timer = setInterval(refresh, REFRESH_EVERY_MS);
      const subscription = AppState.addEventListener('change', (state) => {
        if (state === 'active') refresh();
      });
      return () => {
        clearInterval(timer);
        subscription.remove();
      };
    }, [])
  );

  const mode: HealthMode =
    connected && snapshot ? 'live' : available && !connected ? 'connect' : connected && failed ? 'connect' : 'example';
  return { mode, snapshot, loading, failed, connect: useHealthStore.getState().connect };
}
