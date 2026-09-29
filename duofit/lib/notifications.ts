// expo-notifications throws on Android just from being imported when running
// in Expo Go (SDK 53+ removed its Android push module from the client, and
// the package throws eagerly at module-evaluation time, not just when you
// touch a push-specific call) — see https://docs.expo.dev/develop/development-builds/introduction/.
// A static top-level `import` would crash every screen that pulls this file
// in as soon as the route graph loads, so the module is loaded lazily
// instead, inside a try/catch, the first time a notification is actually
// requested. Reminders silently become a no-op in Expo Go; they'll work
// once DuoFit moves to a dev client (#15).
type NotificationsModule = typeof import('expo-notifications');

let notificationsModule: NotificationsModule | null = null;
let handlerConfigured = false;

async function getNotifications(): Promise<NotificationsModule> {
  if (!notificationsModule) {
    notificationsModule = await import('expo-notifications');
  }
  if (!handlerConfigured) {
    notificationsModule.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    handlerConfigured = true;
  }
  return notificationsModule;
}

const REMINDER_LEAD_MINUTES = 30;

interface WorkoutReminderInput {
  activity: string;
  partnerName: string;
  scheduledAt: Date;
}

// Schedules a local reminder shortly before the workout. Silently skips if
// notifications aren't available (Expo Go on Android), permission is
// denied, or the reminder time has already passed — never worth blocking
// the scheduling flow over.
export async function scheduleWorkoutReminder({ activity, partnerName, scheduledAt }: WorkoutReminderInput) {
  try {
    const Notifications = await getNotifications();
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
  } catch {
    // See module comment — expected in Expo Go on Android.
  }
}
