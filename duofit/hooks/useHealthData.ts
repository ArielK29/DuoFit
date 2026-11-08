import { useCallback, useEffect, useMemo } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useDayKey } from '@hooks/useDayKey';
import { useHealthStore } from '@hooks/useHealthStore';
import { scheduleWeeklyStepsSummary } from '@lib/notifications';
import { acquireLiveSteps, useLiveSteps } from '@hooks/useLiveSteps';
import type { HealthSnapshot } from '@lib/healthKit';
import { healthMode, isSameDay, type HealthMode } from '@lib/healthMode';
import { mergeTodaySteps } from '@lib/healthData';

export type { HealthMode };

// Apple Health (calories, runs, distance) is re-read this often while a screen with the numbers is open. Steps do not wait for it:
// they come from the motion sensor every second and a half (see hooks/useLiveSteps.ts).
const REFRESH_EVERY_MS = 6000;

export function useHealthData(): {
  mode: HealthMode;
  snapshot: HealthSnapshot | null;
  loading: boolean;
  failed: boolean;
  connect: () => Promise<void>;
} {
  const { hydrated, connected, available, snapshot, loading, failed } = useHealthStore();
  // Draws again at midnight: yesterday's snapshot stops counting as "today" and a new read starts at once.
  const dayKey = useDayKey();
  const fresh = snapshot !== null && isSameDay(snapshot.readAt, new Date()) ? snapshot : null;
  useEffect(() => {
    useHealthStore.getState().refresh();
  }, [dayKey]);

  // Live steps while a connected member has a screen with the numbers open.
  const liveSteps = useLiveSteps((state) => state.steps);
  useEffect(() => {
    if (!connected) return undefined;
    return acquireLiveSteps();
  }, [connected]);

  // A member who follows his steps gets the weekly summary reminder on Saturday night.
  useEffect(() => {
    if (connected) scheduleWeeklyStepsSummary();
  }, [connected]);

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
  // while the screen stays open.
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
