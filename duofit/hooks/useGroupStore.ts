import { create } from 'zustand';
import { useAuth } from '@hooks/useAuth';
import { useChatStore } from '@hooks/useChatStore';
import { notifyFailure } from '@lib/notifyFailure';
import * as api from '@lib/remoteGroups';
import type { RemoteGroup } from '@lib/remoteGroups';

// The real community groups (signed-in members, not the demo data). The directory and the member's
// memberships come from the server; the chat of each joined group is placed in the chat list.

interface GroupState {
  groups: RemoteGroup[];
  joinedIds: string[];
  loaded: boolean;
  loading: boolean;
  loadFailed: boolean;

  load: () => Promise<void>;
  create: (name: string, activity: string) => Promise<boolean>;
  join: (groupId: string) => Promise<void>;
  leave: (groupId: string) => Promise<void>;
  applyRemoteMessage: (row: api.GroupMessageRow) => Promise<void>;
  reportMessage: (messageId: string) => Promise<void>;
  reset: () => void;
}

const me = () => useAuth.getState().user?.id ?? null;
const names = new Map<string, string>(); // member id -> name, learned from loaded messages
let reloadQueued = false;

export const useGroupStore = create<GroupState>()((set, get) => ({
  groups: [],
  joinedIds: [],
  loaded: false,
  loading: false,
  loadFailed: false,

  load: async () => {
    const userId = me();
    if (!userId) return;
    if (get().loading) {
      reloadQueued = true;
      return;
    }
    set({ loading: true });
    try {
      const [groups, joinedIds] = await Promise.all([api.fetchGroups(), api.fetchMyGroupIds(userId)]);
      if (me() !== userId) return; // signed out while loading
      set({ groups, joinedIds, loaded: true, loadFailed: false });

      const chat = useChatStore.getState();
      // Chats of groups the member is no longer in disappear from the chat list.
      Object.keys(chat.conversations)
        .filter((key) => api.isGroupKey(key) && !joinedIds.includes(api.groupIdFromKey(key)))
        .forEach((key) => chat.removeConversation(key));

      await Promise.all(
        groups
          .filter((group) => joinedIds.includes(group.id))
          .map(async (group) => {
            const messages = await api.fetchGroupMessages(group.id);
            messages.forEach((item) => names.set(item.row.sender_id, item.senderName));
            useChatStore.getState().setGroupConversation(
              api.toGroupKey(group.id),
              group.name,
              group.memberCount,
              messages.map((item) => ({
                id: item.row.id,
                senderId: item.row.sender_id === userId ? ('me' as const) : ('partner' as const),
                kind: 'text' as const,
                text: item.row.body,
                sentAt: item.row.created_at,
                ...(item.row.sender_id === userId ? {} : { senderName: item.senderName, senderUserId: item.row.sender_id }),
              }))
            );
          })
      );
    } catch {
      set({ loadFailed: true });
    } finally {
      set({ loading: false });
      if (reloadQueued) {
        reloadQueued = false;
        get().load();
      }
    }
  },

  create: async (name, activity) => {
    try {
      await api.createGroup(name, activity);
    } catch {
      notifyFailure();
      return false;
    }
    await get().load();
    return true;
  },

  join: async (groupId) => {
    try {
      await api.joinGroup(groupId);
    } catch {
      notifyFailure();
      return;
    }
    await get().load();
  },

  leave: async (groupId) => {
    const userId = me();
    if (!userId) return;
    try {
      await api.leaveGroup(groupId, userId);
    } catch {
      notifyFailure();
      return;
    }
    useChatStore.getState().removeConversation(api.toGroupKey(groupId));
    await get().load();
  },

  applyRemoteMessage: async (row) => {
    const userId = me();
    if (!userId || !get().joinedIds.includes(row.group_id)) return;
    const group = get().groups.find((item) => item.id === row.group_id);
    if (!group) return;
    const mine = row.sender_id === userId;
    let senderName = names.get(row.sender_id);
    if (!mine && !senderName) {
      senderName = await api.fetchMemberName(row.sender_id);
      names.set(row.sender_id, senderName);
    }
    useChatStore.getState().applyGroupMessage(api.toGroupKey(row.group_id), group.name, {
      id: row.id,
      senderId: mine ? 'me' : 'partner',
      kind: 'text',
      text: row.body,
      sentAt: row.created_at,
      ...(mine ? {} : { senderName, senderUserId: row.sender_id }),
    });
  },

  // A reported message disappears for the reporter at once (the server hides it for everybody after 3).
  reportMessage: async (messageId) => {
    try {
      await api.reportGroupMessage(messageId);
    } catch {
      notifyFailure();
      return;
    }
    await get().load();
  },

  reset: () => {
    reloadQueued = false;
    names.clear();
    set({ groups: [], joinedIds: [], loaded: false, loading: false, loadFailed: false });
  },
}));
