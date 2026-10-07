-- Test for server notifications. Three throw-away users in a transaction; ends with an exception so
-- NOTHING is kept. Every line must say good/ok or match "expect".
do $$
declare
  a uuid := '00000000-0000-0000-0000-0000000000a1';
  b uuid := '00000000-0000-0000-0000-0000000000a2';
  c uuid := '00000000-0000-0000-0000-0000000000a3';
  conv uuid := gen_random_uuid();
  m1 uuid := gen_random_uuid();
  m2 uuid := gen_random_uuid();
  post uuid := gen_random_uuid();
  nid uuid;
  res text := '';
  n int;
  t text;
begin
  insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at)
  select x, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', x::text || '@test.invalid', '{"display_name":"T"}'::jsonb, now(), now()
  from unnest(array[a, b, c]) as x;

  -- a invites b twice
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.conversations (id, user_a, user_b) values (conv, a, b);
  insert into public.messages (id, conversation_id, kind, invite) values
    (m1, conv, 'invite', jsonb_build_object('activity', 'כוח', 'location', 'פארק', 'scheduledAt', (now() + interval '2 hours')::text, 'status', 'pending')),
    (m2, conv, 'invite', jsonb_build_object('activity', 'ריצה', 'location', 'טיילת', 'scheduledAt', (now() + interval '3 hours')::text, 'status', 'pending'));
  select count(*) into n from public.notifications;
  res := res || '1 a has no notification about own invitations (expect 0): ' || n || E'\n';

  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.notifications where kind = 'invite_received' and actor_id = a;
  res := res || '2 b is told about both invitations (expect 2): ' || n || E'\n';
  select body into t from public.notifications where ref_id = m1;
  res := res || '3 the text comes from the invitation (expect כוח · פארק): ' || t || E'\n';

  -- b answers: accepts m1, declines m2
  update public.messages set invite = jsonb_set(invite, '{status}', '"accepted"') where id = m1;
  update public.messages set invite = jsonb_set(invite, '{status}', '"declined"') where id = m2;

  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.notifications where kind = 'invite_accepted' and actor_id = b and ref_id = m1;
  res := res || '4 a is told b accepted (expect 1): ' || n || E'\n';
  select count(*) into n from public.notifications where kind = 'invite_declined' and actor_id = b and ref_id = m2;
  res := res || '5 a is told b declined (expect 1): ' || n || E'\n';

  -- a cancels the workout of m1 -> b is told
  update public.workouts set cancelled_at = now() where id = m1;
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.notifications where kind = 'workout_cancelled' and actor_id = a;
  res := res || '6 b is told a cancelled the workout (expect 1): ' || n || E'\n';

  -- b posts, a comments -> b is told; own comment on own post -> nobody
  insert into public.posts (id, activity, body) values (post, 'כוח', 'post by b');
  insert into public.comments (post_id, body) values (post, 'own comment');
  select count(*) into n from public.notifications where kind = 'post_comment';
  res := res || '7 b is not told about own comment (expect 0): ' || n || E'\n';
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.comments (post_id, body) values (post, 'nice one');
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.notifications where kind = 'post_comment' and actor_id = a and body = 'nice one';
  res := res || '8 b is told about a''s comment (expect 1): ' || n || E'\n';

  -- forging and tampering
  begin
    insert into public.notifications (user_id, kind) values (a, 'post_comment');
    res := res || '9 b inserts a notification: ALLOWED (BAD)' || E'\n';
  exception when others then
    res := res || '9 b inserts a notification: blocked (good)' || E'\n';
  end;
  begin
    update public.notifications set body = 'edited';
    res := res || '10 b edits a notification text: ALLOWED (BAD)' || E'\n';
  exception when others then
    res := res || '10 b edits a notification text: blocked (good)' || E'\n';
  end;
  select id into nid from public.notifications where kind = 'post_comment' limit 1;
  update public.notifications set read_at = '2000-01-01' where id = nid;
  select (read_at > now() - interval '1 minute')::text into t from public.notifications where id = nid;
  res := res || '11 b marks read, the server stamps the time (expect true): ' || t || E'\n';
  update public.notifications set read_at = null where id = nid;
  select (read_at is not null)::text into t from public.notifications where id = nid;
  res := res || '12 b un-reads: stays read (expect true): ' || t || E'\n';

  -- c sees nothing of this
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', c, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.notifications;
  res := res || '13 c sees others'' notifications (expect 0): ' || n || E'\n';

  -- block: b blocks a, a comments again -> b hears nothing new
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.user_blocks (blocked_id) values (a);
  select count(*) into n from public.notifications where kind = 'post_comment';
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  begin
    insert into public.comments (post_id, body) values (post, 'after block');
  exception when others then
    null; -- a can no longer even see the post
  end;
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) - n into n from public.notifications where kind = 'post_comment';
  res := res || '14 no new notification from a blocked member (expect 0): ' || n || E'\n';

  -- b clears own notifications
  delete from public.notifications;
  select count(*) into n from public.notifications;
  res := res || '15 b deletes own notifications (expect 0 left): ' || n || E'\n';

  -- anon
  reset role;
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  set local role anon;
  begin
    select count(*) into n from public.notifications;
    res := res || '16 anon reads notifications, rows (expect denied or 0): ' || n || E'\n';
  exception when others then
    res := res || '16 anon reads notifications: denied (good)' || E'\n';
  end;
  reset role;

  -- trimming to the newest 200 per member (helper called as the table owner)
  perform set_config('request.jwt.claims', '', true);
  for i in 1..205 loop
    perform private.notify(c, 'post_comment', a, null, 'n' || i);
  end loop;
  select count(*) into n from public.notifications where user_id = c;
  res := res || '17 a member keeps at most 200 notifications (expect 200): ' || n || E'\n';

  raise exception E'RLS_NOTIFICATIONS_TEST_RESULTS\n%', res;
end $$;
