-- Applied to the `duofit` Supabase project on 2026-10-20 (chat_block_and_report) after the owner approved. Security advisors: only the known leaked-password warning.
-- Test (rolled back, 20 of 20 good before and after applying): supabase/tests/rls_chat_block_report_test.sql.
-- Apple guideline 1.2 asks for "mechanisms to report offensive content" and the "ability to block abusive users".
-- Both existed for the community feed and the group chats, but NOT for the private one-to-one chat:
--  * a member blocked in the community could still write to the person who blocked them;
--  * a private message could not be reported.
-- This migration closes both, with the same rules as the groups:
--  1. A block hides the one-to-one chat BOTH ways (neither side reads what the other writes, the chat leaves both lists)
--     and nobody can start or continue a chat with a blocked person. (The conversation and its messages disappear for both while the block lasts and come back after an unblock.)
--  2. A private message can be reported by the OTHER member of the conversation (never by its writer); the report hides it
--     from the reporter at once. The owner reads reports with the query in docs/MODERATION.md.

-- ---------------------------------------------------------------------------------------------
-- 1. Reports can also point at a private message
-- ---------------------------------------------------------------------------------------------
alter table public.content_reports add column message_id uuid references public.messages (id) on delete cascade;
alter table public.content_reports drop constraint content_reports_target_check;
alter table public.content_reports
  add constraint content_reports_target_check
  check ((post_id is not null)::int + (comment_id is not null)::int + (group_message_id is not null)::int + (message_id is not null)::int = 1);
alter table public.content_reports add constraint content_reports_reporter_message_key unique (reporter_id, message_id);
create index content_reports_message_idx on public.content_reports (message_id) where message_id is not null;
grant insert (message_id) on public.content_reports to authenticated;

-- ---------------------------------------------------------------------------------------------
-- 2. Helpers (private schema, not reachable through the API)
-- ---------------------------------------------------------------------------------------------
-- The other member of a conversation the signed-in member belongs to (null when the member is not in it).
create function private.conversation_other(cid uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select case when c.user_a = (select auth.uid()) then c.user_b else c.user_a end
  from public.conversations c
  where c.id = cid and (select auth.uid()) in (c.user_a, c.user_b);
$$;
revoke execute on function private.conversation_other(uuid) from public, anon;
grant execute on function private.conversation_other(uuid) to authenticated;

-- A message may be reported by the member who READS it: a member of its conversation who did not write it.
create function private.can_report_message(mid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.messages m
    join public.conversations c on c.id = m.conversation_id
    where m.id = mid
      and m.sender_id <> (select auth.uid())
      and (select auth.uid()) in (c.user_a, c.user_b)
  );
$$;
revoke execute on function private.can_report_message(uuid) from public, anon;
grant execute on function private.can_report_message(uuid) to authenticated;

-- The reporter has reported this message (used by the messages policy: a policy on messages that read content_reports
-- directly would be subject to content_reports' own policies).
create function private.i_reported_message(mid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.content_reports r
    where r.message_id = mid and r.reporter_id = (select auth.uid())
  );
$$;
revoke execute on function private.i_reported_message(uuid) from public, anon;
grant execute on function private.i_reported_message(uuid) to authenticated;

-- ---------------------------------------------------------------------------------------------
-- 3. Policies
-- ---------------------------------------------------------------------------------------------
drop policy content_reports_insert_own on public.content_reports;
create policy content_reports_insert_own on public.content_reports
  for insert to authenticated
  with check (
    reporter_id = (select auth.uid())
    and (group_message_id is null or private.can_report_group_message(group_message_id))
    and (message_id is null or private.can_report_message(message_id))
  );

-- A blocked pair does not see each other's conversation, and cannot start one.
drop policy conversations_select_members on public.conversations;
create policy conversations_select_members on public.conversations
  for select to authenticated
  using (
    (select auth.uid()) in (user_a, user_b)
    and not private.blocked_between(case when user_a = (select auth.uid()) then user_b else user_a end)
  );
drop policy conversations_insert_member on public.conversations;
create policy conversations_insert_member on public.conversations
  for insert to authenticated
  with check (
    (select auth.uid()) in (user_a, user_b)
    and not private.blocked_between(case when user_a = (select auth.uid()) then user_b else user_a end)
  );

-- Reading: my own messages always; the other member's unless blocked either way or reported by me.
drop policy messages_select_members on public.messages;
create policy messages_select_members on public.messages
  for select to authenticated
  using (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id and (select auth.uid()) in (c.user_a, c.user_b)
    )
    and (
      sender_id = (select auth.uid())
      or (not private.blocked_between(sender_id) and not private.i_reported_message(id))
    )
  );

-- Writing: no new messages into a conversation with a blocked person.
drop policy messages_insert_member on public.messages;
create policy messages_insert_member on public.messages
  for insert to authenticated
  with check (
    sender_id = (select auth.uid())
    and private.conversation_other(conversation_id) is not null
    and not private.blocked_between(private.conversation_other(conversation_id))
  );
