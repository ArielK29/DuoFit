import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@hooks/useAuth';
import { DEMO_DATA } from '@lib/demo';
import { clearRemote, markReadRemote } from '@lib/remoteNotifications';

export type NotificationKind = 'workout_soon' | 'goal_reached' | 'message' | 'invite' | 'workout_cancelled' | 'comment';

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
  // Notifications that live on the server (real members) carry the server row id.
  remoteId?: string;
}

const MAX_ITEMS = 100;

interface NotificationState {
  items: AppNotification[];

  add: (notification: Omit<AppNotification, 'id' | 'createdAt' | 'read' | 'remoteId'>) => void;
  // Merges notifications loaded from the server: new ones are added, read state comes from the server.
  mergeRemote: (incoming: Array<Omit<AppNotification, 'id'> & { remoteId: string }>) => void;
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

      mergeRemote: (incoming) => {
        const byRemote = new Map(incoming.map((item) => [item.remoteId, item]));
        const kept = get()
          .items.filter((item) => !item.remoteId || byRemote.has(item.remoteId))
          .map((item) => (item.remoteId ? { ...item, read: byRemote.get(item.remoteId)?.read ?? item.read } : item));
        const known = new Set(kept.map((item) => item.remoteId).filter(Boolean));
        const fresh: AppNotification[] = incoming
          .filter((item) => !known.has(item.remoteId))
          .map((item) => ({ ...item, id: `srv-${item.remoteId}` }));
        const merged = [...fresh, ...kept].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        set({ items: merged.slice(0, MAX_ITEMS) });
      },

      markRead: (id) => {
        const item = get().items.find((entry) => entry.id === id);
        set({ items: get().items.map((entry) => (entry.id === id ? { ...entry, read: true } : entry)) });
        if (!DEMO_DATA && item?.remoteId && !item.read) markReadRemote([item.remoteId]).catch(() => {});
      },
      markAllRead: () => {
        const unreadRemote = get()
          .items.filter((entry) => entry.remoteId && !entry.read)
          .map((entry) => entry.remoteId as string);
        set({ items: get().items.map((entry) => ({ ...entry, read: true })) });
        if (!DEMO_DATA) markReadRemote(unreadRemote).catch(() => {});
      },
      clear: () => {
        set({ items: [] });
        const me = useAuth.getState().user?.id;
        if (!DEMO_DATA && me) clearRemote(me).catch(() => {});
      },
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
