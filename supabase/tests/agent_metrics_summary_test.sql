-- Test for private.agent_metrics_summary(): counts change by the right amounts, and members cannot call it.
-- Two throw-away users in a transaction; ends with an exception so NOTHING is kept.
do $$
declare
  a uuid := '00000000-0000-0000-0000-0000000000a1';
  b uuid := '00000000-0000-0000-0000-0000000000a2';
  conv uuid := gen_random_uuid();
  m1 uuid := gen_random_uuid(); -- accepted, both check in
  m2 uuid := gen_random_uuid(); -- declined
  m3 uuid := gen_random_uuid(); -- still pending
  before_ jsonb;
  after_ jsonb;
  res text := '';
begin
  before_ := private.agent_metrics_summary();

  insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at)
  select x, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', x::text || '@test.invalid', '{"display_name":"T"}'::jsonb, now(), now()
  from unnest(array[a, b]) as x;

  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.conversations (id, user_a, user_b) values (conv, a, b);
  insert into public.messages (id, conversation_id, kind, invite) values
    (m1, conv, 'invite', jsonb_build_object('activity', 'כוח', 'location', 'פארק', 'scheduledAt', (now() + interval '1 hour')::text, 'status', 'pending')),
    (m2, conv, 'invite', jsonb_build_object('activity', 'ריצה', 'location', 'טיילת', 'scheduledAt', (now() + interval '1 hour')::text, 'status', 'pending')),
    (m3, conv, 'invite', jsonb_build_object('activity', 'שחייה', 'location', 'בריכה', 'scheduledAt', (now() + interval '1 hour')::text, 'status', 'pending'));

  -- a member cannot call the function
  begin
    perform private.agent_metrics_summary();
    res := res || '1 member calls the function: ALLOWED (BAD)' || E'\n';
  exception when others then
    res := res || '1 member calls the function: blocked (good)' || E'\n';
  end;

  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  set local role authenticated;
  update public.messages set invite = jsonb_set(invite, '{status}', '"accepted"') where id = m1;
  update public.messages set invite = jsonb_set(invite, '{status}', '"declined"') where id = m2;
  update public.workouts set guest_checked_in_at = now() where id = m1;
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  update public.workouts set host_checked_in_at = now() where id = m1;
  reset role;

  after_ := private.agent_metrics_summary();
  res := res || '2 invitations sent +3 (expect true): '
    || ((after_ #>> '{invites_sent,total}')::int - (before_ #>> '{invites_sent,total}')::int = 3)::text || E'\n';
  res := res || '3 accepted +1 (expect true): '
    || ((after_ #>> '{invites_accepted,total}')::int - (before_ #>> '{invites_accepted,total}')::int = 1)::text || E'\n';
  res := res || '4 declined +1 (expect true): '
    || ((after_ #>> '{invites_declined,total}')::int - (before_ #>> '{invites_declined,total}')::int = 1)::text || E'\n';
  res := res || '5 both checked in +1 (expect true): '
    || ((after_ #>> '{workouts_both_checked_in,total}')::int - (before_ #>> '{workouts_both_checked_in,total}')::int = 1)::text || E'\n';
  res := res || '6 last 24h both checked in +1 (expect true): '
    || ((after_ #>> '{workouts_both_checked_in,last_24h}')::int - (before_ #>> '{workouts_both_checked_in,last_24h}')::int = 1)::text || E'\n';
  res := res || '7 result has no ids or text, only keys with numbers (expect true): '
    || (after_::text !~ '[0-9a-f]{8}-[0-9a-f]{4}-')::text || E'\n';

  raise exception E'RESULTS (rolled back):\n%', res;
end;
$$;
