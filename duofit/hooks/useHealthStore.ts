import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isHealthAvailable, readHealthSnapshot, requestHealthAccess, type HealthSnapshot } from '@lib/healthKit';

// Apple Health data for the Home and Progress screens. The numbers live only in memory on the
// phone (never saved to disk, never sent to the server); only the "member pressed connect" flag is kept.
interface HealthState {
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
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ connected: state.connected }),
    }
  )
);
