-- Applied to the `duofit` Supabase project on 2026-10-07 (groups).
-- Community groups with a group chat (issue #65, stage 9).
--  * any signed-in member can see the group directory (name, activity, member count) and create a group;
--  * joining is open, leaving is free; the group disappears when its last member leaves;
--  * only members read and write the group chat; blocked members' messages are hidden both ways;
--    a message reported by 3 members is hidden for everybody except its sender; reports reuse content_reports;
--  * limits: 3 groups created, 20 groups joined, 200 members per group, 20 messages per minute.

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 60),
  activity text not null check (activity in ('כוח', 'ריצה', 'קליסטניקס', 'כדורסל', 'יוגה')),
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  member_count integer not null default 0,
  created_at timestamptz not null default now()
);
create index groups_created_idx on public.groups (created_at desc);
create index groups_creator_idx on public.groups (created_by);

create table public.group_members (
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);
create index group_members_user_idx on public.group_members (user_id);

create table public.group_messages (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  sender_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index group_messages_group_idx on public.group_messages (group_id, created_at);
create index group_messages_sender_idx on public.group_messages (sender_id, created_at desc);

alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.group_messages enable row level security;

-- ---------------------------------------------------------------------------------------------
-- Reports can also point at a group message
-- ---------------------------------------------------------------------------------------------
alter table public.content_reports add column group_message_id uuid references public.group_messages (id) on delete cascade;
alter table public.content_reports drop constraint content_reports_check;
alter table public.content_reports
  add constraint content_reports_target_check
  check ((post_id is not null)::int + (comment_id is not null)::int + (group_message_id is not null)::int = 1);
alter table public.content_reports add constraint content_reports_reporter_group_message_key unique (reporter_id, group_message_id);
create index content_reports_group_message_idx on public.content_reports (group_message_id) where group_message_id is not null;
grant insert (group_message_id) on public.content_reports to authenticated;

-- ---------------------------------------------------------------------------------------------
-- Helpers (private schema, not reachable through the API)
-- ---------------------------------------------------------------------------------------------
create function private.is_group_member(gid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.group_members m
    where m.group_id = gid and m.user_id = (select auth.uid())
  );
$$;
revoke execute on function private.is_group_member(uuid) from public, anon;
grant execute on function private.is_group_member(uuid) to authenticated;

create function private.group_message_report_count(mid uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::int from public.content_reports r where r.group_message_id = mid;
$$;
revoke execute on function private.group_message_report_count(uuid) from public, anon;
grant execute on function private.group_message_report_count(uuid) to authenticated;

-- ---------------------------------------------------------------------------------------------
-- Privileges and policies
-- ---------------------------------------------------------------------------------------------
revoke all on public.groups, public.group_members, public.group_messages from anon;
revoke all on public.groups, public.group_members, public.group_messages from authenticated;

-- The directory shows only these columns (never who created a group).
grant select (id, name, activity, member_count, created_at) on public.groups to authenticated;
grant insert (name, activity) on public.groups to authenticated;
grant select, delete on public.group_members to authenticated;
grant insert (group_id) on public.group_members to authenticated;
grant select, delete on public.group_messages to authenticated;
grant insert (id, group_id, body) on public.group_messages to authenticated;

-- Group directory: deliberately readable by every signed-in member (so people can find groups to join).
create policy groups_select_directory on public.groups
  for select to authenticated using (true);
create policy groups_insert_own on public.groups
  for insert to authenticated with check (created_by = (select auth.uid()));

create policy group_members_select_same_group on public.group_members
  for select to authenticated
  using (user_id = (select auth.uid()) or private.is_group_member(group_id));
create policy group_members_insert_self on public.group_members
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy group_members_delete_self on public.group_members
  for delete to authenticated using (user_id = (select auth.uid()));

create policy group_messages_select_members on public.group_messages
  for select to authenticated
  using (
    private.is_group_member(group_id)
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
create policy group_messages_insert_members on public.group_messages
  for insert to authenticated
  with check (sender_id = (select auth.uid()) and private.is_group_member(group_id));
create policy group_messages_delete_own on public.group_messages
  for delete to authenticated using (sender_id = (select auth.uid()));

-- ---------------------------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------------------------
-- Limits (SECURITY INVOKER, per-member advisory lock so parallel requests cannot all pass the count).
create function public.groups_limits()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if tg_table_name = 'groups' then
    perform pg_advisory_xact_lock(hashtext('groups:' || new.created_by::text));
    if (select count(*) from public.groups g where g.created_by = new.created_by) >= 3 then
      raise exception 'you can create at most 3 groups';
    end if;
  elsif tg_table_name = 'group_members' then
    perform pg_advisory_xact_lock(hashtext('joins:' || new.user_id::text));
    if (select count(*) from public.group_members m where m.user_id = new.user_id) >= 20 then
      raise exception 'you can be in at most 20 groups';
    end if;
    if coalesce((select g.member_count from public.groups g where g.id = new.group_id), 0) >= 200 then
      raise exception 'this group is full';
    end if;
  elsif tg_table_name = 'group_messages' then
    perform pg_advisory_xact_lock(hashtext('gmsgs:' || new.sender_id::text));
    if (select count(*) from public.group_messages x where x.sender_id = new.sender_id and x.created_at > now() - interval '1 minute') >= 20 then
      raise exception 'too many messages, slow down';
    end if;
  end if;
  return new;
end;
$$;
revoke execute on function public.groups_limits() from public, anon, authenticated;
create trigger groups_limits before insert on public.groups
  for each row execute function public.groups_limits();
create trigger group_members_limits before insert on public.group_members
  for each row execute function public.groups_limits();
create trigger group_messages_limits before insert on public.group_messages
  for each row execute function public.groups_limits();

-- The creator is the first member (members have no other way to be added by someone else).
create function private.groups_add_creator()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.created_by is not null then
    insert into public.group_members (group_id, user_id) values (new.id, new.created_by);
  end if;
  return new;
end;
$$;
revoke execute on function private.groups_add_creator() from public, anon, authenticated;
create trigger groups_add_creator after insert on public.groups
  for each row execute function private.groups_add_creator();

-- Keeps groups.member_count right and removes a group when its last member leaves.
create function private.group_members_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.groups set member_count = member_count + 1 where id = new.group_id;
  else
    update public.groups set member_count = greatest(member_count - 1, 0) where id = old.group_id;
    delete from public.groups g where g.id = old.group_id and g.member_count <= 0;
  end if;
  return null;
end;
$$;
revoke execute on function private.group_members_count() from public, anon, authenticated;
create trigger group_members_count after insert or delete on public.group_members
  for each row execute function private.group_members_count();

-- Live delivery of group messages to members (RLS decides who receives which row).
alter publication supabase_realtime add table public.group_messages;
