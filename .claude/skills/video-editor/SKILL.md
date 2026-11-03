---
name: video-editor
description: FitFriend's fixed edit for a talking-head reel. Use when the owner says /video-editor or hands over a recording and asks to cut pauses and stumbles, add captions, animate in the brand colors, master the audio and export a reel ready to post. Wraps ghost-editor and ffmpeg-skill with the same five steps every time.
---

# video-editor

The same five steps on every video, in this order. The creative parts (take choice, captions, motion) come from `ghost-editor`; the cutting and encoding come from `ffmpeg-skill`. Read `docs/TALKING_HEAD.md` first: its standing rules and correction log apply here too.

## Steps

1. **Cut every pause and stumble.** Transcribe, keep the best take of each sentence, cut retakes and false starts, and cut pauses together with the breath. Report: retakes cut, seconds of silence cut, length before and after.
2. **Captions in the brand font.** One word at a time, Hebrew right to left, Heebo / Noto Sans Hebrew 800-900, inside the safe area (top 250 px and bottom 420 px are reserved for the platform UI), never over the face.
3. **Animate in the brand colors.** Magenta `#FF00A8`, cyan `#00E5FF` on `#050505` (from `duofit/constants/colors.ts`). The key word of each sentence gets the magenta. Soft click on each caption in the first 5 seconds; a short whoosh on every scene change.
4. **Master the audio to -14 LUFS.** `loudnorm=I=-14:TP=-1.5:LRA=11`, two passes if the speech is uneven. Music sits 14 dB under the voice and ducks while the voice is on.
5. **Export ready to post.** 1080x1920, 30 fps, H.264 `-crf 18`, AAC 192k, `-movflags +faststart`, under 90 seconds (22 seconds is the owner's current target).

Same steps, every single time. Do not skip a step because the clip is short.

## Example request

`/video-editor` Edit `<file>`. Keep my best takes and cut every pause and stumble. Open with a quick zoom and word-by-word captions with soft clicks for the first 5 seconds. Animate each key word in the brand colors with whooshes, and end on a call to action: "הקישור בביו".

## Rules

- The footage stays out of the repository (public repo). Work in the session scratchpad and send the result with SendUserFile.
- Check one rendered frame before delivering.
- Every correction from the owner becomes a dated line in the log in `docs/TALKING_HEAD.md`.
- After the export, offer `/trial-reels` to make test variants.
