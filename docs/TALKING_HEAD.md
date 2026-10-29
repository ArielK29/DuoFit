# Talking-head video rules (Reels / TikTok)

The owner's standing rules for editing every talking-head video of FitFriend. **Follow all five steps on every video, in this order.** The sixth section is the living rules list: when the owner corrects an edit, add the correction there, so the next video starts better.

Based on a workflow reel the owner shared (five steps). Skills used: `ghost-editor`, `ffmpeg-skill`, `shorts`, HyperFrames (all in `.claude/skills/`).

## The five steps

1. **Install ffmpeg and Whisper.**
   ffmpeg cuts the video; Whisper turns speech into text with word timings. Run `ghost-editor/scripts/doctor.sh` first. Do not install anything heavy without telling the owner.
2. **Find the failed takes and cut the silence.**
   Transcribe, find retakes (the same sentence said again, false starts) and keep only the best take of each sentence. Cut pauses together with the breath, not just the quiet part (see rules below). Report what was cut: number of retakes, seconds of silence, length before and after.
3. **Add subtitles, one word at a time.**
   Word-timed captions from the Whisper timestamps. The current word is on screen as it is spoken. Hebrew captions are right-to-left, inside the Instagram/TikTok safe area, and never cover the face. Check one rendered frame before delivering.
4. **Use Remotion for the animated captions.**
   Remotion (free) renders the animated word captions; the `shorts` skill has a Remotion render step. If Remotion cannot run, say so and use the `ffmpeg-skill` captions (ASS) instead.
5. **Write every correction into the rules.**
   Each edit the owner asks for becomes a line in the list below, with the date. Read the list before starting the next video.

## Standing rules (from the owner's edits)

- Cut pauses together with the breath (the inhale before the next sentence), not only the silence.
- Subtitles show one word at a time.
- Output is vertical 1080x1920. If the source is smaller, say so: it will look soft; ask for the original file.
- Keep the face centered in frame when cropping to 9:16.
- Whole reel is 18 seconds at most. The checklist animation is about 8 s for the list and transition plus 2.5 s end card, leaving about 7.5 s for the owner's own footage.
- In the checklist animation every line removes one word and adds one word, and the sentence must make sense both before and after the deletion.
- Never push raw or edited footage of a person to the public repo; save it in the session or a private place and ask first.

## Log of corrections

| Date | Video | Correction |
|---|---|---|
| 2026-10-28 | first test | Rules 1-5 above defined from the shared reel. |
| 2026-10-29 | checklist reel | Total 18 s. One word out, one word in on each line; line 4 ends with FitFriend; line 3 is a single struck word (לבטל) replaced by להגיע; line 2 is לקבוע קפה → אימון. |
