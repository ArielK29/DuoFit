---
name: hook-score-he
description: Score Hebrew Reel hooks (the first line) on five structural checks - length, specificity, stakes, frontload, address - and rank a batch against each other. Use when the owner asks to rate or compare Hebrew hooks, or after /ig-reel when the hooks are in Hebrew (the English hookscore.py cannot read Hebrew).
---

# hook-score-he

A Hebrew version of `ig-reel/hookscore.py`. Same five checks, rebuilt for Hebrew:
word splitting, prefix letters (ו ה ב ל מ ש כ), Hebrew number words, stakes words,
imperatives, greetings and preambles.

```bash
python3 .claude/skills/hook-score-he/hookscore_he.py hooks.txt        # one hook per line, ranked
python3 .claude/skills/hook-score-he/hookscore_he.py --hook "תפסיקו לתכנן אימונים לבד"
python3 .claude/skills/hook-score-he/hookscore_he.py hooks.txt --json
```

## How to use

1. Write three to five Hebrew hooks (formulas in `ig-reel/hooks.json`), one per line.
2. Run the script and show the ranking. Under 50 means the hook is not there yet: change the hook, not the edit.
3. Fix the weakest property of the top hook and re-run.

## What it is not

- Not a view predictor, and **not validated on Hebrew data**. The English tool was
  tested on 74 real hooks; this one was not. It is a structural checklist.
- It does not read meaning: a hook can score high and still be a lie or a cliché.
- Trial Reels and the retention graph decide, not this score.

## Known limits

- Hebrew has no capital letters, so "concrete markers" are digits, number words,
  money words and Latin brand names (FitFriend). Hooks without a number score low
  on SPECIFICITY by design.
- Prefix stripping is simple (up to two letters), so a rare word that starts with
  a prefix letter can match the wrong list.
- Output text is Hebrew; some terminals show it in the wrong direction. Use `--json` to read it reliably.
