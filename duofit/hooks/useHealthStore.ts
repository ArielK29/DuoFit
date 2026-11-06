import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isHealthAvailable, readHealthSnapshot, requestHealthAccess, type HealthSnapshot } from '@lib/healthKit';

// Apple Health data for the Home and Progress screens. The numbers stay on this phone (never sent to the server).
// The last numbers read are kept in the phone's storage so the screens show today's numbers the moment the app opens,
// while a fresh read runs underneath; the screens only use them when they were read today.
interface HealthState {
  // The saved settings and last numbers have been loaded from storage (not saved itself).
  hydrated: boolean;
  connected: boolean;
  // null until we asked the phone; false on Android, web, Expo Go.
  available: boolean | null;
  loading: boolean;
  failed: boolean;
  snapshot: HealthSnapshot | null;

  connect: () => Promise<void>;
  refresh: () => Promise<void>;
}

export const useHealthStore = create<HealthState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      connected: false,
      available: null,
      loading: false,
      failed: false,
      snapshot: null,

      refresh: async () => {
        if (get().loading) return;
        set({ loading: true });
        try {
          const available = get().available ?? (await isHealthAvailable());
          if (!available) {
            set({ available: false, loading: false });
            return;
          }
          set({ available: true });
          if (!get().connected) {
            set({ loading: false });
            return;
          }
          // Asking again is silent once the member answered; it also guards against reading before authorization.
          await requestHealthAccess();
          const snapshot = await readHealthSnapshot();
          set({ snapshot, failed: false, loading: false });
        } catch {
          set({ failed: true, loading: false });
        }
      },

      connect: async () => {
        if (get().loading) return;
        set({ loading: true, failed: false });
        try {
          const available = await isHealthAvailable();
          if (!available) {
            set({ available: false, loading: false });
            return;
          }
          const asked = await requestHealthAccess();
          if (!asked) {
            set({ available: true, failed: true, loading: false });
            return;
          }
          const snapshot = await readHealthSnapshot();
          set({ available: true, connected: true, snapshot, loading: false });
        } catch {
          set({ failed: true, loading: false });
        }
      },
    }),
    {
      name: 'duofit-health',
      // Version 2 added workoutKcalToday and distanceFiveMinKm to the snapshot: a snapshot saved by an older build lacks them,
      // so it is dropped (the next read fills it again) while the "connected" choice is kept.
      version: 2,
      migrate: (stored) => {
        const old = (stored ?? {}) as { connected?: boolean };
        return { connected: old.connected === true, snapshot: null };
      },
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ connected: state.connected, snapshot: state.snapshot }),
      onRehydrateStorage: () => () => {
        useHealthStore.setState({ hydrated: true });
      },
    }
  )
);
