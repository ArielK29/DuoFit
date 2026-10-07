-- Applied to the `duofit` Supabase project on 2026-10-07 (server_notifications_hardening).
-- Review findings for the notifications:
--  * flood protection: at most 5 UNREAD notifications of the same kind from the same member, and the
--    "keep the newest 200" trim removes read rows and comment pings first, never unread invitations/cancellations;
--  * blocked pairs are silent on every path (answering an invitation and cancelling a workout too);
--  * the text of a comment is removed from the post owner's list when the comment/post is deleted, and a
--    notification disappears with the member who caused it (account deletion);
--  * a failure inside the helper is no longer silent (it is logged as a warning, and still never blocks the action).

alter table public.notifications drop constraint notifications_actor_id_fkey;
alter table public.notifications
  add constraint notifications_actor_id_fkey foreign key (actor_id) references public.profiles (id) on delete cascade;

create or replace function private.notify(p_user uuid, p_kind text, p_actor uuid, p_ref uuid, p_body text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  excess int;
begin
  if p_user is null or p_user is not distinct from p_actor then
    return;
  end if;
  if p_actor is not null
     and (select count(*) from public.notifications n
          where n.user_id = p_user and n.actor_id = p_actor and n.kind = p_kind and n.read_at is null) >= 5 then
    return;
  end if;
  insert into public.notifications (user_id, kind, actor_id, ref_id, body)
  values (p_user, p_kind, p_actor, p_ref, left(p_body, 200));
  select greatest(count(*) - 200, 0) into excess from public.notifications where user_id = p_user;
  if excess > 0 then
    delete from public.notifications
    where id in (
      select id from public.notifications
      where user_id = p_user
      order by (kind <> 'post_comment' and read_at is null) asc, created_at asc
      limit excess
    );
  end if;
exception when others then
  raise warning 'private.notify failed: %', sqlerrm;
end;
$$;
revoke execute on function private.notify(uuid, text, uuid, uuid, text) from public, anon, authenticated;

create or replace function private.messages_notify()
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
  other := case when conv.user_a = new.sender_id then conv.user_b else conv.user_a end;

  if tg_op = 'INSERT' then
    -- the signed-in member is the sender
    if not private.blocked_between(other) then
      perform private.notify(other, 'invite_received', new.sender_id, new.id, label);
    end if;
  elsif (old.invite ->> 'status') = 'pending' and (new.invite ->> 'status') in ('accepted', 'declined') then
    -- the signed-in member is the one answering; the person to tell is the sender
    if not private.blocked_between(new.sender_id) then
      perform private.notify(
        new.sender_id,
        case when (new.invite ->> 'status') = 'accepted' then 'invite_accepted' else 'invite_declined' end,
        other,
        new.id,
        label
      );
    end if;
  end if;
  return new;
end;
$$;
revoke execute on function private.messages_notify() from public, anon, authenticated;

create or replace function private.workouts_notify_cancel()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  recipient uuid;
begin
  if old.cancelled_at is null and new.cancelled_at is not null and new.cancelled_by is not null then
    recipient := case when new.cancelled_by = new.host_id then new.guest_id else new.host_id end;
    -- the signed-in member is the one cancelling
    if recipient is not null and not private.blocked_between(recipient) then
      perform private.notify(recipient, 'workout_cancelled', new.cancelled_by, new.id, new.activity || ' · ' || new.location);
    end if;
  end if;
  return new;
end;
$$;
revoke execute on function private.workouts_notify_cancel() from public, anon, authenticated;

-- A comment ping disappears with its comment (or its post).
create function private.comments_unnotify()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.notifications
  where kind = 'post_comment' and ref_id = old.post_id and actor_id = old.user_id
    and body is not distinct from left(old.body, 200);
  return old;
end;
$$;
revoke execute on function private.comments_unnotify() from public, anon, authenticated;
create trigger comments_unnotify
  after delete on public.comments
  for each row execute function private.comments_unnotify();

create function private.posts_unnotify()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.notifications where kind = 'post_comment' and ref_id = old.id;
  return old;
end;
$$;
revoke execute on function private.posts_unnotify() from public, anon, authenticated;
create trigger posts_unnotify
  after delete on public.posts
  for each row execute function private.posts_unnotify();
