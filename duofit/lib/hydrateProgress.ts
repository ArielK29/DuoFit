import { supabase } from '@lib/supabase';
import { useAuth } from '@hooks/useAuth';
import { useCommunityStore } from '@hooks/useCommunityStore';
import { useProgressStore, WeightEntry } from '@hooks/useProgressStore';

interface SettingsRow {
  weekly_goal: number;
  goal_weight_kg: number | null;
  plank_best_seconds: number | null;
}

interface WeightRow {
  id: string;
  kg: number | string;
  logged_at: string;
}

let loading = false;

// Loads the member's saved progress and puts it on the phone. The server is the truth: what was
// logged on another phone appears here, and old on-phone-only entries are replaced.
export async function hydrateProgress(): Promise<void> {
  const me = useAuth.getState().user?.id;
  if (!me || loading) return;
  loading = true;
  try {
    const [settings, weights] = await Promise.all([
      supabase.from('progress_settings').select('weekly_goal, goal_weight_kg, plank_best_seconds').maybeSingle(),
      supabase.from('weight_entries').select('id, kg, logged_at').order('logged_at', { ascending: true }).limit(1000),
    ]);
    if (settings.error) throw settings.error;
    if (weights.error) throw weights.error;
    if (useAuth.getState().user?.id !== me) return; // signed out while loading

    const row = settings.data as SettingsRow | null;
    const saved: WeightEntry[] = ((weights.data ?? []) as WeightRow[]).map((item) => ({
      id: item.id,
      kg: Number(item.kg),
      loggedAt: item.logged_at,
    }));
    const progress = useProgressStore.getState();
    // Entries still being saved stay visible until the server confirms them.
    const pending = progress.weightLog.filter((entry) => entry.pending && !saved.some((item) => item.id === entry.id));
    useProgressStore.setState({
      weeklyGoal: row ? row.weekly_goal : progress.weeklyGoal,
      goalWeight: row ? (row.goal_weight_kg === null ? null : Number(row.goal_weight_kg)) : progress.goalWeight,
      weightLog: [...saved, ...pending],
    });
    useCommunityStore.setState({ plankBestSeconds: row?.plank_best_seconds ?? null });
  } catch {
    // Offline: keep what is on the phone, the next load fixes it.
  } finally {
    loading = false;
  }
}
