# DuoFit: App Store review audit (guidelines read from Apple's page on 2026-10-17)

The app checked against the guidelines that apply to it, with the wording quoted from [developer.apple.com/app-store/review/guidelines](https://developer.apple.com/app-store/review/guidelines/). Apple revises these; re-read before submitting. Draft of the notes for the reviewer is at the end.

## Summary
| Guideline | Status | Gap |
|---|---|---|
| 1.2 User-generated content: filter, report, block, contact | **3 of 4** | **No filter for objectionable material.** Contact address pending (A4) |
| 5.1.1(i) Privacy policy: link in the app and in App Store Connect, retention, consent withdrawal, third parties | Partly | Public URL needs the domain (A3). Text lacks the sentence about third parties giving the same protection |
| 5.1.1(v) Account deletion in the app | **Met** | None |
| 4.8 Login services | **Not applicable** | Email and password only, no Google or Apple login |
| 2.1 Completeness: working demo account, no placeholders, no crashes | Pending | Reviewer account (A9a to A9c), device test pass (A8) |
| 5.1.5 Location | **Met** | Purpose string in Hebrew; asked only while the app is open; not stored on the server |
| Privacy manifest | Inventory done | Confirm in the first build (B13) |

## 1.2 User-generated content (chat, groups, community posts with photos, profiles)
Apple requires: "A method for filtering objectionable material from being posted to the app", "A mechanism to report offensive content and timely responses to concerns", "The ability to block abusive users from the service", and "Published contact information so users can easily reach you".

| Requirement | In the app today |
|---|---|
| Filtering | **Missing.** Searched the code and the migrations for any blocklist or content check: none. Only anti-spam limits exist (messages per minute, posts per hour). **This is the most likely reason for a rejection that is not yet on the plan.** Proposal below |
| Report | Posts, comments and group messages, yes (`content_reports`). **One-to-one (private) messages: NO report button and NO block inside the chat; found 2026-10-20, built in migration `20261020_chat_block_and_report.sql` + app change, not applied until the owner approves.** Members can also be blocked from "My account"; the reporter sees it hidden at once; three reports hide it for everybody |
| Timely responses | **A person is needed.** Reports are stored, but nobody is notified and nobody is assigned. Decision for the owner (A-3f): who reads reports and how often. Minimum: a weekly look at the `content_reports` table; better, an email alert. Proposed routine and queries: [MODERATION.md](MODERATION.md) |
| Block | Yes: block and unblock from "My account"; blocking hides both ways |
| Contact | `SUPPORT_EMAIL` in `lib/contact.ts` is empty until the mailbox exists (A4); the privacy and support pages are ready |

### Proposal for the filter (small, honest, enough for review)
1. A short list of clearly abusive terms (Hebrew and English: slurs, sexual obscenities, threats), with normalisation (case, punctuation, repeated letters, niqqud) in `lib/contentFilter.ts` with unit tests.
2. The posting screens (post, comment, chat message, group name and description, profile bio and name) check it before sending and say in Hebrew why the text was not sent.
3. The same list enforced on the server by a trigger, so it also holds for anyone who talks to the API directly. Needs a migration, a test in `supabase/tests/` and the advisors check.
4. Reports remain the safety net for what a list cannot catch; the terms already say content can be removed and accounts closed.
Choices that are the owner's: the word list (false positives in Hebrew are real), and whether a blocked text is rejected or masked. Recommendation: reject with a clear message.

## 5.1.1(i) Privacy policy
Apple: the policy must "Identify what data, if any, the app/service collects, how it collects that data, and all uses", "Confirm that any third party ... will provide the same or equal protection of user data", and "Explain its data retention/deletion policies and describe how a user can revoke consent and/or request deletion".
- Collected data and uses: in the text. Retention: added (account lifetime; newest 200 notifications). Deletion: in the text and in the app.
- **Missing:** the third-party sentence. Suggested line for `lib/termsText.ts` after the lawyer agrees: "הספקים שלנו מחויבים להגן על המידע בדרגה זהה לזו שמתוארת כאן." The lawyer should confirm it is true for each provider.
- **Missing:** how to withdraw consent. Location and photos: the phone's Settings; deleting the account removes the rest. Add one line.
- The link in the app exists (account sheet, sign-up). The link in App Store Connect needs the domain.

## 2.1 and the reviewer
Apple: "include demo account info (and turn on your back-end service!) if your app includes a login". A built-in demo mode is allowed only "with prior approval by Apple", and DuoFit must never ship its demo flag, so the way is a real reviewer account.
- The account (A9a) must stay active during the whole review, with a complete profile, one conversation, one scheduled workout, one post and a progress entry (A9b), and its details are written in the App Review notes, never in the repository (A9c).
- Another real member must exist for the reviewer to find in Discover. Otherwise the Discover tab shows "no partners yet". A second account owned by the owner, with a profile, solves it.

## 4.8 and 5.1.1(v)
No social login, so 4.8 does not apply. Account deletion is in the app ("My account", "מחק את החשבון שלי", confirmed twice) and removes data and pictures from the server.

## Privacy manifest inventory (B13)
Read from `node_modules` on 2026-10-17: 16 packages ship a `PrivacyInfo.xcprivacy`. Required-reason API categories they declare: file timestamp (react-native, async-storage, expo-application, expo-file-system, react-native-maps), user defaults (react-native, expo-constants, expo-localization, expo-notifications, expo-system-ui), system boot time (expo-device), disk space (expo-file-system). Every one sets tracking to false where stated.
Packages with native iOS code and **no** manifest file: expo-image-picker, expo-location, expo-image, expo-font, expo-router, expo-linking, expo-splash-screen, react-native-reanimated, react-native-gesture-handler, react-native-screens, react-native-safe-area-context, react-native-svg, datetimepicker, slider and others. That is not proof of a problem, only that the check cannot be finished from the repository.
**How it is finished:** after the first EAS build, App Store Connect emails warnings (ITMS-91053 style) for any required-reason API used without a declared reason. Fix by declaring the reason in `ios.privacyManifests` in `app.json`. PostHog is JavaScript only and collects no account id (no `identify` calls).
The app's own data answers (email, name, photos, user content, health and fitness, usage data, diagnostics) are in `docs/STORE-LISTING.md`.

## Draft: notes for App Review (to paste into App Store Connect, no credentials here)
> DuoFit helps people find training partners. Sign in with the reviewer account given in the "Sign-in information" fields. The app is in Hebrew (right to left).
>
> How to see the main features: Discover (find a partner, filters, map of places), tap a member to see the profile and send a workout invitation; Chat; Community (posts, groups, weekly challenge); Progress (weight, goals); "My account" (top of the screen) has Block list, Terms and Privacy, Sign out and Delete my account.
>
> User-generated content: every post, comment and message from another member has a Report action (private one-to-one messages: only after migration 20261020_chat_block_and_report.sql is applied, do NOT send this note before that); members can be blocked and unblocked from "My account"; reported content is hidden for the reporter at once and for everyone after several reports; content that breaks the terms is removed and accounts closed. Support: <support email>.
>
> Location is used only while the app is open, to show nearby places and partners; it is read on the device and not stored on our server. Photos are used only for the profile picture and post pictures. The SOS button opens the phone dialer with 100 or 101 after a confirmation; it is not an emergency service.
>
> Account deletion: My account, then "מחק את החשבון שלי".
