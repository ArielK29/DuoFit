# DuoFit: App Store readiness plan (two checklists)

Written 2026-10-16 from the code as it is today. "Verified" means read in the code or run on that day; everything else is marked **to verify**. This file is the canonical, versioned plan (agents read it); the owner works from a Hebrew copy on Google Drive with the same item numbers (A1.. = owner, B1.. = software). Earlier material: [RELEASE-READINESS.md](RELEASE-READINESS.md) (what was verified on 2026-10-11/12) and [RELEASE-CHECKLIST.md](RELEASE-CHECKLIST.md).

Goal: the first App Store release must pass Apple review the first time. Apple rejects for small things (a button that does nothing, a placeholder, a missing link), so every flow and every button is part of the plan (B8).

## Decisions already made
- **Payments (owner, 2026-10-16): subscriptions are sold only on the web.** The mobile apps give access to an existing account. DuoFit itself has no payments. For the Gmail agent mobile app: no price, no "upgrade" button and no link to the web checkout inside the app (Apple and Google steer in-app digital purchases to their own billing; showing plan status is fine). Reasoning: Apple takes a commission (15% through the Small Business Program for small developers, otherwise 30%; **to verify** the current terms before choosing in-app purchase) and the web checkout (Polar) already works. Rules differ by country and change: re-read App Review Guidelines 3.1.1 and 3.1.3 before submitting. Tracked in gmail-agent issue 31.
- **Order:** DuoFit first (no payments, simplest review), then the Gmail agent app.

## Verified state (2026-10-16)
| Area | State |
|---|---|
| Typecheck, lint, Snyk Code | pass (2026-10-12) |
| Snyk dependencies | 5 high findings, all transitive build/lint tooling, no fix available |
| Expo Doctor | 20/21: `expo` 57.0.26 and 7 other packages are behind their patch versions (`npx expo install --fix`) |
| RLS and security advisors | all 17 tables protected; only advisor warning: leaked-password protection (Supabase Pro) |
| Bundle id / package | `com.arielk29.duofit`, version `0.1.0`, `supportsTablet: false` (no iPad screenshots needed), dark only, export-compliance flag set |
| EAS | `eas.json` has development, preview, production; no Expo project linked, no build ever run |
| Account deletion inside the app | exists (account sheet, Edge Function `delete-account`) |
| Report and block for community content | exists (see terms text; **to verify** the UI on a device) |
| Terms and privacy text | in the app, reachable only from the sign-up screen; no contact address in the text |
| App on a real phone | Samsung (Expo Go) checked 2026-10-16: all tabs work; **iPhone not yet** |

## Rejection-risk findings (found by reading the code)
1. **The app icon, the Android icon and the splash image are still the default Expo template images** (blue "Λ"). Apple rejects placeholder icons (metadata/design guidelines) and it looks unfinished. The brand SVGs exist in `logo/`. The 1024 px icon also has an alpha channel (Apple requires none).
2. **A visible "coming soon" button**: choosing a venue shows an alert "scheduling a workout at a place will be available soon" (`PlacesView.tsx`). Apple's rules reject apps with unfinished or placeholder features (guidelines 2.1 and 2.2).
3. **"Forgot password" is not finished**: the app asks Supabase to send the reset e-mail, but there is no screen to set the new password (no `PASSWORD_RECOVERY` handling, no `updateUser`). A reviewer who tests it hits a dead end.
4. **Sign-up confirmation and reset e-mails open the Vercel web site, which is protected on purpose**: a new member lands on a Vercel login wall. They need a public page or a link that opens the app.
5. **Privacy policy, terms and a way to contact support are not reachable after sign-in** (only from the sign-up screen) and there is no public URL yet (App Store Connect requires a privacy policy URL and a support URL).
6. **Map**: on Android the map was empty (no Google Maps key in `app.json`); on iPhone the map is Apple Maps, so the dark Google style does not apply. A map that does not load is a visible failure.
7. **Packages behind their patch versions** (Doctor 20/21) and **no automated tests in the app**.

## A. Owner checklist (manual actions)
Order = what blocks the most. Costs are indicative; **verify** on the day.

| # | Action | Why / notes |
|---|---|---|
| A1 | Apple Developer Program account (yearly fee), Apple ID with two-factor; choose individual or organization | Nothing can be built for TestFlight or the store without it. Individual accounts show the owner's legal name as the seller |
| A2 | Decide the seller identity (individual or registered business) | Affects the Apple developer name, tax and, later, Polar payouts (gmail-agent issue 27) |
| A3 | Buy one domain (DuoFit issue 88) | Public privacy and support pages, support e-mail, custom SMTP, public web app, Google verification for the Gmail agent |
| A4 | Create the support e-mail (for example support@domain) and approve it as the contact in the terms | Apple needs a support URL; apps with user content need a published contact (guideline 1.2) |
| A5 | Expo account (free), then `eas login` and `eas init` in `duofit/` | Claude guides; the login is the owner's. The free plan has a build quota and a slower queue (**to verify**) |
| A6 | Create the EAS environment variables for preview and production (public keys only; list in RELEASE-CHECKLIST.md). **Never** `EXPO_PUBLIC_DEMO_DATA` | Builds read them |
| A7 | Supabase Authentication: Site URL and redirect URLs for the app link and the public pages; custom SMTP with the domain (Resend or similar) | Claude prepares the exact values; the dashboard login is the owner's |
| A8 | Test on a real iPhone with the QA flows ([QA-FLOWS.md](QA-FLOWS.md)); send screenshots of anything wrong | Android (Samsung) already passed the first round |
| A9 | Create 2 or 3 test members with sample data for screenshots, and one **reviewer account** (credentials only in App Store Connect review notes, never in the repo) | Real builds must not use demo data; empty screens make poor screenshots; Apple reviewers need to sign in |
| A10 | Approve the Hebrew store texts, the app name, subtitle and category, and answer the age-rating and privacy ("nutrition label") questionnaires in App Store Connect | Claude drafts every answer (B16); the forms are the owner's account |
| A11 | Take or approve the App Store screenshots (iPhone sizes currently required: **to verify** in App Store Connect) | Must show the real app |
| A12 | Legal review of the terms and privacy text by a lawyer (DuoFit issue 96) | Draft exists and is consistent with the code |
| A13 | Decide the optional items: leaked-password protection (Supabase Pro), real push notifications (issue 95), staging Supabase (issue 100) | Not required for the first release |
| A14 | Google Play Console account (one-time fee) for the Android release; a new personal account may need a closed test with a minimum number of testers for several days before production (the lesson video says 12 testers for 14 days: **to verify**) | Start early, it only needs time |
| A15 | Submission day: approve `eas build` and `eas submit` (Claude runs them only after approval), attach the build in App Store Connect, press Submit for review, answer the reviewer quickly | Apple review usually takes 1 to 3 days; plan one resubmission |

## B. Software checklist (Claude does these)
P0 = would fail review or blocks the release. P1 = quality that reviewers and users notice. P2 = polish.

| # | P | Action | Done when | Depends on |
|---|---|---|---|---|
| B1 | P0 | Replace the default Expo icon, Android adaptive icon (foreground, background, monochrome), splash and favicon with the DuoFit brand from `logo/duofit-icon.svg`. 1024 px icon without alpha and without rounded corners | Icons look right on a phone and in a build preview; no alpha | none |
| B2 | P0 | Remove or really implement the "coming soon" venue-scheduling button (wire it to the existing scheduling form, or hide it) | No placeholder text anywhere (search for "soon" and similar) | none |
| B3 | P0 | Finish password reset: deep link, new-password screen, `PASSWORD_RECOVERY` handling, errors in Hebrew | Request, e-mail, link opens the app, new password saved, can sign in | A7 (redirect URLs) |
| B4 | P0 | Sign-up confirmation: the link opens the app (or a public "confirmed" page); keep resend; a clear "check your mail" screen | A new member can register, confirm and sign in on a real phone | A3, A7 |
| B5 | P0 | In-app links after sign-in: privacy policy, terms and support (from "My account"); contact address in the terms; public pages for the same texts | Reachable in 2 taps from every signed-in screen | A3, A4 |
| B6 | P0 | Dependencies: `npx expo install --fix` (Doctor 21/21), re-run typecheck, lint and Snyk (Code and dependencies), record what remains | Doctor green; no new high finding | none |
| B7 | P0 | Release metadata: version 1.0.0, Hebrew primary language, review the `app.json` permission texts (photos, location, notifications) | Matches what the app really does | A5 |
| B8 | P0 | **Every button and every flow**: inventory of all 153 interaction handlers in 42 files by screen, a QA script ([QA-FLOWS.md](QA-FLOWS.md)), run it on Android and iPhone, fix what fails, repeat until a full pass | Zero failures on two phones, recorded in the QA file | A8 |
| B9 | P1 | Map: one consistent provider on both platforms, a Google Maps key for Android real builds, a plain failure message (done), test offline | Map shows on Samsung and iPhone | A5, Google Cloud key (owner) |
| B10 | P1 | Automated tests for the pure logic (dates, streaks, distance, validators, RTL helpers) and a CI step | Tests run in CI | none |
| B11 | P1 | Error and empty states per screen (design file 03-EDGE-CASES.md), offline behavior, double-tap protection, slow network | Checked per flow in B8 | none |
| B12 | P1 | Accessibility: labels for buttons and icons, contrast of pink buttons (photos were inconclusive), touch targets 48 px, large text | Checked on devices | A8 |
| B13 | P1 | Privacy manifest and required-reason APIs: check the generated iOS privacy manifest in the first EAS build (analytics SDK, storage) | Build log and manifest reviewed | A5 |
| B14 | P1 | Crash and error reporting plan (the error boundary exists; decide on a crash service) | A crash on a test phone is visible to us | A13 |
| B15 | P1 | EAS: profiles, a development build, then a TestFlight build; never a build or submit without the owner's approval | Build installed on the iPhone via TestFlight | A1, A5, A6 |
| B16 | P1 | Store package: Hebrew name, subtitle, description, keywords, promo text, release notes, support and marketing URL, privacy-label answers (email, name, photos, user content, usage data; location is not stored on the server), age-rating answers, review notes with the demo-account steps, screenshot plan | One document the owner copies from | A3, A9, A10 |
| B17 | P2 | Push notifications decision (local reminders already work), staging project, README for new developers | Owner decisions recorded | A13 |

## Apple guideline map (**verify against the current App Review Guidelines**)
2.1 app completeness (crashes, dead buttons, a working demo account) · 2.2 no beta or placeholder features · 2.3 accurate metadata and screenshots (no other brands, no misleading text) · 4.0 design, 4.2 minimum functionality · 5.1.1 privacy (policy link in the app and in App Store Connect, purpose strings for permissions, account deletion inside the app) · 1.2 user-generated content (terms, report, block, published contact, timely response) · 3.1.1 and 3.1.3 payments · 4.8 sign in with other services (not needed: e-mail and password only).

## Comparison with the lesson's own gap table (the teacher's agent report)
| Area | Teacher's app | DuoFit |
|---|---|---|
| Basic functionality | green | green on Android; iPhone pending |
| EAS and signing | red (no project id, no accounts) | same: no project linked, no accounts |
| Production environment | red | variables not created yet (A6) |
| Tests | 13 of 24 suites could not run | **none in the app** (B10) |
| Dependencies | Doctor 19/20 | Doctor 20/21 (B6) |
| Security | Snyk high findings | 5 high, transitive, no fix |
| Privacy and legal | policy draft, no links in app | text in the app but not reachable after sign-in, no contact (B5) |
| Account deletion | missing | **exists** |
| Store assets | none | drafts only (B16) |
| Icons | alpha channel, wrong adaptive icon | **default Expo icons** (B1, worse) |
| iPad | enabled, needs screenshots | disabled (good) |
| Store accounts | none | none (A1, A14) |
| Beta and review | none | none (B15) |

## Added from the lesson's reference checklist (teacher's App Store document, 2026-10-16)
The teacher's document is organized in five stages with "answers" boxes. Everything in it applies to DuoFit. These items were missing above and are now part of the plan (stage numbers match the Hebrew copy):

**Stage 1, product decisions to close first (owner answers, one line each):** scope of v1 (iPhone only, Hebrew only, no iPad; sign-in and sign-up as they are; no payments); the bundle identifier (already `com.arielk29.duofit`, cannot change after the first upload); app name, primary and secondary category (suggestion: Health and Fitness, secondary Social Networking: **to verify** availability of the name); who the seller is (individual or business); a one-line honest description of what the app does and does not do (it is not a medical service, SOS opens the dialer only).

**Stage 2, Apple accounts:** the membership is active (not only registered); the owner's role in App Store Connect is Account Holder, Admin or App Manager; **all updated agreements in "Agreements, Tax, and Banking" are accepted** (an unaccepted agreement can block uploads and releases); an organization account needs D-U-N-S verification and legal-entity details; two-factor authentication is on and the owner is present for it when needed; the bundle id and the App Store Connect API key are created only after the owner approves these external actions.

**Stage 3, legal, privacy and deletion:** the owner approves the final privacy policy and terms (today the public pages do not exist and the in-app text is a draft pending legal review, issue 96); a **data retention policy**: how long accounts, photos, messages, posts, reports, backups and audit logs are kept; the **deletion policy**: what is deleted, how fast, how the member is verified, how they get confirmation (Apple guideline 5.1.1(v)); the list of data processors named in the policy (Supabase, Vercel, the analytics service PostHog, Expo/EAS for builds, Google Maps or the map tile provider; email provider after the domain); the privacy policy must say what is collected, why, who gets it, how long, and how to ask for deletion or withdraw consent; a public support page and **who answers support while Apple reviews (support must be active during review)**; answers for content rights, ads (none), age rating and export compliance (flag already set).

**Stage 4, reviewer account and a real iPhone:** a dedicated App Review account that stays active during the whole review and contains no real member data; demo data so the reviewer can see every screen without waiting (profiles, a conversation, a scheduled workout, a post, progress); the credentials live in a password manager and in the App Store Connect review notes, never in the repo or in chat; at least one person with a real iPhone installs the build through **Internal TestFlight** (External TestFlight is optional and not required to submit); a commitment not to delete, lock or change the test account while Apple reviews.

**Stage 5, approvals during the work (Claude asks first, never acts alone):** create and link the Expo EAS project (an action in the owner's account); start EAS Build (it can use build quota or cost money); texts, screenshots and the App Privacy declarations; the exact TestFlight build that is submitted; sending the version to App Review; **any answer sent to Apple** (Claude drafts and shows it, nothing is sent without approval); public release only after Apple approves version 1.0.0 (suggestion: manual release, then optionally a phased release).

**Recommended order:** (1) today: stage 1 answers and check that the Apple membership is active; (2) legal review of the privacy policy, terms and deletion policy, in parallel with creating the clean App Review account and its demo data; (3) when the release candidate is ready: install it on a real iPhone through Internal TestFlight and run all QA flows; (4) last: approve the binary, the metadata, the submission and the public release. No technical external action (bundle id, App Store Connect record, EAS project) is taken before the values and approvals above are closed.

**Fields the owner fills (the "answers" box):** support e-mail · privacy policy URL · terms URL · account deletion URL (or the in-app path) · who answers support during review · the retention and deletion policy approved by (name, date).
