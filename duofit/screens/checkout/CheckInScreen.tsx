import { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, runOnJS } from 'react-native-reanimated';
import { CheckCircle2, Calendar, Clock, MapPin } from 'lucide-react-native';
import { useWorkoutStore } from '@hooks/useWorkoutStore';
import { Card } from '@components/Card';
import { Button } from '@components/Button';
import { theme } from '@styles/theme';

// Per 05-MOTION-SPECS.md "Check-in (1h) — Confirmation": checkmark animation
// (500ms), then confirmation text slides up (300ms).
const CHECKMARK_DURATION_MS = 500;
const CONFIRMATION_DURATION_MS = 300;

export function CheckInScreen() {
  const router = useRouter();
  const { workoutId = '' } = useLocalSearchParams<'/check-in', { workoutId: string }>();
  const workout = useWorkoutStore((state) => state.scheduledWorkouts.find((item) => item.id === workoutId));
  const checkIn = useWorkoutStore((state) => state.checkIn);

  const [showConfirmation, setShowConfirmation] = useState(false);
  const checkmarkScale = useSharedValue(0);
  const confirmationOpacity = useSharedValue(0);
  const confirmationTranslateY = useSharedValue(16);

  const handleCheckIn = () => {
    checkIn(workoutId);
    checkmarkScale.value = withTiming(1, { duration: CHECKMARK_DURATION_MS }, (finished) => {
      if (finished) runOnJS(setShowConfirmation)(true);
    });
  };

  useEffect(() => {
    if (!showConfirmation) return;
    confirmationOpacity.value = withTiming(1, { duration: CONFIRMATION_DURATION_MS });
    confirmationTranslateY.value = withTiming(0, { duration: CONFIRMATION_DURATION_MS });
  }, [showConfirmation, confirmationOpacity, confirmationTranslateY]);

  const checkmarkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkmarkScale.value }],
  }));
  const confirmationStyle = useAnimatedStyle(() => ({
    opacity: confirmationOpacity.value,
    transform: [{ translateY: confirmationTranslateY.value }],
  }));

  if (!workout) {
    return (
      <View style={styles.container}>
        <Text style={styles.missingText}>האימון לא נמצא</Text>
        <Button label="חזרה לגילוי" variant="secondary" onPress={() => router.replace('/discover')} />
      </View>
    );
  }

  const scheduledDate = new Date(workout.scheduledAt);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{workout.checkedIn ? 'האימון אושר' : 'האימון שלך'}</Text>

      <Card style={styles.summaryCard}>
        <Text style={styles.partnerName}>
          {workout.activity} עם {workout.partnerName}
        </Text>
        <View style={styles.detailRow}>
          <Calendar color={theme.colors.textTertiary} size={16} strokeWidth={2} />
          <Text style={styles.detailText}>
            {scheduledDate.toLocaleDateString('he-IL', { day: 'numeric', month: 'long' })}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Clock color={theme.colors.textTertiary} size={16} strokeWidth={2} />
          <Text style={styles.detailText}>
            {scheduledDate.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <MapPin color={theme.colors.textTertiary} size={16} strokeWidth={2} />
          <Text style={styles.detailText}>{workout.location}</Text>
        </View>
      </Card>

      <View style={styles.checkInArea}>
        {!workout.checkedIn ? (
          <Button label="אשר הגעה" variant="primary" size="lg" onPress={handleCheckIn} />
        ) : (
          <>
            <Animated.View style={checkmarkStyle}>
              <CheckCircle2 color={theme.colors.cyan} size={64} strokeWidth={2} />
            </Animated.View>
            {showConfirmation && (
              <Animated.Text style={[styles.confirmationText, confirmationStyle]}>
                סיימתם אימון יחד!
              </Animated.Text>
            )}
          </>
        )}
      </View>

      {showConfirmation && (
        <Pressable style={styles.backButton} onPress={() => router.replace('/discover')}>
          <Text style={styles.backButtonText}>חזרה לגילוי</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    alignItems: 'center',
  },
  missingText: {
    color: theme.colors.textSecondary,
    fontSize: 16,
    fontFamily: theme.typography.body.fontFamily,
    marginBottom: theme.spacing.lg,
  },
  title: {
    width: '100%',
    fontSize: 24,
    fontFamily: theme.typography.h2.fontFamily,
    color: theme.colors.text,
    textAlign: 'left', // Renders visually right under this app's forced RTL (Android quirk)
    marginBottom: theme.spacing.lg,
  },
  summaryCard: {
    width: '100%',
    gap: theme.spacing.sm,
  },
  partnerName: {
    width: '100%',
    fontSize: 18,
    fontFamily: theme.typography.h3.fontFamily,
    color: theme.colors.text,
    textAlign: 'left', // Renders visually right under this app's forced RTL (Android quirk)
    marginBottom: theme.spacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  detailText: {
    fontSize: 14,
    fontFamily: theme.typography.body.fontFamily,
    color: theme.colors.textSecondary,
  },
  checkInArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.lg,
  },
  confirmationText: {
    fontSize: 20,
    fontFamily: theme.typography.h3.fontFamily,
    color: theme.colors.cyan,
  },
  backButton: {
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  backButtonText: {
    color: theme.colors.magenta,
    fontSize: 14,
    fontFamily: theme.typography.label.fontFamily,
  },
});
