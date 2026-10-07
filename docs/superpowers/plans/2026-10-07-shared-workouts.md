# Shared workouts on the server (issue #65, stage 7)

**Goal:** an accepted workout invitation becomes ONE workout row shared by both members (today it becomes a separate local
copy on each phone). Each member checks themself in; both phones show the same list, streaks and goals.

**Out of scope (later):** cancelling/editing a workout, group workouts, "partner checked in" notifications, a push
notifications table, group chats.

## Design
- Table `public.workouts`: `id` = id of the invitation message (so one invitation can create at most one workout),
  `host_id` (inviter), `guest_id` (invitee), `activity`, `location`, `scheduled_at`, `host_checked_in_at`,
  `guest_checked_in_at`, `created_at`.
- **Nobody inserts directly.** A trigger on `messages` (status pending -> accepted) creates the workout from the invitation
  row itself, so its content cannot be forged. The trigger function is SECURITY DEFINER but lives in the non-exposed
  `private` schema, has `search_path = ''`, and nobody has EXECUTE (rules 7 in CLAUDE.md).
- Read: only the two participants (`host_id` or `guest_id` = me). No anon.
- Update: only your own check-in column, only once, server time, only from 3 hours before until 24 hours after the start
  (guard trigger; column grants allow only the two check-in columns). No delete from the app.
- Names: embed `profiles` for display names, fall back to the chat partner name.

## App changes
1. `lib/remoteWorkouts.ts`: `fetchWorkouts(me)`, `checkInRemote(id)`.
2. `hooks/useWorkoutStore.ts`: real mode `checkIn` calls the server first; `hydrateWorkouts()` replaces the list with the
   server list (server is the truth) and plans a local reminder for each upcoming workout once.
3. `hooks/useChatStore.ts` `applyAcceptance`: in real mode do not create a local copy; refresh workouts instead.
4. `components/WorkoutSync.tsx` (like ProgressSync): load on sign-in and on app foreground; mounted in `_layout.tsx`.
5. `CheckInScreen`: show a plain Hebrew message when it is too early/late to check in (real mode).
6. `lib/session.ts`: nothing new (store already reset on sign-out).
7. Demo mode (`DEMO_DATA`) keeps the local behaviour.

## Tests / checks
- `supabase/tests/rls_workouts_test.sql`: accept creates exactly one workout with the invitation's data; decline creates
  none; stranger sees nothing; direct insert/delete blocked; cannot set the other member's check-in; cannot check in twice
  or outside the window; cannot edit activity/time/location; anon denied.
- `get_advisors` security (only the known leaked-password warning), `tsc`, `expo lint`, Snyk Code.
- Browser check: with the real account, read the (empty) list; full two-account flow stays unverified until a second
  account exists (say so in the PR).

## Risks
- A trigger that raises would block accepting an invitation: keep it simple and test the accept path.
- Old on-phone workouts (created before this stage) are replaced by the server list after the first load.
