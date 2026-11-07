// Pure helpers for the "contact us" screen: the topics, the checks on the message, the status names and the error text.
// No network here, so it is unit-tested. The server enforces the same limits (supabase/migrations/20261107_support_requests.sql).

export type SupportTopic = 'bug' | 'account' | 'safety' | 'suggestion' | 'other';
export type SupportStatus = 'new' | 'in_progress' | 'done';

export const SUPPORT_TOPICS: { key: SupportTopic; label: string }[] = [
  { key: 'bug', label: 'תקלה באפליקציה' },
  { key: 'account', label: 'החשבון שלי' },
  { key: 'safety', label: 'בטיחות ודיווח' },
  { key: 'suggestion', label: 'הצעה לשיפור' },
  { key: 'other', label: 'משהו אחר' },
];

export const SUPPORT_MIN_CHARS = 10;
export const SUPPORT_MAX_CHARS = 2000;
export const SUPPORT_MAX_PER_DAY = 5;

export function supportTopicLabel(topic: string): string {
  return SUPPORT_TOPICS.find((entry) => entry.key === topic)?.label ?? 'משהו אחר';
}

// A Hebrew sentence saying what is wrong with the text, or null when it can be sent.
export function supportMessageProblem(text: string): string | null {
  const length = text.trim().length;
  if (length === 0) return 'כתוב לנו במה אפשר לעזור';
  if (length < SUPPORT_MIN_CHARS) return `הפנייה קצרה מדי. כתוב לפחות ${SUPPORT_MIN_CHARS} תווים`;
  if (length > SUPPORT_MAX_CHARS) return `הפנייה ארוכה מדי. עד ${SUPPORT_MAX_CHARS.toLocaleString('he-IL')} תווים`;
  return null;
}

const STATUS_LABELS: Record<SupportStatus, string> = {
  new: 'התקבלה',
  in_progress: 'בטיפול',
  done: 'טופלה',
};

export function supportStatusLabel(status: string): string {
  return STATUS_LABELS[status as SupportStatus] ?? STATUS_LABELS.new;
}

// What the member sees when sending failed.
export function supportErrorMessage(error: unknown): string {
  const text = String((error as { message?: string } | null)?.message ?? error ?? '');
  if (text.includes('support_rate_limit')) return `אפשר לשלוח עד ${SUPPORT_MAX_PER_DAY} פניות ביום. נחזור אליך בהקדם`;
  if (/network|fetch|offline|timeout/i.test(text)) return 'אין חיבור לאינטרנט. בדוק את החיבור ונסה שוב';
  return 'לא הצלחנו לשלוח את הפנייה. נסה שוב בעוד רגע';
}

// "1.0.1 (34)", at most 32 characters (the server limit).
export function formatAppVersion(version: string | null | undefined, build: string | null | undefined): string | null {
  const v = (version ?? '').trim();
  if (!v) return null;
  const b = (build ?? '').trim();
  return (b ? `${v} (${b})` : v).slice(0, 32);
}
