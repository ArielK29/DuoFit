-- RLS test for shared workouts. Three throw-away users in a transaction; ends with an exception so
-- NOTHING is kept. Every line must say good/ok or match "expect".
do $$
declare
  a uuid := '00000000-0000-0000-0000-0000000000f1';
  b uuid := '00000000-0000-0000-0000-0000000000f2';
  c uuid := '00000000-0000-0000-0000-0000000000f3';
  conv uuid := gen_random_uuid();
  m1 uuid := gen_random_uuid();
  m2 uuid := gen_random_uuid();
  m3 uuid := gen_random_uuid();
  res text := '';
  n int;
  t text;
  stamped timestamptz;
begin
  insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at)
  select x, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', x::text || '@test.invalid', '{"display_name":"T"}'::jsonb, now(), now()
  from unnest(array[a, b, c]) as x;

  -- a invites b three times (one soon, one declined, one far away)
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.conversations (id, user_a, user_b) values (conv, a, b);
  insert into public.messages (id, conversation_id, kind, invite) values
    (m1, conv, 'invite', jsonb_build_object('activity', 'כוח', 'location', 'פארק', 'scheduledAt', (now() + interval '1 hour')::text, 'status', 'pending'));
  insert into public.messages (id, conversation_id, kind, invite) values
    (m2, conv, 'invite', jsonb_build_object('activity', 'ריצה', 'location', 'טיילת', 'scheduledAt', (now() + interval '2 hours')::text, 'status', 'pending'));
  insert into public.messages (id, conversation_id, kind, invite) values
    (m3, conv, 'invite', jsonb_build_object('activity', 'כדורסל', 'location', 'מגרש', 'scheduledAt', (now() + interval '48 hours')::text, 'status', 'pending'));
  res := res || '1 a sends three invitations: ok' || E'\n';

  -- b accepts m1 and m3, declines m2
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  set local role authenticated;
  update public.messages set invite = jsonb_set(invite, '{status}', '"accepted"') where id = m1;
  update public.messages set invite = jsonb_set(invite, '{status}', '"declined"') where id = m2;
  update public.messages set invite = jsonb_set(invite, '{status}', '"accepted"') where id = m3;
  select count(*) into n from public.workouts;
  res := res || '2 b sees the workouts of the two accepted invitations (expect 2): ' || n || E'\n';
  select count(*) into n from public.workouts where id = m2;
  res := res || '3 a declined invitation made a workout (expect 0): ' || n || E'\n';
  select activity || '/' || location || '/' || (host_id = a)::text || '/' || (guest_id = b)::text into t from public.workouts where id = m1;
  res := res || '4 workout content comes from the invitation (expect כוח/פארק/true/true): ' || t || E'\n';

  begin
    insert into public.workouts (id, host_id, guest_id, activity, location, scheduled_at)
    values (gen_random_uuid(), b, a, 'x', 'y', now());
    res := res || '5 b inserts a workout directly: ALLOWED (BAD)' || E'\n';
  exception when others then
    res := res || '5 b inserts a workout directly: blocked (good)' || E'\n';
  end;
  begin
    delete from public.workouts where id = m1;
    get diagnostics n = row_count;
    res := res || '6 b deletes a workout (expect denied or 0 rows): ' || n || E'\n';
  exception when others then
    res := res || '6 b deletes a workout: denied (good)' || E'\n';
  end;
  begin
    update public.workouts set host_checked_in_at = now() where id = m1;
    res := res || '7 b checks in as the host: ALLOWED (BAD)' || E'\n';
  exception when others then
    res := res || '7 b checks in as the host: blocked (good)' || E'\n';
  end;
  begin
    update public.workouts set activity = 'edited' where id = m1;
    res := res || '8 b edits the activity: ALLOWED (BAD)' || E'\n';
  exception when others then
    res := res || '8 b edits the activity: blocked (good)' || E'\n';
  end;
  update public.workouts set guest_checked_in_at = '2000-01-01' where id = m1;
  select guest_checked_in_at into stamped from public.workouts where id = m1;
  res := res || '9 b checks in, the server stamps its own time (expect true): ' || (stamped > now() - interval '1 minute')::text || E'\n';
  begin
    update public.workouts set guest_checked_in_at = now() + interval '1 minute' where id = m1;
    res := res || '10 b checks in twice: ALLOWED (BAD)' || E'\n';
  exception when others then
    res := res || '10 b checks in twice: blocked (good)' || E'\n';
  end;
  begin
    update public.workouts set guest_checked_in_at = now() where id = m3;
    res := res || '11 b checks in 48 hours early: ALLOWED (BAD)' || E'\n';
  exception when others then
    res := res || '11 b checks in 48 hours early: blocked (good)' || E'\n';
  end;

  -- odd invitations are refused when they are sent
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  begin
    insert into public.messages (conversation_id, kind, invite) values
      (conv, 'invite', jsonb_build_object('activity', 'x', 'location', 'y', 'scheduledAt', 'infinity', 'status', 'pending'));
    res := res || '11b a invites for infinity: ALLOWED (BAD)' || E'\n';
  exception when others then
    res := res || '11b a invites for infinity: blocked (good)' || E'\n';
  end;
  begin
    insert into public.messages (conversation_id, kind, invite) values
      (conv, 'invite', jsonb_build_object('activity', 'x', 'location', 'y', 'scheduledAt', (now() - interval '3 days')::text, 'status', 'pending'));
    res := res || '11c a invites for 3 days ago: ALLOWED (BAD)' || E'\n';
  exception when others then
    res := res || '11c a invites for 3 days ago: blocked (good)' || E'\n';
  end;
  begin
    insert into public.messages (conversation_id, kind, invite) values
      (conv, 'invite', jsonb_build_object('activity', 'x', 'location', 'y', 'scheduledAt', (now() + interval '120 days')::text, 'status', 'pending'));
    res := res || '11d a invites for 120 days ahead: ALLOWED (BAD)' || E'\n';
  exception when others then
    res := res || '11d a invites for 120 days ahead: blocked (good)' || E'\n';
  end;

  -- a sees the same workout and checks in
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.workouts;
  res := res || '12 a sees the same two workouts (expect 2): ' || n || E'\n';
  update public.workouts set host_checked_in_at = now() where id = m1;
  select (host_checked_in_at is not null and guest_checked_in_at is not null)::text into t from public.workouts where id = m1;
  res := res || '13 a checks in, both are checked in (expect true): ' || t || E'\n';

  -- c sees nothing
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', c, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.workouts;
  res := res || '14 stranger c sees workouts (expect 0): ' || n || E'\n';

  -- anon
  reset role;
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  set local role anon;
  begin
    select count(*) into n from public.workouts;
    res := res || '15 anon reads workouts, rows (expect denied or 0): ' || n || E'\n';
  exception when others then
    res := res || '15 anon reads workouts: denied (good)' || E'\n';
  end;
  reset role;

  raise exception E'RLS_WORKOUTS_TEST_RESULTS\n%', res;
end $$;
