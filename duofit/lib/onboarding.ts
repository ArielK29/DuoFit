// The profile steps after sign-up. Each step asks one thing, and nothing is asked twice in the whole sign-up:
// name, e-mail and password are asked at sign-up; gender, sports and level here; birth date, face photo and the
// short video in the identity check.
export type ProfileStep = 'gender' | 'activities' | 'level';

export const PROFILE_STEPS: ProfileStep[] = ['gender', 'activities', 'level'];

// Sports a member can look for a partner in (at most MAX_ACTIVITIES). The first six are the original names; partners
// are matched by the same names, so existing members keep matching.
export const MAX_ACTIVITIES = 5;
export const PROFILE_ACTIVITIES = [
  'ריצה',
  'כושר גופני',
  'כוח',
  'יוגה',
  'רכיבה על אופניים',
  'שחייה',
  'כדורגל',
  'כדורסל',
  'קליסטניקס',
  'קרוספיט',
  'פילאטיס',
  'טניס',
  'פאדל',
  'אגרוף',
  'טיפוס',
  'הליכה וטיולים',
  'ריצת שטח',
  'גלישה',
];

// A sport the member writes himself (it is not on the list): 2 to 30 letters, digits, spaces or a hyphen. Matches the
// database limit on the whole list (supabase/migrations/20261108_profile_custom_activity.sql).
export const MIN_CUSTOM_ACTIVITY_CHARS = 2;
export const MAX_CUSTOM_ACTIVITY_CHARS = 30;
const CUSTOM_ACTIVITY_CHARS = /^[\p{L}\p{N}][\p{L}\p{N} \-']*$/u;

export type CustomActivityResult = { activities: string[] } | { problem: string };

export function addCustomActivity(selected: string[], text: string): CustomActivityResult {
  const name = text.replace(/\s+/g, ' ').trim();
  if (name.length < MIN_CUSTOM_ACTIVITY_CHARS) return { problem: 'כתוב שם של לפחות שני תווים' };
  if (name.length > MAX_CUSTOM_ACTIVITY_CHARS) return { problem: `עד ${MAX_CUSTOM_ACTIVITY_CHARS} תווים` };
  if (!CUSTOM_ACTIVITY_CHARS.test(name)) return { problem: 'אפשר רק אותיות, מספרים ורווחים' };
  if (selected.some((item) => item.toLowerCase() === name.toLowerCase())) return { problem: 'התחום הזה כבר נבחר' };
  if (selected.length >= MAX_ACTIVITIES) return { problem: `אפשר עד ${MAX_ACTIVITIES} תחומים. הסר אחד כדי להוסיף` };
  return { activities: [...selected, name] };
}

// The sports the member chose that are not on the list (shown as chips he can remove).
export function customActivities(selected: string[]): string[] {
  return selected.filter((item) => !PROFILE_ACTIVITIES.includes(item));
}

export function toggleActivity(selected: string[], activity: string): string[] {
  if (selected.includes(activity)) return selected.filter((item) => item !== activity);
  if (selected.length >= MAX_ACTIVITIES) return selected;
  return [...selected, activity];
}

export function stepProblem(
  step: ProfileStep,
  values: { gender: string | null; activities: string[]; fitnessLevel: string | null }
): string | null {
  if (step === 'gender') return values.gender ? null : 'בחר מגדר';
  if (step === 'activities') return values.activities.length > 0 ? null : 'בחר לפחות ספורט אחד';
  return values.fitnessLevel ? null : 'בחר את הרמה שלך';
}
