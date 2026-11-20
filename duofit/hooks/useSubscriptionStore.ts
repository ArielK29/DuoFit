import { create } from 'zustand';
import { FREE_SUBSCRIPTION, type Subscription } from '@lib/subscription';
import { countMyInvitesThisWeek, fetchMySubscription } from '@lib/remoteSubscription';

interface SubscriptionState {
  subscription: Subscription;
  // New invitations sent in the last 7 days (null = not known yet).
  invitesUsed: number | null;
  loaded: boolean;
  refresh: (userId: string) => Promise<void>;
  reset: () => void;
}

// Read-only mirror of what the server says (public.subscriptions + the member's own invitations).
// Never persisted: it is cheap to read and a stale copy could show the wrong plan.
export const useSubscriptionStore = create<SubscriptionState>()((set) => ({
  subscription: FREE_SUBSCRIPTION,
  invitesUsed: null,
  loaded: false,
  refresh: async (userId) => {
    const [subscription, invitesUsed] = await Promise.all([fetchMySubscription(userId), countMyInvitesThisWeek(userId)]);
    set({ subscription, invitesUsed, loaded: true });
  },
  reset: () => set({ subscription: FREE_SUBSCRIPTION, invitesUsed: null, loaded: false }),
}));
