-- Applied to the `duofit` Supabase project on 2026-10-20 (profiles_hidden_from_blocked) after the owner approved. Advisors: only the known leaked-password warning.
-- Test (rolled back, 7 of 7 good before and after applying): supabase/tests/rls_profiles_blocked_test.sql.
-- A member who is blocked must not be able to look the blocker up in partner discovery. One direction only: the blocker keeps
-- the right to read the blocked member's profile row (the block list in "My account" shows the name, so it can be unblocked);
-- the app itself leaves the blocked member out of the blocker's discovery list.

-- True when `other` blocked the signed-in member.
create function private.blocked_by(other uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.user_blocks b
    where b.blocker_id = other and b.blocked_id = (select auth.uid())
  );
$$;
revoke execute on function private.blocked_by(uuid) from public, anon;
grant execute on function private.blocked_by(uuid) to authenticated;

drop policy profiles_select_discoverable on public.profiles;
create policy profiles_select_discoverable on public.profiles
  for select to authenticated
  using (
    id <> (select auth.uid())
    and gender is not null
    and fitness_level is not null
    and cardinality(favorite_activities) > 0
    and not private.blocked_by(id)
  );
