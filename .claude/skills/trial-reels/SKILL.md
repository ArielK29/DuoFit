---
name: trial-reels
description: Turn one finished reel into test variants for Instagram Trial Reels (shown first to people who do not follow the account). Use when the owner says /trial-reels or asks for different versions of the same video to test which one works. Makes five variants with ffmpeg and a posting plan.
---

# trial-reels

One finished vertical reel in, five variants out. Each variant changes exactly one thing, so a difference in results can be traced to that change.

| # | Variant | What changes |
|---|---|---|
| 1 | `speed` | whole reel at 1.1x (audio pitch kept) |
| 2 | `shot` | new first shot: a 0.6 s punch-in zoom at the start |
| 3 | `warm` | warmer color grade |
| 4 | `text` | new on-screen hook text near the bottom |
| 5 | `song` | different music, mastered to -14 LUFS |

A talking-head reel can also get a "hook take 2" variant: the owner's second take of the opening sentence (use ghost-editor's take picker; this script cannot do it).

## Run

```bash
bash .claude/skills/trial-reels/scripts/trial_reels.sh <input.mp4> <out_dir> "<hook text>" [song1.mp4|mp3] [song2 ...]
```

- `<hook text>` is Hebrew text for variant 4 (rendered with Playwright, so right-to-left is correct).
- Songs are optional: pass files you have the rights to (the session's own generated tracks in `reels/out/final-music-*.mp4`, or licensed audio). With no song the `song` variant is skipped. Never take audio from other people's videos.
- Output files are named `<name>-1-speed.mp4` ... and a `POSTING-PLAN.md`.

## Posting plan (Trial Reels)

Instagram's Trial option is chosen in the app when posting (Reel, then "Trial"): the API and third-party tools may not support it, so the owner posts these by hand.

1. Post the variants as trials a few hours apart, not all at once.
2. After 24 hours compare, per variant: views to non-followers, 3-second hold, average watch time, shares. Do not judge on likes.
3. Move the winner to everyone, keep its change, and run the next round with a new single change.

Never post for the owner: sending anything to an account needs their explicit approval each time.
