-- RLS test for chat (conversations, messages, conversation_reads). Run with the Supabase MCP
-- execute_sql after any change to these tables. Three throw-away users in a transaction;
-- ends with an exception so NOTHING is kept. Every line must say good/ok or match "expect".
do $$
declare
  u1 uuid := '00000000-0000-0000-0000-0000000000a1';  -- ordered: u1 < u2 < u3
  u2 uuid := '00000000-0000-0000-0000-0000000000a2';
  u3 uuid := '00000000-0000-0000-0000-0000000000a3';
  conv uuid;
  conv2 uuid;
  inv uuid;
  msg uuid;
  res text := '';
  n int;
begin
  insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at)
  select x, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', x::text || '@test.invalid', '{"display_name":"T"}'::jsonb, now(), now()
  from unnest(array[u1, u2, u3]) as x;

  -- u1 opens a conversation with u2
  perform set_config('request.jwt.claims', json_build_object('sub', u1, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.conversations (user_a, user_b) values (u1, u2) returning id into conv;
  res := res || '1 u1 creates a conversation with u2: ok' || E'\n';
  begin
    insert into public.conversations (user_a, user_b) values (u2, u3);
    res := res || '2 u1 creates a conversation between u2 and u3: ALLOWED (BAD)' || E'\n';
  exception when others then
    res := res || '2 u1 creates a conversation between u2 and u3: blocked (good)' || E'\n';
  end;
  begin
    insert into public.conversations (user_a, user_b) values (u2, u1);
    res := res || '3 reversed pair (order rule): ALLOWED (BAD)' || E'\n';
  exception when others then
    res := res || '3 reversed pair (order rule): blocked (good)' || E'\n';
  end;

  insert into public.messages (conversation_id, kind, body) values (conv, 'text', 'hello u2');
  res := res || '4 u1 sends a text message: ok' || E'\n';
  begin
    insert into public.messages (conversation_id, sender_id, kind, body) values (conv, u2, 'text', 'fake from u2');
    res := res || '5 u1 sends a message as u2: ALLOWED (BAD)' || E'\n';
  exception when others then
    res := res || '5 u1 sends a message as u2: blocked (good)' || E'\n';
  end;
  begin
    insert into public.messages (conversation_id, kind, body) values (conv, 'text', repeat('x', 2001));
    res := res || '6 u1 sends a 2001-char message: ALLOWED (BAD)' || E'\n';
  exception when others then
    res := res || '6 u1 sends a 2001-char message: blocked (good)' || E'\n';
  end;
  insert into public.messages (conversation_id, kind, invite)
    values (conv, 'invite', jsonb_build_object('activity', 'ריצה', 'location', 'פארק', 'scheduledAt', (now() + interval '30 days')::text, 'status', 'pending'))
    returning id into inv;
  res := res || '7 u1 sends a workout invitation: ok' || E'\n';
  begin
    update public.messages set body = 'edited' where id = inv;
    get diagnostics n = row_count;
    res := res || '8 u1 edits own message: rows (expect 0): ' || n || E'\n';
  exception when others then
    res := res || '8 u1 edits own message (no update right): denied (good)' || E'\n';
  end;
  begin
    insert into public.messages (conversation_id, kind, invite)
      values (conv, 'invite', jsonb_build_object('activity', 'x', 'location', 'y', 'scheduledAt', (now() + interval '30 days')::text, 'status', 'accepted'));
    res := res || '8a u1 forges an already-accepted invitation: ALLOWED (BAD)' || E'\n';
  exception when others then
    res := res || '8a u1 forges an already-accepted invitation: blocked (good)' || E'\n';
  end;
  begin
    insert into public.messages (conversation_id, kind, invite)
      values (conv, 'invite', '{"activity":"x","location":"y","scheduledAt":"not a date","status":"pending"}'::jsonb);
    res := res || '8b u1 sends an invitation with an invalid date: ALLOWED (BAD)' || E'\n';
  exception when others then
    res := res || '8b u1 sends an invitation with an invalid date: blocked (good)' || E'\n';
  end;
  begin
    insert into public.messages (conversation_id, kind, body, created_at) values (conv, 'text', 'from the future', '2100-01-01');
    res := res || '8c u1 forges created_at: ALLOWED (BAD)' || E'\n';
  exception when others then
    res := res || '8c u1 forges created_at: blocked (good)' || E'\n';
  end;

  -- u2 (recipient)
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', u2, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.messages where conversation_id = conv;
  res := res || '9 u2 reads the conversation messages (expect 2): ' || n || E'\n';
  begin
    update public.messages set invite = jsonb_set(invite, '{location}', '"somewhere else"') where id = inv;
    res := res || '10 u2 changes the invitation location: ALLOWED (BAD)' || E'\n';
  exception when others then
    res := res || '10 u2 changes the invitation location: blocked (good)' || E'\n';
  end;
  begin
    update public.messages set invite = invite - 'status' where id = inv;
    res := res || '10a u2 erases the invitation status: ALLOWED (BAD)' || E'\n';
  exception when others then
    res := res || '10a u2 erases the invitation status: blocked (good)' || E'\n';
  end;
  update public.messages set invite = jsonb_set(invite, '{status}', '"accepted"') where id = inv;
  get diagnostics n = row_count;
  res := res || '11 u2 accepts the invitation: rows (expect 1): ' || n || E'\n';
  begin
    update public.messages set invite = jsonb_set(invite, '{status}', '"declined"') where id = inv;
    res := res || '12 u2 answers the invitation twice: ALLOWED (BAD)' || E'\n';
  exception when others then
    res := res || '12 u2 answers the invitation twice: blocked (good)' || E'\n';
  end;
  insert into public.conversation_reads (conversation_id, last_read_at) values (conv, now())
    on conflict (conversation_id, user_id) do update set last_read_at = excluded.last_read_at;
  res := res || '13 u2 stores a read marker: ok' || E'\n';
  update public.conversation_reads set last_read_at = '2100-01-01' where conversation_id = conv;
  select count(*) into n from public.conversation_reads where last_read_at < now() + interval '1 day';
  res := res || '13a u2 read marker uses the server clock (expect 1): ' || n || E'\n';

  -- u1 cannot accept their own invitation
  reset role;
  insert into public.messages (conversation_id, sender_id, kind, invite)
    values (conv, u1, 'invite', jsonb_build_object('activity', 'כוח', 'location', 'חדר כושר', 'scheduledAt', (now() + interval '31 days')::text, 'status', 'pending'))
    returning id into msg;
  perform set_config('request.jwt.claims', json_build_object('sub', u1, 'role', 'authenticated')::text, true);
  set local role authenticated;
  update public.messages set invite = jsonb_set(invite, '{status}', '"accepted"') where id = msg;
  get diagnostics n = row_count;
  res := res || '14 u1 accepts their OWN invitation: rows (expect 0): ' || n || E'\n';
  select count(*) into n from public.conversation_reads;
  res := res || '15 u1 sees read markers of others (expect 0): ' || n || E'\n';

  -- stranger limit: u1 writes to u3, who never answers
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', u1, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.conversations (user_a, user_b) values (u1, u3) returning id into conv2;
  begin
    for i in 1..11 loop
      insert into public.messages (conversation_id, kind, body) values (conv2, 'text', 'ping ' || i);
    end loop;
    res := res || '15a 11 messages to someone who never answered: ALLOWED (BAD)' || E'\n';
  exception when others then
    res := res || '15a 11th message to someone who never answered: blocked (good)' || E'\n';
  end;

  -- u3 (outsider)
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', u3, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.conversations where id = conv;
  res := res || '16 u3 sees the u1-u2 conversation (expect 0): ' || n || E'\n';
  select count(*) into n from public.messages where conversation_id = conv;
  res := res || '17 u3 sees u1-u2 messages (expect 0): ' || n || E'\n';
  begin
    insert into public.messages (conversation_id, kind, body) values (conv, 'text', 'intruder');
    res := res || '18 u3 writes into someone else''s conversation: ALLOWED (BAD)' || E'\n';
  exception when others then
    res := res || '18 u3 writes into someone else''s conversation: blocked (good)' || E'\n';
  end;
  begin
    insert into public.conversation_reads (conversation_id, last_read_at) values (conv, now());
    res := res || '19 u3 writes a read marker in someone else''s conversation: ALLOWED (BAD)' || E'\n';
  exception when others then
    res := res || '19 u3 writes a read marker in someone else''s conversation: blocked (good)' || E'\n';
  end;

  -- anon
  reset role;
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  set local role anon;
  begin
    select count(*) into n from public.messages;
    res := res || '20 anon reads messages, rows (expect denied or 0): ' || n || E'\n';
  exception when others then
    res := res || '20 anon reads messages: denied (good)' || E'\n';
  end;
  reset role;

  raise exception E'RLS_CHAT_TEST_RESULTS\n%', res;
end $$;
