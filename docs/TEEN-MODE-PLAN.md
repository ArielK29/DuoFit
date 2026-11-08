# FitFriend: teen mode (15 to 17), plan written 2026-11-03, minimum age 14, then 13 (2026-11-04), now 15 (2026-11-08)

**Status: PLAN ONLY. Nothing here is built or switched on.** The app stays 18+ for everyone until a lawyer has approved this plan
(questions at the end) and the owner turns the switch on. Decision by the owner on 2026-11-08: the minimum age is **15** (it was 13 and 14 before), built in the safest way, with
stricter rules because of the cases of violence in the last year (section 6).

## 1. Principles
1. **Two separate worlds.** Teens (15 to 17) and adults (18+) never see each other: not in matches, not in groups, not in the feed, not in chat.
   The wall is enforced by the **database** (policies), not only by the app.
2. **Teens meet teens close to their age.** Matching only within **1 year** older or younger (the strictest of the options discussed).
3. **Less open for teens.** No free-text places (only the venue list), no photos in chat, no posting to the public feed, no exact distance,
   groups only the teen groups. Reports and blocks work the same as for adults.
4. **A parent says yes first.** A teen cannot use the app until a parent has approved by e-mail (token link). The parent can withdraw it at any time.
5. **The identity check stays** (birth date, face photo, short video): the approved birth date decides the world.
6. **Off by default**, behind a switch in `public.app_flags` (like `identity_required`), switched on only after legal approval.

## 2. What changes where
| Area | Change |
|---|---|
| Database | `private.age_group(user)` from the approved `identity_checks.birth_date` (`teen` / `adult`); every policy that shows another member checks `age_group` equality and, for teens, the 1-year band; `parental_consents` table (RLS, written by an Edge Function only); teen limits in the chat/post/group policies. Tests in `supabase/tests/rls_teen_test.sql`. |
| Edge Function | `parent-consent`: sends the e-mail to the parent, stores the decision; `delete-account` also removes the consent record. |
| App | Sign-up asks the birth date first; under 18 shows the parent-consent step and a waiting screen; teen UI hides free-text place, photo in chat, feed posting; venue picker restricted to the list. |
| Texts | Terms and privacy notice: new section for under-18s and parents; store answers (age rating, data safety). |
| Moderation | Reports about teens go first in the queue (`docs/MODERATION.md`); stricter content filter for teen chat. |

## 3. Order of work
1. **Legal first** (owner): lawyer answers the questions below. Without them nothing below goes public.
2. Schema and tests behind the switch (applied with the owner's yes, switch OFF).
3. App changes (teen flow), unit tests, QA flows for a teen account and an adult account that must never see each other.
4. Test with **adult** testers only, using two test accounts whose birth dates make one a teen (never real minors).
5. Apple and Google forms (age rating, data safety). Apple review of the build.
6. Owner turns the switch on, only after the lawyer's written okay.

## 4. Questions for the lawyer
1. What does Israeli law require to let a 13 to 17 year old use a social/matching service (parent consent, form, age verification)?
2. Is an e-mail approval link from the parent enough, or is a stronger proof of parenthood needed?
3. Are there extra duties because the service puts members in contact (meeting in person)? Our limits: teens meet only teens within 1 year, public venues from a list, no private photos, reports and blocks.
4. Data of minors: what may we keep, how long, and must a parent be able to see and delete it?
5. If the app is later released outside Israel (EU, UK, US), what changes (age of digital consent 13 to 16, COPPA below 13)? Release stays Israel-only meanwhile.
6. Wording of the terms and privacy notice for under-18s.

## 4b. Why 15 and not lower
The owner decided on 2026-11-08 that the minimum age is 15 (13 is the line of the US children's privacy law COPPA and the lowest age the stores accept, but meeting in person is a bigger risk than chatting, so the app waits until 15). Below 15 the app stays closed: the birth date check refuses it, and no data is kept. Teens 15 to 17 live only in the teen world (1-year age band, no adults), and only after the lawyer approves.

## 6. Decision of 2026-11-08: who may start a meeting, and the stricter rules
- **Who starts a meeting:** every teen aged 15 to 17 may send a meeting invitation (as in the draft: no difference inside the teen world). No change in the code was needed for this.
- **The owner's list of rules to keep for every teen meeting:**
  1. Only public places from a fixed list, no free-text address.
  2. Only teens with teens, at most one year apart.
  3. Report and block always available.
- **The parent's approval by e-mail before any use** (section 1, point 4) was in the first list and is **not** in the owner's list of 2026-11-08. It stays in this plan until the owner says explicitly to remove it, and the lawyer is asked (question 2) whether Israeli law requires it for 15 to 17.
- **Stricter rules because of the violence of the last year, proposed (the owner chooses which):**
  - Meetings only in daylight hours (for example 08:00 to 20:00) and not on school nights late.
  - The first meeting with a new contact only after a cooling-off period (for example 24 hours after the first chat).
  - A short "I arrived" and "I got home safe" step, and the SOS button (100/101) on the meeting screen.
  - Each parent is told by e-mail about every meeting (place, time, who), if the parent consent is kept.
  - A weekly limit on meetings, and no meeting with somebody who was reported.
  - Reports about teens go to the top of the moderation queue and are handled within hours.
- None of this is built or switched on. The migration (`20261104_teen_mode_DRAFT.sql`) is not applied and `teen_mode` is OFF.

## 5. Until then
- Public builds and TestFlight testers stay **adults only** (the 6 testers must be 18+).
- The sign-up check still requires 18+; no code in this plan is active.
