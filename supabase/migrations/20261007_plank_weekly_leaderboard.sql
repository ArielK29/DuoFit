-- Applied to the `duofit` Supabase project on 2026-10-07 (plank_weekly_leaderboard).
-- Weekly plank challenge on the server (issue #65, stage 6): each member's best time of the current week,
-- readable by every signed-in member (except blocked pairs) so the leaderboard is real.
-- The week starts on Sunday, Israel time. Only the current week is visible; older weeks stay hidden.
-- Times are reported by the app (it has no way to prove them), so they are capped at 2 hours.

-- Start (Sunday) of the current week in Israel time.
create function private.current_week_start()
returns date
language sql
stable
set search_path = ''
as $$
  select (date_trunc('week', (now() at time zone 'Asia/Jerusalem') + interval '1 day') - interval '1 day')::date;
$$;
revoke execute on function private.current_week_start() from public, anon;
grant execute on function private.current_week_start() to authenticated;

create table public.plank_weekly (
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  week_start date not null default private.current_week_start(),
  seconds integer not null check (seconds between 1 and 7200),
  updated_at timestamptz not null default now(),
  primary key (week_start, user_id)
);
create index plank_weekly_rank_idx on public.plank_weekly (week_start, seconds desc);
create index plank_weekly_user_idx on public.plank_weekly (user_id);

alter table public.plank_weekly enable row level security;

revoke all on public.plank_weekly from anon;
revoke all on public.plank_weekly from authenticated;
grant select on public.plank_weekly to authenticated;
grant insert (seconds) on public.plank_weekly to authenticated;
grant update (seconds) on public.plank_weekly to authenticated;

create policy plank_weekly_select_this_week on public.plank_weekly
  for select to authenticated
  using (
    week_start = private.current_week_start()
    and (user_id = (select auth.uid()) or not private.blocked_between(user_id))
  );
create policy plank_weekly_insert_own on public.plank_weekly
  for insert to authenticated
  with check (user_id = (select auth.uid()) and week_start = private.current_week_start());
create policy plank_weekly_update_own on public.plank_weekly
  for update to authenticated
  using (user_id = (select auth.uid()) and week_start = private.current_week_start())
  with check (user_id = (select auth.uid()) and week_start = private.current_week_start());

-- The server keeps the better time and stamps the update time.
create function public.plank_weekly_keep_best()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.seconds := greatest(old.seconds, new.seconds);
  new.updated_at := now();
  return new;
end;
$$;
revoke execute on function public.plank_weekly_keep_best() from public, anon, authenticated;
create trigger plank_weekly_keep_best
  before update on public.plank_weekly
  for each row execute function public.plank_weekly_keep_best();
