-- Test for the server content filter (migration 20261018_server_content_filter.sql, once applied).
-- Throw-away users in one transaction; ends with an exception so NOTHING is kept.
-- Every line must say good / true.
do $$
declare
  a uuid := '00000000-0000-0000-0000-0000000000f1';
  b uuid := '00000000-0000-0000-0000-0000000000f2';
  conv uuid := gen_random_uuid();
  pid uuid := gen_random_uuid();
  res text := '';
  v boolean;
  w text;
begin
  -- 1. the matching rules, as the owner role
  foreach w in array array['you are a whore', 'WHORE', 'w.h.o.r.e', 'w h o r e', 'whooore', 'בן זונה', 'אתה בן זונה!', 'הזונה', 'והזונה', 'שרמוטההה',
                           'ש-ר-מ-ו-ט-ה', 'שָׁרְמוּטָה', 'מפגרימ', 'kill yourself', 'KYS', 'send nudes', 'לך תמות', 'ש' || chr(8203) || 'רמוטה'] loop
    v := private.contains_blocked_term(w);
    res := res || '1 blocked (expect true) ' || w || ': ' || coalesce(v::text, 'null') || E'\n';
  end loop;
  foreach w in array array['מפגש', 'הומו', 'Scunthorpe', 'cuntry side', 'assess', 'shitake mushrooms', 'כושר', 'כושרים',
                           'בוא נקבע לריצה מחר בשש', 'מתאים לי', 'great workout today', '', '   '] loop
    v := private.contains_blocked_term(w);
    res := res || '2 allowed (expect false) ' || w || ': ' || coalesce(v::text, 'null') || E'\n';
  end loop;
  res := res || '2 null text (expect false): ' || private.contains_blocked_term(null)::text || E'\n';

  insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at)
  select x, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', x::text || '@test.invalid', '{"display_name":"T"}'::jsonb, now(), now()
  from unnest(array[a, b]) as x;

  -- 3. the triggers, as a signed-in member
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;

  insert into public.conversations (id, user_a, user_b) values (conv, a, b);

  begin
    insert into public.messages (conversation_id, kind, body) values (conv, 'text', 'you whore');
    res := res || '3 blocked chat message: ALLOWED (BAD)' || E'\n';
  exception when others then
    res := res || '3 blocked chat message: ' || case when sqlerrm = 'content_not_allowed' then 'blocked (good)' else 'WRONG ERROR ' || sqlerrm end || E'\n';
  end;
  begin
    insert into public.messages (conversation_id, kind, body) values (conv, 'text', 'מתאים לי, נתראה בשש');
    res := res || '4 clean chat message: allowed (good)' || E'\n';
  exception when others then
    res := res || '4 clean chat message: BLOCKED (BAD) ' || sqlerrm || E'\n';
  end;
  begin
    insert into public.messages (conversation_id, kind, invite) values (conv, 'invite',
      jsonb_build_object('activity', 'כוח', 'location', 'פארק', 'scheduledAt', (now() + interval '1 hour')::text, 'status', 'pending'));
    res := res || '5 invitation (no body): allowed (good)' || E'\n';
  exception when others then
    res := res || '5 invitation (no body): BLOCKED (BAD) ' || sqlerrm || E'\n';
  end;
  begin
    insert into public.posts (id, activity, body) values (pid, 'כוח', 'שרמוטה');
    res := res || '6 blocked post: ALLOWED (BAD)' || E'\n';
  exception when others then
    res := res || '6 blocked post: ' || case when sqlerrm = 'content_not_allowed' then 'blocked (good)' else 'WRONG ERROR ' || sqlerrm end || E'\n';
  end;
  begin
    insert into public.posts (id, activity, body) values (pid, 'כוח', 'אימון כוח מעולה היום');
    res := res || '7 clean post: allowed (good)' || E'\n';
  exception when others then
    res := res || '7 clean post: BLOCKED (BAD) ' || sqlerrm || E'\n';
  end;
  begin
    insert into public.comments (post_id, body) values (pid, 'cunt');
    res := res || '8 blocked comment: ALLOWED (BAD)' || E'\n';
  exception when others then
    res := res || '8 blocked comment: ' || case when sqlerrm = 'content_not_allowed' then 'blocked (good)' else 'WRONG ERROR ' || sqlerrm end || E'\n';
  end;
  begin
    insert into public.groups (name, activity) values ('whore club', 'כוח');
    res := res || '9 blocked group name: ALLOWED (BAD)' || E'\n';
  exception when others then
    res := res || '9 blocked group name: ' || case when sqlerrm = 'content_not_allowed' then 'blocked (good)' else 'WRONG ERROR ' || sqlerrm end || E'\n';
  end;
  begin
    update public.profiles set bio = 'I am a retard' where id = a;
    res := res || '10 blocked profile bio: ALLOWED (BAD)' || E'\n';
  exception when others then
    res := res || '10 blocked profile bio: ' || case when sqlerrm = 'content_not_allowed' then 'blocked (good)' else 'WRONG ERROR ' || sqlerrm end || E'\n';
  end;
  begin
    update public.profiles set bio = 'אוהב ריצות בוקר' where id = a;
    res := res || '11 clean profile bio: allowed (good)' || E'\n';
  exception when others then
    res := res || '11 clean profile bio: BLOCKED (BAD) ' || sqlerrm || E'\n';
  end;

  -- 4. members cannot call the functions or read the list
  begin
    perform private.contains_blocked_term('x');
    res := res || '12 member calls the function: ALLOWED (BAD)' || E'\n';
  exception when others then
    res := res || '12 member calls the function: blocked (good)' || E'\n';
  end;
  begin
    perform 1 from private.blocked_terms limit 1;
    res := res || '13 member reads the word list: ALLOWED (BAD)' || E'\n';
  exception when others then
    res := res || '13 member reads the word list: blocked (good)' || E'\n';
  end;
  reset role;

  raise exception E'RESULTS (rolled back):\n%', res;
end;
$$;
