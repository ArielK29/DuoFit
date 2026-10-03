import { useEffect } from 'react';
import { useNotificationStore } from '@hooks/useNotificationStore';
import { useProgressStore } from '@hooks/useProgressStore';
import { useWorkoutStore } from '@hooks/useWorkoutStore';

const CHECK_EVERY_MS = 60000;
const SOON_WINDOW_MINUTES = 60;

function startOfWeekKey(now: Date): string {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

// Turns real events into in-app notifications: a workout that starts within the
// hour, and reaching the weekly workout goal. Runs while the app is open.
export function NotificationWatcher() {
  const scheduledWorkouts = useWorkoutStore((state) => state.scheduledWorkouts);
  const weeklyGoal = useProgressStore((state) => state.weeklyGoal);

  useEffect(() => {
    const check = () => {
      const { add } = useNotificationStore.getState();
      const now = new Date();

      scheduledWorkouts
        .filter((workout) => !workout.checkedIn)
        .forEach((workout) => {
          const minutes = Math.round((new Date(workout.scheduledAt).getTime() - now.getTime()) / 60000);
          if (minutes < 0 || minutes > SOON_WINDOW_MINUTES) return;
          add({
            kind: 'workout_soon',
            title: minutes <= 1 ? 'האימון מתחיל עכשיו' : `האימון מתחיל בעוד ${minutes} דקות`,
            body: `${workout.activity} עם ${workout.partnerName} · ${workout.location}`,
            href: '/check-in',
            params: { workoutId: workout.id },
            dedupeKey: `soon-${workout.id}`,
          });
        });

      const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()).getTime();
      const doneThisWeek = scheduledWorkouts.filter(
        (workout) => workout.checkedIn && new Date(workout.scheduledAt).getTime() >= weekStart
      ).length;
      if (doneThisWeek >= weeklyGoal) {
        add({
          kind: 'goal_reached',
          title: 'עמדת ביעד השבועי!',
          body: `${doneThisWeek} אימונים השבוע. כל הכבוד`,
          href: '/progress',
          dedupeKey: `goal-${startOfWeekKey(now)}`,
        });
      }
    };

    check();
    const interval = setInterval(check, CHECK_EVERY_MS);
    return () => clearInterval(interval);
  }, [scheduledWorkouts, weeklyGoal]);

  return null;
}
