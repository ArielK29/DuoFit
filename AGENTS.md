# AGENTS.md: FitFriend (instructions for coding agents: Codex, Claude Code and others)

FitFriend is a Hebrew-language (RTL) fitness-buddy matching app: Expo 57, React Native 0.86, expo-router, Supabase. The app lives in `duofit/`, the database in `supabase/`.

**The full project rules are in [CLAUDE.md](./CLAUDE.md). Read it first.** It is the single source of truth (branch strategy, design system files 01-08, code standards, Snyk, Supabase RLS rules). This file only adds what other agents need and the Expo skills setup. If the two ever disagree, CLAUDE.md wins.

## The owner
Non-technical founder, Hebrew speaker, limited use of their hands. Reply in short, simple Hebrew. Do everything you can yourself, minimize questions, show proof (output, screenshots). Code, comments and commits are in English; UI text is Hebrew.

## Hard rules (summary of CLAUDE.md)
- UI: Hebrew, RTL, dark mode only, mobile only (375-428 px), touch targets at least 48 px, colors only from design tokens (`01-DESIGN-TOKENS.json`, no hard-coded hex), animation per `05-MOTION-SPECS.md`.
- Known on-device quirk: `textAlign: 'right'` and `'left'` render inverted; use `'left'` for visual right (see CLAUDE.md and the memory notes).
- Secrets: never put keys in the repo, never type or paste passwords/keys/tokens for the owner (the owner pastes them). Only the publishable Supabase key and the PostHog key live in `duofit/.env.local` (git-ignored). Never use the `service_role` key in the app.
- Never set `EXPO_PUBLIC_DEMO_DATA` in an EAS, Vercel or store build.
- Database: every new table gets RLS in the same migration, explicit per-command policies `to authenticated`, a test in `supabase/tests/`, and the security advisors must report 0 findings. Read the `supabase` skill first.
- Security scan with Snyk after changing code that handles auth, input, uploads or secrets, and after any dependency change. Never run `npm audit fix --force` (it downgrades Expo); use `npx expo install --fix`.

## Expo and EAS skills (installed from https://github.com/expo/skills, reviewed 2026-10-15)
Installed for Claude Code in `.claude/skills/` and for Codex in `.agents/skills/` (copies, pinned in `skills-lock.json`):
`expo-overview` (load this first for any Expo or EAS task), `expo-router`, `expo-data-fetching`, `expo-design-system`, `expo-dev-client`, `eas-app-stores`, `eas-update`, `expo-upgrade`.

On purpose NOT installed: `eas-simulator` (experimental cloud simulator that needs an Expo account token). Add it only when the owner asks.
Rules for these skills:
- Read the relevant `SKILL.md` before acting; follow the project rules above where they conflict with a skill (for example our design tokens and RTL).
- Never run the skills' optional feedback command (`submit-expo-feedback`) and do not enable their telemetry.
- Never start an EAS build, submit to a store, publish an update or touch an Expo, Apple or Google account without the owner's explicit approval in chat. These cost money or are public.

## Workflow
Branch from `main` as `feature/<name>` (or `chore/`, `fix/`), small commits, a PR with a clear body. **Merge only when the owner says "תמזג".** Commit message format and the end-of-commit trailer are in CLAUDE.md. Before claiming something works, run it: `npx tsc --noEmit`, `npx expo lint`, and check the result for real (browser preview at 375 px or a device); say honestly what was not verified (for example device behavior).

## Open decision to raise at launch
Separate staging Supabase project (+ staging branch and `.env.staging`): the owner said yes, but later. Ask again when the app is launched (issue #100).
