# DuoFit: QA run 2 (device pass, Expo Go), started 2026-10-20

Second pass of checklist item B8 (see [QA-FLOWS.md](QA-FLOWS.md)), done together with the owner: Claude gives one flow at a time, the owner runs it on the phone and reports OK or FAIL (with a screenshot). Build: Expo Go on the owner's phones, real server, no demo flag. Every FAIL becomes a fix and a re-run. Results are for the phone named in the column; "not run" means not run yet.

| # | Flow | iPhone | Android (Samsung) | Notes |
|---|---|---|---|---|
| 3 | Sign in, sign out | OK | not run | Signed out from "My account", signed in again; home screen shows |
| 4 | Wrong input | OK | not run | Empty fields and `abc` give "הזן כתובת אימייל תקינה"; wrong password gives "אימייל או סיסמה שגויים"; password `123` at sign-up gives "הסיסמה צריכה להכיל לפחות 8 תווים". With the keyboard open on the login screen the logo is pushed up and partly cut (look again in flow 21) |
| 5 | Forgot password | OK | link reached the app, final step not done | iPhone: request, e-mail, link, new password, signed in; the server confirmed the link and the password change. Android first showed "link not valid" because the app missed the link address: fixed in PR 146 (verified there with a test link) |
| 16 | Progress | OK | not run | Weight logged and shown (82.0 kg), goal edited and shown on Home, scrolled to the end: the sticky "רשום משקל" button covers nothing, cards open without errors |
| 17 | SOS | OK | not run | Opens the "מצב חירום" dialog (100 police, 101 MDA, cancel) that says the call starts only after pressing dial; cancel does nothing; 101 opens the dialer with the number, the call was not placed |
| 7 | Discover | OK (empty state only) | not run | Filter chips (age, distance, activity) and "all" respond, pull to refresh works, empty state "אין שותפים קרובים" shown. Only one real member exists, so results that follow the filters need the reviewer/companion accounts (A9) |
| 14 | Community | OK (post, like, comment, delete, content filter) | not run | Posted, liked, commented and deleted a post; a post with a blocked word is refused with "לא ניתן לפרסם: הטקסט כולל ביטוי שאינו מותר ב-DuoFit". Not run yet: photo post, groups, group chat, weekly challenge, plank timer |
| 15 | Notifications | OK (empty list) | not run | Bell opens the notifications screen, back works; no notifications yet, so counts and links need real invitations |
| 20 | Connectivity | OK | not run | Airplane mode: the "אין חיבור לאינטרנט" banner appeared, the tabs showed their last data or a message with no endless spinner, and the banner went away after airplane mode was turned off |
| 22 | Cold start | OK (3 openings) | not run | Force closed and opened three times: each opening took under a second in Expo Go. Not run: opening from a notification (needs a build) |
| 21 | Layout (large text part) | **FAIL at the maximum text size** | not run | iPhone with the accessibility text size dragged to the maximum (about 3x): titles break into one letter per line ("קהילה", "התאמות"), "צ'אטים" is cut, the week strip numbers on Home are cut, progress cards wrap letter by letter. (First recorded as OK by mistake: the screenshots were read after the owner said everything was fine.) Fix planned: cap font scaling; re-run at the maximum size and at a mid-large size |

Found and fixed during this run: the reset and confirm links did not reach the screen on Android Expo Go and when the app was already running (PR 146).
