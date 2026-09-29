import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ChatMessage {
  id: string;
  senderId: 'me' | 'partner';
  text: string;
  sentAt: string; // ISO
}

export interface Conversation {
  partnerId: string;
  partnerName: string;
  messages: ChatMessage[];
}

interface ChatState {
  conversations: Record<string, Conversation>;

  ensureConversation: (partnerId: string, partnerName: string) => void;
  sendMessage: (partnerId: string, partnerName: string, text: string) => void;
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

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      conversations: {},

      ensureConversation: (partnerId, partnerName) => {
        if (get().conversations[partnerId]) return;
        set({
          conversations: {
            ...get().conversations,
            [partnerId]: { partnerId, partnerName, messages: [] },
          },
        });
      },

      sendMessage: (partnerId, partnerName, text) => {
        const existing = get().conversations[partnerId] ?? { partnerId, partnerName, messages: [] };
        const myMessage: ChatMessage = { id: `${Date.now()}`, senderId: 'me', text, sentAt: new Date().toISOString() };

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
    }),
    {
      name: 'chat-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
