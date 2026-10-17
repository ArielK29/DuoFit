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
| 2026-10 | Real members only on the server; account deletion inside the app | Edge Function `delete-account` (Apple 5.1.1(v)) |
| 2026-10 | Mobile apps are built with Expo; the Gmail agent mobile app reuses its web page through Expo DOM components | Repo `gmail-agent-mobile` |

## Open

### 1. Domain (issue #88). **Needed before the store submission**
- **Question:** buy one domain now or later. The owner said "later, when the app is ready 100%".
- **Recommendation:** buy it as soon as the device pass starts, not after. It is the one thing that blocks four others: a public privacy-policy URL (the App Store form requires one), the support email (A4), real sign-up emails (custom SMTP, issue #86, the built-in sender is rate limited), and the Google verification for the Gmail agent.
- **Cost:** a domain is a yearly fee, usually in the range of a few tens of dollars **(verify at the registrar)**.
- **Who:** the owner buys it (Claude does not buy). Claude then wires Vercel, Supabase URLs and the SMTP steps, and runs `npm run legal:build` after `lib/contact.ts` gets the support address.

### 2. Real push notifications (issue #95)
- **Question:** send messages and invitations when the app is closed?
- **Today:** only local reminders (30 minutes before a shared workout and when an invitation is answered). Messages show inside the app.
- **Recommendation:** **not in version 1.** Ship with local reminders, ask testers whether they miss push, decide for 1.1. Real push needs: Apple and Google accounts in EAS, push credentials, a push-token table with RLS, a Data Safety line and an updated privacy text.
- **Note:** `expo-notifications` already adds the iOS push entitlement; that is allowed without using push.

### 3. Staging Supabase project (issue #100)
- **Owner's answer (2026-10-15):** yes, but not now; ask again at launch.
- **Recommendation:** set it up right after the first TestFlight build works and **before the first schema change that follows**, so that migrations are tried on staging first. Steps: second Supabase project, the same migrations in both, `staging` branch and `.env.staging`, separate EAS environment variables, Polar sandbox for the Gmail agent.
- **Cost:** a second Free-plan project is free but counts toward the Free-plan project limit **(verify)**.

### 4. One logo (issue #105). **Needed before screenshots (A11)**
- **Question:** the app icon and DESIGN.md use the pink and cyan "DF" monogram; the logo inside the app is green and white.
- **Recommendation:** (a) the pink and cyan monogram, because it matches every screen and DESIGN.md. Claude then redraws the in-app logo to match. Apple compares the listing with the app, so one brand.
- **Alternative:** (b) the green logo; then the whole palette needs a decision.

### 5. Leaked-password protection (issue #90)
- **Question:** it checks passwords against known leaks, and is a paid-plan feature (Supabase Pro).
- **Recommendation:** accept for version 1 (8-character minimum, email confirmation on) and revisit when the user count grows or the project moves to a paid plan anyway.

### 6. Legal review of the terms and privacy text (issue #96, checklist A12)
- **Question:** who reviews the text before submission.
- **Recommendation:** a lawyer, before the first submission. The text is a draft that is true to the code today (`lib/termsText.ts`); drafts for retention, deletion and the provider list are in `docs/OWNER-PREP.md`. Items that need the owner's dashboards are marked verify there.

### 7. PostHog session replay (issue #25)
- **Recommendation:** do not enable it at launch. It records screens, including chats and photos, which the privacy text and the store privacy label would then have to cover. Revisit after launch with a clear reason.

### 8. Android timing
- **Question:** when to publish on Google Play.
- **Recommendation:** after the iPhone version is approved. A new personal Play account may need a closed test with a number of testers for some days before publishing **(verify the current rule in Play Console)**. Before the Android release: block `SYSTEM_ALERT_WINDOW` in the manifest, set a Google Maps key, check the tile provider plan (`docs/APP-STORE-READINESS.md`, B9).

### 9. Gmail agent, separate list
Google verification of the restricted Gmail scope (a domain and a privacy page are required), the paid model before real customers, and deploying the app-return backend (gmail-agent issue 32) are tracked in the `gmail-agent` repository and in the "Gmail agent" appendix of `docs/APP-STORE-READINESS.md`.
