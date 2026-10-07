import { supabase } from '@lib/supabase';
import type { WeightEntry } from '@hooks/useProgressStore';

// Server side of the progress data (tables and security rules:
// supabase/migrations/20261007_progress_settings_weight_entries.sql). Own rows only.

interface WeightRow {
  id: string;
  kg: number | string;
  logged_at: string;
}

export interface SettingsPatch {
  weekly_goal?: number;
  goal_weight_kg?: number | null;
  plank_best_seconds?: number | null;
}

export async function saveRemoteSettings(patch: SettingsPatch): Promise<void> {
  const { error } = await supabase.from('progress_settings').upsert(patch, { onConflict: 'user_id' });
  if (error) throw error;
}

export async function insertRemoteWeight(id: string, kg: number): Promise<WeightEntry> {
  const { data, error } = await supabase.from('weight_entries').insert({ id, kg }).select('id, kg, logged_at').single();
  if (error) throw error;
  const row = data as WeightRow;
  return { id: row.id, kg: Number(row.kg), loggedAt: row.logged_at };
}
