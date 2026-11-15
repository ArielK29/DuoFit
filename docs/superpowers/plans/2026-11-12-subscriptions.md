# Subscriptions (Plus / Pro) - plan

Status: DRAFT, nothing built. Owner decided the packages on 2026-11-12. Build only after "תבנה"; merge only after "תמזג".

## Packages (owner-approved structure, numbers can still be tuned)

| | Free | Plus (9.90/mo, 79/yr) | Pro (17.90/mo, 139/yr) |
|---|---|---|---|
| New invitations per week | 5 | 40 | 70 |
| Steps/runs history | 30 days | full, no comparisons | full + comparisons |
| Boosts per month | 0 | 1 | 4 |
| Search radius | normal | extended | widest |
| Advanced filters (level, availability, hours) | no | yes | yes |
| Streak protection (skip a day) per month | 0 | 1 | 2 |
| Host group meetups | join only | host 1 open meetup, up to 5 people | host 1 open meetup, up to 10 people |
| Profile badge | no | no | yes |

Rules: safety (report, block, 18+ check) is always free. Free trial: 3 days on the monthly products, 7 days on the yearly products (owner decision 2026-11-12; verify in App Store Connect that both durations are offered). A member gets only one introductory offer per subscription group. One subscription group "FitFriend" with 4 products (plus monthly/yearly, pro monthly/yearly) so members can switch tier.

## Facts found in the code (2026-11-12)
- `workouts` has exactly `host_id` + `guest_id` (two people). Group meetups of 5-10 people need NEW tables, so they are the biggest part. Build last, behind a switch (off until the owner has tested).
- No weekly "new invitation" cap exists today. Only chat anti-spam (30 messages per minute, 10 messages in a conversation before a reply). The weekly cap by tier must be added on the server.
- Streaks are computed on the phone from workouts (`lib/streaks.ts` `computeStreak`). Streak protection needs a small server table of protected days that the calculation takes into account.

## Phases
0. Owner (Apple, passwords are his): log in to App Store Connect with arielkorman7@gmail.com; accept the Paid Apps Agreement, bank and tax; create the 4 products and Sandbox testers. Claude never enters financial data.
1. Choice of purchase technology: RevenueCat or direct StoreKit (Expo docs for the project's SDK first; check RevenueCat price and terms). Decide with the owner. Install with `npx expo install`, Snyk dependency scan.
2. Database (RLS on every table, see CLAUDE.md): `subscriptions` (own row readable, written only by an Edge Function that receives Apple/RevenueCat notifications), tier function in a private schema, weekly invitation cap trigger, `boosts`, `streak_freezes`. Extend `supabase/tests/rls_smoke_test.sql`; security advisors must be 0.
3. App: Hebrew RTL paywall (price, period, auto-renewal text, restore purchases, links to terms and privacy, manage subscription link), upsell moments at the limit (invitation cap, history older than 30 days, boost, streak about to break), badge.
4. Features by tier: history window and comparisons, filters, radius, boost ranking, streak protection.
5. Group meetups (flag off): tables, host/join/cancel, caps by tier, safety (18+ only, report/block), notifications.
6. Legal and store: subscription terms and privacy update, account-deletion screen tells the member to cancel in Apple settings, App Store review notes. Legal review before public release (no lawyer yet).
7. Checks: unit tests, tsc, lint, Snyk code scan, sandbox purchase test on iPhone TestFlight, no live charges.

## Open decisions
- Final numbers (invitation caps 40/70, boosts 1/4) after real usage.
- Extra boost packs as one-time purchases (more revenue) - phase 2, not now.
- Android: Google Play Billing later, with the Play release.
