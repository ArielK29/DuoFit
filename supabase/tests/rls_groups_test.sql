-- RLS test for groups, members and the group chat. Five throw-away users in a transaction; ends with an
-- exception so NOTHING is kept. Every line must say good/ok or match "expect".
do $$
declare
  a uuid := '00000000-0000-0000-0000-0000000000d1';
  b uuid := '00000000-0000-0000-0000-0000000000d2';
  c uuid := '00000000-0000-0000-0000-0000000000d3';
  d uuid := '00000000-0000-0000-0000-0000000000d4';
  e uuid := '00000000-0000-0000-0000-0000000000d5';
  g uuid := gen_random_uuid();
  m1 uuid := gen_random_uuid();
  m2 uuid := gen_random_uuid();
  res text := '';
  n int;
  t text;
begin
  insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at)
  select x, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', x::text || '@test.invalid', '{"display_name":"T"}'::jsonb, now(), now()
  from unnest(array[a, b, c, d, e]) as x;

  -- a creates a group and becomes its first member
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.groups (name, activity) values ('ריצת בוקר', 'ריצה') returning id into g;
  select member_count::text into t from public.groups where id = g;
  res := res || '1 a creates a group, member_count (expect 1): ' || t || E'\n';
  select count(*) into n from public.group_members where group_id = g and user_id = a;
  res := res || '2 the creator is a member (expect 1): ' || n || E'\n';
  begin
    update public.groups set member_count = 999 where id = g;
    res := res || '3 a edits member_count: ALLOWED (BAD)' || E'\n';
  exception when others then
    res := res || '3 a edits member_count: blocked (good)' || E'\n';
  end;
  begin
    insert into public.groups (name, activity) values ('x', 'ריצה');
    res := res || '4 a creates a group named "x": ALLOWED (BAD)' || E'\n';
  exception when others then
    res := res || '4 a creates a group named "x": blocked (good)' || E'\n';
  end;
  begin
    insert into public.groups (name, activity) values ('קבוצה', 'שחייה');
    res := res || '5 a uses an unknown activity: ALLOWED (BAD)' || E'\n';
  exception when others then
    res := res || '5 a uses an unknown activity: blocked (good)' || E'\n';
  end;

  -- b sees the directory but not who created it; b joins; cannot add c
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select name into t from public.groups where id = g;
  res := res || '6 b sees the group in the directory (expect ריצת בוקר): ' || t || E'\n';
  begin
    perform created_by from public.groups where id = g;
    res := res || '7 b reads created_by: ALLOWED (BAD)' || E'\n';
  exception when others then
    res := res || '7 b reads created_by: denied (good)' || E'\n';
  end;
  begin
    insert into public.group_members (group_id, user_id) values (g, c);
    res := res || '8 b adds c to the group: ALLOWED (BAD)' || E'\n';
  exception when others then
    res := res || '8 b adds c to the group: blocked (good)' || E'\n';
  end;
  insert into public.group_members (group_id) values (g);
  select member_count::text into t from public.groups where id = g;
  res := res || '9 b joins, member_count (expect 2): ' || t || E'\n';

  -- messages: members only
  insert into public.group_messages (id, group_id, body) values (m1, g, 'hello from b');
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', c, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.group_messages;
  res := res || '10 non-member c reads group messages (expect 0): ' || n || E'\n';
  select count(*) into n from public.group_members;
  res := res || '11 non-member c reads the roster (expect 0): ' || n || E'\n';
  begin
    insert into public.group_messages (group_id, body) values (g, 'intruder');
    res := res || '12 c writes to a group they are not in: ALLOWED (BAD)' || E'\n';
  exception when others then
    res := res || '12 c writes to a group they are not in: blocked (good)' || E'\n';
  end;

  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.group_messages where id = m1;
  res := res || '13 member a sees b''s message (expect 1): ' || n || E'\n';
  select count(*) into n from public.group_members where group_id = g;
  res := res || '14 member a sees the roster (expect 2): ' || n || E'\n';
  begin
    insert into public.group_messages (group_id, sender_id, body) values (g, b, 'forged');
    res := res || '15 a sends as b: ALLOWED (BAD)' || E'\n';
  exception when others then
    res := res || '15 a sends as b: blocked (good)' || E'\n';
  end;
  insert into public.group_messages (id, group_id, body) values (m2, g, 'hello from a');
  delete from public.group_messages where id = m1;
  get diagnostics n = row_count;
  res := res || '16 a deletes b''s message (expect 0 rows): ' || n || E'\n';

  -- blocking hides both ways
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.user_blocks (blocked_id) values (a);
  select count(*) into n from public.group_messages where id = m2;
  res := res || '17 b blocked a: b no longer sees a''s message (expect 0): ' || n || E'\n';
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.group_messages where id = m1;
  res := res || '18 a no longer sees b''s message either (expect 0): ' || n || E'\n';
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  set local role authenticated;
  delete from public.user_blocks where blocked_id = a;
  reset role;

  -- c, d, e join; three reports hide a's message for others, not for a
  perform set_config('request.jwt.claims', json_build_object('sub', c, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.group_members (group_id) values (g);
  insert into public.content_reports (group_message_id, reason) values (m2, 'abuse');
  select count(*) into n from public.group_messages where id = m2;
  res := res || '19 c reported it and no longer sees it (expect 0): ' || n || E'\n';
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', d, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.group_members (group_id) values (g);
  insert into public.content_reports (group_message_id, reason) values (m2, 'abuse');
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.content_reports (group_message_id, reason) values (m2, 'spam');
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', e, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.group_members (group_id) values (g);
  select count(*) into n from public.group_messages where id = m2;
  res := res || '20 a message reported by 3 is hidden for other members (expect 0): ' || n || E'\n';
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.group_messages where id = m2;
  res := res || '21 the sender still sees own message (expect 1): ' || n || E'\n';
  reset role;

  -- leaving: member_count goes down; the group disappears with its last member
  perform set_config('request.jwt.claims', json_build_object('sub', e, 'role', 'authenticated')::text, true);
  set local role authenticated;
  delete from public.group_members where group_id = g;
  select count(*) into n from public.group_messages where group_id = g;
  res := res || '22 e left and no longer reads the chat (expect 0): ' || n || E'\n';
  reset role;
  select member_count::text into t from public.groups where id = g;
  res := res || '23 member_count after e left (expect 4): ' || t || E'\n';
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  delete from public.group_members where group_id = g;
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  set local role authenticated;
  delete from public.group_members where group_id = g;
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', c, 'role', 'authenticated')::text, true);
  set local role authenticated;
  delete from public.group_members where group_id = g;
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', d, 'role', 'authenticated')::text, true);
  set local role authenticated;
  delete from public.group_members where group_id = g;
  reset role;
  select count(*) into n from public.groups where id = g;
  res := res || '24 the group is removed with its last member (expect 0): ' || n || E'\n';
  select count(*) into n from public.group_messages where group_id = g;
  res := res || '25 and so are its messages (expect 0): ' || n || E'\n';

  -- limits: 3 groups created, 20 messages a minute
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.groups (name, activity) values ('קבוצה א', 'כוח'), ('קבוצה ב', 'כוח'), ('קבוצה ג', 'כוח');
  begin
    insert into public.groups (name, activity) values ('קבוצה ד', 'כוח');
    res := res || '26 a creates a 4th group: ALLOWED (BAD)' || E'\n';
  exception when others then
    res := res || '26 a creates a 4th group: blocked (good)' || E'\n';
  end;
  begin
    for i in 1..21 loop
      insert into public.group_messages (group_id, body)
      select group_id, 'spam ' || i from public.group_members where user_id = a limit 1;
    end loop;
    res := res || '27 a sends 21 messages in a minute: ALLOWED (BAD)' || E'\n';
  exception when others then
    res := res || '27 a sends 21 messages in a minute: blocked (good)' || E'\n';
  end;

  -- anon
  reset role;
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  set local role anon;
  begin
    select count(*) into n from public.groups;
    res := res || '28 anon reads groups, rows (expect denied or 0): ' || n || E'\n';
  exception when others then
    res := res || '28 anon reads groups: denied (good)' || E'\n';
  end;
  reset role;

  raise exception E'RLS_GROUPS_TEST_RESULTS\n%', res;
end $$;
