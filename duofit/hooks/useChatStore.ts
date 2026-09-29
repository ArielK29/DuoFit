import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useWorkoutStore } from '@hooks/useWorkoutStore';

export interface WorkoutInvite {
  activity: string;
  location: string;
  scheduledAt: string; // ISO
  status: 'pending' | 'accepted' | 'declined';
}

export type ChatMessage =
  | { id: string; senderId: 'me' | 'partner'; sentAt: string; kind: 'text'; text: string }
  | { id: string; senderId: 'me' | 'partner'; sentAt: string; kind: 'invite'; invite: WorkoutInvite };

export interface Conversation {
  partnerId: string;
  partnerName: string;
  messages: ChatMessage[];
}

interface ChatState {
  conversations: Record<string, Conversation>;

  ensureConversation: (partnerId: string, partnerName: string) => void;
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
export const AUTO_REPLY_DELAY_MS = 1500;

function getOrCreateConversation(
  conversations: Record<string, Conversation>,
  partnerId: string,
  partnerName: string
): Conversation {
  return conversations[partnerId] ?? { partnerId, partnerName, messages: [] };
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      conversations: {},

      ensureConversation: (partnerId, partnerName) => {
        if (get().conversations[partnerId]) return;
        set({
          conversations: { ...get().conversations, [partnerId]: { partnerId, partnerName, messages: [] } },
        });
      },

      sendMessage: (partnerId, partnerName, text) => {
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
          const reply: ChatMessage = {
            id: `${Date.now()}`,
            senderId: 'partner',
            kind: 'text',
            text: AUTO_REPLIES[Math.floor(Math.random() * AUTO_REPLIES.length)],
            sentAt: new Date().toISOString(),
          };
          set({
            conversations: {
              ...get().conversations,
              [partnerId]: { ...current, messages: [...current.messages, reply] },
            },
          });
        }, AUTO_REPLY_DELAY_MS);
      },

      sendInvite: (partnerId, partnerName, invite) => {
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

      // No second device to accept/decline from, so this is a manual demo
      // action on the same invite card rather than a simulated incoming reply.
      respondToInvite: (partnerId, messageId, accept) => {
        const conversation = get().conversations[partnerId];
        if (!conversation) return;

        const message = conversation.messages.find((item) => item.id === messageId);
        if (!message || message.kind !== 'invite' || message.invite.status !== 'pending') return;

        const status = accept ? 'accepted' : 'declined';
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
    }),
    {
      name: 'chat-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
