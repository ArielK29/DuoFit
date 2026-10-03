import React from 'react';
import { View, Text, Pressable, Linking, StyleSheet } from 'react-native';
import { Calendar, MapPin, MessageCircle, Navigation, Flame } from 'lucide-react-native';
import { ScheduledWorkout } from '@hooks/useWorkoutStore';
import { Card } from '@components/Card';
import { Button } from '@components/Button';
import { theme } from '@styles/theme';
import { visualRightText } from '@lib/rtl';

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
  partnerStreak?: number;
  onCheckInPress: () => void;
  onMessagePress: () => void;
}

// "Next workout" card, per the FitMatch reference layout — restyled with
// DuoFit's own dark palette instead of FitMatch's light theme. FitMatch's
// "3 confirmed participants" isn't included — DuoFit's workouts are 1-on-1,
// not group, so there's no second/third participant to show.
export const UpcomingWorkoutCard: React.FC<UpcomingWorkoutCardProps> = ({
  workout,
  partnerStreak,
  onCheckInPress,
  onMessagePress,
}) => {
  const openLocation = () => {
    const query = encodeURIComponent(workout.location);
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
  };

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
      {!!partnerStreak && partnerStreak > 1 && (
        <View style={styles.detailRow}>
          <Flame color={theme.colors.magenta} size={14} strokeWidth={2} />
          <Text style={styles.detailText}>
            {partnerStreak} אימונים ברצף עם {workout.partnerName} · אל תשבור
          </Text>
        </View>
      )}

      <View style={styles.actionsRow}>
        <Pressable style={styles.iconButton} onPress={onMessagePress} accessibilityLabel="הודעה">
          <MessageCircle color={theme.colors.textSecondary} size={18} strokeWidth={2} />
        </Pressable>
        <Pressable style={styles.iconButton} onPress={openLocation} accessibilityLabel="ניווט למיקום">
          <Navigation color={theme.colors.textSecondary} size={18} strokeWidth={2} />
        </Pressable>
        <View style={styles.ctaWrapper}>
          <Button label="סיימתי את האימון" variant="primary" onPress={onCheckInPress} />
        </View>
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
    ...visualRightText,
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
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surfaceHover,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctaWrapper: {
    flex: 1,
  },
});
