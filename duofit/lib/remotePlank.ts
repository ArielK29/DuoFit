import { supabase } from '@lib/supabase';

// Server side of the weekly plank challenge (table and rules:
// supabase/migrations/20261007_plank_weekly_leaderboard.sql). The server only shows the current week,
// so no date filter is needed here.

export interface PlankBoardRow {
  userId: string;
  name: string;
  seconds: number;
}

export interface PlankBoard {
  top: PlankBoardRow[]; // best five of the week
  participants: number;
  mine: { seconds: number; rank: number } | null;
}

const TOP_ROWS = 5;
const FALLBACK_NAME = 'חבר/ה בקהילה';

interface TopRow {
  user_id: string;
  seconds: number;
  author: { display_name: string } | null;
}

// Saves a time for this week. The server keeps the better of the old and the new time.
export async function saveWeeklyPlank(seconds: number): Promise<void> {
  const { error } = await supabase
    .from('plank_weekly')
    .upsert({ seconds: Math.round(seconds) }, { onConflict: 'week_start,user_id' });
  if (error) throw error;
}

export async function fetchPlankBoard(me: string): Promise<PlankBoard> {
  const [top, total, mine] = await Promise.all([
    supabase
      .from('plank_weekly')
      .select('user_id, seconds, author:profiles!plank_weekly_user_id_fkey(display_name)')
      .order('seconds', { ascending: false })
      .limit(TOP_ROWS),
    supabase.from('plank_weekly').select('user_id', { count: 'exact', head: true }),
    supabase.from('plank_weekly').select('seconds').eq('user_id', me).maybeSingle(),
  ]);
  if (top.error) throw top.error;
  if (total.error) throw total.error;
  if (mine.error) throw mine.error;

  let mineInfo: PlankBoard['mine'] = null;
  const mySeconds = (mine.data as { seconds: number } | null)?.seconds;
  if (mySeconds !== undefined) {
    const ahead = await supabase
      .from('plank_weekly')
      .select('user_id', { count: 'exact', head: true })
      .gt('seconds', mySeconds);
    if (ahead.error) throw ahead.error;
    mineInfo = { seconds: mySeconds, rank: (ahead.count ?? 0) + 1 };
  }

  return {
    top: ((top.data ?? []) as unknown as TopRow[]).map((row) => ({
      userId: row.user_id,
      name: row.author?.display_name ?? FALLBACK_NAME,
      seconds: row.seconds,
    })),
    participants: total.count ?? 0,
    mine: mineInfo,
  };
}
