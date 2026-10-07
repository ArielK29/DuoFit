import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useActiveChat } from '@hooks/useActiveChat';
import { useNotificationStore } from '@hooks/useNotificationStore';
import { notifyFailure } from '@lib/notifyFailure';
import { useWorkoutStore } from '@hooks/useWorkoutStore';
import { useAuth } from '@hooks/useAuth';
import { DEMO_DATA } from '@lib/demo';
import { newId } from '@lib/uuid';
import { notifyInviteAnswered } from '@lib/notifications';
import {
  MessageRow,
  conversationIdForPartner,
  answerRemoteInvite,
  ensureRemoteConversation,
  fetchRemoteConversations,
  markRemoteRead,
  partnerIdForConversation,
  sendRemoteInvite,
  sendRemoteText,
  toChatMessage,
} from '@lib/remoteChat';

export interface WorkoutInvite {
  activity: string;
  location: string;
  scheduledAt: string; // ISO
  status: 'pending' | 'accepted' | 'declined';
}

export type ChatMessage =
  | { id: string; senderId: 'me' | 'partner'; sentAt: string; kind: 'text'; text: string; senderName?: string; pending?: boolean }
  | { id: string; senderId: 'me' | 'partner'; sentAt: string; kind: 'invite'; invite: WorkoutInvite; pending?: boolean };

export interface Conversation {
  partnerId: string; // conversation id: a partner id, or a group id
  partnerName: string;
  messages: ChatMessage[];
  lastReadAt?: string; // ISO; partner messages newer than this are unread
  isGroup?: boolean;
  members?: string[]; // first names of the other people in a group
  memberCount?: number;
  verified?: boolean;
  streak?: number; // example streak for seeded conversations
}

export interface ConversationSeed {
  partnerId: string;
  partnerName: string;
  messages: ChatMessage[];
  isGroup?: boolean;
  members?: string[];
  memberCount?: number;
  verified?: boolean;
  streak?: number;
}

interface ChatState {
  conversations: Record<string, Conversation>;
  // Invitations (message ids) whose accepted workout was already added to this phone.
  appliedInvites: string[];

  // Real chat (outside demo mode): load from the server, apply live changes.
  hydrateRemote: () => Promise<void>;
  applyRemoteInsert: (row: MessageRow) => void;
  applyRemoteUpdate: (row: MessageRow) => void;

  ensureConversation: (partnerId: string, partnerName: string) => void;
  openSeeded: (seed: ConversationSeed) => void;
  createGroup: (id: string, name: string, members: string[], memberCount: number) => void;
  removeConversation: (id: string) => void;
  markRead: (partnerId: string) => void;
  sendMessage: (partnerId: string, partnerName: string, text: string) => void;
  sendInvite: (partnerId: string, partnerName: string, invite: Omit<WorkoutInvite, 'status'>) => void;
  respondToInvite: (partnerId: string, messageId: string, accept: boolean) => void;
}

// Canned auto-replies simulating the other side of the conversation — there's
// no real-time backend yet (#15), so this keeps chat demoable without one.
const AUTO_REPLIES = [
  'מעולה, מתאים לי!',
  'סבבה, נדבר על הפרטים בקרוב',
  'האמת שאני קצת עסוק/ה עכשיו, אענה בהמשך',
  'רעיון טוב, בוא נקבע',
];
const GROUP_REPLIES = ['אני בפנים 💪', 'מגיע בזמן', 'מי מביא מים?', 'יאללה, נתראה שם'];
export const AUTO_REPLY_DELAY_MS = 1500;

// The later of two ISO timestamps (a missing one counts as the other).
function laterOf(a?: string, b?: string): string | undefined {
  if (!a) return b;
  if (!b) return a;
  return new Date(a).getTime() >= new Date(b).getTime() ? a : b;
}

function getOrCreateConversation(
  conversations: Record<string, Conversation>,
  partnerId: string,
  partnerName: string
): Conversation {
  return conversations[partnerId] ?? { partnerId, partnerName, messages: [], lastReadAt: new Date().toISOString() };
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => {
      const myId = () => useAuth.getState().user?.id ?? null;
      let hydrating = false;
      const answering = new Set<string>();

      // Adds a message, or replaces the one with the same id (the saved copy replaces the "sending" one).
      const putMessage = (partnerId: string, partnerName: string, message: ChatMessage) => {
        const existing = getOrCreateConversation(get().conversations, partnerId, partnerName);
        const others = existing.messages.filter((item) => item.id !== message.id);
        const messages = [...others, message].sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime());
        set({ conversations: { ...get().conversations, [partnerId]: { ...existing, messages } } });
      };

      const dropMessage = (partnerId: string, messageId: string) => {
        const existing = get().conversations[partnerId];
        if (!existing) return;
        set({
          conversations: {
            ...get().conversations,
            [partnerId]: { ...existing, messages: existing.messages.filter((item) => item.id !== messageId) },
          },
        });
      };

      // An accepted invitation becomes ONE shared workout on the server (the database creates it from the
      // invitation); this phone only has to load it. Handled once per invitation.
      const applyAcceptance = (_partnerId: string, _partnerName: string, messageId: string, _invite: WorkoutInvite) => {
        if (get().appliedInvites.includes(messageId)) return;
        set({ appliedInvites: [...get().appliedInvites, messageId] });
        useWorkoutStore.getState().hydrate();
      };

      const notifyIncoming = (partnerId: string, partnerName: string, message: ChatMessage) => {
        if (useActiveChat.getState().activeId === partnerId) return;
        useNotificationStore.getState().add({
          kind: 'message',
          title: partnerName,
          body: message.kind === 'text' ? message.text : 'הזמנה לאימון',
          href: '/conversation',
          params: { partnerId, partnerName },
        });
      };

      return {
      conversations: {},
      appliedInvites: [],

      // Loads the member's conversations from the server and MERGES them with what is on the
      // phone (messages still being sent are kept; nothing that arrived meanwhile is erased).
      hydrateRemote: async () => {
        const me = myId();
        if (!me || hydrating) return;
        hydrating = true;
        try {
          const remote = await fetchRemoteConversations(me);
          if (myId() !== me) return; // signed out (or switched account) while loading
          const local = get().conversations;
          const merged: Record<string, Conversation> = {};
          // Chats opened on this phone that have no saved message yet stay visible.
          Object.values(local).forEach((conversation) => {
            if (!remote[conversation.partnerId]) merged[conversation.partnerId] = conversation;
          });
          Object.values(remote).forEach((conversation) => {
            const pending = (local[conversation.partnerId]?.messages ?? []).filter(
              (message) => message.pending && !conversation.messages.some((item) => item.id === message.id)
            );
            merged[conversation.partnerId] = {
              ...conversation,
              messages: [...conversation.messages, ...pending],
              lastReadAt: laterOf(conversation.lastReadAt, local[conversation.partnerId]?.lastReadAt),
            };
          });
          set({ conversations: merged });
          // Invitations accepted while this phone was closed still become workouts.
          Object.values(remote).forEach((conversation) =>
            conversation.messages.forEach((message) => {
              if (message.kind === 'invite' && message.invite.status === 'accepted' && message.senderId === 'me') {
                applyAcceptance(conversation.partnerId, conversation.partnerName, message.id, message.invite);
              }
            })
          );
        } catch {
          // Offline or not signed in yet: keep what is on the phone, the next load fixes it.
        } finally {
          hydrating = false;
        }
      },

      applyRemoteInsert: (row) => {
        const me = myId();
        if (!me) return;
        const partnerId = partnerIdForConversation(row.conversation_id);
        if (!partnerId) {
          // A brand-new conversation started by someone else: reload the list, then tell the member.
          get()
            .hydrateRemote()
            .then(() => {
              const known = partnerIdForConversation(row.conversation_id);
              const conversation = known ? get().conversations[known] : undefined;
              if (known && conversation && row.sender_id !== me) notifyIncoming(known, conversation.partnerName, toChatMessage(row, me));
            });
          return;
        }
        const conversation = get().conversations[partnerId];
        const message = toChatMessage(row, me);
        putMessage(partnerId, conversation?.partnerName ?? 'חבר/ה', message);
        if (row.sender_id !== me) {
          notifyIncoming(partnerId, conversation?.partnerName ?? 'חבר/ה', message);
          if (useActiveChat.getState().activeId === partnerId) get().markRead(partnerId);
        }
      },

      applyRemoteUpdate: (row) => {
        const me = myId();
        if (!me || !row.invite) return;
        const partnerId = partnerIdForConversation(row.conversation_id);
        const conversation = partnerId ? get().conversations[partnerId] : undefined;
        if (!partnerId || !conversation) return;
        const invite = row.invite;
        const before = conversation.messages.find((item) => item.id === row.id);
        const wasPending = before?.kind === 'invite' && before.invite.status === 'pending';
        set({
          conversations: {
            ...get().conversations,
            [partnerId]: {
              ...conversation,
              messages: conversation.messages.map((item) =>
                item.id === row.id && item.kind === 'invite' ? { ...item, invite } : item
              ),
            },
          },
        });
        // Only the person who SENT the invitation hears about the answer, and it becomes their workout.
        if (before?.senderId === 'me' && wasPending && (invite.status === 'accepted' || invite.status === 'declined')) {
          notifyInviteAnswered(conversation.partnerName, invite.status === 'accepted');
        }
        if (before?.senderId === 'me' && invite.status === 'accepted') {
          applyAcceptance(partnerId, conversation.partnerName, row.id, invite);
        }
      },

      ensureConversation: (partnerId, partnerName) => {
        // The server conversation is created with the first message, so opening a chat and
        // leaving does not put an empty chat in the other person's inbox.
        if (get().conversations[partnerId]) return;
        set({
          conversations: {
            ...get().conversations,
            [partnerId]: { partnerId, partnerName, messages: [], lastReadAt: new Date().toISOString() },
          },
        });
      },

      // Copies an example conversation from the list into the real store the
      // first time it's opened, so it then behaves like any other chat.
      openSeeded: (seed) => {
        if (get().conversations[seed.partnerId]) return;
        set({
          conversations: {
            ...get().conversations,
            [seed.partnerId]: { ...seed, lastReadAt: new Date().toISOString() },
          },
        });
      },

      createGroup: (id, name, members, memberCount) => {
        if (get().conversations[id]) return;
        const now = new Date().toISOString();
        const welcome: ChatMessage = {
          id: `${id}-welcome`,
          senderId: 'partner',
          kind: 'text',
          text: 'ברוכים הבאים לקבוצה! 🙌',
          senderName: members[0],
          sentAt: now,
        };
        set({
          conversations: {
            ...get().conversations,
            [id]: {
              partnerId: id,
              partnerName: name,
              isGroup: true,
              members,
              memberCount,
              messages: [welcome],
              lastReadAt: now,
            },
          },
        });
      },

      removeConversation: (id) => {
        const rest = { ...get().conversations };
        delete rest[id];
        set({ conversations: rest });
      },

      markRead: (partnerId) => {
        const conversation = get().conversations[partnerId];
        if (!conversation) return;
        if (!DEMO_DATA) {
          const me = myId();
          const conversationId = conversationIdForPartner(partnerId);
          if (me && conversationId) markRemoteRead(conversationId, me).catch(() => {});
        }
        // The server clock is the reference for "unread", so the marker moves to the newest message.
        const newest = conversation.messages.length > 0 ? conversation.messages[conversation.messages.length - 1].sentAt : undefined;
        const readAt = !DEMO_DATA && newest ? laterOf(newest, conversation.lastReadAt) : new Date().toISOString();
        set({
          conversations: {
            ...get().conversations,
            [partnerId]: { ...conversation, lastReadAt: readAt },
          },
        });
      },

      sendMessage: (partnerId, partnerName, text) => {
        if (!DEMO_DATA) {
          const me = myId();
          if (!me) return;
          // Shown at once (marked "sending"), then replaced by the saved message. Nobody answers for the other person.
          const id = newId();
          putMessage(partnerId, partnerName, { id, senderId: 'me', kind: 'text', text, sentAt: new Date().toISOString(), pending: true });
          ensureRemoteConversation(me, partnerId)
            .then((cid) => sendRemoteText(cid, id, text))
            .then((row) => putMessage(partnerId, partnerName, toChatMessage(row, me)))
            .catch(() => {
              dropMessage(partnerId, id);
              notifyFailure();
            });
          return;
        }
        const existing = getOrCreateConversation(get().conversations, partnerId, partnerName);
        const myMessage: ChatMessage = {
          id: `${Date.now()}`,
          senderId: 'me',
          kind: 'text',
          text,
          sentAt: new Date().toISOString(),
        };

        set({
          conversations: {
            ...get().conversations,
            [partnerId]: { ...existing, messages: [...existing.messages, myMessage] },
          },
        });

        setTimeout(() => {
          const current = get().conversations[partnerId];
          if (!current) return;
          const isGroup = current.isGroup && current.members && current.members.length > 0;
          const replies = isGroup ? GROUP_REPLIES : AUTO_REPLIES;
          const reply: ChatMessage = {
            id: `${Date.now()}`,
            senderId: 'partner',
            kind: 'text',
            text: replies[Math.floor(Math.random() * replies.length)],
            senderName: isGroup ? current.members![Math.floor(Math.random() * current.members!.length)] : undefined,
            sentAt: new Date().toISOString(),
          };
          set({
            conversations: {
              ...get().conversations,
              [partnerId]: { ...current, messages: [...current.messages, reply] },
            },
          });

          // A reply in a chat that is not open becomes an in-app notification.
          if (useActiveChat.getState().activeId !== partnerId && reply.kind === 'text') {
            useNotificationStore.getState().add({
              kind: 'message',
              title: current.partnerName,
              body: reply.senderName ? `${reply.senderName}: ${reply.text}` : reply.text,
              href: '/conversation',
              params: { partnerId, partnerName: current.partnerName },
            });
          }
        }, AUTO_REPLY_DELAY_MS);
      },

      sendInvite: (partnerId, partnerName, invite) => {
        if (!DEMO_DATA) {
          const me = myId();
          if (!me) return;
          const id = newId();
          putMessage(partnerId, partnerName, {
            id,
            senderId: 'me',
            kind: 'invite',
            invite: { ...invite, status: 'pending' },
            sentAt: new Date().toISOString(),
            pending: true,
          });
          ensureRemoteConversation(me, partnerId)
            .then((cid) => sendRemoteInvite(cid, id, invite))
            .then((row) => putMessage(partnerId, partnerName, toChatMessage(row, me)))
            .catch(() => {
              dropMessage(partnerId, id);
              notifyFailure();
            });
          return;
        }
        const existing = getOrCreateConversation(get().conversations, partnerId, partnerName);
        const inviteMessage: ChatMessage = {
          id: `${Date.now()}`,
          senderId: 'me',
          kind: 'invite',
          invite: { ...invite, status: 'pending' },
          sentAt: new Date().toISOString(),
        };

        set({
          conversations: {
            ...get().conversations,
            [partnerId]: { ...existing, messages: [...existing.messages, inviteMessage] },
          },
        });
      },

      // Real chat: only the person who RECEIVED the invitation can answer, and the server enforces it.
      // Demo mode: a manual action on the same card (there is no second device to answer from).
      respondToInvite: (partnerId, messageId, accept) => {
        const conversation = get().conversations[partnerId];
        if (!conversation) return;

        const message = conversation.messages.find((item) => item.id === messageId);
        if (!message || message.kind !== 'invite' || message.invite.status !== 'pending') return;

        const status = accept ? 'accepted' : 'declined';
        if (!DEMO_DATA) {
          if (answering.has(messageId) || message.senderId === 'me') return;
          answering.add(messageId);
          answerRemoteInvite(messageId, message.invite, accept)
            .then(() => {
              const answered = { ...message.invite, status } as WorkoutInvite;
              const current = get().conversations[partnerId] ?? conversation;
              set({
                conversations: {
                  ...get().conversations,
                  [partnerId]: {
                    ...current,
                    messages: current.messages.map((item) =>
                      item.id === messageId && item.kind === 'invite' ? { ...item, invite: answered } : item
                    ),
                  },
                },
              });
              if (accept) applyAcceptance(partnerId, conversation.partnerName, messageId, answered);
            })
            .catch(notifyFailure)
            .finally(() => answering.delete(messageId));
          return;
        }
        set({
          conversations: {
            ...get().conversations,
            [partnerId]: {
              ...conversation,
              messages: conversation.messages.map((item) =>
                item.id === messageId && item.kind === 'invite'
                  ? { ...item, invite: { ...item.invite, status } }
                  : item
              ),
            },
          },
        });

        if (accept) {
          useWorkoutStore.getState().scheduleWorkout({
            partnerId,
            partnerName: conversation.partnerName,
            activity: message.invite.activity,
            location: message.invite.location,
            scheduledAt: message.invite.scheduledAt,
          });
        }
      },
      };
    },
    {
      name: 'chat-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // A message that is still being sent is not saved on the phone: after a restart it would
      // look delivered when it never reached the server.
      partialize: (state) => ({
        appliedInvites: state.appliedInvites,
        conversations: Object.fromEntries(
          Object.entries(state.conversations).map(([key, conversation]) => [
            key,
            { ...conversation, messages: conversation.messages.filter((message) => !message.pending) },
          ])
        ),
      }),
    }
  )
);
