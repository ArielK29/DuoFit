import { create } from 'zustand';
import { useAuth } from '@hooks/useAuth';
import { newId } from '@lib/uuid';
import { notifyFailure } from '@lib/notifyFailure';
import * as api from '@lib/remoteCommunity';
import type { BlockedMember, RemoteComment, RemotePost, ReportReason } from '@lib/remoteCommunity';

// The real community feed (signed-in members, not the demo data). Nothing here is kept on the
// phone: the server is the truth and the feed is loaded again when the tab opens.

interface FeedState {
  posts: RemotePost[];
  comments: Record<string, RemoteComment[]>;
  blocked: BlockedMember[];
  loaded: boolean;
  loading: boolean;
  loadFailed: boolean;

  load: () => Promise<void>;
  createPost: (input: { body: string; activity: string; localImageUri?: string }) => Promise<boolean>;
  deletePost: (postId: string) => Promise<void>;
  toggleLike: (postId: string) => void;
  loadComments: (postId: string) => Promise<void>;
  addComment: (postId: string, body: string) => Promise<boolean>;
  deleteComment: (postId: string, commentId: string) => Promise<void>;
  report: (target: { postId?: string; commentId?: string }, reason: ReportReason) => Promise<void>;
  block: (userId: string) => Promise<void>;
  unblock: (userId: string) => Promise<void>;
  reset: () => void;
}

const me = () => useAuth.getState().user?.id ?? null;

// A reload asked for while another load is running (after posting, blocking...) runs right after it,
// so the screen never keeps an answer that was fetched before the change.
let reloadQueued = false;
// Posts whose like is being saved: a second tap waits for the first.
const likeBusy = new Set<string>();

export const useFeedStore = create<FeedState>()((set, get) => ({
  posts: [],
  comments: {},
  blocked: [],
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
      const [posts, blocked] = await Promise.all([
        api.fetchFeed(userId),
        api.fetchBlocked(userId).catch(() => get().blocked),
      ]);
      if (me() !== userId) return; // signed out while loading
      set({ posts, blocked, loaded: true, loadFailed: false });
    } catch {
      // Offline: keep what is on screen and say so, the next load fixes it.
      set({ loadFailed: true });
    } finally {
      set({ loading: false });
      if (reloadQueued) {
        reloadQueued = false;
        get().load();
      }
    }
  },

  createPost: async (input) => {
    const userId = me();
    if (!userId) return false;
    try {
      await api.createPost(userId, newId(), input);
    } catch {
      notifyFailure();
      return false;
    }
    await get().load();
    return true;
  },

  deletePost: async (postId) => {
    const before = get().posts;
    set({ posts: before.filter((post) => post.id !== postId) });
    try {
      await api.deletePost(postId);
    } catch {
      set({ posts: before });
      notifyFailure();
    }
  },

  // Optimistic: the heart changes at once and goes back if the server says no.
  toggleLike: (postId) => {
    const userId = me();
    const post = get().posts.find((item) => item.id === postId);
    if (!userId || !post || likeBusy.has(postId)) return;
    likeBusy.add(postId);
    const liked = !post.liked;
    const apply = (value: boolean, likes: number) =>
      set({ posts: get().posts.map((item) => (item.id === postId ? { ...item, liked: value, likes } : item)) });
    apply(liked, Math.max(0, post.likes + (liked ? 1 : -1)));
    api
      .setLike(postId, liked, userId)
      .catch(() => {
        apply(post.liked, post.likes);
        notifyFailure();
      })
      .finally(() => likeBusy.delete(postId));
  },

  loadComments: async (postId) => {
    try {
      const list = await api.fetchComments(postId);
      set({ comments: { ...get().comments, [postId]: list } });
    } catch {
      // Keep what is shown.
    }
  },

  addComment: async (postId, body) => {
    try {
      await api.addComment(newId(), postId, body);
    } catch {
      notifyFailure();
      return false;
    }
    await get().loadComments(postId);
    set({
      posts: get().posts.map((item) => (item.id === postId ? { ...item, comments: item.comments + 1 } : item)),
    });
    return true;
  },

  deleteComment: async (postId, commentId) => {
    const before = get().comments[postId] ?? [];
    set({ comments: { ...get().comments, [postId]: before.filter((item) => item.id !== commentId) } });
    try {
      await api.deleteComment(commentId);
      set({
        posts: get().posts.map((item) =>
          item.id === postId ? { ...item, comments: Math.max(0, item.comments - 1) } : item
        ),
      });
    } catch {
      set({ comments: { ...get().comments, [postId]: before } });
      notifyFailure();
    }
  },

  // A reported post or comment disappears for the reporter at once (the server hides it too).
  report: async (target, reason) => {
    try {
      await api.reportContent(target, reason);
    } catch {
      notifyFailure();
      return;
    }
    if (target.postId) set({ posts: get().posts.filter((item) => item.id !== target.postId) });
    if (target.commentId) {
      const next: Record<string, RemoteComment[]> = {};
      let posts = get().posts;
      for (const [postId, list] of Object.entries(get().comments)) {
        next[postId] = list.filter((item) => item.id !== target.commentId);
        if (next[postId].length < list.length) {
          posts = posts.map((item) => (item.id === postId ? { ...item, comments: Math.max(0, item.comments - 1) } : item));
        }
      }
      set({ comments: next, posts });
    }
  },

  block: async (userId) => {
    try {
      await api.blockMember(userId);
    } catch {
      notifyFailure();
      return;
    }
    await get().load();
    // Comments already on screen may belong to the person just blocked: fetch them again.
    await Promise.all(Object.keys(get().comments).map((postId) => get().loadComments(postId)));
  },

  unblock: async (userId) => {
    const userMe = me();
    if (!userMe) return;
    try {
      await api.unblockMember(userId, userMe);
    } catch {
      notifyFailure();
      return;
    }
    await get().load();
  },

  reset: () => {
    reloadQueued = false;
    set({ posts: [], comments: {}, blocked: [], loaded: false, loading: false, loadFailed: false });
  },
}));
