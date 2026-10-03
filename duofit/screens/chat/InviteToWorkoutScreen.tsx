import { View, Text, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useChatStore } from '@hooks/useChatStore';
import { ScheduleForm } from '@components/ScheduleForm';
import { theme } from '@styles/theme';
import { visualRightText } from '@lib/rtl';

const DEFAULT_ACTIVITY = 'אימון משותף';

export function InviteToWorkoutScreen() {
  const router = useRouter();
  const { partnerId = '', partnerName = '' } = useLocalSearchParams<
    '/invite-to-workout',
    { partnerId: string; partnerName: string }
  >();
  const sendInvite = useChatStore((state) => state.sendInvite);

  const handleConfirm = (scheduledAt: Date, location: string) => {
    sendInvite(partnerId, partnerName, {
      activity: DEFAULT_ACTIVITY,
      location,
      scheduledAt: scheduledAt.toISOString(),
    });
    router.back();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>הזמנה לאימון</Text>
      <Text style={styles.subtitle}>עם {partnerName}</Text>
      <ScheduleForm confirmLabel="שלח הזמנה" onConfirm={handleConfirm} />
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
