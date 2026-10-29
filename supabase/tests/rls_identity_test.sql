-- Test for migration 20261029_identity_verification_18plus.sql (adults only + verified members only).
-- HOW TO RUN (nothing is kept): paste the migration SQL first and THIS file right after it into ONE statement batch
-- (one execute_sql call). The batch ends with an exception, so the migration and the test data are rolled back together.
-- After the migration is applied for real, run this file alone (the same way, ending in the exception).
-- Every line of the result must say good.
do $test$
declare
  a uuid := '00000000-0000-0000-0000-0000000000e1'; -- member, gets approved
  b uuid := '00000000-0000-0000-0000-0000000000e2'; -- member, gets approved
  c uuid := '00000000-0000-0000-0000-0000000000e3'; -- admin
  d uuid := '00000000-0000-0000-0000-0000000000e4'; -- member who never sends a check
  res text := '';
  n int;
  ok boolean;
  st text;
  sp text;
begin
  insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at)
  select x, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', x::text || '@test.invalid', '{"display_name":"T"}'::jsonb, now(), now()
  from unnest(array[a, b, c, d]) as x;
  update public.profiles set gender = 'M', fitness_level = 'Beginner', favorite_activities = array['Running'] where id in (a, b, c, d);
  insert into public.app_admins (user_id) values (c);

  -- 1 a minor cannot send a check
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  ok := false;
  begin
    insert into public.identity_checks (user_id, birth_date, gesture) values (a, (current_date - interval '17 years 364 days')::date, 'peace');
  exception when others then ok := true;
  end;
  res := res || '1 a 17-year-old is refused (expect refused): ' || case when ok then 'good' else 'BAD' end || E'\n';

  -- 2 an adult sends a check; even if the app writes status approved it starts as pending
  insert into public.identity_checks (user_id, birth_date, gesture, status, selfie_path)
  values (a, (current_date - interval '18 years')::date, 'peace', 'approved', a::text || '/s1.jpg');
  select status into st from public.identity_checks where user_id = a;
  res := res || '2 a self-declared approved becomes pending (expect pending): ' || st || ' ' || case when st = 'pending' then 'good' else 'BAD' end || E'\n';

  -- 3 a cannot approve himself with an update, and cannot set the badge
  update public.identity_checks set status = 'approved' where user_id = a;
  select status into st from public.identity_checks where user_id = a;
  res := res || '3 a cannot approve himself (expect pending): ' || st || ' ' || case when st = 'pending' then 'good' else 'BAD' end || E'\n';
  ok := false;
  begin
    update public.profiles set verified = true where id = a;
  exception when others then ok := true;
  end;
  res := res || '4 a cannot write the verified badge (expect refused): ' || case when ok then 'good' else 'BAD' end || E'\n';

  -- 5 nobody can make himself admin
  ok := false;
  begin
    insert into public.app_admins (user_id) values (a);
  exception when others then ok := true;
  end;
  res := res || '5 a cannot become an admin (expect refused): ' || case when ok then 'good' else 'BAD' end || E'\n';
  reset role;

  -- b sends a check too
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.identity_checks (user_id, birth_date, gesture, selfie_path)
  values (b, '1990-01-01', 'thumb_up', b::text || '/s1.jpg');
  reset role;

  -- 6 nobody is verified yet: nobody sees anybody
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.profiles where id <> a;
  res := res || '6 before any approval a sees no other member (expect 0): ' || n || ' ' || case when n = 0 then 'good' else 'BAD' end || E'\n';
  reset role;

  -- 7 a member cannot read the check of another member, the admin reads all
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.identity_checks where user_id = b;
  res := res || '7 a cannot read the check of b (expect 0): ' || n || ' ' || case when n = 0 then 'good' else 'BAD' end || E'\n';
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', c, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.identity_checks where user_id in (a, b);
  res := res || '8 the admin reads both checks (expect 2): ' || n || ' ' || case when n = 2 then 'good' else 'BAD' end || E'\n';

  -- 9 the admin approves a and rejects b; the badge follows
  update public.identity_checks set status = 'approved' where user_id = a;
  update public.identity_checks set status = 'rejected', reject_reason = 'התמונה לא ברורה' where user_id = b;
  reset role;
  select count(*) into n from public.profiles where id = a and verified;
  res := res || '9a the badge of a is on after approval (expect 1): ' || n || ' ' || case when n = 1 then 'good' else 'BAD' end || E'\n';
  select count(*) into n from public.profiles where id = b and verified;
  res := res || '9b b is rejected, no badge (expect 0): ' || n || ' ' || case when n = 0 then 'good' else 'BAD' end || E'\n';

  -- 10 a (verified) does not see b (not verified) and d (never checked)
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.profiles where id in (b, d);
  res := res || '10 a sees nobody who is not verified (expect 0): ' || n || ' ' || case when n = 0 then 'good' else 'BAD' end || E'\n';
  reset role;

  -- 11 b is rejected, sends a new check, the admin approves: now a and b see each other
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  set local role authenticated;
  update public.identity_checks set selfie_path = b::text || '/s2.jpg', gesture = 'fist' where user_id = b;
  select status into st from public.identity_checks where user_id = b;
  res := res || '11 b resubmits after a rejection (expect pending): ' || st || ' ' || case when st = 'pending' then 'good' else 'BAD' end || E'\n';
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', c, 'role', 'authenticated')::text, true);
  set local role authenticated;
  update public.identity_checks set status = 'approved' where user_id = b;
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.profiles where id = b;
  res := res || '12 a (verified) sees b (verified) (expect 1): ' || n || ' ' || case when n = 1 then 'good' else 'BAD' end || E'\n';
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', d, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.profiles where id in (a, b);
  res := res || '13 d (never checked) sees nobody (expect 0): ' || n || ' ' || case when n = 0 then 'good' else 'BAD' end || E'\n';

  -- 14 d cannot start a chat, a can
  ok := false;
  begin
    insert into public.conversations (user_a, user_b) values (d, a);
  exception when others then ok := true;
  end;
  res := res || '14 d cannot start a chat (expect refused): ' || case when ok then 'good' else 'BAD' end || E'\n';
  ok := false;
  begin
    insert into public.posts (activity, body) values ('כוח', 'x');
  exception when others then ok := true;
  end;
  res := res || '15 d cannot post (expect refused): ' || case when ok then 'good' else 'BAD' end || E'\n';
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  ok := true;
  begin
    insert into public.conversations (user_a, user_b) values (a, b);
  exception when others then ok := false; sp := sqlerrm;
  end;
  res := res || '16 a (verified) can start a chat with b (expect allowed): ' || case when ok then 'good' else 'BAD ' || coalesce(sp, '') end || E'\n';

  -- 17 an approved member cannot swap the photo afterwards
  update public.identity_checks set selfie_path = a::text || '/other.jpg', birth_date = '1980-01-01' where user_id = a;
  select selfie_path into sp from public.identity_checks where user_id = a;
  res := res || '17 a approved member cannot swap the selfie (expect s1.jpg): ' || sp || ' ' || case when sp = a::text || '/s1.jpg' then 'good' else 'BAD' end || E'\n';
  reset role;

  -- 18 selfie storage: own folder yes, somebody else's folder no, admin reads, other member does not
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  ok := true;
  begin
    insert into storage.objects (bucket_id, name, owner) values ('identity-selfies', a::text || '/s1.jpg', a);
  exception when others then ok := false; sp := sqlerrm;
  end;
  res := res || '18a a stores a selfie in his own folder (expect allowed): ' || case when ok then 'good' else 'BAD ' || coalesce(sp, '') end || E'\n';
  ok := false;
  begin
    insert into storage.objects (bucket_id, name, owner) values ('identity-selfies', b::text || '/x.jpg', a);
  exception when others then ok := true;
  end;
  res := res || '18b a cannot store into the folder of b (expect refused): ' || case when ok then 'good' else 'BAD' end || E'\n';
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from storage.objects where bucket_id = 'identity-selfies' and name like a::text || '/%';
  res := res || '18c b cannot read the selfie of a (expect 0): ' || n || ' ' || case when n = 0 then 'good' else 'BAD' end || E'\n';
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', c, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from storage.objects where bucket_id = 'identity-selfies' and name like a::text || '/%';
  res := res || '18d the admin reads the selfie of a (expect 1): ' || n || ' ' || case when n = 1 then 'good' else 'BAD' end || E'\n';
  reset role;

  -- 19 the admin reads the name of a member who is not verified (to review him)
  perform set_config('request.jwt.claims', json_build_object('sub', c, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.profiles where id = d;
  res := res || '19 the admin can read the profile of d, who is not verified (expect 1): ' || n || ' ' || case when n = 1 then 'good' else 'BAD' end || E'\n';
  reset role;

  -- 20 a (approved) changes the profile photo: the check is withdrawn, the badge goes off, a is back at the gate
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  update public.profiles set avatar_url = 'https://example.invalid/new.jpg' where id = a;
  select status into st from public.identity_checks where user_id = a;
  res := res || '20a a new profile photo withdraws the approval (expect rejected): ' || st || ' ' || case when st = 'rejected' then 'good' else 'BAD' end || E'\n';
  select count(*) into n from public.profiles where id = b;
  res := res || '20b a no longer sees b until the new check is approved (expect 0): ' || n || ' ' || case when n = 0 then 'good' else 'BAD' end || E'\n';
  update public.identity_checks set selfie_path = a::text || '/s3.jpg', gesture = 'wave' where user_id = a;
  select status into st from public.identity_checks where user_id = a;
  res := res || '20c a sends a new selfie (expect pending): ' || st || ' ' || case when st = 'pending' then 'good' else 'BAD' end || E'\n';
  reset role;
  select count(*) into n from public.profiles where id = a and verified;
  res := res || '20d the badge of a stays off until approved (expect 0): ' || n || ' ' || case when n = 0 then 'good' else 'BAD' end || E'\n';

  raise exception E'RESULTS (rolled back):\n%', res;
end;
$test$;
