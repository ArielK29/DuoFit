-- RLS test for plank_weekly (weekly plank leaderboard). Three throw-away users in a transaction;
-- ends with an exception so NOTHING is kept. Every line must say good/ok or match "expect".
do $$
declare
  a uuid := '00000000-0000-0000-0000-0000000000e1';
  b uuid := '00000000-0000-0000-0000-0000000000e2';
  c uuid := '00000000-0000-0000-0000-0000000000e3';
  res text := '';
  n int;
begin
  insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at)
  select x, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', x::text || '@test.invalid', '{"display_name":"T"}'::jsonb, now(), now()
  from unnest(array[a, b, c]) as x;

  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.plank_weekly (seconds) values (90);
  res := res || '1 a saves a time: ok' || E'\n';
  insert into public.plank_weekly (seconds) values (120)
    on conflict (week_start, user_id) do update set seconds = excluded.seconds;
  select seconds into n from public.plank_weekly where user_id = a;
  res := res || '2 a upserts a better time (expect 120): ' || n || E'\n';
  insert into public.plank_weekly (seconds) values (60)
    on conflict (week_start, user_id) do update set seconds = excluded.seconds;
  select seconds into n from public.plank_weekly where user_id = a;
  res := res || '3 a upserts a worse time, the server keeps the best (expect 120): ' || n || E'\n';
  begin
    insert into public.plank_weekly (user_id, seconds) values (b, 50);
    res := res || '4 a saves a time for b: ALLOWED (BAD)' || E'\n';
  exception when others then
    res := res || '4 a saves a time for b: blocked (good)' || E'\n';
  end;
  begin
    insert into public.plank_weekly (week_start, seconds) values (current_date - 14, 50);
    res := res || '5 a forges the week: ALLOWED (BAD)' || E'\n';
  exception when others then
    res := res || '5 a forges the week: blocked (good)' || E'\n';
  end;
  begin
    update public.plank_weekly set seconds = 7201;
    res := res || '6 a sets 7201 s: ALLOWED (BAD)' || E'\n';
  exception when others then
    res := res || '6 a sets 7201 s: blocked (good)' || E'\n';
  end;
  begin
    delete from public.plank_weekly;
    res := res || '7 a deletes times: ALLOWED (BAD)' || E'\n';
  exception when others then
    res := res || '7 a deletes times: blocked (good)' || E'\n';
  end;

  -- b sees a's time of this week; an old week stays hidden
  reset role;
  insert into public.plank_weekly (user_id, week_start, seconds) values (a, current_date - 21, 999);
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.plank_weekly (seconds) values (200);
  select count(*) into n from public.plank_weekly;
  res := res || '8 b sees this week''s times of a and b only (expect 2): ' || n || E'\n';
  select count(*) into n from public.plank_weekly where seconds = 999;
  res := res || '9 b sees an old week (expect 0): ' || n || E'\n';

  -- a blocks b: both disappear from each other's leaderboard
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.user_blocks (blocked_id) values (b);
  select count(*) into n from public.plank_weekly;
  res := res || '10 a sees only own time after blocking b (expect 1): ' || n || E'\n';
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.plank_weekly;
  res := res || '11 b sees only own time after being blocked (expect 1): ' || n || E'\n';

  -- anon: nothing
  reset role;
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  set local role anon;
  begin
    select count(*) into n from public.plank_weekly;
    res := res || '12 anon reads times, rows (expect denied or 0): ' || n || E'\n';
  exception when others then
    res := res || '12 anon reads times: denied (good)' || E'\n';
  end;
  reset role;

  raise exception E'RLS_PLANK_TEST_RESULTS\n%', res;
end $$;
