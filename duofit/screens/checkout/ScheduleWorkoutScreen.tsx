import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar, Clock, MapPin } from 'lucide-react-native';
import { useWorkoutStore } from '@hooks/useWorkoutStore';
import { scheduleWorkoutReminder } from '@lib/notifications';
import { Card } from '@components/Card';
import { Button } from '@components/Button';
import { theme } from '@styles/theme';

const LOCATIONS = ['פארק הירקון', 'חוף גורדון', 'חדר כושר סנטרל', 'סטודיו CoreFit'];

function defaultScheduledAt(): Date {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(18, 0, 0, 0);
  return date;
}

function mergeDatePart(base: Date, datePart: Date): Date {
  const merged = new Date(base);
  merged.setFullYear(datePart.getFullYear(), datePart.getMonth(), datePart.getDate());
  return merged;
}

function mergeTimePart(base: Date, timePart: Date): Date {
  const merged = new Date(base);
  merged.setHours(timePart.getHours(), timePart.getMinutes(), 0, 0);
  return merged;
}

export function ScheduleWorkoutScreen() {
  const router = useRouter();
  const { partnerId = '', partnerName = '', activity = 'אימון משותף' } = useLocalSearchParams<
    '/schedule-workout',
    { partnerId: string; partnerName: string; activity: string }
  >();
  const scheduleWorkout = useWorkoutStore((state) => state.scheduleWorkout);

  const [scheduledAt, setScheduledAt] = useState(defaultScheduledAt);
  const [location, setLocation] = useState<string | null>(null);
  const [activePicker, setActivePicker] = useState<'date' | 'time' | null>(null);

  const handlePickerChange = (event: { type: string }, selected?: Date) => {
    const mode = activePicker;
    setActivePicker(null);
    if (event.type !== 'set' || !selected || !mode) return;
    setScheduledAt((prev) => (mode === 'date' ? mergeDatePart(prev, selected) : mergeTimePart(prev, selected)));
  };

  const handleConfirm = () => {
    if (!location) return;
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

      <Card style={styles.section}>
        <Text style={styles.sectionLabel}>מתי</Text>
        <View style={styles.dateTimeRow}>
          <Pressable style={styles.dateTimeButton} onPress={() => setActivePicker('date')}>
            <Calendar color={theme.colors.cyan} size={18} strokeWidth={2} />
            <Text style={styles.dateTimeText}>
              {scheduledAt.toLocaleDateString('he-IL', { day: 'numeric', month: 'long' })}
            </Text>
          </Pressable>
          <Pressable style={styles.dateTimeButton} onPress={() => setActivePicker('time')}>
            <Clock color={theme.colors.cyan} size={18} strokeWidth={2} />
            <Text style={styles.dateTimeText}>
              {scheduledAt.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </Pressable>
        </View>
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionLabel}>איפה</Text>
        <View style={styles.locationsWrap}>
          {LOCATIONS.map((option) => (
            <Pressable
              key={option}
              style={[styles.locationPill, location === option && styles.locationPillSelected]}
              onPress={() => setLocation(option)}
            >
              <MapPin
                color={location === option ? theme.colors.black : theme.colors.textSecondary}
                size={14}
                strokeWidth={2}
              />
              <Text style={[styles.locationText, location === option && styles.locationTextSelected]}>{option}</Text>
            </Pressable>
          ))}
        </View>
      </Card>

      {activePicker && (
        <DateTimePicker
          value={scheduledAt}
          mode={activePicker}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handlePickerChange}
        />
      )}

      <View style={styles.ctaWrapper}>
        <Button label="אשר תזמון" variant="primary" size="lg" disabled={!location} onPress={handleConfirm} />
      </View>
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
    textAlign: 'left', // Renders visually right under this app's forced RTL (Android quirk)
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    width: '100%',
    fontSize: 14,
    fontFamily: theme.typography.bodySmall.fontFamily,
    color: theme.colors.textSecondary,
    textAlign: 'left', // Renders visually right under this app's forced RTL (Android quirk)
    marginBottom: theme.spacing.xl,
  },
  section: {
    marginBottom: theme.spacing.md,
  },
  sectionLabel: {
    width: '100%',
    fontSize: 12,
    fontFamily: theme.typography.label.fontFamily,
    color: theme.colors.textTertiary,
    textAlign: 'left', // Renders visually right under this app's forced RTL (Android quirk)
    marginBottom: theme.spacing.md,
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  dateTimeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    minHeight: 48,
    backgroundColor: theme.colors.surfaceHover,
    borderRadius: theme.borderRadius.md,
  },
  dateTimeText: {
    fontSize: 14,
    fontFamily: theme.typography.bodySmallBold.fontFamily,
    color: theme.colors.text,
  },
  locationsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    minHeight: 48,
    backgroundColor: theme.colors.surfaceHover,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.md,
  },
  locationPillSelected: {
    backgroundColor: theme.colors.cyan,
  },
  locationText: {
    fontSize: 13,
    fontFamily: theme.typography.label.fontFamily,
    color: theme.colors.textSecondary,
  },
  locationTextSelected: {
    color: theme.colors.black,
  },
  ctaWrapper: {
    marginTop: 'auto',
    marginBottom: theme.spacing.xl,
  },
});
