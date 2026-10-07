-- Applied to the `duofit` Supabase project on 2026-10-07 (shared_workouts).
-- Shared workouts (issue #65, stage 7): an accepted workout invitation becomes ONE workout row that both
-- members see. The row is created by a trigger from the invitation itself, so nobody can forge one.
-- Each member can check themself in (own column, server time, once, from 3 h before to 24 h after the start).

create table public.workouts (
  id uuid primary key, -- the id of the invitation message
  host_id uuid not null references public.profiles (id) on delete cascade,
  guest_id uuid not null references public.profiles (id) on delete cascade,
  activity text not null check (char_length(activity) between 1 and 100),
  location text not null check (char_length(location) between 1 and 100),
  scheduled_at timestamptz not null,
  host_checked_in_at timestamptz,
  guest_checked_in_at timestamptz,
  created_at timestamptz not null default now(),
  check (host_id <> guest_id)
);
create index workouts_host_idx on public.workouts (host_id, scheduled_at desc);
create index workouts_guest_idx on public.workouts (guest_id, scheduled_at desc);

alter table public.workouts enable row level security;

-- Least privilege: no anon; signed-in members read their own workouts and may set only their check-in column.
revoke all on public.workouts from anon;
revoke all on public.workouts from authenticated;
grant select on public.workouts to authenticated;
grant update (host_checked_in_at, guest_checked_in_at) on public.workouts to authenticated;

create policy workouts_select_participants on public.workouts
  for select to authenticated
  using ((select auth.uid()) in (host_id, guest_id));
create policy workouts_update_participants on public.workouts
  for update to authenticated
  using ((select auth.uid()) in (host_id, guest_id))
  with check ((select auth.uid()) in (host_id, guest_id));

-- Check-in guard: only your own column, once, stamped with the server clock, inside the time window.
create function public.workouts_guard_update()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
begin
  if new.id is distinct from old.id
     or new.host_id is distinct from old.host_id
     or new.guest_id is distinct from old.guest_id
     or new.activity is distinct from old.activity
     or new.location is distinct from old.location
     or new.scheduled_at is distinct from old.scheduled_at
     or new.created_at is distinct from old.created_at then
    raise exception 'only the check-in can change';
  end if;
  if me = old.host_id and new.guest_checked_in_at is distinct from old.guest_checked_in_at then
    raise exception 'you can only check yourself in';
  end if;
  if me = old.guest_id and new.host_checked_in_at is distinct from old.host_checked_in_at then
    raise exception 'you can only check yourself in';
  end if;
  if me = old.host_id and new.host_checked_in_at is distinct from old.host_checked_in_at then
    if old.host_checked_in_at is not null or new.host_checked_in_at is null then
      raise exception 'already checked in';
    end if;
    new.host_checked_in_at := now();
  end if;
  if me = old.guest_id and new.guest_checked_in_at is distinct from old.guest_checked_in_at then
    if old.guest_checked_in_at is not null or new.guest_checked_in_at is null then
      raise exception 'already checked in';
    end if;
    new.guest_checked_in_at := now();
  end if;
  if now() < old.scheduled_at - interval '3 hours' or now() > old.scheduled_at + interval '24 hours' then
    raise exception 'check-in is open from 3 hours before the start until 24 hours after';
  end if;
  return new;
end;
$$;
revoke execute on function public.workouts_guard_update() from public, anon, authenticated;
create trigger workouts_guard_update
  before update on public.workouts
  for each row execute function public.workouts_guard_update();

-- Creates the shared workout when the recipient accepts an invitation. SECURITY DEFINER because members
-- have no INSERT right on workouts; it lives in the private schema (not reachable through the API),
-- reads only the invitation row that was just updated, and nobody has EXECUTE on it.
create function private.messages_create_workout()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  conv public.conversations;
begin
  if new.kind = 'invite'
     and (old.invite ->> 'status') = 'pending'
     and (new.invite ->> 'status') = 'accepted' then
    select * into conv from public.conversations c where c.id = new.conversation_id;
    insert into public.workouts (id, host_id, guest_id, activity, location, scheduled_at)
    values (
      new.id,
      new.sender_id,
      case when conv.user_a = new.sender_id then conv.user_b else conv.user_a end,
      new.invite ->> 'activity',
      new.invite ->> 'location',
      (new.invite ->> 'scheduledAt')::timestamptz
    )
    on conflict (id) do nothing;
  end if;
  return new;
end;
$$;
revoke execute on function private.messages_create_workout() from public, anon, authenticated;
create trigger messages_create_workout
  after update on public.messages
  for each row execute function private.messages_create_workout();
