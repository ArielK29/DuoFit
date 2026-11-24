-- Public meeting places only + member area (plan: docs/superpowers/plans/2026-11-24-public-places-and-areas.md, PR 210).
--
-- WHY: members meet in person, and the owner requires that nobody can set a private address as the meeting place, with no way
-- around it (youth violence, serious incidents). A filter on words or digits can always be bypassed ("הרצל חמש"), so the server
-- accepts ONLY a place from a list of approved public places.
--
-- SAFE TO APPLY BEFORE THE NEW BUILD: the rule is behind a switch (public.app_flags, key public_places_only) that is OFF after this
-- migration, so build 1.0.1 and Apple's reviewer (who may send an invitation with a typed place) see no change. The owner turns it
-- ON only when the new build that picks a place from the list is live:
--     update public.app_flags set enabled = true where key = 'public_places_only';
-- and OFF again with  ... set enabled = false ...  if something goes wrong.
--
-- What this adds:
--  1. areas: a fixed list of localities (a starter list; the owner checks spelling and extends it). profiles.area_id: the city a member
--     chose (city level only, never GPS, never a street).
--  2. public_places: the approved public places (name, kind, area). Signed-in members read the active rows; nobody writes through the API.
--  3. place_requests: a member asks to add a place; only a reviewer (admin) reads it. Rate limit: 5 per day.
--  4. With the switch ON, a new invitation is accepted only when: its placeId is an active row of public_places, its location text is
--     exactly that place's name, its activity is a known activity name, and it carries no other keys. This also closes the invitation as
--     a channel for an address (an address typed into "activity" or an extra key).
-- NOT closed by the server (cannot be): free text in chat messages. The app warns about addresses, members can report, and the identity
-- check limits who can chat at all.
-- Test: supabase/tests/public_places_areas_test.sql (rolled back; every line must say good).

-- ---------------------------------------------------------------------------------------------------------------------
-- 1. areas and the profile area
-- ---------------------------------------------------------------------------------------------------------------------
create table public.areas (
  id smallint generated always as identity primary key,
  name_he text not null unique check (char_length(name_he) between 1 and 60)
);
alter table public.areas enable row level security;
revoke all on table public.areas from anon;
revoke all on table public.areas from authenticated;
revoke truncate, references, trigger on table public.areas from authenticated;
grant select on table public.areas to authenticated;
-- A reference list every signed-in member may read (no personal data); nobody writes through the API.
create policy areas_select_all on public.areas for select to authenticated using (true);

insert into public.areas (name_he) values
  ('תל אביב-יפו'), ('ירושלים'), ('חיפה'), ('ראשון לציון'), ('פתח תקווה'), ('אשדוד'), ('נתניה'), ('באר שבע'),
  ('חולון'), ('בני ברק'), ('רמת גן'), ('אשקלון'), ('רחובות'), ('בת ים'), ('הרצליה'), ('כפר סבא'), ('חדרה'),
  ('מודיעין-מכבים-רעות'), ('רעננה'), ('גבעתיים'), ('נצרת'), ('אילת'), ('הוד השרון'), ('לוד'), ('רמלה'),
  ('נס ציונה'), ('קריית אתא'), ('עכו'), ('נהריה'), ('טבריה'), ('עפולה'), ('קריית גת'), ('כרמיאל'), ('יבנה');

alter table public.profiles add column area_id smallint references public.areas (id) on delete set null;
create index profiles_area_idx on public.profiles (area_id) where area_id is not null;
-- Other members may read the area (the column list of public profile columns is explicit, see 20261007_profiles_partner_discovery.sql).
grant select (area_id) on table public.profiles to authenticated;

-- ---------------------------------------------------------------------------------------------------------------------
-- 2. public_places
-- ---------------------------------------------------------------------------------------------------------------------
create table public.public_places (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 100),
  kind text not null check (kind in ('park', 'beach', 'court', 'gym', 'studio', 'track', 'other')),
  area_id smallint not null references public.areas (id),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (area_id, name)
);
alter table public.public_places enable row level security;
revoke all on table public.public_places from anon;
revoke all on table public.public_places from authenticated;
revoke truncate, references, trigger on table public.public_places from authenticated;
grant select on table public.public_places to authenticated;
create policy public_places_select_active on public.public_places for select to authenticated using (active);
create index public_places_area_idx on public.public_places (area_id) where active;

-- The five venues the app lists today (all in Tel Aviv). More places are added by SQL after the owner checks each one is public.
insert into public.public_places (name, kind, area_id)
select v.name, v.kind, (select a.id from public.areas a where a.name_he = 'תל אביב-יפו')
from (values
  ('הולמס פלייס דיזנגוף', 'gym'),
  ('פארק הירקון – מתקני קליסטניקס', 'park'),
  ('מגרש כדורסל גורדון', 'court'),
  ('טיילת – נקודת מפגש ריצה', 'track'),
  ('CrossFit Florentin', 'studio')
) as v(name, kind);

-- ---------------------------------------------------------------------------------------------------------------------
-- 3. place_requests (a member asks for a place to be added; a reviewer decides)
-- ---------------------------------------------------------------------------------------------------------------------
create table public.place_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 100),
  area_id smallint references public.areas (id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.place_requests enable row level security;
revoke all on table public.place_requests from anon;
revoke all on table public.place_requests from authenticated;
grant select, insert on table public.place_requests to authenticated;
create index place_requests_user_idx on public.place_requests (user_id, created_at desc);
create index place_requests_area_idx on public.place_requests (area_id) where area_id is not null;
create policy place_requests_insert_own on public.place_requests for insert to authenticated with check (user_id = (select auth.uid()));
create policy place_requests_select_own on public.place_requests for select to authenticated using (user_id = (select auth.uid()));
create policy place_requests_select_admin on public.place_requests for select to authenticated using ((select private.is_admin()));
-- No update or delete from the API: a request disappears with the account (cascade).

create function private.place_requests_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select count(*) from public.place_requests r where r.user_id = new.user_id and r.created_at > now() - interval '1 day') >= 5 then
    raise exception 'too many place requests today' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;
revoke execute on function private.place_requests_limit() from public, anon, authenticated;
create trigger place_requests_limit before insert on public.place_requests
  for each row execute function private.place_requests_limit();

-- ---------------------------------------------------------------------------------------------------------------------
-- 4. The rule for invitations (behind the switch)
-- ---------------------------------------------------------------------------------------------------------------------
insert into public.app_flags (key, enabled) values ('public_places_only', false) on conflict (key) do nothing;

create function private.messages_require_public_place()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  place_id uuid;
  place_name text;
  allowed_activities text[] := array[
    'אימון משותף', 'ריצה', 'כושר גופני', 'כוח', 'קליסטניקס', 'קרוספיט', 'יוגה',
    'רכיבה על אופניים', 'שחייה', 'כדורגל', 'כדורסל'
  ];
begin
  if new.kind is distinct from 'invite' then
    return new;
  end if;
  if not coalesce((select f.enabled from public.app_flags f where f.key = 'public_places_only'), false) then
    return new;
  end if;

  -- Only the keys the app sends: nothing else can carry text to the other member.
  if exists (
    select 1 from jsonb_object_keys(new.invite) k
    where k not in ('activity', 'location', 'placeId', 'scheduledAt', 'status')
  ) then
    raise exception 'invitation has unexpected fields' using errcode = 'check_violation';
  end if;

  if (new.invite ->> 'activity') is null or not ((new.invite ->> 'activity') = any (allowed_activities)) then
    raise exception 'invitation activity is not a known activity' using errcode = 'check_violation';
  end if;

  begin
    place_id := (new.invite ->> 'placeId')::uuid;
  exception when others then
    place_id := null;
  end;
  select p.name into place_name from public.public_places p where p.id = place_id and p.active;
  if place_name is null or (new.invite ->> 'location') is distinct from place_name then
    raise exception 'the meeting place must be chosen from the list of public places' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;
revoke execute on function private.messages_require_public_place() from public, anon, authenticated;
create trigger messages_require_public_place before insert on public.messages
  for each row execute function private.messages_require_public_place();
