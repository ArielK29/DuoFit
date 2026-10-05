# RLS and permissions audit - Supabase project `duofit`

Date: 2026-10-05. Project ref: `wtheyjuqpidgrgehplgw`. Method: official Supabase skills (`.claude/skills/supabase`, `supabase-postgres-best-practices`) + Supabase MCP (`list_tables`, `get_advisors`, SQL) + a two-user test that rolls itself back.

## What exists in the database
| Object | RLS | Access |
|---|---|---|
| `public.profiles` | on | `to authenticated`: select / insert / update own row only (`(select auth.uid()) = id`); update has `using` + `with check`; no delete policy; `anon` has no privileges |
| `storage.objects` (bucket `avatars`) | on | `to authenticated`: select / insert / update / delete only inside the user's own folder; bucket is public for reading by URL only; 5 MB, jpeg/png/webp |
| `public.handle_new_user()` | n/a | SECURITY DEFINER trigger on `auth.users` (creates the profile); `search_path = ''`; execute revoked from public/anon/authenticated |

Everything else the app stores (workouts, chats, community, progress, notifications) is still on the device, so there is no server-side table to protect yet.

## Findings and fixes
| # | Finding | Severity | Fix | Migration |
|---|---|---|---|---|
| 1 | `anon` held all privileges on `profiles`; signed-in users also held TRUNCATE / REFERENCES / TRIGGER, which RLS does not cover | Medium | Revoked | `20261004_harden_profiles_and_avatars.sql` |
| 2 | No length limits on display name, bio, favorite activities | Low | Check constraints (60 / 500 / 20); sign-up trigger truncates long email prefixes | same |
| 3 | `avatars` bucket had no size or type limit | Medium | 5 MB, jpeg/png/webp | same |
| 4 | Storage upsert (replacing an avatar) needs INSERT + SELECT + UPDATE; there was no SELECT policy, so the app's `upsert: true` would fail silently | Medium (functional bug) | Added `avatars_owner_select` (own folder only) | `20261005_avatars_select_policy_and_function_privileges.sql` |
| 5 | `handle_new_user` (SECURITY DEFINER in an exposed schema) was executable through the API by default | Low | Revoked execute | same |

Supabase security advisors: 0 findings before and after.

## Verification (16 checks, all passed, nothing persisted)
Run again with `supabase/tests/rls_smoke_test.sql`. It creates two throw-away users in a transaction and ends with an exception so everything rolls back.

- Trigger creates a profile for each new user.
- User A sees only their own profile; cannot update, reassign, insert for another id, or delete B's row; a 200-character name is rejected.
- User A can upload and replace only inside their own avatar folder, not B's.
- User B cannot see A's avatar objects or profile.
- `anon` is denied on `profiles` and cannot call `handle_new_user`.

## Not verified / open
- A real sign-up from the app after the `handle_new_user` revoke (Postgres checks EXECUTE only when a trigger is created, so it should be fine, but one real sign-up is the final proof).
- Partner discovery needs a deliberate read policy (or a `security_invoker` view) exposing only safe fields; today `profiles` is readable by its owner only, so real partners cannot yet see each other. Tracked in issue #65.
- In-app account deletion (App Store requirement) needs a delete policy or function. Tracked in issue #65.
- Leaked-password protection and custom SMTP / Site URL are dashboard settings for the project owner.

## Rules going forward
See `CLAUDE.md` section "Database, Permissions & RLS". Every new table ships with RLS + policies in the same migration, the smoke test is extended for it, and advisors must return 0 findings before merge.
