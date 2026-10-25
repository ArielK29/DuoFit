# UnityFit: QA flows (every button, every flow)

Used for checklist item B8 in [APP-STORE-READINESS.md](APP-STORE-READINESS.md). Run each flow on a real Android phone and a real iPhone (Expo Go first, then the TestFlight build). Mark each cell: OK, FAIL (with a screenshot and a one-line note) or n/a. A flow passes only when every step does what the expected column says, with no crash, no blank screen, no English text and nothing hidden under the notch, the keyboard or the tab bar. The release needs a full pass on both phones.

Setup: two test members (A and B) with a profile each, and one reviewer account; real build (no demo data). Phone language Hebrew, and one pass with the phone language English (RTL must still hold).

| # | Flow | Steps | Expected | Android | iPhone |
|---|---|---|---|---|---|
| 1 | Sign up | Open app, sign up with e-mail and password, read terms, accept | Terms open from sign-up; a "check your mail" screen; resend works | | |
| 2 | Confirm e-mail | Open the link from the mail on the phone | The app (or a public page) opens, then sign in works | | |
| 3 | Sign in, sign out | Sign in; open "My account"; sign out | Back to login; local data cleared; signing in again works | | |
| 4 | Wrong input | Empty fields, bad e-mail, wrong password, weak password | One clear Hebrew message each, no crash | | |
| 5 | Forgot password | Request reset, open the link, set a new password, sign in with it | Whole loop works; old password no longer works | | |
| 6 | Profile setup | Name, photo from the library (grant and deny), gender, level, activities | Saved; photo shows; denied permission gives a clear message | | |
| 7 | Discover | Partner list, filters (open, change, reset), pull to refresh, empty state | Results follow the filters; no hidden content | | |
| 8 | Partner profile and invite | Open a profile, send an invitation, cancel and resend limits | Invitation appears for the other member; limits explained | | |
| 9 | Places and map | Open the map, grant and deny location, tap pins, offline | Map loads or a plain message; no "coming soon" anywhere | | |
| 10 | Chat | New chat, send text, long text, rapid sends, receive on the other phone, unread marks | Messages in order, both directions, no duplicates | | |
| 11 | Report and block | Report a message, a post, a member; block and unblock from "My account" | Hidden for the reporter at once; confirmation shown; unblock works | | |
| 12 | Schedule a workout | Accept an invitation, schedule form, change date, cancel before start | Both members see it; reminders scheduled; cancel works | | |
| 13 | Check in | Open the workout window, check in, try outside the window | Check-in works only inside the window, clear message otherwise | | |
| 14 | Community | Post with and without a photo, like, comment, delete own post, join and leave a group, group chat, weekly challenge, plank timer | Every button responds; feed updates; limits explained | | |
| 15 | Notifications | Bell, list, mark read, open the target | Counts match; links open the right screen | | |
| 16 | Progress | Log a weight, edit goal, workouts card, steps and runs cards, charts, sticky button vs scrolling | Saved values appear in charts; nothing hidden under the sticky button | | |
| 17 | SOS | Open SOS, choose 100 or 101, confirm | Asks first, opens the dialer with the number, can be cancelled | | |
| 18 | Account deletion | "My account", delete, confirm twice | Account and data removed; cannot sign in again; the other member keeps the shared workout without your details | | |
| 19 | Permissions | Deny everything; revoke later in Settings; re-open | App stays usable; every denied feature explains how to enable it | | |
| 20 | Connectivity | Airplane mode in each tab; slow network; return online | A slim banner "אין חיבור לאינטרנט..." appears within about 40 s (two failed checks) and goes away within about 5 s of coming back; plain Hebrew message, no endless spinner, recovers by itself | | |
| 21 | Layout | Smallest and largest phone, large text size, landscape lock, keyboard over inputs | No overlap, no cut text, inputs stay visible | | |
| 22 | Cold start | Force close, open 5 times, open from a notification | Starts in under a few seconds, returns to the right place | | |

Interaction inventory (from the code, 2026-10-16): 153 handlers (`onPress`, `onChangeText`, `onValueChange`, `onSubmitEditing`) in 42 files. During B8, every handler must map to a step in a flow above; any handler without a flow gets a new row.
