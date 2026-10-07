-- Test for cancelling workouts and for account deletion keeping the other member's workout.
-- Two throw-away users in a transaction; ends with an exception so NOTHING is kept.
do $$
declare
  a uuid := '00000000-0000-0000-0000-0000000000f4';
  b uuid := '00000000-0000-0000-0000-0000000000f5';
  conv uuid := gen_random_uuid();
  m1 uuid := gen_random_uuid(); -- will be cancelled
  m2 uuid := gen_random_uuid(); -- somebody checks in, then a tries to cancel
  m3 uuid := gen_random_uuid(); -- already started
  res text := '';
  n int;
  t text;
begin
  insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at)
  select x, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', x::text || '@test.invalid', '{"display_name":"T"}'::jsonb, now(), now()
  from unnest(array[a, b]) as x;

  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.conversations (id, user_a, user_b) values (conv, a, b);
  insert into public.messages (id, conversation_id, kind, invite) values
    (m1, conv, 'invite', jsonb_build_object('activity', 'כוח', 'location', 'פארק', 'scheduledAt', (now() + interval '2 hours')::text, 'status', 'pending')),
    (m2, conv, 'invite', jsonb_build_object('activity', 'ריצה', 'location', 'טיילת', 'scheduledAt', (now() + interval '2 hours')::text, 'status', 'pending')),
    (m3, conv, 'invite', jsonb_build_object('activity', 'כדורסל', 'location', 'מגרש', 'scheduledAt', (now() - interval '30 minutes')::text, 'status', 'pending'));

  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  set local role authenticated;
  update public.messages set invite = jsonb_set(invite, '{status}', '"accepted"') where id in (m1, m2, m3);

  -- 1 b cancels m1
  update public.workouts set cancelled_at = '2000-01-01' where id = m1;
  select (cancelled_at > now() - interval '1 minute' and cancelled_by = b)::text into t from public.workouts where id = m1;
  res := res || '1 b cancels, the server stamps time and who (expect true): ' || t || E'\n';
  begin
    update public.workouts set cancelled_at = now() + interval '1 minute' where id = m1;
    res := res || '2 b cancels twice: ALLOWED (BAD)' || E'\n';
  exception when others then
    res := res || '2 b cancels twice: blocked (good)' || E'\n';
  end;
  begin
    update public.workouts set guest_checked_in_at = now() where id = m1;
    res := res || '3 b checks in to a cancelled workout: ALLOWED (BAD)' || E'\n';
  exception when others then
    res := res || '3 b checks in to a cancelled workout: blocked (good)' || E'\n';
  end;
  begin
    update public.workouts set cancelled_by = a where id = m2;
    res := res || '4 b sets cancelled_by directly: ALLOWED (BAD)' || E'\n';
  exception when others then
    res := res || '4 b sets cancelled_by directly: blocked (good)' || E'\n';
  end;
  begin
    update public.workouts set cancelled_at = now() where id = m3;
    res := res || '5 b cancels a workout that already started: ALLOWED (BAD)' || E'\n';
  exception when others then
    res := res || '5 b cancels a workout that already started: blocked (good)' || E'\n';
  end;

  -- a sees the cancellation; b checks in to m2 (m2 starts in 2 h, inside the 3 h window) so a cannot cancel it
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select (cancelled_at is not null and cancelled_by = b)::text into t from public.workouts where id = m1;
  res := res || '6 a sees that b cancelled (expect true): ' || t || E'\n';
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  set local role authenticated;
  update public.workouts set guest_checked_in_at = now() where id = m2;
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  begin
    update public.workouts set cancelled_at = now() where id = m2;
    res := res || '7 a cancels after b checked in: ALLOWED (BAD)' || E'\n';
  exception when others then
    res := res || '7 a cancels after b checked in: blocked (good)' || E'\n';
  end;
  reset role;

  -- account deletion: b leaves, a keeps the workout; when a leaves too the row disappears
  delete from auth.users where id = b;
  select count(*) into n from public.workouts where id = m2 and guest_id is null and host_id = a;
  res := res || '8 after b deleted the account, a still has the workout (expect 1): ' || n || E'\n';
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.workouts where id = m2;
  res := res || '9 a can still read it (expect 1): ' || n || E'\n';
  reset role;
  delete from auth.users where id = a;
  select count(*) into n from public.workouts where id in (m1, m2, m3);
  res := res || '10 after both left, nothing remains (expect 0): ' || n || E'\n';

  raise exception E'RLS_WORKOUT_LIFECYCLE_RESULTS\n%', res;
end $$;
