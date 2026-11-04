import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Whether this phone has shown the three intro screens, and the birth date typed at sign-up (kept on this phone only, only for an
// adult, so the identity check can fill it in and nothing is asked twice). Both are cleared when they are no longer needed.
interface IntroState {
  hydrated: boolean;
  introSeen: boolean;
  birthDraft: { day: string; month: string; year: string } | null;

  markIntroSeen: () => void;
  saveBirthDraft: (draft: { day: string; month: string; year: string }) => void;
  clearBirthDraft: () => void;
}

export const useIntroStore = create<IntroState>()(
  persist(
    (set) => ({
      hydrated: false,
      introSeen: false,
      birthDraft: null,

      markIntroSeen: () => set({ introSeen: true }),
      saveBirthDraft: (draft) => set({ birthDraft: draft }),
      clearBirthDraft: () => set({ birthDraft: null }),
    }),
    {
      name: 'duofit-intro',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ introSeen: state.introSeen, birthDraft: state.birthDraft }),
      onRehydrateStorage: () => () => {
        useIntroStore.setState({ hydrated: true });
      },
    }
  )
);
