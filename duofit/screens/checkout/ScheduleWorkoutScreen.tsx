import { View, Text, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useWorkoutStore } from '@hooks/useWorkoutStore';
import { scheduleWorkoutReminder } from '@lib/notifications';
import { ScheduleForm } from '@components/ScheduleForm';
import { theme } from '@styles/theme';
import { visualRightText } from '@lib/rtl';

export function ScheduleWorkoutScreen() {
  const router = useRouter();
  const { partnerId = '', partnerName = '', activity = 'אימון משותף' } = useLocalSearchParams<
    '/schedule-workout',
    { partnerId: string; partnerName: string; activity: string }
  >();
  const scheduleWorkout = useWorkoutStore((state) => state.scheduleWorkout);

  const handleConfirm = (scheduledAt: Date, location: string) => {
    const workout = scheduleWorkout({
      partnerId,
      partnerName,
      activity,
      location,
      scheduledAt: scheduledAt.toISOString(),
    });
    scheduleWorkoutReminder({ activity, partnerName, scheduledAt });
    router.replace({ pathname: '/check-in', params: { workoutId: workout.id } });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>קביעת אימון</Text>
      <Text style={styles.subtitle}>עם {partnerName} · {activity}</Text>
      <ScheduleForm confirmLabel="אשר תזמון" onConfirm={handleConfirm} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
  },
  title: {
    width: '100%',
    fontSize: 28,
    fontFamily: theme.typography.h2.fontFamily,
    color: theme.colors.text,
    ...visualRightText,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    width: '100%',
    fontSize: 14,
    fontFamily: theme.typography.bodySmall.fontFamily,
    color: theme.colors.textSecondary,
    ...visualRightText,
    marginBottom: theme.spacing.xl,
  },
});
