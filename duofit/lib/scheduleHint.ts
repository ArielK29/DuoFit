export interface ScheduleHint {
  text: string;
  warn: boolean;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function monthsWord(months: number): string {
  if (months === 1) return 'חודש';
  if (months === 2) return 'חודשיים';
  return `${months} חודשים`;
}

// One short line under the date and time of a workout: how far away it is. Made after the device pass, where a workout was sent for
// 22 December instead of 22 October because the month is easy to miss in the picker. A date more than a month away shows a warning.
export function scheduleHint(scheduledAt: Date, now: Date): ScheduleHint {
  const days = Math.round((startOfDay(scheduledAt) - startOfDay(now)) / DAY_MS);
  if (days < 0) return { text: 'התאריך כבר עבר', warn: true };
  if (days === 0) return { text: 'היום', warn: false };
  if (days === 1) return { text: 'מחר', warn: false };
  if (days === 2) return { text: 'מחרתיים', warn: false };
  if (days <= 30) return { text: `בעוד ${days} ימים`, warn: false };
  return {
    text: `בעוד ${days} ימים (כ-${monthsWord(Math.round(days / 30))}). כדאי לבדוק שבחרת את החודש הנכון`,
    warn: true,
  };
}
