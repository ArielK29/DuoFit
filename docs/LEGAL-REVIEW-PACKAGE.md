# FitFriend: package for the lawyer (checklist A12), ready to send

Everything the lawyer needs in one place. **Nothing here is legal advice.** The owner sends it; Claude does not contact anyone.

## 1. Cover message (Hebrew, edit the name and send)
> שלום [שם עורך הדין],
> אני מפתח אפליקציה בשם FitFriend (שותפים לאימון, בעברית, לאייפון, ובהמשך לאנדרואיד), ורוצה לעבור איתך על הטקסטים המשפטיים לפני ההגשה לחנות של Apple. אני עצמאי (אדם פרטי) ולא חברה רשומה.
> מצורפים: (1) תנאי השימוש ומדיניות הפרטיות כפי שהם באפליקציה ובדף ציבורי, (2) טיוטות למדיניות שמירה ומחיקה, רשימת ספקים וסיכום מה נאסף, (3) תיאור התכונות שמעלות סיכון (פגישות פנים אל פנים בין משתמשים, תוכן משתמשים, מעקב משקל).
> אשמח להערות, ולהצעת מחיר ולוח זמנים לבדיקה. ההגשה לחנות ממתינה לבדיקה.
> תודה, אריאל קורמן

## 2. What to attach
| File | What it is |
|---|---|
| `duofit/public/privacy.html` (or the text in `duofit/lib/termsText.ts`) | The terms and the privacy policy, the text members see |
| `docs/OWNER-PREP.md`, section 3 | Drafts: retention, deletion, service providers, the privacy-coverage check |
| `docs/STORE-ANSWERS.md`, section 2 | What data is collected, linked to the member, and why (the Apple "privacy label") |
| `docs/APPLE-REVIEW-AUDIT.md` | What Apple's guidelines require (content filter, report, block, contact, deletion, privacy policy), and the gaps |

## 3. What the app does (so the lawyer need not ask)
- Sign-up with e-mail and password; profile (name, photo, gender, fitness level, favourite activities, short bio).
- Finds other members nearby, sends workout invitations, chats (1:1 and groups), community posts with photos and comments, weekly challenge, weight log and goals.
- **Members meet in person.** The terms say so and give safety advice; SOS only opens the phone's dialer (100 or 101) after a confirmation.
- **Location** is read on the phone only and is not stored on the server.
- **Moderation:** report, block, a word filter (app side; server side prepared), content removed after reports; contact address pending.
- **Account deletion** inside the app removes the data and the pictures.
- Providers: Supabase (database, sign-in, storage), Vercel (web version), PostHog (usage events and error reports, EU host), map providers.
- **Adults only (18+)** in the terms. Build 1.0.1 (written, not released) adds the check: birth date at sign-up, a profile photo with the face, and a 5-second live video with a head turn, a random gesture and a random 3-digit number said aloud. The owner reviews the video in the app, approves or rejects, and the video file is deleted right after the decision (the server keeps the decision and the date). Until approved, a member cannot see members, chat, post or join groups (enforced by database rules). Changing the profile photo requires a new check. See `docs/SAFETY-OPERATIONS.md`.

## 4. Questions for the lawyer
1. Are the terms and the privacy policy enough for the Israeli **Privacy Protection Law** (including the amendment that took effect in 2025 **(verify)**) and for Apple's and Google's requirements? What must be added (for example the third-party protection sentence, how to withdraw consent, retention periods)?
2. **Registration of a database** (מאגר מידע) with the Privacy Protection Authority: is it required for this app? The weight log and fitness data are health-related.
3. Data kept on servers abroad (Supabase region, PostHog EU): what has to be said, and is anything else needed for transfers?
4. **Liability for in-person meetings** between members: is the wording in the terms ("בריאות ובטיחות") enough, and should there be an explicit confirmation at sign-up?
5. **Adults only:** is a declared-age confirmation at sign-up needed, given there is no age verification?
6. **Content and reports:** obligations when someone reports a post or a member (response time, removal, keeping records), and wording of the "we may remove content and close accounts" clause. Also: a member who reports a PRIVATE message makes it readable to us (the owner reads reported messages only); does the privacy text need a sentence about it?
7. A **private individual** as the seller in the store: obligations, and when to move to a company (also for the later paid Gmail agent).
8. Consumer and advertising rules that apply if the app later sells subscriptions (the plan today: no payments in the apps).
9. Does the terms' jurisdiction clause (Israeli law, Israeli courts) work for an app that Apple distributes under its own agreement?
10. **The identity video:** is a short face video (with sound) reviewed by a person and deleted after the decision acceptable under the Privacy Protection Law, or does it count as biometric data with extra duties (registration, consent wording, retention)? Should the video be kept for some days for safety investigations, or deleted at once (the app deletes at once today; one constant in `lib/remoteIdentity.ts`)?
11. **Minors:** what is the owner's exposure if a minor lies about the birth date, and what duties follow (take the account down, report)? Is the declared birth date plus the video review enough, or is stronger age assurance expected for an app that connects strangers in person?
12. **Reports and safety incidents:** duty to keep records, to cooperate with the police, and a time limit for acting on a report about a member who may harm others (see the procedure in `docs/SAFETY-OPERATIONS.md`).

## 5. After the review
Claude updates `duofit/lib/termsText.ts` with the changes, runs `npm run legal:build` (the public pages), and adds the support address. The word list and the content filter (issue #125) can be discussed in the same meeting.
