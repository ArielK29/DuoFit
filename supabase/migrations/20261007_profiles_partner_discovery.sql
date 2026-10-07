-- Applied to the `duofit` Supabase project on 2026-10-07 (profiles_partner_discovery).
-- Partner discovery: signed-in users may read OTHER people's profiles, but only
--  * complete profiles (gender, fitness level and at least one activity are set), and
--  * only the public columns listed below (never anything private added later).
-- The owner policies (profiles_select_own / insert / update) are unchanged.

-- 1. Column-level privileges: list the public columns explicitly. A column added to
--    profiles later stays unreadable by the API until it is granted here on purpose.
revoke select on table public.profiles from authenticated;
grant select (id, display_name, bio, avatar_url, gender, fitness_level, favorite_activities, created_at)
  on table public.profiles to authenticated;

-- 2. Row-level rule for discovery (other people's complete profiles only).
create policy profiles_select_discoverable on public.profiles
  for select to authenticated
  using (
    id <> (select auth.uid())
    and gender is not null
    and fitness_level is not null
    and cardinality(favorite_activities) > 0
  );

-- 3. Newest members first is the default order of the discovery list.
create index if not exists profiles_created_at_idx on public.profiles (created_at desc);
