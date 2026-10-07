# Claude Instructions for DuoFit

## Project Overview
DuoFit is a Hebrew-language fitness buddy matching app built with React Native + Expo. This document guides AI assistants on project standards, structure, and workflow.

---

## Branch Strategy

### Main Branch
- **Purpose:** Production-ready code
- **Protection:** Require PR reviews before merge
- **Contains:** Design system files (01-08-*.md), core infrastructure, README

### Feature Branches
- **Naming:** `feature/{feature-name}`
  - `feature/login` — Authentication (phone → OTP → profile)
  - `feature/discover` — Partner discovery & matching
  - `feature/checkout` — Workout scheduling
  - `feature/dashboard` — User stats & streaks
  - `feature/chat` — Messaging between partners

- **Process:**
  1. Create branch from `main`
  2. Implement feature with tests
  3. Create PR with description
  4. Request review
  5. Merge after approval

---

## Design System Reference

**Always check these files before building UI:**
1. `01-DESIGN-TOKENS.json` — Colors, typography, spacing (W3C format)
2. `02-COMPONENT-STATES.md` — Button/input/card states
3. `03-EDGE-CASES.md` — Error handling, empty states
4. `04-DARK-MODE.md` — Dark-only design (no light mode)
5. `05-MOTION-SPECS.md` — Animation timing (300ms transitions, ease-out)
6. `06-RTL-ICONS-SPEC.md` — RTL layout, Lucide icons (24px, 2px stroke)
7. `07-RESPONSIVE-DECISION.md` — Mobile-only (375-428px)
8. `08-DESIGN-SIGN-OFF.md` — Final approval & checklist

---

## Code Standards

### Language
- **UI Text:** Hebrew (RTL)
- **Code:** English
- **Comments:** English
- **Commits:** English

### File Structure
```
screens/
├── login/
│   ├── SignUpScreen.tsx
│   ├── LoginScreen.tsx
│   ├── VerifyOTPScreen.tsx
│   └── ProfileSetupScreen.tsx
├── discover/
│   ├── DiscoverScreen.tsx
│   └── PartnerProfileScreen.tsx
└── dashboard/
    └── DashboardScreen.tsx

components/
├── Button.tsx
├── Input.tsx
├── Card.tsx
├── StreakDisplay.tsx
└── EmptyState.tsx

hooks/
├── useAuth.ts
├── useLocation.ts
└── usePartnerMatching.ts

constants/
├── colors.ts
├── spacing.ts
└── typography.ts

styles/
└── theme.ts
```

### Component Naming
- **Screens:** `{ScreenName}Screen.tsx` (PascalCase)
- **Components:** `{ComponentName}.tsx` (PascalCase)
- **Hooks:** `use{HookName}.ts` (camelCase)
- **Types:** `{TypeName}.ts` (PascalCase)

### Color Usage (from design tokens)
```tsx
import { colors } from '../constants/colors';

<View style={{ backgroundColor: colors.dark.bg }}>
  <Text style={{ color: colors.dark.text }}>Hello</Text>
  <Button backgroundColor={colors.dark.magenta} />
</View>
```

### Animation Timing
```tsx
// Page transition: 300ms ease-out
<Animated.View
  style={{
    animation: fadeInSlideUp 300ms ease-out,
  }}
/>

// Button hover: 150ms ease-in-out
<Pressable onPressIn={handleHover} />
```

---

## Testing Checklist Before PR

- [ ] All text in Hebrew (UI) is RTL-aligned
- [ ] Button/input states match `02-COMPONENT-STATES.md`
- [ ] Colors use design tokens (no hardcoded #hex)
- [ ] Animation timing matches `05-MOTION-SPECS.md`
- [ ] Error messages in Hebrew with English fallback
- [ ] Touch targets min 48px (per `02-COMPONENT-STATES.md`)
- [ ] Tested on iPhone SE (375px) and Pixel 5 (412px)
- [ ] No console warnings or errors
- [ ] Accessibility: font size readable, contrast >4.5:1

---

## Common Patterns

### RTL Input Field
```tsx
<TextInput
  style={{
    textAlign: 'right',
    marginInlineEnd: 16,
    marginInlineStart: 0,
  }}
  placeholder="שם מלא"
/>
```

### Error Message (Hebrew)
```tsx
{error && (
  <Text style={{ color: colors.dark.magenta, fontSize: 12 }}>
    {error} {/* e.g., "קוד שגוי" */}
  </Text>
)}
```

### Loading Skeleton
```tsx
<View style={{
  backgroundColor: colors.dark.surface,
  borderRadius: 8,
  overflow: 'hidden',
}}>
  <Animated.View
    style={{
      background: 'linear-gradient(90deg, #0D0D0D 0%, #1A1A1A 50%, #0D0D0D 100%)',
      animation: shimmer 1.5s infinite,
    }}
  />
</View>
```

---

## Git Workflow

### Commit Message Format
```
<type>: <subject>

<body (optional)>

<footer (optional)>
```

**Types:**
- `feat:` New feature
- `fix:` Bug fix
- `refactor:` Code reorganization (no behavior change)
- `style:` Formatting, missing semicolons (no code change)
- `test:` Adding or updating tests
- `docs:` Documentation changes
- `chore:` Build, deps, tooling

**Example:**
```
feat: add partner discovery screen with swipe gestures

- Implement partner card with image, name, bio
- Add swipe animations (rotate -45°, fade out)
- Connect to matching API
- Add "interested" and "pass" CTAs

Closes #42
```

---

## Security Scanning (Snyk)

The Snyk MCP server is configured for Claude Code (`snyk mcp`, tools `snyk_code_scan`, `snyk_sca_scan`, `snyk_iac_scan`, `snyk_auth`, `snyk_trust`). Run it from the git root; the app is in `duofit/`.

**When to scan:**
- **Code scan (`snyk_code_scan`)**: after writing or changing first-party code that handles auth, sessions, user input, URLs/deep links, file or image uploads, Supabase queries, storage, or anything that reads secrets. Fix findings of severity high or above before opening the PR; mention medium/low ones in the PR.
- **Dependency scan (`snyk_sca_scan`)**: whenever `duofit/package.json` or `package-lock.json` changes (new package or upgrade), and before every release. Install packages with `npx expo install` and re-scan.
- **IaC scan (`snyk_iac_scan`)**: only if infrastructure files are added (Docker, Terraform, CI configs). There are none today.
- Re-scan after fixing, and repeat until no new high/critical findings remain.

**Rules:**
- Never put secrets in the repo. Only the publishable Supabase key and the PostHog key are allowed in `duofit/.env.local` (git-ignored); `duofit/.env.example` documents them. Never use the `service_role` key in the app.
- Do not "fix" dependency findings with `npm audit fix --force`: it proposes downgrading Expo and breaks the app. Upgrade through Expo SDK-compatible versions (`npx expo install --fix`) and re-test.
- If a finding is a false positive or only affects dev tooling (Metro, Expo CLI), record it in the PR description instead of silencing it silently.
- First-time setup on a machine: run `snyk auth` (browser login), then `snyk_trust` for the repo folder.

---

## Database, Permissions & RLS (Supabase)

Official Supabase skills are installed in `.claude/skills/` (`supabase`, `supabase-postgres-best-practices`; pinned in `skills-lock.json`). **Read the `supabase` skill before any task that touches the database, auth, storage, policies or migrations.** Project ref: `wtheyjuqpidgrgehplgw`.

**Every new table (hard rule):**
1. `alter table ... enable row level security;` in the same migration that creates it. No exceptions, including lookup tables.
2. Write explicit policies per command (`select`, `insert`, `update`, `delete`) with `to authenticated`. Never `to public`, never `auth.role()`.
3. Own-data pattern: `using ((select auth.uid()) = user_id)`; `update` needs both `using` and `with check`; `insert` needs `with check`. An `update` also needs a `select` policy or it silently changes 0 rows.
4. Data shared between users (partners, chats, groups) gets its own deliberate policy that exposes only the needed columns/rows (membership check), never a blanket `using (true)`.
5. No `anon` access unless a feature truly needs it. Revoke `all` from `anon` on new tables, and `truncate, references, trigger` from `authenticated`.
6. Never base authorization on `user_metadata` (user-editable); use `app_metadata` or a roles table with RLS.
7. Avoid `security definer` functions in `public`; if unavoidable, keep `search_path = ''`, check `auth.uid()` inside, and `revoke execute ... from public, anon, authenticated`. Views use `security_invoker = true`.
8. Storage: policies are per bucket and per user folder (`(storage.foldername(name))[1] = (select auth.uid())::text`); upsert needs insert + select + update. Set size and mime limits on the bucket.
9. Add length/format `check` constraints for user-supplied text.

**Before merging any database change:**
- Save the SQL under `supabase/migrations/` (named like the one applied) and apply it with the Supabase MCP.
- Run `get_advisors` (security) and fix every finding.
- Extend and run `supabase/tests/rls_smoke_test.sql` (it rolls itself back); every line must say good/ok/expected value.
- Run a Snyk scan (see above) if app code changed.
- Never use the `service_role` key in the app. Never paste keys in chat or the repo.

**Currently covered (all with RLS, migrations in `supabase/migrations/`, tests in `supabase/tests/`):**
- `profiles`: own row, plus other members' COMPLETE profiles through column-level grants (discovery).
- `storage` bucket `avatars`: own folder, 5 MB, jpeg/png/webp.
- `conversations`, `messages`, `conversation_reads`: 1:1 chat between members, invitation answered by the recipient only, anti-spam limits, Realtime delivery.
- `progress_settings`, `weight_entries`: own rows only (goals, plank record, weight log).
- `workouts`: shared workout per accepted invitation (created by a trigger from the invitation, participants read, own check-in only, window 3 h before to 24 h after).
- `plank_weekly`: best plank time of the current week per member, readable by members (blocked pairs excluded), own write only, server keeps the best, 2 h cap (weekly leaderboard).
- `posts`, `comments`, `post_likes`, `user_blocks`, `content_reports` + storage bucket `post-images`: community feed for signed-in members. Block hides both ways, a report hides for the reporter at once and for everybody after 3 reports (helper functions in the non-exposed `private` schema), anti-spam limits, own-folder image policies.
- Edge Function `delete-account` (`supabase/functions/delete-account`): in-app account deletion; the service role key lives only there.

Still on-device: community groups and group chats, notifications. Moving the rest is tracked in the "[Backend] Move user data to Supabase with RLS" issue; community needs report/block and image storage first.

Any new table needs its own test file or extension of the existing ones; run all of `supabase/tests/*.sql` after changing policies.

---

## Contact & Support
- **Questions:** Check CLAUDE.md first, then design specs
- **Design Spec:** Refer to files 01-08 in root
- **Code Review:** All PRs require review before merge

---

**Last Updated:** 2026-09-23  
**Status:** Active Development
