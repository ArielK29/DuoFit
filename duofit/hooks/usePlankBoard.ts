import { create } from 'zustand';
import { useAuth } from '@hooks/useAuth';
import { fetchPlankBoard, PlankBoard } from '@lib/remotePlank';

// The real weekly plank leaderboard (signed-in members, not the demo data). Kept in memory only.
interface PlankBoardState {
  board: PlankBoard | null;
  load: () => Promise<void>;
  reset: () => void;
}

let loading = false;

export const usePlankBoard = create<PlankBoardState>()((set) => ({
  board: null,

  load: async () => {
    const me = useAuth.getState().user?.id;
    if (!me || loading) return;
    loading = true;
    try {
      const board = await fetchPlankBoard(me);
      if (useAuth.getState().user?.id === me) set({ board });
    } catch {
      // Offline: keep what is shown.
    } finally {
      loading = false;
    }
  },

  reset: () => set({ board: null }),
}));
