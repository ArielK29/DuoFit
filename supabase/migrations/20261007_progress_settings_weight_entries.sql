-- Applied to the `duofit` Supabase project on 2026-10-07 (progress_settings_weight_entries).
-- Progress data on the server (issue #65, stage 3a): the weekly goal, the goal weight, the personal
-- plank record and the weight log. Own rows only; nobody else can read them.

create table public.progress_settings (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  weekly_goal smallint not null default 3 check (weekly_goal between 1 and 7),
  goal_weight_kg numeric(5, 1) check (goal_weight_kg between 20 and 400),
  plank_best_seconds integer check (plank_best_seconds between 1 and 86400),
  updated_at timestamptz not null default now()
);

create table public.weight_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kg numeric(5, 1) not null check (kg between 20 and 400),
  logged_at timestamptz not null default now()
);
create index weight_entries_user_logged_idx on public.weight_entries (user_id, logged_at desc);

alter table public.progress_settings enable row level security;
alter table public.weight_entries enable row level security;

-- Least privilege: no anon access; clients choose only the columns below (the server sets user_id,
-- timestamps); weight entries can be added and read but not edited or deleted yet.
revoke all on public.progress_settings, public.weight_entries from anon;
revoke all on public.progress_settings, public.weight_entries from authenticated;
grant select on public.progress_settings to authenticated;
grant insert (weekly_goal, goal_weight_kg, plank_best_seconds) on public.progress_settings to authenticated;
grant update (weekly_goal, goal_weight_kg, plank_best_seconds) on public.progress_settings to authenticated;
grant select on public.weight_entries to authenticated;
grant insert (id, kg) on public.weight_entries to authenticated;

create policy progress_settings_select_own on public.progress_settings
  for select to authenticated using (user_id = (select auth.uid()));
create policy progress_settings_insert_own on public.progress_settings
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy progress_settings_update_own on public.progress_settings
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy weight_entries_select_own on public.weight_entries
  for select to authenticated using (user_id = (select auth.uid()));
create policy weight_entries_insert_own on public.weight_entries
  for insert to authenticated with check (user_id = (select auth.uid()));

-- Housekeeping triggers: the server stamps updated_at, and a person can keep at most 3000 weight entries.
create function public.progress_settings_touch()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
revoke execute on function public.progress_settings_touch() from public, anon, authenticated;
create trigger progress_settings_touch
  before insert or update on public.progress_settings
  for each row execute function public.progress_settings_touch();

create function public.weight_entries_limit()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if (select count(*) from public.weight_entries w where w.user_id = new.user_id) >= 3000 then
    raise exception 'too many weight entries';
  end if;
  return new;
end;
$$;
revoke execute on function public.weight_entries_limit() from public, anon, authenticated;
create trigger weight_entries_limit
  before insert on public.weight_entries
  for each row execute function public.weight_entries_limit();
