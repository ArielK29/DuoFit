-- Test for migration 20261104_teen_mode (teen world, parental consent, minimum age 13). Same way of running as rls_identity_test.sql:
-- paste the migration first and THIS file right after it into ONE batch; the batch ends with an exception so everything is rolled back.
-- Every line of the result must say good.
do $test$
declare
  a uuid := '00000000-0000-0000-0000-0000000000f1'; -- adult (1990)
  b uuid := '00000000-0000-0000-0000-0000000000f2'; -- adult (1985)
  t1 uuid := '00000000-0000-0000-0000-0000000000f3'; -- teen, 15
  t2 uuid := '00000000-0000-0000-0000-0000000000f4'; -- teen, 16
  t3 uuid := '00000000-0000-0000-0000-0000000000f5'; -- teen, 13
  g1 uuid := '00000000-0000-0000-0000-0000000000f6'; -- sends a 12-year-old check
  g2 uuid := '00000000-0000-0000-0000-0000000000f7'; -- sends a 13-year-old check
  g3 uuid := '00000000-0000-0000-0000-0000000000f8'; -- sends a 15-year-old check while teen mode is off
  res text := '';
  n int;
  ok boolean;
  sp text;
begin
  insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at)
  select x, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', x::text || '@test.invalid', '{"display_name":"T"}'::jsonb, now(), now()
  from unnest(array[a, b, t1, t2, t3, g1, g2, g3]) as x;
  update public.profiles set gender = 'M', fitness_level = 'Beginner', favorite_activities = array['Running'] where id in (a, b, t1, t2, t3, g1, g2, g3);
  -- the checks are written by trusted code (this batch), as an admin would approve them
  insert into public.identity_checks (user_id, birth_date, gesture, challenge_code, status) values
    (a,  (current_date - interval '36 years')::date, 'peace', '111', 'approved'),
    (b,  (current_date - interval '41 years')::date, 'peace', '111', 'approved'),
    (t1, (current_date - interval '15 years 30 days')::date, 'peace', '111', 'approved'),
    (t2, (current_date - interval '16 years 30 days')::date, 'peace', '111', 'approved'),
    (t3, (current_date - interval '13 years 30 days')::date, 'peace', '111', 'approved');

  -- 0 switch OFF after the migration: everything as before
  select enabled into ok from public.app_flags where key = 'teen_mode';
  res := res || '0a teen_mode starts OFF (expect off): ' || case when ok = false then 'good' else 'BAD' end || E'\n';
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.profiles where id in (t1, t2, b);
  res := res || '0b off: the adult sees everybody as before (expect 3): ' || n || ' ' || case when n = 3 then 'good' else 'BAD' end || E'\n';
  ok := true;
  begin
    insert into public.conversations (user_a, user_b) values (a, t1);
  exception when others then ok := false; sp := sqlerrm;
  end;
  res := res || '0c off: the adult can start a chat with a teen as before (expect allowed): ' || case when ok then 'good' else 'BAD ' || coalesce(sp, '') end || E'\n';
  ok := false;
  begin
    insert into public.identity_checks (user_id, birth_date, gesture, challenge_code) values (g3, (current_date - interval '15 years')::date, 'peace', '111');
  exception when others then ok := true;
  end;
  res := res || '0d off: a 15-year-old is still refused (expect refused): ' || case when ok then 'good' else 'BAD' end || E'\n';
  reset role;

  update public.app_flags set enabled = true where key = 'teen_mode';

  -- 1 the wall between the worlds (profiles)
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.profiles where id in (t1, t2, t3);
  res := res || '1a on: the adult sees no teen profile (expect 0): ' || n || ' ' || case when n = 0 then 'good' else 'BAD' end || E'\n';
  select count(*) into n from public.profiles where id = b;
  res := res || '1b on: the adult still sees another adult (expect 1): ' || n || ' ' || case when n = 1 then 'good' else 'BAD' end || E'\n';
  ok := false;
  begin
    insert into public.conversations (user_a, user_b) values (b, t1);
  exception when others then ok := true;
  end;
  res := res || '1c on: an adult cannot start a chat with a teen (expect refused): ' || case when ok then 'good' else 'BAD' end || E'\n';
  reset role;

  perform set_config('request.jwt.claims', json_build_object('sub', t1, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.profiles where id in (a, b);
  res := res || '1d on: a teen sees no adult profile (expect 0): ' || n || ' ' || case when n = 0 then 'good' else 'BAD' end || E'\n';
  select count(*) into n from public.profiles where id = t2;
  res := res || '1e on: a 15-year-old sees a 16-year-old, one year apart (expect 1): ' || n || ' ' || case when n = 1 then 'good' else 'BAD' end || E'\n';
  select count(*) into n from public.profiles where id = t3;
  res := res || '1f on: a 15-year-old does not see a 13-year-old, two years apart (expect 0): ' || n || ' ' || case when n = 0 then 'good' else 'BAD' end || E'\n';
  select count(*) into n from public.profiles where id = t1;
  res := res || '1g on: a teen still sees his own profile (expect 1): ' || n || ' ' || case when n = 1 then 'good' else 'BAD' end || E'\n';

  -- 2 consent: without the parent's yes a teen cannot start a chat
  ok := false;
  begin
    insert into public.conversations (user_a, user_b) values (t1, t2);
  exception when others then ok := true;
  end;
  res := res || '2a on: a teen without parental consent cannot start a chat (expect refused): ' || case when ok then 'good' else 'BAD' end || E'\n';
  ok := false;
  begin
    insert into public.parental_consents (user_id, parent_email, token_hash, status) values (t1, 'parent@test.invalid', 'x', 'approved');
  exception when others then ok := true;
  end;
  res := res || '2b a member cannot write his own consent (expect refused): ' || case when ok then 'good' else 'BAD' end || E'\n';
  reset role;
  insert into public.parental_consents (user_id, parent_email, token_hash, status) values (t1, 'parent@test.invalid', 'x', 'approved'), (t2, 'parent2@test.invalid', 'y', 'pending');

  perform set_config('request.jwt.claims', json_build_object('sub', t1, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.parental_consents;
  res := res || '2c a teen reads only his own consent row (expect 1): ' || n || ' ' || case when n = 1 then 'good' else 'BAD' end || E'\n';
  ok := false;
  begin
    perform parent_email from public.parental_consents;
  exception when others then ok := true;
  end;
  res := res || '2d the parent e-mail is not readable by the member (expect refused): ' || case when ok then 'good' else 'BAD' end || E'\n';
  ok := false;
  begin
    update public.parental_consents set status = 'approved' where user_id = t1;
  exception when others then ok := true;
  end;
  res := res || '2e a member cannot change a consent (expect refused): ' || case when ok then 'good' else 'BAD' end || E'\n';
  reset role;
  -- the parent of t1 said yes and t2's is still pending; make t2 approved too so we can test the chat
  update public.parental_consents set status = 'approved' where user_id = t2;

  perform set_config('request.jwt.claims', json_build_object('sub', t1, 'role', 'authenticated')::text, true);
  set local role authenticated;
  ok := true;
  begin
    insert into public.conversations (user_a, user_b) values (t1, t2);
  exception when others then ok := false; sp := sqlerrm;
  end;
  res := res || '2f on: with consent a 15-year-old can chat with a 16-year-old (expect allowed): ' || case when ok then 'good' else 'BAD ' || coalesce(sp, '') end || E'\n';

  -- 3 teens do not post, comment, like, create or join groups
  ok := false;
  begin
    insert into public.posts (activity, body) values ('כוח', 'x');
  exception when others then ok := true;
  end;
  res := res || '3a on: a teen cannot post (expect refused): ' || case when ok then 'good' else 'BAD' end || E'\n';
  ok := false;
  begin
    insert into public.groups (name, activity) values ('teen group', 'כוח');
  exception when others then ok := true;
  end;
  res := res || '3b on: a teen cannot create a group (expect refused): ' || case when ok then 'good' else 'BAD' end || E'\n';
  reset role;

  -- 4 the minimum age follows the switch
  perform set_config('request.jwt.claims', json_build_object('sub', g1, 'role', 'authenticated')::text, true);
  set local role authenticated;
  ok := false;
  begin
    insert into public.identity_checks (user_id, birth_date, gesture, challenge_code) values (g1, (current_date - interval '12 years 300 days')::date, 'peace', '111');
  exception when others then ok := true;
  end;
  res := res || '4a on: a 12-year-old is still refused (expect refused): ' || case when ok then 'good' else 'BAD' end || E'\n';
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', g2, 'role', 'authenticated')::text, true);
  set local role authenticated;
  ok := true;
  begin
    insert into public.identity_checks (user_id, birth_date, gesture, challenge_code) values (g2, (current_date - interval '13 years 30 days')::date, 'peace', '111');
  exception when others then ok := false; sp := sqlerrm;
  end;
  res := res || '4b on: a 13-year-old can send a check (expect allowed): ' || case when ok then 'good' else 'BAD ' || coalesce(sp, '') end || E'\n';
  reset role;

  -- 5 adults are unchanged when the switch is on
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  ok := true;
  begin
    insert into public.posts (activity, body) values ('כוח', 'x');
  exception when others then ok := false; sp := sqlerrm;
  end;
  res := res || '5a on: an adult can still post (expect allowed): ' || case when ok then 'good' else 'BAD ' || coalesce(sp, '') end || E'\n';
  ok := true;
  begin
    insert into public.conversations (user_a, user_b) values (a, b);
  exception when others then ok := false; sp := sqlerrm;
  end;
  res := res || '5b on: an adult can still start a chat with an adult (expect allowed): ' || case when ok then 'good' else 'BAD ' || coalesce(sp, '') end || E'\n';
  reset role;

  raise exception E'\n%', res;
end;
$test$;
