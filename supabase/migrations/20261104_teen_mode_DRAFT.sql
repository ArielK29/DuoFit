-- DRAFT, NOT APPLIED (written 2026-11-04). Teen mode: members aged 15 to 17 live in a separate world from adults.
-- Everything here sits behind the switch public.app_flags key 'teen_mode', which is OFF after this migration, so applying it changes
-- nothing for anybody (checked by supabase/tests/rls_teen_test.sql). Do not turn it on before the lawyer has approved
-- (see docs/TEEN-MODE-PLAN.md). Written as RESTRICTIVE policies so the existing permissive policies are not touched or rewritten.

-- ---------------------------------------------------------------------------------------------------------------------
-- 1. The switch and the helper functions
-- ---------------------------------------------------------------------------------------------------------------------
insert into public.app_flags (key, enabled) values ('teen_mode', false) on conflict (key) do nothing;

create function private.teen_mode()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select f.enabled from public.app_flags f where f.key = 'teen_mode'), false);
$$;
revoke execute on function private.teen_mode() from public, anon;
grant execute on function private.teen_mode() to authenticated;

-- The youngest age that can send an identity check: 18 normally, 15 when teen mode is on.
create function private.min_age()
returns int
language sql
stable
security definer
set search_path = ''
as $$
  select case when private.teen_mode() then 15 else 18 end;
$$;
revoke execute on function private.min_age() from public, anon;
grant execute on function private.min_age() to authenticated;

-- Age in whole years from the birth date of the member's identity check (null when there is no check).
create function private.age_of(uid uuid)
returns int
language sql
stable
security definer
set search_path = ''
as $$
  select extract(year from age(current_date, c.birth_date))::int from public.identity_checks c where c.user_id = uid;
$$;
revoke execute on function private.age_of(uuid) from public, anon;
grant execute on function private.age_of(uuid) to authenticated;

-- A teenager: has a check with an age under 18.
create function private.is_teen(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(private.age_of(uid) < 18, false);
$$;
revoke execute on function private.is_teen(uuid) from public, anon;
grant execute on function private.is_teen(uuid) to authenticated;

-- Same world: teen mode off means everybody (as before). On: adults with adults; teenagers only with teenagers up to one year apart.
create function private.same_world(other uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    not private.teen_mode()
    or other = (select auth.uid())
    or (
      case
        when not private.is_teen((select auth.uid())) and not private.is_teen(other) then true
        when private.is_teen((select auth.uid())) and private.is_teen(other)
          then abs(private.age_of((select auth.uid())) - private.age_of(other)) <= 1
        else false
      end
    );
$$;
revoke execute on function private.same_world(uuid) from public, anon;
grant execute on function private.same_world(uuid) to authenticated;

-- ---------------------------------------------------------------------------------------------------------------------
-- 2. Parental consent (written only by trusted server code; a member reads his own row)
-- ---------------------------------------------------------------------------------------------------------------------
create table public.parental_consents (
  user_id uuid primary key references auth.users (id) on delete cascade,
  parent_email text not null check (char_length(parent_email) between 5 and 200),
  token_hash text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'revoked')),
  requested_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '14 days',
  decided_at timestamptz
);
alter table public.parental_consents enable row level security;
revoke all on table public.parental_consents from anon, authenticated;
grant select (user_id, status, requested_at, expires_at, decided_at) on table public.parental_consents to authenticated;
create policy parental_consents_select_own on public.parental_consents for select to authenticated using (user_id = (select auth.uid()));

create function private.consent_ok(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.parental_consents p where p.user_id = uid and p.status = 'approved');
$$;
revoke execute on function private.consent_ok(uuid) from public, anon;
grant execute on function private.consent_ok(uuid) to authenticated;

-- A teenager needs the parent's yes before any contact (adults and the switch-off state are unchanged).
create or replace function private.gate_ok()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    ((not private.identity_required()) or private.i_am_verified())
    and (
      not private.teen_mode()
      or not private.is_teen((select auth.uid()))
      or private.consent_ok((select auth.uid()))
    );
$$;

-- ---------------------------------------------------------------------------------------------------------------------
-- 3. The identity check accepts 15 to 17 when teen mode is on
-- ---------------------------------------------------------------------------------------------------------------------
create or replace function private.identity_checks_guard()
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

  -- 18 normally; 15 when the teen mode switch is on (a teenager then lives in the teen world, see private.same_world).
  if new.birth_date > (current_date - make_interval(years => private.min_age()))::date then
    raise exception 'under_age' using errcode = 'check_violation';
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

-- ---------------------------------------------------------------------------------------------------------------------
-- 4. The wall between the worlds (restrictive: they only ever narrow what the existing policies allow)
-- ---------------------------------------------------------------------------------------------------------------------
create policy teen_world_profiles on public.profiles as restrictive for select to authenticated
  using (id = (select auth.uid()) or (select private.same_world(id)));
create policy teen_world_posts on public.posts as restrictive for select to authenticated
  using (user_id = (select auth.uid()) or (select private.same_world(user_id)));
create policy teen_world_comments on public.comments as restrictive for select to authenticated
  using (user_id = (select auth.uid()) or (select private.same_world(user_id)));
create policy teen_world_group_messages on public.group_messages as restrictive for select to authenticated
  using (sender_id = (select auth.uid()) or (select private.same_world(sender_id)));
create policy teen_world_group_members on public.group_members as restrictive for select to authenticated
  using (user_id = (select auth.uid()) or (select private.same_world(user_id)));
-- A chat can only be started with somebody in my world.
create policy teen_world_conversations on public.conversations as restrictive for insert to authenticated
  with check ((select private.same_world(case when user_a = (select auth.uid()) then user_b else user_a end)));

-- Teenagers do not post, comment, like, create or join groups (they can read their own world's feed and chat).
create policy teen_no_posting on public.posts as restrictive for insert to authenticated
  with check (not (select private.teen_mode()) or not (select private.is_teen((select auth.uid()))));
create policy teen_no_comments on public.comments as restrictive for insert to authenticated
  with check (not (select private.teen_mode()) or not (select private.is_teen((select auth.uid()))));
create policy teen_no_likes on public.post_likes as restrictive for insert to authenticated
  with check (not (select private.teen_mode()) or not (select private.is_teen((select auth.uid()))));
create policy teen_no_groups on public.groups as restrictive for insert to authenticated
  with check (not (select private.teen_mode()) or not (select private.is_teen((select auth.uid()))));
create policy teen_no_joining on public.group_members as restrictive for insert to authenticated
  with check (not (select private.teen_mode()) or not (select private.is_teen((select auth.uid()))));
