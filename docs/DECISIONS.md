# DuoFit: decisions

Last updated 2026-10-17. Decisions that are made are listed once, with their date, so nobody asks again. Open decisions have a recommendation, what they block, and who acts. Prices and store rules marked **(verify)** were not checked against the provider today.

## Made

| Date | Decision | Notes |
|---|---|---|
| 2026-10-17 | Version 1: iPhone only, Hebrew only, no iPad, no payments | `supportsTablet: false`; checklist A-1a |
| 2026-10-17 | Bundle id and package `com.arielk29.duofit` | Cannot change after the first upload; A-1b |
| 2026-10-17 | Name `DuoFit`; category Health & Fitness, secondary Social Networking | Name must still be checked as free in App Store Connect; A-1c |
| 2026-10-17 | Seller is a **private individual**, not a registered business | Developer name in the store is the owner's legal name; no D-U-N-S needed; A-1d |
| 2026-10-17 | One-line honest description ("not a medical service; SOS only opens the dialer") | `docs/OWNER-PREP.md` section 1; A-1e |
| 2026-10 | Payments: subscriptions are sold only on the web (Polar); mobile apps give access only, with no price, upgrade button or link to checkout; DuoFit has no payments | Gmail agent; first priority after launch is free testers with `billing_enforced=false` |
| 2026-10 | Example data (verified marks, ratings, invented people) only behind `EXPO_PUBLIC_DEMO_DATA`, never in a build; venues show no promotions; match percent is computed from real data | `lib/demo.ts` |
| 2026-10 | The SOS button opens the real dialer (100 or 101) after a confirmation | Terms text says it does not replace emergency services |
| 2026-10-22 | The owner will not delete, lock or change the App Review accounts (`ariel.korman7@gmail.com` and `ariel.korman.7@gmail.com`) or the reviewer's password while Apple reviews | Decided by the owner, who left the choice to Claude with the aim of not failing review; A-4e |
| 2026-10-22 | Optional decisions: no push notifications in version 1; the missing leaked-password protection is accepted; a separate staging project is asked about again at launch | A13 (all three were decided earlier in October) |
| 2026-10-22 | Public release is manual: the approved version goes live only when the owner presses release | Decided by the owner, who left the choice to Claude; A-5g |
| 2026-10-22 | Nothing is sent to Apple (replies, submission) without the owner seeing it first; Claude prepares drafts | A-5f |
| 2026-10 | Real members only on the server; account deletion inside the app | Edge Function `delete-account` (Apple 5.1.1(v)) |
| 2026-10-18 | One brand: the pink and cyan "DF" monogram (app icon, splash and the logo inside the app) | The green in-app logo is retired; issue #105 |
| 2026-10-18 | **No remote push notifications in version 1**: local reminders only; revisit for 1.1 after testers' feedback | Issue #95 |
| 2026-10-18 | **Accept the missing leaked-password protection** for version 1 (8-character minimum and email confirmation stay on); revisit when the project moves to a paid plan | Issue #90 |
| 2026-10-18 | **No PostHog Session Replay at launch** | Issue #25 |
| 2026-10-18 | **Android after the iPhone version is approved**; before it: block SYSTEM_ALERT_WINDOW, Google Maps key, tile provider plan | B9 |
| 2026-10-18 | The policy drafts (retention, deletion, providers, privacy coverage; docs/OWNER-PREP.md section 3) go to the lawyer as they are | A-3b to A-3e; A12 is the review itself |
| 2026-10 | Mobile apps are built with Expo; the Gmail agent mobile app reuses its web page through Expo DOM components | Repo `gmail-agent-mobile` |

## Open

### 1. Domain (issue #88). **Needed before the store submission**
- **Question:** buy one domain now or later. The owner said "later, when the app is ready 100%".
- **Recommendation:** buy it as soon as the device pass starts, not after. It is the one thing that blocks four others: a public privacy-policy URL (the App Store form requires one), the support email (A4), real sign-up emails (custom SMTP, issue #86, the built-in sender is rate limited), and the Google verification for the Gmail agent.
- **Cost:** a domain is a yearly fee, usually in the range of a few tens of dollars **(verify at the registrar)**.
- **Names checked on 2026-10-20** (public registry lookup; "free" means no registration was found, confirm at the registrar before buying): **free:** duofit.fit, duofit.io, duofit.co, duofit.me, duofit.life, getduofit.com, trainduofit.com, joinduofit.com. **Taken:** duofit.com, duofit.app, duofit.net, duofitapp.com, myduofit.com, duofit.club. Recommendation: **duofit.fit** (short, says what it is) or **getduofit.com**; the support address then is support@ the chosen domain. A .co.il name needs an Israeli registrar and was not checked reliably.
- **Update 2026-10-22:** hold the purchase until the app name (item 4) is final; the checks above were for `DuoFit` names. Without a custom SMTP the email templates cannot be edited (Supabase blocks it), so the Hebrew sign-up and reset emails also wait for the domain.
- **Who:** the owner buys it (Claude does not buy). Claude then wires Vercel, Supabase URLs and the SMTP steps, and runs `npm run legal:build` after `lib/contact.ts` gets the support address.

### 2. Staging Supabase project (issue #100)
- **Owner's answer (2026-10-15):** yes, but not now; ask again at launch.
- **Recommendation:** set it up right after the first TestFlight build works and **before the first schema change that follows**, so that migrations are tried on staging first. Steps: second Supabase project, the same migrations in both, `staging` branch and `.env.staging`, separate EAS environment variables, Polar sandbox for the Gmail agent.
- **Cost:** a second Free-plan project is free but counts toward the Free-plan project limit **(verify)**.

### 3. Legal review of the terms and privacy text (issue #96, checklist A12)
- **Question:** who reviews the text before submission.
- **Recommendation:** a lawyer, before the first submission. The text is a draft that is true to the code today (`lib/termsText.ts`); drafts for retention, deletion and the provider list are in `docs/OWNER-PREP.md`. Items that need the owner's dashboards are marked verify there.

### 4. App name (raised by the owner 2026-10-22)
- **Question:** keep `DuoFit` or rename, because the app serves pairs and groups ("Duo" suggests two). The owner wants the name alone to explain what the app is.
- **Status:** open, the owner is thinking. **Do not buy the domain before the name is final.** Options looked at and the conflicts found are in `docs/RENAME-PLAN.md` (section 1); the leading candidates were `FlameMates` and `GritMates` (the owner liked the `StreakMates` style, which has near-identical existing apps). The store title can carry a Hebrew descriptor after the brand.
- **Cost of renaming:** about half a day, nothing paid, and cheapest now: no Apple payment, no first build, no store listing and no domain yet. The bundle id cannot change after the first upload (A-1b).
- **Who:** the owner chooses; Claude does the name check, then the rename (`docs/RENAME-PLAN.md`).

### 5. Gmail agent, separate list
Google verification of the restricted Gmail scope (a domain and a privacy page are required), the paid model before real customers, and deploying the app-return backend (gmail-agent issue 32) are tracked in the `gmail-agent` repository and in the "Gmail agent" appendix of `docs/APP-STORE-READINESS.md`.
