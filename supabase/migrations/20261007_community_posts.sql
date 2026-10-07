-- Applied to the `duofit` Supabase project on 2026-10-07 (community_posts).
-- Community on the server (issue #65, stage 5a): posts, comments, likes, blocking, reporting and the
-- `post-images` storage bucket. Signed-in members read; everybody writes and deletes only their own rows.
--
-- Safety design:
--  * a member can block another member: neither sees the other's posts, comments or likes any more;
--  * a member can report a post or comment: it disappears for the reporter at once and for everybody
--    once 3 different members reported it (the author still sees their own content);
--  * counts come from rows the viewer is allowed to read (blocked members' likes are not counted);
--  * anti-spam limits per hour/day, size and format limits on every text.

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

-- ---------------------------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------------------------
create table public.user_blocks (
  blocker_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);
create index user_blocks_blocked_idx on public.user_blocks (blocked_id);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  activity text not null check (activity in ('כוח', 'ריצה', 'קליסטניקס', 'כדורסל')),
  body text not null check (char_length(btrim(body)) between 1 and 500),
  image_path text check (image_path is null or (image_path like user_id::text || '/%' and char_length(image_path) <= 200)),
  created_at timestamptz not null default now()
);
create index posts_created_idx on public.posts (created_at desc);
create index posts_user_idx on public.posts (user_id, created_at desc);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 300),
  created_at timestamptz not null default now()
);
create index comments_post_idx on public.comments (post_id, created_at);
create index comments_user_idx on public.comments (user_id, created_at desc);

create table public.post_likes (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
create index post_likes_user_idx on public.post_likes (user_id, created_at desc);

create table public.content_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  post_id uuid references public.posts (id) on delete cascade,
  comment_id uuid references public.comments (id) on delete cascade,
  reason text not null check (reason in ('spam', 'abuse', 'inappropriate', 'other')),
  created_at timestamptz not null default now(),
  check ((post_id is not null)::int + (comment_id is not null)::int = 1),
  unique (reporter_id, post_id),
  unique (reporter_id, comment_id)
);
create index content_reports_post_idx on public.content_reports (post_id) where post_id is not null;
create index content_reports_comment_idx on public.content_reports (comment_id) where comment_id is not null;
create index content_reports_reporter_idx on public.content_reports (reporter_id, created_at desc);

alter table public.user_blocks enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.post_likes enable row level security;
alter table public.content_reports enable row level security;

-- ---------------------------------------------------------------------------------------------
-- Helper functions (private schema, not reachable through the API). They are SECURITY DEFINER only
-- because a member must not read other members' block/report rows directly, yet policies need the answer.
-- ---------------------------------------------------------------------------------------------
-- True when the signed-in member blocked `other` or `other` blocked the signed-in member.
create function private.blocked_between(other uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.user_blocks b
    where (b.blocker_id = (select auth.uid()) and b.blocked_id = other)
       or (b.blocker_id = other and b.blocked_id = (select auth.uid()))
  );
$$;
revoke execute on function private.blocked_between(uuid) from public, anon;
grant execute on function private.blocked_between(uuid) to authenticated;

-- Number of different members who reported a post / comment (auto-hide at 3).
create function private.post_report_count(pid uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::int from public.content_reports r where r.post_id = pid;
$$;
revoke execute on function private.post_report_count(uuid) from public, anon;
grant execute on function private.post_report_count(uuid) to authenticated;

create function private.comment_report_count(cid uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::int from public.content_reports r where r.comment_id = cid;
$$;
revoke execute on function private.comment_report_count(uuid) from public, anon;
grant execute on function private.comment_report_count(uuid) to authenticated;

-- ---------------------------------------------------------------------------------------------
-- Privileges: no anon; signed-in members get only the columns/commands the app needs.
-- ---------------------------------------------------------------------------------------------
revoke all on public.user_blocks, public.posts, public.comments, public.post_likes, public.content_reports from anon;
revoke all on public.user_blocks, public.posts, public.comments, public.post_likes, public.content_reports from authenticated;

grant select, delete on public.user_blocks to authenticated;
grant insert (blocked_id) on public.user_blocks to authenticated;

grant select, delete on public.posts to authenticated;
grant insert (id, activity, body, image_path) on public.posts to authenticated;

grant select, delete on public.comments to authenticated;
grant insert (id, post_id, body) on public.comments to authenticated;

grant select, delete on public.post_likes to authenticated;
grant insert (post_id) on public.post_likes to authenticated;

grant select on public.content_reports to authenticated;
grant insert (post_id, comment_id, reason) on public.content_reports to authenticated;

-- ---------------------------------------------------------------------------------------------
-- Policies
-- ---------------------------------------------------------------------------------------------
create policy user_blocks_select_own on public.user_blocks
  for select to authenticated using (blocker_id = (select auth.uid()));
create policy user_blocks_insert_own on public.user_blocks
  for insert to authenticated with check (blocker_id = (select auth.uid()));
create policy user_blocks_delete_own on public.user_blocks
  for delete to authenticated using (blocker_id = (select auth.uid()));

create policy content_reports_select_own on public.content_reports
  for select to authenticated using (reporter_id = (select auth.uid()));
create policy content_reports_insert_own on public.content_reports
  for insert to authenticated with check (reporter_id = (select auth.uid()));

-- Posts: own posts always; other members' posts unless blocked (either way), reported by me or reported by 3+.
create policy posts_select_visible on public.posts
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or (
      not private.blocked_between(user_id)
      and private.post_report_count(id) < 3
      and not exists (
        select 1 from public.content_reports r where r.post_id = posts.id and r.reporter_id = (select auth.uid())
      )
    )
  );
create policy posts_insert_own on public.posts
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy posts_delete_own on public.posts
  for delete to authenticated using (user_id = (select auth.uid()));

-- Comments: only on posts I can see (the posts policy applies inside the exists), same hiding rules.
create policy comments_select_visible on public.comments
  for select to authenticated
  using (
    exists (select 1 from public.posts p where p.id = comments.post_id)
    and (
      user_id = (select auth.uid())
      or (
        not private.blocked_between(user_id)
        and private.comment_report_count(id) < 3
        and not exists (
          select 1 from public.content_reports r where r.comment_id = comments.id and r.reporter_id = (select auth.uid())
        )
      )
    )
  );
create policy comments_insert_own on public.comments
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.posts p where p.id = comments.post_id)
  );
-- A comment can be removed by its writer or by the owner of the post it sits under.
create policy comments_delete_own_or_post_owner on public.comments
  for delete to authenticated
  using (
    user_id = (select auth.uid())
    or exists (select 1 from public.posts p where p.id = comments.post_id and p.user_id = (select auth.uid()))
  );

create policy post_likes_select_visible on public.post_likes
  for select to authenticated
  using (
    exists (select 1 from public.posts p where p.id = post_likes.post_id)
    and (user_id = (select auth.uid()) or not private.blocked_between(user_id))
  );
create policy post_likes_insert_own on public.post_likes
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.posts p where p.id = post_likes.post_id)
  );
create policy post_likes_delete_own on public.post_likes
  for delete to authenticated using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------------------------
-- Anti-spam limits (BEFORE INSERT triggers, SECURITY INVOKER, not callable by anyone)
-- ---------------------------------------------------------------------------------------------
create function public.community_limits()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if tg_table_name = 'posts' then
    if (select count(*) from public.posts x where x.user_id = new.user_id and x.created_at > now() - interval '1 hour') >= 10 then
      raise exception 'too many posts, try again later';
    end if;
    if (select count(*) from public.posts x where x.user_id = new.user_id) >= 500 then
      raise exception 'post limit reached';
    end if;
  elsif tg_table_name = 'comments' then
    if (select count(*) from public.comments x where x.user_id = new.user_id and x.created_at > now() - interval '1 hour') >= 30 then
      raise exception 'too many comments, try again later';
    end if;
  elsif tg_table_name = 'post_likes' then
    if (select count(*) from public.post_likes x where x.user_id = new.user_id and x.created_at > now() - interval '1 hour') >= 200 then
      raise exception 'too many likes, try again later';
    end if;
  elsif tg_table_name = 'content_reports' then
    if (select count(*) from public.content_reports x where x.reporter_id = new.reporter_id and x.created_at > now() - interval '1 day') >= 20 then
      raise exception 'too many reports today';
    end if;
  elsif tg_table_name = 'user_blocks' then
    if (select count(*) from public.user_blocks x where x.blocker_id = new.blocker_id) >= 200 then
      raise exception 'block limit reached';
    end if;
  end if;
  return new;
end;
$$;
revoke execute on function public.community_limits() from public, anon, authenticated;

create trigger posts_limits before insert on public.posts
  for each row execute function public.community_limits();
create trigger comments_limits before insert on public.comments
  for each row execute function public.community_limits();
create trigger post_likes_limits before insert on public.post_likes
  for each row execute function public.community_limits();
create trigger content_reports_limits before insert on public.content_reports
  for each row execute function public.community_limits();
create trigger user_blocks_limits before insert on public.user_blocks
  for each row execute function public.community_limits();

-- ---------------------------------------------------------------------------------------------
-- Storage bucket for post pictures: images only, 5 MB, upload/delete only inside the member's own folder.
-- ---------------------------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('post-images', 'post-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy post_images_owner_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'post-images' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy post_images_owner_select on storage.objects
  for select to authenticated
  using (bucket_id = 'post-images' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy post_images_owner_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'post-images' and (storage.foldername(name))[1] = (select auth.uid())::text);
