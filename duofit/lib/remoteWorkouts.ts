import { supabase } from '@lib/supabase';
import type { ScheduledWorkout } from '@hooks/useWorkoutStore';

// Server side of the shared workouts (tables and rules: supabase/migrations/20261007_shared_workouts.sql).
// A workout is created by the database when the recipient accepts an invitation; both members see the
// same row and each checks only themself in.

interface WorkoutRow {
  id: string;
  host_id: string;
  guest_id: string;
  activity: string;
  location: string;
  scheduled_at: string;
  host_checked_in_at: string | null;
  guest_checked_in_at: string | null;
  host: { display_name: string } | null;
  guest: { display_name: string } | null;
}

const FALLBACK_NAME = 'שותף לאימון';

export async function fetchWorkouts(me: string): Promise<ScheduledWorkout[]> {
  const { data, error } = await supabase
    .from('workouts')
    .select(
      'id, host_id, guest_id, activity, location, scheduled_at, host_checked_in_at, guest_checked_in_at, host:profiles!workouts_host_id_fkey(display_name), guest:profiles!workouts_guest_id_fkey(display_name)'
    )
    .order('scheduled_at', { ascending: true })
    .limit(500);
  if (error) throw error;
  return ((data ?? []) as unknown as WorkoutRow[]).map((row) => {
    const iAmHost = row.host_id === me;
    const other = iAmHost ? row.guest : row.host;
    return {
      id: row.id,
      partnerId: iAmHost ? row.guest_id : row.host_id,
      partnerName: other?.display_name ?? FALLBACK_NAME,
      activity: row.activity,
      scheduledAt: row.scheduled_at,
      location: row.location,
      checkedIn: (iAmHost ? row.host_checked_in_at : row.guest_checked_in_at) !== null,
      iAmHost,
    };
  });
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
