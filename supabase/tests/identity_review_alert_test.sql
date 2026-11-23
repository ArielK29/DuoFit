-- Test for migration 20261123_identity_review_alert.sql (alert rows for the reviewers' e-mail).
-- HOW TO RUN (nothing is kept): paste the migration SQL first and THIS file right after it into ONE statement batch (one execute_sql
-- call); the batch ends with an exception, so the migration and the test data are rolled back together. After the migration is applied
-- for real, run this file alone the same way. Every line of the result must say good.
do $test$
declare
  a uuid := '00000000-0000-0000-0000-0000000000f1'; -- member
  b uuid := '00000000-0000-0000-0000-0000000000f2'; -- admin
  res text := '';
  n int;
  nt timestamptz;
begin
  insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at)
  select x, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', x::text || '@test.invalid', '{"display_name":"T"}'::jsonb, now(), now()
  from unnest(array[a, b]) as x;
  insert into public.app_admins (user_id) values (b);

  -- 1 a sends a check: an alert row appears, not yet mailed
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.identity_checks (user_id, birth_date, gesture, video_path, challenge_code)
  values (a, '1990-01-01', 'wave', a::text || '/v1.mp4', '123');
  reset role;
  select count(*), max(notified_at) into n, nt from public.identity_alerts where user_id = a;
  res := res || '1 a new check creates one unmailed alert (expect 1, null): ' || n || ', ' || coalesce(nt::text, 'null') || ' ' || case when n = 1 and nt is null then 'good' else 'BAD' end || E'\n';

  -- 2 the function marks it mailed; a decision by the admin does not create a new alert
  update public.identity_alerts set notified_at = now() where user_id = a;
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  set local role authenticated;
  update public.identity_checks set status = 'rejected', reject_reason = 'test' where user_id = a;
  reset role;
  select notified_at into nt from public.identity_alerts where user_id = a;
  res := res || '2 a rejection does not reopen the alert (expect still mailed): ' || case when nt is not null then 'good' else 'BAD' end || E'\n';

  -- 3 a sends a new video after the rejection: the alert is reopened
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  update public.identity_checks set video_path = a::text || '/v2.mp4', gesture = 'peace' where user_id = a;
  reset role;
  select notified_at into nt from public.identity_alerts where user_id = a;
  res := res || '3 a new video after a rejection reopens the alert (expect null): ' || coalesce(nt::text, 'null') || ' ' || case when nt is null then 'good' else 'BAD' end || E'\n';

  -- 4 nobody signed in can read or write the alerts table (member or admin)
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  begin
    select count(*) into n from public.identity_alerts;
    res := res || '4a a member cannot read alerts (expect permission denied): BAD ' || n || E'\n';
  exception when insufficient_privilege then
    res := res || '4a a member cannot read alerts (expect permission denied): good' || E'\n';
  end;
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  set local role authenticated;
  begin
    select count(*) into n from public.identity_alerts;
    res := res || '4b an admin cannot read alerts (expect permission denied): BAD ' || n || E'\n';
  exception when insufficient_privilege then
    res := res || '4b an admin cannot read alerts (expect permission denied): good' || E'\n';
  end;
  reset role;

  -- 5 the member's check is never blocked by the alert (the row exists and is pending)
  select count(*) into n from public.identity_checks where user_id = a and status = 'pending';
  res := res || '5 the check itself is saved and pending (expect 1): ' || n || ' ' || case when n = 1 then 'good' else 'BAD' end || E'\n';

  raise exception E'RESULTS (rolled back):\n%', res;
end;
$test$;
