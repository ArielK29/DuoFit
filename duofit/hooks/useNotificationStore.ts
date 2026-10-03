import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type NotificationKind = 'workout_soon' | 'goal_reached' | 'message';

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  createdAt: string; // ISO
  read: boolean;
  // Where tapping the notification goes.
  href?: string;
  params?: Record<string, string>;
  // Prevents the same event (e.g. "workout X starts soon") from being added twice.
  dedupeKey?: string;
}

const MAX_ITEMS = 100;

interface NotificationState {
  items: AppNotification[];

  add: (notification: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  clear: () => void;
}

// In-app notification center. Notifications are created by real events on this
// device (an upcoming workout, a reached goal, a new message). When a backend
// exists, events from other people will be inserted through the same `add`.
export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      items: [],

      add: (notification) => {
        const { items } = get();
        if (notification.dedupeKey && items.some((item) => item.dedupeKey === notification.dedupeKey)) return;

        const now = new Date();
        const created: AppNotification = {
          ...notification,
          id: `n-${now.getTime()}-${items.length}`,
          createdAt: now.toISOString(),
          read: false,
        };
        set({ items: [created, ...items].slice(0, MAX_ITEMS) });
      },

      markRead: (id) => set({ items: get().items.map((item) => (item.id === id ? { ...item, read: true } : item)) }),
      markAllRead: () => set({ items: get().items.map((item) => ({ ...item, read: true })) }),
      clear: () => set({ items: [] }),
    }),
    {
      name: 'duofit-notifications',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export function selectUnreadCount(state: NotificationState): number {
  return state.items.filter((item) => !item.read).length;
}
