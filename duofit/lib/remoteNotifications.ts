import { supabase } from '@lib/supabase';

// Server side of the notifications (table and rules: supabase/migrations/20261007_server_notifications.sql).
// Only the database creates them (invitation sent/answered, workout cancelled, comment on my post);
// the app reads them, marks them read and clears them.

export type RemoteNotificationKind =
  | 'invite_received'
  | 'invite_accepted'
  | 'invite_declined'
  | 'workout_cancelled'
  | 'post_comment';

export interface RemoteNotificationRow {
  id: string;
  kind: RemoteNotificationKind;
  actor_id: string | null;
  ref_id: string | null;
  body: string | null;
  read_at: string | null;
  created_at: string;
  actor: { display_name: string } | null;
}

const LIMIT = 100;

export async function fetchNotifications(): Promise<RemoteNotificationRow[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('id, kind, actor_id, ref_id, body, read_at, created_at, actor:profiles!notifications_actor_id_fkey(display_name)')
    .order('created_at', { ascending: false })
    .limit(LIMIT);
  if (error) throw error;
  return (data ?? []) as unknown as RemoteNotificationRow[];
}

export async function markReadRemote(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const { error } = await supabase.from('notifications').update({ read_at: new Date().toISOString() }).in('id', ids);
  if (error) throw error;
}

export async function clearRemote(me: string): Promise<void> {
  const { error } = await supabase.from('notifications').delete().eq('user_id', me);
  if (error) throw error;
}

// Calls `onInsert` whenever a new notification arrives for this member. Returns the unsubscribe function.
export function subscribeNotifications(me: string, handlers: { onInsert: () => void; onSubscribed: () => void }): () => void {
  const channel = supabase
    .channel(`notifications-${me}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${me}` },
      () => handlers.onInsert()
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') handlers.onSubscribed();
    });
  return () => {
    supabase.removeChannel(channel);
  };
}
