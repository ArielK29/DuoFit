import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ScheduledWorkout {
  id: string;
  partnerId: string;
  partnerName: string;
  activity: string;
  scheduledAt: string; // ISO
  location: string;
  checkedIn: boolean;
}

interface WorkoutState {
  scheduledWorkouts: ScheduledWorkout[];

  scheduleWorkout: (workout: Omit<ScheduledWorkout, 'id' | 'checkedIn'>) => ScheduledWorkout;
  checkIn: (id: string) => void;
  cancelWorkout: (id: string) => void;
}

export const useWorkoutStore = create<WorkoutState>()(
  persist(
    (set, get) => ({
      scheduledWorkouts: [],

      scheduleWorkout: (workout) => {
        const created: ScheduledWorkout = {
          ...workout,
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          checkedIn: false,
        };
        set({ scheduledWorkouts: [...get().scheduledWorkouts, created] });
        return created;
      },

      checkIn: (id) =>
        set({
          scheduledWorkouts: get().scheduledWorkouts.map((workout) =>
            workout.id === id ? { ...workout, checkedIn: true } : workout
          ),
        }),

      cancelWorkout: (id) =>
        set({
          scheduledWorkouts: get().scheduledWorkouts.filter((workout) => workout.id !== id),
        }),
    }),
    {
      name: 'workout-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
