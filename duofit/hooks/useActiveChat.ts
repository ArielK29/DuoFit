import { create } from 'zustand';

// Which conversation is on screen right now, so a reply that arrives in it does
// not also create an in-app notification.
interface ActiveChatState {
  activeId: string | null;
  setActive: (id: string | null) => void;
}

export const useActiveChat = create<ActiveChatState>()((set) => ({
  activeId: null,
  setActive: (activeId) => set({ activeId }),
}));
