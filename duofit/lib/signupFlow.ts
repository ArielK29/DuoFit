import { MIN_AGE, isAdult, parseBirthDate } from './identity.ts';

// The first screens a new member sees, and the birth-date check that comes before the account form: a member under 18 learns
// it at once, before typing an e-mail and a password. The server still checks the age again in the identity check.
export interface IntroSlide {
  title: string;
  text: string;
}

export const INTRO_SLIDES: IntroSlide[] = [
  { title: 'מוצאים שותף אימון אמיתי', text: 'אנשים שמתאימים לך בספורט, ברמה ובאזור שלך.' },
  { title: 'כולם עוברים בדיקת זהות', text: 'רק בני 18 ומעלה, עם תמונה אמיתית וסרטון קצר שנבדק על ידי אדם.' },
  { title: 'מתאמנים ביחד', text: 'קובעים אימון, מדברים, ועוקבים אחרי צעדים, ריצות ורצף משותף.' },
];

export function birthProblem(day: string, month: string, year: string, on: Date = new Date()): string | null {
  const birth = parseBirthDate(day, month, year, on);
  if (!birth) return 'הזן תאריך לידה תקין: יום, חודש ושנה';
  if (!isAdult(birth, on)) return `האפליקציה מיועדת לבני ${MIN_AGE} ומעלה בלבד`;
  return null;
}
