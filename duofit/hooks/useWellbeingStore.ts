import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// The weekly screen time the member types in from the phone's Settings (no app may read it automatically).
// Kept on this phone only, one number per week, under the week's key (see weekKey in lib/wellbeing.ts).
const MAX_WEEKS = 60;

interface WellbeingState {
  screenTimeHours: Record<string, number>;
  setScreenTime: (week: string, hours: number) => void;
}

export const useWellbeingStore = create<WellbeingState>()(
  persist(
    (set, get) => ({
      screenTimeHours: {},
      setScreenTime: (week, hours) => {
        const next = { ...get().screenTimeHours, [week]: Math.round(hours * 10) / 10 };
        const keys = Object.keys(next).sort();
        for (const key of keys.slice(0, Math.max(0, keys.length - MAX_WEEKS))) delete next[key];
        set({ screenTimeHours: next });
      },
    }),
    { name: 'duofit-wellbeing', storage: createJSONStorage(() => AsyncStorage) }
  )
);
