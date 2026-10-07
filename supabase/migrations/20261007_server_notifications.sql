-- Applied to the `duofit` Supabase project on 2026-10-07 (server_notifications).
-- Notifications on the server (issue #65, stage 8). Only the database writes rows (through triggers);
-- a member reads their own, marks them read and deletes them. Blocked pairs never notify each other.

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('invite_received', 'invite_accepted', 'invite_declined', 'workout_cancelled', 'post_comment')),
  actor_id uuid references public.profiles (id) on delete set null,
  ref_id uuid,
  body text check (body is null or char_length(body) <= 200),
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_created_idx on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

revoke all on public.notifications from anon;
revoke all on public.notifications from authenticated;
grant select, delete on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;

create policy notifications_select_own on public.notifications
  for select to authenticated using (user_id = (select auth.uid()));
create policy notifications_update_own on public.notifications
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy notifications_delete_own on public.notifications
  for delete to authenticated using (user_id = (select auth.uid()));

-- Marking as read is stamped by the server and cannot be undone.
create function public.notifications_stamp_read()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.read_at := coalesce(old.read_at, case when new.read_at is null then null else now() end);
  return new;
end;
$$;
revoke execute on function public.notifications_stamp_read() from public, anon, authenticated;
create trigger notifications_stamp_read
  before update on public.notifications
  for each row execute function public.notifications_stamp_read();

alter publication supabase_realtime add table public.notifications;

-- ---------------------------------------------------------------------------------------------
-- The only way rows get created: a helper in the private schema (not reachable through the API,
-- nobody has EXECUTE) used by the triggers below. It never raises, so a notification problem can
-- never block sending an invitation or a comment, and it keeps the newest 200 rows per member.
-- ---------------------------------------------------------------------------------------------
create function private.notify(p_user uuid, p_kind text, p_actor uuid, p_ref uuid, p_body text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_user is null or p_user is not distinct from p_actor then
    return;
  end if;
  insert into public.notifications (user_id, kind, actor_id, ref_id, body)
  values (p_user, p_kind, p_actor, p_ref, left(p_body, 200));
  delete from public.notifications n
  where n.user_id = p_user
    and n.id in (
      select id from public.notifications
      where user_id = p_user
      order by created_at desc
      offset 200
    );
exception when others then
  null;
end;
$$;
revoke execute on function private.notify(uuid, text, uuid, uuid, text) from public, anon, authenticated;

-- Invitation sent -> the other member; invitation answered -> the member who sent it.
create function private.messages_notify()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  conv public.conversations;
  other uuid;
  label text;
begin
  if new.kind is distinct from 'invite' then
    return new;
  end if;
  select * into conv from public.conversations c where c.id = new.conversation_id;
  label := (new.invite ->> 'activity') || ' · ' || (new.invite ->> 'location');

  if tg_op = 'INSERT' then
    other := case when conv.user_a = new.sender_id then conv.user_b else conv.user_a end;
    if not private.blocked_between(other) then
      perform private.notify(other, 'invite_received', new.sender_id, new.id, label);
    end if;
  elsif (old.invite ->> 'status') = 'pending' and (new.invite ->> 'status') in ('accepted', 'declined') then
    other := case when conv.user_a = new.sender_id then conv.user_b else conv.user_a end;
    -- the answering member is the one who is NOT the sender
    perform private.notify(
      new.sender_id,
      case when (new.invite ->> 'status') = 'accepted' then 'invite_accepted' else 'invite_declined' end,
      other,
      new.id,
      label
    );
  end if;
  return new;
end;
$$;
revoke execute on function private.messages_notify() from public, anon, authenticated;
create trigger messages_notify_insert
  after insert on public.messages
  for each row execute function private.messages_notify();
create trigger messages_notify_update
  after update on public.messages
  for each row execute function private.messages_notify();

-- Workout cancelled -> the other member.
create function private.workouts_notify_cancel()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.cancelled_at is null and new.cancelled_at is not null and new.cancelled_by is not null then
    perform private.notify(
      case when new.cancelled_by = new.host_id then new.guest_id else new.host_id end,
      'workout_cancelled',
      new.cancelled_by,
      new.id,
      new.activity || ' · ' || new.location
    );
  end if;
  return new;
end;
$$;
revoke execute on function private.workouts_notify_cancel() from public, anon, authenticated;
create trigger workouts_notify_cancel
  after update of cancelled_at on public.workouts
  for each row execute function private.workouts_notify_cancel();

-- Comment -> the post's author (not for own comments, not between blocked members).
create function private.comments_notify()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  author uuid;
begin
  select p.user_id into author from public.posts p where p.id = new.post_id;
  if author is not null and not private.blocked_between(author) then
    perform private.notify(author, 'post_comment', new.user_id, new.post_id, new.body);
  end if;
  return new;
end;
$$;
revoke execute on function private.comments_notify() from public, anon, authenticated;
create trigger comments_notify
  after insert on public.comments
  for each row execute function private.comments_notify();
