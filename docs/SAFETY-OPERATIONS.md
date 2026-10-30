# FitFriend: safety operations (adults only, identity check, reports)

Written 2026-10-29 for the owner. The code is on branch `feat/safety-18plus`. **Nothing here is live yet** (see "Switch-on runbook").

## 1. What the member goes through (build 1.0.1)
1. Signs up and fills the profile.
2. **Identity gate** (nothing else opens until it is approved):
   - birth date (under 18 is refused, also by the server);
   - a profile photo with the face (this is what others see);
   - a 5-second front-camera video: look at the camera, turn the head right then left, show a random gesture and say a random 3-digit number aloud.
3. The owner sees it in the app: **My account, then "בדיקות אימות (מנהל)"**. Profile photo next to the video (opens in the phone's player; approval is blocked until the video was opened).
4. Approved: the member's app opens by itself and others see a "מאומת" badge on the member (the server only shows verified members at all). Rejected: the member sees the reason and can record again.
5. The video file is **deleted right after the decision**. The server keeps the decision, the date and the birth date (private, nobody else can read it).
6. Changing the profile photo later withdraws the approval and sends the member back to step 2.

## 2. How to review (about 30 seconds each)
Approve only when ALL are true:
- the person in the video looks like the profile photo (same face, not a photo of a screen);
- the video shows the asked gesture and the number shown on your screen is said aloud (the review card prints the number the member was given);
- the person looks like an adult. If in doubt, reject with "לא הצלחנו לאמת שהגיל מעל 18".
Reject with one of the ready reasons (the member sees it). Aim to answer within 24 hours; the member sees "בבדיקה" meanwhile.

## 3. What to do about a member who may be dangerous
1. A report arrives (the content is hidden after 3 reports; you read reports). Look at the context.
2. If it looks like grooming of a minor, threats, or stalking: **remove the member right away** (ask Claude to delete or block the account on the server) and keep the screenshots.
3. Serious or urgent: contact the police yourself (100, or the nearest station); do not promise anyone a result. Ask the lawyer (question 12 in the legal package) about record keeping and cooperation.
4. Write the date and what you did in a private log.

## 4. What this does NOT guarantee
No check makes meetings risk free. A real adult with bad intent can pass it. The video and number make fake or ready-made clips much harder, they do not detect AI automatically (no reliable tool exists; paid vendors are an option later, after the lawyer). The terms say this honestly.

## 5. Switch-on runbook (each step needs the owner's yes where marked)
The server part is built so it can go in **before** the new build: the rules sit behind a switch (`public.app_flags`, key `identity_required`) that is OFF after the migration, so build 7 and Apple's reviewer see no change.
1. **(owner's yes)** Apply `supabase/migrations/20261029_identity_verification_18plus.sql` with the Supabase MCP. Immediately run `supabase/tests/rls_identity_test.sql` (33 lines, all good) and the security advisors (0 findings). Deploy the updated `delete-account` function (it now also removes the identity video).
2. Approve the **reviewer account** and the team test accounts (SQL in the migration notes), so nobody is locked out when the switch goes on.
3. Add the owner as an admin: `insert into public.app_admins (user_id) values ('<owner id>');` and approve the owner's own account the same way.
4. Snyk: the owner runs `snyk auth`; then Claude runs the code scan and fixes findings of severity high or above.
5. Merge PR (owner says "תמזג", CI green).
6. **EAS build 1.0.1 (needs the owner's yes)**, install from TestFlight, then walk through QA flows 23 and 24 on a real iPhone: camera permission, 5-second video, upload size, review, approval opening the app, rejection, photo change, account deletion.
7. **Turn the switch ON** when 1.0.1 is live for members: `update public.app_flags set enabled = true where key = 'identity_required';` (OFF again with `false` if something goes wrong). From then on the server refuses contact from anyone not verified.
8. App Store Connect (owner clicks): age rating 18+, privacy label (add Audio Data and the birth date under Other Data; check Sensitive Info with the lawyer), review notes explaining the identity gate and giving the pre-approved reviewer account, then submit 1.0.1.
9. After 1.0.1 is approved and the lawyer has seen it: regenerate and push the public legal pages (`npm run legal:build`, then copy to the legal repo), and only then press Release.

## 6. Open decisions
- Keep the video for a limited time instead of deleting at once (lawyer, question 10).
- A paid liveness or AI-detection service when there are many members.
- An alert to the owner when a new check arrives (today: open the review screen daily; an e-mail or WhatsApp alert is a later improvement).
