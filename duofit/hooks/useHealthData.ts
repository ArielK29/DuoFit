import { useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { useHealthStore } from '@hooks/useHealthStore';
import type { HealthSnapshot } from '@lib/healthKit';

// 'live'    = real Apple Health numbers.
// 'connect' = this phone has Apple Health but the member did not connect it yet (screens show the connect card).
// 'example' = no Apple Health here (Android, web, Expo Go) or the first read is still running: labelled example numbers.
export type HealthMode = 'live' | 'connect' | 'example';

export function useHealthData(): {
  mode: HealthMode;
  snapshot: HealthSnapshot | null;
  loading: boolean;
  failed: boolean;
  connect: () => Promise<void>;
} {
  const { connected, available, snapshot, loading, failed } = useHealthStore();

  // Re-read every time the screen comes into view so the numbers are fresh after a walk or a run.
  useFocusEffect(
    useCallback(() => {
      useHealthStore.getState().refresh();
    }, [])
  );

  const mode: HealthMode =
    connected && snapshot ? 'live' : available && !connected ? 'connect' : connected && failed ? 'connect' : 'example';
  return { mode, snapshot, loading, failed, connect: useHealthStore.getState().connect };
}
