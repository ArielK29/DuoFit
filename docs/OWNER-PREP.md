# DuoFit: prepared material for the owner's checklist (A-items)

Written 2026-10-17 from the code and the Supabase migrations in this repo. **Nothing here has been published, sent or entered anywhere.** Each section is a draft for the owner to approve, or for the lawyer (A12) to review. Facts marked **(verify)** could not be confirmed from the repo and must be checked in the named dashboard before anyone relies on them.

Related: [APP-STORE-READINESS.md](APP-STORE-READINESS.md) (the plan), [STORE-LISTING.md](STORE-LISTING.md) (store texts, label answers, age rating), `duofit/lib/termsText.ts` (the in-app terms and privacy text).

---

## 1. Stage 1 decisions: recommended answers (A-1a to A-1e)

| Item | Recommended answer | Why |
|---|---|---|
| A-1a Scope of version 1 | iPhone only, Hebrew only, no iPad (`supportsTablet: false`), sign-up and sign-in as today, **no payments** | Smallest surface for Apple review; matches the code |
| A-1b Bundle id | `com.arielk29.duofit` (already in `app.json` for iOS and Android) | Cannot change after the first upload |
| A-1c Name and category | Name `DuoFit`; primary category Health & Fitness, secondary Social Networking | Matches `STORE-LISTING.md`. Check the name is free in App Store Connect |
| A-1d Seller | Decision needed from the owner: **individual** (the legal name is shown as the developer; simplest and fastest) or **registered business** (needs a D-U-N-S number, takes longer, name of the business is shown). For a first version, individual is the usual choice; it can be moved to a company later but that is a transfer process | Affects the developer name in the store, taxes, and later Polar for the Gmail agent |
| A-1e One-line honest description | "DuoFit connects people who want to train together: find a partner, set a workout, chat and track progress. It is not a medical service; the SOS button only opens the phone dialer." | Matches the terms ("not a medical service") and the SOS behaviour |

---

## 2. Supabase Authentication values (A7)

Dashboard: Supabase, project `wtheyjuqpidgrgehplgw`, Authentication. The login to the dashboard is the owner's.

**URL Configuration, Redirect URLs** (add all of these; keep the existing web one):
```
duofit://reset-password
duofit://auth-confirmed
https://duofit-duofit-brown.vercel.app/reset-password
https://duofit-duofit-brown.vercel.app/auth-confirmed
```
When the domain exists (A3), add the same two web paths on the new domain and move **Site URL** to it.

Only while testing in Expo Go on a phone, also add `exp://**` and remove it before the public release (it is a wildcard).

**Why it matters:** without these entries Supabase ignores the return address the app sends and falls back to the Site URL, so the link in the email opens a website instead of the app (this is the "protected Vercel login page" finding in the plan).

**Email templates** (Authentication, Email Templates). The default templates are English. Hebrew drafts to paste, keeping the `{{ .ConfirmationURL }}` placeholder exactly as written:

*Confirm sign-up*, subject: `אימות האימייל ב-DuoFit`
```html
<div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.6;">
  <h2>ברוך הבא ל-DuoFit</h2>
  <p>כדי להשלים את ההרשמה, לחץ על הקישור:</p>
  <p><a href="{{ .ConfirmationURL }}">אמת את האימייל</a></p>
  <p>אם לא נרשמת ל-DuoFit, אפשר להתעלם מההודעה.</p>
</div>
```

*Reset password*, subject: `איפוס הסיסמה ב-DuoFit`
```html
<div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.6;">
  <h2>איפוס סיסמה</h2>
  <p>ביקשת לאפס את הסיסמה. לחץ על הקישור כדי לבחור סיסמה חדשה:</p>
  <p><a href="{{ .ConfirmationURL }}">בחירת סיסמה חדשה</a></p>
  <p>אם לא ביקשת איפוס, אפשר להתעלם מההודעה. הסיסמה לא תשתנה.</p>
</div>
```

**Custom SMTP** (Authentication, SMTP Settings): the built-in sender is rate limited and not meant for real users (`RELEASE-READINESS.md`). Needs a mail provider (for example Resend) and a domain with SPF and DKIM records. Suggested sender: name `DuoFit`, address `no-reply@<domain>`. Blocked on A3 (domain) and A4 (support mailbox).

**Known risk, not a bug in the app:** some mail programs open links automatically to scan them. A one-time link can then be "used" before the member clicks it and the app shows the "link expired" screen. The app handles it (plain Hebrew message, login and resend are one tap away). If testers report it often, the fix is to switch the templates to the token-hash form; that is a separate small change.

---

## 3. Policy drafts (A-3b to A-3f), for legal review (A12)

Hebrew, plain language, true to the code today. These feed the public privacy and terms pages and the answers in the store forms.

### A-3b. Retention policy (draft)

| Data | How long it is kept |
|---|---|
| Account, profile, picture | Until the member deletes the account |
| Chat messages, group messages, community posts, comments, likes | Until the member deletes the account (or the content is removed after reports or by the member where the app allows it) |
| Group chat history | A member sees messages from the moment they joined; a group is removed when its last member leaves |
| Weight log, goals, plank record | Until the member deletes the account; the weekly plank board keeps only the current week's best |
| In-app notifications | The newest 200 per member are kept, older ones are removed automatically |
| Shared workouts | Until a participant deletes their account; the other participant keeps the workout without the deleted person's details |
| Reports and blocks | Removed with the reporting member's account |
| Analytics events and error reports (PostHog) | Per the PostHog plan **(verify in PostHog, project settings)** |
| Database backups | **(verify in Supabase, Database, Backups; the Free plan may have none)** |
| Server logs (Supabase, Vercel) | Platform default **(verify)** |

### A-3c. Deletion policy (draft)

- **In the app:** "החשבון שלי", then "מחק את החשבון שלי". The member confirms; the server checks who is calling from their own session and removes the profile pictures and post pictures from storage, then the account; the database removes every row that belongs to the member (profile, conversations and messages, read markers, weight log, goals, plank record, posts, comments, likes, blocks, reports, notifications).
- **Speed:** immediate; the screen shows the result and signs the member out.
- **Identity check:** the member must be signed in to delete in the app. For a request by email (needed for the Google Play form and recommended for Apple's support page): reply must come from the account's registered address; no other proof is accepted. **Decision for the owner:** answer within a fixed number of days (suggestion: 30).
- **Confirmation:** the app shows a confirmation; no email confirmation is sent today. A confirmation email is an optional later improvement.
- **What stays:** a shared workout with another member remains for that member without the deleted person's details. Backups follow the backup policy above **(verify)**.

### A-3d. Service providers named in the text

| Provider | What it does for DuoFit | Data it sees |
|---|---|---|
| Supabase | Database, sign-in, picture storage, server functions | Everything the member enters in the app, stored in the project `wtheyjuqpidgrgehplgw`; region **(verify in Supabase project settings)** |
| Vercel | Hosts the web version of the app | Standard web request data (IP address, browser) |
| PostHog | Usage events (`signup_started`, `login_succeeded`, `profile_completed`) and error reports | Events and errors, sent to the EU host (`eu.i.posthog.com`); no account id is attached today. PostHog's SDK creates a random per-install id: **confirm in the PostHog dashboard whether it counts as a device id for the Apple label** |
| Expo / EAS | Builds the app and, later, sends it to the stores | No member data (build tooling) |
| Google Maps (Android) | Map tiles | The map area being viewed and the device's IP address; the member's location is not sent by DuoFit |
| CARTO map tiles (Android, only as a fallback if Google tiles do not load) | Dark map tiles | Tile requests with the device's IP address. **A production release needs a tile provider plan** (noted in `PlacesView.tsx`) |
| Apple Maps (iPhone) | Map | Handled by Apple |
| E-mail provider (planned, A7) | Sign-up and reset emails | Email address |
| Apple App Store / Google Play | Distribution | Per their own policies |

### A-3e. What the privacy text must say (coverage check against `termsText.ts`)

| Required statement | In the in-app text today? |
|---|---|
| What is collected (email, profile, messages, workouts, posts, weight and goals, notifications, reports) | Yes ("מה נשמר עליך ומי רואה אותו") |
| Why (to run the service) | Yes, briefly |
| Who it is shared with (other members as described; analytics service) | Yes; the **named** providers table above is not in the text yet |
| How long it is kept | **No.** Add from A-3b once approved |
| How to request deletion or withdraw consent | Deletion in the app: yes. Email request path: **no** (needs A4) |
| Location is read on the device and not stored on the server | Yes |
| Age limit (18+) | Yes |
| Contact for privacy questions | **No** (needs A4) |
| Not sold, no ads, no tracking across other companies' apps | "We do not sell" is stated; add "no ads and no tracking across other apps" |

### A-3f. Public support page (draft text)

> **DuoFit: תמיכה**
> שאלות, תקלות או בקשות? כתבו לנו: `<support email>` (נענה תוך `<N>` ימי עבודה).
> **מחיקת חשבון:** מתוך האפליקציה: "החשבון שלי", ואז "מחק את החשבון שלי". אפשר גם לבקש במייל מהכתובת שאיתה נרשמתם; נמחק תוך 30 יום.
> **דיווח על תוכן או משתמש:** מתוך האפליקציה, בלחיצה על "דווח" ליד ההודעה, הפוסט או המשתמש.
> **מצב חירום:** DuoFit אינה שירות חירום. במצב חירום חייגו 100 או 101.

Decision for the owner: who answers during Apple's review (A-3f / A-4e). Blocked on A3 and A4 for the address.

---

## 4. Store questionnaires (A10) and store texts (A-5c)

Already drafted in [STORE-LISTING.md](STORE-LISTING.md): name, subtitle, descriptions, keywords, category, age rating suggestion, and the privacy label and Data Safety tables. Two corrections found while reading it against the code today:

1. The analytics row says "no identifier is attached". The SDK does keep a random anonymous id per install; confirm in PostHog and, if it is a stable device id, answer the Apple label as "Identifiers: Device ID, not linked to the user, used for analytics".
2. Public-facing text should name the providers (section 3, A-3d).

The owner still answers the forms; Claude only drafts.
