import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface WeightEntry {
  id: string;
  kg: number;
  loggedAt: string; // ISO
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

      setWeeklyGoal: (goal) =>
        set({ weeklyGoal: Math.min(MAX_WEEKLY_GOAL, Math.max(MIN_WEEKLY_GOAL, Math.round(goal))) }),

      logWeight: (kg, goalKg) => {
        const now = new Date();
        const entry: WeightEntry = { id: `w-${now.getTime()}`, kg, loggedAt: now.toISOString() };
        set({ weightLog: [...get().weightLog, entry], goalWeight: goalKg });
      },
    }),
    {
      name: 'duofit-progress',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
