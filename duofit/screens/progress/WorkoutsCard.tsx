import React, { useState } from 'react';
import { Text, Pressable, StyleSheet } from 'react-native';
import { Flag } from 'lucide-react-native';
import { BarChart, Bar } from '@components/BarChart';
import { SegmentedToggle } from '@components/SegmentedToggle';
import { Banner, CardShell, pillStyles } from '@screens/progress/CardShell';
import { WorkoutRange, buildWorkoutBars, countWeeksMetGoal } from '@lib/progress';
import { theme } from '@styles/theme';

const RANGE_OPTIONS: { value: WorkoutRange; label: string }[] = [
  { value: '12w', label: '12 שבועות' },
  { value: '6m', label: '6 חודשים' },
  { value: '1y', label: 'שנה' },
];
const RANGE_WEEKS: Record<WorkoutRange, number> = { '12w': 12, '6m': 26, '1y': 52 };

interface WorkoutsCardProps {
  completedIso: string[];
  goal: number;
  onEditGoal: () => void;
}

// "אימונים בשבוע": real completed workouts per week (or per-month weekly
// average on the longer ranges) against the user's weekly goal.
export const WorkoutsCard: React.FC<WorkoutsCardProps> = ({ completedIso, goal, onEditGoal }) => {
  const [range, setRange] = useState<WorkoutRange>('12w');
  const now = new Date();

  const points = buildWorkoutBars(completedIso, range, now);
  const bars: Bar[] = points.map((point, index) => ({
    label: point.label,
    value: point.value,
    color:
      index === points.length - 1
        ? theme.colors.magenta
        : point.value >= goal
          ? theme.colors.cyan
          : `${theme.colors.textTertiary}66`,
  }));

  const max = Math.max(goal + 1, Math.ceil(Math.max(...points.map((point) => point.value))));
  const ticks = [0, max / 3, (2 * max) / 3, max];

  const weeks = RANGE_WEEKS[range];
  const metWeeks = countWeeksMetGoal(completedIso, goal, weeks, now);
  // Every workout in DuoFit is scheduled with a partner.
  const withPartner = completedIso.length > 0 ? ' — 100% מהאימונים היו עם שותף' : '';

  return (
    <CardShell
      title="אימונים בשבוע"
      chip={
        <Pressable
          style={[pillStyles.pill, styles.goalPill]}
          onPress={onEditGoal}
          accessibilityRole="button"
          accessibilityLabel={`יעד שבועי: ${goal} אימונים. לחץ לשינוי`}
        >
          <Flag color={theme.colors.textSecondary} size={16} strokeWidth={2} />
          <Text style={pillStyles.pillMuted}>
            יעד <Text style={pillStyles.pillText}>{goal}</Text> בשבוע
          </Text>
        </Pressable>
      }
    >
      <BarChart
        accessibilityLabel={`גרף אימונים בשבוע, יעד ${goal}. ${points.map((point) => `${point.label}: ${point.value}`).join(', ')}`}
        bars={bars}
        max={max}
        ticks={ticks}
        formatTick={(value) => String(Math.round(value))}
        goal={goal}
        goalLabel={`יעד ${goal}`}
        labelEvery={range === '12w' ? 2 : 1}
      />
      <SegmentedToggle options={RANGE_OPTIONS} value={range} onChange={setRange} />
      <Banner text={`עמדת ביעד ${metWeeks} מתוך ${weeks} השבועות האחרונים${withPartner}`} />
    </CardShell>
  );
};

const styles = StyleSheet.create({
  goalPill: {
    minHeight: 48,
  },
});
