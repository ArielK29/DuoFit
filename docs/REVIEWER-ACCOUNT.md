# DuoFit: the App Review account (checklist A9a, A9b, A9c, A-4e)

Apple's reviewer signs in and must see every screen with real data, without waiting for anybody. This is the routine. Claude prepared the data script and tested it; the accounts and the passwords are yours.

## What you need: TWO accounts, both yours
| Account | Used for | Suggested e-mail |
|---|---|---|
| **Reviewer** | The login that goes into the App Store Connect "Sign-in information" field | an address only for this, e.g. `review@<your domain>` or a new Gmail |
| **Companion** ("צוות DuoFit") | A real second member, so the reviewer sees someone in Discover, a chat and a shared workout | any address you own |

Both are real members created in the real app (no demo flag, no invented people). Say so in the review notes: "the second account belongs to the team".

## Status 2026-10-21
Both accounts exist (reviewer: ariel.korman7@gmail.com, "APP Review"; companion: ariel.korman.7@gmail.com, "צוות DuoFit"). The sample data was created by the real tests (a chat, a workout with both check-ins, a post from each, the plank record) and completed by hand (weight log for the reviewer, the companion's bio), so the seed script below was NOT run: it refuses when the two accounts already have a chat. It stays for a future clean pair of accounts.

## Steps
1. **Create both accounts in the app** (sign up, confirm the e-mail, finish the profile). Use a strong password for each. Claude never sees them: use a password manager (A9c) and never type them in a chat or a file in Git. The password helper that copies one to the clipboard without showing it is available on request.
2. **Fill the sample data:** tell Claude "the accounts are ready" and give the two e-mail addresses (addresses only, no passwords). Claude runs `supabase/seed/reviewer_demo_data.sql` with them. It fills both profiles (complete, so they find each other), a chat with two messages, a workout invitation that is already accepted (so a shared workout exists), one community post from each, and for the reviewer a weekly goal, four weigh-ins and a plank record. It refuses to run twice and refuses if an account is missing.
3. **Do it on the day you submit.** The shared workout is set two days ahead; Apple takes about one to three days, so the workout may be in the past when it is opened. That is fine (the screens still work). If you want a fresh one, send an invitation from the companion account in the app.
4. **Save the credentials (A9c):** in your password manager, and in the App Store Connect "Sign-in information" field and the review notes (`docs/APPLE-REVIEW-AUDIT.md` has the draft). Never in the chat, never in Git.
5. **Promise not to touch the account while Apple reviews (A-4e):** do not delete, lock or change either account, and do not change the reviewer's password until the review is finished.

## Check before submitting
- Sign in as the reviewer on a real iPhone (TestFlight build): Discover shows the companion; Chat shows the conversation; the schedule shows the workout; Community shows two posts; Progress shows the weight chart.
- Tap a message from the companion: the report / block menu opens (private chat report and block exist since PR 140).
- "My account" has the block list, terms, privacy, sign out and delete account (delete the reviewer ONLY after the review, with the companion's data).
