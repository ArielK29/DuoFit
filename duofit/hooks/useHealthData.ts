import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useHealthStore } from '@hooks/useHealthStore';
import type { HealthSnapshot } from '@lib/healthKit';
import { healthMode, isSameDay, type HealthMode } from '@lib/healthMode';
import { mergeTodaySteps } from '@lib/healthData';
import { watchSensorSteps } from '@lib/pedometer';
import { useToday } from '@hooks/useToday';

export type { HealthMode };

// While a screen with the numbers is open they are re-read this often (the phone saves steps in batches).
const REFRESH_EVERY_MS = 4000;

export function useHealthData(): {
  mode: HealthMode;
  snapshot: HealthSnapshot | null;
  loading: boolean;
  failed: boolean;
  connect: () => Promise<void>;
} {
  const { hydrated, connected, available, snapshot, loading, failed } = useHealthStore();
  const fresh = snapshot !== null && isSameDay(snapshot.readAt, new Date()) ? snapshot : null;

  // Steps counted live by the phone's motion sensor while a screen with the numbers is open (no waiting for Apple Health).
  const [liveSteps, setLiveSteps] = useState<number | null>(null);
  const dayKey = useToday().toDateString();
  useEffect(() => {
    setLiveSteps(null); // a new day starts from zero
    if (!connected) return undefined;
    let stop: () => void = () => {};
    let cancelled = false;
    watchSensorSteps((steps) => {
      if (!cancelled) setLiveSteps(steps);
    }).then((remove) => {
      if (cancelled) remove();
      else stop = remove;
    });
    return () => {
      cancelled = true;
      stop();
    };
  }, [connected, dayKey]);

  const shown = useMemo(() => {
    if (!fresh) return null;
    const today = new Date().getDay();
    const merged = mergeTodaySteps(fresh.todaySteps, liveSteps);
    if (merged === fresh.todaySteps) return fresh;
    const weekSteps = fresh.weekSteps.slice();
    weekSteps[today] = merged;
    return { ...fresh, todaySteps: merged, weekSteps };
  }, [fresh, liveSteps]);

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

  const mode = healthMode({ hydrated, connected, available, failed, hasFreshSnapshot: fresh !== null });
  return { mode, snapshot: shown, loading, failed, connect: useHealthStore.getState().connect };
}
