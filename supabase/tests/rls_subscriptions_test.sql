-- Test for migration 20261115_subscriptions_foundation.sql (subscriptions table + weekly cap of new invitations).
-- HOW TO RUN (nothing is kept): paste the migration SQL first and THIS file right after it into ONE statement batch
-- (one execute_sql call). The batch ends with an exception, so the migration and the test data are rolled back together.
-- After the migration is applied for real, run this file alone (the same way, ending in the exception).
-- Every line of the result must say good.
do $test$
declare
  a uuid := '00000000-0000-0000-0000-0000000000f1'; -- free member, has no subscription row
  b uuid := '00000000-0000-0000-0000-0000000000f2'; -- Plus (valid)
  c uuid := '00000000-0000-0000-0000-0000000000f3'; -- Pro (valid)
  d uuid := '00000000-0000-0000-0000-0000000000f4'; -- Plus that EXPIRED yesterday (= free)
  e uuid := '00000000-0000-0000-0000-0000000000f5'; -- free member, used while the switch is OFF
  r uuid := '00000000-0000-0000-0000-0000000000f9'; -- recipient of all invitations (largest id: pairs are stored smaller id first)
  conv_a uuid; conv_b uuid; conv_c uuid; conv_d uuid; conv_e uuid;
  res text := '';
  n int;
  i int;
  ok boolean;
  sp text;
  t text;
  inv jsonb := jsonb_build_object('activity', 'Running', 'location', 'Park', 'scheduledAt', (now() + interval '2 days')::text, 'status', 'pending');
begin
  insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at)
  select x, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', x::text || '@test.invalid', '{"display_name":"T"}'::jsonb, now(), now()
  from unnest(array[a, b, c, d, e, r]) as x;
  update public.profiles set gender = 'M', fitness_level = 'Beginner', favorite_activities = array['Running'] where id in (a, b, c, d, e, r);

  insert into public.conversations (user_a, user_b) values (a, r) returning id into conv_a;
  insert into public.conversations (user_a, user_b) values (b, r) returning id into conv_b;
  insert into public.conversations (user_a, user_b) values (c, r) returning id into conv_c;
  insert into public.conversations (user_a, user_b) values (d, r) returning id into conv_d;
  insert into public.conversations (user_a, user_b) values (e, r) returning id into conv_e;

  insert into public.subscriptions (user_id, tier, product_id, status, expires_at) values
    (b, 'plus', 'com.arielk29.fitfriend.plus.monthly', 'active', now() + interval '30 days'),
    (c, 'pro', 'com.arielk29.fitfriend.pro.yearly', 'trial', now() + interval '7 days'),
    (d, 'plus', 'com.arielk29.fitfriend.plus.monthly', 'cancelled', now() - interval '1 day');

  -- 1 tiers as the server sees them
  res := res || '1a tier_of free member (expect free): ' || private.tier_of(a) || ' ' || case when private.tier_of(a) = 'free' then 'good' else 'BAD' end || E'\n';
  res := res || '1b tier_of Plus (expect plus): ' || private.tier_of(b) || ' ' || case when private.tier_of(b) = 'plus' then 'good' else 'BAD' end || E'\n';
  res := res || '1c tier_of Pro in trial (expect pro): ' || private.tier_of(c) || ' ' || case when private.tier_of(c) = 'pro' then 'good' else 'BAD' end || E'\n';
  res := res || '1d tier_of expired Plus (expect free): ' || private.tier_of(d) || ' ' || case when private.tier_of(d) = 'free' then 'good' else 'BAD' end || E'\n';
  res := res || '1e limits 5/40/70 (expect 5,40,70): ' || private.invite_limit('free') || ',' || private.invite_limit('plus') || ',' || private.invite_limit('pro') || ' '
    || case when private.invite_limit('free') = 5 and private.invite_limit('plus') = 40 and private.invite_limit('pro') = 70 then 'good' else 'BAD' end || E'\n';

  -- 2 the switch is OFF after the migration: nothing changes for today's testers
  select enabled into ok from public.app_flags where key = 'invite_cap_enabled';
  res := res || '2a the switch starts OFF (expect off): ' || case when ok = false then 'good' else 'BAD' end || E'\n';
  perform set_config('request.jwt.claims', json_build_object('sub', e, 'role', 'authenticated')::text, true);
  set local role authenticated;
  ok := true;
  begin
    for i in 1..6 loop
      insert into public.messages (conversation_id, kind, invite) values (conv_e, 'invite', inv);
    end loop;
  exception when others then ok := false; sp := sqlerrm;
  end;
  res := res || '2b switch off: a free member sends 6 invitations (expect allowed): ' || case when ok then 'good' else 'BAD ' || coalesce(sp, '') end || E'\n';
  reset role;

  -- switch ON for the rest of the test
  update public.app_flags set enabled = true where key = 'invite_cap_enabled';

  -- 3 free member: exactly 5 allowed, the 6th is refused
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  ok := true;
  begin
    for i in 1..5 loop
      insert into public.messages (conversation_id, kind, invite) values (conv_a, 'invite', inv);
    end loop;
  exception when others then ok := false; sp := sqlerrm;
  end;
  res := res || '3a free member sends 5 invitations (expect allowed): ' || case when ok then 'good' else 'BAD ' || coalesce(sp, '') end || E'\n';
  ok := true; sp := null;
  begin
    insert into public.messages (conversation_id, kind, invite) values (conv_a, 'invite', inv);
  exception when others then ok := false; sp := sqlerrm;
  end;
  res := res || '3b the 6th invitation is refused (expect "invite limit reached"): ' || coalesce(sp, 'allowed') || ' ' || case when not ok and sp like '%invite limit reached%' then 'good' else 'BAD' end || E'\n';
  ok := true; sp := null;
  begin
    insert into public.messages (conversation_id, kind, body) values (conv_a, 'text', 'hello');
  exception when others then ok := false; sp := sqlerrm;
  end;
  res := res || '3c a plain chat message is NOT counted (expect allowed): ' || case when ok then 'good' else 'BAD ' || coalesce(sp, '') end || E'\n';
  reset role;

  -- 4 expired Plus behaves as free; a switched-off member (e, 6 invitations already) is refused once the switch is on
  perform set_config('request.jwt.claims', json_build_object('sub', d, 'role', 'authenticated')::text, true);
  set local role authenticated;
  ok := true;
  begin
    for i in 1..5 loop
      insert into public.messages (conversation_id, kind, invite) values (conv_d, 'invite', inv);
    end loop;
  exception when others then ok := false; sp := sqlerrm;
  end;
  res := res || '4a expired Plus sends 5 invitations (expect allowed): ' || case when ok then 'good' else 'BAD ' || coalesce(sp, '') end || E'\n';
  ok := true; sp := null;
  begin
    insert into public.messages (conversation_id, kind, invite) values (conv_d, 'invite', inv);
  exception when others then ok := false; sp := sqlerrm;
  end;
  res := res || '4b expired Plus 6th invitation is refused (expect refused): ' || case when not ok and sp like '%invite limit reached%' then 'good' else 'BAD' end || E'\n';
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', e, 'role', 'authenticated')::text, true);
  set local role authenticated;
  ok := true; sp := null;
  begin
    insert into public.messages (conversation_id, kind, invite) values (conv_e, 'invite', inv);
  exception when others then ok := false; sp := sqlerrm;
  end;
  res := res || '4c a member who already sent 6 while OFF is refused once ON (expect refused): ' || case when not ok and sp like '%invite limit reached%' then 'good' else 'BAD' end || E'\n';
  reset role;

  -- 5 Plus and Pro are not limited at 5
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  set local role authenticated;
  ok := true;
  begin
    for i in 1..8 loop
      insert into public.messages (conversation_id, kind, invite) values (conv_b, 'invite', inv);
    end loop;
  exception when others then ok := false; sp := sqlerrm;
  end;
  res := res || '5a Plus sends 8 invitations (expect allowed): ' || case when ok then 'good' else 'BAD ' || coalesce(sp, '') end || E'\n';
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', c, 'role', 'authenticated')::text, true);
  set local role authenticated;
  ok := true;
  begin
    for i in 1..8 loop
      insert into public.messages (conversation_id, kind, invite) values (conv_c, 'invite', inv);
    end loop;
  exception when others then ok := false; sp := sqlerrm;
  end;
  res := res || '5b Pro sends 8 invitations (expect allowed): ' || case when ok then 'good' else 'BAD ' || coalesce(sp, '') end || E'\n';
  reset role;

  -- 6 the window is rolling 7 days: when a's invitations are 8 days old, a can invite again
  alter table public.messages disable trigger messages_guard_invite_update;
  update public.messages set created_at = now() - interval '8 days' where sender_id = a and kind = 'invite';
  alter table public.messages enable trigger messages_guard_invite_update;
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  ok := true; sp := null;
  begin
    insert into public.messages (conversation_id, kind, invite) values (conv_a, 'invite', inv);
  exception when others then ok := false; sp := sqlerrm;
  end;
  res := res || '6a invitations older than 7 days do not count (expect allowed): ' || case when ok then 'good' else 'BAD ' || coalesce(sp, '') end || E'\n';
  reset role;

  -- 7 a member can read only their own subscription and can never write one
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.subscriptions;
  res := res || '7a Plus member sees only their own row (expect 1): ' || n || ' ' || case when n = 1 then 'good' else 'BAD' end || E'\n';
  ok := true; sp := null;
  begin
    update public.subscriptions set tier = 'pro', expires_at = now() + interval '3650 days' where user_id = b;
  exception when others then ok := false; sp := sqlerrm;
  end;
  res := res || '7b a member cannot upgrade their own row (expect permission denied): ' || coalesce(sp, 'allowed') || ' ' || case when not ok then 'good' else 'BAD' end || E'\n';
  ok := true; sp := null;
  begin
    delete from public.subscriptions where user_id = b;
  exception when others then ok := false; sp := sqlerrm;
  end;
  res := res || '7c a member cannot delete their row (expect permission denied): ' || coalesce(sp, 'allowed') || ' ' || case when not ok then 'good' else 'BAD' end || E'\n';
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  ok := true; sp := null;
  begin
    insert into public.subscriptions (user_id, tier, product_id, expires_at) values (a, 'pro', 'x', now() + interval '3650 days');
  exception when others then ok := false; sp := sqlerrm;
  end;
  res := res || '7d a free member cannot give themselves Pro (expect permission denied): ' || coalesce(sp, 'allowed') || ' ' || case when not ok then 'good' else 'BAD' end || E'\n';
  select count(*) into n from public.subscriptions;
  res := res || '7e a free member sees no subscription rows (expect 0): ' || n || ' ' || case when n = 0 then 'good' else 'BAD' end || E'\n';
  ok := true; sp := null;
  begin
    perform private.tier_of(b);
  exception when others then ok := false; sp := sqlerrm;
  end;
  res := res || '7f a member cannot ask the tier of somebody else (expect permission denied): ' || coalesce(sp, 'allowed') || ' ' || case when not ok then 'good' else 'BAD' end || E'\n';
  reset role;

  -- 8 signed-out visitors see nothing
  set local role anon;
  ok := true; sp := null;
  begin
    perform 1 from public.subscriptions;
  exception when others then ok := false; sp := sqlerrm;
  end;
  res := res || '8a anon cannot read subscriptions (expect permission denied): ' || coalesce(sp, 'allowed') || ' ' || case when not ok then 'good' else 'BAD' end || E'\n';
  reset role;

  -- 9 deleting the account removes the subscription row
  delete from auth.users where id = b;
  select count(*) into n from public.subscriptions where user_id = b;
  res := res || '9a deleting the account removes the row (expect 0): ' || n || ' ' || case when n = 0 then 'good' else 'BAD' end || E'\n';

  -- 10 the table is locked down by constraints
  ok := true; sp := null;
  begin
    insert into public.subscriptions (user_id, tier, product_id, expires_at) values (a, 'gold', 'x', now() + interval '1 day');
  exception when others then ok := false; sp := sqlerrm;
  end;
  res := res || '10a an unknown tier is refused (expect refused): ' || case when not ok then 'good' else 'BAD' end || E'\n';

  -- 11 the webhook function writes in order of event time (service role only)
  set local role authenticated;
  ok := true; sp := null;
  begin
    perform public.apply_subscription_event(a, 'pro', 'x', 'active', now() + interval '30 days', 1000);
  exception when others then ok := false; sp := sqlerrm;
  end;
  res := res || '11a a member cannot call the write function (expect permission denied): ' || coalesce(sp, 'allowed') || ' ' || case when not ok then 'good' else 'BAD' end || E'\n';
  reset role;
  set local role service_role;
  select public.apply_subscription_event(a, 'plus', 'com.arielk29.fitfriend.plus.monthly', 'active', now() + interval '30 days', 2000) into ok;
  res := res || '11b service role writes a new row (expect true): ' || ok || ' ' || case when ok then 'good' else 'BAD' end || E'\n';
  select public.apply_subscription_event(a, 'plus', 'com.arielk29.fitfriend.plus.monthly', 'cancelled', now() - interval '1 day', 1500) into ok;
  res := res || '11c an older event is ignored (expect false): ' || ok || ' ' || case when not ok then 'good' else 'BAD' end || E'\n';
  reset role;
  res := res || '11d the row still has the newer data (expect plus): ' || private.tier_of(a) || ' ' || case when private.tier_of(a) = 'plus' then 'good' else 'BAD' end || E'\n';
  set local role service_role;
  select public.apply_subscription_event(a, 'plus', 'com.arielk29.fitfriend.plus.monthly', 'cancelled', now() - interval '1 minute', 3000) into ok;
  reset role;
  res := res || '11e a newer expiry event applies (expect true and tier free): ' || ok || ',' || private.tier_of(a) || ' ' || case when ok and private.tier_of(a) = 'free' then 'good' else 'BAD' end || E'\n';
  ok := true; sp := null;
  begin
    set local role service_role;
    perform public.apply_subscription_event('00000000-0000-0000-0000-00000000dead', 'plus', 'x', 'active', now() + interval '1 day', 1);
  exception when others then ok := false; sp := sqlerrm;
  end;
  reset role;
  res := res || '11f an unknown user is refused by the foreign key (expect an error): ' || coalesce(sp, 'allowed') || ' ' || case when not ok then 'good' else 'BAD' end || E'\n';

  raise exception E'RESULTS (rolled back):\n%', res;
end;
$test$;
