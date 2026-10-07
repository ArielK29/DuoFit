-- Hardening checks for groups (history, roster columns, reports, churn limit, names, 200-member cap).
-- Throw-away users in a transaction; ends with an exception so NOTHING is kept.
do $$
declare
  a uuid := '00000000-0000-0000-0000-0000000000e4';
  b uuid := '00000000-0000-0000-0000-0000000000e5';
  c uuid := '00000000-0000-0000-0000-0000000000e6';
  g uuid;
  m1 uuid := gen_random_uuid();
  res text := '';
  n int;
begin
  insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at)
  select x, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', x::text || '@test.invalid', '{"display_name":"T"}'::jsonb, now(), now()
  from unnest(array[a, b, c]) as x;

  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.groups (name, activity) values ('קבוצת בדיקה', 'כוח') returning id into g;
  insert into public.group_messages (id, group_id, body) values (m1, g, 'old message');
  begin
    insert into public.groups (name, activity) values ('שם' || chr(8238) || 'נסתר', 'כוח');
    res := res || '1 a group name with a direction-override character: ALLOWED (BAD)' || E'\n';
  exception when others then
    res := res || '1 a group name with a direction-override character: blocked (good)' || E'\n';
  end;
  reset role;

  -- the message is older than b's membership
  update public.group_messages set created_at = now() - interval '1 day' where id = m1;
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.group_members (group_id) values (g);
  select count(*) into n from public.group_messages where id = m1;
  res := res || '2 a new member does not see older messages (expect 0): ' || n || E'\n';
  begin
    perform joined_at from public.group_members where group_id = g;
    res := res || '3 a member reads joined_at: ALLOWED (BAD)' || E'\n';
  exception when others then
    res := res || '3 a member reads joined_at: denied (good)' || E'\n';
  end;
  select count(*) into n from public.group_members where group_id = g;
  res := res || '4 the roster still lists the members (expect 2): ' || n || E'\n';
  reset role;

  -- c is not a member: cannot report a message in the group
  perform set_config('request.jwt.claims', json_build_object('sub', c, 'role', 'authenticated')::text, true);
  set local role authenticated;
  begin
    insert into public.content_reports (group_message_id, reason) values (m1, 'spam');
    res := res || '5 a non-member reports a group message: ALLOWED (BAD)' || E'\n';
  exception when others then
    res := res || '5 a non-member reports a group message: blocked (good)' || E'\n';
  end;
  begin
    insert into public.content_reports (post_id, reason) values (gen_random_uuid(), 'spam');
    res := res || '6 a report for something that does not exist: ALLOWED (BAD)' || E'\n';
  exception when others then
    res := res || '6 a report for something that does not exist: blocked (good)' || E'\n';
  end;
  reset role;

  -- churn: a creates 2 more groups (3 in total), leaves them all; a 4th is still refused
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.groups (name, activity) values ('קבוצה ב', 'כוח'), ('קבוצה ג', 'כוח');
  delete from public.group_members where user_id = a;
  select count(*) into n from public.groups where name in ('קבוצה ב', 'קבוצה ג');
  res := res || '7 groups with nobody left are gone (expect 0): ' || n || E'\n';
  begin
    insert into public.groups (name, activity) values ('קבוצה ד', 'כוח');
    res := res || '8 create-leave-create churn: ALLOWED (BAD)' || E'\n';
  exception when others then
    res := res || '8 create-leave-create churn: blocked (good)' || E'\n';
  end;
  reset role;

  -- 200-member cap enforced by the counting trigger itself
  update public.groups set member_count = 200 where id = g;
  perform set_config('request.jwt.claims', json_build_object('sub', c, 'role', 'authenticated')::text, true);
  set local role authenticated;
  begin
    insert into public.group_members (group_id) values (g);
    res := res || '9 joining a full group: ALLOWED (BAD)' || E'\n';
  exception when others then
    res := res || '9 joining a full group: blocked (good)' || E'\n';
  end;
  reset role;

  raise exception E'RLS_GROUPS_HARDENING_RESULTS\n%', res;
end $$;
