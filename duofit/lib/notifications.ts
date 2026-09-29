import * as Notifications from 'expo-notifications';

// Local reminders only — remote push isn't available in Expo Go on Android
// (SDK 53+) and DuoFit has no push backend yet anyway (#15).
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const REMINDER_LEAD_MINUTES = 30;

interface WorkoutReminderInput {
  activity: string;
  partnerName: string;
  scheduledAt: Date;
}

// Schedules a local reminder shortly before the workout. Silently skips if
// notification permission is denied or the reminder time has already
// passed — a missing reminder isn't worth blocking the scheduling flow over.
export async function scheduleWorkoutReminder({ activity, partnerName, scheduledAt }: WorkoutReminderInput) {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return;

  const secondsUntilReminder = (scheduledAt.getTime() - Date.now()) / 1000 - REMINDER_LEAD_MINUTES * 60;
  if (secondsUntilReminder <= 0) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'האימון שלך מתקרב',
      body: `${activity} עם ${partnerName} בעוד ${REMINDER_LEAD_MINUTES} דקות`,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: secondsUntilReminder,
    },
  });
}
