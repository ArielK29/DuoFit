import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Calendar, MapPin } from 'lucide-react-native';
import { ScheduledWorkout } from '@hooks/useWorkoutStore';
import { Card } from '@components/Card';
import { Button } from '@components/Button';
import { theme } from '@styles/theme';

function formatUpcomingLabel(iso: string): string {
  const date = new Date(iso);
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round((startOfDay(date) - startOfDay(new Date())) / 86400000);

  const time = date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 0) return `היום · ${time}`;
  if (diffDays === 1) return `מחר · ${time}`;
  return `${date.toLocaleDateString('he-IL', { day: 'numeric', month: 'long' })} · ${time}`;
}

// Computed at render time (not a live ticking timer — avoids an interval
// just for a countdown label) per FitMatch's "בעוד X:XX:XX" hero readout.
function formatCountdown(iso: string): string {
  const diffMs = new Date(iso).getTime() - Date.now();
  if (diffMs <= 0) return 'האימון החל';

  const totalMinutes = Math.floor(diffMs / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `בעוד ${days} ימים ו-${hours} שעות`;
  if (hours > 0) return `בעוד ${hours} שעות ו-${minutes} דקות`;
  return `בעוד ${minutes} דקות`;
}

interface UpcomingWorkoutCardProps {
  workout: ScheduledWorkout;
  onPress: () => void;
}

// "Next workout" card, per the FitMatch reference layout — restyled with
// DuoFit's own dark palette instead of FitMatch's light theme.
export const UpcomingWorkoutCard: React.FC<UpcomingWorkoutCardProps> = ({ workout, onPress }) => {
  return (
    <Card style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.countdown}>{formatCountdown(workout.scheduledAt)}</Text>
        <Text style={styles.sectionLabel}>האימון הבא</Text>
      </View>
      <Text style={styles.title}>
        {workout.activity} עם {workout.partnerName}
      </Text>
      <View style={styles.detailRow}>
        <Calendar color={theme.colors.textSecondary} size={14} strokeWidth={2} />
        <Text style={styles.detailText}>{formatUpcomingLabel(workout.scheduledAt)}</Text>
      </View>
      <View style={styles.detailRow}>
        <MapPin color={theme.colors.textSecondary} size={14} strokeWidth={2} />
        <Text style={styles.detailText}>{workout.location}</Text>
      </View>
      <View style={styles.ctaWrapper}>
        <Button label="לצ'ק-אין" variant="primary" onPress={onPress} />
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: theme.spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  countdown: {
    fontSize: 13,
    fontFamily: theme.typography.bodySmallBold.fontFamily,
    color: theme.colors.magenta,
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: theme.typography.label.fontFamily,
    color: theme.colors.cyan,
  },
  title: {
    width: '100%',
    fontSize: 16,
    fontFamily: theme.typography.bodySmallBold.fontFamily,
    color: theme.colors.text,
    textAlign: 'left', // Renders visually right under this app's forced RTL (Android quirk)
    marginBottom: theme.spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  detailText: {
    fontSize: 13,
    fontFamily: theme.typography.body.fontFamily,
    color: theme.colors.textSecondary,
  },
  ctaWrapper: {
    marginTop: theme.spacing.md,
  },
});
