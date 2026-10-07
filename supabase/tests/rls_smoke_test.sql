-- RLS smoke test. Run it with the Supabase MCP execute_sql (or the SQL editor) after ANY change to
-- policies, grants or functions. It creates two throw-away users inside a transaction, tries to
-- break the rules as each of them, and ends with an exception so NOTHING is kept.
-- Expected: every line says "(good)", "ok", or matches its "expect" value. Any "BAD" or mismatch = fix before merging.
-- When you add a table, add its checks here (own rows visible, other users' rows hidden, anon blocked).
do $$
declare
  a uuid := gen_random_uuid();
  b uuid := gen_random_uuid();
  res text := '';
  n int;
begin
  insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at)
  values
    (a, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rls-a@test.invalid', '{"display_name":"A"}'::jsonb, now(), now()),
    (b, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rls-b@test.invalid', '{"display_name":"B"}'::jsonb, now(), now());
  select count(*) into n from public.profiles where id in (a, b);
  res := res || '1 trigger created profiles (expect 2): ' || n || E'\n';

  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;

  -- Counts below only look at the two test users: real members (if any) are visible by design.
  select count(*) into n from public.profiles where id in (a, b);
  res := res || '2 A sees profiles (expect 1, only own; B incomplete): ' || n || E'\n';
  update public.profiles set bio = 'hacked' where id = b;
  get diagnostics n = row_count;
  res := res || '3 A updates B profile, rows changed (expect 0): ' || n || E'\n';
  update public.profiles set bio = 'mine' where id = a;
  get diagnostics n = row_count;
  res := res || '4 A updates own profile, rows changed (expect 1): ' || n || E'\n';
  begin
    update public.profiles set id = b where id = a;
    res := res || '5 A reassigns own row to B: ALLOWED (BAD)' || E'\n';
  exception when others then
    res := res || '5 A reassigns own row to B: blocked (good)' || E'\n';
  end;
  begin
    insert into public.profiles (id, display_name) values (gen_random_uuid(), 'fake');
    res := res || '6 A inserts a profile for another id: ALLOWED (BAD)' || E'\n';
  exception when others then
    res := res || '6 A inserts a profile for another id: blocked (good)' || E'\n';
  end;
  delete from public.profiles where id in (a, b);
  get diagnostics n = row_count;
  res := res || '7 A deletes profiles, rows deleted (expect 0): ' || n || E'\n';
  begin
    update public.profiles set display_name = repeat('x', 200) where id = a;
    res := res || '8 A saves a 200-char name: ALLOWED (BAD)' || E'\n';
  exception when others then
    res := res || '8 A saves a 200-char name: blocked (good)' || E'\n';
  end;

  begin
    insert into storage.objects (bucket_id, name, owner_id) values ('avatars', a::text || '/avatar.jpg', a::text);
    res := res || '9 A uploads to own folder: ok' || E'\n';
  exception when others then
    res := res || '9 A uploads to own folder: BLOCKED (BAD): ' || sqlerrm || E'\n';
  end;
  begin
    insert into storage.objects (bucket_id, name, owner_id) values ('avatars', b::text || '/avatar.jpg', a::text);
    res := res || '10 A uploads into B folder: ALLOWED (BAD)' || E'\n';
  exception when others then
    res := res || '10 A uploads into B folder: blocked (good)' || E'\n';
  end;
  select count(*) into n from storage.objects where bucket_id = 'avatars';
  res := res || '11 A sees avatar objects (expect 1, own, needed for upsert): ' || n || E'\n';
  update storage.objects set updated_at = now() where bucket_id = 'avatars' and name = a::text || '/avatar.jpg';
  get diagnostics n = row_count;
  res := res || '12 A replaces own avatar (upsert path), rows (expect 1): ' || n || E'\n';

  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.profiles where id in (a, b);
  res := res || '13 B sees profiles (expect 1; A incomplete): ' || n || E'\n';
  select count(*) into n from storage.objects where bucket_id = 'avatars';
  res := res || '14 B sees avatar objects (expect 0, A file hidden): ' || n || E'\n';

  reset role;
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  set local role anon;
  begin
    select count(*) into n from public.profiles;
    res := res || '15 anon reads profiles, rows (expect denied or 0): ' || n || E'\n';
  exception when others then
    res := res || '15 anon reads profiles: denied (good)' || E'\n';
  end;
  begin
    perform public.handle_new_user();
    res := res || '16 anon calls handle_new_user: ALLOWED (BAD)' || E'\n';
  exception when others then
    res := res || '16 anon calls handle_new_user: blocked (good)' || E'\n';
  end;
  reset role;

  -- Partner discovery: B completes the profile (done as the table owner), then A looks.
  update public.profiles set gender = 'M', fitness_level = 'Beginner', favorite_activities = array['ריצה'] where id = b;
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.profiles where id in (a, b);
  res := res || '17 A sees profiles after B completed theirs (expect 2: own + B): ' || n || E'\n';
  select count(*) into n from public.profiles where id = b and display_name = 'B';
  res := res || '18 A can read B public fields (expect 1): ' || n || E'\n';
  update public.profiles set bio = 'hacked' where id = b;
  get diagnostics n = row_count;
  res := res || '19 A still cannot update B (expect 0): ' || n || E'\n';
  begin
    perform created_at, favorite_activities from public.profiles where id = b;
    res := res || '20 A reads allowed public columns of B: ok' || E'\n';
  exception when others then
    res := res || '20 A reads allowed public columns of B: BLOCKED (BAD)' || E'\n';
  end;
  reset role;
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  set local role anon;
  begin
    select count(*) into n from public.profiles;
    res := res || '21 anon reads profiles, rows (expect denied or 0): ' || n || E'\n';
  exception when others then
    res := res || '21 anon reads profiles: denied (good)' || E'\n';
  end;
  reset role;

  raise exception E'RLS_TEST_RESULTS\n%', res;
end $$;
