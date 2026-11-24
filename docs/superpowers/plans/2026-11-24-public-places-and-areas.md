# Public meeting places only + member area (plan)

Status: DRAFT plan, 2026-11-24. Nothing built or applied. Build only after "תבנה"; apply a migration only after the owner says yes; merge only after "תמזג". Does not touch build 1.0.1 (waiting for Apple); ships as 1.0.2.

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development or superpowers:executing-plans. Read the `supabase` and `supabase-postgres-best-practices` skills before the database task (CLAUDE.md rule).

**Goal (owner, 2026-11-24):** (1) members meet ONLY in public places, enforced by the server, never at a private address (youth violence and serious incidents are the reason); (2) members see which area each member is in, so partner discovery works by area, without ever exposing an exact location.

**Architecture:** a server table of approved public places; invitations may only name a place from that table (server trigger, behind a flag for a safe rollout); the app picks from a searchable list instead of free text; a coarse "area" (city) chosen by the member from a fixed list is stored on the profile and used to filter and label partners.

**Tech stack:** Supabase (Postgres, RLS, triggers), Expo SDK 57, node:test for `lib/*.test.ts`.

## What the code does today (read on 2026-11-24)
- Real members have **no location or area** anywhere on the server (`profiles` public columns: name, bio, avatar, gender, level, activities). Distances shown in the app exist only for example partners; `usePartnerMatching` says "null when the partner has no known location (real members, for now)". The discovery list is newest first.
- Meeting place: `components/ScheduleForm.tsx` lets a member pick one of about 5 built-in Tel Aviv venues (`constants/places.ts`) or **type any text**. The app refuses a few private words (`privatePlaceProblem` in `lib/placeSearch.ts`: home, flat, "אצלי", "חדר" and similar) and asks to tick "this is a public place".
- Gaps: a street address ("הרצל 5") passes; **the server only checks length 1 to 100** (`workouts.location`, `messages.invite->>'location'`), so a modified or old app bypasses everything; chat text can carry an address.

## Global Constraints
- UI text Hebrew (RTL), code and comments English. Design tokens only, 48px touch targets, no `#hex`.
- Every new table keeps RLS with explicit per-command policies `to authenticated`; no `anon`; no `service_role` in the app; column grants only for public columns (CLAUDE.md rules 1 to 9).
- Branch `feature/public-places-areas` from up-to-date `main`. Commits in English with the `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>` trailer.
- Location stays privacy-first: **city level only**, chosen by the member, never GPS stored, never a street.
- Run all of `supabase/tests/*.sql` after policy changes; security advisors stay at the known baseline.
- Snyk code scan after app changes (needs the owner's `snyk auth`).

## Decisions made (owner can change)
1. **List only, no free text.** A meeting place must be a row in `public_places` (approved by us). The member searches and picks; if the place is missing he taps "בקש להוסיף מקום", writes the name and the city, and a reviewer adds it later; the invitation waits for a place from the list.
2. **Server enforcement behind a flag** `public_places_only` in `public.app_flags` (OFF at first). It is turned ON only when 1.0.2 is live for members, so the old build is not broken without notice. Owner says "תדליק".
3. **Area = city from a fixed list** (`public.areas`, about the 100 largest localities first, Hebrew names), chosen in profile setup and editable in "החשבון שלי". Not required for old members (shown as "אזור לא צוין").
4. **Discovery by area:** same area first, then others; a filter chip "באזור שלי". The partner card shows the area name, never distance in meters or a pin.
5. **No exact distances or live location** between members, ever.
6. **Chat addresses:** a warning banner when a message looks like a street address (digits plus street words), with a reminder to meet only in public places and a report button. This cannot be fully blocked and the terms say so.
7. **Place data source (to decide):** start with a curated list we verify by hand for the main cities; OpenStreetMap is a free candidate for parks, pitches, beaches and gyms (license ODbL needs attribution; NOT checked for quality in Israel).

## Review Focus
- An invitation naming a place that is not in `public_places` is refused by the server when the flag is ON, whatever the app sends; an invitation with a place copied from the list but a changed name is also refused.
- Old invitations and workouts keep working (no data is rewritten).
- A member cannot edit `public_places` or `areas`; a reviewer adds places only through the admin path.
- A profile's area is the only location data stored; no coordinates of members anywhere; the area column is readable only by signed-in members who can already see the profile.
- A member who changes the area appears under the new area at once.
- A place request cannot be used to smuggle a private address: it goes to a reviewer, never becomes selectable by itself.
- Old app builds (1.0.1) with the flag OFF still send free-text places and work; with the flag ON they get a clear refusal.

## Task 1: Database (migration, owner yes needed to apply)
**Files:** Create `supabase/migrations/2026MMDD_public_places_areas.sql`, `supabase/tests/public_places_areas_test.sql`.
- [ ] Step 0: read `supabase/migrations/20261007_chat_hardening.sql` (invite checks) and `20261007_shared_workouts.sql` (the workout is created by a trigger from the invitation).
- [ ] Step 1: failing tests: member cannot insert or update `public_places`/`areas`; with the flag ON an invite with an unknown `placeId` or a changed name is refused, with a valid one it passes; with the flag OFF old behaviour; a member can set only his own `area_id`; the `area_id` column is selectable by other signed-in members who can see the profile.
- [ ] Step 2: tables `areas (id, name_he unique)` and `public_places (id uuid, name, kind check (park, beach, court, gym, track, other), area_id references areas, active boolean)` with RLS: select to authenticated, no write grants; `profiles.area_id` (nullable, FK) with a column grant for select (others) and update (own only); `place_requests (id, user_id, name, area_id, created_at)` own insert, reviewer select; flag `public_places_only` OFF; extend the invite guard trigger and the workout creation trigger to require `placeId` in `public_places` when the flag is ON and to copy the stored name; indexes for the foreign keys. All tests, then the security advisors.
- [ ] Step 3: commit.

## Task 2: Seed data
- [ ] Step 1: areas: the largest localities (list and spelling to be verified from an official source before applying; NOT done yet).
- [ ] Step 2: places: the 5 built-in venues plus a curated list for the main cities; each reviewed by hand as public and open to everybody. Only active rows are selectable. Source and date noted per row.

## Task 3: App (needs "תבנה" for a build; code and tests can be written earlier)
**Files:** `duofit/components/ScheduleForm.tsx`, `duofit/lib/placeSearch.ts` (+ test), `duofit/lib/remotePlaces.ts` (new), `duofit/lib/remoteWorkouts.ts`, the chat invite code, `duofit/screens/login/ProfileSetupScreen.tsx`, `duofit/components/AccountSheet.tsx`, `duofit/hooks/usePartnerMatching.ts`, `duofit/screens/discover/*`, a new helper `duofit/lib/addressWarning.ts` (+ test).
- [ ] Step 1: failing tests for `addressWarning` (street and number patterns in Hebrew and English are flagged, normal chat is not) and for the place search over the server list (area first, then name).
- [ ] Step 2: replace the free-text path in `ScheduleForm` by a searchable list from `public_places` (filtered by the member's area, with "מקומות באזורים אחרים"), the request-a-place sheet, and remove the "I confirm it is public" tick (the server now guarantees it).
- [ ] Step 3: area picker in profile setup (skippable) and in "החשבון שלי"; show the area on the partner card and profile; "באזור שלי" filter and area-first ordering; Hebrew texts for no area and for a place request that was sent.
- [ ] Step 4: chat address warning banner.
- [ ] Step 5: `npx tsc --noEmit`, `npx expo lint`, tests, Snyk; check in the browser preview at 375px. Phone behaviour on a real iPhone is NOT verifiable there; say so.

## Task 4: Rollout (each step needs the owner's word)
1. Apply the migration (flag OFF). 2. "תבנה" 1.0.2 and send it through TestFlight. 3. Test on an iPhone: list pick, request a place, invitation accepted, a hand-made API call with a typed place refused after the flag is ON in a test. 4. Release 1.0.2 after Apple approves it. 5. "תדליק" the flag `public_places_only`. If something breaks, turn it OFF with one SQL line.

## Task 5: Documents
Terms: meetings only in public places and what happens otherwise; chat addresses are discouraged and reportable; the area is shown to members. Privacy text: the area is a stored profile field (city level), not GPS. Apple privacy label: "Coarse Location" is NOT collected by GPS, but the chosen city is user content in the profile; confirm the wording. Lawyer package: is a city-level area plus public-place enforcement enough, and what is our exposure for what members write in chat (extends question 4).

## Out of scope
Maps with pins, live location sharing, distances, automatic detection of addresses on the server (chat), place ratings, check-in by GPS (product decision elsewhere).

## Not verified
Which source gives a correct and complete list of public places in Israel; the official list and spelling of localities; whether OpenStreetMap data is good enough here; that the "only a list" flow is fast enough for members in smaller towns (they may find an empty list: the request flow must be quick to serve).
