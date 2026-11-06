import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

// The date of today as text. Changes at midnight and when the app comes back from the background on a new day, so every screen
// that uses it draws again with a fresh "today": the daily numbers (steps, calories, kilometres) start from zero at midnight
// instead of keeping yesterday's until the member leaves the screen.
export function useDayKey(): string {
  const [day, setDay] = useState(() => new Date().toDateString());

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const check = () => setDay(new Date().toDateString());
    const schedule = () => {
      const now = new Date();
      const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime();
      // One second after midnight, so the clock has certainly passed it.
      timer = setTimeout(() => {
        check();
        schedule();
      }, Math.max(1000, nextMidnight - now.getTime() + 1000));
    };
    schedule();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        check();
        if (timer) clearTimeout(timer);
        schedule();
      }
    });
    return () => {
      if (timer) clearTimeout(timer);
      subscription.remove();
    };
  }, []);

  return day;
}
