# Renaming the app: plan (prepared 2026-10-22, nothing is changed yet)

The owner is considering a new name because the app is for pairs and for groups ("Duo" says two). **No rename has been decided.** This file exists so that, once a name is chosen, the change is one short, checked piece of work. Do not start it before the owner confirms the name and the name check (section 1) is clean.

## 1. Name check (before anything else)

For the chosen name, record the result in `docs/DECISIONS.md`:
- exact and near-identical names in the App Store and Google Play (search the name with and without a trailing "s" and with a space), in fitness, social and habit categories;
- trademark registers: USPTO, EUIPO, WIPO Global Brand Database, and the Israeli Patent Office database (the first market). This is a search, not legal advice; the lawyer (A12) should confirm before launch;
- domain, social handles, and "Name + fitness" web search;
- a Hebrew reading check: how the name is pronounced and written in Hebrew letters.

Names already looked at on 2026-10-22 (web search only, no registry search): **DuoFit** (current, no conflict seen), **FitMatch** (rejected: an existing partner-matching app and a registered trademark, MYFITMATCH LLC), **StreakMates** (not recommended: StreakMate, Streaks Mate and a GitHub project called StreakMates exist; STREAKS is a registered trademark in health and fitness), **FlameMates** and **GritMates** (no app found, `flamemates.app` $14.99 and `gritmates.com` $11.25 were free), plus descriptive options (WorkoutMates, WorkoutCrew, GymPartner). The store title may carry a short Hebrew descriptor after the brand (the name field allows 30 characters), for example `<Brand> · שותפים לאימון`.

## 2. What changes (inventory from the repository, 2026-10-22)

The name appears in about 350 places in tracked files. Only these matter for the product:

| Area | Where | Change |
|---|---|---|
| App name and links | `duofit/app.json`: `name`, `slug`, `scheme` (`duofit://`), permission texts | New name; `scheme` must match the Supabase redirect URLs and `lib/appLinks.ts` |
| Bundle id / package | `com.arielk29.duofit` in `app.json` | **Free to change only before the first upload to Apple/Google** (decision A-1b). Change together with the Apple App ID, if one was already created |
| UI texts | `lib/termsText.ts`, `lib/storeListing*`, `lib/notifications.ts`, `screens/**`, `components/Logo.tsx`, `src/app/(tabs)/dashboard.tsx` | Replace the name in Hebrew and English strings; the tests in `lib/*.test.ts` that assert texts and links change with them |
| Logo and icons | `components/Logo.tsx` ("DF" mark), `scripts/make-icons.js`, `assets/` | The DF monogram stays only if the new name still starts with D and F; otherwise a new mark is needed (design decision) |
| Public pages | `public/privacy.html`, `public/support.html` (built by `npm run legal:build`) and the separate repository `ArielK29/duofit-legal` | Rebuild, copy, and rename the repository (GitHub redirects the old address) |
| Supabase | Redirect URLs (`duofit://...`), Site URL, email templates, SMTP sender name | Update in the dashboard (owner pastes, or Claude with the owner present) |
| Edge function and tables | `supabase/functions/delete-account` and migrations mention the name in comments only | No data change; no migration needed |
| EAS / Expo | Project `ariel_korman/duofit` (slug), `eas.json` | Rename the project; the project id stays |
| Store material | `docs/STORE-LISTING.md`, `STORE-ANSWERS.md`, `REVIEWER-ACCOUNT.md`, screenshots | Update; Apple name check in App Store Connect (A-1c) |
| Repository and docs | Repo name `DuoFit`, `CLAUDE.md`, `AGENTS.md`, `README.md`, design files `01-08`, `DESIGN.md`, `docs/**` | Rename in one commit; keep the old name in history |
| Email | `SUPPORT_EMAIL` in `lib/contact.ts` | New dedicated address on the new domain |
| Domain | `docs/DECISIONS.md` open item 1 | Buy the domain for the new name (owner pays), then wire Vercel, Supabase and SMTP |

## 3. Order of work (about half a day)

1. Name check (section 1) and the owner's written confirmation.
2. Branch `chore/rename-<name>`; change `app.json`, strings, logo text, tests; run `tsc`, lint, `node --test`, the button inventory (`scripts/qa-inventory.ts`).
3. Rebuild the public pages and copy them to the legal repository; update the support address after the domain exists.
4. Supabase redirect URLs and templates (needs the domain for SMTP).
5. Re-run a short device pass: sign-in, reset-password link, confirm link (the scheme changes), chat, SOS.
6. Update the docs and the owner's checklist; memory notes.

## 4. What does not change

Server data, RLS policies, the user accounts, the reviewer accounts, the Supabase project id, Vercel project (rename optional), and the test coverage.
