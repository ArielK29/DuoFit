#!/usr/bin/env python3
"""
hookscore_he.py - score the first line of a Hebrew Reel on five properties.

Same five checks as ig-reel/hookscore.py (LENGTH, SPECIFICITY, STAKES,
FRONTLOAD, ADDRESS), rebuilt for Hebrew: Hebrew word splitting, one- and
two-letter prefixes (ו ה ב ל מ ש כ), Hebrew number words, stakes words and
imperatives, and Hebrew greetings and preambles.

What this is NOT: a view predictor, and not validated on Hebrew data. The
English tool was tested on 74 real hooks; this one was not. It is a structural
checklist. Trust the retention graph and Trial Reels over this script.

Usage
  python3 hookscore_he.py hooks.txt           # one hook per line, ranked
  python3 hookscore_he.py --hook "תפסיקו לתכנן אימונים לבד"
  python3 hookscore_he.py hooks.txt --json
"""
import argparse, json, re, statistics, sys

WORD_RE = re.compile(r"[֐-׿A-Za-z0-9$%'’\"״׳-]+")
NUMBER_RE = re.compile(r"\d[\d,]*(?:\.\d+)?\s?(?:%|ק\"ג|קילו|דקות|דקה|שעות|שעה|שניות|ימים|יום|שבועות|שבוע|חודשים|חודש|שנים|שנה|ש\"ח|שקל|k|x)?", re.I)
PROPER_RE = re.compile(r"\b[A-Z][A-Za-z]{2,}\b")          # brand names in Latin letters
HASHTAG_RE = re.compile(r"(?:^|\s)#\w+")
EMOJI_RE = re.compile(r"[\U0001F300-\U0001FAFF☀-➿]")
PREFIX = "והבכלמש"

SPOKEN_NUMBERS = {"אפס","שניים","שתיים","שני","שתי","שלוש","שלושה","ארבע","ארבעה","חמש","חמישה","שש","שישה","שבע","שבעה","שמונה","תשע","תשעה","עשר","עשרה","עשרים","שלושים","ארבעים","חמישים","שישים","שבעים","שמונים","תשעים","מאה","מאתיים","אלף","אלפיים","מיליון","חצי","כפול","פי"}
MONEY_WORDS = {"שקל","שקלים","דולר","דולרים","אלף","מיליון","רווח","הפסד","משכורת","שכר","חינם"}
STAKE_WORDS = {"לא","אל","אין","בלי","אף","לעולם","רק","אבל","עד","במקום","חבל","סוד","אמת","שקר","קשה","כואב","טעות","טעויות","עצלן","פראייר","פראיירים","מפסיד","מפסידים","סכנה","אזהרה","חינם","שוב","כבר","עדיין","לבד","נגד","מול"}
STAKE_STEMS = ("תפסיק","הפסק","וותר","ויתר","בטל","תבטל","כשל","נכשל","בזבז","מתחרט","חרט","מפסיד","תעצור","עצור","תמחק","מחק","שבור","נשבר","שובר")
WEAK_OPENERS = {"היי","הי","שלום","אהלן","אז","טוב","בעצם","היום","תראו","תקשיבו","תקשיב","חבר'ה","חברים","אחי","רגע","נו","בסדר","אוקיי","אוקי"}
WEAK_PHRASES = ("בסרטון הזה","בריל הזה","רציתי להראות","אני רוצה להראות","אני רוצה לספר","אני אראה לך","אני אראה לכם","מה קורה","מה נשמע")
IMPERATIVE_RE = re.compile(r"^[תא][א-ת]{2,}$")           # תפסיקו, תקבעו, תנסו (future-as-imperative)
YOU_RE = re.compile(r"(?:^|\s)(?:[והבכלמש]|כש|ש?ל)?(?:אתה|את|אתם|אתן|שלך|שלכם|לך|לכם|אליך|אליכם|איתך|איתכם|בשבילך|בשבילכם|עליך|ממך)(?=\s|$|[.,?!])")
ME_RE = re.compile(r"(?:^|\s)(?:אני|שלי|אצלי|לי|בניתי|עשיתי|הייתי|ניסיתי|ויתרתי)(?=\s|$|[.,?!])")
DEALBREAKERS = [
    (re.compile(r"^\s*(?:היי|הי|שלום|אהלן|מה קורה|מה נשמע|ברוכים)"), "ברכה בפתיחה. אף אחד לא בא לפיד כדי שיברכו אותו."),
    (re.compile(r"בסרטון הזה|בריל הזה|היום אני (?:אראה|אספר|אלמד)|אני אראה (?:לך|לכם)"), "הקדמה לסרטון. מחק ופתח במה שהבטחת."),
    (re.compile(r"^\s*(?:אל תגללו|תעצרו את הגלילה|עצרו)"), "מבקש תשומת לב במקום להרוויח אותה."),
    (HASHTAG_RE, "האשטג בהוק. המקום שלו בסוף הכיתוב."),
    (EMOJI_RE, "אמוג'י בהוק. בטקסט בגודל הוק יש מקום למילים או לאמוג'י, לא לשניהם."),
]

def clamp(n): return max(0.0, min(100.0, n))
def words(t): return WORD_RE.findall(re.sub(r"(?<=\d),(?=\d)", "", t))
def forms(tok):
    """the token and what is left after dropping up to two prefix letters"""
    tok = tok.strip("'’\"״׳-.,?!")
    out = [tok]; cur = tok
    for _ in range(2):
        if len(cur) > 2 and cur[0] in PREFIX:
            cur = cur[1:]; out.append(cur)
        else: break
    return out
def in_set(tok, S): return any(f in S for f in forms(tok))
def has_stem(tok, stems): return any(f.startswith(s) or s in f for f in forms(tok) for s in stems)

def check_length(text):
    n = len(words(text)); secs = n / 2.6; chars = len(text.strip())
    score = 100.0 if 4 <= n <= 11 else (clamp(100 - (4 - n) * 22) if n < 4 else clamp(100 - (n - 11) * 11))
    if chars > 55: score -= 12
    return clamp(score), f"{n} מילים, {chars} תווים, כ-{secs:.1f} שניות בדיבור (רצוי 4-11 מילים)"

def check_specificity(text):
    ws = words(text)
    nums = [n.strip() for n in NUMBER_RE.findall(text) if n.strip()]
    propers = set(PROPER_RE.findall(text))
    spoken = [w for w in ws if in_set(w, SPOKEN_NUMBERS) or in_set(w, MONEY_WORDS)]
    hits = len(nums) + len(propers) + len(spoken)
    score = 15.0 if hits == 0 else clamp(45 + hits * 30)
    found = ", ".join(nums[:2] + sorted(propers)[:2] + spoken[:2])
    return score, (f"{hits} פרטים קונקרטיים" + (f": {found}" if found else " - אין מספר, שם או משהו שאפשר לבדוק"))

def is_stake(w): return in_set(w, STAKE_WORDS) or has_stem(w, STAKE_STEMS)
def check_stakes(text):
    marks = sorted({w for w in words(text) if is_stake(w)})
    n = len(marks)
    score = {0: 20.0, 1: 70.0}.get(n, 100.0)
    return score, f"{n} סממני מתח" + (f": {', '.join(marks[:4])}" if marks else " - אין כאן שום דבר על הכף")

def check_frontload(text):
    ws = words(text)
    if not ws: return 0.0, "ריק"
    penalty, hit = 0, None
    if ws[0].strip("'’\"-") in WEAK_OPENERS: penalty, hit = 30, ws[0]
    else:
        for ph in WEAK_PHRASES:
            if text.strip().startswith(ph): penalty, hit = 30, ph; break
    payload = None
    for i, w in enumerate(ws):
        if is_stake(w) or in_set(w, SPOKEN_NUMBERS) or in_set(w, MONEY_WORDS) or NUMBER_RE.match(w) or PROPER_RE.match(w):
            payload = i; break
    if payload is None: base, where = 30.0, "אין מילת מטען בכל השורה"
    elif payload <= 2: base, where = 100.0, f"מילת מטען במילה {payload + 1}"
    elif payload <= 5: base, where = 70.0, f"מילת מטען במילה {payload + 1}, אפשר להקדים"
    else: base, where = 40.0, f"מילת מטען במילה {payload + 1}, מאוחר מדי"
    return clamp(base - penalty), where + (f"; פתיחה חלשה \"{hit}\"" if hit else "")

def check_address(text):
    ws = words(text)
    if YOU_RE.search(" " + text) or (ws and IMPERATIVE_RE.match(ws[0]) and ws[0] not in WEAK_OPENERS):
        return 100.0, "פונה אל הצופה"
    if any(IMPERATIVE_RE.match(w) for w in ws[:2]): return 90.0, "פתיחה בציווי"
    if ME_RE.search(" " + text): return 70.0, "גוף ראשון, בלי צופה"
    return 35.0, "גוף שלישי, אין אף אחד בחדר"

CHECKS = ["LENGTH", "SPECIFICITY", "STAKES", "FRONTLOAD", "ADDRESS"]
FUNCS = [check_length, check_specificity, check_stakes, check_frontload, check_address]

def run(text):
    results = {c: f(text) for c, f in zip(CHECKS, FUNCS)}
    flags = [m for p, m in DEALBREAKERS if p.search(text)]
    sc = [results[c][0] for c in CHECKS]
    overall = clamp(statistics.mean(sc) * 0.6 + min(sc) * 0.4 - len(flags) * 15)
    verdict = "STRONG" if overall >= 70 and min(sc) >= 55 and not flags else ("OK" if overall >= 50 else "WEAK")
    return results, overall, verdict, flags

def bar(s, w=24):
    f = round(s / 100 * w); return "#" * f + "." * (w - f)

def render_one(text, res, ov, ver, flags):
    print("\nHOOK SCORE (HE)\n" + "=" * 62)
    print(f"  {text.strip()}\n")
    for c in CHECKS:
        s, d = res[c]; print(f"  {c:<13} {bar(s)} {s:5.1f}\n  {'':<13} {d}")
    print("-" * 62 + f"\n  {'HOOK SCORE':<13} {bar(ov)} {ov:5.1f}   {ver}")
    for f in flags: print(f"\n  DEALBREAKER  {f}")
    if ver != "STRONG": print(f"\n  החלש ביותר: {min(CHECKS, key=lambda c: res[c][0])}. תקן אותו והרץ שוב.")
    print()

def main():
    ap = argparse.ArgumentParser(description="Score Hebrew Reel hooks")
    ap.add_argument("input", nargs="?"); ap.add_argument("--hook"); ap.add_argument("--json", action="store_true")
    a = ap.parse_args()
    if a.hook: lines = [a.hook]
    elif a.input == "-" or (a.input is None and not sys.stdin.isatty()): lines = sys.stdin.read().splitlines()
    elif a.input: lines = open(a.input, encoding="utf-8").read().splitlines()
    else: ap.print_help(); return 1
    lines = [l for l in lines if l.strip()]
    rows = []
    for l in lines:
        res, ov, ver, fl = run(l)
        rows.append({"hook": l, "score": round(ov, 1), "verdict": ver, "flags": fl,
                     "checks": {c: {"score": round(res[c][0], 1), "detail": res[c][1]} for c in CHECKS},
                     "weakest": min(CHECKS, key=lambda c: res[c][0])})
    if a.json: print(json.dumps(rows, ensure_ascii=False, indent=2)); return 0
    if len(rows) == 1:
        res, ov, ver, fl = run(lines[0]); render_one(lines[0], res, ov, ver, fl); return 0
    rows.sort(key=lambda r: -r["score"])
    print("\nHOOK RANKING (HE)\n" + "=" * 78)
    for i, r in enumerate(rows, 1):
        print(f"{i:>2}. {r['score']:5.1f} {r['verdict']:<6} {r['hook'][:60]}   (חלש: {r['weakest']})")
    print(); return 0

if __name__ == "__main__": sys.exit(main())
