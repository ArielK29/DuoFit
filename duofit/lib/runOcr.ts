// Reads a run's distance and time from the text found in a photo or screenshot of a running app or a watch.
// The result only pre-fills the quick entry: the member always sees the numbers and taps "save" himself, because OCR can be wrong.
export interface ParsedRun {
  km?: number;
  minutes?: number;
  kcal?: number;
}

const MAX_KM = 100;
const MILE_KM = 1.609344;
const MAX_MINUTES = 1000;

// A number (decimal point or comma) followed by a unit. The lines are joined first, so "12.4" and "km" on two lines still match.
const DISTANCE = /(\d{1,3}(?:[.,]\d{1,3})?)\s*(km|kms|kilometers?|kilometres?|ק"מ|ק״מ|קמ|ק'מ|קילומטר(?:ים)?|mi|miles?)(?![a-zא-ת])/gi;
// h:mm:ss, or m:ss, not followed by a "per km" mark (that is a pace, not a duration).
const CLOCK = /(?<![\d:])(\d{1,2}):(\d{2})(?::(\d{2}))?(?![\d:])(?!\s*(?:\/|per\s|min\s*\/|לק"מ|לק״מ|\/ק))/gi;
// "1h 5m" or "45 min": not part of a clock (5:12) and not a pace ("min/km").
const WORDS = /(?<![\d:])(?:(\d{1,2})\s*h(?:ours?|rs?)?\b)?\s*(\d{1,3})\s*(?:m|min|mins|minutes?|דק'|דק|דקות)\b(?!\s*\/)/gi;

function toNumber(text: string): number {
  return Number(text.replace(',', '.'));
}

function findDistance(joined: string): number | undefined {
  for (const match of joined.matchAll(DISTANCE)) {
    let km = toNumber(match[1]);
    if (/^(mi|miles?)$/i.test(match[2])) km *= MILE_KM;
    km = Math.round(km * 100) / 100;
    if (km > 0 && km <= MAX_KM) return km;
  }
  return undefined;
}

// A decimal number right after the word "distance" or "מרחק" (the unit is missing or on another line), for apps that show only the label.
const LABELED_DISTANCE = /(?:distance|dist\.?|מרחק)\s*[:\-]?\s*(\d{1,3}(?:[.,]\d{1,3})?)/i;

function findMinutes(joined: string): number | undefined {
  type Candidate = { seconds: number; hasHours: boolean };
  const candidates: Candidate[] = [];
  for (const match of joined.matchAll(CLOCK)) {
    const hasHours = match[3] !== undefined;
    const seconds = hasHours ? Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]) : Number(match[1]) * 60 + Number(match[2]);
    if (Number(match[2]) < 60 && (!hasHours || Number(match[3]) < 60)) candidates.push({ seconds, hasHours });
  }
  // A time with hours is a duration for sure (the phone's clock has no seconds); otherwise the longest m:ss is the best guess.
  const withHours = candidates.filter((candidate) => candidate.hasHours);
  const pool = withHours.length > 0 ? withHours : candidates;
  if (pool.length > 0) {
    const best = pool.reduce((a, b) => (b.seconds > a.seconds ? b : a));
    const minutes = Math.round(best.seconds / 60);
    return minutes >= 1 && minutes <= MAX_MINUTES ? minutes : undefined;
  }
  for (const match of joined.matchAll(WORDS)) {
    const minutes = (match[1] ? Number(match[1]) * 60 : 0) + Number(match[2]);
    if (minutes >= 1 && minutes <= MAX_MINUTES) return minutes;
  }
  return undefined;
}

// Calories burned: a number followed by its unit, or a number right after the word. A watch screen often shows both.
const KCAL_AFTER = /(\d{1,4})\s*(?:kcal|cals?|calories|קלוריות|קלורי|קק"ל|קק״ל|קל')(?![a-zא-ת])/i;
const KCAL_BEFORE = /(?<![a-z])(?:calories|kcal|cals?|קלוריות)\s*[:\-]?\s*(\d{1,4})(?!\d)/i;
const MAX_KCAL = 5000;

function findKcal(joined: string): number | undefined {
  const match = KCAL_AFTER.exec(joined) ?? KCAL_BEFORE.exec(joined);
  if (!match) return undefined;
  const kcal = Number(match[1]);
  return kcal >= 1 && kcal <= MAX_KCAL ? kcal : undefined;
}

function findLabeledDistance(joined: string): number | undefined {
  const match = LABELED_DISTANCE.exec(joined);
  if (!match) return undefined;
  const km = Math.round(toNumber(match[1]) * 100) / 100;
  return km > 0 && km <= MAX_KM ? km : undefined;
}

// The reader often mixes up what a number is made of: the letter O for a zero, an I or l for a one, a space or a dot for the
// colons of a clock ("00 42 15", "1.05.30"). Fixed before reading, only where it sits next to digits.
const SPACED_CLOCK = /(?<![\d:.])(\d{2}) (\d{2}) (\d{2})(?![\d:.])/g;
const DOTTED_CLOCK = /(?<![\d:.])(\d)\.(\d{2})\.(\d{2})(?![\d:.])/g;

function repairDigits(text: string): string {
  const asClock = (all: string, h: string, m: string, sec: string) => (Number(m) < 60 && Number(sec) < 60 ? `${h}:${m}:${sec}` : all);
  return text
    .replace(/(?<=[\d:.,])[Oo](?=[\d:.,\s]|$)|(?<=^|[\s:.,])[Oo](?=[\d:])/g, '0')
    .replace(/(?<=\d)[lI](?=\d)/g, '1')
    .replace(SPACED_CLOCK, asClock)
    .replace(DOTTED_CLOCK, asClock);
}

export function parseRunFromText(lines: string[]): ParsedRun {
  const joined = repairDigits(lines.join(' '));
  const result: ParsedRun = {};
  const km = findDistance(joined) ?? findLabeledDistance(joined);
  const minutes = findMinutes(joined);
  if (km !== undefined) result.km = km;
  if (minutes !== undefined) result.minutes = minutes;
  const kcal = findKcal(joined);
  if (kcal !== undefined) result.kcal = kcal;
  return result;
}
