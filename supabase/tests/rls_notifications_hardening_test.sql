-- Hardening checks for server notifications (flood cap, trim priority, blocked pairs, cleanup).
-- Throw-away users in a transaction; ends with an exception so NOTHING is kept.
do $$
declare
  a uuid := '00000000-0000-0000-0000-0000000000b4';
  b uuid := '00000000-0000-0000-0000-0000000000b5';
  conv uuid := gen_random_uuid();
  m1 uuid := gen_random_uuid();
  m2 uuid := gen_random_uuid();
  m3 uuid := gen_random_uuid();
  post uuid := gen_random_uuid();
  cid uuid := gen_random_uuid();
  res text := '';
  n int;
begin
  insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at)
  select x, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', x::text || '@test.invalid', '{"display_name":"T"}'::jsonb, now(), now()
  from unnest(array[a, b]) as x;

  -- b blocks a, then a invites b: b hears nothing
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.user_blocks (blocked_id) values (a);
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.conversations (id, user_a, user_b) values (conv, a, b);
  insert into public.messages (id, conversation_id, kind, invite) values
    (m1, conv, 'invite', jsonb_build_object('activity', 'כוח', 'location', 'פארק', 'scheduledAt', (now() + interval '2 hours')::text, 'status', 'pending'));
  reset role;
  select count(*) into n from public.notifications where user_id = b;
  res := res || '1 blocked member invites: no notification (expect 0): ' || n || E'\n';

  -- b answers (accepts) the invitation although a is blocked: a hears nothing
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  set local role authenticated;
  update public.messages set invite = jsonb_set(invite, '{status}', '"accepted"') where id = m1;
  reset role;
  select count(*) into n from public.notifications where user_id = a;
  res := res || '2 answering a blocked member: no notification (expect 0): ' || n || E'\n';

  -- a cancels the workout of m1: b (who blocked a) hears nothing
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  update public.workouts set cancelled_at = now() where id = m1;
  reset role;
  select count(*) into n from public.notifications where user_id = b;
  res := res || '3 cancelling towards a member who blocked you: no notification (expect 0): ' || n || E'\n';

  -- unblock; flood cap: a comments 7 times on b's post -> only 5 unread pings
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  set local role authenticated;
  delete from public.user_blocks where blocked_id = a;
  insert into public.posts (id, activity, body) values (post, 'כוח', 'post by b');
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  for i in 1..7 loop
    insert into public.comments (id, post_id, body) values (case when i = 1 then cid else gen_random_uuid() end, post, 'c' || i);
  end loop;
  reset role;
  select count(*) into n from public.notifications where user_id = b and kind = 'post_comment' and actor_id = a;
  res := res || '4 seven comments from one member give at most 5 unread pings (expect 5): ' || n || E'\n';

  -- deleting a comment removes its ping
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  delete from public.comments where id = cid;
  reset role;
  select count(*) into n from public.notifications where user_id = b and kind = 'post_comment' and body = 'c1';
  res := res || '5 deleting a comment removes its ping (expect 0): ' || n || E'\n';

  -- deleting the post removes the rest
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  set local role authenticated;
  delete from public.posts where id = post;
  reset role;
  select count(*) into n from public.notifications where user_id = b and kind = 'post_comment';
  res := res || '6 deleting the post removes its pings (expect 0): ' || n || E'\n';

  -- trimming keeps an old UNREAD invitation and drops comment pings first
  delete from public.notifications where user_id = b;
  insert into public.notifications (user_id, kind, actor_id, ref_id, body, created_at)
  values (b, 'invite_received', a, m2, 'old invitation', now() - interval '30 days');
  insert into public.notifications (user_id, kind, actor_id, body, created_at)
  select b, 'post_comment', null, 'p' || i, now() - interval '20 days' + (i || ' minutes')::interval
  from generate_series(1, 199) as i;
  perform private.notify(b, 'post_comment', a, null, 'newest');
  perform private.notify(b, 'post_comment', a, null, 'newest2');
  select count(*) into n from public.notifications where user_id = b;
  res := res || '7 the list stays at 200 (expect 200): ' || n || E'\n';
  select count(*) into n from public.notifications where user_id = b and kind = 'invite_received';
  res := res || '8 the old unread invitation survives the trim (expect 1): ' || n || E'\n';
  select count(*) into n from public.notifications where user_id = b and body = 'p1';
  res := res || '9 the oldest comment ping was dropped (expect 0): ' || n || E'\n';

  -- a member who leaves takes the notifications they caused along
  delete from auth.users where id = a;
  select count(*) into n from public.notifications where user_id = b and actor_id is not null;
  res := res || '10 notifications caused by a deleted member are gone (expect 0): ' || n || E'\n';

  raise exception E'RLS_NOTIFICATIONS_HARDENING_RESULTS\n%', res;
end $$;
