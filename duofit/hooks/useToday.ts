import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { msUntilNextMidnight } from '@lib/midnight';

// The current date, refreshed at 00:00 and whenever the app comes back to the front, so screens that draw "the last 90 days"
// or "this week" roll over to the new day by themselves even if the app stays open overnight.
export function useToday(): Date {
  const [today, setToday] = useState(() => new Date());

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const refresh = () => setToday((previous) => {
      const now = new Date();
      return now.toDateString() === previous.toDateString() ? previous : now;
    });
    const schedule = () => {
      // One second past midnight, so the timer never fires just before the new day starts.
      timer = setTimeout(() => {
        refresh();
        schedule();
      }, msUntilNextMidnight(new Date()) + 1000);
    };
    schedule();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        clearTimeout(timer);
        refresh();
        schedule();
      }
    });
    return () => {
      clearTimeout(timer);
      subscription.remove();
    };
  }, []);

  return today;
}
