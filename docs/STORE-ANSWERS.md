# DuoFit: answers for the App Store Connect questionnaires (B16), draft of 2026-10-20

The owner answers the forms; this is the prepared list, written from what the app does today. Texts for the listing itself (name, subtitle, description, keywords) are in [STORE-LISTING.md](STORE-LISTING.md). Wording of the questions was read from Apple's page on 2026-10-20 (age ratings); re-check each question in App Store Connect, because Apple changes them. **Nothing has been submitted.**

## 1. Age rating
Apple's tiers now are 4+, 9+, 13+, 16+, 18+. Categories asked, with the proposed answer:

| Category | Answer | Why |
|---|---|---|
| Parental Controls | No | None built |
| Age Assurance | No | The terms say 18+, but no age check is built (a declared-age confirmation at sign-up is an option) |
| Unrestricted Web Access | No | No web view or browser inside the app; links open the phone's own apps (dialer, share sheet) |
| **User-Generated Content** | **Yes** | Posts with photos, comments, group chats; report, block, filter and removal exist |
| **Social Media** | **Yes (conservative)** | Profiles, a community feed, groups. Apple's definition decides; "Yes" avoids a later correction |
| **Messaging and Chat** | **Yes** | 1:1 and group chat |
| Advertising | No | No ads |
| Profanity or Crude Humor, Horror, Alcohol or Drugs | None | The app has no such content of its own; user content is covered by the UGC answer |
| Medical or Treatment Information | None | The terms say it is not a medical service |
| **Health or Wellness Topics** | **Yes** | Workouts, weight log, goals |
| Sexuality or Nudity, Violence, Chance-Based Activities | None | |

Expected result: **13+** (Social Media appears at 13+, Health or Wellness at 9+). Verify the final tier in App Store Connect. A higher tier than the terms' 18+ is not needed; the 18+ line stays in the terms.

## 2. App Privacy ("nutrition label"), per data type
"Collected" means sent off the phone. Nothing below is used for tracking and nothing is sold.

| Apple data type | Collected | Linked to the member | Purpose |
|---|---|---|---|
| Contact Info: Email Address | Yes | Yes | App functionality (sign-in) |
| Contact Info: Name | Yes | Yes | App functionality (profile) |
| User Content: Photos or Videos | Yes (only what the member uploads) | Yes | App functionality |
| User Content: Other User Content (messages, posts, comments, bio) | Yes | Yes | App functionality |
| Health & Fitness: Health (weight log) and Fitness (workouts, goals, plank record) | Yes | Yes | App functionality |
| Location | **No** | n/a | Read on the device only; not sent to the server |
| Usage Data: Product Interaction (three events: sign-up started, login succeeded, profile completed) | Yes | **No** (no account id is attached) | Analytics |
| Diagnostics (JavaScript error reports) | Yes | No | App functionality and stability |
| Identifiers: Device ID | **Verify** | No | The analytics library keeps a random id per installation. Declare it as "Device ID, not linked, analytics" unless PostHog confirms it is not one. This is the conservative answer |
| Contacts, Financial Info, Browsing History, Search History, Purchases, Sensitive Info | No | n/a | |

Tracking across other companies' apps and sites: **No**. Data encrypted in transit: **Yes** (HTTPS and WSS). Deletion: in the app ("My account", "מחק את החשבון שלי").
Third parties that receive data (for the policy, not the label): Supabase, Vercel (web), PostHog, map providers (`docs/OWNER-PREP.md`, section 3).

## 3. Export compliance
`ITSAppUsesNonExemptEncryption` is already `false` in `app.json`, so App Store Connect does not ask on every upload. The app uses only the standard encryption of the system (HTTPS) and no encryption of its own. If Apple asks, answer: uses standard encryption only, exempt. Israel needs no extra document for this.

## 4. Other forms
- **Content rights:** the app contains no third-party content except what members upload. Answer: no third-party content that needs a licence; members' content is theirs (see the terms, "התוכן שלך").
- **Advertising identifier (IDFA):** not used. Answer: No.
- **Support URL, marketing URL, privacy policy URL:** need the domain (`public/support.html`, `public/privacy.html` are ready; `SUPPORT_EMAIL` waits for the mailbox).
- **Sign-in information for the reviewer:** a real reviewer account (A9), credentials only in the App Store Connect field, never in this repository. Reviewer notes draft: `docs/APPLE-REVIEW-AUDIT.md`.
- **Version release:** recommended manual release, so the first public day is chosen after approval.

## 5. Screenshots (shot list, A11)
Apple requires screenshots for the largest iPhone display size and scales them down; confirm the exact pixel sizes in App Store Connect **(verify)**. iPad is off, so no iPad screenshots.
Take them from a real build with the reviewer account, **never** with the demo flag (it shows invented people). In this order, six screens:
1. Discover: a partner card (real second member).
2. Partner profile with the invitation button.
3. Chat with an invitation.
4. Community feed with a post.
5. Progress: weight chart and weekly goal.
6. Home: the week strip and the upcoming workout.
Dark theme and right-to-left are the product; no frames or captions are needed, short Hebrew captions are optional.

## 6. What still needs the owner
Approve this list (A10) and the texts (A-5c), provide the support address, run the real accounts for the screenshots, and answer the forms in App Store Connect after the Apple membership is active.
