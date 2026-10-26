# FitFriend: Google Play plan (checklist A14), prepared 2026-10-23

Android is not part of version 1 (decision A-1a: iPhone only). This plan exists because Google's rule for new personal developer accounts has a long lead time, so the clock should start early and in parallel with the iPhone work. Nothing here is started; every step that costs money or creates an account is the owner's.

## 1. The rule that sets the schedule
A **personal** developer account created after 13 November 2023 must run a **closed test with at least 12 testers who stay opted in for 14 days in a row** before it can ask for production access (verified against Google's help page on 2026-10-20, see `docs/DECISIONS.md`). Recruit 15 to 20 people, because some will drop out. The 14 days start only when 12 are opted in, so recruit first, then open the test.

An **organisation** account (needs a D-U-N-S number and a registered business) is exempt. The seller is a private individual (decision A-1d), so the closed test applies.

## 2. What the owner has to do (nothing before the iPhone build is ready)
1. Create the Google Play Console account (one-time fee, about 25 dollars, **verify at sign-up**) and complete the identity check. Needs the owner's Google account and an ID.
2. Create the app "FitFriend" (name still open, see `docs/DECISIONS.md` item 4), Hebrew as the default language, free, category Health & Fitness.
3. Recruit 15 to 20 testers with Gmail addresses (family, friends, the sport groups the owner belongs to). Share the opt-in link Google gives for the closed test.

## 3. What Claude prepares, with no cost and no account
| Item | Status |
|---|---|
| Store texts (title, short and full description) | Drafted and length-tested: `docs/STORE-LISTING.md`, `lib/storeListing.test.ts` |
| Data safety form answers | Same answers as the Apple "App Privacy" section of `docs/STORE-ANSWERS.md`; re-checked against the code on 2026-10-23: three analytics events, no account id attached, JavaScript error reports, location read on the device only, deletion inside the app |
| Content rating questionnaire | Social features with user content, chat, no ads, no purchases: answers in `docs/STORE-ANSWERS.md`, section 1 |
| Privacy policy URL and account deletion URL | Public pages exist: `https://legal.getfitfriend.app/privacy.html` and `support.html` (Google also asks for a web page that explains how to delete the account and data; `support.html` has it) |
| Reviewer access | The two review accounts in `docs/REVIEWER-ACCOUNT.md` work for Google as well |
| Android build | `eas.json` has a `preview` profile with an APK and a `production` profile for the store bundle. **A build costs EAS quota and needs the owner's approval** |
| Google Maps key | Needed for the map on Android (`docs/MAPS-SETUP.md`); the owner creates it in Google Cloud and sets the EAS variable |

## 4. Steps, in order
1. Owner: Play Console account and identity check.
2. Claude: the Android build (with the owner's approval) and the store listing forms, filled by the owner from the prepared texts.
3. Owner: upload the build to the closed test track and send the opt-in link to the testers.
4. Wait until 12 testers are opted in; the 14-day clock runs.
5. Claude: answer the tester feedback, fix, upload new builds to the same track (a new build does not reset the clock).
6. After 14 days: apply for production access in the Play Console (a short questionnaire), then publish.

## 5. Known open points
- The Android pass is not finished (`docs/QA-RUN-2.md`): flows 2, 6, 8 and 9, the text-size check on the Samsung, TalkBack.
- The map needs the Google key; without it the Android map shows the "map did not load" message.
- The app name may change (`docs/RENAME-PLAN.md`); decide it before creating the Play listing, because the package name cannot change after the first upload (`com.arielk29.fitfriend`, decision A-1b).
