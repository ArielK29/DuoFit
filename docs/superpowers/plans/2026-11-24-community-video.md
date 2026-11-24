# Community videos (free-tier plan)

Status: DRAFT plan, 2026-11-24. Nothing built or applied. Build only after "תבנה"; apply any migration only after the owner says yes; merge only after "תמזג". Do not touch build 1.0.1 (waiting for Apple); this ships later as 1.0.2.

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development or superpowers:executing-plans. Read the `supabase` and `supabase-postgres-best-practices` skills before the database task (CLAUDE.md rule).

**Goal:** members can attach one short video to a community post, without paying for anything beyond the current Supabase Free plan, and with a kill switch if the free limits are reached.

**Architecture:** a new private storage bucket `post-videos` (size and mime limits), a `video_path` column on `posts` next to `image_path`, tap-to-play in the feed, per-member daily limit, automatic expiry of old video files, and a server flag that turns uploads off.

**Tech stack:** Supabase (Postgres, Storage, Edge Function for cleanup), Expo SDK 57, `expo-image-picker` (already installed, supports video), `expo-video` (new, install with `npx expo install expo-video`).

## The free-tier budget (the reason for every limit below)
Supabase Free (checked in search on 2026-11-24, from the official pricing page and third-party guides; confirm on supabase.com/pricing before launch): **1 GB file storage, 5 GB egress per month, 50 MB max upload per file**, a project is paused after one week of inactivity.
Today we use about **3.8 MB** (avatars 1.3 MB, identity videos 0.5 MB, post images 2.0 MB, measured on the project 2026-11-24).
A 10-second phone video, compressed, is about 2 to 4 MB (assumption, to be measured with real clips). With 3 MB per video:
- storage fits about **330 videos at once**;
- egress fits about **1,600 plays per month**;
- with a 14-day expiry, about **23 new videos per day** keep storage under the limit.
That is plenty for a first launch and a hard ceiling after that. Past it: turn the flag off, or the owner upgrades (Pro is about $25 a month, 100 GB storage, 250 GB egress; not needed now).

## Global Constraints
- UI text Hebrew (RTL), code and comments English. Design tokens only, 48px touch targets, no `#hex`.
- Every new table or bucket keeps RLS and explicit per-command policies `to authenticated` (CLAUDE.md rules 1 to 9). Bucket: per user folder, `file_size_limit` and allowed mime types set.
- Branch `feature/community-video` from up-to-date `main`. Commits in English with the `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>` trailer.
- No `service_role` in the app. No secrets in the repo.
- Run all of `supabase/tests/*.sql` after policy changes; security advisors must stay at the known baseline (only the leaked-password warning, Free plan).
- Snyk code scan after app changes and Snyk dependency scan after `package.json` changes (needs the owner's `snyk auth`).

## Decisions made (owner can change)
1. **One video per post, instead of an image** (a post has an image or a video, not both).
2. **Length at most 10 seconds**, picker limited to 10 seconds, a quality preset that keeps the file small, server file limit **8 MB**, mime `video/mp4` and `video/quicktime` only.
3. **Tap to play, no autoplay, no preloading** (saves egress; the feed stays fast). No thumbnails at first (a play card with the length); thumbnails need another native package and can come later.
4. **At most 3 new videos per member per day**, enforced by the server (a trigger), not only by the app.
5. **Expiry after 14 days**: the file is deleted by a scheduled cleanup, the post stays with the text "הסרטון הוסר אחרי 14 יום".
6. **Server kill switch**: flag `community_video_enabled` in `public.app_flags`, OFF at first; the upload policy checks it, so turning it off stops uploads at once even for old app versions. Owner says "תדליק".
7. **Who can post**: any signed-in member; when `identity_required` is ON the existing identity gate already covers posting, so only verified adults can upload.
8. **Approval before anyone sees it (owner requirement 2026-11-24: nothing offensive may be published; only content that harms nobody).** A new video is saved as `pending` and is visible ONLY to its author and to the reviewers. A reviewer approves it (it becomes visible to members) or rejects it with a ready reason (the file is deleted at once, which also frees storage). The same reviewers, review screen pattern and e-mail alert as the identity check are reused (`docs/IDENTITY-REVIEW-ARMY-PLAN.md`, stage 1). The existing report, block and "hidden after 3 reports" rules stay as a second layer. Deleting a post removes the file. A 10-second video takes a reviewer about 10 to 15 seconds, and the daily limit keeps the queue small.
   - **Honest limit:** no automatic tool is free and reliable for video, and a person can miss things. Pre-approval is the strongest free protection, but it cannot promise "harms nobody"; the terms must say what is not allowed and that videos are reviewed.
   - **Later, only after the lawyer:** an automatic content-safety scan (nudity, violence) as an assistant that flags videos for the reviewer. Free tiers of such services were NOT checked; sending member videos to an outside service needs the lawyer's yes (same gate as the identity video).

## Review Focus
- A `pending` or `rejected` video can never be read by another member (storage policy and post rows), only by the author and the reviewers; a signed URL for it must not work for others.
- A reviewer can approve or reject only through the review screen, and a member cannot approve his own video or change its status.
- A rejected video file is deleted at once and the post shows "הסרטון לא אושר" to its author only.
- A member cannot upload into someone else's folder, a wrong mime type, a file over 8 MB, or a fourth video in a day.
- With the flag OFF, no upload succeeds, and existing videos still play.
- A video of a blocked member or a post hidden by reports is not shown to the viewer.
- A failed upload leaves no post and no orphan file (same rollback as `createPost` for images).
- Expired files are deleted by the cleanup, and `video_path` is null only after the delete succeeded.
- Old app builds (no video support) still show a post that has a video without crashing.

## Task 1: Database (migration, owner yes needed to apply)
**Files:** Create `supabase/migrations/2026MMDD_community_video.sql`, `supabase/tests/community_video_test.sql`.
- [ ] Step 0: `list_extensions`: is `pg_cron` available, or is a dashboard schedule needed for the cleanup (Task 3)?
- [ ] Step 1: failing test: member cannot insert a post with `video_path` in another folder; cannot exceed 3 per day; flag OFF blocks upload policy.
- [ ] Step 2: add column `posts.video_path` (check: own folder, length 200) and `posts.video_status` (`pending` / `approved` / `rejected`, a member can only create `pending`; only reviewers (`private.is_admin()`) may change it, guarded by a trigger like `identity_checks_guard`), a reject reason column, `reviewed_by`, `reviewed_at`; the select policy on `post-videos` and on video posts lets other members see only `approved`; a trigger and Edge Function alert for new pending videos (same pattern as `notify-identity`); check that `image_path` and `video_path` are not both set; add bucket `post-videos` (private, 8 MB, mime list) with own-folder insert/select/delete policies, plus select for signed-in members for non-hidden posts; add `community_video_enabled` flag (OFF) and a trigger for the 3-per-day limit; security advisors and all tests.
- [ ] Step 3: commit.

## Task 2: App (needs "תבנה" for a build; code can be written and tested earlier)
**Files:** Modify `duofit/lib/pickImage.ts` (or a new `pickVideo.ts`), `duofit/lib/remoteCommunity.ts`, `duofit/screens/community/ComposeModal.tsx`, `duofit/screens/community/CommunityScreen.tsx`; create `duofit/lib/videoRules.ts` with a test.
- [ ] Step 1: failing tests for `videoRules` (length over 10 s refused, size over 8 MB refused, wrong type refused).
- [ ] Step 2: pick a video with `ImagePicker` (`mediaTypes: ['videos']`, `videoMaxDuration: 10`, low-quality export preset), validate, upload to `post-videos/<uid>/<id>.mp4`, insert the post; roll back the file if the insert fails.
- [ ] Step 2b: a reviewer screen "אישור סרטונים (מנהל)" in the account sheet (like `בדיקות אימות (מנהל)`): plays the video, buttons approve and reject with ready reasons; the author sees "הסרטון ממתין לאישור" until then.
- [ ] Step 3: feed shows a play card; tap opens `expo-video` playback; Hebrew texts for expired and failed videos; the video button hidden when the flag is OFF.
- [ ] Step 4: `npx tsc --noEmit`, `npx expo lint`, Snyk scans, check in the browser preview at 375px (the picker and playback on a device are NOT verifiable there; say so).

## Task 3: Cleanup of expired videos (owner yes needed to deploy)
Same pattern as the identity cleanup plan: an Edge Function with the service role deletes video files older than 14 days and sets `video_path` to null only if the delete succeeded; scheduled every day.

## Task 4: Documents
Update the terms (what may not be uploaded; videos are reviewed before they appear), the privacy text and store answers: the app now stores user videos (Apple privacy label "Videos" under User Content), retention 14 days. Add a question to the lawyer package: responsibility for videos uploaded by members, a reviewer who watches them, automatic scanning of harmful content and sending it to an outside service, record keeping.

## Out of scope for now
Automatic content scanning, video editing, comments on video timestamps, Reels-style vertical feed, thumbnails, live streaming.

## Not verified
Real file sizes of 10-second phone videos after compression (measure with 5 real clips before launch); the exact free-plan numbers on the day of launch; playback on a real iPhone.
