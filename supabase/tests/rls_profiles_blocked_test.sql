-- Test for migration 20261020_profiles_hidden_from_blocked.sql (a blocked member cannot look the blocker up in discovery).
-- Throw-away users in one transaction; ends with an exception so NOTHING is kept. Every line must say good.
do $$
declare
  a uuid := '00000000-0000-0000-0000-0000000000d1';
  b uuid := '00000000-0000-0000-0000-0000000000d2';
  c uuid := '00000000-0000-0000-0000-0000000000d3';
  res text := '';
  n int;
begin
  -- MIGRATION_HOOK
  insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at)
  select x, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', x::text || '@test.invalid', '{"display_name":"T"}'::jsonb, now(), now()
  from unnest(array[a, b, c]) as x;
  update public.profiles set gender = 'M', fitness_level = 'Beginner', favorite_activities = array['Running'] where id in (a, b, c);

  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.profiles where id in (a, c);
  res := res || '1 before any block b finds a and c in discovery (expect 2): ' || n || ' ' || case when n = 2 then 'good' else 'BAD' end || E'\n';
  reset role;

  -- a blocks b
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.user_blocks (blocked_id) values (b);
  select count(*) into n from public.profiles where id = b;
  res := res || '2 a (the blocker) can still read the profile of b, so the block list shows the name (expect 1): ' || n || ' ' || case when n = 1 then 'good' else 'BAD' end || E'\n';
  select count(*) into n from public.profiles where id = c;
  res := res || '3 a still finds c (expect 1): ' || n || ' ' || case when n = 1 then 'good' else 'BAD' end || E'\n';
  reset role;

  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.profiles where id = a;
  res := res || '4 b (the blocked one) cannot find a (expect 0): ' || n || ' ' || case when n = 0 then 'good' else 'BAD' end || E'\n';
  select count(*) into n from public.profiles where id = c;
  res := res || '5 b still finds c (expect 1): ' || n || ' ' || case when n = 1 then 'good' else 'BAD' end || E'\n';
  select count(*) into n from public.profiles where id = b;
  res := res || '6 b still reads his own profile (expect 1): ' || n || ' ' || case when n = 1 then 'good' else 'BAD' end || E'\n';
  reset role;

  -- unblock: b can find a again
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  delete from public.user_blocks where blocked_id = b;
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.profiles where id = a;
  res := res || '7 after the unblock b finds a again (expect 1): ' || n || ' ' || case when n = 1 then 'good' else 'BAD' end || E'\n';
  reset role;

  raise exception E'RESULTS (rolled back):\n%', res;
end;
$$;
