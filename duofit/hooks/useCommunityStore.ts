import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GROUPS } from '@constants/community';
import { PARTNER_POOL } from '@hooks/usePartnerMatching';
import { useChatStore } from '@hooks/useChatStore';

export interface UserPost {
  id: string;
  text: string;
  activity: string;
  imageUri?: string;
  createdAt: string; // ISO
}

export interface PostComment {
  id: string;
  text: string;
  createdAt: string; // ISO
}

interface CommunityState {
  plankBestSeconds: number | null;
  joinedGroupIds: string[];
  likedPostIds: string[];
  rsvpPostIds: string[];
  hiddenPostIds: string[];
  userPosts: UserPost[];
  comments: Record<string, PostComment[]>;

  // Returns true when this attempt is the user's new record.
  recordPlank: (seconds: number) => boolean;
  toggleGroup: (groupId: string) => void;
  toggleLike: (postId: string) => void;
  toggleRsvp: (postId: string) => void;
  hidePost: (postId: string) => void;
  addPost: (post: Omit<UserPost, 'id' | 'createdAt'>) => void;
  deletePost: (postId: string) => void;
  addComment: (postId: string, text: string) => void;
}

const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((item) => item !== id) : [...list, id]);

export const useCommunityStore = create<CommunityState>()(
  persist(
    (set, get) => ({
      plankBestSeconds: null,
      joinedGroupIds: [],
      likedPostIds: [],
      rsvpPostIds: [],
      hiddenPostIds: [],
      userPosts: [],
      comments: {},

      recordPlank: (seconds) => {
        const best = get().plankBestSeconds;
        if (best !== null && seconds <= best) return false;
        set({ plankBestSeconds: seconds });
        return true;
      },

      // Joining a group also opens its group chat (leaving removes it).
      toggleGroup: (groupId) => {
        const joined = !get().joinedGroupIds.includes(groupId);
        set({ joinedGroupIds: toggle(get().joinedGroupIds, groupId) });

        const group = GROUPS.find((item) => item.id === groupId);
        if (!group) return;
        const chatId = `group-${groupId}`;
        if (joined) {
          const members = PARTNER_POOL.filter((partner) => partner.activities.includes(group.activity))
            .slice(0, 4)
            .map((partner) => partner.name);
          useChatStore.getState().createGroup(chatId, group.name, members, group.members + 1);
        } else {
          useChatStore.getState().removeConversation(chatId);
        }
      },
      toggleLike: (postId) => set({ likedPostIds: toggle(get().likedPostIds, postId) }),
      toggleRsvp: (postId) => set({ rsvpPostIds: toggle(get().rsvpPostIds, postId) }),
      hidePost: (postId) => set({ hiddenPostIds: [...get().hiddenPostIds, postId] }),

      addPost: (post) => {
        const now = new Date();
        const created: UserPost = { ...post, id: `mine-${now.getTime()}`, createdAt: now.toISOString() };
        set({ userPosts: [created, ...get().userPosts] });
      },

      deletePost: (postId) => set({ userPosts: get().userPosts.filter((post) => post.id !== postId) }),

      addComment: (postId, text) => {
        const now = new Date();
        const comment: PostComment = { id: `c-${now.getTime()}`, text, createdAt: now.toISOString() };
        const existing = get().comments[postId] ?? [];
        set({ comments: { ...get().comments, [postId]: [...existing, comment] } });
      },
    }),
    {
      name: 'duofit-community',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
