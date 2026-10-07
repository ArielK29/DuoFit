-- RLS test for progress_settings and weight_entries. Two throw-away users in a transaction; ends with
-- an exception so NOTHING is kept. Every line must say good/ok or match "expect".
do $$
declare
  a uuid := '00000000-0000-0000-0000-0000000000b1';
  b uuid := '00000000-0000-0000-0000-0000000000b2';
  wid uuid;
  res text := '';
  n int;
begin
  insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at)
  select x, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', x::text || '@test.invalid', '{"display_name":"T"}'::jsonb, now(), now()
  from unnest(array[a, b]) as x;

  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.progress_settings (weekly_goal, goal_weight_kg, plank_best_seconds) values (4, 76.5, 120);
  res := res || '1 a saves own settings: ok' || E'\n';
  insert into public.progress_settings (weekly_goal, goal_weight_kg, plank_best_seconds) values (3, null, null)
    on conflict (user_id) do update set weekly_goal = excluded.weekly_goal;
  select weekly_goal into n from public.progress_settings;
  res := res || '2 a upserts own settings (expect 3): ' || n || E'\n';
  begin
    insert into public.progress_settings (user_id, weekly_goal) values (b, 2);
    res := res || '3 a writes settings for b: ALLOWED (BAD)' || E'\n';
  exception when others then
    res := res || '3 a writes settings for b: blocked (good)' || E'\n';
  end;
  begin
    update public.progress_settings set weekly_goal = 9;
    res := res || '4 a sets a weekly goal of 9: ALLOWED (BAD)' || E'\n';
  exception when others then
    res := res || '4 a sets a weekly goal of 9: blocked (good)' || E'\n';
  end;
  begin
    update public.progress_settings set plank_best_seconds = 999999;
    res := res || '5 a sets a plank record of 999999 s: ALLOWED (BAD)' || E'\n';
  exception when others then
    res := res || '5 a sets a plank record of 999999 s: blocked (good)' || E'\n';
  end;

  insert into public.weight_entries (id, kg) values (gen_random_uuid(), 80.4) returning id into wid;
  res := res || '6 a logs a weight: ok' || E'\n';
  begin
    insert into public.weight_entries (kg) values (5);
    res := res || '7 a logs 5 kg: ALLOWED (BAD)' || E'\n';
  exception when others then
    res := res || '7 a logs 5 kg: blocked (good)' || E'\n';
  end;
  begin
    insert into public.weight_entries (kg, logged_at) values (80, '2100-01-01');
    res := res || '8 a forges logged_at: ALLOWED (BAD)' || E'\n';
  exception when others then
    res := res || '8 a forges logged_at: blocked (good)' || E'\n';
  end;
  begin
    update public.weight_entries set kg = 70 where id = wid;
    res := res || '9 a edits a weight entry: ALLOWED (BAD)' || E'\n';
  exception when others then
    res := res || '9 a edits a weight entry: blocked (good)' || E'\n';
  end;
  begin
    delete from public.weight_entries where id = wid;
    res := res || '10 a deletes a weight entry: ALLOWED (BAD)' || E'\n';
  exception when others then
    res := res || '10 a deletes a weight entry: blocked (good)' || E'\n';
  end;

  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.progress_settings;
  res := res || '11 b sees settings of others (expect 0): ' || n || E'\n';
  select count(*) into n from public.weight_entries;
  res := res || '12 b sees weights of others (expect 0): ' || n || E'\n';
  begin
    insert into public.weight_entries (user_id, kg) values (a, 70);
    res := res || '13 b logs a weight for a: ALLOWED (BAD)' || E'\n';
  exception when others then
    res := res || '13 b logs a weight for a: blocked (good)' || E'\n';
  end;

  reset role;
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  set local role anon;
  begin
    select count(*) into n from public.weight_entries;
    res := res || '14 anon reads weights, rows (expect denied or 0): ' || n || E'\n';
  exception when others then
    res := res || '14 anon reads weights: denied (good)' || E'\n';
  end;
  reset role;

  raise exception E'RLS_PROGRESS_TEST_RESULTS\n%', res;
end $$;
