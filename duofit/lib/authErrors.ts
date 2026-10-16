// Shown when signing in before the sign-up link was clicked; the login screen offers a resend next to it.
export const EMAIL_NOT_CONFIRMED_MESSAGE = 'האימייל עוד לא אומת. לחץ על הקישור שנשלח אליך במייל';

// Turns Supabase Auth errors into plain Hebrew messages. Falls back to a generic
// message so raw English/technical text never reaches the user.
export function authErrorMessage(error: { message?: string; code?: string; status?: number } | null | undefined): string {
  if (!error) return 'משהו השתבש, נסה שוב';
  const text = `${error.code ?? ''} ${error.message ?? ''}`.toLowerCase();

  if (text.includes('invalid login credentials') || text.includes('invalid_credentials')) {
    return 'אימייל או סיסמה שגויים';
  }
  if (text.includes('email not confirmed') || text.includes('email_not_confirmed')) {
    return EMAIL_NOT_CONFIRMED_MESSAGE;
  }
  if (text.includes('already registered') || text.includes('user_already_exists')) {
    return 'כבר קיים חשבון עם האימייל הזה';
  }
  // Must come before the weak-password check: Supabase words it "New password should be different...".
  if (text.includes('same_password') || text.includes('should be different from the old password')) {
    return 'הסיסמה החדשה חייבת להיות שונה מהסיסמה הקודמת';
  }
  if (text.includes('auth session missing') || text.includes('session_not_found') || text.includes('session_expired')) {
    return 'הקישור כבר לא בתוקף. בקש קישור חדש לאיפוס הסיסמה';
  }
  if (text.includes('weak_password') || text.includes('password should be')) {
    return 'הסיסמה חלשה מדי. השתמש לפחות ב-8 תווים';
  }
  if (text.includes('rate limit') || text.includes('over_email_send_rate_limit') || error.status === 429) {
    return 'נשלחו יותר מדי בקשות. נסה שוב בעוד כמה דקות';
  }
  if (text.includes('invalid') && text.includes('email')) {
    return 'כתובת האימייל לא תקינה';
  }
  if (text.includes('network') || text.includes('fetch') || text.includes('failed to fetch')) {
    return 'אין חיבור לשרת. בדוק את האינטרנט ונסה שוב';
  }
  return 'משהו השתבש, נסה שוב';
}

export const MIN_PASSWORD_LENGTH = 8;

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}
