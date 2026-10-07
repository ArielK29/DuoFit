# Notifications on the server (issue #65, stage 8)

**Goal:** things that happen to a member while they are away (an invitation arrives, an invitation is answered, a
workout is cancelled, someone comments on their post) are recorded on the server and show up in the in-app
notification list on every phone, read/unread included. This is also the base for real push notifications later
(push needs the Apple/Google accounts of #12, so it is out of scope now).

**Out of scope:** push notifications (OS level, needs EAS build + tokens), chat message notifications (the chat has its
own unread counter), likes, time-based reminders (they stay local: "workout soon", "goal reached").

## Design
- Table `public.notifications` (`user_id` = recipient, `kind` in `invite_received | invite_accepted | invite_declined |
  workout_cancelled | post_comment`, `actor_id`, `ref_id`, short `body` snapshot, `read_at`, `created_at`).
- **Only the database writes rows**: triggers on `messages` (insert invite / answer), `workouts` (cancel), `comments`
  (insert). They call one SECURITY DEFINER helper in the non-exposed `private` schema (search_path `''`, no EXECUTE for
  anyone), which also keeps only the newest 200 rows per member. Blocked pairs never notify each other.
- Members: select own, update only `read_at` (server stamps it), delete own. No insert grant, no anon.
- Realtime: table added to the `supabase_realtime` publication (RLS filters rows per member).

## App
1. `lib/remoteNotifications.ts`: fetch (with the actor's name), mark read, clear, realtime subscribe.
2. `hooks/useNotificationStore.ts`: items get `remoteId`; `mergeRemote()` adds new server items and takes read state
   from the server; mark read / mark all / clear also update the server for server items.
3. `components/NotificationSync.tsx`: load on sign-in and foreground, subscribe to realtime (real mode only).
4. Remove duplicates: the chat no longer adds a local notification for an incoming invitation in real mode, and the
   workout store no longer adds the local "cancelled" notice (the server row replaces both).
5. Screen: new icons for the new kinds. Demo mode unchanged.

## Checks
`supabase/tests/rls_notifications_test.sql` (recipient only, forged insert/other's rows blocked, triggers create the
right rows for invite / answer / cancel / comment, blocked pair silent, no self notification, read_at stamped, trimming),
advisors, tsc, lint, Snyk, browser check of the empty list and query.

## Risks
A failing trigger would block sending an invitation or a comment: the helper must never raise (wrap in an exception
block) and the tests cover the happy paths.
