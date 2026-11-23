# Identity review that keeps working while the owner is in the army (from 2027-03-14)

Written 2026-11-23. **Plan only: nothing here is built, applied or switched on.** Every build needs "תבנה", every database change needs the owner's yes, every merge needs "תמזג", and the switch `identity_required` stays OFF until the owner says "תדליק".

## The problem
Today one person (the owner) approves every identity video, and until he does the member cannot see members, chat, post or join groups (`docs/SAFETY-OPERATIONS.md`). With the switch ON and the owner away from his phone for days, every new member waits, and most leave. There is also no alert when a check arrives (open decision in SAFETY-OPERATIONS section 6), so the queue can sit unnoticed.

## Principles
1. **A human decides; software only prepares.** This is a safety gate for in-person meetings. No reliable tool detects AI-made video, and a wrong approval is the costly mistake. Automation may speed up, may reject obvious technical failures, and may recommend. It does not approve alone (until a later, explicit owner decision after the lawyer).
2. **No single point of failure.** At least three trusted reviewers, so one person on a base without a phone does not stop sign-ups.
3. **Do not send face video to any outside service** (including an AI model) before the lawyer answers (questions 10 and 13 in `docs/LEGAL-REVIEW-PACKAGE.md`) and the Apple Face Data rule (Developer Program License Agreement 3.3.3(K), see `docs/superpowers/plans/2026-11-13-identity-hardening.md`, gap 4) is read.
4. **Switch ON only when the reviewers and the alert are ready**, never in the last weeks before enlistment, and only after a dry run with friends.

## Stages

### Stage 0: more reviewers (no code, needed before switch-on)
- The server already supports many admins: `public.app_admins` (rows inserted by SQL only, never by the app; `private.is_admin()`).
- Choose 2 or 3 trusted adults (family or close friends). Each one signs up in the app and passes the identity check first (approved by the owner), then Claude adds the row after the owner's yes.
- Give each reviewer the one-page rules from SAFETY-OPERATIONS section 2 (30 seconds per video, approve only when all three conditions hold, reject with a ready reason, if in doubt reject).
- They see faces and birth dates of members: ask each to agree in writing (a short message is enough) to keep it private and to use only the review screen. The lawyer should confirm what is needed (question 13).
- To verify before relying on it: what exactly `is_admin()` also opens (for example support requests and the admin bell). If it opens more than review, a separate reviewer role is a small migration.

### Stage 1: alert when a check arrives (small, owner yes needed)
- Same pattern as `supabase/migrations/20261107_support_notify_email.sql`: a trigger on a new `pending` row asks a new Edge Function (`notify-identity`) to e-mail every admin: "a new check is waiting (N waiting)". No names, no video, no link to the file.
- Optional: a reminder when any check has waited more than 12 hours (scheduled function, as in the cleanup plan).
- In the app: the admin button shows the number waiting (as `newRequests` does for support in `AccountSheet.tsx`).

### Stage 2: better experience for the waiting member (small)
- Honest text on the waiting screen: "בדרך כלל עד 24 שעות".
- A message when the decision arrives (a new notification kind, plus e-mail if the owner wants). Today the member only sees it by opening the app.

### Stage 3: reviewer assistant (recommendation only, after the lawyer)
Runs on the server when the video is uploaded and writes a note on the review card. A human still presses approve.
- Speech-to-text on the audio: was the 3-digit number said? (A clear miss can be rejected at once with "הקלט שוב", which costs the member only a retry.)
- Face present in the frames and similar to the profile photo (similarity score, not an identity decision).
- Low light, no head turn, screen-recording signs: flag.
- Approve stays manual. If the owner later wants auto-approve, only with: two independent signals passed, a random 20% still sent to a human, and the lawyer's written yes.
- Anything that sends the video to an outside model or vendor is blocked until Stage 3's legal gate (principle 3) is open. A local or self-hosted check on our own server is the safer first choice.

### Stage 4: paid identity vendor (only if volume grows)
Services such as Stripe Identity or Persona take over the whole check for a fee per check. Not verified: price, Israeli law fit, Apple fit, Hebrew support. Decide with real numbers after the lawyer.

## Capacity (rough, to be replaced by real numbers)
About 30 seconds per video. 50 new members a day is about 25 minutes of review a day; 200 a day is about 100 minutes. Three reviewers cover this. Please tell Claude the expected sign-ups per day at launch so the plan can be sized.

## Related gap to close before the army: removing a dangerous member
SAFETY-OPERATIONS section 3 says "ask Claude to delete or block the account". While the owner is away this path is slow. Decide who may trigger it and how (for example a trusted reviewer who can block a member from the review screen, logged). This is a separate small task.

## Decisions for the owner (Hebrew chat)
1. Who are the 2 or 3 trusted reviewers?
2. Target answer time (24 hours suggested) and what happens on Shabbat and holidays.
3. May Claude build Stage 1 and Stage 2 now (small, no outside services)?
4. Switch-on date for `identity_required` (suggested: well before 2027-03-14 and after a dry run, or only after the reviewers are active).

## What is not verified
Expected sign-ups per day; what `is_admin()` opens beyond review; legal rules for non-owner reviewers and for any outside analysis of face video; whether any automatic tool is accurate enough on Hebrew-speaking phone video. None of these was tested.
