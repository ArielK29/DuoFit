# Subscriptions foundation (PR 1) - implementation plan

Status: IN PROGRESS on branch `feature/subscriptions` (opened 2026-11-15 after the owner's "תבנה"). Parent plan: `2026-11-12-subscriptions.md` (packages and prices). Nothing is applied to the live database, no EAS build is started, nothing is merged without the owner's words ("כן" for the migration, "תבנה" for an EAS build, "תמזג" for the merge).

> **For agentic workers:** use superpowers:subagent-driven-development or superpowers:executing-plans. Read the `supabase` and `supabase-postgres-best-practices` skills before the database task (CLAUDE.md rule).

**Goal:** the member can see Plus / Pro, buy through Apple (RevenueCat), and the server knows the member's tier and enforces the first limit (new invitations per week).

**Architecture:** RevenueCat is the purchase layer (it validates receipts and renewals). A RevenueCat webhook calls an Edge Function that writes a `subscriptions` row with the service role (the key lives only in the function). The database derives the tier from that row (`private.current_tier`). The app only shows state; every limit is enforced by the database.

**Tech stack:** Supabase (Postgres, RLS, Edge Function), Expo SDK 57 / React Native, `react-native-purchases` (RevenueCat), node:test for `lib/*.test.ts`.

## Scope of this PR
In: tier table and limits (one source in TS, mirrored in SQL), `subscriptions` table, weekly invitation cap trigger, webhook function, purchase wrapper, paywall screen, upsell when the cap is reached, account entry, terms text.
Out (later PRs, each behind its own task): boosts, extended radius, advanced filters, streak protection, history window, group meetups, Pro badge.

## Global constraints
- UI Hebrew RTL, code and comments English, design tokens only, 48px touch targets, no `#hex`.
- Every new table: RLS in the same migration, explicit policies `to authenticated`, revoke from `anon`, no `service_role` in the app, no keys in the repo.
- Safety features (report, block, 18+ check) are never behind a tier.
- Auto-renew disclosure on the paywall: title, length, price, links to terms and privacy, restore purchases, how to cancel (Apple 3.8(b), Israeli consumer law).
- Commits in English with the `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>` trailer.

## Review focus
- A member cannot write or change their own `subscriptions` row (client cannot grant itself Pro).
- An expired or missing subscription means `free`; the cap applies to the sender only, counts invitations (not chat messages), uses a rolling 7 days.
- A deleted account removes the row (cascade).
- The paywall works with no products loaded (offline, agreement not active): shows a calm Hebrew message, never crashes.
- Old builds without the paywall keep working (the cap error is a clear message, not a crash).

## Task 1: Entitlements module (pure, tested)
Files: create `duofit/lib/entitlements.ts`, `duofit/lib/entitlements.test.ts`.
Produces: `type Tier = 'free'|'plus'|'pro'`, `TIER_LIMITS`, `tierFromProductId(id)`, `inviteLimitFor(tier)`, `invitesLeft(tier, usedThisWeek)`, `isPaidTier(tier)`, `PRODUCT_IDS`.
- [ ] Failing tests (limits 5/40/70, product ids map to tiers, unknown id is free, invitesLeft never negative).
- [ ] Minimal implementation, tests pass.
- [ ] Commit.

## Task 2: Database (DRAFT migration, applied only on the owner's "כן")
Files: create `supabase/migrations/20261115_subscriptions_foundation.sql`, `supabase/tests/rls_subscriptions_test.sql`.
- `public.subscriptions(user_id pk -> auth.users on delete cascade, tier in ('plus','pro'), product_id, status, is_trial, expires_at, updated_at)`; RLS: select own only; no insert/update/delete for `authenticated`; revoke all from `anon`.
- `private.current_tier(uid)`; `private.invite_limit(tier)`.
- Trigger `messages_invite_weekly_cap` (before insert on `messages`, only `kind = 'invite'`): count the sender's invitations in the last 7 days against the limit, error text `invite limit reached` with hint of the limit.
- Test file: member cannot insert/update/delete a subscription, can read own only, cap applies per tier, expired row means free, chat messages are not counted. Rolls itself back.
- [ ] Write the test first, run it without the migration (fails), then migration, run again, security advisors, then Supabase types check.

## Task 3: Webhook Edge Function
Files: create `supabase/functions/revenuecat-webhook/index.ts` (+ small pure helper tested in `duofit/lib` if needed).
- Auth: RevenueCat sends an `Authorization` header with a secret that is stored as a function secret (owner sets it, never in chat).
- Maps events (INITIAL_PURCHASE, RENEWAL, CANCELLATION, EXPIRATION, PRODUCT_CHANGE, BILLING_ISSUE) to the table with the service role inside the function. Never logs user ids.
- Deployed only on the owner's "כן".

## Task 4: App - purchases, paywall, upsell
Files: `duofit/lib/purchases.ts`, `duofit/hooks/useSubscriptionStore.ts`, `duofit/screens/subscription/PaywallScreen.tsx`, `duofit/src/app/paywall.tsx`, changes in the invitation screens, `AccountSheet.tsx`, `lib/termsText.ts`, `app.json` (no change expected).
- Install with `npx expo install react-native-purchases`, then Snyk dependency scan (CLAUDE.md).
- App user id = Supabase user id; the key is the public iOS SDK key from an env var (`EXPO_PUBLIC_REVENUECAT_IOS_KEY`), never a secret key.
- Screens are checked in the browser preview at 375px (purchases themselves only work in a real build).

## Task 5: Checks and PR
- [ ] `npx tsc --noEmit`, `npx expo lint`, `npm test`, all `supabase/tests/*.sql`, advisors, Snyk code + dependency scans, code review. PR text lists what was NOT verified (real purchase, webhook in production, device).
- Merge only on "תמזג". The owner-only steps stay: bank and tax in App Store Connect, RevenueCat account and keys, App Store Connect products.

## Owner steps in parallel (not code)
1. Bank + tax in App Store Connect (Paid Apps Agreement becomes Active).
2. Create a RevenueCat account (free) and send me nothing secret; the SDK key and webhook secret are entered by the owner.
3. Later: create the 4 products in App Store Connect (Claude can fill the forms once the agreement is active).
