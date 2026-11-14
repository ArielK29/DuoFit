---
name: content-line
description: FitFriend's weekly content assembly line - niche sentence, researched idea, scored Hebrew hook, script, build, variants, caption, posting plan. Use when the owner says "content line", "פס ייצור", "let's make this week's content", or asks to produce reels "in the system" rather than one at a time.
---

# content-line

One pass turns one idea into a reel that is ready to post. The shape (niche, then
researched idea, then title/hook, intro, script, production, upload) follows the
"automate most of your content with Claude" systems that creators publish; it was
rebuilt here from written summaries, not copied from any one video, and every step
runs on tools that already exist in this repo.

Read `.claude/instagram/voice.md` first. It holds the niche, the positions, the proof
that may be used and the claims that may not.

## The line

| # | Step | Tool here | Output |
|---|---|---|---|
| 1 | Niche sentence | `voice.md` | one sentence: who, what changes |
| 2 | Idea, from evidence | `/ig-audit` on the owner's Insights, `/ig-viral` when data exists, the waitlist count | 5 ideas, each tied to a reason |
| 3 | Hook | `ig-reel/hooks.json` formulas, then `hook-score-he` | 3 hooks per idea, ranked; under 60 is rewritten |
| 4 | First 3 seconds | `/ig-reel` | spoken line + on-screen line, written separately |
| 5 | Script and beats | `/ig-reel` | beats of 4 s or less, one ask, a loop word |
| 6 | Build | the kinetic template or `/video-editor` for footage | 1080x1920, text inside the safe zone, -14 LUFS |
| 7 | Variants | `/trial-reels` | one change per variant |
| 8 | Caption and plan | `/ig-caption`, `/ig-plan` | caption, posting time, what to compare after 24 h |

## Rules

- Step 2 needs evidence. With no Insights, say the ideas are guesses and make fewer.
- Only real numbers (read the waitlist count the same day). No invented results.
- "בקרוב" and "רשימת המתנה" until the App Store approves the app.
- The owner posts. Nothing is published from here.
- After 24 hours the owner's Insights screenshot goes back into step 2. A line that
  never gets results fed back is just a production queue.

## What it does not do

It does not find what is trending without data, and it does not make a reel perform.
It removes the blank page and keeps the quality checks in the same order every time.
