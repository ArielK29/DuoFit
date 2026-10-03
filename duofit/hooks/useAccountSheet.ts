import { create } from 'zustand';

// Open/closed state of the "my account" sheet, so any avatar in the app can open it.
interface AccountSheetState {
  visible: boolean;
  open: () => void;
  close: () => void;
}

export const useAccountSheet = create<AccountSheetState>()((set) => ({
  visible: false,
  open: () => set({ visible: true }),
  close: () => set({ visible: false }),
}));
