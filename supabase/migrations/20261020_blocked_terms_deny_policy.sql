-- Applied to the `duofit` Supabase project on 2026-10-20 (blocked_terms_deny_policy).
-- The word list is for the server only. RLS was already on with no policy (everything denied); an explicit deny-all policy says
-- so on purpose and clears the security advisor's "RLS enabled, no policy" note.
create policy blocked_terms_deny_all on private.blocked_terms
  for all to authenticated, anon
  using (false)
  with check (false);
