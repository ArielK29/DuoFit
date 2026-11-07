-- RLS test for support_requests. Three throw-away users (a, b and an admin c) in a transaction; ends with an exception
-- so NOTHING is kept. Every line must say good/ok or match "expect".
do $$
declare
  a uuid := '00000000-0000-0000-0000-0000000000d1';
  b uuid := '00000000-0000-0000-0000-0000000000d2';
  c uuid := '00000000-0000-0000-0000-0000000000d3';
  rid uuid;
  res text := '';
  n int;
  st text;
  handled timestamptz;
begin
  insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at)
  select x, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', x::text || '@test.invalid', '{"display_name":"T"}'::jsonb, now(), now()
  from unnest(array[a, b, c]) as x;
  insert into public.app_admins (user_id) values (c);

  -- a files a request
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.support_requests (topic, message, app_version) values ('bug', '  The steps do not move on the home page  ', '1.0.1') returning id into rid;
  res := res || '1 a files a request: ok' || E'\n';
  select status, length(message) into st, n from public.support_requests where id = rid;
  res := res || '2 status starts as new and the message is trimmed (expect new, 38): ' || st || ', ' || n || E'\n';

  begin
    insert into public.support_requests (user_id, topic, message) values (b, 'bug', 'a request in the name of b');
    res := res || '3 a files a request in the name of b: ALLOWED (BAD)' || E'\n';
  exception when others then
    res := res || '3 a files a request in the name of b: blocked (good)' || E'\n';
  end;
  begin
    insert into public.support_requests (topic, message, status) values ('bug', 'a request that is already done', 'done');
    res := res || '4 a files a request with status done: ALLOWED (BAD)' || E'\n';
  exception when others then
    res := res || '4 a files a request with status done: blocked (good)' || E'\n';
  end;
  begin
    insert into public.support_requests (topic, message, admin_note) values ('bug', 'a request with an admin note', 'x');
    res := res || '5 a writes an admin note: ALLOWED (BAD)' || E'\n';
  exception when others then
    res := res || '5 a writes an admin note: blocked (good)' || E'\n';
  end;
  begin
    insert into public.support_requests (topic, message) values ('bug', 'short');
    res := res || '6 a message of 5 characters: ALLOWED (BAD)' || E'\n';
  exception when others then
    res := res || '6 a message of 5 characters: blocked (good)' || E'\n';
  end;
  begin
    insert into public.support_requests (topic, message) values ('bug', repeat('x', 2001));
    res := res || '7 a message of 2001 characters: ALLOWED (BAD)' || E'\n';
  exception when others then
    res := res || '7 a message of 2001 characters: blocked (good)' || E'\n';
  end;
  begin
    insert into public.support_requests (topic, message) values ('spam', 'a request with an unknown topic');
    res := res || '8 an unknown topic: ALLOWED (BAD)' || E'\n';
  exception when others then
    res := res || '8 an unknown topic: blocked (good)' || E'\n';
  end;
  begin
    insert into public.support_requests (topic, message, created_at) values ('bug', 'a request with a forged time', '2000-01-01');
    res := res || '9 a forges created_at: ALLOWED (BAD)' || E'\n';
  exception when others then
    res := res || '9 a forges created_at: blocked (good)' || E'\n';
  end;

  -- a cannot change the request, b cannot see it
  update public.support_requests set status = 'done' where id = rid;
  get diagnostics n = row_count;
  res := res || '10 a sets own request to done, rows changed (expect 0): ' || n || E'\n';
  begin
    update public.support_requests set message = 'a rewrites the message afterwards' where id = rid;
    get diagnostics n = row_count;
    res := res || '11 a rewrites the message, rows changed (expect 0 or denied): ' || n || E'\n';
  exception when others then
    res := res || '11 a rewrites the message: denied (good)' || E'\n';
  end;
  begin
    delete from public.support_requests where id = rid;
    get diagnostics n = row_count;
    res := res || '12 a deletes the request, rows deleted (expect 0 or denied): ' || n || E'\n';
  exception when others then
    res := res || '12 a deletes the request: denied (good)' || E'\n';
  end;
  select count(*) into n from public.support_requests;
  res := res || '13 a sees own requests (expect 1): ' || n || E'\n';

  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.support_requests;
  res := res || '14 b sees requests of others (expect 0): ' || n || E'\n';
  update public.support_requests set status = 'done' where id = rid;
  get diagnostics n = row_count;
  res := res || '15 b changes the request of a, rows changed (expect 0): ' || n || E'\n';

  -- the admin
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', c, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.support_requests;
  res := res || '16 admin sees the request (expect 1): ' || n || E'\n';
  update public.support_requests set status = 'done', admin_note = 'fixed in build 31' where id = rid;
  get diagnostics n = row_count;
  res := res || '17 admin marks it done, rows changed (expect 1): ' || n || E'\n';
  select status, handled_at into st, handled from public.support_requests where id = rid;
  res := res || '18 status done and handled_at stamped by the server (expect done, true): ' || st || ', ' || (handled is not null) || E'\n';
  update public.support_requests set status = 'in_progress' where id = rid;
  select handled_at into handled from public.support_requests where id = rid;
  res := res || '19 reopened, handled_at cleared (expect true): ' || (handled is null) || E'\n';
  begin
    update public.support_requests set message = 'the admin rewrites the member message' where id = rid;
    res := res || '20 admin rewrites the member message: ALLOWED (BAD)' || E'\n';
  exception when others then
    res := res || '20 admin rewrites the member message: blocked (good)' || E'\n';
  end;
  begin
    update public.support_requests set status = 'archived' where id = rid;
    res := res || '21 admin sets an unknown status: ALLOWED (BAD)' || E'\n';
  exception when others then
    res := res || '21 admin sets an unknown status: blocked (good)' || E'\n';
  end;

  -- limit of 5 per 24 hours (a already filed 1 above that counted)
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  for i in 1..4 loop
    insert into public.support_requests (topic, message) values ('other', 'request number ' || i || ' of the day');
  end loop;
  res := res || '22 a files up to 5 in a day: ok' || E'\n';
  begin
    insert into public.support_requests (topic, message) values ('other', 'the sixth request of the day');
    res := res || '23 a files a 6th request in a day: ALLOWED (BAD)' || E'\n';
  exception when others then
    res := res || '23 a files a 6th request in a day: blocked (good)' || E'\n';
  end;

  -- anon
  reset role;
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  set local role anon;
  begin
    select count(*) into n from public.support_requests;
    res := res || '24 anon reads requests, rows (expect denied or 0): ' || n || E'\n';
  exception when others then
    res := res || '24 anon reads requests: denied (good)' || E'\n';
  end;
  begin
    insert into public.support_requests (topic, message) values ('bug', 'an anonymous request');
    res := res || '25 anon files a request: ALLOWED (BAD)' || E'\n';
  exception when others then
    res := res || '25 anon files a request: denied (good)' || E'\n';
  end;
  reset role;

  -- deleting the account removes the requests
  delete from auth.users where id = a;
  select count(*) into n from public.support_requests where user_id = a;
  res := res || '26 requests of a deleted account (expect 0): ' || n || E'\n';

  raise exception E'SUPPORT_REQUESTS_TEST_RESULTS\n%', res;
end $$;
