import { supabase } from '@lib/supabase';
import type { ScheduledWorkout } from '@hooks/useWorkoutStore';

// Server side of the shared workouts (tables and rules: supabase/migrations/20261007_shared_workouts.sql).
// A workout is created by the database when the recipient accepts an invitation; both members see the
// same row and each checks only themself in.

interface WorkoutRow {
  id: string;
  host_id: string | null; // null: that member deleted their account
  guest_id: string | null;
  activity: string;
  location: string;
  scheduled_at: string;
  host_checked_in_at: string | null;
  guest_checked_in_at: string | null;
  cancelled_at: string | null;
  cancelled_by: string | null;
  host: { display_name: string } | null;
  guest: { display_name: string } | null;
}

const FALLBACK_NAME = 'שותף לאימון';
const DELETED_NAME = 'חבר שעזב';

export interface WorkoutFeed {
  active: ScheduledWorkout[];
  // Workouts the OTHER member cancelled (so this phone can say so once).
  cancelledByPartner: ScheduledWorkout[];
}

export async function fetchWorkouts(me: string): Promise<WorkoutFeed> {
  const { data, error } = await supabase
    .from('workouts')
    .select(
      'id, host_id, guest_id, activity, location, scheduled_at, host_checked_in_at, guest_checked_in_at, cancelled_at, cancelled_by, host:profiles!workouts_host_id_fkey(display_name), guest:profiles!workouts_guest_id_fkey(display_name)'
    )
    .order('scheduled_at', { ascending: true })
    .limit(500);
  if (error) throw error;
  const feed: WorkoutFeed = { active: [], cancelledByPartner: [] };
  for (const row of (data ?? []) as unknown as WorkoutRow[]) {
    const iAmHost = row.host_id === me;
    const otherId = iAmHost ? row.guest_id : row.host_id;
    const other = iAmHost ? row.guest : row.host;
    const workout: ScheduledWorkout = {
      id: row.id,
      partnerId: otherId ?? '',
      partnerName: other?.display_name ?? (otherId ? FALLBACK_NAME : DELETED_NAME),
      activity: row.activity,
      scheduledAt: row.scheduled_at,
      location: row.location,
      checkedIn: (iAmHost ? row.host_checked_in_at : row.guest_checked_in_at) !== null,
      iAmHost,
    };
    if (row.cancelled_at === null) feed.active.push(workout);
    else if (row.cancelled_by !== null && row.cancelled_by !== me) feed.cancelledByPartner.push(workout);
  }
  return feed;
}

// Cancels a workout before it starts (the server refuses after the start or after a check-in).
export async function cancelRemote(id: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('workouts')
    .update({ cancelled_at: new Date().toISOString() })
    .eq('id', id)
    .select('id');
  return !error && !!data && data.length > 0;
}

export type CheckInResult = 'ok' | 'window' | 'failed';

// The server stamps the time and refuses a check-in outside "3 hours before ... 24 hours after".
export async function checkInRemote(id: string, iAmHost: boolean): Promise<CheckInResult> {
  const column = iAmHost ? 'host_checked_in_at' : 'guest_checked_in_at';
  const { data, error } = await supabase
    .from('workouts')
    .update({ [column]: new Date().toISOString() })
    .eq('id', id)
    .select('id');
  // No row back means the workout no longer exists on the server (for example the partner left).
  if (!error) return data && data.length > 0 ? 'ok' : 'failed';
  if (error.message?.includes('check-in is open')) return 'window';
  if (error.message?.includes('already checked in')) return 'ok';
  return 'failed';
}
