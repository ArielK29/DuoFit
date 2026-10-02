import React, { useState } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { Flag } from 'lucide-react-native';
import { LineChart, AxisLabel } from '@components/LineChart';
import { SegmentedToggle } from '@components/SegmentedToggle';
import { Banner, CardShell, pillStyles } from '@screens/progress/CardShell';
import { WeightPoint, WeightRange, formatKg, goalProgress, monthLabel, rangeStart } from '@lib/progress';
import { theme } from '@styles/theme';

const RANGE_OPTIONS: { value: WeightRange; label: string }[] = [
  { value: '90d', label: '90 יום' },
  { value: '6m', label: '6 חודשים' },
  { value: '1y', label: 'שנה' },
];
const LABEL_COUNT = 6;

interface WeightTrendCardProps {
  points: WeightPoint[]; // oldest first
  goalKg: number;
  isExample: boolean;
}

function buildXLabels(start: number, end: number): AxisLabel[] {
  const span = end - start;
  const labels: AxisLabel[] = [];
  for (let i = 0; i < LABEL_COUNT; i++) {
    const time = start + (span * (i + 0.5)) / LABEL_COUNT;
    const text = monthLabel(time);
    if (labels[labels.length - 1]?.text !== text) labels.push({ time, text });
  }
  return labels;
}

function buildBanner(points: WeightPoint[], isExample: boolean): string {
  if (points.length < 2) return 'רשום שקילות נוספות כדי לראות את המגמה שלך';
  const change = points[points.length - 1].kg - points[0].kg;
  const amount = formatKg(Math.abs(change));
  if (Math.abs(change) < 0.05) return 'המשקל שלך יציב מאז ההתחלה';
  if (change < 0) return `ירדת ${amount} ק"ג. עקביות היא המפתח${isExample ? ', ואתה בדיוק שם.' : '.'}`;
  return `עלית ${amount} ק"ג מאז ההתחלה. כל יום הוא הזדמנות חדשה`;
}

// "מגמת משקל": the user's real weigh-ins. Until the first one is logged the
// chart shows an example journey (flagged "לדוגמה").
export const WeightTrendCard: React.FC<WeightTrendCardProps> = ({ points, goalKg, isExample }) => {
  const [range, setRange] = useState<WeightRange>('6m');
  const now = new Date().getTime();
  const start = rangeStart(range, new Date(now));

  const visible = points.filter((point) => point.time >= start);
  const shown = visible.length > 0 ? visible : points.slice(-1);

  const values = [...shown.map((point) => point.kg), goalKg];
  const minValue = Math.floor(Math.min(...values) - 0.5);
  const maxValue = Math.ceil(Math.max(...values) + 0.5);
  const ticks = Array.from(
    new Set(Array.from({ length: 5 }, (_, i) => Math.round(minValue + ((maxValue - minValue) * i) / 4)))
  );

  const first = points[0];
  const last = points[points.length - 1];
  const percent = Math.round(goalProgress(first.kg, last.kg, goalKg) * 100);

  return (
    <CardShell
      title="מגמת משקל"
      isExample={isExample}
      chip={
        <View style={pillStyles.pill}>
          <Flag color={theme.colors.textSecondary} size={16} strokeWidth={2} />
          <Text style={pillStyles.pillMuted}>
            <Text style={pillStyles.pillText}>{percent}%</Text> מהיעד
          </Text>
        </View>
      }
    >
      <View style={styles.chart}>
        <LineChart
          accessibilityLabel={`מגמת משקל: ${formatKg(first.kg)} ק"ג בתחילה, ${formatKg(last.kg)} ק"ג עכשיו, יעד ${formatKg(goalKg)} ק"ג`}
          points={shown.map((point) => ({ time: point.time, value: point.kg }))}
          startTime={start}
          endTime={now}
          minValue={minValue}
          maxValue={maxValue}
          ticks={ticks}
          goal={goalKg}
          goalLabel={`יעד ${formatKg(goalKg).replace('.0', '')}`}
          xLabels={buildXLabels(start, now)}
          formatValue={(value) => `${formatKg(value)} ק"ג`}
          formatDate={(time) =>
            new Date(time).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })
          }
        />
      </View>
      <SegmentedToggle options={RANGE_OPTIONS} value={range} onChange={setRange} />
      <Banner text={buildBanner(points, isExample)} />
    </CardShell>
  );
};

const styles = StyleSheet.create({
  chart: {
    marginBottom: theme.spacing.sm,
  },
});
