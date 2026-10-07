-- Applied to the `duofit` Supabase project on 2026-10-07 (groups_fix).
-- The limit trigger counted a member's groups by reading groups.created_by, a column members are not allowed
-- to read (the directory never shows who created a group). Count through a private helper instead.

create function private.groups_created_count(uid uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::int from public.groups g where g.created_by = uid;
$$;
revoke execute on function private.groups_created_count(uuid) from public, anon, authenticated;
grant execute on function private.groups_created_count(uuid) to authenticated;

create or replace function public.groups_limits()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if tg_table_name = 'groups' then
    perform pg_advisory_xact_lock(hashtext('groups:' || new.created_by::text));
    if private.groups_created_count(new.created_by) >= 3 then
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
