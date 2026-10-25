# FitFriend

A Hebrew-language (right-to-left, dark-only) fitness-buddy app: find a training partner near you, send a workout invitation, chat, join groups, post to a community feed and track your own progress. Built with Expo (React Native) and Supabase. Phone only (iPhone first, then Android); a web build exists for previews.

The app is in `duofit/`, the database in `supabase/`, the docs in `docs/`.

## Status
The features are built and the data is on the server (Supabase, with row-level security on every table). What is left is release work: store accounts, a domain, a device test pass and the store listing. The plan and the checklists are in [docs/APP-STORE-READINESS.md](docs/APP-STORE-READINESS.md); the open product decisions are in [docs/DECISIONS.md](docs/DECISIONS.md).

## Quick start
You need Node.js 24 (the unit tests run TypeScript directly) and a phone with Expo Go, or a browser.

```bash
cd duofit
npm ci
cp .env.example .env.local     # then fill in the values below
npx expo start                 # scan the QR code with Expo Go
```

`.env.local` is git-ignored. It needs only public keys:

| Variable | What |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL (Project settings, API) |
| `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | The **publishable** key. Never the `service_role` key |
| `EXPO_PUBLIC_POSTHOG_API_KEY`, `EXPO_PUBLIC_POSTHOG_HOST` | Analytics (optional) |
| `GOOGLE_MAPS_ANDROID_API_KEY` | Android map key, only as an **EAS environment variable** (see [docs/MAPS-SETUP.md](docs/MAPS-SETUP.md)); not needed for Expo Go or the iPhone |
| `EXPO_PUBLIC_DEMO_DATA` | `true` shows invented people for design demos. **Never** set it in an EAS, Vercel or store build |

Never paste keys into chat, issues or commits.

## Commands (run in `duofit/`)
| Command | What |
|---|---|
| `npx expo start` / `npm run web` | Dev server (phone via Expo Go, or the browser) |
| `npx tsc --noEmit` | Type check |
| `npx expo lint` | Lint |
| `npm test` | Unit tests (node's test runner, about 70 tests, a few seconds) |
| `npm run qa:scan` | Lists every button and flags dead, unlabelled or English ones (also runs inside `npm test`) |
| `npm run legal:build` | Rebuilds `public/privacy.html` and `public/support.html` from `lib/termsText.ts` and `lib/contact.ts` |
| `npx expo-doctor` | Checks the Expo setup |
| `npx expo install <package>` | The only way to add a package (picks the version that fits the Expo SDK) |

Never run `npm audit fix --force`: it proposes downgrading Expo. Use `npx expo install --fix`.

## Tech
Expo SDK 57, React Native 0.86, expo-router (routes in `src/app/`), zustand stores, Supabase (email and password sign-in, Postgres with RLS, Storage, Realtime, one Edge Function), PostHog, react-native-maps, lucide icons, Reanimated. Details in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Layout
```
duofit/
  src/app/        routes (thin wrappers that render a screen)
  screens/        one folder per area: login, discover, chat, community, progress, ...
  components/     shared pieces (Button, Input, BottomSheet, ...)
  hooks/          zustand stores and data hooks (useAuth, useChatStore, ...)
  lib/            plain logic, API calls and helpers; the *.test.ts files next to them are the unit tests
  constants/ styles/   design tokens and example data (example data shows only in demo mode)
  public/         static pages for the web build (privacy, support)
  scripts/        tooling (button scan, legal pages, icon generator)
supabase/
  migrations/     the SQL that was applied, one file per change
  tests/          RLS tests (each one rolls itself back)
  functions/      Edge Function delete-account
docs/             plans, checklists, decisions, QA flows, design specs
```

## Rules of the house
The full rules are in [CLAUDE.md](CLAUDE.md) (and [AGENTS.md](AGENTS.md) for other coding agents). The short version:
- **UI is Hebrew, RTL, dark only, phone only.** Colors, spacing and type come from the design tokens (`01-DESIGN-TOKENS.json`, `duofit/constants`), touch targets are at least 48 px. Code, comments and commits are English.
- **Branch, PR, review.** Branch from `main` (`feature/`, `fix/`, `chore/`, `docs/`), small commits, a PR that says what was verified and what was not. Nothing is merged until the owner approves.
- **Tests first for logic.** Put plain logic in `lib/` with a `*.test.ts` next to it (red, then green; try breaking the code on purpose to see the test catch it). Screens stay thin.
- **Database changes:** every table gets row-level security in the same migration, explicit per-command policies for `authenticated`, a test in `supabase/tests/`, and the Supabase security advisors must report nothing. Read the Supabase section of CLAUDE.md first. The migration file is saved under `supabase/migrations/` and applied with the Supabase MCP.
- **Secrets:** only the publishable Supabase key and the PostHog key are allowed in the app. The `service_role` key lives only in the Edge Function environment.
- **Security scan (Snyk)** after changing code that handles sign-in, input, uploads or secrets, and after any dependency change.
- **Store, EAS and account actions** (builds, submissions, messages to Apple or Google) only with the owner's explicit approval.

## Release
| Doc | What |
|---|---|
| [docs/APP-STORE-READINESS.md](docs/APP-STORE-READINESS.md) | The plan: owner checklist, software checklist, Apple review risks |
| [docs/RELEASE-CHECKLIST.md](docs/RELEASE-CHECKLIST.md), [docs/RELEASE-READINESS.md](docs/RELEASE-READINESS.md) | Accounts, EAS variables, last readiness report |
| [docs/QA-FLOWS.md](docs/QA-FLOWS.md), [docs/QA-INVENTORY.md](docs/QA-INVENTORY.md), [docs/QA-RUN-1.md](docs/QA-RUN-1.md) | The 22 test flows, the button inventory, what has been run |
| [docs/STORE-LISTING.md](docs/STORE-LISTING.md), [docs/OWNER-PREP.md](docs/OWNER-PREP.md) | Store texts and label answers; drafts for the owner's checklist |
| [docs/DECISIONS.md](docs/DECISIONS.md) | Decisions made and decisions still open |

## Related repositories
- `gmail-agent`: a separate product (a Gmail assistant: web page plus Supabase Edge Functions); its mobile app is `gmail-agent-mobile`. They have their own repos and databases; nothing is shared with FitFriend.
