-- Applied to the `duofit` Supabase project on 2026-10-07 (chat_hardening).
-- Fixes found by the code review of the chat tables.

-- 1. The server decides when a message was created (clients could forge created_at and pin
--    a message to the top of someone's list forever). Clients may only set these columns.
revoke insert on public.messages from authenticated;
grant insert (id, conversation_id, kind, body, invite) on public.messages to authenticated;

-- 2. Validate every new message: a new invitation must be pending (no forged "accepted"
--    invites), sensible sizes and a real date; plus basic anti-spam limits.
create function public.messages_validate_insert()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.kind = 'invite' then
    if (new.invite ->> 'status') is distinct from 'pending' then
      raise exception 'a new invitation must be pending';
    end if;
    if coalesce(length(new.invite ->> 'activity'), 0) not between 1 and 100
       or coalesce(length(new.invite ->> 'location'), 0) not between 1 and 100 then
      raise exception 'invitation activity and location must be 1-100 characters';
    end if;
    begin
      perform (new.invite ->> 'scheduledAt')::timestamptz;
    exception when others then
      raise exception 'invitation scheduledAt is not a valid date';
    end;
    if octet_length(new.invite::text) > 1000 then
      raise exception 'invitation is too large';
    end if;
  end if;

  -- At most 30 messages per minute per person.
  if (select count(*) from public.messages m
      where m.sender_id = new.sender_id and m.created_at > now() - interval '1 minute') >= 30 then
    raise exception 'too many messages, slow down';
  end if;

  -- Nobody can send more than 10 messages to someone who never answered.
  if not exists (select 1 from public.messages m
                 where m.conversation_id = new.conversation_id and m.sender_id <> new.sender_id)
     and (select count(*) from public.messages m
          where m.conversation_id = new.conversation_id and m.sender_id = new.sender_id) >= 10 then
    raise exception 'wait for a reply before sending more messages';
  end if;

  return new;
end;
$$;
revoke execute on function public.messages_validate_insert() from public, anon, authenticated;
create trigger messages_validate_insert
  before insert on public.messages
  for each row execute function public.messages_validate_insert();

-- 3. Answering an invitation: the status must be present and be accepted/declined
--    (NULL logic let a recipient delete the status key).
create or replace function public.messages_guard_invite_update()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.id is distinct from old.id
     or new.conversation_id is distinct from old.conversation_id
     or new.sender_id is distinct from old.sender_id
     or new.kind is distinct from old.kind
     or new.body is distinct from old.body
     or new.created_at is distinct from old.created_at then
    raise exception 'only the invitation status can change';
  end if;
  if (new.invite - 'status') is distinct from (old.invite - 'status') then
    raise exception 'only the invitation status can change';
  end if;
  if old.invite ->> 'status' is distinct from 'pending'
     or coalesce(new.invite ->> 'status', '') not in ('accepted', 'declined') then
    raise exception 'an invitation can only be answered once (accepted or declined)';
  end if;
  return new;
end;
$$;

-- 4. Read markers always use the server clock, and can only point at your own conversations.
create function public.conversation_reads_touch()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.last_read_at := now();
  return new;
end;
$$;
revoke execute on function public.conversation_reads_touch() from public, anon, authenticated;
create trigger conversation_reads_touch
  before insert or update on public.conversation_reads
  for each row execute function public.conversation_reads_touch();

drop policy conversation_reads_update_own on public.conversation_reads;
create policy conversation_reads_update_own on public.conversation_reads
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_reads.conversation_id and (select auth.uid()) in (c.user_a, c.user_b)
    )
  );
