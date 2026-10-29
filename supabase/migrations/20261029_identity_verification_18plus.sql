-- NOT APPLIED YET. Written 2026-10-29 on branch feat/safety-18plus.
-- Apply ONLY after Apple has approved build 7 and the owner says so: from the moment this runs, every member who is not
-- verified is locked out of partners, chat, groups and the community (build 7 has no verification screen).
-- Before applying, approve the reviewer account and the team test accounts (see the "after apply" notes at the bottom).
-- Test: supabase/tests/rls_identity_test.sql (rolled back; every line must say good).
--
-- What this adds (the owner's rule: nobody uses the app before an adult, real-person check):
--  1. identity_checks: birth date (18+), the random gesture the member was asked to show, the path of the private video,
--     and the decision (pending / approved / rejected) made by an admin.
--  2. app_admins: the people who may review (written only by SQL, never by the app).
--  3. profiles.verified: the public badge, set only by the decision trigger (a member can never write it).
--  4. A private storage bucket for the videos: the member writes and reads own folder, admins read all and delete after review.
--  5. Server-side gate: an unverified member cannot read other members, start a chat, post, join or create a group.

-- ---------------------------------------------------------------------------------------------------------------------
-- 1. Admins
-- ---------------------------------------------------------------------------------------------------------------------
create table public.app_admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);
alter table public.app_admins enable row level security;
revoke all on table public.app_admins from anon;
revoke all on table public.app_admins from authenticated;
grant select on table public.app_admins to authenticated;
-- A member can only see whether he himself is an admin (the app uses it to show the review screen). Nobody writes this table through the API.
create policy app_admins_select_own on public.app_admins for select to authenticated using (user_id = (select auth.uid()));

create function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.app_admins a where a.user_id = (select auth.uid()));
$$;
revoke execute on function private.is_admin() from public, anon;
grant execute on function private.is_admin() to authenticated;

-- ---------------------------------------------------------------------------------------------------------------------
-- 2. identity_checks
-- ---------------------------------------------------------------------------------------------------------------------
create table public.identity_checks (
  user_id uuid primary key references auth.users (id) on delete cascade,
  birth_date date not null,
  gesture text not null check (gesture in ('thumb_up', 'peace', 'wave', 'fist', 'ear', 'three')),
  video_path text,
  -- the 3-digit number the member had to say out loud in the video (a clip made in advance cannot contain it)
  challenge_code text not null check (challenge_code ~ '^[0-9]{3}$'),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reject_reason text check (reject_reason is null or char_length(reject_reason) <= 200),
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users (id) on delete set null,
  -- the video must live in the member's own folder: <uid>/<file>.mp4 or .mov
  constraint identity_checks_video_path_check
    check (video_path is null or video_path ~ ('^' || user_id::text || '/[A-Za-z0-9._-]+\.(mp4|mov)$'))
);
alter table public.identity_checks enable row level security;
revoke all on table public.identity_checks from anon;
revoke all on table public.identity_checks from authenticated;
grant select, insert, update on table public.identity_checks to authenticated;
create index identity_checks_pending_idx on public.identity_checks (submitted_at) where status = 'pending';
create index identity_checks_reviewed_by_idx on public.identity_checks (reviewed_by) where reviewed_by is not null;

create policy identity_checks_select_own on public.identity_checks for select to authenticated using (user_id = (select auth.uid()));
create policy identity_checks_select_admin on public.identity_checks for select to authenticated using ((select private.is_admin()));
create policy identity_checks_insert_own on public.identity_checks for insert to authenticated with check (user_id = (select auth.uid()));
create policy identity_checks_update_own on public.identity_checks for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy identity_checks_update_admin on public.identity_checks for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
-- No delete policy: a check disappears only when the account is deleted (cascade).

-- Rules a member cannot get around, whatever his app sends.
create function private.identity_checks_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  admin boolean := private.is_admin();
begin
  -- Trusted server code (SQL editor, service role) is not limited; a member and an admin acting through the API are.
  if current_user not in ('authenticated', 'anon') then
    return new;
  end if;

  if new.birth_date > (current_date - interval '18 years')::date then
    raise exception 'under_18' using errcode = 'check_violation';
  end if;

  if admin and tg_op = 'UPDATE' and new.user_id <> (select auth.uid()) then
    -- An admin decides about somebody else: only the decision fields may change.
    new.birth_date := old.birth_date;
    new.gesture := old.gesture;
    new.video_path := old.video_path;
    new.challenge_code := old.challenge_code;
    new.submitted_at := old.submitted_at;
    new.reviewed_at := now();
    new.reviewed_by := (select auth.uid());
    if new.status = 'approved' then
      new.reject_reason := null;
    end if;
    return new;
  end if;

  -- The member himself (an admin who checks himself is treated as a member): always starts or restarts as pending.
  new.status := 'pending';
  new.reject_reason := null;
  new.reviewed_at := null;
  new.reviewed_by := null;
  if tg_op = 'INSERT' then
    new.submitted_at := now();
  elsif old.status = 'approved' then
    -- An approved member cannot swap the photo or the birth date afterwards (that would be a way to keep the badge with another face).
    new.status := 'approved';
    new.birth_date := old.birth_date;
    new.gesture := old.gesture;
    new.video_path := old.video_path;
    new.challenge_code := old.challenge_code;
    new.submitted_at := old.submitted_at;
    new.reviewed_at := old.reviewed_at;
    new.reviewed_by := old.reviewed_by;
  else
    new.submitted_at := now();
  end if;
  return new;
end;
$$;
create trigger identity_checks_guard before insert or update on public.identity_checks
  for each row execute function private.identity_checks_guard();

-- Keeps the public badge in step with the decision.
create function private.identity_checks_sync_badge()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles set verified = (new.status = 'approved') where id = new.user_id;
  return new;
end;
$$;
revoke execute on function private.identity_checks_sync_badge() from public, anon, authenticated;
create trigger identity_checks_sync_badge after insert or update of status on public.identity_checks
  for each row execute function private.identity_checks_sync_badge();

-- ---------------------------------------------------------------------------------------------------------------------
-- 3. profiles.verified (public badge, written only by the trigger above)
-- ---------------------------------------------------------------------------------------------------------------------
alter table public.profiles add column verified boolean not null default false;
grant select (verified) on table public.profiles to authenticated;

create function private.profiles_protect_verified()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('authenticated', 'anon') then
    if tg_op = 'INSERT' then
      new.verified := false;
    elsif new.verified is distinct from old.verified then
      raise exception 'verified is set by the server only' using errcode = 'insufficient_privilege';
    end if;
  end if;
  return new;
end;
$$;
create trigger profiles_protect_verified before insert or update on public.profiles
  for each row execute function private.profiles_protect_verified();

-- True when the signed-in member passed the check.
create function private.i_am_verified()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.identity_checks c where c.user_id = (select auth.uid()) and c.status = 'approved');
$$;
revoke execute on function private.i_am_verified() from public, anon;
grant execute on function private.i_am_verified() to authenticated;

-- ---------------------------------------------------------------------------------------------------------------------
-- 4. Private bucket for the videos
-- ---------------------------------------------------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('identity-videos', 'identity-videos', false, 20971520, array['video/mp4', 'video/quicktime']);

-- Member: own folder only. Upsert needs insert + select + update.
create policy identity_videos_insert_own on storage.objects for insert to authenticated
  with check (bucket_id = 'identity-videos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy identity_videos_select_own on storage.objects for select to authenticated
  using (bucket_id = 'identity-videos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy identity_videos_update_own on storage.objects for update to authenticated
  using (bucket_id = 'identity-videos' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'identity-videos' and (storage.foldername(name))[1] = (select auth.uid())::text);
-- Admins: read everything to review, delete after the decision.
create policy identity_videos_select_admin on storage.objects for select to authenticated
  using (bucket_id = 'identity-videos' and (select private.is_admin()));
create policy identity_videos_delete_admin on storage.objects for delete to authenticated
  using (bucket_id = 'identity-videos' and (select private.is_admin()));

-- ---------------------------------------------------------------------------------------------------------------------
-- 5. Server-side gate: no verified badge, no contact
-- ---------------------------------------------------------------------------------------------------------------------
-- Other members' profiles: only verified ones, and only for a verified viewer.
drop policy profiles_select_discoverable on public.profiles;
create policy profiles_select_discoverable on public.profiles
  for select to authenticated
  using (
    id <> (select auth.uid())
    and verified
    and (select private.i_am_verified())
    and gender is not null
    and fitness_level is not null
    and cardinality(favorite_activities) > 0
    and not private.blocked_by(id)
  );

-- Anything that starts contact with other members needs a verified member.
alter policy conversations_insert_member on public.conversations
  with check (
    (select private.i_am_verified())
    and (((select auth.uid()) = user_a) or ((select auth.uid()) = user_b))
    and not private.blocked_between(case when user_a = (select auth.uid()) then user_b else user_a end)
  );
alter policy messages_insert_member on public.messages
  with check (
    (select private.i_am_verified())
    and sender_id = (select auth.uid())
    and private.conversation_other(conversation_id) is not null
    and not private.blocked_between(private.conversation_other(conversation_id))
  );
alter policy group_members_insert_self on public.group_members
  with check ((select private.i_am_verified()) and user_id = (select auth.uid()));
alter policy group_messages_insert_members on public.group_messages
  with check ((select private.i_am_verified()) and sender_id = (select auth.uid()) and private.is_group_member(group_id));
alter policy groups_insert_own on public.groups
  with check ((select private.i_am_verified()) and created_by = (select auth.uid()));
alter policy posts_insert_own on public.posts
  with check ((select private.i_am_verified()) and user_id = (select auth.uid()));
alter policy comments_insert_own on public.comments
  with check (
    (select private.i_am_verified())
    and user_id = (select auth.uid())
    and exists (select 1 from public.posts p where p.id = comments.post_id)
  );
alter policy post_likes_insert_own on public.post_likes
  with check (
    (select private.i_am_verified())
    and user_id = (select auth.uid())
    and exists (select 1 from public.posts p where p.id = post_likes.post_id)
  );

-- ---------------------------------------------------------------------------------------------------------------------
-- 6. Admins read the name and photo of the member they check; a new profile photo needs a new check
-- ---------------------------------------------------------------------------------------------------------------------
-- (Column privileges still limit this to the public profile columns.)
create policy profiles_select_admin on public.profiles for select to authenticated using ((select private.is_admin()));

-- The badge belongs to the face that was checked. When a verified member changes his profile photo the check is withdrawn,
-- the member goes back to the gate and sends a new video.
create function private.profiles_avatar_change_rechecks()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.identity_checks
     set status = 'rejected',
         reject_reason = 'החלפת תמונת הפרופיל מחייבת אימות מחדש',
         reviewed_at = now(),
         reviewed_by = null
   where user_id = new.id and status = 'approved';
  return new;
end;
$$;
revoke execute on function private.profiles_avatar_change_rechecks() from public, anon, authenticated;
create trigger profiles_avatar_change_rechecks after update of avatar_url on public.profiles
  for each row when (old.avatar_url is distinct from new.avatar_url)
  execute function private.profiles_avatar_change_rechecks();

-- ---------------------------------------------------------------------------------------------------------------------
-- After apply (run by hand, once):
--   * make the owner an admin:        insert into public.app_admins (user_id) values ('<owner user id>');
--   * approve the reviewer + team test accounts so they keep working:
--       insert into public.identity_checks (user_id, birth_date, gesture, challenge_code, status) values ('<id>', '1990-01-01', 'thumb_up', '123', 'approved');
--       (the guard trigger does not limit SQL-editor / service-role inserts)
--   * run supabase/tests/rls_identity_test.sql and the security advisors; every line must be good / 0 findings.
-- ---------------------------------------------------------------------------------------------------------------------
