import { supabase } from '@lib/supabase';
import { FREE_SUBSCRIPTION, subscriptionFromRow, type Subscription } from '@lib/subscription';

// The member's own subscription row (RLS lets a member read only their own). No row, or any error, reads as free:
// the server decides what is allowed anyway, so showing "free" for a moment is harmless.
export async function fetchMySubscription(userId: string): Promise<Subscription> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('tier, status, expires_at')
    .eq('user_id', userId)
    .maybeSingle();
  if (error || !data) return FREE_SUBSCRIPTION;
  return subscriptionFromRow(data);
}

// New invitations this member sent in the last 7 days (RLS: a member reads their own messages).
export async function countMyInvitesThisWeek(userId: string): Promise<number | null> {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { count, error } = await supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('sender_id', userId)
    .eq('kind', 'invite')
    .gte('created_at', since);
  if (error) return null;
  return count ?? 0;
}
