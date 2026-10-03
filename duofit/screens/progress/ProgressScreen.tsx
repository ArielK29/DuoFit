import { useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { HeaderActions } from '@components/HeaderActions';
import { useWorkoutStore } from '@hooks/useWorkoutStore';
import { useProgressStore, EXAMPLE_GOAL_WEIGHT } from '@hooks/useProgressStore';
import { RunsCard } from '@screens/progress/RunsCard';
import { GoalSheet, WeightSheet } from '@screens/progress/ProgressSheets';
import { StepsCard } from '@screens/progress/StepsCard';
import { StreakCard, WeightCard } from '@screens/progress/SummaryCards';
import { WeightTrendCard } from '@screens/progress/WeightTrendCard';
import { WorkoutsCard } from '@screens/progress/WorkoutsCard';
import { buildExampleWeights, computeGoalStreakWeeks, goalProgress, toWeightPoints } from '@lib/progress';
import { theme } from '@styles/theme';
import { visualLeft } from '@lib/rtl';

function startOfDay(iso: string): number {
  const d = new Date(iso);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

export function ProgressScreen() {
  const router = useRouter();
  const scheduledWorkouts = useWorkoutStore((state) => state.scheduledWorkouts);
  const { weeklyGoal, goalWeight, weightLog } = useProgressStore();
  const { setWeeklyGoal, logWeight } = useProgressStore.getState();

  const [weightSheetVisible, setWeightSheetVisible] = useState(false);
  const [goalSheetVisible, setGoalSheetVisible] = useState(false);

  const now = new Date();
  const completedIso = scheduledWorkouts.filter((workout) => workout.checkedIn).map((workout) => workout.scheduledAt);

  // Streak + this week's days (real)
  const streakWeeks = computeGoalStreakWeeks(completedIso, weeklyGoal, now);
  const activeDates = new Set(completedIso.map(startOfDay));
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
  const activeDays = Array.from({ length: 7 }, (_, index) =>
    activeDates.has(new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + index).getTime())
  );

  // Weight: real log, or an example journey until the first entry
  const isExampleWeight = weightLog.length === 0;
  const weightPoints = isExampleWeight ? buildExampleWeights(now) : toWeightPoints(weightLog);
  const goalKg = goalWeight ?? EXAMPLE_GOAL_WEIGHT;
  const startKg = weightPoints[0].kg;
  const currentKg = weightPoints[weightPoints.length - 1].kg;

  const openQuickActions = () =>
    Alert.alert('מה להוסיף?', undefined, [
      { text: 'רשום משקל', onPress: () => setWeightSheetVisible(true) },
      { text: 'מצא שותף לאימון', onPress: () => router.push('/discover') },
      { text: 'ביטול', style: 'cancel' },
    ]);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>התקדמות</Text>
          <HeaderActions />
        </View>

        <View style={styles.previewPill}>
          <Text style={styles.previewPillText}>תצוגה מקדימה — צעדים וריצות לדוגמה</Text>
        </View>

        <View style={styles.summaryRow}>
          <WeightCard
            kg={currentKg}
            goalKg={goalKg}
            progress={goalProgress(startKg, currentKg, goalKg)}
            isExample={isExampleWeight}
            onLog={() => setWeightSheetVisible(true)}
          />
          <StreakCard weeks={streakWeeks} activeDays={activeDays} />
        </View>

        <WorkoutsCard completedIso={completedIso} goal={weeklyGoal} onEditGoal={() => setGoalSheetVisible(true)} />
        <WeightTrendCard points={weightPoints} goalKg={goalKg} isExample={isExampleWeight} />
        <StepsCard />
        <RunsCard />
      </ScrollView>

      <Pressable style={styles.fab} onPress={openQuickActions} accessibilityLabel="הוסף">
        <Plus color={theme.colors.black} size={30} strokeWidth={2.5} />
      </Pressable>

      <WeightSheet
        visible={weightSheetVisible}
        currentKg={currentKg}
        goalKg={goalKg}
        onSave={logWeight}
        onClose={() => setWeightSheetVisible(false)}
      />
      <GoalSheet
        visible={goalSheetVisible}
        goal={weeklyGoal}
        onSave={setWeeklyGoal}
        onClose={() => setGoalSheetVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    paddingHorizontal: theme.spacing.lg,
  },
  scrollContent: {
    paddingTop: theme.spacing.xl,
    paddingBottom: 112, // room for the floating "+" button
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: 34,
    fontFamily: theme.typography.h1.fontFamily,
    color: theme.colors.text,
  },
  previewPill: {
    alignSelf: 'flex-end',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.surfaceHover,
    borderRadius: theme.borderRadius.full,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  previewPillText: {
    fontSize: 11,
    fontFamily: theme.typography.label.fontFamily,
    color: theme.colors.textTertiary,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  fab: {
    position: 'absolute',
    bottom: theme.spacing.lg,
    ...visualLeft(theme.spacing.lg),
    width: 64,
    height: 64,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.magenta,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
  },
});
