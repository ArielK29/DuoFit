-- Test for migration 20261124_public_places_areas.sql (public meeting places only + member area).
-- HOW TO RUN (nothing is kept): paste the migration SQL first and THIS file right after it into ONE statement batch (one execute_sql
-- call); the batch ends with an exception, so the migration and the test data are rolled back together. After the migration is applied
-- for real, run this file alone the same way. Every line of the result must say good.
do $test$
declare
  u1 uuid := '00000000-0000-0000-0000-0000000000c1'; -- member (smaller id first, as the conversation table requires)
  u2 uuid := '00000000-0000-0000-0000-0000000000c2'; -- member
  u3 uuid := '00000000-0000-0000-0000-0000000000c3'; -- admin
  conv uuid;
  good_place uuid;
  inv uuid := gen_random_uuid();
  res text := '';
  n int;
  aid smallint;
  soon text := to_char(now() + interval '1 day', 'YYYY-MM-DD"T"HH24:MI:SS"Z"');
begin
  insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at)
  select x, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', x::text || '@test.invalid', '{"display_name":"T"}'::jsonb, now(), now()
  from unnest(array[u1, u2, u3]) as x;
  insert into public.app_admins (user_id) values (u3);
  select id into good_place from public.public_places where name = 'מגרש כדורסל גורדון';
  select id into aid from public.areas where name_he = 'חיפה';

  perform set_config('request.jwt.claims', json_build_object('sub', u1, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.conversations (user_a, user_b) values (u1, u2) returning id into conv;

  -- 1 the switch is OFF after the migration: a typed place still works (nothing changes for build 1.0.1)
  begin
    insert into public.messages (conversation_id, kind, invite)
    values (conv, 'invite', jsonb_build_object('activity', 'אימון משותף', 'location', 'מקום חופשי', 'scheduledAt', soon, 'status', 'pending'));
    res := res || '1 switch OFF: a typed place is accepted (old behaviour): good' || E'\n';
  exception when others then
    res := res || '1 switch OFF: a typed place is accepted (old behaviour): BAD ' || sqlerrm || E'\n';
  end;

  -- the owner turns the switch ON
  reset role;
  update public.app_flags set enabled = true where key = 'public_places_only';
  perform set_config('request.jwt.claims', json_build_object('sub', u1, 'role', 'authenticated')::text, true);
  set local role authenticated;

  -- 2 a street address typed as the place is refused
  begin
    insert into public.messages (conversation_id, kind, invite)
    values (conv, 'invite', jsonb_build_object('activity', 'אימון משותף', 'location', 'הרצל 5', 'scheduledAt', soon, 'status', 'pending'));
    res := res || '2a switch ON: "הרצל 5" without a placeId: BAD (accepted)' || E'\n';
  exception when check_violation then
    res := res || '2a switch ON: "הרצל 5" without a placeId is refused: good' || E'\n';
  end;
  -- 2b the same address written in words (a word filter would miss it) is refused too
  begin
    insert into public.messages (conversation_id, kind, invite)
    values (conv, 'invite', jsonb_build_object('activity', 'אימון משותף', 'location', 'הרצל חמש', 'scheduledAt', soon, 'status', 'pending'));
    res := res || '2b switch ON: an address written in words: BAD (accepted)' || E'\n';
  exception when check_violation then
    res := res || '2b switch ON: an address written in words is refused: good' || E'\n';
  end;

  -- 3 a real place id with a different (address) text is refused
  begin
    insert into public.messages (conversation_id, kind, invite)
    values (conv, 'invite', jsonb_build_object('activity', 'אימון משותף', 'location', 'הרצל 5', 'placeId', good_place, 'scheduledAt', soon, 'status', 'pending'));
    res := res || '3 a valid placeId with another text: BAD (accepted)' || E'\n';
  exception when check_violation then
    res := res || '3 a valid placeId with another text is refused: good' || E'\n';
  end;

  -- 4 an address hidden in the activity is refused
  begin
    insert into public.messages (conversation_id, kind, invite)
    values (conv, 'invite', jsonb_build_object('activity', 'אצלי ברחוב הרצל 5', 'location', 'מגרש כדורסל גורדון', 'placeId', good_place, 'scheduledAt', soon, 'status', 'pending'));
    res := res || '4 an address in the activity: BAD (accepted)' || E'\n';
  exception when check_violation then
    res := res || '4 an address in the activity is refused: good' || E'\n';
  end;

  -- 5 an extra key that could carry text is refused
  begin
    insert into public.messages (conversation_id, kind, invite)
    values (conv, 'invite', jsonb_build_object('activity', 'אימון משותף', 'location', 'מגרש כדורסל גורדון', 'placeId', good_place, 'note', 'בוא אליי', 'scheduledAt', soon, 'status', 'pending'));
    res := res || '5 an extra key in the invitation: BAD (accepted)' || E'\n';
  exception when check_violation then
    res := res || '5 an extra key in the invitation is refused: good' || E'\n';
  end;

  -- 6 a garbage placeId is refused
  begin
    insert into public.messages (conversation_id, kind, invite)
    values (conv, 'invite', jsonb_build_object('activity', 'אימון משותף', 'location', 'מגרש כדורסל גורדון', 'placeId', 'not-a-uuid', 'scheduledAt', soon, 'status', 'pending'));
    res := res || '6 a garbage placeId: BAD (accepted)' || E'\n';
  exception when check_violation then
    res := res || '6 a garbage placeId is refused: good' || E'\n';
  end;

  -- 7 the valid invitation (place from the list, exact name, known activity) is accepted
  begin
    insert into public.messages (id, conversation_id, kind, invite)
    values (inv, conv, 'invite', jsonb_build_object('activity', 'אימון משותף', 'location', 'מגרש כדורסל גורדון', 'placeId', good_place, 'scheduledAt', soon, 'status', 'pending'));
    res := res || '7 a place from the list is accepted: good' || E'\n';
  exception when others then
    res := res || '7 a place from the list is accepted: BAD ' || sqlerrm || E'\n';
  end;

  -- 8 plain chat text is not affected
  begin
    insert into public.messages (conversation_id, kind, body) values (conv, 'text', 'hello');
    res := res || '8 a text message is not affected: good' || E'\n';
  exception when others then
    res := res || '8 a text message is not affected: BAD ' || sqlerrm || E'\n';
  end;

  -- 9 u2 accepts: the workout is created with the place name from the list
  perform set_config('request.jwt.claims', json_build_object('sub', u2, 'role', 'authenticated')::text, true);
  begin
    update public.messages set invite = invite || '{"status":"accepted"}'::jsonb where id = inv;
    select count(*) into n from public.workouts where id = inv and location = 'מגרש כדורסל גורדון';
    res := res || '9 accepting creates the workout with the listed place (expect 1): ' || n || ' ' || case when n = 1 then 'good' else 'BAD' end || E'\n';
  exception when others then
    res := res || '9 accepting creates the workout: BAD ' || sqlerrm || E'\n';
  end;

  -- 10 a place that is switched off is refused (switched off by the owner)
  reset role;
  update public.public_places set active = false where id = good_place;
  perform set_config('request.jwt.claims', json_build_object('sub', u1, 'role', 'authenticated')::text, true);
  set local role authenticated;
  begin
    insert into public.messages (conversation_id, kind, invite)
    values (conv, 'invite', jsonb_build_object('activity', 'אימון משותף', 'location', 'מגרש כדורסל גורדון', 'placeId', good_place, 'scheduledAt', soon, 'status', 'pending'));
    res := res || '10 an inactive place: BAD (accepted)' || E'\n';
  exception when check_violation then
    res := res || '10 an inactive place is refused: good' || E'\n';
  end;
  select count(*) into n from public.public_places where id = good_place;
  res := res || '10b members do not see inactive places (expect 0): ' || n || ' ' || case when n = 0 then 'good' else 'BAD' end || E'\n';

  -- 11 members cannot change the places or the areas through the API
  begin
    update public.public_places set active = true where id = good_place;
    res := res || '11a a member updates public_places: BAD (no error)' || E'\n';
  exception when insufficient_privilege then
    res := res || '11a a member cannot update public_places: good' || E'\n';
  end;
  begin
    insert into public.public_places (name, kind, area_id) values ('בית שלי', 'other', aid);
    res := res || '11b a member inserts a place: BAD (no error)' || E'\n';
  exception when insufficient_privilege then
    res := res || '11b a member cannot insert a place: good' || E'\n';
  end;
  begin
    insert into public.areas (name_he) values ('מקום בדוי');
    res := res || '11c a member inserts an area: BAD (no error)' || E'\n';
  exception when insufficient_privilege then
    res := res || '11c a member cannot insert an area: good' || E'\n';
  end;

  -- 12 place requests: own insert, limit of 5 a day, nobody reads another member's request, the admin reads all
  for i in 1..5 loop
    insert into public.place_requests (name, area_id) values ('בקשה ' || i, aid);
  end loop;
  begin
    insert into public.place_requests (name, area_id) values ('בקשה 6', aid);
    res := res || '12a the sixth request in a day: BAD (accepted)' || E'\n';
  exception when check_violation then
    res := res || '12a the sixth request in a day is refused: good' || E'\n';
  end;
  perform set_config('request.jwt.claims', json_build_object('sub', u2, 'role', 'authenticated')::text, true);
  select count(*) into n from public.place_requests;
  res := res || '12b another member sees none of them (expect 0): ' || n || ' ' || case when n = 0 then 'good' else 'BAD' end || E'\n';
  perform set_config('request.jwt.claims', json_build_object('sub', u3, 'role', 'authenticated')::text, true);
  select count(*) into n from public.place_requests;
  res := res || '12c the admin sees them (expect 5): ' || n || ' ' || case when n = 5 then 'good' else 'BAD' end || E'\n';

  -- 13 a member sets his own area; another member can read it (discovery), and cannot set somebody else's
  perform set_config('request.jwt.claims', json_build_object('sub', u1, 'role', 'authenticated')::text, true);
  update public.profiles set area_id = aid where id = u1;
  select count(*) into n from public.profiles where id = u1 and area_id = aid;
  res := res || '13a a member sets his own area (expect 1): ' || n || ' ' || case when n = 1 then 'good' else 'BAD' end || E'\n';
  update public.profiles set area_id = aid where id = u2;
  get diagnostics n = row_count;
  res := res || '13b a member cannot set another member''s area (expect 0 rows): ' || n || ' ' || case when n = 0 then 'good' else 'BAD' end || E'\n';

  reset role;
  raise exception E'RESULTS (rolled back):\n%', res;
end;
$test$;
