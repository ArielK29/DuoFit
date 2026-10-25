# UnityFit: store listing draft (Hebrew), for issue #12

Draft written on 2026-10-12 from what the app does today. **Nothing here has been submitted.** The owner reviews the wording, adds the screenshots and the privacy-policy URL (needs the domain, #88), then pastes it into App Store Connect and Google Play Console. Update the "data" tables whenever a feature changes what is collected.

## Texts

**App name (max 30):** `UnityFit`

**Subtitle, App Store (max 30):** `שותפים לאימון, קרוב אליך`

**Short description, Google Play (max 80):** `מצא שותף או קבוצה לאימון, קבע אימון משותף והתקדם יחד.`

**Promotional text, App Store (max 170):**
`אין עם מי להתאמן? UnityFit מחברת בין אנשים שמתאמנים באותה רמה, באותן פעילויות ובאותו אזור. שלח הזמנה, קבע שעה ומקום והגע.`

**Full description (max 4000):**
```
UnityFit היא אפליקציה לאנשים שרוצים להתאמן יחד.

מה אפשר לעשות:
• למצוא שותפים לאימון לפי פעילות, רמת כושר וקרבה
• לשלוח הזמנה לאימון משותף, לקבוע שעה ומקום, ולתעד נוכחות
• לשוחח עם שותפים ולהצטרף לקבוצות לפי תחום עניין
• לשתף בקהילה איך היה האימון ולעודד אחרים
• לעקוב אחרי יעד שבועי, רצף אימונים ומשקל
• להשתתף באתגר השבועי

בטיחות ופרטיות:
• אפשר לדווח על הודעה או פוסט ולחסום משתמש
• כפתור חירום פותח את החייגן עם מספר החירום, רק אחרי אישור
• את החשבון ואת כל הנתונים אפשר למחוק בלחיצה מתוך האפליקציה
• המיקום נקרא במכשיר בלבד ואינו נשמר בשרת

האפליקציה בעברית, בעיצוב כהה, מימין לשמאל.
```

**Keywords, App Store (max 100, comma separated):** `אימון,כושר,שותף לאימון,ריצה,חדר כושר,קבוצות,קליסטניקס,יוגה,רכיבה,מאמן`

**Category:** Health & Fitness (secondary: Social Networking)

**Support URL / e-mail / privacy-policy URL:** support `https://arielk29.github.io/duofit-legal/support.html`; privacy policy `https://arielk29.github.io/duofit-legal/privacy.html`; support e-mail `arielkorman7+unityfit@gmail.com` (see STORE-ANSWERS.md, section 4). The in-app terms and privacy text is `lib/termsText.ts`.

**What's new (first version):** `גרסה ראשונה של UnityFit.`

## Age rating (suggestion, the owner answers the questionnaires)
The app has user-generated content (chat, groups, community posts with photos) and meets strangers in person, with report and block tools.
- Apple: answer "user-generated content: yes" and "unrestricted web access: no"; expect **12+** or higher depending on the answers; Apple requires report/block and a way to contact the developer (both exist or are listed above).
- Google Play: IARC questionnaire, "users can interact / share content: yes"; no gambling, no sale of goods, no location sharing with other users. Expect **Teen / 12+**.
- The terms say the app is for adults (18+); if the stores force a lower minimum, keep the terms line and add an age confirmation at sign-up (not built).

## Data collected (Apple "privacy nutrition label" / Google "Data safety")
Answers as of today. "Linked" = tied to the member's account.

| Data | Collected? | Linked | Used for | Shared with others |
|---|---|---|---|---|
| E-mail address | Yes | Yes | Account, sign-in | No |
| Name | Yes | Yes | Profile shown to other members | Yes, to other members |
| Photos (profile, post images) | Yes (only what the member uploads) | Yes | Profile and community | Yes, to other members |
| Other user content (bio, messages, posts, comments, groups) | Yes | Yes | App function | Yes, to the people in the chat / group / feed |
| Health and fitness (weight log, goals, plank record, workouts) | Yes | Yes | App function (progress); the weight log is private to the member | Plank record: yes, weekly leaderboard; the rest no |
| Precise / approximate location | **No** (read on the device only) | n/a | Showing nearby partners and places | No |
| Usage data and diagnostics (PostHog events, crash reports) | Yes | No identifier is attached today (events are anonymous) | Analytics, app stability | No (processor: PostHog) |
| Contacts, financial info, browsing history, sensitive info | No | n/a | n/a | n/a |

Other answers:
- Data is encrypted in transit (HTTPS / WSS): yes.
- Members can delete their account and data in the app: yes (Edge Function `delete-account`); also needs a web URL or e-mail for deletion requests in the Google form (owner to provide).
- No tracking across other companies' apps and sites: no tracking.
- No ads, no data sale.

## Permission texts already in `app.json`
- Photos: "כדי לבחור תמונת פרופיל, UnityFit זקוק לגישה לתמונות שלך."
- Location (when in use): "UnityFit משתמשת במיקום שלך כדי להציג שותפים ומקומות אימון קרובים אליך."
- Notifications: the app asks for permission to show **local** notifications: a reminder 30 minutes before a shared workout (`lib/notifications.ts`, scheduled on the device, no push token, no server). Messages and invitations are shown inside the app only. No data-safety line is needed for a local reminder. If real push notifications are ever built (messages when the app is closed), add a push-token table with RLS, EAS push credentials and a data-safety line (issue #95).

## Screenshots (owner / device needed)
iPhone 6.7" and 6.1", Android phone. Suggested order: discover (partners), partner profile, chat with an invitation, community, progress, dashboard. Use a real test account with real photos; **never** turn on `EXPO_PUBLIC_DEMO_DATA` for store screenshots (it shows invented people).

## Not verified
- The wording has not been reviewed by a lawyer or by the owner.
- The label answers must be re-checked against the final build (new SDKs, new features).
