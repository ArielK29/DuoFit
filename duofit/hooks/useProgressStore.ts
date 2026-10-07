import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEMO_DATA } from '@lib/demo';
import { newId } from '@lib/uuid';
import { notifyFailure } from '@lib/notifyFailure';
import { insertRemoteWeight, saveRemoteSettings } from '@lib/remoteProgress';

export interface WeightEntry {
  id: string;
  kg: number;
  loggedAt: string; // ISO
  // Shown right away but not yet confirmed by the server (real accounts).
  pending?: boolean;
}

export const MIN_WEEKLY_GOAL = 1;
export const MAX_WEEKLY_GOAL = 7;
export const DEFAULT_WEEKLY_GOAL = 3;
export const EXAMPLE_GOAL_WEIGHT = 76;

interface ProgressState {
  weeklyGoal: number;
  // null until the user sets one; the screen then shows an example goal.
  goalWeight: number | null;
  weightLog: WeightEntry[];

  setWeeklyGoal: (goal: number) => void;
  logWeight: (kg: number, goalKg: number) => void;
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      weeklyGoal: DEFAULT_WEEKLY_GOAL,
      goalWeight: null,
      weightLog: [],

      setWeeklyGoal: (goal) => {
        const previous = get().weeklyGoal;
        const next = Math.min(MAX_WEEKLY_GOAL, Math.max(MIN_WEEKLY_GOAL, Math.round(goal)));
        set({ weeklyGoal: next });
        if (DEMO_DATA) return;
        saveRemoteSettings({ weekly_goal: next }).catch(() => {
          set({ weeklyGoal: previous });
          notifyFailure();
        });
      },

      logWeight: (kg, goalKg) => {
        const now = new Date();
        if (DEMO_DATA) {
          const entry: WeightEntry = { id: `w-${now.getTime()}`, kg, loggedAt: now.toISOString() };
          set({ weightLog: [...get().weightLog, entry], goalWeight: goalKg });
          return;
        }
        // Real account: shown at once (marked pending), then replaced by the saved entry.
        const id = newId();
        const previousGoal = get().goalWeight;
        set({
          weightLog: [...get().weightLog, { id, kg, loggedAt: now.toISOString(), pending: true }],
          goalWeight: goalKg,
        });
        Promise.all([insertRemoteWeight(id, kg), saveRemoteSettings({ goal_weight_kg: goalKg })])
          .then(([saved]) => set({ weightLog: get().weightLog.map((entry) => (entry.id === id ? saved : entry)) }))
          .catch(() => {
            set({ weightLog: get().weightLog.filter((entry) => entry.id !== id), goalWeight: previousGoal });
            notifyFailure();
          });
      },
    }),
    {
      name: 'duofit-progress',
      storage: createJSONStorage(() => AsyncStorage),
      // An entry that is still being saved is not kept on the phone (after a restart it would
      // look saved when it never reached the server).
      partialize: (state) => ({
        weeklyGoal: state.weeklyGoal,
        goalWeight: state.goalWeight,
        weightLog: state.weightLog.filter((entry) => !entry.pending),
      }),
    }
  )
);
