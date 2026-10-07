-- RLS test for posts, comments, likes, blocks and reports. Three throw-away users in a transaction;
-- ends with an exception so NOTHING is kept. Every line must say good/ok or match "expect".
do $$
declare
  a uuid := '00000000-0000-0000-0000-0000000000c1';
  b uuid := '00000000-0000-0000-0000-0000000000c2';
  c uuid := '00000000-0000-0000-0000-0000000000c3';
  pa uuid := gen_random_uuid();
  pb uuid := gen_random_uuid();
  cb uuid := gen_random_uuid();
  res text := '';
  n int;
begin
  insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at)
  select x, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', x::text || '@test.invalid', '{"display_name":"T"}'::jsonb, now(), now()
  from unnest(array[a, b, c]) as x;

  -- a posts
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.posts (id, activity, body) values (pa, 'כוח', 'post by a');
  res := res || '1 a creates a post: ok' || E'\n';
  begin
    insert into public.posts (user_id, activity, body) values (b, 'כוח', 'forged author');
    res := res || '2 a posts as b: ALLOWED (BAD)' || E'\n';
  exception when others then
    res := res || '2 a posts as b: blocked (good)' || E'\n';
  end;
  begin
    insert into public.posts (activity, body) values ('יוגה', 'bad activity');
    res := res || '3 a uses an unknown activity: ALLOWED (BAD)' || E'\n';
  exception when others then
    res := res || '3 a uses an unknown activity: blocked (good)' || E'\n';
  end;
  begin
    insert into public.posts (activity, body) values ('כוח', repeat('x', 501));
    res := res || '4 a posts 501 characters: ALLOWED (BAD)' || E'\n';
  exception when others then
    res := res || '4 a posts 501 characters: blocked (good)' || E'\n';
  end;
  begin
    insert into public.posts (activity, body, image_path) values ('כוח', 'x', b::text || '/pic.jpg');
    res := res || '5 a points to b''s image folder: ALLOWED (BAD)' || E'\n';
  exception when others then
    res := res || '5 a points to b''s image folder: blocked (good)' || E'\n';
  end;
  begin
    update public.posts set body = 'edited' where id = pa;
    res := res || '6 a edits a post: ALLOWED (BAD)' || E'\n';
  exception when others then
    res := res || '6 a edits a post: blocked (good)' || E'\n';
  end;

  -- b sees a's post, comments, likes
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.posts where id = pa;
  res := res || '7 b sees a''s post (expect 1): ' || n || E'\n';
  insert into public.posts (id, activity, body) values (pb, 'ריצה', 'post by b');
  insert into public.comments (id, post_id, body) values (cb, pa, 'comment by b');
  res := res || '8 b comments on a''s post: ok' || E'\n';
  insert into public.post_likes (post_id) values (pa);
  res := res || '9 b likes a''s post: ok' || E'\n';
  begin
    insert into public.post_likes (post_id) values (pa);
    res := res || '10 b likes twice: ALLOWED (BAD)' || E'\n';
  exception when others then
    res := res || '10 b likes twice: blocked (good)' || E'\n';
  end;
  begin
    insert into public.post_likes (post_id, user_id) values (pb, a);
    res := res || '11 b likes as a: ALLOWED (BAD)' || E'\n';
  exception when others then
    res := res || '11 b likes as a: blocked (good)' || E'\n';
  end;
  delete from public.posts where id = pa;
  get diagnostics n = row_count;
  res := res || '12 b deletes a''s post (expect 0 rows): ' || n || E'\n';

  -- a (post owner) can delete the comment on their post; the comment of b on a's post is visible to a
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.comments where id = cb;
  res := res || '13 a sees b''s comment (expect 1): ' || n || E'\n';
  select count(*) into n from public.post_likes where post_id = pa;
  res := res || '14 a sees the like (expect 1): ' || n || E'\n';

  -- anon: nothing
  reset role;
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  set local role anon;
  begin
    select count(*) into n from public.posts;
    res := res || '15 anon reads posts, rows (expect denied or 0): ' || n || E'\n';
  exception when others then
    res := res || '15 anon reads posts: denied (good)' || E'\n';
  end;

  -- a blocks b: neither sees the other's content
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.user_blocks (blocked_id) values (b);
  res := res || '16 a blocks b: ok' || E'\n';
  select count(*) into n from public.posts where id = pb;
  res := res || '17 a sees b''s post after blocking (expect 0): ' || n || E'\n';
  select count(*) into n from public.comments where id = cb;
  res := res || '18 a sees b''s comment after blocking (expect 0): ' || n || E'\n';
  begin
    insert into public.user_blocks (blocked_id) values (a);
    res := res || '19 a blocks self: ALLOWED (BAD)' || E'\n';
  exception when others then
    res := res || '19 a blocks self: blocked (good)' || E'\n';
  end;

  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.posts where id = pa;
  res := res || '20 b sees a''s post after being blocked (expect 0): ' || n || E'\n';
  select count(*) into n from public.user_blocks;
  res := res || '21 b sees block rows (expect 0): ' || n || E'\n';
  begin
    insert into public.comments (post_id, body) values (pa, 'sneaky');
    res := res || '22 b comments on a''s post after being blocked: ALLOWED (BAD)' || E'\n';
  exception when others then
    res := res || '22 b comments on a''s post after being blocked: blocked (good)' || E'\n';
  end;

  -- a unblocks; c reports b's post: gone for c only, then 3 reporters hide it for everybody
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  delete from public.user_blocks where blocked_id = b;
  select count(*) into n from public.posts where id = pb;
  res := res || '23 a sees b''s post after unblocking (expect 1): ' || n || E'\n';

  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', c, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.content_reports (post_id, reason) values (pb, 'spam');
  select count(*) into n from public.posts where id = pb;
  res := res || '24 c after reporting b''s post sees it (expect 0): ' || n || E'\n';
  begin
    insert into public.content_reports (post_id, reason) values (pb, 'spam');
    res := res || '25 c reports the same post twice: ALLOWED (BAD)' || E'\n';
  exception when others then
    res := res || '25 c reports the same post twice: blocked (good)' || E'\n';
  end;
  begin
    insert into public.content_reports (post_id, comment_id, reason) values (pb, cb, 'spam');
    res := res || '26 c reports a post and a comment in one row: ALLOWED (BAD)' || E'\n';
  exception when others then
    res := res || '26 c reports a post and a comment in one row: blocked (good)' || E'\n';
  end;
  select count(*) into n from public.content_reports;
  res := res || '27 c sees own reports only (expect 1): ' || n || E'\n';

  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.content_reports;
  res := res || '28 a sees c''s report (expect 0): ' || n || E'\n';
  insert into public.content_reports (post_id, reason) values (pb, 'abuse');
  select count(*) into n from public.posts where id = pb;
  res := res || '29 a after reporting b''s post sees it (expect 0): ' || n || E'\n';

  reset role;
  -- a third report from a throw-away fourth reporter written as the table owner, to reach the auto-hide limit
  insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at)
  values ('00000000-0000-0000-0000-0000000000c4', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'c4@test.invalid', '{"display_name":"T"}'::jsonb, now(), now());
  insert into public.content_reports (reporter_id, post_id, reason) values ('00000000-0000-0000-0000-0000000000c4', pb, 'spam');
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.posts where id = pb;
  res := res || '30 b still sees own post after 3 reports (expect 1): ' || n || E'\n';
  reset role;

  -- the auto-hide: a fresh member who reported nothing no longer sees the post
  insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at)
  values ('00000000-0000-0000-0000-0000000000c5', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'c5@test.invalid', '{"display_name":"T"}'::jsonb, now(), now());
  perform set_config('request.jwt.claims', json_build_object('sub', '00000000-0000-0000-0000-0000000000c5', 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.posts where id = pb;
  res := res || '31 a bystander sees a post reported by 3 (expect 0): ' || n || E'\n';
  reset role;

  -- owner deletes own post; cascades remove comments/likes
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  delete from public.posts where id = pa;
  get diagnostics n = row_count;
  res := res || '32 a deletes own post (expect 1 row): ' || n || E'\n';
  reset role;
  select count(*) into n from public.comments where post_id = pa;
  res := res || '33 comments of the deleted post are gone (expect 0): ' || n || E'\n';

  -- rate limit: 10 posts per hour
  perform set_config('request.jwt.claims', json_build_object('sub', c, 'role', 'authenticated')::text, true);
  set local role authenticated;
  begin
    for i in 1..11 loop
      insert into public.posts (activity, body) values ('כוח', 'spam ' || i);
    end loop;
    res := res || '34 c posts 11 times in an hour: ALLOWED (BAD)' || E'\n';
  exception when others then
    res := res || '34 c posts 11 times in an hour: blocked (good)' || E'\n';
  end;
  reset role;

  -- image paths: exactly <own uid>/<file>.jpg|png|webp
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  set local role authenticated;
  begin
    insert into public.posts (activity, body, image_path) values ('כוח', 'x', b::text || '/../' || a::text || '/x.jpg');
    res := res || '35 b uses a ../ image path: ALLOWED (BAD)' || E'\n';
  exception when others then
    res := res || '35 b uses a ../ image path: blocked (good)' || E'\n';
  end;
  begin
    insert into public.posts (activity, body, image_path) values ('כוח', 'x', b::text || '/sub/x.jpg');
    res := res || '36 b uses a sub-folder image path: ALLOWED (BAD)' || E'\n';
  exception when others then
    res := res || '36 b uses a sub-folder image path: blocked (good)' || E'\n';
  end;
  begin
    insert into public.posts (activity, body, image_path) values ('כוח', 'x', b::text || '/1700000000-ab12cd.jpg');
    res := res || '37 b uses a normal image path: ok' || E'\n';
  exception when others then
    res := res || '37 b uses a normal image path: blocked (BAD)' || E'\n';
  end;
  reset role;

  raise exception E'RLS_COMMUNITY_TEST_RESULTS\n%', res;
end $$;
