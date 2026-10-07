-- Applied to the `duofit` Supabase project on 2026-10-08 (groups_hardening).
-- Review findings for the groups:
--  * a new member no longer reads the chat history from before they joined;
--  * the roster shows only who is in the group (not when they joined), so the creator cannot be spotted;
--  * the 200-member cap is enforced inside the counting trigger (no race); group creation is limited per week
--    by a log that survives deleting a group (create/leave/create churn); group names cannot hide behind
--    invisible or direction-changing characters;
--  * a report about a group message must come from a member who can see it.

-- 1. Roster columns
revoke select on public.group_members from authenticated;
grant select (group_id, user_id) on public.group_members to authenticated;

-- 2. Chat history starts when the member joined
create function private.is_group_member_since(gid uuid, ts timestamptz)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.group_members m
    where m.group_id = gid and m.user_id = (select auth.uid()) and m.joined_at <= ts
  );
$$;
revoke execute on function private.is_group_member_since(uuid, timestamptz) from public, anon;
grant execute on function private.is_group_member_since(uuid, timestamptz) to authenticated;

drop policy group_messages_select_members on public.group_messages;
create policy group_messages_select_members on public.group_messages
  for select to authenticated
  using (
    private.is_group_member_since(group_id, created_at)
    and (
      sender_id = (select auth.uid())
      or (
        not private.blocked_between(sender_id)
        and private.group_message_report_count(id) < 3
        and not exists (
          select 1 from public.content_reports r
          where r.group_message_id = group_messages.id and r.reporter_id = (select auth.uid())
        )
      )
    )
  );

-- 3. A group-message report must come from a member who can see that message (and not about their own
--    message). The check is a private helper: a policy on content_reports that read group_messages directly
--    would loop (group_messages' own policy reads content_reports).
create function private.can_report_group_message(mid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.group_messages m
    where m.id = mid
      and m.sender_id <> (select auth.uid())
      and private.is_group_member_since(m.group_id, m.created_at)
  );
$$;
revoke execute on function private.can_report_group_message(uuid) from public, anon;
grant execute on function private.can_report_group_message(uuid) to authenticated;

drop policy content_reports_insert_own on public.content_reports;
create policy content_reports_insert_own on public.content_reports
  for insert to authenticated
  with check (
    reporter_id = (select auth.uid())
    and (group_message_id is null or private.can_report_group_message(group_message_id))
  );

-- 4. Member cap without a race (the count update is serialized by the row lock)
create or replace function private.group_members_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_count integer;
begin
  if tg_op = 'INSERT' then
    update public.groups set member_count = member_count + 1 where id = new.group_id returning member_count into new_count;
    if new_count > 200 then
      raise exception 'this group is full';
    end if;
  else
    update public.groups set member_count = greatest(member_count - 1, 0) where id = old.group_id;
    delete from public.groups g where g.id = old.group_id and g.member_count <= 0;
  end if;
  return null;
end;
$$;
revoke execute on function private.group_members_count() from public, anon, authenticated;

-- 5. Group creation: at most 3 per rolling 7 days, counted from a log that outlives the group
create table private.group_creations (
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);
create index group_creations_user_idx on private.group_creations (user_id, created_at desc);
revoke all on private.group_creations from public, anon, authenticated;

insert into private.group_creations (user_id, created_at)
select created_by, created_at from public.groups where created_by is not null;

create or replace function private.groups_created_count(uid uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::int from private.group_creations c where c.user_id = uid and c.created_at > now() - interval '7 days';
$$;
revoke execute on function private.groups_created_count(uuid) from public, anon, authenticated;
grant execute on function private.groups_created_count(uuid) to authenticated;

create or replace function private.groups_add_creator()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.created_by is not null then
    insert into private.group_creations (user_id) values (new.created_by);
    insert into public.group_members (group_id, user_id) values (new.id, new.created_by);
  end if;
  return new;
end;
$$;
revoke execute on function private.groups_add_creator() from public, anon, authenticated;

-- 6. Names without invisible / direction-changing characters
alter table public.groups
  add constraint groups_name_visible check (name !~ '[​-‏‪-‮⁦-⁩﻿]');
