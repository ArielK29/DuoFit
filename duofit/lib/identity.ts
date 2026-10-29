// Rules for the "adults only + verified member" gate (see docs/superpowers/plans/2026-10-29-identity-verification-18plus.md).
// Pure functions only, so they are easy to test. The real enforcement is on the server (database policies);
// the app uses these to show the right screen.

export const MIN_AGE = 18;

// Whole years between `birth` and `on` (the birthday counts on the day itself).
export function ageOn(birth: Date, on: Date): number {
  let age = on.getFullYear() - birth.getFullYear();
  const beforeBirthday =
    on.getMonth() < birth.getMonth() || (on.getMonth() === birth.getMonth() && on.getDate() < birth.getDate());
  if (beforeBirthday) age -= 1;
  return age;
}

export function isAdult(birth: Date, on: Date = new Date()): boolean {
  if (birth.getTime() > on.getTime()) return false;
  return ageOn(birth, on) >= MIN_AGE;
}

// Builds a real calendar date from the three typed fields, or null when it is not a real date
// (31 February, month 13, empty, letters) or implausible (older than 120 years).
export function parseBirthDate(day: string, month: string, year: string, on: Date = new Date()): Date | null {
  if (!/^\d{1,2}$/.test(day.trim()) || !/^\d{1,2}$/.test(month.trim()) || !/^\d{4}$/.test(year.trim())) return null;
  const d = Number(day);
  const m = Number(month);
  const y = Number(year);
  if (y < on.getFullYear() - 120 || y > on.getFullYear()) return null;
  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null;
  return date;
}

// yyyy-mm-dd, the format of a Postgres `date` column.
export function formatBirthDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export interface Gesture {
  id: string;
  emoji: string;
  // What the member is asked to do in the video (shown on screen and to the reviewer).
  label: string;
}

// A random simple gesture in the short video shows that it was recorded now, by the person in front of the camera.
export const GESTURES: Gesture[] = [
  { id: 'thumb_up', emoji: '👍', label: 'אגודל למעלה' },
  { id: 'peace', emoji: '✌️', label: 'שתי אצבעות בסימן ניצחון' },
  { id: 'wave', emoji: '👋', label: 'כף יד פתוחה, כמו שלום' },
  { id: 'fist', emoji: '✊', label: 'אגרוף סגור' },
  { id: 'ear', emoji: '🙉', label: 'יד אחת על האוזן' },
  { id: 'three', emoji: '🤟', label: 'שלוש אצבעות למעלה' },
];

// A random 3-digit number the member must say out loud in the video. A video made in advance (or by an AI tool) cannot contain it,
// because the number is only shown on the screen at the moment of recording.
export function pickChallengeCode(random: () => number = Math.random): string {
  const n = 100 + Math.min(899, Math.floor(random() * 900));
  return String(n);
}

export function gestureById(id: string | null | undefined): Gesture | undefined {
  return GESTURES.find((g) => g.id === id);
}

export function pickGesture(random: () => number = Math.random): Gesture {
  const index = Math.min(GESTURES.length - 1, Math.floor(random() * GESTURES.length));
  return GESTURES[index];
}

// none = has not sent anything yet.
export type VerificationStatus = 'none' | 'pending' | 'approved' | 'rejected';

export function parseVerificationStatus(value: unknown): VerificationStatus {
  return value === 'pending' || value === 'approved' || value === 'rejected' ? value : 'none';
}

// Only an approved member gets past the gate.
export function canUseApp(status: VerificationStatus): boolean {
  return status === 'approved';
}
