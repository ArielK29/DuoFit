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
