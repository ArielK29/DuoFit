// A small filter for clearly abusive text, so nothing like it is posted from the app (App Store guideline 1.2:
// "a method for filtering objectionable material"). It is a safety net, not a moderator: reports, blocking and
// removal by hand stay in place for what a word list cannot catch.
//
// Design: whole words only (so "מפגש" is never confused with "מפגר", nor "Scunthorpe" with a blocked word), after
// removing vowel marks, zero-width characters, case, repeated letters and spacing tricks ("w.h.o.r.e").
// The list is deliberately short and limited to slurs, sexual insults, and urging someone to harm themselves.
// It is a starting list for the owner (and the lawyer) to review, and it is the only place to edit.

export const BLOCKED_MESSAGE = 'הטקסט כולל ביטוי שאינו מותר ב-DuoFit. שנה את הניסוח ונסה שוב';

// Each entry is one word, or a phrase of words separated by a space.
const BLOCKED_TERMS: string[] = [
  // Hebrew
  'בן זונה', 'בת זונה', 'זונה', 'זונות', 'שרמוטה', 'שרמוטות', 'כוס אמק', 'כוס אמא שלך', 'לך תמות', 'תמות כבר',
  'מפגר', 'מפגרת', 'מפגרים', 'ערבוש', 'ערבושים', 'כושי', 'כושים',
  // English
  'whore', 'whores', 'slut', 'sluts', 'cunt', 'cunts', 'nigger', 'niggers', 'nigga', 'faggot', 'faggots', 'retard', 'retards',
  'kys', 'kill yourself', 'kill your self', 'nudes', 'send nudes',
];

const FINAL_LETTERS: Record<string, string> = { ך: 'כ', ם: 'מ', ן: 'נ', ף: 'פ', ץ: 'צ' };
const HEBREW_PREFIXES = new Set(['ה', 'ו', 'ב', 'כ', 'ל', 'מ', 'ש']);

// Vowel marks and cantillation (U+0591 to U+05C7), zero-width and direction marks.
const INVISIBLE = /[֑-ׇ​-‏‪-‮⁠﻿]/g;

function simplify(word: string): string {
  return [...word]
    .map((ch) => FINAL_LETTERS[ch] ?? ch)
    .join('')
    .replace(/(.)\1+/gu, '$1'); // "whooore" -> "whore"
}

function tokenize(text: string): string[] {
  const base = text.normalize('NFKC').toLowerCase().replace(INVISIBLE, '');
  const raw = base.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  // "w.h.o.r.e" and "ש-ר-מ-ו-ט-ה" arrive as single letters: join a run of three or more.
  const joined: string[] = [];
  for (let i = 0; i < raw.length; ) {
    let j = i;
    while (j < raw.length && [...raw[j]].length === 1) j++;
    if (j - i >= 3) {
      joined.push(raw.slice(i, j).join(''));
      i = j;
    } else {
      joined.push(raw[i]);
      i++;
    }
  }
  return joined.map(simplify).filter(Boolean);
}

// The word itself, then the word with up to two Hebrew prefix letters removed (ה, ו, ב, כ, ל, מ, ש).
function forms(token: string): string[] {
  const out = [token];
  let rest = token;
  for (let i = 0; i < 2; i++) {
    const chars = [...rest];
    if (chars.length > 3 && HEBREW_PREFIXES.has(chars[0])) {
      rest = chars.slice(1).join('');
      out.push(rest);
    } else {
      break;
    }
  }
  return out;
}

const SINGLE = new Set<string>();
const PHRASES: string[][] = [];
for (const term of BLOCKED_TERMS) {
  const words = term.split(' ').map(simplify);
  if (words.length === 1) SINGLE.add(words[0]);
  else PHRASES.push(words);
}

export type FilterResult = { ok: true } | { ok: false; message: string };

export function checkText(text: string): FilterResult {
  if (typeof text !== 'string' || !text.trim()) return { ok: true };
  const tokens = tokenize(text);

  const hit = tokens.some((token) => forms(token).some((form) => SINGLE.has(form)));
  const phraseHit =
    !hit &&
    PHRASES.some((phrase) =>
      tokens.some((_, start) =>
        phrase.every((word, offset) => {
          const token = tokens[start + offset];
          return token !== undefined && (offset === 0 ? forms(token).includes(word) : token === word);
        })
      )
    );

  return hit || phraseHit ? { ok: false, message: BLOCKED_MESSAGE } : { ok: true };
}
