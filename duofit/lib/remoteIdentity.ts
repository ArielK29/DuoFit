import { supabase } from '@lib/supabase';
import { readPickedImage } from '@lib/readLocalFile';
import { parseVerificationStatus, type VerificationStatus } from '@lib/identity';

// The selfie is only for the reviewer. Once the decision is made the picture is removed from storage, so the
// server keeps the decision and the date, not a face. (Owner/lawyer can change this to keep it for a limited time.)
const DELETE_SELFIE_AFTER_DECISION = true;

const BUCKET = 'identity-selfies';

export interface MyVerification {
  status: VerificationStatus;
  rejectReason?: string;
  isAdmin: boolean;
}

// Returns null when the server could not be reached (the caller keeps what it had), so a bad connection never sends an
// approved member back to the gate.
export async function fetchMyVerification(userId: string): Promise<MyVerification | null> {
  const check = await supabase.from('identity_checks').select('status, reject_reason').eq('user_id', userId).maybeSingle();
  if (check.error) return null;
  const admin = await supabase.from('app_admins').select('user_id').eq('user_id', userId).maybeSingle();
  if (admin.error) return null;
  return {
    status: parseVerificationStatus(check.data?.status),
    rejectReason: check.data?.reject_reason ?? undefined,
    isAdmin: !!admin.data,
  };
}

export interface IdentitySubmission {
  userId: string;
  birthDate: string; // yyyy-mm-dd
  gesture: string;
  localSelfieUri: string;
}

// Uploads the private selfie and records the check (or replaces a rejected one). The server refuses under-18 birth dates.
export async function submitIdentityCheck(input: IdentitySubmission): Promise<void> {
  const bytes = await readPickedImage(input.localSelfieUri);
  const path = `${input.userId}/selfie-${Date.now()}.jpg`;
  const upload = await supabase.storage.from(BUCKET).upload(path, bytes, { contentType: 'image/jpeg', upsert: false });
  if (upload.error) throw upload.error;
  const { error } = await supabase
    .from('identity_checks')
    .upsert({ user_id: input.userId, birth_date: input.birthDate, gesture: input.gesture, selfie_path: path }, { onConflict: 'user_id' });
  if (error) throw error;
}

export interface PendingCheck {
  userId: string;
  name: string;
  avatarUrl?: string;
  birthDate: string;
  gesture: string;
  selfiePath: string | null;
  submittedAt: string;
}

// Admin only (the server returns nothing to anybody else).
export async function listPendingChecks(): Promise<PendingCheck[] | null> {
  const { data, error } = await supabase
    .from('identity_checks')
    .select('user_id, birth_date, gesture, selfie_path, submitted_at')
    .eq('status', 'pending')
    .order('submitted_at', { ascending: true })
    .limit(50);
  if (error || !data) return null;
  const ids = data.map((row) => row.user_id as string);
  const profiles = ids.length > 0 ? await supabase.from('profiles').select('id, display_name, avatar_url').in('id', ids) : { data: [], error: null };
  if (profiles.error) return null;
  const byId = new Map((profiles.data ?? []).map((p) => [p.id as string, p]));
  return data.map((row) => {
    const profile = byId.get(row.user_id as string);
    return {
      userId: row.user_id as string,
      name: (profile?.display_name as string | undefined) ?? '',
      avatarUrl: (profile?.avatar_url as string | null | undefined) ?? undefined,
      birthDate: row.birth_date as string,
      gesture: row.gesture as string,
      selfiePath: (row.selfie_path as string | null) ?? null,
      submittedAt: row.submitted_at as string,
    };
  });
}

export async function selfieUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 300);
  return error ? null : data.signedUrl;
}

export async function decideCheck(check: PendingCheck, status: 'approved' | 'rejected', reason?: string): Promise<boolean> {
  const { error } = await supabase
    .from('identity_checks')
    .update({ status, reject_reason: status === 'rejected' ? (reason ?? '').trim().slice(0, 200) || null : null })
    .eq('user_id', check.userId);
  if (error) return false;
  if (DELETE_SELFIE_AFTER_DECISION && check.selfiePath) {
    // Best effort: the decision already counts even if the file removal fails; it is retried on the next decision.
    await supabase.storage.from(BUCKET).remove([check.selfiePath]);
  }
  return true;
}
