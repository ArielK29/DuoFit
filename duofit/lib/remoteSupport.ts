import Constants from 'expo-constants';
import * as Application from 'expo-application';
import { supabase } from '@lib/supabase';
import { formatAppVersion, type SupportStatus, type SupportTopic } from '@lib/support';

export interface SupportRequest {
  id: string;
  topic: SupportTopic;
  message: string;
  status: SupportStatus;
  adminNote: string | null;
  appVersion: string | null;
  createdAt: string;
  // Only filled for the admin list.
  userId: string;
  name: string;
}

interface Row {
  id: string;
  user_id: string;
  topic: SupportTopic;
  message: string;
  status: SupportStatus;
  admin_note: string | null;
  app_version: string | null;
  created_at: string;
}

const COLUMNS = 'id, user_id, topic, message, status, admin_note, app_version, created_at';

function toRequest(row: Row, name = ''): SupportRequest {
  return {
    id: row.id,
    userId: row.user_id,
    topic: row.topic,
    message: row.message,
    status: row.status,
    adminNote: row.admin_note,
    appVersion: row.app_version,
    createdAt: row.created_at,
    name,
  };
}

// Throws on failure (the caller shows supportErrorMessage). The server sets the owner, the time and the status.
export async function sendSupportRequest(topic: SupportTopic, message: string): Promise<void> {
  const appVersion = formatAppVersion(Constants.expoConfig?.version, Application.nativeBuildVersion);
  const { error } = await supabase.from('support_requests').insert({ topic, message: message.trim(), app_version: appVersion });
  if (error) throw error;
}

// The member's own requests, newest first. Returns null when the server could not be reached.
export async function listMySupportRequests(userId: string): Promise<SupportRequest[] | null> {
  const { data, error } = await supabase
    .from('support_requests')
    .select(COLUMNS)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);
  if (error || !data) return null;
  return (data as Row[]).map((row) => toRequest(row));
}

// Admin only (the server returns only the admin's own rows to anybody else). Open requests first when `onlyOpen`.
export async function listSupportRequestsForAdmin(onlyOpen: boolean): Promise<SupportRequest[] | null> {
  let query = supabase.from('support_requests').select(COLUMNS).order('created_at', { ascending: false }).limit(100);
  if (onlyOpen) query = query.neq('status', 'done');
  const { data, error } = await query;
  if (error || !data) return null;
  const rows = data as Row[];
  const ids = [...new Set(rows.map((row) => row.user_id))];
  const profiles = ids.length > 0 ? await supabase.from('profiles').select('id, display_name').in('id', ids) : { data: [], error: null };
  const names = new Map((profiles.data ?? []).map((p) => [p.id as string, (p.display_name as string | null) ?? '']));
  return rows.map((row) => toRequest(row, names.get(row.user_id) ?? ''));
}

export async function updateSupportRequest(id: string, status: SupportStatus, adminNote: string | null): Promise<boolean> {
  const note = adminNote === null ? null : adminNote.trim().slice(0, 2000) || null;
  const { error, count } = await supabase.from('support_requests').update({ status, admin_note: note }, { count: 'exact' }).eq('id', id);
  return !error && count === 1;
}

// How many requests wait for the admin (for the badge on the button). 0 when it cannot be read.
export async function countNewSupportRequests(): Promise<number> {
  const { count, error } = await supabase.from('support_requests').select('id', { count: 'exact', head: true }).eq('status', 'new');
  return error ? 0 : count ?? 0;
}
