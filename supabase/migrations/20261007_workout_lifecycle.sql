-- Applied to the `duofit` Supabase project on 2026-10-07 (workout_lifecycle).
-- Two gaps left by the shared workouts stage:
--  1. When one member deletes their account, the OTHER member keeps the workout (and their own check-in):
--     host_id / guest_id are cleared (set null) instead of deleting the row; a row with nobody left is removed.
--  2. Cancelling: either member can cancel a workout before it starts (not after anyone checked in). The server
--     stamps who cancelled and when. To change the time, cancel and send a new invitation.

alter table public.workouts alter column host_id drop not null;
alter table public.workouts alter column guest_id drop not null;
alter table public.workouts drop constraint workouts_host_id_fkey;
alter table public.workouts drop constraint workouts_guest_id_fkey;
alter table public.workouts
  add constraint workouts_host_id_fkey foreign key (host_id) references public.profiles (id) on delete set null;
alter table public.workouts
  add constraint workouts_guest_id_fkey foreign key (guest_id) references public.profiles (id) on delete set null;

alter table public.workouts add column cancelled_at timestamptz;
alter table public.workouts add column cancelled_by uuid references public.profiles (id) on delete set null;
grant update (cancelled_at) on public.workouts to authenticated;

-- A workout nobody belongs to any more is removed (runs after the account-deletion cascade).
create function public.workouts_cleanup_orphans()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.host_id is null and new.guest_id is null then
    delete from public.workouts where id = new.id;
  end if;
  return null;
end;
$$;
revoke execute on function public.workouts_cleanup_orphans() from public, anon, authenticated;
create trigger workouts_cleanup_orphans
  after update of host_id, guest_id on public.workouts
  for each row execute function public.workouts_cleanup_orphans();

-- Guard: members may only check themself in (once, inside the window) or cancel (once, before the start,
-- if nobody checked in). Updates that are not made by a signed-in member (the account-deletion cascade) pass.
create or replace function public.workouts_guard_update()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
  checkin_changed boolean;
  cancel_changed boolean;
begin
  -- Not a signed-in member (the account-deletion cascade runs as the table owner): nothing to guard.
  if me is null or current_user not in ('authenticated', 'anon') then
    return new;
  end if;

  if new.id is distinct from old.id
     or new.host_id is distinct from old.host_id
     or new.guest_id is distinct from old.guest_id
     or new.activity is distinct from old.activity
     or new.location is distinct from old.location
     or new.scheduled_at is distinct from old.scheduled_at
     or new.created_at is distinct from old.created_at then
    raise exception 'only the check-in or the cancellation can change';
  end if;

  checkin_changed := new.host_checked_in_at is distinct from old.host_checked_in_at
                  or new.guest_checked_in_at is distinct from old.guest_checked_in_at;
  cancel_changed := new.cancelled_at is distinct from old.cancelled_at;

  if checkin_changed and cancel_changed then
    raise exception 'one change at a time';
  end if;
  if new.cancelled_by is distinct from old.cancelled_by then
    raise exception 'cancelled_by is set by the server';
  end if;

  if cancel_changed then
    if old.cancelled_at is not null or new.cancelled_at is null then
      raise exception 'already cancelled';
    end if;
    if old.host_checked_in_at is not null or old.guest_checked_in_at is not null then
      raise exception 'cannot cancel after a check-in';
    end if;
    if now() >= old.scheduled_at then
      raise exception 'cannot cancel after the start';
    end if;
    new.cancelled_at := now();
    new.cancelled_by := me;
    return new;
  end if;

  if checkin_changed then
    if old.cancelled_at is not null then
      raise exception 'workout is cancelled';
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
  end if;
  return new;
end;
$$;
revoke execute on function public.workouts_guard_update() from public, anon, authenticated;
