import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { HealthRun } from '@lib/healthData';

// Runs the member recorded with the "start a run" screen. They stay on this phone only (like the Apple Health numbers).
const MAX_RUNS = 200;

interface RunState {
  runs: HealthRun[];
  addRun: (run: HealthRun) => void;
  removeRun: (id: string) => void;
}

export const useRunStore = create<RunState>()(
  persist(
    (set, get) => ({
      runs: [],
      addRun: (run) => set({ runs: [run, ...get().runs].slice(0, MAX_RUNS) }),
      removeRun: (id) => set({ runs: get().runs.filter((run) => run.id !== id) }),
    }),
    { name: 'duofit-runs', storage: createJSONStorage(() => AsyncStorage) }
  )
);
