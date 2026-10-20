// Members the signed-in member blocked are left out of the partner list. A block list that could not be read (null) keeps
// everybody: the server still protects the blocked side (see supabase/migrations/20261020_profiles_hidden_from_blocked.sql).
export function withoutBlocked<T extends { id: string }>(rows: T[], blockedIds: string[] | null | undefined): T[] {
  if (!blockedIds || blockedIds.length === 0) return rows;
  const blocked = new Set(blockedIds);
  return rows.filter((row) => !blocked.has(row.id));
}
