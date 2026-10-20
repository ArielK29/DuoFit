-- Test for migration 20261020_chat_block_and_report.sql (block hides the one-to-one chat both ways; private messages can be reported).
-- Throw-away users in one transaction; ends with an exception so NOTHING is kept. Every line must say good.
do $$
declare
  a uuid := '00000000-0000-0000-0000-0000000000c1';
  b uuid := '00000000-0000-0000-0000-0000000000c2';
  c uuid := '00000000-0000-0000-0000-0000000000c3';
  conv uuid := gen_random_uuid();
  conv_ac uuid := gen_random_uuid();
  ma uuid := gen_random_uuid();
  mb uuid := gen_random_uuid();
  res text := '';
  n int;
begin
  -- MIGRATION_HOOK
  insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at)
  select x, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', x::text || '@test.invalid', '{"display_name":"T"}'::jsonb, now(), now()
  from unnest(array[a, b, c]) as x;

  -- a and b talk
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.conversations (id, user_a, user_b) values (conv, a, b);
  insert into public.messages (id, conversation_id, kind, body) values (ma, conv, 'text', 'hi from a');
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.messages (id, conversation_id, kind, body) values (mb, conv, 'text', 'hi from b');
  select count(*) into n from public.messages where conversation_id = conv;
  res := res || '1 before anything: b reads ' || n || ' messages (expect 2): ' || case when n = 2 then 'good' else 'BAD' end || E'\n';

  -- 2. b reports a message of a
  begin
    insert into public.content_reports (message_id, reason) values (ma, 'inappropriate');
    res := res || '2 b reports a message of a: allowed (good)' || E'\n';
  exception when others then res := res || '2 b reports a message of a: BLOCKED (BAD) ' || sqlerrm || E'\n'; end;
  select count(*) into n from public.messages where id = ma;
  res := res || '3 the reported message is hidden for b (expect 0): ' || n || ' ' || case when n = 0 then 'good' else 'BAD' end || E'\n';
  begin
    insert into public.content_reports (message_id, reason) values (ma, 'abuse');
    res := res || '4 b reports the same message twice: ALLOWED (BAD)' || E'\n';
  exception when unique_violation then res := res || '4 b reports the same message twice: refused (good)' || E'\n';
            when others then res := res || '4 same message twice: WRONG ERROR ' || sqlerrm || E'\n'; end;
  begin
    insert into public.content_reports (message_id, reason) values (mb, 'abuse');
    res := res || '5 b reports his OWN message: ALLOWED (BAD)' || E'\n';
  exception when others then res := res || '5 b reports his own message: refused (good)' || E'\n'; end;
  begin
    insert into public.content_reports (message_id, post_id, reason) values (mb, gen_random_uuid(), 'abuse');
    res := res || '6 a report with two targets: ALLOWED (BAD)' || E'\n';
  exception when others then res := res || '6 a report with two targets: refused (good)' || E'\n'; end;
  reset role;

  -- a still reads both messages; c (not a member) cannot report and sees nothing
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.messages where conversation_id = conv;
  res := res || '7 a still reads the whole chat (expect 2): ' || n || ' ' || case when n = 2 then 'good' else 'BAD' end || E'\n';
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', c, 'role', 'authenticated')::text, true);
  set local role authenticated;
  begin
    insert into public.content_reports (message_id, reason) values (mb, 'abuse');
    res := res || '8 a stranger reports a private message: ALLOWED (BAD)' || E'\n';
  exception when others then res := res || '8 a stranger reports a private message: refused (good)' || E'\n'; end;
  select count(*) into n from public.messages where conversation_id = conv;
  res := res || '9 a stranger reads the chat (expect 0): ' || n || ' ' || case when n = 0 then 'good' else 'BAD' end || E'\n';
  reset role;

  -- 10. a blocks b: the chat disappears for both, nobody can write into it
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.user_blocks (blocked_id) values (b);
  select count(*) into n from public.conversations where id = conv;
  res := res || '10 after the block a sees the conversation (expect 0): ' || n || ' ' || case when n = 0 then 'good' else 'BAD' end || E'\n';
  select count(*) into n from public.messages where conversation_id = conv;
  res := res || '11 after the block a reads messages (expect 0): ' || n || ' ' || case when n = 0 then 'good' else 'BAD' end || E'\n';
  begin
    insert into public.messages (conversation_id, kind, body) values (conv, 'text', 'still here?');
    res := res || '12 a writes to the blocked person: ALLOWED (BAD)' || E'\n';
  exception when others then res := res || '12 a writes to the blocked person: refused (good)' || E'\n'; end;
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.conversations where id = conv;
  res := res || '13 b (the blocked one) sees the conversation (expect 0): ' || n || ' ' || case when n = 0 then 'good' else 'BAD' end || E'\n';
  begin
    insert into public.messages (conversation_id, kind, body) values (conv, 'text', 'let me in');
    res := res || '14 b writes to the person who blocked him: ALLOWED (BAD)' || E'\n';
  exception when others then res := res || '14 b writes to the person who blocked him: refused (good)' || E'\n'; end;
  begin
    insert into public.conversations (user_a, user_b) values (b, a);
    res := res || '15 b starts a NEW chat with a: ALLOWED (BAD)' || E'\n';
  exception when others then res := res || '15 b starts a new chat with a: refused (good)' || E'\n'; end;
  reset role;

  -- 16. a chat with someone else is not affected
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  begin
    insert into public.conversations (id, user_a, user_b) values (conv_ac, a, c);
    insert into public.messages (conversation_id, kind, body) values (conv_ac, 'text', 'hello c');
    res := res || '16 a chats with c normally: allowed (good)' || E'\n';
  exception when others then res := res || '16 a chats with c: BLOCKED (BAD) ' || sqlerrm || E'\n'; end;

  -- 17. unblock: the chat is back; the message b reported stays hidden for b only
  delete from public.user_blocks where blocked_id = b;
  select count(*) into n from public.messages where conversation_id = conv;
  res := res || '17 after the unblock a reads the chat (expect 2): ' || n || ' ' || case when n = 2 then 'good' else 'BAD' end || E'\n';
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.messages where conversation_id = conv;
  res := res || '18 after the unblock b reads the chat (expect 1: the reported message stays hidden): ' || n || ' ' || case when n = 1 then 'good' else 'BAD' end || E'\n';
  reset role;

  -- 19. the owner can read the report, and it disappears with the message
  select count(*) into n from public.content_reports where message_id = ma;
  res := res || '19 the owner sees the report (expect 1): ' || n || ' ' || case when n = 1 then 'good' else 'BAD' end || E'\n';
  delete from public.messages where id = ma;
  select count(*) into n from public.content_reports where message_id = ma;
  res := res || '20 deleting the message removes its report (expect 0): ' || n || ' ' || case when n = 0 then 'good' else 'BAD' end || E'\n';

  raise exception E'RESULTS (rolled back):\n%', res;
end;
$$;
