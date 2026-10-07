import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@hooks/useAuth';
import { DEMO_DATA } from '@lib/demo';
import { checkInRemote, fetchWorkouts, CheckInResult } from '@lib/remoteWorkouts';
import { scheduleWorkoutReminder } from '@lib/notifications';

export interface ScheduledWorkout {
  id: string;
  partnerId: string;
  partnerName: string;
  activity: string;
  scheduledAt: string; // ISO
  location: string;
  checkedIn: boolean;
  iAmHost?: boolean; // real members only: whether I sent the invitation
}

interface WorkoutState {
  scheduledWorkouts: ScheduledWorkout[];
  remindedIds: string[]; // workouts that already got a local reminder on this phone

  scheduleWorkout: (workout: Omit<ScheduledWorkout, 'id' | 'checkedIn'>) => ScheduledWorkout;
  checkIn: (id: string) => Promise<CheckInResult>;
  cancelWorkout: (id: string) => void;
  // Real members: loads the shared workouts from the server (the server is the truth).
  hydrate: () => Promise<void>;
}

let hydrating = false;
let hydrateAgain = false;

export const useWorkoutStore = create<WorkoutState>()(
  persist(
    (set, get) => ({
      scheduledWorkouts: [],
      remindedIds: [],

      scheduleWorkout: (workout) => {
        const created: ScheduledWorkout = {
          ...workout,
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          checkedIn: false,
        };
        set({ scheduledWorkouts: [...get().scheduledWorkouts, created] });
        return created;
      },

      checkIn: async (id) => {
        const markLocal = () =>
          set({
            scheduledWorkouts: get().scheduledWorkouts.map((workout) =>
              workout.id === id ? { ...workout, checkedIn: true } : workout
            ),
          });
        if (DEMO_DATA) {
          markLocal();
          return 'ok';
        }
        const workout = get().scheduledWorkouts.find((item) => item.id === id);
        if (!workout) return 'failed';
        const result = await checkInRemote(id, workout.iAmHost ?? false);
        if (result === 'ok') markLocal();
        return result;
      },

      cancelWorkout: (id) =>
        set({
          scheduledWorkouts: get().scheduledWorkouts.filter((workout) => workout.id !== id),
        }),

      hydrate: async () => {
        const me = useAuth.getState().user?.id;
        if (!me) return;
        if (hydrating) {
          hydrateAgain = true;
          return;
        }
        hydrating = true;
        try {
          const workouts = await fetchWorkouts(me);
          if (useAuth.getState().user?.id !== me) return; // signed out while loading
          set({ scheduledWorkouts: workouts });

          // One local reminder per upcoming workout, the first time this phone learns about it.
          const reminded = new Set(get().remindedIds);
          const fresh = workouts.filter((workout) => !reminded.has(workout.id) && new Date(workout.scheduledAt).getTime() > Date.now());
          if (fresh.length > 0) {
            fresh.forEach((workout) => {
              scheduleWorkoutReminder({
                activity: workout.activity,
                partnerName: workout.partnerName,
                scheduledAt: new Date(workout.scheduledAt),
              });
              reminded.add(workout.id);
            });
            set({ remindedIds: [...reminded].slice(-200) });
          }
        } catch {
          // Offline: keep what is on the phone, the next load fixes it.
        } finally {
          hydrating = false;
          if (hydrateAgain) {
            hydrateAgain = false;
            get().hydrate();
          }
        }
      },
    }),
    {
      name: 'workout-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
