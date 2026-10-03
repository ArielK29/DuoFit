import { useAuth } from '@hooks/useAuth';
import { useChatStore } from '@hooks/useChatStore';
import { useNotificationStore } from '@hooks/useNotificationStore';
import { useCommunityStore } from '@hooks/useCommunityStore';
import { DEFAULT_WEEKLY_GOAL, useProgressStore } from '@hooks/useProgressStore';
import { useWorkoutStore } from '@hooks/useWorkoutStore';

// Everything below is stored on the device. When the user signs out (or the
// session ends), wipe it, so the next person to sign in on this phone never sees
// the previous person's workouts, chats, posts or weight.
function resetLocalData() {
  useWorkoutStore.setState({ scheduledWorkouts: [] });
  useChatStore.setState({ conversations: {} });
  useNotificationStore.setState({ items: [] });
  useCommunityStore.setState({
    plankBestSeconds: null,
    joinedGroupIds: [],
    likedPostIds: [],
    rsvpPostIds: [],
    hiddenPostIds: [],
    userPosts: [],
    comments: {},
  });
  useProgressStore.setState({ weeklyGoal: DEFAULT_WEEKLY_GOAL, goalWeight: null, weightLog: [] });
}

// Call once at app start. Returns the unsubscribe function.
export function startSessionSync(): () => void {
  return useAuth.subscribe((state, previous) => {
    if (previous.user && !state.user) resetLocalData();
  });
}
