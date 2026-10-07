-- Applied to the `duofit` Supabase project on 2026-10-07 (community_hardening).
-- Findings of the code review of the community tables:
--  * image_path must be exactly `<own uid>/<file>.jpg|png|webp` (no `..`, no sub-folders);
--  * storage uploads are limited to one folder level (so account deletion can always find every file);
--  * the anti-spam triggers take a per-member advisory lock, so parallel requests cannot all pass the count.

alter table public.posts drop constraint posts_check;
alter table public.posts
  add constraint posts_image_path_check
  check (image_path is null or image_path ~ ('^' || user_id::text || '/[A-Za-z0-9._-]+\.(jpg|png|webp)$'));

drop policy post_images_owner_insert on storage.objects;
drop policy post_images_owner_select on storage.objects;
drop policy post_images_owner_delete on storage.objects;
create policy post_images_owner_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'post-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and array_length(storage.foldername(name), 1) = 1
  );
create policy post_images_owner_select on storage.objects
  for select to authenticated
  using (bucket_id = 'post-images' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy post_images_owner_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'post-images' and (storage.foldername(name))[1] = (select auth.uid())::text);

create or replace function public.community_limits()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if tg_table_name = 'posts' then
    perform pg_advisory_xact_lock(hashtext('posts:' || new.user_id::text));
    if (select count(*) from public.posts x where x.user_id = new.user_id and x.created_at > now() - interval '1 hour') >= 10 then
      raise exception 'too many posts, try again later';
    end if;
    if (select count(*) from public.posts x where x.user_id = new.user_id) >= 500 then
      raise exception 'post limit reached';
    end if;
  elsif tg_table_name = 'comments' then
    perform pg_advisory_xact_lock(hashtext('comments:' || new.user_id::text));
    if (select count(*) from public.comments x where x.user_id = new.user_id and x.created_at > now() - interval '1 hour') >= 30 then
      raise exception 'too many comments, try again later';
    end if;
  elsif tg_table_name = 'post_likes' then
    perform pg_advisory_xact_lock(hashtext('likes:' || new.user_id::text));
    if (select count(*) from public.post_likes x where x.user_id = new.user_id and x.created_at > now() - interval '1 hour') >= 200 then
      raise exception 'too many likes, try again later';
    end if;
  elsif tg_table_name = 'content_reports' then
    perform pg_advisory_xact_lock(hashtext('reports:' || new.reporter_id::text));
    if (select count(*) from public.content_reports x where x.reporter_id = new.reporter_id and x.created_at > now() - interval '1 day') >= 20 then
      raise exception 'too many reports today';
    end if;
  elsif tg_table_name = 'user_blocks' then
    perform pg_advisory_xact_lock(hashtext('blocks:' || new.blocker_id::text));
    if (select count(*) from public.user_blocks x where x.blocker_id = new.blocker_id) >= 200 then
      raise exception 'block limit reached';
    end if;
  end if;
  return new;
end;
$$;
revoke execute on function public.community_limits() from public, anon, authenticated;
