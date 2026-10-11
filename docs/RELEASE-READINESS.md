# DuoFit – Release readiness report (issue #12)

Checked on **2026-10-11** against `main` (commit `51ff04f`). Only things that were actually run or read on that day are marked "verified". Everything else is listed under "Not verified". The owner's own steps (accounts, EAS, store listing) are in [RELEASE-CHECKLIST.md](RELEASE-CHECKLIST.md).

## Summary
| Area | Result |
|---|---|
| Typecheck (`npx tsc --noEmit`) | **Pass**, exit 0, no errors |
| Lint (`npx expo lint`) | **Pass**, exit 0, no problems |
| Snyk Code (first-party code, medium and above) | **Pass**, 0 issues |
| Snyk dependencies (high and above) | **5 findings, none fixable today**, all transitive build/lint tooling (see below) |
| Supabase security advisors (project `wtheyjuqpidgrgehplgw`) | **1 warning**: leaked-password protection is off (needs the Pro plan) |
| RLS | **Pass**: 17 tables in `public`, 0 without RLS, 0 with RLS but no policy |
| Storage | **Pass**: `avatars` and `post-images` limited to 5 MB and jpeg/png/webp (both buckets are public-read by design) |
| Secrets in the app folder | **Pass**: no `service_role`, secret keys or private keys found in `duofit/` |
| EAS / app config | **Pass (read only)**: `development`, `preview`, `production` profiles; bundle id and package `com.arielk29.duofit`; production `autoIncrement` |
| Supabase URL configuration | **Pass**: Site URL and Redirect URL point to `https://duofit-duofit-brown.vercel.app` |
| Web (Vercel) | **Up**: HTTP 200, HSTS, `x-content-type-options`, `x-frame-options`, `referrer-policy` present; **no `Content-Security-Policy` header** |

## Details

### Dependencies (Snyk, high and above)
All five have **no upgrade or patch available** and come in through tooling, not through code that runs in the shipped app:
- `braces@3.0.3` (Uncontrolled Recursion) via `react-native`
- `deepmerge@4.3.1` (Prototype Pollution) via `expo > @expo/cli > @expo/config`
- `node-forge@1.4.0` (Improper Verification of Cryptographic Signature) via `expo > @expo/cli`
- `uri-js@4.4.1` (Infinite loop) via `eslint-config-expo > eslint`
- `zod@3.25.76` (Resource allocation without limits) via `eslint-config-expo > eslint-plugin-react-hooks`

Per project rules these are recorded here and not silenced. **Do not** run `npm audit fix --force` (it proposes downgrading Expo). Re-scan after every `npx expo install --fix` and before each store submission.

### Supabase
- Advisor warning **Leaked Password Protection Disabled** (checks passwords against HaveIBeenPwned). Available only on the Pro plan; this project is on the Free plan. Decision for the owner: accept for the first release, or upgrade before launch.
- Authentication → SMTP: **custom SMTP is off**. The default Supabase mailer is rate limited and is not meant for real users. This blocks a public launch and needs a mail provider and a domain (tracked in a new issue split out of #15).
- Account deletion in the app exists (Edge Function `delete-account`, Apple guideline 5.1.1(v)).

### Web security headers
The site returns HSTS, `x-content-type-options`, `x-frame-options` and `referrer-policy`. A `Content-Security-Policy` header was missing; it is added in `duofit/vercel.json` (PR for #90): scripts only from the site itself, connections only to the site, the Supabase project (https and wss) and PostHog (api and assets hosts), images from the site and Supabase storage, no framing. Tested on a production web export in the browser pane (sign-in, profile save, all tabs, avatar image): no violations after adding the PostHog assets host. Not yet checked on the live Vercel site (it is protected on purpose). Map tiles (CARTO) are not on the web build, so they are not allowed; add the host if the web map is ever enabled.

## Not verified
- (Done 2026-10-12, see below.) The RLS tests were re-run in full.
- No EAS build exists yet (needs the owner's Expo/Apple/Google accounts), so permission dialogs, push notifications and on-device RTL/dark mode are untested (issue #11).
- Design sign-off against `08-DESIGN-SIGN-OFF.md` and the store listing assets are not done.
- Privacy policy URL for the stores does not exist yet.

## Release blockers (need the owner)
1. Apple Developer and Google Play accounts, `eas init`, EAS environment variables (never add `EXPO_PUBLIC_DEMO_DATA`).
2. Custom SMTP (provider + domain).
3. Public privacy policy page and support e-mail.
4. On-device bug bash with a second real account (#11).
5. Store listing: Hebrew texts, screenshots, age rating and data-safety answers.

## Before tagging the release candidate
- [ ] Re-run `npx tsc --noEmit`, `npx expo lint`, Snyk Code and Snyk dependencies.
- [x] Re-run all `supabase/tests/*.sql` and the Supabase security advisors (done 2026-10-12; repeat right before the tag).
- [x] `Content-Security-Policy` header (tested locally; verify the header on the live site after the first deploy).
- [ ] Decide on leaked-password protection (Pro plan): owner decision.
- [ ] Confirm the EAS variables exist for `preview` and `production` and that `EXPO_PUBLIC_DEMO_DATA` is absent everywhere.

## Re-check on 2026-10-12 (after PRs #92 and #93)
| Check | Result |
|---|---|
| `npx tsc --noEmit`, `npx expo lint` | Pass (exit 0, no findings) |
| Snyk Code | Pass, 0 issues |
| Snyk Secrets | Not available: the feature is disabled for the organization (403). Secrets were checked by reading instead: only publishable keys in `duofit/.env.local` (git-ignored) |
| Supabase security advisors | Still only the leaked-password warning (Pro plan, owner decision) |
| Supabase performance advisors | Fixed the 2 unindexed foreign keys (`notifications.actor_id`, `workouts.cancelled_by`) with migration `20261012_fk_indexes_notifications_workouts.sql`. Left on purpose: `multiple_permissive_policies` on `profiles` (merging the two SELECT policies would touch the discovery policy for a small gain), `private.group_creations` without a primary key (private helper table), and "unused index" notes (the new indexes are only used when a member is deleted) |
| **All 11 RLS test files in `supabase/tests/`** | **Pass.** smoke 21/21, chat 26 lines, community 37, groups 28, groups hardening 9, plank 12, progress 14, notifications 17, notifications hardening 10, workouts 15, workout lifecycle 10: every line good / matching its expectation. Each test rolls itself back; afterwards the database had 1 user, 1 profile, no conversations, posts, groups, notifications or workouts |
| Test file fix | `rls_notifications_test.sql` line 17 still expected 200 notifications after the later flood cap (5 unread pings per member); the expectation now says 5. The 200 trim is covered by the hardening test |